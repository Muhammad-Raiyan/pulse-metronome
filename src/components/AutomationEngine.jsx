import { NumberInput } from './NumberInput';
import { Select } from './Select';
import {
  AUTOMATION_MODES,
  SPRINT_STRATEGIES,
  SUBDIV_METRICS,
  SUBDIVISION_OPTIONS,
  MIN_BPM,
  MAX_BPM
} from '../constants';
import { Sliders, Zap, Flame, VolumeX, Music2 } from 'lucide-react';

const MODE_TABS = [
  { mode: AUTOMATION_MODES.MANUAL, label: 'Manual', Icon: null, active: 'bg-slate-800 text-cyan-400 shadow-sm' },
  { mode: AUTOMATION_MODES.RAMP, label: 'Ramp', Icon: Zap, active: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' },
  { mode: AUTOMATION_MODES.JOG_SPRINT, label: 'Sprint', Icon: Flame, active: 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm' },
  { mode: AUTOMATION_MODES.MUTE_TRAINER, label: 'Mute', Icon: VolumeX, active: 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm' },
  { mode: AUTOMATION_MODES.SONG_MAP, label: 'Song', Icon: Music2, active: 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm' }
];

// Colours of the small settings panels: a plain one, the highlighted "burst" one, and "silent"
const PANEL = {
  rest: { box: 'bg-slate-900/80 border-slate-800/80', title: 'text-slate-400', input: 'text-slate-200' },
  burst: { box: 'bg-amber-500/10 border-amber-500/20', title: 'text-amber-400', input: 'text-amber-300' },
  silent: { box: 'bg-rose-500/10 border-rose-500/20', title: 'text-rose-300', input: 'text-rose-300' }
};

const RAMP_INPUT =
  'w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-100 focus:outline-none focus:border-cyan-500';

const subdivText = (opt) => `${opt.value}x (${opt.label.split(' ')[1] || opt.label})`;

function PhasePanel({ title, tone = 'rest', children }) {
  const t = PANEL[tone];
  return (
    <div className={`${t.box} border p-2.5 rounded-xl space-y-2`}>
      <span className={`text-[11px] font-bold uppercase tracking-wider block ${t.title}`}>{title}</span>
      {children}
    </div>
  );
}

function Field({ label, labelClass = 'mb-0.5', children }) {
  return (
    <div>
      <label className={`block text-[11px] text-slate-400 ${labelClass}`}>{label}</label>
      {children}
    </div>
  );
}

function Num({ tone = 'rest', ...props }) {
  return (
    <NumberInput
      {...props}
      className={`w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono font-bold ${PANEL[tone].input}`}
    />
  );
}

// Two-option (or more) toggle: [{ value, label }]
function Segmented({ options, value, onChange, label }) {
  return (
    <div role="group" aria-label={label} className="flex gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={`px-2 py-0.5 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
            value === o.value
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// BPM + number of bars, for one phase of the BPM-jump sprint
function BpmBarsPanel({ title, tone, name, bpm, setBpm, bars, setBars }) {
  return (
    <PhasePanel title={title} tone={tone}>
      <div className="grid grid-cols-2 gap-2">
        <Field label="BPM">
          <Num tone={tone} min={MIN_BPM} max={MAX_BPM} aria-label={`${name} phase BPM`} value={bpm} onChange={setBpm} />
        </Field>
        <Field label="Bars">
          <Num tone={tone} min={1} max={32} aria-label={`${name} phase bars`} value={bars} onChange={setBars} />
        </Field>
      </div>
    </PhasePanel>
  );
}

// Subdivision rate + how long it lasts, for one phase of the subdivision-burst sprint
function SubdivPanel({ title, tone, name, subdiv, setSubdiv, units, setUnits, unitLabel }) {
  return (
    <PhasePanel title={title} tone={tone}>
      <div className="grid grid-cols-[3fr_2fr] gap-2">
        <Field label="Rate">
          <Select
            aria-label={`${name} subdivision rate`}
            value={subdiv}
            onChange={(e) => setSubdiv(Number(e.target.value))}
            className={`w-full bg-slate-950 border border-slate-800 rounded-lg pl-2 pr-7 py-1 text-xs font-mono font-bold focus:outline-none focus:border-amber-500 ${PANEL[tone].input}`}
          >
            {SUBDIVISION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{subdivText(opt)}</option>
            ))}
          </Select>
        </Field>
        <Field label={unitLabel}>
          <Num tone={tone} min={1} max={32} aria-label={`${name} subdivision duration`} value={units} onChange={setUnits} />
        </Field>
      </div>
    </PhasePanel>
  );
}

const SECTION = 'p-4 rounded-2xl bg-slate-950 border border-slate-800';

export function AutomationEngine({ automationMode, setAutomationMode, trainer, onTrainerChange, activeSongMap }) {
  // set('jogBpm') -> a (value) => void setter for that one setting
  const set = (key) => (value) => onTrainerChange(key, value);
  const {
    gradualInterval, gradualStep, gradualCap,
    sprintType, jogBpm, sprintBpm, jogBars, sprintBars,
    subdivMetric, jogSubdiv, sprintSubdiv, jogUnits, sprintUnits,
    muteBarsPlay, muteBarsSilent
  } = trainer;  const hasSections = activeSongMap?.sections?.length > 0;
  const unitLabel = subdivMetric === SUBDIV_METRICS.BARS ? 'Bars' : 'Beats';

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-5 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <h2 className="font-bold text-sm text-slate-100">Automation Engine</h2>
        </div>
        <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-800 text-slate-400">
          Trainer
        </span>
      </div>

      {/* Mode Selector Tabs */}
      <div role="group" aria-label="Automation mode" className="grid grid-cols-5 gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800/80">
        {MODE_TABS.map(({ mode, label, Icon, active }) => (
          <button
            key={mode}
            onClick={() => setAutomationMode(mode)}
            aria-pressed={automationMode === mode}
            className={`py-2 text-[11px] font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
              automationMode === mode ? active : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {Icon && <Icon className="w-3 h-3" />}
            {label}
          </button>
        ))}
      </div>

      {/* 1. MANUAL MODE */}
      {automationMode === AUTOMATION_MODES.MANUAL && (
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/60 text-center space-y-1">
          <p className="text-xs font-semibold text-slate-300">Manual Controls Active</p>
          <p className="text-[11px] text-slate-400">
            Standard fixed-tempo operation.
          </p>
        </div>
      )}

      {/* 2. GRADUAL RAMP UP MODE */}
      {automationMode === AUTOMATION_MODES.RAMP && (
        <div className={`${SECTION} space-y-4`}>
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            Gradual Ramp Settings
          </span>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Every (Bars)" labelClass="font-semibold mb-1">
              <NumberInput min={1} max={64} aria-label="Ramp: raise tempo every N bars" value={gradualInterval} onChange={set('gradualInterval')} className={RAMP_INPUT} />
            </Field>
            <Field label="Add (+BPM)" labelClass="font-semibold mb-1">
              <NumberInput min={1} max={30} aria-label="Ramp: BPM increase per step" value={gradualStep} onChange={set('gradualStep')} className={RAMP_INPUT} />
            </Field>
            <Field label="Cap Limit" labelClass="font-semibold mb-1">
              <NumberInput min={40} max={300} aria-label="Ramp: maximum BPM" value={gradualCap} onChange={set('gradualCap')} className={RAMP_INPUT} />
            </Field>
          </div>
        </div>
      )}

      {/* 3. JOG / SPRINT TRAINER MODE */}
      {automationMode === AUTOMATION_MODES.JOG_SPRINT && (
        <div className={`${SECTION} space-y-4`}>
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              Sprint Trainer Strategy
            </span>
            <Segmented
              label="Sprint strategy"
              value={sprintType}
              onChange={set('sprintType')}
              options={[
                { value: SPRINT_STRATEGIES.BPM, label: 'BPM Jump' },
                { value: SPRINT_STRATEGIES.SUBDIVISION, label: 'Subdivision Burst' }
              ]}
            />
          </div>

          {/* SPRINT TYPE A: BPM JUMP */}
          {sprintType === SPRINT_STRATEGIES.BPM && (
            <div className="grid grid-cols-2 gap-3">
              <BpmBarsPanel title="🏃 Jog Phase" tone="rest" name="Jog" bpm={jogBpm} setBpm={set('jogBpm')} bars={jogBars} setBars={set('jogBars')} />
              <BpmBarsPanel title="🔥 Sprint Burst" tone="burst" name="Sprint" bpm={sprintBpm} setBpm={set('sprintBpm')} bars={sprintBars} setBars={set('sprintBars')} />
            </div>
          )}

          {/* SPRINT TYPE B: SUBDIVISION BURST */}
          {sprintType === SPRINT_STRATEGIES.SUBDIVISION && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400">Interval Metric</span>
                <Segmented
                  label="Interval metric"
                  value={subdivMetric}
                  onChange={set('subdivMetric')}
                  options={[
                    { value: SUBDIV_METRICS.BARS, label: 'Bars' },
                    { value: SUBDIV_METRICS.BEATS, label: 'Beats' }
                  ]}
                />
              </div>

              <div className="grid grid-cols-1 gap-3">
                <SubdivPanel title="🏃 Rest Subdiv" tone="rest" name="Rest" subdiv={jogSubdiv} setSubdiv={set('jogSubdiv')} units={jogUnits} setUnits={set('jogUnits')} unitLabel={unitLabel} />
                <SubdivPanel title="🔥 Burst Subdiv" tone="burst" name="Burst" subdiv={sprintSubdiv} setSubdiv={set('sprintSubdiv')} units={sprintUnits} setUnits={set('sprintUnits')} unitLabel={unitLabel} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. MUTE TRAINER MODE */}
      {automationMode === AUTOMATION_MODES.MUTE_TRAINER && (
        <div className={`${SECTION} space-y-4`}>
          <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
            <VolumeX className="w-3.5 h-3.5 text-rose-400" />
            Inner Clock Mute Settings
          </span>
          <div className="grid grid-cols-2 gap-3">
            <PhasePanel title="🔊 Play Bars" tone="rest">
              <Num min={1} max={32} aria-label="Mute trainer: bars playing" value={muteBarsPlay} onChange={set('muteBarsPlay')} />
            </PhasePanel>
            <PhasePanel title="🔇 Silent Bars" tone="silent">
              <Num tone="silent" min={1} max={32} aria-label="Mute trainer: silent bars" value={muteBarsSilent} onChange={set('muteBarsSilent')} />
            </PhasePanel>
          </div>
        </div>
      )}

      {/* 5. SONG MAP AUTOMATION MODE */}
      {automationMode === AUTOMATION_MODES.SONG_MAP && (
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/60 text-center space-y-2">
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-purple-300">
            <Music2 className="w-4 h-4 text-purple-400" />
            {hasSections ? 'Multi-Section Song Map Active' : 'No Song Map Loaded'}
          </div>
          <p className="text-[11px] text-slate-400">
            {hasSections
              ? `Tempo and subdivisions follow the sections of "${activeSongMap.title}".`
              : activeSongMap
              ? `"${activeSongMap.title}" has no sections, so it plays at a fixed tempo.`
              : 'Pick a song from the library below to load its sections.'}
          </p>
        </div>
      )}
    </div>
  );
}
