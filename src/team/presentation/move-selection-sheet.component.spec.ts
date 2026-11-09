import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { MoveSelectionSheetComponent } from './move-selection-sheet.component';
import { Move } from '../../pokemon/domain/value-objects/move';
import { MoveLearnInfo } from '../../pokemon/domain/value-objects/move-learn-info';
import { PokemonType } from '../../pokemon/domain/value-objects/pokemon-type';

const normal = new PokemonType('normal', 'Normal');
const fire = new PokemonType('fire', 'Fire');

const tackle = new MoveLearnInfo(new Move('tackle', 'Tackle', normal, 'physical', 35, 40, '...'), ['level'], 1);
const growl = new MoveLearnInfo(new Move('growl', 'Growl', normal, 'status', 40, null, '...'), ['level'], 3);
const ember = new MoveLearnInfo(new Move('ember', 'Ember', fire, 'special', 25, 40, '...'), ['tm'], null);
const movepool = [tackle, growl, ember];

const i18n = {
  en: {
    team: {
      moveSelectionTitle: 'Choose moves',
      moveSelectionSubtitle: 'Assigned to {{name}}',
      moveSelectionCount: 'Showing {{count}} available moves',
      moveSearchPlaceholder: 'Search by name or effect…',
      moveSlot: 'Move {{position}}',
      damageClass: { physical: 'Physical', special: 'Special', status: 'Status' },
      emptyMoveSlot: 'Choose a move',
      movePower: 'Power',
      movePowerNotApplicable: 'Not applicable',
      moveAccuracy: 'Accuracy',
      moveAccuracyNotApplicable: 'Never misses',
      movePp: 'PP',
      moveAssignedElsewhere: 'Already assigned to another slot',
      moveEquipped: 'Equipped',
      moveAdd: 'Add',
      moveFilterDamageClassLabel: 'Class',
      moveFilterTypeLabel: 'Type',
      moveFilterLearnMethodLabel: 'Learn method',
      moveFilterAll: 'All',
      moveFilterClear: 'Clear filters',
      moveFilterNoResults: 'No moves match these filters.',
      moveDataUnavailable: "Move data isn't available for this game yet.",
      learnMethod: { level: 'Level', tm: 'TM', hm: 'HM', tutor: 'Tutor', egg: 'Egg' },
    },
    common: { close: 'Close' },
  },
};

function build(inputs: { moveIds?: unknown; movepool?: unknown; activePosition?: unknown } = {}) {
  TestBed.configureTestingModule({
    imports: [MoveSelectionSheetComponent, NoopAnimationsModule, TranslocoTestingModule.forRoot({ langs: i18n, preloadLangs: true })],
  });
  const fixture = TestBed.createComponent(MoveSelectionSheetComponent);
  fixture.componentRef.setInput('moveIds', inputs.moveIds ?? [null, null, null, null]);
  fixture.componentRef.setInput('movepool', inputs.movepool ?? movepool);
  fixture.componentRef.setInput('activePosition', inputs.activePosition ?? 0);
  fixture.detectChanges();
  return fixture;
}

describe('MoveSelectionSheetComponent', () => {
  it('muestra el movepool y emite selectMove con la posición activa', () => {
    const fixture = build();

    const spy = jasmine.createSpy('selectMove');
    fixture.componentInstance.selectMove.subscribe(spy);
    fixture.nativeElement.querySelector('app-move-slot button').click();

    expect(spy).toHaveBeenCalledWith({ position: 0, move: tackle.move });
  });

  it('renderiza cada candidato con MoveSlotComponent (misma interfaz que el slot de la tarjeta)', () => {
    const fixture = build();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Tackle');
    expect(text).toContain('40'); // potencia
    expect(text).toContain('35'); // PP
  });

  it('filtra por clase de daño', () => {
    const fixture = build();
    fixture.componentInstance['damageClassFilter'].set('special');
    fixture.detectChanges();

    expect(fixture.componentInstance['visibleMovepool']()).toEqual([ember]);
  });

  it('combina filtro de tipo y método de aprendizaje', () => {
    const fixture = build();
    fixture.componentInstance['typeFilter'].set('fire');
    fixture.componentInstance['learnMethodFilter'].set('tm');
    fixture.detectChanges();

    expect(fixture.componentInstance['visibleMovepool']()).toEqual([ember]);
  });

  it('muestra un estado vacío cuando ningún movimiento cumple los filtros activos', () => {
    const fixture = build();
    fixture.componentInstance['learnMethodFilter'].set('egg');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.app-move-selection-empty')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.app-move-selection-empty--no-data')).toBeFalsy();
    expect(fixture.nativeElement.querySelectorAll('app-move-slot').length).toBe(0);
  });

  it('distingue "sin datos de movimientos para este juego" de "ningún resultado por los filtros" (bug reportado: Legends Z-A)', () => {
    // El movepool completo llega vacío (p. ej. PokeAPI todavía no tiene
    // movesets para un juego recién agregado) — sin ningún filtro activo,
    // no debe confundirse con "no coincide con los filtros".
    const fixture = build({ movepool: [] });

    const emptyState = fixture.nativeElement.querySelector('.app-move-selection-empty--no-data');
    expect(emptyState).toBeTruthy();
  });

  it('clearFilters restaura el movepool completo', () => {
    const fixture = build();
    fixture.componentInstance['damageClassFilter'].set('physical');
    fixture.detectChanges();
    expect(fixture.componentInstance['visibleMovepool']().length).toBe(1);

    fixture.componentInstance['clearFilters']();
    fixture.detectChanges();

    expect(fixture.componentInstance['visibleMovepool']()).toEqual(movepool);
  });

  it('deshabilita un movimiento ya asignado a otra posición (FR-016/FR-017)', () => {
    const fixture = build({ moveIds: ['tackle', null, null, null], activePosition: 1 });

    const buttons = fixture.nativeElement.querySelectorAll('app-move-slot button');
    const tackleButton = Array.from(buttons).find((b) => (b as HTMLElement).textContent?.includes('Tackle')) as HTMLButtonElement;
    expect(tackleButton.disabled).toBeTrue();
  });

  it('tocar un movimiento deshabilitado no emite selectMove', () => {
    const fixture = build({ moveIds: ['tackle', null, null, null], activePosition: 1 });
    const spy = jasmine.createSpy('selectMove');
    fixture.componentInstance.selectMove.subscribe(spy);

    const buttons = fixture.nativeElement.querySelectorAll('app-move-slot button');
    const tackleButton = Array.from(buttons).find((b) => (b as HTMLElement).textContent?.includes('Tackle')) as HTMLButtonElement;
    tackleButton.click();

    expect(spy).not.toHaveBeenCalled();
  });

  it('un movimiento en su propia posición activa no aparece deshabilitado', () => {
    const fixture = build({ moveIds: ['tackle', null, null, null], activePosition: 0 });

    const buttons = fixture.nativeElement.querySelectorAll('app-move-slot button');
    const tackleButton = Array.from(buttons).find((b) => (b as HTMLElement).textContent?.includes('Tackle')) as HTMLButtonElement;
    expect(tackleButton.disabled).toBeFalse();
  });

  it('un movimiento ya asignado a la posición activa se ve como "equipado" (equipped=true), no como "agregar"', () => {
    const fixture = build({ moveIds: ['tackle', null, null, null], activePosition: 0 });

    expect(fixture.componentInstance['isEquipped'](tackle)).toBeTrue();
    expect(fixture.componentInstance['isEquipped'](ember)).toBeFalse();
  });

  it('busca por nombre a través del cuadro de búsqueda', () => {
    const fixture = build();
    fixture.componentInstance['searchText'].set('tack');
    fixture.detectChanges();

    expect(fixture.componentInstance['visibleMovepool']()).toEqual([tackle]);
  });

  it('clearFilters también limpia la búsqueda de texto', () => {
    const fixture = build();
    fixture.componentInstance['searchText'].set('tack');
    fixture.detectChanges();
    expect(fixture.componentInstance['visibleMovepool']().length).toBe(1);

    fixture.componentInstance['clearFilters']();
    fixture.detectChanges();

    expect(fixture.componentInstance['searchText']()).toBe('');
    expect(fixture.componentInstance['visibleMovepool']()).toEqual(movepool);
  });

  it('muestra el subtítulo cuando se pasa pokemonName', () => {
    const fixture = build();
    fixture.componentRef.setInput('pokemonName', 'Pidgeot');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.app-move-selection-subtitle')).toBeTruthy();
  });

  it('no muestra el subtítulo cuando pokemonName es null', () => {
    const fixture = build();

    expect(fixture.nativeElement.querySelector('.app-move-selection-subtitle')).toBeFalsy();
  });

  it('muestra un resumen con la cantidad de movimientos visibles', () => {
    const fixture = build();

    expect(fixture.nativeElement.querySelector('.app-move-selection-summary')).toBeTruthy();
  });
});
