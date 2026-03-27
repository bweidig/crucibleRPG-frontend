import { useState, useEffect, useRef } from "react";

const fonts = `@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Alegreya+Sans:wght@300;400;500;700&family=JetBrains+Mono:wght@400;500;600&display=swap');`;

// --- D20 SVG COMPONENT ---
function D20Die({ value, size = 80, opacity = 1, glow = "none", desaturated = false, spinning = false, ghostFaces = false, onClick }) {
  const gray = desaturated ? "saturate(0) brightness(0.6)" : "none";
  const glowColors = {
    none: "transparent",
    gold: "#c9a84c",
    tarnished: "#8a6a3a",
    red: "#e85a5a",
    green: "#8aba7a",
    crimson: "#c84a4a",
  };
  const glowColor = glowColors[glow] || "transparent";

  return (
    <div
      onClick={onClick}
      style={{
        width: size, height: size, position: "relative",
        opacity, transition: "opacity 0.4s, transform 0.3s",
        filter: gray !== "none" ? gray : undefined,
        cursor: onClick ? "pointer" : "default",
        animation: spinning ? "diceSpin 0.6s linear infinite" : undefined,
      }}
    >
      {/* Glow ring */}
      {glow !== "none" && (
        <div style={{
          position: "absolute", inset: -4, borderRadius: "50%",
          boxShadow: `0 0 16px 4px ${glowColor}55, 0 0 6px 2px ${glowColor}33`,
          border: `2px solid ${glowColor}`,
          transition: "all 0.4s",
        }} />
      )}
      {/* D20 body */}
      <svg viewBox="0 0 100 100" width={size} height={size}>
        {/* Main d20 shape */}
        <polygon
          points="50,5 95,35 82,90 18,90 5,35"
          fill={desaturated ? "#2a2520" : "#1a1714"}
          stroke={glow !== "none" ? glowColor : "#3a3328"}
          strokeWidth="2"
        />
        {/* Inner facets */}
        <line x1="50" y1="5" x2="18" y2="90" stroke="#2a252044" strokeWidth="1" />
        <line x1="50" y1="5" x2="82" y2="90" stroke="#2a252044" strokeWidth="1" />
        <line x1="5" y1="35" x2="82" y2="90" stroke="#2a252044" strokeWidth="1" />
        <line x1="95" y1="35" x2="18" y2="90" stroke="#2a252044" strokeWidth="1" />
        <line x1="5" y1="35" x2="95" y2="35" stroke="#2a252044" strokeWidth="1" />
        {/* Value */}
        <text
          x="50" y="58" textAnchor="middle" dominantBaseline="middle"
          fontFamily="'JetBrains Mono', monospace" fontSize={size > 60 ? "28" : "22"} fontWeight="600"
          fill={
            value === 20 ? "#c9a84c" :
            value === 1 ? "#e85a5a" :
            desaturated ? "#5a5040" :
            "#d0c098"
          }
        >
          {spinning ? "?" : value}
        </text>
        {/* Ghost 1 and 20 faces for Mortal Dice */}
        {ghostFaces && !spinning && (
          <>
            <text x="22" y="32" textAnchor="middle" fontFamily="'JetBrains Mono'" fontSize="9" fill="#3a3328" style={{ textDecoration: "line-through" }}>1</text>
            <text x="78" y="32" textAnchor="middle" fontFamily="'JetBrains Mono'" fontSize="9" fill="#3a3328" style={{ textDecoration: "line-through" }}>20</text>
          </>
        )}
      </svg>
    </div>
  );
}

// --- MATH CARD ---
function MathCard({ data }) {
  if (!data) return null;
  return (
    <div style={{
      background: "#0e1420", border: "1px solid #1a2a3a", borderRadius: 8,
      padding: "12px 16px", fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
      color: "#8aba7a", lineHeight: 1.8, marginTop: 16, maxWidth: 480,
    }}>
      <div style={{ color: "#738660", fontSize: 11, letterSpacing: "0.1em", marginBottom: 6 }}>
        FORTUNE'S BALANCE: {data.category}
      </div>
      {data.dualStat && (
        <div style={{ color: "#7082a4" }}>{data.dualStat}</div>
      )}
      <div style={{ color: "#9aaa8a" }}>{data.formula}</div>
      <div style={{ color: "#7082a4" }}>vs DC {data.dc}</div>
      <div style={{
        color: data.margin >= 0 ? "#8aba7a" : "#e8845a",
        fontWeight: 600, marginTop: 4,
      }}>
        Result: {data.margin >= 0 ? "+" : ""}{data.margin.toFixed(1)} ({data.tierLabel})
      </div>
      {data.debt && (
        <div style={{ color: "#e85a5a", marginTop: 4 }}>
          Debt of Effort: -{data.debt.toFixed(1)} ({data.debtSource})
        </div>
      )}
    </div>
  );
}

// --- CATEGORY BANNER ---
function CategoryBanner({ category }) {
  const styles = {
    MATCHED: { bg: "linear-gradient(90deg, #2a2a30, #1e1e24)", border: "#4a4a55", color: "#8a94a8", icon: "—" },
    OUTMATCHED: { bg: "linear-gradient(90deg, #2a2010, #1e1a0e)", border: "#564b2e", color: "#c9a84c", icon: "↑" },
    DOMINANT: { bg: "linear-gradient(90deg, #2a1a14, #1e1510)", border: "#5a3828", color: "#c9854c", icon: "↓" },
  };
  const s = styles[category] || styles.MATCHED;
  return (
    <div style={{
      background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6,
      padding: "6px 16px", display: "flex", alignItems: "center", justifyContent: "space-between",
      marginBottom: 16,
    }}>
      <span style={{ fontFamily: "'Cinzel', serif", fontSize: 13, fontWeight: 700, color: s.color, letterSpacing: "0.12em" }}>
        {category} {s.icon}
      </span>
      <span style={{ fontFamily: "'Alegreya Sans', sans-serif", fontSize: 12, color: "#7082a4" }}>
        {category === "MATCHED" ? "1d20 (full range)" :
         category === "OUTMATCHED" ? "2d20 take highest (underdogs get lucky)" :
         "2d20 take lowest (experts face humbling)"}
      </span>
    </div>
  );
}

// --- DEBT TAG ---
function DebtTag({ amount, source }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: "#1e1214", border: "1px solid #3a1820", borderRadius: 4,
      padding: "3px 8px", fontFamily: "'JetBrains Mono', monospace",
      fontSize: 12, color: "#e85a5a", fontWeight: 600, marginTop: 6,
    }}>
      -{amount.toFixed(1)} DEBT <span style={{ color: "#7082a4", fontWeight: 400 }}>({source})</span>
    </div>
  );
}

// --- SCENARIO PRESETS ---
const SCENARIOS = [
  {
    id: "matched_normal",
    label: "Matched — Normal",
    desc: "Single d20, rolled a 14. Clean success.",
    category: "MATCHED",
    crucible: null,
    die1: 14,
    die2: null,
    kept: "die1",
    extreme: null,
    debt: null,
    math: { category: "MATCHED", formula: "11.3 INT + 1.0 skill + 14 die = 26.3", dc: 18.0, margin: 8.3, tierLabel: "Tier 2 — Clean Success" },
  },
  {
    id: "matched_nat20",
    label: "Matched — Natural 20!",
    desc: "Single d20, landed on 20. Automatic Tier 1.",
    category: "MATCHED",
    crucible: null,
    die1: 20,
    die2: null,
    kept: "die1",
    extreme: "nat20",
    debt: null,
    math: { category: "MATCHED", formula: "Natural 20 → Tier 1 (no margin calculated)", dc: 18.0, margin: 13.0, tierLabel: "Tier 1 — Critical Success" },
  },
  {
    id: "matched_nat1",
    label: "Matched — Natural 1",
    desc: "Single d20, landed on 1. Automatic Tier 6.",
    category: "MATCHED",
    crucible: null,
    die1: 1,
    die2: null,
    kept: "die1",
    extreme: "nat1",
    debt: null,
    math: { category: "MATCHED", formula: "Natural 1 → Tier 6 (no margin calculated)", dc: 18.0, margin: -13.0, tierLabel: "Tier 6 — Critical Failure" },
  },
  {
    id: "outmatched_normal",
    label: "Outmatched — Normal",
    desc: "Crucible Roll 7 (no extreme). Mortal Dice [8, 14] → keep 14.",
    category: "OUTMATCHED",
    crucible: 7,
    die1: 14,
    die2: 8,
    kept: "die1",
    extreme: null,
    debt: null,
    math: { category: "OUTMATCHED", formula: "5.5 modifier + 14 die = 19.5", dc: 18.0, margin: 1.5, tierLabel: "Tier 3 — Success with Detriment" },
  },
  {
    id: "outmatched_extreme",
    label: "Outmatched — Nat 20 on Crucible!",
    desc: "Crucible Roll landed 20. Fate intervenes — automatic Tier 1. No Mortal Dice needed.",
    category: "OUTMATCHED",
    crucible: 20,
    die1: null,
    die2: null,
    kept: null,
    extreme: "nat20",
    debt: null,
    math: { category: "OUTMATCHED", formula: "Crucible Roll: Natural 20 → Tier 1", dc: 22.0, margin: 13.0, tierLabel: "Tier 1 — Critical Success" },
  },
  {
    id: "dominant_normal",
    label: "Dominant — Normal (Humbled)",
    desc: "Crucible Roll 11. Mortal Dice [6, 17] → forced to keep 6. The 17 glows gold... then fades.",
    category: "DOMINANT",
    crucible: 11,
    die1: 6,
    die2: 17,
    kept: "die1",
    extreme: null,
    debt: null,
    math: { category: "DOMINANT", formula: "14.0 modifier + 6 die = 20.0", dc: 18.0, margin: 2.0, tierLabel: "Tier 3 — Success with Detriment" },
  },
  {
    id: "debt_scenario",
    label: "Outmatched + Debt of Effort",
    desc: "Mortal Dice kept 12, but CON at -2.0 applies Debt. Roll ticks down: 12 → 10.",
    category: "OUTMATCHED",
    crucible: 3,
    die1: 12,
    die2: 5,
    kept: "die1",
    extreme: null,
    debt: { amount: 2.0, source: "CON" },
    math: { category: "OUTMATCHED", formula: "5.5 modifier + 12 die - 2.0 Debt = 15.5", dc: 18.0, margin: -2.5, tierLabel: "Tier 4 — Failure with Silver Lining", debt: 2.0, debtSource: "CON" },
  },
  {
    id: "voluntary_failure",
    label: "Voluntary Failure",
    desc: "Player declared failure before rolling. No dice. Tier 5.",
    category: "VOLUNTARY",
    crucible: null,
    die1: null,
    die2: null,
    kept: null,
    extreme: null,
    debt: null,
    math: { category: "VOLUNTARY FAILURE", formula: "No check rolled.", dc: 0, margin: -5.0, tierLabel: "Tier 5 — Clean Failure" },
  },
];

// --- ANIMATED DICE PANEL ---
function DicePanel({ scenario }) {
  const [phase, setPhase] = useState(0);
  const [showMath, setShowMath] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    setPhase(0);
    setShowMath(false);
    if (timerRef.current) clearTimeout(timerRef.current);

    if (scenario.id === "voluntary_failure") {
      timerRef.current = setTimeout(() => setShowMath(true), 500);
      return;
    }

    // Phase 0: spinning
    // Phase 1: crucible lands (if applicable)
    // Phase 2: mortal dice appear spinning
    // Phase 3: mortal dice land
    // Phase 4: kept/discarded resolved
    // Phase 5: debt applied
    // Phase 6: math card

    const hasCC = scenario.crucible !== null;
    const hasMortal = scenario.die1 !== null && scenario.die2 !== null && !scenario.extreme;
    const isExtreme = scenario.extreme !== null;

    let timeline = [];

    if (scenario.category === "MATCHED") {
      timeline = [
        { phase: 0, delay: 0 },      // spinning
        { phase: 1, delay: 600 },     // lands
        { phase: 6, delay: 1400 },    // math card
      ];
    } else if (hasCC && isExtreme) {
      timeline = [
        { phase: 0, delay: 0 },      // crucible spinning
        { phase: 1, delay: 600 },     // crucible lands — EXTREME!
        { phase: 6, delay: 1800 },    // math card
      ];
    } else if (hasCC && hasMortal) {
      timeline = [
        { phase: 0, delay: 0 },      // crucible spinning
        { phase: 1, delay: 500 },     // crucible lands (no extreme)
        { phase: 2, delay: 700 },     // mortal dice appear spinning
        { phase: 3, delay: 1300 },    // mortal dice land
        { phase: 4, delay: 1600 },    // kept/discarded resolved
      ];
      if (scenario.debt) {
        timeline.push({ phase: 5, delay: 2000 }); // debt tick
        timeline.push({ phase: 6, delay: 2600 }); // math card
      } else {
        timeline.push({ phase: 6, delay: 2200 }); // math card
      }
    }

    timeline.forEach(({ phase: p, delay }) => {
      const t = setTimeout(() => {
        setPhase(p);
        if (p === 6) setShowMath(true);
      }, delay);
    });

    return () => timeline.forEach((_, i) => clearTimeout(timerRef.current));
  }, [scenario.id]);

  const sc = scenario;

  // Voluntary failure
  if (sc.id === "voluntary_failure") {
    return (
      <div style={{ textAlign: "center", padding: "32px 0" }}>
        <div style={{
          background: "#141210", border: "1px solid #2a2520", borderRadius: 8,
          padding: "24px 32px", display: "inline-block",
          opacity: showMath ? 1 : 0, transition: "opacity 0.5s",
        }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 16, fontWeight: 700, color: "#8a94a8", letterSpacing: "0.1em", marginBottom: 12 }}>
            VOLUNTARY FAILURE DECLARED
          </div>
          <div style={{ fontFamily: "'Alegreya Sans', sans-serif", fontSize: 14, color: "#7082a4" }}>No check rolled.</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: "#e8845a", marginTop: 8, fontWeight: 600 }}>
            Result: Tier 5 (Clean Failure)
          </div>
        </div>
      </div>
    );
  }

  // Matched check
  if (sc.category === "MATCHED") {
    const isNat20 = sc.extreme === "nat20";
    const isNat1 = sc.extreme === "nat1";
    return (
      <div>
        <CategoryBanner category="MATCHED" />
        <div style={{ display: "flex", justifyContent: "center", padding: "24px 0", minHeight: 120 }}>
          <D20Die
            value={sc.die1}
            size={100}
            spinning={phase < 1}
            glow={phase >= 1 ? (isNat20 ? "gold" : isNat1 ? "crimson" : "none") : "none"}
            opacity={1}
          />
        </div>
        {phase >= 1 && (isNat20 || isNat1) && (
          <div style={{
            textAlign: "center", fontFamily: "'Cinzel', serif", fontSize: 20, fontWeight: 900,
            color: isNat20 ? "#c9a84c" : "#e85a5a",
            letterSpacing: "0.15em", marginBottom: 8,
            textShadow: isNat20 ? "0 0 20px #c9a84c55" : "0 0 20px #e85a5a55",
            animation: "fadeInUp 0.4s ease-out",
          }}>
            {isNat20 ? "⚡ NATURAL 20 ⚡" : "💀 NATURAL 1 💀"}
          </div>
        )}
        {showMath && <MathCard data={sc.math} />}
      </div>
    );
  }

  // Outmatched / Dominant
  const isOutmatched = sc.category === "OUTMATCHED";
  const isDominant = sc.category === "DOMINANT";
  const isExtremeCC = sc.extreme !== null;
  const isNat20CC = sc.extreme === "nat20";

  // Determine which mortal die is "kept" and glow logic
  let keptVal, discVal, keptGlow, discGlow;
  if (sc.die1 !== null && sc.die2 !== null) {
    if (isOutmatched) {
      // Keep higher
      keptVal = Math.max(sc.die1, sc.die2);
      discVal = Math.min(sc.die1, sc.die2);
      keptGlow = "gold";
      discGlow = "none";
    } else {
      // Dominant: keep lower
      keptVal = Math.min(sc.die1, sc.die2);
      discVal = Math.max(sc.die1, sc.die2);
      // Inverted glow: gold on DISCARDED (the better roll being thrown away)
      keptGlow = "tarnished";
      discGlow = "gold";
    }
  }

  return (
    <div>
      <CategoryBanner category={sc.category} />

      {/* Dice area */}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 24, padding: "20px 0", minHeight: 140, position: "relative" }}>

        {/* Left Mortal Die (ghosted pre-roll, visible post-phase 2) */}
        {!isExtremeCC && sc.die2 !== null && (
          <div style={{
            opacity: phase < 2 ? 0.12 : phase >= 4 ? (sc.die2 === discVal ? 0.2 : 1) : 1,
            transition: "opacity 0.4s, transform 0.3s",
            transform: phase >= 4 && sc.die2 === keptVal ? "translateX(10px) scale(1.1)" : "translateX(0) scale(1)",
          }}>
            <D20Die
              value={sc.die2}
              size={72}
              spinning={phase >= 2 && phase < 3}
              ghostFaces={phase >= 3}
              glow={phase >= 4 ? (sc.die2 === keptVal ? keptGlow : discGlow) : "none"}
              desaturated={phase >= 4 && sc.die2 === discVal && isOutmatched}
            />
          </div>
        )}

        {/* Center: Crucible Die */}
        <div style={{
          opacity: isExtremeCC ? 1 : (phase >= 1 ? (phase >= 2 ? 0.12 : 0.4) : 1),
          transition: "opacity 0.5s",
          zIndex: 2,
        }}>
          <D20Die
            value={sc.crucible}
            size={isExtremeCC ? 100 : (phase >= 2 ? 60 : 80)}
            spinning={phase < 1}
            glow={
              isExtremeCC && phase >= 1 ? (isNat20CC ? "gold" : "crimson") :
              "none"
            }
          />
          {phase >= 1 && !isExtremeCC && (
            <div style={{
              textAlign: "center", fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10, color: "#5a5040", marginTop: 4,
            }}>
              Crucible: {sc.crucible}
            </div>
          )}
        </div>

        {/* Right Mortal Die */}
        {!isExtremeCC && sc.die1 !== null && (
          <div style={{
            opacity: phase < 2 ? 0.12 : phase >= 4 ? (sc.die1 === discVal ? 0.2 : 1) : 1,
            transition: "opacity 0.4s, transform 0.3s",
            transform: phase >= 4 && sc.die1 === keptVal ? "translateX(-10px) scale(1.1)" : "translateX(0) scale(1)",
          }}>
            <D20Die
              value={sc.die1}
              size={72}
              spinning={phase >= 2 && phase < 3}
              ghostFaces={phase >= 3}
              glow={phase >= 4 ? (sc.die1 === keptVal ? keptGlow : discGlow) : "none"}
              desaturated={phase >= 4 && sc.die1 === discVal && isOutmatched}
            />
          </div>
        )}
      </div>

      {/* Extreme callout */}
      {isExtremeCC && phase >= 1 && (
        <div style={{
          textAlign: "center", fontFamily: "'Cinzel', serif", fontSize: 20, fontWeight: 900,
          color: isNat20CC ? "#c9a84c" : "#e85a5a",
          letterSpacing: "0.15em", marginBottom: 8,
          textShadow: isNat20CC ? "0 0 20px #c9a84c55" : "0 0 20px #e85a5a55",
        }}>
          {isNat20CC ? "⚡ FATE INTERVENES ⚡" : "💀 FATE STRIKES 💀"}
        </div>
      )}

      {/* Mortal Dice labels */}
      {!isExtremeCC && phase >= 4 && sc.die1 !== null && sc.die2 !== null && (
        <div style={{
          textAlign: "center", fontFamily: "'Alegreya Sans', sans-serif",
          fontSize: 13, color: "#7082a4", marginTop: -4, marginBottom: 8,
        }}>
          Mortal Dice: [{keptVal}] <span style={{ opacity: 0.4 }}>{discVal}</span>
          {isDominant && <span style={{ color: "#c9854c", marginLeft: 8 }}>— fortune humbles the expert</span>}
        </div>
      )}

      {/* Debt indicator */}
      {sc.debt && phase >= 5 && (
        <div style={{ textAlign: "center" }}>
          <DebtTag amount={sc.debt.amount} source={sc.debt.source} />
        </div>
      )}

      {showMath && <MathCard data={sc.math} />}
    </div>
  );
}

// --- MODE SELECTOR ---
function ModeSelector({ mode, setMode }) {
  const modes = [
    { id: "cinematic", label: "Cinematic", desc: "Full animation" },
    { id: "efficient", label: "Efficient", desc: "Quick rolls" },
    { id: "instant", label: "Instant", desc: "Math only" },
  ];
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
      {modes.map(m => (
        <button key={m.id} onClick={() => setMode(m.id)} style={{
          flex: 1, padding: "8px 0", cursor: "pointer", borderRadius: 5,
          fontFamily: "'Alegreya Sans', sans-serif", fontSize: 13,
          border: `1px solid ${mode === m.id ? "#c9a84c" : "#2a2520"}`,
          background: mode === m.id ? "#1a1810" : "transparent",
          color: mode === m.id ? "#c9a84c" : "#7082a4",
          transition: "all 0.2s",
        }}>
          {m.label}
        </button>
      ))}
    </div>
  );
}

// --- MAIN COMPONENT ---
export default function DiceRollerMockup() {
  const [activeScenario, setActiveScenario] = useState(SCENARIOS[0]);
  const [mode, setMode] = useState("efficient");
  const [replayKey, setReplayKey] = useState(0);

  const replay = (sc) => {
    setActiveScenario(sc);
    setReplayKey(k => k + 1);
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#0a0e1a", color: "#c8c0b0",
      fontFamily: "'Alegreya Sans', sans-serif",
    }}>
      <style>{fonts}{`
        @keyframes diceSpin {
          0% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(90deg) scale(1.05); }
          50% { transform: rotate(180deg) scale(1); }
          75% { transform: rotate(270deg) scale(1.05); }
          100% { transform: rotate(360deg) scale(1); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header */}
      <div style={{
        padding: "16px 24px", borderBottom: "1px solid #1e2540",
        display: "flex", alignItems: "baseline", gap: 8,
      }}>
        <span style={{ fontFamily: "'Cinzel', serif", fontSize: 20, fontWeight: 900, color: "#c9a84c", letterSpacing: "0.06em" }}>CRUCIBLE</span>
        <span style={{ fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 600, color: "#9a8545", letterSpacing: "0.06em" }}>RPG</span>
        <span style={{ color: "#1e2540", margin: "0 8px" }}>|</span>
        <span style={{ fontSize: 14, color: "#7082a4" }}>Dice Roller — Design Mockup</span>
      </div>

      <div style={{ display: "flex", maxWidth: 1100, margin: "0 auto", padding: "24px 24px" }}>
        {/* Left: Scenario selector */}
        <div style={{ width: 280, flexShrink: 0, paddingRight: 24, borderRight: "1px solid #1e2540" }}>
          <div style={{
            fontFamily: "'Cinzel', serif", fontSize: 14, fontWeight: 700, color: "#907f5e",
            letterSpacing: "0.12em", marginBottom: 12,
          }}>SCENARIOS</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {SCENARIOS.map(sc => (
              <button key={sc.id} onClick={() => replay(sc)} style={{
                textAlign: "left", padding: "10px 12px", cursor: "pointer",
                borderRadius: 6,
                border: `1px solid ${activeScenario.id === sc.id ? "#564b2e" : "#1e2540"}`,
                background: activeScenario.id === sc.id ? "#1a1810" : "transparent",
                transition: "all 0.2s",
              }}>
                <div style={{
                  fontFamily: "'Cinzel', serif", fontSize: 12, fontWeight: 600,
                  color: activeScenario.id === sc.id ? "#c9a84c" : "#8a94a8",
                  marginBottom: 3,
                }}>{sc.label}</div>
                <div style={{ fontSize: 12, color: "#5a6a88", lineHeight: 1.4 }}>{sc.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Dice panel */}
        <div style={{ flex: 1, paddingLeft: 32 }}>
          <ModeSelector mode={mode} setMode={setMode} />

          {/* The dice panel */}
          <div style={{
            background: "#0d1120", border: "1px solid #1e2540", borderRadius: 10,
            padding: "20px 24px", minHeight: 320,
          }}>
            {/* Gear icon placeholder */}
            <div style={{
              display: "flex", justifyContent: "flex-end", marginBottom: 8,
            }}>
              <span style={{ fontSize: 12, color: "#5a5040", fontStyle: "italic" }}>
                {mode === "cinematic" ? "Cinematic" : mode === "efficient" ? "Efficient" : "Instant"} mode
              </span>
            </div>

            <DicePanel key={`${activeScenario.id}-${replayKey}`} scenario={activeScenario} />
          </div>

          {/* Legend */}
          <div style={{
            marginTop: 20, padding: "16px 20px",
            background: "#0d1120", border: "1px solid #1e2540", borderRadius: 8,
          }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, fontWeight: 600, color: "#907f5e", letterSpacing: "0.1em", marginBottom: 10 }}>
              VISUAL KEY
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13, color: "#7082a4" }}>
              <div>🟡 <span style={{ color: "#c9a84c" }}>Gold glow</span> — kept die (Outmatched)</div>
              <div>🟤 <span style={{ color: "#8a6a3a" }}>Tarnished glow</span> — kept die (Dominant)</div>
              <div>🟡→👻 <span style={{ color: "#c9a84c" }}>Gold on fading die</span> — discarded (Dominant)</div>
              <div>👻 <span style={{ color: "#5a5040" }}>Ghost die</span> — discarded result (visible at 20%)</div>
              <div>🔴 <span style={{ color: "#e85a5a" }}>Red pulse</span> — Debt of Effort applied</div>
              <div>⬛ <span style={{ color: "#5a5040" }}>Grayed 1/20</span> — Mortal Dice (extremes excluded)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
