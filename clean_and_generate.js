const fs = require('fs');
const path = require('path');

// 1. Remove Emojis from app/book/page.js
const pagePath = path.join(__dirname, 'app', 'book', 'page.js');
let pageContent = fs.readFileSync(pagePath, 'utf8');

// Regex to match emojis
const emojiRegex = /[\u{1F300}-\u{1F5FF}\u{1F900}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F191}-\u{1F251}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F171}\u{1F17E}-\u{1F17F}\u{1F18E}\u{3030}\u{2B50}\u{2B55}\u{2934}-\u{2935}\u{2B05}-\u{2B07}\u{2B1B}-\u{2B1C}\u{3297}\u{3299}\u{303D}\u{00A9}\u{00AE}\u{2122}\u{23F3}\u{24C2}\u{23E9}-\u{23EF}\u{25B6}\u{23F8}-\u{23FA}]/gu;

pageContent = pageContent.replace(emojiRegex, '');
// Clean up any stray spaces left behind before/after emojis (optional, but good)
pageContent = pageContent.replace(/\s+\)/g, ')').replace(/\s+\]/g, ']');

fs.writeFileSync(pagePath, pageContent, 'utf8');
console.log('Emojis removed from app/book/page.js');

// 2. Generate public/crop_images.html
const publicImagesPath = path.join(__dirname, 'public', 'images');
const productsPath = path.join(publicImagesPath, 'products');

const allImages = [];

function scanDir(dir, prefix) {
  if (!fs.existsSync(dir)) return;
  const items = fs.readdirSync(dir);
  for (const item of items) {
    if (item.endsWith('.png') || item.endsWith('.jpg') || item.endsWith('.jpeg')) {
      allImages.push(`${prefix}/${item}`);
    }
  }
}

scanDir(publicImagesPath, '/images');
scanDir(productsPath, '/images/products');

const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Outil de recadrage des images</title>
    <style>
        body { font-family: sans-serif; background: #f3f4f6; padding: 20px; }
        .gallery { display: flex; flex-wrap: wrap; gap: 20px; }
        .card { background: white; padding: 10px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); width: 200px; display: flex; flex-direction: column; align-items: center; }
        .img-container { width: 150px; height: 150px; border: 1px dashed #ccc; display: flex; align-items: center; justify-content: center; background: #fafafa; margin-bottom: 10px; overflow: hidden; }
        img { max-width: 100%; max-height: 100%; object-fit: contain; }
        .name { font-size: 12px; color: #333; text-align: center; word-break: break-all; }
    </style>
</head>
<body>
    <h1>Toutes les images (${allImages.length})</h1>
    <p>Vous pouvez visualiser toutes les images ci-dessous. Modifiez-les dans le dossier <code>public/images</code>.</p>
    <div class="gallery">
        ${allImages.map(img => `
        <div class="card">
            <div class="img-container">
                <img src="${img}" alt="${img}">
            </div>
            <div class="name">${img}</div>
        </div>`).join('')}
    </div>
</body>
</html>`;

fs.writeFileSync(path.join(__dirname, 'public', 'crop_images.html'), htmlContent, 'utf8');
console.log('public/crop_images.html generated successfully.');
