import * as THREE from 'three';
import { makeCity } from './world.js';
import { makePlayer, updatePlayer, jumpPlayer } from './player.js';
import { loadSave, saveGame } from './save.js';
import { drawMap } from './minimap.js';
import { showHud, setPaused } from './hud.js';
import { prepareShot } from './shots.js';

const query = new URLSearchParams(location.search);
const seed = Number(query.get('seed')) || 611;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xb7d5d5);
scene.fog = new THREE.FogExp2(0xdcc7a6, .0022);
const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, .1, 1200);
const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('#view'), antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.6));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;

scene.add(new THREE.HemisphereLight(0xdaf3f0, 0x826b4e, 2.1));
const sun = new THREE.DirectionalLight(0xffd19a, 3.2);
sun.position.set(-55, 105, 45); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -180; sun.shadow.camera.right = 180; sun.shadow.camera.top = 180; sun.shadow.camera.bottom = -180;
scene.add(sun);

const city = makeCity(seed); scene.add(city.root);
const player = makePlayer(scene);
Object.assign(player, loadSave()); player.body.position.set(player.x, 0, player.z);
const overlay = document.querySelector('#overlay'), hud = document.querySelector('#hud');
const keys = new Set();
let playing = false, paused = false, yaw = player.yaw, pitch = .13, last = performance.now(), dragging = false, previousX = 0, previousY = 0;

function enterWorld() {
  playing = true; paused = false; overlay.style.display = 'none'; hud.style.display = 'block'; setPaused(false);
  if (query.get('shot') !== 'foot') document.querySelector('#view').requestPointerLock?.();
}
function togglePause() {
  if (!playing) return;
  paused = !paused; setPaused(paused);
  if (paused) { saveGame(player); document.exitPointerLock?.(); }
  else if (query.get('shot') !== 'foot') document.querySelector('#view').requestPointerLock?.();
}
function setLook(dx, dy) {
  yaw -= dx * .0028; pitch = Math.max(-.12, Math.min(.72, pitch + dy * .0022)); player.yaw = yaw;
}

document.querySelector('#start').addEventListener('click', enterWorld);
document.addEventListener('keydown', (event) => {
  keys.add(event.code);
  if (['Space', 'ArrowUp', 'ArrowDown'].includes(event.code)) event.preventDefault();
  if (event.code === 'Escape' && !event.repeat) togglePause();
  if (event.code === 'Space' && playing && !paused && !event.repeat) jumpPlayer(player);
});
document.addEventListener('keyup', (event) => keys.delete(event.code));
document.addEventListener('mousemove', (event) => {
  if (document.pointerLockElement === renderer.domElement) setLook(event.movementX, event.movementY);
  else if (dragging) { setLook(event.clientX - previousX, event.clientY - previousY); previousX = event.clientX; previousY = event.clientY; }
});
renderer.domElement.addEventListener('pointerdown', (event) => {
  dragging = true; previousX = event.clientX; previousY = event.clientY;
  if (playing && !paused && query.get('shot') !== 'foot') renderer.domElement.requestPointerLock?.();
});
addEventListener('pointerup', () => { dragging = false; });
addEventListener('blur', () => keys.clear());
addEventListener('beforeunload', () => saveGame(player));
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

function positionCamera() {
  const distance = 8.2;
  const target = new THREE.Vector3(player.x, player.y + 2.05, player.z);
  const horizontal = Math.cos(pitch) * distance;
  camera.position.set(player.x - Math.sin(yaw) * horizontal, player.y + 2.7 + Math.sin(pitch) * distance, player.z - Math.cos(yaw) * horizontal);
  camera.lookAt(target);
}

const shot = query.get('shot');
prepareShot(shot, player, enterWorld);
yaw = player.yaw;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(.045, (now - last) / 1000); last = now;
  if (playing && !paused) {
    updatePlayer(player, keys, dt, city);
    positionCamera(); showHud(player); drawMap(document.querySelector('#map'), city, player);
    if (Math.floor(now / 7000) !== Math.floor((now - dt * 1000) / 7000)) saveGame(player);
  } else if (!playing && !shot) {
    yaw += dt * .035; positionCamera();
  }
  renderer.render(scene, camera);
}
positionCamera(); requestAnimationFrame(frame);
