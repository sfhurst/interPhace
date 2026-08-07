# Personality Authoring

Instrument Behaviors and Characters each contain exactly 20 explicit events.
Every event declares an AHDHD phase and a normalized position within that phase.
All 20 events may legally occupy the same phase.

Factory profiles use the helpers in `js/data/personality-authoring.js`:

```js
instrumentEvent(1, "attack", 0.0, {
  volume: 1.2,
  brightness: 18000,
  pitch: 4,
})
```

Neutral fields may be omitted. The authoring helper expands them into complete,
immutable event records before the audio engine receives the profile.

Instrument events may control volume, pitch, brightness, motion, and lower/equal/
higher companion balance. Character events use the same phase timeline but have
character-specific neutral values and do not require companion fields.

The audio engine does not repair malformed factory data. `validate.js` must pass
before packaging a build.

## Zero-duration phases

The macro AHDHD envelope owns phase duration. If a phase duration is zero, all
personality events assigned to that phase resolve to the same absolute time.
They are not redistributed into another phase. During interpolation, the later
event wins at that instant. This is intentional compression of the behavior,
not missing data.

## Test bench profiles
Build 21 includes six temporary Instrument Behavior profiles for validating the event engine. `Test All` distributes events across the full AHDHD timeline. The five phase-isolated profiles place all 20 events in one named phase. Their exaggerated volume, pitch, and brightness curves are diagnostic, not intended as instrument voicing.
