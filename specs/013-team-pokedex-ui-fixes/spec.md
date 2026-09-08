# Feature Specification: Ajustes de Tamaño de Tipos, Disponibilidad de Formas por Juego, Tarjetas y Análisis de Cobertura

**Feature Branch**: `013-team-pokedex-ui-fixes`

**Created**: 2026-09-01

**Status**: Draft

**Input**: User description: "Mejoras de UI para BrewDex - equipo, pokedex, tarjetas de pokemon y sección de análisis de cobertura: (1) En los slots del equipo, los iconos/etiquetas de tipo de Pokémon salen demasiado grandes. En la versión web deben tener un tamaño que permita mostrar dos tipos en una sola fila. En la versión móvil pueden mostrarse en filas separadas, pero sin padding ni margen entre ellos (o con un espaciado mínimo reducido). (2) En Rojo Fuego y Verde Hoja se pueden elegir formas de Alola, lo cual es incorrecto porque esas formas no existen en ese juego. Hay que verificar que la disponibilidad de las formas dependa del juego seleccionado. (3) En la Pokédex, los tipos se muestran muy grandes: deben tener el mismo tamaño que los usados en los slots del equipo. Además tienen un fondo negro que debe eliminarse, y el tamaño del botón debe coincidir con el tamaño de la imagen (sin espacio extra). (4) En las tarjetas de Pokémon, la imagen del Pokémon debe agrandarse al menos un 75% más grande. Los tipos deben usar el mismo tamaño acordado en los puntos anteriores. (5) Eliminar la sección/visualización de debilidades por tipo en las tarjetas de Pokémon. (6) En los movimientos elegidos (del Pokémon en el equipo), usar una interfaz visual igual a la del selector de movimientos, reutilizando el componente existente si es posible. (7) El botón 'Quitar del equipo' debe quedar sticky (fijo) dentro de la tarjeta del Pokémon. (8) Agregar una nueva sección de 'Análisis de cobertura'. Por ahora, construirla incrementalmente: agregar una tabla cuya primera columna contenga todos los tipos de Pokémon (usando texto, no es necesario usar los logos/iconos de tipo)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Los tipos se ven en un tamaño consistente y compacto en todo el configurador (Priority: P1)

Un entrenador ve las etiquetas de tipo de un Pokémon con un tamaño moderado y consistente en el espacio del equipo, en la Pokédex y en la tarjeta de personalización — nunca tan grandes que dominen el espacio disponible o impidan mostrar dos tipos en una sola fila cuando hay espacio para ello.

**Why this priority**: Es la queja visual más repetida en las iteraciones anteriores del configurador (los tipos "salen muy grandes"); afecta la legibilidad de tres pantallas distintas en cada sesión y bloquea la comparación rápida de tipos de un Pokémon con dos tipos.

**Independent Test**: Abrir el configurador en un viewport ancho (web) con un Pokémon de dos tipos en un espacio del equipo, y verificar que ambas etiquetas de tipo caben en una sola fila. Repetir en un viewport angosto (móvil) y verificar que, si se muestran en filas separadas, no hay padding ni margen perceptible entre ellas. Verificar además que el mismo tamaño de etiqueta se usa en la Pokédex (sin fondo negro y con el botón del mismo tamaño que la imagen) y en la tarjeta de personalización.

**Acceptance Scenarios**:

1. **Given** un espacio del equipo con un Pokémon de dos tipos, **When** se visualiza en la versión web, **Then** ambas etiquetas de tipo se muestran en una sola fila, sin desbordarse ni truncarse.
2. **Given** el mismo espacio del equipo, **When** se visualiza en la versión móvil, **Then** las etiquetas de tipo pueden mostrarse en filas separadas, con un espaciado nulo o mínimo entre ellas (sin el padding/margen amplio actual).
3. **Given** la lista de la Pokédex, **When** se muestra la etiqueta de tipo de un Pokémon, **Then** tiene el mismo tamaño que la etiqueta de tipo usada en los espacios del equipo, sin fondo negro detrás del ícono/texto.
4. **Given** un elemento de la Pokédex con su botón/imagen de Pokémon, **When** se mide el área del botón, **Then** coincide con el tamaño de la imagen que contiene, sin espacio extra alrededor.
5. **Given** la tarjeta de personalización de un Pokémon, **When** se muestran sus tipos, **Then** usan el mismo tamaño de etiqueta que en los espacios del equipo y la Pokédex.

---

### User Story 2 - Las formas disponibles para elegir dependen del juego seleccionado (Priority: P1)

Un entrenador que juega Rojo Fuego o Verde Hoja, al elegir la forma de un Pokémon, solo ve las formas que realmente existen en ese juego — nunca formas regionales u otras variantes introducidas en juegos posteriores, como las formas de Alola.

**Why this priority**: Mostrar formas que no existen en el juego seleccionado es un error de datos que rompe la coherencia del configurador y puede llevar a armar un equipo con Pokémon que son imposibles de obtener en ese juego.

**Independent Test**: Seleccionar Rojo Fuego o Verde Hoja como juego activo, abrir el selector de formas de un Pokémon que tiene formas de Alola en otros juegos (por ejemplo, Rattata o Vulpix), y verificar que esas formas no aparecen como opción.

**Acceptance Scenarios**:

1. **Given** el juego activo es Rojo Fuego o Verde Hoja, **When** el usuario abre el selector de formas de un Pokémon con formas de Alola en otros juegos, **Then** las formas de Alola no se muestran como opción disponible.
2. **Given** un Pokémon con múltiples formas regionales/especiales a través de distintos juegos, **When** el usuario cambia el juego activo, **Then** la lista de formas disponibles se actualiza para mostrar únicamente las formas que existen en el juego recién seleccionado.
3. **Given** un Pokémon tiene actualmente seleccionada una forma que no existe en el nuevo juego activo, **When** el usuario cambia de juego, **Then** la selección de forma se revierte a la forma base/predeterminada válida para ese juego.

---

### User Story 3 - La imagen del Pokémon en la tarjeta se ve notoriamente más grande (Priority: P2)

Un entrenador que abre la tarjeta de personalización de un Pokémon ve su imagen en un tamaño notoriamente mayor al actual, facilitando identificarlo y apreciar sus detalles visuales.

**Why this priority**: Es una mejora de legibilidad/aprovechamiento visual sobre una pantalla ya entregada; no bloquea ninguna funcionalidad existente.

**Independent Test**: Abrir la tarjeta de personalización de un Pokémon y comparar el tamaño de su imagen antes y después del cambio — debe verse al menos un 75% más grande.

**Acceptance Scenarios**:

1. **Given** la tarjeta de personalización de un Pokémon, **When** se muestra su imagen, **Then** su tamaño es al menos un 75% mayor al que tenía inmediatamente antes de este cambio.
2. **Given** la imagen agrandada, **When** se muestra junto al resto del contenido de la tarjeta (nombre, tipos, movimientos, acciones), **Then** ese contenido sigue siendo completamente legible y accesible, sin recortarse ni solaparse.

---

### User Story 4 - La tarjeta del Pokémon ya no muestra debilidades por tipo (Priority: P2)

Un entrenador que revisa la tarjeta de personalización de un Pokémon ya no ve la sección de debilidades por tipo, dejando la tarjeta enfocada en identidad, tipos y movimientos.

**Why this priority**: Es una simplificación solicitada explícitamente sobre contenido ya entregado; su remoción no afecta ninguna otra funcionalidad de la tarjeta.

**Independent Test**: Abrir la tarjeta de personalización de cualquier Pokémon y verificar que no existe ninguna sección, tabla o listado de debilidades/resistencias por tipo.

**Acceptance Scenarios**:

1. **Given** la tarjeta de personalización de un Pokémon, **When** se renderiza, **Then** no se muestra ninguna sección de debilidades por tipo.

---

### User Story 5 - Los movimientos elegidos se muestran con la misma interfaz que el selector de movimientos (Priority: P2)

Un entrenador que revisa los movimientos ya asignados a un Pokémon en su tarjeta los ve presentados con el mismo estilo visual (misma disposición de nombre, tipo, PP, potencia y descripción) que usa el selector cuando está eligiendo un movimiento, dando una experiencia consistente en ambas pantallas.

**Why this priority**: Mejora la consistencia visual y reduce el esfuerzo de mantenimiento al reutilizar un componente ya validado, aunque no bloquea ninguna funcionalidad existente de asignación de movimientos.

**Independent Test**: Comparar visualmente una fila de movimiento en el selector de movimientos con una fila de movimiento ya asignado en la tarjeta de personalización, y verificar que comparten la misma estructura visual (mismo componente reutilizado).

**Acceptance Scenarios**:

1. **Given** un movimiento ya asignado a un Pokémon en su tarjeta, **When** se muestra en la lista de movimientos elegidos, **Then** su presentación visual (estructura, tipografía, disposición de tipo/PP/potencia/descripción) coincide con la usada en el selector de movimientos.
2. **Given** el componente de movimiento reutilizado en la tarjeta, **When** se compara con su uso en el selector, **Then** las acciones propias de cada contexto (elegir vs. reemplazar/quitar) siguen funcionando correctamente sin perder la funcionalidad ya existente.

---

### User Story 6 - El botón de quitar del equipo permanece visible mientras se desplaza la tarjeta (Priority: P3)

Un entrenador que se desplaza dentro de una tarjeta de personalización larga (por ejemplo, con varios movimientos) siempre tiene a la vista el botón "Quitar del equipo", sin necesidad de desplazarse hasta el final para encontrarlo.

**Why this priority**: Es una mejora de conveniencia sobre una acción ya existente; no introduce nueva funcionalidad ni bloquea otras historias.

**Independent Test**: Abrir la tarjeta de personalización de un Pokémon con suficiente contenido para requerir desplazamiento interno, desplazarse dentro de la tarjeta, y verificar que el botón "Quitar del equipo" permanece visible y fijo en su posición dentro de la tarjeta.

**Acceptance Scenarios**:

1. **Given** la tarjeta de personalización de un Pokémon con contenido desplazable, **When** el usuario se desplaza dentro de la tarjeta, **Then** el botón "Quitar del equipo" permanece visible en una posición fija dentro de la tarjeta.
2. **Given** el botón "Quitar del equipo" fijo, **When** el usuario lo presiona en cualquier punto del desplazamiento, **Then** el Pokémon se quita del equipo como ya ocurría antes de este cambio.

---

### User Story 7 - Primera versión de la sección de Análisis de Cobertura (Priority: P3)

Un entrenador accede a una nueva sección de "Análisis de Cobertura" donde encuentra una tabla que lista, en su primera columna, todos los tipos de Pokémon (por nombre de texto), sentando la base sobre la cual se agregará el análisis de cobertura ofensiva/defensiva del equipo en iteraciones futuras.

**Why this priority**: Es el primer incremento de una funcionalidad que se construirá progresivamente; por sí sola no ofrece aún el análisis completo, pero es la base visible más pequeña que se puede entregar y validar.

**Independent Test**: Abrir la nueva sección de "Análisis de Cobertura" y verificar que existe una tabla cuya primera columna lista todos los tipos de Pokémon del juego, mostrados como texto (sin íconos/logos de tipo).

**Acceptance Scenarios**:

1. **Given** el usuario navega a la sección de "Análisis de Cobertura", **When** la sección se muestra, **Then** contiene una tabla con al menos una columna.
2. **Given** la tabla de la sección de Análisis de Cobertura, **When** se revisa su primera columna, **Then** lista todos los tipos de Pokémon existentes en el juego, uno por fila, representados como texto.

### Edge Cases

- ¿Qué pasa con un Pokémon de un solo tipo en el espacio del equipo? Se muestra una sola etiqueta de tipo, con el mismo tamaño reducido acordado; no aplica la lógica de dos etiquetas en una fila.
- ¿Qué pasa si el usuario cambia a un juego donde el Pokémon seleccionado no tiene ninguna forma alternativa (solo la base)? El selector de formas muestra únicamente la forma base, sin opciones adicionales.
- ¿Qué pasa si un Pokémon en el equipo tiene una forma seleccionada válida en el juego anterior pero dicha forma no existe en ningún otro juego además del actual? Se aplica la misma regla de invalidación: al cambiar de juego, si la forma activa no es válida, se revierte a la forma base/predeterminada.
- ¿Qué pasa si la tarjeta de personalización no tiene suficiente contenido para requerir desplazamiento? El botón "Quitar del equipo" simplemente se muestra en su posición dentro de la tarjeta, sin efecto visible de "sticky" al no haber desplazamiento que mostrarlo.
- ¿Qué pasa si el equipo del usuario está vacío al entrar a la sección de Análisis de Cobertura? La tabla igual se muestra con su primera columna listando todos los tipos; las columnas de análisis por Pokémon (a agregar en iteraciones futuras) quedan fuera del alcance de esta entrega.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: En la versión web, cuando un Pokémon en un espacio del equipo tiene dos tipos, el sistema DEBE mostrar ambas etiquetas de tipo en una sola fila.
- **FR-002**: En la versión móvil, cuando un Pokémon en un espacio del equipo tiene dos tipos y se muestran en filas separadas, el sistema DEBE mostrarlas sin padding ni margen entre ellas, o con un espaciado mínimo reducido respecto al actual.
- **FR-003**: El tamaño de las etiquetas de tipo en los espacios del equipo DEBE reducirse respecto al tamaño actual, lo suficiente para permitir el comportamiento de FR-001.
- **FR-004**: La disponibilidad de formas de un Pokémon en el selector de formas DEBE depender del juego actualmente seleccionado, mostrando únicamente las formas que existen en ese juego.
- **FR-005**: El sistema NO DEBE ofrecer formas de Alola como opción seleccionable cuando el juego activo es Rojo Fuego o Verde Hoja.
- **FR-006**: Al cambiar el juego activo, si la forma actualmente seleccionada de un Pokémon en el equipo no es válida para el nuevo juego, el sistema DEBE revertir la selección a la forma base/predeterminada válida para ese juego.
- **FR-007**: Las etiquetas de tipo mostradas en la Pokédex DEBEN usar el mismo tamaño que las etiquetas de tipo de los espacios del equipo (según FR-003).
- **FR-008**: El sistema DEBE eliminar el fondo negro detrás de las etiquetas de tipo en la Pokédex.
- **FR-009**: El botón/elemento interactivo que envuelve la imagen de un Pokémon en la Pokédex DEBE tener el mismo tamaño que la imagen que contiene, sin espacio adicional alrededor.
- **FR-010**: La imagen del Pokémon en la tarjeta de personalización DEBE mostrarse en un tamaño al menos un 75% mayor al que tenía inmediatamente antes de esta funcionalidad.
- **FR-011**: Las etiquetas de tipo en la tarjeta de personalización DEBEN usar el mismo tamaño acordado en FR-003/FR-007.
- **FR-012**: El sistema DEBE eliminar la sección de debilidades por tipo de la tarjeta de personalización del Pokémon.
- **FR-013**: La lista de movimientos ya asignados a un Pokémon en su tarjeta de personalización DEBE presentarse reutilizando el mismo componente visual usado en el selector de movimientos.
- **FR-014**: El botón "Quitar del equipo" en la tarjeta de personalización DEBE permanecer visible en una posición fija dentro de la tarjeta mientras el contenido de la tarjeta se desplaza.
- **FR-015**: El sistema DEBE ofrecer una nueva sección de navegación llamada "Análisis de Cobertura".
- **FR-016**: La sección de Análisis de Cobertura DEBE mostrar una tabla cuya primera columna lista todos los tipos de Pokémon del juego, representados como texto (sin íconos/logos de tipo).

### Key Entities

- **Tipo (Type)**: Categoría elemental de un Pokémon o movimiento (por ejemplo, Fuego, Agua, Planta); en esta funcionalidad se referencia por su nombre de texto y por su representación visual (etiqueta/ícono) cuyo tamaño se estandariza en varias pantallas.
- **Forma (Form)**: Variante de un Pokémon (regional, especial, etc.) cuya disponibilidad como opción seleccionable depende del juego activo.
- **Juego (Game)**: Título de la saga Pokémon seleccionado por el usuario como contexto activo; determina qué formas y qué movimientos por nivel están disponibles.
- **Tarjeta de personalización**: Vista de detalle de un Pokémon del equipo que muestra su imagen, tipos, movimientos asignados y la acción de quitarlo del equipo.
- **Sección de Análisis de Cobertura**: Nueva sección que, en esta primera entrega, contiene una tabla con los tipos de Pokémon como base para un análisis de cobertura ofensiva/defensiva a construir en iteraciones futuras.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En la versión web, el 100% de los Pokémon con dos tipos muestran ambas etiquetas de tipo en una sola fila en los espacios del equipo, la Pokédex y la tarjeta de personalización.
- **SC-002**: En la versión móvil, el espaciado entre etiquetas de tipo mostradas en filas separadas se reduce a un espaciado nulo o mínimo, medible como una disminución respecto al espaciado actual.
- **SC-003**: El 100% de las formas ofrecidas como opción en el selector de formas, para cualquier juego seleccionado, existen realmente en ese juego (0% de formas inválidas mostradas).
- **SC-004**: La imagen del Pokémon en la tarjeta de personalización mide al menos un 75% más que su tamaño anterior, verificable por comparación directa.
- **SC-005**: Ninguna tarjeta de personalización muestra ya una sección de debilidades por tipo.
- **SC-006**: Los usuarios pueden ver el botón "Quitar del equipo" sin necesidad de desplazarse hasta el final de la tarjeta, en el 100% de los casos donde la tarjeta requiere desplazamiento.
- **SC-007**: La sección de Análisis de Cobertura es accesible desde la navegación y su tabla lista el 100% de los tipos de Pokémon del juego en su primera columna.

## Assumptions

- El "tamaño acordado" de las etiquetas de tipo (FR-003) se define de forma consistente para reutilizarse igual en espacios del equipo, Pokédex y tarjeta de personalización; no se requiere que sea idéntico en píxeles entre web y móvil, siempre que en web permita dos tipos en una fila y en móvil minimice el espaciado.
- La fuente de datos de formas por Pokémon ya distingue, para cada forma, en qué juego(s) está disponible; esta funcionalidad depende de que esa información exista o pueda derivarse (por ejemplo, formas de Alola marcadas como introducidas en Sol/Luna en adelante), sin necesidad de recolectar nueva información externa.
- "Quitar movimientos del equipo" y otras acciones ya existentes sobre los movimientos asignados no cambian de comportamiento, solo su presentación visual (FR-013).
- La sección de Análisis de Cobertura es una entrega incremental: en esta iteración solo se requiere la tabla con la columna de tipos; columnas adicionales de cobertura ofensiva/defensiva del equipo actual quedan fuera de alcance y se agregarán en funcionalidades futuras.
- El listado de "todos los tipos de Pokémon" se basa en el conjunto de tipos ya soportado por el sistema (los mismos usados en filtros de tipo existentes), sin necesidad de agregar tipos nuevos no contemplados previamente.
