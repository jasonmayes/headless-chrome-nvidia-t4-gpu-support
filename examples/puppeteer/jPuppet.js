import puppeteer from 'puppeteer';

const OUTPUT_FOLDER = '/content';
const URL = process.argv[2];
if (!URL) {
  throw "Please provide URL as a first argument";
}

async function runWebpage() {
  const browser = await puppeteer.launch({
    headless: 'new',
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

  // Log console output from page execution and then take screenshot 
  // when kill phrase detected and end process.
  page.on('console', async function(msg) {
    console.log(msg.text());
    if (msg.text() === 'captureAndEnd') {
      await page.screenshot({path: OUTPUT_FOLDER + '/screenshotEnd.png'});
      await browser.close();
    }
  });

  await page.goto(URL);

  // Special case for chrome://gpu screenshot.
  if (URL === 'chrome://gpu') {
    // Wait 5 seconds before taking screenshot.
    await page.waitForTimeout(5000);
    await page.pdf({path: OUTPUT_FOLDER + '/gpu.pdf'});
    await browser.close();
  }
}

runWebpage();
