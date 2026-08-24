import express from 'express';
import { prisma } from '../prisma.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { telegramService } from '../services/telegramService.js';
import { config } from '../config.js';

const router = express.Router();

// Get Telegram Bot status and user connection info
router.get('/status', authenticate, async (req, res) => {
  try {
    const isConfigured = telegramService.isConfigured();
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        telegramChatId: true,
        telegramUsername: true,
        telegramConnectedAt: true,
        connectToken: true
      }
    });

    const botUsername = (config.telegram.botUsername || 'FindLinksAlertBot').replace(/^@/, '');
    const connectUrl = `https://t.me/${botUsername}?start=${user.connectToken}`;

    return res.json({
      success: true,
      botConfigured: isConfigured,
      botUsername,
      connectUrl,
      connectToken: user.connectToken,
      isConnected: Boolean(user.telegramChatId),
      telegramChatId: user.telegramChatId,
      telegramUsername: user.telegramUsername,
      connectedAt: user.telegramConnectedAt
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to get Telegram status.' });
  }
});

// Test sending message to user's Telegram chat
router.post('/test', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user.telegramChatId) {
      return res.status(400).json({ success: false, message: 'No Telegram Chat ID connected. Please link your Telegram account first.' });
    }

    const result = await telegramService.sendTestMessage(user.telegramChatId, user.name);

    if (!result || result.success === false) {
      return res.status(400).json({ 
        success: false, 
        message: result?.error || 'Failed to send Telegram message. Please check your Chat ID.' 
      });
    }

    return res.json({
      success: true,
      message: 'Test message sent to your Telegram chat successfully!',
      simulated: result.simulated || false
    });
  } catch (error) {
    console.error('Telegram test error:', error);
    return res.status(500).json({ success: false, message: 'Failed to send test message.' });
  }
});

// Manual connect or update Chat ID
router.post('/connect', authenticate, async (req, res) => {
  try {
    const { chatId, username } = req.body;
    if (!chatId) {
      return res.status(400).json({ success: false, message: 'Telegram Chat ID is required.' });
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        telegramChatId: chatId.toString().trim(),
        telegramUsername: username ? username.trim().replace(/^@/, '') : null,
        telegramConnectedAt: new Date()
      }
    });

    // Send instant welcome confirmation
    await telegramService.sendTestMessage(chatId, updated.name);

    return res.json({
      success: true,
      message: 'Telegram account connected successfully!',
      user: {
        telegramChatId: updated.telegramChatId,
        telegramUsername: updated.telegramUsername,
        telegramConnectedAt: updated.telegramConnectedAt
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to connect Telegram account.' });
  }
});

// Disconnect Telegram
router.post('/disconnect', authenticate, async (req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        telegramChatId: null,
        telegramUsername: null,
        telegramConnectedAt: null
      }
    });

    return res.json({ success: true, message: 'Telegram account disconnected.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to disconnect Telegram account.' });
  }
});

// Webhook endpoint for Telegram Bot updates
router.post('/webhook', async (req, res) => {
  try {
    const message = req.body?.message;
    if (message && message.text && message.text.startsWith('/start')) {
      const parts = message.text.split(' ');
      const token = parts[1];
      const chatId = message.chat?.id;
      const username = message.from?.username || message.from?.first_name;

      if (token && chatId) {
        await telegramService.linkAccountByToken(token.trim(), chatId, username);
      }
    }
    return res.json({ ok: true });
  } catch (e) {
    return res.json({ ok: true });
  }
});

export default router;
