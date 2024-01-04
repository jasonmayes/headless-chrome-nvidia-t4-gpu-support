# Using headless Chrome on server side environments such as Google Cloud Platform or Google Colab for true client side browser emulation with NVIDIA server GPUs for Web AI or graphical workloads using WebGL or WebGPU.
This repo focuses on the running of client side AI models (that is machine learning models that execute within a web browser environment like Chrome that are often using the GPU for acceleration) within a server side environment such as Google Colab or Google Cloud Platofrm (GCP) for the purpose of testing such workloads in a standardised replicable environment. 

It should be noted however that this solution could also be used to load and run any web page that needs to utilise GPU hardware with WebGL or WebGPU support. As such this write up also applies to people working in the web gaming and graphics industries.

This repository compliments my easier to read blogpost writeup which you can find here: (COMING SOON)
We have confirmed and tested this solution to work on the following NVIDIA Server GPUs:
- NVIDIA T4
- NVIDIA V100

By running machine learning models client side you can gain super powers like privacy, lower latency, and significant cost savings vs executing in the cloud (Cloud AI). As of 2023 Google crossed over 1 billion downloads of their Web AI models and libraries - a historic milestone and a sign of how web developers and engineers are shifting to embrace AI in their next generation web apps to make some truly incredible solutions.

With great success in usage comes great responsibility. With this level of usage in production systems, the need arises for testing client side browser based AI models in a true browser environment, while also being scalable, automatable, and within a known standardised hardware setup. This allows you to then compare performance of such models over time, as they evolve, before they are deployed to production and run on real client machines.

Until now there was no publicly documented way to do this within Colab or Google Cloud Platform using the [*new* Chrome headless mode](https://developer.chrome.com/docs/chromium/new-headless) while keeping support for both WebGL and WebGPU enabled. This respository documents the solution to that problem.


## How to use in Google Colab

### 1. Create a new Google Colab Notebook
Ensure you are signed in with your Google account and head on over to colab.google, Once loaded click the “New Notebook” button at the top right of the page.
Alternatively [here is one I made you can use with the code below already pre added](https://colab.research.google.com/drive/1vuczRYfLUFq1RBbNknhz1JE8BZwE5_zd).

### 2. Connect to a T4 GPU enabled server
At the top right of the new project that loaded, click on the connect drop down icon near the top right of the notebook and select “change runtime type”. In the modal window that pops up, select a T4 GPU as your hardware accelerator. This will mean when you connect it will use a Linux instance with a T4 GPU attached.

Click save and then connect to your runtime by clicking the connect button at the top right of the project now it is configured correctly. After some time you should see it turn green along with RAM and Disk usage graphs, showing the server has successfully been created with your required hardware.

### 3. Install correct drivers and dependencies
Next up simply copy and paste the following 2 lines of code into the first code cell in the colab. Note, that in Colab environment, command line execution is prepended with an exclamation mark:

```
!git clone https://github.com/jasonmayes/headless-chrome-nvidia-t4-gpu-support.git
!cd headless-chrome-nvidia-t4-gpu-support && chmod +x scriptyMcScriptFace.sh && ./scriptyMcScriptFace.sh
```

Once pasted into the first code cell, you can click on the little play icon in the top left of the cell to execute the code.

Wait for the code to finish executing and verify nvidia-smi printed out that it recognized the Tesla T4 GPU to double check you do indeed have a GPU attached on your server (you may need to scroll up in the logs to view this output).

### 4. Run Node.js code to use and automate headless Chrome

Finally you can add a new code cell by clicking the “+Code” button near the top left of the page. Add the following code to call the jRunner.js Node script in this repo that will perform the capture of arbitary webpages you define (in this instance you will capture the chrome://gpu page):

```
!node headless-chrome-nvidia-t4-gpu-support/examples/chrome-direct/jRunner.js chrome://gpu
```

Alternatively if you prefer to use Puppeteer you can call:
```
!node headless-chrome-nvidia-t4-gpu-support/examples/puppeteer/jPuppet.js chrome://gpu
```

Note you could run your own code instead here - my jRunner.js / jPuppet.js code are simply starting points to show the basics of how to interface with headless Chrome correctly with GPU support. Also if you want to do this entirely command line without any Node.js script you could instead call:

```
!google-chrome-stable --no-sandbox --headless=new --use-angle=vulkan --enable-features=Vulkan --disable-vulkan-surface --enable-unsafe-webgpu --no-first-run --no-default-browser-check --disable-features=Translate --ash-no-nudges --disable-search-engine-choice-screen --window-size=1280,720 --print-to-pdf=/home/gpu.pdf chrome://gpu
```

In the example above I stored the resulting pdf capture in /home/gpu.pdf. If you want to view that file you can expand the left hand folder panel, navigate to home folder, and then click on the 3 dots next to the pdf file shown and download to your local machine to view to confirm the output is working as expected.

## Notes
Currently my jRunner.js script will take a screenshot and end the browser process when you log to the console "captureAndEnd" (case sensitive) so that you can load and do stuff in your webpage before this Node process actually captures the screenshot. Feel free to edit as you need to make it useful for your situation.

The WebGPU solution currently works so long as you are not drawing to canvas due to the disable-vulkan-surface flag. This is fine for Web AI workloads that do not render to canvas but may cause with WebGPU graphical workloads. Right now graphical support eg for gaming would only be via WebGL until a work around is found for this. Please make a PR if you find one.

## Contact
If you found this useful feel free to drop me a shout out over on [LinkedIn](https://www.linkedin.com/in/WebAI), [Twitter](https://twitter.com/jason_mayes), or whatever social network you use using hashtag **#WebAI**. It would be great to hear any feedback you have and so I know to write more stuff like this in the future. If it was useful, drop a star on this Github repo for any future updates I may add.

Finally if you are curious about Web AI (machine learning in JavaScript) and not sure how to get started you can [take my free course on Google Developers YouTube to go from zero to hero in Web ML](https://goo.gle/Learn-WebML)! All you need to know is JS, no background in AI required.

## Acknowledgements
A special thanks to François Beaufort, Yuly Novikov, Andrey Kosyakov, and Alex Rudenko who were instrumental in creating the final working solution with me.
