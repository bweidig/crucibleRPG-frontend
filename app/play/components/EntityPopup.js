import { useState, useEffect, useCallback } from 'react';
import * as api from '@/lib/api';
import { renderLinkedText, cleanDefinition } from '@/lib/renderLinkedText';
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

export default function EntityPopup({ entity, glossaryData, glossaryTerms, notesData, gameId, onClose, onNotesChange, onEntityClick }) {
  const [noteText, setNoteText] = useState('');
  const [saving, setSaving] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Look up entity in glossary. Compare via cleanDefinition on both sides so
  // a tagged glossary term like "potential_ally Roric" still matches a click
  // on "Roric" (or vice-versa).
  const entries = glossaryData?.entries || [];
  const normalizeTerm = (s) => (cleanDefinition(s) || '').toLowerCase();
  const entityTermNorm = normalizeTerm(entity.term || entity.name);
  const match = entries.find(e => normalizeTerm(e.term) === entityTermNorm);

  // Find existing notes for this entity
  const notes = (notesData?.notes || []).filter(n =>
    normalizeTerm(n.entityName) === entityTermNorm ||
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
          <span className={styles.entityName}>{cleanDefinition(entity.term || entity.name) || 'Unknown'}</span>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close">&times;</button>
        </div>

        <div className={styles.body}>
          {match ? (
            <>
              <div className={styles.category}>{match.category}</div>
              <div className={styles.definition}>{renderLinkedText(cleanDefinition(match.definition), glossaryTerms, onEntityClick)}</div>
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

          {/* Mechanical Properties (for equipment items) */}
          {entity.equipmentCategory && (() => {
            const props = [];
            const cat = entity.equipmentCategory.toLowerCase();
            const qualityVal = entity.quality ?? entity.qualityBonus;

            if (cat === 'weapon') {
              if (entity.damageModifier != null) props.push({ label: 'Damage', value: entity.damageModifier, signed: true });
              if (qualityVal != null) props.push({ label: 'Quality Bonus', value: qualityVal, signed: true });
              if (Array.isArray(entity.tags) && entity.tags.length > 0) props.push({ label: 'Tags', text: entity.tags.join(', ') });
              if (entity.elementTag) props.push({ label: 'Element', text: entity.elementTag, element: true });
            } else if (cat === 'armor') {
              if (entity.armorMitigation != null) props.push({ label: 'Mitigation', value: entity.armorMitigation });
              if (entity.armorType) props.push({ label: 'Type', text: entity.armorType.charAt(0).toUpperCase() + entity.armorType.slice(1) });
              if (qualityVal != null) props.push({ label: 'Quality Bonus', value: qualityVal, signed: true });
            } else if (cat === 'implement') {
              if (entity.channelModifier != null) props.push({ label: 'Channel', value: entity.channelModifier, signed: true });
              if (qualityVal != null) props.push({ label: 'Quality Bonus', value: qualityVal, signed: true });
              if (entity.elementTag) props.push({ label: 'Element', text: entity.elementTag, element: true });
            } else if (cat === 'shield') {
              props.push({ label: 'Defense', value: 1.0, signed: true });
              if (qualityVal != null) props.push({ label: 'Quality Bonus', value: qualityVal, signed: true });
            }

            if (props.length === 0) return null;

            return (
              <div className={styles.propertiesSection}>
                <div className={styles.propertiesLabel}>PROPERTIES</div>
                {props.map((p, i) => (
                  <div key={i} className={styles.propertyRow}>
                    <span className={styles.propertyName}>{p.label}</span>
                    {p.text != null ? (
                      <span className={p.element ? styles.propertyElement : styles.propertyText}>{p.text}</span>
                    ) : (
                      <span className={styles.propertyValue} style={{ color: p.value < 0 ? 'var(--color-danger)' : 'var(--accent-gold)' }}>
                        {p.signed ? (p.value >= 0 ? '+' : '') : ''}{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            );
          })()}

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
