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

    // 0. MUTE TRAINER SILENT BAR CHECK
    if (state.isMutePhase) return;

    // Read per-beat accent profile
    const beatAccent = (state.beatAccents && state.beatAccents[beatNum] !== undefined)
      ? state.beatAccents[beatNum]
      : (beatNum === 0 ? 0 : 1);

    // If beat tile is explicitly muted, skip tone
    if (beatAccent === 3 && isMainBeat) return;

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
        if (beatAccent === 0) { // Accented
          freq = 1200;
          volume = 1.0;
        } else if (beatAccent === 1) { // Normal
          freq = 850;
          volume = 0.7;
        } else if (beatAccent === 2) { // Soft
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

    osc.start(time);
    osc.stop(time + 0.05);
  }
}