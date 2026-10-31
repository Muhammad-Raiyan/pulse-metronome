// src/components/MetronomeControls.jsx

import { SUBDIVISION_OPTIONS } from '../constants';
import { Select } from './Select';
import { Play, Square, Timer, Sliders, Music2 } from 'lucide-react';
import { CARD, INPUT } from './styles';

// Rolling window showing current + upcoming steps while a song is playing
function SongTimeline({ activeSongMap, currentSectionIndex, unitsElapsed, isDelayPhase, isPlaying }) {
  const steps = activeSongMap?.sections ?? [];
  if (steps.length === 0) return null;

  // Show current + up to 3 upcoming; always show at least current even at end
  const WINDOW = 4;
  const start = currentSectionIndex;
  const visible = steps.slice(start, start + WINDOW);

  return (
    <div className="space-y-1.5">
      <span className="block text-xs font-semibold text-slate-400 flex items-center gap-1.5">
        <Music2 className="w-3.5 h-3.5 text-purple-400" />
        Song progress — step {currentSectionIndex + 1} / {steps.length}
      </span>

      <div className="space-y-1.5">
        {visible.map((step, offset) => {
          const absIdx = start + offset;
          const isCurrent = absIdx === currentSectionIndex;
          const progress = isCurrent && isPlaying && !isDelayPhase
            ? Math.min(1, (unitsElapsed + 1) / step.bars)
            : 0;
          const label = step.name?.trim() || `Step ${absIdx + 1}`;
          const subdivLabel = SUBDIVISION_OPTIONS.find(o => o.value === step.subdivision)?.label.replace(/^\d+x\s*/, '') ?? `${step.subdivision}x`;

          return (
            <div
              key={step.id}
              className={`relative isolate overflow-hidden rounded-xl border px-3 py-2 transition-all ${
                isCurrent
                  ? 'bg-purple-500/10 border-purple-500/50'
                  : 'bg-slate-950/50 border-slate-800/50 opacity-60'
              }`}
            >
              {/* progress fill */}
              {isCurrent && (
                <div
                  role="progressbar"
                  aria-label={`${label} progress`}
                  aria-valuemin={0}
                  aria-valuemax={step.bars}
                  aria-valuenow={Math.round(progress * step.bars)}
                  className="absolute inset-y-0 left-0 -z-10 bg-purple-500/25 transition-[width] duration-300 ease-out"
                  style={{ width: `${progress * 100}%` }}
                />
              )}

              <div className="flex items-center justify-between gap-2">
                {/* left: label + bar counter */}
                <div className="min-w-0">
                  <p className={`text-xs font-bold truncate ${isCurrent ? 'text-purple-200' : 'text-slate-400'}`}>
                    {isCurrent && <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-400 mr-1.5 mb-0.5 animate-pulse" aria-hidden="true" />}
                    {label}
                  </p>
                  <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                    {isCurrent && isPlaying && !isDelayPhase
                      ? `Bar ${Math.min(unitsElapsed + 1, step.bars)} / ${step.bars}`
                      : `${step.bars} bar${step.bars !== 1 ? 's' : ''}`}
                  </p>
                </div>

                {/* right: tempo chips */}
                <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
                  <span className={`px-1.5 py-0.5 rounded-md text-[11px] font-mono font-bold ${isCurrent ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-800 text-slate-400'}`}>
                    {step.bpm} BPM
                  </span>
                  <span className={`px-1.5 py-0.5 rounded-md text-[11px] font-mono font-bold ${isCurrent ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-800 text-slate-400'}`}>
                    {step.beatsPerBar}/4
                  </span>
                  <span className={`px-1.5 py-0.5 rounded-md text-[11px] font-mono font-bold ${isCurrent ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-800 text-slate-400'}`}>
                    {subdivLabel}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {/* hint when more steps follow the window */}
        {start + WINDOW < steps.length && (
          <p className="text-[11px] text-slate-500 text-center">
            + {steps.length - (start + WINDOW)} more step{steps.length - (start + WINDOW) !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </div>
  );
}

export function MetronomeControls({
  isPlaying,
  togglePlay,
  beatsPerBar,
  setBeatsPerBar,
  subdivision,
  setSubdivision,
  startDelayBars,
  setStartDelayBars,
  subdivisionLocked,
  isSongMap,
  activeSongMap,
  currentSectionIndex,
  unitsElapsed,
  isDelayPhase
}) {
  const beatsOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 12];
  const delayOptions = [0, 1, 2, 4];

  return (
    <div className={`${CARD} space-y-5`}>
      {/* Primary Start / Stop Action Button */}
      <button
        onClick={togglePlay}
        className={`w-full py-4 rounded-2xl font-bold text-base tracking-wide flex items-center justify-center gap-3 transition-all duration-200 shadow-lg cursor-pointer ${
          isPlaying
            ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/25 active:scale-[0.98]'
            : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/25 active:scale-[0.98]'
        }`}
      >
        {isPlaying ? (
          <>
            <Square className="w-5 h-5 fill-current" />
            STOP METRONOME
          </>
        ) : (
          <>
            <Play className="w-5 h-5 fill-current ml-0.5" />
            START METRONOME
          </>
        )}
      </button>

      {/* Song timeline: visible while playing; sequence editor takes over when stopped */}
      {isSongMap && isPlaying && (
        <SongTimeline
          activeSongMap={activeSongMap}
          currentSectionIndex={currentSectionIndex}
          unitsElapsed={unitsElapsed}
          isDelayPhase={isDelayPhase}
          isPlaying={isPlaying}
        />
      )}

      {/* Beats Per Bar (Time Signature Numerator) */}
      {!isSongMap && <div className="space-y-2">
        <span id="beats-label" className="block text-xs font-semibold text-slate-400 flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          Beats Per Measure (Time Signature)</span>
        <div role="group" aria-labelledby="beats-label" className="grid grid-cols-5 gap-1.5">
          {beatsOptions.map((num) => (
            <button
              key={num}
              onClick={() => setBeatsPerBar(num)}
              aria-pressed={beatsPerBar === num}
              className={`py-2 text-xs font-mono font-bold rounded-xl border transition-all cursor-pointer ${
                beatsPerBar === num
                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-500/10'
                  : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-400'
              }`}
            >
              {num}
            </button>
          ))}
        </div>
      </div>}

      {/* Subdivision Rate (Converted to Dropdown Select) */}
      {!isSongMap && <div className="space-y-2">
        <label htmlFor="subdivision-select" className="block text-xs font-semibold text-slate-400 flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          Subdivision Rate
        </label>
        <Select
          id="subdivision-select"
          value={subdivision}
          disabled={subdivisionLocked}
          onChange={(e) => setSubdivision(Number(e.target.value))}
          className={`${INPUT} rounded-2xl pl-3.5 pr-10 py-2.5 transition-all disabled:cursor-not-allowed`}
        >
          {SUBDIVISION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.value}x — {opt.label.replace(/^\d+x\s*/, '')}
            </option>
          ))}
        </Select>
        {subdivisionLocked && (
          <p className="text-[11px] text-amber-300/80">
            Controlled by the Sprint trainer (Subdivision Burst).
          </p>
        )}
      </div>}

      {/* Pre-Roll Count-In Delay */}
      <div className="space-y-2 pt-1 border-t border-slate-800/80">
        <span id="countin-label" className="block text-xs font-semibold text-slate-400 flex items-center gap-1.5">
          <Timer className="w-3.5 h-3.5 text-purple-400" />
          Pre-Roll Count-In Delay</span>
        <div role="group" aria-labelledby="countin-label" className="grid grid-cols-4 gap-1.5">
          {delayOptions.map((bars) => (
            <button
              key={bars}
              onClick={() => setStartDelayBars(bars)}
              aria-pressed={startDelayBars === bars}
              className={`py-2 text-xs font-mono font-bold rounded-xl border transition-all cursor-pointer ${
                startDelayBars === bars
                  ? 'bg-purple-500/20 border-purple-500 text-purple-300 shadow-md shadow-purple-500/10'
                  : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-400'
              }`}
            >
              {bars === 0 ? 'Off' : `${bars} ${bars === 1 ? 'Bar' : 'Bars'}`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
