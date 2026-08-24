import * as cheerio from 'cheerio';
import { fetchHtml, cleanPrice, extractStructuredData } from './utils.js';

export const scrapeCroma = async (url) => {
  const html = await fetchHtml(url);
  if (!html) return null;

  const $ = cheerio.load(html);
  const jsonLd = extractStructuredData(html);

  let title = $('h1.pd-title').text().trim() ||
              $('h1.pdp-title').text().trim() ||
              $('meta[property="og:title"]').attr('content') ||
              $('title').text().replace(/:\s*Buy\s.*Croma/i, '').trim();

  let price = null;
  const priceSelectors = [
    'span.amount',
    'span.main-product-price',
    '#pdp-product-price',
    '.new-price'
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
  const mrpEl = $('span.old-price, span.mrp-price').first();
  if (mrpEl.length) {
    mrp = cleanPrice(mrpEl.text());
  }

  let imageUrl = $('div.product-image img').attr('src') ||
                 $('meta[property="og:image"]').attr('content');

  return {
    store: 'Croma',
    url,
    title: title || 'Croma Product',
    price: price,
    mrp: mrp && mrp > (price || 0) ? mrp : null,
    imageUrl,
    inStock: true,
    deliveryInfo: 'Express Delivery Available'
  };
};
