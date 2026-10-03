import { promises as fs } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { burnRedactionBoxesOnImage } from '../lib/redaction/burnRedactionBoxesOnImage';
import { TestRedactionBoundingBoxes } from '../lib/redaction/__testData__/RedactionBoundingBoxes';
import type { BoundingBox } from '../lib/redaction/redactionTypes';
import { promiseAllThrottled } from '../lib/utilities/promiseAllThrottled';

export interface GenerateLandingRedactionSamplesOptions {
  outputDirectory: string;
  fixturesDirectory: string;
}

export interface GeneratedLandingSample {
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
 * identity header so the card is closer to the passport's size.
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
  const irsBefore = await cropNormalized(irsSource, irs1040IdentityCrop);
  const irsAfter = await cropNormalized(irsAfterFull, irs1040IdentityCrop);

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

async function cropNormalized(
  image: Uint8Array,
  crop: BoundingBox
): Promise<Uint8Array> {
  const metadata = await sharp(image).metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error('The image to crop does not have image dimensions.');
  }
  const left = Math.round(crop.minX * metadata.width);
  const top = Math.round(crop.minY * metadata.height);
  const width = Math.round((crop.maxX - crop.minX) * metadata.width);
  const height = Math.round((crop.maxY - crop.minY) * metadata.height);
  return sharp(image)
    .extract({ left, top, width, height })
    .jpeg({ quality: 85, progressive: false })
    .toBuffer();
}

// Tight crop around the 1040 name / SSN / address block so the card is
// closer to the Dutch passport's visual size.
const irs1040IdentityCrop: BoundingBox = {
  minX: 0.02,
  minY: 0.08,
  maxX: 0.98,
  maxY: 0.27,
};

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
