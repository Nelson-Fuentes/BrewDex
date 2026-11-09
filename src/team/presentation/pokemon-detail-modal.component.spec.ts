import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { PokemonDetailModalComponent } from './pokemon-detail-modal.component';
import { PokedexEntry } from '../../pokemon/domain/entities/pokedex-entry';
import { PokemonType } from '../../pokemon/domain/value-objects/pokemon-type';
import { PokemonStats } from '../../pokemon/domain/value-objects/pokemon-stats';
import { Generation } from '../../game/domain/value-objects/generation';
import type { Gender } from '../../pokemon/domain/value-objects/gender';

interface EntryOverrides {
  homeSpriteShinyUrl?: string | null;
  genderRate?: number;
  homeSpriteFemaleUrl?: string | null;
  homeSpriteShinyFemaleUrl?: string | null;
}

function makeEntry(overrides: EntryOverrides = {}): PokedexEntry {
  const {
    homeSpriteShinyUrl = 'shiny.png',
    genderRate = -1,
    homeSpriteFemaleUrl = null,
    homeSpriteShinyFemaleUrl = null,
  } = overrides;
  return new PokedexEntry(
    'pikachu',
    'Pikachu',
    25,
    null,
    'normal.png',
    homeSpriteShinyUrl,
    homeSpriteFemaleUrl,
    homeSpriteShinyFemaleUrl,
    genderRate,
    homeSpriteFemaleUrl !== null || homeSpriteShinyFemaleUrl !== null,
    [],
    null,
    null,
    [],
    new PokemonType('electric', 'Electric'),
    null,
    new Generation('generation-i', 'I'),
    { kind: 'regional' },
    new PokemonStats(35, 55, 40, 50, 50, 90),
  );
}

describe('PokemonDetailModalComponent', () => {
  function build(entry: PokedexEntry, isShiny = false, gender: Gender = 'male') {
    TestBed.configureTestingModule({
      imports: [PokemonDetailModalComponent, NoopAnimationsModule, TranslocoTestingModule.forRoot({ langs: { en: {} } })],
    });
    const fixture = TestBed.createComponent(PokemonDetailModalComponent);
    fixture.componentRef.setInput('pokedexEntry', entry);
    fixture.componentRef.setInput('isShiny', isShiny);
    fixture.componentRef.setInput('gender', gender);
    fixture.detectChanges();
    return fixture;
  }

  it('muestra el nombre, los tipos y la imagen normal cuando isShiny es false', () => {
    const fixture = build(makeEntry());

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Pikachu');
    expect(text).toContain('Electric');
    expect(fixture.nativeElement.querySelector('img').getAttribute('src')).toBe('normal.png');
  });

  it('muestra la imagen shiny cuando isShiny es true', () => {
    const fixture = build(makeEntry(), true);

    expect(fixture.nativeElement.querySelector('img').getAttribute('src')).toBe('shiny.png');
  });

  it('cae a la imagen normal si no hay shiny disponible, aunque isShiny sea true', () => {
    const fixture = build(makeEntry({ homeSpriteShinyUrl: null }), true);

    expect(fixture.nativeElement.querySelector('img').getAttribute('src')).toBe('normal.png');
  });

  it('emite shinyChange al activar el toggle', () => {
    const fixture = build(makeEntry(), false);
    const spy = jasmine.createSpy('shinyChange');
    fixture.componentInstance.shinyChange.subscribe(spy);

    fixture.nativeElement.querySelector('mat-slide-toggle button').click();

    expect(spy).toHaveBeenCalledWith(true);
  });

  it('emite close al cerrar', () => {
    const fixture = build(makeEntry());
    const spy = jasmine.createSpy('close');
    fixture.componentInstance.close.subscribe(spy);

    fixture.nativeElement.querySelector('.app-detail-modal__close').click();

    expect(spy).toHaveBeenCalled();
  });

  // 019, User Story 1 (FR-002/FR-003/FR-007) — selector de género para especies duales
  describe('selector de género — especie de género dual', () => {
    function dualEntry(overrides: EntryOverrides = {}): PokedexEntry {
      return makeEntry({ genderRate: 4, ...overrides });
    }

    it('renderiza el toggle ♂/♀ con macho marcado por defecto', () => {
      const fixture = build(dualEntry());

      const group = fixture.nativeElement.querySelector('mat-button-toggle-group');
      expect(group).not.toBeNull();
      const toggles = fixture.nativeElement.querySelectorAll('mat-button-toggle');
      expect(toggles.length).toBe(2);
      expect(toggles[0].querySelector('button').getAttribute('aria-checked')).toBe('true');
      expect(toggles[1].querySelector('button').getAttribute('aria-checked')).toBe('false');
    });

    it('marca hembra como seleccionada cuando gender() es female', () => {
      const fixture = build(dualEntry(), false, 'female');

      const toggles = fixture.nativeElement.querySelectorAll('mat-button-toggle');
      expect(toggles[0].querySelector('button').getAttribute('aria-checked')).toBe('false');
      expect(toggles[1].querySelector('button').getAttribute('aria-checked')).toBe('true');
    });

    it('emite genderChange con "female" al tocar el ícono de hembra', () => {
      const fixture = build(dualEntry());
      const spy = jasmine.createSpy('genderChange');
      fixture.componentInstance.genderChange.subscribe(spy);

      const toggles = fixture.nativeElement.querySelectorAll('mat-button-toggle');
      toggles[1].querySelector('button').click();

      expect(spy).toHaveBeenCalledWith('female');
    });
  });

  // 019, User Story 2 (FR-004/FR-005/FR-006) — indicador fijo para especies no duales
  describe('selector de género — especies no duales', () => {
    it('muestra un indicador fijo ♂ sin toggle para especies exclusivamente macho', () => {
      const fixture = build(makeEntry({ genderRate: 0 }));

      expect(fixture.nativeElement.querySelector('mat-button-toggle-group')).toBeNull();
      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(text).toContain('♂');
    });

    it('muestra un indicador fijo ♀ sin toggle para especies exclusivamente hembra', () => {
      const fixture = build(makeEntry({ genderRate: 8 }), false, 'female');

      expect(fixture.nativeElement.querySelector('mat-button-toggle-group')).toBeNull();
      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(text).toContain('♀');
    });

    it('muestra un indicador fijo "—" sin toggle para especies sin género', () => {
      const fixture = build(makeEntry({ genderRate: -1 }), false, 'genderless');

      expect(fixture.nativeElement.querySelector('mat-button-toggle-group')).toBeNull();
      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(text).toContain('—');
    });
  });

  // 019, User Stories 3/4 (FR-008/FR-009/FR-010/FR-011) — la imagen sigue al género y al shiny
  describe('imagen según género y shiny', () => {
    function entryWithGenderDifferences(): PokedexEntry {
      return makeEntry({
        genderRate: 4,
        homeSpriteShinyUrl: 'shiny.png',
        homeSpriteFemaleUrl: 'female.png',
        homeSpriteShinyFemaleUrl: 'shiny-female.png',
      });
    }

    it('macho/no-shiny muestra homeSpriteUrl', () => {
      const fixture = build(entryWithGenderDifferences(), false, 'male');
      expect(fixture.nativeElement.querySelector('img').getAttribute('src')).toBe('normal.png');
    });

    it('hembra/no-shiny muestra homeSpriteFemaleUrl', () => {
      const fixture = build(entryWithGenderDifferences(), false, 'female');
      expect(fixture.nativeElement.querySelector('img').getAttribute('src')).toBe('female.png');
    });

    it('macho/shiny muestra homeSpriteShinyUrl', () => {
      const fixture = build(entryWithGenderDifferences(), true, 'male');
      expect(fixture.nativeElement.querySelector('img').getAttribute('src')).toBe('shiny.png');
    });

    it('hembra/shiny muestra homeSpriteShinyFemaleUrl', () => {
      const fixture = build(entryWithGenderDifferences(), true, 'female');
      expect(fixture.nativeElement.querySelector('img').getAttribute('src')).toBe('shiny-female.png');
    });

    it('sin sprite hembra, la imagen no cambia con el género (FR-009)', () => {
      const fixture = build(makeEntry({ genderRate: 4 }), false, 'female');
      expect(fixture.nativeElement.querySelector('img').getAttribute('src')).toBe('normal.png');
    });

    it('sin sprite shiny-hembra, cae al shiny base (hembra/shiny)', () => {
      const fixture = build(makeEntry({ genderRate: 4, homeSpriteFemaleUrl: 'female.png' }), true, 'female');
      expect(fixture.nativeElement.querySelector('img').getAttribute('src')).toBe('shiny.png');
    });
  });
});
