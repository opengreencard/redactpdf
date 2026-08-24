import {
  CommonStorageOptions,
  deleteObject,
  deleteObjects,
  getObject,
  getSignedUrlForObject,
  headObject,
  putObject,
} from './storageAPI';
import { getUnreachableError } from '../typescript/getUnreachableError';
import {
  gunzipPromise,
  gzipPromise,
  zstdCompressPromise,
  zstdDecompressPromise,
} from './compression';

//
// This file has various functions that make it easier to get, set,
// delete, and read the metadata given a storage key
//

export interface MakeStorageFunctionsOptions extends CommonStorageOptions {
  /**
   * Whether the file should be publicly accessible at
   * e.g., https://itin-dev.sfo2.digitaloceanspaces.com/key/blahblahblah
   *    or https://itin-dev.wanderlogstatic.com/key/blahblahblah
   *
   * Set to:
   * - true if this is used for hosting static assets that end users should
   *   be able to access (e.g., images, Javascript files, etc.)
   * - false if this is used for internal data used by our applications
   */
  public: boolean;
  mimeType?: string;
}

/**
 * Simple call that makes put, get, getMetadata, and delete functions
 * for a single type of object
 */
export function makeStorageFunctions<KeyT = string>(
  keyTransform: (key: KeyT) => string,
  {
    public: putPublic,
    mimeType,
    ...storageOptions
  }: MakeStorageFunctionsOptions
) {
  // TODO: explicitly type the object literal or suppress this error. See https://www.notion.so/wanderlog/Coding-conventions-and-style-guide-d4350bf13ecf4492820c4f61432c3e86?pvs=4#64acc5bcc7914973a921d981d1140842
  // eslint-disable-next-line no-restricted-syntax
  return {
    get: makeGetFunc(keyTransform, storageOptions),
    getMetadata: makeGetMetadataFunc(keyTransform, storageOptions),
    getSignedUrl: makeGetSignedUrlFunc(keyTransform, storageOptions),
    put: makePutDataFunc(
      keyTransform,
      putPublic ? 'public-read' : 'private',
      storageOptions
    ),
    delete: makeDeleteFunc(keyTransform, storageOptions),
    bulkDelete: makeBulkDeleteFunc(keyTransform, storageOptions),
  };
}

/**
 * Simple call that makes put, get, getMetadata, and delete functions
 * for a single type of object
 */
export function makeStorageFunctionsForStringData<
  KeyT = string,
  /**
   * If using the `getJSON` and `putJSON` functions, will enforce a type
   * for the JSON that's inserted/retrieved
   */
  JSONValueT = unknown,
>(
  keyTransform: (key: KeyT) => string,
  storageOptions: MakeStorageFunctionsOptions & MakePutStringDataFuncOptions
) {
  const baseFunctions = makeStorageFunctions(keyTransform, storageOptions);
  const { public: putPublic, mimeType } = storageOptions;

  const getString = makeGetStringFunc(keyTransform, storageOptions);
  const putString = makePutStringDataFunc(
    keyTransform,
    putPublic ? 'public-read' : 'private',
    mimeType || 'application/json',
    storageOptions
  );

  const getJSON = async (key: KeyT): Promise<JSONValueT> =>
    JSON.parse(await getString(key));
  const putJSON = (key: KeyT, data: JSONValueT) =>
    putString(key, JSON.stringify(data));

  // TODO: explicitly type the object literal or suppress this error. See https://www.notion.so/wanderlog/Coding-conventions-and-style-guide-d4350bf13ecf4492820c4f61432c3e86?pvs=4#64acc5bcc7914973a921d981d1140842
  // eslint-disable-next-line no-restricted-syntax
  return {
    ...baseFunctions,
    getString,
    getJSON,
    putString,
    putJSON,
  };
}

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** Run a S3 operation with retries if we get a SlowDown or other error */
export async function runWithRetries<RetType>(
  func: () => PromiseLike<RetType>,
  retriesLeft: number = 3,
  backOff: number = 50
): Promise<RetType> {
  try {
    const ret = await func();
    return ret;
  } catch (err) {
    if (err.name === 'SlowDown') {
      await delay(backOff);
      return runWithRetries(func, retriesLeft - 1, backOff * 2);
    } else if (retriesLeft > 0) {
      return runWithRetries(func, retriesLeft - 1);
    } else {
      throw err;
    }
  }
}

/** Creates a function that deletes an item from our S3 bucket */
function makeDeleteFunc<KeyT = string>(
  keyTransform: (key: KeyT) => string,
  options: CommonStorageOptions
) {
  return (key: KeyT) => deleteObject(keyTransform(key), options);
}

/**
 * Creates a function that deletes multiple items from our S3 bucket in a
 * single request
 */
function makeBulkDeleteFunc<KeyT = string>(
  keyTransform: (key: KeyT) => string,
  options: CommonStorageOptions
) {
  return (keys: KeyT[]) => deleteObjects(keys.map(keyTransform), options);
}

export interface MakePutStringDataFuncOptions extends PutStringDataCompressionOptions {}

interface PutStringDataCompressionOptions {
  /**
   * Whether to transparently compress the data using gzip.
   * Use 'gzip' if the data needs to be retrieved by end-user browsers,
   * or 'zstd' if it's being retrieved by a server-side process.
   *
   * Use null if we don't want compression (rare, but might be possible if
   * we really want to save minimal amounts of CPU time)
   */
  compress: 'gzip' | 'zstd' | null;
}

/** Creates a function that puts something into our S3 bucket */
function makePutStringDataFunc<KeyT = string>(
  keyTransform: (key: KeyT) => string,
  accessLevel: 'public-read' | 'private',
  mimeType: string,
  storageOptions: CommonStorageOptions & MakePutStringDataFuncOptions
) {
  return async (
    key: KeyT,
    data: string,
    options: Partial<PutStringDataCompressionOptions> = {}
  ) => {
    const rawBuffer = Buffer.from(data, 'utf8');
    let bufferToUpload: Buffer;

    // Generally, string data is well-suited for compression
    let contentEncoding: 'gzip' | 'zstd' | undefined;
    const compress =
      // Note: we don't use options.compress ?? storageOptions.compress
      // because we want to treat `null`
      options.compress === undefined
        ? storageOptions.compress
        : options.compress;

    switch (compress) {
      case 'gzip':
        bufferToUpload = await gzipPromise(rawBuffer);
        contentEncoding = 'gzip';
        break;

      case 'zstd':
        bufferToUpload = await zstdCompressPromise(rawBuffer);
        contentEncoding = 'zstd';
        break;

      case null:
        bufferToUpload = rawBuffer;
        contentEncoding = undefined;
        break;

      default:
        getUnreachableError(compress);
        bufferToUpload = rawBuffer;
        contentEncoding = undefined;
        break;
    }

    return runWithRetries(() =>
      putObject({
        ...storageOptions,
        ACL: accessLevel,
        key: keyTransform(key),
        data: bufferToUpload,
        length: bufferToUpload.length,
        mimeType,
        contentEncoding,
      })
    );
  };
}

export interface PutDataOptions {
  downloadFilename?: string;
  contentEncoding?: 'gzip';
}

/** Creates a function that puts something binary into our S3 bucket */
function makePutDataFunc<KeyT = string>(
  keyTransform: (key: KeyT) => string,
  accessLevel: 'public-read' | 'private',
  storageOptions: CommonStorageOptions
) {
  return (
    data: Uint8Array,
    mimeType: string,
    key: KeyT,
    options: PutDataOptions = {}
  ) => {
    const { downloadFilename, contentEncoding } = options;
    return runWithRetries(() =>
      putObject({
        ...storageOptions,
        ...(downloadFilename
          ? {
              contentDisposition: `attachment; filename="${encodeURIComponent(
                downloadFilename
              )}"`,
            }
          : {}),
        ACL: accessLevel,
        key: keyTransform(key),
        data,
        length: data.length,
        mimeType,
        contentEncoding,
      })
    );
  };
}

/**
 * Creates a function that gets the metadata for something in our public S3
 * bucket
 */
function makeGetMetadataFunc<KeyT>(
  keyTransform: (key: KeyT) => string,
  options: CommonStorageOptions
) {
  return (key: KeyT) => headObject(keyTransform(key), options);
}

/**
 * Creates a function that gets the data for a string object in our public S3
 * bucket
 */
function makeGetStringFunc<KeyT = string>(
  keyTransform: (key: KeyT) => string,
  options: CommonStorageOptions
) {
  return async (key: KeyT): Promise<string> => {
    const result = await getObject(keyTransform(key), options);

    if (!result.Body) return '';

    if (result.ContentEncoding === 'gzip') {
      const buffer = await gunzipPromise(
        Buffer.from(await result.Body.transformToByteArray())
      );
      return buffer.toString('utf8');
    } else if (result.ContentEncoding === 'zstd') {
      const buffer = await zstdDecompressPromise(
        Buffer.from(await result.Body.transformToByteArray())
      );
      return buffer.toString('utf8');
    } else {
      return result.Body.transformToString('utf8');
    }
  };
}

/**
 * Creates a function that gets the data for a binary object in our public S3
 * bucket
 */
function makeGetFunc<KeyT = string>(
  keyTransform: (key: KeyT) => string,
  options: CommonStorageOptions
) {
  return async (key: KeyT) => {
    const body = (await getObject(keyTransform(key), options)).Body;

    if (!body) return Buffer.alloc(0);
    return Buffer.from(await body.transformToByteArray());
  };
}

/**
 * Creates a function that gets a signed URL for downloading an object
 */
function makeGetSignedUrlFunc<KeyT = string>(
  keyTransform: (key: KeyT) => string,
  options: CommonStorageOptions
) {
  return (
    key: KeyT,
    { expiresInSeconds = 3600 }: { expiresInSeconds?: number } = {}
  ) =>
    getSignedUrlForObject(keyTransform(key), {
      ...options,
      expiresInSeconds,
    });
}
