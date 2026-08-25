import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { prisma } from './prisma.js';
import bcrypt from 'bcryptjs';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import telegramRoutes from './routes/telegramRoutes.js';
import { initScheduler } from './services/schedulerService.js';
import { telegramService } from './services/telegramService.js';
import { initKeepAlive } from './services/keepAliveService.js';

const app = express();

// Comprehensive CORS & Preflight handler
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: true
}));

app.options('*', cors());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Find-Links Indian E-commerce Price Tracker API'
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/telegram', telegramRoutes);

// Seed initial sample data if DB is completely fresh
const seedInitialDataIfEmpty = async () => {
  try {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      console.log('[Database] 🌟 Seeding demo user and initial tracked products...');
      const hashedPassword = await bcrypt.hash('password123', 10);
      const demoUser = await prisma.user.create({
        data: {
          name: 'Justin',
          email: 'demo@findlinks.in',
          password: hashedPassword,
          defaultPincode: '560001',
          telegramChatId: '123456789',
          telegramUsername: 'justin_demo'
        }
      });

      // Sample Product 1: Apple iPhone 15 (128 GB) - Black
      const prod1 = await prisma.trackedProduct.create({
        data: {
          userId: demoUser.id,
          title: 'Apple iPhone 15 (128 GB) - Black',
          brand: 'Apple',
          category: 'Smartphones',
          imageUrl: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&auto=format&fit=crop&q=80',
          targetPrice: 65000,
          pincode: '560001',
          originalUrl: 'https://www.amazon.in/dp/B0CHX1W1XY',
          primaryStore: 'Amazon',
          currentLowestPrice: 69999,
          previousLowestPrice: 79900,
          lowestStore: 'Flipkart',
          allTimeLow: 69999,
          allTimeHigh: 79900,
          storeListings: {
            create: [
              { store: 'Flipkart', url: 'https://www.flipkart.com/search?q=Apple+iPhone+15+128GB', currentPrice: 69999, mrp: 79900, discountPercent: 12, inStock: true, deliveryInfo: 'Delivery tomorrow by 11 AM' },
              { store: 'Amazon', url: 'https://www.amazon.in/dp/B0CHX1W1XY', currentPrice: 70990, mrp: 79900, discountPercent: 11, inStock: true, deliveryInfo: 'FREE Prime One-Day Delivery' },
              { store: 'Croma', url: 'https://www.croma.com/searchB?q=iPhone+15', currentPrice: 71490, mrp: 79900, discountPercent: 10, inStock: true, deliveryInfo: 'Store Pickup / Express 3hr Delivery' },
              { store: 'Reliance Digital', url: 'https://www.reliancedigital.in/search?q=iPhone+15', currentPrice: 71900, mrp: 79900, discountPercent: 10, inStock: true, deliveryInfo: 'Standard 24hr Delivery' },
              { store: 'Tata CLiQ', url: 'https://www.tatacliq.com/search/?text=iPhone+15', currentPrice: 72499, mrp: 79900, discountPercent: 9, inStock: true, deliveryInfo: 'Free Standard Delivery' },
              { store: 'JioMart', url: 'https://www.jiomart.com/search/iPhone+15', currentPrice: 70900, mrp: 79900, discountPercent: 11, inStock: true, deliveryInfo: 'Fast Local Fulfillment' }
            ]
          }
        }
      });

      // Price history points for Product 1
      const p1History = [
        { store: 'Amazon', price: 79900, daysAgo: 6 },
        { store: 'Flipkart', price: 79900, daysAgo: 6 },
        { store: 'Amazon', price: 76990, daysAgo: 4 },
        { store: 'Flipkart', price: 74999, daysAgo: 3 },
        { store: 'Amazon', price: 72990, daysAgo: 2 },
        { store: 'Croma', price: 71490, daysAgo: 1 },
        { store: 'Flipkart', price: 69999, daysAgo: 0 }
      ];

      for (const h of p1History) {
        const d = new Date();
        d.setDate(d.getDate() - h.daysAgo);
        await prisma.priceHistory.create({
          data: {
            productId: prod1.id,
            store: h.store,
            price: h.price,
            recordedAt: d
          }
        });
      }

      // Sample Product 2: Sony WH-1000XM5 Wireless Active Noise Cancelling Headphones
      const prod2 = await prisma.trackedProduct.create({
        data: {
          userId: demoUser.id,
          title: 'Sony WH-1000XM5 Wireless Active Noise Cancelling Headphones',
          brand: 'Sony',
          category: 'Audio',
          imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop&q=80',
          targetPrice: 24000,
          pincode: '560001',
          originalUrl: 'https://www.amazon.in/dp/B09XS7JWHH',
          primaryStore: 'Amazon',
          currentLowestPrice: 26990,
          previousLowestPrice: 29990,
          lowestStore: 'Amazon',
          allTimeLow: 25990,
          allTimeHigh: 34990,
          storeListings: {
            create: [
              { store: 'Amazon', url: 'https://www.amazon.in/dp/B09XS7JWHH', currentPrice: 26990, mrp: 34990, discountPercent: 23, inStock: true, deliveryInfo: 'FREE Prime Same-Day Delivery' },
              { store: 'Flipkart', url: 'https://www.flipkart.com/search?q=Sony+WH-1000XM5', currentPrice: 27990, mrp: 34990, discountPercent: 20, inStock: true, deliveryInfo: 'Flipkart Assured Delivery' },
              { store: 'Croma', url: 'https://www.croma.com/searchB?q=Sony+WH-1000XM5', currentPrice: 28990, mrp: 34990, discountPercent: 17, inStock: true, deliveryInfo: 'Express Delivery' },
              { store: 'Reliance Digital', url: 'https://www.reliancedigital.in/search?q=Sony+WH-1000XM5', currentPrice: 29490, mrp: 34990, discountPercent: 15, inStock: true, deliveryInfo: 'Standard Delivery' }
            ]
          }
        }
      });

      // Create initial notifications
      await prisma.notification.create({
        data: {
          userId: demoUser.id,
          productId: prod1.id,
          title: '📉 Price Drop: Apple iPhone 15 (128 GB)',
          message: 'Price dropped from ₹74,999 to ₹69,999 on Flipkart! You save ₹5,000.',
          type: 'PRICE_DROP',
          oldPrice: 74999,
          newPrice: 69999,
          store: 'Flipkart',
          sentToTelegram: true
        }
      });

      await prisma.notification.create({
        data: {
          userId: demoUser.id,
          productId: prod2.id,
          title: '📉 Price Drop: Sony WH-1000XM5',
          message: 'Price dropped to ₹26,990 on Amazon India (23% OFF MRP)!',
          type: 'PRICE_DROP',
          oldPrice: 29990,
          newPrice: 26990,
          store: 'Amazon',
          sentToTelegram: true
        }
      });

      console.log('[Database] ✅ Initial demo data seeded.');
    }
  } catch (err) {
    console.error('[Database] Seeding error:', err);
  }
};

const startServer = async () => {
  await seedInitialDataIfEmpty();
  initScheduler();
  telegramService.startPolling();
  initKeepAlive();

  app.listen(config.port, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 Find-Links Backend Server running on port ${config.port}`);
    console.log(`🌐 Health API: http://localhost:${config.port}/api/health`);
    console.log(`⏱️ Cron Price Scheduler: Running every 10 minutes`);
    console.log(`======================================================\n`);
  });
};

startServer();
