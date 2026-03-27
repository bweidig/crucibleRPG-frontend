import { useState } from "react";

const fonts = `@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Alegreya+Sans:wght@300;400;500;600;700&family=Alegreya:ital,wght@0,400;0,500;1,400&family=JetBrains+Mono:wght@400;500;600&display=swap');`;

const C = {
  bg: "#0a0e1a",
  panelBg: "#0d1120",
  cardBg: "#111528",
  inputBg: "#0a0e1a",
  resolutionBg: "#0e1420",
  text: "#c8c0b0",
  heading: "#d0c098",
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
  overlay: "rgba(0,0,0,0.6)",
};

// --- CATEGORY OPTIONS ---
const BUG_CATEGORIES = [
  { id: "dice", label: "Dice / Resolution" },
  { id: "narrative", label: "Story / Narrative" },
  { id: "ui", label: "UI / Display" },
  { id: "inventory", label: "Inventory / Items" },
  { id: "npc", label: "NPCs / Factions" },
  { id: "other", label: "Other" },
];

const SUGGEST_CATEGORIES = [
  { id: "feature", label: "New Feature" },
  { id: "ui", label: "UI Improvement" },
  { id: "balance", label: "Game Balance" },
  { id: "story", label: "Storytelling" },
  { id: "other", label: "Other" },
];

// --- AUTO-ATTACHED CONTEXT PREVIEW ---
function ContextPreview({ mode }) {
  const [expanded, setExpanded] = useState(false);

  const bugContext = [
    { label: "Game", value: "The Dockside Conspiracy" },
    { label: "Character", value: "Kael Ashford" },
    { label: "Turn", value: "48" },
    { label: "Location", value: "The Rusted Lantern, Dockside Quarter" },
    { label: "Last Action", value: "Listen to the dockhands' conversation" },
    { label: "Resolution", value: "Outmatched | WIS 8.3 + Streetwise 1.0 + d20(14) = 23.3 vs DC 16.0 | +7.3 Tier 2" },
    { label: "State Changes", value: "4 (condition_escalated, condition_cleared, inventory_lost, skill_gained)" },
    { label: "Active Conditions", value: "Bruised Ribs (-1.5 CON)" },
    { label: "Context Budget", value: "6247/7000 tokens (L1: 2840, L2: 1890, L3: 740, L4: 777)" },
    { label: "Model", value: "claude-sonnet-4-20250514" },
    { label: "Tokens This Turn", value: "12,709 prompt + 847 completion" },
    { label: "Storyteller", value: "Chronicler" },
    { label: "Difficulty", value: "Standard (DC Offset +0)" },
  ];

  const suggestContext = [
    { label: "Game", value: "The Dockside Conspiracy" },
    { label: "Character", value: "Kael Ashford" },
    { label: "Turn", value: "48" },
    { label: "Storyteller", value: "Chronicler" },
    { label: "Difficulty", value: "Standard" },
  ];

  const context = mode === "bug" ? bugContext : suggestContext;

  return (
    <div style={{
      background: C.resolutionBg, border: `1px solid ${C.borderLight}`, borderRadius: 6,
      overflow: "hidden", marginBottom: 16,
    }}>
      <button onClick={() => setExpanded(!expanded)} style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        width: "100%", padding: "10px 14px", cursor: "pointer",
        background: "transparent", border: "none",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="9" y1="21" x2="9" y2="9" />
          </svg>
          <span style={{
            fontFamily: "'Alegreya Sans', sans-serif", fontSize: 12,
            color: C.dim,
          }}>
            {mode === "bug" ? "Debug snapshot auto-attached" : "Game context auto-attached"}
            <span style={{ color: C.muted, marginLeft: 6 }}>({context.length} fields)</span>
          </span>
        </div>
        <span style={{ color: C.dim, fontSize: 10, transform: expanded ? "rotate(0)" : "rotate(-90deg)", transition: "transform 0.2s" }}>▼</span>
      </button>
      {expanded && (
        <div style={{ padding: "0 14px 12px" }}>
          {context.map((item, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between", padding: "3px 0",
              borderBottom: i < context.length - 1 ? `1px solid ${C.borderLight}` : "none",
            }}>
              <span style={{ fontFamily: "'Alegreya Sans', sans-serif", fontSize: 12, color: C.dim }}>{item.label}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.secondary, textAlign: "right", maxWidth: "60%" }}>
                {item.value}
              </span>
            </div>
          ))}
          {mode === "bug" && (
            <div style={{
              fontFamily: "'Alegreya Sans', sans-serif", fontSize: 11,
              color: C.dim, fontStyle: "italic", marginTop: 8,
            }}>
              Full AI prompt/response and server JSON also included.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- REPORT MODAL ---
function ReportModal({ mode, onClose }) {
  const [category, setCategory] = useState(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const isBug = mode === "bug";
  const categories = isBug ? BUG_CATEGORIES : SUGGEST_CATEGORIES;
  const title = isBug ? "Bug Report" : "Suggestion";
  const placeholder = isBug
    ? "Describe what went wrong. What did you expect to happen?"
    : "What would make the game better? Describe your idea.";
  const recipient = isBug ? "bugs@crucibleRPG.com" : "suggestions@crucibleRPG.com";

  const handleSend = () => {
    if (!message.trim()) return;
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSent(true);
    }, 1200);
  };

  const canSend = message.trim().length > 0 && category;

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 300,
      display: "flex", alignItems: "center", justifyContent: "center",
    }} onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, background: C.overlay }} />
      <div onClick={e => e.stopPropagation()} style={{
        background: C.panelBg, border: `1px solid ${C.border}`, borderRadius: 12,
        width: 480, maxWidth: "95vw", maxHeight: "85vh", overflowY: "auto",
        position: "relative", zIndex: 1, padding: "24px 28px",
        boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
      }}>
        {/* Close */}
        <button onClick={onClose} style={{
          position: "absolute", top: 14, right: 16, background: "none", border: "none",
          color: C.dim, fontSize: 18, cursor: "pointer",
        }}>✕</button>

        {/* Sent state */}
        {sent ? (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              background: `${C.success}20`, border: `2px solid ${C.success}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <span style={{ fontSize: 24, color: C.success }}>✓</span>
            </div>
            <div style={{
              fontFamily: "'Cinzel', serif", fontSize: 18, fontWeight: 700,
              color: C.heading, marginBottom: 8,
            }}>
              {isBug ? "Report Sent" : "Suggestion Sent"}
            </div>
            <div style={{
              fontFamily: "'Alegreya Sans', sans-serif", fontSize: 14,
              color: C.muted, lineHeight: 1.6,
            }}>
              {isBug
                ? "Thanks for helping us squash bugs. We'll look into it."
                : "Thanks for the idea. We read every suggestion."
              }
            </div>
            <button onClick={onClose} style={{
              marginTop: 20, padding: "10px 28px", borderRadius: 6, cursor: "pointer",
              fontFamily: "'Alegreya Sans', sans-serif", fontSize: 14,
              background: "transparent", border: `1px solid ${C.border}`,
              color: C.muted, transition: "all 0.2s",
            }}>Close</button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{
              display: "flex", alignItems: "center", gap: 10, marginBottom: 20,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 6,
                background: isBug ? `${C.danger}15` : `${C.accent}15`,
                border: `1px solid ${isBug ? C.danger : C.accent}33`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {isBug ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.danger} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="8" y="6" width="8" height="14" rx="4" /><path d="M19 10h2" /><path d="M3 10h2" />
                    <path d="M19 14h2" /><path d="M3 14h2" /><path d="M19 18h2" /><path d="M3 18h2" />
                    <path d="M16 2l-2 4" /><path d="M8 2l2 4" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18h6" /><path d="M10 22h4" />
                    <path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />
                  </svg>
                )}
              </div>
              <div>
                <div style={{
                  fontFamily: "'Cinzel', serif", fontSize: 18, fontWeight: 700,
                  color: C.heading,
                }}>{title}</div>
                <div style={{
                  fontFamily: "'Alegreya Sans', sans-serif", fontSize: 12,
                  color: C.dim,
                }}>Sends to {recipient}</div>
              </div>
            </div>

            {/* Category selector */}
            <div style={{ marginBottom: 16 }}>
              <div style={{
                fontFamily: "'Alegreya Sans', sans-serif", fontSize: 13,
                color: C.muted, marginBottom: 8,
              }}>Category</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {categories.map(cat => (
                  <button key={cat.id} onClick={() => setCategory(cat.id)} style={{
                    padding: "5px 12px", borderRadius: 5, cursor: "pointer",
                    fontFamily: "'Alegreya Sans', sans-serif", fontSize: 13,
                    background: category === cat.id ? (isBug ? `${C.danger}15` : `${C.accent}15`) : "transparent",
                    border: `1px solid ${category === cat.id ? (isBug ? C.danger : C.accent) : C.border}`,
                    color: category === cat.id ? (isBug ? C.danger : C.accent) : C.muted,
                    transition: "all 0.2s",
                  }}>{cat.label}</button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div style={{ marginBottom: 16 }}>
              <div style={{
                fontFamily: "'Alegreya Sans', sans-serif", fontSize: 13,
                color: C.muted, marginBottom: 8,
              }}>
                {isBug ? "What happened?" : "Your idea"}
              </div>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={placeholder}
                rows={5}
                style={{
                  width: "100%", boxSizing: "border-box", padding: "12px 14px",
                  background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 6,
                  fontFamily: "'Alegreya Sans', sans-serif", fontSize: 14,
                  color: C.text, outline: "none", resize: "vertical", lineHeight: 1.6,
                }}
                onFocus={e => e.target.style.borderColor = isBug ? C.danger : C.accent}
                onBlur={e => e.target.style.borderColor = C.border}
              />
            </div>

            {/* Context preview */}
            <ContextPreview mode={mode} />

            {/* Send button */}
            <button onClick={handleSend} disabled={!canSend || sending} style={{
              width: "100%", padding: "12px 0", borderRadius: 6, cursor: canSend && !sending ? "pointer" : "default",
              fontFamily: "'Cinzel', serif", fontSize: 14, fontWeight: 700,
              letterSpacing: "0.06em",
              background: canSend
                ? (isBug ? `linear-gradient(135deg, ${C.danger}, #d06040)` : `linear-gradient(135deg, ${C.accent}, ${C.accentBright})`)
                : C.cardBg,
              border: "none",
              color: canSend ? C.bg : C.dim,
              opacity: sending ? 0.6 : 1,
              transition: "all 0.2s",
            }}>
              {sending ? "Sending..." : `Send ${title}`}
            </button>

            {/* Privacy note */}
            <div style={{
              fontFamily: "'Alegreya Sans', sans-serif", fontSize: 11,
              color: C.dim, marginTop: 12, textAlign: "center", lineHeight: 1.5,
            }}>
              {isBug
                ? "Your game state and the last turn's debug data are attached automatically to help us diagnose the issue."
                : "Basic game context is attached to help us understand your perspective."
              }
            </div>
          </>
        )}
      </div>
    </div>
  );
}


// === MAIN DEMO ===
export default function BugReportDemo() {
  const [activeModal, setActiveModal] = useState(null);

  return (
    <div style={{
      minHeight: "100vh", background: C.bg, fontFamily: "'Alegreya Sans', sans-serif", color: C.text,
    }}>
      <style>{fonts}</style>

      {/* Simulated top bar */}
      <div style={{
        height: 44, background: C.cardBg, borderBottom: `1px solid ${C.borderLight}`,
        display: "flex", alignItems: "center", padding: "0 16px",
      }}>
        <span style={{ fontFamily: "'Cinzel', serif", fontSize: 20, fontWeight: 900, color: C.accent, letterSpacing: "0.06em" }}>CRUCIBLE</span>
        <span style={{ fontFamily: "'Cinzel', serif", fontSize: 12, fontWeight: 600, color: C.goldLabel, marginLeft: 2 }}>RPG</span>
      </div>

      {/* Content area */}
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: 60, gap: 20,
      }}>
        <div style={{
          fontFamily: "'Cinzel', serif", fontSize: 16, color: C.secondary, marginBottom: 8,
        }}>Sidebar Footer Buttons</div>

        <div style={{
          display: "flex", gap: 12, padding: 20,
          background: C.panelBg, border: `1px solid ${C.border}`, borderRadius: 8,
        }}>
          <button onClick={() => setActiveModal("bug")} style={{
            flex: 1, padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            background: C.inputBg, border: `1px solid ${C.border}`,
            borderRadius: 4, cursor: "pointer",
            fontFamily: "'Alegreya Sans', sans-serif", fontSize: 14, color: C.muted,
            transition: "all 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.danger; e.currentTarget.style.color = C.danger; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="8" y="6" width="8" height="14" rx="4" /><path d="M19 10h2" /><path d="M3 10h2" />
              <path d="M19 14h2" /><path d="M3 14h2" /><path d="M19 18h2" /><path d="M3 18h2" />
              <path d="M16 2l-2 4" /><path d="M8 2l2 4" />
            </svg>
            Bug Report
          </button>
          <button onClick={() => setActiveModal("suggest")} style={{
            flex: 1, padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            background: C.inputBg, border: `1px solid ${C.border}`,
            borderRadius: 4, cursor: "pointer",
            fontFamily: "'Alegreya Sans', sans-serif", fontSize: 14, color: C.muted,
            transition: "all 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18h6" /><path d="M10 22h4" />
              <path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />
            </svg>
            Suggest
          </button>
        </div>

        <div style={{
          fontFamily: "'Alegreya Sans', sans-serif", fontSize: 13, color: C.dim,
          textAlign: "center", maxWidth: 400, lineHeight: 1.6,
        }}>
          Click either button to see the modal. Bug Report attaches a full debug snapshot (13 fields + raw AI data). Suggest attaches lighter context (5 fields).
        </div>
      </div>

      {/* Modals */}
      {activeModal === "bug" && <ReportModal mode="bug" onClose={() => setActiveModal(null)} />}
      {activeModal === "suggest" && <ReportModal mode="suggest" onClose={() => setActiveModal(null)} />}
    </div>
  );
}
