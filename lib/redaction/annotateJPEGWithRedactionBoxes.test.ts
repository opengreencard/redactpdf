import sharp from 'sharp';
import {
  RedactedDataType,
  type AutoRedactionBoundingBox,
} from '../models/redactionTypes';
import { annotateJPEGWithRedactionBoxes } from './annotateJPEGWithRedactionBoxes';

describe(annotateJPEGWithRedactionBoxes, () => {
  it('returns a JPEG with the original dimensions', async () => {
    const sourceJPEG: Buffer = await sharp({
      create: {
        width: 100,
        height: 80,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    })
      .jpeg()
      .toBuffer();
    const boxes: Omit<AutoRedactionBoundingBox, 'page'>[] = [
      {
        type: 'automatic',
        dataType: RedactedDataType.email,
        text: 'person@example.com',
        box: { minX: 0.1, minY: 0.2, maxX: 0.4, maxY: 0.5 },
        enabled: true,
      },
    ];

    const annotatedJPEG = await annotateJPEGWithRedactionBoxes(
      sourceJPEG,
      boxes
    );
    const metadata = await sharp(annotatedJPEG).metadata();

    expect(metadata.format).toBe('jpeg');
    expect(metadata.width).toBe(100);
    expect(metadata.height).toBe(80);
  });
});
