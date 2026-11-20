export function showHud(player, car = null) {
  document.querySelector('#cash').textContent = `$ ${Math.floor(player.cash).toLocaleString()}`;
  const driving = document.querySelector('#driving');
  if (driving) driving.textContent = car ? `IN CAR · ${Math.round(Math.abs(car.speed) * 3.6)} KM/H` : 'ON FOOT';
  document.querySelector('#bar').style.width = `${Math.max(0, Math.min(100, player.health))}%`;
  document.querySelector('#bar').style.background = player.health < 30 ? '#e05e50' : '#d5d991';
  const minute = Math.floor((performance.now() / 18000 + 42) % 60);
  const hour = 16 + Math.floor((minute + 42) / 60);
  document.querySelector('#clock').textContent = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} · COASTAL DISTRICT`;
  const stars = document.querySelector('.stars');
  if (stars) {
    stars.style.display = player.wanted > 0 ? 'inline-block' : 'none';
    stars.style.background = '#ef4444';
    stars.style.color = '#ffffff';
    stars.style.padding = '2px 10px';
    stars.style.borderRadius = '999px';
  }
  const radio = document.querySelector('#radio');
  if (radio) {
    radio.textContent = player.radio ? `RADIO · ${player.radio}` : 'RADIO OFF';
    radio.style.opacity = player.radio ? '1' : '.55';
  }
  const stamina = document.querySelector('#stamina');
  if (stamina) {
    stamina.style.display = typeof player.stamina === 'number' ? 'block' : 'none';
    stamina.style.width = `${Math.max(0, Math.min(100, player.stamina))}%`;
    stamina.style.background = player.stamina < 25 ? '#e08a50' : '#8ac6a0';
  }
  const staminaWrap = document.querySelector('#stamina-wrap');
  if (staminaWrap) staminaWrap.style.display = typeof player.stamina === 'number' ? 'block' : 'none';
  const side = document.querySelector('#side');
  if (side) side.textContent = player.side ? `SIDE · ${player.side}` : '';
}

export function setPaused(value) {
  document.querySelector('#pause').style.display = value ? 'grid' : 'none';
}
