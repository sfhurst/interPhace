// ============================================================
//  PARAMETER BANK
// ============================================================

window.P = {
  midiNote: 60,

  spreadAmount: 0,
  spreadGain: 0.35,

  // envelope values will be set by applyPreset("piano")
  attack1: 0,
  hold1: 0,
  decay1: 0,
  decay1Target: 0,
  hold2: 0,
  decay2: 0,
  envMult: 1.0,

  modulators: [
    { octave: 0, gain: 0, wave: "sine" },
    { octave: 0, gain: 0, wave: "sine" },
  ],

  sampleRate: 192000,
  renderDuration: 8.0,

  engine: "fm",
};
