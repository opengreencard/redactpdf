import { makeExpressApp } from '../app';

const host = '127.0.0.1';
const port = Number(process.env.PDF_RENDERER_PORT ?? 4100);

// Bind to localhost only. In production, the app container in the same pod is
// the only caller.
makeExpressApp().listen(port, host, () => {
  // eslint-disable-next-line no-console -- startup message for the process manager logs
  console.info(`PDF renderer listening on http://${host}:${port}`);
});
