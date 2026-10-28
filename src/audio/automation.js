import { AUTOMATION_MODES, SPRINT_STRATEGIES, SUBDIV_METRICS, clampBpm } from '../constants.js';

/**
 * Advance the automation state by one bar/beat boundary.
 *
 * `s` is the live snapshot read by the audio engine. It is mutated in place so the very
 * next scheduled note already sees the new phase. The function returns a `patch` holding
 * only the values that changed, which the caller mirrors into React state for display.
 * `patch.section` is set when a song-map section became active (tempo, meter and
 * subdivision should be applied by the caller).
 *
 * @param {object} s    live automation snapshot (mutated)
 * @param {'bar'|'beat'} type  boundary that was just crossed
 * @returns {object} patch of changed values
 */
export function advanceAutomation(s, type) {
  const patch = {};

  const setUnits = (n) => {
    s.unitsElapsed = n;
    patch.unitsElapsed = n;
  };

  // Count-in: nothing else advances until it finishes
  if (s.isDelayPhase) {
    if (type === 'bar') {
      const next = s.delayBarsElapsed + 1;
      if (next >= s.startDelayBars) {
        s.isDelayPhase = false;
        s.delayBarsElapsed = 0;
        patch.isDelayPhase = false;
        patch.delayBarsElapsed = 0;
      } else {
        s.delayBarsElapsed = next;
        patch.delayBarsElapsed = next;
      }
    }
    return patch;
  }

  if (s.automationMode === AUTOMATION_MODES.RAMP && type === 'bar') {
    const next = s.unitsElapsed + 1;
    if (next >= s.gradualInterval) {
      if (s.bpm < s.gradualCap) {
        const nextBpm = Math.min(s.gradualCap, s.bpm + s.gradualStep);
        s.bpm = nextBpm;
        s.isSpeedCapReached = nextBpm >= s.gradualCap;
        patch.bpm = nextBpm;
      }
      setUnits(0);
    } else {
      setUnits(next);
    }
  } else if (s.automationMode === AUTOMATION_MODES.JOG_SPRINT) {
    const byBars =
      s.sprintType === SPRINT_STRATEGIES.BPM ||
      (s.sprintType === SPRINT_STRATEGIES.SUBDIVISION && s.subdivMetric === SUBDIV_METRICS.BARS);
    const byBeats =
      s.sprintType === SPRINT_STRATEGIES.SUBDIVISION && s.subdivMetric === SUBDIV_METRICS.BEATS;

    if ((byBars && type === 'bar') || (byBeats && (type === 'beat' || type === 'bar'))) {
      const bpmMode = s.sprintType === SPRINT_STRATEGIES.BPM;
      const targetLimit = s.isSprintPhase
        ? (bpmMode ? s.sprintBars : s.sprintUnits)
        : (bpmMode ? s.jogBars : s.jogUnits);

      const next = s.unitsElapsed + 1;
      if (next >= targetLimit) {
        const nextSprintState = !s.isSprintPhase;
        s.isSprintPhase = nextSprintState;
        patch.isSprintPhase = nextSprintState;
        if (bpmMode) {
          const nextBpm = clampBpm(nextSprintState ? s.sprintBpm : s.jogBpm);
          s.bpm = nextBpm;
          patch.bpm = nextBpm;
        } else {
          s.subdivision = nextSprintState ? s.sprintSubdiv : s.jogSubdiv;
        }
        setUnits(0);
      } else {
        setUnits(next);
      }
    }
  } else if (s.automationMode === AUTOMATION_MODES.MUTE_TRAINER && type === 'bar') {
    const targetLimit = s.isMutePhase ? s.muteBarsSilent : s.muteBarsPlay;
    const next = s.unitsElapsed + 1;
    if (next >= targetLimit) {
      s.isMutePhase = !s.isMutePhase;
      patch.isMutePhase = s.isMutePhase;
      setUnits(0);
    } else {
      setUnits(next);
    }
  } else if (s.automationMode === AUTOMATION_MODES.SONG_MAP && s.activeSongMap && type === 'bar') {
    const sections = s.activeSongMap.sections;
    const currentSection = sections?.[s.currentSectionIndex];

    if (currentSection) {
      const nextBars = s.unitsElapsed + 1;
      if (nextBars >= currentSection.bars) {
        const nextIndex = s.currentSectionIndex + 1 < sections.length ? s.currentSectionIndex + 1 : 0;
        const sec = sections[nextIndex];
        s.currentSectionIndex = nextIndex;
        patch.currentSectionIndex = nextIndex;
        patch.section = sec;
        if (sec.bpm) s.bpm = clampBpm(sec.bpm);
        if (sec.beatsPerBar) s.beatsPerBar = sec.beatsPerBar;
        s.subdivision = sec.subdivision || 1;
        setUnits(0);
      } else {
        setUnits(nextBars);
      }
    }
  }

  return patch;
}
