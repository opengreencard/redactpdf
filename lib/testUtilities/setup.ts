import config from '../config';
import db from '../db';
import '../allDatabaseModels';

//
// This file includes mocks for modules that are mocked by default
// for tests. Usually, these are APIs that we don't want to call or other
// libraries that don't work well with Jest.
//

jest.mock('../auth/nextAuth', () => ({
  authServerHandlers: { GET: jest.fn(), POST: jest.fn() },
  signInOnServer: jest.fn(),
  signOutOnServer: jest.fn(),
  getAuthState: jest.fn(),
}));

// We mock all S3/DigitalOcean spaces calls by default
// This is the canonical global mock; individual tests must reuse it.
// eslint-disable-next-line no-restricted-syntax
jest.mock('../storage/storageAPI');

// Billed OpenAI-compatible vision calls use a global record/replay mock.
// Individual tests must reuse this mock rather than adding another mock. Manual
// integration tests use jest.unmock() to call the provider directly.
// eslint-disable-next-line no-restricted-syntax
jest.mock('../ai/createOpenAICompatibleCompletion');

// PDF renders differ across machines, which changes the vision cache
// keys. Renders use a global record/replay mock for that reason. Tests of the
// real client use jest.unmock().
// eslint-disable-next-line no-restricted-syntax
jest.mock('../pdf/pdfRenderer');

// Each Jest worker has its own empty database, created in globalSetup. Create
// any missing tables once per file; files in one worker run one at a time. The
// test-data generator tests run against real databases, so they skip this.
beforeAll(async () => {
  if (config.isTest) {
    await db.sync();
  }
});

afterAll(async () => {
  await db.close();
});

beforeAll(() => {
  // Without this, if we try to render a Mantine component, we'll get an error
  // like:
  // > Error: Uncaught [TypeError: window.matchMedia is not a function]
  // > The above error occurred in the <@mantine/core/MantineProvider> component
  //
  // See https://stackoverflow.com/a/53449595
  if (typeof window !== 'undefined') {
    // Only do this in jsdom environment; otherwise, we get
    // > ReferenceError: window is not defined
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query: string): MediaQueryList => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  }
});
