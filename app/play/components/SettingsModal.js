'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import * as api from '@/lib/api';
import styles from './SettingsModal.module.css';

// =============================================================================
// Exports used by page.js — do not remove
// =============================================================================

export const THEMES = {
  dark: {
    '--bg-main': '#0a0e1a', '--bg-panel': '#0d1120', '--bg-card': '#111528',
    '--bg-input': '#0a0e1a', '--bg-resolution': '#0e1420',
    '--text-primary': '#c8c0b0', '--text-heading': '#d0c098', '--text-narrative': '#d4c4a0',
    '--text-secondary': '#8a94a8', '--text-secondary-bright': '#8a9ab8',
    '--text-stat-bright': '#b0b8cc', '--text-muted': '#7082a4', '--text-dim': '#6b83a3',
    '--accent-gold': '#c9a84c', '--accent-bright': '#ddb84e',
    '--color-danger': '#e8845a', '--color-success': '#8aba7a',
    '--border-primary': '#1e2540', '--border-light': '#161c34', '--border-card': '#3a3328',
    '--border-card-hover': '#564b2e', '--border-card-separator': '#2a2622',
    '--brown-muted': '#948373', '--brown-dim': '#948270', '--brown-gold': '#907f5e',
    '--border-gold-faint': '#16181e', '--bg-gold-faint': '#0e111b',
    '--resolution-label': '#738660', '--resolution-dim': '#668954',
  },
  light: {
    '--bg-main': '#f8f4ec', '--bg-panel': '#f0ebe0', '--bg-card': '#ffffff',
    '--bg-input': '#f0ebe0', '--bg-resolution': '#eef4e8',
    '--text-primary': '#4a4030', '--text-heading': '#3a2a15', '--text-narrative': '#4a3a20',
    '--text-secondary': '#7a6a55', '--text-secondary-bright': '#6a5a45',
    '--text-stat-bright': '#5a4a35', '--text-muted': '#9a8a70', '--text-dim': '#b8a888',
    '--accent-gold': '#8a6a1a', '--accent-bright': '#7a5a10',
    '--color-danger': '#b04525', '--color-success': '#3a7a2a',
    '--border-primary': '#d4cbb8', '--border-light': '#e0d8c8', '--border-card': '#c8bba8',
    '--border-card-hover': '#b0a490', '--border-card-separator': '#d8d0c0',
    '--brown-muted': '#8a7a65', '--brown-dim': '#9a8a70', '--brown-gold': '#7a6a4a',
    '--border-gold-faint': '#d8d0c0', '--bg-gold-faint': '#f4f0e8',
    '--resolution-label': '#5a7a4a', '--resolution-dim': '#4a6a3a',
  },
  sepia: {
    '--bg-main': '#2a2218', '--bg-panel': '#241e14', '--bg-card': '#302820',
    '--bg-input': '#241e14', '--bg-resolution': '#1e2418',
    '--text-primary': '#d8c8a0', '--text-heading': '#f0dca8', '--text-narrative': '#dcd0a8',
    '--text-secondary': '#b0986a', '--text-secondary-bright': '#c0a878',
    '--text-stat-bright': '#d0b880', '--text-muted': '#8a7850', '--text-dim': '#6a5840',
    '--accent-gold': '#e0a840', '--accent-bright': '#d09830',
    '--color-danger': '#e09050', '--color-success': '#90b060',
    '--border-primary': '#4a3a28', '--border-light': '#3a3020', '--border-card': '#5a4830',
    '--border-card-hover': '#6a5838', '--border-card-separator': '#4a3a28',
    '--brown-muted': '#a08a60', '--brown-dim': '#8a7850', '--brown-gold': '#b09040',
    '--border-gold-faint': '#3a3020', '--bg-gold-faint': '#282018',
    '--resolution-label': '#7a9050', '--resolution-dim': '#6a8040',
  },
};

export const FONTS = [
  { id: 'alegreya', label: 'Alegreya', family: "'Alegreya Sans', sans-serif" },
  { id: 'lexie', label: 'Lexie Readable', family: "'Lexie Readable', sans-serif" },
];

export const SIZES = [
  { id: 'small', label: 'Small', narrative: '13px', ui: '11px' },
  { id: 'medium', label: 'Medium', narrative: '15px', ui: '12.5px' },
  { id: 'large', label: 'Large', narrative: '17px', ui: '14px' },
  { id: 'xlarge', label: 'X-Large', narrative: '19px', ui: '15px' },
];

// =============================================================================
// Constants
// =============================================================================

const STORYTELLERS = [
  { id: 'Chronicler', name: 'Chronicler', oneLiner: 'The world as it is.' },
  { id: 'Bard', name: 'Bard', oneLiner: 'Every moment a legend in the making.' },
  { id: 'Trickster', name: 'Trickster', oneLiner: 'The world has a sense of humor.' },
  { id: 'Poet', name: 'Poet', oneLiner: 'Beauty in the breaking.' },
  { id: 'Whisper', name: 'Whisper', oneLiner: 'Everything is fine. Almost.' },
  { id: 'Noir', name: 'Noir', oneLiner: 'The city always wins.' },
  { id: 'Custom', name: 'Custom', oneLiner: 'Your voice, your rules.' },
];

const DIFFICULTY_PRESETS = [
  { id: 'forgiving', label: 'Forgiving', color: '#7aba7a', bg: '#142018', dcOffset: -2, fateDc: 8, survivalEnabled: false, durabilityEnabled: false, progressionSpeed: 100, encounterPressure: 'low', fortunesBalanceEnabled: true, simplifiedOutcomes: false },
  { id: 'standard', label: 'Standard', color: '#8a94a8', bg: '#161a20', dcOffset: 0, fateDc: 12, survivalEnabled: true, durabilityEnabled: true, progressionSpeed: 100, encounterPressure: 'standard', fortunesBalanceEnabled: true, simplifiedOutcomes: false },
  { id: 'harsh', label: 'Harsh', color: '#e8c45a', bg: '#1e1a12', dcOffset: 2, fateDc: 16, survivalEnabled: true, durabilityEnabled: true, progressionSpeed: 100, encounterPressure: 'high', fortunesBalanceEnabled: true, simplifiedOutcomes: false },
  { id: 'brutal', label: 'Brutal', color: '#e85a5a', bg: '#201416', dcOffset: 4, fateDc: 18, survivalEnabled: true, durabilityEnabled: true, progressionSpeed: 100, encounterPressure: 'high', fortunesBalanceEnabled: true, simplifiedOutcomes: false },
];

// =============================================================================
// Shared Sub-Components
// =============================================================================

function SectionLabel({ children, extra }) {
  return (
    <div style={{
      fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 600,
      color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase',
      marginBottom: 10, marginTop: 20, display: 'flex', alignItems: 'center',
    }}>
      {children}
      {extra}
    </div>
  );
}

function Toggle({ label, value, onChange, description, disabled }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '8px 0', borderBottom: '1px solid #161c34',
      opacity: disabled ? 0.5 : 1,
    }}>
      <div>
        <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: 14, color: '#c8c0b0' }}>{label}</div>
        {description && (
          <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: 12, color: '#6b83a3', marginTop: 2 }}>{description}</div>
        )}
      </div>
      <button onClick={() => !disabled && onChange(!value)} style={{
        width: 44, height: 24, borderRadius: 12, cursor: disabled ? 'default' : 'pointer',
        background: value ? '#c9a84c' : '#111528',
        border: `1px solid ${value ? '#c9a84c' : '#1e2540'}`,
        position: 'relative', transition: 'all 0.2s', flexShrink: 0, marginLeft: 12,
      }}>
        <div style={{
          width: 18, height: 18, borderRadius: '50%',
          background: value ? '#0a0e1a' : '#8a94a8',
          position: 'absolute', top: 2,
          left: value ? 22 : 2,
          transition: 'left 0.2s, background 0.2s',
        }} />
      </button>
    </div>
  );
}

function SliderControl({ label, value, min, max, step, format, onChange, description, warning }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ padding: '10px 0', borderBottom: '1px solid #161c34' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <div>
          <span style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: 14, color: '#c8c0b0' }}>{label}</span>
          {description && (
            <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: 12, color: '#6b83a3', marginTop: 2 }}>{description}</div>
          )}
        </div>
        <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: 14, fontWeight: 500, color: '#c9a84c', flexShrink: 0 }}>
          {format ? format(value) : value}
        </span>
      </div>
      <div style={{ position: 'relative', height: 20, display: 'flex', alignItems: 'center' }}>
        <div style={{
          position: 'absolute', left: 0, right: 0, height: 4, borderRadius: 2,
          background: '#111528', border: '1px solid #161c34',
        }} />
        <div style={{
          position: 'absolute', left: 0, height: 4, borderRadius: 2,
          width: `${pct}%`, background: warning ? '#e8845a' : '#c9a84c', opacity: 0.6,
          transition: 'width 0.15s',
        }} />
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(parseFloat(e.target.value))} />
      </div>
      {warning && (
        <div style={{ fontFamily: "var(--font-alegreya)", fontSize: 11, color: '#e8845a', marginTop: 4, fontStyle: 'italic' }}>
          {warning}
        </div>
      )}
    </div>
  );
}

function SelectorRow({ label, options, value, onChange, description }) {
  return (
    <div style={{ padding: '10px 0', borderBottom: '1px solid #161c34' }}>
      <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: 14, color: '#c8c0b0', marginBottom: 6 }}>{label}</div>
      {description && (
        <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: 12, color: '#6b83a3', marginBottom: 8 }}>{description}</div>
      )}
      <div style={{ display: 'flex', gap: 4 }}>
        {options.map(opt => (
          <button key={opt.id} onClick={() => onChange(opt.id)} style={{
            flex: 1, padding: '6px 0', cursor: 'pointer', borderRadius: 5,
            fontFamily: "var(--font-alegreya-sans)", fontSize: 13,
            border: `1px solid ${value === opt.id ? '#c9a84c' : '#1e2540'}`,
            background: value === opt.id ? '#1a1810' : 'transparent',
            color: value === opt.id ? '#c9a84c' : '#7082a4',
            transition: 'all 0.2s',
          }}>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// AI Model Section (playtester-only)
// =============================================================================

const TASK_LABELS = {
  narrative: 'Narrative (story writing)',
  summarization: 'Summarization (per-turn)',
  zone_generation: 'Zone Generation',
  classification: 'Action Classification',
  npc_flesh_out: 'NPC Flesh-out',
  campaign_summary: 'Campaign Summary',
  session_recap: 'Session Recap',
  briefing: 'Briefing Command',
  character_proposal: 'Character Proposal',
};

const PROVIDER_LABELS = { openai: 'OpenAI', anthropic: 'Anthropic', google: 'Google' };

function groupByProvider(models) {
  const groups = {};
  (models || []).forEach(m => {
    const p = m.provider || 'other';
    if (!groups[p]) groups[p] = [];
    groups[p].push(m);
  });
  return groups;
}

function ModelSelect({ value, models, defaultModelId, defaultLabel, inherited, onChange, className }) {
  const groups = groupByProvider(models);
  return (
    <select
      className={className}
      value={value || ''}
      onChange={e => onChange(e.target.value || null)}
      style={inherited && !value ? { color: '#6b83a3', fontStyle: 'italic' } : undefined}
    >
      <option value="">
        Default{defaultLabel ? ` (${defaultLabel})` : ''}
      </option>
      {Object.entries(groups).map(([provider, pModels]) => (
        <optgroup key={provider} label={PROVIDER_LABELS[provider] || provider}>
          {pModels.map(m => (
            <option key={m.id} value={m.id}>{m.label}{m.tier === 'fast' ? ' \u2022 fast' : m.tier === 'nano' ? ' \u2022 nano' : ''}</option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

function AiModelSection({ gameId }) {
  const user = api.getUser();
  const isPlaytester = user?.isPlaytester;

  const [aiData, setAiData] = useState(null);   // null=loading, false=hidden
  const [overrides, setOverrides] = useState({});
  const [advancedMode, setAdvancedMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successKey, setSuccessKey] = useState(null);
  const [error, setError] = useState(null);

  // Fetch on mount
  useEffect(() => {
    if (!gameId || !isPlaytester) {
      setAiData(false);
      return;
    }
    api.get(`/api/game/${gameId}/settings/ai-model`).then(data => {
      setAiData(data);
      setOverrides(data.overrides || {});
      const hasPerTask = Object.entries(data.overrides || {}).some(([k, v]) => k !== 'all' && v != null);
      if (hasPerTask) setAdvancedMode(true);
    }).catch(() => {
      setAiData(false);
    });
  }, [gameId, isPlaytester]);

  const updateOverride = useCallback(async (key, modelId) => {
    if (!gameId) return;
    const prevOverrides = { ...overrides };
    const value = modelId || null;
    setOverrides(prev => ({ ...prev, [key]: value }));
    setSaving(true);
    setError(null);
    try {
      const res = await api.put(`/api/game/${gameId}/settings/ai-model`, { overrides: { [key]: value } });
      if (res.overrides) setOverrides(res.overrides);
      setSuccessKey(key);
      setTimeout(() => setSuccessKey(null), 1500);
    } catch (err) {
      setOverrides(prevOverrides);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }, [gameId, overrides]);

  const resetAll = useCallback(async () => {
    if (!gameId) return;
    const prevOverrides = { ...overrides };
    const resetBody = {};
    Object.keys(overrides).forEach(k => { resetBody[k] = null; });
    setOverrides(prev => Object.fromEntries(Object.keys(prev).map(k => [k, null])));
    setSaving(true);
    setError(null);
    try {
      const res = await api.put(`/api/game/${gameId}/settings/ai-model`, { overrides: resetBody });
      if (res.overrides) setOverrides(res.overrides);
      setSuccessKey('reset');
      setTimeout(() => setSuccessKey(null), 1500);
    } catch (err) {
      setOverrides(prevOverrides);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }, [gameId, overrides]);

  // Don't render for non-playtesters or on fetch failure
  if (!isPlaytester || aiData === false) return null;

  // Loading skeleton
  if (aiData === null) {
    return (
      <div>
        <SectionLabel>AI Models</SectionLabel>
        <div className={styles.loadingSkeleton} style={{ width: '60%' }} />
        <div className={styles.loadingSkeleton} style={{ width: '100%', marginTop: 6 }} />
        <div className={styles.loadingSkeleton} style={{ width: '80%', marginTop: 6 }} />
      </div>
    );
  }

  const { defaults = {}, availableModels = [], taskTypes = [] } = aiData;
  const modelLabelById = {};
  availableModels.forEach(m => { modelLabelById[m.id] = m.label; });

  const hasAnyOverride = Object.values(overrides).some(v => v != null);
  const hasPerTaskOverrides = Object.entries(overrides).some(([k, v]) => k !== 'all' && v != null);

  return (
    <div>
      <SectionLabel extra={
        <>
          <span className={styles.devBadge}>Playtester</span>
          {saving && <span className={styles.savingDot} />}
        </>
      }>
        AI Models
      </SectionLabel>

      {/* Simple mode: All AI Tasks dropdown */}
      <div className={styles.modelRow}>
        <div className={styles.modelRowLabel}>
          <span className={styles.modelRowName}>
            All AI Tasks
            {successKey === 'all' && <span className={styles.modelSuccessCheck}>{'\u2713'}</span>}
          </span>
          {hasAnyOverride && (
            <button
              className={styles.resetButton}
              onClick={resetAll}
              disabled={saving}
            >
              {successKey === 'reset' ? '\u2713 Reset' : 'Reset to defaults'}
            </button>
          )}
        </div>
        <ModelSelect
          className={styles.modelSelect}
          value={overrides.all}
          models={availableModels}
          defaultLabel={null}
          onChange={v => updateOverride('all', v)}
        />
        {hasPerTaskOverrides && !advancedMode && (
          <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: 12, color: '#e8c45a', marginTop: 6 }}>
            Some tasks have individual overrides.{' '}
            <button onClick={() => setAdvancedMode(true)} style={{
              background: 'none', border: 'none', color: '#c9a84c', cursor: 'pointer',
              fontFamily: "var(--font-alegreya-sans)", fontSize: 12, textDecoration: 'underline', padding: 0,
            }}>
              Show details
            </button>
          </div>
        )}
      </div>

      {/* Advanced toggle */}
      <div style={{ padding: '8px 0', borderBottom: '1px solid #161c34' }}>
        <button onClick={() => setAdvancedMode(!advancedMode)} style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          fontFamily: "var(--font-alegreya-sans)", fontSize: 13,
          color: advancedMode ? '#c9a84c' : '#7082a4',
          transition: 'color 0.15s',
        }}>
          {advancedMode ? '\u25BC' : '\u25B6'} Configure per task
        </button>
      </div>

      {/* Per-task dropdowns */}
      {advancedMode && taskTypes.map(task => {
        const taskOverride = overrides[task];
        const allOverride = overrides.all;
        const effectiveModel = taskOverride || allOverride || defaults[task];
        const inheritedFrom = !taskOverride && allOverride ? 'All Tasks' : null;

        return (
          <div key={task} className={styles.modelRow}>
            <div className={styles.modelRowLabel}>
              <span className={styles.modelRowName}>
                {TASK_LABELS[task] || task}
                {successKey === task && <span className={styles.modelSuccessCheck}>{'\u2713'}</span>}
              </span>
              {inheritedFrom && (
                <span className={styles.modelRowInherited}>
                  via {inheritedFrom}: {modelLabelById[allOverride] || allOverride}
                </span>
              )}
            </div>
            <ModelSelect
              className={styles.modelSelect}
              value={taskOverride}
              models={availableModels}
              defaultModelId={defaults[task]}
              defaultLabel={modelLabelById[defaults[task]] || defaults[task]}
              inherited={!!inheritedFrom}
              onChange={v => updateOverride(task, v)}
            />
          </div>
        );
      })}

      {error && <div className={styles.errorText}>{error}</div>}
    </div>
  );
}

// =============================================================================
// Tab 1: Game Settings
// =============================================================================

function GameSettingsTab({ gameId, gameState }) {
  // ─── Storyteller State ───
  const [storyteller, setStoryteller] = useState(gameState?.storyteller || 'Chronicler');
  const [customDirective, setCustomDirective] = useState('');
  const [stSaving, setStSaving] = useState(false);
  const [stError, setStError] = useState(null);

  // ─── Difficulty State ───
  const dials = gameState?.dials || {};
  const [preset, setPreset] = useState(gameState?.difficultyPreset || gameState?.difficulty || 'standard');
  const [dcOffset, setDcOffset] = useState(dials.dcOffset ?? 0);
  const [survivalEnabled, setSurvivalEnabled] = useState(dials.survivalEnabled ?? true);
  const [durabilityEnabled, setDurabilityEnabled] = useState(dials.durabilityEnabled ?? true);
  const [progressionSpeed, setProgressionSpeed] = useState((dials.progressionSpeed ?? 100) / 100);
  const [encounterPressure, setEncounterPressure] = useState(dials.encounterPressure ?? 'standard');
  const [fortunesBalanceEnabled, setFortunesBalanceEnabled] = useState(dials.fortunesBalanceEnabled ?? true);
  const [simplifiedOutcomes, setSimplifiedOutcomes] = useState(dials.simplifiedOutcomes ?? false);
  const [diffError, setDiffError] = useState(null);
  const [diffSaving, setDiffSaving] = useState(false);
  const saveTimeoutRef = useRef(null);

  // ─── Fetch difficulty presets on mount ───
  useEffect(() => {
    if (!gameId) return;
    api.get(`/api/init/${gameId}/difficulty-presets`).then(res => {
      if (res.current?.preset) setPreset(res.current.preset);
    }).catch(() => { /* fall back to gameState values */ });
  }, [gameId]);

  // ─── Storyteller API ───
  const saveStoryteller = useCallback(async (name, directive) => {
    if (!gameId) return;
    setStSaving(true);
    setStError(null);
    try {
      const body = name === 'Custom'
        ? { selection: 'Custom', customText: directive || '' }
        : { selection: name };
      await api.put(`/api/game/${gameId}/settings/storyteller`, body);
    } catch (err) {
      setStError(err.message);
    } finally {
      setStSaving(false);
    }
  }, [gameId]);

  const handleStorytellerSelect = (name) => {
    setStoryteller(name);
    setStError(null);
    if (name !== 'Custom') saveStoryteller(name);
  };

  const handleDirectiveBlur = () => {
    if (storyteller === 'Custom') saveStoryteller('Custom', customDirective);
  };

  // ─── Difficulty API (debounced for sliders) ───
  const saveDifficulty = useCallback((body) => {
    if (!gameId) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    setDiffSaving(true);
    setDiffError(null);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await api.put(`/api/game/${gameId}/settings/difficulty`, body);
      } catch (err) {
        setDiffError(err.message);
      } finally {
        setDiffSaving(false);
      }
    }, 400);
  }, [gameId]);

  useEffect(() => {
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, []);

  const applyPreset = (p) => {
    setPreset(p.id);
    setDcOffset(p.dcOffset);
    setSurvivalEnabled(p.survivalEnabled);
    setDurabilityEnabled(p.durabilityEnabled);
    setProgressionSpeed(p.progressionSpeed / 100);
    setEncounterPressure(p.encounterPressure);
    setFortunesBalanceEnabled(p.fortunesBalanceEnabled);
    setSimplifiedOutcomes(p.simplifiedOutcomes);
    saveDifficulty({ preset: p.id });
  };

  const changeDial = (snakeName, value) => {
    setPreset('custom');
    saveDifficulty({ overrides: { [snakeName]: value } });
  };

  const dcWarning = dcOffset > 4 || dcOffset < -2
    ? 'Beyond designed range; encounter balance may feel off.'
    : null;

  const selectedST = STORYTELLERS.find(s => s.id === storyteller);

  return (
    <div>
      {/* ── Storyteller ── */}
      <SectionLabel extra={stSaving ? <span className={styles.savingDot} /> : null}>
        Storyteller
      </SectionLabel>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
        {STORYTELLERS.map(st => (
          <button key={st.id} onClick={() => handleStorytellerSelect(st.id)} style={{
            padding: '6px 12px', cursor: 'pointer', borderRadius: 5,
            fontFamily: "'Cinzel', serif", fontSize: 12, fontWeight: 600,
            border: `1px solid ${storyteller === st.id ? '#c9a84c' : '#1e2540'}`,
            background: storyteller === st.id ? '#1a1810' : 'transparent',
            color: storyteller === st.id ? '#c9a84c' : '#7082a4',
            transition: 'all 0.2s', letterSpacing: '0.04em',
          }}>
            {st.name}
          </button>
        ))}
      </div>
      {storyteller !== 'Custom' && selectedST && (
        <div style={{
          fontFamily: "var(--font-alegreya)", fontSize: 14, fontStyle: 'italic',
          color: '#8a9ab8', padding: '6px 0 4px',
        }}>
          &ldquo;{selectedST.oneLiner}&rdquo;
        </div>
      )}
      {storyteller === 'Custom' && (
        <div style={{ marginTop: 6 }}>
          <textarea
            value={customDirective}
            onChange={e => { if (e.target.value.length <= 500) setCustomDirective(e.target.value); }}
            onBlur={handleDirectiveBlur}
            placeholder="Describe your narrative voice, or name storytellers to blend."
            maxLength={500}
            style={{
              width: '100%', boxSizing: 'border-box', minHeight: 80, padding: '10px 12px',
              background: '#0a0e1a', border: '1px solid #1e2540', borderRadius: 6,
              fontFamily: "var(--font-alegreya-sans)", fontSize: 14, color: '#c8c0b0',
              outline: 'none', resize: 'vertical', lineHeight: 1.5,
            }}
          />
          <div style={{
            fontFamily: "var(--font-jetbrains)", fontSize: 11,
            color: customDirective.length >= 450 ? '#e8845a' : '#6b83a3',
            textAlign: 'right', marginTop: 4,
          }}>
            {customDirective.length}/500
          </div>
        </div>
      )}
      {stError && <div className={styles.errorText}>{stError}</div>}

      {/* ── Difficulty ── */}
      <SectionLabel extra={diffSaving ? <span className={styles.savingDot} /> : null}>
        Difficulty
      </SectionLabel>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {DIFFICULTY_PRESETS.map(p => (
          <button key={p.id} onClick={() => applyPreset(p)} style={{
            flex: 1, padding: '8px 0', cursor: 'pointer', borderRadius: 5,
            fontFamily: "'Cinzel', serif", fontSize: 12, fontWeight: 700,
            border: `1px solid ${preset === p.id ? p.color + '66' : '#1e2540'}`,
            background: preset === p.id ? p.bg : 'transparent',
            color: preset === p.id ? p.color : '#7082a4',
            transition: 'all 0.2s', letterSpacing: '0.06em',
          }}>
            {p.label}
          </button>
        ))}
      </div>
      {preset === 'custom' && (
        <div style={{ fontFamily: "var(--font-alegreya)", fontSize: 12, color: '#6b83a3', fontStyle: 'italic', marginBottom: 4 }}>
          Custom; one or more dials adjusted from preset
        </div>
      )}

      <SliderControl
        label="DC Offset" value={dcOffset} min={-4} max={6} step={1}
        format={v => (v >= 0 ? `+${v}` : `${v}`)}
        onChange={v => { setDcOffset(v); changeDial('dc_offset', v); }}
        description="Flat modifier applied to all DCs"
        warning={dcWarning}
      />
      <SliderControl
        label="Progression Speed" value={progressionSpeed} min={0.25} max={3} step={0.25}
        format={v => `${v.toFixed(2)}\u00d7`}
        onChange={v => { setProgressionSpeed(v); changeDial('progression_speed', Math.round(v * 100)); }}
        description={progressionSpeed === 0 ? 'All stat/skill gains frozen' : 'Multiplier on stat and skill gains'}
      />
      <SelectorRow
        label="Encounter Pressure" value={encounterPressure}
        options={[{ id: 'low', label: 'Low' }, { id: 'standard', label: 'Standard' }, { id: 'high', label: 'High' }]}
        onChange={v => { setEncounterPressure(v); changeDial('encounter_pressure', v); }}
        description="Frequency and tension of random encounters"
      />
      <Toggle label="Survival" value={survivalEnabled}
        onChange={v => { setSurvivalEnabled(v); changeDial('survival_enabled', v); }}
        description="Track rations, water, and malnourishment" />
      <Toggle label="Durability" value={durabilityEnabled}
        onChange={v => { setDurabilityEnabled(v); changeDial('durability_enabled', v); }}
        description="Items degrade with use and need repair" />
      <Toggle label="Fortune's Balance" value={fortunesBalanceEnabled}
        onChange={v => { setFortunesBalanceEnabled(v); changeDial('fortunes_balance_enabled', v); }}
        description="Outmatched/Matched/Dominant dice categorization" />
      <Toggle label="Simplified Outcomes" value={simplifiedOutcomes}
        onChange={v => { setSimplifiedOutcomes(v); changeDial('simplified_outcomes', v); }}
        description="Binary pass/fail instead of 6-tier system" />

      {diffError && <div className={styles.errorText}>{diffError}</div>}

      {/* ── AI Models (playtester only) ── */}
      <AiModelSection gameId={gameId} />

      <div style={{
        fontFamily: "var(--font-alegreya-sans)", fontSize: 12, color: '#6b83a3',
        marginTop: 16, fontStyle: 'italic',
      }}>
        Changes take effect on the next relevant game event. No retroactive recalculation.
      </div>
    </div>
  );
}

// =============================================================================
// Tab 2: Display
// =============================================================================

function DisplayTab({ settings, onSave }) {
  const update = (key, value) => onSave({ ...settings, [key]: value });
  const isLexie = settings.font === 'lexie';

  return (
    <div>
      {/* Lexie Readable Toggle */}
      <SectionLabel>Reading Font</SectionLabel>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 0', borderBottom: '1px solid #161c34',
      }}>
        <div>
          <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: 14, color: '#c8c0b0' }}>
            Lexie Readable
          </div>
          <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: 12, color: '#6b83a3', marginTop: 2 }}>
            Dyslexia-friendly font
          </div>
        </div>
        <button onClick={() => update('font', isLexie ? 'alegreya' : 'lexie')} style={{
          width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
          background: isLexie ? '#c9a84c' : '#111528',
          border: `1px solid ${isLexie ? '#c9a84c' : '#1e2540'}`,
          position: 'relative', transition: 'all 0.2s', flexShrink: 0, marginLeft: 12,
        }}>
          <div style={{
            width: 18, height: 18, borderRadius: '50%',
            background: isLexie ? '#0a0e1a' : '#8a94a8',
            position: 'absolute', top: 2,
            left: isLexie ? 22 : 2,
            transition: 'left 0.2s, background 0.2s',
          }} />
        </button>
      </div>

      <SectionLabel>Text Size</SectionLabel>
      <div style={{ display: 'flex', gap: 6 }}>
        {SIZES.map(s => (
          <button key={s.id} onClick={() => update('textSize', s.id)} style={{
            flex: 1, padding: '8px 0', cursor: 'pointer', borderRadius: 6,
            fontFamily: "var(--font-alegreya-sans)", fontSize: 13,
            border: `1px solid ${settings.textSize === s.id ? '#c9a84c' : '#1e2540'}`,
            background: settings.textSize === s.id ? '#1a1810' : 'transparent',
            color: settings.textSize === s.id ? '#c9a84c' : '#7082a4',
            transition: 'all 0.2s',
          }}>
            {s.label}
          </button>
        ))}
      </div>

      <div style={{
        fontFamily: "var(--font-alegreya-sans)", fontSize: 12, color: '#6b83a3',
        marginTop: 16, fontStyle: 'italic',
      }}>
        Settings are saved automatically and persist across sessions.
      </div>
    </div>
  );
}

// =============================================================================
// Tab 3: World
// =============================================================================

function WorldTab({ gameId, gameState, onGameStateReload, onClose }) {
  const currentTurn = gameState?.clock?.totalTurn || gameState?.clock?.sessionTurn || 0;
  const campaignName = gameState?.setting || 'My World';

  // ─── Checkpoints ───
  const [checkpoints, setCheckpoints] = useState(null); // null=loading, false=error
  const [cpBusy, setCpBusy] = useState(null); // slot number or 'loading'
  const [cpError, setCpError] = useState(null);
  const [cpConfirm, setCpConfirm] = useState(null); // { action: 'load'|'delete', cp }

  const fetchCheckpoints = useCallback(async () => {
    if (!gameId) return;
    try {
      const res = await api.get(`/api/game/${gameId}/checkpoints`);
      setCheckpoints(res.checkpoints || []);
    } catch {
      setCheckpoints(false);
    }
  }, [gameId]);

  useEffect(() => { fetchCheckpoints(); }, [fetchCheckpoints]);

  const clearCpError = () => { setTimeout(() => setCpError(null), 5000); };

  const handleSaveCheckpoint = async (slotNum) => {
    setCpBusy(slotNum);
    setCpError(null);
    try {
      const name = `Slot ${slotNum} \u2014 Turn ${currentTurn}`;
      await api.post(`/api/game/${gameId}/action`, { command: 'checkpoint', name });
      await fetchCheckpoints();
    } catch (err) {
      setCpError(err.message); clearCpError();
    } finally { setCpBusy(null); }
  };

  const handleLoadCheckpoint = async (cp) => {
    setCpBusy('loading');
    setCpError(null);
    try {
      await api.post(`/api/game/${gameId}/action`, { command: 'restore_checkpoint', target: cp.name });
      setCpConfirm(null);
      onGameStateReload?.();
    } catch (err) {
      setCpError(err.message); clearCpError();
      setCpBusy(null);
    }
  };

  const handleDeleteCheckpoint = async (cp) => {
    setCpBusy(cp.id);
    setCpError(null);
    try {
      await api.post(`/api/game/${gameId}/action`, { command: 'delete_checkpoint', target: cp.name });
      setCpConfirm(null);
      await fetchCheckpoints();
    } catch (err) {
      setCpError(err.message); clearCpError();
    } finally { setCpBusy(null); }
  };

  // ─── Snapshot ───
  const [snapName, setSnapName] = useState(`${campaignName} \u2014 Turn ${currentTurn}`);
  const [snapSaving, setSnapSaving] = useState(false);
  const [snapSuccess, setSnapSuccess] = useState(false);
  const [snapError, setSnapError] = useState(null);

  const handleSaveSnapshot = async () => {
    if (!snapName.trim() || !gameId) return;
    setSnapSaving(true);
    setSnapError(null);
    try {
      await api.post(`/api/game/${gameId}/snapshot`, {
        name: snapName.trim(), description: null, type: 'branch', visibility: 'private',
      });
      setSnapSuccess(true);
      setTimeout(() => setSnapSuccess(false), 2500);
    } catch (err) {
      setSnapError(err.message); setTimeout(() => setSnapError(null), 5000);
    } finally { setSnapSaving(false); }
  };

  // ─── Share ───
  const [shareMode, setShareMode] = useState(null); // null | 'picking' is default, 'sharing' shows link
  const [shareToken, setShareToken] = useState(null);
  const [shareType, setShareType] = useState(null);
  const [shareBusy, setShareBusy] = useState(false);
  const [shareError, setShareError] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleShare = async (type) => {
    if (!gameId) return;
    setShareBusy(true);
    setShareError(null);
    try {
      const res = await api.post(`/api/game/${gameId}/snapshot`, {
        name: `${campaignName} (shared)`,
        description: null,
        type: type === 'began' ? 'fresh_start' : 'branch',
        visibility: 'unlisted',
      });
      setShareToken(res.snapshot?.shareToken || null);
      setShareType(type);
      setShareMode('sharing');
    } catch (err) {
      setShareError(err.message); setTimeout(() => setShareError(null), 5000);
    } finally { setShareBusy(false); }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/snapshot/${shareToken}`;
    try { navigator.clipboard.writeText(url); } catch { /* noop */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // ─── Confirmation Dialog ───
  if (cpConfirm) {
    const { action, cp } = cpConfirm;
    return (
      <div>
        <SectionLabel>{action === 'load' ? 'Load Checkpoint' : 'Delete Checkpoint'}</SectionLabel>
        <div style={{
          background: '#111528', border: '1px solid #1e2540', borderRadius: 8, padding: 20,
          textAlign: 'center',
        }}>
          <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: 14, color: '#c8c0b0', marginBottom: 6 }}>
            {cp.name}
          </div>
          <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: 13, color: '#7082a4', marginBottom: 16 }}>
            {action === 'load'
              ? `Load this checkpoint? Your progress since turn ${cp.turnNumber} will be lost.`
              : 'Delete this checkpoint? This cannot be undone.'}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button onClick={() => setCpConfirm(null)} disabled={cpBusy != null} style={{
              padding: '8px 20px', borderRadius: 5, cursor: 'pointer',
              fontFamily: "var(--font-alegreya-sans)", fontSize: 13,
              background: 'transparent', border: '1px solid #1e2540', color: '#7082a4',
            }}>Cancel</button>
            <button
              onClick={() => action === 'load' ? handleLoadCheckpoint(cp) : handleDeleteCheckpoint(cp)}
              disabled={cpBusy != null}
              style={{
                padding: '8px 20px', borderRadius: 5, cursor: cpBusy ? 'not-allowed' : 'pointer',
                fontFamily: "'Cinzel', serif", fontSize: 12, fontWeight: 700, letterSpacing: '0.06em',
                background: action === 'load' ? '#1a1810' : '#201416',
                border: `1px solid ${action === 'load' ? '#c9a84c' : '#e85a5a'}`,
                color: action === 'load' ? '#c9a84c' : '#e85a5a',
                opacity: cpBusy ? 0.5 : 1,
              }}>
              {cpBusy ? 'Working...' : action === 'load' ? 'Load' : 'Delete'}
            </button>
          </div>
          {cpError && <div className={styles.errorText} style={{ marginTop: 10 }}>{cpError}</div>}
        </div>
      </div>
    );
  }

  // Build checkpoint slots (pad to 3)
  const cpSlots = [1, 2, 3].map(slotNum => {
    const cp = Array.isArray(checkpoints) ? checkpoints[slotNum - 1] : null;
    return { slotNum, cp };
  });

  return (
    <div>
      {/* ── Checkpoints ── */}
      <SectionLabel>Checkpoints</SectionLabel>
      <div style={{ background: '#111528', border: '1px solid #1e2540', borderRadius: 8, padding: 16 }}>
        <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: 13, color: '#7082a4', marginBottom: 12 }}>
          Quick-save up to 3 slots. Save, load, or delete at any time.
        </div>
        {checkpoints === null && (
          <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: 13, color: '#6b83a3', padding: 8 }}>Loading checkpoints...</div>
        )}
        {checkpoints === false && (
          <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: 13, color: '#e8845a' }}>
            Couldn't load checkpoints. <button onClick={fetchCheckpoints} style={{ background: 'none', border: 'none', color: '#c9a84c', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', textDecoration: 'underline', padding: 0 }}>Retry</button>
          </div>
        )}
        {Array.isArray(checkpoints) && cpSlots.map(({ slotNum, cp }) => (
          <div key={slotNum} style={{
            padding: '10px 12px', borderRadius: 6, marginBottom: slotNum < 3 ? 8 : 0,
            border: `1px solid ${cp ? '#3a3328' : '#161c34'}`,
            background: cp ? '#0e1420' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{
              fontFamily: "var(--font-alegreya-sans)", fontSize: 13,
              color: cp ? '#d0c098' : '#6b83a3', fontWeight: cp ? 500 : 400, flex: 1,
            }}>
              {cp ? cp.name : `Slot ${slotNum} \u2014 Empty`}
              {cp && <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: 10, color: '#6b83a3', marginLeft: 8 }}>T{cp.turnNumber}</span>}
            </span>
            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
              {cp ? (
                <>
                  <button onClick={() => setCpConfirm({ action: 'load', cp })} disabled={cpBusy != null} style={{
                    padding: '4px 10px', borderRadius: 4, cursor: 'pointer',
                    fontFamily: "var(--font-alegreya-sans)", fontSize: 12,
                    background: 'transparent', border: '1px solid #1e2540', color: '#7082a4',
                    transition: 'all 0.2s', opacity: cpBusy ? 0.5 : 1,
                  }}>Load</button>
                  <button onClick={() => setCpConfirm({ action: 'delete', cp })} disabled={cpBusy != null} style={{
                    padding: '4px 10px', borderRadius: 4, cursor: 'pointer',
                    fontFamily: "var(--font-alegreya-sans)", fontSize: 12,
                    background: 'transparent', border: '1px solid #161c34', color: '#6b83a3',
                    transition: 'all 0.2s', opacity: cpBusy ? 0.5 : 1,
                  }}>Delete</button>
                </>
              ) : (
                <button onClick={() => handleSaveCheckpoint(slotNum)} disabled={cpBusy != null} style={{
                  padding: '4px 14px', borderRadius: 4, cursor: cpBusy ? 'not-allowed' : 'pointer',
                  fontFamily: "var(--font-alegreya-sans)", fontSize: 12, fontWeight: 600,
                  background: '#1a1810', border: '1px solid #c9a84c',
                  color: '#c9a84c', transition: 'all 0.2s', opacity: cpBusy ? 0.5 : 1,
                }}>{cpBusy === slotNum ? 'Saving...' : 'Save'}</button>
              )}
            </div>
          </div>
        ))}
        {cpError && <div className={styles.errorText} style={{ marginTop: 8 }}>{cpError}</div>}
      </div>

      {/* ── Save World Snapshot ── */}
      <SectionLabel extra={snapSaving ? <span className={styles.savingDot} /> : null}>
        Save World Snapshot
      </SectionLabel>
      <div style={{ background: '#111528', border: '1px solid #1e2540', borderRadius: 8, padding: 16 }}>
        <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: 13, color: '#7082a4', marginBottom: 10 }}>
          Save the current world state to Your Worlds for reuse in future games.
        </div>
        <input
          type="text" value={snapName} onChange={e => setSnapName(e.target.value)}
          maxLength={100}
          style={{
            width: '100%', boxSizing: 'border-box', padding: '8px 12px',
            background: '#0a0e1a', border: '1px solid #1e2540', borderRadius: 6,
            fontFamily: "var(--font-alegreya-sans)", fontSize: 14, color: '#c8c0b0',
            outline: 'none', marginBottom: 10,
          }}
        />
        <button onClick={handleSaveSnapshot} disabled={snapSaving || !snapName.trim()} style={{
          width: '100%', padding: '8px 0', borderRadius: 6, cursor: snapSaving ? 'not-allowed' : 'pointer',
          fontFamily: "var(--font-alegreya-sans)", fontSize: 14, fontWeight: 600,
          background: snapSuccess ? '#10201420' : '#1a1810',
          border: `1px solid ${snapSuccess ? '#8aba7a' : '#c9a84c'}`,
          color: snapSuccess ? '#8aba7a' : '#c9a84c',
          transition: 'all 0.2s', opacity: snapSaving ? 0.5 : 1,
        }}>
          {snapSuccess ? '\u2713 Saved to Your Worlds' : snapSaving ? 'Saving...' : 'Save Snapshot'}
        </button>
        {snapError && <div className={styles.errorText} style={{ marginTop: 6 }}>{snapError}</div>}
      </div>

      {/* ── Share This World ── */}
      <SectionLabel extra={shareBusy ? <span className={styles.savingDot} /> : null}>
        Share This World
      </SectionLabel>
      <div style={{ background: '#111528', border: '1px solid #1e2540', borderRadius: 8, padding: 16 }}>
        {shareMode !== 'sharing' ? (
          <div>
            <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: 13, color: '#7082a4', marginBottom: 12 }}>
              Generate an unlisted link so others can start a game in your world.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => handleShare('began')} disabled={shareBusy} style={{
                flex: 1, padding: '10px 8px', borderRadius: 6, cursor: shareBusy ? 'not-allowed' : 'pointer',
                background: 'transparent', border: '1px solid #1e2540',
                fontFamily: "var(--font-alegreya-sans)", fontSize: 13, color: '#c8c0b0',
                transition: 'all 0.2s', opacity: shareBusy ? 0.5 : 1,
              }}>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>As it began</div>
                <div style={{ fontSize: 11, color: '#6b83a3' }}>Turn 1, original world</div>
              </button>
              <button onClick={() => handleShare('current')} disabled={shareBusy} style={{
                flex: 1, padding: '10px 8px', borderRadius: 6, cursor: shareBusy ? 'not-allowed' : 'pointer',
                background: 'transparent', border: '1px solid #1e2540',
                fontFamily: "var(--font-alegreya-sans)", fontSize: 13, color: '#c8c0b0',
                transition: 'all 0.2s', opacity: shareBusy ? 0.5 : 1,
              }}>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>As it is now</div>
                <div style={{ fontSize: 11, color: '#6b83a3' }}>Turn {currentTurn}, evolved state</div>
              </button>
            </div>
            {shareError && <div className={styles.errorText} style={{ marginTop: 6 }}>{shareError}</div>}
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <button onClick={() => { setShareMode(null); setShareToken(null); setCopied(false); }} style={{
                background: 'none', border: 'none', color: '#6b83a3', cursor: 'pointer',
                fontFamily: "var(--font-alegreya-sans)", fontSize: 12,
              }}>{'\u2190'} Back</button>
              <span style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: 13, color: '#d0c098', fontWeight: 600 }}>
                Share: {shareType === 'began' ? 'As it began' : 'As it is now'}
              </span>
            </div>
            {shareToken ? (
              <>
                <div style={{
                  background: '#0a0e1a', border: '1px solid #1e2540', borderRadius: 6,
                  padding: '8px 12px', fontFamily: "var(--font-jetbrains)", fontSize: 12,
                  color: '#8a94a8', marginBottom: 10, wordBreak: 'break-all',
                }}>
                  {window.location.origin}/snapshot/{shareToken}
                </div>
                <button onClick={handleCopyLink} style={{
                  width: '100%', padding: '8px 0', borderRadius: 6, cursor: 'pointer',
                  fontFamily: "var(--font-alegreya-sans)", fontSize: 14, fontWeight: 600,
                  background: copied ? '#10201420' : '#1a1810',
                  border: `1px solid ${copied ? '#8aba7a' : '#c9a84c'}`,
                  color: copied ? '#8aba7a' : '#c9a84c', transition: 'all 0.2s',
                }}>
                  {copied ? '\u2713 Copied to clipboard' : 'Copy Link'}
                </button>
              </>
            ) : (
              <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: 13, color: '#e8845a' }}>
                Snapshot was created but no share link was returned. Check Your Worlds in the main menu.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Main Settings Modal
// =============================================================================

const TABS = [
  { id: 'game', label: 'Game Settings' },
  { id: 'display', label: 'Display' },
  { id: 'world', label: 'World' },
];

export default function SettingsModal({ settings, onSave, onClose, gameId, gameState, onGameStateReload }) {
  const [activeTab, setActiveTab] = useState('game');

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={e => e.stopPropagation()}>
        {/* Tab bar */}
        <div className={styles.tabBar}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={activeTab === tab.id ? styles.tabButtonActive : styles.tabButton}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
          <div className={styles.tabBarSpacer} />
          <button className={styles.closeButton} onClick={onClose} aria-label="Close settings">
            &times;
          </button>
        </div>

        {/* Tab content */}
        <div className={styles.tabContent}>
          {activeTab === 'game' && <GameSettingsTab gameId={gameId} gameState={gameState} />}
          {activeTab === 'display' && <DisplayTab settings={settings} onSave={onSave} />}
          {activeTab === 'world' && (
            <WorldTab
              gameId={gameId}
              gameState={gameState}
              onGameStateReload={onGameStateReload}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
}
