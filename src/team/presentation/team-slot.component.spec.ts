import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { TeamSlotComponent } from './team-slot.component';
import { RosterEntry } from '../domain/value-objects/roster-entry';
import { PokedexEntry } from '../../pokemon/domain/entities/pokedex-entry';
import { PokemonType } from '../../pokemon/domain/value-objects/pokemon-type';
import { PokemonStats } from '../../pokemon/domain/value-objects/pokemon-stats';
import { Generation } from '../../game/domain/value-objects/generation';

function makePokedexEntry(): PokedexEntry {
  return new PokedexEntry(
    'pikachu',
    'Pikachu',
    25,
    null,
    'home-normal.png',
    'home-shiny.png',
    null,
    null,
    -1,
    false,
    [],
    null,
    null,
    [],
    new PokemonType('electric', 'Electric'),
    null,
    new Generation('generation-i', 'I'),
    { kind: 'regional' },
    new PokemonStats(35, 55, 40, 50, 50, 90),
  );
}

describe('TeamSlotComponent', () => {
  function build() {
    TestBed.configureTestingModule({
      imports: [
        TeamSlotComponent,
        TranslocoTestingModule.forRoot({
          langs: { en: { team: { emptySlot: 'Empty slot', remove: 'Remove', formSelectionTitle: 'Choose a form' } } },
        }),
      ],
    });
    return TestBed.createComponent(TeamSlotComponent);
  }

  it('muestra el estado vacío (huevo, sin nombre ni botón de eliminar) y emite select al hacer click (020, ronda 7)', () => {
    // El slot vacío se ve igual que uno lleno (pokeball de fondo + imagen
    // grande) — la única diferencia es que la imagen es un huevo y no
    // hay nombre visible ni botón de eliminar (nada que quitar).
    const fixture = build();
    fixture.detectChanges();

    const img = fixture.nativeElement.querySelector('.app-team-slot__avatar-button img') as HTMLImageElement;
    expect(img.getAttribute('src')).toContain('egg.png');
    expect(fixture.nativeElement.querySelector('.app-team-slot__badge')).not.toBeNull();
    expect((fixture.nativeElement.querySelector('.app-team-slot__name') as HTMLElement).textContent?.trim()).toBe('');
    expect(fixture.nativeElement.querySelector('.app-team-slot__remove')).toBeNull();

    const spy = jasmine.createSpy('select');
    fixture.componentInstance.select.subscribe(spy);
    fixture.nativeElement.querySelector('button').click();

    expect(spy).toHaveBeenCalled();
  });

  it('muestra el Pokémon ocupante y emite remove al quitarlo', () => {
    const fixture = build();
    fixture.componentRef.setInput('entry', new RosterEntry('pikachu'));
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('pikachu');

    const spy = jasmine.createSpy('remove');
    fixture.componentInstance.remove.subscribe(spy);
    fixture.nativeElement.querySelectorAll('button')[1].click();

    expect(spy).toHaveBeenCalled();
  });

  it('muestra el sprite normal cuando el slot no está en shiny (018, FR-021)', () => {
    const fixture = build();
    fixture.componentRef.setInput('entry', new RosterEntry('pikachu'));
    fixture.componentRef.setInput('pokedexEntry', makePokedexEntry());
    fixture.detectChanges();

    const img = fixture.nativeElement.querySelector('img');
    expect(img.getAttribute('src')).toBe('home-normal.png');
  });

  it('muestra el sprite shiny cuando el slot tiene isShiny=true (018, FR-021)', () => {
    const fixture = build();
    fixture.componentRef.setInput('entry', new RosterEntry('pikachu').copyWith({ isShiny: true }));
    fixture.componentRef.setInput('pokedexEntry', makePokedexEntry());
    fixture.detectChanges();

    const img = fixture.nativeElement.querySelector('img');
    expect(img.getAttribute('src')).toBe('home-shiny.png');
  });

  it('cae al sprite normal si el shiny no está disponible, aunque isShiny sea true', () => {
    const fixture = build();
    const entryNoShiny = new PokedexEntry(
      'pikachu',
      'Pikachu',
      25,
      null,
      'home-normal.png',
      null,
      null,
      null,
      -1,
      false,
      [],
      null,
      null,
      [],
      new PokemonType('electric', 'Electric'),
      null,
      new Generation('generation-i', 'I'),
      { kind: 'regional' },
      new PokemonStats(35, 55, 40, 50, 50, 90),
    );
    fixture.componentRef.setInput('entry', new RosterEntry('pikachu').copyWith({ isShiny: true }));
    fixture.componentRef.setInput('pokedexEntry', entryNoShiny);
    fixture.detectChanges();

    const img = fixture.nativeElement.querySelector('img');
    expect(img.getAttribute('src')).toBe('home-normal.png');
  });

  it('muestra el sprite hembra cuando el género guardado del slot es female (019, FR-008)', () => {
    const fixture = build();
    const entryWithFemaleSprite = new PokedexEntry(
      'pikachu',
      'Pikachu',
      25,
      null,
      'home-normal.png',
      'home-shiny.png',
      'home-female.png',
      'home-shiny-female.png',
      4,
      true,
      [],
      null,
      null,
      [],
      new PokemonType('electric', 'Electric'),
      null,
      new Generation('generation-i', 'I'),
      { kind: 'regional' },
      new PokemonStats(35, 55, 40, 50, 50, 90),
    );
    fixture.componentRef.setInput('entry', new RosterEntry('pikachu').copyWith({ gender: 'female' }));
    fixture.componentRef.setInput('pokedexEntry', entryWithFemaleSprite);
    fixture.detectChanges();

    const img = fixture.nativeElement.querySelector('img');
    expect(img.getAttribute('src')).toBe('home-female.png');
  });

  it('sin género guardado, una especie de género dual muestra el sprite macho por defecto (019, FR-003)', () => {
    const fixture = build();
    const entryWithFemaleSprite = new PokedexEntry(
      'pikachu',
      'Pikachu',
      25,
      null,
      'home-normal.png',
      'home-shiny.png',
      'home-female.png',
      'home-shiny-female.png',
      4,
      true,
      [],
      null,
      null,
      [],
      new PokemonType('electric', 'Electric'),
      null,
      new Generation('generation-i', 'I'),
      { kind: 'regional' },
      new PokemonStats(35, 55, 40, 50, 50, 90),
    );
    fixture.componentRef.setInput('entry', new RosterEntry('pikachu'));
    fixture.componentRef.setInput('pokedexEntry', entryWithFemaleSprite);
    fixture.detectChanges();

    const img = fixture.nativeElement.querySelector('img');
    expect(img.getAttribute('src')).toBe('home-normal.png');
  });

  it('el círculo de color se reemplaza por un ícono de pokeball, coloreado por tipo (020, ronda 4)', () => {
    const fixture = build();
    fixture.componentRef.setInput('entry', new RosterEntry('pikachu'));
    fixture.componentRef.setInput('pokedexEntry', makePokedexEntry());
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('.app-team-slot__badge') as HTMLElement;
    expect(badge).not.toBeNull();
    expect(badge.tagName.toLowerCase()).toBe('mat-icon');
    expect(badge.textContent?.trim()).toBe('catching_pokemon');
    // Sin disco/fondo propio — solo el glifo, coloreado según el tipo.
    expect(badge.style.background).toBeFalsy();
    expect(badge.style.color).toBeTruthy();

    // El sprite ocupa el 100% del botón; el badge, un 62% — el sprite es
    // visiblemente más grande que el ícono de pokeball.
    const img = fixture.nativeElement.querySelector('.app-team-slot__avatar-button img') as HTMLElement;
    expect(getComputedStyle(img).width).not.toBe(getComputedStyle(badge).width);
  });

  it('el botón de eliminar es un círculo relleno de rojo con el ícono en blanco (020, ronda 3)', () => {
    const fixture = build();
    fixture.componentRef.setInput('entry', new RosterEntry('pikachu'));
    fixture.componentRef.setInput('pokedexEntry', makePokedexEntry());
    fixture.detectChanges();

    const removeBtn = fixture.nativeElement.querySelector('.app-team-slot__remove') as HTMLElement;
    expect(removeBtn).not.toBeNull();
    const style = getComputedStyle(removeBtn);
    // Relleno rojo (no transparente) e ícono con color de texto blanco.
    expect(style.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(style.color.replace(/\s/g, '')).toBe('rgb(255,255,255)');
  });

  it('el botón de eliminar queda anclado al sprite (shell), no al borde del slot completo (020, ronda 5)', () => {
    // Bug reportado: "los botones de eliminar están muy despegados de la
    // imagen del pokemon" — el ✕ debe posicionarse relativo al mismo
    // contenedor que envuelve el sprite (`__avatar-shell`), no a
    // `.app-team-slot`, para que quede pegado a su esquina real sin
    // importar el espacio vertical sobrante de la celda.
    const fixture = build();
    fixture.componentRef.setInput('entry', new RosterEntry('pikachu'));
    fixture.componentRef.setInput('pokedexEntry', makePokedexEntry());
    fixture.detectChanges();

    const shell = fixture.nativeElement.querySelector('.app-team-slot__avatar-shell') as HTMLElement;
    const removeBtn = shell?.querySelector('.app-team-slot__remove');
    expect(shell).not.toBeNull();
    expect(removeBtn).not.toBeNull();
  });

  it('el nombre del Pokémon es un 50% más grande que antes (020, ronda 5)', () => {
    // Antes 0.8rem -> ahora 1.2rem.
    const fixture = build();
    fixture.componentRef.setInput('entry', new RosterEntry('pikachu'));
    fixture.componentRef.setInput('pokedexEntry', makePokedexEntry());
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();

    const name = fixture.nativeElement.querySelector('.app-team-slot__name') as HTMLElement;
    expect(getComputedStyle(name).fontSize).toBe('19.2px'); // 1.2rem a 16px base

    document.body.removeChild(fixture.nativeElement);
  });

  it('los badges de tipo se muestran en tamaño "large" dentro del slot (020, ronda 5)', () => {
    const fixture = build();
    fixture.componentRef.setInput('entry', new RosterEntry('pikachu'));
    fixture.componentRef.setInput('pokedexEntry', makePokedexEntry());
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('app-type-badge .app-type-badge') as HTMLElement;
    expect(badge.classList.contains('app-type-badge--large')).toBeTrue();
  });

  it('mantiene el mismo tamaño de caja vacío vs. lleno dentro de una celda de tamaño fijo (019, FR-017)', () => {
    // El slot ahora es responsivo (ocupa el 100% de su celda de grilla,
    // ver research/019) — para que "mismo tamaño vacío/lleno" sea una
    // comparación válida hace falta darle una celda con dimensiones
    // reales, igual que la grilla 3x2 de `team-builder.page.ts`.
    function measureIn200pxCell(configure: (fixture: ReturnType<typeof build>) => void): DOMRect {
      const fixture = build();
      configure(fixture);
      fixture.detectChanges();
      const cell = document.createElement('div');
      cell.style.width = '200px';
      cell.style.height = '200px';
      cell.appendChild(fixture.nativeElement);
      document.body.appendChild(cell);
      const rect = (fixture.nativeElement.querySelector('.app-team-slot') as HTMLElement).getBoundingClientRect();
      document.body.removeChild(cell);
      return rect;
    }

    const emptyRect = measureIn200pxCell(() => undefined);

    TestBed.resetTestingModule();
    const filledRect = measureIn200pxCell((fixture) => {
      fixture.componentRef.setInput('entry', new RosterEntry('pikachu'));
      fixture.componentRef.setInput('pokedexEntry', makePokedexEntry());
    });

    expect(filledRect.height).toBe(emptyRect.height);
    expect(filledRect.width).toBe(emptyRect.width);
  });
});
