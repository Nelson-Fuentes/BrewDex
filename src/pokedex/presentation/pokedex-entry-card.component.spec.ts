import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { PokedexEntryCardComponent } from './pokedex-entry-card.component';
import { PokedexEntry } from '../../pokemon/domain/entities/pokedex-entry';
import { PokemonType } from '../../pokemon/domain/value-objects/pokemon-type';
import { PokemonStats } from '../../pokemon/domain/value-objects/pokemon-stats';
import { Generation } from '../../game/domain/value-objects/generation';

const entry = new PokedexEntry(
  'bulbasaur',
  'Bulbasaur',
  1,
  'sprite.png',
  null,
  null,
  null,
  null,
  -1,
  false,
  [],
  null,
  null,
  [],
  new PokemonType('grass', 'Grass'),
  null,
  new Generation('generation-i', 'I'),
  { kind: 'regional' },
  new PokemonStats(45, 49, 49, 65, 65, 45),
);

describe('PokedexEntryCardComponent', () => {
  it('muestra el número y nombre, y emite add al hacer click', () => {
    TestBed.configureTestingModule({
      imports: [PokedexEntryCardComponent, TranslocoTestingModule.forRoot({ langs: { en: { pokedex: { add: 'Add' } } } })],
    });
    const fixture = TestBed.createComponent(PokedexEntryCardComponent);
    fixture.componentRef.setInput('entry', entry);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('#1');
    expect(text).toContain('Bulbasaur');

    const spy = jasmine.createSpy('add');
    fixture.componentInstance.add.subscribe(spy);
    fixture.nativeElement.querySelector('button').click();

    expect(spy).toHaveBeenCalled();
  });
});
