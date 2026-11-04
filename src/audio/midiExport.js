import { ACCENT_TYPES } from '../constants.js';

// 2520 = lcm(1..10), so every subdivision (1x–10x) lands on a whole tick.
export const PPQ = 2520;

const CLICK_CHANNEL = 9; // General MIDI percussion channel (channel 10)
const CLICK_NOTE = 37; // GM side stick
const CLICK_LENGTH = 126; // ticks a click note is held
const SUB_VELOCITY = 40;

// Velocity per accent type. Muted beats get no note: a note-on with velocity 0 means note-off.
const ACCENT_VELOCITY = {
  [ACCENT_TYPES.ACCENT]: 127,
  [ACCENT_TYPES.NORMAL]: 80,
  [ACCENT_TYPES.SOFT]: 50,
};

// Sort order for events sharing a tick: meta, program change, note-off, note-on
const ORDER = { meta: 0, program: 1, off: 2, on: 3 };

const utf8 = new TextEncoder();

// Variable-length quantity used for delta times and meta lengths
export function vlq(value) {
  let v = Math.max(0, Math.floor(value));
  const bytes = [v & 0x7f];
  while ((v >>= 7) > 0) bytes.unshift((v & 0x7f) | 0x80);
  return bytes;
}

const u16 = (n) => [(n >> 8) & 0xff, n & 0xff];
const u32 = (n) => [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff];
const ascii = (s) => [...s].map((c) => c.charCodeAt(0));

const meta = (tick, type, data) => ({ tick, order: ORDER.meta, bytes: [0xff, type, ...vlq(data.length), ...data] });
const textMeta = (tick, type, text) => meta(tick, type, [...utf8.encode(text)]);

// Length of one pass through a step, in ticks
const stepTicks = (step) => step.bars * step.beatsPerBar * PPQ;

// Total ticks a step occupies, including repeats
const stepSpan = (step) => stepTicks(step) * (step.repeats ?? 1);

// Start tick of each step plus the end tick of the whole song
export function layoutSteps(steps) {
  let tick = 0;
  const starts = steps.map((step) => {
    const start = tick;
    tick += stepSpan(step);
    return start;
  });
  return { starts, endTick: tick };
}

// Tempo and time-signature changes at every section boundary
export function buildTempoTrack(steps, name = 'Tempo map') {
  const { starts } = layoutSteps(steps);
  const events = [textMeta(0, 0x03, name)];
  steps.forEach((step, i) => {
    const mpqn = Math.round(60_000_000 / step.bpm);
    events.push(meta(starts[i], 0x51, [(mpqn >> 16) & 0xff, (mpqn >> 8) & 0xff, mpqn & 0xff]));
    // Denominator is always a quarter note (2 = 2^2); 24 clocks per click, 8 32nds per quarter
    events.push(meta(starts[i], 0x58, [step.beatsPerBar, 2, 24, 8]));
  });
  return events;
}

// One note per beat and per subdivision tick, velocity set by the beat's accent
export function buildClickTrack(steps, name = 'Click') {
  const { starts } = layoutSteps(steps);
  const events = [textMeta(0, 0x03, name)];
  const addNote = (tick, velocity) => {
    events.push({ tick, order: ORDER.on, bytes: [0x90 | CLICK_CHANNEL, CLICK_NOTE, velocity] });
    events.push({ tick: tick + CLICK_LENGTH, order: ORDER.off, bytes: [0x80 | CLICK_CHANNEL, CLICK_NOTE, 0] });
  };

  steps.forEach((step, i) => {
    const subTicks = PPQ / step.subdivision;
    const beats = step.bars * step.beatsPerBar;
    for (let r = 0; r < (step.repeats ?? 1); r++) {
      const passStart = starts[i] + r * stepTicks(step);
      for (let b = 0; b < beats; b++) {
        const accent = step.beatAccents?.[b % step.beatsPerBar] ?? (b % step.beatsPerBar === 0 ? ACCENT_TYPES.ACCENT : ACCENT_TYPES.NORMAL);
        const beatTick = passStart + b * PPQ;
        const velocity = ACCENT_VELOCITY[accent];
        if (velocity) addNote(beatTick, velocity);
        for (let s = 1; s < step.subdivision; s++) addNote(beatTick + s * subTicks, SUB_VELOCITY);
      }
    }
  });
  return events;
}

// A Marker meta-event (0x06) with the section name at each section start
export function buildMarkerTrack(steps, name = 'Sections') {
  const { starts } = layoutSteps(steps);
  const events = [textMeta(0, 0x03, name)];
  steps.forEach((step, i) => {
    events.push(textMeta(starts[i], 0x06, step.name || `Step ${i + 1}`));
  });
  return events;
}

// Program Change at the start of each step that has a `pc`; null when no step has one
export function buildProgramTrack(steps, name = 'Program changes') {
  if (!steps.some((s) => s.pc !== undefined)) return null;
  const { starts } = layoutSteps(steps);
  const events = [textMeta(0, 0x03, name)];
  steps.forEach((step, i) => {
    if (step.pc !== undefined) events.push({ tick: starts[i], order: ORDER.program, bytes: [0xc0, step.pc] });
  });
  return events;
}

// Turn an event list into an MTrk chunk. All tracks end at `endTick` so they have equal length.
export function encodeTrack(events, endTick) {
  const sorted = events
    .map((e, i) => ({ ...e, i }))
    .sort((a, b) => a.tick - b.tick || a.order - b.order || a.i - b.i);
  const body = [];
  let last = 0;
  for (const e of sorted) {
    body.push(...vlq(e.tick - last), ...e.bytes);
    last = e.tick;
  }
  body.push(...vlq(Math.max(0, endTick - last)), 0xff, 0x2f, 0x00);
  return [...ascii('MTrk'), ...u32(body.length), ...body];
}

// Type 1 MIDI file for a list of steps: tempo, click, markers and (optionally) program changes
export function encodeMidi(steps) {
  const { endTick } = layoutSteps(steps);
  const tracks = [buildTempoTrack(steps), buildClickTrack(steps), buildMarkerTrack(steps), buildProgramTrack(steps)]
    .filter(Boolean);
  const header = [...ascii('MThd'), ...u32(6), ...u16(1), ...u16(tracks.length), ...u16(PPQ)];
  return Uint8Array.from([...header, ...tracks.flatMap((t) => encodeTrack(t, endTick))]);
}

// File name safe for all platforms, based on the song title
export function midiFileName(title) {
  const base = String(title ?? '').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-');
  return `${base || 'song'}.mid`;
}
