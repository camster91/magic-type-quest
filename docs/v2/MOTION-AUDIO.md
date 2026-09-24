# Motion and audio language (#164)

`CueDirector` maps typed cue IDs to one duration/easing token, optional audio ID, required final visual state and DOM announcement policy. Phaser owns the world effect and its tween; the DOM owns controls, text, live status and focus. No second animation library is used. A scene requests `cues.request(id, accessibleSummary)` through the shell/coordinator. The current BootScene is a fixture: F/J feedback makes a brief subtle habitat mark, and sequence completion leaves a visible planting spot. #167 replaces geometry with approved layered assets.

| Tier | Cue IDs | Duration/easing | Reduced motion | Information |
| --- | --- | --- | --- | --- |
| Ambient | `ambient.meadow` | 650 ms cycle / Sine | static rest | optional only; hidden tabs pause |
| Input | `input.correct`, `input.incorrect` | 90 ms / Sine | instant | target/feedback text remains in DOM; no per-key announcement flood |
| Sequence | `sequence.complete` | 220 ms / Cubic | 120 ms fade | final habitat action and DOM completion |
| Mission | `mission.restore`, `wildlife.arrival` | 650 ms / Cubic or Sine | 120 ms fade or static pose | restored stage/discovery plus DOM summary |
| Biome | `biome.milestone` | 1000 ms / Cubic | 120 ms fade | stage remains visible; DOM milestone |
| Navigation | `navigation.enter` | 220 ms / Sine | instant | DOM focus/navigation state |

Tokens in `MOTION_TOKENS`: `instant=0`, `input=90`, `short=220`, `medium=650`, `milestone=1000`, `reducedFade=120` ms. A cue applies its final state even if animation is skipped or the tab is hidden. Reduced motion removes large camera/parallax/particle movement, repeated bounce and obligatory waits. `CueDirector` listens for page visibility changes and pauses/resumes optional ambient work. The Phaser host kills only its own cue tween/graphics on scene shutdown; the director removes its listener and disposes audio on shell teardown. UI transitions remain CSS and respect the existing reduced-motion rule.

## Audio catalogue and controls

The [typed audio manifest](../../src/v2/audio/manifest.ts) reserves UI confirm/back, subtle correct key, gentle retry, sequence completion, restoration, discovery, biome milestone, and Meadow ambience IDs. Every row has category, source/licence/reference, duration, byte size, loop, preload group, normalization target (-22 LUFS initial), and a visual/DOM fallback. All rows remain `planned` with no file or duration; no soundtrack or licensed audio is included in #164. When sources are approved, use compressed WebM/Opus with a browser-tested Ogg or MP3 fallback and record exact measured bytes/durations/licence. An ordinary mistake never triggers sad/failure music or harsh tones.

`AudioCueService` starts no playback before an explicit browser gesture. Start Meadow and actual typing unlock the adapter; a rejected `play()` resolves harmlessly. Default levels are conservative: effects 15%, ambience 8%, master unmuted. Settings exposes **Mute all sound**, effects and ambience sliders. Their values are clamped and saved in the existing versioned local settings record; older v2 settings without volume fields use defaults. No sound is required to understand or finish a lesson. Planned assets are silent; visual change and DOM status work with mute, denied autoplay and missing media. Active effects are bounded and remove themselves on completion. Ambient media pauses when the tab is hidden and all media stops on disposal.

## Evidence and remaining production work

`npm run validate:cues` checks mapping, reduced motion, final states, hidden-tab behaviour, semantic independence, unlock/mute/volume, and cleanup. The browser suite tests trusted-gesture unlock and rejected playback, persistent controls, muted typing, and the [reduced-motion capture](evidence/reduced-motion-cue.webp). #165 measures cue/input latency under throttling; #167 supplies approved art and production audio only after provenance review. The current BootScene mark is a rendering fixture, not a completed Meadow mission or discovery.
