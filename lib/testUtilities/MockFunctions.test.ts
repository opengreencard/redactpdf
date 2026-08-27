import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { makeMockedPassThroughFunction } from './MockFunctions';

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

  it('replays an identical JSON request from its cache', async () => {
    let originalCallCount = 0;
    const originalFunction = async (request: {
      prompt: string;
    }): Promise<string> => {
      originalCallCount += 1;
      return request.prompt;
    };
    const mockedFunction = makeMockedPassThroughFunction(
      originalFunction,
      path.join(temporaryDirectory, 'same-request.test.ts')
    );
    const request: { prompt: string } = { prompt: 'What is 1 + 1?' };

    await expect(mockedFunction(request)).resolves.toBe(request.prompt);
    await expect(mockedFunction(request)).resolves.toBe(request.prompt);

    expect(originalCallCount).toBe(1);
  });

  it('uses separate cache entries for different JSON requests', async () => {
    let originalCallCount = 0;
    const originalFunction = async (request: {
      prompt: string;
    }): Promise<string> => {
      originalCallCount += 1;
      return request.prompt;
    };
    const mockedFunction = makeMockedPassThroughFunction(
      originalFunction,
      path.join(temporaryDirectory, 'different-requests.test.ts')
    );
    const firstRequest: { prompt: string } = { prompt: 'first' };
    const secondRequest: { prompt: string } = { prompt: 'second' };

    await expect(mockedFunction(firstRequest)).resolves.toBe('first');
    await expect(mockedFunction(secondRequest)).resolves.toBe('second');

    expect(originalCallCount).toBe(2);
  });
});
