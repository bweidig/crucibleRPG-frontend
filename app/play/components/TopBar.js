import styles from './TopBar.module.css';

// Sidebar toggle icon (from mockup BarIcons.sidebar)
function SidebarIcon({ color }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="15" y1="3" x2="15" y2="21" />
    </svg>
  );
}

export default function TopBar({ setting, sseConnected, sidebarOpen, onToggleSidebar }) {
  return (
    <header className={styles.topBar}>
      <div className={styles.left}>
        <div className={styles.wordmark}>
          <span className={styles.crucible}>CRUCIBLE</span>
          <span className={styles.rpg}>RPG</span>
        </div>
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
