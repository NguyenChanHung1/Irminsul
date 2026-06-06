/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "static.nanoka.cc",
      },
      {
        protocol: "https",
        hostname: "genshin.jmp.blue",
      },
      {
        protocol: "https",
        hostname: "api.genshin.dev",
      },
    ],
  },
};

module.exports = nextConfig;
