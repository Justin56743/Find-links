import * as cheerio from 'cheerio';
import { fetchHtml, cleanPrice, extractStructuredData } from './utils.js';

export const scrapeTataCliq = async (url) => {
  const html = await fetchHtml(url);
  if (!html) return null;

  const $ = cheerio.load(html);
  const jsonLd = extractStructuredData(html);

  let title = $('h1.ProductDetailsMain__productName').text().trim() ||
              $('meta[property="og:title"]').attr('content') ||
              $('title').text().trim();

  let price = null;
  const priceSelectors = [
    'div.ProductDetailsMain__price',
    'span.ProductDetailsMain__discountedPrice',
    '.ProductDescriptionPage__price'
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

  let imageUrl = $('img.ProductDetailsMain__image').attr('src') ||
                 $('meta[property="og:image"]').attr('content');

  return {
    store: 'Tata CLiQ',
    url,
    title: title || 'Tata CLiQ Product',
    price: price,
    mrp: null,
    imageUrl,
    inStock: true,
    deliveryInfo: 'Tata CLiQ Assured Delivery'
  };
};
