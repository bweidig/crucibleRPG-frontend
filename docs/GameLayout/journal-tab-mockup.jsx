import { useState } from "react";

const fonts = `@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Alegreya+Sans:wght@300;400;500;600;700&family=Alegreya:ital,wght@0,400;0,500;1,400&family=JetBrains+Mono:wght@400;500;600&display=swap');`;

// --- Uses brown sidebar theme from design system ---
const T = {
  bg: "#0e0c0a",
  panelBg: "#121010",
  cardBg: "#161412",
  inputBg: "#0e0c0a",
  text: "#b8a88a",
  heading: "#d4c4a0",
  textMuted: "#948373",
  textDim: "#948270",
  textFaint: "#948470",
  goldMuted: "#907f5e",
  accent: "#c9a84c",
  accentBg: "#161412",
  danger: "#e8845a",
  success: "#8aba7a",
  border: "#2a2520",
  borderLight: "#1e1c18",
};

// --- SAMPLE DATA ---
const SAMPLE_SERVER_OBJECTIVES = [
  {
    id: "ironworkers_delivery_01",
    text: "Deliver the iron shipment to the eastern outpost",
    faction: "Ironworkers",
    progress: null,
  },
  {
    id: "marta_locket_01",
    text: "Search the abandoned mill for Marta's locket",
    faction: null,
    progress: null,
  },
  {
    id: "crypt_tome_01",
    text: "Study the tome recovered from the crypt",
    faction: null,
    progress: { current: 6, required: 14 },
  },
];

const SAMPLE_PLAYER_OBJECTIVES = [
  { id: "p1", text: "Find out what happened to my brother" },
  { id: "p2", text: "Save enough coin to buy a horse" },
];

const SAMPLE_NOTES = `- Veymar is moving cargo at midnight
- Pol knows something, might talk if approached alone
- Double-crescent seal — seen on three shipments this month
- Ask barkeep about the ship that arrived this morning
- Need to find triage for ribs before they get worse`;

// --- PANEL SECTION (matches game layout) ---
function PanelSection({ title, children, defaultOpen = true, count }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 4 }}>
      <button onClick={() => setOpen(!open)} style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
        background: "transparent", border: "none",
        borderBottom: `1px solid ${T.borderLight}`,
        padding: "10px 0", cursor: "pointer",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 600,
            color: T.goldMuted, letterSpacing: "0.12em", textTransform: "uppercase",
          }}>{title}</span>
          {count !== undefined && (
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
              color: T.textDim, background: T.cardBg,
              padding: "1px 6px", borderRadius: 3,
            }}>{count}</span>
          )}
        </div>
        <span style={{
          color: T.textDim, fontSize: 11,
          transform: open ? "rotate(0)" : "rotate(-90deg)",
          transition: "transform 0.2s",
        }}>▼</span>
      </button>
      {open && <div style={{ padding: "10px 0" }}>{children}</div>}
    </div>
  );
}

// --- SERVER-TRACKED OBJECTIVE ---
function ServerObjective({ obj, onAbandon }) {
  const [confirmAbandon, setConfirmAbandon] = useState(false);

  return (
    <div style={{
      padding: "8px 10px", borderRadius: 6, marginBottom: 6,
      background: T.cardBg, border: `1px solid ${T.border}`,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 14,
          color: T.accent, flexShrink: 0, marginTop: 1,
        }}>◆</span>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: "'Alegreya Sans', sans-serif", fontSize: 14,
            color: T.text, lineHeight: 1.5,
          }}>
            {obj.text}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
            {obj.faction && (
              <span style={{
                fontFamily: "'Alegreya Sans', sans-serif", fontSize: 11, fontWeight: 600,
                color: T.goldMuted, background: `${T.goldMuted}18`,
                padding: "1px 8px", borderRadius: 3,
              }}>{obj.faction}</span>
            )}
            {obj.progress && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
                <div style={{
                  flex: 1, height: 4, background: T.bg, borderRadius: 2, overflow: "hidden",
                  maxWidth: 80,
                }}>
                  <div style={{
                    height: "100%", borderRadius: 2,
                    width: `${(obj.progress.current / obj.progress.required) * 100}%`,
                    background: T.accent, opacity: 0.7,
                  }} />
                </div>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T.textDim,
                }}>{obj.progress.current}/{obj.progress.required}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Abandon flow */}
      {!confirmAbandon ? (
        <button onClick={() => setConfirmAbandon(true)} style={{
          background: "none", border: "none", cursor: "pointer",
          fontFamily: "'Alegreya Sans', sans-serif", fontSize: 11,
          color: T.textFaint, marginTop: 6, padding: 0,
          transition: "color 0.2s",
        }}
          onMouseEnter={e => e.target.style.color = T.danger}
          onMouseLeave={e => e.target.style.color = T.textFaint}
        >
          Abandon
        </button>
      ) : (
        <div style={{
          marginTop: 8, padding: "8px 10px", borderRadius: 4,
          background: `${T.danger}10`, border: `1px solid ${T.danger}33`,
        }}>
          <div style={{
            fontFamily: "'Alegreya Sans', sans-serif", fontSize: 12,
            color: T.danger, lineHeight: 1.5, marginBottom: 8,
          }}>
            Abandoning triggers consequences: standing penalties, narrative fallout, and a permanent record. This isn't a quiet delete.
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => { onAbandon(obj.id); setConfirmAbandon(false); }} style={{
              padding: "4px 12px", borderRadius: 4, cursor: "pointer",
              fontFamily: "'Alegreya Sans', sans-serif", fontSize: 12, fontWeight: 600,
              background: `${T.danger}20`, border: `1px solid ${T.danger}66`,
              color: T.danger,
            }}>
              Abandon
            </button>
            <button onClick={() => setConfirmAbandon(false)} style={{
              padding: "4px 12px", borderRadius: 4, cursor: "pointer",
              fontFamily: "'Alegreya Sans', sans-serif", fontSize: 12,
              background: "transparent", border: `1px solid ${T.border}`,
              color: T.textMuted,
            }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- PLAYER-DEFINED OBJECTIVE ---
function PlayerObjective({ obj, onDrop }) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 8,
      padding: "6px 10px", borderRadius: 6, marginBottom: 4,
      transition: "background 0.15s",
    }}
      onMouseEnter={e => e.currentTarget.style.background = T.cardBg}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      <span style={{
        fontFamily: "'JetBrains Mono', monospace", fontSize: 14,
        color: T.textMuted, flexShrink: 0, marginTop: 1,
      }}>○</span>
      <span style={{
        fontFamily: "'Alegreya Sans', sans-serif", fontSize: 14,
        color: T.text, lineHeight: 1.5, flex: 1,
      }}>
        {obj.text}
      </span>
      <button onClick={() => onDrop(obj.id)} style={{
        background: "none", border: "none", cursor: "pointer",
        color: T.textFaint, fontSize: 14, padding: "0 2px",
        opacity: 0.4, transition: "opacity 0.2s, color 0.2s",
        flexShrink: 0,
      }}
        onMouseEnter={e => { e.target.style.opacity = 1; e.target.style.color = T.danger; }}
        onMouseLeave={e => { e.target.style.opacity = 0.4; e.target.style.color = T.textFaint; }}
        title="Drop this objective"
      >
        ×
      </button>
    </div>
  );
}

// --- ENTITY NOTE (from notes endpoint) ---
function EntityNote({ note }) {
  return (
    <div style={{
      padding: "8px 10px", borderRadius: 6, marginBottom: 6,
      background: T.cardBg, border: `1px solid ${T.border}`,
    }}>
      <div style={{
        fontFamily: "'Cinzel', serif", fontSize: 12, fontWeight: 600,
        color: T.heading, marginBottom: 4,
      }}>
        {note.entityName}
      </div>
      <div style={{
        fontFamily: "'Alegreya Sans', sans-serif", fontSize: 13,
        color: T.textMuted, lineHeight: 1.5,
      }}>
        {note.text}
      </div>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
        color: T.textFaint, marginTop: 4,
      }}>
        Turn {note.turn}
      </div>
    </div>
  );
}


// === MAIN JOURNAL TAB ===
export default function JournalTab() {
  const [serverObjectives, setServerObjectives] = useState(SAMPLE_SERVER_OBJECTIVES);
  const [playerObjectives, setPlayerObjectives] = useState(SAMPLE_PLAYER_OBJECTIVES);
  const [newObjective, setNewObjective] = useState("");
  const [notes, setNotes] = useState(SAMPLE_NOTES);
  const [abandonedId, setAbandonedId] = useState(null);

  const handleAbandon = (id) => {
    setAbandonedId(id);
    setServerObjectives(prev => prev.filter(o => o.id !== id));
  };

  const handleDrop = (id) => {
    setPlayerObjectives(prev => prev.filter(o => o.id !== id));
  };

  const handleAddObjective = () => {
    if (!newObjective.trim()) return;
    setPlayerObjectives(prev => [...prev, {
      id: `p${Date.now()}`,
      text: newObjective.trim(),
    }]);
    setNewObjective("");
  };

  const entityNotes = [
    { entityName: "Warehouse Row", text: "Veymar unloading cargo here at midnight. Double-crescent crates.", turn: 45 },
    { entityName: "Pol", text: "Youngest dockhand. Nervous. Knows about the shipments. Might talk if separated from the others.", turn: 48 },
    { entityName: "The Rusted Lantern", text: "Barkeep has burn scars. Doesn't look up. Might know more than she lets on.", turn: 47 },
  ];

  const totalObjectives = serverObjectives.length + playerObjectives.length;

  return (
    <div style={{
      width: 380, minHeight: "100vh", background: T.panelBg,
      fontFamily: "'Alegreya Sans', sans-serif", color: T.text,
    }}>
      <style>{fonts}</style>

      {/* Simulated sidebar tab bar */}
      <div style={{
        padding: "14px 16px 10px",
        borderBottom: `1px solid ${T.borderLight}`,
        display: "flex", gap: 12,
      }}>
        {["Character", "Inventory", "NPCs", "Glossary", "Map", "Journal"].map(tab => (
          <span key={tab} style={{
            fontFamily: "'Cinzel', serif", fontSize: 10, fontWeight: tab === "Journal" ? 700 : 500,
            letterSpacing: "0.06em",
            color: tab === "Journal" ? T.accent : T.textDim,
            borderBottom: tab === "Journal" ? `2px solid ${T.accent}` : "2px solid transparent",
            paddingBottom: 6, cursor: "pointer",
          }}>{tab}</span>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ padding: "4px 16px 24px" }}>

        {/* OBJECTIVES SECTION */}
        <PanelSection title="Objectives" count={totalObjectives}>

          {/* Server-tracked */}
          {serverObjectives.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              {serverObjectives.map(obj => (
                <ServerObjective key={obj.id} obj={obj} onAbandon={handleAbandon} />
              ))}
            </div>
          )}

          {/* Abandoned notification */}
          {abandonedId && (
            <div style={{
              padding: "8px 10px", borderRadius: 6, marginBottom: 10,
              background: `${T.danger}10`, border: `1px solid ${T.danger}22`,
              fontFamily: "'Alegreya Sans', sans-serif", fontSize: 12,
              color: T.danger, fontStyle: "italic",
            }}>
              Objective abandoned. Consequences will unfold next turn.
            </div>
          )}

          {/* Player-defined */}
          {playerObjectives.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              {playerObjectives.map(obj => (
                <PlayerObjective key={obj.id} obj={obj} onDrop={handleDrop} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {serverObjectives.length === 0 && playerObjectives.length === 0 && (
            <div style={{
              fontFamily: "'Alegreya Sans', sans-serif", fontSize: 13,
              color: T.textFaint, fontStyle: "italic", padding: "8px 0",
            }}>
              No active objectives. The world is yours to direct.
            </div>
          )}

          {/* Add player objective */}
          <div style={{
            display: "flex", gap: 6, marginTop: 4,
          }}>
            <input
              type="text"
              value={newObjective}
              onChange={e => setNewObjective(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleAddObjective(); }}
              placeholder="Add a personal objective..."
              style={{
                flex: 1, padding: "8px 10px",
                background: T.inputBg, border: `1px solid ${T.border}`, borderRadius: 6,
                fontFamily: "'Alegreya Sans', sans-serif", fontSize: 13,
                color: T.text, outline: "none",
              }}
              onFocus={e => e.target.style.borderColor = T.accent}
              onBlur={e => e.target.style.borderColor = T.border}
            />
            <button onClick={handleAddObjective} disabled={!newObjective.trim()} style={{
              padding: "8px 12px", borderRadius: 6, cursor: newObjective.trim() ? "pointer" : "default",
              background: newObjective.trim() ? `${T.accent}20` : "transparent",
              border: `1px solid ${newObjective.trim() ? T.accent : T.border}`,
              color: newObjective.trim() ? T.accent : T.textFaint,
              fontFamily: "'Alegreya Sans', sans-serif", fontSize: 13, fontWeight: 600,
              transition: "all 0.2s", flexShrink: 0,
            }}>
              +
            </button>
          </div>
        </PanelSection>

        {/* ENTITY NOTES SECTION */}
        <PanelSection title="Entity Notes" count={entityNotes.length}>
          {entityNotes.map((note, i) => (
            <EntityNote key={i} note={note} />
          ))}
          <div style={{
            fontFamily: "'Alegreya Sans', sans-serif", fontSize: 12,
            color: T.textFaint, fontStyle: "italic", marginTop: 4,
          }}>
            Add notes to any NPC, location, or item from their popup.
          </div>
        </PanelSection>

        {/* FREEFORM NOTES SECTION */}
        <PanelSection title="Scratchpad">
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Theories, plans, things to remember..."
            style={{
              width: "100%", minHeight: 180, boxSizing: "border-box",
              background: T.inputBg, border: `1px solid ${T.border}`,
              borderRadius: 6, padding: "12px 14px",
              fontFamily: "'Alegreya Sans', sans-serif", fontSize: 14,
              color: T.text, outline: "none", resize: "vertical",
              lineHeight: 1.7,
            }}
            onFocus={e => e.target.style.borderColor = T.accent}
            onBlur={e => e.target.style.borderColor = T.border}
          />
          <div style={{
            fontFamily: "'Alegreya Sans', sans-serif", fontSize: 11,
            color: T.textFaint, marginTop: 4, textAlign: "right",
          }}>Auto-saved</div>
        </PanelSection>

      </div>
    </div>
  );
}
