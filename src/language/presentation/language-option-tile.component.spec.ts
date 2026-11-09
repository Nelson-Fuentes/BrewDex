import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LanguageOptionTileComponent } from './language-option-tile.component';
import { SupportedLanguage } from '../domain/value-objects/supported-language';

describe('LanguageOptionTileComponent', () => {
  let fixture: ComponentFixture<LanguageOptionTileComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [LanguageOptionTileComponent] });
    fixture = TestBed.createComponent(LanguageOptionTileComponent);
    fixture.componentRef.setInput('language', new SupportedLanguage('es', 'Español'));
  });

  it('muestra el nombre visible del idioma', () => {
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Español');
  });

  it('emite select al hacer click', () => {
    fixture.detectChanges();
    const spy = jasmine.createSpy('select');
    fixture.componentInstance.select.subscribe(spy);

    (fixture.nativeElement as HTMLElement).querySelector('button')?.dispatchEvent(new Event('click'));

    expect(spy).toHaveBeenCalled();
  });

  it('no muestra ningún ícono de "check" (019)', () => {
    fixture.componentRef.setInput('selected', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('mat-icon')).toBeNull();
  });

  it('indica la selección con un borde en el botón, no con un ícono (019)', () => {
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLElement;
    expect(button.classList.contains('app-language-option-tile--selected')).toBeFalse();

    fixture.componentRef.setInput('selected', true);
    fixture.detectChanges();

    expect(button.classList.contains('app-language-option-tile--selected')).toBeTrue();
  });

  it('no tiene color de fondo detrás de la bandera (020)', () => {
    fixture.detectChanges();
    const flag = fixture.nativeElement.querySelector('.app-language-option-tile__flag') as HTMLElement;
    expect(flag.style.background).toBeFalsy();
  });

  it('muestra un emoji de bandera acorde al código de idioma (019)', () => {
    fixture.detectChanges();
    const flag = fixture.nativeElement.querySelector('.app-language-option-tile__flag') as HTMLElement;
    expect(flag.textContent?.trim()).toBe('🇪🇸');
  });
});
