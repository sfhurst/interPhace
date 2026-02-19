// ============================================================
//  AMP ENVELOPE ENGINE (SIMPLIFIED - NO PERSONALITIES)
// ============================================================

window.AmpEnvelopeEngine = {};

// ------------------------------------------------------------
//  ENVELOPE PERSONALITY PRESETS
// ------------------------------------------------------------

const ENVELOPE_PERSONALITY_PRESETS = [
  {
    name: "Clean",
    description: "No modulation - pure AHDHD",
    stages: {
      attack: { gainMod: null, pitchMod: null },
      hold1:  { gainMod: null, pitchMod: null },
      decay1: { gainMod: null, pitchMod: null },
      hold2:  { gainMod: null, pitchMod: null },
      decay2: { gainMod: null, pitchMod: null }
    }
  },
  {
    name: "Analog Drift",
    description: "Gentle pitch/gain wobble on sustains",
    stages: {
      attack: { gainMod: null, pitchMod: null },
      hold1:  { gainMod: {wave: "sine", rate: 0.2, depth: 0.02}, pitchMod: {wave: "sine", rate: 0.15, depth: 0.01} },
      decay1: { gainMod: null, pitchMod: null },
      hold2:  { gainMod: {wave: "sine", rate: 0.18, depth: 0.03}, pitchMod: {wave: "sine", rate: 0.12, depth: 0.015} },
      decay2: { gainMod: null, pitchMod: null }
    }
  },
  {
    name: "Tape Wow",
    description: "Slow pitch drift like old tape",
    stages: {
      attack: { gainMod: null, pitchMod: null },
      hold1:  { gainMod: null, pitchMod: {wave: "sine", rate: 0.08, depth: 0.02} },
      decay1: { gainMod: null, pitchMod: {wave: "sine", rate: 0.08, depth: 0.02} },
      hold2:  { gainMod: null, pitchMod: {wave: "sine", rate: 0.08, depth: 0.03} },
      decay2: { gainMod: null, pitchMod: {wave: "sine", rate: 0.08, depth: 0.02} }
    }
  },
  {
    name: "Tremolo",
    description: "Rhythmic gain pulsing on holds",
    stages: {
      attack: { gainMod: null, pitchMod: null },
      hold1:  { gainMod: {wave: "sine", rate: 4, depth: 0.15}, pitchMod: null },
      decay1: { gainMod: null, pitchMod: null },
      hold2:  { gainMod: {wave: "sine", rate: 4, depth: 0.12}, pitchMod: null },
      decay2: { gainMod: null, pitchMod: null }
    }
  },
  {
    name: "Vibrato",
    description: "Pitch wobble during sustains",
    stages: {
      attack: { gainMod: null, pitchMod: null },
      hold1:  { gainMod: null, pitchMod: {wave: "sine", rate: 5, depth: 0.03} },
      decay1: { gainMod: null, pitchMod: null },
      hold2:  { gainMod: null, pitchMod: {wave: "sine", rate: 5, depth: 0.025} },
      decay2: { gainMod: null, pitchMod: null }
    }
  },
  {
    name: "Growl",
    description: "Fast pitch shake during attack",
    stages: {
      attack: { gainMod: null, pitchMod: {wave: "sine", rate: 8, depth: 0.05} },
      hold1:  { gainMod: null, pitchMod: null },
      decay1: { gainMod: null, pitchMod: null },
      hold2:  { gainMod: null, pitchMod: null },
      decay2: { gainMod: null, pitchMod: null }
    }
  },
  {
    name: "Bell Shimmer",
    description: "Subtle sparkle during decay",
    stages: {
      attack: { gainMod: null, pitchMod: null },
      hold1:  { gainMod: null, pitchMod: null },
      decay1: { gainMod: {wave: "sine", rate: 6, depth: 0.04}, pitchMod: {wave: "sine", rate: 7, depth: 0.02} },
      hold2:  { gainMod: null, pitchMod: null },
      decay2: { gainMod: {wave: "sine", rate: 5, depth: 0.03}, pitchMod: {wave: "sine", rate: 6, depth: 0.015} }
    }
  },
  {
    name: "Choir Breathe",
    description: "Slow swell during holds like breathing",
    stages: {
      attack: { gainMod: null, pitchMod: null },
      hold1:  { gainMod: {wave: "sine", rate: 0.25, depth: 0.08}, pitchMod: null },
      decay1: { gainMod: null, pitchMod: null },
      hold2:  { gainMod: {wave: "sine", rate: 0.2, depth: 0.1}, pitchMod: null },
      decay2: { gainMod: null, pitchMod: null }
    }
  },
  {
    name: "Warble",
    description: "Pitch and gain wobble everywhere",
    stages: {
      attack: { gainMod: null, pitchMod: {wave: "sine", rate: 3, depth: 0.02} },
      hold1:  { gainMod: {wave: "sine", rate: 0.3, depth: 0.05}, pitchMod: {wave: "sine", rate: 2.5, depth: 0.025} },
      decay1: { gainMod: null, pitchMod: {wave: "sine", rate: 2, depth: 0.02} },
      hold2:  { gainMod: {wave: "sine", rate: 0.25, depth: 0.06}, pitchMod: {wave: "sine", rate: 2, depth: 0.03} },
      decay2: { gainMod: null, pitchMod: {wave: "sine", rate: 1.5, depth: 0.015} }
    }
  },
  {
    name: "Unstable",
    description: "Chaotic modulation - broken synth vibes",
    stages: {
      attack: { gainMod: {wave: "square", rate: 8, depth: 0.12}, pitchMod: {wave: "square", rate: 6, depth: 0.04} },
      hold1:  { gainMod: {wave: "sine", rate: 0.5, depth: 0.15}, pitchMod: {wave: "square", rate: 4, depth: 0.05} },
      decay1: { gainMod: {wave: "sine", rate: 3, depth: 0.1}, pitchMod: null },
      hold2:  { gainMod: {wave: "sine", rate: 0.3, depth: 0.2}, pitchMod: {wave: "sine", rate: 2, depth: 0.06} },
      decay2: { gainMod: null, pitchMod: {wave: "sine", rate: 1, depth: 0.03} }
    }
  },
];

// ------------------------------------------------------------
//  REGISTER DEFAULTS
// ------------------------------------------------------------

AmpEnvelopeEngine.register = function (patch) {
  patch.envelope.ahdhd = {
    attack1: 0.04,
    hold1: 0,
    decay1: 0.8,
    decay1Target: 0.1,
    hold2: 1.5,
    decay2: 0.9,
    envMult: 1.0,
    personality: 0, // Index into personality presets
  };
};

// ------------------------------------------------------------
//  COMPUTE LENGTH (without creating nodes)
// ------------------------------------------------------------

AmpEnvelopeEngine.computeLength = function (envParams) {
  const mult = envParams.envMult;
  const tA = envParams.attack1 * mult;
  const tH1 = envParams.hold1 * mult;
  const tD1 = envParams.decay1 * mult;
  const tH2 = envParams.hold2 * mult;
  const tD2 = envParams.decay2 * mult;
  return tA + tH1 + tD1 + tH2 + tD2;
};

// ------------------------------------------------------------
//  APPLY ENVELOPE WITH PERSONALITY
// ------------------------------------------------------------

AmpEnvelopeEngine.apply = function (ctx, inputNode, envParams, carrierNode, baseFreq) {
  const mult = envParams.envMult;

  const tA = envParams.attack1 * mult;
  const tH1 = envParams.hold1 * mult;
  const tD1 = envParams.decay1 * mult;
  const tH2 = envParams.hold2 * mult;
  const tD2 = envParams.decay2 * mult;

  const noteLength = tA + tH1 + tD1 + tH2 + tD2;

  const t0 = ctx.currentTime;
  const tA_end = t0 + tA;
  const tH1_end = tA_end + tH1;
  const tD1_end = tH1_end + tD1;
  const tH2_end = tD1_end + tH2;
  const tD2_end = tH2_end + tD2;

  const env = ctx.createGain();
  
  // Cancel any previous schedules
  env.gain.cancelScheduledValues(t0);
  
  // Use exponential ramps for more natural sound
  env.gain.setValueAtTime(0.0001, t0);

  // Attack: ramp up to 1.0
  env.gain.exponentialRampToValueAtTime(1.0, tA_end);
  
  // Hold 1: stay at 1.0
  env.gain.setValueAtTime(1.0, tH1_end);
  
  // Decay 1: ramp down to decay1Target
  if (envParams.decay1Target > 0.0001) {
    env.gain.exponentialRampToValueAtTime(envParams.decay1Target, tD1_end);
  } else {
    env.gain.linearRampToValueAtTime(0.0001, tD1_end);
  }
  
  // Hold 2: stay at decay1Target
  if (envParams.decay1Target > 0.0001) {
    env.gain.setValueAtTime(envParams.decay1Target, tH2_end);
  } else {
    env.gain.setValueAtTime(0.0001, tH2_end);
  }
  
  // Decay 2: ramp down to silence
  env.gain.exponentialRampToValueAtTime(0.0001, tD2_end);

  inputNode.connect(env);

  // ============================================================
  //  PERSONALITY MODULATION
  // ============================================================
  
  const personality = ENVELOPE_PERSONALITY_PRESETS[envParams.personality || 0];
  let finalOutput = env;

  if (personality && personality.name !== "Clean") {
    // Create LFO oscillators
    const gainLFO = ctx.createOscillator();
    const pitchLFO = ctx.createOscillator();
    
    gainLFO.type = "sine";
    pitchLFO.type = "sine";
    
    // Create depth control nodes
    const gainLFODepth = ctx.createGain();
    const pitchLFODepth = ctx.createGain();
    
    gainLFODepth.gain.value = 0;
    pitchLFODepth.gain.value = 0;
    
    // Create personality gain modulation node
    const personalityGain = ctx.createGain();
    personalityGain.gain.value = 1.0; // Base level
    
    // Connect gain modulation
    gainLFO.connect(gainLFODepth);
    gainLFODepth.connect(personalityGain.gain);
    
    // Connect pitch modulation (if carrier provided)
    if (carrierNode && baseFreq) {
      pitchLFO.connect(pitchLFODepth);
      pitchLFODepth.connect(carrierNode.frequency);
    }
    
    // Route audio through personality gain
    env.connect(personalityGain);
    finalOutput = personalityGain;
    
    // Schedule modulation depths for each stage
    scheduleStageModulation(ctx, gainLFO, gainLFODepth, personality.stages.attack, t0, tA, baseFreq);
    scheduleStageModulation(ctx, gainLFO, gainLFODepth, personality.stages.hold1, tA_end, tH1, baseFreq);
    scheduleStageModulation(ctx, gainLFO, gainLFODepth, personality.stages.decay1, tH1_end, tD1, baseFreq);
    scheduleStageModulation(ctx, gainLFO, gainLFODepth, personality.stages.hold2, tD1_end, tH2, baseFreq);
    scheduleStageModulation(ctx, gainLFO, gainLFODepth, personality.stages.decay2, tH2_end, tD2, baseFreq);
    
    if (carrierNode && baseFreq) {
      scheduleStageModulation(ctx, pitchLFO, pitchLFODepth, personality.stages.attack, t0, tA, baseFreq, true);
      scheduleStageModulation(ctx, pitchLFO, pitchLFODepth, personality.stages.hold1, tA_end, tH1, baseFreq, true);
      scheduleStageModulation(ctx, pitchLFO, pitchLFODepth, personality.stages.decay1, tH1_end, tD1, baseFreq, true);
      scheduleStageModulation(ctx, pitchLFO, pitchLFODepth, personality.stages.hold2, tD1_end, tH2, baseFreq, true);
      scheduleStageModulation(ctx, pitchLFO, pitchLFODepth, personality.stages.decay2, tH2_end, tD2, baseFreq, true);
    }
    
    // Start LFOs
    gainLFO.start(t0);
    pitchLFO.start(t0);
    
    // Stop LFOs
    gainLFO.stop(tD2_end + 0.1);
    pitchLFO.stop(tD2_end + 0.1);
  }

  return {
    node: finalOutput,
    noteLength,
  };
};

// ------------------------------------------------------------
//  HELPER: SCHEDULE STAGE MODULATION
// ------------------------------------------------------------

function scheduleStageModulation(ctx, lfo, depthNode, stageDef, startTime, duration, baseFreq, isPitch = false) {
  const RAMP_TIME = 0.01; // 10ms ramp to avoid clicks
  
  const modDef = isPitch ? stageDef.pitchMod : stageDef.gainMod;
  
  if (!modDef || duration < 0.001) {
    // No modulation for this stage - ramp to zero
    depthNode.gain.setValueAtTime(depthNode.gain.value, startTime);
    depthNode.gain.linearRampToValueAtTime(0, startTime + RAMP_TIME);
    return;
  }
  
  // Set LFO frequency
  lfo.frequency.setValueAtTime(modDef.rate, startTime);
  
  // Calculate depth
  let depth = modDef.depth;
  
  // For pitch modulation, convert semitone depth to Hz
  if (isPitch && baseFreq) {
    // depth is in semitones, convert to frequency deviation
    const ratio = Math.pow(2, depth / 12);
    depth = baseFreq * (ratio - 1);
  }
  
  // Ramp to target depth
  depthNode.gain.setValueAtTime(depthNode.gain.value, startTime);
  depthNode.gain.linearRampToValueAtTime(depth, startTime + RAMP_TIME);
  
  // Update waveform if specified
  if (modDef.wave) {
    lfo.type = modDef.wave;
  }
}
