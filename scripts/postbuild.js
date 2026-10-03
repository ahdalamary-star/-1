import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');
const indexHtml = path.join(distDir, 'index.html');

if (fs.existsSync(indexHtml)) {
  fs.copyFileSync(indexHtml, path.join(distDir, '200.html'));
  fs.copyFileSync(indexHtml, path.join(distDir, '404.html'));
  console.log('✓ SPA routing fallbacks generated: 200.html and 404.html');
} else {
  console.warn('⚠ dist/index.html not found, skipping fallback copy.');
}
