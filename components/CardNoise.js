'use client';

import { useState, useEffect } from 'react';

export function NoiseFilter() {
  return (
    <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true">
      <defs>
        <filter id="cardNoise">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </defs>
    </svg>
  );
}

export function CardNoise({ opacity = 0.03 }) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  if (reducedMotion) return null;

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      borderRadius: 'inherit',
      filter: 'url(#cardNoise)',
      opacity,
      pointerEvents: 'none',
      mixBlendMode: 'overlay',
    }} />
  );
}
