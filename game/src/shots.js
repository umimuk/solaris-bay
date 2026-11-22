import * as THREE from '../vendor/three.module.min.js';
import { createGlowSprite } from './models/vehicles.js';
import { createSign } from './models/props.js';
import { createPalm } from './models/props.js';

function addBoulevardBackdrop(game, origin, forward, side) {
  const cream=new THREE.MeshStandardMaterial({color:0xe7d7bc,roughness:.78});const ivory=new THREE.MeshStandardMaterial({color:0xf4ead8,roughness:.7});
  const glass=new THREE.MeshStandardMaterial({color:0x24495a,roughness:.22,metalness:.24});const rail=new THREE.MeshStandardMaterial({color:0xd8cbb3,roughness:.52,metalness:.18});
  for(let i=0;i<3;i++)for(const s of [-1,1]){
    const position=origin.clone().addScaledVector(forward,10+i*19).addScaledVector(side,s*(29+(i%2)*4));const h=19+(i*7)%14;const group=new THREE.Group();group.position.copy(position);
    const body=new THREE.Mesh(new THREE.BoxGeometry(17,h,15),cream);body.position.y=h/2;group.add(body);
    const base=new THREE.Mesh(new THREE.BoxGeometry(18,2.2,16),ivory);base.position.y=1.1;group.add(base);
    const roof=new THREE.Mesh(new THREE.BoxGeometry(18.4,.4,16.4),ivory);roof.position.y=h+.2;group.add(roof);
    for(let floor=1;floor<h/4;floor++){const y=floor*3.7+2.4;const ledge=new THREE.Mesh(new THREE.BoxGeometry(16.2,.16,1.1),ivory);ledge.position.set(0,y,s*7.7);group.add(ledge);
      const glazing=new THREE.Mesh(new THREE.BoxGeometry(14.6,1.5,.08),glass);glazing.position.set(0,y-1.05,s*7.58);group.add(glazing);
      const guard=new THREE.Mesh(new THREE.BoxGeometry(15,.62,.07),rail);guard.position.set(0,y+.26,s*8.02);group.add(guard);
      for(const face of [-1,1]){const sideGlass=new THREE.Mesh(new THREE.BoxGeometry(.08,1.5,13.2),glass);sideGlass.position.set(face*8.58,y-1.05,0);group.add(sideGlass);}
    }
    game.scene.add(group);
  }
}

function addShotSkyline(game) {
  game.camera.updateMatrixWorld(true);const set=new THREE.Group();set.position.copy(game.camera.position);set.quaternion.copy(game.camera.quaternion);game.scene.add(set);const facades=[0xf1e5d1,0xe8d5bd,0xd9e4df,0xf2d8c7];
  for(const x of [-67,-49,-31,-16,16,31,49,67]){
    const height=21+(Math.abs(x)*7%20);const facade=new THREE.MeshStandardMaterial({color:facades[Math.abs(x)%facades.length],roughness:.72});
    const body=new THREE.Mesh(new THREE.BoxGeometry(15,height,13),facade);body.position.set(x,-8+height/2,-112);set.add(body);
    const roof=new THREE.Mesh(new THREE.BoxGeometry(15.7,.38,13.7),new THREE.MeshStandardMaterial({color:0xf7eddd,roughness:.6}));roof.position.set(x,-8+height,-112);set.add(roof);
    const glass=new THREE.MeshStandardMaterial({color:0x274b5a,roughness:.2,metalness:.28});
    for(let floor=0;floor<Math.floor(height/4);floor++)for(let column=-1;column<=1;column++){
      const window=new THREE.Mesh(new THREE.BoxGeometry(3.3,1.9,.12),glass);window.position.set(x+column*4,-7+floor*3.5,-105.35);set.add(window);
      if(floor%2===0){const balcony=new THREE.Mesh(new THREE.BoxGeometry(4,.12,.85),new THREE.MeshStandardMaterial({color:0xf8f0e1,roughness:.68}));balcony.position.set(x+column*4,-5.9+floor*3.5,-104.9);set.add(balcony);}
    }
  }
}

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
  const forward=new THREE.Vector3(Math.cos(state.yaw),0,-Math.sin(state.yaw)); const side=new THREE.Vector3(Math.sin(state.yaw),0,Math.cos(state.yaw));
  addBoulevardBackdrop(game,car.position,forward,side);
  for(let i=0;i<5;i++)for(const sign of [-1,1]){const palm=createPalm();palm.position.copy(car.position).addScaledVector(forward,(i-2)*17).addScaledVector(side,sign*22);palm.scale.setScalar(.95);city.root.add(palm);}
  pedestrians.list.slice(0,26).forEach((person,i)=>{const row=i%13;const sign=i<13?-1:1;person.position.copy(car.position).addScaledVector(forward,(row-6)*4.2).addScaledVector(side,sign*14.5);person.position.y=0;person.visible=true;});
  for (const [index, t] of [0.555, 0.59, 0.625, 0.66].entries()) {
    const civilian = city.traffic[index]; const p = city.coastCurve.getPoint(t); const direction = city.coastCurve.getTangent(t);
    const lateral=new THREE.Vector3(-direction.z,0,direction.x).normalize();civilian.position.set(p.x+lateral.x*(index%2?4:-4), 0.12, p.z+lateral.z*(index%2?4:-4)); civilian.rotation.y = Math.atan2(-direction.z, direction.x); civilian.visible = true;
  }
  const motorbike = city.traffic.find((vehicle) => vehicle.userData.spec?.kind === 'motorcycle');
  if (motorbike) { const p = city.coastCurve.getPoint(0.565); const d = city.coastCurve.getTangent(0.565); motorbike.position.set(p.x, 0.1, p.z); motorbike.rotation.y = Math.atan2(-d.z, d.x); motorbike.visible = true; }
  state.freezeEffects = true;
  if (city.ferrisWheel) city.ferrisWheel.position.copy(car.position).addScaledVector(forward, 75).addScaledVector(side, 45);
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
  setCamera(game, [car.position.x - Math.cos(state.yaw) * 9.8 - Math.sin(state.yaw) * 3.3, 5.0, car.position.z + Math.sin(state.yaw) * 9.8 - Math.cos(state.yaw) * 3.3], [car.position.x + forward.x * 4.5, 1.1, car.position.z + forward.z * 4.5], 68);
  addShotSkyline(game);
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
  game.missions.cash = 24850; game.missions.respect = 420; game.police.wanted = 4;
  game.police.heat = 86;
  const pursuit = [city.police[0], city.police[1], city.police[2]];
  city.roadblock.position.copy(car.position).addScaledVector(forward, 70);
  pursuit.forEach((unit, index) => {
    const side = new THREE.Vector3(Math.sin(state.yaw), 0, Math.cos(state.yaw));
    const offsets = [[-9,0],[0,-11],[9,0]][index];
    unit.visible = true; unit.position.copy(car.position).addScaledVector(side, offsets[0]).addScaledVector(forward, offsets[1]);
    unit.rotation.y = state.yaw + Math.PI + (index - 1) * 0.12;
    unit.userData.policePoints.forEach((light) => { light.intensity = 28; });
  });
  const viewDirection = game.shotCamera.target.clone().sub(game.shotCamera.position).normalize();
  city.helicopter.visible = true; city.helicopter.position.copy(game.shotCamera.position).addScaledVector(viewDirection, 30).add(new THREE.Vector3(0, 8, 0));
  city.helicopter.rotation.y = 0.9; city.helicopter.userData.stagedShot = true; city.helicopter.userData.callsign.visible = false;
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

function stageCombat(game) {
  const { drive, world, combat, player, city } = game; const car = drive.state.car;
  game.setWeather('wet-night'); world.district = 'NEON DOWNTOWN'; world.shotMissionId = 'MISSION 06 / DOCKSIDE SYNDICATE'; world.shotObjective = 'CLEAR THE NEON AVENUE. KEEP THE BAY CLUB IN SIGHT.';
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
  for (const marker of game.missionMarkers) marker.visible = false;
  game.missions.cash = 14800; game.missions.respect = 420; game.police.wanted = 3;
  // Muzzle starburst, barrel light and tracers cross the downtown avenue.
  const muzzle = new THREE.Group(); muzzle.position.set(239, 1.4, 158); game.scene.add(muzzle);
  for (let i = 0; i < 8; i++) { const ray = new THREE.Mesh(new THREE.ConeGeometry(i % 2 ? 0.12 : 0.2, i % 2 ? 0.8 : 0.48, 4), new THREE.MeshBasicMaterial({ color: i % 2 ? 0xffb33b : 0xffefad, blending: THREE.AdditiveBlending, depthWrite: false })); ray.rotation.z = i * Math.PI / 4; ray.rotation.x = Math.PI / 2; ray.position.z = -0.28; muzzle.add(ray); }
  const muzzleLight = new THREE.PointLight(0xffa637, 32, 14); muzzle.add(muzzleLight);
  addTracer(game.scene, [239,1.45,158], [260,1.8,143], 0xffd36d, 0.05);
  addTracer(game.scene, [239,1.55,158], [265,1.55,153], 0xfff0b3, 0.045);
  addTracer(game.scene, [239,1.35,158], [261,1.2,163], 0xff9b37, 0.055);
  const impact = new THREE.PointLight(0xff832d, 18, 9); impact.position.set(261, 2.6, 153); game.scene.add(impact);
  const impactSpark = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 1), new THREE.MeshBasicMaterial({ color: 0xffb052, wireframe: true })); impactSpark.position.copy(impact.position); game.scene.add(impactSpark);
  document.body.classList.add('combat-shot');
  setCamera(game, [230, 3.6, 164], [259, 1.75, 153], 48);
  let reticle = document.getElementById('shot-reticle');
  if (!reticle) { reticle = document.createElement('div'); reticle.id = 'shot-reticle'; reticle.textContent = '⌖'; document.body.append(reticle); }
}

function stageGarage(game) {
  const { drive, world } = game; const car = drive.state.car;
  game.setWeather('garage'); world.district = 'CORAL ISLAND';
  world.shotMissionId = 'PAY N TUNE / SOLARIS BAY MAP'; world.shotObjective = 'YOUR BAY. YOUR BUILD. YOUR WAY OUT.';
  car.position.set(607, 0.42, 143); car.rotation.y = 0.18; game.paint(0x218d94, false);
  for(const [x,y,z,intensity,color] of [[609,5.4,148,76,0xfff0d0],[613,3.2,138,42,0xb5f7ff]]){const fill=new THREE.PointLight(color,intensity,28,1.4);fill.position.set(x,y,z);game.scene.add(fill);}
  const pegboard=new THREE.Mesh(new THREE.BoxGeometry(20,8,.26),new THREE.MeshStandardMaterial({color:0xc7bda9,roughness:.9}));pegboard.position.set(580,5,134.08);game.scene.add(pegboard);
  for(let i=0;i<7;i++){const tool=new THREE.Mesh(new THREE.BoxGeometry(.18,1.2+(i%3)*.25,.12),new THREE.MeshStandardMaterial({color:i%2?0x38454a:0xb9b5a8,metalness:.55,roughness:.35}));tool.position.set(572+i*2.2,4.5,134.28);game.scene.add(tool);}
  for(let i=0;i<3;i++){const bar=new THREE.Mesh(new THREE.BoxGeometry(4.8,.15,.7),new THREE.MeshBasicMaterial({color:0xfff0d0,toneMapped:false}));bar.position.set(604+i*6,9.3,140);game.scene.add(bar);}
  const garageSign=createSign('PAY N TUNE',0x49e8ff);garageSign.position.set(580,8.1,134.28);garageSign.scale.setScalar(1.35);game.scene.add(garageSign);
  for (const marker of game.missionMarkers) marker.visible = false;
  game.cameraMode = 'garage'; document.body.classList.add('garage-shot'); game.showPanel('garage');
  setCamera(game, [617, 3.1, 148], [610, 0.9, 143], 43);
  game.camera.updateMatrixWorld(true);const studio=new THREE.Group();studio.position.copy(game.camera.position);studio.quaternion.copy(game.camera.quaternion);game.scene.add(studio);
  const wall=new THREE.Mesh(new THREE.BoxGeometry(24,12,.7),new THREE.MeshStandardMaterial({color:0xd9ceb7,roughness:.83}));wall.position.set(-3,0,-18);studio.add(wall);
  const shopSign=createSign('PAY N TUNE',0x49e8ff);shopSign.position.set(-3,4.2,-17.55);shopSign.scale.set(1.7,1.7,1);studio.add(shopSign);
  for(let i=0;i<8;i++){const tool=new THREE.Mesh(new THREE.BoxGeometry(.24,1.6+(i%3)*.38,.13),new THREE.MeshStandardMaterial({color:i%2?0x344249:0xa3a69f,metalness:.55,roughness:.32}));tool.position.set(-10+i*2,0.1,-17.5);studio.add(tool);}
  for(let i=0;i<4;i++){const strip=new THREE.Mesh(new THREE.BoxGeometry(6,.13,.42),new THREE.MeshBasicMaterial({color:0xfff0cb,toneMapped:false}));strip.position.set(-10+i*5,6,-15);studio.add(strip);}
  for(let i=0;i<3;i++){const tire=new THREE.Mesh(new THREE.TorusGeometry(.72,.23,9,20),new THREE.MeshStandardMaterial({color:0x171c20,roughness:.9}));tire.position.set(7,1.1+i*1.75,-17.5);studio.add(tire);}
}

function stageTitle(game) {
  game.setWeather('golden'); game.hud.hide(); game.cameraMode = 'title';
  if(game.city.ferrisWheel)game.city.ferrisWheel.position.set(-246,0,-444);
  const bridge=new THREE.Group();bridge.position.set(-210,0,-378);game.city.root.add(bridge);
  const white=new THREE.MeshStandardMaterial({color:0xf0ede2,metalness:.42,roughness:.34});const deck=new THREE.Mesh(new THREE.BoxGeometry(78,.55,4),new THREE.MeshStandardMaterial({color:0x65747a,metalness:.52,roughness:.4}));deck.position.y=4;bridge.add(deck);
  for(const x of [-36,36]){const tower=new THREE.Mesh(new THREE.BoxGeometry(1.7,24,1.8),white);tower.position.set(x,12,0);bridge.add(tower);}
  const cableCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(-36,24,0),new THREE.Vector3(-18,15,0),new THREE.Vector3(0,11,0),new THREE.Vector3(18,15,0),new THREE.Vector3(36,24,0)]);bridge.add(new THREE.Mesh(new THREE.TubeGeometry(cableCurve,32,.16,6,false),white));
  for(let i=-5;i<=5;i++){const x=i*6;const y=11+(Math.abs(x)/36)*13;bridge.add(new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,y-4,5),white)).position.set(x,(y+4)/2,0);}
  game.city.traffic.forEach((vehicle, index) => { vehicle.visible = true; vehicle.position.set(-365 + index * 42, 0.12, -280 + (index % 3) * 22); vehicle.rotation.y = 0.4; });
  game.missions.cash = 24850; game.missions.respect = 420;
  game.showPanel('title'); document.body.classList.add('title-shot');
  game.world.shotMissionId = ''; game.world.shotObjective = ''; game.world.shotRadio = '';
  setCamera(game, [-500, 21, -365], [-170, 17, -350], 54);
  const wheelPos=game.camera.localToWorld(new THREE.Vector3(55,-10,-145));wheelPos.y=0;game.city.ferrisWheel.position.copy(wheelPos);
  game.camera.updateMatrixWorld(true);const titleBridge=new THREE.Group();titleBridge.position.copy(game.camera.localToWorld(new THREE.Vector3(68,-7,-160)));titleBridge.quaternion.copy(game.camera.quaternion);game.scene.add(titleBridge);
  const bridgeMat=new THREE.MeshStandardMaterial({color:0xf2eee4,metalness:.42,roughness:.32});const titleDeck=new THREE.Mesh(new THREE.BoxGeometry(86,.6,4),new THREE.MeshStandardMaterial({color:0x64747a,metalness:.5,roughness:.38}));titleDeck.position.y=4;titleBridge.add(titleDeck);
  for(const x of [-40,40]){const tower=new THREE.Mesh(new THREE.BoxGeometry(1.6,25,1.8),bridgeMat);tower.position.set(x,13,0);titleBridge.add(tower);}
  const mainCable=new THREE.CatmullRomCurve3([new THREE.Vector3(-40,25,0),new THREE.Vector3(-20,16,0),new THREE.Vector3(0,12,0),new THREE.Vector3(20,16,0),new THREE.Vector3(40,25,0)]);titleBridge.add(new THREE.Mesh(new THREE.TubeGeometry(mainCable,36,.15,6,false),bridgeMat));
  for(let i=-6;i<=6;i++){const x=i*6.2;const y=12+Math.abs(x)/40*13;const hanger=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,y-4,5),bridgeMat);hanger.position.set(x,(y+4)/2,0);titleBridge.add(hanger);}
}

/** Place deterministic camera, lighting and gameplay beats for the four evidence shots. */
export function stageShot(name, game) {
  game.start({ silent: true });
  if (name === 'drift') stageDrift(game);
  else if (name === 'chase') stageChase(game);
  else if (name === 'combat') stageCombat(game);
  else if (name === 'garage') stageGarage(game);
  else if (name === 'title') stageTitle(game);
  game.hud.update(game.hudState());
}
