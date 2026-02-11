window.initEnvelopePrimary = function () {
  const presets = document.querySelectorAll(".preset-btn");

  presets.forEach(btn => {
    btn.addEventListener("click", () => {
      presets.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      applyPreset(btn.dataset.env);
    });
  });

  bind("attack1");
  bind("hold1");
  bind("decay1");
  bind("hold2");
  bind("decay2");

  UI.bindSlider("decay1Target", "decay1TargetValue", v => {
    P.decay1Target = Number(v) / 100;
    return Math.round(v) + "%";
  });

  UI.bindSlider("spreadAmount", "spreadAmountValue", v => {
    // UI 0–100% → DSP 0.00–0.10 (original range)
    P.spreadAmount = Number(v);
    return Math.round(v) + "%";
  });

  UI.bindSlider("mod1Gain", "mod1GainValue", v => {
    P.modulators[0].gain = Math.pow(Number(v) / 100, 2) * 800;
    return Math.round(v) + "%";
  });

  UI.bindSlider("mod2Gain", "mod2GainValue", v => {
    P.modulators[1].gain = Math.pow(Number(v) / 100, 2) * 800;
    return Math.round(v) + "%";
  });

  UI.bindSlider("envMult", "envMultValue", v => {
    P.envMult = Number(v);
    return v + "×";
  });

  const envMultSlider = document.getElementById("envMult");

  envMultSlider.addEventListener("input", () => {
    P.envMult = Number(envMultSlider.value);

    // force all envelope displays to refresh using the new multiplier
    ["attack1", "hold1", "decay1", "hold2", "decay2"].forEach(id => {
      const span = document.getElementById(id + "Value");
      span.textContent = formatSeconds(P[id] * P.envMult);
    });
  });

  function applyPreset(name) {
    const map = {
      blip: { attack1: 0.005, hold1: 0, decay1: 0.15, decay1Target: 0, hold2: 0, decay2: 0 },
      piano: { attack1: 0.04, hold1: 0, decay1: 0.8, decay1Target: 0.1, hold2: 1.5, decay2: 0.9 },
      pad: { attack1: 0.2, hold1: 0.1, decay1: 1.5, decay1Target: 0.7, hold2: 0.5, decay2: 2 },
      drone: { attack1: 1, hold1: 2, decay1: 4, decay1Target: 1, hold2: 4, decay2: 4 },
    };

    const env = map[name];

    // slider max values
    const sliderMax = {
      attack1: 2,
      hold1: 6,
      decay1: 2,
      hold2: 6,
      decay2: 2,
    };

    // determine required multiplier
    let requiredMult = 1;

    for (const key in env) {
      if (sliderMax[key] !== undefined) {
        const target = env[key];
        const max = sliderMax[key];
        const needed = target / max;
        if (needed > requiredMult) requiredMult = needed;
      }
    }

    // apply multiplier
    P.envMult = requiredMult;
    const envMultSlider = document.getElementById("envMult");
    const envMultValue = document.getElementById("envMultValue");
    envMultSlider.value = requiredMult;
    envMultValue.textContent = requiredMult + "×";

    // apply preset values to sliders and UI
    for (const key in env) {
      const input = document.getElementById(key);
      const span = document.getElementById(key + "Value");

      if (input) {
        if (key === "decay1Target") {
          // percentage, not time
          input.value = env[key] * 100;
          P.decay1Target = env[key];
        } else {
          // time-based envelope values
          const sliderVal = env[key] / P.envMult;
          input.value = sliderVal;
          P[key] = sliderVal;
        }
      }

      if (span) {
        if (key === "decay1Target") {
          span.textContent = Math.round(env[key] * 100) + "%";
        } else {
          span.textContent = formatSeconds(env[key]); // real seconds
        }
      }
    }
  }

  // Load piano preset on startup
  applyPreset("piano");

  // Mark the piano button active
  document.querySelector('.preset-btn[data-env="piano"]')?.classList.add("active");

  function bind(id) {
    UI.bindSlider(id, id + "Value", v => {
      P[id] = Number(v);
      return formatSeconds(P[id] * P.envMult);
    });
  }
};
