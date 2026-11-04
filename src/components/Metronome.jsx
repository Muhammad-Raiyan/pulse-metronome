import { lazy, Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { Activity, ExternalLink, Sun, Moon } from 'lucide-react';
import { useTheme } from '../ThemeContext';
import { AudioEngine } from '../audio/AudioEngine';
import { advanceAutomation } from '../audio/automation';
import { DEBUG_ENABLED, saveDebugPreference } from '../debug';
import { HeaderBanner } from './HeaderBanner';
import { MainDisplay } from './MainDisplay';
import { MetronomeControls } from './MetronomeControls';
import { AutomationEngine } from './AutomationEngine';
import { SongMapLoader } from './SongMapLoader';
import { SequenceEditor } from './SequenceEditor';
import { songToSequence, newSequence } from '../sequence';
import { ShortcutsPanel } from './ShortcutsPanel';
import { Uptime } from './Uptime';
import { AUTOMATION_MODES, SPRINT_STRATEGIES, ACCENT_TYPES, DEFAULT_TRAINER, SUBDIVISION_OPTIONS, MIN_BPM, MAX_BPM, clampBpm } from '../constants';

// Debug UI is only downloaded when debug mode is switched on
const DebugPanel = lazy(() => import('./DebugPanel').then((m) => ({ default: m.DebugPanel })));

export function Metronome() {
  const { theme, toggle: toggleTheme } = useTheme();

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

  // Change the meter and resize the accent pattern in one step (no setState inside an effect)
  const handleBeatsPerBarChange = useCallback((newBeats) => {
    setBeatsPerBar(newBeats);
    setBeatAccents((prev) => {
      // Same meter: keep the user's accent pattern untouched
      if (prev.length === newBeats) return prev;
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

  // Apply a song-map section's tempo / meter / subdivision (and accents) to the live state
  const applySection = useCallback((sec) => {
    if (!sec) return;
    if (sec.bpm) setBpm(clampBpm(sec.bpm));
    if (sec.beatsPerBar) handleBeatsPerBarChange(sec.beatsPerBar);
    setSubdivision(sec.subdivision || 1);
    if (Array.isArray(sec.beatAccents)) setBeatAccents(sec.beatAccents);
  }, [handleBeatsPerBarChange]);

  // --- Count-In Delay Configuration ---
  const [startDelayBars, setStartDelayBars] = useState(0);
  const [isDelayPhase, setIsDelayPhase] = useState(false);
  const [delayBarsElapsed, setDelayBarsElapsed] = useState(0);

  // --- Automation Engine State ---
  const [automationMode, setAutomationMode] = useState(AUTOMATION_MODES.MANUAL);
  // Ramp / Sprint / Mute settings live in one object; change them with updateTrainer(key, value)
  const [trainer, setTrainer] = useState(DEFAULT_TRAINER);
  const updateTrainer = useCallback(
    (key, value) => setTrainer((prev) => (prev[key] === value ? prev : { ...prev, [key]: value })),
    []
  );
  const { gradualCap, sprintType, jogBpm, sprintSubdiv, jogSubdiv } = trainer;

  // --- Mute Trainer State ---
  const [isMutePhase, setIsMutePhase] = useState(false);

  const [isSprintPhase, setIsSprintPhase] = useState(false);
  const [unitsElapsed, setUnitsElapsed] = useState(0);

  // --- Song Map State ---
  const [repeatElapsed, setRepeatElapsed] = useState(0);
  const [songComplete, setSongComplete] = useState(false);
  const [startSectionIndex, setStartSectionIndex] = useState(0);
  const [loopSection, setLoopSection] = useState(false);

  // --- References ---
  const audioEngineRef = useRef(null);
  const workerRef = useRef(null);
  const tapTimesRef = useRef([]);
  const rampStartBpmRef = useRef(null);

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
      ...trainer,
      isSprintPhase,
      unitsElapsed,
      startDelayBars,
      isDelayPhase,
      delayBarsElapsed,
      isSpeedCapReached,
      isMutePhase,
      activeSongMap,
      currentSectionIndex,
      startSectionIndex,
      loopSection,
      repeatElapsed,
    };
  });

  // Handle Bar/Beat progressions. The rules live in advanceAutomation(), which updates the
  // live snapshot synchronously (so the next note sees the change) and returns what changed
  // so it can be mirrored into React state for display.
  const handleStateAdvance = (type) => {
    const patch = advanceAutomation(stateRef.current, type);

    if ('isDelayPhase' in patch) setIsDelayPhase(patch.isDelayPhase);
    if ('delayBarsElapsed' in patch) setDelayBarsElapsed(patch.delayBarsElapsed);
    if ('unitsElapsed' in patch) setUnitsElapsed(patch.unitsElapsed);
    if ('bpm' in patch) setBpm(patch.bpm);
    if ('isSprintPhase' in patch) setIsSprintPhase(patch.isSprintPhase);
    if ('isMutePhase' in patch) setIsMutePhase(patch.isMutePhase);
    if ('currentSectionIndex' in patch) setCurrentSectionIndex(patch.currentSectionIndex);
    if ('repeatElapsed' in patch) setRepeatElapsed(patch.repeatElapsed);
    if (patch.songComplete) setSongComplete(true);
    if (patch.section) applySection(patch.section);
  };
  const advanceHandlerRef = useRef(handleStateAdvance);
  useEffect(() => {
    advanceHandlerRef.current = handleStateAdvance;
  });

  // Screen Wake Lock: held while playing, re-acquired when the tab becomes visible again
  useEffect(() => {
    if (!isPlaying || !('wakeLock' in navigator)) return;

    let cancelled = false;
    let pending = false;
    let lock = null;

    const request = async () => {
      if (pending) return;
      pending = true;
      try {
        const granted = await navigator.wakeLock.request('screen');
        if (cancelled) {
          granted.release();
        } else {
          lock = granted;
        }
      } catch (err) {
        console.warn('Wake Lock request failed:', err.name);
      } finally {
        pending = false;
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && (!lock || lock.released)) {
        request();
      }
    };

    request();
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (lock) lock.release();
    };
  }, [isPlaying]);
  // Timing debug overlay: starts from ?debug / the saved preference, toggled from the footer
  const [debugOn, setDebugOn] = useState(DEBUG_ENABLED);
  const debugRef = useRef(DEBUG_ENABLED);
  const toggleDebug = () => {
    const next = !debugRef.current;
    debugRef.current = next;
    setDebugOn(next);
    saveDebugPreference(next);
    audioEngineRef.current?.setDebug(next);
  };

  // Web Worker & Audio Engine Lifecycle
  useEffect(() => {
    audioEngineRef.current = new AudioEngine();
    audioEngineRef.current.setDebug(debugRef.current);

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

  // Stop playback. `restoreTempo` puts the tempo back to where the automation started;
  // it is skipped when a new song is being loaded, which sets its own tempo.
  const stopPlayback = useCallback((restoreTempo) => {
    workerRef.current.postMessage({ command: 'stop' });
    audioEngineRef.current?.stop();
    if (restoreTempo) {
      if (rampStartBpmRef.current !== null && automationMode === AUTOMATION_MODES.RAMP) {
        setBpm(rampStartBpmRef.current);
      } else if (automationMode === AUTOMATION_MODES.JOG_SPRINT && sprintType === SPRINT_STRATEGIES.BPM) {
        setBpm(clampBpm(jogBpm));
      } else if (automationMode === AUTOMATION_MODES.SONG_MAP) {
        applySection(activeSongMap?.sections?.[startSectionIndex]);
      }
    }
    rampStartBpmRef.current = null;
    setIsPlaying(false);
    setIsSprintPhase(false);
    setIsDelayPhase(false);
    setIsMutePhase(false);
    setUnitsElapsed(0);
    setDelayBarsElapsed(0);
    setCurrentSectionIndex(startSectionIndex);
    setRepeatElapsed(0);
    setSongComplete(false);
    setActiveBeat({ beat: 0, sub: 0 });
  }, [automationMode, sprintType, jogBpm, activeSongMap, applySection]);

  // Wrapped in useCallback so keydown listener dependency remains stable
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      stopPlayback(true);
    } else {
      if (!audioEngineRef.current) {
        audioEngineRef.current = new AudioEngine();
        audioEngineRef.current.setDebug(debugRef.current);
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
      setCurrentSectionIndex(startSectionIndex);
      setIsSprintPhase(false);
      setIsMutePhase(false);

      if (startDelayBars > 0) {
        setIsDelayPhase(true);
      }

      // Remember where a ramp starts so the next run begins from the same tempo
      rampStartBpmRef.current = automationMode === AUTOMATION_MODES.RAMP ? stateRef.current.bpm : null;

      if (automationMode === AUTOMATION_MODES.JOG_SPRINT && sprintType === SPRINT_STRATEGIES.BPM) {
        setBpm(clampBpm(jogBpm));
      } else if (automationMode === AUTOMATION_MODES.SONG_MAP) {
        applySection(activeSongMap?.sections?.[startSectionIndex]);
      }

      audioEngineRef.current.start();
      workerRef.current.postMessage({ command: 'start' });
      setIsPlaying(true);
    }
  }, [isPlaying, stopPlayback, startDelayBars, automationMode, sprintType, jogBpm, activeSongMap, applySection, startSectionIndex]);

  // Switching mode must not carry phase state (silent bar, sprint bell, counters) over
  const handleModeChange = (mode) => {
    setAutomationMode(mode);
    setIsSprintPhase(false);
    setIsMutePhase(false);
    setUnitsElapsed(0);
    setCurrentSectionIndex(0);
    setRepeatElapsed(0);
    setSongComplete(false);
    setStartDelayBars(mode === AUTOMATION_MODES.MANUAL ? 0 : 1);
  };

  const handleTapTempo = useCallback(() => {
    const now = performance.now();
    const taps = tapTimesRef.current;
    // A long pause starts a fresh tap sequence
    if (taps.length > 0 && now - taps[taps.length - 1] > 2000) taps.length = 0;
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

  // Keyboard shortcuts. Typing fields and dropdowns keep their own keys; the tempo slider
  // keeps the arrow keys but still lets Space start/stop.
  useEffect(() => {
    const isTypingTarget = (el) => {
      const tag = el?.tagName?.toLowerCase();
      if (tag === 'select' || tag === 'textarea') return true;
      return tag === 'input' && el.type !== 'range';
    };

    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) return;
      const el = document.activeElement;
      if (isTypingTarget(el)) return;
      const onSlider = el?.tagName?.toLowerCase() === 'input' && el.type === 'range';
      if (onSlider && e.code !== 'Space') return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (!e.repeat) togglePlay();
      } else if (e.code === 'ArrowUp' || e.code === 'ArrowDown') {
        e.preventDefault();
        if (e.shiftKey) {
          if (!e.repeat) {
            const beatsOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 12];
            const cur = stateRef.current.beatsPerBar;
            const idx = beatsOptions.indexOf(cur);
            const next = e.code === 'ArrowUp' ? idx + 1 : idx - 1;
            const clamped = beatsOptions[Math.min(beatsOptions.length - 1, Math.max(0, next))];
            if (clamped !== undefined) handleBeatsPerBarChange(clamped);
          }
        } else {
          // Sprint's subdivision burst drives the subdivision itself, so the keys do nothing then
          const s = stateRef.current;
          const locked = s.automationMode === AUTOMATION_MODES.JOG_SPRINT && s.sprintType === SPRINT_STRATEGIES.SUBDIVISION;
          if (!e.repeat && !locked) {
            const delta = e.code === 'ArrowUp' ? 1 : -1;
            setSubdivision((v) => Math.min(SUBDIVISION_OPTIONS.length, Math.max(1, v + delta)));
          }
        }
      } else if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
        e.preventDefault();
        const step = e.altKey ? 1 : e.shiftKey ? 8 : 4;
        const delta = e.code === 'ArrowRight' ? step : -step;
        setBpm((b) => Math.min(MAX_BPM, Math.max(MIN_BPM, b + delta)));
      } else if (e.code === 'KeyT') {
        e.preventDefault();
        if (!e.repeat) handleTapTempo();
      }
    };

    // A focused button also "clicks" on Space key-up, which would toggle a second time
    const handleKeyUp = (e) => {
      if (e.code === 'Space' && !isTypingTarget(document.activeElement)) e.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [togglePlay, handleTapTempo, handleBeatsPerBarChange]);

  // Picking a library song loads an editable copy of it as the sequence (the library entry
  // itself is never changed), and switches to the Song tab to show its steps.
  const handleSelectSong = (song) => {
    const sequence = songToSequence(song);
    setActiveSongMap(sequence);
    setCurrentSectionIndex(0);
    setStartSectionIndex(0);
    setLoopSection(false);
    setUnitsElapsed(0);
    applySection(sequence.sections[0]);
    setAutomationMode(AUTOMATION_MODES.SONG_MAP);

    if (song.beatAccents && Array.isArray(song.beatAccents)) {
      const validAccents = Object.values(ACCENT_TYPES);
      setBeatAccents(
        song.beatAccents.map((a) => (validAccents.includes(a) ? a : ACCENT_TYPES.NORMAL))
      );
    }

    if (isPlaying) {
      stopPlayback(false);
    }
  };

  const handleNewSequence = () => {
    if (isPlaying) stopPlayback(false);
    const seq = newSequence({ bpm, beatsPerBar, subdivision });
    setActiveSongMap(seq);
    setCurrentSectionIndex(0);
    setStartSectionIndex(0);
    setLoopSection(false);
    setUnitsElapsed(0);
    setAutomationMode(AUTOMATION_MODES.SONG_MAP);
  };

  // The editor is locked while playing, so a change always happens at rest
  const handleSequenceChange = (sections) => {
    setActiveSongMap((prev) => ({ ...prev, sections }));
    setCurrentSectionIndex(0);
    applySection(sections[0]);
  };

  // The metronome column and the footer share this width, so the footer sits under the metronome
  const mainColSpan = automationMode === AUTOMATION_MODES.SONG_MAP ? 'lg:col-span-8' : 'lg:col-span-7';

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 md:p-6 font-sans">
      <div className="max-w-[88rem] w-full flex items-start justify-center gap-6">
      <ShortcutsPanel />

      <div className="flex-1 min-w-0 max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN */}
        <div className={`${mainColSpan} space-y-6`}>
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 relative overflow-hidden flex flex-col items-center justify-between min-h-[340px] shadow-2xl">
            <HeaderBanner
              isPlaying={isPlaying}
              isDelayPhase={isDelayPhase}
              startDelayBars={startDelayBars}
              delayBarsElapsed={delayBarsElapsed}
              automationMode={automationMode}
              trainer={trainer}
              isSprintPhase={isSprintPhase}
              unitsElapsed={unitsElapsed}
              isSpeedCapReached={isSpeedCapReached}
              isMutePhase={isMutePhase}
              activeSongMap={activeSongMap}
              currentSectionIndex={currentSectionIndex}
              repeatElapsed={repeatElapsed}
              songComplete={songComplete}
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
              isSongMap={automationMode === AUTOMATION_MODES.SONG_MAP}
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
            subdivisionLocked={automationMode === AUTOMATION_MODES.JOG_SPRINT && sprintType === SPRINT_STRATEGIES.SUBDIVISION}
            isSongMap={automationMode === AUTOMATION_MODES.SONG_MAP}
            activeSongMap={activeSongMap}
            currentSectionIndex={currentSectionIndex}
            unitsElapsed={unitsElapsed}
            isDelayPhase={isDelayPhase}
          />
          {automationMode === AUTOMATION_MODES.SONG_MAP && !isPlaying && (
            <SequenceEditor
              activeSongMap={activeSongMap}
              currentSectionIndex={currentSectionIndex}
              startSectionIndex={startSectionIndex}
              loopSection={loopSection}
              repeatElapsed={repeatElapsed}
              unitsElapsed={unitsElapsed}
              isDelayPhase={isDelayPhase}
              isPlaying={isPlaying}
              onNew={handleNewSequence}
              onChange={handleSequenceChange}
              onSetStart={(i) => { setStartSectionIndex(i); setLoopSection(false); }}
              onSetLoop={(i) => { setStartSectionIndex(i); setLoopSection(true); }}
              onClearStart={() => { setStartSectionIndex(0); setLoopSection(false); }}
            />
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div className={`${automationMode === AUTOMATION_MODES.SONG_MAP ? 'lg:col-span-4' : 'lg:col-span-5'} space-y-6`}>
          <AutomationEngine
            automationMode={automationMode}
            setAutomationMode={handleModeChange}
            trainer={trainer}
            onTrainerChange={updateTrainer}
            activeSongMap={activeSongMap}
          />

          {automationMode === AUTOMATION_MODES.SONG_MAP && (
            <SongMapLoader onSelectSong={handleSelectSong} />
          )}
        </div>

        {/* Own grid row under the metronome column, so it centres on that panel and not the whole page */}
        <footer className={`${mainColSpan} flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-slate-400`}>
          <a
            href="https://github.com/Muhammad-Raiyan/pulse-metronome"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-cyan-400 transition-colors"
          >
            <ExternalLink className="w-3 h-3" aria-hidden="true" />
            View source on GitHub
          </a>
          <button
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="inline-flex items-center gap-1.5 hover:text-cyan-400 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-3 h-3" aria-hidden="true" /> : <Moon className="w-3 h-3" aria-hidden="true" />}
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
          <button
            onClick={toggleDebug}
            aria-pressed={debugOn}
            className="inline-flex items-center gap-1.5 hover:text-cyan-400 transition-colors"
          >
            <Activity className="w-3 h-3" aria-hidden="true" />
            Debug: {debugOn ? 'on' : 'off'}
          </button>
          <Uptime />
        </footer>

      </div>
      </div>

      {debugOn && (
        <Suspense fallback={null}>
          <DebugPanel engineRef={audioEngineRef} isPlaying={isPlaying} />
        </Suspense>
      )}
    </div>
  );
}