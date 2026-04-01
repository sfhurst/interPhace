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

window.midiToFreq = (m) => 440 * Math.pow(2, (m - 69) / 12);

window.midiToName = (m) => {
  const names = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ];
  return names[m % 12] + (Math.floor(m / 12) - 1);
};

window.formatSeconds = (v) => Number(v).toFixed(3) + "s";

// ============================================================
//  UI HELPERS
// ============================================================

window.UI = {};

UI.bindSlider = (sliderId, valueId, formatFn) => {
  const slider = document.getElementById(sliderId);
  const value = document.getElementById(valueId);
  if (!slider || !value) return;

  // Preserve starting (default) value for reset on dblclick.
  const initialValue =
    slider.getAttribute("data-default") ?? slider.defaultValue;
  slider.dataset.defaultValue = initialValue;

  const update = () => {
    const v = Number(slider.value);
    value.textContent = formatFn ? formatFn(v) : v;
  };

  slider.addEventListener("input", update);

  update();
};

UI.bindButtonGroup = (selector, callback) => {
  const buttons = document.querySelectorAll(selector);
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      callback(btn);
    });
  });
};

UI.enableSliderDoubleClickReset = () => {
  document.querySelectorAll('input[type="range"]').forEach((slider) => {
    const initialValue =
      slider.getAttribute("data-default") ?? slider.defaultValue;
    slider.dataset.defaultValue = initialValue;

    slider.addEventListener("dblclick", () => {
      const resetValue = slider.dataset.defaultValue ?? slider.defaultValue;
      slider.value = resetValue;
      slider.dispatchEvent(new Event("input", { bubbles: true }));
      slider.dispatchEvent(new Event("change", { bubbles: true }));
    });
  });
};

UI.captureInitialControlState = () => {
  UI.initialControlState = {
    sliders: {},
    buttonGroups: [],
  };

  document.querySelectorAll('input[type="range"]').forEach((slider) => {
    const defaultValue =
      slider.getAttribute("data-default") ?? slider.defaultValue;
    UI.initialControlState.sliders[slider.id] = defaultValue;
  });

  const buttonGroupSelectors = [
    ".engine-select",
    ".ratio-row",
    ".wave-row",
    ".preset-row",
  ];
  buttonGroupSelectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((group) => {
      const buttons = Array.from(group.querySelectorAll("button"));
      if (!buttons.length) return;
      const activeIndex = buttons.findIndex((btn) =>
        btn.classList.contains("active"),
      );
      UI.initialControlState.buttonGroups.push({
        group,
        activeIndex: activeIndex >= 0 ? activeIndex : 0,
      });
    });
  });
};

UI.resetAllControlsToDefault = () => {
  if (!UI.initialControlState) return;

  Object.entries(UI.initialControlState.sliders).forEach(
    ([id, defaultValue]) => {
      const slider = document.getElementById(id);
      if (!slider) return;
      slider.value = defaultValue;
      slider.dispatchEvent(new Event("input", { bubbles: true }));
      slider.dispatchEvent(new Event("change", { bubbles: true }));
    },
  );

  UI.initialControlState.buttonGroups.forEach(({ group, activeIndex }) => {
    const buttons = Array.from(group.querySelectorAll("button"));
    if (!buttons.length) return;
    buttons.forEach((btn, i) =>
      btn.classList.toggle("active", i === activeIndex),
    );
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
  document.querySelectorAll(".panel").forEach((panel) => {
    const header = panel.querySelector(".panel-header");
    if (!header) return;
    header.addEventListener("click", () => panel.classList.toggle("open"));
    panel.classList.add("open");
  });
};

window.initEngineSelectorUI = () => {
  UI.bindButtonGroup(".engine-btn", (btn) => {
    patch.engine = btn.dataset.engine;
    document.querySelectorAll(".engine-panel").forEach((panel) => {
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
  // ============================================================
  // CATEGORY: BASICS (0-4)
  // ============================================================
  {
    name: "Init",
    description: "Clean slate - no modulation or effects",
    data: {
      midiNote: 60,
      midiName: "C4",
      carrierVolume: 100,
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
      envelope: "piano",
      personality: 0, // Clean
      stereoWidth: 0,
      detune: 0,
      chorus: 0,
      delay: 0,
      reverb: 0,
      wetDryMix: 80,
      compressor: true,
    },
  },
  {
    name: "Pure Sine",
    description: "Minimalist sine wave - perfect foundation",
    data: {
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
      envelope: "pluck",
      personality: 0, // Clean
      stereoWidth: 0,
      detune: 0,
      chorus: 0,
      delay: 0,
      reverb: 2,
      wetDryMix: 50,
      compressor: true,
    },
  },
  {
    name: "Soft Touch",
    description: "Gentle FM with subtle character",
    data: {
      mod1Gain: 25,
      mod1Ratio: 1,
      mod1Wave: "sine",
      mod2Gain: 10,
      mod2Ratio: 2,
      mod2Wave: "sine",
      fmDepthPreset: 2,
      harmonic1Gain: 0,
      harmonic1Offset: 0,
      harmonic2Gain: 0,
      harmonic2Offset: 0,
      envelope: "piano",
      personality: 1, // Analog Drift
      stereoWidth: 2,
      detune: 1,
      chorus: 1,
      delay: 0,
      reverb: 3,
      wetDryMix: 65,
      compressor: true,
    },
  },
  {
    name: "Bright Start",
    description: "Clean and present - good for melody",
    data: {
      mod1Gain: 40,
      mod1Ratio: 2,
      mod1Wave: "sine",
      mod2Gain: 15,
      mod2Ratio: 3,
      mod2Wave: "sine",
      fmDepthPreset: 3,
      harmonic1Gain: 0,
      harmonic1Offset: 0,
      harmonic2Gain: 0,
      harmonic2Offset: 0,
      envelope: "pluck",
      personality: 0, // Clean
      stereoWidth: 3,
      detune: 2,
      chorus: 2,
      delay: 1,
      reverb: 4,
      wetDryMix: 70,
      compressor: true,
    },
  },
  {
    name: "Sub Foundation",
    description: "Pure tone with strong sub-bass",
    data: {
      mod1Gain: 20,
      mod1Ratio: 1,
      mod1Wave: "sine",
      mod2Gain: 0,
      mod2Ratio: 2,
      mod2Wave: "sine",
      fmDepthPreset: 1,
      harmonic1Gain: 60,
      harmonic1Offset: -12,
      harmonic2Gain: 35,
      harmonic2Offset: -24,
      envelope: "piano",
      personality: 0, // Clean
      stereoWidth: 1,
      detune: 0,
      chorus: 0,
      delay: 0,
      reverb: 2,
      wetDryMix: 55,
      compressor: true,
    },
  },

  // ============================================================
  // CATEGORY: BELLS & MALLETS (5-9)
  // ============================================================
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
      personality: 6, // Bell Shimmer
      stereoWidth: 3,
      detune: 2,
      chorus: 0,
      delay: 0,
      reverb: 6,
      wetDryMix: 75,
      compressor: true,
    },
  },
  {
    name: "Glass Chime",
    description: "Crystalline bell with shimmer",
    data: {
      mod1Gain: 70,
      mod1Ratio: 1.414,
      mod1Wave: "sine",
      mod2Gain: 30,
      mod2Ratio: 3.5,
      mod2Wave: "sine",
      fmDepthPreset: 9,
      harmonic1Gain: 25,
      harmonic1Offset: 12,
      harmonic2Gain: 15,
      harmonic2Offset: 24,
      envelope: "bell",
      personality: 6, // Bell Shimmer
      stereoWidth: 5,
      detune: 3,
      chorus: 3,
      delay: 0,
      reverb: 8,
      wetDryMix: 80,
      compressor: true,
    },
  },
  {
    name: "Temple Bell",
    description: "Deep resonant temple bell",
    data: {
      mod1Gain: 60,
      mod1Ratio: 0.75,
      mod1Wave: "sine",
      mod2Gain: 25,
      mod2Ratio: 1.5,
      mod2Wave: "sine",
      fmDepthPreset: 10,
      harmonic1Gain: 0,
      harmonic1Offset: 0,
      harmonic2Gain: 0,
      harmonic2Offset: 0,
      envelope: "bell",
      personality: 8, // Warble
      stereoWidth: 4,
      detune: 1,
      chorus: 0,
      delay: 0,
      reverb: 9,
      wetDryMix: 70,
      compressor: true,
    },
  },
  {
    name: "Music Box",
    description: "Delicate metallic pluck",
    data: {
      mod1Gain: 55,
      mod1Ratio: 4,
      mod1Wave: "sine",
      mod2Gain: 20,
      mod2Ratio: 7,
      mod2Wave: "sine",
      fmDepthPreset: 6,
      harmonic1Gain: 0,
      harmonic1Offset: 0,
      harmonic2Gain: 0,
      harmonic2Offset: 0,
      envelope: "tick",
      personality: 0, // Clean
      stereoWidth: 6,
      detune: 2,
      chorus: 2,
      delay: 2,
      reverb: 5,
      wetDryMix: 75,
      compressor: true,
    },
  },
  {
    name: "Glockenspiel",
    description: "Bright mallet percussion",
    data: {
      mod1Gain: 75,
      mod1Ratio: 3,
      mod1Wave: "sine",
      mod2Gain: 35,
      mod2Ratio: 5,
      mod2Wave: "sine",
      fmDepthPreset: 7,
      harmonic1Gain: 20,
      harmonic1Offset: 12,
      harmonic2Gain: 0,
      harmonic2Offset: 0,
      envelope: "pluck",
      personality: 6, // Bell Shimmer
      stereoWidth: 4,
      detune: 2,
      chorus: 0,
      delay: 1,
      reverb: 6,
      wetDryMix: 65,
      compressor: true,
    },
  },

  // ============================================================
  // CATEGORY: KEYS & PIANOS (10-14)
  // ============================================================
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
      personality: 1, // Analog Drift
      stereoWidth: 2,
      detune: 3,
      chorus: 2,
      delay: 1,
      reverb: 3,
      wetDryMix: 70,
      compressor: true,
    },
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
      personality: 3, // Tremolo
      stereoWidth: 4,
      detune: 3,
      chorus: 4,
      delay: 2,
      reverb: 4,
      wetDryMix: 65,
      compressor: true,
    },
  },
  {
    name: "Wurlitzer",
    description: "Bright electric piano with bite",
    data: {
      mod1Gain: 65,
      mod1Ratio: 1,
      mod1Wave: "sine",
      mod2Gain: 30,
      mod2Ratio: 2,
      mod2Wave: "sine",
      fmDepthPreset: 5,
      harmonic1Gain: 15,
      harmonic1Offset: 12,
      harmonic2Gain: 0,
      harmonic2Offset: 0,
      envelope: "epiano",
      personality: 4, // Vibrato
      stereoWidth: 5,
      detune: 4,
      chorus: 5,
      delay: 1,
      reverb: 3,
      wetDryMix: 60,
      compressor: true,
    },
  },
  {
    name: "Honky Tonk",
    description: "Detuned saloon piano",
    data: {
      mod1Gain: 40,
      mod1Ratio: 1,
      mod1Wave: "sine",
      mod2Gain: 20,
      mod2Ratio: 2,
      mod2Wave: "sine",
      fmDepthPreset: 3,
      harmonic1Gain: 35,
      harmonic1Offset: 0,
      harmonic2Gain: 30,
      harmonic2Offset: 0,
      envelope: "piano",
      personality: 2, // Tape Wow
      stereoWidth: 3,
      detune: 8,
      chorus: 0,
      delay: 0,
      reverb: 2,
      wetDryMix: 50,
      compressor: true,
    },
  },
  {
    name: "Vintage Keys",
    description: "Nostalgic FM keys with chorus",
    data: {
      mod1Gain: 50,
      mod1Ratio: 1,
      mod1Wave: "sine",
      mod2Gain: 25,
      mod2Ratio: 3,
      mod2Wave: "sine",
      fmDepthPreset: 4,
      harmonic1Gain: 20,
      harmonic1Offset: -12,
      harmonic2Gain: 0,
      harmonic2Offset: 0,
      envelope: "epiano",
      personality: 1, // Analog Drift
      stereoWidth: 6,
      detune: 5,
      chorus: 7,
      delay: 3,
      reverb: 5,
      wetDryMix: 75,
      compressor: true,
    },
  },

  // ============================================================
  // CATEGORY: PLUCKS & STRINGS (15-19)
  // ============================================================
  {
    name: "Bass Pluck",
    description: "Tight pluck for basslines",
    data: {
      mod1Gain: 45,
      mod1Ratio: 1,
      mod1Wave: "sine",
      mod2Gain: 20,
      mod2Ratio: 2,
      mod2Wave: "sine",
      fmDepthPreset: 2,
      harmonic1Gain: 50,
      harmonic1Offset: -12,
      harmonic2Gain: 0,
      harmonic2Offset: 0,
      envelope: "pluck",
      personality: 0, // Clean
      stereoWidth: 1,
      detune: 1,
      chorus: 0,
      delay: 0,
      reverb: 1,
      wetDryMix: 50,
      compressor: true,
    },
  },
  {
    name: "Harp Pluck",
    description: "Delicate plucked string",
    data: {
      mod1Gain: 35,
      mod1Ratio: 2,
      mod1Wave: "sine",
      mod2Gain: 15,
      mod2Ratio: 3,
      mod2Wave: "sine",
      fmDepthPreset: 3,
      harmonic1Gain: 25,
      harmonic1Offset: 12,
      harmonic2Gain: 0,
      harmonic2Offset: 0,
      envelope: "pluck",
      personality: 1, // Analog Drift
      stereoWidth: 4,
      detune: 2,
      chorus: 3,
      delay: 1,
      reverb: 6,
      wetDryMix: 70,
      compressor: true,
    },
  },
  {
    name: "Koto",
    description: "Japanese string instrument",
    data: {
      mod1Gain: 50,
      mod1Ratio: 1.5,
      mod1Wave: "sine",
      mod2Gain: 25,
      mod2Ratio: 3,
      mod2Wave: "sine",
      fmDepthPreset: 5,
      harmonic1Gain: 20,
      harmonic1Offset: 0,
      harmonic2Gain: 0,
      harmonic2Offset: 0,
      envelope: "pluck",
      personality: 2, // Tape Wow
      stereoWidth: 5,
      detune: 3,
      chorus: 2,
      delay: 2,
      reverb: 7,
      wetDryMix: 75,
      compressor: true,
    },
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
      personality: 5, // Growl
      stereoWidth: 6,
      detune: 4,
      chorus: 0,
      delay: 3,
      reverb: 5,
      wetDryMix: 60,
      compressor: true,
    },
  },
  {
    name: "Pizzicato",
    description: "Quick orchestral pluck",
    data: {
      mod1Gain: 30,
      mod1Ratio: 1,
      mod1Wave: "sine",
      mod2Gain: 15,
      mod2Ratio: 2,
      mod2Wave: "sine",
      fmDepthPreset: 1,
      harmonic1Gain: 0,
      harmonic1Offset: 0,
      harmonic2Gain: 0,
      harmonic2Offset: 0,
      envelope: "tick",
      personality: 0, // Clean
      stereoWidth: 3,
      detune: 1,
      chorus: 0,
      delay: 0,
      reverb: 4,
      wetDryMix: 60,
      compressor: true,
    },
  },

  // ============================================================
  // CATEGORY: PADS & ATMOSPHERES (20-24)
  // ============================================================
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
      personality: 7, // Choir Breathe
      stereoWidth: 8,
      detune: 5,
      chorus: 8,
      delay: 6,
      reverb: 11,
      wetDryMix: 85,
      compressor: true,
    },
  },
  {
    name: "Dream Pad",
    description: "Ethereal floating texture",
    data: {
      mod1Gain: 50,
      mod1Ratio: 1,
      mod1Wave: "sine",
      mod2Gain: 30,
      mod2Ratio: 3,
      mod2Wave: "sine",
      fmDepthPreset: 18,
      harmonic1Gain: 25,
      harmonic1Offset: 7,
      harmonic2Gain: 20,
      harmonic2Offset: 19,
      envelope: "pad",
      personality: 8, // Warble
      stereoWidth: 10,
      detune: 7,
      chorus: 10,
      delay: 8,
      reverb: 13,
      wetDryMix: 90,
      compressor: true,
    },
  },
  {
    name: "Warm Strings",
    description: "Orchestral string section",
    data: {
      mod1Gain: 40,
      mod1Ratio: 1,
      mod1Wave: "sine",
      mod2Gain: 20,
      mod2Ratio: 2,
      mod2Wave: "sine",
      fmDepthPreset: 15,
      harmonic1Gain: 15,
      harmonic1Offset: -12,
      harmonic2Gain: 0,
      harmonic2Offset: 0,
      envelope: "string",
      personality: 4, // Vibrato
      stereoWidth: 6,
      detune: 4,
      chorus: 6,
      delay: 0,
      reverb: 7,
      wetDryMix: 75,
      compressor: true,
    },
  },
  {
    name: "Choir Voices",
    description: "Vocal ensemble texture",
    data: {
      mod1Gain: 35,
      mod1Ratio: 1,
      mod1Wave: "sine",
      mod2Gain: 25,
      mod2Ratio: 1.5,
      mod2Wave: "sine",
      fmDepthPreset: 17,
      harmonic1Gain: 20,
      harmonic1Offset: 4,
      harmonic2Gain: 15,
      harmonic2Offset: 7,
      envelope: "choir",
      personality: 7, // Choir Breathe
      stereoWidth: 7,
      detune: 6,
      chorus: 9,
      delay: 4,
      reverb: 10,
      wetDryMix: 80,
      compressor: true,
    },
  },
  {
    name: "Glass Pad",
    description: "Crystalline ambient wash",
    data: {
      mod1Gain: 55,
      mod1Ratio: 1.414,
      mod1Wave: "sine",
      mod2Gain: 30,
      mod2Ratio: 3.5,
      mod2Wave: "sine",
      fmDepthPreset: 19,
      harmonic1Gain: 35,
      harmonic1Offset: 12,
      harmonic2Gain: 25,
      harmonic2Offset: 24,
      envelope: "pad",
      personality: 6, // Bell Shimmer
      stereoWidth: 9,
      detune: 8,
      chorus: 11,
      delay: 9,
      reverb: 12,
      wetDryMix: 88,
      compressor: true,
    },
  },

  // ============================================================
  // CATEGORY: BRASS & LEADS (25-29)
  // ============================================================
  {
    name: "Brass Section",
    description: "Bold brass ensemble",
    data: {
      mod1Gain: 60,
      mod1Ratio: 1,
      mod1Wave: "square",
      mod2Gain: 30,
      mod2Ratio: 2,
      mod2Wave: "sine",
      fmDepthPreset: 10,
      harmonic1Gain: 0,
      harmonic1Offset: 0,
      harmonic2Gain: 0,
      harmonic2Offset: 0,
      envelope: "brass",
      personality: 4, // Vibrato
      stereoWidth: 5,
      detune: 3,
      chorus: 4,
      delay: 0,
      reverb: 5,
      wetDryMix: 65,
      compressor: true,
    },
  },
  {
    name: "Synth Lead",
    description: "Cutting lead for melodies",
    data: {
      mod1Gain: 70,
      mod1Ratio: 2,
      mod1Wave: "square",
      mod2Gain: 35,
      mod2Ratio: 3,
      mod2Wave: "sine",
      fmDepthPreset: 8,
      harmonic1Gain: 0,
      harmonic1Offset: 0,
      harmonic2Gain: 0,
      harmonic2Offset: 0,
      envelope: "pluck",
      personality: 4, // Vibrato
      stereoWidth: 4,
      detune: 3,
      chorus: 3,
      delay: 2,
      reverb: 4,
      wetDryMix: 70,
      compressor: true,
    },
  },
  {
    name: "Flute",
    description: "Breathy woodwind",
    data: {
      mod1Gain: 25,
      mod1Ratio: 1,
      mod1Wave: "sine",
      mod2Gain: 10,
      mod2Ratio: 3,
      mod2Wave: "sine",
      fmDepthPreset: 11,
      harmonic1Gain: 0,
      harmonic1Offset: 0,
      harmonic2Gain: 0,
      harmonic2Offset: 0,
      envelope: "brass",
      personality: 1, // Analog Drift
      stereoWidth: 3,
      detune: 2,
      chorus: 2,
      delay: 0,
      reverb: 6,
      wetDryMix: 70,
      compressor: true,
    },
  },
  {
    name: "Oboe",
    description: "Nasal double-reed",
    data: {
      mod1Gain: 65,
      mod1Ratio: 1.5,
      mod1Wave: "sine",
      mod2Gain: 35,
      mod2Ratio: 2.5,
      mod2Wave: "sine",
      fmDepthPreset: 12,
      harmonic1Gain: 20,
      harmonic1Offset: 7,
      harmonic2Gain: 0,
      harmonic2Offset: 0,
      envelope: "brass",
      personality: 4, // Vibrato
      stereoWidth: 2,
      detune: 1,
      chorus: 1,
      delay: 0,
      reverb: 4,
      wetDryMix: 60,
      compressor: true,
    },
  },
  {
    name: "Detuned Lead",
    description: "Fat supersaw-style lead",
    data: {
      mod1Gain: 55,
      mod1Ratio: 1,
      mod1Wave: "saw",
      mod2Gain: 25,
      mod2Ratio: 2,
      mod2Wave: "square",
      fmDepthPreset: 6,
      harmonic1Gain: 40,
      harmonic1Offset: 0,
      harmonic2Gain: 35,
      harmonic2Offset: 12,
      envelope: "pluck",
      personality: 8, // Warble
      stereoWidth: 8,
      detune: 9,
      chorus: 0,
      delay: 2,
      reverb: 5,
      wetDryMix: 65,
      compressor: true,
    },
  },

  // ============================================================
  // CATEGORY: BASSES (30-34)
  // ============================================================
  {
    name: "Sub Bass",
    description: "Deep sub-bass foundation",
    data: {
      mod1Gain: 30,
      mod1Ratio: 0.5,
      mod1Wave: "sine",
      mod2Gain: 0,
      mod2Ratio: 1,
      mod2Wave: "sine",
      fmDepthPreset: 1,
      harmonic1Gain: 70,
      harmonic1Offset: -12,
      harmonic2Gain: 50,
      harmonic2Offset: -24,
      envelope: "drone",
      personality: 0, // Clean
      stereoWidth: 0,
      detune: 0,
      chorus: 0,
      delay: 0,
      reverb: 1,
      wetDryMix: 40,
      compressor: true,
    },
  },
  {
    name: "Reese Bass",
    description: "Gritty detuned bass",
    data: {
      mod1Gain: 60,
      mod1Ratio: 1,
      mod1Wave: "saw",
      mod2Gain: 30,
      mod2Ratio: 1,
      mod2Wave: "saw",
      fmDepthPreset: 4,
      harmonic1Gain: 45,
      harmonic1Offset: -12,
      harmonic2Gain: 0,
      harmonic2Offset: 0,
      envelope: "drone",
      personality: 8, // Warble
      stereoWidth: 5,
      detune: 10,
      chorus: 0,
      delay: 0,
      reverb: 2,
      wetDryMix: 50,
      compressor: true,
    },
  },
  {
    name: "FM Bass",
    description: "Punchy FM bass",
    data: {
      mod1Gain: 70,
      mod1Ratio: 1,
      mod1Wave: "sine",
      mod2Gain: 40,
      mod2Ratio: 2,
      mod2Wave: "square",
      fmDepthPreset: 6,
      harmonic1Gain: 35,
      harmonic1Offset: -12,
      harmonic2Gain: 0,
      harmonic2Offset: 0,
      envelope: "pluck",
      personality: 5, // Growl
      stereoWidth: 2,
      detune: 2,
      chorus: 0,
      delay: 0,
      reverb: 1,
      wetDryMix: 45,
      compressor: true,
    },
  },
  {
    name: "Wobble Bass",
    description: "Modulated bass with movement",
    data: {
      mod1Gain: 75,
      mod1Ratio: 1,
      mod1Wave: "square",
      mod2Gain: 45,
      mod2Ratio: 0.5,
      mod2Wave: "sine",
      fmDepthPreset: 7,
      harmonic1Gain: 50,
      harmonic1Offset: -12,
      harmonic2Gain: 0,
      harmonic2Offset: 0,
      envelope: "brass",
      personality: 3, // Tremolo
      stereoWidth: 4,
      detune: 6,
      chorus: 0,
      delay: 0,
      reverb: 2,
      wetDryMix: 55,
      compressor: true,
    },
  },
  {
    name: "808 Sub",
    description: "Classic 808-style sub kick",
    data: {
      mod1Gain: 80,
      mod1Ratio: 0.5,
      mod1Wave: "sine",
      mod2Gain: 40,
      mod2Ratio: 1,
      mod2Wave: "sine",
      fmDepthPreset: 2,
      harmonic1Gain: 0,
      harmonic1Offset: 0,
      harmonic2Gain: 0,
      harmonic2Offset: 0,
      envelope: "blip",
      personality: 0, // Clean
      stereoWidth: 0,
      detune: 0,
      chorus: 0,
      delay: 0,
      reverb: 0,
      wetDryMix: 30,
      compressor: true,
    },
  },

  // ============================================================
  // CATEGORY: EXPERIMENTAL (35-39)
  // ============================================================
  {
    name: "Metallic Drone",
    description: "Industrial metallic texture",
    data: {
      mod1Gain: 85,
      mod1Ratio: 7,
      mod1Wave: "square",
      mod2Gain: 50,
      mod2Ratio: 5,
      mod2Wave: "square",
      fmDepthPreset: 14,
      harmonic1Gain: 30,
      harmonic1Offset: 7,
      harmonic2Gain: 25,
      harmonic2Offset: -5,
      envelope: "drone",
      personality: 8, // Warble
      stereoWidth: 10,
      detune: 8,
      chorus: 0,
      delay: 7,
      reverb: 11,
      wetDryMix: 80,
      compressor: true,
    },
  },
  {
    name: "Digital Rain",
    description: "Cascading digital texture",
    data: {
      mod1Gain: 70,
      mod1Ratio: 3.5,
      mod1Wave: "sine",
      mod2Gain: 45,
      mod2Ratio: 7,
      mod2Wave: "sine",
      fmDepthPreset: 13,
      harmonic1Gain: 40,
      harmonic1Offset: 19,
      harmonic2Gain: 30,
      harmonic2Offset: 31,
      envelope: "tick",
      personality: 9, // Unstable
      stereoWidth: 12,
      detune: 11,
      chorus: 7,
      delay: 10,
      reverb: 14,
      wetDryMix: 92,
      compressor: true,
    },
  },
  {
    name: "Space Transmission",
    description: "Otherworldly communication",
    data: {
      mod1Gain: 65,
      mod1Ratio: 2.5,
      mod1Wave: "square",
      mod2Gain: 40,
      mod2Ratio: 3.5,
      mod2Wave: "saw",
      fmDepthPreset: 15,
      harmonic1Gain: 35,
      harmonic1Offset: -17,
      harmonic2Gain: 30,
      harmonic2Offset: 23,
      envelope: "wash",
      personality: 9, // Unstable
      stereoWidth: 13,
      detune: 12,
      chorus: 12,
      delay: 11,
      reverb: 15,
      wetDryMix: 95,
      compressor: true,
    },
  },
  {
    name: "Glitch Stutter",
    description: "Rhythmic broken texture",
    data: {
      mod1Gain: 80,
      mod1Ratio: 4,
      mod1Wave: "square",
      mod2Gain: 60,
      mod2Ratio: 7,
      mod2Wave: "square",
      fmDepthPreset: 19,
      harmonic1Gain: 50,
      harmonic1Offset: 5,
      harmonic2Gain: 45,
      harmonic2Offset: -7,
      envelope: "blip",
      personality: 9, // Unstable
      stereoWidth: 11,
      detune: 13,
      chorus: 0,
      delay: 12,
      reverb: 8,
      wetDryMix: 75,
      compressor: true,
    },
  },
  {
    name: "Cosmic Void",
    description: "Infinite space ambient",
    data: {
      mod1Gain: 50,
      mod1Ratio: 1.5,
      mod1Wave: "sine",
      mod2Gain: 35,
      mod2Ratio: 2.5,
      mod2Wave: "sine",
      fmDepthPreset: 20,
      harmonic1Gain: 40,
      harmonic1Offset: 12,
      harmonic2Gain: 35,
      harmonic2Offset: 24,
      envelope: "wash",
      personality: 7, // Choir Breathe
      stereoWidth: 15,
      detune: 10,
      chorus: 14,
      delay: 15,
      reverb: 15,
      wetDryMix: 98,
      compressor: true,
    },
  },
];

function applyPreset(presetIndex) {
  if (presetIndex === 0) {
    UI.resetAllControlsToDefault();
  }

  const preset = PRESET_LIBRARY[presetIndex];
  if (!preset || !preset.data) return;

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
    if (slider) slider.value = data.midiNote;
    document.getElementById("rootNoteValue").textContent =
      data.midiName + " (" + data.midiNote + ")";
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
    if (slider) slider.value = data.fmDepthPreset;
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
    patch.fx.compressor.enabled = data.compressor;
    document.querySelectorAll("#compressorRow .ratio-btn").forEach((btn) => {
      const isOn = btn.dataset.compressor === "on";
      btn.classList.toggle("active", isOn === data.compressor);
    });
  }

  // Apply envelope personality
  if (data.personality !== undefined) {
    patch.envelope.ahdhd.personality = data.personality;
    const slider = document.getElementById("envelopePersonality");
    if (slider) {
      slider.value = data.personality;
      slider.dispatchEvent(new Event("input"));
    }
  }

  console.log(`✅ Loaded preset: ${preset.name}`);
}

window.initPresetUI = function () {
  UI.bindSlider("preset", "presetValue", (v) => {
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
  UI.bindSlider("carrierVolume", "carrierVolumeValue", (v) => {
    patch.synth.fm.carrierVolume = Number(v);
    return Math.round(v);
  });
};

// ============================================================
//  HARMONICS UI
// ============================================================

// Chord preset lookup table
const CHORD_PRESET_TABLE = [
  { slider: 0, semitones: [0, 0], name: "Mono Stack" },
  { slider: 3, semitones: [7, 12], name: "Power Octave" },
  { slider: 6, semitones: [7, 19], name: "Wide Power" },
  { slider: 9, semitones: [-12, 7], name: "Sub Power" },
  { slider: 12, semitones: [4, 7], name: "Major" },
  { slider: 15, semitones: [3, 7], name: "Minor" },
  { slider: 18, semitones: [-12, 4], name: "Wide Major" },
  { slider: 21, semitones: [-12, 3], name: "Wide Minor" },
  { slider: 25, semitones: [2, 7], name: "Sus2" },
  { slider: 28, semitones: [5, 7], name: "Sus4" },
  { slider: 31, semitones: [-12, 5], name: "Wide Sus" },
  { slider: 34, semitones: [7, 14], name: "Fifth Stack" },
  { slider: 37, semitones: [2, 9], name: "Add2 Air" },
  { slider: 40, semitones: [3, 10], name: "Minor 7 Feel" },
  { slider: 43, semitones: [4, 11], name: "Major 7 Feel" },
  { slider: 46, semitones: [3, 14], name: "Minor 9 Color" },
  { slider: 49, semitones: [4, 14], name: "Major 9 Color" },
  { slider: 52, semitones: [7, 10], name: "Fifth + 7" },
  { slider: 56, semitones: [3, 6], name: "Diminished" },
  { slider: 59, semitones: [4, 8], name: "Augmented" },
  { slider: 62, semitones: [1, 7], name: "Minor 2 Tension" },
  { slider: 65, semitones: [6, 12], name: "Tritone Weight" },
  { slider: 68, semitones: [1, 12], name: "Dark Cluster" },
  { slider: 72, semitones: [-24, 3], name: "Deep Minor" },
  { slider: 75, semitones: [-24, 4], name: "Deep Major" },
  { slider: 78, semitones: [-12, 10], name: "Wide Minor 7" },
  { slider: 81, semitones: [-12, 11], name: "Wide Major 7" },
  { slider: 84, semitones: [-5, 7], name: "Inverted Suspense" },
  { slider: 88, semitones: [5, 12], name: "Open 4th" },
  { slider: 91, semitones: [7, 17], name: "5 + 9 Stack" },
  { slider: 94, semitones: [0, 7], name: "Root + Fifth" },
  { slider: 97, semitones: [0, 12], name: "Double Octave" },
  { slider: 100, semitones: [12, 19], name: "High Power Air" },
];

function findClosestChordPreset(sliderValue) {
  let closest = CHORD_PRESET_TABLE[0];
  let minDiff = Math.abs(sliderValue - closest.slider);

  for (const preset of CHORD_PRESET_TABLE) {
    const diff = Math.abs(sliderValue - preset.slider);
    if (diff < minDiff) {
      minDiff = diff;
      closest = preset;
    }
  }

  return closest;
}

window.initHarmonicsUI = function () {
  // Harmonic 1
  UI.bindSlider("harmonic1Gain", "harmonic1GainValue", (v) => {
    patch.synth.fm.harmonic1.gain = Number(v);
    return Math.round(v) + "%";
  });

  UI.bindSlider("harmonic1Offset", "harmonic1OffsetValue", (v) => {
    patch.synth.fm.harmonic1.noteOffset = Number(v);
    return (v > 0 ? "+" : "") + v + " ST";
  });

  // Harmonic 2
  UI.bindSlider("harmonic2Gain", "harmonic2GainValue", (v) => {
    patch.synth.fm.harmonic2.gain = Number(v);
    return Math.round(v) + "%";
  });

  UI.bindSlider("harmonic2Offset", "harmonic2OffsetValue", (v) => {
    patch.synth.fm.harmonic2.noteOffset = Number(v);
    return (v > 0 ? "+" : "") + v + " ST";
  });

  // Chord Preset Slider
  const chordSlider = document.getElementById("chordPreset");
  const chordValue = document.getElementById("chordPresetValue");
  const h1OffsetSlider = document.getElementById("harmonic1Offset");
  const h2OffsetSlider = document.getElementById("harmonic2Offset");

  if (chordSlider && chordValue && h1OffsetSlider && h2OffsetSlider) {
    chordSlider.addEventListener("input", () => {
      const sliderVal = Number(chordSlider.value);
      const preset = findClosestChordPreset(sliderVal);

      // Update chord name display
      chordValue.textContent = preset.name;

      // Set harmonic offsets
      patch.synth.fm.harmonic1.noteOffset = preset.semitones[0];
      patch.synth.fm.harmonic2.noteOffset = preset.semitones[1];

      // Update offset sliders and displays
      h1OffsetSlider.value = preset.semitones[0];
      h1OffsetSlider.dispatchEvent(new Event("input"));

      h2OffsetSlider.value = preset.semitones[1];
      h2OffsetSlider.dispatchEvent(new Event("input"));
    });
  }
};

// ============================================================
//  ENVELOPE UI (AHDHD) WITH PERSONALITY
// ============================================================

window.initEnvelopeUI = function () {
  const env = patch.envelope.ahdhd;

  const presets = document.querySelectorAll(".preset-btn");

  presets.forEach((btn) => {
    btn.addEventListener("click", () => {
      presets.forEach((b) => b.classList.remove("active"));
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

  UI.bindSlider("decay1Target", "decay1TargetValue", (v) => {
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

  // Personality slider
  const personalitySlider = document.getElementById("envelopePersonality");
  const personalityValue = document.getElementById("envelopePersonalityValue");

  if (personalitySlider && personalityValue) {
    personalitySlider.addEventListener("input", () => {
      env.personality = Number(personalitySlider.value);

      // Personality preset names
      const names = [
        "Clean",
        "Analog Drift",
        "Tape Wow",
        "Tremolo",
        "Vibrato",
        "Growl",
        "Bell Shimmer",
        "Choir Breathe",
        "Warble",
        "Unstable",
      ];

      personalityValue.textContent = names[env.personality] || "Custom";
    });

    env.personality = Number(personalitySlider.value);
    personalityValue.textContent = "Clean";
  }

  applyPreset("piano");
  document
    .querySelector('.preset-btn[data-env="piano"]')
    ?.classList.add("active");

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

    stages.forEach((stage) => {
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
        attack1: 0.002,
        hold1: 0,
        decay1: 0.08,
        decay1Target: 0,
        hold2: 0,
        decay2: 0,
        description: "Ultra-short percussive click",
      },
      tick: {
        attack1: 0.001,
        hold1: 0.005,
        decay1: 0.05,
        decay1Target: 0.02,
        hold2: 0,
        decay2: 0.15,
        description: "Clock tick, rim shot",
      },
      pluck: {
        attack1: 0.005,
        hold1: 0,
        decay1: 0.15,
        decay1Target: 0.05,
        hold2: 0.3,
        decay2: 0.4,
        description: "Guitar/bass pluck",
      },

      // PIANO & KEYS
      piano: {
        attack1: 0.003,
        hold1: 0,
        decay1: 0.12,
        decay1Target: 0.35,
        hold2: 0.8,
        decay2: 1.8,
        description: "Acoustic piano",
      },
      epiano: {
        attack1: 0.008,
        hold1: 0.02,
        decay1: 0.25,
        decay1Target: 0.4,
        hold2: 1.2,
        decay2: 2.0,
        description: "Electric piano tine",
      },
      bell: {
        attack1: 0.002,
        hold1: 0.01,
        decay1: 0.3,
        decay1Target: 0.6,
        hold2: 1.5,
        decay2: 3.5,
        description: "Bell, chime, glockenspiel",
      },

      // PADS & STRINGS
      pad: {
        attack1: 0.15,
        hold1: 0.1,
        decay1: 0.8,
        decay1Target: 0.75,
        hold2: 1.5,
        decay2: 2.5,
        description: "Soft synth pad",
      },
      string: {
        attack1: 0.08,
        hold1: 0.05,
        decay1: 0.3,
        decay1Target: 0.85,
        hold2: 2.0,
        decay2: 2.0,
        description: "String section",
      },
      choir: {
        attack1: 0.25,
        hold1: 0.15,
        decay1: 0.5,
        decay1Target: 0.8,
        hold2: 1.8,
        decay2: 2.8,
        description: "Vocal ensemble",
      },

      // BRASS & WINDS
      brass: {
        attack1: 0.12,
        hold1: 0.08,
        decay1: 0.2,
        decay1Target: 0.9,
        hold2: 1.5,
        decay2: 1.2,
        description: "Brass section",
      },

      // ATMOSPHERIC
      drone: {
        attack1: 1.2,
        hold1: 2.5,
        decay1: 1.5,
        decay1Target: 0.95,
        hold2: 4.0,
        decay2: 5.0,
        description: "Ambient drone",
      },
      wash: {
        attack1: 2.0,
        hold1: 3.0,
        decay1: 2.5,
        decay1Target: 0.9,
        hold2: 5.0,
        decay2: 6.0,
        description: "Atmospheric wash",
      },
    };

    const preset = map[name];
    if (!preset) return;

    // Apply envelope timing
    const timingKeys = [
      "attack1",
      "hold1",
      "decay1",
      "decay1Target",
      "hold2",
      "decay2",
    ];
    timingKeys.forEach((key) => {
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
          if (
            window.playbackContext &&
            window.playbackContext.state === "suspended"
          ) {
            window.playbackContext.resume();
          }
        } catch (err) {
          console.error("Error resuming audio context:", err);
        }
      },
      { once: true },
    );

    if (typeof FMEngine !== "undefined") FMEngine.register(patch);
    if (typeof AmpEnvelopeEngine !== "undefined")
      AmpEnvelopeEngine.register(patch);
    if (typeof FilterEngine !== "undefined") FilterEngine.register(patch);
    if (typeof EffectsEngine !== "undefined") EffectsEngine.register(patch);

    initAccordionUI();
    initEngineSelectorUI();
    initCarrierUI();
    initTempoUI();
    initCarrierVolumeUI();
    initHarmonicsUI();
    initPresetUI();
    initEnvelopeUI();

    if (typeof FMEngine !== "undefined") FMEngine.initUI(patch);
    if (typeof FilterEngine !== "undefined") FilterEngine.initUI(patch);
    if (typeof EffectsEngine !== "undefined") EffectsEngine.initUI(patch);
    if (typeof RenderEngine !== "undefined") {
      RenderEngine.initRenderUI(patch);
      RenderEngine.initPlaybackUI(patch);
    }

    UI.enableSliderDoubleClickReset();
    UI.captureInitialControlState();

    // Load saved session after all UI is initialized
    loadSession();

    // Auto-save session whenever any control changes
    setupAutoSave();

    console.log("✅ interPhace initialized successfully");
  } catch (err) {
    console.error("❌ Error initializing interPhace:", err);
    alert("Failed to initialize audio. Please refresh the page.");
  }
});

// ============================================================
//  SESSION PERSISTENCE (localStorage)
// ============================================================

function saveSession() {
  try {
    const session = {
      version: 1,
      timestamp: Date.now(),

      // Pitch
      midiNote: patch.midiNote,
      tempo: patch.tempo,
      carrierVolume: patch.synth.fm.carrierVolume,

      // Harmonics
      harmonic1Gain: patch.synth.fm.harmonic1.gain,
      harmonic1Offset: patch.synth.fm.harmonic1.noteOffset,
      harmonic2Gain: patch.synth.fm.harmonic2.gain,
      harmonic2Offset: patch.synth.fm.harmonic2.noteOffset,
      chordPreset: document.getElementById("chordPreset")?.value || 0,

      // FM
      mod1Gain: patch.synth.fm.modulators[0].gain,
      mod1Ratio: patch.synth.fm.modulators[0].ratio,
      mod1Wave: patch.synth.fm.modulators[0].wave,
      mod2Gain: patch.synth.fm.modulators[1].gain,
      mod2Ratio: patch.synth.fm.modulators[1].ratio,
      mod2Wave: patch.synth.fm.modulators[1].wave,
      fmDepthPreset: patch.synth.fm.fmDepthPreset,

      // Envelope
      attack1: patch.envelope.ahdhd.attack1,
      hold1: patch.envelope.ahdhd.hold1,
      decay1: patch.envelope.ahdhd.decay1,
      decay1Target: patch.envelope.ahdhd.decay1Target,
      hold2: patch.envelope.ahdhd.hold2,
      decay2: patch.envelope.ahdhd.decay2,
      envMult: patch.envelope.ahdhd.envMult,
      envelopePersonality: patch.envelope.ahdhd.personality,

      // Filter
      lpFreq: patch.filter.lpFreq,
      hpFreq: patch.filter.hpFreq,
      eq1Freq: patch.filter.eq1.freq,
      eq1Gain: patch.filter.eq1.gain,
      eq1Q: patch.filter.eq1.q,
      eq1Range: patch.filter.eq1.range || "low",
      eq2Freq: patch.filter.eq2.freq,
      eq2Gain: patch.filter.eq2.gain,
      eq2Q: patch.filter.eq2.q,
      eq2Range: patch.filter.eq2.range || "mid",
      eq3Freq: patch.filter.eq3.freq,
      eq3Gain: patch.filter.eq3.gain,
      eq3Q: patch.filter.eq3.q,
      eq3Range: patch.filter.eq3.range || "high",

      // Effects
      stereoWidthPreset: patch.fx.stereoWidth.preset,
      detunePreset: patch.fx.detune.preset,
      chorusPreset: patch.fx.chorus.preset,
      delayPreset: patch.fx.delay.preset,
      reverbPreset: patch.fx.reverb.preset,
      wetDryMix: patch.fx.wetDryMix,
      compressorEnabled: patch.fx.compressor.enabled,

      // Render
      sampleRate: patch.sampleRate,
      renderDuration: patch.renderDuration,
    };

    localStorage.setItem("interphace_session", JSON.stringify(session));
    console.log("💾 Session saved");
  } catch (err) {
    console.error("Failed to save session:", err);
  }
}

function loadSession() {
  try {
    const saved = localStorage.getItem("interphace_session");
    if (!saved) {
      console.log("No saved session found");
      return;
    }

    const session = JSON.parse(saved);
    console.log(
      "📂 Loading saved session from",
      new Date(session.timestamp).toLocaleString(),
    );

    // Restore all sliders and buttons

    // Pitch
    setSlider("rootNote", session.midiNote);
    setSlider("tempo", session.tempo);
    setSlider("carrierVolume", session.carrierVolume);

    // Harmonics
    setSlider("harmonic1Gain", session.harmonic1Gain);
    setSlider("harmonic1Offset", session.harmonic1Offset);
    setSlider("harmonic2Gain", session.harmonic2Gain);
    setSlider("harmonic2Offset", session.harmonic2Offset);
    setSlider("chordPreset", session.chordPreset);

    // FM
    setSlider("mod1Gain", session.mod1Gain);
    setSlider("mod2Gain", session.mod2Gain);
    setSlider("fmDepthPreset", session.fmDepthPreset);

    setRatioButton(1, session.mod1Ratio);
    setRatioButton(2, session.mod2Ratio);
    setWaveButton(1, session.mod1Wave);
    setWaveButton(2, session.mod2Wave);

    // Envelope
    setSlider("attack1", session.attack1);
    setSlider("hold1", session.hold1);
    setSlider("decay1", session.decay1);
    setSlider("decay1Target", session.decay1Target * 100); // Convert 0-1 to 0-100
    setSlider("hold2", session.hold2);
    setSlider("decay2", session.decay2);
    setSlider("envMult", session.envMult);
    setSlider("envelopePersonality", session.envelopePersonality);

    // Filter
    setSlider("lpFreq", session.lpFreq);
    setSlider("hpFreq", session.hpFreq);
    setSlider("eq1Freq", session.eq1Freq);
    setSlider("eq1Gain", session.eq1Gain);
    setSlider("eq1Q", session.eq1Q);
    setSlider("eq2Freq", session.eq2Freq);
    setSlider("eq2Gain", session.eq2Gain);
    setSlider("eq2Q", session.eq2Q);
    setSlider("eq3Freq", session.eq3Freq);
    setSlider("eq3Gain", session.eq3Gain);
    setSlider("eq3Q", session.eq3Q);

    // Effects
    setSlider("stereoWidthPreset", session.stereoWidthPreset);
    setSlider("detunePreset", session.detunePreset);
    setSlider("chorusPreset", session.chorusPreset);
    setSlider("delayPreset", session.delayPreset);
    setSlider("reverbPreset", session.reverbPreset);
    setSlider("wetDryMix", session.wetDryMix);

    // Compressor
    const compBtn = session.compressorEnabled
      ? document.querySelector('#compressorRow [data-compressor="on"]')
      : document.querySelector('#compressorRow [data-compressor="off"]');
    if (compBtn) compBtn.click();

    // Render
    setSlider("renderDuration", session.renderDuration);
    const srBtn = document.querySelector(`[data-sr="${session.sampleRate}"]`);
    if (srBtn) srBtn.click();

    console.log("✅ Session restored");
  } catch (err) {
    console.error("Failed to load session:", err);
  }
}

function setSlider(id, value) {
  const slider = document.getElementById(id);
  if (slider && value !== undefined) {
    slider.value = value;
    slider.dispatchEvent(new Event("input", { bubbles: true }));
  }
}

function setRatioButton(modIndex, ratio) {
  const row = document.querySelector(`.ratio-row[data-mod="${modIndex}"]`);
  if (!row) return;

  const btn = Array.from(row.querySelectorAll(".ratio-btn")).find(
    (b) => Number(b.dataset.ratio) === ratio,
  );
  if (btn) btn.click();
}

function setWaveButton(modIndex, wave) {
  const row = document.querySelector(`.wave-row[data-mod="${modIndex}"]`);
  if (!row) return;

  const btn = Array.from(row.querySelectorAll(".ratio-btn")).find(
    (b) => b.dataset.wave === wave,
  );
  if (btn) btn.click();
}

function setupAutoSave() {
  // Save on any slider change
  document.addEventListener("input", (e) => {
    if (e.target.type === "range") {
      saveSession();
    }
  });

  // Save on any button click
  document.addEventListener("click", (e) => {
    if (
      e.target.closest(".ratio-btn, .preset-btn, .engine-btn, .eq-band-btn")
    ) {
      setTimeout(saveSession, 100); // Small delay to ensure state is updated
    }
  });

  console.log("💾 Auto-save enabled");
}
