# Feature Specification: Tamaño Legible de Tipos y Visibilidad Real de la Tabla de Cobertura

**Feature Branch**: `015-coverage-and-type-size-regressions`

**Created**: 2026-09-01

**Status**: Draft

**Input**: User description: "Correcciones de regresión sobre 014-team-configurator-fixes-2 en el configurador de equipo de BrewDex: (1) Tras el ajuste anterior, los tipos de Pokémon (en los slots del equipo y en la tarjeta de personalización) ahora se ven demasiado pequeños/apenas legibles; deben tener un tamaño suficientemente grande para seguir siendo claramente legibles, manteniendo al mismo tiempo que quepan dos tipos en una sola fila dentro de un slot del equipo en la versión web (el objetivo original: ni tan grandes que no quepan dos en una fila, ni tan pequeños que sean ilegibles). (2) La tabla de Análisis de Cobertura sigue sin ser visible en la interfaz a pesar del arreglo previo (se agregó scroll vertical); hay que investigar de nuevo por qué no aparece y corregirlo definitivamente — revisar si el problema es de layout, de datos, de navegación hacia la página, o de renderizado real en el dispositivo/navegador usado."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Los tipos son legibles sin dejar de caber dos por fila (Priority: P1)

Un entrenador ve las etiquetas de tipo de un Pokémon (en los espacios del equipo y en la tarjeta de personalización) en un tamaño claramente legible a simple vista — ni tan diminutas que cueste distinguirlas o leerlas, ni tan grandes que dos tipos dejen de caber en una sola fila dentro de un espacio del equipo en la versión web.

**Why this priority**: Es la segunda vez que el tamaño de los tipos se reporta como incorrecto (antes "muy grande", ahora "muy pequeño"); sin un punto de equilibrio validado, la legibilidad del equipo completo queda comprometida en cada sesión.

**Independent Test**: Abrir el configurador con un Pokémon de dos tipos, en un espacio del equipo en la versión web: verificar que ambas etiquetas de tipo caben en una sola fila y que, comparadas con el resto del texto de la interfaz (p. ej. el nombre del Pokémon), no se ven desproporcionadamente pequeñas ni difíciles de distinguir entre sí. Repetir en la tarjeta de personalización, verificando que su tamaño de tipo coincide con el de los espacios del equipo.

**Acceptance Scenarios**:

1. **Given** un espacio del equipo con un Pokémon de dos tipos, **When** se visualiza en la versión web, **Then** ambas etiquetas de tipo se muestran en una sola fila, sin desbordarse ni truncarse.
2. **Given** el mismo espacio del equipo, **When** se compara el tamaño de la etiqueta de tipo con el del nombre del Pokémon mostrado justo debajo, **Then** la etiqueta de tipo es claramente distinguible y legible, sin verse como un punto o un ícono minúsculo difícil de reconocer.
3. **Given** la tarjeta de personalización de un Pokémon, **When** se muestran sus etiquetas de tipo, **Then** tienen el mismo tamaño legible que las etiquetas de tipo usadas en los espacios del equipo.

---

### User Story 2 - La tabla de Análisis de Cobertura es realmente visible al navegar a ella (Priority: P1)

Un entrenador que navega a la sección de Análisis de Cobertura ve la tabla en pantalla de inmediato (o alcanzable con un desplazamiento evidente), sin que la sección aparezca vacía, en blanco, o inexistente — sin importar el dispositivo, navegador o tamaño de ventana desde el que se acceda.

**Why this priority**: Es la segunda vez que se reporta esta sección como no visible pese a una corrección previa (se agregó scroll vertical); si la causa real no era esa, cualquier otra mejora sobre la tabla (columnas, datos) sigue siendo inútil para el usuario hasta que la sección efectivamente se vea.

**Independent Test**: Navegar a la sección de Análisis de Cobertura desde el configurador de equipo, en una ventana/viewport de tamaño normal (no artificialmente recortada) tanto en web como en móvil, y verificar que el contenido de la tabla (encabezados y filas) es visible en pantalla sin pasos adicionales no evidentes para el usuario.

**Acceptance Scenarios**:

1. **Given** el entrenador está en el configurador de equipo, **When** pulsa la acción de Análisis de Cobertura, **Then** la página se abre y su contenido (título y tabla) es visible sin requerir ninguna acción adicional no señalizada.
2. **Given** la página de Análisis de Cobertura abierta en un tamaño de ventana/dispositivo normal, **When** el entrenador la observa sin desplazarse, **Then** ve al menos las primeras filas de la tabla, con texto legible y sin solaparse con otro contenido.
3. **Given** la causa de la no-visibilidad anterior (si resulta ser distinta de "falta de scroll"), **When** se corrige, **Then** queda documentada junto con una verificación que la habría detectado, para no repetir el mismo diagnóstico incompleto una tercera vez.

---

### Edge Cases

- ¿Qué ocurre en un viewport de tamaño reducido (móvil apaisado o ventana de escritorio no maximizada) con dos tipos en un espacio del equipo? Deben seguir cabiendo en una fila con el nuevo tamaño, no solo en el viewport de referencia usado para validar el ajuste anterior.
- ¿Qué ocurre si la tabla de cobertura, una vez visible, tiene más columnas de las que caben horizontalmente en un viewport angosto? Debe seguir siendo alcanzable mediante scroll horizontal (comportamiento ya existente), sin que esto vuelva a ocultar la tabla por completo.
- ¿Qué ocurre si la causa de la no-visibilidad resulta ser ajena al código de la aplicación (p. ej. una build desactualizada siendo la que efectivamente se está probando)? Debe quedar documentado como tal en vez de aplicarse un cambio de código que no corrige nada real.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE mostrar las etiquetas de tipo (en los espacios del equipo y en la tarjeta de personalización) en un tamaño mayor al actual (24px), lo suficientemente grande para ser claramente legible junto al resto del texto de esas mismas pantallas.
- **FR-002**: El sistema DEBE seguir permitiendo que dos etiquetas de tipo quepan en una sola fila dentro de un espacio del equipo en la versión web, con el nuevo tamaño mayor.
- **FR-003**: El tamaño de las etiquetas de tipo DEBE seguir siendo el mismo en los espacios del equipo y en la tarjeta de personalización (un único valor compartido, no dos ajustados por separado).
- **FR-004**: El sistema DEBE investigar la causa real de que la tabla de Análisis de Cobertura no sea visible, más allá de la falta de scroll vertical ya corregida — considerando explícitamente causas de layout, de datos/parámetros, de navegación/entrada a la página, y de artefactos de compilación/despliegue desactualizados.
- **FR-005**: El sistema DEBE mostrar la tabla de Análisis de Cobertura de forma verificablemente visible (contenido con posición y tamaño reales en pantalla, no solo presente en el árbol de widgets) al navegar a esa sección, en un viewport de tamaño normal, sin pasos adicionales no señalizados.
- **FR-006**: Si la causa de la no-visibilidad resulta no ser un defecto del código de la aplicación (p. ej. una build/despliegue desactualizado), el sistema — o la documentación de esta corrección — DEBE dejar constancia explícita de esa causa y de cómo el entrenador puede verificar que está usando una build actualizada.

### Key Entities

- **Tamaño de etiqueta de tipo**: El valor de tamaño compartido que controla cuán grande se renderiza el ícono/etiqueta de un tipo de Pokémon en los espacios del equipo y en la tarjeta de personalización; debe balancear legibilidad y la restricción de "dos tipos por fila" en un espacio del equipo web.
- **Visibilidad real de la tabla de cobertura**: No solo "el widget existe en el árbol de la aplicación", sino que su contenido tiene una posición y tamaño en pantalla que un entrenador puede efectivamente ver sin pasos adicionales, en las condiciones normales de uso (viewport típico, build actualizada).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En un viewport web ancho, el 100% de los Pokémon de dos tipos en un espacio del equipo muestran ambos tipos en una sola fila, con un tamaño de etiqueta notoriamente mayor al de la iteración anterior.
- **SC-002**: Al comparar el tamaño de la etiqueta de tipo con el del nombre del Pokémon en el mismo espacio del equipo, ningún evaluador de prueba reporta la etiqueta de tipo como "ilegible" o "demasiado pequeña".
- **SC-003**: Al navegar a Análisis de Cobertura desde un viewport de tamaño normal (sin recortar artificialmente la ventana), el 100% de las veces la tabla es visible en pantalla sin pasos adicionales.
- **SC-004**: La causa raíz de la no-visibilidad de la tabla queda identificada y documentada de forma verificable (con una prueba o verificación que la habría detectado antes del arreglo anterior), evitando un tercer reporte del mismo síntoma.

## Assumptions

- El valor de referencia "24px" para `kStandardTypeIconSize` es el tamaño actual reportado como demasiado pequeño; el nuevo valor buscado es un punto intermedio entre ese y los valores previos (96–224px) que resultaban "demasiado grandes" — no se asume un número exacto por adelantado, se determinará verificando que dos tipos sigan cabiendo en una fila en el ancho de celda real de un espacio del equipo en la versión web.
- Es posible que parte o la totalidad del reporte de "la tabla de cobertura sigue sin ser visible" se deba a que el entrenador está probando una build/despliegue anterior a la corrección más reciente (que sí agregó scroll vertical), en vez de un defecto de código nuevo — esta corrección investiga y corrige cualquier causa de código real que encuentre, y documenta explícitamente si concluye que la build usada era la causa.
- "Viewport de tamaño normal" se refiere a un tamaño de ventana/dispositivo representativo de uso real (p. ej. una ventana de escritorio típica o un teléfono en orientación vertical), no al viewport artificialmente recortado (400×300) usado para probar el comportamiento de scroll en la corrección anterior.
