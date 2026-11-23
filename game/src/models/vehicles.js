import * as THREE from '../../vendor/three.module.min.js';

/** Vehicle catalog used by traffic, the player and the SBPD fleet. */
export const VEHICLE_TYPES = [
  { name: 'SOLARIS GT', color: 0xd84b35, kind: 'sports' },
  { name: 'V8 TORCH', color: 0x29323b, kind: 'muscle' },
  { name: 'APEX R', color: 0xd7d5cf, kind: 'super' },
  { name: 'COASTAL X', color: 0x596b62, kind: 'suv' },
  { name: 'CITY SEDAN', color: 0x647583, kind: 'sedan' },
  { name: 'SBPD INTERCEPTOR', color: 0xd8d9d4, kind: 'police', police: true },
  { name: 'SBPD RESPONSE', color: 0x222d37, kind: 'swat', police: true },
  { name: 'STREET MOTO', color: 0x2e8586, kind: 'motorcycle' },
];

const standard = (color, options = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.42, ...options });
const carPaint = (color) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.22, metalness: 0.52, clearcoat: 0.9, clearcoatRoughness: 0.12 });
const glowMaps = new Map();
let contactMap;
function addContactShadow(root, width = 4.8, depth = 2.5) {
  if (!contactMap) {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
    const ctx = canvas.getContext('2d'); const g = ctx.createRadialGradient(64,64,8,64,64,63);
    g.addColorStop(0,'rgba(10,13,17,.72)'); g.addColorStop(.42,'rgba(10,13,17,.38)'); g.addColorStop(1,'rgba(10,13,17,0)');
    ctx.fillStyle=g;ctx.fillRect(0,0,128,128); contactMap=new THREE.CanvasTexture(canvas);
  }
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), new THREE.MeshBasicMaterial({ map:contactMap, transparent:true, opacity:.72, depthWrite:false, toneMapped:false }));
  shadow.rotation.x=-Math.PI/2; shadow.position.y=.03; shadow.renderOrder=1; root.add(shadow); return shadow;
}
function glowMap(color) {
  if (glowMaps.has(color)) return glowMaps.get(color);
  const canvas = document.createElement('canvas'); canvas.width = 96; canvas.height = 96;
  const ctx = canvas.getContext('2d'); const gradient = ctx.createRadialGradient(48,48,2,48,48,47);
  gradient.addColorStop(0, '#ffffff'); gradient.addColorStop(.14, `#${color.toString(16).padStart(6,'0')}`); gradient.addColorStop(.48, `rgba(${(color>>16)&255},${(color>>8)&255},${color&255},.32)`); gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle=gradient;ctx.fillRect(0,0,96,96);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;glowMaps.set(color,texture);return texture;
}
export function createGlowSprite(color, opacity = 0.62) {
  return new THREE.Sprite(new THREE.SpriteMaterial({ map: glowMap(color), color: 0xffffff, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
}
const box = (parent, material, position, size) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  parent.add(mesh);
  return mesh;
};

function makeWheel(parent, x, z, materials, front) {
  const pivot = new THREE.Group();
  pivot.position.set(x, 0.43, z);
  parent.add(pivot);
  const wheel = new THREE.Group();
  const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.28, 24), materials.tire);
  tire.rotation.x = Math.PI / 2;
  wheel.add(tire);
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.292, 16), materials.rim);
  rim.rotation.x = Math.PI / 2;
  wheel.add(rim);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.31, 12), materials.chrome);
  hub.rotation.x = Math.PI / 2;
  wheel.add(hub);
  for (let spoke = 0; spoke < 5; spoke++) {
    const angle = spoke * Math.PI * 2 / 5;
    const bar = box(wheel, materials.chrome, [Math.cos(angle) * 0.12, Math.sin(angle) * 0.12, 0], [0.045, 0.25, 0.035]);
    bar.rotation.z = angle;
  }
  pivot.add(wheel);
  return { pivot, wheel, front };
}

function createMotorcycle(spec, paint = null) {
  const root = new THREE.Group(); const body = standard(paint ?? spec.color, { roughness: 0.28, metalness: 0.58 });
  const dark = standard(0x172129, { roughness: 0.62, metalness: 0.2 }); const metal = standard(0xb4c2c0, { roughness: 0.24, metalness: 0.85 });
  root.userData = { spec, speed: 0, steer: 0, health: 100, wheels: [], lights: [], rearLights: [], policeLights: [], policePoints: [], smoke: [] };
  root.userData.paintMaterial = body;
  addContactShadow(root, 3.6, 1.5);
  box(root, dark, [-0.05, 0.66, 0], [1.8, 0.18, 0.28]);
  box(root, body, [0.05, 0.96, 0], [0.86, 0.38, 0.58]);
  box(root, dark, [-0.52, 1.11, 0], [0.88, 0.16, 0.45]);
  box(root, body, [0.77, 1.04, 0], [0.5, 0.22, 0.4]);
  for (const side of [-1, 1]) {
    const fork = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.075, 0.92, 8), metal); fork.position.set(1.02, 0.79, side * 0.13); fork.rotation.z = -0.28; root.add(fork);
    const rear = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.065, 0.92, 8), metal); rear.position.set(-0.72, 0.69, side * 0.13); rear.rotation.z = 0.68; root.add(rear);
  }
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.72, 8), metal); bar.rotation.x = Math.PI / 2; bar.position.set(0.88, 1.42, 0); root.add(bar);
  for (const side of [-1, 1]) { const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.24, 8), dark); grip.rotation.x = Math.PI / 2; grip.position.set(0.88, 1.42, side * 0.43); root.add(grip); }
  const wheelMats = { tire: standard(0x101316, { roughness: 0.95 }), rim: standard(0x81908f, { metalness: 0.88, roughness: 0.25 }), chrome: metal };
  root.userData.wheels.push(makeWheel(root, 1.22, 0, wheelMats, true), makeWheel(root, -1.12, 0, wheelMats, false));
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 8), standard(0xffefcc, { emissive: 0xffd080, emissiveIntensity: 2.4 })); lamp.position.set(1.34, 1.13, 0); root.add(lamp);
  const halo = createGlowSprite(0xffd88d, 0.48); halo.position.set(1.52, 1.13, 0); halo.scale.set(1.65, 1.25, 1); root.add(halo);
  const tail = box(root, standard(0xff3445, { emissive: 0xff1428, emissiveIntensity: 2.6 }), [-1.03, 1.01, 0], [0.08, 0.12, 0.36]); root.userData.rearLights.push(tail);
  return root;
}

/** Build a low, layered road car with a raked greenhouse and four steerable wheels. */
export function createVehicle(type = 0, paint = null) {
  const spec = typeof type === 'number' ? VEHICLE_TYPES[type % VEHICLE_TYPES.length] : type;
  if (spec.kind === 'motorcycle') return createMotorcycle(spec, paint);
  const root = new THREE.Group();
  const isLarge = ['suv', 'swat'].includes(spec.kind);
  const length = isLarge ? 4.8 : 4.35;
  const width = isLarge ? 2.02 : 1.94;
  const body = carPaint(paint ?? spec.color);
  const materials = {
    body, dark: standard(0x101820), glass: new THREE.MeshPhysicalMaterial({ color: 0x142b3a, roughness: 0.12, metalness: 0.55, transparent: true, opacity: 0.91 }),
    chrome: standard(0xc0c8c5, { roughness: 0.2, metalness: 0.92 }), rim: standard(0x6e7b83, { roughness: 0.24, metalness: 0.94 }), tire: standard(0x101216, { roughness: 0.9 }),
  };
  if (spec.police) { materials.glass.color.setHex(0x07131d); materials.glass.opacity = 0.97; materials.glass.roughness = 0.2; }
  const plateCanvas=document.createElement('canvas'); plateCanvas.width=256; plateCanvas.height=80; const pc=plateCanvas.getContext('2d');
  pc.fillStyle='#e9e3ca';pc.fillRect(0,0,256,80);pc.strokeStyle='#22333b';pc.lineWidth=8;pc.strokeRect(4,4,248,72);pc.fillStyle='#172833';pc.font='bold 42px Chakra, Arial';pc.textAlign='center';pc.textBaseline='middle';pc.fillText(spec.police?'SB-714':'SOLARIS',128,40);
  const plateMat=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(plateCanvas),toneMapped:false});
  const headMaterial = standard(0xffeac4, { emissive: 0xffc46b, emissiveIntensity: 2.6 });
  const tailMaterial = standard(0xff2436, { emissive: 0xf0142a, emissiveIntensity: 3.0 });
  root.userData = { spec, speed: 0, steer: 0, health: 100, wheels: [], lights: [], rearLights: [], policeLights: [], policePoints: [], smoke: [] };
  root.userData.paintMaterial = body;
  addContactShadow(root, length + 1.4, width + 1.25);

  // Broad lower chassis, splitter, diffuser and side skirts establish the stance.
  box(root, body, [0, 0.48, 0], [length * 0.82, 0.18, width * 0.82]);
  const shellProfile = new THREE.Shape();
  const profile = spec.kind === 'suv' || spec.kind === 'swat' || spec.kind === 'van'
    ? [[-2.4,.43],[2.4,.43],[2.28,.92],[1.8,1.12],[1.58,1.92],[.95,2.08],[-1.5,2.04],[-2.05,1.5],[-2.34,.93]]
    : spec.kind === 'sedan' || spec.kind === 'police'
      ? [[-2.22,.43],[2.18,.43],[2.08,.76],[1.43,.98],[.92,1.36],[.42,1.43],[-1.18,1.38],[-1.75,.98],[-2.14,.77]]
      : spec.kind === 'muscle'
        ? [[-2.22,.43],[2.18,.43],[2.08,.79],[1.48,1.02],[.92,1.25],[-1.17,1.25],[-1.72,1.04],[-2.15,.75]]
        : [[-2.19,.43],[2.12,.43],[2.03,.69],[1.44,.85],[.96,.94],[-1.32,.94],[-1.88,.83],[-2.13,.68]];
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  shellProfile.moveTo(...mid(profile[0], profile[1]));
  for (let i = 1; i < profile.length; i++) shellProfile.quadraticCurveTo(...profile[i], ...mid(profile[i], profile[(i + 1) % profile.length]));
  shellProfile.quadraticCurveTo(...profile[0], ...mid(profile[0], profile[1])); shellProfile.closePath();
  const shell = new THREE.Mesh(new THREE.ExtrudeGeometry(shellProfile, { depth: width * 0.92, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.085, bevelSegments: 4, curveSegments: 10, steps: 1 }), body);
  shell.position.z = -width * 0.46; root.add(shell);
  box(root, materials.dark, [2.17, 0.42, 0], [0.24, 0.16, width * 1.04]);
  box(root, materials.dark, [-2.17, 0.45, 0], [0.25, 0.2, width * 1.02]);
  box(root, materials.chrome, [-2.3, 0.5, -0.39], [0.12, 0.1, 0.2]);
  box(root, materials.chrome, [-2.3, 0.5, 0.39], [0.12, 0.1, 0.2]);
  for (const side of [-1, 1]) box(root, materials.dark, [0, 0.43, side * (width * 0.51)], [2.75, 0.16, 0.13]);

  // Sloped hood and separate cabin planes: no cone primitive is used in the car.
  const hoodShape = new THREE.Shape(); hoodShape.moveTo(0.12, 0.83); hoodShape.quadraticCurveTo(0.36, 0.93, 0.72, 0.96); hoodShape.lineTo(1.92, 0.82); hoodShape.quadraticCurveTo(2.03, 0.79, 2.08, 0.68); hoodShape.lineTo(1.98, 0.62); hoodShape.lineTo(0.13, 0.68); hoodShape.closePath();
  const hood = new THREE.Mesh(new THREE.ExtrudeGeometry(hoodShape, { depth: width * 0.91, bevelEnabled: true, bevelThickness: 0.055, bevelSize: 0.045, bevelSegments: 3, curveSegments: 8 }), body);
  hood.position.z = -width * 0.455; root.add(hood);
  box(root, body, [-1.63, 0.84, 0], [0.92, 0.28, width * 0.95]);
  const cabinShape = new THREE.Shape(); cabinShape.moveTo(-1.28, 0.93); cabinShape.quadraticCurveTo(-1.1, 1.04, -0.91, 1.24); cabinShape.quadraticCurveTo(-0.76, 1.43, -0.53, 1.45); cabinShape.lineTo(0.14, 1.45); cabinShape.quadraticCurveTo(0.47, 1.4, 0.68, 1.08); cabinShape.quadraticCurveTo(0.78, 0.99, 0.91, 0.94); cabinShape.closePath();
  const roof = new THREE.Mesh(new THREE.ExtrudeGeometry(cabinShape, { depth: width * 0.72, bevelEnabled: true, bevelThickness: 0.065, bevelSize: 0.05, bevelSegments: 4, curveSegments: 8 }), body);
  roof.position.z = -width * 0.36; root.add(roof);
  const windshield = box(root, materials.glass, [0.52, 1.25, 0], [0.09, 0.67, width * 0.69]);
  windshield.rotation.z = -0.46;
  const rearGlass = box(root, materials.glass, [-1.08, 1.25, 0], [0.09, 0.58, width * 0.67]);
  rearGlass.rotation.z = 0.48;
  for (const side of [-1, 1]) {
    const window = box(root, materials.glass, [-0.28, 1.27, side * width * 0.365], [1.12, 0.47, 0.055]);
    window.rotation.z = -0.04;
    box(root, materials.dark, [0.2, 1.06, side * width * 0.51], [0.78, 0.08, 0.08]);
    const mirror = box(root, body, [0.5, 1.07, side * width * 0.61], [0.22, 0.13, 0.18]);
    mirror.rotation.z = -0.12;
  }

  // Wide LEDs and a single continuous crimson rear light bar.
  box(root, materials.dark, [2.12, 0.69, 0], [0.13, 0.27, width * 0.92]);
  for (const side of [-1, 1]) {
    const lamp = box(root, headMaterial, [2.2, 0.83, side * 0.61], [0.075, 0.16, 0.58]);
    root.userData.lights.push(lamp);
    const halo = createGlowSprite(0xffd88d, 0.4); halo.position.set(2.34, 0.84, side * 0.61); halo.scale.set(1.8, 1.1, 1); root.add(halo);
  }
  const tailBar = box(root, tailMaterial, [-2.19, 0.83, 0], [0.075, 0.19, width * 0.79]);
  root.userData.rearLights.push(tailBar);
  const tailTrim = box(root, standard(0xc3c8c6, { metalness: 0.88, roughness: 0.2, emissive: 0x352021, emissiveIntensity: 0.32 }), [-2.235, 0.955, 0], [0.035, 0.035, width * 0.83]);
  tailTrim.userData.lightTrim = true;
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(.86,.27),plateMat); plate.rotation.y=-Math.PI/2;plate.position.set(-2.28,.55,0);root.add(plate);
  for(const side of [-1,1]) {
    const exhaust=new THREE.Mesh(new THREE.CylinderGeometry(.095,.12,.2,16),materials.chrome);exhaust.rotation.z=Math.PI/2;exhaust.position.set(-2.32,.43,side*.48);root.add(exhaust);
    const core=new THREE.Mesh(new THREE.CylinderGeometry(.052,.068,.08,12),standard(0xff7448,{emissive:0xff3b20,emissiveIntensity:1.25,metalness:.48,roughness:.24}));core.rotation.z=Math.PI/2;core.position.set(-2.43,.43,side*.48);root.add(core);
  }
  const tailHalo = createGlowSprite(0xff243f, 0.36); tailHalo.position.set(-2.28, 0.85, 0); tailHalo.scale.set(1.7, 0.9, 1); root.add(tailHalo);

  // Flush body-colored fender lips follow the wheel silhouette; no raised arch pipes.
  for (const x of [-1.34, 1.34]) {
    for (const side of [-1, 1]) {
      const z = side * (width * 0.53);
      const flare = new THREE.Mesh(new THREE.CylinderGeometry(.56,.56,.07,24,1,true,0,Math.PI), body);
      flare.rotation.x=Math.PI/2; flare.position.set(x,.64,z*.94); root.add(flare);
      root.userData.wheels.push(makeWheel(root, x, z, materials, x > 0));
    }
  }

  if (spec.kind === 'sports' || spec.kind === 'super') {
    for (const side of [-1, 1]) {
      const riser = box(root, materials.dark, [-1.69, 1.05, side * 0.61], [0.12, 0.45, 0.1]);
      riser.rotation.z = -0.08;
    }
    box(root, body, [-1.7, 1.29, 0], [0.19, 0.09, 1.58]);
  }
  if (spec.kind === 'muscle') {
    box(root, body, [1.12, 1.02, 0], [1.18, 0.13, 0.8]);
    box(root, body, [-1.63, 1.12, 0], [0.18, 0.27, 1.35]);
  }

  if (spec.police) {
    // Black-white SBPD paint blocks and unmistakable push bar.
    box(root, materials.dark, [0, 0.77, 0], [2.05, 0.25, width * 0.99]);
    box(root, standard(0xf3f1e8), [0, 0.88, 0], [0.8, 0.22, width * 0.98]);
    const livery = document.createElement('canvas'); livery.width = 768; livery.height = 224;
    const liveryContext = livery.getContext('2d');
    liveryContext.fillStyle = '#eeeae0'; liveryContext.fillRect(0, 0, livery.width, livery.height);
    liveryContext.fillStyle = '#172431'; liveryContext.fillRect(0, 0, livery.width, 36); liveryContext.fillRect(0, 188, livery.width, 36);
    liveryContext.fillStyle = '#c7a65d'; liveryContext.fillRect(0, 36, livery.width, 8); liveryContext.fillRect(0, 180, livery.width, 8);
    liveryContext.fillStyle = '#14212d'; liveryContext.font = '900 98px Arial, sans-serif'; liveryContext.textAlign = 'center'; liveryContext.textBaseline = 'middle';
    liveryContext.fillText('SBPD', 384, 101);
    liveryContext.font = '700 34px Arial, sans-serif'; liveryContext.fillText('POLICE  •  EMERGENCY 911', 384, 163);
    const liveryMap = new THREE.CanvasTexture(livery); liveryMap.colorSpace = THREE.SRGBColorSpace;
    const liveryMaterial = new THREE.MeshBasicMaterial({ map: liveryMap, toneMapped: false, side: THREE.DoubleSide });
    for (const side of [-1, 1]) {
      const graphic = new THREE.Mesh(new THREE.PlaneGeometry(1.42, 0.42), liveryMaterial);
      graphic.position.set(-0.18, 0.93, side * (width * 0.512)); graphic.rotation.y = side < 0 ? Math.PI : 0; root.add(graphic);
      const quarterPanel = box(root, materials.dark, [-1.46, 0.82, side * (width * 0.505)], [0.47, 0.18, 0.04]);
      quarterPanel.rotation.y = side < 0 ? Math.PI : 0;
    }
    box(root, materials.dark, [2.3, 0.57, 0], [0.27, 0.35, width * 1.12]);
    for (const side of [-1, 1]) {
      box(root, standard(0x101820, { metalness: 0.28, roughness: 0.46 }), [-0.28, 0.66, side * (width * 0.532)], [2.55, 0.1, 0.08]);
      box(root, standard(0x101820, { metalness: 0.18, roughness: 0.24 }), [0.48, 1.28, side * (width * 0.378)], [0.12, 0.45, 0.08]);
    }
    const rearLightWhite = standard(0xfff2d6, { emissive: 0xffffff, emissiveIntensity: 1.25 });
    const rearLightAmber = standard(0xffa52e, { emissive: 0xff741f, emissiveIntensity: 2.1 });
    for (const [z, material, span] of [[-0.62, tailMaterial, 0.35], [0, rearLightWhite, 0.38], [0.62, rearLightAmber, 0.35]]) box(root, material, [-2.215, 0.84, z], [0.08, 0.16, span]);
    for (let slat = 0; slat < 6; slat++) box(root, materials.chrome, [2.215, 0.68, -0.43 + slat * 0.17], [0.035, 0.035, 0.09]);
    for (const side of [-1, 1]) box(root, materials.chrome, [2.34, 0.56, side * 0.78], [0.08, 0.46, 0.08]);
    const barBase = box(root, materials.dark, [-0.1, 1.64, 0], [0.93, 0.14, 0.38]);
    barBase.userData.lightbar = true;
    for (const side of [-1, 1]) {
      const red = side < 0;
      const lamp = box(root, standard(red ? 0xff263c : 0x287dff, { emissive: red ? 0xff102b : 0x145dff, emissiveIntensity: 4.5 }), [-0.1, 1.77, side * 0.12], [0.4, 0.13, 0.18]);
      root.userData.policeLights.push(lamp);
      const halo = createGlowSprite(red ? 0xff1735 : 0x176aff, 0.68); halo.position.set(-0.1, 1.9, side * 0.24); halo.scale.set(2.2, 1.7, 1); root.add(halo);
      const point = new THREE.PointLight(red ? 0xff1735 : 0x176aff, 0, 16, 2);
      point.position.set(-0.1, 1.85, side * 0.3);
      root.add(point);
      root.userData.policePoints.push(point);
    }
  }
  return root;
}

export function updateVehicle(vehicle, dt, speed, steer, braking) {
  vehicle.userData.speed = speed;
  for (const item of vehicle.userData.wheels) {
    item.wheel.rotation.x -= speed * dt / 0.4;
    if (item.front) item.pivot.rotation.y = steer * 0.62;
  }
  for (const light of vehicle.userData.rearLights) light.material.emissiveIntensity = braking ? 3.8 : 3.0;
  const phase = Math.sin(performance.now() * 0.018);
  vehicle.userData.policeLights.forEach((light, index) => { light.material.emissiveIntensity = phase * (index % 2 ? 1.7 : 0.6) + 3.1; });
  vehicle.userData.policePoints.forEach((light, index) => { light.intensity = vehicle.visible ? Math.max(0, phase * (index ? -1 : 1)) * 28 : 0; });
}

/** Tactical helicopter with rotors, nav lamps, volumetric search beam and ground pool. */
export function createHelicopter() {
  const group = new THREE.Group();
  const fuselage = carPaint(0xf0eee5); const navy = carPaint(0x132b3c);
  const metal = standard(0x9ba8a7, { metalness: 0.78 });
  const hull = new THREE.Mesh(new THREE.SphereGeometry(1,32,20),fuselage); hull.scale.set(2.0,.68,.78); group.add(hull);
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(1,24,16),new THREE.MeshPhysicalMaterial({color:0x17445a,roughness:.1,metalness:.46,clearcoat:1,transparent:true,opacity:.9})); canopy.scale.set(.92,.57,.72); canopy.position.set(1.2,.18,0); group.add(canopy);
  const tailCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(-1.3,.05,0),new THREE.Vector3(-2.4,.2,0),new THREE.Vector3(-3.5,.42,0),new THREE.Vector3(-4.4,.5,0)]);
  group.add(new THREE.Mesh(new THREE.TubeGeometry(tailCurve,24,.16,10,false),navy));
  const fin = new THREE.Mesh(new THREE.BoxGeometry(.72,.12,.76),navy); fin.position.set(-4.1,.83,0); fin.rotation.z=-.5; group.add(fin);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.7,.15,1.54),navy); stripe.position.set(-.15,-.12,0); group.add(stripe);
  const mainRotor = new THREE.Group();
  for (let i = 0; i < 4; i++) { const blade = box(mainRotor, metal, [0, 0, 0], [0.24, 0.045, 8]); blade.rotation.y = i * Math.PI / 2; }
  mainRotor.position.y = 1.02; group.add(mainRotor);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(7.3,48),new THREE.MeshBasicMaterial({color:0xe9f5f7,transparent:true,opacity:.075,depthWrite:false,side:THREE.DoubleSide})); disc.rotation.x=-Math.PI/2;disc.position.y=.99;group.add(disc);
  const tailRotor = new THREE.Group();
  for (let i = 0; i < 4; i++) { const blade = box(tailRotor, metal, [0, 0, 0], [0.1, 1.9, 0.07]); blade.rotation.z = i * Math.PI / 2; }
  tailRotor.position.set(-4.22, 0.38, 0.28); group.add(tailRotor);
  const beacon = new THREE.PointLight(0xff273b, 9, 18); beacon.position.set(-0.7, 0.8, 0); group.add(beacon);
  const green = new THREE.PointLight(0x35ff8a, 8, 15); green.position.set(0.2, 0.2, 0.8); group.add(green);
  const whiteStrobe = new THREE.PointLight(0xf2f8ff, 0, 22); whiteStrobe.position.set(1.15, 0.9, 0); group.add(whiteStrobe);
  const redLamp = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), standard(0xff2439, { emissive: 0xff1028, emissiveIntensity: 4.5 })); redLamp.position.copy(beacon.position); group.add(redLamp);
  const whiteLamp = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), standard(0xf5fbff, { emissive: 0xe6f5ff, emissiveIntensity: 0.2 })); whiteLamp.position.copy(whiteStrobe.position); group.add(whiteLamp);
  const callsign = new THREE.Group(); callsign.visible = false; group.add(callsign);
  const beamCanvas = document.createElement('canvas'); beamCanvas.width = 128; beamCanvas.height = 8;
  const beamContext = beamCanvas.getContext('2d'); const beamFade = beamContext.createLinearGradient(0,0,128,0); beamFade.addColorStop(0,'rgba(255,248,220,0)'); beamFade.addColorStop(.2,'rgba(255,248,220,.16)'); beamFade.addColorStop(.5,'rgba(255,248,220,.42)'); beamFade.addColorStop(.8,'rgba(255,248,220,.16)'); beamFade.addColorStop(1,'rgba(255,248,220,0)'); beamContext.fillStyle=beamFade;beamContext.fillRect(0,0,128,8);
  const beamTexture = new THREE.CanvasTexture(beamCanvas); beamTexture.colorSpace = THREE.SRGBColorSpace;
  const cone = new THREE.Mesh(new THREE.ConeGeometry(4.5, 26, 36, 1, true), new THREE.MeshBasicMaterial({ map: beamTexture, color: 0xfff4d8, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
  cone.position.set(0.7, -13, 0); cone.rotation.z = Math.PI; group.add(cone);
  const poolCanvas = document.createElement('canvas'); poolCanvas.width = 128; poolCanvas.height = 128; const poolContext = poolCanvas.getContext('2d');
  const poolGradient = poolContext.createRadialGradient(64,64,4,64,64,62); poolGradient.addColorStop(0,'rgba(255,247,219,.5)'); poolGradient.addColorStop(.35,'rgba(255,239,194,.25)'); poolGradient.addColorStop(1,'rgba(255,239,194,0)'); poolContext.fillStyle=poolGradient;poolContext.fillRect(0,0,128,128);
  const poolTexture = new THREE.CanvasTexture(poolCanvas); poolTexture.colorSpace = THREE.SRGBColorSpace;
  const groundPool = new THREE.Mesh(new THREE.CircleGeometry(5.3, 32), new THREE.MeshBasicMaterial({ map: poolTexture, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }));
  groundPool.rotation.x = -Math.PI / 2; groundPool.position.set(0.7, -26, 0); group.add(groundPool);
  const search = new THREE.SpotLight(0xfff3d4, 95, 150, Math.PI / 9, 0.5, 1.1);
  const target = new THREE.Object3D(); search.position.set(0.6, -0.5, 0); target.position.set(0.7, -28, 0); group.add(search, target); search.target = target;
  group.userData = { mainRotor, tailRotor, cone, groundPool, search, target, beacon, whiteStrobe, redLamp, whiteLamp, callsign, disc };
  return group;
}
