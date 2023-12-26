# Update, install correct drivers, and remove the old ones.
apt-get update
apt-get install -y wget vulkan-tools xvfb libnvidia-gl-525
apt-get remove -y mesa-vulkan-drivers
cat /etc/lsb-release
# Verify NVIDIA drivers can see the T4 GPU and that vulkan is working correctly.
nvidia-smi
vulkaninfo

# Now install latest version of Node.js
npm install -g n
n lts
node --version
npm --version

# Next install Chrome stable
curl -fsSL https://dl.google.com/linux/linux_signing_key.pub | sudo gpg --dearmor -o /usr/share/keyrings/googlechrom-keyring.gpg
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/googlechrom-keyring.gpg] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list
sudo apt update
sudo apt install -y google-chrome-stable

# Start dbus to avoid warnings by Chrome later.
/etc/init.d/dbus start

cd examples/chrome-direct && npm install
cd ../puppeteer && npm install
