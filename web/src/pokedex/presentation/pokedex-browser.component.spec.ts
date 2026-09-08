import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { PokedexBrowserComponent } from './pokedex-browser.component';
import { InMemoryPokedexService } from '../infrastructure/in-memory-pokedex.service';
import { PokedexEntry } from '../../pokemon/domain/entities/pokedex-entry';
import { PokemonType } from '../../pokemon/domain/value-objects/pokemon-type';
import { PokemonStats } from '../../pokemon/domain/value-objects/pokemon-stats';
import { Generation } from '../../game/domain/value-objects/generation';
import { Game } from '../../game/domain/entities/game';
import { GameDlc } from '../../game/domain/value-objects/game-dlc';
import { PokedexFilterCriteria } from '../domain/value-objects/pokedex-filter-criteria';
import { PokedexIndexEntry } from '../domain/value-objects/pokedex-index-entry';
import { GAME_SELECTION_READER } from '../../shared/tokens/game-selection-reader.token';

function makeEntry(id: string, num: number, sourceTag: PokedexEntry['sourceTag'] = { kind: 'regional' }): PokedexEntry {
  return new PokedexEntry(
    id,
    id,
    num,
    null,
    null,
    null,
    null,
    null,
    -1,
    false,
    [],
    null,
    null,
    [],
    new PokemonType('grass', 'Grass'),
    null,
    new Generation('generation-i', 'I'),
    sourceTag,
    new PokemonStats(45, 49, 49, 65, 65, 45),
  );
}

const entry = makeEntry('bulbasaur', 1);

function configure(pokedexServiceStub: Record<string, unknown>, gameSelectionReaderStub: Record<string, unknown> = {}) {
  TestBed.configureTestingModule({
    imports: [PokedexBrowserComponent, NoopAnimationsModule, TranslocoTestingModule.forRoot({ langs: { en: {} } })],
    providers: [
      { provide: InMemoryPokedexService, useValue: pokedexServiceStub },
      {
        provide: GAME_SELECTION_READER,
        useValue: {
          currentGame: () => null,
          currentActiveDlcIds: () => new Set<string>(),
          toggleDlc: jasmine.createSpy('toggleDlc'),
          ...gameSelectionReaderStub,
        },
      },
    ],
  });
  return TestBed.createComponent(PokedexBrowserComponent);
}

describe('PokedexBrowserComponent', () => {
  it('lista las entradas resueltas y emite add al agregar una', () => {
    const fixture = configure({
      status: () => 'ready',
      filterCriteria: () => new PokedexFilterCriteria(),
      useNationalDex: () => false,
      pokedexIndex: () => [new PokedexIndexEntry('bulbasaur', 1, { kind: 'regional' })],
      pokedexDetailsById: () => new Map([['bulbasaur', entry]]),
      hasMoreBatches: () => false,
      isLoadingBatch: () => false,
      batchError: () => false,
      updateFilterCriteria: jasmine.createSpy('updateFilterCriteria'),
      toggleNationalDex: jasmine.createSpy('toggleNationalDex'),
      loadNextBatch: jasmine.createSpy('loadNextBatch'),
      retryBatch: jasmine.createSpy('retryBatch'),
      load: jasmine.createSpy('load'),
    });
    fixture.detectChanges();

    const spy = jasmine.createSpy('add');
    fixture.componentInstance.add.subscribe(spy);
    fixture.nativeElement.querySelector('app-pokedex-entry-card button').click();

    expect(spy).toHaveBeenCalledWith(entry);
  });

  it('solo muestra las entradas cuyo detalle ya resolvió (paginación, FR-012)', () => {
    const fixture = configure({
      status: () => 'ready',
      filterCriteria: () => new PokedexFilterCriteria(),
      useNationalDex: () => false,
      pokedexIndex: () => [
        new PokedexIndexEntry('bulbasaur', 1, { kind: 'regional' }),
        new PokedexIndexEntry('ivysaur', 2, { kind: 'regional' }),
      ],
      pokedexDetailsById: () => new Map([['bulbasaur', entry]]),
      hasMoreBatches: () => true,
      isLoadingBatch: () => false,
      batchError: () => false,
      updateFilterCriteria: jasmine.createSpy('updateFilterCriteria'),
      toggleNationalDex: jasmine.createSpy('toggleNationalDex'),
      loadNextBatch: jasmine.createSpy('loadNextBatch'),
      retryBatch: jasmine.createSpy('retryBatch'),
      load: jasmine.createSpy('load'),
    });
    fixture.detectChanges();

    const cards = fixture.nativeElement.querySelectorAll('app-pokedex-entry-card');
    expect(cards.length).toBe(1);
  });

  it('muestra el sentinel de scroll infinito mientras queden lotes por cargar (FR-013)', () => {
    const fixture = configure({
      status: () => 'ready',
      filterCriteria: () => new PokedexFilterCriteria(),
      useNationalDex: () => false,
      pokedexIndex: () => [new PokedexIndexEntry('bulbasaur', 1, { kind: 'regional' })],
      pokedexDetailsById: () => new Map([['bulbasaur', entry]]),
      hasMoreBatches: () => true,
      isLoadingBatch: () => false,
      batchError: () => false,
      updateFilterCriteria: jasmine.createSpy('updateFilterCriteria'),
      toggleNationalDex: jasmine.createSpy('toggleNationalDex'),
      loadNextBatch: jasmine.createSpy('loadNextBatch'),
      retryBatch: jasmine.createSpy('retryBatch'),
      load: jasmine.createSpy('load'),
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.app-pokedex-sentinel')).not.toBeNull();
  });

  it('drena varios lotes seguidos si el sentinel sigue visible sin necesitar scroll (019, FR-013)', async () => {
    // Simula un panel lo bastante alto como para que el sentinel arranque
    // visible desde el primer render (sin que el usuario haga scroll) —
    // el bug reportado: solo cargaba 15 y se detenía ahí.
    let resolvedCount = 15;
    const total = 40;
    const loadNextBatch = jasmine.createSpy('loadNextBatch').and.callFake(async () => {
      resolvedCount = Math.min(resolvedCount + 15, total);
    });
    const fixture = configure({
      status: () => 'ready',
      filterCriteria: () => new PokedexFilterCriteria(),
      useNationalDex: () => false,
      pokedexIndex: () => Array.from({ length: total }, (_, i) => new PokedexIndexEntry(`p${i}`, i + 1, { kind: 'regional' })),
      pokedexDetailsById: () => new Map(),
      hasMoreBatches: () => resolvedCount < total,
      isLoadingBatch: () => false,
      batchError: () => false,
      updateFilterCriteria: jasmine.createSpy('updateFilterCriteria'),
      toggleNationalDex: jasmine.createSpy('toggleNationalDex'),
      loadNextBatch,
      retryBatch: jasmine.createSpy('retryBatch'),
      load: jasmine.createSpy('load'),
    });

    spyOn(HTMLElement.prototype, 'getBoundingClientRect').and.returnValue({
      top: 10,
      bottom: 20,
      left: 0,
      right: 0,
      width: 0,
      height: 10,
      x: 0,
      y: 10,
      toJSON: () => ({}),
    } as DOMRect);

    fixture.detectChanges();
    await fixture.whenStable();

    expect(loadNextBatch.calls.count()).toBeGreaterThan(1);
    expect(resolvedCount).toBe(total);
  });

  it('arranca a drenar en cuanto "status" pasa a ready y el sentinel recién aparece (019, FR-013)', async () => {
    // Reproduce el timing real: el componente se crea mientras la
    // Pokédex sigue "loading" (el sentinel ni existe en el DOM todavía),
    // y "ready" llega recién después — `ngAfterViewInit` solo, sin un
    // efecto reactivo, se perdía este caso (bug reportado: "solo carga
    // 15 y no llena la pantalla").
    let resolvedCount = 0;
    const total = 30;
    const statusSignal = signal<'loading' | 'ready'>('loading');
    const detailsSignal = signal(new Map<string, PokedexEntry>());
    const hasMoreSignal = signal(false);
    const loadNextBatch = jasmine.createSpy('loadNextBatch').and.callFake(async () => {
      resolvedCount = Math.min(resolvedCount + 15, total);
      hasMoreSignal.set(resolvedCount < total);
    });

    const fixture = configure({
      status: statusSignal,
      filterCriteria: () => new PokedexFilterCriteria(),
      useNationalDex: () => false,
      pokedexIndex: () => Array.from({ length: total }, (_, i) => new PokedexIndexEntry(`p${i}`, i + 1, { kind: 'regional' })),
      pokedexDetailsById: detailsSignal,
      hasMoreBatches: hasMoreSignal,
      isLoadingBatch: () => false,
      batchError: () => false,
      updateFilterCriteria: jasmine.createSpy('updateFilterCriteria'),
      toggleNationalDex: jasmine.createSpy('toggleNationalDex'),
      loadNextBatch,
      retryBatch: jasmine.createSpy('retryBatch'),
      load: jasmine.createSpy('load'),
    });

    spyOn(HTMLElement.prototype, 'getBoundingClientRect').and.returnValue({
      top: 10,
      bottom: 20,
      left: 0,
      right: 0,
      width: 0,
      height: 10,
      x: 0,
      y: 10,
      toJSON: () => ({}),
    } as DOMRect);

    fixture.autoDetectChanges(true);
    await fixture.whenStable();
    expect(loadNextBatch).not.toHaveBeenCalled();

    // Ahora "llega" el primer lote y el estado pasa a "ready" — el
    // sentinel recién se renderiza en este punto.
    resolvedCount = 15;
    hasMoreSignal.set(true);
    statusSignal.set('ready');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(loadNextBatch.calls.count()).toBeGreaterThan(0);
    expect(resolvedCount).toBe(total);
  });

  it('no muestra el sentinel cuando ya no quedan lotes por cargar', () => {
    const fixture = configure({
      status: () => 'ready',
      filterCriteria: () => new PokedexFilterCriteria(),
      useNationalDex: () => false,
      pokedexIndex: () => [new PokedexIndexEntry('bulbasaur', 1, { kind: 'regional' })],
      pokedexDetailsById: () => new Map([['bulbasaur', entry]]),
      hasMoreBatches: () => false,
      isLoadingBatch: () => false,
      batchError: () => false,
      updateFilterCriteria: jasmine.createSpy('updateFilterCriteria'),
      toggleNationalDex: jasmine.createSpy('toggleNationalDex'),
      loadNextBatch: jasmine.createSpy('loadNextBatch'),
      retryBatch: jasmine.createSpy('retryBatch'),
      load: jasmine.createSpy('load'),
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.app-pokedex-sentinel')).toBeNull();
  });

  it('muestra un botón de reintentar cuando falla un lote, en vez del sentinel (spec.md Edge Cases)', () => {
    const retryBatch = jasmine.createSpy('retryBatch');
    const fixture = configure({
      status: () => 'ready',
      filterCriteria: () => new PokedexFilterCriteria(),
      useNationalDex: () => false,
      pokedexIndex: () => [new PokedexIndexEntry('bulbasaur', 1, { kind: 'regional' })],
      pokedexDetailsById: () => new Map([['bulbasaur', entry]]),
      hasMoreBatches: () => true,
      isLoadingBatch: () => false,
      batchError: () => true,
      updateFilterCriteria: jasmine.createSpy('updateFilterCriteria'),
      toggleNationalDex: jasmine.createSpy('toggleNationalDex'),
      loadNextBatch: jasmine.createSpy('loadNextBatch'),
      retryBatch,
      load: jasmine.createSpy('load'),
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.app-pokedex-sentinel')).toBeNull();
    const errorBlock = fixture.nativeElement.querySelector('.app-pokedex-batch-error');
    expect(errorBlock).not.toBeNull();
    errorBlock.querySelector('button').click();

    expect(retryBatch).toHaveBeenCalled();
  });

  it('agrupa las entradas por sección: principal primero, luego una por DLC activo (FR-009/FR-010)', () => {
    const dlc = new GameDlc('the-isle-of-armor', 'The Isle of Armor');
    const game = new Game('sword-shield', 'Sword/Shield', new Generation('generation-viii', 'VIII'), [dlc]);
    const mainEntry = makeEntry('bulbasaur', 1, { kind: 'regional' });
    const dlcEntry = makeEntry('kubfu', 2, { kind: 'dlc', dlcId: 'the-isle-of-armor' });

    const fixture = configure(
      {
        status: () => 'ready',
        filterCriteria: () => new PokedexFilterCriteria(),
      useNationalDex: () => false,
        pokedexIndex: () => [
          new PokedexIndexEntry('bulbasaur', 1, { kind: 'regional' }),
          new PokedexIndexEntry('kubfu', 2, { kind: 'dlc', dlcId: 'the-isle-of-armor' }),
        ],
        pokedexDetailsById: () => new Map([['bulbasaur', mainEntry], ['kubfu', dlcEntry]]),
        hasMoreBatches: () => false,
        isLoadingBatch: () => false,
        batchError: () => false,
        updateFilterCriteria: jasmine.createSpy('updateFilterCriteria'),
        toggleNationalDex: jasmine.createSpy('toggleNationalDex'),
        loadNextBatch: jasmine.createSpy('loadNextBatch'),
        retryBatch: jasmine.createSpy('retryBatch'),
        load: jasmine.createSpy('load'),
      },
      { currentGame: () => game, currentActiveDlcIds: () => new Set(['the-isle-of-armor']) },
    );
    fixture.detectChanges();

    const sections = fixture.nativeElement.querySelectorAll('.app-pokedex-section');
    expect(sections.length).toBe(2);
    expect(sections[0].textContent).toContain('bulbasaur');
    expect(sections[1].querySelector('.app-pokedex-section__title')?.textContent).toContain('The Isle of Armor');
  });

  it('una especie presente en la Pokédex regional Y en la de un DLC aparece en ambas secciones (019, FR-010)', () => {
    const dlc = new GameDlc('the-isle-of-armor', 'The Isle of Armor');
    const game = new Game('sword-shield', 'Sword/Shield', new Generation('generation-viii', 'VIII'), [dlc]);
    const slowpokeDetail = makeEntry('slowpoke', 42, { kind: 'regional' });

    const fixture = configure(
      {
        status: () => 'ready',
        filterCriteria: () => new PokedexFilterCriteria(),
      useNationalDex: () => false,
        // Dos PokedexIndexEntry para la MISMA especie, cada una con su
        // propia fuente — exactamente lo que produce el índice tras la
        // corrección de `pokeapi-pokedex-index-repository.service.ts`.
        pokedexIndex: () => [
          new PokedexIndexEntry('slowpoke', 42, { kind: 'regional' }),
          new PokedexIndexEntry('slowpoke', 1, { kind: 'dlc', dlcId: 'the-isle-of-armor' }),
        ],
        pokedexDetailsById: () => new Map([['slowpoke', slowpokeDetail]]),
        hasMoreBatches: () => false,
        isLoadingBatch: () => false,
        batchError: () => false,
        updateFilterCriteria: jasmine.createSpy('updateFilterCriteria'),
        toggleNationalDex: jasmine.createSpy('toggleNationalDex'),
        loadNextBatch: jasmine.createSpy('loadNextBatch'),
        retryBatch: jasmine.createSpy('retryBatch'),
        load: jasmine.createSpy('load'),
      },
      { currentGame: () => game, currentActiveDlcIds: () => new Set(['the-isle-of-armor']) },
    );
    fixture.detectChanges();

    const sections = fixture.nativeElement.querySelectorAll('.app-pokedex-section');
    expect(sections.length).toBe(2);
    expect(sections[0].querySelectorAll('app-pokedex-entry-card').length).toBe(1);
    expect(sections[1].querySelectorAll('app-pokedex-entry-card').length).toBe(1);
  });

  it('activar/desactivar un toggle de DLC delega en el puerto GameSelectionReader (FR-009)', () => {
    const dlc = new GameDlc('the-isle-of-armor', 'The Isle of Armor');
    const game = new Game('sword-shield', 'Sword/Shield', new Generation('generation-viii', 'VIII'), [dlc]);
    const toggleDlc = jasmine.createSpy('toggleDlc');

    const fixture = configure(
      {
        status: () => 'ready',
        filterCriteria: () => new PokedexFilterCriteria(),
      useNationalDex: () => false,
        pokedexIndex: () => [],
        pokedexDetailsById: () => new Map(),
        hasMoreBatches: () => false,
        isLoadingBatch: () => false,
        batchError: () => false,
        updateFilterCriteria: jasmine.createSpy('updateFilterCriteria'),
        toggleNationalDex: jasmine.createSpy('toggleNationalDex'),
        loadNextBatch: jasmine.createSpy('loadNextBatch'),
        retryBatch: jasmine.createSpy('retryBatch'),
        load: jasmine.createSpy('load'),
      },
      { currentGame: () => game, currentActiveDlcIds: () => new Set<string>(), toggleDlc },
    );
    fixture.detectChanges();

    fixture.nativeElement.querySelector('app-dlc-toggle-list mat-slide-toggle button')?.click();

    expect(toggleDlc).toHaveBeenCalledWith('the-isle-of-armor');
  });

  it('actualizar el filtro de generación delega en el servicio con la Generation resuelta (020)', () => {
    const updateFilterCriteria = jasmine.createSpy('updateFilterCriteria');
    const generationEntry = makeEntry('bulbasaur', 1);
    const fixture = configure({
      status: () => 'ready',
      filterCriteria: () => new PokedexFilterCriteria(),
      useNationalDex: () => false,
      pokedexIndex: () => [new PokedexIndexEntry('bulbasaur', 1, { kind: 'regional' })],
      pokedexDetailsById: () => new Map([['bulbasaur', generationEntry]]),
      hasMoreBatches: () => false,
      isLoadingBatch: () => false,
      batchError: () => false,
      updateFilterCriteria,
      toggleNationalDex: jasmine.createSpy('toggleNationalDex'),
      loadNextBatch: jasmine.createSpy('loadNextBatch'),
      retryBatch: jasmine.createSpy('retryBatch'),
      load: jasmine.createSpy('load'),
    });
    fixture.detectChanges();

    fixture.componentInstance['updateGenerationFilter']('generation-i');

    expect(updateFilterCriteria).toHaveBeenCalled();
    const passedCriteria = updateFilterCriteria.calls.mostRecent().args[0] as PokedexFilterCriteria;
    expect(passedCriteria.generation?.id).toBe('generation-i');
  });

  it('cada sección de la Pokédex (incluida "main") tiene una cabecera clicable que la colapsa/expande (020, "agilizar")', () => {
    const dlc = new GameDlc('the-isle-of-armor', 'The Isle of Armor');
    const game = new Game('sword-shield', 'Sword/Shield', new Generation('generation-viii', 'VIII'), [dlc]);
    const mainEntry = makeEntry('bulbasaur', 1, { kind: 'regional' });
    const dlcEntry = makeEntry('kubfu', 2, { kind: 'dlc', dlcId: 'the-isle-of-armor' });

    const fixture = configure(
      {
        status: () => 'ready',
        filterCriteria: () => new PokedexFilterCriteria(),
        useNationalDex: () => false,
        pokedexIndex: () => [
          new PokedexIndexEntry('bulbasaur', 1, { kind: 'regional' }),
          new PokedexIndexEntry('kubfu', 2, { kind: 'dlc', dlcId: 'the-isle-of-armor' }),
        ],
        pokedexDetailsById: () => new Map([['bulbasaur', mainEntry], ['kubfu', dlcEntry]]),
        hasMoreBatches: () => false,
        isLoadingBatch: () => false,
        batchError: () => false,
        updateFilterCriteria: jasmine.createSpy('updateFilterCriteria'),
        toggleNationalDex: jasmine.createSpy('toggleNationalDex'),
        loadNextBatch: jasmine.createSpy('loadNextBatch'),
        retryBatch: jasmine.createSpy('retryBatch'),
        load: jasmine.createSpy('load'),
      },
      { currentGame: () => game, currentActiveDlcIds: () => new Set(['the-isle-of-armor']) },
    );
    fixture.detectChanges();

    const [mainSection, dlcSection] = fixture.nativeElement.querySelectorAll('.app-pokedex-section');
    const mainHeader = mainSection.querySelector('.app-pokedex-section__header') as HTMLButtonElement;
    expect(mainHeader).not.toBeNull();
    expect(mainSection.querySelector('app-pokedex-entry-card')).not.toBeNull();

    mainHeader.click();
    fixture.detectChanges();

    // Colapsada: el grid deja de renderizarse (ahorro de trabajo real, no
    // solo oculto visualmente), pero la sección y su cabecera siguen ahí.
    expect(mainSection.querySelector('app-pokedex-entry-card')).toBeNull();
    expect(mainHeader.getAttribute('aria-expanded')).toBe('false');

    // La otra sección (DLC) no se ve afectada por el colapso de "main".
    expect(dlcSection.querySelector('app-pokedex-entry-card')).not.toBeNull();

    mainHeader.click();
    fixture.detectChanges();
    expect(mainSection.querySelector('app-pokedex-entry-card')).not.toBeNull();
    expect(mainHeader.getAttribute('aria-expanded')).toBe('true');
  });

  it('el filtro de la Pokédex tiene margen horizontal respecto al borde del contenedor (FR-015, US3)', () => {
    const fixture = configure({
      status: () => 'ready',
      filterCriteria: () => new PokedexFilterCriteria(),
      useNationalDex: () => false,
      pokedexIndex: () => [],
      pokedexDetailsById: () => new Map(),
      hasMoreBatches: () => false,
      isLoadingBatch: () => false,
      batchError: () => false,
      updateFilterCriteria: jasmine.createSpy('updateFilterCriteria'),
      toggleNationalDex: jasmine.createSpy('toggleNationalDex'),
      loadNextBatch: jasmine.createSpy('loadNextBatch'),
      retryBatch: jasmine.createSpy('retryBatch'),
      load: jasmine.createSpy('load'),
    });
    fixture.detectChanges();

    const filters = fixture.nativeElement.querySelector('.app-pokedex-filters') as HTMLElement;
    expect(filters).not.toBeNull();
    const computed = getComputedStyle(filters);
    expect(parseFloat(computed.paddingLeft)).toBeGreaterThan(0);
    expect(parseFloat(computed.paddingRight)).toBeGreaterThan(0);
  });
});
