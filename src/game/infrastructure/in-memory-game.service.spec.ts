import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { InMemoryGameService } from './in-memory-game.service';
import { PokeApiGameCatalogRepositoryService } from './pokeapi-game-catalog-repository.service';
import { ACTIVE_LANGUAGE_READER } from '../../shared/tokens/active-language-reader.token';
import { Game } from '../domain/entities/game';
import { GameDlc } from '../domain/value-objects/game-dlc';
import { Generation } from '../domain/value-objects/generation';

describe('InMemoryGameService', () => {
  const generation = new Generation('generation-viii', 'VIII');
  const dlc = new GameDlc('the-isle-of-armor', 'The Isle of Armor');
  const game = new Game('sword-shield', 'Sword/Shield', generation, [dlc]);

  function setup(catalog: Game[]) {
    const languageChanged = new Subject<string>();
    TestBed.configureTestingModule({
      providers: [
        InMemoryGameService,
        { provide: PokeApiGameCatalogRepositoryService, useValue: { fetchCatalog: () => Promise.resolve(catalog) } },
        {
          provide: ACTIVE_LANGUAGE_READER,
          useValue: { currentLanguageCode: () => 'en', onLanguageChanged: () => languageChanged.asObservable() },
        },
      ],
    });
    return { service: TestBed.inject(InMemoryGameService), languageChanged };
  }

  it('carga el catálogo y expone status "ready"', async () => {
    const { service } = setup([game]);
    await service.load();

    expect(service.status()).toBe('ready');
    expect(service.catalog()).toEqual([game]);
  });

  it('selectGame fija el juego activo y reinicia los DLC activos (FR-007/FR-015)', async () => {
    const { service } = setup([game]);
    await service.load();

    service.toggleDlc('the-isle-of-armor');
    expect(service.activeDlcIds().has('the-isle-of-armor')).toBeTrue();

    service.selectGame(game);

    expect(service.activeGame()).toBe(game);
    expect(service.activeDlcIds().size).toBe(0);
  });

  it('toggleDlc activa y desactiva un DLC', async () => {
    const { service } = setup([game]);
    await service.load();
    service.selectGame(game);

    service.toggleDlc('the-isle-of-armor');
    expect(service.activeDlcIds().has('the-isle-of-armor')).toBeTrue();

    service.toggleDlc('the-isle-of-armor');
    expect(service.activeDlcIds().has('the-isle-of-armor')).toBeFalse();
  });

  it('recarga el catálogo cuando cambia el idioma activo', async () => {
    const { service, languageChanged } = setup([game]);
    await service.load();

    const spy = spyOn(service, 'load').and.callThrough();
    languageChanged.next('es');
    await Promise.resolve();

    expect(spy).toHaveBeenCalled();
  });

  it('implementa GameSelectionReader: currentGame/currentActiveDlcIds/onSelectionChanged', async () => {
    const { service } = setup([game]);
    await service.load();

    const emissions: void[] = [];
    service.onSelectionChanged().subscribe(() => emissions.push(undefined));

    service.selectGame(game);
    expect(service.currentGame()).toBe(game);

    service.toggleDlc('the-isle-of-armor');
    expect(service.currentActiveDlcIds().has('the-isle-of-armor')).toBeTrue();

    expect(emissions.length).toBe(2); // selectGame + toggleDlc
  });
});
