# Contract: Remove the type-weaknesses section from the customization card

**Covers**: FR-012, SC-005. User Story 4.

## Removed

From `pokemon_customization_card.dart`:

- The call site: the `Text(l10n.customizationCardWeaknessesLabel, ...)` label, its preceding/following `SizedBox` spacers, and the `_TypeWeaknessTable(effectiveness: typeEffectivenessAgainst(resolveSlotTypes(entry, rosterEntry)))` widget.
- The `_TypeWeaknessTable` class.
- The `_WeaknessCell` class.
- The now-unused `l10n.customizationCardWeaknessesLabel` getter usage in this file (the `.arb` key itself is removed from all locale files — see below).

## Kept

- `typeEffectivenessAgainst` and `TypeEffectivenessChart` (`domain/team_builder/value_objects/type_effectiveness_chart.dart`) — pure domain calculation, kept for the Coverage Analysis section's future increments (research.md Decision 5). Its own existing unit tests are left in place unchanged.
- `resolveSlotTypes` — still used by the type row directly above where the weaknesses section used to be.

## l10n cleanup

Remove the `customizationCardWeaknessesLabel` key (and its `@customizationCardWeaknessesLabel` metadata block, where present) from every locale file under `lib/l10n/*.arb` (all 10 locales), then regenerate `lib/l10n/generated/` (`flutter gen-l10n`, per this project's existing l10n workflow) so the generated `AppLocalizations` class drops the now-unused getter. No other key changes needed for this user story.

## Test Expectations (`pokemon_customization_card_test.dart`)

1. `find.text(l10n.customizationCardWeaknessesLabel)` — replaced by asserting the *absence* of any weaknesses-table `DataTable`/`Table`/`_TypeWeaknessTable`-equivalent finder, and the absence of the (now-removed) label text, in a rendered card.
2. No other section's spacing/order regresses (the section immediately above — the type row — is now directly followed by the Tera Type section or moves section, whichever came next).
3. A static check (or a simple `grep`-style test/CI note, non-blocking) that `_TypeWeaknessTable`/`_WeaknessCell` no longer exist in the file — optional, since the compiler already guarantees no dangling references once the classes are deleted.
