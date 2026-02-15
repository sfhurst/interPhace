// ============================================================
//  EFFECTS ENGINE (UPDATED FOR STEREO FM INPUT)
// ============================================================

window.EffectsEngine = {};

// Cache for reverb impulse (generated once, reused)
let cachedReverbImpulse = null;

// ------------------------------------------------------------
//  REGISTER DEFAULTS
// ------------------------------------------------------------

EffectsEngine.register = function (patch) {
  patch.fx.detune = { amount: 0 };
  patch.fx.chorus = { amount: 0 };
  patch.fx.reverb = { amount: 0 };
};

// ------------------------------------------------------------
//  APPLY ALL EFFECTS WITH ROUTING
// ------------------------------------------------------------

EffectsEngine.applyAll = function (ctx, inputNode, fxParams, noteLength) {
  // Input is now ALREADY STEREO from FM engine (or mono from envelope)
  // We'll handle both cases gracefully
  
  let stereoNode = inputNode;

  // Route through effects chain
  stereoNode = routeEffects(ctx, stereoNode, fxParams, noteLength);

  return { node: stereoNode };
};

// ------------------------------------------------------------
//  EFFECTS ROUTER
// ------------------------------------------------------------

function routeEffects(ctx, stereoInput, fxParams, noteLength) {
  let currentNode = stereoInput;

  // Route 1: DETUNE (stereo widening)
  if (fxParams.detune && fxParams.detune.amount > 0) {
    currentNode = applyDetuneEffect(ctx, currentNode, fxParams.detune.amount);
  }

  // Route 2: CHORUS (stereo modulation)
  if (fxParams.chorus && fxParams.chorus.amount > 0) {
    currentNode = applyChorusEffect(ctx, currentNode, fxParams.chorus.amount);
  }

  // Route 3: REVERB (stereo space)
  if (fxParams.reverb && fxParams.reverb.amount > 0) {
    currentNode = applyReverbEffect(ctx, currentNode, fxParams.reverb.amount);
  }

  return currentNode;
}

// ------------------------------------------------------------
//  DETUNE EFFECT (ENHANCED FOR HIGHS)
// ------------------------------------------------------------

function applyDetuneEffect(ctx, stereoInput, amount) {
  if (amount <= 0) return stereoInput;

  // Split stereo into L/R
  const splitter = ctx.createChannelSplitter(2);
  const merger = ctx.createChannelMerger(2);

  stereoInput.connect(splitter);

  // LEFT CHANNEL: Short delay with slow LFO
  const delayL = ctx.createDelay();
  delayL.delayTime.value = 0.003 + (amount / 100) * 0.008;

  const lfoL = ctx.createOscillator();
  lfoL.frequency.value = 0.25 + (amount / 100) * 0.35;

  const lfoGainL = ctx.createGain();
  lfoGainL.gain.value = (amount / 100) * 0.0025;

  lfoL.connect(lfoGainL).connect(delayL.delayTime);
  lfoL.start();

  splitter.connect(delayL, 0);
  delayL.connect(merger, 0, 0);

  // RIGHT CHANNEL: Longer delay with faster LFO
  const delayR = ctx.createDelay();
  delayR.delayTime.value = 0.006 + (amount / 100) * 0.012;

  const lfoR = ctx.createOscillator();
  lfoR.frequency.value = 0.33 + (amount / 100) * 0.45;

  const lfoGainR = ctx.createGain();
  lfoGainR.gain.value = (amount / 100) * 0.0035;

  lfoR.connect(lfoGainR).connect(delayR.delayTime);
  lfoR.start();

  splitter.connect(delayR, 1);
  delayR.connect(merger, 0, 1);

  return merger;
}

// ------------------------------------------------------------
//  CHORUS EFFECT (ENHANCED FOR AIRINESS)
// ------------------------------------------------------------

function applyChorusEffect(ctx, stereoInput, amount) {
  if (amount <= 0) return stereoInput;

  const wetMix = (amount / 100) * 0.6; // Slightly wetter for more lushness
  const dryMix = 1.0;

  // DRY PATH
  const dryGain = ctx.createGain();
  dryGain.gain.value = dryMix;
  stereoInput.connect(dryGain);

  // WET PATH - DUAL CHORUS VOICES PER CHANNEL
  const splitter = ctx.createChannelSplitter(2);
  const merger = ctx.createChannelMerger(2);

  stereoInput.connect(splitter);

  // LEFT CHANNEL - Two chorus voices for richness
  const delayL1 = ctx.createDelay();
  delayL1.delayTime.value = 0.018;
  
  const lfoL1 = ctx.createOscillator();
  lfoL1.frequency.value = 0.27;
  const lfoGainL1 = ctx.createGain();
  lfoGainL1.gain.value = 0.004;
  lfoL1.connect(lfoGainL1).connect(delayL1.delayTime);
  lfoL1.start();

  const delayL2 = ctx.createDelay();
  delayL2.delayTime.value = 0.024;
  
  const lfoL2 = ctx.createOscillator();
  lfoL2.frequency.value = 0.31;
  const lfoGainL2 = ctx.createGain();
  lfoGainL2.gain.value = 0.005;
  lfoL2.connect(lfoGainL2).connect(delayL2.delayTime);
  lfoL2.start();

  // High-shelf boost for airiness
  const lpL = ctx.createBiquadFilter();
  lpL.type = "highshelf";
  lpL.frequency.value = 3000;
  lpL.gain.value = 2; // +2dB above 3kHz

  const mixL = ctx.createGain();
  mixL.gain.value = 0.5;

  splitter.connect(delayL1, 0);
  splitter.connect(delayL2, 0);
  delayL1.connect(mixL);
  delayL2.connect(mixL);
  mixL.connect(lpL).connect(merger, 0, 0);

  // RIGHT CHANNEL - Two chorus voices (different timing)
  const delayR1 = ctx.createDelay();
  delayR1.delayTime.value = 0.022;
  
  const lfoR1 = ctx.createOscillator();
  lfoR1.frequency.value = 0.29;
  const lfoGainR1 = ctx.createGain();
  lfoGainR1.gain.value = 0.0045;
  lfoR1.connect(lfoGainR1).connect(delayR1.delayTime);
  lfoR1.start();

  const delayR2 = ctx.createDelay();
  delayR2.delayTime.value = 0.028;
  
  const lfoR2 = ctx.createOscillator();
  lfoR2.frequency.value = 0.34;
  const lfoGainR2 = ctx.createGain();
  lfoGainR2.gain.value = 0.0055;
  lfoR2.connect(lfoGainR2).connect(delayR2.delayTime);
  lfoR2.start();

  const lpR = ctx.createBiquadFilter();
  lpR.type = "highshelf";
  lpR.frequency.value = 3000;
  lpR.gain.value = 2;

  const mixR = ctx.createGain();
  mixR.gain.value = 0.5;

  splitter.connect(delayR1, 1);
  splitter.connect(delayR2, 1);
  delayR1.connect(mixR);
  delayR2.connect(mixR);
  mixR.connect(lpR).connect(merger, 0, 1);

  const wetGain = ctx.createGain();
  wetGain.gain.value = wetMix;
  merger.connect(wetGain);

  // MIX DRY + WET
  const output = ctx.createGain();
  dryGain.connect(output);
  wetGain.connect(output);

  return output;
}

// ------------------------------------------------------------
//  REVERB EFFECT (ENHANCED FOR AIRINESS)
// ------------------------------------------------------------

function applyReverbEffect(ctx, stereoInput, amount) {
  if (amount <= 0) return stereoInput;

  // Generate impulse once and cache it
  if (!cachedReverbImpulse) {
    cachedReverbImpulse = generateAiryReverbImpulse(ctx);
  }

  const wetMix = (amount / 100) * 0.45;

  // DRY PATH
  const dryGain = ctx.createGain();
  dryGain.gain.value = 1.0;
  stereoInput.connect(dryGain);

  // WET PATH with high-shelf for sparkle
  const convolver = ctx.createConvolver();
  convolver.buffer = cachedReverbImpulse;
  convolver.normalize = true;

  const highShelf = ctx.createBiquadFilter();
  highShelf.type = "highshelf";
  highShelf.frequency.value = 2000;
  highShelf.gain.value = 3; // +3dB high sparkle

  const wetGain = ctx.createGain();
  wetGain.gain.value = wetMix;

  stereoInput.connect(convolver);
  convolver.connect(highShelf);
  highShelf.connect(wetGain);

  // MIX DRY + WET
  const output = ctx.createGain();
  dryGain.connect(output);
  wetGain.connect(output);

  return output;
}

// ------------------------------------------------------------
//  AIRY REVERB IMPULSE GENERATOR
// ------------------------------------------------------------

function generateAiryReverbImpulse(ctx) {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * 3.5; // Slightly longer tail
  const impulse = ctx.createBuffer(2, length, sampleRate);

  for (let channel = 0; channel < 2; channel++) {
    const data = impulse.getChannelData(channel);

    // EARLY REFLECTIONS (first 50ms) - Brighter
    for (let i = 0; i < sampleRate * 0.05; i++) {
      const t = i / (sampleRate * 0.05);
      // More discrete reflections for clarity
      const reflection = Math.sin(t * Math.PI * 20) * (1 - t);
      data[i] = (Math.random() * 2 - 1) * 0.4 + reflection * 0.3;
    }

    // LATE REVERBERATION (smoother, airier)
    for (let i = Math.floor(sampleRate * 0.05); i < length; i++) {
      const t = i / length;
      const decay = Math.pow(1 - t, 3.5); // Slightly slower decay
      const damping = 1 - t * 0.3; // Less damping = more highs
      data[i] = (Math.random() * 2 - 1) * decay * damping * 0.45;
    }
  }

  return impulse;
}

// ------------------------------------------------------------
//  CLEAR CACHE
// ------------------------------------------------------------

EffectsEngine.clearCache = function () {
  cachedReverbImpulse = null;
};
