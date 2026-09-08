import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoModule } from '@jsverse/transloco';

import { TypeBadgeComponent } from '../../shared/design-system/type-badge.component';
import { colorForType } from '../../shared/design-system/pokemon-type-colors';
import type { RosterEntry } from '../domain/value-objects/roster-entry';
import type { PokedexEntry } from '../../pokemon/domain/entities/pokedex-entry';
import { resolveDisplayGender } from '../../pokemon/domain/value-objects/gender';

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
        <div class="app-team-slot__avatar-shell">
          <button class="app-team-slot__avatar-button" type="button" (click)="select.emit()">
            <mat-icon class="app-team-slot__badge" [style.color]="avatarColor()">catching_pokemon</mat-icon>
            <img [src]="avatarImageUrl()" [alt]="avatarAltText() || ('team.emptySlot' | transloco)" />
            @if (entry()?.isShiny) {
              <span class="app-team-slot__shiny-badge" title="Shiny">✨</span>
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
        @if (pokedexEntry(); as details) {
          <app-type-badge [typeId]="details.typePrimary.id" [label]="details.typePrimary.label" size="large" />
          @if (details.typeSecondary; as secondary) {
            <app-type-badge [typeId]="secondary.id" [label]="secondary.label" size="large" />
          }
        }
      </div>
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
  `,
})
export class TeamSlotComponent {
  readonly entry = input<RosterEntry | null>(null);
  readonly pokedexEntry = input<PokedexEntry | null>(null);
  readonly active = input(false);
  readonly select = output<void>();
  readonly remove = output<void>();

  /** 020 (ronda 7): gris neutro (no transparente) cuando no hay tipo que
   *  colorear — slot vacío, o lleno mientras el detalle todavía no
   *  resolvió — para que la pokeball de fondo siga viéndose en ambos
   *  casos, igual que cuando sí hay un tipo. */
  protected readonly avatarColor = () => {
    const details = this.pokedexEntry();
    return details ? colorForType(details.typePrimary.id) : 'var(--mat-sys-outline, #9e9e9e)';
  };

  /** 020 (ronda 7): el slot vacío se ve igual que uno lleno (pokeball +
   *  imagen grande) — la única diferencia es que la imagen es un huevo en
   *  vez del sprite home de una especie real.
   *
   *  `019`: la misma resolución género × shiny que la tarjeta de detalle
   *  (`PokemonDetailModalComponent.spriteUrl`, research.md Decisión 4) —
   *  para que el slot nunca muestre un sprite de un género distinto al
   *  que la tarjeta acaba de mostrar para ese mismo `RosterEntry`. */
  protected readonly avatarImageUrl = (): string => {
    const slotEntry = this.entry();
    if (!slotEntry) {
      return EGG_SPRITE_URL;
    }
    const details = this.pokedexEntry();
    if (!details) {
      return EGG_SPRITE_URL;
    }
    const female = resolveDisplayGender(details.genderRate, slotEntry.gender) === 'female';
    const isShiny = slotEntry.isShiny;
    const resolved = isShiny
      ? (female ? details.homeSpriteShinyFemaleUrl : null) ?? details.homeSpriteShinyUrl ?? details.homeSpriteUrl
      : (female ? details.homeSpriteFemaleUrl : null) ?? details.homeSpriteUrl;
    return resolved ?? EGG_SPRITE_URL;
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
