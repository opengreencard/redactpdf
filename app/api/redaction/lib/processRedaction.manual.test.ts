import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PDFDocument } from '@cantoo/pdf-lib';
import { processRedaction } from './processRedaction';
import FakeData from '../../../../lib/testUtilities/FakeData';
import Redaction, {
  RedactionAttributes,
  generateRedactionKey,
} from '../../../../lib/models/Redaction';
import { PartialInstance } from '../../../../lib/db/types';
import { RedactionStatus } from '../../../../lib/models/redactionTypes';
import { generateRedactedPDF } from '../../../../lib/pdf/generateRedactedPDF';
import { describeManualTest } from '../../../../lib/testUtilities/testTypes';

describeManualTest(() => {
  /**
   * Run a live PDF redaction and write a redacted PDF.
   *
   * Example:
   * `REDACTION_INPUT_PATH=lib/redaction/__testData__/irs1040Scenario2.pdf
   * yarn manual-jest app/api/redaction/lib/processRedaction.manual.test.ts`
   *
   * Set `REDACTION_OUTPUT_PATH` to override the default
   * `~/Downloads/<input-name>.redacted.pdf` output path.
   */
  it('processes the supplied PDF and writes a redacted PDF', async () => {
    const inputPathValue = process.env.REDACTION_INPUT_PATH;
    if (!inputPathValue) {
      console.warn(
        'Skipping test. To run, run: REDACTION_INPUT_PATH=lib/redaction/__testData__/irs1040Scenario2.pdf yarn manual-jest app/api/redaction/lib/processRedaction.manual.test.ts'
      );
      return;
    }
    const inputPath = path.resolve(inputPathValue);
    const configuredOutputPath = process.env.REDACTION_OUTPUT_PATH;
    const inputPDF = await fs.readFile(inputPath);
    const sourcePDF = await PDFDocument.load(inputPDF, {
      ignoreEncryption: true,
    });
    const pageCount = sourcePDF.getPageCount();
    const redactionKey = generateRedactionKey();
    const outputPath = configuredOutputPath
      ? path.resolve(configuredOutputPath)
      : path.join(
          os.homedir(),
          'Downloads',
          `${path.basename(inputPath, path.extname(inputPath))}.redacted.pdf`
        );
    const redaction = await FakeData.makeDBRedaction({
      key: redactionKey,
      pageCount,
    });

    const startedAt = Date.now();
    const processingResult = await processRedaction(redaction, inputPDF);
    const elapsedMs = Date.now() - startedAt;
    const updatedRedaction = (await Redaction.findOne({
      where: { key: redactionKey },
      attributes: ['status', 'redactionBoundingBoxes', 'errorMessage'],
    })) as PartialInstance<
      RedactionAttributes,
      'status' | 'redactionBoundingBoxes' | 'errorMessage'
    > | null;
    const redactionStatus = updatedRedaction?.status;
    const redactionBoundingBoxes =
      updatedRedaction?.redactionBoundingBoxes ?? [];
    const redactedPDF = await generateRedactedPDF({
      pdf: inputPDF,
      redactionBoundingBoxes,
    });

    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, redactedPDF);

    expect(redactionStatus).toBe(RedactionStatus.redacted);
    expect(redactedPDF.length).toBeGreaterThan(0);
    const result: Record<string, unknown> = {
      elapsedMs,
      inputPath,
      outputPath,
      pageCount,
      redactionStatus,
      errorMessage: updatedRedaction?.errorMessage ?? null,
      redactionBoxCount: redactionBoundingBoxes.length,
      processing: processingResult,
    };
    console.info(JSON.stringify(result, null, 2));
  }, 600_000);
});
