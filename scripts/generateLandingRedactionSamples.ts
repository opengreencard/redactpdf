import path from 'node:path';
import { generateLandingRedactionSamples } from './generateLandingRedactionSamples.lib';

async function main(): Promise<void> {
  try {
    const workspaceRoot = path.join(__dirname, '..');
    const generated = await generateLandingRedactionSamples({
      outputDirectory: path.join(workspaceRoot, 'public/samples'),
      fixturesDirectory: path.join(workspaceRoot, 'lib/redaction/__testData__'),
    });
    // eslint-disable-next-line no-console -- CLI summary for the generator
    console.info(JSON.stringify(generated, null, 2));
  } catch (error) {
    // eslint-disable-next-line no-console -- CLI runner surfaces the failure
    console.error(error);
    process.exit(1);
  }
}

main();
