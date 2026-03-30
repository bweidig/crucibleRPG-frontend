'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import * as api from '@/lib/api';
import styles from './MapTab.module.css';
import sidebarStyles from './Sidebar.module.css';

// =============================================================================
// Constants
// =============================================================================

const DANGER_COLORS = {
  safe: '#8aba7a', low: '#8a94a8', moderate: '#e8c45a', high: '#e8845a', extreme: '#e85a5a',
};

const TERRAIN_DASH = {
  road: 'none', trail: '6,4', wilderness: '2,4', mountain: '8,3,2,3',
  water: '10,4', underground: '4,4', urban: 'none',
};

function getDangerColor(level) {
  if (typeof level === 'string') return DANGER_COLORS[level] || '#8a94a8';
  if (level == null || level === 0) return '#8aba7a';
  if (level === 1) return '#8a94a8';
  if (level === 2) return '#e8c45a';
  if (level === 3) return '#e8845a';
  return '#e85a5a';
}

function getDangerLabel(level) {
  if (typeof level === 'string') return level;
  if (level == null || level === 0) return 'safe';
  if (level === 1) return 'low';
  if (level === 2) return 'moderate';
  if (level === 3) return 'high';
  return 'extreme';
}

// =============================================================================
// Force-Directed Layout
// =============================================================================

function computeLayout(locations, routes, width, height) {
  if (!locations.length) return {};
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.30;
  const pos = {};

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
    idealLen: Math.max(55, (r.travelDays || 1) * 38 + 45),
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
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = repulsion / (dist * dist);
        const fx = (dx / dist) * force, fy = (dy / dist) * force;
        a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy;
      }
    }

    for (const edge of edges) {
      const a = pos[edge.source], b = pos[edge.target];
      if (!a || !b) continue;
      const dx = b.x - a.x, dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
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

// =============================================================================
// SVG Components
// =============================================================================

function MapRoute({ route, positions, isHovered }) {
  const start = positions[route.origin];
  const end = positions[route.destination];
  if (!start || !end) return null;

  const dangerColor = getDangerColor(route.dangerLevel);
  const dashArray = TERRAIN_DASH[route.terrain] || 'none';
  const mx = (start.x + end.x) / 2;
  const my = (start.y + end.y) / 2;
  const dx = end.x - start.x, dy = end.y - start.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = -dy / len, ny = dx / len;

  return (
    <g>
      <line
        x1={start.x} y1={start.y} x2={end.x} y2={end.y}
        stroke={dangerColor}
        strokeWidth={isHovered ? 2.2 : 1.2}
        strokeDasharray={dashArray}
        opacity={isHovered ? 0.85 : route.known ? 0.35 : 0.15}
        strokeLinecap="round"
        style={{ transition: 'opacity 0.2s, stroke-width 0.2s' }}
      />
      {!route.known && (
        <text x={mx} y={my - 9} textAnchor="middle" fill={dangerColor} fontSize="8"
          fontFamily="'JetBrains Mono', monospace" opacity="0.4">?</text>
      )}
      <text
        x={mx + nx * 9} y={my + ny * 9}
        textAnchor="middle" dominantBaseline="central"
        fill={dangerColor} fontSize="8"
        fontFamily="'JetBrains Mono', monospace" fontWeight="500"
        opacity={isHovered ? 0.9 : 0.45}
        style={{ transition: 'opacity 0.2s', pointerEvents: 'none' }}
      >
        {route.travelDays}d
      </text>
    </g>
  );
}

function MapNode({ loc, x, y, isHovered, onHover, onLeave, onClick }) {
  const isCurrent = loc.status === 'current';
  const isVisited = loc.status === 'visited';
  const isDiscovered = loc.status === 'discovered';
  const hasKids = loc.hasChildren;
  const nodeSize = isCurrent ? 16 : isVisited ? 12 : 9;
  const fillColor = isCurrent ? '#c9a84c' : isVisited ? '#8a94a8' : 'transparent';
  const strokeColor = isCurrent ? '#ddb84e' : isVisited ? '#5a6a88' : '#3a4a60';
  const labelColor = isCurrent ? '#c9a84c' : isVisited ? '#8a94a8' : '#6b83a3';

  return (
    <g style={{ cursor: 'pointer' }} onMouseEnter={onHover} onMouseLeave={onLeave} onClick={onClick}>
      {isCurrent && (
        <circle cx={x} cy={y} r={14} fill="none" stroke="#c9a84c" strokeWidth="1" opacity="0.2">
          <animate attributeName="r" values="12;16;12" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.2;0.08;0.2" dur="3s" repeatCount="indefinite" />
        </circle>
      )}
      {isHovered && (
        <circle cx={x} cy={y} r={nodeSize / 2 + 6} fill="none" stroke="#c9a84c" strokeWidth="1" opacity="0.3" />
      )}
      {hasKids && !isCurrent && (
        <circle cx={x} cy={y} r={nodeSize / 2 + 3} fill="none"
          stroke={isHovered ? '#c9a84c' : strokeColor}
          strokeWidth="0.8" strokeDasharray="3,2"
          opacity={isHovered ? 0.5 : 0.25} />
      )}
      <circle cx={x} cy={y} r={nodeSize / 2}
        fill={fillColor}
        stroke={isHovered ? '#c9a84c' : strokeColor}
        strokeWidth={isCurrent ? 2 : isDiscovered ? 1.5 : 1}
        strokeDasharray={isDiscovered ? '2,2' : 'none'}
      />
      {isCurrent && <circle cx={x} cy={y} r={2.5} fill="#0a0e1a" />}
      {hasKids && (
        <g transform={`translate(${x + nodeSize / 2 + 3}, ${y - nodeSize / 2 - 3})`}>
          <circle cx="0" cy="0" r="5" fill="#111528" stroke={isHovered ? '#c9a84c' : '#1e2540'} strokeWidth="0.8" />
          <text x="0" y="0.5" textAnchor="middle" dominantBaseline="central"
            fill={isHovered ? '#c9a84c' : '#6b83a3'}
            fontSize="7" fontFamily="'JetBrains Mono', monospace" fontWeight="700">+</text>
        </g>
      )}
      <text x={x} y={y + nodeSize / 2 + 13} textAnchor="middle"
        fill={isHovered ? '#c9a84c' : labelColor} fontSize="9.5"
        fontFamily="'Alegreya Sans', sans-serif"
        fontWeight={isCurrent ? 700 : isVisited ? 500 : 400}
        style={{ transition: 'fill 0.15s', pointerEvents: 'none' }}
      >
        {loc.name}
      </text>
    </g>
  );
}

// =============================================================================
// Tooltip
// =============================================================================

function Tooltip({ data, type, mousePos }) {
  if (!data) return null;

  const tooltipWidth = 210;
  let tx = mousePos.clientX + 14;
  let ty = mousePos.clientY - 12;
  if (tx + tooltipWidth > window.innerWidth - 10) tx = mousePos.clientX - tooltipWidth - 14;
  if (ty < 10) ty = 10;
  if (ty + 100 > window.innerHeight - 10) ty = window.innerHeight - 120;

  if (type === 'route') {
    const dc = getDangerColor(data.dangerLevel);
    return (
      <div className={styles.tooltip} style={{ left: tx, top: ty, borderColor: `${dc}33` }}>
        <div className={styles.tooltipMeta}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
            color: '#d0c098',
          }}>
            {data.travelDays} day{data.travelDays > 1 ? 's' : ''}
          </span>
          <span className={styles.tooltipBadge} style={{ color: dc, background: `${dc}18` }}>
            {getDangerLabel(data.dangerLevel)}
          </span>
          <span className={styles.tooltipType}>{data.terrain}</span>
        </div>
        {!data.known && (
          <div style={{ fontFamily: "'Alegreya', serif", fontSize: 9, color: '#e8c45a', fontStyle: 'italic' }}>
            Unconfirmed route
          </div>
        )}
      </div>
    );
  }

  const loc = data;
  const dc = getDangerColor(loc.dangerLevel);

  return (
    <div className={styles.tooltip} style={{ left: tx, top: ty }}>
      <div className={styles.tooltipTitle} style={{ color: loc.status === 'current' ? '#c9a84c' : '#d0c098' }}>
        {loc.name}
      </div>
      <div className={styles.tooltipMeta}>
        <span className={styles.tooltipBadge} style={{ color: dc, background: `${dc}18` }}>
          {getDangerLabel(loc.dangerLevel)}
        </span>
        <span className={styles.tooltipType}>{loc.type}</span>
      </div>
      {loc.controllingFaction && (
        <div style={{ fontSize: 10, fontFamily: "'Alegreya Sans', sans-serif", color: '#7082a4' }}>
          Controlled by {loc.controllingFaction}
        </div>
      )}
      {loc.hasChildren && <div className={styles.tooltipHint}>Click to explore inside</div>}
    </div>
  );
}

// =============================================================================
// Legend
// =============================================================================

function MapLegend() {
  return (
    <div className={styles.legend}>
      <div className={styles.legendItem}>
        <div className={styles.legendDot} style={{ background: '#c9a84c', border: '1.5px solid #ddb84e' }} />
        <span className={styles.legendLabel}>Current</span>
      </div>
      <div className={styles.legendItem}>
        <div className={styles.legendDot} style={{ background: '#8a94a8', border: '1px solid #5a6a88' }} />
        <span className={styles.legendLabel}>Visited</span>
      </div>
      <div className={styles.legendItem}>
        <div className={styles.legendDot} style={{ background: 'transparent', border: '1.5px dashed #3a4a60' }} />
        <span className={styles.legendLabel}>Known</span>
      </div>
      <div className={styles.legendBreak} />
      {Object.entries(DANGER_COLORS).map(([level, color]) => (
        <div key={level} className={styles.legendItem}>
          <div className={styles.legendLine} style={{ background: color }} />
          <span className={styles.legendLabel} style={{ textTransform: 'capitalize' }}>{level}</span>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// Location List
// =============================================================================

function LocationList({ locations, onSelect, onZoom }) {
  const statusOrder = { current: 0, visited: 1, discovered: 2 };
  const sorted = [...locations].sort((a, b) => (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3));

  return (
    <div>
      <div className={styles.locationListHeader}>Known Locations</div>
      {sorted.map(loc => {
        const isCurrent = loc.status === 'current';
        const dc = getDangerColor(loc.dangerLevel);
        const dotBg = isCurrent ? '#c9a84c' : loc.status === 'visited' ? '#8a94a8' : 'transparent';
        const dotBorder = loc.status === 'discovered'
          ? '1px dashed #6b83a3'
          : `1px solid ${isCurrent ? '#c9a84c' : '#5a6a88'}`;

        return (
          <div key={loc.id} className={styles.locationListItem}
            onClick={() => loc.hasChildren ? onZoom(loc.id) : onSelect(loc)}
          >
            <div className={styles.locationListDot} style={{ background: dotBg, border: dotBorder }} />
            <span className={styles.locationListName} style={{
              color: isCurrent ? '#c9a84c' : loc.status === 'visited' ? '#d0c098' : '#6b83a3',
              fontWeight: isCurrent ? 600 : 400,
            }}>
              {loc.name}
            </span>
            <span className={styles.locationListDanger} style={{ color: dc }}>
              {getDangerLabel(loc.dangerLevel)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// =============================================================================
// SVG Icons
// =============================================================================

function ZoomInIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );
}

function ZoomOutIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function ResetViewIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="2" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
    </svg>
  );
}

// =============================================================================
// Main MapTab Component
// =============================================================================

export default function MapTab({ data: initialData, gameId, onEntityClick }) {
  const [mapData, setMapData] = useState(initialData);
  const [currentLevel, setCurrentLevel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [hoveredRoute, setHoveredRoute] = useState(null);
  const [mousePos, setMousePos] = useState({ clientX: 0, clientY: 0 });
  const [positions, setPositions] = useState({});
  const [dims, setDims] = useState({ width: 320, height: 450 });
  const containerRef = useRef(null);

  // ─── Viewport zoom / pan state ───
  const [zoom, setZoom] = useState(1.0);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStartRef = useRef(null);

  const resetView = useCallback(() => {
    setZoom(1.0);
    setPanX(0);
    setPanY(0);
  }, []);

  // Update from props when at top level
  useEffect(() => {
    if (initialData && !currentLevel) {
      setMapData(initialData);
    }
  }, [initialData, currentLevel]);

  // Measure container width for responsive SVG
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const w = Math.floor(entry.contentRect.width);
        const h = Math.floor(entry.contentRect.height);
        if (w > 0 && h > 0) setDims({ width: w, height: Math.max(h, 450) });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const locations = Array.isArray(mapData?.locations) ? mapData.locations : [];
  const routes = Array.isArray(mapData?.routes) ? mapData.routes : [];

  // Compute layout when data or dimensions change
  useEffect(() => {
    if (locations.length > 0 && dims.width > 0) {
      setPositions(computeLayout(locations, routes, dims.width, dims.height));
    }
  }, [mapData, dims.width, dims.height]);

  // ─── Mouse wheel zoom (non-passive to allow preventDefault) ───
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e) => {
      e.preventDefault();
      const step = e.deltaY > 0 ? -0.15 : 0.15;
      const newZoom = Math.max(0.5, Math.min(3.0, zoom + step));
      if (newZoom === zoom) return;

      // Zoom toward cursor position
      const rect = el.getBoundingClientRect();
      const mouseRelX = e.clientX - rect.left;
      const mouseRelY = e.clientY - rect.top;
      const vw = dims.width / zoom;
      const vh = dims.height / zoom;
      const svgX = panX + (mouseRelX / rect.width) * vw;
      const svgY = panY + (mouseRelY / rect.height) * vh;
      const newVw = dims.width / newZoom;
      const newVh = dims.height / newZoom;
      setPanX(svgX - (mouseRelX / rect.width) * newVw);
      setPanY(svgY - (mouseRelY / rect.height) * newVh);
      setZoom(newZoom);
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [zoom, panX, panY, dims]);

  // ─── Click-and-drag to pan ───
  const handleCanvasMouseDown = useCallback((e) => {
    // Only pan when zoomed in past 1x, and only on left button
    if (zoom <= 1.0 || e.button !== 0) return;
    e.preventDefault();
    setDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY, panX, panY };
  }, [zoom, panX, panY]);

  const handleCanvasMouseMove = useCallback((e) => {
    setMousePos({ clientX: e.clientX, clientY: e.clientY });
    if (!dragging || !dragStartRef.current) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    const vw = dims.width / zoom;
    const vh = dims.height / zoom;
    setPanX(dragStartRef.current.panX - (dx / rect.width) * vw);
    setPanY(dragStartRef.current.panY - (dy / rect.height) * vh);
  }, [dragging, zoom, dims]);

  const handleCanvasMouseUp = useCallback(() => {
    setDragging(false);
    dragStartRef.current = null;
  }, []);

  // Release drag if mouse leaves the window
  useEffect(() => {
    if (!dragging) return;
    const handleUp = () => { setDragging(false); dragStartRef.current = null; };
    document.addEventListener('mouseup', handleUp);
    return () => document.removeEventListener('mouseup', handleUp);
  }, [dragging]);

  // Navigate to a sub-level or back to top
  const navigateToLevel = useCallback(async (levelId) => {
    if (!gameId) return;
    setLoading(true);
    setHoveredNode(null);
    setHoveredRoute(null);
    resetView();
    try {
      const path = levelId
        ? `/api/game/${gameId}/map?level=${levelId}`
        : `/api/game/${gameId}/map`;
      const data = await api.get(path);
      setMapData(data);
      setCurrentLevel(levelId || null);
    } catch (err) {
      console.error('Failed to load map level:', err);
    } finally {
      setLoading(false);
    }
  }, [gameId, resetView]);

  const handleNodeClick = useCallback((loc) => {
    if (dragging) return; // Don't trigger clicks during drag
    if (loc.hasChildren) {
      navigateToLevel(loc.id);
    } else {
      onEntityClick?.({ term: loc.name, type: 'location', id: loc.id });
    }
  }, [navigateToLevel, onEntityClick, dragging]);

  // Build breadcrumbs from API response or navigation state
  const breadcrumbs = Array.isArray(mapData?.breadcrumbs) ? mapData.breadcrumbs : [];
  const canZoomOut = mapData?.parent != null;
  const zoomInTarget = locations.find(l => l.status === 'current' && l.hasChildren);
  const canZoomIn = !!zoomInTarget;
  const currentLocName = locations.find(l => l.status === 'current')?.name;
  const layoutReady = Object.keys(positions).length === locations.length && locations.length > 0;

  const hoveredLoc = hoveredNode != null ? locations.find(l => l.id === hoveredNode) : null;
  const hoveredRouteObj = hoveredRoute != null ? routes.find(r => r.id === hoveredRoute) : null;

  // Loading/empty states
  if (!mapData) {
    return <div className={sidebarStyles.loadingState}>Loading map...</div>;
  }
  if (locations.length === 0 && !loading) {
    return <div className={sidebarStyles.emptyState}>No locations discovered yet.</div>;
  }

  return (
    <div className={styles.container}>
      {/* Current location */}
      {currentLocName && (
        <div className={styles.currentLocation}>
          Current: <span className={styles.currentLocationName}>{currentLocName}</span>
        </div>
      )}

      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <div className={styles.breadcrumbs}>
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.id ?? i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {i > 0 && <span className={styles.breadcrumbSep}><ChevronIcon /></span>}
              <button
                className={styles.breadcrumbItem}
                onClick={() => navigateToLevel(crumb.id || null)}
              >
                {crumb.name || crumb.label}
              </button>
            </span>
          ))}
          {mapData.label && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span className={styles.breadcrumbSep}><ChevronIcon /></span>
              <span className={styles.breadcrumbCurrent}>{mapData.label}</span>
            </span>
          )}
        </div>
      )}

      {/* Map canvas */}
      <div
        ref={containerRef}
        className={
          dragging ? styles.mapCanvasGrabbing
            : zoom > 1.0 ? styles.mapCanvasGrab
            : styles.mapCanvas
        }
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
      >
        {loading && <div className={styles.loadingOverlay}>Loading...</div>}
        {layoutReady && !loading && (
          <svg
            className={styles.mapSvg}
            viewBox={`${panX} ${panY} ${dims.width / zoom} ${dims.height / zoom}`}
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Grid lines */}
            {[0.2, 0.4, 0.6, 0.8].map(pct => (
              <g key={pct}>
                <line x1={dims.width * pct} y1={0} x2={dims.width * pct} y2={dims.height}
                  stroke="#d0c098" strokeWidth="0.3" opacity="0.04" />
                <line x1={0} y1={dims.height * pct} x2={dims.width} y2={dims.height * pct}
                  stroke="#d0c098" strokeWidth="0.3" opacity="0.04" />
              </g>
            ))}

            {/* Routes (hit area + visible line) */}
            {routes.map(route => (
              <g key={route.id}
                onMouseEnter={() => { if (!dragging) setHoveredRoute(route.id); }}
                onMouseLeave={() => setHoveredRoute(null)}
                style={{ cursor: dragging ? undefined : 'pointer' }}
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
                onHover={() => { if (!dragging) { setHoveredNode(loc.id); setHoveredRoute(null); } }}
                onLeave={() => setHoveredNode(null)}
                onClick={() => handleNodeClick(loc)}
              />
            ))}
          </svg>
        )}

        {/* Zoom controls */}
        <div className={styles.zoomControls}>
          <button
            className={styles.zoomBtn}
            onClick={() => { if (canZoomIn) navigateToLevel(zoomInTarget.id); }}
            disabled={!canZoomIn}
            title="Drill into location"
          >
            <ZoomInIcon />
          </button>
          <button
            className={styles.zoomBtn}
            onClick={() => { if (canZoomOut) navigateToLevel(mapData.parent); }}
            disabled={!canZoomOut}
            title="Zoom out to parent"
          >
            <ZoomOutIcon />
          </button>
          <button
            className={styles.zoomBtn}
            onClick={resetView}
            disabled={zoom === 1.0 && panX === 0 && panY === 0}
            title="Reset view"
          >
            <ResetViewIcon />
          </button>
        </div>

        {/* Level label + zoom indicator */}
        <div className={styles.levelLabel}>
          {mapData.label}
          {zoom !== 1.0 && (
            <span style={{ marginLeft: 8, fontFamily: "'JetBrains Mono', monospace" }}>
              {zoom.toFixed(1)}x
            </span>
          )}
        </div>
      </div>

      {/* Legend */}
      <MapLegend />

      {/* Location list */}
      <LocationList
        locations={locations}
        onSelect={(loc) => onEntityClick?.({ term: loc.name, type: 'location', id: loc.id })}
        onZoom={navigateToLevel}
      />

      {/* Tooltip (fixed position, escapes sidebar) */}
      {(hoveredLoc || hoveredRouteObj) && (
        <Tooltip
          data={hoveredLoc || hoveredRouteObj}
          type={hoveredRouteObj ? 'route' : 'location'}
          mousePos={mousePos}
        />
      )}
    </div>
  );
}
