import { promises as fs } from 'node:fs';
import path from 'node:path';
// The .delete helper lives next to the mock so cache paths match
// `createOpenAICompatibleCompletion.ts` after stripping `.delete`.
// eslint-disable-next-line jest/no-mocks-import
import { maybeDeleteUnusedOpenAICompatibleCompletionCacheFiles } from '../ai/__mocks__/createOpenAICompatibleCompletion.delete';
import { RedactedDataType } from '../models/redactionTypes';
import {
  annotateJPEGWithRedactionBoxes,
  type RedactionBoxToAnnotate,
} from './annotateJPEGWithRedactionBoxes';
import {
  _combineRedactionBoxes,
  getRedactionBoundingBoxes,
} from './getRedactionBoundingBoxes';

afterAll(async () => {
  await maybeDeleteUnusedOpenAICompatibleCompletionCacheFiles(__filename);
});

interface ExpectedRedaction {
  /**
   * If an array, the `dataType` just needs to be one of the types specified.
   */
  dataType: RedactedDataType | RedactedDataType[];
  text: RegExp;
  count: number;
  /** Some providers may omit this sensitive value despite the expected type. */
  optional?: boolean;
}

interface RedactionImageCase {
  label: string;
  imageFileName: string;
  expectedRedactions: ExpectedRedaction[];
}

describe(getRedactionBoundingBoxes, () => {
  it.each<RedactionImageCase>([
    {
      label: 'Dutch passport specimen',
      imageFileName: 'dutchPassportSpecimen.jpg',
      expectedRedactions: [
        {
          dataType: RedactedDataType.idNumber,
          text: /^SPEC[I1]2014$/i,
          // The passport number appears once horizontally and once vertically.
          count: 2,
        },
        {
          dataType: RedactedDataType.personName,
          text: /De Bruijn.*Molenaar/i,
          count: 1,
        },
        {
          dataType: RedactedDataType.personName,
          text: /Willeke.*Liselotte/i,
          count: 1,
        },
        {
          dataType: RedactedDataType.dateOfBirth,
          text: /10\s+MAA[/-]?MAR\s+1965/i,
          count: 1,
        },
        {
          dataType: RedactedDataType.issueDate,
          text: /09\s+MAA[/-]?MAR\s+2014/i,
          count: 1,
          optional: true,
        },
        {
          dataType: RedactedDataType.expiryDate,
          text: /09\s+MAA[/-]?MAR\s+2024/i,
          count: 1,
          optional: true,
        },
        {
          dataType: RedactedDataType.address,
          text: /Specimen/i,
          count: 1,
        },
        {
          dataType: RedactedDataType.personPhoto,
          text: /photo|portrait|Willeke/i,
          // Both the large photo on the left and smaller photo in right bottom.
          count: 2,
        },
        {
          dataType: RedactedDataType.signature,
          text: /W\.?\s*L\.?\s*de Bruijn/i,
          count: 1,
        },
        {
          dataType: RedactedDataType.organizationName,
          text: /Burg.*Stad.*Dorp/i,
          count: 1,
        },
        {
          dataType: RedactedDataType.idNumber,
          text: /P<NLDDE<BRUIJN/i,
          count: 1,
        },
        {
          dataType: RedactedDataType.idNumber,
          text: /SPECI20142NLD6503101/i,
          count: 1,
        },
      ],
    },
    {
      label: 'IRS Form 1040 specimen',
      imageFileName: 'irs1040Scenario2.jpg',
      expectedRedactions: [
        {
          dataType: RedactedDataType.personName,
          text: /^Sean$/i,
          count: 1,
        },
        {
          dataType: RedactedDataType.personName,
          text: /^John$/i,
          count: 1,
        },
        {
          dataType: RedactedDataType.personName,
          text: /^Joan$/i,
          count: 1,
        },
        {
          dataType: RedactedDataType.personName,
          text: /^Jackson$/i,
          // Jackson appears in both the taxpayer and spouse name fields.
          count: 2,
        },
        {
          dataType: RedactedDataType.idNumber,
          text: /400[\s-]*00[\s-]*1038/i,
          count: 1,
        },
        {
          dataType: RedactedDataType.idNumber,
          text: /400[\s-]*00[\s-]*1071/i,
          // This identifier is repeated in the form's two relevant fields.
          count: 2,
        },
        {
          dataType: RedactedDataType.address,
          text: /26\s*Dancing\s*Daisy\s*Drive/i,
          count: 1,
        },
        {
          dataType: RedactedDataType.address,
          text: /Charleston/i,
          count: 1,
        },
        {
          dataType: RedactedDataType.address,
          text: /^SC$/i,
          count: 1,
        },
        {
          dataType: RedactedDataType.address,
          text: /^29455$/,
          count: 1,
        },
        {
          dataType: RedactedDataType.personName,
          text: /Joan\s+Jackson/i,
          count: 1,
        },
        {
          dataType: RedactedDataType.personName,
          text: /^Sam$/i,
          count: 1,
        },
      ],
    },
    {
      label: 'US passport card specimen',
      imageFileName: 'usPassportCardSpecimen.jpg',
      expectedRedactions: [
        {
          dataType: RedactedDataType.personPhoto,
          text: /photo|portrait/i,
          // Both the large photo on the left and smaller photo in right bottom.
          count: 2,
        },
        {
          dataType: RedactedDataType.idNumber,
          text: /C?[\s-]*03005988/i,
          count: 1,
        },
        {
          dataType: [
            RedactedDataType.personName,
            RedactedDataType.other,
            RedactedDataType.documentOrCaseId,
          ],
          text: /EXEMPLAR/i,
          count: 1,
        },
        {
          dataType: RedactedDataType.personName,
          text: /TRAVELER/i,
          count: 1,
        },
        {
          dataType: RedactedDataType.personName,
          text: /HAPPY/i,
          count: 1,
        },
        {
          dataType: RedactedDataType.dateOfBirth,
          text: /1\s+JAN\s+1981/i,
          count: 1,
        },
        {
          dataType: RedactedDataType.address,
          text: /NEW\s*YORK/i,
          count: 1,
        },
        {
          dataType: RedactedDataType.idNumber,
          text: /M[\s-]*6131821[\s-]*07/i,
          count: 1,
          optional: true,
        },
        {
          dataType: RedactedDataType.issueDate,
          text: /30\s+NOV\s+2009/i,
          count: 1,
          optional: true,
        },
        {
          dataType: RedactedDataType.expiryDate,
          text: /29\s+NOV\s+2019/i,
          count: 1,
          optional: true,
        },
        {
          dataType: RedactedDataType.idNumber,
          text: /1[\s-]*02781[\s-]*0/i,
          count: 1,
        },
      ],
    },
  ])(
    'redacts the expected information from the $label',
    async ({ imageFileName, expectedRedactions }) => {
      const image = await fs.readFile(
        path.join(__dirname, '__testData__', imageFileName)
      );
      const result = await getRedactionBoundingBoxes(image);

      if (process.env.CI !== 'true') {
        const annotatedJPEG = await annotateJPEGWithRedactionBoxes(
          image,
          result.boxes.map((box, index): RedactionBoxToAnnotate => ({
            ...box,
            id: index + 1,
          }))
        );
        await fs.writeFile(getAnnotatedImagePath(imageFileName), annotatedJPEG);
      }

      const requiredRedactionCount: number = expectedRedactions
        .filter(({ optional }) => !optional)
        .flatMap(({ count }) => Array.from({ length: count })).length;
      const maximumRedactionCount: number = expectedRedactions.flatMap(
        ({ count }) => Array.from({ length: count })
      ).length;
      expect(result.boxes.length).toBeGreaterThanOrEqual(
        requiredRedactionCount
      );
      expect(result.boxes.length).toBeLessThanOrEqual(maximumRedactionCount);
      for (const box of result.boxes) {
        expect(box.type).toBe('automatic');
        expect(box.enabled).toBe(true);
        expect(box.box.minX).toBeGreaterThanOrEqual(0);
        expect(box.box.minY).toBeGreaterThanOrEqual(0);
        expect(box.box.maxX).toBeLessThanOrEqual(1);
        expect(box.box.maxY).toBeLessThanOrEqual(1);
      }
      for (const expectedRedaction of expectedRedactions) {
        const expectedDataTypes: RedactedDataType[] = Array.isArray(
          expectedRedaction.dataType
        )
          ? expectedRedaction.dataType
          : [expectedRedaction.dataType];
        const matchingTextBoxes = result.boxes.filter(({ text }): boolean =>
          expectedRedaction.text.test(text)
        );
        const matchingBoxes = result.boxes.filter(
          ({ dataType, text }): boolean =>
            expectedDataTypes.includes(dataType) &&
            expectedRedaction.text.test(text)
        );
        if (expectedRedaction.optional && matchingTextBoxes.length === 0) {
          continue;
        }
        expect(matchingBoxes).toHaveLength(expectedRedaction.count);
      }
    },
    60_000
  );
});

describe(_combineRedactionBoxes, () => {
  it('replaces, adds, and removes boxes from review corrections', () => {
    const originalBox: TestRedactionBox = {
      id: 1,
      dataType: RedactedDataType.personName,
      text: 'Jane Doe',
      minX: 100,
      minY: 100,
      maxX: 200,
      maxY: 200,
    };
    const removedBox: TestRedactionBox = {
      id: 2,
      dataType: RedactedDataType.email,
      text: 'jane@example.com',
      minX: 300,
      minY: 300,
      maxX: 400,
      maxY: 400,
    };
    const correctedBox: TestRedactionBox = {
      ...originalBox,
      minX: 110,
      maxX: 210,
    };
    const addedBox: TestRedactionBox = {
      id: 3,
      dataType: RedactedDataType.phone,
      text: '555-0100',
      minX: 500,
      minY: 500,
      maxX: 600,
      maxY: 600,
    };
    const corrections: TestRedactionCorrection[] = [
      { originalBoxId: originalBox.id, correctedBox },
      { originalBoxId: removedBox.id, correctedBox: null },
      { originalBoxId: null, correctedBox: addedBox },
    ];

    expect(
      _combineRedactionBoxes([originalBox, removedBox], corrections)
    ).toEqual([correctedBox, addedBox]);
  });
});

type TestRedactionBox = Parameters<typeof _combineRedactionBoxes>[0][number];
type TestRedactionCorrection = Parameters<
  typeof _combineRedactionBoxes
>[1][number];

function getAnnotatedImagePath(imageFileName: string): string {
  const extension = path.extname(imageFileName);
  const baseName = path.basename(imageFileName, extension);
  return path.join(
    __dirname,
    '__testData__',
    `${baseName}.annotated${extension}`
  );
}
