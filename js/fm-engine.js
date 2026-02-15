// ============================================================
//  FM SYNTH ENGINE - ENHANCED FOR PRETTY HIGHS
// ============================================================

window.FMEngine = {};

// ------------------------------------------------------------
//  FM DEPTH PRESET TABLE (index, attack, decay)
// ------------------------------------------------------------

const FM_DEPTH_PRESETS = [
  // 0 — no modulation
  { index: 0, attack: 0, decay: 0 },

  // 1–5: short attack, short decay (plucks, EP tines)
  { index: 0.25, attack: 0.01, decay: 0.05 },
  { index: 0.4, attack: 0.01, decay: 0.06 },
  { index: 0.6, attack: 0.015, decay: 0.07 },
  { index: 0.8, attack: 0.02, decay: 0.08 },
  { index: 1.0, attack: 0.02, decay: 0.1 },

  // 6–10: short attack, long decay (bells, chimes) ← YOUR SOUND IS HERE
  { index: 1.2, attack: 0.02, decay: 0.2 },
  { index: 1.5, attack: 0.03, decay: 0.3 },
  { index: 2.0, attack: 0.03, decay: 0.4 },
  { index: 2.5, attack: 0.04, decay: 0.5 },
  { index: 3.0, attack: 0.05, decay: 0.6 },

  // 11–15: long attack, short decay (reverse-ish, expressive keys)
  { index: 0.4, attack: 0.3, decay: 0.1 },
  { index: 0.6, attack: 0.4, decay: 0.15 },
  { index: 0.8, attack: 0.5, decay: 0.2 },
  { index: 1.2, attack: 0.6, decay: 0.25 },
  { index: 1.5, attack: 0.7, decay: 0.3 },

  // 16–20: long attack, long decay (pads, blooms)
  { index: 0.5, attack: 0.2, decay: 0.4 },
  { index: 0.75, attack: 0.3, decay: 0.5 },
  { index: 1.0, attack: 0.4, decay: 0.6 },
  { index: 1.5, attack: 0.5, decay: 0.7 },
  { index: 2.0, attack: 0.6, decay: 0.8 },
];

// ------------------------------------------------------------
//  REGISTER DEFAULTS
// ------------------------------------------------------------

FMEngine.register = function (patch) {
  patch.synth.fm = {
    modulators: [
      { ratio: 1.0, gain: 0, wave: "sine" },
      { ratio: 2.0, gain: 0, wave: "sine" },
    ],
    fmDepthPreset: 0,
    stereoWidth: 0, // NEW: 0-100 for stereo spread
  };
};

// ------------------------------------------------------------
//  UI
// ------------------------------------------------------------

FMEngine.initUI = function (patch) {
  const fm = patch.synth.fm;

  initFMRatioUI(fm);
  initFMWaveUI(fm);

  UI.bindSlider("mod1Gain", "mod1GainValue", v => {
    fm.modulators[0].gain = Number(v);
    return Math.round(v) + "%";
  });

  UI.bindSlider("mod2Gain", "mod2GainValue", v => {
    fm.modulators[1].gain = Number(v);
    return Math.round(v) + "%";
  });

  UI.bindSlider("detuneAmount", "detuneAmountValue", v => {
    patch.fx.detune.amount = Number(v);
    return Math.round(v) + "%";
  });

  UI.bindSlider("chorusAmount", "chorusAmountValue", v => {
    patch.fx.chorus.amount = Number(v);
    return Math.round(v) + "%";
  });

  UI.bindSlider("reverbAmount", "reverbAmountValue", v => {
    patch.fx.reverb.amount = Number(v);
    return Math.round(v) + "%";
  });

  // FM depth preset slider
  UI.bindSlider("fmDepthPreset", "fmDepthPresetValue", v => {
    fm.fmDepthPreset = Number(v);

    // prettier-ignore
    const names = [
    "Off",
    "Pluck Soft", "Pluck Bright", "Tine Light", "Tine Sharp", "Tine Hard",
    "Bell Soft", "Bell Clear", "Bell Bright", "Chime Air", "Chime Long",
    "Rise Tap", "Rise Hit", "Rise Snap", "Sweep Tap", "Sweep Hit",
    "Bloom Soft", "Bloom Warm", "Bloom Wide", "Pad Rise", "Pad Glow"
  ];

    return names[v] || "Preset";
  });

  // NEW: Stereo width slider (if you add it to HTML)
  const stereoWidthSlider = document.getElementById("stereoWidth");
  const stereoWidthValue = document.getElementById("stereoWidthValue");
  if (stereoWidthSlider && stereoWidthValue) {
    stereoWidthSlider.addEventListener("input", () => {
      fm.stereoWidth = Number(stereoWidthSlider.value);
      stereoWidthValue.textContent = Math.round(fm.stereoWidth) + "%";
    });
    stereoWidthSlider.value = fm.stereoWidth;
    stereoWidthValue.textContent = Math.round(fm.stereoWidth) + "%";
  }
};

function initFMRatioUI(fm) {
  const groups = document.querySelectorAll(".ratio-row");

  groups.forEach(group => {
    const modIndex = Number(group.getAttribute("data-mod")) - 1;
    if (modIndex < 0) return;

    group.addEventListener("click", e => {
      const btn = e.target.closest("button");
      if (!btn || !btn.hasAttribute("data-ratio")) return;

      fm.modulators[modIndex].ratio = Number(btn.dataset.ratio);

      group.querySelectorAll(".ratio-btn").forEach(b => b.classList.toggle("active", b === btn));
    });
  });
}

function initFMWaveUI(fm) {
  const groups = document.querySelectorAll(".wave-row");

  groups.forEach(group => {
    const modIndex = Number(group.getAttribute("data-mod")) - 1;

    group.addEventListener("click", e => {
      const btn = e.target.closest("button");
      if (!btn || !btn.hasAttribute("data-wave")) return;

      fm.modulators[modIndex].wave = btn.dataset.wave;

      group.querySelectorAll(".ratio-btn").forEach(b => b.classList.toggle("active", b === btn));
    });
  });
}

// ------------------------------------------------------------
//  BUILD RAW FM AUDIO (ENHANCED)
// ------------------------------------------------------------

FMEngine.build = function (ctx, baseFreq, fmParams, noteLength) {
  function normalizeWave(w) {
    return w === "saw" ? "sawtooth" : w;
  }

  // FM index lookup table
  // prettier-ignore
  const FM_INDEX_TABLE = [
    0.00,0.01,0.02,0.03,0.04,0.05,0.06,0.07,0.08,0.09,
    0.10,0.12,0.14,0.16,0.18,0.20,0.23,0.26,0.29,0.32,
    0.36,0.40,0.44,0.48,0.52,0.56,0.60,0.65,0.70,0.75,
    0.80,0.85,0.90,0.96,1.02,1.08,1.14,1.20,1.27,1.34,
    1.41,1.48,1.55,1.63,1.71,1.79,1.87,1.95,2.04,2.13,
    2.22,2.31,2.41,2.51,2.61,2.72,2.83,2.94,3.05,3.17,
    3.29,3.41,3.54,3.67,3.80,3.94,4.08,4.22,4.37,4.52,
    4.67,4.83,4.99,5.15,5.32,5.49,5.66,5.84,6.02,6.20,
    6.39,6.58,6.77,6.97,7.17,7.38,7.59,7.80,8.02,8.24,
    8.47,8.70,8.94,9.18,9.43,9.68,9.94,10.20,10.47,10.74
  ];

  function computeDeviation(modFreq, slider) {
    return FM_INDEX_TABLE[slider] * modFreq;
  }

  // freq → MIDI
  function freqToMidi(freq) {
    return 69 + 12 * Math.log2(freq / 440);
  }

  // ENHANCED: Key scaling curve (SOFTER for high notes)
  function computeKeyScale(freq) {
    const midi = freqToMidi(freq);

    if (midi <= 60) return 1.0; // Low notes: full modulation
    if (midi >= 108) return 0.15; // Very high notes: gentle modulation

    // Smoother curve for prettier highs
    if (midi <= 72) return 1.0 - 0.12 * ((midi - 60) / 12); // C4-C5: 1.0 → 0.88
    if (midi <= 84) return 0.88 - 0.28 * ((midi - 72) / 12); // C5-C6: 0.88 → 0.6
    if (midi <= 96) return 0.6 - 0.25 * ((midi - 84) / 12); // C6-C7: 0.6 → 0.35

    return 0.35 - 0.2 * ((midi - 96) / 12); // C7-C8: 0.35 → 0.15
  }

  // Additive FM depth envelope using preset table
  function applyFMDepthEnvelope(gainParam, baseFM, t0, attack, decay, index, mod1Freq) {
    if (baseFM === 0 || index === 0) return;

    const start = t0 + 0.001;

    const peakDelta = index * mod1Freq;
    const peakFM = baseFM + peakDelta;

    gainParam.cancelScheduledValues(start);
    gainParam.setValueAtTime(baseFM, start);
    gainParam.linearRampToValueAtTime(peakFM, start + attack);
    gainParam.linearRampToValueAtTime(baseFM, start + attack + decay);
  }

  const t0 = ctx.currentTime;
  const keyScale = computeKeyScale(baseFreq);

  // NEW: Apply stereo width (slight frequency offset between L/R)
  const stereoDetune = (fmParams.stereoWidth || 0) / 100; // 0-1
  const freqOffset = baseFreq * 0.002 * stereoDetune; // Up to 0.2% detune

  // We'll return TWO carriers for stereo (L/R)
  const carriers = [];

  // Create LEFT and RIGHT carriers
  for (let channel = 0; channel < 2; channel++) {
    const carrierFreq = channel === 0 
      ? baseFreq - freqOffset  // Left: slightly flat
      : baseFreq + freqOffset; // Right: slightly sharp

    // -----------------------------
    //  MODULATOR 1
    // -----------------------------
    const mod1Freq = carrierFreq * fmParams.modulators[0].ratio;

    const mod1 = ctx.createOscillator();
    mod1.type = normalizeWave(fmParams.modulators[0].wave);
    mod1.frequency.setValueAtTime(mod1Freq, t0);

    const mod1Deviation = computeDeviation(mod1Freq, fmParams.modulators[0].gain) * keyScale;

    const mod1Gain = ctx.createGain();
    mod1Gain.gain.setValueAtTime(mod1Deviation, t0);

    // Apply preset-based FM depth envelope
    const preset = FM_DEPTH_PRESETS[fmParams.fmDepthPreset];

    applyFMDepthEnvelope(mod1Gain.gain, mod1Deviation, t0, preset.attack, preset.decay, preset.index, mod1Freq);

    mod1.connect(mod1Gain);

    // -----------------------------
    //  MODULATOR 2 → MODULATOR 1
    // -----------------------------
    const mod2Freq = carrierFreq * fmParams.modulators[1].ratio;

    const mod2 = ctx.createOscillator();
    mod2.type = normalizeWave(fmParams.modulators[1].wave);
    mod2.frequency.setValueAtTime(mod2Freq, t0);

    const mod2Deviation = computeDeviation(mod2Freq, fmParams.modulators[1].gain) * keyScale;

    const mod2Gain = ctx.createGain();
    mod2Gain.gain.setValueAtTime(mod2Deviation, t0);

    mod2.connect(mod2Gain);
    mod2Gain.connect(mod1.frequency);

    // -----------------------------
    //  CARRIER
    // -----------------------------
    const carrier = ctx.createOscillator();
    carrier.type = "sine";
    carrier.frequency.setValueAtTime(carrierFreq, t0);

    mod1Gain.connect(carrier.frequency);

    // -----------------------------
    //  START / STOP
    // -----------------------------
    mod1.start(t0);
    mod2.start(t0);
    carrier.start(t0);

    const tStop = t0 + noteLength;
    mod1.stop(tStop);
    mod2.stop(tStop);
    carrier.stop(tStop);

    carriers.push(carrier);
  }

  // Merge L/R carriers into stereo
  const merger = ctx.createChannelMerger(2);
  carriers[0].connect(merger, 0, 0); // Left
  carriers[1].connect(merger, 0, 1); // Right

  return { node: merger }; // Return stereo node
};
