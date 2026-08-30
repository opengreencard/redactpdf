import {
  RedactedDataType,
  type RedactedGetRedactionResponse,
  type RedactionBoundingBox,
} from '../../lib/models/redactionTypes';
import ClientFakeData from '../../lib/testUtilities/ClientFakeData';
import {
  addBoundingBoxesToResponse,
  removeBoundingBoxesFromResponse,
  toggleBoundingBoxesInResponse,
} from './redactionBoundingBoxes';

describe(addBoundingBoxesToResponse, () => {
  it('adds multiple manual boxes at once', () => {
    const current = makeResponse([]);
    const boxes = [
      ClientFakeData.makeManualRedactionBoundingBox({ page: 1 }),
      ClientFakeData.makeManualRedactionBoundingBox({
        page: 2,
        box: ClientFakeData.makeBoundingBox({ minX: 0.5, maxX: 0.8 }),
      }),
    ];

    expect(
      addBoundingBoxesToResponse(current, boxes).redactionBoundingBoxes
    ).toEqual(boxes);
  });
});

describe(removeBoundingBoxesFromResponse, () => {
  it('removes every requested box at once', () => {
    const boxes: RedactionBoundingBox[] = [
      ClientFakeData.makeAutoRedactionBoundingBox({
        dataType: RedactedDataType.email,
      }),
      ClientFakeData.makeManualRedactionBoundingBox({ page: 2 }),
    ];

    expect(
      removeBoundingBoxesFromResponse(makeResponse(boxes), boxes)
        .redactionBoundingBoxes
    ).toEqual([]);
  });
});

describe(toggleBoundingBoxesInResponse, () => {
  it('toggles every requested box at once', () => {
    const boxes: RedactionBoundingBox[] = [
      ClientFakeData.makeAutoRedactionBoundingBox({
        dataType: RedactedDataType.email,
      }),
      ClientFakeData.makeManualRedactionBoundingBox({ page: 2 }),
    ];
    const toggled = toggleBoundingBoxesInResponse(
      makeResponse(boxes),
      boxes
    ).redactionBoundingBoxes;

    expect(toggled.every((box) => !box.enabled)).toBe(true);
  });
});

function makeResponse(
  redactionBoundingBoxes: RedactionBoundingBox[]
): RedactedGetRedactionResponse {
  return ClientFakeData.makeRedactedGetRedactionResponse({
    redactionBoundingBoxes,
  });
}
