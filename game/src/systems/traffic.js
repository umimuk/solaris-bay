import * as THREE from '../../vendor/three.module.min.js';

/** Road graph traffic with lane offsets, following distance and player avoidance. */
export function updateTraffic(city, dt, player) {
  const nodes = city.roadGraph.nodes;
  const routeLength = nodes.length;
  if (routeLength < 2) return;

  city.traffic.forEach((car, index) => {
    const data = car.userData;
    if (data.stagedShot) return;
    data.routePhase ??= (index / city.traffic.length) * routeLength;
    data.cruiseSpeed ??= 8 + (index % 5) * 1.8;
    data.routePhase = (data.routePhase + dt * data.cruiseSpeed / 28) % routeLength;

    const segment = Math.floor(data.routePhase);
    const fraction = data.routePhase - segment;
    const reverse = index % 2 === 1;
    const fromIndex = reverse ? (routeLength - segment) % routeLength : segment;
    const toIndex = reverse ? (fromIndex - 1 + routeLength) % routeLength : (fromIndex + 1) % routeLength;
    const from = nodes[fromIndex];
    const to = nodes[toIndex];
    const blend = reverse ? 1 - fraction : fraction;
    const x = THREE.MathUtils.lerp(from[0], to[0], blend);
    const z = THREE.MathUtils.lerp(from[1], to[1], blend);
    const dx = to[0] - from[0];
    const dz = to[1] - from[1];
    const length = Math.hypot(dx, dz) || 1;
    const lane = reverse ? -1 : 1;
    const laneOffset = 3.2 * lane;
    const ahead = city.traffic.some((other, otherIndex) => {
      if (otherIndex === index) return false;
      const distance = car.position.distanceTo(other.position);
      return distance < 7.5;
    });
    const nearPlayer = car.position.distanceTo(player) < 9;

    car.position.set(x - (dz / length) * laneOffset, 0.1, z + (dx / length) * laneOffset);
    car.rotation.y = Math.atan2(-dz, dx);
    if (ahead || nearPlayer) data.cruiseSpeed = Math.max(4, data.cruiseSpeed - dt * 9);
    else data.cruiseSpeed = Math.min(17, data.cruiseSpeed + dt * 2.4);
    for (const wheel of data.wheels || []) wheel.wheel.rotation.z -= data.cruiseSpeed * dt / 0.39;
  });
}
