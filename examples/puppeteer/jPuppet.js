import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as JSONStream from 'JSONStream';

const OUTPUT_FOLDER = '/content';
const URL_PARAM = process.argv[2];
if (!URL_PARAM) {
  throw "Please provide URL as a first argument";
}

let objCache = {};

function getObjPropertyReference(obj, path) {
  if (!path) {
    return obj;
  }
  const properties = path.split('.');
  return getObjPropertyReference(obj[properties.shift()], properties.join('.'));
}

async function runWebpage() {
  const browser = await puppeteer.launch({
    headless: 'new',
    ignoreDefaultArgs: true,
    dumpio: true, // Remove this line if you dont need to view IO data.
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
        '--window-size=1280,720',
        '--allow-chrome-scheme-url'
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

  await page.exposeFunction('objectLogger', async function(obj, concatArray, hasMore, concatProperty) {
    return new Promise((resolve, reject) => {
      // check if we want to concatenate whatever object is passed vs just merge and override.
      if (concatArray) {
        let objectArray = getObjPropertyReference(objCache, concatProperty);
        if (objectArray !== undefined) {
          //Push array element to the object's existing array.
          objectArray.push(concatArray);
        }
      } else {
        // Use obj spread to merge objects back to one.
        objCache = {...objCache, ...obj};
      }
      
      if (!hasMore) {
        try {
          let fileStream = fs.createWriteStream('object.json');
          let objStream = JSONStream.stringify();
          objStream.pipe(fileStream);    
          objStream.write(objCache);
          objStream.end();
      
          fileStream.on('finish', function completed() {
            console.log('Object written to disk');
            resolve(true);
          });
        } catch (err) {
          reject(err);
        }
      } else {
        resolve(true);
      };
  });
  
  page.on('pageerror', error => {
    console.log(error.message);
  });
  
  page.on('response', response => {
    console.log('URL Response:' + response.status() + ": " + response.url());
  });
  
  page.on('requestfailed', request => {
    console.log('Request Failed: ' + request.failure().errorText + ', ' + request.url());
  });
  
  await page.goto(URL_PARAM);

  // Special case for chrome://gpu screenshot.
  if (URL_PARAM === 'chrome://gpu') {
    // Wait 5 seconds before taking screenshot.
    await page.waitForTimeout(5000);
    await page.pdf({path: OUTPUT_FOLDER + '/gpu.pdf'});
    await browser.close();
  }
}

runWebpage();
