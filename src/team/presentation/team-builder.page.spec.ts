import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { TeamBuilderPage } from './team-builder.page';
import { InMemoryTeamService } from '../infrastructure/in-memory-team.service';
import { POKEDEX_DETAILS_READER } from '../../shared/tokens/pokedex-details-reader.token';
import { InMemoryPokedexService } from '../../pokedex/infrastructure/in-memory-pokedex.service';
import { ViewportService } from '../../shared/design-system/viewport.service';
import { RosterEntry } from '../domain/value-objects/roster-entry';
import { PokedexEntry } from '../../pokemon/domain/entities/pokedex-entry';
import { SelectableForm } from '../../pokemon/domain/value-objects/selectable-form';
import { PokemonType } from '../../pokemon/domain/value-objects/pokemon-type';
import { PokemonStats } from '../../pokemon/domain/value-objects/pokemon-stats';
import { Generation } from '../../game/domain/value-objects/generation';
import { PokedexFilterCriteria } from '../../pokedex/domain/value-objects/pokedex-filter-criteria';
import { GAME_SELECTION_READER } from '../../shared/tokens/game-selection-reader.token';
import { Game } from '../../game/domain/entities/game';

const normal = new PokemonType('normal', 'Normal');
const stats = new PokemonStats(1, 1, 1, 1, 1, 1);
const form = new SelectableForm('rotom-heat', 'Heat Rotom', null, null, null, null, null, 'template', null, normal, null, stats);
const rotomEntry = new PokedexEntry(
  'rotom',
  'Rotom',
  1,
  null,
  null,
  null,
  null,
  null,
  -1,
  false,
  [form],
  null,
  null,
  [],
  normal,
  null,
  new Generation('generation-i', 'I'),
  { kind: 'regional' },
  stats,
);

describe('TeamBuilderPage', () => {
  function build() {
    TestBed.configureTestingModule({
      imports: [TeamBuilderPage, NoopAnimationsModule, TranslocoTestingModule.forRoot({ langs: { en: {} } })],
      providers: [
        {
          provide: InMemoryTeamService,
          useValue: {
            slots: () => [new RosterEntry('rotom'), null, null, null, null, null],
            rejection: () => null,
            movepoolBySlot: () => new Map(),
            selectForm: jasmine.createSpy('selectForm'),
            selectMove: jasmine.createSpy('selectMove'),
            removePokemonFromTeam: jasmine.createSpy('removePokemonFromTeam'),
            addPokemonToTeam: jasmine.createSpy('addPokemonToTeam'),
            loadMovepool: jasmine.createSpy('loadMovepool').and.resolveTo(undefined),
          },
        },
        { provide: POKEDEX_DETAILS_READER, useValue: { detailsFor: (id: string) => (id === 'rotom' ? rotomEntry : null) } },
        {
          provide: InMemoryPokedexService,
          useValue: {
            status: () => 'ready',
            filterCriteria: () => new PokedexFilterCriteria(),
      useNationalDex: () => false,
            pokedexIndex: () => [],
            pokedexDetailsById: () => new Map(),
            hasMoreBatches: () => false,
            isLoadingBatch: () => false,
            batchError: () => false,
            updateFilterCriteria: jasmine.createSpy(),
            toggleNationalDex: jasmine.createSpy(),
            loadNextBatch: jasmine.createSpy(),
            retryBatch: jasmine.createSpy(),
            load: jasmine.createSpy(),
          },
        },
        {
          provide: GAME_SELECTION_READER,
          useValue: {
            currentGame: () => new Game('red-blue', 'Red/Blue', new Generation('generation-i', 'I')),
            currentActiveDlcIds: () => new Set<string>(),
            toggleDlc: jasmine.createSpy('toggleDlc'),
            onSelectionChanged: () => ({ subscribe: () => undefined }),
          },
        },
        { provide: ViewportService, useValue: { screenSize: () => 'expanded' } },
      ],
    });
    return TestBed.createComponent(TeamBuilderPage);
  }

  it('al seleccionar un slot ocupado, muestra el selector de formas de ese Pokémon', () => {
    const fixture = build();
    fixture.detectChanges();

    fixture.componentInstance.onSlotSelect(0);
    fixture.detectChanges();

    expect(fixture.componentInstance['activeEntry']()?.pokemonId).toBe('rotom');
  });

  it('no hace nada al seleccionar un slot vacío', () => {
    const fixture = build();
    fixture.detectChanges();

    fixture.componentInstance.onSlotSelect(1); // slot vacío

    expect(fixture.componentInstance['activeSlotIndex']()).toBeNull();
  });

  it('muestra el nombre del juego activo (018, FR-014)', () => {
    const fixture = build();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Red/Blue');
  });

  it('el nombre del juego activo es realmente visible, no transparente (020, ronda 2)', () => {
    // El título de marca global (.app-brand-title, styles.scss) pinta su
    // texto con -webkit-text-fill-color: transparent (gradiente) — esa
    // propiedad se hereda, así que sin un color propio en `.app-game-badge`
    // el nombre del juego estaba presente en el DOM (test anterior) pero
    // invisible en pantalla (mismo color que el fondo).
    const fixture = build();
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('.app-game-badge') as HTMLElement;
    expect(badge).not.toBeNull();
    expect(badge.textContent).toContain('Red/Blue');
    const style = getComputedStyle(badge);
    expect(style.webkitTextFillColor).not.toBe('transparent');
    expect(style.color).not.toBe('transparent');

    document.body.removeChild(fixture.nativeElement);
  });

  it('organiza los slots en una grilla de 3 columnas x 2 filas (018, FR-016)', () => {
    const fixture = build();
    fixture.detectChanges();
    document.body.appendChild(fixture.nativeElement);

    const grid = fixture.nativeElement.querySelector('.app-team-slots') as HTMLElement;
    const style = getComputedStyle(grid);
    expect(style.display).toBe('grid');
    expect(style.gridTemplateColumns.split(' ').length).toBe(3);
    expect(style.gridTemplateRows.split(' ').length).toBe(2);

    document.body.removeChild(fixture.nativeElement);
  });

  it('al hacer click en un slot ocupado abre la tarjeta modal de detalle (018, FR-019)', () => {
    const fixture = build();
    fixture.detectChanges();

    fixture.componentInstance.onSlotSelect(0);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-pokemon-detail-modal')).not.toBeNull();
  });

  it('el shiny activado persiste al cerrar y reabrir el modal del mismo slot (018, FR-022a)', () => {
    let slot = new RosterEntry('rotom');
    TestBed.configureTestingModule({
      imports: [TeamBuilderPage, NoopAnimationsModule, TranslocoTestingModule.forRoot({ langs: { en: {} } })],
      providers: [
        {
          provide: InMemoryTeamService,
          useValue: {
            slots: () => [slot, null, null, null, null, null],
            rejection: () => null,
            movepoolBySlot: () => new Map(),
            selectForm: jasmine.createSpy('selectForm'),
            selectMove: jasmine.createSpy('selectMove'),
            removePokemonFromTeam: jasmine.createSpy('removePokemonFromTeam'),
            addPokemonToTeam: jasmine.createSpy('addPokemonToTeam'),
            loadMovepool: jasmine.createSpy('loadMovepool').and.resolveTo(undefined),
            toggleShiny: (index: number, active: boolean) => {
              slot = slot.copyWith({ isShiny: active });
            },
          },
        },
        { provide: POKEDEX_DETAILS_READER, useValue: { detailsFor: (id: string) => (id === 'rotom' ? rotomEntry : null) } },
        {
          provide: InMemoryPokedexService,
          useValue: {
            status: () => 'ready',
            filterCriteria: () => new PokedexFilterCriteria(),
      useNationalDex: () => false,
            pokedexIndex: () => [],
            pokedexDetailsById: () => new Map(),
            hasMoreBatches: () => false,
            isLoadingBatch: () => false,
            batchError: () => false,
            updateFilterCriteria: jasmine.createSpy(),
            toggleNationalDex: jasmine.createSpy(),
            loadNextBatch: jasmine.createSpy(),
            retryBatch: jasmine.createSpy(),
            load: jasmine.createSpy(),
          },
        },
        {
          provide: GAME_SELECTION_READER,
          useValue: {
            currentGame: () => new Game('red-blue', 'Red/Blue', new Generation('generation-i', 'I')),
            currentActiveDlcIds: () => new Set<string>(),
            toggleDlc: jasmine.createSpy('toggleDlc'),
            onSelectionChanged: () => ({ subscribe: () => undefined }),
          },
        },
        { provide: ViewportService, useValue: { screenSize: () => 'expanded' } },
      ],
    });
    const fixture = TestBed.createComponent(TeamBuilderPage);
    fixture.detectChanges();

    fixture.componentInstance.onSlotSelect(0);
    fixture.detectChanges();
    const modal = fixture.debugElement.query((de) => de.name === 'app-pokemon-detail-modal');
    modal.componentInstance.shinyChange.emit(true);
    fixture.detectChanges();

    // Cierra el modal (sin desactivar el toggle) y lo vuelve a abrir.
    fixture.componentInstance.onModalClose();
    fixture.detectChanges();
    fixture.componentInstance.onSlotSelect(0);
    fixture.detectChanges();

    const reopenedModal = fixture.debugElement.query((de) => de.name === 'app-pokemon-detail-modal');
    expect(reopenedModal.componentInstance.isShiny()).toBeTrue();
  });
});
