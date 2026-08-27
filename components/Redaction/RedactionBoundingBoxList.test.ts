import {
  RedactedDataType,
  type RedactionBoundingBox,
} from '../../lib/models/redactionTypes';
import ClientFakeData from '../../lib/testUtilities/ClientFakeData';
import { _groupRedactionBoundingBoxes } from './RedactionBoundingBoxList';

describe(_groupRedactionBoundingBoxes, () => {
  it('groups automatic boxes by type and matched value', () => {
    const boxes: RedactionBoundingBox[] = [
      ClientFakeData.makeAutoRedactionBoundingBox({
        dataType: RedactedDataType.personName,
        text: 'Jane Doe',
        page: 1,
      }),
      ClientFakeData.makeAutoRedactionBoundingBox({
        dataType: RedactedDataType.personName,
        text: 'Jane Doe',
        page: 2,
      }),
      ClientFakeData.makeAutoRedactionBoundingBox({
        dataType: RedactedDataType.address,
        text: '123 Main Street',
      }),
    ];

    expect(_groupRedactionBoundingBoxes(boxes)).toEqual([
      {
        dataType: RedactedDataType.personName,
        values: [
          {
            valueLabel: 'Jane Doe',
            occurrences: [boxes[0], boxes[1]],
          },
        ],
      },
      {
        dataType: RedactedDataType.address,
        values: [
          {
            valueLabel: '123 Main Street',
            occurrences: [boxes[2]],
          },
        ],
      },
    ]);
  });

  it('groups all manual boxes under one value', () => {
    const boxes: RedactionBoundingBox[] = [
      ClientFakeData.makeManualRedactionBoundingBox({ page: 1 }),
      ClientFakeData.makeManualRedactionBoundingBox({ page: 2 }),
    ];

    expect(_groupRedactionBoundingBoxes(boxes)).toEqual([
      {
        dataType: 'manual',
        values: [
          {
            valueLabel: 'Drawn region',
            occurrences: boxes,
          },
        ],
      },
    ]);
  });
});
