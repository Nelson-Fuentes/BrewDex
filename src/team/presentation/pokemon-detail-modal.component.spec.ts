import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { PokemonDetailModalComponent } from './pokemon-detail-modal.component';
import { PokedexEntry } from '../../pokemon/domain/entities/pokedex-entry';
import { Move } from '../../pokemon/domain/value-objects/move';
import { PokemonType } from '../../pokemon/domain/value-objects/pokemon-type';
import { PokemonStats } from '../../pokemon/domain/value-objects/pokemon-stats';
import { SelectableForm } from '../../pokemon/domain/value-objects/selectable-form';
import { Generation } from '../../game/domain/value-objects/generation';
import type { Gender } from '../../pokemon/domain/value-objects/gender';

interface EntryOverrides {
  homeSpriteShinyUrl?: string | null;
  genderRate?: number;
  homeSpriteFemaleUrl?: string | null;
  homeSpriteShinyFemaleUrl?: string | null;
  spriteUrl?: string | null;
  selectableForms?: readonly SelectableForm[];
  baseStats?: PokemonStats;
}

function makeEntry(overrides: EntryOverrides = {}): PokedexEntry {
  const {
    homeSpriteShinyUrl = 'shiny.png',
    genderRate = -1,
    homeSpriteFemaleUrl = null,
    homeSpriteShinyFemaleUrl = null,
    spriteUrl = null,
    selectableForms = [],
    baseStats = new PokemonStats(35, 55, 40, 50, 50, 90),
  } = overrides;
  return new PokedexEntry(
    'pikachu',
    'Pikachu',
    25,
    spriteUrl,
    'normal.png',
    homeSpriteShinyUrl,
    homeSpriteFemaleUrl,
    homeSpriteShinyFemaleUrl,
    genderRate,
    homeSpriteFemaleUrl !== null || homeSpriteShinyFemaleUrl !== null,
    selectableForms,
    null,
    null,
    [],
    new PokemonType('electric', 'Electric'),
    null,
    new Generation('generation-i', 'I'),
    { kind: 'regional' },
    baseStats,
  );
}

describe('PokemonDetailModalComponent', () => {
  function build(
    entry: PokedexEntry,
    isShiny = false,
    gender: Gender = 'male',
    formVarietyId: string | null = null,
    availableForms: readonly SelectableForm[] = [],
    generation: Generation | null = new Generation('generation-vi', 'VI'),
  ) {
    TestBed.configureTestingModule({
      imports: [PokemonDetailModalComponent, NoopAnimationsModule, TranslocoTestingModule.forRoot({ langs: { en: {} } })],
    });
    const fixture = TestBed.createComponent(PokemonDetailModalComponent);
    fixture.componentRef.setInput('pokedexEntry', entry);
    fixture.componentRef.setInput('isShiny', isShiny);
    fixture.componentRef.setInput('gender', gender);
    fixture.componentRef.setInput('formVarietyId', formVarietyId);
    fixture.componentRef.setInput('availableForms', availableForms);
    fixture.componentRef.setInput('generation', generation);
    fixture.detectChanges();
    return fixture;
  }

  it('muestra el nombre, los tipos y la imagen normal cuando isShiny es false', () => {
    const fixture = build(makeEntry());

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Pikachu');
    expect(text).toContain('Electric');
    expect(fixture.nativeElement.querySelector('img').getAttribute('src')).toBe('normal.png');
  });

  it('muestra la imagen shiny cuando isShiny es true', () => {
    const fixture = build(makeEntry(), true);

    expect(fixture.nativeElement.querySelector('img').getAttribute('src')).toBe('shiny.png');
  });

  it('cae a la imagen normal si no hay shiny disponible, aunque isShiny sea true', () => {
    const fixture = build(makeEntry({ homeSpriteShinyUrl: null }), true);

    expect(fixture.nativeElement.querySelector('img').getAttribute('src')).toBe('normal.png');
  });

  it('emite shinyChange al activar el toggle', () => {
    const fixture = build(makeEntry(), false);
    const spy = jasmine.createSpy('shinyChange');
    fixture.componentInstance.shinyChange.subscribe(spy);

    fixture.nativeElement.querySelector('mat-slide-toggle button').click();

    expect(spy).toHaveBeenCalledWith(true);
  });

  it('emite close al cerrar', () => {
    const fixture = build(makeEntry());
    const spy = jasmine.createSpy('close');
    fixture.componentInstance.close.subscribe(spy);

    fixture.nativeElement.querySelector('.app-detail-modal__close').click();

    expect(spy).toHaveBeenCalled();
  });

  // 019, User Story 1 (FR-002/FR-003/FR-007) — selector de género para especies duales
  describe('selector de género — especie de género dual', () => {
    function dualEntry(overrides: EntryOverrides = {}): PokedexEntry {
      return makeEntry({ genderRate: 4, ...overrides });
    }

    it('renderiza el toggle ♂/♀ con macho marcado por defecto', () => {
      const fixture = build(dualEntry());

      const group = fixture.nativeElement.querySelector('mat-button-toggle-group');
      expect(group).not.toBeNull();
      const toggles = fixture.nativeElement.querySelectorAll('mat-button-toggle');
      expect(toggles.length).toBe(2);
      expect(toggles[0].querySelector('button').getAttribute('aria-checked')).toBe('true');
      expect(toggles[1].querySelector('button').getAttribute('aria-checked')).toBe('false');
    });

    it('marca hembra como seleccionada cuando gender() es female', () => {
      const fixture = build(dualEntry(), false, 'female');

      const toggles = fixture.nativeElement.querySelectorAll('mat-button-toggle');
      expect(toggles[0].querySelector('button').getAttribute('aria-checked')).toBe('false');
      expect(toggles[1].querySelector('button').getAttribute('aria-checked')).toBe('true');
    });

    it('emite genderChange con "female" al tocar el ícono de hembra', () => {
      const fixture = build(dualEntry());
      const spy = jasmine.createSpy('genderChange');
      fixture.componentInstance.genderChange.subscribe(spy);

      const toggles = fixture.nativeElement.querySelectorAll('mat-button-toggle');
      toggles[1].querySelector('button').click();

      expect(spy).toHaveBeenCalledWith('female');
    });
  });

  // 019, User Story 2 (FR-004/FR-005/FR-006) — indicador fijo para especies no duales
  describe('selector de género — especies no duales', () => {
    it('muestra un indicador fijo ♂ sin toggle para especies exclusivamente macho', () => {
      const fixture = build(makeEntry({ genderRate: 0 }));

      expect(fixture.nativeElement.querySelector('mat-button-toggle-group')).toBeNull();
      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(text).toContain('♂');
    });

    it('muestra un indicador fijo ♀ sin toggle para especies exclusivamente hembra', () => {
      const fixture = build(makeEntry({ genderRate: 8 }), false, 'female');

      expect(fixture.nativeElement.querySelector('mat-button-toggle-group')).toBeNull();
      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(text).toContain('♀');
    });

    it('muestra un indicador fijo "—" sin toggle para especies sin género', () => {
      const fixture = build(makeEntry({ genderRate: -1 }), false, 'genderless');

      expect(fixture.nativeElement.querySelector('mat-button-toggle-group')).toBeNull();
      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(text).toContain('—');
    });
  });

  // 019, User Stories 3/4 (FR-008/FR-009/FR-010/FR-011) — la imagen sigue al género y al shiny
  describe('imagen según género y shiny', () => {
    function entryWithGenderDifferences(): PokedexEntry {
      return makeEntry({
        genderRate: 4,
        homeSpriteShinyUrl: 'shiny.png',
        homeSpriteFemaleUrl: 'female.png',
        homeSpriteShinyFemaleUrl: 'shiny-female.png',
      });
    }

    it('macho/no-shiny muestra homeSpriteUrl', () => {
      const fixture = build(entryWithGenderDifferences(), false, 'male');
      expect(fixture.nativeElement.querySelector('img').getAttribute('src')).toBe('normal.png');
    });

    it('hembra/no-shiny muestra homeSpriteFemaleUrl', () => {
      const fixture = build(entryWithGenderDifferences(), false, 'female');
      expect(fixture.nativeElement.querySelector('img').getAttribute('src')).toBe('female.png');
    });

    it('macho/shiny muestra homeSpriteShinyUrl', () => {
      const fixture = build(entryWithGenderDifferences(), true, 'male');
      expect(fixture.nativeElement.querySelector('img').getAttribute('src')).toBe('shiny.png');
    });

    it('hembra/shiny muestra homeSpriteShinyFemaleUrl', () => {
      const fixture = build(entryWithGenderDifferences(), true, 'female');
      expect(fixture.nativeElement.querySelector('img').getAttribute('src')).toBe('shiny-female.png');
    });

    it('sin sprite hembra, la imagen no cambia con el género (FR-009)', () => {
      const fixture = build(makeEntry({ genderRate: 4 }), false, 'female');
      expect(fixture.nativeElement.querySelector('img').getAttribute('src')).toBe('normal.png');
    });

    it('sin sprite shiny-hembra, cae al shiny base (hembra/shiny)', () => {
      const fixture = build(makeEntry({ genderRate: 4, homeSpriteFemaleUrl: 'female.png' }), true, 'female');
      expect(fixture.nativeElement.querySelector('img').getAttribute('src')).toBe('shiny.png');
    });
  });

  // 020, User Story 1 (FR-001/FR-003/FR-005/FR-009) — selector de forma con sprites
  describe('selector de forma', () => {
    function heatForm(): SelectableForm {
      return new SelectableForm(
        'rotom-heat',
        'Rotom Calor',
        'heat-game.png',
        'heat-home.png',
        'heat-home-shiny.png',
        null,
        null,
        'template',
        null,
        new PokemonType('fire', 'Fire'),
        new PokemonType('electric', 'Electric'),
        new PokemonStats(50, 65, 107, 105, 107, 86),
      );
    }

    function frostForm(): SelectableForm {
      return new SelectableForm(
        'rotom-frost',
        'Rotom Hielo',
        'frost-game.png',
        'frost-home.png',
        'frost-home-shiny.png',
        null,
        null,
        'template',
        null,
        new PokemonType('ice', 'Ice'),
        new PokemonType('electric', 'Electric'),
        new PokemonStats(50, 65, 107, 105, 107, 86),
      );
    }

    function rotomEntry(): PokedexEntry {
      return makeEntry({ spriteUrl: 'rotom-base.png', selectableForms: [heatForm(), frostForm()] });
    }

    it('renderiza un chip por la forma base y por cada forma disponible, base resaltada por defecto', () => {
      const fixture = build(rotomEntry(), false, 'male', null, [heatForm(), frostForm()]);

      const chips = fixture.nativeElement.querySelectorAll('.app-detail-modal__form-chip');
      expect(chips.length).toBe(3); // base + 2 formas
      expect(chips[0].querySelector('img').getAttribute('src')).toBe('rotom-base.png');
      expect(chips[1].querySelector('img').getAttribute('src')).toBe('heat-game.png');
      expect(chips[2].querySelector('img').getAttribute('src')).toBe('frost-game.png');
      expect(chips[0].classList).toContain('app-detail-modal__form-chip--active');
      expect(chips[1].classList).not.toContain('app-detail-modal__form-chip--active');
    });

    it('marca como activo el chip correspondiente a formVarietyId', () => {
      const fixture = build(rotomEntry(), false, 'male', 'rotom-heat', [heatForm(), frostForm()]);

      const chips = fixture.nativeElement.querySelectorAll('.app-detail-modal__form-chip');
      expect(chips[0].classList).not.toContain('app-detail-modal__form-chip--active');
      expect(chips[1].classList).toContain('app-detail-modal__form-chip--active');
    });

    it('emite formVarietyIdChange con el varietyId al tocar el chip de una forma alternativa', () => {
      const fixture = build(rotomEntry(), false, 'male', null, [heatForm(), frostForm()]);
      const spy = jasmine.createSpy('formVarietyIdChange');
      fixture.componentInstance.formVarietyIdChange.subscribe(spy);

      fixture.nativeElement.querySelectorAll('.app-detail-modal__form-chip')[1].click();

      expect(spy).toHaveBeenCalledWith('rotom-heat');
    });

    it('emite formVarietyIdChange con null al tocar el chip de la forma base', () => {
      const fixture = build(rotomEntry(), false, 'male', 'rotom-heat', [heatForm(), frostForm()]);
      const spy = jasmine.createSpy('formVarietyIdChange');
      fixture.componentInstance.formVarietyIdChange.subscribe(spy);

      fixture.nativeElement.querySelectorAll('.app-detail-modal__form-chip')[0].click();

      expect(spy).toHaveBeenCalledWith(null);
    });

    it('con formVarietyId null, el tipo y la imagen mostrados son los de la forma base', () => {
      const fixture = build(rotomEntry(), false, 'male', null, [heatForm(), frostForm()]);

      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(text).toContain('Electric');
      expect(text).not.toContain('Fire');
      // La imagen grande usa homeSpriteUrl (forma base), no el sprite de
      // grilla ('rotom-base.png') que solo alimenta el chip base del toggle.
      expect(fixture.nativeElement.querySelector('.app-detail-modal__sprite').getAttribute('src')).toBe('normal.png');
    });

    it('con formVarietyId de una forma alternativa, el tipo y la imagen mostrados son los de esa forma (FR-009)', () => {
      const fixture = build(rotomEntry(), false, 'male', 'rotom-heat', [heatForm(), frostForm()]);

      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(text).toContain('Fire');
      expect(fixture.nativeElement.querySelector('.app-detail-modal__sprite').getAttribute('src')).toBe('heat-home.png');
    });

    it('alternar entre dos formas de tipo distinto actualiza el tipo mostrado en cada caso (FR-009)', () => {
      const fixture = build(rotomEntry(), false, 'male', 'rotom-heat', [heatForm(), frostForm()]);
      expect((fixture.nativeElement.textContent ?? '')).toContain('Fire');

      fixture.componentRef.setInput('formVarietyId', 'rotom-frost');
      fixture.detectChanges();

      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(text).toContain('Ice');
      expect(text).not.toContain('Fire');
    });

    // 020, corrección 7 (bug reportado): formas sin ilustración HOME
    // propia (p. ej. el Pikachu inicial de Let's Go) caen al sprite de
    // juego como sprite HOME (research.md Decisión 11) — a ese tamaño de
    // chip puede no distinguirse a simple vista de la forma base, así
    // que se refuerza con el nombre en texto junto al sprite.
    function starterLikeForm(): SelectableForm {
      return new SelectableForm(
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
      );
    }

    it('muestra el nombre en texto junto al chip de una forma sin ilustración HOME propia', () => {
      const fixture = build(rotomEntry(), false, 'male', null, [starterLikeForm()]);

      const label = fixture.nativeElement.querySelector('.app-detail-modal__form-chip-label');
      expect(label).not.toBeNull();
      expect((label as HTMLElement).textContent?.trim()).toBe('Partner Pikachu');
    });

    it('no muestra nombre en texto junto a un chip con ilustración HOME propia', () => {
      const fixture = build(rotomEntry(), false, 'male', null, [heatForm(), frostForm()]);

      expect(fixture.nativeElement.querySelector('.app-detail-modal__form-chip-label')).toBeNull();
    });

    // 020-stats-bar-scale-color, User Story 3 (FR-005/FR-006) — el gráfico
    // de estadísticas usa las baseStats de la forma activa (rotom-heat:
    // 50/65/107/105/107/86), no las de la especie (Pikachu: 35/55/40/50/50/90).
    it('con una forma alternativa seleccionada, las barras usan sus propias baseStats, no las de la especie', () => {
      const fixture = build(rotomEntry(), false, 'male', 'rotom-heat', [heatForm(), frostForm()]);

      const fills = fixture.nativeElement.querySelectorAll('.app-stat-bar-fill');
      const widths = Array.from(fills).map((el) => Number.parseFloat((el as HTMLElement).style.width));
      const expected = [50, 65, 107, 105, 107, 86].map((v) => (v / 255) * 100);
      widths.forEach((width, i) => expect(width).toBeCloseTo(expected[i], 3));

      const values = fixture.nativeElement.querySelectorAll('.app-stat-value');
      expect(Array.from(values).map((el) => (el as HTMLElement).textContent)).toEqual(['50', '65', '107', '105', '107', '86']);
    });
  });

  // 020, User Story 2 (FR-002) — sin selector cuando no hay formas alternativas disponibles
  describe('selector de forma — sin formas disponibles', () => {
    it('no renderiza ningún chip de forma cuando availableForms está vacío', () => {
      const fixture = build(makeEntry());

      expect(fixture.nativeElement.querySelectorAll('.app-detail-modal__form-chip').length).toBe(0);
    });
  });

  // 020-stats-bar-scale-color, User Story 1 (FR-002/FR-004/FR-008) — escala
  // fija de 255 para el ancho de cada barra, no 200 ni el máximo entre las
  // seis estadísticas del propio Pokémon.
  describe('gráfico de estadísticas — escala', () => {
    function barWidths(fixture: ReturnType<typeof build>): number[] {
      const fills = fixture.nativeElement.querySelectorAll('.app-stat-bar-fill');
      return Array.from(fills).map((el) => Number.parseFloat((el as HTMLElement).style.width));
    }

    it('cada barra ocupa valor/255 del ancho, no valor/200 (Pikachu: 35/55/40/50/50/90)', () => {
      const fixture = build(makeEntry());

      const widths = barWidths(fixture);
      const expected = [35, 55, 40, 50, 50, 90].map((v) => (v / 255) * 100);
      widths.forEach((width, i) => expect(width).toBeCloseTo(expected[i], 3));
    });

    it('una estadística en 255 ocupa el 100% del ancho', () => {
      const fixture = build(makeEntry({ baseStats: new PokemonStats(255, 55, 40, 50, 50, 90) }));

      expect(barWidths(fixture)[0]).toBe(100);
    });

    it('una estadística en 0 ocupa el 0% del ancho, sin dejar de mostrar su etiqueta y valor (FR-008)', () => {
      const fixture = build(makeEntry({ baseStats: new PokemonStats(0, 55, 40, 50, 50, 90) }));

      expect(barWidths(fixture)[0]).toBe(0);
      const rows = fixture.nativeElement.querySelectorAll('.app-stat-row');
      expect((rows[0].querySelector('.app-stat-label') as HTMLElement).textContent).toBe('HP');
      expect((rows[0].querySelector('.app-stat-value') as HTMLElement).textContent).toBe('0');
    });
  });

  // 020-stats-bar-scale-color, User Story 2 (FR-003/FR-004) — color continuo
  // rojo→amarillo→verde según el valor, ya no un color fijo por estadística.
  describe('gráfico de estadísticas — color', () => {
    function barColors(fixture: ReturnType<typeof build>): string[] {
      const fills = fixture.nativeElement.querySelectorAll('.app-stat-bar-fill');
      return Array.from(fills).map((el) => (el as HTMLElement).style.background);
    }

    it('una estadística en 0 es rojo puro y una en 255 es verde puro', () => {
      const fixture = build(makeEntry({ baseStats: new PokemonStats(0, 55, 40, 50, 50, 255) }));

      const colors = barColors(fixture);
      expect(colors[0]).toBe('rgb(255, 0, 0)');
      expect(colors[5]).toBe('rgb(0, 255, 0)');
    });

    it('dos estadísticas distintas con igual valor numérico muestran el mismo color', () => {
      // Ataque (55) y Defensa Especial (50) por defecto son distintas; se
      // igualan aquí para verificar que el color depende solo del valor,
      // no del tipo de estadística (ya sin clases --atk/--spd fijas).
      const fixture = build(makeEntry({ baseStats: new PokemonStats(35, 88, 40, 50, 88, 90) }));

      const colors = barColors(fixture);
      expect(colors[1]).toBe(colors[4]); // ATK y SPD, ambas en 88
    });
  });

  // 023, User Story 1 (FR-002/FR-010) — la sección de Análisis de Cobertura
  // recibe la generación tal cual, y sus tipos/stats reflejan activeForm(),
  // no pokedexEntry() (mismo patrón que el gráfico de estadísticas, `020`).
  describe('sección de Análisis de Cobertura', () => {
    it('reenvía el input generation tal cual a <app-coverage-analysis-table>', () => {
      const generation = new Generation('generation-i', 'I');
      const fixture = build(makeEntry(), false, 'male', null, [], generation);

      const rows = fixture.nativeElement.querySelectorAll('app-coverage-analysis-table tbody tr');
      // Era I: 15 tipos (sin Acero/Siniestro/Hada) — confirma que la
      // generación recibida por el modal llegó tal cual al componente hijo.
      expect(rows.length).toBe(15);
    });

    it('con una forma activa de tipos distintos a los de la especie, la tabla usa los tipos/stats de activeForm() (FR-009/FR-010)', () => {
      const heat = new SelectableForm(
        'rotom-heat',
        'Rotom Calor',
        'heat-game.png',
        'heat-home.png',
        'heat-home-shiny.png',
        null,
        null,
        'template',
        null,
        new PokemonType('fire', 'Fire'),
        new PokemonType('electric', 'Electric'),
        new PokemonStats(50, 65, 107, 105, 107, 86),
      );
      const entry = makeEntry({ selectableForms: [heat] });
      const fixture = build(entry, false, 'male', 'rotom-heat', [heat]);

      // Fila "water": Agua es neutral (1×) contra Eléctrico puro (el tipo de
      // la especie, Pikachu), pero súper efectiva (2×) contra Fuego y neutral
      // (1×) contra Eléctrico en la forma activa (Fuego/Eléctrico) → eficacia
      // combinada 2, claramente distinta del 1 que daría el tipo de la
      // especie — confirma que la tabla usa activeForm(), no pokedexEntry().
      const rows = Array.from(fixture.nativeElement.querySelectorAll('app-coverage-analysis-table tbody tr')) as HTMLElement[];
      // Nota: las filas de la tabla de cobertura usan el `PokemonType` canónico
      // de `type-effectiveness.ts` (label = id en minúscula, mismo criterio que
      // el resto del dominio — ver research.md), no las etiquetas capitalizadas
      // usadas arriba para los tipos propios del Pokémon (p. ej. "Fire").
      const waterRow = rows.find((row) => row.querySelector('app-type-badge')?.textContent?.trim() === 'water');
      expect(waterRow).toBeDefined();
      // La celda incluye una etiqueta descriptiva desde la implementación directa del
      // 2026-09-10 ("2× (Débil)"), ya no solo el número — se confirma el prefijo "2×".
      expect(waterRow!.querySelectorAll('td')[1].textContent?.trim().startsWith('2×')).toBeTrue();
    });

    it('cambiar formVarietyId recalcula la tabla de cobertura sin recrear el componente (FR-010/SC-004, remediación C1)', () => {
      const heat = new SelectableForm(
        'rotom-heat',
        'Rotom Calor',
        'heat-game.png',
        'heat-home.png',
        'heat-home-shiny.png',
        null,
        null,
        'template',
        null,
        new PokemonType('fire', 'Fire'),
        new PokemonType('electric', 'Electric'),
        new PokemonStats(50, 65, 107, 105, 107, 86),
      );
      const frost = new SelectableForm(
        'rotom-frost',
        'Rotom Hielo',
        'frost-game.png',
        'frost-home.png',
        'frost-home-shiny.png',
        null,
        null,
        'template',
        null,
        new PokemonType('ice', 'Ice'),
        new PokemonType('electric', 'Electric'),
        new PokemonStats(50, 65, 107, 105, 107, 86),
      );
      const entry = makeEntry({ selectableForms: [heat, frost] });
      const fixture = build(entry, false, 'male', 'rotom-heat', [heat, frost]);

      const typeBadgesBefore = Array.from(fixture.nativeElement.querySelectorAll('.app-detail-modal__types app-type-badge')).map(
        (el) => (el as HTMLElement).textContent?.trim(),
      );
      expect(typeBadgesBefore).toEqual(['Fire', 'Electric']);

      fixture.componentRef.setInput('formVarietyId', 'rotom-frost');
      fixture.detectChanges();

      const typeBadgesAfter = Array.from(fixture.nativeElement.querySelectorAll('.app-detail-modal__types app-type-badge')).map(
        (el) => (el as HTMLElement).textContent?.trim(),
      );
      expect(typeBadgesAfter).toEqual(['Ice', 'Electric']);

      // La tabla de cobertura sigue presente y recalculada — 18 filas para
      // generación VI (por defecto en build()), sin haberse recreado el
      // componente (el mismo <app-coverage-analysis-table> sigue en el DOM).
      const rows = fixture.nativeElement.querySelectorAll('app-coverage-analysis-table tbody tr');
      expect(rows.length).toBe(18);
    });

    // 024, User Story 1 (FR-002) — `resolvedMoveSlots` (ya usado por la
    // sección "Movimientos") se reenvía tal cual al input `moveSlots` de
    // <app-coverage-analysis-table>, sin resolver el movepool de nuevo.
    it('reenvía resolvedMoveSlots tal cual al input moveSlots de <app-coverage-analysis-table>', () => {
      const fireType = new PokemonType('fire', 'Fire');
      const flamethrower = new Move('flamethrower', 'Lanzallamas', fireType, 'special', 15, 90, '', 100);
      const fixture = build(makeEntry());
      fixture.componentRef.setInput('resolvedMoveSlots', [flamethrower, null, null, null]);
      fixture.detectChanges();

      // El encabezado tiene 2 filas (fila de grupos + fila de columnas, implementación
      // directa 2026-09-10): se toman solo los `<th>` de la fila de columnas (la última).
      const headerRows = fixture.nativeElement.querySelectorAll('app-coverage-analysis-table thead tr');
      const headers = Array.from(headerRows[headerRows.length - 1].querySelectorAll('th')) as HTMLElement[];
      expect(headers[3].textContent?.trim()).toBe('Lanzallamas');
    });
  });
});
