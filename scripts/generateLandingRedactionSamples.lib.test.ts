import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { describeManualTest } from '../lib/testUtilities/testTypes';
import { generateLandingRedactionSamples } from './generateLandingRedactionSamples.lib';

describeManualTest(() => {
  describe(generateLandingRedactionSamples, () => {
    it('writes cropped IRS samples and full Dutch passport samples', async () => {
      const outputDirectory = await fs.mkdtemp(
        path.join(os.tmpdir(), 'landing-redaction-samples-')
      );
      const generated = await generateLandingRedactionSamples({
        outputDirectory,
        fixturesDirectory: path.join(
          __dirname,
          '../lib/redaction/__testData__'
        ),
      });

      // One before/after pair for each landing card, JPEG or PNG.
      expect(generated.map((sample) => sample.fileName)).toEqual([
        expect.stringMatching(/^dutch-passport-before\.(jpg|png)$/),
        expect.stringMatching(/^dutch-passport-after\.(jpg|png)$/),
        expect.stringMatching(/^irs1040-before\.(jpg|png)$/),
        expect.stringMatching(/^irs1040-after\.(jpg|png)$/),
      ]);

      const irsBefore = generated.find((sample) =>
        sample.fileName.startsWith('irs1040-before.')
      );
      const dutchBefore = generated.find((sample) =>
        sample.fileName.startsWith('dutch-passport-before.')
      );
      if (!irsBefore || !dutchBefore) {
        throw new Error('Expected both before samples to be generated.');
      }
      // The 1040 is cropped to the passport's width/height ratio.
      expect(irsBefore.width / irsBefore.height).toBeCloseTo(
        dutchBefore.width / dutchBefore.height,
        3
      );
      // Both cards must fit inside the 1280px public-still budget.
      expect(Math.max(irsBefore.width, irsBefore.height)).toBeLessThanOrEqual(
        1280
      );
      expect(
        Math.max(dutchBefore.width, dutchBefore.height)
      ).toBeLessThanOrEqual(1280);

      const irsAfter = generated.find((sample) =>
        sample.fileName.startsWith('irs1040-after.')
      );
      if (!irsAfter) {
        throw new Error('Expected the IRS after sample to be generated.');
      }
      const afterBytes = await fs.readFile(
        path.join(outputDirectory, irsAfter.fileName)
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
});
