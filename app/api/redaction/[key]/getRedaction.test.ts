import { NextRequest } from 'next/server';
import FakeData from '../../../../lib/testUtilities/FakeData';
import ClientFakeData from '../../../../lib/testUtilities/ClientFakeData';
import {
  AutoRedactionBoundingBox,
  RedactionStatus,
} from '../../../../lib/models/redactionTypes';
import { getRedaction } from './getRedaction';
import { GET } from './route';

describe(getRedaction, () => {
  let redactionKey: string;
  let box: AutoRedactionBoundingBox;

  beforeAll(async () => {
    box = ClientFakeData.makeAutoRedactionBoundingBox({
      page: 2,
    });
    const redaction = await FakeData.makeDBRedaction({
      redactionBoundingBoxes: [box],
      status: RedactionStatus.redacted,
    });
    redactionKey = redaction.key;
  });

  it('returns the current redaction state', async () => {
    const result = await getRedaction({ key: redactionKey });

    expect(result).toMatchObject({
      status: RedactionStatus.redacted,
      pageCount: 1,
      redactionBoundingBoxes: [box],
    });
    expect(result.createdAt).toEqual(expect.any(String));
    expect(result.createdAt).not.toBeInstanceOf(Date);
  });

  it('includes Cache-Control: no-store on the GET route response', async () => {
    const request = new NextRequest(
      `http://localhost/api/redaction/${redactionKey}`
    );
    const response = await GET(request, {
      params: Promise.resolve({ key: redactionKey }),
    });

    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.status).toBe(200);
  });

  it('throws a 404 ApplicationError for an unknown key', async () => {
    await expect(
      getRedaction({ key: 'unknown-redaction-key' })
    ).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('omits boxes and page sizes while a redaction is still processing', async () => {
    const redaction = await FakeData.makeDBRedaction({
      status: RedactionStatus.redacting,
    });

    const result = await getRedaction({ key: redaction.key });

    expect(result.status).toBe(RedactionStatus.redacting);
    expect(result).not.toHaveProperty('pageSizes');
    expect(result).not.toHaveProperty('redactionBoundingBoxes');
  });

  it('throws when a redacted row has no page sizes', async () => {
    const redaction = await FakeData.makeDBRedaction({
      status: RedactionStatus.redacted,
      pageSizes: null,
    });

    await expect(getRedaction({ key: redaction.key })).rejects.toThrow(
      'page sizes are unavailable'
    );
  });
});
