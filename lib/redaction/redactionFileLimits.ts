/** Largest PDF we accept for redaction, in MiB (1 MiB = 1024 * 1024 bytes). */
export const maxRedactionFileSizeMB = 50;

/** `maxRedactionFileSizeMB` in bytes, for comparing against file sizes. */
export const maxRedactionFileSizeBytes = maxRedactionFileSizeMB * 1024 * 1024;
