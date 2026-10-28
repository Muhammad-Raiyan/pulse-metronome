import { test } from 'node:test';
import assert from 'node:assert/strict';
import { advanceAutomation } from './automation.js';
import { AUTOMATION_MODES, SPRINT_STRATEGIES, SUBDIV_METRICS, MAX_BPM } from '../constants.js';

const base = (overrides = {}) => ({
  bpm: 120,
  beatsPerBar: 4,
  subdivision: 1,
  automationMode: AUTOMATION_MODES.MANUAL,
  gradualInterval: 2,
  gradualStep: 4,
  gradualCap: 130,
  sprintType: SPRINT_STRATEGIES.BPM,
  jogBpm: 100,
  sprintBpm: 140,
  jogBars: 2,
  sprintBars: 1,
  subdivMetric: SUBDIV_METRICS.BARS,
  jogSubdiv: 2,
  sprintSubdiv: 4,
  jogUnits: 2,
  sprintUnits: 1,
  isSprintPhase: false,
  unitsElapsed: 0,
  startDelayBars: 0,
  isDelayPhase: false,
  delayBarsElapsed: 0,
  isSpeedCapReached: false,
  muteBarsPlay: 2,
  muteBarsSilent: 1,
  isMutePhase: false,
  activeSongMap: null,
  currentSectionIndex: 0,
  ...overrides,
});

test('manual mode never changes anything', () => {
  const s = base();
  assert.deepEqual(advanceAutomation(s, 'bar'), {});
  assert.equal(s.bpm, 120);
});

test('count-in swallows bars until finished, then hands over', () => {
  const s = base({ isDelayPhase: true, startDelayBars: 2, automationMode: AUTOMATION_MODES.MUTE_TRAINER });
  assert.deepEqual(advanceAutomation(s, 'beat'), {});
  assert.deepEqual(advanceAutomation(s, 'bar'), { delayBarsElapsed: 1 });
  assert.equal(s.unitsElapsed, 0); // mute counter did not advance during count-in
  const done = advanceAutomation(s, 'bar');
  assert.equal(done.isDelayPhase, false);
  assert.equal(s.isDelayPhase, false);
});

test('ramp adds one step per interval exactly once and clamps at the cap', () => {
  const s = base({ automationMode: AUTOMATION_MODES.RAMP });
  assert.equal(advanceAutomation(s, 'bar').bpm, undefined);
  assert.equal(s.bpm, 120);
  assert.equal(advanceAutomation(s, 'bar').bpm, 124);
  assert.equal(s.bpm, 124);
  advanceAutomation(s, 'bar');
  advanceAutomation(s, 'bar'); // 128
  advanceAutomation(s, 'bar');
  const capped = advanceAutomation(s, 'bar'); // would be 132 -> capped to 130
  assert.equal(capped.bpm, 130);
  assert.equal(s.isSpeedCapReached, true);
  advanceAutomation(s, 'bar');
  assert.equal(advanceAutomation(s, 'bar').bpm, undefined); // already at cap
});

test('ramp ignores beat boundaries', () => {
  const s = base({ automationMode: AUTOMATION_MODES.RAMP });
  assert.deepEqual(advanceAutomation(s, 'beat'), {});
});

test('sprint (BPM jump) alternates jog and sprint tempo on the right bar counts', () => {
  const s = base({ automationMode: AUTOMATION_MODES.JOG_SPRINT, bpm: 100 });
  advanceAutomation(s, 'bar');
  const toSprint = advanceAutomation(s, 'bar'); // jogBars = 2
  assert.equal(toSprint.isSprintPhase, true);
  assert.equal(s.bpm, 140);
  const toJog = advanceAutomation(s, 'bar'); // sprintBars = 1
  assert.equal(toJog.isSprintPhase, false);
  assert.equal(s.bpm, 100);
});

test('sprint (subdivision, bars) swaps subdivision on the snapshot and keeps tempo', () => {
  const s = base({
    automationMode: AUTOMATION_MODES.JOG_SPRINT,
    sprintType: SPRINT_STRATEGIES.SUBDIVISION,
    subdivision: 2,
  });
  advanceAutomation(s, 'bar');
  advanceAutomation(s, 'bar'); // jogUnits = 2 bars
  assert.equal(s.isSprintPhase, true);
  assert.equal(s.subdivision, 4);
  assert.equal(s.bpm, 120);
});

test('sprint (subdivision, beats) counts beats and bar boundaries', () => {
  const s = base({
    automationMode: AUTOMATION_MODES.JOG_SPRINT,
    sprintType: SPRINT_STRATEGIES.SUBDIVISION,
    subdivMetric: SUBDIV_METRICS.BEATS,
    jogUnits: 3,
  });
  advanceAutomation(s, 'beat');
  advanceAutomation(s, 'beat');
  assert.equal(s.isSprintPhase, false);
  advanceAutomation(s, 'bar'); // a bar boundary is also a beat
  assert.equal(s.isSprintPhase, true);
});

test('mute trainer flips the phase on the new bar, so the next note is already silent', () => {
  const s = base({ automationMode: AUTOMATION_MODES.MUTE_TRAINER });
  advanceAutomation(s, 'bar');
  assert.equal(s.isMutePhase, false);
  advanceAutomation(s, 'bar'); // muteBarsPlay = 2
  assert.equal(s.isMutePhase, true);
  advanceAutomation(s, 'bar'); // muteBarsSilent = 1
  assert.equal(s.isMutePhase, false);
});

const songMap = {
  sections: [
    { bars: 2, bpm: 100, beatsPerBar: 4, subdivision: 1 },
    { bars: 1, bpm: 160, beatsPerBar: 3, subdivision: 2 },
  ],
};

test('song map moves to the next section and applies its tempo, meter and subdivision', () => {
  const s = base({ automationMode: AUTOMATION_MODES.SONG_MAP, activeSongMap: songMap, bpm: 100 });
  advanceAutomation(s, 'bar');
  const patch = advanceAutomation(s, 'bar');
  assert.equal(patch.currentSectionIndex, 1);
  assert.equal(patch.section, songMap.sections[1]);
  assert.equal(s.bpm, 160);
  assert.equal(s.beatsPerBar, 3);
  assert.equal(s.subdivision, 2);
});

test('song map loops back to section 1 with all of its settings', () => {
  const s = base({
    automationMode: AUTOMATION_MODES.SONG_MAP,
    activeSongMap: songMap,
    currentSectionIndex: 1,
    bpm: 160,
    beatsPerBar: 3,
    subdivision: 2,
  });
  const patch = advanceAutomation(s, 'bar'); // section 2 has 1 bar
  assert.equal(patch.currentSectionIndex, 0);
  assert.equal(s.bpm, 100);
  assert.equal(s.beatsPerBar, 4);
  assert.equal(s.subdivision, 1);
});

test('song map with no sections is a no-op', () => {
  const s = base({ automationMode: AUTOMATION_MODES.SONG_MAP, activeSongMap: { title: 'x' } });
  assert.deepEqual(advanceAutomation(s, 'bar'), {});
});

test('out-of-range song tempos are clamped', () => {
  const s = base({
    automationMode: AUTOMATION_MODES.SONG_MAP,
    activeSongMap: { sections: [{ bars: 1, bpm: 120 }, { bars: 1, bpm: 9999 }] },
  });
  advanceAutomation(s, 'bar');
  assert.equal(s.bpm, MAX_BPM);
});
