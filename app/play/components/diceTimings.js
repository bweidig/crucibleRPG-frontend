// Timing tables for the dice roll animation, shared between /play's TurnRoll
// and the landing GameplayShowcase. All values are ms-from-tap. Steps either
// set the per-die animation phase or transition the stage machine.
//
// Extracted so the showcase can replay the same animation without depending
// on TurnRoll directly (which would drag in the ChallengePanel + autoRoll
// localStorage logic that don't apply to a marketing surface).

// Matched mode (or extreme: nat20 / nat1) — single die, stops at phase 1.
export const TIMING_PHASE_1_ONLY = [
  { at: 0,    phase: 'p1-throw' },
  { at: 180,  phase: 'p1-tumble' },
  { at: 730,  phase: 'p1-land' },
  { at: 1150, phase: 'p1-settled' },
  { at: 2100, stage: 'collapsing' },
  { at: 2650, stage: 'compact' },
];

// Outmatched / dominant (non-extreme) — crucible plays through phase 1, exits,
// then mortal1 + mortal2 drop in for phase 2.
export const TIMING_FULL = [
  { at: 0,    phase: 'p1-throw' },
  { at: 180,  phase: 'p1-tumble' },
  { at: 730,  phase: 'p1-land' },
  { at: 1150, phase: 'p1-settled' },
  { at: 1650, phase: 'p1-exit' },
  { at: 2200, phase: 'p2-drop' },
  { at: 2680, phase: 'p2-tumble' },
  { at: 3180, phase: 'p2-land' },
  { at: 3600, phase: 'p2-settled' },
  { at: 4600, stage: 'collapsing' },
  { at: 5150, stage: 'compact' },
];
