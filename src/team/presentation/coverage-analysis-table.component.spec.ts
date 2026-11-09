import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { Generation } from '../../game/domain/value-objects/generation';
import { Move } from '../../pokemon/domain/value-objects/move';
import { attackTypesForGeneration } from '../../pokemon/domain/value-objects/type-effectiveness';
import { PokemonStats } from '../../pokemon/domain/value-objects/pokemon-stats';
import { PokemonType } from '../../pokemon/domain/value-objects/pokemon-type';
import { CoverageAnalysisTableComponent } from './coverage-analysis-table.component';

const STATS = new PokemonStats(80, 70, 70, 65, 65, 60);
const NO_MOVES: readonly [null, null, null, null] = [null, null, null, null];

function createFixture(moveSlots: readonly (Move | null)[] = NO_MOVES): ComponentFixture<CoverageAnalysisTableComponent> {
  TestBed.configureTestingModule({
    imports: [
      CoverageAnalysisTableComponent,
      TranslocoTestingModule.forRoot({
        langs: {
          en: {
            team: {
              coverageSectionLabel: 'Coverage Analysis',
              coverageTypeColumnLabel: 'Type',
              coverageEfficacyColumnLabel: 'Efficacy',
              coverageDefenseColumnLabel: 'Defense',
              coverageUnavailable: 'No type effectiveness table is defined for this generation.',
              coverageAttackCoefficientNotApplicable: '—',
              coverageAverageColumnLabel: 'Average',
              coverageCoefficientColumnLabel: 'Coverage Coefficient',
              coverageTotalRowLabel: 'Total',
              coverageTabAll: 'All types',
              coverageTabSuperEffective: 'Super effective',
              coverageTabBlindSpots: 'Blind spots / Low',
              coverageSearchPlaceholder: 'Search target type...',
              coverageSortLabel: 'Sort by',
              coverageSortOriginal: 'Original order',
              coverageSortCoverageDesc: 'Coverage (highest first)',
              coverageSortCoverageAsc: 'Coverage (lowest first)',
              coverageSortAlpha: 'Type (A-Z)',
              coverageGroupDefense: 'Defensive profile',
              coverageGroupOffense: 'Offense by move',
              coverageGroupFinal: 'Final evaluation',
              coverageEfficacyImmune: 'Immune',
              coverageEfficacyResists: 'Resists',
              coverageEfficacyNeutral: 'Neutral',
              coverageEfficacyWeak: 'Weak',
              coverageSummaryTitle: 'Global coverage synthesis index',
              coverageSummaryDescription: 'Summary description',
              coverageSummaryScoreLabel: 'Global score',
              emptyMoveSlot: 'Choose a move',
            },
          },
        },
        preloadLangs: true,
      }),
    ],
  });
  const fixture = TestBed.createComponent(CoverageAnalysisTableComponent);
  fixture.componentRef.setInput('moveSlots', moveSlots);
  return fixture;
}

describe('CoverageAnalysisTableComponent', () => {
  it('con dos tipos y una generación de era VI+, muestra 18 filas en el orden de attackTypesForGeneration', () => {
    const fixture = createFixture();
    const grass = new PokemonType('grass', 'grass');
    const poison = new PokemonType('poison', 'poison');
    const generation = new Generation('generation-vi', 'VI');
    fixture.componentRef.setInput('pokemonTypes', [grass, poison]);
    fixture.componentRef.setInput('stats', STATS);
    fixture.componentRef.setInput('generation', generation);
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(18);

    // El badge de tipo muestra su `label` como texto (mismo id/label crudo
    // de PokeAPI usado en todo el dominio, ver research.md) — se compara
    // el orden de esos textos contra el orden fijo esperado (Clarifications Q1).
    const expectedOrder = (attackTypesForGeneration(generation) ?? []).map((t) => t.label);
    const renderedOrder = Array.from(rows as NodeListOf<HTMLElement>).map(
      (row) => row.querySelector('app-type-badge')?.textContent?.trim() ?? '',
    );
    expect(renderedOrder).toEqual(expectedOrder);
  });

  it('con un solo tipo, la eficacia de una fila no se multiplica por un segundo factor (FR-005)', () => {
    const fixture = createFixture();
    const ground = new PokemonType('ground', 'ground');
    fixture.componentRef.setInput('pokemonTypes', [ground]);
    fixture.componentRef.setInput('stats', STATS);
    fixture.componentRef.setInput('generation', new Generation('generation-vi', 'VI'));
    fixture.detectChanges();

    // Eléctrico no tiene efecto sobre Tierra (0×) — fila esperada con eficacia 0.
    // El texto de la celda incluye una etiqueta descriptiva desde la implementación
    // directa del 2026-09-10 ("0× (Inmune)"), ya no solo el número — se confirma que
    // empieza con "0×" en vez de comparar contra el string exacto traducido.
    const rows = Array.from(fixture.nativeElement.querySelectorAll('tbody tr')) as HTMLElement[];
    const electricRowIndex = (attackTypesForGeneration(new Generation('generation-vi', 'VI')) ?? []).findIndex((t) => t.id === 'electric');
    const electricRow = rows[electricRowIndex];
    const cells = electricRow.querySelectorAll('td');
    expect(cells[1].textContent?.trim().startsWith('0×')).toBeTrue();
  });

  it('con una generación de era I, muestra 15 filas sin Acero/Siniestro/Hada (FR-002)', () => {
    const fixture = createFixture();
    const normal = new PokemonType('normal', 'normal');
    fixture.componentRef.setInput('pokemonTypes', [normal]);
    fixture.componentRef.setInput('stats', STATS);
    fixture.componentRef.setInput('generation', new Generation('generation-i', 'I'));
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(15);
  });

  it('con una generación de era II-V, muestra 17 filas con Acero/Siniestro, sin Hada (FR-002)', () => {
    const fixture = createFixture();
    const normal = new PokemonType('normal', 'normal');
    fixture.componentRef.setInput('pokemonTypes', [normal]);
    fixture.componentRef.setInput('stats', STATS);
    fixture.componentRef.setInput('generation', new Generation('generation-iii', 'III'));
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(17);
  });

  it('con una generación de id no reconocido, muestra el mensaje de FR-012 y no la tabla', () => {
    const fixture = createFixture();
    const normal = new PokemonType('normal', 'normal');
    fixture.componentRef.setInput('pokemonTypes', [normal]);
    fixture.componentRef.setInput('stats', STATS);
    fixture.componentRef.setInput('generation', new Generation('generation-desconocida', '?'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('table')).toBeNull();
    expect(fixture.nativeElement.querySelector('.app-coverage-table__unavailable')).not.toBeNull();
  });

  it('con generation null (aún sin juego seleccionado), muestra el mensaje de FR-012 y no la tabla', () => {
    const fixture = createFixture();
    const normal = new PokemonType('normal', 'normal');
    fixture.componentRef.setInput('pokemonTypes', [normal]);
    fixture.componentRef.setInput('stats', STATS);
    fixture.componentRef.setInput('generation', null);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('table')).toBeNull();
    expect(fixture.nativeElement.querySelector('.app-coverage-table__unavailable')).not.toBeNull();
  });

  // 023, User Story 2 (FR-007/FR-008/FR-009) — mapa de calor por columna.
  describe('mapa de calor', () => {
    function cellBackgrounds(fixture: ComponentFixture<CoverageAnalysisTableComponent>, columnIndex: 1 | 2): string[] {
      const rows = Array.from(fixture.nativeElement.querySelectorAll('tbody tr')) as HTMLElement[];
      return rows.map((row) => (row.querySelectorAll('td')[columnIndex] as HTMLElement).style.background);
    }

    it('la celda de mayor eficacia y la de menor eficacia tienen un color de fondo distinto entre sí', () => {
      const fixture = createFixture();
      const grass = new PokemonType('grass', 'grass');
      const poison = new PokemonType('poison', 'poison');
      fixture.componentRef.setInput('pokemonTypes', [grass, poison]);
      fixture.componentRef.setInput('stats', STATS);
      fixture.componentRef.setInput('generation', new Generation('generation-vi', 'VI'));
      fixture.detectChanges();

      const backgrounds = cellBackgrounds(fixture, 1);
      expect(new Set(backgrounds).size).toBeGreaterThan(1);
    });

    it('las columnas de eficacia y de coeficiente de defensa calculan su gradiente de forma independiente', () => {
      const fixture = createFixture();
      const grass = new PokemonType('grass', 'grass');
      const poison = new PokemonType('poison', 'poison');
      fixture.componentRef.setInput('pokemonTypes', [grass, poison]);
      fixture.componentRef.setInput('stats', STATS);
      fixture.componentRef.setInput('generation', new Generation('generation-vi', 'VI'));
      fixture.detectChanges();

      // Misma fila (misma posición), pero cada columna posiciona su color
      // según su propio mínimo/máximo — no tienen por qué coincidir.
      const efficacyBackgrounds = cellBackgrounds(fixture, 1);
      const defenseBackgrounds = cellBackgrounds(fixture, 2);
      expect(efficacyBackgrounds).not.toEqual(defenseBackgrounds);
    });

    it('una columna con todos los valores iguales muestra un único color consistente en todas sus celdas (FR-009)', () => {
      const fixture = createFixture();
      // Con todas las estadísticas en 0, ((defensa especial + defensa física) / 2)
      // + 0.3 × PS = 0, así que el coeficiente de defensa (0 dividido por
      // cualquier divisor, incluido 0.125) es exactamente 0 en TODA fila,
      // sin importar su eficacia — la columna completa tiene min = máx = 0,
      // un caso determinístico y no una coincidencia de un subconjunto.
      const normal = new PokemonType('normal', 'normal');
      fixture.componentRef.setInput('pokemonTypes', [normal]);
      fixture.componentRef.setInput('stats', new PokemonStats(0, 0, 0, 0, 0, 0));
      fixture.componentRef.setInput('generation', new Generation('generation-vi', 'VI'));
      fixture.detectChanges();

      const defenseTexts = Array.from(fixture.nativeElement.querySelectorAll('tbody tr')).map(
        (row) => (row as HTMLElement).querySelectorAll('td')[2].textContent?.trim(),
      );
      expect(defenseTexts.every((text) => text === '0')).toBeTrue();

      const defenseBackgrounds = cellBackgrounds(fixture, 2);
      expect(new Set(defenseBackgrounds).size).toBe(1);
    });
  });

  // 024, User Story 1 — 4 columnas de coeficiente de ataque por movimiento.
  describe('coeficiente de ataque por movimiento (024, US1)', () => {
    const fireType = new PokemonType('fire', 'fire');
    const flyingType = new PokemonType('flying', 'flying');
    const groundType = new PokemonType('ground', 'ground');
    const charizardStats = new PokemonStats(78, 84, 78, 109, 85, 100);
    const flamethrower = new Move('flamethrower', 'Lanzallamas', fireType, 'special', 15, 90, '', 100);
    const earthquake = new Move('earthquake', 'Terremoto', groundType, 'physical', 10, 100, '', 100);

    it('agrega una columna por cada movimiento equipado, con su nombre en el encabezado y el valor entero por fila', () => {
      const fixture = createFixture([flamethrower, earthquake, null, null]);
      fixture.componentRef.setInput('pokemonTypes', [fireType, flyingType]);
      fixture.componentRef.setInput('stats', charizardStats);
      fixture.componentRef.setInput('generation', new Generation('generation-vi', 'VI'));
      fixture.detectChanges();

      // El encabezado tiene 2 filas (fila de grupos + fila de columnas, implementación
      // directa 2026-09-10): se toman solo los `<th>` de la fila de columnas (la última).
      const headerRows = fixture.nativeElement.querySelectorAll('thead tr');
      const headers = Array.from(headerRows[headerRows.length - 1].querySelectorAll('th')) as HTMLElement[];
      // 3 columnas de 023 (tipo, eficacia, defensa) + 4 de movimiento + 1 de promedio + 1 de cobertura (025) = 9.
      expect(headers.length).toBe(9);
      // Encabezados de movimiento: interpolación directa de `move.displayName` (no vía transloco).
      expect(headers[3].textContent?.trim()).toBe('Lanzallamas');
      expect(headers[4].textContent?.trim()).toBe('Terremoto');
      // Slot vacío: usa una clave transloco (`team.emptyMoveSlot`) — solo se confirma que
      // NO repite el nombre de un movimiento, sin depender del texto traducido exacto
      // (la carga de traducciones en `TranslocoTestingModule` es asíncrona).
      expect(headers[5].textContent?.trim()).not.toBe('Lanzallamas');
      expect(headers[5].textContent?.trim()).not.toBe('Terremoto');

      const rows = Array.from(fixture.nativeElement.querySelectorAll('tbody tr')) as HTMLElement[];
      const attackTypes = attackTypesForGeneration(new Generation('generation-vi', 'VI')) ?? [];
      const grassRowIndex = attackTypes.findIndex((t) => t.id === 'grass');
      const grassCells = rows[grassRowIndex].querySelectorAll('td');
      // Lanzallamas: (109 + 20) * (90/100) * 1.5 * 2 = 348.3 → redondeado 348, columna índice 3
      expect(grassCells[3].textContent?.trim()).toBe('348');
      // Terremoto: (84 + 20) * (100/100) * 1 * 0.5 = 52 → columna índice 4
      expect(grassCells[4].textContent?.trim()).toBe('52');
    });
  });

  // 024, User Story 2 — indicador de "no aplica" inequívoco (nunca "0").
  describe('indicador de "no aplica" (024, US2)', () => {
    const fireType = new PokemonType('fire', 'fire');
    const flyingType = new PokemonType('flying', 'flying');
    const normalType = new PokemonType('normal', 'normal');
    const charizardStats = new PokemonStats(78, 84, 78, 109, 85, 100);
    const swordsDance = new Move('swords-dance', 'Danza Espada', normalType, 'status', 20, null, '', null);

    it('un movimiento de estado y un slot vacío muestran el mismo indicador en todas las filas, nunca 0', async () => {
      const fixture = createFixture([swordsDance, null, null, null]);
      fixture.componentRef.setInput('pokemonTypes', [fireType, flyingType]);
      fixture.componentRef.setInput('stats', charizardStats);
      fixture.componentRef.setInput('generation', new Generation('generation-vi', 'VI'));
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const rows = Array.from(fixture.nativeElement.querySelectorAll('tbody tr')) as HTMLElement[];
      const indicators = new Set<string>();
      for (const row of rows) {
        const cells = row.querySelectorAll('td');
        const slot0Text = cells[3].textContent?.trim() ?? '';
        const slot1Text = cells[4].textContent?.trim() ?? '';
        expect(slot0Text).not.toBe('0');
        expect(slot0Text).not.toBe('');
        expect(slot1Text).toBe(slot0Text);
        expect((cells[3] as HTMLElement).style.background).toBe('');
        indicators.add(slot0Text);
      }
      // Mismo indicador en todas las filas, tanto para el slot de estado como para el slot vacío.
      expect(indicators.size).toBe(1);
    });
  });

  // 024, User Story 3 — columna de promedio con divisor variable.
  describe('columna de promedio (024, US3)', () => {
    const fireType = new PokemonType('fire', 'fire');
    const flyingType = new PokemonType('flying', 'flying');
    const groundType = new PokemonType('ground', 'ground');
    const normalType = new PokemonType('normal', 'normal');
    const charizardStats = new PokemonStats(78, 84, 78, 109, 85, 100);
    const flamethrower = new Move('flamethrower', 'Lanzallamas', fireType, 'special', 15, 90, '', 100);
    const earthquake = new Move('earthquake', 'Terremoto', groundType, 'physical', 10, 100, '', 100);
    const swordsDance = new Move('swords-dance', 'Danza Espada', normalType, 'status', 20, null, '', null);

    it('divide solo entre los movimientos físicos/especiales calculables (no un 4 fijo)', () => {
      const fixture = createFixture([flamethrower, earthquake, swordsDance, null]);
      fixture.componentRef.setInput('pokemonTypes', [fireType, flyingType]);
      fixture.componentRef.setInput('stats', charizardStats);
      fixture.componentRef.setInput('generation', new Generation('generation-vi', 'VI'));
      fixture.detectChanges();

      const rows = Array.from(fixture.nativeElement.querySelectorAll('tbody tr')) as HTMLElement[];
      const attackTypes = attackTypesForGeneration(new Generation('generation-vi', 'VI')) ?? [];
      const grassRowIndex = attackTypes.findIndex((t) => t.id === 'grass');
      const grassCells = rows[grassRowIndex].querySelectorAll('td');

      // (348.3 + 52) / 2 = 200.15 → redondeado 200 (promedio, columna final, índice 7)
      expect(grassCells[7].textContent?.trim()).toBe('200');
    });

    it('cuando ningún movimiento equipado es físico/especial, la columna de promedio muestra el mismo indicador de "no aplica"', () => {
      const fixture = createFixture([swordsDance, null, null, null]);
      fixture.componentRef.setInput('pokemonTypes', [fireType, flyingType]);
      fixture.componentRef.setInput('stats', charizardStats);
      fixture.componentRef.setInput('generation', new Generation('generation-vi', 'VI'));
      fixture.detectChanges();

      const rows = Array.from(fixture.nativeElement.querySelectorAll('tbody tr')) as HTMLElement[];
      const averages = new Set<string>();
      for (const row of rows) {
        const cells = row.querySelectorAll('td');
        const averageText = cells[7].textContent?.trim() ?? '';
        expect(averageText).not.toBe('0');
        expect((cells[7] as HTMLElement).style.background).toBe('');
        averages.add(averageText);
      }
      expect(averages.size).toBe(1);
    });
  });

  // 024, User Story 4 — mapa de calor por columna de movimiento/promedio.
  describe('mapa de calor en columnas de ataque (024, US4)', () => {
    const fireType = new PokemonType('fire', 'fire');
    const flyingType = new PokemonType('flying', 'flying');
    const groundType = new PokemonType('ground', 'ground');
    const charizardStats = new PokemonStats(78, 84, 78, 109, 85, 100);
    const flamethrower = new Move('flamethrower', 'Lanzallamas', fireType, 'special', 15, 90, '', 100);
    const earthquake = new Move('earthquake', 'Terremoto', groundType, 'physical', 10, 100, '', 100);

    it('la fila de mayor y la de menor valor de una columna de movimiento tienen colores distintos', () => {
      const fixture = createFixture([flamethrower, earthquake, null, null]);
      fixture.componentRef.setInput('pokemonTypes', [fireType, flyingType]);
      fixture.componentRef.setInput('stats', charizardStats);
      fixture.componentRef.setInput('generation', new Generation('generation-vi', 'VI'));
      fixture.detectChanges();

      const rows = Array.from(fixture.nativeElement.querySelectorAll('tbody tr')) as HTMLElement[];
      const backgrounds = rows.map((row) => (row.querySelectorAll('td')[3] as HTMLElement).style.background);
      expect(new Set(backgrounds).size).toBeGreaterThan(1);
    });

    it('la columna de promedio calcula su propio gradiente, independiente de las columnas de movimiento', () => {
      const fixture = createFixture([flamethrower, earthquake, null, null]);
      fixture.componentRef.setInput('pokemonTypes', [fireType, flyingType]);
      fixture.componentRef.setInput('stats', charizardStats);
      fixture.componentRef.setInput('generation', new Generation('generation-vi', 'VI'));
      fixture.detectChanges();

      const rows = Array.from(fixture.nativeElement.querySelectorAll('tbody tr')) as HTMLElement[];
      const moveBackgrounds = rows.map((row) => (row.querySelectorAll('td')[3] as HTMLElement).style.background);
      const averageBackgrounds = rows.map((row) => (row.querySelectorAll('td')[7] as HTMLElement).style.background);
      expect(averageBackgrounds).not.toEqual(moveBackgrounds);
    });
  });

  // 025, User Story 1 — columna final de coeficiente de cobertura (media armónica).
  describe('columna de coeficiente de cobertura (025, US1)', () => {
    const fireType = new PokemonType('fire', 'fire');
    const flyingType = new PokemonType('flying', 'flying');
    const groundType = new PokemonType('ground', 'ground');
    const charizardStats = new PokemonStats(78, 84, 78, 109, 85, 100);
    const flamethrower = new Move('flamethrower', 'Lanzallamas', fireType, 'special', 15, 90, '', 100);
    const earthquake = new Move('earthquake', 'Terremoto', groundType, 'physical', 10, 100, '', 100);

    it('muestra el valor entero de la media armónica por fila, con su propio mapa de calor (FR-002/FR-004)', () => {
      const fixture = createFixture([flamethrower, earthquake, null, null]);
      fixture.componentRef.setInput('pokemonTypes', [fireType, flyingType]);
      fixture.componentRef.setInput('stats', charizardStats);
      fixture.componentRef.setInput('generation', new Generation('generation-vi', 'VI'));
      fixture.detectChanges();

      // El encabezado ahora tiene 2 filas (fila de grupos + fila de columnas, implementación
      // directa 2026-09-10): se cuentan solo los `<th>` de la fila de columnas (la última).
      const headerRows = fixture.nativeElement.querySelectorAll('thead tr');
      const headers = Array.from(headerRows[headerRows.length - 1].querySelectorAll('th')) as HTMLElement[];
      expect(headers.length).toBe(9);

      const rows = Array.from(fixture.nativeElement.querySelectorAll('tbody tr')) as HTMLElement[];
      const attackTypes = attackTypesForGeneration(new Generation('generation-vi', 'VI')) ?? [];
      const grassRowIndex = attackTypes.findIndex((t) => t.id === 'grass');
      const grassCells = rows[grassRowIndex].querySelectorAll('td');
      // defenseCoefficient/averageAttackCoefficient (grass) ya verificados en defensive-coverage.spec.ts;
      // aquí solo se confirma que la columna final (índice 8) muestra un número con color de fondo
      // (paleta semáforo, implementación directa 2026-09-10).
      const coverageCell = grassCells[8] as HTMLElement;
      expect(coverageCell.textContent?.trim()).not.toBe('');
      expect(Number.isFinite(Number(coverageCell.textContent?.trim()))).toBeTrue();
      expect(coverageCell.style.background).not.toBe('');

      const backgrounds = Array.from(rows).map((row) => (row.querySelectorAll('td')[8] as HTMLElement).style.background);
      expect(new Set(backgrounds).size).toBeGreaterThan(1);
    });
  });

  // 025, User Story 2 — coeficiente de cobertura coherente sin movimientos ofensivos.
  describe('coeficiente de cobertura sin movimientos ofensivos equipados (025, US2)', () => {
    const fireType = new PokemonType('fire', 'fire');
    const flyingType = new PokemonType('flying', 'flying');
    const normalType = new PokemonType('normal', 'normal');
    const charizardStats = new PokemonStats(78, 84, 78, 109, 85, 100);
    const swordsDance = new Move('swords-dance', 'Danza Espada', normalType, 'status', 20, null, '', null);

    it('muestra defenseCoefficient/2 con color normal, mientras ataque/promedio muestran "no aplica" (US2 Acceptance Scenario 2)', () => {
      const fixture = createFixture([swordsDance, swordsDance, swordsDance, null]);
      fixture.componentRef.setInput('pokemonTypes', [fireType, flyingType]);
      fixture.componentRef.setInput('stats', charizardStats);
      fixture.componentRef.setInput('generation', new Generation('generation-vi', 'VI'));
      fixture.detectChanges();

      const rows = Array.from(fixture.nativeElement.querySelectorAll('tbody tr')) as HTMLElement[];
      for (const row of rows) {
        const cells = row.querySelectorAll('td');
        // Columnas de movimiento (índices 3-6) y de promedio (índice 7): "no aplica", sin color.
        for (const idx of [3, 4, 5, 6, 7]) {
          expect(cells[idx].textContent?.trim()).not.toBe('');
          expect((cells[idx] as HTMLElement).style.background).toBe('');
        }
        // Columna de coeficiente de cobertura (índice 8): numérica, con color de fondo.
        const coverageCell = cells[8] as HTMLElement;
        expect(coverageCell.textContent?.trim()).not.toBe('');
        expect(Number.isFinite(Number(coverageCell.textContent?.trim()))).toBeTrue();
        expect(coverageCell.style.background).not.toBe('');
      }
    });
  });

  // 025, User Story 3 — fila de Total.
  describe('fila de Total (025, US3)', () => {
    const grass = new PokemonType('grass', 'grass');
    const poison = new PokemonType('poison', 'poison');

    it('agrega una fila en tfoot con aria-label "Total", solo la celda de cobertura con valor, sin mapa de calor', async () => {
      const fixture = createFixture();
      fixture.componentRef.setInput('pokemonTypes', [grass, poison]);
      fixture.componentRef.setInput('stats', STATS);
      fixture.componentRef.setInput('generation', new Generation('generation-vi', 'VI'));
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      // La fila de Total vive en <tfoot>, no en <tbody> — no debe alterar el conteo de filas de tipo.
      expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(18);

      const totalRow = fixture.nativeElement.querySelector('tfoot tr') as HTMLElement;
      expect(totalRow).not.toBeNull();
      // No se compara contra el texto traducido literal (la carga de traducciones en
      // TranslocoTestingModule es asíncrona, mismo criterio que el resto de este archivo
      // para claves estáticas) — solo se confirma que el atributo existe y no queda vacío.
      expect(totalRow.getAttribute('aria-label')).toBeTruthy();

      const totalCells = Array.from(totalRow.querySelectorAll('td')) as HTMLElement[];
      // 3 (tipo/eficacia/defensa) + 4 (movimiento) + 1 (promedio) + 1 (cobertura) = 9 celdas.
      expect(totalCells.length).toBe(9);
      for (const cell of totalCells.slice(0, 8)) {
        expect(cell.textContent?.trim()).toBe('');
      }
      const totalCoverageCell = totalCells[8];
      expect(totalCoverageCell.textContent?.trim()).not.toBe('');
      expect(Number.isFinite(Number(totalCoverageCell.textContent?.trim()))).toBeTrue();
      expect(totalCoverageCell.style.background).toBe('');
    });

    it('el valor de la celda de Total es la media aritmética redondeada de la columna de coeficiente de cobertura (US3 Acceptance Scenario 1)', () => {
      const fixture = createFixture();
      fixture.componentRef.setInput('pokemonTypes', [grass, poison]);
      fixture.componentRef.setInput('stats', STATS);
      fixture.componentRef.setInput('generation', new Generation('generation-vi', 'VI'));
      fixture.detectChanges();

      const rows = Array.from(fixture.nativeElement.querySelectorAll('tbody tr')) as HTMLElement[];
      const coverageValues = rows.map((row) => Number((row.querySelectorAll('td')[8] as HTMLElement).textContent?.trim()));
      // Comparar contra el promedio de los valores YA REDONDEADOS mostrados en pantalla sería
      // circular con la implementación; en su lugar se verifica que el total redondeado cae
      // dentro de ±1 del promedio de los valores redondeados por fila (cota de error de redondeo
      // esperable al comparar un promedio de enteros contra el redondeo de un promedio de decimales).
      const approxAverage = coverageValues.reduce((sum, v) => sum + v, 0) / coverageValues.length;
      const totalRow = fixture.nativeElement.querySelector('tfoot tr') as HTMLElement;
      const totalText = (totalRow.querySelectorAll('td')[8] as HTMLElement).textContent?.trim() ?? '';
      expect(Math.abs(Number(totalText) - approxAverage)).toBeLessThanOrEqual(1);
    });

    it('recalcula el total al cambiar las estadísticas base del Pokémon mostrado (FR-009/SC-005)', () => {
      const fixture = createFixture();
      fixture.componentRef.setInput('pokemonTypes', [grass, poison]);
      fixture.componentRef.setInput('stats', STATS);
      fixture.componentRef.setInput('generation', new Generation('generation-vi', 'VI'));
      fixture.detectChanges();

      const totalRow = () => fixture.nativeElement.querySelector('tfoot tr') as HTMLElement;
      const before = (totalRow().querySelectorAll('td')[8] as HTMLElement).textContent?.trim();

      fixture.componentRef.setInput('stats', new PokemonStats(150, 150, 150, 150, 150, 150));
      fixture.detectChanges();
      const after = (totalRow().querySelectorAll('td')[8] as HTMLElement).textContent?.trim();

      expect(after).not.toBe(before);
    });
  });

  // Implementación directa pedida por el usuario sobre un mockup (2026-09-10) — sin spec formal.
  describe('pestañas de filtro (Todos / Súper eficaces / Puntos ciegos)', () => {
    const grass = new PokemonType('grass', 'grass');
    const poison = new PokemonType('poison', 'poison');
    // Ghost (mono-tipo) es inmune (0x) a Normal y Lucha en la era VI+: esas filas usan el
    // divisor de reemplazo 0.125 (spec `023`), dando un coeficiente de cobertura alto y
    // garantizado >=200 sin movimientos equipados; el resto de filas (efficacy 0.5/1/2)
    // quedan <=100 con estos stats — separa determinísticamente ambas pestañas.
    const ghost = new PokemonType('ghost', 'ghost');
    // baseDefense = (specialDefense + defense)/2 + 0.3*hp = (70+70)/2 + 0.3*100 = 100.
    const ghostStats = new PokemonStats(100, 50, 70, 50, 70, 50);

    it('por defecto muestra la pestaña "Todos" con todas las filas', () => {
      const fixture = createFixture();
      fixture.componentRef.setInput('pokemonTypes', [grass, poison]);
      fixture.componentRef.setInput('stats', STATS);
      fixture.componentRef.setInput('generation', new Generation('generation-vi', 'VI'));
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(18);
      const activeTab = fixture.nativeElement.querySelector('.app-coverage-table__tab--active') as HTMLElement;
      expect(activeTab.textContent).toContain('18');
    });

    it('la pestaña "Súper eficaces" solo muestra filas con coeficiente de cobertura >= 200', () => {
      const fixture = createFixture();
      fixture.componentRef.setInput('pokemonTypes', [ghost]);
      fixture.componentRef.setInput('stats', ghostStats);
      fixture.componentRef.setInput('generation', new Generation('generation-vi', 'VI'));
      fixture.detectChanges();

      const tabs = Array.from(fixture.nativeElement.querySelectorAll('.app-coverage-table__tab')) as HTMLElement[];
      tabs[1].click();
      fixture.detectChanges();

      const rows = Array.from(fixture.nativeElement.querySelectorAll('tbody tr')) as HTMLElement[];
      // Normal y Lucha (inmunes) deben quedar en esta pestaña.
      expect(rows.length).toBe(2);
      for (const row of rows) {
        const coverageText = (row.querySelectorAll('td')[8] as HTMLElement).textContent?.trim() ?? '';
        expect(Number(coverageText)).toBeGreaterThanOrEqual(200);
      }
    });

    it('la pestaña "Puntos ciegos / Bajos" solo muestra filas con coeficiente de cobertura <= 100', () => {
      const fixture = createFixture();
      fixture.componentRef.setInput('pokemonTypes', [ghost]);
      fixture.componentRef.setInput('stats', ghostStats);
      fixture.componentRef.setInput('generation', new Generation('generation-vi', 'VI'));
      fixture.detectChanges();

      const tabs = Array.from(fixture.nativeElement.querySelectorAll('.app-coverage-table__tab')) as HTMLElement[];
      tabs[2].click();
      fixture.detectChanges();

      const rows = Array.from(fixture.nativeElement.querySelectorAll('tbody tr')) as HTMLElement[];
      // El resto de los 18 tipos (todas las filas salvo Normal/Lucha).
      expect(rows.length).toBe(16);
      for (const row of rows) {
        const coverageText = (row.querySelectorAll('td')[8] as HTMLElement).textContent?.trim() ?? '';
        expect(Number(coverageText)).toBeLessThanOrEqual(100);
      }
    });

    it('el mapa de calor y el valor de la fila de Total no cambian al filtrar por pestaña', () => {
      const fixture = createFixture();
      fixture.componentRef.setInput('pokemonTypes', [grass, poison]);
      fixture.componentRef.setInput('stats', STATS);
      fixture.componentRef.setInput('generation', new Generation('generation-vi', 'VI'));
      fixture.detectChanges();

      const totalBefore = (fixture.nativeElement.querySelector('tfoot tr td:last-child') as HTMLElement).textContent?.trim();
      const someRowBackgroundBefore = (
        fixture.nativeElement.querySelectorAll('tbody tr')[0].querySelectorAll('td')[8] as HTMLElement
      ).style.background;

      const tabs = Array.from(fixture.nativeElement.querySelectorAll('.app-coverage-table__tab')) as HTMLElement[];
      tabs[1].click();
      fixture.detectChanges();

      const totalAfter = (fixture.nativeElement.querySelector('tfoot tr td:last-child') as HTMLElement).textContent?.trim();
      expect(totalAfter).toBe(totalBefore);

      // Volver a "Todos" y confirmar que el color de la primera fila original no cambió
      // por haber pasado por una pestaña filtrada (el mapa de calor sigue anclado a
      // todas las filas, no al subconjunto visible en cada momento).
      tabs[0].click();
      fixture.detectChanges();
      const someRowBackgroundAfter = (
        fixture.nativeElement.querySelectorAll('tbody tr')[0].querySelectorAll('td')[8] as HTMLElement
      ).style.background;
      expect(someRowBackgroundAfter).toBe(someRowBackgroundBefore);
    });
  });

  // Implementación directa pedida por el usuario sobre un mockup (2026-09-10) — sin spec formal.
  describe('buscador, orden, etiquetas de eficacia y tarjeta de resumen', () => {
    const grass = new PokemonType('grass', 'grass');
    const poison = new PokemonType('poison', 'poison');

    it('el buscador filtra las filas por nombre de tipo, insensible a mayúsculas', () => {
      const fixture = createFixture();
      fixture.componentRef.setInput('pokemonTypes', [grass, poison]);
      fixture.componentRef.setInput('stats', STATS);
      fixture.componentRef.setInput('generation', new Generation('generation-vi', 'VI'));
      fixture.detectChanges();

      const search = fixture.nativeElement.querySelector('.app-coverage-table__search') as HTMLInputElement;
      search.value = 'FIRE';
      search.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      const rows = Array.from(fixture.nativeElement.querySelectorAll('tbody tr')) as HTMLElement[];
      expect(rows.length).toBe(1);
      expect(rows[0].querySelector('app-type-badge')?.textContent?.trim().toLowerCase()).toBe('fire');
    });

    it('el selector de orden reordena las filas por coeficiente de cobertura sin afectar el total', () => {
      const fixture = createFixture();
      fixture.componentRef.setInput('pokemonTypes', [grass, poison]);
      fixture.componentRef.setInput('stats', STATS);
      fixture.componentRef.setInput('generation', new Generation('generation-vi', 'VI'));
      fixture.detectChanges();

      const totalBefore = (fixture.nativeElement.querySelector('tfoot tr td:last-child') as HTMLElement).textContent?.trim();

      const sortSelect = fixture.nativeElement.querySelector('.app-coverage-table__sort') as HTMLSelectElement;
      sortSelect.value = 'coverage-desc';
      sortSelect.dispatchEvent(new Event('change'));
      fixture.detectChanges();

      const values = Array.from(fixture.nativeElement.querySelectorAll('tbody tr')).map((row) =>
        Number((row as HTMLElement).querySelectorAll('td')[8].textContent?.trim()),
      );
      const sortedDesc = [...values].sort((a, b) => b - a);
      expect(values).toEqual(sortedDesc);

      const totalAfter = (fixture.nativeElement.querySelector('tfoot tr td:last-child') as HTMLElement).textContent?.trim();
      expect(totalAfter).toBe(totalBefore);
    });

    it('la columna de eficacia muestra el multiplicador y una etiqueta descriptiva', () => {
      const fixture = createFixture();
      const ground = new PokemonType('ground', 'ground');
      fixture.componentRef.setInput('pokemonTypes', [ground]);
      fixture.componentRef.setInput('stats', STATS);
      fixture.componentRef.setInput('generation', new Generation('generation-vi', 'VI'));
      fixture.detectChanges();

      const rows = Array.from(fixture.nativeElement.querySelectorAll('tbody tr')) as HTMLElement[];
      const electricRowIndex = (attackTypesForGeneration(new Generation('generation-vi', 'VI')) ?? []).findIndex(
        (t) => t.id === 'electric',
      );
      const efficacyCell = rows[electricRowIndex].querySelectorAll('td')[1] as HTMLElement;
      // Eléctrico no afecta a Tierra (0×, Inmune) — clase de color específica para ese nivel.
      expect(efficacyCell.classList.contains('app-coverage-table__efficacy--immune')).toBeTrue();
    });

    it('muestra una tarjeta de resumen con el mismo puntaje que la fila de Total', () => {
      const fixture = createFixture();
      fixture.componentRef.setInput('pokemonTypes', [grass, poison]);
      fixture.componentRef.setInput('stats', STATS);
      fixture.componentRef.setInput('generation', new Generation('generation-vi', 'VI'));
      fixture.detectChanges();

      const totalRowValue = (fixture.nativeElement.querySelector('tfoot tr td:last-child') as HTMLElement).textContent?.trim();
      const summaryValue = (
        fixture.nativeElement.querySelector('.app-coverage-table__summary-score-value') as HTMLElement
      ).textContent?.trim();
      expect(summaryValue).toBe(totalRowValue);
    });
  });
});
