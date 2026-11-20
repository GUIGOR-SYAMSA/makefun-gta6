import * as THREE from 'three';

const colors = [0xd84d3e, 0x397c91, 0xe0b94f, 0x704a89, 0xe5e0cf, 0x3f7659];
const coastColors = [0xd98a6c, 0x9fc2b0, 0xe3c98f, 0x7fa8b5, 0xc9b8a3];
function makeCar(scene, x, z, yaw, color, traffic = false, police = false, taxi = false) {
  const root = new THREE.Group(); root.position.set(x, 0, z); root.rotation.y = yaw;
  const paint = taxi ? 0xf2c230 : color;
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.15, .82, 4.1), new THREE.MeshStandardMaterial({ color: paint, roughness: .42, metalness: .12 }));
  body.position.y = .72; body.castShadow = true; body.receiveShadow = true; root.add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.65, .7, 1.95), new THREE.MeshStandardMaterial({ color: 0x91b8b7, roughness: .26, metalness: .18 }));
  cabin.position.set(0, 1.42, -.1); cabin.castShadow = true; root.add(cabin);
  if (taxi) {
    const sign = new THREE.Mesh(new THREE.BoxGeometry(.95, .26, .42), new THREE.MeshStandardMaterial({ color: 0xfff6d8, emissive: 0x8a7a2a }));
    sign.position.set(0, 1.9, -.1); sign.castShadow = true; root.add(sign);
  }
  if (police) {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.17,.2,2.15),new THREE.MeshStandardMaterial({color:0xf4f1e6})); stripe.position.set(0,.85,0); root.add(stripe);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(.9,.16,.34),new THREE.MeshStandardMaterial({color:0x185bbb,emissive:0x123e99})); bar.position.set(0,1.84,-.12); root.add(bar);
    const red = new THREE.Mesh(new THREE.BoxGeometry(.36,.18,.36),new THREE.MeshStandardMaterial({color:0xed3838,emissive:0x8d1111})); red.position.set(-.3,1.84,-.12); root.add(red);
  }
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x202326, roughness: .9 });
  for (const wx of [-1.04, 1.04]) for (const wz of [-1.28, 1.28]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(.39, .39, .22, 12), wheelMat);
    wheel.rotation.z = Math.PI / 2; wheel.position.set(wx, .4, wz); root.add(wheel);
  }
  scene.add(root);
  return { root, x, z, yaw, speed: 0, traffic, police, radius: 2.1, color };
}

export function makeTraffic(scene) {
  const parked = [
    makeCar(scene, -4.4, -40, 0, colors[0]), makeCar(scene, 18, 40, Math.PI, colors[1]),
    makeCar(scene, -40, 17, Math.PI / 2, colors[2], false, false, true), makeCar(scene, 40, -17, -Math.PI / 2, colors[3]),
    makeCar(scene, -40, 80, 0, colors[4]), makeCar(scene, 80, 40, Math.PI, colors[5]),
  ];
  // Clockwise rectangular routes on the street center lines.
  const routes = [
    [[0,-40],[40,-40],[40,0],[40,40],[0,40],[-40,40],[-40,0],[-40,-40]],
    [[0,40],[0,0],[0,-40],[0,-80],[-40,-80],[-80,-80],[-80,-40],[-80,0],[-80,40],[-40,40]],
    [[80,40],[80,0],[80,-40],[80,-80],[40,-80],[0,-80],[-40,-80],[-80,-80],[-80,0],[-80,80],[0,80]],
  ];
  const cars = routes.map((route, i) => ({ ...makeCar(scene, route[0][0], route[0][1], 0, coastColors[i % coastColors.length], true, false, i === 1), route, target: 1 }));
  const people = [];
  const peopleMat = [0x4c6f86,0xc46e4c,0x665284,0x55714c].map(color => new THREE.MeshStandardMaterial({ color }));
  for (let i = 0; i < 9; i++) {
    const root = new THREE.Group(); const mat = peopleMat[i % peopleMat.length];
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(.32, .8, 3, 6), mat); torso.position.y = 1.05; torso.castShadow = true; root.add(torso);
    const head = new THREE.Mesh(new THREE.SphereGeometry(.23, 8, 6), new THREE.MeshStandardMaterial({ color: 0xc99069 })); head.position.y = 1.7; root.add(head);
    const positions = [[-7,-47.1],[7,-32.9],[33,-7.1],[73,7.1],[-73,-7.1],[7,7.1],[47,-7.1],[-33,7.1],[0,-7.1]];
    const [x,z] = positions[i];
    root.position.set(x, 0, z); scene.add(root);
    people.push({ root, x, z, targetX: x + (i % 2 ? 35 : -35), targetZ: z, flee: 0, phase: i });
  }
  return { parked, cars, people, police: [], all: parked.concat(cars) };
}

export function setPolice(traffic, scene, wanted, playerCar, player, city, dt) {
  const count = wanted ? Math.min(5, wanted) : 0;
  while (traffic.police.length < count) {
    const i=traffic.police.length, a=i*Math.PI*2/Math.max(count,1), edge=city.edge-18;
    const x=Math.round(Math.cos(a)*edge/40)*40, z=Math.round(Math.sin(a)*edge/40)*40;
    const car=makeCar(scene,x,z,Math.atan2(player.x-x,player.z-z),0x111820,false,true);
    car.officers=[]; for(let n=0;n<2;n++){const officer=new THREE.Group();const uniform=new THREE.Mesh(new THREE.CapsuleGeometry(.3,.85,3,6),new THREE.MeshStandardMaterial({color:0x172332}));uniform.position.y=.75;officer.add(uniform);const head=new THREE.Mesh(new THREE.SphereGeometry(.22,8,6),new THREE.MeshStandardMaterial({color:0xc99069}));head.position.y=1.45;officer.add(head);officer.visible=false;scene.add(officer);car.officers.push(officer);} car.flash=Math.random()*10; traffic.police.push(car); traffic.all.push(car);
  }
  while (traffic.police.length > count) { const car=traffic.police.pop(); scene.remove(car.root);for(const officer of car.officers)scene.remove(officer); traffic.all.splice(traffic.all.indexOf(car),1); }
  for (let i=0;i<traffic.police.length;i++) {
    const car=traffic.police[i], dx=player.x-car.x,dz=player.z-car.z, dist=Math.hypot(dx,dz), target=Math.atan2(dx,dz);
    let turn=Math.atan2(Math.sin(target-car.yaw),Math.cos(target-car.yaw));
    car.yaw+=THREE.MathUtils.clamp(turn,-dt*(wanted>=5?2.2:1.5),dt*(wanted>=5?2.2:1.5));
    car.speed=THREE.MathUtils.damp(car.speed,dist>5?(wanted>=5?16:11):0,1.2,dt);
    const nx=car.x+Math.sin(car.yaw)*car.speed*dt,nz=car.z+Math.cos(car.yaw)*car.speed*dt;
    // Pursuit vehicles may cut across blocks when the player is on foot, and follow direct roads in a car chase.
    if (playerCar && Math.abs(Math.sin(car.yaw-target))<.8) { car.x=nx; car.z=nz; }
    else { car.x=THREE.MathUtils.damp(car.x,player.x+Math.sin(i*2.4)*10,Math.max(1,car.speed/9),dt); car.z=THREE.MathUtils.damp(car.z,player.z+Math.cos(i*2.4)*10,Math.max(1,car.speed/9),dt); }
    car.root.position.set(car.x,0,car.z);car.root.rotation.y=car.yaw;
    const onFoot=!playerCar&&dist<18;
    car.officers.forEach((officer,n)=>{officer.visible=onFoot;officer.position.set(player.x+Math.cos(i+n*2)*1.4,0,player.z+Math.sin(i+n*2)*1.4);officer.rotation.y=Math.atan2(player.x-officer.position.x,player.z-officer.position.z);});
    car.flash+=dt*12; car.root.children[car.root.children.length-1].material.emissiveIntensity=.4+Math.abs(Math.sin(car.flash))*2.2;
  }
}

export function fleePeople(traffic, x, z) { for(const p of traffic.people) if(!p.down){const dx=p.x-x,dz=p.z-z,l=Math.hypot(dx,dz)||1;p.flee=3;p.targetX=p.x+dx/l*24;p.targetZ=p.z+dz/l*24;} }

function clearAt(x, z, city, traffic, self) {
  if (Math.abs(x) > city.edge - 3 || Math.abs(z) > city.edge - 3) return false;
  for (const s of city.solids) if (x > s.x - 1.5 && x < s.x + s.w + 1.5 && z > s.z - 2.5 && z < s.z + s.d + 2.5) return false;
  return !traffic.all.some(car => car !== self && Math.hypot(x-car.x,z-car.z) < 3.2);
}

export function updateTraffic(traffic, city, dt, playerCar) {
  for (const car of traffic.cars) {
    const [tx,tz] = car.route[car.target], dx=tx-car.x, dz=tz-car.z, dist=Math.hypot(dx,dz);
    if (dist < 2) car.target=(car.target+1)%car.route.length;
    const desired=Math.atan2(dx,dz); let turn=Math.atan2(Math.sin(desired-car.yaw),Math.cos(desired-car.yaw));
    car.yaw += THREE.MathUtils.clamp(turn,-dt*1.35,dt*1.35);
    const ahead=traffic.all.some(other=>other!==car && Math.hypot(other.x-(car.x+Math.sin(car.yaw)*7),other.z-(car.z+Math.cos(car.yaw)*7))<4.5);
    car.speed=THREE.MathUtils.damp(car.speed,ahead?0:8,2,dt);
    const nx=car.x+Math.sin(car.yaw)*car.speed*dt,nz=car.z+Math.cos(car.yaw)*car.speed*dt;
    if(clearAt(nx,nz,city,traffic,car)){car.x=nx;car.z=nz;} else car.speed=0;
    car.root.position.set(car.x,0,car.z);car.root.rotation.y=car.yaw;
  }
  for(const p of traffic.people){
    if(p.down)continue;
    let threat=null,near=Infinity;
    for(const car of traffic.all.concat(playerCar?[playerCar]:[])){if(!car)continue;const d=Math.hypot(p.x-car.x,p.z-car.z);if(d<near){near=d;threat=car;}}
    if(near<8){p.flee=.8;const dx=p.x-threat.x,dz=p.z-threat.z,len=Math.hypot(dx,dz)||1;p.targetX=p.x+dx/len*9;p.targetZ=p.z+dz/len*9;}
    p.flee=Math.max(0,p.flee-dt);
    const dx=p.targetX-p.x,dz=p.targetZ-p.z,d=Math.hypot(dx,dz),speed=p.flee?5:1.15;
    if(d<1.2){p.targetX=p.x+(p.phase%2?30:-30);p.targetZ=p.z;}
    else {p.x+=dx/d*speed*dt;p.z+=dz/d*speed*dt;}
    p.root.position.set(p.x,Math.abs(Math.sin(performance.now()*.008+p.phase))*.04,p.z);p.root.rotation.y=Math.atan2(dx,dz);
  }
}

export function movePlayerCar(car, keys, dt, city, traffic) {
  const gas=keys.has('KeyW')?1:0, brake=keys.has('KeyS')?1:0, steer=(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0);
  car.speed=THREE.MathUtils.clamp(car.speed+gas*13*dt-brake*17*dt-(gas||brake?0:car.speed*1.4*dt),-6,22);
  car.yaw+=steer*dt*(.55+Math.min(Math.abs(car.speed),12)*.075)*Math.sign(car.speed||1);
  const nx=car.x+Math.sin(car.yaw)*car.speed*dt,nz=car.z+Math.cos(car.yaw)*car.speed*dt;
  if(clearAt(nx,nz,city,traffic,car)){car.x=nx;car.z=nz;}else car.speed=0;
  car.root.position.set(car.x,0,car.z);car.root.rotation.y=car.yaw;
}
