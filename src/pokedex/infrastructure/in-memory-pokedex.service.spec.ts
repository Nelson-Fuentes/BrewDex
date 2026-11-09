import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { InMemoryPokedexService } from './in-memory-pokedex.service';
import { PokeApiPokedexIndexRepositoryService } from './pokeapi-pokedex-index-repository.service';
import { POKEMON_REPOSITORY } from '../../shared/tokens/pokemon-repository.token';
import { GAME_SELECTION_READER } from '../../shared/tokens/game-selection-reader.token';
import { ACTIVE_LANGUAGE_READER } from '../../shared/tokens/active-language-reader.token';
import { Game } from '../../game/domain/entities/game';
import { Generation } from '../../game/domain/value-objects/generation';
import { PokedexIndexEntry } from '../domain/value-objects/pokedex-index-entry';
import { PokedexFilterCriteria } from '../domain/value-objects/pokedex-filter-criteria';
import { PokedexEntry } from '../../pokemon/domain/entities/pokedex-entry';
import { PokemonType } from '../../pokemon/domain/value-objects/pokemon-type';
import { PokemonStats } from '../../pokemon/domain/value-objects/pokemon-stats';

function makeEntry(id: string, number: number): PokedexEntry {
  return new PokedexEntry(
    id,
    id,
    number,
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
    new PokemonType('normal', 'Normal'),
    null,
    new Generation('generation-i', 'I'),
    { kind: 'regional' },
    new PokemonStats(45, 49, 49, 65, 65, 45),
  );
}

describe('InMemoryPokedexService', () => {
  const game = new Game('red-blue', 'Red/Blue', new Generation('generation-i', 'I'));
  const indexEntries = [new PokedexIndexEntry('bulbasaur', 1, { kind: 'regional' })];
  /** 25 entradas — más que un lote (10-20) para ejercitar la paginación. */
  const largeIndex = Array.from({ length: 25 }, (_, i) => new PokedexIndexEntry(`pokemon-${i + 1}`, i + 1, { kind: 'regional' }));

  function setup(currentGame: Game | null, index: readonly PokedexIndexEntry[] = indexEntries) {
    const selectionChanged = new Subject<void>();
    const fetchPokedexDetails = jasmine
      .createSpy('fetchPokedexDetails')
      .and.callFake(async (_game: Game, _view: unknown, ids: readonly string[]) => ids.map((id, i) => makeEntry(id, i + 1)));
    TestBed.configureTestingModule({
      providers: [
        InMemoryPokedexService,
        {
          provide: PokeApiPokedexIndexRepositoryService,
          useValue: { fetchPokedexIndex: jasmine.createSpy('fetchPokedexIndex').and.resolveTo(index) },
        },
        { provide: POKEMON_REPOSITORY, useValue: { fetchPokedexDetails } },
        {
          provide: GAME_SELECTION_READER,
          useValue: {
            currentGame: () => currentGame,
            currentActiveDlcIds: () => new Set<string>(),
            onSelectionChanged: () => selectionChanged.asObservable(),
          },
        },
        {
          provide: ACTIVE_LANGUAGE_READER,
          useValue: { currentLanguageCode: () => 'en', onLanguageChanged: () => new Subject<string>().asObservable() },
        },
      ],
    });
    return { service: TestBed.inject(InMemoryPokedexService), selectionChanged, fetchPokedexDetails };
  }

  it('no hace nada si todavía no hay un juego activo', async () => {
    const { service } = setup(null);
    await service.load();
    expect(service.status()).toBe('idle');
  });

  it('carga el índice y expone status "ready" cuando ya hay un juego activo', async () => {
    const { service } = setup(game);
    await service.load();

    expect(service.status()).toBe('ready');
    expect(service.pokedexIndex()).toEqual(indexEntries);
  });

  it('recarga cuando cambia la selección de juego/DLC', async () => {
    const { service, selectionChanged } = setup(game);
    const spy = spyOn(service, 'load').and.callThrough();

    selectionChanged.next();
    await Promise.resolve();

    expect(spy).toHaveBeenCalled();
  });

  it('updateFilterCriteria actualiza el signal sin llamar a la red', () => {
    const { service } = setup(game);
    const criteria = new PokedexFilterCriteria('char');

    service.updateFilterCriteria(criteria);

    expect(service.filterCriteria()).toBe(criteria);
  });

  it('toggleNationalDex actualiza la vista y recarga', async () => {
    const { service } = setup(game);
    const spy = spyOn(service, 'load').and.callThrough();

    service.toggleNationalDex(true);
    await Promise.resolve();

    expect(spy).toHaveBeenCalled();
  });

  it('expone el estado real del toggle nacional, y puede apagarse (019)', async () => {
    const { service } = setup(game);
    await service.load();
    expect(service.useNationalDex()).toBeFalse();

    service.toggleNationalDex(true);
    await Promise.resolve();
    expect(service.useNationalDex()).toBeTrue();

    service.toggleNationalDex(false);
    await Promise.resolve();
    expect(service.useNationalDex()).toBeFalse();
  });

  it('la Pokédex nacional es un estado por JUEGO — se resetea a apagado al cambiar de juego (019, FR-004)', async () => {
    const otherGame = new Game('sword-shield', 'Sword/Shield', new Generation('generation-viii', 'VIII'));
    const selectionChanged = new Subject<void>();
    const currentGame = { value: game as Game };
    TestBed.configureTestingModule({
      providers: [
        InMemoryPokedexService,
        { provide: PokeApiPokedexIndexRepositoryService, useValue: { fetchPokedexIndex: jasmine.createSpy().and.resolveTo(indexEntries) } },
        { provide: POKEMON_REPOSITORY, useValue: { fetchPokedexDetails: jasmine.createSpy().and.resolveTo([]) } },
        {
          provide: GAME_SELECTION_READER,
          useValue: {
            currentGame: () => currentGame.value,
            currentActiveDlcIds: () => new Set<string>(),
            onSelectionChanged: () => selectionChanged.asObservable(),
          },
        },
        {
          provide: ACTIVE_LANGUAGE_READER,
          useValue: { currentLanguageCode: () => 'en', onLanguageChanged: () => new Subject<string>().asObservable() },
        },
      ],
    });
    const service = TestBed.inject(InMemoryPokedexService);
    await service.load();
    service.toggleNationalDex(true);
    await Promise.resolve();
    expect(service.useNationalDex()).toBeTrue();

    currentGame.value = otherGame;
    await service.load();

    expect(service.useNationalDex()).toBeFalse();
  });

  it('detailsFor (PokedexDetailsReader) devuelve null hasta que el detalle resuelva', () => {
    const { service } = setup(game);
    expect(service.detailsFor('bulbasaur')).toBeNull();
  });

  describe('paginación (018, FR-012/FR-013)', () => {
    it('load() solo resuelve el primer lote (10-20), no todo el índice', async () => {
      const { service, fetchPokedexDetails } = setup(game, largeIndex);
      await service.load();

      expect(fetchPokedexDetails).toHaveBeenCalledTimes(1);
      const requestedIds = fetchPokedexDetails.calls.mostRecent().args[2] as string[];
      expect(requestedIds.length).toBeGreaterThanOrEqual(10);
      expect(requestedIds.length).toBeLessThanOrEqual(20);
      expect(service.pokedexDetailsById().size).toBe(requestedIds.length);
      expect(service.hasMoreBatches()).toBeTrue();
    });

    it('loadNextBatch() resuelve el siguiente lote y lo fusiona con lo ya resuelto', async () => {
      const { service, fetchPokedexDetails } = setup(game, largeIndex);
      await service.load();
      const firstBatchSize = service.pokedexDetailsById().size;

      await service.loadNextBatch();

      expect(fetchPokedexDetails).toHaveBeenCalledTimes(2);
      expect(service.pokedexDetailsById().size).toBeGreaterThan(firstBatchSize);
    });

    it('agota los lotes hasta resolver todo el índice, y hasMoreBatches queda en false', async () => {
      const { service } = setup(game, largeIndex);
      await service.load();

      while (service.hasMoreBatches()) {
        await service.loadNextBatch();
      }

      expect(service.pokedexDetailsById().size).toBe(largeIndex.length);
      expect(service.hasMoreBatches()).toBeFalse();
    });

    it('un filtro no vacío agota los lotes automáticamente, sin llamadas manuales (FR-013a)', async () => {
      const { service } = setup(game, largeIndex);
      await service.load();
      expect(service.hasMoreBatches()).toBeTrue();

      service.updateFilterCriteria(new PokedexFilterCriteria('poke'));
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      expect(service.hasMoreBatches()).toBeFalse();
      expect(service.pokedexDetailsById().size).toBe(largeIndex.length);
    });

    it('un cambio de vista (mismo juego) NO limpia el detalle ya resuelto (019)', async () => {
      const selectionChanged = new Subject<void>();
      const indexSignal = { current: indexEntries as readonly PokedexIndexEntry[] };
      const fetchPokedexIndex = jasmine.createSpy('fetchPokedexIndex').and.callFake(async () => indexSignal.current);
      const fetchPokedexDetails = jasmine
        .createSpy('fetchPokedexDetails')
        .and.callFake(async (_g: Game, _v: unknown, ids: readonly string[]) => ids.map((id, i) => makeEntry(id, i + 1)));
      TestBed.configureTestingModule({
        providers: [
          InMemoryPokedexService,
          { provide: PokeApiPokedexIndexRepositoryService, useValue: { fetchPokedexIndex } },
          { provide: POKEMON_REPOSITORY, useValue: { fetchPokedexDetails } },
          {
            provide: GAME_SELECTION_READER,
            useValue: {
              currentGame: () => game,
              currentActiveDlcIds: () => new Set<string>(),
              onSelectionChanged: () => selectionChanged.asObservable(),
            },
          },
          {
            provide: ACTIVE_LANGUAGE_READER,
            useValue: { currentLanguageCode: () => 'en', onLanguageChanged: () => new Subject<string>().asObservable() },
          },
        ],
      });
      const service = TestBed.inject(InMemoryPokedexService);
      await service.load();
      expect(service.detailsFor('bulbasaur')).not.toBeNull();

      // Activar un DLC / la Pokédex nacional agrega especies nuevas al
      // índice del MISMO juego — no debe perderse lo ya resuelto.
      indexSignal.current = [...indexEntries, new PokedexIndexEntry('ivysaur', 2, { kind: 'dlc', dlcId: 'x' })];
      await service.load();

      expect(service.detailsFor('bulbasaur')).not.toBeNull();
      expect(service.detailsFor('ivysaur')).not.toBeNull();
      // Solo se pidió la especie nueva en la segunda carga, no bulbasaur de nuevo.
      expect(fetchPokedexDetails.calls.argsFor(1)[2]).toEqual(['ivysaur']);
    });

    it('un cambio de JUEGO sí limpia el detalle ya resuelto', async () => {
      const otherGame = new Game('sword-shield', 'Sword/Shield', new Generation('generation-viii', 'VIII'));
      const selectionChanged = new Subject<void>();
      const currentGame = { value: game as Game };
      const otherGameIndex = [new PokedexIndexEntry('grookey', 1, { kind: 'regional' })];
      const fetchPokedexIndex = jasmine
        .createSpy('fetchPokedexIndex')
        .and.callFake(async (g: Game) => (g.id === otherGame.id ? otherGameIndex : indexEntries));
      const fetchPokedexDetails = jasmine
        .createSpy('fetchPokedexDetails')
        .and.callFake(async (_g: Game, _v: unknown, ids: readonly string[]) => ids.map((id, i) => makeEntry(id, i + 1)));
      TestBed.configureTestingModule({
        providers: [
          InMemoryPokedexService,
          { provide: PokeApiPokedexIndexRepositoryService, useValue: { fetchPokedexIndex } },
          { provide: POKEMON_REPOSITORY, useValue: { fetchPokedexDetails } },
          {
            provide: GAME_SELECTION_READER,
            useValue: {
              currentGame: () => currentGame.value,
              currentActiveDlcIds: () => new Set<string>(),
              onSelectionChanged: () => selectionChanged.asObservable(),
            },
          },
          {
            provide: ACTIVE_LANGUAGE_READER,
            useValue: { currentLanguageCode: () => 'en', onLanguageChanged: () => new Subject<string>().asObservable() },
          },
        ],
      });
      const service = TestBed.inject(InMemoryPokedexService);
      await service.load();
      expect(service.detailsFor('bulbasaur')).not.toBeNull();

      currentGame.value = otherGame;
      await service.load();

      expect(service.detailsFor('bulbasaur')).toBeNull();
    });

    it('limpiar el filtro no vuelve a pedir ids ya resueltos', async () => {
      const { service, fetchPokedexDetails } = setup(game, largeIndex);
      await service.load();
      service.updateFilterCriteria(new PokedexFilterCriteria('poke'));
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      const callsWhileFiltered = fetchPokedexDetails.calls.count();

      service.updateFilterCriteria(new PokedexFilterCriteria());
      await Promise.resolve();
      await Promise.resolve();

      expect(fetchPokedexDetails.calls.count()).toBe(callsWhileFiltered);
    });
  });
});
