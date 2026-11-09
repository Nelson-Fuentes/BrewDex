import { Generation } from '../../../game/domain/value-objects/generation';
import { PokemonType } from './pokemon-type';
import { attackTypesForGeneration, typeEffectivenessMultiplier } from './type-effectiveness';

function typeIdsOf(types: readonly PokemonType[] | null): readonly string[] {
  return (types ?? []).map((t) => t.id);
}

describe('attackTypesForGeneration', () => {
  it('generación I: 15 tipos, sin acero/siniestro/hada', () => {
    const ids = typeIdsOf(attackTypesForGeneration(new Generation('generation-i', 'I')));
    expect(ids.length).toBe(15);
    expect(ids).not.toContain('steel');
    expect(ids).not.toContain('dark');
    expect(ids).not.toContain('fairy');
  });

  it('generaciones II a V: 17 tipos, con acero/siniestro, sin hada', () => {
    for (const id of ['generation-ii', 'generation-iii', 'generation-iv', 'generation-v']) {
      const ids = typeIdsOf(attackTypesForGeneration(new Generation(id, id)));
      expect(ids.length).withContext(id).toBe(17);
      expect(ids).withContext(id).toContain('steel');
      expect(ids).withContext(id).toContain('dark');
      expect(ids).withContext(id).not.toContain('fairy');
    }
  });

  it('generación VI en adelante (incluida IX): 18 tipos, con acero/siniestro/hada', () => {
    for (const id of ['generation-vi', 'generation-vii', 'generation-viii', 'generation-ix']) {
      const ids = typeIdsOf(attackTypesForGeneration(new Generation(id, id)));
      expect(ids.length).withContext(id).toBe(18);
      expect(ids).withContext(id).toContain('steel');
      expect(ids).withContext(id).toContain('dark');
      expect(ids).withContext(id).toContain('fairy');
    }
  });

  it('un id de generación no reconocido en absoluto devuelve null (FR-012)', () => {
    expect(attackTypesForGeneration(new Generation('generation-desconocida', '?'))).toBeNull();
  });

  it('una generación futura no enumerada explícitamente (p. ej. generation-x) sigue resolviendo a la Era VI+ (mapeo abierto, remediación C2)', () => {
    const ids = typeIdsOf(attackTypesForGeneration(new Generation('generation-x', 'X')));
    expect(ids.length).toBe(18);
    expect(ids).toContain('fairy');
  });

  it('devuelve el mismo orden estable en dos llamadas para la misma era', () => {
    const first = typeIdsOf(attackTypesForGeneration(new Generation('generation-vi', 'VI')));
    const second = typeIdsOf(attackTypesForGeneration(new Generation('generation-vi', 'VI')));
    expect(first).toEqual(second);
  });
});

describe('typeEffectivenessMultiplier', () => {
  const fire = new PokemonType('fire', 'fire');
  const grass = new PokemonType('grass', 'grass');
  const water = new PokemonType('water', 'water');
  const normal = new PokemonType('normal', 'normal');
  const ground = new PokemonType('ground', 'ground');
  const electric = new PokemonType('electric', 'electric');
  const ghost = new PokemonType('ghost', 'ghost');
  const psychic = new PokemonType('psychic', 'psychic');
  const bug = new PokemonType('bug', 'bug');
  const poison = new PokemonType('poison', 'poison');
  const dark = new PokemonType('dark', 'dark');
  const steel = new PokemonType('steel', 'steel');

  it('ejemplos del contrato en la Era VI+', () => {
    expect(typeEffectivenessMultiplier(fire, grass, 'gen-vi-plus')).toBe(2);
    expect(typeEffectivenessMultiplier(fire, water, 'gen-vi-plus')).toBe(0.5);
    expect(typeEffectivenessMultiplier(fire, normal, 'gen-vi-plus')).toBe(1);
    // Tierra es súper efectivo contra Eléctrico (no al revés — ver nota de datos
    // en defensive-coverage.spec.ts); la eficacia 0 real de este par es
    // Eléctrico→Tierra, cubierta en el siguiente `it`.
    expect(typeEffectivenessMultiplier(ground, electric, 'gen-vi-plus')).toBe(2);
    expect(typeEffectivenessMultiplier(electric, ground, 'gen-vi-plus')).toBe(0);
  });

  it('el resultado siempre es uno de {0, 0.5, 1, 2}', () => {
    const result = typeEffectivenessMultiplier(fire, grass, 'gen-vi-plus');
    expect([0, 0.5, 1, 2]).toContain(result);
  });

  it('particularidad de la Era I: Fantasma no tiene efecto sobre Psíquico (bug histórico de Gen 1)', () => {
    expect(typeEffectivenessMultiplier(ghost, psychic, 'gen-i')).toBe(0);
    // En eras posteriores el bug está corregido: Fantasma es súper efectivo contra Psíquico.
    expect(typeEffectivenessMultiplier(ghost, psychic, 'gen-ii-v')).toBe(2);
    expect(typeEffectivenessMultiplier(ghost, psychic, 'gen-vi-plus')).toBe(2);
  });

  it('particularidad de la Era I: Bicho es súper efectivo contra Veneno (cambia a partir de la Era II-V)', () => {
    expect(typeEffectivenessMultiplier(bug, poison, 'gen-i')).toBe(2);
    expect(typeEffectivenessMultiplier(bug, poison, 'gen-ii-v')).toBe(0.5);
    expect(typeEffectivenessMultiplier(bug, poison, 'gen-vi-plus')).toBe(0.5);
  });

  it('cambio de Acero en la Era VI+ frente a la Era II-V: Siniestro vs. Acero deja de ser resistido', () => {
    expect(typeEffectivenessMultiplier(dark, steel, 'gen-ii-v')).toBe(0.5);
    expect(typeEffectivenessMultiplier(dark, steel, 'gen-vi-plus')).toBe(1);
  });
});
