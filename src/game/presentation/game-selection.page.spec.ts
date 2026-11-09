import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { GameSelectionPage } from './game-selection.page';
import { InMemoryGameService } from '../infrastructure/in-memory-game.service';
import { Game } from '../domain/entities/game';
import { Generation } from '../domain/value-objects/generation';
import { ROSTER_READER } from '../../shared/tokens/roster-reader.token';

describe('GameSelectionPage', () => {
  let fixture: ComponentFixture<GameSelectionPage>;
  let rosterReaderStub: { hasAnyPokemon: jasmine.Spy };
  const games = [
    new Game('sword-shield', 'Sword/Shield', new Generation('generation-viii', 'VIII')),
    new Game('scarlet-violet', 'Scarlet/Violet', new Generation('generation-ix', 'IX')),
  ];

  beforeEach(() => {
    rosterReaderStub = { hasAnyPokemon: jasmine.createSpy('hasAnyPokemon').and.returnValue(false) };
    TestBed.configureTestingModule({
      imports: [GameSelectionPage, NoopAnimationsModule, TranslocoTestingModule.forRoot({ langs: { en: {} } })],
      providers: [
        provideRouter([]),
        {
          provide: InMemoryGameService,
          useValue: {
            status: () => 'ready',
            catalog: () => games,
            activeGame: () => null,
            activeDlcIds: () => new Set(),
            selectGame: jasmine.createSpy('selectGame'),
            toggleDlc: jasmine.createSpy('toggleDlc'),
            load: jasmine.createSpy('load'),
          },
        },
        { provide: ROSTER_READER, useValue: rosterReaderStub },
      ],
    });
    fixture = TestBed.createComponent(GameSelectionPage);
  });

  it('lista todos los juegos sin ningún filtro aplicado', () => {
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Sword/Shield');
    expect(text).toContain('Scarlet/Violet');
  });

  it('filtra por texto de búsqueda', () => {
    fixture.detectChanges();
    fixture.componentInstance['searchText'].set('scarlet');
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).not.toContain('Sword/Shield');
    expect(text).toContain('Scarlet/Violet');
  });

  it('filtra por generación', () => {
    fixture.detectChanges();
    fixture.componentInstance['selectedGenerationId'].set('generation-viii');
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Sword/Shield');
    expect(text).not.toContain('Scarlet/Violet');
  });

  it('no muestra ningún botón "Seleccionar" separado (FR-004)', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.app-actions')).toBeNull();
  });

  it('muestra un control para volver al selector de idioma (FR-005)', () => {
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    const navigateSpy = spyOn(router, 'navigateByUrl');

    const backButton = fixture.nativeElement.querySelector('[data-testid="back-button"]');
    expect(backButton).not.toBeNull();
    backButton.click();

    expect(navigateSpy).toHaveBeenCalledWith('/idioma');
  });

  it('selecciona el juego y navega a /equipo inmediatamente cuando el equipo está vacío (FR-004)', () => {
    fixture.detectChanges();
    const gameService = TestBed.inject(InMemoryGameService);
    const router = TestBed.inject(Router);
    const navigateSpy = spyOn(router, 'navigateByUrl');

    fixture.componentInstance.onSelectGame(games[0]);

    expect(gameService.selectGame).toHaveBeenCalledWith(games[0]);
    expect(navigateSpy).toHaveBeenCalledWith('/equipo');
  });

  it('cambia de juego sin pedir confirmación aunque ya haya un equipo en curso (019 — se descarta por defecto)', () => {
    fixture.detectChanges();
    rosterReaderStub.hasAnyPokemon.and.returnValue(true);
    const gameService = TestBed.inject(InMemoryGameService);
    const router = TestBed.inject(Router);
    const navigateSpy = spyOn(router, 'navigateByUrl');
    const confirmSpy = spyOn(window, 'confirm');

    fixture.componentInstance.onSelectGame(games[0]);

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(gameService.selectGame).toHaveBeenCalledWith(games[0]);
    expect(navigateSpy).toHaveBeenCalledWith('/equipo');
  });

  it('vuelve a entrar al elegir de nuevo el mismo juego ya activo (019)', () => {
    fixture.detectChanges();
    const gameService = TestBed.inject(InMemoryGameService) as unknown as { activeGame: () => typeof games[0] };
    gameService.activeGame = () => games[0];
    const router = TestBed.inject(Router);
    const navigateSpy = spyOn(router, 'navigateByUrl');

    fixture.componentInstance.onSelectGame(games[0]);

    expect(navigateSpy).toHaveBeenCalledWith('/equipo');
  });
});
