import { promises as fs } from 'node:fs';
import path from 'node:path';
import { makeTestDataGeneratorTest } from '../../../testUtilities/testDataGenerator';
import { getRedactionBoundingBoxes } from '../../getRedactionBoundingBoxes';

function makeRedactionBoundingBoxesTest(
  name: string,
  imageFileName: string
): void {
  makeTestDataGeneratorTest(
    `${__dirname}/${name}.json`,
    async () => {
      const image = await fs.readFile(
        path.join(__dirname, '..', imageFileName)
      );
      const { boxes } = await getRedactionBoundingBoxes(image);
      return boxes;
    },
    { timeoutMs: 240_000 }
  );
}

makeRedactionBoundingBoxesTest('IRS1040Scenario2', 'irs1040Scenario2.jpg');
makeRedactionBoundingBoxesTest(
  'USPassportCardSpecimen',
  'usPassportCardSpecimen.jpg'
);
