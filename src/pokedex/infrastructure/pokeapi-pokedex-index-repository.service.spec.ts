import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { PokeApiPokedexIndexRepositoryService } from './pokeapi-pokedex-index-repository.service';
import { Game } from '../../game/domain/entities/game';
import { Generation } from '../../game/domain/value-objects/generation';
import { GameDlc } from '../../game/domain/value-objects/game-dlc';
import { PokedexView } from '../domain/value-objects/pokedex-view';


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

describe('PokeApiPokedexIndexRepositoryService', () => {
  let service: PokeApiPokedexIndexRepositoryService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(PokeApiPokedexIndexRepositoryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  const dlc = new GameDlc('the-isle-of-armor', 'The Isle of Armor');
  const swordShield = new Game('sword-shield', 'Sword/Shield', new Generation('generation-viii', 'VIII'), [dlc]);

  it('sin DLC activo, solo trae la Pokédex regional base', async () => {
    const promise = service.fetchPokedexIndex(swordShield, new PokedexView());

    await flush(httpMock, (url) => {
      if (url.includes('/version-group/sword-shield/')) {
        return { pokedexes: [{ name: 'galar', url: '' }, { name: 'isle-of-armor', url: '' }] };
      }
      if (url.includes('/version-group/the-isle-of-armor/')) return { pokedexes: [{ name: 'isle-of-armor', url: '' }] };
      if (url.includes('/pokedex/galar/')) {
        return { pokemon_entries: [{ entry_number: 1, pokemon_species: { name: 'grookey', url: '' } }] };
      }
      return undefined;
    });

    const index = await promise;
    expect(index.map((e) => e.pokemonId)).toEqual(['grookey']);
    expect(index[0].sourceTag).toEqual({ kind: 'regional' });
  });

  it('con el DLC activo, mezcla también su Pokédex propia (FR-018)', async () => {
    const promise = service.fetchPokedexIndex(swordShield, new PokedexView(false, new Set(['the-isle-of-armor'])));

    await flush(httpMock, (url) => {
      if (url.includes('/version-group/sword-shield/')) {
        return { pokedexes: [{ name: 'galar', url: '' }, { name: 'isle-of-armor', url: '' }] };
      }
      if (url.includes('/version-group/the-isle-of-armor/')) return { pokedexes: [{ name: 'isle-of-armor', url: '' }] };
      if (url.includes('/pokedex/galar/')) {
        return { pokemon_entries: [{ entry_number: 1, pokemon_species: { name: 'grookey', url: '' } }] };
      }
      if (url.includes('/pokedex/isle-of-armor/')) {
        return { pokemon_entries: [{ entry_number: 1, pokemon_species: { name: 'slowpoke', url: '' } }] };
      }
      return undefined;
    });

    const index = await promise;
    expect(index.map((e) => e.pokemonId).sort()).toEqual(['grookey', 'slowpoke']);
    expect(index.find((e) => e.pokemonId === 'slowpoke')?.sourceTag).toEqual({ kind: 'dlc', dlcId: 'the-isle-of-armor' });
  });

  it('una especie que existe en la Pokédex regional Y en la del DLC aparece una vez por cada una (019, FR-010)', async () => {
    const promise = service.fetchPokedexIndex(swordShield, new PokedexView(false, new Set(['the-isle-of-armor'])));

    await flush(httpMock, (url) => {
      if (url.includes('/version-group/sword-shield/')) {
        return { pokedexes: [{ name: 'galar', url: '' }, { name: 'isle-of-armor', url: '' }] };
      }
      if (url.includes('/version-group/the-isle-of-armor/')) return { pokedexes: [{ name: 'isle-of-armor', url: '' }] };
      // "slowpoke" existe en AMBAS pokedexes (caso real: Espada/Escudo).
      if (url.includes('/pokedex/galar/')) {
        return {
          pokemon_entries: [
            { entry_number: 1, pokemon_species: { name: 'grookey', url: '' } },
            { entry_number: 42, pokemon_species: { name: 'slowpoke', url: '' } },
          ],
        };
      }
      if (url.includes('/pokedex/isle-of-armor/')) {
        return { pokemon_entries: [{ entry_number: 1, pokemon_species: { name: 'slowpoke', url: '' } }] };
      }
      return undefined;
    });

    const index = await promise;
    const slowpokeEntries = index.filter((e) => e.pokemonId === 'slowpoke');
    expect(slowpokeEntries.length).toBe(2);
    expect(slowpokeEntries.map((e) => e.sourceTag).sort((a, b) => a.kind.localeCompare(b.kind))).toEqual([
      { kind: 'dlc', dlcId: 'the-isle-of-armor' },
      { kind: 'regional' },
    ]);
  });

  it('la Pokédex nacional excluye especies de una generación posterior a la del juego', async () => {
    const redBlue = new Game('red-blue', 'Red/Blue', new Generation('generation-i', 'I'));
    // generation-i NO es elegible para nacional per la regla — usamos un
    // juego de generación-iv para probar el recorte por generación.
    const platinum = new Game('platinum', 'Platinum', new Generation('generation-iv', 'IV'));
    void redBlue;
    const promise = service.fetchPokedexIndex(platinum, new PokedexView(true));

    await flush(httpMock, (url) => {
      if (url.includes('/pokedex/national/')) {
        return {
          pokemon_entries: [
            { entry_number: 1, pokemon_species: { name: 'bulbasaur', url: '' } },
            { entry_number: 495, pokemon_species: { name: 'snivy', url: '' } },
          ],
        };
      }
      if (url.includes('/pokemon-species/bulbasaur/')) return { generation: { name: 'generation-i', url: '' } };
      if (url.includes('/pokemon-species/snivy/')) return { generation: { name: 'generation-v', url: '' } };
      return undefined;
    });

    const index = await promise;
    // snivy es de generation-v, posterior a platinum (generation-iv) -> excluida.
    expect(index.map((e) => e.pokemonId)).toEqual(['bulbasaur']);
  });

  it('Let\'s Go Pikachu/Eevee no tiene Pokédex nacional pese a ser de una generación elegible (020, ronda 6)', async () => {
    // generation-vii es elegible por regla general (Sol/Luna sí la
    // tienen), pero Let's Go Pikachu/Eevee, de esa misma generación, solo
    // expone la Pokédex de Kanto en el juego real — verificado contra
    // PokeAPI: su version-group solo declara el pokedex `letsgo-kanto`,
    // sin ninguno nacional.
    const letsGo = new Game(
      'lets-go-pikachu-lets-go-eevee',
      "Let's Go, Pikachu!/Let's Go, Eevee!",
      new Generation('generation-vii', 'VII'),
    );
    const promise = service.fetchPokedexIndex(letsGo, new PokedexView(true));

    await flush(httpMock, (url) => {
      // Si cayera (incorrectamente) a la nacional, pediría este recurso.
      if (url.includes('/pokedex/national/')) {
        throw new Error('No debería consultar la Pokédex nacional para Let\'s Go');
      }
      if (url.includes('/version-group/lets-go-pikachu-lets-go-eevee/')) {
        return { pokedexes: [{ name: 'letsgo-kanto', url: '' }] };
      }
      if (url.includes('/pokedex/letsgo-kanto/')) {
        return { pokemon_entries: [{ entry_number: 1, pokemon_species: { name: 'pikachu', url: '' } }] };
      }
      return undefined;
    });

    const index = await promise;
    expect(index.map((e) => e.pokemonId)).toEqual(['pikachu']);
    expect(index[0].sourceTag).toEqual({ kind: 'regional' });
  });
});
