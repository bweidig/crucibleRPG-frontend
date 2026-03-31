'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import ParticleField from '@/components/ParticleField';
import styles from './page.module.css';

// ─── FAQ DATA ───
const CATEGORIES = [
  { id: 'game', label: 'The Game' },
  { id: 'gameplay', label: 'Gameplay' },
  { id: 'world', label: 'World & Character' },
  { id: 'pricing', label: 'Pricing & Billing' },
  { id: 'trial', label: 'Free Trial' },
  { id: 'technical', label: 'Technical & Privacy' },
];

const FAQ_DATA = {
  game: [
    {
      q: 'What is CrucibleRPG?',
      a: 'A solo tabletop RPG powered by AI. You create a character, choose a world, and play through a story driven by your choices. A full game engine handles stats, dice rolls, inventory, and consequences on the server. An AI storyteller narrates everything that happens. No other players needed. No prep time. Just you and a world that reacts to everything you do.',
    },
    {
      q: 'Is this just a chatbot?',
      a: "No. There's a real game engine running server-side with six core attributes, skill progression, equipment with durability, NPC memory, and dice rolls resolved to tenth-decimal precision. The AI writes the story. The server runs the game. If you ask to punch a locked door open, the engine checks your Strength, rolls the dice, accounts for your injuries and gear, and determines whether the door gives or your shoulder does. The AI just tells you how it looked.",
    },
    {
      q: 'Do I need other players?',
      a: "No. CrucibleRPG is designed for solo play. It's you, your character, and a world that reacts to everything you do. No scheduling, no group coordination, no waiting for anyone else.",
    },
    {
      q: 'Do I need to know tabletop RPG rules?',
      a: "Not at all. The engine handles every rule automatically. You never see a formula or make a mechanical decision. You just describe what your character does, and the system handles the rest. The Rulebook is there if you want to understand what's happening under the hood, but you never need to open it.",
    },
    {
      q: 'What makes this different from other AI games?',
      a: "Most AI games are chatbots with a theme. CrucibleRPG runs a full mechanical engine on the server: real stats, real dice, real inventory tracking, real consequence chains. The AI never decides whether you succeed or fail. It never invents a stat or fudges a number. It narrates the results that the engine already determined. That separation is what makes outcomes feel earned rather than generated.",
    },
  ],
  gameplay: [
    {
      q: 'Can I really do anything?',
      a: "You can try anything. The engine will resolve it. The three suggested actions each turn are starting points, not limits. Type your own action and the system figures out which stats and skills apply, sets a difficulty, and rolls. If it's plausible, the dice decide. If it's impossible, the story tells you why.",
    },
    {
      q: 'Can my character die?',
      a: 'Yes. When your Constitution hits zero, you face a Fate Check. Depending on your difficulty settings, this can mean death, permanent injury, or a narrow escape. Permadeath is real on higher difficulty levels. On Forgiving difficulty, the game keeps you alive but the consequences still hurt.',
    },
    {
      q: 'What happens if I do something weird or unexpected?',
      a: "The game doesn't break when you go off-script because there is no script. The engine classifies your action, finds the relevant stats, and resolves it mechanically. The AI adapts the narrative. Try to seduce the dragon, cook a meal during a siege, or betray your only ally. The system will figure out what that looks like.",
    },
    {
      q: 'How does combat work?',
      a: "Combat uses the same turn structure as everything else. You describe what you do, the engine resolves it using your stats, skills, equipment, and a dice roll, and the AI narrates the result. There's no separate combat mode or grid. Positioning, tactics, and environmental factors are all handled through the narrative and the engine's resolution system.",
    },
    {
      q: 'Do my choices actually matter?',
      a: "Yes. The engine tracks NPC relationships, faction standings, inventory changes, conditions, and world state across every turn. An NPC you helped three sessions ago remembers. A faction you offended adjusts its behavior. Resources you spent are gone. The world doesn't reset between sessions.",
    },
    {
      q: 'How do skills work?',
      a: 'Skills represent specific training or experience. Your character starts with skills based on their backstory. During play, successfully using an unskilled ability under pressure can discover a new skill. Skills grow through use, not through menus or point allocation.',
    },
    {
      q: 'Is there magic?',
      a: "If your setting supports it and your character has the POT (Potency) stat, yes. Magic, psionics, divine gifts, advanced tech \u2014 the system handles supernatural abilities through the same mechanical framework as everything else. Spells cost resources, have real consequences, and can fail. Mundane characters don't have POT and no supernatural rules apply to them.",
    },
    {
      q: 'Can I save my game?',
      a: 'Everything saves automatically after every turn. You can also create manual checkpoints before risky decisions and restore them if things go badly. Up to three checkpoints at a time.',
    },
  ],
  world: [
    {
      q: 'What genres and settings are available?',
      a: 'Six built-in settings: classic fantasy, industrial revolution, modern/near-future, sci-fi, post-apocalyptic, and surreal/mythic. You can also build a completely custom world from scratch or blend elements from multiple genres. Every setting comes with guided questions to shape the details, or you can freeform the whole thing.',
    },
    {
      q: 'How does character creation work?',
      a: "You describe your character in your own words. Their backstory, personality, what they're good at, what they struggle with. The system proposes stats, skills, starting equipment, and faction relationships based on what you wrote. You review everything and adjust until the numbers match the character in your head. No class dropdowns. No race/stat tables. Your story drives your build.",
    },
    {
      q: 'What are storytellers?',
      a: 'Storytellers control the voice and tone of your narration. The Chronicler is grounded and observational. The Bard is epic and dramatic. The Trickster is playful and ironic. The Poet is tender and bittersweet. Whisper is warm and unsettling. Noir is world-weary and sharp. You can also define a custom voice, and switch storytellers at any time during play without penalty.',
    },
    {
      q: 'Can I change my world or difficulty mid-game?',
      a: 'Your world is locked once you start a campaign. Difficulty can be adjusted at any time through a set of independent dials: overall challenge, survival tracking, item durability, progression speed, encounter frequency, and more. Changes apply going forward. Nothing is recalculated retroactively.',
    },
    {
      q: 'Can I share my world with other people?',
      a: 'Yes. You can save a snapshot of your world and share it. Other players can start their own campaign in a world you built, with their own character and their own story.',
    },
    {
      q: 'Can I play non-human characters?',
      a: 'If your setting includes non-human species, yes. Species are generated as part of world creation, each with physical traits, cultural context, and potential mechanical advantages or drawbacks. Not all settings have non-human species.',
    },
  ],
  pricing: [
    {
      q: 'How much does it cost?',
      a: "One subscription plan at $X.XX/month. No tiers, no feature gates. Everyone gets the full game. There's also a free trial so you can try before you commit.",
    },
    {
      q: "What's a turn?",
      a: 'One turn is one action in the game. You describe what your character does, the engine resolves it, and the storyteller narrates what happens next. Combat, exploration, conversation \u2014 each one is a turn.',
    },
    {
      q: 'How many turns do I get?',
      a: 'Your subscription includes XXX turns per month. They reset on your billing date. If you need more, top-up packs are available.',
    },
    {
      q: 'Do unused turns roll over?',
      a: 'No. Your monthly allotment resets each billing cycle.',
    },
    {
      q: 'Can I cancel anytime?',
      a: 'Yes. No contracts, no cancellation fees. Cancel whenever you want and your subscription runs until the end of your current billing period.',
    },
    {
      q: 'Do I lose my saves if I cancel?',
      a: 'No. Your campaigns, characters, and worlds are kept. If you come back later, everything will be right where you left it.',
    },
  ],
  trial: [
    {
      q: 'What do I get with the free trial?',
      a: "XX turns and 1 world creation. Full game, no locked features. It's enough to create a character, build a world, and play through several scenes to see if this is your kind of game.",
    },
    {
      q: 'Do I need a credit card?',
      a: 'No. The free trial requires nothing but an account.',
    },
    {
      q: 'What happens when my free turns run out?',
      a: "Your campaign pauses. Nothing is deleted. Subscribe and you pick up exactly where you left off \u2014 same character, same world, same story.",
    },
  ],
  technical: [
    {
      q: 'What devices can I play on?',
      a: 'Anything with a modern web browser. Desktop, tablet, or phone. No app to install, no downloads.',
    },
    {
      q: 'Is my progress saved automatically?',
      a: 'Yes. Everything saves server-side after every turn. Close your browser mid-session and pick up right where you left off.',
    },
    {
      q: 'How many campaigns can I have?',
      a: 'Unlimited. Each campaign is its own self-contained world with its own character and story.',
    },
    {
      q: 'Can I play offline?',
      a: 'No. CrucibleRPG requires an internet connection. The game engine and AI storyteller both run on the server.',
    },
    {
      q: 'Is my data safe?',
      a: null, // special render
    },
    {
      q: 'Are my game conversations used to train AI?',
      a: null, // special render
    },
  ],
};

// ─── CHEVRON ───
function Chevron({ open }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="#7082a4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={styles.chevron}
      style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)' }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// ─── FAQ ITEM ───
function FAQItem({ question, answer, open, onToggle }) {
  return (
    <div style={{ borderBottom: '1px solid #1e2540' }}>
      <button
        className={styles.faqQuestion}
        onClick={onToggle}
        aria-expanded={open}
      >
        <span style={{
          fontFamily: 'var(--font-cinzel)', fontSize: 15, fontWeight: 700,
          color: open ? '#c9a84c' : '#d0c098',
          transition: 'color 0.2s',
          textAlign: 'left',
        }}>{question}</span>
        <Chevron open={open} />
      </button>
      <div
        className={styles.faqAnswer}
        style={{
          maxHeight: open ? 600 : 0,
          opacity: open ? 1 : 0,
          padding: open ? '0 0 20px 0' : '0',
        }}
      >
        <div style={{
          fontFamily: 'var(--font-alegreya-sans)',
          fontSize: 15, fontWeight: 300,
          color: '#8a94a8', lineHeight: 1.75,
        }}>
          {answer}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ───
export default function FAQPage() {
  const [loaded, setLoaded] = useState(false);
  const [activeCategory, setActiveCategory] = useState('game');
  const [openItems, setOpenItems] = useState({});

  useEffect(() => { setLoaded(true); }, []);

  function handleCategoryChange(catId) {
    setActiveCategory(catId);
    setOpenItems({});
  }

  function toggleItem(index) {
    setOpenItems(prev => ({ ...prev, [index]: !prev[index] }));
  }

  const items = FAQ_DATA[activeCategory] || [];

  // Special render for the two "technical" items with links
  function renderAnswer(item) {
    if (item.q === 'Is my data safe?') {
      return (
        <>Your game data is stored securely on our servers. We don&rsquo;t sell your information to third parties. Your conversations and game content are yours. For the full details, see our <Link href="/privacy" className={styles.faqLink}>Privacy Policy</Link>.</>
      );
    }
    if (item.q === 'Are my game conversations used to train AI?') {
      return (
        <>No. Your game sessions are not used to train AI models. See our <Link href="/privacy" className={styles.faqLink}>Privacy Policy</Link> for specifics on how your data is handled.</>
      );
    }
    return item.a;
  }

  return (
    <div className={styles.pageContainer} style={{
      minHeight: '100vh',
      background: 'var(--bg-main)',
      color: 'var(--text-primary)',
      position: 'relative',
    }}>
      <ParticleField />
      <NavBar currentPage="faq" />

      {/* Header */}
      <div style={{
        textAlign: 'center',
        padding: '48px 24px 12px',
        position: 'relative', zIndex: 1,
        opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(12px)',
        transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1) 0.15s',
      }}>
        <div style={{
          fontFamily: 'var(--font-cinzel)',
          fontSize: 14, fontWeight: 600,
          color: '#c9a84c',
          letterSpacing: '0.25em',
          marginBottom: 16,
        }}>FAQ</div>
        <h1 style={{
          fontFamily: 'var(--font-alegreya)',
          fontSize: 'clamp(22px, 3vw, 28px)',
          fontWeight: 500,
          fontStyle: 'italic',
          color: '#d0c098',
          letterSpacing: '0.02em',
          marginBottom: 12,
          marginTop: 0,
        }}>Questions adventurers ask before the journey begins.</h1>
        <p style={{
          fontFamily: 'var(--font-alegreya-sans)',
          fontSize: 15, fontWeight: 400,
          color: '#8a94a8',
          maxWidth: 460, margin: '0 auto',
        }}>Everything you need to know about the game, your characters, and how it all works.</p>
      </div>

      {/* Category Tabs */}
      <div style={{
        display: 'flex', justifyContent: 'center', flexWrap: 'wrap',
        gap: 8, padding: '32px 24px 40px',
        position: 'relative', zIndex: 1,
        opacity: loaded ? 1 : 0,
        transition: 'opacity 0.8s ease 0.25s',
      }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className={activeCategory === cat.id ? styles.tabActive : styles.tab}
            onClick={() => handleCategoryChange(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* FAQ Items */}
      <div style={{
        maxWidth: 620, margin: '0 auto',
        padding: '0 clamp(24px, 5vw, 48px) 64px',
        position: 'relative', zIndex: 1,
        opacity: loaded ? 1 : 0,
        transition: 'opacity 0.8s ease 0.35s',
      }}>
        {items.map((item, i) => (
          <FAQItem
            key={`${activeCategory}-${i}`}
            question={item.q}
            answer={renderAnswer(item)}
            open={!!openItems[i]}
            onToggle={() => toggleItem(i)}
          />
        ))}
      </div>

      {/* Bottom CTA */}
      <div style={{
        textAlign: 'center',
        padding: '60px 24px 80px',
        position: 'relative', zIndex: 1,
      }}>
        <h2 style={{
          fontFamily: 'var(--font-cinzel)',
          fontSize: 'clamp(22px, 3vw, 28px)',
          fontWeight: 700,
          color: '#d0c098',
          letterSpacing: '0.04em',
          marginBottom: 16,
          marginTop: 0,
        }}>Ready to begin?</h2>
        <p style={{
          fontFamily: 'var(--font-alegreya)',
          fontSize: 'clamp(16px, 2vw, 18px)',
          fontStyle: 'italic', fontWeight: 500,
          color: '#8a94a8',
          maxWidth: 400, margin: '0 auto 36px', lineHeight: 1.6,
        }}>No group required. No prep time. Just you and a world waiting to see what you will do.</p>
        <Link href="/auth">
          <button
            className={styles.btnPrimary}
            style={{
              fontFamily: 'var(--font-cinzel)', fontSize: 15, fontWeight: 700,
              color: 'var(--bg-main)', letterSpacing: '0.1em',
              background: 'linear-gradient(135deg, #c9a84c, #ddb84e)',
              border: 'none', borderRadius: 6, padding: '16px 44px',
              cursor: 'pointer',
            }}
          >START YOUR ADVENTURE</button>
        </Link>
      </div>

      <Footer />
    </div>
  );
}
