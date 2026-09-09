# Verand.Bot — Asisten Robot WhatsApp Multifungsi (Local Edition)

Pusat kontrol dan otomatisasi bot WhatsApp modern berbasis **Next.js**, **Baileys**, dan **Tailwind CSS**. Proyek ini dirancang untuk berjalan **sepenuhnya di perangkat lokal (PC / Laptop Windows Anda)** secara cepat, mandiri, dan stabil.

---

## 🌟 Fitur Utama

- 🟢 **Koneksi WhatsApp Resmi**: Terhubung via QR Code scan langsung di web dashboard atau kode pairing 8 digit.
- 🎨 **Stiker Maker Instan**: Buat stiker statis (`/sticker` / `/s`) dan stiker animasi dari video/GIF otomatis dengan metadata custom.
- 🔄 **Stiker to Media**: Konversi stiker WhatsApp kembali menjadi gambar PNG jernih (`/tomedia`).
- 📥 **All-in-One Media Downloader**: Unduh video, gambar carousel/slide, dan audio dari TikTok, Instagram, YouTube, Facebook, Twitter/X (`/dl <link>`).
- 🤖 **Asisten Cerdas AI**: Tanya jawab cerdas berbasis AI Gemini (`/ai <pertanyaan>`).
- 🎛️ **Pusat Kontrol Dashboard**: Pantau status koneksi, kelola toggle fitur secara on/off, atur limit pesan per menit, dan pantau log aktivitas live di `http://localhost:3000`.

---

## 🛠️ Prasyarat Sistem

1. **Node.js**: Versi 20.x atau lebih baru.
2. **Koneksi Internet**: Untuk sinkronisasi Baileys ke server WhatsApp.
3. **Akun Supabase (Opsional tapi disarankan)**: Untuk sinkronisasi realtime status bot dan log aktivitas ke antarmuka web.

---

## 🚀 Cara Menjalankan di Perangkat Lokal

### 1. Jalankan Cukup dengan 1 Perintah (`npm run dev`)

Cukup buka terminal di folder proyek ini, lalu jalankan:

```bash
npm run dev
```

**Keduanya langsung aktif dalam 1 proses bersamaan:**
- 🌐 **Dashboard Web**: Otomatis aktif di [http://localhost:3000](http://localhost:3000).
- 🤖 **Bot WhatsApp (Baileys)**: Otomatis langsung terhubung ke WhatsApp dan siap memproses perintah pesan masuk.

Tidak perlu membuka terminal kedua, tidak perlu menjalankan worker terpisah, dan tidak perlu setup sesi ganda.

---

### 2. Reset Sesi WhatsApp (Jika Ingin Ganti Akun)

Jika ingin mengganti nomor WhatsApp atau menghapus sesi login:
```bash
npm run worker:reset
```

---

## 📱 Menghubungkan Perangkat WhatsApp

Ada 2 cara praktis untuk menautkan nomor WhatsApp Anda:

1. **Scan QR Code di Web Dashboard**:
   - Buka `http://localhost:3000/koneksi`.
   - Buka WhatsApp di HP Anda > **Titik Tiga / Pengaturan** > **Perangkat Tertaut** > **Tautkan Perangkat**.
   - Arahkan kamera HP ke QR Code yang muncul di layar.

2. **Gunakan Pairing Code 8 Digit (Tanpa Kamera)**:
   - Jalankan worker dengan menyertakan nomor HP Anda (format internasional tanpa tanda +, contoh `62851xxxx`):
     ```bash
     npm run worker -- 6285196092326
     ```
   - Masukkan kode 8 digit yang muncul di terminal atau dashboard ke WhatsApp HP Anda (**Tautkan dengan nomor telepon saja**).

---

## 🔄 Reset Sesi WhatsApp

Jika Anda ingin mengganti nomor WhatsApp atau menghapus sesi login yang tersimpan:

```bash
npm run worker:reset
```

Perintah ini akan membersihkan direktori `sessions/baileys_auth` dan menyiapkan bot untuk scan/pairing baru.

---

## 📁 Struktur Direktori Penting

```
botwav1/
├── app/                  # Halaman Web Next.js (Dashboard, Koneksi, Fitur, Log, Pengaturan)
├── components/           # Komponen UI dashboard & kontrol panel
├── lib/
│   ├── bot/              # Logika bot Baileys (botManager.ts, handler pesan, stiker, downloader)
│   ├── supabase/         # Koneksi database realtime (client.ts)
│   └── constants.ts      # Konfigurasi default fitur & limitasi
├── scripts/
│   ├── run-worker.ts     # Runner proses bot WhatsApp lokal
│   └── test-db-connection.js # Uji koneksi database Supabase
├── sessions/             # Kredensial sesi WhatsApp lokal (otomatis dibuat & aman di PC Anda)
└── package.json
```

---

## 🛡️ Keamanan & Privasi

- Sesi WhatsApp Anda disimpan secara lokal di folder `sessions/baileys_auth/` di komputer Anda.
- Sesi ini tidak pernah diunggah ke pihak ketiga dan sudah ditambahkan ke `.gitignore`.
- Jangan bagikan isi folder `sessions/` kepada siapapun.
