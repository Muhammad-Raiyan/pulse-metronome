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

    setTimeout(() => {
      if (onVisualUpdate) {
        onVisualUpdate(beatNum, subNum);
      }
    }, delayMs);

    this.playTone(time, isMainBeat, beatNum, state);
  }

  playTone(time, isMainBeat, beatNum, state) {
    if (!this.audioCtx) return;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    let freq;
    let volume;
    let waveType = 'triangle';

    // 1. DISTINCT COUNT-IN / PRE-ROLL SOUND
    if (state.isDelayPhase) {
      waveType = 'sine';
      // Crisp, high-pitched tick (2000Hz on beat 1, 1500Hz on other beats)
      freq = (isMainBeat && beatNum === 0) ? 2000 : 1500;
      volume = (isMainBeat ? 0.85 : 0.45) * (state.volume || 0.8);
    } 
    // 2. REGULAR METRONOME CLICK
    else {
      let isAccented = isMainBeat && beatNum === 0;
      freq = isMainBeat ? (isAccented ? 1200 : 850) : 600;
      volume = (isAccented ? 1.0 : (isMainBeat ? 0.7 : 0.3)) * (state.volume || 0.8);
    }

    osc.type = waveType;
    osc.frequency.setValueAtTime(freq, time);

    // Envelope shaping
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(volume, time + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + (state.isDelayPhase ? 0.035 : 0.05));

    osc.start(time);
    osc.stop(time + 0.05);
  }
}