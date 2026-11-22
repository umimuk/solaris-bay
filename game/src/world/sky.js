import * as THREE from '../../vendor/three.module.min.js';
import { createRandom } from '../random.js';

const SKY_MODES = {
  sunset: { upper: '#72b9df', middle: '#d99caf', horizon: '#f4c694', sun: '#fff0c5' },
  golden: { upper: '#7bc0e3', middle: '#e7a9a9', horizon: '#f8d39a', sun: '#fff1c9' },
  'wet-night': { upper: '#080d24', middle: '#171a3d', horizon: '#303451', sun: '#f05d68' },
  midnight: { upper: '#050916', middle: '#101a32', horizon: '#263049', sun: '#9ab8e8' },
  harbor: { upper: '#19213d', middle: '#696076', horizon: '#efa16a', sun: '#ffd28b' },
  garage: { upper: '#1b2437', middle: '#4c566d', horizon: '#d48f67', sun: '#ffd18e' },
};

/** Procedural sky dome, sunset disc, stars and local weather lighting. */
export function createSky(scene, seed = 1) {
  const domeMaterial = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      horizonColor: { value: new THREE.Color(SKY_MODES.sunset.horizon) },
      middleColor: { value: new THREE.Color(SKY_MODES.sunset.middle) },
      zenithColor: { value: new THREE.Color(SKY_MODES.sunset.upper) },
      sunDirection: { value: new THREE.Vector3(-0.66, 0.16, -0.73).normalize() },
      sunColor: { value: new THREE.Color(SKY_MODES.sunset.sun) },
    },
    vertexShader: `
      varying vec3 vWorldDirection;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldDirection = normalize(worldPosition.xyz - cameraPosition);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vWorldDirection;
      uniform vec3 horizonColor;
      uniform vec3 middleColor;
      uniform vec3 zenithColor;
      uniform vec3 sunDirection;
      uniform vec3 sunColor;
      void main() {
        float height = normalize(vWorldDirection).y;
        float horizon = 1.0 - smoothstep(-0.02, 0.46, abs(height));
        vec3 sky = mix(middleColor, zenithColor, smoothstep(0.0, 0.72, height));
        sky = mix(sky, horizonColor, horizon * (0.72 + 0.28 * (1.0 - smoothstep(-0.08, 0.08, height))));
        float sunAngle = acos(clamp(dot(normalize(vWorldDirection), normalize(sunDirection)), -1.0, 1.0));
        float disc = 1.0 - smoothstep(0.018, 0.026, sunAngle);
        float halo = exp(-sunAngle * 34.0) * 0.52;
        sky += sunColor * (disc * 2.8 + halo * horizon);
        gl_FragColor = vec4(sky, 1.0);
      }
    `,
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1200, 48, 32), domeMaterial);
  dome.renderOrder = -10;
  scene.add(dome);

  const hemisphere = new THREE.HemisphereLight(0xcce5f2, 0x8a7058, 1.55);
  const sun = new THREE.DirectionalLight(0xffd7a0, 3.1);
  sun.position.set(-80, 24, -95);
  const ambient = new THREE.AmbientLight(0x7590b5, 0.34);
  scene.add(hemisphere, sun, ambient);

  const random = createRandom(seed);
  const starPositions = new Float32Array(600 * 3);
  for (let i = 0; i < 600; i++) {
    const angle = random() * Math.PI * 2;
    const radius = 500 + random() * 350;
    starPositions[i * 3] = Math.cos(angle) * radius;
    starPositions[i * 3 + 1] = 50 + random() * 650;
    starPositions[i * 3 + 2] = Math.sin(angle) * radius;
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const stars = new THREE.Points(
    starGeometry,
    new THREE.PointsMaterial({ color: 0xd4e5ff, size: 1.25, transparent: true, opacity: 0.72, sizeAttenuation: false }),
  );
  scene.add(stars);

  const rainPositions = new Float32Array(1000 * 3);
  for (let i = 0; i < 1000; i++) {
    rainPositions[i * 3] = (random() - 0.5) * 100;
    rainPositions[i * 3 + 1] = random() * 72;
    rainPositions[i * 3 + 2] = (random() - 0.5) * 100;
  }
  const rainGeometry = new THREE.BufferGeometry();
  rainGeometry.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
  const rain = new THREE.Points(
    rainGeometry,
    new THREE.PointsMaterial({ color: 0xaad8f2, size: 0.14, transparent: true, opacity: 0.64, depthWrite: false }),
  );
  rain.visible = false;
  scene.add(rain);

  return { dome, hemisphere, sun, ambient, stars, rain, time: 0.72, mode: 'sunset' };
}

/** Update sky palette, key/fill balance and local rain for the selected scene. */
export function updateSky(sky, dt, mode = 'sunset') {
  const palette = SKY_MODES[mode] || SKY_MODES.sunset;
  sky.mode = mode;
  sky.time = (sky.time + dt * 0.004) % 1;
  const uniforms = sky.dome.material.uniforms;
  uniforms.horizonColor.value.set(palette.horizon);
  uniforms.middleColor.value.set(palette.middle);
  uniforms.zenithColor.value.set(palette.upper);
  uniforms.sunColor.value.set(palette.sun);

  const night = mode === 'midnight' || mode === 'wet-night';
  sky.sun.intensity = mode === 'sunset' || mode === 'golden' || mode === 'harbor' ? 3.1 : mode === 'garage' ? 1.55 : mode === 'wet-night' ? 0.46 : 0.16;
  sky.sun.color.set(mode === 'garage' ? '#f7c99a' : palette.sun);
  sky.hemisphere.intensity = night ? 0.86 : mode === 'garage' ? 0.9 : 1.5;
  sky.hemisphere.color.set(night ? '#7389cf' : '#d4e9f1');
  sky.ambient.intensity = night ? 0.88 : mode === 'garage' ? 0.82 : 0.52;
  sky.stars.material.opacity = night ? 0.84 : 0.12;
  sky.rain.visible = mode === 'wet-night';

  if (sky.rain.visible) {
    const positions = sky.rain.geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      let y = positions.getY(i) - dt * 55;
      if (y < 0) y = 72;
      positions.setY(i, y);
    }
    positions.needsUpdate = true;
  }
}
