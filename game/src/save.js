const SAVE_KEY = 'solmar-heat-save-v2';
const FRESH_STATE = { x: 0, z: 0, yaw: 0, cash: 2450, health: 100 };

export function loadSave() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.z) && Number.isFinite(saved.yaw)) {
      return { ...FRESH_STATE, ...saved };
    }
  } catch { /* A private browsing policy or malformed save starts a clean game. */ }
  return { ...FRESH_STATE };
}

export function saveGame(player) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ x: player.x, z: player.z, yaw: player.yaw, cash: player.cash, health: player.health }));
    return true;
  } catch { return false; }
}
