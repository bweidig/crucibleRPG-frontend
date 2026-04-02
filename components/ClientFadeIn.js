'use client';

import { useState, useEffect } from 'react';

export default function ClientFadeIn({ children, delay = 0, translateY = 12, duration = 0.8, style = {} }) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setLoaded(true); }, []);

  return (
    <div style={{
      opacity: loaded ? 1 : 0,
      transform: loaded ? 'translateY(0)' : `translateY(${translateY}px)`,
      transition: `opacity ${duration}s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform ${duration}s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
      ...style,
    }}>
      {children}
    </div>
  );
}
