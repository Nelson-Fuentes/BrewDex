# Feature Specification: Correcciones del Configurador de Equipo y la Pokédex

**Feature Branch**: `008-configurador-equipo-correcciones`

**Created**: 2026-08-29

**Status**: Draft

**Input**: User description: "La parte del equipo (team builder) tiene que ocupar todo el espacio libre disponible en la pantalla. La Pokédex no está cargando completa (faltan Pokémon en la lista/grid). Los tipos de Pokémon no están usando los iconos oficiales de tipo. El toggle para cambiar de género (macho/hembra) no está funcionando. En género "none" (sin género), solo debería aplicar a los Pokémon que realmente no tienen género en el juego; actualmente se está aplicando como si ningún Pokémon tuviera género, cuando la mayoría sí tienen macho y hembra. Si se activa shiny y luego se selecciona una mega evolución, el Pokémon vuelve a su forma base en vez de mantenerse en la forma shiny de la mega (debe combinar shiny + mega). Al cambiar la forma del Pokémon (mega, regional, etc.), la card debe mostrar la nueva forma completa (sprite, tipos, stats), no solo actualizar el slot del equipo. La card del Pokémon debe mostrar las estadísticas base (HP, Ataque, Defensa, Ataque Especial, Defensa Especial, Velocidad) del Pokémon seleccionado."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver la Pokédex nacional completa (Priority: P1)

Un entrenador abre el configurador y navega la Pokédex nacional para elegir Pokémon. Actualmente la lista se corta y faltan Pokémon, por lo que no puede encontrar ni añadir especies que sabe que existen.

**Why this priority**: Si la Pokédex no está completa, el usuario ni siquiera puede llegar a elegir el Pokémon que quiere; es un bloqueador funcional que afecta a todo el flujo de armado de equipo.

**Independent Test**: Abrir la Pokédex nacional y desplazarse (o buscar) hasta el final de la lista, verificando que aparecen todos los Pokémon esperados para esa generación/juego, incluidos los últimos de la lista.

**Acceptance Scenarios**:

1. **Given** el usuario abre la Pokédex de un juego, **When** se desplaza hasta el final de la lista, **Then** ve el último Pokémon correspondiente a esa Pokédex sin que la carga se detenga antes.
2. **Given** el usuario busca por nombre un Pokémon que pertenece a la Pokédex activa, **When** escribe su nombre, **Then** el Pokémon aparece en los resultados aunque esté al final de la lista o no se haya cargado aún visualmente.

---

### User Story 2 - El equipo aprovecha todo el espacio disponible (Priority: P1)

Un entrenador usando la versión web del configurador quiere que el panel de slots del equipo use todo el espacio libre de la pantalla en vez de dejar zonas vacías, para ver mejor su equipo mientras lo arma.

**Why this priority**: Es un problema de usabilidad visible en cada sesión de uso del configurador, y afecta directamente la comodidad de la tarea principal (armar el equipo).

**Independent Test**: Abrir el configurador en distintos tamaños de pantalla de escritorio y comprobar que el panel de equipo se expande para ocupar el espacio libre disponible en su columna, sin dejar áreas vacías no utilizadas junto a los slots.

**Acceptance Scenarios**:

1. **Given** el usuario abre el configurador en una ventana de escritorio, **When** el panel de equipo se renderiza, **Then** ocupa todo el espacio libre disponible de su área asignada (sin franjas vacías sobrantes ni necesidad de scroll para ver espacio no usado).
2. **Given** el usuario redimensiona la ventana, **When** el espacio libre disponible cambia, **Then** el panel de equipo se reajusta para seguir ocupando el espacio disponible.

---

### User Story 3 - Iconos oficiales de tipo Pokémon (Priority: P2)

Un entrenador identifica los tipos de un Pokémon (fuego, agua, planta, etc.) por su icono. Actualmente los iconos mostrados no son los oficiales, lo que genera confusión o inconsistencia visual con el resto del ecosistema Pokémon.

**Why this priority**: Es una corrección visual/de contenido que afecta la credibilidad y claridad de la información, pero no bloquea la funcionalidad de armar el equipo.

**Independent Test**: Seleccionar Pokémon de varios tipos distintos y comparar los iconos mostrados en la tarjeta y en los slots con los iconos oficiales de tipo usados en los juegos/Pokédex oficiales.

**Acceptance Scenarios**:

1. **Given** un Pokémon con uno o dos tipos, **When** se muestra en la tarjeta o en un slot del equipo, **Then** cada tipo se representa con su icono oficial correspondiente.
2. **Given** dos Pokémon del mismo tipo, **When** se comparan sus iconos de tipo, **Then** ambos muestran exactamente el mismo icono oficial para ese tipo.

---

### User Story 4 - Alternar género del Pokémon correctamente (Priority: P1)

Un entrenador quiere ver y elegir la forma macho o hembra de un Pokémon que tiene diferencias visuales de género. Actualmente el control para alternar el género no responde.

**Why this priority**: Es una funcionalidad explícitamente ofrecida en la interfaz que no funciona; un control visible que no responde es un bloqueador funcional directo.

**Independent Test**: Seleccionar un Pokémon que tenga sprites diferenciados por género, activar el control de género y verificar que el sprite y el estado del Pokémon cambian entre macho y hembra.

**Acceptance Scenarios**:

1. **Given** un Pokémon con diferencias visuales entre macho y hembra, **When** el usuario activa el control de género, **Then** el sprite y la selección de género se actualizan de macho a hembra (o viceversa).
2. **Given** el usuario cambió el género de un Pokémon, **When** revisa la tarjeta o el slot del equipo, **Then** el género mostrado coincide con el que seleccionó.

---

### User Story 5 - El control de género solo aparece cuando corresponde (Priority: P2)

Un entrenador selecciona distintos Pokémon y espera que el control de género (macho/hembra) esté disponible para los que sí tienen género en el juego, y que solo se trate como "sin género" a las especies que realmente no tienen género (como los Pokémon Legendarios sin género asignado), no a la mayoría de especies que sí tienen macho y hembra.

**Why this priority**: Es un error de datos que hace que la mayoría de Pokémon aparezcan incorrectamente como "sin género", degradando la fidelidad de la información pero sin impedir armar el equipo.

**Independent Test**: Seleccionar un Pokémon que en el juego tiene macho y hembra (por ejemplo, uno común como Pidgey) y verificar que el control de género está disponible; luego seleccionar un Pokémon sin género conocido (por ejemplo, un Pokémon de tipo Mineral/sin género fijo) y verificar que se muestra correctamente como sin género, sin control de alternancia.

**Acceptance Scenarios**:

1. **Given** un Pokémon que tiene formas macho y hembra en el juego, **When** se selecciona en el configurador, **Then** el control de alternancia de género está disponible y funcional.
2. **Given** un Pokémon que no tiene género en el juego, **When** se selecciona en el configurador, **Then** se muestra como sin género y no se ofrece un control de alternancia de género.

---

### User Story 6 - Combinar shiny con formas alternativas (mega, regional, etc.) (Priority: P1)

Un entrenador activa la variante shiny de un Pokémon y luego elige una mega evolución (u otra forma alternativa). Actualmente el Pokémon vuelve a su forma base normal, perdiendo la selección shiny, en vez de mostrar la mega evolución en su variante shiny.

**Why this priority**: Es un bloqueador funcional: dos opciones ofrecidas por la interfaz (shiny y forma alternativa) no pueden usarse juntas aunque el usuario las seleccione explícitamente, y además se pierde silenciosamente la selección de forma (revierte a la base).

**Independent Test**: Seleccionar un Pokémon con mega evolución disponible, activar shiny, y luego seleccionar su forma mega. Verificar que el resultado es la mega evolución en su variante shiny, no la forma base.

**Acceptance Scenarios**:

1. **Given** el usuario activó la variante shiny de un Pokémon, **When** selecciona una mega evolución disponible para ese Pokémon, **Then** el Pokémon se muestra como la mega evolución en su variante shiny (no vuelve a la forma base ni pierde el shiny).
2. **Given** el usuario tiene seleccionada una mega evolución en su variante shiny, **When** desactiva shiny, **Then** el Pokémon se muestra como la mega evolución en su variante normal (conserva la forma, solo cambia el shiny).
3. **Given** el usuario tiene seleccionada una forma alternativa (regional u otra) en variante shiny, **When** alterna shiny o cambia entre formas alternativas disponibles, **Then** la combinación de forma y variante shiny seleccionadas se mantiene consistente en todo momento.

---

### User Story 7 - La tarjeta refleja la forma seleccionada por completo (Priority: P1)

Un entrenador cambia la forma de un Pokémon (mega evolución, forma regional, etc.) desde la tarjeta de personalización. Actualmente solo el slot del equipo se actualiza con la nueva forma, mientras que la tarjeta sigue mostrando la forma anterior.

**Why this priority**: La tarjeta es donde el usuario decide y confirma los cambios; que no refleje la forma recién elegida genera desconfianza sobre qué se está configurando realmente y puede llevar a errores.

**Independent Test**: Seleccionar un Pokémon con una forma alternativa disponible, elegir esa forma desde la tarjeta, y verificar que la propia tarjeta (sprite, tipos y estadísticas) se actualiza a la nueva forma, no solo el slot del equipo.

**Acceptance Scenarios**:

1. **Given** el usuario está personalizando un Pokémon en la tarjeta, **When** selecciona una forma alternativa disponible (mega, regional, etc.), **Then** la tarjeta actualiza su sprite, tipos y estadísticas para reflejar la nueva forma.
2. **Given** la tarjeta ya muestra una forma alternativa, **When** el usuario vuelve a la forma base, **Then** la tarjeta actualiza su sprite, tipos y estadísticas de vuelta a los de la forma base.

---

### User Story 8 - Ver las estadísticas base en la tarjeta (Priority: P2)

Un entrenador quiere conocer las estadísticas base (PS, Ataque, Defensa, Ataque Especial, Defensa Especial, Velocidad) del Pokémon que está personalizando, para decidir mejor su equipo.

**Why this priority**: Es información adicional valiosa para la decisión del usuario, pero no impide completar el armado del equipo si falta.

**Independent Test**: Abrir la tarjeta de personalización de cualquier Pokémon y verificar que se muestran las seis estadísticas base con sus valores correspondientes a la forma actualmente seleccionada.

**Acceptance Scenarios**:

1. **Given** el usuario abre la tarjeta de personalización de un Pokémon, **When** la tarjeta se renderiza, **Then** muestra las seis estadísticas base (PS, Ataque, Defensa, Ataque Especial, Defensa Especial, Velocidad) con sus valores.
2. **Given** el usuario cambia la forma del Pokémon en la tarjeta, **When** la forma cambia, **Then** las estadísticas base mostradas se actualizan a las de la nueva forma seleccionada.

### Edge Cases

- ¿Qué pasa si un Pokémon no tiene mega evolución ni formas alternativas? El control de formas no debe ofrecer combinaciones inexistentes, y shiny debe seguir funcionando de forma independiente.
- ¿Qué pasa si un Pokémon no tiene sprite shiny oficial para una forma específica? El sistema debe manejarlo con una alternativa razonable (por ejemplo, usar el sprite shiny disponible más cercano o indicar que no hay variante shiny para esa forma) en vez de fallar o revertir la selección.
- ¿Qué pasa si la carga de la Pokédex falla parcialmente por un problema de red? El usuario debe poder reintentar o ver un indicador de carga incompleta en vez de asumir silenciosamente que la lista está completa.
- ¿Qué pasa con el control de género en un Pokémon que solo tiene un género posible fijo (siempre macho o siempre hembra, pero no ambos)? Debe reflejar ese único género disponible sin ofrecer un control de alternancia inútil.
- ¿Qué pasa si el usuario cambia de forma un Pokémon que ya tiene género seleccionado y la nueva forma no distingue por género? El sistema debe mantener el género elegido en el estado, aunque visualmente la forma no tenga diferencias entre géneros.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE cargar y mostrar en la Pokédex la totalidad de los Pokémon correspondientes a la Pokédex nacional/del juego activo, incluidos los últimos elementos de la lista, sin cortes prematuros en la carga o el desplazamiento.
- **FR-002**: El sistema DEBE permitir encontrar mediante búsqueda por nombre cualquier Pokémon perteneciente a la Pokédex activa, independientemente de si ya se cargó visualmente en la lista.
- **FR-003**: El panel de slots del equipo DEBE expandirse para ocupar todo el espacio libre disponible dentro de su área asignada en la pantalla, en las distintas resoluciones de escritorio soportadas.
- **FR-004**: El sistema DEBE representar cada tipo de Pokémon (fuego, agua, planta, etc.) con su icono oficial correspondiente, de forma consistente en toda la interfaz (tarjeta y slots del equipo).
- **FR-005**: El control de alternancia de género DEBE cambiar efectivamente el género seleccionado del Pokémon (y su sprite asociado) al ser activado, para cualquier Pokémon que tenga formas macho y hembra distintas.
- **FR-006**: El sistema DEBE determinar la disponibilidad de género (macho, hembra, ambos, o sin género) de cada Pokémon según los datos reales de esa especie en el juego, en vez de tratar a todos los Pokémon como si no tuvieran género.
- **FR-007**: El sistema DEBE ofrecer el control de alternancia de género únicamente a los Pokémon que tienen tanto forma macho como forma hembra, y DEBE mostrar como "sin género" únicamente a las especies que realmente carecen de género en el juego.
- **FR-008**: El sistema DEBE permitir combinar la variante shiny con cualquier forma alternativa disponible del Pokémon (mega evolución, forma regional, etc.), de modo que ambas selecciones (forma y shiny) se apliquen simultáneamente.
- **FR-009**: Al cambiar de forma alternativa mientras shiny está activo, el sistema NO DEBE revertir la selección de forma a la base ni desactivar shiny; ambas selecciones deben conservarse tal como el usuario las dejó.
- **FR-010**: Al seleccionar una nueva forma del Pokémon (mega, regional, u otra) desde la tarjeta de personalización, el sistema DEBE actualizar la propia tarjeta (sprite, tipos y estadísticas) para reflejar la nueva forma, no solo el slot del equipo correspondiente.
- **FR-011**: La tarjeta de personalización DEBE mostrar las seis estadísticas base del Pokémon (PS, Ataque, Defensa, Ataque Especial, Defensa Especial, Velocidad) correspondientes a la forma actualmente seleccionada.
- **FR-012**: Las estadísticas base mostradas en la tarjeta DEBEN actualizarse automáticamente al cambiar la forma seleccionada del Pokémon.

### Key Entities

- **Pokémon (entrada de Pokédex)**: Especie con nombre, número, tipos, formas alternativas disponibles (mega, regional, etc.), disponibilidad de género (macho/hembra/ambos/ninguno) y estadísticas base por forma.
- **Forma seleccionada**: Combinación activa de forma alternativa (base, mega, regional, etc.), variante shiny (sí/no) y género (macho/hembra/sin género) que determina el sprite, tipos y estadísticas mostrados en un momento dado.
- **Slot de equipo**: Posición dentro del equipo del entrenador que contiene un Pokémon con su forma seleccionada.
- **Tarjeta de personalización**: Vista donde el usuario elige y visualiza la forma seleccionada de un Pokémon antes o después de añadirlo al equipo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100% de los Pokémon de una Pokédex nacional/de juego se pueden ubicar y seleccionar, ya sea por desplazamiento hasta el final de la lista o por búsqueda de nombre.
- **SC-002**: En pantallas de escritorio, el panel de equipo no deja espacio libre sin utilizar mayor al margen visual estándar de la interfaz.
- **SC-003**: El 100% de los tipos de Pokémon mostrados en la interfaz corresponden a un icono oficial reconocible, verificado por comparación visual con la referencia oficial.
- **SC-004**: El control de género produce un cambio visible de sprite/estado en el 100% de los intentos sobre Pokémon con ambos géneros disponibles.
- **SC-005**: Sobre una muestra representativa de especies, el género mostrado (macho/hembra/ambos/sin género) coincide con los datos reales del juego en el 100% de los casos verificados.
- **SC-006**: El usuario puede activar shiny y luego seleccionar una mega evolución (o viceversa) y obtener siempre la combinación correcta (forma elegida + shiny) en el 100% de los intentos, sin reversiones a la forma base.
- **SC-007**: Al cambiar de forma en la tarjeta, el sprite, los tipos y las estadísticas mostrados en la propia tarjeta coinciden con la nueva forma en el 100% de los cambios realizados.
- **SC-008**: El 100% de las tarjetas de personalización muestran las seis estadísticas base correspondientes a la forma actualmente seleccionada.

## Assumptions

- Esta funcionalidad corrige y completa comportamientos ya existentes en el configurador de equipo y la Pokédex de BrewDex (incluyendo trabajo relacionado en curso de la funcionalidad `007-configurador-equipo-mejoras`); no introduce pantallas nuevas.
- "Icono oficial de tipo" se refiere a los iconos de tipo usados oficialmente en los juegos/Pokédex de la franquicia Pokémon (mismo estilo que usa la app para otros elementos ya alineados con esa referencia).
- "Sin género" (none) aplica solo a especies que oficialmente no tienen género asignado en los juegos (por ejemplo, muchos Pokémon Legendarios y Míticos, y especies de la línea Mineral/genderless); todas las demás especies deben ofrecer macho y hembra cuando ambas formas existen, o el único género fijo cuando la especie solo tiene uno.
- Las estadísticas base a mostrar son las seis estadísticas estándar de combate (PS, Ataque, Defensa, Ataque Especial, Defensa Especial, Velocidad), en su valor base (nivel 1, sin IVs/EVs), tal como se documentan oficialmente para cada forma.
- El espacio "libre disponible" para el panel de equipo se refiere al espacio remanente dentro del layout de escritorio ya definido para esa sección (no implica rediseñar la distribución general de la pantalla).
- Esta corrección aplica a la versión de escritorio/web del configurador; el comportamiento en móvil no cambia salvo que ya comparta el mismo código de carga de datos (Pokédex, género, formas, estadísticas).
