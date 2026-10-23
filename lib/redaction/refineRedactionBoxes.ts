import { sumBy } from 'lodash';
import PQueue from 'p-queue';
import sharp from 'sharp';
import {
  askTypeSafeBox,
  type TypeSafeBoxAnswer,
} from '../typesafe/askTypeSafeBox';
import {
  type CropWindow,
  getRedactionCropWindow,
  isCropBoxTouchingEdge,
  mapCropBoxToPage,
} from './redactionBoxCrop';
import type {
  BoundingBox,
  SinglePageRedactionBoundingBox,
} from './redactionTypes';

/**
 * Box requests in flight at once, per server process. Pages already run in
 * parallel, so this caps the total Box calls a pod makes.
 */
const typeSafeQueue = new PQueue({ concurrency: 16 });

/**
 * Padding on each side of a refined box, as a fraction of the page. Redaction
 * should cover slightly too much rather than too little.
 */
const refinedBoxPaddingFraction = 0.005;

/** Refined boxes for one page, plus counts for logs and evaluation. */
export interface RefineRedactionBoxesResult {
  /** Same length and order as the input. */
  boxes: SinglePageRedactionBoundingBox[];
  refinedCount: number;
  /** Boxes that kept the approximate position, either by choice or failure. */
  keptApproximateCount: number;
  /** Sum of reported input tokens. Reports without usage count as zero. */
  inputTokens: number;
}

/**
 * Replace each approximate box with a tight box from Jev, one crop per box.
 *
 * Never throws for a single box. A box keeps its approximate position when the
 * crop can't be made, the Box call fails, or the answer doesn't overlap the
 * approximate box.
 */
export async function refineRedactionBoxes({
  previewJPEG,
  boxes,
  debugSink,
}: {
  /** The page at preview resolution. Crops come from this image. */
  previewJPEG: Uint8Array;
  boxes: SinglePageRedactionBoundingBox[];
  /** Called with each Box request. Pass null outside debugging. */
  debugSink: ((event: BoxRequestDebugEvent) => Promise<void>) | null;
}): Promise<RefineRedactionBoxesResult> {
  const metadata = await sharp(previewJPEG).metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error('Could not read the preview image size.');
  }
  const page: PageSize = { width: metadata.width, height: metadata.height };

  // `addAll` returns results in input order and shares the process-wide queue.
  const refinements = await typeSafeQueue.addAll(
    boxes.map(
      (box, index) => (): Promise<BoxRefinement> =>
        refineBox({
          previewJPEG,
          page,
          box,
          boxNumber: index + 1,
          debugSink,
        })
    )
  );

  return {
    boxes: refinements.map((refinement) => refinement.box),
    refinedCount: refinements.filter((refinement) => refinement.refined).length,
    keptApproximateCount: refinements.filter(
      (refinement) => !refinement.refined
    ).length,
    inputTokens: sumBy(refinements, (refinement) => refinement.inputTokens),
  };
}

/**
 * TEMPORARY debug hook for inspecting Box crops. Remove once the crops are
 * reviewed.
 */
interface BoxRequestDebugEvent {
  /** 1-based position of the box in the input, same as the annotation number. */
  boxNumber: number;
  /** `retry` is the second request with more padding after an edge hit. */
  attempt: 'first' | 'retry';
  approximateBox: SinglePageRedactionBoundingBox;
  window: CropWindow;
  /** The JPEG bytes sent to Box. */
  crop: Uint8Array;
  answer: TypeSafeBoxAnswer;
}

interface PageSize {
  width: number;
  height: number;
}

interface BoxRefinement {
  box: SinglePageRedactionBoundingBox;
  refined: boolean;
  inputTokens: number;
}

interface CropAttempt {
  answer: TypeSafeBoxAnswer;
  /** The Box answer mapped onto the whole page. */
  box: BoundingBox;
}

/**
 * Refine one box. Logs and keeps the approximate box on any failure, so one
 * bad crop doesn't affect the rest of the page.
 */
async function refineBox({
  previewJPEG,
  page,
  box,
  boxNumber,
  debugSink,
}: {
  previewJPEG: Uint8Array;
  page: PageSize;
  box: SinglePageRedactionBoundingBox;
  boxNumber: number;
  debugSink: ((event: BoxRequestDebugEvent) => Promise<void>) | null;
}): Promise<BoxRefinement> {
  const keepApproximate: BoxRefinement = {
    box,
    refined: false,
    inputTokens: 0,
  };
  try {
    const firstAttempt = await askInCrop({
      previewJPEG,
      page,
      box,
      paddingScale: 1,
      boxNumber,
      attempt: 'first',
      debugSink,
    });
    if (!firstAttempt) return keepApproximate;

    // A box that touches the crop edge may continue past it. Retry once with
    // more padding. If that fails, use the first answer.
    const finalAttempt = isCropBoxTouchingEdge(firstAttempt.answer.box)
      ? ((await askInCrop({
          previewJPEG,
          page,
          box,
          paddingScale: 2,
          boxNumber,
          attempt: 'retry',
          debugSink,
        })) ?? firstAttempt)
      : firstAttempt;

    return {
      box: {
        ...box,
        box: padBoxWithinPage(finalAttempt.box),
      },
      refined: true,
      inputTokens: finalAttempt.answer.inputTokens ?? 0,
    };
  } catch (error) {
    // eslint-disable-next-line no-console -- Box failures are useful operational diagnostics
    console.error('Could not refine a redaction box with Jev.', error);
    return keepApproximate;
  }
}

/**
 * Crop around the approximate box, ask Jev for the target, and map the answer
 * onto the page. Returns null when the crop can't be made or the answer doesn't
 * overlap the approximate box.
 */
async function askInCrop({
  previewJPEG,
  page,
  box,
  paddingScale,
  boxNumber,
  attempt,
  debugSink,
}: {
  previewJPEG: Uint8Array;
  page: PageSize;
  box: SinglePageRedactionBoundingBox;
  paddingScale: number;
  boxNumber: number;
  attempt: 'first' | 'retry';
  debugSink: ((event: BoxRequestDebugEvent) => Promise<void>) | null;
}): Promise<CropAttempt | null> {
  const window = getRedactionCropWindow({
    box: box.box,
    pageWidth: page.width,
    pageHeight: page.height,
    paddingScale,
  });
  if (!window) return null;

  // Box needs both sides at least 280 px, so thin crops are scaled up. `fill`
  // keeps the exact size we computed, so the box's shape is kept.
  const crop = await sharp(previewJPEG)
    .extract(window)
    .resize({
      width: window.outputWidth,
      height: window.outputHeight,
      fit: 'fill',
    })
    .jpeg({ quality: 90 })
    .toBuffer();
  // The crop is centered on the approximate box, so "nearest the center" picks
  // the match we meant when the same text appears more than once.
  const answer = await askTypeSafeBox({
    crop,
    instructions: `the text "${box.text}" nearest the center of \`crop\``,
  });

  if (debugSink) {
    await debugSink({
      boxNumber,
      attempt,
      approximateBox: box,
      window,
      crop,
      answer,
    });
  }

  const { left, right, top, bottom } = answer.box;
  if (left >= right || top >= bottom) return null;

  const mappedBox = mapCropBoxToPage({
    cropBox: answer.box,
    window,
    pageWidth: page.width,
    pageHeight: page.height,
  });
  if (!overlaps(mappedBox, box.box)) return null;

  return { answer, box: mappedBox };
}

/** Whether two normalized boxes share any area. */
function overlaps(first: BoundingBox, second: BoundingBox): boolean {
  return (
    first.minX < second.maxX &&
    first.maxX > second.minX &&
    first.minY < second.maxY &&
    first.maxY > second.minY
  );
}

/** Grow a refined box a little and keep it inside the page. */
function padBoxWithinPage(box: BoundingBox): BoundingBox {
  return {
    minX: Math.max(0, box.minX - refinedBoxPaddingFraction),
    minY: Math.max(0, box.minY - refinedBoxPaddingFraction),
    maxX: Math.min(1, box.maxX + refinedBoxPaddingFraction),
    maxY: Math.min(1, box.maxY + refinedBoxPaddingFraction),
  };
}
