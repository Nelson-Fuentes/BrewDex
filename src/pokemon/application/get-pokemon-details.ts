import type { Game } from '../../game/domain/entities/game';
import type { PokedexView } from '../../pokedex/domain/value-objects/pokedex-view';
import type { PokedexEntry } from '../domain/entities/pokedex-entry';
import type { PokemonRepository } from '../domain/ports/pokemon-repository';

/** Caso de uso: resolver el detalle completo de una lista de Pokémon (FR-008). */
export function getPokemonDetails(
  repository: PokemonRepository,
  game: Game,
  view: PokedexView,
  pokemonIds: readonly string[],
  languageCode: string,
): Promise<PokedexEntry[]> {
  return repository.fetchPokedexDetails(game, view, pokemonIds, languageCode);
}
