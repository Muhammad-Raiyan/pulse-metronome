import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AudioEngine } from './AudioEngine.js';

// Engine with a fake clock and recording stubs, so no real audio is needed
function makeEngine(beat = 0, sub = 0) {
  const engine = new AudioEngine();
  engine.audioCtx = { currentTime: 0, state: 'running' };
  engine.currentBeatInBar = beat;
  engine.currentSubIndex = sub;
  engine.scheduled = [];
  engine.scheduleNote = function () {
    this.scheduled.push([this.currentBeatInBar, this.currentSubIndex]);
  };
  return engine;
}

const events = () => {
  const list = [];
  const fn = (type) => list.push(type);
  fn.list = list;
  return fn;
};

test('subdivision 10x -> 2x mid-beat moves to the next beat instead of playing sub 7', () => {
  const engine = makeEngine(1, 7);
  const ev = events();
  engine.alignPosition({ subdivision: 2, beatsPerBar: 4 }, ev);
  assert.equal(engine.currentSubIndex, 0);
  assert.equal(engine.currentBeatInBar, 2);
  assert.deepEqual(ev.list, ['beat']);
});

test('subdivision shrink on the last beat wraps the bar and reports it', () => {
  const engine = makeEngine(3, 9);
  const ev = events();
  engine.alignPosition({ subdivision: 2, beatsPerBar: 4 }, ev);
  assert.equal(engine.currentBeatInBar, 0);
  assert.equal(engine.currentSubIndex, 0);
  assert.deepEqual(ev.list, ['bar']);
});

test('meter shrink past the current beat restarts the bar without counting it', () => {
  const engine = makeEngine(6, 3);
  const ev = events();
  engine.alignPosition({ subdivision: 4, beatsPerBar: 4 }, ev);
  assert.equal(engine.currentBeatInBar, 0);
  assert.equal(engine.currentSubIndex, 0);
  assert.deepEqual(ev.list, []);
});

test('a valid position is left alone', () => {
  const engine = makeEngine(2, 1);
  const ev = events();
  engine.alignPosition({ subdivision: 2, beatsPerBar: 4 }, ev);
  assert.deepEqual([engine.currentBeatInBar, engine.currentSubIndex], [2, 1]);
  assert.deepEqual(ev.list, []);
});

test('growing the subdivision or meter never moves the position', () => {
  const engine = makeEngine(1, 1);
  engine.alignPosition({ subdivision: 10, beatsPerBar: 12 }, events());
  assert.deepEqual([engine.currentBeatInBar, engine.currentSubIndex], [1, 1]);
});

test('every scheduled note stays in range while the settings shrink during playback', () => {
  const engine = makeEngine();
  const state = { bpm: 300, subdivision: 10, beatsPerBar: 8 };
  const noop = () => {};

  const run = (ticks) => {
    for (let i = 0; i < ticks; i++) {
      engine.audioCtx.currentTime += 0.025;
      engine.processTick(state, noop, noop);
    }
  };

  run(14); // partway through a bar at 10x, 8 beats
  const before = engine.scheduled.length;
  assert.ok(engine.scheduled.some(([, sub]) => sub >= 2), 'precondition: reached high sub indices');

  state.subdivision = 2;
  state.beatsPerBar = 3;
  run(60);

  const after = engine.scheduled.slice(before);
  assert.ok(after.length > 0);
  for (const [beat, sub] of after) {
    assert.ok(sub < 2, `sub ${sub} out of range for 2x`);
    assert.ok(beat < 3, `beat ${beat} out of range for 3 beats`);
  }
  engine.stop();
});
