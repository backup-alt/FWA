const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');

const app = express();
app.use('/FWA', express.static(path.join(__dirname, 'dist')));

const server = app.listen(3000, async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    page.on('console', msg => {
      if (msg.type() === 'error') console.log('PAGE ERROR LOG:', msg.text());
    });
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    
    // Simulate setting local storage so we don't redirect to login
    await page.goto('http://localhost:3000/FWA/#/');
    await page.evaluate(() => {
      localStorage.setItem('token', 'fake-token');
    });

    console.log('Navigating to Add Loan...');
    await page.goto('http://localhost:3000/FWA/#/customer/123/add-loan');
    await new Promise(r => setTimeout(r, 2000));
    console.log('Current URL:', page.url());
    
    await browser.close();
  } catch (err) {
    console.error(err);
  } finally {
    server.close();
    process.exit(0);
  }
});
