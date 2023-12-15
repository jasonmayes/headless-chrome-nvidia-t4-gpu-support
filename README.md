# Using headless Chrome on server side environments for true client side browser emulation with NVIDIA T4 GPUs for Web AI or graphical workloads using WebGL.
This repo focuses on the running of client side AI models (that is machine learning models that execute within a web browser environment like Chrome that are often using the GPU for acceleration) within a server side environment such as Google Colab or Google Cloud Platofrm (GCP) for the purpose of testing such workloads in a standardised replicable environment. 

It should be noted however that this solution could also be used to load and run any web page that needs to utilise GPU hardware with WebGL support (WebGPU still under investigation). As such this write up also applies to people working in the web gaming and graphics industries.

This repository compliments my blogpost writeup which you can find here: (COMMING SOON)

## How to use in Google Colab

### 1. Create a new Google Colab Workspace
Ensure you are signed in with your Google account and head on over to colab.google, Once loaded click the “New Notebook” button at the top right of the page.

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
!node headless-chrome-nvidia-t4-gpu-support/jRunner.js chrome://gpu
```

Note you could run your own code instead here - my jRunner.js code is simply a starting point to show the basics of how to interface with headless Chrome correctly with GPU support. Also if you want to do this entirely command line with no Node.js script you could instead call:

```
!google-chrome-stable --no-sandbox --headless --use-gl=angle --use-angle=gl-egl --use-cmd-decoder=passthrough --enable-unsafe-webgpu --ignore-gpu-blocklist --print-to-pdf=/home/gpu.pdf chrome://gpu
```

In the example above I stored the resulting pdf capture in /home/gpu.pdf. If you want to view that file you can expand the left hand folder panel, navigate to home folder, and then click on the 3 dots next to the pdf file shown and download to your local machine to view to confirm the output is working as expected.

## Contact
If you found this useful feel free to drop me a shout out over on LinkedIn, Twitter, or whatever social network you use. It would be great to hear any feedback you have and so I know to write more stuff like this in the future. If it was useful, drop a star on this Github repo for any future updates I may add.

## Acknowledgements

A special thanks to Yuly Novikov, Andrey Kosyakov, and Alex Rudenko who were instrumental in creating the final working solution with me.
