import React, { useEffect, useRef, useState, useCallback } from 'react';
import Tray from './Tray';
import CompactChip from './CompactChip';
import styles from './TurnRoll.module.css';

// ─── Timing tables (all in ms from tap moment) ───
// Extreme (nat20/nat1) or matched mode stops at phase 1.
const TIMING_PHASE_1_ONLY = [
  { at: 0,    phase: 'p1-throw' },
  { at: 180,  phase: 'p1-tumble' },
  { at: 730,  phase: 'p1-land' },
  { at: 1150, phase: 'p1-settled' },
  { at: 2100, stage: 'collapsing' },
  { at: 2650, stage: 'compact' },
];

// Non-extreme outmatched/dominant plays both phases.
const TIMING_FULL = [
  { at: 0,    phase: 'p1-throw' },
  { at: 180,  phase: 'p1-tumble' },
  { at: 730,  phase: 'p1-land' },
  { at: 1150, phase: 'p1-settled' },
  { at: 1650, phase: 'p1-exit' },
  { at: 2200, phase: 'p2-drop' },
  { at: 2680, phase: 'p2-tumble' },
  { at: 3180, phase: 'p2-land' },
  { at: 3600, phase: 'p2-settled' },
  { at: 4600, stage: 'collapsing' },
  { at: 5150, stage: 'compact' },
];

const SETTINGS_KEY = 'crucible_display_settings';

// Default behavior: tap-to-roll. The player reads the challenge panel,
// then taps the crucible to throw. Set `autoRoll: true` in
// localStorage.crucible_display_settings to opt into auto-rolling.
function readClickToRoll() {
  if (typeof window === 'undefined') return true;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return true;
    const parsed = JSON.parse(raw);
    if (parsed?.autoRoll === true) return false;
    // Backwards-compat: honor an explicit clickToRoll: false to opt out.
    if (parsed?.clickToRoll === false) return false;
    return true;
  } catch {
    return true;
  }
}

function fmt(n) {
  if (n == null) return '?';
  if (typeof n !== 'number') return String(n);
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

// Challenge panel — visible during ready + rolling stages.
function ChallengePanel({ challenge, stage, onTap, tray }) {
  const {
    stat, statValue, skill, skillValue, mode, prompt, actionLabel,
  } = challenge || {};

  return (
    <div className={`${styles.challenge} ${stage === 'collapsing' ? styles.challengeCollapsing : ''}`}>
      <div className={styles.kicker}>A ROLL IS REQUIRED</div>
      {prompt && <div className={styles.prompt}>{prompt}</div>}
      {actionLabel && <div className={styles.actionLabel}>{actionLabel}</div>}
      <div className={styles.metaPill}>
        {stat && (
          <>
            <span className={styles.metaPillKey}>{stat.toUpperCase()}</span>
            <span className={styles.metaPillValue}>{fmt(statValue)}</span>
          </>
        )}
        {skill && (
          <>
            <span className={styles.metaPillDot}>·</span>
            <span className={styles.metaPillKey}>{skill}</span>
            <span className={styles.metaPillValue}>+{fmt(skillValue)}</span>
          </>
        )}
        {mode && (
          <>
            <span className={styles.metaPillDot}>·</span>
            <span className={styles.metaPillMode}>{mode.toUpperCase()}</span>
          </>
        )}
      </div>
      {tray}
      {stage === 'ready' && (
        <div className={styles.tapHint}>TAP THE CRUCIBLE TO THROW</div>
      )}
    </div>
  );
}

export default function TurnRoll({ challenge, result, onResolved, animate = true }) {
  // Stage machine: ready → rolling → collapsing → compact
  // If click-to-roll is off (default) or animate is false, skip straight past ready.
  const clickToRoll = useRef(readClickToRoll()).current;
  const initialStage = !animate ? 'compact' : (clickToRoll ? 'ready' : 'rolling');
  const [stage, setStage] = useState(initialStage);
  const [phase, setPhase] = useState(clickToRoll && animate ? 'ready' : 'ready');

  const resolvedFiredRef = useRef(false);
  // onResolved is typically a fresh closure each parent render; route through a
  // ref so the timer callbacks below don't need it in their deps (which would
  // cause the timing effect to restart and drop pending timers).
  const onResolvedRef = useRef(onResolved);
  useEffect(() => { onResolvedRef.current = onResolved; }, [onResolved]);

  const fireResolved = useCallback(() => {
    if (!resolvedFiredRef.current) {
      resolvedFiredRef.current = true;
      onResolvedRef.current?.();
    }
  }, []);

  // If we started in compact mode (historical turn or animate=false), fire onResolved
  // immediately so the parent ungates the narrative.
  useEffect(() => {
    if (!animate) {
      fireResolved();
    }
  }, [animate, fireResolved]);

  const { crucible, mortal1, mortal2, isCrit, isFumble, mode } = result || {};

  // Matched mode has no mortal dice; extreme (nat20/nat1) stops at phase 1 regardless.
  const isPhaseOneOnly = mode === 'matched' || isCrit || isFumble;

  // Drive the timing table once per roll. Guarded by rollingStartedRef so the
  // effect re-running on stage transitions (rolling → collapsing → compact)
  // doesn't re-schedule. Crucially, we do NOT return a cleanup that clears
  // the timers: that was the original bug — when stage changed mid-roll, the
  // effect's cleanup cleared the still-pending 'compact' timer and onResolved
  // never fired, leaving the narrative gated forever. An unmount-guard on the
  // ref below makes stray timers safe.
  const rollingStartedRef = useRef(false);
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  useEffect(() => {
    if (stage !== 'rolling') return;
    if (rollingStartedRef.current) return;
    rollingStartedRef.current = true;
    const table = isPhaseOneOnly ? TIMING_PHASE_1_ONLY : TIMING_FULL;
    table.forEach(step => {
      setTimeout(() => {
        if (!mountedRef.current) return;
        if (step.phase != null) setPhase(step.phase);
        if (step.stage != null) {
          setStage(step.stage);
          if (step.stage === 'compact') fireResolved();
        }
      }, step.at);
    });
  }, [stage, isPhaseOneOnly, fireResolved]);

  const handleTap = useCallback(() => {
    if (stage !== 'ready') return;
    setStage('rolling');
  }, [stage]);

  // While the ChallengePanel is visible (ready/rolling/collapsing), publish a
  // body attribute that the ActionPanel listens to on phones to collapse the
  // dock — so the dice, which render inline in the narrative scroll, get the
  // full available height. Compact stage (the chip) doesn't need the collapse.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (stage === 'compact') {
      if (document.body.dataset.diceRolling) {
        delete document.body.dataset.diceRolling;
      }
      return;
    }
    document.body.dataset.diceRolling = 'true';
    return () => {
      if (document.body.dataset.diceRolling) {
        delete document.body.dataset.diceRolling;
      }
    };
  }, [stage]);

  // ─── Historical / auto-compact render ───
  if (stage === 'compact') {
    return (
      <CompactChip
        kept={result?.kept}
        total={result?.total}
        stat={challenge?.stat}
        statValue={challenge?.statValue}
        skill={challenge?.skill}
        skillValue={challenge?.skillValue}
        dc={result?.dc}
        margin={result?.margin}
        tier={result?.tier}
        tierName={result?.tierName}
        mode={mode}
        isCrit={isCrit}
        isFumble={isFumble}
        keptDie={result?.kept}
        discardedDie={(mode !== 'matched' && !isCrit && !isFumble)
          ? (result?.winner === 1 ? mortal2 : mortal1)
          : null}
        animate={animate && !resolvedFiredRef.current}
      />
    );
  }

  // ─── Challenge panel (ready or rolling or collapsing) ───
  const tray = (
    <Tray
      mode={mode}
      crucible={crucible}
      mortal1={mortal1}
      mortal2={mortal2}
      phase={phase}
      onTap={handleTap}
      isCrit={isCrit}
      isFumble={isFumble}
    />
  );

  return (
    <ChallengePanel
      challenge={challenge}
      stage={stage}
      onTap={handleTap}
      tray={tray}
    />
  );
}
