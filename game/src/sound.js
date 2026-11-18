let ctx = null, master = null, engineOsc = null, engineGain = null, sirenOsc = null, sirenGain = null, loopTimer = 0, mute = false;
function safe(fn) { try { return fn(); } catch { return undefined; } }
function init() {
  if (ctx) { safe(() => ctx.state === 'suspended' && ctx.resume()); return; }
  safe(() => {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = mute ? 0 : .22; master.connect(ctx.destination);
    engineOsc = ctx.createOscillator(); engineOsc.type = 'sawtooth'; engineGain = ctx.createGain(); engineGain.gain.value = 0;
    engineOsc.connect(engineGain); engineGain.connect(master); engineOsc.start();
    sirenOsc = ctx.createOscillator(); sirenOsc.type = 'square'; sirenGain = ctx.createGain(); sirenGain.gain.value = 0;
    sirenOsc.connect(sirenGain); sirenGain.connect(master); sirenOsc.start();
    loopTimer = window.setInterval(() => { if (ctx?.state === 'running' && !mute) { tone(55, .09, .045, 'triangle'); window.setTimeout(() => tone(1800, .035, .018, 'square'), 170); } }, 720);
  });
}
function tone(freq, duration, volume = .12, type = 'sine') { safe(() => { if (!ctx || ctx.state !== 'running' || mute) return; const o=ctx.createOscillator(), g=ctx.createGain(); o.type=type; o.frequency.value=freq; g.gain.setValueAtTime(volume,ctx.currentTime); g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+duration); o.connect(g);g.connect(master);o.start();o.stop(ctx.currentTime+duration); }); }
export const sound = {
  init, mute(value) { mute = value; safe(() => { if (master) master.gain.setTargetAtTime(mute ? 0 : .22, ctx.currentTime, .03); }); },
  update(speed, wanted) { safe(() => { if (!ctx) return; engineOsc.frequency.setTargetAtTime(48 + Math.min(190, Math.abs(speed)*5),ctx.currentTime,.12); engineGain.gain.setTargetAtTime(Math.abs(speed) > 1 ? .045 : 0,ctx.currentTime,.2); sirenOsc.frequency.setTargetAtTime(650 + 260*Math.sin(performance.now()/190),ctx.currentTime,.08); sirenGain.gain.setTargetAtTime(wanted ? .027 : 0,ctx.currentTime,.18); }); },
  punch() { tone(115,.12,.18,'triangle'); }, gun() { tone(95,.16,.22,'sawtooth'); }, pickup() { tone(660,.12,.12); window.setTimeout(()=>tone(990,.15,.1),100); },
  complete() { tone(523,.18,.12); window.setTimeout(()=>tone(659,.18,.11),130); window.setTimeout(()=>tone(784,.3,.12),260); }, sting() { tone(220,.38,.17,'sawtooth'); window.setTimeout(()=>tone(110,.55,.13,'triangle'),170); },
  get running() { return !!ctx && ctx.state === 'running'; }, get muted() { return mute; },
};
