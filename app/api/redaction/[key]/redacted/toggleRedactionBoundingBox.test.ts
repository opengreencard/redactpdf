import ClientFakeData from '../../../../../lib/testUtilities/ClientFakeData';
import FakeData from '../../../../../lib/testUtilities/FakeData';
import { RedactionStatus } from '../../../../../lib/models/redactionTypes';
import { toggleRedactionBoundingBox } from './toggleRedactionBoundingBox';

describe(toggleRedactionBoundingBox, () => {
  it('flips an automatic box false then true', async () => {
    const autoBox = ClientFakeData.makeAutoRedactionBoundingBox({
      page: 1,
      enabled: true,
    });
    const manualBox = ClientFakeData.makeManualRedactionBoundingBox({
      page: 2,
      enabled: true,
    });
    const redaction = await FakeData.makeDBRedaction({
      pageCount: 2,
      status: RedactionStatus.redacted,
      redactionBoundingBoxes: [autoBox, manualBox],
    });

    const first = await toggleRedactionBoundingBox({
      key: redaction.key,
      page: autoBox.page,
      box: autoBox.box,
      type: 'automatic',
    });
    const second = await toggleRedactionBoundingBox({
      key: redaction.key,
      page: autoBox.page,
      box: autoBox.box,
      type: 'automatic',
    });

    if (first.status !== RedactionStatus.redacted) {
      throw new Error('Expected a redacted response');
    }
    if (second.status !== RedactionStatus.redacted) {
      throw new Error('Expected a redacted response');
    }
    expect(first.redactionBoundingBoxes[0]?.enabled).toBe(false);
    expect(first.redactionBoundingBoxes[1]?.enabled).toBe(true);
    expect(second.redactionBoundingBoxes[0]?.enabled).toBe(true);
    expect(second.redactionBoundingBoxes[1]?.enabled).toBe(true);
  });

  it('flips a manual box false then true', async () => {
    const manualBox = ClientFakeData.makeManualRedactionBoundingBox({
      page: 1,
      enabled: true,
    });
    const redaction = await FakeData.makeDBRedaction({
      status: RedactionStatus.redacted,
      redactionBoundingBoxes: [manualBox],
    });

    const first = await toggleRedactionBoundingBox({
      key: redaction.key,
      page: manualBox.page,
      box: manualBox.box,
      type: 'manual',
    });
    const second = await toggleRedactionBoundingBox({
      key: redaction.key,
      page: manualBox.page,
      box: manualBox.box,
      type: 'manual',
    });

    if (first.status !== RedactionStatus.redacted) {
      throw new Error('Expected a redacted response');
    }
    if (second.status !== RedactionStatus.redacted) {
      throw new Error('Expected a redacted response');
    }
    expect(first.redactionBoundingBoxes[0]?.enabled).toBe(false);
    expect(second.redactionBoundingBoxes[0]?.enabled).toBe(true);
  });

  it('throws a 404 ApplicationError for an unknown box', async () => {
    const autoBox = ClientFakeData.makeAutoRedactionBoundingBox({ page: 1 });
    const redaction = await FakeData.makeDBRedaction({
      status: RedactionStatus.redacted,
      redactionBoundingBoxes: [autoBox],
    });

    await expect(
      toggleRedactionBoundingBox({
        key: redaction.key,
        page: 1,
        box: ClientFakeData.makeBoundingBox({ minX: 0.9, maxX: 1 }),
        type: 'automatic',
      })
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});
