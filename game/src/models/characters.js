import * as THREE from '../../vendor/three.module.min.js';

const fabric = (color, roughness = 0.8) => new THREE.MeshStandardMaterial({ color, roughness });
function capsule(group, material, position, radius, length) { const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, length, 5, 9), material); mesh.position.set(...position); group.add(mesh); return mesh; }

/** Articulated low-poly street characters and tactical rifle silhouettes. */
export function createCharacter(role = 'protagonist', seed = 1) {
  const pedestrianColors=[0x416b71,0xb45e4a,0x667d50,0xb29358,0x4f5684,0xd16e75,0xddd0b5,0x525d64];
  const palette = role === 'officer' ? 0x344b60 : role === 'syndicate' ? 0x242932 : role === 'pedestrian' ? pedestrianColors[Math.abs(seed*7+3)%pedestrianColors.length|0] : 0x294c50;
  const skin = fabric(0xb77f62); const jacket = fabric(palette); const pants = fabric(role === 'syndicate' ? 0x14191f : 0x202a34); const boot = fabric(0x101316);
  const group = new THREE.Group(); group.userData = { role, phase: seed * 0.6, limbs: [] };
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=64;const sctx=shadowCanvas.getContext('2d');const sg=sctx.createRadialGradient(32,32,3,32,32,31);sg.addColorStop(0,'rgba(9,12,15,.58)');sg.addColorStop(1,'rgba(9,12,15,0)');sctx.fillStyle=sg;sctx.fillRect(0,0,64,64);
  const shadow=new THREE.Mesh(new THREE.PlaneGeometry(1.25,.8),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,opacity:.62,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.045;group.add(shadow);
  capsule(group, pants, [0, 0.5, 0], 0.2, 0.4); capsule(group, jacket, [0, 1.16, 0], 0.34, 0.38);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 11), skin); head.position.set(0.06, 1.72, 0); group.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.235, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), fabric(role === 'officer' ? 0x19222b : 0x17191e)); hair.position.set(0.05, 1.8, 0); group.add(hair);
  if (role === 'officer') { const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.12, 12), fabric(0x152130)); cap.position.y = 1.96; group.add(cap); }
  if (role === 'syndicate' || role === 'officer' || role === 'protagonist') {
    const vestColor = role === 'officer' ? 0x283f51 : role === 'protagonist' ? 0x762a35 : 0x171c22;
    const vest = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.42), fabric(vestColor, 0.62)); vest.position.set(0, 1.18, 0); group.add(vest);
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.3, 0.035), fabric(role === 'officer' ? 0x496171 : 0x30383c, 0.72)); plate.position.set(0.03, 1.25, 0.224); group.add(plate);
    for (const x of [-0.19, 0.19]) {
      const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.19, 10, 8), fabric(role === 'officer' ? 0x38536a : role === 'protagonist' ? 0x55232e : 0x252d33, 0.72));
      shoulder.scale.set(role === 'protagonist' ? 1.34 : 1.18, 0.82, 1.12); shoulder.position.set(x, 1.39, 0); group.add(shoulder);
    }
    for (const x of [-0.18, 0.18]) { const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.17, 0.1), fabric(0x424139, 0.86)); pouch.position.set(x, 1.02, 0.23); group.add(pouch); }
    const radio = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.23, 0.09), fabric(0x12191d, 0.48)); radio.position.set(-0.23, 1.43, 0.11); group.add(radio);
  }
  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.38), fabric(0x121619)); belt.position.y = 0.91; group.add(belt);
  for (const x of [-0.14, 0.14]) { capsule(group, pants, [x, 0.26, 0], 0.11, 0.34); const foot = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.12, 0.32), boot); foot.position.set(x, 0.055, 0.08); group.add(foot); }
  const glasses = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.07, 0.09), fabric(0x101519)); glasses.position.set(0.17, 1.74, 0); group.add(glasses);
  for (const x of [-0.38, 0.38]) {
    const arm = capsule(group, jacket, [x, 1.19, -0.04], 0.13, 0.42);
    arm.rotation.z = role === 'protagonist' || role === 'syndicate' ? (x > 0 ? -1.02 : 0.72) : (x > 0 ? -0.36 : 0.36);
    if (role === 'protagonist' || role === 'syndicate') arm.position.x += x > 0 ? 0.1 : 0.12;
    group.userData.limbs.push(arm);
  }
  if (role === 'protagonist' || role === 'syndicate') {
    // Rifle has stock, receiver, barrel, foregrip and optic; hands sit on the weapon.
    const rifle = new THREE.Group(); const dark = fabric(0x252b2e, 0.35); const metal = fabric(0x657076, 0.32);
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.13, 0.15), dark); rifle.add(receiver);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.65, 8), metal); barrel.rotation.z = Math.PI / 2; barrel.position.x = 0.58; rifle.add(barrel);
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.11, 0.12), dark); stock.position.x = -0.44; rifle.add(stock);
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.25, 0.12), dark); grip.position.set(-0.1, -0.16, 0); grip.rotation.z = -0.18; rifle.add(grip);
    const optic = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.11), metal); optic.position.set(0.03, 0.12, 0); rifle.add(optic);
    rifle.position.set(0.34, 1.04, 0.04); group.add(rifle); group.userData.weapon = rifle;
    for (const x of [0.18, 0.62]) { const glove = new THREE.Mesh(new THREE.SphereGeometry(0.105, 8, 7), fabric(0x27282a)); glove.position.set(x, 0.99, 0.05); group.add(glove); }
  }
  return group;
}

export function animateCharacter(character, time, moving = true) {
  for (let i = 0; i < character.userData.limbs.length; i++) character.userData.limbs[i].rotation.x = moving ? Math.sin(time * 8 + i * Math.PI) * 0.42 : 0;
}
