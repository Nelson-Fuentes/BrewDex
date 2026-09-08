# Data Model: Tamaño de Tipos Legible, Tabla de Cobertura Visible y Estabilidad al Quitar Pokémon

This feature introduces no new persisted entity, domain object, or state
shape — it corrects presentation-layer sizing, layout verification, and a
navigation race condition. No `data-model.md` content beyond documenting the
two existing values it touches (for traceability, not because either is a
new "entity"):

- **`kStandardTypeIconSize`** (`lib/presentation/team_builder/widgets/type_icon_resolution.dart`): a shared `double` constant, not a domain entity — the single size every "Pokémon's own type" badge renders at across the team slot, the customization card, and the Pokédex type filter. This feature changes its value from `24.0` to `40.0` (research.md Decision 1); its role and consumers are unchanged.
- **Team-slot removal outcome**: not a new entity — `TeamBuilderCubit.removePokemon(slotIndex)` already fully owns clearing a `TeamSlotView` back to empty (existing domain/application behavior, untouched by this feature). What changes is purely the *presentation* code path that used to also perform an extra, redundant `Navigator.pop()` alongside that call (research.md Decision 3) — no new state field is added to `TeamBuilderState`.

No `Key Entities` section is needed beyond what spec.md already documents at
the conceptual level.
