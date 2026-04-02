'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';

export default function ScrollFade() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const check = () => {
      const { scrollY, innerHeight } = window;
      const { scrollHeight } = document.documentElement;
      const atBottom = scrollY + innerHeight >= scrollHeight - 20;
      const hasScroll = scrollHeight > innerHeight + 20;
      setVisible(hasScroll && !atBottom);
    };
    check();
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check, { passive: true });
    return () => {
      window.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, []);

  return <div className={styles.scrollFade} style={{ opacity: visible ? 1 : 0 }} />;
}
