// ============================================================
//  PARAMETER BANK (edit these to shape the entire instrument)
// ============================================================

const P = {
  midiNote: 60,

  attack: 0.025,
  hold: 0.05,
  decay: 2.8,

  voices: 2,
  detuneSpread: 3,

  // --- THREE independent sine modulators ---
  modulators: [
    { rate: 1.2, depth: 0.25 }, // Mod 1: slow drift
    { rate: 0.4, depth: 0.15 }, // Mod 2: wow
    { rate: 3.5, depth: 0.05 }, // Mod 3: flutter
  ],

  lpFreq: 1500,
  lpQ: 0.4,

  chorusDelay: 0.008,
  chorusRate: 0.22,
  chorusDepth: 0.0012,

  reverbSeconds: 4.5,
  reverbLPFreq: 2000,
  reverbLPQ: 0.35,

  dryLevel: 0.5,
  wetLevel: 0.75,

  sampleRate: 192000,
  renderDuration: 7.0,
};

// ============================================================
//  MAIN ENGINE
// ============================================================

const button = document.getElementById("play");

function updateParamsFromHTML() {
  P.midiNote = Number(document.getElementById("midiNote").value);

  P.attack = Number(document.getElementById("attack").value);
  P.hold = Number(document.getElementById("hold").value);
  P.decay = Number(document.getElementById("decay").value);

  P.voices = Number(document.getElementById("voices").value);
  P.detuneSpread = Number(document.getElementById("detuneSpread").value);

  P.fmRate = Number(document.getElementById("fmRate").value);
  P.fmDepth = Number(document.getElementById("fmDepth").value);

  P.lpFreq = Number(document.getElementById("lpFreq").value);
  P.lpQ = Number(document.getElementById("lpQ").value);

  P.chorusDelay = Number(document.getElementById("chorusDelay").value);
  P.chorusRate = Number(document.getElementById("chorusRate").value);
  P.chorusDepth = Number(document.getElementById("chorusDepth").value);

  P.reverbSeconds = Number(document.getElementById("reverbSeconds").value);
  P.reverbLPFreq = Number(document.getElementById("reverbLPFreq").value);
  P.reverbLPQ = Number(document.getElementById("reverbLPQ").value);

  P.dryLevel = Number(document.getElementById("dryLevel").value);
  P.wetLevel = Number(document.getElementById("wetLevel").value);

  P.sampleRate = Number(document.getElementById("sampleRate").value);
  P.renderDuration = Number(document.getElementById("renderDuration").value);

  P.modulators[0].rate = Number(document.getElementById("mod1Rate").value);
  P.modulators[0].depth = Number(document.getElementById("mod1Depth").value);

  P.modulators[1].rate = Number(document.getElementById("mod2Rate").value);
  P.modulators[1].depth = Number(document.getElementById("mod2Depth").value);

  P.modulators[2].rate = Number(document.getElementById("mod3Rate").value);
  P.modulators[2].depth = Number(document.getElementById("mod3Depth").value);
}

button.addEventListener("click", async () => {
  updateParamsFromHTML();
  // --- OfflineAudioContext ---
  const offline = new OfflineAudioContext(2, P.sampleRate * P.renderDuration, P.sampleRate);

  // --- Envelope ---
  const noteLength = P.attack + P.hold + P.decay;

  const env = offline.createGain();
  env.gain.setValueAtTime(0, 0);
  env.gain.linearRampToValueAtTime(0.6, P.attack);
  env.gain.setValueAtTime(0.6, P.attack + P.hold);
  env.gain.linearRampToValueAtTime(0, P.attack + P.hold + P.decay);

  // --- FM Modulator ---
  // --- Create all modulators ---
  const modGains = [];
  const modulators = [];

  P.modulators.forEach((m, i) => {
    const mod = offline.createOscillator();
    mod.type = "sine";
    mod.frequency.value = m.rate; // each modulator has its own speed

    const mg = offline.createGain();
    mg.gain.value = m.depth; // each modulator has its own depth

    mod.connect(mg); // modulator → gain (depth control)

    modulators.push(mod); // store oscillator
    modGains.push(mg); // store gain node
  });

  // --- Tone Filter ---
  const lp = offline.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = P.lpFreq;
  lp.Q.value = P.lpQ;

  // --- Chorus ---
  const chorusDelay = offline.createDelay();
  chorusDelay.delayTime.value = P.chorusDelay;

  const chorusLFO = offline.createOscillator();
  chorusLFO.type = "sine";
  chorusLFO.frequency.value = P.chorusRate;

  const chorusDepth = offline.createGain();
  chorusDepth.gain.value = P.chorusDepth;

  chorusLFO.connect(chorusDepth);
  chorusDepth.connect(chorusDelay.delayTime);

  // --- Reverb ---
  const reverb = offline.createConvolver();
  reverb.buffer = generateImpulse(offline, P.reverbSeconds);

  const reverbLP = offline.createBiquadFilter();
  reverbLP.type = "lowpass";
  reverbLP.frequency.value = P.reverbLPFreq;
  reverbLP.Q.value = P.reverbLPQ;

  // --- Mix ---
  const dry = offline.createGain();
  dry.gain.value = P.dryLevel;

  const wet = offline.createGain();
  wet.gain.value = P.wetLevel;

  // Routing: env → lp → chorusDelay
  env.connect(lp).connect(chorusDelay);

  // Chorus → dry + reverb
  chorusDelay.connect(dry);
  chorusDelay.connect(reverb);

  // Reverb → reverbLP → wet
  reverb.connect(reverbLP);
  reverbLP.connect(wet);

  // Final mix
  dry.connect(offline.destination);
  wet.connect(offline.destination);

  const voices = P.voices % 2 === 0 ? P.voices + 1 : P.voices;
  const centerIndex = Math.floor(voices / 2);

  // --- Create Unison Voices ---
  for (let i = 0; i < voices; i++) {
    const osc = offline.createOscillator();
    osc.type = "sine";

    // Per‑voice gain
    const voiceGain = offline.createGain();

    // Distance from center voice
    const distance = Math.abs(i - centerIndex);

    if (distance === 0) {
      // Center voice: full volume, no detune
      voiceGain.gain.value = 1.0;
      osc.detune.value = 0;
    } else {
      // Side voices: quieter + detuned
      voiceGain.gain.value = 0.35; // tweakable
      const sign = i < centerIndex ? -1 : 1;
      osc.detune.value = sign * distance * P.detuneSpread;
    }

    // Root note
    osc.frequency.value = midiToFreq(P.midiNote);

    // Apply all FM modulators
    modGains.forEach(mg => mg.connect(osc.frequency));

    // Connect voice → envelope
    osc.connect(voiceGain).connect(env);

    osc.start(0);
    osc.stop(noteLength);
  }

  // --- Start ALL modulators ONCE ---
  modulators.forEach(mod => {
    mod.start(0);
    mod.stop(noteLength);
  });

  // --- Start chorus LFO ---
  chorusLFO.start(0);
  chorusLFO.stop(P.renderDuration);

  // Render + play
  const rendered = await offline.startRendering();
  const wav = bufferToWav(rendered);

  const blob = new Blob([wav], { type: "audio/wav" });
  const url = URL.createObjectURL(blob);

  const audio = new Audio(url);
  audio.play();
});

// ============================================================
//  UTILITIES
// ============================================================

function generateImpulse(ctx, seconds) {
  const rate = ctx.sampleRate;
  const length = rate * seconds;
  const impulse = ctx.createBuffer(2, length, rate);

  for (let c = 0; c < 2; c++) {
    const channel = impulse.getChannelData(c);
    for (let i = 0; i < length; i++) {
      const t = i / length;
      const decay = Math.pow(1 - t, 4);
      const noise = (Math.random() * 2 - 1) * decay;
      channel[i] = noise * 0.6;
    }
  }
  return impulse;
}

function bufferToWav(buffer) {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1;
  const bitDepth = 16;

  let samples = buffer.getChannelData(0);
  let length = samples.length * numChannels * 2 + 44;
  let bufferOut = new ArrayBuffer(length);
  let view = new DataView(bufferOut);

  writeString(view, 0, "RIFF");
  view.setUint32(4, length - 8, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, "data");
  view.setUint32(40, samples.length * numChannels * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    for (let c = 0; c < numChannels; c++) {
      let s = buffer.getChannelData(c)[i];
      s = Math.max(-1, Math.min(1, s));
      view.setInt16(offset, s * 0x7fff, true);
      offset += 2;
    }
  }
  return bufferOut;
}

function writeString(view, offset, str) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

function midiToFreq(m) {
  return 440 * Math.pow(2, (m - 69) / 12);
}
