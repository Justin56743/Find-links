import * as cheerio from 'cheerio';
import { fetchHtml, cleanPrice, extractStructuredData } from './utils.js';

export const scrapeJioMart = async (url) => {
  const html = await fetchHtml(url);
  if (!html) return null;

  const $ = cheerio.load(html);
  const jsonLd = extractStructuredData(html);

  let title = $('div.product-header-name').text().trim() ||
              $('h1.product-title').text().trim() ||
              $('meta[property="og:title"]').attr('content') ||
              $('title').text().trim();

  let price = null;
  const priceSelectors = [
    'div.product-price-section span.price',
    'span.final-price',
    '.product-price'
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

  let imageUrl = $('div.product-image-container img').attr('src') ||
                 $('meta[property="og:image"]').attr('content');

  return {
    store: 'JioMart',
    url,
    title: title || 'JioMart Product',
    price: price,
    mrp: null,
    imageUrl,
    inStock: true,
    deliveryInfo: 'Fast Local Delivery'
  };
};
