import * as THREE from '../../vendor/three.module.min.js';
import { makePalmFrondTexture } from '../world/textures.js';

const solid = (color, emissive = 0) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, emissive: emissive ? color : 0, emissiveIntensity: emissive });
const addBox = (group, geometry, material, position) => { const mesh = new THREE.Mesh(geometry, material); mesh.position.set(...position); group.add(mesh); return mesh; };

let frondTexture;
/** Segmented tropical trunk and ten feathered, arching palm crowns. */
export function createPalm() {
  const group = new THREE.Group();
  const bark = solid(0x79563a); let previous=new THREE.Vector3(0,0,0);
  for (let segment = 0; segment < 10; segment++) {
    const t=(segment+1)/10;const next=new THREE.Vector3(.22*Math.sin(t*1.1),t*6.7,0);const delta=next.clone().sub(previous);
    const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.14-t*.07,.23-t*.065,delta.length(),9),bark);trunk.position.copy(previous).add(next).multiplyScalar(.5);trunk.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());group.add(trunk);previous=next;
  }
  if(!frondTexture)frondTexture=makePalmFrondTexture();
  const crown=new THREE.Vector3(.22*Math.sin(1.1),6.55,0);
  const frondMat=new THREE.MeshStandardMaterial({map:frondTexture,transparent:true,alphaTest:.25,side:THREE.DoubleSide,roughness:.78,metalness:.02});
  for(let i=0;i<10;i++){
    const angle=i*Math.PI*2/10;const dir=new THREE.Vector3(Math.cos(angle),0,Math.sin(angle));const side=new THREE.Vector3(-dir.z,0,dir.x);
    const verts=[],uv=[],idx=[];const rows=12;
    for(let j=0;j<=rows;j++){const t=j/rows;const center=crown.clone().addScaledVector(dir,3.85*t).add(new THREE.Vector3(0,1.15*Math.sin(Math.PI*t)-1.45*t,0));const width=(.24+.55*Math.sin(Math.PI*t))*(1-t*.42);
      const a=center.clone().addScaledVector(side,-width);const b=center.clone().addScaledVector(side,width);verts.push(a.x,a.y,a.z,b.x,b.y,b.z);uv.push(t,0,t,1);if(j<rows){const k=j*2;idx.push(k,k+1,k+2,k+1,k+3,k+2);}}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();group.add(new THREE.Mesh(geo,frondMat));
  }
  return group;
}

/** Neon sign with a bright panel and locally generated, readable lettering. */
export function createSign(label, color = 0x50e5ec) {
  const group = new THREE.Group();
  const frame = addBox(group, new THREE.BoxGeometry(5.8, 1.05, 0.2), solid(0x101923), [0, 0, 0]);
  const glow = addBox(group, new THREE.BoxGeometry(5.55, 0.83, 0.08), new THREE.MeshBasicMaterial({ color }), [0, 0, 0.13]);
  const canvas = document.createElement('canvas'); canvas.width = 768; canvas.height = 160;
  const context = canvas.getContext('2d'); context.clearRect(0, 0, 768, 160); context.font = 'bold 76px Chakra, Arial, sans-serif'; context.textAlign = 'center'; context.textBaseline = 'middle'; context.shadowColor = `#${color.toString(16).padStart(6, '0')}`; context.shadowBlur = 20; context.fillStyle = '#fff4de'; context.fillText(label, 384, 82);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  const lettering = new THREE.Mesh(new THREE.PlaneGeometry(5.3, 0.72), new THREE.MeshBasicMaterial({ map: texture, transparent: true, toneMapped: false })); lettering.position.z = 0.19; group.add(frame, glow, lettering);
  return group;
}

/** Ribbed shipping crate / dock cargo prop. */
export function createCrate(color = 0x283b4a) {
  const group = new THREE.Group(); const shell = solid(color); const edge = solid(0x9ba5a1);
  addBox(group, new THREE.BoxGeometry(5.4, 2.7, 2.7), shell, [0, 1.35, 0]);
  for (let x = -2.45; x <= 2.46; x += 0.42) addBox(group, new THREE.BoxGeometry(0.045, 2.56, 2.74), edge, [x, 1.35, 0]);
  for (const y of [0.14, 2.56]) addBox(group, new THREE.BoxGeometry(5.5, 0.08, 2.8), edge, [0, y, 0]);
  return group;
}
