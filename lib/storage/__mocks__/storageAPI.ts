import { GetObjectCommandOutput, S3ServiceException } from '@aws-sdk/client-s3';
import { putObject as origPutObject } from '../storageAPI';

interface Metadata {
  ContentLength: number;
  ContentType: string;
  ContentEncoding: string | undefined;
}

interface FileData {
  data: Buffer;
  metadata: Metadata;
}

/** Instead of actually uploading to S3, we save files in memory */
const files: { [key: string]: FileData } = {};

/**
 * Pretend to put an object into S3/Digital Ocean spaces, but
 * actually just save it in memory
 */
export const putObject: typeof origPutObject = async ({
  key,
  data,
  mimeType,
  length,
  contentEncoding,
}) => {
  files[key] = {
    data: Buffer.from(data),
    metadata: {
      ContentLength: length || data.length,
      ContentType: mimeType || 'application/octet-stream',
      ContentEncoding: contentEncoding,
    },
  };
  // We don't really use the response type here
  return undefined as any;
};

/** Delete a single object */
export async function deleteObject(key: string) {
  delete files[key];
}

/** Bulk delete multiple objects */
export async function deleteObjects(keys: string[]) {
  for (const key of keys) {
    delete files[key];
  }
}

/**
 * This error is meant to mirror the actual error that the AWS S3 API
 * will throw if an object is missing.
 *
 * We use a function because directly creating a variable causes the stacktrace
 * to just contain the stacktrace of where the variable was defined, as well as
 * the `require` (or import) chain. That doesn't help us find the specific
 * calling function.
 */
function makeNoSuchKeyError() {
  // This is captured from a real S3 error by doing:
  // ```ts
  // const s3 = makeS3Client({ endpoint: 'sfo2.digitaloceanspaces.com' });
  // try {
  //   await s3.send(new GetObjectCommand({ Key: 'blah', bucket: 'blah' }));
  // } catch (err) {
  //   console.error(err);
  //   console.error(extractCustomErrorData(err));
  // }
  // ```
  const notFoundError: S3ServiceException = new S3ServiceException({
    name: 'NotFound',
    message: 'UnknownError',
    $metadata: {
      httpStatusCode: 404,
    },
    $response: {
      statusCode: 404,
      body: null,
      headers: {},
    },
    $fault: 'client',
  });

  return notFoundError;
}

/** Get metadata about an object */
export async function headObject(key: string) {
  if (!files[key]) {
    // Replicate normal behavior: trying to get a non-existent file throws
    throw makeNoSuchKeyError();
  }
  return files[key].metadata;
}

/** Get the data associated with an object */
export async function getObject(key: string): Promise<GetObjectCommandOutput> {
  if (!files[key]) {
    // Replicate normal behavior: trying to get a non-existent file throws
    throw makeNoSuchKeyError();
  }
  return {
    ...files[key].metadata,
    Body: {
      transformToByteArray: () => Promise.resolve(files[key].data),
      transformToString: (encoding: string) =>
        Promise.resolve(
          files[key].data.toString(
            encoding ? (encoding as BufferEncoding) : 'utf8'
          )
        ),
      transformToWebStream: () => {
        throw new Error('Not implemented in mocks yet');
      },
    } as any,
    $metadata: {},
  };
}

/** Get a signed URL for downloading an object (mocked) */
export async function getSignedUrlForObject(
  key: string,
  options: { expiresInSeconds?: number } = {}
): Promise<string> {
  if (!files[key]) {
    // Replicate normal behavior: trying to get a non-existent file throws
    throw makeNoSuchKeyError();
  }

  // Return a mock signed URL that includes the key for testing
  const { expiresInSeconds = 3600 } = options;
  return `https://mock-signed-url.example.com/${key}?expires=${Date.now() + expiresInSeconds * 1000}`;
}
