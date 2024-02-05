import puppeteer from 'puppeteer';
import * as fs from 'fs';

const OUTPUT_FOLDER = '/content';
const URL_PARAM = process.argv[2];
if (!URL_PARAM) {
  throw "Please provide URL as a first argument";
}

let isWriting = false;
let currentFile = undefined;
let fileStream = undefined;


function getObjPropertyReference(obj, path) {
  if (!path) {
    return obj;
  }
  const properties = path.split('.');
  try {
    return getObjPropertyReference(obj[properties.shift()], properties.join('.'));
  } catch (e) {
    return undefined;
  }
}


function convertToJSONPropertyStr(path) {
  let arr = path.split('.');
  let prepend = '{' + arr.map((x) => '"' + x + '"').join(': {');
  let postpend = '';
  
  for (let i = 0; i < arr.length; i++) {
    postpend += '}';
  }
  return {'prepend': prepend, 'postpend': postpend};
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

      // Check if we have already setup a file stream to write to. If not, start new one.
      if (!isWriting) {
        // Start new file stream using current timestamp of request as filename.
        currentFile = Date.now();
        fileStream = fs.createWriteStream(OUTPUT_FOLDER + '/' + currentFile + '.jsonl');
        
        // Handle filesystem errors.
        fileStream.on('error', function(e) {
          console.error(e);
          isWriting = false;
        });
        
        fileStream.on('finish', function completed() {
          console.log('Object written to disk');
          isWriting = false;
        });
        
        isWriting = true;
      }
      
      // check if we want to concatenate whatever object is passed vs just merge and override.
      if (concatArray) {
        let {prepend, postpend} = convertToJSONPropertyStr(concatProperty);
        fileStream.write('＼n' + prepend + JSON.stringify(obj) + postpend);
      } else {
        fileStream.write(JSON.stringify(obj));
      }
      if (!hasMore) {
        fileStream.end();
        resolve(true);
      } else {
        resolve(true);
      }
    });
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
