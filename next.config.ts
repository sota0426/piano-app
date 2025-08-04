/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/piano-app',
  assetPrefix: '/piano-app/',
  images: {
    unoptimized: true,
  },  
};

module.exports = nextConfig;
