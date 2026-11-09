import { Injectable, effect, inject, signal, untracked } from '@angular/core';

import type { Game } from '../../game/domain/entities/game';
import type { PokedexEntry } from '../../pokemon/domain/entities/pokedex-entry';
import { getPokedexIndex } from '../application/get-pokedex-index';
import { PokedexView } from '../domain/value-objects/pokedex-view';
import { PokedexFilterCriteria } from '../domain/value-objects/pokedex-filter-criteria';
import type { PokedexIndexEntry } from '../domain/value-objects/pokedex-index-entry';
import { PokeApiPokedexIndexRepositoryService } from './pokeapi-pokedex-index-repository.service';
import { GAME_SELECTION_READER } from '../../shared/tokens/game-selection-reader.token';
import { ACTIVE_LANGUAGE_READER } from '../../shared/tokens/active-language-reader.token';
import { POKEMON_REPOSITORY } from '../../shared/tokens/pokemon-repository.token';
import type { PokedexDetailsReader } from '../domain/ports/pokedex-details-reader';

export type PokedexLoadStatus = 'idle' | 'loading' | 'ready' | 'error';

/** Tamaño de lote de resolución de detalle — 10-20 por FR-012/FR-013
 *  (spec.md Assumptions de `018`); el valor exacto dentro de ese rango es
 *  un detalle de implementación. */
const BATCH_SIZE = 15;

/**
 * Expone la API de aplicación `PokedexStore` (contracts/pokedex.md,
 * extendido por contracts/pokedex-pagination.md de `018`) como signals —
 * reemplaza la parte de navegación/filtrado de Pokédex de
 * `TeamBuilderCubit`. Reacciona al juego/DLC activos del módulo `game`
 * (vía {@link GameSelectionReader}) recargando el índice; sin ningún
 * almacenamiento (FR-015). Implementa {@link PokedexDetailsReader}, el
 * puerto cruzado que `team` consulta para mostrar el detalle de un
 * Pokémon ya agregado al equipo.
 *
 * El índice (barato, `PokedexIndexRepository`) sigue cargando completo de
 * una — el costo real está en resolver el detalle (`PokemonRepository`)
 * de cada especie, así que eso es lo que se pagina (FR-012/FR-013): solo
 * el primer lote se resuelve al cargar, y {@link loadNextBatch} resuelve
 * el resto bajo demanda (scroll infinito, ver `PokedexBrowserComponent`).
 * Sigue siendo una única instancia singleton con un único índice/detalle
 * fusionado (main + DLC activos) — las secciones DLC del Pokédex son un
 * agrupamiento de presentación sobre este mismo estado, no instancias
 * separadas (research.md Decisión 7 de `018`, revisada tras hallazgo C1
 * de `/speckit-analyze`: evita romper este mismo `detailsFor` como fuente
 * única de verdad para `team`).
 */
@Injectable({ providedIn: 'root' })
export class InMemoryPokedexService implements PokedexDetailsReader {
  private readonly indexRepository = inject(PokeApiPokedexIndexRepositoryService);
  private readonly pokemonRepository = inject(POKEMON_REPOSITORY);
  private readonly gameSelectionReader = inject(GAME_SELECTION_READER);
  private readonly activeLanguageReader = inject(ACTIVE_LANGUAGE_READER);

  private readonly statusSignal = signal<PokedexLoadStatus>('idle');
  private readonly useNationalDexSignal = signal(false);
  private readonly filterCriteriaSignal = signal(new PokedexFilterCriteria());
  private readonly pokedexIndexSignal = signal<readonly PokedexIndexEntry[]>([]);
  private readonly pokedexDetailsByIdSignal = signal<ReadonlyMap<string, PokedexEntry>>(new Map());
  private readonly hasMoreBatchesSignal = signal(false);
  private readonly isLoadingBatchSignal = signal(false);
  private readonly batchErrorSignal = signal(false);

  /** El juego/vista con los que se pidió el índice actual — usado por
   *  {@link loadNextBatch} para pedir detalle consistente con ese índice,
   *  sin releer `pokedexView` (que podría haber cambiado ya, disparando
   *  un `load()` nuevo por `onSelectionChanged`). */
  private activeGameForIndex: Game | null = null;
  private activeViewForIndex = new PokedexView();
  private draining = false;

  readonly status = this.statusSignal.asReadonly();
  /** Estado del toggle de Pokédex nacional — por JUEGO (spec `019`): se
   *  resetea a `false` cada vez que cambia el juego activo (`load()`),
   *  nunca persiste de un juego a otro. Expuesto para que
   *  `PokedexBrowserComponent` refleje el estado real en el toggle en vez
   *  de un valor fijo (bug `019`: el toggle nunca se podía apagar porque
   *  la plantilla lo ataba a `false` en vez de a este signal). */
  readonly useNationalDex = this.useNationalDexSignal.asReadonly();
  readonly filterCriteria = this.filterCriteriaSignal.asReadonly();
  readonly pokedexIndex = this.pokedexIndexSignal.asReadonly();
  readonly pokedexDetailsById = this.pokedexDetailsByIdSignal.asReadonly();
  readonly hasMoreBatches = this.hasMoreBatchesSignal.asReadonly();
  readonly isLoadingBatch = this.isLoadingBatchSignal.asReadonly();
  readonly batchError = this.batchErrorSignal.asReadonly();

  get pokedexView(): PokedexView {
    return new PokedexView(this.useNationalDexSignal(), this.gameSelectionReader.currentActiveDlcIds());
  }

  constructor() {
    this.gameSelectionReader.onSelectionChanged().subscribe(() => void this.load());
    this.activeLanguageReader.onLanguageChanged().subscribe(() => void this.load());
    if (this.gameSelectionReader.currentGame()) {
      void this.load();
    }
    // FR-013a: mientras haya un filtro activo, agota los lotes restantes
    // en segundo plano — un filtro nunca debe limitarse a lo ya cargado
    // en pantalla (spec.md Edge Cases de `018`).
    effect(() => {
      const criteria = this.filterCriteriaSignal();
      if (!criteria.isEmpty) {
        untracked(() => void this.drainBatches());
      }
    });
  }

  /** Recarga el índice para el juego activo. No-op si todavía no hay
   *  ningún juego elegido.
   *
   *  Solo limpia el detalle ya resuelto cuando el JUEGO cambió — si lo
   *  que cambió fue solo la vista (Pokédex nacional/DLC, mismo juego,
   *  `toggleNationalDex`/`gameSelectionReader.toggleDlc`), el detalle ya
   *  resuelto se conserva y solo se piden las especies nuevas que la
   *  vista agrega (spec `019`): antes, limpiar el mapa entero acá hacía
   *  que `detailsFor(...)` — la fuente de `team` para el sprite/tipos de
   *  cada Pokémon del equipo — devolviera `null` momentáneamente para
   *  todo el roster, pareciendo que "se recargaba todo" cuando el equipo
   *  ni se tocó. */
  async load(): Promise<void> {
    const game = this.gameSelectionReader.currentGame();
    if (!game) {
      return;
    }
    const isSameGame = this.activeGameForIndex?.id === game.id;
    this.statusSignal.set('loading');
    if (!isSameGame) {
      this.pokedexDetailsByIdSignal.set(new Map());
      // FR-004 (`019`): la Pokédex nacional es un estado POR JUEGO — un
      // juego nuevo siempre arranca en la vista regional, nunca hereda
      // el toggle del juego anterior.
      this.useNationalDexSignal.set(false);
    }
    this.batchErrorSignal.set(false);
    try {
      const view = this.pokedexView;
      const index = await getPokedexIndex(this.indexRepository, game, view);
      this.pokedexIndexSignal.set(index);
      this.activeGameForIndex = game;
      this.activeViewForIndex = view;
      const resolved = this.pokedexDetailsByIdSignal();
      this.hasMoreBatchesSignal.set(index.some((entry) => !resolved.has(entry.pokemonId)));
      this.statusSignal.set('ready');
      await this.loadNextBatch();
    } catch {
      this.statusSignal.set('error');
    }
  }

  /** FR-009: aplica un nuevo criterio de búsqueda/filtro — cliente, sin
   *  nueva llamada HTTP (más allá de la resolución a completitud que
   *  dispara mientras el filtro esté activo, ver constructor). */
  updateFilterCriteria(criteria: PokedexFilterCriteria): void {
    this.filterCriteriaSignal.set(criteria);
  }

  /** FR-004/FR-017: alterna la vista al Pokédex nacional (ignorado por el
   *  repositorio si el juego activo no es elegible). */
  toggleNationalDex(useNationalDex: boolean): void {
    this.useNationalDexSignal.set(useNationalDex);
    void this.load();
  }

  detailsFor(pokemonId: string): PokedexEntry | null {
    return this.pokedexDetailsByIdSignal().get(pokemonId) ?? null;
  }

  /** FR-013: resuelve el siguiente lote de 10-20 ids aún no resueltos, en
   *  orden del índice, y lo fusiona con lo ya resuelto. No-op si ya hay un
   *  lote en curso o si no queda nada por resolver. Un fallo puntual deja
   *  `batchError` en `true` sin perder lo ya resuelto (contracts/
   *  pokedex-pagination.md). */
  async loadNextBatch(): Promise<void> {
    if (this.isLoadingBatchSignal() || !this.hasMoreBatchesSignal()) {
      return;
    }
    const game = this.activeGameForIndex;
    if (!game) {
      return;
    }
    const resolved = this.pokedexDetailsByIdSignal();
    const nextIds = this.pokedexIndexSignal()
      .map((entry) => entry.pokemonId)
      .filter((id) => !resolved.has(id))
      .slice(0, BATCH_SIZE);
    if (nextIds.length === 0) {
      this.hasMoreBatchesSignal.set(false);
      return;
    }
    this.isLoadingBatchSignal.set(true);
    try {
      const details = await this.pokemonRepository.fetchPokedexDetails(
        game,
        this.activeViewForIndex,
        nextIds,
        this.activeLanguageReader.currentLanguageCode(),
      );
      const merged = new Map(this.pokedexDetailsByIdSignal());
      for (const entry of details) {
        merged.set(entry.pokemonId, entry);
      }
      this.pokedexDetailsByIdSignal.set(merged);
      this.batchErrorSignal.set(false);
      const stillUnresolved = this.pokedexIndexSignal().some((entry) => !merged.has(entry.pokemonId));
      this.hasMoreBatchesSignal.set(stillUnresolved);
    } catch {
      // Un lote fallido no debe perder lo ya resuelto (spec.md Edge
      // Cases) — la presentación ofrece reintentar vía `retryBatch`.
      this.batchErrorSignal.set(true);
    } finally {
      this.isLoadingBatchSignal.set(false);
    }
  }

  /** Reintenta el lote que falló — es el mismo lote que `loadNextBatch`
   *  volvería a pedir, ya que no se marcó como resuelto. */
  async retryBatch(): Promise<void> {
    this.batchErrorSignal.set(false);
    await this.loadNextBatch();
  }

  private async drainBatches(): Promise<void> {
    if (this.draining) {
      return;
    }
    this.draining = true;
    try {
      while (this.hasMoreBatchesSignal() && !this.batchErrorSignal()) {
        await this.loadNextBatch();
        // 019: cede el hilo principal entre lotes — un Pokédex grande
        // (Pokédex nacional, ~1000 especies) agota decenas de lotes
        // seguidos; sin este respiro, el drenado monopoliza el hilo
        // principal el tiempo suficiente como para que la app deje de
        // responder a la interacción del usuario (p. ej. escribir en el
        // buscador) hasta que termina todo el drenado.
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    } finally {
      this.draining = false;
    }
  }
}
