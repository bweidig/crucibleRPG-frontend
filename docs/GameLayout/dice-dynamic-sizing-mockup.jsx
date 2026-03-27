import { useState, useEffect, useRef } from "react";

const fonts = `@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Alegreya+Sans:wght@300;400;500;700&family=Alegreya:ital,wght@0,400;0,500;1,400&family=JetBrains+Mono:wght@400;500;600&display=swap');`;

const C = {
  bg: "#0a0e1a",
  panelBg: "#0d1120",
  cardBg: "#111528",
  resolutionBg: "#0e1420",
  text: "#c8c0b0",
  heading: "#d0c098",
  narrative: "#d4c4a0",
  secondary: "#8a94a8",
  muted: "#7082a4",
  dim: "#6b83a3",
  accent: "#c9a84c",
  accentBright: "#ddb84e",
  danger: "#e8845a",
  success: "#8aba7a",
  warning: "#e8c45a",
  goldLabel: "#9a8545",
  border: "#1e2540",
  borderLight: "#161c34",
};

// --- D20 DIE (simplified from dice-roller-mockup) ---
function D20Die({ value, size = 80, glow = "none", spinning = false, ghostFaces = false, desaturated = false, hideValue = false }) {
  const glowColors = { none: "transparent", gold: "#c9a84c", tarnished: "#8a6a3a", crimson: "#c84a4a" };
  const glowColor = glowColors[glow] || "transparent";
  const gray = desaturated ? "saturate(0) brightness(0.6)" : "none";

  return (
    <div style={{
      width: size, height: size, position: "relative",
      filter: gray !== "none" ? gray : undefined,
      animation: spinning ? "diceSpin 0.6s linear infinite" : undefined,
    }}>
      {glow !== "none" && (
        <div style={{
          position: "absolute", inset: -4, borderRadius: "50%",
          boxShadow: `0 0 16px 4px ${glowColor}55, 0 0 6px 2px ${glowColor}33`,
          border: `2px solid ${glowColor}`,
        }} />
      )}
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <polygon points="50,5 95,35 82,90 18,90 5,35"
          fill={desaturated ? "#2a2520" : "#1a1714"}
          stroke={glow !== "none" ? glowColor : "#3a3328"} strokeWidth="2" />
        <line x1="50" y1="5" x2="18" y2="90" stroke="#2a252044" strokeWidth="1" />
        <line x1="50" y1="5" x2="82" y2="90" stroke="#2a252044" strokeWidth="1" />
        <line x1="5" y1="35" x2="82" y2="90" stroke="#2a252044" strokeWidth="1" />
        <line x1="95" y1="35" x2="18" y2="90" stroke="#2a252044" strokeWidth="1" />
        <line x1="5" y1="35" x2="95" y2="35" stroke="#2a252044" strokeWidth="1" />
        <text x="50" y="58" textAnchor="middle" dominantBaseline="middle"
          fontFamily="'JetBrains Mono', monospace" fontSize={size > 60 ? "28" : size > 40 ? "22" : "16"} fontWeight="600"
          fill={hideValue ? "transparent" : value === 20 ? "#c9a84c" : value === 1 ? "#e85a5a" : desaturated ? "#5a5040" : "#d0c098"}>
          {hideValue ? "" : spinning ? "?" : value}
        </text>
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

// --- COMPRESSED RESOLUTION BAR (from game-layout) ---
function ResolutionBar({ expanded, onToggle }) {
  return (
    <div style={{
      background: C.resolutionBg, borderRadius: 6, padding: "8px 14px",
      border: `1px solid ${C.borderLight}`, cursor: "pointer",
      transition: "all 0.3s",
    }} onClick={onToggle}>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
        color: C.success, display: "flex", alignItems: "center", gap: 8,
      }}>
        <span>⚔️</span>
        <span style={{ color: C.secondary }}>Listen (Eavesdrop)</span>
        <span style={{ color: C.dim }}>|</span>
        <span style={{ color: C.muted }}>👁️ WIS 8.3 + Streetwise 1.0 + d20(14) = 23.3 vs DC 16.0</span>
        <span style={{ color: C.dim }}>|</span>
        <span style={{ color: C.success, fontWeight: 600 }}>+7.3: Success</span>
        <span style={{ marginLeft: "auto", color: C.dim, fontSize: 11 }}>{expanded ? "▼" : "▶"}</span>
      </div>
      {expanded && (
        <div style={{
          marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.borderLight}`,
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 20px",
          fontFamily: "'Alegreya Sans', sans-serif", fontSize: 13,
        }}>
          <div><span style={{ color: "#738660" }}>Action:</span> <span style={{ color: C.secondary }}>Listen (Eavesdrop)</span></div>
          <div><span style={{ color: "#738660" }}>Stat:</span> <span style={{ color: C.secondary }}>👁️ WIS (8.3)</span></div>
          <div><span style={{ color: "#738660" }}>Skill:</span> <span style={{ color: C.secondary }}>Streetwise (+1.0)</span></div>
          <div><span style={{ color: "#738660" }}>Fortune's Balance:</span> <span style={{ color: C.secondary }}>Outmatched (2d20 keep highest)</span></div>
          <div><span style={{ color: "#738660" }}>Crucible Roll:</span> <span style={{ color: C.secondary }}>d20(7) — No Effect</span></div>
          <div><span style={{ color: "#738660" }}>Mortal Dice:</span> <span style={{ color: C.secondary }}>[14, 8] → kept 14</span></div>
          <div><span style={{ color: "#738660" }}>DC:</span> <span style={{ color: C.secondary }}>16.0 (Professional, Standard +0)</span></div>
          <div><span style={{ color: "#738660" }}>Result:</span> <span style={{ color: C.success, fontWeight: 600 }}>+7.3: Tier 2 — Clean Success</span></div>
        </div>
      )}
    </div>
  );
}

// --- STREAMING NARRATIVE ---
function StreamingNarrative({ visible, progress }) {
  const fullText = [
    `You lean back, letting the chair tilt against the wall, and half-close your eyes. The dockhands' voices sharpen out of the ambient noise.`,
    `\n\n"...third one this month. Cargo manifest says grain and timber, but I watched 'em unload past midnight. Crates marked with that double-crescent seal." The speaker is the youngest of the three — wiry, nervous hands.`,
    `\n\nThe older man beside him grunts. "You shut your mouth about the crescents, Pol. That's Veymar business."`,
    `\n\nThe third says nothing. He's watching the door.`,
    `\n\nYour ale is warm. The fire pops. Outside, a harbor bell rings twice — the tide signal.`,
  ];

  const visibleChars = Math.floor(progress * fullText.join("").length);
  let shown = "";
  let remaining = visibleChars;
  for (const chunk of fullText) {
    if (remaining <= 0) break;
    shown += chunk.slice(0, remaining);
    remaining -= chunk.length;
  }

  if (!visible) return null;

  return (
    <div style={{
      fontFamily: "'Alegreya', serif", fontSize: 17, color: C.narrative,
      lineHeight: 1.8, whiteSpace: "pre-wrap",
      opacity: visible ? 1 : 0, transition: "opacity 0.4s",
    }}>
      {shown}
      {progress < 1 && <span style={{ opacity: 0.4, animation: "blink 1s infinite" }}>▎</span>}
    </div>
  );
}


// --- FULL DICE PANEL (centered, prominent) ---
function FullDicePanel({ phase }) {
  // phase: 0=spinning, 1=crucible lands, 2=mortal spinning, 3=mortal lands, 4=resolved
  const crucibleValue = 7;
  const die1 = 14;
  const die2 = 8;

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "32px 0",
    }}>
      {/* Category banner */}
      <div style={{
        background: "linear-gradient(90deg, #2a2010, #1e1a0e)",
        border: "1px solid #564b2e", borderRadius: 6,
        padding: "8px 24px", marginBottom: 20,
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <span style={{
          fontFamily: "'Cinzel', serif", fontSize: 14, fontWeight: 700,
          color: C.accent, letterSpacing: "0.12em",
        }}>OUTMATCHED ↑</span>
        <span style={{ fontFamily: "'Alegreya Sans', sans-serif", fontSize: 12, color: C.muted }}>
          2d20 take highest (underdogs get lucky)
        </span>
      </div>

      {/* Dice row */}
      <div style={{
        display: "flex", alignItems: "center", gap: 28, marginBottom: 16,
      }}>
        {/* Left mortal die */}
        <div style={{
          opacity: phase < 2 ? 0.1 : phase >= 4 ? 0.2 : 1,
          transition: "all 0.4s",
          transform: phase >= 4 ? "scale(0.85)" : "scale(1)",
        }}>
          <D20Die value={die2} size={72}
            spinning={phase >= 2 && phase < 3}
            ghostFaces={phase >= 3}
            desaturated={phase >= 4}
            hideValue={phase < 2}
          />
        </div>

        {/* Center crucible die */}
        <div style={{
          opacity: phase >= 2 ? 0.15 : phase >= 1 ? 0.4 : 1,
          transition: "all 0.5s",
        }}>
          <D20Die value={crucibleValue}
            size={phase >= 2 ? 56 : 88}
            spinning={phase < 1}
          />
          {phase >= 1 && (
            <div style={{
              textAlign: "center", fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10, color: "#5a5040", marginTop: 4,
            }}>Crucible: {crucibleValue}</div>
          )}
        </div>

        {/* Right mortal die */}
        <div style={{
          opacity: phase < 2 ? 0.1 : 1,
          transition: "all 0.4s",
          transform: phase >= 4 ? "translateX(-10px) scale(1.1)" : "scale(1)",
        }}>
          <D20Die value={die1} size={72}
            spinning={phase >= 2 && phase < 3}
            ghostFaces={phase >= 3}
            glow={phase >= 4 ? "gold" : "none"}
            hideValue={phase < 2}
          />
        </div>
      </div>

      {/* Mortal dice label */}
      {phase >= 4 && (
        <div style={{
          fontFamily: "'Alegreya Sans', sans-serif", fontSize: 14, color: C.muted,
          animation: "fadeInUp 0.3s ease-out",
        }}>
          Mortal Dice: [<span style={{ color: C.accent, fontWeight: 600 }}>14</span>] <span style={{ opacity: 0.4 }}>8</span>
        </div>
      )}

      {/* Brief result flash */}
      {phase >= 4 && (
        <div style={{
          marginTop: 12, fontFamily: "'JetBrains Mono', monospace", fontSize: 15,
          color: C.success, fontWeight: 600,
          animation: "fadeInUp 0.3s ease-out 0.2s both",
        }}>
          +7.3 — Clean Success
        </div>
      )}
    </div>
  );
}


// === MAIN COMPONENT ===
export default function DiceDynamicSizing() {
  const [state, setState] = useState(0);
  // 0 = waiting (no roll yet)
  // 1 = rolling (dice spinning)
  // 2 = crucible landed
  // 3 = mortal spinning
  // 4 = mortal landed
  // 5 = resolved (held for ~1s)
  // 6 = transitioning (panel sliding up into resolution bar)
  // 7 = narrative streaming (resolution bar docked, text flowing)
  // 8 = complete

  const [streamProgress, setStreamProgress] = useState(0);
  const [resExpanded, setResExpanded] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const timerRef = useRef(null);
  const streamRef = useRef(null);

  const reset = () => {
    setState(0);
    setStreamProgress(0);
    setResExpanded(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (streamRef.current) clearInterval(streamRef.current);
  };

  const playSequence = () => {
    reset();
    setState(1);
    const steps = [
      { state: 2, delay: 600 },    // crucible lands
      { state: 3, delay: 900 },    // mortal dice spin
      { state: 4, delay: 1500 },   // mortal dice land
      { state: 5, delay: 1800 },   // resolved (hold)
      { state: 6, delay: 2800 },   // transition begins
      { state: 7, delay: 3200 },   // narrative starts
    ];
    steps.forEach(({ state: s, delay }) => {
      setTimeout(() => setState(s), delay);
    });
    // Start streaming at state 7
    setTimeout(() => {
      streamRef.current = setInterval(() => {
        setStreamProgress(prev => {
          if (prev >= 1) {
            clearInterval(streamRef.current);
            setState(8);
            return 1;
          }
          return prev + 0.02;
        });
      }, 50);
    }, 3200);
  };

  // Derive dice phase from state
  const dicePhase = state <= 1 ? 0 : state === 2 ? 1 : state === 3 ? 2 : state === 4 ? 3 : 4;

  const showFullDice = state >= 1 && state <= 5;
  const showTransition = state === 6;
  const showResBar = state >= 7;
  const showNarrative = state >= 7;

  // Transition animation: panel shrinks and slides up
  const panelStyle = showTransition ? {
    transform: "translateY(-20px) scale(0.6)",
    opacity: 0,
    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
    maxHeight: 0,
    overflow: "hidden",
  } : showFullDice ? {
    transform: "translateY(0) scale(1)",
    opacity: 1,
    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
    maxHeight: 400,
  } : {
    maxHeight: 0,
    opacity: 0,
    overflow: "hidden",
  };

  return (
    <div style={{
      minHeight: "100vh", background: C.bg, fontFamily: "'Alegreya Sans', sans-serif", color: C.text,
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
        @keyframes blink {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0; }
        }
      `}</style>

      {/* Top bar */}
      <div style={{
        height: 44, background: C.cardBg, borderBottom: `1px solid ${C.borderLight}`,
        display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px",
      }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: 20, fontWeight: 900, color: C.accent, letterSpacing: "0.06em" }}>CRUCIBLE</span>
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: 12, fontWeight: 600, color: C.goldLabel }}>RPG</span>
          <span style={{ color: C.border, margin: "0 8px" }}>|</span>
          <span style={{ fontSize: 14, color: C.dim }}>The Dockside Conspiracy</span>
        </div>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.dim }}>Turn 48</span>
      </div>

      {/* Controls */}
      <div style={{
        padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`,
        display: "flex", alignItems: "center", gap: 12, background: C.panelBg,
      }}>
        <button onClick={playSequence} style={{
          padding: "8px 20px", cursor: "pointer", borderRadius: 6,
          fontFamily: "'Cinzel', serif", fontSize: 13, fontWeight: 700,
          background: "linear-gradient(135deg, #c9a84c, #ddb84e)", border: "none",
          color: C.bg, letterSpacing: "0.06em",
        }}>
          ▶ PLAY FULL SEQUENCE
        </button>
        <button onClick={reset} style={{
          padding: "8px 16px", cursor: "pointer", borderRadius: 6,
          fontFamily: "'Alegreya Sans', sans-serif", fontSize: 13,
          background: "transparent", border: `1px solid ${C.border}`, color: C.muted,
        }}>
          Reset
        </button>
        <div style={{ flex: 1 }} />

        {/* Manual state stepper */}
        <div style={{ display: "flex", gap: 4 }}>
          {["Idle", "Rolling", "Crucible", "Mortal Spin", "Mortal Land", "Resolved", "Transition", "Streaming", "Complete"].map((label, i) => (
            <button key={i} onClick={() => { reset(); setState(i); if (i >= 7) setStreamProgress(i === 8 ? 1 : 0.5); }}
              style={{
                padding: "4px 8px", cursor: "pointer", borderRadius: 4,
                fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                background: state === i ? C.accent + "20" : "transparent",
                border: `1px solid ${state === i ? C.accent : C.borderLight}`,
                color: state === i ? C.accent : C.dim,
              }}>
              {i}
            </button>
          ))}
        </div>
      </div>

      {/* Narrative area */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 24px 100px" }}>

        {/* Turn header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${C.borderLight}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600,
              color: C.accent, background: `${C.accent}15`, padding: "3px 10px", borderRadius: 4,
            }}>Turn 2</span>
            <span style={{ fontFamily: "'Alegreya Sans', sans-serif", fontSize: 13, color: C.dim }}>
              📍 The Rusted Lantern, Dockside Quarter
            </span>
          </div>
          <div style={{ display: "flex", gap: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.dim }}>
            <span>🌙 9:45 PM</span>
            <span>🌧️ Drizzle</span>
          </div>
        </div>

        {/* Player's chosen action */}
        <div style={{
          fontFamily: "'Alegreya Sans', sans-serif", fontSize: 14, color: C.muted,
          marginBottom: 16, fontStyle: "italic",
        }}>
          → Listen to the dockhands' conversation from your table.
        </div>

        {/* FULL DICE PANEL — visible during states 1-5 */}
        <div style={panelStyle}>
          <FullDicePanel phase={dicePhase} />
        </div>

        {/* RESOLUTION BAR — appears at state 7+ with slide-in */}
        {showResBar && (
          <div style={{
            marginBottom: 20,
            animation: "fadeInUp 0.4s ease-out",
          }}>
            <ResolutionBar expanded={resExpanded} onToggle={() => setResExpanded(!resExpanded)} />
          </div>
        )}

        {/* STREAMING NARRATIVE — state 7+ */}
        <StreamingNarrative visible={showNarrative} progress={streamProgress} />

        {/* Status changes — after narrative complete */}
        {state >= 8 && (
          <div style={{
            marginTop: 24, display: "flex", flexDirection: "column", gap: 4,
            animation: "fadeInUp 0.4s ease-out",
          }}>
            {[
              { icon: "🔻", text: "Cracked Ribs → Bruised Ribs", detail: "-0.5 CON", color: C.danger },
              { icon: "✅", text: "Rattled cleared", detail: "+1.0 WIS", color: C.success },
              { icon: "⚠️", text: "Hooded Lantern damaged", detail: "Broken", color: C.warning },
              { icon: "📈", text: "Streetwise improved", detail: "+0.1 (now 1.1)", color: C.success },
            ].map((sc, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "6px 12px", borderRadius: 4,
                background: C.resolutionBg, border: `1px solid ${C.borderLight}`,
                fontFamily: "'Alegreya Sans', sans-serif", fontSize: 13,
              }}>
                <span>{sc.icon}</span>
                <span style={{ color: C.secondary, flex: 1 }}>{sc.text}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: sc.color, fontWeight: 600 }}>
                  {sc.detail}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Action options — after complete */}
        {state >= 8 && (
          <div style={{
            marginTop: 24, display: "flex", flexDirection: "column", gap: 8,
            animation: "fadeInUp 0.4s ease-out 0.2s both",
          }}>
            {[
              { key: "B", text: "Slip out and head to the harbor to find the ship with the double-crescent seal." },
              { key: "C", text: "Order another round for the dockhands' table — let them come to you." },
            ].map(opt => (
              <div key={opt.key} style={{
                display: "flex", gap: 12, padding: "14px 16px", borderRadius: 6,
                border: `1px solid ${C.border}`, cursor: "pointer",
                transition: "all 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; }}
              >
                <span style={{
                  fontFamily: "'Cinzel', serif", fontSize: 15, fontWeight: 700,
                  color: C.accent, width: 24, flexShrink: 0,
                }}>{opt.key}</span>
                <span style={{
                  fontFamily: "'Alegreya', serif", fontSize: 16, color: C.text, lineHeight: 1.6,
                }}>{opt.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* State label (for mockup purposes) */}
        <div style={{
          position: "fixed", bottom: 16, left: "50%", transform: "translateX(-50%)",
          background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 8,
          padding: "8px 20px", display: "flex", alignItems: "center", gap: 12,
          fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
        }}>
          <span style={{ color: C.goldLabel }}>STATE:</span>
          <span style={{ color: C.accent, fontWeight: 600 }}>
            {["Idle", "Rolling", "Crucible Lands", "Mortal Spinning", "Mortal Lands", "Resolved (hold)", "Transition ↑", "Narrative Streaming", "Complete"][state]}
          </span>
        </div>
      </div>
    </div>
  );
}
