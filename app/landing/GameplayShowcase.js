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
    results: {
      A: {
        dice: {
          segments: [
            { text: 'STR 4.5', bold: true },
            { text: 'vs DC 13.0', bold: true },
            { text: 'Outmatched' },
            { text: 'Roll: 7', bold: true },
            { text: 'Total: 11.5', bold: true },
            { text: 'Tier 4 Small Mercy', color: 'mercy' },
          ],
        },
        result: 'You slam into the lead thug, but he barely shifts, catching your momentum and shoving you back into the desk. The lockbox clatters to the floor and bursts open, spilling no gold. Instead, a single wax-sealed ledger slides across the floorboards, and in the guttering lantern light you catch a name you were never meant to see.',
      },
      B: {
        dice: {
          segments: [
            { text: 'DEX 6.0', bold: true },
            { text: 'vs DC 11.0', bold: true },
            { text: 'Matched' },
            { text: 'Roll: 16', bold: true },
            { text: 'Total: 22.0', bold: true },
            { text: 'Tier 2 Success', color: 'success' },
          ],
        },
        result: 'The desk slams into the thugs with a dull thud, pinning them against the frame as you vault through the window. Cold rain stings your face before you hit the muddy cobblestones below. You are out of the room, but a dozen torches now flicker in the dark alleyway. You are not alone out here.',
      },
      C: {
        dice: {
          segments: [
            { text: 'CHA 3.5', bold: true },
            { text: 'vs DC 9.0', bold: true },
            { text: 'Outmatched' },
            { text: 'Roll: 11', bold: true },
            { text: 'Total: 14.5', bold: true },
            { text: 'Tier 2 Success', color: 'success' },
          ],
        },
        result: 'The thugs pivot toward the empty shadows, their blades dipping as they search for a threat that isn\u2019t there. You slip through the gap between them, the metal of their armor cold against your shoulder. The lockbox remains on the desk, gleaming once in the amber light before you vanish into the hall.',
      },
    },
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
    results: {
      A: {
        dice: {
          segments: [
            { text: 'DEX 4.0', bold: true },
            { text: 'vs DC 14.0', bold: true },
            { text: 'Outmatched' },
            { text: 'Roll: 17', bold: true },
            { text: 'Total: 21.0', bold: true },
            { text: 'Tier 2 Success', color: 'success' },
          ],
        },
        result: 'The supervisor tracks your twitching fingers, but you\u2019re already airborne. You scramble up the slick coolant pipes, vanishing into the overhead gloom before the strobe catches you. Their polished boots click uselessly on the metal floor below. You\u2019re safe for now, but these cramped, airless ducts are just a different kind of coffin.',
      },
      B: {
        dice: {
          segments: [
            { text: 'INT 6.0 + Electrical +1.0', bold: true },
            { text: 'vs DC 15.0', bold: true },
            { text: 'Outmatched' },
            { text: 'Roll: 3', bold: true },
            { text: 'Total: 10.0', bold: true },
            { text: 'Tier 5 Failure', color: 'failure' },
          ],
        },
        result: 'The junction box spits a violent geyser of blue sparks, leaving the mag-locks frozen shut and your face bathed in light. The supervisor\u2019s eyes track the smoke to your singed sleeve, then drop to the drive-shaped bulge in your vest. He signals the guards. Nice work, Edison.',
      },
      C: {
        dice: {
          segments: [
            { text: 'CHA 5.5 + Forgery +1.0', bold: true },
            { text: 'vs DC 13.0', bold: true },
            { text: 'Matched' },
            { text: 'Roll: 8', bold: true },
            { text: 'Total: 14.5', bold: true },
            { text: 'Tier 3 Costly Success', color: 'costly' },
          ],
        },
        result: 'The supervisor\u2019s eyes track your twitching hand before settling on the counterfeit badge. He smells a lie like ozone before a short circuit. He nods for you to proceed, but his fingers are already tracing the silent alarm on his belt. You\u2019re clear, but not clean. Move.',
      },
    },
  },
  {
    genre: 'NOIR MYSTERY',
    storyteller: 'Whisper narrator',
    narrative: 'The desk lamp casts a golden glow over the polished mahogany and the steam rising from your tea smells of cinnamon. Your client leans back in the leather chair while the radiator hums a steady, rhythmic tune. He hasn\u2019t blinked since you placed the photograph between you. The corners of his mouth are doing something that isn\u2019t quite a smile.',
    choices: [
      { id: 'A', text: 'Lay the photograph face down on the blotter and watch the client\u2019s reflection in the window while the silence stretches.' },
      { id: 'B', text: 'Slide the photograph into your inner coat pocket and offer the client a fresh cup of tea to end the meeting early.' },
      { id: 'C', text: 'Turn the photograph over to show the date on the back and ask the client why the timeline is different.' },
    ],
    results: {
      A: {
        dice: {
          segments: [
            { text: 'WIS 5.5', bold: true },
            { text: 'vs DC 10.0', bold: true },
            { text: 'Matched' },
            { text: 'Roll: 13', bold: true },
            { text: 'Total: 18.5', bold: true },
            { text: 'Tier 2 Success', color: 'success' },
          ],
        },
        result: 'You set the photograph face down without a word. In the window glass, the client\u2019s reflection does what his face won\u2019t: his jaw tightens, and one hand drifts to his breast pocket before stopping itself. He leaves the photograph where it is. He hasn\u2019t asked what you know. That tells you more than the picture did.',
      },
      B: {
        dice: {
          segments: [
            { text: 'CHA 4.0', bold: true },
            { text: 'vs DC 8.0', bold: true },
            { text: 'Matched' },
            { text: 'Roll: 15', bold: true },
            { text: 'Total: 19.0', bold: true },
            { text: 'Tier 2 Success', color: 'success' },
          ],
        },
        result: 'The photograph disappears into your coat and the client\u2019s shoulders settle half an inch. He accepts the fresh cup with both hands, steady now, and thanks you warmly. The conversation turns to the weather, to the tea, to nothing at all. His gaze drifts to your coat pocket twice before he finishes his cup.',
      },
      C: {
        dice: {
          segments: [
            { text: 'INT 6.0', bold: true },
            { text: 'vs DC 14.0', bold: true },
            { text: 'Outmatched' },
            { text: 'Roll: 3', bold: true },
            { text: 'Total: 9.0', bold: true },
            { text: 'Tier 5 Failure', color: 'failure' },
          ],
        },
        result: 'The client sets down his tea and regards you with a patient, pleasant expression. He tells you he appreciates your thoroughness but he\u2019s not sure this arrangement is working out. He takes the photograph from the desk and slides it into his jacket. He wishes you a lovely evening on his way out the door.',
      },
    },
  },
];

// ─── Animation Phases ───
// 0 = idle, 1 = genre fade, 2 = narrative typing, 3 = pause after narrative,
// 4 = choices visible (WAITING for user click), 6 = selection highlight,
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
  const [phase, setPhase] = useState(4); // Start at 4 for firstView (choices visible, awaiting click)
  const [firstView, setFirstView] = useState(true);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [fadingOut, setFadingOut] = useState(false);
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
  const selectedResult = selectedChoice ? scenario.results[selectedChoice] : null;

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
    50,
    phase >= 2,
    skipNarrativeTypewriter
  );

  // Typewriter for result (phase 9) — always animates, even on firstView
  const result = useTypewriter(
    selectedResult?.result || '',
    40,
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
    if (phase === 9 && result.done) {
      addTimer(() => setPhase(10), 200);
      addTimer(() => setPhase(11), 1200);
    }
  }, [phase === 9, result.done]);

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

  const handleChoiceClick = useCallback((choiceId) => {
    if (selectedChoice) return; // Already selected
    setSelectedChoice(choiceId);
    if (firstView) {
      // Same cadence as normal: highlight → dice → result typewriter → controls
      // Manual timers because firstView guards skip the phase useEffects
      setPhase(6);
      addTimer(() => setPhase(7), 600);
      addTimer(() => setPhase(9), 1000);
      // Phase 11 handled by useEffect when result.done
    } else {
      setPhase(6);
    }
  }, [selectedChoice, firstView, addTimer]);

  const handleChoiceKeyDown = useCallback((e, choiceId) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleChoiceClick(choiceId);
    }
  }, [handleChoiceClick]);

  // Shared transition logic: fade out → swap scenario → fade in + animate
  const transitionTo = useCallback((nextIndex) => {
    // Lock height and fade out
    if (innerRef.current) {
      setLockedHeight(innerRef.current.offsetHeight);
    }
    setFadingOut(false);
    setTransitioning(true);
    clearTimers();

    // After fade-out completes, swap content and start new sequence
    addTimer(() => {
      setFirstView(false);
      setScenarioIndex(nextIndex);
      setSelectedChoice(null);
      setPhase(0);
      setTransitioning(false);
      // Small delay for state to propagate, then kick off animation
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

    // Scroll to showcase top + fade out dice/result/TRY ANOTHER simultaneously
    containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setFadingOut(true);
    clearTimers();

    // After fade completes, reset to choice selection
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

        {/* Dice Result */}
        {showDice && (
          <div className={`${styles.diceBar} ${fadingOut ? styles.fadingOut : ''}`}>
            {selectedResult.dice.segments.map((seg, i) => (
              <span key={i} className={styles.diceSegment}>
                {i > 0 && <span className={styles.diceDot}>&middot;</span>}
                <span
                  className={`${seg.bold ? styles.diceBold : ''} ${
                    seg.color === 'success' ? styles.diceSuccess :
                    seg.color === 'costly' ? styles.diceCostly :
                    seg.color === 'mercy' ? styles.diceMercy :
                    seg.color === 'failure' ? styles.diceFailure : ''
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
          <div className={`${styles.resultBlock} ${fadingOut ? styles.fadingOut : ''}`}>
            <span className={styles.resultText}>
              {result.visible}
              {!result.done && <span className={styles.cursor}>|</span>}
              {result.done && <span className={`${styles.cursor} ${styles.cursorFade}`}>|</span>}
            </span>
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
