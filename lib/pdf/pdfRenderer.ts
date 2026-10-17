import config from '../config';
import {
  decryptPDF as decryptPDFInProcess,
  renderPages as renderPagesInProcess,
} from '../../pdf-renderer/ghostscript';

/** Ghostscript can take a while on large pages at high DPI. */
const requestTimeoutMs = 180_000;

export interface RenderPDFPagesOptions {
  pdf: Uint8Array;
  /** 1-based page numbers. */
  pages: number[];
  dpi: number;
}

/**
 * Decrypt an encrypted PDF. The output has no encryption dictionary.
 *
 * Production sets PDF_RENDERER_URL so Ghostscript runs in the sidecar, which
 * has no app secrets. Without it, dev servers and tests run Ghostscript here.
 */
export async function decryptPDF(pdf: Uint8Array): Promise<Buffer> {
  const { pdfRendererURL } = config;
  if (!pdfRendererURL) {
    return decryptPDFInProcess(pdf);
  }
  const response = await postToRenderer(`${pdfRendererURL}/decrypt`, pdf);
  return Buffer.from(await response.arrayBuffer());
}

/** Render pages to PNG, keyed by 1-based page number. */
export async function renderPDFPages({
  pdf,
  pages,
  dpi,
}: RenderPDFPagesOptions): Promise<Map<number, Uint8Array>> {
  const { pdfRendererURL } = config;
  if (!pdfRendererURL) {
    const rendered = await renderPagesInProcess({ pdf, pages, dpi });
    return new Map(rendered.map(({ page, png }) => [page, png]));
  }

  const query = new URLSearchParams({
    pages: pages.join(','),
    dpi: String(dpi),
  });
  const response = await postToRenderer(
    `${pdfRendererURL}/render?${query}`,
    pdf
  );
  const { pages: renderedPages } = (await response.json()) as {
    pages: { page: number; png: string }[];
  };
  return new Map(
    renderedPages.map(({ page, png }) => [page, Buffer.from(png, 'base64')])
  );
}

async function postToRenderer(
  url: string,
  body: Uint8Array
): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      body: Buffer.from(body),
      signal: AbortSignal.timeout(requestTimeoutMs),
    });
  } catch (error) {
    throw new Error(
      `Could not reach the PDF renderer at ${url}. (${error.message})`
    );
  }

  if (!response.ok) {
    // The body is not always JSON. A proxy error page or a body-parser failure
    // can return HTML, so parse defensively and keep the status in the error.
    const text = await response.text();
    let message = text.slice(0, 500);
    try {
      message = (JSON.parse(text) as { error: string }).error ?? message;
    } catch {
      // Keep the raw text.
    }
    throw new Error(`PDF renderer failed (${response.status}): ${message}`);
  }
  return response;
}
