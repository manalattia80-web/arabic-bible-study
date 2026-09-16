const { Jimp } = require('jimp');

async function crop() {
  const img = await Jimp.read('C:/Users/manal/.gemini/antigravity/brain/6d627a05-53e4-4c46-8d77-9c11b867e94a/.user_uploaded/media_1787563127139.jpg');
  // Crop a square in the center
  // The height is 558. Let's make it 500x500 to tightly frame the logo?
  // Let's assume the logo itself is about 500px tall.
  const size = 520; 
  const x = (img.bitmap.width - size) / 2;
  const y = (img.bitmap.height - size) / 2;
  
  img.crop({ x, y, w: size, h: size });
  await img.write('mobile/assets/logo.png');
  console.log('Done cropping!');
}
crop();
