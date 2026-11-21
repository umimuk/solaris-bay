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
];

const standard = (color, options = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.42, ...options });
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

/** Build a low, layered road car with a raked greenhouse and four steerable wheels. */
export function createVehicle(type = 0, paint = null) {
  const spec = typeof type === 'number' ? VEHICLE_TYPES[type % VEHICLE_TYPES.length] : type;
  const root = new THREE.Group();
  const isLarge = ['suv', 'swat'].includes(spec.kind);
  const length = isLarge ? 4.8 : 4.35;
  const width = isLarge ? 2.02 : 1.94;
  const body = standard(paint ?? spec.color, { roughness: 0.24, metalness: 0.66 });
  const materials = {
    body, dark: standard(0x101820), glass: new THREE.MeshPhysicalMaterial({ color: 0x142b3a, roughness: 0.12, metalness: 0.55, transparent: true, opacity: 0.91 }),
    chrome: standard(0xc0c8c5, { roughness: 0.2, metalness: 0.92 }), rim: standard(0x6e7b83, { roughness: 0.24, metalness: 0.94 }), tire: standard(0x101216, { roughness: 0.9 }),
  };
  const headMaterial = standard(0xffeac4, { emissive: 0xffc46b, emissiveIntensity: 2.6 });
  const tailMaterial = standard(0xff2436, { emissive: 0xf0142a, emissiveIntensity: 3.0 });
  root.userData = { spec, speed: 0, steer: 0, health: 100, wheels: [], lights: [], rearLights: [], policeLights: [], policePoints: [], smoke: [] };
  root.userData.paintMaterial = body;

  // Broad lower chassis, splitter, diffuser and side skirts establish the stance.
  box(root, body, [0, 0.62, 0], [length, 0.47, width]);
  const shellProfile = new THREE.Shape();
  shellProfile.moveTo(-2.19, 0.43); shellProfile.lineTo(2.12, 0.43); shellProfile.lineTo(2.03, 0.69);
  shellProfile.lineTo(1.44, 0.85); shellProfile.lineTo(0.96, 0.94); shellProfile.lineTo(-1.32, 0.94);
  shellProfile.lineTo(-1.88, 0.83); shellProfile.lineTo(-2.13, 0.68); shellProfile.closePath();
  const shell = new THREE.Mesh(new THREE.ExtrudeGeometry(shellProfile, { depth: width * 0.92, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.055, bevelThickness: 0.045 }), body);
  shell.position.z = -width * 0.46; root.add(shell);
  box(root, materials.dark, [2.17, 0.42, 0], [0.24, 0.16, width * 1.04]);
  box(root, materials.dark, [-2.17, 0.45, 0], [0.25, 0.2, width * 1.02]);
  box(root, materials.chrome, [-2.3, 0.5, -0.39], [0.12, 0.1, 0.2]);
  box(root, materials.chrome, [-2.3, 0.5, 0.39], [0.12, 0.1, 0.2]);
  for (const side of [-1, 1]) box(root, materials.dark, [0, 0.43, side * (width * 0.51)], [2.75, 0.16, 0.13]);

  // Sloped hood and separate cabin planes: no cone primitive is used in the car.
  const hood = box(root, body, [1.05, 0.89, 0], [1.78, 0.2, width * 0.93]);
  hood.rotation.z = -0.055;
  box(root, body, [-1.63, 0.84, 0], [0.92, 0.28, width * 0.95]);
  const roof = box(root, body, [-0.34, 1.52, 0], [1.45, 0.12, width * 0.63]);
  roof.rotation.z = -0.04;
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
  }
  const tailBar = box(root, tailMaterial, [-2.19, 0.83, 0], [0.075, 0.19, width * 0.79]);
  root.userData.rearLights.push(tailBar);

  // Four wheel wells and independently steered front hubs.
  for (const x of [-1.34, 1.34]) {
    for (const side of [-1, 1]) {
      const z = side * (width * 0.53);
      const arch = new THREE.Mesh(new THREE.TorusGeometry(0.47, 0.09, 8, 24, Math.PI), body);
      arch.rotation.set(Math.PI / 2, 0, Math.PI);
      arch.position.set(x, 0.45, z);
      root.add(arch);
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
    box(root, materials.dark, [2.3, 0.57, 0], [0.27, 0.35, width * 1.12]);
    for (const side of [-1, 1]) box(root, materials.chrome, [2.34, 0.56, side * 0.78], [0.08, 0.46, 0.08]);
    const barBase = box(root, materials.dark, [-0.1, 1.64, 0], [0.93, 0.14, 0.38]);
    barBase.userData.lightbar = true;
    for (const side of [-1, 1]) {
      const red = side < 0;
      const lamp = box(root, standard(red ? 0xff263c : 0x287dff, { emissive: red ? 0xff102b : 0x145dff, emissiveIntensity: 4.5 }), [-0.1, 1.77, side * 0.12], [0.4, 0.13, 0.18]);
      root.userData.policeLights.push(lamp);
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
  const fuselage = standard(0x17232c, { metalness: 0.55, roughness: 0.36 });
  const metal = standard(0x9ba8a7, { metalness: 0.78 });
  box(group, fuselage, [0, 0, 0], [3.6, 1.18, 1.42]);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.78, 18, 12), standard(0x183f52, { metalness: 0.5, roughness: 0.12 }));
  nose.scale.set(1.05, 0.7, 0.9); nose.position.x = 1.55; group.add(nose);
  box(group, fuselage, [-2.65, 0.22, 0], [3.5, 0.32, 0.38]);
  box(group, fuselage, [-4.25, 0.3, 0], [0.7, 0.72, 0.42]);
  const mainRotor = new THREE.Group();
  for (let i = 0; i < 4; i++) { const blade = box(mainRotor, metal, [0, 0, 0], [0.2, 0.055, 8]); blade.rotation.y = i * Math.PI / 2; }
  mainRotor.position.y = 0.82; group.add(mainRotor);
  const tailRotor = new THREE.Group();
  for (let i = 0; i < 4; i++) { const blade = box(tailRotor, metal, [0, 0, 0], [0.1, 1.9, 0.07]); blade.rotation.z = i * Math.PI / 2; }
  tailRotor.position.set(-4.22, 0.38, 0.28); group.add(tailRotor);
  const beacon = new THREE.PointLight(0xff273b, 9, 18); beacon.position.set(-0.7, 0.8, 0); group.add(beacon);
  const green = new THREE.PointLight(0x35ff8a, 8, 15); green.position.set(0.2, 0.2, 0.8); group.add(green);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(4.5, 26, 28, 1, true), new THREE.MeshBasicMaterial({ color: 0xf7fbff, transparent: true, opacity: 0.24, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  cone.position.set(0.7, -13, 0); cone.rotation.z = Math.PI; group.add(cone);
  const groundPool = new THREE.Mesh(new THREE.CircleGeometry(5.3, 32), new THREE.MeshBasicMaterial({ color: 0xffefc2, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false }));
  groundPool.rotation.x = -Math.PI / 2; groundPool.position.set(0.7, -26, 0); group.add(groundPool);
  const search = new THREE.SpotLight(0xfff3d4, 95, 150, Math.PI / 9, 0.5, 1.1);
  const target = new THREE.Object3D(); search.position.set(0.6, -0.5, 0); target.position.set(0.7, -28, 0); group.add(search, target); search.target = target;
  group.userData = { mainRotor, tailRotor, cone, groundPool, search, target };
  return group;
}
