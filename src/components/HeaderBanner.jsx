import React from 'react';
import { AUTOMATION_MODES, SPRINT_STRATEGIES } from '../constants';
import { AlertCircle, Flame, Timer, VolumeX, Volume2, Music } from 'lucide-react';

export function HeaderBanner({
  isPlaying,
  isDelayPhase,
  startDelayBars,
  delayBarsElapsed,
  automationMode,
  gradualStep,
  gradualInterval,
  isSprintPhase,
  unitsElapsed,
  sprintType,
  sprintBars,
  sprintUnits,
  jogBars,
  jogUnits,
  isSpeedCapReached,
  isMutePhase,
  muteBarsPlay,
  muteBarsSilent,
  activeSongMap,
  currentSectionIndex
}) {
  const currentSection = activeSongMap?.sections?.[currentSectionIndex];

  return (
    <div className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider mb-2 border transition-all duration-300 ${
      isDelayPhase
        ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
        : isMutePhase
        ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 shadow-lg shadow-rose-500/10'
        : isSpeedCapReached
        ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-lg shadow-rose-500/20'
        : isSprintPhase 
        ? 'bg-amber-500/25 border-amber-500/50 text-amber-300 shadow-lg shadow-amber-500/20' 
        : automationMode === AUTOMATION_MODES.SONG_MAP
        ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 shadow-lg shadow-cyan-500/10'
        : 'bg-slate-800/80 border-slate-700/60 text-slate-300'
    }`}>
      <span className="flex items-center gap-2">
        <span className={`w-2.5 h-2.5 rounded-full ${
          isPlaying 
            ? (isDelayPhase ? 'bg-purple-400 animate-ping' : isMutePhase ? 'bg-rose-500 animate-pulse' : isSpeedCapReached ? 'bg-rose-400 animate-ping' : isSprintPhase ? 'bg-amber-400 animate-ping' : 'bg-cyan-400 animate-pulse') 
            : 'bg-slate-500'
        }`} />
        <span className="flex items-center gap-1.5">
          {isDelayPhase && <><Timer className="w-3.5 h-3.5" /> COUNT-IN DELAY ({startDelayBars} BARS)</>}
          {!isDelayPhase && automationMode === AUTOMATION_MODES.MANUAL && 'Manual Mode'}
          {!isDelayPhase && automationMode === AUTOMATION_MODES.RAMP && (
            isSpeedCapReached 
              ? <><AlertCircle className="w-3.5 h-3.5 text-rose-400" /> MAX SPEED CAP REACHED</>
              : `Ramp Up (+${gradualStep} BPM)`
          )}
          {!isDelayPhase && automationMode === AUTOMATION_MODES.JOG_SPRINT && (
            isSprintPhase 
              ? <><Flame className="w-3.5 h-3.5 text-amber-400 animate-bounce" /> 🔥 SPRINT PHASE ALERT</> 
              : '🏃 JOG PHASE'
          )}
          {!isDelayPhase && automationMode === AUTOMATION_MODES.MUTE_TRAINER && (
            isMutePhase 
              ? <><VolumeX className="w-3.5 h-3.5 text-rose-400 animate-pulse" /> 🔇 MUTE TRAINER (SILENT)</>
              : <><Volume2 className="w-3.5 h-3.5 text-cyan-400" /> 🔊 MUTE TRAINER (PLAYING)</>
          )}
          {!isDelayPhase && automationMode === AUTOMATION_MODES.SONG_MAP && activeSongMap && (
            <><Music className="w-3.5 h-3.5 text-cyan-400" /> {activeSongMap.title} — {currentSection?.name || 'Section'}</>
          )}
        </span>
      </span>

      <span className="font-mono text-cyan-400">
        {isDelayPhase && `Bar ${delayBarsElapsed + 1}/${startDelayBars}`}
        {!isDelayPhase && automationMode === AUTOMATION_MODES.MANUAL && (isPlaying ? 'Active' : 'Ready')}
        {!isDelayPhase && automationMode === AUTOMATION_MODES.RAMP && `Step ${unitsElapsed + 1}/${gradualInterval}`}
        {!isDelayPhase && automationMode === AUTOMATION_MODES.JOG_SPRINT && `Unit ${unitsElapsed + 1}/${
          isSprintPhase 
            ? (sprintType === SPRINT_STRATEGIES.BPM ? sprintBars : sprintUnits) 
            : (sprintType === SPRINT_STRATEGIES.BPM ? jogBars : jogUnits)
        }`}
        {!isDelayPhase && automationMode === AUTOMATION_MODES.MUTE_TRAINER && `Bar ${unitsElapsed + 1}/${
          isMutePhase ? muteBarsSilent : muteBarsPlay
        }`}
        {!isDelayPhase && automationMode === AUTOMATION_MODES.SONG_MAP && currentSection && `Bar ${unitsElapsed + 1}/${currentSection.bars}`}
      </span>
    </div>
  );
}