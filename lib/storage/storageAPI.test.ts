import { getSignedUrlForObject } from './storageAPI';
import { testSignedUrl } from './storageAPITestCommon';

describe(getSignedUrlForObject, () => {
  // eslint-disable-next-line jest/expect-expect
  it('should put an object, get a signed URL, and verify the URL format', async () => {
    await testSignedUrl();
  });
});
