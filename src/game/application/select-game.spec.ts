import { selectGame } from './select-game';
import { Game } from '../domain/entities/game';
import { Generation } from '../domain/value-objects/generation';

describe('selectGame', () => {
  it('notifica el juego elegido', () => {
    const game = new Game('sword-shield', 'Sword/Shield', new Generation('generation-viii', 'VIII'));
    const onGameSelected = jasmine.createSpy('onGameSelected');

    selectGame(game, onGameSelected);

    expect(onGameSelected).toHaveBeenCalledWith(game);
  });
});
