# Feature Specification: Layout Mitad y Mitad, Íconos de Tipo, Colores de Estadísticas y Tabla de Debilidades

**Feature Branch**: `010-layout-icons-stats-weaknesses`

**Created**: 2026-08-29

**Status**: Draft

**Input**: User description: "Ajustes al configurador de equipo (versión web/escritorio de dos paneles) y a la tarjeta de personalización de Pokémon: (1) En la versión web, el panel de slots del equipo (lado izquierdo) debe ocupar exactamente la mitad del espacio horizontal disponible, y el panel de la Pokédex (lado derecho) la otra mitad exacta — actualmente el panel de equipo se ve muy pequeño y el de la Pokédex ocupa más de la mitad. (2) Los íconos de tipo (en los slots del equipo, en la tarjeta de personalización y en los filtros) se ven muy pequeños. Deben mostrarse sin la etiqueta de texto junto al ícono, y el ícono debe ocupar todo el espacio disponible de su contenedor, sin relleno (padding) interno. (3) La sección de estadísticas base (gráfico de barras) en la tarjeta de personalización está bien en general, pero cada barra debe pintarse de un color distinto según el valor de la estadística, usando rangos que indiquen si es una estadística 'buena' o 'mala' (similar a como herramientas de referencia de la comunidad Pokémon colorean las estadísticas base: rojo para valores bajos, hacia amarillo/naranja para valores medios, y verde/cian para valores altos). (4) Se debe agregar a la tarjeta de personalización una sección de debilidades de tipo: una tabla de doble entrada que liste, para cada uno de los 18 tipos de Pokémon, el multiplicador de daño recibido por el Pokémon actualmente seleccionado (según sus tipos y forma activa) al ser atacado por ese tipo — valores posibles 0, 0.25, 0.5, 1, 2 o 4 (combinando debilidades/resistencias/inmunidades de hasta dos tipos)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - El equipo y la Pokédex se reparten la pantalla en partes iguales (Priority: P1)

Un entrenador usando la versión de escritorio/web del configurador quiere ver su equipo con un tamaño cómodo, ocupando la mitad de la pantalla, en vez de un panel angosto apretado contra el borde izquierdo mientras la Pokédex se lleva la mayor parte del espacio.

**Why this priority**: Es un problema de usabilidad visible en cada sesión de uso de la versión web y afecta directamente la comodidad de la tarea principal (armar y revisar el equipo).

**Independent Test**: Abrir el configurador en una ventana de escritorio y medir el ancho de ambos paneles — el panel de equipo (izquierda) y el panel de la Pokédex (derecha) deben tener el mismo ancho, cada uno la mitad del espacio horizontal disponible.

**Acceptance Scenarios**:

1. **Given** el usuario abre el configurador en una ventana de escritorio, **When** el layout de dos paneles se renderiza, **Then** el panel de slots del equipo ocupa la mitad del ancho disponible y el panel de la Pokédex ocupa la otra mitad, con un reparto equitativo (50/50, descontando cualquier separador visual entre ambos).
2. **Given** el usuario redimensiona la ventana, **When** el ancho disponible cambia, **Then** ambos paneles se ajustan manteniendo el reparto de mitad y mitad.
3. **Given** el panel de equipo ahora ocupa la mitad de la pantalla, **When** se renderizan sus 6 espacios, **Then** cada espacio del equipo se ve notoriamente más grande que antes, aprovechando el espacio adicional disponible.

---

### User Story 2 - Los íconos de tipo se ven grandes y claros, sin texto (Priority: P2)

Un entrenador identifica los tipos de un Pokémon por su ícono. Actualmente el ícono se ve pequeño porque comparte espacio con el nombre del tipo en texto y tiene relleno interno alrededor. El entrenador prefiere ver solo el ícono, lo más grande posible dentro de su espacio asignado.

**Why this priority**: Es una mejora de claridad visual que afecta a varias partes de la pantalla (slots del equipo, tarjeta de personalización, filtros de la Pokédex), pero no bloquea ninguna funcionalidad.

**Independent Test**: Comparar el tamaño del ícono de un tipo antes y después del cambio en cada una de las tres ubicaciones (slot del equipo, tarjeta de personalización, filtro de tipo) — el ícono debe verse más grande, sin la etiqueta de texto junto a él, y sin espacio vacío entre el ícono y el borde de su contenedor.

**Acceptance Scenarios**:

1. **Given** un Pokémon con uno o dos tipos, **When** se muestra en un slot del equipo, en la tarjeta de personalización, o como opción en el filtro de tipos de la Pokédex, **Then** cada tipo se representa únicamente con su ícono (sin el nombre del tipo en texto junto a él).
2. **Given** el ícono de un tipo se muestra en cualquiera de esas tres ubicaciones, **When** se compara el tamaño del ícono con el tamaño de su contenedor, **Then** el ícono ocupa el espacio disponible del contenedor sin relleno (padding) interno perceptible alrededor.
3. **Given** el filtro de tipos de la Pokédex ya no muestra el nombre del tipo en texto, **When** el usuario necesita saber qué tipo representa cada ícono, **Then** el tipo sigue siendo identificable (por ejemplo, mediante una descripción accesible/tooltip), aunque el texto visible se haya quitado.

---

### User Story 3 - Las barras de estadísticas se colorean según qué tan buena es cada estadística (Priority: P2)

Un entrenador mira el gráfico de barras de estadísticas base de un Pokémon y quiere identificar de un vistazo, por color, cuáles estadísticas son bajas (débiles) y cuáles son altas (fuertes), no solo por la longitud de la barra.

**Why this priority**: Es una mejora de la funcionalidad ya entregada (el gráfico de barras) que añade una segunda señal visual (color) además de la longitud, pero el gráfico ya es funcional sin ella.

**Independent Test**: Abrir la tarjeta de personalización de un Pokémon con estadísticas claramente dispares (una muy baja y una muy alta) y verificar que la barra de la estadística baja se muestra en un color de la zona "baja" (por ejemplo, rojo) y la de la estadística alta en un color de la zona "alta" (por ejemplo, verde/cian), con una transición coherente para los valores intermedios.

**Acceptance Scenarios**:

1. **Given** el gráfico de barras de estadísticas base de un Pokémon, **When** una estadística tiene un valor bajo dentro del rango típico de estadísticas base, **Then** su barra se muestra en un color asociado a "estadística baja" (por ejemplo, rojo).
2. **Given** el mismo gráfico, **When** una estadística tiene un valor alto dentro del rango típico, **Then** su barra se muestra en un color asociado a "estadística alta" (por ejemplo, verde o cian), visualmente distinto del color usado para valores bajos.
3. **Given** dos estadísticas con valores en el rango medio, **When** se comparan sus colores, **Then** ambas muestran un color de la zona intermedia (por ejemplo, amarillo/naranja), coherente con la escala baja→alta.
4. **Given** el usuario cambia la forma seleccionada del Pokémon (por ejemplo, a una Megaevolución), **When** las estadísticas se recalculan, **Then** los colores de las barras se recalculan también, según los nuevos valores de esa forma.

---

### User Story 4 - Ver las debilidades de tipo del Pokémon en una tabla (Priority: P1)

Un entrenador quiere saber, antes de confirmar un Pokémon en su equipo, contra qué tipos de ataque es vulnerable, resistente o inmune, para evitar que su equipo tenga demasiadas debilidades compartidas.

**Why this priority**: Es información estratégica central para armar un buen equipo Pokémon — sin ella, el entrenador tiene que consultar esta información fuera de la aplicación, lo que le resta valor a la herramienta como configurador completo.

**Independent Test**: Abrir la tarjeta de personalización de un Pokémon con tipos conocidos (por ejemplo, un Pokémon de doble tipo con una debilidad y una resistencia conocidas) y verificar que la tabla de debilidades muestra el multiplicador correcto para cada uno de los 18 tipos de ataque, coincidiendo con las reglas oficiales de tipos de la franquicia.

**Acceptance Scenarios**:

1. **Given** el usuario abre la tarjeta de personalización de cualquier Pokémon, **When** la sección de debilidades de tipo se renderiza, **Then** se muestra una tabla con los 18 tipos de ataque listados, cada uno junto al multiplicador de daño que ese Pokémon recibiría de un ataque de ese tipo.
2. **Given** un Pokémon con un solo tipo, **When** se calcula su tabla de debilidades, **Then** los multiplicadores mostrados corresponden exactamente a las relaciones de tipo oficiales de ese único tipo (débil ×2, resistente ×0.5, inmune ×0, neutral ×1).
3. **Given** un Pokémon con dos tipos, **When** se calcula su tabla de debilidades, **Then** el multiplicador de cada tipo de ataque combina el efecto de ambos tipos del Pokémon (por ejemplo, ×4 si es débil a ese tipo de ataque por ambos tipos, ×0.25 si es resistente por ambos, ×0 si es inmune por al menos uno de los dos).
4. **Given** el usuario cambia la forma seleccionada del Pokémon (por ejemplo, a una Megaevolución o forma regional con tipos distintos a los de la forma base), **When** los tipos activos cambian, **Then** la tabla de debilidades se recalcula según los tipos de la nueva forma.
5. **Given** la tabla de debilidades, **When** el usuario la revisa, **Then** los multiplicadores distintos de ×1 (neutral) se distinguen visualmente entre sí (por ejemplo, con color o énfasis), de modo que las debilidades e inmunidades resalten sobre las relaciones neutrales.

### Edge Cases

- ¿Qué pasa si el panel de equipo, al ocupar la mitad de la pantalla, deja muy poco espacio a la Pokédex en una ventana angosta (por debajo del punto de quiebre de escritorio)? Esta funcionalidad aplica solo a la versión de escritorio/web ya definida (el mismo punto de quiebre `expanded` que ya usa el layout de dos paneles); por debajo de ese punto de quiebre se mantiene el diseño compacto de una sola columna, sin cambios.
- ¿Qué pasa con el ícono de un tipo cuya imagen oficial no está disponible (falla de red)? Debe seguir aplicándose el mecanismo de reemplazo ya existente (un ícono alternativo), ahora también sin texto y ocupando el espacio completo del contenedor.
- ¿Qué pasa si dos estadísticas base tienen exactamente el mismo valor pero tal valor cae justo en el límite entre dos rangos de color? El color asignado debe ser determinista y consistente (siempre el mismo color para ese valor exacto), sin parpadeo ni ambigüedad visual.
- ¿Qué pasa con un tipo Teratipo (Escarlata/Púrpura) al calcular las debilidades? La tabla de debilidades de tipo de esta funcionalidad se basa en los tipos base/de forma del Pokémon (no en el Teratipo elegido), ya que el Teratipo es una mecánica de batalla aparte, no un cambio permanente de tipo del Pokémon.
- ¿Qué pasa si el Pokémon no tiene ninguna estadística o tipo resuelto todavía (dato no disponible)? Tanto el gráfico de barras coloreado como la tabla de debilidades deben evitar mostrar información incorrecta o en blanco sin explicación; deben comportarse de forma consistente con cómo esta pantalla ya maneja datos no disponibles en otras secciones.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: En la versión de escritorio/web (el mismo punto de quiebre `expanded` que ya activa el layout de dos paneles), el panel de slots del equipo DEBE ocupar exactamente la mitad del ancho disponible del layout de dos paneles, y el panel de la Pokédex DEBE ocupar la otra mitad.
- **FR-002**: El reparto de mitad y mitad entre ambos paneles DEBE mantenerse al redimensionar la ventana, dentro del rango de anchos ya considerado "escritorio/web" por la aplicación.
- **FR-003**: Los íconos de tipo mostrados en los slots del equipo, en la tarjeta de personalización y en los filtros de tipo de la Pokédex DEBEN mostrarse sin una etiqueta de texto visible junto al ícono.
- **FR-004**: Los íconos de tipo en esas tres ubicaciones DEBEN ocupar el espacio disponible de su contenedor, sin relleno (padding) interno perceptible entre el ícono y el borde del contenedor.
- **FR-005**: Cuando se quite la etiqueta de texto visible de un tipo (por ejemplo, en el filtro de tipos), el sistema DEBE seguir ofreciendo una forma de identificar qué tipo representa el ícono (por ejemplo, mediante una descripción accesible o equivalente), para no perder claridad para quienes no reconozcan el ícono a simple vista.
- **FR-006**: Cada barra del gráfico de estadísticas base DEBE colorearse según el valor de esa estadística, usando una escala de colores continua o por rangos donde los valores bajos usan un color de "estadística baja" (por ejemplo, rojo), los valores medios usan un color intermedio (por ejemplo, amarillo/naranja), y los valores altos usan un color de "estadística alta" (por ejemplo, verde/cian).
- **FR-007**: La asignación de color de cada barra DEBE recalcularse cuando cambian los valores de estadísticas mostrados (por ejemplo, al cambiar la forma seleccionada del Pokémon), de forma consistente con cómo el gráfico de barras ya se actualiza ante un cambio de forma.
- **FR-008**: La tarjeta de personalización DEBE incluir una sección de tabla de debilidades de tipo, mostrando los 18 tipos de ataque de la franquicia junto al multiplicador de daño que el Pokémon actualmente seleccionado recibiría de cada uno.
- **FR-009**: El multiplicador de cada tipo de ataque en la tabla DEBE calcularse combinando las relaciones de tipo oficiales de todos los tipos activos del Pokémon (uno o dos tipos, según la forma actualmente seleccionada), pudiendo resultar en 0, 0.25, 0.5, 1, 2 o 4.
- **FR-010**: La tabla de debilidades DEBE recalcularse cuando cambian los tipos activos del Pokémon (por ejemplo, al cambiar a una forma con tipos distintos), de forma consistente con cómo el resto de la tarjeta ya se actualiza ante un cambio de forma.
- **FR-011**: La tabla de debilidades DEBE distinguir visualmente los multiplicadores distintos de ×1 (neutral) de los demás, de modo que las debilidades (×2, ×4), resistencias (×0.5, ×0.25) e inmunidades (×0) resalten frente a las relaciones neutrales.
- **FR-012**: El cálculo de la tabla de debilidades DEBE basarse en los tipos base o de la forma activa del Pokémon, sin considerar el Teratipo (en los juegos donde existe) como parte del cálculo.

### Key Entities

- **Layout de dos paneles**: La distribución horizontal de la versión de escritorio del configurador — panel de equipo (izquierda) y panel de Pokédex (derecha) — ahora con reparto exacto de mitad y mitad.
- **Ícono de tipo**: Representación visual de un tipo de Pokémon, ahora mostrada de forma aislada (sin texto) y ajustada para llenar su contenedor sin relleno interno, en las tres ubicaciones donde se usa.
- **Escala de color de estadística**: El color asignado a una barra del gráfico de estadísticas base, determinado por el valor de esa estadística dentro del rango típico de estadísticas base de la franquicia.
- **Tabla de debilidades de tipo**: Para un Pokémon (con su forma activa), la lista de los 18 tipos de ataque junto al multiplicador de daño resultante de combinar las relaciones de tipo oficiales de los tipos activos del Pokémon.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En la versión de escritorio, el panel de equipo y el panel de la Pokédex miden el mismo ancho (dentro de un margen mínimo por separadores visuales), verificado en al menos tres anchos de ventana representativos.
- **SC-002**: El 100% de los íconos de tipo en las tres ubicaciones mencionadas se muestran sin etiqueta de texto y sin espacio vacío perceptible entre el ícono y el borde de su contenedor.
- **SC-003**: Un usuario puede identificar, solo por color, si una estadística base es baja, media o alta en el 100% de los casos de prueba con valores claramente distintos entre sí.
- **SC-004**: El 100% de las tablas de debilidades mostradas coinciden con el cálculo oficial de multiplicadores de tipo de la franquicia para los tipos activos del Pokémon mostrado, verificado contra una muestra representativa de combinaciones de uno y dos tipos.

## Assumptions

- Esta funcionalidad amplía el layout de dos paneles y la tarjeta de personalización ya entregados en `007-configurador-equipo-mejoras`, `008-configurador-equipo-correcciones` y `009-stats-chart-full-pokedex`; no introduce pantallas nuevas.
- El "reparto de mitad y mitad" se aplica dentro del mismo layout de dos paneles ya existente (el mismo punto de quiebre `expanded`); no cambia en qué anchos de ventana se activa ese layout, solo cómo se reparte el espacio una vez activo.
- Los rangos de color de las estadísticas base se basan en convenciones ya usadas por herramientas de referencia de la comunidad Pokémon (por ejemplo, un valor base bajo —cercano al mínimo típico— en rojo, un valor medio en amarillo/naranja, y un valor alto —cercano al máximo típico de 255— en verde/cian), sin que la funcionalidad dependa de una herramienta externa específica.
- Las relaciones de tipo (débil/resistente/inmune) usadas para calcular la tabla de debilidades son las 18 relaciones oficiales de tipo de la franquicia Pokémon en su forma vigente en los juegos ya soportados por esta aplicación (no incluyen mecánicas exclusivas de generaciones no soportadas).
- La tabla de debilidades es de solo lectura (no editable ni interactiva más allá de mostrarse); no ofrece, por ejemplo, simular un ataque específico o filtrar por tipo.
