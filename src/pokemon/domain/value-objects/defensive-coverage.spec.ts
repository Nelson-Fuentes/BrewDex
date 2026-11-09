import { Generation } from '../../../game/domain/value-objects/generation';
import { Move } from './move';
import { PokemonStats } from './pokemon-stats';
import { PokemonType } from './pokemon-type';
import { attackTypesForGeneration } from './type-effectiveness';
import { averageCoverageCoefficient, computeDefensiveCoverageRows } from './defensive-coverage';

const GEN_VI = new Generation('generation-vi', 'VI');
const GEN_UNKNOWN = new Generation('generation-desconocida', '?');

const NO_MOVES: readonly [null, null, null, null] = [null, null, null, null];

describe('computeDefensiveCoverageRows', () => {
  it('con dos tipos, multiplica la eficacia de la fila contra ambos tipos del Pokémon (FR-004)', () => {
    const grass = new PokemonType('grass', 'grass');
    const poisonType = new PokemonType('poison', 'poison');
    const stats = new PokemonStats(80, 70, 70, 65, 65, 60);

    const rows = computeDefensiveCoverageRows([grass, poisonType], stats, GEN_VI, NO_MOVES);

    expect(rows).not.toBeNull();
    const fireRow = rows!.find((r) => r.type.id === 'fire');
    // Fuego x2 a Planta, x1 a Veneno → eficacia combinada 2
    expect(fireRow!.efficacy).toBe(2);
  });

  it('con un solo tipo, no multiplica por un segundo factor (FR-005)', () => {
    // Nota de datos: Eléctrico NO tiene efecto sobre Tierra (0×) — es la dirección correcta
    // según la tabla de tipos real (Tierra, en cambio, es súper efectivo x2 contra Eléctrico,
    // la dirección inversa). El ejemplo de spec.md ("Tierra golpea 0 a Eléctrico") tenía la
    // dirección invertida; se usa acá el par correcto para el mismo caso límite (eficacia 0).
    const ground = new PokemonType('ground', 'ground');
    const stats = new PokemonStats(90, 60, 60, 90, 90, 90);

    const rows = computeDefensiveCoverageRows([ground], stats, GEN_VI, NO_MOVES);

    const electricRow = rows!.find((r) => r.type.id === 'electric');
    expect(electricRow!.efficacy).toBe(0);
  });

  it('usa 0.125 en vez de 0 como divisor del coeficiente de defensa cuando la eficacia es 0 (FR-006, edge case)', () => {
    const ground = new PokemonType('ground', 'ground');
    const stats = new PokemonStats(90, 60, 60, 90, 90, 90);

    const rows = computeDefensiveCoverageRows([ground], stats, GEN_VI, NO_MOVES);
    const electricRow = rows!.find((r) => r.type.id === 'electric');

    expect(electricRow!.efficacy).toBe(0);
    const expected = (((90 + 60) / 2 + 0.3 * 90) / 0.125);
    expect(electricRow!.defenseCoefficient).toBeCloseTo(expected, 5);
    expect(Number.isFinite(electricRow!.defenseCoefficient)).toBeTrue();
  });

  it('devuelve null cuando la generación no tiene una era de tipos reconocida (FR-012)', () => {
    const normal = new PokemonType('normal', 'normal');
    const stats = new PokemonStats(50, 50, 50, 50, 50, 50);

    expect(computeDefensiveCoverageRows([normal], stats, GEN_UNKNOWN, NO_MOVES)).toBeNull();
  });

  it('el orden de las filas devueltas coincide con attackTypesForGeneration (Clarifications Q1)', () => {
    const normal = new PokemonType('normal', 'normal');
    const stats = new PokemonStats(50, 50, 50, 50, 50, 50);

    const rows = computeDefensiveCoverageRows([normal], stats, GEN_VI, NO_MOVES);
    const expectedOrder = (attackTypesForGeneration(GEN_VI) ?? []).map((t) => t.id);

    expect(rows!.map((r) => r.type.id)).toEqual(expectedOrder);
  });

  it('conserva precisión decimal completa, sin redondear (Clarifications)', () => {
    const grass = new PokemonType('grass', 'grass');
    const poisonType = new PokemonType('poison', 'poison');
    // PS/defensas elegidas para producir un coeficiente de defensa no entero.
    const stats = new PokemonStats(71, 70, 68, 65, 65, 60);

    const rows = computeDefensiveCoverageRows([grass, poisonType], stats, GEN_VI, NO_MOVES);
    const fireRow = rows!.find((r) => r.type.id === 'fire');
    const expected = (((65 + 68) / 2 + 0.3 * 71) / 2);

    expect(fireRow!.defenseCoefficient).toBeCloseTo(expected, 10);
    expect(fireRow!.defenseCoefficient).not.toBe(Math.round(fireRow!.defenseCoefficient));
  });

  it('recalcula correctamente ante un cambio de tipos/estadísticas (simula un cambio de forma, FR-010/SC-004, remediación C1)', () => {
    const grass = new PokemonType('grass', 'grass');
    const poisonType = new PokemonType('poison', 'poison');
    const fireType = new PokemonType('fire', 'fire');
    const statsBefore = new PokemonStats(80, 70, 70, 65, 65, 60);
    const statsAfter = new PokemonStats(100, 90, 90, 85, 85, 80);

    const before = computeDefensiveCoverageRows([grass, poisonType], statsBefore, GEN_VI, NO_MOVES);
    const after = computeDefensiveCoverageRows([fireType], statsAfter, GEN_VI, NO_MOVES);

    const beforeFireRow = before!.find((r) => r.type.id === 'fire')!;
    const afterFireRow = after!.find((r) => r.type.id === 'fire')!;

    // Distintos tipos/stats deben producir resultados distintos, no una reutilización del primer cómputo.
    expect(afterFireRow.efficacy).not.toBe(beforeFireRow.efficacy);
    expect(afterFireRow.defenseCoefficient).not.toBe(beforeFireRow.defenseCoefficient);
    // El segundo cómputo, con un solo tipo (Fuego), no debe llevar rastros del primero (dos tipos):
    // la fila "grass" (Planta ataca a Fuego) debe dar 0.5, el factor simple contra un único tipo.
    const grassRowAfter = after!.find((r) => r.type.id === 'grass')!;
    expect(grassRowAfter.efficacy).toBe(0.5);
  });
});

describe('computeDefensiveCoverageRows — coeficiente de ataque (spec 024)', () => {
  // Charizard-like: [fire, flying], stats (hp, attack, defense, specialAttack, specialDefense, speed).
  const fireType = new PokemonType('fire', 'fire');
  const flyingType = new PokemonType('flying', 'flying');
  const groundType = new PokemonType('ground', 'ground');
  const normalType = new PokemonType('normal', 'normal');
  const pokemonTypes: readonly [PokemonType, PokemonType] = [fireType, flyingType];
  const stats = new PokemonStats(78, 84, 78, 109, 85, 100);

  const flamethrower = new Move('flamethrower', 'Lanzallamas', fireType, 'special', 15, 90, '', 100);
  const earthquake = new Move('earthquake', 'Terremoto', groundType, 'physical', 10, 100, '', 100);
  const wingAttack = new Move('wing-attack', 'Ataque Ala', flyingType, 'physical', 35, 60, '', 100);
  const swordsDance = new Move('swords-dance', 'Danza Espada', normalType, 'status', 20, null, '', null);

  it('un movimiento físico usa el ataque físico base; uno especial usa el ataque especial base (FR-003)', () => {
    const rows = computeDefensiveCoverageRows(pokemonTypes, stats, GEN_VI, [flamethrower, earthquake, null, null]);
    const grassRow = rows!.find((r) => r.type.id === 'grass')!;

    // Lanzallamas (especial, fuego, STAB 1.5, fuego→planta = x2): (109 + 0.2*100) * (90/100) * 1.5 * 2
    expect(grassRow.attackCoefficients[0]).toBeCloseTo((109 + 0.2 * 100) * (90 / 100) * 1.5 * 2, 5);
    // Terremoto (físico, tierra, sin STAB, tierra→planta = x0.5): (84 + 0.2*100) * (100/100) * 1 * 0.5
    expect(grassRow.attackCoefficients[1]).toBeCloseTo((84 + 0.2 * 100) * (100 / 100) * 1 * 0.5, 5);
  });

  it('aplica STAB 1.5 cuando el tipo del movimiento coincide con uno de los tipos del Pokémon, 1 en caso contrario', () => {
    const rows = computeDefensiveCoverageRows(pokemonTypes, stats, GEN_VI, [flamethrower, earthquake, null, null]);
    const normalRow = rows!.find((r) => r.type.id === 'normal')!;

    // fuego→normal = x1, STAB 1.5 (fire ∈ pokemonTypes)
    expect(normalRow.attackCoefficients[0]).toBeCloseTo((109 + 20) * (90 / 100) * 1.5 * 1, 5);
    // tierra→normal = x1, sin STAB (ground ∉ pokemonTypes)
    expect(normalRow.attackCoefficients[1]).toBeCloseTo((84 + 20) * (100 / 100) * 1 * 1, 5);
  });

  it('una eficacia 0 en la fórmula de ataque produce 0, sin el reemplazo 0.125 (FR-010)', () => {
    // Tierra no tiene efecto sobre Volador (0x).
    const flyingRowMove = new Move('earthquake', 'Terremoto', groundType, 'physical', 10, 100, '', 100);
    const rows = computeDefensiveCoverageRows(pokemonTypes, stats, GEN_VI, [flyingRowMove, null, null, null]);
    const flyingRow = rows!.find((r) => r.type.id === 'flying')!;

    expect(flyingRow.attackCoefficients[0]).toBe(0);
  });

  it('un slot vacío o un movimiento de clase estado produce null, nunca 0 (FR-004)', () => {
    const rows = computeDefensiveCoverageRows(pokemonTypes, stats, GEN_VI, [swordsDance, null, flamethrower, null]);
    const someRow = rows!.find((r) => r.type.id === 'grass')!;

    expect(someRow.attackCoefficients[0]).toBeNull();
    expect(someRow.attackCoefficients[1]).toBeNull();
    expect(someRow.attackCoefficients[2]).not.toBeNull();
    expect(someRow.attackCoefficients[3]).toBeNull();
  });

  it('row.attackCoefficients.length siempre coincide con moveSlots.length', () => {
    const rows = computeDefensiveCoverageRows(pokemonTypes, stats, GEN_VI, [flamethrower, null, null, null]);
    for (const row of rows!) {
      expect(row.attackCoefficients.length).toBe(4);
    }
  });

  it('el promedio divide solo entre los movimientos físicos/especiales calculables, no un 4 fijo (FR-005/FR-006)', () => {
    const rows4Calculable = computeDefensiveCoverageRows(pokemonTypes, stats, GEN_VI, [
      flamethrower,
      earthquake,
      flamethrower,
      earthquake,
    ])!;
    const grassRow4 = rows4Calculable.find((r) => r.type.id === 'grass')!;
    const expectedAvg4 =
      grassRow4.attackCoefficients.reduce((sum: number, c) => sum + (c ?? 0), 0) / grassRow4.attackCoefficients.length;
    expect(grassRow4.averageAttackCoefficient).toBeCloseTo(expectedAvg4, 5);

    const rows3Calculable = computeDefensiveCoverageRows(pokemonTypes, stats, GEN_VI, [
      flamethrower,
      earthquake,
      wingAttack,
      swordsDance,
    ])!;
    const grassRow3 = rows3Calculable.find((r) => r.type.id === 'grass')!;
    // 3 movimientos son físicos/especiales (slot 3 = estado) → divisor 3, no 4.
    const expectedAvg3 =
      (grassRow3.attackCoefficients[0]! + grassRow3.attackCoefficients[1]! + grassRow3.attackCoefficients[2]!) / 3;
    expect(grassRow3.attackCoefficients[3]).toBeNull();
    expect(grassRow3.averageAttackCoefficient).toBeCloseTo(expectedAvg3, 5);

    const rows2Calculable = computeDefensiveCoverageRows(pokemonTypes, stats, GEN_VI, [
      flamethrower,
      null,
      null,
      swordsDance,
    ])!;
    const grassRow2 = rows2Calculable.find((r) => r.type.id === 'grass')!;
    expect(grassRow2.averageAttackCoefficient).toBeCloseTo(grassRow2.attackCoefficients[0]!, 5);
  });

  it('cuando ningún movimiento equipado es físico/especial, el promedio es null sin dividir entre cero (FR-006)', () => {
    const rows = computeDefensiveCoverageRows(pokemonTypes, stats, GEN_VI, [swordsDance, null, null, null])!;
    for (const row of rows) {
      expect(row.averageAttackCoefficient).toBeNull();
    }
  });

  it('ejemplo del contrato: fila grass con Lanzallamas + Terremoto da un promedio de 200.15 (contracts/defensive-coverage-attack.md)', () => {
    const rows = computeDefensiveCoverageRows(pokemonTypes, stats, GEN_VI, [flamethrower, earthquake, swordsDance, null])!;
    const grassRow = rows.find((r) => r.type.id === 'grass')!;

    expect(grassRow.attackCoefficients[0]).toBeCloseTo(348.3, 5);
    expect(grassRow.attackCoefficients[1]).toBeCloseTo(52, 5);
    expect(grassRow.attackCoefficients[2]).toBeNull();
    expect(grassRow.attackCoefficients[3]).toBeNull();
    expect(grassRow.averageAttackCoefficient).toBeCloseTo(200.15, 5);
  });
});

describe('computeDefensiveCoverageRows — coeficiente de cobertura (spec 025)', () => {
  // Mismo Charizard-like de la spec `024`: [fire, flying], stats (hp, attack, defense, specialAttack, specialDefense, speed).
  const fireType = new PokemonType('fire', 'fire');
  const flyingType = new PokemonType('flying', 'flying');
  const groundType = new PokemonType('ground', 'ground');
  const normalType = new PokemonType('normal', 'normal');
  const pokemonTypes: readonly [PokemonType, PokemonType] = [fireType, flyingType];
  const stats = new PokemonStats(78, 84, 78, 109, 85, 100);

  const flamethrower = new Move('flamethrower', 'Lanzallamas', fireType, 'special', 15, 90, '', 100);
  const earthquake = new Move('earthquake', 'Terremoto', groundType, 'physical', 10, 100, '', 100);
  const swordsDance = new Move('swords-dance', 'Danza Espada', normalType, 'status', 20, null, '', null);

  it('con averageAttackCoefficient numérico, usa la media armónica entre defenseCoefficient y averageAttackCoefficient (FR-002, US1 Acceptance Scenario 1)', () => {
    const rows = computeDefensiveCoverageRows(pokemonTypes, stats, GEN_VI, [flamethrower, earthquake, swordsDance, null])!;
    const grassRow = rows.find((r) => r.type.id === 'grass')!;

    // Ejemplo del contrato (contracts/defensive-coverage-total.md): averageAttackCoefficient = 200.15.
    expect(grassRow.averageAttackCoefficient).toBeCloseTo(200.15, 5);
    const expected = (2 * grassRow.defenseCoefficient * grassRow.averageAttackCoefficient!) / (grassRow.defenseCoefficient + grassRow.averageAttackCoefficient!);
    expect(grassRow.coverageCoefficient).toBeCloseTo(expected, 10);
  });

  it('cuando averageAttackCoefficient es 0 (movimientos ofensivos equipados pero eficacia 0 contra esa fila), coverageCoefficient es 0 (Edge Case, distinto del caso "sin movimientos ofensivos")', () => {
    // Tierra no tiene efecto sobre Volador (0x) — un movimiento ofensivo equipado, promedio 0.
    const groundMove = new Move('earthquake', 'Terremoto', groundType, 'physical', 10, 100, '', 100);
    const rows = computeDefensiveCoverageRows(pokemonTypes, stats, GEN_VI, [groundMove, null, null, null])!;
    const flyingRow = rows.find((r) => r.type.id === 'flying')!;

    expect(flyingRow.averageAttackCoefficient).toBe(0);
    expect(flyingRow.coverageCoefficient).toBe(0);
  });

  it('coverageCoefficient nunca es null ni NaN, incluso cuando averageAttackCoefficient sí lo es', () => {
    const rows = computeDefensiveCoverageRows(pokemonTypes, stats, GEN_VI, [swordsDance, null, null, null])!;
    for (const row of rows) {
      expect(row.averageAttackCoefficient).toBeNull();
      expect(row.coverageCoefficient).not.toBeNull();
      expect(Number.isFinite(row.coverageCoefficient)).toBeTrue();
    }
  });

  it('cuando averageAttackCoefficient es null (sin movimientos ofensivos equipados: slots vacíos, de estado, o ambos), coverageCoefficient === defenseCoefficient / 2, nunca null (FR-003, US2 Acceptance Scenarios 1-2)', () => {
    const allEmpty = computeDefensiveCoverageRows(pokemonTypes, stats, GEN_VI, [null, null, null, null])!;
    const allStatus = computeDefensiveCoverageRows(pokemonTypes, stats, GEN_VI, [swordsDance, swordsDance, swordsDance, swordsDance])!;
    const mixed = computeDefensiveCoverageRows(pokemonTypes, stats, GEN_VI, [swordsDance, swordsDance, swordsDance, null])!;

    for (const rows of [allEmpty, allStatus, mixed]) {
      for (const row of rows) {
        expect(row.averageAttackCoefficient).toBeNull();
        expect(row.coverageCoefficient).toBeCloseTo(row.defenseCoefficient / 2, 10);
        expect(row.coverageCoefficient).not.toBeNull();
        expect(Number.isFinite(row.coverageCoefficient)).toBeTrue();
      }
    }
  });

  it('conserva precisión decimal completa, sin redondear (FR-005)', () => {
    const rows = computeDefensiveCoverageRows(pokemonTypes, stats, GEN_VI, [flamethrower, earthquake, null, null])!;
    const grassRow = rows.find((r) => r.type.id === 'grass')!;

    expect(grassRow.coverageCoefficient).not.toBe(Math.round(grassRow.coverageCoefficient));
  });
});

// `026-team-slot-coverage-index`, T002 (Foundational): extracción de la media aritmética que
// `CoverageAnalysisTableComponent.totalCoverageCoefficient` ya calculaba inline (`025`), ahora
// reutilizable también desde `TeamBuilderPage` (research.md Decisión 2).
describe('averageCoverageCoefficient', () => {
  const fireType = new PokemonType('fire', 'fire');
  const flyingType = new PokemonType('flying', 'flying');
  const pokemonTypes: readonly [PokemonType, PokemonType] = [fireType, flyingType];
  const stats = new PokemonStats(78, 84, 78, 109, 85, 100);
  const groundType = new PokemonType('ground', 'ground');
  const normalType = new PokemonType('normal', 'normal');
  const flamethrower = new Move('flamethrower', 'Lanzallamas', fireType, 'special', 15, 90, '', 100);
  const earthquake = new Move('earthquake', 'Terremoto', groundType, 'physical', 10, 100, '', 100);
  const swordsDance = new Move('swords-dance', 'Danza Espada', normalType, 'status', 20, null, '', null);

  it('devuelve la media aritmética exacta de coverageCoefficient sobre todas las filas', () => {
    const rows = computeDefensiveCoverageRows(pokemonTypes, stats, GEN_VI, [flamethrower, earthquake, swordsDance, null])!;
    const expected = rows.reduce((sum, row) => sum + row.coverageCoefficient, 0) / rows.length;

    expect(averageCoverageCoefficient(rows)).toBeCloseTo(expected, 10);
  });

  it('coincide con el mismo total ya validado por el contrato de `025` (contracts/defensive-coverage-total.md)', () => {
    // Mismo Charizard-like y mismo moveset que el resto de este describe (`grassRow` con
    // averageAttackCoefficient = 200.15) — el total es la media aritmética de las 18 filas.
    const rows = computeDefensiveCoverageRows(pokemonTypes, stats, GEN_VI, [flamethrower, earthquake, swordsDance, null])!;
    const manualTotal = rows.map((r) => r.coverageCoefficient).reduce((sum, v) => sum + v, 0) / rows.length;

    expect(averageCoverageCoefficient(rows)).toBeCloseTo(manualTotal, 10);
  });

  it('nunca es null ni NaN, incluso cuando ninguna fila tiene averageAttackCoefficient numérico', () => {
    const rows = computeDefensiveCoverageRows(pokemonTypes, stats, GEN_VI, [swordsDance, null, null, null])!;

    const result = averageCoverageCoefficient(rows);
    expect(result).not.toBeNull();
    expect(Number.isFinite(result)).toBeTrue();
  });
});
