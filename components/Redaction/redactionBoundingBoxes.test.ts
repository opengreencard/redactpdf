import {
  type RedactedGetRedactionResponse,
  type RedactionBoundingBox,
} from '../../lib/models/redactionTypes';
import ClientFakeData from '../../lib/testUtilities/ClientFakeData';
import {
  addBoundingBoxesToResponse,
  removeBoundingBoxesFromResponse,
  setBoundingBoxesEnabledInResponse,
} from './redactionBoundingBoxes';

describe(addBoundingBoxesToResponse, () => {
  it('adds multiple manual boxes at once', () => {
    const current = makeResponse([]);
    const boxes = [
      ClientFakeData.makeManualRedactionBoundingBox(),
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
    expect(
      removeBoundingBoxesFromResponse(makeResponse(boxes), boxes)
        .redactionBoundingBoxes
    ).toEqual([]);
  });
});

describe(setBoundingBoxesEnabledInResponse, () => {
  it('sets every requested box to the given enabled flag', () => {
    const disabled = setBoundingBoxesEnabledInResponse(
      makeResponse(boxes),
      boxes,
      false
    ).redactionBoundingBoxes;

    expect(disabled.every((box) => !box.enabled)).toBe(true);
  });
});

const boxes: RedactionBoundingBox[] = [
  ClientFakeData.makeAutoRedactionBoundingBox(),
  ClientFakeData.makeManualRedactionBoundingBox({ page: 2 }),
];

function makeResponse(
  redactionBoundingBoxes: RedactionBoundingBox[]
): RedactedGetRedactionResponse {
  return ClientFakeData.makeRedactedGetRedactionResponse({
    redactionBoundingBoxes,
  });
}
