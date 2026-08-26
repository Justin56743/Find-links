import express from 'express';
import { prisma } from '../prisma.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { scrapeProductUrl } from '../services/scraper/index.js';
import { detectProductCategory } from '../services/scraper/crossStoreMatcher.js';
import { extractPriceHistoryData } from '../services/scraper/priceHistoryExtractor.js';
import { checkProductPrice, simulatePriceDrop } from '../services/priceTracker.js';

const router = express.Router();

// Preview product details & cross-store comparison before adding
router.post('/preview', authenticate, async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      return res.status(400).json({ success: false, message: 'Please provide a valid product URL.' });
    }

    const preview = await scrapeProductUrl(url.trim());
    return res.json({ success: true, preview });
  } catch (error) {
    console.error('Preview error:', error);
    return res.status(500).json({ success: false, message: 'Failed to extract product details from URL.' });
  }
});

// Add new tracked product
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      title,
      imageUrl,
      originalUrl,
      primaryStore,
      pincode,
      brand,
      category,
      storeListings
    } = req.body;

    if (!title || !originalUrl) {
      return res.status(400).json({ success: false, message: 'Title and URL are required.' });
    }

    const detectedCategory = category || detectProductCategory(title, originalUrl);

    // Filter and sanitize store listings
    const listings = Array.isArray(storeListings) && storeListings.length > 0
      ? storeListings
      : [{ store: primaryStore || 'Amazon', url: originalUrl, currentPrice: 1999, inStock: true }];

    // Find available in-stock listings with valid prices
    const availableListings = listings.filter(l => l.inStock !== false && typeof l.currentPrice === 'number' && l.currentPrice > 0);
    const validPrices = availableListings.map(l => l.currentPrice);
    const initialLowest = validPrices.length > 0 ? Math.min(...validPrices) : 1999;
    const lowestListing = availableListings.find(l => l.currentPrice === initialLowest) || listings[0];

    // Extract genuine price history metadata
    const historyData = await extractPriceHistoryData(
      originalUrl,
      initialLowest,
      Math.max(...validPrices, initialLowest * 1.18),
      lowestListing.store
    );

    const calculatedAllTimeLow = Math.min(historyData.allTimeLow, initialLowest);
    const calculatedAllTimeHigh = Math.max(historyData.allTimeHigh, ...validPrices);

    const product = await prisma.trackedProduct.create({
      data: {
        userId: req.user.id,
        title: (title || historyData.productName || 'Tracked Product').trim(),
        brand: brand || null,
        category: detectedCategory,
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
        pincode: pincode || req.user.defaultPincode || '560001',
        originalUrl: originalUrl.trim(),
        primaryStore: primaryStore || lowestListing.store || 'Amazon',
        currentLowestPrice: initialLowest,
        previousLowestPrice: initialLowest,
        lowestStore: lowestListing.store,
        allTimeLow: calculatedAllTimeLow,
        allTimeHigh: calculatedAllTimeHigh,
        storeListings: {
          create: listings.map(item => ({
            store: item.store,
            url: item.url || (item.inStock !== false ? originalUrl : ''),
            currentPrice: item.inStock !== false && item.currentPrice ? item.currentPrice : (initialLowest || 0),
            mrp: item.mrp || Math.round((item.currentPrice || initialLowest) * 1.18),
            discountPercent: item.discountPercent || 15,
            inStock: item.inStock !== false && item.currentPrice !== null,
            deliveryInfo: item.deliveryInfo || (item.inStock !== false ? `${item.store} Delivery Available` : `Item is not sold on ${item.store}`),
            matchScore: item.matchScore || 1.0
          }))
        }
      },
      include: {
        storeListings: true
      }
    });

    // Seed historical price points using createMany for high performance
    if (historyData.historyPoints && historyData.historyPoints.length > 0) {
      const priceHistoryEntries = [];
      const primaryStoreName = primaryStore || lowestListing.store || 'Amazon';

      for (const point of historyData.historyPoints) {
        priceHistoryEntries.push({
          productId: product.id,
          store: point.store || primaryStoreName,
          price: point.price,
          recordedAt: point.recordedAt
        });
      }

      if (priceHistoryEntries.length > 0) {
        await prisma.priceHistory.createMany({
          data: priceHistoryEntries
        });
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Product added to price tracking watchlist!',
      product
    });
  } catch (error) {
    console.error('Create product error:', error);
    return res.status(500).json({ success: false, message: 'Failed to track product.' });
  }
});


// Get user's tracked products
router.get('/', authenticate, async (req, res) => {
  try {
    const products = await prisma.trackedProduct.findMany({
      where: { userId: req.user.id, isActive: true },
      include: {
        storeListings: true,
        _count: {
          select: { priceHistory: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return res.json({ success: true, products });
  } catch (error) {
    console.error('Fetch products error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch tracked products.' });
  }
});

// Get single product with full price history
router.get('/:id', authenticate, async (req, res) => {
  try {
    const product = await prisma.trackedProduct.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: {
        storeListings: true,
        priceHistory: {
          orderBy: { recordedAt: 'asc' }
        }
      }
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    return res.json({ success: true, product });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch product details.' });
  }
});

// Update product pincode or store URLs
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { pincode, storeListings } = req.body;

    const existing = await prisma.trackedProduct.findFirst({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const updated = await prisma.trackedProduct.update({
      where: { id: req.params.id },
      data: {
        pincode: pincode !== undefined ? pincode : existing.pincode
      },
      include: {
        storeListings: true
      }
    });

    // Update store URLs if provided
    if (Array.isArray(storeListings)) {
      for (const item of storeListings) {
        if (item.id && item.url) {
          await prisma.storeListing.update({
            where: { id: item.id },
            data: { url: item.url }
          });
        }
      }
    }

    return res.json({ success: true, message: 'Product settings updated.', product: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update product.' });
  }
});

// Delete product
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const product = await prisma.trackedProduct.findFirst({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    await prisma.trackedProduct.delete({
      where: { id: req.params.id }
    });

    return res.json({ success: true, message: 'Product removed from watchlist.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete product.' });
  }
});

// Trigger immediate manual price check
router.post('/:id/refresh', authenticate, async (req, res) => {
  try {
    const updated = await checkProductPrice(req.params.id);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Product not found or inactive.' });
    }

    const fullProduct = await prisma.trackedProduct.findUnique({
      where: { id: req.params.id },
      include: {
        storeListings: true,
        priceHistory: { orderBy: { recordedAt: 'asc' } }
      }
    });

    return res.json({ success: true, message: 'Price checked successfully.', product: fullProduct });
  } catch (error) {
    console.error('Price refresh error:', error);
    return res.status(500).json({ success: false, message: 'Failed to refresh price.' });
  }
});

// Demo/Simulation endpoint: simulate price drop
router.post('/:id/simulate-drop', authenticate, async (req, res) => {
  try {
    const { dropPercent = 8 } = req.body;
    const result = await simulatePriceDrop(req.params.id, dropPercent);

    if (!result) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const fullProduct = await prisma.trackedProduct.findUnique({
      where: { id: req.params.id },
      include: {
        storeListings: true,
        priceHistory: { orderBy: { recordedAt: 'asc' } }
      }
    });

    return res.json({
      success: true,
      message: `Simulated a ${dropPercent}% price drop! In-app notification created and Telegram alert dispatched.`,
      product: fullProduct,
      notification: result.notification
    });
  } catch (error) {
    console.error('Simulate drop error:', error);
    return res.status(500).json({ success: false, message: 'Failed to simulate price drop.' });
  }
});

export default router;
