// Timing-accuracy bookkeeping for the debug panel. Pure data structures, no audio or DOM,
// so it can be unit-tested and costs nothing when debug mode is off (it is never created).

export const WINDOW_SIZE = 100; // how many recent ticks (beats and subdivisions) are kept
export const DELAY_WARN_MS = 10; // display delay above this is flagged
export const TICK_TARGET_MS = 25; // schedulerWorker.js ticks every 25 ms
export const SPARK_POINTS = 50; // samples drawn in the debug sparklines

// Summary of a list (oldest first). stdDev is the population standard deviation; rms is the
// root-mean-square: the typical size of a deviation regardless of its sign.
export function describe(values) {
  const n = values.length;
  if (n === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((a, v) => a + (v - mean) ** 2, 0) / n;
  return {
    count: n,
    last: values[n - 1],
    rms: Math.sqrt(values.reduce((a, v) => a + v * v, 0) / n),
    min: sorted[0],
    max: sorted[n - 1],
    mean,
    p95: sorted[Math.min(n - 1, Math.ceil(n * 0.95) - 1)],
    stdDev: Math.sqrt(variance),
  };
}

// Rolling window of samples plus lifetime min/max (the worst case is what matters).
export class Series {
  constructor(capacity = 600) {
    this.capacity = capacity;
    this.reset();
  }

  reset() {
    this.values = [];
    this.next = 0;
    this.total = 0;
    this.min = Infinity;
    this.max = -Infinity;
    this.last = null;
  }

  add(value) {
    if (!Number.isFinite(value)) return;
    if (this.values.length < this.capacity) {
      this.values.push(value);
    } else {
      this.values[this.next] = value;
    }
    this.next = (this.next + 1) % this.capacity;
    this.total++;
    this.last = value;
    if (value < this.min) this.min = value;
    if (value > this.max) this.max = value;
  }

  // The most recent samples, oldest first (at most n)
  recent(n = this.capacity) {
    const ordered = [...this.values.slice(this.next), ...this.values.slice(0, this.next)];
    return ordered.slice(-n);
  }

  // min/max cover the whole run; mean, rms and p95 cover the most recent `capacity` samples.
  summary() {
    const d = describe(this.values);
    if (!d) return null;
    return { count: this.total, min: this.min, mean: d.mean, rms: d.rms, p95: d.p95, max: this.max, last: this.last };
  }
}

/**
 * Per-tick record, kept for the last `windowSize` ticks:
 *   target       intended time: the audio-clock second the note was calculated to sound at
 *   scheduledAt  audioCtx.currentTime when the scheduler loop handed the note over
 *   leadMs       (target - scheduledAt) in ms. Negative = handed over after it was due,
 *                i.e. the note is late by that amount (an audible timing error)
 *   firedAt      audioCtx.currentTime when the display callback for the tick ran
 *   delayMs      (firedAt - target) in ms: how late the display/main-thread work ran
 */
export class AccuracyStats {
  constructor(windowSize = WINDOW_SIZE) {
    this.windowSize = windowSize;
    this.tickIntervalMs = new Series(); // gap between scheduler ticks (nominal 25 ms)
    this.tickJitterMs = new Series(); // tick gap minus the nominal gap, signed
    this.delayMs = new Series(); // per-tick display delay over the whole run
    this.reset();
  }

  reset() {
    this.tickIntervalMs.reset();
    this.tickJitterMs.reset();
    this.delayMs.reset();
    this.ring = new Array(this.windowSize).fill(null);
    this.seq = 0;
    this.notes = 0;
    this.lateNotes = 0;
    this.lastTickMs = null;
    this.clockBase = null;
    this.driftMs = 0;
    this.elapsedMs = 0;
  }

  // A tick was handed to the audio engine. Returns its sequence number, which the display
  // callback passes back to visualFired().
  noteScheduled({ beat, sub, target, now }) {
    const seq = this.seq++;
    const leadMs = (target - now) * 1000;
    this.ring[seq % this.windowSize] = {
      seq, beat, sub, target, scheduledAt: now, leadMs, firedAt: null, delayMs: null,
    };
    this.notes++;
    if (leadMs < 0) this.lateNotes++;
    return seq;
  }

  // The display callback for tick `seq` ran at audio-clock time `now`.
  visualFired(seq, now) {
    if (seq < 0) return; // scheduled while stats were off
    const entry = this.ring[seq % this.windowSize];
    if (!entry || entry.seq !== seq) return; // already rolled out of the window
    entry.firedAt = now;
    entry.delayMs = (now - entry.target) * 1000;
    this.delayMs.add(entry.delayMs);
  }

  // Called on every scheduler tick with the system clock and the audio clock.
  tick(perfMs, audioTimeSec) {
    if (this.lastTickMs !== null) {
      this.tickIntervalMs.add(perfMs - this.lastTickMs);
      this.tickJitterMs.add(perfMs - this.lastTickMs - TICK_TARGET_MS);
    }
    this.lastTickMs = perfMs;

    if (this.clockBase === null) {
      this.clockBase = { perfMs, audioTimeSec };
      this.driftMs = 0;
      this.elapsedMs = 0;
    } else {
      this.elapsedMs = perfMs - this.clockBase.perfMs;
      // Positive: the audio clock ran ahead of the system clock since the run started
      this.driftMs = (audioTimeSec - this.clockBase.audioTimeSec) * 1000 - this.elapsedMs;
    }
  }

  // Playback stopped: don't count the pause as a huge tick gap on the next run
  markStopped() {
    this.lastTickMs = null;
  }

  // The recorded ticks, oldest first
  recent() {
    const out = [];
    for (let s = Math.max(0, this.seq - this.windowSize); s < this.seq; s++) {
      const entry = this.ring[s % this.windowSize];
      if (entry && entry.seq === s) out.push(entry);
    }
    return out;
  }

  windowSummary(entries = this.recent()) {
    const delays = entries.filter((e) => e.delayMs !== null).map((e) => e.delayMs);
    const lateLeads = entries.filter((e) => e.leadMs < 0).map((e) => -e.leadMs);
    return {
      ticks: entries.length,
      measured: delays.length,
      audioLate: lateLeads.length,
      worstAudioLateMs: lateLeads.length ? Math.max(...lateLeads) : 0,
      overWarn: delays.filter((d) => d > DELAY_WARN_MS).length,
      delay: describe(delays),
      lead: describe(entries.map((e) => e.leadMs)),
    };
  }

  snapshot() {
    const entries = this.recent().map((e) => ({ ...e }));
    return {
      notes: this.notes,
      lateNotes: this.lateNotes,
      tickInterval: this.tickIntervalMs.summary(),
      tickJitter: this.tickJitterMs.summary(),
      tickJitterRecent: this.tickJitterMs.recent(SPARK_POINTS),
      delayRun: this.delayMs.summary(),
      drift: { driftMs: this.driftMs, elapsedMs: this.elapsedMs },
      window: { entries, ...this.windowSummary(entries) },
    };
  }
}
