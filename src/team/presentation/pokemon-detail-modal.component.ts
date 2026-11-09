import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule, MatButtonToggleChange } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TranslocoModule } from '@jsverse/transloco';

import type { Generation } from '../../game/domain/value-objects/generation';
import type { PokedexEntry } from '../../pokemon/domain/entities/pokedex-entry';
import { genderCapability, type Gender } from '../../pokemon/domain/value-objects/gender';
import { resolveActiveForm, resolveFormSpriteUrl } from '../../pokemon/domain/value-objects/active-form';
import type { SelectableForm } from '../../pokemon/domain/value-objects/selectable-form';
import type { Move } from '../../pokemon/domain/value-objects/move';
import type { PokemonType } from '../../pokemon/domain/value-objects/pokemon-type';
import { statBarColor, statBarPercent } from '../../pokemon/domain/value-objects/stat-bar-presentation';
import { TypeBadgeComponent } from '../../shared/design-system/type-badge.component';
import { CoverageAnalysisTableComponent } from './coverage-analysis-table.component';
import { MoveSlotComponent } from './move-slot.component';

/**
 * Tarjeta modal de detalle de un Pokémon del equipo (FR-019-FR-022a,
 * `018`; selector de género FR-001-FR-014, `019`; selector de forma
 * FR-001-FR-013, `020`): nombre, tipos, imagen, un toggle shiny, un
 * selector/indicador de género y un selector de forma con sprites.
 * Puramente presentacional — el estado `isShiny`/`gender`/`formVarietyId`
 * persiste en el `RosterEntry`
 * (`TeamStore.toggleShiny`/`toggleGender`/`selectForm`/`selectBaseForm`),
 * no acá (Constitución Principio VI); este componente solo refleja el
 * valor que recibe y reenvía el cambio.
 */
@Component({
  selector: 'app-pokemon-detail-modal',
  standalone: true,
  imports: [
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatSlideToggleModule,
    TranslocoModule,
    TypeBadgeComponent,
    MoveSlotComponent,
    CoverageAnalysisTableComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-modal-overlay">
      <div
        class="app-modal-card app-detail-modal"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="pokedexEntry().displayName"
      >
        <header class="app-detail-modal__header">
          <div class="app-detail-modal__title-group">
            <span class="app-detail-modal__number">#{{ pokedexEntry().pokedexNumber }}</span>
            <h2>{{ pokedexEntry().displayName }}</h2>
          </div>
          <button
            class="app-detail-modal__close"
            mat-icon-button
            type="button"
            [attr.aria-label]="'common.close' | transloco"
            (click)="close.emit()"
          >
            <mat-icon>close</mat-icon>
          </button>
        </header>

        <div class="app-detail-modal__sprite-container">
          @if (spriteUrl(); as sprite) {
            <img class="app-detail-modal__sprite" [src]="sprite" [alt]="pokedexEntry().displayName" width="192" height="192" />
          }
        </div>

        <div class="app-detail-modal__types">
          <app-type-badge [typeId]="activeForm().typePrimary.id" [label]="activeForm().typePrimary.label" />
          @if (activeForm().typeSecondary; as secondary) {
            <app-type-badge [typeId]="secondary.id" [label]="secondary.label" />
          }
        </div>

        <div class="app-detail-modal__attributes-row">
          <div class="app-detail-modal__attribute-col">
            <span class="app-detail-modal__attribute-label">{{ 'team.genderSectionLabel' | transloco }}</span>
            @if (genderCapabilityValue() === 'dual') {
              <mat-button-toggle-group
                class="app-detail-modal__gender-toggle"
                appearance="standard"
                hideSingleSelectionIndicator
                [value]="gender()"
                [attr.aria-label]="'team.genderToggle' | transloco"
                (change)="onGenderToggleChange($event)"
              >
                <mat-button-toggle value="male" [attr.aria-label]="'team.genderMale' | transloco">
                  ♂ {{ 'team.genderMale' | transloco }}
                </mat-button-toggle>
                <mat-button-toggle value="female" [attr.aria-label]="'team.genderFemale' | transloco">
                  {{ 'team.genderFemale' | transloco }}
                </mat-button-toggle>
              </mat-button-toggle-group>
            } @else {
              <span class="app-detail-modal__gender-fixed" [attr.aria-label]="fixedGenderLabel() | transloco">{{ fixedGenderIndicator() }}</span>
            }
          </div>

          <div class="app-detail-modal__attribute-col">
            <span class="app-detail-modal__attribute-label">{{ 'team.shinySectionLabel' | transloco }}</span>
            <mat-slide-toggle
              class="app-detail-modal__shiny-toggle"
              labelPosition="before"
              [checked]="isShiny()"
              (change)="shinyChange.emit($event.checked)"
            >
              ✦ {{ 'team.shinyToggle' | transloco }}
            </mat-slide-toggle>
          </div>
        </div>

        @if (availableForms().length > 0) {
          <div class="app-detail-modal__form-row">
            <span class="app-detail-modal__attribute-label">{{ 'team.formSectionLabel' | transloco }}</span>
            <div class="app-detail-modal__form-toggle" role="group" [attr.aria-label]="'team.formToggle' | transloco">
              <button
                type="button"
                class="app-detail-modal__form-chip"
                [class.app-detail-modal__form-chip--active]="formVarietyId() === null"
                [attr.aria-pressed]="formVarietyId() === null"
                [attr.aria-label]="pokedexEntry().displayName"
                (click)="onFormChipClick(null)"
              >
                <img [src]="pokedexEntry().spriteUrl" [alt]="pokedexEntry().displayName" />
              </button>
              @for (form of availableForms(); track form.varietyId) {
                <div class="app-detail-modal__form-chip-wrapper">
                  <button
                    type="button"
                    class="app-detail-modal__form-chip"
                    [class.app-detail-modal__form-chip--active]="formVarietyId() === form.varietyId"
                    [attr.aria-pressed]="formVarietyId() === form.varietyId"
                    [attr.aria-label]="form.displayName"
                    (click)="onFormChipClick(form.varietyId)"
                  >
                    <img [src]="form.gameSpriteUrl" [alt]="form.displayName" />
                  </button>
                  @if (form.homeSpriteUrl === form.gameSpriteUrl) {
                    <!-- Sin ilustración HOME propia (research.md Decisión
                         11) — el sprite de juego puede no distinguirse a
                         simple vista de la forma base, así que se refuerza
                         con el nombre en texto (p. ej. "Partner Pikachu"). -->
                    <span class="app-detail-modal__form-chip-label">{{ form.displayName }}</span>
                  }
                </div>
              }
            </div>
          </div>
        }

        @if (activeForm().baseStats; as stats) {
          <div class="app-detail-modal__stats">
            <div class="app-stat-row">
              <span class="app-stat-label">HP</span>
              <span class="app-stat-value">{{ stats.hp }}</span>
              <div class="app-stat-bar-track">
                <div class="app-stat-bar-fill" [style.width.%]="calcStatPercent(stats.hp)" [style.background]="calcStatColor(stats.hp)"></div>
              </div>
            </div>
            <div class="app-stat-row">
              <span class="app-stat-label">ATK</span>
              <span class="app-stat-value">{{ stats.attack }}</span>
              <div class="app-stat-bar-track">
                <div class="app-stat-bar-fill" [style.width.%]="calcStatPercent(stats.attack)" [style.background]="calcStatColor(stats.attack)"></div>
              </div>
            </div>
            <div class="app-stat-row">
              <span class="app-stat-label">DEF</span>
              <span class="app-stat-value">{{ stats.defense }}</span>
              <div class="app-stat-bar-track">
                <div class="app-stat-bar-fill" [style.width.%]="calcStatPercent(stats.defense)" [style.background]="calcStatColor(stats.defense)"></div>
              </div>
            </div>
            <div class="app-stat-row">
              <span class="app-stat-label">SPA</span>
              <span class="app-stat-value">{{ stats.specialAttack }}</span>
              <div class="app-stat-bar-track">
                <div class="app-stat-bar-fill" [style.width.%]="calcStatPercent(stats.specialAttack)" [style.background]="calcStatColor(stats.specialAttack)"></div>
              </div>
            </div>
            <div class="app-stat-row">
              <span class="app-stat-label">SPD</span>
              <span class="app-stat-value">{{ stats.specialDefense }}</span>
              <div class="app-stat-bar-track">
                <div class="app-stat-bar-fill" [style.width.%]="calcStatPercent(stats.specialDefense)" [style.background]="calcStatColor(stats.specialDefense)"></div>
              </div>
            </div>
            <div class="app-stat-row">
              <span class="app-stat-label">SPE</span>
              <span class="app-stat-value">{{ stats.speed }}</span>
              <div class="app-stat-bar-track">
                <div class="app-stat-bar-fill" [style.width.%]="calcStatPercent(stats.speed)" [style.background]="calcStatColor(stats.speed)"></div>
              </div>
            </div>
          </div>
        }

        <div class="app-detail-modal__moves">
          <span class="app-detail-modal__attribute-label">{{ 'team.movesSectionLabel' | transloco }}</span>
          @for (move of resolvedMoveSlots(); track $index) {
            <app-move-slot [move]="move" [state]="move ? 'filled' : 'empty'" (activate)="moveSlotActivate.emit($index)" />
          }
        </div>

        <app-coverage-analysis-table
          [pokemonTypes]="coveragePokemonTypes()"
          [stats]="activeForm().baseStats"
          [generation]="generation()"
          [moveSlots]="resolvedMoveSlots()"
        />
      </div>
    </div>
  `,
  styles: `
    .app-detail-modal {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem 1.5rem;
      width: 100%;
      box-sizing: border-box;
      /* La tabla de Análisis de Cobertura (spec 024) agrega 5 columnas al
       * ancho fijo global de .app-modal-card (min(520px, 92vw), styles.scss)
       * y no entra cómoda — mismo criterio ya usado por
       * .app-move-selection-card para el selector de movimientos. */
      max-width: min(760px, 95vw);
    }
    .app-detail-modal__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
    }
    .app-detail-modal__title-group {
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
    }
    .app-detail-modal__title-group h2 {
      margin: 0;
      font-size: 1.35rem;
      font-weight: 800;
    }
    .app-detail-modal__number {
      font-size: 0.85rem;
      font-weight: 700;
      opacity: 0.6;
    }
    .app-detail-modal__sprite-container {
      display: flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle, rgba(103, 58, 183, 0.08) 0%, rgba(0, 0, 0, 0) 70%);
      border-radius: 50%;
      padding: 0.5rem;
    }
    .app-detail-modal__sprite {
      width: min(180px, 55vw);
      height: min(180px, 55vw);
      object-fit: contain;
      image-rendering: pixelated;
      filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.15));
      transition: transform 0.3s ease;
    }
    .app-detail-modal__sprite:hover {
      transform: scale(1.05);
    }
    .app-detail-modal__types {
      display: flex;
      gap: 0.5rem;
    }
    /* 019: dos columnas lado a lado ("GÉNERO" | "VARIOCOLOR"), cada una con
       una etiqueta pequeña en mayúsculas arriba de su control — igual que
       la tarjeta de detalle del juego original. */
    .app-detail-modal__attributes-row {
      display: flex;
      align-items: flex-start;
      justify-content: center;
      gap: 2rem;
      width: 100%;
    }
    .app-detail-modal__attribute-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.4rem;
    }
    .app-detail-modal__attribute-label {
      font-size: 0.7rem;
      font-weight: 800;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      opacity: 0.55;
    }
    .app-detail-modal__gender-fixed {
      padding: 0.3rem 0.9rem;
      border-radius: 999px;
      background: var(--mat-sys-surface-variant, #eef0f4);
      font-weight: 700;
    }
    /* Réplica del segmentado macho/hembra: track gris claro sin borde, la
       opción activa se eleva como una píldora blanca con texto/ícono en
       el color primario — el checkmark de selección única se oculta
       (hideSingleSelectionIndicator) porque el juego original no lo
       muestra. Estas variables son tokens M3 del propio
       mat-button-toggle-group; se heredan al hijo sin necesitar ng-deep
       (no hay Shadow DOM real, solo atributos de scoping). */
    .app-detail-modal__gender-toggle {
      --mat-standard-button-toggle-shape: 999px;
      --mat-standard-button-toggle-height: 34px;
      --mat-standard-button-toggle-background-color: var(--mat-sys-surface-variant, #eef0f4);
      --mat-standard-button-toggle-divider-color: transparent;
      --mat-standard-button-toggle-text-color: var(--mat-sys-on-surface-variant, #79747e);
      --mat-standard-button-toggle-selected-state-background-color: #fff;
      --mat-standard-button-toggle-selected-state-text-color: var(--mat-sys-primary, #5b3df6);
      border: none;
      border-radius: 999px;
      padding: 3px;
    }
    .app-detail-modal__gender-toggle .mat-button-toggle-label-content {
      font-weight: 700;
      font-size: 0.85rem;
      padding: 0 0.9rem;
    }
    .app-detail-modal__gender-toggle .mat-button-toggle-checked {
      border-radius: 999px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.18);
    }
    .app-detail-modal__shiny-toggle {
      font-size: 0.85rem;
      font-weight: 700;
      opacity: 0.85;
    }
    /* 020: fila propia de ancho completo (no una tercera columna en
       .app-detail-modal__attributes-row) porque, a diferencia de
       género (siempre 2 opciones), el número de chips varía (2 a 6+,
       p. ej. Rotom) y necesita poder wrappear sin romper el layout de
       dos columnas de género/shiny. */
    .app-detail-modal__form-row {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.4rem;
    }
    .app-detail-modal__form-toggle {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      align-items: flex-start;
      gap: 0.5rem;
    }
    /* Envuelve un chip con formas que no tienen ilustración HOME propia
       (research.md Decisión 11) — agrega su nombre en texto debajo del
       sprite, porque a ese tamaño puede no distinguirse a simple vista
       de la forma base (p. ej. el Pikachu inicial de Let's Go). */
    .app-detail-modal__form-chip-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.2rem;
      max-width: 64px;
    }
    .app-detail-modal__form-chip-label {
      font-size: 0.6rem;
      font-weight: 700;
      line-height: 1.1;
      text-align: center;
      opacity: 0.75;
    }
    .app-detail-modal__form-chip {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      padding: 2px;
      border: none;
      border-radius: 50%;
      background: var(--mat-sys-surface-variant, #eef0f4);
      cursor: pointer;
      transition: background-color 0.15s ease, box-shadow 0.15s ease;
    }
    .app-detail-modal__form-chip img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      image-rendering: pixelated;
    }
    .app-detail-modal__form-chip--active {
      background: #fff;
      box-shadow: 0 0 0 2px var(--mat-sys-primary, #5b3df6);
    }
    .app-detail-modal__stats {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      margin-top: 0.5rem;
      padding-top: 0.75rem;
      border-top: 1px solid var(--mat-sys-outline-variant, #e0e0e0);
    }
    .app-stat-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.75rem;
    }
    .app-stat-label {
      width: 32px;
      font-weight: 800;
      opacity: 0.7;
    }
    .app-stat-value {
      width: 28px;
      text-align: right;
      font-weight: 700;
    }
    .app-stat-bar-track {
      flex: 1;
      height: 8px;
      border-radius: 999px;
      background: var(--mat-sys-surface-variant, #e0e0e0);
      overflow: hidden;
    }
    .app-stat-bar-fill {
      height: 100%;
      border-radius: 999px;
      transition: width 0.4s ease-out, background-color 0.4s ease-out;
    }
    .app-detail-modal__moves {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.5rem;
      padding-top: 0.75rem;
      border-top: 1px solid var(--mat-sys-outline-variant, #e0e0e0);
    }
    .app-detail-modal__moves app-move-slot {
      width: 100%;
    }
  `,
})
export class PokemonDetailModalComponent {
  readonly pokedexEntry = input.required<PokedexEntry>();
  readonly isShiny = input(false);
  readonly shinyChange = output<boolean>();
  /** El género efectivo a mostrar — ya resuelto por `TeamBuilderPage` vía
   *  `resolveDisplayGender` (macho por defecto si aún no se guardó
   *  ninguno). Solo tiene un selector accionable cuando la especie es de
   *  género dual (FR-002); en los otros casos ({@link genderCapabilityValue})
   *  se ignora la interacción y se muestra un indicador fijo. */
  readonly gender = input<Gender>('male');
  /** Emitido solo desde el toggle de género dual (FR-007). */
  readonly genderChange = output<Gender>();
  /** La forma actualmente guardada, ya resuelta (`020`,
   *  `resolveDisplayFormVarietyId`) — `null` = forma base. Computado por
   *  `TeamBuilderPage`. */
  readonly formVarietyId = input<string | null>(null);
  /** Las formas alternativas seleccionables ahora (`020`, ya filtradas
   *  por juego/DLC) — vacío oculta la fila del toggle (FR-002).
   *  Computado por `TeamBuilderPage`. */
  readonly availableForms = input<readonly SelectableForm[]>([]);
  /** Emitido al tocar un chip del toggle de forma — `null` para el chip
   *  de forma base, el `varietyId` de la forma tocada en otro caso
   *  (FR-005). */
  readonly formVarietyIdChange = output<string | null>();
  readonly close = output<void>();

  /** Los 4 movimientos ya resueltos (o `null` para un slot vacío/aún sin
   *  resolver) del Pokémon activo — FR-001/FR-002/FR-003 (`021`).
   *  Computado por `TeamBuilderPage` a partir del movepool ya cargado;
   *  este componente no resuelve movimientos por sí mismo. */
  readonly resolvedMoveSlots = input<readonly (Move | null)[]>([null, null, null, null]);
  /** Emitido con la posición (0-3) tocada — FR-004. */
  readonly moveSlotActivate = output<number>();
  /** La generación del juego actualmente seleccionado (spec `023`, FR-002) —
   *  computada por `TeamBuilderPage` vía `GameSelectionReader`; `null` si
   *  todavía no hay un juego seleccionado. Alimenta exclusivamente la
   *  sección de Análisis de Cobertura. */
  readonly generation = input<Generation | null>(null);

  protected readonly genderCapabilityValue = computed(() => genderCapability(this.pokedexEntry().genderRate));

  protected readonly fixedGenderIndicator = computed(() => {
    switch (this.genderCapabilityValue()) {
      case 'male-only':
        return '♂';
      case 'female-only':
        return '♀';
      default:
        return '—';
    }
  });

  protected readonly fixedGenderLabel = computed(() => {
    switch (this.genderCapabilityValue()) {
      case 'male-only':
        return 'team.genderMale';
      case 'female-only':
        return 'team.genderFemale';
      default:
        return 'team.genderless';
    }
  });

  protected onGenderToggleChange(event: MatButtonToggleChange): void {
    this.genderChange.emit(event.value as Gender);
  }

  /** La forma activa (base o alternativa) cuyos tipo/sprites se muestran
   *  ahora (`020`, FR-009/FR-010) — `formVarietyId()` ya llega resuelto
   *  (`resolveDisplayFormVarietyId`), nunca crudo. */
  protected readonly activeForm = computed(() => resolveActiveForm(this.pokedexEntry(), this.formVarietyId()));

  /** Los 1 o 2 tipos de la forma activa, para la sección de Análisis de
   *  Cobertura (spec `023`, FR-004/FR-005) — recalculado ante cualquier
   *  cambio de forma, igual que `activeForm()`. */
  protected readonly coveragePokemonTypes = computed<readonly [PokemonType] | readonly [PokemonType, PokemonType]>(() => {
    const form = this.activeForm();
    return form.typeSecondary ? [form.typePrimary, form.typeSecondary] : [form.typePrimary];
  });

  protected onFormChipClick(formVarietyId: string | null): void {
    this.formVarietyIdChange.emit(formVarietyId);
  }

  /** Combina género y shiny sobre los 4 sprites de la forma activa
   *  (research.md Decisión 3, `020`, generaliza research.md Decisión 4
   *  de `019`) — cae al sprite base cuando la forma no tiene una
   *  variante distinta para el género actual (FR-009), y del
   *  shiny-hembra al shiny-base cuando falta ese sprite puntual. */
  protected spriteUrl(): string | null {
    return resolveFormSpriteUrl(this.activeForm(), this.gender() === 'female', this.isShiny());
  }

  /** Ancho de barra (0–100) de una estadística base sobre la escala fija de
   *  255 (spec `020-stats-bar-scale-color`, FR-002) — no sobre el máximo
   *  entre las estadísticas del propio Pokémon, ni sobre 200 como antes. */
  protected calcStatPercent(statValue: number): number {
    return statBarPercent(statValue);
  }

  /** Color de una barra de estadística según su valor (spec
   *  `020-stats-bar-scale-color`, FR-003) — rojo→amarillo→verde continuo,
   *  ya no un color fijo por tipo de estadística. */
  protected calcStatColor(statValue: number): string {
    return statBarColor(statValue);
  }
}
