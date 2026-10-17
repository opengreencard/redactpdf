import express, { NextFunction, Request, Response } from 'express';
import { ApplicationError } from '../lib/errors/applicationError';
import { sendError } from './errors';
import { loadRoutes } from './app/main';

/** PDFs can be large, so allow more than express's default body limit. */
const maxRequestBodySize = '100MB';

/**
 * Make the Express app for the PDF renderer. It runs Ghostscript on untrusted
 * PDFs, so it stays small: no sessions, no database, and no app secrets.
 */
export function makeExpressApp(): express.Express {
  // eslint-disable-next-line no-restricted-syntax
  const app = express();

  // The client sends the PDF with no Content-Type, so match every type. A
  // type filter would reject every request.
  app.use(express.raw({ type: () => true, limit: maxRequestBodySize }));

  loadRoutes(app);

  app.use((_req: Request, res: Response) => {
    sendError(res, new ApplicationError('Not found.', 404));
  });

  // Express recognizes error middleware by its four-argument signature, so
  // this handler must keep all four parameters.
  // eslint-disable-next-line max-params -- Express error middleware needs four arguments
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    sendError(res, err);
  });

  return app;
}
