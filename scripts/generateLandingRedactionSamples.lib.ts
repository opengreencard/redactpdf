import { promises as fs } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { burnRedactionBoxesOnImage } from '../lib/redaction/burnRedactionBoxesOnImage';
import { TestRedactionBoundingBoxes } from '../lib/redaction/__testData__/RedactionBoundingBoxes';
import type { BoundingBox } from '../lib/redaction/redactionTypes';
import { promiseAllThrottled } from '../lib/utilities/promiseAllThrottled';

interface GenerateLandingRedactionSamplesOptions {
  outputDirectory: string;
  fixturesDirectory: string;
}

interface GeneratedLandingSample {
  fileName: string;
  width: number;
  height: number;
}

/**
 * Write the public before/after JPEGs for the landing-page sample cards.
 *
 * Dutch boxes come from the recorded vision response for
 * `dutchPassportSpecimen.jpg` (0–1000 model coords, divided by 1000). IRS
 * uses `TestRedactionBoundingBoxes.irs1040Scenario2` and is cropped to the
 * Dutch passport's width/height ratio so the two cards match. The 1040 is
 * a bit wider, so we keep the full height and trim the sides.
 *
 * Keep in sync with `dutchPassportSample` and `irs1040Sample` in
 * `landingRedactionSamples.ts`. After we write new JPEGs, copy the printed
 * width/height into those objects.
 */
export async function generateLandingRedactionSamples({
  outputDirectory,
  fixturesDirectory,
}: GenerateLandingRedactionSamplesOptions): Promise<GeneratedLandingSample[]> {
  await fs.mkdir(outputDirectory, { recursive: true });

  const dutchSource = await fs.readFile(
    path.join(fixturesDirectory, 'dutchPassportSpecimen.jpg')
  );
  const dutchAfter = await burnRedactionBoxesOnImage(
    dutchSource,
    dutchPassportBoxes
  );
  const irsSource = await fs.readFile(
    path.join(fixturesDirectory, 'irs1040Scenario2.jpg')
  );
  const irsAfterFull = await burnRedactionBoxesOnImage(
    irsSource,
    TestRedactionBoundingBoxes.irs1040Scenario2.map((box) => box.box)
  );
  const dutchMetadata = await sharp(dutchSource).metadata();
  if (!dutchMetadata.width || !dutchMetadata.height) {
    throw new Error('The Dutch passport sample is missing image dimensions.');
  }
  // Same width/height ratio as the passport so the two cards line up.
  const passportAspect = dutchMetadata.width / dutchMetadata.height;
  const irsBefore = await cropToAspect(irsSource, passportAspect);
  const irsAfter = await cropToAspect(irsAfterFull, passportAspect);

  const files: { fileName: string; bytes: Uint8Array }[] = [
    { fileName: 'dutch-passport-before.jpg', bytes: dutchSource },
    { fileName: 'dutch-passport-after.jpg', bytes: dutchAfter },
    { fileName: 'irs1040-before.jpg', bytes: irsBefore },
    { fileName: 'irs1040-after.jpg', bytes: irsAfter },
  ];

  return promiseAllThrottled(
    files.map((file) => async (): Promise<GeneratedLandingSample> => {
      const outputPath = path.join(outputDirectory, file.fileName);
      await fs.writeFile(outputPath, file.bytes);
      const metadata = await sharp(file.bytes).metadata();
      if (!metadata.width || !metadata.height) {
        throw new Error(`${file.fileName} is missing image dimensions.`);
      }
      const generated: GeneratedLandingSample = {
        fileName: file.fileName,
        width: metadata.width,
        height: metadata.height,
      };
      return generated;
    }),
    4
  );
}

/**
 * Center-crop so the result has `targetAspect` (width / height).
 *
 * A letter 1040 is wider than a passport, so we keep the full height and
 * trim the left and right margins.
 */
async function cropToAspect(
  image: Uint8Array,
  targetAspect: number
): Promise<Uint8Array> {
  const metadata = await sharp(image).metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error('The image to crop does not have image dimensions.');
  }
  const { width, height } = metadata;
  const currentAspect = width / height;
  let left = 0;
  let top = 0;
  let cropWidth = width;
  let cropHeight = height;
  if (currentAspect > targetAspect) {
    cropWidth = Math.round(height * targetAspect);
    left = Math.round((width - cropWidth) / 2);
  } else if (currentAspect < targetAspect) {
    cropHeight = Math.round(width / targetAspect);
    top = Math.round((height - cropHeight) / 2);
  }
  return sharp(image)
    .extract({ left, top, width: cropWidth, height: cropHeight })
    .jpeg({ quality: 85, progressive: false })
    .toBuffer();
}

// Keep in sync with the recorded Gemini boxes in
// `lib/ai/__mocks__/__testData__/createOpenAICompatibleCompletion/createOpenAICompatibleCompletion/getRedactionBoundingBoxes.test.ts-5b304f96_gemini_82b7fd22.json`.
const dutchPassportBoxes: BoundingBox[] = [
  { minX: 0.877, minY: 0.098, maxX: 0.944, maxY: 0.427 },
  { minX: 0.052, minY: 0.569, maxX: 0.31, maxY: 0.804 },
  { minX: 0.724, minY: 0.569, maxX: 0.836, maxY: 0.585 },
  { minX: 0.33, minY: 0.597, maxX: 0.477, maxY: 0.631 },
  { minX: 0.331, minY: 0.642, maxX: 0.51, maxY: 0.657 },
  { minX: 0.331, minY: 0.668, maxX: 0.552, maxY: 0.684 },
  { minX: 0.331, minY: 0.698, maxX: 0.439, maxY: 0.715 },
  { minX: 0.621, minY: 0.663, maxX: 0.742, maxY: 0.77 },
  { minX: 0.331, minY: 0.753, maxX: 0.536, maxY: 0.768 },
  { minX: 0.75, minY: 0.753, maxX: 0.955, maxY: 0.768 },
  { minX: 0.335, minY: 0.797, maxX: 0.585, maxY: 0.835 },
  { minX: 0.068, minY: 0.882, maxX: 0.928, maxY: 0.898 },
  { minX: 0.068, minY: 0.915, maxX: 0.926, maxY: 0.932 },
];
