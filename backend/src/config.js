import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  jwtSecret: process.env.JWT_SECRET || 'find_links_secret_key_2026',
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    botUsername: process.env.TELEGRAM_BOT_USERNAME || 'FindLinksAlertBot'
  },
  cronInterval: process.env.CRON_INTERVAL || '*/10 * * * *',
  mockFallback: process.env.MOCK_SCRAPER_FALLBACK !== 'false',
  nodeEnv: process.env.NODE_ENV || 'development'
};
