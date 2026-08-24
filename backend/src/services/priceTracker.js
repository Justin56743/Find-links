import { prisma } from '../prisma.js';
import { telegramService } from './telegramService.js';
import { scrapeAmazon } from './scraper/amazonScraper.js';
import { scrapeFlipkart } from './scraper/flipkartScraper.js';
import { scrapeCroma } from './scraper/cromaScraper.js';

export const checkProductPrice = async (productId) => {
  const product = await prisma.trackedProduct.findUnique({
    where: { id: productId },
    include: {
      user: true,
      storeListings: true
    }
  });

  if (!product || !product.isActive) return null;

  const previousLowest = product.currentLowestPrice;
  let lowestListing = null;
  let newLowestPrice = Infinity;

  for (const listing of product.storeListings) {
    let freshPrice = listing.currentPrice;

    // Attempt live scrape if URL is direct product page
    try {
      if (listing.store === 'Amazon' && listing.url.includes('/dp/')) {
        const scraped = await scrapeAmazon(listing.url);
        if (scraped?.price) freshPrice = scraped.price;
      } else if (listing.store === 'Flipkart' && listing.url.includes('/p/')) {
        const scraped = await scrapeFlipkart(listing.url);
        if (scraped?.price) freshPrice = scraped.price;
      }
    } catch (e) {
      // Keep existing price on error
    }

    // Update listing
    await prisma.storeListing.update({
      where: { id: listing.id },
      data: {
        currentPrice: freshPrice,
        lastCheckedAt: new Date()
      }
    });

    // Record price point in history
    await prisma.priceHistory.create({
      data: {
        productId: product.id,
        store: listing.store,
        price: freshPrice,
        recordedAt: new Date()
      }
    });

    if (freshPrice < newLowestPrice) {
      newLowestPrice = freshPrice;
      lowestListing = listing;
    }
  }

  const allTimeLow = Math.min(product.allTimeLow, newLowestPrice);
  const allTimeHigh = Math.max(product.allTimeHigh, newLowestPrice);

  const updatedProduct = await prisma.trackedProduct.update({
    where: { id: product.id },
    data: {
      previousLowestPrice: previousLowest,
      currentLowestPrice: newLowestPrice,
      lowestStore: lowestListing ? lowestListing.store : product.lowestStore,
      allTimeLow,
      allTimeHigh,
      lastCheckedAt: new Date()
    }
  });

  // Price Drop Check
  const priceDropped = newLowestPrice < previousLowest;
  const hitTarget = product.targetPrice && newLowestPrice <= product.targetPrice && previousLowest > product.targetPrice;

  if ((priceDropped || hitTarget) && lowestListing) {
    const title = hitTarget
      ? `🎯 Target Price Hit: ${product.title}`
      : `📉 Price Drop: ${product.title}`;

    const message = hitTarget
      ? `Price dropped to ₹${newLowestPrice.toLocaleString('en-IN')} on ${lowestListing.store} (Target: ₹${product.targetPrice.toLocaleString('en-IN')})!`
      : `Price dropped from ₹${previousLowest.toLocaleString('en-IN')} to ₹${newLowestPrice.toLocaleString('en-IN')} on ${lowestListing.store} (Save ₹${(previousLowest - newLowestPrice).toLocaleString('en-IN')})!`;

    // Create In-App Notification
    const notification = await prisma.notification.create({
      data: {
        userId: product.userId,
        productId: product.id,
        title,
        message,
        type: hitTarget ? 'TARGET_REACHED' : 'PRICE_DROP',
        oldPrice: previousLowest,
        newPrice: newLowestPrice,
        store: lowestListing.store,
        sentToTelegram: Boolean(product.user.telegramChatId)
      }
    });

    // Send Telegram alert
    if (product.user.telegramChatId) {
      await telegramService.sendPriceDropAlert({
        user: product.user,
        product: updatedProduct,
        storeListing: lowestListing,
        oldPrice: previousLowest,
        newPrice: newLowestPrice
      });
    }
  }

  return updatedProduct;
};

export const checkAllProducts = async () => {
  console.log(`[Scheduler] ⏱️ Running automated price check at ${new Date().toISOString()}...`);
  try {
    const products = await prisma.trackedProduct.findMany({
      where: { isActive: true },
      select: { id: true, title: true }
    });

    console.log(`[Scheduler] Checking prices for ${products.length} active products...`);
    for (const prod of products) {
      await checkProductPrice(prod.id);
    }
    console.log(`[Scheduler] ✅ Price check completed.`);
  } catch (error) {
    console.error('[Scheduler] Error during automated price check:', error);
  }
};

/**
 * Helper to simulate a realistic price drop for testing/demo purposes
 */
export const simulatePriceDrop = async (productId, dropPercent = 8) => {
  const product = await prisma.trackedProduct.findUnique({
    where: { id: productId },
    include: { storeListings: true, user: true }
  });

  if (!product || product.storeListings.length === 0) return null;

  // Pick the first or lowest store listing to discount
  const targetListing = product.storeListings[0];
  const oldPrice = product.currentLowestPrice;
  const newPrice = Math.round((oldPrice * (1 - dropPercent / 100)) / 10) * 10;

  await prisma.storeListing.update({
    where: { id: targetListing.id },
    data: {
      currentPrice: newPrice,
      lastCheckedAt: new Date()
    }
  });

  await prisma.priceHistory.create({
    data: {
      productId: product.id,
      store: targetListing.store,
      price: newPrice,
      recordedAt: new Date()
    }
  });

  const updatedProduct = await prisma.trackedProduct.update({
    where: { id: product.id },
    data: {
      previousLowestPrice: oldPrice,
      currentLowestPrice: newPrice,
      lowestStore: targetListing.store,
      allTimeLow: Math.min(product.allTimeLow, newPrice),
      lastCheckedAt: new Date()
    }
  });

  // Create In-App Notification
  const notification = await prisma.notification.create({
    data: {
      userId: product.userId,
      productId: product.id,
      title: `📉 Price Drop: ${product.title}`,
      message: `Price dropped from ₹${oldPrice.toLocaleString('en-IN')} to ₹${newPrice.toLocaleString('en-IN')} on ${targetListing.store} (Save ₹${(oldPrice - newPrice).toLocaleString('en-IN')})!`,
      type: 'PRICE_DROP',
      oldPrice: oldPrice,
      newPrice: newPrice,
      store: targetListing.store,
      sentToTelegram: Boolean(product.user.telegramChatId)
    }
  });

  if (product.user.telegramChatId) {
    await telegramService.sendPriceDropAlert({
      user: product.user,
      product: updatedProduct,
      storeListing: targetListing,
      oldPrice: oldPrice,
      newPrice: newPrice
    });
  }

  return { product: updatedProduct, notification };
};
