import React, { useState } from 'react';
import InlineDicePanel from './InlineDicePanel';
import ResolutionBlock from './ResolutionBlock';
import styles from './TurnBlock.module.css';

// Format clock data into a readable string
// Handles both shapes: { globalClock, currentDay } from game state
// and { day, hour, minute } from stateChanges.clock
function formatClock(clock) {
  if (!clock) return null;

  const hour = clock.hour ?? Math.floor((clock.globalClock || 0) / 60);
  const minute = clock.minute ?? ((clock.globalClock || 0) % 60);
  const day = clock.day ?? clock.currentDay;

  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;

  const parts = [];
  if (day) parts.push(`Day ${day}`);
  parts.push(`${displayHour}:${String(minute).padStart(2, '0')} ${period}`);
  return parts.join(' \u00b7 ');
}

// Render narrative text: \n\n = paragraph break, \n = <br>
function renderNarrative(text) {
  if (!text) return null;
  return text.split('\n\n').map((paragraph, i) => {
    const lines = paragraph.split('\n');
    return (
      <p key={i}>
        {lines.map((line, j) => (
          <React.Fragment key={j}>
            {j > 0 && <br />}
            {line}
          </React.Fragment>
        ))}
      </p>
    );
  });
}

// ─── Status Change Badges ───
// Conditions: added=warning(orange), removed=cleared(green), modified=escalated(orange)
// Inventory: added=gained(gold), removed=lost(orange), modified=modified(blue)
// CON conditions get red instead of orange

function StatusBadges({ stateChanges }) {
  if (!stateChanges) return null;

  const badges = [];

  // Conditions
  const conds = stateChanges.conditions;
  if (conds) {
    if (Array.isArray(conds.added)) {
      conds.added.forEach(item => {
        const name = item.name || item;
        const isCon = (item.stat || '').toLowerCase() === 'con';
        badges.push({
          type: isCon ? 'condConDanger' : 'condAdded',
          text: `\u26A0 ${name}${item.penalty ? `: ${item.penalty} ${(item.stat || '').toUpperCase()}` : ''}`,
          key: `cond-add-${name}`,
        });
      });
    }
    if (Array.isArray(conds.removed)) {
      conds.removed.forEach(item => {
        const name = item.name || item;
        badges.push({
          type: 'condRemoved',
          text: `\u2713 ${name} cleared`,
          key: `cond-rm-${name}`,
        });
      });
    }
    if (Array.isArray(conds.modified)) {
      conds.modified.forEach(item => {
        const name = item.name || item;
        const isCon = (item.stat || '').toLowerCase() === 'con';
        badges.push({
          type: isCon ? 'condConDanger' : 'condModified',
          text: `\u26A0 ${name}${item.previousName ? ` \u2192 ${item.name}` : ' escalated'}`,
          key: `cond-mod-${name}`,
        });
      });
    }
  }

  // Inventory
  const inv = stateChanges.inventory;
  if (inv) {
    if (Array.isArray(inv.added)) {
      inv.added.forEach(item => {
        const name = item.name || item;
        badges.push({
          type: 'invAdded',
          text: `+ ${name}`,
          key: `inv-add-${name}`,
        });
      });
    }
    if (Array.isArray(inv.removed)) {
      inv.removed.forEach(item => {
        const name = item.name || item;
        badges.push({
          type: 'invRemoved',
          text: `\u2013 ${name}`,
          key: `inv-rm-${name}`,
        });
      });
    }
    if (Array.isArray(inv.modified)) {
      inv.modified.forEach(item => {
        const name = item.name || item;
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
      case 'condAdded':    return styles.badgeCondWarning;
      case 'condModified': return styles.badgeCondWarning;
      case 'condConDanger':return styles.badgeCondCon;
      case 'condRemoved':  return styles.badgeCondCleared;
      case 'invAdded':     return styles.badgeInvGained;
      case 'invRemoved':   return styles.badgeInvLost;
      case 'invModified':  return styles.badgeInvModified;
      default:             return styles.badgeCondWarning;
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

export default function TurnBlock({ turn, isNew }) {
  const clockStr = formatClock(turn.clock);
  const hasResolution = !!turn.resolution;
  const shouldAnimate = isNew && hasResolution;

  // When animating, delay showing resolution + narrative until dice are done
  const [showContent, setShowContent] = useState(!shouldAnimate);

  return (
    <div className={styles.turnBlock}>
      <div className={styles.turnHeader}>
        <span className={styles.turnNumber}>TURN {turn.number}</span>
        {clockStr && <span className={styles.clockInfo}>{clockStr}</span>}
        {turn.clock?.weather && (
          <span className={styles.weather}>{turn.clock.weather}</span>
        )}
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

          <div className={styles.narrativeText}>
            {renderNarrative(turn.narrative)}
          </div>

          <StatusBadges stateChanges={turn.stateChanges} />
        </>
      )}
    </div>
  );
}
