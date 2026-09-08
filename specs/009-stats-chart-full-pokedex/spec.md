# Feature Specification: Gráfico de Barras para Estadísticas y Pokédex Completa

**Feature Branch**: `009-stats-chart-full-pokedex`

**Created**: 2026-08-29

**Status**: Draft

**Input**: User description: "Tomando como referencia el diseño de UI compartido por el usuario (una pantalla con 'Selected Team' a la izquierda mostrando tarjetas verticales del equipo con nivel, y 'Leyendas: Z-A' a la derecha mostrando una grilla de Pokémon con búsqueda y ordenamiento), se requieren dos ajustes al configurador de equipo: (1) Las estadísticas base del Pokémon en la tarjeta de personalización deben mostrarse como un gráfico de barras horizontales (una barra por estadística: PS, Ataque, Defensa, Ataque Especial, Defensa Especial, Velocidad), no como una simple lista de texto con valores numéricos. (2) Al cargar la Pokédex, debe cargarse completa de una sola vez, eliminando el comportamiento actual de carga por lotes de 20 en 20 (batching) que requiere scroll o proximidad de construcción para ir resolviendo más Pokémon."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver las estadísticas base como gráfico de barras (Priority: P1)

Un entrenador abre la tarjeta de personalización de un Pokémon y quiere comparar de un vistazo qué tan altas o bajas son sus seis estadísticas base, en vez de leer una lista de números sueltos.

**Why this priority**: Es la mejora visual central solicitada para la tarjeta de personalización y afecta a la decisión de armado de equipo de cada usuario que abre la tarjeta.

**Independent Test**: Abrir la tarjeta de personalización de cualquier Pokémon y verificar que cada una de las seis estadísticas base se representa con una barra horizontal cuya longitud es proporcional a su valor, con la etiqueta y el valor numérico visibles junto a cada barra.

**Acceptance Scenarios**:

1. **Given** el usuario abre la tarjeta de personalización de un Pokémon, **When** la sección de estadísticas base se renderiza, **Then** cada una de las seis estadísticas (PS, Ataque, Defensa, Ataque Especial, Defensa Especial, Velocidad) se muestra como una barra horizontal con su etiqueta y su valor numérico.
2. **Given** dos estadísticas de un mismo Pokémon con valores distintos, **When** se comparan sus barras, **Then** la barra de la estadística con mayor valor es visiblemente más larga que la de menor valor (longitud proporcional al valor).
3. **Given** el usuario cambia la forma seleccionada del Pokémon en la tarjeta (por ejemplo, a una Megaevolución), **When** las estadísticas se recalculan, **Then** las barras se actualizan para reflejar los nuevos valores de esa forma, manteniendo la representación de barras (no vuelve a mostrarse como lista de texto).

---

### User Story 2 - Pokédex disponible completa desde el principio (Priority: P1)

Un entrenador abre la Pokédex de un juego y espera poder buscar, filtrar o desplazarse hasta cualquier Pokémon de la lista sin que partes de la lista permanezcan como marcadores de posición pendientes de cargar.

**Why this priority**: Es un requisito explícito del usuario para eliminar cualquier percepción de carga incompleta o pendiente en la Pokédex, reforzando la corrección ya realizada en la funcionalidad `008-configurador-equipo-correcciones` sobre este mismo comportamiento.

**Independent Test**: Abrir la Pokédex de un juego con una lista larga (por ejemplo, la Pokédex Nacional) y verificar que, sin necesidad de desplazarse ni esperar a que el sistema detecte proximidad de scroll, todos los Pokémon de la lista ya están disponibles (buscables, filtrables y con su información completa) tan pronto termina la carga inicial.

**Acceptance Scenarios**:

1. **Given** el usuario abre la Pokédex de un juego, **When** la carga inicial termina, **Then** el 100% de los Pokémon de esa Pokédex están completamente resueltos (con nombre, tipos, sprite y estadísticas), sin marcadores de posición pendientes.
2. **Given** la Pokédex terminó de cargar, **When** el usuario busca por nombre un Pokémon que se encuentra al final de la lista, **Then** el resultado aparece de inmediato, sin ningún retraso relacionado con cargar ese tramo de la lista.
3. **Given** el usuario abre una Pokédex grande (por ejemplo, la Pokédex Nacional con varios cientos de especies), **When** la carga está en curso, **Then** el sistema muestra una indicación clara de que la Pokédex se está cargando, en vez de mostrar una lista parcialmente vacía o con marcadores de posición sin explicación.

### Edge Cases

- ¿Qué pasa si la carga completa de la Pokédex falla a mitad de camino (por ejemplo, por un problema de red)? El usuario debe poder reintentar la carga completa, sin quedar con una Pokédex parcialmente resuelta y sin indicación de error.
- ¿Qué pasa si el usuario cambia de juego o alterna la Pokédex Nacional/DLC mientras la carga completa anterior todavía está en curso? La carga en curso debe descartarse sin aplicarse, y debe iniciarse una nueva carga completa para la selección vigente.
- ¿Qué pasa con una estadística base en 0 o con un valor muy alto en relación con el resto? La barra correspondiente debe seguir siendo visible (con longitud mínima perceptible) o escalarse de forma que no se salga del área del gráfico, sin recortar el valor mostrado.
- ¿Qué pasa si una forma seleccionada no tiene datos de estadísticas resueltos? El gráfico debe mostrarse igualmente con los valores disponibles, sin dejar la sección en blanco o en un estado de carga indefinido.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La tarjeta de personalización DEBE mostrar las seis estadísticas base del Pokémon (PS, Ataque, Defensa, Ataque Especial, Defensa Especial, Velocidad) como un gráfico de barras horizontales, una barra por estadística.
- **FR-002**: Cada barra DEBE mostrar, junto a sí misma, la etiqueta de la estadística y su valor numérico exacto, además de su representación visual.
- **FR-003**: La longitud de cada barra DEBE ser proporcional al valor de su estadística respecto a una escala común compartida por las seis barras, de modo que dos estadísticas se puedan comparar visualmente entre sí de forma directa.
- **FR-004**: Al cambiar la forma seleccionada del Pokémon en la tarjeta, el gráfico de barras DEBE actualizarse para reflejar las estadísticas de la nueva forma, conservando el mismo tipo de representación (barras, no texto).
- **FR-005**: El sistema DEBE cargar y resolver la totalidad de los Pokémon de la Pokédex activa (nombre, tipos, sprite y estadísticas) durante la carga inicial, sin dejar marcadores de posición pendientes de resolución posterior por scroll o desplazamiento.
- **FR-006**: El sistema DEBE permitir buscar y filtrar cualquier Pokémon de la Pokédex activa inmediatamente después de que la carga inicial termine, sin distinción entre Pokémon "ya cargados" y "aún no cargados".
- **FR-007**: Mientras la carga completa de la Pokédex está en curso, el sistema DEBE mostrar una indicación de carga clara y con alcance perceptible al usuario, en vez de una lista vacía o parcial sin explicación.
- **FR-008**: Si la carga completa de la Pokédex falla, el sistema DEBE ofrecer una forma de reintentarla, consistente con el manejo de errores ya existente en la Pokédex.
- **FR-009**: Al cambiar de juego, o al alternar la Pokédex Nacional o un DLC mientras una carga completa anterior sigue en curso, el sistema DEBE descartar el resultado de la carga anterior (una vez que termine) y no aplicarlo sobre la selección vigente.

### Key Entities

- **Estadísticas base (gráfico de barras)**: Representación visual de las seis estadísticas base de la forma actualmente seleccionada de un Pokémon, cada una como una barra horizontal proporcional a su valor dentro de una escala común.
- **Pokédex (carga completa)**: El conjunto íntegro de entradas de la Pokédex activa, cada una completamente resuelta (nombre, tipos, sprite, estadísticas) desde el momento en que termina la carga inicial, sin distinción entre entradas resueltas y pendientes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100% de las tarjetas de personalización muestran las seis estadísticas base como barras horizontales proporcionales, verificado por comparación visual con la referencia de diseño compartida.
- **SC-002**: Un usuario puede identificar cuál de dos estadísticas de un mismo Pokémon es mayor con solo mirar la longitud de sus barras, sin necesidad de leer los valores numéricos, en el 100% de los casos de prueba.
- **SC-003**: Tras completarse la carga inicial de una Pokédex, el 100% de sus Pokémon son encontrables por búsqueda o desplazamiento sin ningún retraso adicional perceptible.
- **SC-004**: El 0% de las Pokédex cargadas exitosamente quedan con marcadores de posición o entradas sin resolver visibles al usuario.

## Assumptions

- Esta funcionalidad amplía y sustituye, en lo que respecta a la carga de la Pokédex, el comportamiento por lotes de 20 en 20 introducido y corregido en `007-configurador-equipo-mejoras` y `008-configurador-equipo-correcciones`; el resto de correcciones de esas funcionalidades (tipos, género, formas, layout del equipo) no se ven afectadas.
- "Gráfico de barras horizontales" se refiere a una representación visual simple de barras proporcionales dentro de la propia aplicación (no un componente de terceros con funcionalidades interactivas avanzadas como zoom o tooltips emergentes), consistente con el resto de la interfaz de la tarjeta de personalización.
- La escala común de las seis barras se basa en el rango habitual de estadísticas base de la franquicia Pokémon (valores típicamente entre 1 y algo más de 200), de forma que las barras sean comparables entre Pokémon distintos y no solo dentro de un mismo Pokémon.
- Cargar la Pokédex completa de una sola vez puede tardar más que mostrar los primeros resultados, especialmente en una Pokédex Nacional con varios cientos de especies; se acepta ese tiempo de espera adicional a cambio de no tener contenido parcialmente cargado, mostrando una indicación de carga mientras tanto.
- Esta funcionalidad aplica tanto a la versión de escritorio/web (layout de dos paneles) como a la versión compacta/móvil del configurador, ya que ambas comparten la misma lógica de carga de la Pokédex.
