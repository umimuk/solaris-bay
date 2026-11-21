/** Small, defensive DOM adapter for the in-game display. */
const HUD_IDS = [
  'district', 'objective', 'mission-id', 'cash', 'respect', 'stars',
  'speed', 'gear', 'drift', 'health-fill', 'armor-fill', 'weapon',
  'ammo', 'radio', 'radar',
];

export function createHud() {
  const root = document.getElementById('hud');
  const elements = Object.fromEntries(
    HUD_IDS.map((id) => [id, document.getElementById(id)]),
  );
  const radarContext = elements.radar?.getContext?.('2d') ?? null;

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
      setText('radio', `FM 93.7 • ${window.solRadio || 'SUNSET SYNTH'}`);
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
  const scale = Math.min(width, height) / 126;
  context.clearRect(0, 0, width, height);
  context.fillStyle = '#0a1720';
  context.fillRect(0, 0, width, height);

  // Water, shoreline and the same road graph used by the live city.
  context.fillStyle = '#12384a';
  context.beginPath();
  context.moveTo(0, 0); context.lineTo(width * 0.31, 0); context.lineTo(width * 0.22, height * 0.35);
  context.lineTo(width * 0.4, height * 0.55); context.lineTo(width * 0.26, height); context.lineTo(0, height);
  context.fill();
  const worldToRadar = (x, z) => [width / 2 + (x - position.x) * 0.31, height / 2 + (z - position.z) * 0.31];
  const graph = city?.roadGraph?.nodes || [[-400,-390],[-290,-350],[-120,-320],[-250,-160],[35,-30],[120,155],[315,310],[520,335],[610,145]];
  context.lineCap = 'round'; context.lineJoin = 'round'; context.strokeStyle = 'rgba(133,160,164,.52)'; context.lineWidth = 4 * scale;
  for (let i = 0; i < graph.length - 1; i++) { const a = worldToRadar(...graph[i]); const b = worldToRadar(...graph[i + 1]); context.beginPath(); context.moveTo(...a); context.lineTo(...b); context.stroke(); }
  context.strokeStyle = 'rgba(235,220,178,.75)'; context.lineWidth = 2.2 * scale;
  for (const [xRoad, zRoad, horizontal] of [[120,0,true],[120,155,true],[120,310,true],[160,160,false],[315,160,false],[0,155,false]]) {
    const [x, y] = worldToRadar(xRoad, zRoad); context.beginPath(); context.moveTo(x - (horizontal ? 48 : 0), y - (horizontal ? 0 : 48)); context.lineTo(x + (horizontal ? 48 : 0), y + (horizontal ? 0 : 48)); context.stroke();
  }
  const x = width / 2; const y = height / 2;
  context.save();
  context.translate(x, y);
  context.rotate(yaw);
  context.fillStyle = '#72f0eb';
  context.beginPath(); context.moveTo(0, -6 * scale); context.lineTo(4 * scale, 5 * scale);
  context.lineTo(0, 3 * scale); context.lineTo(-4 * scale, 5 * scale); context.closePath(); context.fill();
  context.restore();

  if (city?.traffic) for (const vehicle of city.traffic) {
    const [tx, ty] = worldToRadar(vehicle.position.x, vehicle.position.z);
    if (tx > 3 && ty > 3 && tx < width - 3 && ty < height - 3) { context.fillStyle = '#e7d8b3'; context.beginPath(); context.arc(tx, ty, 2.2 * scale, 0, Math.PI * 2); context.fill(); }
  }
  if (city?.police) city.police.forEach((vehicle, index) => {
    if (!vehicle.visible) return; const [px, py] = worldToRadar(vehicle.position.x, vehicle.position.z);
    if (px > 3 && py > 3 && px < width - 3 && py < height - 3) { context.fillStyle = Math.sin(performance.now() / 100 + index) > 0 ? '#ff3454' : '#3c8cff'; context.beginPath(); context.arc(px, py, 3.5 * scale, 0, Math.PI * 2); context.fill(); }
  });
  const pulse = 3 + Math.sin(performance.now() / 180) * 1.1;
  for (let i = 0; i < (police?.wanted || 0); i++) { const angle = i * Math.PI * 2 / Math.max(1, police.wanted) + performance.now() / 1600; context.fillStyle = i % 2 ? '#438dff' : '#ff3d59'; context.beginPath(); context.arc(x + Math.cos(angle) * 19 * scale, y + Math.sin(angle) * 19 * scale, pulse * scale, 0, Math.PI * 2); context.fill(); }
  if (missionsIndexToWaypoint(mission)) { const [mx, my] = worldToRadar(...missionsIndexToWaypoint(mission)); context.fillStyle = '#ffcd68'; context.beginPath(); context.arc(mx, my, 3 * scale, 0, Math.PI * 2); context.fill(); }
}

function missionsIndexToWaypoint(index) {
  return [[-115,-340],[-240,-310],[325,315],[100,40],[470,120],[680,220],[330,280],[-115,-340]][index] || null;
}
