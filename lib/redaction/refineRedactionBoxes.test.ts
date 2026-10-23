import { promises as fs } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { askTypeSafeBox } from '../typesafe/askTypeSafeBox';
import { refineRedactionBoxes } from './refineRedactionBoxes';
import {
  RedactedDataType,
  RedactionBoundingBoxType,
  type SinglePageRedactionBoundingBox,
} from './redactionTypes';

const approximateNameBox: SinglePageRedactionBoundingBox = {
  type: RedactionBoundingBoxType.automatic,
  dataType: RedactedDataType.personName,
  text: 'Jane Doe',
  // Loose box around "Jane Doe" in the address block at the top of the page.
  box: { minX: 0.04, minY: 0.05, maxX: 0.15, maxY: 0.085 },
  enabled: true,
};

describe(refineRedactionBoxes, () => {
  let previewJPEG: Uint8Array;

  beforeAll(async () => {
    const previewPNG = await fs.readFile(
      path.join(__dirname, '__testData__', 'syntheticCoverLetterFirstPage.png')
    );
    previewJPEG = await sharp(previewPNG).jpeg().toBuffer();
  }, 30000);

  it('replaces an approximate box with the box Jev finds on the page', async () => {
    const { boxes, refinedCount } = await refineRedactionBoxes({
      previewJPEG,
      boxes: [approximateNameBox],
      debugSink: null,
    });

    expect(refinedCount).toBe(1);
    expect(boxes[0]).toMatchObject({ text: 'Jane Doe' });
    expect(boxes[0].box).not.toEqual(approximateNameBox.box);
  }, 120000);

  it('keeps the approximate box when the Box call fails', async () => {
    // The logged error is expected here. Silence it so the test output stays
    // readable.
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    jest
      .mocked(askTypeSafeBox)
      .mockRejectedValueOnce(new Error('TypeSafe unavailable'));

    const { boxes, keptApproximateCount } = await refineRedactionBoxes({
      previewJPEG,
      boxes: [approximateNameBox],
      debugSink: null,
    });
    consoleError.mockRestore();

    expect(keptApproximateCount).toBe(1);
    expect(boxes).toEqual([approximateNameBox]);
  });
});
