import puppeteer from 'puppeteer';
import * as fs from 'fs';
import {createServer} from "http";
import {Server} from "socket.io";

const OUTPUT_FOLDER = '/mnt/ramdisk';
const URL_PARAM = process.argv[2];
if (!URL_PARAM) {
  throw "Please provide URL as a first argument";
}


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


function handleFSError(e) {
  console.error(e);
}

function handleFSComplete() {
  console.log('Object written to disk');
}

// Create websocket server to receive data from remote webpage.
const httpServer = createServer();
const io = new Server(httpServer, {
  // options
});

let arrayFileStream = fs.createWriteStream(OUTPUT_FOLDER + '/array' + Date.now() + 'jsonl');
arrayFileStream.on('error', handleFSError);
arrayFileStream.on('finish', handleFSComplete);

io.on("connection", (socket) => {
  console.log('Websocket connection connected');
  
  socket.on('jsObj', (jsObj) => {
    console.log(JSON.stringify(jsObj));
    
    // Start new file stream using current timestamp of request as filename.
    let fileStream = fs.createWriteStream(OUTPUT_FOLDER + '/meta.json');
    
    // Handle filesystem events
    fileStream.on('error', handleFSError);
    fileStream.on('finish', handleFSComplete);

    fileStream.write(JSON.stringify(jsObj));
    fileStream.end();
  });

  socket.on('jsArrayItem', (jsArrayItem, final, callback) => {
    arrayFileStream.write(JSON.stringify(jsArrayItem));
    if (final) {
      arrayFileStream.end();
      console.log('Array result written to disk');
      // Setup next stream writer.
      arrayFileStream = fs.createWriteStream(OUTPUT_FOLDER + '/array' + Date.now() + 'jsonl');
    }
  });
});

httpServer.listen(3000);
runWebpage();
