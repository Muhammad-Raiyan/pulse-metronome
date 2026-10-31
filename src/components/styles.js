// Shared UI style constants — import these instead of repeating inline strings.
// Changing a value here updates every consumer automatically.

/** Outer panel / card shell used for every major section. */
export const CARD = 'bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl';

/** Inner section box inside a card (tighter, no shadow). */
export const SECTION_BOX = 'p-4 rounded-2xl bg-slate-950 border border-slate-800';

/** Single-line text input / number field. */
export const INPUT =
  'w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-200 focus:outline-none focus:border-cyan-500 disabled:opacity-50';

/** Wider select / dropdown variant of INPUT. */
export const SELECT = `${INPUT} pr-6 pl-1.5`;

/** Field label (sits above an INPUT). */
export const FIELD_LABEL = 'block text-[11px] text-slate-400';

/** Secondary text — muted labels and helper copy. */
export const TEXT_MUTED = 'text-xs font-semibold text-slate-400';
