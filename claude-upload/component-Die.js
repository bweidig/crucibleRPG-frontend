import React, { useId, useMemo } from 'react';
import styles from './Die.module.css';

// ─── Hex geometry ───
// viewBox 0..100, center at (50, 50), hex radius 48.
// Six vertices at angles (π/3)·i − π/2 (pointy top).
const CENTER = { x: 50, y: 50 };
const RADIUS = 48;

function hexVertex(i) {
  const a = (Math.PI / 3) * i - Math.PI / 2;
  return { x: CENTER.x + RADIUS * Math.cos(a), y: CENTER.y + RADIUS * Math.sin(a) };
}

const VERTS = Array.from({ length: 6 }, (_, i) => hexVertex(i));
const HEX_POINTS = VERTS.map(v => `${v.x.toFixed(2)},${v.y.toFixed(2)}`).join(' ');
// Six triangular facets from center to each pair of adjacent vertices
const FACETS = VERTS.map((v, i) => {
  const next = VERTS[(i + 1) % 6];
  return `${CENTER.x},${CENTER.y} ${v.x.toFixed(2)},${v.y.toFixed(2)} ${next.x.toFixed(2)},${next.y.toFixed(2)}`;
});
// Upper-left edge highlight — vertices 4 → 5 → 0 → 1
const HIGHLIGHT_POINTS = [VERTS[4], VERTS[5], VERTS[0], VERTS[1]]
  .map(v => `${v.x.toFixed(2)},${v.y.toFixed(2)}`).join(' ');

// ─── Palette per state ───
// Each gradient is rendered inline via <defs> with an instance-unique id.

const GRADIENTS = {
  default:    { from: '#131a2c', to: '#0e1322' },
  ready:      { from: '#181f34', to: '#11172a' }, // faint warm gold tint
  kept:       { from: '#1a1a10', to: '#141218' },
  crit:       { from: '#2a2010', to: '#1a1508' },
  fumble:     { from: '#1a1015', to: '#140e12' },
  discarded:  { from: '#111318', to: '#0d0f14' },
};

function gradientKey(state) {
  if (state === 'kept') return 'kept';
  if (state === 'crit') return 'crit';
  if (state === 'fumble') return 'fumble';
  if (state === 'discarded') return 'discarded';
  if (state === 'ready') return 'ready';
  return 'default';
}

function edgeStroke(state) {
  if (state === 'crit') return '#e8c870';
  if (state === 'fumble') return '#e85a5a';
  if (state === 'kept') return '#c9a84c';
  if (state === 'discarded') return '#2e3240';
  if (state === 'ready') return '#5a4f30';
  return '#2a3048';
}

function numberColor(state) {
  if (state === 'crit') return '#fff5d4';
  if (state === 'fumble') return '#ffd0c4';
  if (state === 'kept') return '#e8c870';
  if (state === 'discarded') return '#7a7060';
  return '#c8c0b0';
}

function numberStroke(state) {
  // Dark stroke for crisp separation against the gradient facet
  return state === 'discarded' ? '#141414' : '#0a0e1a';
}

// ─── Die component ───

export default function Die({
  n,
  size = 80,
  state = 'default',
  onClick,
}) {
  const uid = useId();
  const gradId = `dieGrad-${uid}`.replace(/[:#]/g, '');
  const gKey = gradientKey(state);
  const { from, to } = GRADIENTS[gKey];

  const interactive = state === 'ready' && typeof onClick === 'function';
  const display = state === 'ready' ? 20 : n;

  // State-driven wrapper class for CSS animations (float/throw/tumble/land/etc).
  const stateClass = useMemo(() => {
    switch (state) {
      case 'ready':          return styles.stateReady;
      case 'throw':          return styles.stateThrow;
      case 'tumble':         return styles.stateTumble;
      case 'land':           return styles.stateLand;
      case 'kept':           return styles.stateKept;
      case 'discarded':      return styles.stateDiscarded;
      case 'crit':           return styles.stateCrit;
      case 'fumble':         return styles.stateFumble;
      case 'drop-in':        return styles.stateDropIn;
      case 'crucible-exit':  return styles.stateCrucibleExit;
      default:               return '';
    }
  }, [state]);

  const hideNumber = state === 'throw' || state === 'tumble' || state === 'drop-in';

  return (
    <div
      className={`${styles.die} ${stateClass} ${interactive ? styles.dieInteractive : ''}`}
      style={{ width: size, height: size }}
      onClick={interactive ? onClick : undefined}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? 'Throw the Crucible die' : undefined}
      onKeyDown={interactive ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); }
      } : undefined}
    >
      <svg viewBox="0 0 100 100" width={size} height={size} className={styles.svg}>
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
        {/* Base hex filled with gradient */}
        <polygon points={HEX_POINTS} fill={`url(#${gradId})`} stroke={edgeStroke(state)} strokeWidth="1.5" strokeLinejoin="round" />
        {/* Interior triangle facets — subtle separator strokes */}
        {FACETS.map((pts, i) => (
          <polygon key={i} points={pts} fill="none" stroke="#00000022" strokeWidth="0.6" />
        ))}
        {/* Upper-left edge highlight suggesting overhead light */}
        <polyline
          points={HIGHLIGHT_POINTS}
          fill="none"
          stroke={state === 'kept' || state === 'crit' ? '#f0d490' : '#ffffff22'}
          strokeWidth={state === 'kept' || state === 'crit' ? 1.2 : 0.9}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {!hideNumber && (
          <text
            x="50"
            y="50"
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily="var(--font-cinzel)"
            fontWeight="700"
            fontSize="38"
            fill={numberColor(state)}
            stroke={numberStroke(state)}
            strokeWidth="0.8"
            paintOrder="stroke"
            opacity={state === 'ready' ? 0.3 : 1}
          >
            {display}
          </text>
        )}
      </svg>
    </div>
  );
}
