import { PDFDocument } from '@cantoo/pdf-lib';
import { putObject } from '../../../lib/storage/storageAPI';
import Redaction, { redactionKeyLength } from '../../../lib/models/Redaction';
import { RedactionStatus } from '../../../lib/models/redactionTypes';
import { getRedactionFile } from '../../../lib/storage/storageFunctions/redactionFile';
import { processRedaction } from './lib/processRedaction';
import {
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

  beforeAll(async () => {
    [onePagePDF, tooManyPagesPDF] = await Promise.all([
      makePDFBuffer(1),
      makePDFBuffer(_maxRedactionPageCount + 1),
    ]);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('stores a valid PDF and creates a redacting row', async () => {
    const result = await uploadFileForRedaction({ buffer: onePagePDF });

    expect(result.key).toHaveLength(redactionKeyLength);
    expect(result.pageCount).toBe(1);

    const redaction = await Redaction.findOne({
      where: { key: result.key },
    });
    expect(redaction).not.toBeNull();
    expect(redaction?.status).toBe(RedactionStatus.redacting);
    expect(redaction?.redactionBoundingBoxes).toEqual([]);
    const storedPDF = await getRedactionFile(result.key);
    expect(storedPDF).toEqual(onePagePDF);
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
 * Using pdf-lib keeps the test independent from checked-in binary fixtures:
 * each page is an empty page because upload validation only needs the PDF
 * structure and page count.
 */
async function makePDFBuffer(pageCount: number): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  for (let page = 0; page < pageCount; page += 1) {
    pdf.addPage();
  }
  return Buffer.from(await pdf.save());
}

/**
 * Create a valid PDF whose page tree has no pages.
 *
 * @cantoo/pdf-lib serializes `PDFDocument.create()` with no explicit pages as
 * one page when saving, so the regular helper cannot exercise the zero-page
 * validation. This minimal PDF object graph keeps `/Count 0` while remaining
 * loadable by the same library used by the application. The catalog, page-tree,
 * cross-reference, and trailer layout follows the minimal-PDF examples at
 * https://stackoverflow.com/questions/12662596/minimal-pdf-example-in-pdf-specification
 * and https://pdfa.org/the-smallest-possible-valid-pdf/. An empty `/Kids` array
 * is intentionally used here to test the parser's zero-page behavior; it is
 * not a fully conforming PDF page tree.
 */
function makeZeroPagePDFBuffer(): Buffer {
  return Buffer.from(
    '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [] /Count 0 >>\nendobj\nxref\n0 3\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\ntrailer\n<< /Size 3 /Root 1 0 R >>\nstartxref\n105\n%%EOF'
  );
}
