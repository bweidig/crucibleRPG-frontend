'use client';

import { useState } from 'react';
import styles from './ParticleField.module.css';

const EMBER_COLORS = ["#c9a84c", "#d4a94e", "#e8a840", "#d4845a", "#c0924a", "#ddb84e"];

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
      };
    })
  );

  return (
    <div className={styles.particleField}>
      {particles.map(p => (
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
  );
}
