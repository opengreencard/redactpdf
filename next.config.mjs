import { existsSync } from 'node:fs';

// Next inlines NEXT_PUBLIC_* at build time. Load committed non-secret env
// so the files-bucket name is available without a gitignored .env file.
const environment =
  process.env.APP_MODE || process.env.NODE_ENV || 'development';
const nonsecretEnvPath = `.env.${environment}.nonsecret`;
if (existsSync(nonsecretEnvPath)) {
  process.loadEnvFile(nonsecretEnvPath);
}

/** @type {import('next').NextConfig} */
// .mjs cannot use TypeScript `const x: T` annotations; JSDoc above is the type.
/* eslint-disable-next-line no-restricted-syntax -- typed via JSDoc NextConfig */
const nextConfig = {
  reactStrictMode: true,
  // Keep Node-only packages out of the bundled server graph. sequelize loads
  // its MariaDB dialect at runtime; zstd-napi ships a native addon.
  serverExternalPackages: ['sequelize', 'zstd-napi'],
  experimental: {
    optimizePackageImports: ['@mantine/core', '@mantine/hooks'],
  },
};

export default nextConfig;
