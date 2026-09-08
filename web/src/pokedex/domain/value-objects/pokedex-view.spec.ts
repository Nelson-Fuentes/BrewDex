import { PokedexView } from './pokedex-view';

describe('PokedexView', () => {
  it('arranca sin Pokédex nacional y sin DLC activos', () => {
    const view = new PokedexView();
    expect(view.useNationalDex).toBeFalse();
    expect(view.activeDlcIds.size).toBe(0);
  });

  it('withNationalDex/withActiveDlcIds devuelven una nueva instancia inmutable', () => {
    const view = new PokedexView();
    const withNational = view.withNationalDex(true);
    const withDlc = view.withActiveDlcIds(new Set(['the-isle-of-armor']));

    expect(withNational.useNationalDex).toBeTrue();
    expect(view.useNationalDex).toBeFalse();
    expect(withDlc.activeDlcIds.has('the-isle-of-armor')).toBeTrue();
  });
});
