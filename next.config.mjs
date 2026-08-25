/** @type {import('next').NextConfig} */
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
