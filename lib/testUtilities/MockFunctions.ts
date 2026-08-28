import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import stableStringify from 'fast-json-stable-stringify';
import { camelCase, omit, upperFirst } from 'lodash';
import { ApplicationError } from '../errors/applicationError';
import { isNotNullOrUndefined } from '../typescript/isNotNullOrUndefined';
import { promiseAllThrottled } from '../utilities/promiseAllThrottled';
import {
  getCurrentTestFile,
  getCurrentTestFileLegacy,
  getCurrentTestName,
} from './testState';
import { TestType, testNames } from './testTypes';

export interface DeserializeFileResult<ResultT> {
  data: ResultT;
  /**
   * We return the list of file paths that were read from to allow us to
   * delete unused test cache files.
   */
  readFilePaths: string[];
}

interface MockFunctionOptions<ResultT> {
  /**
   * By default, we cache every call of the underlying function. This allows
   * the user to disable storing to and using cache for some parameters.
   */
  shouldUseCache?: (...args: any[]) => boolean;
  /**
   * By default, we'll create cache files as upper-case camel-cased versions
   * of all arguments joined with underscores. This allows overriding it.
   */
  makeFilename?: (...args: any[]) => string;
  /**
   * Whether to suffix the filenames with a different number on each call.
   *
   * If a single test might make the same API call multiple times and expect
   * different results, set this to true.
   */
  addCallIndexToFilename?: boolean;
  /**
   * By default, we use fs.readFile() and JSON.parse to deserialize content
   * from files. This lets us override that.
   */
  deserializeFile?: (
    filePath: string
  ) => Promise<DeserializeFileResult<ResultT>>;
  /**
   * By default, we write buffers as-is and everything else as JSON. This lets
   * us override that.
   *
   * @returns paths to written files
   */
  serializeFile?: (filename: string, data: ResultT) => Promise<string[]>;
  /**
   * If we get an error/exception after calling the API, we also cache
   * the results in an .error.json file. If we want a custom serializer for
   * the error, we can pass it in here.
   */
  errorOptions?: {
    serialize?: (error: Error) => Record<string, unknown>;
    deserialize?: (errorData: Record<string, unknown>) => Error;
  };
  /**
   * By default, the cache folder will be named using the original function's
   * `.name`. If this is passed, will use this instead.
   */
  overrideCacheDir?: string;
  /**
   * By default, we'll always prevent running this in CI without a cache.
   * If we want to allow it to run without a cache sometimes in CI,
   * pass in this function.
   */
  shouldErrorInCI?: (...args: any[]) => boolean;
}

/**
 * Create a function that will run for real on a regular machine
 * (and make network calls), but rely on saved cache data in CI.
 *
 * This will work fine for both JSON data and plain Buffers. For functions
 * that return other data types, override the `serializeFile` and
 * `deserializeFile` functions.
 */
export function makeMockedPassThroughFunction<
  FunctionT extends (...args: any[]) => Promise<unknown>,
>(
  origFunction: FunctionT,
  /** The `__filename` of the containing script */
  scriptFileName: string,
  options: MockFunctionOptions<Awaited<ReturnType<FunctionT>>> = {}
): FunctionT {
  const mockedFunction = jest.fn(
    async (
      ...args: Parameters<FunctionT>
    ): Promise<Awaited<ReturnType<FunctionT>>> => {
      const shouldUseCache =
        allowCacheForCurrentTestType() &&
        // Avoid caching if we're being called from within another cached
        // function. Those extra cache files are unneeded and can be confusing
        // if someone wants to refresh the outer cache.
        inMockedPassThroughFunctionLayer === 0 &&
        // Avoid caching if MOCK_FUNCTIONS_SKIP_CACHE is set to allow rerunning
        // tests that use cached requests, e.g., to check flakiness.
        !process.env.MOCK_FUNCTIONS_SKIP_CACHE &&
        (!options.shouldUseCache || options.shouldUseCache(...args));

      const keyWithoutIndex = options.makeFilename
        ? options.makeFilename(...args)
        : defaultMakeFilename(...args);

      const key = options.addCallIndexToFilename
        ? `${keyWithoutIndex}_${mockedFunction.mock.calls.length}`
        : keyWithoutIndex;

      const cacheDir = getMockFunctionCacheDir({
        scriptFileName,
        origFunctionName: origFunction.name,
        overrideCacheDir: options.overrideCacheDir ?? null,
      });

      const file = `${cacheDir}/${key}`;
      const errorFile = `${file}.error.json`;

      if (process.env.MOCK_FUNCTIONS_DEBUG_INPUTS) {
        const inputFile = `${file}.input.json`;
        await fs.mkdir(cacheDir, { recursive: true });
        await fs.writeFile(inputFile, stringifyForDebug(args), 'utf8');
        console.info(`[MockFunctions] Input written to: ${inputFile}`);
      }

      // We changed the cache filename format to include the path hash to avoid
      // collisions when two files have the same basename. However, we still read
      // the old files so we can migrate gradually.
      //
      // Every mock that uses getCurrentTestFile() puts the prefix at the start
      // of the key, so we can substitute it with the old prefix to find old files.
      const newPrefix = getCurrentTestFile();
      const legacyPrefix = getCurrentTestFileLegacy();
      const legacyKey = key.startsWith(`${newPrefix}_`)
        ? key.replace(`${newPrefix}_`, `${legacyPrefix}_`)
        : null;
      const legacyFile = legacyKey !== null ? `${cacheDir}/${legacyKey}` : null;

      const deserializeOptions: Pick<
        DeserializeInnerOptions,
        'deserialize' | 'deserializeError'
      > = {
        deserialize: options.deserializeFile,
        deserializeError: options.errorOptions?.deserialize,
      };

      if (shouldUseCache) {
        const deserialized = await deserializeInner({
          ...deserializeOptions,
          file,
        });

        if (deserialized.success) {
          maybeLogMockFunctionCacheLookup({ key, hit: true });
          return deserialized.data as Awaited<ReturnType<FunctionT>>;
        }

        if (legacyFile !== null) {
          const legacyDeserialized = await deserializeInner({
            ...deserializeOptions,
            file: legacyFile,
          });

          if (legacyDeserialized.success) {
            maybeLogMockFunctionCacheLookup({ key, hit: true });
            return legacyDeserialized.data as Awaited<ReturnType<FunctionT>>;
          }
        }

        maybeLogMockFunctionCacheLookup({ key, hit: false });
      }

      if (!(options.shouldErrorInCI && !options.shouldErrorInCI(...args))) {
        throwIfInCI(
          [
            `Detailed error: we couldn't find the missing cache file ${file}`,
            `Arguments used to generate the cache key: ${stringifyForDebug(args)}`,
          ].join('\n')
        );
      }

      try {
        inMockedPassThroughFunctionLayer += 1;
        const result = (await origFunction(...args)) as Awaited<
          ReturnType<FunctionT>
        >;

        if (shouldUseCache) {
          await fs.mkdir(cacheDir, { recursive: true });
          const serialize = options.serializeFile ?? defaultSerializeFile;
          const fullFile = await serialize(file, result);
          usedFilePaths.push(...fullFile);
          // Don't return `result` since we may have consumed a generator while
          // serializing the file. Instead, just deserialize.
          const deserialized = await deserializeInner({
            ...deserializeOptions,
            file,
          });

          if (deserialized.success) {
            return deserialized.data as Awaited<ReturnType<FunctionT>>;
          }
        }

        return result;
      } catch (error) {
        if (shouldUseCache) {
          await fs.mkdir(cacheDir, { recursive: true });
          usedFilePaths.push(errorFile);
          const serializeError =
            options.errorOptions?.serialize ??
            defaultSerializeErrorForMockFunction;
          await fs.writeFile(
            errorFile,
            stringifyForDebug(
              serializeError(
                error instanceof Error ? error : new Error(String(error))
              )
            ),
            'utf8'
          );
        }
        throw error;
      } finally {
        inMockedPassThroughFunctionLayer -= 1;
      }
    }
  );

  return mockedFunction as unknown as FunctionT;
}

/** Default function for turning an error into a JSON-cacheable version */
export function defaultSerializeErrorForMockFunction(
  error: Error
): { name: string; message: string } & Record<string, unknown> {
  return {
    ...extractCustomErrorData(error),
    name: error instanceof ApplicationError ? 'ApplicationError' : error.name,
    message: error.message,
  };
}

/**
 * Default function for turning JSON representation of an Error/exception
 * on disk to a version to be thrown
 */
export function defaultDeserializeErrorForMockFunction(
  errorData: Record<string, unknown>
): Error {
  const { name, message, statusCode } = errorData;
  const errorName = typeof name === 'string' ? name : 'Error';
  const errorMessage = typeof message === 'string' ? message : '';
  let error: Error;

  if (errorName === 'ApplicationError') {
    error = new ApplicationError(
      errorMessage,
      typeof statusCode === 'number' ? statusCode : 400
    );
  } else {
    error = new Error(errorMessage);
  }

  error.name = errorName;
  addCustomDataToError(errorData, error);
  return error;
}

/** Gets the directory we should put the outputs for the mock function into */
export function getMockFunctionCacheDir({
  scriptFileName,
  origFunctionName,
  overrideCacheDir,
}: {
  scriptFileName: string;
  origFunctionName: string;
  overrideCacheDir: string | null;
}): string {
  const parsed = path.parse(scriptFileName);
  const { name, dir } = parsed;

  return `${dir}/__testData__/${name}/${overrideCacheDir || origFunctionName}`;
}

/** Gets the paths of all the cache files that we wrote or read from */
export function getUsedMockFunctionCacheFilePaths(): string[] {
  return usedFilePaths;
}

/** We don't want to use the cache for network/manual tests */
export function allowCacheForCurrentTestType(): boolean {
  const currentTestName = getCurrentTestName();
  if (currentTestName.length === 0) {
    // This is the case for a test() or it() not in a describe block,
    // or for beforeAll()/afterAll(), which means it's a normal test.
    return true;
  }

  const shouldCacheTestType: Record<TestType, boolean> = {
    [TestType.manual]: false,
  };

  const shouldNotCacheTestNames = Object.values(TestType)
    .map((type): string | null =>
      shouldCacheTestType[type] ? null : testNames[type]
    )
    .filter(isNotNullOrUndefined);

  return shouldNotCacheTestNames.every(
    (shouldNotCacheTestName) =>
      currentTestName !== shouldNotCacheTestName &&
      !currentTestName.startsWith(`${shouldNotCacheTestName} `)
  );
}

/**
 * Return an error for developers that shows only in CI, asking them
 * to cache any network calls
 */
export function throwIfInCI(extraErrorText?: string): void {
  if (!isCI()) {
    return;
  }

  const instructions = [
    'To avoid hitting network resources in automated testing, we mock them out.',
    'Help us by adding mocked data:',
    '',
    '1. Run your test locally on your machine',
    '2. Add and commit the files in `__testData__` that get created/changed',
    '',
    'If running locally does not create new cache files, run the test with',
    'MOCK_FUNCTIONS_DEBUG_INPUTS=1 and inspect the .input.json files next to',
    'the expected cache path (gitignored). Compare them to the',
    '"Arguments used to generate the cache key" JSON further down in this error',
    'to see what differs between CI and your local run.',
    '',
    'For cache key details, run with MOCK_FUNCTIONS_DEBUG_CACHE_KEY=1.',
  ];

  if (extraErrorText) instructions.push('', extraErrorText);

  throw new Error(instructions.join('\n'));
}

/**
 * Creates a standard filename hash from options object
 */
export function createHashForFilename(options: unknown): string {
  return md5(stableStringify(options)).slice(0, 8);
}

/**
 * Creates minimal headers by omitting common headers that change frequently
 * but don't affect the actual response
 */
export function createMinimalHeaders(
  headers: Record<string, unknown> | undefined
): Record<string, unknown> | undefined {
  return headers
    ? omit(headers, [
        'User-Agent',
        'user-agent',
        'Authorization',
        'PRIVATE-TOKEN',
        'private-token',
        'x-goog-api-client',
      ])
    : headers;
}

/** Whenever we read or write to a file, it's added here */
const usedFilePaths: string[] = [];

/**
 * If we're inside a mocked pass-through function, don't use cache for
 * anything else that's cached inside of it. That will cause multiple levels
 * of caching, which is unneeded.
 */
let inMockedPassThroughFunctionLayer = 0;

function maybeLogMockFunctionCacheLookup({
  key,
  hit,
}: {
  key: string;
  hit: boolean;
}): void {
  if (!process.env.MOCK_FUNCTIONS_DEBUG_CACHE_KEY) return;

  console.info(`[MockFunctions] Cache ${hit ? 'hit' : 'miss'}: ${key}`);
}

interface DeserializeInnerOptions {
  file: string;
  deserialize:
    ((filePath: string) => Promise<DeserializeFileResult<unknown>>) | undefined;
  deserializeError: ((data: Record<string, unknown>) => Error) | undefined;
}

async function deserializeInner({
  file,
  deserialize: passedDeserialize,
  deserializeError: passedDeserializeError,
}: DeserializeInnerOptions): Promise<
  { success: true; data: unknown } | { success: false }
> {
  const deserialize = passedDeserialize ?? defaultDeserializeFile;
  const deserializeError =
    passedDeserializeError ?? defaultDeserializeErrorForMockFunction;

  const jsonFile = `${file}.json`;
  const errorFile = `${file}.error.json`;

  const [fileExists, jsonExists, errorExists] = await promiseAllThrottled(
    [file, jsonFile, errorFile].map(
      (filePath) => async (): Promise<boolean> => fileExistsAsync(filePath)
    ),
    3
  );
  if (fileExists) {
    usedFilePaths.push(file);
    const { data, readFilePaths } = await deserialize(file);
    usedFilePaths.push(...readFilePaths);
    return { success: true, data };
  } else if (jsonExists) {
    const { data, readFilePaths } = await deserialize(jsonFile);
    usedFilePaths.push(...readFilePaths);
    return { success: true, data };
  } else if (errorExists) {
    usedFilePaths.push(errorFile);
    throw deserializeError(
      JSON.parse(await fs.readFile(errorFile, 'utf8')) as Record<
        string,
        unknown
      >
    );
  }

  return { success: false };
}

async function fileExistsAsync(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function defaultMakeFilename(...args: unknown[]): string {
  return args
    .map((arg: unknown) =>
      upperFirst(
        camelCase(
          arg && typeof (arg as { toString?: unknown }).toString === 'function'
            ? (arg as { toString: () => string }).toString()
            : ''
        )
      )
    )
    .join('_');
}

/**
 * A smart file deserializer that will first try to decode as JSON,
 * and on failure, return the standard buffer
 */
async function defaultDeserializeFile(
  filePath: string
): Promise<DeserializeFileResult<unknown>> {
  const buffer = await fs.readFile(filePath);
  const readFilePaths = [filePath];
  if (filePath.endsWith('.json')) {
    try {
      return { data: JSON.parse(buffer.toString('utf8')), readFilePaths };
    } catch {
      return { data: buffer, readFilePaths };
    }
  } else {
    return { data: buffer, readFilePaths };
  }
}

/**
 * A smart file serializer that will save buffers (binary data) as Buffers, and
 * everything else as JSON
 *
 * @returns filename we wrote
 */
async function defaultSerializeFile(
  filename: string,
  data: unknown
): Promise<string[]> {
  let fullFilename: string;
  if (Buffer.isBuffer(data)) {
    fullFilename = filename;
    await fs.writeFile(fullFilename, data);
  } else {
    fullFilename = `${filename}.json`;
    await fs.writeFile(fullFilename, JSON.stringify(data, null, 2), 'utf8');
  }

  return [fullFilename];
}

function extractCustomErrorData(error: Error): Record<string, unknown> {
  const customData: Record<string, unknown> = {};

  for (const key of Object.getOwnPropertyNames(error)) {
    if (!standardErrorFields.includes(key)) {
      customData[key] = (error as unknown as Record<string, unknown>)[key];
    }
  }

  return customData;
}

function addCustomDataToError(
  data: Record<string, unknown>,
  error: Error
): void {
  for (const [key, value] of Object.entries(data)) {
    if (!standardErrorFields.includes(key)) {
      // Reconstruct extra fields onto the cached Error instance.
      // eslint-disable-next-line no-param-reassign
      (error as unknown as Record<string, unknown>)[key] = value;
    }
  }
}

const standardErrorFields = ['message', 'stack', 'name'];

function stringifyForDebug(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function md5(value: string): string {
  // Cache keys only; not used for encryption.
  return createHash('md5').update(value).digest('hex');
}

function isCI(): boolean {
  // Cursor sets CI=1 for agent commands, but this breaks our mock functions, so
  // we need to ignore it.
  return Boolean(process.env.CI) && !process.env.CURSOR_AGENT;
}
