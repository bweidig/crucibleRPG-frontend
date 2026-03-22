import PanelSection from './PanelSection';
import styles from './CharacterTab.module.css';
import sidebarStyles from './Sidebar.module.css';

const BASE_STAT_ORDER = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
const STAT_LABELS = {
  str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA', pot: 'POT',
};
const STAT_FULL = {
  str: 'Strength', dex: 'Dexterity', con: 'Constitution',
  int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma', pot: 'Potency',
};

function StatBar({ statKey, stat, onEntityClick }) {
  const effective = stat.effective ?? stat.base ?? 0;
  const base = stat.base ?? 0;
  const hasPenalty = effective < base;
  const pctEffective = Math.min((effective / 20) * 100, 100);
  const pctBase = Math.min((base / 20) * 100, 100);

  return (
    <div className={styles.statRow} title={STAT_FULL[statKey]} onClick={() => onEntityClick?.({ term: STAT_LABELS[statKey], type: 'stat' })} style={{ cursor: 'pointer' }}>
      <div className={styles.statHeader}>
        <span className={styles.statName}>{STAT_LABELS[statKey]}</span>
        <span className={`${styles.statValue} ${hasPenalty ? styles.statPenalized : styles.statNormal}`}>
          {effective.toFixed(1)}
          {hasPenalty && <span className={styles.statBase}> / {base.toFixed(1)}</span>}
        </span>
      </div>
      <div className={styles.barTrack}>
        {hasPenalty && (
          <div className={styles.barBase} style={{ width: `${pctBase}%` }} />
        )}
        <div
          className={`${styles.barFill} ${hasPenalty ? styles.barPenalized : styles.barNormal}`}
          style={{ width: `${pctEffective}%` }}
        />
      </div>
    </div>
  );
}

export default function CharacterTab({ data, onEntityClick }) {
  if (!data) {
    return <div className={sidebarStyles.loadingState}>Loading character...</div>;
  }

  const stats = data.stats || {};
  const skills = Array.isArray(data.skills) ? data.skills : [];
  const conditions = Array.isArray(data.conditions) ? data.conditions : [];
  const companions = Array.isArray(data.companions) ? data.companions : [];

  const activeSkills = skills.filter(s => s.type === 'active');
  const foundationalSkills = skills.filter(s => s.type === 'foundational');

  return (
    <div>
      {data.character?.name && (
        <div style={{
          fontFamily: 'var(--font-cinzel)', fontSize: '15px', fontWeight: 700,
          color: 'var(--text-heading)', marginBottom: '12px'
        }}>
          {data.character.name}
        </div>
      )}

      <PanelSection title="Stats">
        {(() => {
          const order = [...BASE_STAT_ORDER];
          const potStat = stats.pot;
          if (potStat && (potStat.base > 0 || potStat.effective > 0)) order.push('pot');
          return order.map(key => {
            const stat = stats[key];
            if (!stat) return null;
            return <StatBar key={key} statKey={key} stat={stat} onEntityClick={onEntityClick} />;
          });
        })()}
      </PanelSection>

      <PanelSection title="Skills">
        {skills.length === 0 ? (
          <div className={sidebarStyles.emptyState}>No skills yet</div>
        ) : (
          <>
            {activeSkills.map((skill, i) => (
              <div key={`a-${i}`} className={styles.skillRow}>
                <span>
                  <span className={styles.skillName}>{skill.name}</span>
                  <span className={styles.skillType}>active</span>
                </span>
                <span className={styles.skillModifier}>+{skill.modifier?.toFixed(1)}</span>
              </div>
            ))}
            {foundationalSkills.map((skill, i) => (
              <div key={`f-${i}`} className={styles.skillRow}>
                <span>
                  <span className={styles.skillName}>{skill.name}</span>
                  <span className={styles.skillType}>foundational</span>
                </span>
                <span className={styles.skillModifier}>+{skill.modifier?.toFixed(1)}</span>
              </div>
            ))}
          </>
        )}
      </PanelSection>

      <PanelSection title="Conditions" defaultOpen={conditions.length > 0}>
        {conditions.length === 0 ? (
          <div className={sidebarStyles.emptyState}>No active conditions</div>
        ) : (
          conditions.map((cond, i) => {
            const isCon = (cond.stat || '').toLowerCase() === 'con';
            const val = cond.penalty ?? 0;
            const isBuff = cond.isBuff != null ? cond.isBuff === true : val < 0;
            const absVal = Math.abs(val);
            const signedVal = isBuff ? `+${absVal.toFixed(1)}` : `\u2212${absVal.toFixed(1)}`;
            return (
              <div key={cond.id || i} className={styles.conditionCard} onClick={() => onEntityClick?.({ term: cond.name, type: 'condition', id: cond.id })} style={{ cursor: 'pointer' }}>
                <div className={`${styles.conditionHeader} ${isCon ? styles.conditionHeaderCon : ''}`}>
                  {cond.name}: <span className={isBuff ? styles.conditionBuff : styles.conditionPenalty}>{signedVal}</span> {(cond.stat || '').toUpperCase()}
                </div>
                <div className={styles.conditionDetail}>
                  {cond.durationType?.replace(/_/g, ' ')}
                  {cond.escalation ? ` \u00b7 Escalates \u2192 ${cond.escalation}` : ''}
                </div>
              </div>
            );
          })
        )}
      </PanelSection>

      {companions.length > 0 && (
        <PanelSection title="Companions">
          {companions.map((comp, i) => (
            <div key={comp.id || i} className={styles.skillRow}>
              <span className={styles.skillName}>{comp.name}</span>
              <span className={styles.skillModifier}>{comp.specialty}</span>
            </div>
          ))}
        </PanelSection>
      )}
    </div>
  );
}
