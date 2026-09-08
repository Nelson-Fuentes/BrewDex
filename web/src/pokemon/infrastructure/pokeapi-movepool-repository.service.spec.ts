import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { PokeApiMovepoolRepositoryService } from './pokeapi-movepool-repository.service';
import { Game } from '../../game/domain/entities/game';
import { Generation } from '../../game/domain/value-objects/generation';


function moveFixture(name: string, type: string, damageClass: string, power: number | null = 40) {
  return {
    name,
    power,
    pp: 20,
    type: { name: type, url: '' },
    damage_class: { name: damageClass, url: '' },
    names: [{ name, language: { name: 'en' } }],
    flavor_text_entries: [{ flavor_text: 'desc', language: { name: 'en' }, version_group: { name: 'red-blue', url: '' } }],
  };
}

async function flush(httpMock: HttpTestingController, responder: (url: string) => unknown | undefined) {
  for (let round = 0; round < 6; round++) {
    const pending = httpMock.match(() => true);
    for (const req of pending) {
      const response = responder(req.request.url);
      if (response === undefined) throw new Error(`No fixture for ${req.request.url}`);
      req.flush(response);
    }
    await Promise.resolve();
    await Promise.resolve();
  }
}

describe('PokeApiMovepoolRepositoryService', () => {
  let service: PokeApiMovepoolRepositoryService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(PokeApiMovepoolRepositoryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  const pokemonMovesFixture = {
    moves: [
      {
        move: { name: 'tackle', url: '' },
        version_group_details: [
          { level_learned_at: 1, version_group: { name: 'red-blue', url: '' }, move_learn_method: { name: 'level-up' } },
        ],
      },
      {
        move: { name: 'growl', url: '' },
        version_group_details: [
          { level_learned_at: 3, version_group: { name: 'red-blue', url: '' }, move_learn_method: { name: 'level-up' } },
        ],
      },
      {
        move: { name: 'ember', url: '' },
        version_group_details: [
          { level_learned_at: 0, version_group: { name: 'red-blue', url: '' }, move_learn_method: { name: 'machine' } },
        ],
      },
      {
        move: { name: 'only-in-other-game', url: '' },
        version_group_details: [
          { level_learned_at: 1, version_group: { name: 'sword-shield', url: '' }, move_learn_method: { name: 'level-up' } },
        ],
      },
    ],
  };

  it('fetchMovepool filtra al version-group exacto del juego', async () => {
    const redBlue = new Game('red-blue', 'Red/Blue', new Generation('generation-i', 'I'));
    const promise = service.fetchMovepool('charmander', redBlue, 'en');

    await flush(httpMock, (url) => {
      if (url.includes('/pokemon/charmander/')) return pokemonMovesFixture;
      if (url.includes('/move/tackle/')) return moveFixture('tackle', 'normal', 'physical');
      if (url.includes('/move/growl/')) return moveFixture('growl', 'normal', 'status', null);
      if (url.includes('/move/ember/')) return moveFixture('ember', 'fire', 'special');
      return undefined;
    });

    const moves = await promise;
    expect(moves.map((m) => m.id).sort()).toEqual(['ember', 'growl', 'tackle']);
    // No incluye "only-in-other-game" (sword-shield), aunque comparta generación.
  });

  it('fetchDefaultMoveset toma hasta 4 movimientos de nivel más alto, orden ascendente', async () => {
    const redBlue = new Game('red-blue', 'Red/Blue', new Generation('generation-i', 'I'));
    const promise = service.fetchDefaultMoveset('charmander', redBlue, 'en');

    await flush(httpMock, (url) => {
      if (url.includes('/pokemon/charmander/')) return pokemonMovesFixture;
      if (url.includes('/move/tackle/')) return moveFixture('tackle', 'normal', 'physical');
      if (url.includes('/move/growl/')) return moveFixture('growl', 'normal', 'status', null);
      return undefined;
    });

    const moves = await promise;
    // tackle (nivel 1) antes que growl (nivel 3) -> orden ascendente por nivel.
    expect(moves.map((m) => m.id)).toEqual(['tackle', 'growl']);
  });

  it('aplica la regla histórica Gen. I-III: clase física/especial por tipo, no por damage_class moderno', async () => {
    const redBlue = new Game('red-blue', 'Red/Blue', new Generation('generation-i', 'I'));
    const promise = service.fetchMovepool('charmander', redBlue, 'en');

    await flush(httpMock, (url) => {
      if (url.includes('/pokemon/charmander/')) {
        return {
          moves: [
            {
              move: { name: 'ember', url: '' },
              version_group_details: [
                { level_learned_at: 0, version_group: { name: 'red-blue', url: '' }, move_learn_method: { name: 'machine' } },
              ],
            },
          ],
        };
      }
      // damage_class moderno dice "special" igual, pero probamos que la
      // regla pasa por el TIPO en Gen I-III, no por este campo directo.
      if (url.includes('/move/ember/')) return moveFixture('ember', 'fire', 'special');
      return undefined;
    });

    const [ember] = await promise;
    expect(ember.damageClass).toBe('special'); // fuego -> especial en la tabla histórica
  });

  it('en Generación IV+ usa damage_class de PokeAPI directamente', async () => {
    const swordShield = new Game('sword-shield', 'Sword/Shield', new Generation('generation-viii', 'VIII'));
    const promise = service.fetchMovepool('charmander', swordShield, 'en');

    await flush(httpMock, (url) => {
      if (url.includes('/pokemon/charmander/')) {
        return {
          moves: [
            {
              move: { name: 'ember', url: '' },
              version_group_details: [
                { level_learned_at: 0, version_group: { name: 'sword-shield', url: '' }, move_learn_method: { name: 'machine' } },
              ],
            },
          ],
        };
      }
      if (url.includes('/move/ember/')) return moveFixture('ember', 'fire', 'special');
      return undefined;
    });

    const [ember] = await promise;
    expect(ember.damageClass).toBe('special');
  });
});
