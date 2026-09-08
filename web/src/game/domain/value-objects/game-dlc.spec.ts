import { GameDlc } from './game-dlc';

describe('GameDlc', () => {
  it('es igual a otra instancia con el mismo id', () => {
    const a = new GameDlc('the-isle-of-armor', 'The Isle of Armor');
    const b = new GameDlc('the-isle-of-armor', 'La Isla de la Armadura');
    expect(a.equals(b)).toBeTrue();
  });
});
