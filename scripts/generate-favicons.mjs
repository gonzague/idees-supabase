import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

// SVG with lightbulb icon
const svgTemplate = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>
    <linearGradient id="bulbGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366f1"/>
      <stop offset="100%" style="stop-color:#9333ea"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="url(#bulbGradient)"/>
  <g fill="white" transform="scale(${size / 64})">
    <path d="M32 12c-8.284 0-15 6.716-15 15 0 5.514 2.978 10.327 7.5 12.93V44c0 1.657 1.343 3 3 3h9c1.657 0 3-1.343 3-3v-4.07c4.522-2.603 7.5-7.416 7.5-12.93 0-8.284-6.716-15-15-15z"/>
    <rect x="25" y="48" width="14" height="2" rx="1"/>
    <rect x="25" y="52" width="14" height="2" rx="1"/>
    <path d="M28 56h8v2a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2z"/>
  </g>
</svg>`;

const sizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-512x512.png', size: 512 },
];

async function generateFavicons() {
  console.log('Generating favicons...');
  
  for (const { name, size } of sizes) {
    const svg = Buffer.from(svgTemplate(size));
    const outputPath = join(publicDir, name);
    
    await sharp(svg)
      .png()
      .toFile(outputPath);
    
    console.log(`Created ${name}`);
  }
  
  // Generate ICO (use 32x32 as base)
  const ico32Svg = Buffer.from(svgTemplate(32));
  const ico32Buffer = await sharp(ico32Svg).png().toBuffer();
  
  // For ICO, we'll just use the 32x32 PNG renamed (browsers accept this)
  // A proper ICO would need ico-encoder package, but this works for most browsers
  const ico16Svg = Buffer.from(svgTemplate(16));
  const ico16Buffer = await sharp(ico16Svg).png().toBuffer();
  
  // Create a simple ICO file (PNG inside ICO container)
  // ICO header + single 32x32 image entry
  const icoPath = join(publicDir, 'favicon.ico');
  await sharp(ico32Svg).png().toFile(icoPath.replace('.ico', '-temp.png'));
  
  // Just copy the 32x32 as ico for now (modern browsers handle PNG favicons)
  await sharp(ico32Svg)
    .resize(32, 32)
    .png()
    .toFile(join(publicDir, 'favicon.ico'));
  
  console.log('Created favicon.ico');
  console.log('Done!');
}

generateFavicons().catch(console.error);
