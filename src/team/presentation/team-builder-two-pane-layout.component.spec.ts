import { TestBed } from '@angular/core/testing';

import { TeamBuilderTwoPaneLayoutComponent } from './team-builder-two-pane-layout.component';
import { ViewportService } from '../../shared/design-system/viewport.service';

describe('TeamBuilderTwoPaneLayoutComponent', () => {
  function build(screenSize: 'compact' | 'medium' | 'expanded') {
    TestBed.configureTestingModule({
      imports: [TeamBuilderTwoPaneLayoutComponent],
      providers: [{ provide: ViewportService, useValue: { screenSize: () => screenSize } }],
    });
    return TestBed.createComponent(TeamBuilderTwoPaneLayoutComponent);
  }

  it('renderiza el layout de dos columnas en "expanded"', () => {
    const fixture = build('expanded');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.app-two-pane--expanded')).not.toBeNull();
  });

  it('renderiza el layout apilado en "compact"', () => {
    const fixture = build('compact');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.app-two-pane--stacked')).not.toBeNull();
  });
});
