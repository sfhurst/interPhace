// ============================================================
//  FM ENGINE (AUDITION + LINEAR ENV + MULTIPLIER)
// ============================================================

let currentAudio = null;

window.initFMSynth = function () {
  initRatioButtons();
  initWaveButtons();
  initSampleRateButtons();

  const button = document.getElementById("play");

  button.addEventListener("click", async () => {
    // ------------------------------------------------------------
    //  If audio is already playing → fade out + stop
    // ------------------------------------------------------------
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

    // ------------------------------------------------------------
    //  Render new audio
    // ------------------------------------------------------------
    updateParamsFromHTML();

    const mult = P.envMult; // 0.25 → 100 from UI

    // Slider values are 0.000–1.000, we scale by mult to get seconds
    const tA = P.attack1 * mult;
    const tH1 = P.hold1 * mult;
    const tD1 = P.decay1 * mult;
    const tH2 = P.hold2 * mult;
    const tD2 = P.decay2 * mult;

    const totalEnvTime = tA + tH1 + tD1 + tH2 + tD2;
    const renderTime = Math.max(P.renderDuration, totalEnvTime + 0.1);

    const offline = new OfflineAudioContext(2, P.sampleRate * renderTime, P.sampleRate);

    const baseFreq = midiToFreq(P.midiNote);

    // ============================================================
    //  ENVELOPE
    // ============================================================

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

    // ============================================================
    //  FM MODULATORS
    // ============================================================

    // Debug: confirm the UI actually wrote the values you think it did
    console.log("mod1 wave:", P.modulators[0].wave);
    console.log("mod1 freq:", baseFreq * Math.pow(2, P.modulators[0].ratio));
    console.log("mod1 gain:", P.modulators[0].gain);
    console.log("mod2 wave:", P.modulators[1].wave);
    console.log("mod2 freq:", baseFreq * Math.pow(2, P.modulators[1].ratio));
    console.log("mod2 gain:", P.modulators[1].gain);

    function normalizeWave(w) {
      if (w === "saw") return "sawtooth";
      return w;
    }

    // --- Mod 1 ---
    const mod1 = offline.createOscillator();
    mod1.type = normalizeWave(P.modulators[0].wave);
    mod1.frequency.value = baseFreq * P.modulators[0].ratio;

    const mod1Gain = offline.createGain();
    mod1Gain.gain.value = P.modulators[0].gain;
    mod1.connect(mod1Gain);

    // --- Mod 2 ---
    const mod2 = offline.createOscillator();
    mod2.type = normalizeWave(P.modulators[1].wave);
    mod2.frequency.value = baseFreq * P.modulators[1].ratio;

    const mod2Gain = offline.createGain();
    mod2Gain.gain.value = P.modulators[1].gain;
    mod2.connect(mod2Gain);

    // Mod2 → Mod1 frequency
    mod2Gain.connect(mod1.frequency);

    // Start/stop
    mod1.start(0);
    mod1.stop(noteLength);

    mod2.start(0);
    mod2.stop(noteLength);

    // ============================================================
    //  SPREAD (Operator‑style: stable, no delay, no phase offset)
    // ============================================================

    if (P.spreadAmount > 0) {
      // UI 0–100% → DSP 0.00–0.10
      const amt = P.spreadAmount; // already scaled in your UI binding

      const left = offline.createOscillator();
      left.type = "sine";
      left.frequency.value = baseFreq * (1 - amt * 0.001);

      const right = offline.createOscillator();
      right.type = "sine";
      right.frequency.value = baseFreq * (1 + amt * 0.001);

      const leftPan = offline.createStereoPanner();
      leftPan.pan.value = -1;

      const rightPan = offline.createStereoPanner();
      rightPan.pan.value = 1;

      // FM applied identically to both oscillators
      mod1Gain.connect(left.frequency);
      mod1Gain.connect(right.frequency);

      left.connect(leftPan).connect(env);
      right.connect(rightPan).connect(env);

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

    // ============================================================
    //  RENDER → PLAYBACK
    // ============================================================

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
  });
};
