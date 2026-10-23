import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { mean } from 'lodash';
import sharp from 'sharp';
import type { PageSize } from '../pdf/pdfTypes';
import { getPDFPageSizes } from '../pdf/getPDFPageSizes';
import { compressImage, rasterizePDFPages } from '../pdf/pdfToImage';
import type {
  OpenAICompatibleCompletionResult,
  OpenAICompatibleCompletionTiming,
} from '../ai/createOpenAICompatibleCompletion';
import { describeManualTest } from '../testUtilities/testTypes';
import type {
  BoundingBox,
  SinglePageRedactionBoundingBox,
} from './redactionTypes';
import {
  annotateJPEGWithRedactionBoxes,
  type RedactionBoxToAnnotate,
} from './annotateJPEGWithRedactionBoxes';
import { getRedactionBoundingBoxes } from './getRedactionBoundingBoxes';
import { refineRedactionBoxes } from './refineRedactionBoxes';

// Each run must call the live model. The global mock would replay one recorded
// response for all identical requests, which hides run-to-run variance.
jest.unmock('../ai/createOpenAICompatibleCompletion');
// Keep the rendered page out of the recorded mock folder, since it is a
// private document.
jest.unmock('../pdf/pdfRenderer');
// Box refinement must also call the live API, so the Box stage is measured
// on each run rather than on a replayed answer.
jest.unmock('../typesafe/askTypeSafeBox');

describeManualTest(() => {
  /**
   * Run the first page through live Gemini and Box refinement several times.
   * Save each run's boxes drawn on the page as PNGs, then check that expected
   * details are redacted in almost every run and shared amounts are never
   * redacted.
   *
   * Example:
   * `REDACTION_INPUT_PATH=~/Documents/cover-letter.pdf
   * REDACTION_EXPECTATIONS_PATH=~/Documents/cover-letter-expectations.json
   * yarn manual-jest lib/redaction/getRedactionBoundingBoxesRepeatability.manual.test.ts`
   *
   * `REDACTION_INPUT_PATH` can also be a 150 DPI page PNG, such as
   * `lib/redaction/__testData__/syntheticCoverLetterFirstPage.png`.
   *
   * Keep the expectations file outside the repo. It describes a private
   * document. Its shape is `RedactionExpectations`.
   *
   * Set `REDACTION_OUTPUT_DIR` to override the default
   * `~/Downloads/<input-name>-bounding-box-runs` folder. Set
   * `REDACTION_RUN_COUNT` to change the number of runs (default 10).
   */
  it('saves annotated PNGs and checks expected redactions for live runs of the first page', async () => {
    const testOnlyGeminiAPIKey = 'test-only-gemini-key';
    if (
      !process.env.GEMINI_API_KEY ||
      process.env.GEMINI_API_KEY === testOnlyGeminiAPIKey
    ) {
      console.warn(
        'Skipping test. Add a real GEMINI_API_KEY to .env.test, then run: REDACTION_INPUT_PATH=file.pdf REDACTION_EXPECTATIONS_PATH=expectations.json yarn manual-jest lib/redaction/getRedactionBoundingBoxesRepeatability.manual.test.ts'
      );
      return;
    }

    const inputPathValue = process.env.REDACTION_INPUT_PATH;
    const expectationsPathValue = process.env.REDACTION_EXPECTATIONS_PATH;
    if (!inputPathValue || !expectationsPathValue) {
      console.warn(
        'Skipping test. To run, run: REDACTION_INPUT_PATH=file.pdf REDACTION_EXPECTATIONS_PATH=expectations.json yarn manual-jest lib/redaction/getRedactionBoundingBoxesRepeatability.manual.test.ts'
      );
      return;
    }

    const runCount = Number(process.env.REDACTION_RUN_COUNT ?? 10);
    if (!Number.isInteger(runCount) || runCount < 1) {
      throw new Error('REDACTION_RUN_COUNT must be a positive integer.');
    }
    // Almost always, not always: 90% of runs, so 9 of 10. Small runs need
    // every run to redact the detail.
    const minimumRedactedRuns = Math.ceil(runCount * 0.9);
    // Same DPI as the stored page previews in `pdfToImage.ts`.
    const previewDPI = 150;
    const inputPath = path.resolve(inputPathValue);
    const expectations: RedactionExpectations = JSON.parse(
      await fs.readFile(path.resolve(expectationsPathValue), 'utf8')
    );
    const outputDir = path.resolve(
      process.env.REDACTION_OUTPUT_DIR ??
        path.join(
          os.homedir(),
          'Downloads',
          `${path.basename(inputPath, path.extname(inputPath))}-bounding-box-runs`
        )
    );

    const inputBuffer = await fs.readFile(inputPath);
    let previewPNG: Uint8Array;
    let pageSize: PageSize;
    if (path.extname(inputPath).toLowerCase() === '.png') {
      // A page image already at preview resolution. Its size in points is its
      // pixel size at `previewDPI`.
      const metadata = await sharp(inputBuffer).metadata();
      if (!metadata.width || !metadata.height) {
        throw new Error('The input PNG does not have image dimensions.');
      }
      previewPNG = inputBuffer;
      pageSize = {
        width: Math.round((metadata.width * 72) / previewDPI),
        height: Math.round((metadata.height * 72) / previewDPI),
      };
    } else {
      const [firstPageSize] = await getPDFPageSizes(inputBuffer);
      const rasterized = await rasterizePDFPages(inputBuffer, {
        pageNumbers: [1],
        dpi: previewDPI,
      });
      const firstPagePNG = rasterized.get(1);
      if (!firstPagePNG) {
        throw new Error('The PDF renderer did not return page 1.');
      }
      previewPNG = firstPagePNG;
      pageSize = {
        width: Math.round(firstPageSize.width),
        height: Math.round(firstPageSize.height),
      };
    }

    // Vision input matches production: the page size in points, not the
    // higher-resolution preview. The preview is used for drawing and cropping.
    const visionJPEG = await compressImage({
      pngBuffer: previewPNG,
      size: pageSize,
    });
    const previewJPEG = await compressImage({
      pngBuffer: previewPNG,
      size: {
        width: Math.round((pageSize.width * previewDPI) / 72),
        height: Math.round((pageSize.height * previewDPI) / 72),
      },
    });

    await fs.mkdir(outputDir, { recursive: true });
    const runs = await Promise.all(
      Array.from(
        { length: runCount },
        async (_, runIndex): Promise<RedactionRunSummary> => {
          const runName = String(runIndex + 1).padStart(2, '0');
          const result = await getRedactionBoundingBoxes(visionJPEG);
          const refinement = await refineRedactionBoxes({
            previewJPEG,
            boxes: result.boxes,
            // TEMPORARY: save each Box crop, and a copy with Jev's box drawn.
            debugSink: async ({
              boxNumber,
              attempt,
              approximateBox,
              crop,
              answer,
            }): Promise<void> => {
              const baseName = path.join(
                outputDir,
                `run-${runName}-typesafe-${boxNumber}${attempt === 'retry' ? '-retry' : ''}`
              );
              await fs.writeFile(
                `${baseName}.png`,
                await sharp(crop).png().toBuffer()
              );
              // Jev's answer is relative to the crop, so it's drawn on the crop
              // as-is.
              const annotatedJPEG = await annotateJPEGWithRedactionBoxes(crop, [
                {
                  ...approximateBox,
                  id: boxNumber,
                  box: {
                    minX: answer.box.left,
                    minY: answer.box.top,
                    maxX: answer.box.right,
                    maxY: answer.box.bottom,
                  },
                },
              ]);
              await fs.writeFile(
                `${baseName}.annotated.png`,
                await sharp(annotatedJPEG).png().toBuffer()
              );
            },
          });

          const geminiOutputPath = path.join(outputDir, `run-${runName}.png`);
          const geminiAnnotatedJPEG = await annotateJPEGWithRedactionBoxes(
            previewPNG,
            toAnnotatedBoxes(result.boxes)
          );
          await fs.writeFile(
            geminiOutputPath,
            await sharp(geminiAnnotatedJPEG).png().toBuffer()
          );

          const typeSafeOutputPath = path.join(
            outputDir,
            `run-${runName}-typesafe.png`
          );
          const typeSafeAnnotatedJPEG = await annotateJPEGWithRedactionBoxes(
            previewPNG,
            toAnnotatedBoxes(refinement.boxes)
          );
          await fs.writeFile(
            typeSafeOutputPath,
            await sharp(typeSafeAnnotatedJPEG).png().toBuffer()
          );

          return {
            run: runIndex + 1,
            outputPath: geminiOutputPath,
            typeSafeOutputPath,
            redactionBoxCount: result.boxes.length,
            boxes: result.boxes.map(
              ({ dataType, text }): RedactionBoxSummary => ({ dataType, text })
            ),
            usage: result.response.usage,
            timing: result.response.timing,
            typeSafe: {
              refinedCount: refinement.refinedCount,
              keptApproximateCount: refinement.keptApproximateCount,
              inputTokens: refinement.inputTokens,
              meanIoU: mean(
                result.boxes.map((box, index) =>
                  intersectionOverUnion(box.box, refinement.boxes[index].box)
                )
              ),
              meanAreaRatio: mean(
                result.boxes.map(
                  (box, index) =>
                    boxArea(refinement.boxes[index].box) / boxArea(box.box)
                )
              ),
            },
          };
        }
      )
    );

    // Log before the checks so the per-run metrics show even when one fails.
    console.info(JSON.stringify({ inputPath, outputDir, runs }, null, 2));

    // Every run should find something. A run with no boxes is a failure
    // worth seeing in the summary.
    for (const run of runs) {
      expect(run.redactionBoxCount).toBeGreaterThan(0);
    }

    // Each expected redaction must show up in almost every run. The failure
    // lists only the texts that fell short, with how many runs redacted them.
    const runsMissingRedaction = expectations.mustRedact
      .map((text): [string, number] => [text, countRunsWithText(runs, text)])
      .filter(([, redactedRuns]) => redactedRuns < minimumRedactedRuns);
    expect(runsMissingRedaction).toEqual([]);

    // Shared amounts, such as standard fees, must never be redacted.
    const runsRedactingSharedText = expectations.mustNotRedact
      .map((text): [string, number] => [text, countRunsWithText(runs, text)])
      .filter(([, redactedRuns]) => redactedRuns > 0);
    expect(runsRedactingSharedText).toEqual([]);
  }, 900_000);
});

/** Text expected to be redacted in almost every run, and text never to be redacted. */
interface RedactionExpectations {
  mustRedact: string[];
  mustNotRedact: string[];
}

/** Box type and text the model returned, printed so runs can be compared. */
type RedactionBoxSummary = Pick<
  SinglePageRedactionBoundingBox,
  'dataType' | 'text'
>;

/** Box refinement results for one run, compared with that run's Gemini boxes. */
interface TypeSafeRunSummary {
  refinedCount: number;
  keptApproximateCount: number;
  inputTokens: number;
  /** Mean overlap between each Gemini box and its refined box. 1 is identical. */
  meanIoU: number;
  /** Mean refined area divided by Gemini area. Below 1 means tighter boxes. */
  meanAreaRatio: number;
}

/** Per-run values printed at the end, plus the saved annotated PNGs. */
interface RedactionRunSummary {
  run: number;
  outputPath: string;
  typeSafeOutputPath: string;
  redactionBoxCount: number;
  boxes: RedactionBoxSummary[];
  usage: OpenAICompatibleCompletionResult['usage'];
  timing: OpenAICompatibleCompletionTiming;
  typeSafe: TypeSafeRunSummary;
}

/** Count runs with at least one box whose text contains `text`, ignoring case. */
function countRunsWithText(runs: RedactionRunSummary[], text: string): number {
  const lowerText = text.toLowerCase();
  return runs.filter((run) =>
    run.boxes.some((box) => box.text.toLowerCase().includes(lowerText))
  ).length;
}

/** Number the boxes so each annotation has an ID. */
function toAnnotatedBoxes(
  boxes: SinglePageRedactionBoundingBox[]
): RedactionBoxToAnnotate[] {
  return boxes.map((box, index): RedactionBoxToAnnotate => ({
    ...box,
    id: index + 1,
  }));
}

/** Area of a normalized box. */
function boxArea(box: BoundingBox): number {
  return (box.maxX - box.minX) * (box.maxY - box.minY);
}

/** Overlap area divided by union area of two normalized boxes. */
function intersectionOverUnion(
  first: BoundingBox,
  second: BoundingBox
): number {
  const width = Math.max(
    0,
    Math.min(first.maxX, second.maxX) - Math.max(first.minX, second.minX)
  );
  const height = Math.max(
    0,
    Math.min(first.maxY, second.maxY) - Math.max(first.minY, second.minY)
  );
  const intersection = width * height;
  return intersection / (boxArea(first) + boxArea(second) - intersection);
}
