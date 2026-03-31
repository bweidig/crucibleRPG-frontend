import { useState, useCallback } from 'react';
import CharacterTab from './CharacterTab';
import InventoryTab from './InventoryTab';
import NPCTab from './NPCTab';
import GlossaryTab from './GlossaryTab';
import MapTab from './MapTab';
import NotesTab from './NotesTab';
import styles from './Sidebar.module.css';

// ─── SVG Tab Icons (from mockup's TabIcons) ───

const TabIcons = {
  character: (color) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  ),
  inventory: (color) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  ),
  npcs: (color) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  glossary: (color) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  map: (color) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  ),
  notes: (color) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="12" y2="17" />
    </svg>
  ),
};

const TABS = [
  { id: 'character', label: 'Character' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'npcs', label: 'NPCs' },
  { id: 'glossary', label: 'Glossary' },
  { id: 'map', label: 'Map' },
  { id: 'notes', label: 'Notes' },
];

export default function Sidebar({
  collapsed,
  characterData,
  glossaryData,
  mapData,
  notesData,
  gameId,
  notifications,
  onClearNotification,
  onNotesChange,
  onEntityClick,
  onOpenReport,
  debugMode,
  isDebugUser,
  onToggleDebug,
}) {
  const [activeTab, setActiveTab] = useState('character');
  const [width, setWidth] = useState(340);

  const handleTabClick = useCallback((tabId) => {
    setActiveTab(tabId);
    if (notifications?.[tabId]) {
      onClearNotification?.(tabId);
    }
  }, [notifications, onClearNotification]);

  // ─── Resize Handle ───
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = width;

    const onMove = (moveE) => {
      const delta = startX - moveE.clientX;
      setWidth(Math.max(280, Math.min(600, startWidth + delta)));
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [width]);

  if (collapsed) return null;

  const renderContent = () => {
    switch (activeTab) {
      case 'character':
        return <CharacterTab data={characterData} onEntityClick={onEntityClick} />;
      case 'inventory':
        return <InventoryTab data={characterData} onEntityClick={onEntityClick} />;
      case 'npcs':
        return <NPCTab glossaryData={glossaryData} onEntityClick={onEntityClick} />;
      case 'glossary':
        return <GlossaryTab data={glossaryData} characterData={characterData} onEntityClick={onEntityClick} />;
      case 'map':
        return <MapTab data={mapData} gameId={gameId} onEntityClick={onEntityClick} />;
      case 'notes':
        return <NotesTab data={notesData} gameId={gameId} onNotesChange={onNotesChange} />;
      default:
        return null;
    }
  };

  return (
    <div className={styles.sidebar} style={{ width }}>
      <div className={styles.resizeHandle} onMouseDown={handleMouseDown} />
      <div className={styles.tabBar}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
            onClick={() => handleTabClick(tab.id)}
            title={tab.label}
            aria-label={tab.label}
          >
            {TabIcons[tab.id](activeTab === tab.id ? '#c9a84c' : '#7082a4')}
            {notifications?.[tab.id] > 0 && (
              <span className={styles.badge}>{notifications[tab.id]}</span>
            )}
          </button>
        ))}
      </div>
      <div className={styles.tabContent}>
        {renderContent()}
      </div>
      {(onOpenReport || isDebugUser) && (
        <div className={styles.sidebarFooter}>
          {onOpenReport && (
            <>
              <button className={styles.footerBtn} onClick={() => onOpenReport('bug')}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="8" y="6" width="8" height="14" rx="4" /><path d="M19 10h2" /><path d="M3 10h2" />
                  <path d="M19 14h2" /><path d="M3 14h2" /><path d="M19 18h2" /><path d="M3 18h2" />
                  <path d="M16 2l-2 4" /><path d="M8 2l2 4" />
                </svg>
                Bug
              </button>
              <button className={styles.footerBtn} onClick={() => onOpenReport('suggest')}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18h6" /><path d="M10 22h4" />
                  <path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />
                </svg>
                Suggest
              </button>
            </>
          )}
          {isDebugUser && onToggleDebug && (
            <button className={styles.footerBtn} onClick={onToggleDebug}
              style={{ color: debugMode ? '#c9a84c' : undefined, borderColor: debugMode ? '#c9a84c33' : undefined }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
              </svg>
              Debug {debugMode ? 'ON' : 'OFF'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
