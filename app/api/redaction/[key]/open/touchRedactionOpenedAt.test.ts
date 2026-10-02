import MockDate from 'mockdate';
import FakeData from '../../../../../lib/testUtilities/FakeData';
import Redaction, {
  RedactionAttributes,
} from '../../../../../lib/models/Redaction';
import { PartialInstance } from '../../../../../lib/db/types';
import { RedactionStatus } from '../../../../../lib/models/redactionTypes';
import { touchRedactionOpenedAt } from './touchRedactionOpenedAt';

describe(touchRedactionOpenedAt, () => {
  afterEach(async () => {
    MockDate.reset();
    await Redaction.truncate();
  });

  it('throws a 404 ApplicationError for an unknown key', async () => {
    await expect(
      touchRedactionOpenedAt({ key: 'unknown-redaction-key' })
    ).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('sets openedAt to now without changing other fields', async () => {
    const staleOpenedAt = new Date('2026-01-14T22:00:00.000Z');
    const redaction = await FakeData.makeDBRedaction({
      openedAt: staleOpenedAt,
      status: RedactionStatus.redacted,
    });
    MockDate.set('2026-01-15T00:00:00.000Z');

    const result = await touchRedactionOpenedAt({ key: redaction.key });

    expect(result).toEqual({});

    const updated = (await Redaction.findOne({
      where: { key: redaction.key },
      attributes: ['openedAt', 'status', 'redactionBoundingBoxes'],
    })) as PartialInstance<
      RedactionAttributes,
      'openedAt' | 'status' | 'redactionBoundingBoxes'
    > | null;
    expect(updated).not.toBeNull();
    expect(updated?.openedAt).toEqual(new Date('2026-01-15T00:00:00.000Z'));
    expect(updated?.status).toBe(RedactionStatus.redacted);
    expect(updated?.redactionBoundingBoxes).toEqual([]);
  });
});
