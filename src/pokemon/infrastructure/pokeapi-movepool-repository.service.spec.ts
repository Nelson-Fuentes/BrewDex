import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { PokeApiMovepoolRepositoryService } from './pokeapi-movepool-repository.service';
import { Game } from '../../game/domain/entities/game';
import { Generation } from '../../game/domain/value-objects/generation';


function moveFixture(
  name: string,
  type: string,
  damageClass: string,
  power: number | null = 40,
  machines: { item: string; versionGroup: string }[] = [],
  accuracy: number | null = 100,
) {
  return {
    name,
    power,
    accuracy,
    pp: 20,
    type: { name: type, url: '' },
    damage_class: { name: damageClass, url: '' },
    names: [{ name, language: { name: 'en' } }],
    flavor_text_entries: [{ flavor_text: 'desc', language: { name: 'en' }, version_group: { name: 'red-blue', url: '' } }],
    machines: machines.map((m) => ({
      machine: { name: m.item, url: `https://pokeapi.co/api/v2/machine/${m.item}/` },
      version_group: { name: m.versionGroup, url: '' },
    })),
  };
}

function machineFixture(item: string) {
  return { item: { name: item, url: '' } };
}

async function flush(httpMock: HttpTestingController, responder: (url: string) => unknown | undefined) {
  for (let round = 0; round < 8; round++) {
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
      if (url.includes('/move/ember/')) return moveFixture('ember', 'fire', 'special', 40, [{ item: 'tm11', versionGroup: 'red-blue' }]);
      if (url.includes('/machine/tm11/')) return machineFixture('tm11');
      return undefined;
    });

    const movepool = await promise;
    expect(movepool.map((info) => info.move.id).sort()).toEqual(['ember', 'growl', 'tackle']);
    // No incluye "only-in-other-game" (sword-shield), aunque comparta generación.
  });

  it('fetchMovepool resuelve el método "level" con su nivel asociado', async () => {
    const redBlue = new Game('red-blue', 'Red/Blue', new Generation('generation-i', 'I'));
    const promise = service.fetchMovepool('charmander', redBlue, 'en');

    await flush(httpMock, (url) => {
      if (url.includes('/pokemon/charmander/')) return pokemonMovesFixture;
      if (url.includes('/move/tackle/')) return moveFixture('tackle', 'normal', 'physical');
      if (url.includes('/move/growl/')) return moveFixture('growl', 'normal', 'status', null);
      if (url.includes('/move/ember/')) return moveFixture('ember', 'fire', 'special', 40, [{ item: 'tm11', versionGroup: 'red-blue' }]);
      if (url.includes('/machine/tm11/')) return machineFixture('tm11');
      return undefined;
    });

    const movepool = await promise;
    const tackle = movepool.find((info) => info.move.id === 'tackle')!;
    expect(tackle.methods).toEqual(['level']);
    expect(tackle.levelLearnedAt).toBe(1);
    expect(tackle.move.accuracy).toBe(100);
  });

  it('fetchMovepool distingue MT de MO por el item de la máquina (prefijo tm/hm)', async () => {
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
            {
              move: { name: 'fly', url: '' },
              version_group_details: [
                { level_learned_at: 0, version_group: { name: 'red-blue', url: '' }, move_learn_method: { name: 'machine' } },
              ],
            },
          ],
        };
      }
      if (url.includes('/move/ember/')) return moveFixture('ember', 'fire', 'special', 40, [{ item: 'tm11', versionGroup: 'red-blue' }]);
      if (url.includes('/move/fly/')) return moveFixture('fly', 'flying', 'physical', 90, [{ item: 'hm02', versionGroup: 'red-blue' }]);
      if (url.includes('/machine/tm11/')) return machineFixture('tm11');
      if (url.includes('/machine/hm02/')) return machineFixture('hm02');
      return undefined;
    });

    const movepool = await promise;
    expect(movepool.find((info) => info.move.id === 'ember')!.methods).toEqual(['tm']);
    expect(movepool.find((info) => info.move.id === 'fly')!.methods).toEqual(['hm']);
  });

  it('fetchMovepool combina nivel y MT en una sola entrada cuando ambos aplican en el mismo juego', async () => {
    const redBlue = new Game('red-blue', 'Red/Blue', new Generation('generation-i', 'I'));
    const promise = service.fetchMovepool('charmander', redBlue, 'en');

    await flush(httpMock, (url) => {
      if (url.includes('/pokemon/charmander/')) {
        return {
          moves: [
            {
              move: { name: 'tackle', url: '' },
              version_group_details: [
                { level_learned_at: 1, version_group: { name: 'red-blue', url: '' }, move_learn_method: { name: 'level-up' } },
                { level_learned_at: 0, version_group: { name: 'red-blue', url: '' }, move_learn_method: { name: 'machine' } },
              ],
            },
          ],
        };
      }
      if (url.includes('/move/tackle/')) return moveFixture('tackle', 'normal', 'physical', 40, [{ item: 'tm11', versionGroup: 'red-blue' }]);
      if (url.includes('/machine/tm11/')) return machineFixture('tm11');
      return undefined;
    });

    const movepool = await promise;
    expect(movepool.length).toBe(1);
    expect(movepool[0].methods).toEqual(['level', 'tm']);
    expect(movepool[0].levelLearnedAt).toBe(1);
  });

  it('un juego sin MOs (post-Gen VI) nunca devuelve el método "hm"', async () => {
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
      if (url.includes('/move/ember/')) return moveFixture('ember', 'fire', 'special', 40, [{ item: 'tm11', versionGroup: 'sword-shield' }]);
      if (url.includes('/machine/tm11/')) return machineFixture('tm11');
      return undefined;
    });

    const movepool = await promise;
    expect(movepool[0].methods).toEqual(['tm']);
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

  it('fetchDefaultMoveset no se ve afectado por el nuevo tipo de retorno de fetchMovepool (021, regresión T021)', async () => {
    const redBlue = new Game('red-blue', 'Red/Blue', new Generation('generation-i', 'I'));
    const promise = service.fetchDefaultMoveset('charmander', redBlue, 'en');

    await flush(httpMock, (url) => {
      if (url.includes('/pokemon/charmander/')) return pokemonMovesFixture;
      if (url.includes('/move/tackle/')) return moveFixture('tackle', 'normal', 'physical');
      if (url.includes('/move/growl/')) return moveFixture('growl', 'normal', 'status', null);
      return undefined;
    });

    const moves = await promise;
    // Sigue devolviendo Move[] planos (con .displayName/.type/.pp/.power
    // directos), no MoveLearnInfo[] — y sigue filtrando exclusivamente
    // por move_learn_method.name === 'level-up' (nunca incluye "ember",
    // que en pokemonMovesFixture solo se aprende por "machine").
    expect(moves.every((m) => 'displayName' in m && !('methods' in m))).toBeTrue();
    expect(moves.some((m) => m.id === 'ember')).toBeFalse();
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
      if (url.includes('/move/ember/')) return moveFixture('ember', 'fire', 'special', 40, [{ item: 'tm11', versionGroup: 'red-blue' }]);
      if (url.includes('/machine/tm11/')) return machineFixture('tm11');
      return undefined;
    });

    const [ember] = await promise;
    expect(ember.move.damageClass).toBe('special'); // fuego -> especial en la tabla histórica
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
      if (url.includes('/move/ember/')) return moveFixture('ember', 'fire', 'special', 40, [{ item: 'tm11', versionGroup: 'sword-shield' }]);
      if (url.includes('/machine/tm11/')) return machineFixture('tm11');
      return undefined;
    });

    const [ember] = await promise;
    expect(ember.move.damageClass).toBe('special');
  });

  it('fetchMovepool cae a Escarlata/Púrpura cuando Legends Z-A no tiene datos (bug reportado, fuente externa sin datos todavía)', async () => {
    const legendsZa = new Game('legends-za', 'Legends: Z-A', new Generation('generation-ix', 'IX'));
    const promise = service.fetchMovepool('pikachu', legendsZa, 'en');

    await flush(httpMock, (url) => {
      if (url.includes('/pokemon/pikachu/')) {
        return {
          moves: [
            {
              move: { name: 'thunderbolt', url: '' },
              // Sin ninguna entrada para "legends-za" -> el juego principal
              // no tiene datos; solo para el primer fallback configurado.
              version_group_details: [
                { level_learned_at: 0, version_group: { name: 'scarlet-violet', url: '' }, move_learn_method: { name: 'tutor' } },
              ],
            },
          ],
        };
      }
      if (url.includes('/move/thunderbolt/')) return moveFixture('thunderbolt', 'electric', 'special', 90);
      return undefined;
    });

    const movepool = await promise;
    expect(movepool.map((info) => info.move.id)).toEqual(['thunderbolt']);
    expect(movepool[0].methods).toEqual(['tutor']);
  });

  it('fetchMovepool sigue probando fallbacks en orden hasta encontrar uno con datos', async () => {
    const legendsZa = new Game('legends-za', 'Legends: Z-A', new Generation('generation-ix', 'IX'));
    const promise = service.fetchMovepool('pikachu', legendsZa, 'en');

    await flush(httpMock, (url) => {
      if (url.includes('/pokemon/pikachu/')) {
        return {
          moves: [
            {
              move: { name: 'thunder-wave', url: '' },
              // Ni "legends-za" ni "scarlet-violet" (primer fallback) tienen
              // datos -> debe seguir probando hasta "legends-arceus"
              // (segundo fallback configurado).
              version_group_details: [
                { level_learned_at: 9, version_group: { name: 'legends-arceus', url: '' }, move_learn_method: { name: 'level-up' } },
              ],
            },
          ],
        };
      }
      if (url.includes('/move/thunder-wave/')) return moveFixture('thunder-wave', 'electric', 'status', null);
      return undefined;
    });

    const movepool = await promise;
    expect(movepool.map((info) => info.move.id)).toEqual(['thunder-wave']);
    expect(movepool[0].levelLearnedAt).toBe(9);
  });

  it('fetchMovepool no aplica ningún fallback para un juego sin fallback configurado', async () => {
    const redBlue = new Game('red-blue', 'Red/Blue', new Generation('generation-i', 'I'));
    const promise = service.fetchMovepool('missingno', redBlue, 'en');

    await flush(httpMock, (url) => {
      if (url.includes('/pokemon/missingno/')) return { moves: [] };
      return undefined;
    });

    expect(await promise).toEqual([]);
  });

  it('fetchDefaultMoveset también cae a un juego de fallback cuando Legends Z-A no tiene movimientos por nivel', async () => {
    const legendsZa = new Game('legends-za', 'Legends: Z-A', new Generation('generation-ix', 'IX'));
    const promise = service.fetchDefaultMoveset('pikachu', legendsZa, 'en');

    await flush(httpMock, (url) => {
      if (url.includes('/pokemon/pikachu/')) {
        return {
          moves: [
            {
              move: { name: 'thunderbolt', url: '' },
              version_group_details: [
                { level_learned_at: 29, version_group: { name: 'scarlet-violet', url: '' }, move_learn_method: { name: 'level-up' } },
              ],
            },
          ],
        };
      }
      if (url.includes('/move/thunderbolt/')) return moveFixture('thunderbolt', 'electric', 'special', 90);
      return undefined;
    });

    const moveset = await promise;
    expect(moveset.map((m) => m.id)).toEqual(['thunderbolt']);
  });
});
