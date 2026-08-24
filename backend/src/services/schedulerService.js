import cron from 'node-cron';
import { config } from '../config.js';
import { checkAllProducts } from './priceTracker.js';

let cronTask = null;

export const initScheduler = () => {
  if (cronTask) {
    cronTask.stop();
  }

  console.log(`[Scheduler] 🚀 Initializing background price tracker with interval: ${config.cronInterval}`);

  cronTask = cron.schedule(config.cronInterval, async () => {
    try {
      await checkAllProducts();
    } catch (err) {
      console.error('[Scheduler] Cron execution failed:', err);
    }
  });

  return cronTask;
};
