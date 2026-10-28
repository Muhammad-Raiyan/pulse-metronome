import React, { useState, useEffect, useRef } from 'react';
import { AudioEngine } from '../audio/AudioEngine';
import { 
  Play, Square, Plus, Minus, Activity, Volume2, Hand, 
  Cpu, Zap, Layers, Info, Sliders 
} from 'lucide-react';

export function Metronome() {
  // Main Metronome State
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [beatsPerBar, setBeatsPerBar] = useState(4);
  const [subdivision, setSubdivision] = useState(1);
  const [soundProfile, setSoundProfile] = useState('woodblock');
  const [accentStyle, setAccentStyle] = useState('first');
  const [volume, setVolume] = useState(0.8);
  const [activeBeat, setActiveBeat] = useState({ beat: 0, sub: 0 });

  // Automation Modes: 'manual' | 'gradual' | 'jogsprint'
  const [automationMode, setAutomationMode] = useState('manual');

  // Gradual Ramp Up State
  const [gradualMetric, setGradualMetric] = useState('bars'); // 'bars' | 'seconds'
  const [gradualInterval, setGradualInterval] = useState(4);
  const [gradualStep, setGradualStep] = useState(4);
  const [gradualCap, setGradualCap] = useState(200);

  // Jog/Sprint State
  const [sprintType, setSprintType] = useState('bpm'); // 'bpm' | 'subdivision'
  const [jogBpm, setJogBpm] = useState(100);
  const [sprintBpm, setSprintBpm] = useState(140);
  const [jogBars, setJogBars] = useState(4);
  const [sprintBars, setSprintBars] = useState(2);

  const [subdivMetric, setSubdivMetric] = useState('bars'); // 'bars' | 'beats'
  const [jogSubdiv, setJogSubdiv] = useState(2);
  const [sprintSubdiv, setSprintSubdiv] = useState(4);
  const [jogUnits, setJogUnits] = useState(3);
  const [sprintUnits, setSprintUnits] = useState(1);

  // Runtime Tracking for Banner Displays
  const [isSprintPhase, setIsSprintPhase] = useState(false);
  const [unitsElapsed, setUnitsElapsed] = useState(0);

  // Refs for Web Worker & Audio Engine
  const audioEngineRef = useRef(null);
  const workerRef = useRef(null);
  const tapTimesRef = useRef([]);

  // Mutable State Ref passed into Audio Engine tick processor
  const stateRef = useRef({});

  // Synchronize stateRef with current component state
  useEffect(() => {
    stateRef.current = {
      bpm,
      beatsPerBar,
      subdivision: (automationMode === 'jogsprint' && sprintType === 'subdivision')
        ? (isSprintPhase ? sprintSubdiv : jogSubdiv)
        : subdivision,
      soundProfile,
      accentStyle,
      volume,
      automationMode,
      gradualMetric,
      gradualInterval,
      gradualStep,
      gradualCap,
      sprintType,
      jogBpm,
      sprintBpm,
      jogBars,
      sprintBars,
      subdivMetric,
      jogSubdiv,
      sprintSubdiv,
      jogUnits,
      sprintUnits,
      isSprintPhase,
      unitsElapsed
    };
  }, [
    bpm, beatsPerBar, subdivision, soundProfile, accentStyle, volume,
    automationMode, gradualMetric, gradualInterval, gradualStep, gradualCap,
    sprintType, jogBpm, sprintBpm, jogBars, sprintBars,
    subdivMetric, jogSubdiv, sprintSubdiv, jogUnits, sprintUnits,
    isSprintPhase, unitsElapsed
  ]);

  useEffect(() => {
    audioEngineRef.current = new AudioEngine();

    workerRef.current = new Worker(
      new URL('/src/audio/schedulerWorker.js', import.meta.url),
      { type: 'module' }
    );

    workerRef.current.onmessage = (e) => {
      if (e.data === 'tick' && audioEngineRef.current) {
        audioEngineRef.current.processTick(
          stateRef.current,
          (beat, sub) => setActiveBeat({ beat, sub }),
          handleStateAdvance
        );
      }
    };

    return () => {
      if (workerRef.current) {
        workerRef.current.postMessage({ command: 'stop' });
        workerRef.current.terminate();
      }
    };
  }, []);

  // Progression logic called when bars/beats advance
  const handleStateAdvance = (type) => {
    const s = stateRef.current;

    // 1. Gradual Mode
    if (s.automationMode === 'gradual' && s.gradualMetric === 'bars' && type === 'bar') {
      setUnitsElapsed((prev) => {
        const next = prev + 1;
        if (next >= s.gradualInterval) {
          if (s.bpm < s.gradualCap) {
            setBpm((b) => Math.min(s.gradualCap, b + s.gradualStep));
          }
          return 0;
        }
        return next;
      });
    }

    // 2. Jog / Sprint Mode
    else if (s.automationMode === 'jogsprint') {
      const isBarTrigger = (s.sprintType === 'bpm' || (s.sprintType === 'subdivision' && s.subdivMetric === 'bars')) && type === 'bar';
      const isBeatTrigger = (s.sprintType === 'subdivision' && s.subdivMetric === 'beats') && (type === 'beat' || type === 'bar');

      if (isBarTrigger || isBeatTrigger) {
        setUnitsElapsed((prev) => {
          const targetLimit = s.isSprintPhase
            ? (s.sprintType === 'bpm' ? s.sprintBars : s.sprintUnits)
            : (s.sprintType === 'bpm' ? s.jogBars : s.jogUnits);

          const next = prev + 1;
          if (next >= targetLimit) {
            const nextSprintState = !s.isSprintPhase;
            setIsSprintPhase(nextSprintState);

            if (s.sprintType === 'bpm') {
              setBpm(nextSprintState ? s.sprintBpm : s.jogBpm);
            }
            return 0;
          }
          return next;
        });
      }
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      workerRef.current.postMessage({ command: 'stop' });
      setIsPlaying(false);
      setIsSprintPhase(false);
      setUnitsElapsed(0);
    } else {
      setUnitsElapsed(0);
      setIsSprintPhase(false);

      if (automationMode === 'jogsprint' && sprintType === 'bpm') {
        setBpm(jogBpm);
      }

      audioEngineRef.current.start(bpm);
      workerRef.current.postMessage({ command: 'start' });
      setIsPlaying(true);
    }
  };

  const handleTapTempo = () => {
    const now = performance.now();
    tapTimesRef.current.push(now);
    if (tapTimesRef.current.length > 4) tapTimesRef.current.shift();

    if (tapTimesRef.current.length > 1) {
      const intervals = [];
      for (let i = 1; i < tapTimesRef.current.length; i++) {
        intervals.push(tapTimesRef.current[i] - tapTimesRef.current[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
      const calculatedBpm = Math.round(60000 / avgInterval);
      setBpm(Math.min(300, Math.max(30, calculatedBpm)));
    }
  };

  const activeSubdiv = (automationMode === 'jogsprint' && sprintType === 'subdivision')
    ? (isSprintPhase ? sprintSubdiv : jogSubdiv)
    : subdivision;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 md:p-6 font-sans">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: Main Metronome & Visuals */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main Display Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 relative overflow-hidden flex flex-col items-center justify-between min-h-[340px] shadow-2xl">
            
            {/* Live Phase Banner */}
            <div className={`w-full flex items-center justify-between px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider mb-2 border ${
              isSprintPhase 
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' 
                : 'bg-slate-800/80 border-slate-700/60 text-slate-300'
            }`}>
              <span className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isPlaying ? (isSprintPhase ? 'bg-amber-400 animate-ping' : 'bg-cyan-400 animate-pulse') : 'bg-slate-500'}`} />
                <span>
                  {automationMode === 'manual' && 'Manual Mode'}
                  {automationMode === 'gradual' && `Ramp Up (+${gradualStep} BPM)`}
                  {automationMode === 'jogsprint' && (isSprintPhase ? '🔥 SPRINT PHASE' : '🏃 JOG PHASE')}
                </span>
              </span>
              <span className="font-mono text-cyan-400">
                {automationMode === 'manual' && (isPlaying ? 'Active' : 'Ready')}
                {automationMode === 'gradual' && `Step ${unitsElapsed + 1}/${gradualInterval}`}
                {automationMode === 'jogsprint' && `Unit ${unitsElapsed + 1}/${
                  isSprintPhase 
                    ? (sprintType === 'bpm' ? sprintBars : sprintUnits) 
                    : (sprintType === 'bpm' ? jogBars : jogUnits)
                }`}
              </span>
            </div>

            {/* Big BPM Display */}
            <div className="text-center my-4">
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-7xl md:text-8xl font-black font-mono tracking-tighter text-slate-100">{bpm}</span>
                <span className="text-slate-400 font-bold text-lg">BPM</span>
              </div>
            </div>

            {/* Main Beat Grid */}
            <div className="w-full space-y-3">
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {Array.from({ length: beatsPerBar }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center font-mono font-bold transition-all duration-75 ${
                      activeBeat.beat === i && activeBeat.sub === 0
                        ? 'bg-cyan-500 text-slate-950 scale-110 shadow-lg shadow-cyan-500/40'
                        : 'bg-slate-950 border border-slate-800 text-slate-400'
                    }`}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* Sub-tick Grid */}
              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                {Array.from({ length: activeSubdiv }).map((_, s) => (
                  <div
                    key={s}
                    className={`w-3 h-3 md:w-4 md:h-4 rounded-full transition-all duration-75 ${
                      activeBeat.sub === s
                        ? 'bg-amber-400 scale-125 shadow-md shadow-amber-400/50'
                        : 'bg-slate-800'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Slider & Quick Tweaks */}
            <div className="w-full space-y-3 mt-4">
              <div className="flex items-center gap-3">
                <button onClick={() => setBpm(b => Math.max(30, b - 1))} className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition">
                  <Minus className="w-5 h-5" />
                </button>
                <input
                  type="range" min="30" max="300" value={bpm}
                  onChange={(e) => setBpm(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <button onClick={() => setBpm(b => Math.min(300, b + 1))} className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition">
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex gap-1.5">
                  <button onClick={() => setBpm(b => Math.max(30, b - 10))} className="px-2.5 py-1 text-xs bg-slate-800 rounded-lg text-slate-300">-10</button>
                  <button onClick={() => setBpm(b => Math.max(30, b - 5))} className="px-2.5 py-1 text-xs bg-slate-800 rounded-lg text-slate-300">-5</button>
                </div>
                <button onClick={handleTapTempo} className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-cyan-500/20 text-cyan-400 text-xs font-semibold flex items-center gap-1.5 border border-slate-700">
                  <Hand className="w-3.5 h-3.5" /> Tap Tempo
                </button>
                <div className="flex gap-1.5">
                  <button onClick={() => setBpm(b => Math.min(300, b + 5))} className="px-2.5 py-1 text-xs bg-slate-800 rounded-lg text-slate-300">+5</button>
                  <button onClick={() => setBpm(b => Math.min(300, b + 10))} className="px-2.5 py-1 text-xs bg-slate-800 rounded-lg text-slate-300">+10</button>
                </div>
              </div>
            </div>

          </div>

          {/* Play/Stop & Audio Settings */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-4">
            <button
              onClick={togglePlay}
              className={`w-full py-4 rounded-2xl font-extrabold text-lg flex items-center justify-center gap-2 shadow-lg transition active:scale-95 ${
                isPlaying ? 'bg-rose-500 hover:bg-rose-400 text-slate-950' : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
              }`}
            >
              {isPlaying ? <Square className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              <span>{isPlaying ? 'STOP METRONOME' : 'START METRONOME'}</span>
            </button>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5">
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Time Signature</label>
                <select value={beatsPerBar} onChange={(e) => setBeatsPerBar(Number(e.target.value))} className="bg-transparent text-sm font-semibold w-full focus:outline-none">
                  <option value="2">2/4</option>
                  <option value="3">3/4</option>
                  <option value="4">4/4</option>
                  <option value="5">5/4</option>
                  <option value="6">6/8</option>
                </select>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5">
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Subdivision</label>
                <select value={subdivision} onChange={(e) => setSubdivision(Number(e.target.value))} className="bg-transparent text-sm font-semibold w-full focus:outline-none">
                  <option value="1">Quarter Notes</option>
                  <option value="2">Eighth Notes</option>
                  <option value="3">Triplets</option>
                  <option value="4">Sixteenth Notes</option>
                  <option value="5">Quintuplets</option>
                  <option value="6">Sextuplets</option>
                  <option value="7">Septuplets</option>
                  <option value="8">Octuplets</option>
                </select>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Automation Features */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <h2 className="font-bold text-sm">Automation Engine</h2>
              </div>
            </div>

            {/* Automation Mode Selector */}
            <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs font-semibold">
              <button onClick={() => setAutomationMode('manual')} className={`py-2 rounded-xl transition ${automationMode === 'manual' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400'}`}>Manual</button>
              <button onClick={() => setAutomationMode('gradual')} className={`py-2 rounded-xl transition ${automationMode === 'gradual' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400'}`}>Ramp Up</button>
              <button onClick={() => setAutomationMode('jogsprint')} className={`py-2 rounded-xl transition ${automationMode === 'jogsprint' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400'}`}>Jog / Sprint</button>
            </div>

            {/* PANEL: MANUAL */}
            {automationMode === 'manual' && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 text-xs leading-relaxed space-y-1">
                <p className="font-semibold text-slate-200 flex items-center gap-1.5"><Info className="w-4 h-4 text-cyan-400" /> Standard Constant Click</p>
                <p>Runs continuously at your configured BPM and subdivision settings without automated shifts.</p>
              </div>
            )}

            {/* PANEL: GRADUAL RAMP UP */}
            {automationMode === 'gradual' && (
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Increase Every (Bars)</label>
                    <input type="number" value={gradualInterval} onChange={(e) => setGradualInterval(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-sm font-semibold focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">BPM Increase (+ Step)</label>
                    <input type="number" value={gradualStep} onChange={(e) => setGradualStep(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-sm font-semibold focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Target Max Cap BPM</label>
                  <input type="number" value={gradualCap} onChange={(e) => setGradualCap(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-sm font-semibold focus:outline-none" />
                </div>
              </div>
            )}

            {/* PANEL: JOG / SPRINT */}
            {automationMode === 'jogsprint' && (
              <div className="space-y-4">
                {/* Toggle strategy */}
                <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                  <button onClick={() => setSprintType('bpm')} className={`py-1.5 rounded-xl text-xs font-semibold ${sprintType === 'bpm' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'text-slate-400'}`}>
                    BPM Jump (Bars)
                  </button>
                  <button onClick={() => setSprintType('subdivision')} className={`py-1.5 rounded-xl text-xs font-semibold ${sprintType === 'subdivision' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'text-slate-400'}`}>
                    Subdivision Burst
                  </button>
                </div>

                {/* STRATEGY A: BPM JUMP */}
                {sprintType === 'bpm' && (
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <p className="text-[11px] text-cyan-400 font-medium flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> Bar-based variable tempo shifts</p>
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Jog Tempo (BPM)</label>
                        <input type="number" value={jogBpm} onChange={(e) => setJogBpm(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-sm font-semibold" />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Sprint Tempo (BPM)</label>
                        <input type="number" value={sprintBpm} onChange={(e) => setSprintBpm(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-sm font-semibold" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Jog Duration (Bars)</label>
                        <input type="number" value={jogBars} onChange={(e) => setJogBars(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-sm font-semibold" />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Sprint Duration (Bars)</label>
                        <input type="number" value={sprintBars} onChange={(e) => setSprintBars(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-sm font-semibold" />
                      </div>
                    </div>
                  </div>
                )}

                {/* STRATEGY B: SUBDIVISION BURST */}
                {sprintType === 'subdivision' && (
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <p className="text-[11px] text-amber-400 font-medium flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> Density burst (Constant BPM)</p>
                    <div className="flex items-center justify-between text-xs py-1">
                      <span className="text-slate-400">Boundary Trigger</span>
                      <div className="flex gap-3">
                        <label className="inline-flex items-center gap-1 text-slate-300">
                          <input type="radio" name="subdivMetric" value="bars" checked={subdivMetric === 'bars'} onChange={() => setSubdivMetric('bars')} className="accent-cyan-400" /> Bars
                        </label>
                        <label className="inline-flex items-center gap-1 text-slate-300">
                          <input type="radio" name="subdivMetric" value="beats" checked={subdivMetric === 'beats'} onChange={() => setSubdivMetric('beats')} className="accent-cyan-400" /> Beats
                        </label>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Jog Subdivision</label>
                        <select value={jogSubdiv} onChange={(e) => setJogSubdiv(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-1.5 text-xs font-semibold">
                          <option value="1">1 - Quarter Notes</option>
                          <option value="2">2 - Eighth Notes</option>
                          <option value="3">3 - Triplets</option>
                          <option value="4">4 - Sixteenth Notes</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Sprint Subdivision</label>
                        <select value={sprintSubdiv} onChange={(e) => setSprintSubdiv(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-1.5 text-xs font-semibold">
                          <option value="2">2 - Eighth Notes</option>
                          <option value="3">3 - Triplets</option>
                          <option value="4">4 - Sixteenth Notes</option>
                          <option value="5">5 - Quintuplets</option>
                          <option value="6">6 - Sextuplets</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Jog ({subdivMetric})</label>
                        <input type="number" value={jogUnits} onChange={(e) => setJogUnits(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-sm font-semibold" />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Sprint ({subdivMetric})</label>
                        <input type="number" value={sprintUnits} onChange={(e) => setSprintUnits(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-sm font-semibold" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}