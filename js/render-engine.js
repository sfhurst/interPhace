// ============================================================
//  RENDER ENGINE (UPDATED FOR STEREO OUTPUT)
// ============================================================
// - Creates persistent AudioContext for playback
// - Adds safety limiter to prevent clipping
// - Better error handling
// - Handles stereo output from effects chain
// ============================================================

window.RenderEngine = {};
window.activePlayback = null;

// Persistent playback context (reused for performance)
window.playbackContext = null;

// ------------------------------------------------------------
//  GET OR CREATE PLAYBACK CONTEXT
// ------------------------------------------------------------

function getPlaybackContext() {
  try {
    if (!window.playbackContext || window.playbackContext.state === 'closed') {
      window.playbackContext = new AudioContext({ sampleRate: 48000 });
      console.log('✅ Created new AudioContext');
    }
    
    if (window.playbackContext.state === 'suspended') {
      window.playbackContext.resume();
    }
    
    return window.playbackContext;
  } catch (err) {
    console.error('❌ Failed to create AudioContext:', err);
    throw new Error('Could not initialize audio. Check browser permissions.');
  }
}

// ------------------------------------------------------------
//  RENDER UI (sample rate + duration)
// ------------------------------------------------------------

RenderEngine.initRenderUI = function (patch) {
  initSampleRateUI(patch);
  initRenderDurationUI(patch);
  initRenderButton(patch);
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
      
      // Clear reverb cache when sample rate changes
      if (typeof EffectsEngine !== 'undefined' && EffectsEngine.clearCache) {
        EffectsEngine.clearCache();
      }
    });
  });
}

function initRenderDurationUI(patch) {
  UI.bindSlider("renderDuration", "renderDurationValue", v => {
    patch.renderDuration = Number(v);
    return formatSeconds(v);
  });
}

function initRenderButton(patch) {
  const renderBtn = document.getElementById("render");
  if (!renderBtn) return;

  renderBtn.addEventListener("click", () => {
    try {
      alert("WAV rendering will be implemented in the next update! For now, use the Audition button to preview your sound.");
    } catch (err) {
      console.error("Render error:", err);
      alert("Failed to render audio.");
    }
  });
}

// ------------------------------------------------------------
//  PLAYBACK UI (start/stop button)
// ------------------------------------------------------------

RenderEngine.initPlaybackUI = function (patch) {
  const playBtn = document.getElementById("play");
  if (!playBtn) return;

  playBtn.addEventListener("click", () => {
    try {
      if (window.activePlayback) {
        RenderEngine.stop();
        playBtn.textContent = "Audition";
        playBtn.classList.remove("playing");
      } else {
        window.activePlayback = RenderEngine.startFromPatch(patch);
        playBtn.textContent = "Stop";
        playBtn.classList.add("playing");
      }
    } catch (err) {
      console.error("Playback error:", err);
      alert("Failed to start playback. Please try again.");
      playBtn.textContent = "Audition";
      playBtn.classList.remove("playing");
    }
  });
};

// ------------------------------------------------------------
//  START FROM PATCH (main render pipeline)
// ------------------------------------------------------------

RenderEngine.startFromPatch = function (patch) {
  updateParamsFromHTML();

  // Use persistent playback context (48kHz for performance)
  const ctx = getPlaybackContext();

  const baseFreq = midiToFreq(patch.midiNote);

  // --------------------------------------------------------
  // 1) COMPUTE ENVELOPE LENGTH FIRST (no dummy nodes)
  // --------------------------------------------------------
  
  const noteLength = AmpEnvelopeEngine.computeLength(patch.envelope.ahdhd);

  // --------------------------------------------------------
  // 2) SYNTH ENGINE (MONO output)
  // --------------------------------------------------------

  let synthNode = null;

  switch (patch.engine) {
    case "fm":
    default: {
      const fmParams = patch.synth.fm;
      const fmOut = FMEngine.build(ctx, baseFreq, fmParams, noteLength);
      synthNode = fmOut.node; // MONO
      break;
    }
  }

  // --------------------------------------------------------
  // 3) ENVELOPE ENGINE (mono input → mono output)
  // --------------------------------------------------------

  let envNode = null;

  switch (patch.envEngine) {
    case "ahdhd":
    default: {
      const envParams = patch.envelope.ahdhd;
      const envOut = AmpEnvelopeEngine.apply(ctx, synthNode, envParams);
      envNode = envOut.node;
      break;
    }
  }

  // --------------------------------------------------------
  // 4) FILTER ENGINE (mono input → mono output)
  // --------------------------------------------------------

  let filteredNode = envNode;

  if (typeof FilterEngine !== 'undefined' && patch.filter) {
    const filterOut = FilterEngine.apply(ctx, envNode, patch.filter);
    filteredNode = filterOut.node;
  }

  // --------------------------------------------------------
  // 5) EFFECTS ENGINE (MONO input → STEREO output)
  // --------------------------------------------------------
  // The effects engine:
  // - Converts mono to stereo via stereo width effect
  // - Routes through all effects in stereo
  // - Returns stereo output

  const fxOut = EffectsEngine.applyAll(ctx, filteredNode, patch.fx, noteLength);
  let finalNode = fxOut.node; // This is now STEREO (2 channels)

  // --------------------------------------------------------
  // 6) SAFETY LIMITER (stereo input → stereo output)
  // --------------------------------------------------------

  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -3;
  limiter.knee.value = 0;
  limiter.ratio.value = 20;
  limiter.attack.value = 0.001;
  limiter.release.value = 0.05;

  finalNode.connect(limiter);

  // --------------------------------------------------------
  // 6) OUTPUT → DESTINATION (stereo)
  // --------------------------------------------------------

  const outGain = ctx.createGain();
  outGain.gain.value = 0.9; // Boosted from 0.6 for louder output

  limiter.connect(outGain).connect(ctx.destination);

  // --------------------------------------------------------
  // 7) NATURAL TIMEOUT CLEANUP
  // --------------------------------------------------------

  const cleanupTimeout = setTimeout(
    () => {
      if (window.activePlayback && window.activePlayback.timeoutId === cleanupTimeout) {
        window.activePlayback = null;
        
        // Update button UI
        const playBtn = document.getElementById("play");
        if (playBtn) {
          playBtn.textContent = "Audition";
          playBtn.classList.remove("playing");
        }
      }
    },
    (noteLength + 0.1) * 1000,
  );

  // --------------------------------------------------------
  // 8) RETURN PLAYBACK HANDLE
  // --------------------------------------------------------

  return {
    ctx,
    outGain,
    noteLength,
    timeoutId: cleanupTimeout,
  };
};

// ------------------------------------------------------------
//  STOP (manual stop with fade-out)
// ------------------------------------------------------------

RenderEngine.stop = function () {
  if (!window.activePlayback) return;

  const { ctx, outGain, timeoutId } = window.activePlayback;

  // Cancel the automatic cleanup
  if (timeoutId) {
    clearTimeout(timeoutId);
  }

  // Fade out smoothly
  const now = ctx.currentTime;
  outGain.gain.cancelScheduledValues(now);
  outGain.gain.setValueAtTime(outGain.gain.value, now);
  outGain.gain.linearRampToValueAtTime(0, now + 0.3);

  // Clean up after fade
  setTimeout(() => {
    window.activePlayback = null;
  }, 350);
};
