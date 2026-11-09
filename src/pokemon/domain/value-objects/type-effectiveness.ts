import type { Generation } from '../../../game/domain/value-objects/generation';
import { PokemonType } from './pokemon-type';

/**
 * La tabla de eficacia de tipos no cambió en cada generación individual —
 * solo en dos saltos históricos: la incorporación de Acero/Siniestro (2ª
 * generación) y de Hada (6ª generación), más las particularidades propias
 * de la 1ª generación. Por eso se modela como tres "eras" fijas, no una
 * tabla por generación (spec `023`, research.md — Decisión "Modelo de
 * eras").
 *
 * Value object de dominio puro: sin imports de Angular/HTTP (Constitución
 * Principio VI).
 */
export type TypeEffectivenessEra = 'gen-i' | 'gen-ii-v' | 'gen-vi-plus';

/** Multiplicador posible en la tabla oficial de eficacia de tipos. */
type Multiplier = 0 | 0.5 | 1 | 2;

/** Fila de la tabla: tipo defensor → multiplicador. Los tipos ausentes son
 *  implícitamente `1` (eficacia neutral). */
type EffectivenessRow = Readonly<Record<string, Multiplier>>;

/** La tabla completa: tipo atacante → su fila. */
type EffectivenessChart = Readonly<Record<string, EffectivenessRow>>;

/** Los 18 tipos con su id numérico oficial de PokeAPI (mismo id que usa el
 *  repositorio de íconos de tipo, ver `pokemon-type.ts`). */
const TYPE = {
  normal: new PokemonType('normal', 'normal', 1),
  fighting: new PokemonType('fighting', 'fighting', 2),
  flying: new PokemonType('flying', 'flying', 3),
  poison: new PokemonType('poison', 'poison', 4),
  ground: new PokemonType('ground', 'ground', 5),
  rock: new PokemonType('rock', 'rock', 6),
  bug: new PokemonType('bug', 'bug', 7),
  ghost: new PokemonType('ghost', 'ghost', 8),
  steel: new PokemonType('steel', 'steel', 9),
  fire: new PokemonType('fire', 'fire', 10),
  water: new PokemonType('water', 'water', 11),
  grass: new PokemonType('grass', 'grass', 12),
  electric: new PokemonType('electric', 'electric', 13),
  psychic: new PokemonType('psychic', 'psychic', 14),
  ice: new PokemonType('ice', 'ice', 15),
  dragon: new PokemonType('dragon', 'dragon', 16),
  dark: new PokemonType('dark', 'dark', 17),
  fairy: new PokemonType('fairy', 'fairy', 18),
} as const;

/** Orden fijo de los 18 tipos (Clarifications Q1 de spec `023`) — el mismo
 *  orden numérico oficial de PokeAPI, usado también como base para las dos
 *  eras anteriores (filtrando los tipos que aún no existían). */
const GEN_VI_PLUS_TYPES: readonly PokemonType[] = [
  TYPE.normal,
  TYPE.fighting,
  TYPE.flying,
  TYPE.poison,
  TYPE.ground,
  TYPE.rock,
  TYPE.bug,
  TYPE.ghost,
  TYPE.steel,
  TYPE.fire,
  TYPE.water,
  TYPE.grass,
  TYPE.electric,
  TYPE.psychic,
  TYPE.ice,
  TYPE.dragon,
  TYPE.dark,
  TYPE.fairy,
];

const GEN_II_V_TYPES: readonly PokemonType[] = GEN_VI_PLUS_TYPES.filter((t) => t.id !== 'fairy');

const GEN_I_TYPES: readonly PokemonType[] = GEN_II_V_TYPES.filter((t) => t.id !== 'steel' && t.id !== 'dark');

/**
 * Tabla de eficacia de tipos de la Era VI en adelante (generación VI a IX
 * a la fecha), transcrita y verificada por doble chequeo cruzado (research.md,
 * Decisión "Transcripción") contra la tabla de tipos oficial: cada fila lista
 * únicamente los multiplicadores distintos de `1` (neutral).
 */
const GEN_VI_PLUS_CHART: EffectivenessChart = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  flying: { fighting: 2, bug: 2, grass: 2, electric: 0.5, rock: 0.5, steel: 0.5 },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  rock: { fire: 2, ice: 2, flying: 2, bug: 2, fighting: 0.5, ground: 0.5, steel: 0.5 },
  bug: { grass: 2, psychic: 2, dark: 2, fighting: 0.5, flying: 0.5, poison: 0.5, ghost: 0.5, steel: 0.5, fire: 0.5, fairy: 0.5 },
  ghost: { ghost: 2, psychic: 2, normal: 0, dark: 0.5 },
  steel: { ice: 2, rock: 2, fairy: 2, fire: 0.5, water: 0.5, electric: 0.5, steel: 0.5 },
  fire: { grass: 2, ice: 2, bug: 2, steel: 2, fire: 0.5, water: 0.5, rock: 0.5, dragon: 0.5 },
  water: { fire: 2, ground: 2, rock: 2, water: 0.5, grass: 0.5, dragon: 0.5 },
  grass: { water: 2, ground: 2, rock: 2, grass: 0.5, fire: 0.5, poison: 0.5, flying: 0.5, bug: 0.5, dragon: 0.5, steel: 0.5 },
  electric: { water: 2, flying: 2, electric: 0.5, grass: 0.5, dragon: 0.5, ground: 0 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  ice: { grass: 2, ground: 2, flying: 2, dragon: 2, ice: 0.5, fire: 0.5, water: 0.5, steel: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { psychic: 2, ghost: 2, fighting: 0.5, dark: 0.5, fairy: 0.5 },
  fairy: { fighting: 2, dragon: 2, dark: 2, poison: 0.5, steel: 0.5, fire: 0.5 },
};

/** Elimina un tipo de la tabla, tanto como fila atacante como como entrada
 *  defensora en cualquier otra fila. */
function withoutType(chart: EffectivenessChart, typeId: string): EffectivenessChart {
  const result: Record<string, EffectivenessRow> = {};
  for (const [attackId, row] of Object.entries(chart)) {
    if (attackId === typeId) continue;
    const newRow: Record<string, Multiplier> = {};
    for (const [defendId, value] of Object.entries(row)) {
      if (defendId === typeId) continue;
      newRow[defendId] = value;
    }
    result[attackId] = newRow;
  }
  return result;
}

/** Sobrescribe (o agrega) un único multiplicador `attackId → defendId`. */
function withOverride(chart: EffectivenessChart, attackId: string, defendId: string, value: Multiplier): EffectivenessChart {
  return {
    ...chart,
    [attackId]: { ...chart[attackId], [defendId]: value },
  };
}

/**
 * Tabla de la Era II–V: idéntica a la Era VI+ salvo por las dos diferencias
 * documentadas — Hada no existía todavía, y Acero resistía Fantasma y
 * Siniestro (dejó de hacerlo en la Era VI).
 */
const GEN_II_V_CHART: EffectivenessChart = withOverride(
  withOverride(withoutType(GEN_VI_PLUS_CHART, 'fairy'), 'ghost', 'steel', 0.5),
  'dark',
  'steel',
  0.5,
);

/**
 * Tabla de la Era I: Acero y Siniestro todavía no existían, más dos
 * particularidades bien documentadas de la primera generación —
 * Bicho era súper efectivo contra Veneno (se volvió no muy efectivo desde
 * la Era II–V), y un error de programación hacía que Fantasma no tuviera
 * ningún efecto sobre Psíquico (corregido desde la Era II–V, donde vuelve a
 * ser súper efectivo).
 */
const GEN_I_CHART: EffectivenessChart = withOverride(
  withOverride(withoutType(withoutType(GEN_II_V_CHART, 'steel'), 'dark'), 'bug', 'poison', 2),
  'ghost',
  'psychic',
  0,
);

function chartForEra(era: TypeEffectivenessEra): EffectivenessChart {
  switch (era) {
    case 'gen-i':
      return GEN_I_CHART;
    case 'gen-ii-v':
      return GEN_II_V_CHART;
    case 'gen-vi-plus':
      return GEN_VI_PLUS_CHART;
  }
}

function typesForEra(era: TypeEffectivenessEra): readonly PokemonType[] {
  switch (era) {
    case 'gen-i':
      return GEN_I_TYPES;
    case 'gen-ii-v':
      return GEN_II_V_TYPES;
    case 'gen-vi-plus':
      return GEN_VI_PLUS_TYPES;
  }
}

const ERA_I_IDS = new Set(['generation-i']);
const ERA_II_V_IDS = new Set(['generation-ii', 'generation-iii', 'generation-iv', 'generation-v']);
/** Cualquier id con la forma `generation-<numeral romano>` que no sea de la
 *  Era I ni de la Era II-V se trata como Era VI+ — mapeo **abierto**, no una
 *  lista cerrada, para que una generación futura (p. ej. `generation-x`)
 *  siga resolviendo correctamente sin tener que tocar este archivo
 *  (research.md, Decisión "Modelo de eras"; spec `023` remediación C2 de
 *  `/speckit-analyze`). */
const GENERATION_ID_PATTERN = /^generation-[ivxlcdm]+$/;

/** La era de tabla de tipos correspondiente a `generation`, o `null` si su
 *  `id` no tiene la forma reconocida `generation-<numeral romano>` (FR-012). */
export function resolveTypeEffectivenessEra(generation: Generation): TypeEffectivenessEra | null {
  const id = generation.id;
  if (ERA_I_IDS.has(id)) {
    return 'gen-i';
  }
  if (ERA_II_V_IDS.has(id)) {
    return 'gen-ii-v';
  }
  if (GENERATION_ID_PATTERN.test(id)) {
    return 'gen-vi-plus';
  }
  return null;
}

/** Los tipos de ataque válidos (filas de la tabla) para la era de tipos de
 *  `generation`, en el orden fijo de esa era (FR-002, Clarifications Q1);
 *  `null` si `generation` no tiene una era reconocida (FR-012). */
export function attackTypesForGeneration(generation: Generation): readonly PokemonType[] | null {
  const era = resolveTypeEffectivenessEra(generation);
  return era === null ? null : typesForEra(era);
}

/** El multiplicador de daño (siempre `0`, `0.5`, `1` o `2`) que `attackType`
 *  inflige a `defendType` en la tabla de tipos de `era` (FR-003). */
export function typeEffectivenessMultiplier(attackType: PokemonType, defendType: PokemonType, era: TypeEffectivenessEra): number {
  const row = chartForEra(era)[attackType.id];
  return row?.[defendType.id] ?? 1;
}
