import { putObject } from '../../../lib/storage/storageAPI';
import { PartialInstance } from '../../../lib/db/types';
import Redaction, {
  RedactionAttributes,
  redactionKeyLength,
} from '../../../lib/models/Redaction';
import { RedactionStatus } from '../../../lib/models/redactionTypes';
import { getRedactionFile } from '../../../lib/storage/storageFunctions/redactionFile';
import { processRedaction } from './lib/processRedaction';
import {
  _getPDFPageCount,
  _maxRedactionFileSizeBytes,
  _maxRedactionPageCount,
  uploadFileForRedaction,
} from './uploadFileForRedaction';

jest.mock('./lib/processRedaction', () => ({
  processRedaction: jest.fn(() => new Promise<void>(() => {})),
}));

describe(uploadFileForRedaction, () => {
  let onePagePDF: Buffer;
  let tooManyPagesPDF: Buffer;

  beforeAll(() => {
    onePagePDF = makePDFBuffer(1);
    tooManyPagesPDF = makePDFBuffer(_maxRedactionPageCount + 1);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('stores a valid PDF and creates a redacting row', async () => {
    const result = await uploadFileForRedaction({ buffer: onePagePDF });

    expect(result.key).toHaveLength(redactionKeyLength);
    expect(result.pageCount).toBe(1);

    const redaction = (await Redaction.findOne({
      where: { key: result.key },
      attributes: ['status', 'redactionBoundingBoxes'],
    })) as PartialInstance<
      RedactionAttributes,
      'status' | 'redactionBoundingBoxes'
    > | null;
    expect(redaction).not.toBeNull();
    expect(redaction?.status).toBe(RedactionStatus.redacting);
    expect(redaction?.redactionBoundingBoxes).toEqual([]);
    const storedPDF = await getRedactionFile(result.key);
    expect(storedPDF).toEqual(onePagePDF);
  });

  it('counts pages in a valid PDF', async () => {
    await expect(_getPDFPageCount(onePagePDF)).resolves.toBe(1);
  });

  it('rejects invalid PDF bytes without side effects', async () => {
    const redactionCountBefore = await Redaction.count();

    await expect(
      uploadFileForRedaction({ buffer: Buffer.from('not a PDF') })
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(await Redaction.count()).toBe(redactionCountBefore);
  });

  it('rejects a PDF with no pages without side effects', async () => {
    const redactionCountBefore = await Redaction.count();
    const emptyPDF = makeZeroPagePDFBuffer();

    await expect(
      uploadFileForRedaction({ buffer: emptyPDF })
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(await Redaction.count()).toBe(redactionCountBefore);
  });

  it('rejects files over 50 MiB before parsing or writing', async () => {
    const redactionCountBefore = await Redaction.count();
    const oversizedBuffer = Buffer.alloc(_maxRedactionFileSizeBytes + 1);

    await expect(
      uploadFileForRedaction({ buffer: oversizedBuffer })
    ).rejects.toMatchObject({ statusCode: 413 });

    expect(await Redaction.count()).toBe(redactionCountBefore);
  });

  it('rejects PDFs with more than 100 pages without side effects', async () => {
    const redactionCountBefore = await Redaction.count();

    await expect(
      uploadFileForRedaction({ buffer: tooManyPagesPDF })
    ).rejects.toMatchObject({ statusCode: 413 });

    expect(await Redaction.count()).toBe(redactionCountBefore);
  });

  it('starts processing without waiting for it to finish', async () => {
    const result = await uploadFileForRedaction({ buffer: onePagePDF });

    expect(result.pageCount).toBe(1);
    expect(processRedaction).toHaveBeenCalledWith(
      expect.objectContaining({ key: result.key }),
      onePagePDF
    );
  });

  it('removes the stored object when row creation fails', async () => {
    jest
      .spyOn(Redaction, 'create')
      .mockRejectedValueOnce(new Error('database unavailable'));

    await expect(
      uploadFileForRedaction({ buffer: onePagePDF })
    ).rejects.toThrow('database unavailable');

    const [putOptions] = jest.mocked(putObject).mock.calls[0];
    const redactionKey = putOptions.key.split('/')[1];
    expect(redactionKey).toHaveLength(redactionKeyLength);
    await expect(getRedactionFile(redactionKey)).rejects.toBeDefined();
  });

  it('removes the row when storage fails', async () => {
    const redactionCountBefore = await Redaction.count();

    jest.mocked(putObject).mockRejectedValue(new Error('storage unavailable'));

    await expect(
      uploadFileForRedaction({ buffer: onePagePDF })
    ).rejects.toThrow('storage unavailable');

    expect(await Redaction.count()).toBe(redactionCountBefore);
  });
});

/**
 * Create a small in-memory PDF with exactly `pageCount` pages.
 *
 * A hand-written PDF keeps the test independent from checked-in binary
 * fixtures: upload validation only needs the PDF structure and page count.
 */
function makePDFBuffer(pageCount: number): Buffer {
  const content = 'BT /F1 24 Tf 100 700 Td (Sensitive text) Tj ET';
  const firstContentObjectNumber = pageCount + 3;
  const fontObjectNumber = 2 * pageCount + 3;
  const pageObjectNumbers = Array.from(
    { length: pageCount },
    (_, pageIndex) => pageIndex + 3
  );
  const contentObjectNumbers = Array.from(
    { length: pageCount },
    (_, pageIndex) => firstContentObjectNumber + pageIndex
  );
  const objects: string[] = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    `<< /Type /Pages /Kids [${pageObjectNumbers
      .map((objectNumber) => `${objectNumber} 0 R`)
      .join(' ')}] /Count ${pageCount} >>`,
    ...pageObjectNumbers.map(
      (objectNumber, pageIndex): string =>
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] ` +
        `/Resources << /Font << /F1 ${fontObjectNumber} 0 R >> >> ` +
        `/Contents ${contentObjectNumbers[pageIndex]} 0 R >>`
    ),
    ...contentObjectNumbers.map(
      (): string =>
        `<< /Length ${Buffer.byteLength(content, 'binary')} >>\nstream\n` +
        `${content}\nendstream`
    ),
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  const offsets: number[] = [0];
  let pdf = '%PDF-1.4\n';

  objects.forEach((object, objectIndex) => {
    offsets.push(Buffer.byteLength(pdf, 'binary'));
    pdf += `${objectIndex + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, 'binary');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (const offset of offsets.slice(1)) {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, 'binary');
}

/**
 * Create a valid PDF whose page tree has no pages.
 *
 * This minimal PDF object graph keeps `/Count 0` while remaining loadable by
 * PDF.js. The catalog, page-tree, cross-reference, and trailer layout follows
 * the minimal-PDF examples at
 * https://stackoverflow.com/questions/12662596/minimal-pdf-example-in-pdf-specification
 * and https://pdfa.org/the-smallest-possible-valid-pdf/. An empty `/Kids`
 * array is intentionally used here to test the parser's zero-page behavior;
 * it is not a fully conforming PDF page tree.
 */
function makeZeroPagePDFBuffer(): Buffer {
  return Buffer.from(
    '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [] /Count 0 >>\nendobj\nxref\n0 3\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\ntrailer\n<< /Size 3 /Root 1 0 R >>\nstartxref\n105\n%%EOF'
  );
}
