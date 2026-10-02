import { RedactionStatus } from '../../../../../lib/models/redactionTypes';
import { toggleRedactionBoundingBox } from './toggleRedactionBoundingBox';
import { _makeMixedRedactedRedaction } from './mutateRedactionBoundingBoxesTestCommon';
import ClientFakeData from '../../../../../lib/testUtilities/ClientFakeData';

describe(toggleRedactionBoundingBox, () => {
  it('flips an automatic box false then true', async () => {
    const { redaction, autoBox } = await _makeMixedRedactedRedaction();

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
    const { redaction, manualBox } = await _makeMixedRedactedRedaction();

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
    expect(first.redactionBoundingBoxes[0]?.enabled).toBe(true);
    expect(first.redactionBoundingBoxes[1]?.enabled).toBe(false);
    expect(second.redactionBoundingBoxes[1]?.enabled).toBe(true);
  });

  it('throws a 404 ApplicationError for an unknown box', async () => {
    const { redaction } = await _makeMixedRedactedRedaction();

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
