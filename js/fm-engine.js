// ============================================================
//  FM ENGINE INIT (UI + AUDITION + DSP)
// ============================================================

window.initFMSynth = function () {
  initFMRatioUI();
  initFMWaveUI();
  initSampleRateUI(); // UI only

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
};

// ============================================================
//  FM ENGINE: START PLAYBACK ONLY (NO STOP LOGIC)
// ============================================================

window.startFMSynth = function () {
  updateParamsFromHTML();

  const mult = P.envMult;

  const tA = P.attack1 * mult;
  const tH1 = P.hold1 * mult;
  const tD1 = P.decay1 * mult;
  const tH2 = P.hold2 * mult;
  const tD2 = P.decay2 * mult;

  const noteLength = tA + tH1 + tD1 + tH2 + tD2;

  const ctx = new AudioContext();
  const baseFreq = midiToFreq(P.midiNote);

  // Envelope
  const env = ctx.createGain();
  env.gain.setValueAtTime(0, ctx.currentTime);

  const t0 = ctx.currentTime;
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

  const outGain = ctx.createGain();
  outGain.gain.value = 0.6;
  env.connect(outGain).connect(ctx.destination);

  // ============================================================
  //  MODULATORS
  // ============================================================

  function normalizeWave(w) {
    return w === "saw" ? "sawtooth" : w;
  }

  const mod1 = ctx.createOscillator();
  mod1.type = normalizeWave(P.modulators[0].wave);
  mod1.frequency.value = baseFreq * P.modulators[0].ratio;

  const mod1Gain = ctx.createGain();

  // Baked‑in FM depth envelope
  mod1Gain.gain.setValueAtTime(0, t0);
  mod1Gain.gain.linearRampToValueAtTime(600, t0 + 0.15);
  mod1Gain.gain.linearRampToValueAtTime(50, t0 + 0.4);
  mod1Gain.gain.linearRampToValueAtTime(300, t0 + 0.7);
  mod1Gain.gain.linearRampToValueAtTime(0, t0 + noteLength);

  mod1.connect(mod1Gain);

  const mod2 = ctx.createOscillator();
  mod2.type = normalizeWave(P.modulators[1].wave);
  mod2.frequency.value = baseFreq * P.modulators[1].ratio;

  const mod2Gain = ctx.createGain();
  mod2Gain.gain.value = P.modulators[1].gain;

  mod2.connect(mod2Gain);
  mod2Gain.connect(mod1.frequency);

  // ============================================================
  //  CARRIER (FINAL FM SOUND SOURCE)
  // ============================================================

  const carrier = ctx.createOscillator();
  carrier.type = "sine";
  carrier.frequency.value = baseFreq;

  mod1Gain.connect(carrier.frequency);
  carrier.connect(env);

  mod1.start(t0);
  mod2.start(t0);
  carrier.start(t0);

  setTimeout(
    () => {
      if (activePlayback && activePlayback.ctx === ctx) {
        activePlayback = null;
      }
    },
    (noteLength + 0.1) * 1000,
  );

  mod1.stop(t0 + noteLength);
  mod2.stop(t0 + noteLength);
  carrier.stop(t0 + noteLength);

  // ============================================================
  //  DETUNE EFFECT (POST-FM, AUDIO-ONLY)
  // ============================================================

  applyDetuneEffect(ctx, carrier, env, noteLength, P.detuneAmount);

  // ============================================================
  //  RETURN HANDLE TO GLOBAL STOP SYSTEM
  // ============================================================

  return {
    ctx,
    outGain,
    noteLength,
  };
};
