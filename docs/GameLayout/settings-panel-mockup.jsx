import { useState, useEffect } from "react";

const fonts = `@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Alegreya+Sans:wght@300;400;500;600;700&family=Alegreya:ital,wght@0,400;0,500;1,400&family=JetBrains+Mono:wght@400;500;600&display=swap');`;

// --- DESIGN SYSTEM COLORS ---
const C = {
  bg: "#0a0e1a",
  panelBg: "#0d1120",
  cardBg: "#111528",
  inputBg: "#0a0e1a",
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
  brighterSecondary: "#8a9ab8",
  statValues: "#b0b8cc",
  goldLabel: "#9a8545",
  border: "#1e2540",
  borderLight: "#161c34",
  cardBorder: "#3a3328",
  cardBorderHover: "#564b2e",
  cardSeparator: "#2a2622",
  overlay: "rgba(0,0,0,0.6)",
  accentBg: "#1a1810",
};

// --- STORYTELLER DATA ---
const STORYTELLERS = [
  { id: "chronicler", name: "Chronicler", oneLiner: "The world as it is." },
  { id: "bard", name: "Bard", oneLiner: "Every moment a legend in the making." },
  { id: "trickster", name: "Trickster", oneLiner: "The world has a sense of humor." },
  { id: "poet", name: "Poet", oneLiner: "Beauty in the breaking." },
  { id: "whisper", name: "Whisper", oneLiner: "Everything is fine. Almost." },
  { id: "noir", name: "Noir", oneLiner: "The city always wins." },
  { id: "custom", name: "Custom", oneLiner: "Your voice, your rules." },
];

// --- DIFFICULTY PRESETS ---
const PRESETS = [
  { id: "forgiving", label: "Forgiving", dcOffset: -2, fateDC: 8, survival: false, durability: false, progression: 1.0, encounter: "low", fortune: true, simplified: false, color: "#7aba7a", bg: "#142018" },
  { id: "standard", label: "Standard", dcOffset: 0, fateDC: 12, survival: true, durability: true, progression: 1.0, encounter: "standard", fortune: true, simplified: false, color: "#8a94a8", bg: "#161a20" },
  { id: "harsh", label: "Harsh", dcOffset: 2, fateDC: 16, survival: true, durability: true, progression: 1.0, encounter: "high", fortune: true, simplified: false, color: "#e8c45a", bg: "#1e1a12" },
  { id: "brutal", label: "Brutal", dcOffset: 4, fateDC: 18, survival: true, durability: true, progression: 1.0, encounter: "high", fortune: true, simplified: false, color: "#e85a5a", bg: "#201416" },
];

// --- CHECKPOINT DATA ---
const INITIAL_CHECKPOINTS = [
  { slot: 1, label: "Slot 1 — Turn 42, Merchant Ward", saved: true, turn: 42, location: "Merchant Ward" },
  { slot: 2, label: "Slot 2 — Turn 48, Dockside Quarter", saved: true, turn: 48, location: "Dockside Quarter" },
  { slot: 3, label: "", saved: false, turn: null, location: null },
];

// --- SHARED COMPONENTS ---

function SectionLabel({ children }) {
  return (
    <div style={{
      fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 600,
      color: C.goldLabel, letterSpacing: "0.1em", textTransform: "uppercase",
      marginBottom: 10, marginTop: 20,
    }}>
      {children}
    </div>
  );
}

function Toggle({ label, value, onChange, description }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "8px 0", borderBottom: `1px solid ${C.borderLight}`,
    }}>
      <div>
        <div style={{ fontFamily: "'Alegreya Sans', sans-serif", fontSize: 14, color: C.text }}>{label}</div>
        {description && (
          <div style={{ fontFamily: "'Alegreya Sans', sans-serif", fontSize: 12, color: C.dim, marginTop: 2 }}>{description}</div>
        )}
      </div>
      <button onClick={() => onChange(!value)} style={{
        width: 44, height: 24, borderRadius: 12, cursor: "pointer",
        background: value ? C.accent : C.cardBg,
        border: `1px solid ${value ? C.accent : C.border}`,
        position: "relative", transition: "all 0.2s", flexShrink: 0, marginLeft: 12,
      }}>
        <div style={{
          width: 18, height: 18, borderRadius: "50%",
          background: value ? C.bg : C.secondary,
          position: "absolute", top: 2,
          left: value ? 22 : 2,
          transition: "left 0.2s, background 0.2s",
        }} />
      </button>
    </div>
  );
}

function SliderControl({ label, value, min, max, step, format, onChange, description, warning }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ padding: "10px 0", borderBottom: `1px solid ${C.borderLight}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <div>
          <span style={{ fontFamily: "'Alegreya Sans', sans-serif", fontSize: 14, color: C.text }}>{label}</span>
          {description && (
            <div style={{ fontFamily: "'Alegreya Sans', sans-serif", fontSize: 12, color: C.dim, marginTop: 2 }}>{description}</div>
          )}
        </div>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 500, color: C.accent, flexShrink: 0 }}>
          {format ? format(value) : value}
        </span>
      </div>
      <div style={{ position: "relative", height: 20, display: "flex", alignItems: "center" }}>
        <div style={{
          position: "absolute", left: 0, right: 0, height: 4, borderRadius: 2,
          background: C.cardBg, border: `1px solid ${C.borderLight}`,
        }} />
        <div style={{
          position: "absolute", left: 0, height: 4, borderRadius: 2,
          width: `${pct}%`, background: warning ? C.danger : C.accent, opacity: 0.6,
          transition: "width 0.15s",
        }} />
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          style={{
            width: "100%", height: 20, cursor: "pointer",
            WebkitAppearance: "none", appearance: "none", background: "transparent",
            position: "relative", zIndex: 1, margin: 0,
          }}
        />
      </div>
      {warning && (
        <div style={{
          fontFamily: "'Alegreya Sans', sans-serif", fontSize: 11, color: C.danger,
          marginTop: 4, fontStyle: "italic",
        }}>
          ⚠ {warning}
        </div>
      )}
    </div>
  );
}

function SelectorRow({ label, options, value, onChange, description }) {
  return (
    <div style={{ padding: "10px 0", borderBottom: `1px solid ${C.borderLight}` }}>
      <div style={{ fontFamily: "'Alegreya Sans', sans-serif", fontSize: 14, color: C.text, marginBottom: 6 }}>{label}</div>
      {description && (
        <div style={{ fontFamily: "'Alegreya Sans', sans-serif", fontSize: 12, color: C.dim, marginBottom: 8 }}>{description}</div>
      )}
      <div style={{ display: "flex", gap: 4 }}>
        {options.map(opt => (
          <button key={opt.id} onClick={() => onChange(opt.id)} style={{
            flex: 1, padding: "6px 0", cursor: "pointer", borderRadius: 5,
            fontFamily: "'Alegreya Sans', sans-serif", fontSize: 13,
            border: `1px solid ${value === opt.id ? C.accent : C.border}`,
            background: value === opt.id ? C.accentBg : "transparent",
            color: value === opt.id ? C.accent : C.muted,
            transition: "all 0.2s",
          }}>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// --- TAB: GAME SETTINGS ---
function GameSettingsTab() {
  const [storyteller, setStoryteller] = useState("chronicler");
  const [customDirective, setCustomDirective] = useState("");
  const [preset, setPreset] = useState("standard");
  const [dcOffset, setDcOffset] = useState(0);
  const [survival, setSurvival] = useState(true);
  const [durability, setDurability] = useState(true);
  const [progression, setProgression] = useState(1.0);
  const [encounter, setEncounter] = useState("standard");
  const [fortune, setFortune] = useState(true);
  const [simplified, setSimplified] = useState(false);
  const [currency, setCurrency] = useState("coins");

  const applyPreset = (p) => {
    setPreset(p.id);
    setDcOffset(p.dcOffset);
    setSurvival(p.survival);
    setDurability(p.durability);
    setProgression(p.progression);
    setEncounter(p.encounter);
    setFortune(p.fortune);
    setSimplified(p.simplified);
  };

  const markCustom = () => setPreset("custom");

  const dcWarning = dcOffset > 4
    ? "Beyond designed range — encounter balance may feel off."
    : dcOffset < -2
    ? "Beyond designed range — encounter balance may feel off."
    : null;

  const selectedST = STORYTELLERS.find(s => s.id === storyteller);

  return (
    <div>
      {/* Storyteller selector */}
      <SectionLabel>Storyteller</SectionLabel>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
        {STORYTELLERS.map(st => (
          <button key={st.id} onClick={() => setStoryteller(st.id)} style={{
            padding: "6px 12px", cursor: "pointer", borderRadius: 5,
            fontFamily: "'Cinzel', serif", fontSize: 12, fontWeight: 600,
            border: `1px solid ${storyteller === st.id ? C.accent : C.border}`,
            background: storyteller === st.id ? C.accentBg : "transparent",
            color: storyteller === st.id ? C.accent : C.muted,
            transition: "all 0.2s", letterSpacing: "0.04em",
          }}>
            {st.name}
          </button>
        ))}
      </div>
      {storyteller !== "custom" && selectedST && (
        <div style={{
          fontFamily: "'Alegreya', serif", fontSize: 14, fontStyle: "italic",
          color: C.brighterSecondary, padding: "6px 0 4px",
        }}>
          "{selectedST.oneLiner}"
        </div>
      )}
      {storyteller === "custom" && (
        <div style={{ marginTop: 6 }}>
          <textarea
            value={customDirective}
            onChange={e => { if (e.target.value.length <= 500) setCustomDirective(e.target.value); }}
            placeholder="Describe your narrative voice, or name storytellers to blend — e.g. 'Bard with a touch of Trickster.'"
            maxLength={500}
            style={{
              width: "100%", boxSizing: "border-box", minHeight: 80, padding: "10px 12px",
              background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 6,
              fontFamily: "'Alegreya Sans', sans-serif", fontSize: 14, color: C.text,
              outline: "none", resize: "vertical", lineHeight: 1.5,
            }}
            onFocus={e => e.target.style.borderColor = C.accent}
            onBlur={e => e.target.style.borderColor = C.border}
          />
          <div style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
            color: customDirective.length >= 450 ? C.danger : C.dim,
            textAlign: "right", marginTop: 4,
          }}>
            {customDirective.length}/500
          </div>
        </div>
      )}

      {/* Difficulty presets */}
      <SectionLabel>Difficulty</SectionLabel>
      <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
        {PRESETS.map(p => (
          <button key={p.id} onClick={() => applyPreset(p)} style={{
            flex: 1, padding: "8px 0", cursor: "pointer", borderRadius: 5,
            fontFamily: "'Cinzel', serif", fontSize: 12, fontWeight: 700,
            border: `1px solid ${preset === p.id ? p.color + "66" : C.border}`,
            background: preset === p.id ? p.bg : "transparent",
            color: preset === p.id ? p.color : C.muted,
            transition: "all 0.2s", letterSpacing: "0.06em",
          }}>
            {p.label}
          </button>
        ))}
      </div>
      {preset === "custom" && (
        <div style={{ fontFamily: "'Alegreya Sans', sans-serif", fontSize: 12, color: C.dim, fontStyle: "italic", marginBottom: 4 }}>
          Custom — one or more dials adjusted from preset
        </div>
      )}

      {/* Dials */}
      <SliderControl
        label="DC Offset" value={dcOffset} min={-10} max={10} step={1}
        format={v => (v >= 0 ? `+${v}` : `${v}`)}
        onChange={v => { setDcOffset(v); markCustom(); }}
        description="Flat modifier applied to all DCs"
        warning={dcWarning}
      />
      <SliderControl
        label="Progression Speed" value={progression} min={0} max={5} step={0.25}
        format={v => `${v.toFixed(2)}×`}
        onChange={v => { setProgression(v); markCustom(); }}
        description={progression === 0 ? "All stat/skill gains frozen" : "Multiplier on stat and skill gains"}
      />
      <SelectorRow
        label="Encounter Pressure" value={encounter}
        options={[
          { id: "low", label: "Low" },
          { id: "standard", label: "Standard" },
          { id: "high", label: "High" },
        ]}
        onChange={v => { setEncounter(v); markCustom(); }}
        description="Frequency and tension of random encounters"
      />
      <Toggle label="Survival" value={survival} onChange={v => { setSurvival(v); markCustom(); }}
        description="Track rations, water, and malnourishment" />
      <Toggle label="Durability" value={durability} onChange={v => { setDurability(v); markCustom(); }}
        description="Items degrade with use and need repair" />
      <Toggle label="Fortune's Balance" value={fortune} onChange={v => { setFortune(v); markCustom(); }}
        description="Outmatched/Matched/Dominant dice categorization" />
      <Toggle label="Simplified Outcomes" value={simplified} onChange={v => { setSimplified(v); markCustom(); }}
        description="Binary pass/fail instead of 6-tier system" />

      {/* Currency Weight — separate from difficulty */}
      <SectionLabel>World Property</SectionLabel>
      <SelectorRow
        label="Currency Weight" value={currency}
        options={[
          { id: "coins", label: "Coins" },
          { id: "paper", label: "Paper" },
          { id: "digital", label: "Digital" },
        ]}
        onChange={setCurrency}
        description="Set by world setting — affects inventory weight"
      />

      <div style={{
        fontFamily: "'Alegreya Sans', sans-serif", fontSize: 12, color: C.dim,
        marginTop: 16, fontStyle: "italic",
      }}>
        Changes take effect on the next relevant game event. No retroactive recalculation.
      </div>
    </div>
  );
}

// --- TAB: DISPLAY SETTINGS ---
function DisplayTab() {
  const [theme, setTheme] = useState("dark");
  const [font, setFont] = useState("alegreya");
  const [textSize, setTextSize] = useState("medium");
  const [clickToRoll, setClickToRoll] = useState(true);
  const [instantMode, setInstantMode] = useState(false);

  const THEMES = [
    { id: "dark", label: "Dark" },
    { id: "sepia", label: "Sepia" },
    { id: "light", label: "Light" },
  ];

  const FONTS = [
    { id: "alegreya", label: "Alegreya", family: "'Alegreya', serif" },
    { id: "alegreya-sans", label: "Alegreya Sans", family: "'Alegreya Sans', sans-serif" },
    { id: "lexie", label: "Lexie Readable", family: "'Lexie Readable', sans-serif" },
  ];

  const SIZES = [
    { id: "small", label: "Small" },
    { id: "medium", label: "Medium" },
    { id: "large", label: "Large" },
  ];

  return (
    <div>
      <SectionLabel>Theme</SectionLabel>
      <div style={{ display: "flex", gap: 6 }}>
        {THEMES.map(t => (
          <button key={t.id} onClick={() => setTheme(t.id)} style={{
            flex: 1, padding: "10px 0", cursor: "pointer", borderRadius: 6,
            fontFamily: "'Alegreya Sans', sans-serif", fontSize: 14,
            border: `1px solid ${theme === t.id ? C.accent : C.border}`,
            background: theme === t.id ? C.accentBg : "transparent",
            color: theme === t.id ? C.accent : C.muted,
            transition: "all 0.2s",
          }}>{t.label}</button>
        ))}
      </div>

      <SectionLabel>Font</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {FONTS.map(f => (
          <button key={f.id} onClick={() => setFont(f.id)} style={{
            padding: "10px 12px", cursor: "pointer", borderRadius: 6, textAlign: "left",
            border: `1px solid ${font === f.id ? C.accent : C.border}`,
            background: font === f.id ? C.accentBg : "transparent",
            fontFamily: f.family, fontSize: 14,
            color: font === f.id ? C.accent : C.text,
            transition: "all 0.2s",
          }}>
            {f.label} — The quick brown fox jumps over the lazy dog
          </button>
        ))}
      </div>

      <SectionLabel>Text Size</SectionLabel>
      <div style={{ display: "flex", gap: 6 }}>
        {SIZES.map(s => (
          <button key={s.id} onClick={() => setTextSize(s.id)} style={{
            flex: 1, padding: "8px 0", cursor: "pointer", borderRadius: 6,
            fontFamily: "'Alegreya Sans', sans-serif", fontSize: 13,
            border: `1px solid ${textSize === s.id ? C.accent : C.border}`,
            background: textSize === s.id ? C.accentBg : "transparent",
            color: textSize === s.id ? C.accent : C.muted,
            transition: "all 0.2s",
          }}>{s.label}</button>
        ))}
      </div>

      <SectionLabel>Dice Display</SectionLabel>
      <Toggle label="Click to Roll" value={clickToRoll} onChange={setClickToRoll}
        description="Click/tap the dice to trigger the roll animation" />
      <Toggle label="Instant Mode" value={instantMode} onChange={setInstantMode}
        description="Skip all dice animations, show results immediately" />

      <div style={{
        fontFamily: "'Alegreya Sans', sans-serif", fontSize: 12, color: C.dim,
        marginTop: 16, fontStyle: "italic",
      }}>
        Settings are saved automatically and persist across sessions.
      </div>
    </div>
  );
}

// --- TAB: WORLD ---
function WorldTab() {
  const [shareMode, setShareMode] = useState(null); // null | "began" | "current"
  const [copied, setCopied] = useState(false);
  const [snapshotName, setSnapshotName] = useState("The Dockside Conspiracy — Turn 48");
  const [snapshotSaved, setSnapshotSaved] = useState(false);
  const [checkpoints, setCheckpoints] = useState(INITIAL_CHECKPOINTS);
  const [editingSlot, setEditingSlot] = useState(null);
  const [editText, setEditText] = useState("");
  const [loadedSlot, setLoadedSlot] = useState(null);

  const handleShare = (mode) => {
    setShareMode(mode);
    setCopied(false);
  };

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveSnapshot = () => {
    setSnapshotSaved(true);
    setTimeout(() => setSnapshotSaved(false), 2500);
  };

  const handleSaveCheckpoint = (slot) => {
    setCheckpoints(prev => prev.map(cp =>
      cp.slot === slot
        ? { ...cp, label: `Slot ${slot} — Turn 48, Dockside Quarter`, saved: true, turn: 48, location: "Dockside Quarter" }
        : cp
    ));
  };

  const handleClearCheckpoint = (slot) => {
    setCheckpoints(prev => prev.map(cp =>
      cp.slot === slot ? { ...cp, label: "", saved: false, turn: null, location: null } : cp
    ));
  };

  const startEditing = (cp) => {
    setEditingSlot(cp.slot);
    setEditText(cp.label);
  };

  const finishEditing = () => {
    setCheckpoints(prev => prev.map(cp =>
      cp.slot === editingSlot ? { ...cp, label: editText } : cp
    ));
    setEditingSlot(null);
  };

  const handleLoadCheckpoint = (slot) => {
    setLoadedSlot(slot);
    setTimeout(() => setLoadedSlot(null), 2000);
  };

  return (
    <div>
      {/* Share This World */}
      <SectionLabel>Share This World</SectionLabel>
      <div style={{
        background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 8,
        padding: 16,
      }}>
        {!shareMode ? (
          <div>
            <div style={{ fontFamily: "'Alegreya Sans', sans-serif", fontSize: 13, color: C.muted, marginBottom: 12 }}>
              Generate an unlisted link so others can start a game in your world.
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => handleShare("began")} style={{
                flex: 1, padding: "10px 8px", cursor: "pointer", borderRadius: 6,
                background: "transparent", border: `1px solid ${C.border}`,
                fontFamily: "'Alegreya Sans', sans-serif", fontSize: 13, color: C.text,
                transition: "all 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.text; }}
              >
                <div style={{ fontWeight: 600, marginBottom: 2 }}>As it began</div>
                <div style={{ fontSize: 11, color: C.dim }}>Turn 1 — original world</div>
              </button>
              <button onClick={() => handleShare("current")} style={{
                flex: 1, padding: "10px 8px", cursor: "pointer", borderRadius: 6,
                background: "transparent", border: `1px solid ${C.border}`,
                fontFamily: "'Alegreya Sans', sans-serif", fontSize: 13, color: C.text,
                transition: "all 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.text; }}
              >
                <div style={{ fontWeight: 600, marginBottom: 2 }}>As it is now</div>
                <div style={{ fontSize: 11, color: C.dim }}>Turn 48 — evolved state</div>
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{
              display: "flex", alignItems: "center", gap: 8, marginBottom: 10,
            }}>
              <button onClick={() => setShareMode(null)} style={{
                background: "none", border: "none", color: C.dim, cursor: "pointer",
                fontFamily: "'Alegreya Sans', sans-serif", fontSize: 12,
              }}>← Back</button>
              <span style={{ fontFamily: "'Alegreya Sans', sans-serif", fontSize: 13, color: C.heading, fontWeight: 600 }}>
                {shareMode === "began" ? "Share: As it began (Turn 1)" : "Share: As it is now (Turn 48)"}
              </span>
            </div>
            <div style={{
              background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 6,
              padding: "8px 12px", fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
              color: C.secondary, marginBottom: 10, wordBreak: "break-all",
            }}>
              crucibleRPG.com/snapshot/x7k9m2p{shareMode === "began" ? "f1" : "e48"}
            </div>
            <button onClick={handleCopy} style={{
              width: "100%", padding: "8px 0", cursor: "pointer", borderRadius: 6,
              fontFamily: "'Alegreya Sans', sans-serif", fontSize: 14, fontWeight: 600,
              background: copied ? C.success + "20" : C.accentBg,
              border: `1px solid ${copied ? C.success : C.accent}`,
              color: copied ? C.success : C.accent,
              transition: "all 0.2s",
            }}>
              {copied ? "✓ Copied to clipboard" : "Copy Link"}
            </button>
          </div>
        )}
      </div>

      {/* Save World Snapshot */}
      <SectionLabel>Save World Snapshot</SectionLabel>
      <div style={{
        background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 8,
        padding: 16,
      }}>
        <div style={{ fontFamily: "'Alegreya Sans', sans-serif", fontSize: 13, color: C.muted, marginBottom: 10 }}>
          Save the current world state to Your Worlds for reuse in future games.
        </div>
        <input
          type="text" value={snapshotName} onChange={e => setSnapshotName(e.target.value)}
          style={{
            width: "100%", boxSizing: "border-box", padding: "8px 12px",
            background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 6,
            fontFamily: "'Alegreya Sans', sans-serif", fontSize: 14, color: C.text,
            outline: "none", marginBottom: 10,
          }}
          onFocus={e => e.target.style.borderColor = C.accent}
          onBlur={e => e.target.style.borderColor = C.border}
        />
        <button onClick={handleSaveSnapshot} style={{
          width: "100%", padding: "8px 0", cursor: "pointer", borderRadius: 6,
          fontFamily: "'Alegreya Sans', sans-serif", fontSize: 14, fontWeight: 600,
          background: snapshotSaved ? C.success + "20" : C.accentBg,
          border: `1px solid ${snapshotSaved ? C.success : C.accent}`,
          color: snapshotSaved ? C.success : C.accent,
          transition: "all 0.2s",
        }}>
          {snapshotSaved ? "✓ Saved to Your Worlds" : "Save Snapshot"}
        </button>
      </div>

      {/* Checkpoints */}
      <SectionLabel>Checkpoints</SectionLabel>
      <div style={{
        background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 8,
        padding: 16,
      }}>
        <div style={{ fontFamily: "'Alegreya Sans', sans-serif", fontSize: 13, color: C.muted, marginBottom: 12 }}>
          Quick-save up to 3 slots within this session. Save, load, or overwrite at any time.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {checkpoints.map(cp => (
            <div key={cp.slot} style={{
              padding: "10px 12px", borderRadius: 6,
              border: `1px solid ${cp.saved ? C.cardBorder : C.borderLight}`,
              background: cp.saved ? C.resolutionBg : "transparent",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: cp.saved ? 8 : 0 }}>
                {editingSlot === cp.slot ? (
                  <input
                    type="text" value={editText} onChange={e => setEditText(e.target.value)}
                    onBlur={finishEditing}
                    onKeyDown={e => { if (e.key === "Enter") finishEditing(); }}
                    autoFocus
                    style={{
                      flex: 1, padding: "4px 8px", marginRight: 8,
                      background: C.inputBg, border: `1px solid ${C.accent}`, borderRadius: 4,
                      fontFamily: "'Alegreya Sans', sans-serif", fontSize: 13, color: C.text, outline: "none",
                    }}
                  />
                ) : (
                  <div style={{
                    fontFamily: "'Alegreya Sans', sans-serif", fontSize: 13,
                    color: cp.saved ? C.heading : C.dim,
                    fontWeight: cp.saved ? 500 : 400,
                    cursor: cp.saved ? "pointer" : "default",
                    flex: 1,
                  }}
                    onClick={() => { if (cp.saved) startEditing(cp); }}
                    title={cp.saved ? "Click to rename" : ""}
                  >
                    {cp.saved ? cp.label : `Slot ${cp.slot} — Empty`}
                    {cp.saved && (
                      <span style={{ fontSize: 10, color: C.dim, marginLeft: 6 }}>✎</span>
                    )}
                  </div>
                )}

                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  {cp.saved && (
                    <>
                      <button onClick={() => handleLoadCheckpoint(cp.slot)} style={{
                        padding: "4px 10px", cursor: "pointer", borderRadius: 4,
                        fontFamily: "'Alegreya Sans', sans-serif", fontSize: 12,
                        background: loadedSlot === cp.slot ? C.success + "20" : "transparent",
                        border: `1px solid ${loadedSlot === cp.slot ? C.success : C.border}`,
                        color: loadedSlot === cp.slot ? C.success : C.muted,
                        transition: "all 0.2s",
                      }}>
                        {loadedSlot === cp.slot ? "✓" : "Load"}
                      </button>
                      <button onClick={() => handleClearCheckpoint(cp.slot)} style={{
                        padding: "4px 10px", cursor: "pointer", borderRadius: 4,
                        fontFamily: "'Alegreya Sans', sans-serif", fontSize: 12,
                        background: "transparent", border: `1px solid ${C.borderLight}`,
                        color: C.dim, transition: "all 0.2s",
                      }}>Clear</button>
                    </>
                  )}
                  {!cp.saved && (
                    <button onClick={() => handleSaveCheckpoint(cp.slot)} style={{
                      padding: "4px 14px", cursor: "pointer", borderRadius: 4,
                      fontFamily: "'Alegreya Sans', sans-serif", fontSize: 12, fontWeight: 600,
                      background: C.accentBg, border: `1px solid ${C.accent}`,
                      color: C.accent, transition: "all 0.2s",
                    }}>Save</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- MAIN SETTINGS PANEL ---
export default function SettingsPanel() {
  const [activeTab, setActiveTab] = useState("game");
  const [isOpen, setIsOpen] = useState(true);

  const TABS = [
    { id: "game", label: "Game Settings" },
    { id: "display", label: "Display" },
    { id: "world", label: "World" },
  ];

  if (!isOpen) {
    return (
      <div style={{
        minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Alegreya Sans', sans-serif",
      }}>
        <style>{fonts}</style>
        <button onClick={() => setIsOpen(true)} style={{
          padding: "12px 24px", cursor: "pointer", borderRadius: 8,
          fontFamily: "'Cinzel', serif", fontSize: 14, fontWeight: 700,
          background: C.accentBg, border: `1px solid ${C.accent}`,
          color: C.accent, letterSpacing: "0.06em",
        }}>
          Open Settings Panel
        </button>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", background: C.bg,
      fontFamily: "'Alegreya Sans', sans-serif", color: C.text,
    }}>
      <style>{fonts}{`
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px; height: 16px; border-radius: 50%;
          background: ${C.accent}; border: 2px solid ${C.bg};
          cursor: pointer; margin-top: -6px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.4);
        }
        input[type=range]::-moz-range-thumb {
          width: 16px; height: 16px; border-radius: 50%;
          background: ${C.accent}; border: 2px solid ${C.bg};
          cursor: pointer;
          box-shadow: 0 1px 4px rgba(0,0,0,0.4);
        }
        input[type=range]::-webkit-slider-runnable-track {
          height: 4px; background: transparent; border-radius: 2px;
        }
        input[type=range]::-moz-range-track {
          height: 4px; background: transparent; border-radius: 2px;
        }
      `}</style>

      {/* Simulated top bar */}
      <div style={{
        height: 44, background: C.cardBg, borderBottom: `1px solid ${C.borderLight}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 16px",
      }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: 20, fontWeight: 900, color: C.accent, letterSpacing: "0.06em" }}>CRUCIBLE</span>
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: 12, fontWeight: 600, color: C.goldLabel, letterSpacing: "0.06em" }}>RPG</span>
          <span style={{ color: C.border, margin: "0 8px" }}>|</span>
          <span style={{ fontFamily: "'Alegreya Sans', sans-serif", fontSize: 14, color: C.dim }}>The Dockside Conspiracy</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Sidebar toggle (hamburger) */}
          <button style={{
            background: "none", border: `1px solid ${C.border}`, borderRadius: 4,
            color: C.muted, cursor: "pointer", padding: "4px 7px", display: "flex", alignItems: "center",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="15" y1="3" x2="15" y2="21" />
            </svg>
          </button>
          {/* Gear — opens this panel */}
          <button onClick={() => setIsOpen(!isOpen)} style={{
            width: 28, height: 28, borderRadius: "50%", background: C.panelBg,
            border: `1px solid ${C.accent}`, display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Modal overlay */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 200,
        display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 56,
      }} onClick={() => setIsOpen(false)}>
        <div style={{ position: "absolute", inset: 0, background: C.overlay }} />

        {/* Panel */}
        <div onClick={e => e.stopPropagation()} style={{
          background: C.panelBg, border: `1px solid ${C.border}`, borderRadius: 12,
          width: 520, maxWidth: "95vw", maxHeight: "calc(100vh - 80px)",
          position: "relative", zIndex: 1, display: "flex", flexDirection: "column",
          boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
        }}>
          {/* Tab bar */}
          <div style={{
            display: "flex", borderBottom: `1px solid ${C.border}`,
            padding: "0 20px", flexShrink: 0,
          }}>
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                padding: "14px 16px", cursor: "pointer", background: "none", border: "none",
                fontFamily: "'Cinzel', serif", fontSize: 12, fontWeight: activeTab === tab.id ? 700 : 500,
                color: activeTab === tab.id ? C.accent : C.dim,
                borderBottom: activeTab === tab.id ? `2px solid ${C.accent}` : "2px solid transparent",
                letterSpacing: "0.06em", transition: "all 0.2s",
              }}>
                {tab.label}
              </button>
            ))}
            {/* Close button */}
            <div style={{ flex: 1 }} />
            <button onClick={() => setIsOpen(false)} style={{
              background: "none", border: "none", color: C.dim, cursor: "pointer",
              fontSize: 18, padding: "14px 4px", lineHeight: 1,
            }}>✕</button>
          </div>

          {/* Tab content */}
          <div style={{
            overflowY: "auto", padding: "0 24px 24px",
            flex: 1,
          }}>
            {activeTab === "game" && <GameSettingsTab />}
            {activeTab === "display" && <DisplayTab />}
            {activeTab === "world" && <WorldTab />}
          </div>
        </div>
      </div>
    </div>
  );
}
