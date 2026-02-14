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
//  ENVELOPE UI (AHDHD)
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

  bind("attack1");
  bind("hold1");
  bind("decay1");
  bind("hold2");
  bind("decay2");

  UI.bindSlider("decay1Target", "decay1TargetValue", v => {
    env.decay1Target = Number(v) / 100;
    return Math.round(v) + "%";
  });

  UI.bindSlider("envMult", "envMultValue", v => {
    env.envMult = Number(v);
    return v + "×";
  });

  applyPreset("piano");
  document.querySelector('.preset-btn[data-env="piano"]')?.classList.add("active");

  function bind(id) {
    UI.bindSlider(id, id + "Value", v => {
      env[id] = Number(v);
      return formatSeconds(env[id] * env.envMult);
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
      if (span) span.textContent = formatSeconds(preset[key]);
    }
  }
};

// ============================================================
//  BOOT SEQUENCE
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  // ⭐ Warm‑up: resume AudioContext on first user click anywhere
  window.addEventListener(
    "click",
    () => {
      if (window.ctx && window.ctx.state === "suspended") {
        window.ctx.resume();
      }
    },
    { once: true },
  );

  // 1) Engines register defaults
  FMEngine.register(patch);
  AmpEnvelopeEngine.register(patch);
  EffectsEngine.register(patch);

  // 2) UI
  initAccordionUI();
  initEngineSelectorUI();
  initCarrierUI();
  initEnvelopeUI();

  FMEngine.initUI(patch);
  RenderEngine.initRenderUI(patch);
  RenderEngine.initPlaybackUI(patch);
});
