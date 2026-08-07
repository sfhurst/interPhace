// ============================================================
//  SESSION PERSISTENCE
// ============================================================
(function () {
  const STORAGE_KEY = "interphace_session";
  const SESSION_VERSION = 3;
  let autosaveTimer = 0;
  let suspended = false;

  function clonePatch(value) {
    if (typeof structuredClone === "function") return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
  }

  function captureSession() {
    return {
      version: SESSION_VERSION,
      timestamp: Date.now(),
      patch: clonePatch(window.patch),
      ui: {
        chordPreset: Number(document.getElementById("chordPreset")?.value || 0),
        filterPreset: Number(document.getElementById("filterPreset")?.value || 0),
      },
    };
  }

  function saveSession() {
    if (suspended) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(captureSession()));
    } catch (error) {
      console.error("Failed to save session:", error);
    }
  }

  function scheduleSave() {
    if (suspended) return;
    clearTimeout(autosaveTimer);
    autosaveTimer = window.setTimeout(saveSession, 180);
  }

  function migrateV2(session) {
    const migrated = window.PatchState.createDefaultPatch();
    migrated.midiNote = session.midiNote ?? migrated.midiNote;
    migrated.tempo = session.tempo ?? migrated.tempo;
    migrated.sampleRate = session.sampleRate ?? migrated.sampleRate;
    migrated.renderDuration = session.renderDuration ?? migrated.renderDuration;
    migrated.sampleStep = session.sampleStep ?? migrated.sampleStep;
    migrated.sampleRange = session.sampleRange ?? migrated.sampleRange;

    migrated.synth.fm = {
      carrierVolume: session.carrierVolume,
      harmonic1: { gain: session.harmonic1Gain, noteOffset: session.harmonic1Offset },
      harmonic2: { gain: session.harmonic2Gain, noteOffset: session.harmonic2Offset },
      modulators: [
        { gain: session.mod1Gain, ratio: session.mod1Ratio, wave: session.mod1Wave },
        { gain: session.mod2Gain, ratio: session.mod2Ratio, wave: session.mod2Wave },
      ],
      fmDepthPreset: session.fmDepthPreset,
    };

    migrated.envelope.ahdhd = {
      attack1: session.attack1,
      hold1: session.hold1,
      decay1: session.decay1,
      decay1Target: Number(session.decay1Target) > 1
        ? Number(session.decay1Target) / 100
        : session.decay1Target,
      hold2: session.hold2,
      decay2: session.decay2,
      envMult: session.envMult,
      instrumentBehavior: session.instrumentBehavior ?? 0,
      character: session.envelopeCharacter ?? session.envelopePersonality ?? 0,
    };

    migrated.filter = {
      lpFreq: session.lpFreq,
      hpFreq: session.hpFreq,
      eq1: { freq: session.eq1Freq, gain: session.eq1Gain, q: session.eq1Q, range: session.eq1Range || "low" },
      eq2: { freq: session.eq2Freq, gain: session.eq2Gain, q: session.eq2Q, range: session.eq2Range || "mid" },
      eq3: { freq: session.eq3Freq, gain: session.eq3Gain, q: session.eq3Q, range: session.eq3Range || "high" },
    };

    migrated.fx = {
      bitCrush: { preset: session.bitCrushPreset || 0 },
      stereoWidth: { preset: session.stereoWidthPreset },
      detune: { preset: session.detunePreset },
      chorus: { preset: session.chorusPreset },
      delay: { preset: session.delayPreset },
      reverb: { preset: session.reverbPreset },
      wetDryMix: session.wetDryMix,
      saturation: { preset: session.saturationPreset || 0 },
    };
    migrated.texture = { preset: session.texturePreset || 0, amount: session.textureAmount || 0 };

    return {
      version: SESSION_VERSION,
      timestamp: session.timestamp || Date.now(),
      patch: migrated,
      ui: { chordPreset: Number(session.chordPreset || 0) },
    };
  }

  function migrateSession(raw) {
    if (!raw || typeof raw !== "object") return null;
    if (raw.version === SESSION_VERSION && raw.patch) return raw;
    if (!raw.patch || raw.version === 2 || raw.version === undefined) return migrateV2(raw);
    return null;
  }

  function setSlider(id, value) {
    const slider = document.getElementById(id);
    if (!slider || value === undefined || value === null) return;
    slider.value = value;
    slider.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function setRatioButton(modIndex, ratio) {
    const row = document.querySelector(`.ratio-row[data-mod="${modIndex}"]`);
    const button = row && Array.from(row.querySelectorAll(".ratio-btn")).find(
      item => Number(item.dataset.ratio) === Number(ratio),
    );
    button?.click();
  }

  function setWaveButton(modIndex, wave) {
    const row = document.querySelector(`.wave-row[data-mod="${modIndex}"]`);
    const button = row && Array.from(row.querySelectorAll(".ratio-btn")).find(
      item => item.dataset.wave === wave,
    );
    button?.click();
  }

  function applyPatchToUI(savedPatch, ui = {}) {
    const fm = savedPatch.synth?.fm || {};
    const envelope = savedPatch.envelope?.ahdhd || {};
    const filter = savedPatch.filter || {};
    const fx = savedPatch.fx || {};
    const texture = savedPatch.texture || {};

    setSlider("rootNote", savedPatch.midiNote);
    setSlider("tempo", savedPatch.tempo);
    setSlider("carrierVolume", fm.carrierVolume);
    // Load the remembered harmonic preset first, then restore the exact saved
    // harmonic values. This preserves a custom voicing while retaining the
    // preset as its dimmable starting point.
    setSlider("chordPreset", ui.chordPreset ?? 0);
    setSlider("harmonic1Gain", fm.harmonic1?.gain);
    setSlider("harmonic1Offset", fm.harmonic1?.noteOffset);
    setSlider("harmonic2Gain", fm.harmonic2?.gain);
    setSlider("harmonic2Offset", fm.harmonic2?.noteOffset);
    setSlider("mod1Gain", fm.modulators?.[0]?.gain);
    setSlider("mod2Gain", fm.modulators?.[1]?.gain);
    setSlider("fmDepthPreset", fm.fmDepthPreset);
    setRatioButton(1, fm.modulators?.[0]?.ratio);
    setRatioButton(2, fm.modulators?.[1]?.ratio);
    setWaveButton(1, fm.modulators?.[0]?.wave);
    setWaveButton(2, fm.modulators?.[1]?.wave);

    setSlider("attack1", envelope.attack1);
    setSlider("hold1", envelope.hold1);
    setSlider("decay1", envelope.decay1);
    setSlider("decay1Target", Number(envelope.decay1Target) * 100);
    setSlider("hold2", envelope.hold2);
    setSlider("decay2", envelope.decay2);
    setSlider("envMult", envelope.envMult);
    setSlider("instrumentBehavior", envelope.instrumentBehavior ?? 0);
    setSlider("envelopeCharacter", envelope.character ?? 0);

    setSlider("filterPreset", ui.filterPreset ?? filter.preset ?? 0);
    setSlider("lpFreq", filter.lpFreq);
    setSlider("hpFreq", filter.hpFreq);
    [1, 2, 3].forEach(index => {
      const eq = filter[`eq${index}`] || {};
      const rangeButton = document.querySelector(
        `#eq${index}Range .ratio-btn[data-range="${eq.range}"]`,
      );
      rangeButton?.click();
      setSlider(`eq${index}Freq`, eq.freq);
      setSlider(`eq${index}Gain`, eq.gain);
      setSlider(`eq${index}Q`, eq.q);
    });
    requestAnimationFrame(() =>
      FilterController.updatePresetModifiedState?.()
    );

    setSlider("bitCrushPreset", fx.bitCrush?.preset);
    setSlider("stereoWidthPreset", fx.stereoWidth?.preset);
    setSlider("detunePreset", fx.detune?.preset);
    setSlider("chorusPreset", fx.chorus?.preset);
    setSlider("delayPreset", fx.delay?.preset);
    setSlider("reverbPreset", fx.reverb?.preset);
    setSlider("wetDryMix", fx.wetDryMix);
    setSlider("saturationPreset", fx.saturation?.preset);

    setSlider("texturePreset", texture.preset);
    setSlider("textureAmount", texture.amount);
    setSlider("renderDuration", savedPatch.renderDuration);
    document.querySelector(`[data-sr="${savedPatch.sampleRate}"]`)?.click();
    document.querySelector(`#sampleStepRow [data-step="${savedPatch.sampleStep || 3}"]`)?.click();
    document.querySelector(`#sampleRangeRow [data-range-semitones="${savedPatch.sampleRange || 12}"]`)?.click();
  }

  function loadSession() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      const session = migrateSession(JSON.parse(stored));
      if (!session) throw new Error("Unsupported session format");
      suspended = true;
      applyPatchToUI(session.patch, session.ui);
      suspended = false;
      saveSession();
    } catch (error) {
      suspended = false;
      console.error("Failed to load session:", error);
    }
  }

  function setupAutoSave() {
    document.addEventListener("input", event => {
      if (event.target?.type === "range") scheduleSave();
    });
    document.addEventListener("click", event => {
      if (event.target.closest(".ratio-btn, .preset-btn, .eq-band-btn")) scheduleSave();
    });
  }

  window.SessionManager = Object.freeze({ saveSession, loadSession, setupAutoSave });
  window.saveSession = saveSession;
  window.loadSession = loadSession;
  window.setupAutoSave = setupAutoSave;
})();
