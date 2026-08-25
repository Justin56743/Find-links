import axios from 'axios';

let keepAliveTimer = null;

export const initKeepAlive = () => {
  // Render automatically provides RENDER_EXTERNAL_URL in production
  const targetUrl = process.env.RENDER_EXTERNAL_URL || process.env.KEEP_ALIVE_URL || process.env.PUBLIC_API_URL;

  if (!targetUrl) {
    console.log('[KeepAlive] ℹ️ No external URL defined (RENDER_EXTERNAL_URL). Running in local mode.');
    return;
  }

  const pingUrl = targetUrl.endsWith('/api/health') 
    ? targetUrl 
    : `${targetUrl.replace(/\/+$/, '')}/api/health`;

  console.log(`[KeepAlive] 💓 Starting 24/7 keep-alive pinger for: ${pingUrl} (Every 8 minutes)`);

  const ping = async () => {
    try {
      const start = Date.now();
      const res = await axios.get(pingUrl, { timeout: 15000 });
      const duration = Date.now() - start;
      console.log(`[KeepAlive] 💓 Heartbeat ping successful (${res.status} OK in ${duration}ms) at ${new Date().toISOString()}`);
    } catch (err) {
      console.warn(`[KeepAlive] ⚠️ Heartbeat ping warning: ${err.message}`);
    }
  };

  // Initial ping after 30 seconds
  setTimeout(ping, 30000);

  // Repeat every 8 minutes (480,000 ms) to beat Render's 15-minute sleep timer
  if (keepAliveTimer) clearInterval(keepAliveTimer);
  keepAliveTimer = setInterval(ping, 8 * 60 * 1000);
};
