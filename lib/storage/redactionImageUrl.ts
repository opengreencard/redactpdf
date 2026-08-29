import { digitalOceanSpacesRegion } from './digitalOceanSpacesRegion';
import {
  makeRedactionImageStorageKey,
  type RedactionImageKeyOptions,
} from './redactionImageKey';

/** Return the public virtual-hosted URL for one redaction page image. */
export function getUrlForRedactionImage(
  options: RedactionImageKeyOptions
): string {
  const bucket = process.env.NEXT_PUBLIC_S3_FILES_BUCKET;
  if (!bucket) {
    throw new Error('NEXT_PUBLIC_S3_FILES_BUCKET is not configured.');
  }

  return `https://${bucket}.${digitalOceanSpacesRegion}.digitaloceanspaces.com/${makeRedactionImageStorageKey(options)}`;
}
