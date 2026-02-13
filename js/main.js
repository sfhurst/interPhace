// UI → P (global state)

// P.engine → startEngine()
//           ↓
//       engineOutput (raw audio)
//           ↓
//     applyGlobalEnvelope()
//           ↓
//     runEffectsChain()
//           ↓
//       finalAudio
//           ↓
//       audition / render

// ============================================================
//  GLOBAL STATE (P)
// ============================================================
// This is the single source of truth for all synth parameters.
// UI writes into P. DSP engines read from P.
window.P = {
  midiNote: 60,

  // primary envelope
  attack1: 0,
  hold1: 0,
  decay1: 0,
  decay1Target: 0,
  hold2: 0,
  decay2: 0,
  envMult: 1.0,

  // FM engine defaults
  modulators: [
    { ratio: 0.5, gain: 0, wave: "sine" },
    { ratio: 0.5, gain: 0, wave: "sine" },
  ],

  sampleRate: 192000,
  renderDuration: 8.0,

  engine: "fm",
};

// ============================================================
//  UTILITIES
// ============================================================
// Pure helper functions — no UI, no DSP.

window.midiToFreq = m => 440 * Math.pow(2, (m - 69) / 12);

window.midiToName = m => {
  const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  return names[m % 12] + (Math.floor(m / 12) - 1);
};

window.formatSeconds = v => Number(v).toFixed(3) + "s";

window.writeString = (view, offset, str) => {
  for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
};

window.bufferToWav = buffer => {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const samples = buffer.getChannelData(0);
  const length = samples.length * numChannels * 2 + 44;

  const out = new ArrayBuffer(length);
  const view = new DataView(out);

  writeString(view, 0, "RIFF");
  view.setUint32(4, length - 8, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, samples.length * numChannels * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    for (let c = 0; c < numChannels; c++) {
      let s = buffer.getChannelData(c)[i];
      s = Math.max(-1, Math.min(1, s));
      view.setInt16(offset, s * 0x7fff, true);
      offset += 2;
    }
  }
  return out;
};

// ============================================================
//  GLOBAL UI HELPERS
// ============================================================
// These are generic UI utilities used everywhere.

window.UI = {};

UI.bindSlider = (sliderId, valueId, formatFn) => {
  // Connects a slider to a text label and updates it live.
  const slider = document.getElementById(sliderId);
  const value = document.getElementById(valueId);

  const update = () => {
    const v = Number(slider.value);
    value.textContent = formatFn ? formatFn(v) : v;
  };

  slider.addEventListener("input", update);
  update();
};

UI.bindButtonGroup = (selector, callback) => {
  // Makes a group of buttons behave like radio buttons.
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
//  UI → PARAM SYNC
// ============================================================
// Pulls values from HTML into P when needed.

window.updateParamsFromHTML = () => {
  P.midiNote = Number(document.getElementById("rootNote").value);

  P.attack1 = Number(document.getElementById("attack1").value);
  P.hold1 = Number(document.getElementById("hold1").value);
  P.decay1 = Number(document.getElementById("decay1").value);
  P.decay1Target = Number(document.getElementById("decay1Target").value) / 100;
  P.hold2 = Number(document.getElementById("hold2").value);
  P.decay2 = Number(document.getElementById("decay2").value);

  P.renderDuration = Number(document.getElementById("renderDuration").value);
};

// ============================================================
//  GLOBAL UI SECTIONS
// ============================================================

window.initAccordionUI = () => {
  // Makes each panel collapsible.
  // (original name: initAccordion)
  document.querySelectorAll(".panel").forEach(panel => {
    const header = panel.querySelector(".panel-header");
    header.addEventListener("click", () => panel.classList.toggle("open"));
    panel.classList.add("open");
  });
};

window.initEngineSelectorUI = () => {
  // Lets the user switch between FM engine, etc.
  // (original name: initEngineSelector)
  UI.bindButtonGroup(".engine-btn", btn => {
    P.engine = btn.dataset.engine;
    document.querySelectorAll(".engine-panel").forEach(panel => {
      panel.classList.toggle("active", panel.id === "engine-" + P.engine);
    });
  });
};

window.initEnvMultUI = () => {
  // Handles the envelope multiplier slider.
  // (original name: initEnvMult)
  const s = document.getElementById("envMult");
  s.addEventListener("input", () => {
    P.envMult = Number(s.value);
    updateEnvelopeDisplays();
  });
};

function updateEnvelopeDisplays() {
  // Updates the text labels for envelope times.
  const mult = P.envMult;
  const pairs = [
    ["attack1", "attack1Value"],
    ["hold1", "hold1Value"],
    ["decay1", "decay1Value"],
    ["hold2", "hold2Value"],
    ["decay2", "decay2Value"],
  ];
  pairs.forEach(([id, spanId]) => {
    const raw = P[id];
    document.getElementById(spanId).textContent = (raw * mult).toFixed(3);
  });
}

// ============================================================
//  CARRIER UI
// ============================================================

window.initCarrierUI = function () {
  // Updates the root note display when the slider moves.
  // (original name: initCarrierEngine)
  const root = document.getElementById("rootNote");
  const valueSpan = document.getElementById("rootNoteValue");

  const update = () => {
    P.midiNote = Number(root.value);
    if (valueSpan) {
      valueSpan.textContent = `${midiToName(P.midiNote)} (${P.midiNote})`;
    }
  };

  root.addEventListener("input", update);
  update();
};

// ============================================================
//  ENVELOPE UI
// ============================================================

window.initEnvelopeUI = function () {
  // Handles envelope sliders + preset buttons.
  // (original name: initCarrierEnvelopeEngine)

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
    P.decay1Target = Number(v) / 100;
    return Math.round(v) + "%";
  });

  UI.bindSlider("envMult", "envMultValue", v => {
    P.envMult = Number(v);
    return v + "×";
  });

  document.getElementById("envMult").addEventListener("input", () => {
    ["attack1", "hold1", "decay1", "hold2", "decay2"].forEach(id => {
      const span = document.getElementById(id + "Value");
      span.textContent = formatSeconds(P[id] * P.envMult);
    });
  });

  // load default
  applyPreset("piano");
  document.querySelector('.preset-btn[data-env="piano"]')?.classList.add("active");

  // -------------------------
  // helpers
  // -------------------------

  function bind(id) {
    UI.bindSlider(id, id + "Value", v => {
      P[id] = Number(v);
      return formatSeconds(P[id] * P.envMult);
    });
  }

  function applyPreset(name) {
    const map = {
      blip: { attack1: 0.005, hold1: 0, decay1: 0.15, decay1Target: 0, hold2: 0, decay2: 0 },
      piano: { attack1: 0.04, hold1: 0, decay1: 0.8, decay1Target: 0.1, hold2: 1.5, decay2: 0.9 },
      pad: { attack1: 0.2, hold1: 0.1, decay1: 1.5, decay1Target: 0.7, hold2: 0.5, decay2: 2 },
      drone: { attack1: 1, hold1: 2, decay1: 4, decay1Target: 1, hold2: 4, decay2: 4 },
    };

    const env = map[name];

    const sliderMax = {
      attack1: 2,
      hold1: 6,
      decay1: 2,
      hold2: 6,
      decay2: 2,
    };

    let requiredMult = 1;

    for (const key in env) {
      if (sliderMax[key] !== undefined) {
        const needed = env[key] / sliderMax[key];
        if (needed > requiredMult) requiredMult = needed;
      }
    }

    P.envMult = requiredMult;
    document.getElementById("envMult").value = requiredMult;
    document.getElementById("envMultValue").textContent = requiredMult + "×";

    for (const key in env) {
      const input = document.getElementById(key);
      const span = document.getElementById(key + "Value");

      if (input) {
        if (key === "decay1Target") {
          input.value = env[key] * 100;
          P.decay1Target = env[key];
        } else {
          const sliderVal = env[key] / P.envMult;
          input.value = sliderVal;
          P[key] = sliderVal;
        }
      }

      if (span) {
        if (key === "decay1Target") span.textContent = Math.round(env[key] * 100) + "%";
        else span.textContent = formatSeconds(env[key]);
      }
    }
  }
};

// ============================================================
//  FM UI
// ============================================================

window.initFMRatioUI = function () {
  // Handles FM ratio buttons for each modulator.
  // (original name: initRatioButtons)
  const groups = document.querySelectorAll(".ratio-row");

  groups.forEach(group => {
    const modIndex = Number(group.getAttribute("data-mod")) - 1;
    if (modIndex < 0) return;

    group.addEventListener("click", e => {
      const btn = e.target.closest("button");
      if (!btn) return;
      if (!btn.hasAttribute("data-ratio")) return;

      const ratio = Number(btn.getAttribute("data-ratio"));
      P.modulators[modIndex].ratio = ratio;

      group.querySelectorAll(".ratio-btn").forEach(b => b.classList.toggle("active", b === btn));
    });
  });
};

window.initFMWaveUI = function () {
  // Handles FM waveform buttons for each modulator.
  // (original name: initWaveButtons)
  const groups = document.querySelectorAll(".wave-row");

  groups.forEach(group => {
    const modIndex = Number(group.getAttribute("data-mod")) - 1;

    group.addEventListener("click", e => {
      const btn = e.target.closest("button");
      if (!btn) return;
      if (!btn.hasAttribute("data-wave")) return;

      const wave = btn.getAttribute("data-wave");
      P.modulators[modIndex].wave = wave;

      group.querySelectorAll(".ratio-btn").forEach(b => b.classList.toggle("active", b === btn));
    });
  });
};

// ============================================================
//  RENDER UI
// ============================================================

window.initSampleRateUI = function () {
  // Handles sample rate selection buttons.
  // (original name: initSampleRateButtons)
  const row = document.getElementById("sampleRateRow");
  const buttons = row.querySelectorAll(".ratio-btn");

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const sr = Number(btn.dataset.sr);
      P.sampleRate = sr;

      const span = document.getElementById("sampleRateValue");
      if (span) span.textContent = sr;
    });
  });
};

window.initRenderUI = function () {
  // Handles render duration slider + sample rate UI.
  // (original name: initRenderEngine)
  UI.bindSlider("renderDuration", "renderDurationValue", formatSeconds);
  initSampleRateUI();
};

// ============================================================
//  GLOBAL STOP SYSTEM (UNIVERSAL FOR ALL SYNTH ENGINES)
// ============================================================

let activePlayback = null;

window.stopPlayback = function () {
  if (!activePlayback) return;

  const { ctx, outGain } = activePlayback;

  const now = ctx.currentTime;
  outGain.gain.cancelScheduledValues(now);
  outGain.gain.setValueAtTime(outGain.gain.value, now);
  outGain.gain.linearRampToValueAtTime(0, now + 0.5);

  setTimeout(() => {
    ctx.close().catch(() => {});
    activePlayback = null;
  }, 600);
};

// ============================================================
//  BOOT SEQUENCE
// ============================================================
// Everything initializes here once the DOM is ready.

document.addEventListener("DOMContentLoaded", () => {
  initAccordionUI();
  initEngineSelectorUI();
  initEnvMultUI();

  initCarrierUI();
  initEnvelopeUI();

  initFMRatioUI();
  initFMWaveUI();

  initFMSynth();
  initRenderUI();

  // ⭐ Play button must be bound AFTER DOM is ready
  document.getElementById("play").addEventListener("click", () => {
    if (activePlayback) {
      stopPlayback();
    } else {
      activePlayback = startFMSynth();
    }
  });
});
