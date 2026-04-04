# Crucible RPG — To Do

**Last Updated:** 2026-04-03

> **For Claude Code:** Read this file at the start of every session. The user manages this list with plain-language commands:
> **Work initiation:** Items on this list are for tracking only. Do NOT start work on any item unprompted. The user will initiate each task via a prompt from Claude Chat.
> - "Add [task] to the to-do list" → Add as unchecked item in the appropriate category and priority
> - "Mark [task] as done" / "Check off [task]" → Change `- [ ]` to `- [x]` and add completion date
> - "Move [task] to [priority]" → Relocate the item
> - "What's on the to-do list?" → Summarize open items
> - "Clear done items" → Remove all checked items
>
> When completing a task during normal work, check it off automatically without being asked.
> Keep the "Last Updated" date current after any change.

---

## 🔴 Now — Blocking Progress or Active Bugs

- [ ] Kill the "maximum 3 skills" ghost warning — fabricated skill count rule showing in proposal display
- [ ] Skill budget retry improvement — add "fewer skills, higher modifiers" guidance
- [ ] Deploy Gemini model routing prompt (Pro for init, Flash for gameplay)

## 🟡 Soon — Next Up After Current Work

- [ ] Frontend: Foundational skill display — show subcategory labels. Broad format: "Custom Name (Domain/Subcat + Domain/Subcat)". Character endpoint returns new fields.
- [ ] Frontend: Magic skill axis display — show domain-axis vs discipline-axis. E.g. "Pyromancy +3.0 (Thermal Domain)" vs "Healing Arts +2.0 (Restoration Discipline)"
- [ ] Frontend: Element name update — fire→Thermal, ice→Cryo, lightning→Voltaic. Update UI references, icons, color schemes. 11 new elements need visual treatment.
- [ ] Frontend: Fortune condition display — show remaining charges not turns. "Hexed — 2 checks remaining" not "Hexed — 2 turns remaining"

- [ ] Too many items added during character proposal — tighten item count guidance
- [ ] Missing glossary entries for proposal-generated items
- [x] Frontend: Entity popup — show mechanical item stats (damage, armor, etc.) (2026-03-25)
- [ ] Frontend: Settings panel AI model labels — update after Gemini global switch
- [x] Frontend: Init wizard loading indicators between phases (2026-03-30)
- [ ] Frontend: Auto-scroll to new content in init wizard
- [x] Frontend: Loading screen animation (/loading page) (2026-03-30 -- merged into /play overlay)
- [ ] Frontend: Stat reset button on Phase 4
- [x] Frontend: Bug report modal (2026-03-30 -- wired with rich context)

## 🔵 Later — Polish, Features, and Content

- [x] Frontend: FAQ page (2026-03-30)
- [x] Frontend: Legal pages (ToS, Privacy Policy starters) (2026-03-29)
- [ ] Frontend: Copy audit on init wizard and game layout
- [ ] Frontend: Saved games page API wiring (real data)
- [ ] Frontend: Game creation flow from /menu
- [ ] Frontend: Journal tab (mockup exists)
- [ ] Frontend: Paperdoll equipment view (mockup exists)
- [ ] Scene continuity / combat getting skipped
- [ ] Ask the GM never advances time
- [ ] Classifier DC calibration
- [ ] NPC glossary descriptions too omniscient at seeding
- [ ] Item description inconsistency (safety net items get boilerplate)
- [ ] Equipment auto-equip logic (cloak should be worn)
- [ ] Frontend: Skill Relevance Challenge UI — after a check resolves, player taps a skill to argue it should have applied. POST to challenge endpoint. (v4.10)

## ✅ Done (Recent)

- [x] Action option quality — physical specificity prompt (2026-03-25)
- [x] Classifier — supernatural utility actions require rolls (2026-03-25)
- [x] Hard constraint — AI must not fabricate ability restrictions (2026-03-25)
- [x] Classifier safety net — empty stat/DC on requiresRoll: true (2026-03-25)
- [x] Character endpoint — include mechanical item fields (2026-03-25)
- [x] Frontend: Entity popup — mechanical item stat display (2026-03-25)
