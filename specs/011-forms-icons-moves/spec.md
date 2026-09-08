# Feature Specification: Formas por Juego, Reparación de Megaevolución, Slots más Grandes, Íconos y Movimientos

**Feature Branch**: `011-forms-icons-moves`

**Created**: 2026-08-29

**Status**: Draft

**Input**: User description: "Correcciones y nueva funcionalidad para el configurador de equipo: (1) Las estadísticas base, los tipos y las formas disponibles de un Pokémon deben depender del juego/generación activo — actualmente se muestran formas que no corresponden al juego seleccionado (por ejemplo, Megaevolución en Rojo Fuego/Verde Hoja, Generación III, donde no existían). (2) Bug: al activar la Megaevolución no se puede volver a la forma anterior/base. (3) En la versión web, los slots del equipo deben ser al menos el doble de grandes. (4) Los íconos de tipo siguen viéndose muy pequeños; deben agrandarse considerablemente y usar directamente los íconos oficiales de Escarlata/Púrpura. (5) NUEVA FUNCIONALIDAD: agregar a la tarjeta de personalización una sección de movimientos con slots seleccionables, filtrados a los que el Pokémon puede aprender realmente en el juego activo, mostrando nombre/tipo/PP/potencia/descripción tanto en el slot seleccionado como en la vista de selección (filtrable por tipo)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Solo se ofrecen formas que existen en el juego activo (Priority: P1)

Un entrenador arma su equipo para Rojo Fuego/Verde Hoja y abre la tarjeta de personalización de un Pokémon que en juegos más modernos tiene Megaevolución. Como Rojo Fuego/Verde Hoja es un juego de una generación anterior a la introducción de las Megaevoluciones, esa opción no debería estar disponible para elegir.

**Why this priority**: Es un error de corrección de datos que hace que el configurador ofrezca combinaciones imposibles en el juego real, socavando la confiabilidad de la herramienta como referencia para armar un equipo válido para ese juego.

**Independent Test**: Abrir la tarjeta de personalización de un Pokémon con Megaevolución conocida en un juego de una generación anterior a su introducción (por ejemplo, Rojo Fuego/Verde Hoja) y verificar que no se ofrece la opción de Megaevolución; luego abrir la tarjeta del mismo Pokémon en un juego donde la Megaevolución sí existe y verificar que la opción sí aparece.

**Acceptance Scenarios**:

1. **Given** un Pokémon que tiene Megaevolución en juegos de Generación VI en adelante, **When** se abre su tarjeta de personalización en un juego de una generación anterior a la Generación VI, **Then** la opción de Megaevolución no se muestra como forma seleccionable.
2. **Given** el mismo Pokémon, **When** se abre su tarjeta de personalización en un juego donde la Megaevolución sí está disponible, **Then** la opción de Megaevolución se muestra normalmente y sigue siendo seleccionable.
3. **Given** un Pokémon con forma Gigamax, **When** se abre su tarjeta de personalización en un juego donde Gigamax no existe o no aplica a ese Pokémon, **Then** la opción de Gigamax no se muestra.
4. **Given** una forma regional o alternativa que solo existe a partir de cierto juego/generación, **When** se abre la tarjeta en un juego anterior a esa introducción, **Then** esa forma tampoco se ofrece como opción.

---

### User Story 2 - Se puede volver a la forma base después de activar Megaevolución (Priority: P1)

Un entrenador activa la Megaevolución de un Pokémon en la tarjeta de personalización y luego decide que prefiere mantenerlo en su forma normal. Al intentar desactivar la Megaevolución, el Pokémon debe volver a mostrarse en su forma base.

**Why this priority**: Es un bloqueador funcional directo — una vez que el usuario activa la Megaevolución, queda atrapado sin poder deshacer esa elección, lo que rompe la confianza en el resto de los controles de la tarjeta.

**Independent Test**: Seleccionar un Pokémon con Megaevolución disponible en el juego activo, activar la Megaevolución desde la tarjeta, y luego desactivarla (por ejemplo, tocando el mismo control de Megaevolución nuevamente). Verificar que el Pokémon vuelve a mostrar su forma base (sprite, tipos y estadísticas de la forma normal).

**Acceptance Scenarios**:

1. **Given** un Pokémon con Megaevolución disponible, **When** el usuario activa la Megaevolución desde la tarjeta, **Then** el Pokémon se muestra en su forma de Megaevolución.
2. **Given** el Pokémon ya está en su forma de Megaevolución, **When** el usuario vuelve a tocar el control de Megaevolución para desactivarla, **Then** el Pokémon vuelve a mostrarse en su forma base (no queda atrapado en la Megaevolución ni en un estado inconsistente).
3. **Given** el Pokémon volvió a su forma base tras desactivar la Megaevolución, **When** el usuario activa la Megaevolución nuevamente, **Then** el ciclo se repite correctamente cualquier cantidad de veces.

---

### User Story 3 - Los espacios del equipo se ven mucho más grandes en la versión web (Priority: P1)

Un entrenador usando la versión de escritorio/web del configurador quiere que cada espacio del equipo sea claramente más grande y fácil de ver, aprovechando el espacio que ya ocupa la mitad de la pantalla.

**Why this priority**: Aunque el panel de equipo ya ocupa la mitad de la pantalla (funcionalidad previa), los espacios individuales dentro de ese panel siguen viéndose pequeños, lo que sigue siendo una molestia de usabilidad visible en cada sesión.

**Independent Test**: Abrir el configurador en la versión web y medir el tamaño de un espacio del equipo; comparar contra el tamaño actual y verificar que es al menos el doble.

**Acceptance Scenarios**:

1. **Given** el usuario abre el configurador en la versión web, **When** el panel de equipo se renderiza, **Then** cada uno de los 6 espacios del equipo mide al menos el doble de su tamaño anterior.
2. **Given** los espacios ahora son más grandes, **When** se muestran el sprite, los tipos y el nombre del Pokémon dentro de un espacio ocupado, **Then** toda esa información sigue siendo legible y no se recorta ni se deforma.

---

### User Story 4 - Los íconos de tipo son grandes, claros y con la calidad oficial de Escarlata/Púrpura (Priority: P2)

Un entrenador identifica los tipos de un Pokémon por su ícono, pero actualmente el ícono se ve demasiado pequeño para distinguirse con comodidad, incluso después de agrandarlo previamente.

**Why this priority**: Es una mejora de claridad visual que afecta a múltiples partes de la pantalla, pero no bloquea ninguna funcionalidad — el ícono sigue siendo identificable, solo incómodo de ver.

**Independent Test**: Comparar el tamaño del ícono de un tipo en un espacio del equipo, en la tarjeta de personalización y en el filtro de tipos, antes y después del cambio — el ícono debe verse notoriamente más grande y nítido en las tres ubicaciones.

**Acceptance Scenarios**:

1. **Given** un Pokémon con uno o dos tipos, **When** se muestra en un espacio del equipo, en la tarjeta de personalización, o en el filtro de tipos, **Then** su ícono de tipo se ve considerablemente más grande que antes de este cambio.
2. **Given** el ícono de un tipo se resuelve correctamente, **When** se compara contra la imagen oficial de ese tipo publicada para Escarlata/Púrpura, **Then** coinciden en diseño y calidad de imagen.

---

### User Story 5 - Elegir y ver los movimientos de un Pokémon en la tarjeta (Priority: P1)

Un entrenador arma el equipo y quiere, además de elegir el Pokémon y su forma, definir qué movimientos llevará ese Pokémon — igual que en el juego real, donde cada Pokémon puede llevar un conjunto limitado de movimientos elegidos entre los que puede aprender.

**Why this priority**: Es la ampliación de mayor valor solicitada — sin esto, el configurador arma solo la mitad del equipo real (el Pokémon, pero no su set de combate), limitando su utilidad como herramienta de planificación.

**Independent Test**: Abrir la tarjeta de personalización de un Pokémon en un juego determinado, abrir la sección de movimientos, y verificar que solo aparecen como candidatos los movimientos que ese Pokémon puede aprender realmente en ese juego; seleccionar algunos y verificar que se muestran correctamente en sus espacios con nombre, tipo, PP, potencia y descripción.

**Acceptance Scenarios**:

1. **Given** el usuario abre la tarjeta de personalización de un Pokémon, **When** se muestra la sección de movimientos, **Then** aparecen varios espacios para seleccionar movimientos, inicialmente vacíos si no se ha elegido ninguno.
2. **Given** el usuario abre la selección de movimientos para un espacio vacío, **When** se muestra la lista de movimientos candidatos, **Then** solo aparecen los movimientos que ese Pokémon puede aprender realmente en el juego activo, no movimientos exclusivos de otros juegos/generaciones que ese Pokémon no puede aprender ahí.
3. **Given** la lista de movimientos candidatos, **When** se muestra cada uno, **Then** se ve su nombre, tipo, PP, potencia y descripción.
4. **Given** el usuario selecciona un movimiento candidato, **When** se confirma la selección, **Then** ese movimiento ocupa el espacio elegido y se muestra en él con su nombre, tipo, PP, potencia y descripción.
5. **Given** la lista de movimientos candidatos, **When** el usuario filtra por un tipo de movimiento específico, **Then** solo se muestran los movimientos candidatos de ese tipo.
6. **Given** el usuario cambia la forma seleccionada del Pokémon a una con tipos o aprendizaje de movimientos distintos, **When** los movimientos ya elegidos ya no son válidos para la nueva forma, **Then** el sistema maneja esa situación de forma consistente con cómo ya se resuelven otras incompatibilidades al cambiar de forma en esta tarjeta (por ejemplo, reiniciando la selección afectada).

### Edge Cases

- ¿Qué pasa si un Pokémon no tiene ninguna forma alternativa disponible en el juego activo (ni siquiera su forma base tiene variantes)? La sección de formas debe comportarse igual que hoy para un Pokémon sin formas alternativas: no se ofrece ningún selector de forma.
- ¿Qué pasa si, tras cambiar de juego, un Pokémon que tenía Megaevolución activa en el equipo ya no la tiene disponible en el nuevo juego? Debe revertir a la forma base de forma segura, consistente con cómo ya se maneja un cambio de juego que invalida datos del equipo.
- ¿Qué pasa si un movimiento ya seleccionado deja de estar disponible para el Pokémon (por ejemplo, tras cambiar de forma o de juego)? Ese espacio de movimiento debe quedar vacío o reiniciarse, nunca mostrar un movimiento inválido para la selección actual.
- ¿Qué pasa si el mismo movimiento se intenta seleccionar en dos espacios distintos? Debe evitarse duplicar un movimiento en más de un espacio del mismo Pokémon, igual que en el juego real.
- ¿Qué pasa si un movimiento no tiene potencia (por ejemplo, movimientos de estado que no causan daño directo)? Debe mostrarse de forma clara que ese movimiento no tiene un valor de potencia aplicable, sin mostrar un número engañoso como cero.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE filtrar la lista de formas seleccionables de un Pokémon (incluyendo Megaevolución, Gigamax y formas regionales/alternativas) para mostrar únicamente aquellas realmente obtenibles o utilizables en el juego actualmente activo.
- **FR-002**: El sistema DEBE ocultar por completo una forma no disponible en el juego activo, en vez de mostrarla deshabilitada o con una advertencia — no debe aparecer como opción.
- **FR-003**: El control para desactivar la Megaevolución (o Gigamax) DEBE devolver al Pokémon a su forma base de manera confiable, en cualquier cantidad de veces que se repita el ciclo de activar/desactivar.
- **FR-004**: En la versión de escritorio/web, cada uno de los 6 espacios del equipo DEBE medir al menos el doble de su tamaño actual (previo a esta funcionalidad).
- **FR-005**: El contenido de un espacio del equipo (sprite, tipos, nombre) DEBE seguir siendo completamente legible y no recortarse al aumentar el tamaño del espacio.
- **FR-006**: Los íconos de tipo mostrados en los espacios del equipo, en la tarjeta de personalización y en los filtros de tipo DEBEN agrandarse de forma considerable respecto a su tamaño anterior.
- **FR-007**: Los íconos de tipo DEBEN corresponder visualmente a los íconos oficiales publicados para Escarlata/Púrpura, con buena calidad de imagen.
- **FR-008**: La tarjeta de personalización DEBE incluir una sección de movimientos con varios espacios seleccionables para el Pokémon actualmente mostrado.
- **FR-009**: El sistema DEBE ofrecer, para cada espacio de movimiento, únicamente los movimientos que el Pokémon puede aprender realmente en el juego activo — no movimientos que solo son aprendibles en otros juegos o generaciones para ese Pokémon.
- **FR-010**: Un espacio de movimiento ya seleccionado DEBE mostrar el nombre, tipo, PP, potencia y descripción del movimiento elegido.
- **FR-011**: La vista de selección de movimientos DEBE mostrar, para cada movimiento candidato, su nombre, tipo, PP, potencia y descripción.
- **FR-012**: La vista de selección de movimientos DEBE poder filtrarse por tipo de movimiento, mostrando solo los candidatos que coincidan con el tipo elegido.
- **FR-013**: El sistema DEBE evitar que el mismo movimiento quede seleccionado en más de un espacio del mismo Pokémon al mismo tiempo.
- **FR-014**: Cuando un movimiento sin valor de potencia aplicable (por ejemplo, un movimiento de estado) se muestre, el sistema DEBE indicarlo de forma clara y distinta a un valor numérico de potencia.
- **FR-015**: Si un movimiento previamente seleccionado deja de ser válido para el Pokémon (por cambio de forma o de juego), el sistema DEBE vaciar o reiniciar ese espacio en vez de conservar una selección inválida.

### Key Entities

- **Forma disponible por juego**: La relación entre una forma de un Pokémon (base, Megaevolución, Gigamax, regional) y el conjunto de juegos/generaciones en los que esa forma realmente existe y puede elegirse.
- **Movimiento**: Un movimiento que un Pokémon puede usar en combate, con nombre, tipo, PP, potencia (cuando aplica) y descripción.
- **Movimiento aprendible por Pokémon y juego**: La relación entre un Pokémon, un movimiento, y los juegos en los que ese Pokémon puede aprender realmente ese movimiento.
- **Espacio de movimiento**: Una de las posiciones del set de movimientos de un Pokémon en el equipo, que puede estar vacía o contener un movimiento seleccionado.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100% de las formas ofrecidas como seleccionables en la tarjeta de personalización existen realmente en el juego activo, verificado contra una muestra representativa de Pokémon con Megaevolución/Gigamax en juegos de distintas generaciones.
- **SC-002**: Un usuario puede activar y desactivar la Megaevolución de un Pokémon repetidamente (al menos 5 veces seguidas) sin quedar nunca atrapado en la forma de Megaevolución.
- **SC-003**: En la versión web, el tamaño medido de un espacio del equipo es al menos el doble del tamaño medido antes de esta funcionalidad.
- **SC-004**: Un usuario puede identificar el tipo de un Pokémon por su ícono sin acercarse a la pantalla, en las tres ubicaciones donde se muestra.
- **SC-005**: El 100% de los movimientos mostrados como candidatos para un Pokémon en un juego determinado son movimientos que ese Pokémon puede aprender realmente en ese juego, verificado contra una muestra representativa.
- **SC-006**: Un usuario puede completar el set de movimientos de un Pokémon (elegir sus espacios de movimiento) y ver toda la información relevante (nombre, tipo, PP, potencia, descripción) sin salir de la tarjeta de personalización.

## Assumptions

- Esta funcionalidad amplía el configurador de equipo ya entregado en `007-configurador-equipo-mejoras` a `010-layout-icons-stats-weaknesses`; no introduce pantallas nuevas fuera de la tarjeta de personalización y el layout de dos paneles ya existentes.
- El número de espacios de movimiento por Pokémon es 4, siguiendo la convención estándar de la franquicia Pokémon en todos los juegos que esta aplicación soporta.
- "El juego activo" para determinar disponibilidad de formas y de movimientos aprendibles es el mismo juego ya seleccionado para el equipo en el resto del configurador — no se introduce una selección de juego adicional dentro de la tarjeta de personalización.
- La descripción de un movimiento es su texto descriptivo oficial (el que aparece en el resumen/Pokédex de movimientos del juego), no una explicación generada o resumida por esta aplicación.
- Un movimiento "de estado" o sin daño directo (potencia no aplicable) es una categoría reconocida y ya estándar en los datos de movimientos de la franquicia; esta funcionalidad no necesita inventar esa clasificación, solo mostrarla claramente.
- El tamaño mínimo "al menos el doble" de los espacios del equipo (User Story 3) se refiere al tamaño visual de cada espacio individual (por ejemplo, su lado/diámetro aproximado), no al espacio total ocupado por el panel de 6 espacios en conjunto.
