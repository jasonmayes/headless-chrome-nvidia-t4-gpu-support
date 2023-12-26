const puppeteer = require('puppeteer');

const url = process.argv[2];
if (!url) {
    throw "Please provide URL as a first argument";
}

async function runWebpage() {
  const browser = await puppeteer.launch({
    headless: true, //'new' if using new
    ignoreDefaultArgs: true,
    args:  [
        '--no-sandbox',
        '--headless=new',
        '--use-angle=vulkan',
        '--enable-features=Vulkan',
        '--disable-vulkan-surface',
        '--enable-unsafe-webgpu',
        '--disable-search-engine-choice-screen',
        '--ash-no-nudges',
        '--no-first-run',
        '--disable-features=Translate',
        '--no-default-browser-check',
        '--window-size=1280,720'
      ]
  });

  const page = await browser.newPage();

  // Log console output from page execution and then take screenshow 
  // when kill phrase detected and end process.
  page.on('console', async function(msg) {
    console.log(msg.text());
    if (msg.text() === 'captureAndEnd') {
      await page.screenshot({path: '/home/screenshotEnd.png'});
      await browser.close();
    }
  });

  await page.goto(url);
  // Example how to wait 5 seconds before taking screenshot
  await page.waitForTimeout(10000);
  await page.screenshot({path: '/home/screenshot.png'});
}

runWebpage();
