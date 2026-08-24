import db from '../db';

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
