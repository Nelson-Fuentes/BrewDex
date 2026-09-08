# Research: Selector de Género en Tarjeta de Pokémon

## Decision 1 — La "tarjeta de información" es `PokemonDetailModalComponent`, existente

**Decision**: El selector de género se añade a `team/presentation/pokemon-detail-modal.component.ts` — el mismo modal introducido en `018` que ya muestra nombre, tipos, imagen y el toggle de shiny (`isShiny`/`shinyChange`). No se crea una tarjeta nueva.

**Rationale**: Es el único componente del código base que coincide con la descripción del usuario ("tarjeta de información... con... modo shiny"): tiene imagen, un control de shiny existente, y es donde `TeamBuilderPage` ya resuelve el `PokedexEntry` activo. `pokedex-entry-card.component.ts` (el tile del grid de la Pokédex) es solo sprite + número, sin shiny ni detalle — no aplica. Extender el modal existente reutiliza exactamente el patrón ya revisado en `018` (Constitución Principio I).

**Alternatives considered**: Crear un componente de tarjeta nuevo y separado para el selector de género — rechazado, duplicaría el layout de imagen/tipos que el modal ya resuelve y fragmentaría el estado (dos componentes leyendo el mismo `RosterEntry`).

## Decision 2 — Persistencia: nuevo método `toggleGender` en `TeamStore`, espejo de `toggleShiny`

**Decision**: `InMemoryTeamService` (el `TeamStore`) gana `toggleGender(slotIndex: number, gender: Gender): void`, implementado exactamente como `toggleShiny`: `this.updateSlot(slotIndex, (slot) => slot.copyWith({ gender }))`. `RosterEntry.gender: Gender | null` y `copyWith({ gender })` **ya existen** en el dominio (sin usar hasta ahora) — no se toca `RosterEntry`.

**Rationale**: Resuelve la clarificación de spec.md (2026-09-07): el género debe persistir en el slot del equipo, igual que el shiny. El campo y el método `copyWith` ya estaban modelados para este propósito exacto (el comentario de `RosterEntry.gender` dice "`null` solo transitoriamente, mientras se resuelve"); esta feature es la que finalmente lo resuelve.

**Alternatives considered**: Guardar el género como estado local del componente modal (señal interna) — rechazado tras la clarificación: no sobrevive a cerrar/reabrir la tarjeta ni es independiente por Pokémon del equipo (FR-013/FR-014).

## Decision 3 — Capacidad de género y género por defecto: nuevas funciones puras en el dominio `pokemon`

**Decision**: Añadir a `pokemon/domain/value-objects/gender.ts` dos funciones puras, sin dependencias externas:

```ts
export type GenderCapability = 'dual' | 'male-only' | 'female-only' | 'genderless';

export function genderCapability(genderRate: number): GenderCapability;
// genderRate === -1 → 'genderless' | === 0 → 'male-only' | === 8 → 'female-only' | 1-7 → 'dual'

export function resolveDisplayGender(genderRate: number, storedGender: Gender | null): Gender;
// storedGender !== null → storedGender
// si no: 'dual'/'male-only' → 'male' ; 'female-only' → 'female' ; 'genderless' → 'genderless'
```

`PokedexEntry.genderRate` ya trae el valor crudo de PokeAPI (`species.gender_rate`, wireado desde `017`): `-1` = sin género, `0` = 100% de probabilidad de ser el género no-hembra (siempre macho), `8` = siempre hembra, `1`-`7` = ambos géneros posibles. Es la codificación estándar de PokeAPI, ya documentada en el comentario existente `/** \`-1\` = sin datos de género. */`.

**Rationale**: Es una regla de negocio real y testeable (Constitución Principio II: tests antes de implementación) que combina un dato ya existente (`genderRate`) con el género ya guardado (`RosterEntry.gender`); vive en `pokemon/domain` porque solo depende de `genderRate` y del tipo `Gender` que esa misma capa ya declara — mantiene la capa `team` sin necesidad de reimplementar la regla. `RosterEntry.gender` en sí mismo se queda en `null` hasta que la persona elige explícitamente un género (no se escribe un valor por defecto al agregar el Pokémon al equipo) — `resolveDisplayGender` es lo que la presentación usa para decidir qué mostrar mientras tanto, evitando escribir en el store un valor que nadie eligió (Principio I).

**Alternatives considered**: Escribir el género por defecto ('male') en `RosterEntry.gender` inmediatamente al agregar el Pokémon al equipo (en `addPokemonToTeam`) — rechazado: requeriría que la capa de aplicación `team` conozca `genderRate` (un dato de `pokemon`) en el momento de agregar, acoplando ese caso de uso a un dato que hoy solo se resuelve vía `PokedexDetailsReader` en la presentación; además distorsiona la semántica de "el género aún no ha sido elegido por la persona" (relevante para FR-003 vs. FR-007).

## Decision 4 — Imagen: extender el cálculo de sprite ya existente (`spriteUrl()`) con el género, sin nuevo dato

**Decision**: El cálculo de imagen en `PokemonDetailModalComponent` (hoy `(isShiny() ? entry.homeSpriteShinyUrl : null) ?? entry.homeSpriteUrl`) se generaliza a las 4 URLs de sprite que `PokedexEntry` ya expone (`homeSpriteUrl`, `homeSpriteShinyUrl`, `homeSpriteFemaleUrl`, `homeSpriteShinyFemaleUrl`, todas ya wireadas desde `017`/`018`):

```ts
function resolveSpriteUrl(entry: PokedexEntry, gender: Gender, shiny: boolean): string | null {
  const female = gender === 'female';
  if (shiny) {
    return (female ? entry.homeSpriteShinyFemaleUrl : null) ?? entry.homeSpriteShinyUrl ?? entry.homeSpriteUrl;
  }
  return (female ? entry.homeSpriteFemaleUrl : null) ?? entry.homeSpriteUrl;
}
```

La misma función se aplica al avatar de `TeamSlotComponent` (hoy `(isShiny ? details.homeSpriteShinyUrl : null) ?? details.homeSpriteUrl ?? EGG_SPRITE_URL`), que muestra la imagen del mismo `RosterEntry` en la grilla de equipo — se mantiene consistente con lo que la tarjeta de detalle muestra para ese mismo Pokémon (evita que el slot quede mostrando el sprite de un género distinto al que el usuario acaba de elegir en la tarjeta).

**Rationale**: No hace falta ningún dato nuevo — la caída en cascada (`?? `) ya resuelve FR-008/FR-009 sin consultar `hasGenderDifferences` explícitamente: si el Pokémon no tiene sprite hembra distinto, `homeSpriteFemaleUrl`/`homeSpriteShinyFemaleUrl` ya son `null` en el dato existente y la cascada cae al sprite macho/base, dejando la imagen sin cambios (el campo `hasGenderDifferences` sigue disponible en el dominio pero esta lógica de UI no necesita consultarlo aparte). El orden de fallback (shiny-hembra → shiny-base → base) replica exactamente el patrón ya usado hoy para shiny solo (`shinyUrl ?? url`).

**Alternatives considered**: Consultar `hasGenderDifferences` para decidir si usar el sprite hembra — rechazado, es redundante con la nulabilidad ya presente en los datos y añade una segunda fuente de verdad que podría desincronizarse.

## Decision 5 — Widget de selector: `mat-button-toggle-group` de dos íconos (♂/♀), no `mat-slide-toggle`

**Decision**: El selector de género usa `MatButtonToggleModule` (`mat-button-toggle-group` de selección exclusiva con dos `mat-button-toggle`, uno por género) en vez de reutilizar `mat-slide-toggle` (usado para shiny). Solo se renderiza cuando `genderCapability(pokedexEntry().genderRate) === 'dual'`; en los otros tres casos se renderiza un indicador fijo (texto/ícono no interactivo) con el género único o el símbolo de "sin género".

**Rationale**: El shiny es un booleano (activo/inactivo), pero el género dual son dos opciones nombradas mutuamente excluyentes — `mat-button-toggle-group` es el control de Angular Material pensado exactamente para eso. `@angular/material` ya es una dependencia del proyecto (`017`/`018`); `MatButtonToggleModule` es un módulo más del mismo paquete ya instalado, no una librería nueva (Constitución: "Technology & Architecture Constraints" — preferir una dependencia ya adoptada). Los íconos ♂/♀ van como contenido de cada `mat-button-toggle` (símbolos Unicode, no un asset nuevo — coincide con la Asunción de spec.md).

**Alternatives considered**: Un `mat-slide-toggle` binario macho/hembra — rechazado, un slide-toggle comunica "activo/inactivo" de una sola propiedad, no dos identidades igualmente válidas; sería confuso además de no dejar espacio natural para el caso "sin selector, un solo ícono fijo" sin ocultar/mostrar un control binario de forma poco clara.

## Decision 6 — Indicador "sin género": símbolo de guion, igual que en los juegos de origen

**Decision**: Cuando `genderCapability === 'genderless'`, el indicador fijo muestra un guion (`—`) en vez de un ícono ♂/♀, replicando la convención ya usada en los juegos Pokémon de origen para especies sin género.

**Rationale**: Evita inventar o buscar un ícono nuevo (sin librería adicional) y es la convención reconocible del dominio (Principio I).

**Alternatives considered**: Un ícono Material genérico (`block`, `remove`) — rechazado, menos reconocible para la persona usuaria que el guion ya convencional en el género de juegos que esta app modela.
