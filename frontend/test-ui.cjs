const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  console.log('Navigating to Add Customer...');
  await page.goto('http://localhost:5173/#/add-customer');
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('Done, closing.');
  await browser.close();
  process.exit(0);
})();
