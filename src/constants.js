export const MIN_BPM = 30;
export const MAX_BPM = 300;
export const clampBpm = (value) => {
  const n = Math.round(Number(value));
  return Number.isFinite(n) ? Math.min(MAX_BPM, Math.max(MIN_BPM, n)) : MIN_BPM;
};

export const AUTOMATION_MODES = {
  MANUAL: 'manual',
  RAMP: 'gradual',
  JOG_SPRINT: 'jogsprint',
  MUTE_TRAINER: 'mute',
  SONG_MAP: 'songmap',
};

export const SPRINT_STRATEGIES = {
  BPM: 'bpm',
  SUBDIVISION: 'subdivision',
};

export const SUBDIV_METRICS = {
  BARS: 'bars',
  BEATS: 'beats',
};

export const ACCENT_TYPES = {
  ACCENT: 0,
  NORMAL: 1,
  SOFT: 2,
  MUTED: 3,
};

export const SUBDIVISION_OPTIONS = [
  { value: 1, label: '1x Quarter' },
  { value: 2, label: '2x Eighths' },
  { value: 3, label: '3x Triplets' },
  { value: 4, label: '4x Sixteenths' },
  { value: 5, label: '5x Quintuplets' },
  { value: 6, label: '6x Sextuplets' },
  { value: 7, label: '7x Septuplets' },
  { value: 8, label: '8x Thirty-Seconds' },
  { value: 9, label: '9x Nontuplets' },
  { value: 10, label: '10x Decuplets' }
];