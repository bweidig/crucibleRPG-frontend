# Crucible RPG — API Contract

> **This contract is verified against backend code as of 2026-03-17. The frontend uses this as its single source of truth. Do not change response shapes without updating this document.**

**Last Updated:** 2026-03-20

Base URL: `https://<host>` (Railway production or `http://localhost:3000` local)

All game values use **x10 integer format** internally (7.3 → 73). Public API responses return **display format** (÷10).

---

## Table of Contents

- [Health Check](#health-check)
- [Auth (`/api/auth`)](#auth)
- [Games (`/api/games`)](#games)
- [Init Wizard (`/api/init`)](#init-wizard)
- [Gameplay (`/api/game`)](#gameplay)

---

## Health Check

### GET /health

No auth required. Used by Railway for deploy health checks.

**Response (200):**
```json
{ "status": "ok" }
```

### GET /api/health

Alias of `/health`.

---

## Auth

Mount: `/api/auth`

### POST /api/auth/signup

Create a new account.

**Request Body:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `email` | string | yes | Must contain `@` and `.` |
| `password` | string | yes | Min 8 chars (NIST 2025 — no complexity rules) |
| `displayName` | string | yes | Non-empty after trim, max 50 chars |
| `inviteCode` | string | no | Must match `INVITE_CODE` env var if set |

**Response (201):**
```json
{
  "token": "jwt-string",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "displayName": "Player One",
    "isPlaytester": false,
    "createdAt": "2026-03-16T..."
  }
}
```

**Status Codes:**
| Code | Meaning |
|------|---------|
| 201 | Account created |
| 400 | Missing/invalid field (email format, password < 8, displayName empty/too long) |
| 403 | Invite code required but missing or wrong |
| 409 | Email already registered |
| 500 | Internal server error |

---

### POST /api/auth/login

Authenticate with email/password.

**Request Body:**
| Field | Type | Required |
|-------|------|----------|
| `email` | string | yes |
| `password` | string | yes |

**Response (200):**
```json
{
  "token": "jwt-string",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "displayName": "Player One",
    "isPlaytester": true,
    "createdAt": "2026-03-16T..."
  }
}
```

**Status Codes:**
| Code | Meaning |
|------|---------|
| 200 | Login successful |
| 400 | Missing email or password |
| 401 | Email not found or password incorrect |
| 500 | Internal server error |

---

### POST /api/auth/google

Google OAuth sign-in. Creates account if new, logs in if existing.

**Request Body:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `credential` | string | yes | Google ID token from Google Identity Services |
| `inviteCode` | string | no | Required for new users if `INVITE_CODE` env var is set |

**Response (200 existing / 201 new):**
```json
{
  "token": "jwt-string",
  "user": {
    "id": 1,
    "email": "user@gmail.com",
    "displayName": "User Name",
    "isPlaytester": false,
    "createdAt": "2026-03-16T..."
  }
}
```

**Status Codes:**
| Code | Meaning |
|------|---------|
| 200 | Existing user logged in |
| 201 | New account created |
| 400 | Missing credential |
| 401 | Google token verification failed |
| 403 | New user, invite code required but missing/wrong |
| 409 | Email conflict (different account) |
| 500 | GOOGLE_CLIENT_ID not configured, or internal error |

---

### POST /api/auth/forgot-password

Placeholder endpoint. Always returns success (anti-enumeration).

**Request Body:**
| Field | Type | Required |
|-------|------|----------|
| `email` | string | yes |

**Response (200):**
```json
{ "message": "If an account with that email exists, a reset link has been sent." }
```

**Status Codes:**
| Code | Meaning |
|------|---------|
| 200 | Always (regardless of whether email exists) |
| 400 | Missing email |

---

## Games

Mount: `/api/games` — All endpoints require JWT (`Authorization: Bearer <token>`).

### GET /api/games

List all games owned by the authenticated user.

**Response (200):**
```json
{
  "games": [
    {
      "id": 5,
      "storyteller": "Bard",
      "setting": "Sword & Soil",
      "difficulty": "standard",
      "scenarioIntensity": "Standard",
      "status": "active",
      "createdAt": "2026-03-16T...",
      "character": { "id": 3, "name": "Jasper" }
    }
  ]
}
```

`character` is `null` if no character created yet.

---

### POST /api/games/new

Create a new game in `initializing` state. **Requires playtester access.**

**Request Body:** None (empty)

**Response (201):**
```json
{
  "gameId": 8,
  "status": "initializing",
  "createdAt": "2026-03-16T...",
  "storytellers": [
    { "id": "Chronicler", "name": "Chronicler", "tone": "...", "tagline": "...", "description": "..." }
  ]
}
```

**Status Codes:**
| Code | Meaning |
|------|---------|
| 201 | Game created |
| 403 | Not a playtester |
| 500 | Internal server error |

---

### GET /api/games/:id

Load full game state. **Requires playtester access.**

**Response (200):**
```json
{
  "id": 5,
  "storyteller": "Bard",
  "setting": "Sword & Soil",
  "settingDescription": null,
  "difficulty": "standard",
  "difficultyPreset": "standard",
  "scenarioIntensity": "Standard",
  "status": "active",
  "createdAt": "2026-03-16T...",
  "dials": {
    "dcOffset": 0.0,
    "fateDC": 16.0,
    "survivalEnabled": true,
    "durabilityEnabled": true,
    "progressionSpeed": 100,
    "encounterPressure": "standard",
    "fortunesBalanceEnabled": true
  },
  "character": {
    "id": 3,
    "name": "Jasper",
    "backstory": "...",
    "personality": "...",
    "appearance": "...",
    "gender": "male",
    "stats": {
      "STR": { "base": 5.0, "effective": 5.0 },
      "DEX": { "base": 5.0, "effective": 5.0 }
    },
    "skills": [{ "name": "Swordsmanship", "modifier": 1.0, "source": "backstory" }],
    "conditions": [{ "name": "Fatigued", "stat": "STR", "penalty": -1.0, "durationType": "until_long_rest", "source": "...", "isBuff": false }]
  },
  "clock": {
    "globalClock": 480,
    "totalTurn": 5,
    "sessionTurn": 2,
    "temporalScale": "Narrative",
    "weather": "Clear",
    "currentDay": 1
  },
  "recentNarrative": [
    { "turn": 5, "role": "narrator", "content": "...", "timestamp": "..." }
  ],
  "sessionRecap": "Previously on..."
}
```

`character`, `clock`, `sessionRecap` may be `null` if not yet created/applicable.

**Status Codes:**
| Code | Meaning |
|------|---------|
| 200 | Success |
| 403 | Not a playtester |
| 404 | Game not found or not owned |
| 500 | Internal server error |

---

### DELETE /api/games/:id

Delete a game and all associated data (ordered cascade across 23+ tables).

**Response (200):**
```json
{ "message": "Game deleted", "gameId": 5 }
```

**Status Codes:**
| Code | Meaning |
|------|---------|
| 200 | Deleted |
| 404 | Not found or not owned |
| 500 | Internal server error |

---

### POST /api/games/:id/export

Export full game state as JSON. Game must be active.

**Response (200):**
```json
{
  "exportVersion": "1.0",
  "schemaVersion": "4.5",
  "checksum": "sha256-hex",
  "world": { ... },
  "character": { ... },
  "clock": { ... },
  "narrative": [ ... ]
}
```

**Status Codes:**
| Code | Meaning |
|------|---------|
| 200 | Export successful |
| 400 | Game not active |
| 404 | Not found or not owned |
| 500 | Internal server error |

---

### POST /api/games/import

Import a previously exported game. Creates a new game with new IDs.

**Request Body:** The full export JSON object (as returned by `/export`).

**Validation:** `exportVersion` must match, `world` section required, checksum verified.

**Response (201):**
```json
{
  "gameId": 9,
  "imported": true,
  "message": "Game imported successfully. 12 turns of history restored.",
  "warnings": []
}
```

**Status Codes:**
| Code | Meaning |
|------|---------|
| 201 | Import successful |
| 400 | Invalid format, version mismatch, checksum mismatch |
| 500 | Internal server error |

---

### GET /api/games/snapshots

List all world snapshots owned by the authenticated user.

**Response (200):**
```json
{
  "snapshots": [
    {
      "id": 1,
      "name": "My World",
      "description": "A custom world",
      "type": "fresh_start",
      "visibility": "private",
      "shareToken": null,
      "setting": "Sword & Soil",
      "storyteller": "Bard",
      "factionCount": 3,
      "npcCount": 5,
      "locationCount": 6,
      "sourceTurnNumber": 10,
      "createdAt": "2026-03-16T..."
    }
  ],
  "count": 1
}
```

---

### GET /api/games/snapshots/:token

Public preview of a shared snapshot. **No auth required.**

**Response (200):**
```json
{
  "snapshot": {
    "name": "My World",
    "description": "...",
    "type": "fresh_start",
    "setting": "Sword & Soil",
    "storyteller": "Bard",
    "factionCount": 3,
    "npcCount": 5,
    "locationCount": 6,
    "createdBy": "Player One",
    "createdAt": "2026-03-16T..."
  }
}
```

**Status Codes:**
| Code | Meaning |
|------|---------|
| 200 | Success |
| 404 | Not found or private |
| 500 | Internal server error |

---

### POST /api/games/snapshots/:token/import

Import a shared snapshot by share token. Creates a new game at character creation phase.

**Request Body:** None

**Response (201):**
```json
{
  "gameId": 10,
  "imported": true,
  "message": "World imported! Create your character to begin.",
  "startPhase": "character_creation"
}
```

**Status Codes:**
| Code | Meaning |
|------|---------|
| 201 | Imported |
| 404 | Snapshot not found |
| 500 | Internal server error |

---

### POST /api/games/snapshots/:id/import-mine

Import your own snapshot by ID. Must own the snapshot.

**Request Body:** None

**Response (201):**
```json
{
  "gameId": 11,
  "imported": true,
  "message": "World imported! Create your character to begin.",
  "startPhase": "character_creation"
}
```

**Status Codes:**
| Code | Meaning |
|------|---------|
| 201 | Imported |
| 400 | Invalid snapshot ID |
| 404 | Not found or not owned |
| 500 | Internal server error |

---

### DELETE /api/games/snapshots/:id

Delete a snapshot you own.

**Response (200):**
```json
{ "deleted": true }
```

**Status Codes:**
| Code | Meaning |
|------|---------|
| 200 | Deleted |
| 400 | Invalid snapshot ID |
| 404 | Not found or not owned |
| 500 | Internal server error |

---

### PATCH /api/games/snapshots/:id

Update snapshot metadata. Must own the snapshot.

**Request Body (all optional, at least one required):**
| Field | Type | Validation |
|-------|------|------------|
| `name` | string | 1–100 chars (trimmed) |
| `description` | string or null | Max 500 chars |
| `visibility` | string | `'private'` or `'unlisted'` |

Setting `visibility` to `'unlisted'` auto-generates a share token if none exists.

**Response (200):**
```json
{
  "id": 1,
  "name": "Updated Name",
  "description": "...",
  "visibility": "unlisted",
  "shareToken": "abc123..."
}
```

**Status Codes:**
| Code | Meaning |
|------|---------|
| 200 | Updated |
| 400 | Invalid ID, no fields provided, or field validation error |
| 404 | Not found |
| 500 | Internal server error |

---

## Init Wizard

Mount: `/api/init` — All endpoints require JWT + game ownership.

### Phase 1: Storyteller Selection

#### GET /api/init/:gameId/storytellers

List available storyteller voices.

**Response (200):**
```json
{
  "storytellers": [
    {
      "id": "Chronicler",
      "name": "Chronicler",
      "tone": "Measured and factual",
      "tagline": "The world speaks for itself.",
      "description": "Clean, precise prose..."
    }
  ]
}
```

7 options: Chronicler, Bard, Trickster, Poet, Whisper, Noir, Custom.

---

#### POST /api/init/:gameId/storyteller

Save storyteller selection. **Idempotent** — safe to call multiple times.

**Request Body:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `selection` | string | no | One of: Chronicler, Bard, Trickster, Poet, Whisper, Noir, Custom |
| `customText` | string | no | Custom directive text |

At least one of `selection` or `customText` required. If only `customText`, storyteller becomes "Custom".

**Response (200):**
```json
{
  "storyteller": "Bard",
  "directive": null,
  "message": "Storyteller set to Bard"
}
```

**Status Codes:**
| Code | Meaning |
|------|---------|
| 200 | Saved |
| 400 | Neither field provided, invalid storyteller name, empty customText |
| 500 | Internal server error |

---

### Phase 2: Setting Selection

#### GET /api/init/:gameId/settings

List settings with guided questions.

**Response (200):**
```json
{
  "settings": [
    {
      "id": "Sword & Soil",
      "name": "Sword & Soil",
      "description": "Medieval, agrarian, feudal...",
      "questions": [
        {
          "id": "supernatural",
          "label": "Supernatural / magic",
          "options": ["None", "Rare", "Common"],
          "allowCustom": true
        }
      ]
    }
  ]
}
```

7 settings: Sword & Soil, Smoke & Steel, Concrete & Code, Stars & Circuits, Ash & Remnants, Dream & Myth, Custom.

---

#### POST /api/init/:gameId/setting

Save setting and trigger world generation. **Idempotent** — re-submission updates the setting record; world data is only generated once. Uses AI to generate setting-appropriate factions, locations, NPCs, hooks, and species. Falls back to stub data on AI failure.

**Request Body:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `selection` | string | no | One of the 7 valid settings |
| `customText` | string | no | Custom setting description |
| `answers` | object | no | `{ questionId: { selected, custom }, ... }` |

At least one of `selection` or `customText` required.

**Response (200):**
```json
{
  "setting": "Sword & Soil",
  "settingDescription": null,
  "settingParameters": null,
  "worldGenStatus": "complete",
  "message": "Setting saved. World generation complete."
}
```

**Status Codes:**
| Code | Meaning |
|------|---------|
| 200 | Saved + world generated |
| 400 | Neither field provided, invalid setting, empty customText |
| 500 | World generation failed minimum validation (details array included) |

**Side Effects:** Inserts 3 factions, 6 locations (hierarchical), 2 routes, 5 NPCs, 2 causal anchors, 5 scarcity entries, 2 species. Only on first call — skipped if data already exists.

---

### Phase 2.1: World Generation Status

#### GET /api/init/:gameId/world-status

Poll world generation progress.

**Response (200):**
```json
{
  "status": "complete",
  "ready": true,
  "summary": {
    "factions": 3,
    "locations": 6,
    "npcs": 5,
    "unresolvedHooks": 2
  }
}
```

`status`: `"pending"` | `"generating"` | `"complete"`. `summary` only present when `complete`.

---

### Species

#### GET /api/init/:gameId/species

List available species for this world.

**Response (200):**
```json
{
  "species": [
    {
      "id": null,
      "name": "Human",
      "physicalDescription": null,
      "culturalNotes": "The default. No innate traits, no penalties...",
      "commonTraits": [],
      "typicalTradeoffs": null,
      "homeland": null
    },
    {
      "id": 1,
      "name": "Thornkin",
      "physicalDescription": "Bark-like skin...",
      "culturalNotes": "Forest-dwelling...",
      "commonTraits": ["bark_skin", "low_light_vision", "nature_affinity"],
      "typicalTradeoffs": "Positive: low-light vision... Negative: conspicuous...",
      "homeland": "The Thornwood"
    }
  ],
  "count": 3
}
```

First entry is always Human with `id: null`.

---

### Phase 3: Character Creation

#### POST /api/init/:gameId/character

Create or update the character. **Idempotent** — updates existing character on re-call (200), creates new on first call (201).

**Prerequisite:** `world_gen_status === 'complete'`

**Request Body:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `name` | string | yes | 1–100 chars, non-empty after trim |
| `backstory` | string | no | Must be string if provided |
| `personality` | string | no | Must be string if provided |
| `appearance` | string | no | Must be string if provided |
| `gender` | string | no | Must be string if provided |
| `species` | string | no | Species name; "human" or empty → stored as null |

**Response (201 new / 200 update):**
```json
{
  "character": {
    "id": 3,
    "name": "Jasper",
    "backstory": "A wandering swordsman...",
    "personality": "Quiet and observant",
    "appearance": "Tall, dark hair",
    "gender": "male",
    "species": "Thornkin"
  },
  "message": "Character created. Proceed to Phase 4 (proposal generation)."
}
```

**Status Codes:**
| Code | Meaning |
|------|---------|
| 201 | Character created |
| 200 | Existing character updated |
| 400 | Name missing/too long, invalid field type, world gen not complete |
| 500 | Internal server error |

---

### Phase 4: AI Character Proposal

#### POST /api/init/:gameId/generate-proposal

Generate stat/skill/loadout proposal from backstory. **Idempotent** — generates fresh each time, no DB writes.

**Prerequisites:** Character exists (Phase 3), world gen complete.

**Request Body:**
| Field | Type | Required | Default |
|-------|------|----------|---------|
| `tier` | string | no | `'novice'` |
| `skillRequests` | string | no | `''` |
| `gearRequests` | string | no | `''` |

Allowed tiers: `novice`, `competent`, `veteran`, `legendary`.

`skillRequests`: Freetext player request for specific skills (e.g., "I want shadow magic" or "Some kind of healing ability"). Treated as strong preferences — the AI will include them in the proposal.

`gearRequests`: Freetext player request for specific starting gear (e.g., "An old family sword" or "A leather journal with strange symbols"). The AI will contextualize unusual requests to fit the setting.

**Response (200):**
```json
{
  "proposal": {
    "tier": "novice",
    "stats": { "STR": 5.5, "DEX": 4.5, "CON": 5.0, "INT": 4.0, "WIS": 4.5, "CHA": 3.5 },
    "skills": ["Swordsmanship", "Perception", "Endurance"],
    "foundationalSkills": [
      { "stat": "STR", "breadthCategory": "narrow", "scope": "longswords" },
      { "stat": "DEX", "breadthCategory": "broad", "scope": "wilderness survival" }
    ],
    "startingLoadout": [
      { "name": "Longsword", "slotCost": 1.5, "materialQuality": "common", "equipmentCategory": "weapon", "damageModifier": 0.5 },
      { "name": "Leather Armor", "slotCost": 2.0, "materialQuality": "common", "equipmentCategory": "armor", "armorType": "light" },
      { "name": "Traveler's Pack", "slotCost": 1.0, "materialQuality": "common", "equipmentCategory": "general", "inventoryBonus": 3.0 },
      { "name": "Waterskin", "slotCost": 0.5, "materialQuality": "common", "equipmentCategory": "general" }
    ],
    "factionStandings": [
      { "factionId": 1, "factionName": "The Iron Guard", "standing": 1 },
      { "factionId": 2, "factionName": "Merchant's Consortium", "standing": 0 }
    ],
    "narrativeBackstory": "Jasper grew up in...",
    "innateTraits": [
      { "trait": "darkvision", "source": "Thornkin physiology" }
    ],
    "species": "Thornkin"
  },
  "validation": {
    "valid": true,
    "hardErrors": [],
    "softWarnings": []
  },
  "source": "ai",
  "message": "AI-generated proposal based on your backstory. Review and adjust as needed."
}
```

`source`: `"ai"` | `"ai_retry"` | `"stub"` (fallback on AI failure). `innateTraits` empty for humans. `species` null for humans.

**Status Codes:**
| Code | Meaning |
|------|---------|
| 200 | Proposal generated |
| 400 | No character (Phase 3 incomplete), world gen not complete |
| 500 | Internal server error |

---

### Phase 4a: Finalize Character

#### POST /api/init/:gameId/adjust-proposal

Submit final character build. Writes stats, skills, inventory, standings to DB. **Idempotent** — clears and re-inserts all character data on re-call.

**Prerequisites:** Character exists (Phase 3).

**Request Body:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `stats` | object | yes | `{ STR, DEX, CON, INT, WIS, CHA }` — all numbers, 1.0–20.0. `POT` optional. |
| `skills` | string[] | no | Backstory skill names |
| `foundationalSkills` | object[] | no | `[{ stat, breadthCategory, scope }]` — scope required, breadthCategory: narrow/broad/knowledge |
| `startingLoadout` | object[] | no | `[{ name, slotCost, materialQuality, equipmentCategory, damageModifier?, armorType?, inventoryBonus?, tags? }]` — total slotCost must fit capacity |
| `factionStandings` | object[] | no | `[{ factionId?, factionName?, standing }]` — standing: integer -10 to 10 |
| `heirloom` | string | no | Item name from loadout to designate as heirloom |
| `narrativeBackstory` | string | no | Updates character backstory field |
| `innateTraits` | object[] | no | Species innate traits from proposal |
| `tier` | string | no | For soft tier-range warnings |

**Response (200):**
```json
{
  "valid": true,
  "hardErrors": [],
  "softWarnings": [],
  "character": {
    "id": 3,
    "name": "Jasper",
    "stats": {
      "STR": { "base": 5.5, "effective": 5.5 },
      "DEX": { "base": 4.5, "effective": 4.5 }
    },
    "skills": [{ "name": "Swordsmanship", "modifier": 1.0, "source": "backstory" }],
    "foundationalSkills": [{ "scope": "longswords", "breadthCategory": "narrow", "stat": "STR" }],
    "inventory": {
      "items": [{ "name": "Longsword", "slotCost": 1.5, "materialQuality": "common" }],
      "maxSlots": 10.5,
      "usedSlots": 5.0,
      "remainingSlots": 5.5
    },
    "factionStandings": [{ "factionName": "The Iron Guard", "standing": 1 }],
    "heirloom": null
  },
  "message": "Character finalized. Proceed to Phase 4.5 (difficulty configuration)."
}
```

**Hard Errors (400):**
```json
{
  "valid": false,
  "hardErrors": ["stats.STR below minimum 1.0 (got 0.5)"],
  "softWarnings": [],
  "message": "Proposal has hard boundary violations. Correct and resubmit."
}
```

**Status Codes:**
| Code | Meaning |
|------|---------|
| 200 | Character finalized |
| 400 | Missing character (Phase 3), hard validation errors |
| 500 | Internal server error |

**Side Effects:** Writes to character_stats, character_skills, foundational_skills, inventory_items, player_faction_standing, characters (backstory, innate_traits, location). Initializes world_clock, scene_state, chronicle, context_budget_config (idempotent).

---

### Phase 4.5: Difficulty Configuration

#### GET /api/init/:gameId/difficulty-presets

List all difficulty presets with current selection.

**Response (200):**
```json
{
  "presets": {
    "forgiving": {
      "dcOffset": -2.0,
      "fateDc": 8.0,
      "survivalEnabled": false,
      "durabilityEnabled": false,
      "progressionSpeed": 100,
      "encounterPressure": "low",
      "fortunesBalanceEnabled": true,
      "simplifiedOutcomes": false
    },
    "standard": { "..." },
    "harsh": { "..." },
    "brutal": { "..." }
  },
  "current": { "preset": "standard" }
}
```

---

#### POST /api/init/:gameId/difficulty

Save difficulty configuration. **Idempotent** — overwrites existing dials.

**Request Body:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `preset` | string | no | `forgiving` / `standard` / `harsh` / `brutal` (case-insensitive) |
| `overrides` | object | no | `{ dialName: value }` — applied on top of preset |

At least one required. Valid dials: `dc_offset`, `fate_dc`, `survival_enabled`, `durability_enabled`, `progression_speed`, `encounter_pressure`, `fortunes_balance_enabled`, `simplified_outcomes`.

**Response (200):**
```json
{
  "difficulty": {
    "preset": "standard",
    "dcOffset": 0.0,
    "fateDc": 16.0,
    "survivalEnabled": true,
    "durabilityEnabled": true,
    "progressionSpeed": 100,
    "encounterPressure": "standard",
    "fortunesBalanceEnabled": true
  },
  "message": "Difficulty configuration saved."
}
```

**Status Codes:**
| Code | Meaning |
|------|---------|
| 200 | Saved |
| 400 | Neither field provided, invalid preset, invalid dial name/value |
| 500 | Internal server error |

---

### Phase 5: Scenario Selection

#### GET /api/init/:gameId/intensity-options

List scenario intensity options.

**Response (200):**
```json
{
  "options": [
    { "id": "Calm", "name": "Calm", "description": "Low immediate threat..." },
    { "id": "Standard", "name": "Standard", "description": "Moderate tension..." },
    { "id": "Dire", "name": "Dire", "description": "High pressure from turn one..." }
  ]
}
```

---

#### POST /api/init/:gameId/generate-scenarios

Generate 3 opening scenarios via AI, tailored to the character and world. **Idempotent** — regenerates fresh each time. Falls back to stub scenarios on AI failure. Results are cached for `select-scenario`.

**Prerequisites:** Game status `initializing`, world gen complete, character finalized (has stats), world meets minimums.

**Request Body:**
| Field | Type | Required | Allowed Values |
|-------|------|----------|----------------|
| `intensity` | string | yes | `Calm`, `Standard`, `Dire` |

**Response (200):**
```json
{
  "intensity": "Standard",
  "scenarios": [
    { "title": "The Ambush", "type": "Flashpoint/Action", "description": "Smoke rises..." },
    { "title": "The Letter", "type": "Subtle Hook/Intrigue", "description": "A sealed letter..." },
    { "title": "The Long Road", "type": "Long Road/Survival", "description": "Three days from..." }
  ],
  "startingGold": 15,
  "startingTimeOfDay": 14,
  "inventory": [
    { "name": "Waterskin", "slotCost": 0.5, "materialQuality": "common", "equipmentCategory": "general" },
    { "name": "Trail Rations (3 days)", "slotCost": 1.0, "materialQuality": "common", "equipmentCategory": "general" },
    { "name": "Bedroll", "slotCost": 1.0, "materialQuality": "common", "equipmentCategory": "general" }
  ],
  "customStartAvailable": true
}
```

Gold/time by intensity: Calm=25/8, Standard=15/14, Dire=5/22.

> **Stub notice:** Scenarios are currently stub-generated from hardcoded Ironhaven world data (not AI-generated). The response shape is correct and stable, but content will not vary between games. AI scenario generation (`generateScenariosViaAI`) exists in init-prompts.js but is not yet wired up.

**Status Codes:**
| Code | Meaning |
|------|---------|
| 200 | Scenarios generated |
| 400 | Invalid intensity, game not initializing, world gen incomplete, character not finalized, world minimums not met |
| 500 | Internal server error |

---

#### POST /api/init/:gameId/select-scenario

Commit scenario selection and start the game. **Idempotent** — re-selection resets active game back to initializing, then reactivates.

**Request Body:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `scenarioIndex` | number or `"custom"` | conditional | 0, 1, or 2 — picks a generated scenario |
| `customStart` | object | conditional | `{ locationId?: number, startingTimeOfDay?: number (0-23) }` |

Either `scenarioIndex` (0–2) or `customStart` required.

**Response (200):**
```json
{
  "status": "active",
  "scenarioTitle": "The Ambush",
  "startingTimeOfDay": 14,
  "startingLocationId": 42,
  "characterId": 3,
  "message": "Game started. Ready for first turn."
}
```

**Status Codes:**
| Code | Meaning |
|------|---------|
| 200 | Game started |
| 400 | Invalid scenarioIndex, missing input, no character, invalid locationId, game not in initializing/active phase |
| 500 | Internal server error |

**Side Effects:** Adds scenario inventory items + gold (non-custom only), sets starting location, initializes clock, sets `last_fed_at`, transitions game to `active`.

---

## Gameplay

Mount: `/api/game` — All endpoints require JWT + game ownership. Game must be `active` unless noted.

### GET /api/game/:id/stream

Server-Sent Events connection. Currently used for initial connection confirmation and non-advancing command push notifications. Turn content is delivered via synchronous POST responses (not SSE).

**Auth:** Query parameter `?token=<JWT>` (not Authorization header).

**SSE Events:**
| Event | Data | When |
|-------|------|------|
| `connected` | `{ gameId }` | On connection |
| `command:response` | `{ command, data }` | After non-advancing command (mirror of HTTP response) |
| `: heartbeat` | (comment, no data) | Every 30s |

**Status Codes:**
| Code | Meaning |
|------|---------|
| 200 | SSE stream established |
| 400 | Game not active |
| 401 | Missing/invalid/expired token |

---

### GET /api/game/:id/state

Full current game state snapshot.

**Response (200):**
```json
{
  "game": {
    "id": 5,
    "status": "active",
    "turnNumber": 12,
    "sessionTurn": 3,
    "clock": { "day": 2, "hour": 14, "minute": 30 },
    "storyteller": "Bard",
    "difficulty": {
      "dcOffset": 0.0,
      "fateDc": 16.0,
      "survivalEnabled": true,
      "durabilityEnabled": true,
      "progressionSpeed": 100,
      "encounterPressure": "standard",
      "fortunesBalanceEnabled": true
    }
  },
  "character": {
    "id": 3,
    "name": "Jasper",
    "stats": { "str": 5.5, "dex": 4.5, "con": 5.0, "int": 4.0, "wis": 4.5, "cha": 3.5 },
    "effectiveStats": { "str": 4.5, "dex": 4.5, "con": 5.0, "int": 4.0, "wis": 4.5, "cha": 3.5 },
    "skills": [{ "name": "Swordsmanship", "modifier": 1.0, "type": "discovered", "contextTags": [] }],
    "conditions": [{ "name": "Fatigued", "stat": "str", "penalty": -1.0, "duration": "until_long_rest", "turnsRemaining": null }],
    "inventory": {
      "maxSlots": 10.5,
      "usedSlots": 5.0,
      "encumbrance": "light",
      "items": [{ "name": "Longsword", "slotCost": 1.5, "entropy": "intact", "readiness": "ready", "quality": 0.0, "equipped": true }],
      "currency": { "display": "15 coins", "raw": 15 }
    }
  },
  "narrative": {
    "currentScene": "The market square bustles...",
    "recentHistory": ["..."],
    "availableActions": {
      "options": [
        { "id": "A", "text": "Approach the merchant" },
        { "id": "B", "text": "Investigate the alley" },
        { "id": "C", "text": "Rest at the inn" }
      ],
      "customAllowed": true
    }
  },
  "world": {
    "currentLocation": "Market Quarter",
    "factionStandings": [{ "faction": "The Iron Guard", "standing": 1 }],
    "activeQuests": [{ "title": "The Missing Caravan", "stage": 1, "status": "active" }],
    "objectives": ["Find the caravan"]
  }
}
```

**Notes:**
- `character.stats` and `effectiveStats` are flat objects with **lowercase** keys (e.g., `"str"`, `"dex"`). Values are plain numbers (display format). This differs from `GET /games/:id` which uses `{ "STR": { base, effective } }` nesting and uppercase keys.
- `character.conditions[].stat` is lowercase.
- `character.inventory.items[]` uses `entropy` (durability state string: "intact"/"worn"/"damaged"/"broken") and `readiness` (state string: "ready"/"compromised"), not raw numeric durability.
- `narrative.availableActions.options[].id` values are `"A"`, `"B"`, `"C"` (mapped from stored option labels, D filtered out — use `custom` field instead).

**Status Codes:**
| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Game not active, no character |
| 500 | Internal server error |

---

### POST /api/game/:id/action

Unified action endpoint — player choices, custom actions, and bracket commands.

**Rate Limiting:** 10 advancing actions per 60s per user.

**Request Body (exactly one of `choice` / `custom` / `command` required):**
| Field | Type | Notes |
|-------|------|-------|
| `choice` | string | `"A"`, `"B"`, or `"C"` — select a presented option. `"D"` is rejected (use `custom` instead). |
| `custom` | string | Free-text action, max 500 chars |
| `command` | string | Bracket command name (see below) |
| `target` | string | For `travel_to`, `forced_march`, `restore_checkpoint`, `delete_checkpoint` |
| `text` | string | For `set_objective`, `checkpoint` |
| `name` | string | For `checkpoint` |

**Valid Commands:**

| Command | Advances Turn | Params | Description |
|---------|---------------|--------|-------------|
| `status_report` | no | — | Full game state |
| `briefing` | no | — | Current scene summary |
| `skill_review` | no | — | All character skills |
| `objectives` | no | — | Server quests + player objectives |
| `help` | no | — | List available commands |
| `set_objective` | no | `text` | Create a player objective |
| `checkpoint` | no | `name` | Save a checkpoint (max 3) |
| `restore_checkpoint` | no | `target` (name) | Restore a checkpoint |
| `delete_checkpoint` | no | `target` (name) | Delete a checkpoint |
| `long_rest` | **yes** | — | Rest (advances time) |
| `travel_to` | **yes** | `target` (location) | Travel to location |
| `forced_march` | **yes** | `target` (location) | Forced march to location |

**Response — Non-advancing command (200):**
```json
{
  "turnAdvanced": false,
  "command": "status_report",
  "data": { ... }
}
```

**Response — Advancing action (200):**
```json
{
  "turnAdvanced": true,
  "turn": { "number": 13, "sessionTurn": 4 },
  "resolution": {
    "action": "I choose option A: Approach the merchant",
    "stat": "cha",
    "skillUsed": "Persuasion",
    "skillModifier": 1.0,
    "equipmentQuality": 0.0,
    "appearanceModifier": null,
    "dc": 12.0,
    "fortunesBalance": "matched",
    "crucibleRoll": null,
    "crucibleExtreme": null,
    "diceRolled": [14],
    "dieSelected": 14,
    "debtPenalty": 0,
    "total": 14.5,
    "margin": 2.5,
    "tier": "T4",
    "tierName": "Strong Success",
    "isCombat": false
  },
  "narrative": "The merchant eyes you warily...",
  "stateChanges": {
    "conditions": { "added": [], "removed": [], "modified": [] },
    "inventory": { "added": [], "removed": [], "modified": [] },
    "clock": { "day": 2, "hour": 14, "minute": 50 },
    "quests": { "updated": [] },
    "factions": { "changed": [] },
    "stats": { "str": 5.5, "dex": 4.5, "con": 5.0, "int": 4.0, "wis": 4.5, "cha": 3.5 }
  },
  "nextActions": {
    "options": [
      { "id": "A", "text": "Haggle for a discount" },
      { "id": "B", "text": "Ask about the missing caravan" },
      { "id": "C", "text": "Browse and leave" }
    ],
    "customAllowed": true
  }
}
```

**Notes:**
- `resolution` is `null` when the turn involves no mechanical check (pure narrative turns, e.g. long rest).
- `resolution.stat` is always lowercase (`"cha"`, `"str"`, etc.).
- `stateChanges.stats` contains post-commit effective stats (base minus condition penalties) with lowercase keys. This is the authoritative stat snapshot after the turn resolves.

**Debug Data (AD-355):** When `X-Debug: true` header is sent by a playtester, all responses include a `_debug` object:
```json
{
  "_debug": {
    "timing": { "total": 8500, "ai": 6200, "db": 300, "resolutionMs": 12, "contextMs": 450 },
    "ai": {
      "provider": "openai", "model": "gpt-5.1-chat-latest", "task": "narrative",
      "tokens": { "prompt": 9962, "completion": 1009, "total": 10971 },
      "estimatedCost": 0.0225, "latencyMs": 6200, "attempts": 1
    },
    "resolution": {
      "autoResolved": false, "stat": "DEX", "effectiveValue": 8.3, "skillUsed": "Stealth",
      "skillModifier": 1.5, "equipmentQuality": 0, "fortunesBalance": "outmatched",
      "diceRolled": [14, 8], "dieSelected": 14, "dc": 16.0, "total": 23.3,
      "margin": 7.3, "tier": "T2", "tierName": "Solid Success",
      "debtPenalty": 0, "isCombat": false
    },
    "context": { "layers": { "L1": 2100, "L2": 4800, "L3": 1200, "L4": 0, "total": 8100 } },
    "narrative": { "aiResponseLength": 1200, "narrativeLength": 800, "optionsGenerated": 4 },
    "stateChanges": { "tablesWritten": ["narrative_log:write"], "conditions": { "added": [], "removed": [], "modified": [] } }
  }
}
```

**Status Codes:**
| Code | Meaning |
|------|---------|
| 200 | Success (advancing action or non-advancing command) |
| 400 | Invalid input, game not active, no character, unknown command |
| 429 | Rate limited (advancing actions only) |
| 500 | Internal server error |
| 503 | AI provider timeout or error |

---

### GET /api/game/:id/character

Full character sheet with per-stat condition breakdowns.

**Response (200):**
```json
{
  "character": {
    "id": 3,
    "name": "Jasper",
    "backstory": "...",
    "personality": "...",
    "appearance": "...",
    "gender": "male"
  },
  "stats": {
    "str": {
      "base": 5.5,
      "effective": 4.5,
      "conditions": [{ "name": "Fatigued", "penalty": -1.0 }]
    }
  },
  "skills": [
    { "name": "Swordsmanship", "modifier": 1.0, "type": "active", "source": "backstory", "contextTags": [] },
    { "name": "Wilderness Survival", "modifier": 1.0, "type": "foundational", "source": "backstory", "contextTags": ["EXPLORATION", "SURVIVAL"] }
  ],
  "conditions": [
    {
      "id": 12,
      "name": "Fatigued",
      "stat": "str",
      "penalty": -1.0,
      "durationType": "until_long_rest",
      "turnsRemaining": null,
      "escalation": null,
      "source": "Exertion"
    }
  ],
  "inventory": {
    "maxSlots": 10.5,
    "usedSlots": 5.0,
    "encumbrance": "light",
    "currency": { "display": "15 coins", "raw": 15 },
    "equipped": [
      { "id": 1, "name": "Longsword", "slotCost": 1.5, "durability": 100, "maxDurability": 100, "materialQuality": "Common", "qualityBonus": 0.0, "tags": ["fast"], "heirloom": false, "equipmentCategory": "weapon", "equippedSlot": "main_hand", "damageModifier": 1.0, "armorType": null, "armorMitigation": null, "elementTag": null, "archetypeId": "longsword", "channelModifier": null, "implementType": null, "spikeType": null, "ammunitionCurrent": null, "ammunitionMax": null }
    ],
    "carried": [
      { "id": 2, "name": "Waterskin", "slotCost": 0.5, "durability": 50, "maxDurability": 50, "materialQuality": "Common", "qualityBonus": 0.0, "tags": [], "heirloom": false, "equipmentCategory": "general", "equippedSlot": null, "damageModifier": null, "armorType": null, "armorMitigation": null, "elementTag": null, "archetypeId": null, "channelModifier": null, "implementType": null, "spikeType": null, "ammunitionCurrent": null, "ammunitionMax": null }
    ]
  },
  "companions": [
    { "id": 1, "name": "Wolf", "specialty": "combat", "loyalty": 8, "woundState": "healthy" }
  ]
}
```

**Notes:**
- `stats` keys are always lowercase (`"str"`, `"dex"`, etc.).
- `skills[].contextTags` is always `[]` for `type: "active"` skills. Only `type: "foundational"` skills have populated context tags.
- `conditions[].stat` is lowercase.
- `inventory` splits into `equipped` and `carried` arrays (unlike `/state` which has a flat `items` array).
- AD-405: Item objects include mechanical fields: `equipmentCategory`, `equippedSlot`, `damageModifier` (weapons), `armorType`/`armorMitigation` (armor: light=0.5, medium=1.0, heavy=1.5), `elementTag`, `archetypeId`, `channelModifier`/`implementType` (implements), `spikeType`, `ammunitionCurrent`/`ammunitionMax`. Null when not applicable.

---

### GET /api/game/:id/glossary

Discovered glossary entries with optional filtering.

**Query Parameters:**
| Param | Type | Notes |
|-------|------|-------|
| `category` | string | Filter by category (case-insensitive) |
| `search` | string | Search term/definition (case-insensitive) |

**Response (200):**
```json
{
  "entries": [
    { "id": 1, "term": "Crucible Roll", "definition": "A contested die roll...", "category": "mechanics", "discoveredAt": "Turn 3" }
  ],
  "count": 1
}
```

---

### GET /api/game/:id/map

Hierarchical location map with zoom levels.

**Query Parameters:**
| Param | Type | Notes |
|-------|------|-------|
| `level` | number | Location ID to zoom into. Omit for current/top level. |

**Response (200):**
```json
{
  "currentLevel": null,
  "label": "The Ashenmoor Region",
  "parent": null,
  "breadcrumbs": [],
  "currentLocationId": 42,
  "locations": [
    { "id": 10, "name": "Ironhaven", "type": "settlement", "dangerLevel": null, "status": "current", "controllingFaction": "The Iron Guard", "hasChildren": true },
    { "id": 11, "name": "The Thornwood", "type": "wilderness", "dangerLevel": 2, "status": "discovered", "controllingFaction": null, "hasChildren": false }
  ],
  "routes": [
    { "id": "route_5_1", "origin": 10, "destination": 11, "travelDays": 1.0, "dangerLevel": 1, "terrain": "trail", "known": true }
  ]
}
```

**Status Codes:**
| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Game not active, location has no sub-locations |
| 404 | Location not found |
| 500 | Internal server error |

---

### GET /api/game/:id/history

Paginated turn history, most recent first.

**Query Parameters:**
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `page` | number | 1 | 1-indexed |
| `pageSize` | number | 20 | Max 50 |

**Response (200):**
```json
{
  "turns": [
    {
      "number": 12,
      "narrative": "The merchant nods slowly...",
      "playerAction": "Ask about the missing caravan",
      "location": "Market Quarter",
      "timestamp": { "day": 2, "hour": 14, "minute": 30 }
    }
  ],
  "total": 12,
  "page": 1,
  "pageSize": 20
}
```

---

### POST /api/game/:id/notes

Create a player note. Max 100 notes per game.

**Request Body:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `entityType` | string | yes | `npc`, `location`, `faction`, `item`, `quest`, `general` |
| `entityId` | number/string | conditional | Required unless entityType is `general` |
| `text` | string | yes | 1–500 chars |

**Response (201):**
```json
{
  "id": 5,
  "entityType": "npc",
  "entityId": 1,
  "text": "Seems trustworthy but evasive about the caravan",
  "createdAt": "2026-03-16T...",
  "updatedAt": "2026-03-16T..."
}
```

---

### GET /api/game/:id/notes

List all player notes with entity name resolution.

**Response (200):**
```json
{
  "notes": [
    {
      "id": 5,
      "entityType": "npc",
      "entityId": 1,
      "entityName": "Captain Maren Holt",
      "text": "Seems trustworthy but evasive about the caravan",
      "createdAt": "2026-03-16T...",
      "updatedAt": "2026-03-16T..."
    }
  ]
}
```

---

### DELETE /api/game/:id/notes/:noteId

Delete a player note. Must own the note.

**Response (200):**
```json
{ "message": "Note deleted", "id": 5 }
```

**Status Codes:** 200 (deleted), 400 (invalid ID), 404 (not found).

---

### PUT /api/game/:id/settings/difficulty

Update difficulty dials mid-game. Same contract as init `POST /difficulty`.

**Request Body:**
| Field | Type | Notes |
|-------|------|-------|
| `preset` | string | `forgiving` / `standard` / `harsh` / `brutal` |
| `overrides` | object | `{ dialName: value }` |

At least one required.

**Response (200):**
```json
{
  "dcOffset": 0.0,
  "fateDc": 16.0,
  "survivalEnabled": true,
  "durabilityEnabled": true,
  "progressionSpeed": 100,
  "encounterPressure": "standard",
  "fortunesBalanceEnabled": true,
  "simplifiedOutcomes": false,
  "preset": "standard"
}
```

---

### PUT /api/game/:id/settings/storyteller

Change storyteller voice mid-game. Same contract as init `POST /storyteller`.

**Request Body:**
| Field | Type | Notes |
|-------|------|-------|
| `selection` | string | Storyteller name |
| `customText` | string | Custom directive |

At least one required.

**Response (200):**
```json
{ "storyteller": "Noir", "directive": null, "message": "Storyteller set to Noir" }
```

---

### GET /api/game/:id/checkpoints

List saved checkpoints. Max 3 per game.

**Response (200):**
```json
{
  "checkpoints": [
    { "id": 1, "name": "Before the cave", "turnNumber": 10, "createdAt": "2026-03-16T..." }
  ],
  "count": 1,
  "maxAllowed": 3
}
```

---

### POST /api/game/:id/snapshot

Create a world snapshot for sharing/branching.

**Request Body:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `name` | string | yes | 1–100 chars |
| `description` | string | no | Max 500 chars |
| `type` | string | yes | `fresh_start` or `branch` |
| `visibility` | string | no | `private` (default) or `unlisted` |

**Response (201):**
```json
{
  "snapshot": {
    "id": 1,
    "name": "My World",
    "type": "fresh_start",
    "visibility": "private",
    "shareUrl": null,
    "shareToken": null,
    "factionCount": 3,
    "npcCount": 5,
    "locationCount": 6,
    "createdAt": "2026-03-16T..."
  }
}
```

---

### POST /api/game/:id/talk-to-gm

Ask the GM a question. Phase 1: free keyword lookup (no turn cost).

**Request Body:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `question` | string | yes | 1–500 chars |

**Response — Command matched (200):**
```json
{
  "resolved": true,
  "source": "command",
  "command": "status_report",
  "data": { ... },
  "turnCost": false,
  "canEscalate": true
}
```

**Response — Rulebook matched (200):**
```json
{
  "resolved": true,
  "source": "rulebook",
  "title": "How Rolls Work",
  "sectionId": "how-rolls-work",
  "content": "When you attempt something where the outcome is uncertain...",
  "turnCost": false,
  "canEscalate": true
}
```

**Response — No match (200):**
```json
{
  "resolved": false,
  "source": null,
  "suggestion": "I can try to answer that, but it'll cost a turn. Want to escalate?",
  "turnCost": true,
  "canEscalate": true
}
```

---

### POST /api/game/:id/talk-to-gm/escalate

AI-powered GM response. **Costs a turn.** Rate limited (10/60s).

**Request Body:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `question` | string | yes | 1–500 chars |

**Response (200):** Same shape as `POST /action` advancing response.

**Status Codes:** 200, 400 (invalid), 429 (rate limited), 503 (AI error).

---

## Global Notes

**Authentication:** All endpoints except health checks and `GET /snapshots/:token` require a JWT in the `Authorization: Bearer <token>` header. SSE endpoint uses `?token=` query param.

**Ownership:** All game-scoped endpoints verify the authenticated user owns the game. Returns 404 (not 403) if not owned — prevents game ID enumeration.

**Playtester Gate:** `POST /api/games/new` and `GET /api/games/:id` require `is_playtester = true` on the user record. Returns 403 if not approved.

**JWT Payload:** `{ userId, email }` — 7-day expiry, bcrypt 12 rounds.

**CORS:** Controlled by `CORS_ORIGIN` env var. Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS.
