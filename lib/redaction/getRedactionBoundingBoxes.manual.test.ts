import { promises as fs } from 'node:fs';
import path from 'node:path';
import { describeManualTest } from '../testUtilities/testTypes';
import {
  annotateJPEGWithRedactionBoxes,
  type RedactionBoxToAnnotate,
} from './annotateJPEGWithRedactionBoxes';
import { getRedactionBoundingBoxes } from './getRedactionBoundingBoxes';

describeManualTest(() => {
  /**
   * Run with:
   * `REDACTION_INPUT_PATH=page.jpg REDACTION_OUTPUT_PATH=annotated.jpg
   * TEST_TYPES=manual yarn manual-jest
   * lib/redaction/getRedactionBoundingBoxes.manual.test.ts`
   */
  it('annotates a manually selected JPEG with live redaction boxes', async () => {
    if (!hasConfiguredVisionProviderAPIKey()) {
      console.info(
        'Skipping live vision request because no vision provider API key is configured. Add it to .env.test'
      );
      return;
    }

    const inputPath = getRequiredEnvironmentPath('REDACTION_INPUT_PATH');
    const outputPath = path.resolve(
      process.env.REDACTION_OUTPUT_PATH ??
        `${path.join(
          path.dirname(inputPath),
          path.basename(inputPath, path.extname(inputPath))
        )}.annotated.jpg`
    );
    const image = await fs.readFile(inputPath);
    const result = await getRedactionBoundingBoxes(image);
    const annotatedJPEG = await annotateJPEGWithRedactionBoxes(
      image,
      result.boxes.map((box, index): RedactionBoxToAnnotate => ({
        ...box,
        id: index + 1,
      }))
    );
    await fs.writeFile(outputPath, annotatedJPEG);

    expect(result.boxes).toEqual(expect.any(Array));
    expect(annotatedJPEG.length).toBeGreaterThan(0);
    console.info(
      JSON.stringify(
        {
          inputPath,
          outputPath,
          redactionBoxCount: result.boxes.length,
          usage: result.response.usage,
          timing: result.response.timing,
        },
        null,
        2
      )
    );
  }, 240_000);
});

function hasConfiguredVisionProviderAPIKey(): boolean {
  const testOnlyGeminiAPIKey = 'test-only-gemini-key';
  return Boolean(
    process.env.GEMINI_API_KEY &&
    process.env.GEMINI_API_KEY !== testOnlyGeminiAPIKey
  );
}

function getRequiredEnvironmentPath(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Set ${name} to a JPEG path before running this manual test.`
    );
  }
  return path.resolve(value);
}
