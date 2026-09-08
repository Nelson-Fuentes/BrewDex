import { getPokedexIndex } from './get-pokedex-index';
import { Game } from '../../game/domain/entities/game';
import { Generation } from '../../game/domain/value-objects/generation';
import { PokedexView } from '../domain/value-objects/pokedex-view';
import type { PokedexIndexRepository } from '../domain/ports/pokedex-index-repository';

describe('getPokedexIndex', () => {
  it('delega en el repositorio', async () => {
    const game = new Game('red-blue', 'Red/Blue', new Generation('generation-i', 'I'));
    const view = new PokedexView();
    const repository: PokedexIndexRepository = {
      fetchPokedexIndex: jasmine.createSpy('fetchPokedexIndex').and.resolveTo([]),
    };

    await getPokedexIndex(repository, game, view);

    expect(repository.fetchPokedexIndex).toHaveBeenCalledWith(game, view);
  });
});
