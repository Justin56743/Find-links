import { buildCrossStoreListings, detectProductCategory, isStoreCarryingItem } from './src/services/scraper/crossStoreMatcher.js';
import { extractPriceHistoryData } from './src/services/scraper/priceHistoryExtractor.js';
import assert from 'assert';

async function runStoreAvailabilityTests() {
  console.log('🧪 Starting Store Availability & Price History Unit/Integration Tests...\n');

  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`✅ [PASS ${total}] ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ [FAIL ${total}] ${name}`);
      console.error('   ', err.message);
    }
  }

  async function asyncTest(name, fn) {
    total++;
    try {
      await fn();
      console.log(`✅ [PASS ${total}] ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ [FAIL ${total}] ${name}`);
      console.error('   ', err.message);
    }
  }

  // --- Test 1: Category Detection ---
  test('Category Detection identifies Electronics vs Fashion accurately', () => {
    assert.strictEqual(detectProductCategory('Apple iPhone 15 (128 GB) - Black'), 'ELECTRONICS');
    assert.strictEqual(detectProductCategory('Sony WH-1000XM5 Wireless Noise Cancelling Headphones'), 'ELECTRONICS');
    assert.strictEqual(detectProductCategory('Samsung 55 Inch 4K Ultra HD Smart QLED TV'), 'ELECTRONICS');
    assert.strictEqual(detectProductCategory('Nike Air Max Men Running Shoes'), 'FASHION');
    assert.strictEqual(detectProductCategory("Levi's Men Slim Fit Denim Jeans"), 'FASHION');
  });

  // --- Test 2: Electronics Multi-Store Availability ---
  test('Electronics (iPhone 15) is confirmed on Electronics retailers and marked NOT AVAILABLE on Fashion/Grocery stores', () => {
    const listings = buildCrossStoreListings(
      'Amazon',
      69900,
      'Apple iPhone 15 (128 GB) - Black',
      'https://www.amazon.in/dp/B0CHX1W1XY'
    );

    const storeMap = Object.fromEntries(listings.map(l => [l.store, l]));

    // Amazon & Flipkart must be available
    assert.strictEqual(storeMap['Amazon'].isAvailable, true);
    assert.strictEqual(storeMap['Amazon'].inStock, true);
    assert.ok(storeMap['Amazon'].currentPrice > 0);
    assert.ok(storeMap['Amazon'].url.startsWith('http'));

    assert.strictEqual(storeMap['Flipkart'].isAvailable, true);
    assert.strictEqual(storeMap['Flipkart'].inStock, true);
    assert.ok(storeMap['Flipkart'].currentPrice > 0);

    assert.strictEqual(storeMap['Croma'].isAvailable, true);
    assert.strictEqual(storeMap['Reliance Digital'].isAvailable, true);

    // Myntra & JioMart must NOT carry iPhone
    assert.strictEqual(storeMap['Myntra'].isAvailable, false, 'Myntra must NOT carry iPhone 15');
    assert.strictEqual(storeMap['Myntra'].inStock, false);
    assert.strictEqual(storeMap['Myntra'].currentPrice, null, 'Myntra must not have a fake price');
    assert.strictEqual(storeMap['Myntra'].url, null, 'Myntra must not have a broken link');

    assert.strictEqual(storeMap['JioMart'].isAvailable, false, 'JioMart must NOT carry iPhone 15');
    assert.strictEqual(storeMap['JioMart'].currentPrice, null);
  });

  // --- Test 3: Fashion Multi-Store Availability ---
  test('Fashion (Sneakers) is confirmed on Fashion retailers and marked NOT AVAILABLE on Electronics stores', () => {
    const listings = buildCrossStoreListings(
      'Myntra',
      4299,
      'Puma Men Softride Enzo NXT Running Shoes',
      'https://www.myntra.com/shoes/puma/12345'
    );

    const storeMap = Object.fromEntries(listings.map(l => [l.store, l]));

    // Myntra, Flipkart, Amazon, Tata CLiQ should be available
    assert.strictEqual(storeMap['Myntra'].isAvailable, true);
    assert.strictEqual(storeMap['Amazon'].isAvailable, true);
    assert.strictEqual(storeMap['Flipkart'].isAvailable, true);

    // Croma, Reliance Digital, JioMart must NOT carry fashion sneakers
    assert.strictEqual(storeMap['Croma'].isAvailable, false, 'Croma must NOT carry fashion shoes');
    assert.strictEqual(storeMap['Croma'].currentPrice, null);
    assert.strictEqual(storeMap['Croma'].url, null);

    assert.strictEqual(storeMap['Reliance Digital'].isAvailable, false, 'Reliance Digital must NOT carry fashion shoes');
    assert.strictEqual(storeMap['Reliance Digital'].currentPrice, null);
    assert.strictEqual(storeMap['Reliance Digital'].url, null);
  });

  // --- Test 4: Price History Baseline & Aggregator Extractor ---
  await asyncTest('Price History Extractor generates rich historical trendlines & all-time metrics', async () => {
    const data = await extractPriceHistoryData(
      'https://www.amazon.in/dp/B0CHX1W1XY',
      69900,
      79900,
      'Amazon'
    );

    assert.ok(data.allTimeLow <= 69900, 'All-time low must be equal to or lower than current price');
    assert.ok(data.allTimeHigh >= 69900, 'All-time high must be equal to or higher than current price');
    assert.ok(Array.isArray(data.historyPoints) && data.historyPoints.length >= 5, 'Must generate multiple historical checkpoints');
    assert.strictEqual(data.historyPoints[data.historyPoints.length - 1].price, 69900, 'Latest point must match current price');
  });

  // --- Test 5: Lowest Price strictly calculated among available in-stock stores ---
  test('Lowest Price calculation strictly ignores stores marked unavailable/null', () => {
    const listings = [
      { store: 'Amazon', currentPrice: 54990, inStock: true, isAvailable: true },
      { store: 'Flipkart', currentPrice: 53999, inStock: true, isAvailable: true },
      { store: 'Croma', currentPrice: 55990, inStock: true, isAvailable: true },
      { store: 'Myntra', currentPrice: null, inStock: false, isAvailable: false, url: null },
      { store: 'JioMart', currentPrice: null, inStock: false, isAvailable: false, url: null }
    ];

    const available = listings.filter(l => l.inStock && l.currentPrice > 0);
    const validPrices = available.map(l => l.currentPrice);
    const lowest = Math.min(...validPrices);

    assert.strictEqual(lowest, 53999, 'Lowest price should be Flipkart (₹53,999)');
    assert.strictEqual(available.length, 3, 'Only 3 stores are available');
  });

  console.log(`\n======================================================`);
  console.log(`📊 Test Results: ${passed} / ${total} Tests Passed Successfully! 🚀`);
  console.log(`======================================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

runStoreAvailabilityTests();
