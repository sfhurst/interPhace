// ============================================================
//  SPREAD (Operator‑style: stable, no delay, no phase offset)
// ============================================================

if (P.spreadAmount > 0) {
  // UI 0–100% → DSP 0.00–0.10
  const amt = P.spreadAmount; // already scaled in your UI binding

  const left = offline.createOscillator();
  left.type = "sine";
  left.frequency.value = baseFreq * (1 - amt * 0.001);

  const right = offline.createOscillator();
  right.type = "sine";
  right.frequency.value = baseFreq * (1 + amt * 0.001);

  const leftPan = offline.createStereoPanner();
  leftPan.pan.value = -1;

  const rightPan = offline.createStereoPanner();
  rightPan.pan.value = 1;

  // FM applied identically to both oscillators
  mod1Gain.connect(left.frequency);
  mod1Gain.connect(right.frequency);

  left.connect(leftPan).connect(env);
  right.connect(rightPan).connect(env);

  left.start(0);
  right.start(0);

  left.stop(noteLength);
  right.stop(noteLength);
} else {
  const osc = offline.createOscillator();
  osc.type = "sine";
  osc.frequency.value = baseFreq;

  mod1Gain.connect(osc.frequency);

  osc.connect(env);
  osc.start(0);
  osc.stop(noteLength);
}
