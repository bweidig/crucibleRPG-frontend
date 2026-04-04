import styles from './ReflectionBlock.module.css';
import { renderNarrative } from '@/lib/renderLinkedText';

function gainTypeIcon(type) {
  if (type === 'stat') return '\u25B2';       // ▲
  if (type === 'spell_pattern') return '\u2726'; // ✦
  return '\u25CF';                               // ● (skill default)
}

function gainTypeClass(type) {
  if (type === 'stat') return styles.gainStat;
  if (type === 'spell_pattern') return styles.gainSpell;
  return styles.gainSkill;
}

export default function ReflectionBlock({ reflection, glossaryTerms, onEntityClick }) {
  if (!reflection) return null;

  // Blocked state — starvation prevents reflection
  if (reflection.blocked) {
    return (
      <div className={styles.reflectionBlock}>
        <div className={styles.header}>
          <span className={styles.headerIcon}>{'\u2726'}</span>
          <span className={styles.headerLabel}>Reflection</span>
        </div>
        <p className={styles.blockedText}>
          Your body aches for rest, but hunger gnaws too deeply for real recovery.
        </p>
      </div>
    );
  }

  // No narrative — nothing to show
  if (!reflection.narrative) return null;

  const gains = Array.isArray(reflection.gains) ? reflection.gains : [];
  const overflow = Array.isArray(reflection.overflow) ? reflection.overflow : [];
  const questBonuses = Array.isArray(reflection.questBonuses) ? reflection.questBonuses : [];
  const hasGains = gains.length > 0;

  return (
    <div className={styles.reflectionBlock}>
      <div className={styles.header}>
        <span className={styles.headerIcon}>{'\u2726'}</span>
        <span className={styles.headerLabel}>Reflection</span>
      </div>

      <div className={styles.narrative}>
        {renderNarrative(reflection.narrative, glossaryTerms, onEntityClick)}
      </div>

      {questBonuses.length > 0 && (
        <div className={styles.questBonuses}>
          {questBonuses.map((qb, i) => (
            <div key={i} className={styles.questLine}>
              {qb.questTitle} completed
              {qb.skillTarget && ` \u2014 ${qb.skillTarget} ${qb.skillBonus}`}
              {qb.statTarget && `, ${qb.statTarget} ${qb.statBonus}`}
            </div>
          ))}
        </div>
      )}

      {hasGains && (
        <div className={styles.gainsTable}>
          {gains.map((g, i) => (
            <div key={i} className={styles.gainRow}>
              <span className={styles.gainName}>
                <span className={`${styles.gainIcon} ${gainTypeClass(g.type)}`}>{gainTypeIcon(g.type)}</span>
                {g.name}
              </span>
              <span className={styles.gainAmount}>{g.displayAmount}</span>
            </div>
          ))}
        </div>
      )}

      {overflow.length > 0 && (
        <div className={styles.overflowLine}>
          Overflow: {overflow.map(o => `${o.name} ${o.displayAmount}`).join(', ')} — carried to next Reflection
        </div>
      )}
    </div>
  );
}
