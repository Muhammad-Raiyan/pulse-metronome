# TODO

Open work first, finished work in **Completed** at the bottom. Line counts are rough estimates, not measurements.

## Song library data

- [ ] **Fix the section data in `public/songs.json`.** The sections are short outlines, not full song structures. For example
  "Fight Fire With Fire" adds up to 36 bars (~46 s) when the real track is several minutes, and all 19 songs with sections come out
  between 0:26 and 1:45. The engine is fine (a simulation of the real `AudioEngine` + `advanceAutomation` matched the expected
  section timings and looped back to step 1), so only the data needs correcting. Use real structures (repeated verses and
  choruses, correct bar counts), and expect more than 2-4 sections per song. Keep the 32-bar cap per step in mind (see open questions below).
  Bar counts must come from the actual tracks, not guesses.
- [ ] Optional: a small script that prints each song's total bars and length, so wrong entries are easy to spot.

## Repository and tooling
- [ ] **Shrink the PWA icons.** The 512 px PNGs are ~300 KB each and the precache grew from ~330 KB to ~1 MB.
  Try palette/quantised PNG compression and compare the result visually.
- [x] **Switch the repo to the new deploy.** Pages set to **GitHub Actions**, `gh-pages` dependency and `deploy`/`predeploy` scripts removed.
- [ ] **Note the icon steps in the README.** `design/app-icon-source.jpg` is the icon source (not shipped, outside `public/`);
  document how the PNGs in `public/` are generated from it.

## Follow-ups from completed work

- [ ] **Browser check after the `trainer` refactor.** `automation.test.js` does not cover the React wiring, so try Ramp,
  Sprint (both strategies), Mute and Song Map by hand, including changing a setting while playing.
- [ ] **Real-iPhone test of the iOS audio fixes** (silent switch on; lock/unlock; a call or alarm; Safari tab and installed app).
- [ ] **iOS extras not built yet:** a silent looping `<audio>` fallback for older iOS without `audioSession`, a "Tap to resume audio"
  message, and an "Install on iPhone" hint.
- [ ] Optional: trim the debug panel (tick strip, "slowest five" list), or load `accuracyStats.js` on demand
  (it ships in the main bundle because `AudioEngine` imports it; on-demand loading adds an async step to the engine).

## Song map improvements

- [x] **Section names** — name input added to `SequenceEditor` rows; timeline labels use the name when set.
- [x] **Repeat count per step** — `repeats` field in `makeStep`; engine counts passes before advancing; `SequenceEditor` has a `×` column; progress bar spans all repeats; banner shows `×n/N`.
- [x] **Song completion indicator** — engine emits `patch.songComplete` on last-section loop; banner turns green and shows "SONG COMPLETE — LOOPING"; resets on stop or mode change.
- [x] **Per-step beat accents** — `beatAccents` array in `makeStep`; `applySection` applies it; `SequenceEditor` shows a clickable accent strip per step.

## Visual

- [x] **Dark / light mode toggle** — `ThemeContext` stores preference in `localStorage`; `data-theme="light"` on `<html>` triggers CSS overrides; toggle button in the footer.

## Features

- [ ] Presets saved in `localStorage` (named slots). Plan to share one **Export / Import** (JSON) with saved sequences, so
  settings and sequences can be backed up and moved between devices the same way.
- [ ] Shareable links (`?bpm=120&ts=7&sub=2`).
- [ ] Debug CSV/JSON download of the last 100 ticks.
- [ ] Optional: raise the scheduler lookahead from 100 ms to ~200 ms if late notes show up on a real device
  (costs a slightly slower response to tempo changes mid-play). Left alone for now.
- [ ] **Tap tempo on mobile** — add a large full-width touch-friendly tap zone (the current button is too small for live tapping).
- [ ] **PWA update toast** — the service worker auto-updates silently; show a small "App updated" toast on next load so users know.
- [ ] **Export / import custom sequences as JSON** — download / upload a file so sequences can be backed up and moved between devices (shares the path with the `localStorage` presets item above).

## Song tab: editable sequences (built, not yet tried in a browser)

Custom sequences are **not** a sixth mode. Song Map sections and custom steps are the same data
(`{ bars, bpm, beatsPerBar, subdivision }`), so the existing **Song** tab and its engine branch play both. The tab keeps
its name, "Song".

Where songs come from:

- **Library (`public/songs.json`):** global and read-only. Loading a song copies it, so nothing in the library is ever changed.
- **Your sequences (later):** user-defined songs in the same shape as `songs.json`. There is no `user-song.json` file, because a
  web page cannot write files next to the app. They are kept in `localStorage` in the browser, and **Export** and **Import**
  buttons move them as a JSON file (download / pick a file). Export/import is also the way to back up or move them to another
  device, since `localStorage` is per browser and per device and can be cleared. Rename arrives with this step. It is out of
  scope for now.

How it works for now (nothing is saved):

- Picking a library song loads an editable working copy of it, switches to the Song tab and shows its steps. The copy is what the editor changes and what plays.
- A **New sequence** button starts a working copy with one step (current tempo, meter and subdivision), for building from scratch.
- The working copy is lost on reload. There is no rename yet; the copy keeps the song title, or is called "New sequence" when new. A later **Save** button will ask for a name.
- A song without sections (16 of the 35) loads as a one-step sequence built from its tempo, meter and subdivision.

Decisions carried over:

- **Step unit:** bars.
- **Accents:** per-step `beatAccents` array now stored in each step and applied on section transition.
- **End of sequence:** loop back to step 1; banner shows "SONG COMPLETE — LOOPING" on the first loop.
- **Count-in:** plays once, before step 1.
- **Limit:** none in the data. The UI uses compact rows with a **+** button and a scrollable list.

Data shape (each step now also carries `repeats` and `beatAccents`):

```js
{
  id: 'custom-1', title: 'Custom sequence', bpm: 100, beatsPerBar: 4, subdivision: 1,
  sections: [
    { id: 's1', name: 'Intro', bars: 4, bpm: 100, beatsPerBar: 4, subdivision: 1, repeats: 2, beatAccents: [0,1,1,1] },
    { id: 's2', name: 'Verse', bars: 8, bpm: 120, beatsPerBar: 4, subdivision: 2, repeats: 1, beatAccents: [0,1,1,1] },
  ]
}
```

Built and verified:

- [x] No new mode. The Song Map branch of `advanceAutomation()` plays the working copy.
- [x] `src/sequence.js` (57 tests passing): `makeStep` clamps every value; `repeats` (1–16) and `beatAccents` added to the step shape.
- [x] Engine counts repeat passes per step before advancing; emits `patch.repeatElapsed` and `patch.songComplete`.
- [x] Empty list does nothing; the index resets to 0 whenever the list changes.
- [x] Selecting a song opens its steps automatically; a **New sequence** button starts an empty one.
- [x] `SequenceEditor.jsx`: compact rows (name, bars, ×repeats, BPM, meter, subdivision) with move up/down, duplicate, remove, **Add step**; scrolling list; playing step highlighted with a repeat-aware progress bar; per-step accent strip (click to cycle Accented → Normal → Soft → Muted).
- [x] Locked while playing ("Stop playback to edit steps"); `SongTimeline` replaces the editor during playback.
- [x] Banner shows step name / `Step n/m`, repeat counter `×n/N`, `Bar x/y`; turns green on song complete.
- [x] Keyboard: Up/Down → subdivision, Shift+Up/Down → time signature, Left/Right → BPM (±4 default, Shift ±8, Alt ±1).
- [ ] Check in the browser: picking another song replaces the working copy (no confirmation); row layout fits on a phone.

Open questions:

- **Bars above 32** for very long sections?
- **Reordering:** buttons for now; drag and drop later if wanted.
- **Smoother progress bar:** moves per bar; per-beat movement needs a beat callback from the audio engine.
- **Warn before a library pick discards edits?** Nothing is saved yet.

## UI / code quality

- [x] **Dark / light mode** — `ThemeContext` + `data-theme="light"` on `<html>`; full CSS override set in `index.css`; preference persisted in `localStorage`; toggle in footer.
- [x] **Shared style constants** — `src/components/styles.js` exports `CARD`, `SECTION_BOX`, `INPUT`, `SELECT`, `FIELD_LABEL`; all panel components use them instead of repeating the full Tailwind string.
- [x] **Song Map UI** — timeline hidden while stopped (sequence editor shown instead); hidden when not in Song mode; `SongTimeline` shows rolling window of steps with live bar progress during playback.
- [x] **Keyboard shortcuts updated** — Up/Down changed to subdivision, Shift+Up/Down for time signature, Left/Right for BPM with configurable step sizes (±4/±8/±1).

## Completed

- [x] **CI workflow** (`.github/workflows/ci.yml`): on push to `main` and on pull requests it runs `npm ci`, lint, test, build and `npm audit --audit-level=high`.
  Read-only token permissions, Node 24, npm cache, a 10-minute timeout, and older runs of the same branch are cancelled. First run on GitHub was green.

- [x] **Deploy job** in the same workflow: after the checks pass on a push to `main`, `dist/` is uploaded and published with
  `actions/upload-pages-artifact` + `actions/deploy-pages`. Only that job gets `pages: write` and `id-token: write`; pull requests never deploy.
- [x] **Settings object for the trainers.** The 15 Ramp/Sprint/Mute settings live in one `trainer` object (`DEFAULT_TRAINER` in
  `constants.js`), changed with `updateTrainer(key, value)`. `AutomationEngine` takes 5 props instead of 36, `HeaderBanner`
  takes `trainer` instead of 9 props, and `stateRef` spreads the object.
- [x] **Duplicated markup in `AutomationEngine.jsx` removed** (shared panels, mode tabs and toggles built from small components).
- [x] **Lazy-loaded debug panel.** `DebugPanel` is a separate 7.9 kB chunk (`React.lazy` + `Suspense`), fetched only when debug is on.
- [x] **Small cleanups in `Metronome.jsx`.** `handleSelectSong` reuses `applySection`, the ArrowUp/ArrowDown branches are merged,
  and the stale comments are removed.
- [x] **Line endings normalised.** `.gitattributes` (`* text=auto eol=lf`) added and the working copies converted to LF.
- [x] **iOS audio fixes (code).** `navigator.audioSession.type = 'playback'` for the silent switch, and the audio context is
  resumed from `suspended` and `interrupted` on every scheduler tick. Needs the real-iPhone test listed above.
- [x] **App icon** replaced with the new artwork (PNG icons, maskable icon, Apple touch icon and favicon) from `design/app-icon-source.jpg`.
- [x] **Desktop shortcuts panel** and left/right arrow keys for subdivision.
- [x] **Quick tempo buttons** now ±4, ±8, ±12 and ±16, about 8% larger.
- [x] **Song map improvements** — section names, repeat count per step, song completion indicator, per-step beat accents (all built and tested).

