import React, { useState, forwardRef } from 'react';
import InlineDicePanel from './InlineDicePanel';
import ResolutionBlock from './ResolutionBlock';
import ReflectionBlock from './ReflectionBlock';
import { renderNarrative } from '@/lib/renderLinkedText';
import styles from './TurnBlock.module.css';

// Format clock fields for display
function formatTime(clock) {
  if (!clock) return null;
  const hour = clock.hour ?? Math.floor((clock.globalClock || 0) / 60);
  const minute = clock.minute ?? ((clock.globalClock || 0) % 60);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, '0')} ${period}`;
}

function getTimeEmoji(clock) {
  if (!clock) return null;
  const hour = clock.hour ?? Math.floor((clock.globalClock || 0) / 60);
  if (hour >= 5 && hour < 8) return '\u{1F305}';   // sunrise
  if (hour >= 8 && hour < 18) return '\u2600\uFE0F'; // sun
  if (hour >= 18 && hour < 21) return '\u{1F307}';  // sunset
  return '\u{1F319}';                                 // night
}

function getWeatherEmoji(weather) {
  if (!weather) return null;
  const w = weather.toLowerCase();
  if (w.includes('clear') || w.includes('sunny')) return '\u2600\uFE0F';
  if (w.includes('cloud') || w.includes('overcast')) return '\u2601\uFE0F';
  if (w.includes('storm') || w.includes('thunder')) return '\u26C8\uFE0F';
  if (w.includes('rain') || w.includes('drizzle')) return '\u{1F327}\uFE0F';
  if (w.includes('snow') || w.includes('blizzard')) return '\u2744\uFE0F';
  if (w.includes('fog') || w.includes('mist')) return '\u{1F32B}\uFE0F';
  if (w.includes('wind')) return '\u{1F32C}\uFE0F';
  return null;
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

  // Only show non-fresh NPCs
  const visible = npcStates.filter(npc => npc.woundState && npc.woundState !== 'fresh');
  if (visible.length === 0) return null;

  return (
    <div className={styles.badges} style={{ marginTop: 8 }}>
      <span className={styles.npcStatesLabel}>Enemy Status</span>
      {visible.map(npc => {
        const defeated = npc.defeated || npc.woundState === 'incapacitated';
        let cls, icon;
        if (defeated) {
          cls = styles.badgeNpcDefeated;
          icon = '\u2620'; // ☠
        } else if (npc.woundState === 'staggering') {
          cls = styles.badgeNpcStaggering;
          icon = '\u26A0'; // ⚠
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
        const icon = isNpc ? '\u2694' : '\u26A0'; // ⚔ for enemy, ⚠ for player
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
          text: `\u2713 ${npcLabel ? `${npcLabel}: ` : ''}${name} cleared`,
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
        const icon = isNpc ? '\u2694' : '\u26A0';
        badges.push({
          type: isNpc ? 'condEnemy' : (isCon ? 'condConDanger' : 'condModified'),
          text: `${icon} ${npcLabel ? `${npcLabel}: ` : ''}${name}${(typeof item === 'object' && item?.previousName) ? ` \u2192 ${item.name}` : ' escalated'}`,
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
          text: `\u2013 ${name}`,
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

const TurnBlock = forwardRef(function TurnBlock({ turn, isNew, glossaryTerms, onEntityClick, inventoryItems }, ref) {
  const hasResolution = !!turn.resolution;
  const shouldAnimate = isNew && hasResolution;
  const [showContent, setShowContent] = useState(!shouldAnimate);

  const timeStr = formatTime(turn.clock);
  const timeEmoji = getTimeEmoji(turn.clock);
  const day = turn.clock?.day ?? turn.clock?.currentDay;
  const weatherEmoji = getWeatherEmoji(turn.weather);

  return (
    <div className={styles.turnBlock} ref={ref}>
      <div className={styles.turnHeader}>
        {turn.location && (
          <span className={styles.headerChip}>
            <span className={styles.headerEmoji}>{'\u{1F4CD}'}</span>
            <span className={styles.headerValue}>{turn.location}</span>
          </span>
        )}
        {day && (
          <span className={styles.headerChip}>
            <span className={styles.headerEmoji}>{'\u{1F4C5}'}</span>
            <span className={styles.headerValue}>Day {day}</span>
          </span>
        )}
        {timeStr && (
          <span className={styles.headerChip}>
            <span className={styles.headerEmoji}>{timeEmoji}</span>
            <span className={styles.headerValue}>{timeStr}</span>
          </span>
        )}
        {turn.weather && (
          <span className={styles.headerChip}>
            {weatherEmoji && <span className={styles.headerEmoji}>{weatherEmoji}</span>}
            <span className={styles.headerValue}>{turn.weather}</span>
          </span>
        )}
        <span className={styles.headerChip}>
          <span className={styles.headerEmoji}>{'\u{1F504}'}</span>
          <span className={styles.headerValue}>Turn {turn.number}</span>
        </span>
      </div>

      {turn.playerAction && (
        <div className={styles.playerAction}>{turn.playerAction}</div>
      )}

      {/* Dice display — shows Fortune's Balance, animated d20s */}
      <InlineDicePanel
        resolution={turn.resolution}
        animate={shouldAnimate}
        onComplete={() => setShowContent(true)}
      />

      {/* Resolution + narrative appear after dice animation completes */}
      {showContent && (
        <>
          <ResolutionBlock resolution={turn.resolution} />

          <ReflectionBlock reflection={turn.reflection} glossaryTerms={glossaryTerms} onEntityClick={onEntityClick} />

          <div className={styles.narrativeText}>
            {renderNarrative(turn.narrative, glossaryTerms, onEntityClick)}
          </div>

          <StatusBadges stateChanges={turn.stateChanges} inventoryItems={inventoryItems} />
          <NpcWoundStates npcStates={turn.npcStates} />
        </>
      )}
    </div>
  );
});

export default TurnBlock;
