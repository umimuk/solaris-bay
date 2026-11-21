import * as THREE from '../../vendor/three.module.min.js';
import { createCharacter, animateCharacter } from '../models/characters.js';

/** Sidewalk crowd that wanders, scatters from threats and regroups afterward. */
export function createPedestrians(scene, random, count = 34) {
  const crowd = [];
  for (let index = 0; index < count; index++) {
    const pedestrian = createCharacter(index % 11 === 0 ? 'officer' : 'pedestrian', index);
    pedestrian.position.set((random() - 0.5) * 700, 0, (random() - 0.5) * 700);
    pedestrian.userData.phase = random() * Math.PI * 2;
    pedestrian.userData.flee = 0;
    pedestrian.userData.heading = random() * Math.PI * 2;
    scene.add(pedestrian);
    crowd.push(pedestrian);
  }

  return {
    list: crowd,
    step(dt, time, threatened, threatPosition = null) {
      for (const pedestrian of crowd) {
        const data = pedestrian.userData;
        if (threatened && threatPosition && pedestrian.position.distanceTo(threatPosition) < 70) {
          const escape = pedestrian.position.clone().sub(threatPosition);
          escape.y = 0;
          if (escape.lengthSq() > 0.1) data.heading = Math.atan2(-escape.z, escape.x);
          data.flee = Math.min(6, data.flee + dt * 2.5);
        } else {
          data.flee = Math.max(0, data.flee - dt * 0.75);
          data.phase += dt * 0.35;
          data.heading += Math.sin(data.phase * 0.6) * dt * 0.12;
        }

        const speed = data.flee > 0.2 ? 4.4 : 0.45;
        pedestrian.position.x += Math.cos(data.heading) * speed * dt;
        pedestrian.position.z -= Math.sin(data.heading) * speed * dt;
        pedestrian.rotation.y = data.heading;
        if (Math.abs(pedestrian.position.x) > 430) data.heading = Math.PI - data.heading;
        if (Math.abs(pedestrian.position.z) > 430) data.heading = -data.heading;
        animateCharacter(pedestrian, time * (data.flee > 0.2 ? 1.9 : 0.55), data.flee > 0.2);
      }
    },
  };
}
