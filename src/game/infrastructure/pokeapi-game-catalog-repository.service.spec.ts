import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { PokeApiGameCatalogRepositoryService } from './pokeapi-game-catalog-repository.service';
import { GameCatalogUnavailable } from '../domain/ports/game-catalog-repository';

const BASE = 'https://pokeapi.co/api/v2/';

/** Universo mínimo: un juego base con dos DLC (patrón real Espada/Escudo),
 *  un spin-off sin Pokédex propia (excluido), y dos version-groups de una
 *  sola versión en la misma generación que NO siguen el patrón de DLC
 *  (deben quedar como juegos independientes, no anidados entre sí). */
const VERSION_GROUPS = {
  'sword-shield': {
    name: 'sword-shield',
    generation: { name: 'generation-viii', url: `${BASE}generation/8/` },
    versions: [
      { name: 'sword', url: `${BASE}version/sword/` },
      { name: 'shield', url: `${BASE}version/shield/` },
    ],
    pokedexes: [{ name: 'galar', url: '' }],
  },
  'the-isle-of-armor': {
    name: 'the-isle-of-armor',
    generation: { name: 'generation-viii', url: `${BASE}generation/8/` },
    versions: [
      { name: 'the-isle-of-armor-sword', url: `${BASE}version/the-isle-of-armor-sword/` },
      { name: 'the-isle-of-armor-shield', url: `${BASE}version/the-isle-of-armor-shield/` },
    ],
    pokedexes: [{ name: 'isle-of-armor', url: '' }],
  },
  colosseum: {
    name: 'colosseum',
    generation: { name: 'generation-iii', url: `${BASE}generation/3/` },
    versions: [{ name: 'colosseum', url: `${BASE}version/colosseum/` }],
    pokedexes: [],
  },
  'legends-za': {
    name: 'legends-za',
    generation: { name: 'generation-ix', url: `${BASE}generation/9/` },
    versions: [{ name: 'legends-za', url: `${BASE}version/legends-za/` }],
    pokedexes: [{ name: 'lumiose-city', url: '' }],
  },
  /** No sigue el patrón de sufijo (research.md Decisión 5 de `018`) — por
   *  eso necesita el override explícito `DLC_VERSION_GROUP_OVERRIDES` en
   *  vez de ser detectado por la heurística genérica. */
  'mega-dimension': {
    name: 'mega-dimension',
    generation: { name: 'generation-ix', url: `${BASE}generation/9/` },
    versions: [{ name: 'mega-dimension', url: `${BASE}version/mega-dimension/` }],
    pokedexes: [{ name: 'hyperspace', url: '' }],
  },
  'sun-moon': {
    name: 'sun-moon',
    generation: { name: 'generation-vii', url: `${BASE}generation/7/` },
    versions: [
      { name: 'sun', url: `${BASE}version/sun/` },
      { name: 'moon', url: `${BASE}version/moon/` },
    ],
    pokedexes: [{ name: 'alola', url: '' }],
  },
  /** Sí sigue el patrón de sufijo genérico ("ultra-sun" termina en "-sun",
   *  "ultra-moon" en "-moon", prefijo consistente "ultra") — por eso
   *  necesita el override `NEVER_DLC_VERSION_GROUP_NAMES` para NO quedar
   *  anidado bajo `sun-moon` (research.md Decisión 5 de `018`, FR-008). */
  'ultra-sun-ultra-moon': {
    name: 'ultra-sun-ultra-moon',
    generation: { name: 'generation-vii', url: `${BASE}generation/7/` },
    versions: [
      { name: 'ultra-sun', url: `${BASE}version/ultra-sun/` },
      { name: 'ultra-moon', url: `${BASE}version/ultra-moon/` },
    ],
    pokedexes: [{ name: 'alola-ultra', url: '' }],
  },
};

const VERSION_NAMES: Record<string, { name: string; names: { name: string; language: { name: string } }[] }> = {
  sword: { name: 'sword', names: [{ name: 'Sword', language: { name: 'en' } }] },
  shield: { name: 'shield', names: [{ name: 'Shield', language: { name: 'en' } }] },
  'the-isle-of-armor-sword': {
    name: 'the-isle-of-armor-sword',
    names: [{ name: 'Sword: The Isle of Armor', language: { name: 'en' } }],
  },
  'the-isle-of-armor-shield': {
    name: 'the-isle-of-armor-shield',
    names: [{ name: 'Shield: The Isle of Armor', language: { name: 'en' } }],
  },
  'legends-za': { name: 'legends-za', names: [{ name: 'Legends: Z-A', language: { name: 'en' } }] },
  'mega-dimension': {
    name: 'mega-dimension',
    names: [{ name: 'Mega Dimension', language: { name: 'en' } }],
  },
  sun: { name: 'sun', names: [{ name: 'Sun', language: { name: 'en' } }] },
  moon: { name: 'moon', names: [{ name: 'Moon', language: { name: 'en' } }] },
  'ultra-sun': { name: 'ultra-sun', names: [{ name: 'Ultra Sun', language: { name: 'en' } }] },
  'ultra-moon': { name: 'ultra-moon', names: [{ name: 'Ultra Moon', language: { name: 'en' } }] },
};

const GENERATION_NAMES: Record<string, { name: string; names: { name: string; language: { name: string } }[] }> = {
  'generation-viii': {
    name: 'generation-viii',
    names: [{ name: 'Generation VIII', language: { name: 'en' } }],
  },
  'generation-ix': {
    name: 'generation-ix',
    names: [{ name: 'Generation IX', language: { name: 'en' } }],
  },
  'generation-vii': {
    name: 'generation-vii',
    names: [{ name: 'Generation VII', language: { name: 'en' } }],
  },
};

/** Responde en oleadas a todas las peticiones pendientes hasta que no
 *  quede ninguna — necesario porque el servicio encadena varias rondas de
 *  `Promise.all` (lista -> detalle de cada version-group -> version +
 *  generation), cada una desatando la siguiente. */
async function flushAllPending(httpMock: HttpTestingController): Promise<void> {
  for (let round = 0; round < 6; round++) {
    const pending = httpMock.match(() => true);
    if (pending.length === 0) {
      await Promise.resolve();
      continue;
    }
    for (const req of pending) {
      const url = req.request.url;
      if (url.endsWith('version-group?limit=100')) {
        req.flush({
          results: Object.keys(VERSION_GROUPS).map((name) => ({ name, url: `${BASE}version-group/${name}/` })),
        });
      } else if (url.includes('/version-group/')) {
        const name = url.split('/version-group/')[1].replace(/\/$/, '');
        req.flush(VERSION_GROUPS[name as keyof typeof VERSION_GROUPS]);
      } else if (url.includes('/version/')) {
        const name = url.split('/version/')[1].replace(/\/$/, '');
        req.flush(VERSION_NAMES[name]);
      } else if (url.includes('/generation/')) {
        const name = url.split('/generation/')[1].replace(/\/$/, '');
        req.flush(GENERATION_NAMES[name]);
      } else {
        throw new Error(`Unexpected request in test: ${url}`);
      }
    }
    await Promise.resolve();
    await Promise.resolve();
  }
}

describe('PokeApiGameCatalogRepositoryService', () => {
  let service: PokeApiGameCatalogRepositoryService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(PokeApiGameCatalogRepositoryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('arma el catálogo: junta lanzamientos conjuntos, anida DLC, excluye spin-offs sin Pokédex', async () => {
    const promise = service.fetchCatalog('en');
    await flushAllPending(httpMock);
    const games = await promise;

    // colosseum (sin pokedexes) nunca aparece.
    expect(games.find((g) => g.id === 'colosseum')).toBeUndefined();

    const swordShield = games.find((g) => g.id === 'sword-shield');
    expect(swordShield?.displayName).toBe('Sword/Shield');
    expect(swordShield?.dlcs.map((d) => d.id)).toEqual(['the-isle-of-armor']);
    expect(swordShield?.dlcs[0].displayName).toBe('The Isle of Armor');

    // No aparece como juego independiente — solo anidado bajo su padre.
    expect(games.find((g) => g.id === 'the-isle-of-armor')).toBeUndefined();

    // FR-007 (018): "Mega Dimension" es DLC de Legends Z-A, nunca un juego
    // independiente — no lo detecta la heurística de sufijos (ninguna de
    // sus versiones sigue el patrón "<prefijo>-<versión del padre>"), por
    // eso depende del override explícito.
    const legendsZa = games.find((g) => g.id === 'legends-za');
    expect(legendsZa?.dlcs.map((d) => d.id)).toEqual(['mega-dimension']);
    expect(legendsZa?.dlcs[0].displayName).toBe('Mega Dimension');
    expect(games.find((g) => g.id === 'mega-dimension')).toBeUndefined();
  });

  it('mantiene Sol/Luna y Ultra Sol/Ultra Luna como juegos independientes (FR-008, 018)', async () => {
    const promise = service.fetchCatalog('en');
    await flushAllPending(httpMock);
    const games = await promise;

    // "ultra-sun"/"ultra-moon" SÍ siguen el patrón de sufijo genérico
    // frente a "sun"/"moon" (prefijo "ultra" consistente) — sin el
    // override de exclusión, la heurística los anidaría por error.
    const sunMoon = games.find((g) => g.id === 'sun-moon');
    const ultraSunUltraMoon = games.find((g) => g.id === 'ultra-sun-ultra-moon');
    expect(sunMoon).toBeDefined();
    expect(ultraSunUltraMoon).toBeDefined();
    expect(sunMoon?.dlcs.map((d) => d.id)).not.toContain('ultra-sun-ultra-moon');
    expect(ultraSunUltraMoon?.dlcs).toEqual([]);
  });

  it('lanza GameCatalogUnavailable si la lista de version-groups falla', async () => {
    const promise = service.fetchCatalog('en');
    const assertion = expectAsync(promise).toBeRejectedWith(jasmine.any(GameCatalogUnavailable));

    httpMock.expectOne((r) => r.url.endsWith('version-group?limit=100')).error(new ProgressEvent('network error'));

    await assertion;
  });
});
