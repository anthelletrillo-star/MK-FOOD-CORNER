const sharp = require('sharp');
const path = require('path');

const SOURCE = path.resolve(__dirname, '..', 'Untitled design.png');
const PUBLIC = path.resolve(__dirname, 'public');

async function generate() {
  await sharp(SOURCE).resize(192, 192, { fit: 'cover' }).png().toFile(path.join(PUBLIC, 'icon-192.png'));
  console.log('icon-192.png done');

  await sharp(SOURCE).resize(512, 512, { fit: 'cover' }).png().toFile(path.join(PUBLIC, 'icon-512.png'));
  console.log('icon-512.png done');

  await sharp(SOURCE).resize(512, 512, { fit: 'cover' }).png().toFile(path.join(PUBLIC, 'icon-maskable-512.png'));
  console.log('icon-maskable-512.png done');

  await sharp(SOURCE).resize(64, 64, { fit: 'cover' }).png().toFile(path.join(PUBLIC, 'favicon.png'));
  console.log('favicon.png done');

  console.log('All icons generated!');
}

generate().catch(err => { console.error(err); process.exit(1); });
