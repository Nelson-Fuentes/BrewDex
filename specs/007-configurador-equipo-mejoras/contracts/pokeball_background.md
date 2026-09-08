# UI Contract: `PokeballBackground`

New presentation-layer widget (`presentation/team_builder/widgets/pokeball_background.dart`). Not a domain/port concept — documented here because three existing widgets change their decoration to use it (FR-012–FR-014).

## API

```dart
enum PokeballTone { neutral, accent }

class PokeballBackground extends StatelessWidget {
  const PokeballBackground({super.key, required this.tone, this.child});

  final PokeballTone tone;
  final Widget? child; // the sprite/icon rendered on top, centered
}
```

`neutral` → `colorScheme.surfaceContainerHigh` (top/body) + `colorScheme.outlineVariant` (band/button outline) — today's un-highlighted look. `accent` → `colorScheme.primaryContainer` (top/body) + `colorScheme.primary` (band/button) — the same purple `PokedexEntryCard.inTeam` already uses.

## Callers and their tone rule

| Caller | `accent` when | `neutral` when |
|---|---|---|
| `PokedexEntryCard` | `inTeam == true` (already added to the roster) | not yet added |
| `TeamSlot` | this slot is the currently active/open slot | any other filled or empty slot |
| `PokemonCustomizationCard` | always | never (matches the reference mockup, which always shows the accented circle) |

`PokedexEntryCard`'s existing hover highlight (`_hovering`) stays a separate, additive visual (border color), not a tone change — hovering a not-yet-added entry does not turn its pokéball accent-colored, only its border.

## Test impact

- `pokeball_background_test.dart` (**new**): renders the two tones with the expected `colorScheme` roles; `child` renders centered on top.
- `pokedex_entry_card_test.dart`: pokéball tone follows `inTeam`.
- `team_slot_test.dart`: pokéball tone follows "is this the active slot" (new `isActive` parameter on `TeamSlot`, passed down from `TeamSlotRow`'s new `activeIndex` parameter — see `data-model.md`'s `TeamBuilderState.activeSlotIndex`).
- `pokemon_customization_card_test.dart`: pokéball always renders `accent`.
