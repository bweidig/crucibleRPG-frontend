'use client';

import { useState, useEffect, useCallback } from 'react';
import * as api from '@/lib/api';
import ImageLightbox from './ImageLightbox';
import styles from './GalleryModal.module.css';

export default function GalleryModal({ gameId, onClose }) {
  const [images, setImages] = useState(null); // null=loading
  const [error, setError] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);

  useEffect(() => {
    if (!gameId) return;
    api.get(`/api/game/${gameId}/gallery`).then(data => {
      setImages(data.images || []);
    }).catch(err => {
      setError(err.message || 'Failed to load gallery');
    });
  }, [gameId]);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape' && !lightboxImage) onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, lightboxImage]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.headerLabel}>GALLERY</span>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close gallery">&times;</button>
        </div>

        <div className={styles.body}>
          {/* Loading */}
          {images === null && !error && (
            <div className={styles.emptyState}>Loading gallery...</div>
          )}

          {/* Error */}
          {error && (
            <div className={styles.errorText}>{error}</div>
          )}

          {/* Empty */}
          {images && images.length === 0 && (
            <div className={styles.emptyState}>
              No scenes captured yet. Use the Visualize button during gameplay to illustrate your story.
            </div>
          )}

          {/* Image Grid */}
          {images && images.length > 0 && (
            <div className={styles.grid}>
              {images.map(img => (
                <button
                  key={img.id}
                  className={styles.card}
                  onClick={() => setLightboxImage(img)}
                >
                  <div className={styles.cardImageWrapper}>
                    <img
                      src={img.imageUrl}
                      alt={img.blurb || 'Scene visualization'}
                      className={styles.cardImage}
                      loading="lazy"
                    />
                  </div>
                  <div className={styles.cardInfo}>
                    {img.blurb && (
                      <div className={styles.cardBlurb}>{img.blurb}</div>
                    )}
                    <div className={styles.cardMeta}>
                      <span className={styles.cardTurn}>Turn {img.turnNumber}</span>
                      {img.stylePreset && (
                        <span className={styles.cardStyle}>{formatPreset(img.stylePreset)}</span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {lightboxImage && (
        <ImageLightbox
          imageUrl={lightboxImage.imageUrl}
          blurb={lightboxImage.blurb}
          turnNumber={lightboxImage.turnNumber}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </div>
  );
}

function formatPreset(preset) {
  const map = {
    dark_fantasy: 'Dark Fantasy',
    cyberpunk: 'Cyberpunk',
    watercolor: 'Watercolor',
    ink_wash: 'Ink & Wash',
    comic_book: 'Comic Book',
    oil_painting: 'Oil Painting',
    sketch: 'Pencil Sketch',
  };
  return map[preset] || preset;
}
