import { useState, useMemo } from 'react';
import styles from './GlossaryTab.module.css';
import sidebarStyles from './Sidebar.module.css';

const TABS = [
  { id: 'all', label: 'All', match: null },
  { id: 'npc', label: 'People', match: 'npc' },
  { id: 'location', label: 'Places', match: 'location' },
  { id: 'faction', label: 'Factions', match: 'faction' },
  { id: 'item', label: 'Items', match: 'item' },
  { id: 'other', label: 'Other', match: null },
];

const KNOWN_CATEGORIES = new Set(['npc', 'location', 'faction', 'item']);

export default function GlossaryTab({ data, characterData, onEntityClick }) {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  if (!data) {
    return <div className={sidebarStyles.loadingState}>Loading glossary...</div>;
  }

  const entries = Array.isArray(data.entries) ? data.entries : [];

  // Count per tab for badges
  const counts = useMemo(() => {
    const c = { all: entries.length, npc: 0, location: 0, faction: 0, item: 0, other: 0 };
    entries.forEach(e => {
      const cat = (e.category || '').toLowerCase();
      if (KNOWN_CATEGORIES.has(cat)) c[cat]++;
      else c.other++;
    });
    return c;
  }, [entries]);

  // Filter entries by active tab + search term
  const filtered = useMemo(() => {
    return entries.filter(e => {
      const cat = (e.category || '').toLowerCase();
      if (activeTab === 'all') { /* no category filter */ }
      else if (activeTab === 'other') { if (KNOWN_CATEGORIES.has(cat)) return false; }
      else if (cat !== activeTab) return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (e.term || '').toLowerCase().includes(q) ||
             (e.definition || '').toLowerCase().includes(q);
    });
  }, [entries, search, activeTab]);

  if (entries.length === 0) {
    return <div className={sidebarStyles.emptyState}>No glossary entries yet.</div>;
  }

  return (
    <div>
      {/* Category tabs */}
      <div className={styles.tabRow}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={activeTab === tab.id ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab(tab.id)}
            aria-label={`Filter: ${tab.label}`}
          >
            {tab.label}
            {counts[tab.id] > 0 && tab.id !== 'all' && (
              <span className={styles.tabCount}>{counts[tab.id]}</span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        type="text"
        className={styles.searchInput}
        placeholder="Search entries..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        aria-label="Search glossary"
      />

      <div className={styles.resultCount}>{filtered.length} entries</div>

      {filtered.map(entry => (
        <div key={entry.id || entry.term} className={styles.entryCard} onClick={() => {
          const entity = { term: entry.term, type: entry.category, id: entry.id };
          // For items, merge mechanical data from character inventory if available
          if ((entry.category || '').toLowerCase() === 'item' && characterData) {
            const allItems = [...(characterData.inventory?.equipped || []), ...(characterData.inventory?.carried || [])];
            const match = allItems.find(i => i.name === entry.term);
            if (match) Object.assign(entity, match, { term: entry.term, type: 'item' });
          }
          onEntityClick?.(entity);
        }}>
          <div className={styles.entryTerm}>{entry.term}</div>
          <div className={styles.entryMeta}>
            <span className={styles.entryCategory}>{entry.category}</span>
            {entry.discoveredAt && (
              <span className={styles.entryDiscovered}>{entry.discoveredAt}</span>
            )}
          </div>
          <div className={styles.entryDef}>{entry.definition}</div>
        </div>
      ))}

      {filtered.length === 0 && search.trim() && (
        <div className={sidebarStyles.emptyState}>No entries match your search.</div>
      )}
    </div>
  );
}
