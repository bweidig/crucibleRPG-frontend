import { useState, useEffect } from "react";

const fonts = `@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
@import url('https://fonts.cdnfonts.com/css/lexie-readable');`;

// SVG Tab Icons
const TabIcons = {
  character: (color) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  ),
  inventory: (color) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  ),
  npcs: (color) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  glossary: (color) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  map: (color) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  ),
  notes: (color) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="12" y2="17" />
    </svg>
  ),
};

// SVG Top Bar Icons
const BarIcons = {
  timer: (color) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  talkAI: (color) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  settings: (color) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  sidebar: (color) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="15" y1="3" x2="15" y2="21" />
    </svg>
  ),
  menu: (color) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  bug: (color) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="6" width="8" height="14" rx="4" /><path d="M19 10h2" /><path d="M3 10h2" />
      <path d="M19 14h2" /><path d="M3 14h2" /><path d="M19 18h2" /><path d="M3 18h2" />
      <path d="M16 2l-2 4" /><path d="M8 2l2 4" />
    </svg>
  ),
  lightbulb: (color) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6" /><path d="M10 22h4" />
      <path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />
    </svg>
  ),
};

// --- DATA ---
const SAMPLE_NARRATIVE = [
  {
    turn: 1, total: 47,
    location: "The Rusted Lantern, Dockside Quarter",
    time: "9:42 PM", weather: "Drizzle", timeEmoji: "🌙", weatherEmoji: "🌧️",
    resolution: null, bookmarked: false,
    narrative: [
      { text: "The common room smells of salt and old tallow. A fire gutters in the stone hearth, throwing long shadows across the warped floorboards. Three dockhands hunch over ale near the bar. Behind the counter, a heavyset woman with burn scars along her forearms wipes a tankard without looking up." },
      { text: "\n\nYour table is near the back wall. The chair creaks under you. Through the rain-streaked window, lantern-light from the harbor catches the masts of merchant vessels rocking at anchor." },
    ],
    diceRoll: null, // Turn 1: opening scene, no check
    statusChanges: [],
    options: [
      { key: "A", text: "Approach the barkeep and ask about the ship that arrived this morning." },
      { key: "B", text: "Listen to the dockhands' conversation from your table." },
      { key: "C", text: "Finish your drink and step outside to watch the harbor directly." },
    ],
  },
  {
    turn: 2, total: 48,
    location: "The Rusted Lantern, Dockside Quarter",
    time: "9:45 PM", timeEmoji: "🌙", weather: "Drizzle", weatherEmoji: "🌧️",
    bookmarked: true,
    diceRoll: {
      category: "MATCHED",
      crucible: null,
      mortal: null,
      die: 14,
      kept: 14,
      extreme: null,
      debt: null,
    },
    resolution: {
      type: "compressed",
      text: "⚔️ Listen (Eavesdrop) | WIS 8.3 + Streetwise 1.0 + d20(14) = 23.3 vs DC 16.0 | +7.3: Success",
      details: {
        action: "Listen (Eavesdrop)",
        stat: "👁️ WIS (8.3)",
        skill: "Streetwise (+1.0)",
        equipment: "None",
        fortuneBalance: "Matched (1d20) — Your WIS 8.3 vs DC Base 16.0, gap < 5",
        crucibleRoll: "d20(7) — No Effect",
        d20Roll: "14",
        dc: "16.0 (Professional DC, Standard difficulty +0)",
        total: "8.3 + 1.0 + 14 = 23.3",
        result: "+7.3: Success (Tier 2)",
        debtOfEffort: "None — no consecutive WIS check",
      },
    },
    narrative: [
      { text: "You lean back, letting the chair tilt against the wall, and half-close your eyes. The dockhands' voices sharpen out of the ambient noise." },
      { text: "\n\n\"...third one this month. Cargo manifest says grain and timber, but I watched 'em unload past midnight. Crates marked with that double-crescent seal.\" The speaker is the youngest of the three — wiry, nervous hands." },
      { text: "\n\nThe older man beside him grunts. \"You shut your mouth about the crescents, " },
      { text: "Pol", entity: { id: "pol", type: "NPC" } },
      { text: ". That's " },
      { text: "Veymar", entity: { id: "veymar", type: "Faction" } },
      { text: " business.\"" },
      { text: "\n\nThe third says nothing. He's watching the door." },
      { text: "\n\nYour ale is warm. The fire pops. Outside, a harbor bell rings twice — the tide signal." },
    ],
    statusChanges: [
      { type: "condition_escalated", label: "Cracked Ribs → Bruised Ribs", detail: "-0.5 CON", stat: "CON", entityId: "bruised ribs", entityType: "Condition" },
      { type: "condition_cleared", label: "Rattled cleared", detail: "+1.0 WIS", stat: "WIS", entityId: "rattled", entityType: "Condition" },
      { type: "inventory_lost", label: "Hooded Lantern damaged", detail: "Readiness: ⚠️ → Broken", entityId: "hooded lantern", entityType: "Item" },
      { type: "skill_gained", label: "Streetwise improved", detail: "+0.1 (now 1.1)", entityId: "streetwise", entityType: "Skill" },
    ],
    options: [
      { key: "B", text: "Slip out and head to the harbor to find the ship with the double-crescent seal." },
      { key: "C", text: "Order another round for the dockhands' table — let them come to you." },
    ],
  },
];

const SAMPLE_CHARACTER = {
  name: "Kael Ashford",
  title: "Former Investigator · Dockside Quarter",
  stats: [
    { name: "STR", emoji: "💪", base: 6.5, effective: 6.5 },
    { name: "DEX", emoji: "🏃", base: 8.2, effective: 8.2 },
    { name: "CON", emoji: "🛡️", base: 7.0, effective: 5.5 },
    { name: "INT", emoji: "🧠", base: 11.3, effective: 11.3 },
    { name: "WIS", emoji: "👁️", base: 9.8, effective: 8.8 },
    { name: "CHA", emoji: "🎭", base: 7.4, effective: 7.4 },
  ],
  skills: [
    { name: "Streetwise", emoji: "🗺️", value: 1.0 },
    { name: "Lockpicking", emoji: "🔓", value: 1.0 },
    { name: "Persuasion", emoji: "🗣️", value: 0.4 },
    { name: "Blade Work", emoji: "⚔️", value: 1.0 },
    { name: "Appraisal", emoji: "💎", value: 0.3 },
  ],
  abilities: [
    { name: "Shadow Step", emoji: "🌑", effect: "Enhanced stealth", strain: "-0.5 DEX" },
  ],
  conditions: [
    { name: "Bruised Ribs", penalty: "-1.5", stat: "CON", duration: "Until Triage", escalation: "Fracture after 48h" },
    { name: "Rattled", penalty: "-1.0", stat: "WIS", duration: "Until Long Rest", escalation: "None" },
  ],
  inventory: {
    current: 9.5, max: 11.5, rations: 3, water: 2, coins: 14,
    items: [
      { name: "Worn Leather Jacket", quality: "Common", durability: 10, maxDurability: 16, slots: 1.5, tag: "+0.0 Armor" },
      { name: "Belt Knife", quality: "Common", durability: 14, maxDurability: 16, slots: 0.5, tag: "+0.5 Melee" },
      { name: "Lockpick Set", quality: "Common", durability: 16, maxDurability: 16, slots: 0.5, tag: null },
      { name: "Rope (30ft)", quality: "Common", durability: 16, maxDurability: 16, slots: 1.0, tag: null },
      { name: "Hooded Lantern", quality: "Common", durability: 4, maxDurability: 16, slots: 1.0, tag: null },
      { name: "Strange Amulet", quality: "Superior", durability: 20, maxDurability: 20, slots: 0.1, tag: "Unidentified" },
      { name: "Journal & Charcoal", quality: "Rough", durability: 8, maxDurability: 12, slots: 0.5, tag: null },
      { name: "Dried Meat Bundle", quality: "Common", durability: 16, maxDurability: 16, slots: 1.0, tag: "3x Rations" },
      { name: "Waterskin", quality: "Common", durability: 16, maxDurability: 16, slots: 0.5, tag: "2x Water" },
      { name: "Coin Purse", quality: "Common", durability: 16, maxDurability: 16, slots: 0.0, tag: "14 🪙" },
    ],
  },
};

const SAMPLE_GLOSSARY = [
  { term: "Veymar", category: "Faction", definition: "A merchant consortium operating in the Dockside Quarter. Identified by a double-crescent seal on their cargo." },
  { term: "The Rusted Lantern", category: "Location", definition: "A dockside tavern frequented by sailors and laborers. Run by a scarred barkeep." },
  { term: "Dockside Quarter", category: "Location", definition: "The harbor district. Warehouses, cheap taverns, and transient labor. Smells of brine and tar." },
  { term: "Double-Crescent Seal", category: "Item", definition: "Marking found on mysterious cargo crates. Associated with Veymar." },
  { term: "Pol", category: "NPC", definition: "Young, wiry dockhand. Nervous. Knows more than he should about the double-crescent shipments." },
  { term: "STR", category: "Stat", definition: "Strength. Physical power and muscular endurance. Melee damage and physical force. Your inventory capacity is based on this." },
  { term: "DEX", category: "Stat", definition: "Dexterity. Coordination, speed, and manual precision. Affects initiative, ranged accuracy, and fine motor tasks." },
  { term: "CON", category: "Stat", definition: "Constitution. Physical fortitude and systemic health. Resistance to disease, exhaustion, and toxins. If this reaches zero, you face a Fate Check." },
  { term: "INT", category: "Stat", definition: "Intelligence. Logical reasoning, memory, and technical capacity. Learning speed and technical crafting." },
  { term: "WIS", category: "Stat", definition: "Wisdom. Intuition, perception, and willpower. Situational awareness and mental resilience." },
  { term: "CHA", category: "Stat", definition: "Charisma. Social influence and presence. Affects merchant interactions and interpersonal encounters." },
  { term: "Streetwise", category: "Skill", definition: "Knowledge of how cities work beneath the surface. Useful for navigating underworld contacts, reading crowds, and knowing which alleys to avoid." },
  { term: "Lockpicking", category: "Skill", definition: "The art of defeating mechanical locks. Requires tools and steady hands." },
  { term: "Persuasion", category: "Skill", definition: "The ability to shift someone's position through words alone. Not deception — honest influence." },
  { term: "Blade Work", category: "Skill", definition: "Competence with short, edged weapons. Knives, daggers, short swords." },
  { term: "Appraisal", category: "Skill", definition: "The ability to assess the value, authenticity, and quality of goods and materials." },
  { term: "Shadow Step", category: "Ability", definition: "A focused technique that enhances stealth at a physical cost. While active, you move with unnatural silence — but the strain wears on your body." },
  { term: "Bruised Ribs", category: "Condition", definition: "A painful injury limiting your physical endurance. Every deep breath reminds you something is wrong. Needs medical attention before it gets worse." },
  { term: "Rattled", category: "Condition", definition: "Your nerves are frayed. Perception dulled, instincts slightly off. Rest will clear it, but until then you're a half-step slower than usual." },
  { term: "Worn Leather Jacket", category: "Item", definition: "A jacket that's seen better days. The leather is cracked at the elbows and the lining is patchy, but it still turns a blade — barely. Won't stop anything serious.", durability: 10, maxDurability: 16, quality: "Common" },
  { term: "Belt Knife", category: "Item", definition: "A short, sturdy blade worn at the hip. Nothing fancy, but it's sharp and quick to draw. The kind of thing everyone carries in the docks.", durability: 14, maxDurability: 16, quality: "Common" },
  { term: "Lockpick Set", category: "Item", definition: "A rolled leather case containing a half-dozen picks and a tension wrench. Well-used but maintained.", durability: 16, maxDurability: 16, quality: "Common" },
  { term: "Rope (30ft)", category: "Item", definition: "Coiled hemp rope. Reliable for climbing, binding, or improvised solutions. Stowed in your pack.", durability: 16, maxDurability: 16, quality: "Common" },
  { term: "Hooded Lantern", category: "Item", definition: "A brass lantern with a directional hood. Needs oil to function — currently dry. The shutter mechanism sticks.", durability: 4, maxDurability: 16, quality: "Common" },
  { term: "Strange Amulet", category: "Item", definition: "A small pendant on a tarnished chain. The metal is unfamiliar and faintly warm to the touch. You haven't been able to identify it yet.", durability: 20, maxDurability: 20, quality: "Superior" },
  { term: "Journal & Charcoal", category: "Item", definition: "A battered leather journal with a charcoal stick tucked in the binding. Half the pages are filled with your notes from past cases.", durability: 8, maxDurability: 12, quality: "Rough" },
  { term: "Harbor Docks", category: "Location", definition: "The working waterfront. Cargo ships, fishing boats, and the occasional vessel that arrives unannounced in the dark. Everything smells of salt and pitch." },
  { term: "Warehouse Row", category: "Location", definition: "A stretch of aging stone warehouses along the canal. Most are leased by merchant guilds. Some sit dark and padlocked." },
  { term: "Market Square", category: "Location", definition: "The commercial heart of the lower quarter. Stalls, hawkers, and pickpockets. Busiest at dawn, dangerous after dark." },
  { term: "The Old Gate", category: "Location", definition: "A crumbling stone archway marking the original city boundary. The wall it once belonged to is mostly gone. Beggars camp here." },
];

const SAMPLE_NPCS = [
  { name: "Pol", disposition: "Wary", lastSeen: "Turn 48", relationship: 0.3, notes: "Young dockhand. Knows about Veymar shipments.", playerNote: "" },
  { name: "Barkeep (unnamed)", disposition: "Neutral", lastSeen: "Turn 47", relationship: 0.5, notes: "Heavyset woman, burn scars. Runs The Rusted Lantern.", playerNote: "" },
];

const SAMPLE_MAP_LOCATIONS = [
  { name: "The Rusted Lantern", x: 55, y: 60, current: true, type: "building" },
  { name: "Harbor Docks", x: 70, y: 80, current: false, type: "area" },
  { name: "Warehouse Row", x: 40, y: 75, current: false, type: "area" },
  { name: "Market Square", x: 30, y: 40, current: false, type: "area" },
  { name: "The Old Gate", x: 15, y: 25, current: false, type: "landmark" },
];

// --- COMPONENTS ---

function StatBar({ stat, onClick }) {
  const pct = (stat.effective / 20) * 100;
  const hasCondition = stat.effective < stat.base;
  return (
    <div style={{ marginBottom: 10, cursor: "pointer" }} onClick={() => onClick({ id: stat.name.toLowerCase(), type: "Stat" })}
      title={`Click for details about ${stat.name}`}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
        <span style={{ fontFamily: "inherit", fontSize: "1em", color: "var(--theme-text, #b8a88a)" }}>
          {stat.emoji} {stat.name}
        </span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.05em", color: hasCondition ? "var(--theme-danger, #e8845a)" : "var(--theme-heading, #d4c4a0)", fontWeight: 500 }}>
          {stat.effective.toFixed(1)}
          {hasCondition && <span style={{ color: "var(--theme-text-muted, #948373)", fontSize: 11 }}> / {stat.base.toFixed(1)}</span>}
        </span>
      </div>
      <div style={{ height: 4, background: "var(--theme-border-light, #1a1714)", borderRadius: 2, overflow: "hidden", position: "relative" }}>
        {hasCondition && (
          <div style={{ position: "absolute", height: "100%", width: `${(stat.base / 20) * 100}%`, background: "var(--theme-border, #3a2a1a)", borderRadius: 2 }} />
        )}
        <div style={{
          height: "100%", width: `${pct}%`, position: "relative",
          background: hasCondition ? "linear-gradient(90deg, #e8845a, #c96a3a)" : "linear-gradient(90deg, #907f5e, #b8a88a)",
          borderRadius: 2, transition: "width 0.5s ease",
        }} />
      </div>
    </div>
  );
}

function ConditionBadge({ condition, onClick }) {
  return (
    <div onClick={() => onClick({ id: condition.name.toLowerCase(), type: "Condition" })}
      style={{ background: "var(--theme-bg-input, #1e1510)", border: "1px solid var(--theme-danger, #5a3020)", borderRadius: 6, padding: "7px 10px", marginBottom: 6, cursor: "pointer", transition: "border-color 0.2s" }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "var(--theme-danger, #7a4030)"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "var(--theme-border, #5a3020)"}
    >
      <div style={{ fontFamily: "inherit", fontSize: "1em", fontWeight: 700, color: "var(--theme-danger, #e8845a)" }}>
        ⚠️ {condition.name}: {condition.penalty} {condition.stat}
      </div>
      <div style={{ fontFamily: "inherit", fontSize: "0.85em", color: "var(--theme-text-muted, #a08a5a)", marginTop: 2 }}>
        {condition.duration} {condition.escalation !== "None" ? `· Escalates → ${condition.escalation}` : ""}
      </div>
    </div>
  );
}

function InventoryItem({ item, onClick }) {
  const pct = item.maxDurability > 0 ? (item.durability / item.maxDurability) * 100 : 100;
  const durColor = pct === 0 ? "var(--theme-danger, #8a3a3a)" : pct <= 25 ? "var(--theme-danger, #e85a5a)" : pct <= 50 ? "var(--theme-danger, #e8845a)" : pct <= 75 ? "#e8c45a" : "var(--theme-text-muted, #8a94a8)";
  const broken = item.durability === 0;
  return (
    <div onClick={() => onClick({ id: item.name.toLowerCase(), type: "Item" })}
      style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "6px 8px", borderBottom: "1px solid var(--theme-border-light, #1a1714)", fontSize: "1em", fontFamily: "inherit",
      cursor: "pointer", transition: "background 0.2s",
      opacity: broken ? 0.5 : 1,
    }}
      onMouseEnter={e => e.currentTarget.style.background = "var(--theme-accent-bg, #1a1814)"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
        <span style={{ color: "var(--theme-heading, #d4c4a0)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textDecoration: broken ? "line-through" : "none" }}>{item.name}</span>
        {item.tag && <span style={{ color: "var(--theme-text-dim, #7a8a6a)", fontSize: "0.85em", fontStyle: "italic", flexShrink: 0 }}>({item.tag})</span>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0, marginLeft: 8 }}>
        <span style={{ color: durColor, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600 }}>{item.durability}/{item.maxDurability}</span>
        <span style={{ color: "var(--theme-text-muted, #948373)", fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{item.slots.toFixed(1)}</span>
      </div>
    </div>
  );
}

function GlossaryEntry({ entry, onClick }) {
  return (
    <div style={{ padding: "8px 0", borderBottom: "1px solid var(--theme-border-light, #1a1714)", cursor: "pointer" }}
      onClick={() => onClick({ id: entry.term.toLowerCase(), type: entry.category })}
      onMouseEnter={e => e.currentTarget.style.background = "var(--theme-accent-bg, #161412)"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      <div style={{ marginBottom: 3 }}>
        <span style={{ fontFamily: "'Cinzel', serif", fontSize: "1.2em", color: "var(--theme-heading, #d4c4a0)", fontWeight: 600 }}>{entry.term}</span>
      </div>
      <div style={{ fontFamily: "inherit", fontSize: "1em", color: "var(--theme-text-muted, #948373)", lineHeight: 1.45 }}>{entry.definition}</div>
    </div>
  );
}

function NPCCard({ npc, onClick }) {
  const dispColors = { Friendly: "#7aba7a", Neutral: "var(--theme-text-muted, #907f5e)", Wary: "#e8c45a", Hostile: "#c84a4a" };
  const pct = npc.relationship * 100;
  return (
    <div style={{ padding: "10px 0", borderBottom: "1px solid var(--theme-border-light, #1a1714)", cursor: "pointer" }}
      onClick={() => onClick({ id: npc.name.toLowerCase(), type: "NPC" })}
      onMouseEnter={e => e.currentTarget.style.background = "var(--theme-accent-bg, rgba(201,168,76,0.03))"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span style={{ fontFamily: "'Cinzel', serif", fontSize: "1.2em", color: "var(--theme-heading, #d4c4a0)", fontWeight: 600, transition: "color 0.2s" }}>{npc.name}</span>
        <span style={{
          fontFamily: "inherit", fontSize: "0.85em", color: dispColors[npc.disposition] || "var(--theme-text-muted, #907f5e)",
          background: `${dispColors[npc.disposition] || "#907f5e"}18`, padding: "2px 8px", borderRadius: 3,
        }}>{npc.disposition}</span>
      </div>
      <div style={{ height: 3, background: "var(--theme-border-light, #1a1714)", borderRadius: 2, overflow: "hidden", marginBottom: 4 }}>
        <div style={{
          height: "100%", width: `${pct}%`, borderRadius: 2,
          background: `linear-gradient(90deg, #c84a4a, #e8c45a, #7aba7a)`, backgroundSize: "300% 100%",
          backgroundPosition: `${pct}% 0`,
        }} />
      </div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.85em", color: "var(--theme-text-muted, #948373)", marginTop: 3 }}>Last seen: {npc.lastSeen}</div>
    </div>
  );
}

function MiniMap({ locations, onLocationClick }) {
  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: "4/3", background: "var(--theme-bg, #0e0c0a)", borderRadius: 8, overflow: "hidden", border: "1px solid var(--theme-border, #2a2520)" }}>
      <svg width="100%" height="100%" style={{ position: "absolute", top: 0, left: 0, opacity: 0.08 }}>
        {[20, 40, 60, 80].map(p => (
          <g key={p}>
            <line x1={`${p}%`} y1="0" x2={`${p}%`} y2="100%" stroke="#d4c4a0" strokeWidth="0.5" />
            <line x1="0" y1={`${p}%`} x2="100%" y2={`${p}%`} stroke="#d4c4a0" strokeWidth="0.5" />
          </g>
        ))}
      </svg>
      <svg width="100%" height="100%" style={{ position: "absolute", top: 0, left: 0 }}>
        <line x1="55%" y1="60%" x2="70%" y2="80%" stroke="#3a3020" strokeWidth="1.5" strokeDasharray="4,4" />
        <line x1="55%" y1="60%" x2="40%" y2="75%" stroke="#3a3020" strokeWidth="1.5" strokeDasharray="4,4" />
        <line x1="40%" y1="75%" x2="30%" y2="40%" stroke="#3a3020" strokeWidth="1.5" strokeDasharray="4,4" />
        <line x1="30%" y1="40%" x2="15%" y2="25%" stroke="#3a3020" strokeWidth="1.5" strokeDasharray="4,4" />
      </svg>
      {locations.map((loc, i) => (
        <div key={i} style={{
          position: "absolute", left: `${loc.x}%`, top: `${loc.y}%`, transform: "translate(-50%, -50%)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer",
        }}
          onClick={() => onLocationClick && onLocationClick({ id: loc.name.toLowerCase(), type: "Location" })}
        >          <div style={{
            width: loc.current ? 14 : 9, height: loc.current ? 14 : 9, borderRadius: "50%",
            background: loc.current ? "#e8c45a" : "#948470",
            border: loc.current ? "2px solid #ffd866" : "1px solid #4a4035",
            boxShadow: loc.current ? "0 0 12px #e8c45a66" : "none",
          }} />
          <span style={{
            fontFamily: "inherit", fontSize: 9, color: loc.current ? "#e8c45a" : "#948470",
            whiteSpace: "nowrap", fontWeight: loc.current ? 700 : 400,
          }}>{loc.name}</span>
        </div>
      ))}
    </div>
  );
}

function PanelSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 4 }}>
      <button onClick={() => setOpen(!open)} style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
        background: "transparent", border: "none", borderBottom: "1px solid var(--theme-border-light, #1e1c18)",
        padding: "10px 0", cursor: "pointer",
      }}>
        <span style={{ fontFamily: "'Cinzel', serif", fontSize: "1em", fontWeight: 600, color: "var(--theme-text-muted, #907f5e)", letterSpacing: "0.12em", textTransform: "uppercase" }}>{title}</span>
        <span style={{ color: "var(--theme-text-dim, #948270)", fontSize: "0.85em", transform: open ? "rotate(0)" : "rotate(-90deg)", transition: "transform 0.2s" }}>▼</span>
      </button>
      {open && <div style={{ padding: "10px 0" }}>{children}</div>}
    </div>
  );
}

// X-Ray: inline entity highlighting in narrative
function NarrativeText({ segments, onEntityClick }) {
  return (
    <span>
      {segments.map((seg, i) => {
        if (seg.entity) {
          return (
            <span key={i} onClick={() => onEntityClick(seg.entity)}
              style={{
                color: "inherit",
                cursor: "pointer", transition: "all 0.2s",
                borderBottom: "1px solid transparent",
              }}
              onMouseEnter={e => { e.target.style.borderBottomColor = "var(--theme-accent, #c9a84c)"; e.target.style.color = "var(--theme-heading, #d0c098)"; }}
              onMouseLeave={e => { e.target.style.borderBottomColor = "transparent"; e.target.style.color = "inherit"; }}
            >{seg.text}</span>
          );
        }
        return <span key={i}>{seg.text}</span>;
      })}
    </span>
  );
}

function ResolutionBlock({ resolution }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{
        fontFamily: "var(--body-font, inherit)", fontSize: "0.85em", color: "var(--theme-resolution-text, #8aba7a)",
        background: "var(--theme-resolution-bg, #12140e)", border: "1px solid var(--theme-resolution-border, #2a3a1a)", borderRadius: 6,
        padding: "8px 12px", lineHeight: 1.5,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span>{resolution.text}</span>
        {resolution.details && (
          <button onClick={() => setExpanded(!expanded)} title="Why this roll?"
            style={{
              background: "none", border: "1px solid var(--theme-resolution-border, #2a3a1a)", borderRadius: 4,
              color: "var(--theme-resolution-text, #668954)", fontSize: "0.92em", cursor: "pointer", padding: "2px 7px",
              fontFamily: "inherit", transition: "all 0.2s", flexShrink: 0, marginLeft: 8, opacity: 0.7,
            }}
            onMouseEnter={e => { e.target.style.opacity = "1"; }}
            onMouseLeave={e => { e.target.style.opacity = "0.7"; }}
          >?</button>
        )}
      </div>
      {expanded && resolution.details && (
        <div style={{
          background: "var(--theme-resolution-bg, #0e100c)", border: "1px solid var(--theme-resolution-border, #1e2a14)", borderTop: "none",
          borderRadius: "0 0 6px 6px", padding: "10px 12px",
          fontFamily: "inherit", fontSize: "0.85em", color: "var(--theme-resolution-text, #7a8a6a)", lineHeight: 1.7,
        }}>
          {Object.entries(resolution.details).map(([key, val]) => (
            <div key={key} style={{ display: "flex", gap: 8, marginBottom: 2 }}>
              <span style={{ color: "var(--theme-resolution-text, #738660)", minWidth: 110, textTransform: "capitalize", opacity: 0.8 }}>{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
              <span style={{ color: "var(--theme-resolution-text, #9aaa8a)" }}>{val}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusChangeBadge({ change, onClick }) {
  const styles = {
    condition_new:       { icon: "⚠️", color: "#e8845a", bg: "#1e1410", border: "#3a2418" },
    condition_escalated: { icon: "⚠️", color: "#e8845a", bg: "#1e1410", border: "#3a2418" },
    condition_cleared:   { icon: "✅", color: "#8aba7a", bg: "#101e14", border: "#1a3a20" },
    inventory_gained:    { icon: "📦", color: "#c9a84c", bg: "#1a1810", border: "#2e2a18" },
    inventory_lost:      { icon: "📦", color: "#e8845a", bg: "#1e1410", border: "#3a2418" },
    skill_gained:        { icon: "📈", color: "#6a9aba", bg: "#101418", border: "#1a2a3a" },
  };
  const s = styles[change.type] || styles.condition_new;
  // CON damage gets red — CON is the only stat where reaching zero triggers a Fate Check
  const isCONDamage = change.stat === "CON" && (change.type === "condition_new" || change.type === "condition_escalated");
  const color = isCONDamage ? "#e85a5a" : s.color;
  const bg = isCONDamage ? "#1e1214" : s.bg;
  const border = isCONDamage ? "#3a1820" : s.border;

  return (
    <button onClick={() => onClick({ id: change.entityId, type: change.entityType })}
      title={`Click for details about ${change.label}`}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        background: bg, border: `1px solid ${border}`, borderRadius: 5,
        padding: "4px 10px", cursor: "pointer", transition: "all 0.2s",
        fontFamily: "inherit", fontSize: "0.85em", lineHeight: 1.4,
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = color; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = border; }}
    >
      <span>{s.icon}</span>
      <span style={{ color: color, fontWeight: 600 }}>{change.label}</span>
      <span style={{ color: "var(--theme-text-dim, #7082a4)", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.9em" }}>[{change.detail}]</span>
    </button>
  );
}

// --- INLINE D20 (compact for game layout) ---
function MiniD20({ value, size = 36, opacity = 1, glow = "none", ghost = false, spinning = false }) {
  const glowMap = { none: "transparent", gold: "var(--theme-accent, #c9a84c)", tarnished: "#8a6a3a", crimson: "var(--theme-danger, #e85a5a)" };
  const gc = glowMap[glow] || "transparent";
  return (
    <div style={{
      width: size, height: size, position: "relative", display: "inline-flex",
      opacity, transition: "all 0.4s",
      animation: spinning ? "diceRoll 0.5s ease-in-out" : undefined,
    }}>
      {glow !== "none" && (
        <div style={{
          position: "absolute", inset: -3, borderRadius: "50%",
          boxShadow: `0 0 10px 2px ${gc}44`, border: `1.5px solid ${gc}88`,
        }} />
      )}
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <polygon points="50,5 95,35 82,90 18,90 5,35"
          fill={ghost ? "var(--theme-bg-panel, #141210)" : "var(--theme-bg-card, #1a1714)"}
          stroke={glow !== "none" ? gc : "var(--theme-border, #2a2520)"} strokeWidth="2.5" />
        <line x1="50" y1="5" x2="18" y2="90" stroke="var(--theme-border-light, #2a252033)" strokeWidth="1" />
        <line x1="50" y1="5" x2="82" y2="90" stroke="var(--theme-border-light, #2a252033)" strokeWidth="1" />
        <line x1="5" y1="35" x2="82" y2="90" stroke="var(--theme-border-light, #2a252033)" strokeWidth="1" />
        <line x1="95" y1="35" x2="18" y2="90" stroke="var(--theme-border-light, #2a252033)" strokeWidth="1" />
        <text x="50" y="58" textAnchor="middle" dominantBaseline="middle"
          fontFamily="'JetBrains Mono', monospace" fontSize="30" fontWeight="600"
          fill={value === 20 ? "var(--theme-accent, #c9a84c)" : value === 1 ? "var(--theme-danger, #e85a5a)" : ghost ? "var(--theme-text-faint, #3a3328)" : "var(--theme-heading, #d0c098)"}
        >{spinning ? "?" : value}</text>
        {ghost && (
          <>
            <text x="22" y="30" textAnchor="middle" fontFamily="'JetBrains Mono'" fontSize="10" fill="var(--theme-text-faint, #2a2520)" style={{textDecoration:"line-through"}}>1</text>
            <text x="78" y="30" textAnchor="middle" fontFamily="'JetBrains Mono'" fontSize="10" fill="var(--theme-text-faint, #2a2520)" style={{textDecoration:"line-through"}}>20</text>
          </>
        )}
      </svg>
    </div>
  );
}

// --- INLINE DICE PANEL (compact, fits narrative flow) ---
function InlineDicePanel({ diceRoll }) {
  if (!diceRoll) return null;
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    setPhase(0);
    const steps = diceRoll.category === "MATCHED"
      ? [{ p: 1, d: 500 }, { p: 2, d: 1000 }]
      : diceRoll.extreme
        ? [{ p: 1, d: 500 }, { p: 2, d: 1200 }]
        : [{ p: 1, d: 400 }, { p: 2, d: 600 }, { p: 3, d: 1000 }, { p: 4, d: 1400 }, { p: 5, d: 1800 }];
    const timers = steps.map(({ p, d }) => setTimeout(() => setPhase(p), d));
    return () => timers.forEach(clearTimeout);
  }, [diceRoll]);

  const r = diceRoll;
  const isNat20 = r.extreme === "nat20";
  const isNat1 = r.extreme === "nat1";
  const isExtreme = r.extreme !== null;

  // Category label styling
  const catColors = {
    MATCHED: { color: "var(--theme-text-muted, #8a94a8)", label: "Matched" },
    OUTMATCHED: { color: "var(--theme-accent, #c9a84c)", label: "Outmatched ↑" },
    DOMINANT: { color: "var(--theme-danger, #c9854c)", label: "Dominant ↓" },
  };
  const cat = catColors[r.category] || catColors.MATCHED;

  // Outmatched/Dominant mortal dice
  let keptVal, discVal;
  if (r.mortal) {
    if (r.category === "OUTMATCHED") {
      keptVal = Math.max(r.mortal[0], r.mortal[1]);
      discVal = Math.min(r.mortal[0], r.mortal[1]);
    } else {
      keptVal = Math.min(r.mortal[0], r.mortal[1]);
      discVal = Math.max(r.mortal[0], r.mortal[1]);
    }
  }

  return (
    <div style={{
      background: "var(--theme-resolution-bg, #0e1218)", border: "1px solid var(--theme-border, #1e2530)", borderRadius: 8,
      padding: "10px 14px", marginBottom: 10,
    }}>
      {/* Category + dice inline */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Category tag */}
        <span style={{
          fontFamily: "'Cinzel', serif", fontSize: 10, fontWeight: 700,
          color: cat.color, letterSpacing: "0.1em",
          background: `${cat.color}11`, border: `1px solid ${cat.color}33`,
          borderRadius: 4, padding: "3px 8px", flexShrink: 0,
        }}>{cat.label}</span>

        {/* Dice area */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, justifyContent: "center" }}>

          {/* MATCHED: single die */}
          {r.category === "MATCHED" && (
            <MiniD20
              value={r.die}
              spinning={phase < 1}
              glow={phase >= 1 ? (isNat20 ? "gold" : isNat1 ? "crimson" : "none") : "none"}
            />
          )}

          {/* OUTMATCHED/DOMINANT: crucible → mortal dice */}
          {r.category !== "MATCHED" && (
            <>
              {/* Crucible die */}
              <MiniD20
                value={r.crucible}
                size={isExtreme ? 40 : 28}
                spinning={phase < 1}
                opacity={isExtreme ? 1 : (phase >= 2 ? 0.15 : (phase >= 1 ? 0.5 : 1))}
                glow={isExtreme && phase >= 1 ? (isNat20 ? "gold" : "crimson") : "none"}
              />

              {/* Mortal dice (only if no extreme) */}
              {!isExtreme && r.mortal && (
                <>
                  <div style={{ width: 1, height: 20, background: "var(--theme-border, #2a2530)", margin: "0 2px" }} />
                  <MiniD20
                    value={r.mortal[0]}
                    spinning={phase >= 2 && phase < 3}
                    opacity={phase < 2 ? 0.15 : (phase >= 4 ? (r.mortal[0] === discVal ? 0.2 : 1) : 1)}
                    glow={phase >= 4 ? (
                      r.category === "OUTMATCHED"
                        ? (r.mortal[0] === keptVal ? "gold" : "none")
                        : (r.mortal[0] === discVal ? "gold" : "tarnished")
                    ) : "none"}
                    ghost={phase >= 3}
                  />
                  <MiniD20
                    value={r.mortal[1]}
                    spinning={phase >= 2 && phase < 3}
                    opacity={phase < 2 ? 0.15 : (phase >= 4 ? (r.mortal[1] === discVal ? 0.2 : 1) : 1)}
                    glow={phase >= 4 ? (
                      r.category === "OUTMATCHED"
                        ? (r.mortal[1] === keptVal ? "gold" : "none")
                        : (r.mortal[1] === discVal ? "gold" : "tarnished")
                    ) : "none"}
                    ghost={phase >= 3}
                  />
                </>
              )}
            </>
          )}
        </div>

        {/* Result text (right side) */}
        <div style={{
          opacity: (r.category === "MATCHED" ? phase >= 2 : phase >= 5) ? 1 : 0,
          transition: "opacity 0.3s",
          textAlign: "right", flexShrink: 0,
        }}>
          {isExtreme && (
            <span style={{
              fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 900,
              color: isNat20 ? "var(--theme-accent, #c9a84c)" : "var(--theme-danger, #e85a5a)", letterSpacing: "0.08em",
            }}>
              {isNat20 ? "⚡ NAT 20" : "💀 NAT 1"}
            </span>
          )}
          {!isExtreme && r.mortal && (
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--theme-text-muted, #7082a4)",
            }}>
              [{keptVal}] <span style={{ opacity: 0.35 }}>{discVal}</span>
            </span>
          )}
          {!isExtreme && !r.mortal && r.die && (
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--theme-text-muted, #7082a4)",
            }}>
              → {r.die}
            </span>
          )}
        </div>

        {/* Debt tag */}
        {r.debt && phase >= 4 && (
          <span style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
            color: "var(--theme-danger, #e85a5a)", background: "var(--theme-bg-panel, #1e1214)", border: "1px solid var(--theme-border, #3a1820)",
            borderRadius: 3, padding: "2px 6px", flexShrink: 0,
          }}>
            -{r.debt.amount} DEBT
          </span>
        )}
      </div>
    </div>
  );
}

function TurnBlock({ turn, onEntityClick, onBookmark }) {
  return (
    <div style={{ marginBottom: 28 }}>
      {/* Turn header */}
      <div style={{
        fontFamily: "inherit", fontSize: "0.92em", color: "var(--theme-text-muted, #907f5e)",
        borderBottom: "1px solid var(--theme-border, #2a2520)", paddingBottom: 6, marginBottom: 14,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <span>📍 {turn.location}</span>
          <span>📅 Day {turn.day || 3}</span>
          <span>{turn.timeEmoji} {turn.time}</span>
          <span>{turn.weatherEmoji} {turn.weather}</span>
          <span>🔄 Turn {turn.total}</span>
        </div>
        {/* Bookmark / flag */}
        <button onClick={() => onBookmark(turn.turn)} title="Flag this moment"
          style={{
            background: "none", border: "none", cursor: "pointer", fontSize: "1.1em", padding: "2px 4px",
            color: turn.bookmarked ? "var(--theme-accent, #e8c45a)" : "var(--theme-border, #2a2520)", transition: "color 0.2s",
          }}
          onMouseEnter={e => { if (!turn.bookmarked) e.target.style.color = "var(--theme-text-dim, #5a5040)"; }}
          onMouseLeave={e => { if (!turn.bookmarked) e.target.style.color = "var(--theme-border, #2a2520)"; }}
        >{turn.bookmarked ? "★" : "☆"}</button>
      </div>

      {/* Dice Roll */}
      {turn.diceRoll && <InlineDicePanel diceRoll={turn.diceRoll} />}

      {/* Resolution */}
      {turn.resolution && <ResolutionBlock resolution={turn.resolution} />}

      {/* Narrative with X-Ray entities */}
      <div style={{
        fontFamily: "inherit", fontSize: "inherit", color: "inherit", lineHeight: 1.72,
        whiteSpace: "pre-wrap",
      }}>
        <NarrativeText segments={turn.narrative} onEntityClick={onEntityClick} />
      </div>

      {/* Status changes */}
      {turn.statusChanges && turn.statusChanges.length > 0 && (
        <div style={{
          marginTop: 14, display: "flex", flexWrap: "wrap", gap: 6,
          paddingTop: 10, borderTop: "1px solid var(--theme-border-light, #1e1c18)",
        }}>
          {turn.statusChanges.map((change, i) => (
            <StatusChangeBadge key={i} change={change} onClick={onEntityClick} />
          ))}
        </div>
      )}

      {/* Action options */}
      <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 6 }}>
        {turn.options.map(opt => (
          <button key={opt.key} style={{
            display: "flex", alignItems: "baseline", gap: 10, background: "var(--theme-action-bg, #161412)",
            border: "1px solid var(--theme-action-border, #2a2520)", borderRadius: 6, padding: "10px 14px", cursor: "pointer",
            transition: "all 0.2s", textAlign: "left", width: "100%",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--theme-action-hover, #1c1a16)"; e.currentTarget.style.borderColor = "var(--theme-action-border, #4a4030)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "var(--theme-action-bg, #161412)"; e.currentTarget.style.borderColor = "var(--theme-action-border, #2a2520)"; }}
          >
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: "1.05em", fontWeight: 700, color: "var(--theme-accent, #e8c45a)", minWidth: 18 }}>{opt.key}</span>
            <span style={{ fontFamily: "inherit", fontSize: "inherit", color: "var(--theme-action-text, #a89878)", lineHeight: 1.45 }}>{opt.text}</span>
          </button>
        ))}
        {/* Custom action */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10, background: "var(--theme-action-bg, #161412)",
          border: "1px solid var(--theme-action-border, #2a2520)", borderRadius: 6, padding: "6px 14px",
        }}>
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: "1.05em", fontWeight: 700, color: "var(--theme-accent, #e8c45a)", minWidth: 18 }}>D</span>
          <input type="text" placeholder="Describe your own action..."
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              fontFamily: "inherit", fontSize: "inherit", color: "var(--theme-action-text, #a89878)", padding: "4px 0",
            }}
          />
          <span style={{ color: "var(--theme-text-muted, #948373)", fontSize: 18, cursor: "pointer", transition: "color 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.color = "var(--theme-accent, #e8c45a)"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--theme-text-dim, #3a3520)"}
          >➤</span>
        </div>
      </div>
    </div>
  );
}

// --- DURABILITY LADDER ---
const DURABILITY_BREAKPOINTS = [
  { min: 76, label: "Intact", modifier: "Full quality bonus" },
  { min: 51, label: "Worn", modifier: "Quality bonus - 0.5" },
  { min: 26, label: "Damaged", modifier: "Quality bonus - 1.0" },
  { min: 1, label: "Failing", modifier: "Quality bonus - 1.5" },
  { min: 0, label: "Broken", modifier: "Unusable" },
];

function getDurabilityState(pct) {
  if (pct >= 76) return DURABILITY_BREAKPOINTS[0];
  if (pct >= 51) return DURABILITY_BREAKPOINTS[1];
  if (pct >= 26) return DURABILITY_BREAKPOINTS[2];
  if (pct >= 1) return DURABILITY_BREAKPOINTS[3];
  return DURABILITY_BREAKPOINTS[4];
}

function getDurabilityColor(pct) {
  if (pct === 0) return "var(--theme-danger, #8a3a3a)";
  if (pct <= 25) return "var(--theme-danger, #e85a5a)";
  if (pct <= 50) return "var(--theme-danger, #e8845a)";
  if (pct <= 75) return "#e8c45a";
  return "var(--theme-success, #8aba7a)";
}

// --- ENTITY POPUP ---
function EntityPopup({ entity, glossary, onClose }) {
  const entry = glossary.find(g => g.term.toLowerCase() === entity.id.toLowerCase() || g.term.toLowerCase() === entity.id);
  if (!entry) return null;
  const [playerNote, setPlayerNote] = useState(entry.playerNote || "");
  const [showLadder, setShowLadder] = useState(false);

  // Check if this entity is an item with durability data
  const isItem = entity.type === "Item" && entry.durability !== undefined;
  const durPct = isItem ? Math.round((entry.durability / entry.maxDurability) * 100) : null;
  const durState = isItem ? getDurabilityState(durPct) : null;
  const durColor = isItem ? getDurabilityColor(durPct) : null;

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center",
    }} onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, background: "var(--theme-overlay, rgba(0,0,0,0.5))" }} />
      <div onClick={e => e.stopPropagation()} style={{
        background: "var(--theme-bg-card, #111528)", border: "1px solid var(--theme-border, #1e2540)", borderRadius: 10,
        padding: "20px 24px", maxWidth: 400, width: "90%", position: "relative", zIndex: 1,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: 18, color: "var(--theme-heading, #d4c4a0)", fontWeight: 700 }}>{entry.term}</span>
        </div>
        <p style={{ fontFamily: "inherit", fontSize: "1.05em", color: "var(--theme-text-muted, #948373)", lineHeight: 1.6, margin: "0 0 16px 0" }}>{entry.definition}</p>

        {/* Durability section for items */}
        {isItem && (
          <div style={{ borderTop: "1px solid var(--theme-border-light, #1e1c18)", paddingTop: 12, marginBottom: 12 }}>
            {/* Current state summary */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: "'Alegreya Sans', sans-serif", fontSize: "0.85em", color: "var(--theme-text-dim, #7082a4)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Durability</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1em", fontWeight: 600, color: durColor }}>{entry.durability}/{entry.maxDurability}</span>
                <span style={{ fontFamily: "inherit", fontSize: "0.85em", color: durColor, fontWeight: 600 }}>({durPct}% · {durState.label})</span>
              </div>
            </div>
            {/* Quality and material */}
            <div style={{ fontFamily: "inherit", fontSize: "0.92em", color: "var(--theme-text-muted, #948373)", marginBottom: 6 }}>
              {entry.quality} quality · {durState.modifier}
            </div>
            {/* Durability bar */}
            <div style={{ height: 5, background: "var(--theme-border-light, #1a1714)", borderRadius: 3, overflow: "hidden", marginBottom: 8 }}>
              <div style={{
                height: "100%", width: `${durPct}%`, borderRadius: 3,
                background: durColor, transition: "width 0.4s",
              }} />
            </div>
            {/* Expandable breakpoint ladder */}
            <button onClick={() => setShowLadder(!showLadder)} style={{
              background: "none", border: "none", cursor: "pointer", padding: 0,
              fontFamily: "inherit", fontSize: "0.85em", color: "var(--theme-text-dim, #7082a4)",
              display: "flex", alignItems: "center", gap: 4, transition: "color 0.2s",
            }}
              onMouseEnter={e => e.currentTarget.style.color = "var(--theme-accent, #c9a84c)"}
              onMouseLeave={e => e.currentTarget.style.color = "var(--theme-text-dim, #7082a4)"}
            >
              <span style={{ transform: showLadder ? "rotate(90deg)" : "rotate(0)", transition: "transform 0.2s", display: "inline-block" }}>▸</span>
              {showLadder ? "Hide breakpoints" : "View breakpoints"}
            </button>
            {showLadder && (
              <div style={{ marginTop: 8 }}>
                {DURABILITY_BREAKPOINTS.map((bp, i) => {
                  const isCurrent = durState.label === bp.label;
                  const bpColor = getDurabilityColor(bp.min === 0 ? 0 : bp.min);
                  return (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "4px 8px",
                      borderRadius: 4,
                      background: isCurrent ? "var(--theme-accent-bg, rgba(201,168,76,0.06))" : "transparent",
                      borderLeft: isCurrent ? `3px solid ${durColor}` : "3px solid transparent",
                    }}>
                      <span style={{
                        fontFamily: "'JetBrains Mono', monospace", fontSize: "0.85em",
                        color: isCurrent ? durColor : "var(--theme-text-faint, #5a5040)",
                        minWidth: 52,
                      }}>{bp.min === 0 ? "0%" : `${bp.min}%+`}</span>
                      <span style={{
                        fontFamily: "inherit", fontSize: "0.9em", fontWeight: isCurrent ? 700 : 400,
                        color: isCurrent ? "var(--theme-text, #c8c0b0)" : "var(--theme-text-muted, #7082a4)",
                      }}>{bp.label}</span>
                      <span style={{
                        fontFamily: "inherit", fontSize: "0.85em", marginLeft: "auto",
                        color: isCurrent ? "var(--theme-text-muted, #948373)" : "var(--theme-text-faint, #5a5040)",
                      }}>{bp.modifier}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Player notes */}
        <div style={{ borderTop: "1px solid var(--theme-border-light, #1e1c18)", paddingTop: 12 }}>
          <label style={{
            fontFamily: "inherit", fontSize: "0.85em", color: "var(--theme-text-dim, #948270)",
            letterSpacing: "0.06em", display: "block", marginBottom: 6,
          }}>Your Notes</label>
          <textarea
            value={playerNote}
            onChange={e => setPlayerNote(e.target.value)}
            placeholder="Add your own notes about this..."
            style={{
              width: "100%", minHeight: 60, background: "var(--theme-bg-input, #0e0c0a)", border: "1px solid var(--theme-border, #2a2520)",
              borderRadius: 6, padding: "8px 10px", fontFamily: "inherit",
              fontSize: "1em", color: "var(--theme-text, #a89878)", outline: "none", resize: "vertical",
              boxSizing: "border-box", lineHeight: 1.5,
            }}
            onFocus={e => e.target.style.borderColor = "var(--theme-accent, #4a4030)"}
            onBlur={e => e.target.style.borderColor = "var(--theme-border, #2a2520)"}
          />
        </div>

        <button onClick={onClose} style={{
          position: "absolute", top: 12, right: 14, background: "none", border: "none",
          color: "var(--theme-text-dim, #948270)", fontSize: 16, cursor: "pointer",
        }}>✕</button>
      </div>
    </div>
  );
}

// --- THEMES ---
const THEMES = {
  dark: {
    id: "dark", label: "Dark",
    bg: "#0a0e1a", bgPanel: "#0d1120", bgCard: "#111528", bgInput: "#0a0e1a",
    border: "#1e2540", borderLight: "#161c34",
    text: "#c8c0b0", textMuted: "#8a94a8", textDim: "#7082a4", textFaint: "#6b83a3",
    heading: "#d0c098", accent: "#c9a84c", accentBg: "rgba(201,168,76,0.08)",
    danger: "#e8845a", success: "#8aba7a",
    resolutionBg: "#0e1420", resolutionBorder: "#1a2a3a", resolutionText: "#8aba7a",
    actionBg: "#111528", actionBorder: "#1e2540", actionText: "#8a94a8", actionHoverBg: "#151a30",
    overlay: "rgba(0,0,0,0.5)",
  },
  light: {
    id: "light", label: "Light",
    bg: "#f8f4ec", bgPanel: "#f0ebe0", bgCard: "#ffffff", bgInput: "#f8f4ec",
    border: "#d4cbb8", borderLight: "#e0d8c8",
    text: "#4a4030", textMuted: "#7a6a55", textDim: "#9a8a70", textFaint: "#b8a888",
    heading: "#3a2a15", accent: "#8a6a1a", accentBg: "rgba(138,106,26,0.08)",
    danger: "#b04525", success: "#3a7a2a",
    resolutionBg: "#eef4e8", resolutionBorder: "#c0d4a8", resolutionText: "#3a6a2a",
    actionBg: "#f0ebe0", actionBorder: "#d4cbb8", actionText: "#5a4a35", actionHoverBg: "#e8e0d0",
    overlay: "rgba(0,0,0,0.25)",
  },
  sepia: {
    id: "sepia", label: "Sepia",
    bg: "#2a2218", bgPanel: "#241e14", bgCard: "#302820", bgInput: "#241e14",
    border: "#4a3a28", borderLight: "#3a3020",
    text: "#d8c8a0", textMuted: "#b0986a", textDim: "#8a7850", textFaint: "#6a5840",
    heading: "#f0dca8", accent: "#e0a840", accentBg: "rgba(224,168,64,0.1)",
    danger: "#e09050", success: "#90b060",
    resolutionBg: "#1e2418", resolutionBorder: "#3a4828", resolutionText: "#90b060",
    actionBg: "#302820", actionBorder: "#4a3a28", actionText: "#c8b888", actionHoverBg: "#3a3028",
    overlay: "rgba(0,0,0,0.5)",
  },
};

const FONT_OPTIONS = [
  { id: "lexie", label: "Lexie Readable", family: "'Lexie Readable', sans-serif" },
  { id: "system", label: "System Default", family: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  { id: "alegreya", label: "Alegreya", family: "'Alegreya', serif" },
  { id: "georgia", label: "Georgia", family: "Georgia, 'Times New Roman', serif" },
  { id: "mono", label: "Monospace", family: "'JetBrains Mono', 'Courier New', monospace" },
];

const SIZE_OPTIONS = [
  { id: "small", label: "Small", narrative: 13, ui: 11, sidebar: 310, turnBar: 32, turnH: 10 },
  { id: "medium", label: "Medium", narrative: 15, ui: 12.5, sidebar: 340, turnBar: 36, turnH: 14 },
  { id: "large", label: "Large", narrative: 17, ui: 14, sidebar: 380, turnBar: 40, turnH: 18 },
  { id: "xlarge", label: "X-Large", narrative: 19, ui: 15, sidebar: 420, turnBar: 44, turnH: 22 },
];

function SettingsPanel({ theme, setTheme, font, setFont, textSize, setTextSize, onClose }) {
  const t = THEMES[theme];
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center",
    }} onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, background: t.overlay }} />
      <div onClick={e => e.stopPropagation()} style={{
        background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 10,
        padding: "24px 28px", maxWidth: 420, width: "90%", position: "relative", zIndex: 1,
      }}>
        <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: 18, color: t.heading, marginBottom: 20, marginTop: 0 }}>Display Settings</h2>

        {/* Theme */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontFamily: "inherit", fontSize: "1em", color: t.textMuted, display: "block", marginBottom: 8 }}>Theme</label>
          <div style={{ display: "flex", gap: 6 }}>
            {Object.values(THEMES).map(th => (
              <button key={th.id} onClick={() => setTheme(th.id)} style={{
                flex: 1, padding: "10px 0", cursor: "pointer", borderRadius: 6,
                border: `1px solid ${theme === th.id ? t.accent : t.border}`,
                background: theme === th.id ? t.accentBg : t.bgPanel,
                fontFamily: "inherit", fontSize: "1em",
                color: theme === th.id ? t.accent : t.textMuted, transition: "all 0.2s",
              }}>{th.label}</button>
            ))}
          </div>
        </div>

        {/* Font */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontFamily: "inherit", fontSize: "1em", color: t.textMuted, display: "block", marginBottom: 8 }}>Font</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {FONT_OPTIONS.map(f => (
              <button key={f.id} onClick={() => setFont(f.id)} style={{
                padding: "8px 12px", cursor: "pointer", borderRadius: 6, textAlign: "left",
                border: `1px solid ${font === f.id ? t.accent : t.border}`,
                background: font === f.id ? t.accentBg : "transparent",
                fontFamily: f.family, fontSize: "1.05em",
                color: font === f.id ? t.accent : t.text, transition: "all 0.2s",
              }}>{f.label} — The quick brown fox jumps over the lazy dog</button>
            ))}
          </div>
        </div>

        {/* Text Size */}
        <div style={{ marginBottom: 8 }}>
          <label style={{ fontFamily: "inherit", fontSize: "1em", color: t.textMuted, display: "block", marginBottom: 8 }}>Text Size</label>
          <div style={{ display: "flex", gap: 6 }}>
            {SIZE_OPTIONS.map(s => (
              <button key={s.id} onClick={() => setTextSize(s.id)} style={{
                flex: 1, padding: "8px 0", cursor: "pointer", borderRadius: 6,
                border: `1px solid ${textSize === s.id ? t.accent : t.border}`,
                background: textSize === s.id ? t.accentBg : "transparent",
                fontFamily: "inherit", fontSize: "0.92em",
                color: textSize === s.id ? t.accent : t.textMuted, transition: "all 0.2s",
              }}>{s.label}</button>
            ))}
          </div>
        </div>

        <p style={{ fontFamily: "inherit", fontSize: "0.85em", color: t.textFaint, marginTop: 14 }}>
          Settings are saved automatically and persist across sessions.
        </p>

        <button onClick={onClose} style={{
          position: "absolute", top: 14, right: 16, background: "none", border: "none",
          color: t.textDim, fontSize: 18, cursor: "pointer",
        }}>✕</button>
      </div>
    </div>
  );
}

// --- MAIN LAYOUT ---
export default function GameLayout() {
  const [activeTab, setActiveTab] = useState("character");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [entityPopup, setEntityPopup] = useState(null);
  const [narrativeData, setNarrativeData] = useState(SAMPLE_NARRATIVE);
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [font, setFont] = useState("lexie");
  const [textSize, setTextSize] = useState("medium");

  const t = THEMES[theme];
  const bodyFont = FONT_OPTIONS.find(f => f.id === font)?.family || FONT_OPTIONS[0].family;
  const sizes = SIZE_OPTIONS.find(s => s.id === textSize) || SIZE_OPTIONS[1];

  const char = SAMPLE_CHARACTER;

  const tabs = [
    { id: "character", label: "Character", icon: null, badge: 0 },
    { id: "inventory", label: "Inventory", icon: null, badge: 0 },
    { id: "npcs", label: "NPCs", icon: null, badge: 1 },
    { id: "glossary", label: "Glossary", icon: null, badge: 2 },
    { id: "map", label: "Map", icon: null, badge: 0 },
    { id: "notes", label: "Notes", icon: null, badge: 0 },
  ];

  const [sidebarWidth, setSidebarWidth] = useState(sizes.sidebar);
  const [isResizing, setIsResizing] = useState(false);

  // Update sidebar width when size preset changes
  const prevSizeRef = useState(textSize)[0];
  if (sidebarWidth === SIZE_OPTIONS.find(s => s.id === prevSizeRef)?.sidebar && sidebarWidth !== sizes.sidebar) {
    setSidebarWidth(sizes.sidebar);
  }

  const handleMouseDown = (e) => {
    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = sidebarWidth;
    const handleMouseMove = (e) => {
      const delta = startX - e.clientX;
      setSidebarWidth(Math.max(260, Math.min(600, startWidth + delta)));
    };
    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleBookmark = (turnNum) => {
    setNarrativeData(prev => prev.map(t => t.turn === turnNum ? { ...t, bookmarked: !t.bookmarked } : t));
  };

  return (
    <div style={{
      height: "100vh", background: t.bg, color: t.text, fontFamily: bodyFont,
      display: "flex", flexDirection: "column", overflow: "hidden", transition: "background 0.3s, color 0.3s",
      "--theme-bg": t.bg, "--theme-bg-panel": t.bgPanel, "--theme-bg-card": t.bgCard,
      "--theme-bg-input": t.bgInput, "--theme-border": t.border, "--theme-border-light": t.borderLight,
      "--theme-text": t.text, "--theme-text-muted": t.textMuted, "--theme-text-dim": t.textDim, "--theme-text-faint": t.textFaint,
      "--theme-heading": t.heading, "--theme-accent": t.accent, "--theme-accent-bg": t.accentBg,
      "--theme-danger": t.danger, "--theme-success": t.success,
      "--theme-accent": t.accent, "--theme-accent-bg": t.accentBg,
      "--theme-resolution-bg": t.resolutionBg, "--theme-resolution-border": t.resolutionBorder, "--theme-resolution-text": t.resolutionText,
      "--theme-action-bg": t.actionBg, "--theme-action-border": t.actionBorder, "--theme-action-text": t.actionText, "--theme-action-hover": t.actionHoverBg,
      "--body-font": bodyFont, "--narrative-size": `${sizes.narrative}px`, "--ui-size": `${sizes.ui}px`,
      "--sidebar-width": `${sizes.sidebar}px`, "--turn-bar-h": `${sizes.turnBar}px`, "--turn-h": `${sizes.turnH}px`,
    }}>
      <style>{fonts}{`
        @import url('https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400;0,500;0,700;1,400&display=swap');
        @keyframes diceRoll {
          0% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(90deg) scale(1.08); }
          50% { transform: rotate(180deg) scale(1); }
          75% { transform: rotate(270deg) scale(1.08); }
          100% { transform: rotate(360deg) scale(1); }
        }
      `}</style>

      {/* Top Bar */}
      <div style={{
        height: 44, background: t.bgCard, borderBottom: `1px solid ${t.borderLight}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 16px", flexShrink: 0, transition: "background 0.3s",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ cursor: "pointer", display: "flex", alignItems: "baseline", gap: 0 }} title="Return to Main Menu">
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: "1.3em", fontWeight: 900, color: "#c9a84c", letterSpacing: "0.06em" }}>CRUCIBLE</span>
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: 12, fontWeight: 600, color: "#9a8545", letterSpacing: "0.06em", marginLeft: 2 }}>RPG</span>
          </div>
          <span style={{ color: t.border }}>|</span>
          <span style={{ fontFamily: bodyFont, fontSize: "1em", color: t.textDim }}>The Dockside Conspiracy</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Reading mode toggle */}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} title={sidebarOpen ? "Reading mode" : "Show panels"}
            style={{
              background: "none", border: `1px solid ${t.border}`, borderRadius: 4,
              color: t.textMuted, cursor: "pointer", padding: "4px 7px", transition: "all 0.2s",
              display: "flex", alignItems: "center",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = t.textDim; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; }}
          >{sidebarOpen ? BarIcons.sidebar(t.textMuted) : BarIcons.menu(t.textMuted)}</button>
          {/* Settings */}
          <button onClick={() => setShowSettings(true)} style={{
            width: 28, height: 28, borderRadius: "50%", background: t.bgPanel,
            border: `1px solid ${t.border}`, display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", transition: "all 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = t.accent; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; }}
          >{BarIcons.settings(t.textMuted)}</button>
        </div>
      </div>

      {/* Turn Timeline Scrubber */}
      <div style={{
        height: sizes.turnBar, background: t.bgPanel, borderBottom: `1px solid ${t.borderLight}`,
        display: "flex", alignItems: "center", padding: "0 16px", gap: 8, transition: "all 0.3s",
      }}>
        <span style={{ fontFamily: bodyFont, fontSize: sizes.ui, color: t.textDim }}>TURN</span>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 3 }}>
          {Array.from({ length: 48 }, (_, i) => {
            const turnNum = i + 1;
            const isCurrentTurn = turnNum >= 47;
            const isBookmarked = narrativeData.some(t => t.turn === (turnNum - 46) && t.bookmarked);
            return (
              <div key={i} title={`Turn ${turnNum}`} style={{
                flex: 1, height: isCurrentTurn ? sizes.turnH : Math.max(6, sizes.turnH - 6), borderRadius: 2,
                background: isBookmarked ? t.accent : isCurrentTurn ? t.textDim : t.borderLight,
                cursor: "pointer", transition: "all 0.2s",
              }}
                onMouseEnter={e => e.target.style.background = t.textDim}
                onMouseLeave={e => e.target.style.background = isBookmarked ? t.accent : isCurrentTurn ? t.textDim : t.borderLight}
              />
            );
          })}
        </div>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.92em", color: t.textDim }}>48</span>
      </div>

      {/* Main Content */}
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* Narrative Panel */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, position: "relative" }}>
          <div style={{
            flex: 1, overflowY: "auto", padding: "20px 32px 16px",
            maxWidth: 900, margin: "0 auto", width: "100%", boxSizing: "border-box", fontSize: sizes.narrative,
            scrollBehavior: "smooth",
          }}>
            {narrativeData.map((turn, i) => (
              <TurnBlock key={i} turn={turn} onEntityClick={setEntityPopup} onBookmark={handleBookmark} />
            ))}
          </div>
          {/* Talk to the GM — fixed bottom-right of narrative panel */}
          <button title="Talk to the GM about your game" style={{
            position: "absolute", bottom: 16, right: 24,
            background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 8,
            color: t.textMuted, fontSize: sizes.ui, cursor: "pointer", padding: "8px 14px",
            fontFamily: bodyFont, transition: "all 0.2s",
            display: "flex", alignItems: "center", gap: 7,
            boxShadow: `0 2px 12px rgba(0,0,0,0.3)`,
            zIndex: 10,
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = t.accent; e.currentTarget.style.color = t.accent; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.textMuted; }}
          >{BarIcons.talkAI(t.textMuted)} Talk to the GM</button>
        </div>

        {/* Right Sidebar */}
        {sidebarOpen && (
          <>
          {/* Sidebar resize handle */}
          <div onMouseDown={handleMouseDown} style={{
            width: 6, cursor: "col-resize", background: isResizing ? t.accent : "transparent",
            borderLeft: `1px solid ${t.borderLight}`, transition: "background 0.2s", flexShrink: 0,
          }}
            onMouseEnter={e => { if (!isResizing) e.currentTarget.style.background = t.borderLight; }}
            onMouseLeave={e => { if (!isResizing) e.currentTarget.style.background = "transparent"; }}
          />
          <div style={{
            width: sidebarWidth, flexShrink: 0, display: "flex", flexDirection: "column",
            background: t.bgPanel, transition: isResizing ? "none" : "all 0.3s",
            fontSize: sizes.ui,
          }}>
            {/* Tab Bar */}
            <div style={{ display: "flex", borderBottom: `1px solid ${t.borderLight}`, flexShrink: 0 }}>
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                  flex: 1, padding: "10px 0", background: "transparent", border: "none",
                  borderBottom: activeTab === tab.id ? `2px solid ${t.accent}` : "2px solid transparent",
                  cursor: "pointer", transition: "all 0.2s", position: "relative",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                }}>
                  {TabIcons[tab.id] && TabIcons[tab.id](activeTab === tab.id ? t.accent : t.textMuted)}
                  <span style={{
                    fontFamily: "inherit", fontSize: "0.85em",
                    color: activeTab === tab.id ? t.accent : t.textMuted,
                  }}>{tab.label}</span>
                  {/* Notification badge */}
                  {tab.badge > 0 && (
                    <div style={{
                      position: "absolute", top: 4, right: "18%",
                      width: 14, height: 14, borderRadius: "50%",
                      background: t.accent, color: t.bg,
                      fontSize: 8, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>{tab.badge}</div>
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", fontSize: sizes.ui }}>

              {/* CHARACTER TAB */}
              {activeTab === "character" && (
                <div>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: "1.4em", fontWeight: 700, color: "var(--theme-heading, #d4c4a0)", marginBottom: 4 }}>{char.name}</div>
                  <div style={{ fontFamily: "inherit", fontSize: "0.92em", color: "var(--theme-text-muted, #a89878)", marginBottom: 16 }}>{char.title}</div>
                  <PanelSection title="Attributes">
                    {char.stats.map(s => <StatBar key={s.name} stat={s} onClick={setEntityPopup} />)}
                  </PanelSection>
                  <PanelSection title="Skills">
                    {char.skills.map(s => (
                      <div key={s.name} onClick={() => setEntityPopup({ id: s.name.toLowerCase(), type: "Skill" })}
                        style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontFamily: "inherit", fontSize: "1em", cursor: "pointer", borderRadius: 4, transition: "background 0.2s" }}
                        onMouseEnter={e => e.currentTarget.style.background = "var(--theme-accent-bg, #161412)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        <span style={{ color: "var(--theme-text, #a89878)" }}>{s.emoji} {s.name}</span>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1em", color: "var(--theme-text-muted, #907f5e)" }}>+{s.value.toFixed(1)}</span>
                      </div>
                    ))}
                  </PanelSection>
                  <PanelSection title="Abilities">
                    {char.abilities.map(a => (
                      <div key={a.name} onClick={() => setEntityPopup({ id: a.name.toLowerCase(), type: "Ability" })}
                        style={{ background: "var(--theme-bg-input, #161412)", border: "1px solid var(--theme-border, #2a2520)", borderRadius: 6, padding: "8px 10px", marginBottom: 4, cursor: "pointer", transition: "border-color 0.2s" }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = "var(--theme-border-light, #3a3530)"}
                        onMouseLeave={e => e.currentTarget.style.borderColor = "var(--theme-border, #2a2520)"}
                      >
                        <div style={{ fontFamily: "inherit", fontSize: "1em", fontWeight: 700, color: "var(--theme-text, #b8a88a)" }}>{a.emoji} {a.name}</div>
                        <div style={{ fontFamily: "inherit", fontSize: "0.92em", color: "var(--theme-text-muted, #948373)", marginTop: 2 }}>
                          {a.effect} · <span style={{ color: "var(--theme-danger, #e8845a)" }}>Strain: {a.strain}</span>
                        </div>
                      </div>
                    ))}
                  </PanelSection>
                  <PanelSection title="Conditions">
                    {char.conditions.length === 0
                      ? <div style={{ fontFamily: "inherit", fontSize: "1em", color: "var(--theme-text-muted, #948373)", fontStyle: "italic" }}>No active conditions</div>
                      : char.conditions.map((c, i) => <ConditionBadge key={i} condition={c} onClick={setEntityPopup} />)
                    }
                  </PanelSection>
                </div>
              )}

              {/* INVENTORY TAB */}
              {activeTab === "inventory" && (
                <div>
                  {/* Paperdoll placeholder */}
                  <div style={{
                    width: "100%", height: 200, marginBottom: 12,
                    background: t.bgPanel,
                    border: `1px dashed ${t.border}`,
                    borderRadius: 8,
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8,
                  }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={t.textDim} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                      <path d="M2 12h3" /><path d="M19 12h3" /><path d="M12 19v3" />
                    </svg>
                    <span style={{ fontFamily: "'Alegreya Sans', sans-serif", fontSize: "0.85em", color: t.textDim }}>Equipment Paperdoll</span>
                  </div>

                  {/* Resource boxes — compact */}
                  <div style={{
                    display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 12,
                  }}>
                    <div style={{
                      background: t.bgPanel, border: `1px solid ${t.border}`,
                      borderRadius: 6, padding: "8px 6px", textAlign: "center",
                    }}>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.1em", fontWeight: 500, color: t.heading }}>
                        🍞 {char.inventory.rations}
                      </div>
                      <div style={{ fontFamily: "'Alegreya Sans', sans-serif", fontSize: "0.75em", color: t.textDim, marginTop: 2 }}>
                        Rations
                      </div>
                    </div>
                    <div style={{
                      background: t.bgPanel, border: `1px solid ${t.border}`,
                      borderRadius: 6, padding: "8px 6px", textAlign: "center",
                    }}>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.1em", fontWeight: 500, color: "#6a9aba" }}>
                        💧 {char.inventory.water}
                      </div>
                      <div style={{ fontFamily: "'Alegreya Sans', sans-serif", fontSize: "0.75em", color: t.textDim, marginTop: 2 }}>
                        Water
                      </div>
                    </div>
                    <div style={{
                      background: t.bgPanel, border: `1px solid ${t.border}`,
                      borderRadius: 6, padding: "8px 6px", textAlign: "center",
                    }}>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.1em", fontWeight: 500, color: t.accent }}>
                        🪙 {char.inventory.coins}
                      </div>
                      <div style={{ fontFamily: "'Alegreya Sans', sans-serif", fontSize: "0.75em", color: t.textDim, marginTop: 2 }}>
                        Coin
                      </div>
                    </div>
                  </div>

                  {/* Capacity bar */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{
                      display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6,
                    }}>
                      <span style={{ fontFamily: "'Alegreya Sans', sans-serif", fontSize: "1em", color: t.textMuted }}>
                        🎒 Capacity
                      </span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.05em", color: t.heading, fontWeight: 500 }}>
                        {char.inventory.current} / {char.inventory.max}
                      </span>
                    </div>
                    <div style={{ height: 6, background: t.borderLight, borderRadius: 3, overflow: "hidden" }}>
                      <div style={{
                        height: "100%", width: `${(char.inventory.current / char.inventory.max) * 100}%`,
                        background: char.inventory.current > char.inventory.max ? "linear-gradient(90deg, #ba3a3a, #e85a5a)"
                          : char.inventory.current > char.inventory.max - 1 ? "linear-gradient(90deg, #ba9a4a, #e8c45a)"
                          : "linear-gradient(90deg, #5a6a4a, #7a8a5a)",
                        borderRadius: 3, transition: "width 0.4s",
                      }} />
                    </div>
                  </div>

                  {/* Carried items label */}
                  <div style={{
                    fontFamily: "'Alegreya Sans', sans-serif", fontSize: "0.85em", fontWeight: 600,
                    color: "var(--theme-text-dim, #7082a4)", letterSpacing: "0.06em", textTransform: "uppercase",
                    marginBottom: 8,
                  }}>Carried Items</div>

                  <div style={{ background: t.bgInput, borderRadius: 6, border: `1px solid ${t.borderLight}`, overflow: "hidden" }}>
                    {char.inventory.items.map((item, i) => <InventoryItem key={i} item={item} onClick={setEntityPopup} />)}
                  </div>
                </div>
              )}

              {/* NPCS TAB */}
              {activeTab === "npcs" && (
                <div>
                  {SAMPLE_NPCS.map((npc, i) => <NPCCard key={i} npc={npc} onClick={setEntityPopup} />)}
                </div>
              )}

              {/* GLOSSARY TAB */}
              {activeTab === "glossary" && (
                <div>
                  <input type="text" placeholder="Search glossary..." style={{
                    width: "100%", background: t.bgInput, border: `1px solid ${t.border}`, borderRadius: 6,
                    padding: "8px 12px", fontFamily: "inherit", fontSize: "1em",
                    color: t.text, outline: "none", marginBottom: 8, boxSizing: "border-box",
                  }} />
                  <div style={{ display: "flex", gap: 4, marginBottom: 12, flexWrap: "wrap" }}>
                    {["All", "People", "Places", "Factions", "Items"].map(filter => (
                      <button key={filter} style={{
                        padding: "4px 10px", borderRadius: 4, cursor: "pointer",
                        fontFamily: "inherit", fontSize: "0.85em",
                        border: `1px solid ${filter === "All" ? t.accent : t.border}`,
                        background: filter === "All" ? t.accentBg : "transparent",
                        color: filter === "All" ? t.accent : t.textMuted,
                        transition: "all 0.2s",
                      }}>{filter}</button>
                    ))}
                  </div>
                  {SAMPLE_GLOSSARY.map((entry, i) => <GlossaryEntry key={i} entry={entry} onClick={setEntityPopup} />)}
                </div>
              )}

              {/* MAP TAB */}
              {activeTab === "map" && (
                <div>
                  <div style={{ fontFamily: "inherit", fontSize: "0.92em", color: "var(--theme-text-muted, #907f5e)", marginBottom: 10 }}>
                    📍 Current: <span style={{ color: "var(--theme-accent, #e8c45a)" }}>The Rusted Lantern</span>
                  </div>
                  <MiniMap locations={SAMPLE_MAP_LOCATIONS} onLocationClick={setEntityPopup} />
                  <div style={{ marginTop: 14 }}>
                    {SAMPLE_MAP_LOCATIONS.map((loc, i) => (
                      <div key={i} onClick={() => setEntityPopup({ id: loc.name.toLowerCase(), type: "Location" })}
                        style={{
                        display: "flex", alignItems: "center", gap: 8, padding: "5px 0",
                        fontFamily: "inherit", fontSize: "1em",
                        color: loc.current ? "var(--theme-accent, #e8c45a)" : "var(--theme-text-dim, #948470)", cursor: "pointer",
                        transition: "color 0.2s",
                      }}
                        onMouseEnter={e => { if (!loc.current) e.currentTarget.style.color = "var(--theme-text, #a89878)"; }}
                        onMouseLeave={e => { if (!loc.current) e.currentTarget.style.color = "var(--theme-text-dim, #948470)"; }}
                      >
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: loc.current ? "var(--theme-accent, #e8c45a)" : "var(--theme-border, #4a4035)" }} />
                        {loc.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* NOTES TAB */}
              {activeTab === "notes" && (
                <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                  <div style={{ fontFamily: "inherit", fontSize: "1em", color: "var(--theme-text-dim, #948270)", marginBottom: 10 }}>
                    Your personal notepad. Jot down theories, plans, things to remember — whatever you want.
                  </div>
                  <textarea
                    placeholder="Write your notes here..."
                    defaultValue={"- Veymar is moving cargo at midnight\n- Pol knows something, might talk if approached alone\n- Double-crescent seal — seen on three shipments this month\n- Ask barkeep about the ship that arrived this morning\n- Need to find triage for ribs before they get worse"}
                    style={{
                      flex: 1, minHeight: 300, width: "100%", background: "var(--theme-bg-input, #0e0c0a)", border: "1px solid var(--theme-border, #2a2520)",
                      borderRadius: 6, padding: "12px 14px", fontFamily: "inherit",
                      fontSize: "1.05em", color: "var(--theme-text, #b8a88a)", outline: "none", resize: "none",
                      boxSizing: "border-box", lineHeight: 1.7,
                    }}
                    onFocus={e => e.target.style.borderColor = "var(--theme-accent, #4a4030)"}
                    onBlur={e => e.target.style.borderColor = "var(--theme-border, #2a2520)"}
                  />
                  <div style={{
                    fontFamily: "inherit", fontSize: "0.85em", color: "var(--theme-text-muted, #948373)",
                    marginTop: 6, textAlign: "right",
                  }}>Auto-saved</div>
                </div>
              )}
            </div>

            {/* Sidebar footer: feedback */}
            <div style={{
              borderTop: `1px solid ${t.borderLight}`, padding: "10px 16px",
              display: "flex", gap: 8,
            }}>
              <button style={{
                flex: 1, padding: "8px", background: t.bgInput, border: `1px solid ${t.border}`,
                borderRadius: 4, cursor: "pointer", fontFamily: "inherit",
                fontSize: "1em", color: t.textMuted, transition: "all 0.2s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = t.textDim; e.currentTarget.style.color = t.text; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.textMuted; }}
              >{BarIcons.bug(t.textMuted)} Bug Report</button>
              <button style={{
                flex: 1, padding: "8px", background: t.bgInput, border: `1px solid ${t.border}`,
                borderRadius: 4, cursor: "pointer", fontFamily: "inherit",
                fontSize: "1em", color: t.textMuted, transition: "all 0.2s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = t.textDim; e.currentTarget.style.color = t.text; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.textMuted; }}
              >{BarIcons.lightbulb(t.textMuted)} Suggest</button>
            </div>
          </div>
          </>
        )}
      </div>

      {/* Entity popup (X-Ray) */}
      {entityPopup && (
        <EntityPopup entity={entityPopup} glossary={SAMPLE_GLOSSARY} onClose={() => setEntityPopup(null)} />
      )}

      {/* Settings panel */}
      {showSettings && (
        <SettingsPanel theme={theme} setTheme={setTheme} font={font} setFont={setFont} textSize={textSize} setTextSize={setTextSize} onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
