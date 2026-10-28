import React from 'react';

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
  jogUnits
}) {
  return (
    <div className={`w-full flex items-center justify-between px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider mb-2 border ${
      isDelayPhase
        ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
        : isSprintPhase 
        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' 
        : 'bg-slate-800/80 border-slate-700/60 text-slate-300'
    }`}>
      <span className="flex items-center gap-2">
        <span className={`w-2.5 h-2.5 rounded-full ${
          isPlaying 
            ? (isDelayPhase ? 'bg-purple-400 animate-ping' : isSprintPhase ? 'bg-amber-400 animate-ping' : 'bg-cyan-400 animate-pulse') 
            : 'bg-slate-500'
        }`} />
        <span>
          {isDelayPhase && `⏳ COUNT-IN DELAY (${startDelayBars} BARS)`}
          {!isDelayPhase && automationMode === 'manual' && 'Manual Mode'}
          {!isDelayPhase && automationMode === 'gradual' && `Ramp Up (+${gradualStep} BPM)`}
          {!isDelayPhase && automationMode === 'jogsprint' && (isSprintPhase ? '🔥 SPRINT PHASE' : '🏃 JOG PHASE')}
        </span>
      </span>
      <span className="font-mono text-cyan-400">
        {isDelayPhase && `Bar ${delayBarsElapsed + 1}/${startDelayBars}`}
        {!isDelayPhase && automationMode === 'manual' && (isPlaying ? 'Active' : 'Ready')}
        {!isDelayPhase && automationMode === 'gradual' && `Step ${unitsElapsed + 1}/${gradualInterval}`}
        {!isDelayPhase && automationMode === 'jogsprint' && `Unit ${unitsElapsed + 1}/${
          isSprintPhase 
            ? (sprintType === 'bpm' ? sprintBars : sprintUnits) 
            : (sprintType === 'bpm' ? jogBars : jogUnits)
        }`}
      </span>
    </div>
  );
}