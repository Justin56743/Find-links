import * as cheerio from 'cheerio';
import { fetchHtml, cleanPrice, extractStructuredData } from './utils.js';

export const parseFlipkartPid = (url) => {
  const pidMatch = url.match(/[?&]pid=([A-Z0-9]{16})/i) || url.match(/\/p\/(itm[a-z0-9]+)/i);
  return pidMatch ? pidMatch[1] : null;
};

export const scrapeFlipkart = async (url) => {
  const html = await fetchHtml(url);
  if (!html) return null;

  const $ = cheerio.load(html);
  const jsonLd = extractStructuredData(html);

  let title = $('span.B_NuCI').text().trim() ||
              $('h1._6EBuvT').text().trim() ||
              $('h1.VU-ZEz').text().trim() ||
              $('span.VU-ZEz').text().trim() ||
              $('h1.CxhGGd').text().trim() ||
              $('meta[property="og:title"]').attr('content') ||
              $('title').text().replace(/:\s*Buy\s.*Flipkart\.com/i, '').replace(/\|\s*Flipkart\.com/i, '').trim();

  let price = null;
  const priceSelectors = [
    'div._30jeq3._16Jk6d',
    'div.Nx9bqj.CxhGGd',
    'div._30jeq3',
    'div.Nx9bqj',
    'div.hl05eU div._30jeq3',
    'div.x_cE1n'
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
  const mrpEl = $('div._3I9_wc._2p6lqe, div.yRaY8j.A68kHO, div._3I9_wc, div.yRaY8j').first();
  if (mrpEl.length) {
    mrp = cleanPrice(mrpEl.text());
  }

  let imageUrl = $('img._396cs4._3exPp9').attr('src') ||
                 $('img._53G4uh').attr('src') ||
                 $('img.DByuf4').attr('src') ||
                 $('meta[property="og:image"]').attr('content');

  const inStock = !$('div._16FRp0').length && !$('button._2KpZ6l._2U9uOA._3v1-ww:disabled').length;

  return {
    store: 'Flipkart',
    url,
    title: title || 'Flipkart Product',
    price: price,
    mrp: mrp && mrp > (price || 0) ? mrp : null,
    imageUrl,
    inStock,
    deliveryInfo: 'Flipkart Assured / Fast Delivery'
  };
};

