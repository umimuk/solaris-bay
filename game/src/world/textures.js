import * as THREE from '../../vendor/three.module.min.js';
import { createRandom } from '../random.js';

function canvasTexture(draw, size = 512) {
  const canvas = document.createElement('canvas'); canvas.width = size; canvas.height = size;
  draw(canvas.getContext('2d'), size);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/** Small locally generated material set; no remote texture or image fetches. */
export function makeTextures(seed = 1) {
  const random = createRandom(seed);
  const asphalt = canvasTexture((ctx, size) => {
    ctx.fillStyle = '#535a61'; ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 2600; i++) { const value = 55 + random() * 36; ctx.fillStyle = `rgba(${value},${value + 4},${value + 9},.28)`; ctx.fillRect(random() * size, random() * size, 1 + random() * 4, 1 + random() * 2); }
    ctx.strokeStyle = 'rgba(248,214,137,.72)'; ctx.lineWidth = 5; ctx.setLineDash([36, 28]); ctx.beginPath(); ctx.moveTo(size / 2, 0); ctx.lineTo(size / 2, size); ctx.stroke(); ctx.setLineDash([]);
  });
  const windows = canvasTexture((ctx, size) => {
    ctx.fillStyle = '#101c2b'; ctx.fillRect(0, 0, size, size);
    for (let y = 8; y < size; y += 22) for (let x = 8; x < size; x += 26) {
      const lit = random() > 0.23; const hue = random();
      ctx.fillStyle = !lit ? 'rgba(32,51,71,.85)' : hue < 0.42 ? 'rgba(255,194,104,.98)' : hue < 0.72 ? 'rgba(72,225,242,.95)' : 'rgba(255,227,198,.96)';
      ctx.fillRect(x, y, 14, 12);
    }
  });
  const water = canvasTexture((ctx, size) => {
    const gradient = ctx.createLinearGradient(0, 0, size, size); gradient.addColorStop(0, '#12384f'); gradient.addColorStop(0.45, '#17607b'); gradient.addColorStop(1, '#9c6271'); ctx.fillStyle = gradient; ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 1100; i++) { ctx.fillStyle = `rgba(246,214,170,${random() * 0.26})`; ctx.fillRect(random() * size, random() * size, 8 + random() * 85, 1 + random() * 2); }
  });
  return { asphalt, windows, emissiveWindows: windows, water };
}
