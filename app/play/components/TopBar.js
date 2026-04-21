import Link from 'next/link';
import AuthAvatar from '@/components/AuthAvatar';
import styles from './TopBar.module.css';

function SidebarIcon({ color }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="15" y1="3" x2="15" y2="21" />
    </svg>
  );
}

function BookIcon({ color }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
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

function formatTopBarClock(clock) {
  if (!clock) return null;
  const hour = clock.hour ?? Math.floor((clock.globalClock || 0) / 60);
  const minute = clock.minute ?? ((clock.globalClock || 0) % 60);
  const day = clock.day ?? clock.currentDay;
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  const timeStr = `${displayHour}:${String(minute).padStart(2, '0')} ${period}`;
  return { day, timeStr, weather: clock.weather || null };
}

export default function TopBar({ setting, clock, turnNumber, sseConnected, sidebarOpen, onToggleSidebar, onOpenSettings, debugMode }) {
  const clockData = formatTopBarClock(clock);
  const turnDisplay = turnNumber != null ? String(turnNumber).padStart(3, '0') : null;

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
        {clockData && (
          <div className={styles.clockDisplay}>
            {clockData.day && <span className={styles.clockSegment}>Day {clockData.day}</span>}
            <span className={styles.clockDot}>{'\u00b7'}</span>
            <span className={styles.clockSegment}>{clockData.timeStr}</span>
            {clockData.weather && (
              <>
                <span className={styles.clockDot}>{'\u00b7'}</span>
                <span className={styles.clockWeather}>{clockData.weather}</span>
              </>
            )}
          </div>
        )}
        {turnDisplay && (
          <div className={styles.turnPill} title={`Turn ${turnDisplay}`}>
            <span className={styles.turnPillLabel}>TURN</span>
            <span className={styles.turnPillNumber}>{turnDisplay}</span>
          </div>
        )}
        {debugMode && (
          <div className={styles.debugBadge} title="Debug mode active (Ctrl+Shift+D to toggle)">
            DEBUG
          </div>
        )}
        <Link
          href="/rulebook"
          target="_blank"
          className={styles.iconButton}
          title="Rulebook"
          aria-label="Rulebook"
        >
          <BookIcon color="#7082a4" />
        </Link>
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
        <AuthAvatar size={28} />
        <div
          className={styles.connectionDot}
          style={{ background: sseConnected ? 'rgba(201, 168, 76, 0.6)' : '#e8845a' }}
          title={sseConnected ? 'Connected' : 'Disconnected'}
          aria-label={sseConnected ? 'Server connected' : 'Server disconnected'}
        />
      </div>
    </header>
  );
}
