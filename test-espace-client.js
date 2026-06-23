const puppeteer = require('puppeteer');

async function run() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('response', response => {
    if (response.status() >= 400 && response.url().includes('_next')) {
      console.log(`Failed to load: ${response.status()} ${response.url()}`);
    }
  });

  console.log("Navigating to proxy page...");
  // Use the actual proxy URL, which should be something like /apps/espace-client
  await page.goto('https://theridery.com/apps/espace-client', { waitUntil: 'networkidle2' });
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  await page.screenshot({ path: 'espace-client-proxy.png', fullPage: true });
  console.log("Screenshot saved.");
  await browser.close();
}

run().catch(console.error);
