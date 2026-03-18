import { useEffect } from 'react';
import styles from './SettingsModal.module.css';

// ─── Theme Definitions (CSS variable overrides) ───

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
  { id: 'lexie', label: 'Lexie Readable', family: "'Lexie Readable', sans-serif" },
  { id: 'system', label: 'System Default', family: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  { id: 'alegreya', label: 'Alegreya', family: "'Alegreya', serif" },
  { id: 'georgia', label: 'Georgia', family: "Georgia, 'Times New Roman', serif" },
  { id: 'mono', label: 'Monospace', family: "'JetBrains Mono', 'Courier New', monospace" },
];

export const SIZES = [
  { id: 'small', label: 'Small', narrative: '13px', ui: '11px' },
  { id: 'medium', label: 'Medium', narrative: '15px', ui: '12.5px' },
  { id: 'large', label: 'Large', narrative: '17px', ui: '14px' },
  { id: 'xlarge', label: 'X-Large', narrative: '19px', ui: '15px' },
];

export default function SettingsModal({ settings, onSave, onClose }) {
  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const update = (key, value) => {
    onSave({ ...settings, [key]: value });
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.title}>Display Settings</span>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close">&times;</button>
        </div>
        <div className={styles.body}>
          {/* Theme */}
          <div className={styles.sectionLabel}>Theme</div>
          <div className={styles.selectorRow}>
            {['dark', 'light', 'sepia'].map(t => (
              <button
                key={t}
                className={`${styles.selectorButton} ${settings.theme === t ? styles.selectorActive : styles.selectorInactive}`}
                onClick={() => update('theme', t)}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* Font */}
          <div className={styles.sectionLabel}>Body Font</div>
          <div className={styles.selectorRow}>
            {FONTS.map(f => (
              <button
                key={f.id}
                className={`${styles.selectorButton} ${settings.font === f.id ? styles.selectorActive : styles.selectorInactive}`}
                onClick={() => update('font', f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Text Size */}
          <div className={styles.sectionLabel}>Text Size</div>
          <div className={styles.selectorRow}>
            {SIZES.map(s => (
              <button
                key={s.id}
                className={`${styles.selectorButton} ${settings.textSize === s.id ? styles.selectorActive : styles.selectorInactive}`}
                onClick={() => update('textSize', s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
