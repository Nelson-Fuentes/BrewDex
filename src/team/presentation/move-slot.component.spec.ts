import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { MoveSlotComponent } from './move-slot.component';
import { Move } from '../../pokemon/domain/value-objects/move';
import { PokemonType } from '../../pokemon/domain/value-objects/pokemon-type';

const normal = new PokemonType('normal', 'Normal');
const tackle = new Move('tackle', 'Tackle', normal, 'physical', 35, 40, 'Un golpe con el cuerpo.', 100);
const growl = new Move('growl', 'Growl', normal, 'status', 40, null, 'Baja el Ataque rival.', null);

describe('MoveSlotComponent', () => {
  let fixture: ComponentFixture<MoveSlotComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        MoveSlotComponent,
        TranslocoTestingModule.forRoot({
          langs: {
            en: {
              team: {
                damageClass: { physical: 'Physical', special: 'Special', status: 'Status' },
                movePower: 'Power',
                movePowerNotApplicable: 'Not applicable',
                moveAccuracy: 'Accuracy',
                moveAccuracyNotApplicable: 'Never misses',
                movePp: 'PP',
                moveAssignedElsewhere: 'Already assigned to another slot',
                moveEquipped: 'Equipped',
                moveAdd: 'Add',
                emptyMoveSlot: 'Choose a move',
              },
            },
          },
          preloadLangs: true,
        }),
      ],
    });
    fixture = TestBed.createComponent(MoveSlotComponent);
  });

  it('muestra tipo, nombre, descripción, potencia, precisión, clase y PP de un movimiento asignado', () => {
    fixture.componentRef.setInput('move', tackle);
    fixture.componentRef.setInput('state', 'filled');
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Tackle');
    expect(text).toContain('Un golpe con el cuerpo.');
    expect(text).toContain('40'); // potencia
    expect(text).toContain('100%'); // precisión
    expect(text).toContain('35'); // PP
  });

  it('indica explícitamente que la potencia no aplica y que el movimiento nunca falla en un movimiento de estado sin precisión', () => {
    fixture.componentRef.setInput('move', growl);
    fixture.componentRef.setInput('state', 'filled');
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).not.toContain('null');
    const notApplicableStats = fixture.nativeElement.querySelectorAll('.app-move-slot__stat--not-applicable');
    expect(notApplicableStats.length).toBe(2); // potencia y precisión, ambas "no aplica"/"nunca falla"
  });

  it('renderiza un placeholder de slot vacío cuando move es null', () => {
    fixture.componentRef.setInput('move', null);
    fixture.componentRef.setInput('state', 'empty');
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).not.toContain('Tackle');
    expect(fixture.nativeElement.querySelector('.app-move-slot--empty')).toBeTruthy();
  });

  it('no muestra badge de equipado/agregar en la tarjeta (state filled/empty)', () => {
    fixture.componentRef.setInput('move', tackle);
    fixture.componentRef.setInput('state', 'filled');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.app-move-slot__equipped-badge')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('.app-move-slot__add-badge')).toBeFalsy();
  });

  it('en el selector, un movimiento no equipado muestra el badge de "Agregar"', () => {
    fixture.componentRef.setInput('move', tackle);
    fixture.componentRef.setInput('state', 'selectable');
    fixture.componentRef.setInput('equipped', false);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.app-move-slot__add-badge')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.app-move-slot__equipped-badge')).toBeFalsy();
  });

  it('en el selector, un movimiento ya equipado muestra el badge de "Equipado" en vez de "Agregar"', () => {
    fixture.componentRef.setInput('move', tackle);
    fixture.componentRef.setInput('state', 'selectable');
    fixture.componentRef.setInput('equipped', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.app-move-slot__equipped-badge')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.app-move-slot__add-badge')).toBeFalsy();
  });

  it('un movimiento deshabilitado (asignado a otro slot) siempre se ve como "Equipado", sin importar el input equipped', () => {
    fixture.componentRef.setInput('move', tackle);
    fixture.componentRef.setInput('state', 'disabled');
    fixture.componentRef.setInput('equipped', false);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.app-move-slot__equipped-badge')).toBeTruthy();
  });

  it('no emite activate al tocar un slot en estado disabled', () => {
    fixture.componentRef.setInput('move', tackle);
    fixture.componentRef.setInput('state', 'disabled');
    fixture.detectChanges();
    const spy = jasmine.createSpy('activate');
    fixture.componentInstance.activate.subscribe(spy);

    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();

    expect(spy).not.toHaveBeenCalled();
  });

  it('emite activate al tocar un slot seleccionable', () => {
    fixture.componentRef.setInput('move', tackle);
    fixture.componentRef.setInput('state', 'selectable');
    fixture.detectChanges();
    const spy = jasmine.createSpy('activate');
    fixture.componentInstance.activate.subscribe(spy);

    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();

    expect(spy).toHaveBeenCalled();
  });
});
