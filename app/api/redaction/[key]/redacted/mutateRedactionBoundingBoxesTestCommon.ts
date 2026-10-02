import ClientFakeData from '../../../../../lib/testUtilities/ClientFakeData';
import FakeData from '../../../../../lib/testUtilities/FakeData';
import type { RedactionInstance } from '../../../../../lib/models/Redaction';
import {
  AutoRedactionBoundingBox,
  ManualRedactionBoundingBox,
  RedactionStatus,
} from '../../../../../lib/models/redactionTypes';

/** Finished two-page redaction with one automatic and one manual box. */
export async function _makeMixedRedactedRedaction(): Promise<{
  redaction: RedactionInstance;
  autoBox: AutoRedactionBoundingBox;
  manualBox: ManualRedactionBoundingBox;
}> {
  const autoBox: AutoRedactionBoundingBox =
    ClientFakeData.makeAutoRedactionBoundingBox({ page: 1 });
  const manualBox: ManualRedactionBoundingBox =
    ClientFakeData.makeManualRedactionBoundingBox({ page: 2 });
  const redaction = await FakeData.makeDBRedaction({
    pageCount: 2,
    status: RedactionStatus.redacted,
    redactionBoundingBoxes: [autoBox, manualBox],
  });
  return { redaction, autoBox, manualBox };
}
