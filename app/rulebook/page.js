'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

// --- SECTION DATA ---
// Content ported verbatim from approved mockup (rulebook-full.jsx)

const QUICK_START = {
  id: 'quick-start',
  number: 0,
  title: 'Quick Start',
  isQuickStart: true,
  content: `
    <p>CrucibleRPG is a solo RPG powered by AI. You play a character in a world with real rules: stats, dice rolls, inventory, consequences. The AI is your Game Master. It narrates the world, plays the NPCs, and resolves your actions through the system.</p>

    <h3>Getting Started</h3>
    <p>When you create a new game, you'll choose:</p>
    <ol>
      <li>A <strong>Storyteller</strong> (the narrative voice of your GM)</li>
      <li>A <strong>Setting</strong> (the genre and world type)</li>
      <li>Your <strong>Character</strong> (name, backstory, personality, appearance)</li>
      <li>A <strong>Difficulty level</strong> (adjustable anytime)</li>
      <li>A <strong>Starting Scenario</strong> (how your story begins)</li>
    </ol>
    <p>The GM builds your stats, skills, and starting gear based on your backstory. You review and adjust everything before confirming.</p>

    <h3>How Turns Work</h3>
    <p>Each turn:</p>
    <ul>
      <li>The GM describes what's happening</li>
      <li>You see three suggested actions plus the option to write your own</li>
      <li>You pick one (or describe something entirely different)</li>
      <li>The system rolls dice, resolves the outcome, and the story continues</li>
    </ul>
    <p>You're never limited to the suggestions. If you can describe it, you can try it.</p>

    <h3>The Basics You Need to Know</h3>
    <p>Your character has stats (<strong>STR</strong>, <strong>DEX</strong>, <strong>CON</strong>, <strong>INT</strong>, <strong>WIS</strong>, <strong>CHA</strong>, and sometimes <strong>POT</strong> for supernatural abilities). These determine how good you are at things. When you attempt something risky, the system adds your stat + any relevant skills + a dice roll and compares it to the difficulty.</p>
    <p>Results aren't just pass/fail. There are six levels, from Critical Success down to Critical Failure. Even a partial failure might teach you something or give you a small advantage.</p>

    <h3>Things That Matter</h3>
    <ul>
      <li><strong>Skills grow through play.</strong> Genuine challenges make you stronger. Easy repetition doesn't.</li>
      <li><strong>Inventory has weight.</strong> You can't carry everything. Choose what matters.</li>
      <li><strong>Items degrade.</strong> Weapons dull, armor cracks. Maintain your gear or replace it.</li>
      <li><strong>The world remembers.</strong> NPCs form opinions. Factions track your reputation. Actions have consequences.</li>
      <li><strong>Death is rare but real.</strong> When it happens, you choose: rewind and try again, or let the story stand.</li>
    </ul>

    <h3>Helpful Features</h3>
    <ul>
      <li><strong>Talk to the GM</strong> answers rules questions for free. Escalate to a live GM response if the rulebook doesn't cover it (costs a turn).</li>
      <li><strong>Briefing</strong> gives you a full summary of your story, relationships, open threads, and objectives. No cost.</li>
      <li><strong>Difficulty dials</strong> can be adjusted anytime. Make combat harder, turn off item degradation, speed up progression. It's your game.</li>
    </ul>

    <div class="quickstart-callout">Don't worry about memorizing rules. The system handles the mechanics. You just play your character. The full Rulebook below is there when you want to understand how something works, but you don't need to read it before you start.</div>
  `,
};

const SECTIONS = [
  {
    id: 'how-the-game-works', number: 1, title: 'How the Game Works',
    content: `<p>CrucibleRPG is a solo tabletop RPG powered by AI. You play a character in a living world with real mechanical rules: stats, skills, dice rolls, inventory, conditions. All of it managed by the server. The AI acts as your Game Master, narrating the world, playing NPCs, and resolving your actions through the rule system.</p><h3>The Turn Loop</h3><p>Each turn follows a simple pattern:</p><ul><li>The GM describes what's happening around you</li><li>You see three suggested actions plus the option to write your own</li><li>You pick an action (or describe something entirely different)</li><li>The system resolves it using your character's abilities, the situation's difficulty, and a dice roll</li><li>The result shapes the story going forward</li></ul><p>The three suggested actions cover different approaches (direct, subtle, resourceful), but you're never limited to them. If you can describe it, you can try it.</p><h3>What Makes This Different</h3><p>This isn't a chatbot. Every action you take passes through a mechanical engine with real numbers, real consequences, and real stakes. Your character can be injured, exhausted, or worse. Your inventory has weight. Your skills improve through use. The world remembers what you've done.</p><h3>Talk to the GM</h3><p>If you're unsure about a rule or want to understand something about the game, use the Talk to the GM button. It checks the rulebook first for a quick answer at no cost. If the rulebook doesn't cover your question, you can escalate to a live GM response, which costs a turn.</p><h3>Briefing</h3><p>If you need a full picture of where you are in the game, request a Briefing. It covers: the story so far, your current situation, open threads (including things NPCs have promised you and things you've promised them), your relationships, the state of the world, and your active objectives. No turn cost. This is the "catch me up on everything" button.</p><div class="mechanic-callout">The GM has perfect memory, infinite patience, and a rulebook it actually follows every time.</div>`,
  },
  {
    id: 'your-character', number: 2, title: 'Your Character',
    content: `<p>Your character is defined by their core attributes, a set of skills, and the backstory you create. Together, these shape what your character is good at, what they struggle with, and how the world responds to them.</p><h3>Core Attributes</h3><p>Every character has seven possible stats, rated on a scale from 1.0 (novice) to 20.0 (peak mortal). 21.0+ is supernatural territory.</p><ul><li><strong>STR</strong> \u2014 Physical power. Melee damage, forcing doors, carrying capacity.</li><li><strong>DEX</strong> \u2014 Coordination and speed. Ranged accuracy, stealth, reflexes.</li><li><strong>CON</strong> \u2014 Fortitude. Resisting disease, enduring exhaustion, staying alive. When this hits zero, you face a Fate Check.</li><li><strong>INT</strong> \u2014 Reasoning and memory. Technical tasks, learning, crafting.</li><li><strong>WIS</strong> \u2014 Intuition and perception. Reading people, spotting danger, willpower.</li><li><strong>CHA</strong> \u2014 Social presence. Persuasion, intimidation, merchant dealings.</li><li><strong>POT</strong> \u2014 Supernatural capacity. Magic, psionics, divine gifts, or advanced tech. <em>Conditional: only present for characters with supernatural abilities.</em></li></ul><p>Mundane characters have six stats. POT won't appear on their sheet and no supernatural rules apply. Characters with POT spread their capability across seven stats instead of six. Power always has a cost.</p><h3>Effective Stat</h3><p>Your base stat modified by any active conditions. A character with STR 9.0 suffering a -1.0 injury has an Effective STR of 8.0. This is what's used for rolls.</p><h3>Backstory Tiers</h3><p>Your backstory determines your starting power level:</p><ul><li><strong>Novice</strong> (stats ~3\u20136) \u2014 Untested, just starting out</li><li><strong>Competent</strong> (stats ~5\u20139) \u2014 A capable adult with some experience</li><li><strong>Veteran</strong> (stats ~7\u201311) \u2014 Seasoned and skilled</li><li><strong>Legendary</strong> (exceeds normal ranges) \u2014 Exceptional, bordering on myth</li></ul><p>These are starting points, not ceilings. You grow through play.</p><h3>Character Creation</h3><p>During creation, the GM proposes stats, skills, faction standings, and starting gear based on your backstory. You review everything and can adjust before confirming. The numbers should match the character in your head. If they don't, change them.</p><h3>Species</h3><p>Not every world is all-human. Depending on your setting, you may choose from non-human species created during world generation. Each species comes with a physical description, cultural context, and potentially innate traits.</p><ul><li>Advantages that translate to "better at X" become Foundational Skills (a four-armed species might get Multi-Limbed Combat, a winged species might get Aerial Maneuvering)</li><li>Binary capabilities become innate traits: darkvision, elemental resistance, extra carrying capacity</li><li>Some species have drawbacks: sunlight sensitivity, environmental penalties, social stigma</li><li>Proposed by the GM based on your species and backstory, adjustable during character review</li></ul><p>Not all settings have non-human species. If your world is all-human, this doesn't apply.</p><div class="mechanic-callout">The GM proposes your stats based on your story. You get the final say. If the numbers don't match the character in your head, adjust them until they do.</div>`,
  },
  {
    id: 'how-rolls-work', number: 3, title: 'How Rolls Work',
    content: `<p>When you attempt something where the outcome is uncertain and failure matters, the system rolls dice. Routine actions (walking, eating, opening an unlocked door) resolve through narration without a check.</p><h3>The Basic Formula</h3><p>Your total = Effective Stat + Skill Modifier + Equipment Quality + Die Roll</p><p>That total is compared against a Difficulty Class (DC). The margin between your total and the DC determines how well you succeeded or how badly you failed.</p><h3>How a Roll Plays Out</h3><p>Every check follows one sequence:</p><ol><li><strong>The system evaluates your odds.</strong> It compares your total modifier against the DC to determine your Fortune's Balance category:<ul><li><strong>Outmatched</strong> (significantly below the challenge): The system gives you a shot.</li><li><strong>Matched</strong> (in the ballpark): Standard conditions.</li><li><strong>Dominant</strong> (you clearly outclass it): Consistency rewarded.</li></ul></li><li><strong>Natural Extremes are checked.</strong> Every check has a flat 5% chance of a Natural 1 (automatic critical failure) and 5% chance of a Natural 20 (automatic critical success), regardless of your skill level. Nobody is immune to disaster. Nobody is denied a miracle. If a Natural Extreme hits, the result is locked. No further math.</li><li><strong>If no extreme, the dice resolve.</strong> How the dice work depends on your Fortune's Balance category:<ul><li><strong>Matched:</strong> Your d20 result (which already served as the extreme check) becomes your die value. Range: 2\u201319.</li><li><strong>Outmatched:</strong> Roll two dice (range 2\u201319 each), take the HIGHEST. The system gives long shots a better chance.</li><li><strong>Dominant:</strong> Roll two dice (range 2\u201319 each), take the LOWEST. Mastery means consistency, not guaranteed perfection.</li></ul></li><li><strong>Margin determines the outcome.</strong> Your total is compared to the DC and placed into one of six consequence tiers.</li></ol><p>Fortune's Balance can be toggled off in difficulty settings, making every check a straight d20.</p><h3>The 6 Consequence Tiers</h3><p>Results aren't just pass/fail. There are six levels:</p><ol><li><strong>Critical Success</strong> \u2014 Everything goes better than planned. Extra reward.</li><li><strong>Success</strong> \u2014 Clean win. You did what you set out to do.</li><li><strong>Costly Success</strong> \u2014 You succeed, but it costs you something minor. The cost never outweighs the win.</li><li><strong>Small Mercy</strong> \u2014 You fail, but something small goes right. A lesson, a clue, a partial result.</li><li><strong>Failure</strong> \u2014 Clean miss. It didn't work.</li><li><strong>Critical Failure</strong> \u2014 Something goes actively wrong. Extra penalty.</li></ol><p>A Simplified Outcomes toggle is available in difficulty settings, reducing this to binary pass/fail.</p><h3>Dual-Stat Actions</h3><p>Some actions require two stats at once. Intimidation might use STR + CHA. A tricky repair might use INT + DEX. The two stats are averaged, and one skill modifier applies.</p><h3>Voluntary Failure</h3><p>You can choose to fail before a roll is made. Useful for social situations, feigning weakness, or tactical retreats. Must be declared before any dice are rolled. Voluntary failures don't count toward skill progression. The system only grows you through genuine challenge.</p><div class="mechanic-callout">The Crucible Roll is named for what it is. The moment where even mastery meets chance. A 5% shot at glory. A 5% shot at disaster. Every time.</div>`,
  },
  {
    id: 'skills', number: 4, title: 'Skills',
    content: `<p>Skills represent specific training or experience. They add a bonus to relevant rolls, making you more effective at particular tasks.</p><h3>Base Skill Modifiers</h3><ul><li>Derived from your backstory (a sailor has Navigation, a thief has Lockpicking)</li><li>Range from 0.1 to 10.0</li><li>Applied automatically when relevant. You don't choose when to use them. If you have Lockpicking and you try to pick a lock, it counts.</li></ul><h3>Organic Discovery</h3><p>Successfully performing an unskilled task under genuine stress can discover a new skill, starting at 1.0. Available for use immediately.</p><h3>Foundational Skills</h3><p>Deep training set during character creation. These never change during play.</p><p>Three breadth categories:</p><ul><li><strong>Narrow</strong> (one specific thing: "one-handed swords," "lockpicking") \u2014 Cheaper to invest in, higher bonus cap (+3.0)</li><li><strong>Broad</strong> (a whole domain: "all bladed weapons," "wilderness survival") \u2014 More expensive, lower cap (+2.0)</li><li><strong>Knowledge</strong> (specialized info: "arcane theory," "military history") \u2014 Same cost as Broad, supports both INT checks (recalling facts) and CHA checks (arguing from authority)</li></ul><p>Rules:</p><ul><li>Stack with base skill modifiers. A Foundational "Longsword +3.0" and base "Swordsmanship 2.5" both apply to the same roll.</li><li>Only one Foundational Skill applies per check (the highest if multiple could apply)</li><li>Don't stack with other Foundational Skills</li></ul><h3>Skill Progression</h3><p>Stats and skills grow through play, but only through genuine challenge. Routine repetition teaches nothing.</p><ul><li>Growth is flagged during play and awarded during End of Day Reflection (rest)</li><li>+0.1 for surviving a moderate challenge or learning from failure</li><li>+0.2 to +0.3 for high-stakes success or creative problem-solving</li><li>+0.4 to +0.5 for critical success against extreme odds or near-death survival</li><li>Max +0.5 per stat per Reflection. Overflow carries to the next rest.</li><li>Progression speed is adjustable via difficulty settings (0x to 5.0x multiplier)</li></ul><div class="mechanic-callout">Skills don't grow in a vacuum. The system tracks whether you were actually tested. Picking easy locks a hundred times teaches you nothing. Picking the lock while guards approach? That's a lesson.</div>`,
  },
  {
    id: 'active-skills', number: 5, title: 'Active Skills',
    content: `<p>Active Skills are tactical abilities you unlock through exceptional performance under pressure. They emerge from play, not from a creation menu.</p><h3>The Basics</h3><ul><li>Up to 10 per character</li><li>Each has an action cost (Swift, Primary, or Reaction), a cooldown, and a failure penalty</li><li>You don't pick them from a list. You earn eligibility through play, then choose from templates that match what you just did.</li></ul><h3>How You Unlock Them</h3><p>Eligibility triggers during play when you:</p><ul><li>Achieve a strong success while carrying significant conditions (excellence through adversity)</li><li>Achieve a strong success using Adrenaline Surge (transcending your limits)</li><li>Land a critical success that prevents a Fate Check (saving a life through skill)</li><li>Land a critical success on a creative custom action (innovation under pressure)</li></ul><p>At the next natural pause (rest, travel, conversation), you're offered 2\u20133 templates that match the triggering action. You pick one.</p><h3>The Templates</h3><ol><li><strong>Exploit Weakness</strong> \u2014 Read a flaw in an opponent's defense, creating an opening for your next attack. If you misread them, they exploit you instead.</li><li><strong>Defensive Gambit</strong> \u2014 React to an incoming attack and reduce its impact by one tier. Wastes your reaction if the attack was already missing.</li><li><strong>Precision Strike</strong> \u2014 Your hit bypasses armor entirely. Weapon takes durability damage if you miss.</li><li><strong>Battlefield Command</strong> \u2014 Inspire an ally, boosting their next action. Your social presence must match their capability. Their failure shakes your confidence.</li><li><strong>Controlled Retreat</strong> \u2014 Enhanced disengagement with tactical repositioning. Failure leaves you pinned.</li><li><strong>Adrenaline Focus</strong> (universal fallback) \u2014 Raw bonus to any check. You crash afterward regardless.</li><li><strong>Improvised Solution</strong> \u2014 Attempt something with no standard approach. The "I try something weird" valve. Your tool or environmental element takes damage.</li><li><strong>Surgical Strike</strong> \u2014 Target a specific weak point for a condition instead of raw damage. Bypasses armor. Overcommitting leaves you exposed.</li><li><strong>Desperate Inspiration</strong> \u2014 Give an ally a second chance after they fail. Morale hit if the reroll also fails.</li><li><strong>Last Stand</strong> \u2014 When a stat hits zero, ignite everything you have left. Three turns of power, then collapse. One-time ability.</li><li><strong>Assess</strong> \u2014 Read a target (person, object, environment) to extract mechanical information. Reveals hidden data about stats, conditions, weaknesses, or intentions.</li></ol><h3>Enhancement</h3><p>After your 5th Active Skill, new unlock triggers can enhance an existing skill instead of adding a new one. Each skill can be enhanced once for stronger effects.</p><h3>Cooldowns</h3><ul><li><strong>Crisis Sequence</strong> \u2014 Resets when combat ends and at least one turn passes</li><li><strong>Tactical Sequence</strong> \u2014 Resets after 10+ minutes without combat</li><li><strong>Long Rest</strong> \u2014 Resets after a full rest</li><li><strong>Charges</strong> \u2014 Refresh only at Long Rest</li></ul><h3>Retirement &amp; Swap</h3><p>Once per Long Rest, you can retire one Active Skill and pick a replacement. The retired skill is gone permanently.</p>`,
  },
  {
    id: 'passive-masteries', number: 6, title: 'Passive Masteries',
    content: `<p>Passive Masteries represent deep competence earned through repeated success in a specific domain. They alter how game systems interact with you. Unlike skills, they don't give flat bonuses. They change the rules slightly in your favor.</p><h3>How They Form</h3><ul><li>Unlock through consistent success in a specific domain over time</li><li>The exact threshold is hidden and randomized per character per domain, preventing grind</li><li>Anti-grind protection: 6+ identical actions in a 10-turn span freezes mastery progress in that domain</li></ul><h3>The Templates</h3><ol><li><strong>Efficiency Gain</strong> \u2014 Reduced resource consumption in a specific domain</li><li><strong>Armor Breaker</strong> \u2014 Reduce a target's armor effectiveness with a specific weapon type</li><li><strong>Sensory Edge</strong> \u2014 Automatically detect a specific hazard type before triggering it</li><li><strong>Medical Mastery</strong> \u2014 Choose at unlock: improved triage results OR faster passive recovery for patients you treat</li><li><strong>Environmental Adaptation</strong> \u2014 Reduced severity from a specific environment type's conditions</li><li><strong>Social Leverage</strong> \u2014 Bonus to social checks against a specific faction or social group</li><li><strong>Tactical Synergy</strong> \u2014 Bonus when coordinating with a specific ally. Dormant if that ally isn't present.</li><li><strong>Craft Excellence</strong> \u2014 Items you create start at one quality tier higher. Items you repair gain bonus durability.</li></ol><p>You can have any number of Passive Masteries, but each must be in a separate domain.</p>`,
  },
  {
    id: 'combat', number: 7, title: 'Combat',
    content: `<p>Combat uses the same core resolution as everything else. There's no separate "combat mode." When violence breaks out, the pacing tightens, consequences become more immediate, and positioning matters.</p><h3>Temporal Scales</h3><p>The game operates on three speeds:</p><ul><li><strong>Narrative Scale</strong> (hours/days) \u2014 Exploration, travel, downtime</li><li><strong>Tactical Scale</strong> (minutes) \u2014 Tense but non-combat situations, field repair, careful navigation</li><li><strong>Crisis Scale</strong> (seconds) \u2014 Active combat, life-or-death moments</li></ul><p>The system shifts between these automatically based on what's happening. Combat always runs on Crisis Scale.</p><h3>Turn Structure (Crisis Scale)</h3><p>Each turn you get:</p><ul><li><strong>Movement</strong> \u2014 One free zone transition (or forfeit it)</li><li><strong>Primary Action</strong> \u2014 Attack, cast, disengage, use a major item, or other significant action</li><li><strong>Swift Action</strong> \u2014 Off-hand attack, shield bash, defensive commitment, draw/stow weapon, use a consumable, activate a swift-cost Active Skill, careful withdrawal, or rush (second zone move)</li></ul><p>Conditions tick down at the start of your turn, before you act.</p><h3>Attacking</h3><ul><li>Roll your relevant stat (STR for melee, DEX for ranged) + skills + equipment vs the enemy's Defense DC</li><li>Damage = tier base + weapon damage modifier + stat scaling</li><li>Armor reduces incoming damage (flat reduction based on armor type)</li><li>Critical hits (Tier 1) bypass armor entirely</li></ul><h3>Stat Scaling on Damage</h3><p>Your STR (melee), DEX (ranged), or POT (supernatural) adds a damage bonus based on thresholds. Higher stats hit harder, but it scales in steps, not smoothly. The system shows your bonus in the attack preview.</p><h3>Defending</h3><ul><li>When attacked, you roll defense using an appropriate stat vs the enemy's Attack DC</li><li>POT can defend against supernatural attacks (disrupting a spell with your own power) but not mundane physical attacks</li></ul><h3>Defensive Commitment</h3><p>Spend your swift action to brace for defense:</p><ul><li>Bonus to your next defense roll</li><li>Blocks targeting conditions (like Hobbled or Concussed) from enemy attacks</li><li>Costs your movement for the turn. Must be declared before moving.</li><li>Can't combine with any other swift action</li></ul><h3>Targeted Attacks</h3><p>You can aim for specific body parts at higher difficulty:</p><ul><li><strong>Legs/Arms</strong> \u2014 Moderate DC increase. Success imposes movement or weapon-use conditions.</li><li><strong>Head</strong> \u2014 High DC increase. Success disorients or concusses.</li><li>Weapons with the <code>precise</code> tag reduce the penalty.</li><li>Defensive Commitment blocks targeting conditions regardless of the defense roll outcome.</li></ul><h3>Combat Positioning: Zones</h3><p>Battlefields are divided into zones, not grid squares. Each zone is a discrete area (behind the overturned table, the treeline, the narrow bridge).</p><p>Range states:</p><ul><li><strong>Engaged</strong> \u2014 Same zone, in active melee</li><li><strong>Near</strong> \u2014 Adjacent zone</li><li><strong>Far</strong> \u2014 Two or more zones apart</li></ul><p>Movement and disengagement:</p><ul><li>Leaving a zone while engaged in melee provokes an opportunity strike (the enemy gets a free hit)</li><li>Spend your swift action on careful withdrawal to avoid the opportunity strike</li><li>Full Disengage (flee combat): costs your primary action, contested DEX check. From an escape-tagged zone, success ends combat entirely.</li><li>Failure to disengage means you stay, and you lose your next action.</li></ul><h3>Stealth-Initiated Combat</h3><ul><li>Ambushing an enemy: their Defense DC drops (calculated without their DEX)</li><li>NPC ambushing you: your first defense uses WIS instead of DEX</li></ul><h3>Initiative</h3><p>Players always act first. In multiplayer, players go in DEX order (highest first).</p><div class="mechanic-callout">Combat is dangerous by design. Even skilled fighters can be taken down by bad luck or poor positioning. Avoiding fights you don't need is often the smartest play.</div>`,
  },
  {
    id: 'conditions-status-effects', number: 8, title: 'Conditions & Status Effects',
    content: `<p>Conditions are the system's way of tracking injuries, ailments, and ongoing effects. They reduce your Effective Stats, making everything that uses that stat harder until the condition clears.</p><h3>Condition Format</h3><p>Every condition has: a name, a penalty, target stat(s), a duration, and sometimes an escalation path.</p><p>Example: [Hobbled: -1.0 DEX | 2 Turns | \u2193]</p><h3>Severity Ladder</h3><p>Cosmetic (no penalty) \u00b7 Minor (-0.5) \u00b7 Moderate (-1.0) \u00b7 Severe (-1.5) \u00b7 Critical (-2.0) \u00b7 Catastrophic (-3.0+)</p><h3>Duration Types</h3><p>Turn-counted \u00b7 Until Scene End \u00b7 Until Long Rest \u00b7 Until Triage/Treatment \u00b7 Time-based \u00b7 While a condition persists \u00b7 Permanent</p><h3>Escalation</h3><p>Some conditions worsen over time if untreated:</p><ul><li>\u2193 = scheduled escalation (it will get worse at a set time)</li><li>\u26a0 = triggered escalation (specific actions or events make it worse)</li></ul><h3>Stacking</h3><ul><li>Identical conditions stack upward: Minor + Minor = Moderate</li><li>Different conditions on the same stat stack independently</li><li>Some condition pairs interact: cancellation (both clear), transition (one dominates), or catalytic (both clear, something new takes their place)</li></ul><h3>Condition Domains</h3><ul><li><strong>MOBILITY</strong> \u2014 Legs, movement (DEX)</li><li><strong>DEXTERITY</strong> \u2014 Hands, arms, coordination (DEX)</li><li><strong>ENDURANCE</strong> \u2014 Torso, vitality (CON)</li><li><strong>COGNITION</strong> \u2014 Head, senses, focus (INT/WIS)</li><li><strong>PRESENCE</strong> \u2014 Social standing, visible state (CHA)</li><li><strong>COMPOSITE</strong> \u2014 Multiple stats at once</li></ul><h3>Psychological Conditions</h3><p>Triggered by specific events: facing something vastly stronger than you, witnessing an ally's death, being ambushed, supernatural horror, being vastly outnumbered.</p><ul><li>Resisted with a WIS check. Success means you shrug it off.</li><li>Characters who have faced the same trigger type 3+ times become resistant (reduced severity). Experience hardens you.</li></ul><h3>Environmental Conditions</h3><ul><li>Minor conditions from background exposure (drenched, windblown, footsore) can apply automatically</li><li>Moderate or worse environmental conditions always require a check first</li></ul>`,
  },
  {
    id: 'inventory-and-gear', number: 9, title: 'Inventory & Gear',
    content: `<p>Everything you carry has weight, condition, and purpose. Your inventory is limited, so you'll need to make choices about what's worth hauling around.</p><h3>Carrying Capacity</h3><p>Total inventory slots = your base STR + 5</p><p>Key rule: equipped items (what you're wearing and wielding) don't count against capacity. Only carried, stowed, and packed items use slots.</p><h3>Item Sizes</h3><ul><li><strong>Micro</strong> (0.1 slots) \u2014 Rings, individual arrows, small keys</li><li><strong>Small</strong> (0.5 slots) \u2014 Daggers, potions, coin pouches</li><li><strong>Standard</strong> (1.0 slot) \u2014 One-handed weapons, rations, basic tools</li><li><strong>Heavy</strong> (2.0\u20133.0+ slots) \u2014 Two-handed weapons, heavy armor</li></ul><h3>Readiness</h3><ul><li><strong>Ready</strong> \u2014 Use instantly</li><li><strong>Obstructed</strong> \u2014 Minor delay or penalty to access</li><li><strong>Stowed</strong> \u2014 In your pack. Takes time to retrieve.</li></ul><h3>Encumbrance</h3><p>If carried items exceed your capacity:</p><ul><li><strong>Encumbered</strong> \u2014 DEX and STR penalties. Clears as soon as you drop below capacity.</li><li><strong>Overburdened</strong> \u2014 Worse penalties, can't sprint or dodge</li></ul><h3>Equipment Slots</h3><ul><li><strong>Hands (2)</strong> \u2014 Weapons, shields, implements, held items. Shields take one hand.</li><li><strong>Armor (1)</strong> \u2014 Worn body protection</li><li><strong>Standard Slots (4 named positions):</strong><ul><li>Head (helms, goggles, masks)</li><li>Hands (gloves, gauntlets)</li><li>Feet (boots, greaves)</li><li>Worn (cloaks, belts, bandoliers, badges, backpacks)</li><li>Each provides minor situational bonuses. One item per position.</li></ul></li><li><strong>Trinket Slots (5)</strong> \u2014 Small passive-effect items (rings, charms, anklets). Max +0.5 effect each. Must all be distinct.</li></ul><h3>Backpacks</h3><p>+3.0 inventory slots, but everything inside counts as Stowed. One backpack max.</p><div class="mechanic-callout">Your inventory isn't just a list. It's a tactical consideration. Carrying too much slows you down. Carrying too little leaves you unprepared.</div>`,
  },
  {
    id: 'weapons-and-armor', number: 10, title: 'Weapons & Armor',
    content: `<h3>How Weapons Work</h3><p>Every weapon has a Damage Modifier (how much it hurts on hit) and may have Tags (unlock tactical options). Hit chance comes from your stats, skills, and equipment quality, not the weapon itself.</p><p>There are 14 genre-neutral weapon archetypes. The names change by setting (a longsword in fantasy, a saber in Smoke &amp; Steel, an energy blade in sci-fi), but the mechanics don't.</p><h3>Weapon Tags</h3><p>Tags are tactical options, not flat bonuses:</p><ul><li><strong><code>armor-effective</code></strong> \u2014 Reduces the target's armor protection. Extra armor durability damage. Maces, warhammers, crossbows.</li><li><strong><code>reach</code></strong> \u2014 Attack enemies in adjacent zones without entering their zone. Greatswords, spears, polearms.</li><li><strong><code>fast</code></strong> \u2014 Use the better of STR or DEX for melee attacks. Special dual-wield rules. Daggers, short swords.</li><li><strong><code>defensive</code></strong> \u2014 Bonus to defense while equipped. Longswords.</li><li><strong><code>precise</code></strong> \u2014 Reduced penalty for targeted attacks. Daggers, rapiers, sniper rifles.</li><li><strong><code>conduit</code></strong> \u2014 Cast spells through the weapon without switching grip. Enchanted weapons for spellblades.</li><li><strong><code>concealable</code></strong> \u2014 Can be hidden on your person. Harder for others to detect. Daggers, derringers.</li><li><strong><code>loud</code></strong> \u2014 Alerts all enemies in the area. Firearms, explosions.</li><li><strong><code>reload(X)</code></strong> \u2014 Requires X swift actions to ready after firing. Crossbows, bolt-action rifles.</li><li><strong><code>melee-capable</code></strong> \u2014 This ranged weapon works at melee range. Pistols, holdout blasters.</li></ul><h3>Stat Requirements</h3><ul><li>Heavy weapons (1.5+ slots): require STR/DEX 9</li><li>Very heavy weapons (2.0+ slots): require STR/DEX 11</li><li>Below the requirement: penalty to attack rolls, but the weapon still functions</li></ul><h3>Armor</h3><p>Flat damage reduction on every hit. Fixed by type, doesn't change with durability.</p><ul><li><strong>Unarmored</strong> \u2014 No reduction</li><li><strong>Light</strong> \u2014 Small reduction, 1.0 slots</li><li><strong>Medium</strong> \u2014 Moderate reduction, 2.0 slots</li><li><strong>Heavy</strong> \u2014 Best reduction, 3.0 slots</li></ul><p>Critical hits bypass armor entirely.</p><h3>Shields</h3><p>+1.0 defense at the cost of one hand slot. Not a weapon, not armor.</p><ul><li><strong>Shield Bash</strong> (swift action) \u2014 Contested STR check to disrupt the enemy's swift action next turn. Spiked shields deal damage on bash.</li><li><strong>Hunker Down</strong> (full turn) \u2014 Significant defense bonus, incoming damage halved, but you can't move, attack, or react until your next turn.</li></ul><h3>Dual Wielding</h3><p>Hold a one-handed weapon in each hand. Use your swift action for an off-hand attack.</p><ul><li>Off-hand attack has a -3.0 penalty and deals weapon damage only (no stat scaling, no tier resolution)</li><li><code>fast</code> weapons ignore the penalty but require a Tier 2+ result on your primary attack to trigger</li><li>Tradeoff: extra damage, but you give up defensive options (no Defensive Commitment)</li></ul><h3>Two-Handed Dual Wielding</h3><p>If either weapon has a slot cost of 2.0 or more, a -3.0 penalty applies to ALL attack rolls, primary and off-hand, for as long as both items are held. Failing to meet a weapon's stat requirement stacks an additional -2.0 on top. Technically possible, heavily penalized.</p><h3>Weapon Switching</h3><ul><li>Drawing or stowing a weapon: swift action</li><li>Dropping a weapon: free (lands at your feet, retrievable later)</li><li>Quick swap: drop the current weapon (free) + draw a new one (swift) in one turn</li></ul><h3>Ranged Combat</h3><ul><li>Weapons with <code>reload</code> or two-handed aiming can't fire at melee range. <code>melee-capable</code> weapons can.</li><li>Distance affects difficulty: close range is standard, long range adds difficulty, extreme range adds more.</li><li>Ammunition is tracked as a supply pool (10\u201320 shots), not per arrow.</li><li>No friendly fire when shooting into melee.</li></ul>`,
  },
  {
    id: 'item-quality-durability', number: 11, title: 'Item Quality & Durability',
    content: `<h3>Material Quality</h3><p>Set at creation, never changes. Determines the item's max durability and quality bonus.</p><p>Crude \u00b7 Rough \u00b7 Common \u00b7 Superior \u00b7 Masterwork</p><p>Higher quality = higher max durability, better quality bonus (weapons hit more often, armor responds better, implements cast more accurately), higher price.</p><h3>Durability</h3><p>Items degrade with use through four states:</p><ul><li><strong>Intact</strong> (76\u2013100%) \u2014 Full quality bonus</li><li><strong>Worn</strong> (51\u201375%) \u2014 Quality bonus reduced</li><li><strong>Damaged</strong> (26\u201350%) \u2014 Quality bonus further reduced</li><li><strong>Failing</strong> (1\u201325%) \u2014 Quality bonus heavily reduced</li><li><strong>Broken</strong> (0%) \u2014 Unusable (weapons) or zero protection (armor)</li></ul><p>Important: quality bonus affects accuracy (hit chance), not raw damage. A Damaged masterwork sword hits less often but cuts just as deep.</p><p>Durability can be toggled off entirely in difficulty settings.</p><h3>What Causes Degradation</h3><ul><li><strong>Armor</strong> \u2014 Loses durability when hit. <code>armor-effective</code> weapons cause extra degradation.</li><li><strong>Weapons</strong> \u2014 Lose durability on critical fumbles or when used for improvised tasks (prying open a door with your sword)</li><li><strong>Implements</strong> \u2014 Lose durability on critical casting fumbles</li></ul><h3>Repair</h3><ul><li><strong>Field repair</strong> (basic tools, anywhere) \u2014 Restores up to 50% of max durability</li><li><strong>Professional repair</strong> (full workshop) \u2014 Restores up to 100%</li><li>Both take multiple checks over time</li><li>Craft Excellence mastery grants bonus durability beyond the repair result</li></ul>`,
  },
  {
    id: 'enchantments-magical-items', number: 12, title: 'Enchantments & Magical Items',
    content: `<p>Depending on your setting, items may carry effects beyond the mundane: magic, cybernetic enhancements, advanced technology. All use the same framework.</p><h3>Enchantment Slots</h3><ul><li><strong>Standard tier:</strong> One enchantment per item</li><li><strong>Rare tier:</strong> Up to two effects, one may exceed standard limits</li><li><strong>Artifact tier:</strong> Unconstrained. Pre-authored story anchors, never randomly generated.</li></ul><h3>Eight Categories of Enchantment</h3><ol><li><strong>Stat Modifier</strong> \u2014 Passive bonus. Broad (+1.0 to an entire stat) or Narrow (+2.0 to a specific check type).</li><li><strong>Element Tag</strong> \u2014 Adds elemental damage type (fire, ice, lightning, shadow, psychic, kinetic). Applies secondary conditions on hit.</li><li><strong>Tag Grant</strong> \u2014 Adds a weapon tag the item doesn't normally have.</li><li><strong>Condition Resistance</strong> \u2014 Reduces incoming severity from a specific condition type or element.</li><li><strong>Threshold Modifier</strong> \u2014 Shifts a system threshold slightly (e.g., +0.5 armor mitigation).</li><li><strong>Triggered Effect</strong> \u2014 Fires automatically on a specific event (critical hit, combat start, etc.).</li><li><strong>Passive Utility</strong> \u2014 Binary on/off effect with no magnitude (darkvision, detect magic, etc.).</li><li><strong>Activated Effect</strong> \u2014 Usable ability with limited charges, refreshed at Long Rest.</li></ol><h3>Elemental Damage</h3><p>Elemental weapons and spells apply secondary conditions based on how well you hit:</p><ul><li><strong>Fire</strong> \u2014 Burns (CON). Damage amplification over time.</li><li><strong>Ice</strong> \u2014 Chills and freezes (DEX). Slows and restricts.</li><li><strong>Lightning</strong> \u2014 Jolts and shocks (DEX/INT). Burst disruption.</li><li><strong>Shadow</strong> \u2014 Unsettles and dread (WIS). Awareness degradation.</li><li><strong>Psychic</strong> \u2014 Dazes and scrambles (INT). Caster disruption.</li><li><strong>Kinetic</strong> \u2014 Staggers and knocks back (STR). Anti-melee.</li></ul><h3>Identification</h3><p>Enchanted items you find may be unidentified. You can see basic properties but not the enchantment. Ways to identify:</p><ul><li>Use it and discover properties through play</li><li>Have it examined by a knowledgeable NPC</li><li>Research it yourself</li></ul><p>Some items may be deliberately misidentified, showing false properties.</p><h3>Suppression Fields</h3><p>Some areas dampen, suppress, or nullify enchantments and powers:</p><ul><li><strong>Dampening</strong> \u2014 All enchantment bonuses reduced by half</li><li><strong>Suppression</strong> \u2014 Passive bonuses weakened, active abilities disabled</li><li><strong>Nullification</strong> \u2014 Everything shut down</li></ul><p>You're always warned before entering a nullification zone, and you always have options: alternate route, preparation time, or retreat. Items are never damaged by suppression. Effects resume when you leave.</p><h3>Crafting Enchanted Items</h3><p>Requires supernatural or tech capability, relevant skills, materials, and workspace. Enchantments can be transferred between items, but at real risk of losing the enchantment entirely.</p>`,
  },
  {
    id: 'supernatural-abilities', number: 13, title: 'Supernatural Abilities',
    content: `<p>This section applies only to characters with POT. Mundane characters can skip it entirely.</p><h3>How Supernatural Actions Work</h3><p>Same resolution system as everything else: POT + skill + equipment quality + die roll vs DC. The setting determines what "supernatural" means: magic in fantasy, psionics in sci-fi, divine gifts in religious settings. The mechanics are the same regardless.</p><h3>Spell Output Types</h3><ul><li><strong>Damage</strong> \u2014 Inflicts CON severity + elemental rider. Armor applies (except on crits).</li><li><strong>Control</strong> \u2014 Imposes conditions directly (entangle, blind, slow). Bypasses armor entirely.</li><li><strong>Hybrid</strong> \u2014 Reduced damage + reduced condition. Costs more strain. Both effects at reduced power.</li><li><strong>Healing</strong> \u2014 Reduces condition severity on a target.</li><li><strong>Buff</strong> \u2014 Temporary stat bonus. Max +1.5. One active self-buff at a time. Doesn't stack with itself.</li></ul><h3>Mental Strain: The Cost of Power</h3><p>Every supernatural action drains your Potency:</p><ul><li><strong>Cantrips</strong> \u2014 Free. Minor strain on rapid repeated use.</li><li><strong>Standard spells</strong> \u2014 Immediate POT reduction (-0.5 per cast, stacking)</li><li><strong>Major spells</strong> \u2014 Larger reduction (-1.0 per cast)</li><li><strong>Legendary</strong> \u2014 POT drops to zero + Fate Check. Campaign-defining, last-resort power.</li></ul><p>When POT runs low, cascading fatigue kicks in:</p><ul><li>POT below 3.0: penalty to all supernatural action rolls</li><li>POT below 1.0: penalty to ALL actions</li></ul><p>Mental Strain cannot be healed by magic or medical care. Only rest restores spent POT. You can't magic your way out of magical exhaustion.</p><h3>Implements (Casting Focuses)</h3><p>All non-cantrip spells require either an implement in hand or a free hand. Cantrips have no hand requirement.</p><p>Implements boost casting damage through a Channel Modifier:</p><ul><li>No focus (bare hand): +0.0</li><li>Wand: +0.5 (one-handed, concealable)</li><li>Rod: +1.0 (one-handed)</li><li>Staff: +1.5 (two-handed, can double as a melee weapon)</li></ul><p>Conduit weapons let you cast through your weapon without any equipment juggling. A spellblade with a conduit longsword and shield can attack one turn and cast the next.</p><h3>Supernatural Defense</h3><p>When defending against supernatural attacks, you pick the stat that fits the fiction:</p><ul><li>DEX to dodge a fire bolt</li><li>WIS to resist a mental intrusion</li><li>CON to endure a life drain</li><li>POT to disrupt the spell directly (requires POT > 0.0)</li></ul><p>Saying "I disrupt their spell with my own power" is a valid defense using POT.</p><div class="mechanic-callout">The specific abilities available depend on your setting. A dark fantasy world might offer blood magic with serious consequences. A sci-fi setting might give you cybernetic implants that strain your body. The system adapts to the genre, but the cost is always real.</div>`,
  },
  {
    id: 'survival', number: 14, title: 'Survival',
    content: `<p>Your character needs food, water, and rest. Neglecting these basics has real consequences.</p><h3>Food &amp; Water</h3><p>On Standard, Harsh, and Brutal difficulty, you consume 1 water + 1 ration daily.</p><ul><li>Miss a meal: [Malnourished: -0.5 CON] that escalates to [Starving] after 48 hours, then eventually becomes fatal</li><li>Can be toggled off entirely in difficulty settings (Forgiving, or Survival dial set to Off)</li></ul><h3>Rest &amp; Long Rest</h3><p>Long Rest requires:</p><ul><li>6+ hours of uninterrupted rest</li><li>Having eaten that day</li><li>Max one Long Rest per 24 hours</li></ul><p>Long Rest clears certain conditions, restores strain, refreshes Active Skill cooldowns and item charges. End of Day Reflection happens during Long Rest. This is when your stats and skills grow.</p><h3>Safe vs Unsafe Rest</h3><ul><li><strong>Safe locations</strong> (towns, secured camps, player property): rest completes automatically</li><li><strong>Unsafe locations</strong> (dungeons, enemy territory, wilderness): contested check. Failure means ambush during rest. No benefits gained, rations still consumed.</li><li>You'll get a qualitative signal before committing: "The area feels tense" vs "This place seems secure."</li></ul><h3>Recovery Methods</h3><ul><li><strong>Passive Recovery</strong> \u2014 +0.3 per day to conditions. Requires relative safety but no resources. Slow but free.</li><li><strong>Triage</strong> \u2014 Medical treatment (self or others). Divides remaining condition penalty by 5 for immediate partial reduction. Tools help.</li><li><strong>Time Skip</strong> \u2014 In safe locations, fast-forward rest and recovery without playing through each day.</li></ul><h3>The Abyss of Zero</h3><p>If any stat hits 0.0:</p><ul><li>Voluntary actions using that stat are forbidden</li><li>Involuntary actions (crawling, shivering, survival instinct) still work</li><li>Stats below 0.0 impose an additional penalty on all rolls using that stat</li><li>Recovery: +0.1 every 4 hours if you're in relative safety</li></ul><h3>Adrenaline Surge</h3><p>Once per day, if any stat is at 0.0 or below, you can force it to 1.0 for one single action. Afterward, that stat takes a -1.0 penalty until Long Rest. Your one desperate shot when everything has gone wrong.</p><div class="mechanic-callout">Survival mechanics scale with difficulty. On Forgiving, supplies are plentiful and rest is easy. On Brutal, every meal counts and safe rest is a luxury.</div>`,
  },
  {
    id: 'death-and-fate', number: 15, title: 'Death & Fate',
    content: `<p>Death is rare, dramatic, and always your choice.</p><h3>The Fate Check</h3><p>When your CON hits 0.0, the system makes a Fate Check:</p><p>D20 + your highest mental stat (INT, WIS, or CHA) vs Fate DC</p><p>The Fate DC is set by your difficulty level. Higher difficulty means harder to survive. If all three mental stats are also at or below zero, the bonus is 0 (never negative).</p><ul><li><strong>Success:</strong> You survive with a major setback. Capture, theft, a permanent scar. But you live.</li><li><strong>Failure:</strong> Your character dies.</li></ul><h3>The Death Choice</h3><p>When your character dies, the AI narrates the death in full. Then you choose:</p><p><strong>"Rewind the threads of fate"</strong></p><p>The death is undone. Narrated as a premonition, a flash of instinct, a moment where fate seemed to bend. State resets to just before the fatal event. The threat that caused the death still exists. Handle it differently this time.</p><p><strong>"Let the story flow"</strong></p><p>The death stands. Your character's story ends. You choose:</p><ul><li><strong>New character, same world.</strong> Everything persists: factions, NPCs, consequences, history. Your dead character becomes part of the world's memory.</li><li><strong>End campaign.</strong> The story is over.</li></ul><p>This choice is always available regardless of difficulty settings. There is no pre-commitment to permanent death. You decide in the moment.</p><h3>New Character After Death</h3><ul><li><strong>Clean Start</strong> \u2014 No connection to the dead character. Fresh stats, fresh gear.</li><li><strong>Legacy Connection</strong> \u2014 Narratively linked (relative, apprentice, avenger). Inherit ONE of: a single item from the dead character, a faction standing boost, or a discovered skill at 1.0.</li></ul><p>The new character is mechanically fresh. Legacy provides a narrative thread and one small advantage, not a power transfer.</p><p>Rewinds are tracked. The AI may weave it into the narrative: recurring premonitions, NPCs commenting on your uncanny luck. This is narrative weight, not mechanical penalty.</p><div class="mechanic-callout">Death is always your choice. The game gives you the full weight of the moment, then asks what you want to do with it.</div>`,
  },
  {
    id: 'the-world', number: 16, title: 'The World',
    content: `<p>The world you play in is built during character creation based on your choices: genre, setting, storyteller. Once created, it's a persistent place with its own geography, factions, history, and logic.</p><h3>World Persistence</h3><p>The world remembers. Actions you take in one place can have consequences elsewhere. NPCs form opinions about you. Factions track your allegiances. The story evolves based on what you've done, not on a predetermined script.</p><p>Every world is unique to your playthrough. Even if two players pick the same genre and setting options, the specifics will differ: different towns, different NPCs, different conflicts.</p><h3>Factions &amp; Reputation</h3><p>Factions are persistent organizations: guilds, governments, criminal networks, religious orders, military units. Your standing with each ranges from hostile to exalted.</p><ul><li><strong>Nemesis / Hostile</strong> \u2014 Attack on sight. No services.</li><li><strong>Distrusted / Wary</strong> \u2014 Limited services, unfavorable prices.</li><li><strong>Neutral</strong> \u2014 Standard interaction.</li><li><strong>Recognized / Respected</strong> \u2014 Better prices, information shared, access to faction services.</li><li><strong>Trusted</strong> \u2014 Exclusive objectives offered, safe harbor in faction territory, faction-specific rare items.</li><li><strong>Honored / Exalted</strong> \u2014 Leadership access, faction acts as active ally, political influence.</li></ul><p>What moves your standing: completing tasks for them, offending them, helping their rivals, public actions that affect their interests. Faction relationships ripple. Helping one faction's ally helps you with both. Hurting a faction boosts their enemies.</p><p>Standing drifts toward Neutral over time if you have no contact with a faction. Extreme standings (Nemesis, Exalted) don't fade.</p><h3>NPCs</h3><p>Tracked by the system with their own dispositions, memories, and agendas. Personal disposition is separate from faction standing. An NPC can personally warm to you even if their faction is skeptical (within limits). How you treat them matters. Word travels.</p><h3>Social Encounters</h3><p>When you talk to NPCs, the quality of your argument matters, not just your CHA score.</p><ul><li>A strong argument (addresses the NPC's real concerns, uses known leverage) makes the check easier</li><li>A generic or irrelevant argument keeps the difficulty standard</li><li>A weak argument (misreads the NPC, wrong tone, wrong leverage) makes it harder</li><li>A dealbreaker (insults their core values, touches a hard boundary) fails automatically</li></ul><p>The system classifies your approach from your dialogue. You don't select "Intimidate" from a menu. You talk, and the system figures out the mechanics:</p><ul><li>Charm/Persuade uses CHA</li><li>Intimidate uses STR + CHA</li><li>Reason/Argue uses INT + CHA</li><li>Empathize/Read uses WIS + CHA</li><li>Deceive uses CHA vs the target's WIS</li></ul><p>Some NPCs have hard boundaries: things they will never concede regardless of your skill. No roll bypasses them. You discover these through conversation, through Assess, or by running into them.</p><h3>Objectives</h3><p>The game doesn't hand you a quest log with checkboxes. Objectives emerge from the story: things you've committed to, problems you've encountered, threads you've chosen to follow.</p><p>Two types appear in your Objectives panel:</p><ul><li><strong>Server-tracked objectives</strong> arise from the world: someone asked for help, a mystery presented itself, a faction offered work</li><li><strong>Player-defined objectives</strong> are ones you set yourself: find better gear, learn a new skill, settle a grudge</li></ul><p>There's no wrong way to play. Follow the obvious hooks, ignore them and go exploring, or create your own goals entirely. The world responds to whatever you choose to do.</p><h3>Discovery</h3><p>As you explore, locations are added to your map and glossary. The world contains things that aren't obvious: hidden paths, buried secrets, things that only reveal themselves if you're looking. Exploration rewards curiosity.</p>`,
  },
  {
    id: 'exploration-and-travel', number: 17, title: 'Exploration & Travel',
    content: `<p>Moving through the world takes time and resources. Travel isn't instant: distance matters, terrain matters, and what happens along the way matters.</p><h3>Routes &amp; Distance</h3><p>Distance is measured in travel days, not miles. A travel day is roughly 8 hours of walking at a sustainable pace. Routes have a terrain type (road, trail, wilderness, mountain, water, underground) and a danger level.</p><ul><li>1 day: short trip, arrive by nightfall</li><li>2\u20133 days: multi-day journey</li><li>4\u20137 days: significant expedition</li><li>8+ days: major undertaking</li></ul><h3>Travel Methods</h3><ul><li><strong>On foot</strong> \u2014 Default</li><li><strong>Mounted</strong> \u2014 Faster (half travel time), requires animal upkeep. Terrain restrictions.</li><li><strong>Cart/Wagon</strong> \u2014 Moderately faster, road or trail only.</li><li><strong>Watercraft</strong> \u2014 Fast downstream, slow upstream. Requires skill.</li><li><strong>Magical/Tech transit</strong> \u2014 Very fast or instant. Setting-dependent, expensive, may require specific locations.</li></ul><h3>Resolution Modes</h3><p>How much the system cares about your journey depends on the route and your difficulty setting:</p><p><strong>Montage Mode (fast travel)</strong> \u2014 Time and rations consumed, brief narration, arrive at your destination. Used for safe routes and lower difficulty settings.</p><p><strong>Structured Mode (leg-by-leg)</strong> \u2014 Journey divided into legs with checks each day: navigation, encounters, survival. Between legs you decide: press on, camp, change route, or turn back.</p><p>On Forgiving difficulty, almost everything is fast travel. On Brutal, every journey is an expedition. The same road, the same distance: your difficulty setting determines how much the system engages.</p><h3>Navigation</h3><p>Known routes need no check. Unknown routes require navigation. Failure means detour, lost time, or stumbling into something you weren't prepared for.</p><div class="mechanic-callout">Travel is a meaningful part of the game, not a loading screen. Things happen on the road. Some of the best stories start between destinations.</div>`,
  },
  {
    id: 'economy-and-trade', number: 18, title: 'Economy & Trade',
    content: `<h3>How Money Works</h3><p>Every region has a Local Baseline (LB): the daily cost of common living in that area. All prices scale from this number. A frontier village has a low LB; a capital city has a high one.</p><p>Currency denominations change by setting (gold and silver in fantasy, credits in sci-fi, dollars in modern), but the underlying math is the same.</p><h3>Standard of Living</h3><ul><li><strong>Squalid</strong> (very cheap) \u2014 Increases health risks</li><li><strong>Common</strong> (1x LB) \u2014 Covers food and lodging</li><li><strong>Wealthy</strong> (10x LB) \u2014 Comfortable, social access</li></ul><h3>Buying &amp; Selling</h3><p>Prices are affected by:</p><ul><li>Item quality (Crude through Masterwork)</li><li>Regional scarcity (a trade city vs a besieged fortress)</li><li>Your faction standing with the merchant's organization</li></ul><p>Selling looted gear: base value reduced by merchant disposition. You can improve the deal with social skills. Faction standing affects the starting point.</p><h3>Scarcity</h3><p>Supply varies by region and changes over time. A war cuts off steel supply, weapon prices rise. A merchant caravan arrives, prices drop. The economy reacts to what's happening in the world.</p><h3>Currency Weight</h3><ul><li><strong>Coins</strong> (medieval/fantasy) \u2014 Each coin takes 0.1 slots. Pouches consolidate them.</li><li><strong>Paper</strong> (modern) \u2014 Nearly weightless.</li><li><strong>Digital</strong> (sci-fi) \u2014 Zero weight.</li></ul><p>Your setting determines which system applies.</p>`,
  },
  {
    id: 'crafting-extended-tasks', number: 19, title: 'Crafting & Extended Tasks',
    content: `<p>Some objectives can't be resolved in a single check. Forging a weapon, studying an ancient text, fortifying a camp, decoding a cipher: these require sustained effort across multiple attempts.</p><h3>How Extended Tasks Work</h3><ul><li>Each attempt: roll your relevant stat + skills + equipment vs the task's difficulty</li><li>Better results = more progress. Critical success = breakthrough. Critical failure = setback or regression.</li><li>Even failed attempts where you learn something contribute small progress</li><li>Conditions from failed attempts carry into future attempts, creating natural escalating difficulty</li><li>Time between attempts varies: crafting might be hours, emergency repair might be minutes</li></ul><h3>Crafting</h3><ul><li>Requires appropriate materials, tools, and often a workshop</li><li>Output quality is capped by input material quality (Crude iron can't produce a Masterwork sword)</li><li>Field crafting (no workshop): penalties and quality caps</li><li>Craft Excellence mastery bumps output quality one tier above your materials</li></ul><h3>Repair</h3><ul><li><strong>Field repair</strong> (basic tools) \u2014 Up to 50% durability restoration</li><li><strong>Professional repair</strong> (full workshop) \u2014 Up to 100%</li><li>Broken items are harder to repair and risk permanent destruction on a critical fumble</li></ul><h3>Research &amp; Study</h3><ul><li>Study creatures to reveal elemental weaknesses, anatomical vulnerabilities, and behavioral patterns</li><li>Study texts for new skills, recipes, or lore</li><li>Safe research: wasted time is the worst outcome</li><li>Dangerous research (cursed texts, volatile magic): real risk of harm to your character or destruction of the source material</li></ul><h3>Knowledge as Power</h3><p>Research doesn't make you hit harder. It lets you fight smarter.</p><ul><li>Reveals elemental weaknesses (your fire attacks become more effective against that creature type)</li><li>Reveals weak points (reduced penalty for targeted attacks)</li><li>Reveals behavioral patterns (new tactical options using existing mechanics)</li></ul><p>Field experience counts too. Three critical successes against a creature type in combat reveals one piece of knowledge without any studying.</p>`,
  },
  {
    id: 'storytellers-settings-difficulty', number: 20, title: 'Storytellers, Settings & Difficulty',
    content: `<h3>Storytellers</h3><p>Your Storyteller is the narrative voice of the game. The rules don't change, but the way the story feels does.</p><ul><li><strong>Chronicler</strong> \u2014 "The world as it is." Sparse, factual, precise. What a witness would remember.</li><li><strong>Bard</strong> \u2014 "You are the hero of this story." Epic when earned, grounded the rest of the time.</li><li><strong>Trickster</strong> \u2014 "The world has a sense of humor." Observational wit. Plays it straight, notices the absurd.</li><li><strong>Poet</strong> \u2014 "Every victory has a cost." Lingering on what's lost. Specific, concrete images.</li><li><strong>Whisper</strong> \u2014 "Everything is fine. Almost." Warm and cozy on the surface. Something wrong underneath.</li><li><strong>Noir</strong> \u2014 "Nobody is clean." Hard-boiled. Reads people. Earned cynicism.</li><li><strong>Custom</strong> \u2014 Define your own voice.</li></ul><p>Can be changed at any time during play. No penalty, no cooldown.</p><h3>Settings</h3><p>Your setting defines the genre and world type:</p><ul><li><strong>Sword &amp; Soil</strong> \u2014 Pre-gunpowder. Muscle, metal, and maybe magic.</li><li><strong>Smoke &amp; Steel</strong> \u2014 Gunpowder through early mechanization. Steam, revolution, empire.</li><li><strong>Concrete &amp; Code</strong> \u2014 20th century through near-future. Guns, cars, computers, bureaucracy.</li><li><strong>Stars &amp; Circuits</strong> \u2014 Spacefaring, cybernetic, post-human.</li><li><strong>Ash &amp; Remnants</strong> \u2014 Post-collapse. Something ended. What's left is what you have.</li><li><strong>Dream &amp; Myth</strong> \u2014 Surreal, mythic, or strange. Reality's rules are suggestions.</li><li><strong>Custom</strong> \u2014 Blend, twist, or build from scratch.</li></ul><h3>Difficulty Dials</h3><p>Difficulty isn't a single slider. It's a set of independent dials you can adjust at any time:</p><ul><li><strong>DC Offset</strong> \u2014 Shifts all difficulty checks up or down. The global harder/easier knob.</li><li><strong>Fate DC</strong> \u2014 How hard it is to survive a Fate Check. Separable from combat difficulty.</li><li><strong>Survival</strong> \u2014 Toggle food/water tracking on or off.</li><li><strong>Durability</strong> \u2014 Toggle item degradation on or off.</li><li><strong>Progression Speed</strong> \u2014 How fast you grow. 0x (frozen) through 5.0x (rapid). Default 1x.</li><li><strong>Encounter Pressure</strong> \u2014 How frequently you face threats. Low / Standard / High.</li><li><strong>Fortune's Balance</strong> \u2014 Toggle the 2d20 system on or off. Off = straight d20, every check.</li><li><strong>Simplified Outcomes</strong> \u2014 Toggle 6-tier results to binary pass/fail.</li></ul><h3>Presets</h3><p>Presets for quick setup:</p><ul><li><strong>Forgiving</strong> \u2014 Easier checks, low death threshold, no survival/durability</li><li><strong>Standard</strong> \u2014 Balanced baseline</li><li><strong>Harsh</strong> \u2014 Harder checks, tough death threshold, full tracking</li><li><strong>Brutal</strong> \u2014 Maximum challenge across the board</li></ul><p>All dials can be changed mid-game. Changes apply to the next relevant event. Nothing is recalculated retroactively.</p><h3>Scenario Intensity</h3><p>When starting a new campaign, you choose how your story begins:</p><ul><li><strong>Calm</strong> \u2014 Time to explore and orient. Low immediate threat.</li><li><strong>Standard</strong> \u2014 Clear hook with proportional stakes.</li><li><strong>Dire</strong> \u2014 High pressure from turn one. Immediate danger, scarce resources, ticking clock.</li></ul>`,
  },
  {
    id: 'saving-and-sharing', number: 21, title: 'Saving & Sharing',
    content: `<p>All save and share features are accessed through the settings menu in-game.</p><h3>Checkpoints</h3><p>Manual save points you can create and restore to. Up to 3 at a time. Drop a checkpoint before a risky decision, restore if things go sideways.</p><h3>Full Export / Import</h3><p>Download your entire game as a file. Load it back later. Useful for backups or moving between devices. Integrity-checked to prevent corruption.</p><h3>World Snapshots</h3><p>Save your world in two modes:</p><ul><li><strong>Fresh Start</strong> \u2014 Captures the world (factions, locations, NPCs, history) but resets NPC relationships and unresolved story threads. Start a new character in an established world.</li><li><strong>Branch</strong> \u2014 Captures the current state exactly. Fork your game to try a different path.</li></ul><h3>Snapshot Sharing</h3><p>Share a world snapshot with other players. They can start their own campaign in a world you built.</p><h3>Session Recap</h3><p>When you load a saved game, a "Previously On..." summary brings you up to speed on where you left off and what was happening.</p>`,
  },
];

const ALL_SECTIONS = [QUICK_START, ...SECTIONS];

// --- MAIN ---

export default function RulebookPage() {
  const [loaded, setLoaded] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const contentRef = useRef(null);
  const sectionRefs = useRef([]);

  useEffect(() => {
    setTimeout(() => setLoaded(true), 100);
  }, []);

  // Scroll spy
  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      let current = 0;

      for (let i = 0; i < sectionRefs.current.length; i++) {
        const el = sectionRefs.current[i];
        if (!el) continue;
        const offsetTop = el.offsetTop - container.offsetTop;
        if (scrollTop >= offsetTop - containerHeight * 0.3) {
          current = i;
        }
      }

      setActiveSection(current);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (index) => {
    const el = sectionRefs.current[index];
    const container = contentRef.current;
    if (!el || !container) return;
    const offsetTop = el.offsetTop - container.offsetTop;
    container.scrollTo({ top: offsetTop, behavior: 'smooth' });
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0e1a', color: 'var(--text-primary)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Injected global styles for content sections */}
      <style>{`
        .content-section h3 { font-family: 'Cinzel', serif; font-size: 14px; font-weight: 700; color: #c9a84c; letter-spacing: 0.06em; margin: 28px 0 12px 0; }
        .content-section p { font-family: 'Alegreya', serif; font-size: 16px; color: #b0b8cc; line-height: 1.8; margin-bottom: 16px; }
        .content-section ul, .content-section ol { margin: 0 0 16px 20px; font-family: 'Alegreya', serif; font-size: 16px; color: #b0b8cc; line-height: 1.8; }
        .content-section li { margin-bottom: 6px; }
        .content-section li strong { color: #d0c098; }
        .mechanic-callout { background: #111525; border: 1px solid #3a3328; border-left: 3px solid #c9a84c; border-radius: 0 6px 6px 0; padding: 16px 20px; margin: 20px 0; font-family: 'Alegreya Sans', sans-serif; font-size: 15px; color: #8a9ab8; line-height: 1.7; }
        .quickstart-callout { background: #111525; border: 1px solid #2a3148; border-left: 3px solid #8aba7a; border-radius: 0 6px 6px 0; padding: 16px 20px; margin: 20px 0; font-family: 'Alegreya Sans', sans-serif; font-size: 15px; color: #8a9ab8; line-height: 1.7; }
      `}</style>

      {/* Top bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '24px clamp(24px, 4vw, 56px)',
        borderBottom: '1px solid #1e2540',
      }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{
            fontFamily: 'var(--font-cinzel)', fontSize: 22, fontWeight: 900,
            color: 'var(--accent-gold)', letterSpacing: '0.06em',
          }}>CRUCIBLE</span>
          <span style={{
            fontFamily: 'var(--font-cinzel)', fontSize: 12, fontWeight: 600,
            color: 'var(--gold-muted)', letterSpacing: '0.18em',
          }}>RPG</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Link href="/pricing" className={styles.navLink}>Pricing</Link>
          <Link href="/faq" className={styles.navLink}>FAQ</Link>
          <span className={styles.navLinkActive}>Rulebook</span>
          <Link href="/auth" className={styles.navLink} style={{
            fontFamily: 'var(--font-cinzel)', fontSize: 12, fontWeight: 600,
            letterSpacing: '0.08em',
          }}>SIGN IN</Link>
        </div>
      </div>

      {/* Hero section */}
      <div style={{
        textAlign: 'center', padding: '48px 24px 36px',
      }}>
        <div style={{
          opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(16px)',
          transition: 'all 1s cubic-bezier(0.16,1,0.3,1) 0.1s',
        }}>
          <h1 style={{
            fontFamily: 'var(--font-cinzel)', fontSize: 'clamp(26px, 3.5vw, 34px)',
            fontWeight: 700, color: '#d0c098', marginBottom: 12,
          }}>The Rulebook</h1>
        </div>
        <div style={{
          opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(16px)',
          transition: 'all 1s cubic-bezier(0.16,1,0.3,1) 0.2s',
        }}>
          <p style={{
            fontFamily: 'var(--font-alegreya)', fontSize: 18, fontStyle: 'italic',
            fontWeight: 400, color: '#9a9480', marginBottom: 8,
          }}>Real rules. Real consequences. Here's how the system works.</p>
        </div>
        <div style={{
          opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(16px)',
          transition: 'all 1s cubic-bezier(0.16,1,0.3,1) 0.3s',
        }}>
          <span style={{
            fontFamily: 'var(--font-alegreya-sans)', fontSize: 14,
            color: 'var(--text-muted)',
          }}>21 sections &middot; Player-friendly reference &middot; No spoilers</span>
        </div>
      </div>

      {/* Main area: TOC sidebar + content */}
      <div style={{
        flex: 1, display: 'flex', maxWidth: 1100, width: '100%',
        margin: '0 auto', padding: '0 clamp(16px, 3vw, 48px) 48px',
        opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(16px)',
        transition: 'all 1s cubic-bezier(0.16,1,0.3,1) 0.4s',
      }}>
        {/* TOC Sidebar */}
        <div style={{
          width: 260, flexShrink: 0, position: 'sticky', top: 0,
          alignSelf: 'flex-start', paddingRight: 24,
        }}>
          <div style={{
            fontFamily: 'var(--font-cinzel)', fontSize: 11, fontWeight: 700,
            color: 'var(--gold-muted)', letterSpacing: '0.2em', marginBottom: 16,
            paddingBottom: 12, borderBottom: '1px solid #1e2540',
          }}>CONTENTS</div>
          <div className={styles.tocScroll} style={{
            maxHeight: 'calc(100vh - 220px)', overflowY: 'auto',
          }}>
            {ALL_SECTIONS.map((section, i) => (
              <a
                key={section.id}
                className={styles.tocLink}
                onClick={() => scrollToSection(i)}
                style={{
                  fontFamily: 'var(--font-alegreya-sans)', fontSize: 13,
                  color: activeSection === i
                    ? (section.isQuickStart ? '#8aba7a' : 'var(--accent-gold)')
                    : '#6b7a96',
                  fontWeight: activeSection === i ? 600 : 400,
                  padding: '5px 0',
                  display: 'flex', alignItems: 'baseline', gap: 8,
                }}
              >
                <span style={{
                  fontFamily: 'var(--font-jetbrains)', fontSize: 10,
                  color: activeSection === i
                    ? (section.isQuickStart ? '#8aba7a' : 'var(--accent-gold)')
                    : '#4a5568',
                  minWidth: 18,
                }}>{section.number}</span>
                {section.title}
              </a>
            ))}
          </div>
        </div>

        {/* Content area */}
        <div
          ref={contentRef}
          className={styles.scrollArea}
          style={{
            flex: 1, overflowY: 'auto', maxHeight: 'calc(100vh - 220px)',
            paddingRight: 16, paddingLeft: 8,
          }}
        >
          {ALL_SECTIONS.map((section, i) => (
            <div
              key={section.id}
              ref={(el) => { sectionRefs.current[i] = el; }}
              style={{
                marginBottom: 48, paddingBottom: 40,
                borderBottom: i < ALL_SECTIONS.length - 1 ? '1px solid #1e2540' : 'none',
              }}
            >
              {/* Section header */}
              <div style={{
                display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 20,
              }}>
                <span style={{
                  fontFamily: 'var(--font-jetbrains)', fontSize: 12,
                  color: section.isQuickStart ? '#8aba7a' : 'var(--accent-gold)',
                  opacity: 0.6,
                }}>{section.number.toString().padStart(2, '0')}</span>
                <h2 style={{
                  fontFamily: 'var(--font-cinzel)', fontSize: 18, fontWeight: 700,
                  color: section.isQuickStart ? '#8aba7a' : '#d0c098',
                  letterSpacing: '0.04em',
                }}>{section.title}</h2>
              </div>

              {/* Section content */}
              <div
                className="content-section"
                dangerouslySetInnerHTML={{ __html: section.content }}
              />
            </div>
          ))}

          {/* Bottom CTA */}
          <div style={{
            textAlign: 'center', padding: '48px 24px 24px',
          }}>
            <div style={{
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute', width: 400, height: 250, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(201,168,76,0.04) 0%, transparent 65%)',
                top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none',
              }} />
              <h2 style={{
                fontFamily: 'var(--font-cinzel)', fontSize: 'clamp(22px, 3vw, 28px)',
                fontWeight: 700, color: 'var(--text-heading)', marginBottom: 8,
                position: 'relative',
              }}>Every Hero Needs a Crucible.</h2>
              <p style={{
                fontFamily: 'var(--font-alegreya)', fontSize: 18, fontStyle: 'italic',
                fontWeight: 400, color: '#9a9480', marginBottom: 28,
                position: 'relative',
              }}>Yours is waiting.</p>
              <Link href="/auth" style={{ textDecoration: 'none' }}>
                <button
                  className={styles.btnPrimary}
                  style={{
                    fontFamily: 'var(--font-cinzel)', fontSize: 15, fontWeight: 700,
                    color: '#0a0e1a', letterSpacing: '0.1em',
                    background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-bright))',
                    border: 'none', borderRadius: 6, padding: '16px 44px',
                    position: 'relative',
                  }}
                >START PLAYING</button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        padding: 24, textAlign: 'center',
        borderTop: '1px solid #1e2540',
      }}>
        <span style={{
          fontFamily: 'var(--font-alegreya-sans)', fontSize: 14,
          color: 'var(--gold-footer)', letterSpacing: '0.04em',
        }}>&copy; 2026 CrucibleRPG &middot; Every hero needs a crucible.</span>
      </footer>
    </div>
  );
}
