import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';

export interface DeserializeFileResult<ResultT> {
  data: ResultT;
  readFilePaths: string[];
}

interface MockFunctionOptions<ResultT> {
  shouldUseCache?: (...args: never[]) => boolean;
  makeFilename?: (...args: never[]) => string;
  serializeFile?: (data: ResultT) => string | Buffer;
  deserializeFile?: (data: Buffer) => ResultT;
}

/**
 * Wrap an async network function with a filesystem recording.
 *
 * The first run writes the response beside the calling test, while later test
 * runs replay that response. This keeps recorded OpenAI-compatible responses
 * reviewable in git without making Jest depend on a live service.
 */
export function makeMockedPassThroughFunction<
  FunctionT extends (...args: never[]) => Promise<unknown>,
>(
  originalFunction: FunctionT,
  scriptFilename: string,
  options: MockFunctionOptions<Awaited<ReturnType<FunctionT>>> = {}
): (...args: Parameters<FunctionT>) => Promise<Awaited<ReturnType<FunctionT>>> {
  return async (
    ...args: Parameters<FunctionT>
  ): Promise<Awaited<ReturnType<FunctionT>>> => {
    const {
      shouldUseCache = () => process.env.NODE_ENV === 'test',
      makeFilename = (...functionArgs: never[]) =>
        `${createHash('sha256')
          .update(JSON.stringify(functionArgs))
          .digest('hex')
          .slice(0, 16)}.json`,
      serializeFile = (data: Awaited<ReturnType<FunctionT>>) =>
        JSON.stringify(data, null, 2),
      deserializeFile = (data: Buffer) =>
        JSON.parse(data.toString('utf8')) as Awaited<ReturnType<FunctionT>>,
    } = options;

    const cacheDirectory = path.join(
      path.dirname(scriptFilename),
      '__testData__',
      'mockFunctions'
    );
    const cachePath = path.join(
      cacheDirectory,
      makeFilename(...(args as never[]))
    );

    if (shouldUseCache(...(args as never[]))) {
      try {
        return deserializeFile(await fs.readFile(cachePath));
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          throw error;
        }
      }
    }

    const result = (await originalFunction(...args)) as Awaited<
      ReturnType<FunctionT>
    >;
    await fs.mkdir(cacheDirectory, { recursive: true });
    await fs.writeFile(cachePath, serializeFile(result));
    return result;
  };
}
