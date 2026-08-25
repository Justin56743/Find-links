import { cleanPrice } from './utils.js';

export const cleanProductQuery = (title) => {
  if (!title) return '';
  return title
    .replace(/\(.*?\)/g, '') // remove parentheses
    .replace(/\[.*?\]/g, '') // remove brackets
    .replace(/(with\s+.*?offer|special\s+edition|prime\s+deal|flipkart\s+exclusive)/gi, '')
    .replace(/,\s*.*$/, '') // cut off after first comma
    .replace(/(\s*-\s*.*$)/, '') // cut off trailing dash descriptions
    .replace(/(\s{2,})/g, ' ')
    .trim()
    .slice(0, 75);
};

export const detectProductCategory = (title = '', url = '') => {
  const text = `${title} ${url}`.toLowerCase();

  const fashionKeywords = [
    'shirt', 't-shirt', 'tshirt', 'jeans', 'trouser', 'dress', 'kurta', 'kurti',
    'saree', 'sneakers', 'shoes', 'boots', 'sandals', 'heels', 'jacket', 'hoodie',
    'sweater', 'handbag', 'wallet', 'perfume', 'deodorant', 'sunglasses', 'earrings',
    'necklace', 'bra', 'briefs', 'boxers', 'socks', 'blazer', 'suit', 'lehenga'
  ];

  const electronicsKeywords = [
    'phone', 'iphone', 'samsung', 'galaxy', 'oneplus', 'xiaomi', 'redmi', 'realme',
    'laptop', 'macbook', 'tv', 'television', 'oled', 'qled', 'led', 'headphones',
    'earphones', 'earbuds', 'airpods', 'smartwatch', 'watch', 'tablet', 'ipad',
    'camera', 'dslr', 'lens', 'printer', 'monitor', 'keyboard', 'mouse', 'gpu',
    'processor', 'refrigerator', 'fridge', 'ac', 'air conditioner', 'cooler',
    'washing machine', 'microwave', 'oven', 'trimmer', 'shaver', 'hair dryer',
    'soundbar', 'speaker', 'gaming', 'playstation', 'ps5', 'xbox'
  ];

  for (const word of fashionKeywords) {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(text)) return 'FASHION';
  }

  for (const word of electronicsKeywords) {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(text)) return 'ELECTRONICS';
  }

  return 'GENERAL';
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
 * Checks if a retailer carries products in this category
 */
export const isStoreCompatible = (store, category) => {
  if (category === 'FASHION') {
    return ['Amazon', 'Flipkart', 'Myntra', 'Tata CLiQ'].includes(store);
  }
  if (category === 'ELECTRONICS') {
    return ['Amazon', 'Flipkart', 'Croma', 'Reliance Digital', 'Tata CLiQ', 'JioMart'].includes(store);
  }
  // GENERAL
  return ['Amazon', 'Flipkart', 'JioMart', 'Tata CLiQ'].includes(store);
};

/**
 * Generates initial cross-store comparison listings for a detected product
 */
export const buildCrossStoreListings = (primaryStore, primaryPrice, title, primaryUrl) => {
  const query = cleanProductQuery(title);
  const searchUrls = generateStoreSearchUrls(query);
  const basePrice = primaryPrice || 4999;
  const category = detectProductCategory(title, primaryUrl);

  const allStores = ['Amazon', 'Flipkart', 'Croma', 'Reliance Digital', 'Tata CLiQ', 'JioMart', 'Myntra'];

  return allStores.map((store) => {
    // 1. If this is the primary store where the user got the link
    if (store === primaryStore) {
      return {
        store,
        url: primaryUrl,
        currentPrice: basePrice,
        mrp: Math.round(basePrice * 1.15),
        discountPercent: 13,
        inStock: true,
        isAvailable: true,
        deliveryInfo: 'In Stock & Available for Delivery',
        matchScore: 1.0
      };
    }

    // 2. Check if the store is compatible with this product category
    const compatible = isStoreCompatible(store, category);
    if (!compatible) {
      return {
        store,
        url: null, // No broken link
        currentPrice: null,
        mrp: null,
        discountPercent: null,
        inStock: false,
        isAvailable: false,
        deliveryInfo: `Not sold on ${store}`,
        matchScore: 0
      };
    }

    // 3. For compatible stores, compute realistic market comparison price
    const multipliers = {
      'Amazon': 1.0,
      'Flipkart': 0.985,
      'Croma': 1.01,
      'Reliance Digital': 1.02,
      'Tata CLiQ': 0.99,
      'JioMart': 0.975,
      'Myntra': 1.02
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
      isAvailable: true,
      deliveryInfo: `${store} Delivery Available`,
      matchScore: 0.95
    };
  });
};
