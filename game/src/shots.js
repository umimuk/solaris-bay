import * as THREE from '../vendor/three.module.min.js';
import { createGlowSprite, createVehicle } from './models/vehicles.js';
import { createSign } from './models/props.js';
import { createPalm } from './models/props.js';
import { makeTextures } from './world/textures.js';

function addBoulevardBackdrop(game) {
  const camera = game.camera;
  camera.updateMatrixWorld(true);
  const avenue = new THREE.Group();
  avenue.position.copy(camera.position);
  avenue.rotation.set(0, camera.rotation.y, 0);
  game.scene.add(avenue);
  game.shotAvenue = avenue;
  const avenueTextures = makeTextures(41);
  avenueTextures.asphalt.repeat.set(1.8, 14);
  const asphalt = new THREE.MeshPhysicalMaterial({ color: 0x99a4ab, map: avenueTextures.asphalt, roughness: 0.42, metalness: 0.16, envMapIntensity: 1.35, clearcoat: 0.28 });
  const sidewalk = new THREE.MeshStandardMaterial({ color: 0xd9cbb1, roughness: 0.85 });
  const cream = new THREE.MeshStandardMaterial({ color: 0xf2e6d1, map: avenueTextures.facade, roughness: 0.66 });
  const coral = new THREE.MeshStandardMaterial({ color: 0xe6c5ae, map: avenueTextures.facade, roughness: 0.64 });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x315f6d, roughness: 0.12, metalness: 0.52, clearcoat: 1, clearcoatRoughness: 0.08 });
  const balcony = new THREE.MeshStandardMaterial({ color: 0xfff0d9, roughness: 0.5, metalness: 0.12 });
  const road = new THREE.Mesh(new THREE.PlaneGeometry(30, 620), asphalt);
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, -5.1, -90);
  road.scale.y = 1.18;
  avenue.add(road);
  const sidewalkMaterial = sidewalk;
  for (const side of [-1, 1]) {
    const walk = new THREE.Mesh(new THREE.BoxGeometry(side < 0 ? 8 : 5, 0.22, 355), sidewalkMaterial);
    walk.position.set(side < 0 ? -20.5 : 20.2, -4.9, -130);
    walk.scale.z = 1.18;
    avenue.add(walk);
    const curb = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.34, 355), balcony);
    curb.position.set(side < 0 ? -16 : 17.7, -4.85, -130);
    curb.scale.z = 1.18;
    avenue.add(curb);
  }
  const paint = new THREE.MeshBasicMaterial({ color: 0xf6f1df, toneMapped: false });
  const yellow = new THREE.MeshBasicMaterial({ color: 0xf3c54f, toneMapped: false });
  for (const x of [-0.18, 0.18]) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.045, 355), yellow);
    line.position.set(x, -4.9, -194);
    avenue.add(line);
  }
  for (const x of [-8, 8]) {
    for (let z = -22; z >= -350; z -= 15) {
      const dash = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.04, 7.2), paint);
      dash.position.set(x, -4.88, z);
      avenue.add(dash);
    }
  }
  const gpsMaterial = new THREE.MeshBasicMaterial({ color: 0x55f5ff, transparent: true, opacity: 0.92, toneMapped: false });
  for (let index = 0; index < 9; index++) {
    const arrow = new THREE.Group(); const z = -28 - index * 24;
    const stem = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.055, 3.1), gpsMaterial); stem.position.z = 0.8; arrow.add(stem);
    for (const wingSide of [-1, 1]) {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.055, 1.25), gpsMaterial); wing.position.set(wingSide * 0.55, 0, -0.2); wing.rotation.y = wingSide * -0.64; arrow.add(wing);
    }
    arrow.position.set(0, -4.84, z); avenue.add(arrow);
  }
  for (const z of [-68, -164, -261]) {
    for (let stripe = 0; stripe < 16; stripe++) {
      const crosswalk = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.045, 3.2), paint);
      crosswalk.position.set(-18 + stripe * 2.4, -4.87, z);
      avenue.add(crosswalk);
    }
    const gantry = new THREE.Mesh(new THREE.BoxGeometry(49, 0.7, 0.7), new THREE.MeshStandardMaterial({ color: 0xd5a93c, metalness: 0.5, roughness: 0.38 }));
    gantry.position.set(0, 13, z - 7);
    avenue.add(gantry);
    for (const x of [-23.5, 23.5]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.45, 20, 0.45), gantry.material);
      leg.position.set(x, 3, z - 7);
      avenue.add(leg);
    }
    for (const x of [-10, 0, 10]) {
      const signal = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.82, 0.42), new THREE.MeshBasicMaterial({ color: 0xe6b52c, toneMapped: false }));
      signal.position.set(x, 11.6, z - 7);
      avenue.add(signal);
    }
  }
  for (let row = 0; row < 10; row++) {
    const z = -42 - row * 31;
    for (const side of [-1]) {
      const x = -29 - (row % 2) * 2;
      const width = 15 + (row % 3) * 2;
      const height = 23 + (row * 7 % 16);
      const building = new THREE.Group();
      building.position.set(x, -5, z);
      const shell = new THREE.Mesh(new THREE.BoxGeometry(width, height, 17), row % 3 ? cream : coral);
      shell.position.y = height / 2;
      building.add(shell);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(width + 0.8, 0.45, 17.8), balcony);
      roof.position.y = height + 0.22;
      building.add(roof);
      const floors = Math.floor((height - 4) / 3.4);
      for (let floor = 0; floor < floors; floor++) {
        const y = 3 + floor * 3.4;
        for (let column = 0; column < 4; column++) {
          const wx = -width * 0.36 + column * width * 0.24;
          const window = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.7, 0.14), glass);
          window.position.set(wx, y, 8.62);
          building.add(window);
          const slab = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.16, 1.15), balcony);
          slab.position.set(wx, y - 0.95, 9.15);
          building.add(slab);
          const rail = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.55, 0.08), balcony);
          rail.position.set(wx, y - 0.64, 9.7);
          building.add(rail);
          for (const end of [-1, 1]) {
            const sideWindow = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.5, 2), glass);
            sideWindow.position.set(end * (width / 2 + 0.08), y, -5 + column * 3.1);
            building.add(sideWindow);
          }
        }
      }
      for (let stripe = 0; stripe < 8; stripe++) {
        const awning = new THREE.Mesh(new THREE.BoxGeometry(width * 0.105, 0.13, 1.25), new THREE.MeshStandardMaterial({ color: stripe % 2 ? 0xffead1 : 0xe78268, roughness: 0.85 }));
        awning.position.set(-width * 0.38 + stripe * width * 0.108, 2.45, 9.1);
        building.add(awning);
      }
      avenue.add(building);
      const palm = createPalm();
      palm.position.set(-17.2, -4.9, z + 1);
      palm.scale.setScalar(1.18 + row % 3 * 0.08);
      avenue.add(palm);
      const lamp = new THREE.Group();
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.18, 8, 8), new THREE.MeshStandardMaterial({ color: 0x364249, metalness: 0.65, roughness: 0.4 }));
      pole.position.set(side * 23, -3, z - 14);
      lamp.add(pole);
      const head = new THREE.PointLight(0xffd99d, 12, 24);
      head.position.set(side * 23, 1.2, z - 14);
      lamp.add(head);
      lamp.position.y = 2.1;
      avenue.add(lamp);
    }
  }
  const beach = new THREE.Mesh(new THREE.PlaneGeometry(44, 390), new THREE.MeshStandardMaterial({ color: 0xf1d49e, roughness: 0.94 }));
  beach.rotation.x = -Math.PI / 2; beach.position.set(40, -4.98, -150); avenue.add(beach);
  const ocean = new THREE.Mesh(new THREE.PlaneGeometry(190, 410), new THREE.MeshStandardMaterial({ color: 0x16b7c1, roughness: 0.22, metalness: 0.25, emissive: 0x087080, emissiveIntensity: 0.22 }));
  ocean.rotation.x = -Math.PI / 2; ocean.position.set(151, -5.08, -150); avenue.add(ocean);
  const surfFoam = new THREE.MeshBasicMaterial({ color: 0xf7ffff, transparent: true, opacity: 0.77, toneMapped: false });
  for (let index = 0; index < 32; index++) {
    const wave = new THREE.Mesh(new THREE.BoxGeometry(1.8 + (index % 6) * 0.72, 0.035, 0.13), surfFoam);
    wave.position.set(59 + (index % 4) * 0.58, -4.99, -20 - index * 10.5); wave.rotation.y = (index % 2 ? -0.18 : 0.18); avenue.add(wave);
  }
  const umbrellaMats = [0xf15c5c, 0xffd34f, 0x39b8b1, 0xf3f2e9].map((color) => new THREE.MeshStandardMaterial({ color, roughness: 0.82 }));
  for (let index = 0; index < 10; index++) {
    const x = 28 + (index % 2) * 15; const z = -30 - Math.floor(index / 2) * 42;
    const umbrella = new THREE.Mesh(new THREE.ConeGeometry(1.8, 0.45, 12), umbrellaMats[index % umbrellaMats.length]); umbrella.position.set(x, -2.7, z); avenue.add(umbrella);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 2.25, 6), balcony); pole.position.set(x, -3.9, z); avenue.add(pole);
  }
  for (const z of [-52, -122, -192, -262]) {
    const beachPalm = createPalm(); beachPalm.position.set(19.8, -4.9, z); beachPalm.scale.setScalar(1.22); avenue.add(beachPalm);
  }
  // The 65 mints of traffic read as small, bright moving cars on the distant lanes.
  const trafficPaint = [0xecebe2, 0xc76455, 0x4b8a9a, 0xe2b75b, 0x364b5f];
  for (let index = 0; index < 5; index++) {
    const car = createVehicle(index % 3 === 0 ? 0 : index % 5);
    car.userData.paintMaterial?.color.setHex(trafficPaint[index]);
    car.position.set([-18, -10, 10, 18, 4][index], -5.13, -37 - index * 40);
    car.rotation.y = index % 2 ? Math.PI / 2 : -Math.PI / 2;
    car.scale.setScalar(index < 2 ? 0.72 : 0.52);
    avenue.add(car);
  }
  const wheel = game.city.ferrisWheel;
  if (wheel) {
    avenue.add(wheel);
    wheel.position.set(3, -5, -242);
    wheel.quaternion.identity();
    wheel.scale.setScalar(1.12);
    wheel.traverse((part) => {
      if (!part.material) return;
      part.material.color?.set(0xc9f6ff);
      part.material.emissive?.set(0x2bcbe5);
      if ('emissiveIntensity' in part.material) part.material.emissiveIntensity = 1.85;
    });
  }
  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 2.1, 42, 8), new THREE.MeshStandardMaterial({ color: 0xffedc8, emissive: 0xffc66c, emissiveIntensity: 1.3, metalness: 0.5 }));
  spire.position.set(1, 16, -308);
  avenue.add(spire);
}

function addShotSkyline(game) {
  game.camera.updateMatrixWorld(true);
  const set = new THREE.Group();
  set.position.copy(game.camera.position);
  set.quaternion.copy(game.camera.quaternion);
  game.scene.add(set);
  const facades = [0xe6af9d, 0xb9d8cc, 0xeec6a4, 0xc4d7e4, 0xe7d8ba];
  for (const originalX of [-67, -49, -31, -16, 16, 31, 49, 67]) {
    const isWheelSideBuilding = originalX === 31;
    const x = isWheelSideBuilding ? 19 : originalX;
    const width = isWheelSideBuilding ? 8 : 15;
    const height = isWheelSideBuilding ? 6 : 19 + (Math.abs(originalX) * 7 % 18);
    const facade = new THREE.MeshStandardMaterial({ color: facades[Math.abs(originalX) % facades.length], roughness: 0.62, metalness: 0.12 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, 13), facade);
    body.position.set(x, -8 + height / 2, -112);
    set.add(body);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(width + 0.7, 0.38, 13.7), new THREE.MeshStandardMaterial({ color: 0xffeee0, roughness: 0.6 }));
    roof.position.set(x, -8 + height, -112);
    set.add(roof);
    const glass = new THREE.MeshStandardMaterial({ color: 0x39727c, roughness: 0.2, metalness: 0.32, emissive: 0x0b2933, emissiveIntensity: 0.2 });
    for (let floor = 0; floor < Math.floor(height / 4); floor++) {
      for (const column of [-1, 0, 1]) {
        const window = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.6, 0.12), glass);
        window.position.set(x + column * (isWheelSideBuilding ? 3 : 4), -7 + floor * 3.5, -105.35);
        set.add(window);
        if (floor % 2 === 0) {
          const balcony = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.12, 0.85), new THREE.MeshStandardMaterial({ color: 0xf8f0e1, roughness: 0.68 }));
          balcony.position.set(x + column * (isWheelSideBuilding ? 3 : 4), -5.9 + floor * 3.5, -104.9);
          set.add(balcony);
        }
      }
    }
  }
}

function setCamera(game, position, target, fov) {
  game.shotCamera = { position: new THREE.Vector3(...position), target: new THREE.Vector3(...target), fov };
  game.camera.position.copy(game.shotCamera.position); game.camera.lookAt(game.shotCamera.target); game.camera.fov = fov; game.camera.updateProjectionMatrix(); game.camera.updateMatrixWorld(true);
}

function addCameraClouds(camera, scene) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 192;
  const context = canvas.getContext('2d');
  for (const [x, y, width, height, alpha] of [[250, 94, 238, 82, 0.45], [150, 110, 152, 58, 0.33], [350, 78, 168, 61, 0.36], [242, 126, 190, 48, 0.24]]) {
    context.save();
    context.translate(x, y);
    context.scale(width, height);
    const gradient = context.createRadialGradient(0, 0, 0, 0, 0, 1);
    gradient.addColorStop(0, `rgba(255,255,255,${alpha})`);
    gradient.addColorStop(0.48, `rgba(255,255,255,${alpha * 0.62})`);
    gradient.addColorStop(1, 'rgba(255,255,255,0.0)');
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(0, 0, 1, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const carrier = new THREE.Group();
  carrier.position.copy(camera.position);
  carrier.quaternion.copy(camera.quaternion);
  const material = new THREE.SpriteMaterial({
    map: texture, color: 0xffffff, transparent: true, opacity: 0.96,
    depthTest: false, depthWrite: false, toneMapped: false,
  });
  for (const [x, y, scale] of [[-104, 45, 1], [-36, 51, 1.08], [42, 46, 0.98], [112, 53, 0.92]]) {
    const cloud = new THREE.Sprite(material);
    cloud.position.set(x, y, -168);
    cloud.scale.set(78 * scale, 29 * scale, 1);
    cloud.renderOrder = 5;
    carrier.add(cloud);
  }
  scene.add(carrier);
}

function createSoftSmokeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(255,255,255,0.55)');
  gradient.addColorStop(0.54, 'rgba(240,244,250,0.22)');
  gradient.addColorStop(1, 'rgba(255,255,255,0.0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function addTitleCoast(game) {
  const camera = game.camera;
  camera.updateMatrixWorld(true);
  const coast = new THREE.Group();
  coast.position.copy(camera.position);
  coast.quaternion.copy(camera.quaternion);
  game.scene.add(coast);
  addShotSkyline(game);
  addCameraClouds(camera, game.scene);
  const landCanvas = document.createElement('canvas'); landCanvas.width = 512; landCanvas.height = 512;
  const landContext = landCanvas.getContext('2d'); landContext.fillStyle = '#bcae96'; landContext.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 32) for (let x = 0; x < 512; x += 64) {
    landContext.fillStyle = (x / 64 + y / 32) % 2 ? 'rgba(244,229,200,.16)' : 'rgba(67,62,54,.1)'; landContext.fillRect(x + 2, y + 2, 60, 28);
    landContext.strokeStyle = 'rgba(83,73,60,.25)'; landContext.strokeRect(x + 2, y + 2, 60, 28);
  }
  for (let i = 0; i < 4200; i++) { landContext.fillStyle = `rgba(71,66,57,${(i % 7 + 1) / 100})`; landContext.fillRect((i * 71) % 512, (i * 137) % 512, 1 + i % 3, 1 + i % 2); }
  const landTexture = new THREE.CanvasTexture(landCanvas); landTexture.colorSpace = THREE.SRGBColorSpace; landTexture.wrapS = landTexture.wrapT = THREE.RepeatWrapping; landTexture.repeat.set(3, 4);
  const land = new THREE.Mesh(new THREE.PlaneGeometry(150, 235), new THREE.MeshStandardMaterial({ map: landTexture, roughness: 0.92 }));
  land.rotation.x = -Math.PI / 2;
  land.position.set(-4, -11.6, -130);
  coast.add(land);
  const beach = new THREE.Mesh(new THREE.PlaneGeometry(31, 220), new THREE.MeshStandardMaterial({ color: 0xe6c58f, roughness: 0.96 }));
  beach.rotation.x = -Math.PI / 2;
  beach.position.set(32, -11.35, -130);
  coast.add(beach);
  const ocean = new THREE.Mesh(new THREE.PlaneGeometry(120, 260), new THREE.MeshStandardMaterial({ color: 0x1598a8, metalness: 0.62, roughness: 0.14, envMapIntensity: 2, emissive: 0x075365, emissiveIntensity: 0.22 }));
  ocean.rotation.x = -Math.PI / 2;
  ocean.position.set(100, -11.5, -133);
  coast.add(ocean);
  const reflectionGold = new THREE.MeshBasicMaterial({ color: 0xffcc70, transparent: true, opacity: 0.36, toneMapped: false });
  const reflectionCream = new THREE.MeshBasicMaterial({ color: 0xffefc3, transparent: true, opacity: 0.24, toneMapped: false });
  for (let index = 0; index < 42; index++) {
    const length = 3 + (index * 13 % 17); const streak = new THREE.Mesh(new THREE.BoxGeometry(length, 0.025, 0.08 + (index % 3) * 0.04), index % 4 ? reflectionGold : reflectionCream);
    streak.position.set(46 + (index * 23 % 94), -11.46, -20 - (index * 37 % 222)); coast.add(streak);
  }
  const titleTextures = makeTextures(31);
  titleTextures.asphalt.repeat.set(1.6, 8);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(50, 250), new THREE.MeshStandardMaterial({ color: 0x9da7ad, map: titleTextures.asphalt, roughness: 0.34, metalness: 0.2, envMapIntensity: 1.5 }));
  road.rotation.x = -Math.PI / 2;
  road.position.set(-15, -11.2, -130);
  coast.add(road);
  const curbMat = new THREE.MeshStandardMaterial({ color: 0xf1d8ae, roughness: 0.64 });
  const medianMat = new THREE.MeshStandardMaterial({ color: 0x315f3d, roughness: 0.96 });
  for (const x of [-40.2, 10.2]) {
    const curb = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.24, 250), curbMat); curb.position.set(x, -11.06, -130); coast.add(curb);
  }
  const median = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.24, 245), medianMat); median.position.set(-15, -11.04, -130); coast.add(median);
  const laneWhite = new THREE.MeshBasicMaterial({ color: 0xf4ead0, toneMapped: false });
  const laneGold = new THREE.MeshBasicMaterial({ color: 0xf7c85d, toneMapped: false });
  for (const x of [-36, -29, -1, 6]) {
    for (let z = -15; z > -250; z -= 17) {
      const dash = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.045, 7), laneWhite); dash.position.set(x, -11.16, z); coast.add(dash);
    }
  }
  for (const x of [-16.45, -15.55]) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.05, 250), laneGold); line.position.set(x, -11.16, -130); coast.add(line);
  }
  const outerWalk = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.16, 250), new THREE.MeshStandardMaterial({ color: 0xbfb09a, roughness: 0.88 }));
  outerWalk.position.set(-44, -11.12, -130); coast.add(outerWalk);
  const palmMedian = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.42, 245), new THREE.MeshStandardMaterial({ color: 0x547b4b, roughness: 0.96 }));
  palmMedian.position.set(-15, -10.82, -130); coast.add(palmMedian);
  for (let index = 0; index < 9; index++) {
    const palm = createPalm(); palm.position.set(-15, -10.62, -23 - index * 27); palm.scale.setScalar(0.55); coast.add(palm);
  }
  const promenade = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.28, 225), new THREE.MeshStandardMaterial({ color: 0xc8b99e, roughness: 0.86 }));
  promenade.position.set(16, -11.04, -130);
  coast.add(promenade);
  const seawall = new THREE.Mesh(new THREE.BoxGeometry(0.75, 2.1, 225), new THREE.MeshStandardMaterial({ color: 0xe1d7c6, roughness: 0.7 }));
  seawall.position.set(18.3, -10.4, -130);
  coast.add(seawall);
  const laneLine = new THREE.MeshBasicMaterial({ color: 0xf5e5af });
  for (let z = -22; z > -245; z -= 15) {
    const dash = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.035, 7), laneLine);
    dash.position.set(-38.8, -11.16, z);
    coast.add(dash);
  }
  const facadeColors = [0xf1e4cf, 0xf0d7c4, 0xe1e8df, 0xe7d1b4, 0xd3e1df];
  const facadeCanvas = document.createElement('canvas'); facadeCanvas.width = 512; facadeCanvas.height = 512;
  const facadeContext = facadeCanvas.getContext('2d');
  const facadeGradient = facadeContext.createLinearGradient(0, 0, 512, 512); facadeGradient.addColorStop(0, '#f0dfc5'); facadeGradient.addColorStop(1, '#c8a989'); facadeContext.fillStyle = facadeGradient; facadeContext.fillRect(0, 0, 512, 512);
  for (let y = 20; y < 480; y += 72) for (let x = 22; x < 490; x += 76) {
    facadeContext.fillStyle = (x + y) % 3 ? '#385b68' : '#d99656'; facadeContext.fillRect(x, y, 48, 48);
    facadeContext.fillStyle = 'rgba(255,230,183,.34)'; for (let blind = 0; blind < 4; blind++) facadeContext.fillRect(x + 3, y + 8 + blind * 9, 42, 2);
    facadeContext.strokeStyle = 'rgba(255,245,222,.82)'; facadeContext.lineWidth = 4; facadeContext.strokeRect(x - 3, y - 3, 54, 54);
  }
  facadeContext.fillStyle = '#f6e7cd'; facadeContext.fillRect(0, 0, 512, 14); facadeContext.fillRect(0, 490, 512, 22);
  const facadeTexture = new THREE.CanvasTexture(facadeCanvas); facadeTexture.colorSpace = THREE.SRGBColorSpace;
  const facadeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, map: facadeTexture, roughness: 0.58, metalness: 0.12 });
  const windowMaterial = new THREE.MeshPhysicalMaterial({ color: 0x31566a, roughness: 0.12, metalness: 0.62, clearcoat: 1, emissive: 0x102a3c, emissiveIntensity: 0.55 });
  for (let row = 0; row < 6; row++) {
    const z = -48 - row * 30;
    for (const x of [-55]) {
      const height = 19 + ((row * 7 + Math.abs(x) * 3) % 27);
      const building = new THREE.Group();
      const shell = new THREE.Mesh(new THREE.BoxGeometry(11.5, height, 14), facadeMaterial.clone()); shell.material.color.setHex(facadeColors[(row + Math.abs(x)) % facadeColors.length]);
      shell.position.y = height / 2 - 11.2;
      building.add(shell);
      const cornice = new THREE.Mesh(new THREE.BoxGeometry(12.3, 0.42, 14.8), new THREE.MeshStandardMaterial({ color: 0xf2dfbe, roughness: 0.62 })); cornice.position.y = height - 10.95; building.add(cornice);
      const lobby = new THREE.Mesh(new THREE.BoxGeometry(10.8, 3.6, 0.18), new THREE.MeshPhysicalMaterial({ color: 0x314b55, roughness: 0.16, metalness: 0.42, emissive: 0xffb85e, emissiveIntensity: 0.34 })); lobby.position.set(0, -9.45, 7.12); building.add(lobby);
      for (let floor = 0; floor < Math.floor(height / 3.5); floor++) {
        for (let column = 0; column < 3; column++) {
          const window = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.65, 0.12), windowMaterial);
          window.position.set(-3.4 + column * 3.4, -9.7 + floor * 3.4, 7.1);
          building.add(window);
          const balcony = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.12, 0.9), new THREE.MeshStandardMaterial({ color: 0xfff0da, metalness: 0.12, roughness: 0.5 }));
          balcony.position.set(-3.4 + column * 3.4, -10.75 + floor * 3.4, 7.5);
          building.add(balcony);
        }
      }
      building.position.set(x, 0, z);
      coast.add(building);
    }
  }
  for (const z of [-40, -90, -140, -190]) {
    const palm = createPalm();
    palm.position.set(20, -11.2, z);
    palm.scale.setScalar(1.72);
    coast.add(palm);
  }
  for (let index = 0; index < 8; index++) {
    const car = createVehicle(index % 4 === 0 ? 0 : index % 4);
    car.position.set(index % 2 ? -3 : -34, -11.16, -22 - index * 27);
    car.rotation.y = index % 2 ? -Math.PI / 2 : Math.PI / 2;
    car.scale.setScalar(index % 3 === 0 ? 0.92 : 0.78);
    coast.add(car);
  }
  for (const z of [-80, -165, -225]) {
    const surf = new THREE.CatmullRomCurve3([new THREE.Vector3(22, -11.08, z - 18), new THREE.Vector3(30, -11.02, z - 8), new THREE.Vector3(33, -11.02, z), new THREE.Vector3(29, -11.02, z + 10), new THREE.Vector3(21, -11.08, z + 18)]);
    coast.add(new THREE.Mesh(new THREE.TubeGeometry(surf, 30, 0.2, 6, false), new THREE.MeshBasicMaterial({ color: 0xeafff8, transparent: true, opacity: 0.76, toneMapped: false })));
  }
  const wheel = game.city.ferrisWheel;
  game.scene.attach(wheel);
  coast.add(wheel);
  wheel.visible = true;
  wheel.position.set(42, -6, -102);
  wheel.quaternion.identity();
  wheel.scale.setScalar(0.96);
  const pier = new THREE.Group();
  pier.position.set(48, -7, -102);
  coast.add(pier);
  const wood = new THREE.MeshStandardMaterial({ color: 0x936640, roughness: 0.78, emissive: 0x4f260f, emissiveIntensity: 0.2 });
  const deck = new THREE.Mesh(new THREE.BoxGeometry(38, 0.48, 12), wood);
  deck.position.set(19, 0.3, -5);
  pier.add(deck);
  for (const x of [5, 15, 25, 35]) for (const z of [-9, -1]) {
    const piling = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.32, 8, 8), wood);
    piling.position.set(x, -3.8, z - 5);
    pier.add(piling);
  }
  const pierEdge = new THREE.MeshBasicMaterial({ color: 0xffc86d, toneMapped: false });
  for (const z of [-10.8, 0.8]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(37, 0.12, 0.14), pierEdge);
    rail.position.set(19, 0.66, z - 5);
    pier.add(rail);
  }
  const boardwalk = new THREE.Mesh(new THREE.BoxGeometry(16, 0.22, 205), new THREE.MeshStandardMaterial({ color: 0x987044, roughness: 0.82, emissive: 0x28190d, emissiveIntensity: 0.22 }));
  boardwalk.position.set(31, -11.18, -118);
  coast.add(boardwalk);
  const boardwalkPlank = new THREE.MeshStandardMaterial({ color: 0xc09052, roughness: 0.76, metalness: 0.08 });
  for (let index = 0; index < 22; index++) {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(15.5, 0.035, 0.32), boardwalkPlank);
    plank.position.set(31, -11.04, -20 - index * 9);
    coast.add(plank);
  }
  const promenadeMetal = new THREE.MeshStandardMaterial({ color: 0x8b7754, metalness: 0.58, roughness: 0.42, emissive: 0x392913, emissiveIntensity: 0.28 });
  const promenadeGlow = new THREE.MeshBasicMaterial({ color: 0xffcb70, toneMapped: false });
  for (let index = 0; index < 15; index++) {
    const z = -18 - index * 12;
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.05, 0.1), promenadeMetal);
    post.position.set(17.1, -10.68, z);
    coast.add(post);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), promenadeGlow);
    cap.position.set(17.1, -10.1, z);
    coast.add(cap);
  }
  for (const y of [-10.45, -10.05]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 175), promenadeMetal);
    rail.position.set(17.1, y, -102);
    coast.add(rail);
  }
  for (let index = 0; index < 4; index++) {
    const lamp = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 6, 8), promenadeMetal);
    pole.position.y = -8.2;
    lamp.add(pole);
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.34, 10, 8), promenadeGlow);
    glow.position.set(0, -5.2, 0);
    lamp.add(glow);
    const light = new THREE.PointLight(0xffbf62, 12, 24, 1.6);
    light.position.copy(glow.position);
    lamp.add(light);
    lamp.position.set(22 + index * 10, 0, -25 - index * 35);
    coast.add(lamp);
  }
  for (let index = 0; index < 10; index++) {
    const palm = createPalm();
    palm.position.set(25 + (index % 5) * 12, -11.02, -15 - Math.floor(index / 5) * 38);
    palm.scale.setScalar(index < 5 ? 1.55 : 1.32);
    coast.add(palm);
  }
  const titleCar = createVehicle(0);
  titleCar.userData.paintMaterial.roughness = 0.16; titleCar.userData.paintMaterial.metalness = 0.66; titleCar.userData.paintMaterial.clearcoat = 1; titleCar.userData.paintMaterial.clearcoatRoughness = 0.06; titleCar.userData.paintMaterial.envMapIntensity = 2;
  titleCar.position.set(16, -11.38, -28);
  titleCar.rotation.y = 0.38;
  titleCar.scale.setScalar(1.5);
  coast.add(titleCar);
  const umbrellaColors = [0xf45d58,0xffd052,0x2cb6ad,0xf1f4e8].map((color) => new THREE.MeshStandardMaterial({ color, roughness: 0.8 }));
  for (let index = 0; index < 12; index++) {
    const x = 23 + (index % 3) * 8; const z = -28 - Math.floor(index / 3) * 35;
    const canopy = new THREE.Mesh(new THREE.ConeGeometry(2.4, 0.55, 12), umbrellaColors[index % umbrellaColors.length]); canopy.position.set(x, -10.62, z); coast.add(canopy);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.55, 6), new THREE.MeshStandardMaterial({ color: 0xf7e5c2 })); stem.position.set(x, -11.45, z); coast.add(stem);
  }
  const bridge = new THREE.Group();
  bridge.position.set(69, -8.7, -182);
  coast.add(bridge);
  const bridgeMaterial = new THREE.MeshStandardMaterial({ color: 0xe9dcae, metalness: 0.55, roughness: 0.33, emissive: 0xffc45c, emissiveIntensity: 0.42 });
  const bridgeDeck = new THREE.Mesh(new THREE.BoxGeometry(93, 0.55, 3.2), new THREE.MeshStandardMaterial({ color: 0x566169, metalness: 0.55, roughness: 0.4 }));
  bridgeDeck.position.set(43, 0, 0);
  bridge.add(bridgeDeck);
  for (const x of [10, 76]) {
    const tower = new THREE.Mesh(new THREE.BoxGeometry(1.2, 25, 1.6), bridgeMaterial);
    tower.position.set(x, 12.5, 0);
    bridge.add(tower);
  }
  const cable = new THREE.CatmullRomCurve3([new THREE.Vector3(10, 25, 0), new THREE.Vector3(28, 15, 0), new THREE.Vector3(43, 13, 0), new THREE.Vector3(60, 15, 0), new THREE.Vector3(76, 25, 0)]);
  bridge.add(new THREE.Mesh(new THREE.TubeGeometry(cable, 40, 0.16, 8, false), bridgeMaterial));
  for (let x = 14; x <= 72; x += 5) {
    const height = 13 + Math.abs(x - 43) * 0.38;
    const hanger = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, height, 5), bridgeMaterial);
    hanger.position.set(x, height / 2, 0);
    bridge.add(hanger);
  }
  const farShore = new THREE.Mesh(new THREE.BoxGeometry(40, 2, 35), new THREE.MeshStandardMaterial({ color: 0x597b60, roughness: 1 }));
  farShore.position.set(126, -10, -182);
  coast.add(farShore);
  const farTown = new THREE.Mesh(new THREE.BoxGeometry(7, 18, 9), new THREE.MeshStandardMaterial({ color: 0xe7d5ba, roughness: 0.75 }));
  farTown.position.set(126, 0, -182);
  coast.add(farTown);
  const skylineMaterials = [0xded8c8, 0xc9d7d4, 0xe7cda7].map((color) => new THREE.MeshStandardMaterial({ color, roughness: 0.68, metalness: 0.12 }));
  const skylineWindow = new THREE.MeshBasicMaterial({ color: 0xffd98b, toneMapped: false });
  for (let index = 0; index < 6; index++) {
    const x = 128 + index * 8;
    const z = -198 - (index % 3) * 6;
    const height = 14 + (index * 7) % 15;
    const width = 7 + (index % 2) * 2;
    const building = new THREE.Mesh(new THREE.BoxGeometry(width, height, 8), skylineMaterials[index % skylineMaterials.length]);
    building.position.set(x, -11 + height / 2, z);
    coast.add(building);
    for (let floor = 0; floor < Math.floor(height / 4); floor++) {
      const window = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.8, 0.08), skylineWindow);
      window.position.set(x - width * 0.24 + (floor % 3) * width * 0.24, -9.5 + floor * 3.4, z + 4.08);
      coast.add(window);
    }
  }
  const bayGleam = new THREE.MeshBasicMaterial({ color: 0xffd17b, transparent: true, opacity: 0.82, toneMapped: false });
  for (let index = 0; index < 6; index++) {
    const glint = new THREE.Mesh(new THREE.PlaneGeometry(14 + (index % 3) * 7, 0.42), bayGleam);
    glint.rotation.x = -Math.PI / 2;
    glint.position.set(84 + index * 7, -11.32, -82 - index * 15);
    coast.add(glint);
  }
}

function addTracer(scene, start, end, color, radius = 0.045) {
  const a = new THREE.Vector3(...start); const b = new THREE.Vector3(...end); const direction = b.clone().sub(a);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.35, radius, direction.length(), 8), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.96, blending: THREE.AdditiveBlending, depthWrite: false }));
  beam.position.copy(a).add(b).multiplyScalar(0.5); beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize()); scene.add(beam); return beam;
}

function stageDrift(game) {
  const { drive, world, city, pedestrians } = game; const state = drive.state; const car = state.car;
  game.setWeather('sunset');
  const point = city.coastCurve.getPoint(0.53); const tangent = city.coastCurve.getTangent(0.53);
  const roadYaw = Math.atan2(-tangent.z, tangent.x);
  car.position.set(point.x, -0.03, point.z); state.yaw = roadYaw - 0.66; car.rotation.y = state.yaw;
  state.speed = 59.45; state.slip = 0.82; state.combo = 4.8; state.drift = 735; state.handbrake = true;
  car.userData.steer = -0.75;
  for (const wheel of car.userData.wheels) if (wheel.front) wheel.pivot.rotation.y = -0.62;
  world.district = 'SUNSET COAST';
  const forward=new THREE.Vector3(Math.cos(state.yaw),0,-Math.sin(state.yaw)); const side=new THREE.Vector3(Math.sin(state.yaw),0,Math.cos(state.yaw));
  setCamera(game, [car.position.x - Math.cos(state.yaw) * 9.8 - Math.sin(state.yaw) * 3.3, 5.0, car.position.z + Math.sin(state.yaw) * 9.8 - Math.cos(state.yaw) * 3.3], [car.position.x + forward.x * 4.5, 1.1, car.position.z + forward.z * 4.5], 68);
  addCameraClouds(game.camera, game.scene);
  city.root.visible = false;
  for (const vehicle of [...city.traffic, ...city.police]) game.scene.attach(vehicle);
  game.scene.attach(city.helicopter);
  game.scene.attach(city.ferrisWheel);
  city.traffic.forEach((vehicle) => { vehicle.visible = false; });
  addBoulevardBackdrop(game);
  game.scene.fog = new THREE.FogExp2(0xf2e4cc, 0.0024);
  game.sky.dome.material.uniforms.zenithColor.value.set('#2f8ed4');
  game.sky.dome.material.uniforms.middleColor.value.set('#85cef5');
  game.sky.dome.material.uniforms.horizonColor.value.set('#ffe6b8');
  for(let i=0;i<5;i++)for(const sign of [-1,1]){const palm=createPalm();palm.position.copy(car.position).addScaledVector(forward,(i-2)*17).addScaledVector(side,sign*22);palm.scale.setScalar(.95);game.scene.add(palm);}
  pedestrians.list.forEach((person) => { person.visible = false; });
  pedestrians.list.slice(0, 26).forEach((person, index) => {
    const row = index % 13;
    const side = -1;
    game.shotAvenue.add(person);
    person.position.set(index < 13 ? -22.5 : -18.1, -4.78, -22 - row * 10.5);
    person.rotation.y = index < 13 ? Math.PI / 2 : -Math.PI / 2;
    person.visible = true;
  });
  const foregroundTraffic = [[-9,-30],[9,-61],[-11,-94],[11,-129],[3,-169]];
  city.traffic.slice(0, 5).forEach((vehicle, index) => {
    const [x, z] = foregroundTraffic[index];
    game.shotAvenue.add(vehicle);
    vehicle.position.set(x, -5.13, z);
    vehicle.rotation.set(0, index % 2 ? 0.12 : -0.12, 0);
    vehicle.userData.stagedShot = true;
    vehicle.visible = true;
  });
  state.freezeEffects = true;
  if (city.ferrisWheel) { city.ferrisWheel.position.set(3, -5, -242); city.ferrisWheel.quaternion.identity(); city.ferrisWheel.scale.setScalar(1.12); }
  const rear = car.position.clone().addScaledVector(forward, -2.05);
  // Bold paired, curved skid trails taper away behind the car.
  for (let i = 0; i < 26; i++) for (const wheelSide of [-1, 1]) {
    const t = i / 26; const mark = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.85), new THREE.MeshBasicMaterial({ color: 0x080b0d, transparent: true, opacity: 0.72, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    mark.rotation.set(-Math.PI / 2, 0, -state.yaw); mark.position.copy(rear).addScaledVector(forward, -t * 0.95).addScaledVector(side, wheelSide * 0.72 + Math.sin(t * 8) * 0.26); mark.position.y = 0.06; game.scene.add(mark);
  }
  // Each burst originates at a rear contact patch and fans backward/outward in car space.
  // Real drift loads the outside rear tire much harder. Bias the spray toward
  // the outside of the curve and keep a smaller ember scatter on the inside.
  const outsideSide = state.yaw > roadYaw ? 1 : -1;
  const smokeTexture = createSoftSmokeTexture();
  for (const wheelSide of [-1, 1]) {
    const origin = rear.clone().addScaledVector(side, wheelSide * 0.82).add(new THREE.Vector3(0, 0.2, 0));
    const outside = wheelSide === outsideSide;
    for (let i = 0; i < (outside ? 86 : 14); i++) {
      const seed = (i + 1) * (outside ? 19.731 : 37.117) + (outside ? 3 : 11);
      const rand = (n) => { const v = Math.sin(seed + n * 78.233) * 43758.5453; return v - Math.floor(v); };
      const fan = rand(1);
      const direction = forward.clone().multiplyScalar(-0.9 - rand(2) * 0.5)
        .addScaledVector(side, outsideSide * (0.48 + fan * (outside ? 1.2 : 0.45)))
        .add(new THREE.Vector3(0, 0.08 + rand(3) * 0.76, 0)).normalize();
      const length = 0.4 + rand(4) * 2.2;
      const start = origin.clone().addScaledVector(direction, rand(5) * 0.5);
      const streak = new THREE.Mesh(new THREE.CylinderGeometry(0.012 + rand(6) * 0.018, 0.025 + rand(7) * 0.035, length, 5), new THREE.MeshBasicMaterial({ color: i % 5 === 0 ? 0xfff7d8 : i % 2 ? 0xffa12b : 0xff5b19, transparent: true, opacity: 0.96, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
      streak.position.copy(start).addScaledVector(direction, length * 0.5); streak.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), direction); game.scene.add(streak);
      if (i % 4 === 0) {
        const core = new THREE.Mesh(new THREE.SphereGeometry(0.045 + rand(8) * 0.035, 7, 6), new THREE.MeshBasicMaterial({ color: 0xfff3cf, blending: THREE.AdditiveBlending, toneMapped: false }));
        core.position.copy(start).addScaledVector(direction, length); game.scene.add(core);
      }
    }
    // Soft, layered tire smoke trails follow the same asymmetric drift arc.
    for (let i = 0; i < (outside ? 12 : 7); i++) {
      const puffPosition = origin.clone().addScaledVector(forward, -i * 0.62).addScaledVector(side, outsideSide * i * 0.2);
      puffPosition.y += 0.22 + i * 0.09;
      const puff = new THREE.Sprite(new THREE.SpriteMaterial({
        map: smokeTexture, color: 0xffffff, transparent: true,
        opacity: 0.62 - i * 0.02, depthWrite: false, toneMapped: false,
      }));
      puff.position.copy(puffPosition);
      puff.scale.set(2.7 + i * 0.11, 1.55 + i * 0.08, 1);
      game.scene.add(puff);
    }
  }
  for (const [index, civilian] of [city.traffic[0], city.traffic[1]].entries()) {
    civilian.userData.paintMaterial?.color.setHex(index ? 0xb89a65 : 0xd9e2e5);
  }
  // Freeze particles at capture time so the dense fan survives the screenshot pass.
  world.shotMissionId = 'MISSION 01 / LAST LIGHT'; world.shotObjective = 'DRIFT THE COAST BEFORE THE SUN GOES DOWN.';
  for (const marker of game.missionMarkers) marker.visible = false;
  game.camera.updateMatrixWorld(true);
  const look = game.shotCamera.target.clone().sub(game.shotCamera.position).normalize();
  game.sky.dome.material.uniforms.sunDirection.value.set(-look.z, 0.16, look.x).normalize();
  const right = new THREE.Vector3(-look.z, 0, look.x).normalize();
  const sunGlow = new THREE.Mesh(new THREE.SphereGeometry(13, 24, 16), new THREE.MeshBasicMaterial({ color: 0xff8746, transparent: true, opacity: 0.26, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  sunGlow.position.set(56, 13, -122); game.camera.add(sunGlow);
  const sun = new THREE.Mesh(new THREE.SphereGeometry(7.5, 24, 16), new THREE.MeshBasicMaterial({ color: 0xffdd9b, toneMapped: false }));
  sun.position.set(56, 45, -121); game.camera.add(sun);
  const sunsetDisc = document.createElement('div'); sunsetDisc.id = 'shot-sun'; sunsetDisc.setAttribute('aria-hidden', 'true'); document.body.append(sunsetDisc); document.body.classList.add('drift-shot');
  sunGlow.position.set(56, 45, -122);
  state.sparkLight.position.copy(car.position).addScaledVector(forward, -1.7).add(new THREE.Vector3(0, 0.5, 0)); state.sparkLight.intensity = 14;
  const sparkHalo = createGlowSprite(0xff9b36, 0.8); sparkHalo.position.copy(state.sparkLight.position); sparkHalo.scale.set(8, 5, 1); game.scene.add(sparkHalo);
  game.missions.cash = 48250; game.missions.respect = 1420; game.police.wanted = 4;
  game.police.heat = 86;
  const pursuit = [city.police[0], city.police[1]];
  const policePlaces = [[-8,-12],[8,-13],[-7,-31],[7,-35]];
  const pursuitConvoy = [...pursuit, pursuit[0].clone(true), pursuit[1].clone(true)];
  pursuitConvoy.forEach((unit, index) => {
    const [x, z] = policePlaces[index];
    unit.userData.stagedShot = true;
    game.shotAvenue.add(unit);
    unit.visible = true;
    unit.position.set(x, -5.13, z);
    unit.scale.setScalar(index < 2 ? 1.18 : 1.02);
    unit.rotation.set(0, index % 2 === 0 ? -0.22 : 0.22, 0);
    unit.traverse((part) => {
      if (part.isPointLight) { part.intensity = 24; part.distance = 28; }
      if (part.material?.emissive) part.material.emissiveIntensity = Math.max(part.material.emissiveIntensity || 0, 2.2);
    });
  });
  city.helicopter.visible = true; city.helicopter.position.copy(game.camera.localToWorld(new THREE.Vector3(-3.5, 8.6, -34)));
  city.helicopter.scale.setScalar(1.22); city.helicopter.userData.stagedShot = true; city.helicopter.userData.callsign.visible = false;
  city.helicopter.userData.mainRotor.rotation.y = 1.1; city.helicopter.userData.tailRotor.rotation.x = 1.2;
  city.helicopter.userData.search.intensity = 82;
  city.helicopter.userData.cone.material.opacity = 0.32;
  city.helicopter.quaternion.copy(game.camera.quaternion);
  world.shotMissionId = 'MISSION 05 / SUNSET HEIST'; world.shotObjective = 'CONDOR-1 IS LOCKED ON. KICK IT SIDEWAYS THROUGH THE SUNSET HAIRPIN.';
  world.shotRadio = 'MARA SOL • FIELD OPERATOR — Condor-1 is locked on! Kick it sideways through the Sunset hairpin and break line of sight!';
}

function stageChase(game) {
  const { drive, world, police, city } = game; const car = drive.state.car;
  game.setWeather('wet-night'); world.district = 'NEON DOWNTOWN';
  car.position.set(250, 0.12, 155); drive.state.yaw = 0.08; drive.state.speed = 64; drive.state.slip = 0.34; car.rotation.y = drive.state.yaw;
  const blueSweep = new THREE.PointLight(0x2878ff, 22, 24, 1.5); blueSweep.position.set(-0.3, 1.9, -1.9); car.add(blueSweep);
  const redSweep = new THREE.PointLight(0xff2445, 22, 24, 1.5); redSweep.position.set(-0.3, 1.9, 1.9); car.add(redSweep);
  world.shotMissionId = 'MISSION 04 / NEON LOCKDOWN'; world.shotObjective = 'BREAK THE SBPD ROADBLOCK AND GET OUT OF DOWNTOWN.';
  police.heat = 100; police.wanted = 5; police.phase = Math.PI / 2; game.cameraMode = 'chase';
  city.roadblock.position.set(car.position.x + 24, 0, car.position.z);
  for (let i = 0; i < 12; i++) police.step(1 / 60, car.position, false);
  city.swat.visible = true; city.swat.position.set(277, 0.12, 159);
  for (let i = 0; i < city.police.length; i++) {
    const patrol = city.police[i]; patrol.visible = true;
    patrol.position.set([242, 258, 271, 276][i], 0.12, [145, 164, 143, 167][i]); patrol.rotation.y = i % 2 ? -0.12 : 0.18;
  }
  city.helicopter.visible = true; city.helicopter.position.set(270, 22, 157); city.helicopter.rotation.y = 3.04;
  city.helicopter.userData.stagedShot = true;
  city.helicopter.userData.callsign.visible = false;
  city.helicopter.userData.mainRotor.rotation.y = 0.7; city.helicopter.userData.tailRotor.rotation.x = 0.9;
  city.helicopter.userData.cone.position.set(0.7, -11, 0); city.helicopter.userData.cone.scale.set(0.38, 0.72, 0.38); city.helicopter.userData.cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0.65, -0.76, 0).normalize());
  city.helicopter.userData.groundPool.position.set(20, -21, 0);
  city.helicopter.userData.target.position.set(20, -21, 0);
  city.helicopter.userData.search.position.set(0.6, -0.5, 0);
  city.helicopter.userData.whiteStrobe.intensity = 18;
  for (const marker of game.missionMarkers) marker.visible = false;
  game.missions.cash = 14800; game.missions.respect = 420;
  setCamera(game, [236, 6.4, 166], [258, 9, 153], 58);
}

function addCombatStorefronts(game) {
  const cameraPosition = game.camera.position;
  const windowMats = [0x18313d, 0x1c2938, 0x27313a].map((color) => new THREE.MeshPhysicalMaterial({
    color, roughness: 0.12, metalness: 0.62, clearcoat: 1, clearcoatRoughness: 0.08,
    emissive: 0x18353a, emissiveIntensity: 0.34, transparent: true, opacity: 0.58,
  }));
  const trim = new THREE.MeshStandardMaterial({ color: 0x131d26, metalness: 0.66, roughness: 0.42 });
  const brickTrim = new THREE.MeshStandardMaterial({ color: 0x43505a, metalness: 0.28, roughness: 0.78 });
  const neonColors = [0xff3f9a, 0x43e7f1, 0xffbd58];
  let storefrontIndex = 0;

  game.city.root.traverse((part) => {
    if (!part.isMesh || !part.geometry?.parameters || !part.material?.color) return;
    if (part.material.color.getHex() !== 0xe7d4b8) return;
    const width = part.geometry.parameters.width;
    const height = part.geometry.parameters.height;
    const depth = part.geometry.parameters.depth;
    const buildingPosition = part.position;
    if (Math.hypot(buildingPosition.x - cameraPosition.x, buildingPosition.z - cameraPosition.z) > 95) return;

    part.material = part.material.clone();
    part.material.color.setHex(0x202a33);
    part.material.roughness = 0.9;
    const front = cameraPosition.z >= buildingPosition.z ? 1 : -1;
    const facadeZ = buildingPosition.z + front * (depth / 2 + 0.12);
    const parent = part.parent;
    const windowWidth = Math.max(1.2, width * 0.16);
    const windowHeight = Math.min(3.05, height * 0.58);
    const sill = 0.7;

    const capstone = new THREE.Mesh(new THREE.BoxGeometry(width * 1.02, 0.18, 0.22), brickTrim);
    capstone.position.set(buildingPosition.x, height - 0.18, facadeZ);
    parent.add(capstone);

    const bayCount = width > 15 ? 4 : 3;
    for (let bay = 0; bay < bayCount; bay++) {
      const x = buildingPosition.x - width * 0.36 + bay * (width * 0.72 / Math.max(1, bayCount - 1));
      const frame = new THREE.Mesh(new THREE.BoxGeometry(windowWidth + 0.36, windowHeight + 0.4, 0.16), trim);
      frame.position.set(x, sill + windowHeight / 2, facadeZ + front * 0.12);
      parent.add(frame);

      const glass = new THREE.Mesh(new THREE.BoxGeometry(windowWidth, windowHeight, 0.1), windowMats[(storefrontIndex + bay) % windowMats.length]);
      glass.position.set(x, sill + windowHeight / 2, facadeZ + front * 0.22);
      parent.add(glass);

      const interior = new THREE.Mesh(new THREE.BoxGeometry(windowWidth * 0.78, windowHeight * 0.68, 0.06), new THREE.MeshBasicMaterial({
        color: [0xffb56a, 0xffd49a, 0xeda56e][(storefrontIndex + bay) % 3], transparent: true, opacity: 0.78, toneMapped: false,
      }));
      interior.position.set(x, sill + windowHeight * 0.54, facadeZ + front * 0.31); parent.add(interior);
      const interiorLamp = new THREE.PointLight([0xffae64, 0xffd28b, 0xff9860][(storefrontIndex + bay) % 3], 3.2, 8, 1.8);
      interiorLamp.position.set(x, sill + windowHeight * 0.72, facadeZ + front * 1.1); parent.add(interiorLamp);
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(windowWidth * 0.82, 0.11, 0.18), brickTrim);
      shelf.position.set(x, sill + windowHeight * 0.36, facadeZ + front * 0.34); parent.add(shelf);
      for (const personOffset of [-0.22, 0.18]) {
        const silhouette = new THREE.Group();
        const coat = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.38, 3, 6), new THREE.MeshStandardMaterial({ color: 0x17202a, roughness: 0.92 }));
        coat.position.y = 0.32; silhouette.add(coat);
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), new THREE.MeshStandardMaterial({ color: 0x382b27, roughness: 0.8 })); head.position.y = 0.65; silhouette.add(head);
        silhouette.position.set(x + personOffset * windowWidth, sill + 0.22, facadeZ + front * 0.38); parent.add(silhouette);
      }
      const awning = new THREE.Mesh(new THREE.BoxGeometry(windowWidth + 0.25, 0.15, 1.2), trim);
      awning.position.set(x, sill + windowHeight + 0.42, facadeZ + front * 0.6); parent.add(awning);
      for (let stripe = 0; stripe < 5; stripe++) {
        const valance = new THREE.Mesh(new THREE.BoxGeometry((windowWidth + 0.25) / 5, 0.24, 0.08), new THREE.MeshBasicMaterial({ color: stripe % 2 ? 0xe4d2b4 : neonColors[(storefrontIndex + bay) % neonColors.length], toneMapped: false }));
        valance.position.set(x - (windowWidth + 0.25) / 2 + ((windowWidth + 0.25) / 10) + stripe * (windowWidth + 0.25) / 5, sill + windowHeight + 0.23, facadeZ + front * 1.16); parent.add(valance);
      }

      const shutter = new THREE.Mesh(new THREE.BoxGeometry(windowWidth + 0.24, 0.62, 0.14), trim);
      shutter.position.set(x, 0.38, facadeZ + front * 0.2);
      parent.add(shutter);
      for (let slat = 0; slat < 4; slat++) {
        const line = new THREE.Mesh(new THREE.BoxGeometry(windowWidth + 0.14, 0.035, 0.04), brickTrim);
        line.position.set(x, 0.17 + slat * 0.14, facadeZ + front * 0.28);
        parent.add(line);
      }
    }

    if (storefrontIndex % 2 === 0) {
      const labels = ['BAR', 'CLUB', '24H', 'HOTEL CORAL', 'CLUB SOLARA'];
      const label = labels[(storefrontIndex / 2) % labels.length | 0]; const color = neonColors[storefrontIndex % neonColors.length];
      const signCanvas = document.createElement('canvas'); signCanvas.width = 512; signCanvas.height = 160;
      const signContext = signCanvas.getContext('2d'); signContext.fillStyle = '#111821'; signContext.fillRect(0, 0, 512, 160);
      signContext.strokeStyle = `#${color.toString(16).padStart(6, '0')}`; signContext.lineWidth = 8; signContext.strokeRect(5, 5, 502, 150);
      signContext.font = '900 64px Chakra, Arial'; signContext.textAlign = 'center'; signContext.textBaseline = 'middle'; signContext.shadowColor = `#${color.toString(16).padStart(6, '0')}`; signContext.shadowBlur = 22; signContext.fillStyle = '#fff5e5'; signContext.fillText(label, 256, 80);
      const signMap = new THREE.CanvasTexture(signCanvas); signMap.colorSpace = THREE.SRGBColorSpace;
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(8, width * 0.62), 1.7), new THREE.MeshBasicMaterial({ map: signMap, toneMapped: false }));
      sign.position.set(buildingPosition.x, 5.3, facadeZ + front * 0.46); parent.add(sign);
      const lamp = createGlowSprite(color, 0.48); lamp.position.set(buildingPosition.x, 6.4, facadeZ + front * 0.7); lamp.scale.set(5.2, 5.2, 1); parent.add(lamp);
      const signLight = new THREE.PointLight(color, 2.6, 18, 1.7); signLight.position.set(buildingPosition.x, 5.2, facadeZ + front * 2.4); parent.add(signLight);
    }
    storefrontIndex++;
  });
}

function stageCombat(game) {
  const { drive, world, combat, player, city } = game; const car = drive.state.car;
  game.setWeather('midnight'); world.district = 'NEON DOWNTOWN'; world.shotMissionId = 'MISSION 06 / DOCKSIDE SYNDICATE'; world.shotObjective = 'CLEAR THE NEON AVENUE. KEEP THE BAY CLUB IN SIGHT.';
  game.scene.fog = new THREE.FogExp2(0x11172f, 0.00125);
  game.sky.dome.material.uniforms.zenithColor.value.set('#050a1e');
  game.sky.dome.material.uniforms.middleColor.value.set('#121c44');
  game.sky.dome.material.uniforms.horizonColor.value.set('#2a1e48');
  world.shotRadio = 'NIKO VALE • DRIVER — Mara, I have four ahead. I’m moving through the crossfire.';
  car.position.set(238, 0.12, 157); car.rotation.y = Math.PI * 0.78;
  if (drive.state.active) drive.enterExit();
  player.position.set(237, 0, 159); player.rotation.y = -0.12; player.visible = true;
  combat.wheel = true; combat.weapon = 4; combat.ammo = 24; combat.ammoByWeapon[3] = 24;
  combat.reserve[3] = 120;
  const healthBars = [];
  combat.flash = 0.08; combat.enemies.slice(0, 4).forEach((enemy, i) => {
    enemy.visible = true; enemy.userData.alive = true; enemy.userData.health = 55 + i * 10;
    enemy.position.set(259 + i * 2.2, 0, 145 + (i % 2) * 9); enemy.rotation.y = Math.PI;
    const bar = new THREE.Group();
    const back = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.17), new THREE.MeshBasicMaterial({ color: 0x15191c, side: THREE.DoubleSide })); back.position.y = 2.28; bar.add(back);
    const fill = new THREE.Mesh(new THREE.PlaneGeometry(1.28, 0.1), new THREE.MeshBasicMaterial({ color: 0xff384e, side: THREE.DoubleSide })); fill.position.set(-0.05, 2.28, 0.012); bar.add(fill);
    bar.position.copy(enemy.position); game.scene.add(bar); healthBars.push(bar);
  });
  game.healthBars = healthBars;
  for (const enemy of combat.enemies.slice(4)) enemy.visible = false;
  const hitCanvas=document.createElement('canvas');hitCanvas.width=320;hitCanvas.height=100;const hitCtx=hitCanvas.getContext('2d');hitCtx.font='900 54px Chakra,Arial';hitCtx.textAlign='center';hitCtx.fillStyle='#ffe193';hitCtx.shadowColor='#ff9b32';hitCtx.shadowBlur=18;hitCtx.fillText('HEAD 85',160,64);
  const hitSprite=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(hitCanvas),transparent:true,depthWrite:false,toneMapped:false}));hitSprite.position.set(260.2,3.25,145);hitSprite.scale.set(3.3,1.05,1);game.scene.add(hitSprite);
  for (const [label, x, z, color] of [['42!', 264, 3.7, '#ff8b55'], ['38', 257.2, 4.05, '#ffe17b']]) {
    const canvas = document.createElement('canvas'); canvas.width = 220; canvas.height = 90;
    const context = canvas.getContext('2d'); context.font = '900 58px Chakra,Arial'; context.textAlign = 'center'; context.textBaseline = 'middle';
    context.lineWidth = 9; context.strokeStyle = '#17131b'; context.shadowColor = color; context.shadowBlur = 20; context.fillStyle = color;
    context.strokeText(label, 110, 48); context.fillText(label, 110, 48);
    const popup = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, depthWrite: false, toneMapped: false }));
    popup.position.set(x, z, 143 + (label === '42!' ? 7 : -4)); popup.scale.set(2.2, 0.9, 1); game.scene.add(popup);
  }
  const damageLayer = document.createElement('div'); damageLayer.className = 'combat-damage-layer'; damageLayer.setAttribute('aria-hidden', 'true');
  damageLayer.innerHTML = '<b class="damage-pop damage-mid">42!</b><b class="damage-pop damage-right">38</b>'; document.body.append(damageLayer);
  for (const marker of game.missionMarkers) marker.visible = false;
  game.missions.cash = 14800; game.missions.respect = 420; game.police.wanted = 3;
  game.police.heat = 58;
  // Muzzle starburst, barrel light and tracers cross the downtown avenue.
  const muzzle = new THREE.Group(); muzzle.position.set(239, 1.4, 158); game.scene.add(muzzle);
  for (let i = 0; i < 8; i++) { const ray = new THREE.Mesh(new THREE.ConeGeometry(i % 2 ? 0.12 : 0.2, i % 2 ? 0.8 : 0.48, 4), new THREE.MeshBasicMaterial({ color: i % 2 ? 0xffb33b : 0xffefad, blending: THREE.AdditiveBlending, depthWrite: false })); ray.rotation.z = i * Math.PI / 4; ray.rotation.x = Math.PI / 2; ray.position.z = -0.28; muzzle.add(ray); }
  const muzzleLight = new THREE.PointLight(0xffa637, 32, 14); muzzle.add(muzzleLight);
  addTracer(game.scene, [239,1.45,158], [260,1.8,143], 0xffd36d, 0.05);
  addTracer(game.scene, [239,1.55,158], [265,1.55,153], 0xfff0b3, 0.045);
  addTracer(game.scene, [239,1.35,158], [261,1.2,163], 0xff9b37, 0.055);
  const impact = new THREE.PointLight(0xff832d, 18, 9); impact.position.set(261, 2.6, 153); game.scene.add(impact);
  const impactSpark = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 1), new THREE.MeshBasicMaterial({ color: 0xffb052, wireframe: true })); impactSpark.position.copy(impact.position); game.scene.add(impactSpark);
  // A layered fireball gives the blockade impact a readable focal point at screenshot scale.
  const fireball = new THREE.Group();
  fireball.position.set(261, 2.8, 153);
  game.scene.add(fireball);
  const fireLayers = [
    { radius: 2.25, color: 0xff4d16, opacity: 0.34 },
    { radius: 1.62, color: 0xff8a22, opacity: 0.56 },
    { radius: 1.05, color: 0xffd44f, opacity: 0.78 },
    { radius: 0.52, color: 0xfff0bb, opacity: 0.96 },
  ];
  for (const layer of fireLayers) {
    const flame = new THREE.Mesh(
      new THREE.SphereGeometry(layer.radius, 18, 14),
      new THREE.MeshBasicMaterial({
        color: layer.color,
        transparent: true,
        opacity: layer.opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    flame.scale.set(1, 1.16, 0.72);
    fireball.add(flame);
  }
  for (let index = 0; index < 7; index++) {
    const smoke = new THREE.Mesh(
      new THREE.SphereGeometry(0.78 + index % 3 * 0.18, 12, 9),
      new THREE.MeshBasicMaterial({ color: 0x3a3030, transparent: true, opacity: 0.28, depthWrite: false }),
    );
    smoke.position.set(Math.sin(index * 2.3) * 1.55, 1.7 + index * 0.48, Math.cos(index * 1.8) * 0.7);
    smoke.scale.set(1.15, 1.35, 0.92);
    fireball.add(smoke);
  }
  const fireGlow = createGlowSprite(0xff7620, 0.92);
  fireGlow.position.copy(fireball.position);
  fireGlow.scale.set(12, 10, 1);
  game.scene.add(fireGlow);
  impact.intensity = 34;
  document.body.classList.add('combat-shot');
  setCamera(game, [230, 3.6, 164], [259, 1.75, 153], 48);
  addCombatStorefronts(game);
  city.roadblock.visible = true;
  city.roadblock.position.set(269, 0, 154);
  city.roadblock.rotation.y = 0.12;
  city.police.slice(0, 2).forEach((unit, index) => {
    unit.userData.stagedShot = true;
    unit.visible = true;
    unit.position.set(index ? 277 : 267, 0.12, index ? 148 : 160);
    unit.rotation.y = -0.35;
    unit.userData.policePoints.forEach((light) => { light.intensity = 30; });
  });
  city.swat.visible = true;
  city.swat.userData.stagedShot = true;
  city.swat.position.set(273, 0.12, 157);
  city.swat.rotation.y = -0.25;
  const billboardMaterial = new THREE.SpriteMaterial({ transparent: true, toneMapped: false, depthWrite: false });
  for (const [label, color, x, y, z] of [['CLUB SOLARA', '#ff4ca1', -7, 7, -27], ['HOTEL CORAL', '#57eff0', 17, 7, -56]]) {
    const signCanvas = document.createElement('canvas'); signCanvas.width = 512; signCanvas.height = 128;
    const context = signCanvas.getContext('2d'); context.font = '900 48px Chakra, Arial'; context.textAlign = 'center'; context.textBaseline = 'middle'; context.shadowColor = color; context.shadowBlur = 24; context.fillStyle = color; context.fillText(label, 256, 64);
    const texture = new THREE.CanvasTexture(signCanvas); texture.colorSpace = THREE.SRGBColorSpace;
    const sign = new THREE.Sprite(billboardMaterial.clone()); sign.material.map = texture; sign.position.copy(game.camera.localToWorld(new THREE.Vector3(x, y, z))); sign.scale.set(15, 3.8, 1); game.scene.add(sign);
  }
  let reticle = document.getElementById('shot-reticle');
  if (!reticle) { reticle = document.createElement('div'); reticle.id = 'shot-reticle'; reticle.textContent = '⌖'; document.body.append(reticle); }
}

function stageGarage(game) {
  const { drive, world } = game; const car = drive.state.car;
  game.setWeather('garage'); world.district = 'CORAL ISLAND';
  world.shotMissionId = 'PAY N TUNE / SOLARIS BAY MAP'; world.shotObjective = 'YOUR BAY. YOUR BUILD. YOUR WAY OUT.';
  game.city.root.visible = false;
  car.position.set(607, 0.42, 143); car.rotation.y = 0.18; game.paint(0x22d3ee, false);
  game.scene.background.set(0x111d2b);
  game.scene.fog = new THREE.FogExp2(0x111d2b, 0.008);
  game.sky.dome.visible = false;
  game.sky.stars.visible = false;
  game.sky.rain.visible = false;
  const turntable = new THREE.Mesh(new THREE.CylinderGeometry(7.2, 7.2, 0.18, 64), new THREE.MeshStandardMaterial({ color: 0x243846, metalness: 0.68, roughness: 0.28, emissive: 0x06242d, emissiveIntensity: 0.45 }));
  turntable.position.set(607, 0.02, 143);
  game.scene.add(turntable);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.1, 10, 72), new THREE.MeshBasicMaterial({ color: 0x22d3ee, emissive: 0x22d3ee, toneMapped: false }));
  ring.rotation.x = Math.PI / 2;
  ring.position.set(607, 0.21, 143);
  game.scene.add(ring);
  const keyLight = new THREE.PointLight(0xeafaff, 105, 45, 1.3); keyLight.position.set(602, 9, 137); game.scene.add(keyLight);
  const fillLight = new THREE.PointLight(0xffe2b0, 75, 38, 1.4); fillLight.position.set(613, 5, 150); game.scene.add(fillLight);
  const rimLight = new THREE.PointLight(0x28ddf1, 86, 35, 1.4); rimLight.position.set(603, 3, 150); game.scene.add(rimLight);
  for (const marker of game.missionMarkers) marker.visible = false;
  game.cameraMode = 'garage'; document.body.classList.add('garage-shot'); game.showPanel('garage');
  setCamera(game, [617, 7.2, 150], [607, 3.9, 143], 39);
}

function stageTitle(game) {
  game.setWeather('golden'); game.hud.hide(); game.cameraMode = 'title';
  game.city.root.visible = false;
  game.missions.cash = 24850; game.missions.respect = 420;
  game.showPanel('title'); document.body.classList.add('title-shot');
  game.world.shotMissionId = ''; game.world.shotObjective = ''; game.world.shotRadio = '';
  game.setWeather('golden');
  game.camera.position.set(-500, 21, -365);
  game.camera.lookAt(-158, 20, -350);
  game.camera.fov = 54;
  game.camera.updateProjectionMatrix();
  game.shotCamera = { position: game.camera.position.clone(), target: new THREE.Vector3(-170, 17, -350), fov: 54 };
  game.camera.updateMatrixWorld(true);
  addTitleCoast(game);
}

/** Place deterministic camera, lighting and gameplay beats for the four evidence shots. */
export function stageShot(name, game) {
  game.start({ silent: true });
  if (name === 'drift') stageDrift(game);
  else if (name === 'chase') stageChase(game);
  else if (name === 'combat') stageCombat(game);
  else if (name === 'garage') stageGarage(game);
  else if (name === 'title') stageTitle(game);
  const radarLabel = document.querySelector('.radar-label');
  if (radarLabel && name === 'drift') radarLabel.innerHTML = '<b>SUNSET COAST</b>AVENIDA DEL SOL';
  if (radarLabel && name === 'combat') radarLabel.innerHTML = '<b>NEON DOWNTOWN</b>CALLE MANGO';
  game.hud.update(game.hudState());
}
