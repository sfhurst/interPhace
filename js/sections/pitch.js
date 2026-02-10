window.initPitchSection = function () {
  UI.bindSlider("rootNote", "rootNoteValue", v => {
    P.midiNote = v;
    return midiToName(v) + " (" + v + ")";
  });
};
