# ==============================================================================
# VERAND.BOT — PRODUCTION DOCKERFILE UNTUK NORTHFLANK / VPS / DOCKER
# ==============================================================================

FROM node:20-bullseye-slim

# Install dependency sistem (FFmpeg untuk downloader/stiker/audio & lib grafis)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    ca-certificates \
    git \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Salin definisi dependency
COPY package*.json ./

# Install semua dependency termasuk TypeScript runtime (tsx)
RUN npm install --legacy-peer-deps

# Salin seluruh source code proyek
COPY . .

# Buat direktori sessions untuk kredensial login WhatsApp
RUN mkdir -p /app/sessions

# Set environment production
ENV NODE_ENV=production

# Perintah utama: Menjalankan worker Baileys 24/7
CMD ["npm", "run", "worker"]
