/** Identifies one page image for a redaction document. */
export interface RedactionImageKeyOptions {
  key: string;
  page: number;
}

/** Build the stable object-name suffix for one redaction page image. */
export function makeRedactionImageKey({
  key,
  page,
}: RedactionImageKeyOptions): string {
  return `${key}-${page}`;
}

/** Build the complete public Spaces object key for one page image. */
export function makeRedactionImageStorageKey(
  options: RedactionImageKeyOptions
): string {
  return `redactions/${makeRedactionImageKey(options)}.jpg`;
}
