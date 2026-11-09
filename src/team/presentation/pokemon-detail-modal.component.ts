import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule, MatButtonToggleChange } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TranslocoModule } from '@jsverse/transloco';

import type { PokedexEntry } from '../../pokemon/domain/entities/pokedex-entry';
import { genderCapability, type Gender } from '../../pokemon/domain/value-objects/gender';
import { TypeBadgeComponent } from '../../shared/design-system/type-badge.component';

/**
 * Tarjeta modal de detalle de un Pokémon del equipo (FR-019-FR-022a,
 * `018`; selector de género FR-001-FR-014, `019`): nombre, tipos, imagen,
 * un toggle shiny y un selector/indicador de género. Puramente
 * presentacional — el estado `isShiny`/`gender` persiste en el
 * `RosterEntry` (`TeamStore.toggleShiny`/`toggleGender`), no acá
 * (Constitución Principio VI); este componente solo refleja el valor que
 * recibe y reenvía el cambio.
 */
@Component({
  selector: 'app-pokemon-detail-modal',
  standalone: true,
  imports: [MatButtonModule, MatButtonToggleModule, MatIconModule, MatSlideToggleModule, TranslocoModule, TypeBadgeComponent],
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
          <app-type-badge [typeId]="pokedexEntry().typePrimary.id" [label]="pokedexEntry().typePrimary.label" />
          @if (pokedexEntry().typeSecondary; as secondary) {
            <app-type-badge [typeId]="secondary.id" [label]="secondary.label" />
          }
        </div>

        <div class="app-detail-modal__gender-bar">
          @if (genderCapabilityValue() === 'dual') {
            <mat-button-toggle-group
              class="app-detail-modal__gender-toggle"
              [value]="gender()"
              [attr.aria-label]="'team.genderToggle' | transloco"
              (change)="onGenderToggleChange($event)"
            >
              <mat-button-toggle value="male" [attr.aria-label]="'team.genderMale' | transloco">♂</mat-button-toggle>
              <mat-button-toggle value="female" [attr.aria-label]="'team.genderFemale' | transloco">♀</mat-button-toggle>
            </mat-button-toggle-group>
          } @else {
            <span class="app-detail-modal__gender-fixed" [attr.aria-label]="fixedGenderLabel() | transloco">{{ fixedGenderIndicator() }}</span>
          }
        </div>

        <div class="app-detail-modal__shiny-bar">
          <mat-slide-toggle [checked]="isShiny()" (change)="shinyChange.emit($event.checked)">
            ✨ {{ 'team.shinyToggle' | transloco }}
          </mat-slide-toggle>
        </div>

        @if (pokedexEntry().baseStats; as stats) {
          <div class="app-detail-modal__stats">
            <div class="app-stat-row">
              <span class="app-stat-label">HP</span>
              <span class="app-stat-value">{{ stats.hp }}</span>
              <div class="app-stat-bar-track">
                <div class="app-stat-bar-fill app-stat-bar-fill--hp" [style.width.%]="calcStatPercent(stats.hp)"></div>
              </div>
            </div>
            <div class="app-stat-row">
              <span class="app-stat-label">ATK</span>
              <span class="app-stat-value">{{ stats.attack }}</span>
              <div class="app-stat-bar-track">
                <div class="app-stat-bar-fill app-stat-bar-fill--atk" [style.width.%]="calcStatPercent(stats.attack)"></div>
              </div>
            </div>
            <div class="app-stat-row">
              <span class="app-stat-label">DEF</span>
              <span class="app-stat-value">{{ stats.defense }}</span>
              <div class="app-stat-bar-track">
                <div class="app-stat-bar-fill app-stat-bar-fill--def" [style.width.%]="calcStatPercent(stats.defense)"></div>
              </div>
            </div>
            <div class="app-stat-row">
              <span class="app-stat-label">SPA</span>
              <span class="app-stat-value">{{ stats.specialAttack }}</span>
              <div class="app-stat-bar-track">
                <div class="app-stat-bar-fill app-stat-bar-fill--spa" [style.width.%]="calcStatPercent(stats.specialAttack)"></div>
              </div>
            </div>
            <div class="app-stat-row">
              <span class="app-stat-label">SPD</span>
              <span class="app-stat-value">{{ stats.specialDefense }}</span>
              <div class="app-stat-bar-track">
                <div class="app-stat-bar-fill app-stat-bar-fill--spd" [style.width.%]="calcStatPercent(stats.specialDefense)"></div>
              </div>
            </div>
            <div class="app-stat-row">
              <span class="app-stat-label">SPE</span>
              <span class="app-stat-value">{{ stats.speed }}</span>
              <div class="app-stat-bar-track">
                <div class="app-stat-bar-fill app-stat-bar-fill--spe" [style.width.%]="calcStatPercent(stats.speed)"></div>
              </div>
            </div>
          </div>
        }
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
    .app-detail-modal__gender-bar {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .app-detail-modal__gender-fixed {
      padding: 0.25rem 0.75rem;
      border-radius: 999px;
      background: var(--mat-sys-surface-variant, #f0f0f5);
      font-weight: 700;
    }
    .app-detail-modal__shiny-bar {
      padding: 0.25rem 0.75rem;
      border-radius: 999px;
      background: var(--mat-sys-surface-variant, #f0f0f5);
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
      transition: width 0.4s ease-out;
    }
    .app-stat-bar-fill--hp { background: #FF5959; }
    .app-stat-bar-fill--atk { background: #F5AC78; }
    .app-stat-bar-fill--def { background: #FAE078; }
    .app-stat-bar-fill--spa { background: #9DB7F5; }
    .app-stat-bar-fill--spd { background: #A7DB8D; }
    .app-stat-bar-fill--spe { background: #FA92B2; }
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
  readonly close = output<void>();

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

  /** Combina género y shiny sobre los 4 sprites que `PokedexEntry` ya
   *  expone (research.md Decisión 4, `019`) — cae al sprite base cuando
   *  la especie no tiene una variante distinta para el género actual
   *  (FR-009), y del shiny-hembra al shiny-base cuando falta ese sprite
   *  puntual. */
  protected spriteUrl(): string | null {
    const entry = this.pokedexEntry();
    const female = this.gender() === 'female';
    if (this.isShiny()) {
      return (female ? entry.homeSpriteShinyFemaleUrl : null) ?? entry.homeSpriteShinyUrl ?? entry.homeSpriteUrl;
    }
    return (female ? entry.homeSpriteFemaleUrl : null) ?? entry.homeSpriteUrl;
  }

  protected calcStatPercent(statValue: number): number {
    return Math.min(100, Math.round((statValue / 200) * 100));
  }
}
