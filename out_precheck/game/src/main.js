import * as THREE from '../vendor/three.module.min.js';
import { createRandom } from './random.js';
import { createInput } from './input.js';
import { createSky, updateSky } from './world/sky.js';
import { createCity } from './world/city.js';
import { createVehicle, updateVehicle } from './models/vehicles.js';
import { createCharacter, animateCharacter } from './models/characters.js';
import { createDriving } from './systems/driving.js';
import { updateTraffic } from './systems/traffic.js';
import { createPedestrians } from './systems/pedestrians.js';
import { createPolice } from './systems/police.js';
import { createCombat } from './systems/combat.js';
import { createMissions } from './systems/missions.js';
import { createGarage } from './systems/garage.js';
import { loadSave, saveGame } from './systems/save.js';
import { createAudio } from './systems/audio.js';
import { createHud } from './ui/hud.js';
import { renderWeaponWheel } from './ui/weaponWheel.js';
import { showPanel } from './ui/menu.js';
import { stageShot } from './shots.js';
import { createReflectionEnvironments } from './world/textures.js';

const params = new URLSearchParams(location.search);
const seed = Number(params.get('seed') || 1);
const random = createRandom(seed);
const canvas = document.querySelector('#view');
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
const reflectionEnvironments = createReflectionEnvironments(renderer);

const scene = new THREE.Scene();
scene.environment = reflectionEnvironments.coast;
scene.background = new THREE.Color(0xeaa271);
scene.fog = new THREE.FogExp2(0x9b7682, 0.0015);
const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 2400);
const sky = createSky(scene, seed);
const city = createCity(scene, seed);
let hero = createVehicle(0);
hero.position.set(-180, 0.1, -325);
hero.rotation.y = 0.32;
scene.add(hero);

const headLamp = new THREE.SpotLight(0xffdda3, 35, 75, Math.PI / 5, 0.55, 1.2);
const headTarget = new THREE.Object3D();
scene.add(headLamp, headTarget);
headLamp.target = headTarget;

const drive = createDriving(scene, hero, seed + 13);
const player = createCharacter('protagonist', seed);
player.position.copy(hero.position);
player.visible = false;
scene.add(player);
const pedestrians = createPedestrians(scene, random, 34, city.coastCurve);
const police = createPolice(city);
const combat = createCombat(scene, random);
const missions = createMissions();
const audio = createAudio();
const input = createInput();
const hud = createHud();
const stored = loadSave();

if (stored) {
  missions.cash = stored.cash ?? missions.cash;
  missions.respect = stored.respect ?? 0;
  missions.completed = Array.isArray(stored.completed) ? stored.completed : [];
  missions.index = Math.min(missions.completed.length, 7);
}

let mode = 'title';
let cameraMode = 'drive';
let elapsed = 0;
let last = performance.now();
let fieldOfView = 58;
let weather = 'sunset';
let radio = 'SUNSET SYNTH';
const world = { district: 'SUNSET COAST' };
const missionTargets = [
  [-115, -340], [-240, -310], [325, 315], [100, 40], [470, 120],
  [680, 220], [330, 280], [-115, -340],
];
const missionMarkers = missionTargets.map(([x, z]) => {
  const marker = new THREE.Group();
  const core = new THREE.Mesh(
    new THREE.OctahedronGeometry(1.15, 0),
    new THREE.MeshBasicMaterial({ color: 0x67edf0, transparent: true, opacity: 0.9 }),
  );
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2.1, 0.07, 6, 32),
    new THREE.MeshBasicMaterial({ color: 0xffc36e, transparent: true, opacity: 0.82 }),
  );
  ring.rotation.x = Math.PI / 2;
  core.position.y = 3.2;
  marker.add(core, ring);
  marker.position.set(x, 0, z);
  scene.add(marker);
  return marker;
});
const game = {
  drive,
  player,
  combat,
  missions,
  police,
  hud,
  world,
  map: missions.map,
  start(options = {}) {
    if (!options.silent) audio.start();
    game.shotCamera = null; document.body.classList.remove('title-shot');
    mode = 'play';
    showPanel(null, game);
    hud.show();
  },
  resume() {
    game.shotCamera = null;
    mode = 'play';
    showPanel(null, game);
    hud.show();
  },
  paint(color, charge = true) {
    if (charge && missions.cash < 450) return false;
    if (charge) missions.cash -= 450;
    if (hero.userData.paintMaterial) hero.userData.paintMaterial.color.setHex(color);
    game.garage.respray(color);
    hud.update(hudState());
    return true;
  },
  upgrade() {
    if (missions.cash < 3500 || game.garage.upgrade >= 3) return false;
    missions.cash -= 3500;
    game.garage.upgradeCar();
    hero.userData.upgrades = { ...(hero.userData.upgrades || {}), drift: game.garage.upgrade };
    hud.update(hudState());
    return true;
  },
  turbo() {
    if (game.garage.turbo || missions.cash < 6000) return false;
    missions.cash -= 6000;
    game.garage.installTurbo();
    hero.userData.upgrades = { ...(hero.userData.upgrades || {}), turbo: true };
    hud.update(hudState());
    return true;
  },
  repair() {
    if (missions.cash < 750) return false;
    missions.cash -= 750;
    drive.state.damage = 0;
    combat.health = 100;
    combat.armor = 100;
    game.save();
    hud.update(hudState());
    return true;
  },
  save() {
    const data = {
      cash: missions.cash,
      respect: missions.respect,
      completed: missions.completed,
      weapons: combat.unlockedWeapons,
      paint: game.garage.paint,
      upgrade: game.garage.upgrade,
      turbo: game.garage.turbo,
      position: drive.state.car.position.toArray(),
      time: elapsed,
    };
    return saveGame(data);
  },
  load() {
    const data = loadSave();
    if (!data) return false;
    missions.cash = data.cash ?? missions.cash;
    missions.respect = data.respect ?? missions.respect;
    missions.completed = Array.isArray(data.completed) ? data.completed : [];
    missions.index = Math.min(missions.completed.length, 7);
    if (Array.isArray(data.position)) drive.state.car.position.fromArray(data.position);
    if (data.paint) game.paint(data.paint, false);
    if (data.upgrade) game.garage.upgrade = data.upgrade;
    game.garage.turbo = Boolean(data.turbo);
    hud.update(hudState());
    return true;
  },
  nextMission() {
    missions.advance();
    game.resume();
  },
  setWeather(mode) {
    weather = mode;
    scene.environment = mode === 'garage'
      ? reflectionEnvironments.studio
      : mode === 'midnight' || mode === 'wet-night'
        ? reflectionEnvironments.neon
        : reflectionEnvironments.coast;
    if (city.asphalt) {
      const wetRoad = mode === 'midnight' || mode === 'wet-night';
      city.asphalt.roughness = wetRoad ? 0.24 : 0.48;
      city.asphalt.metalness = wetRoad ? 0.32 : 0.16;
    }
    updateSky(sky, 0, weather);
    scene.background.set(mode === 'wet-night' || mode === 'midnight' ? 0x090e1b : mode === 'harbor' ? 0x24243c : 0x8c586c);
    scene.fog.color.set(mode === 'wet-night' ? 0x101a2c : mode === 'midnight' ? 0x090e1b : mode === 'harbor' ? 0x4a4055 : 0x9b7682);
    scene.fog.density = mode === 'wet-night' ? 0.0025 : mode === 'midnight' ? 0.002 : 0.0015;
    scene.traverse((object) => {
      if (object.material?.emissiveMap) object.material.emissiveIntensity = mode === 'wet-night' || mode === 'midnight' ? 1.65 : 1.1;
      if (object.userData?.streetLamp) object.intensity = mode === 'wet-night' || mode === 'midnight' ? 8 : mode === 'sunset' ? 3.8 : 5.5;
    });
    headLamp.intensity = mode === 'sunset' ? 0 : mode === 'garage' ? 12 : 32;
  },
};
game.city = city;
game.scene = scene;
game.sky = sky;
game.pedestrians = pedestrians;
game.missionMarkers = missionMarkers;
window.__SOLARIS_GAME = game;
window.__SOLARIS_INPUT = input;
Object.defineProperty(game, 'mode', { get: () => mode });
game.garage = createGarage(missions, saveGame);
game.showPanel = (type) => showPanel(type, game);
game.camera = camera;
Object.defineProperty(game, 'cameraMode', {
  get: () => cameraMode,
  set: (value) => { cameraMode = value; },
});

if (stored) {
  if (Array.isArray(stored.position)) drive.state.car.position.fromArray(stored.position);
  elapsed = stored.time ?? 0;
  if (Array.isArray(stored.weapons)) combat.unlockedWeapons = stored.weapons;
  if (stored.paint) game.paint(stored.paint, false);
  if (stored.upgrade) game.garage.upgrade = stored.upgrade;
  game.garage.turbo = Boolean(stored.turbo);
}

function hudState() {
  return { drive, police, missions, combat, world, mode, city };
}
game.hudState = hudState;
showPanel('title', game);

/** Smooth third-person chase camera with speed-driven wide-angle response. */
function cameraStep(dt) {
  const position = drive.state.car.position;
  const yaw = drive.state.yaw;
  const forward = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
  const right = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
  let desired;
  let target;

  if (drive.state.active) {
    desired = position.clone()
      .addScaledVector(forward, -9.2)
      .add(new THREE.Vector3(0, 4.1 + drive.state.slip * 0.7, 0))
      .addScaledVector(right, -drive.state.slip * 3.1);
    target = position.clone().addScaledVector(forward, 5).add(new THREE.Vector3(0, 1, 0));
  } else {
    desired = player.position.clone().add(new THREE.Vector3(-7, 3.6, 5));
    target = player.position.clone().add(new THREE.Vector3(0, 1.3, 0));
  }

  if (cameraMode === 'garage') {
    desired.set(617, 3.6, 126);
    target.set(610, 1.05, 143);
  } else if (cameraMode === 'chase') {
    const direction = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    desired = position.clone().addScaledVector(direction, -13).add(new THREE.Vector3(0, 6, 0));
    target = position.clone().add(new THREE.Vector3(0, 2, 0));
  }

  if (mode === 'title' && !game.shotCamera) {
    desired.set(-205, 122, -238); target.set(30, 4, -105); fieldOfView = 47;
  } else if (game.shotCamera) {
    camera.position.copy(game.shotCamera.position);
    target.copy(game.shotCamera.target);
    fieldOfView = game.shotCamera.fov;
  } else {
    camera.position.lerp(desired, 1 - Math.exp(-dt * 4));
    fieldOfView = THREE.MathUtils.damp(fieldOfView, 58 + Math.min(18, Math.abs(drive.state.speed) * 0.17 + drive.state.slip * 10), 3.2, dt);
  }
  const targetFov = 58 + Math.min(18, Math.abs(drive.state.speed) * 0.17 + drive.state.slip * 10);
  camera.fov = game.shotCamera ? game.shotCamera.fov : fieldOfView;
  camera.lookAt(target);
  camera.updateProjectionMatrix();

  const front = position.clone().addScaledVector(forward, 2.7);
  headLamp.position.set(front.x, front.y + 1, front.z);
  headTarget.position.set(front.x + forward.x * 30, front.y, front.z + forward.z * 30);
}

function interact() {
  if (drive.state.active) {
    drive.enterExit();
    player.position.copy(hero.position).add(new THREE.Vector3(0, 0, 3.7));
    player.visible = true;
    cameraMode = 'foot';
    return;
  }
  if (player.position.distanceTo(hero.position) < 5) {
    drive.enterExit();
    player.visible = false;
    cameraMode = 'drive';
    return;
  }
  if (hero.position.distanceTo(new THREE.Vector3(610, 0, 145)) < 28) {
    mode = 'menu';
    game.garage.open = true;
    showPanel('garage', game);
  }
}

function carjack() {
  if (drive.state.active) return;
  let nearest = null;
  let range = 6;
  for (const vehicle of city.traffic) {
    const distance = player.position.distanceTo(vehicle.position);
    if (distance < range) { range = distance; nearest = vehicle; }
  }
  if (!nearest) return;
  city.traffic = city.traffic.filter((vehicle) => vehicle !== nearest);
  city.traffic.push(hero);
  scene.remove(hero);
  hero = nearest;
  drive.state.car = hero;
  drive.state.active = true;
  drive.state.speed = 0;
  drive.state.yaw = hero.rotation.y;
  player.visible = false;
  cameraMode = 'drive';
}

function step(dt) {
  elapsed += dt;
  if ((mode === 'menu' || mode === 'pause') && input.hit('Escape')) {
    game.resume();
    return;
  }
  if (mode !== 'play') return;

  world.plateCooldown = Math.max(0, (world.plateCooldown || 0) - dt);
  world.fixCooldown = Math.max(0, (world.fixCooldown || 0) - dt);
  world.interactCooldown = Math.max(0, (world.interactCooldown || 0) - dt);
  if (drive.state.active && input.hit('KeyZ') && world.plateCooldown === 0) {
    drive.state.damage = Math.max(0, drive.state.damage - 34);
    combat.armor = Math.min(100, combat.armor + 32);
    world.plateCooldown = 18;
  }
  if (input.hit('KeyX') && world.fixCooldown === 0) {
    combat.health = Math.min(100, combat.health + 28);
    drive.state.damage = Math.max(0, drive.state.damage - 18);
    world.fixCooldown = 24;
  }

  if (input.hit('KeyE') && world.interactCooldown === 0) { interact(); world.interactCooldown = 0.4; }
  if (input.hit('KeyF')) carjack();
  if (input.hit('KeyM')) {
    mode = 'menu';
    showPanel('map', game);
  }
  if (input.hit('Escape')) {
    mode = 'pause';
    showPanel('pause', game);
  }
  if (input.hit('KeyR')) {
    game.setWeather(weather === 'sunset' ? 'wet-night' : weather === 'wet-night' ? 'midnight' : 'sunset');
  }
  if (input.hit('KeyN')) radio = audio.nextStation();
  window.solRadio = radio;

  let crime = false;
  if (drive.state.active) {
    drive.step(dt, input, world);
    headLamp.intensity = weather === 'sunset' ? 3 : 38;
  } else {
    const speed = input.down('ShiftLeft') ? 12 : 6;
    const forward = Number(input.down('KeyW', 'ArrowUp')) - Number(input.down('KeyS', 'ArrowDown'));
    const side = Number(input.down('KeyD', 'ArrowRight')) - Number(input.down('KeyA', 'ArrowLeft'));
    player.position.x += side * speed * dt;
    player.position.z -= forward * speed * dt;
    animateCharacter(player, elapsed, Boolean(forward || side));
    crime = input.down('Mouse0');
    world.district = player.position.z < -210 ? 'SUNSET COAST'
      : player.position.x > 330 ? 'CORAL ISLAND'
        : player.position.z > 230 ? 'HARBOR DOCKS' : 'NEON DOWNTOWN';
  }

  police.step(dt, drive.state.car.position, crime);
  updateTraffic(city, dt, drive.state.car.position);
  pedestrians.step(dt, elapsed, crime || police.wanted > 0, drive.state.car.position);
  combat.step(dt, input, camera, player.position, !drive.state.active);
  const missionPosition = drive.state.active ? drive.state.car.position : player.position;
  const missionCompleted = missions.step(dt, drive.state.drift, world.district, {
    position: missionPosition,
    speed: drive.state.speed,
    wanted: police.wanted,
    kills: combat.kills,
    health: combat.health,
  });
  missionMarkers.forEach((marker, index) => {
    marker.visible = index === missions.index && !missions.complete;
    marker.rotation.y += dt * 0.7;
    marker.children[0].position.y = 3.2 + Math.sin(elapsed * 2.4) * 0.28;
  });
  if (missionCompleted) {
    mode = 'menu';
    showPanel('result', game);
  }
  if (Math.abs(drive.state.speed) > 4) audio.engine(drive.state.speed);
  audio.update(dt);
  updateSky(sky, dt, weather);
  scene.fog.color.set(weather === 'wet-night' ? 0x101a2c : weather === 'midnight' ? 0x090e1b : 0x9b7682);
  scene.fog.density = weather === 'wet-night' ? 0.0025 : 0.0015;
}

function renderFrame(now) {
  requestAnimationFrame(renderFrame);
  const dt = Math.min(0.04, (now - last) / 1000);
  last = now;
  step(dt);
  cameraStep(dt);
  renderer.render(scene, camera);
  if (mode === 'play') {
    hud.update(hudState());
    renderWeaponWheel(combat);
  }
  input.consume();
}

addEventListener('keydown', (event) => {
  if (mode === 'title' && (event.code === 'Enter' || event.code === 'Space')) {
    event.preventDefault(); game.start();
  }
});

addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});

if (params.has('shot')) {
  mode = 'play';
  showPanel(null, game);
  hud.show();
  stageShot(params.get('shot'), game, seed);
  let renderedFrames = 0;
  const renderShotFrame = () => {
    cameraStep(0);
    for (const bar of game.healthBars || []) bar.lookAt(camera.position);
    if (params.get('shot') === 'chase') {
      city.helicopter.userData.mainRotor.rotation.y += 0.42;
      city.helicopter.userData.tailRotor.rotation.x += 0.55;
      const aviationFlash = Math.sin(performance.now() / 95);
      city.helicopter.userData.beacon.intensity = aviationFlash > 0.2 ? 18 : 1;
      city.helicopter.userData.redLamp.material.emissiveIntensity = aviationFlash > 0.2 ? 7 : 0.4;
      city.helicopter.userData.whiteStrobe.intensity = aviationFlash < -0.45 ? 24 : 0;
      city.helicopter.userData.whiteLamp.material.emissiveIntensity = aviationFlash < -0.45 ? 8 : 0.25;
      const flash = Math.sin(performance.now() / 72);
      city.police.forEach((vehicle, index) => {
        vehicle.userData.policePoints.forEach((light, side) => { light.intensity = Math.max(0, flash * (side ? -1 : 1)) * 30; });
        vehicle.userData.policeLights.forEach((light, side) => { light.material.emissiveIntensity = Math.max(1.2, flash * (side ? -1 : 1) * 2.5 + 2.5); });
      });
    }
    if (params.get('shot') === 'drift') drive.state.sparkLight.intensity = 14;
    renderer.render(scene, camera);
    hud.update(hudState());
    renderWeaponWheel(combat);
    renderedFrames += 1;
    if (renderedFrames >= 2) window.__SOLARIS_SHOT_READY = true;
    requestAnimationFrame(renderShotFrame);
  };
  requestAnimationFrame(renderShotFrame);
} else {
  requestAnimationFrame(renderFrame);
}
