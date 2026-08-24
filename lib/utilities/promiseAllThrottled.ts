/**
 * Execute a bunch of promises in parallel, but only at most
 * so many at a time.
 *
 * IMPORTANT: Takes an array of promise *generator functions*, not promises.
 * This ensures promises are only created when a worker is ready to run them,
 * enabling proper throttling of concurrent execution.
 *
 * Copied from itineraries/mobile/sharedWithWeb/common/promise.ts
 */
export async function promiseAllThrottled<T>(
  promiseGenerators: (() => PromiseLike<T>)[],
  concurrency: number
): Promise<T[]> {
  const results: T[] = new Array(promiseGenerators.length);
  let nextIndex = 0;

  // Worker function that processes promises sequentially
  // Note that it is important to use async/await architecture rather than
  // resolve/reject architecture to ensure the stacktrace is stitched together
  // properly.
  async function startWorker() {
    while (nextIndex < promiseGenerators.length) {
      const currentIndex = nextIndex;
      nextIndex++;

      const generator = promiseGenerators[currentIndex];
      // eslint-disable-next-line no-await-in-loop
      results[currentIndex] = await generator();
    }
  }

  // Start up to `concurrency` workers
  const workers = Array.from(
    { length: Math.min(concurrency, promiseGenerators.length) },
    startWorker
  );

  // Wait for all workers to complete
  await Promise.all(workers);

  return results;
}
