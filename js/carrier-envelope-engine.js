// ============================================================
//  AMP ENVELOPE ENGINE (A–H–D–H–D)
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
  env.gain.setValueAtTime(0.0, t0);

  env.gain.linearRampToValueAtTime(1.0, tA_end);
  env.gain.setValueAtTime(1.0, tH1_end);
  env.gain.linearRampToValueAtTime(envParams.decay1Target, tD1_end);
  env.gain.setValueAtTime(envParams.decay1Target, tH2_end);
  env.gain.linearRampToValueAtTime(0.0, tD2_end);

  inputNode.connect(env);

  return {
    node: env,
    noteLength,
  };
};
