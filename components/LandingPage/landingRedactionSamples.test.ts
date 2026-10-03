import path from 'node:path';
import sharp from 'sharp';
import { promiseAllThrottled } from '../../lib/utilities/promiseAllThrottled';
import { dutchPassportSample, irs1040Sample } from './landingRedactionSamples';

// Keep in sync with `generateLandingRedactionSamples.manual.test.ts`.
const maxLandingSampleEdgePx = 1280;

describe('landing redaction samples', () => {
  it.each([dutchPassportSample, irs1040Sample])(
    'keeps $title stills inside 1280px and matching the card size',
    async (sample) => {
      // The card's published size must stay inside the public still budget.
      expect(sample.width).toBeLessThanOrEqual(maxLandingSampleEdgePx);
      expect(sample.height).toBeLessThanOrEqual(maxLandingSampleEdgePx);

      const stills = [sample.beforeSrc, sample.afterSrc];
      await promiseAllThrottled(
        stills.map((src) => async () => {
          const imagePath = path.join(
            __dirname,
            '../../public',
            src.replace(/^\//, '')
          );
          const metadata = await sharp(imagePath).metadata();
          // Each still must exist at the card's published size.
          expect(metadata.width).toBe(sample.width);
          expect(metadata.height).toBe(sample.height);
        }),
        2
      );
    }
  );
});
