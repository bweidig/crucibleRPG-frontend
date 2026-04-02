'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './ParticleField.module.css';

const EMBER_COLORS = ["#c9a84c", "#d4a94e", "#e8a840", "#d4845a", "#c0924a", "#ddb84e"];

// Depth layer config: max parallax shift in px (opposite to cursor)
const LAYERS = [
  { maxShift: 2 },   // far (smallest particles)
  { maxShift: 4 },   // mid
  { maxShift: 6 },   // near (largest particles)
];

const DEADZONE = 100; // px from viewport center — ignore small movements

function assignLayer(size) {
  if (size < 1.4) return 0;      // far
  if (size < 2.2) return 1;      // mid
  return 2;                       // near
}

export default function ParticleField({ count = 35 }) {
  const [particles] = useState(() =>
    Array.from({ length: count }, (_, i) => {
      const color = EMBER_COLORS[Math.floor(Math.random() * EMBER_COLORS.length)];
      const size = Math.random() * 3.0 + 0.6;
      const opacity = Math.random() * 0.30 + 0.06;
      const floatDur = Math.random() * 14 + 6;
      const floatDelay = Math.random() * 10;
      const hasTwinkle = Math.random() < 0.4;
      const twinkleDur = Math.random() * 3 + 1.5;
      const twinkleDelay = Math.random() * 6;
      return {
        id: i, x: Math.random() * 100, y: Math.random() * 100,
        size, color, opacity, floatDur, floatDelay,
        hasTwinkle, twinkleDur, twinkleDelay,
        blur: size > 2.5,
        layer: assignLayer(size),
      };
    })
  );

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
    // Only enable on hover-capable, non-reduced-motion devices
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
    const lerpFactor = 0.025;

    const animate = () => {
      LAYERS.forEach((layer, i) => {
        const cur = currentOffset.current[i];
        const tx = targetOffset.current.x * layer.maxShift;
        const ty = targetOffset.current.y * layer.maxShift;
        cur.x = lerp(cur.x, tx, lerpFactor);
        cur.y = lerp(cur.y, ty, lerpFactor);

        const el = layerRefs.current[i];
        if (el) {
          el.style.transform = `translate(${cur.x.toFixed(2)}px, ${cur.y.toFixed(2)}px)`;
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
            }} />
          ))}
        </div>
      ))}
    </div>
  );
}
