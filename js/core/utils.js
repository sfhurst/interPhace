// ============================================================
//  UTILITIES
// ============================================================

window.bufferToWav = function (buffer) {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1;
  const bitDepth = 16;

  const samples = buffer.getChannelData(0);
  const length = samples.length * numChannels * 2 + 44;
  const bufferOut = new ArrayBuffer(length);
  const view = new DataView(bufferOut);

  writeString(view, 0, "RIFF");
  view.setUint32(4, length - 8, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, "data");
  view.setUint32(40, samples.length * numChannels * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    for (let c = 0; c < numChannels; c++) {
      let s = buffer.getChannelData(c)[i];
      s = Math.max(-1, Math.min(1, s));
      view.setInt16(offset, s * 0x7fff, true);
      offset += 2;
    }
  }
  return bufferOut;
};

window.writeString = function (view, offset, str) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
};

window.midiToFreq = function (m) {
  return 440 * Math.pow(2, (m - 69) / 12);
};

window.midiToName = function (m) {
  const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const note = names[m % 12];
  const octave = Math.floor(m / 12) - 1;
  return note + octave;
};

window.formatSeconds = function (v) {
  return Number(v).toFixed(3) + "s";
};
