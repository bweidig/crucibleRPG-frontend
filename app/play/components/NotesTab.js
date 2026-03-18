import { useState, useCallback } from 'react';
import * as api from '@/lib/api';
import styles from './NotesTab.module.css';
import sidebarStyles from './Sidebar.module.css';

const ENTITY_TYPES = [
  { value: 'general', label: 'General' },
  { value: 'npc', label: 'NPC' },
  { value: 'location', label: 'Location' },
  { value: 'faction', label: 'Faction' },
  { value: 'item', label: 'Item' },
  { value: 'quest', label: 'Quest' },
];

export default function NotesTab({ data, gameId, onNotesChange }) {
  const [entityType, setEntityType] = useState('general');
  const [noteText, setNoteText] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [formError, setFormError] = useState(null);

  const handleAdd = useCallback(async () => {
    const text = noteText.trim();
    if (!text || !gameId) return;

    setSaving(true);
    setFormError(null);

    try {
      await api.post(`/api/game/${gameId}/notes`, {
        entityType,
        text,
      });
      setNoteText('');
      onNotesChange?.();
    } catch (err) {
      console.error('Failed to create note:', err);
      setFormError(err.message || 'Failed to save note.');
    } finally {
      setSaving(false);
    }
  }, [gameId, entityType, noteText, onNotesChange]);

  const handleDelete = useCallback(async (noteId) => {
    if (!gameId) return;
    setDeleting(noteId);

    try {
      await api.del(`/api/game/${gameId}/notes/${noteId}`);
      onNotesChange?.();
    } catch (err) {
      console.error('Failed to delete note:', err);
    } finally {
      setDeleting(null);
    }
  }, [gameId, onNotesChange]);

  if (!data) {
    return <div className={sidebarStyles.loadingState}>Loading notes...</div>;
  }

  const notes = Array.isArray(data.notes) ? data.notes : [];

  return (
    <div>
      {notes.length === 0 ? (
        <div className={sidebarStyles.emptyState}>No notes yet. Add one below.</div>
      ) : (
        notes.map(note => (
          <div key={note.id} className={styles.noteCard}>
            <div className={styles.noteHeader}>
              <span className={styles.noteEntity}>
                {note.entityName || note.entityType}
              </span>
              <span className={styles.noteType}>{note.entityType}</span>
            </div>
            <div className={styles.noteText}>{note.text}</div>
            <div className={styles.noteFooter}>
              <span className={styles.noteDate}>
                {note.createdAt ? new Date(note.createdAt).toLocaleDateString() : ''}
              </span>
              <button
                className={styles.deleteButton}
                onClick={() => handleDelete(note.id)}
                disabled={deleting === note.id}
                aria-label={`Delete note about ${note.entityName || note.entityType}`}
              >
                {deleting === note.id ? '...' : 'Delete'}
              </button>
            </div>
          </div>
        ))
      )}

      {/* Add Note Form */}
      <div className={styles.addForm}>
        <span className={styles.formLabel}>Add Note</span>
        <div className={styles.formRow}>
          <select
            className={styles.entityTypeSelect}
            value={entityType}
            onChange={e => setEntityType(e.target.value)}
            aria-label="Note category"
          >
            {ENTITY_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <textarea
          className={styles.noteInput}
          placeholder="Write a note..."
          value={noteText}
          onChange={e => setNoteText(e.target.value)}
          maxLength={500}
          aria-label="Note text"
        />
        <div style={{ marginTop: '8px' }}>
          <button
            className={styles.addButton}
            onClick={handleAdd}
            disabled={saving || !noteText.trim()}
          >
            {saving ? 'Saving...' : 'Save Note'}
          </button>
        </div>
        {formError && <div className={styles.formError}>{formError}</div>}
      </div>
    </div>
  );
}
