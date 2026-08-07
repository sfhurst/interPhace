// ============================================================
//  GLOBAL PATCH — AUTHORITATIVE SYNTH STATE
// ============================================================
// Engine modules register their owned defaults into this explicit rack shell.
(function () {
  function createDefaultPatch() {
    return {
      midiNote: 60,
      tempo: 120,
      sampleRate: 48000,
      renderDuration: 8.0,
      sampleStep: 3,
      sampleRange: 12,

      synth: { fm: {} },
      envelope: { ahdhd: {}, fmDepth: {}, filterEnv: {} },
      texture: { preset: 0, amount: 0 },
      filter: {},
      fx: {
        detune: {},
        chorus: {},
        reverb: {},
        delay: {},
      },
    };
  }

  window.PatchState = Object.freeze({ createDefaultPatch });
  window.patch = createDefaultPatch();
})();
