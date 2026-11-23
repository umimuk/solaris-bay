import * as THREE from '../../vendor/three.module.min.js';
import { createCharacter, animateCharacter } from '../models/characters.js';

const WEAPONS = ['9MM PISTOL', 'MICRO SMG', 'PUMP SHOTGUN', 'TACTICAL RIFLE', 'COMBAT KNIFE'];
const STATS = [
  { rate: 0.24, damage: 35, spread: 0.012, pellets: 1, magazine: 12 },
  { rate: 0.09, damage: 19, spread: 0.035, pellets: 1, magazine: 30 },
  { rate: 0.72, damage: 24, spread: 0.09, pellets: 6, magazine: 8 },
  { rate: 0.13, damage: 32, spread: 0.009, pellets: 1, magazine: 24 },
  { rate: 0.4, damage: 75, spread: 0.02, pellets: 1, magazine: 1 },
];

/** Hitscan combat, weapon cadence, reactive enemies and short-lived tracers. */
export function createBallisticCombat(scene, random) {
  const enemies = [];
  for (let i = 0; i < 11; i++) {
    const enemy = createCharacter('syndicate', i);
    enemy.position.set(240 + random() * 100, 0, 265 + random() * 100);
    enemy.userData.health = 100;
    enemy.userData.attack = random() * 1.6;
    enemy.userData.alive = true;
    scene.add(enemy);
    enemies.push(enemy);
  }

  const muzzleLight = new THREE.PointLight(0xff9d4c, 0, 9);
  scene.add(muzzleLight);
  const ammoByWeapon = [12, 30, 8, 24, 1];
  const reserve = [120, 240, 48, 192, 0];
  let shotCooldown = 0;
  let damageCooldown = 0;
  let recoil = 0;
  let reloadTime = 0;

  function createTracer(origin, direction, color = 0xffd88b) {
    const end = origin.clone().addScaledVector(direction, 38);
    const geometry = new THREE.BufferGeometry().setFromPoints([origin, end]);
    const material = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.96,
      blending: THREE.AdditiveBlending,
    });
    const line = new THREE.Line(geometry, material);
    scene.add(line);
    return { object: line, life: 0.13 };
  }

  function fireWeaponWithBallistics(player, camera, tracers) {
    const index = this.weapon - 1;
    const stats = STATS[index];
    if (!stats || ammoByWeapon[index] <= 0) return;
    ammoByWeapon[index] -= 1;
    this.ammo = ammoByWeapon[index];
    shotCooldown = stats.rate;
    this.flash = 0.08;
    recoil = Math.min(0.08, recoil + (index === 2 ? 0.035 : 0.012));

    const origin = player.clone().add(new THREE.Vector3(0, 1.42, 0));
    const baseDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).normalize();
    const targetHits = new Map();
    for (let pellet = 0; pellet < stats.pellets; pellet++) {
      const direction = baseDirection.clone().add(new THREE.Vector3(
        (random() - 0.5) * stats.spread,
        (random() - 0.5) * stats.spread,
        (random() - 0.5) * stats.spread,
      )).normalize();
      tracers.push(createTracer(origin, direction, index === 1 ? 0x9deeff : 0xffc66e));

      let bestDot = Math.cos(index === 2 ? 0.11 : 0.055);
      let target = null;
      for (const enemy of enemies) {
        if (!enemy.userData.alive) continue;
        const targetPoint = enemy.position.clone().add(new THREE.Vector3(0, 1.15, 0));
        const offset = targetPoint.sub(origin);
        const distance = offset.length();
        const dot = direction.dot(offset.normalize());
        if (distance < 48 && dot > bestDot) {
          target = enemy;
          bestDot = dot;
        }
      }
      if (target) targetHits.set(target, (targetHits.get(target) || 0) + 1);
    }

    for (const [enemy, hits] of targetHits) {
      enemy.userData.health -= stats.damage * hits;
      enemy.userData.reaction = 0.4;
      if (enemy.userData.health <= 0) {
        enemy.userData.alive = false;
        enemy.visible = false;
        this.kills += 1;
      }
    }
  }

  return {
    weapons: WEAPONS,
    unlockedWeapons: WEAPONS.slice(0, 4),
    weapon: 1,
    ammo: ammoByWeapon[0],
    health: 100,
    armor: 65,
    aim: false,
    flash: 0,
    tracers: [],
    wheel: false,
    kills: 0,
    ammoByWeapon,
    reserve,
    enemies,
    step(dt, input, camera, player, enabled = true) {
      this.wheel = input.down('Tab', 'KeyQ');
      for (let index = 0; index < WEAPONS.length; index++) {
        if (input.hit(`Digit${index + 1}`) && this.unlockedWeapons.includes(WEAPONS[index])) this.weapon = index + 1;
      }
      if (input.hit('KeyR') && reserve[this.weapon - 1] > 0 && reloadTime <= 0) {
        const index = this.weapon - 1;
        const needed = STATS[index].magazine - ammoByWeapon[index];
        const loaded = Math.min(needed, reserve[index]);
        ammoByWeapon[index] += loaded;
        reserve[index] -= loaded;
        reloadTime = 0.8;
      }
      shotCooldown = Math.max(0, shotCooldown - dt);
      reloadTime = Math.max(0, reloadTime - dt);
      damageCooldown = Math.max(0, damageCooldown - dt);
      recoil = Math.max(0, recoil - dt * 0.08);
      this.ammo = ammoByWeapon[this.weapon - 1] || 0;

      if (enabled && input.down('Mouse0') && shotCooldown <= 0 && reloadTime <= 0) {
        fireWeaponWithBallistics.call(this, player, camera, this.tracers);
      }
      this.flash = Math.max(0, this.flash - dt);
      muzzleLight.intensity = this.flash > 0 ? 13 : 0;
      muzzleLight.position.copy(player).add(new THREE.Vector3(0.45, 1.25, -0.25));

      this.tracers = this.tracers.filter((tracer) => {
        tracer.life -= dt;
        tracer.object.material.opacity = Math.max(0, tracer.life / 0.13);
        if (tracer.life > 0) return true;
        scene.remove(tracer.object);
        tracer.object.geometry.dispose();
        tracer.object.material.dispose();
        return false;
      });

      for (const enemy of enemies) {
        if (!enemy.userData.alive) continue;
        const delta = player.clone().sub(enemy.position);
        delta.y = 0;
        const distance = delta.length();
        if (distance > 4.5) {
          const step = Math.min(2.8, Math.max(0.6, distance * 0.11));
          enemy.position.addScaledVector(delta.normalize(), dt * step);
          enemy.rotation.y = Math.atan2(-delta.z, delta.x);
        } else if (damageCooldown <= 0 && enabled) {
          damageCooldown = 0.55;
          const damage = 5 + Math.floor(random() * 5);
          const armorDamage = Math.min(this.armor, damage);
          this.armor -= armorDamage;
          this.health = Math.max(0, this.health - (damage - armorDamage));
        }
        enemy.userData.reaction = Math.max(0, (enemy.userData.reaction || 0) - dt);
        animateCharacter(enemy, performance.now() / 1000, distance > 1);
      }
    },
  };
}
