import { S3Bucket } from '../buckets';
import { makeStorageFunctions } from '../storageFunctions';

/** Build the private Spaces key for an uploaded original PDF. */
function getStorageKeyForRedactionFile(key: string): string {
  return `redactions/${key}/original.pdf`;
}

const {
  put: putRedactionFile,
  get: getRedactionFile,
  delete: deleteRedactionFile,
} = makeStorageFunctions(getStorageKeyForRedactionFile, {
  public: false,
  bucket: S3Bucket.files,
});

export { putRedactionFile, getRedactionFile, deleteRedactionFile };
