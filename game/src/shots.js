import * as THREE from '../vendor/three.module.min.js';

function setCamera(game, position, target, fov) {
  game.shotCamera = { position: new THREE.Vector3(...position), target: new THREE.Vector3(...target), fov };
  game.camera.position.copy(game.shotCamera.position); game.camera.lookAt(game.shotCamera.target); game.camera.fov = fov; game.camera.updateProjectionMatrix();
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
  car.position.set(point.x, 0.12, point.z); state.yaw = roadYaw - 0.66; car.rotation.y = state.yaw;
  state.speed = 58.6; state.slip = 0.82; state.combo = 4.8; state.drift = 735; state.handbrake = true;
  car.userData.steer = -0.75;
  for (const wheel of car.userData.wheels) if (wheel.front) wheel.pivot.rotation.y = -0.62;
  world.district = 'SUNSET COAST';
  for (const [index, t] of [0.555, 0.59].entries()) {
    const civilian = city.traffic[index]; const p = city.coastCurve.getPoint(t); const direction = city.coastCurve.getTangent(t);
    civilian.position.set(p.x, 0.12, p.z); civilian.rotation.y = Math.atan2(-direction.z, direction.x); civilian.visible = true;
  }
  state.freezeEffects = true;
  const forward = new THREE.Vector3(Math.cos(state.yaw), 0, -Math.sin(state.yaw)); const side = new THREE.Vector3(Math.sin(state.yaw), 0, Math.cos(state.yaw));
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
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.34 + i * 0.045, 12, 9), new THREE.MeshBasicMaterial({ color: 0x9c7768, transparent: true, opacity: 0.16 - i * 0.004, depthWrite: false, toneMapped: false }));
      puff.position.copy(puffPosition); puff.scale.set(1.25, 0.8 + i * 0.025, 1.15); game.scene.add(puff);
    }
  }
  for (const [index, civilian] of [city.traffic[0], city.traffic[1]].entries()) {
    civilian.userData.paintMaterial?.color.setHex(index ? 0xb89a65 : 0xd9e2e5);
  }
  // Freeze particles at capture time so the dense fan survives the screenshot pass.
  for (const pedestrian of pedestrians.list) {
    if (pedestrian.position.z > point.z - 34 && pedestrian.position.z < point.z + 34 && Math.abs(pedestrian.position.x - point.x) < 70) pedestrian.visible = true;
  }
  world.shotMissionId = 'MISSION 01 / LAST LIGHT'; world.shotObjective = 'DRIFT THE COAST BEFORE THE SUN GOES DOWN.';
  for (const marker of game.missionMarkers) marker.visible = false;
  setCamera(game, [car.position.x - Math.cos(state.yaw) * 7.0 - Math.sin(state.yaw) * 2.2, 3.45, car.position.z + Math.sin(state.yaw) * 7.0 - Math.cos(state.yaw) * 2.2], [car.position.x + forward.x * 3.6, 0.9, car.position.z + forward.z * 3.6], 62);
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
  city.helicopter.userData.callsign.visible = true;
  city.helicopter.userData.mainRotor.rotation.y = 0.7; city.helicopter.userData.tailRotor.rotation.x = 0.9;
  city.helicopter.userData.cone.position.set(0.7, -13, 0); city.helicopter.userData.cone.scale.set(1.15, 1.3, 1.15); city.helicopter.userData.cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0.65, -0.76, 0).normalize());
  city.helicopter.userData.groundPool.position.set(20, -21, 0);
  city.helicopter.userData.target.position.set(20, -21, 0);
  city.helicopter.userData.search.position.set(0.6, -0.5, 0);
  city.helicopter.userData.whiteStrobe.intensity = 18;
  for (const marker of game.missionMarkers) marker.visible = false;
  game.missions.cash = 14800; game.missions.respect = 420;
  setCamera(game, [236, 6.4, 166], [258, 9, 153], 58);
}

function stageCombat(game) {
  const { drive, world, combat, player, city } = game; const car = drive.state.car;
  game.setWeather('harbor'); world.district = 'HARBOR DOCKS'; world.shotMissionId = 'MISSION 06 / DOCKSIDE HEIST'; world.shotObjective = 'CLEAR THE CONTAINER ALLEY.';
  car.position.set(420, 0.12, 330); car.rotation.y = Math.PI * 0.78;
  if (drive.state.active) drive.enterExit();
  player.position.set(418, 0, 328); player.rotation.y = 0; player.visible = true;
  combat.wheel = true; combat.weapon = 4; combat.ammo = 24; combat.ammoByWeapon[3] = 24;
  combat.reserve[3] = 120;
  const healthBars = [];
  combat.flash = 0.08; combat.enemies.slice(0, 4).forEach((enemy, i) => {
    enemy.visible = true; enemy.userData.alive = true; enemy.userData.health = 55 + i * 10;
    enemy.position.set(430 + i * 2.2, 0, 317 + (i % 2) * 8); enemy.rotation.y = Math.PI;
    const bar = new THREE.Group();
    const back = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.17), new THREE.MeshBasicMaterial({ color: 0x15191c, side: THREE.DoubleSide })); back.position.y = 2.28; bar.add(back);
    const fill = new THREE.Mesh(new THREE.PlaneGeometry(1.28, 0.1), new THREE.MeshBasicMaterial({ color: 0xff384e, side: THREE.DoubleSide })); fill.position.set(-0.05, 2.28, 0.012); bar.add(fill);
    bar.position.copy(enemy.position); game.scene.add(bar); healthBars.push(bar);
  });
  game.healthBars = healthBars;
  for (const enemy of combat.enemies.slice(4)) enemy.visible = false;
  for (const marker of game.missionMarkers) marker.visible = false;
  game.missions.cash = 14800; game.missions.respect = 420; game.police.wanted = 3;
  // Crate, muzzle starburst, weapon barrel light and three luminous tracer beams.
  const createContainer = (x, z, color, height = 4.6) => {
    const group = new THREE.Group(); const body = new THREE.Mesh(new THREE.BoxGeometry(5.2, height, 12), new THREE.MeshStandardMaterial({ color, roughness: 0.76, metalness: 0.16 })); body.position.y = height / 2; group.add(body);
    for (let rib = -5; rib <= 5; rib++) { const bar = new THREE.Mesh(new THREE.BoxGeometry(0.07, height - 0.2, 12.1), new THREE.MeshStandardMaterial({ color: 0xd6c9a1, metalness: 0.3, roughness: 0.65 })); bar.position.set(rib * 0.46, height / 2, 0); group.add(bar); }
    group.position.set(x, 0, z); game.scene.add(group);
  };
  createContainer(420, 309, 0xb6443d); createContainer(438, 345, 0x17878b); createContainer(455, 308, 0xd0a33b); createContainer(459, 346, 0x243f5f);
  // Two yellow dock cranes and the cargo ship silhouette frame the firefight.
  for (const x of [450, 470]) { const yellow = new THREE.MeshStandardMaterial({ color: 0xe2b431, metalness: 0.48 });
    for (const z of [302, 350]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(1, 13, 1), yellow); leg.position.set(x, 6.5, z); game.scene.add(leg); }
    const beam = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 52), yellow); beam.position.set(x, 13, 326); game.scene.add(beam);
  }
  const shipHull = new THREE.Mesh(new THREE.BoxGeometry(23, 4.5, 9), new THREE.MeshStandardMaterial({ color: 0x293a43 })); shipHull.position.set(460, 2.2, 282); game.scene.add(shipHull);
  for (let i=0;i<5;i++) { const load = new THREE.Mesh(new THREE.BoxGeometry(4,3.5,7), new THREE.MeshStandardMaterial({ color:[0xb5483e,0x197f86,0xd3a83d,0x283c5b,0xb5483e][i] })); load.position.set(452+i*4,6,282); game.scene.add(load); }
  const crate = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.8, 1.7), new THREE.MeshStandardMaterial({ color: 0x71523b, roughness: 0.9 })); crate.position.set(416, 0.9, 327); game.scene.add(crate);
  const muzzle = new THREE.Group(); muzzle.position.set(420.2, 1.4, 327.7); game.scene.add(muzzle);
  for (let i = 0; i < 8; i++) { const ray = new THREE.Mesh(new THREE.ConeGeometry(i % 2 ? 0.12 : 0.2, i % 2 ? 0.8 : 0.48, 4), new THREE.MeshBasicMaterial({ color: i % 2 ? 0xffb33b : 0xffefad, blending: THREE.AdditiveBlending, depthWrite: false })); ray.rotation.z = i * Math.PI / 4; ray.rotation.x = Math.PI / 2; ray.position.z = -0.28; muzzle.add(ray); }
  const muzzleLight = new THREE.PointLight(0xffa637, 32, 14); muzzle.add(muzzleLight);
  addTracer(game.scene, [421,1.45,327], [429,1.8,316], 0xffd36d, 0.05);
  addTracer(game.scene, [421,1.55,327], [432,1.55,325], 0xfff0b3, 0.045);
  addTracer(game.scene, [421,1.35,327], [431,1.2,334], 0xff9b37, 0.055);
  const impact = new THREE.PointLight(0xff832d, 18, 9); impact.position.set(432, 2.6, 328); game.scene.add(impact);
  const impactSpark = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 1), new THREE.MeshBasicMaterial({ color: 0xffb052, wireframe: true })); impactSpark.position.copy(impact.position); game.scene.add(impactSpark);
  document.body.classList.add('combat-shot');
  setCamera(game, [412, 2.9, 334], [431, 1.75, 323], 44);
  let reticle = document.getElementById('shot-reticle');
  if (!reticle) { reticle = document.createElement('div'); reticle.id = 'shot-reticle'; reticle.textContent = '⌖'; document.body.append(reticle); }
}

function stageGarage(game) {
  const { drive, world } = game; const car = drive.state.car;
  game.setWeather('garage'); world.district = 'CORAL ISLAND';
  world.shotMissionId = 'PAY N TUNE / SOLARIS BAY MAP'; world.shotObjective = 'YOUR BAY. YOUR BUILD. YOUR WAY OUT.';
  car.position.set(610, 0.42, 143); car.rotation.y = 0.18; game.paint(0x218d94, false);
  for (const marker of game.missionMarkers) marker.visible = false;
  game.cameraMode = 'garage'; document.body.classList.add('garage-shot'); game.showPanel('garage');
  setCamera(game, [612.5, 2.6, 150], [612, 1.0, 142], 40);
}

/** Place deterministic camera, lighting and gameplay beats for the four evidence shots. */
export function stageShot(name, game) {
  game.start({ silent: true });
  if (name === 'drift') stageDrift(game);
  else if (name === 'chase') stageChase(game);
  else if (name === 'combat') stageCombat(game);
  else if (name === 'garage') stageGarage(game);
  game.hud.update(game.hudState());
}
