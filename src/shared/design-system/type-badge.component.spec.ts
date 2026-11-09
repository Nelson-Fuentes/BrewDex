import { TestBed } from '@angular/core/testing';

import { TypeBadgeComponent } from './type-badge.component';

describe('TypeBadgeComponent', () => {
  function build() {
    TestBed.configureTestingModule({ imports: [TypeBadgeComponent] });
    const fixture = TestBed.createComponent(TypeBadgeComponent);
    fixture.componentRef.setInput('typeId', 'fire');
    fixture.componentRef.setInput('label', 'Fire');
    return fixture;
  }

  it('muestra la etiqueta con el color del tipo', () => {
    const fixture = build();
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('.app-type-badge') as HTMLElement;
    expect(badge.textContent?.trim()).toBe('Fire');
    expect(badge.style.background).toBeTruthy();
  });

  it('por defecto usa el tamaño normal, sin la clase "large" (020, ronda 5)', () => {
    const fixture = build();
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('.app-type-badge') as HTMLElement;
    expect(badge.classList.contains('app-type-badge--large')).toBeFalse();
  });

  it('con size="large" aplica la variante más grande (020, ronda 5)', () => {
    const fixture = build();
    fixture.componentRef.setInput('size', 'large');
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('.app-type-badge') as HTMLElement;
    expect(badge.classList.contains('app-type-badge--large')).toBeTrue();
    expect(parseFloat(getComputedStyle(badge).fontSize)).toBeGreaterThan(0);
  });
});
