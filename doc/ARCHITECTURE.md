# interPhace Current Architecture

interPhace is organized as a modular audio rack. `window.patch` is the authoritative synth state. UI controllers update the patch; audio modules read the patch; the rack graph builder connects module outputs.

## Rack order

1. FM Engine — creates the carrier, modulators, companions, and FM targets.
2. AHDHD Envelope — creates the continuous macro amplitude timeline.
3. Instrument Behavior — compiles 20 phase-positioned events into behavior curves.
4. Character — compiles a second independent 20-event modifier layer.
5. Filter — applies high-pass, low-pass, and EQ processing.
6. Texture — returns a main bus and, when required, a post-effects excitation bus.
7. Effects — applies detune, chorus, delay, reverb, width, and compression.
8. Master — combines buses, limits, trims, plays, or renders.

## Personality events

Every Instrument Behavior and Character is explicit data containing exactly 20 events. Each event owns an AHDHD phase, a normalized position inside that phase, and parameter values. No phase has a reserved event count. All 20 events may occupy one phase.

The personality engine converts phase-relative positions to note-relative times and interpolates continuous curves. Runtime rendering no longer converts legacy curve profiles. If a macro phase has zero duration, all events assigned to it collapse to the same instant; the last event at that instant wins and events are never redistributed.

## Application modules

- `js/app/state.js` — authoritative patch shape.
- `js/app/core-controls.js` — shared pitch, tempo, carrier, and harmonic controls.
- `js/app/preset-controller.js` — pitch preset loading and modified-state display.
- `js/app/envelope-controller.js` — AHDHD presets and personality selectors.
- `js/app/session-manager.js` — local persistence and restoration.
- `js/main.js` — startup coordinator only.

## Rack modules

- `js/rack/render-plan.js` — duration, tail, sample-rate, and frame planning.
- `js/rack/graph-builder.js` — connects modules without owning their DSP.
- Engine files own their own DSP and expose narrow public interfaces.

## Data modules

Pitch presets, envelope presets, chord presets, Instrument Behaviors, and Characters live in `js/data/`. Personality tuning should modify data files rather than engine code.

## Personality data

Instrument Behavior and Character factory profiles are authored with compact
helpers but expand immediately into immutable, complete 20-event records. The
audio engine consumes those validated records directly. Neutral fields are
schema-specific: Instrument brightness is a frequency ceiling; Character
brightness is a multiplier.
