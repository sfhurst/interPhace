# Build 60

- Reserved stable vertical scrollbar space with `scrollbar-gutter: stable`.
- Prevents short sections such as Texture from changing the usable viewport width when opened.
- No audio, preset, or navigation behavior changes.

# Build 59 — Stable section anchoring

- Accordion sections now collapse/open immediately during navigation instead of animating their height.
- Section positioning is calculated on the next layout frame, after the previous section has collapsed and document geometry has settled.
- Newly opened section headers remain anchored directly below the sticky interPhace / Audition bar instead of being pulled upward by a collapsing section.
- Applies to Tab-driven opening, Page Up/Page Down section jumps, and mouse header opening.
- No audio-engine or preset changes.

# Build 58 — Section visibility below sticky header

- Section navigation now treats the sticky interPhace / Audition branding bar as reserved screen space.
- When a section opens from Tab, Page Up/Page Down, or a header click, its section header is positioned immediately below the sticky top bar instead of behind it.
- No audio-engine or preset changes.

# Build 57 — Section visibility navigation

- Opening a section now immediately positions its section header at the top of the viewport.
- Removed smooth/offset scrolling from accordion navigation so the active section is visible before its first control receives focus.
- Applies to Tab-driven auto-opening, Page Up/Page Down section jumps, and mouse header opening.
- No audio, preset, or effects changes.

# Build 56 — Keyboard Section Navigation

- Section headers are removed from the Tab order while remaining mouse-clickable.
- Tab and Shift+Tab move directly between controls; entering a control in another section automatically opens that section and closes the previous one.
- Page Down jumps to the next section, opens it, closes the previous section, and focuses its first control.
- Page Up does the same for the previous section.
- Page navigation stops at the first and last sections rather than wrapping.

# Build 55 — Pitch preset housekeeping

- Main Pitch presets now load Instrument Behavior = None.
- Main Pitch presets now load Character = None.
- Main Pitch presets now load FM Shape = Off.
- The three controls remain fully available for manual use and future preset/personality redesign.
- No other preset values or audio-engine behavior changed.

## Build 54 — Bit Crush integrated headroom

- Promotes the Build 53 headroom experiment into the Bit Crush preset engine.
- Adds `headroomDb` as a per-preset Bit Crush parameter.
- Removes the temporary visible Headroom Test slider and its session state.
- Keeps every Build 51 Bit Crush preset sonically unchanged for now with `headroomDb: 0`.
- Negative preset values can now impose a hard local ceiling immediately before quantization while the surrounding render remains 32-bit float.
- No preset redesign in this build; presets will be tuned one at a time afterward.

## Build 53 — Bit Crush headroom test

- Branched from the accepted centered-Render-button Build 51.
- Added a temporary Bit Crush Headroom Test control: Float, -3 dB, -6 dB, -12 dB, and -18 dB.
- Headroom modes insert a hard amplitude ceiling after each Bit Crush preset's drive/pre-filter stage and immediately before quantization.
- Float preserves Build 51 behavior exactly.
- Existing Bit Crush presets and all other effects remain unchanged.
- The surrounding offline render remains 32-bit float; this test only constrains the Bit Crush wet path.

# Build 51 — Render Button Alignment

- Centered the Render button horizontally so it visually aligns with the Audition button.
- Render remains at the bottom of the Render section.
- No DSP or other UI behavior changed.

# Build 51 — Effects Cleanup + Render Branding

- Removed the duplicate real-time limiter and .92 trim from EffectsEngine.
- EffectsEngine now returns only the completed creative effects signal.
- GraphBuilder remains the single owner of emergency real-time output protection.
- Offline audition/export behavior is unchanged and still uses measured float correction after rendering.
- Audited TextureEngine post-effects routing: Felt and Hammer remain the intentional dry note-on transient bypass; sustained textures stay in the main pre-effects bus.
- Added an explicit code comment documenting that Felt/Hammer bypass as intentional.
- Restyled the Render button to use the same button class as Audition for consistent branding.
- Render button remains in its existing location at the bottom of the Render section.
- No effect presets, effect order, texture sound, or normal float-path DSP changed.


# Build 50 — Expanded Saturation

- Preserved all 12 original Saturation presets.
- Added 18 new character presets spanning subtle soft saturation, tape, tube, console, transformer, diode, clipping, rectification, and fuzz behaviors.
- Saturation remains after Reverb and before the master Wet/Dry blend.
- Added an internal 12 Hz DC blocker to the saturated wet path so asymmetric/bias/rectified curves cannot pass unwanted DC downstream.
- New character presets use distinct transfer-curve families instead of only increasing the same tanh distortion.
- New presets include internal makeup compensation so character differences are less dominated by raw loudness changes.
- Original presets retain their existing transfer curve and drive behavior.
- Saturation remains stereo and completely self-contained.
- No Reverb, master Wet/Dry, or output-protection behavior changed.
- Total Saturation presets: 30.

# Build 49 — Expanded Reverb

- Preserved all 16 original Reverb presets.
- Added 16 new character presets across room, plate, hall, bright, dark, and ambient families.
- Reverb remains generated/deterministic convolution; no external impulse files were added.
- New presets can shape predelay, decay, damping, high/low filtering, early-reflection density, plate diffusion, ambient swell, and reverb-only stereo character.
- Reverb remains self-contained and does not alter Delay, Saturation, or any other stage.
- Offline tail calculation already follows preset predelay + impulse length and therefore remains correct for the expanded bank.
- Total Reverb presets: 32.

# Build 48 — Expanded Tempo-Synced Delay

- Preserved all 16 original Delay presets.
- Added 22 new presets across clean rhythmic, stereo-rhythm, character, dub, and ambient families.
- Delay timing remains driven exclusively by the Pitch-section Tempo slider through patch.tempo.
- Added independent left/right musical divisions for stereo rhythmic presets.
- Added controllable cross-feedback for stereo rhythmic patterns.
- Added repeat-only high/low filtering, drive, and soft saturation for character presets; upstream and downstream effects are untouched.
- Preserved traditional straight and ping-pong feedback modes.
- Updated offline tail calculation to account for independent left/right delay divisions.
- Delay remains entirely self-contained.
- Total Delay presets: 38.

# Build 47 — Expanded Chorus / Ensemble

- Preserved all 16 original Chorus presets.
- Added 12 ensemble-character presets: Double, Triple, Small Ensemble, String Ensemble, Dimension, Vintage, Liquid, Wide Ensemble, Cloud, Swim, Seasick, Melt.
- Chorus is explicitly responsible for the impression of multiple sources: Width answers where the sound is; Detune answers how perfectly tuned it is; Chorus answers how many sources it feels like.
- New ensemble presets use deterministic but unequal voice timing, modulation depth, rate, waveform, level, filtering, and stereo placement.
- Added per-preset internal wet/dry mix and ensemble voice counts.
- The center/source instrument remains anchored; generated chorus voices provide the movement and multiplicity.
- Chorus remains self-contained and does not alter Width, Detune, or any downstream effect.
- Slider now has exactly 28 positions.

# Build 46 — Expanded Detune

- Preserved all 16 original Detune presets.
- Added 9 experimental tuning-character presets: Static ±2, Static ±4, Asymmetric, Slightly Flat, Slightly Sharp, Slow Drift, Loose, Independent, Unstable.
- Detune's role is now explicitly tuning imperfection: Width answers where the sound is; Detune answers how perfectly tuned it is; Chorus remains responsible for the impression of multiple sources.
- New presets explore subtle fixed/asymmetric tuning bias and very slow independent pitch drift rather than adding chorus-like voices.
- Drift presets use different left/right rates plus a shallow secondary wander to reduce obvious periodic wobble.
- No Width, Chorus, or other effect DSP changed.
- Slider now has exactly 25 positions.

# Build 45 — Expanded Stereo Width (Corrected)

- Rebuilt from Build 44.
- Preserved all 16 original Stereo Width presets unchanged in the preset bank.
- Added 10 new spatial-character presets after the originals: Touch, Natural, High Wide, Airy, Split, Offset, Haas, Extra Wide, Huge, Upper Split.
- Total Stereo Width presets: 26.
- Original presets retain their established Haas-style processing.
- Removed only the obsolete fixed .78 predictive gain trim from the original Width path.
- New presets may use internal wet/dry, frequency-limited widening, complementary spectral differences, asymmetric offsets, and split-spectrum width.
- Stereo Width remains self-contained and does not alter Detune, Chorus, or any other effect.
- No Bit Crush or downstream effect DSP changed.


# Build 44 — Expanded Bit Crush Test Bank

- Expanded Bit Crush from 13 to 21 presets.
- Retained every Build 43 character preset.
- Added pure traditional bit-depth presets: 14-Bit, 12-Bit, 10-Bit, 8-Bit, and 6-Bit.
- Added isolated true sample-rate reduction presets: SR 1/2, SR 1/4, and SR 1/8.
- Added a conventional combined 8-Bit + SR preset.
- Diagnostic presets use 100% wet processing with neutral drive, filtering, and internal saturation so they isolate the named degradation process.
- The character bank remains self-contained and unchanged.
- Slider now has exactly 21 positions for 21 presets.
- No upstream Filter controls or downstream effects were changed.


# Build 43 — Sampler Character Bit Crush Bank

- Rebuilt Bit Crush as a self-contained sampler/old-digital character engine.
- New bank: Off, Sheen, Dust, 12-Bit, Sampler, 90s Rack, Boom Bap, Chopped, Lo-Fi Drum, Basement, Crushed, Destroyed, Obliterated.
- Presets internally combine input drive, pre-filtering, bit-depth reduction, true sample-rate reduction, saturation, post-filtering, and wet/dry.
- Left side stays subtle, middle presets emphasize character, right side becomes deliberately destructive.
- Bit Crush touches no upstream Filter controls and no downstream effects.
- Slider now has exactly 13 positions.
- No other effect DSP changed.

# Build 42 — Saturation UI Order Fix

- Moved the Saturation control directly below Reverb and above the master Wet/Dry Mix.
- UI order now matches DSP order: Reverb → Saturation → Wet/Dry.
- No DSP, preset values, routing, or output-protection behavior changed.


# Build 41 — Saturation Routing Fix

- Corrected the effects signal order to match the UI.
- Saturation now processes the wet effects chain immediately after Reverb.
- The master Wet/Dry blend now happens after Saturation.
- The dry reference remains the untouched shared stereo source.
- No saturation preset values, Bit Crush, Width, Detune, Chorus, Delay, Reverb, or output-protection behavior changed.


# Build 40a — Saturation Preset Hotfix

- Fixed main preset loading after removal of the creative compressor.
- Legacy preset-controller compressor writes are safely ignored when the compressor object no longer exists.
- Existing presets continue to load without recreating or enabling the removed compressor stage.
- Saturation remains the visible creative end-of-chain effect.
- No audio DSP or preset values were otherwise changed.


# Build 40 — Saturation Output Stage

- Replaced the visible Compressor control with a Saturation preset slider.
- Saturation now sits after the overall Wet/Dry blend so it reacts to the completed instrument and effects signal.
- Added 12 first-pass saturation presets: Off, Warm, Soft Tape, Tube, Console, Driven, Hot, Overdrive, Crunch, Burn, Fuzzed, Melt.
- Saturation uses stereo waveshaping with per-preset drive, wet mix, tone filtering, bias, and asymmetry.
- Early presets are intended as subtle density/harmonic coloration; later presets become progressively more obvious and destructive.
- Removed the creative compressor from the normal float-render signal path.
- Output protection remains separate and intentionally boring: measured float correction for audition/export, plus the existing real-time fallback limiter/trim.
- Session migration/restore now preserves Saturation preset state.
- No changes to Bit Crush, Stereo Width, Detune, Chorus, Delay, Reverb, overall Wet/Dry, or final measured float correction.


# Build 39 — Bit Crusher Complete

- Replaced the previous delay-based pseudo-hold with true sample-rate reduction.
- Bit Crush now repeats each captured sample for the preset hold count before taking the next sample.
- Sample-rate reduction is applied independently to left and right channels.
- Preserved Build 38 companded bit-depth quantization so long Attack envelopes remain connected to the crusher from the start.
- Preserved the existing Bit Crush preset order, bit depths, wet mixes, low-pass shaping, stereo entrance, and downstream routing.
- No Stereo Width, Detune, Chorus, Delay, Reverb, Wet/Dry, Compressor, or final float behavior changed.


# Build 38 — Bit Crush Attack Tracking

- Changed Bit Crush quantization to use gentle companding before quantization and expansion afterward.
- Quiet portions of long Attack envelopes now receive meaningful crusher resolution instead of sitting inside coarse full-scale quantization dead zones.
- The crusher remains active from sample one and should feel attached to Wash/Pad-style attacks rather than appearing later as level rises.
- Preset order, bit depths, mixes, filtering, stereo routing, and all other effects are unchanged.


# Build 37 — Stereo Effects Entry + Bit Crusher

- Effects now converts the mono instrument bus to stereo exactly once at the effects entrance.
- The same stereo source feeds both the dry reference path and the wet effects chain.
- Stereo Width no longer creates a second stereo copy internally.
- Added Bit Crush as the first wet effect, before Stereo Width.
- Added a 16-position Bit Crush preset slider from Off through increasingly heavy degradation.
- Early presets use higher bit depths, light wet mixes, and protective low-pass filtering for musical coloration.
- Later presets progressively lower bit depth, increase sample-hold style degradation, increase wet mix, and darken the result.
- Bit Crush processes both stereo channels independently while preserving the shared stereo source architecture.
- Session restore/migration now includes Bit Crush preset state.
- No changes to Stereo Width tuning, Detune, Chorus, Delay, Reverb, Wet/Dry, Compressor, or final float correction.


# Build 36 — Filter Preset Bank

- Added a Filter Preset slider controlling the complete filter state.
- Added 12 first-pass filter presets: Flat, Warm, Dark, Bright, Airy, Bass Focus, Mid Scoop, Presence, Soft, Telephone, Lo-Fi, Sub.
- Each preset controls Low Cut, High Cut, and all three EQ bands' range, frequency, gain, and Q.
- Manual changes to any owned filter control dim the loaded preset name.
- Returning the complete filter state to the loaded preset restores full brightness.
- Filter preset state is preserved across sessions while custom values restore correctly.
- Added stable IDs to the Low/Mid/High/All range rows and corrected session restoration of those buttons.
- Preset EQ boosts/cuts stay within the DSP engine's actual ±9 dB range.
- No filter DSP topology or downstream audio behavior changed.


# Build 35 — Full Envelope Audition

- Audition now renders the complete natural AHDHD envelope plus the calculated effects tail.
- The Render Duration control no longer truncates browser audition playback.
- Render Duration still limits sample-pack/WAV export for now; that lower UI section remains unchanged until its later deep dive.
- Measured 32-bit float analysis and final audition correction are unchanged.
- No envelope DSP, texture behavior, FM, filter, or effects sound changed.


# Build 34 — Texture Sustain Envelope

- Tape, Dust, Air, Breath, and Worn now follow only the macro Attack and Decay 2 stages.
- Sustained textures hold at their requested level through Hold 1, Decay 1, and Hold 2.
- This prevents sustained textures from dropping away earlier than the tonal body.
- Felt and Hammer remain unchanged as short note-on transients.
- No FM, filter, effects, source gain, or preset behavior changed.


# Build 33 — Texture Envelope Alignment

- Tape, Dust, Air, Breath, and Worn now follow the active AHDHD macro envelope instead of using a separate generic texture envelope.
- Their internal texture motion remains layered on top of the macro envelope.
- Felt and Hammer remain dedicated note-on transients outside the effects chain.
- Felt now starts at full transient peak at note-on and decays immediately.
- Hammer now starts at full transient peak at note-on and decays immediately.
- No effects, filter, FM, source-gain, or preset behavior changed.


# Build 32 — Texture Before Effects UI

- Moved the Texture panel above the Effects panel so the UI matches the actual signal path.
- The DSP graph was already Texture → Effects; no routing or audio behavior changed.
- Accordion persistence continues to use each section's existing data-section value.


# Build 31 — Persistent Section Accordion

- Only one main UI section can remain open at a time.
- Opening a section closes the previously open section.
- Clicking the currently open header closes it, allowing all sections to be closed.
- The open section is stored separately from patch data in localStorage.
- The saved section is restored on reload without forcing a page scroll.
- Keyboard focus entering a closed section opens it automatically.
- Manually opened or focus-opened sections scroll their headers near the top of the page.
- Scroll behavior respects reduced-motion preferences.
- No audio, patch, preset, filter, or effects behavior changed.


# Build 30 — Filter Slider Refresh

- EQ frequency slider fills now refresh immediately when a range button changes the slider value programmatically.
- Corrected outdated filter frequency-range comments to match the actual tables.
- No filter DSP, cutoff values, EQ behavior, routing, or sound changed.


# Build 29 — Balanced FM Ratio Bank

- Revised the 16 Ratio Presets to include Modulator 2 ratios below, equal to, and above Modulator 1.
- Added paired forward/reverse relationships so serial FM order can be auditioned directly.
- Kept exactly one slider position per ratio preset.
- Added the standard separator line immediately above the main Pitch Preset control.
- No FM amount scaling, waveform compensation, smoothing, FM Shape, source gain, envelope, or downstream audio behavior changed.


# Build 28 — FM Ratio Preset Bank

- Added a Ratio Preset slider below the two modulator blocks.
- Added 16 compact Pretty FM ratio combinations.
- Each slider position maps to exactly one preset.
- Presets control only Modulator 1 and Modulator 2 base ratios.
- Manual ratio-button changes dim the loaded preset name.
- Returning both ratios to the loaded preset restores full brightness.
- Preserved all Pretty FM scaling, modulation smoothing, wave behavior, and FM Shape behavior.
- No fine-ratio controls were added; fine movement remains reserved for the later FM Shape deep dive.


# Build 27 — Wave Selector Style Repair

- Restored the existing `ratio-btn` styling class to the Sine, Square, and Saw selector buttons.
- Retained `wave-btn` as the dedicated JavaScript behavior hook.
- No audio, FM scaling, modulation, or selector behavior changed.


# Build 26 — Pretty FM Cleanup

- Preserved Pretty FM keyboard scaling, waveform compensation, squared amount response, Mod 2 onset/release smoothing, and FM Shape behavior.
- Modulator 1 is no longer constructed when its effective amount is zero.
- Modulator 2 is no longer constructed when its effective amount is zero or Modulator 1 is inactive.
- Cleaned wave selector button classes and selection handling.
- Added FMEngine.inspect() and build inspection data for effective indices, deviations, keyboard scaling, and waveform compensation.
- Removed “(Primary)” from the Envelope heading.
- No intended audible changes when modulation is active.


# Build 20 — Personality Engine Readiness

- Removed the last live `env.personality` writes while retaining old preset migration reads.
- Invalid personality phases now throw instead of silently falling back to Hold 1.
- Neutral modulation-depth curves no longer create unused oscillator and gain nodes.
- Documented zero-duration phase compression: events collapse in place and the last event wins.
- Expanded validation to prevent legacy personality state from reappearing in the live patch.
- No personality values, UI appearance, rack order, or downstream engines were changed.

# Build 18 — Filter audit and modular cleanup

- Verified Low Cut and High Cut are connected in series.
- Confirmed Low Cut uses a high-pass biquad and High Cut uses a low-pass biquad.
- Preserved the existing 12 dB/octave slopes and all audible values.
- Split filter frequency tables into `js/data/filter-frequencies.js`.
- Split filter DOM bindings into `js/app/filter-controller.js`.
- Reduced `filter-engine.js` to DSP, defaults, and response inspection.
- Added strict ascending-table validation.
- Added `FilterEngine.describe()` and `FilterEngine.getCutFrequencies()` for audits.
- Expanded build validation to cover filter defaults and frequency tables.

# Build 16 — Programmatic Slider Fill Refresh

- Fixed slider fills not updating when values were changed by presets or other code.
- Added one shared `UI.refreshRangeFills()` method.
- Envelope presets now refresh every affected blue fill immediately.
- Pitch presets now refresh every affected blue fill immediately.
- Existing user-driven slider input and session restoration behavior remain unchanged.

# Build 15 — Slider Fill Housekeeping

- Effects preset sliders now fill blue from the left because their preset intensity increases left-to-right.
- Reduced the hollow-knob track separation to a subtle two-pixel gap instead of a percentage-based gap.
- Slider gaps now remain visually consistent across different control widths and recalculate on resize.
- Lowpass cutoff fills blue to the left, representing frequencies allowed below the cutoff.
- Highpass cutoff fills blue to the right, representing frequencies allowed above the cutoff.
- No audio, preset, personality, or control-value behavior changed.

# Build 12 — Five-pass code cleanup

- Extracted app state, display utilities, and UI binding helpers from main.js.
- Extracted pitch, chord, envelope, Instrument Behavior, and Character data into dedicated files.
- Added per-note resolved-event caching to the 20-event personality compiler.
- Removed archived source from the release package.
- Replaced the active architecture document with a concise current-state reference and preserved history separately.
- Added a lightweight personality-data validation script.
- Preserved the existing UI, presets, audio routing, and sound design.

# Build 06 — Felt/Hammer routing repair

- Confirmed Felt and Hammer were mixed before the complete effects chain.
- Added an isolated post-effects excitation bus for Felt and Hammer only.
- Their attacks now bypass delay, reverb, chorus, detune, stereo-width smearing, and effects compression.
- They still pass through the final safety limiter and output trim.
- Tape, Dust, Air, Breath, and Worn remain on their original texture path unchanged.
- Preserved the build 05 electric slider appearance.

## 04 — Isolated Felt and Hammer Repair

- Rolled texture processing back to build 02 before making this repair.
- Restored Tape, Dust, Air, Breath, and Worn to their exact previous processing path.
- Added isolated early-return generators for Felt and Hammer so they cannot alter any other texture.
- Felt is now a rounded low-mid cloth/contact transient.
- Hammer is now a short bright mechanical contact with a non-ringing wooden knock.
- No shared texture filters, envelopes, or levels were changed.

# Changelog

## Character dial-in

- Reworked Tape, Cassette, and Worn so they no longer turn a sine into the same bell-like tone.
- Removed the shared heavy transient shaping from Tape and Cassette.
- Removed periodic pitch wobble and saturation from Worn.
- Replaced full-series waveshaping with subtle parallel saturation for Tape and Cassette only.
- Reduced wow, filter movement, noise, and brightness loss to restrained character levels.
- Left all other Character personalities and Instrument Behaviors unchanged.

# Phase 3 Character Wiring + Base Behavior

- Added **None** as the first Instrument Behavior for the untouched base AHDHD sound.
- Preserved built-in preset behavior choices by shifting their behavior indices.
- Rebuilt Character processing as audible, continuous modulation.
- Added character-specific volume curves, pitch movement, tonal filtering, brightness motion, gentle tape saturation, and low-level texture where appropriate.
- Character remains independent from FM Shape and does not modify FM amount.
- Instrument Behaviors remain unchanged except for the new None option.

# Phase 3 Instrument Behavior Rebuild

- Replaced the placeholder Instrument Behavior modifiers with fourteen distinct continuous behavior curve sets.
- Each behavior now controls volume evolution, pitch settling, brightness/filter movement, and independent lower/equal/higher companion evolution.
- Increased behavior range substantially so the selected physical behavior is plainly audible while still riding the user-defined AHDHD envelope.
- Left Character, FM Shape, Phases 4 and 5, effects, rendering, and preset selection logic unchanged.
- Instrument Behavior does not change AHDHD times and does not alter FM amount.

# Phase 3 preset bank and personality layout update

- Replaced the old synth preset bank with 24 presets built around the stabilized Phase 3 architecture.
- Added the Personalities section title.
- Moved AHDHD envelope presets directly below the envelope controls and above personalities.
- Envelope presets now change AHDHD timing only.
- Added 14 instrument behaviors and 13 character personalities.
- Replaced envelope shapes with Tick, Pluck, Strike, Short, Medium, Long, Pad, Drone, and Wash.

# interPhace rebuild — first pass

## Audio and rendering

- Live audition and offline export now use the same graph-building function.
- Removed duplicate per-note FM scaling during multisample export.
- Tempo-synced delay now reads the rendered patch tempo instead of live global state.
- Reverb impulses are deterministic, so the same patch renders consistently.
- Render duration now includes calculated delay and reverb tails, up to Maximum Duration.
- Export processing now removes DC offset, applies a short anti-click fade, normalizes to -1 dBFS, and uses deterministic triangular dither for 16-bit WAV output.
- Removed unreliable estimated compressor makeup gain.
- Harmonic layers are gain-compensated to reduce sudden level jumps.
- Added a JSON manifest to each multisample ZIP with root note, range, quality, and patch data.

## Reliability and defaults

- Default sample rate changed from 192 kHz to 48 kHz.
- Removed 176.4/192 kHz choices because they dramatically increased memory usage without useful benefit for M8 samples.
- Added defensive parameter fallbacks for FM depth presets.

## Pass 2 — Musical FM engine

- Rebuilt FM gain scaling around controlled modulation indices.
- Modulator 1 now acts as the primary tone/character operator.
- Modulator 2 now adds controlled motion and complexity to Modulator 1.
- Rebuilt all 21 FM shape presets as full-note modulation curves.
- Added gentler keyboard scaling so a multisample remains one coherent instrument.
- Added waveform compensation so square and saw modulators are usable at more slider positions.
- Added modulation fade-in/fade-out protection to reduce edge clicks.
- Improved harmonic-layer gain compensation.
- Renamed the visible FM controls for clearer intent while preserving all preset/session fields.

## Rebuild Pass 3 — Envelope and Personality

- Rebuilt the A-H-D-H-D amplitude envelope with safer zero-length stages and predictable timing.
- Preserved the second hold as sustain and the final decay as the rendered release.
- Rebuilt all ten personality presets as stage-aware modulation patterns.
- Personality can now move volume, carrier pitch, and FM intensity independently.
- FM personality movement is scaled to the actual Modulator 1 amount, preventing extreme jumps.
- Added modulation fades at stage boundaries to reduce clicks.
- Kept personality names and preset indices compatible with existing patches.

## Rebuild pass 4 — filter and effects
- Added a permanent subsonic/DC blocker before musical filtering.
- Clamped unsafe filter and EQ values while retaining saved-patch compatibility.
- Reduced LP/HP resonance so cutoff changes remain smooth and useful.
- Rebuilt stereo width with complementary decorrelation instead of one-sided Haas delay.
- Rebalanced detune and chorus into gradual, musically useful preset ranges.
- Rebuilt delay feedback routing and softened repeat tone.
- Rebuilt deterministic convolution reverb with controlled damping and low-frequency cleanup.
- Corrected serial effect gain buildup using equal-power dry/wet blends.
- Made the master wet/dry blend level-stable.
- Retuned compression and added a transparent final safety limiter.
- Preserved all existing controls, preset indexes, and session data fields.

## Rebuild Pass 5 — Texture and Multisample Mapping

- Added a deterministic texture engine with Clean, Tape, Dust, Air, Felt, Hammer, Breath, and Worn characters.
- Added one Texture Amount control with deliberately subtle gain scaling.
- Texture renders identically during audition and export.
- Added chromatic, minor-third, and tritone sample spacing.
- Added two-, four-, and six-octave keyboard ranges.
- Export now calculates root-sample key zones automatically.
- ZIP now includes an SFZ mapping, plain-text key-zone map, version 2 JSON manifest, and README.
- WAV filenames are sampler-safe and sorted by MIDI note.
- Preserved existing sessions; new controls use safe defaults when older sessions are loaded.

## Phase 3 stabilization
- Replaced stage-by-stage envelope scheduling with one precomputed continuous AHDHD curve.
- Precomputed the complete Attack/Hold 1/Decay 1/Hold 2/Decay 2 timeline before rendering.
- Replaced boundary-switched personality LFOs with continuous fade-in/fade-out modulation curves.
- Separated internal Instrument Behavior and Character modulation paths while preserving legacy personality preset compatibility.
- Removed all personality/character modulation from FM amount; FM Shape now owns the FM amount curve exclusively.
- Classified companion oscillators as lower/equal/higher and applied smooth gain ramps without FM processing.
- Preserved the existing filter, texture, effects, limiter, export, and rendering architecture.

- Added separate Phase 3 Instrument Behavior and Character sliders and wired both to presets/session storage.


## Phase 3 modulation timing variation

- Added smooth bounded wavelength variation to Drone Instrument Behavior motion.
- Added independent smooth wavelength variation to Warble gain, pitch, and brightness motion.
- Random timing is generated once per note and scheduled as continuous curves; no stepped or instantaneous changes.
- Changed the Init/default Instrument Behavior from Piano to None.
- Existing factory instrument presets retain their assigned behaviors.

## 2026-08-05 — Breathy character tuning
- Breathy noise now follows the completed tone envelope instead of a separate generic fade.
- Reduced exposed breath at the beginning and end of notes.
- Lowered breath level and movement slightly while preserving the character.

## 05 — Immediate strike textures and electric sliders

- Felt and Hammer now begin audibly at note-on instead of fading up from silence.
- Felt retains a rounded contact peak; Hammer reaches its peak essentially immediately.
- Restyled all range controls with thin electric tracks, hollow knobs, and a small break between active and inactive track portions.

## Build 07 — Phase-aware personality micro-envelope framework

- Added a shared 20-point micro-envelope framework to Instrument Behavior and Character.
- Every personality point is assigned to Attack, Hold 1, Decay 1, Hold 2, or Decay 2.
- Point distributions can be different for every personality; all distributions normalize to exactly 20 points.
- Micro points stretch and compress with the active AHDHD envelope instead of using fixed absolute times.
- Instrument framework now supports 20-point curves for volume, pitch, brightness, companion balance, and motion rate/depth.
- Character framework now supports 20-point curves for volume, pitch movement rate/depth, gain movement rate/depth, brightness, brightness-motion rate/depth, and tonal cutoff.
- Existing audible profiles are automatically converted into rough 20-point placeholders. They are not intended as final instrument or character voicing.
- Added read-only inspection hooks for future editing and debugging.
- No UI controls were added for individual micro points yet.

## 08 — Event-based personality framework

- Replaced the grouped 20-point personality representation with a flat 20-event model.
- Instrument Behavior and Character now use the same event compiler and renderer.
- Every event independently stores its AHDHD phase and normalized position within that phase.
- No phase has a required or reserved event count; all 20 events can occupy any one phase.
- Events are converted to absolute times only after the current AHDHD timeline is built.
- The engine sorts the resolved events and generates continuous parameter curves from them.
- Existing personality profiles are converted to rough version-2 events as placeholders.
- Added read-only inspection data for event phase positions and complete event records.

## Build 09 — FM engine housekeeping and envelope preset state

- Removed the unused synth engine selector buttons.
- Renamed the Engine panel heading to FM Engine.
- Added an Arp AHDHD preset between Tick and Pluck.
- Added live envelope preset matching.
- Manual AHDHD edits now clear the preset highlight and display Custom.
- Returning every AHDHD value, including time multiplier, to a preset's exact values restores that preset automatically.

## Build 10 — Pitch preset custom-state indicator
- The Pitch preset slider continues to show the last loaded factory preset.
- Changing any controlled slider or option displays `Custom` beneath the preset slider.
- Returning every setting to the loaded preset values removes `Custom` automatically.
- The envelope preset custom-state behavior remains unchanged.

## Build 11
- Removed the pitch preset "Custom" text label.
- The loaded pitch preset name now dims whenever any controlled setting differs from the loaded preset.
- The preset name returns to normal brightness when all settings match the loaded preset again.
- Removed the envelope "Custom" text label.
- When AHDHD settings match no envelope preset, all envelope preset buttons simply display in their normal unselected state.

## Build 13 — Modular Rack Refactor

- Split the former main controller into focused core, preset, envelope, session, and bootstrap modules.
- Reduced `main.js` to application startup coordination.
- Removed inactive multi-engine state and selector remnants; the current rack explicitly owns one FM source engine.
- Permanently converted all 15 Instrument Behaviors and 13 Characters to explicit 20-event records.
- Removed runtime legacy distribution, resampling, and curve-to-event conversion.
- Added strict event validation and malformed-profile rejection.
- Added a centralized render plan for note duration, effects tail, sample rate, and frame count.
- Added a rack graph builder with named main and post-effects buses.
- Preserved Felt/Hammer post-effects routing and all current DSP values.
- Live playback now uses the browser/device AudioContext sample rate rather than requesting a fixed 48 kHz context.
- Fixed restored Decay 1 Target values so normalized session data maps correctly to the percentage slider.
- Replaced the current architecture document with a concise rack-oriented reference.

## Build 17 — Cut filters and accelerated slider keys

- Renamed Highpass Frequency to Low Cut and placed it first.
- Renamed Lowpass Frequency to High Cut and placed it second.
- Low Cut starts fully left and visually shows the frequencies that remain to the right.
- High Cut starts fully right and visually shows the frequencies that remain to the left.
- Underlying high-pass and low-pass DSP behavior is unchanged.
- Added Shift+Arrow keyboard acceleration to every range slider.
- Arrow keys still move one native step; Shift+Arrow moves ten native steps.
- Sliders may override the fast multiplier later with `data-fast-steps`.

## Build 19 — Personality foundation cleanup

- Added compact personality authoring helpers while retaining exactly 20 explicit events per profile.
- Reduced Instrument Behavior data from 6,078 lines to 334 lines.
- Reduced Character data from 5,284 lines to 290 lines.
- Added separate neutral schemas for Instrument and Character events.
- Factory profiles are now deeply frozen after creation.
- Added shared audio math utilities for finite values, clamping, interpolation, and smoothstep.
- Removed the live legacy `personality` field and its preset write path.
- Removed runtime event normalization; validated factory events are consumed directly.
- Corrected the neutral Instrument Behavior brightness value to an open 22 kHz ceiling.
- Corrected personality-engine wiring so stored volume, brightness, pitch, motion, and companion micro-envelopes are applied directly rather than depending on obsolete top-level flags.
- Added an explicit default patch factory.
- Replaced flat session saves with version 3 patch snapshots.
- Added migration from the previous flat session format.
- Debounced autosave and suspended autosave during session restoration.
- Expanded validation for profile kind, event schema, immutability, phases, positions, IDs, scripts, and UI IDs.
- Effects, texture, rendering, JSZip, lower-page UI, filter DSP, and preset values were not refactored in this build.

## Build 21 — Personality Test Bench
- Added a broad Test All Instrument Behavior spanning all five AHDHD phases.
- Added five phase-isolated Instrument Behaviors: Test Attack, Test Hold 1, Test Decay 1, Test Hold 2, and Test Decay 2.
- Each test uses all 20 events with deliberately exaggerated volume, pitch, and brightness movement.
- Instrument Behavior slider range now derives from the profile list so future behaviors cannot exceed a stale HTML maximum.
- No existing personality values or downstream rack modules changed.

## Build 22 — Runtime recovery

- Fixed the global `clamp` declaration collision introduced by the shared audio math module.
- Scoped the carrier/personality engine internally while preserving `window.AmpEnvelopeEngine` as its public API.
- Restored successful personality-engine initialization and audio graph startup.
- Preserved Build 21 test personalities and all Build 17–21 UI/audio changes.
- Verified every JavaScript file individually and the complete browser script bundle in actual load order.

## Build 23 — measured 32-bit float audition

- Audition now renders the complete rack through `OfflineAudioContext` before playback.
- The offline graph bypasses the speculative final limiter and output trim.
- Completed float samples are measured for peak, DC offset, and samples above full scale.
- Output is attenuated only when the actual measured peak exceeds -1 dBFS; quiet sounds are not boosted.
- The corrected float `AudioBuffer` is then played in the browser.
- Removed speculative carrier/harmonic mixer normalization; source balance now follows the requested controls exactly.
- WAV rendering uses the same measured float correction path before quantization.

## Build 24 — unity source gains

- Removed the legacy 0.72 carrier gain multiplier. Carrier Volume 127 now maps to unity gain.
- Removed the legacy 0.42 harmonic gain multiplier. Harmonic gain 100% now maps to unity gain.
- Preserved the requested carrier/harmonic balance through 32-bit float rendering.
- Final audition and WAV peak correction remain measured after the completed render.
- No waveform, tuning, FM, envelope, personality, filter, texture, or effect values changed.

## Build 25 — Harmonic voicing bank and preset response

- Expanded the harmonic/chord preset bank from 33 interval-only entries to 47 deliberate three-oscillator voicings.
- Every harmonic preset now sets Harmonic 1 offset, Harmonic 1 gain, Harmonic 2 offset, and Harmonic 2 gain.
- Replaced sparse 0–100 lookup positions with contiguous preset indices.
- Chord Preset now has exactly one slider position per preset; every arrow press selects a different voicing.
- Added modified-state dimming to the chord preset name when any of its four controlled values changes.
- Returning all four harmonic values to the loaded voicing restores the preset name brightness.
- Fixed the main pitch preset delay when returning to Init by preventing the reset routine from recursively resetting and reloading the preset slider.
- Main pitch and chord preset names and slider positions now update immediately before applying the remaining controls.
- Session restore now loads the remembered harmonic preset first, then restores exact custom harmonic values so the preset can remain as a dimmed starting point.
- Added validation for harmonic preset count, contiguous indices, names, gains, offsets, and slider range.
