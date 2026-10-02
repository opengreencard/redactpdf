import { promises as fs } from 'node:fs';
import path from 'node:path';
import { describeManualTest } from '../../testUtilities/testTypes';
import { getPDFPageSizes } from '../../pdf/getPDFPageSizes';

describeManualTest(() => {
  /**
   * Check that the committed two-page fixture is still readable.
   *
   * Example:
   * `yarn manual-jest lib/redaction/__testData__/irs1040Scenario2First2Pages.manual.test.ts`
   */
  it('reads the first two pages of IRS 1040 scenario 2', async () => {
    const fixturePath = path.join(__dirname, 'irs1040Scenario2First2Pages.pdf');

    try {
      await fs.access(fixturePath);
    } catch {
      console.warn(`Skipping test. Missing ${fixturePath}.`);
      return;
    }

    expect((await getPDFPageSizes(await fs.readFile(fixturePath))).length).toBe(
      2
    );
    console.info(`Verified ${fixturePath}`);
  });
});
