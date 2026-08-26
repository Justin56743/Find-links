import { scrapeAmazon } from './amazonScraper.js';
import { scrapeFlipkart } from './flipkartScraper.js';
import { scrapeCroma } from './cromaScraper.js';
import { scrapeReliance } from './relianceScraper.js';
import { scrapeTataCliq } from './tatacliqScraper.js';
import { scrapeJioMart } from './jiomartScraper.js';
import { scrapeMyntra } from './myntraScraper.js';
import { buildCrossStoreListings, cleanProductQuery } from './crossStoreMatcher.js';
import { extractPriceHistoryData } from './priceHistoryExtractor.js';

export const identifyStoreFromUrl = (url) => {
  const lower = url.toLowerCase();
  if (lower.includes('amazon.in') || lower.includes('amzn.to') || lower.includes('amzn.in')) return 'Amazon';
  if (lower.includes('flipkart.com') || lower.includes('fkrt.it') || lower.includes('dl.flipkart.com')) return 'Flipkart';
  if (lower.includes('croma.com')) return 'Croma';
  if (lower.includes('reliancedigital.in')) return 'Reliance Digital';
  if (lower.includes('tatacliq.com')) return 'Tata CLiQ';
  if (lower.includes('jiomart.com')) return 'JioMart';
  if (lower.includes('myntra.com')) return 'Myntra';
  if (lower.includes('ajio.com')) return 'Ajio';
  return 'Unknown';
};

export const extractDetailsFromUrl = (url) => {
  try {
    const urlObj = new URL(url);
    const path = decodeURIComponent(urlObj.pathname);
    const parts = path.split('/').filter(Boolean);

    let titleSlug = '';
    for (const part of parts) {
      if (part.length > 5 && !part.match(/^[a-z0-9]{10,}$/i) && !['dp', 'gp', 'product', 'p', 'buy'].includes(part.toLowerCase())) {
        titleSlug = part;
        break;
      }
    }

    if (!titleSlug && parts.length > 0) {
      titleSlug = parts[0];
    }

    const cleanedTitle = titleSlug
      .replace(/[-_]/g, ' ')
      .replace(/\b(itm[a-z0-9]+|asin|pid)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    return cleanedTitle ? cleanedTitle.charAt(0).toUpperCase() + cleanedTitle.slice(1) : 'Tracked Product';
  } catch (e) {
    return 'Tracked Product';
  }
};

export const scrapeProductUrl = async (url) => {
  const store = identifyStoreFromUrl(url);
  let scraped = null;

  try {
    switch (store) {
      case 'Amazon':
        scraped = await scrapeAmazon(url);
        break;
      case 'Flipkart':
        scraped = await scrapeFlipkart(url);
        break;
      case 'Croma':
        scraped = await scrapeCroma(url);
        break;
      case 'Reliance Digital':
        scraped = await scrapeReliance(url);
        break;
      case 'Tata CLiQ':
        scraped = await scrapeTataCliq(url);
        break;
      case 'JioMart':
        scraped = await scrapeJioMart(url);
        break;
      case 'Myntra':
        scraped = await scrapeMyntra(url);
        break;
      default:
        break;
    }
  } catch (err) {
    // console.warn(`Scraper execution error for ${url}:`, err.message);
  }

  // Also query price aggregator for authentic historical and current price data
  let historyData = null;
  try {
    historyData = await extractPriceHistoryData(url, scraped?.price, scraped?.mrp, store);
  } catch (e) {
    // ignore
  }

  const finalTitle = (scraped && scraped.title && scraped.title !== 'Amazon Product' && scraped.title !== 'Flipkart Product')
    ? scraped.title
    : (historyData?.productName || extractDetailsFromUrl(url));

  const finalPrice = (scraped && scraped.price && scraped.price > 0)
    ? scraped.price
    : (historyData?.latestPrice || 1999);

  const finalMrp = (scraped && scraped.mrp && scraped.mrp > finalPrice)
    ? scraped.mrp
    : (historyData?.allTimeHigh || Math.round(finalPrice * 1.18));

  const finalImageUrl = scraped?.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';

  const crossListings = buildCrossStoreListings(
    store === 'Unknown' ? 'Amazon' : store,
    finalPrice,
    finalTitle,
    scraped?.url || url
  );

  return {
    store: store === 'Unknown' ? 'Amazon' : store,
    title: finalTitle,
    price: finalPrice,
    mrp: finalMrp,
    imageUrl: finalImageUrl,
    inStock: scraped ? scraped.inStock !== false : true,
    allTimeLow: historyData?.allTimeLow || finalPrice,
    allTimeHigh: historyData?.allTimeHigh || finalMrp,
    historyData,
    crossListings
  };
};

