import { Injectable, inject, signal } from '@angular/core';

import type { PokedexEntry } from '../../pokemon/domain/entities/pokedex-entry';
import { Move } from '../../pokemon/domain/value-objects/move';
import type { MoveLearnInfo } from '../../pokemon/domain/value-objects/move-learn-info';
import type { SelectableForm } from '../../pokemon/domain/value-objects/selectable-form';
import type { Gender } from '../../pokemon/domain/value-objects/gender';
import { RosterEntry, type MoveSlots } from '../domain/value-objects/roster-entry';
import { MAX_TEAM_SIZE } from '../domain/value-objects/team-size';
import type { RosterReader } from '../domain/ports/roster-reader';
import { addPokemonToTeam, TeamFull } from '../application/add-pokemon-to-team';
import { removePokemonFromTeam } from '../application/remove-pokemon-from-team';
import { GAME_SELECTION_READER } from '../../shared/tokens/game-selection-reader.token';
import { ACTIVE_LANGUAGE_READER } from '../../shared/tokens/active-language-reader.token';
import { MOVEPOOL_REPOSITORY } from '../../shared/tokens/movepool-repository.token';
import { POKEDEX_DETAILS_READER } from '../../shared/tokens/pokedex-details-reader.token';

function emptySlots(): (RosterEntry | null)[] {
  return Array.from({ length: MAX_TEAM_SIZE }, () => null);
}

/**
 * Expone la API de aplicación `TeamStore` (contracts/team-session.md)
 * como signals — el reemplazo de `TeamBuilderCubit` para la parte de
 * roster. Implementa {@link RosterReader}, el puerto cruzado que `game`
 * consulta antes de confirmar un cambio de juego (FR-016). Sin ningún
 * almacenamiento (FR-015): `slots` arranca siempre vacío y se pierde al
 * recargar la app.
 */
@Injectable({ providedIn: 'root' })
export class InMemoryTeamService implements RosterReader {
  private readonly gameSelectionReader = inject(GAME_SELECTION_READER);
  private readonly activeLanguageReader = inject(ACTIVE_LANGUAGE_READER);
  private readonly movepoolRepository = inject(MOVEPOOL_REPOSITORY);
  private readonly pokedexDetailsReader = inject(POKEDEX_DETAILS_READER);

  private readonly slotsSignal = signal<(RosterEntry | null)[]>(emptySlots());
  /** El motivo del último rechazo de `addPokemonToTeam` (FR-011), o
   *  `null` si la última operación no fue rechazada. La presentación lo
   *  lee para mostrar el mensaje y puede limpiarlo con
   *  {@link clearRejection}. */
  private readonly rejectionSignal = signal<'team-full' | null>(null);
  /** El movepool ya resuelto por slot (FR-014), con su(s) método(s) de
   *  aprendizaje en el juego activo (FR-009) — se carga bajo demanda con
   *  {@link loadMovepool}, no automáticamente al agregar (el moveset por
   *  defecto sí se resuelve automáticamente, ver
   *  {@link addPokemonToTeam}). */
  private readonly movepoolBySlotSignal = signal<ReadonlyMap<number, MoveLearnInfo[]>>(new Map());

  private lastGameId: string | null = null;

  readonly slots = this.slotsSignal.asReadonly();
  readonly rejection = this.rejectionSignal.asReadonly();
  readonly movepoolBySlot = this.movepoolBySlotSignal.asReadonly();

  constructor() {
    this.lastGameId = this.gameSelectionReader.currentGame()?.id ?? null;
    // FR-016: un cambio de JUEGO (no un simple toggle de DLC del mismo
    // juego) invalida el roster completo — nunca se reconcilia en
    // silencio, la presentación ya debió confirmar antes de llegar acá
    // (ver game/presentation, integración de User Story 2).
    this.gameSelectionReader.onSelectionChanged().subscribe(() => {
      const newGameId = this.gameSelectionReader.currentGame()?.id ?? null;
      if (newGameId !== this.lastGameId) {
        this.slotsSignal.set(emptySlots());
        this.movepoolBySlotSignal.set(new Map());
        this.lastGameId = newGameId;
      }
    });
  }

  hasAnyPokemon(): boolean {
    return this.slotsSignal().some((slot) => slot !== null);
  }

  /** FR-010/FR-011. Sugiere el moveset por defecto de forma asíncrona una
   *  vez agregado (FR-014) — el slot arranca sin movimientos y se
   *  completa cuando ese pedido resuelve. */
  addPokemonToTeam(entry: PokedexEntry): void {
    let nextSlots: (RosterEntry | null)[];
    try {
      nextSlots = addPokemonToTeam(this.slotsSignal(), entry.pokemonId);
    } catch (error) {
      if (error instanceof TeamFull) {
        this.rejectionSignal.set('team-full');
        return;
      }
      throw error;
    }
    this.slotsSignal.set(nextSlots);
    this.rejectionSignal.set(null);
    const slotIndex = nextSlots.findIndex((slot) => slot?.pokemonId === entry.pokemonId);
    // FR-020 (`021`, corrección post-release): `entry.defaultVarietyId`,
    // no `entry.pokemonId` — para una forma regional principal en el
    // juego activo (p. ej. Ninetales de Alola en Ultra Sol/Ultra Luna),
    // `pokemonId` sigue siendo la especie ("ninetales"), pero el moveset
    // por defecto debe resolverse contra la variedad que de verdad aplica.
    void this.applyDefaultMoveset(slotIndex, entry.pokemonId, entry.defaultVarietyId);
  }

  /** FR-012. */
  removePokemonFromTeam(slotIndex: number): void {
    this.slotsSignal.set(removePokemonFromTeam(this.slotsSignal(), slotIndex));
  }

  clearRejection(): void {
    this.rejectionSignal.set(null);
  }

  /** FR-013: aplica una forma/variante distinta a un slot ya ocupado.
   *  FR-020 (`021`): cualquier movimiento ya asignado que la nueva forma
   *  no aprenda se vacía automáticamente. */
  selectForm(slotIndex: number, form: SelectableForm): void {
    this.updateSlot(slotIndex, (slot) => slot.copyWith({ formVarietyId: form.varietyId }));
    void this.revalidateMovesForForm(slotIndex, form.varietyId);
  }

  /** FR-005 (`020`): devuelve un slot a su forma base (`formVarietyId:
   *  null`) — el chip de forma base del toggle no tiene un
   *  `SelectableForm` que pasarle a {@link selectForm}. Espejo de
   *  `selectForm`. FR-020 (`021`): mismo vaciado automático que
   *  `selectForm`. */
  selectBaseForm(slotIndex: number): void {
    const pokemonId = this.slotsSignal()[slotIndex]?.pokemonId;
    this.updateSlot(slotIndex, (slot) => slot.copyWith({ formVarietyId: null }));
    if (pokemonId) {
      void this.revalidateMovesForForm(slotIndex, this.defaultVarietyIdFor(pokemonId));
    }
  }

  /** FR-014: reemplaza un movimiento de un slot ya ocupado (0-3).
   *  FR-016/FR-017 (`021`, contracts/duplicate-move-block.md): ya NO
   *  auto-intercambia un movimiento ya asignado a otra posición — la
   *  presentación nunca deja click-able una opción ya asignada
   *  (`MoveSelectionSheetComponent` la deshabilita), así que esto es solo
   *  una guarda defensiva que ignora una asignación entrante duplicada en
   *  vez de crear el duplicado. */
  selectMove(slotIndex: number, movePosition: 0 | 1 | 2 | 3, move: Move | null): void {
    this.updateSlot(slotIndex, (slot) => {
      if (move && slot.moveIds.some((id, i) => id === move.id && i !== movePosition)) {
        return slot;
      }
      const nextMoveIds = [...slot.moveIds] as [string | null, string | null, string | null, string | null];
      nextMoveIds[movePosition] = move?.id ?? null;
      return slot.copyWith({ moveIds: nextMoveIds as MoveSlots });
    });
  }

  /** Resuelve (bajo demanda, p. ej. al abrir `MoveSelectionSheet`) todos
   *  los movimientos que el slot puede aprender en el juego activo. */
  async loadMovepool(slotIndex: number): Promise<void> {
    const slot = this.slotsSignal()[slotIndex];
    const game = this.gameSelectionReader.currentGame();
    if (!slot || !game) {
      return;
    }
    const varietyId = slot.formVarietyId ?? this.defaultVarietyIdFor(slot.pokemonId);
    try {
      const movepool = await this.movepoolRepository.fetchMovepool(varietyId, game, this.activeLanguageReader.currentLanguageCode());
      const next = new Map(this.movepoolBySlotSignal());
      next.set(slotIndex, movepool);
      this.movepoolBySlotSignal.set(next);
    } catch {
      // Un fallo puntual del movepool no debe tumbar el resto de la
      // pantalla — MoveSelectionSheet simplemente no ofrece opciones.
    }
  }

  /** FR-021/FR-022/FR-022a (`018`): activa/desactiva la forma shiny de un
   *  slot ya ocupado. Persiste en el `RosterEntry` — sobrevive a cerrar y
   *  reabrir el modal de detalle, hasta que se vuelva a llamar o se quite
   *  al Pokémon del slot. */
  toggleShiny(slotIndex: number, active: boolean): void {
    this.updateSlot(slotIndex, (slot) => slot.copyWith({ isShiny: active }));
  }

  /** FR-007/FR-013/FR-014 (`019`): fija `RosterEntry.gender` para el slot
   *  dado. Persiste igual que `toggleShiny` — sobrevive a cerrar y reabrir
   *  el modal de detalle, y es independiente por slot. Solo tiene efecto
   *  visible en especies de género dual: la presentación solo la llama
   *  desde el toggle, que solo se renderiza cuando
   *  `genderCapability(pokedexEntry.genderRate) === 'dual'`. */
  toggleGender(slotIndex: number, gender: Gender): void {
    this.updateSlot(slotIndex, (slot) => slot.copyWith({ gender }));
  }

  /** FR-024a/FR-024b: mutuamente excluyentes entre sí. */
  toggleMega(slotIndex: number, active: boolean): void {
    this.updateSlot(slotIndex, (slot) => slot.copyWith({ megaActive: active, gigamaxActive: active ? false : slot.gigamaxActive }));
  }

  toggleGigamax(slotIndex: number, active: boolean): void {
    this.updateSlot(slotIndex, (slot) => slot.copyWith({ gigamaxActive: active, megaActive: active ? false : slot.megaActive }));
  }

  selectTeraType(slotIndex: number, teraType: RosterEntry['teraType']): void {
    this.updateSlot(slotIndex, (slot) => slot.copyWith({ teraType }));
  }

  private async applyDefaultMoveset(slotIndex: number, pokemonId: string, defaultVarietyId: string): Promise<void> {
    const game = this.gameSelectionReader.currentGame();
    if (slotIndex === -1 || !game) {
      return;
    }
    try {
      const moveset = await this.movepoolRepository.fetchDefaultMoveset(
        defaultVarietyId,
        game,
        this.activeLanguageReader.currentLanguageCode(),
      );
      const moveIds = [null, null, null, null] as [string | null, string | null, string | null, string | null];
      moveset.slice(0, 4).forEach((move, i) => (moveIds[i] = move.id));
      // El slot puede haber cambiado (o vaciado) mientras esto resolvía —
      // solo se aplica si el mismo Pokémon sigue en ese slot.
      const current = this.slotsSignal()[slotIndex];
      if (current?.pokemonId === pokemonId) {
        this.updateSlot(slotIndex, (slot) => slot.copyWith({ moveIds }));
      }
    } catch {
      // Sin moveset por defecto resuelto, el slot queda con movimientos
      // vacíos — la persona igual puede elegirlos a mano (FR-014).
    }
  }

  /** FR-020 (`021-move-slots-filters`, contracts/form-change-slot-invalidation.md):
   *  tras un cambio de forma efectiva, vacía cualquier `moveId` que la
   *  nueva `varietyId` ya no aprenda. Tolerante a fallos de red — un
   *  movepool que no se pudo resolver no vacía nada a ciegas (caso 4 del
   *  contrato). */
  private async revalidateMovesForForm(slotIndex: number, varietyId: string): Promise<void> {
    const game = this.gameSelectionReader.currentGame();
    if (!game) {
      return;
    }
    try {
      const movepool = await this.movepoolRepository.fetchMovepool(varietyId, game, this.activeLanguageReader.currentLanguageCode());
      const validIds = new Set(movepool.map((info) => info.move.id));
      const current = this.slotsSignal()[slotIndex];
      // El slot puede haber cambiado de nuevo mientras esto resolvía —
      // solo se aplica si la forma efectiva sigue siendo la misma.
      if (!current || (current.formVarietyId ?? this.defaultVarietyIdFor(current.pokemonId)) !== varietyId) {
        return;
      }
      const nextMoveIds = current.moveIds.map((id) => (id !== null && !validIds.has(id) ? null : id)) as [
        string | null,
        string | null,
        string | null,
        string | null,
      ];
      this.updateSlot(slotIndex, (slot) => slot.copyWith({ moveIds: nextMoveIds }));
    } catch {
      // Fallo puntual al revalidar: se conservan los moveIds existentes
      // sin validar, en vez de vaciarlos a ciegas.
    }
  }

  /** FR-020 (`021`, corrección post-release — bug reportado: Ninetales de
   *  Alola en Ultra Sol/Ultra Luna mostraba el movepool de Ninetales de
   *  Kanto): la variedad efectiva de `pokemonId` cuando el slot NO tiene
   *  una forma alternativa elegida explícitamente (`formVarietyId ===
   *  null`) no siempre es `pokemonId` — cuando una forma regional
   *  (Alola/Galar/Hisui/Paldea) es la variedad PRINCIPAL en el juego
   *  activo, `PokedexEntry.defaultVarietyId` ya la resuelve
   *  correctamente. `pokemonId` sigue siendo el fallback si el detalle
   *  todavía no está resuelto. */
  private defaultVarietyIdFor(pokemonId: string): string {
    return this.pokedexDetailsReader.detailsFor(pokemonId)?.defaultVarietyId ?? pokemonId;
  }

  private updateSlot(slotIndex: number, updater: (slot: RosterEntry) => RosterEntry): void {
    const slots = this.slotsSignal();
    const current = slots[slotIndex];
    if (!current) {
      return;
    }
    const next = [...slots];
    next[slotIndex] = updater(current);
    this.slotsSignal.set(next);
  }
}
