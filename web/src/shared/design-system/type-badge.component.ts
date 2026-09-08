import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { colorForType } from './pokemon-type-colors';

/**
 * Badge de color por tipo de Pokémon (p. ej. "Fire", "Water"). Puramente
 * de presentación — el color no es un dato de dominio (ver
 * `pokemon-type-colors.ts`), por eso vive en `shared/design-system` y no
 * en el módulo `pokemon`.
 */
@Component({
  selector: 'app-type-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="app-type-badge" [class.app-type-badge--large]="size() === 'large'" [style.background]="color()">
      {{ label() }}
    </span>
  `,
  styles: `
    .app-type-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.15rem 0.65rem;
      border-radius: 999px;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.02em;
      text-transform: uppercase;
      color: #fff;
      text-shadow: 0 1px 1px rgba(0, 0, 0, 0.25);
      white-space: nowrap;
    }
    /* 020 (ronda 5): variante 50% más grande para los slots del equipo,
       donde el badge por defecto quedaba chico frente al resto del
       texto agrandado — un input de tamaño en vez de resolver esto
       desde afuera con un selector de encapsulación perforada, ya que
       font-size en rem no hereda del padre. */
    .app-type-badge--large {
      padding: 0.225rem 0.975rem;
      font-size: 1.05rem;
    }
  `,
})
export class TypeBadgeComponent {
  readonly typeId = input.required<string>();
  readonly label = input.required<string>();
  readonly size = input<'normal' | 'large'>('normal');

  protected readonly color = () => colorForType(this.typeId());
}
