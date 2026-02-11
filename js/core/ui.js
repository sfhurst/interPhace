window.UI = {};

UI.bindSlider = function (sliderId, valueId, formatFn) {
  const slider = document.getElementById(sliderId);
  const value = document.getElementById(valueId);

  const update = () => {
    const v = Number(slider.value);
    value.textContent = formatFn ? formatFn(v) : v;
  };

  slider.addEventListener("input", update);
  update();
};

UI.bindButtonGroup = function (selector, callback) {
  const buttons = document.querySelectorAll(selector);

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      callback(btn);
    });
  });
};

// ============================================================
//  UI → PARAMS
// ============================================================

window.updateParamsFromHTML = function () {
  P.midiNote = Number(document.getElementById("rootNote").value);

  P.attack1 = Number(document.getElementById("attack1").value);
  P.hold1 = Number(document.getElementById("hold1").value);
  P.decay1 = Number(document.getElementById("decay1").value);
  P.decay1Target = Number(document.getElementById("decay1Target").value) / 100;
  P.hold2 = Number(document.getElementById("hold2").value);
  P.decay2 = Number(document.getElementById("decay2").value);

  P.renderDuration = Number(document.getElementById("renderDuration").value);
};

window.initOctaveButtons = function () {
  const groups = document.querySelectorAll(".oct-row");
  groups.forEach(group => {
    const modIndex = Number(group.getAttribute("data-mod")) - 1;
    if (modIndex < 0) return; // skip unison row

    group.addEventListener("click", e => {
      if (!(e.target instanceof HTMLButtonElement)) return;
      const oct = Number(e.target.getAttribute("data-oct"));
      P.modulators[modIndex].octave = oct;

      group.querySelectorAll(".oct-btn").forEach(btn => btn.classList.toggle("active", btn === e.target));
    });
  });
};

// ACCORDION

window.initAccordion = function () {
  const panels = document.querySelectorAll(".panel");

  panels.forEach(panel => {
    const header = panel.querySelector(".panel-header");

    // Toggle open/closed individually
    header.addEventListener("click", () => {
      panel.classList.toggle("open");
    });

    // Start all panels open
    panel.classList.add("open");
  });
};

// SYNTH SELECTOR

window.initEngineSelector = function () {
  UI.bindButtonGroup(".engine-btn", btn => {
    P.engine = btn.dataset.engine;

    document.querySelectorAll(".engine-panel").forEach(panel => {
      panel.classList.toggle("active", panel.id === "engine-" + P.engine);
    });
  });
};

// Sample Rate Buttons

window.initSampleRateButtons = function () {
  const row = document.getElementById("sampleRateRow");
  const buttons = row.querySelectorAll(".oct-btn");

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const sr = Number(btn.dataset.sr);
      P.sampleRate = sr;

      const span = document.getElementById("sampleRateValue");
      if (span) span.textContent = sr;
    });
  });
};
