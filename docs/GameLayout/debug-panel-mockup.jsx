import { useState } from "react";

const fonts = `@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Alegreya+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');`;

// --- DESIGN SYSTEM COLORS ---
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
  cardBorder: "#3a3328",
  overlay: "rgba(0,0,0,0.6)",
};

// --- SAMPLE DATA ---

const SAMPLE_DICE_MATH = {
  category: "OUTMATCHED",
  reason: "WIS 8.3 vs DC Base 16.0, gap < 5 → Matched. But CON penalty active → recategorized Outmatched.",
  stat: { name: "WIS", emoji: "👁️", base: 9.8, effective: 8.3, penalty: -1.5, source: "Bruised Ribs" },
  skill: { name: "Streetwise", value: 1.0 },
  equipment: null,
  crucibleRoll: { value: 7, extreme: false },
  mortalDice: { die1: 14, die2: 8, kept: 14, rule: "keep highest (Outmatched)" },
  formula: "8.3 (WIS) + 1.0 (Streetwise) + 14 (die) = 23.3",
  dc: { base: 16.0, offset: 0, final: 16.0, source: "Professional DC, Standard difficulty" },
  margin: 7.3,
  tier: { number: 2, label: "Clean Success" },
  debt: null,
};

const SAMPLE_STATE_DIFF = [
  { type: "condition_escalated", field: "Conditions", before: "Cracked Ribs (-1.0 CON)", after: "Bruised Ribs (-1.5 CON)", delta: "-0.5 CON" },
  { type: "condition_cleared", field: "Conditions", before: "Rattled (-1.0 WIS)", after: "Cleared", delta: "+1.0 WIS" },
  { type: "inventory_lost", field: "Inventory", before: "Hooded Lantern (Readiness: ⚠️)", after: "Hooded Lantern (Readiness: Broken)", delta: null },
  { type: "skill_gained", field: "Skills", before: "Streetwise 1.0", after: "Streetwise 1.1", delta: "+0.1" },
  { type: "npc_introduced", field: "NPCs", before: null, after: "Pol (dockhand, nervous, wiry)", delta: "New" },
  { type: "faction_discovered", field: "Factions", before: null, after: "Veymar (criminal organization)", delta: "New" },
  { type: "glossary_added", field: "Glossary", before: null, after: "Double-crescent seal", delta: "New" },
  { type: "glossary_added", field: "Glossary", before: null, after: "Midnight cargo shipments", delta: "New" },
];

const SAMPLE_MANIFEST = {
  budget: { total: 7000, used: 6247, systemPrompt: 6462 },
  sceneComplexity: false,
  layers: {
    L1: {
      label: "Game State",
      total: 2840,
      sections: [
        { name: "Character stats", tokens: 320 },
        { name: "Active conditions", tokens: 180 },
        { name: "Inventory summary", tokens: 410 },
        { name: "Skills & abilities", tokens: 240 },
        { name: "Active quests / objectives", tokens: 350 },
        { name: "Faction standings + morale", tokens: 190 },
        { name: "Companion", tokens: 0 },
        { name: "Stealth state", tokens: 0 },
        { name: "Gold / currency", tokens: 45 },
        { name: "Extended task progress", tokens: 0 },
        { name: "Environmental obstacles", tokens: 85 },
        { name: "Location + time + weather", tokens: 220 },
        { name: "Discovered knowledge", tokens: 0 },
        { name: "Introduced NPCs (scene)", tokens: 800 },
      ],
    },
    L2: {
      label: "Recent Narrative",
      total: 1890,
      sections: [
        { name: "Turn 47 narrative", tokens: 980 },
        { name: "Turn 46 narrative", tokens: 620 },
        { name: "Turn 45 narrative (trimmed)", tokens: 290 },
      ],
    },
    L3: {
      label: "Chronicle Summaries",
      total: 740,
      sections: [
        { name: "Chronicle event 1: Arrived in Port Veylan", tokens: 185 },
        { name: "Chronicle event 2: Investigated warehouse district", tokens: 210 },
        { name: "Chronicle event 3: Confronted dockmaster", tokens: 175 },
        { name: "Chronicle event 4: Discovered Veymar connection", tokens: 170 },
      ],
    },
    L4: {
      label: "Triggered Retrieval",
      total: 777,
      triggers: [
        { type: "npc_reencounter", entity: "Pol", tokens: 320 },
        { type: "faction_proximity", entity: "Veymar", tokens: 280 },
        { type: "location_return", entity: "The Rusted Lantern", tokens: 177 },
      ],
    },
  },
};

const SAMPLE_TOKENS = {
  thisTurn: {
    promptTokens: 12709,
    completionTokens: 847,
    totalTokens: 13556,
    model: "claude-sonnet-4-20250514",
    cachedPromptTokens: 6462,
    estimatedCost: 0.0089,
  },
  session: {
    turns: 48,
    totalPromptTokens: 584320,
    totalCompletionTokens: 38400,
    totalTokens: 622720,
    totalCost: 0.42,
    avgTokensPerTurn: 12973,
    avgCostPerTurn: 0.0088,
  },
  contextWindow: {
    max: 200000,
    used: 12709,
  },
};

const SAMPLE_SERVER_JSON = {
  request: `{
  "model": "claude-sonnet-4-20250514",
  "max_tokens": 7000,
  "system": [{ "type": "text", "text": "[6462 tokens — system prompt]", "cache_control": { "type": "ephemeral" } }],
  "messages": [
    { "role": "user", "content": "[Context manifest: 6247 tokens]\\n\\nPlayer chose option B: Listen to the dockhands' conversation from your table." }
  ]
}`,
  response: `{
  "id": "msg_01X7kP...",
  "type": "message",
  "role": "assistant",
  "content": [{ "type": "text", "text": "[847 tokens — narrative + stateChanges + options]" }],
  "model": "claude-sonnet-4-20250514",
  "usage": {
    "input_tokens": 12709,
    "output_tokens": 847,
    "cache_creation_input_tokens": 0,
    "cache_read_input_tokens": 6462
  }
}`,
};

const SAMPLE_AI_PROMPT = {
  systemPrompt: `[SYSTEM PROMPT — 6462 tokens, 15 sections]

Section 1: Core Identity
You are the Game Master for a solo litRPG. You narrate, adjudicate, and manage the world...

Section 2: Storyteller Voice — Chronicler
"Report what happens. One detail per sentence. Choose the detail a witness would remember in court..."

Section 3: Response Format
You must respond with valid JSON containing: narrative (array of text segments), stateChanges (array), options (array of A/B/C/D)...

[... 12 more sections: Combat, Conditions, Inventory, Economy, NPCs, Factions, Quests, Stealth, Companions, Traps, Knowledge, Crafting ...]`,
  userMessage: `[CONTEXT MANIFEST — 6247 tokens]

=== LAYER 1: GAME STATE ===
Character: Kael Ashford (Former Investigator)
STR 6.5 | DEX 8.2 | CON 5.5 (7.0 base, -1.5 Bruised Ribs) | INT 11.3 | WIS 8.8 (9.8 base, -1.0 Rattled) | CHA 7.4
Skills: Streetwise 1.0, Lockpicking 1.0, Blade Work 1.0, Persuasion 0.4, Appraisal 0.3
Location: The Rusted Lantern, Dockside Quarter | Time: 9:42 PM | Weather: Drizzle
[... inventory, conditions, quests, factions ...]

=== LAYER 2: RECENT NARRATIVE ===
Turn 47: [opening scene narrative]
Turn 46: [previous scene]
[...]

=== LAYER 3: CHRONICLE ===
[4 major events summarized]

=== LAYER 4: TRIGGERED RETRIEVAL ===
[NPC: Pol — first encounter data]
[Faction: Veymar — known info]
[Location: The Rusted Lantern — return visit]

---
Player chose option B: Listen to the dockhands' conversation from your table.
Action classification: { primaryStat: "WIS", secondaryStat: null, skill: "Streetwise", actionType: "social_passive" }
Resolution: OUTMATCHED, Crucible Roll 7, Mortal Dice [14, 8] → kept 14. Total 23.3 vs DC 16.0. Margin +7.3 → Tier 2.`,
  aiResponse: `{
  "narrative": [
    { "text": "You lean back, letting the chair tilt against the wall..." },
    { "text": "\\n\\n\\"...third one this month. Cargo manifest says grain and timber..." },
    { "text": "Pol", "entity": { "id": "pol", "type": "NPC" } },
    { "text": ". That's " },
    { "text": "Veymar", "entity": { "id": "veymar", "type": "Faction" } },
    { "text": " business.\\"" },
    { "text": "\\n\\nThe third says nothing. He's watching the door." },
    { "text": "\\n\\nYour ale is warm. The fire pops..." }
  ],
  "stateChanges": [
    { "type": "condition_escalated", "label": "Cracked Ribs → Bruised Ribs", "stat": "CON", "detail": "-0.5 CON" },
    { "type": "condition_cleared", "label": "Rattled cleared", "stat": "WIS", "detail": "+1.0 WIS" },
    { "type": "inventory_lost", "label": "Hooded Lantern damaged", "detail": "Readiness: Broken" },
    { "type": "skill_gained", "label": "Streetwise improved", "detail": "+0.1 (now 1.1)" }
  ],
  "options": [
    { "key": "B", "text": "Slip out and head to the harbor to find the ship with the double-crescent seal." },
    { "key": "C", "text": "Order another round for the dockhands' table — let them come to you." }
  ]
}`,
};


// --- HELPER: Budget bar ---
function BudgetBar({ used, total, label, color }) {
  const pct = Math.min((used / total) * 100, 100);
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontFamily: "'Alegreya Sans', sans-serif", fontSize: 12, color: C.muted }}>{label}</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.secondary }}>
          {used.toLocaleString()} / {total.toLocaleString()} ({pct.toFixed(1)}%)
        </span>
      </div>
      <div style={{ height: 6, background: C.cardBg, borderRadius: 3, border: `1px solid ${C.borderLight}`, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`, borderRadius: 3,
          background: pct > 90 ? C.danger : pct > 70 ? C.warning : (color || C.accent),
          transition: "width 0.3s",
        }} />
      </div>
    </div>
  );
}

// --- HELPER: Code block ---
function CodeBlock({ content, maxHeight }) {
  return (
    <pre style={{
      background: C.bg, border: `1px solid ${C.borderLight}`, borderRadius: 6,
      padding: "12px 14px", fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5,
      color: C.secondary, lineHeight: 1.6, overflow: "auto",
      maxHeight: maxHeight || 400, whiteSpace: "pre-wrap", wordBreak: "break-word",
      margin: 0,
    }}>
      {content}
    </pre>
  );
}

// --- HELPER: Section header inside tabs ---
function TabSection({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 600,
        color: C.goldLabel, letterSpacing: "0.1em", textTransform: "uppercase",
        marginBottom: 10, paddingBottom: 6, borderBottom: `1px solid ${C.borderLight}`,
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

// --- HELPER: Key-value row ---
function KVRow({ label, value, color, mono }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
      <span style={{ fontFamily: "'Alegreya Sans', sans-serif", fontSize: 13, color: C.muted }}>{label}</span>
      <span style={{
        fontFamily: mono ? "'JetBrains Mono', monospace" : "'Alegreya Sans', sans-serif",
        fontSize: 13, color: color || C.text, fontWeight: 500,
      }}>{value}</span>
    </div>
  );
}


// === TAB 1: DICE MATH ===
function DiceMathTab() {
  const d = SAMPLE_DICE_MATH;
  return (
    <div>
      <TabSection title="Fortune's Balance">
        <div style={{
          display: "inline-block", padding: "4px 12px", borderRadius: 4,
          background: "#2a2010", border: "1px solid #564b2e",
          fontFamily: "'Cinzel', serif", fontSize: 12, fontWeight: 700,
          color: C.accent, letterSpacing: "0.08em", marginBottom: 8,
        }}>
          {d.category}
        </div>
        <div style={{ fontFamily: "'Alegreya Sans', sans-serif", fontSize: 12, color: C.dim, marginTop: 4 }}>
          {d.reason}
        </div>
      </TabSection>

      <TabSection title="Inputs">
        <KVRow label="Primary Stat" value={`${d.stat.emoji} ${d.stat.name} ${d.stat.effective} (base ${d.stat.base}, ${d.stat.penalty} ${d.stat.source})`} mono />
        <KVRow label="Skill" value={`${d.skill.name} +${d.skill.value}`} mono />
        <KVRow label="Equipment" value={d.equipment || "None"} mono />
      </TabSection>

      <TabSection title="Rolls">
        <KVRow label="Crucible Roll" value={`d20(${d.crucibleRoll.value}) — ${d.crucibleRoll.extreme ? "EXTREME" : "No Effect"}`} mono />
        <KVRow label="Mortal Dice" value={`[${d.mortalDice.die1}, ${d.mortalDice.die2}] → kept ${d.mortalDice.kept}`} mono />
        <KVRow label="Rule" value={d.mortalDice.rule} />
      </TabSection>

      <TabSection title="Resolution">
        <div style={{
          background: C.resolutionBg, border: `1px solid ${C.borderLight}`, borderRadius: 6,
          padding: "12px 14px", fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
          lineHeight: 1.8,
        }}>
          <div style={{ color: C.secondary }}>{d.formula}</div>
          <div style={{ color: C.dim }}>vs DC {d.dc.final} ({d.dc.source})</div>
          <div style={{
            color: d.margin >= 0 ? C.success : C.danger, fontWeight: 600, marginTop: 4,
          }}>
            Margin: {d.margin >= 0 ? "+" : ""}{d.margin.toFixed(1)} → Tier {d.tier.number} ({d.tier.label})
          </div>
          {d.debt && (
            <div style={{ color: C.danger, marginTop: 4 }}>
              Debt of Effort: -{d.debt.amount.toFixed(1)} ({d.debt.source})
            </div>
          )}
        </div>
      </TabSection>
    </div>
  );
}


// === TAB 2: STATE DIFF ===
function StateDiffTab() {
  const typeColors = {
    condition_escalated: C.danger,
    condition_cleared: C.success,
    inventory_lost: C.danger,
    skill_gained: C.success,
    npc_introduced: C.accent,
    faction_discovered: C.accent,
    glossary_added: C.muted,
  };

  return (
    <div>
      <TabSection title={`Turn 48 — ${SAMPLE_STATE_DIFF.length} changes`}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {SAMPLE_STATE_DIFF.map((diff, i) => (
            <div key={i} style={{
              display: "grid",
              gridTemplateColumns: "100px 1fr 20px 1fr 70px",
              gap: 10, alignItems: "center",
              padding: "8px 12px", borderRadius: 6,
              background: C.resolutionBg, border: `1px solid ${C.borderLight}`,
              fontFamily: "'Alegreya Sans', sans-serif", fontSize: 13,
            }}>
              <span style={{ color: C.goldLabel, fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>
                {diff.field}
              </span>
              <span style={{ color: diff.before ? C.secondary : C.dim, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
                {diff.before || "—"}
              </span>
              <span style={{ color: C.dim, textAlign: "center" }}>→</span>
              <span style={{ color: typeColors[diff.type] || C.text, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
                {diff.after}
              </span>
              <span style={{
                textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600,
                color: diff.delta === "New" ? C.accent : diff.delta?.startsWith("+") ? C.success : diff.delta?.startsWith("-") ? C.danger : C.dim,
              }}>
                {diff.delta || ""}
              </span>
            </div>
          ))}
        </div>
      </TabSection>

      <div style={{ fontFamily: "'Alegreya Sans', sans-serif", fontSize: 12, color: C.dim, fontStyle: "italic" }}>
        DB writes this turn: 8 (2 conditions, 1 inventory, 1 skill, 2 glossary, 1 NPC, 1 faction)
      </div>
    </div>
  );
}


// === TAB 3: CONTEXT MANIFEST ===
function ManifestTab() {
  const m = SAMPLE_MANIFEST;
  const contextTotal = m.layers.L1.total + m.layers.L2.total + m.layers.L3.total + m.layers.L4.total;

  return (
    <div>
      <TabSection title="Budget Overview">
        <BudgetBar used={contextTotal} total={m.budget.total} label="Context Budget" color={C.accent} />
        <BudgetBar used={m.budget.systemPrompt} total={6500} label="System Prompt" color={C.muted} />
        {m.sceneComplexity && (
          <div style={{
            display: "inline-block", padding: "3px 10px", borderRadius: 4,
            background: "#1e1a12", border: `1px solid ${C.warning}44`,
            fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.warning,
          }}>
            ⚡ Scene Complexity: Budget doubled
          </div>
        )}
      </TabSection>

      {Object.entries(m.layers).map(([key, layer]) => (
        <TabSection key={key} title={`${key}: ${layer.label} — ${layer.total.toLocaleString()} tokens`}>
          {layer.sections && layer.sections.map((sec, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between", padding: "3px 0",
              opacity: sec.tokens === 0 ? 0.4 : 1,
            }}>
              <span style={{ fontFamily: "'Alegreya Sans', sans-serif", fontSize: 12, color: C.secondary }}>
                {sec.name}
              </span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: sec.tokens === 0 ? C.dim : C.text }}>
                {sec.tokens}
              </span>
            </div>
          ))}
          {layer.triggers && layer.triggers.map((trig, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "4px 0",
            }}>
              <div>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                  color: C.accent, background: `${C.accent}15`, padding: "2px 6px",
                  borderRadius: 3, marginRight: 8,
                }}>{trig.type}</span>
                <span style={{ fontFamily: "'Alegreya Sans', sans-serif", fontSize: 12, color: C.secondary }}>
                  {trig.entity}
                </span>
              </div>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.text }}>
                {trig.tokens}
              </span>
            </div>
          ))}
        </TabSection>
      ))}
    </div>
  );
}


// === TAB 4: TOKENS & COST ===
function TokensTab() {
  const t = SAMPLE_TOKENS;
  return (
    <div>
      <TabSection title="This Turn (Turn 48)">
        <KVRow label="Model" value={t.thisTurn.model} mono />
        <KVRow label="Prompt tokens" value={t.thisTurn.promptTokens.toLocaleString()} mono />
        <KVRow label="  └ Cached (system prompt)" value={t.thisTurn.cachedPromptTokens.toLocaleString()} mono color={C.success} />
        <KVRow label="Completion tokens" value={t.thisTurn.completionTokens.toLocaleString()} mono />
        <KVRow label="Total tokens" value={t.thisTurn.totalTokens.toLocaleString()} mono />
        <div style={{ height: 1, background: C.borderLight, margin: "8px 0" }} />
        <KVRow label="Estimated cost" value={`$${t.thisTurn.estimatedCost.toFixed(4)}`} mono color={C.accent} />
      </TabSection>

      <TabSection title="Session Totals (48 turns)">
        <KVRow label="Total prompt tokens" value={t.session.totalPromptTokens.toLocaleString()} mono />
        <KVRow label="Total completion tokens" value={t.session.totalCompletionTokens.toLocaleString()} mono />
        <KVRow label="Total tokens" value={t.session.totalTokens.toLocaleString()} mono />
        <div style={{ height: 1, background: C.borderLight, margin: "8px 0" }} />
        <KVRow label="Total session cost" value={`$${t.session.totalCost.toFixed(2)}`} mono color={C.accent} />
        <KVRow label="Avg tokens/turn" value={t.session.avgTokensPerTurn.toLocaleString()} mono />
        <KVRow label="Avg cost/turn" value={`$${t.session.avgCostPerTurn.toFixed(4)}`} mono />
      </TabSection>

      <TabSection title="Context Window">
        <BudgetBar used={t.contextWindow.used} total={t.contextWindow.max} label="Window utilization" color={C.success} />
      </TabSection>
    </div>
  );
}


// === TAB 5: SERVER JSON ===
function ServerJsonTab() {
  return (
    <div>
      <TabSection title="Request">
        <CodeBlock content={SAMPLE_SERVER_JSON.request} maxHeight={300} />
      </TabSection>
      <TabSection title="Response">
        <CodeBlock content={SAMPLE_SERVER_JSON.response} maxHeight={300} />
      </TabSection>
    </div>
  );
}


// === TAB 6: AI PROMPT/RESPONSE ===
function AiTab() {
  const [expanded, setExpanded] = useState({ system: false, user: true, response: true });
  const toggle = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div>
      <TabSection title="System Prompt (6462 tokens)">
        <button onClick={() => toggle("system")} style={{
          background: "none", border: `1px solid ${C.border}`, borderRadius: 4,
          padding: "6px 12px", cursor: "pointer", marginBottom: 8,
          fontFamily: "'Alegreya Sans', sans-serif", fontSize: 12, color: C.muted,
        }}>
          {expanded.system ? "▼ Collapse" : "▶ Expand"} system prompt
        </button>
        {expanded.system && <CodeBlock content={SAMPLE_AI_PROMPT.systemPrompt} maxHeight={400} />}
      </TabSection>

      <TabSection title="User Message (Context Manifest + Player Action)">
        <button onClick={() => toggle("user")} style={{
          background: "none", border: `1px solid ${C.border}`, borderRadius: 4,
          padding: "6px 12px", cursor: "pointer", marginBottom: 8,
          fontFamily: "'Alegreya Sans', sans-serif", fontSize: 12, color: C.muted,
        }}>
          {expanded.user ? "▼ Collapse" : "▶ Expand"} user message
        </button>
        {expanded.user && <CodeBlock content={SAMPLE_AI_PROMPT.userMessage} maxHeight={400} />}
      </TabSection>

      <TabSection title="AI Response (Raw)">
        <button onClick={() => toggle("response")} style={{
          background: "none", border: `1px solid ${C.border}`, borderRadius: 4,
          padding: "6px 12px", cursor: "pointer", marginBottom: 8,
          fontFamily: "'Alegreya Sans', sans-serif", fontSize: 12, color: C.muted,
        }}>
          {expanded.response ? "▼ Collapse" : "▶ Expand"} AI response
        </button>
        {expanded.response && <CodeBlock content={SAMPLE_AI_PROMPT.aiResponse} maxHeight={400} />}
      </TabSection>
    </div>
  );
}


// === MAIN DEBUG PANEL ===
const TABS = [
  { id: "dice", label: "Dice Math" },
  { id: "state", label: "State Diff" },
  { id: "manifest", label: "Context Manifest" },
  { id: "tokens", label: "Tokens & Cost" },
  { id: "json", label: "Server JSON" },
  { id: "ai", label: "AI Prompt/Response" },
];

export default function DebugPanel() {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("dice");
  const [selectedTurn, setSelectedTurn] = useState(48);
  const [copied, setCopied] = useState(false);

  const handleExport = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      minHeight: "100vh", background: C.bg, fontFamily: "'Alegreya Sans', sans-serif", color: C.text,
      display: "flex", flexDirection: "column",
    }}>
      <style>{fonts}</style>

      {/* Simulated game area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Top bar */}
        <div style={{
          height: 44, background: C.cardBg, borderBottom: `1px solid ${C.borderLight}`,
          display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px",
        }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: 20, fontWeight: 900, color: C.accent, letterSpacing: "0.06em" }}>CRUCIBLE</span>
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: 12, fontWeight: 600, color: C.goldLabel, letterSpacing: "0.06em" }}>RPG</span>
            <span style={{ color: C.border, margin: "0 8px" }}>|</span>
            <span style={{ fontSize: 14, color: C.dim }}>The Dockside Conspiracy</span>
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <div style={{
              padding: "3px 10px", borderRadius: 4,
              background: "#1a1210", border: `1px solid ${C.danger}44`,
              fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.danger,
            }}>
              DEBUG
            </div>
          </div>
        </div>

        {/* Placeholder game content */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
          <div style={{ textAlign: "center", color: C.dim }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 16, color: C.secondary, marginBottom: 8 }}>Game Layout Area</div>
            <div style={{ fontSize: 13 }}>Narrative panel, sidebar, and turn timeline would be here.</div>
            <div style={{ fontSize: 12, marginTop: 8, color: C.dim }}>Debug panel is the full-width drawer below ↓</div>
          </div>
        </div>
      </div>

      {/* Debug drawer */}
      <div style={{
        borderTop: `2px solid ${C.danger}44`,
        background: C.panelBg,
        transition: "max-height 0.3s",
        maxHeight: isOpen ? 600 : 36,
        overflow: "hidden",
      }}>
        {/* Drawer handle */}
        <div
          onClick={() => setIsOpen(!isOpen)}
          style={{
            height: 36, display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0 16px", cursor: "pointer",
            background: C.cardBg, borderBottom: isOpen ? `1px solid ${C.borderLight}` : "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600,
              color: C.danger, letterSpacing: "0.08em",
            }}>
              {isOpen ? "▼" : "▲"} DEBUG PANEL
            </span>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.dim,
            }}>
              Turn {selectedTurn} / 48
            </span>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.muted,
            }}>
              — {SAMPLE_TOKENS.thisTurn.totalTokens.toLocaleString()} tokens, ${SAMPLE_TOKENS.thisTurn.estimatedCost.toFixed(4)}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Turn selector */}
            <select value={selectedTurn} onChange={e => setSelectedTurn(parseInt(e.target.value))}
              onClick={e => e.stopPropagation()}
              style={{
                background: C.bg, border: `1px solid ${C.border}`, borderRadius: 4,
                padding: "2px 8px", fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
                color: C.secondary, outline: "none", cursor: "pointer",
              }}
            >
              {Array.from({ length: 48 }, (_, i) => (
                <option key={i + 1} value={i + 1}>Turn {i + 1}</option>
              ))}
            </select>
            {/* Export */}
            <button onClick={(e) => { e.stopPropagation(); handleExport(); }} style={{
              background: "none", border: `1px solid ${C.border}`, borderRadius: 4,
              padding: "2px 10px", cursor: "pointer",
              fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
              color: copied ? C.success : C.muted,
              transition: "color 0.2s",
            }}>
              {copied ? "✓ Copied" : "Export Session"}
            </button>
          </div>
        </div>

        {/* Tab bar + content */}
        {isOpen && (
          <div style={{ display: "flex", flexDirection: "column", height: "calc(100% - 36px)" }}>
            {/* Tabs */}
            <div style={{
              display: "flex", gap: 0, padding: "0 16px",
              borderBottom: `1px solid ${C.borderLight}`, flexShrink: 0,
            }}>
              {TABS.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                  padding: "10px 14px", cursor: "pointer", background: "none", border: "none",
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: activeTab === tab.id ? 600 : 400,
                  color: activeTab === tab.id ? C.accent : C.dim,
                  borderBottom: activeTab === tab.id ? `2px solid ${C.accent}` : "2px solid transparent",
                  transition: "all 0.15s",
                }}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div style={{
              flex: 1, overflowY: "auto", padding: "16px 20px",
            }}>
              {activeTab === "dice" && <DiceMathTab />}
              {activeTab === "state" && <StateDiffTab />}
              {activeTab === "manifest" && <ManifestTab />}
              {activeTab === "tokens" && <TokensTab />}
              {activeTab === "json" && <ServerJsonTab />}
              {activeTab === "ai" && <AiTab />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
