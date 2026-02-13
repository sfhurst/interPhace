// ============================================================
//  EFFECTS ENGINE
// ============================================================

window.EffectsEngine = {};

// ------------------------------------------------------------
//  REGISTER DEFAULTS
// ------------------------------------------------------------

EffectsEngine.register = function (patch) {
  patch.fx.detune = { amount: 0 };
};

// ------------------------------------------------------------
//  APPLY ALL EFFECTS IN SERIES
// ------------------------------------------------------------

EffectsEngine.applyAll = function (ctx, inputNode, fxParams, noteLength) {
  let node = inputNode;

  if (fxParams.detune && fxParams.detune.amount > 0) {
    node = applyDetuneEffect(ctx, node, noteLength, fxParams.detune.amount);
  }

  return { node };
};

// ------------------------------------------------------------
//  DETUNE EFFECT
// ------------------------------------------------------------

window.applyDetuneEffect = function (ctx, sourceNode, noteLength, amt) {
  if (amt <= 0) return sourceNode;

  const base = amt * 0.00005;
  const drift = amt * 0.0001;
  const rate = 0.15 + amt * 0.006;

  const left = ctx.createDelay();
  const right = ctx.createDelay();

  left.delayTime.value = base;
  right.delayTime.value = base * 1.7;

  const lfo = ctx.createOscillator();
  lfo.frequency.value = rate;

  const lfoL = ctx.createGain();
  const lfoR = ctx.createGain();

  lfoL.gain.value = drift * 0.6;
  lfoR.gain.value = drift * 0.8;

  lfo.connect(lfoL).connect(left.delayTime);
  lfo.connect(lfoR).connect(right.delayTime);
  lfo.start();

  const split = ctx.createChannelSplitter(2);
  const merge = ctx.createChannelMerger(2);

  sourceNode.connect(split);

  split.connect(left, 0);
  left.connect(merge, 0, 0);

  split.connect(right, 0);
  right.connect(merge, 0, 1);

  return merge;
};
