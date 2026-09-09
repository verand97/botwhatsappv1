export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const { botManager } = await import('@/lib/bot/botManager');
      console.log('\n[Startup] Mengaktifkan WhatsApp Bot Engine di dalam Next.js...');
      botManager.startBot().catch((err) => {
        console.error('[Startup] Gagal mengaktifkan WhatsApp Bot:', err);
      });
    } catch (err) {
      console.warn('[Startup] Instrumentation error:', err);
    }
  }
}
