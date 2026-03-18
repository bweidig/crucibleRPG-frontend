import { useState, useEffect, useCallback } from 'react';
import * as api from '@/lib/api';
import styles from './EntityPopup.module.css';

function getDurabilityColor(dur, max) {
  if (!max) return '#8a94a8';
  const pct = (dur / max) * 100;
  if (pct === 0) return '#8a3a3a';
  if (pct <= 25) return '#e85a5a';
  if (pct <= 50) return '#e8845a';
  if (pct <= 75) return '#e8c45a';
  return '#8aba7a';
}

export default function EntityPopup({ entity, glossaryData, notesData, gameId, onClose, onNotesChange }) {
  const [noteText, setNoteText] = useState('');
  const [saving, setSaving] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Look up entity in glossary
  const entries = glossaryData?.entries || [];
  const match = entries.find(e =>
    (e.term || '').toLowerCase() === (entity.term || '').toLowerCase()
  );

  // Find existing notes for this entity
  const notes = (notesData?.notes || []).filter(n =>
    (n.entityName || '').toLowerCase() === (entity.term || '').toLowerCase() ||
    (n.entityType === entity.type && n.entityId === entity.id)
  );

  // Item durability from entity data (if passed directly)
  const hasDurability = entity.durability != null && entity.maxDurability != null;

  const handleSaveNote = useCallback(async () => {
    const text = noteText.trim();
    if (!text || !gameId || saving) return;

    setSaving(true);
    try {
      const body = {
        entityType: entity.type || 'general',
        text,
      };
      if (entity.id != null) body.entityId = entity.id;
      await api.post(`/api/game/${gameId}/notes`, body);
      setNoteText('');
      onNotesChange?.();
    } catch (err) {
      console.error('Failed to save note:', err);
    } finally {
      setSaving(false);
    }
  }, [noteText, gameId, saving, entity, onNotesChange]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.entityName}>{entity.term || entity.name || 'Unknown'}</span>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close">&times;</button>
        </div>

        <div className={styles.body}>
          {match ? (
            <>
              <div className={styles.category}>{match.category}</div>
              <div className={styles.definition}>{match.definition}</div>
            </>
          ) : (
            <div className={styles.notFound}>
              No glossary entry found for this entity.
            </div>
          )}

          {/* Durability bar for items */}
          {hasDurability && (
            <div className={styles.durabilitySection}>
              <div className={styles.durabilityLabel}>Durability</div>
              <div className={styles.durBarTrack}>
                <div
                  className={styles.durBarFill}
                  style={{
                    width: `${entity.maxDurability > 0 ? (entity.durability / entity.maxDurability) * 100 : 0}%`,
                    background: getDurabilityColor(entity.durability, entity.maxDurability),
                  }}
                />
              </div>
              <span className={styles.durValue} style={{ color: getDurabilityColor(entity.durability, entity.maxDurability) }}>
                {entity.durability} / {entity.maxDurability}
              </span>
            </div>
          )}

          {/* Player Notes */}
          <div className={styles.notesSection}>
            <div className={styles.notesLabel}>Your Notes</div>

            {notes.length > 0 && (
              <div className={styles.notesList}>
                {notes.map(n => (
                  <div key={n.id} className={styles.existingNote}>{n.text}</div>
                ))}
              </div>
            )}

            <textarea
              className={styles.noteInput}
              placeholder="Add a note..."
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              maxLength={500}
            />
            <button
              className={styles.noteSaveButton}
              onClick={handleSaveNote}
              disabled={saving || !noteText.trim()}
            >
              {saving ? 'Saving...' : 'Save Note'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
