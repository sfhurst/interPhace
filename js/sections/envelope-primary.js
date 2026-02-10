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
    P.spreadAmount = Number(v) / 100;
    return Math.round(v) + "%";
  });

  UI.bindSlider("mod1Gain", "mod1GainValue", v => {
    P.modulators[0].gain = Number(v) / 100;
    return Math.round(v) + "%";
  });

  UI.bindSlider("mod2Gain", "mod2GainValue", v => {
    P.modulators[0].gain = Number(v) / 100;
    return Math.round(v) + "%";
  });

  UI.bindSlider("envMult", "envMultValue", v => {
    P.envMult = Number(v);
    return v + "×";
  });

  function bind(id) {
    UI.bindSlider(id, id + "Value", v => {
      P[id] = Number(v);
      return formatSeconds(P[id] * P.envMult);
    });
  }

  function applyPreset(name) {
    const map = {
      blip: { attack1: 0.005, hold1: 0, decay1: 0.15, decay1Target: 0, hold2: 0, decay2: 0 },
      piano: { attack1: 0.04, hold1: 0, decay1: 0.8, decay1Target: 0.1, hold2: 1.5, decay2: 0.9 },
      pad: { attack1: 0.2, hold1: 0.1, decay1: 1.5, decay1Target: 0.7, hold2: 0.5, decay2: 2 },
      drone: { attack1: 1, hold1: 2, decay1: 4, decay1Target: 1, hold2: 4, decay2: 4 },
    };

    const env = map[name];
    Object.assign(P, env);

    for (const key in env) {
      const input = document.getElementById(key);
      const span = document.getElementById(key + "Value");

      if (input) input.value = env[key];
      if (span) {
        if (key === "decay1Target") span.textContent = Math.round(env[key] * 100) + "%";
        else span.textContent = formatSeconds(env[key] * P.envMult);
      }
    }
  }
};
