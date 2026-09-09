-- ==============================================================================
-- VERAND.BOT — DATABASE SCHEMA (PostgreSQL / Supabase / Neon)
-- ==============================================================================
-- Jalankan skrip ini di:
-- 1. Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql), ATAU
-- 2. Neon Console (https://console.neon.tech/)
-- ==============================================================================

-- 1. Tabel Akun Bot Instance (Koneksi Multi-Device Baileys)
create table if not exists bot_instances (
  id text primary key default 'inst-core',
  nomor_wa text,
  push_name text,
  status text default 'disconnected',
  session_data jsonb,
  created_at timestamptz default now()
);

-- 2. Tabel Konfigurasi Fitur
create table if not exists feature_configs (
  id text primary key,
  bot_instance_id text references bot_instances(id) on delete cascade,
  feature_key text not null,
  is_enabled boolean default true,
  command_trigger text,
  extra_settings jsonb default '{}'::jsonb,
  updated_at timestamptz default now()
);

-- 3. Tabel Log Aktivitas Pesan
create table if not exists activity_logs (
  id text primary key,
  bot_instance_id text references bot_instances(id) on delete cascade,
  feature_key text,
  sender_masked text not null,
  command text,
  status text,
  execution_time_ms integer,
  created_at timestamptz default now()
);

-- 4. Tabel Pelacak Rate Limit
create table if not exists rate_limit_state (
  bot_instance_id text references bot_instances(id) on delete cascade,
  sender_masked text not null,
  last_command_at timestamptz default now(),
  command_count_minute integer default 1,
  primary key (bot_instance_id, sender_masked)
);

-- Index untuk mempercepat query log aktivitas berdasarkan waktu
create index if not exists idx_activity_logs_created_at on activity_logs(created_at desc);

-- Insert bot instance default jika belum ada
insert into bot_instances (id, status)
values ('inst-core', 'disconnected')
on conflict (id) do nothing;
