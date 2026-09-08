# Feature Specification: Slots 3×2 sin Espacio Desperdiciado, Íconos ×4, Movimientos por Defecto y Filtro Ocultable

**Feature Branch**: `012-slots-icons-moves-defaults`

**Created**: 2026-08-29

**Status**: Draft

**Input**: User description: "Ajustes adicionales al configurador de equipo: (1) En la versión web, los slots del equipo deben verse en una cuadrícula de 3×2 (3 columnas, 2 filas) en vez del arreglo actual, deben ser aproximadamente 1.5 veces más grandes que los actuales, y debe eliminarse el espacio/margen desperdiciado del lado del equipo. (2) Los íconos de tipo siguen viéndose pequeños; deben verse al menos 4 veces más grandes que su tamaño actual. (3) Al agregar un Pokémon al equipo, sus 4 espacios de movimientos deben llenarse automáticamente con los últimos movimientos que ese Pokémon aprende por nivel en el juego activo (los de mayor nivel). (4) En la vista de selección de movimientos, el filtro por tipo debe estar oculto por defecto y mostrarse mediante un interruptor (toggle). (5) En la tarjeta de personalización, cada movimiento debe ocupar todo el ancho de la tarjeta, en vez de un mosaico de ancho fijo."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Los slots del equipo se ven en una cuadrícula 3×2, sin espacio desperdiciado (Priority: P1)

Un entrenador usando la versión web del configurador ve los 6 espacios del equipo organizados en 3 columnas y 2 filas, ocupando todo el ancho disponible de su panel sin dejar márgenes o huecos vacíos perceptibles, y cada espacio se ve notoriamente más grande que en la versión anterior.

**Why this priority**: Es una corrección directa sobre el tamaño/distribución de los slots ya entregados en la feature anterior — el usuario reporta que el resultado actual todavía desperdicia espacio y no tiene la distribución que espera, lo cual sigue siendo una molestia de usabilidad visible en cada sesión.

**Independent Test**: Abrir el configurador en un viewport ancho (web/escritorio) y verificar que los 6 espacios se distribuyen en 3 columnas × 2 filas, que no hay una franja de espacio vacío notoria entre la cuadrícula y los bordes del panel de equipo, y que cada espacio mide aproximadamente 1.5 veces el tamaño que medía antes de este cambio.

**Acceptance Scenarios**:

1. **Given** el usuario abre el configurador en la versión web, **When** el panel de equipo se renderiza, **Then** los 6 espacios se muestran en una cuadrícula de 3 columnas y 2 filas.
2. **Given** la cuadrícula 3×2, **When** se mide el tamaño de un espacio individual, **Then** es aproximadamente 1.5 veces más grande que el tamaño que tenía antes de este cambio.
3. **Given** el panel de equipo en la versión web, **When** se observa el espacio entre la cuadrícula de slots y los bordes/contenedor del panel, **Then** no queda un margen o padding perceptible como "espacio desperdiciado" — la cuadrícula aprovecha el ancho disponible del panel.

---

### User Story 2 - Los íconos de tipo se ven claramente grandes (×4) (Priority: P1)

Un entrenador identifica los tipos de un Pokémon de un vistazo, sin tener que acercarse a la pantalla, en cualquier parte del configurador donde se muestren íconos de tipo.

**Why this priority**: Esta misma queja ("los íconos se ven muy pequeños") ya se reportó y se corrigió parcialmente en la feature anterior, y el usuario indica que el resultado sigue sin ser suficiente — es una molestia visual recurrente y de alta visibilidad en cada pantalla del configurador.

**Independent Test**: Comparar el tamaño de un ícono de tipo (en un espacio del equipo, en la tarjeta de personalización, y en el filtro de tipos) antes y después de este cambio — debe verse al menos 4 veces más grande que el tamaño que tenía inmediatamente antes de este cambio.

**Acceptance Scenarios**:

1. **Given** un Pokémon con uno o dos tipos, **When** se muestra en cualquier lugar del configurador (espacio del equipo, tarjeta de personalización, filtro de tipos), **Then** su ícono de tipo mide al menos 4 veces el tamaño que tenía inmediatamente antes de este cambio.

---

### User Story 3 - Los movimientos se llenan automáticamente al agregar un Pokémon (Priority: P1)

Un entrenador agrega un Pokémon al equipo y, sin necesidad de abrir manualmente la selección de movimientos, ya lo ve con un set de 4 movimientos razonable: los últimos (de mayor nivel) que ese Pokémon aprende por nivel en el juego activo.

**Why this priority**: Sin este comportamiento, cada Pokémon agregado queda con sus 4 espacios de movimientos vacíos, obligando al usuario a completar manualmente el set de combate de cada miembro del equipo — el mismo problema de "solo arma la mitad del equipo real" que motivó la funcionalidad de movimientos en la feature anterior.

**Independent Test**: Agregar un Pokémon a un slot vacío del equipo en un juego determinado, y verificar que sus 4 espacios de movimientos ya están ocupados con los movimientos de mayor nivel que ese Pokémon aprende por nivel en ese juego (o menos de 4, si el Pokémon aprende menos de 4 movimientos por nivel en ese juego).

**Acceptance Scenarios**:

1. **Given** un Pokémon que aprende movimientos por nivel en el juego activo, **When** el usuario lo agrega al equipo, **Then** sus espacios de movimientos se llenan automáticamente con los últimos (de mayor nivel de aprendizaje) movimientos por nivel disponibles, hasta un máximo de 4.
2. **Given** un Pokémon que aprende menos de 4 movimientos por nivel en el juego activo (o ninguno), **When** se agrega al equipo, **Then** solo se llenan tantos espacios como movimientos por nivel existan, dejando el resto vacíos — nunca se completan con movimientos de otro método de aprendizaje (MT, huevo, tutor) como relleno.
3. **Given** un Pokémon ya con movimientos asignados automáticamente, **When** el usuario cambia manualmente uno de sus movimientos desde la tarjeta, **Then** su elección manual se respeta y no se revierte a la selección automática.

---

### User Story 4 - El filtro por tipo en la selección de movimientos está oculto por defecto (Priority: P2)

Un entrenador abre la selección de movimientos y ve la lista de movimientos candidatos directamente, sin el filtro por tipo ocupando espacio visible; si quiere filtrar por tipo, activa un interruptor que lo revela.

**Why this priority**: Es una mejora de aprovechamiento de espacio en la vista de selección — no bloquea la función principal (elegir un movimiento), ya que el filtro sigue disponible bajo demanda.

**Independent Test**: Abrir la vista de selección de movimientos y verificar que el filtro por tipo no es visible por defecto; activar el interruptor correspondiente y verificar que el filtro se revela y funciona como antes.

**Acceptance Scenarios**:

1. **Given** el usuario abre la vista de selección de movimientos, **When** se muestra por primera vez, **Then** el filtro por tipo no está visible.
2. **Given** el filtro por tipo oculto, **When** el usuario activa el interruptor de mostrar filtro, **Then** el filtro por tipo se revela y permite filtrar la lista como ya funcionaba antes de este cambio.
3. **Given** el filtro por tipo visible y un tipo seleccionado, **When** el usuario desactiva el interruptor, **Then** el filtro se oculta (la selección de tipo activa puede conservarse o limpiarse, pero la lista de movimientos vuelve a mostrarse sin la restricción visual del filtro solo si la selección también se limpia — ver Supuestos).

---

### User Story 5 - Cada movimiento ocupa todo el ancho de la tarjeta (Priority: P2)

Un entrenador revisa los movimientos asignados a un Pokémon en la tarjeta de personalización y ve cada uno como una fila que ocupa todo el ancho de la tarjeta, en vez de mosaicos angostos de tamaño fijo.

**Why this priority**: Es una mejora de legibilidad/consistencia visual sobre una sección ya entregada — no bloquea ninguna funcionalidad, ya que la información y las acciones (seleccionar/limpiar un movimiento) ya son accesibles con el diseño actual.

**Independent Test**: Abrir la tarjeta de personalización de un Pokémon con movimientos asignados y verificar que cada espacio de movimiento se extiende de un borde a otro de la tarjeta (menos el padding estándar de la tarjeta), apilados verticalmente, en vez de organizarse en una cuadrícula/mosaico.

**Acceptance Scenarios**:

1. **Given** la tarjeta de personalización de un Pokémon, **When** se muestra la sección de movimientos, **Then** cada uno de los 4 espacios de movimiento ocupa todo el ancho disponible de la tarjeta.
2. **Given** los 4 espacios de movimientos a todo el ancho, **When** se muestran uno tras otro, **Then** se apilan verticalmente (uno debajo del otro), y toda la información de un movimiento ya visible (nombre, tipo, PP, potencia, descripción) sigue siendo legible sin recortarse.

### Edge Cases

- ¿Qué pasa si un Pokémon no aprende ningún movimiento por nivel en el juego activo? Sus 4 espacios de movimientos quedan vacíos tras agregarlo, igual que el comportamiento actual antes de esta funcionalidad.
- ¿Qué pasa si dos movimientos por nivel se aprenden exactamente al mismo nivel y hay que elegir cuáles entran entre los últimos 4? Se conserva el orden en que la fuente de datos ya los expone para ese nivel, sin necesidad de un criterio de desempate adicional inventado por esta funcionalidad.
- ¿Qué pasa si el usuario cambia la forma activa de un Pokémon después de que sus movimientos se asignaron automáticamente? Aplica la misma regla de invalidación ya existente (un movimiento que ya no es válido para la nueva forma/juego se vacía) — esta funcionalidad no vuelve a auto-completar los espacios vaciados por ese cambio, solo se dispara la asignación automática al momento de agregar el Pokémon por primera vez.
- ¿Qué pasa si, tras la asignación automática, el usuario quita manualmente un movimiento? El espacio queda vacío como cualquier otro espacio vaciado manualmente — no se vuelve a rellenar automáticamente.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: En la versión de escritorio/web, los 6 espacios del equipo DEBEN mostrarse en una cuadrícula de 3 columnas × 2 filas.
- **FR-002**: Cada espacio del equipo en la versión web DEBE medir aproximadamente 1.5 veces el tamaño que tenía inmediatamente antes de esta funcionalidad.
- **FR-003**: El panel de equipo en la versión web NO DEBE dejar un margen o espacio vacío perceptible entre la cuadrícula de slots y el contenedor/borde del panel — la cuadrícula DEBE aprovechar el ancho disponible del panel.
- **FR-004**: Los íconos de tipo DEBEN medir, en todas las ubicaciones donde se muestran (espacios del equipo, tarjeta de personalización, filtro de tipos), al menos 4 veces el tamaño que tenían inmediatamente antes de esta funcionalidad.
- **FR-005**: Al agregar un Pokémon a un espacio del equipo, el sistema DEBE asignar automáticamente a sus espacios de movimientos los últimos (de mayor nivel) movimientos que ese Pokémon aprende por nivel en el juego activo, hasta un máximo de 4.
- **FR-006**: La asignación automática de movimientos NO DEBE incluir movimientos aprendidos por un método distinto a "por nivel" (MT, huevo, tutor, u otro) como relleno cuando el Pokémon aprende menos de 4 movimientos por nivel.
- **FR-007**: Una vez asignados automáticamente, los movimientos DEBEN poder modificarse manualmente por el usuario exactamente igual que un movimiento elegido manualmente, sin ninguna restricción adicional.
- **FR-008**: La asignación automática de movimientos NO DEBE volver a ejecutarse para sobrescribir una selección manual ya hecha por el usuario en ese Pokémon.
- **FR-009**: La vista de selección de movimientos DEBE ocultar el filtro por tipo por defecto.
- **FR-010**: La vista de selección de movimientos DEBE ofrecer un control (interruptor/toggle) que muestre u oculte el filtro por tipo bajo demanda del usuario.
- **FR-011**: Mostrar u ocultar el filtro por tipo mediante el interruptor NO DEBE alterar ni perder la lista de movimientos candidatos ya cargada.
- **FR-012**: En la tarjeta de personalización, cada uno de los 4 espacios de movimiento DEBE ocupar todo el ancho disponible de la tarjeta.
- **FR-013**: Los 4 espacios de movimiento DEBEN apilarse verticalmente (uno debajo del otro) en vez de organizarse en una cuadrícula/mosaico de varias columnas.

### Key Entities

- **Movimiento aprendido por nivel**: La relación entre un Pokémon, un movimiento, un nivel de aprendizaje y un juego — ya existente como parte del aprendizaje de movimientos, pero ahora también usada para determinar automáticamente qué movimientos preseleccionar al agregar un Pokémon al equipo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En la versión web, los 6 espacios del equipo se distribuyen visualmente en 3 columnas × 2 filas, medibles como tales en cualquier captura de la interfaz.
- **SC-002**: El tamaño medido de un espacio del equipo en la versión web es aproximadamente 1.5 veces el tamaño medido antes de esta funcionalidad, con el panel de equipo sin espacio vacío perceptible en sus bordes.
- **SC-003**: El tamaño medido de un ícono de tipo, en cualquiera de sus tres ubicaciones, es al menos 4 veces el tamaño medido inmediatamente antes de esta funcionalidad.
- **SC-004**: Al agregar una muestra representativa de Pokémon con movimientos por nivel conocidos en un juego determinado, el 100% de los movimientos asignados automáticamente coinciden con los últimos (de mayor nivel) movimientos por nivel de cada uno en ese juego.
- **SC-005**: Un usuario puede mostrar y ocultar el filtro por tipo en la selección de movimientos en cualquier momento sin perder ni alterar la lista de movimientos ya visible.
- **SC-006**: En la tarjeta de personalización, cada espacio de movimiento ocupa visualmente todo el ancho de la tarjeta, verificable en cualquier captura de la interfaz.

## Assumptions

- Esta funcionalidad amplía directamente `010-layout-icons-stats-weaknesses` y `011-forms-icons-moves`, ya entregadas — no introduce pantallas nuevas fuera del panel de equipo, la tarjeta de personalización y la vista de selección de movimientos ya existentes.
- "Los últimos movimientos que aprende por nivel" se interpreta como los movimientos cuyo nivel de aprendizaje por nivel es más alto entre todos los que ese Pokémon puede aprender por nivel en el juego activo — no una cantidad fija de niveles hacia atrsás, sino los 4 (o menos, si aprende menos) de mayor nivel.
- El tamaño "aproximadamente 1.5 veces" (User Story 1) y "al menos 4 veces" (User Story 2) se refieren al tamaño visual de cada elemento individual (un espacio del equipo; un ícono de tipo), no al espacio total que ocupa un conjunto de ellos.
- Al ocultar el filtro por tipo mediante el interruptor (User Story 4), la selección de tipo activa se limpia (equivalente a "sin filtro") — así la lista de movimientos mostrada siempre corresponde exactamente a lo que el interruptor comunica visualmente (filtro oculto = sin filtro aplicado), evitando el caso ambiguo de un filtro invisible pero todavía activo.
- La asignación automática de movimientos (User Story 3) se dispara una única vez, en el momento de agregar el Pokémon al equipo — no se reevalúa en cambios posteriores de forma/juego (esos casos ya están cubiertos por la regla de invalidación de `011-forms-icons-moves`, que solo vacía espacios inválidos, nunca los rellena de nuevo automáticamente).
