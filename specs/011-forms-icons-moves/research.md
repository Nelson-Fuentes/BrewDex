# Research: Formas por Juego, Reparación de Megaevolución, Slots más Grandes, Íconos y Movimientos

## Decision 1 — Filtrar formas Mega/Gigamax por juego mediante tablas mantenidas explícitamente

**Decision**: `Mega Evolution` y `Gigamax` se ofrecen solo cuando `Game.id` pertenece a una lista mantenida explícitamente en la capa de infraestructura (`kMegaEvolutionEnabledGameIds`, `kGigamaxEnabledGameIds` — siguiendo el mismo patrón const-map ya establecido por `_regionalFormSuffixByGameId` y `_dlcParentVersionGroup`), en vez de una fórmula genérica basada solo en `Generation`.

**Rationale**: PokeAPI no publica ningún campo en `pokemon-form` ni en `version-group` que diga "esta forma existe en este juego" — solo dice si una variedad *es* Mega/Gigamax, no *cuándo* es jugable. La Megaevolución existe y es usable en X/Y, Omega Rubí/Zafiro Alfa, Sol/Luna, Ultra Sol/Ultra Luna, y — como mecánica central — en Leyendas Z-A; no existe en Let's Go, Espada/Escudo, Leyendas Arceus, ni Escarlata/Púrpura. Gigamax/Dinamax solo existe en Espada/Escudo (base + DLC). Una regla puramente basada en "generación ≥ VI" incluiría incorrectamente Leyendas Arceus y Escarlata/Púrpura (ambos gen VIII/IX sin Mega), y una basada en "una sola generación introduce y todas las posteriores la heredan" no es cierta para esta franquicia (la mecánica va y viene por juego, no por generación). Una tabla explícita, mantenida a mano, es la única representación correcta — igual que ya se hizo para formas regionales y DLC.

**Alternatives considered**:
- Filtrar solo por `generationOrdinal(game.generation) >= generationOrdinal(Generation(id:'generation-vi'))`: rechazado, produce falsos positivos en Leyendas Arceus/Escarlata-Púrpura y falsos negativos en Sol/Luna si se intentara acotar el rango de otra forma ad-hoc.
- Consultar en vivo algún endpoint de PokeAPI por juego: rechazado, no existe tal endpoint para esta información.

## Decision 2 — El bug de "no se puede desactivar Megaevolución" es un botón no-toggle; se corrige igualando su patrón al del botón Shiny existente

**Decision**: El `onPressed` de los botones Mega/Gigamax en `PokemonCustomizationCard` pasa de fijar incondicionalmente `megaActive: true` (o `gigamaxActive: true`) a alternar el valor actual (`megaActive: !rosterEntry.megaActive`), exactamente como ya hace el botón Shiny (`isShiny: !rosterEntry.isShiny`).

**Rationale**: El código ya tiene, en el mismo archivo, un ejemplo correcto de toggle (Shiny) junto al ejemplo incorrecto (Mega/Gigamax) — no es una decisión de diseño nueva, es una corrección de una inconsistencia visible en el propio código.

**Alternatives considered**: Ninguna — la solución replica un patrón ya presente y ya probado en el mismo widget.

## Decision 3 — Los slots del equipo se agrandan cambiando `crossAxisCount` de la grilla, no el layout de dos paneles

**Decision**: `TeamSlotRow`'s `GridView.count(crossAxisCount: 3, ...)` pasa a `crossAxisCount: 2` quando `shrinkWrap == false` (el caso del layout de dos paneles / web), manteniendo `crossAxisCount: 3` para el layout compacto/medio (`shrinkWrap: true`, donde la columna es angosta). El panel de dos paneles en sí ya reparte el espacio 50/50 (`010-layout-icons-stats-weaknesses`) — el problema reportado es el tamaño de cada tile dentro de esa mitad, no el reparto entre paneles.

**Rationale**: Con `flex:1` fijo entre ambos paneles, la única palanca disponible para hacer cada slot más grande sin tocar el reparto 50/50 ya corregido es reducir cuántos slots caben por fila dentro de la misma columna — pasar de 3 a 2 columnas hace que cada tile ocupe aproximadamente 1.5× el ancho anterior por sí solo, y al mantener `aspectRatio: 1` (sin cambios), la altura crece en la misma proporción, dando un área visible ≥2× (1.5×1.5 ≈ 2.25×). Alternativas que tocan el layout de dos paneles reabrirían una decisión ya cerrada en `010`.

**Alternatives considered**:
- Aumentar el `flex` de la columna de slots por sobre el de la Pokédex: rechazado, contradice la corrección 50/50 exacta que el usuario pidió y ya se implementó en `010`.
- Reemplazar `GridView.count` por `SliverGridDelegateWithMaxCrossAxisExtent`: rechazado por Principio I (Simplicity/YAGNI) — cambiar solo el número de columnas fijo logra el resultado pedido sin introducir un delegate nuevo ni lógica de medición adicional.

## Decision 4 — Íconos de tipo: mantener la fuente Escarlata/Púrpura ya vigente, subir los tamaños base en las tres ubicaciones

**Decision**: `typeIconUrl` no cambia — ya resuelve exactamente `generation-ix/scarlet-violet` (fijado en `008-configurador-equipo-correcciones`, research.md Decision 3, y confirmado accesible en vivo). Lo que cambia son los tamaños fijos en cada call site: `TeamSlot` (20→32, badge Tera 16→24), `PokemonCustomizationCard` fila de tipos (36→48), `_WeaknessCell` (24→32), `PokedexTypeFilter._TypeTile` (40→52, con `minHeight`/`minWidth` de la caja ajustados en la misma proporción).

**Rationale**: El usuario confirma la fuente correcta pidiéndola de nuevo explícitamente, pero el síntoma ("casi no se ven") solo puede resolverse agrandando el tamaño de renderizado, ya que la fuente de imagen ya es la correcta y de alta calidad. Cada llamada especifica su propio `size` inline (`PokemonTypeIcon(type: type, size: N)`), así que no hace falta ningún cambio estructural, solo subir esas N constantes.

**Alternatives considered**: Introducir un tamaño "responsive" calculado dinámicamente por ancho de pantalla — rechazado por Principio I; el usuario pide tamaños más grandes en términos absolutos, no un sistema de escalado nuevo.

## Decision 5 — Aprendizaje de movimientos por juego: usar `pokemon.moves[].version_group_details` de PokeAPI, filtrado por el `version-group` (id de `Game`) activo

**Decision**: Un nuevo puerto `MovepoolRepository.fetchMovepool({required String varietyId, required Game game, required String languageCode})` se implementa contra PokeAPI's `pokemon/{varietyId}` resource: cada entrada de `moves[]` incluye `version_group_details[]`, cada una con `version_group.name` — se conserva un movimiento cuando alguna de sus `version_group_details` tiene `version_group.name == game.id`. El detalle de cada movimiento (nombre, tipo, PP, potencia, descripción) se resuelve contra `move/{name}`, cacheado por id igual que `_fetchTypeCached`/`_fetchGeneration` en `PokeApiPokedexRepository`.

**Rationale**: Es la única fuente en PokeAPI que relaciona un Pokémon + movimiento + juego específico — exactamente el filtro que pide FR-009. `Game.id` ya es el propio nombre del `version-group` de PokeAPI (verificado: `PokeApiGameCatalogRepository` construye cada `Game.id` directamente desde `version-group.name`), así que no hace falta ninguna tabla de mapeo adicional como las de Decision 1.

**Alternatives considered**:
- Filtrar por `version_group_details[].version_group` perteneciente a la misma `generation` en vez de al mismo `version-group` exacto: rechazado — sobre-incluiría movimientos aprendibles en un juego hermano de la misma generación pero no en el juego exacto activo (por ejemplo, un movimiento por MT exclusivo de una sola versión de un par), violando la precisión que pide FR-009.
- Traer el listado de movimientos completo de una vez para todo el roster al cargar el equipo: rechazado por rendimiento — se decide (Decision 6) cargarlo bajo demanda, solo para el Pokémon cuya tarjeta está abierta.

## Decision 6 — El learnset se resuelve bajo demanda, no al cargar el Pokédex completo

**Decision**: `fetchMovepool` se invoca solo cuando el usuario abre la sección de movimientos de la tarjeta de personalización de un Pokémon (o cambia su forma activa), nunca como parte de `fetchPokedexIndex`/`fetchPokedexDetails`.

**Rationale**: `009-stats-chart-full-pokedex` ya estableció que el Pokédex completo se resuelve por adelantado (sin paginación) — añadir el fetch de movimientos (potencialmente decenas de movimientos por Pokémon, cada uno con su propia llamada a `move/{name}`) a ese mismo camino multiplicaría drásticamente el número de llamadas HTTP en el peor caso (un Pokédex nacional completo), contradiciendo la mejora de rendimiento que esa misma feature entregó. Cargarlo solo para el Pokémon activo mantiene el costo acotado y proporcional a la interacción real del usuario.

**Alternatives considered**: Precargar el learnset de los 6 Pokémon del equipo al abrir el armador — rechazado, la mayoría de las aperturas de la tarjeta no llegan a abrir la sección de movimientos, y precargar igual pagaría ese costo siempre.

## Decision 7 — Modelo de datos de movimiento: solo los campos que pide la spec

**Decision**: El nuevo value object `Move` expone exactamente `id`, `displayName`, `type` (`PokemonType`), `pp` (`int`), `power` (`int?`, `null` cuando el movimiento no tiene potencia aplicable — FR-014), y `description` (`String`). No se modela `accuracy`, `damageClass`, `priority` ni ningún otro campo de PokeAPI no solicitado por la spec (Principio I).

**Rationale**: FR-010/FR-011 piden exactamente nombre, tipo, PP, potencia y descripción — cualquier campo adicional sería especulativo sin un requisito que lo respalde.

**Alternatives considered**: Modelar el movimiento completo tal como lo expone PokeAPI (con `accuracy`, `damage_class`, etc.) por si se necesita después — rechazado por YAGNI; se puede ampliar en una futura feature si se pide.

## Decision 8 — Selección de movimientos: 4 slots por Pokémon, sin duplicados, invalidados al cambiar de forma/juego

**Decision**: `RosterEntry` gana un campo `moveIds: List<String?>` de longitud fija 4 (posiciones nulas = slot vacío). `TeamBuilderCubit` valida, al aplicar un cambio de forma o de juego, que cada `moveId` no nulo siga perteneciente al movepool recién resuelto para la nueva forma/juego — si no, ese slot se limpia a `null` (mismo patrón que `_applyFormChange` ya limpia `cosmeticVariantId` al cambiar de forma). Seleccionar un movimiento ya presente en otro slot del mismo Pokémon reemplaza ese slot anterior en vez de duplicarlo (FR-013).

**Rationale**: 4 es el número estándar de la franquicia en todos los juegos que esta app cubre (documentado como supuesto en spec.md). Reutilizar el mecanismo de invalidación-al-cambiar-forma que ya existe para `cosmeticVariantId` es la extensión más simple y consistente con el código ya presente (Principio I).

**Alternatives considered**: Modelar los movimientos como un `MoveSet` value object aparte en vez de una lista plana en `RosterEntry` — rechazado, `RosterEntry` ya es "todo lo que el usuario personalizó de este slot" y una lista de 4 ids sigue ese mismo patrón sin introducir un tipo nuevo innecesario.
