import * as THREE from '../../vendor/three.module.min.js';

/** Five-level pursuit director with sight decay and escalating response units. */
export function createPolice(city) {
  return {
    wanted: 0,
    heat: 0,
    visible: false,
    phase: 0,
    cooldown: 0,
    step(dt, player, crime) {
      this.phase += dt;
      const playerPosition = player.isVector3 ? player : new THREE.Vector3(player.x, player.y || 0, player.z);
      const patrol = city.police[0];
      const sightDistance = patrol?.position.distanceTo(playerPosition) ?? Infinity;
      this.visible = sightDistance < 155 || Boolean(crime);

      if (crime) {
        this.heat = Math.min(100, this.heat + dt * 28);
        this.cooldown = 0;
      } else if (this.visible) {
        this.cooldown = 0;
        this.heat = Math.max(this.heat, this.wanted * 20);
      } else {
        this.cooldown += dt;
        if (this.cooldown > 7) this.heat = Math.max(0, this.heat - dt * 2.8);
      }
      this.wanted = Math.min(5, Math.ceil(this.heat / 20));

      for (let index = 0; index < city.police.length; index++) {
        const car = city.police[index];
        const active = this.wanted >= Math.min(index + 1, 3);
        car.userData.activeChase = active;
        car.visible = active;
        if (!active) continue;
        if (car.userData.stagedShot) {
          car.userData.policeLights.forEach((light, lightIndex) => {
            light.material.emissiveIntensity = Math.sin(this.phase * 13 + lightIndex * Math.PI) * 1.2 + 3.3;
          });
          car.userData.policePoints.forEach((light, lightIndex) => {
            light.intensity = Math.max(0, Math.sin(this.phase * 13 + lightIndex * Math.PI)) * 34;
          });
          continue;
        }
        const angle = this.phase * (index % 2 ? -0.7 : 0.55) + index * 2.8;
        const radius = 12 + index * 4;
        const destination = new THREE.Vector3(
          playerPosition.x + Math.cos(angle) * radius,
          0.12,
          playerPosition.z + Math.sin(angle) * radius,
        );
        car.position.lerp(destination, Math.min(1, dt * (this.wanted >= 3 ? 2.8 : 1.7)));
        car.rotation.y = Math.atan2(playerPosition.z - car.position.z, playerPosition.x - car.position.x);
        car.userData.policeLights.forEach((light, lightIndex) => {
          light.material.emissiveIntensity = Math.sin(this.phase * 13 + lightIndex * Math.PI) * 1.2 + 3.3;
        });
        car.userData.policePoints.forEach((light, lightIndex) => {
          light.intensity = Math.max(0, Math.sin(this.phase * 13 + lightIndex * Math.PI)) * 34;
        });
      }

      // Three stars use the downtown's existing barricades and spike strip.
      if (!city.swat.userData.stagedShot) city.swat.visible = this.wanted >= 4;
      if (city.swat.visible && !city.swat.userData.stagedShot) {
        city.swat.position.set(playerPosition.x - 17, 0.1, playerPosition.z + 11);
        city.swat.rotation.y = Math.atan2(17, -11);
      }

      city.helicopter.visible = this.wanted >= 5;
      if (city.helicopter.visible) {
        if (!city.helicopter.userData.stagedShot) {
          city.helicopter.position.set(
            playerPosition.x + Math.sin(this.phase * 0.19) * 22,
            68 + Math.sin(this.phase * 0.55) * 2.5,
            playerPosition.z + Math.cos(this.phase * 0.19) * 25,
          );
          city.helicopter.userData.target.position.set(
            Math.sin(this.phase * 0.65) * 25,
            -city.helicopter.position.y + 0.45,
            Math.cos(this.phase * 0.65) * 25,
          );
          city.helicopter.userData.groundPool.position.y = -city.helicopter.position.y + 0.12;
        }
        city.helicopter.userData.mainRotor.rotation.y += dt * 16;
        city.helicopter.userData.tailRotor.rotation.x += dt * 20;
      }
    },
  };
}
