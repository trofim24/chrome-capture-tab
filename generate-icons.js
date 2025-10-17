const fs = require('fs');

// Create SVG icons and convert to PNG using Node.js
function createIcon(size) {
  // Create SVG content
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#4CAF50"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size/3}" fill="#f44336"/>
</svg>`;
  
  return svg;
}

// Save SVG files
fs.writeFileSync('icon16.svg', createIcon(16));
fs.writeFileSync('icon48.svg', createIcon(48));
fs.writeFileSync('icon128.svg', createIcon(128));

console.log('SVG icons created. Converting to PNG requires external tools.');
console.log('You can:');
console.log('1. Use an online SVG to PNG converter');
console.log('2. Use ImageMagick: convert icon*.svg icon*.png');
console.log('3. Or manually create PNG icons in an image editor');
console.log('\nAlternatively, you can use the create-icons.html file in a browser to download the icons.');
