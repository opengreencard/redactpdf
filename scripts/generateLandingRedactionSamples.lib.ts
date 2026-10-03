import { promises as fs } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { burnRedactionBoxesOnImage } from '../lib/redaction/burnRedactionBoxesOnImage';
import { TestRedactionBoundingBoxes } from '../lib/redaction/__testData__/RedactionBoundingBoxes';
import { promiseAllThrottled } from '../lib/utilities/promiseAllThrottled';

interface GenerateLandingRedactionSamplesOptions {
  outputDirectory: string;
  fixturesDirectory: string;
}

interface GeneratedLandingSample {
  fileName: string;
  width: number;
  height: number;
  jpegBytes: number;
  pngBytes: number;
}

/**
 * Write the public before/after images for the landing-page sample cards.
 *
 * Dutch boxes come from `TestRedactionBoundingBoxes.dutchPassportSpecimen`.
 * IRS uses `TestRedactionBoundingBoxes.irs1040Scenario2` and is cropped to
 * the Dutch passport's width/height ratio so the two cards match. The 1040
 * is a bit wider, so we keep the full height and trim the sides.
 *
 * Each still is then fit inside `maxLandingSampleEdgePx` and encoded as
 * both JPEG 85 (mozjpeg) and PNG; we keep whichever file is smaller.
 *
 * Keep in sync with:
 * - `dutchPassportSample` in `landingRedactionSamples.ts`
 * - `irs1040Sample` in `landingRedactionSamples.ts`
 *
 * After we write new files, copy the printed width/height and file names
 * into those objects.
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

  const files: { baseName: string; bytes: Uint8Array }[] = [
    { baseName: 'dutch-passport-before', bytes: dutchSource },
    { baseName: 'dutch-passport-after', bytes: dutchAfter },
    { baseName: 'irs1040-before', bytes: irsBefore },
    { baseName: 'irs1040-after', bytes: irsAfter },
  ];

  return promiseAllThrottled(
    files.map((file) => async (): Promise<GeneratedLandingSample> => {
      const encoded = await resizeAndCompressLandingSample(file.bytes);
      const fileName = `${file.baseName}.${encoded.extension}`;
      const outputPath = path.join(outputDirectory, fileName);
      const otherExtension = encoded.extension === 'jpg' ? 'png' : 'jpg';
      // Drop the losing format so we don't leave a stale jpg next to a png.
      await fs.rm(
        path.join(outputDirectory, `${file.baseName}.${otherExtension}`),
        { force: true }
      );
      await fs.writeFile(outputPath, encoded.bytes);
      const generated: GeneratedLandingSample = {
        fileName,
        width: encoded.width,
        height: encoded.height,
        jpegBytes: encoded.jpegBytes,
        pngBytes: encoded.pngBytes,
      };
      return generated;
    }),
    4
  );
}

/**
 * Fit inside `maxLandingSampleEdgePx`, then pick the smaller of JPEG 85
 * and PNG.
 *
 * Photos usually win as JPEG. A sparse form can win as PNG, so we encode
 * both and keep the smaller file. mozjpeg is the same encoder ImageOptim
 * uses for "JPEG 85%".
 *
 * @see https://github.com/ImageOptim/ImageOptim
 */
async function resizeAndCompressLandingSample(image: Uint8Array): Promise<{
  bytes: Uint8Array;
  extension: 'jpg' | 'png';
  width: number;
  height: number;
  jpegBytes: number;
  pngBytes: number;
}> {
  const resized = sharp(image)
    .rotate()
    .resize(maxLandingSampleEdgePx, maxLandingSampleEdgePx, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  // `metadata()` ignores resize, so we read dimensions from the encoded
  // buffer. https://github.com/lovell/sharp/issues/157
  const [jpeg, png] = await Promise.all([
    resized
      .clone()
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer({ resolveWithObject: true }),
    resized.clone().png({ compressionLevel: 9 }).toBuffer({
      resolveWithObject: true,
    }),
  ]);

  const usePNG = png.data.length < jpeg.data.length;
  const info = usePNG ? png.info : jpeg.info;
  return {
    bytes: usePNG ? png.data : jpeg.data,
    extension: usePNG ? 'png' : 'jpg',
    width: info.width,
    height: info.height,
    jpegBytes: jpeg.data.length,
    pngBytes: png.data.length,
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
