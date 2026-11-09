import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoModule } from '@jsverse/transloco';

import type { Generation } from '../../game/domain/value-objects/generation';
import type { Move } from '../../pokemon/domain/value-objects/move';
import type { PokedexEntry } from '../../pokemon/domain/entities/pokedex-entry';
import type { PokemonType } from '../../pokemon/domain/value-objects/pokemon-type';
import type { SelectableForm } from '../../pokemon/domain/value-objects/selectable-form';
import { resolveDisplayGender, type Gender } from '../../pokemon/domain/value-objects/gender';
import {
  availableSelectableForms,
  resolveActiveForm,
  resolveDisplayFormVarietyId,
  resolveFormSpriteUrl,
} from '../../pokemon/domain/value-objects/active-form';
import {
  averageCoverageCoefficient,
  computeDefensiveCoverageRows,
  type DefensiveCoverageRow,
} from '../../pokemon/domain/value-objects/defensive-coverage';
import { attackTypesForGeneration } from '../../pokemon/domain/value-objects/type-effectiveness';
import { InMemoryTeamService } from '../infrastructure/in-memory-team.service';
import { GAME_SELECTION_READER } from '../../shared/tokens/game-selection-reader.token';
import { POKEDEX_DETAILS_READER } from '../../shared/tokens/pokedex-details-reader.token';
import { TeamBuilderTwoPaneLayoutComponent } from './team-builder-two-pane-layout.component';
import { TeamSlotComponent } from './team-slot.component';
import { PokemonDetailModalComponent } from './pokemon-detail-modal.component';
import { MoveSelectionSheetComponent } from './move-selection-sheet.component';
import { TeamCoverageModalComponent } from './team-coverage-modal.component';
import type { TeamCoverageRow, TeamCoverageTotals } from './team-coverage.types';
import { PokedexBrowserComponent } from '../../pokedex/presentation/pokedex-browser.component';

/**
 * User Story 2 (spec.md): construir un equipo de hasta 6 Pokémon —
 * Pokédex filtrable + slots del equipo, con movimientos por slot.
 * Entry-point adapter delgado: compone `TeamStore` (propio) y
 * `PokedexBrowserComponent` (composición de `pokedex`, importada como
 * presentación — nunca su infraestructura directamente, Constitución
 * Principio VI) dentro del layout de dos paneles.
 *
 * `018`: hacer click en un slot ocupado abre `PokemonDetailModalComponent`
 * (FR-019-FR-022a) — nombre/tipos/imagen + toggle shiny.
 *
 * `019`: el selector de forma/variante (`FormSelectionModalComponent`) se
 * saca de acá a propósito — se va a re-implementar de a poco dentro de la
 * tarjeta de detalle en vez de como un botón/modal aparte debajo del
 * equipo. El componente en sí no se borra (se reutilizará), solo deja de
 * estar cableado desde esta página por ahora.
 */
@Component({
  selector: 'app-team-builder-page',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    TranslocoModule,
    TeamBuilderTwoPaneLayoutComponent,
    TeamSlotComponent,
    PokemonDetailModalComponent,
    MoveSelectionSheetComponent,
    TeamCoverageModalComponent,
    PokedexBrowserComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-page-header">
      <button
        data-testid="back-button"
        mat-icon-button
        type="button"
        class="app-back-btn"
        [attr.aria-label]="'common.back' | transloco"
        (click)="goBack()"
      >
        <mat-icon>arrow_back</mat-icon>
      </button>
      <h1 class="app-brand-title">
        {{ 'team.title' | transloco }}
        @if (activeGameName(); as gameName) {
          <span class="app-game-badge">— {{ gameName }}</span>
        }
      </h1>
      <div class="app-team-counter-badge">
        <mat-icon>catching_pokemon</mat-icon>
        <span>{{ occupiedCount() }} / 6</span>
      </div>
      <button
        data-testid="team-coverage-button"
        mat-stroked-button
        type="button"
        [disabled]="occupiedCount() === 0"
        (click)="showCoverageModal.set(true)"
      >
        <mat-icon>query_stats</mat-icon>
        {{ 'team.teamCoverageButtonLabel' | transloco }}
      </button>
    </div>

    @if (showCoverageModal()) {
      <app-team-coverage-modal
        [rows]="teamCoverageRows()"
        [types]="teamCoverageTypes()"
        [totals]="teamCoverageTotals()"
        [generationUnavailable]="teamCoverageGenerationUnavailable()"
        (close)="showCoverageModal.set(false)"
      />
    }

    <app-team-builder-two-pane-layout>
      <div slot="team" class="app-team-panel">
        @if (teamService.rejection() === 'team-full') {
          <p role="alert" class="app-team-alert">{{ 'team.teamFull' | transloco }}</p>
        }

        <div class="app-team-slots">
          @for (slot of teamService.slots(); track $index) {
            <app-team-slot
              [entry]="slot"
              [pokedexEntry]="slot ? detailsFor(slot.pokemonId) : null"
              [active]="$index === activeSlotIndex()"
              [coverageIndex]="slot ? coverageIndexFor($index) : null"
              [teamCoverageIndexValues]="occupiedCoverageIndexValues()"
              (select)="onSlotSelect($index)"
              (remove)="teamService.removePokemonFromTeam($index)"
            />
          }
        </div>

        @if (activeEntry(); as entry) {
          <app-pokemon-detail-modal
            [pokedexEntry]="entry"
            [isShiny]="activeRosterEntry()?.isShiny ?? false"
            [gender]="activeGender()"
            [availableForms]="availableForms()"
            [formVarietyId]="activeFormVarietyId()"
            [resolvedMoveSlots]="resolvedMoveSlots()"
            [generation]="activeGeneration()"
            (shinyChange)="onShinyChange($event)"
            (genderChange)="onGenderChange($event)"
            (formVarietyIdChange)="onFormVarietyIdChange($event)"
            (moveSlotActivate)="onOpenMoveSlot($event)"
            (close)="onModalClose()"
          />
          @if (showMoveSheet() && activeRosterEntry(); as rosterEntry) {
            <app-move-selection-sheet
              [moveIds]="rosterEntry.moveIds"
              [movepool]="activeMovepool()"
              [activePosition]="activeMovePosition()"
              [pokemonName]="activeEntry()?.displayName ?? null"
              (selectMove)="onSelectMove($event)"
              (close)="showMoveSheet.set(false)"
            />
          }
        }
      </div>

      <div slot="pokedex">
        <app-pokedex-browser (add)="teamService.addPokemonToTeam($event)" />
      </div>
    </app-team-builder-two-pane-layout>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100vh;
      box-sizing: border-box;
      background: var(--mat-sys-surface, #f8f9fa);
    }
    .app-page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1.25rem;
      gap: 0.5rem;
      flex: 0 0 auto;
      border-bottom: 1px solid var(--mat-sys-outline-variant, rgba(0, 0, 0, 0.08));
      background: var(--mat-sys-surface, #fff);
    }
    .app-brand-title {
      font-size: 1.35rem;
      padding: 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .app-game-badge {
      font-size: 1rem;
      font-weight: 600;
      opacity: 0.8;
      /* El título de marca global (.app-brand-title, styles.scss) pinta su
         texto con un gradiente vía -webkit-text-fill-color: transparent —
         esa propiedad se hereda, así que sin esto el nombre del juego
         quedaba invisible (mismo color que el fondo) al no tener el
         gradiente propio que lo hace visible en el título. */
      -webkit-text-fill-color: var(--mat-sys-on-surface, #1d1a22);
      color: var(--mat-sys-on-surface, #1d1a22);
    }
    .app-team-counter-badge {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.35rem 0.85rem;
      border-radius: 999px;
      background: var(--mat-sys-primary-container, #eaddff);
      color: var(--mat-sys-on-primary-container, #21005d);
      font-weight: 800;
      font-size: 0.85rem;
    }
    .app-team-counter-badge mat-icon {
      font-size: 1.1rem;
      width: 1.1rem;
      height: 1.1rem;
    }
    app-team-builder-two-pane-layout {
      flex: 1 1 0%;
      min-height: 0;
      display: block;
    }
    .app-team-panel {
      display: flex;
      flex-direction: column;
      height: 100%;
      box-sizing: border-box;
    }
    .app-team-alert {
      margin: 0.5rem 1rem 0;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      background: var(--mat-sys-error-container, #ffdad6);
      color: var(--mat-sys-on-error-container, #410002);
      font-weight: 700;
      font-size: 0.85rem;
      text-align: center;
    }
    .app-team-slots {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      grid-template-rows: repeat(2, 1fr);
      gap: 0.85rem;
      /* Sin padding-top: la fila de arriba quedaba muy separada de la
         cabecera (bug reportado: "los slots de arriba están muy abajo,
         elimina el padding/margen de esa zona"). El resto de los bordes
         conserva el margen respecto a la pantalla. */
      padding: 0 1.25rem 1.25rem;
      flex: 1 1 0%;
      min-height: 0;
    }
  `,
})
export class TeamBuilderPage {
  protected readonly teamService = inject(InMemoryTeamService);
  private readonly gameSelectionReader = inject(GAME_SELECTION_READER);
  private readonly pokedexDetailsReader = inject(POKEDEX_DETAILS_READER);
  private readonly router = inject(Router);

  protected readonly occupiedCount = computed(() => this.teamService.slots().filter((s) => s !== null).length);

  /** `026` (Foundational, T006, research.md Decisión 4): última "variedad
   *  efectiva" (`pokemonId::formVarietyId`) por la que ya se pidió el
   *  movepool de cada slot — bookkeeping local, no reactivo, del `effect`
   *  de abajo. Evita refetches redundantes ante cambios que no alteran la
   *  variedad (elegir un movimiento, género, shiny, tera tipo). */
  private readonly loadedMovepoolVarietyBySlot = new Map<number, string>();

  constructor() {
    // `026` (Foundational, T006): antes de esta feature, el movepool de un
    // slot solo se cargaba al seleccionarlo/abrirlo (`onSlotSelect`,
    // `onOpenMoveSlot`) — insuficiente para calcular el índice de
    // cobertura de TODOS los slots ocupados simultáneamente (US1). Este
    // efecto generaliza esa carga a cualquier slot ocupado, disparándose
    // solo cuando su variedad efectiva cambia (Pokémon agregado/quitado/
    // reemplazado, o forma cambiada), no ante cualquier otro campo.
    effect(() => {
      const slots = this.teamService.slots();
      slots.forEach((slot, index) => {
        if (!slot) {
          this.loadedMovepoolVarietyBySlot.delete(index);
          return;
        }
        const varietyKey = `${slot.pokemonId}::${slot.formVarietyId ?? ''}`;
        if (this.loadedMovepoolVarietyBySlot.get(index) !== varietyKey) {
          this.loadedMovepoolVarietyBySlot.set(index, varietyKey);
          void this.teamService.loadMovepool(index);
        }
      });
    });
  }

  /** FR-005: vuelve al paso anterior del flujo de onboarding. */
  goBack(): void {
    void this.router.navigateByUrl('/juego');
  }

  protected readonly activeSlotIndex = signal<number | null>(null);
  protected readonly showMoveSheet = signal(false);
  protected readonly activeMovePosition = signal<0 | 1 | 2 | 3>(0);

  /** `027` (US1): estado de apertura del modal de Análisis de Cobertura
   *  del equipo — `false` por defecto; el botón del header lo pasa a
   *  `true` (solo si `occupiedCount() > 0`, FR-003), y `(close)` del
   *  modal lo vuelve a `false` (FR-010). */
  protected readonly showCoverageModal = signal(false);

  /** FR-014 (`018`): nombre del juego activo, vía el puerto cruzado
   *  `GameSelectionReader` (nunca `game/infrastructure` directo —
   *  Constitución Principio VI). */
  protected activeGameName(): string | null {
    return this.gameSelectionReader.currentGame()?.displayName ?? null;
  }

  /** FR-002 (`023`): la generación del juego activo, para la sección de
   *  Análisis de Cobertura de la tarjeta de detalle — mismo puerto
   *  `GameSelectionReader` ya inyectado, `null` si todavía no hay juego
   *  seleccionado. */
  protected readonly activeGeneration = computed<Generation | null>(() => this.gameSelectionReader.currentGame()?.generation ?? null);

  protected readonly activeRosterEntry = computed(() => {
    const index = this.activeSlotIndex();
    return index === null ? null : this.teamService.slots()[index];
  });

  protected readonly activeEntry = computed<PokedexEntry | null>(() => {
    const roster = this.activeRosterEntry();
    return roster ? this.pokedexDetailsReader.detailsFor(roster.pokemonId) : null;
  });

  /** FR-003/FR-013 (`019`): el género a mostrar — el ya guardado en el
   *  `RosterEntry`, o macho por defecto si la especie es de género dual
   *  y todavía no se eligió ninguno (`resolveDisplayGender`). */
  protected readonly activeGender = computed<Gender>(() =>
    resolveDisplayGender(this.activeEntry()?.genderRate ?? -1, this.activeRosterEntry()?.gender ?? null),
  );

  /** FR-001/FR-006/FR-007 (`020`): las formas alternativas seleccionables
   *  ahora para el Pokémon activo — ya filtradas por juego (garantizado
   *  al construir `entry.selectableForms` en infraestructura) y por DLC
   *  activo (`availableSelectableForms`, sobre `currentActiveDlcIds()`
   *  del mismo puerto `GameSelectionReader` ya inyectado). */
  protected readonly availableForms = computed<readonly SelectableForm[]>(() => {
    const entry = this.activeEntry();
    return entry ? availableSelectableForms(entry, this.gameSelectionReader.currentActiveDlcIds()) : [];
  });

  /** FR-004/FR-011 (`020`): la forma a mostrar — la ya guardada en el
   *  `RosterEntry` si sigue disponible, o la forma base en caso
   *  contrario (`resolveDisplayFormVarietyId`), mismo patrón que
   *  `activeGender`. */
  protected readonly activeFormVarietyId = computed<string | null>(() =>
    resolveDisplayFormVarietyId(this.availableForms(), this.activeRosterEntry()?.formVarietyId ?? null),
  );

  protected detailsFor(pokemonId: string): PokedexEntry | null {
    return this.pokedexDetailsReader.detailsFor(pokemonId);
  }

  onSlotSelect(index: number): void {
    if (!this.teamService.slots()[index]) {
      return;
    }
    this.activeSlotIndex.set(index);
    this.showMoveSheet.set(false);
    // FR-002: los 4 slots de movimiento de la tarjeta deben mostrar sus
    // datos completos sin abrir el selector — el movepool se resuelve al
    // activar el slot, no recién al tocar un movimiento (`018` ya hacía
    // esto solo al tocar "Elegir movimientos"; `021` lo adelanta acá).
    void this.teamService.loadMovepool(index);
  }

  /** FR-021/FR-022 (`018`): delega en `TeamStore.toggleShiny` — el estado
   *  persiste en el `RosterEntry`, no en este componente. */
  onShinyChange(active: boolean): void {
    const index = this.activeSlotIndex();
    if (index !== null) {
      this.teamService.toggleShiny(index, active);
    }
  }

  /** FR-007 (`019`): delega en `TeamStore.toggleGender` — el estado
   *  persiste en el `RosterEntry`, no en este componente. Solo se emite
   *  desde el toggle de género dual del modal. */
  onGenderChange(gender: Gender): void {
    const index = this.activeSlotIndex();
    if (index !== null) {
      this.teamService.toggleGender(index, gender);
    }
  }

  /** FR-005 (`020`): delega en `TeamStore.selectForm`/`selectBaseForm`
   *  según corresponda — el chip de forma base del toggle emite `null`
   *  (sin `SelectableForm` que pasarle a `selectForm`). */
  onFormVarietyIdChange(formVarietyId: string | null): void {
    const index = this.activeSlotIndex();
    if (index === null) {
      return;
    }
    if (formVarietyId === null) {
      this.teamService.selectBaseForm(index);
      return;
    }
    const form = this.availableForms().find((f) => f.varietyId === formVarietyId);
    if (form) {
      this.teamService.selectForm(index, form);
    }
  }

  onModalClose(): void {
    this.activeSlotIndex.set(null);
  }

  /** FR-004: tocar cualquier slot de movimiento (vacío u ocupado) abre el
   *  selector para esa posición concreta. */
  onOpenMoveSlot(position: number): void {
    const index = this.activeSlotIndex();
    if (index === null || (position !== 0 && position !== 1 && position !== 2 && position !== 3)) {
      return;
    }
    this.activeMovePosition.set(position);
    this.showMoveSheet.set(true);
    void this.teamService.loadMovepool(index);
  }

  protected readonly activeMovepool = computed(() => {
    const index = this.activeSlotIndex();
    return index === null ? [] : (this.teamService.movepoolBySlot().get(index) ?? []);
  });

  /** FR-002: los 4 `Move` completos (tipo/potencia/PP/descripción) que
   *  `app-pokemon-detail-modal` renderiza dentro de la tarjeta — resueltos
   *  a partir del movepool ya cargado de la variedad activa; `null` para
   *  un slot vacío o cuyo id el movepool todavía no resolvió (p. ej.
   *  mientras `loadMovepool` está en vuelo). */
  protected readonly resolvedMoveSlots = computed<readonly (Move | null)[]>(() => {
    const rosterEntry = this.activeRosterEntry();
    if (!rosterEntry) {
      return [null, null, null, null];
    }
    const movepool = this.activeMovepool();
    return rosterEntry.moveIds.map((moveId) => (moveId === null ? null : (movepool.find((info) => info.move.id === moveId)?.move ?? null)));
  });

  /** `026` (US1): generaliza {@link resolvedMoveSlots} a un índice
   *  arbitrario (no solo el slot activo) — necesario para calcular el
   *  índice de cobertura de TODOS los slots ocupados simultáneamente, no
   *  solo el que tiene la tarjeta abierta. Mismo criterio: `null` para un
   *  slot vacío o un `moveId` que el movepool ya cargado de ese slot
   *  todavía no resuelve (contract §3). */
  protected resolvedMoveSlotsFor(slotIndex: number): readonly (Move | null)[] {
    const rosterEntry = this.teamService.slots()[slotIndex];
    if (!rosterEntry) {
      return [null, null, null, null];
    }
    const movepool = this.teamService.movepoolBySlot().get(slotIndex) ?? [];
    return rosterEntry.moveIds.map((moveId) => (moveId === null ? null : (movepool.find((info) => info.move.id === moveId)?.move ?? null)));
  }

  /** `026` (US1, research.md Decisión 1/3): el "Índice sintético de
   *  cobertura global" de un slot arbitrario — el mismo valor que
   *  `CoverageAnalysisTableComponent.totalCoverageCoefficient` calcula
   *  para ese Pokémon dentro de su tarjeta de detalle, resuelto acá para
   *  poder mostrarlo también en el slot sin abrirla. `null` cuando el
   *  slot está vacío, no hay generación activa, o `computeDefensiveCoverageRows`
   *  no reconoce la era de tipos de la generación activa (FR-012 de `023`).
   *  Método no memoizado (mismo criterio que {@link detailsFor}) — se
   *  recalcula en cada evaluación del template, aceptable dado el volumen
   *  (≤6 slots × ≤18 filas de tipo). */
  protected coverageIndexFor(slotIndex: number): number | null {
    const rows = this.coverageRowsFor(slotIndex);
    return rows === null ? null : averageCoverageCoefficient(rows);
  }

  /** `027` (research.md Decisión 2): extracción del bloque de resolución
   *  forma activa/tipos/stats/`computeDefensiveCoverageRows` que antes
   *  vivía inline en {@link coverageIndexFor} — reutilizado ahora también
   *  por `teamCoverageRows` (`027`, US2), que necesita las filas
   *  completas de cada Pokémon del equipo, no solo su promedio. `null` en
   *  los mismos casos que antes: slot vacío, sin generación activa, sin
   *  detalle resuelto, o `computeDefensiveCoverageRows` sin era de tipos
   *  reconocida para la generación activa (FR-012 de `023`). */
  protected coverageRowsFor(slotIndex: number): readonly DefensiveCoverageRow[] | null {
    const slot = this.teamService.slots()[slotIndex];
    const generation = this.activeGeneration();
    if (!slot || !generation) {
      return null;
    }
    const details = this.detailsFor(slot.pokemonId);
    if (!details) {
      return null;
    }
    const available = availableSelectableForms(details, this.gameSelectionReader.currentActiveDlcIds());
    const formVarietyId = resolveDisplayFormVarietyId(available, slot.formVarietyId);
    const form = resolveActiveForm(details, formVarietyId);
    const pokemonTypes = form.typeSecondary ? ([form.typePrimary, form.typeSecondary] as const) : ([form.typePrimary] as const);

    return computeDefensiveCoverageRows(pokemonTypes, form.baseStats, generation, this.resolvedMoveSlotsFor(slotIndex));
  }

  /** `026` (US3, contrato §3/§5): el `teamCoverageIndexValues` común que
   *  se pasa a TODAS las instancias de `app-team-slot` en el template — un
   *  valor por cada slot ocupado con índice calculable, ninguno por los
   *  vacíos ni por los no calculables. Garantiza que el índice de un slot
   *  siempre está incluido en el array que ese mismo slot recibe (mismo
   *  `coverageIndexFor`), para que su aura se compare contra un conjunto
   *  que sí lo incluye a él mismo (contrato §2). */
  protected readonly occupiedCoverageIndexValues = computed<readonly number[]>(() =>
    this.teamService
      .slots()
      .map((slot, i) => (slot ? this.coverageIndexFor(i) : null))
      .filter((value): value is number => value !== null),
  );

  /** `027` (US2, contrato §2): las columnas de tipo de la tabla del modal
   *  de equipo — mismo orden canónico y misma disponibilidad por
   *  generación que ya usa `computeDefensiveCoverageRows` internamente
   *  (`attackTypesForGeneration`). `[]` sin generación activa o sin era
   *  de tipos reconocida (en ese caso `teamCoverageGenerationUnavailable`
   *  es `true` y el modal muestra el mensaje de "no disponible" en vez de
   *  una tabla con 0 columnas). */
  protected readonly teamCoverageTypes = computed<readonly PokemonType[]>(() => {
    const generation = this.activeGeneration();
    return generation ? (attackTypesForGeneration(generation) ?? []) : [];
  });

  /** `027` (US2, contrato §2): una `TeamCoverageRow` por slot ocupado del
   *  equipo — imagen/tipos resueltos con el mismo criterio que
   *  `TeamSlotComponent`/`PokemonDetailModalComponent` (`resolveFormSpriteUrl`,
   *  `resolveDisplayGender`), y sus 3 coeficientes por tipo extraídos de
   *  `coverageRowsFor(i)` (mismas filas que ya usa `coverageIndexFor`).
   *  `computed()` reactivo sobre las mismas signals de las que depende
   *  `occupiedCoverageIndexValues` — satisface FR-009/SC-003 sin ninguna
   *  suscripción manual nueva. */
  protected readonly teamCoverageRows = computed<readonly TeamCoverageRow[]>(() => {
    const activeDlcIds = this.gameSelectionReader.currentActiveDlcIds();
    return this.teamService
      .slots()
      .map((slot, slotIndex): TeamCoverageRow | null => {
        if (!slot) {
          return null;
        }
        const rows = this.coverageRowsFor(slotIndex);
        if (rows === null) {
          return null;
        }
        const details = this.detailsFor(slot.pokemonId);
        if (!details) {
          return null;
        }
        const available = availableSelectableForms(details, activeDlcIds);
        const formVarietyId = resolveDisplayFormVarietyId(available, slot.formVarietyId);
        const form = resolveActiveForm(details, formVarietyId);
        const female = resolveDisplayGender(details.genderRate, slot.gender) === 'female';
        const coverageByType = new Map(
          rows.map((row) => [
            row.type.id,
            { defense: row.defenseCoefficient, attack: row.averageAttackCoefficient, coverage: row.coverageCoefficient },
          ]),
        );
        return {
          slotIndex,
          spriteUrl: resolveFormSpriteUrl(form, female, slot.isShiny),
          displayName: details.displayName,
          types: form.typeSecondary ? [form.typePrimary, form.typeSecondary] : [form.typePrimary],
          coverageByType,
        };
      })
      .filter((row): row is TeamCoverageRow => row !== null);
  });

  /** `027` (US2, FR-012): `true` cuando algún Pokémon ocupado del equipo
   *  no pudo resolver sus filas de cobertura porque la generación activa
   *  no tiene una era de tipos reconocida (`coverageRowsFor` devuelve
   *  `null`) — el modal muestra entonces el mismo mensaje de "no
   *  disponible" que ya usa la tabla individual, en vez de una tabla
   *  vacía o parcial. */
  protected readonly teamCoverageGenerationUnavailable = computed<boolean>(() =>
    this.teamService.slots().some((slot, i) => slot !== null && this.coverageRowsFor(i) === null),
  );

  /** `027` (US3, FR-007/FR-008): la fila final del equipo — media
   *  aritmética simple, por tipo, de `defense`/`attack`/`coverage` entre
   *  las `teamCoverageRows()` — dividiendo entre la cantidad real de
   *  Pokémon ocupados (nunca un `6` fijo). `null` sin ningún Pokémon
   *  ocupado (en la práctica el modal no llega a abrirse en ese estado,
   *  FR-003). */
  protected readonly teamCoverageTotals = computed<TeamCoverageTotals | null>(() => {
    const rows = this.teamCoverageRows();
    if (rows.length === 0) {
      return null;
    }
    const totalsByType = new Map(
      this.teamCoverageTypes().map((type) => {
        const cells = rows.map((row) => row.coverageByType.get(type.id)).filter((cell): cell is NonNullable<typeof cell> => cell !== undefined);
        const average = (values: readonly number[]) => values.reduce((sum, v) => sum + v, 0) / values.length;
        return [
          type.id,
          {
            defense: average(cells.map((c) => c.defense)),
            // `c.attack` es `null` cuando ese Pokémon no tiene movimientos
            // ofensivos aplicables contra este tipo — se sustituye por
            // `defense / 2`, el mismo valor de reserva que `025` ya usa para
            // `coverageCoefficient` en ese caso, para que la fila final del
            // equipo (FR-007) siempre tenga un promedio numérico de ataque,
            // consistente con el resto de la tabla (nunca "no aplica").
            attack: average(cells.map((c) => c.attack ?? c.defense / 2)),
            coverage: average(cells.map((c) => c.coverage)),
          },
        ] as const;
      }),
    );
    return { totalsByType };
  });

  /** Elegir un movimiento cierra el selector — así la persona ve de
   *  inmediato el cambio reflejado en el slot de la tarjeta, en vez de
   *  quedar mirando la lista tras haber elegido. */
  onSelectMove(event: { position: 0 | 1 | 2 | 3; move: Move | null }): void {
    const index = this.activeSlotIndex();
    if (index !== null) {
      this.teamService.selectMove(index, event.position, event.move);
    }
    this.showMoveSheet.set(false);
  }
}
