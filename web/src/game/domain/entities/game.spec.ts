import { Game } from './game';
import { Generation } from '../value-objects/generation';
import { GameDlc } from '../value-objects/game-dlc';

const generation = new Generation('generation-viii', 'Generation VIII');

describe('Game', () => {
  it('es igual a otra instancia con el mismo id', () => {
    const a = new Game('sword-shield', 'Sword/Shield', generation);
    const b = new Game('sword-shield', 'Espada/Escudo', generation);
    expect(a.equals(b)).toBeTrue();
  });

  it('rechaza un id vacío', () => {
    expect(() => new Game('', 'Sword/Shield', generation)).toThrowError();
  });

  it('rechaza un displayName vacío', () => {
    expect(() => new Game('sword-shield', '', generation)).toThrowError();
  });

  it('acepta una lista de DLC', () => {
    const dlc = new GameDlc('the-isle-of-armor', 'The Isle of Armor');
    const game = new Game('sword-shield', 'Sword/Shield', generation, [dlc]);
    expect(game.dlcs).toEqual([dlc]);
  });
});
