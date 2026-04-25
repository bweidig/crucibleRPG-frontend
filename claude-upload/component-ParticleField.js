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

// Per-layer scroll parallax factor. Each layer's Y offset is scrollY × factor
// (in the opposite direction), so the field reads as a starfield embedded in
// the document rather than a static overlay. Far moves slowest (deepest
// background), near moves most. All factors are < 1, so particles drift past
// at sub-scroll rate — the closer to 1, the more they keep up with content.
const SCROLL_PARALLAX_FACTOR = [0.15, 0.3, 0.5];

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


  useEffect(() => {
    // Only enable on hover-capable, non-reduced-motion devices — gates both
    // the mouse parallax and the scroll parallax.
    const hasHover = window.matchMedia('(hover: hover)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!hasHover || reducedMotion) return;
    parallaxEnabled.current = true;

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

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Lerp loop for smooth movement — heavy damping for lazy drift
    const lerp = (a, b, t) => a + (b - a) * t;
    const lerpFactor = 0.01;

    const animate = () => {
      // Read scrollY directly each frame — no scroll listener needed, no
      // chance of interfering with native scroll handling. The animate loop
      // already runs every frame for the mouse parallax lerp.
      const scrollY = window.scrollY;

      LAYERS.forEach((layer, i) => {
        const cur = currentOffset.current[i];
        const tx = targetOffset.current.x * layer.maxShift;
        const ty = targetOffset.current.y * layer.maxShift;
        cur.x = lerp(cur.x, tx, lerpFactor);
        cur.y = lerp(cur.y, ty, lerpFactor);

        // Scroll parallax: each layer drifts at a fraction of scrollY, opposite
        // the scroll direction. Far moves slowest (deepest background), near
        // most. Combined additively with the mouse parallax on Y.
        const scrollOffsetY = -scrollY * SCROLL_PARALLAX_FACTOR[i];

        const el = layerRefs.current[i];
        if (el) {
          el.style.transform = `translate(${cur.x.toFixed(2)}px, ${(cur.y + scrollOffsetY).toFixed(2)}px)`;
        }
      });

      rafId.current = requestAnimationFrame(animate);
    };

    rafId.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
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
