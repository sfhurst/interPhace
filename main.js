// ============================================================
//  PARAMETER BANK
// ============================================================

const P = {
  midiNote: 60,

  // Spread (Operator-style)
  spreadAmount: 0.0, // slider controls this
  spreadGain: 0.35, // side partials quieter

  // AHDHD envelope
  attack1: 0.02,
  hold1: 0.05,
  decay1: 0.4,
  decay1Target: 0.7,
  hold2: 0.15,
  decay2: 1.0,

  modulators: [
    { octave: 0, gain: 0 },
    { octave: 0, gain: 0 },
  ],

  sampleRate: 192000,
  renderDuration: 8.0,
};

const button = document.getElementById("play");

// ============================================================
//  UI → PARAMS
// ============================================================

function updateParamsFromHTML() {
  P.midiNote = Number(document.getElementById("midiNote").value);

  P.attack1 = Number(document.getElementById("attack1").value);
  P.hold1 = Number(document.getElementById("hold1").value);
  P.decay1 = Number(document.getElementById("decay1").value);
  P.decay1Target = Number(document.getElementById("decay1Target").value) / 100;
  P.hold2 = Number(document.getElementById("hold2").value);
  P.decay2 = Number(document.getElementById("decay2").value);

  P.modulators[0].gain = Number(document.getElementById("mod1Gain").value);
  P.modulators[1].gain = Number(document.getElementById("mod2Gain").value);

  P.spreadAmount = Number(document.getElementById("spreadAmount").value);

  P.sampleRate = Number(document.getElementById("sampleRate").value);
  P.renderDuration = Number(document.getElementById("renderDuration").value);
}

function initOctaveButtons() {
  const groups = document.querySelectorAll(".oct-row");
  groups.forEach(group => {
    const modIndex = Number(group.getAttribute("data-mod")) - 1;
    if (modIndex < 0) return; // skip unison row

    group.addEventListener("click", e => {
      if (!(e.target instanceof HTMLButtonElement)) return;
      const oct = Number(e.target.getAttribute("data-oct"));
      P.modulators[modIndex].octave = oct;

      group.querySelectorAll(".oct-btn").forEach(btn => btn.classList.toggle("active", btn === e.target));
    });
  });
}

initOctaveButtons();

// ============================================================
//  MAIN ENGINE
// ============================================================

button.addEventListener("click", async () => {
  updateParamsFromHTML();

  const offline = new OfflineAudioContext(2, P.sampleRate * P.renderDuration, P.sampleRate);

  const baseFreq = midiToFreq(P.midiNote);

  // --- Envelope ---
  const env = offline.createGain();
  env.gain.setValueAtTime(0, 0);

  const t0 = 0;
  const tA = t0 + P.attack1;
  const tH1 = tA + P.hold1;
  const tD1 = tH1 + P.decay1;
  const tH2 = tD1 + P.hold2;
  const tD2 = tH2 + P.decay2;

  const d1Target = P.decay1Target;

  env.gain.linearRampToValueAtTime(1.0, tA);
  env.gain.setValueAtTime(1.0, tH1);
  env.gain.linearRampToValueAtTime(d1Target, tD1);
  env.gain.setValueAtTime(d1Target, tH2);
  env.gain.linearRampToValueAtTime(0.0, tD2);

  const noteLength = tD2;

  // --- Output stage (this was missing) ---
  const outGain = offline.createGain();
  outGain.gain.value = 0.6;

  env.connect(outGain).connect(offline.destination);

  // ============================================================
  //  FM MODULATORS (must exist before Spread voices)
  // ============================================================

  // --- Modulator 1 ---
  const mod1 = offline.createOscillator();
  mod1.type = "sine";
  mod1.frequency.value = baseFreq * Math.pow(2, P.modulators[0].octave);

  const mod1Gain = offline.createGain();
  mod1Gain.gain.value = P.modulators[0].gain;

  mod1.connect(mod1Gain);

  // --- Modulator 2 ---
  const mod2 = offline.createOscillator();
  mod2.type = "sine";
  mod2.frequency.value = baseFreq * Math.pow(2, P.modulators[1].octave);

  const mod2Gain = offline.createGain();
  mod2Gain.gain.value = P.modulators[1].gain;

  mod2.connect(mod2Gain);
  mod2Gain.connect(mod1.frequency);

  // Start modulators
  mod1.start(0);
  mod1.stop(noteLength);

  mod2.start(0);
  mod2.stop(noteLength);

  // ============================================================
  //  SPREAD (Operator-style)
  // ============================================================

  if (P.spreadAmount > 0) {
    const phaseOffset = P.spreadAmount * (1 / baseFreq);

    // Left oscillator
    const left = offline.createOscillator();
    left.type = "sine";
    left.frequency.value = baseFreq;

    const leftPan = offline.createStereoPanner();
    leftPan.pan.value = -1;

    // Right oscillator
    const right = offline.createOscillator();
    right.type = "sine";
    right.frequency.value = baseFreq * (1 + P.spreadAmount * 0.001); // phase-rate offset

    const rightPan = offline.createStereoPanner();
    rightPan.pan.value = 1;

    // Micro-delay for intensity
    const microDelay = offline.createDelay();
    microDelay.delayTime.value = P.spreadAmount * 0.002; // up to ~2ms

    // FM mod1 → both
    mod1Gain.connect(left.frequency);
    mod1Gain.connect(right.frequency);

    // Amplitude asymmetry
    const gLeft = offline.createGain();
    gLeft.gain.value = 1.0;

    const gRight = offline.createGain();
    gRight.gain.value = 0.95;

    left.connect(gLeft).connect(leftPan).connect(env);
    right.connect(gRight).connect(microDelay).connect(rightPan).connect(env);

    left.start(0);
    right.start(phaseOffset);

    left.stop(noteLength);
    right.stop(noteLength);
  } else {
    // Pure mono oscillator
    const osc = offline.createOscillator();
    osc.type = "sine";
    osc.frequency.value = baseFreq;

    mod1Gain.connect(osc.frequency);

    osc.connect(env);
    osc.start(0);
    osc.stop(noteLength);
  }

  // ============================================================
  //  RENDER + PLAY
  // ============================================================

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

function bufferToWav(buffer) {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1;
  const bitDepth = 16;

  const samples = buffer.getChannelData(0);
  const length = samples.length * numChannels * 2 + 44;
  const bufferOut = new ArrayBuffer(length);
  const view = new DataView(bufferOut);

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
