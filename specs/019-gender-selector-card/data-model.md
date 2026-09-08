# Data Model: Selector de Género en Tarjeta de Pokémon

Feature pequeña y aditiva: un campo de dominio que ya existía sin usar (`RosterEntry.gender`) se conecta a la UI, y se añaden dos funciones puras de dominio. No hay entidades ni campos nuevos que persistir.

## Gender (`pokemon/domain/value-objects/gender.ts`) — sin cambio de forma, dos funciones nuevas

`export type Gender = 'male' | 'female' | 'genderless';` **sin cambios**. Se añaden, en el mismo archivo:

- `GenderCapability = 'dual' | 'male-only' | 'female-only' | 'genderless'` — describe qué géneros admite una especie, derivado de `PokedexEntry.genderRate` (research.md Decisión 3).
- `genderCapability(genderRate: number): GenderCapability` — función pura.
- `resolveDisplayGender(genderRate: number, storedGender: Gender | null): Gender` — función pura; es la implementación de spec.md's "Género guardado del Pokémon del equipo" (Key Entities) para el caso sin género guardado aún.

## PokedexEntry (`pokemon/domain/entities/pokedex-entry.ts`) — sin cambio

`genderRate: number` y `hasGenderDifferences: boolean` **ya existen** (wireados desde PokeAPI en `017`, sin consumidor hasta ahora). `homeSpriteUrl`, `homeSpriteShinyUrl`, `homeSpriteFemaleUrl`, `homeSpriteShinyFemaleUrl` **ya existen** igual. Esta feature es la primera en leer los cuatro campos de sprite juntos y en `genderRate`; `hasGenderDifferences` queda disponible en el dominio pero no es necesario para la resolución de sprite (research.md Decisión 4 — la nulabilidad de los campos `*Female*` ya lo codifica).

## RosterEntry (`team/domain/value-objects/roster-entry.ts`) — sin cambio

`gender: Gender | null = null` y `copyWith({ gender })` **ya existen** (modelados en una feature anterior, sin usar hasta ahora). Semántica que esta feature fija: `null` = la persona no ha elegido explícitamente un género para este Pokémon del equipo todavía (se muestra el valor de `resolveDisplayGender`, normalmente macho); un valor no nulo = la persona lo cambió explícitamente vía el selector, y persiste mientras el Pokémon siga en ese slot (FR-013).

## InMemoryTeamService / `TeamStore` — nuevo método

`toggleGender(slotIndex: number, gender: Gender): void` — ver `contracts/team-gender-selector.md`. Sigue el mismo patrón que `toggleShiny`/`toggleMega`/`toggleGigamax` ya existentes en el mismo archivo.

## PokemonDetailModalComponent — nuevos inputs/outputs

Ver `contracts/team-gender-selector.md` para la forma completa. Resumen: gana `gender: InputSignal<Gender>` (el género efectivo, resuelto por `TeamBuilderPage` vía `resolveDisplayGender`) y `genderChange: OutputEmitterRef<Gender>`; su cálculo interno de imagen se generaliza para tomar en cuenta el género además del shiny (research.md Decisión 4).

## TeamSlotComponent — cambio interno, sin nuevo input/output

Su cálculo interno de sprite (hoy solo sensible a `isShiny`) se generaliza para leer también `entry().gender` (ya disponible, viene del mismo `RosterEntry` que ya recibe como input `entry`) y aplicar la misma resolución de sprite que el modal (research.md Decisión 4), para que la grilla de equipo no quede mostrando un sprite de un género distinto al que la tarjeta de detalle acaba de mostrar para ese mismo Pokémon.

## Key Entities cross-reference (spec.md)

| spec.md Key Entity | Implementation |
|---|---|
| Capacidad de género del Pokémon | `genderCapability(entry.genderRate)` — nueva función pura en `pokemon/domain/value-objects/gender.ts` |
| Género guardado del Pokémon del equipo | `RosterEntry.gender` (existente, sin usar hasta ahora) leído/escrito vía `InMemoryTeamService.toggleGender`; `resolveDisplayGender` cubre el caso "aún no guardado" (por defecto macho) |
| Forma visual del Pokémon | `resolveSpriteUrl(entry, gender, shiny)` — lógica de presentación (no una entidad de dominio nueva), aplicada en `PokemonDetailModalComponent` y `TeamSlotComponent` sobre los 4 campos de sprite ya existentes en `PokedexEntry` |
