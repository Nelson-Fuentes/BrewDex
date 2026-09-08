import { removePokemonFromTeam } from './remove-pokemon-from-team';
import { RosterEntry } from '../domain/value-objects/roster-entry';

describe('removePokemonFromTeam', () => {
  it('vacía el slot dado', () => {
    const slots = [new RosterEntry('bulbasaur'), new RosterEntry('charmander'), null, null, null, null];
    const next = removePokemonFromTeam(slots, 0);

    expect(next[0]).toBeNull();
    expect(next[1]?.pokemonId).toBe('charmander');
    expect(slots[0]?.pokemonId).toBe('bulbasaur'); // no muta el original
  });

  it('deja el arreglo sin cambios para un índice fuera de rango', () => {
    const slots = [new RosterEntry('bulbasaur'), null, null, null, null, null];
    expect(removePokemonFromTeam(slots, 99)).toEqual(slots);
  });
});
