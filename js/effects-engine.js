// ============================================================
//  DETUNE EFFECT (POST-ENGINE STEREO WIDTH)
// ============================================================
// Takes the processed mono sound from an engine (carrier audio)
// and turns it into a stereo "detuned" image by duplicating and
// panning the signal. This is an effect, not part of FM.
// ============================================================

window.applyDetuneEffect = function (ctx, sourceNode, env, noteLength, detuneAmount) {
  // If detune is off, do nothing — engine's mono path is used as-is
  if (detuneAmount <= 0) return;

  const amt = detuneAmount;

  // Left/right gain taps from the same processed source
  const leftGain = ctx.createGain();
  const rightGain = ctx.createGain();

  // Slight level differences based on detuneAmount (subtle widening)
  const spread = amt * 0.002; // tiny variation
  leftGain.gain.value = 1 - spread;
  rightGain.gain.value = 1 + spread;

  const leftPan = ctx.createStereoPanner();
  leftPan.pan.value = -1;

  const rightPan = ctx.createStereoPanner();
  rightPan.pan.value = 1;

  // Tap the processed sound before it hits env (or from env if you prefer)
  sourceNode.connect(leftGain).connect(leftPan).connect(env);
  sourceNode.connect(rightGain).connect(rightPan).connect(env);

  // No extra start/stop needed — we’re just routing audio
  // Lifetime is tied to the sourceNode and env/noteLength
};
