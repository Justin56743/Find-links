import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma.js';
import { config } from '../config.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, defaultPincode } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        defaultPincode: defaultPincode || '560001'
      }
    });

    const token = jwt.sign({ userId: user.id }, config.jwtSecret, { expiresIn: '30d' });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        defaultPincode: user.defaultPincode,
        telegramChatId: user.telegramChatId,
        connectToken: user.connectToken
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create account.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = jwt.sign({ userId: user.id }, config.jwtSecret, { expiresIn: '30d' });

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        defaultPincode: user.defaultPincode,
        telegramChatId: user.telegramChatId,
        telegramUsername: user.telegramUsername,
        connectToken: user.connectToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Login failed.' });
  }
});

router.get('/me', authenticate, async (req, res) => {
  return res.json({
    success: true,
    user: req.user
  });
});

router.put('/pincode', authenticate, async (req, res) => {
  try {
    const { pincode } = req.body;
    if (!pincode || !/^\d{6}$/.test(pincode.trim())) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 6-digit Indian PIN code.' });
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { defaultPincode: pincode.trim() },
      select: {
        id: true,
        name: true,
        email: true,
        defaultPincode: true,
        telegramChatId: true,
        connectToken: true
      }
    });

    return res.json({ success: true, message: 'Default PIN code updated.', user: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update PIN code.' });
  }
});

router.put('/telegram', authenticate, async (req, res) => {
  try {
    const { telegramChatId, telegramUsername } = req.body;

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        telegramChatId: telegramChatId ? telegramChatId.toString().trim() : null,
        telegramUsername: telegramUsername || null,
        telegramConnectedAt: telegramChatId ? new Date() : null
      },
      select: {
        id: true,
        name: true,
        email: true,
        defaultPincode: true,
        telegramChatId: true,
        telegramUsername: true,
        connectToken: true
      }
    });

    return res.json({ success: true, message: 'Telegram settings updated.', user: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update Telegram settings.' });
  }
});

export default router;
