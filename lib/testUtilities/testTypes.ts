/** Test suites that are intentionally excluded from regular Jest runs. */
export enum TestType {
  manual = 'manual',
}

/** `describe()` titles for each test type. Keep in sync with `describeManualTest`. */
export const testNames: Record<TestType, string> = {
  [TestType.manual]: 'manual test',
};

/** Return whether a test type was explicitly enabled by TEST_TYPES. */
export function shouldRunTestType(testType: TestType): boolean {
  return new Set((process.env.TEST_TYPES ?? '').split(',')).has(testType);
}

/**
 * Group tests that make live, billed, or otherwise manual-only requests.
 *
 * Run these with `TEST_TYPES=manual yarn jest <test-file>`.
 */
export function describeManualTest(testBody: jest.EmptyFunction): void {
  const testName = testNames[TestType.manual];
  if (shouldRunTestType(TestType.manual)) {
    describe(testName, testBody);
  } else {
    // eslint-disable-next-line jest/no-disabled-tests
    describe.skip(testName, testBody);
  }
}
