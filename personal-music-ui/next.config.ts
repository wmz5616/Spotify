/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/api/album-art/**", // 已有的
      },
      {
        // 新增的部分
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/api/artist-image/**",
      },
    ],
  },
};

module.exports = nextConfig;
