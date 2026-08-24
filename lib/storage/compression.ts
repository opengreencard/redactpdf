import {
  CompressParameters,
  compress as zstdCompress,
  decompress as zstdDecompress,
} from 'zstd-napi';
import zlib from 'zlib';

/**
 * Compress some data in a Promise interface
 * @deprecated: use zstd in most cases, as it compresses better for the same
 * speed
 */
export function gzipPromise(data: Buffer) {
  return new Promise<Buffer>((resolve, reject) => {
    // Level of 4 is a lot faster to compress, so less likely to bottleneck:
    // Based on http://web.archive.org/web/20230820230555/https://clearlinux.org/sites/default/files/2zlib-curve-distro.png
    zlib.gzip(data, { level: 4 }, (err, compressed) => {
      if (err) reject(err);
      resolve(compressed);
    });
  });
}

/** Decompress some data in a Promise interface */
export function gunzipPromise(data: Buffer) {
  return new Promise<Buffer>((resolve, reject) => {
    zlib.gunzip(data, (err, decompressed) => {
      if (err) reject(err);
      resolve(decompressed);
    });
  });
}

/**
 * Compress some data using zstd with default options that mimic the
 * how long compression would take with gzipPromise
 */
export async function zstdCompressPromise(
  data: Buffer,
  options: Omit<CompressParameters, 'dictsize'> = {
    // Level 6 is a good balance between speed and compression ratio and
    // achieve about 70% the size of gzip at the same speed
    //
    // To test, I ran (on a devbox with some contention/CPU steal):
    // yarn run-prod yarn b-node
    // server/scripts/oneTime/20241109-benchmarkZstdPageCacheCompression.ts
    // --zstdCompressionLevel 6
    //
    // and got:
    // - gzip:
    //   - 328.97 MB
    //   - Took 66.344s to compress
    //   - Took 34.243s to decompress
    // - zstd:
    //   - 229.31 MB
    //   - Took 65.074s to compress
    //   - Took 12.174s to decompress
    compressionLevel: 6,
  }
) {
  return zstdCompress(data, options);
}

/**
 * Compress some data using zstd with default options that mimic the
 * how long compression would take with gzipPromise
 */
export const zstdDecompressPromise = zstdDecompress;

/**
 * Check if some binary data is gzip based on the first few bytes:
 * https://en.wikipedia.org/wiki/Gzip#File_format
 *
 * > "gzip" is often also used to refer to the gzip file format, which is:
 * >
 * > - a 10-byte header, containing a magic number (1f 8b)...
 */
export function isGzipData(data: Buffer) {
  return data[0] === 0x1f && data[1] === 0x8b;
}

/**
 * Check if some binary data is zstd based on the first few bytes:
 * https://en.wikipedia.org/wiki/Zstd#Usage
 *
 * > Magic number: 28 b5 2f fd
 * > https://datatracker.ietf.org/doc/html/rfc8878
 */
export function isZstdData(data: Buffer) {
  return (
    data[0] === 0x28 && data[1] === 0xb5 && data[2] === 0x2f && data[3] === 0xfd
  );
}
