import { promises as fs } from 'node:fs';
import path from 'node:path';
import { describeManualTest } from '../testUtilities/testTypes';
import { annotateJPEGWithRedactionBoxes } from './annotateJPEGWithRedactionBoxes';
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
        'Skipping live vision request because no vision provider API key is configured.'
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
      result.boxes
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
          usage: result.usage,
          timing: result.timing,
        },
        null,
        2
      )
    );
  }, 240_000);
});

function hasConfiguredVisionProviderAPIKey(): boolean {
  const testOnlyDeepInfraAPIKey = 'test-only-deepinfra-key';
  const testOnlyGeminiAPIKey = 'test-only-gemini-key';
  const testOnlyOpenAIAPIKey = 'test-only-openai-key';
  return (
    (Boolean(process.env.GEMINI_API_KEY) &&
      process.env.GEMINI_API_KEY !== testOnlyGeminiAPIKey) ||
    (Boolean(process.env.OPENAI_API_KEY) &&
      process.env.OPENAI_API_KEY !== testOnlyOpenAIAPIKey) ||
    (Boolean(process.env.DEEPINFRA_API_KEY) &&
      process.env.DEEPINFRA_API_KEY !== testOnlyDeepInfraAPIKey)
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
