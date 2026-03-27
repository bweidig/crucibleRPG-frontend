import { useState, useEffect, useRef, useCallback } from "react";

const fonts = `@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Alegreya+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');`;

// --- DESIGN SYSTEM COLORS ---
const C = {
  bg: "#0a0e1a",
  panelBg: "#0d1120",
  cardBg: "#111528",
  inputBg: "#0a0e1a",
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
  border: "#1e2540",
  borderLight: "#161c34",
  goldLabel: "#9a8545",
};

const DANGER_COLORS = {
  safe: "#8aba7a",
  low: "#8a94a8",
  moderate: "#e8c45a",
  high: "#e8845a",
  extreme: "#e85a5a",
};

const TERRAIN_DASH = {
  road: "none",
  trail: "6,4",
  wilderness: "2,4",
  mountain: "8,3,2,3",
  water: "10,4",
  underground: "4,4",
  urban: "none",
};

// --- HIERARCHICAL WORLD DATA ---
// Three tiers: region > city districts > district locations

const ALL_LOCATIONS = {
  // === REGION LEVEL (top) ===
  "ashenmoor-region": {
    locations: [
      { id: "port-veylan", name: "Port Veylan", type: "settlement", dangerLevel: "low", status: "current", controllingFaction: "City Council", services: ["basic", "skilled", "expert"], description: "A sprawling port city built around a deep natural harbor. Trade capital of the Ashenmoor coast. Five districts, each with its own character.", hasChildren: true },
      { id: "thornfield", name: "Thornfield", type: "settlement", dangerLevel: "low", status: "visited", controllingFaction: "Baron Aldric", services: ["basic", "skilled"], description: "A fortified farming town two days inland. Known for its grain stores and suspicious hospitality.", hasChildren: false },
      { id: "ashenmoor-crossing", name: "Ashenmoor Crossing", type: "landmark", dangerLevel: "moderate", status: "discovered", controllingFaction: null, services: [], description: "A stone bridge over the River Ashen, marking the boundary between settled lands and the moor. Travelers camp here but don't linger.", hasChildren: false },
      { id: "grey-mire", name: "The Grey Mire", type: "wilderness", dangerLevel: "high", status: "discovered", controllingFaction: null, services: [], description: "Treacherous marshland stretching north of the river. Few paths, fewer survivors. Locals say things move in the fog.", hasChildren: false },
      { id: "keldrath-ruins", name: "Keldrath Ruins", type: "dungeon", dangerLevel: "extreme", status: "discovered", controllingFaction: null, services: [], description: "The remains of a pre-collapse fortress on the moor's edge. Something still burns in its depths at night.", hasChildren: false },
    ],
    routes: [
      { id: "reg-r1", origin: "port-veylan", destination: "thornfield", travelDays: 2, dangerLevel: "low", terrain: "road", known: true },
      { id: "reg-r2", origin: "thornfield", destination: "ashenmoor-crossing", travelDays: 1, dangerLevel: "low", terrain: "road", known: true },
      { id: "reg-r3", origin: "ashenmoor-crossing", destination: "grey-mire", travelDays: 3, dangerLevel: "high", terrain: "wilderness", known: true },
      { id: "reg-r4", origin: "grey-mire", destination: "keldrath-ruins", travelDays: 2, dangerLevel: "extreme", terrain: "wilderness", known: false },
      { id: "reg-r5", origin: "port-veylan", destination: "ashenmoor-crossing", travelDays: 3, dangerLevel: "moderate", terrain: "trail", known: true },
    ],
    parent: null,
    label: "Ashenmoor Region",
  },

  // === CITY LEVEL (mid) ===
  "port-veylan": {
    locations: [
      { id: "dockside-quarter", name: "Dockside Quarter", type: "area", dangerLevel: "moderate", status: "current", controllingFaction: "Veymar", services: ["basic", "skilled"], description: "The harbor district. Warehouses, cheap taverns, and transient labor. Smells of brine and tar. Veymar runs the docks.", hasChildren: true },
      { id: "merchant-ward", name: "Merchant Ward", type: "area", dangerLevel: "safe", status: "visited", controllingFaction: "Merchant Guild", services: ["basic", "skilled", "expert"], description: "The city's commercial heart. Clean streets, guild halls, and enough guards to keep it that way. Where the money flows openly.", hasChildren: false },
      { id: "old-quarter", name: "Old Quarter", type: "area", dangerLevel: "low", status: "discovered", controllingFaction: "City Watch", services: ["basic"], description: "The original settlement. Narrow streets, ancient stone, and residents who remember when the city was just a fishing village.", hasChildren: false },
      { id: "highcliff", name: "Highcliff", type: "area", dangerLevel: "safe", status: "discovered", controllingFaction: "City Council", services: ["basic", "skilled", "expert", "rare"], description: "The wealthy district perched on the bluffs above the harbor. Council chambers, noble estates, and a view of everything below.", hasChildren: false },
      { id: "underguts", name: "The Underguts", type: "area", dangerLevel: "high", status: "discovered", controllingFaction: null, services: [], description: "The tunnels and cisterns beneath the city. Officially sealed. Unofficially, everyone knows there are ways in.", hasChildren: false },
    ],
    routes: [
      { id: "city-r1", origin: "dockside-quarter", destination: "merchant-ward", travelDays: 1, dangerLevel: "safe", terrain: "urban", known: true },
      { id: "city-r2", origin: "merchant-ward", destination: "old-quarter", travelDays: 1, dangerLevel: "safe", terrain: "urban", known: true },
      { id: "city-r3", origin: "merchant-ward", destination: "highcliff", travelDays: 1, dangerLevel: "safe", terrain: "road", known: true },
      { id: "city-r4", origin: "old-quarter", destination: "dockside-quarter", travelDays: 1, dangerLevel: "low", terrain: "urban", known: true },
      { id: "city-r5", origin: "dockside-quarter", destination: "underguts", travelDays: 1, dangerLevel: "high", terrain: "underground", known: false },
      { id: "city-r6", origin: "old-quarter", destination: "underguts", travelDays: 1, dangerLevel: "moderate", terrain: "underground", known: false },
    ],
    parent: "ashenmoor-region",
    label: "Port Veylan",
  },

  // === DISTRICT LEVEL (bottom) ===
  "dockside-quarter": {
    locations: [
      { id: "rusted-lantern", name: "The Rusted Lantern", type: "settlement", dangerLevel: "safe", status: "current", controllingFaction: "None", services: ["basic"], description: "A dockside tavern frequented by sailors and laborers. Run by a scarred barkeep." },
      { id: "harbor-docks", name: "Harbor Docks", type: "landmark", dangerLevel: "low", status: "visited", controllingFaction: "Veymar", services: ["basic"], description: "The working waterfront. Cargo ships, fishing boats, and the occasional vessel that arrives unannounced in the dark." },
      { id: "warehouse-row", name: "Warehouse Row", type: "landmark", dangerLevel: "moderate", status: "visited", controllingFaction: "Veymar", services: [], description: "A stretch of aging stone warehouses along the canal. Most are leased by merchant guilds. Some sit dark and padlocked." },
      { id: "market-square", name: "Market Square", type: "settlement", dangerLevel: "low", status: "discovered", controllingFaction: null, services: ["basic", "skilled", "expert"], description: "The commercial heart of the lower quarter. Stalls, hawkers, and pickpockets." },
      { id: "old-gate", name: "The Old Gate", type: "landmark", dangerLevel: "low", status: "discovered", controllingFaction: null, services: [], description: "A crumbling stone archway marking the original city boundary. Beggars camp here." },
      { id: "canal-district", name: "Canal District", type: "settlement", dangerLevel: "moderate", status: "discovered", controllingFaction: "City Watch", services: ["basic", "skilled"], description: "Narrow bridges over dark water. The smell of industry and the sound of hammers." },
      { id: "veymar-compound", name: "Veymar Compound", type: "landmark", dangerLevel: "high", status: "discovered", controllingFaction: "Veymar", services: [], description: "A walled compound at the edge of Warehouse Row. Double-crescent seal on the iron gate." },
    ],
    routes: [
      { id: "d-r1", origin: "rusted-lantern", destination: "harbor-docks", travelDays: 1, dangerLevel: "low", terrain: "urban", known: true },
      { id: "d-r2", origin: "rusted-lantern", destination: "warehouse-row", travelDays: 1, dangerLevel: "moderate", terrain: "urban", known: true },
      { id: "d-r3", origin: "warehouse-row", destination: "market-square", travelDays: 1, dangerLevel: "low", terrain: "road", known: true },
      { id: "d-r4", origin: "market-square", destination: "old-gate", travelDays: 1, dangerLevel: "low", terrain: "road", known: true },
      { id: "d-r5", origin: "warehouse-row", destination: "canal-district", travelDays: 1, dangerLevel: "moderate", terrain: "trail", known: true },
      { id: "d-r6", origin: "warehouse-row", destination: "veymar-compound", travelDays: 1, dangerLevel: "high", terrain: "urban", known: false },
      { id: "d-r7", origin: "harbor-docks", destination: "canal-district", travelDays: 2, dangerLevel: "moderate", terrain: "water", known: true },
    ],
    parent: "port-veylan",
    label: "Dockside Quarter",
  },
};

// --- FORCE-DIRECTED LAYOUT ---
function computeLayout(locations, routes, width, height) {
  if (!locations.length) return {};

  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.30;
  let pos = {};
  locations.forEach((loc, i) => {
    const angle = (i / locations.length) * Math.PI * 2 - Math.PI / 2;
    pos[loc.id] = {
      x: cx + Math.cos(angle) * radius + (Math.random() - 0.5) * 10,
      y: cy + Math.sin(angle) * radius + (Math.random() - 0.5) * 10,
      vx: 0, vy: 0,
    };
  });

  const edges = routes.map(r => ({
    source: r.origin,
    target: r.destination,
    idealLen: Math.max(55, r.travelDays * 38 + 45),
  }));

  const iterations = 250;
  const padding = 36;

  for (let iter = 0; iter < iterations; iter++) {
    const alpha = 1 - iter / iterations;
    const repulsion = 3600 * alpha;
    const springK = 0.05;
    const centerPull = 0.01 * alpha;

    for (const id in pos) { pos[id].vx = 0; pos[id].vy = 0; }

    const ids = Object.keys(pos);
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = pos[ids[i]], b = pos[ids[j]];
        let dx = a.x - b.x, dy = a.y - b.y;
        let dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = repulsion / (dist * dist);
        const fx = (dx / dist) * force, fy = (dy / dist) * force;
        a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy;
      }
    }

    for (const edge of edges) {
      const a = pos[edge.source], b = pos[edge.target];
      if (!a || !b) continue;
      let dx = b.x - a.x, dy = b.y - a.y;
      let dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const displacement = dist - edge.idealLen;
      const force = springK * displacement;
      const fx = (dx / dist) * force, fy = (dy / dist) * force;
      a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy;
    }

    for (const id in pos) {
      pos[id].vx += (cx - pos[id].x) * centerPull;
      pos[id].vy += (cy - pos[id].y) * centerPull;
    }

    const damping = 0.82;
    for (const id in pos) {
      pos[id].x += pos[id].vx * damping;
      pos[id].y += pos[id].vy * damping;
      pos[id].x = Math.max(padding, Math.min(width - padding, pos[id].x));
      pos[id].y = Math.max(padding, Math.min(height - padding, pos[id].y));
    }
  }

  const result = {};
  for (const id in pos) result[id] = { x: pos[id].x, y: pos[id].y };
  return result;
}

// --- SVG ICONS ---
const ZoomInIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    <line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
  </svg>
);

const ZoomOutIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    <line x1="8" y1="11" x2="14" y2="11" />
  </svg>
);

const ChevronIcon = () => (
  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const ExpandIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
    <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
  </svg>
);

// --- ROUTE COMPONENT ---
function MapRoute({ route, positions, isHovered }) {
  const start = positions[route.origin];
  const end = positions[route.destination];
  if (!start || !end) return null;

  const dangerColor = DANGER_COLORS[route.dangerLevel] || C.secondary;
  const dashArray = TERRAIN_DASH[route.terrain] || "none";

  const mx = (start.x + end.x) / 2;
  const my = (start.y + end.y) / 2;
  const dx = end.x - start.x, dy = end.y - start.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = -dy / len, ny = dx / len;
  const labelOffset = 9;

  return (
    <g>
      <line
        x1={start.x} y1={start.y} x2={end.x} y2={end.y}
        stroke={dangerColor}
        strokeWidth={isHovered ? 2.2 : 1.2}
        strokeDasharray={dashArray}
        opacity={isHovered ? 0.85 : route.known ? 0.35 : 0.15}
        strokeLinecap="round"
        style={{ transition: "opacity 0.2s, stroke-width 0.2s" }}
      />
      {!route.known && (
        <text x={mx} y={my - 9} textAnchor="middle" fill={dangerColor} fontSize="8"
          fontFamily="'JetBrains Mono', monospace" opacity="0.4">?</text>
      )}
      <text
        x={mx + nx * labelOffset} y={my + ny * labelOffset}
        textAnchor="middle" dominantBaseline="central"
        fill={dangerColor} fontSize="8"
        fontFamily="'JetBrains Mono', monospace" fontWeight="500"
        opacity={isHovered ? 0.9 : 0.45}
        style={{ transition: "opacity 0.2s", pointerEvents: "none" }}
      >
        {route.travelDays}d
      </text>
    </g>
  );
}

// --- NODE COMPONENT ---
function MapNode({ loc, x, y, isHovered, onHover, onLeave, onClick }) {
  const isCurrent = loc.status === "current";
  const isVisited = loc.status === "visited";
  const isDiscovered = loc.status === "discovered";
  const hasKids = loc.hasChildren;

  const nodeSize = isCurrent ? 16 : isVisited ? 12 : 9;

  const fillColor = isCurrent ? C.accent : isVisited ? C.secondary : "transparent";
  const strokeColor = isCurrent ? C.accentBright : isVisited ? "#5a6a88" : "#3a4a60";
  const labelColor = isCurrent ? C.accent : isVisited ? C.secondary : C.dim;

  return (
    <g style={{ cursor: "pointer" }} onMouseEnter={onHover} onMouseLeave={onLeave} onClick={onClick}>
      {/* Glow for current */}
      {isCurrent && (
        <circle cx={x} cy={y} r={14} fill="none" stroke={C.accent} strokeWidth="1" opacity="0.2">
          <animate attributeName="r" values="12;16;12" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.2;0.08;0.2" dur="3s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Hover ring */}
      {isHovered && (
        <circle cx={x} cy={y} r={nodeSize / 2 + 6} fill="none" stroke={C.accent} strokeWidth="1" opacity="0.3" />
      )}

      {/* Outer ring for zoomable nodes */}
      {hasKids && !isCurrent && (
        <circle cx={x} cy={y} r={nodeSize / 2 + 3} fill="none" stroke={isHovered ? C.accent : strokeColor}
          strokeWidth="0.8" strokeDasharray="3,2" opacity={isHovered ? 0.5 : 0.25} />
      )}

      {/* Node */}
      <circle cx={x} cy={y} r={nodeSize / 2}
        fill={fillColor}
        stroke={isHovered ? C.accent : strokeColor}
        strokeWidth={isCurrent ? 2 : isDiscovered ? 1.5 : 1}
        strokeDasharray={isDiscovered ? "2,2" : "none"}
      />

      {/* Inner dot for current */}
      {isCurrent && <circle cx={x} cy={y} r={2.5} fill={C.bg} />}

      {/* Expand indicator for zoomable */}
      {hasKids && (
        <g transform={`translate(${x + nodeSize / 2 + 3}, ${y - nodeSize / 2 - 3})`}>
          <circle cx="0" cy="0" r="5" fill={C.cardBg} stroke={isHovered ? C.accent : C.border} strokeWidth="0.8" />
          <text x="0" y="0.5" textAnchor="middle" dominantBaseline="central" fill={isHovered ? C.accent : C.dim}
            fontSize="7" fontFamily="'JetBrains Mono', monospace" fontWeight="700">+</text>
        </g>
      )}

      {/* Label */}
      <text x={x} y={y + nodeSize / 2 + 13} textAnchor="middle"
        fill={isHovered ? C.accent : labelColor} fontSize="9.5"
        fontFamily="'Alegreya Sans', sans-serif"
        fontWeight={isCurrent ? 700 : isVisited ? 500 : 400}
        style={{ transition: "fill 0.15s", pointerEvents: "none" }}
      >
        {loc.name}
      </text>
    </g>
  );
}

// --- TOOLTIP (rendered outside map container) ---
function Tooltip({ data, type, mousePos, mapRect }) {
  if (!data || !mapRect) return null;

  const tooltipWidth = 210;

  // Position relative to viewport
  let tx = mousePos.clientX + 14;
  let ty = mousePos.clientY - 12;

  // Keep on screen
  if (tx + tooltipWidth > window.innerWidth - 10) tx = mousePos.clientX - tooltipWidth - 14;
  if (ty < 10) ty = 10;
  if (ty + 100 > window.innerHeight - 10) ty = window.innerHeight - 120;

  if (type === "route") {
    const route = data;
    const allLocs = ALL_LOCATIONS[Object.keys(ALL_LOCATIONS).find(k => {
      const lvl = ALL_LOCATIONS[k];
      return lvl.routes?.some(r => r.id === route.id);
    })]?.locations || [];
    const originLoc = allLocs.find(l => l.id === route.origin);
    const destLoc = allLocs.find(l => l.id === route.destination);
    const dc = DANGER_COLORS[route.dangerLevel];

    return (
      <div style={{
        position: "fixed", left: tx, top: ty, width: tooltipWidth, zIndex: 200,
        background: C.cardBg, border: `1px solid ${dc}33`, borderRadius: 6,
        padding: "8px 10px", pointerEvents: "none",
        boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
      }}>
        <div style={{ fontFamily: "'Alegreya Sans', sans-serif", fontSize: 10, color: C.muted, marginBottom: 4 }}>
          {originLoc?.name || route.origin} → {destLoc?.name || route.destination}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.heading }}>
            {route.travelDays} day{route.travelDays > 1 ? "s" : ""}
          </span>
          <span style={{
            fontSize: 9, fontFamily: "'Alegreya Sans', sans-serif", fontWeight: 600,
            color: dc, background: `${dc}18`, padding: "1px 6px", borderRadius: 3, textTransform: "uppercase",
          }}>{route.dangerLevel}</span>
          <span style={{ fontSize: 10, fontFamily: "'Alegreya Sans', sans-serif", color: C.dim }}>
            {route.terrain}
          </span>
        </div>
        {!route.known && (
          <div style={{ fontFamily: "'Alegreya Sans', sans-serif", fontSize: 9, color: C.warning, marginTop: 4, fontStyle: "italic" }}>
            Unconfirmed route
          </div>
        )}
      </div>
    );
  }

  // Location tooltip
  const loc = data;
  const dc = DANGER_COLORS[loc.dangerLevel];

  return (
    <div style={{
      position: "fixed", left: tx, top: ty, width: tooltipWidth, zIndex: 200,
      background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 6,
      padding: "8px 10px", pointerEvents: "none",
      boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
    }}>
      <div style={{
        fontFamily: "'Cinzel', serif", fontSize: 12, fontWeight: 700,
        color: loc.status === "current" ? C.accent : C.heading, marginBottom: 3,
      }}>
        {loc.name}
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
        <span style={{
          fontSize: 9, fontFamily: "'Alegreya Sans', sans-serif", fontWeight: 600,
          color: dc, background: `${dc}18`, padding: "1px 6px", borderRadius: 3, textTransform: "uppercase",
        }}>{loc.dangerLevel}</span>
        <span style={{ fontSize: 10, fontFamily: "'Alegreya Sans', sans-serif", color: C.dim }}>{loc.type}</span>
      </div>
      {loc.controllingFaction && loc.controllingFaction !== "None" && (
        <div style={{ fontSize: 10, fontFamily: "'Alegreya Sans', sans-serif", color: C.muted }}>
          Controlled by {loc.controllingFaction}
        </div>
      )}
      {loc.hasChildren && (
        <div style={{ fontSize: 9, fontFamily: "'Alegreya Sans', sans-serif", color: C.accent, marginTop: 3 }}>
          Click to explore inside
        </div>
      )}
      {loc.status === "current" && !loc.hasChildren && (
        <div style={{ fontSize: 9, fontFamily: "'Alegreya Sans', sans-serif", color: C.accent, marginTop: 3 }}>
          📍 You are here
        </div>
      )}
    </div>
  );
}

// --- ENTITY POPUP ---
function EntityPopup({ loc, levelData, onClose }) {
  if (!loc) return null;
  const dc = DANGER_COLORS[loc.dangerLevel];
  const routes = levelData?.routes?.filter(r => r.origin === loc.id || r.destination === loc.id) || [];
  const allLocs = levelData?.locations || [];

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)" }} />
      <div onClick={e => e.stopPropagation()} style={{
        position: "relative", width: 360, maxWidth: "90vw", maxHeight: "80vh", overflowY: "auto",
        background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "24px 20px 20px", zIndex: 301,
        boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
      }}>
        <button onClick={onClose} style={{
          position: "absolute", top: 12, right: 14, background: "none", border: "none",
          color: C.dim, cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 4,
        }}>×</button>

        <h3 style={{ fontFamily: "'Cinzel', serif", fontSize: 18, fontWeight: 700,
          color: loc.status === "current" ? C.accent : C.heading, margin: "0 0 8px 0" }}>
          {loc.name}
        </h3>

        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          <span style={{ fontSize: 10, fontFamily: "'Alegreya Sans', sans-serif", fontWeight: 600,
            color: dc, background: `${dc}18`, padding: "2px 8px", borderRadius: 3, textTransform: "uppercase" }}>
            {loc.dangerLevel}
          </span>
          <span style={{ fontSize: 10, fontFamily: "'Alegreya Sans', sans-serif", fontWeight: 600,
            color: C.muted, background: `${C.muted}18`, padding: "2px 8px", borderRadius: 3, textTransform: "capitalize" }}>
            {loc.type}
          </span>
          {loc.controllingFaction && loc.controllingFaction !== "None" && (
            <span style={{ fontSize: 10, fontFamily: "'Alegreya Sans', sans-serif", fontWeight: 600,
              color: C.goldLabel, background: `${C.goldLabel}18`, padding: "2px 8px", borderRadius: 3 }}>
              {loc.controllingFaction}
            </span>
          )}
        </div>

        <p style={{ fontFamily: "'Alegreya Sans', sans-serif", fontSize: 14, color: C.text, lineHeight: 1.6, margin: "0 0 16px 0" }}>
          {loc.description}
        </p>

        {loc.services && loc.services.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: "'Alegreya Sans', sans-serif", fontSize: 10, fontWeight: 600,
              color: C.goldLabel, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
              Available Services
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {loc.services.map(s => (
                <span key={s} style={{ fontSize: 11, fontFamily: "'Alegreya Sans', sans-serif",
                  color: C.secondary, background: `${C.secondary}12`, padding: "2px 8px", borderRadius: 3, textTransform: "capitalize" }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {routes.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: "'Alegreya Sans', sans-serif", fontSize: 10, fontWeight: 600,
              color: C.goldLabel, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
              Routes
            </div>
            {routes.map(r => {
              const otherId = r.origin === loc.id ? r.destination : r.origin;
              const other = allLocs.find(l => l.id === otherId);
              const rdc = DANGER_COLORS[r.dangerLevel];
              return (
                <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 0",
                  fontFamily: "'Alegreya Sans', sans-serif", fontSize: 12 }}>
                  <span style={{ color: C.heading }}>{other?.name}</span>
                  <span style={{ color: C.dim, fontSize: 10 }}>·</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.secondary }}>
                    {r.travelDays}d
                  </span>
                  <span style={{ color: rdc, fontSize: 9, fontWeight: 600 }}>{r.dangerLevel}</span>
                  <span style={{ color: C.dim, fontSize: 10, fontStyle: "italic" }}>{r.terrain}</span>
                </div>
              );
            })}
          </div>
        )}

        <div>
          <div style={{ fontFamily: "'Alegreya Sans', sans-serif", fontSize: 10, fontWeight: 600,
            color: C.goldLabel, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
            Your Notes
          </div>
          <textarea
            placeholder="Add notes about this location..."
            defaultValue={loc.id === "warehouse-row" ? "Veymar unloading cargo here at midnight. Double-crescent crates." : ""}
            style={{
              width: "100%", minHeight: 48, background: C.inputBg, border: `1px solid ${C.border}`,
              borderRadius: 6, padding: "8px 10px", fontFamily: "'Alegreya Sans', sans-serif", fontSize: 13,
              color: C.text, outline: "none", resize: "vertical", boxSizing: "border-box", lineHeight: 1.5,
            }}
          />
        </div>
      </div>
    </div>
  );
}

// --- BREADCRUMB ---
function Breadcrumb({ path, onNavigate }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
      {path.map((crumb, i) => {
        const isLast = i === path.length - 1;
        return (
          <span key={crumb.key} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {i > 0 && <span style={{ color: C.dim, display: "flex" }}><ChevronIcon /></span>}
            <span
              onClick={() => { if (!isLast) onNavigate(crumb.key); }}
              style={{
                fontFamily: "'Alegreya Sans', sans-serif",
                fontSize: 11,
                fontWeight: isLast ? 600 : 400,
                color: isLast ? C.accent : C.dim,
                cursor: isLast ? "default" : "pointer",
                transition: "color 0.15s",
              }}
              onMouseEnter={e => { if (!isLast) e.target.style.color = C.accent; }}
              onMouseLeave={e => { if (!isLast) e.target.style.color = C.dim; }}
            >
              {crumb.label}
            </span>
          </span>
        );
      })}
    </div>
  );
}

// --- LEGEND ---
function MapLegend() {
  return (
    <div style={{
      display: "flex", flexWrap: "wrap", gap: 10, padding: "8px 0 2px",
      borderTop: `1px solid ${C.borderLight}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.accent, border: `1.5px solid ${C.accentBright}` }} />
        <span style={{ fontFamily: "'Alegreya Sans', sans-serif", fontSize: 9, color: C.dim }}>Current</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.secondary, border: "1px solid #5a6a88" }} />
        <span style={{ fontFamily: "'Alegreya Sans', sans-serif", fontSize: 9, color: C.dim }}>Visited</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: "transparent", border: "1.5px dashed #3a4a60" }} />
        <span style={{ fontFamily: "'Alegreya Sans', sans-serif", fontSize: 9, color: C.dim }}>Known</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <div style={{ width: 9, height: 9, borderRadius: "50%", border: "1px dashed #3a4a60", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 6, color: C.dim, fontWeight: 700 }}>+</span>
        </div>
        <span style={{ fontFamily: "'Alegreya Sans', sans-serif", fontSize: 9, color: C.dim }}>Zoomable</span>
      </div>
      <div style={{ width: "100%", height: 0 }} />
      {Object.entries(DANGER_COLORS).map(([level, color]) => (
        <div key={level} style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 14, height: 2, background: color, borderRadius: 1, opacity: 0.6 }} />
          <span style={{ fontFamily: "'Alegreya Sans', sans-serif", fontSize: 9, color: C.dim, textTransform: "capitalize" }}>{level}</span>
        </div>
      ))}
    </div>
  );
}

// --- LOCATION LIST ---
function LocationList({ locations, onSelect, onZoom }) {
  const statusOrder = { current: 0, visited: 1, discovered: 2 };
  const sorted = [...locations].sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

  return (
    <div style={{ marginTop: 6 }}>
      <div style={{
        fontFamily: "'Alegreya Sans', sans-serif", fontSize: 10, fontWeight: 600,
        color: C.goldLabel, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6,
      }}>
        Known Locations
      </div>
      {sorted.map(loc => {
        const isCurrent = loc.status === "current";
        const dc = DANGER_COLORS[loc.dangerLevel];
        return (
          <div key={loc.id}
            onClick={() => loc.hasChildren ? onZoom(loc.id) : onSelect(loc)}
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: "5px 4px",
              cursor: "pointer", borderRadius: 4, transition: "background 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = `${C.accent}08`)}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            <div style={{
              width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
              background: isCurrent ? C.accent : loc.status === "visited" ? C.secondary : "transparent",
              border: loc.status === "discovered" ? `1px dashed ${C.dim}` : `1px solid ${isCurrent ? C.accent : "#5a6a88"}`,
            }} />
            <span style={{
              fontFamily: "'Alegreya Sans', sans-serif", fontSize: 13, flex: 1,
              color: isCurrent ? C.accent : loc.status === "visited" ? C.heading : C.dim,
              fontWeight: isCurrent ? 600 : 400,
            }}>
              {loc.name}
            </span>
            {loc.hasChildren && (
              <span style={{ color: C.dim, display: "flex", opacity: 0.5 }}><ExpandIcon /></span>
            )}
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
              color: dc, opacity: 0.6, fontWeight: 600, textTransform: "uppercase",
            }}>
              {loc.dangerLevel}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// --- MAIN COMPONENT ---
export default function NodeMapV2() {
  const mapWidth = 340;
  const mapHeight = 280;

  // Navigation state
  const [currentLevel, setCurrentLevel] = useState("dockside-quarter");
  const [hoveredNode, setHoveredNode] = useState(null);
  const [hoveredRoute, setHoveredRoute] = useState(null);
  const [mousePos, setMousePos] = useState({ clientX: 0, clientY: 0 });
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [mapRect, setMapRect] = useState(null);
  const mapRef = useRef(null);

  // Current level data
  const levelData = ALL_LOCATIONS[currentLevel];
  const locations = levelData?.locations || [];
  const routes = levelData?.routes || [];

  // Compute layout
  const [positions, setPositions] = useState({});
  useEffect(() => {
    setPositions(computeLayout(locations, routes, mapWidth, mapHeight));
  }, [currentLevel]);

  // Update map rect
  useEffect(() => {
    if (mapRef.current) setMapRect(mapRef.current.getBoundingClientRect());
    const handleResize = () => { if (mapRef.current) setMapRect(mapRef.current.getBoundingClientRect()); };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Build breadcrumb path
  const buildPath = (levelId) => {
    const path = [];
    let id = levelId;
    while (id) {
      const lvl = ALL_LOCATIONS[id];
      if (lvl) {
        path.unshift({ key: id, label: lvl.label });
        id = lvl.parent;
      } else break;
    }
    return path;
  };
  const breadcrumbs = buildPath(currentLevel);

  const canZoomOut = levelData?.parent != null;
  const zoomInTarget = locations.find(l => l.status === "current" && l.hasChildren && ALL_LOCATIONS[l.id]);
  const canZoomIn = !!zoomInTarget;

  const handleZoomIn = (locId) => {
    if (ALL_LOCATIONS[locId]) {
      setHoveredNode(null);
      setHoveredRoute(null);
      setCurrentLevel(locId);
    }
  };

  const handleZoomOut = () => {
    if (levelData?.parent) {
      setHoveredNode(null);
      setHoveredRoute(null);
      setCurrentLevel(levelData.parent);
    }
  };

  const handleNodeClick = (loc) => {
    if (loc.hasChildren && ALL_LOCATIONS[loc.id]) {
      handleZoomIn(loc.id);
    } else {
      setSelectedEntity(loc);
    }
  };

  const handleMouseMove = useCallback((e) => {
    setMousePos({ clientX: e.clientX, clientY: e.clientY });
  }, []);

  const hoveredLoc = hoveredNode ? locations.find(l => l.id === hoveredNode) : null;
  const hoveredRouteObj = hoveredRoute ? routes.find(r => r.id === hoveredRoute) : null;
  const layoutReady = Object.keys(positions).length === locations.length;

  // Find current location name across all levels
  const findCurrentName = () => {
    for (const key in ALL_LOCATIONS) {
      const loc = ALL_LOCATIONS[key].locations?.find(l => l.status === "current" && !l.hasChildren);
      if (loc) return loc.name;
    }
    return "Unknown";
  };

  return (
    <div style={{
      width: 380, minHeight: "100vh", background: C.panelBg,
      fontFamily: "'Alegreya Sans', sans-serif", color: C.text,
    }}>
      <style>{fonts}</style>

      {/* Simulated tab bar */}
      <div style={{
        padding: "14px 16px 10px", borderBottom: `1px solid ${C.borderLight}`, display: "flex", gap: 12,
      }}>
        {["Character", "Inventory", "NPCs", "Glossary", "Map", "Notes"].map(tab => (
          <span key={tab} style={{
            fontFamily: "'Cinzel', serif", fontSize: 10, fontWeight: tab === "Map" ? 700 : 500,
            letterSpacing: "0.06em", color: tab === "Map" ? C.accent : C.dim,
            borderBottom: tab === "Map" ? `2px solid ${C.accent}` : "2px solid transparent",
            paddingBottom: 6, cursor: "pointer",
          }}>{tab}</span>
        ))}
      </div>

      <div style={{ padding: "12px 16px" }}>
        {/* Current location */}
        <div style={{ fontFamily: "'Alegreya Sans', sans-serif", fontSize: 13, color: C.muted, marginBottom: 8 }}>
          📍 Current: <span style={{ color: C.accent, fontWeight: 600 }}>{findCurrentName()}</span>
        </div>

        {/* Breadcrumb */}
        <Breadcrumb path={breadcrumbs} onNavigate={(key) => setCurrentLevel(key)} />

        {/* Map canvas */}
        <div ref={mapRef} onMouseMove={handleMouseMove} style={{
          position: "relative", width: mapWidth, height: mapHeight,
          minWidth: mapWidth, minHeight: mapHeight, maxWidth: mapWidth, maxHeight: mapHeight,
          background: C.bg, borderRadius: 8, border: `1px solid ${C.border}`,
          overflow: "hidden",
        }}>
          {layoutReady && (
            <svg width={mapWidth} height={mapHeight}>
              {/* Grid */}
              {[0.2, 0.4, 0.6, 0.8].map(pct => (
                <g key={pct}>
                  <line x1={mapWidth * pct} y1={0} x2={mapWidth * pct} y2={mapHeight}
                    stroke={C.heading} strokeWidth="0.3" opacity="0.04" />
                  <line x1={0} y1={mapHeight * pct} x2={mapWidth} y2={mapHeight * pct}
                    stroke={C.heading} strokeWidth="0.3" opacity="0.04" />
                </g>
              ))}

              {/* Routes */}
              {routes.map(route => (
                <g key={route.id}
                  onMouseEnter={() => setHoveredRoute(route.id)}
                  onMouseLeave={() => setHoveredRoute(null)}
                  style={{ cursor: "pointer" }}
                >
                  <line
                    x1={positions[route.origin]?.x} y1={positions[route.origin]?.y}
                    x2={positions[route.destination]?.x} y2={positions[route.destination]?.y}
                    stroke="transparent" strokeWidth="12"
                  />
                  <MapRoute route={route} positions={positions} isHovered={hoveredRoute === route.id} />
                </g>
              ))}

              {/* Nodes */}
              {locations.map(loc => (
                <MapNode key={loc.id} loc={loc}
                  x={positions[loc.id]?.x || 0} y={positions[loc.id]?.y || 0}
                  isHovered={hoveredNode === loc.id}
                  onHover={() => { setHoveredNode(loc.id); setHoveredRoute(null); }}
                  onLeave={() => setHoveredNode(null)}
                  onClick={() => handleNodeClick(loc)}
                />
              ))}
            </svg>
          )}

          {/* Zoom controls */}
          <div style={{
            position: "absolute", top: 8, right: 8, display: "flex", flexDirection: "column", gap: 2,
          }}>
            <button
              onClick={() => { if (canZoomIn) handleZoomIn(zoomInTarget.id); }}
              title="Zoom in"
              disabled={!canZoomIn}
              style={{
                width: 28, height: 28, borderRadius: "4px 4px 0 0", display: "flex",
                alignItems: "center", justifyContent: "center",
                background: C.cardBg, border: `1px solid ${C.border}`, color: canZoomIn ? C.dim : "#2a3050",
                cursor: canZoomIn ? "pointer" : "default",
                transition: "all 0.15s", borderBottom: "none",
              }}
              onMouseEnter={e => { if (canZoomIn) { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; } }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = canZoomIn ? C.dim : "#2a3050"; }}
            >
              <ZoomInIcon />
            </button>
            <button
              onClick={() => { if (canZoomOut) handleZoomOut(); }}
              title="Zoom out"
              disabled={!canZoomOut}
              style={{
                width: 28, height: 28, borderRadius: "0 0 4px 4px", display: "flex",
                alignItems: "center", justifyContent: "center",
                background: C.cardBg, border: `1px solid ${C.border}`, color: canZoomOut ? C.dim : "#2a3050",
                cursor: canZoomOut ? "pointer" : "default",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { if (canZoomOut) { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; } }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = canZoomOut ? C.dim : "#2a3050"; }}
            >
              <ZoomOutIcon />
            </button>
          </div>

          {/* Level label */}
          <div style={{
            position: "absolute", bottom: 6, left: 8,
            fontFamily: "'Cinzel', serif", fontSize: 9, fontWeight: 600,
            color: C.goldLabel, letterSpacing: "0.1em", opacity: 0.6,
          }}>
            {levelData?.label}
          </div>
        </div>

        {/* Legend */}
        <MapLegend />

        {/* Location list */}
        <LocationList locations={locations} onSelect={setSelectedEntity} onZoom={handleZoomIn} />
      </div>

      {/* Tooltip — rendered at fixed position, outside map */}
      {(hoveredLoc || hoveredRouteObj) && (
        <Tooltip
          data={hoveredLoc || hoveredRouteObj}
          type={hoveredRouteObj ? "route" : "location"}
          mousePos={mousePos}
          mapRect={mapRect}
        />
      )}

      {/* Entity popup */}
      {selectedEntity && (
        <EntityPopup loc={selectedEntity} levelData={levelData} onClose={() => setSelectedEntity(null)} />
      )}
    </div>
  );
}
