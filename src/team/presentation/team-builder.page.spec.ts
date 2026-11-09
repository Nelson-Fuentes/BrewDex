import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { TeamBuilderPage } from './team-builder.page';
import { InMemoryTeamService } from '../infrastructure/in-memory-team.service';
import { POKEDEX_DETAILS_READER } from '../../shared/tokens/pokedex-details-reader.token';
import { InMemoryPokedexService } from '../../pokedex/infrastructure/in-memory-pokedex.service';
import { ViewportService } from '../../shared/design-system/viewport.service';
import { RosterEntry } from '../domain/value-objects/roster-entry';
import { PokedexEntry } from '../../pokemon/domain/entities/pokedex-entry';
import { SelectableForm } from '../../pokemon/domain/value-objects/selectable-form';
import { PokemonType } from '../../pokemon/domain/value-objects/pokemon-type';
import { PokemonStats } from '../../pokemon/domain/value-objects/pokemon-stats';
import { Generation } from '../../game/domain/value-objects/generation';
import { PokedexFilterCriteria } from '../../pokedex/domain/value-objects/pokedex-filter-criteria';
import { GAME_SELECTION_READER } from '../../shared/tokens/game-selection-reader.token';
import { Game } from '../../game/domain/entities/game';
import { averageCoverageCoefficient, computeDefensiveCoverageRows } from '../../pokemon/domain/value-objects/defensive-coverage';
import { attackTypesForGeneration } from '../../pokemon/domain/value-objects/type-effectiveness';
import { Move } from '../../pokemon/domain/value-objects/move';
import { MoveLearnInfo } from '../../pokemon/domain/value-objects/move-learn-info';

const normal = new PokemonType('normal', 'Normal');
const stats = new PokemonStats(1, 1, 1, 1, 1, 1);
const form = new SelectableForm('rotom-heat', 'Heat Rotom', null, null, null, null, null, 'template', null, normal, null, stats);
const rotomEntry = new PokedexEntry(
  'rotom',
  'Rotom',
  1,
  null,
  null,
  null,
  null,
  null,
  -1,
  false,
  [form],
  null,
  null,
  [],
  normal,
  null,
  new Generation('generation-i', 'I'),
  { kind: 'regional' },
  stats,
);

describe('TeamBuilderPage', () => {
  function build() {
    TestBed.configureTestingModule({
      imports: [TeamBuilderPage, NoopAnimationsModule, TranslocoTestingModule.forRoot({ langs: { en: {} } })],
      providers: [
        {
          provide: InMemoryTeamService,
          useValue: {
            slots: () => [new RosterEntry('rotom'), null, null, null, null, null],
            rejection: () => null,
            movepoolBySlot: () => new Map(),
            selectForm: jasmine.createSpy('selectForm'),
            selectMove: jasmine.createSpy('selectMove'),
            removePokemonFromTeam: jasmine.createSpy('removePokemonFromTeam'),
            addPokemonToTeam: jasmine.createSpy('addPokemonToTeam'),
            loadMovepool: jasmine.createSpy('loadMovepool').and.resolveTo(undefined),
          },
        },
        { provide: POKEDEX_DETAILS_READER, useValue: { detailsFor: (id: string) => (id === 'rotom' ? rotomEntry : null) } },
        {
          provide: InMemoryPokedexService,
          useValue: {
            status: () => 'ready',
            filterCriteria: () => new PokedexFilterCriteria(),
      useNationalDex: () => false,
            pokedexIndex: () => [],
            pokedexDetailsById: () => new Map(),
            hasMoreBatches: () => false,
            isLoadingBatch: () => false,
            batchError: () => false,
            updateFilterCriteria: jasmine.createSpy(),
            toggleNationalDex: jasmine.createSpy(),
            loadNextBatch: jasmine.createSpy(),
            retryBatch: jasmine.createSpy(),
            load: jasmine.createSpy(),
          },
        },
        {
          provide: GAME_SELECTION_READER,
          useValue: {
            currentGame: () => new Game('red-blue', 'Red/Blue', new Generation('generation-i', 'I')),
            currentActiveDlcIds: () => new Set<string>(),
            toggleDlc: jasmine.createSpy('toggleDlc'),
            onSelectionChanged: () => ({ subscribe: () => undefined }),
          },
        },
        { provide: ViewportService, useValue: { screenSize: () => 'expanded' } },
      ],
    });
    return TestBed.createComponent(TeamBuilderPage);
  }

  it('al seleccionar un slot ocupado, muestra el selector de formas de ese Pokémon', () => {
    const fixture = build();
    fixture.detectChanges();

    fixture.componentInstance.onSlotSelect(0);
    fixture.detectChanges();

    expect(fixture.componentInstance['activeEntry']()?.pokemonId).toBe('rotom');
  });

  it('elegir un movimiento cierra el selector para mostrar el cambio en el slot', () => {
    const fixture = build();
    fixture.detectChanges();
    fixture.componentInstance.onSlotSelect(0);
    fixture.componentInstance.onOpenMoveSlot(0);
    fixture.detectChanges();
    expect(fixture.componentInstance['showMoveSheet']()).toBeTrue();

    fixture.componentInstance.onSelectMove({ position: 0, move: null });

    expect(fixture.componentInstance['showMoveSheet']()).toBeFalse();
  });

  it('no hace nada al seleccionar un slot vacío', () => {
    const fixture = build();
    fixture.detectChanges();

    fixture.componentInstance.onSlotSelect(1); // slot vacío

    expect(fixture.componentInstance['activeSlotIndex']()).toBeNull();
  });

  it('muestra el nombre del juego activo (018, FR-014)', () => {
    const fixture = build();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Red/Blue');
  });

  it('el nombre del juego activo es realmente visible, no transparente (020, ronda 2)', () => {
    // El título de marca global (.app-brand-title, styles.scss) pinta su
    // texto con -webkit-text-fill-color: transparent (gradiente) — esa
    // propiedad se hereda, así que sin un color propio en `.app-game-badge`
    // el nombre del juego estaba presente en el DOM (test anterior) pero
    // invisible en pantalla (mismo color que el fondo).
    const fixture = build();
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('.app-game-badge') as HTMLElement;
    expect(badge).not.toBeNull();
    expect(badge.textContent).toContain('Red/Blue');
    const style = getComputedStyle(badge);
    expect(style.webkitTextFillColor).not.toBe('transparent');
    expect(style.color).not.toBe('transparent');

    document.body.removeChild(fixture.nativeElement);
  });

  it('organiza los slots en una grilla de 3 columnas x 2 filas (018, FR-016)', () => {
    const fixture = build();
    fixture.detectChanges();
    document.body.appendChild(fixture.nativeElement);

    const grid = fixture.nativeElement.querySelector('.app-team-slots') as HTMLElement;
    const style = getComputedStyle(grid);
    expect(style.display).toBe('grid');
    expect(style.gridTemplateColumns.split(' ').length).toBe(3);
    expect(style.gridTemplateRows.split(' ').length).toBe(2);

    document.body.removeChild(fixture.nativeElement);
  });

  it('al hacer click en un slot ocupado abre la tarjeta modal de detalle (018, FR-019)', () => {
    const fixture = build();
    fixture.detectChanges();

    fixture.componentInstance.onSlotSelect(0);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-pokemon-detail-modal')).not.toBeNull();
  });

  // 023, FR-002 (remediación I1 de /speckit-analyze) — la generación del
  // juego activo (GameSelectionReader.currentGame().generation) llega tal
  // cual al input `generation` de <app-pokemon-detail-modal>, para
  // alimentar su sección de Análisis de Cobertura.
  it('pasa la generación del juego activo al input generation de <app-pokemon-detail-modal> (023, FR-002)', () => {
    const fixture = build();
    fixture.detectChanges();

    fixture.componentInstance.onSlotSelect(0);
    fixture.detectChanges();

    const modal = fixture.debugElement.query((de) => de.name === 'app-pokemon-detail-modal');
    const generation = modal.componentInstance.generation();
    expect(generation).not.toBeNull();
    expect(generation.id).toBe('generation-i');
  });

  it('el shiny activado persiste al cerrar y reabrir el modal del mismo slot (018, FR-022a)', () => {
    let slot = new RosterEntry('rotom');
    TestBed.configureTestingModule({
      imports: [TeamBuilderPage, NoopAnimationsModule, TranslocoTestingModule.forRoot({ langs: { en: {} } })],
      providers: [
        {
          provide: InMemoryTeamService,
          useValue: {
            slots: () => [slot, null, null, null, null, null],
            rejection: () => null,
            movepoolBySlot: () => new Map(),
            selectForm: jasmine.createSpy('selectForm'),
            selectMove: jasmine.createSpy('selectMove'),
            removePokemonFromTeam: jasmine.createSpy('removePokemonFromTeam'),
            addPokemonToTeam: jasmine.createSpy('addPokemonToTeam'),
            loadMovepool: jasmine.createSpy('loadMovepool').and.resolveTo(undefined),
            toggleShiny: (index: number, active: boolean) => {
              slot = slot.copyWith({ isShiny: active });
            },
          },
        },
        { provide: POKEDEX_DETAILS_READER, useValue: { detailsFor: (id: string) => (id === 'rotom' ? rotomEntry : null) } },
        {
          provide: InMemoryPokedexService,
          useValue: {
            status: () => 'ready',
            filterCriteria: () => new PokedexFilterCriteria(),
      useNationalDex: () => false,
            pokedexIndex: () => [],
            pokedexDetailsById: () => new Map(),
            hasMoreBatches: () => false,
            isLoadingBatch: () => false,
            batchError: () => false,
            updateFilterCriteria: jasmine.createSpy(),
            toggleNationalDex: jasmine.createSpy(),
            loadNextBatch: jasmine.createSpy(),
            retryBatch: jasmine.createSpy(),
            load: jasmine.createSpy(),
          },
        },
        {
          provide: GAME_SELECTION_READER,
          useValue: {
            currentGame: () => new Game('red-blue', 'Red/Blue', new Generation('generation-i', 'I')),
            currentActiveDlcIds: () => new Set<string>(),
            toggleDlc: jasmine.createSpy('toggleDlc'),
            onSelectionChanged: () => ({ subscribe: () => undefined }),
          },
        },
        { provide: ViewportService, useValue: { screenSize: () => 'expanded' } },
      ],
    });
    const fixture = TestBed.createComponent(TeamBuilderPage);
    fixture.detectChanges();

    fixture.componentInstance.onSlotSelect(0);
    fixture.detectChanges();
    const modal = fixture.debugElement.query((de) => de.name === 'app-pokemon-detail-modal');
    modal.componentInstance.shinyChange.emit(true);
    fixture.detectChanges();

    // Cierra el modal (sin desactivar el toggle) y lo vuelve a abrir.
    fixture.componentInstance.onModalClose();
    fixture.detectChanges();
    fixture.componentInstance.onSlotSelect(0);
    fixture.detectChanges();

    const reopenedModal = fixture.debugElement.query((de) => de.name === 'app-pokemon-detail-modal');
    expect(reopenedModal.componentInstance.isShiny()).toBeTrue();
  });

  // `026-team-slot-coverage-index`, T008 (US1): `coverageIndexFor` debe devolver exactamente el
  // mismo valor que se obtendría llamando `computeDefensiveCoverageRows` + `averageCoverageCoefficient`
  // directamente con los mismos datos de entrada (contract §5).
  it('coverageIndexFor(i) sobre un slot ocupado devuelve el mismo valor que averageCoverageCoefficient(computeDefensiveCoverageRows(...)) calculado directamente', () => {
    const fixture = build();
    fixture.detectChanges();

    const generation = new Generation('generation-i', 'I');
    const expectedRows = computeDefensiveCoverageRows([normal], stats, generation, [null, null, null, null])!;
    const expected = averageCoverageCoefficient(expectedRows);

    expect(fixture.componentInstance['coverageIndexFor'](0)).toBeCloseTo(expected, 10);
  });

  it('coverageIndexFor(i) devuelve null cuando el slot está vacío', () => {
    const fixture = build();
    fixture.detectChanges();

    expect(fixture.componentInstance['coverageIndexFor'](1)).toBeNull();
  });
});

// `026-team-slot-coverage-index`, T003 (Foundational, research.md Decisión 4): el movepool de
// TODO slot ocupado debe cargarse sin que el entrenador lo abra — no solo el del slot activo
// (comportamiento previo a esta feature). Usa signals reales (no funciones planas) para `slots`
// porque el `effect()` bajo prueba solo reacciona a lecturas verdaderamente reactivas.
describe('TeamBuilderPage — carga anticipada de movepool por slot ocupado (026, Foundational)', () => {
  function buildWithSignals() {
    const slotsSignal = signal<(RosterEntry | null)[]>([null, null, null, null, null, null]);
    const loadMovepool = jasmine.createSpy('loadMovepool').and.resolveTo(undefined);
    TestBed.configureTestingModule({
      imports: [TeamBuilderPage, NoopAnimationsModule, TranslocoTestingModule.forRoot({ langs: { en: {} } })],
      providers: [
        {
          provide: InMemoryTeamService,
          useValue: {
            slots: slotsSignal,
            rejection: () => null,
            movepoolBySlot: () => new Map(),
            selectForm: jasmine.createSpy('selectForm'),
            selectMove: jasmine.createSpy('selectMove'),
            removePokemonFromTeam: jasmine.createSpy('removePokemonFromTeam'),
            addPokemonToTeam: jasmine.createSpy('addPokemonToTeam'),
            loadMovepool,
          },
        },
        { provide: POKEDEX_DETAILS_READER, useValue: { detailsFor: (id: string) => (id === 'rotom' ? rotomEntry : null) } },
        {
          provide: InMemoryPokedexService,
          useValue: {
            status: () => 'ready',
            filterCriteria: () => new PokedexFilterCriteria(),
            useNationalDex: () => false,
            pokedexIndex: () => [],
            pokedexDetailsById: () => new Map(),
            hasMoreBatches: () => false,
            isLoadingBatch: () => false,
            batchError: () => false,
            updateFilterCriteria: jasmine.createSpy(),
            toggleNationalDex: jasmine.createSpy(),
            loadNextBatch: jasmine.createSpy(),
            retryBatch: jasmine.createSpy(),
            load: jasmine.createSpy(),
          },
        },
        {
          provide: GAME_SELECTION_READER,
          useValue: {
            currentGame: () => new Game('red-blue', 'Red/Blue', new Generation('generation-i', 'I')),
            currentActiveDlcIds: () => new Set<string>(),
            toggleDlc: jasmine.createSpy('toggleDlc'),
            onSelectionChanged: () => ({ subscribe: () => undefined }),
          },
        },
        { provide: ViewportService, useValue: { screenSize: () => 'expanded' } },
      ],
    });
    const fixture = TestBed.createComponent(TeamBuilderPage);
    return { fixture, slotsSignal, loadMovepool };
  }

  it('agregar un Pokémon a un slot dispara loadMovepool para ese índice sin seleccionarlo/abrirlo', () => {
    const { fixture, slotsSignal, loadMovepool } = buildWithSignals();
    fixture.detectChanges();
    TestBed.flushEffects();
    loadMovepool.calls.reset();

    slotsSignal.set([new RosterEntry('rotom'), null, null, null, null, null]);
    fixture.detectChanges();
    TestBed.flushEffects();

    expect(loadMovepool).toHaveBeenCalledWith(0);
  });

  it('cambiar la forma de un slot ya ocupado vuelve a disparar loadMovepool para ese slot', () => {
    const { fixture, slotsSignal, loadMovepool } = buildWithSignals();
    slotsSignal.set([new RosterEntry('rotom'), null, null, null, null, null]);
    fixture.detectChanges();
    TestBed.flushEffects();
    loadMovepool.calls.reset();

    slotsSignal.set([new RosterEntry('rotom', 'rotom-heat'), null, null, null, null, null]);
    fixture.detectChanges();
    TestBed.flushEffects();

    expect(loadMovepool).toHaveBeenCalledWith(0);
  });

  it('elegir un movimiento, o cambiar género/shiny/tera tipo, NO vuelve a disparar loadMovepool', () => {
    const { fixture, slotsSignal, loadMovepool } = buildWithSignals();
    const initial = new RosterEntry('rotom');
    slotsSignal.set([initial, null, null, null, null, null]);
    fixture.detectChanges();
    TestBed.flushEffects();
    loadMovepool.calls.reset();

    slotsSignal.set([initial.copyWith({ moveIds: ['tackle', null, null, null] }), null, null, null, null, null]);
    fixture.detectChanges();
    TestBed.flushEffects();
    slotsSignal.set([initial.copyWith({ isShiny: true }), null, null, null, null, null]);
    fixture.detectChanges();
    TestBed.flushEffects();

    expect(loadMovepool).not.toHaveBeenCalled();
  });

  it('quitar el Pokémon de un slot deja de rastrearlo — volver a ocuparlo dispara loadMovepool de nuevo', () => {
    const { fixture, slotsSignal, loadMovepool } = buildWithSignals();
    slotsSignal.set([new RosterEntry('rotom'), null, null, null, null, null]);
    fixture.detectChanges();
    TestBed.flushEffects();
    loadMovepool.calls.reset();

    slotsSignal.set([null, null, null, null, null, null]);
    fixture.detectChanges();
    TestBed.flushEffects();
    slotsSignal.set([new RosterEntry('rotom'), null, null, null, null, null]);
    fixture.detectChanges();
    TestBed.flushEffects();

    expect(loadMovepool).toHaveBeenCalledWith(0);
  });
});

// `026-team-slot-coverage-index`, T008 (US1): `coverageIndexFor` debe devolver exactamente el
// mismo valor que se obtendría llamando `computeDefensiveCoverageRows` + `averageCoverageCoefficient`
// directamente con los mismos datos de entrada (contract §5).
describe('TeamBuilderPage — coverageIndexFor (026, US1)', () => {
  it('devuelve null cuando activeGeneration() es null (sin juego activo)', () => {
    TestBed.configureTestingModule({
      imports: [TeamBuilderPage, NoopAnimationsModule, TranslocoTestingModule.forRoot({ langs: { en: {} } })],
      providers: [
        {
          provide: InMemoryTeamService,
          useValue: {
            slots: () => [new RosterEntry('rotom'), null, null, null, null, null],
            rejection: () => null,
            movepoolBySlot: () => new Map(),
            selectForm: jasmine.createSpy('selectForm'),
            selectMove: jasmine.createSpy('selectMove'),
            removePokemonFromTeam: jasmine.createSpy('removePokemonFromTeam'),
            addPokemonToTeam: jasmine.createSpy('addPokemonToTeam'),
            loadMovepool: jasmine.createSpy('loadMovepool').and.resolveTo(undefined),
          },
        },
        { provide: POKEDEX_DETAILS_READER, useValue: { detailsFor: (id: string) => (id === 'rotom' ? rotomEntry : null) } },
        {
          provide: InMemoryPokedexService,
          useValue: {
            status: () => 'ready',
            filterCriteria: () => new PokedexFilterCriteria(),
            useNationalDex: () => false,
            pokedexIndex: () => [],
            pokedexDetailsById: () => new Map(),
            hasMoreBatches: () => false,
            isLoadingBatch: () => false,
            batchError: () => false,
            updateFilterCriteria: jasmine.createSpy(),
            toggleNationalDex: jasmine.createSpy(),
            loadNextBatch: jasmine.createSpy(),
            retryBatch: jasmine.createSpy(),
            load: jasmine.createSpy(),
          },
        },
        {
          provide: GAME_SELECTION_READER,
          useValue: {
            currentGame: () => null,
            currentActiveDlcIds: () => new Set<string>(),
            toggleDlc: jasmine.createSpy('toggleDlc'),
            onSelectionChanged: () => ({ subscribe: () => undefined }),
          },
        },
        { provide: ViewportService, useValue: { screenSize: () => 'expanded' } },
      ],
    });
    const fixture = TestBed.createComponent(TeamBuilderPage);
    fixture.detectChanges();

    expect(fixture.componentInstance['coverageIndexFor'](0)).toBeNull();
  });

  it('devuelve null cuando computeDefensiveCoverageRows devuelve null (generación sin era de tipos reconocida)', () => {
    TestBed.configureTestingModule({
      imports: [TeamBuilderPage, NoopAnimationsModule, TranslocoTestingModule.forRoot({ langs: { en: {} } })],
      providers: [
        {
          provide: InMemoryTeamService,
          useValue: {
            slots: () => [new RosterEntry('rotom'), null, null, null, null, null],
            rejection: () => null,
            movepoolBySlot: () => new Map(),
            selectForm: jasmine.createSpy('selectForm'),
            selectMove: jasmine.createSpy('selectMove'),
            removePokemonFromTeam: jasmine.createSpy('removePokemonFromTeam'),
            addPokemonToTeam: jasmine.createSpy('addPokemonToTeam'),
            loadMovepool: jasmine.createSpy('loadMovepool').and.resolveTo(undefined),
          },
        },
        { provide: POKEDEX_DETAILS_READER, useValue: { detailsFor: (id: string) => (id === 'rotom' ? rotomEntry : null) } },
        {
          provide: InMemoryPokedexService,
          useValue: {
            status: () => 'ready',
            filterCriteria: () => new PokedexFilterCriteria(),
            useNationalDex: () => false,
            pokedexIndex: () => [],
            pokedexDetailsById: () => new Map(),
            hasMoreBatches: () => false,
            isLoadingBatch: () => false,
            batchError: () => false,
            updateFilterCriteria: jasmine.createSpy(),
            toggleNationalDex: jasmine.createSpy(),
            loadNextBatch: jasmine.createSpy(),
            retryBatch: jasmine.createSpy(),
            load: jasmine.createSpy(),
          },
        },
        {
          provide: GAME_SELECTION_READER,
          useValue: {
            currentGame: () => new Game('mystery', 'Mystery', new Generation('generation-desconocida', '?')),
            currentActiveDlcIds: () => new Set<string>(),
            toggleDlc: jasmine.createSpy('toggleDlc'),
            onSelectionChanged: () => ({ subscribe: () => undefined }),
          },
        },
        { provide: ViewportService, useValue: { screenSize: () => 'expanded' } },
      ],
    });
    const fixture = TestBed.createComponent(TeamBuilderPage);
    fixture.detectChanges();

    expect(fixture.componentInstance['coverageIndexFor'](0)).toBeNull();
  });
});

// `026-team-slot-coverage-index`, T014/T015 (US2): coverageIndexFor debe reflejar cualquier
// cambio de movimiento equipado o de forma sin recargar la pantalla — usa signals reales para
// `slots`/`movepoolBySlot` porque `coverageIndexFor` lee esos signals en cada evaluación.
describe('TeamBuilderPage — coverageIndexFor se recalcula ante cambios (026, US2)', () => {
  const fireType = new PokemonType('fire', 'Fire');
  const waterType = new PokemonType('water', 'Water');
  const emberMove = new Move('ember', 'Ember', fireType, 'special', 25, 40, '', 100);
  const surfMove = new Move('surf', 'Surf', waterType, 'special', 15, 90, '', 100);
  const movepool = [new MoveLearnInfo(emberMove, ['level'], 1), new MoveLearnInfo(surfMove, ['level'], 1)];

  // Forma alternativa con tipo y estadísticas base distintas a la forma base de `rotomEntry`
  // (normal, stats(1,1,1,1,1,1)) — necesaria para que T015 pueda verificar que cambiar de
  // forma efectivamente cambia el índice, y no solo el movimiento equipado (ya cubierto por
  // el primer test de este describe).
  const differentStatsForm = new SelectableForm(
    'rotom-heat',
    'Heat Rotom',
    null,
    null,
    null,
    null,
    null,
    'template',
    null,
    fireType,
    null,
    new PokemonStats(78, 84, 78, 109, 85, 100),
  );
  const rotomWithFireForm = new PokedexEntry(
    'rotom',
    'Rotom',
    1,
    null,
    null,
    null,
    null,
    null,
    -1,
    false,
    [differentStatsForm],
    null,
    null,
    [],
    normal,
    null,
    new Generation('generation-i', 'I'),
    { kind: 'regional' },
    stats,
  );

  function buildWithSignals(details: PokedexEntry = rotomEntry) {
    const slotsSignal = signal<(RosterEntry | null)[]>([
      new RosterEntry('rotom', null, null, null, false, false, false, null, ['ember', null, null, null]),
      null,
      null,
      null,
      null,
      null,
    ]);
    const movepoolBySlotSignal = signal<ReadonlyMap<number, MoveLearnInfo[]>>(new Map([[0, movepool]]));
    TestBed.configureTestingModule({
      imports: [TeamBuilderPage, NoopAnimationsModule, TranslocoTestingModule.forRoot({ langs: { en: {} } })],
      providers: [
        {
          provide: InMemoryTeamService,
          useValue: {
            slots: slotsSignal,
            rejection: () => null,
            movepoolBySlot: movepoolBySlotSignal,
            selectForm: jasmine.createSpy('selectForm'),
            selectMove: jasmine.createSpy('selectMove'),
            removePokemonFromTeam: jasmine.createSpy('removePokemonFromTeam'),
            addPokemonToTeam: jasmine.createSpy('addPokemonToTeam'),
            loadMovepool: jasmine.createSpy('loadMovepool').and.resolveTo(undefined),
          },
        },
        { provide: POKEDEX_DETAILS_READER, useValue: { detailsFor: (id: string) => (id === 'rotom' ? details : null) } },
        {
          provide: InMemoryPokedexService,
          useValue: {
            status: () => 'ready',
            filterCriteria: () => new PokedexFilterCriteria(),
            useNationalDex: () => false,
            pokedexIndex: () => [],
            pokedexDetailsById: () => new Map(),
            hasMoreBatches: () => false,
            isLoadingBatch: () => false,
            batchError: () => false,
            updateFilterCriteria: jasmine.createSpy(),
            toggleNationalDex: jasmine.createSpy(),
            loadNextBatch: jasmine.createSpy(),
            retryBatch: jasmine.createSpy(),
            load: jasmine.createSpy(),
          },
        },
        {
          provide: GAME_SELECTION_READER,
          useValue: {
            currentGame: () => new Game('red-blue', 'Red/Blue', new Generation('generation-i', 'I')),
            currentActiveDlcIds: () => new Set<string>(),
            toggleDlc: jasmine.createSpy('toggleDlc'),
            onSelectionChanged: () => ({ subscribe: () => undefined }),
          },
        },
        { provide: ViewportService, useValue: { screenSize: () => 'expanded' } },
      ],
    });
    const fixture = TestBed.createComponent(TeamBuilderPage);
    return { fixture, slotsSignal };
  }

  it('tras cambiar el movimiento equipado por otro de tipo/potencia distinta, coverageIndexFor devuelve un valor distinto (US2 Acceptance Scenario 1)', () => {
    const { fixture, slotsSignal } = buildWithSignals();
    fixture.detectChanges();
    const before = fixture.componentInstance['coverageIndexFor'](0);

    const current = slotsSignal()[0]!;
    slotsSignal.set([current.copyWith({ moveIds: ['surf', null, null, null] }), null, null, null, null, null]);
    fixture.detectChanges();
    const after = fixture.componentInstance['coverageIndexFor'](0);

    expect(after).not.toBeCloseTo(before!, 5);
  });

  it('tras cambiar a una forma con tipos/estadísticas distintas, coverageIndexFor devuelve un valor distinto una vez resuelto el nuevo movepool (US2 Acceptance Scenario 1)', () => {
    const { fixture, slotsSignal } = buildWithSignals(rotomWithFireForm);
    fixture.detectChanges();
    const before = fixture.componentInstance['coverageIndexFor'](0);

    const current = slotsSignal()[0]!;
    slotsSignal.set([current.copyWith({ formVarietyId: 'rotom-heat' }), null, null, null, null, null]);
    fixture.detectChanges();
    const after = fixture.componentInstance['coverageIndexFor'](0);

    expect(before).not.toBeNull();
    expect(after).not.toBeNull();
    expect(after).not.toBeCloseTo(before!, 5);
  });
});

// `026-team-slot-coverage-index`, T018 (US3): occupiedCoverageIndexValues es el
// `teamCoverageIndexValues` común que se pasa a todas las instancias de TeamSlotComponent
// (contract §3/§5) — un valor por slot ocupado con índice calculable, ninguno por los vacíos.
describe('TeamBuilderPage — occupiedCoverageIndexValues (026, US3)', () => {
  function buildWithSignals() {
    const slotsSignal = signal<(RosterEntry | null)[]>([new RosterEntry('rotom'), null, null, null, null, null]);
    TestBed.configureTestingModule({
      imports: [TeamBuilderPage, NoopAnimationsModule, TranslocoTestingModule.forRoot({ langs: { en: {} } })],
      providers: [
        {
          provide: InMemoryTeamService,
          useValue: {
            slots: slotsSignal,
            rejection: () => null,
            movepoolBySlot: () => new Map(),
            selectForm: jasmine.createSpy('selectForm'),
            selectMove: jasmine.createSpy('selectMove'),
            removePokemonFromTeam: jasmine.createSpy('removePokemonFromTeam'),
            addPokemonToTeam: jasmine.createSpy('addPokemonToTeam'),
            loadMovepool: jasmine.createSpy('loadMovepool').and.resolveTo(undefined),
          },
        },
        { provide: POKEDEX_DETAILS_READER, useValue: { detailsFor: (id: string) => (id === 'rotom' ? rotomEntry : null) } },
        {
          provide: InMemoryPokedexService,
          useValue: {
            status: () => 'ready',
            filterCriteria: () => new PokedexFilterCriteria(),
            useNationalDex: () => false,
            pokedexIndex: () => [],
            pokedexDetailsById: () => new Map(),
            hasMoreBatches: () => false,
            isLoadingBatch: () => false,
            batchError: () => false,
            updateFilterCriteria: jasmine.createSpy(),
            toggleNationalDex: jasmine.createSpy(),
            loadNextBatch: jasmine.createSpy(),
            retryBatch: jasmine.createSpy(),
            load: jasmine.createSpy(),
          },
        },
        {
          provide: GAME_SELECTION_READER,
          useValue: {
            currentGame: () => new Game('red-blue', 'Red/Blue', new Generation('generation-i', 'I')),
            currentActiveDlcIds: () => new Set<string>(),
            toggleDlc: jasmine.createSpy('toggleDlc'),
            onSelectionChanged: () => ({ subscribe: () => undefined }),
          },
        },
        { provide: ViewportService, useValue: { screenSize: () => 'expanded' } },
      ],
    });
    const fixture = TestBed.createComponent(TeamBuilderPage);
    return { fixture, slotsSignal };
  }

  it('contiene exactamente un valor por slot ocupado con índice calculable, ninguno por los vacíos', () => {
    const { fixture } = buildWithSignals();
    fixture.detectChanges();

    const values = fixture.componentInstance['occupiedCoverageIndexValues']();
    const expected = fixture.componentInstance['coverageIndexFor'](0);

    expect(values.length).toBe(1);
    expect(values[0]).toBeCloseTo(expected!, 10);
  });

  it('se actualiza al agregar un segundo Pokémon al equipo', () => {
    const { fixture, slotsSignal } = buildWithSignals();
    fixture.detectChanges();

    slotsSignal.set([new RosterEntry('rotom'), new RosterEntry('rotom'), null, null, null, null]);
    fixture.detectChanges();

    expect(fixture.componentInstance['occupiedCoverageIndexValues']().length).toBe(2);
  });

  it('se actualiza al quitar un Pokémon del equipo', () => {
    const { fixture, slotsSignal } = buildWithSignals();
    fixture.detectChanges();
    slotsSignal.set([new RosterEntry('rotom'), new RosterEntry('rotom'), null, null, null, null]);
    fixture.detectChanges();

    slotsSignal.set([new RosterEntry('rotom'), null, null, null, null, null]);
    fixture.detectChanges();

    expect(fixture.componentInstance['occupiedCoverageIndexValues']().length).toBe(1);
  });

  it('con el equipo vacío, devuelve un array vacío', () => {
    const { fixture, slotsSignal } = buildWithSignals();
    slotsSignal.set([null, null, null, null, null, null]);
    fixture.detectChanges();

    expect(fixture.componentInstance['occupiedCoverageIndexValues']()).toEqual([]);
  });
});

// `027-team-coverage-analysis-modal`, T008 (US1): el botón "Análisis de cobertura" abre/cierra
// el modal de equipo, deshabilitado cuando el equipo no tiene ningún Pokémon ocupado.
describe('TeamBuilderPage — botón y modal de Análisis de Cobertura del equipo (027, US1)', () => {
  function buildWithSlots(slots: readonly (RosterEntry | null)[]) {
    TestBed.configureTestingModule({
      imports: [TeamBuilderPage, NoopAnimationsModule, TranslocoTestingModule.forRoot({ langs: { en: {} } })],
      providers: [
        {
          provide: InMemoryTeamService,
          useValue: {
            slots: () => slots,
            rejection: () => null,
            movepoolBySlot: () => new Map(),
            selectForm: jasmine.createSpy('selectForm'),
            selectMove: jasmine.createSpy('selectMove'),
            removePokemonFromTeam: jasmine.createSpy('removePokemonFromTeam'),
            addPokemonToTeam: jasmine.createSpy('addPokemonToTeam'),
            loadMovepool: jasmine.createSpy('loadMovepool').and.resolveTo(undefined),
          },
        },
        { provide: POKEDEX_DETAILS_READER, useValue: { detailsFor: (id: string) => (id === 'rotom' ? rotomEntry : null) } },
        {
          provide: InMemoryPokedexService,
          useValue: {
            status: () => 'ready',
            filterCriteria: () => new PokedexFilterCriteria(),
            useNationalDex: () => false,
            pokedexIndex: () => [],
            pokedexDetailsById: () => new Map(),
            hasMoreBatches: () => false,
            isLoadingBatch: () => false,
            batchError: () => false,
            updateFilterCriteria: jasmine.createSpy(),
            toggleNationalDex: jasmine.createSpy(),
            loadNextBatch: jasmine.createSpy(),
            retryBatch: jasmine.createSpy(),
            load: jasmine.createSpy(),
          },
        },
        {
          provide: GAME_SELECTION_READER,
          useValue: {
            currentGame: () => new Game('red-blue', 'Red/Blue', new Generation('generation-i', 'I')),
            currentActiveDlcIds: () => new Set<string>(),
            toggleDlc: jasmine.createSpy('toggleDlc'),
            onSelectionChanged: () => ({ subscribe: () => undefined }),
          },
        },
        { provide: ViewportService, useValue: { screenSize: () => 'expanded' } },
      ],
    });
    return TestBed.createComponent(TeamBuilderPage);
  }

  function coverageButton(fixture: ReturnType<typeof buildWithSlots>): HTMLButtonElement {
    return (fixture.nativeElement as HTMLElement).querySelector('[data-testid="team-coverage-button"]') as HTMLButtonElement;
  }

  it('showCoverageModal inicia en false', () => {
    const fixture = buildWithSlots([new RosterEntry('rotom'), null, null, null, null, null]);
    fixture.detectChanges();

    expect(fixture.componentInstance['showCoverageModal']()).toBeFalse();
  });

  it('con el equipo vacío, el botón aparece deshabilitado', () => {
    const fixture = buildWithSlots([null, null, null, null, null, null]);
    fixture.detectChanges();

    expect(coverageButton(fixture).disabled).toBeTrue();
  });

  it('con al menos un slot ocupado, el botón no está deshabilitado y al pulsarlo abre el modal', () => {
    const fixture = buildWithSlots([new RosterEntry('rotom'), null, null, null, null, null]);
    fixture.detectChanges();

    expect(coverageButton(fixture).disabled).toBeFalse();

    coverageButton(fixture).click();
    fixture.detectChanges();

    expect(fixture.componentInstance['showCoverageModal']()).toBeTrue();
    const modal = fixture.debugElement.query((de) => de.name === 'app-team-coverage-modal');
    expect(modal).not.toBeNull();
  });

  it('el (close) del modal vuelve a poner showCoverageModal en false', () => {
    const fixture = buildWithSlots([new RosterEntry('rotom'), null, null, null, null, null]);
    fixture.detectChanges();
    fixture.componentInstance['showCoverageModal'].set(true);
    fixture.detectChanges();

    const modal = fixture.debugElement.query((de) => de.name === 'app-team-coverage-modal');
    modal.triggerEventHandler('close', undefined);
    fixture.detectChanges();

    expect(fixture.componentInstance['showCoverageModal']()).toBeFalse();
  });
});

// `027-team-coverage-analysis-modal`, T013 (US2): teamCoverageRows/teamCoverageTypes/
// teamCoverageGenerationUnavailable — la tabla del modal debe reflejar exactamente los mismos
// datos que ya usa coverageIndexFor/coverageRowsFor por slot, transpuestos por Pokémon.
describe('TeamBuilderPage — teamCoverageRows/teamCoverageTypes (027, US2)', () => {
  function buildWithSlots(slots: readonly (RosterEntry | null)[], generation = new Generation('generation-i', 'I')) {
    TestBed.configureTestingModule({
      imports: [TeamBuilderPage, NoopAnimationsModule, TranslocoTestingModule.forRoot({ langs: { en: {} } })],
      providers: [
        {
          provide: InMemoryTeamService,
          useValue: {
            slots: () => slots,
            rejection: () => null,
            movepoolBySlot: () => new Map(),
            selectForm: jasmine.createSpy('selectForm'),
            selectMove: jasmine.createSpy('selectMove'),
            removePokemonFromTeam: jasmine.createSpy('removePokemonFromTeam'),
            addPokemonToTeam: jasmine.createSpy('addPokemonToTeam'),
            loadMovepool: jasmine.createSpy('loadMovepool').and.resolveTo(undefined),
          },
        },
        { provide: POKEDEX_DETAILS_READER, useValue: { detailsFor: (id: string) => (id === 'rotom' ? rotomEntry : null) } },
        {
          provide: InMemoryPokedexService,
          useValue: {
            status: () => 'ready',
            filterCriteria: () => new PokedexFilterCriteria(),
            useNationalDex: () => false,
            pokedexIndex: () => [],
            pokedexDetailsById: () => new Map(),
            hasMoreBatches: () => false,
            isLoadingBatch: () => false,
            batchError: () => false,
            updateFilterCriteria: jasmine.createSpy(),
            toggleNationalDex: jasmine.createSpy(),
            loadNextBatch: jasmine.createSpy(),
            retryBatch: jasmine.createSpy(),
            load: jasmine.createSpy(),
          },
        },
        {
          provide: GAME_SELECTION_READER,
          useValue: {
            currentGame: () => new Game('red-blue', 'Red/Blue', generation),
            currentActiveDlcIds: () => new Set<string>(),
            toggleDlc: jasmine.createSpy('toggleDlc'),
            onSelectionChanged: () => ({ subscribe: () => undefined }),
          },
        },
        { provide: ViewportService, useValue: { screenSize: () => 'expanded' } },
      ],
    });
    return TestBed.createComponent(TeamBuilderPage);
  }

  it('teamCoverageRows() devuelve exactamente una entrada por slot ocupado, con los mismos coeficientes que coverageRowsFor', () => {
    const fixture = buildWithSlots([new RosterEntry('rotom'), null, new RosterEntry('rotom'), null, null, null]);
    fixture.detectChanges();

    const rows = fixture.componentInstance['teamCoverageRows']();
    expect(rows.length).toBe(2);
    expect(rows.map((r: { slotIndex: number }) => r.slotIndex)).toEqual([0, 2]);

    const expectedRows = fixture.componentInstance['coverageRowsFor'](0)!;
    const type = expectedRows[0].type;
    const cell = rows[0].coverageByType.get(type.id)!;
    expect(cell.defense).toBeCloseTo(expectedRows[0].defenseCoefficient, 10);
    expect(cell.coverage).toBeCloseTo(expectedRows[0].coverageCoefficient, 10);
    expect(rows[0].displayName).toBe('Rotom');
    expect(rows[0].types).toEqual([normal]);
  });

  it('teamCoverageRows() no incluye ninguna entrada para slots vacíos', () => {
    const fixture = buildWithSlots([null, null, null, null, null, null]);
    fixture.detectChanges();

    expect(fixture.componentInstance['teamCoverageRows']()).toEqual([]);
  });

  it('teamCoverageTypes() devuelve el mismo array (mismo orden) que attackTypesForGeneration', () => {
    const generation = new Generation('generation-i', 'I');
    const fixture = buildWithSlots([new RosterEntry('rotom'), null, null, null, null, null], generation);
    fixture.detectChanges();

    const types = fixture.componentInstance['teamCoverageTypes']();
    expect(types.map((t: PokemonType) => t.id)).toEqual(attackTypesForGeneration(generation)!.map((t) => t.id));
  });

  it('teamCoverageGenerationUnavailable() es true cuando la generación activa no tiene era de tipos reconocida', () => {
    const fixture = buildWithSlots([new RosterEntry('rotom'), null, null, null, null, null], new Generation('generation-desconocida', '?'));
    fixture.detectChanges();

    expect(fixture.componentInstance['teamCoverageGenerationUnavailable']()).toBeTrue();
  });

  it('teamCoverageGenerationUnavailable() es false cuando la generación activa sí tiene era de tipos reconocida', () => {
    const fixture = buildWithSlots([new RosterEntry('rotom'), null, null, null, null, null]);
    fixture.detectChanges();

    expect(fixture.componentInstance['teamCoverageGenerationUnavailable']()).toBeFalse();
  });
});

// `027-team-coverage-analysis-modal`, T014a (US2, FR-009/SC-003): teamCoverageRows/
// teamCoverageTotals deben reflejar un cambio de forma o de movimiento sin cerrar el modal —
// mismo patrón de signals reales que `026`, T014/T015.
describe('TeamBuilderPage — teamCoverageRows/teamCoverageTotals se recalculan ante cambios (027, US2)', () => {
  function buildWithSignals() {
    const slotsSignal = signal<(RosterEntry | null)[]>([
      new RosterEntry('rotom'),
      new RosterEntry('rotom'),
      null,
      null,
      null,
      null,
    ]);
    TestBed.configureTestingModule({
      imports: [TeamBuilderPage, NoopAnimationsModule, TranslocoTestingModule.forRoot({ langs: { en: {} } })],
      providers: [
        {
          provide: InMemoryTeamService,
          useValue: {
            slots: slotsSignal,
            rejection: () => null,
            movepoolBySlot: () => new Map(),
            selectForm: jasmine.createSpy('selectForm'),
            selectMove: jasmine.createSpy('selectMove'),
            removePokemonFromTeam: jasmine.createSpy('removePokemonFromTeam'),
            addPokemonToTeam: jasmine.createSpy('addPokemonToTeam'),
            loadMovepool: jasmine.createSpy('loadMovepool').and.resolveTo(undefined),
          },
        },
        { provide: POKEDEX_DETAILS_READER, useValue: { detailsFor: (id: string) => (id === 'rotom' ? rotomEntry : null) } },
        {
          provide: InMemoryPokedexService,
          useValue: {
            status: () => 'ready',
            filterCriteria: () => new PokedexFilterCriteria(),
            useNationalDex: () => false,
            pokedexIndex: () => [],
            pokedexDetailsById: () => new Map(),
            hasMoreBatches: () => false,
            isLoadingBatch: () => false,
            batchError: () => false,
            updateFilterCriteria: jasmine.createSpy(),
            toggleNationalDex: jasmine.createSpy(),
            loadNextBatch: jasmine.createSpy(),
            retryBatch: jasmine.createSpy(),
            load: jasmine.createSpy(),
          },
        },
        {
          provide: GAME_SELECTION_READER,
          useValue: {
            currentGame: () => new Game('red-blue', 'Red/Blue', new Generation('generation-i', 'I')),
            currentActiveDlcIds: () => new Set<string>(),
            toggleDlc: jasmine.createSpy('toggleDlc'),
            onSelectionChanged: () => ({ subscribe: () => undefined }),
          },
        },
        { provide: ViewportService, useValue: { screenSize: () => 'expanded' } },
      ],
    });
    const fixture = TestBed.createComponent(TeamBuilderPage);
    return { fixture, slotsSignal };
  }

  it('tras quitar un Pokémon del equipo, teamCoverageRows()/teamCoverageTotals() se recalculan sin recrear el componente', () => {
    const { fixture, slotsSignal } = buildWithSignals();
    fixture.detectChanges();
    expect(fixture.componentInstance['teamCoverageRows']().length).toBe(2);

    const current = slotsSignal();
    slotsSignal.set([current[0]!, null, null, null, null, null]);
    fixture.detectChanges();

    expect(fixture.componentInstance['teamCoverageRows']().length).toBe(1);
    const totals = fixture.componentInstance['teamCoverageTotals']()!;
    const singleRow = fixture.componentInstance['teamCoverageRows']()[0];
    const type = fixture.componentInstance['teamCoverageTypes']()[0];
    expect(totals.totalsByType.get(type.id)!.coverage).toBeCloseTo(singleRow.coverageByType.get(type.id)!.coverage, 10);
  });
});
