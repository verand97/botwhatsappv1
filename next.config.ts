import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    '@whiskeysockets/baileys',
    'sharp',
    'node-webpmux',
    'jimp',
    'pino',
    'qrcode',
    'ruhend-scraper',
    'btch-downloader',
    '@tobyg74/tiktok-api-dl',
    'api-dylux',
    'instagram-url-direct',
    'sadaslk-dlcore',
    'snapsave-media-downloader',
  ],
};

export default nextConfig;
