# Contract: Type Icon Resolution (Historia 9)

Presentation-layer pure function contract (no domain port — types have
no icon concept in `domain`; `PokemonType.numericId`, the only new
domain field involved, is generic data, see data-model.md).

```dart
String? typeIconUrl({required PokemonType type, required Game game});
```

## Resolution order (FR-018/FR-019) — as implemented

1. `{generation}/{game.id}/{numericId}.png` when `game.generation.id` is
   one of the 7 generations confirmed to have an icon folder at all
   (`generation-iii` through `generation-ix`, research.md item 9) —
   every mainline `Game.id` this app's catalog can produce was
   live-verified to already match its GitHub folder name exactly, so no
   per-game exception table exists (unlike `_spriteVersionKeyByGameId`,
   which genuinely needed one). If a future game's folder name ever
   diverges, add it to a small map here the same way, rather than
   reintroducing a "walk sibling folders" search.
2. Otherwise (`generation-i`/`generation-ii`, which have no folder at
   all) — falls back to `generation-iii`'s set for the same `game.id`,
   the oldest generation with icons, never `null` purely for being an
   old game.
3. `null` — only when `type.numericId` itself never resolved (e.g. a
   test fixture). The presentation layer's existing
   `iconForPokemonType` Material-icon fallback (`pokemon_type_icons.dart`,
   kept, not deleted) is the final visual fallback both for this case
   and for a network image that fails to load at render time
   (`Image.network`'s `errorBuilder`).

## Source

`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/{generation}/{gameOrGroup}/{numericId}.png`
— fetched exactly like every other network image in this codebase
(`Image.network`), no new HTTP client, no new package.

## Caching note (non-normative, implementation detail)

The folder-listing walk (steps 2–3) is over a small, static, effectively
build-time-known set (7 generations × a handful of folders each) — it is
resolved once from a small bundled lookup table generated from the
live-verified listing in research.md item 9, **not** by hitting GitHub's
API at runtime (that API is rate-limited and irrelevant to the actual
image fetch, which goes straight to `raw.githubusercontent.com`).

## Test impact

- `type_icon_resolution_test.dart` (**new**): each of the 4 resolution
  steps, keyed to real generation/game ids from research.md's verified
  folder listing (e.g. `generation-i` game falls through to
  `generation-iii`; `sword-shield` resolves directly;
  `the-isle-of-armor` — a DLC id, not itself a types folder — resolves
  via its base game `sword-shield`).
