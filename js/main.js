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
      blip: { attack1: 0.005, hold1: 0, decay1: 0.15, decay1Target: 0, hold2: 0, decay2: 0 },
      piano: { attack1: 0.04, hold1: 0, decay1: 0.8, decay1Target: 0.1, hold2: 1.5, decay2: 0.9 },
      pad: { attack1: 0.2, hold1: 0.1, decay1: 1.5, decay1Target: 0.7, hold2: 0.5, decay2: 2 },
      drone: { attack1: 1, hold1: 2, decay1: 4, decay1Target: 1, hold2: 4, decay2: 4 },
    };

    const preset = map[name];
    if (!preset) return;

    Object.assign(env, preset);

    for (const key in preset) {
      const input = document.getElementById(key);
      const span = document.getElementById(key + "Value");
      if (input) input.value = preset[key];
      if (span) {
        if (key === "decay1Target") {
          span.textContent = Math.round(preset[key] * 100) + "%";
        } else {
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
    if (typeof EffectsEngine !== 'undefined') EffectsEngine.register(patch);

    initAccordionUI();
    initEngineSelectorUI();
    initCarrierUI();
    initEnvelopeUI();

    if (typeof FMEngine !== 'undefined') FMEngine.initUI(patch);
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
