import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { InMemoryTeamService } from './in-memory-team.service';
import { GAME_SELECTION_READER } from '../../shared/tokens/game-selection-reader.token';
import { ACTIVE_LANGUAGE_READER } from '../../shared/tokens/active-language-reader.token';
import { MOVEPOOL_REPOSITORY } from '../../shared/tokens/movepool-repository.token';
import { POKEDEX_DETAILS_READER } from '../../shared/tokens/pokedex-details-reader.token';
import { MAX_TEAM_SIZE } from '../domain/value-objects/team-size';
import { PokedexEntry } from '../../pokemon/domain/entities/pokedex-entry';
import { PokemonType } from '../../pokemon/domain/value-objects/pokemon-type';
import { PokemonStats } from '../../pokemon/domain/value-objects/pokemon-stats';
import { SelectableForm } from '../../pokemon/domain/value-objects/selectable-form';
import { Move } from '../../pokemon/domain/value-objects/move';
import { Generation } from '../../game/domain/value-objects/generation';
import { Game } from '../../game/domain/entities/game';

const generation = new Generation('generation-i', 'I');
const normal = new PokemonType('normal', 'Normal');
const stats = new PokemonStats(1, 1, 1, 1, 1, 1);

function pokedexEntryFor(id: string, defaultVarietyId?: string): PokedexEntry {
  return new PokedexEntry(
    id,
    id,
    1,
    null,
    null,
    null,
    null,
    null,
    -1,
    false,
    [],
    null,
    null,
    [],
    normal,
    null,
    generation,
    { kind: 'regional' },
    stats,
    defaultVarietyId,
  );
}

/** Por defecto `detailsFor` resuelve `defaultVarietyId === pokemonId` (el
 *  caso común) — las pruebas de la variedad regional principal (`021`,
 *  corrección post-release) sobreescriben esto con su propio detalle. */
function fakePokedexDetailsReader(details: (id: string) => PokedexEntry | null = (id) => pokedexEntryFor(id)) {
  return { detailsFor: details };
}

describe('InMemoryTeamService', () => {
  function setup(initialGame: Game | null = new Game('red-blue', 'Red/Blue', generation)) {
    const selectionChanged = new Subject<void>();
    let currentGame = initialGame;
    TestBed.configureTestingModule({
      providers: [
        InMemoryTeamService,
        {
          provide: GAME_SELECTION_READER,
          useValue: {
            currentGame: () => currentGame,
            currentActiveDlcIds: () => new Set<string>(),
            onSelectionChanged: () => selectionChanged.asObservable(),
          },
        },
        { provide: ACTIVE_LANGUAGE_READER, useValue: { currentLanguageCode: () => 'en' } },
        {
          provide: MOVEPOOL_REPOSITORY,
          useValue: {
            fetchDefaultMoveset: () => Promise.resolve([]),
            fetchMovepool: () => Promise.resolve([]),
          },
        },
        { provide: POKEDEX_DETAILS_READER, useValue: fakePokedexDetailsReader() },
      ],
    });
    return {
      service: TestBed.inject(InMemoryTeamService),
      selectionChanged,
      setGame: (game: Game | null) => (currentGame = game),
    };
  }

  it('arranca con MAX_TEAM_SIZE slots vacíos', () => {
    const { service } = setup();
    expect(service.slots().length).toBe(MAX_TEAM_SIZE);
    expect(service.slots().every((s) => s === null)).toBeTrue();
  });

  it('addPokemonToTeam ocupa el primer slot vacío', () => {
    const { service } = setup();
    service.addPokemonToTeam(pokedexEntryFor('bulbasaur'));
    expect(service.slots()[0]?.pokemonId).toBe('bulbasaur');
    expect(service.rejection()).toBeNull();
  });

  it('rechaza agregar un 7º Pokémon y expone el motivo (FR-011)', () => {
    const { service } = setup();
    for (let i = 0; i < MAX_TEAM_SIZE; i++) {
      service.addPokemonToTeam(pokedexEntryFor(`mon-${i}`));
    }
    service.addPokemonToTeam(pokedexEntryFor('extra'));

    expect(service.rejection()).toBe('team-full');
    expect(service.slots().some((s) => s?.pokemonId === 'extra')).toBeFalse();
  });

  it('removePokemonFromTeam vacía el slot', () => {
    const { service } = setup();
    service.addPokemonToTeam(pokedexEntryFor('bulbasaur'));
    service.removePokemonFromTeam(0);
    expect(service.slots()[0]).toBeNull();
  });

  it('selectForm actualiza formVarietyId del slot', () => {
    const { service } = setup();
    service.addPokemonToTeam(pokedexEntryFor('rotom'));
    const form = new SelectableForm('rotom-heat', 'Heat Rotom', null, null, null, null, null, 'template', null, normal, null, stats);

    service.selectForm(0, form);

    expect(service.slots()[0]?.formVarietyId).toBe('rotom-heat');
  });

  it('selectForm vacía automáticamente un movimiento que la nueva forma no aprende (021, FR-020)', async () => {
    const fetchMovepool = jasmine
      .createSpy('fetchMovepool')
      .and.callFake((varietyId: string) =>
        Promise.resolve(
          varietyId === 'rotom-heat'
            ? [{ move: { id: 'overheat' }, methods: ['level'], levelLearnedAt: 1 }]
            : [{ move: { id: 'thundershock' }, methods: ['level'], levelLearnedAt: 1 }, { move: { id: 'overheat' }, methods: ['level'], levelLearnedAt: 1 }],
        ),
      );
    TestBed.configureTestingModule({
      providers: [
        InMemoryTeamService,
        {
          provide: GAME_SELECTION_READER,
          useValue: {
            currentGame: () => new Game('sword-shield', 'Sword/Shield', new Generation('generation-viii', 'VIII')),
            currentActiveDlcIds: () => new Set<string>(),
            onSelectionChanged: () => new Subject<void>().asObservable(),
          },
        },
        { provide: ACTIVE_LANGUAGE_READER, useValue: { currentLanguageCode: () => 'en' } },
        { provide: MOVEPOOL_REPOSITORY, useValue: { fetchDefaultMoveset: () => Promise.resolve([]), fetchMovepool } },
        { provide: POKEDEX_DETAILS_READER, useValue: fakePokedexDetailsReader() },
      ],
    });
    const service = TestBed.inject(InMemoryTeamService);
    service.addPokemonToTeam(pokedexEntryFor('rotom'));
    // Deja resolver primero el moveset por defecto (async, fetchDefaultMoveset
    // -> []) antes de asignar movimientos a mano, o la asignación por
    // defecto pisaría estas asignaciones al resolver después.
    await Promise.resolve();
    await Promise.resolve();
    service.selectMove(0, 0, new Move('thundershock', 'Thundershock', normal, 'special', 30, 40, '...'));
    service.selectMove(0, 1, new Move('overheat', 'Overheat', normal, 'special', 5, 130, '...'));

    const form = new SelectableForm('rotom-heat', 'Heat Rotom', null, null, null, null, null, 'template', null, normal, null, stats);
    service.selectForm(0, form);
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(service.slots()[0]?.moveIds[0]).toBeNull(); // thundershock ya no está en la forma Heat
    expect(service.slots()[0]?.moveIds[1]).toBe('overheat'); // overheat sigue disponible
  });

  it('selectForm no vacía nada si el movepool de la nueva forma falla al resolverse (021, FR-020)', async () => {
    TestBed.configureTestingModule({
      providers: [
        InMemoryTeamService,
        {
          provide: GAME_SELECTION_READER,
          useValue: {
            currentGame: () => new Game('sword-shield', 'Sword/Shield', new Generation('generation-viii', 'VIII')),
            currentActiveDlcIds: () => new Set<string>(),
            onSelectionChanged: () => new Subject<void>().asObservable(),
          },
        },
        { provide: ACTIVE_LANGUAGE_READER, useValue: { currentLanguageCode: () => 'en' } },
        {
          provide: MOVEPOOL_REPOSITORY,
          useValue: { fetchDefaultMoveset: () => Promise.resolve([]), fetchMovepool: () => Promise.reject(new Error('network')) },
        },
        { provide: POKEDEX_DETAILS_READER, useValue: fakePokedexDetailsReader() },
      ],
    });
    const service = TestBed.inject(InMemoryTeamService);
    service.addPokemonToTeam(pokedexEntryFor('rotom'));
    await Promise.resolve();
    await Promise.resolve();
    service.selectMove(0, 0, new Move('thundershock', 'Thundershock', normal, 'special', 30, 40, '...'));

    const form = new SelectableForm('rotom-heat', 'Heat Rotom', null, null, null, null, null, 'template', null, normal, null, stats);
    service.selectForm(0, form);
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(service.slots()[0]?.formVarietyId).toBe('rotom-heat'); // el cambio de forma se aplicó igual
    expect(service.slots()[0]?.moveIds[0]).toBe('thundershock'); // no se vació a ciegas
  });

  it('selectBaseForm vacía un movimiento exclusivo de la forma alterna al volver a la forma base (021, FR-020)', async () => {
    const fetchMovepool = jasmine
      .createSpy('fetchMovepool')
      .and.callFake((varietyId: string) =>
        Promise.resolve(
          varietyId === 'rotom'
            ? [{ move: { id: 'thundershock' }, methods: ['level'], levelLearnedAt: 1 }]
            : [{ move: { id: 'thundershock' }, methods: ['level'], levelLearnedAt: 1 }, { move: { id: 'overheat' }, methods: ['level'], levelLearnedAt: 1 }],
        ),
      );
    TestBed.configureTestingModule({
      providers: [
        InMemoryTeamService,
        {
          provide: GAME_SELECTION_READER,
          useValue: {
            currentGame: () => new Game('sword-shield', 'Sword/Shield', new Generation('generation-viii', 'VIII')),
            currentActiveDlcIds: () => new Set<string>(),
            onSelectionChanged: () => new Subject<void>().asObservable(),
          },
        },
        { provide: ACTIVE_LANGUAGE_READER, useValue: { currentLanguageCode: () => 'en' } },
        { provide: MOVEPOOL_REPOSITORY, useValue: { fetchDefaultMoveset: () => Promise.resolve([]), fetchMovepool } },
        { provide: POKEDEX_DETAILS_READER, useValue: fakePokedexDetailsReader() },
      ],
    });
    const service = TestBed.inject(InMemoryTeamService);
    service.addPokemonToTeam(pokedexEntryFor('rotom'));
    const form = new SelectableForm('rotom-heat', 'Heat Rotom', null, null, null, null, null, 'template', null, normal, null, stats);
    service.selectForm(0, form);
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    service.selectMove(0, 0, new Move('overheat', 'Overheat', normal, 'special', 5, 130, '...'));

    service.selectBaseForm(0);
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(service.slots()[0]?.moveIds[0]).toBeNull(); // overheat era exclusivo de la forma Heat
  });

  it('selectBaseForm limpia formVarietyId a null (020, FR-005)', () => {
    const { service } = setup();
    service.addPokemonToTeam(pokedexEntryFor('rotom'));
    const form = new SelectableForm('rotom-heat', 'Heat Rotom', null, null, null, null, null, 'template', null, normal, null, stats);
    service.selectForm(0, form);
    expect(service.slots()[0]?.formVarietyId).toBe('rotom-heat');

    service.selectBaseForm(0);

    expect(service.slots()[0]?.formVarietyId).toBeNull();
  });

  it('selectBaseForm no hace nada sobre un slot vacío', () => {
    const { service } = setup();

    expect(() => service.selectBaseForm(0)).not.toThrow();
    expect(service.slots()[0]).toBeNull();
  });

  it('selectBaseForm es independiente por slot (020, FR-012)', () => {
    const { service } = setup();
    service.addPokemonToTeam(pokedexEntryFor('rotom'));
    service.addPokemonToTeam(pokedexEntryFor('urshifu'));
    const form = new SelectableForm('rotom-heat', 'Heat Rotom', null, null, null, null, null, 'template', null, normal, null, stats);
    service.selectForm(0, form);
    const otherForm = new SelectableForm('urshifu-rapid', 'Rapid Strike', null, null, null, null, null, 'template', null, normal, null, stats);
    service.selectForm(1, otherForm);

    service.selectBaseForm(0);

    expect(service.slots()[0]?.formVarietyId).toBeNull();
    expect(service.slots()[1]?.formVarietyId).toBe('urshifu-rapid');
  });

  it('selectMove asigna un movimiento a la posición pedida (FR-014)', () => {
    const { service } = setup();
    service.addPokemonToTeam(pokedexEntryFor('pikachu'));
    const thunderbolt = new Move('thunderbolt', 'Thunderbolt', normal, 'special', 15, 90, '...');

    service.selectMove(0, 1, thunderbolt);

    expect(service.slots()[0]?.moveIds[1]).toBe('thunderbolt');
  });

  it('selectMove ya NO auto-intercambia un movimiento ya asignado a otra posición (021, FR-016/FR-017 — reemplaza el comportamiento de 011)', () => {
    const { service } = setup();
    service.addPokemonToTeam(pokedexEntryFor('pikachu'));
    const thunderbolt = new Move('thunderbolt', 'Thunderbolt', normal, 'special', 15, 90, '...');
    service.selectMove(0, 0, thunderbolt);

    // Asignación defensiva "fuera del flujo normal de UI" (la UI nunca
    // deja click-able una opción ya asignada — contracts/duplicate-move-block.md).
    service.selectMove(0, 1, thunderbolt);

    const moveIds = service.slots()[0]?.moveIds;
    expect(moveIds?.[0]).toBe('thunderbolt'); // la posición original NO se vacía
    expect(moveIds?.[1]).toBeNull(); // la asignación entrante duplicada se ignora
  });

  it('toggleShiny activa/desactiva la forma shiny de un slot (018, FR-021/FR-022)', () => {
    const { service } = setup();
    service.addPokemonToTeam(pokedexEntryFor('charizard'));

    service.toggleShiny(0, true);
    expect(service.slots()[0]?.isShiny).toBeTrue();

    service.toggleShiny(0, false);
    expect(service.slots()[0]?.isShiny).toBeFalse();
  });

  it('toggleShiny no hace nada sobre un slot vacío', () => {
    const { service } = setup();

    expect(() => service.toggleShiny(0, true)).not.toThrow();
    expect(service.slots()[0]).toBeNull();
  });

  it('el estado shiny persiste ante otras actualizaciones del mismo slot (018, FR-022a)', () => {
    const { service } = setup();
    service.addPokemonToTeam(pokedexEntryFor('charizard'));
    service.toggleShiny(0, true);

    service.selectMove(0, 0, null);

    expect(service.slots()[0]?.isShiny).toBeTrue();
  });

  it('toggleGender fija el género del slot y persiste ante otras actualizaciones (019, FR-007)', () => {
    const { service } = setup();
    service.addPokemonToTeam(pokedexEntryFor('pikachu'));

    service.toggleGender(0, 'female');
    expect(service.slots()[0]?.gender).toBe('female');

    service.toggleGender(0, 'male');
    expect(service.slots()[0]?.gender).toBe('male');

    service.selectMove(0, 0, null);
    expect(service.slots()[0]?.gender).toBe('male');
  });

  it('toggleGender no hace nada sobre un slot vacío', () => {
    const { service } = setup();

    expect(() => service.toggleGender(0, 'female')).not.toThrow();
    expect(service.slots()[0]).toBeNull();
  });

  it('toggleGender es independiente por slot (019, FR-014)', () => {
    const { service } = setup();
    service.addPokemonToTeam(pokedexEntryFor('pikachu'));
    service.addPokemonToTeam(pokedexEntryFor('eevee'));

    service.toggleGender(0, 'female');

    expect(service.slots()[0]?.gender).toBe('female');
    expect(service.slots()[1]?.gender).toBeNull();
  });

  it('toggleMega y toggleGigamax son mutuamente excluyentes', () => {
    const { service } = setup();
    service.addPokemonToTeam(pokedexEntryFor('charizard'));

    service.toggleGigamax(0, true);
    expect(service.slots()[0]?.gigamaxActive).toBeTrue();

    service.toggleMega(0, true);
    expect(service.slots()[0]?.megaActive).toBeTrue();
    expect(service.slots()[0]?.gigamaxActive).toBeFalse();
  });

  it('vacía el roster cuando cambia el JUEGO (no un simple toggle de DLC) — FR-016', () => {
    const redBlue = new Game('red-blue', 'Red/Blue', generation);
    const { service, selectionChanged, setGame } = setup(redBlue);
    service.addPokemonToTeam(pokedexEntryFor('bulbasaur'));

    // Mismo juego (p. ej. solo cambió un DLC) -> no se vacía.
    selectionChanged.next();
    expect(service.slots()[0]?.pokemonId).toBe('bulbasaur');

    // Cambia el juego -> se vacía.
    setGame(new Game('sword-shield', 'Sword/Shield', new Generation('generation-viii', 'VIII')));
    selectionChanged.next();
    expect(service.slots().every((s) => s === null)).toBeTrue();
  });

  it('aplica el moveset por defecto de forma asíncrona al agregar (FR-014)', async () => {
    TestBed.configureTestingModule({
      providers: [
        InMemoryTeamService,
        {
          provide: GAME_SELECTION_READER,
          useValue: {
            currentGame: () => new Game('red-blue', 'Red/Blue', generation),
            currentActiveDlcIds: () => new Set<string>(),
            onSelectionChanged: () => new Subject<void>().asObservable(),
          },
        },
        { provide: ACTIVE_LANGUAGE_READER, useValue: { currentLanguageCode: () => 'en' } },
        {
          provide: MOVEPOOL_REPOSITORY,
          useValue: {
            fetchDefaultMoveset: () => Promise.resolve([new Move('tackle', 'Tackle', normal, 'physical', 35, 40, '...')]),
            fetchMovepool: () => Promise.resolve([]),
          },
        },
        { provide: POKEDEX_DETAILS_READER, useValue: fakePokedexDetailsReader() },
      ],
    });
    const service = TestBed.inject(InMemoryTeamService);

    service.addPokemonToTeam(pokedexEntryFor('bulbasaur'));
    await Promise.resolve();
    await Promise.resolve();

    expect(service.slots()[0]?.moveIds[0]).toBe('tackle');
  });

  it('usa defaultVarietyId (no pokemonId) para el moveset por defecto de una forma regional principal (021, corrección post-release — Ninetales de Alola en USUM)', async () => {
    const fetchDefaultMoveset = jasmine
      .createSpy('fetchDefaultMoveset')
      .and.callFake((varietyId: string) =>
        Promise.resolve(varietyId === 'ninetales-alola' ? [new Move('aurora-veil', 'Aurora Veil', normal, 'status', 20, null, '...')] : []),
      );
    TestBed.configureTestingModule({
      providers: [
        InMemoryTeamService,
        {
          provide: GAME_SELECTION_READER,
          useValue: {
            currentGame: () => new Game('ultra-sun-ultra-moon', 'Ultra Sun/Ultra Moon', new Generation('generation-vii', 'VII')),
            currentActiveDlcIds: () => new Set<string>(),
            onSelectionChanged: () => new Subject<void>().asObservable(),
          },
        },
        { provide: ACTIVE_LANGUAGE_READER, useValue: { currentLanguageCode: () => 'en' } },
        { provide: MOVEPOOL_REPOSITORY, useValue: { fetchDefaultMoveset, fetchMovepool: () => Promise.resolve([]) } },
        { provide: POKEDEX_DETAILS_READER, useValue: fakePokedexDetailsReader((id) => pokedexEntryFor(id, 'ninetales-alola')) },
      ],
    });
    const service = TestBed.inject(InMemoryTeamService);

    service.addPokemonToTeam(pokedexEntryFor('ninetales', 'ninetales-alola'));
    await Promise.resolve();
    await Promise.resolve();

    expect(fetchDefaultMoveset).toHaveBeenCalledWith('ninetales-alola', jasmine.anything(), 'en');
    expect(service.slots()[0]?.moveIds[0]).toBe('aurora-veil');
  });

  it('loadMovepool resuelve y guarda el movepool del slot', async () => {
    const { service } = setup();
    service.addPokemonToTeam(pokedexEntryFor('bulbasaur'));

    await service.loadMovepool(0);

    expect(service.movepoolBySlot().get(0)).toEqual([]);
  });

  it('loadMovepool usa defaultVarietyId (no pokemonId) cuando no hay forma elegida explícitamente (021, corrección post-release)', async () => {
    const fetchMovepool = jasmine.createSpy('fetchMovepool').and.resolveTo([]);
    TestBed.configureTestingModule({
      providers: [
        InMemoryTeamService,
        {
          provide: GAME_SELECTION_READER,
          useValue: {
            currentGame: () => new Game('ultra-sun-ultra-moon', 'Ultra Sun/Ultra Moon', new Generation('generation-vii', 'VII')),
            currentActiveDlcIds: () => new Set<string>(),
            onSelectionChanged: () => new Subject<void>().asObservable(),
          },
        },
        { provide: ACTIVE_LANGUAGE_READER, useValue: { currentLanguageCode: () => 'en' } },
        { provide: MOVEPOOL_REPOSITORY, useValue: { fetchDefaultMoveset: () => Promise.resolve([]), fetchMovepool } },
        { provide: POKEDEX_DETAILS_READER, useValue: fakePokedexDetailsReader((id) => pokedexEntryFor(id, 'ninetales-alola')) },
      ],
    });
    const service = TestBed.inject(InMemoryTeamService);
    service.addPokemonToTeam(pokedexEntryFor('ninetales', 'ninetales-alola'));
    await Promise.resolve();
    await Promise.resolve();
    fetchMovepool.calls.reset();

    await service.loadMovepool(0);

    expect(fetchMovepool).toHaveBeenCalledWith('ninetales-alola', jasmine.anything(), 'en');
  });

  it('hasAnyPokemon refleja si algún slot está ocupado', () => {
    const { service } = setup();
    expect(service.hasAnyPokemon()).toBeFalse();
    service.addPokemonToTeam(pokedexEntryFor('bulbasaur'));
    expect(service.hasAnyPokemon()).toBeTrue();
  });
});
