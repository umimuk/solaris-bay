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
  const stem=ctx.createLinearGradient(0,110,1024,140);stem.addColorStop(0,'#7dc15b');stem.addColorStop(.45,'#287844');stem.addColorStop(1,'#b6d765');
  ctx.lineCap='round';ctx.lineWidth=9;ctx.strokeStyle=stem;ctx.beginPath();ctx.moveTo(22,132);ctx.quadraticCurveTo(480,76,1000,126);ctx.stroke();
  for(let i=0;i<31;i++){const t=(i+1)/33;const x=24+t*970;const y=132-42*Math.sin(t*Math.PI);const len=(68+62*Math.sin(t*Math.PI))*(1-.26*t);
    for(const sign of [-1,1]){const tipX=Math.min(1012,x+len*.57);const tipY=y+sign*len;const midX=x+len*.35;const midY=y+sign*len*.78;
      const g=ctx.createLinearGradient(x,y,midX,midY);g.addColorStop(0,'#17643b');g.addColorStop(.64,i%3?'#27874b':'#48a958');g.addColorStop(1,'#a9d35b');
      ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(midX-10,y+sign*9,tipX,tipY);ctx.quadraticCurveTo(midX+7,y+sign*8,x,y);ctx.fill();
    }
  }
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}

/** Small locally generated material set; no remote texture or image fetches. */
export function makeTextures(seed = 1) {
  const random = createRandom(seed);
  const asphalt = canvasTexture((ctx, size) => {
    ctx.fillStyle = '#292f36'; ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 14000; i++) {
      const value = 26 + random() * 45;
      ctx.fillStyle = `rgba(${value},${value + 2},${value + 5},${0.12 + random() * 0.2})`;
      ctx.fillRect(random() * size, random() * size, 1 + random() * 2.2, 1 + random() * 1.6);
    }
    for (const [y, alpha] of [[size * 0.28, 0.12], [size * 0.72, 0.1]]) {
      const wear = ctx.createLinearGradient(0, y - 18, 0, y + 18);
      wear.addColorStop(0, 'rgba(5,8,12,0)'); wear.addColorStop(0.5, `rgba(8,11,15,${alpha})`); wear.addColorStop(1, 'rgba(5,8,12,0)');
      ctx.fillStyle = wear; ctx.fillRect(0, y - 18, size, 36);
    }
    for (let i = 0; i < 220; i++) {
      ctx.strokeStyle = `rgba(8,12,18,${0.12 + random() * 0.18})`; ctx.lineWidth = 1 + random() * 2;
      const y = random() * size; ctx.beginPath(); ctx.moveTo(random() * size, y); ctx.lineTo(random() * size, y + random() * 3); ctx.stroke();
    }
  });
  const windows = canvasTexture((ctx, size) => {
    const sky = ctx.createLinearGradient(0, 0, size, size); sky.addColorStop(0, '#1b374a'); sky.addColorStop(.28, '#42677a'); sky.addColorStop(.48, '#a9b6b2'); sky.addColorStop(.52, '#324d5c'); sky.addColorStop(1, '#142c3d');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = 'rgba(236,219,183,.22)'; ctx.fillRect(0, size * .13, size, 8); ctx.fillRect(0, size * .48, size, 7); ctx.fillRect(0, size * .84, size, 8);
    for (let y = 14; y < size; y += 64) for (let x = 12; x < size; x += 54) {
      const lit = random() < .31;
      const tone = lit ? (random() < .65 ? '255,207,145' : '176,220,230') : '8,25,39';
      ctx.fillStyle = `rgba(${tone},${lit ? .46 + random() * .27 : .42})`;
      ctx.fillRect(x, y, 39, 45);
      ctx.fillStyle = lit ? 'rgba(255,238,201,.2)' : 'rgba(184,218,223,.13)';
      for (let blind = 0; blind < 5; blind++) ctx.fillRect(x + 2, y + 5 + blind * 7, 35, 1.5);
      ctx.fillStyle = 'rgba(224,238,230,.38)'; ctx.fillRect(x - 2, y - 2, 2, 49); ctx.fillRect(x + 38, y - 2, 2, 49);
    }
    ctx.fillStyle = 'rgba(237,218,185,.3)'; ctx.fillRect(0, size * .27, size, 4); ctx.fillRect(0, size * .62, size, 4);
    ctx.fillStyle = 'rgba(9,29,43,.54)'; ctx.fillRect(0, size - 16, size, 16);
  });
  const facade = canvasTexture((ctx, size) => {
    const plaster = ctx.createLinearGradient(0, 0, size, size); plaster.addColorStop(0, '#e8d6bd'); plaster.addColorStop(.42, '#cbb499'); plaster.addColorStop(1, '#f0ddc1');
    ctx.fillStyle = plaster; ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 4400; i++) { const shade = random() < .5 ? '90,64,49' : '255,244,222'; ctx.fillStyle = `rgba(${shade},${0.025 + random() * .055})`; ctx.fillRect(random() * size, random() * size, 1 + random() * 3, 1 + random() * 2); }
    for (let y = 36; y < size - 28; y += 92) {
      ctx.fillStyle = 'rgba(94,74,64,.5)'; ctx.fillRect(12, y, size - 24, 5);
      ctx.fillStyle = 'rgba(255,247,224,.72)'; ctx.fillRect(12, y + 5, size - 24, 7);
      for (let x = 28; x < size - 20; x += 74) {
        const lit = random() < .34;
        ctx.fillStyle = lit ? (random() < .72 ? '#e6a867' : '#91bdc5') : '#294653';
        ctx.fillRect(x, y + 17, 48, 52);
        ctx.fillStyle = lit ? 'rgba(255,239,196,.28)' : 'rgba(153,202,209,.2)';
        for (let blind = 0; blind < 4; blind++) ctx.fillRect(x + 3, y + 23 + blind * 9, 42, 2);
        ctx.strokeStyle = 'rgba(248,235,211,.76)'; ctx.lineWidth = 4; ctx.strokeRect(x - 3, y + 14, 54, 58);
        ctx.fillStyle = '#d9c7a8'; ctx.fillRect(x + 22, y + 16, 3, 55);
      }
    }
    ctx.fillStyle = '#f1dfbf'; ctx.fillRect(0, 0, size, 18); ctx.fillStyle = '#b58d67'; ctx.fillRect(0, 19, size, 7); ctx.fillRect(0, size - 28, size, 10);
    for (let x = 0; x < size; x += 12) { ctx.fillStyle = x % 24 ? '#f4e7d0' : '#cd9d72'; ctx.fillRect(x, 0, 6, 9); }
    const awningY = size - 88;
    for (let x = 0; x < size; x += 40) { ctx.fillStyle = x % 80 ? '#f3dfc6' : '#c6554f'; ctx.fillRect(x, awningY, 40, 40); }
    ctx.fillStyle = 'rgba(18,36,43,.7)'; ctx.fillRect(0, size - 44, size, 16);
  });
  const water = canvasTexture((ctx, size) => {
    const gradient = ctx.createLinearGradient(0, 0, size, size); gradient.addColorStop(0, '#147c91'); gradient.addColorStop(0.48, '#20aabc'); gradient.addColorStop(1, '#24617b'); ctx.fillStyle = gradient; ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 1200; i++) { ctx.fillStyle = `rgba(255,${218 + random() * 30|0},${155 + random() * 55|0},${random() * 0.26})`; ctx.fillRect(random() * size, random() * size, 8 + random() * 100, 1 + random() * 3); }
  });
  return { asphalt, windows, facade, emissiveWindows: windows, water };
}

/** PMREM environment generator for warm coast, neon streets, and a studio reveal. */
export function createReflectionEnvironments(renderer) {
  const generator = new THREE.PMREMGenerator(renderer);
  const environments = {};
  const make = (name, skyColor, horizonColor, lightColor, panels = false) => {
    const envScene = new THREE.Scene(); envScene.background = new THREE.Color(skyColor);
    const panorama = document.createElement('canvas'); panorama.width = 1024; panorama.height = 512;
    const panoramaContext = panorama.getContext('2d');
    const skyGradient = panoramaContext.createLinearGradient(0, 0, 0, 512);
    skyGradient.addColorStop(0, skyColor); skyGradient.addColorStop(0.38, horizonColor); skyGradient.addColorStop(0.57, horizonColor); skyGradient.addColorStop(1, skyColor);
    panoramaContext.fillStyle = skyGradient; panoramaContext.fillRect(0, 0, 1024, 512);
    if (!panels) {
      const glow = panoramaContext.createRadialGradient(720, 275, 2, 720, 275, name === 'neon' ? 185 : 125);
      glow.addColorStop(0, name === 'neon' ? 'rgba(67,221,255,.72)' : 'rgba(255,231,181,.88)');
      glow.addColorStop(0.18, name === 'neon' ? 'rgba(255,68,166,.38)' : 'rgba(255,177,95,.4)'); glow.addColorStop(1, 'rgba(255,255,255,0)');
      panoramaContext.fillStyle = glow; panoramaContext.fillRect(500, 80, 440, 400);
      if (name === 'neon') for (let index = 0; index < 120; index++) {
        const x = (index * 83) % 1024; const y = 150 + (index * 47) % 285;
        panoramaContext.fillStyle = index % 2 ? 'rgba(255,72,174,.42)' : 'rgba(64,220,255,.4)'; panoramaContext.fillRect(x, y, 4 + index % 9, 3 + index % 13);
      }
    }
    const panoramaTexture = new THREE.CanvasTexture(panorama); panoramaTexture.colorSpace = THREE.SRGBColorSpace;
    const ground = new THREE.Mesh(new THREE.SphereGeometry(40, 48, 32), new THREE.MeshBasicMaterial({ map: panoramaTexture, side: THREE.BackSide })); envScene.add(ground);
    const key = new THREE.DirectionalLight(lightColor, panels ? 5 : 3); key.position.set(-8, 12, 6); envScene.add(key);
    const fill = new THREE.DirectionalLight(panels ? 0xffffff : lightColor, panels ? 3.4 : 1.6); fill.position.set(7, 5, -8); envScene.add(fill);
    if (panels) {
      const softbox = new THREE.MeshBasicMaterial({ color: 0xffffff });
      for (const [x, y, z, sx, sy, sz] of [[-8, 11, -2, 7, .35, 3], [5, 9, 1, 5, .3, 2], [0, 12, 8, 8, .24, 2]]) {
        const box = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), softbox); box.position.set(x, y, z); envScene.add(box);
      }
    }
    const target = generator.fromScene(envScene, 0.04, 0.1, 100);
    environments[name] = target.texture;
    panoramaTexture.dispose();
    envScene.traverse((object) => { object.geometry?.dispose(); if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose()); else object.material?.dispose(); });
  };
  make('coast', '#ffbf83', '#176a83', '#ffd194');
  make('neon', '#07122e', '#271039', '#ff56b8');
  make('studio', '#111a28', '#263746', '#e8faff', true);
  return environments;
}
