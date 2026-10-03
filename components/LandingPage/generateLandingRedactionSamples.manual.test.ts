import { promises as fs } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { burnRedactionBoxesOnImage } from '../../lib/redaction/burnRedactionBoxesOnImage';
import { TestRedactionBoundingBoxes } from '../../lib/redaction/__testData__/RedactionBoundingBoxes';
import { describeManualTest } from '../../lib/testUtilities/testTypes';
import { promiseAllThrottled } from '../../lib/utilities/promiseAllThrottled';
import { dutchPassportSample, irs1040Sample } from './landingRedactionSamples';

describeManualTest(() => {
  /**
   * Regenerates `public/samples` and checks the stills. Run with:
   * `yarn manual-jest components/LandingPage/generateLandingRedactionSamples.manual.test.ts`
   */
  it('writes cropped IRS samples and full Dutch passport JPEGs', async () => {
    const workspaceRoot = path.join(__dirname, '../..');
    const generated = await generateLandingRedactionSamples({
      outputDirectory: path.join(workspaceRoot, 'public/samples'),
      fixturesDirectory: path.join(workspaceRoot, 'lib/redaction/__testData__'),
    });

    expect(generated.map((sample) => sample.fileName)).toEqual([
      'dutch-passport-before.jpg',
      'dutch-passport-after.jpg',
      'irs1040-before.jpg',
      'irs1040-after.jpg',
    ]);

    const irsBefore = generated.find(
      (sample) => sample.fileName === 'irs1040-before.jpg'
    );
    const dutchBefore = generated.find(
      (sample) => sample.fileName === 'dutch-passport-before.jpg'
    );
    if (!irsBefore || !dutchBefore) {
      throw new Error('Expected both before samples to be generated.');
    }
    // The 1040 is cropped to the passport ratio, then both are fit inside
    // 1280px. Integer resize can shift the ratio by one pixel.
    expect(irsBefore.width / irsBefore.height).toBeCloseTo(
      dutchBefore.width / dutchBefore.height,
      2
    );
    // Both cards must fit inside the 1280px public-still budget.
    expect(Math.max(irsBefore.width, irsBefore.height)).toBeLessThanOrEqual(
      maxLandingSampleEdgePx
    );
    expect(Math.max(dutchBefore.width, dutchBefore.height)).toBeLessThanOrEqual(
      maxLandingSampleEdgePx
    );
    expect(dutchBefore.width).toBe(dutchPassportSample.width);
    expect(dutchBefore.height).toBe(dutchPassportSample.height);
    expect(irsBefore.width).toBe(irs1040Sample.width);
    expect(irsBefore.height).toBe(irs1040Sample.height);

    const irsAfter = generated.find(
      (sample) => sample.fileName === 'irs1040-after.jpg'
    );
    if (!irsAfter) {
      throw new Error('Expected the IRS after sample to be generated.');
    }
    const afterBytes = await fs.readFile(
      path.join(workspaceRoot, 'public/samples', irsAfter.fileName)
    );
    const { data, info } = await sharp(afterBytes)
      .raw()
      .toBuffer({ resolveWithObject: true });
    // A pixel inside the SSN field on the cropped page should be black.
    const ssnX = Math.round(info.width * 0.88);
    const ssnY = Math.round(info.height * 0.12);
    const offset = (ssnY * info.width + ssnX) * info.channels;
    expect(data[offset]).toBe(0);
    expect(data[offset + 1]).toBe(0);
    expect(data[offset + 2]).toBe(0);
  }, 30000);
});

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
 * Dutch boxes come from `TestRedactionBoundingBoxes.dutchPassportSpecimen`.
 * IRS uses `TestRedactionBoundingBoxes.irs1040Scenario2` and is cropped to
 * the Dutch passport's width/height ratio so the two cards match. The 1040
 * is a bit wider, so we keep the full height and trim the sides.
 *
 * Each still is then fit inside `maxLandingSampleEdgePx` and encoded as
 * JPEG 85 (mozjpeg). That's the same encoder ImageOptim uses for "JPEG 85%".
 *
 * Keep in sync with:
 * - `dutchPassportSample` in `landingRedactionSamples.ts`
 * - `irs1040Sample` in `landingRedactionSamples.ts`
 *
 * After we write new files, copy the printed width/height into those objects.
 *
 * @see https://github.com/ImageOptim/ImageOptim
 */
async function generateLandingRedactionSamples({
  outputDirectory,
  fixturesDirectory,
}: GenerateLandingRedactionSamplesOptions): Promise<GeneratedLandingSample[]> {
  await fs.mkdir(outputDirectory, { recursive: true });

  const dutchSource = await fs.readFile(
    path.join(fixturesDirectory, 'dutchPassportSpecimen.jpg')
  );
  const dutchAfter = await burnRedactionBoxesOnImage(
    dutchSource,
    TestRedactionBoundingBoxes.dutchPassportSpecimen.map((box) => box.box)
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
      const encoded = await resizeAndCompressLandingSample(file.bytes);
      await fs.writeFile(
        path.join(outputDirectory, file.fileName),
        encoded.bytes
      );
      const generated: GeneratedLandingSample = {
        fileName: file.fileName,
        width: encoded.width,
        height: encoded.height,
      };
      return generated;
    }),
    4
  );
}

/**
 * Fit inside `maxLandingSampleEdgePx`, then encode JPEG 85 with mozjpeg.
 */
async function resizeAndCompressLandingSample(image: Uint8Array): Promise<{
  bytes: Uint8Array;
  width: number;
  height: number;
}> {
  // `metadata()` ignores resize, so we read dimensions from the encoded
  // buffer. https://github.com/lovell/sharp/issues/157
  const jpeg = await sharp(image)
    .rotate()
    .resize(maxLandingSampleEdgePx, maxLandingSampleEdgePx, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer({ resolveWithObject: true });
  return {
    bytes: jpeg.data,
    width: jpeg.info.width,
    height: jpeg.info.height,
  };
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
    .toBuffer();
}

// Keep in sync with `landingRedactionSamples.test.ts`.
const maxLandingSampleEdgePx = 1280;
