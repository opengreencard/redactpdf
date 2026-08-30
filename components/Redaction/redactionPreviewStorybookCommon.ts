import irsPage from '../../lib/redaction/__testData__/irs1040Scenario2.jpg';
import passportPage from '../../lib/redaction/__testData__/usPassportCardSpecimen.jpg';
import { TestRedactionBoundingBoxes } from '../../lib/redaction/__testData__/RedactionBoundingBoxes';
import type {
  PageSize,
  RedactedGetRedactionResponse,
  RedactionBoundingBox,
  SinglePageRedactionBoundingBox,
} from '../../lib/models/redactionTypes';
import ClientFakeData from '../../lib/testUtilities/ClientFakeData';

/**
 * Shared Storybook fixtures for RedactionPreview and RedactionPreviewPages.
 * Boxes come from {@link TestRedactionBoundingBoxes}; page 3 reuses the IRS
 * detections because it shows the same form image.
 */

/** Raster sizes of the IRS / passport / IRS story pages. */
export const storybookPreviewPageSizes: PageSize[] = [
  { width: 1275, height: 1650 },
  { width: 1020, height: 645 },
  { width: 1275, height: 1650 },
];

export const storybookPreviewRedactionBoundingBoxes: RedactionBoundingBox[] = [
  ...withPage(1, TestRedactionBoundingBoxes.irs1040Scenario2),
  ...withPage(2, TestRedactionBoundingBoxes.usPassportCardSpecimen),
  ...withPage(3, TestRedactionBoundingBoxes.irs1040Scenario2),
];

export function getStorybookRedactionImageUrl({
  page,
}: {
  page: number;
}): string {
  return page === 2 ? passportPage.src : irsPage.src;
}

export function makeStorybookRedactedResponse(
  options: {
    redactionBoundingBoxes?: RedactionBoundingBox[];
  } = {}
): RedactedGetRedactionResponse {
  return ClientFakeData.makeRedactedGetRedactionResponse({
    pageSizes: storybookPreviewPageSizes,
    redactionBoundingBoxes:
      options.redactionBoundingBoxes ?? storybookPreviewRedactionBoundingBoxes,
  });
}

function withPage(
  page: number,
  boxes: SinglePageRedactionBoundingBox[]
): RedactionBoundingBox[] {
  return boxes.map((box): RedactionBoundingBox => ({
    ...box,
    page,
  }));
}
