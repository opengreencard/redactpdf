import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ApplicationError } from '../errors/applicationError';
import { maybeDeleteUnusedCacheFiles } from './maybeDeleteUnusedCacheFiles';
import {
  createHashForFilename,
  makeMockedPassThroughFunction,
} from './MockFunctions';
import { getCurrentTestFile } from './testState';

describe(makeMockedPassThroughFunction, () => {
  let temporaryDirectory: string;

  beforeAll(async () => {
    temporaryDirectory = await fs.mkdtemp(
      path.join(os.tmpdir(), 'redaction-mock-functions-')
    );
  });

  afterAll(async () => {
    await fs.rm(temporaryDirectory, { recursive: true, force: true });
  });

  it('replays an identical request from its cache', async () => {
    let originalCallCount = 0;
    async function echoValue(value: string): Promise<string> {
      originalCallCount += 1;
      return value;
    }
    const mockedFunction = makeMockedPassThroughFunction(
      echoValue,
      path.join(temporaryDirectory, 'same-request.ts'),
      { shouldErrorInCI: () => false }
    );

    await expect(mockedFunction('What is 1 + 1?')).resolves.toBe(
      'What is 1 + 1?'
    );
    await expect(mockedFunction('What is 1 + 1?')).resolves.toBe(
      'What is 1 + 1?'
    );

    expect(originalCallCount).toBe(1);
  });

  it('uses separate cache entries for different requests', async () => {
    let originalCallCount = 0;
    async function echoValue(value: string): Promise<string> {
      originalCallCount += 1;
      return value;
    }
    const mockedFunction = makeMockedPassThroughFunction(
      echoValue,
      path.join(temporaryDirectory, 'different-requests.ts'),
      { shouldErrorInCI: () => false }
    );

    await expect(mockedFunction('first')).resolves.toBe('first');
    await expect(mockedFunction('second')).resolves.toBe('second');

    expect(originalCallCount).toBe(2);
  });

  it('hashes object arguments when makeFilename uses createHashForFilename', async () => {
    let originalCallCount = 0;
    async function echoRequest(request: { prompt: string }): Promise<string> {
      originalCallCount += 1;
      return request.prompt;
    }
    const mockedFunction = makeMockedPassThroughFunction(
      echoRequest,
      path.join(temporaryDirectory, 'object-requests.ts'),
      {
        shouldErrorInCI: () => false,
        makeFilename: (request: { prompt: string }): string =>
          `${getCurrentTestFile()}_${createHashForFilename(request)}`,
      }
    );

    await expect(mockedFunction({ prompt: 'first' })).resolves.toBe('first');
    await expect(mockedFunction({ prompt: 'second' })).resolves.toBe('second');
    await expect(mockedFunction({ prompt: 'first' })).resolves.toBe('first');

    expect(originalCallCount).toBe(2);
  });

  it('replays a cached error without calling the original function again', async () => {
    let originalCallCount = 0;
    async function throwApplicationError(_label: string): Promise<string> {
      originalCallCount += 1;
      throw new ApplicationError('provider unavailable', 503);
    }
    const mockedFunction = makeMockedPassThroughFunction(
      throwApplicationError,
      path.join(temporaryDirectory, 'cached-error.ts'),
      { shouldErrorInCI: () => false }
    );

    const firstError = await mockedFunction('provider-error').then(
      () => {
        throw new Error('expected throw');
      },
      (error: unknown) => error
    );
    const secondError = await mockedFunction('provider-error').then(
      () => {
        throw new Error('expected throw');
      },
      (error: unknown) => error
    );

    expect(firstError).toBeInstanceOf(ApplicationError);
    expect((firstError as ApplicationError).message).toBe(
      'provider unavailable'
    );
    expect((firstError as ApplicationError).statusCode).toBe(503);
    expect(secondError).toBeInstanceOf(ApplicationError);
    expect((secondError as ApplicationError).message).toBe(
      'provider unavailable'
    );
    expect((secondError as ApplicationError).statusCode).toBe(503);

    expect(originalCallCount).toBe(1);
  });

  it('deletes unused cache entries when explicitly requested', async () => {
    async function echoValue(value: string): Promise<string> {
      return value;
    }
    const scriptFileName = path.join(temporaryDirectory, 'cleanup.ts');
    const mockedFunction = makeMockedPassThroughFunction(
      echoValue,
      scriptFileName,
      {
        shouldErrorInCI: () => false,
        makeFilename: (value: string): string =>
          `${getCurrentTestFile()}_${value}`,
      }
    );
    await mockedFunction('used');

    const cacheDirectory = path.join(
      temporaryDirectory,
      '__testData__',
      'cleanup',
      'echoValue'
    );
    const unusedCachePath = path.join(
      cacheDirectory,
      `${getCurrentTestFile()}_unused.json`
    );
    await fs.writeFile(unusedCachePath, '"unused"');
    const previousDeleteUnused = process.env.DELETE_UNUSED;
    process.env.DELETE_UNUSED = '1';

    try {
      await maybeDeleteUnusedCacheFiles(
        'maybeDeleteUnusedCacheFiles',
        { echoValue },
        __filename,
        path.join(temporaryDirectory, 'cleanup.delete.ts')
      );
    } finally {
      if (previousDeleteUnused === undefined) {
        delete process.env.DELETE_UNUSED;
      } else {
        process.env.DELETE_UNUSED = previousDeleteUnused;
      }
    }

    await expect(fs.readFile(unusedCachePath)).rejects.toMatchObject({
      code: 'ENOENT',
    });
    await expect(
      fs.readFile(
        path.join(cacheDirectory, `${getCurrentTestFile()}_used.json`)
      )
    ).resolves.toBeDefined();
  });
});
