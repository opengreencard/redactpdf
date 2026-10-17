import http from 'node:http';
import type { AddressInfo } from 'node:net';
import config from '../config';
import { RenderPDFPagesOptions, renderPDFPages } from './pdfRenderer';

describe(renderPDFPages, () => {
  let server: http.Server;
  let originalRendererURL: string | undefined;
  let responseStatus: number;
  let responseContentType: string;
  let responseBody: string;

  beforeAll(async () => {
    server = http.createServer((_request, response) => {
      response.writeHead(responseStatus, {
        'Content-Type': responseContentType,
      });
      response.end(responseBody);
    });
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', resolve);
    });
    const { port } = server.address() as AddressInfo;
    originalRendererURL = config.pdfRendererURL;
    config.pdfRendererURL = `http://127.0.0.1:${port}`;
  });

  afterAll(async () => {
    config.pdfRendererURL = originalRendererURL;
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  const renderOptions: RenderPDFPagesOptions = {
    pdf: new Uint8Array([0x25, 0x50, 0x44, 0x46]),
    pages: [1],
    dpi: 72,
  };

  it('uses the JSON error and status when the renderer returns JSON', async () => {
    responseStatus = 400;
    responseContentType = 'application/json';
    responseBody = JSON.stringify({ error: 'Bad PDF' });

    await expect(renderPDFPages(renderOptions)).rejects.toThrow(
      'PDF renderer failed (400): Bad PDF'
    );
  });

  it('reports the status and raw text when the error body is not JSON', async () => {
    responseStatus = 502;
    responseContentType = 'text/html';
    responseBody = '<html><body>Bad Gateway</body></html>';

    await expect(renderPDFPages(renderOptions)).rejects.toThrow(
      'PDF renderer failed (502): <html><body>Bad Gateway</body></html>'
    );
  });
});
