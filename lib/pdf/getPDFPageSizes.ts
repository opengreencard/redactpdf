import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { PageSize } from './pdfTypes';

/** Read each PDF page's dimensions using the parser used for page counting. */
export async function getPDFPageSizes(pdf: Uint8Array): Promise<PageSize[]> {
  const doc = await getDocument({
    data: Uint8Array.from(pdf),
  }).promise;

  try {
    return await Promise.all(
      Array.from(
        { length: doc.numPages },
        async (_, pageIndex): Promise<PageSize> => {
          const page = await doc.getPage(pageIndex + 1);
          const viewport = page.getViewport({ scale: 1, rotation: 0 });
          return { width: viewport.width, height: viewport.height };
        }
      )
    );
  } finally {
    await doc.destroy();
  }
}
