import { RedactionStatus } from '../../../../../lib/models/redactionTypes';
import { deleteRedactionBoundingBox } from './deleteRedactionBoundingBox';
import { _makeMixedRedactedRedaction } from './mutateRedactionBoundingBoxesTestCommon';
import ClientFakeData from '../../../../../lib/testUtilities/ClientFakeData';
import FakeData from '../../../../../lib/testUtilities/FakeData';

describe(deleteRedactionBoundingBox, () => {
  it('removes a manual box and leaves the automatic box', async () => {
    const { redaction, autoBox, manualBox } =
      await _makeMixedRedactedRedaction();

    const result = await deleteRedactionBoundingBox({
      key: redaction.key,
      page: manualBox.page,
      box: manualBox.box,
      type: 'manual',
    });

    if (result.status !== RedactionStatus.redacted) {
      throw new Error('Expected a redacted response');
    }
    expect(result.redactionBoundingBoxes).toEqual([autoBox]);
  });

  it('removes an automatic box and leaves the manual box', async () => {
    const { redaction, autoBox, manualBox } =
      await _makeMixedRedactedRedaction();

    const result = await deleteRedactionBoundingBox({
      key: redaction.key,
      page: autoBox.page,
      box: autoBox.box,
      type: 'automatic',
    });

    if (result.status !== RedactionStatus.redacted) {
      throw new Error('Expected a redacted response');
    }
    expect(result.redactionBoundingBoxes).toEqual([manualBox]);
  });

  it('throws a 404 ApplicationError for an unknown box', async () => {
    const { redaction } = await _makeMixedRedactedRedaction();

    await expect(
      deleteRedactionBoundingBox({
        key: redaction.key,
        page: 1,
        box: ClientFakeData.makeBoundingBox({ minX: 0.9, maxX: 1 }),
        type: 'automatic',
      })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws a 404 ApplicationError for an unknown key', async () => {
    await expect(
      deleteRedactionBoundingBox({
        key: 'unknown-redaction-key',
        page: 1,
        box: ClientFakeData.makeBoundingBox(),
        type: 'manual',
      })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('rejects delete while redacting', async () => {
    const redaction = await FakeData.makeDBRedaction({
      status: RedactionStatus.redacting,
    });

    await expect(
      deleteRedactionBoundingBox({
        key: redaction.key,
        page: 1,
        box: ClientFakeData.makeBoundingBox(),
        type: 'manual',
      })
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});
