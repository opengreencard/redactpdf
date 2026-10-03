import { type RedactionBoundingBox } from '../../lib/redaction/redactionTypes';
import type { RedactedGetRedactionResponse } from '../../lib/redaction/redactionAPI';
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
    const disabled = setBoundingBoxesEnabledInResponse({
      current: makeResponse(boxes),
      boxes,
      enabled: false,
    }).redactionBoundingBoxes;

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
