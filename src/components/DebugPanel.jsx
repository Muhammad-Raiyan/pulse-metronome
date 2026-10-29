import { useEffect, useState } from 'react';
import { DELAY_WARN_MS, SPARK_POINTS, TICK_TARGET_MS, WINDOW_SIZE } from '../audio/accuracyStats';

const fmt = (v, digits = 2) => (typeof v === 'number' && Number.isFinite(v) ? v.toFixed(digits) : '-');
const signed = (v, digits = 2) => (typeof v === 'number' && Number.isFinite(v) ? `${v >= 0 ? '+' : ''}${v.toFixed(digits)}` : '-');

function Row({ label, hint, s, warn }) {
  return (
    <tr className={warn ? 'text-rose-300' : 'text-slate-300'} title={hint}>
      <td className="pr-3 py-0.5 text-slate-400">{label}</td>
      <td className="px-2 text-right">{s ? fmt(s.mean) : '-'}</td>
      <td className="px-2 text-right">{s ? fmt(s.rms) : '-'}</td>
      <td className="px-2 text-right">{s ? fmt(s.p95) : '-'}</td>
      <td className="px-2 text-right">{s ? fmt(s.min) : '-'}</td>
      <td className="px-2 text-right">{s ? fmt(s.max) : '-'}</td>
    </tr>
  );
}

// Sparkline of recent signed deviations around a zero line. The vertical range is at least
// +/- minRange ms so that tiny jitter does not look like a big spike.
function Sparkline({ values, label, minRange = 2, warnAbove = Infinity }) {
  const W = 300;
  const H = 56;
  const range = Math.max(minRange, ...values.map((v) => Math.abs(v)));
  // newest sample sits at the right edge; a partly filled window grows in from the right
  const x = (i) => W - (values.length - 1 - i) * (W / (SPARK_POINTS - 1));
  const y = (v) => H / 2 - (v / range) * (H / 2 - 3);
  const points = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');

  return (
    <figure className="m-0">
      <figcaption className="mb-1 text-slate-400">
        {label} <span className="text-slate-500">(±{fmt(range, 1)} ms scale)</span>
      </figcaption>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-14 rounded-md bg-slate-950/60"
        role="img"
        aria-label={`${label}, last ${values.length} samples`}
        preserveAspectRatio="none"
      >
        <line x1="0" y1={H / 2} x2={W} y2={H / 2} stroke="#475569" strokeWidth="1" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
        {values.length > 1 && (
          <polyline points={points} fill="none" stroke="#22d3ee" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        )}
        {values.map((v, i) =>
          Math.abs(v) > warnAbove ? (
            <circle key={i} cx={x(i)} cy={y(v)} r="2.5" fill="#fb7185" />
          ) : null
        )}
      </svg>
    </figure>
  );
}

// Per-tick strip: one cell per recent tick, newest on the right. Red = handed over late
// (audible), amber = display callback ran later than DELAY_WARN_MS, green = fine.
function TickStrip({ entries }) {
  return (
    <div className="flex flex-wrap gap-px" role="img" aria-label={`Last ${entries.length} ticks`}>
      {entries.map((e) => {
        const audioLate = e.leadMs < 0;
        const slow = e.delayMs !== null && e.delayMs > DELAY_WARN_MS;
        const color = audioLate ? 'bg-rose-500' : slow ? 'bg-amber-400' : e.delayMs === null ? 'bg-slate-600' : 'bg-emerald-500';
        return (
          <span
            key={e.seq}
            className={`h-3 w-2 rounded-sm ${color}`}
            title={`#${e.seq} beat ${e.beat + 1}.${e.sub + 1}  lead ${fmt(e.leadMs)} ms  delay ${fmt(e.delayMs)} ms`}
          />
        );
      })}
    </div>
  );
}

function Stat({ label, value, hint, warn }) {
  return (
    <div title={hint}>
      <dt className="text-slate-400">{label}</dt>
      <dd className={warn ? 'text-rose-300' : 'text-slate-100'}>{value}</dd>
    </div>
  );
}

// Live timing numbers for the audio engine. Rendered only while debug mode is on.
export function DebugPanel({ engineRef, isPlaying }) {
  const [snap, setSnap] = useState(null);

  useEffect(() => {
    const read = () => setSnap(engineRef.current?.getDebugSnapshot() ?? null);
    read();
    const id = setInterval(read, 250);
    return () => clearInterval(id);
  }, [engineRef]);

  const reset = () => {
    engineRef.current?.stats?.reset();
    setSnap(engineRef.current?.getDebugSnapshot() ?? null);
  };

  if (!snap) return null;

  const w = snap.window;
  const tj = snap.tickJitter;
  const worstTickGap = snap.tickInterval?.max ?? 0;
  const risky = w.audioLate > 0 || worstTickGap > snap.lookaheadMs;
  const delaySpark = w.entries.filter((e) => e.delayMs !== null).slice(-SPARK_POINTS).map((e) => e.delayMs);
  // Slowest 5 display callbacks in the window
  const worst = w.entries
    .filter((e) => e.delayMs !== null)
    .sort((a, b) => b.delayMs - a.delayMs)
    .slice(0, 5);

  return (
    <section
      aria-label="Timing accuracy debug panel"
      className="mt-6 w-full max-w-6xl rounded-2xl border border-slate-800 bg-slate-900/90 p-4 font-mono text-[11px] text-slate-300"
    >
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-sans text-xs font-bold text-slate-100">
          Timing accuracy <span className="text-slate-400 font-normal">(debug, last {WINDOW_SIZE} ticks)</span>
        </h2>
        <button
          onClick={reset}
          className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300"
        >
          Reset
        </button>
      </div>

      <p className={`mb-3 ${risky ? 'text-rose-300' : 'text-emerald-300'}`}>
        {!isPlaying && snap.notes === 0
          ? 'Start the metronome to collect data.'
          : risky
          ? `Timing risk: ${w.audioLate} of the last ${w.ticks} ticks handed to audio late (worst ${fmt(w.worstAudioLateMs, 1)} ms); worst scheduler gap ${fmt(worstTickGap, 1)} ms vs ${fmt(snap.lookaheadMs, 0)} ms lookahead.`
          : 'No late ticks in the window. Scheduler gaps are within the lookahead margin.'}
      </p>

      <dl className="mb-3 grid grid-cols-2 sm:grid-cols-5 gap-x-4 gap-y-2">
        <Stat label="worker tick (target)" value={`${fmt(TICK_TARGET_MS, 1)} ms`} hint="schedulerWorker.js interval" />
        <Stat
          label="current jitter"
          value={`${signed(tj?.last)} ms`}
          hint="Last scheduler tick gap minus the 25 ms target"
        />
        <Stat
          label="max drift"
          value={tj ? `${signed(tj.min)} / ${signed(tj.max)} ms` : '-'}
          hint="Largest early / late scheduler tick since playback started"
          warn={tj && Math.max(Math.abs(tj.min), Math.abs(tj.max)) > snap.lookaheadMs / 2}
        />
        <Stat
          label="mean jitter (± RMS)"
          value={tj ? `${signed(tj.mean)} (±${fmt(tj.rms)}) ms` : '-'}
          hint="Mean and root-mean-square of tick-gap error over the recent samples"
        />
        <Stat
          label="max display spike"
          value={snap.delayRun ? `${signed(snap.delayRun.max)} ms` : '-'}
          hint="Largest actual - intended time of any display callback since playback started"
          warn={snap.delayRun && snap.delayRun.max > DELAY_WARN_MS}
        />
      </dl>

      <div className="grid gap-3 sm:grid-cols-2 mb-3">
        <Sparkline
          label={`scheduler tick jitter, last ${SPARK_POINTS} (gap - ${TICK_TARGET_MS} ms)`}
          values={snap.tickJitterRecent}
          minRange={2}
          warnAbove={snap.lookaheadMs / 2}
        />
        <Sparkline
          label={`display delay, last ${SPARK_POINTS} (actual - intended)`}
          values={delaySpark}
          minRange={DELAY_WARN_MS}
          warnAbove={DELAY_WARN_MS}
        />
      </div>

      <TickStrip entries={w.entries} />
      <p className="mt-1 text-slate-400">
        green ok · amber display delay &gt; {DELAY_WARN_MS} ms ({w.overWarn}) · red handed to audio late ({w.audioLate}) · grey display pending
      </p>

      <div className="overflow-x-auto mt-3">
        <table className="w-full">
          <thead>
            <tr className="text-slate-400">
              <th className="text-left font-normal pr-3">metric (ms)</th>
              <th className="px-2 text-right font-normal">mean</th>
              <th className="px-2 text-right font-normal">rms</th>
              <th className="px-2 text-right font-normal">p95</th>
              <th className="px-2 text-right font-normal">min</th>
              <th className="px-2 text-right font-normal">max</th>
            </tr>
          </thead>
          <tbody>
            <Row
              label="delay: actual - intended"
              hint="audioCtx.currentTime when the tick's display callback ran, minus the time the scheduler intended the note for (window)."
              s={w.delay}
            />
            <Row
              label="lead: intended - handover"
              hint="How far ahead of the audio clock each note was handed over (window). Negative means it was already late."
              s={w.lead}
              warn={w.lead && w.lead.min < 0}
            />
            <Row
              label="tick jitter: gap - 25 ms"
              hint="Scheduler tick gap minus the nominal 25 ms. Mean/rms/p95 cover recent samples; min/max cover the whole run."
              s={tj}
              warn={tj && Math.max(Math.abs(tj.min), Math.abs(tj.max)) > snap.lookaheadMs / 2}
            />
          </tbody>
        </table>
      </div>

      {worst.length > 0 && (
        <div className="mt-3">
          <div className="text-slate-400">slowest display callbacks in window</div>
          <ul>
            {worst.map((e) => (
              <li key={e.seq} className={e.delayMs > DELAY_WARN_MS ? 'text-amber-300' : ''}>
                #{e.seq} beat {e.beat + 1}.{e.sub + 1}: delay {fmt(e.delayMs)} ms, lead {fmt(e.leadMs)} ms
              </li>
            ))}
          </ul>
        </div>
      )}

      <dl className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1">
        <div><dt className="text-slate-400">ticks (run)</dt><dd>{snap.notes} ({snap.lateNotes} late)</dd></div>
        <div>
          <dt className="text-slate-400">audio vs system clock</dt>
          <dd>{fmt(snap.drift.driftMs, 2)} ms / {fmt(snap.drift.elapsedMs / 1000, 0)} s</dd>
        </div>
        <div>
          <dt className="text-slate-400">base / output latency</dt>
          <dd>{fmt(snap.baseLatencyMs, 1)} / {fmt(snap.outputLatencyMs, 1)} ms</dd>
        </div>
        <div>
          <dt className="text-slate-400">context</dt>
          <dd>{snap.contextState} @ {snap.sampleRate} Hz</dd>
        </div>
      </dl>
    </section>
  );
}
