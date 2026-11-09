import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoModule } from '@jsverse/transloco';

import type { Move } from '../../pokemon/domain/value-objects/move';
import type { PokedexEntry } from '../../pokemon/domain/entities/pokedex-entry';
import { resolveDisplayGender, type Gender } from '../../pokemon/domain/value-objects/gender';
import { InMemoryTeamService } from '../infrastructure/in-memory-team.service';
import { GAME_SELECTION_READER } from '../../shared/tokens/game-selection-reader.token';
import { POKEDEX_DETAILS_READER } from '../../shared/tokens/pokedex-details-reader.token';
import { TeamBuilderTwoPaneLayoutComponent } from './team-builder-two-pane-layout.component';
import { TeamSlotComponent } from './team-slot.component';
import { PokemonDetailModalComponent } from './pokemon-detail-modal.component';
import { MoveSelectionSheetComponent } from './move-selection-sheet.component';
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
    </div>

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
            (shinyChange)="onShinyChange($event)"
            (genderChange)="onGenderChange($event)"
            (close)="onModalClose()"
          />
          <div class="app-moves-btn-container">
            <button mat-stroked-button type="button" (click)="onOpenMoves()">
              <mat-icon>sports_kabaddi</mat-icon>
              {{ 'team.moveSelectionTitle' | transloco }}
            </button>
          </div>
          @if (showMoveSheet() && activeRosterEntry(); as rosterEntry) {
            <app-move-selection-sheet
              [moveIds]="rosterEntry.moveIds"
              [movepool]="teamService.movepoolBySlot().get(activeSlotIndex()!) ?? []"
              [activePosition]="activeMovePosition()"
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
    .app-moves-btn-container {
      display: flex;
      justify-content: center;
      padding: 0.5rem 1rem 1rem;
    }
  `,
})
export class TeamBuilderPage {
  protected readonly teamService = inject(InMemoryTeamService);
  private readonly gameSelectionReader = inject(GAME_SELECTION_READER);
  private readonly pokedexDetailsReader = inject(POKEDEX_DETAILS_READER);
  private readonly router = inject(Router);

  protected readonly occupiedCount = computed(() => this.teamService.slots().filter((s) => s !== null).length);

  /** FR-005: vuelve al paso anterior del flujo de onboarding. */
  goBack(): void {
    void this.router.navigateByUrl('/juego');
  }

  protected readonly activeSlotIndex = signal<number | null>(null);
  protected readonly showMoveSheet = signal(false);
  protected readonly activeMovePosition = signal<0 | 1 | 2 | 3>(0);

  /** FR-014 (`018`): nombre del juego activo, vía el puerto cruzado
   *  `GameSelectionReader` (nunca `game/infrastructure` directo —
   *  Constitución Principio VI). */
  protected activeGameName(): string | null {
    return this.gameSelectionReader.currentGame()?.displayName ?? null;
  }

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

  protected detailsFor(pokemonId: string): PokedexEntry | null {
    return this.pokedexDetailsReader.detailsFor(pokemonId);
  }

  onSlotSelect(index: number): void {
    if (!this.teamService.slots()[index]) {
      return;
    }
    this.activeSlotIndex.set(index);
    this.showMoveSheet.set(false);
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

  onModalClose(): void {
    this.activeSlotIndex.set(null);
  }

  onOpenMoves(): void {
    const index = this.activeSlotIndex();
    if (index === null) {
      return;
    }
    this.showMoveSheet.set(true);
    void this.teamService.loadMovepool(index);
  }

  onSelectMove(event: { position: 0 | 1 | 2 | 3; move: Move | null }): void {
    const index = this.activeSlotIndex();
    if (index !== null) {
      this.teamService.selectMove(index, event.position, event.move);
    }
  }
}
