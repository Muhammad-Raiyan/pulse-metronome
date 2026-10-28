export class AudioEngine {
  constructor() {
    this.audioCtx = null;
    this.scheduleAheadTime = 0.1; // 100ms lookahead
    this.nextNoteTime = 0.0;
    this.currentBeatInBar = 0;
    this.currentSubIndex = 0;
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

  start(bpm) {
    this.init();
    this.currentBeatInBar = 0;
    this.currentSubIndex = 0;
    this.nextNoteTime = this.audioCtx.currentTime + 0.05;
  }

  processTick(state, onVisualUpdate, onStateAdvance) {
    while (this.nextNoteTime < this.audioCtx.currentTime + this.scheduleAheadTime) {
      this.scheduleNote(this.nextNoteTime, state, onVisualUpdate);
      this.advanceNote(state, onStateAdvance);
    }
  }

  advanceNote(state, onStateAdvance) {
    const activeSubdiv = state.subdivision;
    const secondsPerBeat = 60.0 / state.bpm;
    const secondsPerSubTick = secondsPerBeat / activeSubdiv;

    this.nextNoteTime += secondsPerSubTick;

    state.currentSubIndex++;
    if (state.currentSubIndex >= activeSubdiv) {
      state.currentSubIndex = 0;
      state.currentBeatInBar++;

      if (state.currentBeatInBar >= state.beatsPerBar) {
        state.currentBeatInBar = 0;
        if (onStateAdvance) onStateAdvance('bar');
      } else {
        if (onStateAdvance) onStateAdvance('beat');
      }
    }
  }

  scheduleNote(time, state, onVisualUpdate) {
    const isMainBeat = state.currentSubIndex === 0;
    const beatNum = state.currentBeatInBar;
    const subNum = state.currentSubIndex;

    const delayMs = Math.max(0, (time - this.audioCtx.currentTime) * 1000);
    setTimeout(() => {
      onVisualUpdate(beatNum, subNum);
    }, delayMs);

    this.playTone(time, isMainBeat, beatNum, state);
  }

  playTone(time, isMainBeat, beatNum, state) {
    if (!this.audioCtx) return;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    let isAccented = isMainBeat && beatNum === 0;
    let freq = isMainBeat ? (isAccented ? 1200 : 850) : 600;
    let volume = (isAccented ? 1.0 : (isMainBeat ? 0.7 : 0.3)) * state.volume;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(volume, time + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);

    osc.start(time);
    osc.stop(time + 0.06);
  }
}