import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './InlineDicePanel.module.css';

// ─── MiniD20 SVG (from mockup pattern, compact inline size) ───

function MiniD20({ value, size = 42, glow = 'none', spinning = false, ghostFaces = false, desaturated = false }) {
  const glowColors = { none: 'transparent', gold: '#c9a84c', tarnished: '#8a6a3a', crimson: '#c84a4a' };
  const gc = glowColors[glow] || 'transparent';

  return (
    <div style={{
      width: size, height: size, position: 'relative', display: 'inline-flex',
      filter: desaturated ? 'saturate(0) brightness(0.6)' : undefined,
      animation: spinning ? 'diceSpin 0.6s linear infinite' : undefined,
      transition: 'opacity 0.4s, transform 0.3s',
    }}>
      {glow !== 'none' && (
        <div style={{
          position: 'absolute', inset: -3, borderRadius: '50%',
          boxShadow: `0 0 12px 3px ${gc}44, 0 0 5px 2px ${gc}33`,
          border: `1.5px solid ${gc}`,
        }} />
      )}
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <polygon
          points="50,5 95,35 82,90 18,90 5,35"
          fill={desaturated ? '#2a2520' : '#1a1714'}
          stroke={glow !== 'none' ? gc : '#3a3328'}
          strokeWidth="2.5"
        />
        <line x1="50" y1="5" x2="18" y2="90" stroke="#2a252033" strokeWidth="1" />
        <line x1="50" y1="5" x2="82" y2="90" stroke="#2a252033" strokeWidth="1" />
        <line x1="5" y1="35" x2="82" y2="90" stroke="#2a252033" strokeWidth="1" />
        <line x1="95" y1="35" x2="18" y2="90" stroke="#2a252033" strokeWidth="1" />
        <text
          x="50" y="58" textAnchor="middle" dominantBaseline="middle"
          fontFamily="'JetBrains Mono', monospace"
          fontSize={size > 50 ? '28' : size > 35 ? '24' : '18'}
          fontWeight="600"
          fill={
            spinning ? '#5a5040' :
            value === 20 ? '#c9a84c' :
            value === 1 ? '#e85a5a' :
            desaturated ? '#5a5040' :
            '#d0c098'
          }
        >
          {spinning ? '?' : value}
        </text>
        {ghostFaces && !spinning && (
          <>
            <text x="22" y="32" textAnchor="middle" fontFamily="'JetBrains Mono'" fontSize="9" fill="#3a3328" style={{ textDecoration: 'line-through' }}>1</text>
            <text x="78" y="32" textAnchor="middle" fontFamily="'JetBrains Mono'" fontSize="9" fill="#3a3328" style={{ textDecoration: 'line-through' }}>20</text>
          </>
        )}
      </svg>
    </div>
  );
}

// ─── Category Tag ───

function CategoryTag({ category }) {
  const upper = (category || 'matched').toUpperCase();
  const tagClass = upper === 'OUTMATCHED' ? styles.categoryTagOutmatched
    : upper === 'DOMINANT' ? styles.categoryTagDominant
    : styles.categoryTagMatched;
  const labelClass = upper === 'OUTMATCHED' ? styles.categoryLabelOutmatched
    : upper === 'DOMINANT' ? styles.categoryLabelDominant
    : styles.categoryLabelMatched;
  const icon = upper === 'OUTMATCHED' ? '\u2191' : upper === 'DOMINANT' ? '\u2193' : '\u2014';
  const desc = upper === 'MATCHED' ? '1d20 (full range)'
    : upper === 'OUTMATCHED' ? '2d20 take highest'
    : '2d20 take lowest';

  return (
    <div className={`${styles.categoryTag} ${tagClass}`}>
      <span className={`${styles.categoryLabel} ${labelClass}`}>{upper} {icon}</span>
      <span className={styles.categoryDesc}>{desc}</span>
    </div>
  );
}

// ─── Main Component ───
// resolution fields from API_CONTRACT.md:
//   fortunesBalance: "matched" | "outmatched" | "dominant"
//   crucibleRoll: number | null
//   crucibleExtreme: "nat20" | "nat1" | null
//   diceRolled: number[] (1 elem for matched, 2 for outmatched/dominant)
//   dieSelected: number (the kept value)
//   debtPenalty: number

export default function InlineDicePanel({ resolution, animate = false, onComplete }) {
  if (!resolution) { onComplete?.(); return null; }

  const [phase, setPhase] = useState(animate ? -1 : 99);
  const [extremeFlash, setExtremeFlash] = useState(false);
  const panelRef = useRef(null);
  const completedRef = useRef(false);

  const category = (resolution.fortunesBalance || 'matched').toLowerCase();
  const isMatched = category === 'matched';
  const isOutmatched = category === 'outmatched';
  const isDominant = category === 'dominant';
  const hasCC = resolution.crucibleRoll != null;
  const isExtreme = resolution.crucibleExtreme != null;
  const isNat20 = resolution.crucibleExtreme === 'nat20';
  const isNat1 = resolution.crucibleExtreme === 'nat1';
  const diceRolled = Array.isArray(resolution.diceRolled) ? resolution.diceRolled : [];
  const hasMortal = diceRolled.length >= 2 && !isExtreme;

  // Determine kept/discarded for Outmatched/Dominant
  let keptVal = null;
  let discVal = null;
  if (hasMortal && diceRolled.length >= 2) {
    if (isOutmatched) {
      keptVal = Math.max(diceRolled[0], diceRolled[1]);
      discVal = Math.min(diceRolled[0], diceRolled[1]);
    } else if (isDominant) {
      keptVal = Math.min(diceRolled[0], diceRolled[1]);
      discVal = Math.max(diceRolled[0], diceRolled[1]);
    }
  }

  const fireComplete = useCallback(() => {
    if (!completedRef.current) {
      completedRef.current = true;
      onComplete?.();
    }
  }, [onComplete]);

  // Animation phases with timeouts
  // phase -1 = waiting for scroll, 0 = spinning, 1+ = landing phases, 99 = done (no animation)
  useEffect(() => {
    if (!animate) {
      setPhase(99);
      fireComplete();
      return;
    }

    completedRef.current = false;
    setPhase(-1);
    const timers = [];
    const t = (fn, d) => timers.push(setTimeout(fn, d));

    // Scroll into view, then start animation after a pause
    if (panelRef.current) {
      panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    const scrollDelay = 400;

    if (isMatched) {
      // Scroll → spin → land → hold → complete
      t(() => setPhase(0), scrollDelay);
      t(() => setPhase(1), scrollDelay + 800);
      // Natural extreme flash
      if (isExtreme) {
        t(() => setExtremeFlash(true), scrollDelay + 800);
        t(() => setExtremeFlash(false), scrollDelay + 1400);
      }
      t(() => fireComplete(), scrollDelay + 800 + 1000);  // 1s hold
    } else if (hasCC && isExtreme) {
      // Crucible lands with extreme
      t(() => setPhase(0), scrollDelay);
      t(() => setPhase(1), scrollDelay + 800);
      t(() => setExtremeFlash(true), scrollDelay + 800);
      t(() => setExtremeFlash(false), scrollDelay + 1500);
      t(() => fireComplete(), scrollDelay + 800 + 1200);
    } else if (hasCC && hasMortal) {
      // Scroll → crucible spins → crucible lands → mortal spin → mortal land → resolve → hold
      t(() => setPhase(0), scrollDelay);
      t(() => setPhase(1), scrollDelay + 600);   // crucible lands
      t(() => setPhase(2), scrollDelay + 1000);  // mortal dice appear spinning
      t(() => setPhase(3), scrollDelay + 1600);  // mortal dice land
      t(() => setPhase(4), scrollDelay + 2100);  // kept/discarded resolved
      t(() => fireComplete(), scrollDelay + 2100 + 1000);  // 1s hold
    } else {
      t(() => setPhase(0), scrollDelay);
      t(() => setPhase(1), scrollDelay + 600);
      t(() => fireComplete(), scrollDelay + 600 + 1000);
    }

    return () => timers.forEach(clearTimeout);
  }, [resolution.dieSelected, resolution.crucibleRoll, animate, fireComplete]);

  // For non-animated (historical) turns, treat any phase >= 1 as "show final state"
  const p = phase === 99 ? 99 : phase;
  const showFinal = p >= 1;
  const showMortalSpin = p >= 2;
  const showMortalLand = p >= 3;
  const showResolved = p >= 4;
  const isSpinning = p === 0 || p === -1;

  // Extreme flash class
  const flashClass = extremeFlash ? (isNat20 ? styles.extremeFlashGold : styles.extremeFlashRed) : '';

  // ─── Matched: single d20 ───
  if (isMatched) {
    const val = resolution.dieSelected;
    const isRollNat20 = val === 20;
    const isRollNat1 = val === 1;

    return (
      <div ref={panelRef} className={`${styles.dicePanel} ${flashClass}`}>
        <CategoryTag category={category} />
        <div className={styles.diceArea}>
          <MiniD20
            value={val}
            size={52}
            spinning={isSpinning}
            glow={showFinal ? (isRollNat20 ? 'gold' : isRollNat1 ? 'crimson' : 'none') : 'none'}
          />
        </div>
        {showFinal && (isRollNat20 || isRollNat1) && (
          <div className={`${styles.extremeCallout} ${isRollNat20 ? styles.extremeNat20 : styles.extremeNat1}`}>
            {isRollNat20 ? 'NATURAL 20' : 'NATURAL 1'}
          </div>
        )}
      </div>
    );
  }

  // ─── Outmatched / Dominant ───

  const keptGlow = isOutmatched ? 'gold' : 'tarnished';
  const discGlow = isDominant ? 'gold' : 'none';

  // Extreme on crucible: no mortal dice, just the crucible
  if (hasCC && isExtreme) {
    return (
      <div ref={panelRef} className={`${styles.dicePanel} ${flashClass}`}>
        <CategoryTag category={category} />
        <div className={styles.diceArea}>
          <MiniD20
            value={resolution.crucibleRoll}
            size={52}
            spinning={isSpinning}
            glow={showFinal ? (isNat20 ? 'gold' : 'crimson') : 'none'}
          />
        </div>
        {showFinal && (
          <div className={`${styles.extremeCallout} ${isNat20 ? styles.extremeNat20 : styles.extremeNat1}`}>
            {isNat20 ? 'FATE INTERVENES' : 'FATE STRIKES'}
          </div>
        )}
      </div>
    );
  }

  // Normal Outmatched/Dominant with mortal dice
  return (
    <div ref={panelRef} className={`${styles.dicePanel} ${flashClass}`}>
      <CategoryTag category={category} />
      <div className={styles.diceArea}>
        {/* Left mortal die */}
        {hasMortal && (
          <div style={{
            opacity: !showMortalSpin ? 0.1 : showResolved ? (diceRolled[0] === discVal ? 0.2 : 1) : 1,
            transition: 'opacity 0.4s, transform 0.3s',
            transform: showResolved && diceRolled[0] === keptVal ? 'scale(1.08)' : 'scale(1)',
          }}>
            <MiniD20
              value={diceRolled[0]}
              size={42}
              spinning={showMortalSpin && !showMortalLand}
              ghostFaces={showMortalLand}
              glow={showResolved ? (diceRolled[0] === keptVal ? keptGlow : discGlow) : 'none'}
              desaturated={showResolved && diceRolled[0] === discVal && isOutmatched}
            />
          </div>
        )}

        {/* Center crucible die */}
        <div style={{
          opacity: showMortalSpin ? 0.15 : showFinal ? 0.4 : 1,
          transition: 'opacity 0.4s',
        }}>
          <MiniD20
            value={resolution.crucibleRoll}
            size={showMortalSpin ? 32 : 42}
            spinning={isSpinning}
          />
          {showFinal && !showMortalSpin && (
            <div className={styles.crucibleLabel}>Crucible: {resolution.crucibleRoll}</div>
          )}
        </div>

        {/* Right mortal die */}
        {hasMortal && (
          <div style={{
            opacity: !showMortalSpin ? 0.1 : showResolved ? (diceRolled[1] === discVal ? 0.2 : 1) : 1,
            transition: 'opacity 0.4s, transform 0.3s',
            transform: showResolved && diceRolled[1] === keptVal ? 'scale(1.08)' : 'scale(1)',
          }}>
            <MiniD20
              value={diceRolled[1]}
              size={42}
              spinning={showMortalSpin && !showMortalLand}
              ghostFaces={showMortalLand}
              glow={showResolved ? (diceRolled[1] === keptVal ? keptGlow : discGlow) : 'none'}
              desaturated={showResolved && diceRolled[1] === discVal && isOutmatched}
            />
          </div>
        )}
      </div>

      {/* Mortal dice kept/discarded label */}
      {hasMortal && showResolved && (
        <div className={styles.mortalLabel}>
          Mortal Dice: <span className={styles.mortalKept}>[{keptVal}]</span>{' '}
          <span className={styles.mortalDiscarded}>{discVal}</span>
          {isDominant && <span className={styles.dominantNote}>fortune humbles the expert</span>}
        </div>
      )}

      {/* Debt of Effort indicator */}
      {resolution.debtPenalty > 0 && showResolved && (
        <div style={{ textAlign: 'center', marginTop: 4 }}>
          <span className={styles.debtTag}>
            -{resolution.debtPenalty.toFixed(1)} DEBT
          </span>
        </div>
      )}
    </div>
  );
}
