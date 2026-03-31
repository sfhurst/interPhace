const P = {
  // --- Root Note ---
  midiNote: 60, // C4 (you can randomize this later for melodies)

  // --- Envelope (AHD) ---
  attack: 0.02, // slower attack = softer, felt-like
  hold: 0.03, // slightly shorter hold = more pluck
  decay: 2.0, // longer decay = dreamy tail

  // --- Unison ---
  voices: 2, // 2 voices = subtle stereo wobble
  detuneSpread: 8, // more detune = more tape-like drift

  // --- FM Modulation ---
  fmRate: 2.2, // slower = tape wow
  fmDepth: 0.4, // subtle wobble, not bright or metallic

  // --- Tone Filter ---
  lpFreq: 1600, // darker, muted highs (classic lofi)
  lpQ: 0.5, // smoother cutoff, no ringing

  // --- Chorus ---
  chorusDelay: 0.009, // shorter delay = softer chorus
  chorusRate: 0.3, // slow movement = tape flutter
  chorusDepth: 0.0018, // subtle shimmer, not seasick

  // --- Reverb ---
  reverbSeconds: 3.5, // longer, dreamy tail
  reverbLPFreq: 2200, // darker reverb = cozy room
  reverbLPQ: 0.4,

  // --- Mix ---
  dryLevel: 0.55, // slightly quieter dry signal
  wetLevel: 0.65, // more reverb = more lofi vibe

  // --- Render Settings ---
  sampleRate: 48000, // lower sample rate = softer, more lofi
  renderDuration: 4.0, // allow long reverb tail
};
