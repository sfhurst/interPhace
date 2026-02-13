// ============================================================
//  RENDER ENGINE
// ============================================================
// - Not part of patch; it decides what to do WITH patch
// - Creates AudioContext
// - Calls synth engine
// - Calls envelope engine
// - Calls effects engine(s)
// - Connects to destination
// - Handles start/stop/timeout
// - Owns the audition button
// ============================================================

window.RenderEngine = {};
window.activePlayback = null;

// ------------------------------------------------------------
//  RENDER UI (sample rate + duration)
// ------------------------------------------------------------

RenderEngine.initRenderUI = function (patch) {
  initSampleRateUI(patch);
  initRenderDurationUI(patch);
};

function initSampleRateUI(patch) {
  const row = document.getElementById("sampleRateRow");
  if (!row) return;

  const buttons = row.querySelectorAll(".ratio-btn");

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      patch.sampleRate = Number(btn.dataset.sr);

      const span = document.getElementById("sampleRateValue");
      if (span) span.textContent = patch.sampleRate;
    });
  });
}

function initRenderDurationUI(patch) {
  UI.bindSlider("renderDuration", "renderDurationValue", v => {
    patch.renderDuration = Number(v);
    return formatSeconds(v);
  });
}

// ------------------------------------------------------------
//  PLAYBACK UI (start/stop button)
// ------------------------------------------------------------

RenderEngine.initPlaybackUI = function (patch) {
  const playBtn = document.getElementById("play");
  if (!playBtn) return;

  playBtn.addEventListener("click", () => {
    if (window.activePlayback) {
      RenderEngine.stop();
    } else {
      window.activePlayback = RenderEngine.startFromPatch(patch);
    }
  });
};

// ------------------------------------------------------------
//  START FROM PATCH (main render pipeline)
// ------------------------------------------------------------

RenderEngine.startFromPatch = function (patch) {
  updateParamsFromHTML();

  // Create audio context
  const ctx = new AudioContext({
    sampleRate: patch.sampleRate,
  });

  const baseFreq = midiToFreq(patch.midiNote);

  // --------------------------------------------------------
  // 1) SYNTH ENGINE (exactly one active)
  // --------------------------------------------------------

  let synthNode = null;

  switch (patch.engine) {
    case "fm":
    default: {
      const fmParams = patch.synth.fm;
      // We need noteLength for FMEngine.build, so compute envelope first
      const dummyEnv = AmpEnvelopeEngine.apply(ctx, ctx.createGain(), patch.envelope.ahdhd);
      const noteLength = dummyEnv.noteLength;

      const fmOut = FMEngine.build(ctx, baseFreq, fmParams, noteLength);
      synthNode = fmOut.node;
      break;
    }
  }

  // --------------------------------------------------------
  // 2) ENVELOPE ENGINE (exactly one active)
  // --------------------------------------------------------

  let envNode = null;

  switch (patch.envEngine) {
    case "ahdhd":
    default: {
      const envParams = patch.envelope.ahdhd;
      const envOut = AmpEnvelopeEngine.apply(ctx, synthNode, envParams);
      envNode = envOut.node;
      var noteLength = envOut.noteLength; // used later
      break;
    }
  }

  // --------------------------------------------------------
  // 3) EFFECTS ENGINE(S) (series)
  // --------------------------------------------------------

  const fxOut = EffectsEngine.applyAll(ctx, envNode, patch.fx, noteLength);
  let finalNode = fxOut.node;

  // --------------------------------------------------------
  // 4) OUTPUT → DESTINATION
  // --------------------------------------------------------

  const outGain = ctx.createGain();
  outGain.gain.value = 0.6;

  finalNode.connect(outGain).connect(ctx.destination);

  // --------------------------------------------------------
  // 5) NATURAL TIMEOUT CLEANUP
  // --------------------------------------------------------

  setTimeout(
    () => {
      ctx.close().catch(() => {});
      if (window.activePlayback && window.activePlayback.ctx === ctx) {
        window.activePlayback = null;
      }
    },
    (noteLength + 0.1) * 1000,
  );

  // --------------------------------------------------------
  // 6) RETURN PLAYBACK HANDLE
  // --------------------------------------------------------

  return {
    ctx,
    outGain,
    noteLength,
  };
};

// ------------------------------------------------------------
//  STOP (manual stop)
// ------------------------------------------------------------

RenderEngine.stop = function () {
  if (!window.activePlayback) return;

  const { ctx, outGain } = window.activePlayback;

  const now = ctx.currentTime;
  outGain.gain.cancelScheduledValues(now);
  outGain.gain.setValueAtTime(outGain.gain.value, now);
  outGain.gain.linearRampToValueAtTime(0, now + 0.5);

  setTimeout(() => {
    ctx.close().catch(() => {});
    if (window.activePlayback && window.activePlayback.ctx === ctx) {
      window.activePlayback = null;
    }
  }, 600);
};
