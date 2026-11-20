export function seeded(seed = 1) {
  let state = seed >>> 0;
  if (state === 0) state = 0x6d2b79f5;
  return function nextRandom() {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick(rng, list) { return list[Math.floor(rng() * list.length)]; }
export function shuffle(rng, list) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) { const j = Math.floor(rng() * (i + 1)); const tmp = copy[i]; copy[i] = copy[j]; copy[j] = tmp; }
  return copy;
}
