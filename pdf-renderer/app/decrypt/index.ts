import express from 'express';
import { ApplicationError } from '../../../lib/errors/applicationError';
import { sendError } from '../../errors';
import { decryptPDF } from '../../ghostscript';

const router = express.Router();

/** Body: a PDF. Responds with the same PDF, unencrypted. */
router.post('/', async (req, res) => {
  try {
    // express.raw sets `req.body` to `{}` when the request has no body.
    if (!Buffer.isBuffer(req.body)) {
      throw new ApplicationError('Send the PDF as the request body.', 400);
    }
    const decrypted = await decryptPDF(req.body);
    res.type('application/pdf').send(decrypted);
  } catch (err) {
    sendError(res, err);
  }
});

export default router;
