# Contract: Disponibilidad de Formas por Juego

**Covers**: FR-001, FR-002 (User Story 1)

## Rule

`PokeApiPokedexRepository._classifyOtherVarieties` (or its successor) MUST only populate `PokedexEntry.megaForm` when `game.id ∈ kMegaEvolutionEnabledGameIds`, and MUST only populate `PokedexEntry.gigamaxForm` when `game.id ∈ kGigamaxEnabledGameIds` (data-model.md). When the active game is not in the relevant set, that field MUST be `null` for every entry built for that game — never present-but-disabled, never falling back into `selectableForms`.

Template-form regional/alternate varieties gated by a similar "does this exist in this game" rule (e.g. a form only introduced in a specific generation) follow the same shape: excluded from `selectableForms` entirely for an ineligible game, using `generationOrdinal(game.generation)` compared against the variety's own introduction data when PokeAPI exposes it, or an explicit allow/deny table when it does not (same posture as Decision 1).

## Examples

| Game | `megaForm` populated? | `gigamaxForm` populated? |
|---|---|---|
| Rojo Fuego/Verde Hoja (`firered-leafgreen`, Gen III) | No | No |
| X/Y (`x-y`, Gen VI) | Yes (when the species has one) | No |
| Espada/Escudo (`sword-shield`, Gen VIII) | No | Yes (when the species has one) |
| Leyendas Arceus (`legends-arceus`, Gen VIII) | No | No |
| Escarlata/Púrpura (`scarlet-violet`, Gen IX) | No | No |
| Leyendas Z-A (`legends-za`, Gen IX) | Yes (when the species has one) | No |

## Test Expectations

- A fixture Pokémon with both a Mega and a Gigamax variety, resolved against a `firered-leafgreen`-like `Game`, produces a `PokedexEntry` with `megaForm == null` and `gigamaxForm == null`.
- The same fixture resolved against an `x-y`-like `Game` produces `megaForm != null`.
- The same fixture resolved against a `sword-shield`-like `Game` produces `gigamaxForm != null`, `megaForm == null`.
