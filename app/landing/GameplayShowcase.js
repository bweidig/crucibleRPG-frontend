'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Tray from '@/app/play/components/Tray';
import CompactChip from '@/app/play/components/CompactChip';
import { TIMING_PHASE_1_ONLY, TIMING_FULL } from '@/app/play/components/diceTimings';
import styles from './GameplayShowcase.module.css';

// ─── Scenario Data ───
//
// Each choice's `results[id]` is shaped to feed the same Tray + CompactChip
// components /play uses for live rolls:
//   challenge   — STAT/skill/mode metadata, displayed by CompactChip's pill
//   rollResult  — the d20 outcome (kept value, mortals, total, DC, tier…)
//   resultText  — the narrative that types out after the roll resolves
//
// For outmatched scenarios, mortal1 = kept (the higher of two d20s, since
// outmatched takes the higher per the rulebook) and mortal2 is hardcoded to
// some plausible-but-lower value so the discarded die reads as "this was the
// other roll, not the one you kept" without looking absurd. Crucible values
// are mid-range non-extreme placeholders for the phase-1 die that throws
// before mortals appear.

const SCENARIOS = [
  {
    genre: 'DARK FANTASY',
    storyteller: 'Bard narrator',
    narrative: 'Dust motes hang in the thin beam of your lantern as you pry the silver-filigreed lockbox from the desk. Two silhouettes fill the doorway, the cold glint of drawn steel catching the dying embers of the hearth. One raises a heavy iron lantern, washing the small office in harsh, flickering amber light.',
    choices: [
      { id: 'A', text: 'Lunge forward, driving your shoulder into the lead man’s chest to tackle him back into the corridor.' },
      { id: 'B', text: 'Kick the heavy oak desk toward the door and vault through the open second-story window into the rain.' },
      { id: 'C', text: 'Drop the lockbox and raise your empty hands, pointing urgently toward the darkened corner behind them.' },
    ],
    results: {
      A: {
        challenge: { stat: 'STR', statValue: 4.5, skill: null, skillValue: null, mode: 'outmatched', actionLabel: 'Lunge forward, driving your shoulder into the lead man’s chest to tackle him back into the corridor.' },
        rollResult: {
          crucible: 12, kept: 7, mortal1: 7, mortal2: 3, winner: 1,
          total: 11.5, dc: 13, margin: -1.5, tier: 4, tierName: 'Small Mercy',
          mode: 'outmatched', isCrit: false, isFumble: false,
        },
        resultText: 'You slam into the lead thug, but he barely shifts, catching your momentum and shoving you back into the desk. The lockbox clatters to the floor and bursts open, spilling no gold. Instead, a single wax-sealed ledger slides across the floorboards, and in the guttering lantern light you catch a name you were never meant to see.',
        deltas: [
          { kind: 'gain', category: 'Item', label: 'Sealed Ledger', detail: 'added to inventory' },
          { kind: 'gain', category: 'Knowledge', label: 'Magister Halis', detail: 'new intel' },
          { kind: 'change', category: 'Suspicion', label: 'City Watch', detail: '+1 awareness' },
          { kind: 'change', category: 'Condition', label: 'Winded', detail: '1 scene' },
        ],
      },
      B: {
        challenge: { stat: 'DEX', statValue: 6.0, skill: null, skillValue: null, mode: 'matched', actionLabel: 'Kick the heavy oak desk toward the door and vault through the open second-story window into the rain.' },
        rollResult: {
          crucible: 16, kept: 16,
          total: 22.0, dc: 11, margin: 11.0, tier: 2, tierName: 'Success',
          mode: 'matched', isCrit: false, isFumble: false,
        },
        resultText: 'The desk slams into the thugs with a dull thud, pinning them against the frame as you vault through the window. Cold rain stings your face before you hit the muddy cobblestones below. You are out of the room, but a dozen torches now flicker in the dark alleyway. You are not alone out here.',
        deltas: [
          { kind: 'gain', category: 'Position', label: 'Street level', detail: 'escaped building' },
          { kind: 'change', category: 'Lockbox', label: 'Left behind', detail: 'unrecovered' },
          { kind: 'change', category: 'Alert', label: 'Street patrol', detail: 'active' },
          { kind: 'change', category: 'Condition', label: 'Bruised', detail: 'minor fall damage' },
        ],
      },
      C: {
        challenge: { stat: 'CHA', statValue: 3.5, skill: null, skillValue: null, mode: 'outmatched', actionLabel: 'Drop the lockbox and raise your empty hands, pointing urgently toward the darkened corner behind them.' },
        rollResult: {
          crucible: 14, kept: 11, mortal1: 11, mortal2: 5, winner: 1,
          total: 14.5, dc: 9, margin: 5.5, tier: 2, tierName: 'Success',
          mode: 'outmatched', isCrit: false, isFumble: false,
        },
        resultText: 'The thugs pivot toward the empty shadows, their blades dipping as they search for a threat that isn’t there. You slip through the gap between them, the metal of their armor cold against your shoulder. The lockbox remains on the desk, gleaming once in the amber light before you vanish into the hall.',
        deltas: [
          { kind: 'gain', category: 'Stealth', label: 'Undetected', detail: 'clean exit' },
          { kind: 'change', category: 'Lockbox', label: 'Left behind', detail: 'unrecovered' },
          { kind: 'change', category: 'NPC', label: 'Thugs', detail: 'temporarily deceived' },
        ],
      },
    },
  },
  {
    genre: 'INDUSTRIAL SCI-FI',
    storyteller: 'Noir narrator',
    narrative: 'The factory floor smells of machine oil and recycled air, lit only by the rhythmic strobe of a failing overhead unit. You tuck the encrypted drive into your grease-stained vest as the shift supervisor rounds the heavy press, two guards trailing him like a bad habit. He isn’t looking at your face; his eyes are fixed on your trembling left hand and the way you’re leaning away from the primary exit.',
    choices: [
      { id: 'A', text: 'Scale the coolant pipes toward the darkened ventilation ducting.' },
      { id: 'B', text: 'Short the localized power junction to kill the lights and mag-locks.' },
      { id: 'C', text: 'Present your temporary floor-lead badge and claim you’re checking a pressure leak.' },
    ],
    results: {
      A: {
        challenge: { stat: 'DEX', statValue: 4.0, skill: null, skillValue: null, mode: 'outmatched', actionLabel: 'Scale the coolant pipes toward the darkened ventilation ducting.' },
        rollResult: {
          crucible: 13, kept: 17, mortal1: 17, mortal2: 9, winner: 1,
          total: 21.0, dc: 14, margin: 7.0, tier: 2, tierName: 'Success',
          mode: 'outmatched', isCrit: false, isFumble: false,
        },
        resultText: 'The supervisor tracks your twitching fingers, but you’re already airborne. You scramble up the slick coolant pipes, vanishing into the overhead gloom before the strobe catches you. Their polished boots click uselessly on the metal floor below. You’re safe for now, but these cramped, airless ducts are just a different kind of coffin.',
        deltas: [
          { kind: 'gain', category: 'Item', label: 'Encrypted drive', detail: 'retained' },
          { kind: 'gain', category: 'Position', label: 'Ventilation ducts', detail: 'concealed' },
          { kind: 'change', category: 'Mobility', label: 'Cramped', detail: 'limited movement' },
          { kind: 'change', category: 'NPC', label: 'Supervisor', detail: 'lost visual' },
        ],
      },
      B: {
        challenge: { stat: 'INT', statValue: 6.0, skill: 'Electrical', skillValue: 1.0, mode: 'outmatched', actionLabel: 'Short the localized power junction to kill the lights and mag-locks.' },
        rollResult: {
          crucible: 11, kept: 3, mortal1: 3, mortal2: 2, winner: 1,
          total: 10.0, dc: 15, margin: -5.0, tier: 5, tierName: 'Failure',
          mode: 'outmatched', isCrit: false, isFumble: false,
        },
        resultText: 'The junction box spits a violent geyser of blue sparks, leaving the mag-locks frozen shut and your face bathed in light. The supervisor’s eyes track the smoke to your singed sleeve, then drop to the drive-shaped bulge in your vest. He signals the guards. Nice work, Edison.',
        deltas: [
          { kind: 'change', category: 'Sabotage', label: 'Mag-locks', detail: 'frozen (failed)' },
          { kind: 'change', category: 'Cover', label: 'Blown', detail: 'identified by supervisor' },
          { kind: 'change', category: 'Condition', label: 'Singed', detail: 'minor burn' },
          { kind: 'change', category: 'Alert', label: 'Guards', detail: 'dispatched' },
        ],
      },
      C: {
        challenge: { stat: 'CHA', statValue: 5.5, skill: 'Forgery', skillValue: 1.0, mode: 'matched', actionLabel: 'Present your temporary floor-lead badge and claim you’re checking a pressure leak.' },
        rollResult: {
          crucible: 8, kept: 8,
          total: 14.5, dc: 13, margin: 1.5, tier: 3, tierName: 'Costly Success',
          mode: 'matched', isCrit: false, isFumble: false,
        },
        resultText: 'The supervisor’s eyes track your twitching hand before settling on the counterfeit badge. He smells a lie like ozone before a short circuit. He nods for you to proceed, but his fingers are already tracing the silent alarm on his belt. You’re clear, but not clean. Move.',
        deltas: [
          { kind: 'gain', category: 'Item', label: 'Encrypted drive', detail: 'retained' },
          { kind: 'gain', category: 'Clearance', label: 'Floor pass', detail: 'accepted' },
          { kind: 'change', category: 'Alarm', label: 'Silent', detail: 'triggered' },
          { kind: 'change', category: 'NPC', label: 'Supervisor', detail: 'flagged you' },
        ],
      },
    },
  },
  {
    genre: 'NOIR MYSTERY',
    storyteller: 'Whisper narrator',
    narrative: 'The desk lamp casts a golden glow over the polished mahogany and the steam rising from your tea smells of cinnamon. Your client leans back in the leather chair while the radiator hums a steady, rhythmic tune. He hasn’t blinked since you placed the photograph between you. The corners of his mouth are doing something that isn’t quite a smile.',
    choices: [
      { id: 'A', text: 'Lay the photograph face down on the blotter and watch the client’s reflection in the window while the silence stretches.' },
      { id: 'B', text: 'Slide the photograph into your inner coat pocket and offer the client a fresh cup of tea to end the meeting early.' },
      { id: 'C', text: 'Turn the photograph over to show the date on the back and ask the client why the timeline is different.' },
    ],
    results: {
      A: {
        challenge: { stat: 'WIS', statValue: 5.5, skill: null, skillValue: null, mode: 'matched', actionLabel: 'Lay the photograph face down on the blotter and watch the client’s reflection in the window while the silence stretches.' },
        rollResult: {
          crucible: 13, kept: 13,
          total: 18.5, dc: 10, margin: 8.5, tier: 2, tierName: 'Success',
          mode: 'matched', isCrit: false, isFumble: false,
        },
        resultText: 'You set the photograph face down without a word. In the window glass, the client’s reflection does what his face won’t: his jaw tightens, and one hand drifts to his breast pocket before stopping itself. He leaves the photograph where it is. He hasn’t asked what you know. That tells you more than the picture did.',
        deltas: [
          { kind: 'gain', category: 'Insight', label: 'Evasion tell', detail: 'breast pocket reach' },
          { kind: 'gain', category: 'Knowledge', label: 'Photo significance', detail: 'client avoided asking' },
          { kind: 'change', category: 'NPC', label: 'Client', detail: 'composure cracked' },
        ],
      },
      B: {
        challenge: { stat: 'CHA', statValue: 4.0, skill: null, skillValue: null, mode: 'matched', actionLabel: 'Slide the photograph into your inner coat pocket and offer the client a fresh cup of tea to end the meeting early.' },
        rollResult: {
          crucible: 15, kept: 15,
          total: 19.0, dc: 8, margin: 11.0, tier: 2, tierName: 'Success',
          mode: 'matched', isCrit: false, isFumble: false,
        },
        resultText: 'The photograph disappears into your coat and the client’s shoulders settle half an inch. He accepts the fresh cup with both hands, steady now, and thanks you warmly. The conversation turns to the weather, to the tea, to nothing at all. His gaze drifts to your coat pocket twice before he finishes his cup.',
        deltas: [
          { kind: 'gain', category: 'Item', label: 'Photograph', detail: 'secured' },
          { kind: 'gain', category: 'Rapport', label: 'Client', detail: 'trust gained' },
          { kind: 'change', category: 'NPC', label: 'Client', detail: 'fixated on photo' },
        ],
      },
      C: {
        challenge: { stat: 'INT', statValue: 6.0, skill: null, skillValue: null, mode: 'outmatched', actionLabel: 'Turn the photograph over to show the date on the back and ask the client why the timeline is different.' },
        rollResult: {
          crucible: 14, kept: 3, mortal1: 3, mortal2: 2, winner: 1,
          total: 9.0, dc: 14, margin: -5.0, tier: 5, tierName: 'Failure',
          mode: 'outmatched', isCrit: false, isFumble: false,
        },
        resultText: 'The client sets down his tea and regards you with a patient, pleasant expression. He tells you he appreciates your thoroughness but he’s not sure this arrangement is working out. He takes the photograph from the desk and slides it into his jacket. He wishes you a lovely evening on his way out the door.',
        deltas: [
          { kind: 'change', category: 'Item', label: 'Photograph', detail: 'taken by client' },
          { kind: 'change', category: 'NPC', label: 'Client', detail: 'terminated relationship' },
          { kind: 'change', category: 'Case', label: 'Access', detail: 'revoked' },
        ],
      },
    },
  },
];

// ─── Math Summary Helper ───
//
// Formats the same fields the CompactChip surfaces into a single one-line
// readout: stat (+ skill) + d20 → total vs DC → tier. The "outmatched" branch
// adds the kept-of-(m1, m2) note so the reader can see which mortal won.
// Right-arrow → and middle-dot · are intentional — matches the in-game chip.

function formatMathSummary(challenge, rollResult) {
  const { stat, statValue, skill, skillValue, mode } = challenge;
  const { kept, mortal1, mortal2, total, dc, tierName } = rollResult;
  const stat1 = statValue.toFixed(1);
  const skillPart = skill ? ` + ${skill} ${skillValue.toFixed(1)}` : '';
  const total1 = total.toFixed(1);
  const outmatchedTail = mode !== 'matched'
    ? ` · outmatched · kept of (${mortal1}, ${mortal2})`
    : '';
  return `${stat} ${stat1}${skillPart} + d20(${kept})${outmatchedTail} → ${total1} vs DC ${dc} → ${tierName}`;
}

// ─── Animation Phases ───
// 0 = idle, 1 = genre fade, 2 = narrative typing, 3 = pause after narrative,
// 4 = choices visible (WAITING for user click), 6 = selection highlight,
// 7 = die ready (WAITING for user tap; reduced motion skips to compact),
// 8 = brief pause after chip appears, 9 = result typing,
// 10 = pause after result, 11 = controls visible

// ─── Typewriter Hook ───

function useTypewriter(text, speed, active, skipAnimation) {
  const [wordCount, setWordCount] = useState(0);
  const words = text ? text.split(' ') : [];
  const done = wordCount >= words.length;

  useEffect(() => {
    if (!active || !text) { setWordCount(0); return; }
    if (skipAnimation) { setWordCount(words.length); return; }
    setWordCount(0);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setWordCount(i);
      if (i >= words.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [active, text, speed, skipAnimation]);

  const visible = words.slice(0, wordCount).join(' ');
  return { visible, done, wordCount };
}

// ─── Deltas Panel ───
//
// Renders below the result narrative once the typewriter finishes. Two parts:
// a single-line math summary (the formula the engine ran) and a wrap-flow row
// of pills showing the world-state changes the outcome produced. Pills stagger
// in via the existing fadeUpIn keyframe; reduced-motion zeroes the delays so
// pills land together without the cascading entrance.

function DeltasPanel({ challenge, rollResult, deltas, reducedMotion }) {
  const summary = formatMathSummary(challenge, rollResult);

  return (
    <div>
      <div
        style={{
          width: 60,
          height: 1,
          background: 'linear-gradient(to right, var(--accent-gold), transparent)',
          marginTop: 28,
          marginBottom: 18,
        }}
      />
      <p
        style={{
          fontFamily: 'var(--font-jetbrains)',
          fontSize: 12,
          fontWeight: 400,
          color: 'var(--text-muted)',
          letterSpacing: '0.02em',
          margin: 0,
        }}
      >
        {summary}
      </p>
      <div
        className={styles.deltasPills}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          marginTop: 16,
        }}
      >
        {deltas.map((delta, i) => {
          const isGain = delta.kind === 'gain';
          const sign = isGain ? '+' : '±';
          return (
            <div
              key={i}
              className={styles.deltaPill}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '7px 13px 7px 11px',
                borderRadius: 4,
                background: isGain ? 'var(--bg-gold-subtle)' : 'var(--bg-panel)',
                border: `1px solid ${isGain ? 'var(--border-card)' : 'var(--border-primary)'}`,
                animation: 'fadeUpIn 0.35s ease both',
                animationDelay: reducedMotion ? '0s' : `${0.06 * i}s`,
              }}
            >
              <span
                className={styles.deltaSign}
                style={{
                  fontFamily: 'var(--font-cinzel)',
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.18em',
                  color: isGain ? 'var(--accent-gold)' : '#e8c45a',
                }}
              >
                {sign} {delta.category.toUpperCase()}
              </span>
              <span
                className={styles.deltaLabel}
                style={{
                  fontFamily: 'var(--font-alegreya-sans)',
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                }}
              >
                {delta.label}
              </span>
              <span
                className={styles.deltaDetail}
                style={{
                  fontFamily: 'var(--font-alegreya-sans)',
                  fontSize: 12,
                  fontWeight: 400,
                  color: 'var(--text-muted)',
                }}
              >
                {delta.detail}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Component ───

export default function GameplayShowcase() {
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [phase, setPhase] = useState(4); // Start at 4 for firstView (choices visible, awaiting click)
  const [firstView, setFirstView] = useState(true);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [fadingOut, setFadingOut] = useState(false);
  const [revealed, setRevealed] = useState(false); // IO fade-in trigger
  const [allPlayed, setAllPlayed] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [lockedHeight, setLockedHeight] = useState(undefined);

  // Dice stage machine — independent of `phase` so the user controls when the
  // roll fires. 'ready' = die visible awaiting tap, 'rolling' = animation
  // playing, 'collapsing' = tray fading toward chip, 'compact' = chip shown.
  const [stage, setStage] = useState('ready');
  const [dicePhase, setDicePhase] = useState('ready');
  const rollingStartedRef = useRef(false);

  const containerRef = useRef(null);
  const innerRef = useRef(null);
  const diceRef = useRef(null);
  const triggeredRef = useRef(false);
  const timersRef = useRef([]);

  // Detect reduced motion preference
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const scenario = SCENARIOS[scenarioIndex];
  const selectedResult = selectedChoice ? scenario.results[selectedChoice] : null;
  const isPhaseOneOnly = selectedResult?.challenge?.mode === 'matched'
    || selectedResult?.rollResult?.isCrit
    || selectedResult?.rollResult?.isFumble;

  // Narrative skips typewriter on firstView (already visible); result always typewriters
  const skipNarrativeTypewriter = firstView || reducedMotion;
  const skipResultTypewriter = reducedMotion;

  // Clear all pending timers
  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const addTimer = useCallback((fn, delay) => {
    const id = setTimeout(fn, delay);
    timersRef.current.push(id);
    return id;
  }, []);

  // Typewriter for narrative (phase 2) — skipped on firstView since it's pre-rendered
  const narrative = useTypewriter(
    scenario.narrative,
    30,
    phase >= 2,
    skipNarrativeTypewriter
  );

  // Typewriter for result (phase 9) — always animates, even on firstView
  const result = useTypewriter(
    selectedResult?.resultText || '',
    25,
    phase >= 9,
    skipResultTypewriter
  );

  // Drive the animation sequence forward (only when NOT in firstView)
  useEffect(() => {
    if (firstView) return;
    if (phase === 1) {
      addTimer(() => setPhase(2), 600);
    }
  }, [phase === 1, firstView]);

  useEffect(() => {
    if (firstView) return;
    if (phase === 2 && narrative.done) {
      addTimer(() => setPhase(3), 100);
      addTimer(() => setPhase(4), 800);
    }
  }, [phase === 2, narrative.done, firstView]);

  // Phase 4 = choices visible — NO auto-advance. Wait for user click.

  // Phase 6 → 7 (selection highlight → die ready). Same timing on firstView
  // and subsequent scenarios; reduced motion shortens the highlight beat.
  useEffect(() => {
    if (phase !== 6) return;
    addTimer(() => setPhase(7), reducedMotion ? 200 : 600);
  }, [phase === 6, reducedMotion]);

  // Phase 7: set up the dice stage. Reduced motion bypasses the roll
  // animation entirely — chip renders immediately and we advance to phase 9
  // after a short intentional beat.
  useEffect(() => {
    if (phase !== 7) return;
    if (reducedMotion) {
      setStage('compact');
      addTimer(() => setPhase(9), 300);
    } else {
      setStage('ready');
      setDicePhase('ready');
      rollingStartedRef.current = false;
    }
  }, [phase === 7, reducedMotion]);

  // Stage 'rolling' — drive the timing table once. setTimeout IDs are tracked
  // through addTimer so a TRY ANOTHER mid-roll cancels them via clearTimers.
  useEffect(() => {
    if (stage !== 'rolling') return;
    if (rollingStartedRef.current) return;
    rollingStartedRef.current = true;
    const table = isPhaseOneOnly ? TIMING_PHASE_1_ONLY : TIMING_FULL;
    table.forEach(step => {
      addTimer(() => {
        if (step.phase != null) setDicePhase(step.phase);
        if (step.stage != null) {
          setStage(step.stage);
          if (step.stage === 'compact') setPhase(8);
        }
      }, step.at);
    });
  }, [stage, isPhaseOneOnly]);

  // Phase 8 → 9 (chip pause → result typing). Doesn't fire on the reduced-
  // motion path (which jumps phase 7 → 9 directly).
  useEffect(() => {
    if (phase !== 8) return;
    addTimer(() => setPhase(9), 400);
  }, [phase === 8]);

  // Phase 9 → 10 → 11 (typing done → pause → controls)
  useEffect(() => {
    if (phase === 9 && result.done) {
      addTimer(() => setPhase(10), 200);
      addTimer(() => setPhase(11), 1200);
    }
  }, [phase === 9, result.done]);

  // Reset dice stage whenever we leave the dice region (e.g. TRY ANOTHER,
  // scenario change). Without this the chip would briefly flash before phase
  // 7's effect rebuilt state on the next click.
  useEffect(() => {
    if (phase < 7) {
      setStage('ready');
      setDicePhase('ready');
      rollingStartedRef.current = false;
    }
  }, [phase < 7]);

  // Clear locked height once enough content has rendered
  useEffect(() => {
    if (phase >= 4 && lockedHeight !== undefined) {
      setLockedHeight(undefined);
    }
  }, [phase >= 4]);

  // IntersectionObserver — gentle fade-in for first view
  useEffect(() => {
    if (triggeredRef.current) return;
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !triggeredRef.current) {
          triggeredRef.current = true;
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Cleanup timers on unmount
  useEffect(() => () => clearTimers(), [clearTimers]);

  // ─── Handlers ───

  const handleChoiceClick = useCallback((choiceId) => {
    if (selectedChoice) return; // Already selected
    setSelectedChoice(choiceId);
    setPhase(6);
    // Once the dice region has rendered, scroll it into view so the user can
    // see and tap the die without scrolling manually.
    addTimer(() => {
      diceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 700);
  }, [selectedChoice, addTimer]);

  const handleChoiceKeyDown = useCallback((e, choiceId) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleChoiceClick(choiceId);
    }
  }, [handleChoiceClick]);

  // Tap the crucible die to begin the roll animation. Showcase always
  // requires a tap regardless of any localStorage autoRoll preference —
  // anonymous visitors don't have saved settings.
  const handleDieTap = useCallback(() => {
    if (stage !== 'ready') return;
    setStage('rolling');
  }, [stage]);

  // Shared transition logic: fade out → swap scenario → fade in + animate
  const transitionTo = useCallback((nextIndex) => {
    if (innerRef.current) {
      setLockedHeight(innerRef.current.offsetHeight);
    }
    setFadingOut(false);
    setTransitioning(true);
    clearTimers();

    addTimer(() => {
      setFirstView(false);
      setScenarioIndex(nextIndex);
      setSelectedChoice(null);
      setPhase(0);
      setTransitioning(false);
      setTimeout(() => setPhase(1), 50);
    }, 200);
  }, [clearTimers, addTimer]);

  const handleTryAnother = useCallback(() => {
    if (reducedMotion) {
      clearTimers();
      setSelectedChoice(null);
      setPhase(4);
      return;
    }

    containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setFadingOut(true);
    clearTimers();

    addTimer(() => {
      setFadingOut(false);
      setSelectedChoice(null);
      setPhase(4);
    }, 250);
  }, [reducedMotion, clearTimers, addTimer]);

  const handleNext = useCallback(() => {
    const nextIndex = (scenarioIndex + 1) % SCENARIOS.length;
    if (scenarioIndex === SCENARIOS.length - 1) {
      setAllPlayed(true);
    }
    transitionTo(nextIndex);
  }, [scenarioIndex, transitionTo]);

  const handleDotClick = useCallback((index) => {
    if (index === scenarioIndex && phase >= 1) return;
    transitionTo(index);
  }, [scenarioIndex, phase, transitionTo]);

  // ─── Render ───

  const showChoices = phase >= 4;
  const selectionMade = !!selectedChoice;
  const showDice = phase >= 7 && selectedResult;
  const showResult = phase >= 9 && selectedResult;
  const showDeltas = result.done && selectedResult;
  const showControls = phase >= 11;

  const buttonText = allPlayed || (scenarioIndex === SCENARIOS.length - 1 && showControls)
    ? 'REPLAY' : 'NEXT SCENARIO';

  // For first view, skip slide-in animations on choices
  const choiceAnimStyle = firstView ? { animation: 'none', opacity: 1, transform: 'none' } : {};

  // Discarded mortal value for the CompactChip's two-die display. For matched
  // scenarios this is null (single die only); for outmatched/dominant it's
  // the mortal that wasn't kept — derived from the explicit `winner` field
  // so the chip stays in lockstep with the Tray's animation outcome.
  const discardedDie = selectedResult && selectedResult.challenge.mode !== 'matched'
    ? (selectedResult.rollResult.winner === 1
        ? selectedResult.rollResult.mortal2
        : selectedResult.rollResult.mortal1)
    : null;

  return (
    <section
      className={`${styles.showcase} ${revealed ? styles.showcaseRevealed : ''}`}
      ref={containerRef}
    >
      <div
        className={`${styles.inner} ${transitioning ? styles.innerTransitioning : ''}`}
        ref={innerRef}
        style={lockedHeight !== undefined ? { minHeight: lockedHeight } : undefined}
      >
        {/* Genre + Storyteller */}
        <div className={`${styles.genreRow} ${phase >= 1 ? styles.visible : ''}`}>
          <span className={styles.genreLabel}>{scenario.genre}</span>
          <span className={styles.storytellerLabel}>{scenario.storyteller}</span>
        </div>

        {/* Narrative */}
        {phase >= 2 && (
          <div className={styles.narrativeBlock}>
            <span className={styles.narrativeText}>
              {narrative.visible}
              {!narrative.done && <span className={styles.cursor}>|</span>}
              {narrative.done && <span className={`${styles.cursor} ${styles.cursorFade}`}>|</span>}
            </span>
          </div>
        )}

        {/* Choice Cards */}
        {showChoices && (
          <div className={styles.choicesBlock}>
            {scenario.choices.map((choice, i) => {
              const isSelected = selectionMade && choice.id === selectedChoice;
              const isDimmed = selectionMade && choice.id !== selectedChoice;
              return (
                <div
                  key={choice.id}
                  className={`${styles.choiceCard} ${isSelected ? styles.choiceSelected : ''} ${isDimmed ? styles.choiceDimmed : ''}`}
                  style={{
                    ...choiceAnimStyle,
                    ...(firstView ? {} : { animationDelay: `${i * 120}ms` }),
                  }}
                  onClick={selectionMade ? undefined : () => handleChoiceClick(choice.id)}
                  onKeyDown={selectionMade ? undefined : (e) => handleChoiceKeyDown(e, choice.id)}
                  tabIndex={selectionMade ? -1 : 0}
                  role="button"
                  aria-label={`Choice ${choice.id}: ${choice.text}`}
                >
                  <span className={`${styles.choiceLetter} ${isSelected ? styles.choiceLetterSelected : ''}`}>
                    {choice.id}
                  </span>
                  <span className={styles.choiceText}>{choice.text}</span>
                </div>
              );
            })}
            {/* Custom action row — always dimmed, not interactive */}
            <div
              className={styles.customRow}
              style={firstView ? { animation: 'none' } : { animationDelay: `${scenario.choices.length * 120}ms` }}
            >
              <div className={styles.customInput}>Or describe your own action...</div>
              <div className={styles.customGo}>GO</div>
            </div>
            <div className={styles.customAvailableLabel}>Available in game</div>
          </div>
        )}

        {/* Dice region — Tray during ready/rolling/collapsing, CompactChip after */}
        {showDice && (
          <div ref={diceRef} className={`${styles.diceRegion} ${fadingOut ? styles.fadingOut : ''}`}>
            {(stage === 'ready' || stage === 'rolling' || stage === 'collapsing') && (
              <div className={`${styles.diceTrayWrap} ${stage === 'collapsing' ? styles.diceTrayCollapsing : ''}`}>
                <Tray
                  mode={selectedResult.challenge.mode}
                  crucible={selectedResult.rollResult.crucible}
                  mortal1={selectedResult.rollResult.mortal1}
                  mortal2={selectedResult.rollResult.mortal2}
                  phase={dicePhase}
                  onTap={handleDieTap}
                  isCrit={selectedResult.rollResult.isCrit}
                  isFumble={selectedResult.rollResult.isFumble}
                />
                {stage === 'ready' && (
                  <div className={styles.tapHint}>TAP THE CRUCIBLE TO THROW</div>
                )}
              </div>
            )}
            {stage === 'compact' && (
              <CompactChip
                kept={selectedResult.rollResult.kept}
                total={selectedResult.rollResult.total}
                stat={selectedResult.challenge.stat}
                statValue={selectedResult.challenge.statValue}
                skill={selectedResult.challenge.skill}
                skillValue={selectedResult.challenge.skillValue}
                dc={selectedResult.rollResult.dc}
                margin={selectedResult.rollResult.margin}
                tier={selectedResult.rollResult.tier}
                tierName={selectedResult.rollResult.tierName}
                mode={selectedResult.challenge.mode}
                isCrit={selectedResult.rollResult.isCrit}
                isFumble={selectedResult.rollResult.isFumble}
                keptDie={selectedResult.rollResult.kept}
                discardedDie={discardedDie}
                animate
              />
            )}
          </div>
        )}

        {/* Result Text */}
        {showResult && (
          <div className={`${styles.resultBlock} ${fadingOut ? styles.fadingOut : ''}`}>
            <span className={styles.resultText}>
              {result.visible}
              {!result.done && <span className={styles.cursor}>|</span>}
              {result.done && <span className={`${styles.cursor} ${styles.cursorFade}`}>|</span>}
            </span>
          </div>
        )}

        {/* Deltas Panel — math summary + state-change pills */}
        {showDeltas && (
          <div className={`${styles.deltasBlock} ${fadingOut ? styles.fadingOut : ''}`}>
            <DeltasPanel
              challenge={selectedResult.challenge}
              rollResult={selectedResult.rollResult}
              deltas={selectedResult.deltas}
              reducedMotion={reducedMotion}
            />
          </div>
        )}

        {/* Navigation — visible from phase 4; TRY ANOTHER only after result */}
        {showChoices && (
          <div className={styles.controlsBlock} style={firstView ? { animation: 'none', opacity: 1, transform: 'none' } : {}}>
            <div className={styles.buttonRow}>
              {showControls && (
                <button
                  className={`${styles.replayButton} ${fadingOut ? styles.fadingOut : ''}`}
                  onClick={handleTryAnother}
                >
                  TRY ANOTHER
                </button>
              )}
              <button className={styles.replayButton} onClick={handleNext}>
                {buttonText}
              </button>
            </div>
            <div className={styles.dotsRow}>
              {SCENARIOS.map((_, i) => (
                <button
                  key={i}
                  className={`${styles.dot} ${i === scenarioIndex ? styles.dotActive : ''}`}
                  onClick={() => handleDotClick(i)}
                  aria-label={`Scenario ${i + 1}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
