export function showHud(player, car = null) {
  document.querySelector('#cash').textContent = `$ ${Math.floor(player.cash).toLocaleString()}`;
  const driving = document.querySelector('#driving');
  if (driving) driving.textContent = car ? `IN CAR · ${Math.round(Math.abs(car.speed) * 3.6)} KM/H` : 'ON FOOT';
  document.querySelector('#bar').style.width = `${Math.max(0, Math.min(100, player.health))}%`;
  document.querySelector('#bar').style.background = player.health < 30 ? '#e05e50' : '#d5d991';
  const minute = Math.floor((performance.now() / 18000 + 42) % 60);
  const hour = 16 + Math.floor((minute + 42) / 60);
  document.querySelector('#clock').textContent = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} · COASTAL DISTRICT`;
}

export function setPaused(value) {
  document.querySelector('#pause').style.display = value ? 'grid' : 'none';
}
