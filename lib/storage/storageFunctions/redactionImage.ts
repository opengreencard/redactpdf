import { S3Bucket } from '../buckets';
import {
  makeRedactionImageStorageKey,
  type RedactionImageKeyOptions,
} from '../redactionImageKey';
import { makeStorageFunctions } from '../storageFunctions';

export const {
  delete: deleteRedactionImage,
  bulkDelete: bulkDeleteRedactionImage,
  get: getRedactionImage,
  put: putRedactionImage,
} = makeStorageFunctions<RedactionImageKeyOptions>(
  makeRedactionImageStorageKey,
  {
    public: true,
    bucket: S3Bucket.files,
  }
);
