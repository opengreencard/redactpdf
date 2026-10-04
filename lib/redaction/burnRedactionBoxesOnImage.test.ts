import sharp from 'sharp';
import { burnRedactionBoxesOnImage } from './burnRedactionBoxesOnImage';

describe(burnRedactionBoxesOnImage, () => {
  it('fills a normalized box with black pixels', async () => {
    const source = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    })
      .jpeg()
      .toBuffer();

    const burned = await burnRedactionBoxesOnImage(source, [
      { minX: 0.1, minY: 0.2, maxX: 0.4, maxY: 0.5 },
    ]);

    const { data } = await sharp(burned)
      .raw()
      .toBuffer({ resolveWithObject: true });
    // Center of the box should be burned black.
    const x = 25;
    const y = 35;
    const offset = (y * 100 + x) * 3;
    expect(data[offset]).toBe(0);
    expect(data[offset + 1]).toBe(0);
    expect(data[offset + 2]).toBe(0);
    // A pixel outside the box stays white.
    const outsideOffset = (10 * 100 + 80) * 3;
    expect(data[outsideOffset]).toBeGreaterThan(250);
  });
});
