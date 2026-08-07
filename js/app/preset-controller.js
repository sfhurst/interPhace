// ============================================================
//  PRESET SYSTEM
// ============================================================

const PRESET_LIBRARY = window.InterPhaceData.PRESET_LIBRARY;

let loadedPitchPresetSnapshot = null;
let applyingPitchPreset = false;

function capturePitchPresetState() {
  const sliders = {};
  document.querySelectorAll('input[type="range"]').forEach((slider) => {
    if (!slider.id || slider.id === "preset") return;
    sliders[slider.id] = String(slider.value);
  });

  const buttons = {};
  document.querySelectorAll(".ratio-btn, .preset-btn").forEach((button, index) => {
    const key = [
      button.id || "",
      button.dataset.ratio || "",
      button.dataset.wave || "",
      button.dataset.compressor || "",
      button.dataset.env || "",
      button.dataset.engine || "",
      index,
    ].join(":");
    buttons[key] = button.classList.contains("active");
  });

  return JSON.stringify({ sliders, buttons });
}

function updatePitchPresetCustomState() {
  if (applyingPitchPreset || !loadedPitchPresetSnapshot) return;
  const presetName = document.getElementById("presetValue");
  if (!presetName) return;
  const isCustom = capturePitchPresetState() !== loadedPitchPresetSnapshot;
  presetName.classList.toggle("preset-modified", isCustom);
}

function rememberLoadedPitchPresetState() {
  loadedPitchPresetSnapshot = capturePitchPresetState();
  const presetName = document.getElementById("presetValue");
  if (presetName) presetName.classList.remove("preset-modified");
}

function applyPreset(presetIndex) {
  applyingPitchPreset = true;
  const presetSlider = document.getElementById("preset");
  const presetName = document.getElementById("presetValue");
  const selectedPreset = PRESET_LIBRARY[presetIndex];
  if (presetSlider) {
    presetSlider.value = String(presetIndex);
    UI.updateRangeFill(presetSlider);
  }
  if (presetName && selectedPreset) {
    presetName.textContent = selectedPreset.name;
    presetName.classList.remove("preset-modified");
  }

  if (presetIndex === 0) {
    UI.resetAllControlsToDefault(["preset"]);
  }

  const preset = selectedPreset;
  if (!preset || !preset.data) {
    applyingPitchPreset = false;
    return;
  }

  const data = preset.data;

  // carrierVolume
  if (data.carrierVolume !== undefined) {
    patch.synth.fm.carrierVolume = data.carrierVolume;
    const slider = document.getElementById("carrierVolume");
    if (slider) slider.value = data.carrierVolume;
    document.getElementById("carrierVolumeValue").textContent =
      data.carrierVolume;
  }

  // rootNote
  if (data.midiNote !== undefined) {
    patch.midiNote = data.midiNote;
    const slider = document.getElementById("rootNote");
    if (slider) {
      slider.value = data.midiNote;
      slider.dispatchEvent(new Event("input"));
    }
  }

  // Apply FM settings
  if (data.mod1Gain !== undefined) {
    patch.synth.fm.modulators[0].gain = data.mod1Gain;
    const slider = document.getElementById("mod1Gain");
    if (slider) slider.value = data.mod1Gain;
    document.getElementById("mod1GainValue").textContent = data.mod1Gain + "%";
  }

  if (data.mod1Ratio !== undefined) {
    patch.synth.fm.modulators[0].ratio = data.mod1Ratio;
    document
      .querySelectorAll('.ratio-row[data-mod="1"] .ratio-btn')
      .forEach((btn) => {
        btn.classList.toggle(
          "active",
          Number(btn.dataset.ratio) === data.mod1Ratio,
        );
      });
  }

  if (data.mod1Wave !== undefined) {
    patch.synth.fm.modulators[0].wave = data.mod1Wave;
    document
      .querySelectorAll('.wave-row[data-mod="1"] .ratio-btn')
      .forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.wave === data.mod1Wave);
      });
  }

  if (data.mod2Gain !== undefined) {
    patch.synth.fm.modulators[1].gain = data.mod2Gain;
    const slider = document.getElementById("mod2Gain");
    if (slider) slider.value = data.mod2Gain;
    document.getElementById("mod2GainValue").textContent = data.mod2Gain + "%";
  }

  if (data.mod2Ratio !== undefined) {
    patch.synth.fm.modulators[1].ratio = data.mod2Ratio;
    document
      .querySelectorAll('.ratio-row[data-mod="2"] .ratio-btn')
      .forEach((btn) => {
        btn.classList.toggle(
          "active",
          Number(btn.dataset.ratio) === data.mod2Ratio,
        );
      });
  }

  if (data.mod2Wave !== undefined) {
    patch.synth.fm.modulators[1].wave = data.mod2Wave;
    document
      .querySelectorAll('.wave-row[data-mod="2"] .ratio-btn')
      .forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.wave === data.mod2Wave);
      });
  }

  if (data.fmDepthPreset !== undefined) {
    patch.synth.fm.fmDepthPreset = data.fmDepthPreset;
    const slider = document.getElementById("fmDepthPreset");
    if (slider) {
      slider.value = data.fmDepthPreset;
      slider.dispatchEvent(new Event("input"));
    }
  }

  // Apply harmonics
  if (data.harmonic1Gain !== undefined) {
    patch.synth.fm.harmonic1.gain = data.harmonic1Gain;
    const slider = document.getElementById("harmonic1Gain");
    if (slider) slider.value = data.harmonic1Gain;
    document.getElementById("harmonic1GainValue").textContent =
      data.harmonic1Gain + "%";
  }

  if (data.harmonic1Offset !== undefined) {
    patch.synth.fm.harmonic1.noteOffset = data.harmonic1Offset;
    const slider = document.getElementById("harmonic1Offset");
    if (slider) slider.value = data.harmonic1Offset;
    document.getElementById("harmonic1OffsetValue").textContent =
      (data.harmonic1Offset > 0 ? "+" : "") + data.harmonic1Offset + " ST";
  }

  if (data.harmonic2Gain !== undefined) {
    patch.synth.fm.harmonic2.gain = data.harmonic2Gain;
    const slider = document.getElementById("harmonic2Gain");
    if (slider) slider.value = data.harmonic2Gain;
    document.getElementById("harmonic2GainValue").textContent =
      data.harmonic2Gain + "%";
  }

  if (data.harmonic2Offset !== undefined) {
    patch.synth.fm.harmonic2.noteOffset = data.harmonic2Offset;
    const slider = document.getElementById("harmonic2Offset");
    if (slider) slider.value = data.harmonic2Offset;
    document.getElementById("harmonic2OffsetValue").textContent =
      (data.harmonic2Offset > 0 ? "+" : "") + data.harmonic2Offset + " ST";
  }

  // Apply envelope
  if (data.envelope) {
    const envBtn = document.querySelector(
      `.preset-btn[data-env="${data.envelope}"]`,
    );
    if (envBtn) envBtn.click();
  }

  // Apply effects
  if (data.stereoWidth !== undefined) {
    patch.fx.stereoWidth.preset = data.stereoWidth;
    const slider = document.getElementById("stereoWidthPreset");
    if (slider) slider.value = data.stereoWidth;
  }

  if (data.detune !== undefined) {
    patch.fx.detune.preset = data.detune;
    const slider = document.getElementById("detunePreset");
    if (slider) slider.value = data.detune;
  }

  if (data.chorus !== undefined) {
    patch.fx.chorus.preset = data.chorus;
    const slider = document.getElementById("chorusPreset");
    if (slider) slider.value = data.chorus;
  }

  if (data.delay !== undefined) {
    patch.fx.delay.preset = data.delay;
    const slider = document.getElementById("delayPreset");
    if (slider) slider.value = data.delay;
  }

  if (data.reverb !== undefined) {
    patch.fx.reverb.preset = data.reverb;
    const slider = document.getElementById("reverbPreset");
    if (slider) slider.value = data.reverb;
  }

  if (data.wetDryMix !== undefined) {
    patch.fx.wetDryMix = data.wetDryMix;
    const slider = document.getElementById("wetDryMix");
    if (slider) slider.value = data.wetDryMix;
    document.getElementById("wetDryMixValue").textContent =
      data.wetDryMix + "%";
  }

  if (data.compressor !== undefined) {
    if (patch.fx.compressor) patch.fx.compressor.enabled = data.compressor;
    document.querySelectorAll("#compressorRow .ratio-btn").forEach((btn) => {
      const isOn = btn.dataset.compressor === "on";
      btn.classList.toggle("active", isOn === data.compressor);
    });
  }

  // Apply Phase 3 personality layers independently.
  if (data.instrumentBehavior !== undefined) {
    patch.envelope.ahdhd.instrumentBehavior = data.instrumentBehavior;
    const slider = document.getElementById("instrumentBehavior");
    if (slider) {
      slider.value = data.instrumentBehavior;
      slider.dispatchEvent(new Event("input"));
    }
  }

  if (data.character !== undefined || data.personality !== undefined) {
    const value = data.character !== undefined ? data.character : data.personality;
    patch.envelope.ahdhd.character = value;
    const slider = document.getElementById("envelopeCharacter");
    if (slider) {
      slider.value = value;
      slider.dispatchEvent(new Event("input"));
    }
  }

  UI.refreshRangeFills();
  window.refreshChordPresetModifiedState?.();
  console.log(`✅ Loaded preset: ${preset.name}`);
  applyingPitchPreset = false;
  rememberLoadedPitchPresetState();
}

window.initPresetUI = function () {
  const presetSlider = document.getElementById("preset");
  if (presetSlider) {
    presetSlider.min = "0";
    presetSlider.max = String(Math.max(0, PRESET_LIBRARY.length - 1));
    presetSlider.step = "1";
  }

  UI.bindSlider("preset", "presetValue", (v) => {
    const presetIndex = Number(v);
    const preset = PRESET_LIBRARY[presetIndex];

    if (preset && preset.data) {
      applyPreset(presetIndex);
    }

    return preset ? preset.name : "Empty";
  });

  const queuePitchPresetCheck = (event) => {
    if (event.target?.id === "preset" || applyingPitchPreset) return;
    requestAnimationFrame(updatePitchPresetCustomState);
  };
  document.addEventListener("input", queuePitchPresetCheck);
  document.addEventListener("change", queuePitchPresetCheck);
  document.addEventListener("click", queuePitchPresetCheck);
};

