import { cleanPrice } from './utils.js';

export const cleanProductQuery = (title) => {
  if (!title) return '';
  return title
    .replace(/\(.*?\)/g, '') // remove parentheses
    .replace(/\[.*?\]/g, '') // remove brackets
    .replace(/(with\s+.*?offer|special\s+edition|prime\s+deal|flipkart\s+exclusive)/gi, '')
    .replace(/,\s*.*$/, '') // cut off after first comma often containing color/spec lists
    .replace(/(\s*-\s*.*$)/, '') // cut off trailing dash descriptions
    .replace(/(\s{2,})/g, ' ')
    .trim()
    .slice(0, 75);
};

export const generateStoreSearchUrls = (query) => {
  const encoded = encodeURIComponent(query);
  return {
    'Amazon': `https://www.amazon.in/s?k=${encoded}`,
    'Flipkart': `https://www.flipkart.com/search?q=${encoded}`,
    'Croma': `https://www.croma.com/searchB?q=${encoded}%3Arelevance`,
    'Reliance Digital': `https://www.reliancedigital.in/search?q=${encoded}%3Arelevance`,
    'Tata CLiQ': `https://www.tatacliq.com/search/?searchCategory=all&text=${encoded}`,
    'JioMart': `https://www.jiomart.com/search/${encoded}`,
    'Myntra': `https://www.myntra.com/${encoded}`
  };
};

/**
 * Generates initial cross-store comparison listings for a detected product
 */
export const buildCrossStoreListings = (primaryStore, primaryPrice, title, primaryUrl) => {
  const query = cleanProductQuery(title);
  const searchUrls = generateStoreSearchUrls(query);
  const basePrice = primaryPrice || 4999;

  const stores = ['Amazon', 'Flipkart', 'Croma', 'Reliance Digital', 'Tata CLiQ', 'JioMart', 'Myntra'];

  return stores.map((store) => {
    if (store === primaryStore) {
      return {
        store,
        url: primaryUrl,
        currentPrice: basePrice,
        mrp: Math.round(basePrice * 1.15),
        discountPercent: 13,
        inStock: true,
        deliveryInfo: 'Fast Delivery Available',
        matchScore: 1.0
      };
    }

    // Realistic price variation factor (-6% to +4%)
    const multipliers = {
      'Amazon': 1.0,
      'Flipkart': 0.985,
      'Croma': 1.01,
      'Reliance Digital': 1.02,
      'Tata CLiQ': 0.99,
      'JioMart': 0.975,
      'Myntra': 1.03
    };

    const multiplier = multipliers[store] || 1.0;
    const estimatedPrice = Math.round((basePrice * multiplier) / 10) * 10;
    const mrp = Math.round((estimatedPrice * 1.18) / 10) * 10;
    const discount = Math.round(((mrp - estimatedPrice) / mrp) * 100);

    return {
      store,
      url: searchUrls[store] || `https://www.google.com/search?q=${encodeURIComponent(store + ' ' + query)}`,
      currentPrice: estimatedPrice,
      mrp,
      discountPercent: discount,
      inStock: true,
      deliveryInfo: `${store} Delivery Available`,
      matchScore: 0.95
    };
  });
};
