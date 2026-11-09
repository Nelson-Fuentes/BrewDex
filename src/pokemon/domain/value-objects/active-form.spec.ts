import { resolveActiveForm, availableSelectableForms, resolveDisplayFormVarietyId, resolveFormSpriteUrl } from './active-form';
import { PokedexEntry } from '../entities/pokedex-entry';
import { PokemonType } from './pokemon-type';
import { PokemonStats } from './pokemon-stats';
import { SelectableForm } from './selectable-form';
import { Generation } from '../../../game/domain/value-objects/generation';

const electric = new PokemonType('electric', 'Electric');
const fire = new PokemonType('fire', 'Fire');
const ice = new PokemonType('ice', 'Ice');
const stats = new PokemonStats(50, 50, 77, 95, 77, 91);
const generationIv = new Generation('generation-iv', 'IV');

function heatForm(requiresDlcId: string | null = null): SelectableForm {
  return new SelectableForm(
    'rotom-heat',
    'Rotom Calor',
    'rotom-heat-game.png',
    'rotom-heat-home.png',
    'rotom-heat-home-shiny.png',
    null,
    null,
    'template',
    requiresDlcId,
    electric,
    fire,
    stats,
  );
}

function iceForm(requiresDlcId: string | null = null): SelectableForm {
  return new SelectableForm(
    'rotom-frost',
    'Rotom Hielo',
    'rotom-frost-game.png',
    'rotom-frost-home.png',
    'rotom-frost-home-shiny.png',
    null,
    null,
    'template',
    requiresDlcId,
    electric,
    ice,
    stats,
  );
}

function buildEntry(selectableForms: readonly SelectableForm[] = []): PokedexEntry {
  return new PokedexEntry(
    'rotom',
    'Rotom',
    479,
    'rotom-sprite.png',
    'rotom-home.png',
    'rotom-home-shiny.png',
    null,
    null,
    -1,
    false,
    selectableForms,
    null,
    null,
    [],
    electric,
    null,
    generationIv,
    { kind: 'regional' },
    stats,
  );
}

describe('resolveActiveForm', () => {
  it('devuelve los campos de la forma base cuando formVarietyId es null', () => {
    const entry = buildEntry([heatForm()]);
    const active = resolveActiveForm(entry, null);
    expect(active.typePrimary).toBe(electric);
    expect(active.typeSecondary).toBeNull();
    expect(active.homeSpriteUrl).toBe('rotom-home.png');
  });

  it('devuelve los campos de la forma base cuando formVarietyId no matchea ninguna selectableForm', () => {
    const entry = buildEntry([heatForm()]);
    const active = resolveActiveForm(entry, 'rotom-wash');
    expect(active.typePrimary).toBe(electric);
    expect(active.typeSecondary).toBeNull();
  });

  it('devuelve los campos de la SelectableForm encontrada cuando formVarietyId matchea', () => {
    const entry = buildEntry([heatForm(), iceForm()]);
    const active = resolveActiveForm(entry, 'rotom-heat');
    expect(active.typePrimary).toBe(electric);
    expect(active.typeSecondary).toBe(fire);
    expect(active.homeSpriteUrl).toBe('rotom-heat-home.png');
  });
});

describe('availableSelectableForms', () => {
  it('incluye siempre una forma sin requiresDlcId', () => {
    const entry = buildEntry([heatForm(null)]);
    expect(availableSelectableForms(entry, new Set())).toEqual([heatForm(null)]);
  });

  it('incluye una forma con requiresDlcId solo si ese DLC está activo', () => {
    const entry = buildEntry([heatForm('the-indigo-disk')]);
    expect(availableSelectableForms(entry, new Set())).toEqual([]);
    expect(availableSelectableForms(entry, new Set(['the-indigo-disk']))).toEqual([heatForm('the-indigo-disk')]);
  });

  it('con una entry de 3 formas — 2 sin requiresDlcId y 1 con requiresDlcId de un DLC inactivo — devuelve exactamente las 2 sin DLC, ni las 3 ni ninguna (spec.md FR-008)', () => {
    const free1 = heatForm(null);
    const free2 = iceForm(null);
    const gated = new SelectableForm(
      'rotom-fan',
      'Rotom Ventilador',
      'rotom-fan-game.png',
      'rotom-fan-home.png',
      null,
      null,
      null,
      'template',
      'the-indigo-disk',
      electric,
      null,
      stats,
    );
    const entry = buildEntry([free1, free2, gated]);
    const result = availableSelectableForms(entry, new Set());
    expect(result).toEqual([free1, free2]);
    expect(result.length).toBe(2);
  });
});

describe('resolveDisplayFormVarietyId', () => {
  it('devuelve storedFormVarietyId sin cambios si sigue en availableForms', () => {
    const forms = [heatForm(), iceForm()];
    expect(resolveDisplayFormVarietyId(forms, 'rotom-heat')).toBe('rotom-heat');
  });

  it('devuelve null si storedFormVarietyId ya no está en availableForms', () => {
    const forms = [iceForm()];
    expect(resolveDisplayFormVarietyId(forms, 'rotom-heat')).toBeNull();
  });

  it('devuelve null si storedFormVarietyId es null', () => {
    expect(resolveDisplayFormVarietyId([heatForm()], null)).toBeNull();
  });
});

/** `027` (research.md Decisión 3, contrato §1): función pura extraída de
 *  `PokemonDetailModalComponent.spriteUrl()`/`TeamSlotComponent.avatarImageUrl()`
 *  para no duplicarla una tercera vez. Opera sobre cualquier
 *  `ActiveFormPresentation` (una `SelectableForm` cumple esa forma
 *  estructuralmente, igual que `resolveActiveForm` ya asume). */
function fullSpriteForm(): SelectableForm {
  return new SelectableForm(
    'rotom-heat',
    'Rotom Calor',
    'rotom-heat-game.png',
    'home.png',
    'home-shiny.png',
    'home-female.png',
    'home-shiny-female.png',
    'template',
    null,
    electric,
    fire,
    stats,
  );
}

function baseSpriteOnlyForm(): SelectableForm {
  return new SelectableForm('rotom-heat', 'Rotom Calor', 'rotom-heat-game.png', 'home.png', null, null, null, 'template', null, electric, fire, stats);
}

function noSpriteForm(): SelectableForm {
  return new SelectableForm('rotom-heat', 'Rotom Calor', 'rotom-heat-game.png', null, null, null, null, 'template', null, electric, fire, stats);
}

describe('resolveFormSpriteUrl', () => {
  it('con los 4 sprites definidos, devuelve el específico para cada combinación género×shiny', () => {
    const form = fullSpriteForm();
    expect(resolveFormSpriteUrl(form, false, false)).toBe('home.png');
    expect(resolveFormSpriteUrl(form, true, false)).toBe('home-female.png');
    expect(resolveFormSpriteUrl(form, false, true)).toBe('home-shiny.png');
    expect(resolveFormSpriteUrl(form, true, true)).toBe('home-shiny-female.png');
  });

  it('sin sprites de variante de género/shiny, cae al sprite base para las 4 combinaciones', () => {
    const form = baseSpriteOnlyForm();
    expect(resolveFormSpriteUrl(form, false, false)).toBe('home.png');
    expect(resolveFormSpriteUrl(form, true, false)).toBe('home.png');
    expect(resolveFormSpriteUrl(form, false, true)).toBe('home.png');
    expect(resolveFormSpriteUrl(form, true, true)).toBe('home.png');
  });

  it('sin ningún sprite HOME definido, devuelve null', () => {
    const form = noSpriteForm();
    expect(resolveFormSpriteUrl(form, false, false)).toBeNull();
    expect(resolveFormSpriteUrl(form, true, true)).toBeNull();
  });
});
