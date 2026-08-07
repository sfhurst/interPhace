// ============================================================
//  INTERPHACE FM ENGINE — MUSICAL TWO-STAGE FM
//  Modulator 2 -> Modulator 1 -> Carrier
// ============================================================

window.FMEngine = {};

const FM_DEPTH_PRESETS = [
  { name: "Off",         points: [[0, 1], [1, 1]], amount: 0.00 },
  { name: "Pluck Soft",  points: [[0, 1.35], [0.08, 1.10], [0.35, 0.35], [1, 0.12]], amount: 0.28 },
  { name: "Pluck Bright",points: [[0, 1.70], [0.05, 1.25], [0.28, 0.28], [1, 0.08]], amount: 0.42 },
  { name: "Tine Light",  points: [[0, 1.45], [0.10, 1.10], [0.48, 0.48], [1, 0.20]], amount: 0.38 },
  { name: "Tine Sharp",  points: [[0, 1.85], [0.06, 1.30], [0.42, 0.42], [1, 0.16]], amount: 0.52 },
  { name: "Tine Hard",   points: [[0, 2.15], [0.04, 1.45], [0.35, 0.34], [1, 0.12]], amount: 0.66 },
  { name: "Bell Soft",   points: [[0, 1.45], [0.08, 1.28], [0.62, 0.62], [1, 0.30]], amount: 0.44 },
  { name: "Bell Clear",  points: [[0, 1.75], [0.07, 1.45], [0.68, 0.70], [1, 0.34]], amount: 0.58 },
  { name: "Bell Bright", points: [[0, 2.10], [0.06, 1.65], [0.72, 0.76], [1, 0.38]], amount: 0.72 },
  { name: "Chime Air",   points: [[0, 1.55], [0.14, 1.38], [0.75, 0.90], [1, 0.55]], amount: 0.56 },
  { name: "Chime Long",  points: [[0, 1.75], [0.15, 1.55], [0.80, 1.00], [1, 0.62]], amount: 0.68 },
  { name: "Rise Tap",    points: [[0, 0.20], [0.35, 0.92], [0.60, 1.30], [1, 0.24]], amount: 0.34 },
  { name: "Rise Hit",    points: [[0, 0.16], [0.38, 1.10], [0.62, 1.58], [1, 0.28]], amount: 0.46 },
  { name: "Rise Snap",   points: [[0, 0.12], [0.42, 1.28], [0.58, 1.85], [1, 0.22]], amount: 0.58 },
  { name: "Sweep Tap",   points: [[0, 0.15], [0.45, 0.75], [0.78, 1.45], [1, 0.42]], amount: 0.44 },
  { name: "Sweep Hit",   points: [[0, 0.12], [0.48, 0.92], [0.80, 1.78], [1, 0.50]], amount: 0.60 },
  { name: "Bloom Soft",  points: [[0, 0.16], [0.28, 0.45], [0.68, 1.05], [1, 0.72]], amount: 0.34 },
  { name: "Bloom Warm",  points: [[0, 0.12], [0.32, 0.52], [0.72, 1.25], [1, 0.82]], amount: 0.46 },
  { name: "Bloom Wide",  points: [[0, 0.10], [0.34, 0.62], [0.76, 1.48], [1, 0.94]], amount: 0.58 },
  { name: "Pad Rise",    points: [[0, 0.10], [0.38, 0.50], [0.82, 1.12], [1, 1.00]], amount: 0.42 },
  { name: "Pad Glow",    points: [[0, 0.12], [0.35, 0.66], [0.78, 1.30], [1, 1.12]], amount: 0.54 },
];

const FM_RATIO_PRESETS = [
  { name: "Pure", mod1: 1.0, mod2: 1.0 },
  { name: "Gentle Octave", mod1: 1.0, mod2: 2.0 },
  { name: "Reverse Octave", mod1: 2.0, mod2: 1.0 },
  { name: "Warm Half", mod1: 0.5, mod2: 1.0 },
  { name: "Slow Under", mod1: 2.0, mod2: 0.5 },
  { name: "Soft Fifth", mod1: 1.0, mod2: 1.5 },
  { name: "Reverse Fifth", mod1: 1.5, mod2: 1.0 },
  { name: "Double", mod1: 2.0, mod2: 2.0 },
  { name: "Octave Motion", mod1: 2.0, mod2: 4.0 },
  { name: "Octave Under", mod1: 4.0, mod2: 2.0 },
  { name: "Fourth Stack", mod1: 2.0, mod2: 3.0 },
  { name: "Fourth Reverse", mod1: 3.0, mod2: 2.0 },
  { name: "Bell", mod1: 1.0, mod2: 3.0 },
  { name: "Bell Reverse", mod1: 3.0, mod2: 1.0 },
  { name: "Glass", mod1: 1.414, mod2: 2.0 },
  { name: "Glass Reverse", mod1: 2.0, mod2: 1.414 },
];

const MOD1_MAX_INDEX = 7.25;
const MOD2_MAX_INDEX = 3.25;

FMEngine.register = function (patch) {
  patch.synth.fm = {
    modulators: [
      { ratio: 1.0, gain: 0, wave: "sine" },
      { ratio: 2.0, gain: 0, wave: "sine" },
    ],
    fmDepthPreset: 0,
    ratioPreset: 0,
    carrierVolume: 100,
    harmonic1: { gain: 0, noteOffset: 0 },
    harmonic2: { gain: 0, noteOffset: 0 },
  };
};

FMEngine.initUI = function (patch) {
  const fm = patch.synth.fm;
  initFMRatioUI(fm);
  initFMWaveUI(fm);

  UI.bindSlider("mod1Gain", "mod1GainValue", value => {
    fm.modulators[0].gain = Number(value);
    return `${Math.round(value)}%`;
  });

  UI.bindSlider("mod2Gain", "mod2GainValue", value => {
    fm.modulators[1].gain = Number(value);
    return `${Math.round(value)}%`;
  });

  UI.bindSlider("fmDepthPreset", "fmDepthPresetValue", value => {
    fm.fmDepthPreset = Number(value);
    return (FM_DEPTH_PRESETS[value] || FM_DEPTH_PRESETS[0]).name;
  });

  initFMRatioPresetUI(fm);
};

function initFMRatioUI(fm) {
  document.querySelectorAll(".ratio-row[data-mod]").forEach(group => {
    const modIndex = Number(group.dataset.mod) - 1;
    if (modIndex < 0 || modIndex > 1) return;

    group.addEventListener("click", event => {
      const button = event.target.closest("button[data-ratio]");
      if (!button) return;
      fm.modulators[modIndex].ratio = Number(button.dataset.ratio);
      group.querySelectorAll(".ratio-btn").forEach(item => {
        item.classList.toggle("active", item === button);
      });
      updateFMRatioPresetState(fm);
    });
  });
}


let loadedFMRatioPresetIndex = 0;

function ratiosMatchPreset(fm, preset) {
  if (!preset || !Array.isArray(fm.modulators)) return false;
  const mod1 = Number(fm.modulators[0]?.ratio);
  const mod2 = Number(fm.modulators[1]?.ratio);
  return Math.abs(mod1 - preset.mod1) < 0.0005 &&
         Math.abs(mod2 - preset.mod2) < 0.0005;
}

function setRatioButtonState(modIndex, ratio) {
  const group = document.querySelector(`.ratio-row[data-mod="${modIndex + 1}"]`);
  if (!group) return;
  group.querySelectorAll("button[data-ratio]").forEach(button => {
    button.classList.toggle(
      "active",
      Math.abs(Number(button.dataset.ratio) - Number(ratio)) < 0.0005
    );
  });
}

function applyFMRatioPreset(fm, index) {
  const safeIndex = Math.max(0, Math.min(FM_RATIO_PRESETS.length - 1, Number(index) || 0));
  const preset = FM_RATIO_PRESETS[safeIndex];
  loadedFMRatioPresetIndex = safeIndex;
  fm.ratioPreset = safeIndex;
  fm.modulators[0].ratio = preset.mod1;
  fm.modulators[1].ratio = preset.mod2;

  setRatioButtonState(0, preset.mod1);
  setRatioButtonState(1, preset.mod2);

  const value = document.getElementById("fmRatioPresetValue");
  if (value) {
    value.textContent = preset.name;
    value.classList.remove("preset-modified");
  }
}

function updateFMRatioPresetState(fm) {
  const preset = FM_RATIO_PRESETS[loadedFMRatioPresetIndex];
  const value = document.getElementById("fmRatioPresetValue");
  if (!value || !preset) return;
  value.textContent = preset.name;
  value.classList.toggle("preset-modified", !ratiosMatchPreset(fm, preset));
}

function initFMRatioPresetUI(fm) {
  const slider = document.getElementById("fmRatioPreset");
  const value = document.getElementById("fmRatioPresetValue");
  if (!slider || !value) return;

  slider.min = "0";
  slider.max = String(FM_RATIO_PRESETS.length - 1);
  slider.step = "1";

  loadedFMRatioPresetIndex = Math.max(
    0,
    Math.min(FM_RATIO_PRESETS.length - 1, Number(fm.ratioPreset) || 0)
  );
  slider.value = String(loadedFMRatioPresetIndex);

  const loadedPreset = FM_RATIO_PRESETS[loadedFMRatioPresetIndex];
  value.textContent = loadedPreset.name;
  value.classList.toggle("preset-modified", !ratiosMatchPreset(fm, loadedPreset));

  slider.addEventListener("input", () => {
    applyFMRatioPreset(fm, slider.value);
    if (window.UI?.updateRangeFill) window.UI.updateRangeFill(slider);
    slider.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

FMEngine.getRatioPresets = function () {
  return FM_RATIO_PRESETS.map(preset => ({ ...preset }));
};

function initFMWaveUI(fm) {
  document.querySelectorAll(".wave-row").forEach(group => {
    const modIndex = Number(group.dataset.mod) - 1;
    if (modIndex < 0 || modIndex > 1) return;

    group.addEventListener("click", event => {
      const button = event.target.closest("button[data-wave]");
      if (!button) return;
      fm.modulators[modIndex].wave = button.dataset.wave;
      group.querySelectorAll(".wave-btn").forEach(item => item.classList.toggle("active", item === button));
    });
  });
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, Number(value) || 0));
}

function normalizeWave(wave) {
  return wave === "saw" ? "sawtooth" : (wave || "sine");
}

function sliderToIndex(value, maximum) {
  const normalized = clamp(value, 0, 100) / 100;
  return maximum * normalized * normalized;
}

function waveCompensation(wave) {
  if (wave === "square") return 0.58;
  if (wave === "saw" || wave === "sawtooth") return 0.48;
  return 1;
}

function keyboardScale(baseFreq) {
  const midi = 69 + 12 * Math.log2(Math.max(1, baseFreq) / 440);
  const distanceAboveC4 = Math.max(0, midi - 60);
  const distanceBelowC4 = Math.max(0, 60 - midi);
  const highScale = Math.pow(2, -distanceAboveC4 / 60);
  const lowScale = Math.pow(2, -distanceBelowC4 / 120);
  return clamp(highScale * lowScale, 0.48, 1);
}

function scheduleShape(param, startTime, duration, baseDeviation, preset) {
  const safeDuration = Math.max(0.03, duration);
  const extraDeviation = baseDeviation * preset.amount;
  param.cancelScheduledValues(startTime);

  preset.points.forEach((point, index) => {
    const time = startTime + clamp(point[0], 0, 1) * safeDuration;
    const value = Math.max(0, baseDeviation + extraDeviation * point[1]);
    if (index === 0) param.setValueAtTime(value, time);
    else param.linearRampToValueAtTime(value, time);
  });
}

FMEngine.build = function (ctx, baseFreq, fmParams, noteLength) {
  const t0 = ctx.currentTime;
  const stopTime = t0 + Math.max(0.03, noteLength);
  const modulators = Array.isArray(fmParams.modulators) ? fmParams.modulators : [];
  const mod1Params = modulators[0] || { ratio: 1, gain: 0, wave: "sine" };
  const mod2Params = modulators[1] || { ratio: 2, gain: 0, wave: "sine" };
  const scale = keyboardScale(baseFreq);

  const carrier = ctx.createOscillator();
  carrier.type = "sine";
  carrier.frequency.setValueAtTime(baseFreq, t0);

  const mod1Ratio = clamp(mod1Params.ratio, 0.125, 16);
  const mod1Freq = baseFreq * mod1Ratio;
  const mod1Index = sliderToIndex(mod1Params.gain, MOD1_MAX_INDEX);
  const mod1Deviation = mod1Index * baseFreq * scale * waveCompensation(mod1Params.wave);

  let mod1 = null;
  let mod1Amount = null;
  let mod2 = null;
  let mod2Amount = null;
  let mod2Index = 0;
  let mod2Deviation = 0;

  if (mod1Deviation > 0) {
    mod1 = ctx.createOscillator();
    mod1.type = normalizeWave(mod1Params.wave);
    mod1.frequency.setValueAtTime(mod1Freq, t0);

    mod1Amount = ctx.createGain();
    const depthPreset = FM_DEPTH_PRESETS[
      clamp(fmParams.fmDepthPreset, 0, FM_DEPTH_PRESETS.length - 1)
    ] || FM_DEPTH_PRESETS[0];

    if (depthPreset.amount > 0) {
      scheduleShape(mod1Amount.gain, t0, noteLength, mod1Deviation, depthPreset);
    } else {
      mod1Amount.gain.setValueAtTime(mod1Deviation, t0);
    }

    mod1.connect(mod1Amount);
    mod1Amount.connect(carrier.frequency);

    mod2Index = sliderToIndex(mod2Params.gain, MOD2_MAX_INDEX);
    mod2Deviation = mod2Index * mod1Freq * scale * waveCompensation(mod2Params.wave);

    if (mod2Deviation > 0) {
      mod2 = ctx.createOscillator();
      const mod2Ratio = clamp(mod2Params.ratio, 0.125, 16);
      const mod2Freq = baseFreq * mod2Ratio;
      mod2.type = normalizeWave(mod2Params.wave);
      mod2.frequency.setValueAtTime(mod2Freq, t0);

      mod2Amount = ctx.createGain();
      mod2Amount.gain.setValueAtTime(0, t0);
      mod2Amount.gain.linearRampToValueAtTime(
        mod2Deviation,
        t0 + Math.min(0.015, noteLength * 0.05)
      );
      mod2Amount.gain.setValueAtTime(
        mod2Deviation,
        Math.max(t0 + 0.015, stopTime - 0.02)
      );
      mod2Amount.gain.linearRampToValueAtTime(0, stopTime);

      mod2.connect(mod2Amount);
      mod2Amount.connect(mod1.frequency);
    }
  }

  const carrierGain = ctx.createGain();
  carrierGain.gain.value = clamp(fmParams.carrierVolume, 0, 127) / 127;
  carrier.connect(carrierGain);

  const mixer = ctx.createGain();
  carrierGain.connect(mixer);

  const harmonicLayers = [fmParams.harmonic1, fmParams.harmonic2].filter(Boolean);
  const companions = [];

  harmonicLayers.forEach(layer => {
    const gain = clamp(layer.gain, 0, 100) / 100;
    if (gain <= 0) return;

    const oscillator = ctx.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(
      baseFreq * Math.pow(2, clamp(layer.noteOffset, -36, 36) / 12),
      t0
    );

    const layerGain = ctx.createGain();
    layerGain.gain.setValueAtTime(0, t0);

    oscillator.connect(layerGain);
    layerGain.connect(mixer);

    const offset = clamp(layer.noteOffset, -36, 36);
    companions.push({
      gain: layerGain.gain,
      baseGain: gain,
      classification: offset < 0 ? "lower" : offset > 0 ? "higher" : "equal",
    });

    oscillator.start(t0);
    oscillator.stop(stopTime);
  });

  mixer.gain.value = 1;

  if (mod2) {
    mod2.start(t0);
    mod2.stop(stopTime);
  }

  if (mod1) {
    mod1.start(t0);
    mod1.stop(stopTime);
  }

  carrier.start(t0);
  carrier.stop(stopTime);

  return {
    node: mixer,
    carrier,
    modulationTargets: {
      detune: carrier.detune,
      fmAmount: mod1Amount ? mod1Amount.gain : null,
      fmBaseDeviation: mod1Deviation,
      companions,
    },
    inspection: {
      mod1Active: Boolean(mod1),
      mod2Active: Boolean(mod2),
      keyboardScale: scale,
      mod1: {
        ratio: mod1Ratio,
        waveform: normalizeWave(mod1Params.wave),
        requestedAmount: clamp(mod1Params.gain, 0, 100),
        effectiveIndex: mod1Index,
        effectiveDeviationHz: mod1Deviation,
        waveformCompensation: waveCompensation(mod1Params.wave),
      },
      mod2: {
        ratio: clamp(mod2Params.ratio, 0.125, 16),
        waveform: normalizeWave(mod2Params.wave),
        requestedAmount: clamp(mod2Params.gain, 0, 100),
        effectiveIndex: mod2Index,
        effectiveDeviationHz: mod2Deviation,
        waveformCompensation: waveCompensation(mod2Params.wave),
      },
    },
  };
};

FMEngine.inspect = function (baseFreq, fmParams) {
  const modulators = Array.isArray(fmParams.modulators) ? fmParams.modulators : [];
  const mod1Params = modulators[0] || { ratio: 1, gain: 0, wave: "sine" };
  const mod2Params = modulators[1] || { ratio: 2, gain: 0, wave: "sine" };
  const scale = keyboardScale(baseFreq);
  const mod1Ratio = clamp(mod1Params.ratio, 0.125, 16);
  const mod1Freq = baseFreq * mod1Ratio;
  const mod1Index = sliderToIndex(mod1Params.gain, MOD1_MAX_INDEX);
  const mod2Index = sliderToIndex(mod2Params.gain, MOD2_MAX_INDEX);

  return {
    keyboardScale: scale,
    mod1: {
      active: mod1Index > 0,
      ratio: mod1Ratio,
      waveform: normalizeWave(mod1Params.wave),
      effectiveIndex: mod1Index,
      effectiveDeviationHz:
        mod1Index * baseFreq * scale * waveCompensation(mod1Params.wave),
      waveformCompensation: waveCompensation(mod1Params.wave),
    },
    mod2: {
      active: mod1Index > 0 && mod2Index > 0,
      ratio: clamp(mod2Params.ratio, 0.125, 16),
      waveform: normalizeWave(mod2Params.wave),
      effectiveIndex: mod2Index,
      effectiveDeviationHz:
        mod2Index * mod1Freq * scale * waveCompensation(mod2Params.wave),
      waveformCompensation: waveCompensation(mod2Params.wave),
    },
  };
};
