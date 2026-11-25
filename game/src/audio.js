// All sound is synthesized with WebAudio: no audio files, nothing fetched.
// A tiny cheerful loop (bass + plucked melody) and one-shot effects for
// chopping, sizzling, serving and coins. M toggles mute.
export function createAudio() {
  let context = null;
  let muted = false;
  let musicTimer = null;
  let sizzleNodes = null;

  function ensure() {
    if (context) return context;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      context = new AudioContext();
    } catch {
      context = null;
    }
    return context;
  }

  function tone(freq, seconds, type, gain, when = 0) {
    const ctx = ensure();
    if (!ctx || muted) return;
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    amp.gain.setValueAtTime(0.0001, t0);
    amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
    osc.connect(amp).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + seconds + 0.05);
  }

  function noise(seconds, filterFreq, gain, when = 0) {
    const ctx = ensure();
    if (!ctx || muted) return;
    const t0 = ctx.currentTime + when;
    const length = Math.max(1, Math.floor(ctx.sampleRate * seconds));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    const amp = ctx.createGain();
    amp.gain.setValueAtTime(gain, t0);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
    source.connect(filter).connect(amp).connect(ctx.destination);
    source.start(t0);
  }

  // A short loop: a walking bass under a plucked melody, in C major.
  const MELODY = [523, 659, 784, 659, 587, 698, 880, 784, 659, 523, 587, 659];
  const BASS = [131, 131, 175, 196, 131, 165, 196, 175];
  const BEAT = 0.24;

  function startMusic() {
    const ctx = ensure();
    if (!ctx || musicTimer !== null) return;
    let step = 0;
    musicTimer = window.setInterval(() => {
      if (muted || ctx.state !== 'running') return;
      const note = MELODY[step % MELODY.length];
      const bass = BASS[Math.floor(step / 2) % BASS.length];
      tone(note, BEAT * 0.9, 'triangle', 0.05);
      if (step % 2 === 0) tone(bass, BEAT * 1.8, 'sine', 0.07);
      step += 1;
    }, BEAT * 1000);
  }

  function stopMusic() {
    if (musicTimer !== null) {
      window.clearInterval(musicTimer);
      musicTimer = null;
    }
  }

  function startSizzle() {
    const ctx = ensure();
    if (!ctx || muted || sizzleNodes) return;
    const length = ctx.sampleRate;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 3200;
    const amp = ctx.createGain();
    amp.gain.value = 0.035;
    source.connect(filter).connect(amp).connect(ctx.destination);
    source.start();
    sizzleNodes = { source, amp };
  }

  function stopSizzle() {
    if (!sizzleNodes) return;
    try {
      sizzleNodes.source.stop();
    } catch { /* already stopped */ }
    sizzleNodes = null;
  }

  return {
    unlock() {
      const ctx = ensure();
      if (ctx && ctx.state === 'suspended') void ctx.resume();
    },
    startMusic,
    stopMusic,
    toggleMute() {
      muted = !muted;
      if (muted) stopSizzle();
      return muted;
    },
    isMuted() { return muted; },
    chop() { noise(0.08, 900, 0.25); tone(180, 0.07, 'square', 0.08); },
    pickup() { tone(420, 0.08, 'sine', 0.12); },
    place() { tone(300, 0.09, 'sine', 0.12); tone(210, 0.1, 'sine', 0.08, 0.05); },
    ding() { tone(880, 0.25, 'sine', 0.14); tone(1318, 0.3, 'sine', 0.1, 0.09); },
    coin() { tone(988, 0.1, 'triangle', 0.14); tone(1319, 0.16, 'triangle', 0.14, 0.08); tone(1568, 0.22, 'triangle', 0.12, 0.16); },
    serve() {
      tone(523, 0.12, 'triangle', 0.14);
      tone(659, 0.12, 'triangle', 0.14, 0.1);
      tone(784, 0.2, 'triangle', 0.14, 0.2);
    },
    error() { tone(160, 0.22, 'sawtooth', 0.1); tone(120, 0.25, 'sawtooth', 0.09, 0.08); },
    burn() { noise(0.4, 500, 0.2); tone(110, 0.35, 'sawtooth', 0.1); },
    walkOut() { tone(392, 0.18, 'triangle', 0.1); tone(311, 0.3, 'triangle', 0.1, 0.14); },
    startSizzle,
    stopSizzle,
  };
}
