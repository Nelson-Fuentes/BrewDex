# Feature Specification: Mejoras al Configurador de Equipo Pokémon

**Feature Branch**: `007-configurador-equipo-mejoras`

**Created**: 2026-08-23

**Status**: Draft

**Input**: User description: "Mejoras al Configurador de equipo Pokémon (BrewDex): eliminar la advertencia de cambio de juego (cada selección de juego es un equipo nuevo); rediseñar la interfaz web con slots del equipo a la izquierda y Pokédex a la derecha con scroll propio; optimizar la carga de las Pokédex nacionales con carga inicial de ~20 y scroll infinito, con búsqueda directa contra la API; corregir los sprites shiny y de género para que reflejen la forma seleccionada; usar una Pokébola como fondo de las imágenes de Pokémon, con color distinto según si está seleccionado en la Pokédex o si es el slot activo; mostrar los tipos (máx. 2, más Teratipo en Escarlata/Púrpura) tanto en los slots del equipo como en la tarjeta del configurador; y rediseñar visualmente la tarjeta del configurador."

## Clarifications

### Session 2026-08-23

- Q: When a user picks a game that's already active (re-tapping the same game), should it also wipe the current team back to empty, or leave it untouched since nothing actually changed? → A: Always reset to an empty team on any tap, even the already-active game.
- Q: Since every game selection now always resets the team to empty, should the existing "these Pokémon were removed" notice dialog shown after a game switch be removed too? → A: Remove it entirely — it can no longer be triggered once every selection is an unconditional reset.
- Q: In Pokémon Escarlata/Púrpura, how should a team member's Tera Type be set — user-picked, or always the Pokémon's own primary type with no picker? → A: Defaults to the Pokémon's own primary type when added to the team, but the user can change it afterward to any of the 18 types via a picker on the configurator card.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cambiar de juego sin interrupciones (Priority: P1)

Un entrenador está configurando el equipo para un juego y decide cambiar a otro juego de la lista. Actualmente aparece una advertencia de confirmación que a veces no responde y bloquea el flujo. El sistema debe cambiar de juego de inmediato, tratando la selección como el inicio de un equipo nuevo, sin ningún diálogo de confirmación.

**Why this priority**: Es un bloqueador funcional actual (el diálogo no responde de forma consistente), por lo que impide completar una acción básica del producto.

**Independent Test**: Con un equipo parcialmente configurado para el Juego A, seleccionar el Juego B desde el selector de juegos. Se debe pasar directamente al configurador del Juego B con un equipo vacío/nuevo, sin ningún diálogo ni bloqueo intermedio.

**Acceptance Scenarios**:

1. **Given** el usuario tiene Pokémon ya colocados en slots del equipo para el Juego A, **When** selecciona el Juego B, **Then** el sistema navega inmediatamente al configurador del Juego B con todos los slots vacíos, sin mostrar ninguna advertencia ni pedir confirmación.
2. **Given** el usuario está en el selector de juegos, **When** selecciona el mismo juego que ya tenía activo, **Then** el sistema tampoco muestra ninguna advertencia y, además, reinicia el equipo a vacío igual que si hubiera elegido un juego distinto (toda selección de juego, sea o no la ya activa, inicia un equipo nuevo).

---

### User Story 2 - Configurar el equipo cómodamente en escritorio (Priority: P1)

Un entrenador usando la versión web (escritorio) del configurador quiere ver su equipo y la Pokédex al mismo tiempo, sin tener que desplazarse por toda la página para pasar de uno a otro.

**Why this priority**: Es la mejora de usabilidad central solicitada para la versión de escritorio y afecta a todo el flujo de selección de Pokémon.

**Independent Test**: Abrir el configurador en una ventana de tamaño de escritorio y verificar que los slots del equipo están fijos a la izquierda y la Pokédex a la derecha, cada una con su propio scroll independiente.

**Acceptance Scenarios**:

1. **Given** el usuario abre el configurador en la versión web, **When** la pantalla tiene ancho de escritorio, **Then** los slots del equipo se muestran en el panel izquierdo y la Pokédex en el panel derecho, ambos visibles simultáneamente.
2. **Given** el panel de la Pokédex contiene más Pokémon de los que caben en la pantalla, **When** el usuario hace scroll dentro del panel de la Pokédex, **Then** solo ese panel se desplaza y el panel de slots permanece fijo en su lugar.
3. **Given** el usuario está en un dispositivo móvil (no escritorio), **When** abre el configurador, **Then** conserva el diseño actual de una sola columna (esta mejora aplica solo a la versión web).

---

### User Story 3 - Cargar la Pokédex nacional rápidamente (Priority: P1)

Un entrenador abre una Pokédex nacional grande (cientos de Pokémon) y actualmente debe esperar mucho tiempo a que cargue toda la lista antes de poder interactuar con ella.

**Why this priority**: El tiempo de carga actual es un problema de rendimiento percibido que afecta a todos los usuarios de Pokédex grandes.

**Independent Test**: Abrir una Pokédex nacional y verificar que los primeros resultados aparecen casi de inmediato, que desplazarse hacia abajo carga más resultados progresivamente, y que buscar por nombre devuelve resultados aunque el Pokémon buscado no esté entre los ya cargados.

**Acceptance Scenarios**:

1. **Given** el usuario abre una Pokédex nacional, **When** la lista se muestra por primera vez, **Then** se cargan y muestran aproximadamente los primeros 20 Pokémon sin esperar a que cargue el resto.
2. **Given** el usuario ha cargado los primeros ~20 Pokémon, **When** hace scroll hasta el final de la lista visible, **Then** el sistema carga automáticamente el siguiente grupo de Pokémon y lo añade a la lista, sin que el usuario perciba que la carga total no ha terminado.
3. **Given** el usuario escribe el nombre (o parte del nombre) de un Pokémon en el buscador, **When** ese Pokémon no está entre los ya cargados localmente, **Then** el sistema consulta directamente a la fuente de datos y muestra el resultado igualmente.
4. **Given** el usuario borra el texto de búsqueda, **When** el buscador queda vacío, **Then** la lista vuelve a mostrar la Pokédex con carga incremental (paginada) desde el inicio.

---

### User Story 4 - Ver el sprite correcto según forma, shiny y género (Priority: P2)

Un entrenador selecciona una forma alternativa de un Pokémon (por ejemplo, una forma regional o especial) y luego activa "shiny" o cambia el género. La imagen mostrada debe corresponder siempre a la combinación exacta de forma + shiny + género seleccionada, no a la forma por defecto.

**Why this priority**: Es un defecto visible que genera confusión (el usuario ve un Pokémon distinto al que configuró), pero no bloquea el flujo de selección del equipo.

**Independent Test**: Elegir un Pokémon con formas alternativas y variantes de género, seleccionar una forma no-default, activar shiny, y confirmar que el sprite mostrado es el shiny de esa forma específica (y lo mismo para género macho/hembra).

**Acceptance Scenarios**:

1. **Given** un Pokémon con al menos dos formas, **When** el usuario selecciona una forma distinta a la predeterminada y activa "shiny", **Then** el sprite mostrado es la versión shiny de la forma seleccionada (no la de la forma por defecto).
2. **Given** un Pokémon con diferencias visuales por género, **When** el usuario selecciona una forma distinta a la predeterminada y elige un género, **Then** el sprite mostrado corresponde a ese género en la forma seleccionada (no en la forma por defecto).
3. **Given** una forma seleccionada que no tiene una variante shiny o de género distinta disponible, **When** el usuario activa shiny o cambia de género, **Then** el sistema muestra el mejor sprite disponible para esa combinación sin fallar ni mostrar una imagen rota.

---

### User Story 5 - Identificar el estado y los tipos de un Pokémon de un vistazo (Priority: P2)

Un entrenador quiere distinguir rápidamente, mientras navega la Pokédex, qué Pokémon ya están en su equipo, cuál es el slot activo, y qué tipo(s) tiene cada Pokémon (incluido el Teratipo en los juegos que lo soportan), tanto en la lista como en el detalle de configuración.

**Why this priority**: Mejora la eficiencia y claridad del proceso de armado de equipo, pero el equipo puede armarse sin esta ayuda visual.

**Independent Test**: Añadir un Pokémon al equipo y verificar que su entrada en la Pokédex cambia el color de fondo (Pokébola) respecto a los no seleccionados; seleccionar un slot del equipo y verificar que su fondo cambia respecto a los slots no seleccionados; verificar que el/los tipo(s) (y Teratipo cuando aplique) se muestran tanto en el slot como en la tarjeta de configuración.

**Acceptance Scenarios**:

1. **Given** un Pokémon ya fue añadido al equipo, **When** se muestra en la lista de la Pokédex, **Then** el fondo tipo Pokébola de su imagen usa un color distinto al de los Pokémon no seleccionados.
2. **Given** varios slots de equipo con Pokémon asignados, **When** el usuario selecciona (activa) uno de los slots, **Then** el fondo tipo Pokébola de ese slot usa un color distinto al de los demás slots.
3. **Given** un Pokémon cuyo tipo cambia según la forma, **When** el usuario selecciona una forma distinta, **Then** el/los tipo(s) mostrados en el slot y en la tarjeta se actualizan para reflejar el tipo de la forma seleccionada (máximo 2 tipos).
4. **Given** el juego activo es Pokémon Escarlata o Púrpura, **When** el usuario añade un Pokémon al equipo, **Then** se le asigna automáticamente como Teratipo su tipo primario, y este se muestra junto a los tipos normales en el slot correspondiente.
4a. **Given** un Pokémon del equipo con Teratipo asignado, **When** el usuario abre su tarjeta de configuración y elige un Teratipo distinto de la lista de 18 tipos, **Then** el slot y la tarjeta reflejan de inmediato el nuevo Teratipo elegido.
5. **Given** el juego activo no es Escarlata ni Púrpura, **When** se muestra un slot o la tarjeta de configuración, **Then** no se muestra ninguna referencia a Teratipo.

---

### User Story 6 - Tarjeta de configuración rediseñada (Priority: P3)

Un entrenador abre la tarjeta de configuración de un Pokémon (forma, género, estados especiales, y quitar del equipo) y espera una presentación visual más clara y cuidada que la actual, siguiendo la referencia visual proporcionada por el usuario.

**Reference layout** (mockup adjunto por el usuario): encabezado con botón de volver, título "Configurador" centrado, e icono de favorito a la derecha; imagen del Pokémon centrada sobre el fondo tipo Pokébola; nombre del Pokémon debajo, centrado y en negrita; sección "Forma" con opciones seleccionables mostradas como miniaturas de imagen dentro de un recuadro (la opción activa resaltada con borde/fondo morado); sección "Género" con tres botones tipo toggle en línea (♂ macho, ♀ hembra, ⃠ sin género/no aplica), el activo resaltado; separador horizontal; sección "Estados Especiales" centrada con tres botones en fila (Mega, Shiny, Dinamax), cada uno con icono y etiqueta, el/los activo(s) resaltado(s) en morado; botón de ancho completo al final, con icono de papelera y el texto "Quitar del equipo". Esta especificación añade, sobre ese mismo layout, una fila de tipo(s) inmediatamente debajo del nombre, ya que la referencia no la incluye pero es un requisito de esta mejora (ver FR-017); y, únicamente cuando el juego activo es Escarlata o Púrpura, una sección adicional de Teratipo con su selector de los 18 tipos (ver FR-016b), inicializado en el tipo primario del Pokémon.

**Why this priority**: Es una mejora estética/de presentación; no cambia la funcionalidad disponible, solo cómo se muestra.

**Independent Test**: Abrir la tarjeta de configuración de un Pokémon del equipo y verificar que sigue la estructura de la referencia (encabezado, imagen con fondo de Pokébola, nombre, tipos, forma, género, estados especiales, botón de quitar) con el mismo lenguaje visual (colores de acento morado para el estado activo).

**Acceptance Scenarios**:

1. **Given** el usuario abre la tarjeta de configuración de un Pokémon del equipo, **When** la tarjeta se renderiza, **Then** se muestran de forma clara y ordenada, siguiendo la referencia: encabezado con volver/título/favorito, imagen (con fondo de Pokébola), nombre, tipo(s) (y Teratipo si aplica), selector de forma, selector de género, estados especiales aplicables al juego actual, y el botón para quitar del equipo.
2. **Given** el usuario cambia la forma, el género o un estado especial en la tarjeta, **When** el cambio se aplica, **Then** la imagen, los tipos y el resto de la tarjeta se actualizan de forma inmediata y consistente con las demás vistas (slot y Pokédex), y la opción recién seleccionada queda resaltada visualmente igual que en la referencia.
3. **Given** un estado especial no aplica al juego activo (por ejemplo Mega o Dinamax no disponibles en ese juego), **When** se renderiza la sección "Estados Especiales", **Then** solo se muestran los estados especiales realmente aplicables a ese juego.

---

### Edge Cases

- ¿Qué ocurre si la fuente de datos de Pokémon no responde durante la carga inicial de 20 o durante el scroll infinito? El sistema debe mostrar un estado de error/reintento sin dejar la lista en blanco de forma silenciosa.
- ¿Qué ocurre si la búsqueda directa contra la API no encuentra ningún resultado? Debe mostrarse un estado de "sin resultados" claro.
- ¿Qué ocurre si el usuario hace scroll hasta el final de la Pokédex nacional completa (ya no hay más páginas)? El scroll infinito debe detenerse sin errores ni peticiones repetidas innecesarias.
- ¿Qué ocurre si un Pokémon no tiene variante de género (asexuado) o no tiene variante shiny distinta? Debe seguir mostrando el mejor sprite disponible sin errores.
- ¿Qué ocurre si el usuario cambia de juego mientras la Pokédex aún está cargando resultados (scroll infinito en curso)? La carga en curso debe cancelarse/descartarse y comenzar limpia para el nuevo juego.
- ¿Qué ocurre en anchos de pantalla intermedios (tablet)? Debe aplicarse el layout de una sola columna (igual que móvil) hasta alcanzar el ancho definido como "escritorio".

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST cambiar de juego inmediatamente al seleccionarlo, sin mostrar ningún diálogo de advertencia o confirmación de cambio de juego, y sin mostrar tampoco ningún aviso posterior de "Pokémon eliminados del equipo" (ese aviso deja de tener sentido: el equipo siempre se reinicia vacío, nunca se conserva parcialmente).
- **FR-002**: El sistema MUST tratar cada selección de juego —incluida la re-selección del juego ya activo— como el inicio de un equipo nuevo (todos los slots del equipo se reinician/vacían al seleccionar un juego, sin excepción).
- **FR-003**: En la versión web (ancho de escritorio), el sistema MUST mostrar los slots del equipo en un panel izquierdo y la Pokédex en un panel derecho, ambos visibles al mismo tiempo.
- **FR-004**: En la versión web, el panel de la Pokédex MUST tener su propio scroll interno, independiente del scroll de la página y del panel de slots.
- **FR-005**: En anchos de pantalla no-escritorio (móvil/tablet), el sistema MUST conservar el diseño de una sola columna existente (esta reestructuración de paneles aplica solo a la versión web).
- **FR-006**: Al abrir una Pokédex, el sistema MUST cargar y mostrar inicialmente un lote de aproximadamente 20 Pokémon.
- **FR-007**: El sistema MUST cargar automáticamente lotes adicionales de Pokémon (scroll infinito) a medida que el usuario se aproxima al final de la lista cargada, hasta agotar la Pokédex completa.
- **FR-008**: Al escribir en el buscador, el sistema MUST resolver los resultados mediante una consulta directa a la fuente de datos (API), en lugar de limitarse a filtrar únicamente los Pokémon ya cargados localmente.
- **FR-009**: El sistema MUST mostrar el sprite shiny correspondiente a la forma actualmente seleccionada del Pokémon (no el de su forma por defecto) cuando el modo shiny está activo.
- **FR-010**: El sistema MUST mostrar el sprite de género correspondiente a la forma actualmente seleccionada del Pokémon (no el de su forma por defecto) cuando se elige macho o hembra.
- **FR-011**: El sistema MUST combinar correctamente forma + shiny + género seleccionados al resolver qué sprite mostrar en todas las vistas (Pokédex, slot, tarjeta de configuración).
- **FR-012**: El sistema MUST mostrar un fondo tipo Pokébola detrás de la imagen de cada Pokémon, tanto en la Pokédex, como en los slots del equipo y en la tarjeta de configuración.
- **FR-013**: En la Pokédex, el fondo tipo Pokébola de un Pokémon MUST usar un color distinto según si ese Pokémon ya fue añadido al equipo o no.
- **FR-014**: En los slots del equipo, el fondo tipo Pokébola MUST usar un color distinto para el slot actualmente seleccionado/activo frente a los demás slots.
- **FR-015**: Cada slot del equipo con un Pokémon asignado MUST mostrar su(s) tipo(s) (máximo 2), recalculados según la forma actualmente seleccionada de ese Pokémon.
- **FR-016**: Cuando el juego activo sea Pokémon Escarlata o Púrpura, cada slot con un Pokémon asignado MUST mostrar también su Teratipo junto a los tipos normales.
- **FR-016a**: Al añadir un Pokémon al equipo en Pokémon Escarlata o Púrpura, el sistema MUST asignarle por defecto, como Teratipo inicial, su tipo primario (el primero de sus tipos normales) según la forma seleccionada en ese momento.
- **FR-016b**: En Pokémon Escarlata o Púrpura, la tarjeta de configuración MUST ofrecer un selector que permita al usuario cambiar el Teratipo de ese Pokémon a cualquiera de los 18 tipos existentes, independientemente de sus tipos normales.
- **FR-016c**: Si el usuario cambia la forma seleccionada de un Pokémon después de haber elegido manualmente un Teratipo, el Teratipo elegido MUST conservarse sin cambios (solo el Teratipo por defecto inicial depende del tipo primario de la forma; una vez elegido explícitamente por el usuario, ya no se recalcula automáticamente).
- **FR-017**: La tarjeta de configuración de un Pokémon MUST mostrar su(s) tipo(s) (y, cuando el juego activo sea Escarlata o Púrpura, su Teratipo junto con el selector para cambiarlo), recalculados según la forma seleccionada.
- **FR-018**: La tarjeta de configuración MUST presentar, siguiendo la estructura y el lenguaje visual de la referencia proporcionada (ver User Story 6): encabezado (volver/título/favorito), imagen (con fondo de Pokébola), nombre, tipo(s), selector de forma, selector de género, estados especiales aplicables al juego activo, y la acción de quitar del equipo.
- **FR-019**: Cualquier cambio de forma, género o estado especial realizado en la tarjeta de configuración MUST reflejarse de inmediato y de forma consistente en la imagen, tipos y fondo mostrados en el propio slot y en la entrada correspondiente de la Pokédex.
- **FR-020**: El sistema MUST manejar sin errores visibles los casos en que un Pokémon no tenga variante shiny distinta o variante de género, mostrando el mejor sprite disponible para la combinación solicitada.
- **FR-021**: El sistema MUST mostrar un estado de carga/error recuperable si la carga inicial, el scroll infinito o la búsqueda directa a la API fallan, en lugar de dejar la lista vacía sin explicación.

### Key Entities

- **Juego (Game)**: Título de la saga Pokémon seleccionable por el usuario; determina la Pokédex disponible, las formas/Teratipo aplicables y reinicia el equipo al cambiar.
- **Equipo (Team)**: Conjunto de slots (hasta el máximo permitido por el configurador) asociado al juego activo; se reinicia vacío cada vez que cambia el juego seleccionado.
- **Slot de equipo**: Posición del equipo que puede contener un Pokémon configurado (forma, género, shiny, estados especiales, Teratipo si aplica); tiene un estado de "activo/seleccionado" o no.
- **Pokémon (entrada de Pokédex)**: Especie con nombre, tipo(s) base, formas alternativas, variantes de género y variante shiny; cada forma puede tener su propio tipo, sprite por defecto/shiny y sprite por género.
- **Forma (Form)**: Variante de un Pokémon (regional, especial, etc.) que puede alterar su tipo y sus sprites (normal/shiny, macho/hembra) respecto a la forma por defecto.
- **Tipo (Type)**: Clasificación elemental de un Pokémon (hasta 2 por forma) usada para mostrar iconos/etiquetas en slot, Pokédex y tarjeta.
- **Teratipo (Tera Type)**: Tipo adicional aplicable únicamente en Pokémon Escarlata y Púrpura, asignado a un Pokémon del equipo; por defecto es su tipo primario al añadirlo, pero el usuario puede cambiarlo libremente a cualquiera de los 18 tipos desde la tarjeta de configuración; se muestra junto a sus tipos normales en el slot y en la tarjeta.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Al seleccionar un juego distinto, el usuario ve el configurador del nuevo juego con equipo vacío en menos de 1 segundo, sin ningún diálogo intermedio, el 100% de las veces.
- **SC-002**: En la versión web, el usuario puede ver simultáneamente al menos un slot de equipo y varios resultados de la Pokédex sin necesidad de scroll de página completa.
- **SC-003**: Al abrir cualquier Pokédex nacional, los primeros resultados son visibles en menos de 1 segundo, independientemente del tamaño total de la Pokédex.
- **SC-004**: El usuario puede desplazarse por una Pokédex nacional completa sin experimentar esperas perceptibles entre lotes de carga.
- **SC-005**: El 100% de las búsquedas por nombre válido devuelven el Pokémon correspondiente, esté o no entre los resultados ya cargados localmente.
- **SC-006**: El 100% de las combinaciones de forma + shiny + género probadas muestran el sprite correcto correspondiente a la forma seleccionada.
- **SC-007**: Un usuario puede identificar visualmente, sin leer texto adicional, qué Pokémon de la Pokédex ya están en su equipo y cuál es el slot activo, basándose únicamente en el color de fondo tipo Pokébola.
- **SC-008**: El 100% de los slots con Pokémon asignado muestran correctamente su(s) tipo(s) actualizados según la forma seleccionada, y el Teratipo cuando el juego lo soporta y aplica.
- **SC-009**: Los usuarios reportan una percepción de mejor claridad y orden en la tarjeta de configuración frente al diseño anterior (evaluado mediante retroalimentación cualitativa post-lanzamiento).

## Assumptions

- "Versión web" se interpreta como el layout "expanded" (escritorio) ya definido por el sistema de diseño existente de BrewDex; por debajo de ese umbral se conserva el layout compacto/medio de una sola columna existente, sin introducir un nuevo punto de corte propio de esta mejora.
- El color exacto de los fondos tipo Pokébola (seleccionado vs. no seleccionado en Pokédex; slot activo vs. inactivo) queda a criterio de diseño visual dentro de la paleta existente de BrewDex, siempre que el contraste entre ambos estados sea claramente distinguible.
- El rediseño visual de la tarjeta de configuración (punto 8 de la solicitud original) sigue la referencia visual proporcionada por el usuario (ver User Story 6), adaptada con la paleta y tipografía ya existentes en BrewDex; la única adición sobre esa referencia es la fila de tipo(s)/Teratipo bajo el nombre, requerida por FR-017.
- La fuente de datos de Pokémon (API) permite tanto paginación como búsqueda directa por nombre/id; no se requieren cambios en el proveedor de datos, solo en la forma en que el configurador la consume.
- El límite de 20 elementos en la carga inicial y el tamaño de lote del scroll infinito son un valor de referencia inicial; puede ajustarse en implementación siempre que el efecto percibido (carga casi instantánea, sin esperas visibles) se mantenga.
- Los estados especiales mostrados en la tarjeta (Mega, Shiny, Dinamax, etc.) son los que ya existen y aplican según el juego activo; esta especificación no añade ni quita estados especiales, solo mejora su presentación visual.
