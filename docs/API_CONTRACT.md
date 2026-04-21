# Crucible RPG — API Contract

> **This contract is verified against backend code as of 2026-03-17. The frontend uses this as its single source of truth. Do not change response shapes without updating this document.**

**Last Updated:** 2026-04-10 (AD-595 web auto-playtester admin endpoints)

Base URL: `https://<host>` (Railway production or `http://localhost:3000` local)

All game values use **x10 integer format** internally (7.3 → 73). Public API responses return **display format** (÷10).

---

## Table of Contents

- [Health Check](#health-check)
- [Auth (`/api/auth`)](#auth)
- [Games (`/api/games`)](#games)
- [Init Wizard (`/api/init`)](#init-wizard)
- [Gameplay (`/api/game`)](#gameplay)
- [Reports & Feedback (`/api`)](#reports--feedback)
- [Admin (`/api/admin`)](#admin)

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

Create a new account. Invite code is no longer required (AD-520).

**Request Body:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `email` | string | yes | Must contain `@` and `.` |
| `password` | string | yes | Min 8 chars (NIST 2025 — no complexity rules) |
| `displayName` | string | yes | Non-empty after trim, max 50 chars |
| `inviteCode` | string | no | **Ignored** — accepted for backward compat but not validated |
| `playtestRequest` | boolean | no | If true, stores `playtestAbout` and `playtestSource` |
| `playtestAbout` | string | no | Free text (max 1000 chars, truncated). Only stored if `playtestRequest` is true |
| `playtestSource` | string | no | How user found the game (max 500 chars, truncated). Only stored if `playtestRequest` is true |

**Response (201):**
```json
{
  "token": "jwt-string",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "displayName": "Player One",
    "isPlaytester": false,
    "isDebug": false,
    "createdAt": "2026-03-16T..."
  }
}
```

**Status Codes:**
| Code | Meaning |
|------|---------|
| 201 | Account created |
| 400 | Missing/invalid field (email format, password < 8, displayName empty/too long) |
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
    "isDebug": false,
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

Google OAuth sign-in. Creates account if new, logs in if existing. Invite code is no longer required (AD-520).

**Request Body:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `credential` | string | yes | Google ID token from Google Identity Services |

**Response (200 existing / 201 new):**
```json
{
  "token": "jwt-string",
  "user": {
    "id": 1,
    "email": "user@gmail.com",
    "displayName": "User Name",
    "isPlaytester": false,
    "isDebug": false,
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

### PUT /api/auth/profile

Update the authenticated user's display name. Requires JWT.

**Request Body:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `displayName` | string | yes | Non-empty after trim, max 50 chars |

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "displayName": "New Name",
    "isPlaytester": true,
    "isDebug": false,
    "createdAt": "2026-03-16T..."
  }
}
```

**Status Codes:**
| Code | Meaning |
|------|---------|
| 200 | Updated |
| 400 | Missing, empty, or too long displayName |
| 401 | No/invalid token |

### DELETE /api/auth/account

Permanently delete the authenticated user's account and all associated data (games, characters, narrative, bug reports). Irreversible. Requires JWT.

**Request Body:** None.

**Response (200):**
```json
{
  "message": "Account deleted",
  "gamesDeleted": 3
}
```

**Status Codes:**
| Code | Meaning |
|------|---------|
| 200 | Account deleted |
| 401 | No/invalid token |

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
      "lastPlayedAt": "2026-03-20T...",
      "turnCount": 47,
      "worldName": "The Fraying Throne",
      "character": { "id": 3, "name": "Jasper" },
      "blurb": "You're lying low at the Rusted Lantern after eavesdropping on a consortium shipment. The dockmaster saw your face."
    }
  ]
}
```

`character` is `null` if no character created yet. `blurb` is `null` before turn 6 (when summarization begins). `turnCount` is `null` if no world_clock exists yet. `lastPlayedAt` is `null` if no turns have been played. `worldName` is `null` if world gen hasn't produced one.

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
  "worldBriefing": "The port city of Ashenmoor clings to a coast...",
  "worldName": "The Fraying Throne",
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

### GET /api/games/snapshots (alias: GET /api/world-snapshots)

List all world snapshots owned by the authenticated user. Frontend uses `/api/world-snapshots`.

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
    "worldName": "The Fraying Throne",
    "description": "...",
    "type": "fresh_start",
    "setting": "Sword & Soil",
    "storyteller": "Bard",
    "factionCount": 3,
    "npcCount": 5,
    "locationCount": 6,
    "createdBy": "Player One",
    "createdAt": "2026-03-16T...",
    "factionNames": ["The Ashen Hand", "The Iron Covenant", "The Thornfield Commune"],
    "locationNames": ["Grimwall Crossing", "Millhaven", "The Ashwood"]
  }
}
```

`worldName` is the generated name of the snapshot's world (e.g., "The Fraying Throne"). `null` when world gen never produced one. When present, frontends should show it as the primary heading and the `name` field as a subtitle. `factionNames` and `locationNames` are names only (no descriptions, IDs, or other fields) extracted from the snapshot's stored world state. Locations include only top-level locations (no sub-locations). Both arrays are sorted alphabetically. Empty arrays when the snapshot has no factions/locations.

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
| `playerSeeds` | object | no | AD-517: Player-defined factions + NPCs for world gen |

At least one of `selection` or `customText` required.

**playerSeeds format (AD-517):**
```json
{
  "factions": [
    { "name": "The Hollow Hand", "description": "A thieves' guild that controls the docks", "disposition": "friendly" }
  ],
  "npcs": [
    { "name": "Mara", "description": "Runs the Hollow Hand. My oldest friend.", "relationship": "companion", "faction": "The Hollow Hand" }
  ]
}
```
- Max 3 factions, max 5 NPCs. Each must have a `name`.
- Player seeds count toward world gen targets (4 factions / 7 NPCs). AI fills the remainder.
- NPCs with `relationship: "companion"` are initialized as companions during scenario selection.
- Disposition values: `friendly` / `neutral` / `hostile` / `unknown`
- Relationship values: `companion` / `ally` / `contact` / `neutral` / `rival` / `enemy`

**Response (200):**
```json
{
  "setting": "Sword & Soil",
  "settingDescription": null,
  "settingParameters": null,
  "worldGenStatus": "generating",
  "message": "Setting saved. World generation started — poll /world-status for progress."
}
```

**AD-539:** Response returns immediately. World generation runs asynchronously in the background. Frontend must poll `GET /world-status` for progress. The `worldGenStatus` field is `"generating"` (not `"complete"`) — do NOT wait for it to finish in this response.

**Status Codes:**
| Code | Meaning |
|------|---------|
| 200 | Settings saved, world gen kicked off |
| 400 | Neither field provided, invalid setting, empty customText |

**Side Effects:** Saves settings immediately, then asynchronously generates 4 factions, 6+ locations, 7 NPCs (with schedules/agendas), 2+ causal anchors, species, scarcity, magic domains. Only on first call — skipped if data already exists.

---

### Phase 2.1: World Generation Status

#### GET /api/init/:gameId/world-status

Poll world generation progress.

**Response (200):**
```json
{
  "status": "generating",
  "ready": false,
  "phase": "locations"
}
```

When complete:
```json
{
  "status": "complete",
  "ready": true,
  "phase": null,
  "summary": {
    "factions": 4,
    "locations": 6,
    "npcs": 7,
    "unresolvedHooks": 2
  },
  "worldName": "The Fraying Throne"
}
```

When failed:
```json
{
  "status": "failed",
  "ready": false,
  "phase": null,
  "retryable": true,
  "message": "World generation failed. Your choices are saved — please try again."
}
```

`status` (AD-541): `"pending"` | `"generating_factions"` | `"generating_locations"` | `"generating_npcs"` | `"generating_anchors"` | `"complete"` | `"failed"`. The old `"generating"` value is no longer set — frontends should treat any `generating_*` value as "in progress." `phase`: derived from status — `"factions"` | `"locations"` | `"npcs"` | `"anchors"` | `null`. `summary` and `worldName` only present when `complete`.

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
| `powersFlag` | string | no | `'yes'`, `'no'`, or null. Player's supernatural intent — controls POT stat and magic skills in proposal |
| `powersDescription` | string | no | Freeform description of powers (max 500 chars). Only stored when `powersFlag` is `'yes'` |

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
    "species": "Thornkin",
    "powersFlag": "yes",
    "powersDescription": "Elemental fire magic inherited from dragon ancestry"
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

`source`: `"ai"` | `"ai_retry"`. `innateTraits` empty for humans. `species` null for humans.

**Status Codes:**
| Code | Meaning |
|------|---------|
| 200 | Proposal generated |
| 400 | No character (Phase 3 incomplete), world gen not complete |
| 503 | AI proposal generation failed (all retries exhausted). Response: `{ "error": "proposal_generation_failed", "message": "...", "retryable": true }`. Frontend should show retry UI. |
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

#### GET /api/init/:gameId/pacing-options

List scenario pacing options (AD-516).

**Response (200):**
```json
{
  "options": [
    { "id": "slow_burn", "name": "Slow Burn", "description": "Low urgency. Explore and discover at your own pace." },
    { "id": "turning_point", "name": "Turning Point", "description": "Something is already underway. Time to assess, but not indefinitely." },
    { "id": "into_the_fire", "name": "Into the Fire", "description": "Immediate crisis. Action required now." }
  ]
}
```

---

#### GET /api/init/:gameId/intensity-options

**Deprecated alias** of `GET /api/init/:gameId/pacing-options` (AD-516). Same handler, same response shape. Retained for backward compatibility with older frontend builds. New code should call `/pacing-options` directly.

---

#### POST /api/init/:gameId/generate-scenarios

Generate 3 opening scenarios via AI (one per pacing type), tailored to the character and world. **Idempotent** — regenerates fresh each time. Also supports single-scenario refresh. Falls back to stub scenarios on AI failure. Results are cached for `select-scenario`.

**Prerequisites:** Game status `initializing`, world gen complete, character finalized (has stats), world meets minimums.

**Request Body:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `pacingType` | string | no | `slow_burn`, `turning_point`, or `into_the_fire` — single-scenario refresh |
| `intensity` | string | no | **DEPRECATED** — accepted for backward compat, value ignored |

- Empty body `{}` = generate all 3 scenarios (one per pacing type).
- `{ pacingType: "slow_burn" }` = refresh only that pacing slot. Max 1 refresh per type.
- `{ intensity: "Standard" }` = backward compat, treated as generate-all.

**Response (200):**
```json
{
  "scenarios": [
    { "title": "The Letter", "description": "A sealed letter...", "pacingType": "slow_burn", "refreshAvailable": true },
    { "title": "The Deal", "description": "The merchant slides...", "pacingType": "turning_point", "refreshAvailable": true },
    { "title": "The Ambush", "description": "Smoke rises...", "pacingType": "into_the_fire", "refreshAvailable": true }
  ],
  "startingGold": 15,
  "startingTimeOfDay": 8,
  "inventory": [],
  "customStartAvailable": true
}
```

Gold/time: AI-determined based on character backstory economic circumstances (not fixed per pacing type).

**Status Codes:**
| Code | Meaning |
|------|---------|
| 200 | Scenarios generated |
| 400 | Invalid intensity, game not initializing, world gen incomplete, character not finalized, world minimums not met |
| 503 | AI scenario generation failed (all retries exhausted). Response: `{ "error": "scenario_generation_failed", "message": "...", "retryable": true }`. Frontend should show retry UI. |
| 500 | Internal server error |

---

#### POST /api/init/:gameId/select-scenario

Commit scenario selection and start the game. **Idempotent** — re-selection resets active game back to initializing, then reactivates.

**Request Body:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `scenarioIndex` | number or `"custom"` | conditional | 0, 1, or 2 — picks a generated scenario |
| `customStart` | object | conditional | `{ locationId?: number, locationName?: string, startingTimeOfDay?: number (0-23) }` |

Either `scenarioIndex` (0–2) or `customStart` required.

**customStart.locationName (AD-518):** If provided and no matching location exists, a new location is created as a district under the first settlement. Case-insensitive name matching prevents duplicates. Max 100 characters.

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
        { "id": "A", "text": "Approach the merchant", "stat": "cha", "flavor": "social" },
        { "id": "B", "text": "Investigate the alley", "stat": "wis", "flavor": "investigation" },
        { "id": "C", "text": "Rest at the inn", "stat": null, "flavor": "safe" }
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
- `narrative.availableActions.options[].stat` / `.flavor` (AD-671, **additive**) — same display-hint semantics as `nextActions.options[].stat` / `.flavor` (see POST `/action` notes below). Hints for pre-stored options persist across `/state` reads.
- `rewindAvailable` (boolean) — whether a single-turn rewind is available. `true` after any successful advancing turn, `false` initially and after rewind is consumed. (AD-553)
- `directives.recentlyFulfilled` (array) — Auto-removed directives with text, lane, reason, and removedAtTurn. Max 5 entries, pruned after 20 turns. Frontend uses for "removed, restore?" UI. (AD-554)

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
| `custom` | string | Free-text action, max 500 chars. Bracket-wrapped text (`[Short Rest]`, `[Long Rest]`, `[Status Report]`, `[Briefing]`, `[Help]`, `[Use Skill: Name]`) is auto-translated to the equivalent structured `command` before dispatch (AD-592, AD-666). |
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
| `delete_checkpoint` | no | — | Delete a checkpoint |
| `short_rest` | no | — | Mechanical Short Rest — reduces condition penalties by 0.3, +0.5 POT (1/day), advances clock 1h. Bypasses AI. (AD-592) |
| `long_rest` | no | — | Mechanical Long Rest — threshold recovery, Wellspring POT, resets strain counter, companion/group recovery, advances clock 6h. Bypasses AI. (AD-592) |
| `use_skill` | no | `target` (skill name) | Invoke an Active Skill by name. Fuzzy-matches `target` against `narrativeSkin` or the template name. Applies cooldown via `useActiveSkill`. Template 11 (Assess) rejected with `error: 'assess_requires_context'` — needs a dedicated flow. Bracket form: `[Use Skill: Name]` (AD-666). |
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

**Response — `use_skill` command (AD-666):**
```json
{
  "turnAdvanced": false,
  "command": "use_skill",
  "data": {
    "used": true,
    "skillId": 42,
    "skillName": "Precision Strike",
    "templateId": 3,
    "templateName": "Precision Strike",
    "cooldownType": "tactical_sequence",
    "cooldownState": "on_cooldown",
    "chargesRemaining": null,
    "enhanced": false,
    "effectAppliedToResolution": false,
    "note": "Active Skill declared. Cooldown applied. Template effect-to-resolution wiring is a known follow-up (see AD-666 notes)."
  }
}
```
Error variants (200, `used: false`, `error` populated): `on_cooldown`, `disoriented` (XVI.12 blocks Active Skills), `skill_not_found` (no match for `target`), `assess_requires_context` (Template 11 invoked without the dedicated flow).

**`mechanicalResults.passive_mastery_unlocked` (AD-666):** Advancing turns may include `passive_mastery_unlocked: { templateId, templateName, scope, domainStat }` in the resolution payload when a T1-3 success crossed the randomized threshold (XI.4.1) and a mastery was unlocked server-side. Absent when no unlock fires. Template derivation follows `(domainStat, domainCategory)`: combat → Armor Breaker (#2), medical → Medical Mastery #4 option A, social → Social Leverage (#5), crafting → Craft Excellence (#8), counseling → Social Leverage (#5), default → Efficiency Gain (#1).

**`mechanicalResults.activeSkillUsed` / `activeSkillEffect` / `activeSkillFailed` / `pendingTargetFailurePenalty` (AD-672):** When the player declared an in-scope Active Skill (Templates 1, 3, 6, 8) on the prior use_skill call and the effect was consumed by this turn's resolution, these fields are populated:
- `activeSkillUsed` (string|null) — display name of the skill that was applied (e.g. `"Exploit Weakness"`, `"Precision Strike"`). `null` when no pending effect was consumed.
- `activeSkillEffect` (object|null) — `{ templateId, templateName, enhanced, dcReductionApplied (number|null), statBoostApplied ({stat, value}|null), tierEscalation ({from, to}|null), bypassArmor (bool), fullSeverity (bool), failureApplied (bool), failureDetail (string|null) }`. The fields that apply depend on the template: Template 1 → `dcReductionApplied` populated; Template 3 → `bypassArmor`/`fullSeverity` on T1-3, `tierEscalation` on supernatural T2/T3 hits, `failureApplied` on T4-6; Template 6 → `statBoostApplied` populated, `failureApplied` true on any tier except enhanced+T1; Template 8 → `bypassArmor` on T1-3, `failureApplied` on T4-6.
- `activeSkillFailed` (boolean) — true when the resolved tier ≥ 4 AND a self-facing failure penalty was successfully applied. false otherwise.
- `pendingTargetFailurePenalty` (object|null) — Template 1 T4-6 only. `{ templateId, templateName, type: 'target_bonus', value: 3.0, description, duration: 'one_use', appliedTo: {npcId, npcName}, persisted: false }`. Surfaced for AI narrator context; mechanical enforcement of the buff is deferred to a follow-up AD (current npc_active_conditions schema cannot model one-use character-scoped modifiers cleanly).

**Response — `use_skill` command (AD-672 update):** `effectAppliedToResolution` is now `true` for Templates 1/3/6/8 (was `false` in AD-666) — the server has written a pending_skill_effect row that will apply to the next advancing turn's resolution. `note` is updated to "Active Skill declared. Cooldown applied. Effect will apply to the next resolved action (pending_skill_effect written)." Out-of-scope templates (2, 4, 5, 7, 9, 10, 12, 13) still return `effectAppliedToResolution: false` with a note identifying the AD-672 scope boundary. Template 11 (Assess) continues to reject with `assess_requires_context`.

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
      { "id": "A", "text": "Haggle for a discount", "stat": "cha", "flavor": "social" },
      { "id": "B", "text": "Ask about the missing caravan", "stat": "wis", "flavor": "investigation" },
      { "id": "C", "text": "Browse and leave", "stat": null, "flavor": "safe" }
    ],
    "customAllowed": true
  }
}
```

**Notes:**
- `resolution` is `null` when the turn involves no mechanical check (pure narrative turns, e.g. long rest).
- `resolution.stat` is always lowercase (`"cha"`, `"str"`, etc.).
- `nextActions.options[].stat` (AD-671, **additive**) — lowercase stat abbreviation (`"str"|"dex"|"con"|"int"|"wis"|"cha"|"pot"`) the AI predicts the rules engine would most likely test for this option, or `null` when no check applies. Display hint only — the actual resolution stat is decided at action-processing time, not bound by this value. Same field appears on `GET /state` `narrative.availableActions.options[]`.
- `nextActions.options[].flavor` (AD-671, **additive**) — one or two lowercase words describing the approach as a vibe tag (e.g. `"combat"`, `"stealth"`, `"social"`, `"investigation"`, `"diplomatic"`, `"risky"`, `"cautious"`, `"safe"`, `"narrative"`). The AI narrator picks the tag; the tag list is open-ended, not an enum. `null` if the narrator omits or malforms the field — frontend should render no tag in that case. Same field appears on `GET /state` `narrative.availableActions.options[]`.
- `stateChanges.stats` contains post-commit effective stats (base minus condition penalties) with lowercase keys. This is the authoritative stat snapshot after the turn resolves.
- `stateChanges.conditions.added` entries include a `target` field: `"player"` for player conditions, or the NPC's display name (e.g. `"Enforcer"`) for enemy conditions. (AD-550)
- `npcStates` (array, optional) — Present only on combat turns. Each entry: `{ name, npcId, woundState: "engaged"|"bloodied"|"desperate"|"defeated", defeated: boolean }`. (AD-550, AD-670 rename: fresh→engaged, staggering→desperate, incapacitated→defeated)
- SSE path sends `npcStates` as a separate `turn:npc_states` event.
- `rewindAvailable` (boolean) — `true` after any successful advancing turn. Frontend uses to enable/disable the Rewind button. (AD-553)
- `directivesRemoved` (array or null) — Auto-fulfilled directives removed this turn. Each entry: `{ text, lane, reason }`. `null` when nothing was removed. Only present on advancing turns after Turn 6 (when summarization fires). (AD-554)

**Condition entry shape (in `stateChanges.conditions.added`):**
```json
{ "name": "Side Laceration", "stat": "dex", "severity": -0.5, "penalty": -0.5, "target": "player" }
```

**npcStates shape (combat turns only):**
```json
{
  "npcStates": [
    { "name": "Aethelforge Enforcer", "npcId": 42, "woundState": "desperate", "defeated": false },
    { "name": "Squad Leader", "npcId": 43, "woundState": "defeated", "defeated": true }
  ]
}
```

**New stateChange type — `item_description_update` (AD-551):**
Updates an inventory item's text description and its glossary entry. Used when a player inspects or learns new details about an item. Fields: `itemName` (string), `description` (string, 1-3 sentences). On GM escalation turns, only `glossary` and `item_description_update` stateChanges are allowed; all other types are silently dropped.

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

### POST /api/game/:id/rewind

Single-turn undo. Restores all game state to the moment before the most recent advancing turn. The rewound turn ceases to exist — narrative is deleted, the AI will never see it.

**Rate Limiting:** Same pool as advancing actions (10 per 60s per user).

**Request Body:** None.

**Response (200):**
```json
{
  "rewound": true,
  "state": {
    "game": { ... },
    "character": { ... },
    "narrative": { ... },
    "world": { ... },
    "rewindAvailable": false
  }
}
```

The `state` object has the same shape as `GET /api/game/:id/state`. `rewindAvailable` is `false` because the snapshot was just consumed. A new snapshot is created when the next turn commits.

**Rules:**
- Only one rewind slot — no history stack.
- After rewinding, you cannot rewind again until a new turn completes.
- Not available before Turn 1 (`rewindAvailable` starts as `false`).
- Bracket commands (non-advancing) don't create snapshots.
- The AI is never informed of the rewind.

**Status Codes:**
| Code | Meaning |
|------|---------|
| 200 | Success — state restored |
| 400 | No turn to rewind (`rewindAvailable` is false), or game not active |
| 429 | Rate limited |
| 500 | Internal server error |

---

### POST /api/game/:id/skill-challenge

**Stub endpoint (AD-504).** Reserved for player-initiated Skill Relevance Challenges — the player disputes which skill the AI applied and proposes an alternative. The full AI re-evaluation pipeline is not yet wired, so the handler logs the request and returns 501 Not Implemented. Frontend should treat this as a placeholder and avoid relying on its side effects until the AD-504 follow-up ships.

**Auth:** `requireAuth`. No ownership check.

**Request Body (all optional — all fields are logged but not validated):**
| Field | Type | Notes |
|-------|------|-------|
| `turnNumber` | integer | Turn the challenge applies to |
| `skillId` | string or integer | Alternative skill the player proposes |
| `justification` | string | Player's reasoning |

**Response (501):**
```json
{
  "message": "Skill Relevance Challenge not yet implemented. The AI re-evaluation pipeline will be wired in a future update.",
  "turnNumber": 5,
  "skillId": "persuasion"
}
```

No database writes, no other status codes. Always 501 until the AD-504 follow-up lands.

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

### POST /api/game/:id/visualize

Generate an AI illustration of the current scene. Does not advance the turn clock. Playtester-only (Phase 1).

**Request Body:**
| Field | Type | Required | Default | Validation |
|-------|------|----------|---------|------------|
| `resolution` | integer | no | 1024 | Must be one of: 1024, 2048, 4096 |

**Response (200):**
```json
{
  "imageUrl": "https://pub-xxx.r2.dev/5/1712345678-turn34.png",
  "turnNumber": 34,
  "blurb": "You crouch behind the market stall as the patrol passes, one hand on the hilt of your short sword.",
  "resolution": 1024,
  "createdAt": "2026-04-09T..."
}
```

| Status | Meaning |
|--------|---------|
| 403 | Not a playtester / not entitled |
| 404 | Game not found or not owned |
| 400 | Invalid resolution |
| 422 | Image generation blocked by safety filters |

---

### GET /api/game/:id/gallery

Returns all generated images for a game, ordered by turn number descending.

**Response (200):**
```json
{
  "images": [
    {
      "id": 12,
      "imageUrl": "https://pub-xxx.r2.dev/5/1712345678-turn34.png",
      "turnNumber": 34,
      "blurb": "You crouch behind the market stall...",
      "resolution": 1024,
      "stylePreset": "dark_fantasy",
      "createdAt": "2026-04-09T..."
    }
  ],
  "count": 1
}
```

---

### GET /api/game/:id/settings/image-style

Returns current image style preference and available presets.

**Response (200):**
```json
{
  "preset": "dark_fantasy",
  "custom": null,
  "presets": ["dark_fantasy", "cyberpunk", "watercolor", "ink_wash", "comic_book", "oil_painting", "sketch"]
}
```

---

### PUT /api/game/:id/settings/image-style

Save the player's image style preference for this game.

**Request Body:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `preset` | string | no | Must be a key in STYLE_PRESETS, or null to clear |
| `custom` | string | no | Max 500 chars. If provided, overrides preset. Empty string clears. |

At least one field required.

**Response (200):**
```json
{
  "preset": "cyberpunk",
  "custom": null,
  "presets": ["dark_fantasy", "cyberpunk", "watercolor", "ink_wash", "comic_book", "oil_painting", "sketch"]
}
```

---

### GET /api/game/:id/settings/ai-model

Read per-game AI model overrides (AD-348). **Playtester-only feature** — returns 403 for non-playtester users. Reads `game_worlds.ai_model_overrides` JSONB.

**Auth:** `requireAuth` + game ownership + `is_playtester = true`.

**Response (200):**
```json
{
  "overrides": {
    "all": null,
    "narrative": null,
    "summarization": null,
    "zone_generation": null,
    "classification": null,
    "npc_flesh_out": null,
    "character_proposal": null
  },
  "reasoning_effort": null,
  "defaults": {
    "narrative": "gemini-3-flash-preview",
    "summarization": "gemini-3-flash-preview",
    "zone_generation": "gemini-3-flash-preview",
    "classification": "gemini-3-flash-preview",
    "npc_flesh_out": "gemini-3-flash-preview",
    "character_proposal": "gemini-3-flash-preview"
  },
  "availableModels": [
    { "id": "gemini-3.1-pro-preview", "label": "Gemini 3.1 Pro", "provider": "gemini", "tier": "standard" }
  ],
  "taskTypes": ["narrative", "summarization", "zone_generation", "classification", "npc_flesh_out", "character_proposal"],
  "validReasoningEfforts": []
}
```

Every key in `overrides` is populated (missing keys return `null`). `defaults` reflects the current `AI_PROVIDER` env var's default routing. `availableModels` lists every model in `MODEL_COSTS` with provider + tier metadata.

**Status Codes:** 200, 403 (`{"error": "AI model overrides require playtester access"}`), 404 (game not found), 500.

---

### PUT /api/game/:id/settings/ai-model

Update per-game AI model overrides (AD-348). Merges incoming overrides with existing `ai_model_overrides` JSONB — null values delete the corresponding key; empty `overrides` object or `null` clears all. `reasoning_effort` is tracked independently within the same JSONB blob.

**Auth:** `requireAuth` + game ownership + `is_playtester = true`.

**Request Body:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `overrides` | object or null | yes | Keys must be in `VALID_OVERRIDE_KEYS` (`all`, `narrative`, `summarization`, `zone_generation`, `classification`, `npc_flesh_out`, `character_proposal`). Values must be a model string or `null` (to delete). `{}` or `null` clears all overrides. |
| `reasoning_effort` | string or null | no | If provided, must be in `VALID_REASONING_EFFORTS` |

**Response (200):** Same shape as GET, plus `"message": "AI model overrides updated"`.

**Status Codes:**
- 200 — saved
- 400 — `{"error": "overrides must be an object or null"}`, `{"error": "Unknown override key: \"<key>\". Valid keys: <list>"}`, or `{"error": "Invalid reasoning_effort: \"<value>\". Valid values: <list>"}`
- 403 — `{"error": "AI model overrides require playtester access"}`
- 404 — game not found
- 500 — internal error

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
  "content": "When you attempt an action, your stat plus any skill bonus is compared against a difficulty target...",
  "refined": true,
  "rulebookUrl": "https://www.cruciblerpg.com/rulebook#how-rolls-work",
  "turnCost": false,
  "canEscalate": true
}
```

The `refined` field indicates whether the content was refined by an AI call (`true`) or is the raw static rulebook text (`false`). Refinement uses a Flash/Mini AI call to extract a focused 3–5 sentence answer from the matched section. Falls back to static content (`refined: false`) on AI failure or rate limit (5/60s per user).

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

### POST /api/game/:id/talk-to-gm/meta

Non-advancing AI query for strategy, lore, and player directives. **Does not cost a turn.** Rate limited (5/60s per user). Uses Flash/Mini tier with full game context.

**Request Body:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `question` | string | yes | 1–500 chars |

**Response (200):**
```json
{
  "response": "Great question! The merchant guild controls trade in this region...",
  "turnAdvanced": false,
  "directiveStored": true,
  "directiveLane": "goal"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `response` | string | AI's conversational reply to the player |
| `turnAdvanced` | boolean | Always `false` — meta queries never advance the turn |
| `directiveStored` | boolean | Whether a goal/preference directive was extracted and stored |
| `directiveLane` | string\|null | `"goal"`, `"preference"`, or `null` if no directive was stored |

**Directive classification:** The AI classifies player input as a goal (concrete pursuit), preference (tone/pacing), or question (no directive stored). Goals and preferences are reformulated as target-state descriptions and stored in rolling buffers of 10 each.

**Status Codes:** 200, 400 (invalid input / game not active), 429 (rate limited), 503 (AI failure — `{ "error": "meta_query_failed", "message": "...", "retryable": true }`).

---

### DELETE /api/game/:id/talk-to-gm/meta/directive

Remove a player directive by lane and index.

**Request Body:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `lane` | string | yes | `"goal"` or `"preference"` |
| `index` | integer | yes | 0-based, must be within array bounds |

**Response (200):**
```json
{
  "directives": {
    "goals": [{ "text": "..." }],
    "preferences": [{ "text": "..." }],
    "limits": { "goalsMax": 10, "preferencesMax": 10 }
  }
}
```

**Status Codes:** 200, 400 (invalid lane/index/out of bounds).

---

### Directive state in GET /api/game/:id/state

The `directives` field is added to the game state response:

```json
{
  "directives": {
    "goals": [{ "text": "Create an arc toward thieves guild membership..." }],
    "preferences": [{ "text": "The player wants combat-heavy gameplay..." }],
    "limits": { "goalsMax": 10, "preferencesMax": 10 }
  }
}
```

---

### POST /api/game/:id/secure-respite

**Purpose:** Time-skip recovery loop. Simulates day-by-day rest until fully recovered or rations run out.

**Auth:** Required (game owner)

**Request Body:** None

**Validation:**
- Character must have at least one stat ≤ 0.0 (Abyss of Zero)
- Game must be in `active` status

**Success Response (200):**
```json
{
  "success": true,
  "daysElapsed": 2,
  "rationsConsumed": 2,
  "waterConsumed": 2,
  "abortedEarly": false,
  "abortReason": null,
  "clockAdvanced": 2880,
  "message": "You rest for 2 days and awaken fully restored."
}
```

**Aborted Response (200):**
```json
{
  "success": true,
  "daysElapsed": 1,
  "rationsConsumed": 1,
  "waterConsumed": 1,
  "abortedEarly": true,
  "abortReason": "insufficient_rations",
  "clockAdvanced": 1440,
  "message": "You rest for 1 day before running out of food."
}
```

**Not Eligible (400):**
```json
{
  "success": false,
  "error": "secure_respite_not_available",
  "reason": "Character is not in the Abyss of Zero"
}
```

**Status Codes:** 200, 400 (not eligible / game not active), 401 (unauthenticated), 403 (not game owner).

---

## Reports & Feedback

Mount: `/api` (not under `/api/games` or `/api/game` — these are top-level player-feedback endpoints).

**Auth:** all endpoints require `requireAuth`. No admin or playtester gate.

**Rate limit:** shared across `/api/bug-report` and `/api/suggestion` — **10 submissions per user per hour**, tracked in-process. Returns 429 when exceeded.

---

### POST /api/bug-report

Submit a bug report. If `gameId` is provided, the handler auto-captures the current `world_clock.total_turn` and stores it alongside the report.

**Request Body:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `type` | string | no | Must be `"bug"` or `"suggestion"` when provided. This route's handler does NOT force a type — both values are accepted. For forced-suggestion submissions use `POST /api/suggestion` instead. |
| `category` | string | yes | For `type="bug"`: one of `narrative`, `mechanics`, `ui`, `performance`, `other`. For `type="suggestion"`: one of `feature`, `story`, `ui`, `balance`, `other`. |
| `message` | string | yes | 1–2000 characters |
| `gameId` | integer or null | no | If provided, must be parseable as integer |
| `context` | object | no | Arbitrary JSON; stored as-is |

**Response (201):**
```json
{
  "id": 42,
  "message": "Report submitted. Thanks for helping improve the game."
}
```

**Status Codes:**
- 201 — submitted
- 400 — `{"error": "type must be \"bug\" or \"suggestion\""}`, `{"error": "category must be one of: <list>"}`, `{"error": "message is required"}`, `{"error": "message must be 1-2000 characters"}`, or `{"error": "Invalid gameId"}`
- 429 — `{"error": "Rate limited. Maximum 10 reports per hour."}`
- 500 — internal error

---

### POST /api/suggestion

Alias of `POST /api/bug-report` that forces `type = "suggestion"`. Any `type` value in the request body is ignored. All other fields (`category`, `message`, `gameId`, `context`) behave identically to `/bug-report`. Shares the same rate limit counter.

**Request Body:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `category` | string | yes | Must be one of `feature`, `story`, `ui`, `balance`, `other` |
| `message` | string | yes | 1–2000 characters |
| `gameId` | integer or null | no | If provided, must be parseable as integer |
| `context` | object | no | Arbitrary JSON; stored as-is |

**Response (201):** Same shape as `POST /api/bug-report`.

**Status Codes:**
- 201 — submitted
- 400 — `{"error": "category must be one of: feature, story, ui, balance, other"}`, `{"error": "message is required"}`, `{"error": "message must be 1-2000 characters"}`, or `{"error": "Invalid gameId"}`
- 429 — `{"error": "Rate limited. Maximum 10 reports per hour."}`
- 500 — internal error

---

## Admin

Mount: `/api/admin`

**All admin endpoints require two middleware layers:**
1. `requireAuth` — valid JWT in `Authorization: Bearer <token>` header
2. `requireAdmin` — authenticated user's email must be in the `ADMIN_EMAILS` environment variable (comma-separated list)

Unauthenticated requests return 401. Authenticated non-admin requests return 403 `{ "error": "Admin access required" }`.

---

### GET /api/admin/users

List all users with game counts. Supports `?filter=pending` to return only users who requested playtest access but haven't been approved yet (AD-520).

**Query Parameters:**
| Param | Type | Notes |
|-------|------|-------|
| `filter` | string | Optional. `"pending"` = only users where `is_playtester = false` AND (`playtest_about IS NOT NULL` OR `playtest_source IS NOT NULL`) |

**Response (200):**
```json
{
  "users": [
    {
      "id": 1,
      "email": "user@example.com",
      "displayName": "Player One",
      "isPlaytester": true,
      "isDebug": false,
      "playtestAbout": "I'm a TTRPG veteran",
      "playtestSource": "Found on Reddit",
      "createdAt": "2026-03-16T...",
      "gameCount": 5,
      "lastActive": "2026-03-29T..."
    }
  ],
  "total": 6
}
```

`lastActive` is the most recent `game_worlds.created_at` for the user's games, or null if no games. `playtestAbout` and `playtestSource` are null if the user did not submit a playtest request.

---

### GET /api/admin/users/:id

Detailed view of a single user including all their games.

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "displayName": "Player One",
    "isPlaytester": true,
    "isDebug": false,
    "playtestAbout": "I'm a TTRPG veteran",
    "playtestSource": "Found on Reddit",
    "createdAt": "2026-03-16T..."
  },
  "games": [
    {
      "id": 5,
      "storyteller": "Chronicler",
      "setting": "Sword & Soil",
      "status": "active",
      "characterName": "Jasper",
      "turnCount": 34,
      "totalCost": 0.4812,
      "createdAt": "2026-03-20T..."
    }
  ],
  "totalSpend": 1.2934
}
```

`totalSpend` is the sum of `total_ai_cost` across all the user's games. `turnCount` counts narrative_log entries with `role = 'ai'`.

**Status Codes:** 200, 404 (user not found).

---

### PATCH /api/admin/users/:id/playtester

Toggle playtester status for a user.

**Request Body:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `isPlaytester` | boolean | yes | Must be `true` or `false` |

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "displayName": "Player One",
    "isPlaytester": true,
    "isDebug": false
  }
}
```

**Status Codes:** 200, 400 (`isPlaytester` not a boolean), 404 (user not found).

---

### PATCH /api/admin/users/:id/debug

Toggle debug mode for a user. Debug mode enables `X-Debug: true` header support (AD-487).

**Request Body:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `isDebug` | boolean | yes | Must be `true` or `false` |

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "displayName": "Player One",
    "isDebug": true
  }
}
```

**Status Codes:** 200, 400 (`isDebug` not a boolean), 404 (user not found).

---

### DELETE /api/admin/users/:id

Delete a user account. Refuses to delete users who still own games — admin must delete the games first via `DELETE /api/admin/games/:id`. (AD-585)

**Request Body:** none.

**Response (200):**
```json
{ "deleted": true }
```

**Response (400) when user has games:**
```json
{
  "error": "Cannot delete user with existing games — delete their games first.",
  "gameCount": 3
}
```

**Status Codes:** 200, 400 (invalid user ID, or user has existing games — response includes `gameCount`), 404 (user not found).

---

### GET /api/admin/games

List all games across all users with optional filtering.

**Query Params:**
| Param | Type | Description |
|-------|------|-------------|
| `status` | string | Filter by game status: `initializing`, `active`, `completed`, `abandoned` |
| `search` | string | Case-insensitive search across character name, player display name, and setting |

**Response (200):**
```json
{
  "games": [
    {
      "id": 5,
      "userId": 1,
      "playerName": "Ben",
      "characterName": "Jasper",
      "storyteller": "Chronicler",
      "setting": "Sword & Soil",
      "status": "active",
      "turnCount": 34,
      "totalCost": 0.4812,
      "costPerTurn": 0.0142,
      "createdAt": "2026-03-20T..."
    }
  ],
  "total": 8
}
```

`costPerTurn` = `totalCost / turnCount` (0 if no turns). Results limited to 100.

---

### GET /api/admin/games/:id

Detailed game view with character snapshot, narrative log, and clock state.

**Response (200):**
```json
{
  "game": {
    "id": 5,
    "status": "active",
    "storyteller": "Chronicler",
    "setting": "Sword & Soil",
    "difficulty": "Standard",
    "characterName": "Jasper",
    "turnCount": 12,
    "totalCost": 0.4812,
    "initCost": 0.075,
    "gameplayCost": 0.4002,
    "gmCost": 0.006,
    "gmCallCount": 3,
    "costPerTurn": 0.0334,
    "createdAt": "2026-03-20T..."
  },
  "player": {
    "id": 1,
    "displayName": "Ben",
    "email": "ben@example.com"
  },
  "character": {
    "name": "Jasper",
    "backstory": "...",
    "personality": "...",
    "appearance": "...",
    "gender": "male",
    "stats": {
      "str": { "base": 5.5, "effective": 4.5 }
    },
    "skills": [
      { "name": "Swordsmanship", "modifier": 1.5, "source": "backstory" }
    ],
    "conditions": [
      { "name": "Exhausted", "stat": "str", "penalty": 1.0, "durationType": "until_rest", "source": "combat", "isBuff": false }
    ],
    "inventory": {
      "equipped": [
        { "name": "Iron Sword", "category": "weapon", "quality": "common", "durability": "14/16", "slot": "main_hand" }
      ],
      "carried": [
        { "name": "Healing Potion", "category": "consumable", "quality": "common", "durability": null }
      ]
    }
  },
  "narrative": [
    {
      "turnNumber": 1,
      "role": "ai",
      "content": "...",
      "significanceScore": 3,
      "thematicTags": ["discovery"]
    }
  ],
  "totalTurns": 34,
  "clock": {
    "globalClock": 480,
    "totalTurn": 34,
    "currentDay": 3
  }
}
```

`character` is `null` if no character has been created yet. Narrative is limited to the most recent 200 entries (use the `/narrative` endpoint for full log). `totalTurns` counts `role = 'ai'` entries.

**Status Codes:** 200, 404 (game not found).

---

### DELETE /api/admin/games/:id

Delete a game and all associated data. Uses the same ordered cascade delete as the owner delete endpoint. No ownership check.

**Response (200):**
```json
{ "deleted": true, "gameId": 5 }
```

**Status Codes:** 200, 404 (game not found).

---

### GET /api/admin/games/:id/npcs

Full NPC audit for a game. Returns every NPC with decoded stats, durability pool state, capabilities, passives, innate traits, and combat profile. Sorted alive-first, then alphabetical.

**Response:**
```json
{
  "gameId": 42,
  "npcCount": 7,
  "npcs": [
    {
      "id": 101,
      "name": "Aethelforge Enforcer",
      "alive": true,
      "disposition": "hostile",
      "role": "guard",
      "tier": "professional",
      "archetype": null,
      "threatNote": null,
      "introduced": true,
      "locationId": 5,
      "factionId": 2,
      "generationSource": "world_gen",
      "stats": { "STR": 7.0, "DEX": 5.0, "CON": 8.0, "INT": 4.0, "WIS": 5.0, "CHA": 3.0 },
      "durability": { "pool": 8.0, "current": 4.5, "percent": 56, "woundState": "bloodied" },
      "combat": {
        "intelligence": "trained",
        "moraleThreshold": 0.3,
        "breakBehavior": "flee",
        "awarenessState": "unaware",
        "resistances": [],
        "weaknesses": ["fire"]
      },
      "capabilities": [{ "template": "power_attack", "label": "Power Attack", "uses": 2, "per": "encounter" }],
      "passives": [],
      "innateTraits": [],
      "voicePrint": "Gruff, clipped sentences. Refers to player as 'outsider'...",
      "playerMemory": null
    }
  ]
}
```

- `durability` is `null` if the NPC's pool has not been initialized (no combat yet).
- `stats` values are display format (divided by 10).
- `voicePrint` is truncated to 120 characters.

**Status Codes:** 200, 400 (invalid ID), 404 (game not found).

---

### GET /api/admin/games/:id/server-logs

**AD-589.** Server log capture browser. Returns persisted server console output for a game, ordered by `captured_at DESC`. Filterable by turn and request type.

**URL Params:**
| Param | Type | Notes |
|-------|------|-------|
| `id` | integer | Game ID |

**Query Params (all optional):**
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `turn` | integer | — | Filter to a specific turn number |
| `requestType` | string | — | Filter by `'turn'`, `'init'`, `'gm_question'`, `'rewind'`, `'error'`, `'bug_report_flush'` |
| `limit` | integer | 50 | Max 200 |
| `offset` | integer | 0 | |

**Response (200):**
```json
{
  "logs": [
    {
      "id": 1,
      "turnNumber": 5,
      "requestType": "turn",
      "lines": [
        { "timestamp": "2026-04-09T20:15:32.123Z", "level": "log", "message": "[executeTurn] Starting turn 5..." },
        { "timestamp": "2026-04-09T20:15:38.789Z", "level": "log", "message": "[AI_RAW_RESPONSE] {\"narrative\":\"...\",...}" }
      ],
      "capturedAt": "2026-04-09T20:15:39.000Z"
    }
  ],
  "total": 42,
  "limit": 50,
  "offset": 0
}
```

**Status Codes:** 200, 400 (`{"error": "Invalid game ID"}` / `{"error": "Invalid turn"}`), 500.

---

### PATCH /api/admin/games/:id/logging

**AD-589.** Toggle the per-game logging override. When `true`, all future requests for the game persist server logs to `server_logs` regardless of playtester status.

**URL Params:**
| Param | Type | Notes |
|-------|------|-------|
| `id` | integer | Game ID |

**Request Body:**
```json
{ "enabled": true }
```

**Response (200):**
```json
{ "loggingEnabled": true }
```

**Status Codes:** 200, 400 (invalid game ID, missing/non-boolean `enabled`), 404 (game not found), 500.

---

### POST /api/admin/prune-logs

**AD-589.** Manual cleanup of old `server_logs` entries. The capture system also auto-prunes every 100th persist call.

**Request Body (optional):**
```json
{ "daysOld": 30 }
```

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `daysOld` | number | 30 | Must be ≥ 1 |

**Response (200):**
```json
{ "deleted": 1234 }
```

**Status Codes:** 200, 400 (`daysOld < 1`), 500.

---

### GET /api/admin/games/:id/narrative

Full narrative log for spectator/read-only view. Returns all entries (not capped at 200 like the detail endpoint).

**Response (200):**
```json
{
  "gameId": 5,
  "characterName": "Jasper",
  "setting": "Sword & Soil",
  "storyteller": "Chronicler",
  "narrative": [
    {
      "turnNumber": 1,
      "role": "ai",
      "content": "...",
      "significanceScore": 3
    }
  ],
  "totalEntries": 68
}
```

**Status Codes:** 200, 404 (game not found).

---

### GET /api/admin/game-log/:gameId

Returns the most recent game event log entries for a game (from `game_event_log`), hardcoded `LIMIT 500`, ordered by `created_at DESC`. Supports optional filtering by `event_type` and `turn_number`.

**URL Params:**
| Param | Type | Notes |
|-------|------|-------|
| `gameId` | integer | Returns 400 if not a positive integer |

**Query Params (all optional):**
| Param | Type | Notes |
|-------|------|-------|
| `type` | string | Filter by `event_type` (exact match) |
| `turn` | integer | Filter by `turn_number` (exact match) |

**Response (200):**
```json
{
  "events": [
    {
      "id": 987,
      "turn_number": 12,
      "event_type": "narrative_generated",
      "event_data": { "model": "gemini-3-flash-preview", "inputTokens": 1800 },
      "created_at": "2026-04-09T..."
    }
  ],
  "count": 1
}
```

`event_data` is a JSONB blob whose shape depends on `event_type`. Field names on the response match DB column names (`turn_number`, `event_type`, etc.) — not camelCase.

**Status Codes:** 200, 400 (`{"error": "Invalid gameId"}`), 500.

---

### GET /api/admin/game-log/:gameId/snapshots

List all turn-state snapshots for a game in summary view, ordered by `turn_number DESC`, capped at 200 entries. Used by the admin dashboard to pick a turn to inspect.

**URL Params:**
| Param | Type | Notes |
|-------|------|-------|
| `gameId` | integer | Returns 400 if not a positive integer |

**Response (200):**
```json
{
  "snapshots": [
    {
      "turnNumber": 12,
      "createdAt": "2026-04-09T...",
      "playerHp": "34/40",
      "location": 5,
      "npcCount": 3,
      "conditionCount": 1,
      "gold": 75
    }
  ],
  "count": 1
}
```

`playerHp` is derived from `snapshot.player.stats.CON` (format `effective/base`, or `null` if unavailable). `location` is `snapshot.player.locationId`. `npcCount` is `snapshot.npcsOnScreen.length`. `conditionCount` is `snapshot.player.conditions.length`.

**Status Codes:** 200, 400 (`{"error": "Invalid gameId"}`), 500.

---

### GET /api/admin/game-log/:gameId/snapshot/:turnNumber

Fetch the full JSON game-state snapshot for a specific turn.

**URL Params:**
| Param | Type | Notes |
|-------|------|-------|
| `gameId` | integer | Returns 400 if not a positive integer |
| `turnNumber` | integer | Returns 400 if `isNaN` |

**Response (200):**
```json
{
  "turnNumber": 12,
  "snapshot": { "player": { "stats": { "CON": { "effective": 34, "base": 40 } } }, "...": "full state blob" },
  "createdAt": "2026-04-09T..."
}
```

`snapshot` is the full JSONB blob from `game_state_snapshots.snapshot` — shape defined by the snapshot writer, not this endpoint.

**Status Codes:** 200, 400 (`{"error": "Invalid gameId or turnNumber"}`), 404 (`{"error": "Snapshot not found"}`), 500.

---

### GET /api/admin/costs

Aggregate AI cost data across all games.

**Response (200):**
```json
{
  "totalSpend": 1.8296,
  "totalTurns": 127,
  "avgCostPerTurn": 0.0144,
  "activeGames": 4,
  "topGames": [
    {
      "id": 6,
      "characterName": "Wren",
      "playerName": "Ben",
      "setting": "Sword & Soil",
      "totalCost": 0.623,
      "turnCount": 45,
      "costPerTurn": 0.0138
    }
  ]
}
```

`topGames` returns up to 10 games ordered by highest `total_ai_cost`.

---

### GET /api/admin/health

System health overview including stuck games, popularity, retention, errors, and database size.

**Response (200):**
```json
{
  "counts": {
    "totalUsers": 6,
    "totalPlaytesters": 4,
    "totalGames": 8,
    "activeGames": 4,
    "totalTurns": 127
  },
  "stuckGames": [
    {
      "id": 5,
      "status": "initializing",
      "playerName": "Marcus",
      "characterName": null,
      "createdAt": "2026-03-28T..."
    }
  ],
  "popularity": {
    "storytellers": [{ "name": "Chronicler", "count": 5 }],
    "settings": [{ "name": "Sword & Soil", "count": 4 }]
  },
  "retention": {
    "usersWithGames": 4,
    "usersWithMultipleGames": 2,
    "returningUsers": 3,
    "totalUsers": 6
  },
  "errors": {
    "last24h": 0,
    "recent": [
      {
        "id": 1,
        "endpoint": "/api/game/5/action",
        "method": "POST",
        "errorMessage": "AI provider timeout",
        "gameId": 5,
        "createdAt": "2026-03-29T..."
      }
    ]
  },
  "dbSize": "42 MB"
}
```

Stuck games: `initializing` for 24+ hours, or `active` with zero narrative entries. Retention metrics are approximate (based on game creation dates, not session tracking). `errors.recent` returns the last 5 error log entries.

---

### GET /api/admin/invite-code

Return the current active invite code and its source.

**Response (200):**
```json
{ "inviteCode": "PLAYTEST2026", "source": "database" }
```

`source` is one of: `"database"` (from `admin_settings` table), `"environment"` (from `INVITE_CODE` env var), `"none"` (no invite code configured). When source is `"none"`, `inviteCode` is `null`.

---

### PUT /api/admin/invite-code

Set a new invite code. Stored in the `admin_settings` table (takes priority over env var).

**Request Body:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `inviteCode` | string | yes | 4-50 chars, alphanumeric + hyphens only (`/^[a-zA-Z0-9-]+$/`) |

**Response (200):**
```json
{ "inviteCode": "NEWCODE123", "updatedAt": "2026-03-29T..." }
```

**Status Codes:** 200, 400 (invalid format/length).

---

### GET /api/admin/errors

Recent error log with pagination.

**Query Params:**
| Param | Type | Default | Validation |
|-------|------|---------|------------|
| `limit` | number | 20 | 1-100 |
| `offset` | number | 0 | >= 0 |

**Response (200):**
```json
{
  "errors": [
    {
      "id": 1,
      "endpoint": "/api/game/5/action",
      "method": "POST",
      "errorMessage": "AI provider timeout",
      "errorStack": "Error: AI provider timeout\n    at ...",
      "userId": 1,
      "gameId": 5,
      "createdAt": "2026-03-29T..."
    }
  ],
  "total": 12,
  "limit": 20,
  "offset": 0
}
```

Errors are automatically pruned after 30 days.

### GET /api/admin/announcement

Returns the current announcement.

**Response (200):**
```json
{ "text": "Server maintenance tonight at 11 PM EST.", "updatedAt": "2026-04-01T..." }
```
If no announcement: `{ "text": null, "updatedAt": null }`

### PUT /api/admin/announcement

Set or update the announcement.

**Request body:** `{ "text": "Your announcement here" }` — required, 1–1000 chars.

**Response (200):**
```json
{ "text": "Your announcement here", "updatedAt": "2026-04-01T..." }
```

### DELETE /api/admin/announcement

Clear the announcement.

**Response (200):** `{ "cleared": true }`

### GET /api/admin/stats/aggregate

Aggregate analytics dashboard. Single-pass SQL aggregations.

**Response (200):**
```json
{
  "gamePatterns": {
    "topSettings": [{ "name": "Sword & Soil", "count": 35 }],
    "topStorytellers": [{ "name": "Chronicler", "count": 42 }],
    "statusBreakdown": {
      "active": { "count": 18, "percentage": 30.0 },
      "completed": { "count": 10, "percentage": 16.67 },
      "paused": { "count": 5, "percentage": 8.33 },
      "initializing": { "count": 27, "percentage": 45.0 }
    },
    "dropoffBuckets": { "0": 2, "1-3": 1, "4-10": 1, "11-20": 0, "20+": 1 }
  },
  "costAnalytics": {
    "avgCostPerGame": 0.45,
    "avgCostPerTurn": 0.02,
    "avgInitCostPerGame": 0.15,
    "avgGameplayCostPerGame": 0.28,
    "avgGmCostPerGame": 0.02,
    "costTrending": {
      "recent50AvgCostPerTurn": 0.025,
      "previous50AvgCostPerTurn": 0.019
    },
    "projectedMonthlyCostAt100Players": 45.0
  },
  "engagement": {
    "avgTurnsPerGame": 12.5,
    "avgTurnsCompleted": 25.0,
    "avgTurnsAbandoned": 3.2,
    "totalGmCalls": 150,
    "avgGmCallsPerGame": 2.5,
    "topGmQuestions": ["How does dual wield work?", "..."],
    "significanceDistribution": { "1": 50, "2": 120, "3": 200, "4": 80, "5": 30 }
  },
  "timeBased": {
    "gamesPerWeek": [{ "weekStart": "2026-03-31T...", "count": 5 }],
    "costPerWeek": [{ "weekStart": "2026-03-31T...", "totalCost": 2.5 }]
  }
}
```

### GET /api/admin/reports

Browse player-submitted bug reports and suggestions (from `bug_reports`, joined with `users` and `game_worlds`). Reverse chronological order.

**Query Params (all optional):**
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `type` | string | — | Filter by `type` (`bug` or `suggestion`) |
| `status` | string | — | Filter by `status` (`open`, `reviewed`, `resolved`, `dismissed`) |
| `limit` | integer | 50 | Clamped to 1–200 |
| `offset` | integer | 0 | Minimum 0 |

**Response (200):**
```json
{
  "reports": [
    {
      "id": 42,
      "type": "bug",
      "category": "narrative",
      "message": "The GM keeps forgetting my character is blind.",
      "status": "open",
      "adminNotes": null,
      "playerName": "Destrega",
      "playerEmail": "player@example.com",
      "characterName": "Jasper",
      "setting": "Sword & Soil",
      "gameId": 101,
      "turnNumber": 14,
      "context": { "fromFrontendUrl": "/game/101" },
      "createdAt": "2026-04-07T...",
      "updatedAt": "2026-04-07T..."
    }
  ],
  "total": 89,
  "limit": 50,
  "offset": 0
}
```

`total` reflects all rows matching the filters, ignoring `limit`/`offset`.

**Status Codes:** 200, 500.

---

### GET /api/admin/reports/summary

Dashboard counts for open bugs, open suggestions, in-review, and total across all reports.

**Response (200):**
```json
{
  "openBugs": 7,
  "openSuggestions": 12,
  "inReview": 3,
  "total": 89
}
```

`openBugs` counts `status='open' AND type='bug'`; `openSuggestions` counts `status='open' AND type='suggestion'`; `inReview` counts `status='reviewed'`; `total` is every row in `bug_reports`.

**Status Codes:** 200, 500.

---

### PATCH /api/admin/reports/:id

Update a report's `status` and/or `adminNotes`. At least one field must be provided. Uses `COALESCE` to leave other fields unchanged. Sets `updated_at` to `NOW()`.

**URL Params:**
| Param | Type | Notes |
|-------|------|-------|
| `id` | integer | Returns 400 if `isNaN` |

**Request Body:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `status` | string | one-of | Must be one of `open`, `reviewed`, `resolved`, `dismissed` |
| `adminNotes` | string | one-of | Max 2000 characters |

At least one of `status` or `adminNotes` must be provided.

**Response (200):**
```json
{
  "id": 42,
  "type": "bug",
  "category": "narrative",
  "message": "The GM keeps forgetting my character is blind.",
  "status": "reviewed",
  "adminNotes": "Confirmed — tracked as AD-600.",
  "gameId": 101,
  "turnNumber": 14,
  "context": { "fromFrontendUrl": "/game/101" },
  "createdAt": "2026-04-07T...",
  "updatedAt": "2026-04-09T..."
}
```

**Status Codes:**
- 200 — updated
- 400 — `{"error": "Invalid report ID"}`, `{"error": "At least one of status or adminNotes must be provided"}`, `{"error": "status must be one of: open, reviewed, resolved, dismissed"}`, `{"error": "adminNotes must be a string"}`, or `{"error": "adminNotes must be 2000 characters or less"}`
- 404 — `{"error": "Report not found"}`
- 500 — internal error

---

### POST /api/admin/reports/distill

AI-powered clustering of bug reports/suggestions via Gemini Flash. Caps at 200 reports per call.

**Request Body (all optional):**
| Field | Type | Default | Notes |
|-------|------|---------|-------|
| scope | `"all"` \| `"filtered"` | `"all"` | Currently informational |
| type | `"bug"` \| `"suggestion"` \| `"all"` | `"all"` | Filter by report type |
| status | `"open"` \| `"resolved"` \| `"all"` | `"open"` | Filter by status |
| afterDate | ISO 8601 string | — | Include reports after this date |
| beforeDate | ISO 8601 string | — | Include reports before this date |

**Response (200):**
```json
{
  "id": 1,
  "totalReports": 100,
  "totalIncluded": 100,
  "clusters": [
    {
      "title": "Combat resolution inconsistencies",
      "summary": "Players report that damage calculations don't match what the rules panel shows",
      "count": 30,
      "severity": "high",
      "reportIds": [12, 45, 67]
    }
  ],
  "distilledAt": "2026-04-07T12:00:00Z"
}
```

### POST /api/admin/reports/distill-gm

Same as distill but clusters GM questions from `game_event_log` (event_type = 'gm_call'). Surfaces "what are players confused about?"

**Request Body (all optional):**
| Field | Type | Default | Notes |
|-------|------|---------|-------|
| afterDate | ISO 8601 string | — | Include events after this date |
| beforeDate | ISO 8601 string | — | Include events before this date |

**Response (200):** Same shape as `/reports/distill` but `reportIds` contains event IDs.

### GET /api/admin/gm-questions

Browse all Talk to GM interactions across games. Reverse chronological order.

**Query Parameters (all optional):**
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| limit | integer | 50 | Max 200 |
| offset | integer | 0 | For pagination |
| gameId | integer | — | Filter to a specific game |
| afterDate | ISO 8601 string | — | Include events on or after this date |
| beforeDate | ISO 8601 string | — | Include events on or before this date |

**Response (200):**
```json
{
  "questions": [
    {
      "id": 123,
      "gameId": 101,
      "turnNumber": 5,
      "question": "Can I use my grappling hook to swing across?",
      "response": "Your grappling hook can reach...",
      "model": "gemini-2.0-flash",
      "inputTokens": 1200,
      "outputTokens": 350,
      "cost": 0.0012,
      "callType": "refinement",
      "characterName": "Dex",
      "playerName": "Destrega",
      "setting": "Custom",
      "createdAt": "2026-04-07T12:00:00Z"
    }
  ],
  "total": 89
}
```

`total` reflects the count matching filters (date/game) but ignoring limit/offset — for "showing 50 of 89" UI. `callType` is `"refinement"` (rulebook answer) or `"meta"` (free-form GM question). `turnNumber` is null for non-turn-scoped GM calls.

---

### Auto-Playtest (Admin)

#### POST /api/admin/autoplay/start
Start a new auto-playtest run.
**Request body:**
```json
{
  "playStyle": "normal|chaotic|adversarial",
  "setting": "Sword & Soil|Smoke & Steel|Concrete & Code|Stars & Circuits|Ash & Remnants|Dream & Myth",
  "storyteller": "Chronicler|Bard|Trickster|Poet|Whisper|Noir",
  "archetypeId": "string|null",
  "targetTurns": 10-250,
  "difficultyPreset": "forgiving|standard|harsh|brutal",
  "botMode": "cheap|smart"
}
```
`botMode` is optional; defaults to `"cheap"` (Gemini Flash Lite, thinking disabled). `"smart"` selects Gemini Flash with moderate thinking budget and costs ~3–5x more per turn but plays more like a real player. Invalid values → 400.
**Response (201):**
```json
{ "runId": 42, "status": "initializing", "estimatedCost": "$0.10 - $0.30", "message": "Auto-playtest run started" }
```

#### GET /api/admin/autoplay/runs
List all auto-playtest runs.
**Query params:** `status` (optional filter), `limit` (default 20, max 100)
**Response (200):**
```json
{ "runs": [{ "id": 42, "status": "running", "playStyle": "adversarial", "setting": "...", "storyteller": "...", "archetypeName": "...", "characterName": "...", "difficultyPreset": "standard", "botMode": "cheap", "targetTurns": 30, "completedTurns": 12, "totalFlags": 2, "totalCost": 0.0834, "endReason": null, "startedAt": "...", "completedAt": null }], "total": 15 }
```
`botMode` is `"cheap"` or `"smart"` (see POST /start for semantics). Missing field = treat as `"cheap"` for pre-AD-625 runs.

#### GET /api/admin/autoplay/runs/:id
Full run detail with turn logs.
**Response (200):**
```json
{ "run": { "id": 42, "status": "completed", "playStyle": "...", "setting": "...", "storyteller": "...", "archetypeName": "...", "characterName": "...", "difficultyPreset": "standard", "botMode": "cheap", "targetTurns": 30, "completedTurns": 30, "gameId": 99, "diagnosticFlags": { "skillHallucination": 2 }, "totalFlags": 3, "totalCost": 0.2145, "endReason": "completed", "errorMessage": null, "startedAt": "...", "completedAt": "..." }, "turns": [{ "turnNumber": 1, "botAction": "...", "actionType": "custom", "tier": 2, "tierName": "Success", "narrativeSnippet": "...", "diagnosticFlags": [], "stateSnapshot": { "stats": { "str": 45 }, "conditionCount": 0, "inventoryCount": 8 }, "turnCost": 0.0072, "error": null }] }
```

#### GET /api/admin/autoplay/runs/:id/progress
Lightweight polling endpoint.
**Response (200):**
```json
{ "id": 42, "status": "running", "completedTurns": 12, "targetTurns": 30, "totalFlags": 2, "latestTurn": { "turnNumber": 12, "botAction": "...", "tier": 4, "tierName": "Failure", "diagnosticFlags": ["skillHallucination"], "error": null } }
```
When completed/failed: also includes `endReason` and `totalCost`.

#### POST /api/admin/autoplay/runs/:id/cancel
Cancel an active run. Returns 400 if not initializing/running.
**Response (200):** `{ "cancelled": true, "completedTurns": 12 }`

#### DELETE /api/admin/autoplay/runs/:id
Delete a run + turn logs + associated game.
**Response (200):** `{ "deleted": true }`

#### GET /api/admin/autoplay/archetypes
Available archetypes for a setting (static reference list).
**Query params:** `setting` (required)
**Response (200):**
```json
{ "archetypes": [{ "id": "shadow_thief", "name": "Shadow Thief", "description": "..." }] }
```

---

### GET /api/games/announcement

**Auth:** JWT required (any user, not admin-only).

Returns the current announcement. Same response shape as admin GET.

**Response (200):**
```json
{ "text": "Server maintenance tonight at 11 PM EST.", "updatedAt": "2026-04-01T..." }
```
If no announcement: `{ "text": null, "updatedAt": null }`

---

## Global Notes

**Authentication:** All endpoints except health checks and `GET /snapshots/:token` require a JWT in the `Authorization: Bearer <token>` header. SSE endpoint uses `?token=` query param.

**Ownership:** All game-scoped endpoints verify the authenticated user owns the game. Returns 404 (not 403) if not owned — prevents game ID enumeration.

**Playtester Gate:** `POST /api/games/new` and `GET /api/games/:id` require `is_playtester = true` on the user record. Returns 403 if not approved.

**Admin Gate:** All `/api/admin/*` endpoints require the user's email to be in the `ADMIN_EMAILS` env var (comma-separated). Returns 403 `{ "error": "Admin access required" }` if not listed.

**JWT Payload:** `{ userId, email }` — 7-day expiry, bcrypt 12 rounds.

**CORS:** Controlled by `CORS_ORIGIN` env var. Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS.
