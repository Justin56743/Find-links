import { scrapeProductUrl } from './src/services/scraper/index.js';
import { extractPriceHistoryData } from './src/services/scraper/priceHistoryExtractor.js';
import { buildCrossStoreListings, detectProductCategory } from './src/services/scraper/crossStoreMatcher.js';

async function runTests() {
  console.log('🧪 Starting Find-Links Scraper & Price History Verification...\n');

  // Test 1: Amazon Product Scraping & Real History Integration
  console.log('▶ TEST 1: Amazon iPhone 15 (URL -> Title, Price, Real History)');
  const amazonUrl = 'https://www.amazon.in/dp/B0CHX1W1XY';
  const amazonResult = await scrapeProductUrl(amazonUrl);
  console.log('Title:', amazonResult.title);
  console.log('Price: ₹' + amazonResult.price);
  console.log('All-Time Low: ₹' + amazonResult.allTimeLow);
  console.log('All-Time High: ₹' + amazonResult.allTimeHigh);
  console.log('Total History Points:', amazonResult.historyData?.historyPoints?.length || 0);
  console.log('Earliest History Date:', amazonResult.historyData?.historyPoints?.[0]?.recordedAt);
  console.log('Latest History Date:', amazonResult.historyData?.historyPoints?.slice(-1)[0]?.recordedAt);

  console.log('\nCross-store listings generated:');
  amazonResult.crossListings.forEach(l => {
    console.log(` - ${l.store.padEnd(16)} | Available: ${String(l.isAvailable).padEnd(5)} | Price: ${l.currentPrice ? '₹' + l.currentPrice : 'N/A'} | Direct: ${l.isDirectLink || false} | URL: ${l.url || 'None'}`);
  });

  // Test 2: Category Gating (e.g. Fashion vs Electronics)
  console.log('\n▶ TEST 2: Category Detection & Store Gating Check');
  const fashionCategory = detectProductCategory('Levi\'s Men Slim Fit Jeans');
  const electronicsCategory = detectProductCategory('Samsung 55 Inch 4K Crystal UHD TV');
  console.log('Fashion category detected:', fashionCategory);
  console.log('Electronics category detected:', electronicsCategory);

  const fashionListings = buildCrossStoreListings('Flipkart', 1899, 'Levi\'s Men Slim Fit Jeans', 'https://www.flipkart.com/sample');
  const myntraListing = fashionListings.find(l => l.store === 'Myntra');
  const cromaListing = fashionListings.find(l => l.store === 'Croma');
  console.log('Is Myntra available for Jeans:', myntraListing?.isAvailable);
  console.log('Is Croma available for Jeans (should be false):', cromaListing?.isAvailable);

  const electronicsListings = buildCrossStoreListings('Amazon', 42990, 'Samsung 55 Inch 4K Crystal UHD TV', 'https://www.amazon.in/sample');
  const myntraElectronics = electronicsListings.find(l => l.store === 'Myntra');
  const cromaElectronics = electronicsListings.find(l => l.store === 'Croma');
  console.log('Is Myntra available for TV (should be false):', myntraElectronics?.isAvailable);
  console.log('Is Croma available for TV:', cromaElectronics?.isAvailable);

  console.log('\n✅ All Scraper, History & Store Gating tests completed successfully!');
}

runTests().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
