export function showHud(player) {
  document.querySelector('#cash').textContent = `$ ${Math.floor(player.cash).toLocaleString()}`;
  document.querySelector('#bar').style.width = `${Math.max(0, Math.min(100, player.health))}%`;
  const minute = Math.floor((performance.now() / 18000 + 42) % 60);
  const hour = 16 + Math.floor((minute + 42) / 60);
  document.querySelector('#clock').textContent = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} · COASTAL DISTRICT`;
}

export function setPaused(value) {
  document.querySelector('#pause').style.display = value ? 'grid' : 'none';
}
