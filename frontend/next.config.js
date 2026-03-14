/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  serverRuntimeConfig: {
    port: 3001,
  },
}

module.exports = nextConfig
