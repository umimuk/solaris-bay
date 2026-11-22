import * as THREE from '../../vendor/three.module.min.js';
import { createRandom } from '../random.js';

function canvasTexture(draw, size = 512) {
  const canvas = document.createElement('canvas'); canvas.width = size; canvas.height = size;
  draw(canvas.getContext('2d'), size);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/** Locally painted feathered palm frond with a transparent canopy silhouette. */
export function makePalmFrondTexture() {
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;const ctx=canvas.getContext('2d');
  const stem=ctx.createLinearGradient(0,110,1024,140);stem.addColorStop(0,'#b9c878');stem.addColorStop(.45,'#719b45');stem.addColorStop(1,'#d6d08a');
  ctx.lineCap='round';ctx.lineWidth=9;ctx.strokeStyle=stem;ctx.beginPath();ctx.moveTo(22,132);ctx.quadraticCurveTo(480,76,1000,126);ctx.stroke();
  for(let i=0;i<31;i++){const t=(i+1)/33;const x=24+t*970;const y=132-42*Math.sin(t*Math.PI);const len=(68+62*Math.sin(t*Math.PI))*(1-.26*t);
    for(const sign of [-1,1]){const tipX=Math.min(1012,x+len*.57);const tipY=y+sign*len;const midX=x+len*.35;const midY=y+sign*len*.78;
      const g=ctx.createLinearGradient(x,y,midX,midY);g.addColorStop(0,'#48784b');g.addColorStop(.64,i%3?'#68a65b':'#88b867');g.addColorStop(1,'#d3d18a');
      ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(midX-10,y+sign*9,tipX,tipY);ctx.quadraticCurveTo(midX+7,y+sign*8,x,y);ctx.fill();
    }
  }
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}

/** Small locally generated material set; no remote texture or image fetches. */
export function makeTextures(seed = 1) {
  const random = createRandom(seed);
  const asphalt = canvasTexture((ctx, size) => {
    ctx.fillStyle = '#464c58'; ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 1550; i++) { const value = 62 + random() * 34; ctx.fillStyle = `rgba(${value},${value + 3},${value + 7},.2)`; ctx.fillRect(random() * size, random() * size, 1 + random() * 3, 1 + random() * 2); }
  });
  const windows = canvasTexture((ctx, size) => {
    const sky = ctx.createLinearGradient(0, 0, size, size); sky.addColorStop(0, '#29495b'); sky.addColorStop(.42, '#527485'); sky.addColorStop(1, '#213d50');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = 'rgba(221,237,226,.22)'; ctx.fillRect(0, size * .16, size, 8); ctx.fillRect(0, size * .48, size, 6); ctx.fillRect(0, size * .8, size, 8);
    for (let y = 28; y < size; y += 82) for (let x = 22; x < size; x += 68) {
      const lit = random() < .25; ctx.fillStyle = lit ? 'rgba(255,220,165,.58)' : 'rgba(11,31,46,.38)';
      ctx.fillRect(x, y, 43, 45); ctx.strokeStyle = 'rgba(220,237,230,.24)'; ctx.lineWidth = 2; ctx.strokeRect(x, y, 43, 45);
    }
    ctx.fillStyle = 'rgba(9,29,43,.45)'; ctx.fillRect(0, size - 18, size, 18);
  });
  const water = canvasTexture((ctx, size) => {
    const gradient = ctx.createLinearGradient(0, 0, size, size); gradient.addColorStop(0, '#1a8ba3'); gradient.addColorStop(0.48, '#20aabc'); gradient.addColorStop(1, '#24617b'); ctx.fillStyle = gradient; ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 650; i++) { ctx.fillStyle = `rgba(244,239,207,${random() * 0.2})`; ctx.fillRect(random() * size, random() * size, 10 + random() * 90, 1 + random() * 2); }
  });
  return { asphalt, windows, emissiveWindows: windows, water };
}
