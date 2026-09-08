# Feature Specification: Tamaño de Tipos Legible, Tabla de Cobertura Visible y Estabilidad al Quitar Pokémon

**Feature Branch**: `016-team-config-fixes-3`

**Created**: 2026-09-02

**Status**: Draft

**Input**: User description: "ahora los tipos estan muy pequeños, deben ser los suficientemente grandes para que puedan salir dos en la misma fila, deben aparecer juntos uno al lado del otro. la tabla de covertura sigue sin ser visible. a veses al quitar un pokemon del equipo, la vetnana se cierra y me voy al menu de seleccion de juego, corregir"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Los tipos son legibles sin dejar de caber dos por espacio (Priority: P1)

Un entrenador ve las etiquetas de tipo de un Pokémon (en los espacios del equipo y en la tarjeta de personalización) en un tamaño claramente legible a simple vista, sin dejar de caber dos etiquetas de tipo dentro de un mismo espacio del equipo una al lado de la otra.

**Why this priority**: Es al menos la segunda vez que el tamaño de los tipos se reporta como incorrecto (antes demasiado grande, luego demasiado pequeño); sin un tamaño validado como legible, la utilidad visual del equipo completo queda comprometida en cada sesión de uso.

**Independent Test**: Abrir el configurador de equipo con un Pokémon de dos tipos y verificar, en un espacio del equipo, que ambas etiquetas de tipo caben juntas en ese espacio y que, comparadas con el resto del texto de la interfaz (p. ej. el nombre del Pokémon en el mismo espacio), no se ven diminutas ni difíciles de distinguir entre sí. Repetir la comparación en la tarjeta de personalización.

**Acceptance Scenarios**:

1. **Given** un espacio del equipo con un Pokémon de dos tipos, **When** se visualiza en la interfaz, **Then** ambas etiquetas de tipo se muestran juntas dentro de ese espacio, sin desbordarse ni truncarse.
2. **Given** el mismo espacio del equipo, **When** se compara el tamaño de la etiqueta de tipo con el del nombre del Pokémon mostrado en el mismo espacio, **Then** la etiqueta de tipo es claramente legible, no se ve como un punto o ícono minúsculo difícil de reconocer.
3. **Given** la tarjeta de personalización de un Pokémon, **When** se muestran sus etiquetas de tipo, **Then** tienen un tamaño igualmente legible al usado en los espacios del equipo.

---

### User Story 2 - La tabla de Análisis de Cobertura es realmente visible (Priority: P1)

Un entrenador que navega a la sección de Análisis de Cobertura ve la tabla en pantalla, sin que la sección aparezca vacía, en blanco o inexistente.

**Why this priority**: Es al menos la segunda vez que se reporta esta sección como no visible pese a correcciones previas (se agregó scroll vertical en una iteración anterior); sin resolver la causa real, la funcionalidad sigue siendo inútil para el entrenador.

**Independent Test**: Navegar a la sección de Análisis de Cobertura desde el configurador de equipo, en una ventana/viewport de tamaño normal (no artificialmente recortada), tanto en la versión web como en móvil, y verificar que el contenido de la tabla (encabezados y filas) es visible en pantalla, con desplazamiento si es necesario pero sin que el contenido esté ausente o ilegible.

**Acceptance Scenarios**:

1. **Given** el entrenador está en el configurador de equipo, **When** pulsa la acción de Análisis de Cobertura, **Then** la página se abre y su contenido (título y tabla) es visible sin requerir ninguna acción adicional no señalizada.
2. **Given** la página de Análisis de Cobertura abierta en un tamaño de ventana/dispositivo normal, **When** el entrenador la observa (con desplazamiento si aplica), **Then** ve las filas de la tabla con texto legible y sin solaparse con otro contenido.
3. **Given** la causa raíz de la no-visibilidad, **When** se corrige, **Then** queda verificada de forma que detectaría una regresión futura del mismo síntoma (por ejemplo, mediante una prueba automatizada o un paso de verificación documentado).

---

### User Story 3 - Quitar un Pokémon del equipo no cierra la vista actual (Priority: P1)

Un entrenador quita un Pokémon de su equipo desde el configurador y permanece en el configurador de equipo, sin ser expulsado inesperadamente al menú de selección de juego ni perder el resto de su progreso en la sesión.

**Why this priority**: Es un fallo intermitente que interrumpe la tarea principal (editar el equipo) y hace perder el contexto de trabajo del entrenador; al ser intermitente, cualquier corrección debe apuntar a eliminar la causa, no solo reducir su frecuencia.

**Independent Test**: Con un equipo de varios Pokémon, quitar un Pokémon de un espacio repetidamente (incluyendo distintas posiciones y condiciones, como hacerlo justo después de otras acciones en el configurador) y verificar que el entrenador permanece siempre en el configurador de equipo, con el resto del equipo intacto y sin navegación involuntaria al menú de selección de juego.

**Acceptance Scenarios**:

1. **Given** un equipo con al menos un Pokémon, **When** el entrenador quita ese Pokémon de su espacio, **Then** la vista del configurador de equipo permanece abierta y el espacio queda vacío, sin cerrar la aplicación ni navegar a otra pantalla.
2. **Given** un equipo completo (todos los espacios ocupados), **When** el entrenador quita Pokémon de distintos espacios de forma sucesiva, **Then** en ningún caso la aplicación navega al menú de selección de juego como efecto de esa acción.
3. **Given** el fallo es intermitente, **When** se corrige la causa raíz identificada, **Then** queda documentada (p. ej. una condición de carrera, un estado inválido tras la eliminación, o un manejo incorrecto de navegación) junto con una verificación que la habría detectado.

---

### Edge Cases

- ¿Qué ocurre en un viewport de tamaño reducido (móvil apaisado o ventana de escritorio no maximizada) con dos tipos en un espacio del equipo? Deben seguir cabiendo juntos con el nuevo tamaño.
- ¿Qué ocurre si la tabla de cobertura, una vez visible, tiene más columnas de las que caben horizontalmente en un viewport angosto? Debe seguir siendo alcanzable mediante scroll horizontal, sin que esto vuelva a ocultar la tabla por completo.
- ¿Qué ocurre si se quita el último Pokémon del equipo (equipo queda vacío)? El configurador debe permanecer abierto mostrando el equipo vacío, no navegar a otra pantalla.
- ¿Qué ocurre si se quita un Pokémon justo después de abrir o cerrar otra vista relacionada (p. ej. la tarjeta de personalización o la tabla de cobertura)? No debe disparar el cierre inesperado de la vista.
- ¿Qué ocurre si la causa de alguno de los tres problemas resulta ser ajena al código de la aplicación (p. ej. una build desactualizada siendo la que efectivamente se está probando)? Debe quedar documentado como tal en vez de aplicarse un cambio de código que no corrige nada real.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE mostrar las etiquetas de tipo (en los espacios del equipo y en la tarjeta de personalización) en un tamaño lo suficientemente grande para ser claramente legible junto al resto del texto de esas mismas pantallas.
- **FR-002**: El sistema DEBE permitir que dos etiquetas de tipo quepan juntas dentro de un mismo espacio del equipo con ese tamaño mayor, sin desbordarse ni truncarse.
- **FR-003**: El tamaño de las etiquetas de tipo DEBE derivarse de la misma fórmula/tope compartido en los espacios del equipo y en la tarjeta de personalización — no necesariamente el mismo valor en píxeles en ambos casos (ya que el ancho real disponible difiere entre una celda fija del equipo y una tarjeta con scroll libre), pero sí el mismo criterio y el mismo tope superior en ambos (enmendado durante la implementación: ver `research.md` Decisión 1 — un tope superior alto combinado con un tamaño adaptable resultó preferible a un único valor fijo bajo, que nunca podía ser simultáneamente legible en escritorio y suficientemente pequeño para caber dos en fila en móvil).
- **FR-004**: El sistema DEBE investigar y corregir la causa real de que la tabla de Análisis de Cobertura no sea visible, considerando explícitamente causas de layout, de datos/parámetros, de navegación/entrada a la página, y de artefactos de compilación/despliegue desactualizados.
- **FR-005**: El sistema DEBE mostrar la tabla de Análisis de Cobertura de forma verificablemente visible (contenido con posición y tamaño reales en pantalla) al navegar a esa sección, en un viewport de tamaño normal.
- **FR-006**: El sistema DEBE investigar y corregir la causa raíz de que, al quitar un Pokémon del equipo, la vista se cierre y el entrenador sea enviado al menú de selección de juego.
- **FR-007**: El sistema DEBE permanecer en el configurador de equipo después de que el entrenador quite un Pokémon de cualquier espacio, en cualquier condición (equipo parcial, completo o quedando vacío), sin navegación involuntaria a otras pantallas.
- **FR-008**: Si la causa de alguno de los tres problemas resulta no ser un defecto del código de la aplicación (p. ej. una build/despliegue desactualizado), el sistema — o la documentación de esta corrección — DEBE dejar constancia explícita de esa causa y de cómo el entrenador puede verificar que está usando una build actualizada.

### Key Entities

- **Tamaño de etiqueta de tipo**: Valor de tamaño compartido que controla cuán grande se renderiza el ícono/etiqueta de un tipo de Pokémon en los espacios del equipo y en la tarjeta de personalización; debe balancear legibilidad y la restricción de que dos tipos quepan juntos en un espacio del equipo.
- **Visibilidad real de la tabla de cobertura**: No solo "el elemento existe en el árbol de la interfaz", sino que su contenido tiene una posición y tamaño en pantalla que un entrenador puede efectivamente ver, con desplazamiento si aplica, en condiciones normales de uso.
- **Eliminación de Pokémon del equipo**: La acción de quitar un Pokémon de un espacio del equipo y el estado/navegación resultante; debe dejar al entrenador en el configurador de equipo, sin efectos secundarios de navegación.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En todos los tamaños de viewport soportados, el 100% de los Pokémon de dos tipos en un espacio del equipo muestran ambos tipos juntos dentro del espacio, con un tamaño de etiqueta claramente legible.
- **SC-002**: Al comparar el tamaño de la etiqueta de tipo con el del nombre del Pokémon en el mismo espacio, ningún evaluador de prueba reporta la etiqueta de tipo como "ilegible" o "demasiado pequeña".
- **SC-003**: Al navegar a Análisis de Cobertura desde un viewport de tamaño normal, el 100% de las veces la tabla es visible en pantalla (con desplazamiento si aplica).
- **SC-004**: Al quitar Pokémon de un equipo de forma repetida (al menos 20 repeticiones en distintas posiciones y condiciones durante la verificación), el 0% de los intentos provoca que la aplicación navegue al menú de selección de juego.
- **SC-005**: Las causas raíz de los tres problemas quedan identificadas y documentadas de forma verificable (con una prueba o verificación que las habría detectado), evitando un tercer reporte del mismo síntoma en cualquiera de los tres casos.

## Assumptions

- El tamaño actual de las etiquetas de tipo (reportado como "muy pequeño") es un valor de una iteración de corrección anterior que sobrecorrigió un reporte previo de "demasiado grande"; el nuevo valor buscado es un punto intermedio determinado verificando legibilidad real junto al resto del texto de la interfaz, no un número fijado de antemano.
- La tabla de Análisis de Cobertura ya cuenta con scroll vertical de una corrección previa; este trabajo asume que la causa de no-visibilidad reportada nuevamente es distinta (o adicional) a la falta de scroll, y requiere una investigación más profunda (layout, datos, navegación o build).
- El cierre inesperado de la vista al quitar un Pokémon es intermitente (no ocurre siempre), lo que sugiere una condición de carrera, un estado transitorio inválido, o un manejo de navegación/errores incorrecto tras la eliminación, más que un fallo determinístico simple.
- "Viewport de tamaño normal" se refiere a un tamaño de ventana/dispositivo representativo de uso real (p. ej. una ventana de escritorio típica o un teléfono en orientación vertical), no a un viewport artificialmente recortado usado solo para pruebas de comportamiento de scroll.
- Esta especificación reemplaza el alcance de la especificación `015-coverage-and-type-size-regressions` (aún no implementada) para los dos problemas que comparten, e incorpora el tercer problema nuevo (cierre inesperado al quitar un Pokémon) reportado en esta misma sesión.
