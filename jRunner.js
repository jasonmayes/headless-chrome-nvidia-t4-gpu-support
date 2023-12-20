/*******************************************************************************
 * A node.js application to remotely control Chrome headless with GPU support.
 * @author Jason Mayes (www.jasonmayes.com)
 * Connect with me on LinkedIn if questions:
 * https://www.linkedin.com/in/WebAI
 ******************************************************************************/
import * as chromeLauncher from 'chrome-launcher';
import CDP from 'chrome-remote-interface';
import * as fs from 'fs';

const urlParam = process.argv[2];
if (!urlParam) {
    throw "Please provide URL as a first argument";
}

(async function() {
  async function launchChrome() {
    return await chromeLauncher.launch({
      chromeFlags: [
        '--no-sandbox',
        '--headless=new',
        '--use-gl=angle',
        '--use-angle=gl-egl',
        '--enable-features=Vulkan',
        '--disable-vulkan-surface',
        '--enable-unsafe-webgpu',
        '--use-cmd-decoder=passthrough',
        '--ignore-gpu-blocklist',
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
    if (urlParam === "chrome://gpu") {
      const {data} = await Page.printToPDF();
      fs.writeFileSync('/home/gpu.pdf', Buffer.from(data, 'base64'));
      protocol.close();
      chrome.kill();
    }
  });

  await Promise.all([Network.enable(), Page.enable(), Runtime.enable(), DOM.enable(), Console.enable()]);

  Console.messageAdded(async (result) => {
    console.log(result.message.text);
    if (result.message.text === "captureAndEnd") {
      const {data} = await Page.captureScreenshot();
      fs.writeFileSync('/home/screen.png', Buffer.from(data, 'base64'));
      protocol.close();
      chrome.kill();
    }
  });

  Page.navigate({url: urlParam});

})();
