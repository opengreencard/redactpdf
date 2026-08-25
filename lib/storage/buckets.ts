import config from '../config';

export enum S3Bucket {
  /**
   * S3-compatible bucket for files that are meant to be downloaded/uploaded
   * by users and others.
   */
  files = 'files',
  /**
   * Bucket for data (e.g., large JSON blobs) that are used internally
   * by the app. Stored separately from files for more isolation/performance.
   */
  data = 'data',
}

/**
 * Convert a bucket enum value to the actual bucket name.
 * Keep in sync with NEXT_PUBLIC_S3_FILES_BUCKET in .env.*.nonsecret
 * (`redaction-${S3_BUCKET_PREFIX}-files`).
 */
export function getS3Bucket(bucket: S3Bucket): string {
  return `redaction-${config.s3.bucketPrefix}-${bucket}`;
}
