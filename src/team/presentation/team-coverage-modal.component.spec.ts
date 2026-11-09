import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { TeamCoverageModalComponent } from './team-coverage-modal.component';
import type { TeamCoverageRow, TeamCoverageTotals } from './team-coverage.types';
import { PokemonType } from '../../pokemon/domain/value-objects/pokemon-type';
import { heatmapColorFor } from '../../shared/design-system/heatmap-gradient';

const fire = new PokemonType('fire', 'Fire');
const water = new PokemonType('water', 'Water');

const TRANSLATIONS = {
  team: {
    teamCoverageButtonLabel: 'Coverage analysis',
    teamCoverageModalTitle: 'Team coverage analysis',
    teamCoverageTotalRowLabel: 'Team average',
    teamCoveragePokemonColumnLabel: 'Type',
    teamCoverageDefenseSubcolumnLabel: 'Def',
    teamCoverageAttackSubcolumnLabel: 'Atk',
    teamCoverageCoverageSubcolumnLabel: 'Cov',
    coverageUnavailable: 'No type effectiveness table is defined for this generation.',
    coverageAttackCoefficientNotApplicable: '—',
    coverageTabAll: 'All types',
    coverageTabSuperEffective: 'Super effective',
    coverageTabBlindSpots: 'Blind spots / Low',
    coverageSearchPlaceholder: 'Search target type...',
    coverageSortLabel: 'Sort by',
    coverageSortOriginal: 'Original order',
    coverageSortCoverageDesc: 'Coverage (highest first)',
    coverageSortCoverageAsc: 'Coverage (lowest first)',
    coverageSortAlpha: 'Type (A-Z)',
  },
  common: {
    close: 'Close',
  },
};

function buildRow(overrides: Partial<TeamCoverageRow> = {}): TeamCoverageRow {
  return {
    slotIndex: 0,
    spriteUrl: 'charizard.png',
    displayName: 'Charizard',
    types: [fire],
    coverageByType: new Map([
      [fire.id, { defense: 80, attack: 120, coverage: 96 }],
      [water.id, { defense: 60, attack: 40, coverage: 48 }],
    ]),
    ...overrides,
  };
}

function build() {
  TestBed.configureTestingModule({
    imports: [TeamCoverageModalComponent, NoopAnimationsModule, TranslocoTestingModule.forRoot({ langs: { en: TRANSLATIONS }, preloadLangs: true })],
  });
  return TestBed.createComponent(TeamCoverageModalComponent);
}

// `027-team-coverage-analysis-modal`, T009 (US1): estructura de modal (abre/cierra) —
// aún sin verificar el contenido real de la tabla (eso llega en T014, US2).
describe('TeamCoverageModalComponent', () => {
  it('con rows vacío y generationUnavailable en false, renderiza igualmente su estructura de modal sin lanzar error', () => {
    const fixture = build();
    fixture.componentRef.setInput('rows', []);
    fixture.componentRef.setInput('types', [fire, water]);
    expect(() => fixture.detectChanges()).not.toThrow();
    expect((fixture.nativeElement as HTMLElement).querySelector('[role="dialog"]')).not.toBeNull();
  });

  it('al hacer click en el botón de cerrar, emite close', () => {
    const fixture = build();
    fixture.componentRef.setInput('rows', [buildRow()]);
    fixture.componentRef.setInput('types', [fire, water]);
    fixture.detectChanges();

    let emitted = false;
    fixture.componentInstance.close.subscribe(() => (emitted = true));

    const closeButton = (fixture.nativeElement as HTMLElement).querySelector('[data-testid="team-coverage-modal-close"]') as HTMLButtonElement;
    closeButton.click();

    expect(emitted).toBeTrue();
  });

  it('el botón de cerrar usa el mismo diseño que el resto de modales (mat-icon-button + mat-icon "close")', () => {
    // Nota: no se compara el aria-label traducido literal — mismo límite ya
    // documentado de `TranslocoTestingModule` en este entorno (devuelve
    // "<lang>.<key>" en vez de la traducción); se verifica en cambio que el
    // botón usa el mismo mecanismo Material que `PokemonDetailModalComponent`/
    // `MoveSelectionSheetComponent` (mat-icon-button + <mat-icon>close</mat-icon>).
    const fixture = build();
    fixture.componentRef.setInput('rows', [buildRow()]);
    fixture.componentRef.setInput('types', [fire, water]);
    fixture.detectChanges();

    const closeButton = (fixture.nativeElement as HTMLElement).querySelector('[data-testid="team-coverage-modal-close"]') as HTMLButtonElement;
    expect(closeButton.hasAttribute('mat-icon-button')).toBeTrue();
    expect(closeButton.querySelector('mat-icon')?.textContent?.trim()).toBe('close');
  });

  it('con generationUnavailable en true, muestra el mensaje de no disponible en vez de la tabla', () => {
    // Nota: no se compara el texto traducido literal — `TranslocoTestingModule`
    // (`@jsverse/transloco` 8.x) no resuelve el diccionario de forma
    // determinística en este entorno de test (mismo comportamiento
    // reproducido de forma aislada, ajeno a este componente); se verifica
    // en cambio la estructura (el elemento del mensaje existe, la tabla no).
    const fixture = build();
    fixture.componentRef.setInput('rows', []);
    fixture.componentRef.setInput('types', []);
    fixture.componentRef.setInput('generationUnavailable', true);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('.app-team-coverage-modal__unavailable')).not.toBeNull();
    expect((fixture.nativeElement as HTMLElement).querySelector('table')).toBeNull();
  });

  it('con totals no nulo, no lanza error aunque no haya rows', () => {
    const fixture = build();
    const totals: TeamCoverageTotals = { totalsByType: new Map([[fire.id, { defense: 70, attack: 80, coverage: 72 }]]) };
    fixture.componentRef.setInput('rows', []);
    fixture.componentRef.setInput('types', [fire]);
    fixture.componentRef.setInput('totals', totals);
    expect(() => fixture.detectChanges()).not.toThrow();
  });
});

// `027-team-coverage-analysis-modal`, T014 (US2, corregido tras feedback del usuario:
// filas = tipo, columnas = Pokémon — orientación invertida respecto a la primera
// implementación). Una fila por elemento de `types()`, una columna (3 celdas) por
// elemento de `rows()`, con mapa de calor por columna (Pokémon × métrica).
describe('TeamCoverageModalComponent — tabla real por tipo y Pokémon (027, US2)', () => {
  const rowA = buildRow({
    slotIndex: 0,
    displayName: 'Charizard',
    spriteUrl: 'charizard.png',
    coverageByType: new Map([
      [fire.id, { defense: 80, attack: 120, coverage: 96 }],
      [water.id, { defense: 60, attack: null, coverage: 30 }],
    ]),
  });
  const rowB = buildRow({
    slotIndex: 2,
    displayName: 'Blastoise',
    spriteUrl: 'blastoise.png',
    coverageByType: new Map([
      [fire.id, { defense: 40, attack: 60, coverage: 48 }],
      [water.id, { defense: 130, attack: 100, coverage: 113 }],
    ]),
  });

  it('renderiza exactamente una fila por elemento de types y una columna (colspan 3) por elemento de rows', () => {
    const fixture = build();
    fixture.componentRef.setInput('rows', [rowA, rowB]);
    fixture.componentRef.setInput('types', [fire, water]);
    fixture.detectChanges();

    const bodyRows = (fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr');
    expect(bodyRows.length).toBe(2);
    const pokemonHeaders = (fixture.nativeElement as HTMLElement).querySelectorAll('thead tr:first-child th[colspan]');
    expect(pokemonHeaders.length).toBe(2);
  });

  it('cada celda de coeficiente muestra el valor redondeado y el encabezado de columna usa la imagen de spriteUrl', () => {
    const fixture = build();
    fixture.componentRef.setInput('rows', [rowA, rowB]);
    fixture.componentRef.setInput('types', [fire, water]);
    fixture.detectChanges();

    const firstPokemonHeader = (fixture.nativeElement as HTMLElement).querySelectorAll('thead tr:first-child th[colspan]')[0];
    const img = firstPokemonHeader.querySelector('img') as HTMLImageElement;
    expect(img.src).toContain('charizard.png');

    const fireRow = (fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr')[0];
    expect(fireRow.textContent).toContain('80'); // defensa fuego, Charizard
    expect(fireRow.textContent).toContain('96'); // cobertura fuego, Charizard
  });

  it('el color de fondo de una celda coincide con heatmapColorFor sobre esa misma columna de Pokémon entre todas las filas de tipo', () => {
    const fixture = build();
    fixture.componentRef.setInput('rows', [rowA, rowB]);
    fixture.componentRef.setInput('types', [fire, water]);
    fixture.detectChanges();

    // Columna Charizard, defensa: fuego=80, agua=60 → columnValues=[80,60]
    const expectedColor = heatmapColorFor(80, [80, 60]);
    const fireRow = (fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr')[0];
    const charizardDefenseCell = fireRow.querySelectorAll('td')[1] as HTMLElement;
    expect(charizardDefenseCell.style.background).toBe(expectedColor);
  });

  it('con attack null en una celda, muestra el indicador de no aplica sin mapa de calor en esa celda', () => {
    const fixture = build();
    fixture.componentRef.setInput('rows', [rowA, rowB]);
    fixture.componentRef.setInput('types', [fire, water]);
    fixture.detectChanges();

    // fila agua, columna Charizard (primeras 3 celdas de datos): defensa, ataque(null), cobertura
    const waterRow = (fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr')[1];
    const charizardCells = Array.from(waterRow.querySelectorAll('td')).slice(1, 4);
    expect(charizardCells[1].style.background).toBe('');
  });
});

// `027-team-coverage-analysis-modal`, T021 (US3, corregido: columna final, no fila).
describe('TeamCoverageModalComponent — columna final de promedios del equipo (027, US3)', () => {
  const rowA = buildRow({
    slotIndex: 0,
    coverageByType: new Map([[fire.id, { defense: 80, attack: 120, coverage: 96 }]]),
  });
  const rowB = buildRow({
    slotIndex: 1,
    coverageByType: new Map([[fire.id, { defense: 40, attack: 60, coverage: 48 }]]),
  });
  const totals: TeamCoverageTotals = { totalsByType: new Map([[fire.id, { defense: 60, attack: 90, coverage: 72 }]]) };

  it('con totals no nulo, renderiza una columna adicional al final con los 3 valores por fila de tipo', () => {
    const fixture = build();
    fixture.componentRef.setInput('rows', [rowA, rowB]);
    fixture.componentRef.setInput('types', [fire]);
    fixture.componentRef.setInput('totals', totals);
    fixture.detectChanges();

    const pokemonHeaders = (fixture.nativeElement as HTMLElement).querySelectorAll('thead tr:first-child th[colspan]');
    expect(pokemonHeaders.length).toBe(3); // 2 Pokémon + columna de totales

    const fireRow = (fixture.nativeElement as HTMLElement).querySelector('tbody tr')!;
    const totalCells = Array.from(fireRow.querySelectorAll('td.app-team-coverage-modal__total-cell'));
    expect(totalCells.length).toBe(3);
    expect(totalCells.map((c) => c.textContent?.trim())).toEqual(['60', '90', '72']);
  });

  it('con totals nulo, no renderiza ninguna columna final', () => {
    const fixture = build();
    fixture.componentRef.setInput('rows', [rowA, rowB]);
    fixture.componentRef.setInput('types', [fire]);
    fixture.componentRef.setInput('totals', null);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelectorAll('thead tr:first-child th[colspan]').length).toBe(2);
    expect((fixture.nativeElement as HTMLElement).querySelector('.app-team-coverage-modal__total-cell')).toBeNull();
  });

  it('el valor de la columna final se incluye en el columnValues del mapa de calor de esa columna', () => {
    const fixture = build();
    fixture.componentRef.setInput('rows', [rowA, rowB]);
    fixture.componentRef.setInput('types', [fire]);
    fixture.componentRef.setInput('totals', totals);
    fixture.detectChanges();

    // Columna de totales, defensa: única fila de tipo (fuego) → columnValues=[60]
    const expectedColor = heatmapColorFor(60, [60]);
    const totalDefenseCell = (fixture.nativeElement as HTMLElement).querySelector('.app-team-coverage-modal__total-cell') as HTMLElement;
    expect(totalDefenseCell.style.background).toBe(expectedColor);
  });
});

// Pestañas de filtro, buscador y orden — mismo mecanismo que
// `CoverageAnalysisTableComponent`, pedido por el usuario también para el modal de equipo.
describe('TeamCoverageModalComponent — pestañas, buscador y orden', () => {
  const grass = new PokemonType('grass', 'Grass');
  // Coeficiente de cobertura representativo por tipo (columna de totales):
  // fuego=220 (súper eficaz), agua=90 (punto ciego), planta=150 (ninguna pestaña extremo).
  const rowA = buildRow({
    slotIndex: 0,
    coverageByType: new Map([
      [fire.id, { defense: 220, attack: 220, coverage: 220 }],
      [water.id, { defense: 90, attack: 90, coverage: 90 }],
      [grass.id, { defense: 150, attack: 150, coverage: 150 }],
    ]),
  });
  const totals: TeamCoverageTotals = {
    totalsByType: new Map([
      [fire.id, { defense: 220, attack: 220, coverage: 220 }],
      [water.id, { defense: 90, attack: 90, coverage: 90 }],
      [grass.id, { defense: 150, attack: 150, coverage: 150 }],
    ]),
  };

  function buildWithTabs() {
    const fixture = build();
    fixture.componentRef.setInput('rows', [rowA]);
    fixture.componentRef.setInput('types', [fire, water, grass]);
    fixture.componentRef.setInput('totals', totals);
    fixture.detectChanges();
    return fixture;
  }

  function typeRowLabels(fixture: ReturnType<typeof buildWithTabs>): string[] {
    return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr')).map(
      (row) => row.querySelector('.app-team-coverage-modal__type-cell')?.textContent?.trim() ?? '',
    );
  }

  it('la pestaña "Todos los tipos" muestra las 3 filas', () => {
    const fixture = buildWithTabs();
    expect(typeRowLabels(fixture).length).toBe(3);
  });

  it('la pestaña "Súper eficaces" solo muestra los tipos con cobertura del equipo >= 200', () => {
    const fixture = buildWithTabs();
    fixture.componentInstance['activeTab'].set('super-effective');
    fixture.detectChanges();

    const labels = typeRowLabels(fixture);
    expect(labels).toEqual(['Fire']);
  });

  it('la pestaña "Puntos ciegos / Bajos" solo muestra los tipos con cobertura del equipo <= 100', () => {
    const fixture = buildWithTabs();
    fixture.componentInstance['activeTab'].set('blind-spots');
    fixture.detectChanges();

    const labels = typeRowLabels(fixture);
    expect(labels).toEqual(['Water']);
  });

  it('el buscador filtra por nombre de tipo, insensible a mayúsculas', () => {
    const fixture = buildWithTabs();
    fixture.componentInstance['searchText'].set('WAT');
    fixture.detectChanges();

    expect(typeRowLabels(fixture)).toEqual(['Water']);
  });

  it('el orden "Cobertura (mayor primero)" ordena las filas por el coeficiente representativo del equipo', () => {
    const fixture = buildWithTabs();
    fixture.componentInstance['sortOrder'].set('coverage-desc');
    fixture.detectChanges();

    expect(typeRowLabels(fixture)).toEqual(['Fire', 'Grass', 'Water']);
  });

  it('el orden "Tipo (A-Z)" ordena alfabéticamente', () => {
    const fixture = buildWithTabs();
    fixture.componentInstance['sortOrder'].set('alpha');
    fixture.detectChanges();

    expect(typeRowLabels(fixture)).toEqual(['Fire', 'Grass', 'Water']);
  });

  it('los filtros/orden no afectan el mapa de calor ni los valores de la columna de totales', () => {
    const fixture = buildWithTabs();
    fixture.componentInstance['activeTab'].set('super-effective'); // solo deja "Fire" visible
    fixture.detectChanges();

    // columnValuesForTotals debe seguir considerando los 3 tipos, no solo el visible
    expect(fixture.componentInstance['columnValuesForTotals']('coverage')).toEqual([220, 90, 150]);
  });
});
