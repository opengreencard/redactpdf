import { S3Bucket } from '../buckets';
import { makeStorageFunctions } from '../storageFunctions';

/**
 * Spaces path for the original PDF. Upload and cleanup share this so we
 * delete the same object we wrote.
 */
function getStorageKeyForRedactionFile(key: string): string {
  return `redactions/${key}/original.pdf`;
}

const {
  put: putRedactionFile,
  get: getRedactionFile,
  delete: deleteRedactionFile,
  bulkDelete: bulkDeleteRedactionFile,
} = makeStorageFunctions(getStorageKeyForRedactionFile, {
  public: false,
  bucket: S3Bucket.files,
});

export {
  putRedactionFile,
  getRedactionFile,
  deleteRedactionFile,
  bulkDeleteRedactionFile,
};
