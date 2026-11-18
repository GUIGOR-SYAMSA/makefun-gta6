import * as THREE from 'three';
import { makeCity } from './world.js';
import { makePlayer, updatePlayer, jumpPlayer } from './player.js';
import { loadSave, saveGame } from './save.js';
import { drawMap } from './minimap.js';
import { showHud, setPaused } from './hud.js';
import { prepareShot } from './shots.js';
import { makeTraffic, updateTraffic, movePlayerCar } from './traffic.js';

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
const traffic = makeTraffic(scene);
const player = makePlayer(scene);
const saved = loadSave(); Object.assign(player, saved); player.body.position.set(player.x, 0, player.z);
let activeCar = saved.inCar ? traffic.parked[saved.carIndex] : null;
if (activeCar && saved.carX !== undefined) { activeCar.x=saved.carX; activeCar.z=saved.carZ; activeCar.yaw=saved.carYaw; activeCar.root.position.set(activeCar.x,0,activeCar.z); activeCar.root.rotation.y=activeCar.yaw; }
if (activeCar) player.body.visible = false;
const overlay = document.querySelector('#overlay'), hud = document.querySelector('#hud');
const keys = new Set();
let playing = false, paused = false, yaw = player.yaw, pitch = .13, last = performance.now(), dragging = false, previousX = 0, previousY = 0;

function enterWorld() {
  playing = true; paused = false; overlay.style.display = 'none'; hud.style.display = 'block'; setPaused(false);
  if (!['foot', 'drive'].includes(query.get('shot'))) document.querySelector('#view').requestPointerLock?.();
}
function togglePause() {
  if (!playing) return;
  paused = !paused; setPaused(paused);
  if (paused) { saveGame(player, activeCar, traffic.parked); document.exitPointerLock?.(); }
  else if (!['foot', 'drive'].includes(query.get('shot'))) document.querySelector('#view').requestPointerLock?.();
}
function setLook(dx, dy) {
  yaw -= dx * .0028; pitch = Math.max(-.12, Math.min(.72, pitch + dy * .0022)); player.yaw = yaw;
}

document.querySelector('#start').addEventListener('click', enterWorld);
document.addEventListener('keydown', (event) => {
  keys.add(event.code);
  if (event.code === 'KeyE' && !event.repeat && playing && !paused) toggleCar();
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
addEventListener('beforeunload', () => saveGame(player, activeCar, traffic.parked));
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

function positionCamera() {
  const subject = activeCar || player, cameraYaw = activeCar ? activeCar.yaw : yaw;
  const distance = activeCar ? 12 : 8.2;
  const target = new THREE.Vector3(subject.x, activeCar ? 1.1 : player.y + 2.05, subject.z);
  const horizontal = Math.cos(pitch) * distance;
  camera.position.set(subject.x - Math.sin(cameraYaw) * horizontal, (activeCar ? 3.2 : player.y + 2.7) + Math.sin(pitch) * distance, subject.z - Math.cos(cameraYaw) * horizontal);
  camera.lookAt(target);
}

function toggleCar() {
  if (activeCar) {
    const car=activeCar; activeCar=null; player.body.visible=true;
    player.x=car.x+Math.cos(car.yaw)*3; player.z=car.z-Math.sin(car.yaw)*3;
    player.yaw=car.yaw; yaw=car.yaw; player.body.position.set(player.x,0,player.z); player.body.rotation.y=yaw;
  } else {
    const car=traffic.parked.find(candidate=>Math.hypot(candidate.x-player.x,candidate.z-player.z)<4.8);
    if(car){activeCar=car;car.speed=0;yaw=car.yaw;player.body.visible=false;}
  }
}

const shot = query.get('shot');
if (query.get('audit') === '1') window.__solmarAudit = () => ({
  player: { x: player.x, z: player.z },
  activeCar: activeCar ? { x: activeCar.x, z: activeCar.z, yaw: activeCar.yaw, speed: activeCar.speed } : null,
  camera: { x: camera.position.x, z: camera.position.z },
  traffic: traffic.cars.map(car => ({ x: car.x, z: car.z })),
  pedestrians: traffic.people.map(person => ({ x: person.x, z: person.z })),
});
prepareShot(shot, player, enterWorld);
if (shot === 'drive') { activeCar=traffic.parked[0]; player.body.visible=false; activeCar.speed=0; enterWorld(); }
yaw = player.yaw;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(.045, (now - last) / 1000); last = now;
  if (playing && !paused) {
    if (activeCar) movePlayerCar(activeCar, keys, dt, city, traffic);
    else updatePlayer(player, keys, dt, city);
    updateTraffic(traffic, city, dt, activeCar);
    positionCamera(); showHud(player, activeCar); drawMap(document.querySelector('#map'), city, player, traffic, activeCar);
    if (Math.floor(now / 7000) !== Math.floor((now - dt * 1000) / 7000)) saveGame(player, activeCar, traffic.parked);
  } else if (!playing && !shot) {
    yaw += dt * .035; positionCamera();
  }
  renderer.render(scene, camera);
}
positionCamera(); requestAnimationFrame(frame);
