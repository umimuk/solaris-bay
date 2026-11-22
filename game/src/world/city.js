import * as THREE from '../../vendor/three.module.min.js';
import { createPalm, createSign, createCrate } from '../models/props.js';
import { createVehicle, createHelicopter } from '../models/vehicles.js';
import { createRandom } from '../random.js';
import { makeTextures } from './textures.js';

const material = (color, options = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...options });
function addBox(parent, size, mat, position) { const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), mat); mesh.position.set(...position); parent.add(mesh); return mesh; }

function addLandmass(parent, points, color) {
  const shape = new THREE.Shape(); shape.moveTo(points[0][0], points[0][1]);
  for (const [x, z] of points.slice(1)) shape.lineTo(x, z);
  shape.closePath();
  const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), material(color, { roughness: 0.95, side: THREE.DoubleSide }));
  mesh.rotation.x = Math.PI / 2; mesh.position.y = -0.05; parent.add(mesh); return mesh;
}

function addRoad(parent, points, width, roadMaterial, edgeMaterial, centerMaterial = null) {
  const curve = new THREE.CatmullRomCurve3(points.map(([x, z]) => new THREE.Vector3(x, 0.045, z)));
  const samples = curve.getPoints(100); const vertices = []; const uvs = []; const indices = [];
  for (let i = 0; i < samples.length; i++) {
    const tangent = curve.getTangent(i / (samples.length - 1)); const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    const left = samples[i].clone().addScaledVector(side, width / 2); const right = samples[i].clone().addScaledVector(side, -width / 2);
    vertices.push(left.x, left.y, left.z, right.x, right.y, right.z);
    uvs.push(i / (samples.length - 1) * 10, 0, i / (samples.length - 1) * 10, 1);
    if (i < samples.length - 1) { const a = i * 2; indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); geometry.setIndex(indices); geometry.computeVertexNormals();
  const road = new THREE.Mesh(geometry, roadMaterial); road.material.side = THREE.DoubleSide; parent.add(road);
  for (const sideSign of [-1, 1]) {
    const offset = width * 0.47;
    const edgePoints = samples.map((point, i) => { const tangent = curve.getTangent(i / (samples.length - 1)); return point.clone().add(new THREE.Vector3(-tangent.z, 0, tangent.x).normalize().multiplyScalar(offset * sideSign)); });
    parent.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(edgePoints), 100, 0.1, 5, false), edgeMaterial));
  }
  if (centerMaterial) {
    for (const offset of [-0.24, 0.24]) {
      const points = samples.map((point, i) => { const tangent = curve.getTangent(i / (samples.length - 1)); return point.clone().add(new THREE.Vector3(-tangent.z, 0, tangent.x).normalize().multiplyScalar(offset)); });
      parent.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 100, 0.055, 4, false), centerMaterial));
    }
    const lane = new THREE.MeshBasicMaterial({ color: 0xf6f3e9 });
    for (const sign of [-1, 1]) for (let i = 0; i < samples.length - 5; i += 12) {
      const marks = samples.slice(i, i + 5).map((point, j) => { const tangent = curve.getTangent((i + j) / (samples.length - 1)); return point.clone().add(new THREE.Vector3(-tangent.z, 0, tangent.x).normalize().multiplyScalar(sign * width * 0.18)); });
      parent.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(marks), 5, 0.055, 4, false), lane));
    }
  }
  return curve;
}

function addBuilding(parent, x, z, w, h, d, facade, accent, signText = '') {
  const building = new THREE.Group(); parent.add(building);
  const baseHeight = Math.min(5.2, h * 0.24);
  addBox(building, [w * 1.08, baseHeight, d * 1.08], material(0xe7d4b8, { roughness: 0.82 }), [x, baseHeight / 2, z]);
  addBox(building, [w, Math.max(4, h - baseHeight), d], facade, [x, (h + baseHeight) / 2, z]);
  addBox(building, [w + 0.65, 0.28, d + 0.65], material(0xf2e4cb, { roughness: 0.74 }), [x, h + 0.12, z]);
  const balconyMat=material(0xf5eee0,{roughness:.65});const railMat=material(0xb6c2bd,{metalness:.65,roughness:.32});
  for(let y=7.2;y<h-2;y+=5.2){
    addBox(building,[w*.88,.16,.95],balconyMat,[x,y,z-d*.56]);
    addBox(building,[w*.82,.08,.08],railMat,[x,y+.55,z-d*.94]);
    for(let r=-2;r<=2;r++)addBox(building,[.055,.48,.055],railMat,[x+r*w*.16,y+.3,z-d*.94]);
  }
  // Refined setbacks give the skyline a recognizable coastal Deco profile.
  if (h > 34) {
    addBox(building, [w * 0.76, Math.min(8, h * 0.16), d * 0.78], facade, [x, h + 3.8, z]);
    addBox(building, [w * 0.53, 4.2, d * 0.58], material(0xe9ddc8, { roughness: 0.72 }), [x, h + 9.7, z]);
    const mast = addBox(building, [0.14, 4.4, 0.14], accent, [x, h + 14, z]);
    mast.material = material(0xe6c28c, { emissive: 0x5c462d, emissiveIntensity: 0.24, metalness: 0.45 });
  }
  // A glazed lobby and warm canopy make the sidewalk edge feel occupied.
  addBox(building, [w * 0.8, Math.min(2.6, baseHeight * 0.58), 0.1], material(0x42727b, { emissive: 0x17363b, emissiveIntensity: 0.24, metalness: 0.28, roughness: 0.25 }), [x, 1.5, z - d * 0.54]);
  if (h < 40) {
    const canvas = material(0xf3e4cf, { roughness: 0.8 }); const coral = material(0xd77c68, { roughness: 0.78 });
    for (let panel = 0; panel < 8; panel++) addBox(building, [w * 0.1, 0.12, 0.72], panel % 2 ? canvas : coral, [x - w * 0.36 + panel * w * 0.103, 2.9, z - d * 0.58]);
    addBox(building,[w*.82,2.5,.12],material(0x244657,{roughness:.18,metalness:.35,emissive:0x173442,emissiveIntensity:.25}),[x,1.55,z-d*.56]);
  }
  if (signText) { const sign = createSign(signText, accent.emissive?.getHex?.() || 0xf4af59); sign.position.set(x, Math.min(h - 2, 4.3), z - d / 2 - 0.3); sign.scale.setScalar(0.72); building.add(sign); }
  return building;
}

function addStreetLamp(parent, x, z, color = 0xffbe71) {
  const pole = material(0x26343c, { metalness: 0.72, roughness: 0.32 }); const glow = material(color, { emissive: color, emissiveIntensity: 2.2 });
  addBox(parent, [0.12, 6, 0.12], pole, [x, 3, z]); addBox(parent, [1.25, 0.12, 0.18], pole, [x + 0.48, 5.85, z]); addBox(parent, [0.45, 0.12, 0.25], glow, [x + 0.98, 5.8, z]);
  const light = new THREE.PointLight(color, 3.8, 24, 2); light.userData.streetLamp = true; light.userData.dayIntensity = 1.8; light.position.set(x + 0.98, 5.45, z); parent.add(light);
}

function addTrafficSignal(parent, x, z) {
  const pole = material(0x34434a, { metalness: 0.68, roughness: 0.34 }); const housing = material(0x172228, { metalness: 0.25, roughness: 0.55 });
  addBox(parent, [0.15, 6.6, 0.15], pole, [x, 3.3, z]); addBox(parent, [0.95, 0.15, 0.15], pole, [x - 0.42, 6.25, z]);
  addBox(parent, [0.34, 1.05, 0.35], housing, [x - 0.8, 5.58, z]);
  for (const [index, color] of [0xff4b51, 0xf5cc66, 0x53d39a].entries()) {
    const lens = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), material(color, { emissive: color, emissiveIntensity: index === 2 ? 0.75 : 0.1 })); lens.position.set(x - 0.8, 5.9 - index * 0.3, z + 0.19); parent.add(lens);
  }
}

function addGantry(parent, x, z, yellow) {
  const leg = material(yellow.color, { emissive: 0x6c4c08, emissiveIntensity: 0.35, metalness: 0.55 });
  for (const side of [-1, 1]) {
    addBox(parent, [1.2, 18, 1.2], leg, [x + side * 12, 9, z]);
    addBox(parent, [3.8, 1.1, 2], leg, [x + side * 12, 2, z]);
    for (let i = 0; i < 3; i++) addBox(parent, [0.12, 1.7, 0.12], material(0x333b3e), [x + side * (10 + i * 2), 14, z]);
  }
  addBox(parent, [27, 1.5, 1.6], leg, [x, 18, z]); addBox(parent, [16, 0.55, 0.8], leg, [x - 7, 19, z]);
  const flood = new THREE.PointLight(0xffd18a, 19, 42, 1.5); flood.position.set(x, 16.8, z); parent.add(flood);
}

function addFerrisWheel(parent, x, z) {
  const wheel = new THREE.Group(); wheel.position.set(x, 0, z); parent.add(wheel);
  const rim = material(0xe5cba0, { metalness: 0.42, roughness: 0.34, emissive: 0x5b4529, emissiveIntensity: 0.2 });
  const glow = material(0xffd58b, { emissive: 0xffc86a, emissiveIntensity: 1.05 });
  const center = new THREE.Vector3(0, 24, 0);
  wheel.add(new THREE.Mesh(new THREE.TorusGeometry(19, 0.34, 8, 80), rim)).position.copy(center);
  for (let i = 0; i < 20; i++) {
    const a = i * Math.PI * 2 / 20; const end = new THREE.Vector3(Math.cos(a) * 19, 24 + Math.sin(a) * 19, 0);
    const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, center.distanceTo(end), 6), rim);
    spoke.position.copy(center).add(end).multiplyScalar(0.5); spoke.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.clone().sub(center).normalize()); wheel.add(spoke);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.7, 1.3), glow); cabin.position.set(Math.cos(a) * 19, 24 + Math.sin(a) * 19 - 1.3, 0); wheel.add(cabin);
  }
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.58, 28, 8), rim); leg.position.set(side * 6.4, 13, 0); leg.rotation.z = side * -0.43; wheel.add(leg);
  }
  const hub = new THREE.Mesh(new THREE.SphereGeometry(1.25, 16, 12), glow); hub.position.copy(center); wheel.add(hub);
  return wheel;
}

/** Construct four elevated districts around the bay, with a connected road ribbon. */
export function createCity(scene, seed = 1) {
  const random = createRandom(seed); const textures = makeTextures(seed); const root = new THREE.Group(); scene.add(root);
  const ocean = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), new THREE.MeshBasicMaterial({ map: textures.water, color: 0xffffff, toneMapped: false }));
  ocean.rotation.x = -Math.PI / 2; ocean.position.set(160, -0.5, 0); root.add(ocean);
  const asphalt = material(0xffffff, { map: textures.asphalt, roughness: 0.82, metalness: 0.04 });
  const concrete = material(0xb8b4aa, { roughness: 0.88 }); const sidewalk = material(0xc2beb3, { roughness: 0.9 });
  const whiteLine = new THREE.MeshBasicMaterial({ color: 0xf4efe0 }); const yellowLine = new THREE.MeshBasicMaterial({ color: 0xffdc6a });
  const sand = material(0xb99467, { roughness: 0.95 }); const grass = material(0x55755d, { roughness: 1 });
  const neon = [0xf39a79, 0x78cbd0, 0xe5b86e, 0xd7edf4].map((c) => material(c, { emissive: c, emissiveIntensity: 0.72 }));
  textures.windows.repeat.set(1, 1.35);
  const buildingMats = [
    material(0xe7d4b8, { map: textures.windows, roughness: 0.66, metalness: 0.08 }),
    material(0xc8dad4, { map: textures.windows, roughness: 0.58, metalness: 0.12 }),
    material(0x829da6, { map: textures.windows, roughness: 0.34, metalness: 0.3 }),
    material(0xe0c0a5, { map: textures.windows, roughness: 0.66, metalness: 0.08 }),
    material(0x96afb2, { map: textures.windows, roughness: 0.38, metalness: 0.24 }),
  ];

  // Broad platforms sit at -0.05 m, visibly above the -0.5 m bay water plane.
  addLandmass(root, [[-500,-460],[15,-460],[55,-330],[8,-210],[35,-105],[-15,30],[-90,140],[-190,190],[-310,100],[-430,20],[-500,-80]], 0xcfc1a8);
  addLandmass(root, [[-85,-10],[335,-10],[390,90],[360,370],[210,450],[20,350],[-80,210]], 0xe0d5c0);
  addLandmass(root, [[300,210],[720,210],[760,470],[300,470]], 0xd7cfbb);
  addLandmass(root, [[425,-245],[760,-245],[780,85],[620,130],[450,60]], 0xcac4ad);
  // Sandy coast, seawall and promenade line the western island edge.
  addBox(root, [14, 0.18, 485], sand, [-452, 0.03, -190]);
  addBox(root, [3, 1.4, 490], concrete, [-437, 0.55, -190]);
  addBox(root, [1.2, 1.15, 490], material(0xb9c0b9, { metalness: 0.6 }), [-433, 1.2, -190]);
  addBox(root, [40, 0.12, 430], grass, [-407, 0.05, -180]);

  // Coast highway hairpin plus approach; fine edge stripes and double center lines.
  const coastCurve = addRoad(root, [[-400,-390],[-290,-350],[-190,-365],[-120,-320],[-170,-265],[-285,-275],[-325,-220],[-250,-160],[-115,-180],[-10,-95],[45,20]], 20, asphalt, whiteLine, yellowLine);
  // A continuous coastal neighborhood follows the bend so every approach view meets a street wall.
  for(let i=0;i<11;i++){
    const t=.12+i*.078;const p=coastCurve.getPoint(t);const tangent=coastCurve.getTangent(t);const side=new THREE.Vector3(-tangent.z,0,tangent.x).normalize();
    for(const sign of [-1,1]){
      const pos=p.clone().addScaledVector(side,sign*(32+(i%2)*4));const width=16+(i%3)*3;const height=18+(i*13%23);const depth=15+(i%2)*4;
      addBox(root,[width+7,.16,depth+9],sidewalk,[pos.x,.08,pos.z]);
      const facade=buildingMats[(i+(sign>0?2:0))%buildingMats.length];const accent=neon[(i+(sign>0?1:0))%neon.length];
      addBuilding(root,pos.x,pos.z,width,height,depth,facade,accent,['SOLARA','BAY MARINA','SUNSET CAFE','PALM HOTEL'][i%4]);
      const palm=createPalm();palm.position.copy(p).addScaledVector(side,sign*18);palm.scale.setScalar(.92+(i%3)*.06);root.add(palm);
      if(i%3===0)addTrafficSignal(root,pos.x,pos.z+sign*11);
    }
  }
  addRoad(root, [[-430,-80],[-280,-40],[-110,-60],[35,-30],[155,45],[270,75],[430,15]], 22, asphalt, whiteLine, yellowLine);
  for (let i = 0; i < 22; i++) { const t = 0.29 + i * 0.004; const point = coastCurve.getPoint(t); const curb = addBox(root, [1.2, 0.12, 2.2], material(i % 2 ? 0xf5eee0 : 0xd74240), [point.x + (i % 2 ? 9.2 : -9.2), 0.12, point.z]); curb.rotation.y = 0.6; }
  // Downtown elevated sidewalks, crosswalks and gridded boulevards.
  for (const [x, z, w, d] of [[120,0,500,22],[120,155,500,19],[120,310,500,19],[160,160,21,380],[315,160,21,380],[0,155,19,360]]) {
    addBox(root, [w + 9, 0.13, d + 9], sidewalk, [x, 0.04, z]); addBox(root, [w, 0.13, d], asphalt, [x, 0.12, z]);
  }
  for (const z of [70, 235]) for (let i = 0; i < 11; i++) addBox(root, [1.4, 0.03, 16], whiteLine, [80 + i * 8, 0.21, z]);
  for (const [x,z] of [[120,70],[120,235],[160,155],[315,155]]) addTrafficSignal(root,x,z);

  // Neon Downtown Art Deco and glass towers with illuminated window grids.
  for (let i = 0; i < 28; i++) {
    const x = 36 + (i % 7) * 48 + (random() - 0.5) * 5; const z = -22 + Math.floor(i / 7) * 92 + (random() - 0.5) * 8;
    if (Math.hypot(x - 610, z - 145) < 50) continue;
    if (Math.abs(z) < 30 || Math.abs(z - 155) < 28 || Math.abs(z - 310) < 28 || Math.abs(x - 160) < 28 || Math.abs(x - 315) < 28) continue;
    const h = 22 + random() * 52; const w = 22 + random() * 11; const d = 20 + random() * 12;
    addBuilding(root, x, z, w, h, d, buildingMats[Math.floor(random() * buildingMats.length)], neon[i % neon.length], i % 9 === 0 ? ['SOLARA','APEX CLUB','BAY MARINA','PALM HOTEL','SUNSET LOUNGE'][Math.floor(i / 9)] : '');
  }

  // Dense neon frontage flanks the pursuit boulevard on both sidewalks.
  const neonNames = ['NOVA', '24HR', 'LUX', 'BAY', 'VOLT', 'MIRAGE'];
  for (let i = 0; i < 11; i++) {
    const x = 188 + i * 19;
    for (const [side, z] of [[-1, 132], [1, 179]]) {
      const h = 28 + ((i * 17 + (side > 0 ? 9 : 0)) % 38);
      const accent = neon[(i + (side > 0 ? 1 : 0)) % neon.length];
      addBuilding(root, x + (side > 0 ? 5 : 0), z, 15 + (i % 3) * 2, h, 17, buildingMats[(i + (side > 0 ? 2 : 0)) % buildingMats.length], accent, neonNames[i % neonNames.length]);
      const sign = createSign(neonNames[(i + 2) % neonNames.length], [0x35eaff, 0xff3eb5, 0xffb552][i % 3]);
      sign.position.set(x + (side > 0 ? 5 : 0), 9 + (i % 3) * 3, z + (side > 0 ? -9 : 9));
      sign.rotation.y = side > 0 ? Math.PI : 0;
      root.add(sign);
    }
  }

  // Sunset hotel row, softly lit gardens, palms, and beach promenade visitors.
  for (let i = 0; i < 5; i++) {
    const x = -414 + i * 55; const h = 26 + (i % 2) * 11;
    addBuilding(root, x, -365, 27, h, 20, buildingMats[(i + 1) % buildingMats.length], neon[i % 3], ['SOLARA','PALM CLUB','SUNSET LOUNGE'][i % 3]);
  }
  const ferrisWheel = addFerrisWheel(root, -356, -122);
  for (let i = 0; i < 16; i++) {
    const palm = createPalm(); palm.position.set(-432 + (i % 4) * 15, 0, -410 + Math.floor(i / 4) * 59); palm.scale.setScalar(0.75 + random() * 0.2); root.add(palm);
  }
  for (const [index, z] of [-330,-247,-164].entries()) {
    const canopy = material([0xf1e4d0,0xe9aa8d,0x9fd2ce][index], { roughness: 0.8 });
    const pole = material(0xf2dfbd, { metalness: 0.35, roughness: 0.45 });
    addBox(root,[0.12,1.65,0.12],pole,[-452,0.9,z]);
    const shade = new THREE.Mesh(new THREE.ConeGeometry(2.0,0.55,10),canopy); shade.position.set(-452,2.0,z); root.add(shade);
    const table = new THREE.Mesh(new THREE.CylinderGeometry(0.8,0.85,0.12,16),material(0xf4ead7,{roughness:0.6}));table.position.set(-452,0.82,z+2.3);root.add(table);
  }
  // Keep a clear framing strip close to the staged drift camera and road.
  for (let i = 0; i < 14; i++) addStreetLamp(root, -385 + i * 55, -240 + (i % 2) * 28, 0xffbf75);

  // Harbor quay, colorful container stacks, two gantry cranes and cargo ship silhouette.
  addBox(root, [405, 0.42, 200], concrete, [520, 0.07, 335]);
  addBox(root, [385, 1.2, 3], concrete, [520, 0.52, 232]);
  const containerColors = [0xb9423d, 0x168d91, 0xd3a838, 0x233a57];
  for (let row = 0; row < 3; row++) for (let col = 0; col < 6; col++) {
    const crate = createCrate(containerColors[(row + col) % containerColors.length]); crate.position.set(360 + col * 15, row * 2.8, 275 + (col % 2) * 15); root.add(crate);
  }
  const craneYellow = material(0xe5b531, { emissive: 0x664500, emissiveIntensity: 0.3, metalness: 0.4 });
  addGantry(root, 455, 385, craneYellow); addGantry(root, 625, 385, craneYellow);
  const ship = new THREE.Group(); ship.position.set(545, 0, 465); root.add(ship);
  addBox(ship, [160, 13, 30], material(0x253744), [0, 2, 0]); addBox(ship, [28, 22, 25], material(0xe1e1d3), [-60, 15, 0]);
  for (let i = 0; i < 7; i++) addBox(ship, [15, 11, 25], material(containerColors[i % 4]), [-36 + i * 17, 14, 0]);
  for (let i = 0; i < 5; i++) addStreetLamp(root, 350 + i * 76, 248, 0xffcc83);

  // Coral Island green space and illuminated suspension bridge.
  const bridgeDeck = material(0x46535b, { metalness: 0.6, roughness: 0.4 });
  addBox(root, [25, 0.55, 290], bridgeDeck, [390, 3.1, 50]);
  for (const x of [377, 403]) {
    addBox(root, [1.8, 32, 2], neon[1], [x, 19, -60]); addBox(root, [1.8, 32, 2], neon[1], [x, 19, 160]);
    for (const z of [-44, -20, 15, 50, 85, 120, 154]) addBox(root, [0.1, 0.1, 0.1], material(0x64dce8, { emissive: 0x4ee6ff, emissiveIntensity: 2 }), [x, 18 - Math.abs(z - 50) * 0.06, z]);
    const beacon = new THREE.PointLight(0x45eaff, 12, 45); beacon.position.set(x, 33, 50); root.add(beacon);
  }
  for (const z of [-52, 160]) {
    const cable = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(377,34,z),new THREE.Vector3(390,20,z),new THREE.Vector3(403,34,z)]),32,0.13,7,false), neon[1]); root.add(cable);
  }

  // PAY N TUNE garage has an explicit 50 m building exclusion zone around the bay.
  const garage = new THREE.Group(); garage.position.set(610, 0, 145); root.add(garage);
  const garageMat = material(0x78858a, { metalness: 0.22, roughness: 0.58 });
  addBox(garage, [2, 9, 26], garageMat, [-17, 4.5, 0]); addBox(garage, [2, 9, 26], garageMat, [17, 4.5, 0]);
  addBox(garage, [36, 1.2, 26], garageMat, [0, 9, 0]); addBox(garage, [32, 0.24, 22], material(0x202a31, { metalness: 0.35 }), [0, 0.16, 0]);
  addBox(garage, [32, 7.8, 1.2], material(0xb6c0ba, { roughness: 0.72 }), [0, 4.25, -11.7]);
  addBox(garage, [26, 0.25, 0.2], material(0xe1b471, { emissive: 0x9b6328, emissiveIntensity: 0.45 }), [0, 7.4, -10.9]);
  addBox(garage, [13.5, 0.55, 1.1], material(0x303a3e, { metalness: 0.56, roughness: 0.42 }), [0, 1.1, -9.8]);
  addBox(garage, [12.8, 0.18, 1.35], material(0xb6a58c, { metalness: 0.28, roughness: 0.5 }), [0, 1.43, -9.8]);
  addBox(garage, [14, 3.3, 0.24], material(0x354249, { metalness: 0.26, roughness: 0.8 }), [0, 3.7, -10.88]);
  const toolMetal = material(0xc4c5bb, { metalness: 0.72, roughness: 0.28 });
  for (let i = 0; i < 7; i++) { const tool = addBox(garage, [0.18, 1.15 + (i % 3) * 0.3, 0.08], toolMetal, [-5.3 + i * 1.75, 3.5, -10.68]); tool.rotation.z = (i % 2 ? 1 : -1) * 0.16; }
  const rackMaterial = material(0xa9b1aa, { metalness: 0.72, roughness: 0.32 });
  for (const side of [-1, 1]) for (let layer = 0; layer < 3; layer++) {
    const tire = new THREE.Mesh(new THREE.TorusGeometry(0.67, 0.22, 10, 24), material(0x171b1c, { roughness: 0.92 }));
    tire.rotation.x = Math.PI / 2; tire.position.set(side * 13.5, 0.66 + layer * 1.42, -7.8); garage.add(tire);
    addBox(garage, [2.1, 0.09, 1.7], rackMaterial, [side * 13.5, 1.42 + layer * 1.42, -7.8]);
  }
  addBox(garage, [29, 0.24, 19], material(0x87969a, { emissive: 0x285b68, emissiveIntensity: 0.4, metalness: 0.6 }), [0, 0.32, -0.2]);
  for (const x of [-10, 0, 10]) { const spot = new THREE.SpotLight(0xffedca, 48, 32, Math.PI / 4, 0.6); spot.position.set(x, 8.4, 3); const target = new THREE.Object3D(); target.position.set(x, 0, 0); garage.add(spot, target); spot.target = target; const strip = addBox(garage, [4.4, 0.1, 0.55], material(0xffedcf, { emissive: 0xffdca8, emissiveIntensity: 1.1 }), [x, 8.35, 3]); }
  garage.add(new THREE.PointLight(0x46e7ff, 24, 32)); garage.children[garage.children.length - 1].position.set(4, 5, 0);
  const sign = createSign('PAY N TUNE', 0x49e8ff); sign.position.set(610, 7.7, 133.8); root.add(sign);
  addBox(root, [6, 3.2, 4], material(0x313b40), [582, 1.7, 140]); addBox(root, [5, 3.6, 4], material(0x313b40), [639, 1.9, 141]);
  for (let i = 0; i < 5; i++) { const tire = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.18, 8, 18), material(0x151719)); tire.position.set(587 + i * 1.2, 1.4, 143); root.add(tire); }

  // Pursuit roadblock, reflective red-blue striped barricades and spike strip.
  const roadblock = new THREE.Group(); roadblock.position.set(0, 0, 0); root.add(roadblock);
  for (let i = 0; i < 7; i++) {
    const z = -18 + i * 6; const barrier = addBox(roadblock, [0.48, 1, 5], material(i % 2 ? 0x246cc0 : 0xd9414f, { emissive: i % 2 ? 0x153f87 : 0x7b1723, emissiveIntensity: 0.8 }), [0, 0.55, z]); barrier.rotation.y = 0.08;
  }
  addBox(roadblock, [1.5, 0.12, 42], material(0xa6afb0, { metalness: 0.85 }), [2.2, 0.18, 0]);
  for (let i = 0; i < 17; i++) { const spike = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.55, 4), material(0xc1c8c3, { metalness: 0.8 })); spike.position.set(2.2, 0.48, -20 + i * 2.5); spike.rotation.z = Math.PI; roadblock.add(spike); }

  const traffic = [];
  for (let i = 0; i < 13; i++) { const car = createVehicle(i === 12 ? 7 : i % 5); car.position.set(-280 + (i * 67) % 650, 0.1, -80 + (i % 4) * 74); car.rotation.y = i % 2 ? Math.PI / 2 : 0; root.add(car); traffic.push(car); }
  const police = [];
  for (let i = 0; i < 4; i++) { const car = createVehicle(5); car.position.set(90 + i * 11, 0.12, 15 + i * 5); root.add(car); police.push(car); }
  const swat = createVehicle(6); swat.visible = false; root.add(swat);
  const helicopter = createHelicopter(); helicopter.position.set(150, 66, -28); root.add(helicopter);
  return { root, traffic, police, swat, helicopter, ferrisWheel, garage, roadblock, asphalt, seed, coastCurve,
    roadGraph: { nodes: [[-400,-390],[-290,-350],[-120,-320],[-250,-160],[35,-30],[120,155],[315,310],[520,335],[610,145]], districts: [[-280,-280],[120,160],[520,335],[610,145]] } };
}
