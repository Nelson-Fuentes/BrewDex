import { TestBed } from '@angular/core/testing';
import { BreakpointObserver } from '@angular/cdk/layout';
import { of } from 'rxjs';

import { ViewportService } from './viewport.service';

describe('ViewportService', () => {
  function setup(initialWidth: number) {
    (window as unknown as { innerWidth: number }).innerWidth = initialWidth;
    TestBed.configureTestingModule({
      providers: [
        ViewportService,
        { provide: BreakpointObserver, useValue: { observe: () => of({ matches: true }) } },
      ],
    });
    return TestBed.inject(ViewportService);
  }

  it('resuelve screenSize a partir del ancho inicial del navegador', () => {
    const service = setup(1200);
    expect(service.width()).toBe(1200);
    expect(service.screenSize()).toBe('expanded');
  });

  it('reporta "compact" para un ancho de móvil', () => {
    const service = setup(375);
    expect(service.screenSize()).toBe('compact');
  });
});
