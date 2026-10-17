import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import PQueue from 'p-queue';

const execFileAsync = promisify(execFile);

/** Ghostscript can be slow on large documents, so bound each call. */
const ghostscriptTimeoutMs = 120_000;

/**
 * Each Ghostscript process can use a lot of memory, so limit how many
 * documents run at once.
 */
const queue = new PQueue({ concurrency: 2 });

/** Decrypt a PDF. The output has no encryption dictionary. */
export function decryptPDF(pdf: Uint8Array): Promise<Buffer> {
  return queue.add(() =>
    withWorkDirectory(async (directory) => {
      const inputPath = await writeInput(directory, pdf);
      const outputPath = path.join(directory, 'decrypted.pdf');
      await runGhostscript([
        '-sDEVICE=pdfwrite',
        `-sOutputFile=${outputPath}`,
        inputPath,
      ]);
      return readFile(outputPath);
    })
  );
}

/** Render 1-based pages to PNG at `dpi`. */
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
        const outputPath = path.join(directory, `page-${page}.png`);
        // eslint-disable-next-line no-await-in-loop -- one page at a time bounds memory
        await runGhostscript([
          '-sDEVICE=png16m',
          `-r${dpi}`,
          `-dFirstPage=${page}`,
          `-dLastPage=${page}`,
          `-sOutputFile=${outputPath}`,
          inputPath,
        ]);
        // eslint-disable-next-line no-await-in-loop -- one page at a time bounds memory
        const png = await readFile(outputPath);
        rendered.push({ page, png });
      }
      return rendered;
    })
  );
}

// `-dSAFER` is Ghostscript's sandbox. It is the default in current versions,
// but passing it explicitly means a future change can't remove it silently.
// execFile takes an argument array, so PDF contents never reach a shell.
function runGhostscript(args: string[]): Promise<unknown> {
  // eslint-disable-next-line no-restricted-syntax -- this is the one call that runs Ghostscript
  return execFileAsync(
    'gs',
    ['-q', '-dSAFER', '-dBATCH', '-dNOPAUSE', ...args],
    { timeout: ghostscriptTimeoutMs }
  );
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
