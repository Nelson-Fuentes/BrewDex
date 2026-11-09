import { getDefaultMoveset } from './get-default-moveset';
import { Game } from '../../game/domain/entities/game';
import { Generation } from '../../game/domain/value-objects/generation';
import type { MovepoolRepository } from '../domain/ports/movepool-repository';

describe('getDefaultMoveset', () => {
  it('delega en el repositorio', async () => {
    const game = new Game('sword-shield', 'Sword/Shield', new Generation('generation-viii', 'VIII'));
    const repository: MovepoolRepository = {
      fetchMovepool: jasmine.createSpy('fetchMovepool'),
      fetchDefaultMoveset: jasmine.createSpy('fetchDefaultMoveset').and.resolveTo([]),
    };

    await getDefaultMoveset(repository, 'pikachu', game, 'en');

    expect(repository.fetchDefaultMoveset).toHaveBeenCalledWith('pikachu', game, 'en');
  });
});
