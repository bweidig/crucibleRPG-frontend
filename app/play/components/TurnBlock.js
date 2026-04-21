import React, { useState, forwardRef } from 'react';
import InlineDicePanel from './InlineDicePanel';
import ResolutionBlock from './ResolutionBlock';
import ReflectionBlock from './ReflectionBlock';
import { renderNarrative } from '@/lib/renderLinkedText';
import styles from './TurnBlock.module.css';

// 24h time for the turn header (e.g. "14:22")
function format24h(clock) {
  if (!clock) return null;
  const hour = clock.hour ?? Math.floor((clock.globalClock || 0) / 60);
  const minute = clock.minute ?? ((clock.globalClock || 0) % 60);
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

// ─── Status Change Badges ───
// Conditions: added=warning(orange), removed=cleared(green), modified=escalated(orange)
// Inventory: added=gained(gold), removed=lost(orange), modified=modified(blue)
// CON conditions get red instead of orange

// Check if a condition targets an NPC rather than the player.
// TODO: Backend should include a `target` or `owner` field on condition stateChanges
// (e.g. target: "player" | "npc", with optional targetName). Until then, this reads
// `target` / `owner` if present, falling back to player assumption.
function isNpcCondition(item) {
  if (typeof item !== 'object' || item === null) return false;
  const t = (item.target || item.owner || '').toLowerCase();
  return t && t !== 'player' && t !== 'self';
}

// Extract item name from stateChanges inventory entries.
// Backend may send strings, objects with `name`, or objects with `itemName`.
function getItemName(item, inventoryItems) {
  if (typeof item === 'string') return item;
  const name = item.name || item.itemName || item.displayName;
  if (name) return name;
  // Fallback: match against current inventory by id
  if (item.id != null && inventoryItems) {
    const match = inventoryItems.find(i => i.id === item.id);
    if (match) return match.name;
  }
  return 'Unknown item';
}

function NpcWoundStates({ npcStates }) {
  if (!Array.isArray(npcStates) || npcStates.length === 0) return null;

  // Only show wounded-or-worse NPCs — hide the default "engaged" state
  const visible = npcStates.filter(npc => npc.woundState && npc.woundState !== 'engaged');
  if (visible.length === 0) return null;

  return (
    <div className={styles.badges} style={{ marginTop: 8 }}>
      <span className={styles.npcStatesLabel}>Enemy Status</span>
      {visible.map(npc => {
        const defeated = npc.defeated || npc.woundState === 'defeated';
        let cls, icon;
        if (defeated) {
          cls = styles.badgeNpcDefeated;
          icon = '☠'; // ☠
        } else if (npc.woundState === 'desperate') {
          cls = styles.badgeNpcDesperate;
          icon = '⚠'; // ⚠
        } else {
          cls = styles.badgeNpcBloodied;
          icon = '\u{1FA78}'; // 🩸
        }
        const label = defeated ? 'Defeated' : npc.woundState.charAt(0).toUpperCase() + npc.woundState.slice(1);
        return (
          <span key={npc.npcId || npc.name} className={`${styles.badge} ${cls}`}>
            {icon} {npc.name} — {label}
          </span>
        );
      })}
    </div>
  );
}

function StatusBadges({ stateChanges, inventoryItems }) {
  if (!stateChanges) return null;

  const badges = [];

  // Conditions
  const conds = stateChanges.conditions;
  if (conds) {
    if (Array.isArray(conds.added)) {
      conds.added.forEach(item => {
        const name = typeof item === 'string' ? item : (item.name || 'Unknown condition');
        const isNpc = isNpcCondition(item);
        const isCon = !isNpc && (typeof item === 'object' && item !== null) ? (item.stat || '').toLowerCase() === 'con' : false;
        const npcLabel = isNpc ? (item.targetName || item.target || '') : '';
        const icon = isNpc ? '⚔' : '⚠'; // ⚔ for enemy, ⚠ for player
        badges.push({
          type: isNpc ? 'condEnemy' : (isCon ? 'condConDanger' : 'condAdded'),
          text: `${icon} ${npcLabel ? `${npcLabel}: ` : ''}${name}${(typeof item === 'object' && item?.penalty) ? `: ${item.penalty} ${(item.stat || '').toUpperCase()}` : ''}`,
          key: `cond-add-${name}-${npcLabel}`,
        });
      });
    }
    if (Array.isArray(conds.removed)) {
      conds.removed.forEach(item => {
        const name = typeof item === 'string' ? item : (item.name || 'Unknown condition');
        const isNpc = isNpcCondition(item);
        const npcLabel = isNpc ? (item.targetName || item.target || '') : '';
        badges.push({
          type: isNpc ? 'condEnemyCleared' : 'condRemoved',
          text: `✓ ${npcLabel ? `${npcLabel}: ` : ''}${name} cleared`,
          key: `cond-rm-${name}-${npcLabel}`,
        });
      });
    }
    if (Array.isArray(conds.modified)) {
      conds.modified.forEach(item => {
        const name = typeof item === 'string' ? item : (item.name || 'Unknown condition');
        const isNpc = isNpcCondition(item);
        const isCon = !isNpc && (typeof item === 'object' && item !== null) ? (item.stat || '').toLowerCase() === 'con' : false;
        const npcLabel = isNpc ? (item.targetName || item.target || '') : '';
        const icon = isNpc ? '⚔' : '⚠';
        badges.push({
          type: isNpc ? 'condEnemy' : (isCon ? 'condConDanger' : 'condModified'),
          text: `${icon} ${npcLabel ? `${npcLabel}: ` : ''}${name}${(typeof item === 'object' && item?.previousName) ? ` → ${item.name}` : ' escalated'}`,
          key: `cond-mod-${name}-${npcLabel}`,
        });
      });
    }
  }

  // Inventory
  const inv = stateChanges.inventory;
  if (inv) {
    if (Array.isArray(inv.added)) {
      inv.added.forEach(item => {
        const name = getItemName(item, inventoryItems);
        badges.push({
          type: 'invAdded',
          text: `+ ${name}`,
          key: `inv-add-${name}`,
        });
      });
    }
    if (Array.isArray(inv.removed)) {
      inv.removed.forEach(item => {
        const name = getItemName(item, inventoryItems);
        badges.push({
          type: 'invRemoved',
          text: `– ${name}`,
          key: `inv-rm-${name}`,
        });
      });
    }
    if (Array.isArray(inv.modified)) {
      inv.modified.forEach(item => {
        const name = getItemName(item, inventoryItems);
        badges.push({
          type: 'invModified',
          text: `~ ${name}`,
          key: `inv-mod-${name}`,
        });
      });
    }
  }

  if (badges.length === 0) return null;

  const badgeClass = (type) => {
    switch (type) {
      case 'condAdded':       return styles.badgeCondWarning;
      case 'condModified':    return styles.badgeCondWarning;
      case 'condConDanger':   return styles.badgeCondCon;
      case 'condRemoved':     return styles.badgeCondCleared;
      case 'condEnemy':       return styles.badgeCondEnemy;
      case 'condEnemyCleared':return styles.badgeCondCleared;
      case 'invAdded':        return styles.badgeInvGained;
      case 'invRemoved':      return styles.badgeInvLost;
      case 'invModified':     return styles.badgeInvModified;
      default:                return styles.badgeCondWarning;
    }
  };

  return (
    <div className={styles.badges}>
      {badges.map(b => (
        <span key={b.key} className={`${styles.badge} ${badgeClass(b.type)}`}>
          {b.text}
        </span>
      ))}
    </div>
  );
}

const TurnBlock = forwardRef(function TurnBlock({ turn, isNew, glossaryTerms, onEntityClick, inventoryItems, onImageClick }, ref) {
  // A turn has a resolution only when the backend sent a non-null object.
  // SKIP turns (no-roll actions) send resolution: null — don't render the dice/DC panels.
  const hasResolution = turn.resolution != null && typeof turn.resolution === 'object';
  const shouldAnimate = isNew && hasResolution;
  const [showContent, setShowContent] = useState(!shouldAnimate);

  const timeStr = format24h(turn.clock);
  const day = turn.clock?.day ?? turn.clock?.currentDay;
  // Zero-pad the turn number to 3 digits — "042" reads as a chapter marker rather than a running count.
  const turnLabel = turn.number != null ? `TURN ${String(turn.number).padStart(3, '0')}` : null;
  const metaParts = [];
  if (day != null) metaParts.push(`DAY ${String(day).padStart(2, '0')}`);
  if (timeStr) metaParts.push(timeStr);
  const metaStr = metaParts.join(' · '); // middle dot separator

  return (
    <div className={`${styles.turnBlock} ${isNew ? styles.turnIn : ''}`} ref={ref}>
      <div className={styles.turnHeader}>
        {turnLabel && <span className={styles.turnLabel}>{turnLabel}</span>}
        {metaStr && <span className={styles.turnMeta}>{metaStr}</span>}
        <div className={styles.turnRule} />
      </div>

      {turn.playerAction && (
        <div className={styles.playerAction}>{turn.playerAction}</div>
      )}

      {/* Dice display — shows Fortune's Balance, animated d20s. Only render on turns with a resolution. */}
      {hasResolution && (
        <InlineDicePanel
          resolution={turn.resolution}
          animate={shouldAnimate}
          onComplete={() => setShowContent(true)}
        />
      )}

      {/* Resolution + narrative appear after dice animation completes */}
      {showContent && (
        <>
          {hasResolution && <ResolutionBlock resolution={turn.resolution} />}

          <ReflectionBlock reflection={turn.reflection} glossaryTerms={glossaryTerms} onEntityClick={onEntityClick} />

          <div className={styles.narrativeText}>
            {renderNarrative(turn.narrative, glossaryTerms, onEntityClick)}
          </div>

          {turn.sceneImage && (
            <div className={styles.sceneImageBlock}>
              <button
                className={styles.sceneImageButton}
                onClick={() => onImageClick?.(turn.sceneImage)}
                aria-label="View full image"
              >
                <img
                  src={turn.sceneImage.imageUrl}
                  alt={turn.sceneImage.blurb || 'Scene visualization'}
                  className={styles.sceneImage}
                />
              </button>
              {turn.sceneImage.blurb && (
                <div className={styles.sceneCaption}>{turn.sceneImage.blurb}</div>
              )}
            </div>
          )}

          <StatusBadges stateChanges={turn.stateChanges} inventoryItems={inventoryItems} />
          <NpcWoundStates npcStates={turn.npcStates} />
        </>
      )}
    </div>
  );
});

export default TurnBlock;
