// src/components/Metronome.jsx

import { useState, useEffect, useRef, useCallback } from 'react';
import { AudioEngine } from '../audio/AudioEngine';
import { HeaderBanner } from './HeaderBanner';
import { MainDisplay } from './MainDisplay';
import { MetronomeControls } from './MetronomeControls';
import { AutomationEngine } from './AutomationEngine';
import { SongMapLoader } from './SongMapLoader';
import { AUTOMATION_MODES, SPRINT_STRATEGIES, SUBDIV_METRICS, ACCENT_TYPES, MIN_BPM, MAX_BPM, clampBpm } from '../constants';

export function Metronome() {
  // --- Core Metronome Configuration ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [beatsPerBar, setBeatsPerBar] = useState(4);
  const [subdivision, setSubdivision] = useState(1);
  const volume = 0.8;
  const [activeBeat, setActiveBeat] = useState({ beat: 0, sub: 0 });

  // --- Song Map State ---
  const [activeSongMap, setActiveSongMap] = useState(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);

  // Per-beat Accents Array (default: [Accented, Normal, Normal, Normal])
  const [beatAccents, setBeatAccents] = useState([0, 1, 1, 1]);

  // Fixed warning #2: Helper to handle beatsPerBar change & state update together without setState in useEffect
  const handleBeatsPerBarChange = useCallback((newBeats) => {
    setBeatsPerBar(newBeats);
    setBeatAccents((prev) => {
      const updated = [...prev];
      updated[0] = ACCENT_TYPES.ACCENT;
      while (updated.length < newBeats) {
        updated.push(ACCENT_TYPES.NORMAL); // Default new beats to Normal
      }
      return updated.slice(0, newBeats);
    });
  }, []);

  const toggleBeatAccent = (index) => {
    setBeatAccents((prev) => {
      const next = [...prev];
      const current = next[index] !== undefined ? next[index] : ACCENT_TYPES.NORMAL;
      next[index] = (current + 1) % Object.keys(ACCENT_TYPES).length; // Cycle 0 -> 1 -> 2 -> 3
      return next;
    });
  };

  // Apply a song-map section's tempo / meter / subdivision to the live state
  const applySection = useCallback((sec) => {
    if (!sec) return;
    if (sec.bpm) setBpm(clampBpm(sec.bpm));
    if (sec.beatsPerBar) handleBeatsPerBarChange(sec.beatsPerBar);
    setSubdivision(sec.subdivision || 1);
  }, [handleBeatsPerBarChange]);

  // --- Count-In Delay Configuration ---
  const [startDelayBars, setStartDelayBars] = useState(0);
  const [isDelayPhase, setIsDelayPhase] = useState(false);
  const [delayBarsElapsed, setDelayBarsElapsed] = useState(0);

  // --- Automation Engine State ---
  const [automationMode, setAutomationMode] = useState(AUTOMATION_MODES.MANUAL);
  const [gradualInterval, setGradualInterval] = useState(4);
  const [gradualStep, setGradualStep] = useState(4);
  const [gradualCap, setGradualCap] = useState(200);

  const [sprintType, setSprintType] = useState(SPRINT_STRATEGIES.BPM);
  const [jogBpm, setJogBpm] = useState(100);
  const [sprintBpm, setSprintBpm] = useState(140);
  const [jogBars, setJogBars] = useState(4);
  const [sprintBars, setSprintBars] = useState(2);

  const [subdivMetric, setSubdivMetric] = useState(SUBDIV_METRICS.BARS);
  const [jogSubdiv, setJogSubdiv] = useState(2);
  const [sprintSubdiv, setSprintSubdiv] = useState(4);
  const [jogUnits, setJogUnits] = useState(3);
  const [sprintUnits, setSprintUnits] = useState(1);

  // --- Mute Trainer State ---
  const [muteBarsPlay, setMuteBarsPlay] = useState(3);
  const [muteBarsSilent, setMuteBarsSilent] = useState(1);
  const [isMutePhase, setIsMutePhase] = useState(false);

  const [isSprintPhase, setIsSprintPhase] = useState(false);
  const [unitsElapsed, setUnitsElapsed] = useState(0);

  // --- References ---
  const audioEngineRef = useRef(null);
  const workerRef = useRef(null);
  const tapTimesRef = useRef([]);

  const isSpeedCapReached = automationMode === AUTOMATION_MODES.RAMP && bpm >= gradualCap;

  const activeSubdiv = (automationMode === AUTOMATION_MODES.JOG_SPRINT && sprintType === SPRINT_STRATEGIES.SUBDIVISION)
    ? (isSprintPhase ? sprintSubdiv : jogSubdiv)
    : subdivision;

  // Unified State Object passed to Audio Engine
  const stateRef = useRef({});
  useEffect(() => {
    stateRef.current = {
      bpm,
      beatsPerBar,
      subdivision: activeSubdiv,
      volume,
      beatAccents,
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
      delayBarsElapsed,
      isSpeedCapReached,
      muteBarsPlay,
      muteBarsSilent,
      isMutePhase,
      activeSongMap,
      currentSectionIndex
    };
  });

  // Handle Bar/Beat Progressions for Automation & Mute Trainer & Song Maps
  const handleStateAdvance = (type) => {
    const s = stateRef.current;

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

    if (s.automationMode === AUTOMATION_MODES.RAMP && type === 'bar') {
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
    else if (s.automationMode === AUTOMATION_MODES.JOG_SPRINT) {
      const isBarTrigger = (s.sprintType === SPRINT_STRATEGIES.BPM || (s.sprintType === SPRINT_STRATEGIES.SUBDIVISION && s.subdivMetric === SUBDIV_METRICS.BARS)) && type === 'bar';
      const isBeatTrigger = (s.sprintType === SPRINT_STRATEGIES.SUBDIVISION && s.subdivMetric === SUBDIV_METRICS.BEATS) && (type === 'beat' || type === 'bar');

      if (isBarTrigger || isBeatTrigger) {
        setUnitsElapsed((prev) => {
          const targetLimit = s.isSprintPhase
            ? (s.sprintType === SPRINT_STRATEGIES.BPM ? s.sprintBars : s.sprintUnits)
            : (s.sprintType === SPRINT_STRATEGIES.BPM ? s.jogBars : s.jogUnits);

          const next = prev + 1;
          if (next >= targetLimit) {
            const nextSprintState = !s.isSprintPhase;
            setIsSprintPhase(nextSprintState);
            if (s.sprintType === SPRINT_STRATEGIES.BPM) {
              setBpm(nextSprintState ? s.sprintBpm : s.jogBpm);
            }
            return 0;
          }
          return next;
        });
      }
    }
    else if (s.automationMode === AUTOMATION_MODES.MUTE_TRAINER && type === 'bar') {
      setUnitsElapsed((prev) => {
        const targetLimit = s.isMutePhase ? s.muteBarsSilent : s.muteBarsPlay;
        const next = prev + 1;
        if (next >= targetLimit) {
          setIsMutePhase(!s.isMutePhase);
          return 0;
        }
        return next;
      });
    }
    else if (s.automationMode === AUTOMATION_MODES.SONG_MAP && s.activeSongMap && type === 'bar') {
      const currentSection = s.activeSongMap.sections?.[s.currentSectionIndex];

      if (currentSection) {
        setUnitsElapsed((prevBars) => {
          const nextBars = prevBars + 1;

          if (nextBars >= currentSection.bars) {
            const nextIndex = s.currentSectionIndex + 1;

            if (nextIndex < s.activeSongMap.sections.length) {
              setCurrentSectionIndex(nextIndex);
              applySection(s.activeSongMap.sections[nextIndex]);
            } else {
              setCurrentSectionIndex(0);
              applySection(s.activeSongMap.sections[0]);
            }
            return 0;
          }
          return nextBars;
        });
      }
    }
  };

  const advanceHandlerRef = useRef(handleStateAdvance);
  useEffect(() => {
    advanceHandlerRef.current = handleStateAdvance;
  });

  // Screen Wake Lock Handler
  useEffect(() => {
    let wakeLock = null;

    const requestWakeLock = async () => {
      if ('wakeLock' in navigator && isPlaying) {
        try {
          wakeLock = await navigator.wakeLock.request('screen');
        } catch (err) {
          console.log('Wake Lock request failed:', err);
        }
      }
    };

    if (isPlaying) {
      requestWakeLock();
    } else if (wakeLock) {
      wakeLock.release().then(() => {
        wakeLock = null;
      });
    }

    return () => {
      if (wakeLock) wakeLock.release();
    };
  }, [isPlaying]);

  // Web Worker & Audio Engine Lifecycle
  useEffect(() => {
    audioEngineRef.current = new AudioEngine();

    workerRef.current = new Worker(
      new URL('../audio/schedulerWorker.js', import.meta.url),
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

  // Wrapped in useCallback so keydown listener dependency remains stable
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      workerRef.current.postMessage({ command: 'stop' });
      setIsPlaying(false);
      setIsSprintPhase(false);
      setIsDelayPhase(false);
      setIsMutePhase(false);
      setUnitsElapsed(0);
      setDelayBarsElapsed(0);
      setCurrentSectionIndex(0);
      setActiveBeat({ beat: 0, sub: 0 });
    } else {
      if (!audioEngineRef.current) {
        audioEngineRef.current = new AudioEngine();
      }
      audioEngineRef.current.init();

      if (audioEngineRef.current.audioCtx) {
        const buffer = audioEngineRef.current.audioCtx.createBuffer(1, 1, 22050);
        const source = audioEngineRef.current.audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(audioEngineRef.current.audioCtx.destination);
        source.start(0);
      }

      setUnitsElapsed(0);
      setDelayBarsElapsed(0);
      setCurrentSectionIndex(0);
      setIsSprintPhase(false);
      setIsMutePhase(false);

      if (startDelayBars > 0) {
        setIsDelayPhase(true);
      }

      if (automationMode === AUTOMATION_MODES.JOG_SPRINT && sprintType === SPRINT_STRATEGIES.BPM) {
        setBpm(clampBpm(jogBpm));
      } else if (automationMode === AUTOMATION_MODES.SONG_MAP) {
        applySection(activeSongMap?.sections?.[0]);
      }

      audioEngineRef.current.start();
      workerRef.current.postMessage({ command: 'start' });
      setIsPlaying(true);
    }
  }, [isPlaying, startDelayBars, automationMode, sprintType, jogBpm, activeSongMap, applySection]);

  // Switching mode must not carry phase state (silent bar, sprint bell, counters) over
  const handleModeChange = (mode) => {
    setAutomationMode(mode);
    setIsSprintPhase(false);
    setIsMutePhase(false);
    setUnitsElapsed(0);
    setCurrentSectionIndex(0);
  };

  const handleTapTempo = useCallback(() => {
    const now = performance.now();
    tapTimesRef.current.push(now);
    if (tapTimesRef.current.length > 4) tapTimesRef.current.shift();

    if (tapTimesRef.current.length > 1) {
      const intervals = [];
      for (let i = 1; i < tapTimesRef.current.length; i++) {
        intervals.push(tapTimesRef.current[i] - tapTimesRef.current[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
      setBpm(clampBpm(60000 / avgInterval));
    }
  }, []);

  // Fixed warning #3: Added togglePlay and handleTapTempo to effect dependency array
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      if (activeTag === 'input' || activeTag === 'select' || activeTag === 'textarea') {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        const delta = e.altKey ? 8 : e.shiftKey ? 4 : 1;
        setBpm((b) => Math.min(MAX_BPM, b + delta));
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        const delta = e.altKey ? 8 : e.shiftKey ? 4 : 1;
        setBpm((b) => Math.max(MIN_BPM, b - delta));
      } else if (e.code === 'KeyT') {
        e.preventDefault();
        handleTapTempo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, handleTapTempo]);

  const handleSelectSong = (song) => {
    setActiveSongMap(song);
    setCurrentSectionIndex(0);
    setUnitsElapsed(0);

    if (song.sections && song.sections.length > 0) {
      const firstSec = song.sections[0];
      setBpm(clampBpm(firstSec.bpm || song.bpm || 120));
      if (firstSec.beatsPerBar) handleBeatsPerBarChange(firstSec.beatsPerBar);
      setSubdivision(firstSec.subdivision || song.subdivision || 1);
      setAutomationMode(AUTOMATION_MODES.SONG_MAP);
    } else {
      if (song.bpm) setBpm(clampBpm(song.bpm));
      if (song.beatsPerBar) handleBeatsPerBarChange(song.beatsPerBar);
      if (song.subdivision) setSubdivision(song.subdivision);
    }

    if (song.beatAccents && Array.isArray(song.beatAccents)) {
      setBeatAccents(song.beatAccents);
    }

    if (isPlaying) {
      togglePlay();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 md:p-6 font-sans">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN */}
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
              isSpeedCapReached={isSpeedCapReached}
              isMutePhase={isMutePhase}
              muteBarsPlay={muteBarsPlay}
              muteBarsSilent={muteBarsSilent}
              activeSongMap={activeSongMap}
              currentSectionIndex={currentSectionIndex}
            />

            <MainDisplay
              bpm={bpm}
              setBpm={setBpm}
              beatsPerBar={beatsPerBar}
              activeSubdiv={activeSubdiv}
              isPlaying={isPlaying}
              activeBeat={activeBeat}
              handleTapTempo={handleTapTempo}
              beatAccents={beatAccents}
              toggleBeatAccent={toggleBeatAccent}
            />
          </div>

          <MetronomeControls
            isPlaying={isPlaying}
            togglePlay={togglePlay}
            beatsPerBar={beatsPerBar}
            setBeatsPerBar={handleBeatsPerBarChange}
            subdivision={subdivision}
            setSubdivision={setSubdivision}
            startDelayBars={startDelayBars}
            setStartDelayBars={setStartDelayBars}
          />
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-5 space-y-6">
          <AutomationEngine
            automationMode={automationMode}
            setAutomationMode={handleModeChange}
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
            muteBarsPlay={muteBarsPlay}
            setMuteBarsPlay={setMuteBarsPlay}
            muteBarsSilent={muteBarsSilent}
            setMuteBarsSilent={setMuteBarsSilent}
          />

          <SongMapLoader onSelectSong={handleSelectSong} />
        </div>

      </div>
    </div>
  );
}