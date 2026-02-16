// ============================================================
//  FILTER ENGINE (LP/HP + 3-BAND PARAMETRIC EQ)
// ============================================================

window.FilterEngine = {};

// ------------------------------------------------------------
//  FREQUENCY LOOKUP TABLES
// ------------------------------------------------------------

const LP_FREQ_PRESETS = [
  60, 80, 100, 125, 160, 200, 250, 315, 400, 500,
  630, 800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000,
  6300, 8000, 10000, 12500, 16000, 20000 // 25 = all through
];

const HP_FREQ_PRESETS = [
  20, 25, 31, 40, 50, 63, 80, 100, 125, 160,
  200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600,
  2000, 2500, 3150, 4000, 5000, 6300 // 0 = all through
];

// ------------------------------------------------------------
//  EQ FREQUENCY TABLES (MUSICALLY ALIGNED - 88 NOTES + HARMONICS)
// ------------------------------------------------------------

// 88 piano keys: A0 (27.5Hz) to C8 (4186Hz)
// Plus important harmonics up to G9 (12543Hz)

// Low range: A0 to B3 (27.5Hz - 247Hz) - 48 frequencies
const EQ_FREQ_LOW = [
  27.5, 29.14, 30.87, 32.7, 34.65, 36.71, 38.89, 41.2, 43.65, 46.25, 49, 51.91, 55, 58.27, 61.74,
  65.41, 69.3, 73.42, 77.78, 82.41, 87.31, 92.5, 98, 103.83, 110, 116.54, 123.47,
  130.81, 138.59, 146.83, 155.56, 164.81, 174.61, 185, 196, 207.65, 220, 233.08, 246.94,
  261.63, 277.18, 293.66, 311.13, 329.63, 349.23, 369.99, 392, 415.3
];

// Mid range: C4 to B6 (261Hz - 1976Hz) - 36 frequencies
const EQ_FREQ_MID = [
  261.63, 277.18, 293.66, 311.13, 329.63, 349.23, 369.99, 392, 415.3, 440, 466.16, 493.88,
  523.25, 554.37, 587.33, 622.25, 659.25, 698.46, 739.99, 783.99, 830.61, 880, 932.33, 987.77,
  1046.5, 1108.73, 1174.66, 1244.51, 1318.51, 1396.91, 1479.98, 1567.98, 1661.22, 1760, 1864.66, 1975.53
];

// High range: C7 to G9 (2093Hz - 12543Hz) - 32 frequencies
const EQ_FREQ_HIGH = [
  2093, 2217.46, 2349.32, 2489.02, 2637.02, 2793.83, 2959.96, 3135.96, 3322.44, 3520, 3729.31, 3951.07,
  4186.01, 4434.92, 4698.63, 4978.03, 5274.04, 5587.65, 5919.91, 6271.93, 6644.88, 7040, 7458.62, 7902.13,
  8372.02, 8869.84, 9397.27, 9956.06, 10548.08, 11175.3, 11839.82, 12543.85
];

// All range: Every octave + key harmonics (A0 to G9) - 60 frequencies
const EQ_FREQ_ALL = [
  27.5, 32.7, 36.71, 41.2, 43.65, 49, 55, 61.74, 65.41, 73.42, 82.41, 87.31, 98,
  110, 123.47, 130.81, 146.83, 164.81, 174.61, 196, 220, 246.94, 261.63, 293.66, 329.63, 349.23,
  392, 440, 493.88, 523.25, 587.33, 659.25, 698.46, 783.99, 880, 987.77, 1046.5, 1174.66, 1318.51,
  1396.91, 1567.98, 1760, 1975.53, 2093, 2349.32, 2637.02, 2793.83, 3135.96, 3520, 3951.07,
  4186.01, 4698.63, 5274.04, 5587.65, 6271.93, 7040, 7902.13, 8372.02, 9397.27, 10548.08, 11839.82, 12543.85
];

// Frequency range lookup
const EQ_FREQ_RANGES = {
  low: EQ_FREQ_LOW,
  mid: EQ_FREQ_MID,
  high: EQ_FREQ_HIGH,
  all: EQ_FREQ_ALL
};

// ------------------------------------------------------------
//  REGISTER DEFAULTS
// ------------------------------------------------------------

FilterEngine.register = function (patch) {
  patch.filter = {
    lpFreq: 25,  // Index 25 = 20kHz (all through)
    hpFreq: 0,   // Index 0 = 20Hz (all through)
    
    eq1: { freq: 18, gain: 0, q: 1.0, range: 'low' },   // 82.41Hz (E2 - bass guitar low E)
    eq2: { freq: 9, gain: 0, q: 1.0, range: 'mid' },    // 440Hz (A4 - concert pitch)
    eq3: { freq: 12, gain: 0, q: 1.0, range: 'high' },  // 4186Hz (C8 - top of piano)
    
    activeEQ: 'eq1', // Track which EQ tab is active
  };
};

// ------------------------------------------------------------
//  APPLY FILTERS
// ------------------------------------------------------------

FilterEngine.apply = function (ctx, inputNode, filterParams) {
  let currentNode = inputNode;

  // HIGH-PASS FILTER (removes lows)
  if (filterParams.hpFreq > 0) {
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = HP_FREQ_PRESETS[filterParams.hpFreq];
    hp.Q.value = 0.7;
    
    currentNode.connect(hp);
    currentNode = hp;
  }

  // LOW-PASS FILTER (removes highs)
  if (filterParams.lpFreq < 25) {
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = LP_FREQ_PRESETS[filterParams.lpFreq];
    lp.Q.value = 0.7;
    
    currentNode.connect(lp);
    currentNode = lp;
  }

  // Helper function to get frequency from range
  function getFrequency(eqParams) {
    const range = EQ_FREQ_RANGES[eqParams.range] || EQ_FREQ_RANGES.all;
    return range[eqParams.freq] || 1000;
  }

  // EQ BAND 1 (Low)
  if (Math.abs(filterParams.eq1.gain) > 0.1) {
    const eq1 = ctx.createBiquadFilter();
    eq1.type = "peaking";
    eq1.frequency.value = getFrequency(filterParams.eq1);
    eq1.Q.value = filterParams.eq1.q;
    eq1.gain.value = filterParams.eq1.gain;
    
    currentNode.connect(eq1);
    currentNode = eq1;
  }

  // EQ BAND 2 (Mid)
  if (Math.abs(filterParams.eq2.gain) > 0.1) {
    const eq2 = ctx.createBiquadFilter();
    eq2.type = "peaking";
    eq2.frequency.value = getFrequency(filterParams.eq2);
    eq2.Q.value = filterParams.eq2.q;
    eq2.gain.value = filterParams.eq2.gain;
    
    currentNode.connect(eq2);
    currentNode = eq2;
  }

  // EQ BAND 3 (High)
  if (Math.abs(filterParams.eq3.gain) > 0.1) {
    const eq3 = ctx.createBiquadFilter();
    eq3.type = "peaking";
    eq3.frequency.value = getFrequency(filterParams.eq3);
    eq3.Q.value = filterParams.eq3.q;
    eq3.gain.value = filterParams.eq3.gain;
    
    currentNode.connect(eq3);
    currentNode = eq3;
  }

  return { node: currentNode };
};

// ------------------------------------------------------------
//  UI BINDINGS
// ------------------------------------------------------------

FilterEngine.initUI = function (patch) {
  const filter = patch.filter;

  // LP FREQUENCY
  UI.bindSlider("lpFreq", "lpFreqValue", v => {
    filter.lpFreq = Number(v);
    const freq = LP_FREQ_PRESETS[v];
    return freq >= 1000 ? (freq/1000).toFixed(1) + "kHz" : freq + "Hz";
  });

  // HP FREQUENCY
  UI.bindSlider("hpFreq", "hpFreqValue", v => {
    filter.hpFreq = Number(v);
    const freq = HP_FREQ_PRESETS[v];
    return freq >= 1000 ? (freq/1000).toFixed(1) + "kHz" : freq + "Hz";
  });

  // ============================================================
  //  EQ BAND SELECTOR (like engine selector)
  // ============================================================

  const eqBandButtons = document.querySelectorAll('.eq-band-btn');
  const eqBandPanels = document.querySelectorAll('.eq-band-panel');

  eqBandButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const eqName = btn.dataset.eq;
      
      // Update active button
      eqBandButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Update active panel
      eqBandPanels.forEach(p => p.classList.remove('active'));
      document.getElementById(`eq-panel-${eqName}`)?.classList.add('active');
      
      // Store active EQ
      filter.activeEQ = eqName;
    });
  });

  // Initialize all three EQs (all active, but only one visible)
  initEQ('eq1', filter.eq1);
  initEQ('eq2', filter.eq2);
  initEQ('eq3', filter.eq3);

  function initEQ(eqName, eqParams) {
    // Range selector buttons (at bottom of each EQ)
    const panel = document.getElementById(`eq-panel-${eqName}`);
    const rangeRow = panel?.querySelector('.ratio-row');
    
    if (rangeRow) {
      rangeRow.addEventListener('click', e => {
        const btn = e.target.closest('button');
        if (!btn || !btn.hasAttribute('data-range')) return;

        const newRange = btn.dataset.range;
        eqParams.range = newRange;

        // Update active button
        rangeRow.querySelectorAll('.ratio-btn').forEach(b => 
          b.classList.toggle('active', b === btn)
        );

        // Reset freq to middle of new range
        const rangeFreqs = EQ_FREQ_RANGES[newRange];
        eqParams.freq = Math.floor(rangeFreqs.length / 2);

        // Update slider max
        const freqSlider = document.getElementById(`${eqName}Freq`);
        if (freqSlider) {
          freqSlider.max = rangeFreqs.length - 1;
          freqSlider.value = eqParams.freq;
        }

        // Update display
        updateFreqDisplay(eqName, eqParams);
      });
    }

    // Frequency slider
    const freqSlider = document.getElementById(`${eqName}Freq`);
    const freqValue = document.getElementById(`${eqName}FreqValue`);
    
    if (freqSlider && freqValue) {
      // Set initial max based on range
      const rangeFreqs = EQ_FREQ_RANGES[eqParams.range];
      freqSlider.max = rangeFreqs.length - 1;
      
      freqSlider.addEventListener('input', () => {
        eqParams.freq = Number(freqSlider.value);
        updateFreqDisplay(eqName, eqParams);
      });
      
      updateFreqDisplay(eqName, eqParams);
    }

    // Gain slider
    const gainSlider = document.getElementById(`${eqName}Gain`);
    const gainValue = document.getElementById(`${eqName}GainValue`);
    
    if (gainSlider && gainValue) {
      gainSlider.addEventListener('input', () => {
        eqParams.gain = Number(gainSlider.value);
        gainValue.textContent = (eqParams.gain > 0 ? '+' : '') + eqParams.gain + 'dB';
      });
      gainValue.textContent = (eqParams.gain > 0 ? '+' : '') + eqParams.gain + 'dB';
    }

    // Q slider
    const qSlider = document.getElementById(`${eqName}Q`);
    const qValue = document.getElementById(`${eqName}QValue`);
    
    if (qSlider && qValue) {
      qSlider.addEventListener('input', () => {
        eqParams.q = Number(qSlider.value);
        qValue.textContent = Number(eqParams.q).toFixed(1);
      });
      qValue.textContent = Number(eqParams.q).toFixed(1);
    }
  }

  function updateFreqDisplay(eqName, eqParams) {
    const freqValue = document.getElementById(`${eqName}FreqValue`);
    if (!freqValue) return;

    const rangeFreqs = EQ_FREQ_RANGES[eqParams.range];
    const freq = rangeFreqs[eqParams.freq] || 1000;
    
    // Convert frequency to note name
    const noteName = freqToNoteName(freq);
    
    const freqText = freq >= 1000 
      ? (freq/1000).toFixed(1) + 'kHz' 
      : Math.round(freq) + 'Hz';
    
    freqValue.textContent = `${freqText} (${noteName})`;
  }

  // Convert frequency to musical note name
  function freqToNoteName(freq) {
    const A4 = 440;
    const C0 = A4 * Math.pow(2, -4.75); // C0 = 16.35Hz
    
    const halfStepsFromC0 = Math.round(12 * Math.log2(freq / C0));
    const octave = Math.floor(halfStepsFromC0 / 12);
    const noteIndex = halfStepsFromC0 % 12;
    
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    return noteNames[noteIndex] + octave;
  }
};
