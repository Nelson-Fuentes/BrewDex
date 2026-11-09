import { Injectable, inject, signal } from '@angular/core';
import { Subject, type Observable } from 'rxjs';

import type { Game } from '../domain/entities/game';
import { getGameCatalog } from '../application/get-game-catalog';
import { selectGame } from '../application/select-game';
import type { GameSelectionReader } from '../domain/ports/game-selection-reader';
import { PokeApiGameCatalogRepositoryService } from './pokeapi-game-catalog-repository.service';
import { ACTIVE_LANGUAGE_READER } from '../../shared/tokens/active-language-reader.token';

export type GameCatalogLoadStatus = 'loading' | 'ready' | 'error';

/**
 * Expone la API de aplicación `GameStore` (contracts/game-catalog.md)
 * como signals — el reemplazo de `GameSelectionCubit` — e implementa
 * {@link GameSelectionReader}, el puerto cruzado que `pokedex`/`team`
 * consumen para saber el juego/DLC activos sin ver el resto de esta
 * clase. Sin ningún almacenamiento (FR-015): `activeGame`/`activeDlcIds`
 * arrancan siempre vacíos y se pierden al recargar la app.
 */
@Injectable({ providedIn: 'root' })
export class InMemoryGameService implements GameSelectionReader {
  private readonly repository = inject(PokeApiGameCatalogRepositoryService);
  private readonly activeLanguageReader = inject(ACTIVE_LANGUAGE_READER);

  private readonly statusSignal = signal<GameCatalogLoadStatus>('loading');
  private readonly catalogSignal = signal<readonly Game[]>([]);
  private readonly activeGameSignal = signal<Game | null>(null);
  private readonly activeDlcIdsSignal = signal<ReadonlySet<string>>(new Set());
  private readonly selectionChanged = new Subject<void>();

  readonly status = this.statusSignal.asReadonly();
  readonly catalog = this.catalogSignal.asReadonly();
  readonly activeGame = this.activeGameSignal.asReadonly();
  readonly activeDlcIds = this.activeDlcIdsSignal.asReadonly();

  constructor() {
    void this.load();
    // El catálogo se re-carga si cambia el idioma activo (los nombres de
    // juego/generación dependen del idioma) — data-model.md, módulo `game`.
    this.activeLanguageReader.onLanguageChanged().subscribe(() => void this.load());
  }

  /** Carga (o recarga, p. ej. tras un fallo — FR-017) el catálogo. */
  async load(): Promise<void> {
    this.statusSignal.set('loading');
    try {
      const games = await getGameCatalog(this.repository, this.activeLanguageReader.currentLanguageCode());
      this.catalogSignal.set(games);
      this.statusSignal.set('ready');
    } catch {
      this.statusSignal.set('error');
    }
  }

  /** FR-007: la presentación es responsable de confirmar antes si hace
   *  falta (FR-016) — este método no vuelve a preguntar. */
  selectGame(game: Game): void {
    selectGame(game, (selected) => {
      this.activeGameSignal.set(selected);
      this.activeDlcIdsSignal.set(new Set());
      this.selectionChanged.next();
    });
  }

  /** FR-006: activa/desactiva un DLC del juego actualmente elegido. */
  toggleDlc(dlcId: string): void {
    this.activeDlcIdsSignal.update((current) => {
      const next = new Set(current);
      if (next.has(dlcId)) {
        next.delete(dlcId);
      } else {
        next.add(dlcId);
      }
      return next;
    });
    this.selectionChanged.next();
  }

  currentGame(): Game | null {
    return this.activeGameSignal();
  }

  currentActiveDlcIds(): ReadonlySet<string> {
    return this.activeDlcIdsSignal();
  }

  onSelectionChanged(): Observable<void> {
    return this.selectionChanged.asObservable();
  }
}
