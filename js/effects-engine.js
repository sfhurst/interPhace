// ============================================================
//  EFFECTS ENGINE (CURATED PRESETS WITH TEMPO SYNC)
// ============================================================

window.EffectsEngine = {};

// Cache for reverb impulses
let cachedReverbImpulses = {};

// ------------------------------------------------------------
//  DELAY PRESET TABLE (tempo-synced)
// ------------------------------------------------------------

const DELAY_PRESETS = [
  { name: "Off", time: 0, feedback: 0, wetMix: 0, pingPong: false, lpFreq: 20000 },
  
  // Subtle (1-5) - SOFTER ATTACKS
  { name: "Slap 1/16", time: "1/16", feedback: 0.08, wetMix: 0.12, pingPong: false, lpFreq: 8000 },
  { name: "Slap 1/8", time: "1/8", feedback: 0.12, wetMix: 0.15, pingPong: false, lpFreq: 7000 },
  { name: "Doubler", time: "1/32", feedback: 0.03, wetMix: 0.20, pingPong: true, lpFreq: 10000 },
  { name: "Room 1/16", time: "1/16", feedback: 0.20, wetMix: 0.18, pingPong: true, lpFreq: 6000 },
  { name: "Room 1/8", time: "1/8", feedback: 0.25, wetMix: 0.22, pingPong: true, lpFreq: 5500 },
  
  // Medium (6-10) - WARM & MUSICAL
  { name: "Echo 1/4", time: "1/4", feedback: 0.30, wetMix: 0.28, pingPong: false, lpFreq: 5000 },
  { name: "Echo 1/4 PP", time: "1/4", feedback: 0.35, wetMix: 0.32, pingPong: true, lpFreq: 4500 },
  { name: "Echo 1/8D", time: "1/8d", feedback: 0.40, wetMix: 0.30, pingPong: false, lpFreq: 5000 },
  { name: "Triplet", time: "1/4t", feedback: 0.35, wetMix: 0.35, pingPong: true, lpFreq: 4000 },
  { name: "Half Note", time: "1/2", feedback: 0.45, wetMix: 0.38, pingPong: false, lpFreq: 4500 },
  
  // Long (11-15) - LUSH & ATMOSPHERIC
  { name: "Ambient 1/2", time: "1/2", feedback: 0.55, wetMix: 0.45, pingPong: true, lpFreq: 3500 },
  { name: "Space 1/1", time: "1/1", feedback: 0.60, wetMix: 0.50, pingPong: true, lpFreq: 3000 },
  { name: "Dream 1/1D", time: "1/1d", feedback: 0.65, wetMix: 0.55, pingPong: true, lpFreq: 2500 },
  { name: "Infinite 1/2", time: "1/2", feedback: 0.72, wetMix: 0.60, pingPong: true, lpFreq: 2000 },
  { name: "Wash 1/1", time: "1/1", feedback: 0.78, wetMix: 0.65, pingPong: true, lpFreq: 1800 },
];

// ------------------------------------------------------------
//  DETUNE PRESET TABLE
// ------------------------------------------------------------

const DETUNE_PRESETS = [
  { name: "Off", amount: 0, lfoRate: 0, lfoDepth: 0 },
  
  // Subtle width (1-5)
  { name: "Micro", amount: 5, lfoRate: 0.2, lfoDepth: 0.002 },
  { name: "Tight", amount: 10, lfoRate: 0.25, lfoDepth: 0.003 },
  { name: "Natural", amount: 15, lfoRate: 0.3, lfoDepth: 0.004 },
  { name: "Wide", amount: 20, lfoRate: 0.35, lfoDepth: 0.005 },
  { name: "Airy", amount: 25, lfoRate: 0.4, lfoDepth: 0.006 },
  
  // Medium (6-10)
  { name: "Shimmer", amount: 30, lfoRate: 0.5, lfoDepth: 0.007 },
  { name: "Float", amount: 35, lfoRate: 0.6, lfoDepth: 0.008 },
  { name: "Drift", amount: 40, lfoRate: 0.45, lfoDepth: 0.009 },
  { name: "Wobble", amount: 45, lfoRate: 0.7, lfoDepth: 0.01 },
  { name: "Sway", amount: 50, lfoRate: 0.55, lfoDepth: 0.011 },
  
  // Extreme (11-15)
  { name: "Warble", amount: 60, lfoRate: 0.8, lfoDepth: 0.013 },
  { name: "Chorus-ish", amount: 70, lfoRate: 0.9, lfoDepth: 0.015 },
  { name: "Underwater", amount: 80, lfoRate: 0.65, lfoDepth: 0.018 },
  { name: "Drunk", amount: 90, lfoRate: 1.0, lfoDepth: 0.02 },
  { name: "Chaos", amount: 100, lfoRate: 1.2, lfoDepth: 0.025 },
];

// ------------------------------------------------------------
//  CHORUS PRESET TABLE
// ------------------------------------------------------------

const CHORUS_PRESETS = [
  { name: "Off", voices: 0, depth: 0, rate: 0, wetMix: 0 },
  
  // Subtle (1-5) - MORE WET
  { name: "Gentle", voices: 2, depth: 0.004, rate: 0.25, wetMix: 0.35 },
  { name: "Soft", voices: 2, depth: 0.005, rate: 0.3, wetMix: 0.40 },
  { name: "Natural", voices: 3, depth: 0.005, rate: 0.35, wetMix: 0.45 },
  { name: "Warm", voices: 3, depth: 0.006, rate: 0.3, wetMix: 0.50 },
  { name: "Rich", voices: 4, depth: 0.006, rate: 0.35, wetMix: 0.55 },
  
  // Medium (6-10) - LUSH
  { name: "Lush", voices: 4, depth: 0.007, rate: 0.3, wetMix: 0.60 },
  { name: "Wide", voices: 5, depth: 0.007, rate: 0.4, wetMix: 0.65 },
  { name: "Shimmer", voices: 5, depth: 0.008, rate: 0.45, wetMix: 0.70 },
  { name: "Sparkle", voices: 6, depth: 0.008, rate: 0.5, wetMix: 0.72 },
  { name: "Dream", voices: 6, depth: 0.009, rate: 0.35, wetMix: 0.75 },
  
  // Extreme (11-15) - MASSIVE
  { name: "Thick", voices: 7, depth: 0.01, rate: 0.4, wetMix: 0.78 },
  { name: "Ensemble", voices: 8, depth: 0.011, rate: 0.45, wetMix: 0.80 },
  { name: "Wash", voices: 8, depth: 0.012, rate: 0.5, wetMix: 0.83 },
  { name: "Ocean", voices: 9, depth: 0.013, rate: 0.35, wetMix: 0.85 },
  { name: "Infinite", voices: 10, depth: 0.015, rate: 0.6, wetMix: 0.88 },
];

// ------------------------------------------------------------
//  REVERB PRESET TABLE
// ------------------------------------------------------------

const REVERB_PRESETS = [
  { name: "Off", size: 0, decay: 0, wetMix: 0, predelay: 0, damping: 0.5 },
  
  // Rooms (1-5) - MORE WET
  { name: "Tiny Room", size: 0.8, decay: 1.0, wetMix: 0.25, predelay: 0.005, damping: 0.6 },
  { name: "Small Room", size: 1.2, decay: 1.5, wetMix: 0.32, predelay: 0.01, damping: 0.55 },
  { name: "Bedroom", size: 1.5, decay: 2.0, wetMix: 0.40, predelay: 0.015, damping: 0.5 },
  { name: "Living Room", size: 2.0, decay: 2.5, wetMix: 0.48, predelay: 0.02, damping: 0.45 },
  { name: "Studio", size: 2.5, decay: 3.0, wetMix: 0.55, predelay: 0.025, damping: 0.4 },
  
  // Halls (6-10) - LUSH
  { name: "Small Hall", size: 3.0, decay: 3.5, wetMix: 0.60, predelay: 0.03, damping: 0.35 },
  { name: "Concert Hall", size: 3.5, decay: 4.0, wetMix: 0.65, predelay: 0.04, damping: 0.3 },
  { name: "Cathedral", size: 4.0, decay: 5.0, wetMix: 0.70, predelay: 0.05, damping: 0.25 },
  { name: "Church", size: 4.5, decay: 6.0, wetMix: 0.75, predelay: 0.06, damping: 0.2 },
  { name: "Arena", size: 5.0, decay: 7.0, wetMix: 0.78, predelay: 0.07, damping: 0.15 },
  
  // Ambient (11-15) - MASSIVE
  { name: "Ambient", size: 5.5, decay: 8.0, wetMix: 0.80, predelay: 0.08, damping: 0.1 },
  { name: "Dream Space", size: 6.0, decay: 9.0, wetMix: 0.83, predelay: 0.1, damping: 0.05 },
  { name: "Infinite", size: 6.5, decay: 10.0, wetMix: 0.85, predelay: 0.12, damping: 0.02 },
  { name: "Cosmic", size: 7.0, decay: 12.0, wetMix: 0.88, predelay: 0.15, damping: 0.01 },
  { name: "Void", size: 8.0, decay: 15.0, wetMix: 0.90, predelay: 0.2, damping: 0 },
];

// ------------------------------------------------------------
//  STEREO WIDTH PRESET TABLE
// ------------------------------------------------------------

const STEREO_WIDTH_PRESETS = [
  { name: "Mono", amount: 0 },
  { name: "Tight", amount: 0.1 },
  { name: "Natural", amount: 0.2 },
  { name: "Wide", amount: 0.3 },
  { name: "Spacious", amount: 0.4 },
  { name: "Airy", amount: 0.5 },
  { name: "Shimmer", amount: 0.6 },
  { name: "Chorus-y", amount: 0.7 },
  { name: "Lush", amount: 0.8 },
  { name: "Huge", amount: 0.9 },
  { name: "Massive", amount: 1.0 },
  { name: "Ultra Wide", amount: 1.2 },
  { name: "Psychedelic", amount: 1.4 },
  { name: "Hyper", amount: 1.6 },
  { name: "Surround", amount: 1.8 },
  { name: "Insane", amount: 2.0 },
];

// ------------------------------------------------------------
//  REGISTER DEFAULTS
// ------------------------------------------------------------

EffectsEngine.register = function (patch) {
  patch.fx.stereoWidth = { preset: 0 };
  patch.fx.delay = { preset: 0 };
  patch.fx.detune = { preset: 0 };
  patch.fx.chorus = { preset: 0 };
  patch.fx.reverb = { preset: 0 };
  
  patch.tempo = 70; // BPM
};

// ------------------------------------------------------------
//  UI BINDINGS
// ------------------------------------------------------------

EffectsEngine.initUI = function (patch) {
  UI.bindSlider("stereoWidthPreset", "stereoWidthPresetValue", v => {
    patch.fx.stereoWidth.preset = Number(v);
    const names = [
      "Mono", "Tight", "Natural", "Wide", "Spacious", "Airy",
      "Shimmer", "Chorus-y", "Lush", "Huge", "Massive",
      "Ultra Wide", "Psychedelic", "Hyper", "Surround", "Insane"
    ];
    return names[v] || "Custom";
  });

  UI.bindSlider("detunePreset", "detunePresetValue", v => {
    patch.fx.detune.preset = Number(v);
    const names = [
      "Off", "Micro", "Tight", "Natural", "Wide", "Airy",
      "Shimmer", "Float", "Drift", "Wobble", "Sway",
      "Warble", "Chorus-ish", "Underwater", "Drunk", "Chaos"
    ];
    return names[v] || "Custom";
  });

  UI.bindSlider("chorusPreset", "chorusPresetValue", v => {
    patch.fx.chorus.preset = Number(v);
    const names = [
      "Off", "Gentle", "Soft", "Natural", "Warm", "Rich",
      "Lush", "Wide", "Shimmer", "Sparkle", "Dream",
      "Thick", "Ensemble", "Wash", "Ocean", "Infinite"
    ];
    return names[v] || "Custom";
  });

  UI.bindSlider("delayPreset", "delayPresetValue", v => {
    patch.fx.delay.preset = Number(v);
    const names = [
      "Off", "Slap 1/16", "Slap 1/8", "Doubler", "Room 1/16", "Room 1/8",
      "Echo 1/4", "Echo 1/4 PP", "Echo 1/8D", "Triplet", "Half Note",
      "Ambient 1/2", "Space 1/1", "Dream 1/1D", "Infinite 1/2", "Wash 1/1"
    ];
    return names[v] || "Custom";
  });

  UI.bindSlider("reverbPreset", "reverbPresetValue", v => {
    patch.fx.reverb.preset = Number(v);
    const names = [
      "Off", "Tiny Room", "Small Room", "Bedroom", "Living Room", "Studio",
      "Small Hall", "Concert Hall", "Cathedral", "Church", "Arena",
      "Ambient", "Dream Space", "Infinite", "Cosmic", "Void"
    ];
    return names[v] || "Custom";
  });
};

// ------------------------------------------------------------
//  TEMPO TO DELAY TIME CONVERTER
// ------------------------------------------------------------

function tempoToDelayTime(tempo, division) {
  const beatDuration = 60 / tempo; // seconds per beat
  
  const divisions = {
    "1/32": beatDuration / 8,
    "1/16": beatDuration / 4,
    "1/8": beatDuration / 2,
    "1/8d": (beatDuration / 2) * 1.5, // dotted
    "1/4t": (beatDuration * 2) / 3,   // triplet
    "1/4": beatDuration,
    "1/2": beatDuration * 2,
    "1/1": beatDuration * 4,
    "1/1d": beatDuration * 6, // dotted whole note
  };
  
  return divisions[division] || 0;
}

// ------------------------------------------------------------
//  APPLY ALL EFFECTS WITH ROUTING
// ------------------------------------------------------------

EffectsEngine.applyAll = function (ctx, inputNode, fxParams, noteLength) {
  let currentNode = inputNode;

  // Route 0: STEREO WIDTH (mono to stereo conversion + width)
  currentNode = applyStereoWidthEffect(ctx, currentNode, fxParams.stereoWidth?.preset || 0);

  // Route 1: DETUNE (stereo widening with LFO movement)
  if (fxParams.detune && fxParams.detune.preset > 0) {
    currentNode = applyDetuneEffect(ctx, currentNode, fxParams.detune.preset);
  }

  // Route 2: CHORUS (lushness)
  if (fxParams.chorus && fxParams.chorus.preset > 0) {
    currentNode = applyChorusEffect(ctx, currentNode, fxParams.chorus.preset);
  }

  // Route 3: DELAY (rhythmic space) - NOW WITH LOWPASS
  if (fxParams.delay && fxParams.delay.preset > 0) {
    currentNode = applyDelayEffect(ctx, currentNode, fxParams.delay.preset, window.patch.tempo);
  }

  // Route 4: REVERB (depth/ambience)
  if (fxParams.reverb && fxParams.reverb.preset > 0) {
    currentNode = applyReverbEffect(ctx, currentNode, fxParams.reverb.preset);
  }

  return { node: currentNode };
};

// ------------------------------------------------------------
//  STEREO WIDTH EFFECT (mono to stereo + width enhancement)
// ------------------------------------------------------------

function applyStereoWidthEffect(ctx, monoInput, presetIndex) {
  const preset = STEREO_WIDTH_PRESETS[presetIndex];
  if (!preset || preset.amount === 0) {
    // Mono preset: convert to stereo but no width
    const splitter = ctx.createGain();
    const merger = ctx.createChannelMerger(2);
    monoInput.connect(splitter);
    splitter.connect(merger, 0, 0); // Left
    splitter.connect(merger, 0, 1); // Right
    return merger;
  }

  const splitter = ctx.createGain();
  const merger = ctx.createChannelMerger(2);
  
  monoInput.connect(splitter);

  // LEFT: Direct
  const leftGain = ctx.createGain();
  leftGain.gain.value = 1.0;
  splitter.connect(leftGain);
  leftGain.connect(merger, 0, 0);

  // RIGHT: Delayed + All-pass filtered for width
  const haasDelay = ctx.createDelay();
  haasDelay.delayTime.value = preset.amount * 0.001; // 0-2ms

  const allpass = ctx.createBiquadFilter();
  allpass.type = "allpass";
  allpass.frequency.value = 700 + (preset.amount * 500); // 700-1700Hz
  
  const rightGain = ctx.createGain();
  rightGain.gain.value = 1.0;
  
  splitter.connect(haasDelay);
  haasDelay.connect(allpass);
  allpass.connect(rightGain);
  rightGain.connect(merger, 0, 1);

  return merger;
}

// ------------------------------------------------------------
//  DETUNE EFFECT
// ------------------------------------------------------------

function applyDetuneEffect(ctx, stereoInput, presetIndex) {
  const preset = DETUNE_PRESETS[presetIndex];
  if (!preset || preset.amount === 0) return stereoInput;

  const splitter = ctx.createChannelSplitter(2);
  const merger = ctx.createChannelMerger(2);
  stereoInput.connect(splitter);

  // LEFT CHANNEL: Mix dry + detuned
  const mixL = ctx.createGain();
  
  // Dry left
  const dryL = ctx.createGain();
  dryL.gain.value = 0.7;
  splitter.connect(dryL, 0);
  dryL.connect(mixL);
  
  // Detuned left
  const delayL = ctx.createDelay();
  delayL.delayTime.value = 0.003 + (preset.amount / 100) * 0.008;
  
  const lfoL = ctx.createOscillator();
  lfoL.frequency.value = preset.lfoRate;
  const lfoGainL = ctx.createGain();
  lfoGainL.gain.value = preset.lfoDepth;
  lfoL.connect(lfoGainL).connect(delayL.delayTime);
  lfoL.start();
  
  const wetL = ctx.createGain();
  wetL.gain.value = 0.3;
  splitter.connect(delayL, 0);
  delayL.connect(wetL);
  wetL.connect(mixL);
  
  mixL.connect(merger, 0, 0);

  // RIGHT CHANNEL: Mix dry + detuned
  const mixR = ctx.createGain();
  
  // Dry right
  const dryR = ctx.createGain();
  dryR.gain.value = 0.7;
  splitter.connect(dryR, 1);
  dryR.connect(mixR);
  
  // Detuned right
  const delayR = ctx.createDelay();
  delayR.delayTime.value = 0.006 + (preset.amount / 100) * 0.012;
  
  const lfoR = ctx.createOscillator();
  lfoR.frequency.value = preset.lfoRate * 1.1;
  const lfoGainR = ctx.createGain();
  lfoGainR.gain.value = preset.lfoDepth * 1.2;
  lfoR.connect(lfoGainR).connect(delayR.delayTime);
  lfoR.start();
  
  const wetR = ctx.createGain();
  wetR.gain.value = 0.3;
  splitter.connect(delayR, 1);
  delayR.connect(wetR);
  wetR.connect(mixR);
  
  mixR.connect(merger, 0, 1);

  return merger;
}

// ------------------------------------------------------------
//  CHORUS EFFECT
// ------------------------------------------------------------

function applyChorusEffect(ctx, stereoInput, presetIndex) {
  const preset = CHORUS_PRESETS[presetIndex];
  if (!preset || preset.voices === 0) return stereoInput;

  const dryGain = ctx.createGain();
  dryGain.gain.value = 1.0;
  stereoInput.connect(dryGain);

  const splitter = ctx.createChannelSplitter(2);
  const merger = ctx.createChannelMerger(2);
  stereoInput.connect(splitter);

  // Create multiple chorus voices per channel
  const voicesPerChannel = Math.ceil(preset.voices / 2);
  
  // LEFT
  const mixL = ctx.createGain();
  mixL.gain.value = 1.0 / voicesPerChannel;
  
  for (let i = 0; i < voicesPerChannel; i++) {
    const delay = ctx.createDelay();
    delay.delayTime.value = 0.015 + i * 0.005;
    
    const lfo = ctx.createOscillator();
    lfo.frequency.value = preset.rate * (1 + i * 0.1);
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = preset.depth;
    lfo.connect(lfoGain).connect(delay.delayTime);
    lfo.start();
    
    splitter.connect(delay, 0);
    delay.connect(mixL);
  }
  
  const lpL = ctx.createBiquadFilter();
  lpL.type = "highshelf";
  lpL.frequency.value = 3000;
  lpL.gain.value = 2;
  mixL.connect(lpL).connect(merger, 0, 0);

  // RIGHT
  const mixR = ctx.createGain();
  mixR.gain.value = 1.0 / voicesPerChannel;
  
  for (let i = 0; i < voicesPerChannel; i++) {
    const delay = ctx.createDelay();
    delay.delayTime.value = 0.02 + i * 0.006;
    
    const lfo = ctx.createOscillator();
    lfo.frequency.value = preset.rate * (1 + i * 0.12);
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = preset.depth * 1.1;
    lfo.connect(lfoGain).connect(delay.delayTime);
    lfo.start();
    
    splitter.connect(delay, 1);
    delay.connect(mixR);
  }
  
  const lpR = ctx.createBiquadFilter();
  lpR.type = "highshelf";
  lpR.frequency.value = 3000;
  lpR.gain.value = 2;
  mixR.connect(lpR).connect(merger, 0, 1);

  const wetGain = ctx.createGain();
  wetGain.gain.value = preset.wetMix;
  merger.connect(wetGain);

  const output = ctx.createGain();
  dryGain.connect(output);
  wetGain.connect(output);

  return output;
}

// ------------------------------------------------------------
//  DELAY EFFECT (TEMPO SYNCED)
// ------------------------------------------------------------

function applyDelayEffect(ctx, stereoInput, presetIndex, tempo) {
  const preset = DELAY_PRESETS[presetIndex];
  if (!preset || preset.time === 0) return stereoInput;

  const delayTime = tempoToDelayTime(tempo, preset.time);
  
  const dryGain = ctx.createGain();
  dryGain.gain.value = 1.0;
  stereoInput.connect(dryGain);

  if (preset.pingPong) {
    // PING-PONG DELAY with LOWPASS for softer repeats
    const splitter = ctx.createChannelSplitter(2);
    const merger = ctx.createChannelMerger(2);
    stereoInput.connect(splitter);

    const delayL = ctx.createDelay();
    delayL.delayTime.value = delayTime;
    
    // LOWPASS FILTER for softer attack
    const lpL = ctx.createBiquadFilter();
    lpL.type = "lowpass";
    lpL.frequency.value = preset.lpFreq;
    lpL.Q.value = 0.7;
    
    const feedbackL = ctx.createGain();
    feedbackL.gain.value = preset.feedback;
    
    const delayR = ctx.createDelay();
    delayR.delayTime.value = delayTime;
    
    const lpR = ctx.createBiquadFilter();
    lpR.type = "lowpass";
    lpR.frequency.value = preset.lpFreq;
    lpR.Q.value = 0.7;
    
    const feedbackR = ctx.createGain();
    feedbackR.gain.value = preset.feedback;

    // Cross-feedback for ping-pong
    splitter.connect(delayL, 0);
    delayL.connect(lpL);
    lpL.connect(feedbackL);
    feedbackL.connect(delayR); // L feeds R
    feedbackL.connect(merger, 0, 0);
    
    splitter.connect(delayR, 1);
    delayR.connect(lpR);
    lpR.connect(feedbackR);
    feedbackR.connect(delayL); // R feeds L
    feedbackR.connect(merger, 0, 1);

    const wetGain = ctx.createGain();
    wetGain.gain.value = preset.wetMix;
    merger.connect(wetGain);

    const output = ctx.createGain();
    dryGain.connect(output);
    wetGain.connect(output);

    return output;
  } else {
    // MONO DELAY with LOWPASS
    const delay = ctx.createDelay();
    delay.delayTime.value = delayTime;
    
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = preset.lpFreq;
    lp.Q.value = 0.7;
    
    const feedback = ctx.createGain();
    feedback.gain.value = preset.feedback;
    
    stereoInput.connect(delay);
    delay.connect(lp);
    lp.connect(feedback);
    feedback.connect(delay); // Feedback loop
    
    const wetGain = ctx.createGain();
    wetGain.gain.value = preset.wetMix;
    feedback.connect(wetGain);

    const output = ctx.createGain();
    dryGain.connect(output);
    wetGain.connect(output);

    return output;
  }
}

// ------------------------------------------------------------
//  REVERB EFFECT
// ------------------------------------------------------------

function applyReverbEffect(ctx, stereoInput, presetIndex) {
  const preset = REVERB_PRESETS[presetIndex];
  if (!preset || preset.size === 0) return stereoInput;

  // Generate impulse for this preset (cached)
  const cacheKey = `reverb_${presetIndex}`;
  if (!cachedReverbImpulses[cacheKey]) {
    cachedReverbImpulses[cacheKey] = generateReverbImpulse(ctx, preset);
  }

  const dryGain = ctx.createGain();
  dryGain.gain.value = 1.0;
  stereoInput.connect(dryGain);

  // Predelay
  const predelay = ctx.createDelay();
  predelay.delayTime.value = preset.predelay;

  const convolver = ctx.createConvolver();
  convolver.buffer = cachedReverbImpulses[cacheKey];
  convolver.normalize = true;

  const wetGain = ctx.createGain();
  wetGain.gain.value = preset.wetMix;

  stereoInput.connect(predelay);
  predelay.connect(convolver);
  convolver.connect(wetGain);

  const output = ctx.createGain();
  dryGain.connect(output);
  wetGain.connect(output);

  return output;
}

function generateReverbImpulse(ctx, preset) {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * preset.size;
  const impulse = ctx.createBuffer(2, length, sampleRate);

  for (let channel = 0; channel < 2; channel++) {
    const data = impulse.getChannelData(channel);
    
    // Early reflections
    for (let i = 0; i < sampleRate * 0.05; i++) {
      const t = i / (sampleRate * 0.05);
      data[i] = (Math.random() * 2 - 1) * (1 - t * 0.5) * 0.4;
    }
    
    // Late reverberation with damping
    for (let i = Math.floor(sampleRate * 0.05); i < length; i++) {
      const t = i / length;
      const decay = Math.pow(1 - t, preset.decay);
      const damping = 1 - t * preset.damping;
      data[i] = (Math.random() * 2 - 1) * decay * damping * 0.45;
    }
  }

  return impulse;
}

// ------------------------------------------------------------
//  CLEAR CACHE
// ------------------------------------------------------------

EffectsEngine.clearCache = function () {
  cachedReverbImpulses = {};
};
