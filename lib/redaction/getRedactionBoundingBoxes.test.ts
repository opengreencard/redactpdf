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
import { getRedactionBoundingBoxes } from './getRedactionBoundingBoxes';

afterAll(async () => {
  await maybeDeleteUnusedOpenAICompatibleCompletionCacheFiles(__filename);
});

interface ExpectedRedaction {
  /**
   * If an array, the `dataType` just needs to be one of the types specified.
   */
  dataType: RedactedDataType | RedactedDataType[];
  text: RegExp;
  minimumCount: number;
  /** Some providers may omit this sensitive value despite the expected type. */
  optional?: boolean;
}

interface ExpectedRedactionAlternatives {
  alternatives: ExpectedRedaction[][];
  /** Some providers may omit all of these sensitive values. */
  optional?: boolean;
}

type ExpectedRedactionRequirement =
  ExpectedRedaction | ExpectedRedactionAlternatives;

interface RedactionImageCase {
  label: string;
  imageFileName: string;
  expectedRedactions: ExpectedRedactionRequirement[];
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
          minimumCount: 2,
        },
        {
          alternatives: [
            [
              {
                dataType: RedactedDataType.personName,
                text: /De Bruijn[\s\S]*Molenaar/i,
                minimumCount: 1,
              },
            ],
            [
              {
                dataType: RedactedDataType.personName,
                text: /^De Bruijn$/i,
                minimumCount: 1,
              },
              {
                dataType: RedactedDataType.personName,
                text: /^e\/v Molenaar$/i,
                minimumCount: 1,
              },
            ],
          ],
        },
        {
          dataType: RedactedDataType.personName,
          text: /Willeke.*Liselotte/i,
          minimumCount: 1,
        },
        {
          dataType: RedactedDataType.dateOfBirth,
          text: /10\s+MAA[/-]?MAR\s+1965/i,
          minimumCount: 1,
        },
        {
          dataType: RedactedDataType.issueDate,
          text: /09\s+MAA[/-]?MAR\s+2014/i,
          minimumCount: 1,
          optional: true,
        },
        {
          dataType: RedactedDataType.expiryDate,
          text: /09\s+MAA[/-]?MAR\s+2024/i,
          minimumCount: 1,
          optional: true,
        },
        {
          dataType: RedactedDataType.address,
          text: /Specimen/i,
          minimumCount: 1,
        },
        {
          dataType: RedactedDataType.personPhoto,
          text: /photo|portrait|Willeke/i,
          // Both the large photo on the left and smaller photo in right bottom.
          minimumCount: 2,
        },
        {
          dataType: RedactedDataType.signature,
          text: /W\.?\s*L\.?\s*de Bruijn|signature/i,
          minimumCount: 1,
        },
        {
          dataType: RedactedDataType.organizationName,
          text: /Burg.*Stad.*Dorp/i,
          minimumCount: 1,
          optional: true,
        },
        {
          dataType: [RedactedDataType.idNumber, RedactedDataType.personName],
          text: /DE<BRUIJN[\s\S]*WILLEKE[\s\S]*LISELOTTE/i,
          minimumCount: 1,
        },
        {
          dataType: [
            RedactedDataType.idNumber,
            RedactedDataType.dateOfBirth,
            RedactedDataType.expiryDate,
          ],
          text: /SPECI20142NLD6503101|6999999990/i,
          minimumCount: 1,
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
          minimumCount: 1,
        },
        {
          dataType: RedactedDataType.personName,
          text: /^John$/i,
          minimumCount: 1,
        },
        {
          dataType: RedactedDataType.personName,
          text: /^Joan$/i,
          minimumCount: 1,
        },
        {
          dataType: RedactedDataType.personName,
          text: /^Jackson$/i,
          // Jackson appears in both the taxpayer and spouse name fields.
          minimumCount: 2,
        },
        {
          dataType: RedactedDataType.idNumber,
          text: /400[\s-]*00[\s-]*1038/i,
          minimumCount: 1,
        },
        {
          dataType: RedactedDataType.idNumber,
          text: /400[\s-]*00[\s-]*1071/i,
          // This identifier is repeated in the form's two relevant fields.
          minimumCount: 2,
        },
        {
          dataType: RedactedDataType.address,
          text: /26\s*Dancing\s*Daisy\s*Drive/i,
          minimumCount: 1,
        },
        {
          dataType: RedactedDataType.address,
          text: /Charleston/i,
          minimumCount: 1,
        },
        {
          dataType: RedactedDataType.address,
          text: /^SC$/i,
          minimumCount: 1,
        },
        {
          dataType: RedactedDataType.address,
          text: /^29455$/,
          minimumCount: 1,
        },
        {
          dataType: RedactedDataType.personName,
          text: /Joan\s+Jackson/i,
          minimumCount: 1,
        },
        {
          dataType: RedactedDataType.personName,
          text: /^Sam$/i,
          minimumCount: 1,
          // Gemini 3.7 was notably more exhaustive around the dependent's
          // name, including the son's repeated name in the dependents table.
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
          minimumCount: 2,
        },
        {
          dataType: RedactedDataType.idNumber,
          text: /C?[\s-]*03005988/i,
          minimumCount: 1,
        },
        {
          dataType: [
            RedactedDataType.personName,
            RedactedDataType.other,
            RedactedDataType.documentOrCaseId,
          ],
          text: /EXEMPLAR/i,
          minimumCount: 1,
          // Whether a provider redacts this document watermark is optional.
          optional: true,
        },
        {
          dataType: RedactedDataType.personName,
          text: /TRAVELER/i,
          minimumCount: 1,
        },
        {
          dataType: RedactedDataType.personName,
          text: /HAPPY/i,
          minimumCount: 1,
        },
        {
          dataType: RedactedDataType.dateOfBirth,
          text: /1\s+JAN\s+1981/i,
          minimumCount: 1,
        },
        {
          dataType: RedactedDataType.address,
          text: /NEW\s*YORK/i,
          minimumCount: 1,
        },
        {
          dataType: RedactedDataType.idNumber,
          text: /M[\s-]*6131821[\s-]*07/i,
          minimumCount: 1,
          optional: true,
        },
        {
          dataType: RedactedDataType.issueDate,
          text: /30\s+NOV\s+2009/i,
          minimumCount: 1,
          optional: true,
        },
        {
          dataType: RedactedDataType.expiryDate,
          text: /29\s+NOV\s+2019/i,
          minimumCount: 1,
          optional: true,
        },
        {
          dataType: RedactedDataType.idNumber,
          text: /1[\s-]*02781[\s-]*0/i,
          minimumCount: 1,
        },
      ],
    },
  ])(
    'redacts the expected information from the $label',
    async ({ label, imageFileName, expectedRedactions }) => {
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

      for (const box of result.boxes) {
        expect(box.type).toBe('automatic');
        expect(box.enabled).toBe(true);
        expect(box.box.minX).toBeGreaterThanOrEqual(0);
        expect(box.box.minY).toBeGreaterThanOrEqual(0);
        expect(box.box.maxX).toBeLessThanOrEqual(1);
        expect(box.box.maxY).toBeLessThanOrEqual(1);
      }
      // These are minimum coverage checks rather than exact totals because
      // Gemini 3.7 is notably better at exhaustive removal, especially for
      // repeated, faint, or secondary sensitive values.
      for (const expectedRedaction of expectedRedactions) {
        if (!matchesExpectedRedaction(result.boxes, expectedRedaction)) {
          throw new Error(
            [
              `Missing expected redaction in ${label}: ${describeExpectedRedaction(
                expectedRedaction
              )}.`,
              'Inspect the annotated image: improve the prompt or model if the sensitive content is uncovered; loosen this assertion if it is covered but classified or text-matched differently.',
            ].join(' ')
          );
        }
      }
    },
    60_000
  );
});

function getAnnotatedImagePath(imageFileName: string): string {
  const extension = path.extname(imageFileName);
  const baseName = path.basename(imageFileName, extension);
  return path.join(
    __dirname,
    '__testData__',
    `${baseName}.annotated${extension}`
  );
}

function hasMinimumMatchingBoxes(
  boxes: Awaited<ReturnType<typeof getRedactionBoundingBoxes>>['boxes'],
  expectedRedaction: ExpectedRedaction
): boolean {
  const expectedDataTypes: RedactedDataType[] = Array.isArray(
    expectedRedaction.dataType
  )
    ? expectedRedaction.dataType
    : [expectedRedaction.dataType];
  const matchingBoxes = boxes.filter(
    ({ dataType, text }): boolean =>
      expectedDataTypes.includes(dataType) && expectedRedaction.text.test(text)
  );
  return matchingBoxes.length >= expectedRedaction.minimumCount;
}

function matchesExpectedRedaction(
  boxes: Awaited<ReturnType<typeof getRedactionBoundingBoxes>>['boxes'],
  expectedRedaction: ExpectedRedactionRequirement
): boolean {
  if ('alternatives' in expectedRedaction) {
    const matchesAnAlternative: boolean = expectedRedaction.alternatives.some(
      (alternative): boolean =>
        alternative.every((redaction): boolean =>
          hasMinimumMatchingBoxes(boxes, redaction)
        )
    );
    return expectedRedaction.optional || matchesAnAlternative;
  }

  const matchingTextBoxes = boxes.filter(({ text }): boolean =>
    expectedRedaction.text.test(text)
  );
  return (
    (expectedRedaction.optional && matchingTextBoxes.length === 0) ||
    hasMinimumMatchingBoxes(boxes, expectedRedaction)
  );
}

function describeExpectedRedaction(
  expectedRedaction: ExpectedRedactionRequirement
): string {
  if ('alternatives' in expectedRedaction) {
    return expectedRedaction.alternatives
      .map((alternative): string =>
        alternative.map(describeExpectedRedaction).join(' and ')
      )
      .join(' or ');
  }
  const dataTypes = Array.isArray(expectedRedaction.dataType)
    ? expectedRedaction.dataType.join(', ')
    : expectedRedaction.dataType;
  return `${dataTypes} matching ${expectedRedaction.text}`;
}
