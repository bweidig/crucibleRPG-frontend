'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './GameplayShowcase.module.css';

// ─── Scenario Data ───

const SCENARIOS = [
  {
    genre: 'DARK FANTASY',
    storyteller: 'Bard narrator',
    narrative: 'Dust motes hang in the thin beam of your lantern as you pry the silver-filigreed lockbox from the desk. Two silhouettes fill the doorway, the cold glint of drawn steel catching the dying embers of the hearth. One raises a heavy iron lantern, washing the small office in harsh, flickering amber light.',
    choices: [
      { id: 'A', text: 'Lunge forward, driving your shoulder into the lead man\u2019s chest to tackle him back into the corridor.' },
      { id: 'B', text: 'Kick the heavy oak desk toward the door and vault through the open second-story window into the rain.' },
      { id: 'C', text: 'Drop the lockbox and raise your empty hands, pointing urgently toward the darkened corner behind them.' },
    ],
    selected: 'B',
    dice: {
      segments: [
        { text: 'DEX 6.0', bold: true },
        { text: 'vs DC 11.0', bold: true },
        { text: 'Matched' },
        { text: 'Roll: 16', bold: true },
        { text: 'Tier 2 Success', color: 'success' },
      ],
    },
    result: 'The desk slams into the thugs\u2019 shins with a wooden crack, buying you the second needed to tumble out into the night air. You land hard on the cobblestones, twisting your ankle, just as a shout from the street confirms the building is already surrounded.',
  },
  {
    genre: 'INDUSTRIAL SCI-FI',
    storyteller: 'Noir narrator',
    narrative: 'The factory floor smells of machine oil and recycled air, lit only by the rhythmic strobe of a failing overhead unit. You tuck the encrypted drive into your grease-stained vest as the shift supervisor rounds the heavy press, two guards trailing him like a bad habit. He isn\u2019t looking at your face; his eyes are fixed on your trembling left hand and the way you\u2019re leaning away from the primary exit.',
    choices: [
      { id: 'A', text: 'Scale the coolant pipes toward the darkened ventilation ducting.' },
      { id: 'B', text: 'Short the localized power junction to kill the lights and mag-locks.' },
      { id: 'C', text: 'Present your temporary floor-lead badge and claim you\u2019re checking a pressure leak.' },
    ],
    selected: 'C',
    dice: {
      segments: [
        { text: 'CHA 5.5 + Forgery +1.0', bold: true },
        { text: 'vs DC 13.0', bold: true },
        { text: 'Matched' },
        { text: 'Roll: 8', bold: true },
        { text: 'Tier 3 Costly Success', color: 'costly' },
      ],
    },
    result: 'The supervisor stares at the forged badge, his thumb tracing the jagged edge of the laminate while his radio begins to hiss with an unscheduled roll call. He nods you through, but he lingers to watch your gait, already reaching for his headset to verify your clearance.',
  },
  {
    genre: 'NOIR MYSTERY',
    storyteller: 'Whisper narrator',
    narrative: 'The desk lamp casts a golden glow over the polished mahogany and the steam rising from your tea smells of cinnamon. Your client leans back in the leather chair while the radiator hums a steady, rhythmic tune of home. Outside the window, the heavy rain falls upward in gentle, silver streaks toward the clouds.',
    choices: [
      { id: 'A', text: 'Lay the photograph face down on the blotter and watch the client\u2019s reflection in the window while the silence stretches.' },
      { id: 'B', text: 'Slide the photograph into your inner coat pocket and offer the client a fresh cup of tea to end the meeting early.' },
      { id: 'C', text: 'Turn the photograph over to show the date on the back and ask the client why the timeline is different.' },
    ],
    selected: 'A',
    dice: {
      segments: [
        { text: 'WIS 5.5', bold: true },
        { text: 'vs DC 10.0', bold: true },
        { text: 'Matched' },
        { text: 'Roll: 13', bold: true },
        { text: 'Tier 2 Success', color: 'success' },
      ],
    },
    result: 'The client gazes at the photograph and a single bead of sweat tracks slowly down his temple despite the pleasant chill of the room. He adjusts his tie and whispers that he must have simply forgotten he was at the docks that night.',
  },
];

// ─── Animation Phases ───
// 0 = idle, 1 = genre fade, 2 = narrative typing, 3 = pause after narrative,
// 4 = choices sliding in, 5 = pause before selection, 6 = selection highlight,
// 7 = dice fade, 8 = pause before result, 9 = result typing,
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

// ─── Component ───

export default function GameplayShowcase() {
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [phase, setPhase] = useState(11); // Start at 11 (fully rendered) for first view
  const [firstView, setFirstView] = useState(true);
  const [revealed, setRevealed] = useState(false); // IO fade-in trigger
  const [allPlayed, setAllPlayed] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [lockedHeight, setLockedHeight] = useState(undefined);
  const containerRef = useRef(null);
  const innerRef = useRef(null);
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

  // Skip animations: first view shows everything instantly, reduced motion also skips typewriter
  const skipTypewriter = firstView || reducedMotion;

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

  // Typewriter for narrative (phase 2)
  const narrative = useTypewriter(
    scenario.narrative,
    50,
    phase >= 2,
    skipTypewriter
  );

  // Typewriter for result (phase 9)
  const result = useTypewriter(
    scenario.result,
    40,
    phase >= 9,
    skipTypewriter
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

  useEffect(() => {
    if (firstView) return;
    if (phase === 4) {
      addTimer(() => setPhase(5), 1000);
      addTimer(() => setPhase(6), 1500);
    }
  }, [phase === 4, firstView]);

  useEffect(() => {
    if (firstView) return;
    if (phase === 6) {
      addTimer(() => setPhase(7), 600);
    }
  }, [phase === 6, firstView]);

  useEffect(() => {
    if (firstView) return;
    if (phase === 7) {
      addTimer(() => setPhase(8), 400);
      addTimer(() => setPhase(9), 400);
    }
  }, [phase === 7, firstView]);

  useEffect(() => {
    if (firstView) return;
    if (phase === 9 && result.done) {
      addTimer(() => setPhase(10), 200);
      addTimer(() => setPhase(11), 1200);
    }
  }, [phase === 9, result.done, firstView]);

  // Clear locked height once enough content has rendered
  useEffect(() => {
    if (phase >= 4 && lockedHeight !== undefined) {
      setLockedHeight(undefined);
    }
  }, [phase >= 4]);

  // Start the animated sequence (used for scenarios after the first)
  const startSequence = useCallback(() => {
    clearTimers();
    setPhase(0);
    requestAnimationFrame(() => {
      setPhase(1);
    });
  }, [clearTimers]);

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

  // Shared transition logic: fade out → swap scenario → fade in + animate
  const transitionTo = useCallback((nextIndex) => {
    // Lock height and fade out
    if (innerRef.current) {
      setLockedHeight(innerRef.current.offsetHeight);
    }
    setTransitioning(true);
    clearTimers();

    // After fade-out completes, swap content and start new sequence
    addTimer(() => {
      setFirstView(false);
      setScenarioIndex(nextIndex);
      setPhase(0);
      setTransitioning(false);
      // Small delay for state to propagate, then kick off animation
      setTimeout(() => setPhase(1), 50);
    }, 200);
  }, [clearTimers, addTimer]);

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
  const selectionMade = phase >= 6;
  const showDice = phase >= 7;
  const showResult = phase >= 9;
  const showControls = phase >= 11;

  const buttonText = allPlayed || (scenarioIndex === SCENARIOS.length - 1 && showControls)
    ? 'REPLAY' : 'NEXT SCENARIO';

  // For first view, skip slide-in animations on choices
  const choiceAnimStyle = firstView ? { animation: 'none', opacity: 1, transform: 'none' } : {};

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
              const isSelected = selectionMade && choice.id === scenario.selected;
              const isDimmed = selectionMade && choice.id !== scenario.selected;
              return (
                <div
                  key={choice.id}
                  className={`${styles.choiceCard} ${isSelected ? styles.choiceSelected : ''} ${isDimmed ? styles.choiceDimmed : ''}`}
                  style={{
                    ...choiceAnimStyle,
                    ...(firstView ? {} : { animationDelay: `${i * 120}ms` }),
                  }}
                >
                  <span className={`${styles.choiceLetter} ${isSelected ? styles.choiceLetterSelected : ''}`}>
                    {choice.id}
                  </span>
                  <span className={styles.choiceText}>{choice.text}</span>
                </div>
              );
            })}
            {/* Custom action row (D) */}
            <div
              className={`${styles.customRow} ${selectionMade ? styles.choiceDimmed : ''}`}
              style={{
                ...choiceAnimStyle,
                ...(firstView ? {} : { animationDelay: `${scenario.choices.length * 120}ms` }),
              }}
            >
              <div className={styles.customInput}>Or describe your own action...</div>
              <div className={styles.customGo}>GO</div>
            </div>
          </div>
        )}

        {/* Dice Result */}
        {showDice && (
          <div className={styles.diceBar} style={firstView ? { animation: 'none', opacity: 1, transform: 'none' } : {}}>
            {scenario.dice.segments.map((seg, i) => (
              <span key={i} className={styles.diceSegment}>
                {i > 0 && <span className={styles.diceDot}>&middot;</span>}
                <span
                  className={`${seg.bold ? styles.diceBold : ''} ${
                    seg.color === 'success' ? styles.diceSuccess :
                    seg.color === 'costly' ? styles.diceCostly : ''
                  }`}
                >
                  {seg.text}
                </span>
              </span>
            ))}
          </div>
        )}

        {/* Result Text */}
        {showResult && (
          <div className={styles.resultBlock}>
            <span className={styles.resultText}>
              {result.visible}
              {!result.done && <span className={styles.cursor}>|</span>}
              {result.done && <span className={`${styles.cursor} ${styles.cursorFade}`}>|</span>}
            </span>
          </div>
        )}

        {/* Replay Controls */}
        {showControls && (
          <div className={styles.controlsBlock} style={firstView ? { animation: 'none', opacity: 1, transform: 'none' } : {}}>
            <button className={styles.replayButton} onClick={handleNext}>
              {buttonText}
            </button>
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
