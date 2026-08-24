import * as cheerio from 'cheerio';
import { fetchHtml, cleanPrice, extractStructuredData } from './utils.js';

export const scrapeReliance = async (url) => {
  const html = await fetchHtml(url);
  if (!html) return null;

  const $ = cheerio.load(html);
  const jsonLd = extractStructuredData(html);

  let title = $('h1.pdp__title').text().trim() ||
              $('meta[property="og:title"]').attr('content') ||
              $('title').text().trim();

  let price = null;
  const priceSelectors = [
    'span.pdp__offerPrice',
    '.text-price',
    'span.page-price'
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
  const mrpEl = $('span.pdp__mrpPrice, span.mrp-text').first();
  if (mrpEl.length) {
    mrp = cleanPrice(mrpEl.text());
  }

  let imageUrl = $('img.pdp__mainImage').attr('src') ||
                 $('meta[property="og:image"]').attr('content');

  return {
    store: 'Reliance Digital',
    url,
    title: title || 'Reliance Digital Product',
    price: price,
    mrp: mrp && mrp > (price || 0) ? mrp : null,
    imageUrl,
    inStock: true,
    deliveryInfo: 'Standard Delivery / Store Pickup'
  };
};
