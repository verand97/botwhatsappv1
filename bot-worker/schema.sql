-- Supabase PostgreSQL Database Schema
-- Berdasarkan Dokumen Spesifikasi botwhatsapp.md (§7)

-- 1. Tabel Akun Bot Instance (Koneksi Multi-Device Baileys)
create table if not exists bot_instances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  nomor_wa text,                      -- Terisi nomor telepon setelah scan QR sukses (mis. '+6281234567890')
  status text default 'disconnected', -- 'disconnected' | 'connecting' | 'connected' | 'error'
  session_data jsonb,                 -- Kredensial sesi Baileys (auth state), enkripsi di level aplikasi sebelum disimpan
  created_at timestamptz default now()
);

-- 2. Konfigurasi Modul Fitur per Bot Instance
create table if not exists feature_configs (
  id uuid primary key default gen_random_uuid(),
  bot_instance_id uuid references bot_instances(id) on delete cascade,
  feature_key text not null,          -- 'sticker_maker' | 'sticker_to_media' | 'downloader' | 'auto_reply' | 'ai_chat' | dst
  is_enabled boolean default true,
  command_trigger text,               -- Custom trigger pemicu (mis. '!s', '!sticker')
  extra_settings jsonb,               -- Pengaturan spesifik (mis. pack_name, author_name, auto_replies)
  updated_at timestamptz default now()
);

-- 3. Log Aktivitas & Riwayat Command Masuk (§7 Privasi: Nomor Wajib Disamarkan)
create table if not exists activity_logs (
  id uuid primary key default gen_random_uuid(),
  bot_instance_id uuid references bot_instances(id) on delete cascade,
  feature_key text,
  sender_masked text not null,        -- Nomor pengirim disamarkan sebagian demi privasi, mis. '62812***456'
  command text,
  status text,                        -- 'success' | 'rate_limited' | 'failed'
  execution_time_ms integer,
  created_at timestamptz default now()
);

-- 4. State Pelacak Rate Limit (§8 Anti-Abuse)
create table if not exists rate_limit_state (
  bot_instance_id uuid references bot_instances(id) on delete cascade,
  sender_masked text not null,
  last_command_at timestamptz default now(),
  command_count_minute integer default 1,
  primary key (bot_instance_id, sender_masked)
);

-- Enable Row Level Security (RLS)
alter table bot_instances enable row level security;
alter table feature_configs enable row level security;
alter table activity_logs enable row level security;
alter table rate_limit_state enable row level security;
