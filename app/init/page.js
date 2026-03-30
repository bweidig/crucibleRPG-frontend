'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import * as api from '@/lib/api';
import AuthAvatar from '@/components/AuthAvatar';
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
    id: 'long-empire',
    era: 'sword-soil',
    name: 'The Long Empire',
    pitch: "The legions march into lands older than the empire knows. Magic is a weapon of war. The soldiers at the front see things command doesn't believe.",
    expandedFlavor: "The legions march with battle mages in every company. Magic isn't mysterious here. It's doctrine. Standardized, drilled, and deployed like any other weapon in the imperial arsenal. That's been enough to conquer everything the empire has encountered so far. But the frontier is changing. The lands ahead were held by older civilizations with deeper power, and the things the scouts are reporting don't die the way they should. Command keeps sending more legions. The soldiers who've been out there long enough have started wondering if more is going to be enough.",
    subTags: [
      { label: 'Magic', value: 'Pervasive' },
      { label: 'Non-human races', value: 'Common' },
      { label: 'Political structure', value: 'Empire' },
      { label: "Civilization's arc", value: 'Rising' },
    ],
    hiddenPrompt: "This is a military-expansionist setting where magic is standardized, institutional, and deployed as a weapon of war. The empire is powerful, organized, and confident. Battle mages operate in every company. Magical doctrine is drilled and regulated like any other part of the military apparatus.\n\nPlay this world as imperial and escalating. The empire has conquered everything it's encountered so far, and that success has bred arrogance at the command level. But the frontier is different. The lands ahead were held by older civilizations with deeper, wilder magic that doesn't follow imperial doctrine. What the scouts are encountering should feel genuinely unsettling, even to characters who use magic daily. The gap between what command believes and what the front line is experiencing is a core tension.\n\nThe tone is epic-scale military fantasy with creeping dread. NPCs should reflect their position in the hierarchy. Officers parrot doctrine. Veterans are quieter and more rattled. Locals on the frontier know things the empire doesn't want to hear. Frame conflicts around duty vs. survival, institutional blindness, and the cost of empire.",
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
                  color: '#b0b8cc', lineHeight: 1.8, margin: 0,
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

function PrebuiltWorldCard({ world, isSelected, isExpanded, onToggle }) {
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
            color: '#b0b8cc', lineHeight: 1.8, margin: '0 0 18px 0',
          }}>{world.expandedFlavor}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {world.subTags.map(tag => (
              <span key={tag.label} style={{
                fontFamily: 'var(--font-alegreya-sans)', fontSize: 13,
                color: '#7082a4', background: '#111528',
                border: '1px solid #1e2540', borderRadius: 4,
                padding: '5px 12px',
              }}>{tag.label}: {tag.value}</span>
            ))}
          </div>
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
                  fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#7082a4',
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
                        color: '#7082a4', background: '#111528',
                        border: '1px solid #1e2540', borderRadius: 4,
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

function Phase2({ selected, onSelect, settingAnswers, setSettingAnswers, selectedWorld, setSelectedWorld, expandedWorld, setExpandedWorld, worldSnapshots, selectedSnapshot, setSelectedSnapshot, customWorldText, setCustomWorldText, anythingElseText, setAnythingElseText }) {
  const mainSettings = SETTINGS.filter(s => s.id !== 'custom');
  const customSetting = SETTINGS.find(s => s.id === 'custom');
  const yourWorldsItem = { id: 'your-worlds', name: 'Your Worlds' };

  const isEra = selected && selected !== 'custom' && selected !== 'your-worlds';
  const eraWorlds = isEra ? PREBUILT_WORLDS.filter(w => w.era === selected) : [];

  const handleWorldToggle = (worldId) => {
    if (selectedWorld === worldId) {
      setSelectedWorld(null);
      setExpandedWorld(null);
    } else {
      setSelectedWorld(worldId);
      setExpandedWorld(worldId);
      setSettingAnswers({});
    }
  };

  const handleSubQuestionInteract = () => {
    setSelectedWorld(null);
    setExpandedWorld(null);
  };

  return (
    <div>
      <PhaseTitle title="Choose Your Setting" subtitle="The world your story lives in. Pick one or build your own." />

      {/* Era grid */}
      <div className={styles.twoColGrid} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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

      {/* Custom + Your Worlds row */}
      <div className={styles.twoColGrid} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
        <SelectionCard item={customSetting} selected={selected} onSelect={onSelect}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <IconBox name={customSetting.icon} color={selected === 'custom' ? 'var(--accent-gold)' : 'var(--text-muted)'} />
            <div>
              <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 17, fontWeight: 700, color: 'var(--text-heading)' }}>{customSetting.name}</span>
              <p style={{ fontFamily: 'var(--font-alegreya)', fontSize: 15, color: 'var(--text-muted)', margin: '6px 0 0' }}>{customSetting.desc}</p>
            </div>
          </div>
        </SelectionCard>

        <SelectionCard item={yourWorldsItem} selected={selected} onSelect={onSelect}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <IconBox name="your_worlds" color={selected === 'your-worlds' ? 'var(--accent-gold)' : 'var(--text-muted)'} />
            <div>
              <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 17, fontWeight: 700, color: 'var(--text-heading)' }}>Your Worlds</span>
              <p style={{ fontFamily: 'var(--font-alegreya)', fontSize: 15, color: 'var(--text-muted)', margin: '6px 0 0' }}>
                {worldSnapshots.length > 0 ? `${worldSnapshots.length} saved` : 'No saved worlds yet'}
              </p>
            </div>
          </div>
        </SelectionCard>
      </div>

      {/* Custom path */}
      {selected === 'custom' && (
        <div style={{ marginTop: 16 }}>
          <textarea value={customWorldText} onChange={e => setCustomWorldText(e.target.value)} placeholder="Describe your world..." className={styles.wizardInput} style={{
            width: '100%', minHeight: 110, background: 'var(--bg-main)', border: '1px solid var(--border-gold-faint)',
            borderRadius: 8, padding: 16, fontFamily: 'var(--font-alegreya)', fontSize: 16,
            color: 'var(--text-primary)', outline: 'none', resize: 'vertical', boxSizing: 'border-box',
          }} />
        </div>
      )}

      {/* Your Worlds path */}
      {selected === 'your-worlds' && (
        <WorldSnapshotList
          snapshots={worldSnapshots}
          selectedSnapshot={selectedSnapshot}
          setSelectedSnapshot={setSelectedSnapshot}
          anythingElseText={anythingElseText}
          setAnythingElseText={setAnythingElseText}
        />
      )}

      {/* Era path: pre-built worlds + build your own */}
      {isEra && (
        <div style={{ marginTop: 24 }}>
          {/* Pre-built world cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {eraWorlds.map(world => (
              <div key={world.id}>
                <PrebuiltWorldCard
                  world={world}
                  isSelected={selectedWorld === world.id}
                  isExpanded={expandedWorld === world.id}
                  onToggle={handleWorldToggle}
                />
                {/* "Anything else?" for selected pre-built world */}
                {selectedWorld === world.id && (
                  <div style={{ marginTop: 16 }}>
                    <label style={{
                      fontFamily: 'var(--font-alegreya-sans)', fontSize: 15, fontWeight: 600,
                      color: 'var(--text-secondary)', display: 'block', marginBottom: 10,
                    }}>Anything else?</label>
                    <textarea value={anythingElseText} onChange={e => setAnythingElseText(e.target.value)} placeholder="Any tweaks for this playthrough? Change the political situation, add a detail, shift the tone." className={styles.wizardInput} style={{
                      width: '100%', minHeight: 80, background: 'var(--bg-main)', border: '1px solid var(--border-gold-subtle)',
                      borderRadius: 8, padding: 16, fontFamily: 'var(--font-alegreya)', fontSize: 16,
                      color: 'var(--text-primary)', outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                    }} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Divider */}
          <SectionDivider text="or shape your own" />

          {/* Build Your Own sub-questions */}
          <SettingQuestions
            settingId={selected}
            answers={settingAnswers}
            setAnswers={setSettingAnswers}
            onInteract={handleSubQuestionInteract}
            freeformText={anythingElseText}
            setFreeformText={setAnythingElseText}
          />
        </div>
      )}
    </div>
  );
}

function CharacterForm({ character, onChange }) {
  const personalityTraits = ['Cautious', 'Bold', 'Calculating', 'Impulsive', 'Charming', 'Blunt', 'Curious', 'Stoic', 'Idealistic', 'Cynical'];
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
            color: '#7082a4', background: '#111528',
            border: '1px solid #1e2540', borderRadius: 4,
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

function Phase3({ character, onChange, hasArchetypes, availableArchetypes, characterMode, setCharacterMode, selectedArchetype, setSelectedArchetype }) {
  const effectiveMode = hasArchetypes ? characterMode : 'custom';

  const handleArchetypeSelect = (archetypeId) => {
    if (selectedArchetype === archetypeId) {
      setSelectedArchetype(null);
      return;
    }
    const arch = availableArchetypes.find(a => a.id === archetypeId);
    if (arch) {
      setSelectedArchetype(archetypeId);
      onChange('backstory', arch.backstory);
      onChange('personality', arch.personality.join(','));
    }
  };

  return (
    <div>
      <PhaseTitle title="Create Your Character" subtitle="Write as much or as little as you want. The engine builds your stats, skills, and gear from what you give it." />

      {/* Mode selector */}
      {hasArchetypes ? (
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {[
            { id: 'archetype', label: 'Archetype' },
            { id: 'custom', label: 'Full Custom' },
          ].map(mode => {
            const isActive = effectiveMode === mode.id;
            return (
              <button key={mode.id} onClick={() => setCharacterMode(mode.id)} className={styles.optionToggle} style={{
                flex: 1, padding: '11px 0', textAlign: 'center',
                fontFamily: 'var(--font-alegreya-sans)', fontSize: 15, fontWeight: 600,
                color: isActive ? 'var(--accent-gold)' : 'var(--text-muted)',
                background: isActive ? 'var(--bg-gold-light)' : 'var(--bg-main)',
                border: `1px solid ${isActive ? 'var(--border-card-hover)' : 'var(--border-gold-faint)'}`,
                borderRadius: 6,
              }}>{mode.label}</button>
            );
          })}
        </div>
      ) : (
        <p style={{
          fontFamily: 'var(--font-alegreya-sans)', fontSize: 14,
          color: 'var(--text-dim)', margin: '-16px 0 24px',
        }}>Custom settings use the full character form.</p>
      )}

      {/* Archetype grid */}
      {effectiveMode === 'archetype' && hasArchetypes && (
        <div style={{ marginBottom: 32 }}>
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
        </div>
      )}

      {/* Character form */}
      <CharacterForm character={character} onChange={onChange} />
    </div>
  );
}

function Phase4({ stats: initialStats, onStatsChange, skills, foundationalSkills, startingLoadout, factionStandings, innateTraits, softWarnings, hardErrors, onHardErrorsClear, skillRequests, onSkillRequestsChange, gearRequests, onGearRequestsChange, onRegenerate, regenerating }) {
  const [editing, setEditing] = useState(false);
  const [stats, setStats] = useState(initialStats);
  const [editingStatName, setEditingStatName] = useState(null);
  const [editInputValue, setEditInputValue] = useState('');

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
          color: '#7082a4',
        }}>
          Total: <span style={{ color: 'var(--text-heading)', fontWeight: 500 }}>{statTotal.toFixed(1)}</span>
        </div>
        <button onClick={() => setEditing(!editing)} className={styles.adjustBtn} style={{
          fontFamily: 'var(--font-cinzel)', fontSize: 12, fontWeight: 700,
          color: editing ? 'var(--bg-main)' : 'var(--text-secondary)', letterSpacing: '0.08em',
          background: editing ? 'linear-gradient(135deg, var(--accent-gold), var(--accent-bright))' : 'transparent',
          border: `1px solid ${editing ? 'transparent' : '#1e2540'}`,
          borderRadius: 5, padding: '9px 24px',
        }}>{editing ? 'LOCK' : 'ADJUST'}</button>
      </div>

      <div style={{
        background: '#111528', border: '1px solid #1e2540', borderRadius: 10, padding: '8px 0',
        marginBottom: 20,
      }}>
        {stats.map((s, i) => {
          const pct = (s.value / 20) * 100;
          const changed = Math.abs(s.value - initialStats[i].value) > 0.05;
          const delta = s.value - initialStats[i].value;
          return (
            <div key={s.name} style={{
              padding: '16px 24px',
              borderBottom: i < stats.length - 1 ? '1px solid #1e2540' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{s.emoji}</span>
                <span style={{
                  fontFamily: 'var(--font-cinzel)', fontSize: 15, fontWeight: 700,
                  color: 'var(--text-heading)', flex: 1,
                }}>{s.name}</span>
                <span style={{
                  fontFamily: 'var(--font-alegreya-sans)', fontSize: 12,
                  color: '#7082a4', fontStyle: 'italic', marginRight: 8,
                }}>{getTier(s.value)}</span>

                {editing ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 0, width: 168, flexShrink: 0, justifyContent: 'flex-end' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <button onClick={() => handleStatChange(s.name, -0.5)} className={styles.statStepBtn} style={{
                        width: 32, height: 32, borderRadius: '6px 0 0 6px',
                        background: '#0d1120', border: '1px solid #1e2540',
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
                            background: 'var(--bg-main)', borderTop: '1px solid #1e2540', borderBottom: '1px solid #1e2540',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: 'var(--font-jetbrains)', fontSize: 15, fontWeight: 500,
                            color: changed ? 'var(--accent-gold)' : 'var(--text-heading)',
                            cursor: 'text',
                          }}>{s.value.toFixed(1)}</div>
                      )}
                      <button onClick={() => handleStatChange(s.name, 0.5)} className={styles.statStepBtn} style={{
                        width: 32, height: 32, borderRadius: '0 6px 6px 0',
                        background: '#0d1120', border: '1px solid #1e2540',
                        color: 'var(--text-secondary)', fontSize: 18, fontWeight: 700,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>+</button>
                    </div>
                    <span style={{
                      fontFamily: 'var(--font-jetbrains)', fontSize: 11,
                      color: delta > 0 ? '#8aba7a' : '#e8845a',
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
                      background: '#1e2540', borderRadius: 4,
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

      {/* Backstory Skills */}
      {skills && skills.length > 0 && (
        <div style={{
          background: '#111528', border: '1px solid #1e2540', borderRadius: 6, padding: '10px 16px',
          fontFamily: 'var(--font-alegreya-sans)', fontSize: 15, color: '#7082a4', marginBottom: 10,
        }}>
          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Skills: </span>
          {skills.join(', ')}
        </div>
      )}

      {/* Innate Traits */}
      {innateTraits && innateTraits.length > 0 && (
        <div style={{
          background: '#111528', border: '1px solid #1e2540', borderRadius: 6, padding: '10px 16px',
          fontFamily: 'var(--font-alegreya-sans)', fontSize: 15, color: '#7082a4', marginBottom: 10,
        }}>
          <div style={{ color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 6 }}>Innate Traits</div>
          {innateTraits.map((t, i) => {
            const hasPenalty = t.penalty != null;
            const hasDetail = t.effect || t.value != null || hasPenalty || t.stat;
            return (
              <div key={i} style={{ padding: '4px 0', borderBottom: i < innateTraits.length - 1 ? '1px solid #1a1e30' : 'none' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ color: hasPenalty ? '#e8a04a' : 'var(--text-heading)', fontWeight: 500 }}>{formatTraitName(t.trait)}</span>
                  <span style={{ color: '#6b83a3', fontSize: 12, fontStyle: 'italic' }}>{t.source}</span>
                </div>
                {hasDetail && (
                  <div style={{ fontSize: 13, color: hasPenalty ? '#e8a04a' : '#6b83a3', marginTop: 2, paddingLeft: 2 }}>
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

      {/* Foundational Skills */}
      {foundationalSkills && foundationalSkills.length > 0 && (
        <div style={{
          background: '#111528', border: '1px solid #1e2540', borderRadius: 6, padding: '10px 16px',
          fontFamily: 'var(--font-alegreya-sans)', fontSize: 15, color: '#7082a4', marginBottom: 10,
        }}>
          <div style={{ color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 6 }}>Foundational Skills</div>
          {foundationalSkills.map((fs, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '2px 0' }}>
              <span style={{ color: 'var(--text-heading)' }}>{fs.name || fs.scope}</span>
              {fs.modifier != null && (
                <span style={{ color: 'var(--accent-gold)', fontSize: 14, fontFamily: 'var(--font-jetbrains)', fontWeight: 600 }}>+{Number(fs.modifier).toFixed(1)}</span>
              )}
              <span style={{ color: '#7082a4', fontSize: 12 }}>({fs.breadthCategory})</span>
              <span style={{ color: 'var(--accent-gold)', fontSize: 12, fontFamily: 'var(--font-jetbrains)' }}>{fs.stat}</span>
            </div>
          ))}
        </div>
      )}

      {/* Starting Loadout */}
      {startingLoadout && startingLoadout.length > 0 && (
        <div style={{
          background: '#111528', border: '1px solid #1e2540', borderRadius: 6, padding: '10px 16px',
          fontFamily: 'var(--font-alegreya-sans)', fontSize: 15, color: '#7082a4', marginBottom: 10,
        }}>
          <div style={{ color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 6 }}>Starting Loadout</div>
          {startingLoadout.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0' }}>
              <span style={{ color: 'var(--text-heading)' }}>{item.name}</span>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 12, color: '#7082a4' }}>{item.slotCost} slots</span>
                <span style={{ fontSize: 12, color: '#6b83a3', fontStyle: 'italic' }}>{item.materialQuality}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Faction Standings */}
      {factionStandings && factionStandings.length > 0 && (
        <div style={{
          background: '#111528', border: '1px solid #1e2540', borderRadius: 6, padding: '10px 16px',
          fontFamily: 'var(--font-alegreya-sans)', fontSize: 15, color: '#7082a4', marginBottom: 10,
        }}>
          <div style={{ color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 6 }}>Faction Standings</div>
          {factionStandings.map((fs, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
              <span style={{ color: 'var(--text-heading)' }}>{fs.factionName}</span>
              <span style={{
                fontFamily: 'var(--font-jetbrains)', fontSize: 13,
                color: fs.standing > 0 ? '#8aba7a' : fs.standing < 0 ? '#e8845a' : '#8a94a8',
              }}>
                {fs.standing > 0 ? '+' : ''}{fs.standing}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Inventory Slots */}
      <div style={{
        background: '#111528', border: '1px solid #1e2540', borderRadius: 6, padding: '10px 16px',
        fontFamily: 'var(--font-alegreya-sans)', fontSize: 15, color: '#7082a4',
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
          fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#7082a4',
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
        >{regenerating ? 'REGENERATING...' : 'REGENERATE PROPOSAL'}</button>
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

function Phase6({ intensity, setIntensity, scenario, setScenario, customStartText, setCustomStartText, scenariosLoading, displayScenarios }) {
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
              background: intensity === int.id ? 'var(--bg-gold-subtle)' : 'var(--bg-main)',
              border: `1px solid ${intensity === int.id ? 'var(--border-card-hover)' : 'var(--border-gold-faint)'}`,
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
          {displayScenarios.map(s => (
            <SelectionCard key={s.key} item={s} selected={scenario} onSelect={setScenario}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <IconBox name={s.icon} color={scenario === s.key ? 'var(--accent-gold)' : 'var(--text-muted)'} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
                    <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 15, fontWeight: 700, color: 'var(--accent-gold)' }}>Option {s.key}</span>
                    <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 17, fontWeight: 600, color: 'var(--text-heading)' }}>{s.name}</span>
                    <span style={{ fontFamily: 'var(--font-alegreya)', fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>{s.type}</span>
                  </div>
                  <p style={{ fontFamily: 'var(--font-alegreya)', fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
                </div>
              </div>
            </SelectionCard>
          ))}
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

// --- MAIN ---

function InitWizardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlGameId = searchParams.get('gameId') || searchParams.get('id');
  const [createdGameId, setCreatedGameId] = useState(null);
  const gameId = urlGameId || createdGameId;

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
  const [character, setCharacter] = useState({ name: '', backstory: '', personality: '', personalityCustom: '', appearance: '', pronouns: '', customPronouns: '', genderIdentity: '' });
  const [selectedArchetype, setSelectedArchetype] = useState(null);
  const [characterMode, setCharacterMode] = useState('archetype');
  const [difficulty, setDifficulty] = useState(null);
  const [intensity, setIntensity] = useState('standard');
  const [scenario, setScenario] = useState(null);
  const [customStartText, setCustomStartText] = useState('');

  // --- API interaction state ---
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [worldGenStatus, setWorldGenStatus] = useState(null); // null, 'generating', 'complete', 'error'
  const [proposalLoading, setProposalLoading] = useState(false);
  const [proposal, setProposal] = useState(null);
  const [adjustedStats, setAdjustedStats] = useState(null);
  const [proposalValidation, setProposalValidation] = useState({ hardErrors: [], softWarnings: [] });
  const [skillRequests, setSkillRequests] = useState('');
  const [gearRequests, setGearRequests] = useState('');
  const [scenariosLoading, setScenariosLoading] = useState(false);
  const [scenarioCache, setScenarioCache] = useState({});
  const worldPollRef = useRef(null);
  const bottomNavRef = useRef(null);
  const [scrollFadeVisible, setScrollFadeVisible] = useState(false);
  const [bottomNavHeight, setBottomNavHeight] = useState(0);

  // --- Scroll fade indicator ---
  useEffect(() => {
    const measure = () => {
      if (bottomNavRef.current) setBottomNavHeight(bottomNavRef.current.offsetHeight);
    };
    const check = () => {
      measure();
      const { scrollY, innerHeight } = window;
      const { scrollHeight } = document.documentElement;
      const atBottom = scrollY + innerHeight >= scrollHeight - 20;
      const hasScroll = scrollHeight > innerHeight + 20;
      setScrollFadeVisible(hasScroll && !atBottom);
    };
    const raf = requestAnimationFrame(check);
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, [phase]);

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

  // --- Generate proposal when entering Phase 4 (attributes) ---
  useEffect(() => {
    if (phase === 3 && !proposal && !proposalLoading && gameId) {
      generateProposal();
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Fetch scenarios when entering Phase 6 or when intensity changes ---
  useEffect(() => {
    if (phase === 5 && gameId && !scenarioCache[intensity]) {
      fetchScenarios(intensity);
    }
  }, [phase, intensity]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Clear error on phase change or input ---
  useEffect(() => {
    setError(null);
  }, [phase, storyteller, setting, settingAnswers, selectedWorld, selectedSnapshot, character, difficulty, scenario, intensity]);

  // --- Cleanup world gen polling on unmount ---
  useEffect(() => {
    return () => {
      if (worldPollRef.current) clearTimeout(worldPollRef.current);
    };
  }, []);

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
    await api.post(`/api/init/${gameId}/setting`, body);
    // Start world generation polling
    setWorldGenStatus('generating');
    pollWorldStatus();
  };

  const pollWorldStatus = async () => {
    try {
      const res = await api.get(`/api/init/${gameId}/world-status`);
      if (res.status === 'complete') {
        setWorldGenStatus('complete');
        return;
      }
      worldPollRef.current = setTimeout(pollWorldStatus, 2000);
    } catch (err) {
      setWorldGenStatus('error');
    }
  };

  const saveCharacter = async () => {
    await api.post(`/api/init/${gameId}/character`, {
      name: character.name.trim(),
      backstory: character.backstory || null,
      personality: character.personality || null,
      personalityCustom: character.personalityCustom || null,
      appearance: character.appearance || null,
      gender: character.customPronouns || character.pronouns || null,
      customPronouns: character.customPronouns || null,
      archetypeId: selectedArchetype || null,
    });
  };

  const generateProposal = async () => {
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
    setAdjustedStats(null);
    try {
      const reqBody = {};
      if (skillRequests.trim()) reqBody.skillRequests = skillRequests.trim();
      if (gearRequests.trim()) reqBody.gearRequests = gearRequests.trim();
      const res = await api.post(`/api/init/${gameId}/generate-proposal`, Object.keys(reqBody).length > 0 ? reqBody : undefined);
      const p = res.proposal || res;
      const rawStats = p.stats || {};
      const statsArray = Object.entries(rawStats)
        .filter(([abbr]) => STAT_META[abbr])
        .map(([abbr, value]) => ({
          name: STAT_META[abbr].name,
          abbr,
          emoji: STAT_META[abbr].emoji,
          value,
        }));
      setProposal({
        stats: statsArray.length > 0 ? statsArray : SAMPLE_STATS,
        skills: Array.isArray(p.skills) ? p.skills : [],
        foundationalSkills: Array.isArray(p.foundationalSkills) ? p.foundationalSkills : [],
        startingLoadout: Array.isArray(p.startingLoadout) ? p.startingLoadout : [],
        factionStandings: Array.isArray(p.factionStandings) ? p.factionStandings : [],
        narrativeBackstory: p.narrativeBackstory || null,
        innateTraits: Array.isArray(p.innateTraits) ? p.innateTraits : [],
        species: p.species || null,
        _fallback: statsArray.length === 0,
      });
      const v = res.validation || {};
      setProposalValidation({
        hardErrors: Array.isArray(v.hardErrors) ? v.hardErrors : [],
        softWarnings: Array.isArray(v.softWarnings) ? v.softWarnings : [],
      });
    } catch (err) {
      // TODO: remove SAMPLE_STATS fallback when API is stable
      console.log('Proposal generation failed, using fallback:', err.message);
      setProposal({ stats: SAMPLE_STATS, _fallback: true });
    } finally {
      setProposalLoading(false);
    }
  };

  const saveAttributes = async () => {
    const statsArray = adjustedStats || proposal?.stats || SAMPLE_STATS;
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
    // TODO: Use API presets when available, fall back to DIFFICULTIES
    await api.post(`/api/init/${gameId}/difficulty`, {
      preset: difficulty,
    });
  };

  const fetchScenarios = async (intensityId) => {
    setScenariosLoading(true);
    setScenario(null);
    try {
      const res = await api.post(`/api/init/${gameId}/generate-scenarios`, {
        intensity: intensityId.charAt(0).toUpperCase() + intensityId.slice(1),
      });
      const scenarios = res.scenarios || res;
      if (Array.isArray(scenarios) && scenarios.length > 0) {
        // Map API response to match SCENARIOS shape (key, name, type, icon, desc)
        const mapped = scenarios.map((s, i) => ({
          key: s.key || String.fromCharCode(65 + i),
          name: s.name || s.title || `Scenario ${String.fromCharCode(65 + i)}`,
          type: s.type || s.category || '',
          icon: s.icon || SCENARIOS[i]?.icon || 'custom_start',
          desc: s.desc || s.description || '',
        }));
        // Always include Option D (Custom Start) if API didn't provide it
        if (!mapped.find(s => s.key === 'D')) {
          mapped.push(SCENARIOS[3]); // Custom Start
        }
        setScenarioCache(prev => ({ ...prev, [intensityId]: mapped }));
      } else {
        setScenarioCache(prev => ({ ...prev, [intensityId]: null }));
      }
    } catch (err) {
      console.log('Scenario generation failed, using fallback:', err.message);
    } finally {
      setScenariosLoading(false);
    }
  };

  const saveScenario = async () => {
    const indexMap = { A: 0, B: 1, C: 2 };
    const body = scenario === 'D'
      ? { scenarioIndex: 'custom', customStart: { description: customStartText } }
      : { scenarioIndex: indexMap[scenario] };
    await api.post(`/api/init/${gameId}/select-scenario`, body);
  };

  // --- Navigation ---

  const canAdvance = () => {
    switch (phase) {
      case 0: return !!storyteller;
      case 1: return !!setting;
      case 2: return character.name.trim().length > 0 && (!gameId || worldGenStatus === 'complete');
      case 3: return !proposalLoading && !(proposalValidation.hardErrors.length > 0);
      case 4: return !!difficulty;
      case 5: return !!scenario && !scenariosLoading;
      default: return false;
    }
  };

  const handleNext = async () => {
    if (!canAdvance() || saving) return;

    // If no gameId yet (creation pending or failed), advance locally
    if (!gameId) {
      if (phase === 5) {
        router.push('/menu');
      } else {
        setPhase(p => p + 1);
      }
      return;
    }

    setSaving(true);
    setError(null);

    try {
      switch (phase) {
        case 0:
          await saveStoryteller();
          setPhase(1);
          break;
        case 1:
          await saveSetting();
          setPhase(2);
          break;
        case 2:
          await saveCharacter();
          setPhase(3);
          break;
        case 3:
          await saveAttributes();
          setPhase(4);
          break;
        case 4:
          await saveDifficulty();
          setPhase(5);
          break;
        case 5:
          await saveScenario();
          // Write loading summary to sessionStorage for the play page overlay
          try {
            const settingName = SETTINGS.find(s => s.id === setting)?.name || setting || null;
            const difficultyName = DIFFICULTIES.find(d => d.id === difficulty)?.name || difficulty || null;
            const stName = storyteller ? storyteller.charAt(0).toUpperCase() + storyteller.slice(1) : null;
            sessionStorage.setItem('crucible_loading_summary', JSON.stringify({
              characterName: character?.name || null,
              worldName: settingName,
              storyteller: stName,
              difficulty: difficultyName,
            }));
          } catch { /* sessionStorage may be unavailable */ }
          router.push(`/play?gameId=${gameId}`);
          break;
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCharChange = (key, val) => setCharacter(prev => ({ ...prev, [key]: val }));

  const buttonEnabled = canAdvance() && !saving;

  return (
    <div className={styles.pageContainer} style={{
      minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-primary)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      {/* Header */}
      <div style={{
        width: '100%', padding: '18px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-gold-faint)', boxSizing: 'border-box',
      }}>
        <Link href="/menu" style={{ textDecoration: 'none', display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 22, fontWeight: 900, color: 'var(--accent-gold)', letterSpacing: '0.06em' }}>
            CRUCIBLE
          </span>
          <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 12, fontWeight: 600, color: 'var(--gold-muted)', letterSpacing: '0.18em' }}>
            RPG
          </span>
        </Link>
        <AuthAvatar size={32} />
      </div>

      {/* Offline banner */}
      {connectionFailed && !gameId && (
        <div style={{
          width: '100%', maxWidth: 740, margin: '0 auto', padding: '12px 28px 0',
          boxSizing: 'border-box',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
            background: '#1a1610', border: '1px solid #3d3322', borderRadius: 6,
            fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#d4a84b',
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
        </div>
      )}

      {/* Content */}
      <div style={{
        width: '100%', maxWidth: 740, padding: '44px 28px 100px', flex: 1, boxSizing: 'border-box',
      }}>
        <StepIndicator steps={STEP_NAMES} current={phase} />

        {phase === 0 && <Phase1 selected={storyteller} onSelect={setStoryteller} customText={customStorytellerText} setCustomText={setCustomStorytellerText} />}
        {phase === 1 && (
          <Phase2
            selected={setting}
            onSelect={(id) => {
              if (id !== setting) {
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
            settingAnswers={settingAnswers}
            setSettingAnswers={setSettingAnswers}
            selectedWorld={selectedWorld}
            setSelectedWorld={setSelectedWorld}
            expandedWorld={expandedWorld}
            setExpandedWorld={setExpandedWorld}
            worldSnapshots={worldSnapshots}
            selectedSnapshot={selectedSnapshot}
            setSelectedSnapshot={setSelectedSnapshot}
            customWorldText={customWorldText}
            setCustomWorldText={setCustomWorldText}
            anythingElseText={anythingElseText}
            setAnythingElseText={setAnythingElseText}
          />
        )}
        {phase === 2 && (() => {
          const archetypeEra = setting === 'custom' ? null
            : setting === 'your-worlds' ? (selectedSnapshot ? worldSnapshots.find(s => s.id === selectedSnapshot)?.settingType : null)
            : setting;
          const availableArchetypes = archetypeEra ? (ARCHETYPES[archetypeEra] || []) : [];
          const hasArchetypes = availableArchetypes.length > 0;
          return (
            <>
              {worldGenStatus === 'generating' && (
                <div style={{ marginBottom: 20, fontFamily: 'var(--font-alegreya-sans)', fontSize: 15, color: 'var(--accent-gold)' }}>
                  Generating your world...
                </div>
              )}
              {worldGenStatus === 'error' && (
                <div style={{ marginBottom: 20, fontFamily: 'var(--font-alegreya-sans)', fontSize: 15, color: '#c84a4a' }}>
                  World generation failed. Please go back and try again.
                </div>
              )}
              <Phase3
                character={character}
                onChange={handleCharChange}
                hasArchetypes={hasArchetypes}
                availableArchetypes={availableArchetypes}
                characterMode={characterMode}
                setCharacterMode={setCharacterMode}
                selectedArchetype={selectedArchetype}
                setSelectedArchetype={setSelectedArchetype}
              />
            </>
          );
        })()}
        {phase === 3 && (
          proposalLoading ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 17, color: 'var(--accent-gold)' }}>
                Deriving your attributes...
              </div>
            </div>
          ) : (
            <Phase4
              stats={proposal?.stats || SAMPLE_STATS}
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
              onSkillRequestsChange={setSkillRequests}
              gearRequests={gearRequests}
              onGearRequestsChange={setGearRequests}
              onRegenerate={generateProposal}
              regenerating={proposalLoading}
            />
          )
        )}
        {phase === 4 && <Phase5 selected={difficulty} onSelect={setDifficulty} />}
        {phase === 5 && <Phase6 intensity={intensity} setIntensity={setIntensity} scenario={scenario} setScenario={setScenario} customStartText={customStartText} setCustomStartText={setCustomStartText} scenariosLoading={scenariosLoading} displayScenarios={scenarioCache[intensity] || SCENARIOS} />}
      </div>

      {/* Scroll fade indicator */}
      <div className={styles.scrollFade} style={{ opacity: scrollFadeVisible ? 1 : 0, bottom: bottomNavHeight }} />

      {/* Bottom Nav */}
      <div ref={bottomNavRef} className={styles.bottomNav} style={{
        position: 'sticky', bottom: 0, width: '100%', padding: '18px 28px',
        background: 'var(--bg-main)', backdropFilter: 'blur(8px)',
        borderTop: '1px solid var(--border-gold-faint)', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', boxSizing: 'border-box', flexWrap: 'wrap', gap: 8, zIndex: 6,
      }}>
        <button
          onClick={() => { setPhase(p => { if (p === 5) setScenarioCache({}); return Math.max(0, p - 1); }); setError(null); }}
          disabled={phase === 0}
          className={styles.btnBack}
          style={{
            fontFamily: 'var(--font-cinzel)', fontSize: 14, fontWeight: 600,
            color: phase === 0 ? 'var(--text-dim)' : 'var(--text-secondary)',
            background: 'transparent',
            border: phase === 0 ? '1px solid var(--border-gold-faint)' : '1px solid var(--border-card)',
            borderRadius: 5, cursor: phase === 0 ? 'default' : 'pointer',
            padding: '10px 24px', letterSpacing: '0.06em',
          }}
        >&larr; BACK</button>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <span style={{
            fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: 'var(--text-dim)',
          }}>Phase {phase + 1} of {STEP_NAMES.length}</span>
          {error && (
            <span style={{
              fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#c84a4a',
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
            letterSpacing: '0.08em',
          }}
        >
          {saving ? 'SAVING...' : phase === 5 ? 'BEGIN ADVENTURE' : 'CONTINUE'}
        </button>
      </div>
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
