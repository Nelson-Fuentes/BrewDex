import { RosterEntry } from './roster-entry';
import { MAX_TEAM_SIZE } from './team-size';

describe('MAX_TEAM_SIZE', () => {
  it('es 6', () => {
    expect(MAX_TEAM_SIZE).toBe(6);
  });
});

describe('RosterEntry', () => {
  it('es igual a otra instancia con el mismo pokemonId', () => {
    const a = new RosterEntry('pikachu');
    const b = new RosterEntry('pikachu', 'pikachu-alt', 'female');
    expect(a.equals(b)).toBeTrue();
  });

  it('arranca con moveIds vacíos y sin personalización', () => {
    const entry = new RosterEntry('pikachu');
    expect(entry.moveIds).toEqual([null, null, null, null]);
    expect(entry.megaActive).toBeFalse();
    expect(entry.gigamaxActive).toBeFalse();
  });

  it('copyWith devuelve una nueva instancia con solo los cambios pedidos', () => {
    const entry = new RosterEntry('pikachu');
    const updated = entry.copyWith({ isShiny: true, moveIds: ['thunderbolt', null, null, null] });

    expect(updated.isShiny).toBeTrue();
    expect(updated.moveIds[0]).toBe('thunderbolt');
    expect(updated.pokemonId).toBe('pikachu');
    expect(entry.isShiny).toBeFalse(); // el original no se muta
  });
});
