# Contract: Official (generation-independent) type icons

**Amends**: `lib/presentation/team_builder/widgets/type_icon_resolution.dart`'s `typeIconUrl`.

## Before

```dart
String? typeIconUrl({required PokemonType type, required Game game}) {
  if (type.numericId <= 0) return null;
  final generationId = _generationsWithTypeIcons.contains(game.generation.id)
      ? game.generation.id
      : _oldestIconGeneration; // "generation-iii"
  return 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/'
      '$generationId/${game.id}/${type.numericId}.png';
}
```

Icon art varies by `game.generation.id` — the same type renders with a different, era-specific icon depending on which game's armador is open.

## After

```dart
String? typeIconUrl({required PokemonType type}) {
  if (type.numericId <= 0) return null;
  return 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/'
      '$_officialIconGenerationId/$_officialIconGameId/${type.numericId}.png';
}
```

- `_officialIconGenerationId` = `'generation-ix'`, `_officialIconGameId` = `'scarlet-violet'` — one fixed pair, not derived from the active `Game` at all. `game` is dropped from the function's parameters (every call site updated accordingly); this is an internal presentation-layer function with no external consumer, so removing the now-unused parameter is not a breaking *public* contract change (Principle III governs published contracts — the app's own internal widget helpers are not one).
- `_generationsWithTypeIcons`/`_oldestIconGeneration` (the per-generation branching table) are deleted — no longer meaningful once icon choice is generation-independent.
- `iconForPokemonType` (`pokemon_type_icons.dart`, the bundled Material-icon fallback used when the network image fails or `numericId` is unresolved) is unchanged.

## Second half of this contract: a shared rendering widget

`typeIconUrl` alone does not fix the report — today it has exactly one caller (`pokedex_type_filter.dart`'s private `_TypeIcon`); `TeamSlot` and `PokemonCustomizationCard` render types via `Icon(iconForPokemonType(type.id), ...)` directly and never call `typeIconUrl` at all. This contract also introduces a public `PokemonTypeIcon` widget (new, in `type_icon_resolution.dart`):

```dart
class PokemonTypeIcon extends StatelessWidget {
  const PokemonTypeIcon({super.key, required this.type, this.size = 18, this.color});
  final PokemonType type;
  final double size;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final url = typeIconUrl(type: type);
    if (url == null) return Icon(iconForPokemonType(type.id), size: size, color: color);
    return Image.network(
      url,
      width: size,
      height: size,
      errorBuilder: (context, error, stackTrace) =>
          Icon(iconForPokemonType(type.id), size: size, color: color),
    );
  }
}
```

`pokedex_type_filter.dart`'s `_TypeIcon` is deleted in favor of this; `TeamSlot`'s `Icon(iconForPokemonType(type.id), size: 12)` and `PokemonCustomizationCard`'s `Chip(avatar: Icon(iconForPokemonType(type.id), size: 18), ...)` are both changed to use `PokemonTypeIcon` instead — this is the change that actually makes the report's screenshotted surfaces (a team slot, the customization card) show the official icon instead of a generic Material glyph standing in for a type.

## Verification

Every type id (`kPokemonTypeIcons`' 18 keys) resolves to a URL under `sprites/types/generation-ix/scarlet-violet/`, and that URL is asserted reachable (HTTP 200) for at least one representative sample during manual/quickstart verification — this pair was live-checked during planning (research.md Decision 3) and known to publish the full modern 18-type icon set. A widget test renders `TeamSlot`/`PokemonCustomizationCard` for a known type and asserts a `PokemonTypeIcon`/`Image.network` targeting the expected URL is present, not a bare `Icon`.
