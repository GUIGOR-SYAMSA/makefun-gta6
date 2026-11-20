import * as THREE from 'three';

const RADIUS = .72;
export function makePlayer(scene) {
  const body = new THREE.Group();
  const cloth = new THREE.MeshStandardMaterial({ color: 0xc85f46, roughness: .78 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x344b4b, roughness: .88 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xc99069, roughness: .8 });
  const hair = new THREE.MeshStandardMaterial({ color: 0x302b27, roughness: .9 });
  function part(geometry, material, x, y, z) {
    const mesh = new THREE.Mesh(geometry, material); mesh.position.set(x, y, z); mesh.castShadow = true; body.add(mesh); return mesh;
  }
  part(new THREE.BoxGeometry(.94, 1.12, .48), cloth, 0, 1.72, 0);
  part(new THREE.BoxGeometry(.34, .9, .38), dark, -.27, .65, 0);
  part(new THREE.BoxGeometry(.34, .9, .38), dark, .27, .65, 0);
  part(new THREE.BoxGeometry(.28, .86, .34), cloth, -.67, 1.78, 0);
  part(new THREE.BoxGeometry(.28, .86, .34), cloth, .67, 1.78, 0);
  part(new THREE.SphereGeometry(.39, 10, 8), skin, 0, 2.57, 0);
  part(new THREE.SphereGeometry(.4, 10, 6), hair, 0, 2.83, -.04);
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(.82, 16), new THREE.MeshBasicMaterial({ color: 0x273b39, transparent: true, opacity: .25, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = .035; body.add(shadow);
  scene.add(body);
  return { x: 0, z: 0, y: 0, vy: 0, yaw: 0, health: 100, cash: 2450, body, radius: RADIUS, moving: false };
}

function overlaps(x, z, solid) {
  const cx = Math.max(solid.x, Math.min(x, solid.x + solid.w));
  const cz = Math.max(solid.z, Math.min(z, solid.z + solid.d));
  return (x - cx) ** 2 + (z - cz) ** 2 < RADIUS ** 2;
}

function canStand(x, z, city) {
  if (Math.abs(x) > city.edge - 5 || z < -city.edge - 25 || z > city.edge - 5) return false;
  for (const solid of city.solids) if (overlaps(x, z, solid)) return false;
  return true;
}

function moveAxis(player, axis, amount, city) {
  if (!amount) return;
  const x = axis === 'x' ? player.x + amount : player.x;
  const z = axis === 'z' ? player.z + amount : player.z;
  if (canStand(x, z, city)) player[axis] = axis === 'x' ? x : z;
}

export function updatePlayer(player, keys, dt, city) {
  const forward = (keys.has('KeyW') ? 1 : 0) - (keys.has('KeyS') ? 1 : 0);
  const side = (keys.has('KeyD') ? 1 : 0) - (keys.has('KeyA') ? 1 : 0);
  const magnitude = Math.hypot(forward, side) || 1;
  const speed = keys.has('ShiftLeft') || keys.has('ShiftRight') ? 11 : 6.4;
  const dx = (Math.sin(player.yaw) * forward + Math.cos(player.yaw) * side) * speed * dt / magnitude;
  const dz = (Math.cos(player.yaw) * forward - Math.sin(player.yaw) * side) * speed * dt / magnitude;
  moveAxis(player, 'x', dx, city); moveAxis(player, 'z', dz, city);
  player.moving = Math.abs(dx) + Math.abs(dz) > 0.001;
  player.vy -= 23 * dt; player.y += player.vy * dt;
  if (player.y < 0) { player.y = 0; player.vy = 0; }
  player.body.position.set(player.x, player.y, player.z);
  player.body.rotation.y = player.yaw;
  player.body.position.y += player.moving ? Math.abs(Math.sin(performance.now() * .012)) * .045 : 0;
}

export function jumpPlayer(player) { if (player.y <= .001) player.vy = 8.2; }

const STAMINA_MAX = 100, STAMINA_FLOOR = 15, STAMINA_DRAIN = 22, STAMINA_REFILL = 14;
export function canSprint(player) {
  if (player.stamina === undefined) player.stamina = STAMINA_MAX;
  return player.stamina > STAMINA_FLOOR;
}
export function sprintTick(player, dt, sprinting) {
  if (player.stamina === undefined) player.stamina = STAMINA_MAX;
  if (sprinting && player.stamina > 0) player.stamina = Math.max(0, player.stamina - STAMINA_DRAIN * dt);
  else player.stamina = Math.min(STAMINA_MAX, player.stamina + STAMINA_REFILL * dt);
}
export function staminaPct(player) {
  if (player.stamina === undefined) player.stamina = STAMINA_MAX;
  return Math.round(player.stamina / STAMINA_MAX * 100);
}
