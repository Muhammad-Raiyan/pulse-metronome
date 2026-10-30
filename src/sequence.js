import { clampBpm } from './constants.js';

// Limits for one step of a song / custom sequence
export const MAX_STEP_BARS = 32;
export const MAX_METER = 12;
export const MAX_SUBDIVISION = 10;

const DEFAULT_BARS = 4;

const clampInt = (value, min, max, fallback) => {
  const n = Math.round(Number(value));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

let idCounter = 0;
const newId = () => `step-${++idCounter}`;

// Build a valid step from anything that looks like one. Every value ends up in range.
export function makeStep(values = {}, defaults = {}) {
  const v = { ...defaults, ...values };
  return {
    id: newId(),
    name: typeof v.name === 'string' ? v.name : '',
    bars: clampInt(v.bars, 1, MAX_STEP_BARS, DEFAULT_BARS),
    bpm: clampBpm(v.bpm || 120),
    beatsPerBar: clampInt(v.beatsPerBar, 1, MAX_METER, 4),
    subdivision: clampInt(v.subdivision, 1, MAX_SUBDIVISION, 1),
  };
}

// Editable working copy of a library song. Sections missing a value fall back to the song's own.
export function songToSequence(song) {
  const defaults = { bpm: song.bpm, beatsPerBar: song.beatsPerBar, subdivision: song.subdivision };
  const sections = song.sections?.length
    ? song.sections.map((sec) => makeStep(sec, defaults))
    : [makeStep({}, defaults)];
  return { title: song.title, editable: true, sections };
}

// A fresh one-step sequence that starts from the current tempo, meter and subdivision
export function newSequence(current) {
  return { title: 'New sequence', editable: true, sections: [makeStep({}, current)] };
}

export function updateStep(steps, index, key, value) {
  if (!steps[index]) return steps;
  return steps.map((s, i) => (i === index ? makeStepKeepingId(s, { [key]: value }) : s));
}

// Same as makeStep but keeps the step's id so React rows stay stable while editing
function makeStepKeepingId(step, change) {
  return { ...makeStep({ ...step, ...change }), id: step.id };
}

// New step after the last one, copying the last step's settings (or defaults when empty)
export function addStep(steps) {
  const last = steps[steps.length - 1];
  return [...steps, makeStep({ ...last, name: '' })];
}

export function duplicateStep(steps, index) {
  if (!steps[index]) return steps;
  const copy = makeStep(steps[index]);
  return [...steps.slice(0, index + 1), copy, ...steps.slice(index + 1)];
}

export function removeStep(steps, index) {
  return steps.filter((_, i) => i !== index);
}

// Move a step by `delta` places (-1 = up, 1 = down); out-of-range moves change nothing
export function moveStep(steps, index, delta) {
  const target = index + delta;
  if (!steps[index] || target < 0 || target >= steps.length) return steps;
  const next = [...steps];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
