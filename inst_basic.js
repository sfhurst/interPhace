const P = {
  // --- Root Note ---
  midiNote: 60, // 60 = C4. Change this to play any note.

  // --- Envelope (AHD) ---
  attack: 0.01, // Faster = sharper hammer. Slower = softer.
  hold: 0.04, // Longer = more sustain before decay.
  decay: 1.4, // Longer = more piano tail.

  // --- Unison ---
  voices: 2, // 1 = pure. 2 = gentle chorus. 4 = thick.
  detuneSpread: 5, // In cents. Higher = wider stereo beating.

  // --- FM Modulation ---
  fmRate: 5, // Hz. Lower = drift. Higher = vibrato-like.
  fmDepth: 0.8, // Hz deviation. Higher = brighter/edgier.

  // --- Tone Filter ---
  lpFreq: 2500, // Hz. Lower = darker/felt. Higher = brighter.
  lpQ: 0.7, // Resonance. Higher = more ring.

  // --- Chorus ---
  chorusDelay: 0.012, // Base delay time (seconds).
  chorusRate: 0.6, // LFO speed (Hz).
  chorusDepth: 0.0025, // Modulation depth. Higher = wobblier.

  // --- Reverb ---
  reverbSeconds: 2.2, // IR length. Higher = longer tail.
  reverbLPFreq: 3000, // Low-pass on reverb return.
  reverbLPQ: 0.5,

  // --- Mix ---
  dryLevel: 0.6, // Direct signal level.
  wetLevel: 0.5, // Reverb level.

  // --- Render Settings ---
  sampleRate: 96000, // Oversampling for cleaner sound.
  renderDuration: 3.0, // Total render time including reverb tail.
};
