/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000", // 明确指定后端的端口
        pathname: "/api/album-art/**", // 明确指定允许的路径
      },
    ],
  },
};

module.exports = nextConfig;
