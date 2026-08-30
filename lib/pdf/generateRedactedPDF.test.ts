import { PDFDocument } from '@cantoo/pdf-lib';
import { verify } from 'scrubzero';
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

  it('removes text covered by an enabled redaction box', async () => {
    const source = await PDFDocument.create();
    const page = source.addPage([612, 792]);
    const sensitiveText = 'Sensitive text';
    page.drawText(sensitiveText, { x: 100, y: 700, size: 24 });
    const sourcePDF = Buffer.from(await source.save());
    // pdf-lib encodes drawn text as compressed/hex data, so append a PDF
    // comment marker for the byte-level assertion; verify() checks the text
    // layer itself.
    const pdf = Buffer.concat([
      sourcePDF,
      Buffer.from(`\n% ${sensitiveText}\n`),
    ]);
    expect(pdf.includes(sensitiveText)).toBe(true);

    const result = await generateRedactedPDF({
      pdf,
      redactionBoundingBoxes: [
        ClientFakeData.makeAutoRedactionBoundingBox({
          page: 1,
          box: { minX: 0.1, minY: 0.1, maxX: 0.4, maxY: 0.2 },
        }),
      ],
    });

    expect(result.includes(sensitiveText)).toBe(false);
    const verification = await verify(Uint8Array.from(result).buffer);
    expect(verification.clean).toBe(true);
    expect(verification.violations).toHaveLength(0);
  });
});
