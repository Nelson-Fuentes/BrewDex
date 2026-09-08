# Contract: Game/DLC Classification Overrides (extends `017`'s `contracts/game-catalog.md`)

Scope: `game/infrastructure/pokeapi-game-catalog-repository.service.ts`. The `GameCatalogRepository` port itself (`fetchCatalog(languageCode): Promise<Game[]>`) is **unchanged**; this contract governs the internal `detectDlcParent` heuristic only.

## New internal constants

```ts
/** Explicit DLC → parent overrides for cases the generic name-suffix
 *  heuristic cannot derive (research.md Decision 5). Keyed by the exact
 *  PokeAPI `version-group` resource name. */
const DLC_VERSION_GROUP_OVERRIDES: ReadonlyMap<string, string> = new Map([
  // ['<mega-dimension version-group name>', 'legends-z-a'],
]);

/** version-group names that must NEVER be classified as a DLC of a
 *  sibling, regardless of what the suffix heuristic finds. */
const NEVER_DLC_VERSION_GROUP_NAMES: ReadonlySet<string> = new Set([
  'ultra-sun-ultra-moon',
]);
```

`DLC_VERSION_GROUP_OVERRIDES`'s exact key for Mega Dimension is resolved during implementation by inspecting PokeAPI's live `version-group` list for the entry corresponding to Legends Z-A's DLC content (the spec's business rule — "Mega Dimension is DLC of Legends Z-A" — is fixed; only the precise upstream resource name needs confirming against the live API response shape).

## Behavioral rule

`detectDlcParent(versionGroup, candidates)`:
1. If `NEVER_DLC_VERSION_GROUP_NAMES.has(versionGroup.name)` → return `null` immediately (never a DLC).
2. Else if `DLC_VERSION_GROUP_OVERRIDES.has(versionGroup.name)` → return `{ parentVersionGroupName: DLC_VERSION_GROUP_OVERRIDES.get(versionGroup.name)!, slugPrefix: <derived or empty> }` directly, skipping the suffix heuristic.
3. Else → existing suffix-matching heuristic, unchanged.

## Acceptance mapping (spec.md)

| spec.md scenario | Contract behavior |
|---|---|
| "Mega Dimension" MUST be a DLC of Legends Z-A (FR-007) | Covered by rule 2 (override) |
| Sun/Moon and Ultra Sun/Ultra Moon MUST each be standalone games (FR-008) | Covered by rule 1 (`ultra-sun-ultra-moon` in the never-DLC set) — `sun-moon` was never a false positive itself and needs no entry |
| Every other existing game/DLC pairing (Sword/Shield + Isle of Armor/Crown Tundra, Scarlet/Violet + Teal Mask/Indigo Disk, etc.) | Unaffected — falls through to rule 3, the existing, already-correct heuristic |
