import express from 'express';
import { ApplicationError } from '../../../lib/errors/applicationError';
import { sendError } from '../../errors';
import { renderPages } from '../../pdfTools';

const router = express.Router();

// The client sends 12 pages per request (`renderBatchSize` in
// lib/pdf/pdfToImage.ts), so this limit must stay above that.
const maxPagesPerRequest = 50;

/**
 * Query: `pages` is a comma-separated list of 1-based page numbers, and `dpi`
 * is optional (default 150). Body: a PDF. Responds with each page's PNG as
 * base64.
 */
router.post('/', async (req, res) => {
  try {
    // express.raw sets `req.body` to `{}` when the request has no body.
    if (!Buffer.isBuffer(req.body)) {
      throw new ApplicationError('Send the PDF as the request body.', 400);
    }
    const pages = parsePages(req.query.pages);
    const dpi = parseDPI(req.query.dpi);
    const rendered = await renderPages({ pdf: req.body, pages, dpi });
    res.json({
      success: true,
      pages: rendered.map(({ page, png }): { page: number; png: string } => ({
        page,
        png: png.toString('base64'),
      })),
    });
  } catch (err) {
    sendError(res, err);
  }
});

function parsePages(value: unknown): number[] {
  const pages = typeof value === 'string' ? value.split(',').map(Number) : [];
  const valid =
    pages.length > 0 &&
    pages.length <= maxPagesPerRequest &&
    pages.every((page) => Number.isInteger(page) && page >= 1);
  if (!valid) {
    throw new ApplicationError(
      `pages must be 1 to ${maxPagesPerRequest} 1-based page numbers.`,
      400
    );
  }
  return pages;
}

function parseDPI(value: unknown): number {
  const dpi = typeof value === 'string' ? Number(value) : 150;
  if (!Number.isInteger(dpi) || dpi < 36 || dpi > 600) {
    throw new ApplicationError('dpi must be an integer from 36 to 600.', 400);
  }
  return dpi;
}

export default router;
