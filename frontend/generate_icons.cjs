const sharp = require('sharp');
const path = require('path');

const SOURCE = path.resolve(__dirname, '..', 'mk logo.jpg');
const PUBLIC = path.resolve(__dirname, 'public');

async function generate() {
  // Generate 192x192 icon
  await sharp(SOURCE)
    .resize(192, 192, { fit: 'cover' })
    .png()
    .toFile(path.join(PUBLIC, 'icon-192.png'));
  console.log('✅ icon-192.png created');

  // Generate 512x512 icon
  await sharp(SOURCE)
    .resize(512, 512, { fit: 'cover' })
    .png()
    .toFile(path.join(PUBLIC, 'icon-512.png'));
  console.log('✅ icon-512.png created');

  // Generate favicon.ico (as PNG, browsers accept it)
  await sharp(SOURCE)
    .resize(64, 64, { fit: 'cover' })
    .png()
    .toFile(path.join(PUBLIC, 'favicon.ico'));
  console.log('✅ favicon.ico created');

  // Also update favicon.png used for apple-touch-icon
  await sharp(SOURCE)
    .resize(180, 180, { fit: 'cover' })
    .png()
    .toFile(path.join(PUBLIC, 'favicon.png'));
  console.log('✅ favicon.png updated');

  // Generate a maskable icon (with padding for safe zone)
  await sharp(SOURCE)
    .resize(384, 384, { fit: 'contain', background: { r: 249, g: 115, b: 22, alpha: 1 } })
    .extend({
      top: 64,
      bottom: 64,
      left: 64,
      right: 64,
      background: { r: 249, g: 115, b: 22, alpha: 1 }
    })
    .resize(512, 512)
    .png()
    .toFile(path.join(PUBLIC, 'icon-maskable-512.png'));
  console.log('✅ icon-maskable-512.png created');

  console.log('\nAll icons generated successfully!');
}

generate().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
