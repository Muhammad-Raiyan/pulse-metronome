import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Series, AccuracyStats, describe, WINDOW_SIZE } from './accuracyStats.js';
import { AudioEngine } from './AudioEngine.js';

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} !~ ${b}`);

test('Series reports last, mean, p95 and lifetime min/max', () => {
  const s = new Series();
  for (let i = 1; i <= 100; i++) s.add(i);
  const sum = s.summary();
  assert.equal(sum.count, 100);
  assert.equal(sum.min, 1);
  assert.equal(sum.max, 100);
  assert.equal(sum.last, 100);
  close(sum.mean, 50.5);
  assert.equal(sum.p95, 95);
});

test('Series keeps lifetime min/max even after old samples roll out of the window', () => {
  const s = new Series(10);
  s.add(500); // an early spike
  for (let i = 0; i < 50; i++) s.add(1);
  const sum = s.summary();
  assert.equal(sum.max, 500);
  assert.equal(sum.count, 51);
  close(sum.mean, 1); // window now holds only the recent samples
});

test('Series ignores non-finite values and is empty after reset', () => {
  const s = new Series();
  s.add(NaN);
  s.add(Infinity);
  assert.equal(s.summary(), null);
  s.add(3);
  s.reset();
  assert.equal(s.summary(), null);
});

test('describe summarises min, max, mean, p95 and standard deviation', () => {
  assert.equal(describe([]), null);
  const d = describe([2, 4, 4, 4, 5, 5, 7, 9]);
  assert.equal(d.count, 8);
  assert.equal(d.min, 2);
  assert.equal(d.max, 9);
  close(d.mean, 5);
  close(d.stdDev, 2);
});

test('lead and delay are computed from intended time, handover time and display time', () => {
  const st = new AccuracyStats();
  const seq = st.noteScheduled({ beat: 1, sub: 0, target: 1.1, now: 1.02 });
  st.visualFired(seq, 1.1035);
  const [e] = st.recent();
  assert.equal(e.beat, 1);
  close(e.leadMs, 80, 1e-6);
  close(e.delayMs, 3.5, 1e-6);
});

test('a note handed over after its due time is counted as late; zero lead is not', () => {
  const st = new AccuracyStats();
  st.noteScheduled({ beat: 0, sub: 0, target: 1.08, now: 1 });
  st.noteScheduled({ beat: 0, sub: 1, target: 1.2, now: 1.2 });
  st.noteScheduled({ beat: 0, sub: 2, target: 1.3, now: 1.304 });
  const snap = st.snapshot();
  assert.equal(snap.notes, 3);
  assert.equal(snap.lateNotes, 1);
  assert.equal(snap.window.audioLate, 1);
  close(snap.window.worstAudioLateMs, 4, 1e-6);
  close(snap.window.lead.min, -4, 1e-6);
  close(snap.window.lead.max, 80, 1e-6);
});

test('the window keeps only the last 100 ticks, oldest first', () => {
  const st = new AccuracyStats();
  assert.equal(WINDOW_SIZE, 100);
  for (let i = 0; i < 250; i++) st.noteScheduled({ beat: 0, sub: 0, target: i, now: i - 0.05 });
  const recent = st.recent();
  assert.equal(recent.length, 100);
  assert.equal(recent[0].seq, 150);
  assert.equal(recent[99].seq, 249);
  assert.equal(st.snapshot().notes, 250); // run total is not windowed
  assert.equal(st.snapshot().window.ticks, 100);
});

test('visualFired for a tick that already rolled out of the window is ignored', () => {
  const st = new AccuracyStats(10);
  const old = st.noteScheduled({ beat: 0, sub: 0, target: 0, now: 0 });
  for (let i = 1; i <= 10; i++) st.noteScheduled({ beat: 0, sub: 0, target: i, now: i });
  st.visualFired(old, 99); // slot now belongs to seq 10; must not be overwritten
  assert.ok(st.recent().every((e) => e.delayMs === null));
});

test('window summary only measures delay for ticks whose display has fired', () => {
  const st = new AccuracyStats();
  const a = st.noteScheduled({ beat: 0, sub: 0, target: 1, now: 0.9 });
  st.noteScheduled({ beat: 0, sub: 1, target: 1.1, now: 1.0 });
  const c = st.noteScheduled({ beat: 0, sub: 2, target: 1.2, now: 1.1 });
  st.visualFired(a, 1.002);
  st.visualFired(c, 1.25); // 50 ms late
  const w = st.snapshot().window;
  assert.equal(w.ticks, 3);
  assert.equal(w.measured, 2);
  assert.equal(w.overWarn, 1);
  close(w.delay.max, 50, 1e-6);
});

test('reset empties the window and counters', () => {
  const st = new AccuracyStats();
  st.noteScheduled({ beat: 0, sub: 0, target: 1, now: 2 });
  st.reset();
  const snap = st.snapshot();
  assert.equal(snap.notes, 0);
  assert.equal(snap.lateNotes, 0);
  assert.equal(snap.window.ticks, 0);
  assert.equal(snap.window.delay, null);
});
test('AccuracyStats measures tick gaps and ignores the pause between runs', () => {
  const st = new AccuracyStats();
  st.tick(1000, 10);
  st.tick(1025, 10.025);
  st.tick(1052, 10.052);
  st.markStopped();
  st.tick(9000, 20); // restart much later: must not count as a 8-second gap
  const gaps = st.snapshot().tickInterval;
  assert.equal(gaps.count, 2);
  close(gaps.max, 27);
});

test('AccuracyStats reports drift of the audio clock against the system clock', () => {
  const st = new AccuracyStats();
  st.tick(0, 5);
  st.tick(10000, 15.002); // audio clock gained 2 ms over 10 s
  const { driftMs, elapsedMs } = st.snapshot().drift;
  close(driftMs, 2, 1e-6);
  assert.equal(elapsedMs, 10000);
});

// --- engine integration, with a fake clock and no real audio ---
function makeEngine(stats) {
  const engine = new AudioEngine({ stats });
  engine.audioCtx = { currentTime: 0, state: 'running', baseLatency: 0.01, outputLatency: 0.02, sampleRate: 48000 };
  engine.playTone = () => {}; // no oscillators in Node
  return engine;
}

test('engine records a window entry per scheduled note, all with non-negative lead on a healthy clock', () => {
  const stats = new AccuracyStats();
  const engine = makeEngine(stats);
  engine.nextNoteTime = 0.05;
  const state = { bpm: 120, subdivision: 2, beatsPerBar: 4 };
  for (let i = 0; i < 160; i++) { // 4 s: bar 1 is 2 s long at 120 bpm
    engine.audioCtx.currentTime += 0.025;
    engine.processTick(state, () => {}, () => {});
  }
  const snap = engine.getDebugSnapshot();
  assert.ok(snap.notes > 0);
  assert.equal(snap.lateNotes, 0);
  assert.ok(snap.window.lead.min >= 0);
  assert.ok(snap.window.lead.max <= snap.lookaheadMs + 1e-6);
  assert.equal(snap.window.audioLate, 0);
  assert.ok(snap.tickInterval.count > 0 && snap.tickInterval.count < 159); // bar 1 ticks skipped
  close(snap.baseLatencyMs, 10);
  close(snap.outputLatencyMs, 20);
  engine.stop();
});

test('engine flags a note scheduled after its due time (a stalled main thread)', () => {
  const stats = new AccuracyStats();
  const engine = makeEngine(stats);
  engine.nextNoteTime = 0.05;
  const state = { bpm: 120, subdivision: 1, beatsPerBar: 4 };
  for (let i = 0; i < 100; i++) { // healthy run through bar 1 (2 s) and into bar 2
    engine.audioCtx.currentTime += 0.025;
    engine.processTick(state, () => {}, () => {});
  }
  assert.equal(engine.getDebugSnapshot().lateNotes, 0);
  engine.audioCtx.currentTime += 3; // the main thread stalls for 3 s
  engine.processTick(state, () => {}, () => {});
  const snap = engine.getDebugSnapshot();
  assert.ok(snap.lateNotes > 0);
  assert.ok(snap.window.worstAudioLateMs > 0);
  engine.stop();
});

test('with debug off the engine records nothing and exposes no snapshot', () => {
  const engine = makeEngine(null);
  engine.nextNoteTime = 0.05;
  for (let i = 0; i < 10; i++) {
    engine.audioCtx.currentTime += 0.025;
    engine.processTick({ bpm: 120, subdivision: 1, beatsPerBar: 4 }, () => {}, () => {});
  }
  assert.equal(engine.stats, null);
  assert.equal(engine.getDebugSnapshot(), null);
  engine.stop();
});

test('starting a run clears the previous run\'s numbers', () => {
  const stats = new AccuracyStats();
  const engine = makeEngine(stats);
  stats.noteScheduled({ beat: 0, sub: 0, target: 0, now: 1 });
  engine.start();
  assert.equal(stats.snapshot().notes, 0);
  assert.equal(stats.snapshot().lateNotes, 0);
});

test('Series.recent returns the newest samples oldest-first, across wrap-around', () => {
  const s = new Series(5);
  for (let i = 1; i <= 8; i++) s.add(i);
  assert.deepEqual(s.recent(), [4, 5, 6, 7, 8]);
  assert.deepEqual(s.recent(2), [7, 8]);
});

test('describe reports the last value and RMS', () => {
  const d = describe([3, -4]);
  assert.equal(d.last, -4);
  close(d.rms, Math.sqrt(12.5));
});

test('tick jitter is the signed gap error against the 25 ms target', () => {
  const st = new AccuracyStats();
  st.tick(1000, 1);
  st.tick(1025.4, 1.0254); // +0.4
  st.tick(1049.0, 1.049); // -1.4
  st.tick(1080.0, 1.08); // +6
  const snap = st.snapshot();
  assert.equal(snap.tickJitter.count, 3);
  close(snap.tickJitter.last, 6, 1e-6);
  close(snap.tickJitter.min, -1.4, 1e-6);
  close(snap.tickJitter.max, 6, 1e-6);
  assert.equal(snap.tickJitterRecent.length, 3);
  close(snap.tickJitterRecent[0], 0.4, 1e-6);
});

test('run-wide display spike tracks the largest delay even after it leaves the window', () => {
  const st = new AccuracyStats(5);
  const first = st.noteScheduled({ beat: 0, sub: 0, target: 1, now: 0.9 });
  st.visualFired(first, 1.04); // 40 ms
  for (let i = 0; i < 20; i++) {
    const s = st.noteScheduled({ beat: 0, sub: 0, target: 2 + i, now: 1.9 + i });
    st.visualFired(s, 2 + i + 0.001);
  }
  const snap = st.snapshot();
  close(snap.delayRun.max, 40, 1e-6);
  assert.ok(snap.window.delay.max < 2);
});

test('debug mode can be switched on and off on a live engine', () => {
  const engine = new AudioEngine();
  assert.equal(engine.getDebugSnapshot(), null);
  engine.setDebug(true);
  assert.ok(engine.stats);
  engine.setDebug(false);
  assert.equal(engine.stats, null);
  assert.equal(engine.getDebugSnapshot(), null);
});
test('the first bar is excluded from the stats; recording starts at the second downbeat', () => {
  const stats = new AccuracyStats();
  const engine = makeEngine(stats);
  engine.nextNoteTime = 0.05;
  const state = { bpm: 120, subdivision: 2, beatsPerBar: 4 }; // bar = 2 s, bar 2 starts at 2.05
  for (let i = 0; i < 120; i++) { // 3 s
    engine.audioCtx.currentTime += 0.025;
    engine.processTick(state, () => {}, () => {});
  }
  const first = stats.recent()[0];
  assert.equal(first.beat, 0);
  assert.equal(first.sub, 0);
  close(first.target, 2.05, 1e-9);
  assert.ok(stats.tickIntervalMs.summary().count > 0);
  engine.stop();
});

test('a new run skips its first bar again', () => {
  const stats = new AccuracyStats();
  const engine = makeEngine(stats);
  engine.start();
  assert.equal(engine.statsFrom, null);
  assert.equal(engine.firstNoteScheduled, false);
});