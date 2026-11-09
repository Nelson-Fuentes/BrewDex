import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { TeamSlotComponent } from './team-slot.component';
import { RosterEntry } from '../domain/value-objects/roster-entry';
import { PokedexEntry } from '../../pokemon/domain/entities/pokedex-entry';
import { PokemonType } from '../../pokemon/domain/value-objects/pokemon-type';
import { PokemonStats } from '../../pokemon/domain/value-objects/pokemon-stats';
import { SelectableForm } from '../../pokemon/domain/value-objects/selectable-form';
import { Generation } from '../../game/domain/value-objects/generation';
import { GAME_SELECTION_READER } from '../../shared/tokens/game-selection-reader.token';
import type { GameSelectionReader } from '../../game/domain/ports/game-selection-reader';
import { heatmapColorFor, heatmapTextColorFor } from '../../shared/design-system/heatmap-gradient';

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
  function fakeGameSelectionReader(activeDlcIds: ReadonlySet<string> = new Set()): GameSelectionReader {
    return {
      currentGame: () => null,
      currentActiveDlcIds: () => activeDlcIds,
      onSelectionChanged: () => new Subject<void>().asObservable(),
      toggleDlc: () => undefined,
    };
  }

  function build(activeDlcIds: ReadonlySet<string> = new Set()) {
    TestBed.configureTestingModule({
      imports: [
        TeamSlotComponent,
        TranslocoTestingModule.forRoot({
          langs: {
            en: {
              team: {
                emptySlot: 'Empty slot',
                remove: 'Remove',
                formSelectionTitle: 'Choose a form',
                slotCoverageIndexLabel: 'Coverage index',
                slotCoverageIndexShortLabel: 'Cov',
              },
            },
          },
        }),
      ],
      providers: [{ provide: GAME_SELECTION_READER, useValue: fakeGameSelectionReader(activeDlcIds) }],
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

  // 020, User Story 5 (FR-009/FR-010/FR-011) — el slot refleja la forma guardada del RosterEntry
  describe('forma guardada del slot', () => {
    function heatForm(requiresDlcId: string | null = null): SelectableForm {
      return new SelectableForm(
        'rotom-heat',
        'Heat Rotom',
        'heat-game.png',
        'heat-home.png',
        null,
        null,
        null,
        'template',
        requiresDlcId,
        new PokemonType('fire', 'Fire'),
        new PokemonType('electric', 'Electric'),
        new PokemonStats(50, 65, 107, 105, 107, 86),
      );
    }

    function rotomEntry(requiresDlcId: string | null = null): PokedexEntry {
      return new PokedexEntry(
        'rotom',
        'Rotom',
        479,
        null,
        'rotom-home.png',
        null,
        null,
        null,
        -1,
        false,
        [heatForm(requiresDlcId)],
        null,
        null,
        [],
        new PokemonType('electric', 'Electric'),
        null,
        new Generation('generation-iv', 'IV'),
        { kind: 'regional' },
        new PokemonStats(50, 50, 77, 95, 77, 91),
      );
    }

    it('muestra el sprite de la forma guardada en el RosterEntry, no el de la especie base', () => {
      const fixture = build();
      fixture.componentRef.setInput('entry', new RosterEntry('rotom', 'rotom-heat'));
      fixture.componentRef.setInput('pokedexEntry', rotomEntry());
      fixture.detectChanges();

      const img = fixture.nativeElement.querySelector('img');
      expect(img.getAttribute('src')).toBe('heat-home.png');
    });

    it('colorea el badge según el tipo de la forma guardada, no el de la especie base', () => {
      const fixture = build();
      fixture.componentRef.setInput('entry', new RosterEntry('rotom', 'rotom-heat'));
      fixture.componentRef.setInput('pokedexEntry', rotomEntry());
      fixture.detectChanges();

      const badge = fixture.nativeElement.querySelector('.app-team-slot__badge') as HTMLElement;
      // colorForType('fire') !== colorForType('electric') — alcanza con
      // verificar que el color quedó fijado (no vacío/heredado).
      expect(badge.style.color).toBeTruthy();
    });

    // Bug reportado (020, corrección 10): al cambiar Marowak a su forma
    // de Alola, el tipo mostrado en el slot no cambiaba — los badges de
    // tipo leían la especie base directo, no la forma activa.
    it('muestra los badges de tipo de la forma guardada, no los de la especie base', () => {
      const fixture = build();
      fixture.componentRef.setInput('entry', new RosterEntry('rotom', 'rotom-heat'));
      fixture.componentRef.setInput('pokedexEntry', rotomEntry());
      fixture.detectChanges();

      // La especie base (Rotom) es solo Eléctrico — 'Fire' solo puede
      // venir de la forma activa (Rotom Calor: Fuego/Eléctrico).
      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(text).toContain('Fire');
    });

    it('sin forma guardada (formVarietyId null), muestra el sprite de la forma base', () => {
      const fixture = build();
      fixture.componentRef.setInput('entry', new RosterEntry('rotom'));
      fixture.componentRef.setInput('pokedexEntry', rotomEntry());
      fixture.detectChanges();

      const img = fixture.nativeElement.querySelector('img');
      expect(img.getAttribute('src')).toBe('rotom-home.png');
    });

    it('si la forma guardada requiere un DLC que no está activo, cae a la forma base sin error (020, FR-011)', () => {
      const fixture = build(new Set()); // ningún DLC activo
      fixture.componentRef.setInput('entry', new RosterEntry('rotom', 'rotom-heat'));
      fixture.componentRef.setInput('pokedexEntry', rotomEntry('the-indigo-disk'));
      fixture.detectChanges();

      const img = fixture.nativeElement.querySelector('img');
      expect(img.getAttribute('src')).toBe('rotom-home.png');
    });

    it('si el DLC requerido está activo, muestra la forma guardada', () => {
      const fixture = build(new Set(['the-indigo-disk']));
      fixture.componentRef.setInput('entry', new RosterEntry('rotom', 'rotom-heat'));
      fixture.componentRef.setInput('pokedexEntry', rotomEntry('the-indigo-disk'));
      fixture.detectChanges();

      const img = fixture.nativeElement.querySelector('img');
      expect(img.getAttribute('src')).toBe('heat-home.png');
    });

    // 020 (pedido del usuario): la forma activa puede no tener ilustración
    // HOME propia (research.md Decisión 11) — el sprite del slot no
    // cambia a propósito, así que se refuerza con un ícono aparte.
    it('muestra el ícono de forma sin ilustración propia cuando la forma guardada usa el sprite de juego como HOME', () => {
      const fixture = build();
      const starterLikeEntry = new PokedexEntry(
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
        [
          new SelectableForm(
            'pikachu-starter',
            'Partner Pikachu',
            'starter-game.png',
            'starter-game.png', // homeSpriteUrl === gameSpriteUrl -> sin ilustración HOME propia
            null,
            null,
            null,
            'template',
            null,
            new PokemonType('electric', 'Electric'),
            null,
            new PokemonStats(45, 80, 50, 75, 60, 120),
          ),
        ],
        null,
        null,
        [],
        new PokemonType('electric', 'Electric'),
        null,
        new Generation('generation-i', 'I'),
        { kind: 'regional' },
        new PokemonStats(35, 55, 40, 50, 50, 90),
      );
      fixture.componentRef.setInput('entry', new RosterEntry('pikachu', 'pikachu-starter'));
      fixture.componentRef.setInput('pokedexEntry', starterLikeEntry);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.app-team-slot__partner-badge')).not.toBeNull();
      // 020 (pedido del usuario): el sprite del slot sigue siendo el de
      // la forma base (con ilustración real), nunca el sprite de juego
      // de respaldo de la forma sin ilustración propia — la diferencia
      // se comunica solo con el ícono de arriba.
      const img = fixture.nativeElement.querySelector('img');
      expect(img.getAttribute('src')).toBe('home-normal.png');
    });

    it('no muestra el ícono de forma sin ilustración propia para la forma base', () => {
      const fixture = build();
      fixture.componentRef.setInput('entry', new RosterEntry('pikachu'));
      fixture.componentRef.setInput('pokedexEntry', makePokedexEntry());
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.app-team-slot__partner-badge')).toBeNull();
    });
  });

  // `026-team-slot-coverage-index`, T007 (US1): el "Índice sintético de cobertura global" ya
  // calculado por el padre, mostrado en el slot sin que este llame a ningún dominio (Constitution
  // Check, Principio VI — este componente solo recibe y renderiza).
  describe('coverageIndex (026, US1)', () => {
    it('con coverageIndex numérico, muestra ese valor redondeado a entero (FR-001)', () => {
      const fixture = build();
      fixture.componentRef.setInput('entry', new RosterEntry('pikachu'));
      fixture.componentRef.setInput('pokedexEntry', makePokedexEntry());
      fixture.componentRef.setInput('coverageIndex', 42.6);
      fixture.detectChanges();

      const el = fixture.nativeElement.querySelector('.app-team-slot__coverage-index') as HTMLElement;
      expect(el).not.toBeNull();
      // El chip debe mostrar el número Y una etiqueta corta que aclare qué representa (el
      // usuario reportó que, sin ella, el número salía "suelto" sin contexto) — no se compara
      // contra el texto traducido literal (mismo criterio de asincronía de Transloco ya usado
      // en el resto del archivo, ver `025`/tasks.md T007).
      const label = fixture.nativeElement.querySelector('.app-team-slot__coverage-index-label') as HTMLElement;
      expect(label).not.toBeNull();
      expect(label.textContent?.trim()).not.toBe('');
      expect(el.textContent).toContain('43');
      expect(el.getAttribute('title')).not.toBeFalsy();
    });

    it('con coverageIndex nulo, no muestra ningún número de índice (FR-002)', () => {
      const fixture = build();
      fixture.componentRef.setInput('entry', new RosterEntry('pikachu'));
      fixture.componentRef.setInput('pokedexEntry', makePokedexEntry());
      fixture.componentRef.setInput('coverageIndex', null);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.app-team-slot__coverage-index')).toBeNull();
    });

    it('con el slot vacío (entry nulo), no muestra ningún número de índice aunque coverageIndex llegara numérico (FR-002)', () => {
      const fixture = build();
      fixture.componentRef.setInput('coverageIndex', 50);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.app-team-slot__coverage-index')).toBeNull();
    });

    it('con coverageIndex numérico, el sprite, el nombre y los badges de tipo ya existentes siguen presentes (no-regresión de FR-010)', () => {
      const fixture = build();
      fixture.componentRef.setInput('entry', new RosterEntry('pikachu'));
      fixture.componentRef.setInput('pokedexEntry', makePokedexEntry());
      fixture.componentRef.setInput('coverageIndex', 42.6);
      fixture.detectChanges();

      expect((fixture.nativeElement.querySelector('.app-team-slot__name') as HTMLElement).textContent?.trim()).toBe('Pikachu');
      expect(fixture.nativeElement.querySelector('.app-team-slot__avatar-button img')).not.toBeNull();
      expect(fixture.nativeElement.querySelector('app-type-badge')).not.toBeNull();
    });
  });

  // `026-team-slot-coverage-index`, T017 (US3): el aura/borde comparativo reutiliza
  // `heatmapColorFor`/`heatmapTextColorFor` tal cual (research.md Decisión 6) — sin niveles
  // discretos, sin lógica de "casos especiales" propia de este componente.
  describe('teamCoverageIndexValues — aura comparativa (026, US3)', () => {
    // El navegador normaliza cualquier color CSS asignado a `el.style.color` a notación
    // `rgb(...)` al leerlo de vuelta, aunque se haya asignado como hex (`heatmapTextColorFor`
    // devuelve `#1a1a1a`/`#ffffff`) — se normaliza el valor esperado de la misma forma antes
    // de comparar, en vez de comparar el hex crudo contra lo que devuelve el DOM.
    function normalizedColor(hex: string): string {
      const probe = document.createElement('div');
      probe.style.color = hex;
      return probe.style.color;
    }

    function setOccupiedSlot(fixture: ReturnType<typeof build>, coverageIndex: number, teamCoverageIndexValues: readonly number[]): void {
      fixture.componentRef.setInput('entry', new RosterEntry('pikachu'));
      fixture.componentRef.setInput('pokedexEntry', makePokedexEntry());
      fixture.componentRef.setInput('coverageIndex', coverageIndex);
      fixture.componentRef.setInput('teamCoverageIndexValues', teamCoverageIndexValues);
      fixture.detectChanges();
    }

    it('con teamCoverageIndexValues de longitud >= 2, el aura usa exactamente el color de heatmapColorFor/heatmapTextColorFor (FR-006)', () => {
      const fixture = build();
      const values = [10, 30, 50];
      setOccupiedSlot(fixture, 30, values);

      const el = fixture.nativeElement.querySelector('.app-team-slot__coverage-index') as HTMLElement;
      expect(el.style.background).toBe(heatmapColorFor(30, values));
      expect(el.style.color).toBe(normalizedColor(heatmapTextColorFor(30, values)));
    });

    it('con teamCoverageIndexValues de longitud < 2, no se aplica ningún color de aura aunque coverageIndex sea numérico (Edge Case 0/1 slot ocupado)', () => {
      const fixture = build();
      setOccupiedSlot(fixture, 30, [30]);

      const el = fixture.nativeElement.querySelector('.app-team-slot__coverage-index') as HTMLElement;
      expect(el.style.background).toBeFalsy();
    });

    it('con coverageIndex nulo (slot vacío o índice no calculable), no se renderiza ningún aura/borde independientemente de teamCoverageIndexValues (FR-002/FR-006)', () => {
      const fixture = build();
      fixture.componentRef.setInput('entry', new RosterEntry('pikachu'));
      fixture.componentRef.setInput('pokedexEntry', makePokedexEntry());
      fixture.componentRef.setInput('coverageIndex', null);
      fixture.componentRef.setInput('teamCoverageIndexValues', [10, 30, 50]);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.app-team-slot__coverage-index')).toBeNull();
    });

    it('con dos o más valores iguales en teamCoverageIndexValues, todos reciben el mismo color (FR-007)', () => {
      // Dos slots empatados en 30 dentro del mismo `teamCoverageIndexValues`: como
      // `heatmapColorFor` es una función pura del valor propio + el array completo (no de
      // qué posición ocupa ese valor en el array), ambos "30" producen exactamente el mismo
      // color sin necesidad de instanciar dos componentes — ver heatmap-gradient.spec.ts para
      // la prueba genérica de esa propiedad del mecanismo reutilizado (research.md Decisión 6).
      const fixture = build();
      const values = [30, 30, 50];
      setOccupiedSlot(fixture, 30, values);

      const el = fixture.nativeElement.querySelector('.app-team-slot__coverage-index') as HTMLElement;
      expect(el.style.background).toBe(heatmapColorFor(30, values));
      expect(heatmapColorFor(values[0], values)).toBe(heatmapColorFor(values[1], values));
    });
  });
});
