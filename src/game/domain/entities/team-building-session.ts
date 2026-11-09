import type { Game } from './game';

/**
 * El juego activo de la persona y la proyección de solo-identidad de su
 * equipo en curso — usada para reconciliar el roster cuando cambia el
 * juego (FR-016). El mecanismo del roster en sí pertenece al módulo
 * `team`; este módulo solo referencia los ids para poder reconciliar.
 */
export class TeamBuildingSession {
  constructor(
    readonly activeGame: Game | null = null,
    readonly rosterPokemonIds: readonly string[] = [],
  ) {}
}
