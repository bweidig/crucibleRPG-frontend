import React, { useState, forwardRef } from 'react';
import InlineDicePanel from './InlineDicePanel';
import ResolutionBlock from './ResolutionBlock';
import ReflectionBlock from './ReflectionBlock';
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
        const name = typeof item === 'string' ? item : (item.name || 'Unknown condition');
        const isCon = (typeof item === 'object' && item !== null) ? (item.stat || '').toLowerCase() === 'con' : false;
        badges.push({
          type: isCon ? 'condConDanger' : 'condAdded',
          text: `\u26A0 ${name}${(typeof item === 'object' && item?.penalty) ? `: ${item.penalty} ${(item.stat || '').toUpperCase()}` : ''}`,
          key: `cond-add-${name}`,
        });
      });
    }
    if (Array.isArray(conds.removed)) {
      conds.removed.forEach(item => {
        const name = typeof item === 'string' ? item : (item.name || 'Unknown condition');
        badges.push({
          type: 'condRemoved',
          text: `\u2713 ${name} cleared`,
          key: `cond-rm-${name}`,
        });
      });
    }
    if (Array.isArray(conds.modified)) {
      conds.modified.forEach(item => {
        const name = typeof item === 'string' ? item : (item.name || 'Unknown condition');
        const isCon = (typeof item === 'object' && item !== null) ? (item.stat || '').toLowerCase() === 'con' : false;
        badges.push({
          type: isCon ? 'condConDanger' : 'condModified',
          text: `\u26A0 ${name}${(typeof item === 'object' && item?.previousName) ? ` \u2192 ${item.name}` : ' escalated'}`,
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
        const name = typeof item === 'string' ? item : (item.name || 'Unknown item');
        badges.push({
          type: 'invAdded',
          text: `+ ${name}`,
          key: `inv-add-${name}`,
        });
      });
    }
    if (Array.isArray(inv.removed)) {
      inv.removed.forEach(item => {
        const name = typeof item === 'string' ? item : (item.name || 'Unknown item');
        badges.push({
          type: 'invRemoved',
          text: `\u2013 ${name}`,
          key: `inv-rm-${name}`,
        });
      });
    }
    if (Array.isArray(inv.modified)) {
      inv.modified.forEach(item => {
        const name = typeof item === 'string' ? item : (item.name || 'Unknown item');
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

const TurnBlock = forwardRef(function TurnBlock({ turn, isNew }, ref) {
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

          <ReflectionBlock reflection={turn.reflection} />

          <div className={styles.narrativeText}>
            {renderNarrative(turn.narrative)}
          </div>

          <StatusBadges stateChanges={turn.stateChanges} />
        </>
      )}
    </div>
  );
});

export default TurnBlock;
