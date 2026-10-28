import { ACCENT_TYPES } from '../constants.js';
import { AccuracyStats } from './accuracyStats.js';

export class AudioEngine {
  // `stats` is an optional AccuracyStats (debug mode only). When null, nothing is recorded.
  constructor({ stats = null } = {}) {
    this.stats = stats;
    this.audioCtx = null;
    this.scheduleAheadTime = 0.1; // 100ms lookahead
    this.nextNoteTime = 0.0;
    this.currentBeatInBar = 0;
    this.currentSubIndex = 0;
    this.pendingTimeouts = new Set();
    this.activeGains = new Set();
    this.resetStatsWarmup();
  }

  // Debug stats skip the first bar: the audio clock and timers are still settling then, which
  // would show up as fake drift and jitter. `statsFrom` is the audio-clock time of the second
  // bar's downbeat; nothing is recorded before the audio clock reaches it.
  resetStatsWarmup() {
    this.statsFrom = null;
    this.firstNoteScheduled = false;
  }

  statsActive() {
    return this.statsFrom !== null && this.audioCtx.currentTime >= this.statsFrom;
  }

  init() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  start() {
    this.init();
    if (this.stats) this.stats.reset();
    this.resetStatsWarmup();
    this.currentBeatInBar = 0;
    this.currentSubIndex = 0;
    this.nextNoteTime = this.audioCtx.currentTime + 0.05;
  }

  // Cancel pending visual updates and silence notes that are already scheduled
  stop() {
    if (this.stats) this.stats.markStopped();
    this.pendingTimeouts.forEach((id) => clearTimeout(id));
    this.pendingTimeouts.clear();
    this.activeGains.forEach((gain) => gain.disconnect());
    this.activeGains.clear();
  }

  // Debug mode can be switched on or off while the app is running
  setDebug(on) {
    this.stats = on ? new AccuracyStats() : null;
  }

  // Current accuracy numbers plus device latency, or null when debug mode is off
  getDebugSnapshot() {
    if (!this.stats) return null;
    const ctx = this.audioCtx;
    const ms = (v) => (typeof v === 'number' ? v * 1000 : null);
    return {
      ...this.stats.snapshot(),
      lookaheadMs: this.scheduleAheadTime * 1000,
      baseLatencyMs: ms(ctx?.baseLatency),
      outputLatencyMs: ms(ctx?.outputLatency),
      sampleRate: ctx?.sampleRate ?? null,
      contextState: ctx?.state ?? null,
    };
  }

  processTick(state, onVisualUpdate, onStateAdvance) {
    if (this.stats && this.statsActive()) this.stats.tick(performance.now(), this.audioCtx.currentTime);
    while (this.nextNoteTime < this.audioCtx.currentTime + this.scheduleAheadTime) {
      this.alignPosition(state, onStateAdvance);
      this.scheduleNote(this.nextNoteTime, state, onVisualUpdate);
      this.advanceNote(state, onStateAdvance);
    }
  }

  // The meter or subdivision can change while playing (buttons, song sections, sprint
  // bursts). Make sure our position is still valid for the *current* settings before the
  // next note is scheduled, so an out-of-range beat/sub index is never played or shown.
  alignPosition(state, onStateAdvance) {
    const subdivision = state.subdivision || 1;
    const beatsPerBar = state.beatsPerBar || 1;

    if (this.currentBeatInBar >= beatsPerBar) {
      // Meter got shorter than our position: start a fresh bar on its downbeat.
      // This is a restart, not a completed bar, so no 'bar' event is emitted.
      this.currentBeatInBar = 0;
      this.currentSubIndex = 0;
    } else if (this.currentSubIndex >= subdivision) {
      // Subdivision got coarser mid-beat (e.g. 10x -> 2x at sub 7): the rest of the
      // old beat no longer exists, so treat it as finished and move to the next beat.
      this.currentSubIndex = 0;
      this.currentBeatInBar++;
      if (this.currentBeatInBar >= beatsPerBar) {
        this.currentBeatInBar = 0;
        if (onStateAdvance) onStateAdvance('bar');
      } else if (onStateAdvance) {
        onStateAdvance('beat');
      }
    }
  }

  advanceNote(state, onStateAdvance) {
    const activeSubdiv = state.subdivision || 1;
    const secondsPerBeat = 60.0 / state.bpm;
    const secondsPerSubTick = secondsPerBeat / activeSubdiv;

    this.nextNoteTime += secondsPerSubTick;

    this.currentSubIndex++;
    if (this.currentSubIndex >= activeSubdiv) {
      this.currentSubIndex = 0;
      this.currentBeatInBar++;

      if (this.currentBeatInBar >= state.beatsPerBar) {
        this.currentBeatInBar = 0;
        if (onStateAdvance) onStateAdvance('bar');
      } else {
        if (onStateAdvance) onStateAdvance('beat');
      }
    }
  }

  scheduleNote(time, state, onVisualUpdate) {
    const beatNum = this.currentBeatInBar;
    const subNum = this.currentSubIndex;
    const isMainBeat = subNum === 0;

    const delayMs = Math.max(0, (time - this.audioCtx.currentTime) * 1000);
    // The first downbeat after the opening note marks the end of bar 1
    if (this.statsFrom === null && this.firstNoteScheduled && beatNum === 0 && subNum === 0) {
      this.statsFrom = time;
    }
    this.firstNoteScheduled = true;

    // Capture the stats object: debug mode can be toggled while a callback is pending
    const stats = this.stats && this.statsFrom !== null && time >= this.statsFrom ? this.stats : null;
    const statsSeq = stats
      ? stats.noteScheduled({ beat: beatNum, sub: subNum, target: time, now: this.audioCtx.currentTime })
      : -1;

    const id = setTimeout(() => {
      this.pendingTimeouts.delete(id);
      if (stats) stats.visualFired(statsSeq, this.audioCtx.currentTime);
      if (onVisualUpdate) {
        onVisualUpdate(beatNum, subNum);
      }
    }, delayMs);
    this.pendingTimeouts.add(id);

    this.playTone(time, isMainBeat, beatNum, state);
  }

  playTone(time, isMainBeat, beatNum, state) {
    if (!this.audioCtx) return;

    // Auto-resume if context was suspended by mobile browser power-saving
    if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
    }
    // 0. MUTE TRAINER SILENT BAR CHECK
    if (state.isMutePhase) return;

    // Read per-beat accent profile; unknown values fall back to the default so
    // a bad entry can never leave freq/volume undefined and throw in the scheduler
    const requested = state.beatAccents ? state.beatAccents[beatNum] : undefined;
    const beatAccent = Object.values(ACCENT_TYPES).includes(requested)
      ? requested
      : (beatNum === 0 ? ACCENT_TYPES.ACCENT : ACCENT_TYPES.NORMAL);

    // If beat tile is explicitly muted, skip tone
    if (beatAccent === ACCENT_TYPES.MUTED && isMainBeat) return;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    let freq;
    let volume;
    let waveType = 'triangle';

    // 1. COUNT-IN / PRE-ROLL DISTINCT SOUND
    if (state.isDelayPhase) {
      waveType = 'sine';
      freq = (isMainBeat && beatNum === 0) ? 2000 : 1500;
      volume = (isMainBeat ? 0.85 : 0.45) * (state.volume || 0.8);
    } 
    // 2. SPRINT PHASE OR SPEED CAP PEAK ALERT SOUND
    else if ((state.isSprintPhase || state.isSpeedCapReached) && isMainBeat && beatNum === 0) {
      waveType = 'sine';
      freq = 2400; // High Alert Bell
      volume = 1.0 * (state.volume || 0.8);
    }
    // 3. REGULAR METRONOME CLICK WITH PER-BEAT ACCENTS
    else {
      if (isMainBeat) {
        if (beatAccent === ACCENT_TYPES.ACCENT) { // Accented
          freq = 1200;
          volume = 1.0;
        } else if (beatAccent === ACCENT_TYPES.NORMAL) { // Normal
          freq = 850;
          volume = 0.7;
        } else if (beatAccent === ACCENT_TYPES.SOFT) { // Soft
          freq = 650;
          volume = 0.35;
        }
      } else {
        // Sub-ticks
        freq = 600;
        volume = 0.3;
      }
      volume *= (state.volume || 0.8);
    }

    osc.type = waveType;
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(volume, time + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + (state.isDelayPhase ? 0.035 : 0.05));

    this.activeGains.add(gain);
    osc.onended = () => {
      this.activeGains.delete(gain);
      osc.disconnect();
      gain.disconnect();
    };

    osc.start(time);
    osc.stop(time + 0.05);
  }
}