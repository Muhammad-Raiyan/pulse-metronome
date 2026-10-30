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
- [ ] **Deploy from the workflow (optional).** CI exists (see Completed) but `npm run deploy` (`gh-pages`) is still how the site is published.
  A Pages deploy job could replace the `gh-pages` dependency; it needs Pages set to `GitHub Actions` as the source in the repo settings.
- [ ] **Confirm the first CI run is green** on GitHub (the workflow has not run yet).
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

## Features

- [ ] Presets saved in `localStorage` (named slots). Plan to share one **Export / Import** (JSON) with saved sequences, so
  settings and sequences can be backed up and moved between devices the same way.
- [ ] Shareable links (`?bpm=120&ts=7&sub=2`).
- [ ] Debug CSV/JSON download of the last 100 ticks.
- [ ] Optional: raise the scheduler lookahead from 100 ms to ~200 ms if late notes show up on a real device
  (costs a slightly slower response to tempo changes mid-play). Left alone for now.

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
- **Accents:** keep the current accent pattern; per-step accents are out of scope.
- **End of sequence:** loop back to step 1.
- **Count-in:** plays once, before step 1.
- **Limit:** none in the data. The UI uses compact rows with a **+** button and a scrollable list.

Data (a song-shaped object, so saving it later needs no conversion):

```js
{
  id: 'custom-1', title: 'Custom sequence', bpm: 100, beatsPerBar: 4, subdivision: 1,
  sections: [
    { id: 1, name: 'Step 1', bars: 2, bpm: 100, beatsPerBar: 4, subdivision: 1 },
    { id: 2, name: 'Step 2', bars: 2, bpm: 120, beatsPerBar: 4, subdivision: 2 },
  ]
}
```

Built (needs a check in the browser, none of the UI has been run):

- [x] No new mode. The Song Map branch of `advanceAutomation()` is unchanged and plays the working copy.
- [x] `src/sequence.js` (10 tests): `makeStep` clamps every value (bars 1-32, `clampBpm`, meter 1-12, subdivision 1-10),
  plus `songToSequence`, `newSequence`, `updateStep`, `addStep`, `duplicateStep`, `removeStep`, `moveStep`.
- [x] Empty list does nothing (already covered by the existing Song Map tests); the index resets to 0 whenever the list changes.
- [x] Selecting a song opens its steps automatically (no Duplicate button); a **New sequence** button starts an empty one.
- [x] `SequenceEditor.jsx`, shown in Song mode above the library: compact rows (number, bars, BPM, meter, subdivision) with move up/down,
  duplicate and remove, an **Add step** button that copies the last step, a scrolling list (max height) and the playing step highlighted.
- [x] Progress bar: the playing row fills one bar at a time (matches the banner's Bar x/y), empty during the count-in.
- [x] Locked while playing ("Stop playback to edit steps").
- [x] Banner shows `Step n/m` for steps without a name, then `Bar x/y` as before.
- [ ] Check in the browser: the library list still shows the original song as selected after picking it; picking another song replaces
  the working copy (no confirmation yet); the row layout fits on a phone.

Open questions:

- **Bars above 32** for very long sections?
- **Reordering:** buttons for now; drag and drop later if wanted.
- **Smoother progress bar:** it moves per bar. Per-beat movement needs a beat callback from the audio engine (only worth it if the per-bar fill feels too jumpy).
- **Warn before a library pick discards edits?** Nothing is saved yet, so picking a song throws the working copy away.

## Completed

- [x] **CI workflow** (`.github/workflows/ci.yml`): on push to `main` and on pull requests it runs `npm ci`, lint, test, build and `npm audit --audit-level=high`.
  Read-only token permissions, Node 24, npm cache, a 10-minute timeout, and older runs of the same branch are cancelled.
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
