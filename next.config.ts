/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  basePath: '/piano-app', // リポジトリ名に合わせる
  assetPrefix: '/piano-app/'
}

module.exports = nextConfig