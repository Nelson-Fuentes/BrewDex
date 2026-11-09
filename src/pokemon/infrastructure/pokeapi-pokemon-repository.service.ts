import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import type { Game } from '../../game/domain/entities/game';
import { Generation } from '../../game/domain/value-objects/generation';
import type { PokedexView } from '../../pokedex/domain/value-objects/pokedex-view';
import type { PokedexEntrySource } from '../../pokedex/domain/value-objects/pokedex-entry-source';
import { PokedexEntry } from '../domain/entities/pokedex-entry';
import { PokemonType } from '../domain/value-objects/pokemon-type';
import { PokemonStats } from '../domain/value-objects/pokemon-stats';
import { SelectableForm, type SelectableFormKind } from '../domain/value-objects/selectable-form';
import { CosmeticVariant } from '../domain/value-objects/cosmetic-variant';
import { PokedexUnavailable, type PokemonRepository } from '../domain/ports/pokemon-repository';
import { resolveLocalizedName, type PokeApiLocalizedEntry } from '../../shared/pokeapi/resolve-localized-name';
import { LoggingService } from '../../shared/logging/logging.service';
import { logAndRethrow } from '../../shared/logging/http-error-mapping';

const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2/';

/**
 * El sufijo de variedad regional principal por juego — PokeAPI no declara
 * a qué región pertenece una variedad, pero toda forma regional conocida
 * sigue la convención de nombre `{especie}-{sufijo}` (research.md
 * Decisión 4).
 */
const REGIONAL_FORM_SUFFIX_BY_GAME_ID: Readonly<Record<string, string>> = {
  'sun-moon': 'alola',
  'ultra-sun-ultra-moon': 'alola',
  'sword-shield': 'galar',
  'legends-arceus': 'hisui',
  'scarlet-violet': 'paldea',
};

/**
 * Juegos donde una forma regional se puede ELEGIR como alternativa
 * (seleccionable, kind `'template'`) sin que sea la variedad PRINCIPAL
 * de esa región (a diferencia de {@link REGIONAL_FORM_SUFFIX_BY_GAME_ID},
 * que sí la vuelve principal en su propio juego) — bug reportado: Let's
 * Go Pikachu/Eevee (Generación VII, ambientado en Kanto) sí permite
 * obtener varias formas de Alola (Raichu, Golem, Marowak, Exeggutor,
 * etc.) como alternativas de su forma de Kanto (que sigue siendo la
 * principal por defecto, verificado contra el juego real), pero no es
 * "el juego de Alola" en el sentido de {@link REGIONAL_FORM_SUFFIX_BY_GAME_ID}
 * — antes, al no estar en ningún lado, el filtro de variedad regional
 * (ver `resolveOtherVarietyForms`) las ocultaba como si fueran de un
 * juego completamente ajeno a esa región.
 */
const EXTRA_ALTERNATE_REGIONAL_SUFFIX_BY_GAME_ID: Readonly<Record<string, string>> = {
  'lets-go-pikachu-lets-go-eevee': 'alola',
};

/**
 * Especies cuya forma regional (de otro modo detectada automáticamente
 * por {@link REGIONAL_FORM_SUFFIX_BY_GAME_ID}) solo se consigue a través
 * de un DLC concreto del juego — verificado contra el juego real (spec
 * `020`): Slowpoke/Slowbro/Slowking de Galar solo aparecen en "The Isle
 * of Armor"; Articuno/Zapdos/Moltres de Galar solo en "The Crown
 * Tundra". En la Pokédex base/regional (y en cualquier otro DLC) esas
 * especies siguen mostrando su forma original — la regional queda
 * reservada para la sección de ESE DLC específico (ver
 * `resolveSourceTag`/`sourceTag` en `buildEntry`).
 */
const DLC_EXCLUSIVE_REGIONAL_SPECIES: Readonly<Record<string, string>> = {
  slowpoke: 'the-isle-of-armor',
  slowbro: 'the-isle-of-armor',
  slowking: 'the-isle-of-armor',
  articuno: 'the-crown-tundra',
  zapdos: 'the-crown-tundra',
  moltres: 'the-crown-tundra',
};

/**
 * Especies cuyas formas tipo `'template'` no están disponibles en TODOS
 * los juegos donde la especie en sí existe (FR-006, spec `020`) — el
 * caso verificado contra el juego real: Rotom (Generación IV) solo
 * permite elegir sus formas de electrodoméstico desde Platino en
 * adelante; en Diamante/Perla (lanzamiento original, misma generación)
 * el juego base no ofrece el cambio de forma.
 */
const TEMPLATE_FORM_UNAVAILABLE_GAME_IDS: Readonly<Record<string, readonly string[]>> = {
  rotom: ['diamond-pearl'],
};

/**
 * Formas tipo `'template'` cuya variedad solo se puede obtener con un
 * DLC específico activo (FR-007, spec `020`) — caso verificado: la
 * forma original de Kanto de Tauros (`tauros`, variedad no-Paldea) solo
 * aparece en Escarlata/Púrpura con el DLC "Disco Índigo" activo; sin
 * él, la Pokédex regional/base solo ofrece las 3 razas de Tauros de
 * Paldea (variedad principal, no una forma seleccionable).
 */
const TEMPLATE_FORM_DLC_REQUIREMENTS: Readonly<Record<string, string>> = {
  tauros: 'the-indigo-disk',
};

/**
 * Variedades 'template' que solo existen en un conjunto puntual de
 * juegos, en vez de en cualquier juego donde exista la especie (FR-006,
 * spec `020`, corrección 9 — bug reportado: el Pikachu/Eevee inicial de
 * Let's Go aparecía como forma seleccionable en cualquier juego con
 * Pikachu/Eevee, no solo en Let's Go). Verificado en vivo contra
 * PokeAPI: `pokemon-form.version_group` de `pikachu-starter`/
 * `eevee-starter` es exactamente `lets-go-pikachu-lets-go-eevee`, el
 * único juego real donde existe ese Pokémon inicial con estadísticas
 * mejoradas. Clave = `variety.pokemon.name` (no la especie, a
 * diferencia de {@link TEMPLATE_FORM_UNAVAILABLE_GAME_IDS} — acá la
 * excepción es de la variedad puntual, no de todas las formas
 * 'template' de la especie).
 */
const TEMPLATE_FORM_ONLY_IN_GAME_IDS: Readonly<Record<string, readonly string[]>> = {
  'pikachu-starter': ['lets-go-pikachu-lets-go-eevee'],
  'eevee-starter': ['lets-go-pikachu-lets-go-eevee'],
};

/**
 * Variedades 'template' que PokeAPI marca `is_battle_only` (se
 * transforman dentro de un combate, o —caso Zygarde— solo se alcanzan
 * activando una mecánica de combate concreta) pero que igual se ofrecen
 * como forma seleccionable en CUALQUIER juego donde exista la especie:
 * la persona quiere poder mostrar/planificar esta forma en el
 * Pokédex/equipo aunque el juego real no la deje elegida de forma
 * manual y persistente fuera de combate. Verificado en vivo contra
 * PokeAPI:
 * - `zygarde-complete`: en Sol/Luna, Ultrasol/Ultraluna y
 *   Escarlata/Púrpura solo se alcanza transformándose en batalla al
 *   activar Poder Conjunto; en Leyendas Z-A, en cambio, el Cubo Zygarde
 *   sí permite cambiar libremente entre las Formas 10%/50%/Completa
 *   desde el menú — se ofrece igual en todos, sin distinguir el juego
 *   (bug reportado, extendiendo la excepción original solo para
 *   Leyendas Z-A).
 * - `wishiwashi-school`: cambia sola según HP/nivel dentro de un
 *   combate (Nivel 20+, HP > 1/4); revierte a Solitaria fuera de él.
 * - `meloetta-pirouette`: cambia solo al usar el movimiento Canción
 *   Reliquia en combate; revierte a Melodía al salir de combate o al
 *   terminarlo (además cambia de tipo, Normal/Psíquico a
 *   Normal/Lucha — no es cosmética).
 */
const BATTLE_ONLY_SELECTABLE_VARIETY_IDS = new Set<string>(['zygarde-complete', 'wishiwashi-school', 'meloetta-pirouette']);

/**
 * Variedades 'template' con el mismo tipo Y las mismas estadísticas base
 * que su forma principal que, pese a eso, SÍ son una forma jugable real
 * y deben ofrecerse en el selector — excepción a la heurística
 * `isCosmeticOnly` (spec `020`, corrección post-release, bug reportado:
 * Toxtricity en Espada/Escudo no mostraba el selector de forma). Caso
 * verificado contra el juego real: Toxtricity Forma Amperio/Bajo Voltaje
 * (`toxtricity-low-key`) determina su naturaleza al capturarlo/eclosionar
 * y cambia su habilidad (Más/Menos) y su movimiento exclusivo
 * (Sobrecarga/Bramido Trueno) — una elección real del jugador, aunque
 * PokeAPI reporte idéntico tipo Eléctrico/Veneno y las mismas 6
 * estadísticas base que la forma Amperio. A diferencia de las gorras de
 * Pikachu (puramente cosméticas, sin ninguna diferencia jugable), esta sí
 * debe pasar el filtro de `isCosmeticOnly`. También cubre
 * `keldeo-resolute` — bug reportado: Keldeo Forma Resoluta no aparecía
 * como forma seleccionable. Verificado en vivo contra PokeAPI: mismo
 * tipo Agua/Lucha y mismas 6 estadísticas base que la Forma Corriente,
 * pero a diferencia de las gorras de Pikachu SÍ representa un estado
 * real y persistente fuera de combate (Keldeo cambia a esta forma al
 * aprender el movimiento Espada Sagrada y se mantiene así hasta que lo
 * olvida — no revierte sola como Wishiwashi/Meloetta, ver
 * {@link BATTLE_ONLY_SELECTABLE_VARIETY_IDS}; de hecho no es
 * `is_battle_only` en absoluto).
 */
const NON_COSMETIC_DESPITE_SAME_STATS_VARIETY_IDS = new Set<string>(['toxtricity-low-key', 'keldeo-resolute']);

/**
 * Claves alternativas de `sprites.versions[generation]` a probar cuando
 * el id del `Game` (nombre del version-group) no es directamente la
 * clave — verificado en vivo contra PokeAPI (spec `019`, corrige el
 * fallback incorrecto a `front_default` reportado para Oro/Plata y
 * Rojo/Verde/Azul):
 * - `gold-silver` (version-group): PokeAPI parte el sprite por versión
 *   individual (`gold`, `silver`), no por el nombre del grupo.
 * - `red-green-japan`/`blue-japan`: version-groups propios (Japón, sin
 *   contraparte internacional) sin ningún bucket de sprite dedicado en
 *   `sprites.versions.generation-i` — la única artwork de esa era que
 *   PokeAPI sí tiene es la de `red-blue`, misma generación y estilo.
 */
const SPRITE_VERSION_KEY_OVERRIDES: Readonly<Record<string, readonly string[]>> = {
  'gold-silver': ['gold', 'silver'],
  'red-green-japan': ['red-blue'],
  'blue-japan': ['red-blue'],
};

/** Los sufijos de forma regional reconocidos (valores de
 *  {@link REGIONAL_FORM_SUFFIX_BY_GAME_ID}) — usado para reconocer una
 *  variedad regional de OTRA región/juego cuando aparece como "otra
 *  variedad" de la especie (spec `020`, bug reportado: Darmanitan de
 *  Galar ofrecido como forma seleccionable en Negro 2/Blanco 2, donde
 *  esa forma no existe). */
const REGIONAL_SUFFIXES = new Set(Object.values(REGIONAL_FORM_SUFFIX_BY_GAME_ID));

/** Si `varietyName` es la variedad regional de `pokemonId` para ALGÚN
 *  sufijo conocido (p. ej. `darmanitan-galar`, `darmanitan-galar-zen`),
 *  devuelve ese sufijo; si no es una variedad regional (formas como
 *  Rotom/Urshifu/Tauros de Kanto no llevan sufijo de región), `null`.
 *  Reconoce también las variedades Totem de una forma regional
 *  (`{especie}-totem-{región}`, p. ej. `raticate-totem-alola`) —
 *  verificado en vivo contra PokeAPI: no siguen el patrón
 *  `{especie}-{región}` porque `totem` se intercala antes del sufijo de
 *  región, así que se les escapaba al chequeo original (bug reportado:
 *  Raticate de Alola seguía apareciendo en juegos donde esa región no
 *  existe, vía justamente esta variedad Totem). */
function regionalSuffixOfVariety(pokemonId: string, varietyName: string): string | null {
  for (const suffix of REGIONAL_SUFFIXES) {
    const plain = `${pokemonId}-${suffix}`;
    const totem = `${pokemonId}-totem-${suffix}`;
    if (
      varietyName === plain ||
      varietyName.startsWith(`${plain}-`) ||
      varietyName === totem ||
      varietyName.startsWith(`${totem}-`)
    ) {
      return suffix;
    }
  }
  return null;
}

/** Orden total de generaciones, más antigua primero — mismo propósito que
 *  el equivalente en `pokedex/infrastructure/pokeapi-pokedex-index-
 *  repository.service.ts` (duplicado deliberadamente: distinto módulo,
 *  Constitución Principio VI). Usado para resolver `past_types` (spec
 *  `019`): el tipo de un Pokémon puede cambiar entre generaciones (p. ej.
 *  Clefairy era Normal hasta la Generación V, Hada desde la VI). */
const GENERATION_ORDER = [
  'generation-i',
  'generation-ii',
  'generation-iii',
  'generation-iv',
  'generation-v',
  'generation-vi',
  'generation-vii',
  'generation-viii',
  'generation-ix',
];

function generationOrdinal(generationId: string): number {
  return GENERATION_ORDER.indexOf(generationId);
}

interface PokeApiNamedLocalizedEntry extends PokeApiLocalizedEntry {
  readonly name: string;
}

interface NamedApiResource {
  readonly name: string;
  readonly url: string;
}

interface PokeApiSpeciesResource {
  readonly gender_rate: number;
  readonly has_gender_differences: boolean;
  readonly generation: NamedApiResource;
  readonly names: readonly PokeApiNamedLocalizedEntry[];
  readonly varieties: readonly { is_default: boolean; pokemon: NamedApiResource }[];
  readonly pokedex_numbers: readonly { entry_number: number; pokedex: NamedApiResource }[];
}

interface PokeApiTypeSlot {
  readonly slot: number;
  readonly type: NamedApiResource;
}

interface PokeApiStat {
  readonly base_stat: number;
  readonly stat: NamedApiResource;
}

interface PokeApiSprites {
  readonly front_default: string | null;
  readonly other?: {
    readonly home?: {
      readonly front_default: string | null;
      readonly front_shiny: string | null;
      readonly front_female: string | null;
      readonly front_shiny_female: string | null;
    };
  };
  /** Sprites por generación + version-group (p. ej.
   *  `versions['generation-i']['red-blue']`) — la única parte de este
   *  payload que realmente varía por juego (research.md Decisión 6 de
   *  `018`). Ausente para especies sin sprites históricos versionados. */
  readonly versions?: Readonly<
    Record<string, Readonly<Record<string, { readonly front_default: string | null } | undefined>>>
  >;
}

/** Un tramo histórico de tipado — "hasta (e incluyendo) esta generación,
 *  el Pokémon tuvo estos tipos" (verificado en vivo: p. ej. Clefairy
 *  declara un tramo `generation-v` con tipo `normal`; para Generación VI
 *  en adelante no hay tramo y se usa `types`, el tipo vigente). */
interface PokeApiPastTypeEntry {
  readonly generation: NamedApiResource;
  readonly types: readonly PokeApiTypeSlot[];
}

/** Un tramo histórico de estadísticas — "hasta (e incluyendo) esta
 *  generación, el Pokémon tuvo estos valores" (spec
 *  `022-historical-stat-changes`; verificado en vivo: p. ej. Pidgeot
 *  declara un tramo `generation-v` con `speed: 91` — sube a 101 desde la
 *  Generación VI). A diferencia de {@link PokeApiPastTypeEntry}, `stats`
 *  es **parcial**: solo lista las estadísticas que de verdad cambiaron
 *  en ese corte, no las seis — puede haber más de un tramo aplicable a
 *  la vez, cada uno con estadísticas distintas (ver
 *  `resolveApplicableStats`). Puede usar el nombre legacy `'special'`
 *  (la estadística Especial única previa al split de Ataque
 *  Especial/Defensa Especial en la Generación II), solo en tramos
 *  `generation-i`. */
interface PokeApiPastStatEntry {
  readonly generation: NamedApiResource;
  readonly stats: readonly PokeApiStat[];
}

interface PokeApiPokemonResource {
  readonly name: string;
  readonly types: readonly PokeApiTypeSlot[];
  /** Tramos de tipado anteriores al actual (spec `019`) — ausente o
   *  vacío si el Pokémon nunca cambió de tipo. */
  readonly past_types?: readonly PokeApiPastTypeEntry[];
  readonly stats: readonly PokeApiStat[];
  /** Tramos de estadísticas anteriores a las actuales (spec
   *  `022-historical-stat-changes`) — ausente o vacío si la especie
   *  nunca tuvo un cambio histórico de estadísticas (la inmensa
   *  mayoría). */
  readonly past_stats?: readonly PokeApiPastStatEntry[];
  readonly sprites: PokeApiSprites;
  readonly forms: readonly NamedApiResource[];
}

interface PokeApiFormResource {
  readonly name: string;
  readonly is_default: boolean;
  readonly is_battle_only: boolean;
  readonly is_mega: boolean;
  readonly form_name: string;
  readonly names: readonly PokeApiNamedLocalizedEntry[];
  readonly sprites: { readonly front_default: string | null };
}

interface PokeApiVersionGroupResource {
  readonly pokedexes: readonly NamedApiResource[];
}

interface PokeApiGenerationResource {
  readonly name: string;
  readonly names: readonly PokeApiNamedLocalizedEntry[];
}

function findStat(stats: readonly PokeApiStat[], name: string): number {
  return stats.find((s) => s.stat.name === name)?.base_stat ?? 0;
}

/**
 * Implementa {@link PokemonRepository} contra `pokemon-species`, `pokemon`
 * y `pokemon-form` de PokeAPI (contracts/pokemon.md). Único lugar de la
 * infraestructura que conoce la forma de esas respuestas (Constitución
 * Principio VI).
 */
@Injectable({ providedIn: 'root' })
export class PokeApiPokemonRepositoryService implements PokemonRepository {
  private readonly http = inject(HttpClient);
  private readonly logging = inject(LoggingService);

  async fetchPokedexDetails(
    game: Game,
    view: PokedexView,
    pokemonIds: readonly string[],
    languageCode: string,
  ): Promise<PokedexEntry[]> {
    if (pokemonIds.length === 0) {
      return [];
    }
    try {
      const versionGroup = await firstValueFrom(
        this.http.get<PokeApiVersionGroupResource>(`${POKEAPI_BASE_URL}version-group/${game.id}/`),
      );
      const pokedexNames = versionGroup.pokedexes.map((p) => p.name);

      const entries = await Promise.all(
        pokemonIds.map((id) =>
          this.buildEntry(id, game, view, pokedexNames, languageCode).catch((error) => {
            this.logging.warn('PokeApiPokemonRepositoryService', `No se pudo resolver ${id}`, error);
            return null;
          }),
        ),
      );
      const resolved = entries.filter((e): e is PokedexEntry => e !== null);
      if (resolved.length === 0) {
        throw new Error('No pokemon id resolved');
      }
      return resolved;
    } catch (error) {
      return logAndRethrow(
        this.logging,
        'PokeApiPokemonRepositoryService',
        error,
        () => new PokedexUnavailable(),
      );
    }
  }

  private async buildEntry(
    pokemonId: string,
    game: Game,
    view: PokedexView,
    pokedexNames: readonly string[],
    languageCode: string,
  ): Promise<PokedexEntry> {
    const species = await firstValueFrom(
      this.http.get<PokeApiSpeciesResource>(`${POKEAPI_BASE_URL}pokemon-species/${pokemonId}/`),
    );
    // Se calcula ANTES de elegir la variedad principal — determina qué
    // forma corresponde mostrar en esta sección de la Pokédex (spec
    // `020`, ver DLC_EXCLUSIVE_REGIONAL_SPECIES abajo). No depende de la
    // variedad, solo de especie/juego/vista.
    const sourceTag = this.resolveSourceTag(species, game, view, pokedexNames);

    const regionalSuffix = REGIONAL_FORM_SUFFIX_BY_GAME_ID[game.id];
    const dlcExclusiveTo = DLC_EXCLUSIVE_REGIONAL_SPECIES[pokemonId];
    // FR (`020`): la forma regional de una especie puede ser exclusiva de
    // un DLC concreto (p. ej. Slowpoke de Galar solo se consigue en "The
    // Isle of Armor" — en la Pokédex base/regional de Espada/Escudo la
    // especie sigue siendo la forma original). Si la especie tiene ese
    // tipo de restricción, la forma regional solo se usa cuando esta
    // entrada viene de ESE DLC; el resto de las secciones (regional,
    // nacional, u otro DLC) muestran la forma original.
    const regionalFormApplies =
      !!regionalSuffix && (!dlcExclusiveTo || (sourceTag.kind === 'dlc' && sourceTag.dlcId === dlcExclusiveTo));
    // La variedad regional casi siempre se llama exactamente
    // `{especie}-{sufijo}` (p. ej. `rattata-alola`), pero Tauros de
    // Paldea es la excepción verificada contra PokeAPI: no existe una
    // variedad `tauros-paldea` — en su lugar hay tres, una por raza
    // (`tauros-paldea-combat-breed`, `-blaze-breed`, `-aqua-breed`), y
    // ninguna hacía match con la igualdad exacta, así que la Pokédex
    // regional de Escarlata/Púrpura caía por defecto al Tauros de Kanto
    // (bug reportado en `020`). Se acepta también el prefijo seguido de
    // guion; `find` toma la primera variedad de la lista de PokeAPI, que
    // para Tauros ya viene en el orden correcto (combat-breed primero,
    // la raza por defecto real del juego).
    const regionalVariety = regionalFormApplies
      ? species.varieties.find(
          (v) => v.pokemon.name === `${pokemonId}-${regionalSuffix}` || v.pokemon.name.startsWith(`${pokemonId}-${regionalSuffix}-`),
        )
      : undefined;
    const principalVariety = regionalVariety ?? species.varieties.find((v) => v.is_default) ?? species.varieties[0];

    const [principalPokemon, generationResource] = await Promise.all([
      firstValueFrom(this.http.get<PokeApiPokemonResource>(`${POKEAPI_BASE_URL}pokemon/${principalVariety.pokemon.name}/`)),
      firstValueFrom(
        this.http.get<PokeApiGenerationResource>(`${POKEAPI_BASE_URL}generation/${species.generation.name}/`),
      ),
    ]);

    const [typePrimary, typeSecondary] = this.resolveTypes(
      this.resolveApplicableTypes(principalPokemon, game.generation.id),
      languageCode,
    );
    // FR (`022-historical-stat-changes`): las estadísticas base de la
    // forma principal se resuelven para la generación del juego activo
    // (combinando `past_stats` si la especie tuvo algún cambio
    // histórico) — a diferencia de `resolveOtherVarietyForms()` más
    // abajo, que sigue leyendo `pokemon.stats` sin combinar nada (FR-006:
    // el cambio histórico nunca aplica a una variedad alternativa).
    const applicableStats = this.resolveApplicableStats(principalPokemon, game.generation.id);
    const baseStats = new PokemonStats(
      findStat(applicableStats, 'hp'),
      findStat(applicableStats, 'attack'),
      findStat(applicableStats, 'defense'),
      findStat(applicableStats, 'special-attack'),
      findStat(applicableStats, 'special-defense'),
      findStat(applicableStats, 'speed'),
    );

    const [cosmeticVariants, otherVarietyForms] = await Promise.all([
      this.resolveCosmeticVariants(principalPokemon, languageCode),
      this.resolveOtherVarietyForms(
        pokemonId,
        species,
        principalVariety.pokemon.name,
        game,
        languageCode,
        typePrimary,
        typeSecondary,
        baseStats,
      ),
    ]);

    const displayName = resolveLocalizedName(species.names, languageCode, (n) => n.name) ?? pokemonId;
    const generationLabel =
      resolveLocalizedName(generationResource.names, languageCode, (n) => n.name) ?? species.generation.name;

    const pokedexNumber = this.resolvePokedexNumber(species, pokedexNames, view);

    // FR (`020`): una forma introducida más tarde que la especie (p. ej.
    // una regional) se considera de la generación en la que se
    // introdujo, no la de la especie original — PokeAPI no expone un
    // campo de generación por variedad, así que se aproxima con la
    // generación del propio juego que la introduce (las formas
    // regionales siempre debutan junto con el juego de esa región).
    const introducedGeneration = regionalVariety ? game.generation : new Generation(species.generation.name, generationLabel);

    const home = principalPokemon.sprites.other?.home;
    return new PokedexEntry(
      pokemonId,
      displayName,
      pokedexNumber,
      this.resolveGridSpriteUrl(principalPokemon.sprites, game),
      home?.front_default ?? null,
      home?.front_shiny ?? null,
      home?.front_female ?? null,
      home?.front_shiny_female ?? null,
      species.gender_rate,
      species.has_gender_differences,
      otherVarietyForms.templates,
      otherVarietyForms.mega,
      otherVarietyForms.gigamax,
      cosmeticVariants,
      typePrimary,
      typeSecondary,
      introducedGeneration,
      sourceTag,
      baseStats,
      // FR-020 (`021-move-slots-filters`): la variedad que aplica de
      // verdad en este juego cuando no se elige una forma alternativa —
      // `principalVariety`, no la especie cruda `pokemonId` — para que el
      // movepool/moveset por defecto de una forma regional (p. ej.
      // Ninetales de Alola en Ultra Sol/Ultra Luna) no caiga en la
      // variedad de Kanto por defecto de PokeAPI.
      principalVariety.pokemon.name,
    );
  }

  /** FR-006 (`018`): el sprite de la grilla de Pokédex debe corresponder
   *  al juego activo — `sprites.front_default` es "el sprite genérico más
   *  reciente" según la propia documentación de PokeAPI, no varía por
   *  juego, y es la causa del bug reportado (Rojo/Azul mostrando sprites
   *  modernos). `sprites.versions[generation][version-group]` sí varía;
   *  cuando ese bucket específico no existe para la especie (research.md
   *  Decisión 6, Edge Cases de spec.md), cae al genérico en vez de
   *  romperse — la presentación decide si mostrar placeholder. */
  private resolveGridSpriteUrl(sprites: PokeApiSprites, game: Game): string | null {
    const generationBucket = sprites.versions?.[game.generation.id];
    if (!generationBucket) {
      return sprites.front_default;
    }
    for (const key of this.spriteVersionKeyCandidates(game)) {
      const url = generationBucket[key]?.front_default;
      if (url) {
        return url;
      }
    }
    return sprites.front_default;
  }

  /** `sprites.versions[generation]` no siempre usa el nombre del
   *  version-group como clave — PokeAPI a veces la parte por versión
   *  individual (p. ej. Oro/Plata: claves `'gold'`/`'silver'`, no
   *  `'gold-silver'`). Prueba primero el id del `Game` (funciona para la
   *  mayoría: `'red-blue'`, `'ruby-sapphire'`, `'platinum'`...), y para
   *  los casos conocidos que no siguen ese patrón cae a una clave
   *  hermana correcta — mismo tipo de excepción hand-maintained que
   *  `DLC_VERSION_GROUP_OVERRIDES` (research.md Decisión 5/6 de `018`,
   *  ajuste `019`). */
  private spriteVersionKeyCandidates(game: Game): readonly string[] {
    const override = SPRITE_VERSION_KEY_OVERRIDES[game.id];
    return override ? [game.id, ...override] : [game.id];
  }

  /** FR (`019`): los tipos de un Pokémon pueden variar según la
   *  generación/juego — usa `past_types` para encontrar el tramo vigente
   *  en la generación del juego activo (el de fecha de cierre más
   *  cercana que siga siendo `>=` la del juego); si no hay ningún tramo
   *  aplicable, el Pokémon nunca cambió de tipo respecto a esa
   *  generación y se usa el tipo vigente (`types`). */
  private resolveApplicableTypes(pokemon: PokeApiPokemonResource, targetGenerationId: string): readonly PokeApiTypeSlot[] {
    const targetOrdinal = generationOrdinal(targetGenerationId);
    const applicablePastTypes = (pokemon.past_types ?? [])
      .filter((pastType) => generationOrdinal(pastType.generation.name) >= targetOrdinal)
      .sort((a, b) => generationOrdinal(a.generation.name) - generationOrdinal(b.generation.name));
    return applicablePastTypes[0]?.types ?? pokemon.types;
  }

  /** FR (`022-historical-stat-changes`): las estadísticas base de un
   *  Pokémon pueden variar según la generación/juego activo — usa
   *  `past_stats` para combinar todos los tramos aplicables a la
   *  generación del juego activo (todos los que tengan generación `>=`
   *  la del juego), no solo el más cercano como `resolveApplicableTypes`:
   *  cada tramo es **parcial** (solo lista las estadísticas que
   *  realmente cambiaron en ese corte), así que dos tramos distintos
   *  pueden aplicar a la vez sobre estadísticas distintas (verificado en
   *  vivo: Pidgeot tiene un tramo `generation-i` con `special` — el
   *  valor pre-split de Ataque Especial/Defensa Especial, antes de que
   *  existieran como estadísticas separadas — y un tramo `generation-v`
   *  con `speed`, independientes entre sí). Cuando dos tramos aplicables
   *  mencionan la misma estadística, gana el de generación más cercana
   *  a la del juego activo. Si ningún tramo aplicable la menciona, se
   *  usa el valor vigente (`pokemon.stats`). */
  private resolveApplicableStats(pokemon: PokeApiPokemonResource, targetGenerationId: string): readonly PokeApiStat[] {
    const targetOrdinal = generationOrdinal(targetGenerationId);
    const applicablePastStats = (pokemon.past_stats ?? [])
      .filter((pastStat) => generationOrdinal(pastStat.generation.name) >= targetOrdinal)
      .sort((a, b) => generationOrdinal(a.generation.name) - generationOrdinal(b.generation.name));

    const resolved = new Map(pokemon.stats.map((s) => [s.stat.name, s.base_stat]));
    // De más lejano a más cercano, para que el tramo MÁS CERCANO a la
    // generación activa gane si dos tramos definieran la misma
    // estadística (no se conoce ningún caso real así, pero no puede
    // descartarse — FR-007).
    for (const pastStat of [...applicablePastStats].reverse()) {
      for (const stat of pastStat.stats) {
        // `'special'` (pre-Generación II) es el valor único anterior al
        // split de Ataque Especial/Defensa Especial — se asigna a ambas.
        const names = stat.stat.name === 'special' ? ['special-attack', 'special-defense'] : [stat.stat.name];
        for (const name of names) {
          resolved.set(name, stat.base_stat);
        }
      }
    }
    return Array.from(resolved, ([name, base_stat]) => ({ base_stat, stat: { name, url: '' } }));
  }

  private resolveTypes(
    types: readonly PokeApiTypeSlot[],
    languageCode: string,
  ): [PokemonType, PokemonType | null] {
    const sorted = [...types].sort((a, b) => a.slot - b.slot);
    const toType = (slot: PokeApiTypeSlot) => new PokemonType(slot.type.name, slot.type.name);
    void languageCode; // El nombre localizado de tipo se resuelve en presentación desde un catálogo compartido de tipos.
    return [toType(sorted[0]), sorted[1] ? toType(sorted[1]) : null];
  }

  private async resolveCosmeticVariants(
    pokemon: PokeApiPokemonResource,
    languageCode: string,
  ): Promise<CosmeticVariant[]> {
    if (pokemon.forms.length <= 1) {
      return [];
    }
    const forms = await Promise.all(
      pokemon.forms.map((f) => firstValueFrom(this.http.get<PokeApiFormResource>(f.url))),
    );
    return forms.map(
      (form) =>
        new CosmeticVariant(
          form.name,
          resolveLocalizedName(form.names, languageCode, (n) => n.name) ?? form.name,
          form.sprites.front_default,
          form.is_default,
        ),
    );
  }

  private async resolveOtherVarietyForms(
    pokemonId: string,
    species: PokeApiSpeciesResource,
    principalVarietyName: string,
    game: Game,
    languageCode: string,
    principalTypePrimary: PokemonType,
    principalTypeSecondary: PokemonType | null,
    principalBaseStats: PokemonStats,
  ): Promise<{ templates: SelectableForm[]; mega: SelectableForm | null; gigamax: SelectableForm | null }> {
    // FR-006 (`020`, corrección post-release): una variedad regional
    // (Alola/Galar/Hisui/Paldea) de la especie solo se ofrece como forma
    // "otra" (template) en el juego cuyo sufijo regional coincide —
    // nunca en un juego de otra región o de una generación anterior a la
    // introducción de esa región (bug reportado: Darmanitan de Galar
    // aparecía seleccionable en Negro 2/Blanco 2). La forma regional que
    // SÍ corresponde al juego activo ya se resolvió como variedad
    // PRINCIPAL más arriba (`regionalVariety`), así que nunca llega acá
    // como "otra variedad" para ese mismo juego.
    const activeRegionalSuffix = REGIONAL_FORM_SUFFIX_BY_GAME_ID[game.id] ?? null;
    // FR-006 (`020`, corrección 11): además de la región propia del
    // juego (arriba), algunos juegos permiten OTRA región como
    // alternativa sin ser su forma principal — ver
    // EXTRA_ALTERNATE_REGIONAL_SUFFIX_BY_GAME_ID (Let's Go + Alola).
    const extraAlternateRegionalSuffix = EXTRA_ALTERNATE_REGIONAL_SUFFIX_BY_GAME_ID[game.id] ?? null;
    const otherVarieties = species.varieties.filter((v) => {
      if (v.pokemon.name === principalVarietyName) {
        return false;
      }
      const varietySuffix = regionalSuffixOfVariety(pokemonId, v.pokemon.name);
      return (
        varietySuffix === null || varietySuffix === activeRegionalSuffix || varietySuffix === extraAlternateRegionalSuffix
      );
    });
    if (otherVarieties.length === 0) {
      return { templates: [], mega: null, gigamax: null };
    }
    // FR-006 (`020`): algunas especies solo permiten elegir sus formas
    // 'template' a partir de cierto juego dentro de su propia
    // generación (Rotom: recién desde Platino) — Mega/Gigamax no se ven
    // afectados por esta excepción, solo las 'template'.
    const templatesUnavailableHere = TEMPLATE_FORM_UNAVAILABLE_GAME_IDS[pokemonId]?.includes(game.id) ?? false;
    const resolved = await Promise.all(
      otherVarieties.map(async (variety) => {
        const [pokemon, form] = await Promise.all([
          firstValueFrom(this.http.get<PokeApiPokemonResource>(`${POKEAPI_BASE_URL}pokemon/${variety.pokemon.name}/`)),
          firstValueFrom(this.http.get<PokeApiFormResource>(`${POKEAPI_BASE_URL}pokemon-form/${variety.pokemon.name}/`)).catch(
            () => null,
          ),
        ]);
        const [typePrimary, typeSecondary] = this.resolveTypes(
          this.resolveApplicableTypes(pokemon, game.generation.id),
          languageCode,
        );
        const baseStats = new PokemonStats(
          findStat(pokemon.stats, 'hp'),
          findStat(pokemon.stats, 'attack'),
          findStat(pokemon.stats, 'defense'),
          findStat(pokemon.stats, 'special-attack'),
          findStat(pokemon.stats, 'special-defense'),
          findStat(pokemon.stats, 'speed'),
        );
        const kind: SelectableFormKind = form?.is_mega
          ? 'mega'
          : form?.form_name.includes('gmax')
            ? 'gigamax'
            : 'template';
        const home = pokemon.sprites.other?.home;
        const selectableForm = new SelectableForm(
          variety.pokemon.name,
          (form && resolveLocalizedName(form.names, languageCode, (n) => n.name)) ?? variety.pokemon.name,
          pokemon.sprites.front_default,
          // FR-010 (`020`, corrección 6): algunas formas 'template' con
          // diferencia jugable real (stats/movimientos distintos) no
          // tienen sprite HOME propio en PokeAPI — verificado en vivo:
          // los Pokémon inicial de Let's Go Pikachu/Eevee
          // (`pikachu-starter`/`eevee-starter`, con stats mejoradas)
          // solo tienen el sprite de juego (`front_default`), nunca uno
          // de estilo HOME. Cae a ese sprite de juego en vez de `null`
          // para no perder la forma entera por falta de una sola
          // variante de imagen (bug reportado: excluía formas reales
          // por accidente junto con los disfraces puramente cosméticos,
          // que sí quedan filtrados aparte por `isCosmeticOnly`).
          home?.front_default ?? pokemon.sprites.front_default,
          home?.front_shiny ?? null,
          home?.front_female ?? null,
          home?.front_shiny_female ?? null,
          kind,
          // FR-007 (`020`): `null` salvo que esta variedad puntual esté
          // en TEMPLATE_FORM_DLC_REQUIREMENTS (p. ej. Tauros de Kanto).
          TEMPLATE_FORM_DLC_REQUIREMENTS[variety.pokemon.name] ?? null,
          typePrimary,
          typeSecondary,
          baseStats,
        );
        // Sin sprite de chip (`gameSpriteUrl`) o de tarjeta (`homeSpriteUrl`)
        // no hay nada que mostrar en el toggle ni en la imagen grande al
        // seleccionarla — verificado en vivo contra PokeAPI (spec `020`,
        // corrección 4, bug reportado: varias formas de disfraz de
        // Cosplay Pikachu — Rock Star/Belle/Pop Star/Ph.D./Libre/Cosplay —
        // y `pikachu-starter` no tienen sprite HOME en absoluto).
        // `homeSpriteUrl` ya cae al sprite de juego cuando PokeAPI no
        // tiene uno HOME propio (ver arriba) — sin sprite de juego
        // tampoco, no hay absolutamente nada que mostrar en el chip del
        // toggle ni en la tarjeta.
        const hasSprites = selectableForm.gameSpriteUrl !== null;
        // Una variedad con el mismo tipo Y las mismas estadísticas base
        // que la forma principal no cambia nada jugable — es un disfraz
        // puramente cosmético (spec `020`, corrección 5, bug reportado:
        // las gorras de Pikachu — Original/Hoenn/Sinnoh/Unova/Kalos/
        // Alola/Partner/World Cap — verificadas en vivo contra PokeAPI:
        // mismo tipo Eléctrico y mismas 6 estadísticas base que el
        // Pikachu base). No es una forma que tenga sentido elegir en el
        // selector de FR-009 (recalcular tipo), así que no se ofrece —
        // debería modelarse como `CosmeticVariant`, no `SelectableForm`,
        // pero esta corrección solo la excluye del toggle por ahora.
        const isCosmeticOnly =
          !NON_COSMETIC_DESPITE_SAME_STATS_VARIETY_IDS.has(variety.pokemon.name) &&
          typePrimary.equals(principalTypePrimary) &&
          ((typeSecondary === null && principalTypeSecondary === null) ||
            (typeSecondary !== null && principalTypeSecondary !== null && typeSecondary.equals(principalTypeSecondary))) &&
          baseStats.hp === principalBaseStats.hp &&
          baseStats.attack === principalBaseStats.attack &&
          baseStats.defense === principalBaseStats.defense &&
          baseStats.specialAttack === principalBaseStats.specialAttack &&
          baseStats.specialDefense === principalBaseStats.specialDefense &&
          baseStats.speed === principalBaseStats.speed;
        // FR-006 (`020`, corrección 9): esta variedad puntual solo existe
        // en un juego concreto (p. ej. el inicial de Let's Go) — ver
        // TEMPLATE_FORM_ONLY_IN_GAME_IDS arriba.
        const onlyInGameIds = TEMPLATE_FORM_ONLY_IN_GAME_IDS[variety.pokemon.name];
        const isRestrictedToOtherGame = onlyInGameIds !== undefined && !onlyInGameIds.includes(game.id);
        // BATTLE_ONLY_SELECTABLE_VARIETY_IDS anula el `is_battle_only`
        // global de PokeAPI para esta variedad puntual (p. ej. Zygarde
        // Completo, Wishiwashi Escolar, Meloetta Pirueta) — ver
        // comentario junto a la constante.
        const isBattleOnly = (form?.is_battle_only ?? false) && !BATTLE_ONLY_SELECTABLE_VARIETY_IDS.has(variety.pokemon.name);
        return {
          kind,
          isBattleOnly,
          hasSprites,
          isCosmeticOnly,
          isRestrictedToOtherGame,
          selectableForm,
        };
      }),
    );
    return {
      // FR-006: ninguna forma 'template' en los juegos donde esta
      // especie no las ofrece dentro de su propia generación (ver
      // templatesUnavailableHere arriba) — Mega/Gigamax no se filtran acá.
      // Además, una variedad 'template' nunca es realmente seleccionable
      // si es `is_battle_only` (p. ej. Zygarde Completo, que solo se
      // transforma en batalla al activarse Poder Conjunto — nunca una
      // elección manual del jugador), si le falta el sprite del chip o
      // de la tarjeta (`hasSprites`, p. ej. las formas de disfraz de
      // Cosplay Pikachu, sin sprite HOME), o si es puramente cosmética
      // (`isCosmeticOnly`, mismo tipo y estadísticas que la forma
      // principal — p. ej. las gorras de Pikachu) — verificado en vivo
      // contra PokeAPI (spec `020`, correcciones 3/4/5). Mega/Gigamax son
      // `is_battle_only` casi siempre también, pero eso no los afecta
      // acá: van por su propio campo, ya calculado más arriba.
      templates: templatesUnavailableHere
        ? []
        : resolved
            .filter(
              (r) => r.kind === 'template' && !r.isBattleOnly && r.hasSprites && !r.isCosmeticOnly && !r.isRestrictedToOtherGame,
            )
            .map((r) => r.selectableForm),
      mega: resolved.find((r) => r.kind === 'mega')?.selectableForm ?? null,
      gigamax: resolved.find((r) => r.kind === 'gigamax')?.selectableForm ?? null,
    };
  }

  private resolvePokedexNumber(
    species: PokeApiSpeciesResource,
    pokedexNames: readonly string[],
    view: PokedexView,
  ): number {
    if (view.useNationalDex) {
      return species.pokedex_numbers.find((p) => p.pokedex.name === 'national')?.entry_number ?? 0;
    }
    const match = species.pokedex_numbers.find((p) => pokedexNames.includes(p.pokedex.name));
    return match?.entry_number ?? 0;
  }

  private resolveSourceTag(
    species: PokeApiSpeciesResource,
    game: Game,
    view: PokedexView,
    pokedexNames: readonly string[],
  ): PokedexEntrySource {
    if (view.useNationalDex) {
      return { kind: 'national' };
    }
    for (const dlc of game.dlcs) {
      if (view.activeDlcIds.has(dlc.id)) {
        const isInBasePokedex = species.pokedex_numbers.some((p) => pokedexNames.includes(p.pokedex.name));
        if (!isInBasePokedex) {
          return { kind: 'dlc', dlcId: dlc.id };
        }
      }
    }
    return { kind: 'regional' };
  }
}
