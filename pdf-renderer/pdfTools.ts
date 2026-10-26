import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import PQueue from 'p-queue';

/**
 * Decrypt a PDF with qpdf. The output has no encryption dictionary.
 *
 * qpdf exits with 3 when it repaired something but still wrote the output.
 * `--warning-exit-0` makes that a success.
 */
export function decryptPDF(pdf: Uint8Array): Promise<Buffer> {
  return queue.add(() =>
    withWorkDirectory(async (directory) => {
      const inputPath = await writeInput(directory, pdf);
      const outputPath = path.join(directory, 'decrypted.pdf');
      // eslint-disable-next-line no-restricted-syntax -- this is the one call that runs qpdf
      await execFileAsync(
        'qpdf',
        ['--warning-exit-0', '--decrypt', inputPath, outputPath],
        { timeout: toolTimeoutMs }
      );
      return readFile(outputPath);
    })
  );
}

/**
 * Render 1-based pages to PNG at `dpi`. Each page is one poppler call, so
 * the call writes a single PNG and we read it back.
 */
export function renderPages({
  pdf,
  pages,
  dpi,
}: {
  pdf: Uint8Array;
  pages: number[];
  dpi: number;
}): Promise<{ page: number; png: Buffer }[]> {
  return queue.add(() =>
    withWorkDirectory(async (directory) => {
      const inputPath = await writeInput(directory, pdf);
      const rendered: { page: number; png: Buffer }[] = [];
      // One page at a time keeps memory bounded to a single page.
      for (const page of pages) {
        // `-singlefile` writes `<prefix>.png` without a page number suffix.
        const outputPrefix = path.join(directory, `page-${page}`);
        // eslint-disable-next-line no-await-in-loop -- one page at a time bounds memory
        await runPdftoppm([
          '-png',
          '-singlefile',
          '-r',
          String(dpi),
          '-f',
          String(page),
          '-l',
          String(page),
          inputPath,
          outputPrefix,
        ]);
        // eslint-disable-next-line no-await-in-loop -- one page at a time bounds memory
        const png = await readFile(`${outputPrefix}.png`);
        rendered.push({ page, png });
      }
      return rendered;
    })
  );
}

const execFileAsync = promisify(execFile);

/** Rendering or decrypting a large PDF can be slow, so bound each call. */
const toolTimeoutMs = 120_000;

/**
 * Fontconfig settings for pdftoppm. See fontconfig.conf for the font aliases.
 */
const fontConfigPath = path.join(__dirname, 'fontconfig.conf');
const fontEnv: NodeJS.ProcessEnv = {
  ...process.env,
  FONTCONFIG_FILE: fontConfigPath,
};

/** Keep in sync with fontconfig.conf's `<cachedir>` and stem `<include>`. */
const fontCacheDirectory = '/tmp/redaction-fontconfig';
const stemAliasPath = path.join(fontCacheDirectory, 'style-stems.conf');

/**
 * Build the fontconfig cache once per process. fontconfig.conf's scan rules
 * only apply through this cache, not the system cache.
 */
let fontCacheBuilt: Promise<unknown> | undefined;
function buildFontCache(): Promise<unknown> {
  fontCacheBuilt ??= (async () => {
    await writeStemAliases();
    return execFileAsync('fc-cache', ['-f'], {
      env: fontEnv,
      timeout: toolTimeoutMs,
    });
  })();
  return fontCacheBuilt;
}

/**
 * Write one scan rule per font stem, such as `TimesNewRomanPS` for
 * `TimesNewRomanPS-BoldMT`, using the fonts installed on this machine.
 *
 * fc-list only reads PostScript names, so stems left over from an earlier run
 * don't change its output. fc-cache rebuilds the cache with the new file.
 *
 * Keep in sync with the stem `<include>` in fontconfig.conf, which loads the
 * file this writes.
 */
async function writeStemAliases(): Promise<void> {
  const { stdout } = await execFileAsync(
    'fc-list',
    ['--format', '%{postscriptname}\\n'],
    { env: fontEnv, timeout: toolTimeoutMs }
  );

  const stems = new Set<string>();
  for (const postScriptName of stdout.split('\n')) {
    // Names without a dash have no style to strip. The regex keeps odd
    // characters out of the XML we write below.
    const dashIndex = postScriptName.indexOf('-');
    const stem = postScriptName.slice(0, dashIndex);
    if (dashIndex > 0 && /^[\w.]+$/.test(stem)) stems.add(stem);
  }

  // fontconfig has no prefix test, so `contains` is the closest match.
  // PostScript names have no spaces, so a stray match in the middle of a name
  // is rare.
  const rules = [...stems].map(
    (stem) => `  <match target="scan">
    <test name="postscriptname" compare="contains"><string>${stem}-</string></test>
    <edit name="family" mode="append"><string>${stem}</string></edit>
  </match>`
  );
  await mkdir(fontCacheDirectory, { recursive: true });
  await writeFile(
    stemAliasPath,
    `<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd">
<fontconfig>
${rules.join('\n')}
</fontconfig>
`
  );
}

/**
 * Each poppler or qpdf process can use a lot of memory, so limit how many
 * documents run at once.
 */
const queue = new PQueue({ concurrency: 2 });

// execFile takes an argument array, so PDF contents never reach a shell.
// Poppler has no sandbox mode. The renderer sidecar is the isolation boundary,
// so it must keep app secrets out.
async function runPdftoppm(args: string[]): Promise<unknown> {
  await buildFontCache();
  // eslint-disable-next-line no-restricted-syntax -- this is the one call that runs pdftoppm
  return execFileAsync('pdftoppm', args, {
    timeout: toolTimeoutMs,
    env: fontEnv,
  });
}

async function withWorkDirectory<T>(
  callback: (directory: string) => Promise<T>
): Promise<T> {
  const directory = await mkdtemp(path.join(tmpdir(), 'pdf-renderer-'));
  try {
    const result = await callback(directory);
    return result;
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

async function writeInput(directory: string, pdf: Uint8Array): Promise<string> {
  const inputPath = path.join(directory, 'input.pdf');
  await writeFile(inputPath, pdf);
  return inputPath;
}
