/**
 * Paleta de color por tipo de Pokémon — puramente de presentación (no es
 * un dato de PokeAPI). Un tipo desconocido cae a un gris neutro en vez de
 * romper el render.
 */
export const POKEMON_TYPE_COLORS: Readonly<Record<string, string>> = {
  normal: '#A8A77A',
  fire: '#EE8130',
  water: '#6390F0',
  electric: '#F7D02C',
  grass: '#7AC74C',
  ice: '#96D9D6',
  fighting: '#C22E28',
  poison: '#A33EA1',
  ground: '#E2BF65',
  flying: '#A98FF3',
  psychic: '#F95587',
  bug: '#A6B91A',
  rock: '#B6A136',
  ghost: '#735797',
  dragon: '#6F35FC',
  dark: '#705746',
  steel: '#B7B7CE',
  fairy: '#D685AD',
};

const DEFAULT_TYPE_COLOR = '#8A8A99';

export function colorForType(typeId: string): string {
  return POKEMON_TYPE_COLORS[typeId] ?? DEFAULT_TYPE_COLOR;
}

export function rgbaForType(typeId: string, alpha = 0.2): string {
  const hex = colorForType(typeId).replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) || 138;
  const g = parseInt(hex.substring(2, 4), 16) || 138;
  const b = parseInt(hex.substring(4, 6), 16) || 153;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

