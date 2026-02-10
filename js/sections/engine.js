window.initEngineSelector = function () {
  UI.bindButtonGroup(".engine-btn", btn => {
    P.engine = btn.dataset.engine;

    document.querySelectorAll(".engine-panel").forEach(panel => {
      panel.classList.toggle("active", panel.id === "engine-" + P.engine);
    });
  });
};
