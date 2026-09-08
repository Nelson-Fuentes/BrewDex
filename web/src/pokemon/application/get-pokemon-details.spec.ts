import { getPokemonDetails } from './get-pokemon-details';
import { Game } from '../../game/domain/entities/game';
import { Generation } from '../../game/domain/value-objects/generation';
import { PokedexView } from '../../pokedex/domain/value-objects/pokedex-view';
import type { PokemonRepository } from '../domain/ports/pokemon-repository';

describe('getPokemonDetails', () => {
  it('delega en el repositorio con los mismos argumentos', async () => {
    const game = new Game('sword-shield', 'Sword/Shield', new Generation('generation-viii', 'VIII'));
    const view = new PokedexView();
    const repository: PokemonRepository = {
      fetchPokedexDetails: jasmine.createSpy('fetchPokedexDetails').and.resolveTo([]),
    };

    await getPokemonDetails(repository, game, view, ['bulbasaur'], 'es');

    expect(repository.fetchPokedexDetails).toHaveBeenCalledWith(game, view, ['bulbasaur'], 'es');
  });
});
