import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { sortBy } from 'lodash';
import {
  DeserializeFileResult,
  makeMockedPassThroughFunction,
} from '../../testUtilities/MockFunctions';
import { promiseAllThrottled } from '../../utilities/promiseAllThrottled';
import type { RenderPDFPagesOptions } from '../pdfRenderer';

/** Pages are read and written a few at a time. */
const fileConcurrency = 4;

const actualModule =
  jest.requireActual<typeof import('../pdfRenderer')>('../pdfRenderer');

/**
 * Poppler output depends on its version and the installed fonts, so a laptop,
 * the CI runner, and the production image all render slightly different
 * pixels. Those bytes feed the vision request's cache key, so tests replay
 * recorded renders instead of running poppler.
 */
export const renderPDFPages = makeMockedPassThroughFunction(
  actualModule.renderPDFPages,
  __filename,
  {
    makeFilename: ({ pdf, pages, dpi }: RenderPDFPagesOptions): string =>
      `${hashBytes(pdf)}_${dpi}dpi_pages${pages.join('-')}`,
    serializeFile: serializeRenderedPages,
    deserializeFile: deserializeRenderedPages,
  }
);

/** Saves the decrypted PDF as a plain buffer file. */
export const decryptPDF = makeMockedPassThroughFunction(
  actualModule.decryptPDF,
  __filename,
  { makeFilename: (pdf: Uint8Array): string => hashBytes(pdf) }
);

/** Short content hash for naming recordings. Not used for security. */
function hashBytes(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex').slice(0, 16);
}

interface RenderedPagesManifest {
  pages: number[];
}

function pageFilename(manifestBase: string, page: number): string {
  return `${manifestBase}_page${page}.png`;
}

/**
 * Writes one PNG per page, so a recording can be opened and reviewed, plus a
 * JSON manifest that lists the pages and marks the recording as present.
 */
async function serializeRenderedPages(
  filename: string,
  rendered: Map<number, Uint8Array>
): Promise<string[]> {
  const entries = sortBy([...rendered.entries()], ([page]) => page);
  const pngFiles = await promiseAllThrottled(
    entries.map(([page, png]) => async (): Promise<string> => {
      const pngFile = pageFilename(filename, page);
      await fs.writeFile(pngFile, png);
      return pngFile;
    }),
    fileConcurrency
  );
  const manifest: RenderedPagesManifest = {
    pages: entries.map(([page]) => page),
  };
  const manifestFile = `${filename}.json`;
  await fs.writeFile(manifestFile, JSON.stringify(manifest, null, 2), 'utf8');
  return [...pngFiles, manifestFile];
}

async function deserializeRenderedPages(
  manifestFile: string
): Promise<DeserializeFileResult<Map<number, Uint8Array>>> {
  const manifestBase = manifestFile.replace(/\.json$/, '');
  const { pages } = JSON.parse(
    await fs.readFile(manifestFile, 'utf8')
  ) as RenderedPagesManifest;
  const pngFiles = pages.map((page) => pageFilename(manifestBase, page));
  const pngs = await promiseAllThrottled(
    pngFiles.map((file) => async () => fs.readFile(file)),
    fileConcurrency
  );
  return {
    data: new Map(pages.map((page, index) => [page, pngs[index]])),
    readFilePaths: [manifestFile, ...pngFiles],
  };
}
