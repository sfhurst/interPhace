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
