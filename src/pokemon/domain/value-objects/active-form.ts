import type { PokedexEntry } from '../entities/pokedex-entry';
import type { PokemonStats } from './pokemon-stats';
import type { PokemonType } from './pokemon-type';
import type { SelectableForm } from './selectable-form';

/**
 * El subconjunto de una forma (base o alternativa) que la tarjeta de
 * detalle y el slot de equipo necesitan mostrar — los mismos 7 campos
 * que ya comparten `PokedexEntry` (forma base) y `SelectableForm`
 * (formas alternativas), spec `020` (tipo/sprites) y spec
 * `020-stats-bar-scale-color` (`baseStats`, para el gráfico de barras).
 *
 * Value object de dominio puro: sin imports de Angular/HTTP (Constitución
 * Principio VI).
 */
export interface ActiveFormPresentation {
  readonly typePrimary: PokemonType;
  readonly typeSecondary: PokemonType | null;
  readonly homeSpriteUrl: string | null;
  readonly homeSpriteShinyUrl: string | null;
  readonly homeSpriteFemaleUrl: string | null;
  readonly homeSpriteShinyFemaleUrl: string | null;
  readonly baseStats: PokemonStats;
}

/**
 * FR-009/FR-010 (`020`): la forma a mostrar, ya resuelta. `formVarietyId`
 * DEBE ser el valor ya resuelto por {@link resolveDisplayFormVarietyId}
 * (nunca el `RosterEntry.formVarietyId` crudo sin chequear disponibilidad)
 * — `null`, o sin match en `entry.selectableForms`, devuelve la propia
 * `entry` (forma base).
 */
export function resolveActiveForm(entry: PokedexEntry, formVarietyId: string | null): ActiveFormPresentation {
  const form = formVarietyId === null ? undefined : entry.selectableForms.find((f) => f.varietyId === formVarietyId);
  return form ?? entry;
}

/**
 * FR-006/FR-007/FR-008 (`020`): las formas alternativas realmente
 * elegibles ahora. El filtro por juego/generación ya está garantizado
 * estructuralmente por cómo se arma `entry.selectableForms` en
 * infraestructura (research.md Decisión 4/5) — acá solo se aplica el
 * filtro de DLC activo sobre `SelectableForm.requiresDlcId`.
 */
export function availableSelectableForms(
  entry: PokedexEntry,
  activeDlcIds: ReadonlySet<string>,
): readonly SelectableForm[] {
  return entry.selectableForms.filter((form) => form.requiresDlcId === null || activeDlcIds.has(form.requiresDlcId));
}

/**
 * FR-011 (`020`): mismo patrón de solo-lectura que `resolveDisplayGender`
 * (`019`) — no muta nada, solo decide qué mostrar. Devuelve
 * `storedFormVarietyId` sin cambios si sigue en `availableForms`; si no
 * (p. ej. se desactivó el DLC que la requería), devuelve `null` (forma
 * base) sin tocar `RosterEntry`. Si el DLC se reactiva, la forma
 * guardada reaparece sola.
 */
export function resolveDisplayFormVarietyId(
  availableForms: readonly SelectableForm[],
  storedFormVarietyId: string | null,
): string | null {
  if (storedFormVarietyId === null) {
    return null;
  }
  const stillAvailable = availableForms.some((form) => form.varietyId === storedFormVarietyId);
  return stillAvailable ? storedFormVarietyId : null;
}

/**
 * `027` (research.md Decisión 3, contrato §1): el sprite HOME a mostrar
 * para una forma ya activa, según género y shiny — orden de preferencia
 * shiny+género → shiny → género → base, cayendo al siguiente cuando el
 * más específico no existe. `null` únicamente si ni siquiera
 * `form.homeSpriteUrl` existe.
 *
 * Extraída de `PokemonDetailModalComponent.spriteUrl()` y
 * `TeamSlotComponent.avatarImageUrl()` (`019`/`020`), que la duplicaban —
 * ambos delegan ahora en esta función en vez de repetir la misma lógica
 * una tercera vez para el modal de cobertura del equipo (`027`).
 *
 * Value object de dominio puro: sin imports de Angular/HTTP (Constitución
 * Principio VI).
 */
export function resolveFormSpriteUrl(form: ActiveFormPresentation, isFemale: boolean, isShiny: boolean): string | null {
  if (isShiny) {
    return (isFemale ? form.homeSpriteShinyFemaleUrl : null) ?? form.homeSpriteShinyUrl ?? form.homeSpriteUrl;
  }
  return (isFemale ? form.homeSpriteFemaleUrl : null) ?? form.homeSpriteUrl;
}
