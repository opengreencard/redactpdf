import { promises as fs } from 'node:fs';
import path from 'node:path';
import { RedactedDataType } from '../models/redactionTypes';
import { promiseAllThrottled } from '../utilities/promiseAllThrottled';
import { annotateJPEGWithRedactionBoxes } from './annotateJPEGWithRedactionBoxes';
import { getRedactionBoundingBoxes } from './getRedactionBoundingBoxes';

interface ExpectedRedaction {
  dataType: RedactedDataType;
  text: RegExp;
  count: number;
}

interface RedactionImageCase {
  label: string;
  imageFileName: string;
  expectedRedactions: ExpectedRedaction[];
}

describe(getRedactionBoundingBoxes, () => {
  let imagesByFileName: Record<string, Buffer>;

  beforeAll(async () => {
    const imageEntries = await promiseAllThrottled(
      getRedactionImageCases().map(
        ({ imageFileName }) =>
          async (): Promise<[string, Buffer]> => [
            imageFileName,
            await fs.readFile(
              path.join(__dirname, '__testData__', imageFileName)
            ),
          ]
      ),
      3
    );
    imagesByFileName = Object.fromEntries(imageEntries);
  });

  it.each(getRedactionImageCases())(
    'redacts the expected information from the $label',
    async ({ imageFileName, expectedRedactions }) => {
      const result = await getRedactionBoundingBoxes(
        imagesByFileName[imageFileName]
      );

      const expectedRedactionCount: number = expectedRedactions.flatMap(
        ({ count }) => Array.from({ length: count })
      ).length;
      expect(result.boxes).toHaveLength(expectedRedactionCount);
      for (const box of result.boxes) {
        expect(box.type).toBe('automatic');
        expect(box.enabled).toBe(true);
        expect(box.box.minX).toBeGreaterThanOrEqual(0);
        expect(box.box.minY).toBeGreaterThanOrEqual(0);
        expect(box.box.maxX).toBeLessThanOrEqual(1);
        expect(box.box.maxY).toBeLessThanOrEqual(1);
      }
      for (const expectedRedaction of expectedRedactions) {
        expect(result.boxes).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              dataType: expectedRedaction.dataType,
              text: expect.stringMatching(expectedRedaction.text),
            }),
          ])
        );
        const matchingBoxes = result.boxes.filter(
          ({ dataType, text }): boolean =>
            dataType === expectedRedaction.dataType &&
            expectedRedaction.text.test(text)
        );
        expect(matchingBoxes).toHaveLength(expectedRedaction.count);
      }

      if (process.env.CI !== 'true') {
        const annotatedJPEG = await annotateJPEGWithRedactionBoxes(
          imagesByFileName[imageFileName],
          result.boxes
        );
        await fs.writeFile(getAnnotatedImagePath(imageFileName), annotatedJPEG);
      }
    },
    60_000
  );
});

function getRedactionImageCases(): RedactionImageCase[] {
  return [
    {
      label: 'Dutch passport specimen',
      imageFileName: 'dutchPassportSpecimen.jpg',
      expectedRedactions: [
        {
          dataType: RedactedDataType.idNumber,
          text: /^SPEC[I1]2014$/i,
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
          dataType: RedactedDataType.address,
          text: /Specimen/i,
          count: 1,
        },
        {
          dataType: RedactedDataType.personPhoto,
          text: /photo|portrait|Willeke/i,
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
          count: 1,
        },
        {
          dataType: RedactedDataType.idNumber,
          text: /C?[\s-]*03005988/i,
          count: 1,
        },
        {
          dataType: RedactedDataType.personName,
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
        },
        {
          dataType: RedactedDataType.idNumber,
          text: /1[\s-]*02781[\s-]*0/i,
          count: 1,
        },
      ],
    },
  ];
}

function getAnnotatedImagePath(imageFileName: string): string {
  const extension = path.extname(imageFileName);
  const baseName = path.basename(imageFileName, extension);
  return path.join(
    __dirname,
    '__testData__',
    `${baseName}.annotated${extension}`
  );
}
