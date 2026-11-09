import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { Game } from '../domain/entities/game';
import { Generation } from '../domain/value-objects/generation';
import { GameDlc } from '../domain/value-objects/game-dlc';
import { GameCatalogUnavailable, type GameCatalogRepository } from '../domain/ports/game-catalog-repository';
import { resolveLocalizedName, type PokeApiLocalizedEntry } from '../../shared/pokeapi/resolve-localized-name';
import { LoggingService } from '../../shared/logging/logging.service';
import { logAndRethrow } from '../../shared/logging/http-error-mapping';

const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2/';

interface NamedApiResource {
  readonly name: string;
  readonly url: string;
}

interface PokeApiVersionGroupDetail {
  readonly name: string;
  readonly generation: NamedApiResource;
  readonly versions: readonly NamedApiResource[];
  readonly pokedexes: readonly NamedApiResource[];
}

interface PokeApiNamedResource extends PokeApiLocalizedEntry {
  readonly name: string;
}

interface PokeApiVersionResource {
  readonly name: string;
  readonly names: readonly PokeApiNamedResource[];
}

interface PokeApiGenerationResource {
  readonly name: string;
  readonly names: readonly PokeApiNamedResource[];
}

/** El resultado de resolver a qué juego base extiende un version-group DLC. */
interface DlcMatch {
  readonly parentVersionGroupName: string;
  /** Prefijo común a todas las versiones del DLC frente a las del padre —
   *  p. ej. `"the-isle-of-armor"` para `"the-isle-of-armor-sword"` vs.
   *  `"sword"`. Vacío para un match resuelto por
   *  {@link DLC_VERSION_GROUP_OVERRIDES} (no hay prefijo que derivar). */
  readonly slugPrefix: string;
}

/**
 * Excepciones explícitas a la heurística de sufijos — casos reales donde
 * PokeAPI no modela el contenido con la convención de nombres que la
 * heurística asume (research.md Decisión 5 de `018`, contracts/
 * game-dlc-classification.md). Hand-maintained, mismo tipo de tabla que
 * `NATIONAL_DEX_ELIGIBLE_GAME_IDS` en `pokedex/infrastructure/
 * pokeapi-pokedex-index-repository.service.ts` — un gap real de PokeAPI,
 * no una lista completa del catálogo.
 *
 * FR-007: "Mega Dimension" (DLC de Leyendas Z-A) no tiene ninguna versión
 * cuyo nombre siga el patrón `${prefijo}-${versión del padre}` que el
 * resto de los DLC conocidos sigue, así que la heurística genérica nunca
 * lo detecta como hijo de `legends-za`.
 */
const DLC_VERSION_GROUP_OVERRIDES: ReadonlyMap<string, string> = new Map([['mega-dimension', 'legends-za']]);

/**
 * version-groups que NUNCA deben clasificarse como DLC de un hermano,
 * sin importar lo que encuentre la heurística de sufijos (research.md
 * Decisión 5 de `018`).
 *
 * FR-008: `ultra-sun-ultra-moon` SÍ cumple el patrón de sufijo genérico
 * frente a `sun-moon` (`"ultra-sun"` termina en `"-sun"`, `"ultra-moon"`
 * en `"-moon"`, con el mismo prefijo `"ultra"`), pero es un juego
 * independiente, no una expansión de Sol/Luna.
 */
const NEVER_DLC_VERSION_GROUP_NAMES: ReadonlySet<string> = new Set(['ultra-sun-ultra-moon']);

/**
 * Si `versionGroup` es el DLC de algún `candidate` (mismo número de
 * versiones, cada una de la forma `${prefijo}-${versión del candidato}`
 * con un prefijo no vacío y consistente), devuelve ese match. PokeAPI no
 * modela "DLC" como campo — este es el mismo tipo de tabla/heurística
 * hand-maintained que otras brechas de PokeAPI en este proyecto
 * (research.md Decisión 4), pero derivada de la propia forma de los
 * nombres de versión en vez de un listado fijo, para no quedar
 * desactualizada cuando PokeAPI agregue contenido nuevo.
 */
function detectDlcParent(
  versionGroup: PokeApiVersionGroupDetail,
  candidates: readonly PokeApiVersionGroupDetail[],
): DlcMatch | null {
  if (NEVER_DLC_VERSION_GROUP_NAMES.has(versionGroup.name)) {
    return null;
  }
  const overrideParent = DLC_VERSION_GROUP_OVERRIDES.get(versionGroup.name);
  if (overrideParent) {
    return { parentVersionGroupName: overrideParent, slugPrefix: '' };
  }
  for (const candidate of candidates) {
    if (candidate.name === versionGroup.name || candidate.versions.length === 0) {
      continue;
    }
    let prefix: string | null = null;
    const matchedCandidateVersions = new Set<string>();
    for (const version of versionGroup.versions) {
      const matchingCandidateVersion = candidate.versions.find((candidateVersion) => {
        const suffix = `-${candidateVersion.name}`;
        return version.name.endsWith(suffix) && version.name.length > suffix.length;
      });
      if (!matchingCandidateVersion) {
        prefix = null;
        break;
      }
      const derivedPrefix = version.name.slice(
        0,
        version.name.length - matchingCandidateVersion.name.length - 1,
      );
      if (prefix !== null && prefix !== derivedPrefix) {
        prefix = null;
        break;
      }
      prefix = derivedPrefix;
      matchedCandidateVersions.add(matchingCandidateVersion.name);
    }
    if (prefix && matchedCandidateVersions.size === candidate.versions.length) {
      return { parentVersionGroupName: candidate.name, slugPrefix: prefix };
    }
  }
  return null;
}

/** `"Sword: The Isle of Armor"` -> `"The Isle of Armor"` — PokeAPI nombra
 *  cada versión de un DLC como "<versión base>: <nombre del DLC>"
 *  consistentemente en todos sus idiomas (verificado en vivo). */
function stripBaseVersionPrefix(localizedDlcName: string): string {
  const separatorIndex = localizedDlcName.indexOf(': ');
  return separatorIndex === -1 ? localizedDlcName : localizedDlcName.slice(separatorIndex + 2);
}

/**
 * Implementa {@link GameCatalogRepository} contra los recursos
 * `version-group`, `version` y `generation` de PokeAPI
 * (contracts/game-catalog.md). Único lugar de la infraestructura que
 * conoce la forma de esas respuestas (Constitución Principio VI).
 *
 * Un `version-group` de PokeAPI ya es exactamente la unidad "un
 * lanzamiento conjunto = un juego" que FR-005 pide (p. ej.
 * `"sword-shield"` es un único recurso con dos `versions`) — no hace
 * falta una etapa de colapso aparte.
 */
@Injectable({ providedIn: 'root' })
export class PokeApiGameCatalogRepositoryService implements GameCatalogRepository {
  private readonly http = inject(HttpClient);
  private readonly logging = inject(LoggingService);

  async fetchCatalog(languageCode: string): Promise<Game[]> {
    try {
      const versionGroupList = await firstValueFrom(
        this.http.get<{ results: NamedApiResource[] }>(`${POKEAPI_BASE_URL}version-group?limit=100`),
      );
      const allVersionGroups = await Promise.all(
        versionGroupList.results.map((entry) =>
          firstValueFrom(this.http.get<PokeApiVersionGroupDetail>(entry.url)),
        ),
      );
      // Solo version-groups con Pokédex propia sirven para "construir un
      // equipo" (excluye spin-offs de consola como Colosseum/XD, que no
      // tienen ninguna — verificado en vivo: `pokedexes: []`).
      const versionGroups = allVersionGroups.filter((vg) => vg.pokedexes.length > 0);

      const versionGroupsByGeneration = new Map<string, PokeApiVersionGroupDetail[]>();
      for (const vg of versionGroups) {
        const bucket = versionGroupsByGeneration.get(vg.generation.name) ?? [];
        bucket.push(vg);
        versionGroupsByGeneration.set(vg.generation.name, bucket);
      }

      const dlcMatchByVersionGroupName = new Map<string, DlcMatch>();
      for (const vg of versionGroups) {
        const siblings = versionGroupsByGeneration.get(vg.generation.name) ?? [];
        const match = detectDlcParent(vg, siblings);
        if (match) {
          dlcMatchByVersionGroupName.set(vg.name, match);
        }
      }

      const uniqueVersionNames = new Set(
        versionGroups.flatMap((vg) => vg.versions.map((v) => v.name)),
      );
      const uniqueGenerationNames = new Set(versionGroups.map((vg) => vg.generation.name));

      const [versionResources, generationResources] = await Promise.all([
        Promise.all(
          [...uniqueVersionNames].map((name) =>
            firstValueFrom(this.http.get<PokeApiVersionResource>(`${POKEAPI_BASE_URL}version/${name}/`)),
          ),
        ),
        Promise.all(
          [...uniqueGenerationNames].map((name) =>
            firstValueFrom(
              this.http.get<PokeApiGenerationResource>(`${POKEAPI_BASE_URL}generation/${name}/`),
            ),
          ),
        ),
      ]);
      const namesByVersion = new Map(versionResources.map((v) => [v.name, v.names]));
      const namesByGeneration = new Map(generationResources.map((g) => [g.name, g.names]));

      const displayNameFor = (vg: PokeApiVersionGroupDetail, stripPrefix: boolean): string => {
        const localizedVersionNames = vg.versions.map((v) => {
          const names = namesByVersion.get(v.name) ?? [];
          const localized = resolveLocalizedName(names, languageCode, (n) => n.name) ?? v.name;
          return stripPrefix ? stripBaseVersionPrefix(localized) : localized;
        });
        return [...new Set(localizedVersionNames)].join('/');
      };

      const generationFor = (vg: PokeApiVersionGroupDetail): Generation => {
        const names = namesByGeneration.get(vg.generation.name) ?? [];
        const label = resolveLocalizedName(names, languageCode, (n) => n.name) ?? vg.generation.name;
        return new Generation(vg.generation.name, label);
      };

      const baseVersionGroups = versionGroups.filter((vg) => !dlcMatchByVersionGroupName.has(vg.name));
      return baseVersionGroups.map((vg) => {
        const dlcs = versionGroups
          .filter((candidate) => dlcMatchByVersionGroupName.get(candidate.name)?.parentVersionGroupName === vg.name)
          .map((dlcVg) => new GameDlc(dlcVg.name, displayNameFor(dlcVg, true)));
        return new Game(vg.name, displayNameFor(vg, false), generationFor(vg), dlcs);
      });
    } catch (error) {
      return logAndRethrow(
        this.logging,
        'PokeApiGameCatalogRepositoryService',
        error,
        () => new GameCatalogUnavailable(),
      );
    }
  }
}
