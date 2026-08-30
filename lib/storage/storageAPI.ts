import {
  BucketCannedACL,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  GetObjectCommandOutput,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectAclCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getS3Bucket, S3Bucket } from './buckets';
import { digitalOceanSpacesRegion } from './digitalOceanSpacesRegion';
import config from '../config';

const s3 = new S3Client({
  endpoint: `https://${digitalOceanSpacesRegion}.digitaloceanspaces.com`,
  region: digitalOceanSpacesRegion,
  credentials: {
    accessKeyId: config.s3.accessKeyId,
    secretAccessKey: config.s3.secretAccessKey,
  },
});

//
// This file is responsible for all the actual API calls to S3/
// DigitalOcean spaces
//

/** Options that are available for every DigitalOcean Spaces/S3 operation */
export interface CommonStorageOptions {
  /**
   * If passed in, will use this aws.S3 instance instead of the usual.
   * Useful for testing S3-compatible storage engines other than
   * DigitalOcean Spaces
   */
  s3?: S3Client;

  /**
   * The bucket that the operation should act on. In general, we either want
   * to use `files` or `data`, depending on whether we're using a bucket where
   * we're primarily uploading e.g., JSON to be used by the application or
   * files/images that are meant to be downloaded by users.
   */
  bucket: S3Bucket;

  /**
   * When making a request, how long to wait until we time out the request.
   *
   * NOTE: even though the types in HttpHandlerOptions say that this is only
   * the connection timeout, it's actually the full rquest timeout: see
   * node_modules/@smithy/node-http-handler/dist-es/node-http-handler.js
   * for the implementation
   */
  requestTimeoutMs?: number;
}

/** Put an object into S3/Digital Ocean spaces */
export function putObject({
  key,
  data,
  mimeType,
  ACL,
  length,
  contentEncoding,
  contentDisposition,
  bucket,
  s3: optionsS3,
  requestTimeoutMs,
}: {
  key: string;
  data: any;
  mimeType: string | undefined;
  /** Either public-read or private */
  ACL: 'public-read' | 'private';
  length?: number;
  /** If the data is compressed, using contentEncoding: 'gzip' */
  contentEncoding?: 'gzip' | 'zstd';
  contentDisposition?: string;
} & CommonStorageOptions) {
  return (optionsS3 ?? s3).send(
    new PutObjectCommand({
      ACL,
      Bucket: getS3Bucket(bucket),
      Key: key,
      Body: data,
      ContentLength: length || data.length,
      ContentType: mimeType,
      ContentEncoding: contentEncoding,
      ContentDisposition: contentDisposition,
    }),
    { requestTimeout: requestTimeoutMs }
  );
}

/** List objects */
export async function listObjects(
  prefix: string,
  options: CommonStorageOptions
) {
  return (options.s3 ?? s3).send(
    new ListObjectsV2Command({
      Bucket: getS3Bucket(options.bucket),
      Prefix: prefix,
    }),
    { requestTimeout: options.requestTimeoutMs }
  );
}

/** Delete a single object */
export async function deleteObject(key: string, options: CommonStorageOptions) {
  return (options.s3 ?? s3).send(
    new DeleteObjectCommand({ Bucket: getS3Bucket(options.bucket), Key: key }),
    { requestTimeout: options.requestTimeoutMs }
  );
}

/** Bulk delete multiple objects */
export async function deleteObjects(
  keys: string[],
  options: CommonStorageOptions
) {
  return (options.s3 ?? s3).send(
    new DeleteObjectsCommand({
      Bucket: getS3Bucket(options.bucket),
      // TODO: explicitly type the object literal or suppress this error. See https://www.notion.so/wanderlog/Coding-conventions-and-style-guide-d4350bf13ecf4492820c4f61432c3e86?pvs=4#64acc5bcc7914973a921d981d1140842
      // eslint-disable-next-line no-restricted-syntax
      Delete: { Objects: keys.map((key) => ({ Key: key })) },
    }),
    { requestTimeout: options.requestTimeoutMs }
  );
}

/** Get metadata about an object */
export async function headObject(key: string, options: CommonStorageOptions) {
  return (options.s3 ?? s3).send(
    new HeadObjectCommand({ Bucket: getS3Bucket(options.bucket), Key: key }),
    { requestTimeout: options.requestTimeoutMs }
  );
}

/** Get the data associated with an object */
export async function getObject(
  key: string,
  options: CommonStorageOptions
): Promise<GetObjectCommandOutput> {
  return (options.s3 ?? s3).send(
    new GetObjectCommand({ Bucket: getS3Bucket(options.bucket), Key: key }),
    { requestTimeout: options.requestTimeoutMs }
  );
}

/**
 * Set the access control level (i.e. whether public users can download it)
 * associated with an object
 */
export async function putObjectAcl(
  key: string,
  acl: BucketCannedACL,
  options: CommonStorageOptions
) {
  return (options.s3 ?? s3).send(
    new PutObjectAclCommand({
      Bucket: getS3Bucket(options.bucket),
      Key: key,
      ACL: acl,
    }),
    { requestTimeout: options.requestTimeoutMs }
  );
}

/** Get a signed URL for downloading an object */
export async function getSignedUrlForObject(
  key: string,
  options: CommonStorageOptions & { expiresInSeconds?: number }
) {
  const { expiresInSeconds = 3600, ...commonOptions } = options; // Default to 1 hour
  return getSignedUrl(
    commonOptions.s3 ?? s3,
    new GetObjectCommand({
      Bucket: getS3Bucket(commonOptions.bucket),
      Key: key,
    }),
    { expiresIn: expiresInSeconds }
  );
}
