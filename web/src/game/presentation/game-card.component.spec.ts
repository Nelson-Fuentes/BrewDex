import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { GameCardComponent } from './game-card.component';
import { Game } from '../domain/entities/game';
import { Generation } from '../domain/value-objects/generation';

describe('GameCardComponent', () => {
  it('muestra el nombre del juego y emite select al hacer click', () => {
    TestBed.configureTestingModule({
      imports: [GameCardComponent, TranslocoTestingModule.forRoot({ langs: { en: { game: { select: 'Select' } } } })],
    });
    const fixture = TestBed.createComponent(GameCardComponent);
    fixture.componentRef.setInput('game', new Game('sword-shield', 'Sword/Shield', new Generation('generation-viii', 'VIII')));
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Sword/Shield');

    const spy = jasmine.createSpy('select');
    fixture.componentInstance.select.subscribe(spy);
    fixture.nativeElement.querySelector('button').click();

    expect(spy).toHaveBeenCalled();
  });

  it('muestra un ícono de pokeball (FR-003)', () => {
    TestBed.configureTestingModule({
      imports: [GameCardComponent, TranslocoTestingModule.forRoot({ langs: { en: {} } })],
    });
    const fixture = TestBed.createComponent(GameCardComponent);
    fixture.componentRef.setInput('game', new Game('sword-shield', 'Sword/Shield', new Generation('generation-viii', 'VIII')));
    fixture.detectChanges();

    const icon = fixture.nativeElement.querySelector('mat-icon');
    expect(icon?.textContent?.trim()).toBe('catching_pokemon');
  });

  it('usa un color distinto por juego (FR-003)', () => {
    TestBed.configureTestingModule({
      imports: [GameCardComponent, TranslocoTestingModule.forRoot({ langs: { en: {} } })],
    });

    const fixtureA = TestBed.createComponent(GameCardComponent);
    fixtureA.componentRef.setInput('game', new Game('sword-shield', 'Sword/Shield', new Generation('generation-viii', 'VIII')));
    fixtureA.detectChanges();

    const fixtureB = TestBed.createComponent(GameCardComponent);
    fixtureB.componentRef.setInput('game', new Game('scarlet-violet', 'Scarlet/Violet', new Generation('generation-ix', 'IX')));
    fixtureB.detectChanges();

    const colorA = (fixtureA.nativeElement.querySelector('.app-game-card__generation') as HTMLElement).style.background;
    const colorB = (fixtureB.nativeElement.querySelector('.app-game-card__generation') as HTMLElement).style.background;

    expect(colorA).toBeTruthy();
    expect(colorB).toBeTruthy();
    expect(colorA).not.toBe(colorB);
  });
});
