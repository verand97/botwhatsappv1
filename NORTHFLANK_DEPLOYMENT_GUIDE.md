# 🚀 PANDUAN LENGKAP DEPLOY BOT WHATSAPP DI NORTHFLANK (24/7 ONLINE)

Panduan langkah demi langkah untuk menjalankan engine WhatsApp Bot (Baileys Worker) secara **24 jam nonstop di cloud Northflank**, terhubung langsung dengan **Supabase Database** dan **Vercel Dashboard**.

---

## 🌟 Mengapa Menggunakan Northflank?
1. **Online 24/7 Nonstop**: Anda tidak perlu menyalakan laptop/komputer atau menjalankan `npm run worker` terus-menerus.
2. **Persistent Storage (Volume)**: Sesi login WhatsApp tidak akan hilang atau logout meskipun server di-restart atau di-update.
3. **Terintegrasi Penuh**: Northflank menjalankan bot worker, Supabase menyimpan data & sesi, dan Vercel menampilkan UI dashboard kontrol.

---

## 📋 Prasyarat
- Akun GitHub yang sudah berisi repository proyek `botwhatsappv1`.
- Akun Northflank ([Daftar gratis di northflank.com](https://northflank.com)).

---

## 🛠️ LANGKAH 1: Buat Project di Northflank

1. Login ke dashboard [Northflank](https://app.northflank.com/).
2. Klik tombol **Create Project** di pojok kanan atas.
3. Isi informasi project:
   - **Project name**: `verand-bot`
   - **Region**: Pilih region terdekat (misal: `Europe (Frankfurt)` atau `US Central`).
4. Klik **Create Project**.

---

## 💾 LANGKAH 2: Buat Persistent Volume (Penyimpan Sesi WhatsApp)

> ⚠️ **SANGAT PENTING:** Volume ini memastikan kredensial login WhatsApp Anda tersimpan permanen sehingga bot tidak perlu scan ulang setiap kali restart.

1. Di dalam project `verand-bot`, buka menu **Volumes** pada sidebar sebelah kiri.
2. Klik tombol **Create Volume**.
3. Atur konfigurasi berikut:
   - **Volume name**: `bot-session`
   - **Storage size**: `1 GB` (sangat cukup untuk data auth WhatsApp).
4. Klik **Create Volume**.

---

## ⚙️ LANGKAH 3: Buat Deployment Service (Worker)

1. Buka menu **Services** pada sidebar sebelah kiri.
2. Klik tombol **Create Service** > Pilih **Deployment Service**.
3. Konfigurasikan service seperti berikut:

### A. Detail Service
- **Service name**: `whatsapp-worker`

### B. Source Repository
- **Source**: Pilih **Build from Git repository**.
- **Repository**: Pilih akun GitHub Anda dan pilih repository `botwhatsappv1`.
- **Branch**: Pilih `main`.

### C. Build Configuration
- **Build type**: Pilih **Dockerfile**.
- **Dockerfile path**: Biarkan default (`Dockerfile`).
- Northflank akan otomatis menggunakan `Dockerfile` yang sudah kita sediakan (lengkap dengan Node 20 & FFmpeg untuk downloader/stiker).

### D. Networking (Port)
- **Nonaktifkan Networking**: Hilangkan centang atau jangan tambahkan port, karena worker ini berjalan murni di background (*Background Worker*).

### E. Volumes (Pasang Penyimpanan Sesi)
1. Gulir ke bagian **Volumes**.
2. Klik **Attach existing volume**.
3. Pilih:
   - **Volume**: `bot-session`
   - **Mount path**: `/app/sessions` *(Wajib persis seperti ini)*

### F. Environment Variables (Variabel Lingkungan)
Gulir ke bagian **Environment variables**, lalu tambahkan kunci-kunci berikut (ambil nilai dari file `.env.local` Anda):

| Key | Nilai (Contoh) | Keterangan |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://rcuvnxdsfsvdzozpvcqq.supabase.co` | URL Supabase Anda |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOi...` | Anon Key Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOi...` | Service Role Key Supabase |
| `IS_WORKER` | `true` | Menandai container sebagai dedicated Baileys worker |
| `GEMINI_API_KEY` | `AIzaSy...` (Opsional) | API Key Google Gemini untuk fitur `/ai` |
| `NODE_ENV` | `production` | Mode produksi |

---

## 🚀 LANGKAH 4: Deploy Service

1. Klik tombol **Create Service** di bagian bawah halaman.
2. Northflank akan otomatis memulai proses:
   - Mengunduh repository GitHub Anda.
   - Membangun container Docker (menginstall FFmpeg, Baileys, Sharp, dll).
   - Menjalankan perintah `npm run worker`.
3. Tunggu 2–3 menit hingga status berubah menjadi **Running (Hijau 🟢)**.

---

## 📱 LANGKAH 5: Menghubungkan Bot ke WhatsApp Anda (Dari Website)

Setelah worker di Northflank berstatus **Running 🟢**, buka dashboard website Anda:
👉 **[https://botwhatsappv1.vercel.app/dashboard/koneksi](https://botwhatsappv1.vercel.app/dashboard/koneksi)**

Anda dapat memilih salah satu dari **2 metode penautan yang didukung penuh di website**:

### Opsi A: Scan QR Code di Website
1. Di tab **QR Code Resmi**, QR Code yang dihasilkan oleh worker Northflank akan tampil secara otomatis di layar browser.
2. Buka WhatsApp di HP Anda > **Titik Tiga / Pengaturan** > **Perangkat Tertaut** > **Tautkan Perangkat**.
3. Arahkan kamera HP ke layar website.
4. Begitu ter-scan, dashboard website akan langsung berubah status menjadi **ONLINE 🟢**!

### Opsi B: Gunakan 8-Digit Pairing Code (Tanpa Perlu Scan Kamera)
1. Di website, klik tab **Pairing Code (8-Digit)**.
2. Masukkan nomor WhatsApp Anda (contoh: `6285196092326`).
3. Klik tombol **Dapatkan 8-Digit Pairing Code**.
4. Website akan berkomunikasi dengan worker di Northflank melalui Supabase, lalu menampilkan 8-digit kode resmi (contoh: `64T2-G3XC`) di layar website Anda.
5. Buka WhatsApp di HP Anda:
   - Masuk ke **Perangkat Tertaut** > **Tautkan Perangkat**.
   - Ketuk **"Tautkan dengan nomor telepon saja"**.
   - Masukkan 8 karakter kode tersebut.
6. Selesai! Bot langsung tersambung dan aktif 24/7.

---

## 💡 Troubleshooting & Tips

- **Bagaimana jika bot terputus?**
  Northflank memiliki fitur *Auto-Restart*, jika koneksi terputus sesaat karena gangguan jaringan, Northflank akan otomatis menyambungkan kembali tanpa perlu tindakan manual.
- **Apakah pulsa/kuota laptop terpakai?**
  Tidak sama sekali! Karena seluruh pemrosesan media, unduh video, stiker, dan AI dijalankan langsung di server cloud Northflank.
