window.initRenderSection = function () {
  // UI.bindSlider("sampleRate", "sampleRateValue", v => {
  //   P.sampleRate = v;
  //   return v;
  // });

  UI.bindSlider("renderDuration", "renderDurationValue", v => {
    P.renderDuration = v;
    return v;
  });
};
