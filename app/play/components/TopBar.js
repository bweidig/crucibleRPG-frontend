import Link from 'next/link';
import styles from './TopBar.module.css';

function SidebarIcon({ color }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="15" y1="3" x2="15" y2="21" />
    </svg>
  );
}

function SettingsIcon({ color }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export default function TopBar({ setting, sseConnected, sidebarOpen, onToggleSidebar, onOpenSettings }) {
  return (
    <header className={styles.topBar}>
      <div className={styles.left}>
        <Link href="/menu" className={styles.wordmark}>
          <span className={styles.crucible}>CRUCIBLE</span>
          <span className={styles.rpg}>RPG</span>
        </Link>
        {setting && (
          <>
            <div className={styles.separator} />
            <span className={styles.settingName}>{setting}</span>
          </>
        )}
      </div>
      <div className={styles.right}>
        <button
          className={styles.iconButton}
          onClick={onOpenSettings}
          title="Display settings"
          aria-label="Display settings"
        >
          <SettingsIcon color="#7082a4" />
        </button>
        <button
          className={styles.iconButton}
          onClick={onToggleSidebar}
          title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
          aria-label={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
        >
          <SidebarIcon color={sidebarOpen ? '#c9a84c' : '#7082a4'} />
        </button>
        <div
          className={styles.connectionDot}
          style={{ background: sseConnected ? '#8aba7a' : '#e8845a' }}
          title={sseConnected ? 'Connected' : 'Disconnected'}
          aria-label={sseConnected ? 'Server connected' : 'Server disconnected'}
        />
      </div>
    </header>
  );
}
