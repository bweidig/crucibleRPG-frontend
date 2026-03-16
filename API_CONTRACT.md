# CrucibleRPG API Contract — Verified Backend Response Shapes

> **Source of truth** for all frontend data extraction. Verified from actual backend code.

---

## GET /api/games/:id (main game state load)

```json
{
  "id": 12,
  "storyteller": "Chronicler",
  "setting": "Sword & Soil",
  "difficulty": "standard",
  "difficultyPreset": "standard",
  "scenarioIntensity": "Standard",
  "status": "active",
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
    "backstory": "string | null",
    "personality": "string | null",
    "appearance": "string | null",
    "gender": "string | null",
    "stats": { "STR": { "base": 5.5, "effective": 4.5 }, "DEX": { "base": 8.0, "effective": 8.0 } },
    "skills": [{ "name": "Swordsmanship", "modifier": 1.0, "source": "backstory" }],
    "conditions": [{ "name": "Fatigued", "stat": "STR", "penalty": -1.0, "durationType": "until_long_rest", "source": "Exertion", "isBuff": false }]
  },
  "clock": {
    "globalClock": 480,
    "totalTurn": 5,
    "sessionTurn": 2,
    "temporalScale": "Narrative",
    "weather": "Clear",
    "currentDay": 1
  },
  "recentNarrative": [{ "turn": 5, "role": "narrator", "content": "...", "timestamp": "2026-03-16T..." }],
  "sessionRecap": "string | null"
}
```

**Note:** `character` and `clock` can be null. No `inventory`, `equipped`, `narrative`, `turns`, `recentHistory`, `npcs`, `locations`, `objectives`, or `world` fields exist at this endpoint.

---

## GET /api/game/:id/character (detailed character + inventory)

```json
{
  "character": { "id": 3, "name": "Jasper", "backstory": "...", "personality": "...", "appearance": "...", "gender": "..." },
  "stats": { "STR": { "base": 5.5, "effective": 4.5, "conditions": [{ "name": "Fatigued", "penalty": -1.0 }] } },
  "skills": [{ "name": "Swordsmanship", "modifier": 1.0, "type": "active", "source": "backstory", "contextTags": ["COMBAT_ENEMY"] }],
  "conditions": [{ "id": 12, "name": "Fatigued", "stat": "STR", "penalty": -1.0, "durationType": "until_long_rest", "turnsRemaining": null, "escalation": null, "source": "Exertion" }],
  "inventory": {
    "maxSlots": 10.5,
    "usedSlots": 5.0,
    "encumbrance": "light",
    "currency": { "display": "15 coins", "raw": 15 },
    "equipped": [{ "id": 1, "name": "Longsword", "slotCost": 1.5, "durability": 100, "maxDurability": 100, "materialQuality": "Common", "qualityBonus": 0.0, "tags": [], "heirloom": false }],
    "carried": [{ "id": 2, "name": "Waterskin", "slotCost": 0.5, "durability": 50, "maxDurability": 50, "materialQuality": "Common", "qualityBonus": 0.0, "tags": [], "heirloom": false }]
  },
  "companions": [{ "id": 1, "name": "Wolf", "specialty": "combat", "loyalty": 8, "woundState": "healthy" }]
}
```

---

## GET /api/game/:id/glossary

```json
{
  "entries": [{ "id": 1, "term": "Crucible Roll", "definition": "...", "category": "mechanics", "discoveredAt": "Turn 3 | null" }],
  "count": 1
}
```

---

## GET /api/game/:id/map

```json
{
  "currentLevel": null,
  "label": "The Ashenmoor Region",
  "parent": null,
  "breadcrumbs": [{ "id": 10, "label": "Ironhaven" }],
  "currentLocationId": 42,
  "locations": [{ "id": 10, "name": "Ironhaven", "type": "settlement", "dangerLevel": null, "status": "current", "controllingFaction": "The Iron Guard", "hasChildren": true }],
  "routes": [{ "id": "route_5_1", "origin": 10, "destination": 11, "travelDays": 1.0, "dangerLevel": 1, "terrain": "trail", "known": true }]
}
```

---

## GET /api/game/:id/notes

```json
{
  "notes": [{ "id": 5, "entityType": "npc", "entityId": 1, "entityName": "Captain Maren Holt", "text": "Seems trustworthy", "createdAt": "...", "updatedAt": "..." }]
}
```

---

## GET /api/game/:id/history

```json
{
  "turns": [{ "number": 12, "narrative": "...", "playerAction": "... | null", "location": "... | null", "timestamp": { "day": 2, "hour": 14, "minute": 30 } }],
  "total": 12,
  "page": 1,
  "pageSize": 20
}
```

---

## POST /api/game/:id/action (sync response)

```json
{
  "turnAdvanced": true,
  "turn": { "number": 13, "sessionTurn": 4 },
  "resolution": {
    "action": "string",
    "stat": "CHA",
    "skillUsed": "string | null",
    "dc": 12.0,
    "total": 14.5,
    "margin": 2.5,
    "tier": "T4",
    "tierName": "Strong Success",
    "diceRolled": [14],
    "dieSelected": 14,
    "isCombat": false
  },
  "narrative": "The merchant eyes you...",
  "stateChanges": {
    "conditions": { "added": [], "removed": [], "modified": [] },
    "inventory": { "added": [], "removed": [], "modified": [] },
    "clock": { "day": 2, "hour": 14, "minute": 50 },
    "quests": { "updated": [] },
    "factions": { "changed": [] },
    "stats": {}
  },
  "nextActions": {
    "options": [{ "id": "A", "text": "Haggle for a discount" }],
    "customAllowed": true
  }
}
```

---

## SSE stream events (GET /api/game/:id/stream)

| Event | Payload |
|-------|---------|
| `turn:resolution` | `{ turn: { number, sessionTurn }, resolution: { action, stat, skillUsed, dc, total, margin, tier, tierName, diceRolled, dieSelected, isCombat } }` |
| `turn:narrative` | `{ chunk: "text..." }` |
| `turn:state_changes` | `{ conditions, inventory, clock, quests, factions, stats }` |
| `turn:actions` | `{ options: [...], customAllowed: true }` |
| `turn:complete` | `{ turnNumber: 13 }` |
| `turn:error` | `{ message: "..." }` |

---

## POST /api/game/:id/talk-to-gm

**Request:** `{ "question": "..." }`
**Response:** `{ "answer": "..." }`

## POST /api/game/:id/talk-to-gm/escalate

**Request:** `{ "question": "..." }`
**Response:** `{ "answer": "..." }`

---

## PUT /api/game/:id/settings/storyteller

**Request:** `{ "selection": "Bard" }`

## PUT /api/game/:id/settings/difficulty

**Request:** `{ "preset": "standard", "dials": { ... } }`

---

## GET /api/game/:id/checkpoints

**Response:** `{ "checkpoints": [...] }`

## POST /api/game/:id/snapshots

**Request:** `{ "type": "mode" }` or `{ "type": "branch", "name": "Manual Save" }`

---

## POST /api/bug-report

**Request:** `{ "gameId": 12, "category": "...", "message": "...", "context": { ... } }`

## POST /api/suggestion

**Request:** `{ "gameId": 12, "category": "...", "message": "...", "context": { ... } }`
