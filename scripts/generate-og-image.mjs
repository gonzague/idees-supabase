import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

// Create a 1200x630 OG image with gradient background and lightbulb icon
const ogSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366f1"/>
      <stop offset="50%" style="stop-color:#7c3aed"/>
      <stop offset="100%" style="stop-color:#9333ea"/>
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bgGradient)"/>
  
  <!-- Subtle pattern overlay -->
  <g opacity="0.1">
    <circle cx="100" cy="100" r="150" fill="white"/>
    <circle cx="1100" cy="530" r="200" fill="white"/>
    <circle cx="900" cy="80" r="80" fill="white"/>
  </g>
  
  <!-- Lightbulb icon -->
  <g transform="translate(520, 120)" fill="white">
    <path d="M80 0c-33.137 0-60 26.863-60 60 0 22.056 11.912 41.308 30 51.72V128c0 6.627 5.373 12 12 12h36c6.627 0 12-5.373 12-12v-16.28c18.088-10.412 30-29.664 30-51.72 0-33.137-26.863-60-60-60z" transform="scale(1.2)"/>
    <rect x="44" y="152" width="72" height="10" rx="5" transform="scale(1.2)"/>
    <rect x="44" y="168" width="72" height="10" rx="5" transform="scale(1.2)"/>
    <path d="M56 184h48v8a8 8 0 01-8 8H64a8 8 0 01-8-8v-8z" transform="scale(1.2)"/>
  </g>
  
  <!-- Site name -->
  <text x="600" y="420" font-family="system-ui, -apple-system, sans-serif" font-size="96" font-weight="bold" fill="white" text-anchor="middle">
    Idées
  </text>
  
  <!-- Tagline -->
  <text x="600" y="500" font-family="system-ui, -apple-system, sans-serif" font-size="32" fill="white" opacity="0.9" text-anchor="middle">
    Proposez et votez pour des sujets
  </text>
</svg>`;

async function generateOgImage() {
  console.log('Generating OG image...');
  
  const svg = Buffer.from(ogSvg);
  const outputPath = join(publicDir, 'og-image.png');
  
  await sharp(svg)
    .png()
    .toFile(outputPath);
  
  console.log('Created og-image.png');
}

generateOgImage().catch(console.error);
