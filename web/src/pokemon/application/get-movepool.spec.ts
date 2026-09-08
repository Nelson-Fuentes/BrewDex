import { getMovepool } from './get-movepool';
import { Game } from '../../game/domain/entities/game';
import { Generation } from '../../game/domain/value-objects/generation';
import type { MovepoolRepository } from '../domain/ports/movepool-repository';

describe('getMovepool', () => {
  it('delega en el repositorio', async () => {
    const game = new Game('sword-shield', 'Sword/Shield', new Generation('generation-viii', 'VIII'));
    const repository: MovepoolRepository = {
      fetchMovepool: jasmine.createSpy('fetchMovepool').and.resolveTo([]),
      fetchDefaultMoveset: jasmine.createSpy('fetchDefaultMoveset'),
    };

    await getMovepool(repository, 'pikachu', game, 'en');

    expect(repository.fetchMovepool).toHaveBeenCalledWith('pikachu', game, 'en');
  });
});
