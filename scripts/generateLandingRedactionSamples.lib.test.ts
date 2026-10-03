import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { generateLandingRedactionSamples } from './generateLandingRedactionSamples.lib';

describe(generateLandingRedactionSamples, () => {
  it('writes cropped IRS samples and full Dutch passport samples', async () => {
    const outputDirectory = await fs.mkdtemp(
      path.join(os.tmpdir(), 'landing-redaction-samples-')
    );
    const generated = await generateLandingRedactionSamples({
      outputDirectory,
      fixturesDirectory: path.join(__dirname, '../lib/redaction/__testData__'),
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
    // The 1040 crop should be a short header strip, not a full letter page.
    expect(irsBefore.height).toBeLessThan(irsBefore.width);
    expect(irsBefore.height).toBeLessThan(dutchBefore.height);

    const afterBytes = await fs.readFile(
      path.join(outputDirectory, 'irs1040-after.jpg')
    );
    const { data, info } = await sharp(afterBytes)
      .raw()
      .toBuffer({ resolveWithObject: true });
    // A pixel inside the SSN field on the cropped header should be black.
    const ssnX = Math.round(info.width * 0.86);
    const ssnY = Math.round(info.height * 0.2);
    const offset = (ssnY * info.width + ssnX) * info.channels;
    expect(data[offset]).toBe(0);
    expect(data[offset + 1]).toBe(0);
    expect(data[offset + 2]).toBe(0);
  }, 30000);
});
