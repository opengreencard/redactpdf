import express from 'express';
import decrypt from './decrypt';
import health from './health';
import render from './render';

/** Mount each feature router on the app. */
export function loadRoutes(app: express.Express): void {
  app.use('/health', health);
  app.use('/decrypt', decrypt);
  app.use('/render', render);
}
