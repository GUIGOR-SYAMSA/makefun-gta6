const SAVE_KEY = 'solmar-heat-save-v2';
const FRESH_STATE = { x: 0, z: 0, yaw: 0, cash: 2450, health: 100, wanted: 0, missions: {}, muted: false };

export function loadSave() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.z) && Number.isFinite(saved.yaw)) {
      return { ...FRESH_STATE, ...saved };
    }
  } catch { /* A private browsing policy or malformed save starts a clean game. */ }
  return { ...FRESH_STATE };
}

export function saveGame(player, car = null, parked = []) {
  try {
    const carIndex = car ? parked.indexOf(car) : -1;
    localStorage.setItem(SAVE_KEY, JSON.stringify({ version: 4, x: player.x, z: player.z, yaw: player.yaw, cash: player.cash, health: player.health, wanted: player.wanted || 0, missions: player.missions || {}, muted: !!player.muted, inCar: !!car, carIndex, ...(car ? { carX: car.x, carZ: car.z, carYaw: car.yaw } : {}) }));
    return true;
  } catch { return false; }
}
