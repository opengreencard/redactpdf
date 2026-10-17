import { promises as fs } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { promiseAllThrottled } from '../utilities/promiseAllThrottled';
import { getPDFPageSizes } from './getPDFPageSizes';
import { type PDFPageImage, processPDFPagesInBatches } from './pdfToImage';

describe(processPDFPagesInBatches, () => {
  it('renders previews at 150 DPI and reports page sizes in points', async () => {
    const pdf = await fs.readFile(
      path.join(
        __dirname,
        '../redaction/__testData__/irs1040Scenario2First2Pages.pdf'
      )
    );
    const pageSizes = await getPDFPageSizes(pdf);
    const images: PDFPageImage[] = [];

    await processPDFPagesInBatches(pdf, async (image) => {
      images.push(image);
    });

    expect(images.map((image) => image.page)).toEqual([1, 2]);
    await promiseAllThrottled(
      images.map(({ page, png, pageSize }) => async () => {
        const { width, height } = pageSizes[page - 1];
        // Layout size stays in points so the review UI's zoom is unchanged.
        expect(pageSize).toEqual({
          width: Math.round(width),
          height: Math.round(height),
        });
        // The stored image is the 150 DPI raster: 150/72 times the point size.
        const metadata = await sharp(png).metadata();
        expect(metadata.width).toBe(Math.round((width * 150) / 72));
        expect(metadata.height).toBe(Math.round((height * 150) / 72));
      }),
      4
    );
  }, 60000);
});
