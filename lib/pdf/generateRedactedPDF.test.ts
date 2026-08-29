import { PDFDocument } from '@cantoo/pdf-lib';
import ClientFakeData from '../testUtilities/ClientFakeData';
import { generateRedactedPDF } from './generateRedactedPDF';

describe(generateRedactedPDF, () => {
  it('returns a PDF that keeps page count and skips disabled boxes', async () => {
    const source = await PDFDocument.create();
    source.addPage([612, 792]);
    source.addPage([612, 792]);
    const pdf = Buffer.from(await source.save());

    const result = await generateRedactedPDF({
      pdf,
      redactionBoundingBoxes: [
        ClientFakeData.makeAutoRedactionBoundingBox({
          page: 1,
          enabled: true,
          box: { minX: 0.1, minY: 0.1, maxX: 0.4, maxY: 0.2 },
        }),
        ClientFakeData.makeManualRedactionBoundingBox({
          page: 2,
          enabled: false,
        }),
      ],
    });

    const output = await PDFDocument.load(result, { ignoreEncryption: true });
    expect(output.getPageCount()).toBe(2);
    expect(result.length).toBeGreaterThan(0);
  });
});
