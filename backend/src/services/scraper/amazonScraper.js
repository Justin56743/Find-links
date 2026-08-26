import * as cheerio from 'cheerio';
import { fetchHtml, cleanPrice, extractStructuredData } from './utils.js';

export const parseAmazonUrl = (url) => {
  const asinMatch = url.match(/(?:dp|gp\/product|exec\/obidos\/ASIN|product-reviews)\/([A-Z0-9]{10})/i);
  return asinMatch ? asinMatch[1].toUpperCase() : null;
};

export const scrapeAmazon = async (url) => {
  const asin = parseAmazonUrl(url);
  const cleanUrl = asin ? `https://www.amazon.in/dp/${asin}` : url;

  const html = await fetchHtml(cleanUrl);
  if (!html) return null;

  const $ = cheerio.load(html);
  const jsonLd = extractStructuredData(html);

  let title = $('#productTitle').text().trim() ||
              $('span#title').text().trim() ||
              $('meta[property="og:title"]').attr('content') ||
              $('title').text().replace(/Amazon\.in\s*:\s*/i, '').replace(/:\s*Amazon\.in/i, '').trim();

  let price = null;
  const priceSelectors = [
    '.apexPriceToPay .a-offscreen',
    '#corePrice_feature_div .a-price-whole',
    '.priceToPay .a-price-whole',
    '#corePriceDisplay_desktop_feature_div .a-price-whole',
    '#priceblock_ourprice',
    '#priceblock_dealprice',
    '.a-price .a-offscreen',
    'span.a-color-price'
  ];

  for (const selector of priceSelectors) {
    const el = $(selector).first();
    if (el.length) {
      const raw = el.text();
      const cleaned = cleanPrice(raw);
      if (cleaned && cleaned > 0) {
        price = cleaned;
        break;
      }
    }
  }

  if (!price && jsonLd && jsonLd.offers) {
    const offer = Array.isArray(jsonLd.offers) ? jsonLd.offers[0] : jsonLd.offers;
    if (offer && offer.price) {
      price = cleanPrice(offer.price);
    }
  }

  let mrp = null;
  const mrpEl = $('.basisPrice .a-offscreen, #corePriceDisplay_desktop_feature_div .a-text-price .a-offscreen, .a-text-price .a-offscreen').first();
  if (mrpEl.length) {
    mrp = cleanPrice(mrpEl.text());
  }

  let imageUrl = $('#landingImage').attr('data-old-hires') ||
                 $('#landingImage').attr('src') ||
                 $('meta[property="og:image"]').attr('content') ||
                 $('#imgBlkFront').attr('src') ||
                 $('#main-image').attr('src');

  const inStock = !$('#availability').text().toLowerCase().includes('currently unavailable');

  return {
    store: 'Amazon',
    url: cleanUrl,
    title: title || 'Amazon Product',
    price: price,
    mrp: mrp && mrp > (price || 0) ? mrp : null,
    imageUrl,
    inStock,
    deliveryInfo: 'Free Prime / Standard Delivery'
  };
};

