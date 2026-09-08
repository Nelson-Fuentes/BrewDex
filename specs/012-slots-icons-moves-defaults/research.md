# Research: Slots 3×2 sin Espacio Desperdiciado, Íconos ×4, Movimientos por Defecto y Filtro Ocultable

## Decision 1 — La cuadrícula 3×2 más grande se logra midiendo el espacio real disponible, no solo cambiando `crossAxisCount`

**Decision**: `TeamSlotRow`'s `GridView.count` (que deriva el alto de cada celda únicamente de su ancho, vía un `childAspectRatio` implícito de 1.0) se reemplaza, solo en el camino `shrinkWrap: false` (dos paneles/web), por un `LayoutBuilder` + `GridView.builder` con `SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 3, childAspectRatio: <calculado>)`, donde el `childAspectRatio` se calcula a partir del ancho y alto realmente disponibles (`constraints.maxWidth`/`constraints.maxHeight` del `LayoutBuilder`) para que 3 columnas × 2 filas llenen exactamente esa caja, sin scroll y sin espacio sobrante. Además, el `Padding(all: 16)` que hoy envuelve `TeamSlotRow` en `TeamBuilderTwoPaneLayout` se elimina (o se reduce a un valor mínimo), ya que es exactamente el "margen desperdiciado" que reporta el usuario. El camino `shrinkWrap: true` (compacto/medio) no cambia — sigue siendo `GridView.count` con 3 columnas cuadradas, autoajustable a su contenido.

**Rationale**: Con un `childAspectRatio` fijo en 1.0 (cuadrado), pasar de 2 a 3 columnas *reduce* el ancho de cada celda (a un 66% del de 2 columnas, ya que el ancho es lo único que determina el tamaño en un `GridView.count` cuadrado) — literalmente lo opuesto a "1.5 veces más grande". Lo que sí puede crecer un 50% al pasar de 3 filas (versión `010`) a 2 filas es el **alto** de cada fila, porque ahora cada fila recibe la mitad del alto disponible en vez de un tercio. Calculando el `childAspectRatio` a partir del alto y ancho reales disponibles (en vez de dejarlo fijo en 1.0), cada celda deja de ser forzosamente cuadrada y pasa a ocupar exactamente `(anchoDisponible/3) × (altoDisponible/2)` — más alta que antes en la misma proporción (~1.5×) que pide FR-002, mientras sigue siendo una cuadrícula 3×2 (FR-001). Eliminar el padding de 16px alrededor recupera aún más espacio real para ese cálculo (FR-003).

**Alternatives considered**:
- Mantener `crossAxisCount: 2` (la solución de `011`) y solo agrandar el padding/spacing: rechazado, el usuario pide explícitamente "3x2", no 2×3.
- Cambiar el reparto 50/50 entre el panel de equipo y el de Pokédex: rechazado — esa proporción exacta fue una decisión ya cerrada y explícitamente pedida en `010`; esta funcionalidad no la reabre.
- Widget `AspectRatio` dentro de `TeamSlot` para forzar cuadratura: ya es inerte en este contexto (el `GridView` entrega restricciones ya fijas por celda), así que no requiere cambios — se deja como está.

## Decision 2 — Los íconos de tipo crecen exactamente ×4 respecto a su tamaño actual (post-`011`), en las mismas tres ubicaciones

**Decision**: Se multiplican por 4 los tamaños ya fijados en `011-forms-icons-moves`: `TeamSlot` tipo 32→128, Tera 24→96; `PokemonCustomizationCard` fila de tipos 48→192, `_WeaknessCell` 32→128; `PokedexTypeFilter._TypeTile` 52→208 (con sus `BoxConstraints` mínimas crecidas en la misma proporción). La fuente de imagen (`generation-ix/scarlet-violet`) no cambia — sigue siendo la ya confirmada en `008`.

**Rationale**: El usuario ya reportó "muy pequeños" dos veces seguidas (en `011` y ahora de nuevo), cada vez con un aumento que resultó insuficiente — pide explícitamente un múltiplo concreto y medible ("al menos x4") sobre el tamaño actual, no un ajuste relativo más. Tomar exactamente ×4 (el mínimo que pide FR-004) evita sobrecorregir mientras satisface la queja de forma verificable.

**Alternatives considered**: Un tamaño "responsive"/porcentual del contenedor — rechazado por Principio I (YAGNI); la petición es un múltiplo fijo y explícito, no un sistema de escalado nuevo.

## Decision 3 — Movimientos por defecto: nuevo método de repositorio que expone nivel + método de aprendizaje, no solo la lista ya-filtrada por juego

**Decision**: `MovepoolRepository` gana un segundo método:

```dart
Future<List<Move>> fetchDefaultMoveset({
  required String varietyId,
  required Game game,
  required String languageCode,
});
```

`PokeApiMovepoolRepository` lo implementa reutilizando la misma llamada a `pokemon/{varietyId}` que ya hace `fetchMovepool`, pero esta vez filtrando cada `moves[].version_group_details[]` por `version_group.name == game.id` **y** `move_learn_method.name == 'level-up'`, conservando el `level_learned_at` más alto de cada movimiento para ese juego, ordenando el resultado por ese nivel ascendente, y devolviendo como máximo los últimos 4 (FR-005). Los detalles de cada movimiento (nombre/tipo/PP/potencia/descripción) se resuelven exactamente igual que en `fetchMovepool` (mismo `_fetchMove` interno, mismo caché de tipos).

**Rationale**: `fetchMovepool` (de `011`) ya descarta deliberadamente el método/nivel de aprendizaje — solo le importa "¿es aprendible en este juego, por cualquier método?" para la vista de selección. Los "últimos movimientos que aprende por nivel" (FR-005/FR-006) necesitan exactamente el dato que ese método descarta, así que es un método nuevo, no un parámetro opcional del existente — mantiene cada método con una única responsabilidad clara (Principio III, Clear Contracts).

**Alternatives considered**:
- Añadir un parámetro `onlyLevelUp: bool` a `fetchMovepool`: rechazado, mezclaría dos formas de uso muy distintas (poblar una lista completa filtrable vs. resolver un valor por defecto acotado a 4) bajo una sola firma, violando Principio I.
- Resolver el moveset por defecto completamente en el dominio/aplicación a partir de `fetchMovepool`'s resultado: rechazado — `fetchMovepool` nunca tuvo el nivel/método por diseño; recuperarlo exigiría el mismo trabajo de parseo, solo que fuera del único lugar autorizado a conocer la forma del JSON de PokeAPI (Principio VI).

## Decision 4 — La asignación automática se dispara una sola vez, dentro de `TeamBuilderCubit.addPokemon`

**Decision**: Después de que `AddPokemonToTeam` agrega la nueva entrada (siempre al final de `roster`, confirmado en el código ya existente — "next empty slot" es simplemente `roster.length` antes de agregar), `TeamBuilderCubit.addPokemon` resuelve `GetDefaultMoveset` (nuevo caso de uso, mismo patrón que `GetMovepool`) para ese Pokémon + `state.game`, y sobrescribe el `moveIds` de esa única entrada recién creada antes de persistir/emitir. Ningún otro flujo (cambio de forma, Mega/Gigamax, cambio de juego) vuelve a ejecutar esta asignación — ya cubierto por la regla de invalidación de `011` (solo vacía, nunca rellena).

**Rationale**: Es el único punto donde "un Pokémon nuevo entra al equipo" está inequívocamente definido — cualquier otro punto (p. ej. dentro de `updateRosterEntry`) se dispara también en ediciones manuales posteriores, donde rellenar automáticamente pisaría una elección del usuario (violando FR-007/FR-008).

**Alternatives considered**: Mover la asignación a `AddPokemonToTeam` (capa de aplicación) en vez del Cubit — rechazado por simplicidad de firma: `AddPokemonToTeam` no conoce hoy nada de movimientos ni tiene acceso a `MovepoolRepository`, y ese caso de uso ya está probado/estable; agregarle esa responsabilidad mezclaría dos preocupaciones (alta al equipo vs. resolución de movepool) en un solo caso de uso cuando ya existe el patrón de que el Cubit orquesta múltiples casos de uso en secuencia (ver `load()`, que ya combina `_getPokedexIndex`/`_getPokedexDetails`/`_teamRosterStore`).

## Decision 5 — El filtro por tipo en la selección de movimientos se oculta tras un `Switch`/toggle local, con estado efímero

**Decision**: `MoveSelectionSheet` (StatefulWidget ya existente) gana un segundo booleano de estado local `_showTypeFilter`, inicializado en `false`. Se agrega una fila con un `Switch`/`SwitchListTile` (mismo patrón visual que cualquier otro toggle de este proyecto) justo encima de donde hoy se renderiza el `Wrap` de tipos; ese `Wrap` solo se construye cuando `_showTypeFilter == true`. Al pasar de `true` a `false`, `_typeFilter` se limpia a `null` en el mismo `setState` (research.md Assumptions del spec: "ocultar el filtro implica limpiar la selección").

**Rationale**: Es exactamente el mismo mecanismo de estado efímero que `PokedexTypeFilter`/`CollapsibleFilterSection` ya usan para su propio expandir/colapsar — no hace falta un widget reutilizable nuevo, dado que aquí el toggle es binario y no necesita animación de colapso ni señal de auto-colapso al seleccionar (esas necesidades sí existen en `PokedexTypeFilter`, pero no se piden aquí).

**Alternatives considered**: Reutilizar `CollapsibleFilterSection` tal cual — rechazado, ese widget colapsa/expande con un header + ícono de flecha pensado para una sección de filtro dentro de una página larga con scroll; aquí se pide explícitamente un "interruptor" (`Switch`), una afirmación de UI distinta al patrón de acordeón ya existente.

## Decision 6 — Los espacios de movimiento pasan de un `Wrap` de mosaicos de ancho fijo a una `Column` de filas a todo el ancho

**Decision**: En `PokemonCustomizationCard`, el `Wrap(children: [for (...) _MoveSlotTile(...)])` se reemplaza por una `Column` (con `SizedBox(width: double.infinity, ...)` o simplemente dejando que cada `_MoveSlotTile` se estire dentro de la `Column` ya de ancho completo de la tarjeta) con separación vertical entre cada uno de los 4 `_MoveSlotTile`. `_MoveSlotTile` internamente no cambia su contenido (ícono/nombre/PP/potencia/botón de limpiar) — solo dejar de fijar `width: 160` y ocupar el ancho que la `Column` ya le da.

**Rationale**: Es el cambio mínimo que satisface FR-012/FR-013 (ancho completo, apilado vertical) sin tocar ninguna otra sección de la tarjeta ni el contrato de datos (`Move`, `RosterEntry.moveIds`) ya estable desde `011`.

**Alternatives considered**: Ninguna — es un cambio de layout puramente local a un widget ya existente.
