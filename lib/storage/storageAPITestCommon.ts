import axios from 'axios';
import { getSignedUrlForObject, putObject } from './storageAPI';
import { S3Bucket } from './buckets';

export interface TestSignedUrlOptions {
  verifyFile?: boolean;
}

export interface TestSignedUrlResult {
  testKey: string;
  signedUrl: string;
}

/**
 * Common function for testing both in a mocked/unmocked environment
 * functions related to creating a signed URL
 */
export async function testSignedUrl(
  options: TestSignedUrlOptions = {}
): Promise<TestSignedUrlResult> {
  const testKey = 'test-file.txt';
  const testData = Buffer.from('Hello, world!');
  const testMimeType = 'text/plain';

  // Put an object first
  await putObject({
    key: testKey,
    data: testData,
    mimeType: testMimeType,
    ACL: 'private',
    bucket: S3Bucket.files,
  });

  // Get a signed URL for the object
  const signedUrl = await getSignedUrlForObject(testKey, {
    bucket: S3Bucket.files,
    expiresInSeconds: 1800, // 30 minutes
  });

  // Verify the signed URL is a valid URL
  expect(signedUrl).toMatch(/^https?:\/\//);
  expect(typeof signedUrl).toBe('string');
  expect(signedUrl.length).toBeGreaterThan(0);

  // If verifyFile is true, make an HTTP request to verify the file
  if (options.verifyFile) {
    const response = await axios.get(signedUrl);
    expect(response.status).toBe(200);
    expect(response.data).toBe('Hello, world!');
  }

  return { testKey, signedUrl };
}
