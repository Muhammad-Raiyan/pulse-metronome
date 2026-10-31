# TODO

---

## Open

### Song library data

- [ ] **Fix section data in `public/songs.json`.** All 19 songs with sections add up to 0:26–1:45 — far shorter than the real tracks. Use actual song structures (repeated verses, choruses, correct bar counts). The engine is correct; only the data needs fixing. Keep the 32-bar-per-step cap in mind.
- [ ] **Audit script.** A small script that prints each song's total bars and estimated duration would make bad entries easy to spot.

### Platform / testing

- [ ] **Browser smoke-test** — try Ramp, Sprint (both strategies), Mute and Song Map by hand, including changing a setting mid-play. `automation.test.js` doesn't cover React wiring.
- [ ] **Real-iPhone test** — silent switch, lock/unlock, incoming call/alarm, Safari tab, installed PWA.
- [ ] **iOS extras** — silent looping `<audio>` fallback for older iOS without `audioSession`; "Tap to resume audio" message; "Install on iPhone" hint.
- [ ] **Browser check for Song Map** — picking another song replaces the working copy without a confirmation prompt; row layout on a phone.

### Repository and tooling

- [ ] **Shrink PWA icons.** The 512 px PNGs are ~300 KB each; the precache is now ~1 MB. Try palette/quantised PNG compression.
- [ ] **README: icon steps.** `design/app-icon-source.jpg` is the source (not shipped); document how the PNGs in `public/` are generated from it.

### Features

- [ ] **Presets in `localStorage`** — named slots for BPM/meter/subdivision. Share the Export/Import flow with custom sequences so both can be backed up and moved between devices as JSON.
- [ ] **Export / import custom sequences** — download a JSON file; pick a file to import. Works alongside the presets item above.
- [ ] **Shareable links** — `?bpm=120&ts=7&sub=2` encodes the current manual state in the URL.
- [ ] **Tap tempo on mobile** — the current button is too small for live tapping; add a large full-width touch target.
- [ ] **Warn before discarding edits** — picking a library song currently throws away the working sequence without confirmation.
- [ ] **Debug CSV/JSON download** of the last 100 ticks.
- [ ] Optional: raise the scheduler lookahead from 100 ms to ~200 ms if late notes appear on a real device (costs slightly slower response to mid-play tempo changes).
- [ ] Optional: load `accuracyStats.js` on demand — it's currently in the main bundle because `AudioEngine` imports it.

### Song Map open questions

- **Bars above 32** for very long sections — raise the cap or split automatically?
- **Drag-and-drop reordering** of steps (buttons work for now).
- **Smoother progress bar** — currently moves per bar; per-beat would need a beat callback from the audio engine.

---

## Completed

### Recent

- [x] **PWA update toast** — `UpdateToast` component uses `useRegisterSW` from `virtual:pwa-register/react`; shows a fixed bottom banner with Reload / dismiss when a new SW is waiting.
- [x] **Dark / light mode** — `ThemeContext` + `data-theme="light"` on `<html>`; CSS overrides for all slate/accent utility classes in `index.css`; preference persisted in `localStorage`; ☀/🌙 toggle in footer.
- [x] **Shared style constants** — `src/components/styles.js` exports `CARD`, `SECTION_BOX`, `INPUT`, `SELECT`, `FIELD_LABEL`; all panel components import them instead of repeating inline strings.
- [x] **Song Map improvements** — section names, repeat count per step (engine + UI + tests), song completion indicator (green banner), per-step beat accents (stored in step, applied on transition, editable in SequenceEditor).
- [x] **Song Map UX** — `SongTimeline` during playback / `SequenceEditor` while stopped; controls hidden when not in Song mode; layout expands to 8/4 columns; pre-roll defaults to 1 bar on non-manual modes.
- [x] **Keyboard shortcuts revised** — Up/Down → subdivision ±1; Shift+Up/Down → time signature; Left/Right → BPM ±4; Shift+Left/Right → ±8; Alt+Left/Right → ±1. `ShortcutsPanel` updated.
- [x] **GitHub Pages deploy migrated** — source changed to GitHub Actions; `gh-pages` dependency and `deploy`/`predeploy` scripts removed.

### Earlier

- [x] **CI workflow** — lint, test, build, `npm audit --audit-level=high` on every push and PR; Node 24, npm cache, 10-minute timeout, concurrent-run cancellation.
- [x] **Deploy job** — `actions/upload-pages-artifact` + `actions/deploy-pages` after checks pass on `main`; only the deploy job gets `pages: write` / `id-token: write`.
- [x] **Trainer settings object** — 15 Ramp/Sprint/Mute settings moved into one `trainer` object (`DEFAULT_TRAINER`); `updateTrainer(key, value)` setter; `AutomationEngine` down from 36 props to 5.
- [x] **AutomationEngine deduplication** — shared `PhasePanel`, `Field`, `Num`, `Segmented` sub-components replace duplicated markup.
- [x] **Lazy debug panel** — `DebugPanel` is a separate 7.9 kB chunk loaded only when debug mode is on.
- [x] **iOS audio fixes** — `navigator.audioSession.type = 'playback'` for the silent switch; audio context resumed from `suspended`/`interrupted` on every scheduler tick.
- [x] **App icon** — new artwork across all PNG sizes (192, 512, maskable), Apple touch icon and favicon.
- [x] **Desktop shortcuts panel** — sticky sidebar listing all keyboard shortcuts; visible above the `xl` breakpoint on non-touch devices.
- [x] **Quick tempo buttons** — now ±4, ±8, ±12, ±16.
- [x] **Line endings** — `.gitattributes` (`* text=auto eol=lf`) added; working copies converted to LF.
