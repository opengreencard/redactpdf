async function main(): Promise<void> {
  // The cleanup worker is introduced in task 3.2. Keep this executable
  // intentionally inert so deployments can add the process before its job is
  // implemented.
}

main().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exitCode = 1;
});
