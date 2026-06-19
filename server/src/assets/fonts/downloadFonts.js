const fs = require('fs');
const path = require('path');
const https = require('https');

const fonts = [
  {
    url: 'https://rsms.me/inter/font-files/Inter-Regular.woff2?v=4.1',
    filename: 'Inter-Regular.woff2'
  },
  {
    url: 'https://rsms.me/inter/font-files/Inter-Bold.woff2?v=4.1',
    filename: 'Inter-Bold.woff2'
  }
];

const download = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    }, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirect
        download(response.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: status code ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
};

async function main() {
  const targetDir = __dirname;
  console.log(`Downloading fonts to ${targetDir}...`);
  for (const font of fonts) {
    const dest = path.join(targetDir, font.filename);
    console.log(`Downloading ${font.url} -> ${dest}`);
    try {
      await download(font.url, dest);
      console.log(`Success! Saved to ${font.filename}`);
    } catch (err) {
      console.error(`Error downloading ${font.filename}:`, err);
    }
  }
  console.log('Done!');
}

main();
