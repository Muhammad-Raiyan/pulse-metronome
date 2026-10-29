# TODO

Engineering clean-up and follow-ups. Line counts are rough estimates from a code review, not measurements of the result.

## Simplification

- [x] **Replace the ~30 automation `useState` calls with one settings object.** Done: the 15 Ramp/Sprint/Mute settings now live in one `trainer` object (`DEFAULT_TRAINER` in `constants.js`),
  changed with `updateTrainer(key, value)`. `AutomationEngine` takes 5 props instead of 36, `HeaderBanner` takes
  `trainer` instead of 9 separate props, and `stateRef` spreads the object. Still to do: check Ramp, Sprint (both
  strategies), Mute and Song Map by hand in the browser, since `automation.test.js` does not cover the React wiring.

- [x] **Lazy-load the debug panel.** Done: `DebugPanel` is a separate 7.9 kB chunk (`React.lazy` + `Suspense`), fetched only when debug is on.
  `accuracyStats.js` (~190 lines) still ships in the main bundle because `AudioEngine` imports it; loading it on demand is possible but adds an async step to the engine.
  Optional: trim the tick strip and the "slowest five" list.

- [x] **Small cleanups in `Metronome.jsx`.** Done: `handleSelectSong` reuses `applySection` for the first section, the
  ArrowUp/ArrowDown branches are merged, and the stale comments are removed.

## Repository and tooling

- [x] **Normalise line endings.** Done: `.gitattributes` (`* text=auto eol=lf`) added and the working copies converted to LF.
  Git already stored these files as LF, so there is no noisy commit.
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
