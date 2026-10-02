import { promises as fs } from 'node:fs';
import path from 'node:path';
import { verify } from 'scrubzero';
import { getDocument, OPS } from 'pdfjs-dist/legacy/build/pdf.mjs';
import ClientFakeData from '../testUtilities/ClientFakeData';
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
  });

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
  });

  it('maps normalized top-left boxes to the same top-left PDF coordinates', async () => {
    const result = await generateRedactedPDF({
      pdf: sourcePDF,
      redactionBoundingBoxes: [
        ClientFakeData.makeAutoRedactionBoundingBox({
          page: 1,
          box: { minX: 0, minY: 0, maxX: 1, maxY: 0.2 },
        }),
      ],
    });

    const output = await getDocument({
      data: Uint8Array.from(result),
    }).promise;
    try {
      const outputPage = await output.getPage(1);
      const operatorList = await outputPage.getOperatorList();
      const pathIndex = operatorList.fnArray.findIndex(
        (operator) => operator === OPS.constructPath
      );
      expect(pathIndex).toBeGreaterThanOrEqual(0);

      const pathArguments = operatorList.argsArray[pathIndex];
      const rectangleBounds = pathArguments[2];
      // pdfjs reports the rendered path in viewport coordinates, whose origin
      // is top-left. The rectangle must therefore start above the midpoint.
      expect(rectangleBounds[1]).toBeLessThan(792 / 2);
    } finally {
      await output.destroy();
    }
  });

  it('removes text covered by an enabled redaction box', async () => {
    const result = await generateRedactedPDF({
      pdf: sourcePDF,
      redactionBoundingBoxes: [
        ClientFakeData.makeAutoRedactionBoundingBox({
          page: 1,
          box: { minX: 0, minY: 0, maxX: 1, maxY: 1 },
        }),
      ],
    });

    const verification = await verify(Uint8Array.from(result).buffer);
    expect(verification.clean).toBe(true);
    expect(verification.violations).toHaveLength(0);
  });
});
