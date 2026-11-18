import * as THREE from 'three';
import { makeCity } from './world.js';
import { makePlayer, updatePlayer, jumpPlayer } from './player.js';
import { loadSave, saveGame } from './save.js';
import { drawMap } from './minimap.js';
import { showHud, setPaused } from './hud.js';
import { prepareShot } from './shots.js';
import { makeTraffic, updateTraffic, movePlayerCar, setPolice, fleePeople } from './traffic.js';
import { STORY, freshMissions, missionDefinition } from './missions.js';
import { sound } from './sound.js';

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
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
const mission = freshMissions(saved.mission); sound.mute(!!saved.muted);
let activeCar = shot === 'chase' ? null : saved.inCar ? traffic.parked[saved.carIndex] : null;
if (activeCar && saved.carX !== undefined) { activeCar.x=saved.carX; activeCar.z=saved.carZ; activeCar.yaw=saved.carYaw; activeCar.root.position.set(activeCar.x,0,activeCar.z); activeCar.root.rotation.y=activeCar.yaw; }
if (activeCar) player.body.visible = false;
const overlay = document.querySelector('#overlay'), hud = document.querySelector('#hud');
const keys = new Set();
let playing = false, paused = false, yaw = player.yaw, pitch = .13, last = performance.now(), dragging = false, previousX = 0, previousY = 0;
player.wanted=Math.max(0,Math.min(5,player.wanted||0)); player.safeX=player.x; player.safeZ=player.z;
let wantedClock=0, bustedClock=0, shotCooldown=0, lastCrime=0, deathMode='', chaseStaged=false;
let missionCall=false, callClock=0, doneClock=0, callTimer=0, repeatTimer=0;
const objectiveEl=document.querySelector('.objective'), callEl=document.querySelector('#call');
document.querySelector('#story').textContent=STORY.intro;
function save(){saveGame(player,activeCar,traffic.parked,mission,sound.muted);}
function beginCall(){missionCall=true;callClock=3;const def=missionDefinition(mission);document.querySelector('#callTitle').textContent=`MARA · ${def.title}`;document.querySelector('#callText').textContent=def.call;callEl.style.display='grid';clearTimeout(callTimer);callTimer=setTimeout(()=>{if(missionCall)activateMission();},3000);}
function activateMission(){missionCall=false;clearTimeout(callTimer);callEl.style.display='none';const def=missionDefinition(mission);mission.active=true;mission.phase=def.phase;mission.reward=def.reward;mission.point=def.point?{...def.point}:mission.stage>=3?{x:-80,z:0}:null;}
function finishMission(){const reward=mission.reward||500;player.cash+=reward;mission.active=false;mission.complete=true;mission.point=null;mission.phase='';mission.stage=Math.min(3,mission.stage+1);if(mission.stage>=3)mission.repeatIndex++;doneClock=2.2;document.querySelector('#done').textContent=`${STORY.done} — $${reward.toLocaleString()}`;document.querySelector('#done').style.display='block';sound.complete();clearTimeout(repeatTimer);repeatTimer=setTimeout(()=>{if(!mission.active&&!missionCall)beginCall();},4000);save();}
function progressMission(){if(mission.active&&mission.point&&activeCar&&Math.hypot(activeCar.x-mission.point.x,activeCar.z-mission.point.z)<9){if(mission.phase==='pickup'){sound.pickup();if(mission.stage===0)finishMission();else{mission.phase='drop';mission.point={x:80,z:-80};if(mission.stage===1)addWanted(1);else save();}}else if(mission.phase==='drop')finishMission();}if(mission.active&&mission.phase==='escape'&&player.wanted===0)finishMission();}
function updateObjective(){if(mission.active){const text=mission.phase==='escape'?STORY.jobs[2].objective:mission.phase==='drop'?'Deliver the package':'Pick up the package';let detail='';if(mission.point){const dx=mission.point.x-player.x,dz=mission.point.z-player.z,dist=Math.hypot(dx,dz),angle=Math.atan2(dx,dz);const dirs=['N','NE','E','SE','S','SW','W','NW'];detail=`${Math.round(dist)} M · ${dirs[Math.round((((angle%(Math.PI*2))+Math.PI*2)%(Math.PI*2))/(Math.PI/4))%8]}`;}objectiveEl.innerHTML=`${text}<small>${detail||'SHAKE THE HEAT'}</small>`;}else if(missionCall){objectiveEl.innerHTML='MARA IS CALLING<small>NEW JOB INCOMING</small>';}else{objectiveEl.innerHTML='NO ACTIVE JOB<small>MARA WILL CALL</small>';}}

function enterWorld() {
  sound.init();
  playing = true; paused = false; overlay.style.display = 'none'; hud.style.display = 'block'; setPaused(false);
  if(!mission.active&&!missionCall)beginCall();
  if (!['foot', 'drive', 'chase'].includes(query.get('shot'))) document.querySelector('#view').requestPointerLock?.();
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
  sound.init();
  if (deathMode) { if (!event.repeat) continueAfterDeath(); return; }
  keys.add(event.code);
  if(event.code==='KeyM'&&!event.repeat){sound.init();sound.mute(!sound.muted);save();}
  if (event.code === 'KeyE' && !event.repeat && playing && !paused) toggleCar();
  if (['Space', 'ArrowUp', 'ArrowDown'].includes(event.code)) event.preventDefault();
  if (event.code === 'Escape' && !event.repeat) togglePause();
  if (event.code === 'Space' && playing && !paused && !event.repeat) jumpPlayer(player);
  if (['KeyF','KeyG'].includes(event.code) && playing && !paused && !event.repeat) attack(event.code === 'KeyG');
});
document.addEventListener('keyup', (event) => keys.delete(event.code));
document.addEventListener('mousemove', (event) => {
  if (document.pointerLockElement === renderer.domElement) setLook(event.movementX, event.movementY);
  else if (dragging) { setLook(event.clientX - previousX, event.clientY - previousY); previousX = event.clientX; previousY = event.clientY; }
});
renderer.domElement.addEventListener('pointerdown', (event) => {
  dragging = true; previousX = event.clientX; previousY = event.clientY;
  if (playing && !paused && query.get('shot') !== 'foot') renderer.domElement.requestPointerLock?.();
  if (event.button===0 && playing && !paused && !activeCar) attack(false);
});
addEventListener('pointerup', () => { dragging = false; });
addEventListener('blur', () => keys.clear());
addEventListener('beforeunload', save);
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
    if(car){ if (seenByWitness(car.x,car.z)) addWanted(1); activeCar=car;car.speed=0;yaw=car.yaw;player.body.visible=false; }
  }
}

function seenByWitness(x,z){return traffic.people.some(p=>!p.down&&Math.hypot(p.x-x,p.z-z)<42)||traffic.cars.some(c=>Math.hypot(c.x-x,c.z-z)<50)||traffic.police.some(c=>Math.hypot(c.x-x,c.z-z)<70);}
function addWanted(amount){player.wanted=Math.min(5,player.wanted+amount);lastCrime=performance.now();wantedClock=0;}
function attack(shoot){
  if(shoot)sound.gun();else sound.punch();
  if(shoot){if(activeCar||shotCooldown>0)return;shotCooldown=.42;if(seenByWitness(player.x,player.z))addWanted(1);fleePeople(traffic,player.x+Math.sin(yaw)*2,player.z+Math.cos(yaw)*2);
    let target=null,best=20;
    for(const p of traffic.people){if(p.down)continue;const dx=p.x-player.x,dz=p.z-player.z,d=Math.hypot(dx,dz),dot=(dx*Math.sin(yaw)+dz*Math.cos(yaw))/Math.max(d,.01);if(dot>.92&&d<best){target=p;best=d;}}
    if(target){target.down=true;target.downAt=performance.now();target.root.rotation.x=Math.PI/2;target.root.position.y=.05;target.flee=0;}
    for(const c of traffic.police)if(Math.hypot(c.x-player.x,c.z-player.z)<75)c.fireUntil=performance.now()+3900;
  } else {if(activeCar)return;const p=traffic.people.find(v=>!v.down&&Math.hypot(v.x-player.x,v.z-player.z)<2.8);if(p){p.flee=4;p.targetX=p.x+Math.sin(yaw)*-12;p.targetZ=p.z-Math.cos(yaw)*12;addWanted(seenByWitness(p.x,p.z)?1:0);}}
}
function die(type){if(deathMode)return; sound.sting();deathMode=type;playing=false;const lost=Math.min(player.cash,Math.ceil(player.cash*.2));player.cash-=lost;player.wanted=0;player.health=100;player.x=type==='WASTED'?0:player.safeX;player.z=type==='WASTED'?0:player.safeZ;player.body.position.set(player.x,0,player.z);player.body.visible=true;activeCar=null;document.querySelector('#deathTitle').textContent=type;document.querySelector('#deathText').textContent=`CASH LOST: $${lost.toLocaleString()}`;document.querySelector('#death').style.display='grid';document.exitPointerLock?.();save();}
function continueAfterDeath(){deathMode='';document.querySelector('#death').style.display='none';playing=true;overlay.style.display='none';hud.style.display='block';}

  if (query.get('audit') === '1') window.__solmarAudit = () => ({
  player: { x: player.x, z: player.z },
  activeCar: activeCar ? { x: activeCar.x, z: activeCar.z, yaw: activeCar.yaw, speed: activeCar.speed } : null,
  camera: { x: camera.position.x, z: camera.position.z },
  traffic: traffic.cars.map(car => ({ x: car.x, z: car.z })),
  pedestrians: traffic.people.map(person => ({ x: person.x, z: person.z, flee:person.flee, down:!!person.down })),
  wanted: player.wanted, health: player.health, cash:player.cash, police: traffic.police.map(car=>({x:car.x,z:car.z,officers:car.officers.filter(o=>o.visible).length})),
});
if (query.get('audit') === '1') window.__solmarTest = {
  mission:()=>({stage:mission.stage,active:mission.active,phase:mission.phase,point:mission.point,reward:mission.reward,cash:player.cash,wanted:player.wanted,call:missionCall,audioRunning:sound.running,muted:sound.muted}),
  carAtObjective(){if(mission.point&&activeCar){activeCar.x=mission.point.x;activeCar.z=mission.point.z;activeCar.root.position.set(activeCar.x,0,activeCar.z);}},
  carAt(x,z){if(activeCar){activeCar.x=x;activeCar.z=z;activeCar.root.position.set(x,0,z);}},
  startCall(){if(missionCall)activateMission();},
  nextCall(){missionCall=true;activateMission();},
  progressMission,
  hide(){player.x=city.edge-12;player.z=city.edge-12;player.body.position.set(player.x,0,player.z);lastCrime=performance.now()-20000;wantedClock=13;},
  movePlayer(x,z){player.x=x;player.z=z;player.body.position.set(x,0,z);},
  yaw(value){yaw=value;player.yaw=value;player.body.rotation.y=value;},
  wanted(value){player.wanted=Math.max(0,Math.min(5,value));lastCrime=performance.now();},
  attack(shoot){attack(shoot);},
  health(value){player.health=value;},
  advancePolice(){for(let i=0;i<8;i++)setPolice(traffic,scene,player.wanted,activeCar,player,city,1);},
  escape(){player.x=city.edge-12;player.z=city.edge-12;player.body.position.set(player.x,0,player.z);player.wanted=Math.max(1,player.wanted);lastCrime=performance.now()-20_000;wantedClock=13;},
  bust(){activeCar=null;player.body.visible=true;player.wanted=Math.max(1,player.wanted);setPolice(traffic,scene,player.wanted,null,player,city,0);for(const c of traffic.police){c.x=player.x;c.z=player.z;c.root.position.set(c.x,0,c.z);for(const o of c.officers){o.visible=true;o.position.set(player.x+1,0,player.z);}}bustedClock=2.1;},
};
prepareShot(shot, player, enterWorld);
if(shot==='drive'&&!saved.mission?.active){mission.active=true;mission.phase='pickup';mission.reward=STORY.jobs[0].reward;mission.point={x:-80,z:0};}
if (shot === 'drive') { activeCar=traffic.parked[0]; player.body.visible=false; activeCar.speed=0; enterWorld(); }
if (shot === 'chase') { activeCar=traffic.parked[0]; activeCar.x=player.x; activeCar.z=player.z; activeCar.yaw=player.yaw; activeCar.root.position.set(activeCar.x,0,activeCar.z); activeCar.root.rotation.y=activeCar.yaw; player.body.visible=false; enterWorld(); }
yaw = player.yaw;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(.045, (now - last) / 1000); last = now;
  if (playing && !paused) {
    if(missionCall){callClock-=dt;if(callClock<=0)activateMission();}
    if(doneClock>0){doneClock-=dt;if(doneClock<=0)document.querySelector('#done').style.display='none';}
    if (activeCar) {movePlayerCar(activeCar, keys, dt, city, traffic); if(Math.abs(activeCar.speed)>1){for(const c of traffic.police)if(Math.hypot(c.x-activeCar.x,c.z-activeCar.z)<4&&performance.now()>(c.hitCooldown||0)){addWanted(seenByWitness(activeCar.x,activeCar.z)?1:0);c.hitCooldown=performance.now()+1800;}} if(Math.abs(activeCar.speed)>5&&traffic.people.some(p=>!p.down&&Math.hypot(p.x-activeCar.x,p.z-activeCar.z)<2.3)){const p=traffic.people.find(p=>!p.down&&Math.hypot(p.x-activeCar.x,p.z-activeCar.z)<2.3);p.down=true;p.downAt=performance.now();p.root.rotation.x=Math.PI/2;addWanted(seenByWitness(activeCar.x,activeCar.z)?1:0);}}
    else updatePlayer(player, keys, dt, city);
    updateTraffic(traffic, city, dt, activeCar);
    for(const p of traffic.people)if(p.down&&performance.now()-p.downAt>8000)p.root.visible=false;
    setPolice(traffic,scene,player.wanted,activeCar,player,city,dt); shotCooldown=Math.max(0,shotCooldown-dt);
    if(shot==='chase'&&!chaseStaged&&traffic.police.length){traffic.police.forEach((car,i)=>{car.x=player.x+(i-1)*6;car.z=player.z+24;car.yaw=Math.PI;car.root.position.set(car.x,0,car.z);car.root.rotation.y=car.yaw;});chaseStaged=true;}
    if(player.wanted){wantedClock+=dt;const closest=traffic.police.reduce((n,c)=>Math.min(n,Math.hypot(c.x-player.x,c.z-player.z)),Infinity);if(!seenByWitness(player.x,player.z)&&closest>100){if(wantedClock>12){player.wanted--;wantedClock=0;}}else if(!seenByWitness(player.x,player.z)&&performance.now()-lastCrime>18_000){player.wanted=Math.max(0,player.wanted-1);wantedClock=0;}}
    progressMission();
    if(!activeCar){const close=traffic.police.some(c=>c.officers.some(o=>o.visible&&Math.hypot(o.position.x-player.x,o.position.z-player.z)<2.4));bustedClock=close&&player.wanted?bustedClock+dt:0;if(bustedClock>2)die('BUSTED');}
    if(traffic.police.some(c=>c.fireUntil>performance.now())){player.health=Math.max(0,player.health-12*dt);if(player.health<=0)die('WASTED');}
    if(player.health<=0)die('WASTED');
    if(!traffic.police.some(c=>c.fireUntil>performance.now()))player.health=Math.min(100,player.health+2.4*dt);
    if(Math.hypot(player.x,player.z)<5&&!player.wanted){player.safeX=player.x;player.safeZ=player.z;}
    sound.update(activeCar?.speed||0,player.wanted);positionCamera(); showHud(player, activeCar); updateObjective(); document.querySelector('.stars').textContent=Array.from({length:5},(_,i)=>i<player.wanted?'★':'☆').join(' '); drawMap(document.querySelector('#map'), city, player, traffic, activeCar,mission.active?mission.point:null);
    if (Math.floor(now / 7000) !== Math.floor((now - dt * 1000) / 7000)) save();
  } else if (!playing && !shot) {
    yaw += dt * .035; positionCamera();
  }
  renderer.render(scene, camera);
}
positionCamera(); requestAnimationFrame(frame);
