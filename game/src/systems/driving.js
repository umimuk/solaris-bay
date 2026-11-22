import * as THREE from '../../vendor/three.module.min.js';
import { PHYSICS } from '../config.js';
import { updateVehicle } from '../models/vehicles.js';
import { createRandom } from '../random.js';

const UP = new THREE.Vector3(0, 1, 0);

/** Arcade street car dynamics, drift scoring, skid trails and tire effects. */
export function createDriving(scene, car, seed = 1) {
  const random = createRandom(seed);
  const state = {
    car, speed: 0, yaw: Math.PI * 0.1, slip: 0, drift: 0, score: 0,
    combo: 1, damage: 0, nitro: 100, handbrake: false, active: true,
    sparks: [], smoke: [], skids: [], sparkCount: 0, freezeEffects: false,
  };
  const sparkLight = new THREE.PointLight(0xff781f, 0, 13, 2);
  scene.add(sparkLight);
  state.sparkLight = sparkLight;

  function burst(position, kind = 'spark', count = 1) {
    const spark = kind === 'spark' || kind === 'sparks';
    for (let i = 0; i < count; i++) {
      if (spark && state.sparks.length > 180) continue;
      const localDirection = new THREE.Vector3(-1.2 - random() * 3.2, 0.35 + random() * 2.2, (random() - 0.5) * 3.2);
      const direction = localDirection.applyAxisAngle(UP, state.yaw).normalize();
      const material = new THREE.MeshBasicMaterial({
        color: spark ? (i % 4 === 0 ? 0xfff9dc : i % 3 === 0 ? 0xff9d1c : 0xff5a14) : 0x9a8879,
        transparent: true,
        opacity: spark ? 1 : 0.3,
        blending: spark ? THREE.AdditiveBlending : THREE.NormalBlending,
        depthWrite: false,
      });
      const geometry = spark
        ? new THREE.CylinderGeometry(0.022, 0.038, 1.2 + random() * 1.6, 6)
        : new THREE.SphereGeometry(0.26 + random() * 0.32, 9, 7);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(position);
      if (spark) mesh.quaternion.setFromUnitVectors(UP, direction);
      mesh.userData = {
        life: spark ? 0.65 + random() * 0.48 : 1.5 + random() * 0.9,
        maxLife: spark ? 1.13 : 2.4,
        velocity: spark
          ? direction.multiplyScalar(13 + random() * 18)
          : new THREE.Vector3((random() - 0.5) * 1.2, 0.8 + random(), (random() - 0.5) * 1.2),
        kind,
      };
      scene.add(mesh);
      state[spark ? 'sparks' : 'smoke'].push(mesh);
      if (spark) state.sparkCount += 1;
    }
  }

  function placeSkid(position, yaw) {
    const geometry = new THREE.PlaneGeometry(0.2, 1.15);
    const material = new THREE.MeshBasicMaterial({
      color: 0x101216,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    });
    const mark = new THREE.Mesh(geometry, material);
    mark.rotation.set(-Math.PI / 2, 0, -yaw);
    mark.position.copy(position);
      mark.position.y = 0.055;
      mark.scale.x = 1.6;
    scene.add(mark);
    state.skids.push(mark);
    if (state.skids.length > 700) scene.remove(state.skids.shift());
  }

  function updateEffects(dt) {
    if (state.freezeEffects) return;
    for (const kind of ['sparks', 'smoke']) {
      const particles = state[kind];
      for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        const data = particle.userData;
        data.life -= dt;
        particle.position.addScaledVector(data.velocity, dt);
        if (kind === 'sparks') data.velocity.y -= 9.8 * dt;
        else data.velocity.y += 0.22 * dt;
        particle.material.opacity = Math.max(0, data.life / data.maxLife) * (kind === 'sparks' ? 1 : 0.3);
        if (kind === 'smoke') particle.scale.multiplyScalar(1 + dt * 0.42);
        if (data.life <= 0) {
          scene.remove(particle);
          particle.geometry.dispose();
          particle.material.dispose();
          particles.splice(i, 1);
        }
      }
    }
  }

  function step(dt, input, world) {
    const gas = input.down('KeyW', 'ArrowUp');
    const brake = input.down('KeyS', 'ArrowDown');
    const left = input.down('KeyA', 'ArrowLeft');
    const right = input.down('KeyD', 'ArrowRight');
    const handbrake = input.down('Space');
    const steering = Number(right) - Number(left);
    state.handbrake = handbrake;

    let acceleration = (gas ? PHYSICS.acceleration : 0) - (brake ? PHYSICS.acceleration * 1.2 : 0);
    if (input.down('ShiftLeft', 'ShiftRight') && state.nitro > 0) {
      acceleration += 45;
      state.nitro = Math.max(0, state.nitro - dt * 30);
    } else {
      state.nitro = Math.min(100, state.nitro + dt * 4);
    }
    state.speed = THREE.MathUtils.clamp(
      state.speed + acceleration * dt,
      -PHYSICS.reverse,
      PHYSICS.maxSpeed + (state.car.userData.upgrades?.turbo ? 16 : 0),
    );
    if (!gas && !brake) state.speed *= Math.pow(0.988, dt * 60);

    const steeringLoad = Math.abs(steering) * Math.min(1, Math.abs(state.speed) / 18);
    const targetSlip = handbrake ? 0.58 + steeringLoad * 0.52 : Math.max(0, steeringLoad - 0.55) * 0.8;
    state.slip = THREE.MathUtils.damp(state.slip, targetSlip, handbrake ? 4.5 : 2.2, dt);
    const grip = handbrake ? PHYSICS.driftGrip : PHYSICS.grip;
    const yawRate = steering * PHYSICS.turn * dt * (0.24 + Math.abs(state.speed) / 20)
      * Math.min(1, Math.abs(state.speed) / 9);
    state.yaw += yawRate * (handbrake ? 1.2 : 1);

    const forward = new THREE.Vector3(Math.cos(state.yaw), 0, -Math.sin(state.yaw));
    const side = new THREE.Vector3(Math.sin(state.yaw), 0, Math.cos(state.yaw));
    const velocity = forward.clone().multiplyScalar(state.speed)
      .addScaledVector(side, -steering * state.slip * (6 + grip));
    state.car.position.addScaledVector(velocity, dt);
    state.car.position.y = 0.1 + Math.abs(state.slip) * 0.07;
    state.car.rotation.y = state.yaw;
    state.car.rotation.z = THREE.MathUtils.damp(state.car.rotation.z, -steering * state.slip * 0.13, 5, dt);
    state.car.rotation.x = THREE.MathUtils.damp(state.car.rotation.x, gas ? -0.018 : brake ? 0.04 : 0, 4, dt);
    state.car.userData.steer = steering;
    updateVehicle(state.car, dt, state.speed, steering, brake || handbrake);
    sparkLight.position.copy(state.car.position).addScaledVector(forward, -1.65).add(new THREE.Vector3(0, 0.7, 0));
    sparkLight.intensity = state.slip > 0.5 && Math.abs(state.speed) > 15 ? 12 + Math.sin(performance.now() * 0.035) * 4 : 0;

    if (state.slip > 0.2 && Math.abs(state.speed) > 16) {
      const scoreRate = state.slip * Math.abs(state.speed);
      state.drift += dt * scoreRate;
      state.score += dt * scoreRate * state.combo;
      const rear = state.car.position.clone().addScaledVector(forward, -1.8);
      for (const offset of [-0.72, 0.72]) {
        const point = rear.clone().addScaledVector(side, offset).add(new THREE.Vector3(0, 0.08, 0));
        placeSkid(point, state.yaw);
        if (random() < 0.56) burst(point, 'smoke', 1);
        if (handbrake && random() < 0.92) burst(point.clone().add(new THREE.Vector3(0, 0.12, 0)), 'sparks', 2);
      }
    }

    updateEffects(dt);
    world.district = state.car.position.z < -210 ? 'SUNSET COAST'
      : state.car.position.x > 330 ? 'CORAL ISLAND'
        : state.car.position.z > 230 ? 'HARBOR DOCKS' : 'NEON DOWNTOWN';
    state.combo = state.slip > 0.35
      ? Math.min(9, state.combo + dt * 0.3)
      : Math.max(1, state.combo - dt * 0.8);
    return state;
  }

  function enterExit() {
    state.active = !state.active;
    state.car.visible = true;
  }

  return { state, step, enterExit, burst };
}
