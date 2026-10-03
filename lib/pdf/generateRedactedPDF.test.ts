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

  // One enabled page and one skipped page cover flatten-vs-copy. Extra
  // boxes or real IRS coordinates do not change that path: any enabled
  // box rasterizes the whole page.
  it('returns a PDF that keeps page count and skips disabled boxes', async () => {
    const result = await generateRedactedPDF({
      pdf: sourcePDF,
      redactionBoundingBoxes: [
        // Default coordinates are enough. We only care that page 1 is
        // enabled and page 2 is not.
        ClientFakeData.makeAutoRedactionBoundingBox({
          page: 1,
          enabled: true,
        }),
        ClientFakeData.makeAutoRedactionBoundingBox({
          page: 2,
          enabled: false,
        }),
      ],
    });

    const [pageSizes, pageTexts] = await Promise.all([
      getPDFPageSizes(result),
      extractPageTexts(result),
    ]);
    // The output still has both source pages.
    expect(pageSizes).toHaveLength(2);
    // Page 1 was flattened, so the cover-sheet SSN cannot be copied.
    expect(pageTexts[0]).not.toContain('400-00-1038');
    // Page 2 had only a disabled box, so its text layer stays.
    expect(pageTexts[1]).toContain('Form 1040');
  }, 30000);

  // Flatten-vs-copy is covered above. This case burns the recorded 1040
  // boxes so we know the real SSN and address strings are gone.
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
    // Page 1 had no enabled boxes, so its cover-sheet text stays.
    expect(pageTexts[0]).toContain('Sean John');
    // Page 2 was flattened, so the 1040 PII cannot be copied.
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
