import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DoCheck,
  ElementRef,
  OnDestroy,
  computed,
  effect,
  inject,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslocoModule } from '@jsverse/transloco';

import type { PokedexEntry } from '../../pokemon/domain/entities/pokedex-entry';
import type { Generation } from '../../game/domain/value-objects/generation';
import { InMemoryPokedexService } from '../infrastructure/in-memory-pokedex.service';
import { filterPokedexEntries } from '../application/filter-pokedex-entries';
import { PokedexSearchBarComponent } from './pokedex-search-bar.component';
import { PokedexTypeFilterComponent } from './pokedex-type-filter.component';
import { PokedexGenerationFilterComponent } from './pokedex-generation-filter.component';
import { NationalDexToggleComponent } from './national-dex-toggle.component';
import { PokedexEntryCardComponent } from './pokedex-entry-card.component';
import { GAME_SELECTION_READER } from '../../shared/tokens/game-selection-reader.token';
import { DlcToggleListComponent } from '../../game/presentation/dlc-toggle-list.component';
import type { GameDlc } from '../../game/domain/value-objects/game-dlc';

/** Una sección visual de la grilla (FR-009/FR-010/FR-011) — la principal
 *  (regional/nacional) o una por DLC activo, todas resueltas desde el
 *  mismo índice/detalle fusionado (research.md Decisión 7 de `018`). */
interface PokedexSection {
  readonly title: 'main' | string;
  readonly entries: readonly PokedexEntry[];
}

/**
 * Compone la navegación completa de la Pokédex activa — búsqueda, filtro
 * por tipo, toggle de Pokédex nacional, toggles de DLC (FR-009-FR-011,
 * `018`) y el grid paginado (FR-004, FR-008, FR-009, FR-012/FR-013 de
 * `018`) — como una única unidad que `team/presentation` puede componer
 * por proyección/import de presentación (Constitución Principio VI:
 * `team` nunca importa `pokedex/infrastructure` directamente, solo este
 * componente).
 */
@Component({
  selector: 'app-pokedex-browser',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslocoModule,
    PokedexSearchBarComponent,
    PokedexTypeFilterComponent,
    PokedexGenerationFilterComponent,
    NationalDexToggleComponent,
    PokedexEntryCardComponent,
    DlcToggleListComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (pokedexService.status()) {
      @case ('loading') {
        <div role="status" aria-live="polite"><mat-spinner diameter="40" /></div>
      }
      @case ('error') {
        <div role="status" aria-live="polite">
          <p>{{ 'common.errorTitle' | transloco }}</p>
          <button mat-stroked-button type="button" (click)="pokedexService.load()">
            {{ 'common.retry' | transloco }}
          </button>
        </div>
      }
      @default {
        <div class="app-pokedex-filters">
          <app-pokedex-search-bar
            [searchText]="pokedexService.filterCriteria().searchText"
            (searchTextChange)="updateSearchText($event)"
          />
          <app-pokedex-type-filter
            [types]="availableTypes()"
            [selectedTypeId]="pokedexService.filterCriteria().type?.id ?? null"
            (typeIdChange)="updateTypeFilter($event)"
          />
          <app-pokedex-generation-filter
            [generations]="availableGenerations()"
            [selectedGenerationId]="pokedexService.filterCriteria().generation?.id ?? null"
            (generationIdChange)="updateGenerationFilter($event)"
          />
          <app-national-dex-toggle
            [useNationalDex]="pokedexService.useNationalDex()"
            (useNationalDexChange)="pokedexService.toggleNationalDex($event)"
          />
        </div>

        @if (activeDlcs(); as dlcs) {
          @if (dlcs.length > 0) {
            <div class="app-pokedex-filters">
              <app-dlc-toggle-list [dlcs]="dlcs" [activeDlcIds]="activeDlcIds()" (toggleDlc)="toggleDlc($event)" />
            </div>
          }
        }

        @for (section of sections(); track section.title) {
          <section class="app-pokedex-section">
            <button
              type="button"
              class="app-pokedex-section__header"
              [attr.aria-expanded]="!isSectionCollapsed(section.title)"
              [attr.aria-label]="(isSectionCollapsed(section.title) ? 'pokedex.sectionToggleExpand' : 'pokedex.sectionToggleCollapse') | transloco"
              (click)="toggleSectionCollapsed(section.title)"
            >
              <mat-icon class="app-pokedex-section__chevron" [class.app-pokedex-section__chevron--collapsed]="isSectionCollapsed(section.title)">
                expand_more
              </mat-icon>
              <h2 class="app-pokedex-section__title">
                {{ section.title === 'main' ? ('pokedex.mainSectionTitle' | transloco) : dlcDisplayName(section.title) }}
              </h2>
              <span class="app-pokedex-section__count">{{ section.entries.length }}</span>
            </button>
            @if (!isSectionCollapsed(section.title)) {
              @if (section.entries.length === 0) {
                <p class="app-pokedex-no-results">{{ 'pokedex.noResults' | transloco }}</p>
              } @else {
                <div class="app-pokedex-grid">
                  @for (entry of section.entries; track entry.pokemonId) {
                    <app-pokedex-entry-card [entry]="entry" (add)="add.emit(entry)" />
                  }
                </div>
              }
            }
          </section>
        }

        @if (pokedexService.batchError()) {
          <div class="app-pokedex-batch-error" role="alert">
            <p>{{ 'common.errorBody' | transloco }}</p>
            <button mat-stroked-button type="button" (click)="pokedexService.retryBatch()">
              {{ 'common.retry' | transloco }}
            </button>
          </div>
        } @else if (pokedexService.hasMoreBatches()) {
          <div #sentinel class="app-pokedex-sentinel" aria-hidden="true">
            @if (pokedexService.isLoadingBatch()) {
              <mat-spinner diameter="24" />
            }
          </div>
        }
      }
    }
  `,
  styles: `
    .app-pokedex-filters {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      align-items: center;
    }
    .app-pokedex-section {
      margin-bottom: 0.5rem;
    }
    .app-pokedex-section__header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      width: 100%;
      padding: 0.6rem 1rem 0.4rem;
      border: none;
      background: none;
      cursor: pointer;
      text-align: left;
      color: inherit;
      border-radius: 8px;
      transition: background-color 0.15s ease;
    }
    .app-pokedex-section__header:hover {
      background: var(--mat-sys-surface-variant, rgba(0, 0, 0, 0.04));
    }
    .app-pokedex-section__chevron {
      transition: transform 0.2s ease;
    }
    .app-pokedex-section__chevron--collapsed {
      transform: rotate(-90deg);
    }
    .app-pokedex-section__title {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 800;
      letter-spacing: -0.01em;
    }
    .app-pokedex-section__count {
      font-size: 0.75rem;
      font-weight: 700;
      opacity: 0.7;
      padding: 0.15rem 0.5rem;
      border-radius: 999px;
      background: var(--mat-sys-surface-variant, #eeeeff);
      margin-left: auto;
    }
    .app-pokedex-no-results {
      padding: 1rem 1.5rem;
      margin: 0;
      opacity: 0.7;
      font-size: 0.85rem;
      font-style: italic;
    }
    .app-pokedex-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(78px, 1fr));
      gap: 0.5rem;
      padding: 0.5rem 1rem 1rem;
    }
    .app-pokedex-sentinel {
      display: flex;
      justify-content: center;
      padding: 1rem;
    }
    .app-pokedex-batch-error {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
    }
  `,
})
export class PokedexBrowserComponent implements AfterViewInit, DoCheck, OnDestroy {
  protected readonly pokedexService = inject(InMemoryPokedexService);
  private readonly gameSelectionReader = inject(GAME_SELECTION_READER);
  readonly add = output<PokedexEntry>();

  private readonly sentinelRef = viewChild<ElementRef<HTMLElement>>('sentinel');
  private observer: IntersectionObserver | null = null;

  constructor() {
    // 019: no depender solo de `ngAfterViewInit`/`IntersectionObserver`
    // para arrancar el drenado — `ngAfterViewInit` corre mientras
    // `status()` sigue en `'loading'` (el sentinel ni existe todavía), y
    // el observer solo dispara en transiciones de intersección. Este
    // efecto se re-evalúa cada vez que cambia el estado relevante
    // (p. ej. cuando `status` pasa a `'ready'` y el sentinel recién
    // aparece en el DOM), así que siempre termina intentando drenar en
    // cuanto hay algo que drenar — bug reportado: "solo carga 15 y no
    // llena la pantalla".
    effect(() => {
      this.pokedexService.status();
      this.pokedexService.hasMoreBatches();
      this.pokedexService.isLoadingBatch();
      this.pokedexService.batchError();
      this.pokedexService.pokedexDetailsById();
      // `queueMicrotask`: dentro del propio efecto, el `viewChild` del
      // sentinel puede seguir reflejando el render ANTERIOR (las
      // consultas de vista se refrescan en una fase distinta del mismo
      // ciclo) — diferir al siguiente microtask garantiza que el DOM/
      // `sentinelRef()` ya reflejen el estado que disparó este efecto.
      untracked(() => queueMicrotask(() => void this.drainWhileSentinelVisible()));
    });
  }

  protected readonly activeDlcs = computed<readonly GameDlc[]>(() => this.gameSelectionReader.currentGame()?.dlcs ?? []);
  protected readonly activeDlcIds = computed(() => this.gameSelectionReader.currentActiveDlcIds());

  protected readonly availableTypes = computed(() => {
    const byId = new Map<string, PokedexEntry['typePrimary']>();
    for (const entry of this.pokedexService.pokedexDetailsById().values()) {
      byId.set(entry.typePrimary.id, entry.typePrimary);
      if (entry.typeSecondary) {
        byId.set(entry.typeSecondary.id, entry.typeSecondary);
      }
    }
    return [...byId.values()];
  });

  /** Generaciones disponibles para filtrar (020) — derivadas de lo ya
   *  resuelto, igual que `availableTypes`. Una forma regional cuenta con
   *  la generación en que se introdujo (`introducedGeneration`), no la de
   *  su especie original. */
  protected readonly availableGenerations = computed(() => {
    const byId = new Map<string, Generation>();
    for (const entry of this.pokedexService.pokedexDetailsById().values()) {
      byId.set(entry.introducedGeneration.id, entry.introducedGeneration);
    }
    return [...byId.values()];
  });

  /** Estado de colapso por sección (020, "para agilizar") — sesión-local,
   *  por título de sección ('main' o el id de un DLC); ausente = expandida. */
  private readonly collapsedSectionTitles = signal<ReadonlySet<string>>(new Set());

  /** Solo lo ya resuelto (batches cargados hasta ahora), agrupado en
   *  secciones visuales por el `sourceTag` del ÍNDICE (no el del detalle
   *  compartido — spec `019`): la misma especie puede aparecer en más de
   *  una sección (regional Y un DLC a la vez, `pokeapi-pokedex-index-
   *  repository.service.ts`), compartiendo el mismo detalle resuelto
   *  (sprite/tipos/nombre) pero contada una vez por sección. El filtro
   *  de búsqueda/tipo se aplica por sección, sobre sus propias entradas
   *  (no sobre una lista aplanada), para que ambas Pokédex se filtren de
   *  forma independiente. Principal primero, luego una por DLC activo, en
   *  el orden que `DlcToggleListComponent` ya lista. */
  protected readonly sections = computed<PokedexSection[]>(() => {
    const detailsById = this.pokedexService.pokedexDetailsById();
    const criteria = this.pokedexService.filterCriteria();

    const mainEntries: PokedexEntry[] = [];
    const dlcEntriesById = new Map<string, PokedexEntry[]>();
    for (const indexEntry of this.pokedexService.pokedexIndex()) {
      const detail = detailsById.get(indexEntry.pokemonId);
      if (!detail) {
        continue;
      }
      if (indexEntry.sourceTag.kind === 'dlc') {
        const bucket = dlcEntriesById.get(indexEntry.sourceTag.dlcId) ?? [];
        bucket.push(detail);
        dlcEntriesById.set(indexEntry.sourceTag.dlcId, bucket);
      } else {
        mainEntries.push(detail);
      }
    }

    const activeDlcIds = this.activeDlcIds();
    const sections: PokedexSection[] = [{ title: 'main', entries: filterPokedexEntries(mainEntries, criteria, activeDlcIds) }];
    for (const dlc of this.activeDlcs()) {
      const entries = dlcEntriesById.get(dlc.id);
      if (entries && entries.length > 0) {
        sections.push({ title: dlc.id, entries: filterPokedexEntries(entries, criteria, activeDlcIds) });
      }
    }
    return sections;
  });

  protected updateSearchText(searchText: string): void {
    this.pokedexService.updateFilterCriteria(this.pokedexService.filterCriteria().withSearchText(searchText));
  }

  protected updateTypeFilter(typeId: string | null): void {
    const type = typeId ? (this.availableTypes().find((t) => t.id === typeId) ?? null) : null;
    this.pokedexService.updateFilterCriteria(this.pokedexService.filterCriteria().withType(type));
  }

  protected updateGenerationFilter(generationId: string | null): void {
    const generation = generationId ? (this.availableGenerations().find((g) => g.id === generationId) ?? null) : null;
    this.pokedexService.updateFilterCriteria(this.pokedexService.filterCriteria().withGeneration(generation));
  }

  protected isSectionCollapsed(title: string): boolean {
    return this.collapsedSectionTitles().has(title);
  }

  protected toggleSectionCollapsed(title: string): void {
    const current = new Set(this.collapsedSectionTitles());
    if (current.has(title)) {
      current.delete(title);
    } else {
      current.add(title);
    }
    this.collapsedSectionTitles.set(current);
  }

  protected toggleDlc(dlcId: string): void {
    this.gameSelectionReader.toggleDlc(dlcId);
  }

  protected dlcDisplayName(dlcId: string): string {
    return this.activeDlcs().find((dlc) => dlc.id === dlcId)?.displayName ?? dlcId;
  }

  private draining = false;

  ngAfterViewInit(): void {
    this.observer = new IntersectionObserver((observerEntries) => {
      if (observerEntries.some((observerEntry) => observerEntry.isIntersecting)) {
        void this.drainWhileSentinelVisible();
      }
    });
    this.observeSentinel();
    // FR-013 (019): si el panel ya es lo bastante alto para mostrar más
    // de un lote sin que el usuario haga scroll, el sentinel arranca
    // visible y el `IntersectionObserver` dispara una sola vez al
    // observar (nunca vuelve a cruzar el umbral si sigue visible) — sin
    // este chequeo inicial, la carga se detenía en el primer lote.
    void this.drainWhileSentinelVisible();
  }

  private observeSentinel(): void {
    const element = this.sentinelRef()?.nativeElement;
    if (element && this.observer) {
      this.observer.observe(element);
    }
  }

  /** Sigue pidiendo lotes mientras el sentinel siga realmente visible en
   *  pantalla — `IntersectionObserver` solo avisa de transiciones
   *  (invisible→visible), así que una pantalla grande donde el sentinel
   *  nunca deja de estar visible necesita este drenado explícito en vez
   *  de depender únicamente del callback del observer. */
  private async drainWhileSentinelVisible(): Promise<void> {
    if (this.draining) {
      return;
    }
    this.draining = true;
    try {
      while (this.pokedexService.hasMoreBatches() && !this.pokedexService.isLoadingBatch() && !this.pokedexService.batchError() && this.isSentinelVisible()) {
        await this.pokedexService.loadNextBatch();
        // 019: cede el hilo principal entre lotes — ver la misma nota en
        // `InMemoryPokedexService.drainBatches`.
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    } finally {
      this.draining = false;
    }
  }

  private isSentinelVisible(): boolean {
    const element = this.sentinelRef()?.nativeElement;
    if (!element) {
      return false;
    }
    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    return rect.top < viewportHeight && rect.bottom > 0;
  }

  ngDoCheck(): void {
    // El `@if` del sentinel entra/sale del DOM según `hasMoreBatches`/
    // `batchError` — re-observamos cada vez que el nodo cambia, ya que
    // `IntersectionObserver.observe` sobre el mismo elemento es un no-op.
    this.observeSentinel();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
