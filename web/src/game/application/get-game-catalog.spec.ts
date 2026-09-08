import { getGameCatalog } from './get-game-catalog';
import { Game } from '../domain/entities/game';
import { Generation } from '../domain/value-objects/generation';
import type { GameCatalogRepository } from '../domain/ports/game-catalog-repository';

describe('getGameCatalog', () => {
  it('delega en el repositorio con el languageCode dado', async () => {
    const expected = [new Game('sword-shield', 'Sword/Shield', new Generation('generation-viii', 'VIII'))];
    const repository: GameCatalogRepository = {
      fetchCatalog: jasmine.createSpy('fetchCatalog').and.resolveTo(expected),
    };

    const result = await getGameCatalog(repository, 'es');

    expect(repository.fetchCatalog).toHaveBeenCalledWith('es');
    expect(result).toBe(expected);
  });
});
