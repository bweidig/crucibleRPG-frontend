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

// Per-layer cap for scroll-coupled drift (px). Bounded so a hard flick
// doesn't fling particles across the viewport.
const LAYER_SCROLL_MAX = [2, 5, 8];

// Velocity decay per frame. Aggressive enough (0.85^20 ≈ 0.04) that a single
// scroll event's influence fades in ~1/3 second — combined with the lerped
// offset below, drift starts small, grows briefly, and settles back to zero.
const SCROLL_DECAY = 0.85;

// Raw deltaY from scroll events is large (wheel ticks easily exceed 30 px).
// Dividing at the source scales it down to a velocity magnitude where
// cap-saturation and gentle-scroll behavior both land in a readable range.
const SCROLL_INPUT_DIVISOR = 8;

// Lerp factor for the scroll offset itself — the mouse parallax uses 0.01
// for a lazy drift, and scroll wants the same "wind, not vibration" feel.
// Faster lerps track the velocity too closely and produce the per-frame
// jitter the effect is trying to avoid.
const SCROLL_LERP = 0.02;

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
      // that get a blur, a warm glow, and almost always twinkle. Floors on
      // size and opacity are set so even the faintest dust reads as a visible
      // speck on the dark navy background — sparse starfield, not empty space.
      let size, opacity, twinkleChance, blur, glow;
      if (tier === 'dust') {
        size = randInRange(1.0, 1.8);
        opacity = randInRange(0.10, 0.20);
        twinkleChance = 0;
        blur = false;
        glow = false;
      } else if (tier === 'mote') {
        size = randInRange(1.8, 2.6);
        opacity = randInRange(0.18, 0.30);
        twinkleChance = 0.30;
        blur = false;
        glow = false;
      } else {
        size = randInRange(2.6, 3.8);
        opacity = randInRange(0.30, 0.50);
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

  // Scroll-coupled drift runs in two stages to avoid frame-to-frame jitter:
  //   1. scrollVelocity — the freshest scroll delta (divided by SCROLL_INPUT_
  //      DIVISOR). Decays each frame via SCROLL_DECAY.
  //   2. currentScrollOffset[layer] — the actual pixel offset applied. Lerps
  //      slowly (SCROLL_LERP) toward a velocity-derived target. Without this
  //      lerp, offset would jump every frame with each new scroll delta and
  //      vibrate rather than drift.
  const scrollVelocity = useRef(0);
  const lastScrollY = useRef(0);
  const currentScrollOffset = useRef([0, 0, 0]);

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
      // Replace rather than accumulate — the per-frame decay settles it back
      // on its own. Division by SCROLL_INPUT_DIVISOR scales raw scroll deltas
      // (often 30–100+ px per wheel tick) down into a range where the rest
      // of the pipeline produces the "gentle wind" feel the effect wants.
      scrollVelocity.current = delta / SCROLL_INPUT_DIVISOR;
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

        // Scroll drift: target derived from velocity, then the rendered
        // offset lerps toward it at SCROLL_LERP (very lazy). Keeps particles
        // drifting smoothly over ~half a second rather than snapping with
        // each scroll event. Clamped to each layer's cap so fast flicks
        // don't overshoot.
        const maxS = LAYER_SCROLL_MAX[i];
        const rawTarget = -velY * maxS;
        const scrollTarget = Math.max(-maxS, Math.min(maxS, rawTarget));
        currentScrollOffset.current[i] = lerp(currentScrollOffset.current[i], scrollTarget, SCROLL_LERP);

        const el = layerRefs.current[i];
        if (el) {
          // Mouse parallax and scroll drift combine additively on Y.
          el.style.transform = `translate(${cur.x.toFixed(2)}px, ${(cur.y + currentScrollOffset.current[i]).toFixed(2)}px)`;
        }
      });

      // Exponential decay toward zero. Snap to 0 once tiny so the transform
      // doesn't keep re-writing trivial sub-pixel values forever.
      scrollVelocity.current *= SCROLL_DECAY;
      if (Math.abs(scrollVelocity.current) < 0.01) scrollVelocity.current = 0;

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
