import ClientFakeData from '../../../../../lib/testUtilities/ClientFakeData';
import FakeData from '../../../../../lib/testUtilities/FakeData';
import { putRedactionFile } from '../../../../../lib/storage/storageFunctions/redactionFile';
import { generateRedactedPDF } from '../../../../../lib/pdf/generateRedactedPDF';
import { RedactionStatus } from '../../../../../lib/redaction/redactionTypes';
import { generateRedactedPDFForKey } from './generateRedactedPDFForKey';

// The PDF transformation itself is covered by
// lib/pdf/generateRedactedPDF.test.ts.
// PDF generation is slow, so this suite focuses on document lookup, storage
// access, status gating, and raw response data.
jest.mock('../../../../../lib/pdf/generateRedactedPDF', () => {
  const actualModule = jest.requireActual(
    '../../../../../lib/pdf/generateRedactedPDF'
  );
  return {
    ...actualModule,
    generateRedactedPDF: jest.fn(),
  };
});
describe(generateRedactedPDFForKey, () => {
  const sourcePDF = Buffer.from('source PDF');
  const generatedPDF = Buffer.from('generated PDF');

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(generateRedactedPDF).mockReset();
    jest.mocked(generateRedactedPDF).mockResolvedValue(generatedPDF);
  });

  it('throws a 404 ApplicationError for an unknown key', async () => {
    await expect(
      generateRedactedPDFForKey({ key: 'unknown-redaction-key' })
    ).rejects.toMatchObject({ statusCode: 404 });

    expect(generateRedactedPDF).not.toHaveBeenCalled();
  });

  it.each([
    {
      status: RedactionStatus.redacting,
      message:
        'This redaction is still being processed. Please try again later.',
    },
    {
      status: RedactionStatus.error,
      message: 'This redaction encountered an error and is not ready.',
    },
  ])('throws 409 when status is $status', async ({ status, message }) => {
    const redaction = await FakeData.makeDBRedaction({ status });

    await expect(
      generateRedactedPDFForKey({ key: redaction.key })
    ).rejects.toMatchObject({ statusCode: 409, message });

    expect(generateRedactedPDF).not.toHaveBeenCalled();
  });

  it('returns the generated PDF with download headers', async () => {
    const redactionBoundingBox = ClientFakeData.makeAutoRedactionBoundingBox();
    const redaction = await FakeData.makeDBRedaction({
      status: RedactionStatus.redacted,
      redactionBoundingBoxes: [redactionBoundingBox],
    });
    await putRedactionFile(sourcePDF, 'application/pdf', redaction.key);

    const result = await generateRedactedPDFForKey({ key: redaction.key });

    expect(result).toEqual({
      contentType: 'application/pdf',
      response: generatedPDF,
      additionalHeaders: {
        'Content-Disposition': 'attachment; filename="redacted.pdf"',
      },
    });
    expect(generateRedactedPDF).toHaveBeenCalledWith({
      pdf: sourcePDF,
      redactionBoundingBoxes: [redactionBoundingBox],
    });
  });
});
