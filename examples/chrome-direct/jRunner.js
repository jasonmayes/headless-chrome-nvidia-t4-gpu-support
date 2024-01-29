/*******************************************************************************
 * A node.js application to remotely control Chrome headless with GPU support.
 * @author Jason Mayes (www.jasonmayes.com)
 * Connect with me on LinkedIn if questions:
 * https://www.linkedin.com/in/WebAI
 ******************************************************************************/
import * as chromeLauncher from 'chrome-launcher';
import CDP from 'chrome-remote-interface';
import * as fs from 'fs';

const OUTPUT_FOLDER = '/content';
const TERMINATION_PHRASE = 'captureAndEnd';
const URL_PARAM = process.argv[2];
if (!URL_PARAM) {
    throw "Please provide URL as a first argument";
}

(async function() {
  async function launchChrome() {
    return await chromeLauncher.launch({
      chromeFlags: [
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
  }

    
  const chrome = await launchChrome();
  const protocol = await CDP({
    port: chrome.port
  });
  const {
    DOM,
    Network,
    Page,
    Emulation,
    Runtime,
    Console
  } = protocol;


  Page.loadEventFired(async () => {
    if (URL_PARAM === "chrome://gpu") {
      const {data} = await Page.printToPDF();
      fs.writeFileSync(OUTPUT_FOLDER + '/gpu.pdf', Buffer.from(data, 'base64'));
      protocol.close();
      chrome.kill();
    }
  });

  await Promise.all([Network.enable(), Page.enable(), Runtime.enable(), DOM.enable(), Console.enable()]);

  Console.messageAdded(async (result) => {
    console.log(result.message.text);
    if (result.message.text === TERMINATION_PHRASE) {
      const {data} = await Page.captureScreenshot();
      fs.writeFileSync(OUTPUT_FOLDER + '/screen.png', Buffer.from(data, 'base64'));
      protocol.close();
      chrome.kill();
    }
  });

  // Ensure we capture errors too.
  Page.on('pageerror', ({ message }) => console.log(message));
  Page.on('response', response => console.log(`${response.status()} ${response.url()}`));
  Page.on('requestfailed', request => console.log(`${request.failure().errorText} ${request.url()}`));

  Page.navigate({url: URL_PARAM});
})();
