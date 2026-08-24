import axios from 'axios';
import { config } from '../config.js';
import { prisma } from '../prisma.js';

class TelegramService {
  constructor() {
    this.botToken = config.telegram.botToken;
    this.botUsername = (config.telegram.botUsername || 'FindLinksAlertBot').replace(/^@/, '');
    this.apiUrl = this.botToken && this.botToken !== 'mock_or_real_bot_token' 
      ? `https://api.telegram.org/bot${this.botToken}` 
      : null;
    this.isPolling = false;
    this.lastUpdateId = 0;
  }

  isConfigured() {
    return Boolean(this.botToken && this.botToken !== 'mock_or_real_bot_token' && this.apiUrl);
  }

  async sendMessage(chatId, text, parseMode = 'HTML') {
    if (!chatId) return { success: false, reason: 'No chat ID provided' };

    // Check if user accidentally entered the bot's own ID
    const botIdPrefix = this.botToken?.split(':')[0];
    if (botIdPrefix && chatId.toString() === botIdPrefix) {
      const err = `Invalid Chat ID: ${chatId} is the Telegram Bot's own ID. You must enter your personal Telegram user ID (from @userinfobot) or tap Start in the bot @${this.botUsername}.`;
      console.warn(`[Telegram] ⚠️ ${err}`);
      return { success: false, error: err };
    }

    if (!this.isConfigured()) {
      console.log(`[Telegram Simulation] To Chat ID ${chatId}:\n${text}`);
      return { success: true, simulated: true };
    }

    try {
      const response = await axios.post(`${this.apiUrl}/sendMessage`, {
        chat_id: chatId,
        text,
        parse_mode: parseMode,
        disable_web_page_preview: false
      });
      return { success: true, data: response.data };
    } catch (error) {
      const errorMsg = error.response?.data?.description || error.message;
      console.error(`Failed to send Telegram message to ${chatId}:`, error.response?.data || error.message);
      return { success: false, error: errorMsg };
    }
  }

  async sendPriceDropAlert({ user, product, storeListing, oldPrice, newPrice }) {
    if (!user.telegramChatId) return null;

    const discountAmount = Math.round(oldPrice - newPrice);
    const discountPercent = Math.round(((oldPrice - newPrice) / oldPrice) * 100);
    const formattedOld = `₹${oldPrice.toLocaleString('en-IN')}`;
    const formattedNew = `₹${newPrice.toLocaleString('en-IN')}`;

    const text = `
🚨 <b>PRICE DROP ALERT!</b> 🚨

📦 <b>${product.title}</b>
🏷️ <b>Store:</b> ${storeListing.store}
💰 <b>New Lowest Price:</b> <b>${formattedNew}</b>
📉 <b>Previous Price:</b> <s>${formattedOld}</s>
🎉 <b>You Save:</b> ₹${discountAmount.toLocaleString('en-IN')} (${discountPercent}% OFF)

📍 <i>Delivery PIN: ${product.pincode || user.defaultPincode || '560001'}</i>

🔗 <a href="${storeListing.url}"><b>👉 CLICK HERE TO BUY ON ${storeListing.store.toUpperCase()}</b></a>
`.trim();

    return this.sendMessage(user.telegramChatId, text);
  }

  async sendTestMessage(chatId, userName = 'User') {
    const text = `
✅ <b>Find-Links Price Alert Bot Connected!</b>

Hello ${userName}! 👋
Your Telegram account is now linked to <b>Find-Links Price Tracker</b>.

You will automatically receive instant alerts here whenever a tracked product drops in price or hits your target threshold.

Happy Shopping & Saving! 🛍️
`.trim();

    return this.sendMessage(chatId, text);
  }

  async linkAccountByToken(token, chatId, username = null, firstName = 'User') {
    if (!chatId) return null;

    let user = null;
    if (token) {
      user = await prisma.user.findUnique({
        where: { connectToken: token }
      });
    }

    // If no token provided, match recent user without telegramChatId
    if (!user) {
      user = await prisma.user.findFirst({
        orderBy: { updatedAt: 'desc' }
      });
    }

    if (!user) return null;

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        telegramChatId: chatId.toString(),
        telegramUsername: username || null,
        telegramConnectedAt: new Date()
      }
    });

    console.log(`[Telegram] 🔗 Successfully linked user "${user.name}" to Telegram Chat ID ${chatId} (@${username || 'no_username'})`);
    await this.sendTestMessage(chatId, user.name || firstName);
    return updatedUser;
  }

  /**
   * Start long polling for Telegram incoming /start commands
   */
  startPolling() {
    if (!this.isConfigured() || this.isPolling) return;
    this.isPolling = true;
    console.log(`[Telegram] 🤖 Listening for Telegram bot commands on @${this.botUsername}...`);

    const poll = async () => {
      if (!this.isPolling) return;
      try {
        const response = await axios.get(`${this.apiUrl}/getUpdates`, {
          params: {
            offset: this.lastUpdateId + 1,
            timeout: 20
          },
          timeout: 25000
        });

        if (response.data?.ok && Array.isArray(response.data.result)) {
          for (const update of response.data.result) {
            this.lastUpdateId = Math.max(this.lastUpdateId, update.update_id);
            const msg = update.message;
            if (msg && msg.text && msg.chat) {
              const text = msg.text.trim();
              const chatId = msg.chat.id;
              const username = msg.from?.username;
              const firstName = msg.from?.first_name || 'User';

              if (text.startsWith('/start')) {
                const parts = text.split(' ');
                const token = parts.length > 1 ? parts[1].trim() : null;
                await this.linkAccountByToken(token, chatId, username, firstName);
              } else if (text === '/help' || text === '/status') {
                await this.sendMessage(chatId, `👋 <b>Find-Links Bot</b>\n\nYour Chat ID is: <code>${chatId}</code>\nStatus: Active & Tracking!`);
              }
            }
          }
        }
      } catch (err) {
        // Poll error / network timeout, retry gracefully
      }

      if (this.isPolling) {
        setTimeout(poll, 1000);
      }
    };

    poll();
  }

  stopPolling() {
    this.isPolling = false;
  }
}

export const telegramService = new TelegramService();
