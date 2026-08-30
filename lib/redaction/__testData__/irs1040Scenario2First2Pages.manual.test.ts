import { promises as fs } from 'node:fs';
import path from 'node:path';
import { PDFDocument } from '@cantoo/pdf-lib';
import { describeManualTest } from '../../testUtilities/testTypes';

describeManualTest(() => {
  /**
   * Copy the first two pages of the IRS 1040 scenario PDF into the committed
   * two-page fixture.
   *
   * Example:
   * `yarn manual-jest lib/redaction/__testData__/irs1040Scenario2First2Pages.manual.test.ts`
   */
  it('writes the first two pages of IRS 1040 scenario 2', async () => {
    const sourcePath = path.join(__dirname, 'irs1040Scenario2.pdf');
    const outputPath = path.join(__dirname, 'irs1040Scenario2First2Pages.pdf');

    try {
      await fs.access(sourcePath);
    } catch {
      console.warn(
        `Skipping test. Missing ${sourcePath}. Download the source PDF described in irs1040Scenario2.pdf.README.md first.`
      );
      return;
    }

    const source = await PDFDocument.load(await fs.readFile(sourcePath), {
      ignoreEncryption: true,
    });
    const output = await PDFDocument.create();
    const copiedPages = await output.copyPages(source, [0, 1]);
    for (const page of copiedPages) {
      output.addPage(page);
    }
    await fs.writeFile(outputPath, await output.save());

    expect(
      (
        await PDFDocument.load(await fs.readFile(outputPath), {
          ignoreEncryption: true,
        })
      ).getPageCount()
    ).toBe(2);
    console.info(`Wrote ${outputPath}`);
  });
});
