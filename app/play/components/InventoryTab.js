import PanelSection from './PanelSection';
import styles from './InventoryTab.module.css';
import sidebarStyles from './Sidebar.module.css';

// Durability color coding per design spec:
// 76%+ green, 51-75% yellow, 26-50% orange, 1-25% red, 0% dark red
function getDurabilityColor(durability, maxDurability) {
  if (!maxDurability || maxDurability === 0) return '#8a94a8';
  const pct = (durability / maxDurability) * 100;
  if (pct === 0) return '#8a3a3a';
  if (pct <= 25) return '#e85a5a';
  if (pct <= 50) return '#e8845a';
  if (pct <= 75) return '#e8c45a';
  return '#8aba7a';
}

function ItemRow({ item, isEquipped, onEntityClick }) {
  const durPct = item.maxDurability > 0
    ? (item.durability / item.maxDurability) * 100
    : 100;
  const durColor = getDurabilityColor(item.durability, item.maxDurability);
  const broken = item.durability === 0;

  return (
    <div className={isEquipped ? styles.itemRowEquipped : styles.itemRow} style={{ opacity: broken ? 0.5 : 1, cursor: 'pointer' }} onClick={() => onEntityClick?.({ ...item, term: item.name, type: 'item' })}>
      <div className={styles.itemLeft}>
        {isEquipped && <span className={styles.equippedDot} title="Equipped" />}
        <span className={`${styles.itemName} ${broken ? styles.itemNameBroken : ''}`}>
          {item.name}
        </span>
        {item.heirloom && <span className={styles.heirloomBadge}>heirloom</span>}
        {item.materialQuality && (
          <span className={styles.itemQuality}>{item.materialQuality}</span>
        )}
      </div>
      <div className={styles.itemRight}>
        <div className={styles.durBarTrack}>
          <div
            className={styles.durBarFill}
            style={{ width: `${durPct}%`, background: durColor }}
          />
        </div>
        <span className={styles.itemDurability} style={{ color: durColor }}>
          {item.durability}/{item.maxDurability}
        </span>
        {item.qualityBonus !== 0 && item.qualityBonus != null && (
          <span className={styles.qualityBonus}>
            {item.qualityBonus > 0 ? '+' : ''}{item.qualityBonus.toFixed(1)}
          </span>
        )}
        <span className={styles.itemSlots}>{item.slotCost?.toFixed(1)}</span>
      </div>
    </div>
  );
}

export default function InventoryTab({ data, onEntityClick }) {
  if (!data) {
    return <div className={sidebarStyles.loadingState}>Loading inventory...</div>;
  }

  const inventory = data.inventory;
  if (!inventory) {
    return <div className={sidebarStyles.emptyState}>No inventory data</div>;
  }

  const equipped = Array.isArray(inventory.equipped) ? inventory.equipped : [];
  const carried = Array.isArray(inventory.carried) ? inventory.carried : [];

  return (
    <div>
      {/* Header: slots + encumbrance */}
      <div className={styles.header}>
        <span className={styles.slots}>
          {inventory.usedSlots?.toFixed(1)} / {inventory.maxSlots?.toFixed(1)} slots
        </span>
        {inventory.encumbrance && (
          <span className={styles.encumbrance}>{inventory.encumbrance}</span>
        )}
      </div>

      {/* Currency — display string only, never raw */}
      {inventory.currency?.display && (
        <div className={styles.currency}>{inventory.currency.display}</div>
      )}

      <PanelSection title="Equipped">
        {equipped.length === 0 ? (
          <div className={sidebarStyles.emptyState}>Nothing equipped</div>
        ) : (
          equipped.map(item => <ItemRow key={item.id || item.name} item={item} isEquipped onEntityClick={onEntityClick} />)
        )}
      </PanelSection>

      <PanelSection title="Carried">
        {carried.length === 0 ? (
          <div className={sidebarStyles.emptyState}>Nothing carried</div>
        ) : (
          carried.map(item => <ItemRow key={item.id || item.name} item={item} onEntityClick={onEntityClick} />)
        )}
      </PanelSection>
    </div>
  );
}
