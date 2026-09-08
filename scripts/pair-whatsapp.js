/**
 * Script Resmi Runner Bot Worker WhatsApp
 * Menjalankan engine lengkap (Downloader, Stiker, AI, Menu, Supabase Sync)
 * Jalankan: node scripts/pair-whatsapp.js [nomor_wa]
 * Atau:     npm run worker
 */

const { spawn } = require('child_process');
const path = require('path');

const workerScript = path.join(__dirname, 'run-worker.ts');
const args = ['tsx', workerScript, ...process.argv.slice(2)];
const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const child = spawn(npxCmd, args, {
  stdio: 'inherit',
  shell: true,
  cwd: path.join(__dirname, '..'),
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
