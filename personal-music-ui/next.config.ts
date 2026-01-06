/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3001",
        // 允许来自 /covers/ 的所有图片
        pathname: "/static/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "3001",
        // 允许来自 /artist-images/ 的所有图片
        pathname: "/artist-images/**",
      },
    ],
  },
};

module.exports = nextConfig;
