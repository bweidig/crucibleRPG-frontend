'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';

// --- SVG ICONS ---

const Icons = {
  chronicler: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <line x1="8" y1="7" x2="16" y2="7" /><line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  ),
  bard: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.5 4.5H18l-3.5 2.7 1.3 4.3L12 12l-3.8 2.5 1.3-4.3L6 7.5h4.5z" />
      <path d="M12 17v4" /><path d="M8 21h8" />
    </svg>
  ),
  trickster: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 9h0" /><path d="M16 9h0" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <circle cx="8" cy="9" r="1" fill="currentColor" /><circle cx="16" cy="9" r="1" fill="currentColor" />
    </svg>
  ),
  poet: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
      <line x1="16" y1="8" x2="2" y2="22" /><line x1="17.5" y1="15" x2="9" y2="15" />
    </svg>
  ),
  whisper: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
      <line x1="1" y1="1" x2="23" y2="23" opacity="0.3" />
    </svg>
  ),
  noir: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C8 2 3 4 3 8c0 2 1 3 3 3h12c2 0 3-1 3-3 0-4-5-6-9-6z" />
      <path d="M4 11c-1 0-2 .5-2 1.5S3 14 4 14" />
      <path d="M20 11c1 0 2 .5 2 1.5S21 14 20 14" />
      <line x1="6" y1="8" x2="18" y2="8" />
    </svg>
  ),
  custom_story: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  ),
  sword_soil: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 17.5L3 6V3h3l11.5 11.5" /><path d="M13 19l6-6" /><path d="M16 16l4 4" /><path d="M19 21l2-2" />
      <path d="M14.5 6.5l3-3 3 3-3 3z" />
    </svg>
  ),
  smoke_steel: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" /><path d="M12 1v2" /><path d="M12 21v2" />
      <path d="M4.22 4.22l1.42 1.42" /><path d="M18.36 18.36l1.42 1.42" />
      <path d="M1 12h2" /><path d="M21 12h2" />
      <path d="M4.22 19.78l1.42-1.42" /><path d="M18.36 5.64l1.42-1.42" />
    </svg>
  ),
  concrete_code: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="13" rx="1" /><rect x="14" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="15" width="7" height="6" rx="1" /><rect x="3" y="19" width="7" height="2" rx="1" />
    </svg>
  ),
  stars_circuits: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="2" /><path d="M12 2v4" /><path d="M12 18v4" />
      <path d="M4.93 4.93l2.83 2.83" /><path d="M16.24 16.24l2.83 2.83" />
      <path d="M2 12h4" /><path d="M18 12h4" />
      <path d="M4.93 19.07l2.83-2.83" /><path d="M16.24 7.76l2.83-2.83" />
      <circle cx="12" cy="12" r="9" strokeDasharray="4 3" opacity="0.4" />
    </svg>
  ),
  ash_remnants: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2c1 3 4 5.5 4 9a4 4 0 0 1-8 0c0-3.5 3-6 4-9z" />
      <path d="M12 15v3" /><path d="M8 22h8" /><path d="M10 22v-2" /><path d="M14 22v-2" />
    </svg>
  ),
  dream_myth: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      <circle cx="7.5" cy="11" r="0.5" fill="currentColor" /><circle cx="10" cy="7.5" r="0.5" fill="currentColor" />
      <circle cx="6" cy="15" r="0.5" fill="currentColor" />
    </svg>
  ),
  custom_setting: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  flashpoint: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  subtle_hook: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  ),
  long_road: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" y1="3" x2="9" y2="18" /><line x1="15" y1="6" x2="15" y2="21" />
    </svg>
  ),
  custom_start: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  ),
};

// --- DATA ---

const STORYTELLERS = [
  { id: 'chronicler', name: 'Chronicler', icon: 'chronicler', tone: 'Grounded and observational', desc: 'The world as it is.' },
  { id: 'bard', name: 'Bard', icon: 'bard', tone: 'Epic and dramatic', desc: 'You are the hero of this story.' },
  { id: 'trickster', name: 'Trickster', icon: 'trickster', tone: 'Playful and ironic', desc: 'The world has a sense of humor.' },
  { id: 'poet', name: 'Poet', icon: 'poet', tone: 'Tender and bittersweet', desc: 'Every victory has a cost.' },
  { id: 'whisper', name: 'Whisper', icon: 'whisper', tone: 'Warm and unsettling', desc: 'Everything is fine. Almost.' },
  { id: 'noir', name: 'Noir', icon: 'noir', tone: 'World-weary and sharp', desc: 'Nobody is clean.' },
  { id: 'custom', name: 'Custom', icon: 'custom_story', tone: 'Your narrative voice', desc: 'Define your own voice.' },
];

const SETTINGS = [
  { id: 'sword-soil', name: 'Sword & Soil', icon: 'sword_soil', desc: 'Pre-gunpowder. Muscle, metal, and maybe magic. Feudal, tribal, or ancient civilizations.' },
  { id: 'smoke-steel', name: 'Smoke & Steel', icon: 'smoke_steel', desc: 'Gunpowder through early mechanization. Steam, factories, revolution, and empire.' },
  { id: 'concrete-code', name: 'Concrete & Code', icon: 'concrete_code', desc: 'Twentieth century through near-future. Guns, cars, computers, bureaucracy.' },
  { id: 'stars-circuits', name: 'Stars & Circuits', icon: 'stars_circuits', desc: 'Spacefaring, cybernetic, post-human. The technology defines the society.' },
  { id: 'ash-remnants', name: 'Ash & Remnants', icon: 'ash_remnants', desc: 'Post-collapse. Something ended. What\'s left is what you have.' },
  { id: 'dream-myth', name: 'Dream & Myth', icon: 'dream_myth', desc: 'Surreal, mythic, or strange. Reality\'s rules are suggestions.' },
  { id: 'custom', name: 'Custom', icon: 'custom_setting', desc: 'Blend the above, twist them, or build a world entirely your own.' },
];

const DIFFICULTIES = [
  { id: 'forgiving', name: 'Forgiving', color: '#6aba7a', desc: 'Heroic power fantasy. You\'re the protagonist and the world bends around you.' },
  { id: 'standard', name: 'Standard', color: '#b8a88a', desc: 'Balanced challenge. Success is earned, failure has consequences, but the odds are fair.' },
  { id: 'harsh', name: 'Harsh', color: '#e8a04a', desc: 'Punishing. Tactical play required. Every fight could leave you wounded. Resources matter.' },
  { id: 'brutal', name: 'Brutal', color: '#c84a4a', desc: 'Near-lethal. Every fight is a risk. Death is a real and constant possibility.' },
];

const INTENSITIES = [
  { id: 'calm', name: 'Calm', desc: 'Low immediate threat. Time to orient and explore.' },
  { id: 'standard', name: 'Standard', desc: 'Moderate tension. Clear hook with proportional stakes.' },
  { id: 'dire', name: 'Dire', desc: 'High pressure from turn one. Immediate danger, scarce resources, ticking clock.' },
];

const SCENARIOS = [
  { key: 'A', name: 'Flashpoint', type: 'Action', icon: 'flashpoint', desc: 'You\'re already in the thick of it. A crisis demands immediate action — fight, flee, or improvise.' },
  { key: 'B', name: 'Subtle Hook', type: 'Intrigue', icon: 'subtle_hook', desc: 'Something isn\'t right. A whisper, a letter, a wrong face in a familiar crowd. The thread is there if you pull it.' },
  { key: 'C', name: 'Long Road', type: 'Survival', icon: 'long_road', desc: 'You\'re on a journey. The destination matters, but the road between here and there is where the story lives.' },
  { key: 'D', name: 'Custom Start', type: 'Your Choice', icon: 'custom_start', desc: 'Describe how your story begins. You set the direction — the engine sets the stage.' },
];

const SETTING_QUESTIONS = {
  'sword-soil': [
    { label: 'Magic', options: ['None', 'Rare', 'Common', 'Pervasive'] },
    { label: 'Non-human races', options: ['Humans only', 'Rare / Hidden', 'Common'] },
    { label: 'Political structure', options: ['Tribal', 'Feudal', 'City-States', 'Empire'] },
    { label: "Civilization's arc", options: ['Rising', 'Stable', 'Declining', 'Fallen'] },
  ],
  'smoke-steel': [
    { label: 'Remnant magic', options: ['None', 'Dying echoes', 'Coexists with industry'] },
    { label: 'Non-human beings', options: ['Humans only', 'Rare / Hidden', 'Common'] },
    { label: 'Technology aesthetic', options: ['Grounded industrial', 'Steampunk / fantastical'] },
    { label: 'Industrialization', options: ['Early steam', 'Full mechanization', 'Electrification'] },
    { label: 'Political tension', options: ['Stable empire', 'Revolution brewing', 'Open conflict'] },
  ],
  'concrete-code': [
    { label: 'Supernatural elements', options: ['None', 'Urban legends with teeth', 'Hidden world'] },
    { label: 'Era', options: ['Mid-20th century', 'Modern day', 'Near-future'] },
    { label: 'Power structure', options: ['Democratic', 'Authoritarian', 'Corporate-controlled'] },
    { label: 'Tone', options: ['Procedural realism', 'Conspiracy thriller', 'Everyday life, strange edges'] },
  ],
  'stars-circuits': [
    { label: 'Supernatural / psionic power', options: ['None', 'Rare', 'Common'] },
    { label: 'Alien life', options: ['Humans only', 'Exists but rare', 'Everywhere'] },
    { label: 'Space travel', options: ['Subluminal (slow, isolated)', 'FTL (connected galaxy)'] },
    { label: 'Cybernetics / augmentation', options: ['Rare luxury', 'Widespread', 'Post-human baseline'] },
  ],
  'ash-remnants': [
    { label: 'Remnant power', options: ['None', 'Unstable fragments', 'Dangerous and active'] },
    { label: 'Mutated / non-human populations', options: ['None', 'Rare', 'Common'] },
    { label: 'What ended things', options: ['War', 'Plague', 'Environmental collapse', 'Unknown'] },
    { label: 'Time since collapse', options: ['Recent (years)', 'Generations ago', 'Ancient history'] },
  ],
  'dream-myth': [
    { label: 'Supernatural power', options: ["It's the fabric of reality", 'Earned or gifted', 'Dangerous and wild'] },
    { label: 'Non-human beings', options: ['Spirits and archetypes', 'Mythic races', 'Anything goes'] },
    { label: 'How broken is reality', options: ['Mostly stable with strange edges', 'Fluid and shifting', 'No rules at all'] },
    { label: 'Is there a "normal" world', options: ["Yes, and you've left it", "It's fading", 'There never was one'] },
  ],
  'custom': [
    { label: 'Magic / supernatural power', options: ['None', 'Rare', 'Common', 'Pervasive'] },
    { label: 'Non-human beings', options: ['Humans only', 'Rare / Hidden', 'Common'] },
    { label: 'Political structure', options: ['Tribal', 'Feudal', 'City-States', 'Empire', 'Other'] },
    { label: "Civilization's arc", options: ['Rising', 'Stable', 'Declining', 'Fallen'] },
  ],
};

const STEP_NAMES = ['Storyteller', 'Setting', 'Character', 'Attributes', 'Difficulty', 'Scenario'];

const SAMPLE_STATS = [
  { name: 'Strength', value: 6.5 },
  { name: 'Dexterity', value: 8.2 },
  { name: 'Constitution', value: 7.0 },
  { name: 'Intelligence', value: 11.3 },
  { name: 'Wisdom', value: 9.8 },
  { name: 'Charisma', value: 7.4 },
];

// --- SHARED COMPONENTS ---

function IconBox({ name, color = 'var(--accent-gold)' }) {
  return (
    <div style={{ color, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28 }}>
      {Icons[name] || null}
    </div>
  );
}

function SelectionCard({ item, selected, onSelect, children }) {
  const isSelected = selected === item.id || selected === item.key;
  return (
    <button
      onClick={() => onSelect(item.id || item.key)}
      className={isSelected ? styles.selectionCardSelected : styles.selectionCard}
    >
      {children}
    </button>
  );
}

function PhaseTitle({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{
        fontFamily: 'var(--font-cinzel)', fontSize: 26, fontWeight: 700, color: 'var(--text-heading)',
        marginBottom: 8,
      }}>{title}</h2>
      {subtitle && (
        <p style={{
          fontFamily: 'var(--font-alegreya)', fontSize: 17, fontStyle: 'italic', color: 'var(--text-muted)',
          margin: 0, lineHeight: 1.6,
        }}>{subtitle}</p>
      )}
    </div>
  );
}

function StepIndicator({ steps, current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 48 }}>
      {steps.map((step, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: 90 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontFamily: 'var(--font-cinzel)', fontWeight: 700,
              background: i < current ? 'linear-gradient(135deg, var(--accent-gold), var(--accent-bright))' : 'transparent',
              color: i < current ? 'var(--bg-main)' : i === current ? 'var(--accent-gold)' : 'var(--text-dim)',
              border: i === current ? '2px solid var(--accent-gold)' : i < current ? 'none' : '1px solid rgba(201,168,76,0.12)',
              transition: 'all 0.4s',
            }}>
              {i < current ? '\u2713' : i + 1}
            </div>
            <span style={{
              fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, fontWeight: 500,
              color: i <= current ? 'var(--text-muted)' : 'var(--text-dim)',
              letterSpacing: '0.04em', textAlign: 'center', whiteSpace: 'nowrap',
            }}>{step}</span>
          </div>
          {i < steps.length - 1 && (
            <div style={{
              width: 40, height: 1, marginTop: -20,
              background: i < current ? 'var(--accent-gold)' : 'rgba(201,168,76,0.1)',
              transition: 'background 0.4s',
            }} />
          )}
        </div>
      ))}
    </div>
  );
}

// --- PHASE SCREENS ---

function Phase1({ selected, onSelect }) {
  return (
    <div>
      <PhaseTitle title="Choose Your Storyteller" subtitle="The voice behind every word. Choose who tells your story." />
      <p style={{
        fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: 'var(--text-dim)',
        marginTop: -20, marginBottom: 24,
      }}>You can change your storyteller at any time during play.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {STORYTELLERS.map(s => (
          <SelectionCard key={s.id} item={s} selected={selected} onSelect={onSelect}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <IconBox name={s.icon} color={selected === s.id ? 'var(--accent-gold)' : 'var(--text-muted)'} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
                  <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 17, fontWeight: 700, color: 'var(--text-heading)' }}>{s.name}</span>
                  <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: 'var(--text-muted)', fontStyle: 'italic' }}>{s.tone}</span>
                </div>
                <p style={{ fontFamily: 'var(--font-alegreya)', fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>{s.desc}</p>
              </div>
            </div>
          </SelectionCard>
        ))}
      </div>
      {selected === 'custom' && (
        <div style={{ marginTop: 16 }}>
          <textarea placeholder="Describe your narrative voice..." className={styles.wizardInput} style={{
            width: '100%', minHeight: 90, background: 'rgba(10,14,26,0.5)', border: '1px solid rgba(201,168,76,0.08)',
            borderRadius: 8, padding: 16, fontFamily: 'var(--font-alegreya)', fontSize: 16,
            color: 'var(--text-primary)', outline: 'none', resize: 'vertical', boxSizing: 'border-box',
          }} />
        </div>
      )}
    </div>
  );
}

function SettingQuestions({ settingId, answers, setAnswers }) {
  const questions = SETTING_QUESTIONS[settingId];
  if (!questions) return null;

  const handleSelect = (label, value) => {
    setAnswers(prev => ({ ...prev, [label]: prev[label] === value ? null : value }));
  };

  return (
    <div style={{
      marginTop: 32, padding: '28px 28px 24px',
      background: 'rgba(201,168,76,0.02)',
      border: '1px solid rgba(201,168,76,0.08)',
      borderRadius: 10,
    }}>
      <div style={{ marginBottom: 24 }}>
        <h3 style={{
          fontFamily: 'var(--font-cinzel)', fontSize: 19, fontWeight: 700,
          color: 'var(--text-heading)', marginBottom: 6,
        }}>Shape Your World</h3>
        <p style={{
          fontFamily: 'var(--font-alegreya-sans)', fontSize: 15, color: 'var(--text-muted)',
          margin: 0, lineHeight: 1.5,
        }}>All optional. Pick what matters to you — the engine fills in the rest.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {questions.map(q => (
          <div key={q.label}>
            <label style={{
              fontFamily: 'var(--font-alegreya-sans)', fontSize: 15, fontWeight: 600,
              color: 'var(--text-secondary)', letterSpacing: '0.04em',
              display: 'block', marginBottom: 10,
            }}>{q.label}</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {q.options.map(opt => {
                const isActive = answers[q.label] === opt;
                return (
                  <button key={opt} onClick={() => handleSelect(q.label, opt)} className={styles.optionToggle} style={{
                    padding: '10px 18px',
                    fontFamily: 'var(--font-alegreya-sans)', fontSize: 15, fontWeight: isActive ? 500 : 400,
                    color: isActive ? 'var(--accent-gold)' : 'var(--text-secondary)',
                    background: isActive ? 'rgba(201,168,76,0.1)' : 'rgba(10,14,26,0.4)',
                    border: `1px solid ${isActive ? 'rgba(201,168,76,0.4)' : 'rgba(201,168,76,0.1)'}`,
                    borderRadius: 6,
                  }}>{opt}</button>
                );
              })}
            </div>
          </div>
        ))}

        <div>
          <label style={{
            fontFamily: 'var(--font-alegreya-sans)', fontSize: 15, fontWeight: 600,
            color: 'var(--text-secondary)', letterSpacing: '0.04em',
            display: 'block', marginBottom: 10,
          }}>Anything else?</label>
          <textarea placeholder="Add details, override the options above, or describe something they don't cover." className={styles.wizardInput} style={{
            width: '100%', minHeight: 80, background: 'rgba(10,14,26,0.4)', border: '1px solid rgba(201,168,76,0.1)',
            borderRadius: 8, padding: 16, fontFamily: 'var(--font-alegreya)', fontSize: 16,
            color: 'var(--text-primary)', outline: 'none', resize: 'vertical', boxSizing: 'border-box',
          }} />
        </div>
      </div>
    </div>
  );
}

function Phase2({ selected, onSelect, settingAnswers, setSettingAnswers }) {
  const mainSettings = SETTINGS.filter(s => s.id !== 'custom');
  const customSetting = SETTINGS.find(s => s.id === 'custom');

  return (
    <div>
      <PhaseTitle title="Choose Your Setting" subtitle="The world your story lives in. Pick one or build your own." />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {mainSettings.map(s => (
          <SelectionCard key={s.id} item={s} selected={selected} onSelect={onSelect}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
              <IconBox name={s.icon} color={selected === s.id ? 'var(--accent-gold)' : 'var(--text-muted)'} />
              <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 17, fontWeight: 700, color: 'var(--text-heading)' }}>{s.name}</span>
            </div>
            <p style={{ fontFamily: 'var(--font-alegreya)', fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
          </SelectionCard>
        ))}
      </div>

      <div style={{ marginTop: 12 }}>
        <SelectionCard item={customSetting} selected={selected} onSelect={onSelect}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <IconBox name={customSetting.icon} color={selected === 'custom' ? 'var(--accent-gold)' : 'var(--text-muted)'} />
            <div>
              <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 17, fontWeight: 700, color: 'var(--text-heading)' }}>{customSetting.name}</span>
              <span style={{ fontFamily: 'var(--font-alegreya)', fontSize: 15, color: 'var(--text-muted)', marginLeft: 14 }}>{customSetting.desc}</span>
            </div>
          </div>
        </SelectionCard>
      </div>

      {selected === 'custom' && (
        <div style={{ marginTop: 16 }}>
          <textarea placeholder="Describe your world..." className={styles.wizardInput} style={{
            width: '100%', minHeight: 110, background: 'rgba(10,14,26,0.5)', border: '1px solid rgba(201,168,76,0.08)',
            borderRadius: 8, padding: 16, fontFamily: 'var(--font-alegreya)', fontSize: 16,
            color: 'var(--text-primary)', outline: 'none', resize: 'vertical', boxSizing: 'border-box',
          }} />
        </div>
      )}

      {selected && (
        <SettingQuestions settingId={selected} answers={settingAnswers} setAnswers={setSettingAnswers} />
      )}
    </div>
  );
}

function Phase3({ character, onChange }) {
  const personalityTraits = ['Cautious', 'Bold', 'Calculating', 'Impulsive', 'Charming', 'Blunt', 'Curious', 'Stoic', 'Idealistic', 'Cynical'];
  const pronounOptions = ['He / Him', 'She / Her', 'They / Them', 'Custom'];

  const inputStyle = {
    width: '100%', background: 'rgba(10,14,26,0.5)', border: '1px solid rgba(201,168,76,0.08)',
    borderRadius: 6, padding: '13px 16px', fontFamily: 'var(--font-alegreya)',
    fontSize: 16, color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  };

  const labelStyle = {
    fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, fontWeight: 600,
    color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase',
    display: 'block', marginBottom: 8,
  };

  const optionalTag = (
    <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, fontWeight: 400, color: 'var(--text-dim)', textTransform: 'none', letterSpacing: 0, marginLeft: 8 }}>optional</span>
  );

  const selectedTraits = (character.personality || '').split(',').filter(Boolean);

  const toggleTrait = (trait) => {
    const current = selectedTraits.includes(trait)
      ? selectedTraits.filter(t => t !== trait)
      : [...selectedTraits, trait];
    onChange('personality', current.join(','));
  };

  return (
    <div>
      <PhaseTitle title="Create Your Character" subtitle="Write as much or as little as you want. The engine builds your stats, skills, and gear from what you give it." />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        <div>
          <label style={labelStyle}>Character Name</label>
          <input
            value={character.name || ''}
            onChange={e => onChange('name', e.target.value)}
            placeholder="What are you called?"
            className={styles.wizardInput}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Backstory {optionalTag}</label>
          <textarea
            value={character.backstory || ''}
            onChange={e => onChange('backstory', e.target.value)}
            placeholder="Who are you? Where do you come from? What have you done? A few sentences is enough — the engine builds from here."
            rows={4}
            className={styles.wizardInput}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
          />
        </div>

        <div>
          <label style={labelStyle}>Personality {optionalTag}</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {personalityTraits.map(trait => {
              const isActive = selectedTraits.includes(trait);
              return (
                <button key={trait} onClick={() => toggleTrait(trait)} className={styles.optionToggle} style={{
                  padding: '9px 16px',
                  fontFamily: 'var(--font-alegreya-sans)', fontSize: 15, fontWeight: 400,
                  color: isActive ? 'var(--accent-gold)' : 'var(--text-muted)',
                  background: isActive ? 'rgba(201,168,76,0.08)' : 'rgba(10,14,26,0.5)',
                  border: `1px solid ${isActive ? 'rgba(201,168,76,0.35)' : 'rgba(201,168,76,0.06)'}`,
                  borderRadius: 6,
                }}>{trait}</button>
              );
            })}
          </div>
          <textarea
            value={character.personalityCustom || ''}
            onChange={e => onChange('personalityCustom', e.target.value)}
            placeholder="Or describe it in your own words..."
            rows={2}
            className={styles.wizardInput}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
          />
        </div>

        <div>
          <label style={labelStyle}>Appearance {optionalTag}</label>
          <textarea
            value={character.appearance || ''}
            onChange={e => onChange('appearance', e.target.value)}
            placeholder="Build, age, and anything someone would notice first."
            rows={2}
            className={styles.wizardInput}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
          />
        </div>

        <div>
          <label style={labelStyle}>Pronouns {optionalTag}</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {pronounOptions.map(opt => {
              const isActive = character.pronouns === opt;
              return (
                <button key={opt} onClick={() => onChange('pronouns', isActive ? '' : opt)} className={styles.optionToggle} style={{
                  padding: '9px 16px',
                  fontFamily: 'var(--font-alegreya-sans)', fontSize: 15, fontWeight: 400,
                  color: isActive ? 'var(--accent-gold)' : 'var(--text-muted)',
                  background: isActive ? 'rgba(201,168,76,0.08)' : 'rgba(10,14,26,0.5)',
                  border: `1px solid ${isActive ? 'rgba(201,168,76,0.35)' : 'rgba(201,168,76,0.06)'}`,
                  borderRadius: 6,
                }}>{opt}</button>
              );
            })}
          </div>
          {character.pronouns === 'Custom' && (
            <input
              value={character.customPronouns || ''}
              onChange={e => onChange('customPronouns', e.target.value)}
              placeholder="Enter your pronouns"
              className={styles.wizardInput}
              style={{ ...inputStyle, marginTop: 10 }}
            />
          )}
        </div>

      </div>
    </div>
  );
}

function Phase4({ stats: initialStats }) {
  const [editing, setEditing] = useState(false);
  const [stats, setStats] = useState(initialStats);

  const hasDeviation = stats.some((s, i) => Math.abs(s.value - initialStats[i].value) > 2.0);

  const handleStatChange = (name, newVal) => {
    const parsed = parseFloat(newVal);
    if (isNaN(parsed)) return;
    const clamped = Math.min(20.0, Math.max(1.0, Math.round(parsed * 10) / 10));
    setStats(prev => prev.map(s => s.name === name ? { ...s, value: clamped } : s));
  };

  return (
    <div>
      <PhaseTitle title="Your Attributes" subtitle="Derived from your backstory. These are who you are." />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button onClick={() => setEditing(!editing)} className={styles.adjustBtn} style={{
          fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, fontWeight: 500,
          color: editing ? 'var(--accent-gold)' : 'var(--text-muted)',
          background: editing ? 'rgba(201,168,76,0.08)' : 'transparent',
          border: `1px solid ${editing ? 'rgba(201,168,76,0.35)' : 'rgba(201,168,76,0.12)'}`,
          borderRadius: 5, padding: '8px 20px',
        }}>{editing ? 'Lock' : 'Adjust'}</button>
      </div>

      <div style={{
        background: 'rgba(10,14,26,0.5)', border: '1px solid rgba(201,168,76,0.08)', borderRadius: 8, padding: 24, marginBottom: 20,
      }}>
        {stats.map(s => {
          const pct = (s.value / 20) * 100;
          return (
            <div key={s.name} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 16, fontWeight: 500, color: 'var(--text-secondary)' }}>
                  {s.name}
                </span>
                {editing ? (
                  <input
                    type="number"
                    value={s.value}
                    min="1.0"
                    max="20.0"
                    step="0.1"
                    onChange={e => handleStatChange(s.name, e.target.value)}
                    style={{
                      width: 64, textAlign: 'right',
                      fontFamily: 'var(--font-jetbrains)', fontSize: 16, fontWeight: 500,
                      color: 'var(--accent-gold)', background: 'rgba(201,168,76,0.06)',
                      border: '1px solid rgba(201,168,76,0.25)', borderRadius: 4,
                      padding: '4px 8px', outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                ) : (
                  <span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 16, fontWeight: 500, color: 'var(--text-heading)' }}>
                    {s.value.toFixed(1)}
                  </span>
                )}
              </div>
              <div style={{ height: 6, background: 'rgba(201,168,76,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${pct}%`, borderRadius: 3,
                  background: 'linear-gradient(90deg, #5a6a88, #c9a84c)',
                  transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                }} />
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={{
          background: 'rgba(10,14,26,0.5)', border: '1px solid rgba(201,168,76,0.08)', borderRadius: 6, padding: '10px 16px',
          fontFamily: 'var(--font-alegreya-sans)', fontSize: 15, color: 'var(--text-muted)',
        }}>
          <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Skills: </span>
          Streetwise 1.0, Lockpicking 1.0, Blade Work 1.0
        </div>
        <div style={{
          background: 'rgba(10,14,26,0.5)', border: '1px solid rgba(201,168,76,0.08)', borderRadius: 6, padding: '10px 16px',
          fontFamily: 'var(--font-alegreya-sans)', fontSize: 15, color: 'var(--text-muted)',
        }}>
          <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Inventory Slots: </span>
          {(stats.find(s => s.name === 'Strength')?.value || 6.5) + 5} (STR {stats.find(s => s.name === 'Strength')?.value.toFixed(1)} + 5)
        </div>
      </div>

      {editing && hasDeviation && (
        <div style={{
          marginTop: 16, padding: '14px 18px',
          background: 'rgba(232, 160, 74, 0.06)',
          border: '1px solid rgba(232, 160, 74, 0.2)',
          borderRadius: 8,
          fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#e8a04a',
          lineHeight: 1.6,
        }}>
          Some stats have changed significantly from what your backstory suggests. The engine may ask you to adjust your backstory to match, or it will adapt the stats to fit.
        </div>
      )}

      {editing && !hasDeviation && (
        <p style={{
          fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: 'var(--text-dim)',
          marginTop: 16, lineHeight: 1.6,
        }}>
          Stats must be between 1.0 and 20.0. Inventory slots update with Strength.
        </p>
      )}

      <div style={{
        marginTop: 28, padding: '24px 24px 20px',
        background: 'rgba(201,168,76,0.02)',
        border: '1px solid rgba(201,168,76,0.08)',
        borderRadius: 10,
      }}>
        <h3 style={{
          fontFamily: 'var(--font-cinzel)', fontSize: 19, fontWeight: 700,
          color: 'var(--text-heading)', marginBottom: 6,
        }}>Requests</h3>
        <p style={{
          fontFamily: 'var(--font-alegreya-sans)', fontSize: 15, color: 'var(--text-muted)',
          margin: '0 0 20px 0', lineHeight: 1.5,
        }}>Optional. Describe what you'd like — the engine will fit it to your backstory and setting.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={{
              fontFamily: 'var(--font-alegreya-sans)', fontSize: 15, fontWeight: 600,
              color: 'var(--text-secondary)', display: 'block', marginBottom: 8,
            }}>Skills</label>
            <textarea placeholder='Any skills you want to start with? e.g. "I want to be good with a bow" or "Some kind of healing ability"' rows={2} className={styles.wizardInput} style={{
              width: '100%', background: 'rgba(10,14,26,0.4)', border: '1px solid rgba(201,168,76,0.1)',
              borderRadius: 8, padding: 14, fontFamily: 'var(--font-alegreya)', fontSize: 16,
              color: 'var(--text-primary)', outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6,
            }} />
          </div>
          <div>
            <label style={{
              fontFamily: 'var(--font-alegreya-sans)', fontSize: 15, fontWeight: 600,
              color: 'var(--text-secondary)', display: 'block', marginBottom: 8,
            }}>Starting Gear</label>
            <textarea placeholder='Anything specific you want to carry? e.g. "An old family sword" or "A leather journal with strange symbols"' rows={2} className={styles.wizardInput} style={{
              width: '100%', background: 'rgba(10,14,26,0.4)', border: '1px solid rgba(201,168,76,0.1)',
              borderRadius: 8, padding: 14, fontFamily: 'var(--font-alegreya)', fontSize: 16,
              color: 'var(--text-primary)', outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6,
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Phase5({ selected, onSelect }) {
  return (
    <div>
      <PhaseTitle title="Select Difficulty" subtitle="How hard should the world push back?" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {DIFFICULTIES.map(d => (
          <SelectionCard key={d.id} item={d} selected={selected} onSelect={onSelect}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div style={{
                width: 12, height: 12, borderRadius: '50%', background: d.color,
                marginTop: 6, flexShrink: 0, boxShadow: `0 0 8px ${d.color}44`,
              }} />
              <div style={{ flex: 1 }}>
                <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 19, fontWeight: 700, color: 'var(--text-heading)', display: 'block', marginBottom: 4 }}>{d.name}</span>
                <p style={{ fontFamily: 'var(--font-alegreya)', fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>{d.desc}</p>
              </div>
            </div>
          </SelectionCard>
        ))}
      </div>
    </div>
  );
}

function Phase6({ intensity, setIntensity, scenario, setScenario }) {
  return (
    <div>
      <PhaseTitle title="Your Opening Scene" subtitle="How does your story begin?" />

      <div style={{ marginBottom: 32 }}>
        <label style={{
          fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, fontWeight: 600,
          color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase',
          display: 'block', marginBottom: 14,
        }}>Scenario Intensity</label>
        <div style={{ display: 'flex', gap: 10 }}>
          {INTENSITIES.map(int => (
            <button key={int.id} onClick={() => setIntensity(int.id)} className={styles.optionToggle} style={{
              flex: 1, padding: '16px 14px', textAlign: 'center',
              background: intensity === int.id ? 'rgba(201,168,76,0.05)' : 'rgba(10,14,26,0.5)',
              border: `1px solid ${intensity === int.id ? 'rgba(201,168,76,0.35)' : 'rgba(201,168,76,0.06)'}`,
              borderRadius: 8,
            }}>
              <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: 15, fontWeight: 700, color: intensity === int.id ? 'var(--accent-gold)' : 'var(--text-muted)' }}>{int.name}</div>
              <div style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5 }}>{int.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <label style={{
        fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, fontWeight: 600,
        color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase',
        display: 'block', marginBottom: 14,
      }}>Starting Scenario</label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {SCENARIOS.map(s => (
          <SelectionCard key={s.key} item={s} selected={scenario} onSelect={setScenario}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <IconBox name={s.icon} color={scenario === s.key ? 'var(--accent-gold)' : 'var(--text-muted)'} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
                  <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 15, fontWeight: 700, color: 'var(--accent-gold)' }}>Option {s.key}</span>
                  <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 17, fontWeight: 600, color: 'var(--text-heading)' }}>{s.name}</span>
                  <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>{s.type}</span>
                </div>
                <p style={{ fontFamily: 'var(--font-alegreya)', fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
              </div>
            </div>
          </SelectionCard>
        ))}
      </div>

      {scenario === 'D' && (
        <textarea placeholder="Describe how your story begins..." className={styles.wizardInput} style={{
          width: '100%', minHeight: 90, marginTop: 14, background: 'rgba(10,14,26,0.5)', border: '1px solid rgba(201,168,76,0.08)',
          borderRadius: 8, padding: 16, fontFamily: 'var(--font-alegreya)', fontSize: 16,
          color: 'var(--text-primary)', outline: 'none', resize: 'vertical', boxSizing: 'border-box',
        }} />
      )}
    </div>
  );
}

// --- MAIN ---

export default function InitWizard() {
  const router = useRouter();
  const [phase, setPhase] = useState(0);
  const [storyteller, setStoryteller] = useState(null);
  const [setting, setSetting] = useState(null);
  const [settingAnswers, setSettingAnswers] = useState({});
  const [character, setCharacter] = useState({ name: '', backstory: '', personality: '', personalityCustom: '', appearance: '', pronouns: '', customPronouns: '', genderIdentity: '' });
  const [difficulty, setDifficulty] = useState(null);
  const [intensity, setIntensity] = useState('standard');
  const [scenario, setScenario] = useState(null);

  const canAdvance = () => {
    switch (phase) {
      case 0: return !!storyteller;
      case 1: return !!setting;
      case 2: return character.name.trim().length > 0;
      case 3: return true;
      case 4: return !!difficulty;
      case 5: return !!scenario;
      default: return false;
    }
  };

  const handleNext = () => {
    if (!canAdvance()) return;
    if (phase === 5) {
      router.push('/loading');
    } else {
      setPhase(p => p + 1);
    }
  };

  const handleCharChange = (key, val) => setCharacter(prev => ({ ...prev, [key]: val }));

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-primary)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      {/* Header */}
      <div style={{
        width: '100%', padding: '18px 28px', display: 'flex', alignItems: 'baseline', gap: 8,
        borderBottom: '1px solid rgba(201,168,76,0.08)', boxSizing: 'border-box',
      }}>
        <Link href="/menu" style={{ textDecoration: 'none', display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 22, fontWeight: 900, color: 'var(--accent-gold)', letterSpacing: '0.06em' }}>
            CRUCIBLE
          </span>
          <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 12, fontWeight: 600, color: 'var(--gold-muted)', letterSpacing: '0.18em' }}>
            RPG
          </span>
        </Link>
      </div>

      {/* Content */}
      <div style={{
        width: '100%', maxWidth: 740, padding: '44px 28px 100px', flex: 1,
      }}>
        <StepIndicator steps={STEP_NAMES} current={phase} />

        {phase === 0 && <Phase1 selected={storyteller} onSelect={setStoryteller} />}
        {phase === 1 && <Phase2 selected={setting} onSelect={(id) => { if (id !== setting) { setSetting(id); setSettingAnswers({}); } }} settingAnswers={settingAnswers} setSettingAnswers={setSettingAnswers} />}
        {phase === 2 && <Phase3 character={character} onChange={handleCharChange} />}
        {phase === 3 && <Phase4 stats={SAMPLE_STATS} />}
        {phase === 4 && <Phase5 selected={difficulty} onSelect={setDifficulty} />}
        {phase === 5 && <Phase6 intensity={intensity} setIntensity={setIntensity} scenario={scenario} setScenario={setScenario} />}
      </div>

      {/* Bottom Nav */}
      <div style={{
        position: 'sticky', bottom: 0, width: '100%', padding: '18px 28px',
        background: 'rgba(10, 14, 26, 0.95)', backdropFilter: 'blur(8px)',
        borderTop: '1px solid rgba(201,168,76,0.08)', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', boxSizing: 'border-box',
      }}>
        <button
          onClick={() => setPhase(p => Math.max(0, p - 1))}
          disabled={phase === 0}
          className={styles.btnBack}
          style={{
            fontFamily: 'var(--font-cinzel)', fontSize: 14, fontWeight: 600,
            color: phase === 0 ? 'var(--text-dim)' : 'var(--text-secondary)',
            background: 'transparent',
            border: phase === 0 ? '1px solid rgba(201,168,76,0.08)' : '1px solid rgba(201,168,76,0.15)',
            borderRadius: 5, cursor: phase === 0 ? 'default' : 'pointer',
            padding: '10px 24px', letterSpacing: '0.06em',
          }}
        >&larr; BACK</button>

        <span style={{
          fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: 'var(--text-dim)',
        }}>Phase {phase + 1} of {STEP_NAMES.length}</span>

        <button
          onClick={handleNext}
          disabled={!canAdvance()}
          className={styles.btnPrimary}
          style={{
            fontFamily: 'var(--font-cinzel)', fontSize: 14, fontWeight: 700,
            color: canAdvance() ? 'var(--bg-main)' : 'var(--text-dim)',
            background: canAdvance() ? 'linear-gradient(135deg, var(--accent-gold), var(--accent-bright))' : 'rgba(201,168,76,0.06)',
            border: 'none', borderRadius: 5, padding: '12px 32px',
            cursor: canAdvance() ? 'pointer' : 'default',
            letterSpacing: '0.08em',
          }}
        >
          {phase === 5 ? 'BEGIN ADVENTURE' : 'CONTINUE'}
        </button>
      </div>
    </div>
  );
}
