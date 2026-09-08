# Feature Specification: Selector de Género en Tarjeta de Pokémon

**Feature Branch**: `019-gender-selector-card`

**Created**: 2026-09-07

**Status**: Draft

**Input**: User description: "En la tarjeta de información del Pokémon debe haber un selector de género. Considera que hay Pokémon que pueden ser macho y hembra, Pokémon que solo pueden ser machos, Pokémon que solo son hembras, Pokémon que no tienen género; en el caso de los que pueden ser macho o hembra el Pokémon por defecto debe ser macho. En la tarjeta el selector debe ser un toggle con los íconos de los géneros (en caso de poder ser macho o hembra); en caso de que solo pueda tener un género o no tenga género esa opción carga por defecto. Considerar que la imagen del Pokémon puede variar dependiendo; si al Pokémon se le cambia el género y este es shiny, la forma visible es la del nuevo género en shiny, y si el shiny no está activo entonces se mostrará la forma del nuevo género pero en no shiny."

## Clarifications

### Session 2026-09-07

- Q: ¿El género seleccionado en la tarjeta de detalle del equipo debe guardarse como parte del Pokémon en el equipo (persistir en el slot, igual que el modo shiny), o es solo una vista temporal que se pierde al cerrar la tarjeta? → A: Persiste en el slot del equipo, igual que el modo shiny — se guarda con el Pokémon y se mantiene al cerrar y reabrir la tarjeta.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Elegir género en un Pokémon de género dual (Priority: P1)

Una persona usuaria abre la tarjeta de información de un Pokémon de su equipo que puede ser macho o hembra. La tarjeta muestra un selector (toggle) con los íconos de macho (♂) y hembra (♀). La primera vez que ese Pokémon se agrega al equipo, el género macho está seleccionado por defecto. La persona puede tocar el ícono de hembra para cambiar el género mostrado, y volver a tocar el ícono de macho para regresar; el género elegido queda guardado con ese Pokémon del equipo.

**Why this priority**: Es el núcleo de la funcionalidad solicitada: sin esta interacción no existe selector de género que mostrar ni alternar.

**Independent Test**: Abrir la tarjeta de un Pokémon con ambos géneros disponibles (p. ej. uno con tasa de género intermedia), verificar que el toggle aparece con macho preseleccionado, y confirmar que tocar el ícono de hembra cambia la selección visualmente resaltada.

**Acceptance Scenarios**:

1. **Given** un Pokémon de género dual recién agregado al equipo (sin género elegido aún), **When** la persona abre su tarjeta, **Then** el selector de género se muestra con el ícono de macho marcado como seleccionado.
2. **Given** la tarjeta abierta de un Pokémon del equipo de género dual con macho seleccionado, **When** la persona toca el ícono de hembra, **Then** el selector pasa a mostrar hembra como seleccionada y ese género queda guardado con el Pokémon del equipo.
3. **Given** la tarjeta abierta de un Pokémon del equipo de género dual con hembra seleccionada, **When** la persona toca el ícono de macho, **Then** el selector vuelve a mostrar macho como seleccionado y ese cambio queda guardado con el Pokémon del equipo.
4. **Given** un Pokémon del equipo al que ya se le cambió el género a hembra en una apertura anterior de la tarjeta, **When** la persona cierra y vuelve a abrir la tarjeta de ese mismo Pokémon del equipo, **Then** el selector muestra hembra seleccionada (el género guardado se conserva).

---

### User Story 2 - Tarjeta sin selector para Pokémon de género único o sin género (Priority: P1)

Una persona usuaria abre la tarjeta de un Pokémon que solo puede ser macho, solo puede ser hembra, o que no tiene género. La tarjeta no muestra un toggle interactivo; en su lugar, indica de forma fija el único género aplicable (o la ausencia de género) sin permitir alternarlo.

**Why this priority**: Evita ofrecer una interacción falsa (un toggle que no debería cambiar nada) en la mayoría de los Pokémon del juego, que no tienen ambos géneros disponibles.

**Independent Test**: Abrir la tarjeta de un Pokémon exclusivamente macho, una exclusivamente hembra y una sin género; en los tres casos verificar que no aparece un toggle accionable y que se muestra únicamente la opción correspondiente.

**Acceptance Scenarios**:

1. **Given** un Pokémon que solo puede ser macho, **When** la persona abre su tarjeta, **Then** se muestra el ícono de macho fijo, sin opción de alternar a hembra.
2. **Given** un Pokémon que solo puede ser hembra, **When** la persona abre su tarjeta, **Then** se muestra el ícono de hembra fijo, sin opción de alternar a macho.
3. **Given** un Pokémon sin género, **When** la persona abre su tarjeta, **Then** se muestra el indicador de "sin género", sin toggle de macho/hembra.

---

### User Story 3 - La imagen del Pokémon refleja el género seleccionado (Priority: P2)

Una persona usuaria cambia el género seleccionado en la tarjeta de un Pokémon que tiene una apariencia visual distinta entre macho y hembra. La imagen mostrada se actualiza para reflejar la forma correspondiente al género recién seleccionado.

**Why this priority**: Da valor visual a la selección de género; depende de que el selector (User Story 1) ya exista, por eso es P2.

**Independent Test**: Abrir la tarjeta de un Pokémon con diferencias visuales conocidas entre macho y hembra, alternar el selector y verificar que la imagen mostrada cambia acorde al género elegido.

**Acceptance Scenarios**:

1. **Given** un Pokémon con forma visual distinta por género, con macho seleccionado, **When** la persona cambia el selector a hembra, **Then** la imagen mostrada pasa a la forma correspondiente a hembra.
2. **Given** un Pokémon sin diferencia visual conocida entre géneros, **When** la persona alterna el selector, **Then** la imagen mostrada permanece igual (el cambio de género no tiene efecto visual porque no existe una forma distinta).

---

### User Story 4 - La imagen respeta el modo shiny al cambiar de género (Priority: P2)

Una persona usuaria que tiene activado el modo shiny en la tarjeta cambia el género seleccionado de un Pokémon con diferencias visuales por género. La imagen mostrada corresponde a la forma shiny del nuevo género. Si el modo shiny no está activo, la imagen mostrada corresponde a la forma normal (no shiny) del nuevo género.

**Why this priority**: Es una combinación de dos estados existentes (shiny y género) que debe mantenerse consistente; depende de la selección de género (User Story 1/3) y del modo shiny ya existente en la tarjeta.

**Independent Test**: Con el modo shiny activo, alternar el género en un Pokémon con diferencias visuales y confirmar que la imagen mostrada es la variante shiny del nuevo género; repetir con el modo shiny desactivado y confirmar que se muestra la variante no shiny del nuevo género.

**Acceptance Scenarios**:

1. **Given** la tarjeta de un Pokémon con diferencias visuales por género y el modo shiny activado, **When** la persona cambia el género seleccionado, **Then** la imagen mostrada es la forma shiny del nuevo género.
2. **Given** la tarjeta de un Pokémon con diferencias visuales por género y el modo shiny desactivado, **When** la persona cambia el género seleccionado, **Then** la imagen mostrada es la forma no shiny del nuevo género.
3. **Given** la tarjeta con un género ya seleccionado y una imagen shiny visible, **When** la persona desactiva el modo shiny sin cambiar el género, **Then** la imagen mostrada pasa a la forma no shiny del género actualmente seleccionado.

---

### Edge Cases

- ¿Qué ocurre si el Pokémon admite ambos géneros pero no tiene forma visual distinta entre macho y hembra? El selector debe seguir apareciendo y ser accionable, pero la imagen mostrada no cambia al alternar (ver User Story 3, escenario 2).
- ¿Qué ocurre si la persona reabre la tarjeta de un Pokémon del equipo de género dual después de haberla cerrado con hembra seleccionada? El selector debe mostrar hembra (el género guardado con ese Pokémon del equipo se conserva entre aperturas).
- ¿Qué ocurre si la persona alterna el género rápidamente varias veces? La imagen y el estado del selector deben reflejar siempre el último género seleccionado, sin quedar en un estado intermedio o inconsistente.
- ¿Qué ocurre al abrir la tarjeta de distintos Pokémon del equipo en la misma sesión? Cada Pokémon del equipo mantiene su propio género guardado de forma independiente; el género de uno no afecta al de otro.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La tarjeta de detalle de un Pokémon del equipo MUST mostrar un indicador de género para ese Pokémon, sea cual sea su capacidad de género (macho y hembra, solo macho, solo hembra, o sin género).
- **FR-002**: Para un Pokémon que admite tanto macho como hembra, la tarjeta MUST mostrar un selector tipo toggle con los íconos de ambos géneros, permitiendo alternar entre ellos.
- **FR-003**: Para un Pokémon de género dual recién agregado al equipo (sin género guardado aún), el género MUST ser macho por defecto.
- **FR-004**: Para un Pokémon que solo puede ser macho, la tarjeta MUST mostrar únicamente el indicador de macho, sin un selector accionable.
- **FR-005**: Para un Pokémon que solo puede ser hembra, la tarjeta MUST mostrar únicamente el indicador de hembra, sin un selector accionable.
- **FR-006**: Para un Pokémon sin género, la tarjeta MUST mostrar el indicador de "sin género", sin selector de macho/hembra.
- **FR-007**: Cuando la persona usuaria cambia la selección de género en el toggle, la tarjeta MUST reflejar de inmediato el nuevo género como seleccionado y MUST guardar ese género con el Pokémon del equipo correspondiente.
- **FR-008**: Cuando el Pokémon mostrado tiene una forma visual distinta entre macho y hembra, la tarjeta MUST actualizar la imagen mostrada para corresponder al género recién seleccionado.
- **FR-009**: Cuando el Pokémon mostrado no tiene una forma visual distinta entre géneros, la tarjeta MUST conservar la misma imagen al alternar el selector de género.
- **FR-010**: Cuando el modo shiny está activo y la persona cambia el género seleccionado, la tarjeta MUST mostrar la forma shiny correspondiente al nuevo género.
- **FR-011**: Cuando el modo shiny no está activo y la persona cambia el género seleccionado, la tarjeta MUST mostrar la forma no shiny correspondiente al nuevo género.
- **FR-012**: Cuando la persona activa o desactiva el modo shiny sin cambiar el género, la tarjeta MUST mostrar la forma shiny o no shiny (según corresponda) del género actualmente seleccionado.
- **FR-013**: Cada vez que se abre la tarjeta de un Pokémon del equipo de género dual, el selector MUST mostrar el género previamente guardado para ese Pokémon del equipo (o macho, si aún no se ha guardado ninguno), en vez de reiniciarse siempre a macho.
- **FR-014**: El género guardado de un Pokémon del equipo MUST mantenerse independiente del género guardado de cualquier otro Pokémon del equipo.

### Key Entities

- **Capacidad de género del Pokémon**: Describe qué géneros puede tener un Pokémon (solo macho, solo hembra, macho o hembra, o sin género). Determina si la tarjeta muestra un selector accionable o un indicador fijo.
- **Género guardado del Pokémon del equipo**: El género (macho o hembra) guardado con un Pokémon de género dual dentro del equipo de la persona usuaria, con macho como valor por defecto al agregarlo. Persiste entre aperturas de la tarjeta y es independiente por cada Pokémon del equipo.
- **Forma visual del Pokémon**: La imagen a mostrar, determinada por la combinación de género seleccionado y estado del modo shiny (activo/inactivo). Solo varía por género en los Pokémon que tienen diferencias visuales conocidas entre macho y hembra.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100% de los Pokémon de género dual recién agregados al equipo muestran el selector en modo macho al abrir su tarjeta por primera vez, y el 100% de los que ya tienen un género guardado muestran ese género guardado al reabrir la tarjeta.
- **SC-002**: El 100% de los Pokémon con un único género posible (o sin género) muestran su tarjeta sin un selector accionable, mostrando solo la opción correspondiente.
- **SC-003**: En Pokémon con diferencias visuales por género, la imagen mostrada coincide con el género seleccionado en el 100% de los cambios realizados a través del selector.
- **SC-004**: En cualquier combinación de género seleccionado y estado shiny, la imagen mostrada corresponde siempre a la combinación correcta (género × shiny/no-shiny), verificado en el 100% de los casos de prueba.
- **SC-005**: Una persona usuaria puede identificar y cambiar el género mostrado de un Pokémon de género dual en menos de 2 segundos desde que abre la tarjeta.

## Assumptions

- La tarjeta de información del Pokémon ya cuenta con un control de modo shiny existente (activo/inactivo); esta funcionalidad se integra con ese control existente sin modificar su comportamiento propio.
- La capacidad de género de cada Pokémon (solo macho, solo hembra, macho o hembra, sin género) y la existencia de diferencias visuales por género son datos ya disponibles o derivables por Pokémon; esta funcionalidad no define cómo se obtienen esos datos, solo cómo se presentan.
- El selector de género aplica a la tarjeta de detalle de un Pokémon dentro del equipo de la persona usuaria; el género elegido se guarda con ese Pokémon del equipo (igual que el modo shiny), de modo que se mantiene al cerrar y reabrir la tarjeta, y es independiente por cada Pokémon del equipo.
- Los íconos de género a usar son los símbolos convencionales de macho (♂) y hembra (♀).
- "Diferencia visual por género" se refiere a los casos donde el Pokémon tiene una apariencia (sprite/ilustración) distinta según sea macho o hembra; en los demás casos, la imagen es la misma independientemente del género seleccionado.
