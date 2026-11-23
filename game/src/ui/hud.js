/** Small, defensive DOM adapter for the in-game display. */
const HUD_IDS = [
  'district', 'objective', 'mission-id', 'cash', 'respect', 'stars',
  'speed', 'gear', 'drift', 'health-fill', 'armor-fill', 'weapon',
  'ammo', 'radio', 'radar',
];

export function renderCommandDossier() {
  const root = document.getElementById('hud');
  const elements = Object.fromEntries(
    HUD_IDS.map((id) => [id, document.getElementById(id)]),
  );
  const radarContext = elements.radar?.getContext?.('2d') ?? null;
  const slots = [...document.querySelectorAll('.loadout [data-weapon]')];
  const dispatchRanges = Object.fromEntries([...document.querySelectorAll('[data-range]')].map((element) => [element.dataset.range, element]));

  function setText(id, value) {
    const element = elements[id];
    if (element) element.textContent = String(value);
  }

  function setWidth(id, value) {
    const element = elements[id];
    if (element) element.style.width = `${Math.max(0, Math.min(100, value))}%`;
  }

  return {
    update({ drive, police, missions, combat, world, mode, city }) {
      setText('district', world.district || 'SUNSET COAST');
      setText('objective', world.shotObjective || missions.objective);
      setText(
        'mission-id',
        world.shotMissionId || (missions.current
          ? `MISSION ${missions.current[0]} / ${missions.current[1]}`
          : 'FREE ROAM'),
      );
      setText('cash', `$${missions.cash.toLocaleString()}`);
      setText('respect', `REP ${missions.respect.toLocaleString()}`);

      const stars = elements.stars;
      if (stars) {
        stars.textContent = '★'.repeat(police.wanted) + '☆'.repeat(5 - police.wanted);
        stars.style.color = police.wanted ? '#ff5367' : '#82909b';
      }

      setText(
        'speed',
        String(Math.round(Math.abs(drive.state.speed) * 3.6)).padStart(3, '0'),
      );
      setText(
        'gear',
        drive.state.speed < 0
          ? 'R'
          : Math.abs(drive.state.speed) < 1
            ? 'P'
            : Math.abs(drive.state.speed) < 22
              ? '1'
              : Math.abs(drive.state.speed) < 40
                ? '2'
                : '3',
      );

      const drifting = drive.state.slip > 0.3;
      setText('drift', drifting ? `DRIFT ×${drive.state.combo.toFixed(1)}` : '');
      if (elements.drift) elements.drift.style.opacity = drifting ? '1' : '0';
      setWidth('health-fill', combat.health);
      setWidth('armor-fill', combat.armor);
      const weaponElement = elements.weapon;
      if (weaponElement?.firstChild) weaponElement.firstChild.textContent = `${combat.weapons[combat.weapon - 1] || 'UNARMED'} `;
      const reserve = combat.reserve?.[combat.weapon - 1] ?? '∞';
      setText('ammo', `${combat.ammo} / ${reserve}`);
      slots.forEach((slot, index) => {
        const ammo = combat.ammoByWeapon?.[index] ?? 0;
        const labels = ['PISTOL','SMG','SHOTGUN','RIFLE','KNIFE'];
        slot.classList.toggle('active', combat.weapon === index + 1);
        const label = slot.querySelector('i');
        if (label) label.textContent = `${index + 1} ${labels[index]} ${ammo}`;
      });
      const playerPosition = drive.state.car.position;
      const range = (object) => object?.position ? `${Math.round(playerPosition.distanceTo(object.position))}m` : '—';
      if (dispatchRanges.heli) dispatchRanges.heli.textContent = range(city?.helicopter);
      if (dispatchRanges.unit1) dispatchRanges.unit1.textContent = range(city?.police?.[0]);
      if (dispatchRanges.unit2) dispatchRanges.unit2.textContent = range(city?.police?.[1]);
      if (dispatchRanges.roadblock) dispatchRanges.roadblock.textContent = range(city?.roadblock);
      const radioCopy = elements.radio?.querySelector('.radio-copy span');
      if (radioCopy) {
        const message = world.shotRadio || `FM 93.7 • ${window.solRadio || 'SUNSET SYNTH'}`;
        radioCopy.textContent = message.includes('—') ? message.split('—').slice(1).join('—').trim() : message;
        const radioHeading = elements.radio.querySelector('.radio-copy b');
        if (radioHeading) radioHeading.textContent = message.includes('NIKO') ? 'NIKO VALE • DRIVER' : 'MARA SOL • FIELD OPERATOR';
        const avatar = elements.radio.querySelector('.radio-avatar');
        if (avatar && message.includes('NIKO')) avatar.innerHTML = '<circle cx="18" cy="18" r="17" fill="#1b3442"/><path d="M6 36q2-14 12-14t12 14" fill="#547d83"/><ellipse cx="18" cy="14" rx="7" ry="8" fill="#d69b77"/><path d="M10 13Q11 4 19 5q8 0 8 9l-5-4-8 1z" fill="#342921"/>';
      }
      else setText('radio', world.shotRadio || `FM 93.7 • ${window.solRadio || 'SUNSET SYNTH'}`);
      if (elements.radio) elements.radio.style.display = combat.wheel || !drive.state.active ? 'none' : '';
      if (radarContext) {
        drawMap(radarContext, drive.state.car.position, drive.state.yaw, city, police, missions.index, mode);
      }
    },
    hide() { root?.classList.add('hidden'); },
    show() { root?.classList.remove('hidden'); },
  };
}

/** Draws a compact district map, player heading and nearby police. */
function drawMap(context, position, yaw, city, police, mission, mode) {
  const { width, height } = context.canvas;
  const scale = Math.min(width, height) / 172;
  const centerX = width / 2;
  const centerY = height / 2;
  const now = performance.now();
  context.clearRect(0, 0, width, height);
  context.save();
  context.beginPath();
  context.arc(centerX, centerY, Math.min(width, height) / 2 - 1, 0, Math.PI * 2);
  context.clip();
  context.fillStyle = '#101c25';
  context.fillRect(0, 0, width, height);

  // Coastline and city blocks are fixed to the district map so the radar stays legible while driving.
  context.fillStyle = '#17627a';
  context.beginPath();
  context.moveTo(0, 0); context.lineTo(width * 0.26, 0); context.lineTo(width * 0.31, height * 0.2);
  context.lineTo(width * 0.22, height * 0.36); context.lineTo(width * 0.39, height * 0.54);
  context.lineTo(width * 0.25, height * 0.77); context.lineTo(width * 0.29, height);
  context.lineTo(0, height); context.closePath(); context.fill();

  const worldToRadar = (x, z) => [centerX + (x - position.x) * 0.36, centerY + (z - position.z) * 0.36];
  context.fillStyle = 'rgba(122, 143, 147, .24)';
  for (let row = 0; row < 6; row++) {
    for (let column = 0; column < 5; column++) {
      const blockX = 63 + column * 24;
      const blockY = 13 + row * 28;
      context.fillRect(blockX, blockY, 15, 17);
    }
  }

  // Gray avenues and fine white cross streets form a recognizable multi-block grid.
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.strokeStyle = 'rgba(142, 164, 168, .68)';
  context.lineWidth = 7 * scale;
  for (let column = 0; column < 6; column++) {
    const x = 59 + column * 21;
    context.beginPath(); context.moveTo(x, -8); context.lineTo(x - 14, height + 8); context.stroke();
  }
  for (let row = 0; row < 7; row++) {
    const y = 10 + row * 25;
    context.beginPath(); context.moveTo(48, y); context.lineTo(width + 8, y - 7); context.stroke();
  }
  context.strokeStyle = 'rgba(246, 240, 220, .92)';
  context.lineWidth = 2.2 * scale;
  for (let column = 0; column < 7; column++) {
    const x = 53 + column * 20;
    context.beginPath(); context.moveTo(x, 0); context.lineTo(x - 17, height); context.stroke();
  }
  for (let row = 0; row < 8; row++) {
    const y = row * 23;
    context.beginPath(); context.moveTo(45, y); context.lineTo(width, y - 9); context.stroke();
  }

  const route = [[-115, -340], [-240, -310], [-190, -180], [-35, -95], [100, 40], [325, 315], [470, 120]];
  const routePoints = route.map(([x, z]) => worldToRadar(x, z));
  context.beginPath();
  context.moveTo(...routePoints[0]);
  for (let index = 1; index < routePoints.length; index++) {
    const [x, y] = routePoints[index];
    const [previousX, previousY] = routePoints[index - 1];
    context.quadraticCurveTo(previousX, previousY, (previousX + x) / 2, (previousY + y) / 2);
  }
  context.lineTo(...routePoints.at(-1));
  context.strokeStyle = 'rgba(36, 231, 239, .34)';
  context.lineWidth = 7 * scale;
  context.stroke();
  context.strokeStyle = '#50eff2';
  context.lineWidth = 2.3 * scale;
  context.setLineDash([6 * scale, 4 * scale]);
  context.stroke();
  context.setLineDash([]);

  if (city?.traffic) for (const vehicle of city.traffic) {
    const [trafficX, trafficY] = worldToRadar(vehicle.position.x, vehicle.position.z);
    if (trafficX > 3 && trafficY > 3 && trafficX < width - 3 && trafficY < height - 3) {
      context.fillStyle = '#f2e7c7';
      context.beginPath(); context.arc(trafficX, trafficY, 2.2 * scale, 0, Math.PI * 2); context.fill();
    }
  }
  if (city?.police) city.police.forEach((vehicle, index) => {
    if (!vehicle.visible) return;
    const [policeX, policeY] = worldToRadar(vehicle.position.x, vehicle.position.z);
    if (policeX > 3 && policeY > 3 && policeX < width - 3 && policeY < height - 3) {
      context.fillStyle = Math.sin(now / 100 + index) > 0 ? '#ff3454' : '#3c8cff';
      context.beginPath(); context.arc(policeX, policeY, 3.5 * scale, 0, Math.PI * 2); context.fill();
    }
  });

  const pulse = 5 + Math.sin(now / 180) * 1.7;
  for (let index = 0; index < (police?.wanted || 0); index++) {
    const angle = index * Math.PI * 2 / Math.max(1, police.wanted) + now / 1600;
    context.strokeStyle = index % 2 ? '#438dff' : '#ff3d59';
    context.lineWidth = 2 * scale;
    context.beginPath(); context.arc(centerX + Math.cos(angle) * 22 * scale, centerY + Math.sin(angle) * 22 * scale, pulse * scale, 0, Math.PI * 2); context.stroke();
  }

  const waypoint = missionsIndexToWaypoint(mission);
  if (waypoint) {
    const [targetX, targetY] = worldToRadar(...waypoint);
    context.strokeStyle = 'rgba(62, 237, 242, .92)';
    context.lineWidth = 1.8 * scale;
    context.setLineDash([5 * scale, 3 * scale]);
    context.beginPath(); context.moveTo(centerX, centerY); context.lineTo(targetX, targetY); context.stroke();
    context.setLineDash([]);
    context.fillStyle = '#70f9fb';
    context.beginPath(); context.arc(targetX, targetY, 3.5 * scale, 0, Math.PI * 2); context.fill();
  }

  context.save();
  context.translate(centerX, centerY);
  context.rotate(yaw);
  context.fillStyle = '#effffb';
  context.strokeStyle = '#42e4ea';
  context.lineWidth = 1.6 * scale;
  context.beginPath(); context.moveTo(0, -12 * scale); context.lineTo(8 * scale, 10 * scale);
  context.lineTo(0, 6 * scale); context.lineTo(-8 * scale, 10 * scale); context.closePath(); context.fill(); context.stroke();
  context.restore();
  context.restore();
}

function missionsIndexToWaypoint(index) {
  return [[-115,-340],[-240,-310],[325,315],[100,40],[470,120],[680,220],[330,280],[-115,-340]][index] || null;
}
