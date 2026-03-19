import { useState, useEffect, useCallback, useRef } from 'react';
import * as api from '@/lib/api';
import styles from './TalkToGM.module.css';

export default function TalkToGM({ gameId, onTurnResponse }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [lastQuestion, setLastQuestion] = useState('');
  const inputRef = useRef(null);

  // Auto-focus input when panel opens
  useEffect(() => {
    if (open) {
      // Small delay to ensure the DOM has rendered
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open]);

  const handleClose = () => {
    setOpen(false);
    setInput('');
    setResult(null);
    setLastQuestion('');
  };

  // Phase 1: Free lookup
  const handleAsk = useCallback(async () => {
    const question = input.trim();
    if (!question || !gameId || loading) return;

    setLoading(true);
    setResult(null);
    setLastQuestion(question);
    setInput('');

    try {
      const res = await api.post(`/api/game/${gameId}/talk-to-gm`, { question });
      setResult(res);
    } catch (err) {
      console.error('Talk to GM failed:', err);
      setResult({ error: err.message || 'Failed to reach the GM.' });
    } finally {
      setLoading(false);
    }
  }, [input, gameId, loading]);

  // Phase 2: Escalation (costs a turn)
  const handleEscalate = useCallback(async () => {
    if (!lastQuestion || !gameId || loading) return;

    setLoading(true);
    try {
      const res = await api.post(`/api/game/${gameId}/talk-to-gm/escalate`, {
        question: lastQuestion,
      });

      // Process as a turn response
      if (res.turnAdvanced && onTurnResponse) {
        onTurnResponse(res, '[GM Escalation]');
      }

      handleClose();
    } catch (err) {
      console.error('GM escalation failed:', err);
      setResult({ error: err.message || 'Escalation failed.' });
    } finally {
      setLoading(false);
    }
  }, [lastQuestion, gameId, loading, onTurnResponse]);

  // ─── Render Result ───
  const renderResult = () => {
    if (!result) return null;

    if (result.error) {
      return <div className={styles.resultContent} style={{ color: 'var(--color-danger)' }}>{result.error}</div>;
    }

    // Command match
    if (result.source === 'command') {
      return (
        <div className={styles.resultCommand}>
          <div className={styles.resultLabel}>Command: {result.command}</div>
          <pre className={styles.resultContent} style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-jetbrains)', fontSize: '12px' }}>
            {typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2)}
          </pre>
        </div>
      );
    }

    // Rulebook match
    if (result.source === 'rulebook') {
      return (
        <div>
          <div className={styles.resultLabel}>Rulebook</div>
          <div className={styles.resultTitle}>{result.title}</div>
          {result.section && (
            <div style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: '11px', color: 'var(--text-dim)', marginBottom: '6px' }}>
              {result.section}
            </div>
          )}
          <div className={styles.resultContent}>{result.content}</div>
        </div>
      );
    }

    // No match — offer escalation
    return (
      <div>
        <div className={styles.resultSuggestion}>
          {result.suggestion || 'I could not find an answer. Want me to think about it?'}
        </div>
        {result.canEscalate && (
          <>
            <button
              className={styles.escalateButton}
              onClick={handleEscalate}
              disabled={loading}
            >
              {loading ? 'Thinking...' : 'Escalate to GM'}
            </button>
            <div className={styles.turnCostWarning}>This will cost a turn.</div>
          </>
        )}
      </div>
    );
  };

  // ─── Collapsed: floating button ───
  if (!open) {
    return (
      <button
        className={styles.gmButton}
        onClick={() => setOpen(true)}
        aria-label="Talk to the GM"
        title="Talk to the GM"
      >
        ?
      </button>
    );
  }

  // ─── Expanded panel ───
  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>Talk to the GM</span>
        <button className={styles.closeButton} onClick={handleClose} aria-label="Close">&times;</button>
      </div>

      <div className={styles.resultArea}>
        {loading && !result && <div className={styles.loadingText}>Asking the GM...</div>}
        {renderResult()}
      </div>

      <div className={styles.inputRow}>
        <input
          ref={inputRef}
          type="text"
          className={styles.input}
          placeholder="Ask a question..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            e.stopPropagation();
            if (e.key === 'Enter' && input.trim()) {
              e.preventDefault();
              handleAsk();
            }
          }}
          disabled={loading}
          maxLength={500}
          aria-label="Question for the GM"
        />
        <button
          className={styles.sendButton}
          onClick={handleAsk}
          disabled={loading || !input.trim()}
        >
          Ask
        </button>
      </div>
    </div>
  );
}
