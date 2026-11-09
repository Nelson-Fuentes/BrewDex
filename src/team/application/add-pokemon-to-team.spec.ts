import { addPokemonToTeam, TeamFull } from './add-pokemon-to-team';
import { RosterEntry } from '../domain/value-objects/roster-entry';
import { MAX_TEAM_SIZE } from '../domain/value-objects/team-size';

describe('addPokemonToTeam', () => {
  it('ocupa el primer slot vacío', () => {
    const slots = [new RosterEntry('bulbasaur'), null, null, null, null, null];
    const next = addPokemonToTeam(slots, 'charmander');

    expect(next[1]?.pokemonId).toBe('charmander');
    expect(slots[1]).toBeNull(); // no muta el original
  });

  it('lanza TeamFull cuando los 6 slots ya están ocupados (FR-011)', () => {
    const fullSlots = Array.from({ length: MAX_TEAM_SIZE }, (_, i) => new RosterEntry(`mon-${i}`));
    expect(() => addPokemonToTeam(fullSlots, 'pikachu')).toThrowError(TeamFull);
  });
});
