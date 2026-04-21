import React, { useState, forwardRef, useMemo } from 'react';
import TurnRoll from './TurnRoll';
import ReflectionBlock from './ReflectionBlock';
import { renderNarrative } from '@/lib/renderLinkedText';
import styles from './TurnBlock.module.css';

// ─── Map resolution → TurnRoll challenge + result ───
// Done here so TurnRoll can stay ignorant of the backend payload shape.
function buildTurnRollProps(resolution, playerAction, stateChanges) {
  if (!resolution) return null;
  const diceRolled = Array.isArray(resolution.diceRolled) ? resolution.diceRolled : [];
  const mode = (resolution.fortunesBalance || 'matched').toLowerCase();
  const isCrit = resolution.crucibleExtreme === 'nat20' || resolution.crucibleRoll === 20;
  const isFumble = resolution.crucibleExtreme === 'nat1' || resolution.crucibleRoll === 1;

  // Mortal dice (outmatched/dominant only). Backend sends either 1 value (matched)
  // or 2 values. Extremes are resolved on the crucible alone with no mortals.
  const mortal1 = diceRolled.length >= 2 ? diceRolled[0] : null;
  const mortal2 = diceRolled.length >= 2 ? diceRolled[1] : null;

  // Winner (kept value) from the backend — used to know which mortal side "won".
  let winner = 1;
  if (mortal1 != null && mortal2 != null) {
    if (mode === 'dominant') {
      winner = (mortal1 <= mortal2) ? 1 : 2;
    } else {
      winner = (mortal1 >= mortal2) ? 1 : 2;
    }
  }

  // Stat value from the turn's stateChanges snapshot (falls back to N/A).
  const statKey = (resolution.stat || '').toLowerCase();
  const stateStats = stateChanges?.stats;
  let statValue = null;
  if (stateStats && statKey) {
    const entry = stateStats[statKey];
    if (typeof entry === 'number') statValue = entry;
    else if (entry && typeof entry === 'object') {
      statValue = entry.effective ?? entry.base ?? null;
    }
  }

  // Action label — prefer explicit resolution.action, fall back to the raw player action.
  const rawAction = resolution.action || playerAction || null;
  const actionLabel = rawAction ? rawAction.split(':').pop().trim() : null;

  const challenge = {
    stat: resolution.stat || null,
    statValue,
    skill: resolution.skillUsed || null,
    skillValue: resolution.skillModifier ?? null,
    mode,
    prompt: resolution.prompt || null, // not sent by backend yet — render-when-present
    actionLabel,
  };

  const result = {
    kept: resolution.dieSelected,
    total: resolution.total,
    crucible: resolution.crucibleRoll,
    mortal1,
    mortal2,
    winner,
    isCrit,
    isFumble,
    mode,
    crucibleRoll: resolution.crucibleRoll,
    dieSelected: resolution.dieSelected,
    diceRolled,
    tier: resolution.tier,
    tierName: resolution.tierName,
    dc: resolution.dc,
    margin: resolution.margin,
  };

  return { challenge, result };
}

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

// Returns true if stateChanges has any condition or inventory entries worth
// showing. Prevents rendering the "THIS TURN" label over an empty chip row.
function hasAnyStateChange(stateChanges) {
  if (!stateChanges) return false;
  for (const g of [stateChanges.conditions, stateChanges.inventory]) {
    if (!g) continue;
    if ((g.added?.length || 0) > 0) return true;
    if ((g.removed?.length || 0) > 0) return true;
    if ((g.modified?.length || 0) > 0) return true;
  }
  return false;
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

  const rollProps = useMemo(
    () => hasResolution ? buildTurnRollProps(turn.resolution, turn.playerAction, turn.stateChanges) : null,
    [hasResolution, turn.resolution, turn.playerAction, turn.stateChanges]
  );

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

      {/* Dice: TurnRoll plays the animated challenge → CompactChip flow on new turns,
          or renders CompactChip directly for historical turns (animate={false}). */}
      {hasResolution && rollProps && (
        <TurnRoll
          challenge={rollProps.challenge}
          result={rollProps.result}
          animate={shouldAnimate}
          onResolved={() => setShowContent(true)}
        />
      )}

      {/* Narrative + consequences appear after the dice animation completes.
          When shouldAnimate is true, wrap in .postRoll so children fade up in
          staggered sequence (150/300/450ms delays). Historical turns skip the
          animation — they render immediately. */}
      {showContent && (
        <div className={shouldAnimate ? styles.postRoll : undefined}>
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

          {hasAnyStateChange(turn.stateChanges) && (
            <div className={styles.consequences}>
              <div className={styles.consequencesLabel}>THIS TURN</div>
              <StatusBadges stateChanges={turn.stateChanges} inventoryItems={inventoryItems} />
            </div>
          )}
          <NpcWoundStates npcStates={turn.npcStates} />
        </div>
      )}
    </div>
  );
});

export default TurnBlock;
