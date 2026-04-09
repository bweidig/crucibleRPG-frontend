'use client';

import { useEffect, useCallback } from 'react';
import styles from './ImageLightbox.module.css';

export default function ImageLightbox({ imageUrl, blurb, turnNumber, onClose }) {
  const handleKey = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.content} onClick={e => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose} aria-label="Close image">&times;</button>
        <img
          src={imageUrl}
          alt={blurb || 'Scene visualization'}
          className={styles.image}
        />
        {(blurb || turnNumber != null) && (
          <div className={styles.caption}>
            {blurb && <div className={styles.blurb}>{blurb}</div>}
            {turnNumber != null && <div className={styles.turnLabel}>Turn {turnNumber}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
