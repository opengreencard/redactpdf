/**
 * Name for a downloaded redacted PDF: the original name without its `.pdf`
 * extension, then " redacted.pdf". For example, "Passport.pdf" becomes
 * "Passport redacted.pdf".
 *
 * Falls back to "redacted.pdf" when the name is empty, which happens for
 * documents uploaded before we stored the name.
 *
 * Used by both the browser download and the generate route's
 * Content-Disposition header, so they always agree.
 */
export function makeRedactedPDFFileName(originalFileName: string): string {
  const baseName = originalFileName.replace(/\.pdf$/i, '').trim();
  if (!baseName) {
    return 'redacted.pdf';
  }
  return `${baseName} redacted.pdf`;
}
