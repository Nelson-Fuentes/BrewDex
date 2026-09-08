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
