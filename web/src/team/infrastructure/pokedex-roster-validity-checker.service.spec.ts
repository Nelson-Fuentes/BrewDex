import { TestBed } from '@angular/core/testing';

import { PokedexRosterValidityCheckerService } from './pokedex-roster-validity-checker.service';
import { POKEMON_REPOSITORY } from '../../shared/tokens/pokemon-repository.token';
import { Game } from '../../game/domain/entities/game';
import { Generation } from '../../game/domain/value-objects/generation';
import { PokedexEntry } from '../../pokemon/domain/entities/pokedex-entry';
import { PokemonType } from '../../pokemon/domain/value-objects/pokemon-type';
import { PokemonStats } from '../../pokemon/domain/value-objects/pokemon-stats';

const game = new Game('sword-shield', 'Sword/Shield', new Generation('generation-viii', 'VIII'));

function entryFor(id: string): PokedexEntry {
  return new PokedexEntry(
    id,
    id,
    1,
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
    game.generation,
    { kind: 'regional' },
    new PokemonStats(1, 1, 1, 1, 1, 1),
  );
}

describe('PokedexRosterValidityCheckerService', () => {
  it('devuelve solo los ids que el repositorio resolvió', async () => {
    TestBed.configureTestingModule({
      providers: [
        PokedexRosterValidityCheckerService,
        {
          provide: POKEMON_REPOSITORY,
          useValue: { fetchPokedexDetails: () => Promise.resolve([entryFor('pikachu')]) },
        },
      ],
    });
    const service = TestBed.inject(PokedexRosterValidityCheckerService);

    const result = await service.validFor(game, ['pikachu', 'no-longer-in-this-game']);

    expect(result).toEqual(['pikachu']);
  });

  it('devuelve [] (no propaga el error) si la fuente falla', async () => {
    TestBed.configureTestingModule({
      providers: [
        PokedexRosterValidityCheckerService,
        { provide: POKEMON_REPOSITORY, useValue: { fetchPokedexDetails: () => Promise.reject(new Error('down')) } },
      ],
    });
    const service = TestBed.inject(PokedexRosterValidityCheckerService);

    const result = await service.validFor(game, ['pikachu']);

    expect(result).toEqual([]);
  });

  it('devuelve [] sin llamar al repositorio cuando el roster está vacío', async () => {
    TestBed.configureTestingModule({
      providers: [
        PokedexRosterValidityCheckerService,
        { provide: POKEMON_REPOSITORY, useValue: { fetchPokedexDetails: jasmine.createSpy() } },
      ],
    });
    const service = TestBed.inject(PokedexRosterValidityCheckerService);

    const result = await service.validFor(game, []);

    expect(result).toEqual([]);
  });
});
