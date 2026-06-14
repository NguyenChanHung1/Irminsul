/** @type {import('next').NextConfig} */
const { loadRootEnv } = require("../api/scripts/load-root-env");

loadRootEnv();

const NS_ASSET_BASE_URL = process.env.NS_ASSET_BASE_URL;
if (!NS_ASSET_BASE_URL) {
  throw new Error("NS_ASSET_BASE_URL must be set for /ns-assets image proxying.");
}
const nsAssetBaseUrl = NS_ASSET_BASE_URL.replace(/\/?$/, "/");

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.genshin.dev",
      },
      {
        protocol: "https",
        hostname: "genshin.jmp.blue",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/ns-assets/:path*",
        destination: `${nsAssetBaseUrl}:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
