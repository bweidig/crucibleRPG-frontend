import { useState, useMemo } from 'react';
import styles from './GlossaryTab.module.css';
import sidebarStyles from './Sidebar.module.css';

export default function GlossaryTab({ data, onEntityClick }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  if (!data) {
    return <div className={sidebarStyles.loadingState}>Loading glossary...</div>;
  }

  const entries = Array.isArray(data.entries) ? data.entries : [];

  // Extract unique categories for the filter dropdown
  const categories = useMemo(() => {
    const set = new Set();
    entries.forEach(e => { if (e.category) set.add(e.category); });
    return Array.from(set).sort();
  }, [entries]);

  // Filter entries by search term and category
  const filtered = useMemo(() => {
    return entries.filter(e => {
      const matchesCategory = category === 'all' ||
        (e.category || '').toLowerCase() === category.toLowerCase();
      if (!matchesCategory) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (e.term || '').toLowerCase().includes(q) ||
             (e.definition || '').toLowerCase().includes(q);
    });
  }, [entries, search, category]);

  if (entries.length === 0) {
    return <div className={sidebarStyles.emptyState}>No glossary entries yet.</div>;
  }

  return (
    <div>
      <div className={styles.searchRow}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search entries..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Search glossary"
        />
        <select
          className={styles.categorySelect}
          value={category}
          onChange={e => setCategory(e.target.value)}
          aria-label="Filter by category"
        >
          <option value="all">All</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div className={styles.resultCount}>{filtered.length} entries</div>

      {filtered.map(entry => (
        <div key={entry.id || entry.term} className={styles.entryCard} onClick={() => onEntityClick?.({ term: entry.term, type: entry.category, id: entry.id })}>
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
