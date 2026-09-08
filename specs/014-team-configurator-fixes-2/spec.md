# Feature Specification: Correcciones de Configurador de Equipo (Tipos, Tarjeta, Legends Z-A y Cobertura)

**Feature Branch**: `014-team-configurator-fixes-2`

**Created**: 2026-09-01

**Status**: Draft

**Input**: User description: "Correcciones adicionales sobre el configurador de equipo de BrewDex (continuación de 013-team-pokedex-ui-fixes): (1) En los slots del equipo, los tipos del Pokémon siguen viéndose demasiado grandes; en la versión web no caben dos tipos en una sola fila y deben caber. (2) En la tarjeta de personalización se redujo por error el tamaño de los tipos: deben mantener el mismo tamaño que se defina para los slots del equipo (no un tamaño menor), y además la imagen del Pokémon debe ser más grande. (3) Los botones de Mega, Dinamax y Shiny en la tarjeta deben ser sticky (fijos) igual que el botón de quitar del equipo. (4) En Leyendas Pokémon Z-A, Feraligatr no tiene movimientos disponibles para seleccionar; hay que investigar y corregir la causa. (5) En Leyendas Pokémon Z-A debería estar disponible la Mega Evolución para los Pokémon que la tienen, y actualmente no aparece como opción; hay que habilitarla. (6) Al activar Dinamax o Mega Evolución en un Pokémon del equipo, los movimientos ya seleccionados se están eliminando; no deben perderse al cambiar ese estado. (7) En los juegos de 5ta generación o anteriores, al elegir un Pokémon como Clefairy se le asigna el tipo Hada, que no existía en esos juegos; los Pokémon que en generaciones posteriores son de tipo Hada deben mostrar los tipos que tenían realmente en esos juegos según la generación seleccionada. (8) La sección/tabla de Análisis de Cobertura no es visible actualmente en la interfaz; hay que corregir por qué no se muestra. (9) En la tabla de Análisis de Cobertura, agregar una columna de 'Eficacia de defensa': para cada fila (tipo atacante) debe mostrar con qué eficacia (0, 0.5, 1, 2 o 4) un ataque de ese tipo afectaría al Pokémon de la tarjeta actualmente mostrada."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Los movimientos elegidos no se pierden al activar Dinamax o Mega Evolución (Priority: P1)

Un entrenador que ya eligió los movimientos de un Pokémon en su equipo activa Dinamax o Mega Evolución sobre ese Pokémon y comprueba que sus movimientos seleccionados siguen ahí, sin tener que volver a elegirlos.

**Why this priority**: Es una pérdida de datos ya introducidos por el usuario; ocurre en una acción común (activar Dinamax/Mega) y obliga a rehacer trabajo ya hecho, siendo el bug más disruptivo de esta tanda.

**Independent Test**: Elegir 4 movimientos para un Pokémon del equipo, activar Dinamax y verificar que los 4 movimientos siguen asignados; repetir activando Mega Evolución en vez de Dinamax; repetir desactivando Dinamax/Mega y verificar que los movimientos tampoco se pierden al revertir.

**Acceptance Scenarios**:

1. **Given** un Pokémon del equipo con movimientos ya elegidos, **When** el entrenador activa Dinamax sobre ese Pokémon, **Then** los movimientos elegidos permanecen exactamente igual.
2. **Given** un Pokémon del equipo con movimientos ya elegidos, **When** el entrenador activa Mega Evolución sobre ese Pokémon, **Then** los movimientos elegidos permanecen exactamente igual.
3. **Given** un Pokémon con Dinamax o Mega Evolución activos y movimientos elegidos, **When** el entrenador desactiva ese estado, **Then** los movimientos elegidos siguen presentes.

---

### User Story 2 - La tabla de Análisis de Cobertura vuelve a ser visible (Priority: P1)

Un entrenador que navega a la sección de Análisis de Cobertura puede verla y usarla; actualmente la sección o su tabla no aparece en pantalla aunque la funcionalidad exista.

**Why this priority**: La funcionalidad de análisis de cobertura, ya construida en una iteración anterior, es completamente inaccesible para el usuario; sin visibilidad, ninguna otra mejora sobre esa tabla (incluida la nueva columna de este mismo pedido) tiene efecto práctico.

**Independent Test**: Navegar a la sección de Análisis de Cobertura desde el configurador de equipo y verificar que la tabla se renderiza en pantalla, con contenido visible y legible, tanto en la versión web como en la móvil.

**Acceptance Scenarios**:

1. **Given** el entrenador está en el configurador de equipo, **When** navega a la sección de Análisis de Cobertura, **Then** la tabla se muestra en pantalla con sus filas y columnas visibles.
2. **Given** la tabla de Análisis de Cobertura visible, **When** se reduce o amplía el ancho de la ventana (web) o se usa en móvil, **Then** la tabla sigue siendo visible y accesible (con scroll si es necesario), sin quedar oculta ni con tamaño cero.

---

### User Story 3 - Feraligatr tiene movimientos disponibles en Leyendas Pokémon Z-A (Priority: P1)

Un entrenador que arma su equipo en Leyendas Pokémon Z-A y agrega a Feraligatr puede ver y elegir su lista de movimientos disponibles para ese juego, en vez de encontrarse con una lista vacía.

**Why this priority**: Sin movimientos disponibles, Feraligatr queda inutilizable como miembro del equipo en ese juego, lo cual es un bloqueo funcional completo para ese Pokémon.

**Independent Test**: Seleccionar Leyendas Pokémon Z-A como juego activo, agregar a Feraligatr al equipo y abrir su selector de movimientos; verificar que aparece una lista de movimientos no vacía y coherente con los movimientos que Feraligatr puede aprender en ese juego.

**Acceptance Scenarios**:

1. **Given** el juego activo es Leyendas Pokémon Z-A, **When** el entrenador abre el selector de movimientos de Feraligatr, **Then** se muestra una lista de movimientos disponibles no vacía.
2. **Given** el mismo contexto, **When** se compara la causa raíz con otros Pokémon que sí muestran movimientos correctamente en ese juego, **Then** cualquier otro Pokémon afectado por la misma causa (datos de movimientos faltantes o mal asociados a ese juego) queda igualmente corregido, no solo Feraligatr.

---

### User Story 4 - La Mega Evolución está disponible en Leyendas Pokémon Z-A (Priority: P1)

Un entrenador que juega Leyendas Pokémon Z-A y tiene en su equipo un Pokémon con Mega Evolución conocida puede activarla, tal como puede hacerlo en los demás juegos donde la Mega Evolución existe.

**Why this priority**: Leyendas Pokémon Z-A es un juego donde la Mega Evolución es un mecanismo central; que la opción no aparezca impide usar una mecánica propia y esperada de ese juego.

**Independent Test**: Seleccionar Leyendas Pokémon Z-A como juego activo, agregar al equipo un Pokémon con una Mega Evolución conocida (por ejemplo, uno de sus Pokémon iniciales con Mega) y verificar que la opción de Mega Evolución aparece disponible y funciona igual que en otros juegos donde ya funcionaba.

**Acceptance Scenarios**:

1. **Given** el juego activo es Leyendas Pokémon Z-A, **When** el entrenador abre la tarjeta de un Pokémon del equipo que tiene Mega Evolución conocida, **Then** el botón/opción de Mega Evolución está disponible.
2. **Given** la opción de Mega Evolución disponible en ese juego, **When** el entrenador la activa, **Then** el Pokémon cambia a su forma Mega igual que en cualquier otro juego compatible.

---

### User Story 5 - Los Pokémon muestran los tipos correctos en juegos de 5ª generación o anteriores (Priority: P1)

Un entrenador que juega un título de 5ª generación o anterior y elige un Pokémon que en juegos posteriores es de tipo Hada (como Clefairy) ve los tipos que ese Pokémon realmente tenía en esa generación, ya que el tipo Hada no existía todavía.

**Why this priority**: Es un error de datos que muestra información incorrecta sobre reglas del juego (tipos), pudiendo inducir a construir un equipo con expectativas de cobertura/resistencias equivocadas para el juego seleccionado.

**Independent Test**: Seleccionar un juego de 5ª generación o anterior (por ejemplo, uno de la saga Blanco/Negro), elegir Clefairy y verificar que su tipo mostrado es el que tenía en esa generación (Normal), no Hada. Repetir con otros Pokémon que cambiaron a tipo Hada en generaciones posteriores (por ejemplo Jigglypuff, Marill, Azumarill, Mr. Mime, Snubbull, Granbull, Togepi/Togetic/Togekiss) y verificar que cada uno muestra el/los tipo(s) que tenía antes de la introducción del tipo Hada.

**Acceptance Scenarios**:

1. **Given** el juego activo pertenece a la 5ª generación o anterior, **When** el entrenador elige un Pokémon cuyo tipo cambió a Hada en generaciones posteriores, **Then** el tipo mostrado es el que tenía en la generación del juego activo (sin incluir Hada).
2. **Given** el juego activo pertenece a la 6ª generación en adelante, **When** el entrenador elige el mismo Pokémon, **Then** el tipo mostrado incluye Hada, como corresponde a esas generaciones.
3. **Given** un Pokémon con tipo Hada seleccionado en el equipo, **When** el entrenador cambia el juego activo a uno de 5ª generación o anterior, **Then** los tipos mostrados para ese Pokémon en el equipo se actualizan a los correctos para la nueva generación.

---

### User Story 6 - Las etiquetas de tipo mantienen un tamaño consistente y compacto en slots y tarjeta (Priority: P2)

Un entrenador ve las etiquetas de tipo de un Pokémon con el mismo tamaño en los espacios del equipo y en la tarjeta de personalización; en la versión web, cuando un Pokémon tiene dos tipos, ambos caben en una sola fila dentro del espacio del equipo.

**Why this priority**: Es una regresión visual sobre una corrección ya entregada previamente (el tamaño de tipos ya se había ajustado y en la tarjeta terminó reducido por debajo del tamaño acordado); afecta la lectura rápida del equipo pero no bloquea ninguna funcionalidad.

**Independent Test**: Abrir el configurador en un viewport ancho (web) con un Pokémon de dos tipos en un espacio del equipo y verificar que ambas etiquetas de tipo caben en una sola fila. Abrir la tarjeta de personalización del mismo Pokémon y verificar que sus etiquetas de tipo tienen el mismo tamaño (no menor) que las del espacio del equipo.

**Acceptance Scenarios**:

1. **Given** un espacio del equipo con un Pokémon de dos tipos, **When** se visualiza en la versión web, **Then** ambas etiquetas de tipo se muestran en una sola fila, sin desbordarse ni truncarse.
2. **Given** la tarjeta de personalización de un Pokémon, **When** se muestran sus etiquetas de tipo, **Then** tienen el mismo tamaño que las etiquetas de tipo usadas en los espacios del equipo (nunca un tamaño menor).

---

### User Story 7 - La imagen del Pokémon en la tarjeta se ve notoriamente más grande (Priority: P2)

Un entrenador que abre la tarjeta de personalización de un Pokémon ve su imagen en un tamaño notoriamente mayor al actual, facilitando identificarlo y apreciar sus detalles visuales, sin que el resto del contenido de la tarjeta pierda legibilidad.

**Why this priority**: Es una mejora de legibilidad/aprovechamiento visual solicitada de forma explícita y repetida; no bloquea ninguna funcionalidad existente.

**Independent Test**: Abrir la tarjeta de personalización de un Pokémon y comparar el tamaño de su imagen antes y después del cambio, verificando además que el nombre, tipos, movimientos y acciones siguen siendo completamente legibles sin recortarse ni solaparse.

**Acceptance Scenarios**:

1. **Given** la tarjeta de personalización de un Pokémon, **When** se muestra su imagen, **Then** su tamaño es notoriamente mayor al que tenía antes de este cambio.
2. **Given** la imagen agrandada, **When** se muestra junto al resto del contenido de la tarjeta, **Then** ese contenido sigue siendo completamente legible y accesible, sin recortarse ni solaparse, y sin romper el desplazamiento de la tarjeta.

---

### User Story 8 - La tabla de cobertura muestra la eficacia defensiva del Pokémon frente a cada tipo (Priority: P2)

Un entrenador que consulta la tabla de Análisis de Cobertura para el Pokémon mostrado en la tarjeta ve, además del tipo atacante, con qué multiplicador de daño (0, 0.5, 1, 2 o 4) le afectaría un ataque de ese tipo a ese Pokémon — es decir, su debilidad o resistencia real frente a cada tipo, considerando su tipo o tipos actuales.

**Why this priority**: Es una ampliación de valor sobre la tabla de cobertura (US2): una vez visible, agregar la eficacia defensiva la convierte en una herramienta útil para decidir cobertura de equipo, pero depende de que la tabla ya sea visible.

**Independent Test**: Con la tabla de Análisis de Cobertura visible para un Pokémon con uno o dos tipos, verificar que cada fila de tipo atacante muestra el multiplicador correcto de eficacia contra ese Pokémon (0, 0.5, 1, 2 o 4), contrastando manualmente algunas filas contra las reglas de tipos conocidas (por ejemplo, un Pokémon de dos tipos con doble debilidad a un tipo muestra 4).

**Acceptance Scenarios**:

1. **Given** la tabla de Análisis de Cobertura para un Pokémon de un solo tipo, **When** se revisa cada fila, **Then** la columna de eficacia de defensa muestra el multiplicador correcto (0, 0.5, 1 o 2) para ese tipo atacante contra el tipo del Pokémon.
2. **Given** la tabla de Análisis de Cobertura para un Pokémon de dos tipos, **When** un tipo atacante es débil contra ambos tipos del Pokémon a la vez, **Then** la columna de eficacia de defensa muestra 4.
3. **Given** la tabla de Análisis de Cobertura para un Pokémon con inmunidad a un tipo, **When** se revisa la fila de ese tipo atacante, **Then** la columna de eficacia de defensa muestra 0.
4. **Given** el entrenador cambia de Pokémon mostrado en la tarjeta, **When** vuelve a ver la tabla de cobertura, **Then** la columna de eficacia de defensa se recalcula para el nuevo Pokémon.

---

### User Story 9 - Los botones de Mega, Dinamax y Shiny permanecen visibles al desplazar la tarjeta (Priority: P3)

Un entrenador que se desplaza dentro de una tarjeta de personalización larga siempre tiene a la vista los botones de Mega Evolución, Dinamax y Shiny, además del botón "Quitar del equipo" que ya es sticky, sin necesidad de desplazarse para encontrarlos.

**Why this priority**: Es una mejora de conveniencia sobre acciones ya existentes; no introduce funcionalidad nueva ni bloquea otras historias.

**Independent Test**: Abrir la tarjeta de personalización de un Pokémon con suficiente contenido para requerir desplazamiento interno, desplazarse dentro de la tarjeta y verificar que los botones de Mega, Dinamax y Shiny permanecen visibles y fijos en su posición, igual que el botón "Quitar del equipo".

**Acceptance Scenarios**:

1. **Given** una tarjeta de personalización con contenido suficiente para desplazarse, **When** el entrenador se desplaza dentro de ella, **Then** los botones de Mega, Dinamax y Shiny permanecen visibles en una posición fija.
2. **Given** los botones fijos (Mega, Dinamax, Shiny, Quitar del equipo), **When** se muestran juntos, **Then** no se solapan entre sí ni tapan contenido de la tarjeta que el entrenador necesite leer.

---

### Edge Cases

- ¿Qué ocurre si un Pokémon no tiene Mega Evolución conocida en Leyendas Pokémon Z-A? El botón/opción de Mega Evolución no debe mostrarse para ese Pokémon, igual que en otros juegos.
- ¿Qué ocurre si un Pokémon tiene Dinamax y Mega Evolución activados en algún punto y luego se cambia de juego a uno donde ese mecanismo no existe? Los movimientos elegidos deben conservarse igualmente; solo la disponibilidad del mecanismo cambia según el juego.
- ¿Qué ocurre con Pokémon que en 5ª generación o anteriores no existían todavía (introducidos en 6ª generación en adelante) pero son de tipo Hada? No aplica el requisito de re-tipado porque esos Pokémon no están disponibles como opción en esos juegos.
- ¿Qué ocurre si, tras la corrección de movimientos de Feraligatr en Leyendas Pokémon Z-A, el Pokémon ya estaba en el equipo con movimientos vacíos por el bug? Al reabrir su selector de movimientos, la lista corregida debe estar disponible para elegir sin necesidad de quitar y volver a agregar al Pokémon.
- ¿Qué ocurre en móvil con la tabla de Análisis de Cobertura y su nueva columna? La tabla debe seguir siendo utilizable (con scroll horizontal si hace falta) en vez de desbordar o recortar contenido.
- ¿Qué ocurre si el Pokémon mostrado en la tarjeta cambia de tipos (por ejemplo, al activar Mega Evolución con cambio de tipo)? La columna de eficacia de defensa de la tabla de cobertura debe reflejar los tipos vigentes en ese momento, no los tipos base.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema NO DEBE eliminar ni modificar los movimientos ya elegidos de un Pokémon del equipo cuando se activa o desactiva Dinamax sobre ese Pokémon.
- **FR-002**: El sistema NO DEBE eliminar ni modificar los movimientos ya elegidos de un Pokémon del equipo cuando se activa o desactiva Mega Evolución sobre ese Pokémon.
- **FR-003**: La sección de Análisis de Cobertura y su tabla DEBEN ser visibles y accesibles desde el configurador de equipo, en versión web y móvil.
- **FR-004**: El selector de movimientos de Feraligatr DEBE mostrar una lista de movimientos disponibles no vacía cuando el juego activo es Leyendas Pokémon Z-A, consistente con los movimientos que ese Pokémon puede aprender en ese juego.
- **FR-005**: El sistema DEBE ofrecer la opción de Mega Evolución para cualquier Pokémon del equipo que tenga una Mega Evolución conocida, cuando el juego activo es Leyendas Pokémon Z-A, igual que lo hace en los demás juegos donde la Mega Evolución existe.
- **FR-006**: El sistema DEBE mostrar el tipo o tipos de un Pokémon correspondientes a la generación del juego activo; para juegos de 5ª generación o anteriores, el tipo Hada NO DEBE mostrarse, y en su lugar deben mostrarse el/los tipo(s) que ese Pokémon tenía antes de la introducción del tipo Hada.
- **FR-007**: Cuando el entrenador cambia el juego activo, los tipos mostrados para los Pokémon ya elegidos en el equipo DEBEN recalcularse según la generación del nuevo juego activo.
- **FR-008**: Las etiquetas de tipo en los espacios del equipo DEBEN tener un tamaño que permita mostrar dos tipos en una sola fila en la versión web.
- **FR-009**: Las etiquetas de tipo en la tarjeta de personalización DEBEN usar el mismo tamaño que las etiquetas de tipo de los espacios del equipo (nunca un tamaño menor).
- **FR-010**: La imagen del Pokémon en la tarjeta de personalización DEBE mostrarse en un tamaño notoriamente mayor al actual, sin recortar ni solapar el resto del contenido de la tarjeta.
- **FR-011**: Los botones de Mega Evolución, Dinamax y Shiny en la tarjeta de personalización DEBEN permanecer visibles (sticky) mientras se desplaza el contenido de la tarjeta, igual que el botón "Quitar del equipo".
- **FR-012**: La tabla de Análisis de Cobertura DEBE incluir una columna de "Eficacia de defensa" que muestre, para cada tipo atacante (fila), el multiplicador de daño (0, 0.5, 1, 2 o 4) que ese tipo de ataque tendría contra el/los tipo(s) actuales del Pokémon mostrado en la tarjeta.
- **FR-013**: La columna de eficacia de defensa DEBE combinar correctamente las debilidades/resistencias de ambos tipos cuando el Pokémon tiene dos tipos (multiplicando los factores individuales de cada tipo), siguiendo las reglas estándar de eficacia de tipos.
- **FR-014**: La columna de eficacia de defensa DEBE recalcularse cada vez que cambian los tipos vigentes del Pokémon mostrado (por ejemplo, al cambiar de Pokémon, de juego/generación, o al activar/desactivar una Mega Evolución que cambia de tipo).

### Key Entities

- **Movimientos elegidos del equipo**: Los movimientos ya asignados a un Pokémon del equipo; deben persistir independientemente de los cambios de estado (Dinamax, Mega Evolución) sobre ese mismo Pokémon.
- **Disponibilidad de movimientos por juego**: Relación entre un Pokémon, un juego y los movimientos que puede aprender en ese juego; es la fuente que alimenta el selector de movimientos y debe estar completa para Leyendas Pokémon Z-A.
- **Disponibilidad de Mega Evolución por juego**: Relación entre un Pokémon, su Mega Evolución conocida y los juegos donde esa mecánica está habilitada; debe incluir Leyendas Pokémon Z-A para los Pokémon con Mega Evolución conocida.
- **Tipo por generación**: El/los tipo(s) de un Pokémon dependen de la generación del juego activo; el tipo Hada solo aplica desde la generación en que fue introducido.
- **Tabla de Análisis de Cobertura**: Lista de tipos con, para cada uno, su eficacia de ataque general y ahora también su eficacia de defensa (multiplicador de daño recibido) contra el Pokémon actualmente mostrado.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100% de los cambios de estado de Dinamax/Mega Evolución sobre un Pokémon del equipo conservan intactos los movimientos previamente elegidos.
- **SC-002**: La tabla de Análisis de Cobertura es visible en el 100% de los casos al navegar a esa sección, en web y en móvil.
- **SC-003**: Feraligatr y cualquier otro Pokémon afectado por la misma causa muestran una lista de movimientos disponible en Leyendas Pokémon Z-A, sin listas vacías inesperadas.
- **SC-004**: La opción de Mega Evolución aparece disponible en Leyendas Pokémon Z-A para el 100% de los Pokémon del equipo que tienen una Mega Evolución conocida.
- **SC-005**: En juegos de 5ª generación o anteriores, ningún Pokémon muestra el tipo Hada; todos muestran el tipo que tenían antes de su introducción.
- **SC-006**: En un viewport web ancho, el 100% de los Pokémon de dos tipos en un espacio del equipo muestran ambos tipos en una sola fila.
- **SC-007**: Las etiquetas de tipo de la tarjeta de personalización tienen el mismo tamaño (en píxeles) que las de los espacios del equipo, verificable en el mismo viewport.
- **SC-008**: La columna de eficacia de defensa de la tabla de cobertura coincide con el cálculo esperado según las reglas de tipos en el 100% de los casos verificados manualmente (incluyendo casos de 0, 0.5, 1, 2 y 4).

## Assumptions

- El cálculo de eficacia de tipos (ataque y ahora defensa) sigue las reglas estándar de la franquicia Pokémon (matriz de 18 tipos), sin variaciones específicas de mecánica de combate por generación más allá de la existencia o no del tipo Hada.
- "Generación 5 o anteriores" se refiere a los juegos principales lanzados antes de la introducción del tipo Hada (Pokémon X/Y, 6ª generación); esto incluye entre otros Rojo/Azul/Amarillo, Oro/Plata/Cristal, Rubí/Zafiro/Esmeralda/Rojo Fuego/Verde Hoja, Diamante/Perla/Platino/Oro HeartGold/Plata SoulSilver, y Blanco/Negro/Blanco 2/Negro 2.
- Los tipos "pre-Hada" de cada Pokémon afectado (por ejemplo Normal para Clefairy/Jigglypuff, Normal para Snubbull/Granbull, Agua/Hada→Agua para Marill/Azumarill, Psíquico para Mr. Mime, Normal para Togepi/Togetic/Togekiss) corresponden a los tipos históricos reales que tenían antes de la 6ª generación.
- El mismo mecanismo de re-tipado por generación ya podría existir parcialmente en el sistema (por ejemplo para otras variaciones de tipo por juego); esta corrección se apoya en ese mecanismo o lo introduce si no existe.
- La causa de la lista vacía de movimientos de Feraligatr en Leyendas Pokémon Z-A es un problema de datos (movimientos faltantes o mal asociados a ese juego/Pokémon) y no una restricción intencional; se asume que Feraligatr sí es utilizable en ese juego.
- "Sticky" para los botones de Mega, Dinamax y Shiny significa el mismo comportamiento de fijado ya implementado para el botón "Quitar del equipo" en la iteración anterior.
- El tamaño de tipo "acordado" para los espacios del equipo es el que se defina/corrija en la historia US6 de esta misma iteración; la tarjeta debe igualarlo, no un valor fijo independiente.
