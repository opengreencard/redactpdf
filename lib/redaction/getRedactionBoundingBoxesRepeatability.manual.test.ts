import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { getPDFPageSizes } from '../pdf/getPDFPageSizes';
import { compressImage, rasterizePDFPages } from '../pdf/pdfToImage';
import type {
  OpenAICompatibleCompletionResult,
  OpenAICompatibleCompletionTiming,
} from '../ai/createOpenAICompatibleCompletion';
import { describeManualTest } from '../testUtilities/testTypes';
import type { SinglePageRedactionBoundingBox } from './redactionTypes';
import {
  annotateJPEGWithRedactionBoxes,
  type RedactionBoxToAnnotate,
} from './annotateJPEGWithRedactionBoxes';
import { getRedactionBoundingBoxes } from './getRedactionBoundingBoxes';

// Each run must call the live model. The global mock would replay one recorded
// response for all identical requests, which hides run-to-run variance.
jest.unmock('../ai/createOpenAICompatibleCompletion');
// Keep the rendered page out of the recorded mock folder, since it is a
// private document.
jest.unmock('../pdf/pdfRenderer');

describeManualTest(() => {
  /**
   * Run the first page of a PDF through live redaction ten times. Save each
   * run's boxes drawn on the page as a PNG, then check that expected details
   * are redacted in almost every run and shared amounts are never redacted.
   *
   * Example:
   * `REDACTION_INPUT_PATH=~/Documents/cover-letter.pdf
   * REDACTION_EXPECTATIONS_PATH=~/Documents/cover-letter-expectations.json
   * yarn manual-jest lib/redaction/getRedactionBoundingBoxesRepeatability.manual.test.ts`
   *
   * Keep the expectations file outside the repo. It describes a private
   * document. Its shape is `RedactionExpectations`.
   *
   * Set `REDACTION_OUTPUT_DIR` to override the default
   * `~/Downloads/<input-name>-bounding-box-runs` folder.
   */
  it('saves annotated PNGs and checks expected redactions for ten live runs of the first page', async () => {
    const testOnlyGeminiAPIKey = 'test-only-gemini-key';
    if (
      !process.env.GEMINI_API_KEY ||
      process.env.GEMINI_API_KEY === testOnlyGeminiAPIKey
    ) {
      console.warn(
        'Skipping test. Add a real GEMINI_API_KEY to .env.test, then run: REDACTION_INPUT_PATH=file.pdf REDACTION_EXPECTATIONS_PATH=expectations.json yarn manual-jest lib/redaction/getRedactionBoundingBoxesRepeatability.manual.test.ts'
      );
      return;
    }

    const inputPathValue = process.env.REDACTION_INPUT_PATH;
    const expectationsPathValue = process.env.REDACTION_EXPECTATIONS_PATH;
    if (!inputPathValue || !expectationsPathValue) {
      console.warn(
        'Skipping test. To run, run: REDACTION_INPUT_PATH=file.pdf REDACTION_EXPECTATIONS_PATH=expectations.json yarn manual-jest lib/redaction/getRedactionBoundingBoxesRepeatability.manual.test.ts'
      );
      return;
    }

    const runCount = 10;
    // Almost always, not always: the model can miss one detail in one run.
    const minimumRedactedRuns = 9;
    // Same DPI as the stored page previews in `pdfToImage.ts`.
    const previewDPI = 150;
    const inputPath = path.resolve(inputPathValue);
    const expectations: RedactionExpectations = JSON.parse(
      await fs.readFile(path.resolve(expectationsPathValue), 'utf8')
    );
    const outputDir = path.resolve(
      process.env.REDACTION_OUTPUT_DIR ??
        path.join(
          os.homedir(),
          'Downloads',
          `${path.basename(inputPath, path.extname(inputPath))}-bounding-box-runs`
        )
    );

    const pdf = await fs.readFile(inputPath);
    const [pageSize] = await getPDFPageSizes(pdf);
    const previewPNG = (
      await rasterizePDFPages(pdf, { pageNumbers: [1], dpi: previewDPI })
    ).get(1);
    if (!previewPNG) {
      throw new Error('The PDF renderer did not return page 1.');
    }

    // Vision input matches production: the page size in points, not the
    // higher-resolution preview. The preview is only used for drawing.
    const visionJPEG = await compressImage({
      pngBuffer: previewPNG,
      size: {
        width: Math.round(pageSize.width),
        height: Math.round(pageSize.height),
      },
    });

    await fs.mkdir(outputDir, { recursive: true });
    const runs = await Promise.all(
      Array.from(
        { length: runCount },
        async (_, runIndex): Promise<RedactionRunSummary> => {
          const result = await getRedactionBoundingBoxes(visionJPEG);
          const annotatedJPEG = await annotateJPEGWithRedactionBoxes(
            previewPNG,
            result.boxes.map((box, index): RedactionBoxToAnnotate => ({
              ...box,
              id: index + 1,
            }))
          );
          const outputPath = path.join(
            outputDir,
            `run-${String(runIndex + 1).padStart(2, '0')}.png`
          );
          await fs.writeFile(
            outputPath,
            await sharp(annotatedJPEG).png().toBuffer()
          );
          return {
            run: runIndex + 1,
            outputPath,
            redactionBoxCount: result.boxes.length,
            boxes: result.boxes.map(
              ({ dataType, text }): RedactionBoxSummary => ({ dataType, text })
            ),
            usage: result.response.usage,
            timing: result.response.timing,
          };
        }
      )
    );

    // Every run should find something. A run with no boxes is a failure
    // worth seeing in the summary.
    for (const run of runs) {
      expect(run.redactionBoxCount).toBeGreaterThan(0);
    }

    // Each expected redaction must show up in almost every run. The failure
    // lists only the texts that fell short, with how many runs redacted them.
    const runsMissingRedaction = expectations.mustRedact
      .map((text): [string, number] => [text, countRunsWithText(runs, text)])
      .filter(([, redactedRuns]) => redactedRuns < minimumRedactedRuns);
    expect(runsMissingRedaction).toEqual([]);

    // Shared amounts, such as standard fees, must never be redacted.
    const runsRedactingSharedText = expectations.mustNotRedact
      .map((text): [string, number] => [text, countRunsWithText(runs, text)])
      .filter(([, redactedRuns]) => redactedRuns > 0);
    expect(runsRedactingSharedText).toEqual([]);

    console.info(JSON.stringify({ inputPath, outputDir, runs }, null, 2));
  }, 600_000);
});

/** Text expected to be redacted in almost every run, and text never to be redacted. */
interface RedactionExpectations {
  mustRedact: string[];
  mustNotRedact: string[];
}

/** Box type and text the model returned, printed so runs can be compared. */
type RedactionBoxSummary = Pick<
  SinglePageRedactionBoundingBox,
  'dataType' | 'text'
>;

/** Per-run values printed at the end, plus the saved annotated PNG. */
interface RedactionRunSummary {
  run: number;
  outputPath: string;
  redactionBoxCount: number;
  boxes: RedactionBoxSummary[];
  usage: OpenAICompatibleCompletionResult['usage'];
  timing: OpenAICompatibleCompletionTiming;
}

/** Count runs with at least one box whose text contains `text`, ignoring case. */
function countRunsWithText(runs: RedactionRunSummary[], text: string): number {
  const lowerText = text.toLowerCase();
  return runs.filter((run) =>
    run.boxes.some((box) => box.text.toLowerCase().includes(lowerText))
  ).length;
}
