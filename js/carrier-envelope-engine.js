// ============================================================
//  AMP ENVELOPE ENGINE (SIMPLIFIED - NO PERSONALITIES)
// ============================================================

window.AmpEnvelopeEngine = {};

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
//  APPLY ENVELOPE
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

  return {
    node: env,
    noteLength,
  };
};
