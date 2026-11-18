export function prepareShot(name, player, enterWorld) {
  if (name === 'start') {
    player.x = 0; player.z = 0; player.yaw = 0;
    return;
  }
  if (name === 'foot') {
    player.x = 0; player.z = 0; player.yaw = -.22;
    player.cash = 2450; player.health = 100;
    enterWorld();
  }
}
