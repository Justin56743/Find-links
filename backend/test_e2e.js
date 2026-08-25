import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function runE2ETests() {
  console.log('🧪 Starting End-to-End API Integration Tests...\n');

  try {
    // 1. Test Health
    const health = await axios.get(`${BASE_URL}/health`);
    console.log('✅ 1. Health check passed:', health.data.service);

    // 2. Test Login
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'demo@findlinks.in',
      password: 'password123'
    });
    console.log('✅ 2. Login successful! User:', loginRes.data.user.name);
    const token = loginRes.data.token;
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    // 3. Test Update PIN code
    const pinRes = await axios.put(`${BASE_URL}/auth/pincode`, { pincode: '110001' }, authHeaders);
    console.log('✅ 3. PIN code updated to:', pinRes.data.user.defaultPincode);

    // 4. Test Product Preview Scraper
    const previewRes = await axios.post(`${BASE_URL}/products/preview`, {
      url: 'https://www.amazon.in/dp/B0CHX1W1XY'
    }, authHeaders);
    console.log('✅ 4. Scraper preview extracted:', {
      store: previewRes.data.preview.store,
      title: previewRes.data.preview.title,
      price: previewRes.data.preview.price,
      matchedStores: previewRes.data.preview.crossListings.map(l => l.store).join(', ')
    });

    // 5. Test Add Tracked Product
    const addRes = await axios.post(`${BASE_URL}/products`, {
      title: 'Samsung Galaxy S24 Ultra (512 GB)',
      originalUrl: 'https://www.amazon.in/dp/B0CS5X8281',
      primaryStore: 'Amazon',
      pincode: '110001',
      storeListings: previewRes.data.preview.crossListings
    }, authHeaders);
    console.log('✅ 5. Product added to watchlist! ID:', addRes.data.product.id);
    const newProductId = addRes.data.product.id;

    // 6. Test Get Products List
    const listRes = await axios.get(`${BASE_URL}/products`, authHeaders);
    console.log(`✅ 6. Retrieved ${listRes.data.products.length} tracked products from watchlist`);

    // 7. Test Simulate 10% Price Drop
    const dropRes = await axios.post(`${BASE_URL}/products/${newProductId}/simulate-drop`, { dropPercent: 10 }, authHeaders);
    console.log('✅ 7. Price drop simulated:', {
      newPrice: dropRes.data.product.currentLowestPrice,
      previousPrice: dropRes.data.product.previousLowestPrice,
      savings: dropRes.data.product.previousLowestPrice - dropRes.data.product.currentLowestPrice
    });

    // 8. Test Notifications List
    const notifRes = await axios.get(`${BASE_URL}/notifications`, authHeaders);
    console.log(`✅ 8. Notifications verified: ${notifRes.data.notifications.length} alerts (Unread: ${notifRes.data.unreadCount})`);
    console.log('   Latest alert:', notifRes.data.notifications[0].title);

    // 9. Test Telegram Bot Status & Ping
    const tgStatus = await axios.get(`${BASE_URL}/telegram/status`, authHeaders);
    console.log('✅ 9. Telegram status:', {
      botUsername: tgStatus.data.botUsername,
      isConnected: tgStatus.data.isConnected,
      connectUrl: tgStatus.data.connectUrl
    });

    const tgTest = await axios.post(`${BASE_URL}/telegram/test`, {}, authHeaders);
    console.log('✅ 10. Telegram test ping dispatched:', tgTest.data.message);

    console.log('\n🎉 ALL 10 END-TO-END INTEGRATION TESTS PASSED SUCCESSFULLY! 🚀\n');
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

runE2ETests();
