# Spesifikasi Website Dashboard Bot WhatsApp

### Platform Kelola Bot Multifungsi — Stiker Maker, Downloader, Auto-Reply, dll

---

## 1. Ringkasan Proyek

**Nama Proyek:** (working title) — mis. _Botify_ / _Wasap Panel_ / _Kendali_.
**Konsep:** Website dashboard untuk **membuat, menghubungkan, dan mengelola bot WhatsApp** milik pengguna sendiri — bukan bot publik satu arah, tapi _platform kontrol_ di mana pengguna scan QR (menghubungkan nomor WA mereka sendiri ke bot), lalu mengatur fitur apa saja yang aktif, melihat log aktivitas, dan mengelola perintah (command) secara visual tanpa perlu edit kode.

**Fitur inti yang diminta:**

1. **Stiker Maker** — kirim gambar/video pendek ke bot → otomatis dikonversi jadi stiker WA (WebP + metadata pack/author).
2. **Stiker to Media** — kirim stiker ke bot → dikonversi balik jadi gambar/GIF biasa.
3. Fitur tambahan umum yang lazim ada di bot WA "serbaguna" (§5) — downloader media sosial, auto-reply, grup tools, AI chat, converter lain, dsb.

> **Catatan penting soal legalitas & etika teknis:** bot WhatsApp non-resmi (menggunakan library seperti Baileys/whatsapp-web.js yang terhubung lewat protokol WhatsApp Web) berjalan di area abu-abu terhadap Ketentuan Layanan WhatsApp resmi — WhatsApp secara resmi hanya mendukung otomatisasi lewat **WhatsApp Business API** berbayar. Pendekatan non-resmi ini sangat umum dipakai komunitas developer Indonesia (ribuan bot serupa ada di GitHub), tapi tetap punya risiko: nomor bisa kena **banned** oleh WhatsApp jika mengirim pesan terlalu cepat/masif atau dipakai untuk spam. Spesifikasi ini dirancang untuk **penggunaan wajar skala personal/komunitas kecil** (grup teman, komunitas, testing) dengan built-in rate limiting (§7) — bukan untuk broadcast massal/spam ke banyak nomor asing, yang berisiko tinggi kena banned dan berpotensi disalahgunakan.

---

## 2. Tech Stack

| Layer                                            | Pilihan                                                                                           | Alasan                                                                                                                                                                                                                                                        |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dashboard/Website                                | **Next.js 14+ (App Router)**                                                                      | UI untuk kelola bot, lihat log, atur fitur                                                                                                                                                                                                                    |
| Styling                                          | **Tailwind CSS**                                                                                  |                                                                                                                                                                                                                                                               |
| Engine bot WhatsApp                              | **Baileys** (`@whiskeysockets/baileys`)                                                           | Library open-source paling aktif untuk koneksi WhatsApp Web multi-device, tidak perlu Chromium headless (lebih ringan dari whatsapp-web.js yang butuh Puppeteer)                                                                                              |
| Proses bot (long-running)                        | **Node.js worker terpisah** (bukan di dalam serverless function Next.js)                          | Koneksi WA harus tetap hidup terus-menerus (persistent socket) — tidak cocok di function serverless yang auto-mati. Jalankan sebagai proses terpisah di **VPS/Railway/Fly.io**, dashboard Next.js hanya jadi "remote control" via API/websocket ke proses ini |
| Database & Auth                                  | **Supabase** (Postgres + Auth + Realtime + Storage)                                               | Simpan sesi bot, konfigurasi fitur per pengguna, log pesan, dan file media (stiker/gambar)                                                                                                                                                                    |
| Konversi gambar↔stiker                           | **`sharp`** (resize/convert) + **`node-webpmux`** (inject metadata EXIF pack/author ke file WebP) | Kombinasi standar untuk bikin stiker WA yang valid dengan nama pack custom                                                                                                                                                                                    |
| Konversi video pendek→stiker animasi             | **`ffmpeg`** (via `fluent-ffmpeg`) untuk convert ke WebP animasi                                  | Untuk stiker bergerak                                                                                                                                                                                                                                         |
| Realtime status bot (QR, connected/disconnected) | **Supabase Realtime** atau **WebSocket langsung** dari worker ke dashboard                        | Dashboard perlu update status koneksi bot secara live tanpa refresh                                                                                                                                                                                           |
| Deploy dashboard                                 | Vercel                                                                                            |                                                                                                                                                                                                                                                               |
| Deploy bot worker                                | VPS kecil / Railway / Fly.io (butuh proses yang jalan 24/7, bukan serverless)                     |                                                                                                                                                                                                                                                               |

### Arsitektur Sistem

```
[Dashboard Next.js] ──login──► [Supabase Auth]
        │
        │ kelola & pantau
        ▼
[API Route Next.js] ───────► [Bot Worker Node.js (Baileys)] ◄──► [WhatsApp]
        │                            │
        │                            ▼
        └──────────► [Supabase: sesi, config, log, media]
```

**Kenapa dipisah dashboard & worker:** ini beda dari proyek-proyek sebelumnya — bot WA butuh proses yang menyala terus (koneksi socket persisten), sedangkan Next.js di Vercel bersifat serverless (mati setelah request selesai). Dashboard hanya mengatur konfigurasi & menampilkan status; proses bot sesungguhnya berjalan independen di server terpisah yang selalu hidup.

---

## 3. Design System (Token)

Ground truth visual: **panel kontrol/control room untuk "robot" personal** — bukan mockup mirip WhatsApp asli (menghindari kesan menyamar/phishing, juga alasan brand), dan bukan dashboard neon generik seperti kasus KKN sebelumnya. Arahnya: **modul-modul seperti kotak sirkuit/kontrol mesin**, mencerminkan bot sebagai "asisten mekanis" yang bisa disusun fitur-fiturnya seperti komponen.

### 3.1 Palet Warna

| Token            | Hex       | Peran                                                                                                                    |
| ---------------- | --------- | ------------------------------------------------------------------------------------------------------------------------ |
| `--panel-950`    | `#111417` | Background utama, netral gelap (bukan hijau WA — sengaja dihindari supaya brand sendiri tidak meniru identitas WhatsApp) |
| `--panel-800`    | `#1B1F24` | Card/module                                                                                                              |
| `--circuit-500`  | `#4C8FE0` | **Warna primer** — biru sirkuit, dipakai untuk aksi utama (Hubungkan Bot, Simpan Konfigurasi)                            |
| `--live-400`     | `#3ECF8E` | **Khusus status "Terhubung/Online"** — dipakai HANYA di indikator status koneksi bot                                     |
| `--offline-500`  | `#6B7280` | Khusus status "Terputus/Nonaktif"                                                                                        |
| `--alert-500`    | `#E2574C` | Khusus error/warning (mis. bot ke-banned, sesi expired, rate limit tercapai)                                             |
| `--module-amber` | `#DDA24C` | Aksen untuk badge fitur "beta/eksperimental"                                                                             |

**Aturan pemakaian:** status koneksi bot (online/offline/error) adalah elemen paling sering dilihat pengguna — SELALU pakai kombinasi warna + ikon + teks (bukan warna saja) untuk aksesibilitas, dan warna status ini tidak dipakai untuk elemen dekoratif lain di UI.

### 3.2 Tipografi

- **Display:** **Space Grotesk** — konsisten dengan tema "sistem presisi" yang sudah dipakai di proyek KKN, cocok untuk kesan panel kontrol teknis.
- **Body:** **Inter**.
- **Log/Command/Kode:** **JetBrains Mono** — krusial di sini karena dashboard akan menampilkan log pesan bot & daftar command (`!stiker`, `!tomedia`, dst) yang perlu dibedakan jelas dari teks biasa.

### 3.3 Layout & Signature Element

**Konsep layout:** Dashboard bergaya **"papan modul"** — tiap fitur bot (Stiker Maker, Downloader, Auto-Reply, dst) direpresentasikan sebagai **kartu modul yang bisa di-toggle on/off**, seperti menyalakan/mematikan chip di papan sirkuit. Bukan daftar menu sidebar biasa.

**Signature element:** Saat sebuah modul fitur di-toggle ON, ada animasi **garis energi mengalir** (SVG path dengan stroke animasi) dari toggle switch menuju ikon modul, seolah modul tersebut baru saja "dialiri listrik" — merepresentasikan fitur yang baru diaktifkan secara visual, bukan sekadar switch berubah warna. Halaman "Koneksi Bot" (scan QR) punya visual **QR code yang dikelilingi ring animasi berdenyut** selagi menunggu di-scan, berubah jadi ring hijau solid + checkmark saat berhasil connect.

### 3.4 Motion

- Toggle modul ON: garis energi mengalir (§3.3) + module card sedikit glow.
- Status berubah (connect/disconnect): transisi warna smooth + ikon berubah dengan crossfade, bukan langsung ganti.
- Log pesan masuk: baris baru slide-in dari bawah di panel log real-time, auto-scroll.
- QR menunggu scan: ring pulse berdenyut lambat, berubah checkmark hijau + confetti kecil saat berhasil (momen penting, layak dirayakan sedikit).
- Hormati `prefers-reduced-motion`.

---

## 4. Struktur Halaman

```
┌───────────────────────────────────────────┐
│ 1. Landing (penjelasan produk + CTA daftar)│
│ 2. Login/Register (Supabase Auth)          │
│ 3. Dashboard                                │
│    ├─ 3a. Koneksi Bot (scan QR)            │
│    ├─ 3b. Papan Modul Fitur (toggle)       │
│    ├─ 3c. Log Aktivitas Real-time          │
│    ├─ 3d. Statistik Penggunaan             │
│    └─ 3e. Pengaturan (rate limit, prefix)  │
└───────────────────────────────────────────┘
```

### 4.1 Landing Page

- Hero singkat: apa itu produk ini, tampilkan preview papan modul (§3.3) sebagai visual utama, bukan foto chat WA (hindari kesan meniru brand WhatsApp).
- CTA "Mulai Gratis" → Register.
- Daftar fitur singkat dalam grid ikon (Stiker Maker, Downloader, Auto-Reply, dst).
- Disclaimer singkat di footer: layanan pihak ketiga tidak berafiliasi resmi dengan WhatsApp/Meta, gunakan sesuai kebijakan wajar (anti-spam).

### 4.2 Koneksi Bot (halaman paling krusial)

- Tombol "Hubungkan Nomor WA" → tampilkan QR code besar di tengah (§3.3).
- Instruksi step-by-step ringkas: buka WhatsApp di HP → Perangkat Tertaut → Scan QR.
- Status real-time: `Menunggu Scan` → `Menghubungkan...` → `Terhubung sebagai +62xxx`.
- Tombol "Putuskan Koneksi" jika ingin logout bot dari nomor tersebut.

### 4.3 Papan Modul Fitur

Grid kartu modul, tiap kartu berisi:

- Ikon fitur + nama (mis. "Stiker Maker").
- Toggle ON/OFF.
- Command trigger yang dipakai (mis. `!sticker`, `!s`) — bisa di-custom pengguna.
- Klik kartu → expand pengaturan spesifik fitur tsb (lihat §5 detail tiap fitur).

### 4.4 Log Aktivitas

- List real-time: siapa (nomor terenkripsi/tersamar sebagian demi privasi) mengirim command apa, kapan, berhasil/gagal.
- Filter per fitur, per rentang waktu.
- Berguna untuk debug & melihat fitur mana yang paling sering dipakai.

### 4.5 Statistik Penggunaan

- Chart sederhana: jumlah command terproses per hari, fitur paling populer, total stiker dibuat.

### 4.6 Pengaturan

- **Rate limit:** atur jeda minimum antar respons bot (detik) — penting untuk kepatuhan §7 anti-banned.
- **Prefix command:** ubah simbol trigger default (`!`, `/`, `.`).
- **Daftar hitam/putih nomor:** siapa saja yang boleh/tidak boleh pakai bot ini (mis. hanya grup tertentu).

---

## 5. Daftar Fitur Bot (Modul)

### 5.1 Stiker Maker (fitur utama diminta)

- **Gambar → Stiker:** terima foto (JPG/PNG), resize otomatis ke 512x512 (standar WA), convert ke WebP, inject metadata nama pack & author custom via `node-webpmux`.
- **Video pendek → Stiker Animasi:** terima video < 10 detik, convert ke WebP animasi via ffmpeg, kompres agar tidak melebihi batas ukuran stiker WA (~500KB).
- **Stiker → Media (kebalikan):** terima stiker WebP, convert balik ke PNG/JPG (statis) atau GIF/MP4 (jika stiker animasi), kirim balik ke pengguna.
- Command contoh: `!sticker` (reply ke gambar/video), `!toimg` atau `!tomedia` (reply ke stiker).

### 5.2 Fitur Umum Lain (lazim di bot WA serbaguna)

- **Downloader media sosial:** unduh video/gambar dari link YouTube/TikTok/Instagram yang dikirim ke bot (perhatikan ToS platform terkait & hak cipta konten yang diunduh).
- **Auto-reply/FAQ:** balasan otomatis untuk keyword tertentu (berguna untuk admin grup/UMKM kecil).
- **Grup tools:** kick/promote/demote member (khusus admin grup), welcome message member baru, anti-link spam sederhana.
- **Konverter lain:** teks-ke-suara (TTS), convert PDF ke gambar, convert satuan/mata uang.
- **AI Chat:** integrasi ke API model bahasa untuk tanya-jawab santai di grup (opsional, butuh API key terpisah).
- **Reminder/Jadwal:** set pengingat personal via chat WA (mirip fitur Kanban sebelumnya tapi berbasis chat).
- **Game teks ringan:** tebak kata, kuis singkat untuk keramaian grup.

---

## 6. Struktur Komponen (Next.js Dashboard)

```
app/
├── (marketing)/page.tsx
├── (auth)/login|register/page.tsx
├── dashboard/
│   ├── page.tsx                     # overview + status koneksi
│   ├── koneksi/page.tsx             # halaman QR
│   ├── fitur/page.tsx               # papan modul
│   ├── log/page.tsx
│   ├── statistik/page.tsx
│   └── pengaturan/page.tsx
components/
├── dashboard/
│   ├── QrConnectPanel.tsx
│   ├── ModuleCard.tsx               # 1 kartu fitur + toggle + energy line animation
│   ├── ActivityLogRow.tsx
│   └── StatChart.tsx
lib/
├── supabase/client.ts
└── botApi.ts                        # client untuk komunikasi ke Bot Worker (REST/WebSocket)

--- (repo terpisah, bukan bagian Next.js) ---
bot-worker/
├── index.ts                         # inisialisasi Baileys socket
├── handlers/
│   ├── stickerMaker.ts
│   ├── stickerToMedia.ts
│   ├── downloader.ts
│   └── autoReply.ts
├── middleware/
│   └── rateLimiter.ts
└── utils/
    └── mediaConvert.ts               # wrapper sharp + node-webpmux + ffmpeg
```

---

## 7. Skema Database Supabase

```sql
-- Akun pengguna platform (terpisah dari nomor WA yang dihubungkan)
create table bot_instances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  nomor_wa text,                      -- terisi setelah berhasil connect
  status text default 'disconnected', -- 'disconnected' | 'connecting' | 'connected' | 'error'
  session_data jsonb,                 -- kredensial sesi Baileys (auth state), enkripsi di level aplikasi
  created_at timestamptz default now()
);

-- Konfigurasi tiap modul fitur per bot instance
create table feature_configs (
  id uuid primary key default gen_random_uuid(),
  bot_instance_id uuid references bot_instances(id) on delete cascade,
  feature_key text not null,          -- 'sticker_maker' | 'downloader' | dst
  is_enabled boolean default true,
  command_trigger text,               -- custom, mis. '!s'
  extra_settings jsonb                -- pengaturan spesifik fitur (mis. nama pack stiker default)
);

-- Log aktivitas/command
create table activity_logs (
  id uuid primary key default gen_random_uuid(),
  bot_instance_id uuid references bot_instances(id) on delete cascade,
  feature_key text,
  sender_masked text,                 -- nomor pengirim disamarkan sebagian, mis. '62812***456'
  status text,                        -- 'success' | 'failed'
  created_at timestamptz default now()
);

-- Rate limit tracking sederhana
create table rate_limit_state (
  bot_instance_id uuid references bot_instances(id) on delete cascade,
  sender_masked text,
  last_command_at timestamptz,
  primary key (bot_instance_id, sender_masked)
);
```

**Keamanan sesi:** `session_data` (kredensial Baileys) sangat sensitif — setara "kunci" ke akun WhatsApp pengguna. Enkripsi kolom ini di level aplikasi (mis. `pgsodium`/`pgcrypto` di Supabase) sebelum simpan, jangan pernah expose ke client.

**Privasi log:** nomor pengirim di `activity_logs` **wajib disamarkan sebagian** (`sender_masked`), bukan disimpan penuh, untuk mengurangi risiko privasi jika data log bocor.

---

## 8. Anti-Abuse & Kepatuhan Wajar (bagian penting, jangan dilewati)

- **Rate limiting wajib default aktif:** batasi respons bot per pengirim (mis. maksimal 1 command per 3–5 detik) untuk mengurangi risiko nomor WA di-banned karena dianggap spam oleh sistem WhatsApp.
- **Batas broadcast:** jika ada fitur kirim pesan ke banyak kontak sekaligus, beri batas jumlah maksimal per hari dan jeda antar pengiriman — desain sistem ini **untuk bot personal/komunitas kecil**, bukan alat spam massal.
- **Tidak menyimpan isi pesan pribadi** lebih dari yang perlu untuk fitur berjalan — log cukup simpan metadata (fitur dipakai, waktu, status), bukan isi chat lengkap pengguna.
- **Peringatan sesi ganda:** satu nomor WA idealnya hanya terhubung ke satu instance bot aktif — cegah pengguna connect nomor yang sama di banyak akun dashboard berbeda (berisiko konflik sesi & meningkatkan risiko flagged).
- **Terms of Service produk:** cantumkan jelas bahwa pengguna bertanggung jawab menggunakan bot sesuai kebijakan WhatsApp, dan layanan ini bisa nonaktifkan bot yang terdeteksi dipakai untuk spam/penyalahgunaan.

---

## 9. Roadmap Pengembangan

| Fase                                         | Fokus                                                                                    | Output                                            |
| -------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------- |
| **Fase 1 — Koneksi & Core**                  | Setup Baileys worker, halaman QR connect, status realtime                                | Bot bisa connect ke 1 nomor WA dan menerima pesan |
| **Fase 2 — Stiker Maker**                    | Implementasi gambar↔stiker (sharp + node-webpmux + ffmpeg)                               | Fitur utama yang diminta berjalan penuh           |
| **Fase 3 — Papan Modul & Dashboard Lengkap** | UI toggle fitur, log realtime, statistik                                                 | Pengguna bisa kelola bot tanpa sentuh kode        |
| **Fase 4 — Fitur Tambahan**                  | Downloader, auto-reply, grup tools, AI chat (§5.2)                                       | Bot jadi "serbaguna" sesuai permintaan            |
| **Fase 5 — Anti-abuse & Skalabilitas**       | Rate limiter matang, enkripsi sesi, multi-instance per user, monitoring banned-detection | Siap dipakai lebih banyak pengguna dengan aman    |

---

## 10. Catatan untuk AI Coding Assistant

- **Bot worker (Baileys) harus di-develop & di-deploy terpisah dari dashboard Next.js** — jangan coba jalankan koneksi socket persisten di dalam API route Vercel, ini akan gagal karena sifat serverless yang mati setelah request selesai.
- Mulai dari §7 (skema data) dan koneksi QR dasar sebelum menyentuh fitur stiker — pastikan siklus connect/disconnect/reconnect bot stabil dulu, karena ini fondasi semua fitur lain.
- Implementasi Stiker Maker: uji dengan berbagai rasio gambar (portrait/landscape) untuk pastikan crop/resize ke 512x512 tidak merusak komposisi gambar penting.
- Terapkan rate limiter (§8) sejak Fase 1, jangan ditunda ke akhir — ini bagian fundamental yang melindungi pengguna dari resiko banned, bukan fitur tambahan opsional.
- Simpan kredensial sesi Baileys terenkripsi, dan jangan pernah log/tampilkan isi `session_data` di dashboard maupun log aplikasi.
