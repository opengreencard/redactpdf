'use client';

/** Inputs for downloading bytes as a browser file. */
interface DownloadArrayBufferAsFileOptions {
  arrayBuffer: ArrayBuffer;
  contentType: string;
  fileName: string;
}

/**
 * Trigger a browser download for an in-memory file without leaving an object
 * URL behind.
 *
 * The temporary link must be attached to the document for browsers that do not
 * dispatch clicks on detached anchors.
 */
export function downloadArrayBufferAsFile({
  arrayBuffer,
  contentType,
  fileName,
}: DownloadArrayBufferAsFileOptions): void {
  const blob = new Blob([arrayBuffer], { type: contentType });
  const objectURL = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectURL;
  link.download = fileName;
  document.body.appendChild(link);

  try {
    link.click();
  } finally {
    link.remove();
    URL.revokeObjectURL(objectURL);
  }
}
