import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encodeMidi, vlq, midiFileName, PPQ } from './midiExport.js';
import { makeStep } from '../sequence.js';

// Minimal reader for the files we write: returns tracks as lists of { tick, bytes }
function readVlq(data, pos) {
  let value = 0;
  let byte;
  do {
    byte = data[pos++];
    value = (value << 7) | (byte & 0x7f);
  } while (byte & 0x80);
  return [value, pos];
}

function parse(data) {
  const text = (p, n) => String.fromCharCode(...data.slice(p, p + n));
  const u32 = (p) => ((data[p] << 24) | (data[p + 1] << 16) | (data[p + 2] << 8) | data[p + 3]) >>> 0;
  assert.equal(text(0, 4), 'MThd');
  const format = (data[8] << 8) | data[9];
  const trackCount = (data[10] << 8) | data[11];
  const division = (data[12] << 8) | data[13];
  const tracks = [];
  let pos = 14;
  for (let t = 0; t < trackCount; t++) {
    assert.equal(text(pos, 4), 'MTrk');
    const end = pos + 8 + u32(pos + 4);
    pos += 8;
    const events = [];
    let tick = 0;
    while (pos < end) {
      let delta;
      [delta, pos] = readVlq(data, pos);
      tick += delta;
      const status = data[pos++];
      if (status === 0xff) {
        const type = data[pos++];
        let len;
        [len, pos] = readVlq(data, pos);
        events.push({ tick, meta: type, data: [...data.slice(pos, pos + len)] });
        pos += len;
      } else {
        const len = (status & 0xf0) === 0xc0 ? 1 : 2;
        events.push({ tick, status, data: [...data.slice(pos, pos + len)] });
        pos += len;
      }
    }
    assert.equal(pos, end);
    tracks.push(events);
  }
  assert.equal(pos, data.length);
  return { format, division, tracks };
}

const decode = (bytes) => new TextDecoder().decode(Uint8Array.from(bytes));
const noteOns = (track) => track.filter((e) => e.status === 0x99 && e.data[1] > 0);

test('vlq encodes variable-length quantities', () => {
  assert.deepEqual(vlq(0), [0]);
  assert.deepEqual(vlq(127), [0x7f]);
  assert.deepEqual(vlq(128), [0x81, 0x00]);
  assert.deepEqual(vlq(16384), [0x81, 0x80, 0x00]);
});

test('encodeMidi writes a Type 1 file with tempo, click and marker tracks', () => {
  const midi = parse(encodeMidi([makeStep({ bars: 1 })]));
  assert.equal(midi.format, 1);
  assert.equal(midi.division, PPQ);
  assert.equal(midi.tracks.length, 3);
});

test('tempo track has a tempo and time signature at each section boundary', () => {
  const steps = [
    makeStep({ bars: 2, bpm: 120, beatsPerBar: 4 }),
    makeStep({ bars: 1, bpm: 90, beatsPerBar: 3, repeats: 2 }),
  ];
  const tempo = parse(encodeMidi(steps)).tracks[0];
  const tempos = tempo.filter((e) => e.meta === 0x51);
  assert.deepEqual(tempos.map((e) => e.tick), [0, 2 * 4 * PPQ]);
  assert.deepEqual(tempos[0].data, [0x07, 0xa1, 0x20]); // 500000 µs = 120 bpm
  assert.equal((tempos[1].data[0] << 16) | (tempos[1].data[1] << 8) | tempos[1].data[2], Math.round(60_000_000 / 90));
  const sigs = tempo.filter((e) => e.meta === 0x58);
  assert.deepEqual(sigs.map((e) => e.data[0]), [4, 3]);
});

test('click track places one note per beat with accent velocities and skips muted beats', () => {
  const step = makeStep({ bars: 1, beatsPerBar: 4, beatAccents: [0, 1, 2, 3] });
  const clicks = noteOns(parse(encodeMidi([step])).tracks[1]);
  assert.deepEqual(clicks.map((e) => e.tick), [0, PPQ, 2 * PPQ]);
  assert.deepEqual(clicks.map((e) => e.data[1]), [127, 80, 50]);
});

test('click track adds quiet subdivision notes between beats', () => {
  const step = makeStep({ bars: 1, beatsPerBar: 2, subdivision: 3 });
  const clicks = noteOns(parse(encodeMidi([step])).tracks[1]);
  assert.equal(clicks.length, 6);
  assert.deepEqual(clicks.slice(0, 3).map((e) => e.tick), [0, PPQ / 3, (2 * PPQ) / 3]);
  assert.equal(clicks[1].data[1], 40);
});

test('repeats play the step again, and the next section starts after all repeats', () => {
  const steps = [makeStep({ bars: 1, beatsPerBar: 1, repeats: 3 }), makeStep({ bars: 1, beatsPerBar: 1 })];
  const clicks = noteOns(parse(encodeMidi(steps)).tracks[1]);
  assert.deepEqual(clicks.map((e) => e.tick), [0, PPQ, 2 * PPQ, 3 * PPQ]);
});

test('marker track holds section names as UTF-8, with a fallback for unnamed steps', () => {
  const steps = [makeStep({ name: 'Intro', bars: 2 }), makeStep({ name: 'Rïff ♪' }), makeStep({ name: '' })];
  const markers = parse(encodeMidi(steps)).tracks[2].filter((e) => e.meta === 0x06);
  assert.deepEqual(markers.map((e) => decode(e.data)), ['Intro', 'Rïff ♪', 'Step 3']);
  assert.equal(markers[1].tick, 2 * 4 * PPQ);
});

test('program changes go on an extra track only when a step has pc', () => {
  assert.equal(parse(encodeMidi([makeStep()])).tracks.length, 3);

  const steps = [makeStep({ bars: 1 }), makeStep({ pc: 12 }), makeStep({ pc: 0 })];
  const midi = parse(encodeMidi(steps));
  assert.equal(midi.tracks.length, 4);
  const changes = midi.tracks[3].filter((e) => e.status === 0xc0);
  assert.deepEqual(changes.map((e) => [e.tick, e.data[0]]), [[4 * PPQ, 12], [20 * PPQ, 0]]);
});

test('every track ends at the song end', () => {
  const steps = [makeStep({ bars: 2 }), makeStep({ bars: 1, repeats: 2 })];
  const endTick = (2 * 4 + 2 * 4) * PPQ;
  for (const track of parse(encodeMidi(steps)).tracks) {
    const last = track[track.length - 1];
    assert.equal(last.meta, 0x2f);
    assert.equal(last.tick, endTick);
  }
});

test('midiFileName strips unsafe characters and falls back to "song"', () => {
  assert.equal(midiFileName('Master of Puppets'), 'Master-of-Puppets.mid');
  assert.equal(midiFileName('AC/DC: Back?'), 'ACDC-Back.mid');
  assert.equal(midiFileName(''), 'song.mid');
});
