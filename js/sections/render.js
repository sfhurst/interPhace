window.initRenderSection = function () {
  UI.bindSlider("renderDuration", "renderDurationValue", v => {
    P.renderDuration = v;
    return v;
  });
};
