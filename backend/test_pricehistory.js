import axios from 'axios';

async function fetchHistoryForUrl(url) {
  try {
    console.log("\n==========================================");
    console.log("Processing URL:", url);
    const searchRes = await axios.post("https://pricehistory.app/api/search", { url }, {
      headers: {
        "Content-Type": "application/json",
        "Origin": "https://pricehistory.app",
        "Referer": "https://pricehistory.app/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
      },
      timeout: 10000
    });

    if (searchRes.data && searchRes.data.code) {
      const code = searchRes.data.code;
      const pageRes = await axios.get("https://pricehistory.app/p/" + code, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        },
        timeout: 10000
      });
      const html = pageRes.data;
      const match = html.match(/var PagePriceHistoryDataSet\s*=\s*"([^"]+)";/);
      const keyMatch = html.match(/let CachedKey\s*=\s*'([^']+)';/);
      if (match && keyMatch) {
        const raw = Buffer.from(match[1], "base64").toString("binary");
        const key = keyMatch[1];
        let decrypted = "";
        for (let i = 0; i < raw.length; i++) {
          decrypted += String.fromCharCode(raw.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        const data = JSON.parse(decrypted);
        console.log(`✅ Success for: ${searchRes.data.name}`);
        console.log(`Lowest Ever: ₹${data.Price?.MinPrice} | Highest Ever: ₹${data.Price?.MaxPrice} | Current/Latest: ₹${data.History?.Price?.slice(-1)[0]?.y}`);
        console.log(`Total historical data points: ${data.History?.Price?.length}`);
        console.log(`Date range: ${data.History?.Price?.[0]?.x} to ${data.History?.Price?.slice(-1)[0]?.x}`);
        return {
          title: searchRes.data.name,
          currentPrice: data.History?.Price?.slice(-1)[0]?.y,
          lowestPrice: data.Price?.MinPrice,
          highestPrice: data.Price?.MaxPrice,
          points: data.History?.Price
        };
      }
    }
  } catch (err) {
    console.error("Failed:", err.message);
  }
}

async function run() {
  await fetchHistoryForUrl("https://www.amazon.in/dp/B0CHX1W1XY");
  await fetchHistoryForUrl("https://www.amazon.in/Sony-WH-1000XM5-Wireless-Cancelling-Headphones/dp/B09XS7JWHH");
  await fetchHistoryForUrl("https://www.flipkart.com/apple-iphone-15-black-128-gb/p/itm6ac6485515ae4?pid=MOBGTAGPTB3VS24W");
}

run();
