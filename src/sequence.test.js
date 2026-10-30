import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  makeStep, songToSequence, newSequence, updateStep, addStep, duplicateStep, removeStep, moveStep,
  MAX_STEP_BARS, MAX_METER, MAX_SUBDIVISION,
} from './sequence.js';
import { MIN_BPM, MAX_BPM } from './constants.js';

test('makeStep clamps every value into range and fills gaps with defaults', () => {
  const s = makeStep({ bars: 999, bpm: 9999, beatsPerBar: 40, subdivision: 99 });
  assert.equal(s.bars, MAX_STEP_BARS);
  assert.equal(s.bpm, MAX_BPM);
  assert.equal(s.beatsPerBar, MAX_METER);
  assert.equal(s.subdivision, MAX_SUBDIVISION);

  const low = makeStep({ bars: 0, bpm: 1, beatsPerBar: 0, subdivision: -3 });
  assert.equal(low.bars, 1);
  assert.equal(low.bpm, MIN_BPM);
  assert.equal(low.beatsPerBar, 1);
  assert.equal(low.subdivision, 1);

  const junk = makeStep({ bars: 'abc', name: 42 });
  assert.equal(junk.bars, 4);
  assert.equal(junk.bpm, 120);
  assert.equal(junk.name, '');
});

test('makeStep gives each step its own id', () => {
  assert.notEqual(makeStep().id, makeStep().id);
});

test('songToSequence copies sections, uses song values as fallbacks and makes new ids', () => {
  const song = {
    title: 'Song', bpm: 90, beatsPerBar: 3,
    sections: [
      { id: 'a', name: 'Intro', bars: 2, bpm: 100, beatsPerBar: 4, subdivision: 2 },
      { id: 'b', name: 'Verse', bars: 8 },
    ],
  };
  const copy = songToSequence(song);
  assert.equal(copy.title, 'Song');
  assert.equal(copy.editable, true);
  assert.equal(copy.sections.length, 2);
  assert.deepEqual(
    { ...copy.sections[0], id: null },
    { id: null, name: 'Intro', bars: 2, bpm: 100, beatsPerBar: 4, subdivision: 2 }
  );
  assert.equal(copy.sections[1].bpm, 90);
  assert.equal(copy.sections[1].beatsPerBar, 3);
  assert.notEqual(copy.sections[0].id, 'a');
  assert.equal(song.sections[0].id, 'a'); // original untouched
});

test('songToSequence turns a song without sections into one step', () => {
  const copy = songToSequence({ title: 'Flat', bpm: 140, beatsPerBar: 4 });
  assert.equal(copy.sections.length, 1);
  assert.equal(copy.sections[0].bpm, 140);
});

test('newSequence starts from the current settings', () => {
  const seq = newSequence({ bpm: 77, beatsPerBar: 5, subdivision: 3 });
  assert.equal(seq.editable, true);
  assert.equal(seq.sections.length, 1);
  assert.equal(seq.sections[0].bpm, 77);
  assert.equal(seq.sections[0].beatsPerBar, 5);
  assert.equal(seq.sections[0].subdivision, 3);
});

test('updateStep changes one field, clamps it and keeps the id', () => {
  const steps = [makeStep({ bpm: 100 }), makeStep({ bpm: 110 })];
  const next = updateStep(steps, 1, 'bpm', 5000);
  assert.equal(next[1].bpm, MAX_BPM);
  assert.equal(next[1].id, steps[1].id);
  assert.equal(next[0], steps[0]);
  assert.equal(updateStep(steps, 9, 'bpm', 100), steps);
});

test('addStep copies the last step, or uses defaults on an empty list', () => {
  const steps = [makeStep({ bpm: 150, name: 'Verse' })];
  const next = addStep(steps);
  assert.equal(next.length, 2);
  assert.equal(next[1].bpm, 150);
  assert.equal(next[1].name, '');
  assert.equal(addStep([]).length, 1);
});

test('duplicateStep inserts a copy right after the original', () => {
  const steps = [makeStep({ bpm: 90 }), makeStep({ bpm: 100 })];
  const next = duplicateStep(steps, 0);
  assert.equal(next.length, 3);
  assert.equal(next[1].bpm, 90);
  assert.notEqual(next[1].id, next[0].id);
  assert.equal(next[2], steps[1]);
});

test('removeStep can empty the list', () => {
  const steps = [makeStep()];
  assert.deepEqual(removeStep(steps, 0), []);
});

test('moveStep swaps neighbours and ignores moves off either end', () => {
  const a = makeStep({ bpm: 90 });
  const b = makeStep({ bpm: 100 });
  assert.deepEqual(moveStep([a, b], 0, 1), [b, a]);
  assert.deepEqual(moveStep([a, b], 1, -1), [b, a]);
  const same = [a, b];
  assert.equal(moveStep(same, 0, -1), same);
  assert.equal(moveStep(same, 1, 1), same);
});
