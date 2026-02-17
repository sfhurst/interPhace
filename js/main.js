// ============================================================
//  GLOBAL PATCH (SINGLE SOURCE OF TRUTH)
// ============================================================

window.patch = {
  engine: "fm", // active synth engine
  envEngine: "ahdhd", // active envelope engine

  midiNote: 60,
  sampleRate: 192000,
  renderDuration: 8.0,

  synth: {
    fm: {},
    subtractive: {},
    wavetable: {},
    sampler: {},
  },

  envelope: {
    ahdhd: {},
    adsr: {},
    fmDepth: {},
    filterEnv: {},
  },

  fx: {
    detune: {},
    chorus: {},
    reverb: {},
    delay: {},
  },
};

// ============================================================
//  UTILITIES
// ============================================================

window.midiToFreq = m => 440 * Math.pow(2, (m - 69) / 12);

window.midiToName = m => {
  const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  return names[m % 12] + (Math.floor(m / 12) - 1);
};

window.formatSeconds = v => Number(v).toFixed(3) + "s";

// ============================================================
//  UI HELPERS
// ============================================================

window.UI = {};

UI.bindSlider = (sliderId, valueId, formatFn) => {
  const slider = document.getElementById(sliderId);
  const value = document.getElementById(valueId);
  if (!slider || !value) return;

  const update = () => {
    const v = Number(slider.value);
    value.textContent = formatFn ? formatFn(v) : v;
  };

  slider.addEventListener("input", update);
  update();
};

UI.bindButtonGroup = (selector, callback) => {
  const buttons = document.querySelectorAll(selector);
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      callback(btn);
    });
  });
};

// ============================================================
//  UI → PATCH SYNC
// ============================================================

window.updateParamsFromHTML = () => {
  const rootNoteEl = document.getElementById("rootNote");
  const renderDurationEl = document.getElementById("renderDuration");
  if (rootNoteEl) patch.midiNote = Number(rootNoteEl.value);
  if (renderDurationEl) patch.renderDuration = Number(renderDurationEl.value);
};

// ============================================================
//  GLOBAL UI SECTIONS
// ============================================================

window.initAccordionUI = () => {
  document.querySelectorAll(".panel").forEach(panel => {
    const header = panel.querySelector(".panel-header");
    if (!header) return;
    header.addEventListener("click", () => panel.classList.toggle("open"));
    panel.classList.add("open");
  });
};

window.initEngineSelectorUI = () => {
  UI.bindButtonGroup(".engine-btn", btn => {
    patch.engine = btn.dataset.engine;
    document.querySelectorAll(".engine-panel").forEach(panel => {
      panel.classList.toggle("active", panel.id === "engine-" + patch.engine);
    });
  });
};

// ============================================================
//  CARRIER UI
// ============================================================

window.initCarrierUI = function () {
  const root = document.getElementById("rootNote");
  const valueSpan = document.getElementById("rootNoteValue");
  if (!root) return;

  const update = () => {
    patch.midiNote = Number(root.value);
    if (valueSpan) {
      valueSpan.textContent = `${midiToName(patch.midiNote)} (${patch.midiNote})`;
    }
  };

  root.addEventListener("input", update);
  update();
};

// ============================================================
//  TEMPO UI
// ============================================================

window.initTempoUI = function () {
  const tempo = document.getElementById("tempo");
  const valueSpan = document.getElementById("tempoValue");
  if (!tempo) return;

  const update = () => {
    patch.tempo = Number(tempo.value);
    if (valueSpan) {
      valueSpan.textContent = patch.tempo + " BPM";
    }
  };

  tempo.addEventListener("input", update);
  update();
};

// ============================================================
//  PRESET SYSTEM
// ============================================================

const PRESET_LIBRARY = [
  {
    name: "Init",
    description: "Clean slate - no modulation or effects",
    data: {
      // FM
      mod1Gain: 0,
      mod1Ratio: 1,
      mod1Wave: "sine",
      mod2Gain: 0,
      mod2Ratio: 2,
      mod2Wave: "sine",
      fmDepthPreset: 0,
      harmonic1Gain: 0,
      harmonic1Offset: 0,
      harmonic2Gain: 0,
      harmonic2Offset: 0,
      // Envelope
      envelope: "piano",
      // Effects
      stereoWidth: 0,
      detune: 0,
      chorus: 0,
      delay: 0,
      reverb: 0,
      wetDryMix: 80,
      compressor: true,
    }
  },
  {
    name: "Classic Bell",
    description: "DX7-style bell with √2 ratio",
    data: {
      mod1Gain: 65,
      mod1Ratio: 1.414,
      mod1Wave: "sine",
      mod2Gain: 0,
      mod2Ratio: 2,
      mod2Wave: "sine",
      fmDepthPreset: 8,
      harmonic1Gain: 0,
      harmonic1Offset: 0,
      harmonic2Gain: 0,
      harmonic2Offset: 0,
      envelope: "bell",
      stereoWidth: 3,
      detune: 2,
      chorus: 0,
      delay: 0,
      reverb: 6,
      wetDryMix: 75,
      compressor: true,
    }
  },
  {
    name: "Lofi Piano",
    description: "Warm piano with sub-bass",
    data: {
      mod1Gain: 35,
      mod1Ratio: 1,
      mod1Wave: "sine",
      mod2Gain: 15,
      mod2Ratio: 2,
      mod2Wave: "sine",
      fmDepthPreset: 3,
      harmonic1Gain: 40,
      harmonic1Offset: -12,
      harmonic2Gain: 0,
      harmonic2Offset: 0,
      envelope: "piano",
      stereoWidth: 2,
      detune: 3,
      chorus: 2,
      delay: 1,
      reverb: 3,
      wetDryMix: 70,
      compressor: true,
    }
  },
  {
    name: "Ambient Pad",
    description: "Lush pad with octave harmonics",
    data: {
      mod1Gain: 45,
      mod1Ratio: 1.5,
      mod1Wave: "sine",
      mod2Gain: 25,
      mod2Ratio: 2.5,
      mod2Wave: "sine",
      fmDepthPreset: 16,
      harmonic1Gain: 30,
      harmonic1Offset: 12,
      harmonic2Gain: 20,
      harmonic2Offset: 24,
      envelope: "pad",
      stereoWidth: 8,
      detune: 5,
      chorus: 8,
      delay: 6,
      reverb: 11,
      wetDryMix: 85,
      compressor: true,
    }
  },
  {
    name: "E.Piano Tine",
    description: "Rhodes-style electric piano",
    data: {
      mod1Gain: 55,
      mod1Ratio: 1,
      mod1Wave: "sine",
      mod2Gain: 20,
      mod2Ratio: 2,
      mod2Wave: "sine",
      fmDepthPreset: 4,
      harmonic1Gain: 0,
      harmonic1Offset: 0,
      harmonic2Gain: 0,
      harmonic2Offset: 0,
      envelope: "epiano",
      stereoWidth: 4,
      detune: 3,
      chorus: 4,
      delay: 2,
      reverb: 4,
      wetDryMix: 65,
      compressor: true,
    }
  },
  {
    name: "Power Chord",
    description: "Root + fifth + octave",
    data: {
      mod1Gain: 40,
      mod1Ratio: 2,
      mod1Wave: "square",
      mod2Gain: 0,
      mod2Ratio: 2,
      mod2Wave: "sine",
      fmDepthPreset: 5,
      harmonic1Gain: 70,
      harmonic1Offset: 7,
      harmonic2Gain: 50,
      harmonic2Offset: 12,
      envelope: "pluck",
      stereoWidth: 6,
      detune: 4,
      chorus: 0,
      delay: 3,
      reverb: 5,
      wetDryMix: 60,
      compressor: true,
    }
  },
  // Slots 6-10 for user to fill
  { name: "Empty 6", description: "User preset slot", data: null },
  { name: "Empty 7", description: "User preset slot", data: null },
  { name: "Empty 8", description: "User preset slot", data: null },
  { name: "Empty 9", description: "User preset slot", data: null },
  { name: "Empty 10", description: "User preset slot", data: null },
];

function applyPreset(presetIndex) {
  const preset = PRESET_LIBRARY[presetIndex];
  if (!preset || !preset.data) return;

  const data = preset.data;

  // Apply FM settings
  if (data.mod1Gain !== undefined) {
    patch.synth.fm.modulators[0].gain = data.mod1Gain;
    const slider = document.getElementById("mod1Gain");
    if (slider) slider.value = data.mod1Gain;
    document.getElementById("mod1GainValue").textContent = data.mod1Gain + "%";
  }

  if (data.mod1Ratio !== undefined) {
    patch.synth.fm.modulators[0].ratio = data.mod1Ratio;
    document.querySelectorAll('.ratio-row[data-mod="1"] .ratio-btn').forEach(btn => {
      btn.classList.toggle("active", Number(btn.dataset.ratio) === data.mod1Ratio);
    });
  }

  if (data.mod1Wave !== undefined) {
    patch.synth.fm.modulators[0].wave = data.mod1Wave;
    document.querySelectorAll('.wave-row[data-mod="1"] .ratio-btn').forEach(btn => {
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
    document.querySelectorAll('.ratio-row[data-mod="2"] .ratio-btn').forEach(btn => {
      btn.classList.toggle("active", Number(btn.dataset.ratio) === data.mod2Ratio);
    });
  }

  if (data.mod2Wave !== undefined) {
    patch.synth.fm.modulators[1].wave = data.mod2Wave;
    document.querySelectorAll('.wave-row[data-mod="2"] .ratio-btn').forEach(btn => {
      btn.classList.toggle("active", btn.dataset.wave === data.mod2Wave);
    });
  }

  if (data.fmDepthPreset !== undefined) {
    patch.synth.fm.fmDepthPreset = data.fmDepthPreset;
    const slider = document.getElementById("fmDepthPreset");
    if (slider) slider.value = data.fmDepthPreset;
  }

  // Apply harmonics
  if (data.harmonic1Gain !== undefined) {
    patch.synth.fm.harmonic1.gain = data.harmonic1Gain;
    const slider = document.getElementById("harmonic1Gain");
    if (slider) slider.value = data.harmonic1Gain;
    document.getElementById("harmonic1GainValue").textContent = data.harmonic1Gain + "%";
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
    document.getElementById("harmonic2GainValue").textContent = data.harmonic2Gain + "%";
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
    const envBtn = document.querySelector(`.preset-btn[data-env="${data.envelope}"]`);
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
    document.getElementById("wetDryMixValue").textContent = data.wetDryMix + "%";
  }

  if (data.compressor !== undefined) {
    patch.fx.compressor.enabled = data.compressor;
    document.querySelectorAll('#compressorRow .ratio-btn').forEach(btn => {
      const isOn = btn.dataset.compressor === "on";
      btn.classList.toggle("active", isOn === data.compressor);
    });
  }

  console.log(`✅ Loaded preset: ${preset.name}`);
}

window.initPresetUI = function () {
  UI.bindSlider("preset", "presetValue", v => {
    const presetIndex = Number(v);
    const preset = PRESET_LIBRARY[presetIndex];
    
    if (preset && preset.data) {
      applyPreset(presetIndex);
    }
    
    return preset ? preset.name : "Empty";
  });
};

// ============================================================
//  CARRIER VOLUME UI
// ============================================================

window.initCarrierVolumeUI = function () {
  UI.bindSlider("carrierVolume", "carrierVolumeValue", v => {
    patch.synth.fm.carrierVolume = Number(v);
    return Math.round(v);
  });
};

// ============================================================
//  HARMONICS UI
// ============================================================

window.initHarmonicsUI = function () {
  // Harmonic 1
  UI.bindSlider("harmonic1Gain", "harmonic1GainValue", v => {
    patch.synth.fm.harmonic1.gain = Number(v);
    return Math.round(v) + "%";
  });

  UI.bindSlider("harmonic1Offset", "harmonic1OffsetValue", v => {
    patch.synth.fm.harmonic1.noteOffset = Number(v);
    return (v > 0 ? "+" : "") + v + " ST";
  });

  // Harmonic 2
  UI.bindSlider("harmonic2Gain", "harmonic2GainValue", v => {
    patch.synth.fm.harmonic2.gain = Number(v);
    return Math.round(v) + "%";
  });

  UI.bindSlider("harmonic2Offset", "harmonic2OffsetValue", v => {
    patch.synth.fm.harmonic2.noteOffset = Number(v);
    return (v > 0 ? "+" : "") + v + " ST";
  });
};

// ============================================================
//  ENVELOPE UI (AHDHD) WITH PERSONALITY
// ============================================================

window.initEnvelopeUI = function () {
  const env = patch.envelope.ahdhd;

  const presets = document.querySelectorAll(".preset-btn");

  presets.forEach(btn => {
    btn.addEventListener("click", () => {
      presets.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      applyPreset(btn.dataset.env);
    });
  });

  // Bind envelope stage sliders
  bind("attack1");
  bind("hold1");
  bind("decay1");
  bind("hold2");
  bind("decay2");

  UI.bindSlider("decay1Target", "decay1TargetValue", v => {
    env.decay1Target = Number(v) / 100;
    return Math.round(v) + "%";
  });

  // Multiplier slider
  const envMultSlider = document.getElementById("envMult");
  const envMultValue = document.getElementById("envMultValue");

  if (envMultSlider && envMultValue) {
    envMultSlider.addEventListener("input", () => {
      env.envMult = Number(envMultSlider.value);
      envMultValue.textContent = env.envMult + "×";
      updateAllEnvelopeDisplays();
    });
    
    env.envMult = Number(envMultSlider.value);
    envMultValue.textContent = env.envMult + "×";
  }

  // NEW: Personality slider
  const personalitySlider = document.getElementById("envelopePersonality");
  const personalityValue = document.getElementById("envelopePersonalityValue");

  if (personalitySlider && personalityValue) {
    personalitySlider.addEventListener("input", () => {
      env.personality = Number(personalitySlider.value);
      
      // Get personality names from the engine if available
      const names = [
        "Clean", "Analog Soft", "Analog Warm", "Analog Tape", "Analog Wow",
        "Bell Shimmer", "Crystal Ring", "Glass Chime", "Wooden Clap", "Metal Hit",
        "Pad Breath", "Pad Swell", "Choir Drift", "Ambient Float", "Dream Wash",
        "Pluck Bounce", "Voice Growl", "Pitch Rise", "Chaos Drift", "Glitch Stutter"
      ];
      
      personalityValue.textContent = names[env.personality] || "Custom";
    });
    
    env.personality = Number(personalitySlider.value);
    personalityValue.textContent = "Clean";
  }

  applyPreset("piano");
  document.querySelector('.preset-btn[data-env="piano"]')?.classList.add("active");

  function bind(id) {
    const slider = document.getElementById(id);
    const valueSpan = document.getElementById(id + "Value");
    
    if (!slider || !valueSpan) return;
    
    slider.addEventListener("input", () => {
      env[id] = Number(slider.value);
      valueSpan.textContent = formatSeconds(env[id] * env.envMult);
    });
    
    env[id] = Number(slider.value);
    valueSpan.textContent = formatSeconds(env[id] * env.envMult);
  }

  function updateAllEnvelopeDisplays() {
    const stages = ["attack1", "hold1", "decay1", "hold2", "decay2"];
    
    stages.forEach(stage => {
      const valueSpan = document.getElementById(stage + "Value");
      if (valueSpan && env[stage] !== undefined) {
        valueSpan.textContent = formatSeconds(env[stage] * env.envMult);
      }
    });
  }

  function applyPreset(name) {
    const map = {
      // PERCUSSIVE
      blip: { 
        attack1: 0.002, hold1: 0, decay1: 0.08, decay1Target: 0, hold2: 0, decay2: 0,
        description: "Ultra-short percussive click"
      },
      tick: { 
        attack1: 0.001, hold1: 0.005, decay1: 0.05, decay1Target: 0.02, hold2: 0, decay2: 0.15,
        description: "Clock tick, rim shot"
      },
      pluck: { 
        attack1: 0.005, hold1: 0, decay1: 0.15, decay1Target: 0.05, hold2: 0.3, decay2: 0.4,
        description: "Guitar/bass pluck"
      },
      
      // PIANO & KEYS
      piano: { 
        attack1: 0.003, hold1: 0, decay1: 0.12, decay1Target: 0.35, hold2: 0.8, decay2: 1.8,
        description: "Acoustic piano"
      },
      epiano: { 
        attack1: 0.008, hold1: 0.02, decay1: 0.25, decay1Target: 0.4, hold2: 1.2, decay2: 2.0,
        description: "Electric piano tine"
      },
      bell: { 
        attack1: 0.002, hold1: 0.01, decay1: 0.3, decay1Target: 0.6, hold2: 1.5, decay2: 3.5,
        description: "Bell, chime, glockenspiel"
      },
      
      // PADS & STRINGS
      pad: { 
        attack1: 0.15, hold1: 0.1, decay1: 0.8, decay1Target: 0.75, hold2: 1.5, decay2: 2.5,
        description: "Soft synth pad"
      },
      string: { 
        attack1: 0.08, hold1: 0.05, decay1: 0.3, decay1Target: 0.85, hold2: 2.0, decay2: 2.0,
        description: "String section"
      },
      choir: { 
        attack1: 0.25, hold1: 0.15, decay1: 0.5, decay1Target: 0.8, hold2: 1.8, decay2: 2.8,
        description: "Vocal ensemble"
      },
      
      // BRASS & WINDS
      brass: { 
        attack1: 0.12, hold1: 0.08, decay1: 0.2, decay1Target: 0.9, hold2: 1.5, decay2: 1.2,
        description: "Brass section"
      },
      
      // ATMOSPHERIC
      drone: { 
        attack1: 1.2, hold1: 2.5, decay1: 1.5, decay1Target: 0.95, hold2: 4.0, decay2: 5.0,
        description: "Ambient drone"
      },
      wash: { 
        attack1: 2.0, hold1: 3.0, decay1: 2.5, decay1Target: 0.9, hold2: 5.0, decay2: 6.0,
        description: "Atmospheric wash"
      },
    };

    const preset = map[name];
    if (!preset) return;

    // Apply envelope timing
    const timingKeys = ['attack1', 'hold1', 'decay1', 'decay1Target', 'hold2', 'decay2'];
    timingKeys.forEach(key => {
      if (preset[key] !== undefined) {
        env[key] = preset[key];
      }
    });

    // Update UI displays
    for (const key in preset) {
      const input = document.getElementById(key);
      const span = document.getElementById(key + "Value");
      if (input && timingKeys.includes(key)) {
        input.value = preset[key];
      }
      if (span) {
        if (key === "decay1Target") {
          span.textContent = Math.round(preset[key] * 100) + "%";
        } else if (timingKeys.includes(key)) {
          span.textContent = formatSeconds(preset[key] * env.envMult);
        }
      }
    }
  }
};

// ============================================================
//  BOOT SEQUENCE
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  try {
    window.addEventListener(
      "click",
      () => {
        try {
          if (window.playbackContext && window.playbackContext.state === "suspended") {
            window.playbackContext.resume();
          }
        } catch (err) {
          console.error("Error resuming audio context:", err);
        }
      },
      { once: true },
    );

    if (typeof FMEngine !== 'undefined') FMEngine.register(patch);
    if (typeof AmpEnvelopeEngine !== 'undefined') AmpEnvelopeEngine.register(patch);
    if (typeof FilterEngine !== 'undefined') FilterEngine.register(patch);
    if (typeof EffectsEngine !== 'undefined') EffectsEngine.register(patch);

    initAccordionUI();
    initEngineSelectorUI();
    initCarrierUI();
    initTempoUI();
    initCarrierVolumeUI();
    initHarmonicsUI();
    initPresetUI();
    initEnvelopeUI();

    if (typeof FMEngine !== 'undefined') FMEngine.initUI(patch);
    if (typeof FilterEngine !== 'undefined') FilterEngine.initUI(patch);
    if (typeof EffectsEngine !== 'undefined') EffectsEngine.initUI(patch);
    if (typeof RenderEngine !== 'undefined') {
      RenderEngine.initRenderUI(patch);
      RenderEngine.initPlaybackUI(patch);
    }

    console.log("✅ interPhace initialized successfully");
  } catch (err) {
    console.error("❌ Error initializing interPhace:", err);
    alert("Failed to initialize audio. Please refresh the page.");
  }
});
