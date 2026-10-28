import React from 'react';
import { 
  AUTOMATION_MODES, 
  SPRINT_STRATEGIES, 
  SUBDIV_METRICS, 
  SUBDIVISION_OPTIONS 
} from '../constants';
import { 
  Sliders, 
  Zap, 
  Flame, 
  VolumeX, 
  Music2 
} from 'lucide-react';

export function AutomationEngine({
  automationMode,
  setAutomationMode,
  gradualInterval,
  setGradualInterval,
  gradualStep,
  setGradualStep,
  gradualCap,
  setGradualCap,
  sprintType,
  setSprintType,
  jogBpm,
  setJogBpm,
  sprintBpm,
  setSprintBpm,
  jogBars,
  setJogBars,
  sprintBars,
  setSprintBars,
  subdivMetric,
  setSubdivMetric,
  jogSubdiv,
  setJogSubdiv,
  sprintSubdiv,
  setSprintSubdiv,
  jogUnits,
  setJogUnits,
  sprintUnits,
  setSprintUnits,
  muteBarsPlay,
  setMuteBarsPlay,
  muteBarsSilent,
  setMuteBarsSilent
}) {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-5 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <h2 className="font-bold text-sm text-slate-100">Automation Engine</h2>
        </div>
        <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-800 text-slate-400">
          Trainer
        </span>
      </div>

      {/* Mode Selector Tabs */}
      <div className="grid grid-cols-5 gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800/80">
        <button
          onClick={() => setAutomationMode(AUTOMATION_MODES.MANUAL)}
          className={`py-2 text-[11px] font-semibold rounded-xl transition-all cursor-pointer ${
            automationMode === AUTOMATION_MODES.MANUAL
              ? 'bg-slate-800 text-cyan-400 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Manual
        </button>
        <button
          onClick={() => setAutomationMode(AUTOMATION_MODES.RAMP)}
          className={`py-2 text-[11px] font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
            automationMode === AUTOMATION_MODES.RAMP
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="w-3 h-3" />
          Ramp
        </button>
        <button
          onClick={() => setAutomationMode(AUTOMATION_MODES.JOG_SPRINT)}
          className={`py-2 text-[11px] font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
            automationMode === AUTOMATION_MODES.JOG_SPRINT
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Flame className="w-3 h-3" />
          Sprint
        </button>
        <button
          onClick={() => setAutomationMode(AUTOMATION_MODES.MUTE_TRAINER)}
          className={`py-2 text-[11px] font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
            automationMode === AUTOMATION_MODES.MUTE_TRAINER
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <VolumeX className="w-3 h-3" />
          Mute
        </button>
        <button
          onClick={() => setAutomationMode(AUTOMATION_MODES.SONG_MAP)}
          className={`py-2 text-[11px] font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
            automationMode === AUTOMATION_MODES.SONG_MAP
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Music2 className="w-3 h-3" />
          Song
        </button>
      </div>

      {/* 1. MANUAL MODE */}
      {automationMode === AUTOMATION_MODES.MANUAL && (
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/60 text-center space-y-1">
          <p className="text-xs font-semibold text-slate-300">Manual Controls Active</p>
          <p className="text-[11px] text-slate-500">
            Standard fixed-tempo operation.
          </p>
        </div>
      )}

      {/* 2. GRADUAL RAMP UP MODE */}
      {automationMode === AUTOMATION_MODES.RAMP && (
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            Gradual Ramp Settings
          </span>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 mb-1">Every (Bars)</label>
              <input
                type="number"
                min="1"
                max="64"
                value={gradualInterval}
                onChange={(e) => setGradualInterval(Math.max(1, Number(e.target.value)))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 mb-1">Add (+BPM)</label>
              <input
                type="number"
                min="1"
                max="30"
                value={gradualStep}
                onChange={(e) => setGradualStep(Math.max(1, Number(e.target.value)))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 mb-1">Cap Limit</label>
              <input
                type="number"
                min="40"
                max="300"
                value={gradualCap}
                onChange={(e) => setGradualCap(Math.max(40, Number(e.target.value)))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. JOG / SPRINT TRAINER MODE */}
      {automationMode === AUTOMATION_MODES.JOG_SPRINT && (
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              Sprint Trainer Strategy
            </span>
            <div className="flex gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
              <button
                onClick={() => setSprintType(SPRINT_STRATEGIES.BPM)}
                className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                  sprintType === SPRINT_STRATEGIES.BPM
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                BPM Jump
              </button>
              <button
                onClick={() => setSprintType(SPRINT_STRATEGIES.SUBDIVISION)}
                className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                  sprintType === SPRINT_STRATEGIES.SUBDIVISION
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Subdivision Burst
              </button>
            </div>
          </div>

          {/* SPRINT TYPE A: BPM JUMP */}
          {sprintType === SPRINT_STRATEGIES.BPM && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900/80 border border-slate-800/80 p-2.5 rounded-xl space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">🏃 Jog Phase</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] text-slate-500 mb-0.5">BPM</label>
                    <input
                      type="number"
                      min="30"
                      max="300"
                      value={jogBpm}
                      onChange={(e) => setJogBpm(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500 mb-0.5">Bars</label>
                    <input
                      type="number"
                      min="1"
                      max="32"
                      value={jogBars}
                      onChange={(e) => setJogBars(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-200"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl space-y-2">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">🔥 Sprint Burst</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] text-slate-500 mb-0.5">BPM</label>
                    <input
                      type="number"
                      min="30"
                      max="300"
                      value={sprintBpm}
                      onChange={(e) => setSprintBpm(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono font-bold text-amber-300"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500 mb-0.5">Bars</label>
                    <input
                      type="number"
                      min="1"
                      max="32"
                      value={sprintBars}
                      onChange={(e) => setSprintBars(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono font-bold text-amber-300"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SPRINT TYPE B: SUBDIVISION BURST (WITH DROPDOWNS) */}
          {sprintType === SPRINT_STRATEGIES.SUBDIVISION && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-400">Interval Metric</span>
                <div className="flex gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setSubdivMetric(SUBDIV_METRICS.BARS)}
                    className={`px-2 py-0.5 text-[9px] font-bold rounded cursor-pointer ${
                      subdivMetric === SUBDIV_METRICS.BARS ? 'bg-amber-500/30 text-amber-200' : 'text-slate-400'
                    }`}
                  >
                    Bars
                  </button>
                  <button
                    onClick={() => setSubdivMetric(SUBDIV_METRICS.BEATS)}
                    className={`px-2 py-0.5 text-[9px] font-bold rounded cursor-pointer ${
                      subdivMetric === SUBDIV_METRICS.BEATS ? 'bg-amber-500/30 text-amber-200' : 'text-slate-400'
                    }`}
                  >
                    Beats
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900/80 border border-slate-800/80 p-2.5 rounded-xl space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">🏃 Rest Subdiv</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] text-slate-500 mb-0.5">Rate</label>
                      {/* REST SUBDIV DROPDOWN */}
                      <select
                        value={jogSubdiv}
                        onChange={(e) => setJogSubdiv(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-200 focus:outline-none focus:border-amber-500"
                      >
                        {SUBDIVISION_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.value}x ({opt.label.split(' ')[1] || opt.label})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] text-slate-500 mb-0.5">
                        {subdivMetric === SUBDIV_METRICS.BARS ? 'Bars' : 'Beats'}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="32"
                        value={jogUnits}
                        onChange={(e) => setJogUnits(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-200"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl space-y-2">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">🔥 Burst Subdiv</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] text-slate-500 mb-0.5">Rate</label>
                      {/* BURST SUBDIV DROPDOWN */}
                      <select
                        value={sprintSubdiv}
                        onChange={(e) => setSprintSubdiv(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-500"
                      >
                        {SUBDIVISION_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.value}x ({opt.label.split(' ')[1] || opt.label})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] text-slate-500 mb-0.5">
                        {subdivMetric === SUBDIV_METRICS.BARS ? 'Bars' : 'Beats'}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="32"
                        value={sprintUnits}
                        onChange={(e) => setSprintUnits(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono font-bold text-amber-300"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. MUTE TRAINER MODE */}
      {automationMode === AUTOMATION_MODES.MUTE_TRAINER && (
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
          <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
            <VolumeX className="w-3.5 h-3.5 text-rose-400" />
            Inner Clock Mute Settings
          </span>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-900/80 border border-slate-800/80 p-2.5 rounded-xl space-y-1">
              <label className="block text-[10px] font-semibold text-slate-400">🔊 Play Bars</label>
              <input
                type="number"
                min="1"
                max="32"
                value={muteBarsPlay}
                onChange={(e) => setMuteBarsPlay(Math.max(1, Number(e.target.value)))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-slate-100"
              />
            </div>
            <div className="bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl space-y-1">
              <label className="block text-[10px] font-semibold text-rose-300">🔇 Silent Bars</label>
              <input
                type="number"
                min="1"
                max="32"
                value={muteBarsSilent}
                onChange={(e) => setMuteBarsSilent(Math.max(1, Number(e.target.value)))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-rose-300"
              />
            </div>
          </div>
        </div>
      )}

      {/* 5. SONG MAP AUTOMATION MODE */}
      {automationMode === AUTOMATION_MODES.SONG_MAP && (
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/60 text-center space-y-2">
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-purple-300">
            <Music2 className="w-4 h-4 text-purple-400" />
            Multi-Section Song Map Active
          </div>
          <p className="text-[11px] text-slate-400">
            Tempo and subdivisions are synchronized with the selected song map from your library.
          </p>
        </div>
      )}
    </div>
  );
}