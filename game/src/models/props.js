import * as THREE from '../../vendor/three.module.min.js';

const solid = (color, emissive = 0) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, emissive: emissive ? color : 0, emissiveIntensity: emissive });
const addBox = (group, geometry, material, position) => { const mesh = new THREE.Mesh(geometry, material); mesh.position.set(...position); group.add(mesh); return mesh; };

/** Segmented, slightly leaning trunk with eight arched, drooping fronds. */
export function createPalm() {
  const group = new THREE.Group();
  const bark = solid(0x79563a);
  for (let segment = 0; segment < 7; segment++) {
    const y = 0.38 + segment * 0.62;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2 - segment * 0.012, 0.24 - segment * 0.012, 0.72, 8), bark);
    trunk.position.set(segment * 0.035, y, 0); trunk.rotation.z = -0.055; group.add(trunk);
  }
  const crown = new THREE.Vector3(0.25, 4.85, 0);
  for (let frond = 0; frond < 8; frond++) {
    const angle = frond * Math.PI / 4;
    const direction = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    const points = [crown.clone(), crown.clone().addScaledVector(direction, 0.78).add(new THREE.Vector3(0, 0.35, 0)), crown.clone().addScaledVector(direction, 1.65).add(new THREE.Vector3(0, 0.03, 0)), crown.clone().addScaledVector(direction, 2.55).add(new THREE.Vector3(0, -0.58, 0)), crown.clone().addScaledVector(direction, 3.2).add(new THREE.Vector3(0, -1.05, 0))];
    const curve = new THREE.CatmullRomCurve3(points);
    const rib = new THREE.Mesh(new THREE.TubeGeometry(curve, 14, 0.055, 5, false), solid(0x9eb877)); group.add(rib);
    for (let leaf = 1; leaf <= 8; leaf++) {
      const t = leaf / 9;
      const base = curve.getPoint(t);
      for (const side of [-1, 1]) {
        const end = base.clone().addScaledVector(new THREE.Vector3(-direction.z, 0, direction.x), side * (0.42 + Math.sin(t * Math.PI) * 0.34)).add(new THREE.Vector3(0, -0.36 - t * 0.34, 0));
        const mid = base.clone().lerp(end, 0.55).add(new THREE.Vector3(0, -0.13, 0));
        const leafCurve = new THREE.CatmullRomCurve3([base, mid, end]);
        const blade = new THREE.Mesh(new THREE.TubeGeometry(leafCurve, 5, 0.045, 4, false), solid(frond % 2 ? 0x47785d : 0x588764)); group.add(blade);
      }
    }
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
