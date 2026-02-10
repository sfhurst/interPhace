// ============================================================
//  PARAMETER BANK
// ============================================================

window.P = {
  midiNote: 60,

  spreadAmount: 0.0,
  spreadGain: 0.35,

  attack1: 0.04,
  hold1: 0.0,
  decay1: 0.8,
  decay1Target: 0.1,
  hold2: 1.5,
  decay2: 0.9,

  modulators: [
    { octave: 0, gain: 0 },
    { octave: 0, gain: 0 },
  ],

  sampleRate: 192000,
  renderDuration: 8.0,

  engine: "fm",

  envMult: 1.0,
};
