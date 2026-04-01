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
    if (!window.playbackContext || window.playbackContext.state === "closed") {
      window.playbackContext = new AudioContext({ sampleRate: 48000 });
      console.log("✅ Created new AudioContext");
    }

    if (window.playbackContext.state === "suspended") {
      window.playbackContext.resume();
    }

    return window.playbackContext;
  } catch (err) {
    console.error("❌ Failed to create AudioContext:", err);
    throw new Error("Could not initialize audio. Check browser permissions.");
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

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      patch.sampleRate = Number(btn.dataset.sr);

      const span = document.getElementById("sampleRateValue");
      if (span) span.textContent = patch.sampleRate;

      // Clear reverb cache when sample rate changes
      if (typeof EffectsEngine !== "undefined" && EffectsEngine.clearCache) {
        EffectsEngine.clearCache();
      }
    });
  });
}

function initRenderDurationUI(patch) {
  UI.bindSlider("renderDuration", "renderDurationValue", (v) => {
    patch.renderDuration = Number(v);
    return formatSeconds(v);
  });
}

function initRenderButton(patch) {
  const renderBtn = document.getElementById("render");
  if (!renderBtn) return;

  renderBtn.addEventListener("click", async () => {
    try {
      renderBtn.disabled = true;
      renderBtn.textContent = "Rendering...";

      await renderSamplePack(patch);

      renderBtn.textContent = "Render";
      renderBtn.disabled = false;
    } catch (err) {
      console.error("Render error:", err);
      alert("Failed to render audio: " + err.message);
      renderBtn.textContent = "Render";
      renderBtn.disabled = false;
    }
  });
}

// ------------------------------------------------------------
//  RENDER SAMPLE PACK (25 notes with frequency scaling)
// ------------------------------------------------------------

async function renderSamplePack(patch) {
  const rootMidi = patch.midiNote;
  const rootFreq = midiToFreq(rootMidi);
  const k = 0.7; // Frequency scaling curve

  const wavFiles = [];
  const totalNotes = 25;
  let currentNote = 0;

  console.log(`🎹 Rendering ${totalNotes} notes...`);

  for (let midi = rootMidi - 12; midi <= rootMidi + 12; midi++) {
    currentNote++;
    const noteFreq = midiToFreq(midi);

    // INVERTED: High notes get LESS modulation, low notes get MORE
    const scaleFactor = Math.pow(rootFreq / noteFreq, k);

    console.log(
      `Rendering ${currentNote}/${totalNotes}: ${midiToName(midi)} (scale: ${scaleFactor.toFixed(3)})`,
    );

    // Create scaled patch for this note
    const scaledPatch = createScaledPatch(patch, midi, scaleFactor);

    // Render to WAV
    const wavBuffer = await renderNoteToWav(scaledPatch);

    wavFiles.push({
      name: `${midi}_${midiToName(midi)}.wav`,
      data: wavBuffer,
    });
  }

  console.log("✅ All notes rendered, creating ZIP...");

  // Create and download ZIP
  await createAndDownloadZip(wavFiles, patch);
}

// ------------------------------------------------------------
//  CREATE SCALED PATCH
// ------------------------------------------------------------

function createScaledPatch(originalPatch, targetMidi, scaleFactor) {
  // Deep clone the patch
  const scaled = JSON.parse(JSON.stringify(originalPatch));

  // Change the note
  scaled.midiNote = targetMidi;

  // DON'T scale mod1 gain (causes table overflow)
  // Instead, pass the scaleFactor to be applied to the deviation
  scaled.synth.fm.modulators[0].deviationScale = scaleFactor;

  // Scale FM depth (affects Mod1)
  scaled.synth.fm.fmDepthPresetScale = scaleFactor;

  // Mod2 stays unchanged (as requested)
  // Harmonics stay at same semitone offsets (automatic)

  return scaled;
}

// ------------------------------------------------------------
//  RENDER NOTE TO WAV
// ------------------------------------------------------------

async function renderNoteToWav(patch) {
  // Create offline context at specified sample rate
  const sampleRate = patch.sampleRate;
  const noteLength = AmpEnvelopeEngine.computeLength(patch.envelope.ahdhd);
  const duration = Math.min(noteLength + 0.5, patch.renderDuration); // Add 0.5s tail, cap at max duration

  const offlineCtx = new OfflineAudioContext(
    2,
    sampleRate * duration,
    sampleRate,
  );

  const baseFreq = midiToFreq(patch.midiNote);

  // Build FM synth
  let synthNode = null;
  let carrierNode = null;

  const fmParams = patch.synth.fm;
  const fmOut = FMEngine.build(offlineCtx, baseFreq, fmParams, noteLength);
  synthNode = fmOut.node;
  carrierNode = fmOut.carrier;

  // Apply envelope with personality
  const envParams = patch.envelope.ahdhd;
  const envOut = AmpEnvelopeEngine.apply(
    offlineCtx,
    synthNode,
    envParams,
    carrierNode,
    baseFreq,
  );
  let processedNode = envOut.node;

  // Apply filter
  if (patch.filter) {
    const filterOut = FilterEngine.apply(
      offlineCtx,
      processedNode,
      patch.filter,
    );
    processedNode = filterOut.node;
  }

  // Apply effects
  const fxOut = EffectsEngine.applyAll(
    offlineCtx,
    processedNode,
    patch.fx,
    noteLength,
  );
  processedNode = fxOut.node;

  // Output gain
  const outGain = offlineCtx.createGain();
  outGain.gain.value = 0.9;
  processedNode.connect(outGain);
  outGain.connect(offlineCtx.destination);

  // Render
  const renderedBuffer = await offlineCtx.startRendering();

  // Convert to WAV
  const wavBuffer = audioBufferToWav(renderedBuffer);

  return wavBuffer;
}

// ------------------------------------------------------------
//  AUDIO BUFFER TO WAV
// ------------------------------------------------------------

function audioBufferToWav(buffer) {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const data = [];
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const sample = buffer.getChannelData(channel)[i];
      // Clamp to [-1, 1]
      const clamped = Math.max(-1, Math.min(1, sample));
      // Convert to 16-bit PCM
      const int16 = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
      data.push(int16);
    }
  }

  const dataLength = data.length * bytesPerSample;
  const buffer_array = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer_array);

  // WAV header
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true); // byte rate
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataLength, true);

  // Write PCM data
  let offset = 44;
  for (let i = 0; i < data.length; i++) {
    view.setInt16(offset, data[i], true);
    offset += 2;
  }

  return buffer_array;
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// ------------------------------------------------------------
//  CREATE AND DOWNLOAD ZIP
// ------------------------------------------------------------

async function createAndDownloadZip(wavFiles, patch) {
  // Use JSZip library (we'll need to add this)
  // For now, implement a simple multi-file download
  // Or use a ZIP library

  // Check if JSZip is available
  if (typeof JSZip === "undefined") {
    // Fallback: download files individually
    console.warn("JSZip not available, downloading files individually");

    for (const file of wavFiles) {
      const blob = new Blob([file.data], { type: "audio/wav" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);

      // Small delay between downloads to avoid browser blocking
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    alert(`✅ Downloaded ${wavFiles.length} WAV files!`);
    return;
  }

  // Create ZIP with JSZip
  const zip = new JSZip();

  // Add all WAV files to ZIP
  for (const file of wavFiles) {
    zip.file(file.name, file.data);
  }

  // Generate ZIP file
  const zipBlob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  // Download ZIP
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement("a");
  a.href = url;

  // Generate filename from patch preset name if available
  const timestamp = new Date().toISOString().slice(0, 10);
  a.download = `interPhace_${midiToName(patch.midiNote)}_${timestamp}.zip`;

  a.click();
  URL.revokeObjectURL(url);

  alert(`✅ Rendered ${wavFiles.length} notes!\nDownloading ZIP...`);
}

// ------------------------------------------------------------
//  PLAYBACK UI (start/stop button)
// ------------------------------------------------------------

RenderEngine.initPlaybackUI = function (patch) {
  const playBtn = document.getElementById("play");
  if (!playBtn) return;
  const togglePlayback = () => {
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
  };
  playBtn.addEventListener("click", togglePlayback);
  const handleSpace = (e) => {
    if (e.code !== "Space") return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    // Only trigger on keydown so it doesn't fire twice
    if (e.type === "keyup") {
      togglePlayback();
    }
  };
  // Capture at the highest level, before anything else
  window.addEventListener("keydown", handleSpace, true);
  window.addEventListener("keyup", handleSpace, true);
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
  let carrierNode = null;

  switch (patch.engine) {
    case "fm":
    default: {
      const fmParams = patch.synth.fm;
      const fmOut = FMEngine.build(ctx, baseFreq, fmParams, noteLength);
      synthNode = fmOut.node; // MONO
      carrierNode = fmOut.carrier; // For personality pitch modulation
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
      const envOut = AmpEnvelopeEngine.apply(
        ctx,
        synthNode,
        envParams,
        carrierNode,
        baseFreq,
      );
      envNode = envOut.node;
      break;
    }
  }

  // --------------------------------------------------------
  // 4) FILTER ENGINE (mono input → mono output)
  // --------------------------------------------------------

  let filteredNode = envNode;

  if (typeof FilterEngine !== "undefined" && patch.filter) {
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
      if (
        window.activePlayback &&
        window.activePlayback.timeoutId === cleanupTimeout
      ) {
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
