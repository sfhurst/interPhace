// ============================================================
//  TEXTURE ENGINE
// ============================================================
// Deterministic, low-level noise and transient layers designed to
// add character without obscuring the synthesized instrument.
// ============================================================

window.TextureEngine = {};

const TEXTURE_PRESETS = [
  { name: "Clean", kind: "clean" },
  { name: "Tape", kind: "tape", color: 0.72, motion: 0.18 },
  { name: "Dust", kind: "dust", color: 0.46, density: 0.012 },
  { name: "Air", kind: "air", color: 0.12, motion: 0.08 },
  { name: "Felt", kind: "felt", color: 0.82, attack: 0.055 },
  { name: "Hammer", kind: "hammer", color: 0.58, attack: 0.018 },
  { name: "Breath", kind: "breath", color: 0.35, motion: 0.32 },
  { name: "Worn", kind: "worn", color: 0.64, motion: 0.28, density: 0.006 },
];

TextureEngine.register = function (patch) {
  patch.texture = patch.texture || { preset: 0, amount: 0 };
};

TextureEngine.initUI = function (patch) {
  UI.bindSlider("texturePreset", "texturePresetValue", (v) => {
    patch.texture.preset = Number(v);
    return TEXTURE_PRESETS[Number(v)]?.name || "Clean";
  });
  UI.bindSlider("textureAmount", "textureAmountValue", (v) => {
    patch.texture.amount = Number(v);
    return `${Math.round(v)}%`;
  });
};

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => ((state = (state * 1664525 + 1013904223) >>> 0) / 4294967296);
}


function scheduleTextureMacroEnvelope(param, now, envelopeParams, peak) {
  const env = envelopeParams || {};
  const mult = Math.max(0.01, Number(env.multiplier ?? env.timeMultiplier ?? 1) || 1);
  const attack = Math.max(0, Number(env.attack ?? env.attack1 ?? 0) || 0) * mult;
  const hold1 = Math.max(0, Number(env.hold1 ?? 0) || 0) * mult;
  const decay1 = Math.max(0, Number(env.decay1 ?? 0) || 0) * mult;
  const hold2 = Math.max(0, Number(env.hold2 ?? 0) || 0) * mult;
  const decay2 = Math.max(0, Number(env.decay2 ?? 0) || 0) * mult;

  const tAttack = now + attack;
  const tHold1 = tAttack + hold1;
  const tDecay1 = tHold1 + decay1;
  const tHold2 = tDecay1 + hold2;
  const tDecay2 = tHold2 + decay2;

  param.cancelScheduledValues(now);
  param.setValueAtTime(0, now);

  // Sustained textures follow the tone's onset, then remain present through
  // Hold 1, Decay 1, and Hold 2 instead of inheriting the tonal mid-envelope
  // drop. They leave with the same final Decay 2 timing as the instrument.
  if (attack > 0) param.linearRampToValueAtTime(peak, tAttack);
  else param.setValueAtTime(peak, now);

  param.setValueAtTime(peak, tHold1);
  param.setValueAtTime(peak, tDecay1);
  param.setValueAtTime(peak, tHold2);

  if (decay2 > 0) {
    param.exponentialRampToValueAtTime(0.0001, tDecay2);
  } else {
    param.setValueAtTime(0.0001, tHold2);
  }

  return Math.max(0.01, tDecay2 - now);
}

function makeNoiseBuffer(ctx, duration, presetIndex, midiNote) {
  const frames = Math.max(1, Math.ceil(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  const rnd = seededRandom(991 + presetIndex * 7919 + midiNote * 104729);
  const preset = TEXTURE_PRESETS[presetIndex] || TEXTURE_PRESETS[0];
  let low = 0;

  for (let i = 0; i < frames; i++) {
    const white = rnd() * 2 - 1;
    low += 0.035 * (white - low);
    const colored = white * (1 - (preset.color || 0)) + low * (preset.color || 0);
    let sample = colored;

    if (preset.kind === "dust" || preset.kind === "worn") {
      const click = rnd() < (preset.density || 0) ? (rnd() * 2 - 1) * 4 : 0;
      sample = colored * 0.28 + click;
    }

    data[i] = sample;
  }
  return buffer;
}

TextureEngine.apply = function (ctx, inputNode, texture, noteLength, midiNote, envelopeParams) {
  const presetIndex = Math.max(0, Math.min(TEXTURE_PRESETS.length - 1, Number(texture?.preset) || 0));
  const preset = TEXTURE_PRESETS[presetIndex];
  const amount = Math.max(0, Math.min(1, (Number(texture?.amount) || 0) / 100));
  if (!amount || preset.kind === "clean") return { mainBus: inputNode, node: inputNode };

  // Felt and Hammer use isolated transient generators. Their paths return here,
  // so none of the established Tape, Dust, Air, Breath, or Worn code changes.
  if (preset.kind === "felt" || preset.kind === "hammer") {
    const now = ctx.currentTime;
    // Dedicated excitation bus. The tonal input remains on its existing path;
    // Felt and Hammer are mixed after the effects chain so short attacks are not
    // smeared, delayed, or hidden by wet processing.
    const out = ctx.createGain();

    const midi = Number.isFinite(Number(midiNote)) ? Number(midiNote) : 60;
    const rootHz = 440 * Math.pow(2, (midi - 69) / 12);

    const duration = preset.kind === "felt" ? 0.11 : 0.045;
    const source = ctx.createBufferSource();
    source.buffer = makeNoiseBuffer(ctx, duration, presetIndex, midi);

    const hp = ctx.createBiquadFilter();
    const lp = ctx.createBiquadFilter();
    const transientGain = ctx.createGain();

    hp.type = "highpass";
    lp.type = "lowpass";
    hp.Q.value = 0.55;
    lp.Q.value = 0.55;

    if (preset.kind === "felt") {
      // Soft key/cloth contact: broad low-mid noise with a rounded onset.
      hp.frequency.value = 110;
      lp.frequency.value = 1900;
      const peak = amount * 0.34;
      // Felt contact begins at note-on. Start partially open so the contact is
      // present on the first audible sample, then round into a soft peak.
      transientGain.gain.setValueAtTime(Math.max(0.0001, peak), now);
      transientGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    } else {
      // Mechanical hammer contact: bright noise plus an extremely short wooden
      // knock. The partials die before they can ring like a bell.
      hp.frequency.value = 950;
      lp.frequency.value = 9000;
      const peak = amount * 0.42;
      // Hammer contact begins at note-on with no fade-in. A microscopic ramp
      // prevents a digital discontinuity without delaying the perceived hit.
      transientGain.gain.setValueAtTime(Math.max(0.0001, peak), now);
      transientGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      const knock = ctx.createOscillator();
      const knockGain = ctx.createGain();
      knock.type = "triangle";
      knock.frequency.setValueAtTime(Math.min(1800, Math.max(180, rootHz * 2.15)), now);
      knock.frequency.exponentialRampToValueAtTime(Math.min(1200, Math.max(120, rootHz * 1.55)), now + 0.018);
      knockGain.gain.setValueAtTime(amount * 0.12, now);
      knockGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.026);
      knock.connect(knockGain).connect(out);
      knock.start(now);
      knock.stop(now + 0.03);
    }

    source.connect(hp).connect(lp).connect(transientGain).connect(out);
    source.start(now);
    source.stop(now + duration);
    // Dedicated post-effects transient bus: Felt/Hammer intentionally bypass creative effects.
    return { mainBus: inputNode, postEffectsBus: out, node: inputNode, postFxNode: out };
  }

  const macroLength =
    typeof AmpEnvelopeEngine?.computeLength === "function"
      ? AmpEnvelopeEngine.computeLength(envelopeParams || {})
      : noteLength;
  const duration = Math.max(0.1, macroLength + 0.15);
  const source = ctx.createBufferSource();
  source.buffer = makeNoiseBuffer(ctx, duration, presetIndex, midiNote);

  const hp = ctx.createBiquadFilter();
  const lp = ctx.createBiquadFilter();
  hp.type = "highpass";
  lp.type = "lowpass";
  hp.Q.value = lp.Q.value = 0.45;
  hp.frequency.value = preset.kind === "air" ? 1800 : preset.kind === "breath" ? 550 : 90;
  lp.frequency.value = preset.kind === "felt" ? 2600 : preset.kind === "hammer" ? 5200 : preset.kind === "air" ? 12000 : 7600;

  const env = ctx.createGain();
  const now = ctx.currentTime;
  const peak = amount * 0.105;
  const macroDuration = scheduleTextureMacroEnvelope(
    env.gain,
    now,
    envelopeParams,
    peak,
  );

  if (preset.motion) {
    const lfo = ctx.createOscillator();
    const depth = ctx.createGain();
    lfo.frequency.value = preset.kind === "breath" ? 0.55 : 0.23;
    depth.gain.value = peak * preset.motion;
    lfo.connect(depth).connect(env.gain);
    lfo.start(now);
    lfo.stop(now + duration);
  }

  source.connect(hp).connect(lp).connect(env);
  source.start(now);
  source.stop(now + duration);

  const out = ctx.createGain();
  inputNode.connect(out);
  env.connect(out);
  return { mainBus: out, node: out };
};
