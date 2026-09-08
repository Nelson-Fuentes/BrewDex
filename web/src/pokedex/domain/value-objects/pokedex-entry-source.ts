/**
 * Por qué una `PokedexEntry` (módulo `pokemon`) está visible ahora mismo —
 * distingue "viene de la lista base (regional o nacional)" de "la agregó
 * un DLC activo", sin tener que re-derivarlo.
 */
export type PokedexEntrySource =
  | { readonly kind: 'regional' }
  | { readonly kind: 'national' }
  | { readonly kind: 'dlc'; readonly dlcId: string };
