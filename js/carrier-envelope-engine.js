// ============================================================
//  AMP ENVELOPE ENGINE WITH PERSONALITY (ENHANCED)
// ============================================================

window.AmpEnvelopeEngine = {};

// ------------------------------------------------------------
//  ENVELOPE PERSONALITY TABLE (20 PRESETS)
// ------------------------------------------------------------

const ENVELOPE_PERSONALITIES = [
  // 0: Clean - no personality
  {
    name: "Clean",
    hold1Decay: 0,        // No decay during hold
    hold2Decay: 0,
    hold1Vibrato: 0,      // No vibrato
    hold2Vibrato: 0,
    decay2PitchSag: 0,    // No pitch drift
    attackBloom: 0,       // No gain bloom
    description: "Pure, untouched envelope"
  },

  // 1-5: ANALOG CHARACTER
  {
    name: "Analog Soft",
    hold1Decay: 0.03,     // 3% decay per second during hold
    hold2Decay: 0.05,
    hold1Vibrato: 0,
    hold2Vibrato: 0.002,  // Slight vibrato on hold2
    decay2PitchSag: -2,   // -2 cents pitch sag
    attackBloom: 0.08,    // 8% overshoot bloom
    description: "Gentle analog drift"
  },
  {
    name: "Analog Warm",
    hold1Decay: 0.05,
    hold2Decay: 0.08,
    hold1Vibrato: 0.003,
    hold2Vibrato: 0.004,
    decay2PitchSag: -3,
    attackBloom: 0.12,
    description: "Warm analog character"
  },
  {
    name: "Analog Tape",
    hold1Decay: 0.08,
    hold2Decay: 0.12,
    hold1Vibrato: 0.005,
    hold2Vibrato: 0.006,
    decay2PitchSag: -5,   // Noticeable tape sag
    attackBloom: 0.15,
    description: "Tape-like warmth and sag"
  },
  {
    name: "Analog Wow",
    hold1Decay: 0.06,
    hold2Decay: 0.1,
    hold1Vibrato: 0.008,  // Slow wow
    hold2Vibrato: 0.01,
    decay2PitchSag: -4,
    attackBloom: 0.1,
    description: "Slow wow and flutter"
  },

  // 6-10: BELL & PERCUSSIVE
  {
    name: "Bell Shimmer",
    hold1Decay: 0.02,
    hold2Decay: 0.04,
    hold1Vibrato: 0.012,  // Fast shimmer
    hold2Vibrato: 0.015,
    decay2PitchSag: -1,   // Slight downward
    attackBloom: 0.2,     // Strong initial bloom
    description: "Shimmering bell character"
  },
  {
    name: "Crystal Ring",
    hold1Decay: 0.01,
    hold2Decay: 0.02,
    hold1Vibrato: 0.018,  // Very fast shimmer
    hold2Vibrato: 0.02,
    decay2PitchSag: 0,    // No sag (crystal stays pure)
    attackBloom: 0.25,
    description: "High-frequency bell ring"
  },
  {
    name: "Glass Chime",
    hold1Decay: 0.04,
    hold2Decay: 0.06,
    hold1Vibrato: 0.01,
    hold2Vibrato: 0.012,
    decay2PitchSag: +1,   // Slight upward (glass tension)
    attackBloom: 0.18,
    description: "Glass-like sustain"
  },
  {
    name: "Wooden Clap",
    hold1Decay: 0.15,     // Fast decay (percussive)
    hold2Decay: 0.2,
    hold1Vibrato: 0.004,
    hold2Vibrato: 0.003,
    decay2PitchSag: -6,   // Wood pitch drop
    attackBloom: 0.1,
    description: "Wooden percussion"
  },
  {
    name: "Metal Hit",
    hold1Decay: 0.03,
    hold2Decay: 0.05,
    hold1Vibrato: 0.025,  // Metallic ring
    hold2Vibrato: 0.03,
    decay2PitchSag: -2,
    attackBloom: 0.3,     // Strong transient
    description: "Metallic impact"
  },

  // 11-15: PAD & ATMOSPHERIC
  {
    name: "Pad Breath",
    hold1Decay: 0.02,
    hold2Decay: 0.03,
    hold1Vibrato: 0.006,
    hold2Vibrato: 0.008,
    decay2PitchSag: -1,
    attackBloom: 0.05,
    description: "Breathing pad texture"
  },
  {
    name: "Pad Swell",
    hold1Decay: -0.02,    // NEGATIVE = gain increase!
    hold2Decay: -0.03,
    hold1Vibrato: 0.004,
    hold2Vibrato: 0.005,
    decay2PitchSag: 0,
    attackBloom: 0.15,
    description: "Swelling sustain"
  },
  {
    name: "Choir Drift",
    hold1Decay: 0.04,
    hold2Decay: 0.05,
    hold1Vibrato: 0.007,
    hold2Vibrato: 0.009,
    decay2PitchSag: -1.5,
    attackBloom: 0.08,
    description: "Vocal-like drift"
  },
  {
    name: "Ambient Float",
    hold1Decay: 0.01,
    hold2Decay: 0.015,
    hold1Vibrato: 0.003,
    hold2Vibrato: 0.004,
    decay2PitchSag: +0.5, // Slight upward float
    attackBloom: 0.1,
    description: "Floating atmosphere"
  },
  {
    name: "Dream Wash",
    hold1Decay: 0.03,
    hold2Decay: 0.04,
    hold1Vibrato: 0.01,
    hold2Vibrato: 0.012,
    decay2PitchSag: -2,
    attackBloom: 0.12,
    description: "Dreamy wash"
  },

  // 16-20: EXPRESSIVE & EXPERIMENTAL
  {
    name: "Pluck Bounce",
    hold1Decay: 0.2,      // Fast initial decay
    hold2Decay: 0.15,
    hold1Vibrato: 0.002,
    hold2Vibrato: 0,
    decay2PitchSag: -8,   // Strong pitch drop
    attackBloom: 0.05,
    description: "Plucked string bounce"
  },
  {
    name: "Voice Growl",
    hold1Decay: 0.1,
    hold2Decay: 0.12,
    hold1Vibrato: 0.015,  // Vocal flutter
    hold2Vibrato: 0.018,
    decay2PitchSag: -4,
    attackBloom: 0.2,
    description: "Vocal growl texture"
  },
  {
    name: "Pitch Rise",
    hold1Decay: 0.02,
    hold2Decay: 0.03,
    hold1Vibrato: 0.004,
    hold2Vibrato: 0.005,
    decay2PitchSag: +8,   // UPWARD pitch bend
    attackBloom: 0.1,
    description: "Rising pitch tail"
  },
  {
    name: "Chaos Drift",
    hold1Decay: 0.08,
    hold2Decay: 0.1,
    hold1Vibrato: 0.02,   // Random-ish
    hold2Vibrato: 0.025,
    decay2PitchSag: -6,
    attackBloom: 0.18,
    description: "Chaotic modulation"
  },
  {
    name: "Glitch Stutter",
    hold1Decay: 0.15,
    hold2Decay: 0.18,
    hold1Vibrato: 0.035,  // Fast, glitchy
    hold2Vibrato: 0.04,
    decay2PitchSag: -10,  // Extreme drop
    attackBloom: 0.25,
    description: "Digital glitch"
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
    personality: 0, // NEW: 0-19 personality preset
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

AmpEnvelopeEngine.apply = function (ctx, inputNode, envParams) {
  const mult = envParams.envMult;

  const tA = envParams.attack1 * mult;
  const tH1 = envParams.hold1 * mult;
  const tD1 = envParams.decay1 * mult;
  const tH2 = envParams.hold2 * mult;
  const tD2 = envParams.decay2 * mult;

  const noteLength = tA + tH1 + tD1 + tH2 + tD2;

  const t0 = ctx.currentTime;

  // Get personality preset
  const personality = ENVELOPE_PERSONALITIES[envParams.personality || 0];

  // Create main envelope
  const env = ctx.createGain();
  env.gain.cancelScheduledValues(t0);
  env.gain.setValueAtTime(0.0001, t0);

  // ATTACK (with optional bloom)
  const attackPeak = 1.0 + personality.attackBloom;
  env.gain.exponentialRampToValueAtTime(attackPeak, t0 + tA);

  // If bloom, quickly settle back to 1.0
  if (personality.attackBloom > 0) {
    env.gain.exponentialRampToValueAtTime(1.0, t0 + tA + 0.02);
  }

  // HOLD 1 (with optional decay and vibrato)
  if (tH1 > 0) {
    applyHoldPersonality(ctx, env.gain, t0 + tA, tH1, 1.0, personality.hold1Decay, personality.hold1Vibrato);
  }

  // DECAY 1
  const tD1_start = t0 + tA + tH1;
  const d1Target = envParams.decay1Target > 0.0001 ? envParams.decay1Target : 0.0001;
  env.gain.exponentialRampToValueAtTime(d1Target, tD1_start + tD1);

  // HOLD 2 (with optional decay and vibrato)
  if (tH2 > 0) {
    applyHoldPersonality(ctx, env.gain, tD1_start + tD1, tH2, d1Target, personality.hold2Decay, personality.hold2Vibrato);
  }

  // DECAY 2 (with optional pitch sag)
  const tD2_start = tD1_start + tD1 + tH2;
  env.gain.exponentialRampToValueAtTime(0.0001, tD2_start + tD2);

  // Apply pitch sag to input if needed
  let finalInput = inputNode;
  if (Math.abs(personality.decay2PitchSag) > 0.1) {
    finalInput = applyPitchSag(ctx, inputNode, tD2_start, tD2, personality.decay2PitchSag);
  }

  finalInput.connect(env);

  return {
    node: env,
    noteLength,
  };
};

// ------------------------------------------------------------
//  HOLD PERSONALITY (decay + vibrato during hold)
// ------------------------------------------------------------

function applyHoldPersonality(ctx, gainParam, startTime, duration, baseLevel, decayRate, vibratoDepth) {
  if (duration <= 0) return;

  // Apply decay curve during hold
  if (Math.abs(decayRate) > 0.001) {
    const endLevel = baseLevel * Math.exp(-decayRate * duration);
    
    if (decayRate > 0) {
      // Normal decay (level goes down)
      gainParam.exponentialRampToValueAtTime(Math.max(endLevel, 0.0001), startTime + duration);
    } else {
      // Negative decay = gain increase (swell)
      gainParam.exponentialRampToValueAtTime(Math.min(endLevel, 2.0), startTime + duration);
    }
  } else {
    // No decay, just hold flat
    gainParam.setValueAtTime(baseLevel, startTime + duration);
  }

  // Apply vibrato (subtle gain modulation) - NOT pitch
  // Note: For true pitch vibrato, we'd need to modulate frequency
  // Here we're doing amplitude vibrato for simplicity
  if (vibratoDepth > 0.001 && duration > 0.1) {
    const vibratoFreq = 4 + Math.random() * 2; // 4-6 Hz
    const steps = Math.floor(duration / 0.05); // 20 steps per second
    
    for (let i = 0; i < steps; i++) {
      const t = startTime + (i / steps) * duration;
      const phase = (i / steps) * Math.PI * 2 * vibratoFreq * duration;
      const vibrato = Math.sin(phase) * vibratoDepth * baseLevel;
      
      // Only apply if it won't create discontinuities
      if (i > 2 && i < steps - 2) {
        const targetGain = Math.max(0.0001, baseLevel + vibrato);
        gainParam.setValueAtTime(targetGain, t);
      }
    }
  }
}

// ------------------------------------------------------------
//  PITCH SAG (frequency modulation during decay2)
// ------------------------------------------------------------

function applyPitchSag(ctx, inputNode, startTime, duration, sagCents) {
  if (duration <= 0 || Math.abs(sagCents) < 0.1) return inputNode;

  // Create a frequency shifter using a delay with modulation
  // This is a simplified pitch shift - not perfect but musically effective
  
  const delay = ctx.createDelay();
  const delayGain = ctx.createGain();
  
  // Convert cents to delay time change
  // Positive cents = pitch up = shorter delay
  // Negative cents = pitch down = longer delay
  const baseDelay = 0.01; // 10ms base
  const maxShift = 0.005; // Max 5ms shift
  const shiftAmount = (sagCents / 100) * maxShift;
  
  delay.delayTime.setValueAtTime(baseDelay, startTime);
  
  if (sagCents < 0) {
    // Pitch sag down (common for analog)
    delay.delayTime.exponentialRampToValueAtTime(baseDelay - shiftAmount, startTime + duration);
  } else {
    // Pitch rise up (uncommon but cool)
    delay.delayTime.exponentialRampToValueAtTime(baseDelay + shiftAmount, startTime + duration);
  }
  
  delayGain.gain.value = 1.0;
  
  inputNode.connect(delay);
  delay.connect(delayGain);
  
  return delayGain;
}
