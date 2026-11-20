let audio = null, master = null, engine = null, engineVol = null, siren = null, sirenVol = null, muted = false, loopAt = 0;
let waves = null, waveGain = null, waveLfo = null, hum = null, humVol = null;
function safe(action) { try { return action(); } catch { return undefined; } }
function start() {
  safe(() => {
    if (audio) { if (audio.state === 'suspended') audio.resume(); return; }
    const Type = window.AudioContext || window.webkitAudioContext;
    if (!Type) return;
    audio = new Type(); master = audio.createGain(); master.gain.value = muted ? 0 : .18; master.connect(audio.destination);
    engine = audio.createOscillator(); engine.type = 'sawtooth'; engineVol = audio.createGain(); engineVol.gain.value = 0; engine.connect(engineVol); engineVol.connect(master); engine.start();
    siren = audio.createOscillator(); siren.type = 'square'; sirenVol = audio.createGain(); sirenVol.gain.value = 0; siren.connect(sirenVol); sirenVol.connect(master); siren.start();
    const noiseLen = audio.sampleRate * 2, noiseBuf = audio.createBuffer(1, noiseLen, audio.sampleRate), noiseData = noiseBuf.getChannelData(0);
    for (let i = 0; i < noiseLen; i += 1) noiseData[i] = Math.random() * 2 - 1;
    waves = audio.createBufferSource(); waves.buffer = noiseBuf; waves.loop = true;
    const waveFilter = audio.createBiquadFilter(); waveFilter.type = 'lowpass'; waveFilter.frequency.value = 420;
    waveGain = audio.createGain(); waveGain.gain.value = .045;
    waveLfo = audio.createOscillator(); waveLfo.type = 'sine'; waveLfo.frequency.value = .125;
    const lfoDepth = audio.createGain(); lfoDepth.gain.value = .03;
    waveLfo.connect(lfoDepth); lfoDepth.connect(waveGain.gain);
    waves.connect(waveFilter); waveFilter.connect(waveGain); waveGain.connect(master);
    waves.start(); waveLfo.start();
    hum = audio.createOscillator(); hum.type = 'sine'; hum.frequency.value = 55; humVol = audio.createGain(); humVol.gain.value = 0; hum.connect(humVol); humVol.connect(master); hum.start();
    startRadio();
  });
}
function note(hz, length = .12, wave = 'sine', volume = .08) { safe(() => { if (!audio || audio.state !== 'running' || muted) return; const osc = audio.createOscillator(), amp = audio.createGain(); osc.type = wave; osc.frequency.value = hz; amp.gain.setValueAtTime(volume, audio.currentTime); amp.gain.exponentialRampToValueAtTime(.001, audio.currentTime + length); osc.connect(amp); amp.connect(master); osc.start(); osc.stop(audio.currentTime + length); }); }
let radioTimer = null, radioOn = true, radioStation = 0, radioStep = 0;
const RADIO_STATIONS = [
  {
    name: 'SOLMAR FM', bpm: 96, wave: 'triangle',
    bass: [55, 0, 65.41, 0, 49, 0, 58.27, 0],
    lead: [220, 277.18, 329.63, 261.63, 293.66, 329.63, 392, 329.63],
  },
  {
    name: 'NIGHT DRIVE', bpm: 132, wave: 'sawtooth',
    bass: [55, 55, 82.41, 55, 49, 49, 73.42, 98],
    lead: [440, 0, 415.3, 0, 466.16, 0, 493.88, 554.37],
  },
];
function radioTick() {
  if (!radioOn || !audio || audio.state !== 'running' || muted) return;
  const station = RADIO_STATIONS[radioStation];
  const bassNote = station.bass[radioStep % station.bass.length];
  if (bassNote) note(bassNote, .24, station.wave, .05);
  const leadNote = station.lead[radioStep % station.lead.length];
  if (leadNote && radioStep % 2 === 0) note(leadNote, .15, 'square', .02);
  radioStep += 1;
}
function startRadio() {
  safe(() => {
    if (radioTimer || !audio) return;
    const stepMs = 60000 / RADIO_STATIONS[radioStation].bpm / 2;
    radioTimer = setInterval(radioTick, stepMs);
  });
}
function setRadio(on) {
  radioOn = !!on;
  if (radioOn) startRadio();
  else { clearInterval(radioTimer); radioTimer = null; }
}
function nextStation() {
  radioStation = (radioStation + 1) % RADIO_STATIONS.length;
  radioStep = 0;
  if (radioTimer) { clearInterval(radioTimer); radioTimer = null; startRadio(); }
  return RADIO_STATIONS[radioStation].name;
}
export const sound = {
  start,
  startRadio, setRadio, nextStation,
  toggle(value) { muted = value; safe(() => master?.gain.setTargetAtTime(muted ? 0 : .18, audio.currentTime, .04)); },
  setHum(speed) { safe(() => { if (!audio || !hum) return; const v = Math.abs(speed); hum.frequency.setTargetAtTime(55 + Math.min(90, v * 3.5), audio.currentTime, .12); humVol.gain.setTargetAtTime(v > 1 && !muted ? .018 : 0, audio.currentTime, .15); }); },
  update(speed, wanted) { safe(() => { if (!audio) return; this.setHum(speed); engine.frequency.setTargetAtTime(48 + Math.min(180, Math.abs(speed) * 5), audio.currentTime, .1); engineVol.gain.setTargetAtTime(Math.abs(speed) > 1 && !muted ? .035 : 0, audio.currentTime, .12); siren.frequency.setTargetAtTime(620 + Math.sin(performance.now() / 180) * 240, audio.currentTime, .08); sirenVol.gain.setTargetAtTime(wanted && !muted ? .022 : 0, audio.currentTime, .1); if (Math.floor(audio.currentTime * 1.8) !== loopAt) { loopAt = Math.floor(audio.currentTime * 1.8); note(55, .18, 'triangle', .025); note(1500, .025, 'square', .008); } }); },
  punch() { note(115, .12, 'triangle', .12); }, gun() { note(85, .15, 'sawtooth', .16); }, pickup() { note(660); setTimeout(() => note(990), 110); }, complete() { [523, 659, 784].forEach((n, i) => setTimeout(() => note(n, .24), i * 130)); }, sting() { note(220, .4, 'sawtooth', .13); setTimeout(() => note(110, .5, 'triangle', .1), 180); },
  get running() { return !!audio && audio.state === 'running'; }, get muted() { return muted; },
};
