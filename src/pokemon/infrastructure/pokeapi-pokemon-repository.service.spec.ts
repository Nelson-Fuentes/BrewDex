import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { PokeApiPokemonRepositoryService } from './pokeapi-pokemon-repository.service';
import { PokedexUnavailable } from '../domain/ports/pokemon-repository';
import { Game } from '../../game/domain/entities/game';
import { Generation } from '../../game/domain/value-objects/generation';
import { GameDlc } from '../../game/domain/value-objects/game-dlc';
import { PokedexView } from '../../pokedex/domain/value-objects/pokedex-view';

const BASE = 'https://pokeapi.co/api/v2/';

const NAME_EN = (name: string) => [{ name, language: { name: 'en' } }];

function pokemonFixture(name: string, hp = 45) {
  return {
    name,
    types: [{ slot: 1, type: { name: 'grass', url: '' } }],
    stats: [
      { base_stat: hp, stat: { name: 'hp', url: '' } },
      { base_stat: 49, stat: { name: 'attack', url: '' } },
      { base_stat: 49, stat: { name: 'defense', url: '' } },
      { base_stat: 65, stat: { name: 'special-attack', url: '' } },
      { base_stat: 65, stat: { name: 'special-defense', url: '' } },
      { base_stat: 45, stat: { name: 'speed', url: '' } },
    ],
    sprites: { front_default: 'sprite.png', other: { home: { front_default: 'home.png', front_shiny: null, front_female: null, front_shiny_female: null } } },
    forms: [{ name, url: `${BASE}pokemon-form/${name}/` }],
  };
}

async function flushAllPending(
  httpMock: HttpTestingController,
  responder: (url: string) => unknown | undefined,
): Promise<void> {
  for (let round = 0; round < 8; round++) {
    const pending = httpMock.match(() => true);
    if (pending.length > 0) {
      for (const req of pending) {
        const response = responder(req.request.url);
        if (response === undefined) {
          throw new Error(`No fixture for ${req.request.url}`);
        }
        req.flush(response);
      }
    }
    await Promise.resolve();
    await Promise.resolve();
  }
}

describe('PokeApiPokemonRepositoryService', () => {
  let service: PokeApiPokemonRepositoryService;
  let httpMock: HttpTestingController;
  const game = new Game('red-blue', 'Red/Blue', new Generation('generation-i', 'I'));

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(PokeApiPokemonRepositoryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('devuelve [] sin ninguna llamada HTTP cuando pokemonIds está vacío', async () => {
    const result = await service.fetchPokedexDetails(game, new PokedexView(), [], 'en');
    expect(result).toEqual([]);
  });

  it('resuelve el detalle de una especie sin variedades adicionales', async () => {
    const promise = service.fetchPokedexDetails(game, new PokedexView(), ['bulbasaur'], 'en');

    await flushAllPending(httpMock, (url) => {
      if (url.includes('/version-group/red-blue/')) return { pokedexes: [{ name: 'kanto', url: '' }] };
      if (url.includes('/pokemon-species/bulbasaur/')) {
        return {
          gender_rate: 1,
          has_gender_differences: false,
          generation: { name: 'generation-i', url: '' },
          names: NAME_EN('Bulbasaur'),
          varieties: [{ is_default: true, pokemon: { name: 'bulbasaur', url: '' } }],
          pokedex_numbers: [{ entry_number: 1, pokedex: { name: 'kanto', url: '' } }],
        };
      }
      if (url.includes('/pokemon/bulbasaur/')) return pokemonFixture('bulbasaur');
      if (url.includes('/generation/generation-i/')) return { name: 'generation-i', names: NAME_EN('Generation I') };
      if (url.includes('/pokemon-form/bulbasaur/')) {
        return { name: 'bulbasaur', is_default: true, is_battle_only: false, is_mega: false, form_name: '', names: NAME_EN('Bulbasaur'), sprites: { front_default: 'sprite.png' } };
      }
      return undefined;
    });

    const [entry] = await promise;
    expect(entry.pokemonId).toBe('bulbasaur');
    expect(entry.displayName).toBe('Bulbasaur');
    expect(entry.pokedexNumber).toBe(1);
    expect(entry.typePrimary.id).toBe('grass');
    expect(entry.baseStats.hp).toBe(45);
    expect(entry.selectableForms).toEqual([]);
    // Un solo form en la lista -> sin variantes cosméticas (regla del value object).
    expect(entry.cosmeticVariants).toEqual([]);
  });

  it('usa el sprite del version-group del juego activo para el sprite de grilla, no el sprite genérico (FR-006, 018)', async () => {
    const promise = service.fetchPokedexDetails(game, new PokedexView(), ['bulbasaur'], 'en');

    await flushAllPending(httpMock, (url) => {
      if (url.includes('/version-group/red-blue/')) return { pokedexes: [{ name: 'kanto', url: '' }] };
      if (url.includes('/pokemon-species/bulbasaur/')) {
        return {
          gender_rate: 1,
          has_gender_differences: false,
          generation: { name: 'generation-i', url: '' },
          names: NAME_EN('Bulbasaur'),
          varieties: [{ is_default: true, pokemon: { name: 'bulbasaur', url: '' } }],
          pokedex_numbers: [{ entry_number: 1, pokedex: { name: 'kanto', url: '' } }],
        };
      }
      if (url.includes('/pokemon/bulbasaur/')) {
        return {
          ...pokemonFixture('bulbasaur'),
          sprites: {
            // El sprite "genérico" (moderno) — NO debe ser el usado para
            // el tile de la grilla cuando existe un sprite versionado
            // para el juego activo.
            front_default: 'modern-sprite.png',
            other: { home: { front_default: 'home.png', front_shiny: null, front_female: null, front_shiny_female: null } },
            versions: {
              'generation-i': {
                'red-blue': { front_default: 'gen1-red-blue-sprite.png' },
              },
            },
          },
        };
      }
      if (url.includes('/generation/generation-i/')) return { name: 'generation-i', names: NAME_EN('Generation I') };
      if (url.includes('/pokemon-form/bulbasaur/')) {
        return { name: 'bulbasaur', is_default: true, is_battle_only: false, is_mega: false, form_name: '', names: NAME_EN('Bulbasaur'), sprites: { front_default: 'sprite.png' } };
      }
      return undefined;
    });

    const [entry] = await promise;
    expect(entry.spriteUrl).toBe('gen1-red-blue-sprite.png');
    // El sprite de detalle/slot (home) es independiente de la generación —
    // no debe cambiar por este fix.
    expect(entry.homeSpriteUrl).toBe('home.png');
  });

  it('usa la clave de versión individual cuando el version-group no tiene bucket propio, p. ej. Oro/Plata (019)', async () => {
    const goldSilver = new Game('gold-silver', 'Gold/Silver', new Generation('generation-ii', 'II'));
    const promise = service.fetchPokedexDetails(goldSilver, new PokedexView(), ['bulbasaur'], 'en');

    await flushAllPending(httpMock, (url) => {
      if (url.includes('/version-group/gold-silver/')) return { pokedexes: [{ name: 'johto', url: '' }] };
      if (url.includes('/pokemon-species/bulbasaur/')) {
        return {
          gender_rate: 1,
          has_gender_differences: false,
          generation: { name: 'generation-ii', url: '' },
          names: NAME_EN('Bulbasaur'),
          varieties: [{ is_default: true, pokemon: { name: 'bulbasaur', url: '' } }],
          pokedex_numbers: [{ entry_number: 1, pokedex: { name: 'johto', url: '' } }],
        };
      }
      if (url.includes('/pokemon/bulbasaur/')) {
        return {
          ...pokemonFixture('bulbasaur'),
          sprites: {
            front_default: 'modern-sprite.png',
            other: { home: { front_default: 'home.png', front_shiny: null, front_female: null, front_shiny_female: null } },
            versions: { 'generation-ii': { gold: { front_default: 'gen2-gold-sprite.png' }, silver: { front_default: 'gen2-silver-sprite.png' } } },
          },
        };
      }
      if (url.includes('/generation/generation-ii/')) return { name: 'generation-ii', names: NAME_EN('Generation II') };
      if (url.includes('/pokemon-form/bulbasaur/')) {
        return { name: 'bulbasaur', is_default: true, is_battle_only: false, is_mega: false, form_name: '', names: NAME_EN('Bulbasaur'), sprites: { front_default: 'sprite.png' } };
      }
      return undefined;
    });

    const [entry] = await promise;
    expect(entry.spriteUrl).toBe('gen2-gold-sprite.png');
  });

  it('cae al bucket de Rojo/Azul para Rojo/Verde (Japón), que no tiene bucket propio en PokeAPI (019)', async () => {
    const redGreenJapan = new Game('red-green-japan', 'Red/Green', new Generation('generation-i', 'I'));
    const promise = service.fetchPokedexDetails(redGreenJapan, new PokedexView(), ['bulbasaur'], 'en');

    await flushAllPending(httpMock, (url) => {
      if (url.includes('/version-group/red-green-japan/')) return { pokedexes: [{ name: 'kanto', url: '' }] };
      if (url.includes('/pokemon-species/bulbasaur/')) {
        return {
          gender_rate: 1,
          has_gender_differences: false,
          generation: { name: 'generation-i', url: '' },
          names: NAME_EN('Bulbasaur'),
          varieties: [{ is_default: true, pokemon: { name: 'bulbasaur', url: '' } }],
          pokedex_numbers: [{ entry_number: 1, pokedex: { name: 'kanto', url: '' } }],
        };
      }
      if (url.includes('/pokemon/bulbasaur/')) {
        return {
          ...pokemonFixture('bulbasaur'),
          sprites: {
            front_default: 'modern-sprite.png',
            other: { home: { front_default: 'home.png', front_shiny: null, front_female: null, front_shiny_female: null } },
            versions: { 'generation-i': { yellow: { front_default: 'yellow.png' }, 'red-blue': { front_default: 'gen1-red-blue.png' } } },
          },
        };
      }
      if (url.includes('/generation/generation-i/')) return { name: 'generation-i', names: NAME_EN('Generation I') };
      if (url.includes('/pokemon-form/bulbasaur/')) {
        return { name: 'bulbasaur', is_default: true, is_battle_only: false, is_mega: false, form_name: '', names: NAME_EN('Bulbasaur'), sprites: { front_default: 'sprite.png' } };
      }
      return undefined;
    });

    const [entry] = await promise;
    expect(entry.spriteUrl).toBe('gen1-red-blue.png');
  });

  it('usa el tipo histórico (past_types) vigente en la generación del juego activo (019)', async () => {
    const blackWhite = new Game('black-white', 'Black/White', new Generation('generation-v', 'V'));
    const promise = service.fetchPokedexDetails(blackWhite, new PokedexView(), ['clefairy'], 'en');

    await flushAllPending(httpMock, (url) => {
      if (url.includes('/version-group/black-white/')) return { pokedexes: [{ name: 'unova', url: '' }] };
      if (url.includes('/pokemon-species/clefairy/')) {
        return {
          gender_rate: 4,
          has_gender_differences: false,
          generation: { name: 'generation-i', url: '' },
          names: NAME_EN('Clefairy'),
          varieties: [{ is_default: true, pokemon: { name: 'clefairy', url: '' } }],
          pokedex_numbers: [{ entry_number: 1, pokedex: { name: 'unova', url: '' } }],
        };
      }
      if (url.includes('/pokemon/clefairy/')) {
        return {
          ...pokemonFixture('clefairy'),
          types: [{ slot: 1, type: { name: 'fairy', url: '' } }],
          past_types: [{ generation: { name: 'generation-v', url: '' }, types: [{ slot: 1, type: { name: 'normal', url: '' } }] }],
        };
      }
      if (url.includes('/generation/generation-i/')) return { name: 'generation-i', names: NAME_EN('Generation I') };
      if (url.includes('/pokemon-form/clefairy/')) {
        return { name: 'clefairy', is_default: true, is_battle_only: false, is_mega: false, form_name: '', names: NAME_EN('Clefairy'), sprites: { front_default: 'sprite.png' } };
      }
      return undefined;
    });

    const [entry] = await promise;
    expect(entry.typePrimary.id).toBe('normal');
  });

  it('usa el tipo vigente cuando el juego activo es posterior al último cambio de tipo (019)', async () => {
    const scarletViolet = new Game('scarlet-violet', 'Scarlet/Violet', new Generation('generation-ix', 'IX'));
    const promise = service.fetchPokedexDetails(scarletViolet, new PokedexView(), ['clefairy'], 'en');

    await flushAllPending(httpMock, (url) => {
      if (url.includes('/version-group/scarlet-violet/')) return { pokedexes: [{ name: 'paldea', url: '' }] };
      if (url.includes('/pokemon-species/clefairy/')) {
        return {
          gender_rate: 4,
          has_gender_differences: false,
          generation: { name: 'generation-i', url: '' },
          names: NAME_EN('Clefairy'),
          varieties: [{ is_default: true, pokemon: { name: 'clefairy', url: '' } }],
          pokedex_numbers: [{ entry_number: 1, pokedex: { name: 'paldea', url: '' } }],
        };
      }
      if (url.includes('/pokemon/clefairy/')) {
        return {
          ...pokemonFixture('clefairy'),
          types: [{ slot: 1, type: { name: 'fairy', url: '' } }],
          past_types: [{ generation: { name: 'generation-v', url: '' }, types: [{ slot: 1, type: { name: 'normal', url: '' } }] }],
        };
      }
      if (url.includes('/generation/generation-i/')) return { name: 'generation-i', names: NAME_EN('Generation I') };
      if (url.includes('/pokemon-form/clefairy/')) {
        return { name: 'clefairy', is_default: true, is_battle_only: false, is_mega: false, form_name: '', names: NAME_EN('Clefairy'), sprites: { front_default: 'sprite.png' } };
      }
      return undefined;
    });

    const [entry] = await promise;
    expect(entry.typePrimary.id).toBe('fairy');
  });

  it('cae al sprite genérico si el juego activo no tiene un sprite versionado propio (FR-006, 018)', async () => {
    const promise = service.fetchPokedexDetails(game, new PokedexView(), ['bulbasaur'], 'en');

    await flushAllPending(httpMock, (url) => {
      if (url.includes('/version-group/red-blue/')) return { pokedexes: [{ name: 'kanto', url: '' }] };
      if (url.includes('/pokemon-species/bulbasaur/')) {
        return {
          gender_rate: 1,
          has_gender_differences: false,
          generation: { name: 'generation-i', url: '' },
          names: NAME_EN('Bulbasaur'),
          varieties: [{ is_default: true, pokemon: { name: 'bulbasaur', url: '' } }],
          pokedex_numbers: [{ entry_number: 1, pokedex: { name: 'kanto', url: '' } }],
        };
      }
      if (url.includes('/pokemon/bulbasaur/')) return pokemonFixture('bulbasaur'); // sin `versions`
      if (url.includes('/generation/generation-i/')) return { name: 'generation-i', names: NAME_EN('Generation I') };
      if (url.includes('/pokemon-form/bulbasaur/')) {
        return { name: 'bulbasaur', is_default: true, is_battle_only: false, is_mega: false, form_name: '', names: NAME_EN('Bulbasaur'), sprites: { front_default: 'sprite.png' } };
      }
      return undefined;
    });

    const [entry] = await promise;
    expect(entry.spriteUrl).toBe('sprite.png');
  });

  it('usa la variedad regional como principal cuando el juego tiene forma regional (FR-008)', async () => {
    const sunMoon = new Game('sun-moon', 'Sun/Moon', new Generation('generation-vii', 'VII'));
    const promise = service.fetchPokedexDetails(sunMoon, new PokedexView(), ['rattata'], 'en');

    await flushAllPending(httpMock, (url) => {
      if (url.includes('/version-group/sun-moon/')) return { pokedexes: [{ name: 'alola', url: '' }] };
      if (url.includes('/pokemon-species/rattata/')) {
        return {
          gender_rate: 1,
          has_gender_differences: false,
          generation: { name: 'generation-i', url: '' },
          names: NAME_EN('Rattata'),
          varieties: [
            { is_default: true, pokemon: { name: 'rattata', url: '' } },
            { is_default: false, pokemon: { name: 'rattata-alola', url: '' } },
          ],
          pokedex_numbers: [{ entry_number: 20, pokedex: { name: 'alola', url: '' } }],
        };
      }
      if (url.includes('/pokemon/rattata-alola/')) return pokemonFixture('rattata-alola', 30);
      if (url.includes('/generation/generation-i/')) return { name: 'generation-i', names: NAME_EN('Generation I') };
      if (url.includes('/pokemon-form/rattata-alola/')) {
        return { name: 'rattata-alola', is_default: true, is_battle_only: false, is_mega: false, form_name: '', names: NAME_EN('Alolan Rattata'), sprites: { front_default: null } };
      }
      // La variedad "rattata" base no principal para este juego -> se
      // resuelve igual como "otra variedad" (selectableForms), con su
      // propio form.
      if (url.includes('/pokemon/rattata/')) return pokemonFixture('rattata', 30);
      if (url.includes('/pokemon-form/rattata/')) {
        return { name: 'rattata', is_default: true, is_battle_only: false, is_mega: false, form_name: '', names: NAME_EN('Rattata'), sprites: { front_default: null } };
      }
      return undefined;
    });

    const [entry] = await promise;
    // La forma principal usada para sprites/tipos/stats es la alolana.
    expect(entry.spriteUrl).toBe('sprite.png');
    expect(entry.baseStats.hp).toBe(30);
  });

  it('usa la raza de combate de Tauros de Paldea por defecto en Escarlata/Púrpura (020, ronda 8)', async () => {
    // Verificado contra PokeAPI: no existe una variedad `tauros-paldea` —
    // hay tres, una por raza (`-combat-breed`, `-blaze-breed`,
    // `-aqua-breed`), así que la igualdad exacta contra `tauros-paldea`
    // nunca hacía match y la Pokédex regional caía al Tauros de Kanto por
    // defecto (bug reportado). La raza de combate es la que trae el
    // juego real por defecto, y es la primera en la lista de PokeAPI.
    const scarletViolet = new Game('scarlet-violet', 'Scarlet/Violet', new Generation('generation-ix', 'IX'));
    const promise = service.fetchPokedexDetails(scarletViolet, new PokedexView(), ['tauros'], 'en');

    await flushAllPending(httpMock, (url) => {
      if (url.includes('/version-group/scarlet-violet/')) return { pokedexes: [{ name: 'paldea', url: '' }] };
      if (url.includes('/pokemon-species/tauros/')) {
        return {
          gender_rate: -1,
          has_gender_differences: false,
          generation: { name: 'generation-i', url: '' },
          names: NAME_EN('Tauros'),
          varieties: [
            { is_default: true, pokemon: { name: 'tauros', url: '' } },
            { is_default: false, pokemon: { name: 'tauros-paldea-combat-breed', url: '' } },
            { is_default: false, pokemon: { name: 'tauros-paldea-blaze-breed', url: '' } },
            { is_default: false, pokemon: { name: 'tauros-paldea-aqua-breed', url: '' } },
          ],
          pokedex_numbers: [{ entry_number: 128, pokedex: { name: 'paldea', url: '' } }],
        };
      }
      if (url.includes('/pokemon/tauros-paldea-combat-breed/')) return pokemonFixture('tauros-paldea-combat-breed', 75);
      if (url.includes('/pokemon-form/tauros-paldea-combat-breed/')) {
        return {
          name: 'tauros-paldea-combat-breed',
          is_default: true,
          is_battle_only: false,
          is_mega: false,
          form_name: '',
          names: NAME_EN('Paldean Tauros (Combat Breed)'),
          sprites: { front_default: 'sprite.png' },
        };
      }
      if (url.includes('/pokemon/tauros-paldea-blaze-breed/')) return pokemonFixture('tauros-paldea-blaze-breed', 75);
      if (url.includes('/pokemon-form/tauros-paldea-blaze-breed/')) {
        return { name: 'tauros-paldea-blaze-breed', is_default: true, is_battle_only: false, is_mega: false, form_name: '', names: NAME_EN('Paldean Tauros (Blaze Breed)'), sprites: { front_default: null } };
      }
      if (url.includes('/pokemon/tauros-paldea-aqua-breed/')) return pokemonFixture('tauros-paldea-aqua-breed', 75);
      if (url.includes('/pokemon-form/tauros-paldea-aqua-breed/')) {
        return { name: 'tauros-paldea-aqua-breed', is_default: true, is_battle_only: false, is_mega: false, form_name: '', names: NAME_EN('Paldean Tauros (Aqua Breed)'), sprites: { front_default: null } };
      }
      if (url.includes('/pokemon/tauros/')) return pokemonFixture('tauros', 75);
      if (url.includes('/pokemon-form/tauros/')) {
        return { name: 'tauros', is_default: true, is_battle_only: false, is_mega: false, form_name: '', names: NAME_EN('Tauros'), sprites: { front_default: null } };
      }
      if (url.includes('/generation/generation-i/')) return { name: 'generation-i', names: NAME_EN('Generation I') };
      return undefined;
    });

    const [entry] = await promise;
    // La forma principal es la raza de combate, no el Tauros de Kanto.
    expect(entry.spriteUrl).toBe('sprite.png');
  });

  it('muestra la forma original de Slowpoke en la Pokédex regional/base de Espada/Escudo, no la de Galar (020)', async () => {
    const swordShield = new Game(
      'sword-shield',
      'Sword/Shield',
      new Generation('generation-viii', 'VIII'),
      [new GameDlc('the-isle-of-armor', 'The Isle of Armor')],
    );
    // Vista sin ningún DLC activo -> sourceTag 'regional'.
    const promise = service.fetchPokedexDetails(swordShield, new PokedexView(false, new Set()), ['slowpoke'], 'en');

    await flushAllPending(httpMock, (url) => {
      if (url.includes('/version-group/sword-shield/')) return { pokedexes: [{ name: 'galar', url: '' }] };
      if (url.includes('/pokemon-species/slowpoke/')) {
        return {
          gender_rate: 4,
          has_gender_differences: false,
          generation: { name: 'generation-i', url: '' },
          names: NAME_EN('Slowpoke'),
          varieties: [
            { is_default: true, pokemon: { name: 'slowpoke', url: '' } },
            { is_default: false, pokemon: { name: 'slowpoke-galar', url: '' } },
          ],
          pokedex_numbers: [{ entry_number: 78, pokedex: { name: 'galar', url: '' } }],
        };
      }
      if (url.includes('/pokemon/slowpoke-galar/')) return pokemonFixture('slowpoke-galar', 90);
      if (url.includes('/pokemon/slowpoke/')) return pokemonFixture('slowpoke');
      if (url.includes('/generation/generation-i/')) return { name: 'generation-i', names: NAME_EN('Generation I') };
      if (url.includes('/pokemon-form/slowpoke-galar/')) {
        return { name: 'slowpoke-galar', is_default: true, is_battle_only: false, is_mega: false, form_name: '', names: NAME_EN('Galarian Slowpoke'), sprites: { front_default: 'sprite.png' } };
      }
      if (url.includes('/pokemon-form/slowpoke/')) {
        return { name: 'slowpoke', is_default: true, is_battle_only: false, is_mega: false, form_name: '', names: NAME_EN('Slowpoke'), sprites: { front_default: 'sprite.png' } };
      }
      return undefined;
    });

    const [entry] = await promise;
    expect(entry.sourceTag).toEqual({ kind: 'regional' });
    // La forma seleccionada fue la original ('slowpoke'), no 'slowpoke-galar'.
    expect(entry.baseStats.hp).toBe(45);
    // Sin variedad regional -> la generación introducida es la de la especie, no la del juego.
    expect(entry.introducedGeneration.id).toBe('generation-i');
  });

  it('muestra la forma de Galar de Slowpoke solo en la sección del DLC "The Isle of Armor" (020)', async () => {
    const swordShield = new Game(
      'sword-shield',
      'Sword/Shield',
      new Generation('generation-viii', 'VIII'),
      [new GameDlc('the-isle-of-armor', 'The Isle of Armor')],
    );
    const view = new PokedexView(false, new Set(['the-isle-of-armor']));
    const promise = service.fetchPokedexDetails(swordShield, view, ['slowpoke'], 'en');

    await flushAllPending(httpMock, (url) => {
      if (url.includes('/version-group/sword-shield/')) return { pokedexes: [{ name: 'galar', url: '' }] };
      if (url.includes('/pokemon-species/slowpoke/')) {
        return {
          gender_rate: 4,
          has_gender_differences: false,
          generation: { name: 'generation-i', url: '' },
          names: NAME_EN('Slowpoke'),
          varieties: [
            { is_default: true, pokemon: { name: 'slowpoke', url: '' } },
            { is_default: false, pokemon: { name: 'slowpoke-galar', url: '' } },
          ],
          // No aparece en la pokedex base 'galar' -> solo se agrega vía DLC.
          pokedex_numbers: [{ entry_number: 1, pokedex: { name: 'isle-of-armor', url: '' } }],
        };
      }
      if (url.includes('/pokemon/slowpoke-galar/')) return pokemonFixture('slowpoke-galar', 90);
      if (url.includes('/pokemon/slowpoke/')) return pokemonFixture('slowpoke');
      if (url.includes('/generation/generation-i/')) return { name: 'generation-i', names: NAME_EN('Generation I') };
      if (url.includes('/pokemon-form/slowpoke-galar/')) {
        return { name: 'slowpoke-galar', is_default: true, is_battle_only: false, is_mega: false, form_name: '', names: NAME_EN('Galarian Slowpoke'), sprites: { front_default: 'sprite.png' } };
      }
      if (url.includes('/pokemon-form/slowpoke/')) {
        return { name: 'slowpoke', is_default: true, is_battle_only: false, is_mega: false, form_name: '', names: NAME_EN('Slowpoke'), sprites: { front_default: 'sprite.png' } };
      }
      return undefined;
    });

    const [entry] = await promise;
    expect(entry.sourceTag).toEqual({ kind: 'dlc', dlcId: 'the-isle-of-armor' });
    // La forma seleccionada fue la de Galar ('slowpoke-galar').
    expect(entry.baseStats.hp).toBe(90);
    // Forma regional -> la generación introducida es la del juego que la trae (VIII), no la de la especie (I).
    expect(entry.introducedGeneration.id).toBe('generation-viii');
  });

  // 020, User Story 3 (FR-006/FR-007) — filtro de formas 'template' por juego y DLC
  describe('disponibilidad de formas template por juego y DLC (020)', () => {
    function rotomSpeciesFixture() {
      return {
        gender_rate: -1,
        has_gender_differences: false,
        generation: { name: 'generation-iv', url: '' },
        names: NAME_EN('Rotom'),
        varieties: [
          { is_default: true, pokemon: { name: 'rotom', url: '' } },
          { is_default: false, pokemon: { name: 'rotom-heat', url: '' } },
        ],
        pokedex_numbers: [{ entry_number: 479, pokedex: { name: 'sinnoh', url: '' } }],
      };
    }

    function rotomFormResponders(url: string): unknown | undefined {
      if (url.includes('/pokemon-species/rotom/')) return rotomSpeciesFixture();
      // hp distinto entre ambas variedades a propósito — evita que el
      // fixture genérico las marque como cosméticas (spec `020`,
      // corrección 5).
      if (url.includes('/pokemon/rotom-heat/')) return pokemonFixture('rotom-heat', 50);
      if (url.includes('/pokemon/rotom/')) return pokemonFixture('rotom', 40);
      if (url.includes('/pokemon-form/rotom-heat/')) {
        return { name: 'rotom-heat', is_default: true, is_battle_only: false, is_mega: false, form_name: 'heat', names: NAME_EN('Heat Rotom'), sprites: { front_default: 'sprite.png' } };
      }
      if (url.includes('/pokemon-form/rotom/')) {
        return { name: 'rotom', is_default: true, is_battle_only: false, is_mega: false, form_name: '', names: NAME_EN('Rotom'), sprites: { front_default: 'sprite.png' } };
      }
      if (url.includes('/generation/generation-iv/')) return { name: 'generation-iv', names: NAME_EN('Generation IV') };
      return undefined;
    }

    it('no ofrece ninguna forma template de Rotom en Diamante/Perla (juego real sin cambio de forma en el juego base)', async () => {
      const diamondPearl = new Game('diamond-pearl', 'Diamond/Pearl', new Generation('generation-iv', 'IV'));
      const promise = service.fetchPokedexDetails(diamondPearl, new PokedexView(), ['rotom'], 'en');

      await flushAllPending(httpMock, (url) => {
        if (url.includes('/version-group/diamond-pearl/')) return { pokedexes: [{ name: 'sinnoh', url: '' }] };
        return rotomFormResponders(url);
      });

      const [entry] = await promise;
      expect(entry.selectableForms).toEqual([]);
    });

    it('ofrece las formas template de Rotom en Platino (misma generación, juego donde sí existen)', async () => {
      const platinum = new Game('platinum', 'Platinum', new Generation('generation-iv', 'IV'));
      const promise = service.fetchPokedexDetails(platinum, new PokedexView(), ['rotom'], 'en');

      await flushAllPending(httpMock, (url) => {
        if (url.includes('/version-group/platinum/')) return { pokedexes: [{ name: 'sinnoh', url: '' }] };
        return rotomFormResponders(url);
      });

      const [entry] = await promise;
      expect(entry.selectableForms.length).toBe(1);
      expect(entry.selectableForms[0].varietyId).toBe('rotom-heat');
      expect(entry.selectableForms[0].requiresDlcId).toBeNull();
    });

    it('marca la variedad de Kanto de Tauros con requiresDlcId "the-indigo-disk"', async () => {
      const scarletViolet = new Game('scarlet-violet', 'Scarlet/Violet', new Generation('generation-ix', 'IX'));
      const promise = service.fetchPokedexDetails(scarletViolet, new PokedexView(), ['tauros'], 'en');

      await flushAllPending(httpMock, (url) => {
        if (url.includes('/version-group/scarlet-violet/')) return { pokedexes: [{ name: 'paldea', url: '' }] };
        if (url.includes('/pokemon-species/tauros/')) {
          return {
            gender_rate: -1,
            has_gender_differences: false,
            generation: { name: 'generation-i', url: '' },
            names: NAME_EN('Tauros'),
            varieties: [
              { is_default: true, pokemon: { name: 'tauros-paldea-combat-breed', url: '' } },
              { is_default: false, pokemon: { name: 'tauros', url: '' } },
            ],
            pokedex_numbers: [{ entry_number: 128, pokedex: { name: 'paldea', url: '' } }],
          };
        }
        // hp distinto entre ambas variedades a propósito — evita que el
        // fixture genérico las marque como cosméticas (spec `020`,
        // corrección 5).
        if (url.includes('/pokemon/tauros-paldea-combat-breed/')) return pokemonFixture('tauros-paldea-combat-breed', 75);
        if (url.includes('/pokemon-form/tauros-paldea-combat-breed/')) {
          return { name: 'tauros-paldea-combat-breed', is_default: true, is_battle_only: false, is_mega: false, form_name: '', names: NAME_EN('Paldean Tauros (Combat Breed)'), sprites: { front_default: 'sprite.png' } };
        }
        if (url.includes('/pokemon/tauros/')) return pokemonFixture('tauros', 68);
        if (url.includes('/pokemon-form/tauros/')) {
          return { name: 'tauros', is_default: true, is_battle_only: false, is_mega: false, form_name: '', names: NAME_EN('Tauros'), sprites: { front_default: 'sprite.png' } };
        }
        if (url.includes('/generation/generation-i/')) return { name: 'generation-i', names: NAME_EN('Generation I') };
        return undefined;
      });

      const [entry] = await promise;
      expect(entry.selectableForms.length).toBe(1);
      expect(entry.selectableForms[0].varietyId).toBe('tauros');
      expect(entry.selectableForms[0].requiresDlcId).toBe('the-indigo-disk');
    });

    // Bug reportado (020): Darmanitan de Galar aparecía seleccionable en
    // Negro 2/Blanco 2, un juego donde esa forma regional no existe.
    function darmanitanSpeciesFixture() {
      return {
        gender_rate: 4,
        has_gender_differences: false,
        generation: { name: 'generation-v', url: '' },
        names: NAME_EN('Darmanitan'),
        varieties: [
          { is_default: true, pokemon: { name: 'darmanitan-standard', url: '' } },
          { is_default: false, pokemon: { name: 'darmanitan-galar-standard', url: '' } },
        ],
        pokedex_numbers: [{ entry_number: 555, pokedex: { name: 'unova', url: '' } }],
      };
    }

    function darmanitanFormResponders(url: string): unknown | undefined {
      if (url.includes('/pokemon-species/darmanitan/')) return darmanitanSpeciesFixture();
      // hp distinto entre ambas variedades a propósito — evita que el
      // fixture genérico (mismo tipo por defecto) las marque como
      // cosméticas (spec `020`, corrección 5: mismo tipo+stats que la
      // principal = sin diferencia jugable).
      if (url.includes('/pokemon/darmanitan-galar-standard/')) return pokemonFixture('darmanitan-galar-standard', 115);
      if (url.includes('/pokemon/darmanitan-standard/')) return pokemonFixture('darmanitan-standard', 105);
      if (url.includes('/pokemon-form/darmanitan-galar-standard/')) {
        return { name: 'darmanitan-galar-standard', is_default: true, is_battle_only: false, is_mega: false, form_name: 'galar-standard', names: NAME_EN('Darmanitan (Galarian Standard Mode)'), sprites: { front_default: 'sprite.png' } };
      }
      if (url.includes('/pokemon-form/darmanitan-standard/')) {
        return { name: 'darmanitan-standard', is_default: true, is_battle_only: false, is_mega: false, form_name: 'standard', names: NAME_EN('Darmanitan (Standard Mode)'), sprites: { front_default: 'sprite.png' } };
      }
      if (url.includes('/generation/generation-v/')) return { name: 'generation-v', names: NAME_EN('Generation V') };
      return undefined;
    }

    it('NO ofrece la forma de Galar de Darmanitan en Negro 2/Blanco 2 (esa región no existe en ese juego)', async () => {
      const blackWhite2 = new Game('black-2-white-2', 'Black 2/White 2', new Generation('generation-v', 'V'));
      const promise = service.fetchPokedexDetails(blackWhite2, new PokedexView(), ['darmanitan'], 'en');

      await flushAllPending(httpMock, (url) => {
        if (url.includes('/version-group/black-2-white-2/')) return { pokedexes: [{ name: 'unova', url: '' }] };
        return darmanitanFormResponders(url);
      });

      const [entry] = await promise;
      expect(entry.selectableForms).toEqual([]);
    });

    it('sí ofrece la forma de Galar de Darmanitan como alternativa dentro de Espada/Escudo', async () => {
      // En Espada/Escudo la variedad regional pasa a ser la PRINCIPAL
      // (mecanismo ya existente); la Darmanitan original queda como
      // forma alternativa — análogo al caso ya cubierto de Tauros.
      const swordShield = new Game('sword-shield', 'Sword/Shield', new Generation('generation-viii', 'VIII'));
      const promise = service.fetchPokedexDetails(swordShield, new PokedexView(), ['darmanitan'], 'en');

      await flushAllPending(httpMock, (url) => {
        if (url.includes('/version-group/sword-shield/')) return { pokedexes: [{ name: 'galar', url: '' }] };
        return darmanitanFormResponders(url);
      });

      const [entry] = await promise;
      // La variedad principal pasó a ser la de Galar (mismo sprite fixture).
      expect(entry.baseStats.hp).toBe(115);
      expect(entry.selectableForms.length).toBe(1);
      expect(entry.selectableForms[0].varietyId).toBe('darmanitan-standard');
    });

    it('NO ofrece la forma alolana de Rattata en Rojo/Azul (esa región no existe en ese juego)', async () => {
      const redBlue = game; // 'red-blue', ya declarado en el describe externo
      const promise = service.fetchPokedexDetails(redBlue, new PokedexView(), ['rattata'], 'en');

      await flushAllPending(httpMock, (url) => {
        if (url.includes('/version-group/red-blue/')) return { pokedexes: [{ name: 'kanto', url: '' }] };
        if (url.includes('/pokemon-species/rattata/')) {
          return {
            gender_rate: 4,
            has_gender_differences: false,
            generation: { name: 'generation-i', url: '' },
            names: NAME_EN('Rattata'),
            varieties: [
              { is_default: true, pokemon: { name: 'rattata', url: '' } },
              { is_default: false, pokemon: { name: 'rattata-alola', url: '' } },
            ],
            pokedex_numbers: [{ entry_number: 19, pokedex: { name: 'kanto', url: '' } }],
          };
        }
        if (url.includes('/pokemon/rattata-alola/')) return pokemonFixture('rattata-alola', 30);
        if (url.includes('/pokemon/rattata/')) return pokemonFixture('rattata');
        if (url.includes('/pokemon-form/rattata-alola/')) {
          return { name: 'rattata-alola', is_default: true, is_battle_only: false, is_mega: false, form_name: 'alola', names: NAME_EN('Alolan Rattata'), sprites: { front_default: 'sprite.png' } };
        }
        if (url.includes('/pokemon-form/rattata/')) {
          return { name: 'rattata', is_default: true, is_battle_only: false, is_mega: false, form_name: '', names: NAME_EN('Rattata'), sprites: { front_default: 'sprite.png' } };
        }
        if (url.includes('/generation/generation-i/')) return { name: 'generation-i', names: NAME_EN('Generation I') };
        return undefined;
      });

      const [entry] = await promise;
      expect(entry.selectableForms).toEqual([]);
    });

    // Bug reportado (020, corrección 2): Raticate seguía ofreciendo su
    // forma alolana en juegos donde esa región no existe — la causa era
    // una tercera variedad, `raticate-totem-alola` (forma Totem del
    // encuentro especial de Sol/Luna), verificada en vivo contra
    // PokeAPI: no sigue el patrón `{especie}-{región}` porque `totem` se
    // intercala antes del sufijo, así que se le escapaba al filtro
    // original (que solo reconocía `raticate-alola`, no
    // `raticate-totem-alola`).
    it('NO ofrece ninguna forma alolana de Raticate (ni la común ni la Totem) en Rojo/Azul', async () => {
      const redBlue = game;
      const promise = service.fetchPokedexDetails(redBlue, new PokedexView(), ['raticate'], 'en');

      await flushAllPending(httpMock, (url) => {
        if (url.includes('/version-group/red-blue/')) return { pokedexes: [{ name: 'kanto', url: '' }] };
        if (url.includes('/pokemon-species/raticate/')) {
          return {
            gender_rate: 4,
            has_gender_differences: true,
            generation: { name: 'generation-i', url: '' },
            names: NAME_EN('Raticate'),
            varieties: [
              { is_default: true, pokemon: { name: 'raticate', url: '' } },
              { is_default: false, pokemon: { name: 'raticate-alola', url: '' } },
              { is_default: false, pokemon: { name: 'raticate-totem-alola', url: '' } },
            ],
            pokedex_numbers: [{ entry_number: 20, pokedex: { name: 'kanto', url: '' } }],
          };
        }
        if (url.includes('/pokemon/raticate-totem-alola/')) return pokemonFixture('raticate-totem-alola', 105);
        if (url.includes('/pokemon/raticate-alola/')) return pokemonFixture('raticate-alola', 75);
        if (url.includes('/pokemon/raticate/')) return pokemonFixture('raticate');
        if (url.includes('/pokemon-form/raticate-totem-alola/')) {
          return { name: 'raticate-totem-alola', is_default: true, is_battle_only: false, is_mega: false, form_name: 'totem-alola', names: NAME_EN('Raticate (Totem Alola Form)'), sprites: { front_default: 'sprite.png' } };
        }
        if (url.includes('/pokemon-form/raticate-alola/')) {
          return { name: 'raticate-alola', is_default: true, is_battle_only: false, is_mega: false, form_name: 'alola', names: NAME_EN('Alolan Raticate'), sprites: { front_default: 'sprite.png' } };
        }
        if (url.includes('/pokemon-form/raticate/')) {
          return { name: 'raticate', is_default: true, is_battle_only: false, is_mega: false, form_name: '', names: NAME_EN('Raticate'), sprites: { front_default: 'sprite.png' } };
        }
        if (url.includes('/generation/generation-i/')) return { name: 'generation-i', names: NAME_EN('Generation I') };
        return undefined;
      });

      const [entry] = await promise;
      expect(entry.selectableForms).toEqual([]);
    });

    it('sí ofrece la forma común y la Totem de Raticate de Alola dentro de Sol/Luna', async () => {
      const sunMoon = new Game('sun-moon', 'Sun/Moon', new Generation('generation-vii', 'VII'));
      const promise = service.fetchPokedexDetails(sunMoon, new PokedexView(), ['raticate'], 'en');

      await flushAllPending(httpMock, (url) => {
        if (url.includes('/version-group/sun-moon/')) return { pokedexes: [{ name: 'alola', url: '' }] };
        if (url.includes('/pokemon-species/raticate/')) {
          return {
            gender_rate: 4,
            has_gender_differences: true,
            generation: { name: 'generation-i', url: '' },
            names: NAME_EN('Raticate'),
            varieties: [
              { is_default: true, pokemon: { name: 'raticate', url: '' } },
              { is_default: false, pokemon: { name: 'raticate-alola', url: '' } },
              { is_default: false, pokemon: { name: 'raticate-totem-alola', url: '' } },
            ],
            pokedex_numbers: [{ entry_number: 20, pokedex: { name: 'alola', url: '' } }],
          };
        }
        if (url.includes('/pokemon/raticate-totem-alola/')) return pokemonFixture('raticate-totem-alola', 105);
        if (url.includes('/pokemon/raticate-alola/')) return pokemonFixture('raticate-alola', 75);
        if (url.includes('/pokemon/raticate/')) return pokemonFixture('raticate');
        if (url.includes('/pokemon-form/raticate-totem-alola/')) {
          return { name: 'raticate-totem-alola', is_default: true, is_battle_only: false, is_mega: false, form_name: 'totem-alola', names: NAME_EN('Raticate (Totem Alola Form)'), sprites: { front_default: 'sprite.png' } };
        }
        if (url.includes('/pokemon-form/raticate-alola/')) {
          return { name: 'raticate-alola', is_default: true, is_battle_only: false, is_mega: false, form_name: 'alola', names: NAME_EN('Alolan Raticate'), sprites: { front_default: 'sprite.png' } };
        }
        if (url.includes('/pokemon-form/raticate/')) {
          return { name: 'raticate', is_default: true, is_battle_only: false, is_mega: false, form_name: '', names: NAME_EN('Raticate'), sprites: { front_default: 'sprite.png' } };
        }
        if (url.includes('/generation/generation-i/')) return { name: 'generation-i', names: NAME_EN('Generation I') };
        return undefined;
      });

      const [entry] = await promise;
      // La variedad principal en Sol/Luna es la alolana común (no la Totem).
      expect(entry.baseStats.hp).toBe(75);
      expect(entry.selectableForms.length).toBe(2);
      expect(entry.selectableForms.map((f) => f.varietyId).sort()).toEqual(['raticate', 'raticate-totem-alola']);
    });

    // Bug reportado (020, corrección 3): Zygarde ofrecía su Forma
    // Completa como forma seleccionable — esa forma es `is_battle_only`
    // en PokeAPI (solo se alcanza transformándose en batalla al activar
    // Poder Conjunto, nunca una elección manual fuera de ella).
    it('NO ofrece la Forma Completa de Zygarde (is_battle_only) como forma seleccionable', async () => {
      const sunMoon = new Game('sun-moon', 'Sun/Moon', new Generation('generation-vii', 'VII'));
      const promise = service.fetchPokedexDetails(sunMoon, new PokedexView(), ['zygarde'], 'en');

      await flushAllPending(httpMock, (url) => {
        if (url.includes('/version-group/sun-moon/')) return { pokedexes: [{ name: 'alola', url: '' }] };
        if (url.includes('/pokemon-species/zygarde/')) {
          return {
            gender_rate: -1,
            has_gender_differences: false,
            generation: { name: 'generation-vi', url: '' },
            names: NAME_EN('Zygarde'),
            varieties: [
              { is_default: true, pokemon: { name: 'zygarde-50', url: '' } },
              { is_default: false, pokemon: { name: 'zygarde-10', url: '' } },
              { is_default: false, pokemon: { name: 'zygarde-complete', url: '' } },
            ],
            pokedex_numbers: [{ entry_number: 87, pokedex: { name: 'alola', url: '' } }],
          };
        }
        if (url.includes('/pokemon/zygarde-10/')) return pokemonFixture('zygarde-10', 54);
        if (url.includes('/pokemon/zygarde-complete/')) return pokemonFixture('zygarde-complete', 216);
        if (url.includes('/pokemon/zygarde-50/')) return pokemonFixture('zygarde-50', 108);
        if (url.includes('/pokemon-form/zygarde-10/')) {
          return { name: 'zygarde-10', is_default: true, is_battle_only: false, is_mega: false, form_name: '10', names: NAME_EN('Zygarde (10% Forme)'), sprites: { front_default: 'sprite.png' } };
        }
        if (url.includes('/pokemon-form/zygarde-complete/')) {
          return { name: 'zygarde-complete', is_default: true, is_battle_only: true, is_mega: false, form_name: 'complete', names: NAME_EN('Zygarde (Complete Forme)'), sprites: { front_default: 'sprite.png' } };
        }
        if (url.includes('/pokemon-form/zygarde-50/')) {
          return { name: 'zygarde-50', is_default: true, is_battle_only: false, is_mega: false, form_name: '50', names: NAME_EN('Zygarde (50% Forme)'), sprites: { front_default: 'sprite.png' } };
        }
        if (url.includes('/generation/generation-vi/')) return { name: 'generation-vi', names: NAME_EN('Generation VI') };
        return undefined;
      });

      const [entry] = await promise;
      expect(entry.selectableForms.map((f) => f.varietyId)).toEqual(['zygarde-10']);
    });

    // Corrección 6 (spec `020`): una forma 'template' sin sprite HOME
    // pero CON sprite de juego (`gameSpriteUrl`) ya no se excluye por
    // eso solo — cae al sprite de juego como sprite HOME (bug reportado:
    // esto excluía por error formas con diferencia jugable real, ver más
    // abajo el caso de los iniciales de Let's Go). Solo se excluye si no
    // tiene NINGÚN sprite en absoluto.
    it('NO ofrece una forma template sin ningún sprite (ni de juego ni HOME)', async () => {
      const promise = service.fetchPokedexDetails(game, new PokedexView(), ['pikachu'], 'en');

      await flushAllPending(httpMock, (url) => {
        if (url.includes('/version-group/red-blue/')) return { pokedexes: [{ name: 'kanto', url: '' }] };
        if (url.includes('/pokemon-species/pikachu/')) {
          return {
            gender_rate: 4,
            has_gender_differences: true,
            generation: { name: 'generation-i', url: '' },
            names: NAME_EN('Pikachu'),
            varieties: [
              { is_default: true, pokemon: { name: 'pikachu', url: '' } },
              { is_default: false, pokemon: { name: 'pikachu-no-sprite', url: '' } },
              { is_default: false, pokemon: { name: 'pikachu-original-cap', url: '' } },
            ],
            pokedex_numbers: [{ entry_number: 25, pokedex: { name: 'kanto', url: '' } }],
          };
        }
        if (url.includes('/pokemon/pikachu-no-sprite/')) {
          return {
            name: 'pikachu-no-sprite',
            types: [{ slot: 1, type: { name: 'electric', url: '' } }],
            stats: pokemonFixture('pikachu-no-sprite', 99).stats,
            sprites: { front_default: null, other: { home: { front_default: null, front_shiny: null, front_female: null, front_shiny_female: null } } },
            forms: [{ name: 'pikachu-no-sprite', url: `${BASE}pokemon-form/pikachu-no-sprite/` }],
          };
        }
        // hp distinto entre ambas variedades a propósito — evita que el
        // fixture genérico las marque como cosméticas (spec `020`,
        // corrección 5) para este test puntual sobre sprites faltantes.
        if (url.includes('/pokemon/pikachu-original-cap/')) return pokemonFixture('pikachu-original-cap', 50);
        if (url.includes('/pokemon/pikachu/')) return pokemonFixture('pikachu');
        if (url.includes('/pokemon-form/pikachu-no-sprite/')) {
          return { name: 'pikachu-no-sprite', is_default: true, is_battle_only: false, is_mega: false, form_name: 'no-sprite', names: NAME_EN('Pikachu (No Sprite)'), sprites: { front_default: null } };
        }
        if (url.includes('/pokemon-form/pikachu-original-cap/')) {
          return { name: 'pikachu-original-cap', is_default: true, is_battle_only: false, is_mega: false, form_name: 'original-cap', names: NAME_EN('Pikachu (Original Cap)'), sprites: { front_default: 'sprite.png' } };
        }
        if (url.includes('/pokemon-form/pikachu/')) {
          return { name: 'pikachu', is_default: true, is_battle_only: false, is_mega: false, form_name: '', names: NAME_EN('Pikachu'), sprites: { front_default: 'sprite.png' } };
        }
        if (url.includes('/generation/generation-i/')) return { name: 'generation-i', names: NAME_EN('Generation I') };
        return undefined;
      });

      const [entry] = await promise;
      expect(entry.selectableForms.map((f) => f.varietyId)).toEqual(['pikachu-original-cap']);
    });

    // Bug reportado (020, corrección 6): el Pikachu/Eevee inicial de
    // Let's Go (`pikachu-starter`/`eevee-starter`) tiene estadísticas y
    // movimientos distintos de verdad — verificado en vivo contra
    // PokeAPI: `pikachu-starter` tiene 45/80/50/75/60/120 vs. las
    // 35/55/40/50/50/90 del Pikachu normal — pero no tiene sprite HOME
    // propio, así que la corrección 4 (sin sprite HOME → excluida) lo
    // ocultaba por error junto con los disfraces puramente cosméticos.
    it('SÍ ofrece el Pikachu inicial de Let\'s Go (stats distintas, sin sprite HOME propio)', async () => {
      const letsGoPikachu = new Game('lets-go-pikachu-lets-go-eevee', "Let's Go Pikachu", new Generation('generation-vii', 'VII'));
      const promise = service.fetchPokedexDetails(letsGoPikachu, new PokedexView(), ['pikachu'], 'en');

      await flushAllPending(httpMock, (url) => {
        if (url.includes('/version-group/lets-go-pikachu-lets-go-eevee/')) return { pokedexes: [{ name: 'kanto', url: '' }] };
        if (url.includes('/pokemon-species/pikachu/')) {
          return {
            gender_rate: 4,
            has_gender_differences: true,
            generation: { name: 'generation-i', url: '' },
            names: NAME_EN('Pikachu'),
            varieties: [
              { is_default: true, pokemon: { name: 'pikachu', url: '' } },
              { is_default: false, pokemon: { name: 'pikachu-starter', url: '' } },
            ],
            pokedex_numbers: [{ entry_number: 25, pokedex: { name: 'kanto', url: '' } }],
          };
        }
        if (url.includes('/pokemon/pikachu-starter/')) {
          return {
            name: 'pikachu-starter',
            types: [{ slot: 1, type: { name: 'electric', url: '' } }],
            stats: [
              { base_stat: 45, stat: { name: 'hp', url: '' } },
              { base_stat: 80, stat: { name: 'attack', url: '' } },
              { base_stat: 50, stat: { name: 'defense', url: '' } },
              { base_stat: 75, stat: { name: 'special-attack', url: '' } },
              { base_stat: 60, stat: { name: 'special-defense', url: '' } },
              { base_stat: 120, stat: { name: 'speed', url: '' } },
            ],
            sprites: { front_default: 'starter-game.png', other: { home: { front_default: null, front_shiny: null, front_female: null, front_shiny_female: null } } },
            forms: [{ name: 'pikachu-starter', url: `${BASE}pokemon-form/pikachu-starter/` }],
          };
        }
        if (url.includes('/pokemon/pikachu/')) {
          return {
            name: 'pikachu',
            types: [{ slot: 1, type: { name: 'electric', url: '' } }],
            stats: [
              { base_stat: 35, stat: { name: 'hp', url: '' } },
              { base_stat: 55, stat: { name: 'attack', url: '' } },
              { base_stat: 40, stat: { name: 'defense', url: '' } },
              { base_stat: 50, stat: { name: 'special-attack', url: '' } },
              { base_stat: 50, stat: { name: 'special-defense', url: '' } },
              { base_stat: 90, stat: { name: 'speed', url: '' } },
            ],
            sprites: { front_default: 'sprite.png', other: { home: { front_default: 'home.png', front_shiny: null, front_female: null, front_shiny_female: null } } },
            forms: [{ name: 'pikachu', url: `${BASE}pokemon-form/pikachu/` }],
          };
        }
        if (url.includes('/pokemon-form/pikachu-starter/')) {
          return { name: 'pikachu-starter', is_default: true, is_battle_only: false, is_mega: false, form_name: 'starter', names: NAME_EN('Pikachu (Partner Pikachu)'), sprites: { front_default: 'starter-game.png' } };
        }
        if (url.includes('/pokemon-form/pikachu/')) {
          return { name: 'pikachu', is_default: true, is_battle_only: false, is_mega: false, form_name: '', names: NAME_EN('Pikachu'), sprites: { front_default: 'sprite.png' } };
        }
        if (url.includes('/generation/generation-i/')) return { name: 'generation-i', names: NAME_EN('Generation I') };
        return undefined;
      });

      const [entry] = await promise;
      expect(entry.selectableForms.length).toBe(1);
      const starter = entry.selectableForms[0];
      expect(starter.varietyId).toBe('pikachu-starter');
      expect(starter.baseStats.attack).toBe(80);
      // Sin sprite HOME propio, cae al sprite de juego en vez de quedar null.
      expect(starter.gameSpriteUrl).toBe('starter-game.png');
      expect(starter.homeSpriteUrl).toBe('starter-game.png');
    });

    // Bug reportado (020, corrección 9): el Pikachu inicial de Let's Go
    // aparecía como forma seleccionable en CUALQUIER juego con Pikachu
    // (no solo en Let's Go) — verificado en vivo contra PokeAPI:
    // `pokemon-form.version_group` de `pikachu-starter` es exactamente
    // `lets-go-pikachu-lets-go-eevee`, el único juego real donde existe.
    it('NO ofrece el Pikachu inicial de Let\'s Go en otro juego (Rojo/Azul)', async () => {
      const promise = service.fetchPokedexDetails(game, new PokedexView(), ['pikachu'], 'en');

      await flushAllPending(httpMock, (url) => {
        if (url.includes('/version-group/red-blue/')) return { pokedexes: [{ name: 'kanto', url: '' }] };
        if (url.includes('/pokemon-species/pikachu/')) {
          return {
            gender_rate: 4,
            has_gender_differences: true,
            generation: { name: 'generation-i', url: '' },
            names: NAME_EN('Pikachu'),
            varieties: [
              { is_default: true, pokemon: { name: 'pikachu', url: '' } },
              { is_default: false, pokemon: { name: 'pikachu-starter', url: '' } },
            ],
            pokedex_numbers: [{ entry_number: 25, pokedex: { name: 'kanto', url: '' } }],
          };
        }
        if (url.includes('/pokemon/pikachu-starter/')) {
          return {
            name: 'pikachu-starter',
            types: [{ slot: 1, type: { name: 'electric', url: '' } }],
            stats: [
              { base_stat: 45, stat: { name: 'hp', url: '' } },
              { base_stat: 80, stat: { name: 'attack', url: '' } },
              { base_stat: 50, stat: { name: 'defense', url: '' } },
              { base_stat: 75, stat: { name: 'special-attack', url: '' } },
              { base_stat: 60, stat: { name: 'special-defense', url: '' } },
              { base_stat: 120, stat: { name: 'speed', url: '' } },
            ],
            sprites: { front_default: 'starter-game.png', other: { home: { front_default: null, front_shiny: null, front_female: null, front_shiny_female: null } } },
            forms: [{ name: 'pikachu-starter', url: `${BASE}pokemon-form/pikachu-starter/` }],
          };
        }
        if (url.includes('/pokemon/pikachu/')) return pokemonFixture('pikachu');
        if (url.includes('/pokemon-form/pikachu-starter/')) {
          return { name: 'pikachu-starter', is_default: true, is_battle_only: false, is_mega: false, form_name: 'starter', names: NAME_EN('Pikachu (Partner Pikachu)'), sprites: { front_default: 'starter-game.png' } };
        }
        if (url.includes('/pokemon-form/pikachu/')) {
          return { name: 'pikachu', is_default: true, is_battle_only: false, is_mega: false, form_name: '', names: NAME_EN('Pikachu'), sprites: { front_default: 'sprite.png' } };
        }
        if (url.includes('/generation/generation-i/')) return { name: 'generation-i', names: NAME_EN('Generation I') };
        return undefined;
      });

      const [entry] = await promise;
      expect(entry.selectableForms).toEqual([]);
    });

    // Bug reportado (020, corrección 11): Let's Go Pikachu/Eevee (Kanto,
    // Generación VII) no ofrecía las formas de Alola de especies como
    // Raichu/Golem/Marowak, aunque sí existen en ese juego real — el
    // filtro de variedad regional (corrección 1) las trataba como si
    // fueran de un juego totalmente ajeno a Alola, igual que Rojo/Azul.
    it('SÍ ofrece la forma de Alola de Raichu como alternativa dentro de Let\'s Go (la de Kanto sigue siendo la principal)', async () => {
      const letsGoPikachu = new Game('lets-go-pikachu-lets-go-eevee', "Let's Go Pikachu", new Generation('generation-vii', 'VII'));
      const promise = service.fetchPokedexDetails(letsGoPikachu, new PokedexView(), ['raichu'], 'en');

      await flushAllPending(httpMock, (url) => {
        if (url.includes('/version-group/lets-go-pikachu-lets-go-eevee/')) return { pokedexes: [{ name: 'letsgo-kanto', url: '' }] };
        if (url.includes('/pokemon-species/raichu/')) {
          return {
            gender_rate: 4,
            has_gender_differences: false,
            generation: { name: 'generation-i', url: '' },
            names: NAME_EN('Raichu'),
            varieties: [
              { is_default: true, pokemon: { name: 'raichu', url: '' } },
              { is_default: false, pokemon: { name: 'raichu-alola', url: '' } },
            ],
            pokedex_numbers: [{ entry_number: 26, pokedex: { name: 'letsgo-kanto', url: '' } }],
          };
        }
        if (url.includes('/pokemon/raichu-alola/')) {
          return {
            name: 'raichu-alola',
            types: [
              { slot: 1, type: { name: 'electric', url: '' } },
              { slot: 2, type: { name: 'psychic', url: '' } },
            ],
            stats: pokemonFixture('raichu-alola', 60).stats,
            sprites: { front_default: 'raichu-alola-game.png', other: { home: { front_default: 'raichu-alola-home.png', front_shiny: null, front_female: null, front_shiny_female: null } } },
            forms: [{ name: 'raichu-alola', url: `${BASE}pokemon-form/raichu-alola/` }],
          };
        }
        if (url.includes('/pokemon/raichu/')) return pokemonFixture('raichu', 60);
        if (url.includes('/pokemon-form/raichu-alola/')) {
          return { name: 'raichu-alola', is_default: true, is_battle_only: false, is_mega: false, form_name: 'alola', names: NAME_EN('Alolan Raichu'), sprites: { front_default: 'raichu-alola-game.png' } };
        }
        if (url.includes('/pokemon-form/raichu/')) {
          return { name: 'raichu', is_default: true, is_battle_only: false, is_mega: false, form_name: '', names: NAME_EN('Raichu'), sprites: { front_default: 'sprite.png' } };
        }
        if (url.includes('/generation/generation-i/')) return { name: 'generation-i', names: NAME_EN('Generation I') };
        return undefined;
      });

      const [entry] = await promise;
      // La variedad principal sigue siendo la de Kanto (no se fuerza a Alola).
      expect(entry.spriteUrl).toBe('sprite.png');
      expect(entry.selectableForms.length).toBe(1);
      expect(entry.selectableForms[0].varietyId).toBe('raichu-alola');
    });

    it('NO ofrece la forma de Alola de Raichu en Rojo/Azul', async () => {
      const promise = service.fetchPokedexDetails(game, new PokedexView(), ['raichu'], 'en');

      await flushAllPending(httpMock, (url) => {
        if (url.includes('/version-group/red-blue/')) return { pokedexes: [{ name: 'kanto', url: '' }] };
        if (url.includes('/pokemon-species/raichu/')) {
          return {
            gender_rate: 4,
            has_gender_differences: false,
            generation: { name: 'generation-i', url: '' },
            names: NAME_EN('Raichu'),
            varieties: [
              { is_default: true, pokemon: { name: 'raichu', url: '' } },
              { is_default: false, pokemon: { name: 'raichu-alola', url: '' } },
            ],
            pokedex_numbers: [{ entry_number: 26, pokedex: { name: 'kanto', url: '' } }],
          };
        }
        if (url.includes('/pokemon/raichu-alola/')) {
          return {
            name: 'raichu-alola',
            types: [
              { slot: 1, type: { name: 'electric', url: '' } },
              { slot: 2, type: { name: 'psychic', url: '' } },
            ],
            stats: pokemonFixture('raichu-alola', 60).stats,
            sprites: { front_default: 'raichu-alola-game.png', other: { home: { front_default: 'raichu-alola-home.png', front_shiny: null, front_female: null, front_shiny_female: null } } },
            forms: [{ name: 'raichu-alola', url: `${BASE}pokemon-form/raichu-alola/` }],
          };
        }
        if (url.includes('/pokemon/raichu/')) return pokemonFixture('raichu', 60);
        if (url.includes('/pokemon-form/raichu-alola/')) {
          return { name: 'raichu-alola', is_default: true, is_battle_only: false, is_mega: false, form_name: 'alola', names: NAME_EN('Alolan Raichu'), sprites: { front_default: 'raichu-alola-game.png' } };
        }
        if (url.includes('/pokemon-form/raichu/')) {
          return { name: 'raichu', is_default: true, is_battle_only: false, is_mega: false, form_name: '', names: NAME_EN('Raichu'), sprites: { front_default: 'sprite.png' } };
        }
        if (url.includes('/generation/generation-i/')) return { name: 'generation-i', names: NAME_EN('Generation I') };
        return undefined;
      });

      const [entry] = await promise;
      expect(entry.selectableForms).toEqual([]);
    });

    // Bug reportado (020, corrección 5): las gorras de Pikachu (Original/
    // Hoenn/Sinnoh/Unova/Kalos/Alola/Partner/World Cap) se ofrecían como
    // formas seleccionables en todos los juegos, sin filtrar por su
    // distribución real — verificado en vivo contra PokeAPI: tienen
    // exactamente el mismo tipo (Eléctrico) y las mismas 6 estadísticas
    // base que el Pikachu normal (35/55/40/50/50/90), es decir, son
    // puramente cosméticas (un disfraz, no una forma jugable distinta).
    function pikachuElectricStats() {
      return {
        types: [{ slot: 1, type: { name: 'electric', url: '' } }],
        stats: [
          { base_stat: 35, stat: { name: 'hp', url: '' } },
          { base_stat: 55, stat: { name: 'attack', url: '' } },
          { base_stat: 40, stat: { name: 'defense', url: '' } },
          { base_stat: 50, stat: { name: 'special-attack', url: '' } },
          { base_stat: 50, stat: { name: 'special-defense', url: '' } },
          { base_stat: 90, stat: { name: 'speed', url: '' } },
        ],
      };
    }

    it('NO ofrece una gorra de Pikachu (mismo tipo y stats que la forma base — puramente cosmética)', async () => {
      const promise = service.fetchPokedexDetails(game, new PokedexView(), ['pikachu'], 'en');

      await flushAllPending(httpMock, (url) => {
        if (url.includes('/version-group/red-blue/')) return { pokedexes: [{ name: 'kanto', url: '' }] };
        if (url.includes('/pokemon-species/pikachu/')) {
          return {
            gender_rate: 4,
            has_gender_differences: true,
            generation: { name: 'generation-i', url: '' },
            names: NAME_EN('Pikachu'),
            varieties: [
              { is_default: true, pokemon: { name: 'pikachu', url: '' } },
              { is_default: false, pokemon: { name: 'pikachu-original-cap', url: '' } },
            ],
            pokedex_numbers: [{ entry_number: 25, pokedex: { name: 'kanto', url: '' } }],
          };
        }
        if (url.includes('/pokemon/pikachu-original-cap/')) {
          return {
            name: 'pikachu-original-cap',
            ...pikachuElectricStats(),
            sprites: { front_default: 'sprite.png', other: { home: { front_default: 'home-cap.png', front_shiny: null, front_female: null, front_shiny_female: null } } },
            forms: [{ name: 'pikachu-original-cap', url: `${BASE}pokemon-form/pikachu-original-cap/` }],
          };
        }
        if (url.includes('/pokemon/pikachu/')) {
          return {
            name: 'pikachu',
            ...pikachuElectricStats(),
            sprites: { front_default: 'sprite.png', other: { home: { front_default: 'home.png', front_shiny: null, front_female: null, front_shiny_female: null } } },
            forms: [{ name: 'pikachu', url: `${BASE}pokemon-form/pikachu/` }],
          };
        }
        if (url.includes('/pokemon-form/pikachu-original-cap/')) {
          return { name: 'pikachu-original-cap', is_default: true, is_battle_only: false, is_mega: false, form_name: 'original-cap', names: NAME_EN('Pikachu (Original Cap)'), sprites: { front_default: 'sprite.png' } };
        }
        if (url.includes('/pokemon-form/pikachu/')) {
          return { name: 'pikachu', is_default: true, is_battle_only: false, is_mega: false, form_name: '', names: NAME_EN('Pikachu'), sprites: { front_default: 'sprite.png' } };
        }
        if (url.includes('/generation/generation-i/')) return { name: 'generation-i', names: NAME_EN('Generation I') };
        return undefined;
      });

      const [entry] = await promise;
      expect(entry.selectableForms).toEqual([]);
    });

    // Bug reportado (020, corrección post-release): Toxtricity en
    // Espada/Escudo no mostraba el selector de forma. Verificado en vivo
    // contra PokeAPI: la Forma Bajo Voltaje (`toxtricity-low-key`) tiene
    // exactamente el mismo tipo (Eléctrico/Veneno) y las mismas 6
    // estadísticas base que la Forma Amperio, pero SÍ es una elección real
    // (determinada por la naturaleza), con habilidad y movimiento
    // exclusivo distintos — a diferencia de las gorras de Pikachu, no debe
    // filtrarse como puramente cosmética.
    it('SÍ ofrece la Forma Bajo Voltaje de Toxtricity (mismo tipo y stats que Amperio, pero es una forma jugable real)', async () => {
      const swordShield = new Game('sword-shield', 'Sword/Shield', new Generation('generation-viii', 'VIII'));

      function toxtricityStats() {
        return {
          types: [
            { slot: 1, type: { name: 'electric', url: '' } },
            { slot: 2, type: { name: 'poison', url: '' } },
          ],
          stats: [
            { base_stat: 75, stat: { name: 'hp', url: '' } },
            { base_stat: 98, stat: { name: 'attack', url: '' } },
            { base_stat: 70, stat: { name: 'defense', url: '' } },
            { base_stat: 114, stat: { name: 'special-attack', url: '' } },
            { base_stat: 70, stat: { name: 'special-defense', url: '' } },
            { base_stat: 75, stat: { name: 'speed', url: '' } },
          ],
        };
      }

      const promise = service.fetchPokedexDetails(swordShield, new PokedexView(), ['toxtricity'], 'en');

      await flushAllPending(httpMock, (url) => {
        if (url.includes('/version-group/sword-shield/')) return { pokedexes: [{ name: 'galar', url: '' }] };
        if (url.includes('/pokemon-species/toxtricity/')) {
          return {
            gender_rate: 4,
            has_gender_differences: false,
            generation: { name: 'generation-viii', url: '' },
            names: NAME_EN('Toxtricity'),
            varieties: [
              { is_default: true, pokemon: { name: 'toxtricity-amped', url: '' } },
              { is_default: false, pokemon: { name: 'toxtricity-low-key', url: '' } },
            ],
            pokedex_numbers: [{ entry_number: 121, pokedex: { name: 'galar', url: '' } }],
          };
        }
        if (url.includes('/pokemon/toxtricity-amped/')) {
          return {
            name: 'toxtricity-amped',
            ...toxtricityStats(),
            sprites: { front_default: 'sprite.png', other: { home: { front_default: 'home-amped.png', front_shiny: null, front_female: null, front_shiny_female: null } } },
            forms: [{ name: 'toxtricity-amped', url: `${BASE}pokemon-form/toxtricity-amped/` }],
          };
        }
        if (url.includes('/pokemon/toxtricity-low-key/')) {
          return {
            name: 'toxtricity-low-key',
            ...toxtricityStats(),
            sprites: { front_default: 'sprite.png', other: { home: { front_default: 'home-low-key.png', front_shiny: null, front_female: null, front_shiny_female: null } } },
            forms: [{ name: 'toxtricity-low-key', url: `${BASE}pokemon-form/toxtricity-low-key/` }],
          };
        }
        if (url.includes('/pokemon-form/toxtricity-amped/')) {
          return { name: 'toxtricity-amped', is_default: true, is_battle_only: false, is_mega: false, form_name: 'amped', names: NAME_EN('Toxtricity (Amped)'), sprites: { front_default: 'sprite.png' } };
        }
        if (url.includes('/pokemon-form/toxtricity-low-key/')) {
          return { name: 'toxtricity-low-key', is_default: true, is_battle_only: false, is_mega: false, form_name: 'low-key', names: NAME_EN('Toxtricity (Low Key)'), sprites: { front_default: 'sprite.png' } };
        }
        if (url.includes('/generation/generation-viii/')) return { name: 'generation-viii', names: NAME_EN('Generation VIII') };
        return undefined;
      });

      const [entry] = await promise;
      expect(entry.selectableForms.map((f) => f.varietyId)).toEqual(['toxtricity-low-key']);
    });
  });

  it('lanza PokedexUnavailable si ningún id resuelve', async () => {
    const promise = service.fetchPokedexDetails(game, new PokedexView(), ['ghost-mon'], 'en');
    const assertion = expectAsync(promise).toBeRejectedWith(jasmine.any(PokedexUnavailable));

    httpMock.expectOne((r) => r.url.includes('/version-group/red-blue/')).flush({ pokedexes: [{ name: 'kanto', url: '' }] });
    await Promise.resolve();
    await Promise.resolve();
    httpMock
      .expectOne((r) => r.url.includes('/pokemon-species/ghost-mon/'))
      .error(new ProgressEvent('not found'));

    await assertion;
  });
});
