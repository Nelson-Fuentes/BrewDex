import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoModule } from '@jsverse/transloco';

import { TypeBadgeComponent } from '../../shared/design-system/type-badge.component';
import { colorForType } from '../../shared/design-system/pokemon-type-colors';
import type { RosterEntry } from '../domain/value-objects/roster-entry';
import type { PokedexEntry } from '../../pokemon/domain/entities/pokedex-entry';
import { resolveDisplayGender } from '../../pokemon/domain/value-objects/gender';
import {
  availableSelectableForms,
  resolveActiveForm,
  resolveDisplayFormVarietyId,
  resolveFormSpriteUrl,
} from '../../pokemon/domain/value-objects/active-form';
import { GAME_SELECTION_READER } from '../../shared/tokens/game-selection-reader.token';
import { heatmapColorFor, heatmapTextColorFor } from '../../shared/design-system/heatmap-gradient';

/** Sprite de huevo — mismo repositorio de sprites que usa el resto de la
 *  app (`pokeapi-pokemon-repository.service.ts`), pero sin especie
 *  asociada, por eso es una constante acá y no algo resuelto por
 *  `PokemonRepository` (020, ronda 7): el slot vacío se ve igual que uno
 *  lleno (pokeball detrás + imagen grande), solo que la imagen es un
 *  huevo en vez del sprite home de una especie. */
const EGG_SPRITE_URL = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/egg.png';

/**
 * Un slot del equipo (FR-010–FR-014) — misma apariencia esté vacío o
 * lleno (pokeball de fondo + imagen grande): vacío muestra un huevo sin
 * nombre ni badges de tipo; lleno, el sprite home de la especie con su
 * nombre y tipos debajo. Puramente presentacional (Constitución
 * Principio VI): toda acción se reenvía por `output()`.
 */
@Component({
  selector: 'app-team-slot',
  standalone: true,
  imports: [MatIconModule, TranslocoModule, TypeBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-team-slot" [class.app-team-slot--active]="active()">
      <div class="app-team-slot__avatar-wrapper">
        <div class="app-team-slot__avatar-shell" [style.box-shadow]="coverageAuraBoxShadow()">
          <button class="app-team-slot__avatar-button" type="button" (click)="select.emit()">
            <mat-icon class="app-team-slot__badge" [style.color]="avatarColor()">catching_pokemon</mat-icon>
            <img [src]="avatarImageUrl()" [alt]="avatarAltText() || ('team.emptySlot' | transloco)" />
            @if (entry()?.isShiny) {
              <span class="app-team-slot__shiny-badge" title="Shiny">✨</span>
            }
            @if (activeFormLacksDistinctArt()) {
              <span class="app-team-slot__partner-badge" [attr.title]="'team.partnerFormBadge' | transloco">💗</span>
            }
          </button>
          @if (entry()) {
            <button
              class="app-team-slot__remove"
              type="button"
              [attr.aria-label]="'team.remove' | transloco"
              (click)="remove.emit()"
            >
              <mat-icon>close</mat-icon>
            </button>
          }
        </div>
      </div>
      <p class="app-team-slot__name">{{ avatarAltText() }}</p>
      <div class="app-team-slot__types">
        @if (activeForm(); as form) {
          <app-type-badge [typeId]="form.typePrimary.id" [label]="form.typePrimary.label" size="large" />
          @if (form.typeSecondary; as secondary) {
            <app-type-badge [typeId]="secondary.id" [label]="secondary.label" size="large" />
          }
        }
      </div>
      <!-- 026, US1/US3: "Índice sintético de cobertura global" del Pokémon del slot —
           siempre recibido ya calculado (FR-001), nunca calculado acá (Constitution Check,
           Principio VI). El aura/borde de fondo llega de coverageAuraColor() (US3, null
           sin comparación posible). -->
      @if (entry() && roundedCoverageIndex() !== null) {
        <span
          class="app-team-slot__coverage-index"
          [style.background]="coverageAuraColor()"
          [style.color]="coverageAuraTextColor()"
          [attr.title]="'team.slotCoverageIndexLabel' | transloco"
          [attr.aria-label]="('team.slotCoverageIndexLabel' | transloco) + ': ' + roundedCoverageIndex()"
        >
          <span class="app-team-slot__coverage-index-label" aria-hidden="true">{{ 'team.slotCoverageIndexShortLabel' | transloco }}</span>
          {{ roundedCoverageIndex() }}
        </span>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
    .app-team-slot {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.35rem;
      position: relative;
      padding: 0.5rem;
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      transition: transform 0.2s ease;
    }
    .app-team-slot:hover {
      transform: translateY(-2px);
    }
    /* El aro de "activo" se dibuja sobre el sprite (círculo grande
       imaginario del tamaño del botón), no sobre el badge chico — si no,
       quedaría un aro diminuto perdido en el centro. */
    .app-team-slot--active .app-team-slot__avatar-button::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 50%;
      outline: 3px solid var(--mat-sys-primary, #673ab7);
      outline-offset: 3px;
      box-shadow: 0 4px 16px rgba(103, 58, 183, 0.3);
      pointer-events: none;
    }
    .app-team-slot__avatar-wrapper {
      flex: 1 1 0%;
      min-height: 0;
      width: 100%;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      container-type: size;
    }
    /* 020 (ronda 5): "shell" del mismo tamaño exacto que el botón —
       envuelve botón + eliminar para que el X se pueda anclar a la
       esquina real del sprite (posición relativa propia) en vez de a la
       esquina del slot completo, que queda lejos del sprite cuando la
       celda es más alta que ancha (bug reportado: "el botón de eliminar
       está muy despegado de la imagen"). El align-items del wrapper de
       arriba además pega el conjunto contra el nombre de abajo, cerrando
       el otro hueco reportado. */
    .app-team-slot__avatar-shell {
      position: relative;
      /* 026, US3: el aura comparativa (box-shadow, coverageAuraBoxShadow())
         dibuja un anillo redondo alrededor del sprite — sin este radio, el
         anillo saldría cuadrado. Sin aura activa, el radio no tiene efecto
         visual (el shell no tiene fondo/borde propio). */
      border-radius: 50%;
      width: min(90cqw, 90cqh);
      height: min(90cqw, 90cqh);
    }
    .app-team-slot__avatar-button {
      /* El botón ya no es el círculo de color en sí (eso ahora es el
         badge de abajo, más chico y detrás) — solo el área clicable, del
         tamaño del shell que lo envuelve. */
      width: 100%;
      height: 100%;
      border: none;
      cursor: pointer;
      background: none;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      position: relative;
    }
    .app-team-slot__avatar-button:hover {
      transform: scale(1.04);
    }
    /* El círculo de color detrás del sprite se reemplaza por el ícono de
       una pokeball (coloreado por tipo, igual que antes hacía el fondo) —
       sin ningún disco/fondo propio, solo el glifo. */
    mat-icon.app-team-slot__badge {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      /* mat-icon escala por font-size, no por width/height a secas — hay
         que fijar los tres para que el ícono efectivamente cambie de
         tamaño (mismo patrón que el mat-icon del estado vacío, abajo).
         Selector con el tipo de elemento (no solo la clase) para ganarle
         en especificidad al tamaño por defecto de Angular Material. */
      font-size: min(54cqw, 54cqh);
      width: min(54cqw, 54cqh);
      height: min(54cqw, 54cqh);
      z-index: 0;
      filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.18));
    }
    .app-team-slot__avatar-button img {
      /* El sprite queda por encima del badge (z-index) y es más grande
         que el círculo de color, tal como se pidió. */
      position: relative;
      z-index: 1;
      width: 100%;
      height: 100%;
      object-fit: contain;
      image-rendering: pixelated;
      filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.2));
    }
    .app-team-slot__shiny-badge {
      position: absolute;
      top: -2px;
      right: -2px;
      font-size: 0.85rem;
      line-height: 1;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
    }
    /* 020 (pedido del usuario): esquina opuesta a la del shiny/eliminar
       para que ambos puedan verse a la vez sin superponerse. */
    .app-team-slot__partner-badge {
      position: absolute;
      top: -2px;
      left: -2px;
      font-size: 0.85rem;
      line-height: 1;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
    }
    .app-team-slot__remove {
      /* Anclado al shell (tamaño exacto del sprite), no al slot completo
         — queda pegado a la esquina real de la imagen sin importar
         cuánto espacio vertical sobrante haya en la celda. */
      position: absolute;
      top: -6px;
      right: -6px;
      z-index: 2;
      width: 24px;
      height: 24px;
      padding: 0;
      border: none;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--mat-sys-error, #d32f2f);
      color: #fff;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
      transition: box-shadow 0.2s ease, transform 0.2s ease;
    }
    .app-team-slot__remove mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      line-height: 16px;
    }
    .app-team-slot__remove:hover {
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.35);
      transform: scale(1.1);
    }
    .app-team-slot__name {
      margin: 0;
      min-height: 1.8rem;
      /* 020 (ronda 5): 50% más grande (antes 0.8rem). */
      font-size: 1.2rem;
      font-weight: 700;
      text-align: center;
      max-width: 100%;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .app-team-slot__types {
      display: flex;
      gap: 0.25rem;
      flex-wrap: wrap;
      justify-content: center;
      min-height: 1.5rem;
    }
    /* 026, US1: "Índice sintético de cobertura global" — un badge chico
       bajo los tipos, con el mismo lenguaje visual de "chip" que el resto
       del slot. El color de fondo/texto (aura comparativa, US3) llega por
       binding; sin aura calculable usa un fondo neutro propio para seguir
       siendo legible. */
    .app-team-slot__coverage-index {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.2rem;
      min-width: 1.75rem;
      padding: 0.1rem 0.45rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 700;
      background: var(--mat-sys-surface-variant, #f3f0f7);
      color: var(--mat-sys-on-surface-variant, #1a1a1a);
    }
    /* Texto corto ("Cob"/"Cov") que aclara qué representa el número — el
       usuario reportó que, sin él, el chip solo mostraba un número suelto
       sin contexto visible (el aria-label solo ayuda a lectores de
       pantalla). Más liviano que el número (peso normal, opacidad
       reducida) para no competir visualmente con él. */
    .app-team-slot__coverage-index-label {
      font-weight: 600;
      opacity: 0.75;
      text-transform: uppercase;
      font-size: 0.65rem;
    }
  `,
})
export class TeamSlotComponent {
  private readonly gameSelectionReader = inject(GAME_SELECTION_READER);

  readonly entry = input<RosterEntry | null>(null);
  readonly pokedexEntry = input<PokedexEntry | null>(null);
  readonly active = input(false);
  readonly select = output<void>();
  readonly remove = output<void>();

  /** `026` (US1): el "Índice sintético de cobertura global" ya calculado
   *  del Pokémon de este slot (`TeamBuilderPage.coverageIndexFor`) — nunca
   *  calculado dentro de este componente (Constitution Check, Principio
   *  VI). `null` cuando el slot está vacío o el índice aún no es
   *  calculable (p. ej. movepool del slot todavía en vuelo). */
  readonly coverageIndex = input<number | null>(null);

  /** Mismo criterio de redondeo que `CoverageAnalysisTableComponent.roundedValue`
   *  (FR-001) — entero, o `null` cuando no hay índice que mostrar. */
  protected readonly roundedCoverageIndex = (): number | null => {
    const index = this.coverageIndex();
    return index === null ? null : Math.round(index);
  };

  /** `026` (US3): los `coverageIndex` de todos los slots ocupados del
   *  equipo actual (el propio incluido) — el `columnValues` que este slot
   *  le pasa a `heatmapColorFor`/`heatmapTextColorFor` para su propio
   *  color de aura (contrato §2). No se interpreta de otra forma (no
   *  asume orden ni correspondencia con slots específicos). */
  readonly teamCoverageIndexValues = input<readonly number[]>([]);

  /** `null` sin comparación posible: slot vacío/índice no calculable, o
   *  menos de 2 valores con los que comparar (Edge Case 0/1 slot ocupado,
   *  FR-006) — en ambos casos, ningún aura/borde. En otro caso, reutiliza
   *  `heatmapColorFor` tal cual (research.md Decisión 6): el mismo
   *  mecanismo ya resuelve empates/rango sin variación con su color
   *  neutro, sin ninguna rama nueva acá. */
  protected readonly coverageAuraColor = (): string | null => {
    const index = this.coverageIndex();
    const values = this.teamCoverageIndexValues();
    return index === null || values.length < 2 ? null : heatmapColorFor(index, values);
  };

  protected readonly coverageAuraTextColor = (): string | null => {
    const index = this.coverageIndex();
    const values = this.teamCoverageIndexValues();
    return index === null || values.length < 2 ? null : heatmapTextColorFor(index, values);
  };

  /** `026` (US3, T021): el aura/borde alrededor del slot en sí (el
   *  "shell" que envuelve el sprite, FR-006/FR-010) — un anillo del mismo
   *  color que {@link coverageAuraColor}, sin ocultar el sprite ni el
   *  aro de "activo" ya existente (`.app-team-slot--active`, que se dibuja
   *  sobre el mismo elemento vía `::after`, sin conflicto porque este aro
   *  usa `box-shadow` y no toca `outline`). `null` cuando no hay aura que
   *  mostrar (mismo criterio que {@link coverageAuraColor}). */
  protected readonly coverageAuraBoxShadow = (): string | null => {
    const color = this.coverageAuraColor();
    return color === null ? null : `0 0 0 4px ${color}`;
  };

  /** `020`: el `varietyId` resuelto de la forma activa del slot (base
   *  `null`, o alternativa) — la misma resolución que
   *  `TeamBuilderPage`/`PokemonDetailModalComponent`
   *  (`resolveDisplayFormVarietyId` sobre las formas disponibles ahora,
   *  `availableSelectableForms` con los DLC activos), para que el slot y
   *  la tarjeta nunca muestren formas distintas para el mismo
   *  `RosterEntry` (FR-009/FR-010/FR-011). */
  private readonly activeFormVarietyId = () => {
    const details = this.pokedexEntry();
    const slotEntry = this.entry();
    if (!details) {
      return null;
    }
    const available = availableSelectableForms(details, this.gameSelectionReader.currentActiveDlcIds());
    return resolveDisplayFormVarietyId(available, slotEntry?.formVarietyId ?? null);
  };

  protected readonly activeForm = () => {
    const details = this.pokedexEntry();
    if (!details) {
      return null;
    }
    return resolveActiveForm(details, this.activeFormVarietyId());
  };

  /** `020` (pedido del usuario): la forma activa del slot puede no tener
   *  ilustración HOME propia (research.md Decisión 11 — el Pikachu/Eevee
   *  inicial de Let's Go, entre otras) — en ese caso el sprite del slot
   *  no cambia visualmente respecto a la forma base a propósito (mismo
   *  criterio que la tarjeta de detalle), así que se refuerza con un
   *  ícono aparte en vez de duplicar el nombre en texto sobre el slot,
   *  chico y sin espacio para eso. */
  protected readonly activeFormLacksDistinctArt = (): boolean => {
    const formVarietyId = this.activeFormVarietyId();
    if (formVarietyId === null) {
      return false;
    }
    const form = this.pokedexEntry()?.selectableForms.find((f) => f.varietyId === formVarietyId);
    return form !== undefined && form.homeSpriteUrl === form.gameSpriteUrl;
  };

  /** 020 (ronda 7): gris neutro (no transparente) cuando no hay tipo que
   *  colorear — slot vacío, o lleno mientras el detalle todavía no
   *  resolvió — para que la pokeball de fondo siga viéndose en ambos
   *  casos, igual que cuando sí hay un tipo. `020` (selector de forma):
   *  colorea según el tipo de la forma activa, no siempre el de la
   *  especie base. */
  protected readonly avatarColor = () => {
    const form = this.activeForm();
    return form ? colorForType(form.typePrimary.id) : 'var(--mat-sys-outline, #9e9e9e)';
  };

  /** 020 (ronda 7): el slot vacío se ve igual que uno lleno (pokeball +
   *  imagen grande) — la única diferencia es que la imagen es un huevo en
   *  vez del sprite home de una especie real.
   *
   *  `019`: la misma resolución género × shiny que la tarjeta de detalle
   *  (`PokemonDetailModalComponent.spriteUrl`, research.md Decisión 4) —
   *  para que el slot nunca muestre un sprite de un género distinto al
   *  que la tarjeta acaba de mostrar para ese mismo `RosterEntry`.
   *
   *  `020`: generaliza esa misma resolución sobre los 4 sprites de la
   *  forma activa (`activeForm()`) en vez de siempre los de la especie
   *  base — mismo criterio que `PokemonDetailModalComponent.spriteUrl`
   *  (research.md Decisión 3). */
  protected readonly avatarImageUrl = (): string => {
    const slotEntry = this.entry();
    if (!slotEntry) {
      return EGG_SPRITE_URL;
    }
    const details = this.pokedexEntry();
    if (!details) {
      return EGG_SPRITE_URL;
    }
    // `020` (pedido del usuario): a diferencia de la tarjeta de detalle,
    // el sprite del slot NUNCA cae al sprite de juego de una forma sin
    // ilustración HOME propia (research.md Decisión 11) — se mantiene el
    // de la forma base (siempre con ilustración real), y la diferencia
    // se comunica solo con el ícono (`activeFormLacksDistinctArt`,
    // Decisión 13), no degradando la calidad de la imagen del slot.
    const form = this.activeFormLacksDistinctArt() ? details : this.activeForm();
    if (!form) {
      return EGG_SPRITE_URL;
    }
    const female = resolveDisplayGender(details.genderRate, slotEntry.gender) === 'female';
    return resolveFormSpriteUrl(form, female, slotEntry.isShiny) ?? EGG_SPRITE_URL;
  };

  /** El nombre solo es visible cuando el slot está ocupado — vacío
   *  devuelve cadena vacía a propósito (pedido explícito: "el nombre del
   *  pokemon no debe ser visible en este estado"); el texto accesible
   *  ("Empty slot"/"Slot vacío") se usa aparte, solo como `alt`/
   *  `aria-label`, nunca como texto visible en `.app-team-slot__name`. */
  protected readonly avatarAltText = (): string => {
    const slotEntry = this.entry();
    if (!slotEntry) {
      return '';
    }
    return this.pokedexEntry()?.displayName ?? slotEntry.pokemonId;
  };
}
