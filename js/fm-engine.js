// 0.5 → 2.0   // 1:4 — bright, harmonic, clean; great for plucks & bells
// 0.5 → 3.0   // 1:6 — shimmering, airy, digital‑piano sparkle

// 0.75 → 1.5  // 1:2 — gentle, glassy, Operator‑ish EP tones
// 0.75 → 2.0  // 3:8 — airy, hollow‑sweet, dreamy pads

// 1.0 → 1.5   // 2:3 — classic FM bell sweetness, glassy & stable
// 1.0 → 2.0   // 1:2 — bright, clean, DX7‑EP foundation
// 1.0 → 3.0   // 1:3 — chimey, crystalline, mallet‑like

// 1.5 → 2.0   // 3:4 — sweet, shimmering, emotional; perfect for pads & keys
// 1.5 → 3.0   // 1:2 — bright but controlled; expressive EP & bell tones

// 2.0 → 1.0   // 2:1 — bold, stable, classic FM; great for bass & leads
// 2.0 → 1.5   // 4:3 — warm, harmonically rich, rounded FM

// 3.0 → 1.5   // 2:1 — bright but musical; bell/mallet territory
// 3.0 → 1.0   // 3:1 — metallic but still harmonic; percussive FM

// ============================================================
//  FM SYNTH ENGINE
// ============================================================

window.FMEngine = {};

// ------------------------------------------------------------
//  REGISTER DEFAULTS
// ------------------------------------------------------------

FMEngine.register = function (patch) {
  patch.synth.fm = {
    modulators: [
      { ratio: 1, gain: 0, wave: "sine" }, // gain: 0–100 (percent)
      { ratio: 2, gain: 0, wave: "sine" },
    ],
  };
};

// ------------------------------------------------------------
//  UI
// ------------------------------------------------------------

FMEngine.initUI = function (patch) {
  const fm = patch.synth.fm;

  initFMRatioUI(fm);
  initFMWaveUI(fm);

  // Store gain as 0–100 (percent)
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
//  BUILD RAW FM AUDIO (Operator-style FM scaling + key scaling)
// ------------------------------------------------------------

FMEngine.build = function (ctx, baseFreq, fmParams, noteLength) {
  function normalizeWave(w) {
    return w === "saw" ? "sawtooth" : w;
  }

  // prettier-ignore
  const FM_INDEX_TABLE = [
    0.00, 0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.09,
    0.10, 0.12, 0.14, 0.16, 0.18, 0.20, 0.23, 0.26, 0.29, 0.32,
    0.36, 0.40, 0.44, 0.48, 0.52, 0.56, 0.60, 0.65, 0.70, 0.75,
    0.80, 0.85, 0.90, 0.96, 1.02, 1.08, 1.14, 1.20, 1.27, 1.34,
    1.41, 1.48, 1.55, 1.63, 1.71, 1.79, 1.87, 1.95, 2.04, 2.13,
    2.22, 2.31, 2.41, 2.51, 2.61, 2.72, 2.83, 2.94, 3.05, 3.17,
    3.29, 3.41, 3.54, 3.67, 3.80, 3.94, 4.08, 4.22, 4.37, 4.52,
    4.67, 4.83, 4.99, 5.15, 5.32, 5.49, 5.66, 5.84, 6.02, 6.20,
    6.39, 6.58, 6.77, 6.97, 7.17, 7.38, 7.59, 7.80, 8.02, 8.24,
    8.47, 8.70, 8.94, 9.18, 9.43, 9.68, 9.94, 10.20, 10.47, 10.74
  ];

  function computeDeviation(modFreq, slider) {
    const index = FM_INDEX_TABLE[slider];
    return index * modFreq;
  }

  // Convert frequency → MIDI note
  function freqToMidi(freq) {
    return 69 + 12 * Math.log2(freq / 440);
  }

  // Key-scaling curve:
  // C2–C4: full
  // C5: gentle reduction
  // C6: strong reduction
  // C7: heavy reduction
  // C8: very heavy reduction
  function computeKeyScale(freq) {
    const midi = freqToMidi(freq);

    if (midi <= 60) return 1.0; // C4 and below
    if (midi >= 108) return 0.25; // C8 and above

    // interpolate between:
    // midi 60 → scale 1.0
    // midi 72 → scale 0.85
    // midi 84 → scale 0.60
    // midi 96 → scale 0.40
    // midi 108 → scale 0.25

    if (midi <= 72) {
      const t = (midi - 60) / 12;
      return 1.0 - 0.15 * t; // 1.0 → 0.85
    }

    if (midi <= 84) {
      const t = (midi - 72) / 12;
      return 0.85 - 0.25 * t; // 0.85 → 0.60
    }

    if (midi <= 96) {
      const t = (midi - 84) / 12;
      return 0.6 - 0.2 * t; // 0.60 → 0.40
    }

    // 96 → 108
    const t = (midi - 96) / 12;
    return 0.4 - 0.15 * t; // 0.40 → 0.25
  }

  const t0 = ctx.currentTime;
  const keyScale = computeKeyScale(baseFreq);

  // -----------------------------
  //  MODULATOR 1
  // -----------------------------
  const mod1Freq = baseFreq * fmParams.modulators[0].ratio;

  const mod1 = ctx.createOscillator();
  mod1.type = normalizeWave(fmParams.modulators[0].wave);
  mod1.frequency.setValueAtTime(mod1Freq, t0);

  const mod1Deviation = computeDeviation(mod1Freq, fmParams.modulators[0].gain) * keyScale;

  const mod1Gain = ctx.createGain();
  mod1Gain.gain.setValueAtTime(mod1Deviation, t0);

  mod1.connect(mod1Gain);

  // -----------------------------
  //  MODULATOR 2 → MODULATOR 1
  // -----------------------------
  const mod2Freq = baseFreq * fmParams.modulators[1].ratio;

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
  carrier.frequency.setValueAtTime(baseFreq, t0);

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

  return { node: carrier };
};
