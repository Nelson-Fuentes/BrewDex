import type { RosterEntry } from '../domain/value-objects/roster-entry';

/**
 * Caso de uso: vaciar un slot del equipo (FR-012). No muta `slots`; un
 * índice fuera de rango o ya vacío deja el arreglo sin cambios.
 */
export function removePokemonFromTeam(
  slots: readonly (RosterEntry | null)[],
  slotIndex: number,
): (RosterEntry | null)[] {
  if (slotIndex < 0 || slotIndex >= slots.length) {
    return [...slots];
  }
  const next = [...slots];
  next[slotIndex] = null;
  return next;
}
