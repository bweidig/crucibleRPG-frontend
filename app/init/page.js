'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import * as api from '@/lib/api';
import NavBar from '@/components/NavBar';
import ParticleField from '@/components/ParticleField';
import styles from './page.module.css';

// --- DISPLAY SETTINGS (Lexie Readable support) ---
const DISPLAY_SETTINGS_KEY = 'crucible_display_settings';

function loadDisplayFont() {
  if (typeof window === 'undefined') return 'alegreya';
  try {
    const raw = localStorage.getItem(DISPLAY_SETTINGS_KEY);
    if (raw) return JSON.parse(raw).font || 'alegreya';
  } catch {}
  return 'alegreya';
}

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
  your_worlds: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  ),
};

// --- DATA ---

const STORYTELLERS = [
  { id: 'chronicler', name: 'Chronicler', icon: 'chronicler', tone: 'Grounded and observational', desc: 'The world as it is.', preview: 'You step into a room filled with voices and the smell of cooked meat and bread. A woman with one arm stands behind the counter and fills cups from a brown jug. Four people sit in a corner booth and speak over one another. A man sits alone by the door with a bowl and a spoon. No one greets you.' },
  { id: 'bard', name: 'Bard', icon: 'bard', tone: 'Epic and dramatic', desc: 'You are the hero of this story.', preview: 'You step into heat, noise, and the smell of food that\'s been cooking all day. A one-armed woman works the counter with steady efficiency, sliding cups across the wood while a group in the corner booth argue like a storm that hasn\'t decided whether to break. Someone sits alone near the door, eating in the calm eye of it all. You stand there a moment, the newest piece on a crowded board. Every story begins somewhere.' },
  { id: 'trickster', name: 'Trickster', icon: 'trickster', tone: 'Playful and ironic', desc: 'The world has a sense of humor.', preview: 'You step into a loud, warm room thick with the smell of cooking food and the scrape of chairs on the floorboards. A one-armed woman runs the counter with practiced efficiency, which means she\'s doing more work than several two-armed people currently arguing in the corner booth. By the door, someone eats alone with determined focus, as though the meal might escape if left unwatched. No one pays you much attention, which is often the safest way to enter a place like this.' },
  { id: 'poet', name: 'Poet', icon: 'poet', tone: 'Tender and bittersweet', desc: 'Every victory has a cost.', preview: 'You step into warmth and the heavy scent of food that has been cooking for hours. At the counter, a woman with one arm moves through her work with practiced motions, the empty sleeve at her shoulder shifting when she turns. Voices collide in a corner booth where people lean over a table crowded with cups. By the door, someone eats alone while cold air slips in each time it opens. The room is full, but space gathers quietly around the places where something is missing.' },
  { id: 'whisper', name: 'Whisper', icon: 'whisper', tone: 'Warm and unsettling', desc: 'Everything is fine. Almost.', preview: 'You step into a warm, lively room where the air smells of fresh bread, roasted meat, and spices drifting from the kitchen. A one-armed woman smiles as she tends the counter, moving cups and plates along with easy familiarity while conversation rolls comfortably through the space. A group debates something spiritedly in a corner booth, and near the door someone sits alone enjoying a quiet meal. From time to time the woman pauses to wipe the counter clean, brushing away the thin dusting of gray ash that settles there every few minutes.' },
  { id: 'noir', name: 'Noir', icon: 'noir', tone: 'World-weary and sharp', desc: 'Nobody is clean.', preview: 'You step into heat, noise, and the smell of food that sticks to your coat. The one-armed woman behind the counter moves like someone who learned a long time ago that work doesn\'t wait for sympathy. A group in the corner booth argue over something that matters to them and no one else. By the door, a man eats alone with his back to the wall and his eyes on the room; two habits like that usually mean he expects trouble. Smart man.' },
  { id: 'custom', name: 'Custom', icon: 'custom_story', tone: 'Your narrative voice', desc: 'Define your own voice.', preview: null },
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

const PRESET_DIALS = {
  forgiving: { dcOffset: -2, fateDc: 8, survivalEnabled: false, durabilityEnabled: false, progressionSpeed: 1, encounterPressure: 'low', fortunesBalanceEnabled: true, simplifiedOutcomes: false },
  standard: { dcOffset: 0, fateDc: 12, survivalEnabled: true, durabilityEnabled: true, progressionSpeed: 1, encounterPressure: 'standard', fortunesBalanceEnabled: true, simplifiedOutcomes: false },
  harsh: { dcOffset: 2, fateDc: 16, survivalEnabled: true, durabilityEnabled: true, progressionSpeed: 1, encounterPressure: 'high', fortunesBalanceEnabled: true, simplifiedOutcomes: false },
  brutal: { dcOffset: 4, fateDc: 18, survivalEnabled: true, durabilityEnabled: true, progressionSpeed: 1, encounterPressure: 'high', fortunesBalanceEnabled: true, simplifiedOutcomes: false },
};

const SCENARIOS = [
  { key: 'A', name: 'Slow Burn', icon: 'long_road', desc: 'You arrive somewhere. Nothing is trying to kill you yet. There\'s a place to explore, people to talk to, and a thread to find when you\'re ready.' },
  { key: 'B', name: 'Turning Point', icon: 'subtle_hook', desc: 'Something is already in motion. A deal gone wrong, a stranger with a warning, a door that shouldn\'t be open. You\'re not in danger yet, but the window is closing.' },
  { key: 'C', name: 'Into the Fire', icon: 'flashpoint', desc: 'You\'re already in it. A fight, a chase, a collapsing building, a ticking clock. The world isn\'t waiting for you to get comfortable.' },
  { key: 'D', name: 'Custom Start', icon: 'custom_start', desc: 'Describe how your story begins. You set the direction, the engine sets the stage.' },
];

const PACING_MAP = { A: 'slow_burn', B: 'turning_point', C: 'into_the_fire', D: 'custom' };

// --- PHASE TRANSITION MESSAGES ---
const PHASE_TRANSITION_MESSAGES = {
  0: { primary: "Your narrator takes the stage...", secondary: "Locking in narrative voice" },
  3: { primary: "Your path is set...", secondary: "Locking in your attributes" },
  4: { primary: "The world sharpens its edges...", secondary: "Tuning encounter pressure and consequence severity" },
  5: { primary: "The crucible awaits...", secondary: "Preparing your first scene" },
};

const OVERLAY_LABELS = {
  0: 'SETTING THE VOICE',
  3: 'SETTING THE STAKES',
  4: 'PREPARING THE CRUCIBLE',
  5: 'INTO THE CRUCIBLE',
};

const WORLD_GEN_MESSAGES = [
  { phase: 'generating_factions', text: 'Forging alliances and rivalries...' },
  { phase: 'generating_locations', text: 'Carving the landscape...' },
  { phase: 'generating_npcs', text: 'Breathing life into the world...' },
  { phase: 'generating_anchors', text: 'Seeding conflict and opportunity...' },
];

const PROPOSAL_OVERLAY_MESSAGES = [
  'The engine reads your story...',
  'Deriving stats from your backstory...',
  'Assembling your skills and gear...',
  'Calibrating your starting position...',
];

const FIREFLY_EMBERS = [
  { x: 60, y: 40, size: 4, anim: 'ember0', dur: 17, delay: 0, color: '#c9a84c', glow: 11 },
  { x: 100, y: 70, size: 3, anim: 'ember1', dur: 19, delay: 0.3, color: '#ddb84e', glow: 9 },
  { x: 40, y: 90, size: 5, anim: 'ember2', dur: 15, delay: 0.6, color: '#c9a84c', glow: 14 },
  { x: 110, y: 110, size: 3, anim: 'ember3', dur: 21, delay: 0.2, color: '#ddb84e', glow: 10 },
  { x: 70, y: 120, size: 4, anim: 'ember4', dur: 16, delay: 0.8, color: '#c9a84c', glow: 12 },
  { x: 30, y: 50, size: 5, anim: 'ember5', dur: 18, delay: 1.0, color: '#ddb84e', glow: 13 },
  { x: 120, y: 30, size: 3, anim: 'ember6', dur: 20, delay: 0.5, color: '#c9a84c', glow: 9 },
  { x: 80, y: 80, size: 4, anim: 'ember7', dur: 14, delay: 1.2, color: '#ddb84e', glow: 11 },
];

const EMBER_KEYFRAMES = `
  @keyframes ember0 { 0%{transform:translate(0,0)}12%{transform:translate(18px,-14px)}25%{transform:translate(30px,8px)}37%{transform:translate(14px,28px)}50%{transform:translate(-12px,20px)}62%{transform:translate(-28px,4px)}75%{transform:translate(-16px,-22px)}87%{transform:translate(6px,-30px)}100%{transform:translate(0,0)} }
  @keyframes ember1 { 0%{transform:translate(0,0)}14%{transform:translate(-22px,16px)}28%{transform:translate(-8px,34px)}42%{transform:translate(20px,24px)}57%{transform:translate(32px,-4px)}71%{transform:translate(12px,-26px)}85%{transform:translate(-14px,-18px)}100%{transform:translate(0,0)} }
  @keyframes ember2 { 0%{transform:translate(0,0)}11%{transform:translate(26px,12px)}22%{transform:translate(18px,-20px)}33%{transform:translate(-8px,-32px)}44%{transform:translate(-30px,-10px)}55%{transform:translate(-22px,18px)}66%{transform:translate(-4px,30px)}77%{transform:translate(20px,16px)}88%{transform:translate(28px,-6px)}100%{transform:translate(0,0)} }
  @keyframes ember3 { 0%{transform:translate(0,0)}13%{transform:translate(-16px,-24px)}26%{transform:translate(10px,-30px)}39%{transform:translate(28px,-8px)}52%{transform:translate(22px,20px)}65%{transform:translate(-6px,28px)}78%{transform:translate(-26px,10px)}91%{transform:translate(-20px,-12px)}100%{transform:translate(0,0)} }
  @keyframes ember4 { 0%{transform:translate(0,0)}10%{transform:translate(14px,22px)}20%{transform:translate(32px,8px)}30%{transform:translate(24px,-18px)}40%{transform:translate(4px,-28px)}50%{transform:translate(-20px,-22px)}60%{transform:translate(-30px,2px)}70%{transform:translate(-18px,24px)}80%{transform:translate(6px,30px)}90%{transform:translate(22px,14px)}100%{transform:translate(0,0)} }
  @keyframes ember5 { 0%{transform:translate(0,0)}12%{transform:translate(-24px,8px)}25%{transform:translate(-14px,28px)}37%{transform:translate(12px,22px)}50%{transform:translate(26px,0px)}62%{transform:translate(16px,-24px)}75%{transform:translate(-10px,-28px)}87%{transform:translate(-28px,-6px)}100%{transform:translate(0,0)} }
  @keyframes ember6 { 0%{transform:translate(0,0)}14%{transform:translate(20px,-16px)}28%{transform:translate(8px,-34px)}42%{transform:translate(-18px,-20px)}57%{transform:translate(-28px,8px)}71%{transform:translate(-10px,26px)}85%{transform:translate(16px,18px)}100%{transform:translate(0,0)} }
  @keyframes ember7 { 0%{transform:translate(0,0)}11%{transform:translate(-12px,20px)}22%{transform:translate(8px,32px)}33%{transform:translate(26px,14px)}44%{transform:translate(30px,-10px)}55%{transform:translate(14px,-26px)}66%{transform:translate(-12px,-22px)}77%{transform:translate(-28px,-4px)}88%{transform:translate(-20px,16px)}100%{transform:translate(0,0)} }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

const SETTING_QUESTIONS = {
  'sword-soil': [
    { label: 'Magic', options: ['None', 'Rare', 'Common', 'Pervasive'] },
    { label: 'Non-human races', options: ['Humans only', 'Rare / Hidden', 'Common'] },
    { label: 'Political structure', options: ['Tribal', 'Feudal', 'City-States', 'Empire'] },
    { label: "Civilization's arc", options: ['Rising', 'Stable', 'Declining', 'Fallen'] },
  ],
  'smoke-steel': [
    { label: 'Old magic', options: ['None', 'Dying echoes', 'Coexists with industry'] },
    { label: 'Non-human beings', options: ['Humans only', 'Rare / Hidden', 'Common'] },
    { label: 'Technology aesthetic', options: ['Grounded industrial', 'Steampunk / fantastical'] },
    { label: 'Industrialization', options: ['Early steam', 'Full mechanization', 'Electrification'] },
    { label: 'Political tension', options: ['Stable empire', 'Revolution brewing', 'Open conflict'] },
  ],
  'concrete-code': [
    { label: 'Supernatural elements', options: ['None', 'Urban legends with teeth', 'Hidden world'] },
    { label: 'Era', options: ['Mid-20th century', 'Modern day', 'Near-future'] },
    { label: 'Power structure', options: ['Democratic', 'Authoritarian', 'Corporate-controlled'] },
    { label: 'How much does society work?', options: ['Functioning but strained', 'Cracking at the seams', 'Barely holding together'] },
  ],
  'stars-circuits': [
    { label: 'Supernatural / psionic power', options: ['None', 'Rare', 'Common'] },
    { label: 'Alien life', options: ['Humans only', 'Exists but rare', 'Everywhere'] },
    { label: 'Space travel', options: ['Subluminal (slow, isolated)', 'FTL (connected galaxy)'] },
    { label: 'Cybernetics / augmentation', options: ['Rare luxury', 'Widespread', 'Post-human baseline'] },
  ],
  'ash-remnants': [
    { label: 'Lingering power', options: ['None', 'Unstable fragments', 'Dangerous and active'] },
    { label: 'Mutated populations', options: ['None', 'Rare', 'Common'] },
    { label: 'What ended things', options: ['War', 'Plague', 'Environmental collapse', 'Unknown'] },
    { label: 'Time since collapse', options: ['Recent (years)', 'Generations ago', 'Ancient history'] },
  ],
  'dream-myth': [
    { label: 'Supernatural power', options: ["It's the fabric of reality", 'Earned or gifted', 'Dangerous and wild'] },
    { label: 'Non-human beings', options: ['Spirits and archetypes', 'Mythic races', 'Anything goes'] },
    { label: 'How broken is reality', options: ['Mostly stable with strange edges', 'Fluid and shifting', 'No rules at all'] },
    { label: 'Is there a "normal" world', options: ["Yes, and you've left it", "It's fading", 'There never was one'] },
  ],
  'custom': [],
};

const PREBUILT_WORLDS = [
  // --- Sword & Soil ---
  {
    id: 'fraying-throne',
    era: 'sword-soil',
    name: 'The Fraying Throne',
    pitch: 'A feudal kingdom crumbling under its own weight. Magic is a rumor. The crown is weak and every lord smells blood.',
    expandedFlavor: "The king is old and his heirs are circling. Every noble house has a claim, a grievance, and a private army. Out in the provinces, bandit lords carve territory while the crown pretends everything is fine. Magic? Maybe it existed once. Nobody alive has seen proof. What matters now is steel, leverage, and who blinks first. This is a world where loyalty is currency and betrayal is just good strategy.",
    subTags: [
      { label: 'Magic', value: 'Rare' },
      { label: 'Non-human races', value: 'Humans only' },
      { label: 'Political structure', value: 'Feudal' },
      { label: "Civilization's arc", value: 'Declining' },
    ],
    hiddenPrompt: "This is a low-magic feudal setting in terminal decline. The kingdom's central authority is weak and failing. Noble houses are positioning for succession or outright secession. Local lords, bandit chiefs, and opportunists are carving out their own power bases while the crown loses control of the provinces.\n\nPlay this world as political and grounded. Power comes from alliances, leverage, military strength, and information. Magic should be absent or so rare that most people don't believe in it. If it appears at all, treat it as unsettling and unexplained, not systematic. NPCs should be driven by self-interest, survival, and loyalty to their own factions first. Trust is earned slowly and broken easily.\n\nThe tone is low fantasy realism. Violence has consequences. Decisions have political ripple effects. Avoid clean moral choices. Frame conflicts as competing interests where every side has a reason and nobody is purely good or evil.",
  },
  {
    id: 'green-tribunal',
    era: 'sword-soil',
    name: 'The Green Tribunal',
    pitch: 'Ancient forest tribes govern through council and ritual. The land is alive with old power, and the non-human peoples were here first.',
    expandedFlavor: "The forest has a memory longer than any human dynasty. Elves, beastfolk, and stranger things have governed these lands through council fires and seasonal rites since before the first stone wall went up. The magic here isn't flashy. It grows in roots and rivers and the spaces between old trees. Newcomers are welcome, but the land has rules, and the land enforces them. You don't conquer a place like this. You learn to belong, or you don't last.",
    subTags: [
      { label: 'Magic', value: 'Common' },
      { label: 'Non-human races', value: 'Common' },
      { label: 'Political structure', value: 'Tribal' },
      { label: "Civilization's arc", value: 'Stable' },
    ],
    hiddenPrompt: "This is a high-magic, nature-rooted setting where non-human peoples are the dominant civilizations. The land itself carries power. Magic flows through forests, rivers, and seasonal cycles. Governance is communal, based on council and ritual rather than monarchy or conquest.\n\nPlay this world as ancient and layered. The non-human peoples have deep histories, old rivalries, and complex traditions. Humans exist but are relative newcomers. Magic is common but tied to the natural world. It's not academic or flashy. It grows, it cycles, it responds to intention and respect. NPCs should reflect a culture that thinks in generations, not years. Urgency looks different here.\n\nThe tone is mythic and textured. The world should feel alive, watchful, and interconnected. Nature is not a backdrop. It's a participant. Frame conflicts around disruption of balance, cultural tension between old ways and new pressures, and the cost of power taken without permission.",
  },
  {
    id: 'worn-cobble',
    era: 'sword-soil',
    name: 'The Worn Cobble',
    pitch: 'A sprawling old city where noble courts and criminal syndicates share the same streets. Cobblestone above, mud below, and schemes at every level.',
    expandedFlavor: "The city has been important for a long time and it knows it. Noble houses hold court in stone manors while syndicate bosses run their operations from backroom offices three districts away. The streets shift from cobblestone to packed dirt depending on who maintains them, and who maintains them tells you everything about the neighborhood. There are pleasant spots \u2014 a riverside market, a quiet temple garden, a well-kept square where the food stalls are worth the walk. And there are places the watch doesn\u2019t go after dark, or where the watch is the problem. Magic isn\u2019t rare enough to be a spectacle, but it isn\u2019t common enough to be casual. You can buy a warming stone if you have the coin, but a mage throwing real power around on the street draws attention the way a drawn sword does. The city is layered, loud, and full of people who have opinions about everything. It\u2019s the kind of place that\u2019s easy to hate and impossible to leave.",
    subTags: [
      { label: 'Magic', value: 'Common' },
      { label: 'Non-human races', value: 'Rare / Hidden' },
      { label: 'Political structure', value: 'Feudal' },
      { label: "Civilization's arc", value: 'Stable' },
    ],
    hiddenPrompt: "The starting city is a large, old, lived-in city that feels full of life and history. It should have some nice spots. Some not so nice spots. Cobblestone in some areas, dirt in others. The city has both syndicates of varying degrees of competence and organization. Some lean more towards the street gang side of things, some more similar to a mafia.\n\nMagic is not something everyone has access to, but it is not so uncommon that mages are a spectacle. Typically powerful magic is not just used on the street. The player character does not live somewhere that spellcasters are strictly regulated, but the ruling caste try to be aware of who is able to use magic.\n\nTechnology level is medieval. There are some mages who supplement technology with their magic, but it is not common for people to have access to magically enhanced technology. Lesser items such as portable lights or heat sources may be available for a price, but more advanced magically enhanced technology like self-powered carts is very rare. Weapons and armor and other items may be imbued with magic, but again it comes with a cost and is not something everyone has access to.\n\nThe city is run by a noble hierarchy with lords and ladies and the whole nine yards. There is a merchant class and working class as well.\n\nFaction generation guidance: At least one faction must be criminal in domain. If more than one criminal faction is generated, they should vary in sophistication \u2014 some street-level gangs, some organized syndicates with legitimate fronts and political connections. Remaining factions should reflect the city\u2019s layered power structure: political, economic, and at least one more from religious, military, academic, or artisan.\n\nNPC generation guidance: NPCs should reflect the full social range of the city. At least one should have connections to the criminal underworld. At least one should be connected to the ruling class. The city is full of life \u2014 people have opinions, grudges, ambitions, and routines that exist independent of the player.\n\nThe tone should be alive and complicated, not grim for grimness\u2019 sake. There is humor in the absurdity of the place. There is genuine warmth in some corners and genuine menace in others.",
  },

  // --- Smoke & Steel ---
  {
    id: 'brass-meridian',
    era: 'smoke-steel',
    name: 'The Brass Meridian',
    pitch: 'Steampunk city-state where inventors are celebrities and factory smoke is the smell of progress. Clockwork automata walk the streets. The question is who owns the future.',
    expandedFlavor: "The city breathes steam. Brass-plated rail lines crisscross the skyline, pneumatic tubes carry messages between towers, and clockwork automata walk the streets alongside the people who built them. Inventors are celebrities. Their workshops spill over with things that shouldn't work yet: mechanical wings, bottled lightning, engines that run on principles the universities haven't named. Everyone here believes the next great invention is right around the corner. They're probably right. The question isn't whether the future is coming. It's who gets to own it, and what happens to everyone who doesn't.",
    subTags: [
      { label: 'Old magic', value: 'None' },
      { label: 'Non-human beings', value: 'Humans only' },
      { label: 'Tech aesthetic', value: 'Steampunk / fantastical' },
      { label: 'Industrialization', value: 'Full mechanization' },
      { label: 'Political tension', value: 'Revolution brewing' },
    ],
    hiddenPrompt: "This is a steampunk city-state at the peak of mechanical innovation. The aesthetic is brass, steam, gears, and pneumatics. Clockwork automata are common. Inventors are public figures. The technology is fantastical and ambitious, pushing past what the underlying science should allow.\n\nPlay this world as vibrant, fast-moving, and stratified. The upper class funds invention and reaps the profits. The working class builds everything and owns nothing. The automata occupy an uncomfortable middle space that nobody wants to examine too closely. Progress is the dominant ideology, and anyone who questions it is dismissed as a romantic or a saboteur.\n\nThe tone is industrial fantasy with revolutionary undercurrent. The city should feel alive, loud, and dazzling on the surface, with serious fractures underneath. Frame conflicts around ownership, class, the cost of progress, and who gets left behind when the future arrives.",
  },
  {
    id: 'shattered-main',
    era: 'smoke-steel',
    name: 'The Shattered Main',
    pitch: "Pirate republics and trade empires fighting over a sea full of islands, plunder, and secrets. Cannons, cutlasses, and a dying breed of sea-witches who remember when the water listened.",
    expandedFlavor: "A hundred islands, a dozen would-be empires, and no law past the harbor chains. Pirate republics rise and fall with the seasons. Trade companies wage private wars over shipping lanes. And somewhere out on the far edges of the charts, there are still sea-witches who remember when the ocean obeyed. The age of sail is giving way to the age of steam, but the sea doesn't care about progress. It was here first, and it has teeth.",
    subTags: [
      { label: 'Old magic', value: 'Dying echoes' },
      { label: 'Non-human beings', value: 'Rare / Hidden' },
      { label: 'Tech aesthetic', value: 'Grounded industrial' },
      { label: 'Industrialization', value: 'Early steam' },
      { label: 'Political tension', value: 'Open conflict' },
    ],
    hiddenPrompt: "This is a naval-era setting built around contested waters, pirate republics, and dying trade empires. Technology is early industrial, with steam power arriving unevenly. The sea is the center of everything. Old magic exists but it's fading, carried by the last generation of sea-witches who remember when the ocean responded to ritual.\n\nPlay this world as lawless, sprawling, and contested. There is no central authority. Power belongs to whoever can hold a port, a fleet, or a trade route. Pirate republics have their own codes and politics. Trade companies wage private wars. The sea-witches are rare, respected, and running out of time.\n\nThe tone is maritime adventure with a melancholy edge. The golden age of sail is ending. Steam is replacing wind. The old magic is almost gone. Frame conflicts around freedom vs. power, tradition vs. progress, and the slow loss of something irreplaceable.",
  },
  {
    id: 'iron-sermon',
    era: 'smoke-steel',
    name: 'The Iron Sermon',
    pitch: "An industrial theocracy where the church runs the factories and calls the smoke holy. Electrification is arriving, and with it, doubts that can't be unsaid.",
    expandedFlavor: "The church built the factories and called the smoke holy. For generations that was enough. Work is worship, the priests run the mills, and doubt is a sin you confess before it festers. But electricity is arriving, and it's bringing ideas the sermons can't answer. Workers are asking questions. Pamphlets are circulating. The church says the light in the wires is divine. Not everyone believes that anymore. Something is going to break, and soon.",
    subTags: [
      { label: 'Old magic', value: 'None' },
      { label: 'Non-human beings', value: 'Humans only' },
      { label: 'Tech aesthetic', value: 'Grounded industrial' },
      { label: 'Industrialization', value: 'Electrification' },
      { label: 'Political tension', value: 'Revolution brewing' },
    ],
    hiddenPrompt: "This is an industrial theocracy where religious authority and economic power are fused. The church owns the factories, controls the workforce, and frames industrial output as spiritual duty. Electrification is arriving and bringing ideas that threaten the entire structure.\n\nPlay this world as oppressive, claustrophobic, and on the edge of rupture. The church's control is total but increasingly brittle. Workers are exhausted and starting to doubt. Underground movements are forming. NPCs should reflect their relationship to the church. True believers are sincere and frightening. Doubters are careful and coded in how they speak.\n\nThe tone is industrial gothic with revolutionary tension. The world should feel heavy, smoky, and morally charged. Frame conflicts around faith vs. doubt, obedience vs. resistance, and the personal cost of standing up to an institution that controls every aspect of daily life. The church isn't cartoonishly evil. It provides order, community, and meaning. That's what makes it hard to fight.",
  },

  // --- Concrete & Code ---
  {
    id: 'thin-veil',
    era: 'concrete-code',
    name: 'The Thin Veil',
    pitch: "Modern-day city. Normal on the surface, but there's a hidden world underneath. Old things wearing new faces, doors that weren't there yesterday, and people who know too much.",
    expandedFlavor: "The city looks normal. Coffee shops, commuter traffic, noise complaints. But every now and then something slips. A door that opens to the wrong room. A stranger who knows your name and won't explain how. A neighborhood that wasn't on the map last week. There's a world underneath this one, older and stranger, and the people who've seen it can't unsee it. Most of them don't talk about it. The ones who do tend to stop showing up.",
    subTags: [
      { label: 'Supernatural elements', value: 'Hidden world' },
      { label: 'Era', value: 'Modern day' },
      { label: 'Power structure', value: 'Democratic' },
      { label: 'How much does society work?', value: 'Functioning but strained' },
    ],
    hiddenPrompt: "This is a modern-day urban fantasy setting where the supernatural exists but is hidden. The surface world is completely mundane. Underneath it, there's an older, stranger layer that most people never encounter and the few who do struggle to explain.\n\nPlay this world as grounded and creeping. The mundane world should feel real and specific. The supernatural intrudes gradually, through details that feel wrong rather than dramatic reveals. NPCs in the mundane world are oblivious. NPCs who know about the hidden world are guarded, cryptic, and careful about who they trust.\n\nThe tone is contemporary supernatural with a slow-burn tension. Frame conflicts around secrecy, discovery, and the cost of knowing too much. The hidden world isn't good or evil. It's alien. It operates on its own logic, and human concerns are mostly irrelevant to it.",
  },
  {
    id: 'gutter-arcana',
    era: 'concrete-code',
    name: 'The Gutter Arcana',
    pitch: "The supernatural isn't hiding. It's running rackets, settling debts, and killing witnesses. You're the one who takes the cases nobody else will touch, because nobody else believes them.",
    expandedFlavor: "The supernatural isn't hiding. It's operating. Vampires run nightclubs, a troll collects protection money on Fifth Street, and someone keeps hexing the parking meters on Alcott Ave. The cops don't touch it. The feds pretend it doesn't exist. Everybody else learns to work around it, work with it, or get out of the way. The monsters have business cards. The real question is what happens when their interests collide with yours.",
    subTags: [
      { label: 'Supernatural elements', value: 'Urban legends with teeth' },
      { label: 'Era', value: 'Modern day' },
      { label: 'Power structure', value: 'Democratic' },
      { label: 'How much does society work?', value: 'Functioning but strained' },
    ],
    hiddenPrompt: "This is a modern-day urban fantasy setting where the supernatural is open, active, and integrated into street-level life. Vampires, trolls, and stranger things operate alongside humans. They run businesses, hold territory, and settle disputes through the same mix of violence and negotiation as any other power player.\n\nPlay this world as noir-flavored and lived-in. The supernatural isn't mysterious or awe-inspiring. It's mundane in the way that organized crime is mundane. NPCs should treat the supernatural as a fact of life, not a source of wonder.\n\nThe tone is supernatural noir. Frame conflicts around power, territory, debts, and the messy intersection of human and non-human interests.",
  },
  {
    id: 'new-meridian',
    era: 'concrete-code',
    name: 'New Meridian',
    pitch: 'Near-future corporate city where your employer is your landlord, your insurer, and your judge. The government exists on paper. The resistance exists in the cracks.',
    expandedFlavor: "The corporations are the new city-states. Each campus has its own security force, internal courts, and loyalty scores that determine what floor employees are allowed to eat on. The government exists on paper but hasn't enforced anything meaningful in years. Outside the campus walls, the rest of the city makes do with whatever the companies don't want. Resistance exists in the cracks. It's small, it's careful, and it's getting less patient.",
    subTags: [
      { label: 'Supernatural elements', value: 'None' },
      { label: 'Era', value: 'Near-future' },
      { label: 'Power structure', value: 'Corporate-controlled' },
      { label: 'How much does society work?', value: 'Cracking at the seams' },
    ],
    hiddenPrompt: "This is a near-future corporate dystopia with no supernatural elements. Corporations have replaced governments as the primary power structures. Employees live on campus, under corporate law, subject to loyalty metrics and internal justice systems. The public sector exists on paper but has no real authority.\n\nPlay this world as sleek, controlled, and suffocating. Inside the corporate campuses, everything is efficient, monitored, and branded. Outside, the rest of the city operates in the gaps. The resistance is small, decentralized, and cautious.\n\nThe tone is near-future dystopian thriller. Frame conflicts around surveillance, autonomy, loyalty, and the personal cost of resistance. The corporations aren't evil in a cartoonish way. They provide stability, healthcare, and purpose. That's what makes them hard to leave and harder to fight.",
  },

  // --- Stars & Circuits ---
  {
    id: 'burning-corridor',
    era: 'stars-circuits',
    name: 'The Burning Corridor',
    pitch: 'A connected galaxy held together by fragile FTL trade routes. Humanity shares the stars with alien civilizations. Some ancient, some younger than us, none fully trustworthy.',
    expandedFlavor: "The galaxy is connected by a network of FTL trade routes, and every one of them is fragile. Humanity shares the stars with alien civilizations that were old before Earth discovered fire. Some are allies. Some are rivals. None are fully understood. The corridor hums with commerce, diplomacy, and the constant low-grade tension of species that need each other but don't trust each other. Out past the major routes, the gaps between stars get wide and quiet, and not everything out there has been catalogued.",
    subTags: [
      { label: 'Supernatural / psionic power', value: 'Rare' },
      { label: 'Alien life', value: 'Everywhere' },
      { label: 'Space travel', value: 'FTL (connected galaxy)' },
      { label: 'Cybernetics', value: 'Widespread' },
    ],
    hiddenPrompt: "This is a space opera setting built around a connected galaxy held together by FTL trade routes. Humanity is one of many spacefaring species. Cybernetics are widespread and normalized. Psionic abilities exist but are rare and poorly understood.\n\nPlay this world as vast, politically layered, and tense. The FTL network creates interdependence, and interdependence creates friction. Alien civilizations have their own histories, values, and agendas that don't map cleanly onto human frameworks. Diplomacy is constant and fragile.\n\nThe tone is political space opera with exploration on the margins. Frame conflicts around trust, cultural misunderstanding, trade disputes that mask deeper tensions, and the things waiting in the uncharted gaps between the major routes.",
  },
  {
    id: 'neon-abyss',
    era: 'stars-circuits',
    name: 'Neon Abyss',
    pitch: "One city. One planet. Everybody's augmented, everybody's connected, and the line between human and machine is a marketing decision. Psionics are the one thing tech can't fake.",
    expandedFlavor: "One city. One planet. No FTL, no colonies, no escape hatch. Everybody's augmented, everybody's connected, and the line between human and machine is a marketing decision. Neural implants are standard. Full-body modification is common enough to be boring. The only thing technology can't replicate is psionics, which makes the rare few who have it valuable, dangerous, or both. The city is everything. There is nowhere else to go.",
    subTags: [
      { label: 'Supernatural / psionic power', value: 'Rare' },
      { label: 'Alien life', value: 'Humans only' },
      { label: 'Space travel', value: 'Subluminal (slow, isolated)' },
      { label: 'Cybernetics', value: 'Post-human baseline' },
    ],
    hiddenPrompt: "This is a single-planet cyberpunk setting with no FTL and no escape. One city is everything. Augmentation is the baseline. Neural implants, body modification, and machine integration are standard. Psionics are the one exception: rare, organic, and impossible to replicate with technology.\n\nPlay this world as dense, vertical, and claustrophobic. Everyone is connected, everyone is augmented, and privacy is a luxury most people gave up a long time ago.\n\nThe tone is cyberpunk noir. Frame conflicts around identity, autonomy, corporate control, and what it means to be human when humanity is a design choice.",
  },
  {
    id: 'remnant-fleet',
    era: 'stars-circuits',
    name: 'The Remnant Fleet',
    pitch: "Humanity's last ships, crawling between dead stars. Earth is gone. The fleet is all that's left. A civilization in a convoy, rationing air and arguing about where to go next.",
    expandedFlavor: "Earth is gone. The fleet is what's left. A few hundred ships, civilian and military, crawling between dead stars and rationing everything. Air, water, fuel, hope. Every decision is a debate. Every resource is a compromise. Cybernetics exist but they're rare, expensive, and reserved for people the fleet can't afford to lose. Somewhere ahead there might be a planet worth stopping for. Behind, there's nothing. The fleet moves forward because the alternative is dying in place.",
    subTags: [
      { label: 'Supernatural / psionic power', value: 'None' },
      { label: 'Alien life', value: 'Exists but rare' },
      { label: 'Space travel', value: 'Subluminal (slow, isolated)' },
      { label: 'Cybernetics', value: 'Rare luxury' },
    ],
    hiddenPrompt: "This is a survival-focused science fiction setting. Humanity's homeworld is gone. What remains is a convoy of ships moving through empty space, rationing resources and debating where to go next. Cybernetics exist but are scarce and reserved for critical personnel.\n\nPlay this world as isolated, tense, and resource-constrained. Every decision matters because there is no margin for error. Politics on the fleet are intense because the stakes of every vote are existential.\n\nThe tone is survival drama in deep space. Frame conflicts around scarcity, leadership, sacrifice, and the question of what humanity owes its future when the present is already stretched past breaking.",
  },

  // --- Ash & Remnants ---
  {
    id: 'quiet-sprawl',
    era: 'ash-remnants',
    name: 'The Quiet Sprawl',
    pitch: "The collapse was recent. Years, not generations. The cities are still standing. Some of the lights still work. But the supply chains are gone, the government is gone, and what's left is yours to figure out.",
    expandedFlavor: "The collapse was recent enough that the buildings are still standing. Power works in patches. Grocery stores still have canned goods if you know which ones haven't been picked clean. There's no government, no supply chain, no cavalry coming. Just people figuring out what comes next, block by block, with whatever they had when the lights went out. The danger isn't ruins or monsters. It's scarcity, desperation, and the slow realization that nobody is coming to fix this.",
    subTags: [
      { label: 'Lingering power', value: 'None' },
      { label: 'Mutated populations', value: 'None' },
      { label: 'What ended things', value: 'Environmental collapse' },
      { label: 'Time since collapse', value: 'Recent (years)' },
    ],
    hiddenPrompt: "This is a grounded, near-term post-apocalyptic setting. The collapse was environmental and recent, measured in years, not generations. Cities are still standing. Infrastructure is partially intact. There is no magic, no mutation, and no monsters. The threat is entirely human: scarcity, desperation, and the absence of the systems people depended on.\n\nPlay this world as quiet, practical, and emotionally heavy. Survival is about logistics: clean water, medicine, shelter, food. NPCs should feel like ordinary people pushed into extraordinary circumstances.\n\nThe tone is grounded post-collapse realism. Frame conflicts around cooperation vs. self-preservation, the difficulty of rebuilding trust, and the moral weight of decisions made under scarcity.",
  },
  {
    id: 'rust-prophets',
    era: 'ash-remnants',
    name: 'The Rust Prophets',
    pitch: "Generations after the war, new tribes worship the old machines they don't understand. Some of those machines still work. Some of them are dangerous. All of them are coveted.",
    expandedFlavor: "Generations after the war, the old world is half-buried and barely understood. New tribes have grown up around the machines their ancestors left behind. Some of them still work. Most of them are dangerous. All of them are sacred to someone. Prophets preach the gospel of the before-times, warlords fight over functioning generators, and scavengers risk everything to drag relics out of the dead zones. The old world is gone, but it left its bones everywhere, and people will kill for bones.",
    subTags: [
      { label: 'Lingering power', value: 'Unstable fragments' },
      { label: 'Mutated populations', value: 'Rare' },
      { label: 'What ended things', value: 'War' },
      { label: 'Time since collapse', value: 'Generations ago' },
    ],
    hiddenPrompt: "This is a post-war setting generations removed from collapse. The old world is half-buried and poorly understood. New tribal civilizations have formed around the relics and machines left behind. Unstable fragments of old-world technology behave unpredictably and are treated as spiritual artifacts.\n\nPlay this world as mythic and dangerous. The tribes have their own cultures, oral histories, and belief systems built around fragments of a past they can't fully reconstruct.\n\nThe tone is tribal post-apocalypse with a mythic layer. Frame conflicts around faith, power, the interpretation of the past, and the danger of technology that nobody fully understands.",
  },
  {
    id: 'the-bloom',
    era: 'ash-remnants',
    name: 'The Bloom',
    pitch: 'Something grew in the ruins. The plague that ended civilization left mutations in its wake. New species, new ecosystems, new apex predators. Humanity adapts or gets eaten.',
    expandedFlavor: "The plague didn't just kill. It changed things. New species crawl through the ruins. Forests grow where cities stood, fast and wrong, full of things that didn't exist a generation ago. Humanity survived, but so did everything the plague touched, and most of it is hungry. The ecosystem has rewritten itself from the ground up. Adaptation isn't optional. The people who made it this far have learned to read the new rules, and the first rule is that nothing stays safe for long.",
    subTags: [
      { label: 'Lingering power', value: 'Dangerous and active' },
      { label: 'Mutated populations', value: 'Common' },
      { label: 'What ended things', value: 'Plague' },
      { label: 'Time since collapse', value: 'Generations ago' },
    ],
    hiddenPrompt: "This is a biological post-apocalyptic setting where a plague wiped out civilization and mutated the ecosystem. New species, new predators, and new plant life have overwritten the old world. Mutations in humans are common. The environment is actively dangerous and still evolving.\n\nPlay this world as lush, alien, and predatory. The ruins are overgrown with things that didn't exist a generation ago. Mutated humans have advantages but face suspicion or hostility from unchanged communities.\n\nThe tone is biological horror meets survival. Frame conflicts around adaptation, mutation, the fear of change, and the tension between unchanged and mutated populations.",
  },

  // --- Dream & Myth ---
  {
    id: 'sunken-court',
    era: 'dream-myth',
    name: 'The Sunken Court',
    pitch: "You've crossed into the spirit world, or maybe it crossed into you. Gods and archetypes walk openly. The rules are mythic: bargains, riddles, and the weight of symbols.",
    expandedFlavor: "You've stepped past the edge of the real. This is the spirit world, the place behind the curtain, where gods and archetypes walk openly and the rules run on myth-logic. Bargains are binding. Symbols have weight. Names have power, and giving yours away is the oldest mistake in the book. The normal world still exists somewhere behind you, but the door back isn't where you left it. Everything here means something. The trick is figuring out what before it costs you.",
    subTags: [
      { label: 'Supernatural power', value: "It's the fabric of reality" },
      { label: 'Non-human beings', value: 'Spirits and archetypes' },
      { label: 'How broken is reality', value: 'Fluid and shifting' },
      { label: 'Is there a "normal" world', value: "Yes, and you've left it" },
    ],
    hiddenPrompt: "This is a spirit-world setting where the player has crossed into a realm governed by mythic logic. Gods, archetypes, and spirits walk openly. The rules of reality are symbolic, not physical. Bargains are binding. Names have power.\n\nPlay this world as dreamlike, layered, and consequential. Nothing here is casual. Every interaction carries weight because the rules are mythic. The environment should shift based on narrative logic, not geography. NPCs are archetypes as much as individuals.\n\nThe tone is mythic fantasy with weight. Frame conflicts around bargains, identity, the cost of power, and the danger of playing by rules you don't fully understand.",
  },
  {
    id: 'fablelands',
    era: 'dream-myth',
    name: 'The Fablelands',
    pitch: "A world of fairy tales, but the originals, before they were safe. Curses are real, promises are binding, and the forest doesn't care about your intentions.",
    expandedFlavor: "This is a world of fairy tales, but the original versions, before anyone filed the edges down. Curses are real and specific. Promises are binding contracts enforced by the land itself. The forest is old, watchful, and utterly indifferent to good intentions. Witches, tricksters, and talking beasts operate by rules that reward cleverness and punish arrogance. It feels like a story because it is one. The question is what kind of story, and whether you get a say in how it ends.",
    subTags: [
      { label: 'Supernatural power', value: 'Earned or gifted' },
      { label: 'Non-human beings', value: 'Mythic races' },
      { label: 'How broken is reality', value: 'Mostly stable with strange edges' },
      { label: 'Is there a "normal" world', value: "It's fading" },
    ],
    hiddenPrompt: "This is a fairy tale setting drawn from the original, unedited versions of folklore. Curses are real and specific. Promises are enforced by the world itself. The forest is ancient, aware, and operates on its own logic.\n\nPlay this world as beautiful, dangerous, and rule-bound. The rules aren't written down, but they are absolute. The world should feel like a story that knows it's a story, with patterns the player can learn to recognize and use. NPCs are fairy tale archetypes played straight.\n\nThe tone is dark fairy tale. Frame conflicts around cleverness vs. brute force, the letter vs. spirit of rules, and the danger of assuming you understand a world that is older and stranger than you.",
  },
  {
    id: 'outer-dark',
    era: 'dream-myth',
    name: 'The Outer Dark',
    pitch: "Something is pressing against the skin of the world. The signs are small at first. Wrong angles, sounds that shouldn't carry, dreams that leave marks. Understanding it won't save you. It wasn't built to be understood.",
    expandedFlavor: "Something is wrong, but it's hard to say exactly what. The angles in a hallway that don't add up. A sound that carries from somewhere with no source. Dreams that leave marks. The world looks stable on the surface, but the skin is thin, and something vast is pressing against the other side. Understanding it won't help. It wasn't built to be understood. The people who've noticed are split between those trying to stop it and those who think it's already too late.",
    subTags: [
      { label: 'Supernatural power', value: 'Dangerous and wild' },
      { label: 'Non-human beings', value: 'Anything goes' },
      { label: 'How broken is reality', value: 'Mostly stable with strange edges' },
      { label: 'Is there a "normal" world', value: "It's fading" },
    ],
    hiddenPrompt: "This is a cosmic horror setting where something vast and incomprehensible is pressing against the edges of an otherwise stable-seeming world. Reality is mostly intact but the signs of wrongness are accumulating.\n\nPlay this world as slow, creeping, and deeply unsettling. The surface should feel normal for as long as possible. The wrongness starts small: angles that don't resolve, sounds from empty rooms, dreams that leave physical marks. No one has the full picture, and the pieces that exist don't fit together comfortably.\n\nThe tone is cosmic horror. Frame conflicts around knowledge vs. sanity, the cost of investigation, and the question of whether understanding the threat makes it worse. The entity or force behind the wrongness should never be fully explained.",
  },
];

const ARCHETYPES = {
  'sword-soil': [
    {
      id: 'soldier', name: 'Soldier',
      pitch: "You've held the line, followed orders, and buried friends. You know what steel does to flesh.",
      personality: ['Stoic', 'Bold'], stats: ['STR', 'CON'],
      backstory: "You served in the border campaigns for six years before your company was dissolved. The lord who sent you there is dead now, and nobody's paying what they owe. You kept your sword and your training. The rest you left in the mud.",
    },
    {
      id: 'rogue', name: 'Rogue',
      pitch: 'Locks, pockets, shadows. You learned early that the world gives nothing to those who ask nicely.',
      personality: ['Calculating', 'Cautious'], stats: ['DEX', 'INT'],
      backstory: "You grew up in a city that didn't care whether you ate or starved, so you learned to take what you needed. Locks, pockets, ledgers, conversations you weren't supposed to hear. You've worked for guilds, merchants, and one noble house that pretended you didn't exist. You're good at getting in. Getting out clean is the part you're still perfecting.",
    },
    {
      id: 'scholar', name: 'Scholar',
      pitch: "You traded a comfortable life for questions nobody wanted answered. Knowledge has a price and you've been paying it.",
      personality: ['Curious', 'Idealistic'], stats: ['INT', 'WIS'],
      backstory: "You left the university after your research drew the wrong kind of attention. The questions you were asking made powerful people uncomfortable, which told you the questions were worth asking. You travel now, chasing references and rumors, funding your work however you can. What you've found so far has been worth the trouble. What you're close to finding might be worth more than you can afford.",
    },
    {
      id: 'healer', name: 'Healer',
      pitch: "People come to you broken. You put them back together. It takes more out of you than anyone realizes.",
      personality: ['Cautious', 'Idealistic'], stats: ['WIS', 'CHA'],
      backstory: "You learned your craft from someone who never turned anyone away, regardless of what they could pay. You've carried that forward, and it's taken you places you never expected. Battlefields. Plague towns. Noble courts where the ailments are political and the cures are dangerous. People trust you with their worst moments. That kind of trust opens doors nothing else can.",
    },
    {
      id: 'fae-exile', name: 'Fae Exile',
      pitch: 'You are not from here. The mortal world is loud, short-lived, and bewildering, but the place you came from is no longer an option.',
      personality: ['Curious', 'Stoic'], stats: ['CHA', 'DEX'],
      backstory: "You are not from this world. The mortal realm is loud, brief, and bewildering, but the place you came from is no longer safe for you. Whether you were banished, fled, or simply walked through the wrong door, the result is the same. You are here now, learning rules that change faster than you're used to, among people whose lives burn bright and short. You remember what you lost. You're still deciding what to do about it.",
      nonHumanFlag: true,
    },
  ],
  'smoke-steel': [
    {
      id: 'inventor', name: 'Inventor',
      pitch: "You build things that shouldn't work yet. The patent office doesn't return your letters. The black market does.",
      personality: ['Curious', 'Impulsive'], stats: ['INT', 'DEX'],
      backstory: "You've been building things since you were old enough to hold a wrench. No formal training, no patron, no credentials. Just a workshop full of half-finished prototypes and a notebook the patent office won't look at. The legitimate channels dried up a while ago. The people willing to fund your work don't ask questions, which suits you fine, because the things you're building don't fit neatly into anyone's categories.",
    },
    {
      id: 'revolutionary', name: 'Revolutionary',
      pitch: "The old order is rotting and you can smell it. You've got a pamphlet, a pistol, and a list of names.",
      personality: ['Bold', 'Idealistic'], stats: ['CHA', 'CON'],
      backstory: "You used to believe the system could be fixed from the inside. Then someone you loved paid the price for that belief, and you stopped asking nicely. You've got contacts in the underground, a printing press that moves every few weeks, and a list of people who need to answer for what they've done. The old order is rotting. You intend to help it fall.",
    },
    {
      id: 'officer', name: 'Officer',
      pitch: 'Empire, company, or church. Someone gave you authority and a uniform. What you do with it is between you and your conscience.',
      personality: ['Calculating', 'Stoic'], stats: ['STR', 'CHA'],
      backstory: "You earned your commission through training, service, and the ability to make hard calls under pressure. The institution you serve gave you authority, a uniform, and a set of expectations. You've met most of them. The ones you haven't keep you up at night. Command says the mission is clear. The things you've seen in the field suggest otherwise. What you do about that gap is the question you keep not answering.",
    },
    {
      id: 'smuggler', name: 'Smuggler',
      pitch: "Borders, blockades, tariffs. All just pricing signals. You move what needs moving and you don't ask what's in the crate.",
      personality: ['Charming', 'Cautious'], stats: ['DEX', 'CHA'],
      backstory: "You learned the trade routes the hard way, running cargo through blockades and borders that exist mostly to make rich people richer. You don't ask what's in the crate. You don't take sides. You move what needs moving, collect what you're owed, and disappear before anyone changes their mind. You've built a network of contacts who trust you because you've never burned them. That reputation is worth more than anything you've ever hauled.",
    },
    {
      id: 'hedge-witch', name: 'Hedge Witch',
      pitch: "The old ways don't fit neatly into the new world. You remember what the factories were built on top of.",
      personality: ['Cynical', 'Curious'], stats: ['WIS', 'INT'],
      backstory: "You grew up in the places the factories haven't reached yet. The old ways were all you had, passed down through generations of people who paid attention to things the modern world forgot. You know what grows in the margins, what the signs mean, and what to do when something goes wrong that machines can't fix. The cities don't trust you. The people who come to you at night, when nothing else has worked, trust you plenty.",
    },
  ],
  'concrete-code': [
    {
      id: 'detective', name: 'Detective',
      pitch: "You follow the thread. Sometimes it leads to a confession, sometimes to a body, sometimes to something you weren't supposed to find.",
      personality: ['Calculating', 'Curious'], stats: ['INT', 'WIS'],
      backstory: "You started in missing persons. Small cases, paper trails, interviews that went nowhere. Then one case went somewhere you didn't expect, and you pulled the thread anyway. That's the problem with pulling threads. You've built a career on noticing what other people miss, and it's cost you most of the relationships that normal people use to stay sane. You're good at finding answers. Living with them is a different skill.",
    },
    {
      id: 'fixer', name: 'Fixer',
      pitch: "You know people. The right call gets the right door opened. The wrong call gets you buried. You haven't made the wrong call yet.",
      personality: ['Charming', 'Cynical'], stats: ['CHA', 'INT'],
      backstory: "You know people. Not in the casual way. You know who owes what to whom, who needs a problem solved quietly, and who can be reached when the official channels aren't an option. You've built a network that spans social strata, and you maintain it through a simple economy of favors. Everyone comes to you eventually. The trick is making sure you're never the one who needs to call in a debt you can't collect.",
    },
    {
      id: 'veteran', name: 'Veteran',
      pitch: "You came home from something that didn't come home with you. The skills stayed. The peace didn't.",
      personality: ['Stoic', 'Blunt'], stats: ['STR', 'CON'],
      backstory: "You served. The details depend on who's asking and how much you feel like sharing. You came back with a set of skills that don't translate well to civilian life and a set of memories that don't translate at all. The structure is gone. The purpose is gone. What's left is a body that knows how to operate under pressure and a mind that hasn't figured out what to do with the quiet.",
    },
    {
      id: 'journalist', name: 'Journalist',
      pitch: "The story matters more than your safety. That's what you tell yourself when the threats start.",
      personality: ['Curious', 'Idealistic'], stats: ['CHA', 'WIS'],
      backstory: "You got into this job because you believed the truth mattered. You still believe that, mostly, even though the industry is collapsing and the stories that need telling are the ones that make powerful people angry. You've been threatened, discredited, and frozen out of sources you spent years cultivating. You keep going because the alternative is letting someone else decide what the public gets to know.",
    },
    {
      id: 'psychic', name: 'Psychic',
      pitch: "You've always known things you shouldn't. It's not a gift. Gifts don't come with headaches and nosebleeds.",
      personality: ['Cautious', 'Stoic'], stats: ['WIS', 'DEX'],
      backstory: "It started young. Knowing who was calling before the phone rang. Finishing sentences before people said them. Headaches that came with information you shouldn't have. You've spent your life managing something you didn't ask for and can't fully control. Some people are afraid of you. Some people want to use you. Nobody has been able to explain what you are, including you.",
    },
  ],
  'stars-circuits': [
    {
      id: 'pilot', name: 'Pilot',
      pitch: "You fly the ship. Everything else, the cargo, the crew, the warrant, is someone else's problem.",
      personality: ['Bold', 'Impulsive'], stats: ['DEX', 'INT'],
      backstory: "You got your flight certification young and haven't stayed on solid ground for longer than a week since. The ship is home. Everything else is temporary. You've flown cargo, passengers, and a few jobs you don't put on the resume. The vessel you're in now isn't much, but it's yours, and you know every sound it makes. When something goes wrong in the black, the only thing between you and nothing is your hands on the controls.",
    },
    {
      id: 'hacker', name: 'Hacker',
      pitch: "Every system has a back door. You've never met a network you couldn't get into. Getting out clean is the harder part.",
      personality: ['Curious', 'Calculating'], stats: ['INT', 'DEX'],
      backstory: "You found your first back door when you were fourteen. By the time anyone figured out what you'd done, you were three networks deep and learning things that weren't meant for public consumption. You've worked both sides since then. Corporate contracts when you need money, independent jobs when you need to feel something. Every system has a weakness. Finding it is instinct. Getting out before anyone traces you back is the part that takes discipline.",
    },
    {
      id: 'mercenary', name: 'Mercenary',
      pitch: "You fight for whoever's paying. Loyalty is a luxury. Survival is a skill.",
      personality: ['Blunt', 'Cynical'], stats: ['STR', 'CON'],
      backstory: "You've fought for corporations, governments, and a few organizations that didn't have names. The employers change. The work doesn't. Someone points, you go, you do the job, you get paid. Loyalty is a word people use when they want something for free. You've survived this long because you're good at your job and because you've never pretended it was anything other than what it is.",
    },
    {
      id: 'medic', name: 'Medic',
      pitch: "In the field, on the station, in the cargo hold with no anesthetic. You keep people alive with whatever you've got.",
      personality: ['Stoic', 'Cautious'], stats: ['WIS', 'INT'],
      backstory: "You trained in a proper facility, but that was a long time ago. Since then you've practiced in field camps, cargo holds, and station corridors with bad lighting and worse supplies. Triage is second nature. You know what you can save and what you can't, and you've made peace with the gap. People are grateful when you pull them through. They don't ask what it costs you to lose the ones you couldn't.",
    },
    {
      id: 'alien-envoy', name: 'Alien Envoy',
      pitch: "You are not from their world. Their customs are strange, their lifespans are short, and their conflicts are difficult to take seriously, but here you are.",
      personality: ['Curious', 'Charming'], stats: ['CHA', 'WIS'],
      backstory: "You are not from their world. You were sent, or you came willingly, or you ended up here through circumstances your own people would find embarrassing. Human customs are strange. Their lifespans are short and they act like it, rushing through decisions your culture would deliberate for generations. You've learned to navigate their systems, their politics, and their blind spots. Whether you're here as observer, diplomat, or exile, you're a long way from home and adapting as fast as you can.",
      nonHumanFlag: true,
    },
  ],
  'ash-remnants': [
    {
      id: 'scavenger', name: 'Scavenger',
      pitch: "You know where the good stuff is buried. You know what's still safe to eat. You know which ruins to avoid. Mostly.",
      personality: ['Cautious', 'Calculating'], stats: ['DEX', 'WIS'],
      backstory: "You know the ruins better than anyone still breathing. Which buildings are stable, which ones are picked clean, which ones have something in the basement that'll kill you. You've mapped supply caches, water sources, and routes that keep you off the main roads. Most people stick to their settlements. You go where they won't, bring back what they can't find, and charge what the market will bear. Solo work suits you. Partners slow you down and split the take.",
    },
    {
      id: 'raider', name: 'Raider',
      pitch: "You took what you needed from people who had it. Settlements locked their gates when they heard you were coming. Survival isn't pretty, and you stopped pretending it was.",
      personality: ['Bold', 'Blunt'], stats: ['STR', 'CHA'],
      backstory: "You survived the collapse by taking what other people couldn't protect. Food, supplies, territory. You ran with groups that hit hard and moved fast, and you were good enough at it that people learned your name. Settlements bolted their gates. Traders changed their routes. You told yourself it was survival, and it was, but that word covers a lot of ground. Eventually the crew fell apart the way they always do. Now it's just you, a reputation that walks into every room before you do, and the question of whether you keep living the way you have been.",
    },
    {
      id: 'healer-ar', name: 'Healer',
      pitch: "Clean water, antibiotics, a steady hand. You're the most valuable person in any settlement and the biggest target on any road.",
      personality: ['Idealistic', 'Cautious'], stats: ['WIS', 'INT'],
      backstory: "Medical supplies are worth more than ammunition in most settlements, and you're the person who knows how to use them. Your training is a mix of whatever you could learn, whoever would teach you, and hard lessons from patients you couldn't save. Every settlement wants you to stay. Every road makes you a target. You keep moving because the need is everywhere and staying in one place means choosing who matters and who doesn't.",
    },
    {
      id: 'drifter', name: 'Drifter',
      pitch: "No settlement, no allegiance, no anchor. You walk. Sometimes trouble follows, sometimes you find it first.",
      personality: ['Stoic', 'Cynical'], stats: ['CON', 'DEX'],
      backstory: "You don't stay. That's the rule, and you've kept it long enough that the reason you started doesn't matter anymore. You've passed through more settlements than you can count, traded work for shelter, and kept moving before anyone got too comfortable with you around. You know the roads, the weather patterns, and the places where trouble gathers. Somewhere behind you there's a life you walked away from. You don't talk about it.",
    },
    {
      id: 'mutant', name: 'Mutant',
      pitch: "The collapse changed you, or maybe it changed your parents. Either way, you're not quite what you used to be, and people notice.",
      personality: ['Stoic', 'Impulsive'], stats: ['CON', 'STR'],
      backstory: "The collapse left marks on you that go deeper than scars. Something changed, in you or in the generation before you, and the result is visible. You can do things other people can't. That makes you useful in the field and uncomfortable to be around in a settlement. Some communities accept you. Others don't. You've learned to read a room fast and leave before the mood turns. What you are isn't a choice. What you do with it is.",
    },
  ],
  'dream-myth': [
    {
      id: 'witch', name: 'Witch',
      pitch: "You've studied the rules of this world long enough to find the loopholes. Bargains, brews, and bent edges. Power through knowledge, patience, and knowing what things cost.",
      personality: ['Calculating', 'Curious'], stats: ['WIS', 'INT'],
      backstory: "You learned the rules of this place the hard way, through trial, error, and consequences that left marks. The power here isn't given freely. It's earned through study, traded through bargains, and bound by terms that punish carelessness. You've built your practice piece by piece. A recipe from a dead god's library. A trick you bartered from something that didn't have a face. A word that does exactly one thing if you say it right. You're not the strongest thing in this world. But you pay attention, you prepare, and you don't make deals you haven't read twice.",
    },
    {
      id: 'oathbound', name: 'Oathbound',
      pitch: 'You made a promise to something older than language. It gave you power. The terms were not negotiable.',
      personality: ['Stoic', 'Idealistic'], stats: ['WIS', 'CON'],
      backstory: "You made a promise to something older than language. You meant it at the time. Maybe you understood the terms, maybe you didn't, but the power came and the bargain held. What you can do now isn't free. It never was. The oath shapes your choices in ways that aren't always obvious until it's too late to choose differently. You serve something vast and patient, and it hasn't forgotten a single word you said.",
    },
    {
      id: 'vessel', name: 'Vessel',
      pitch: "Something lives inside you. It speaks when it wants to. It helps when it chooses. You're never sure whose hands are steering.",
      personality: ['Impulsive', 'Cynical'], stats: ['CON', 'CHA'],
      backstory: "Something lives inside you. It was there before you had a name for it, and it isn't leaving. Sometimes it's quiet. Sometimes it speaks, and when it speaks, you listen, because ignoring it is worse. You've done things you don't fully remember. You've known things you had no way of knowing. The line between your will and its will blurs at the worst possible moments. You're still in control. Mostly. You think.",
    },
    {
      id: 'hunter', name: 'Hunter',
      pitch: "The things in this world have teeth, and most people pretend they don't exist. You know better. You've got the scars, the tools, and the list.",
      personality: ['Calculating', 'Bold'], stats: ['DEX', 'WIS'],
      backstory: "The things in this world have teeth, and most people pretend they don't. You know better because you've tracked them, studied them, and put them down. You've got scars from the ones that were faster than you expected and notes on the ones you haven't found yet. It's not heroic work. It's methodical, dangerous, and lonely. But somebody has to do it, and you're the one who said yes.",
    },
  ],
};

const STEP_NAMES = ['Storyteller', 'Setting', 'Character', 'Attributes', 'Difficulty', 'Scenario'];

// SAMPLE_STATS is demo-only. With a real gameId, proposal must come from the server.
const SAMPLE_STATS = [
  { name: 'Strength', emoji: '\u{1F4AA}', value: 6.5 },
  { name: 'Dexterity', emoji: '\u{1F3C3}', value: 8.2 },
  { name: 'Constitution', emoji: '\u{1F6E1}\uFE0F', value: 7.0 },
  { name: 'Intelligence', emoji: '\u{1F9E0}', value: 11.3 },
  { name: 'Wisdom', emoji: '\u{1F441}\uFE0F', value: 9.8 },
  { name: 'Charisma', emoji: '\u{1F3AD}', value: 7.4 },
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
              border: i === current ? '2px solid var(--accent-gold)' : i < current ? 'none' : '1px solid var(--border-gold-subtle)',
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
              background: i < current ? 'var(--accent-gold)' : 'var(--bg-gold-light)',
              transition: 'background 0.4s',
            }} />
          )}
        </div>
      ))}
    </div>
  );
}

// --- PHASE SCREENS ---

function Phase1({ selected, onSelect, customText, setCustomText }) {
  return (
    <div>
      <PhaseTitle title="Choose Your Storyteller" subtitle="The voice behind every word. Choose who tells your story." />
      <p style={{
        fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: 'var(--text-dim)',
        marginTop: -20, marginBottom: 24,
      }}>You can change your storyteller at any time during play.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {STORYTELLERS.map(s => (
          <div key={s.id}>
            <SelectionCard item={s} selected={selected} onSelect={onSelect}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <IconBox name={s.icon} color={selected === s.id ? 'var(--accent-gold)' : 'var(--text-muted)'} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
                    <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 17, fontWeight: 700, color: 'var(--text-heading)' }}>{s.name}</span>
                    <span style={{ fontFamily: 'var(--font-alegreya)', fontSize: 14, color: 'var(--text-muted)', fontStyle: 'italic' }}>{s.tone}</span>
                  </div>
                  <p style={{ fontFamily: 'var(--font-alegreya)', fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>{s.desc}</p>
                </div>
              </div>
            </SelectionCard>
            {selected === s.id && s.preview && (
              <div style={{
                margin: '-1px 0 0 0', padding: '18px 24px',
                background: '#0d1120',
                border: '1px solid var(--border-gold-subtle)',
                borderTop: 'none',
                borderLeft: '3px solid var(--accent-gold)',
                borderRadius: '0 0 8px 8px',
              }}>
                <p style={{
                  fontFamily: 'var(--font-alegreya)', fontSize: 15.5, fontStyle: 'italic',
                  color: 'var(--text-stat-bright)', lineHeight: 1.8, margin: 0,
                }}>{s.preview}</p>
              </div>
            )}
          </div>
        ))}
      </div>
      {selected === 'custom' && (
        <div style={{ marginTop: 16 }}>
          <textarea value={customText} onChange={e => setCustomText(e.target.value)} placeholder="Describe your ideal narrative voice, or name storytellers to blend. Example: 'Bard with a touch of Trickster.'" className={styles.wizardInput} style={{
            width: '100%', minHeight: 90, background: 'var(--bg-main)', border: '1px solid var(--border-gold-faint)',
            borderRadius: 8, padding: 16, fontFamily: 'var(--font-alegreya)', fontSize: 16,
            color: 'var(--text-primary)', outline: 'none', resize: 'vertical', boxSizing: 'border-box',
          }} />
        </div>
      )}
    </div>
  );
}

function SettingQuestions({ settingId, answers, setAnswers, onInteract, freeformText, setFreeformText }) {
  const questions = SETTING_QUESTIONS[settingId];
  if (!questions || questions.length === 0) return null;

  const handleSelect = (label, value) => {
    if (onInteract) onInteract();
    setAnswers(prev => ({ ...prev, [label]: prev[label] === value ? null : value }));
  };

  return (
    <div style={{
      marginTop: 32, padding: '28px 28px 24px',
      background: 'var(--bg-gold-faint)',
      border: '1px solid var(--border-gold-faint)',
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
                    background: isActive ? 'var(--bg-gold-light)' : 'var(--bg-main)',
                    border: `1px solid ${isActive ? 'var(--border-card-hover)' : 'var(--border-gold-subtle)'}`,
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
          <textarea value={freeformText || ''} onChange={e => setFreeformText(e.target.value)} placeholder="Add details the questions above don't cover. Anything goes." className={styles.wizardInput} style={{
            width: '100%', minHeight: 80, background: 'var(--bg-main)', border: '1px solid var(--border-gold-subtle)',
            borderRadius: 8, padding: 16, fontFamily: 'var(--font-alegreya)', fontSize: 16,
            color: 'var(--text-primary)', outline: 'none', resize: 'vertical', boxSizing: 'border-box',
          }} />
        </div>
      </div>
    </div>
  );
}

function PrebuiltWorldCard({ world, isSelected, isExpanded, onToggle, anythingElseText, onAnythingElseChange }) {
  return (
    <div>
      <button
        onClick={() => onToggle(world.id)}
        style={{
          width: '100%', textAlign: 'left', cursor: 'pointer',
          background: isSelected ? 'var(--bg-gold-subtle)' : 'var(--bg-main)',
          border: `1px solid ${isSelected ? 'var(--border-card-hover)' : 'var(--border-gold-faint)'}`,
          borderRadius: isExpanded ? '8px 8px 0 0' : 8,
          padding: '18px 20px',
          transition: 'all 0.3s',
        }}
      >
        <div style={{
          fontFamily: 'var(--font-cinzel)', fontSize: 17, fontWeight: 700,
          color: 'var(--text-heading)', marginBottom: 8,
        }}>{world.name}</div>
        <p style={{
          fontFamily: 'var(--font-alegreya)', fontSize: 15, color: 'var(--text-muted)',
          lineHeight: 1.6, margin: 0,
        }}>{world.pitch}</p>
      </button>

      {isExpanded && (
        <div style={{
          background: '#0d1120',
          borderLeft: '3px solid var(--accent-gold)',
          borderRight: '1px solid var(--border-gold-subtle)',
          borderBottom: '1px solid var(--border-gold-subtle)',
          borderRadius: '0 0 8px 8px',
          padding: '20px 24px',
        }}>
          <p style={{
            fontFamily: 'var(--font-alegreya)', fontSize: 15.5, fontStyle: 'italic',
            color: 'var(--text-stat-bright)', lineHeight: 1.8, margin: '0 0 18px 0',
          }}>{world.expandedFlavor}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {world.subTags.map(tag => (
              <span key={tag.label} style={{
                fontFamily: 'var(--font-alegreya-sans)', fontSize: 13,
                color: 'var(--text-muted)', background: 'var(--bg-card)',
                border: '1px solid var(--border-primary)', borderRadius: 4,
                padding: '5px 12px',
              }}>{tag.label}: {tag.value}</span>
            ))}
          </div>
          {isSelected && onAnythingElseChange && (
            <div style={{ marginTop: 16 }}>
              <label style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 10 }}>Anything else?</label>
              <textarea value={anythingElseText || ''} onChange={e => onAnythingElseChange(e.target.value)} placeholder="Any tweaks for this playthrough? Change the political situation, add a detail, shift the tone." className={styles.wizardInput} style={{
                width: '100%', minHeight: 80, background: 'var(--bg-main)', border: '1px solid var(--border-gold-subtle)',
                borderRadius: 8, padding: 16, fontFamily: 'var(--font-alegreya)', fontSize: 16,
                color: 'var(--text-primary)', outline: 'none', resize: 'vertical', boxSizing: 'border-box',
              }} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SectionDivider({ text }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', margin: '32px 0 28px',
      position: 'relative',
    }}>
      <div style={{ flex: 1, height: 1, background: 'var(--border-gold-faint)' }} />
      <span style={{
        fontFamily: 'var(--font-alegreya-sans)', fontSize: 14,
        color: 'var(--text-dim)', textTransform: 'uppercase',
        letterSpacing: '0.06em', padding: '0 16px',
        background: 'var(--bg-main)',
      }}>{text}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--border-gold-faint)' }} />
    </div>
  );
}

function WorldSnapshotList({ snapshots, selectedSnapshot, setSelectedSnapshot, anythingElseText, setAnythingElseText }) {
  if (!snapshots || snapshots.length === 0) {
    return (
      <div style={{
        textAlign: 'center', padding: '40px 0',
      }}>
        <p style={{
          fontFamily: 'var(--font-alegreya)', fontSize: 16, fontStyle: 'italic',
          color: 'var(--text-dim)', margin: 0,
        }}>No saved worlds yet. Worlds you save or import will appear here.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 }}>
      {snapshots.map(snap => {
        const isSelected = selectedSnapshot === snap.id;
        return (
          <div key={snap.id}>
            <button
              onClick={() => setSelectedSnapshot(isSelected ? null : snap.id)}
              style={{
                width: '100%', textAlign: 'left', cursor: 'pointer',
                background: isSelected ? 'var(--bg-gold-subtle)' : 'var(--bg-main)',
                border: `1px solid ${isSelected ? 'var(--border-card-hover)' : 'var(--border-gold-faint)'}`,
                borderRadius: 8, padding: '18px 20px',
                transition: 'all 0.3s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{
                  fontFamily: 'var(--font-cinzel)', fontSize: 17, fontWeight: 700,
                  color: 'var(--text-heading)',
                }}>{snap.name}</span>
                <span style={{
                  fontFamily: 'var(--font-alegreya-sans)', fontSize: 12,
                  color: 'var(--accent-gold)', background: 'var(--bg-gold-light)',
                  padding: '3px 10px', borderRadius: 4,
                }}>{snap.settingType}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{
                  fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: 'var(--text-muted)',
                }}>{snap.snapshotType}</span>
              </div>
              <div style={{
                fontFamily: 'var(--font-alegreya-sans)', fontSize: 13,
                color: 'var(--text-dim)',
              }}>{snap.metadata}</div>
            </button>

            {isSelected && (
              <div style={{ marginTop: 12 }}>
                {snap.tags && snap.tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                    {snap.tags.map(tag => (
                      <span key={tag.label} style={{
                        fontFamily: 'var(--font-alegreya-sans)', fontSize: 13,
                        color: 'var(--text-muted)', background: 'var(--bg-card)',
                        border: '1px solid var(--border-primary)', borderRadius: 4,
                        padding: '5px 12px',
                      }}>{tag.label}: {tag.value}</span>
                    ))}
                  </div>
                )}
                <label style={{
                  fontFamily: 'var(--font-alegreya-sans)', fontSize: 15, fontWeight: 600,
                  color: 'var(--text-secondary)', display: 'block', marginBottom: 10,
                }}>Anything else?</label>
                <textarea value={anythingElseText || ''} onChange={e => setAnythingElseText(e.target.value)} placeholder="Any changes for this playthrough? The world loads as you left it, but you can adjust." className={styles.wizardInput} style={{
                  width: '100%', minHeight: 80, background: 'var(--bg-main)', border: '1px solid var(--border-gold-subtle)',
                  borderRadius: 8, padding: 16, fontFamily: 'var(--font-alegreya)', fontSize: 16,
                  color: 'var(--text-primary)', outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── World Seed Components ───

const FACTION_DISPOSITIONS = ['Unknown', 'Friendly', 'Neutral', 'Hostile'];
const NPC_RELATIONSHIPS = ['Neutral', 'Companion', 'Ally', 'Contact', 'Rival', 'Enemy'];

function dispositionColor(d) {
  switch (d) {
    case 'Friendly': return 'var(--color-success)';
    case 'Hostile': return 'var(--color-danger)';
    case 'Neutral': return 'var(--text-secondary)';
    default: return 'var(--text-dim)';
  }
}

function relationshipColor(r) {
  switch (r) {
    case 'Companion': return 'var(--accent-gold)';
    case 'Ally': return 'var(--color-success)';
    case 'Rival': case 'Enemy': return 'var(--color-danger)';
    case 'Contact': return 'var(--text-secondary)';
    default: return 'var(--text-dim)';
  }
}

function SeedCard({ name, badge, badgeColor, description, subtitle, onRemove }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = description && description.length > 120;
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: 8, padding: '14px 18px', position: 'relative', marginBottom: 10 }}>
      <button onClick={onRemove} aria-label="Remove" style={{
        position: 'absolute', top: 8, right: 8, background: 'none', border: 'none',
        color: 'var(--text-dim)', cursor: 'pointer', fontSize: 16, padding: 8, lineHeight: 1,
      }}>&times;</button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingRight: 32 }}>
        <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 15, fontWeight: 700, color: 'var(--text-heading)' }}>{name}</span>
        <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 11, fontWeight: 600, color: badgeColor, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{badge}</span>
      </div>
      {subtitle && <div style={{ fontFamily: 'var(--font-alegreya)', fontSize: 13, fontStyle: 'italic', color: 'var(--text-dim)', marginTop: 2 }}>{subtitle}</div>}
      {description && (
        <div style={{ fontFamily: 'var(--font-alegreya)', fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5, marginTop: 8 }}>
          {isLong && !expanded ? description.slice(0, 120) + '...' : description}
          {isLong && (
            <button onClick={() => setExpanded(!expanded)} style={{ background: 'none', border: 'none', color: 'var(--accent-gold)', cursor: 'pointer', fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, marginLeft: 4 }}>
              {expanded ? 'show less' : 'show more'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function SeedForm({ fields, pillField, pillOptions, onSave, onCancel, selectField, selectOptions }) {
  const [values, setValues] = useState(() => {
    const init = {};
    fields.forEach(f => { init[f.key] = ''; });
    if (pillField) init[pillField.key] = pillField.defaultValue;
    if (selectField) init[selectField.key] = selectField.defaultValue;
    return init;
  });
  const set = (key, val) => setValues(prev => ({ ...prev, [key]: val }));
  const nameField = fields.find(f => f.required);
  const canSave = nameField ? values[nameField.key]?.trim() : true;

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: 8, padding: '16px 18px', marginBottom: 10 }}>
      {fields.map(f => f.type === 'textarea' ? (
        <textarea key={f.key} value={values[f.key]} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder} maxLength={f.maxLength || 1000} style={{
          width: '100%', minHeight: 70, background: 'var(--bg-main)', border: '1px solid var(--border-gold-faint)',
          borderRadius: 8, padding: 12, fontFamily: 'var(--font-alegreya)', fontSize: 16,
          color: 'var(--text-primary)', outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: 10,
        }} />
      ) : (
        <input key={f.key} type="text" value={values[f.key]} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder} style={{
          width: '100%', background: 'var(--bg-main)', border: '1px solid var(--border-gold-faint)',
          borderRadius: 8, padding: '10px 14px', fontFamily: 'var(--font-alegreya)', fontSize: 16,
          color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box', marginBottom: 10,
        }} />
      ))}
      {pillField && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
          {pillOptions.map(opt => (
            <button key={opt} onClick={() => set(pillField.key, opt)} style={{
              fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, fontWeight: 600,
              color: values[pillField.key] === opt ? 'var(--accent-gold)' : 'var(--text-muted)',
              background: values[pillField.key] === opt ? 'var(--bg-gold-light)' : 'transparent',
              border: `1px solid ${values[pillField.key] === opt ? 'var(--border-card)' : 'var(--border-gold-faint)'}`,
              borderRadius: 20, padding: '6px 14px', cursor: 'pointer', transition: 'all 0.15s',
            }}>{opt}</button>
          ))}
        </div>
      )}
      {selectField && selectOptions.length > 1 && (
        <div style={{ marginBottom: 10 }}>
          <select value={values[selectField.key]} onChange={e => set(selectField.key, e.target.value)} style={{
            width: '100%', background: 'var(--bg-main)', border: '1px solid var(--border-gold-faint)',
            borderRadius: 8, padding: '10px 14px', fontFamily: 'var(--font-alegreya-sans)', fontSize: 14,
            color: 'var(--text-primary)', outline: 'none',
          }}>
            {selectOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
      )}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
        <button onClick={() => { if (canSave) onSave(values); }} disabled={!canSave} style={{
          fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, fontWeight: 600,
          color: canSave ? 'var(--accent-gold)' : 'var(--text-dim)',
          background: 'none', border: 'none', cursor: canSave ? 'pointer' : 'default',
        }}>Save</button>
      </div>
    </div>
  );
}

function AdvancedSeedTab({ seedFactions, setSeedFactions, seedNpcs, setSeedNpcs }) {
  const [factionFormOpen, setFactionFormOpen] = useState(false);
  const [npcFormOpen, setNpcFormOpen] = useState(false);

  return (
    <div style={{ marginTop: 24 }}>
      <p style={{ fontFamily: 'var(--font-alegreya)', fontSize: 16, fontStyle: 'italic', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 32 }}>
        Your world will be fully populated whether you add anything here or not. This is for players who have specific characters, factions, or organizations they want baked in from the start.
      </p>

      {/* Factions */}
      <label style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>Factions</label>
      {seedFactions.map(f => (
        <SeedCard key={f.id} name={f.name} badge={f.disposition} badgeColor={dispositionColor(f.disposition)} description={f.description} onRemove={() => setSeedFactions(prev => prev.filter(x => x.id !== f.id))} />
      ))}
      {factionFormOpen ? (
        <SeedForm
          fields={[
            { key: 'name', placeholder: 'Faction name', required: true },
            { key: 'description', placeholder: "Who are they? What do they want? A name alone is enough.", type: 'textarea', maxLength: 1000 },
          ]}
          pillField={{ key: 'disposition', defaultValue: 'Unknown' }}
          pillOptions={FACTION_DISPOSITIONS}
          onSave={(vals) => {
            setSeedFactions(prev => [...prev, { id: crypto.randomUUID(), name: vals.name.trim(), description: vals.description?.trim() || '', disposition: vals.disposition }]);
            setFactionFormOpen(false);
          }}
          onCancel={() => setFactionFormOpen(false)}
        />
      ) : seedFactions.length < 3 && (
        <button onClick={() => setFactionFormOpen(true)} style={{
          fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: 'var(--text-muted)',
          background: 'transparent', border: '1px solid var(--border-gold-faint)', borderRadius: 8,
          padding: '10px 18px', cursor: 'pointer', width: '100%', textAlign: 'center',
        }}>+ Add Faction ({seedFactions.length} of 3)</button>
      )}

      {/* NPCs */}
      <label style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 12, marginTop: 32 }}>Characters</label>
      {seedNpcs.map(n => (
        <SeedCard key={n.id} name={n.name} badge={n.relationship} badgeColor={relationshipColor(n.relationship)} description={n.description} subtitle={n.faction && n.faction !== 'Unaffiliated' ? n.faction : null} onRemove={() => setSeedNpcs(prev => prev.filter(x => x.id !== n.id))} />
      ))}
      {npcFormOpen ? (
        <SeedForm
          fields={[
            { key: 'name', placeholder: 'Character name', required: true },
            { key: 'description', placeholder: "Who are they? What's their story? A name alone is enough.", type: 'textarea', maxLength: 1000 },
          ]}
          pillField={{ key: 'relationship', defaultValue: 'Neutral' }}
          pillOptions={NPC_RELATIONSHIPS}
          selectField={{ key: 'faction', defaultValue: 'Unaffiliated' }}
          selectOptions={['Unaffiliated', ...seedFactions.map(f => f.name)]}
          onSave={(vals) => {
            setSeedNpcs(prev => [...prev, { id: crypto.randomUUID(), name: vals.name.trim(), description: vals.description?.trim() || '', relationship: vals.relationship, faction: vals.faction || null }]);
            setNpcFormOpen(false);
          }}
          onCancel={() => setNpcFormOpen(false)}
        />
      ) : seedNpcs.length < 5 && (
        <button onClick={() => setNpcFormOpen(true)} style={{
          fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: 'var(--text-muted)',
          background: 'transparent', border: '1px solid var(--border-gold-faint)', borderRadius: 8,
          padding: '10px 18px', cursor: 'pointer', width: '100%', textAlign: 'center',
        }}>+ Add Character ({seedNpcs.length} of 5)</button>
      )}
    </div>
  );
}

function Phase2({ selected, onSelect, selectedWorld, customWorldText, selectedSnapshot, worldSnapshots, seedFactions, seedNpcs, onCardTap }) {
  const mainSettings = SETTINGS.filter(s => s.id !== 'custom');
  const customSetting = SETTINGS.find(s => s.id === 'custom');
  const yourWorldsItem = { id: 'your-worlds', name: 'Your Worlds' };

  // Summary text for configured cards
  const getCardSummary = (settingId) => {
    if (settingId === 'custom') {
      if (customWorldText) return customWorldText.length > 40 ? customWorldText.slice(0, 40) + '...' : customWorldText;
      return null;
    }
    if (settingId === 'your-worlds') {
      if (selectedSnapshot) {
        const snap = worldSnapshots.find(s => s.id === selectedSnapshot);
        return snap?.name || 'Selected';
      }
      return null;
    }
    // Era
    if (selected === settingId) {
      if (selectedWorld) {
        const pw = PREBUILT_WORLDS.find(w => w.id === selectedWorld);
        return pw?.name || 'Template selected';
      }
      return null;
    }
    return null;
  };

  const handleCardTap = (id) => {
    onSelect(id);
    if (id === 'custom') onCardTap('custom');
    else if (id === 'your-worlds') onCardTap('your-worlds');
    else onCardTap('era');
  };

  const seedCount = seedFactions.length + seedNpcs.length;

  return (
    <div>
      <PhaseTitle title="Choose Your Setting" subtitle="The world your story lives in. Pick one or build your own." />

      {/* Era grid */}
      <div className={styles.twoColGrid} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {mainSettings.map(s => {
          const summary = selected === s.id ? getCardSummary(s.id) : null;
          return (
            <SelectionCard key={s.id} item={s} selected={selected} onSelect={handleCardTap}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
                <IconBox name={s.icon} color={selected === s.id ? 'var(--accent-gold)' : 'var(--text-muted)'} />
                <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 17, fontWeight: 700, color: 'var(--text-heading)' }}>{s.name}</span>
              </div>
              <p style={{ fontFamily: 'var(--font-alegreya)', fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
              {summary && (
                <div style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: 'var(--accent-gold)', marginTop: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{summary}</div>
              )}
            </SelectionCard>
          );
        })}
      </div>

      {/* Custom + Your Worlds row */}
      <div className={styles.twoColGrid} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
        <SelectionCard item={customSetting} selected={selected} onSelect={handleCardTap}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <IconBox name={customSetting.icon} color={selected === 'custom' ? 'var(--accent-gold)' : 'var(--text-muted)'} />
            <div>
              <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 17, fontWeight: 700, color: 'var(--text-heading)' }}>{customSetting.name}</span>
              <p style={{ fontFamily: 'var(--font-alegreya)', fontSize: 15, color: 'var(--text-muted)', margin: '6px 0 0' }}>{customSetting.desc}</p>
              {selected === 'custom' && getCardSummary('custom') && (
                <div style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: 'var(--accent-gold)', marginTop: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getCardSummary('custom')}</div>
              )}
            </div>
          </div>
        </SelectionCard>

        <SelectionCard item={yourWorldsItem} selected={selected} onSelect={handleCardTap}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <IconBox name="your_worlds" color={selected === 'your-worlds' ? 'var(--accent-gold)' : 'var(--text-muted)'} />
            <div>
              <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 17, fontWeight: 700, color: 'var(--text-heading)' }}>Your Worlds</span>
              <p style={{ fontFamily: 'var(--font-alegreya)', fontSize: 15, color: 'var(--text-muted)', margin: '6px 0 0' }}>
                {worldSnapshots.length > 0 ? `${worldSnapshots.length} saved` : 'No saved worlds yet'}
              </p>
              {selected === 'your-worlds' && getCardSummary('your-worlds') && (
                <div style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: 'var(--accent-gold)', marginTop: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getCardSummary('your-worlds')}</div>
              )}
            </div>
          </div>
        </SelectionCard>
      </div>

      {/* Advanced: Factions & NPCs */}
      <button onClick={() => onCardTap('advanced')} className={styles.selectionCard} style={{
        width: '100%', marginTop: 16, padding: '14px 20px',
        display: 'flex', alignItems: 'center', gap: 14,
        background: 'transparent', border: '1px solid var(--border-gold-faint)',
        borderRadius: 8, cursor: 'pointer', minHeight: 44,
        transition: 'border-color 0.3s',
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: 'var(--text-muted)' }}>
          <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: 15, fontWeight: 700, color: 'var(--text-heading)' }}>Factions &amp; NPCs</div>
          <div style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Seed your world with specific characters and organizations</div>
        </div>
        {seedCount > 0 && (
          <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: 'var(--accent-gold)', flexShrink: 0 }}>{seedCount} added</span>
        )}
        <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 18, color: 'var(--text-dim)', flexShrink: 0 }}>&rsaquo;</span>
      </button>
    </div>
  );
}

function CharacterForm({ character, onChange }) {
  const personalityTraits = ['Bold', 'Cautious', 'Calculating', 'Impulsive', 'Charming', 'Blunt', 'Curious', 'Stoic', 'Idealistic', 'Cynical', 'Loyal', 'Ambitious', 'Compassionate', 'Stubborn', 'Patient', 'Hot-Headed', 'Quiet', 'Witty'];
  const pronounOptions = ['He / Him', 'She / Her', 'They / Them', 'Custom'];

  const inputStyle = {
    width: '100%', background: 'var(--bg-main)', border: '1px solid var(--border-gold-faint)',
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
                background: isActive ? 'var(--bg-gold-light)' : 'var(--bg-main)',
                border: `1px solid ${isActive ? 'var(--border-card-hover)' : 'var(--border-gold-faint)'}`,
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
                background: isActive ? 'var(--bg-gold-light)' : 'var(--bg-main)',
                border: `1px solid ${isActive ? 'var(--border-card-hover)' : 'var(--border-gold-faint)'}`,
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
  );
}

function ArchetypeCard({ archetype, isSelected, onSelect }) {
  return (
    <button
      onClick={() => onSelect(archetype.id)}
      style={{
        width: '100%', textAlign: 'left', cursor: 'pointer',
        background: isSelected ? 'var(--bg-gold-subtle)' : 'var(--bg-main)',
        border: `1px solid ${isSelected ? 'var(--border-card-hover)' : 'var(--border-gold-faint)'}`,
        borderRadius: 8, padding: '16px 20px',
        transition: 'all 0.3s',
      }}
    >
      <div style={{
        fontFamily: 'var(--font-cinzel)', fontSize: 17, fontWeight: 700,
        color: 'var(--text-heading)', marginBottom: 6,
      }}>{archetype.name}</div>
      <p style={{
        fontFamily: 'var(--font-alegreya)', fontSize: 14, color: 'var(--text-muted)',
        lineHeight: 1.5, margin: '0 0 10px 0',
      }}>{archetype.pitch}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {archetype.personality.map(trait => (
          <span key={trait} style={{
            fontFamily: 'var(--font-alegreya-sans)', fontSize: 12,
            color: 'var(--text-muted)', background: 'var(--bg-card)',
            border: '1px solid var(--border-primary)', borderRadius: 4,
            padding: '4px 10px',
          }}>{trait}</span>
        ))}
        <span style={{
          fontFamily: 'var(--font-alegreya-sans)', fontSize: 12,
          color: 'var(--text-dim)',
        }}>{archetype.stats.join(' \u00B7 ')}</span>
      </div>
    </button>
  );
}

function Phase3({ characterMode, hasArchetypes, selectedArchetype, availableArchetypes, archetypeChar, customChar, onCardTap }) {
  const selectedArch = selectedArchetype ? availableArchetypes.find(a => a.id === selectedArchetype) : null;

  return (
    <div>
      <PhaseTitle
        title="Create Your Character"
        subtitle={hasArchetypes
          ? "Choose a template to start from, or build entirely your own."
          : "Describe your character and the engine builds the rest."}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Archetype Path Card */}
        {hasArchetypes && (
          <button
            onClick={() => onCardTap('archetype')}
            style={{
              width: '100%', textAlign: 'left', cursor: 'pointer',
              background: characterMode === 'archetype' ? 'var(--bg-gold-subtle)' : 'var(--bg-card)',
              border: `1px solid ${characterMode === 'archetype' ? 'var(--border-card-hover)' : 'var(--border-gold-faint)'}`,
              borderRadius: 8, padding: '20px 24px',
              display: 'flex', alignItems: 'flex-start', gap: 16,
              transition: 'border-color 0.2s, background 0.2s',
            }}
          >
            <div style={{ flexShrink: 0, color: characterMode === 'archetype' ? 'var(--accent-gold)' : 'var(--text-muted)', marginTop: 2 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: 17, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 4 }}>Choose an Archetype</div>
              <div style={{ fontFamily: 'var(--font-alegreya)', fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.5 }}>Pre-built characters shaped for this era. Customize the details.</div>
              {selectedArch && (
                <div style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: 'var(--accent-gold)', marginTop: 8 }}>
                  {archetypeChar.name ? `${selectedArch.name} · ${archetypeChar.name}` : selectedArch.name}
                </div>
              )}
            </div>
            <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 18, color: 'var(--text-dim)', flexShrink: 0, marginTop: 2 }}>&rsaquo;</span>
          </button>
        )}

        {/* Full Custom Card */}
        <button
          onClick={() => onCardTap('custom')}
          style={{
            width: '100%', textAlign: 'left', cursor: 'pointer',
            background: (characterMode === 'custom' || !hasArchetypes) ? 'var(--bg-gold-subtle)' : 'var(--bg-card)',
            border: `1px solid ${(characterMode === 'custom' || !hasArchetypes) ? 'var(--border-card-hover)' : 'var(--border-gold-faint)'}`,
            borderRadius: 8, padding: '20px 24px',
            display: 'flex', alignItems: 'flex-start', gap: 16,
            transition: 'border-color 0.2s, background 0.2s',
          }}
        >
          <div style={{ flexShrink: 0, color: (characterMode === 'custom' || !hasArchetypes) ? 'var(--accent-gold)' : 'var(--text-muted)', marginTop: 2 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: 17, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 4 }}>{hasArchetypes ? 'Full Custom' : 'Create Your Character'}</div>
            <div style={{ fontFamily: 'var(--font-alegreya)', fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.5 }}>Start from a blank slate. Write as much or as little as you want.</div>
            {customChar.name && (
              <div style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: 'var(--accent-gold)', marginTop: 8 }}>
                {customChar.name}
              </div>
            )}
          </div>
          <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 18, color: 'var(--text-dim)', flexShrink: 0, marginTop: 2 }}>&rsaquo;</span>
        </button>
      </div>
    </div>
  );
}

function Phase4({ stats: initialStats, onStatsChange, skills, foundationalSkills, startingLoadout, factionStandings, innateTraits, softWarnings, hardErrors, onHardErrorsClear, skillRequests, onSkillRequestsChange, gearRequests, onGearRequestsChange, onRegenerate, regenerating }) {
  const [editing, setEditing] = useState(false);
  const [stats, setStats] = useState(initialStats);
  const [editingStatName, setEditingStatName] = useState(null);
  const [editInputValue, setEditInputValue] = useState('');

  // Re-sync internal stats when proposal data arrives (e.g. after retry)
  useEffect(() => {
    if (initialStats.length > 0) {
      setStats(initialStats);
    }
  }, [initialStats]);

  const hasDeviation = stats.some((s, i) => Math.abs(s.value - initialStats[i].value) > 2.0);

  const applyStatUpdate = (next) => {
    if (onStatsChange) onStatsChange(next);
    if (onHardErrorsClear) onHardErrorsClear();
  };

  const handleStatChange = (name, delta) => {
    setStats(prev => {
      const next = prev.map(s => {
        if (s.name !== name) return s;
        const newVal = Math.min(20.0, Math.max(1.0, Math.round((s.value + delta) * 10) / 10));
        return { ...s, value: newVal };
      });
      applyStatUpdate(next);
      return next;
    });
  };

  const handleStatDirectEdit = (name, rawValue) => {
    const parsed = parseFloat(rawValue);
    if (isNaN(parsed)) { setEditingStatName(null); return; }
    const clamped = Math.min(20.0, Math.max(1.0, Math.round(parsed * 2) / 2));
    setStats(prev => {
      const next = prev.map(s => {
        if (s.name !== name) return s;
        return { ...s, value: clamped };
      });
      applyStatUpdate(next);
      return next;
    });
    setEditingStatName(null);
  };

  const formatTraitName = (trait) => {
    return trait.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const getTier = (val) => {
    if (val >= 21) return 'Ascendant';
    if (val >= 16) return 'Peak Mortal';
    if (val >= 11) return 'Elite';
    if (val >= 6) return 'Professional';
    if (val >= 3) return 'Gifted Beginner';
    return 'Novice';
  };

  const statTotal = stats.reduce((sum, s) => sum + s.value, 0);

  return (
    <div>
      <PhaseTitle title="Your Attributes" subtitle="Derived from your backstory. These are who you are." />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{
          fontFamily: 'var(--font-jetbrains)', fontSize: 13,
          color: 'var(--text-muted)',
        }}>
          Total: <span style={{ color: 'var(--text-heading)', fontWeight: 500 }}>{statTotal.toFixed(1)}</span>
        </div>
        <button onClick={() => setEditing(!editing)} className={styles.adjustBtn} style={{
          fontFamily: 'var(--font-cinzel)', fontSize: 12, fontWeight: 700,
          color: editing ? 'var(--bg-main)' : 'var(--text-secondary)', letterSpacing: '0.08em',
          background: editing ? 'linear-gradient(135deg, var(--accent-gold), var(--accent-bright))' : 'transparent',
          border: `1px solid ${editing ? 'transparent' : 'var(--border-primary)'}`,
          borderRadius: 5, padding: '9px 24px',
        }}>{editing ? 'LOCK' : 'ADJUST'}</button>
      </div>

      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 10, padding: '8px 0',
        marginBottom: 20,
      }}>
        {stats.map((s, i) => {
          const pct = (s.value / 20) * 100;
          const changed = Math.abs(s.value - initialStats[i].value) > 0.05;
          const delta = s.value - initialStats[i].value;
          return (
            <div key={s.name} style={{
              padding: '16px 24px',
              borderBottom: i < stats.length - 1 ? '1px solid var(--border-primary)' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{s.emoji}</span>
                <span style={{
                  fontFamily: 'var(--font-cinzel)', fontSize: 15, fontWeight: 700,
                  color: 'var(--text-heading)', flex: 1,
                }}>{s.name}</span>
                <span style={{
                  fontFamily: 'var(--font-alegreya-sans)', fontSize: 12,
                  color: 'var(--text-muted)', fontStyle: 'italic', marginRight: 8,
                }}>{getTier(s.value)}</span>

                {editing ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 0, width: 168, flexShrink: 0, justifyContent: 'flex-end' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <button onClick={() => handleStatChange(s.name, -0.5)} className={styles.statStepBtn} style={{
                        width: 32, height: 32, borderRadius: '6px 0 0 6px',
                        background: '#0d1120', border: '1px solid var(--border-primary)',
                        color: 'var(--text-secondary)', fontSize: 18, fontWeight: 700,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>{'\u2212'}</button>
                      {editingStatName === s.name ? (
                        <input
                          type="text"
                          value={editInputValue}
                          onChange={e => setEditInputValue(e.target.value)}
                          onBlur={() => handleStatDirectEdit(s.name, editInputValue)}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleStatDirectEdit(s.name, editInputValue); } if (e.key === 'Escape') setEditingStatName(null); }}
                          autoFocus
                          style={{
                            width: 56, height: 32, textAlign: 'center',
                            background: 'var(--bg-main)', borderTop: '1px solid var(--accent-gold)', borderBottom: '1px solid var(--accent-gold)',
                            borderLeft: 'none', borderRight: 'none', outline: 'none',
                            fontFamily: 'var(--font-jetbrains)', fontSize: 15, fontWeight: 500,
                            color: 'var(--accent-gold)', boxSizing: 'border-box',
                          }}
                        />
                      ) : (
                        <div
                          onClick={() => { setEditingStatName(s.name); setEditInputValue(s.value.toFixed(1)); }}
                          style={{
                            width: 56, height: 32,
                            background: 'var(--bg-main)', borderTop: '1px solid var(--border-primary)', borderBottom: '1px solid var(--border-primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: 'var(--font-jetbrains)', fontSize: 15, fontWeight: 500,
                            color: changed ? 'var(--accent-gold)' : 'var(--text-heading)',
                            cursor: 'text',
                          }}>{s.value.toFixed(1)}</div>
                      )}
                      <button onClick={() => handleStatChange(s.name, 0.5)} className={styles.statStepBtn} style={{
                        width: 32, height: 32, borderRadius: '0 6px 6px 0',
                        background: '#0d1120', border: '1px solid var(--border-primary)',
                        color: 'var(--text-secondary)', fontSize: 18, fontWeight: 700,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>+</button>
                    </div>
                    <span style={{
                      fontFamily: 'var(--font-jetbrains)', fontSize: 11,
                      color: delta > 0 ? 'var(--color-success)' : 'var(--color-danger)',
                      width: 44, textAlign: 'right',
                      visibility: changed ? 'visible' : 'hidden',
                    }}>{delta > 0 ? '+' : ''}{delta.toFixed(1)}</span>
                  </div>
                ) : (
                  <span style={{
                    fontFamily: 'var(--font-jetbrains)', fontSize: 17, fontWeight: 500,
                    color: 'var(--text-heading)', minWidth: 40, textAlign: 'right',
                  }}>{s.value.toFixed(1)}</span>
                )}
              </div>

              <div style={{ height: 8, background: 'var(--bg-main)', borderRadius: 4, overflow: 'hidden', marginLeft: 34 }}>
                {editing && changed ? (
                  <div style={{ position: 'relative', height: '100%' }}>
                    <div style={{
                      position: 'absolute', top: 0, left: 0,
                      height: '100%', width: `${(initialStats[i].value / 20) * 100}%`,
                      background: 'var(--border-primary)', borderRadius: 4,
                    }} />
                    <div style={{
                      position: 'absolute', top: 0, left: 0,
                      height: '100%', width: `${pct}%`, borderRadius: 4,
                      background: 'linear-gradient(90deg, #7082a4, #c9a84c)',
                      transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    }} />
                  </div>
                ) : (
                  <div style={{
                    height: '100%', width: `${pct}%`, borderRadius: 4,
                    background: 'linear-gradient(90deg, #7082a4, #c9a84c)',
                    transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                  }} />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Hard Errors */}
      {hardErrors && hardErrors.length > 0 && (
        <div style={{
          padding: '14px 18px', marginBottom: 14,
          background: '#1a1214', border: '1px solid #4a2020', borderRadius: 8,
          fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#e85a5a', lineHeight: 1.6,
        }}>
          {hardErrors.map((err, i) => (
            <div key={i}>{err}</div>
          ))}
        </div>
      )}

      {/* Soft Warnings */}
      {softWarnings && softWarnings.length > 0 && (
        <div style={{
          padding: '14px 18px', marginBottom: 14,
          background: '#1a1710', border: '1px solid #3a3020', borderRadius: 8,
          fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#e8a04a', lineHeight: 1.6,
        }}>
          {softWarnings.map((warn, i) => (
            <div key={i}>{warn}</div>
          ))}
        </div>
      )}

      {/* Innate Traits */}
      {innateTraits && innateTraits.length > 0 && (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 6, padding: '10px 16px',
          fontFamily: 'var(--font-alegreya-sans)', fontSize: 15, color: 'var(--text-muted)', marginBottom: 10,
        }}>
          <div style={{ color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 6 }}>Innate Traits</div>
          {innateTraits.map((t, i) => {
            const hasPenalty = t.penalty != null;
            const hasDetail = t.effect || t.value != null || hasPenalty || t.stat;
            return (
              <div key={i} style={{ padding: '4px 0', borderBottom: i < innateTraits.length - 1 ? '1px solid var(--border-card-separator)' : 'none' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ color: hasPenalty ? '#e8a04a' : 'var(--text-heading)', fontWeight: 500 }}>{formatTraitName(t.trait)}</span>
                  <span style={{ color: 'var(--text-dim)', fontSize: 12, fontStyle: 'italic' }}>{t.source}</span>
                </div>
                {hasDetail && (
                  <div style={{ fontSize: 13, color: hasPenalty ? '#e8a04a' : 'var(--text-dim)', marginTop: 2, paddingLeft: 2 }}>
                    {t.effect && <span>{t.effect.replace(/_/g, ' ')}</span>}
                    {t.value != null && <span>{t.effect ? ': ' : ''}{t.value > 0 ? '+' : ''}{t.value}</span>}
                    {hasPenalty && <span>{t.effect ? ': ' : ''}{t.penalty}</span>}
                    {t.stat && <span> ({t.stat})</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Skills */}
      {foundationalSkills && foundationalSkills.length > 0 && (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 6, padding: '10px 16px',
          fontFamily: 'var(--font-alegreya-sans)', fontSize: 15, color: 'var(--text-muted)', marginBottom: 10,
        }}>
          <div style={{ color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 6 }}>Skills</div>
          {foundationalSkills.map((fs, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '2px 0' }}>
              <span style={{ color: 'var(--text-heading)' }}>{fs.name || fs.scope}</span>
              {fs.modifier != null && (
                <span style={{ color: 'var(--accent-gold)', fontSize: 14, fontFamily: 'var(--font-jetbrains)', fontWeight: 600 }}>+{Number(fs.modifier).toFixed(1)}</span>
              )}
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>({fs.breadthCategory})</span>
              <span style={{ color: 'var(--accent-gold)', fontSize: 12, fontFamily: 'var(--font-jetbrains)' }}>{fs.stat}</span>
            </div>
          ))}
        </div>
      )}

      {/* Starting Loadout */}
      {startingLoadout && startingLoadout.length > 0 && (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 6, padding: '10px 16px',
          fontFamily: 'var(--font-alegreya-sans)', fontSize: 15, color: 'var(--text-muted)', marginBottom: 10,
        }}>
          <div style={{ color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 6 }}>Starting Loadout</div>
          {startingLoadout.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0' }}>
              <span style={{ color: 'var(--text-heading)' }}>{item.name}</span>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 12, color: 'var(--text-muted)' }}>{item.slotCost} slots</span>
                <span style={{ fontSize: 12, color: 'var(--text-dim)', fontStyle: 'italic' }}>{item.materialQuality}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Faction Standings */}
      {factionStandings && factionStandings.length > 0 && (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 6, padding: '10px 16px',
          fontFamily: 'var(--font-alegreya-sans)', fontSize: 15, color: 'var(--text-muted)', marginBottom: 10,
        }}>
          <div style={{ color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 6 }}>Faction Standings</div>
          {factionStandings.map((fs, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
              <span style={{ color: 'var(--text-heading)' }}>{fs.factionName}</span>
              <span style={{
                fontFamily: 'var(--font-jetbrains)', fontSize: 13,
                color: fs.standing > 0 ? 'var(--color-success)' : fs.standing < 0 ? 'var(--color-danger)' : 'var(--text-secondary)',
              }}>
                {fs.standing > 0 ? '+' : ''}{fs.standing}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Inventory Slots */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 6, padding: '10px 16px',
        fontFamily: 'var(--font-alegreya-sans)', fontSize: 15, color: 'var(--text-muted)',
      }}>
        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Inventory Slots: </span>
        {(stats.find(s => s.name === 'Strength')?.value || 6.5) + 5} (STR {stats.find(s => s.name === 'Strength')?.value.toFixed(1)} + 5)
      </div>

      {editing && hasDeviation && (
        <div style={{
          marginTop: 16, padding: '14px 18px',
          background: '#17171d',
          border: '1px solid #362b24',
          borderRadius: 8,
          fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#e8a04a',
          lineHeight: 1.6,
        }}>
          Some stats have changed significantly from what your backstory suggests. The engine may ask you to adjust your backstory to match, or it will adapt the stats to fit.
        </div>
      )}

      {editing && !hasDeviation && (
        <p style={{
          fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: 'var(--text-muted)',
          marginTop: 16, lineHeight: 1.6,
        }}>
          Use +/- buttons or click a value to type directly. Stats must be between 1.0 and 20.0. Inventory slots update with Strength.
        </p>
      )}

      <div style={{
        marginTop: 28, padding: '24px 24px 20px',
        background: 'var(--bg-gold-faint)',
        border: '1px solid var(--border-gold-faint)',
        borderRadius: 10,
      }}>
        <h3 style={{
          fontFamily: 'var(--font-cinzel)', fontSize: 19, fontWeight: 700,
          color: 'var(--text-heading)', marginBottom: 6,
        }}>Requests</h3>
        <p style={{
          fontFamily: 'var(--font-alegreya-sans)', fontSize: 15, color: 'var(--text-muted)',
          margin: '0 0 20px 0', lineHeight: 1.5,
        }}>Optional. Describe what you'd like, then regenerate to get an updated proposal.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={{
              fontFamily: 'var(--font-alegreya-sans)', fontSize: 15, fontWeight: 600,
              color: 'var(--text-secondary)', display: 'block', marginBottom: 8,
            }}>Skills</label>
            <textarea value={skillRequests} onChange={e => onSkillRequestsChange(e.target.value)} placeholder='Any skills you want to start with? e.g. "I want to be good with a bow" or "Some kind of healing ability"' rows={2} className={styles.wizardInput} style={{
              width: '100%', background: 'var(--bg-main)', border: '1px solid var(--border-gold-subtle)',
              borderRadius: 8, padding: 14, fontFamily: 'var(--font-alegreya)', fontSize: 16,
              color: 'var(--text-primary)', outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6,
            }} />
          </div>
          <div>
            <label style={{
              fontFamily: 'var(--font-alegreya-sans)', fontSize: 15, fontWeight: 600,
              color: 'var(--text-secondary)', display: 'block', marginBottom: 8,
            }}>Starting Gear</label>
            <textarea value={gearRequests} onChange={e => onGearRequestsChange(e.target.value)} placeholder='Anything specific you want to carry? e.g. "An old family sword" or "A leather journal with strange symbols"' rows={2} className={styles.wizardInput} style={{
              width: '100%', background: 'var(--bg-main)', border: '1px solid var(--border-gold-subtle)',
              borderRadius: 8, padding: 14, fontFamily: 'var(--font-alegreya)', fontSize: 16,
              color: 'var(--text-primary)', outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6,
            }} />
          </div>
        </div>

        <button
          onClick={onRegenerate}
          disabled={regenerating || (!skillRequests.trim() && !gearRequests.trim())}
          className={styles.adjustBtn}
          style={{
            marginTop: 18, width: '100%', padding: '12px 24px',
            fontFamily: 'var(--font-cinzel)', fontSize: 13, fontWeight: 700,
            letterSpacing: '0.08em',
            color: regenerating || (!skillRequests.trim() && !gearRequests.trim()) ? 'var(--text-dim)' : 'var(--accent-gold)',
            background: 'transparent',
            border: `1px solid ${regenerating || (!skillRequests.trim() && !gearRequests.trim()) ? 'var(--border-gold-faint)' : 'var(--border-card)'}`,
            borderRadius: 5,
            cursor: regenerating || (!skillRequests.trim() && !gearRequests.trim()) ? 'default' : 'pointer',
          }}
        >
          {regenerating ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <svg width="16" height="16" viewBox="0 0 16 16" style={{ animation: 'spin 0.9s linear infinite' }}>
                <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                <path d="M8 2 A6 6 0 0 1 14 8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              REGENERATING...
            </span>
          ) : 'REGENERATE PROPOSAL'}
        </button>
      </div>
    </div>
  );
}

// ─── Difficulty Dial Controls (local to init page) ───

function SliderDial({ label, description, value, min, max, step, format, onChange }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 14, color: 'var(--accent-gold)' }}>{format(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: 'var(--accent-gold)', cursor: 'pointer' }} />
      <div style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: 'var(--text-dim)', marginTop: 4 }}>{description}</div>
    </div>
  );
}

function ToggleDial({ label, description, checked, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, minHeight: 44 }}>
      <button onClick={() => onChange(!checked)} aria-pressed={checked} style={{
        width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', padding: 0,
        background: checked ? 'var(--accent-gold)' : 'var(--border-primary)',
        position: 'relative', flexShrink: 0, transition: 'background 0.2s',
      }}>
        <span style={{
          position: 'absolute', top: 2, left: checked ? 18 : 2,
          width: 16, height: 16, borderRadius: '50%', background: '#fff',
          transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }} />
      </button>
      <div style={{ flex: 1 }}>
        <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: 'var(--text-dim)', marginLeft: 8 }}>{description}</span>
      </div>
    </div>
  );
}

function SelectorDial({ label, description, options, value, onChange }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {options.map(opt => (
          <button key={opt.value} onClick={() => onChange(opt.value)} style={{
            fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, fontWeight: 600,
            color: value === opt.value ? 'var(--accent-gold)' : 'var(--text-muted)',
            background: value === opt.value ? 'var(--bg-gold-light)' : 'transparent',
            border: `1px solid ${value === opt.value ? 'var(--border-card)' : 'var(--border-primary)'}`,
            borderRadius: 20, padding: '8px 18px', cursor: 'pointer',
            letterSpacing: '0.06em', textTransform: 'uppercase', transition: 'all 0.2s',
            minHeight: 44,
          }}>{opt.label}</button>
        ))}
      </div>
      <div style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: 'var(--text-dim)', marginTop: 6 }}>{description}</div>
    </div>
  );
}

function Phase5({ selected, onSelect, difficultyTab, setDifficultyTab, dialOverrides, setDialOverrides }) {
  // Get current dial values: overrides if set, else preset defaults, else standard
  const currentDials = dialOverrides || PRESET_DIALS[selected] || PRESET_DIALS.standard;

  const handleDialChange = (key, value) => {
    const base = dialOverrides || { ...(PRESET_DIALS[selected] || PRESET_DIALS.standard) };
    setDialOverrides({ ...base, [key]: value });
  };

  // Check if overrides match any preset
  const isCustom = dialOverrides !== null;

  return (
    <div>
      <PhaseTitle title="Select Difficulty" subtitle="How hard should the world push back?" />

      {/* Tab bar — same pill style as Phase 2 */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
        {[{ id: 'difficulty', label: 'Difficulty' }, { id: 'advanced', label: 'Advanced' }].map(tab => (
          <button key={tab.id} onClick={() => setDifficultyTab(tab.id)} style={{
            fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, fontWeight: 600,
            color: difficultyTab === tab.id ? 'var(--accent-gold)' : 'var(--text-muted)',
            background: difficultyTab === tab.id ? 'var(--bg-gold-light)' : 'transparent',
            border: `1px solid ${difficultyTab === tab.id ? 'var(--border-card)' : 'var(--border-primary)'}`,
            borderRadius: 20, padding: '8px 20px', cursor: 'pointer',
            letterSpacing: '0.08em', textTransform: 'uppercase', transition: 'all 0.2s',
          }}>{tab.label}</button>
        ))}
      </div>

      {/* Difficulty tab — preset cards */}
      {difficultyTab === 'difficulty' && (
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {DIFFICULTIES.map(d => (
              <SelectionCard key={d.id} item={d} selected={isCustom ? null : selected} onSelect={onSelect}>
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
          {isCustom && (
            <p style={{ fontFamily: 'var(--font-alegreya)', fontSize: 14, fontStyle: 'italic', color: 'var(--text-dim)', textAlign: 'center', marginTop: 12 }}>
              Custom settings active — select a preset to reset
            </p>
          )}
        </div>
      )}

      {/* Advanced tab — individual dials */}
      {difficultyTab === 'advanced' && (
        <div>
          <p style={{ fontFamily: 'var(--font-alegreya)', fontSize: 16, fontStyle: 'italic', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 24 }}>
            These settings are pre-configured by your difficulty preset. Adjust individual dials here if you want finer control. You can also change these at any time during play.
          </p>

          <SliderDial label="DC Offset" description="Flat modifier applied to all difficulty checks"
            value={currentDials.dcOffset} min={-4} max={6} step={1}
            format={v => v >= 0 ? `+${v}` : `${v}`}
            onChange={v => handleDialChange('dcOffset', v)} />

          <SliderDial label="Progression Speed" description="Multiplier on stat and skill gains"
            value={currentDials.progressionSpeed} min={0.25} max={3} step={0.25}
            format={v => `${v}x`}
            onChange={v => handleDialChange('progressionSpeed', v)} />

          <SelectorDial label="Encounter Pressure" description="Frequency and tension of encounters"
            options={[{ value: 'low', label: 'Low' }, { value: 'standard', label: 'Standard' }, { value: 'high', label: 'High' }]}
            value={currentDials.encounterPressure}
            onChange={v => handleDialChange('encounterPressure', v)} />

          <ToggleDial label="Survival" description="Track rations, water, and malnourishment"
            checked={currentDials.survivalEnabled}
            onChange={v => handleDialChange('survivalEnabled', v)} />

          <ToggleDial label="Durability" description="Items degrade with use and need repair"
            checked={currentDials.durabilityEnabled}
            onChange={v => handleDialChange('durabilityEnabled', v)} />

          <ToggleDial label="Fortune's Balance" description="Outmatched/Matched/Dominant dice selection"
            checked={currentDials.fortunesBalanceEnabled}
            onChange={v => handleDialChange('fortunesBalanceEnabled', v)} />

          <ToggleDial label="Simplified Outcomes" description="Binary pass/fail instead of 6-tier results"
            checked={currentDials.simplifiedOutcomes}
            onChange={v => handleDialChange('simplifiedOutcomes', v)} />
        </div>
      )}
    </div>
  );
}

function Phase6({ scenario, setScenario, customStartText, setCustomStartText, scenariosLoading, displayScenarios, scenarioAlts, scenarioView, setScenarioView, refreshingScenario, onRefreshScenario }) {
  const getActiveScenario = (s) => {
    if (scenarioView[s.key] === 'alt' && scenarioAlts[s.key]) return scenarioAlts[s.key];
    return s;
  };

  return (
    <div>
      <PhaseTitle title="Your Opening Scene" subtitle="How does your story begin?" />

      <label style={{
        fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, fontWeight: 600,
        color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase',
        display: 'block', marginBottom: 14,
      }}>Starting Scenario</label>

      {scenariosLoading ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <div style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 17, color: 'var(--accent-gold)' }}>
            Generating scenarios...
          </div>
          <div style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: 'var(--text-muted)', marginTop: 10 }}>
            Crafting opening scenes for your adventure
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {displayScenarios.map(s => {
            const active = getActiveScenario(s);
            const hasAlt = !!scenarioAlts[s.key];
            const isRefreshing = refreshingScenario === s.key;
            const showRefresh = s.key !== 'D' && !hasAlt && !isRefreshing;

            return (
              <SelectionCard key={s.key} item={s} selected={scenario} onSelect={setScenario}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <IconBox name={active.icon || s.icon} color={scenario === s.key ? 'var(--accent-gold)' : 'var(--text-muted)'} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
                      <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 15, fontWeight: 700, color: 'var(--accent-gold)' }}>{SCENARIOS.find(x => x.key === s.key)?.name || s.name}</span>
                      <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 17, fontWeight: 600, color: 'var(--text-heading)' }}>{active.name}</span>
                    </div>
                    <p style={{ fontFamily: 'var(--font-alegreya)', fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>{active.desc}</p>

                    {/* Try another / Generating */}
                    {showRefresh && (
                      <div style={{ textAlign: 'right', marginTop: 8 }}>
                        <button onClick={(e) => { e.stopPropagation(); onRefreshScenario(s.key); }} style={{
                          fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: 'var(--text-dim)',
                          background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.15s',
                        }} onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent-gold)'; }} onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-dim)'; }}>
                          {'\u21BB'} try another
                        </button>
                      </div>
                    )}
                    {isRefreshing && (
                      <div style={{ textAlign: 'right', marginTop: 8, fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: 'var(--text-dim)' }}>
                        Generating...
                      </div>
                    )}

                    {/* Dot indicators for original/alt */}
                    {hasAlt && (
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12 }}>
                        {['original', 'alt'].map(view => (
                          <button key={view} onClick={(e) => { e.stopPropagation(); setScenarioView(prev => ({ ...prev, [s.key]: view })); }} style={{
                            width: 8, height: 8, borderRadius: '50%', padding: 0, border: 'none', cursor: 'pointer',
                            background: (scenarioView[s.key] || 'original') === view ? 'var(--accent-gold)' : 'var(--border-card)',
                            transition: 'background 0.2s',
                          }} aria-label={`View ${view} scenario`} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </SelectionCard>
            );
          })}
        </div>
      )}

      {scenario === 'D' && !scenariosLoading && (
        <textarea value={customStartText} onChange={e => setCustomStartText(e.target.value)} placeholder="Describe how your story begins..." className={styles.wizardInput} style={{
          width: '100%', minHeight: 90, marginTop: 14, background: 'var(--bg-main)', border: '1px solid var(--border-gold-faint)',
          borderRadius: 8, padding: 16, fontFamily: 'var(--font-alegreya)', fontSize: 16,
          color: 'var(--text-primary)', outline: 'none', resize: 'vertical', boxSizing: 'border-box',
        }} />
      )}
    </div>
  );
}

// --- PHASE MODAL ---

function PhaseModal({ children, bottomNav, header }) {
  const scrollRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Scroll to top whenever children change
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [children]);

  if (!mounted) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10,
        background: 'rgba(10, 14, 26, 0.85)',
      }} />
      {/* Modal card */}
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 11,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        pointerEvents: 'none',
      }}>
        <div className={styles.phaseModalCard} style={{
          pointerEvents: 'auto',
          background: 'var(--bg-main)',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Pinned header */}
          {header && (
            <div style={{
              flexShrink: 0,
              padding: '24px 36px 0',
              background: 'var(--bg-main)',
            }}>
              {header}
            </div>
          )}
          {/* Scrollable content */}
          <div ref={scrollRef} style={{
            flex: 1,
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            padding: '40px 36px 32px',
            minHeight: 0,
          }}>
            {children}
          </div>
          {/* Pinned bottom nav */}
          {bottomNav && (
            <div style={{
              borderTop: '1px solid var(--border-gold-faint)',
              padding: '16px 28px',
              background: 'var(--bg-main)',
              flexShrink: 0,
            }}>
              {bottomNav}
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}

// --- FIELD MODAL ---

function FieldModal({ title, children, onClose, footer }) {
  const scrollRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 20,
      opacity: mounted ? 1 : 0,
      transition: 'opacity 150ms ease',
    }}>
      {/* Backdrop — click to close */}
      <div onClick={onClose} style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(10, 14, 26, 0.7)',
      }} />
      {/* Centering container */}
      <div className={styles.fieldModalPosition} style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        pointerEvents: 'none',
      }}>
        <div className={styles.fieldModalCard} style={{
          pointerEvents: 'auto',
          background: 'var(--bg-main)',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Title bar */}
          {title && (
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '20px 28px 16px',
              borderBottom: '1px solid var(--border-gold-faint)',
              flexShrink: 0,
            }}>
              <span style={{
                fontFamily: 'var(--font-cinzel)', fontSize: 16, fontWeight: 700,
                color: 'var(--text-heading)',
              }}>{title}</span>
              <button onClick={onClose} style={{
                background: 'none', border: 'none', padding: 8, cursor: 'pointer',
                color: 'var(--text-muted)', fontSize: 18, lineHeight: 1,
              }}>{'\u2715'}</button>
            </div>
          )}
          {/* Scrollable content */}
          <div ref={scrollRef} style={{
            flex: 1,
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            padding: '24px 28px 28px',
            minHeight: 0,
          }}>
            {children}
          </div>
          {/* Optional footer */}
          {footer && (
            <div style={{
              borderTop: '1px solid var(--border-gold-faint)',
              padding: '14px 28px',
              background: 'var(--bg-main)',
              flexShrink: 0,
            }}>
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// --- MAIN ---

function InitWizardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlGameId = searchParams.get('gameId') || searchParams.get('id');
  const [createdGameId, setCreatedGameId] = useState(null);
  const gameId = urlGameId || createdGameId;

  // Playtester gate
  useEffect(() => {
    const user = api.getUser();
    if (user && !user.isPlaytester) router.replace('/');
  }, [router]);

  // --- Lexie Readable ---
  const [displayFont, setDisplayFont] = useState('alegreya');
  useEffect(() => {
    setDisplayFont(loadDisplayFont());
    const handleChange = () => setDisplayFont(loadDisplayFont());
    window.addEventListener('display-settings-changed', handleChange);
    window.addEventListener('storage', (e) => { if (e.key === DISPLAY_SETTINGS_KEY) handleChange(); });
    return () => {
      window.removeEventListener('display-settings-changed', handleChange);
      window.removeEventListener('storage', handleChange);
    };
  }, []);
  const isLexie = displayFont === 'lexie';
  const lexieVars = isLexie ? {
    '--font-alegreya': "'Lexie Readable', sans-serif",
    '--font-alegreya-sans': "'Lexie Readable', sans-serif",
    '--font-jetbrains': "'Lexie Readable', sans-serif",
  } : {};

  // --- Core wizard state ---
  const [phase, setPhase] = useState(0);
  const [storyteller, setStoryteller] = useState(null);
  const [customStorytellerText, setCustomStorytellerText] = useState('');
  const [setting, setSetting] = useState(null);
  const [settingAnswers, setSettingAnswers] = useState({});
  const [selectedWorld, setSelectedWorld] = useState(null);
  const [expandedWorld, setExpandedWorld] = useState(null);
  const [worldSnapshots, setWorldSnapshots] = useState([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);
  const [customWorldText, setCustomWorldText] = useState('');
  const [anythingElseText, setAnythingElseText] = useState('');
  const [settingTab, setSettingTab] = useState('world');
  const [fieldModalOpen, setFieldModalOpen] = useState(null); // null | 'era' | 'custom' | 'your-worlds' | 'advanced'
  const [seedFactions, setSeedFactions] = useState([]);
  const [seedNpcs, setSeedNpcs] = useState([]);
  const [archetypeChar, setArchetypeChar] = useState({ name: '', backstory: '', personality: '', personalityCustom: '', appearance: '', pronouns: '', customPronouns: '', genderIdentity: '' });
  const [customChar, setCustomChar] = useState({ name: '', backstory: '', personality: '', personalityCustom: '', appearance: '', pronouns: '', customPronouns: '', genderIdentity: '' });
  const [selectedArchetype, setSelectedArchetype] = useState(null);
  const [characterMode, setCharacterMode] = useState('archetype');
  const [charFieldModal, setCharFieldModal] = useState(null); // null | 'archetype' | 'custom'

  // Derived: available archetypes for current setting
  const archetypeEra = setting === 'custom' ? null
    : setting === 'your-worlds' ? (selectedSnapshot ? worldSnapshots.find(s => s.id === selectedSnapshot)?.settingType : null)
    : setting;
  const availableArchetypes = archetypeEra ? (ARCHETYPES[archetypeEra] || []) : [];
  const hasArchetypes = availableArchetypes.length > 0;

  const [difficulty, setDifficulty] = useState(null);
  const [difficultyTab, setDifficultyTab] = useState('difficulty');
  const [dialOverrides, setDialOverrides] = useState(null);
  const [scenario, setScenario] = useState(null);
  const [customStartText, setCustomStartText] = useState('');
  const [scenarioAlts, setScenarioAlts] = useState({});
  const [scenarioView, setScenarioView] = useState({});
  const [refreshingScenario, setRefreshingScenario] = useState(null);

  // --- API interaction state ---
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const confirmBypassRef = useRef(false);
  const [error, setError] = useState(null);
  const [transitionPhase, setTransitionPhase] = useState(null);
  const [transitionFading, setTransitionFading] = useState(false);
  const [modalFading, setModalFading] = useState(false);
  const [loreIndex, setLoreIndex] = useState(0);
  const [loreFade, setLoreFade] = useState(true);
  const [worldGenStatus, setWorldGenStatus] = useState(null); // null, 'generating', 'complete', 'error', 'timeout'
  const [worldGenName, setWorldGenName] = useState(null);
  const [worldGenPhase, setWorldGenPhase] = useState(null); // e.g. 'generating_factions'
  const worldGenTimestamps = useRef({});
  const [proposalLoading, setProposalLoading] = useState(false);
  const [proposal, setProposal] = useState(null);
  const [adjustedStats, setAdjustedStats] = useState(null);
  const [proposalValidation, setProposalValidation] = useState({ hardErrors: [], softWarnings: [] });
  const [skillRequests, setSkillRequests] = useState('');
  const [gearRequests, setGearRequests] = useState('');
  const [requestsRegenerated, setRequestsRegenerated] = useState(true);
  const [scenariosLoading, setScenariosLoading] = useState(false);
  const [scenarioCache, setScenarioCache] = useState({});
  const [proposalFailed, setProposalFailed] = useState(false);
  const [scenariosFailed, setScenariosFailed] = useState(false);
  const worldPollCount = useRef(0);
  const worldPollRef = useRef(null);
  const worldGenStatusRef = useRef(null);

  // --- Character→Attributes combined overlay ---
  const [charOverlayActive, setCharOverlayActive] = useState(false);
  const [charOverlayFading, setCharOverlayFading] = useState(false);
  const [overlayLabel, setOverlayLabel] = useState('YOUR WORLD');
  const [overlaySecondary, setOverlaySecondary] = useState('');
  const [overlayLore, setOverlayLore] = useState('');
  const [overlayLoreFade, setOverlayLoreFade] = useState(true);
  const charOverlayAbortRef = useRef(false);
  const proposalResultRef = useRef({ done: false, failed: false });

  // Keep worldGenStatusRef in sync with state so polling promises can read it
  useEffect(() => { worldGenStatusRef.current = worldGenStatus; }, [worldGenStatus]);

  // Scroll to top whenever the wizard phase changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [phase]);

  // Auto-open Custom FieldModal when entering Phase 2 with no archetypes
  useEffect(() => {
    if (phase === 2 && !hasArchetypes) {
      setCharacterMode('custom');
      setCharFieldModal('custom');
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Connection state ---
  const [connectionFailed, setConnectionFailed] = useState(false);
  const [retrying, setRetrying] = useState(false);

  // --- Create game on mount if no gameId in URL ---
  useEffect(() => {
    if (urlGameId || createdGameId) return;
    const createGame = async () => {
      try {
        const res = await api.post('/api/games/new', {});
        if (res.id || res.gameId) {
          setCreatedGameId(res.id || res.gameId);
          setConnectionFailed(false);
        } else {
          setConnectionFailed(true);
        }
      } catch (err) {
        console.log('Game creation not available:', err.message);
        setConnectionFailed(true);
      }
    };
    createGame();
  }, [urlGameId, createdGameId]);

  const retryConnection = async () => {
    setRetrying(true);
    try {
      const res = await api.post('/api/games/new', {});
      if (res.id || res.gameId) {
        setCreatedGameId(res.id || res.gameId);
        setConnectionFailed(false);
      }
    } catch (err) {
      console.log('Retry failed:', err.message);
    } finally {
      setRetrying(false);
    }
  };

  // --- Fetch world snapshots on mount ---
  useEffect(() => {
    const fetchSnapshots = async () => {
      try {
        const res = await api.get('/api/world-snapshots');
        setWorldSnapshots(res.snapshots || []);
      } catch (err) {
        // Endpoint may not exist yet -- fail silently, empty state shows
        console.log('World snapshots not available:', err.message);
      }
    };
    fetchSnapshots();
  }, []);

  // TODO: On mount, GET /api/games/${gameId} to check game status and current init phase
  // If the game is already past certain phases, skip ahead to the appropriate phase
  // For now, always start at phase 0



  // --- Fetch scenarios when entering Phase 6 ---
  useEffect(() => {
    if (phase === 5 && gameId && !scenarioCache['default']) {
      fetchScenarios('standard');
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Clear error on phase change or input ---
  useEffect(() => {
    setError(null);
  }, [phase, storyteller, setting, settingAnswers, selectedWorld, selectedSnapshot, archetypeChar, customChar, difficulty, scenario]);

  // --- Cleanup world gen polling on unmount ---
  useEffect(() => {
    return () => {
      if (worldPollRef.current) clearTimeout(worldPollRef.current);
    };
  }, []);

  // --- Lore fragment cycling during transition overlay ---
  useEffect(() => {
    if (transitionPhase === null) return;
    setLoreIndex(0);
    setLoreFade(true);
    const interval = setInterval(() => {
      setLoreFade(false);
      setTimeout(() => {
        setLoreIndex(prev => prev + 1);
        setLoreFade(true);
      }, 300);
    }, 4000);
    return () => clearInterval(interval);
  }, [transitionPhase]);

  // --- Combined overlay sequence (Character → Attributes) ---
  useEffect(() => {
    if (!charOverlayActive) return;
    let cancelled = false;
    charOverlayAbortRef.current = false;

    const sleep = (ms) => new Promise(resolve => {
      const id = setTimeout(resolve, ms);
      const check = setInterval(() => {
        if (charOverlayAbortRef.current) { clearTimeout(id); clearInterval(check); resolve(); }
      }, 200);
      // Clean up interval when sleep resolves naturally
      const orig = resolve;
      resolve = (...args) => { clearInterval(check); orig(...args); };
    });

    // Cancellation-safe sleep
    const safeSleep = (ms) => new Promise(r => {
      const id = setTimeout(r, ms);
      if (cancelled) { clearTimeout(id); r(); }
    });

    const fadeMessage = async (text) => {
      setOverlayLoreFade(false);
      await safeSleep(300);
      if (cancelled) return;
      setOverlayLore(text);
      setOverlayLoreFade(true);
    };

    const run = async () => {
      // --- World Gen Messages ---
      setOverlayLabel('YOUR WORLD');
      setOverlaySecondary('The engine is building geography, history, and power structures');
      setOverlayLore(WORLD_GEN_MESSAGES[0].text);
      setOverlayLoreFade(true);

      const ts = worldGenTimestamps.current;
      const phases = WORLD_GEN_MESSAGES.map(m => m.phase);
      const isWorldComplete = () => worldGenStatusRef.current === 'complete';
      const isWorldError = () => worldGenStatusRef.current === 'error' || worldGenStatusRef.current === 'timeout';

      for (let i = 0; i < WORLD_GEN_MESSAGES.length; i++) {
        if (cancelled) return;
        if (isWorldError()) {
          // Abort overlay, show error
          setCharOverlayFading(true);
          await safeSleep(500);
          setCharOverlayActive(false);
          setCharOverlayFading(false);
          setError('World generation ran into a problem. Go back to try a different setting, or try again.');
          return;
        }

        const msg = WORLD_GEN_MESSAGES[i];
        if (i > 0) await fadeMessage(msg.text);
        if (cancelled) return;

        // Calculate display duration
        const nextPhase = phases[i + 1] || 'complete';
        const thisPhaseTs = ts[msg.phase];
        const nextPhaseTs = ts[nextPhase];

        if (thisPhaseTs && nextPhaseTs) {
          // Phase already completed — proportional pacing
          const firstTs = ts[phases[0]] || thisPhaseTs;
          const completeTs = ts.complete || nextPhaseTs;
          const totalTime = completeTs - firstTs;
          const phaseDuration = nextPhaseTs - thisPhaseTs;
          const proportion = totalTime > 0 ? phaseDuration / totalTime : 0.25;
          const targetTotal = 22000;
          let displayMs = proportion * targetTotal;
          displayMs *= 0.8 + Math.random() * 0.4; // ±20%
          displayMs = Math.max(displayMs, 4000);
          await safeSleep(displayMs);
        } else if (thisPhaseTs && !nextPhaseTs) {
          // Phase in progress — hold until next phase appears, minimum 6s
          const startedAt = Date.now();
          while (!ts[nextPhase] && !isWorldError()) {
            if (cancelled) return;
            await safeSleep(500);
          }
          if (isWorldError()) continue; // Loop will catch error at top
          const elapsed = Date.now() - startedAt;
          if (elapsed < 6000) await safeSleep(6000 - elapsed);
        } else {
          // Phase not yet reached — wait for it to start, then wait for next
          while (!ts[msg.phase] && !isWorldComplete() && !isWorldError()) {
            if (cancelled) return;
            await safeSleep(500);
          }
          if (isWorldError()) continue;
          // If world completed while waiting, show for minimum 4s
          if (isWorldComplete() && !ts[msg.phase]) {
            await safeSleep(4000);
          } else {
            // Wait for next phase
            const startedAt = Date.now();
            while (!ts[nextPhase] && !isWorldError()) {
              if (cancelled) return;
              await safeSleep(500);
            }
            const elapsed = Date.now() - startedAt;
            if (elapsed < 6000) await safeSleep(6000 - elapsed);
          }
        }
        if (cancelled) return;
      }

      // --- Wait for world gen to complete before generating proposal ---
      while (!isWorldComplete()) {
        if (cancelled) return;
        if (isWorldError()) {
          setCharOverlayFading(true);
          await safeSleep(500);
          setCharOverlayActive(false);
          setCharOverlayFading(false);
          setError('World generation ran into a problem. Go back to try a different setting, or try again.');
          return;
        }
        await safeSleep(500);
      }

      // --- Save character (requires world gen complete) ---
      try {
        await saveCharacter();
      } catch (err) {
        if (cancelled) return;
        setCharOverlayFading(true);
        await safeSleep(500);
        setCharOverlayActive(false);
        setCharOverlayFading(false);
        setError(err.message || 'Failed to save character.');
        return;
      }
      if (cancelled) return;

      // --- Transition to Proposal Phase ---
      setOverlayLabel('ATTRIBUTES');
      setOverlaySecondary('Deriving stats, skills, and gear from your backstory');

      // Fire off proposal generation
      proposalResultRef.current = { done: false, failed: false };
      generateProposal().then(() => {
        proposalResultRef.current.done = true;
      }).catch(() => {
        proposalResultRef.current.failed = true;
      });

      // --- Proposal Messages ---
      for (let i = 0; i < PROPOSAL_OVERLAY_MESSAGES.length; i++) {
        if (cancelled) return;
        await fadeMessage(PROPOSAL_OVERLAY_MESSAGES[i]);
        if (cancelled) return;

        const duration = 6000 + Math.random() * 3000; // 6-9 seconds
        const msgStart = Date.now();

        // Wait for duration, but check for completion
        while (Date.now() - msgStart < duration) {
          if (cancelled) return;
          if (proposalResultRef.current.failed) {
            // Proposal failed — fade out overlay, let Phase 3 proposalFailed UI handle it
            setCharOverlayFading(true);
            await safeSleep(500);
            setPhase(3);
            setCharOverlayActive(false);
            setCharOverlayFading(false);
            return;
          }
          await safeSleep(200);
        }

        // After this message's duration, if proposal is done and this isn't the last message,
        // we can end early (show at least the current message fully)
        if (proposalResultRef.current.done && i < PROPOSAL_OVERLAY_MESSAGES.length - 1) {
          break; // Skip remaining messages
        }
      }

      // If all 4 messages shown but proposal not done, hold on last message
      while (!proposalResultRef.current.done && !proposalResultRef.current.failed) {
        if (cancelled) return;
        await safeSleep(500);
      }

      if (proposalResultRef.current.failed) {
        setCharOverlayFading(true);
        await safeSleep(500);
        setPhase(3);
        setCharOverlayActive(false);
        setCharOverlayFading(false);
        return;
      }

      // --- Success: advance to Phase 3 and fade out ---
      if (cancelled) return;
      setPhase(3);
      setCharOverlayFading(true);
      await safeSleep(500);
      setCharOverlayActive(false);
      setCharOverlayFading(false);
    };

    run();
    return () => { cancelled = true; charOverlayAbortRef.current = true; };
  }, [charOverlayActive]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- API save functions ---

  const saveStoryteller = async () => {
    const capitalized = storyteller.charAt(0).toUpperCase() + storyteller.slice(1);
    const body = storyteller === 'custom'
      ? { selection: 'Custom', customText: customStorytellerText }
      : { selection: capitalized };
    await api.post(`/api/init/${gameId}/storyteller`, body);
  };

  const saveSetting = async () => {
    const displayName = SETTINGS.find(s => s.id === setting)?.name || setting;
    let body;
    if (selectedWorld) {
      body = {
        selection: displayName,
        prebuiltWorldId: selectedWorld,
        customText: anythingElseText || null,
      };
    } else if (setting === 'custom') {
      body = {
        selection: 'Custom',
        customText: customWorldText || null,
      };
    } else if (setting === 'your-worlds') {
      body = {
        selection: 'your-worlds',
        snapshotId: selectedSnapshot,
        customText: anythingElseText || null,
      };
    } else {
      body = {
        selection: displayName,
        answers: settingAnswers,
        customText: anythingElseText || null,
      };
    }
    if (seedFactions.length > 0 || seedNpcs.length > 0) {
      body.playerSeeds = {
        factions: seedFactions.map(f => ({ name: f.name, description: f.description, disposition: f.disposition })),
        npcs: seedNpcs.map(n => ({ name: n.name, description: n.description, relationship: n.relationship, faction: n.faction || null })),
      };
    }
    await api.post(`/api/init/${gameId}/setting`, body);
    // Start world generation polling
    setWorldGenStatus('generating');
    worldPollCount.current = 0;
    pollWorldStatus();
  };

  const pollWorldStatus = async () => {
    try {
      const res = await api.get(`/api/init/${gameId}/world-status`);
      if (res.status === 'complete') {
        setWorldGenStatus('complete');
        setWorldGenName(res.worldName || null);
        if (!worldGenTimestamps.current.complete) {
          worldGenTimestamps.current.complete = Date.now();
        }
        return;
      }
      if (res.status === 'failed') {
        setWorldGenStatus('error');
        return;
      }
      // Handle generating_* statuses
      const status = res.status || '';
      if (status.startsWith('generating')) {
        setWorldGenStatus('generating');
        setWorldGenPhase(status);
        if (!worldGenTimestamps.current[status]) {
          worldGenTimestamps.current[status] = Date.now();
        }
      }
      worldPollCount.current += 1;
      if (worldPollCount.current >= 60) {
        setWorldGenStatus('timeout');
        return;
      }
      worldPollRef.current = setTimeout(pollWorldStatus, 2000);
    } catch (err) {
      setWorldGenStatus('error');
    }
  };

  const saveCharacter = async () => {
    const char = characterMode === 'archetype' ? archetypeChar : customChar;
    await api.post(`/api/init/${gameId}/character`, {
      name: char.name.trim(),
      backstory: char.backstory || null,
      personality: char.personality || null,
      personalityCustom: char.personalityCustom || null,
      appearance: char.appearance || null,
      gender: char.customPronouns || char.pronouns || null,
      customPronouns: char.customPronouns || null,
      archetypeId: characterMode === 'archetype' ? selectedArchetype : null,
    });
  };

  const proposalInFlight = useRef(false);

  const generateProposal = async (isRetry = false) => {
    if (!isRetry) {
      if (proposalInFlight.current) return;
      proposalInFlight.current = true;
    }
    const STAT_META = {
      STR: { name: 'Strength', emoji: '\u{1F4AA}' },
      DEX: { name: 'Dexterity', emoji: '\u{1F3C3}' },
      CON: { name: 'Constitution', emoji: '\u{1F6E1}\uFE0F' },
      INT: { name: 'Intelligence', emoji: '\u{1F9E0}' },
      WIS: { name: 'Wisdom', emoji: '\u{1F441}\uFE0F' },
      CHA: { name: 'Charisma', emoji: '\u{1F3AD}' },
      POT: { name: 'Potency', emoji: '\u2728' },
    };
    setProposalLoading(true);
    setProposalFailed(false);
    setAdjustedStats(null);

    function parseProposal(res) {
      const p = res.proposal || res;
      const rawStats = p.stats || {};
      const statsArray = Object.entries(rawStats)
        .filter(([abbr]) => STAT_META[abbr])
        .map(([abbr, value]) => ({ name: STAT_META[abbr].name, abbr, emoji: STAT_META[abbr].emoji, value }));
      return { statsArray, p, validation: res.validation || {} };
    }

    try {
      const reqBody = {};
      if (skillRequests.trim()) reqBody.skillRequests = skillRequests.trim();
      if (gearRequests.trim()) reqBody.gearRequests = gearRequests.trim();
      const res = await api.post(`/api/init/${gameId}/generate-proposal`, Object.keys(reqBody).length > 0 ? reqBody : undefined);
      const { statsArray, p, validation } = parseProposal(res);

      if (statsArray.length === 0 && !isRetry) {
        // Empty stats on first try - auto-retry after 3s
        await new Promise(r => setTimeout(r, 3000));
        const res2 = await api.post(`/api/init/${gameId}/generate-proposal`, Object.keys(reqBody).length > 0 ? reqBody : undefined);
        const retry = parseProposal(res2);
        if (retry.statsArray.length === 0) {
          setProposalFailed(true);
          setProposalLoading(false);
          return;
        }
        setProposal({
          stats: retry.statsArray, skills: Array.isArray(retry.p.skills) ? retry.p.skills : [],
          foundationalSkills: Array.isArray(retry.p.foundationalSkills) ? retry.p.foundationalSkills : [],
          startingLoadout: Array.isArray(retry.p.startingLoadout) ? retry.p.startingLoadout : [],
          factionStandings: Array.isArray(retry.p.factionStandings) ? retry.p.factionStandings : [],
          narrativeBackstory: retry.p.narrativeBackstory || null,
          innateTraits: Array.isArray(retry.p.innateTraits) ? retry.p.innateTraits : [],
          species: retry.p.species || null,
        });
        setProposalValidation({ hardErrors: Array.isArray(retry.validation.hardErrors) ? retry.validation.hardErrors : [], softWarnings: Array.isArray(retry.validation.softWarnings) ? retry.validation.softWarnings : [] });
        setRequestsRegenerated(true);
        setProposalLoading(false);
        return;
      }

      if (statsArray.length === 0) {
        setProposalFailed(true);
        setProposalLoading(false);
        return;
      }

      setProposal({
        stats: statsArray, skills: Array.isArray(p.skills) ? p.skills : [],
        foundationalSkills: Array.isArray(p.foundationalSkills) ? p.foundationalSkills : [],
        startingLoadout: Array.isArray(p.startingLoadout) ? p.startingLoadout : [],
        factionStandings: Array.isArray(p.factionStandings) ? p.factionStandings : [],
        narrativeBackstory: p.narrativeBackstory || null,
        innateTraits: Array.isArray(p.innateTraits) ? p.innateTraits : [],
        species: p.species || null,
      });
      setProposalValidation({ hardErrors: Array.isArray(validation.hardErrors) ? validation.hardErrors : [], softWarnings: Array.isArray(validation.softWarnings) ? validation.softWarnings : [] });
      setRequestsRegenerated(true);
    } catch (err) {
      if (!isRetry) {
        // Auto-retry once after 3s
        await new Promise(r => setTimeout(r, 3000));
        await generateProposal(true);
        return;
      }
      setProposalFailed(true);
    } finally {
      setProposalLoading(false);
      if (!isRetry) proposalInFlight.current = false;
    }
  };

  const saveAttributes = async () => {
    const statsArray = adjustedStats || proposal?.stats || (!gameId ? SAMPLE_STATS : []);
    const statsObject = {};
    statsArray.forEach(s => { statsObject[s.abbr || s.name.slice(0, 3).toUpperCase()] = s.value; });
    const body = { stats: statsObject };
    if (proposal?.skills?.length) body.skills = proposal.skills;
    if (proposal?.foundationalSkills?.length) body.foundationalSkills = proposal.foundationalSkills;
    if (proposal?.startingLoadout?.length) body.startingLoadout = proposal.startingLoadout;
    if (proposal?.factionStandings?.length) body.factionStandings = proposal.factionStandings;
    if (proposal?.narrativeBackstory) body.narrativeBackstory = proposal.narrativeBackstory;
    if (proposal?.innateTraits?.length) body.innateTraits = proposal.innateTraits;
    await api.post(`/api/init/${gameId}/adjust-proposal`, body);
  };

  const saveDifficulty = async () => {
    const body = dialOverrides
      ? { preset: difficulty, overrides: dialOverrides }
      : { preset: difficulty };
    await api.post(`/api/init/${gameId}/difficulty`, body);
  };

  const fetchScenarios = async (intensityId, isRetry = false) => {
    setScenariosLoading(true);
    setScenariosFailed(false);
    setScenario(null);

    function mapScenarios(res) {
      const scenarios = res.scenarios || res;
      if (!Array.isArray(scenarios) || scenarios.length === 0) return null;
      const mapped = scenarios.map((s, i) => ({
        key: s.key || String.fromCharCode(65 + i),
        name: s.name || s.title || `Scenario ${String.fromCharCode(65 + i)}`,
        icon: s.icon || SCENARIOS[i]?.icon || 'custom_start',
        desc: s.desc || s.description || '',
      }));
      if (!mapped.find(s => s.key === 'D')) mapped.push(SCENARIOS[3]);
      return mapped;
    }

    try {
      const body = { intensity: intensityId.charAt(0).toUpperCase() + intensityId.slice(1) };
      const res = await api.post(`/api/init/${gameId}/generate-scenarios`, body);
      const mapped = mapScenarios(res);
      if (mapped) {
        setScenarioCache(prev => ({ ...prev, default: mapped }));
      } else if (!isRetry) {
        await new Promise(r => setTimeout(r, 3000));
        const res2 = await api.post(`/api/init/${gameId}/generate-scenarios`, body);
        const mapped2 = mapScenarios(res2);
        if (mapped2) {
          setScenarioCache(prev => ({ ...prev, default: mapped2 }));
        } else {
          setScenariosFailed(true);
        }
      } else {
        setScenariosFailed(true);
      }
    } catch (err) {
      if (!isRetry) {
        await new Promise(r => setTimeout(r, 3000));
        return fetchScenarios(intensityId, true);
      }
      setScenariosFailed(true);
    } finally {
      setScenariosLoading(false);
    }
  };

  const handleRefreshScenario = async (key) => {
    setRefreshingScenario(key);
    // TODO: wire to real single-scenario refresh endpoint
    await new Promise(r => setTimeout(r, 2000));
    const fallback = SCENARIOS.find(s => s.key === key);
    setScenarioAlts(prev => ({ ...prev, [key]: { ...fallback, name: fallback.name + ' (alt)', desc: 'An alternative opening for this pacing type. The real version will come from the backend.', altIndex: 0 } }));
    setScenarioView(prev => ({ ...prev, [key]: 'alt' }));
    setRefreshingScenario(null);
  };

  const saveScenario = async () => {
    const indexMap = { A: 0, B: 1, C: 2 };
    // TODO: backend needs to accept pacingType
    const body = scenario === 'D'
      ? { scenarioIndex: 'custom', pacingType: 'custom', customStart: { description: customStartText } }
      : { scenarioIndex: indexMap[scenario], pacingType: PACING_MAP[scenario] };
    // If viewing an alt version, send the alt's index
    if (scenarioView[scenario] === 'alt' && scenarioAlts[scenario]) {
      body.scenarioIndex = scenarioAlts[scenario].altIndex ?? indexMap[scenario];
    }
    await api.post(`/api/init/${gameId}/select-scenario`, body);
  };

  // --- Navigation ---

  const canAdvance = () => {
    switch (phase) {
      case 0: return !!storyteller;
      case 1: return !!setting;
      case 2: {
        const char = characterMode === 'archetype' ? archetypeChar : customChar;
        return char.name.trim().length > 0;
      }
      case 3: return !proposalLoading && !proposalFailed && !!proposal?.stats?.length && !(proposalValidation.hardErrors.length > 0);
      case 4: return !!difficulty;
      case 5: return !!scenario && !scenariosLoading && !scenariosFailed;
      default: return false;
    }
  };

  const handleNext = async () => {
    if (savingRef.current) return;
    if (!canAdvance()) return;

    // Phases 1, 2, 3 require confirmation before proceeding
    if ((phase === 1 || phase === 2 || phase === 3) && !confirmBypassRef.current) {
      const msg = phase === 1 ? "Your setting can't be changed once confirmed. Continue?"
        : phase === 2 ? "Your character's name and backstory are locked in after this step. Continue?"
        : (skillRequests.trim() || gearRequests.trim()) && !requestsRegenerated
          ? "You have unsubmitted skill or gear requests. Continue without applying them?"
          : "Your stats and skills are locked in after this step. Continue?";
      setConfirmMessage(msg);
      setConfirmVisible(true);
      return;
    }
    confirmBypassRef.current = false;

    // If no gameId yet (creation pending or failed), advance locally without overlay
    if (!gameId) {
      if (phase === 5) {
        router.push('/menu');
      } else {
        setPhase(p => p + 1);
      }
      return;
    }

    // Synchronous ref guard — prevents double-submission even within the same tick
    savingRef.current = true;
    setSaving(true);
    setError(null);

    try {
      switch (phase) {
        case 0:
          await saveStoryteller();
          break;
        case 1:
          await saveSetting();
          // World gen polls in background — advance immediately
          break;
        case 2: {
          // Gate on world gen status
          const wgStatus = worldGenStatusRef.current;
          if (wgStatus === 'error' || wgStatus === 'timeout') {
            savingRef.current = false;
            setSaving(false);
            setModalFading(false);
            setError('World generation ran into a problem. Go back to try a different setting, or try again.');
            return;
          }
          // Activate the combined overlay — it handles saveCharacter, generateProposal, and phase advance
          setCharFieldModal(null);
          charOverlayAbortRef.current = false;
          proposalResultRef.current = { done: false, failed: false };
          setCharOverlayActive(true);
          savingRef.current = false;
          setSaving(false);
          return;
        }
        case 3:
          await saveAttributes();
          break;
        case 4:
          await saveDifficulty();
          break;
        case 5:
          try {
            const settingName = SETTINGS.find(s => s.id === setting)?.name || setting || null;
            const difficultyName = DIFFICULTIES.find(d => d.id === difficulty)?.name || difficulty || null;
            const stName = storyteller ? storyteller.charAt(0).toUpperCase() + storyteller.slice(1) : null;
            const prebuiltWorld = selectedWorld ? PREBUILT_WORLDS.find(w => w.id === selectedWorld) : null;
            sessionStorage.setItem('crucible_loading_summary', JSON.stringify({
              characterName: (characterMode === 'archetype' ? archetypeChar : customChar)?.name || null,
              worldName: prebuiltWorld ? prebuiltWorld.name : (worldGenName || settingName),
              settingArchetype: settingName,
              isPrebuilt: !!prebuiltWorld,
              storyteller: stName,
              difficulty: difficultyName,
            }));
          } catch { /* sessionStorage may be unavailable */ }
          // Navigate immediately — save scenario in background
          router.push(`/play?gameId=${gameId}`);
          saveScenario().catch(() => {});
          savingRef.current = false;
          return;
      }

      // Modal content fade: out → advance → in
      setModalFading(true);
      setFieldModalOpen(null);
      setCharFieldModal(null);
      await new Promise(r => setTimeout(r, 150));
      if (phase < 5) setPhase(phase + 1);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setModalFading(false);
          savingRef.current = false;
          setSaving(false);
        });
      });
    } catch (err) {
      setModalFading(false);
      savingRef.current = false;
      setSaving(false);
      setError(err.message || 'Something went wrong. Please try again.');
    }
  };

  const handleCharChange = (key, val) => {
    setConfirmVisible(false);
    const setter = characterMode === 'archetype' ? setArchetypeChar : setCustomChar;
    setter(prev => ({ ...prev, [key]: val }));
  };

  // Dismiss confirmation when user changes inputs
  useEffect(() => { setConfirmVisible(false); }, [setting, settingAnswers, selectedWorld, customWorldText, archetypeChar, customChar, skillRequests, gearRequests, difficulty]);

  const buttonEnabled = canAdvance() && !saving;

  return (
    <div className={styles.pageContainer} style={{
      minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-primary)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 72,
      ...lexieVars,
    }}>
      <ParticleField />
      <div style={{ width: '100%' }}><NavBar /></div>

      {/* Phase Modal */}
      <PhaseModal header={(() => {
        const chips = [];
        const stName = storyteller ? (STORYTELLERS.find(s => s.id === storyteller)?.name || 'Custom') : null;
        const prebuiltWorld = selectedWorld ? PREBUILT_WORLDS.find(w => w.id === selectedWorld) : null;
        const worldLabel = worldGenName || (prebuiltWorld ? prebuiltWorld.name : null) || (setting ? (SETTINGS.find(s => s.id === setting)?.name || 'Custom') : null);
        const activeChar = characterMode === 'archetype' ? archetypeChar : customChar;
        const charName = activeChar?.name || null;
        const diffName = difficulty ? (DIFFICULTIES.find(d => d.id === difficulty)?.name || difficulty) : null;

        if (phase >= 1 && stName) chips.push({ label: 'Voice', value: stName });
        if (phase >= 2 && worldLabel) chips.push({ label: 'World', value: worldLabel });
        if (phase >= 3 && charName) chips.push({ label: 'Character', value: charName, gold: true });
        if (phase >= 5 && diffName) chips.push({ label: 'Difficulty', value: diffName });

        return (
          <>
            {/* Desktop: full step indicator */}
            <div className={styles.stepIndicatorDesktop}>
              <StepIndicator steps={STEP_NAMES} current={phase} />
            </div>
            {/* Mobile: compact phase label */}
            <div className={styles.stepIndicatorMobile}>
              <span style={{
                fontFamily: 'var(--font-cinzel)', fontSize: 14, fontWeight: 700,
                color: 'var(--accent-gold)',
              }}>{STEP_NAMES[phase]}</span>
              <span style={{
                fontFamily: 'var(--font-alegreya-sans)', fontSize: 12,
                color: 'var(--text-dim)', marginLeft: 10,
              }}>Step {phase + 1} of {STEP_NAMES.length}</span>
            </div>
            {/* Summary chips */}
            {chips.length > 0 && (
              <div className={styles.summaryChips} style={{
                display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 0,
                borderTop: '1px solid #16181e', borderBottom: '1px solid #16181e',
                padding: '10px 0', margin: '0 0 4px',
              }}>
                {chips.map((chip, i) => (
                  <div key={chip.label} className={styles.summaryChip} style={{
                    padding: '0 20px', textAlign: 'center',
                    borderRight: i < chips.length - 1 ? '1px solid #1e2540' : 'none',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                  }}>
                    <div className={styles.chipLabel} style={{
                      fontFamily: 'var(--font-alegreya-sans)', fontSize: 10, fontWeight: 600,
                      color: '#4a5a70', letterSpacing: '0.14em', textTransform: 'uppercase',
                      lineHeight: 1.2,
                    }}>{chip.label}</div>
                    <div title={chip.value} className={styles.chipValue} style={{
                      fontFamily: 'var(--font-cinzel)', fontSize: 14, fontWeight: 600,
                      color: chip.gold ? '#c9a84c' : '#8a94a8',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      maxWidth: 140, lineHeight: 1.3,
                    }}>{chip.value}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        );
      })()} bottomNav={
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{
              fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: 'var(--text-dim)',
            }}>Phase {phase + 1} of {STEP_NAMES.length}</span>
            {error && (
              <span style={{
                fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: 'var(--color-danger)',
              }}>{error}</span>
            )}
          </div>
          <button
            onClick={handleNext}
            disabled={!buttonEnabled}
            className={styles.btnPrimary}
            style={{
              fontFamily: 'var(--font-cinzel)', fontSize: 14, fontWeight: 700,
              color: buttonEnabled ? 'var(--bg-main)' : 'var(--text-dim)',
              background: buttonEnabled ? 'linear-gradient(135deg, var(--accent-gold), var(--accent-bright))' : 'var(--bg-gold-subtle)',
              border: 'none', borderRadius: 5, padding: '12px 32px',
              cursor: buttonEnabled ? 'pointer' : 'default',
              letterSpacing: '0.08em', flexShrink: 0,
            }}
          >
            {saving ? 'SAVING...' : phase === 5 ? 'BEGIN ADVENTURE' : 'CONTINUE'}
          </button>
        </div>
      }>
        <div style={{
          opacity: modalFading ? 0 : 1,
          transition: 'opacity 150ms ease',
        }}>
          {/* Offline banner */}
          {connectionFailed && !gameId && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
              background: '#1a1610', border: '1px solid #3d3322', borderRadius: 6,
              fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#d4a84b',
              marginBottom: 24,
            }}>
              <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>&#9888;</span>
              <span style={{ flex: 1 }}>
                Unable to connect to the server. Your progress won't be saved. Check your connection and refresh to try again.
              </span>
              <button
                onClick={retryConnection}
                disabled={retrying}
                style={{
                  fontFamily: 'var(--font-cinzel)', fontSize: 11, fontWeight: 600,
                  color: retrying ? 'var(--text-dim)' : '#d4a84b',
                  background: 'transparent', border: '1px solid #3d3322', borderRadius: 4,
                  padding: '6px 14px', cursor: retrying ? 'default' : 'pointer',
                  letterSpacing: '0.04em', whiteSpace: 'nowrap', flexShrink: 0,
                }}
              >
                {retrying ? 'RETRYING...' : 'RETRY CONNECTION'}
              </button>
            </div>
          )}

          {phase === 0 && <Phase1 selected={storyteller} onSelect={setStoryteller} customText={customStorytellerText} setCustomText={setCustomStorytellerText} />}
          {phase === 1 && (
            <Phase2
              selected={setting}
              onSelect={(id) => {
                if (id !== setting) {
                  setFieldModalOpen(null);
                  setSetting(id);
                  setSettingAnswers({});
                  setSelectedWorld(null);
                  setExpandedWorld(null);
                  setSelectedSnapshot(null);
                  setSelectedArchetype(null);
                  setAnythingElseText('');
                  setCustomWorldText('');
                }
              }}
              selectedWorld={selectedWorld}
              customWorldText={customWorldText}
              selectedSnapshot={selectedSnapshot}
              worldSnapshots={worldSnapshots}
              seedFactions={seedFactions}
              seedNpcs={seedNpcs}
              onCardTap={setFieldModalOpen}
            />
          )}
          {phase === 2 && (
            <Phase3
              characterMode={characterMode}
              hasArchetypes={hasArchetypes}
              selectedArchetype={selectedArchetype}
              availableArchetypes={availableArchetypes}
              archetypeChar={archetypeChar}
              customChar={customChar}
              onCardTap={(mode) => { setCharacterMode(mode); setCharFieldModal(mode); }}
            />
          )}
          {phase === 3 && (
            proposalFailed ? (
              <div style={{ textAlign: 'center', padding: '60px 24px' }}>
                <div style={{ fontFamily: 'var(--font-alegreya)', fontSize: 20, fontStyle: 'italic', color: 'var(--accent-gold)', marginBottom: 12 }}>
                  Character generation hit a snag.
                </div>
                <div style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 400, margin: '0 auto 24px' }}>
                  Your world and backstory are safe. Tap below to try again.
                </div>
                <button onClick={() => generateProposal()} disabled={proposalLoading} style={{
                  fontFamily: 'var(--font-cinzel)', fontSize: 14, fontWeight: 700,
                  color: proposalLoading ? 'var(--text-dim)' : 'var(--bg-main)',
                  background: proposalLoading ? 'var(--bg-gold-subtle)' : 'linear-gradient(135deg, var(--accent-gold), var(--accent-bright))',
                  border: 'none', borderRadius: 6, padding: '14px 32px', cursor: proposalLoading ? 'default' : 'pointer',
                  letterSpacing: '0.08em',
                }}>{proposalLoading ? 'Trying...' : 'Try Again'}</button>
              </div>
            ) : (
              <Phase4
                stats={proposal?.stats || (!gameId ? SAMPLE_STATS : [])}
                onStatsChange={setAdjustedStats}
                skills={proposal?.skills}
                foundationalSkills={proposal?.foundationalSkills}
                startingLoadout={proposal?.startingLoadout}
                factionStandings={proposal?.factionStandings}
                innateTraits={proposal?.innateTraits}
                softWarnings={proposalValidation.softWarnings}
                hardErrors={proposalValidation.hardErrors}
                onHardErrorsClear={() => setProposalValidation(prev => ({ ...prev, hardErrors: [] }))}
                skillRequests={skillRequests}
                onSkillRequestsChange={(val) => { setSkillRequests(val); setRequestsRegenerated(false); }}
                gearRequests={gearRequests}
                onGearRequestsChange={(val) => { setGearRequests(val); setRequestsRegenerated(false); }}
                onRegenerate={generateProposal}
                regenerating={proposalLoading}
              />
            )
          )}
          {phase === 4 && <Phase5 selected={difficulty} onSelect={(id) => { setDifficulty(id); setDialOverrides(null); }} difficultyTab={difficultyTab} setDifficultyTab={setDifficultyTab} dialOverrides={dialOverrides} setDialOverrides={setDialOverrides} />}
          {phase === 5 && (
            scenariosFailed && !scenariosLoading ? (
              <div style={{ textAlign: 'center', padding: '60px 24px' }}>
                <div style={{ fontFamily: 'var(--font-alegreya)', fontSize: 20, fontStyle: 'italic', color: 'var(--accent-gold)', marginBottom: 12 }}>
                  The threads of fate are tangled.
                </div>
                <div style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 400, margin: '0 auto 24px' }}>
                  Scenario generation failed. Your world is ready. Tap below to try again.
                </div>
                <button onClick={() => fetchScenarios('standard')} disabled={scenariosLoading} style={{
                  fontFamily: 'var(--font-cinzel)', fontSize: 14, fontWeight: 700,
                  color: scenariosLoading ? 'var(--text-dim)' : 'var(--bg-main)',
                  background: scenariosLoading ? 'var(--bg-gold-subtle)' : 'linear-gradient(135deg, var(--accent-gold), var(--accent-bright))',
                  border: 'none', borderRadius: 6, padding: '14px 32px', cursor: scenariosLoading ? 'default' : 'pointer',
                  letterSpacing: '0.08em',
                }}>{scenariosLoading ? 'Trying...' : 'Try Again'}</button>
              </div>
            ) : (
              <Phase6 scenario={scenario} setScenario={setScenario} customStartText={customStartText} setCustomStartText={setCustomStartText} scenariosLoading={scenariosLoading} displayScenarios={scenarioCache['default'] || (gameId ? [] : SCENARIOS)} scenarioAlts={scenarioAlts} scenarioView={scenarioView} setScenarioView={setScenarioView} refreshingScenario={refreshingScenario} onRefreshScenario={handleRefreshScenario} />
            )
          )}
        </div>
      </PhaseModal>

      {/* Setting FieldModals — render at top level, not inside Phase2 */}
      {fieldModalOpen === 'era' && setting && setting !== 'custom' && setting !== 'your-worlds' && (() => {
        const eraWorlds = PREBUILT_WORLDS.filter(w => w.era === setting);
        const eraName = SETTINGS.find(s => s.id === setting)?.name || 'Setting';
        const handleWorldToggle = (worldId) => {
          if (selectedWorld === worldId) { setSelectedWorld(null); setExpandedWorld(null); }
          else { setSelectedWorld(worldId); setExpandedWorld(worldId); setSettingAnswers({}); }
        };
        const handleSubQuestionInteract = () => { setSelectedWorld(null); setExpandedWorld(null); };
        return (
          <FieldModal title={eraName} onClose={() => setFieldModalOpen(null)} footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setFieldModalOpen(null)} style={{
                fontFamily: 'var(--font-cinzel)', fontSize: 13, fontWeight: 700,
                color: 'var(--bg-main)', letterSpacing: '0.08em',
                background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-bright))',
                border: 'none', borderRadius: 5, padding: '10px 28px', cursor: 'pointer',
              }}>DONE</button>
            </div>
          }>
            {/* Pre-built world cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {eraWorlds.map(world => (
                <div key={world.id}>
                  <PrebuiltWorldCard world={world} isSelected={selectedWorld === world.id} isExpanded={expandedWorld === world.id} onToggle={handleWorldToggle} anythingElseText={anythingElseText} onAnythingElseChange={setAnythingElseText} />
                </div>
              ))}
            </div>
            {/* Build Your Own — hide when a prebuilt world is selected */}
            {!selectedWorld && (
              <>
                {eraWorlds.length > 0 && <SectionDivider text="or shape your own" />}
                <SettingQuestions settingId={setting} answers={settingAnswers} setAnswers={setSettingAnswers} onInteract={handleSubQuestionInteract} freeformText={anythingElseText} setFreeformText={setAnythingElseText} />
              </>
            )}
          </FieldModal>
        );
      })()}

      {fieldModalOpen === 'custom' && (
        <FieldModal title="Create Your World" onClose={() => setFieldModalOpen(null)} footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => setFieldModalOpen(null)} style={{
              fontFamily: 'var(--font-cinzel)', fontSize: 13, fontWeight: 700,
              color: 'var(--bg-main)', letterSpacing: '0.08em',
              background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-bright))',
              border: 'none', borderRadius: 5, padding: '10px 28px', cursor: 'pointer',
            }}>DONE</button>
          </div>
        }>
          {/* Guided questions */}
          <div style={{
            padding: '28px 28px 24px', background: 'var(--bg-gold-faint)',
            border: '1px solid var(--border-gold-faint)', borderRadius: 10, marginBottom: 20,
          }}>
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 19, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 6 }}>Shape Your World</h3>
              <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 15, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>All optional. Pick what matters — the engine fills in the rest.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div>
                <label style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.04em', display: 'block', marginBottom: 10 }}>Technology</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['Stone Age', 'Medieval', 'Industrial', 'Modern', 'Future', 'Mixed'].map(opt => {
                    const isActive = settingAnswers['Technology'] === opt;
                    return (
                      <button key={opt} onClick={() => setSettingAnswers(prev => ({ ...prev, Technology: prev.Technology === opt ? null : opt }))} className={styles.optionToggle} style={{
                        padding: '10px 18px',
                        fontFamily: 'var(--font-alegreya-sans)', fontSize: 15, fontWeight: isActive ? 500 : 400,
                        color: isActive ? 'var(--accent-gold)' : 'var(--text-secondary)',
                        background: isActive ? 'var(--bg-gold-light)' : 'var(--bg-main)',
                        border: `1px solid ${isActive ? 'var(--border-card-hover)' : 'var(--border-gold-subtle)'}`,
                        borderRadius: 6,
                      }}>{opt}</button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.04em', display: 'block', marginBottom: 10 }}>Supernatural Elements</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['None', 'Rare & Hidden', 'Present & Known', 'Pervasive'].map(opt => {
                    const isActive = settingAnswers['Supernatural Elements'] === opt;
                    return (
                      <button key={opt} onClick={() => setSettingAnswers(prev => ({ ...prev, 'Supernatural Elements': prev['Supernatural Elements'] === opt ? null : opt }))} className={styles.optionToggle} style={{
                        padding: '10px 18px',
                        fontFamily: 'var(--font-alegreya-sans)', fontSize: 15, fontWeight: isActive ? 500 : 400,
                        color: isActive ? 'var(--accent-gold)' : 'var(--text-secondary)',
                        background: isActive ? 'var(--bg-gold-light)' : 'var(--bg-main)',
                        border: `1px solid ${isActive ? 'var(--border-card-hover)' : 'var(--border-gold-subtle)'}`,
                        borderRadius: 6,
                      }}>{opt}</button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Freeform description */}
          <label style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 10 }}>Describe Your World</label>
          <textarea value={customWorldText} onChange={e => setCustomWorldText(e.target.value)} placeholder="Describe your world..." className={styles.wizardInput} style={{
            width: '100%', minHeight: 110, background: 'var(--bg-main)', border: '1px solid var(--border-gold-faint)',
            borderRadius: 8, padding: 16, fontFamily: 'var(--font-alegreya)', fontSize: 16,
            color: 'var(--text-primary)', outline: 'none', resize: 'vertical', boxSizing: 'border-box',
          }} />
        </FieldModal>
      )}

      {fieldModalOpen === 'your-worlds' && (
        <FieldModal title="Your Worlds" onClose={() => setFieldModalOpen(null)} footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => setFieldModalOpen(null)} style={{
              fontFamily: 'var(--font-cinzel)', fontSize: 13, fontWeight: 700,
              color: 'var(--bg-main)', letterSpacing: '0.08em',
              background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-bright))',
              border: 'none', borderRadius: 5, padding: '10px 28px', cursor: 'pointer',
            }}>DONE</button>
          </div>
        }>
          <WorldSnapshotList snapshots={worldSnapshots} selectedSnapshot={selectedSnapshot} setSelectedSnapshot={setSelectedSnapshot} anythingElseText={anythingElseText} setAnythingElseText={setAnythingElseText} />
        </FieldModal>
      )}

      {fieldModalOpen === 'advanced' && (
        <FieldModal title="Factions &amp; NPCs" onClose={() => setFieldModalOpen(null)}>
          <AdvancedSeedTab seedFactions={seedFactions} setSeedFactions={setSeedFactions} seedNpcs={seedNpcs} setSeedNpcs={setSeedNpcs} />
        </FieldModal>
      )}

      {/* Character FieldModals */}
      {charFieldModal === 'archetype' && (() => {
        const handleArchetypeSelect = (archetypeId) => {
          if (selectedArchetype === archetypeId) {
            setSelectedArchetype(null);
            return;
          }
          const arch = availableArchetypes.find(a => a.id === archetypeId);
          if (arch) {
            setSelectedArchetype(archetypeId);
            setArchetypeChar(prev => ({
              ...prev,
              backstory: arch.backstory,
              personality: arch.personality.join(','),
            }));
          }
        };
        return (
          <FieldModal title="Choose an Archetype" onClose={() => setCharFieldModal(null)} footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setCharFieldModal(null)} style={{
                fontFamily: 'var(--font-cinzel)', fontSize: 13, fontWeight: 700,
                color: 'var(--bg-main)', letterSpacing: '0.08em',
                background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-bright))',
                border: 'none', borderRadius: 5, padding: '10px 28px', cursor: 'pointer',
              }}>DONE</button>
            </div>
          }>
            {/* Archetype grid */}
            <div className={styles.twoColGrid} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {availableArchetypes.map(arch => (
                <ArchetypeCard
                  key={arch.id}
                  archetype={arch}
                  isSelected={selectedArchetype === arch.id}
                  onSelect={handleArchetypeSelect}
                />
              ))}
            </div>

            {/* Character form appears when archetype selected */}
            {selectedArchetype ? (
              <>
                <div style={{ borderTop: '1px solid var(--border-gold-faint)', margin: '24px 0' }} />
                <CharacterForm
                  character={archetypeChar}
                  onChange={(key, val) => { setConfirmVisible(false); setArchetypeChar(prev => ({ ...prev, [key]: val })); }}
                />
              </>
            ) : (
              <p style={{
                fontFamily: 'var(--font-alegreya)', fontSize: 15, fontStyle: 'italic',
                color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0',
              }}>Pick an archetype above to start building your character.</p>
            )}
          </FieldModal>
        );
      })()}

      {charFieldModal === 'custom' && (
        <FieldModal title="Create Your Character" onClose={() => setCharFieldModal(null)} footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => setCharFieldModal(null)} style={{
              fontFamily: 'var(--font-cinzel)', fontSize: 13, fontWeight: 700,
              color: 'var(--bg-main)', letterSpacing: '0.08em',
              background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-bright))',
              border: 'none', borderRadius: 5, padding: '10px 28px', cursor: 'pointer',
            }}>DONE</button>
          </div>
        }>
          <CharacterForm
            character={customChar}
            onChange={(key, val) => { setConfirmVisible(false); setCustomChar(prev => ({ ...prev, [key]: val })); }}
          />
        </FieldModal>
      )}

      {/* Confirmation Modal */}
      {confirmVisible && (
        <div onClick={() => setConfirmVisible(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(10,14,26,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#0d1120', border: '1px solid #3a3328', borderRadius: 10,
            padding: '28px 32px', maxWidth: 400, width: 'calc(100% - 48px)', textAlign: 'center',
          }}>
            <p style={{
              fontFamily: 'var(--font-alegreya-sans)', fontSize: 15, color: '#c8c0b0',
              lineHeight: 1.6, marginBottom: 24, margin: '0 0 24px',
            }}>{confirmMessage}</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
              <button onClick={() => setConfirmVisible(false)} style={{
                fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#7082a4',
                background: 'none', border: 'none', padding: '10px 20px', cursor: 'pointer',
              }}>Go Back</button>
              <button onClick={() => { setConfirmVisible(false); confirmBypassRef.current = true; handleNext(); }} style={{
                fontFamily: 'var(--font-cinzel)', fontSize: 13, fontWeight: 700, letterSpacing: '0.06em',
                textTransform: 'uppercase', color: '#0a0e1a',
                background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-bright))',
                border: 'none', borderRadius: 5, padding: '10px 24px', cursor: 'pointer',
              }}>Confirm</button>
            </div>
          </div>
        </div>
      )}


      {/* Combined character→attributes overlay */}
      {charOverlayActive && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'var(--bg-main)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          '--font-alegreya': "'Alegreya', serif",
          '--font-alegreya-sans': "'Alegreya Sans', sans-serif",
          '--font-jetbrains': "'JetBrains Mono', monospace",
          opacity: charOverlayFading ? 0 : 1,
          transition: 'opacity 0.5s ease',
          pointerEvents: charOverlayFading ? 'none' : 'auto',
        }}>
          <style>{EMBER_KEYFRAMES}</style>

          {/* Background particle field */}
          <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
            {Array.from({ length: 20 }, (_, i) => (
              <div key={i} style={{
                position: 'absolute',
                left: `${(i * 37 + 13) % 100}%`,
                top: `${(i * 53 + 7) % 100}%`,
                width: ((i * 7 + 3) % 5) * 0.5 + 0.8,
                height: ((i * 7 + 3) % 5) * 0.5 + 0.8,
                borderRadius: '50%',
                background: '#c9a84c',
                opacity: ((i * 3 + 1) % 6) * 0.04 + 0.08,
              }} />
            ))}
          </div>

          {/* Radial glow */}
          <div style={{
            position: 'absolute', width: 500, height: 500, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(201,168,76,0.04) 0%, transparent 70%)',
            top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none',
          }} />

          {/* Wordmark */}
          <div style={{ position: 'absolute', top: 22, left: 24, display: 'flex', alignItems: 'baseline', gap: 8, zIndex: 2 }}>
            <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 22, fontWeight: 900, color: 'var(--accent-gold)', letterSpacing: '0.06em' }}>CRUCIBLE</span>
            <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 12, fontWeight: 600, color: 'var(--gold-muted)', letterSpacing: '0.18em' }}>RPG</span>
          </div>

          {/* Center content */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>
            {/* Phase label */}
            <div style={{
              fontFamily: 'var(--font-cinzel)', fontSize: 14, fontWeight: 700,
              color: 'var(--accent-gold)', letterSpacing: '0.18em', textTransform: 'uppercase',
              marginBottom: 32,
            }}>{overlayLabel}</div>

            {/* Firefly embers */}
            <div style={{ width: 160, height: 160, position: 'relative' }}>
              {FIREFLY_EMBERS.map((e, i) => (
                <div key={i} style={{
                  position: 'absolute', left: e.x, top: e.y,
                  width: e.size, height: e.size, borderRadius: '50%',
                  background: e.color, opacity: 0.65 + i * 0.025,
                  boxShadow: `0 0 ${e.glow}px rgba(201,168,76,0.6), 0 0 ${Math.round(e.glow * 2.5)}px rgba(201,168,76,0.2)`,
                  animation: `${e.anim} ${e.dur}s linear ${e.delay}s infinite`,
                }} />
              ))}
            </div>

            {/* Lore fragment */}
            <div style={{ marginTop: 30, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{
                fontFamily: 'var(--font-alegreya)', fontSize: 24, fontStyle: 'italic',
                color: 'var(--text-heading)', fontWeight: 500,
                opacity: overlayLoreFade ? 1 : 0,
                transition: 'opacity 0.3s',
              }}>
                {overlayLore}
              </span>
            </div>

            {/* Secondary description */}
            <p style={{
              fontFamily: 'var(--font-alegreya-sans)', fontSize: 16,
              color: 'var(--text-muted)', margin: '12px 0 0', textAlign: 'center',
              maxWidth: 400,
            }}>{overlaySecondary}</p>

            {/* Wait message */}
            <p style={{
              fontFamily: 'var(--font-alegreya-sans)', fontSize: 13,
              color: 'var(--text-dim)', marginTop: 16,
            }}>This may take a minute or two.</p>
          </div>
        </div>
      )}

      {/* Phase transition overlay */}
      {transitionPhase !== null && (() => {
        const msg = PHASE_TRANSITION_MESSAGES[transitionPhase] || PHASE_TRANSITION_MESSAGES[0];
        const loreLines = [msg.primary, 'Forging your world...', 'Setting the stage...', 'Lighting the lanterns...'];
        return (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'var(--bg-main)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            '--font-alegreya': "'Alegreya', serif",
            '--font-alegreya-sans': "'Alegreya Sans', sans-serif",
            '--font-jetbrains': "'JetBrains Mono', monospace",
            opacity: transitionFading ? 0 : 1,
            transition: 'opacity 0.5s ease',
            pointerEvents: transitionFading ? 'none' : 'auto',
          }}>
            <style>{EMBER_KEYFRAMES}</style>

            {/* Background particle field */}
            <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
              {Array.from({ length: 20 }, (_, i) => (
                <div key={i} style={{
                  position: 'absolute',
                  left: `${(i * 37 + 13) % 100}%`,
                  top: `${(i * 53 + 7) % 100}%`,
                  width: ((i * 7 + 3) % 5) * 0.5 + 0.8,
                  height: ((i * 7 + 3) % 5) * 0.5 + 0.8,
                  borderRadius: '50%',
                  background: '#c9a84c',
                  opacity: ((i * 3 + 1) % 6) * 0.04 + 0.08,
                }} />
              ))}
            </div>

            {/* Radial glow */}
            <div style={{
              position: 'absolute', width: 500, height: 500, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(201,168,76,0.04) 0%, transparent 70%)',
              top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none',
            }} />

            {/* Wordmark */}
            <div style={{ position: 'absolute', top: 22, left: 24, display: 'flex', alignItems: 'baseline', gap: 8, zIndex: 2 }}>
              <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 22, fontWeight: 900, color: 'var(--accent-gold)', letterSpacing: '0.06em' }}>CRUCIBLE</span>
              <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 12, fontWeight: 600, color: 'var(--gold-muted)', letterSpacing: '0.18em' }}>RPG</span>
            </div>

            {/* Center content */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>
              {/* Phase label */}
              <div style={{
                fontFamily: 'var(--font-cinzel)', fontSize: 14, fontWeight: 700,
                color: 'var(--accent-gold)', letterSpacing: '0.18em', textTransform: 'uppercase',
                marginBottom: 32,
              }}>{OVERLAY_LABELS[transitionPhase] || 'Adventure'}</div>

              {/* Firefly embers */}
              <div style={{ width: 160, height: 160, position: 'relative' }}>
                {FIREFLY_EMBERS.map((e, i) => (
                  <div key={i} style={{
                    position: 'absolute', left: e.x, top: e.y,
                    width: e.size, height: e.size, borderRadius: '50%',
                    background: e.color, opacity: 0.65 + i * 0.025,
                    boxShadow: `0 0 ${e.glow}px rgba(201,168,76,0.6), 0 0 ${Math.round(e.glow * 2.5)}px rgba(201,168,76,0.2)`,
                    animation: `${e.anim} ${e.dur}s linear ${e.delay}s infinite`,
                  }} />
                ))}
              </div>

              {/* Lore fragment */}
              <div style={{ marginTop: 30, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{
                  fontFamily: 'var(--font-alegreya)', fontSize: 24, fontStyle: 'italic',
                  color: 'var(--text-heading)', fontWeight: 500,
                  opacity: loreFade ? 1 : 0,
                  transition: 'opacity 0.3s',
                }}>
                  {loreLines[loreIndex % loreLines.length]}
                </span>
              </div>

              {/* Secondary description */}
              <p style={{
                fontFamily: 'var(--font-alegreya-sans)', fontSize: 16,
                color: 'var(--text-muted)', margin: '12px 0 0', textAlign: 'center',
                maxWidth: 400,
              }}>{msg.secondary}</p>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default function InitWizard() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg-main)' }} />}>
      <InitWizardInner />
    </Suspense>
  );
}
