import { renderLinkedText, cleanDefinition } from '@/lib/renderLinkedText';
import styles from './NPCTab.module.css';
import sidebarStyles from './Sidebar.module.css';

export default function NPCTab({ glossaryData, glossaryTerms, onEntityClick }) {
  if (!glossaryData) {
    return <div className={sidebarStyles.loadingState}>Loading...</div>;
  }

  const entries = Array.isArray(glossaryData.entries) ? glossaryData.entries : [];
  // Filter glossary entries for NPC-category items (case-insensitive)
  const npcs = entries.filter(e =>
    (e.category || '').toLowerCase() === 'npc'
  );

  if (npcs.length === 0) {
    return <div className={sidebarStyles.emptyState}>No NPCs encountered yet.</div>;
  }

  return (
    <div>
      {npcs.map(npc => (
        <div key={npc.id || npc.term} className={styles.npcCard} onClick={() => onEntityClick?.({ term: npc.term, type: 'npc', id: npc.id })} style={{ cursor: 'pointer' }}>
          <div className={styles.npcHeader}>
            <span className={styles.npcName}>{cleanDefinition(npc.term)}</span>
            <span className={styles.npcCategory}>NPC</span>
          </div>
          <div className={styles.npcDefinition}>{renderLinkedText(cleanDefinition(npc.definition), glossaryTerms, onEntityClick)}</div>
          {npc.discoveredAt && (
            <div className={styles.npcDiscovered}>Discovered: {npc.discoveredAt}</div>
          )}
        </div>
      ))}
    </div>
  );
}
