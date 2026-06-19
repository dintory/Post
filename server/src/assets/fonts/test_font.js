const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const https = require('https');

const woff2Url = 'https://rsms.me/inter/font-files/Inter-Regular.woff2?v=4.1';

const download = (url, dest) => {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Status ${response.statusCode}`));
        return;
      }
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
};

async function main() {
  try {
    console.log('Downloading Inter-Regular.woff2...');
    const fontBuffer = await download(woff2Url);
    const base64Font = fontBuffer.toString('base64');
    console.log('Font downloaded, base64 length:', base64Font.length);

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="800" height="200" viewBox="0 0 800 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      @font-face {
        font-family: 'InterTest';
        src: url('data:font/woff2;base64,${base64Font}') format('woff2');
        font-weight: normal;
        font-style: normal;
      }
      text {
        font-family: 'InterTest', sans-serif;
        font-size: 48px;
        fill: #000000;
      }
    </style>
  </defs>
  <rect width="100%" height="100%" fill="#ffffff" />
  <text x="50" y="120">Hello in Inter Font! 1234567890</text>
</svg>`;

    const outputPath = path.join(__dirname, 'font_test.png');
    await sharp(Buffer.from(svg))
      .png()
      .toFile(outputPath);
    console.log('Font test PNG created at:', outputPath);
  } catch (err) {
    console.error('Error in font test:', err);
  }
}

main();
