import axios from 'axios';
import * as cheerio from 'cheerio';

export const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
];

export const getRandomUserAgent = () => {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
};

export const cleanPrice = (priceStr) => {
  if (typeof priceStr === 'number') return priceStr;
  if (!priceStr) return null;
  const cleaned = priceStr.toString().replace(/[₹$,\s]/g, '').trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
};

export const fetchHtml = async (url) => {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-IN,en-GB,en;q=0.9,hi;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: 10000
    });
    return response.data;
  } catch (error) {
    // console.warn(`Direct fetch failed for ${url}: ${error.message}`);
    return null;
  }
};

export const extractStructuredData = (html) => {
  try {
    const $ = cheerio.load(html);
    const jsonLdScripts = $('script[type="application/ld+json"]');
    for (let i = 0; i < jsonLdScripts.length; i++) {
      try {
        const content = $(jsonLdScripts[i]).html();
        if (!content) continue;
        const data = JSON.parse(content);
        if (data['@type'] === 'Product' || (Array.isArray(data) && data.some(d => d['@type'] === 'Product'))) {
          const product = data['@type'] === 'Product' ? data : data.find(d => d['@type'] === 'Product');
          return product;
        }
      } catch (e) {
        // continue
      }
    }
  } catch (e) {
    // ignore
  }
  return null;
};
