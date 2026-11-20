export function drawMap(canvas, city, player, traffic = null, activeCar = null) {
  const context = canvas.getContext('2d'), size = canvas.width, scale = size / (city.edge * 2.25);
  const center = size / 2, worldToMapX = (x) => center + x * scale, worldToMapY = (z) => center + z * scale;
  context.clearRect(0, 0, size, size);
  context.fillStyle = '#c8b08a'; context.fillRect(0, 0, size, size);
  context.fillStyle = '#4fabb0';
  context.fillRect(0, 0, size, Math.max(0, worldToMapY(-city.edge - 15)));
  context.fillStyle = '#b99368'; context.fillRect(worldToMapX(city.edge), 0, size - worldToMapX(city.edge), size);
  context.fillStyle = '#928e7a';
  for (const [x, z] of city.buildings) context.fillRect(worldToMapX(x - 11), worldToMapY(z - 11), 22 * scale, 22 * scale);
  context.fillStyle = '#e2d3b7';
  for (let grid = -city.edge; grid <= city.edge; grid += 40) {
    context.fillRect(worldToMapX(grid - 5.5), 0, 11 * scale, size);
    context.fillRect(0, worldToMapY(grid - 5.5), size, 11 * scale);
  }
  if (traffic) for (const car of traffic.all) {
    context.fillStyle = car === activeCar ? '#ef5b45' : car.police ? '#234eae' : '#253c45';
    context.beginPath(); context.arc(worldToMapX(car.x), worldToMapY(car.z), car === activeCar ? 5.5 : 3.5, 0, Math.PI * 2); context.fill();
  }
  if (player.missionPoint) { context.fillStyle = '#ffe45c'; context.strokeStyle = '#6b351f'; context.lineWidth = 2; context.beginPath(); context.arc(worldToMapX(player.missionPoint.x), worldToMapY(player.missionPoint.z), 7, 0, Math.PI * 2); context.fill(); context.stroke(); }
  context.save(); context.translate(worldToMapX(player.x), worldToMapY(player.z)); context.rotate(-player.yaw);
  context.fillStyle = '#d9503f'; context.strokeStyle = '#fff4d8'; context.lineWidth = 2.5;
  context.beginPath(); context.moveTo(0, -10); context.lineTo(7, 8); context.lineTo(0, 4); context.lineTo(-7, 8); context.closePath(); context.fill(); context.stroke(); context.restore();
  context.fillStyle = '#253c45'; context.font = 'bold 13px sans-serif'; context.textAlign = 'center';
  context.beginPath(); context.moveTo(size - 14, 20); context.lineTo(size - 19, 30); context.lineTo(size - 9, 30); context.closePath(); context.fill();
  context.fillText('N', size - 14, 12);
  context.strokeStyle = '#253c45'; context.lineWidth = 1.5;
  context.beginPath(); context.arc(size - 14, 26, 12, 0, Math.PI * 2); context.stroke();
  context.font = '10px sans-serif'; context.textAlign = 'left'; context.fillStyle = '#253c45';
  context.fillText('1 CM ≈ 40 M', 8, size - 8);
  context.strokeStyle = '#253c45'; context.lineWidth = 2;
  context.beginPath(); context.moveTo(8, size - 16); context.lineTo(48, size - 16); context.stroke();
  context.beginPath(); context.moveTo(8, size - 20); context.lineTo(8, size - 12); context.stroke();
  context.beginPath(); context.moveTo(48, size - 20); context.lineTo(48, size - 12); context.stroke();
}
