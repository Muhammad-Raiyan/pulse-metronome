# TODO

Engineering clean-up and follow-ups. Line counts are rough estimates from a code review, not measurements of the result.

## Simplification

- [ ] **Replace the ~30 automation `useState` calls with one settings object.**
  `Metronome.jsx` declares every trainer setting separately, copies them all into `stateRef`, and passes
  36 props (a value and a setter for each) to `AutomationEngine`. A single `settings` object with an
  `update(key, value)` helper lets `stateRef` be a spread of it and shrinks `AutomationEngine` to ~3 props.
  Estimated saving ~100 lines in `Metronome.jsx`; adding a setting would no longer touch five places.
  Risk: this is the code that decides what plays. `automation.test.js` covers the rules but not the React
  wiring, so add a test or check manually in the browser (Ramp, Sprint, Mute, Song Map).
- [ ] **Lazy-load the debug panel** (`React.lazy` + `Suspense`) so ~440 lines of debug UI and stats code stay
  out of the normal bundle. Optional: trim the tick strip and the "slowest five" list.
- [ ] **Small cleanups in `Metronome.jsx`.**
  - `handleSelectSong` repeats what `applySection` already does for the first section.
  - The ArrowUp and ArrowDown branches of the key handler are near-duplicates.
  - Stale comments: "Fixed warning #2", and the orphaned "Stats are only collected in debug mode" line above the component.

## Repository and tooling

- [ ] **Normalise line endings.** Source files mix CRLF and LF, which makes multi-line edits and diffs
  unreliable. Add `.gitattributes` with `* text=auto eol=lf`, then commit the normalisation on its own
  (it will be a noisy commit).
- [ ] **Shrink the PWA icons.** The 512 px PNGs are ~300 KB each and the precache grew from ~330 KB to ~1 MB.
  Try palette/quantised PNG compression and compare the result visually.
- [ ] **Add CI.** A GitHub Actions workflow running `npm run lint`, `npm test` and `npm run build` on each push.
  It could also replace the `gh-pages` dependency by deploying Pages from the workflow.
- [ ] **Keep `design/app-icon-source.jpg` as the icon source.** It is not shipped (outside `public/`).
  Consider noting the icon-generation steps in the README.

## Features (from the earlier suggestions)

- [ ] Presets saved in `localStorage` (named slots).
- [ ] Shareable links (`?bpm=120&ts=7&sub=2`).
- [ ] iOS audio fixes: resume after an `interrupted` AudioContext, `navigator.audioSession.type = 'playback'`
  for the silent switch; optional "Install on iPhone" hint.
- [ ] Debug CSV/JSON download of the last 100 ticks.
- [ ] Optional: raise the scheduler lookahead from 100 ms to ~200 ms if late notes show up on a real device
  (costs a slightly slower response to tempo changes mid-play). Left alone for now.
