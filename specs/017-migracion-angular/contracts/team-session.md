# Contract: `TeamStore` (módulo `team`, servicio de aplicación — no un puerto de dominio)

A diferencia de los demás contratos, este no es una interfaz que un adaptador externo implemente — es la API pública que la capa de aplicación de `team` expone a la presentación, reemplazando a `TeamBuilderCubit`. Se documenta aquí porque otros componentes (presentación) y tests dependen de su forma exacta. Para el estado de navegación/filtrado del Pokédex (`pokedexView`, `filterCriteria`, `pokedexIndex`, `pokedexDetailsById`) ver `PokedexStore` en [[pokedex.md]] — módulo distinto ([[../research.md]] Decisión 11).

```ts
export interface TeamStore {
  /** Longitud fija MAX_TEAM_SIZE (6). Una posición null = slot vacío. */
  readonly slots: Signal<ReadonlyArray<RosterEntry | null>>;

  /** FR-010/FR-011: ocupa el primer slot vacío; no-op con aviso si ya
   *  hay MAX_TEAM_SIZE ocupados. entry viene del PokedexStore (módulo
   *  pokedex) — team no vuelve a resolver el detalle por su cuenta. */
  addPokemonToTeam(entry: PokedexEntry): void;

  /** FR-012: vacía el slot en el índice dado. */
  removePokemonFromTeam(slotIndex: number): void;

  /** FR-013: aplica una forma/variante distinta a un slot ya ocupado. */
  selectForm(slotIndex: number, form: SelectableForm): void;

  /** FR-014: reemplaza un movimiento de un slot ya ocupado (0-3). */
  selectMove(slotIndex: number, moveSlot: 0 | 1 | 2 | 3, move: Move | null): void;
}
```

**Invariantes** (verificadas por tests unitarios antes de implementar — Principio II):

- `slots.length` es siempre `MAX_TEAM_SIZE`; nunca crece ni encoge.
- `addPokemonToTeam` con los 6 slots ocupados no muta `slots` y expone un motivo de rechazo observable por la presentación (FR-011).
- `RosterEntry.moveIds` nunca contiene el mismo id no-nulo dos veces (FR-014, invariante impuesta aquí, no en el value object).
- Ningún método de este servicio lee ni escribe en `localStorage`/`indexedDB`/cookies — el estado vive solo en signals en memoria (FR-015).

## Reconciliación al cambiar de juego

`team` se suscribe al signal `activeGame` de `GameStore` (módulo `game`, [[game-catalog.md]]). Al detectar un cambio, si `slots` no está vacío, expone una confirmación pendiente hacia la presentación (FR-016) antes de vaciar `slots` — nunca reconcilia en silencio.
