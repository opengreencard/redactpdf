import { promises as fs } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { promiseAllThrottled } from '../../lib/utilities/promiseAllThrottled';
import { dutchPassportSample, irs1040Sample } from './landingRedactionSamples';

// Keep in sync with `generateLandingRedactionSamples.lib.ts`.
const maxLandingSampleEdgePx = 1280;

describe('landing redaction samples', () => {
  it.each([dutchPassportSample, irs1040Sample])(
    'keeps $title stills inside 1280px and matching the card size',
    async (sample) => {
      const stills = [sample.beforeSrc, sample.afterSrc];
      await promiseAllThrottled(
        stills.map((src) => async () => {
          const imagePath = path.join(
            __dirname,
            '../../public',
            src.replace(/^\//, '')
          );
          await fs.access(imagePath);
          const metadata = await sharp(imagePath).metadata();
          expect(metadata.width).toBe(sample.width);
          expect(metadata.height).toBe(sample.height);
          expect(metadata.width).toBeLessThanOrEqual(maxLandingSampleEdgePx);
          expect(metadata.height).toBeLessThanOrEqual(maxLandingSampleEdgePx);
        }),
        2
      );
    }
  );
});
