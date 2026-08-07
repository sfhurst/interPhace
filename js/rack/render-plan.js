// Centralized duration and sample planning for live and offline rendering.
window.RenderPlan = {
  create(patch, sampleRateOverride, options = {}) {
    const noteLength = AmpEnvelopeEngine.computeLength(patch.envelope.ahdhd);
    const effectsTail = EffectsEngine.computeTail(patch.fx, patch.tempo);
    const requestedMaximum = Math.max(0.25, Number(patch.renderDuration) || 8);
    const naturalDuration = noteLength + effectsTail;

    // Audition should always play the complete sound. The Render Duration
    // control remains an export/sample-pack limit until that section is
    // revisited later.
    const duration = options.fullNaturalDuration
      ? naturalDuration
      : Math.min(naturalDuration, requestedMaximum);

    const sampleRate = Math.max(
      22050,
      Math.min(96000, Number(sampleRateOverride ?? patch.sampleRate) || 48000),
    );

    return {
      noteLength,
      effectsTail,
      naturalDuration,
      requestedMaximum,
      duration,
      sampleRate,
      frameCount: Math.max(1, Math.ceil(sampleRate * duration)),
    };
  },
};
