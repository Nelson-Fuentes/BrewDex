import { RosterEntry } from '../domain/value-objects/roster-entry';

/** Lanzado cuando ya hay `MAX_TEAM_SIZE` slots ocupados (FR-011). */
export class TeamFull extends Error {
  constructor() {
    super('The team is already full.');
    this.name = 'TeamFull';
  }
}

/**
 * Caso de uso: agregar un Pokémon al equipo, ocupando el primer slot
 * vacío (FR-010). No muta `slots`; lanza {@link TeamFull} si no hay
 * ningún slot libre — la capa de infraestructura (`TeamStore`) traduce
 * eso a un motivo de rechazo observable por la presentación.
 */
export function addPokemonToTeam(
  slots: readonly (RosterEntry | null)[],
  pokemonId: string,
): (RosterEntry | null)[] {
  const emptyIndex = slots.findIndex((slot) => slot === null);
  if (emptyIndex === -1) {
    throw new TeamFull();
  }
  const next = [...slots];
  next[emptyIndex] = new RosterEntry(pokemonId);
  return next;
}
