import { promises as fs } from 'node:fs';
import path from 'node:path';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { TestRedactionBoundingBoxes } from '../redaction/__testData__/RedactionBoundingBoxes';
import type { AutoRedactionBoundingBox } from '../redaction/redactionTypes';
import ClientFakeData from '../testUtilities/ClientFakeData';
import { promiseAllThrottled } from '../utilities/promiseAllThrottled';
import { generateRedactedPDF } from './generateRedactedPDF';
import { getPDFPageSizes } from './getPDFPageSizes';

describe(generateRedactedPDF, () => {
  let sourcePDF: Buffer;

  beforeAll(async () => {
    sourcePDF = await fs.readFile(
      path.join(
        __dirname,
        '../redaction/__testData__/irs1040Scenario2First2Pages.pdf'
      )
    );
  }, 30000);

  it('returns a PDF that keeps page count and skips disabled boxes', async () => {
    const result = await generateRedactedPDF({
      pdf: sourcePDF,
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

    expect(await getPDFPageSizes(result)).toHaveLength(2);
    expect(result.length).toBeGreaterThan(0);
    const pageTexts = await extractPageTexts(result);
    // Page 1 was flattened, so the cover-sheet SSN cannot be copied.
    expect(pageTexts[0]).not.toContain('400-00-1038');
    // Page 2 had only a disabled box, so its text layer stays.
    expect(pageTexts[1]).toContain('Form 1040');
  }, 30000);

  it('removes selectable text on pages with enabled boxes', async () => {
    const result = await generateRedactedPDF({
      pdf: sourcePDF,
      redactionBoundingBoxes: TestRedactionBoundingBoxes.irs1040Scenario2.map(
        (box): AutoRedactionBoundingBox => ({
          ...box,
          page: 2,
        })
      ),
    });

    const pageTexts = await extractPageTexts(result);
    expect(pageTexts[0]).toContain('Sean John');
    expect(pageTexts[1]).not.toContain('400 00 1038');
    expect(pageTexts[1]).not.toContain('Joan');
    expect(pageTexts[1]).not.toContain('26 Dancing Daisy');
    // Flattening the 1040 page also drops labels on that page.
    expect(pageTexts[1]).not.toContain('Form 1040');
  }, 30000);
});

async function extractPageTexts(pdf: Uint8Array): Promise<string[]> {
  const document = await getDocument({
    data: Uint8Array.from(pdf),
  }).promise;
  try {
    return await promiseAllThrottled(
      Array.from({ length: document.numPages }, (_, index) => async () => {
        const page = await document.getPage(index + 1);
        const textContent = await page.getTextContent();
        return textContent.items
          .map((item) => ('str' in item ? item.str : ''))
          .filter((str) => str.trim().length > 0)
          .join(' ');
      }),
      4
    );
  } finally {
    await document.destroy();
  }
}
