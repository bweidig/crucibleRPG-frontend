import React from 'react';
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

// Format a number for resolution display: show one decimal place
function fmt(n) {
  if (n == null) return '?';
  return typeof n === 'number' ? n.toFixed(1) : String(n);
}

// One-line resolution summary
// Format: STAT + Skill(modifier) + d20(dieSelected) = total vs DC dc | margin: tierName
function ResolutionSummary({ resolution }) {
  if (!resolution) return null;

  const stat = (resolution.stat || '').toUpperCase();
  const skill = resolution.skillUsed || null;
  const modifier = resolution.skillModifier;
  const isSuccess = resolution.margin >= 0;
  const marginSign = resolution.margin > 0 ? '+' : '';

  return (
    <div className={styles.resolution}>
      <span className={styles.resolutionStat}>{stat}</span>
      {skill && (
        <span>{` + ${skill}(${modifier != null ? fmt(modifier) : '?'})`}</span>
      )}
      <span className={styles.resolutionDice}>{` + d20(${resolution.dieSelected})`}</span>
      <span className={styles.resolutionCalc}>{` = ${fmt(resolution.total)} vs DC ${fmt(resolution.dc)}`}</span>
      <span className={styles.resolutionDivider}>{' | '}</span>
      <span className={isSuccess ? styles.resolutionSuccess : styles.resolutionFailure}>
        {marginSign}{fmt(resolution.margin)}: {resolution.tierName}
      </span>
    </div>
  );
}

// Status change badges from stateChanges
function StatusBadges({ stateChanges }) {
  if (!stateChanges) return null;

  const badges = [];

  const collect = (group, category) => {
    if (!group) return;
    if (Array.isArray(group.added)) {
      group.added.forEach(item => {
        badges.push({ type: 'added', text: `+ ${item.name || item}`, key: `${category}-add-${item.name || item}` });
      });
    }
    if (Array.isArray(group.removed)) {
      group.removed.forEach(item => {
        badges.push({ type: 'removed', text: `\u2013 ${item.name || item}`, key: `${category}-rm-${item.name || item}` });
      });
    }
    if (Array.isArray(group.modified)) {
      group.modified.forEach(item => {
        badges.push({ type: 'modified', text: `~ ${item.name || item}`, key: `${category}-mod-${item.name || item}` });
      });
    }
  };

  collect(stateChanges.conditions, 'cond');
  collect(stateChanges.inventory, 'inv');

  if (badges.length === 0) return null;

  const badgeClass = (type) => {
    if (type === 'added') return styles.badgeAdded;
    if (type === 'removed') return styles.badgeRemoved;
    return styles.badgeModified;
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

export default function TurnBlock({ turn }) {
  const clockStr = formatClock(turn.clock);

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

      <ResolutionSummary resolution={turn.resolution} />

      <div className={styles.narrativeText}>
        {renderNarrative(turn.narrative)}
      </div>

      <StatusBadges stateChanges={turn.stateChanges} />
    </div>
  );
}
