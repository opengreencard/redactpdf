import FakeData from '../../../../lib/testUtilities/FakeData';
import { RedactionStatus } from '../../../../lib/models/redactionTypes';
import {
  assertIsRedactedOrThrowApplicationError,
  findRedactionByKeyOrError,
} from './findRedactionByKeyOrError';

describe(findRedactionByKeyOrError, () => {
  it('returns the selected columns for a known key', async () => {
    const created = await FakeData.makeDBRedaction({
      pageCount: 3,
      status: RedactionStatus.redacting,
    });

    const redaction = await findRedactionByKeyOrError({
      key: created.key,
      attributes: ['status', 'pageCount'],
    });

    expect(redaction.status).toBe(RedactionStatus.redacting);
    expect(redaction.pageCount).toBe(3);
  });

  it('throws a 404 ApplicationError for an unknown key', async () => {
    await expect(
      findRedactionByKeyOrError({
        key: 'unknown-redaction-key',
        attributes: ['status'],
      })
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe(assertIsRedactedOrThrowApplicationError, () => {
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
    { status: RedactionStatus.redacted, message: null },
  ])('$status', ({ status, message }) => {
    let thrownMessage: string | null = null;
    try {
      assertIsRedactedOrThrowApplicationError({ status });
    } catch (err) {
      thrownMessage = err instanceof Error ? err.message : String(err);
    }
    expect(thrownMessage).toBe(message);
  });
});
