# Contract Amendment: `GameCatalogRepository` (originally defined in `001-select-game`, amended in `003-select-language`)

**Original contract**: [`../../001-select-game/contracts/game_catalog_repository.md`](../../001-select-game/contracts/game_catalog_repository.md)

**Prior amendment**: [`../../003-select-language/contracts/game_catalog_repository_amendment.md`](../../003-select-language/contracts/game_catalog_repository_amendment.md)

**Status**: Non-breaking data-classification correction. The method
signature (`Future<List<Game>> fetchCatalog({required String
languageCode})`, per the `003-select-language` amendment) is unchanged;
this amendment only corrects which `version-group`s the implementing
adapter treats as DLC versus base games (FR-007, research.md item 5).

## What changes

No interface change. `PokeApiGameCatalogRepository`'s internal
`_dlcParentVersionGroup` table (not part of the port's public contract,
but the mechanism contract rule 3 — "pairing already resolved" — relies
on) gains one entry:

```diff
 const _dlcParentVersionGroup = {
   'the-isle-of-armor': 'sword-shield',
   'the-crown-tundra': 'sword-shield',
   'the-teal-mask': 'scarlet-violet',
   'the-indigo-disk': 'scarlet-violet',
+  'mega-dimension': 'legends-za',
 };
```

## Why this is a contract-rule correction, not a new rule

Contract rule 3 ("Pairing already resolved") already commits this port to
never surfacing DLC/expansion content as its own selectable `Game` — that
rule was under-implemented, not wrong. Verified live against PokeAPI
(2026-08-23): the `mega-dimension` version-group exists independently of
`legends-za` with no field linking them, the same shape as the four DLC
entries already in the table (e.g. `the-isle-of-armor` / `sword-shield`).
Without this entry, `fetchCatalog` returns `mega-dimension` as a base
`Game` in violation of rule 3; with it, `mega-dimension` is correctly
attached as a `GameDlc` under the `legends-za` `Game`, surfaced through
`Game.dlcs` exactly like every other existing DLC.

## Consumer impact

None. `GetGameCatalog`, `GameSelectionCubit`, and every other consumer of
`GameCatalogRepository.fetchCatalog` already handle `Game.dlcs` generically
(`004-pokedex-team-builder`'s `DlcToggleList` renders whatever `dlcs` a
`Game` carries) — no caller needs to change to pick up the corrected
classification.

## Test impact

- `test/infrastructure/game_selection/pokeapi_game_catalog_repository_test.dart`
  gains a case: given `version-group` results including both `legends-za`
  and `mega-dimension`, `fetchCatalog` returns exactly one `Game` for
  `legends-za` (never a second `Game` for `mega-dimension`), and that
  `Game.dlcs` contains a `GameDlc(id: 'mega-dimension', …)` entry.
- The existing DLC-mapping cases (Isle of Armor/Crown Tundra/Teal Mask/
  Indigo Disk) are unchanged and MUST continue passing unmodified —
  this is an additive table entry, not a restructuring.
