import * as cheerio from 'cheerio';
import { fetchHtml, cleanPrice, extractStructuredData } from './utils.js';

export const scrapeMyntra = async (url) => {
  const html = await fetchHtml(url);
  if (!html) return null;

  const $ = cheerio.load(html);
  const jsonLd = extractStructuredData(html);

  let title = $('h1.pdp-title').text().trim() ||
              $('h1.pdp-name').text().trim() ||
              $('meta[property="og:title"]').attr('content') ||
              $('title').text().trim();

  let price = null;
  const priceSelectors = [
    'span.pdp-price',
    'div.prod-sp',
    'span.pdp-discounted-price'
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
  const mrpEl = $('span.pdp-mrp, span.prod-cp').first();
  if (mrpEl.length) {
    mrp = cleanPrice(mrpEl.text());
  }

  let imageUrl = $('div.image-grid-image').css('background-image') ||
                 $('meta[property="og:image"]').attr('content');
  if (imageUrl && imageUrl.startsWith('url(')) {
    imageUrl = imageUrl.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
  }

  return {
    store: 'Myntra',
    url,
    title: title || 'Myntra Product',
    price: price,
    mrp: mrp && mrp > (price || 0) ? mrp : null,
    imageUrl,
    inStock: true,
    deliveryInfo: 'Standard Delivery'
  };
};
