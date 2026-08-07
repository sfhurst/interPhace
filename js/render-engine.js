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
      window.playbackContext = new AudioContext();
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
  initSampleMappingUI(patch);
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


function initSampleMappingUI(patch) {
  const bind = (rowId, attr, key, fallback) => {
    const row = document.getElementById(rowId);
    if (!row) return;
    row.addEventListener("click", (event) => {
      const button = event.target.closest(`button[${attr}]`);
      if (!button) return;
      row.querySelectorAll(".ratio-btn").forEach((b) => b.classList.toggle("active", b === button));
      patch[key] = Number(button.getAttribute(attr)) || fallback;
    });
  };
  patch.sampleStep = Number(patch.sampleStep) || 3;
  patch.sampleRange = Number(patch.sampleRange) || 12;
  bind("sampleStepRow", "data-step", "sampleStep", 3);
  bind("sampleRangeRow", "data-range-semitones", "sampleRange", 12);
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
//  RENDER SAMPLE PACK (25 chromatic notes)
// ------------------------------------------------------------

async function renderSamplePack(patch) {
  const rootMidi = Number(patch.midiNote);
  const range = Math.max(12, Math.min(36, Number(patch.sampleRange) || 12));
  const step = [1, 3, 6].includes(Number(patch.sampleStep)) ? Number(patch.sampleStep) : 3;
  const lowMidi = Math.max(0, rootMidi - range);
  const highMidi = Math.min(127, rootMidi + range);
  const roots = [];

  for (let midi = lowMidi; midi <= highMidi; midi += step) roots.push(midi);
  if (!roots.includes(rootMidi)) roots.push(rootMidi);
  if (!roots.includes(highMidi)) roots.push(highMidi);
  roots.sort((a, b) => a - b);

  const wavFiles = [];
  console.log(`🎹 Rendering ${roots.length} root samples...`);

  for (let i = 0; i < roots.length; i++) {
    const midi = roots[i];
    console.log(`Rendering ${i + 1}/${roots.length}: ${midiToName(midi)}`);
    const notePatch = createNotePatch(patch, midi);
    const wavBuffer = await renderNoteToWav(notePatch);
    wavFiles.push({
      midi,
      name: `${String(midi).padStart(3, "0")}_${midiToName(midi).replace("#", "s")}.wav`,
      data: wavBuffer,
    });
  }

  const zones = createKeyZones(roots, lowMidi, highMidi);
  await createAndDownloadZip(wavFiles, patch, zones);
}

function createKeyZones(roots, lowMidi, highMidi) {
  return roots.map((root, index) => {
    const previous = roots[index - 1];
    const next = roots[index + 1];
    const low = index === 0 ? lowMidi : Math.floor((previous + root) / 2) + 1;
    const high = index === roots.length - 1 ? highMidi : Math.floor((root + next) / 2);
    return { root, rootNote: midiToName(root), low, lowNote: midiToName(low), high, highNote: midiToName(high) };
  });
}

// ------------------------------------------------------------
//  CREATE SCALED PATCH
// ------------------------------------------------------------

function createNotePatch(originalPatch, targetMidi) {
  const notePatch = JSON.parse(JSON.stringify(originalPatch));
  notePatch.midiNote = targetMidi;

  // Remove legacy per-note scale fields from saved sessions.
  if (notePatch.synth?.fm?.modulators?.[0]) {
    delete notePatch.synth.fm.modulators[0].deviationScale;
  }
  if (notePatch.synth?.fm) {
    delete notePatch.synth.fm.fmDepthPresetScale;
  }

  return notePatch;
}

// ------------------------------------------------------------
//  RENDER NOTE TO WAV
// ------------------------------------------------------------

async function renderNoteToWav(patch) {
  const plan = RenderPlan.create(patch);
  const offlineCtx = new OfflineAudioContext(2, plan.frameCount, plan.sampleRate);
  const graph = GraphBuilder.build(offlineCtx, patch, plan, { masterMode: "float" });
  graph.node.connect(offlineCtx.destination);

  const renderedBuffer = await offlineCtx.startRendering();
  prepareRenderedBuffer(renderedBuffer);
  return audioBufferToWav(renderedBuffer);
}

function prepareRenderedBuffer(buffer, options = {}) {
  const targetDb = Number.isFinite(options.targetDb) ? options.targetDb : -1;
  const targetPeak = Math.pow(10, targetDb / 20);
  const channels = [];
  let peakBefore = 0;
  let clippedSamplesBefore = 0;
  let dcOffsetMaximum = 0;

  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const data = buffer.getChannelData(channel);
    channels.push(data);

    let mean = 0;
    for (let i = 0; i < data.length; i++) mean += data[i];
    mean /= Math.max(1, data.length);
    dcOffsetMaximum = Math.max(dcOffsetMaximum, Math.abs(mean));

    for (let i = 0; i < data.length; i++) {
      data[i] -= mean;
      const magnitude = Math.abs(data[i]);
      peakBefore = Math.max(peakBefore, magnitude);
      if (magnitude > 1) clippedSamplesBefore += 1;
    }
  }

  // Measure first. Only attenuate when the actual completed render exceeds
  // the requested output ceiling. Quiet sounds are never boosted.
  const appliedGain = peakBefore > targetPeak && peakBefore > 0
    ? targetPeak / peakBefore
    : 1;
  const fadeSamples = Math.min(
    Math.floor(buffer.sampleRate * 0.015),
    Math.floor(buffer.length / 2),
  );

  let peakAfter = 0;
  for (const data of channels) {
    for (let i = 0; i < data.length; i++) {
      data[i] *= appliedGain;
      peakAfter = Math.max(peakAfter, Math.abs(data[i]));
    }

    // Tiny ending fade prevents a click only when rendering truncates a tail.
    for (let i = 0; i < fadeSamples; i++) {
      const index = data.length - fadeSamples + i;
      data[index] *= 1 - i / Math.max(1, fadeSamples - 1);
    }
  }

  return {
    peakBefore,
    peakAfter,
    clippedSamplesBefore,
    dcOffsetMaximum,
    appliedGain,
    targetPeak,
  };
}

async function renderPatchToFloatBuffer(patch, sampleRate) {
  const plan = RenderPlan.create(patch, sampleRate, {
    fullNaturalDuration: true,
  });
  const offlineCtx = new OfflineAudioContext(2, plan.frameCount, plan.sampleRate);
  const graph = GraphBuilder.build(offlineCtx, patch, plan, { masterMode: "float" });
  graph.node.connect(offlineCtx.destination);
  const buffer = await offlineCtx.startRendering();
  const analysis = prepareRenderedBuffer(buffer, { targetDb: -1 });
  return { buffer, analysis, plan };
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
  let ditherState = 0x1a2b3c4d;
  const random = () => {
    ditherState = (ditherState * 1664525 + 1013904223) >>> 0;
    return ditherState / 4294967296;
  };

  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const sample = buffer.getChannelData(channel)[i];
      // Deterministic triangular dither before 16-bit quantization.
      const dither = (random() - random()) / 65536;
      const clamped = Math.max(-1, Math.min(1, sample + dither));
      const int16 = Math.round(clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff);
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

async function createAndDownloadZip(wavFiles, patch, zones) {
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

  const manifest = {
    format: "interPhace multisample",
    version: 2,
    rootMidi: patch.midiNote,
    rootNote: midiToName(patch.midiNote),
    lowMidi: zones[0].low,
    highMidi: zones[zones.length - 1].high,
    sampleStep: patch.sampleStep || 3,
    zones,
    sampleRate: patch.sampleRate,
    bitDepth: 16,
    renderedAt: new Date().toISOString(),
    patch: patch,
  };
  zip.file("interPhace-manifest.json", JSON.stringify(manifest, null, 2));

  const sfzRegions = zones.map((zone, index) =>
    `<region> sample=${wavFiles[index].name} key=${zone.root} lokey=${zone.low} hikey=${zone.high} pitch_keycenter=${zone.root}`
  ).join("\n");
  zip.file("interPhace.sfz", `// interPhace multisample mapping\n<group> ampeg_release=0.05\n${sfzRegions}\n`);

  const mapText = zones.map((zone, index) =>
    `${wavFiles[index].name}: ${zone.lowNote} (${zone.low}) through ${zone.highNote} (${zone.high}), root ${zone.rootNote} (${zone.root})`
  ).join("\n");
  zip.file("KEY-ZONES.txt", mapText + "\n");
  zip.file("README.txt", "interPhace multisample export\n\nWAV files are normalized 16-bit stereo PCM.\ninterPhace.sfz can be loaded by SFZ-compatible samplers.\nKEY-ZONES.txt lists the intended mapping for hardware samplers.\nThe JSON manifest contains the complete patch and zone data.\n");

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
  let auditionGeneration = 0;

  const setIdle = () => {
    playBtn.disabled = false;
    playBtn.textContent = "Audition";
    playBtn.classList.remove("playing");
  };

  const togglePlayback = async () => {
    if (window.activePlayback) {
      auditionGeneration += 1;
      RenderEngine.stop();
      setIdle();
      return;
    }

    const generation = ++auditionGeneration;
    try {
      playBtn.disabled = true;
      playBtn.textContent = "Rendering...";
      updateParamsFromHTML();

      const ctx = getPlaybackContext();
      const result = await renderPatchToFloatBuffer(patch, ctx.sampleRate);
      if (generation !== auditionGeneration) return;

      const source = ctx.createBufferSource();
      source.buffer = result.buffer;
      const outGain = ctx.createGain();
      outGain.gain.value = 1;
      source.connect(outGain);
      outGain.connect(ctx.destination);

      const playback = {
        ctx,
        source,
        outGain,
        analysis: result.analysis,
        stopped: false,
      };
      window.activePlayback = playback;

      source.addEventListener("ended", () => {
        if (window.activePlayback === playback) {
          window.activePlayback = null;
          setIdle();
        }
      });

      console.log("🎧 Float audition analysis", {
        peakBefore: result.analysis.peakBefore,
        clippedSamplesBefore: result.analysis.clippedSamplesBefore,
        appliedGain: result.analysis.appliedGain,
        peakAfter: result.analysis.peakAfter,
      });

      source.start();
      playBtn.disabled = false;
      playBtn.textContent = "Stop";
      playBtn.classList.add("playing");
    } catch (err) {
      console.error("Playback error:", err);
      window.activePlayback = null;
      setIdle();
      alert("Failed to render audition. Please try again.");
    }
  };

  playBtn.addEventListener("click", togglePlayback);
  const handleSpace = (event) => {
    if (event.code !== "Space") return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    if (event.type === "keyup") togglePlayback();
  };
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

  const plan = RenderPlan.create(patch, ctx.sampleRate);
  const graph = GraphBuilder.build(ctx, patch, plan);
  const finalNode = graph.node;
  const noteLength = graph.noteLength;
  const playbackTail = plan.effectsTail;

  finalNode.connect(ctx.destination);

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
    (noteLength + playbackTail + 0.1) * 1000,
  );

  // --------------------------------------------------------
  // 8) RETURN PLAYBACK HANDLE
  // --------------------------------------------------------

  return {
    ctx,
    outGain: finalNode,
    noteLength,
    timeoutId: cleanupTimeout,
  };
};

// ------------------------------------------------------------
//  STOP (manual stop with fade-out)
// ------------------------------------------------------------

RenderEngine.stop = function () {
  if (!window.activePlayback) return;

  const playback = window.activePlayback;
  const { ctx, outGain, source, timeoutId } = playback;
  if (timeoutId) clearTimeout(timeoutId);

  const now = ctx.currentTime;
  outGain.gain.cancelScheduledValues(now);
  outGain.gain.setValueAtTime(outGain.gain.value, now);
  outGain.gain.linearRampToValueAtTime(0, now + 0.08);
  playback.stopped = true;

  setTimeout(() => {
    try {
      if (source) source.stop();
    } catch (_) {}
    if (window.activePlayback === playback) window.activePlayback = null;
  }, 100);
};

