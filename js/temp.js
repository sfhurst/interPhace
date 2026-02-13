// ============================================================
//  FM ENGINE INIT (UI + AUDITION + DSP)
// ============================================================

let currentAudio = null;

window.initFMSynth = function () {
  initRatioButtons();
  initWaveButtons();
  initSampleRateButtons();

  UI.bindSlider("detuneAmount", "detuneAmountValue", v => {
    P.detuneAmount = Number(v);
    return Math.round(v) + "%";
  });

  UI.bindSlider("mod1Gain", "mod1GainValue", v => {
    P.modulators[0].gain = Math.pow(Number(v) / 100, 2) * 800;
    return Math.round(v) + "%";
  });

  UI.bindSlider("mod2Gain", "mod2GainValue", v => {
    P.modulators[1].gain = Math.pow(Number(v) / 100, 2) * 800;
    return Math.round(v) + "%";
  });

  const button = document.getElementById("play");
  button.addEventListener("click", handlePlayClick);
};

// ============================================================
//  AUDITION + DSP
// ============================================================

async function handlePlayClick() {
  if (currentAudio) {
    const { ctx, gainNode, source } = currentAudio;

    const now = ctx.currentTime;
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(gainNode.gain.value, now);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.5);

    setTimeout(() => {
      try {
        source.stop();
      } catch (e) {}
      ctx.close();
    }, 600);

    currentAudio = null;
    return;
  }

  updateParamsFromHTML();

  const mult = P.envMult;

  const tA = P.attack1 * mult;
  const tH1 = P.hold1 * mult;
  const tD1 = P.decay1 * mult;
  const tH2 = P.hold2 * mult;
  const tD2 = P.decay2 * mult;

  const totalEnvTime = tA + tH1 + tD1 + tH2 + tD2;
  const renderTime = Math.max(P.renderDuration, totalEnvTime + 0.1);

  const offline = new OfflineAudioContext(2, P.sampleRate * renderTime, P.sampleRate);

  const baseFreq = midiToFreq(P.midiNote);

  // envelope
  const env = offline.createGain();
  env.gain.setValueAtTime(0, 0);

  const t0 = 0;
  const tA_end = t0 + tA;
  const tH1_end = tA_end + tH1;
  const tD1_end = tH1_end + tD1;
  const tH2_end = tD1_end + tH2;
  const tD2_end = tH2_end + tD2;

  env.gain.linearRampToValueAtTime(1.0, tA_end);
  env.gain.setValueAtTime(1.0, tH1_end);
  env.gain.linearRampToValueAtTime(P.decay1Target, tD1_end);
  env.gain.setValueAtTime(P.decay1Target, tH2_end);
  env.gain.linearRampToValueAtTime(0.0, tD2_end);

  const noteLength = tD2_end;

  const outGain = offline.createGain();
  outGain.gain.value = 0.6;
  env.connect(outGain).connect(offline.destination);

  // modulators
  function normalizeWave(w) {
    return w === "saw" ? "sawtooth" : w;
  }

  const mod1 = offline.createOscillator();
  mod1.type = normalizeWave(P.modulators[0].wave);
  mod1.frequency.value = baseFreq * P.modulators[0].ratio;

  const mod1Gain = offline.createGain();

  ////
  ////

  mod1Gain.gain.value = P.modulators[0].gain;
  mod1.connect(mod1Gain);

  const mod2 = offline.createOscillator();
  mod2.type = normalizeWave(P.modulators[1].wave);
  mod2.frequency.value = baseFreq * P.modulators[1].ratio;

  const mod2Gain = offline.createGain();
  mod2Gain.gain.value = P.modulators[1].gain;
  mod2.connect(mod2Gain);

  mod2Gain.connect(mod1.frequency);

  mod1.start(0);
  mod1.stop(noteLength);

  mod2.start(0);
  mod2.stop(noteLength);

  // detune
  if (P.detuneAmount > 0) {
    const amt = P.detuneAmount;

    const left = offline.createOscillator();
    left.type = "sine";
    left.frequency.value = baseFreq * (1 - amt * 0.0003);

    const right = offline.createOscillator();
    right.type = "sine";
    right.frequency.value = baseFreq * (1 + amt * 0.0003);

    const leftGain = offline.createGain();
    const rightGain = offline.createGain();

    leftGain.gain.setValueAtTime(0, 0);
    rightGain.gain.setValueAtTime(0, 0);

    leftGain.gain.linearRampToValueAtTime(1, 0.05);
    rightGain.gain.linearRampToValueAtTime(1, 0.05);

    const leftPan = offline.createStereoPanner();
    leftPan.pan.value = -1;

    const rightPan = offline.createStereoPanner();
    rightPan.pan.value = 1;

    mod1Gain.connect(left.frequency);
    mod1Gain.connect(right.frequency);

    left.connect(leftGain).connect(leftPan).connect(env);
    right.connect(rightGain).connect(rightPan).connect(env);

    left.start(0);
    right.start(0);

    left.stop(noteLength);
    right.stop(noteLength);
  } else {
    const osc = offline.createOscillator();
    osc.type = "sine";
    osc.frequency.value = baseFreq;

    mod1Gain.connect(osc.frequency);

    osc.connect(env);
    osc.start(0);
    osc.stop(noteLength);
  }

  // render → playback
  const rendered = await offline.startRendering();
  const wav = bufferToWav(rendered);
  const blob = new Blob([wav], { type: "audio/wav" });
  const arrayBuffer = await blob.arrayBuffer();

  const ctx = new AudioContext();
  const buffer = await ctx.decodeAudioData(arrayBuffer);

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const gainNode = ctx.createGain();
  gainNode.gain.value = 1.0;

  source.connect(gainNode).connect(ctx.destination);
  source.start();

  currentAudio = { ctx, source, gainNode };

  source.onended = () => {
    currentAudio = null;
  };
}
