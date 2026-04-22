import React from 'react';

/**
 * Parse text with [bracket notation] into React elements with clickable glossary terms.
 * Terms wrapped in brackets become clickable if they match a glossary entry.
 * Terms without brackets remain plain text.
 *
 * @param {string} text - Raw text that may contain [Bracketed Terms]
 * @param {Set|null} glossaryTerms - Set of known glossary term names (lowercase) for matching
 * @param {Function|null} onEntityClick - Callback when a linked term is clicked: ({ term, type })
 * @returns {React.ReactNode[]} Array of text and clickable span elements
 */
export function renderLinkedText(text, glossaryTerms, onEntityClick) {
  if (!text) return null;
  if (!glossaryTerms || glossaryTerms.size === 0 || !onEntityClick) return text;

  // Split on [bracketed terms] while keeping the brackets as delimiters
  const parts = text.split(/(\[[^\]]+\])/g);

  return parts.map((part, i) => {
    // Check if this part is a bracketed term
    const bracketMatch = part.match(/^\[([^\]]+)\]$/);
    if (bracketMatch) {
      const term = bracketMatch[1];
      const isKnown = glossaryTerms.has(term.toLowerCase());
      if (isKnown) {
        return (
          <span
            key={i}
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); onEntityClick({ term, type: 'item' }); }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onEntityClick({ term, type: 'item' }); } }}
            style={{
              color: '#c9a84c',
              cursor: 'pointer',
              borderBottom: '1px dotted rgba(201, 168, 76, 0.3)',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderBottomColor = 'rgba(201, 168, 76, 0.7)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderBottomColor = 'rgba(201, 168, 76, 0.3)'; }}
          >
            {term}
          </span>
        );
      }
      // Bracketed but not in glossary — render without brackets but as plain text
      return <React.Fragment key={i}>{term}</React.Fragment>;
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

/**
 * Render narrative prose: \n\n = paragraph break, \n = <br>, [brackets] = glossary links.
 * Shared across TurnBlock, ReflectionBlock, and any component rendering multi-paragraph prose.
 *
 * @param {string} text - Raw prose text
 * @param {Set|null} glossaryTerms - Set of known glossary term names (lowercase)
 * @param {Function|null} onEntityClick - Callback when a linked term is clicked
 * @returns {React.ReactNode[]|null} Array of <p> elements with linked text
 */
export function renderNarrative(text, glossaryTerms, onEntityClick) {
  if (!text) return null;
  return text.split('\n\n').map((paragraph, i) => {
    const lines = paragraph.split('\n');
    return (
      <p key={i}>
        {lines.map((line, j) => (
          <React.Fragment key={j}>
            {j > 0 && <br />}
            {renderLinkedText(line, glossaryTerms, onEntityClick)}
          </React.Fragment>
        ))}
      </p>
    );
  });
}

/**
 * Build a Set of lowercase glossary term names for fast lookup. Terms are
 * cleaned of any leading backend taxonomy tag (see `cleanDefinition`) so that
 * bracket-notation links like `[Roric the Fen-Grown]` in narrative match a
 * glossary entry stored as `"potential_ally Roric the Fen-Grown"`.
 *
 * @param {Object|null} glossaryData - The glossary data object with entries array
 * @returns {Set} Set of lowercase term strings (taxonomy-tag stripped)
 */
export function buildGlossaryTermSet(glossaryData) {
  if (!glossaryData?.entries) return new Set();
  return new Set(
    glossaryData.entries.map(e => (cleanDefinition(e.term) || '').toLowerCase())
  );
}

/**
 * Strip a leading backend taxonomy tag from a glossary/NPC/entity definition
 * or term. The AI narrator sometimes emits internal snake_case role tags at
 * the start of the value ("potential_ally Gaunt man...") — bookkeeping, not
 * player-facing prose. Handles the common surface variants:
 *   potential_ally Gaunt man...
 *   potential_ally. Gaunt man...   ← with trailing period
 *   potential_ally, Gaunt man...   ← with trailing comma
 *   potential_ally; Gaunt man...
 *   "potential_ally" Gaunt man...
 *   [potential_ally] Gaunt man...
 *   potential_ally: Gaunt man...
 *   potential_ally - Gaunt man...
 * The snake_case pattern requires at least one underscore segment, so single
 * lowercase words and properly capitalized definitions are untouched.
 * The proper fix is backend prompt tightening — this is a defensive strip.
 */
export function cleanDefinition(def) {
  if (!def || typeof def !== 'string') return def;
  return def.replace(
    /^["\[]?([a-z][a-z0-9]*(?:_[a-z0-9]+)+)["\]]?\s*[.,;:\-]?\s+/,
    ''
  );
}

/**
 * Strip leading "I choose option A/B/C:" style prefixes from a player-action
 * string. The frontend never adds this prefix (submitAction posts the raw
 * choice id), but some historical turn records from /history or
 * recentNarrative have it baked in — likely from an older client or an LLM
 * echo. This normalizes the display so all choice rows read as the action
 * itself, never the framing.
 *
 * Matches (case-insensitive):
 *   "I choose option A: ..."
 *   "I choose A: ..."
 *   "I chose option B. ..."
 *   "I chose C - ..."
 * Leaves custom actions (which don't start with "I chose/choose") untouched.
 */
export function cleanPlayerAction(text) {
  if (!text || typeof text !== 'string') return text;
  return text.replace(
    /^\s*i\s+cho(?:o|i)se\s+(?:option\s+)?[a-c]\s*[.,;:\-]?\s+/i,
    ''
  );
}
