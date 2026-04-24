'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './ParticleField.module.css';

const EMBER_COLORS = ["#c9a84c", "#d4a94e", "#e8a840", "#d4845a", "#c0924a", "#ddb84e"];

// Depth layer config: max parallax shift in px (opposite to cursor)
const LAYERS = [
  { maxShift: 1 },   // far (smallest particles)
  { maxShift: 2 },   // mid
  { maxShift: 3 },   // near (largest particles)
];

// Per-layer cap for scroll-coupled drift (px). Larger than mouse parallax so
// the scroll parallax is easier to feel during a gesture but still bounded —
// a fast flick shouldn't fling particles across the viewport.
const LAYER_SCROLL_MAX = [2, 5, 8];

// Exponential velocity decay per frame. 0.92^50 ≈ 0.015, so drift fades
// from visible to nothing in roughly 0.8s at 60fps after scrolling stops.
const SCROLL_DECAY = 0.92;

// Reference scroll speed (px/frame) that fully engages each layer's cap.
// Tuned so a typical wheel tick and most trackpad flicks land near or past
// the cap, while slower scrolls still get proportional parallax.
const SCROLL_VEL_REFERENCE = 10;

const DEADZONE = 180; // px from viewport center — ignore small movements

function assignLayer(size) {
  if (size < 1.4) return 0;      // far
  if (size < 2.2) return 1;      // mid
  return 2;                       // near
}

// Roll a particle into one of three visual tiers. The weighting (70/20/10)
// is what gives the field its "mostly atmospheric dust with a few warm
// standouts" feel instead of a uniform scatter of similarly-sized dots.
function rollParticleTier() {
  const r = Math.random();
  if (r < 0.70) return 'dust';
  if (r < 0.90) return 'mote';
  return 'ember';
}

function randInRange(min, max) { return Math.random() * (max - min) + min; }

export default function ParticleField({ count = 35 }) {
  const [particles] = useState(() => {
    const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
    const effectiveCount = isMobile ? Math.min(count, 20) : count;
    return Array.from({ length: effectiveCount }, (_, i) => {
      const color = EMBER_COLORS[Math.floor(Math.random() * EMBER_COLORS.length)];
      const tier = rollParticleTier();

      // Tier-specific ranges: dust is small/faint and stays still; motes are
      // mid-sized with an occasional twinkle; embers are the rare standouts
      // that get a blur, a warm glow, and almost always twinkle.
      let size, opacity, twinkleChance, blur, glow;
      if (tier === 'dust') {
        size = randInRange(0.5, 1.3);
        opacity = randInRange(0.04, 0.12);
        twinkleChance = 0;
        blur = false;
        glow = false;
      } else if (tier === 'mote') {
        size = randInRange(1.3, 2.4);
        opacity = randInRange(0.12, 0.25);
        twinkleChance = 0.30;
        blur = false;
        glow = false;
      } else {
        size = randInRange(2.4, 3.8);
        opacity = randInRange(0.25, 0.45);
        twinkleChance = 0.80;
        blur = true;
        glow = true;
      }

      const floatDur = Math.random() * 14 + 6;
      const floatDelay = Math.random() * 10;
      const hasTwinkle = Math.random() < twinkleChance;
      const twinkleDur = Math.random() * 3 + 1.5;
      const twinkleDelay = Math.random() * 6;

      return {
        id: i, x: Math.random() * 100, y: Math.random() * 100,
        size, color, opacity, floatDur, floatDelay,
        hasTwinkle, twinkleDur, twinkleDelay,
        blur, glow,
        layer: assignLayer(size),
      };
    });
  });

  // Group particles by layer
  const layerGroups = [[], [], []];
  particles.forEach(p => layerGroups[p.layer].push(p));

  // Parallax state
  const layerRefs = useRef([null, null, null]);
  const targetOffset = useRef({ x: 0, y: 0 });
  const currentOffset = useRef([{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }]);
  const rafId = useRef(null);
  const parallaxEnabled = useRef(false);

  // Scroll-coupled drift: a single decaying velocity that reads the most
  // recent scroll delta and fades back to 0 each frame via SCROLL_DECAY.
  // No separate current/target split — the decay itself is the smoothing.
  const scrollVelocity = useRef(0);
  const lastScrollY = useRef(0);

  useEffect(() => {
    // Only enable on hover-capable, non-reduced-motion devices — gates both
    // the mouse parallax and the scroll-coupled drift.
    const hasHover = window.matchMedia('(hover: hover)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!hasHover || reducedMotion) return;
    parallaxEnabled.current = true;

    // Seed from current scrollY so the first post-mount delta is 0 even if
    // the user has already scrolled the page.
    lastScrollY.current = window.scrollY;

    const handleMouseMove = (e) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < DEADZONE) {
        targetOffset.current = { x: 0, y: 0 };
        return;
      }

      // Scale from deadzone edge to viewport edge
      const maxDist = Math.sqrt(cx * cx + cy * cy);
      const scale = (dist - DEADZONE) / (maxDist - DEADZONE);
      const angle = Math.atan2(dy, dx);
      targetOffset.current = {
        x: -Math.cos(angle) * scale,
        y: -Math.sin(angle) * scale,
      };
    };

    const handleScroll = () => {
      const cur = window.scrollY;
      const delta = cur - lastScrollY.current;
      lastScrollY.current = cur;
      // Replace rather than accumulate: velocity should track the freshest
      // scroll delta, and the per-frame decay handles settle-back on its own.
      scrollVelocity.current = delta;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Lerp loop for smooth movement — heavy damping for lazy drift
    const lerp = (a, b, t) => a + (b - a) * t;
    const lerpFactor = 0.01;

    const animate = () => {
      const velY = scrollVelocity.current;

      LAYERS.forEach((layer, i) => {
        const cur = currentOffset.current[i];
        const tx = targetOffset.current.x * layer.maxShift;
        const ty = targetOffset.current.y * layer.maxShift;
        cur.x = lerp(cur.x, tx, lerpFactor);
        cur.y = lerp(cur.y, ty, lerpFactor);

        // Scroll drift: opposite the scroll direction, scaled so each layer
        // reaches its own cap at SCROLL_VEL_REFERENCE px/frame. Anything
        // faster is clamped so a hard flick doesn't sling particles offscreen.
        const maxS = LAYER_SCROLL_MAX[i];
        const rawScroll = -velY * (maxS / SCROLL_VEL_REFERENCE);
        const scrollY = Math.max(-maxS, Math.min(maxS, rawScroll));

        const el = layerRefs.current[i];
        if (el) {
          // Mouse parallax and scroll drift combine additively on Y.
          el.style.transform = `translate(${cur.x.toFixed(2)}px, ${(cur.y + scrollY).toFixed(2)}px)`;
        }
      });

      // Exponential decay toward zero. Snap to 0 once tiny so the transform
      // doesn't keep re-writing trivial sub-pixel values forever.
      scrollVelocity.current *= SCROLL_DECAY;
      if (Math.abs(scrollVelocity.current) < 0.05) scrollVelocity.current = 0;

      rafId.current = requestAnimationFrame(animate);
    };

    rafId.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  return (
    <div className={styles.particleField}>
      {layerGroups.map((group, layerIndex) => (
        <div
          key={layerIndex}
          ref={el => layerRefs.current[layerIndex] = el}
          className={styles.particleLayer}
        >
          {group.map(p => (
            <div key={p.id} className={styles.particle} style={{
              left: `${p.x}%`, top: `${p.y}%`,
              width: p.size, height: p.size,
              background: p.color,
              '--p-opacity': p.opacity, opacity: p.opacity,
              animation: `float ${p.floatDur}s ease-in-out ${p.floatDelay}s infinite${p.hasTwinkle ? `, twinkle ${p.twinkleDur}s ease-in-out ${p.twinkleDelay}s infinite` : ''}`,
              filter: p.blur ? 'blur(0.5px)' : 'none',
              // Ember-tier glow — 8-digit hex alpha of 4D is ~30% (0x4D / 0xFF ≈ 0.302).
              boxShadow: p.glow ? `0 0 ${p.size * 2}px ${p.color}4D` : 'none',
            }} />
          ))}
        </div>
      ))}
    </div>
  );
}
