# Contract: `MovepoolRepository` (módulo `pokemon`)

```ts
export interface MovepoolRepository {
  /** Movimientos que varietyId puede aprender en game, filtrado al
   *  version-group exacto de game (nunca un juego hermano de la misma
   *  generación). [] es una respuesta válida (no aprende nada);
   *  lanza PokedexUnavailable si la fuente falla. */
  fetchMovepool(varietyId: string, game: Game, languageCode: string): Promise<Move[]>;

  /** Hasta 4 movimientos por nivel más alto que varietyId aprende en
   *  game, orden ascendente por nivel — nunca incluye un movimiento
   *  aprendido solo por otro método (MT, huevo, tutor). [] = no
   *  aprende nada por nivel en ese juego. Alimenta el moveset por
   *  defecto que ve la persona al agregar un Pokémon (FR-014). */
  fetchDefaultMoveset(varietyId: string, game: Game, languageCode: string): Promise<Move[]>;
}
```

Implementación: `PokeApiMovepoolRepositoryService`, contra `pokemon/{id}/moves` de PokeAPI filtrado por `version_group_details`. Mismo fallback de idioma que [[pokemon.md]] (inglés cuando falta traducción, FR-018).

## `damageClass` para juegos de Generación I-III

Cada `Move` que este puerto devuelve resuelve su `damageClass` (ver [[../data-model.md]], "Regla de dominio: `damageClass` por generación") según la generación de `game`:

- **Generación IV en adelante**: se lee directo de `move.damage_class` (PokeAPI).
- **Generación I-III**: `move.damage_class` de PokeAPI ya refleja la clasificación *moderna* (incluyendo `'status'`), que no es la que ese juego mostraba en su momento — este adaptador la reemplaza aplicando la tabla tipo→clase histórica de [[../data-model.md]] cuando el movimiento no es de estado en esa era, y **no existía** aún como concepto un movimiento "de estado sin clase" (se resuelve igualmente a `'status'` por consistencia del modelo, documentando en un comentario que esa clase es anacrónica para esas tres generaciones).

Esta tabla es una constante hand-maintained de infraestructura (no un endpoint de PokeAPI), con la misma atribución a WikiDex que en [[../data-model.md]].
