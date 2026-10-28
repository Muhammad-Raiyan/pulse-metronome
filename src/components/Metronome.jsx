import React, { useState, useEffect, useRef } from 'react';
import { AudioEngine } from '../audio/AudioEngine';
import { HeaderBanner } from './HeaderBanner';
import { MainDisplay } from './MainDisplay';
import { MetronomeControls } from './MetronomeControls';
import { AutomationEngine } from './AutomationEngine';

export function Metronome() {
  // --- Core State ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [beatsPerBar, setBeatsPerBar] = useState(4);
  const [subdivision, setSubdivision] = useState(1);
  const [volume, setVolume] = useState(0.8);
  const [activeBeat, setActiveBeat] = useState({ beat: 0, sub: 0 });

  // --- Count-In Delay State ---
  const [startDelayBars, setStartDelayBars] = useState(1);
  const [isDelayPhase, setIsDelayPhase] = useState(false);
  const [delayBarsElapsed, setDelayBarsElapsed] = useState(0);

  // --- Automation Engine State ---
  const [automationMode, setAutomationMode] = useState('manual');
  const [gradualInterval, setGradualInterval] = useState(4);
  const [gradualStep, setGradualStep] = useState(4);
  const [gradualCap, setGradualCap] = useState(200);

  const [sprintType, setSprintType] = useState('bpm');
  const [jogBpm, setJogBpm] = useState(100);
  const [sprintBpm, setSprintBpm] = useState(140);
  const [jogBars, setJogBars] = useState(4);
  const [sprintBars, setSprintBars] = useState(2);

  const [subdivMetric, setSubdivMetric] = useState('bars');
  const [jogSubdiv, setJogSubdiv] = useState(2);
  const [sprintSubdiv, setSprintSubdiv] = useState(4);
  const [jogUnits, setJogUnits] = useState(3);
  const [sprintUnits, setSprintUnits] = useState(1);

  const [isSprintPhase, setIsSprintPhase] = useState(false);
  const [unitsElapsed, setUnitsElapsed] = useState(0);

  // --- Refs ---
  const audioEngineRef = useRef(null);
  const workerRef = useRef(null);
  const tapTimesRef = useRef([]);

  const activeSubdiv = (automationMode === 'jogsprint' && sprintType === 'subdivision')
    ? (isSprintPhase ? sprintSubdiv : jogSubdiv)
    : subdivision;

  // Mutable state reference passed to AudioEngine tick processor
  const stateRef = useRef({});
  useEffect(() => {
    stateRef.current = {
      bpm,
      beatsPerBar,
      subdivision: activeSubdiv,
      volume,
      automationMode,
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
      unitsElapsed,
      startDelayBars,
      isDelayPhase,
      delayBarsElapsed
    };
  }, [
    bpm, beatsPerBar, activeSubdiv, volume, automationMode,
    gradualInterval, gradualStep, gradualCap, sprintType,
    jogBpm, sprintBpm, jogBars, sprintBars, subdivMetric,
    jogSubdiv, sprintSubdiv, jogUnits, sprintUnits, isSprintPhase, unitsElapsed,
    startDelayBars, isDelayPhase, delayBarsElapsed
  ]);

  // Handle Automation & Pre-roll Bar Progression
  const handleStateAdvance = (type) => {
    const s = stateRef.current;

    // 0. Count-In Pre-Roll Phase
    if (s.isDelayPhase && type === 'bar') {
      setDelayBarsElapsed((prev) => {
        const next = prev + 1;
        if (next >= s.startDelayBars) {
          setIsDelayPhase(false);
          return 0;
        }
        return next;
      });
      return;
    }

    // 1. Gradual Mode
    if (s.automationMode === 'gradual' && type === 'bar') {
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

  const advanceHandlerRef = useRef(handleStateAdvance);
  useEffect(() => {
    advanceHandlerRef.current = handleStateAdvance;
  });

  // Web Worker & Audio Engine Setup
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
          (type) => {
            if (advanceHandlerRef.current) {
              advanceHandlerRef.current(type);
            }
          }
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

  const togglePlay = () => {
    if (isPlaying) {
      workerRef.current.postMessage({ command: 'stop' });
      setIsPlaying(false);
      setIsSprintPhase(false);
      setIsDelayPhase(false);
      setUnitsElapsed(0);
      setDelayBarsElapsed(0);
      setActiveBeat({ beat: 0, sub: 0 });
    } else {
      setUnitsElapsed(0);
      setDelayBarsElapsed(0);
      setIsSprintPhase(false);

      if (startDelayBars > 0) {
        setIsDelayPhase(true);
      }

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
      setBpm(Math.min(300, Math.max(30, Math.round(60000 / avgInterval))));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 md:p-6 font-sans">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: Main Display & Primary Controls */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 relative overflow-hidden flex flex-col items-center justify-between min-h-[340px] shadow-2xl">
            <HeaderBanner
              isPlaying={isPlaying}
              isDelayPhase={isDelayPhase}
              startDelayBars={startDelayBars}
              delayBarsElapsed={delayBarsElapsed}
              automationMode={automationMode}
              gradualStep={gradualStep}
              gradualInterval={gradualInterval}
              isSprintPhase={isSprintPhase}
              unitsElapsed={unitsElapsed}
              sprintType={sprintType}
              sprintBars={sprintBars}
              sprintUnits={sprintUnits}
              jogBars={jogBars}
              jogUnits={jogUnits}
            />

            <MainDisplay
              bpm={bpm}
              setBpm={setBpm}
              beatsPerBar={beatsPerBar}
              activeSubdiv={activeSubdiv}
              isPlaying={isPlaying}
              activeBeat={activeBeat}
              handleTapTempo={handleTapTempo}
            />
          </div>

          <MetronomeControls
            isPlaying={isPlaying}
            togglePlay={togglePlay}
            beatsPerBar={beatsPerBar}
            setBeatsPerBar={setBeatsPerBar}
            subdivision={subdivision}
            setSubdivision={setSubdivision}
            startDelayBars={startDelayBars}
            setStartDelayBars={setStartDelayBars}
          />
        </div>

        {/* RIGHT COLUMN: Automation Panel */}
        <div className="lg:col-span-5 space-y-6">
          <AutomationEngine
            automationMode={automationMode}
            setAutomationMode={setAutomationMode}
            gradualInterval={gradualInterval}
            setGradualInterval={setGradualInterval}
            gradualStep={gradualStep}
            setGradualStep={setGradualStep}
            gradualCap={gradualCap}
            setGradualCap={setGradualCap}
            sprintType={sprintType}
            setSprintType={setSprintType}
            jogBpm={jogBpm}
            setJogBpm={setJogBpm}
            sprintBpm={sprintBpm}
            setSprintBpm={setSprintBpm}
            jogBars={jogBars}
            setJogBars={setJogBars}
            sprintBars={sprintBars}
            setSprintBars={setSprintBars}
            subdivMetric={subdivMetric}
            setSubdivMetric={setSubdivMetric}
            jogSubdiv={jogSubdiv}
            setJogSubdiv={setJogSubdiv}
            sprintSubdiv={sprintSubdiv}
            setSprintSubdiv={setSprintSubdiv}
            jogUnits={jogUnits}
            setJogUnits={setJogUnits}
            sprintUnits={sprintUnits}
            setSprintUnits={setSprintUnits}
          />
        </div>

      </div>
    </div>
  );
}