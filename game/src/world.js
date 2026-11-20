import * as THREE from 'three';
import { seeded } from './random.js';

export const BLOCK = 40;
export const CITY_RADIUS = 5;
export const CITY_EDGE = BLOCK * (CITY_RADIUS + 1);
const palette = [0xd7ad83, 0xf0d4a7, 0xc98369, 0xaec2b1, 0xd1c9b6, 0xe3b57d, 0x9db9bc, 0xe8d3bd];

function material(color, roughness = 0.86) { return new THREE.MeshStandardMaterial({ color, roughness }); }

function box(group, x, y, z, w, h, d, mat, cast = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y + h / 2, z);
  mesh.receiveShadow = true;
  mesh.castShadow = cast;
  group.add(mesh);
  return mesh;
}

function makePalm(group, x, z, height, bark, leaf) {
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.21, .36, height, 7), bark);
  trunk.position.set(x, height / 2, z); trunk.rotation.z = -.08; trunk.castShadow = true; group.add(trunk);
  for (let i = 0; i < 7; i += 1) {
    const angle = i * Math.PI * 2 / 7;
    const frond = new THREE.Mesh(new THREE.ConeGeometry(.48, height * .58, 5), leaf);
    frond.position.set(x + Math.cos(angle) * 1.35, height + .12, z + Math.sin(angle) * 1.35);
    frond.rotation.z = Math.cos(angle) * .93; frond.rotation.x = Math.sin(angle) * .93;
    frond.castShadow = true; group.add(frond);
  }
}

function makeLamp(group, x, z, metal, glow) {
  box(group, x, 0, z, .18, 4.6, .18, metal);
  box(group, x + .56, 4.42, z, 1.18, .14, .16, metal);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(.24, 8, 6), glow);
  bulb.position.set(x + 1.08, 4.15, z); group.add(bulb);
}

function makeLighthouse(group, x, z) {
  const stone = material(0x8a8578), white = material(0xf2ede2), red = material(0xc4452f), dark = material(0x2c3436);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(4.4, 5.2, 2.4, 10), stone);
  base.position.set(x, 1.2, z); base.castShadow = true; base.receiveShadow = true; group.add(base);
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 2.7, 22, 12), white);
  tower.position.set(x, 13.4, z); tower.castShadow = true; tower.receiveShadow = true; group.add(tower);
  const bandA = new THREE.Mesh(new THREE.CylinderGeometry(2.42, 2.42, 1.4, 12), red);
  bandA.position.set(x, 9.4, z); bandA.castShadow = true; group.add(bandA);
  const bandB = new THREE.Mesh(new THREE.CylinderGeometry(2.08, 2.08, 1.4, 12), red);
  bandB.position.set(x, 16.9, z); bandB.castShadow = true; group.add(bandB);
  const lampRoom = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 2.2, 10), dark);
  lampRoom.position.set(x, 25.5, z); lampRoom.castShadow = true; group.add(lampRoom);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(.85, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffe9a8 }));
  lamp.position.set(x, 25.5, z); group.add(lamp);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(2.1, 1.6, 10), dark);
  cap.position.set(x, 27.4, z); cap.castShadow = true; group.add(cap);
  const beam = new THREE.Group();
  beam.position.set(x, 25.5, z);
  const coneMat = new THREE.MeshBasicMaterial({ color: 0xffe9a8, transparent: true, opacity: .16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const coneA = new THREE.Mesh(new THREE.ConeGeometry(2.6, 30, 12, 1, true), coneMat);
  coneA.rotation.z = Math.PI / 2; coneA.position.x = 15; beam.add(coneA);
  const coneB = new THREE.Mesh(new THREE.ConeGeometry(2.6, 30, 12, 1, true), coneMat);
  coneB.rotation.z = -Math.PI / 2; coneB.position.x = -15; beam.add(coneB);
  const sweep = () => { beam.rotation.y = performance.now() * .00045; };
  coneA.onBeforeRender = sweep; coneB.onBeforeRender = sweep;
  group.add(beam);
  return beam;
}

function makePier(group, x, zFrom, zTo) {
  const plankMat = material(0x8a6a48), postMat = material(0x5f4630);
  for (let z = zFrom; z >= zTo; z -= 2.2) {
    box(group, x, .55, z, 4.6, .22, 1.9, plankMat);
  }
  for (let z = zFrom; z >= zTo; z -= 6.6) {
    for (const side of [-2, 2]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(.28, .28, 2.4, 8), postMat);
      post.position.set(x + side, -.4, z); post.castShadow = true; group.add(post);
    }
  }
  for (const side of [-2, 2]) {
    const mooring = new THREE.Mesh(new THREE.CylinderGeometry(.34, .34, 3.4, 8), postMat);
    mooring.position.set(x + side, .1, zTo + 1); mooring.castShadow = true; group.add(mooring);
  }
}

function building(group, rng, x, z, w, d, list) {
  const h = 7 + rng() * 24;
  const color = palette[Math.floor(rng() * palette.length)];
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material(color));
  body.position.set(x, h / 2, z); body.castShadow = true; body.receiveShadow = true; body.userData.solid = true;
  group.add(body); list.push({ x: x - w / 2, z: z - d / 2, w, d });
  const roofMat = material([0xb65e49, 0x8f8d78, 0xe7c59a, 0x698b88][Math.floor(rng() * 4)]);
  box(group, x, h + .12, z, w + .15, .24, d + .15, roofMat);
  if (rng() > .45) {
    box(group, x + (rng() - .5) * w * .5, h + .7, z + (rng() - .5) * d * .5, 2.1, .9, 1.8, material(0xe8d2af));
  }
  if (rng() < .42) {
    const tankX = x + (rng() - .5) * w * .55, tankZ = z + (rng() - .5) * d * .55;
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(.95, .95, 1.7, 10), material(0x8d8578));
    tank.position.set(tankX, h + 1.21, tankZ); tank.castShadow = true; group.add(tank);
    const tankTop = new THREE.Mesh(new THREE.ConeGeometry(1.05, .7, 10), material(0x6e675c));
    tankTop.position.set(tankX, h + 2.41, tankZ); tankTop.castShadow = true; group.add(tankTop);
  }
  if (rng() > .55) {
    const roomH = 1.1 + rng() * 2.4;
    box(group, x + (rng() - .5) * w * .4, h + .36, z + (rng() - .5) * d * .4, 2.6 + rng() * 1.6, roomH, 2.2 + rng() * 1.4, material(0xd8c39a));
  }
  const windowMat = material(0x537b7c, .34);
  const rows = Math.max(1, Math.floor(h / 3.5));
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < Math.max(1, Math.floor(w / 3)); col += 1) {
      const wx = x - w / 2 + 1.3 + col * 2.7;
      const wy = 1.8 + row * 3.2;
      if (wy < h - .8 && wx < x + w / 2 - .6) box(group, wx, wy, z + d / 2 + .035, 1.05, 1.55, .07, windowMat, false);
    }
  }
}

export function makeCity(seed = 611) {
  const rng = seeded(seed || 611), root = new THREE.Group(), solids = [], buildings = [], props = [];
  const sand = material(0xd9bd91), road = material(0x555958), sidewalk = material(0xd6c5a5), paint = material(0xe8d5a9);
  const grass = material(0x9b9b69), palmBark = material(0x76543b), palmLeaf = material(0x436c54);
  const lampMetal = material(0x334b4b), lampGlow = new THREE.MeshBasicMaterial({ color: 0xffd68a });
  const water = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000), new THREE.MeshStandardMaterial({ color: 0x4fabb0, roughness: .3, metalness: .12 }));
  water.rotation.x = -Math.PI / 2; water.position.set(0, -.12, -CITY_EDGE - 440); root.add(water);
  box(root, 0, -.12, -CITY_EDGE - 22, 1400, .18, 32, sand, false);
  box(root, 0, -.22, 0, CITY_EDGE * 2 + 160, .35, CITY_EDGE * 2 + 160, grass, false);
  const span = CITY_EDGE * 2;
  for (let i = -CITY_RADIUS; i <= CITY_RADIUS; i += 1) {
    const p = i * BLOCK;
    box(root, p, -.04, 0, 11, .12, span, road, false);
    box(root, 0, -.035, p, span, .13, 11, road, false);
    box(root, p - 7.1, .02, 0, 2.9, .16, span, sidewalk, false);
    box(root, p + 7.1, .02, 0, 2.9, .16, span, sidewalk, false);
    box(root, 0, .02, p - 7.1, span, .16, 2.9, sidewalk, false);
    box(root, 0, .02, p + 7.1, span, .16, 2.9, sidewalk, false);
    for (let dash = -CITY_RADIUS; dash < CITY_RADIUS; dash += 1) {
      box(root, p, .045, dash * BLOCK + 8, .16, .035, 5, paint, false);
      box(root, dash * BLOCK + 8, .045, p, 5, .035, .16, paint, false);
    }
  }
  for (let gx = -CITY_RADIUS; gx < CITY_RADIUS; gx += 1) {
    for (let gz = -CITY_RADIUS; gz < CITY_RADIUS; gz += 1) {
      const centerX = gx * BLOCK + BLOCK / 2, centerZ = gz * BLOCK + BLOCK / 2;
      if (centerZ < -CITY_EDGE + 42 && rng() < .6) continue;
      const inset = 3 + rng() * 2, w = BLOCK - 16 - inset, d = BLOCK - 16 - inset;
      building(root, rng, centerX, centerZ, w, d, solids);
      buildings.push([centerX, centerZ]);
    }
  }
  // The eastern shore turns into a public promenade and a timber pier.
  box(root, CITY_EDGE + 16, .08, -20, 6, .3, CITY_EDGE * 1.7, material(0xb99168), false);
  box(root, CITY_EDGE + 76, .02, -CITY_EDGE - 230, 12, .32, 260, material(0x997552), false);
  makePier(root, 120, -258, -382);
  makeLighthouse(root, CITY_EDGE + 30, -CITY_EDGE - 30);
  props.push({ kind: 'pier', x: 120, z: -320 }, { kind: 'lighthouse', x: CITY_EDGE + 30, z: -CITY_EDGE - 30 });
  for (let z = -CITY_EDGE - 350; z < CITY_EDGE; z += 18) {
    makePalm(root, CITY_EDGE + 9, z, 7 + rng() * 3, palmBark, palmLeaf);
    props.push({ kind: 'palm', x: CITY_EDGE + 9, z });
  }
  for (let x = -CITY_RADIUS * BLOCK; x <= CITY_RADIUS * BLOCK; x += 40) {
    makeLamp(root, x - 5, -5.7, lampMetal, lampGlow);
    props.push({ kind: 'lamp', x: x - 5, z: -5.7 });
  }
  // Benches and hydrants make the curb line readable at walking height.
  const benchMat = material(0x765342), hydrantMat = material(0xc85a45);
  for (let x = -CITY_EDGE + 18; x < CITY_EDGE; x += 38) {
    box(root, x, .2, 8.8, 2.5, .22, .75, benchMat);
    box(root, x, .65, 8.5, 2.5, .85, .18, benchMat);
    box(root, x + 5, .02, -8.5, .55, .9, .55, hydrantMat);
    props.push({ kind: 'bench', x, z: 8.8 }, { kind: 'hydrant', x: x + 5, z: -8.5 });
  }
  return { root, solids, buildings, props, seed: seed || 611, edge: CITY_EDGE };
}
