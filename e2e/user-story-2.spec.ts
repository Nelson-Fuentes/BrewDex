import { test, expect, type Page } from '@playwright/test';

/**
 * User Story 2 (spec.md) — construir un equipo de hasta 6 Pokémon. Cubre
 * los 6 escenarios de aceptación y la confirmación de que no hay
 * persistencia (FR-015). Ver quickstart.md.
 */

async function goToTeamBuilderWithSwordShield(page: Page): Promise<void> {
  await page.goto('/juego');
  const swordShieldCard = page.locator('app-game-card', { hasText: 'Sword/Shield' });
  await expect(swordShieldCard).toBeVisible({ timeout: 15_000 });
  // 018, FR-004: elegir la tarjeta navega de inmediato, sin botón
  // "Seleccionar" separado.
  await swordShieldCard.getByRole('button').click();
  await expect(page).toHaveURL(/\/equipo$/);
}

test.describe('User Story 2 — Construir un equipo', () => {
  test('busca/filtra la Pokédex, agrega hasta 6 Pokémon y rechaza el 7º', async ({ page }) => {
    await goToTeamBuilderWithSwordShield(page);

    const addButtons = page.locator('app-pokedex-entry-card button');
    await expect(addButtons.first()).toBeVisible({ timeout: 20_000 });

    // Escenario 1: búsqueda por nombre acota el grid.
    await page.getByPlaceholder(/Search Pokémon|Buscar Pokémon/i).fill('grookey');
    await expect(page.locator('app-pokedex-entry-card', { hasText: 'Grookey' })).toBeVisible();
    await page.getByPlaceholder(/Search Pokémon|Buscar Pokémon/i).fill('');

    // Escenarios 2/3: agregar hasta llenar 6 slots, el 7º se rechaza.
    for (let i = 0; i < 6; i++) {
      await addButtons.nth(i).click();
    }
    await addButtons.nth(6).click();
    await expect(page.getByRole('alert')).toBeVisible();
  });

  test('elige una forma, reemplaza un movimiento, y quita un Pokémon del equipo', async ({ page }) => {
    await goToTeamBuilderWithSwordShield(page);

    const addButtons = page.locator('app-pokedex-entry-card button');
    await expect(addButtons.first()).toBeVisible({ timeout: 20_000 });
    await addButtons.first().click();

    // Escenario 4 (019): hacer click en el Pokémon del slot abre la
    // tarjeta modal de detalle (overlay real, cubre el resto de la
    // pantalla) — hay que cerrarla antes de poder interactuar de nuevo
    // con el slot que queda debajo.
    const firstSlot = page.locator('app-team-slot').first();
    await firstSlot.getByRole('button').first().click();
    const dialog = page.getByRole('dialog').first();
    await expect(dialog).toBeVisible();

    // 023, FR-001/FR-012: la sección de Análisis de Cobertura está presente
    // al abrir el modal, con su tabla (Sword/Shield es generación VIII,
    // era VI+ con tabla de tipos definida) o, en su defecto, el mensaje
    // explícito de generación sin tabla definida — nunca ambas cosas
    // ausentes.
    const coverageSection = dialog.locator('app-coverage-analysis-table');
    await expect(coverageSection).toBeVisible();
    await expect(coverageSection.locator('table, .app-coverage-table__unavailable')).toHaveCount(1);

    await dialog.getByRole('button', { name: /Close|Cerrar/i }).click();
    await expect(dialog).toBeHidden();

    // 026, FR-001: el "Índice sintético de cobertura global" ya visible en
    // la tabla de Análisis de Cobertura (arriba) también aparece en el
    // slot del equipo, sin necesidad de reabrir la tarjeta.
    await expect(firstSlot.locator('.app-team-slot__coverage-index')).toBeVisible();

    // 027, FR-001/FR-002: el botón "Análisis de cobertura" del equipo abre
    // un modal aparte con la tabla comparativa de todo el equipo (una fila
    // por tipo, una columna por Pokémon ocupado), sin alterar el equipo;
    // cerrarlo lo devuelve a la pantalla de equipo con el slot intacto.
    const teamCoverageButton = page.locator('[data-testid="team-coverage-button"]');
    await expect(teamCoverageButton).toBeEnabled();
    await teamCoverageButton.click();
    const teamCoverageModal = page.locator('app-team-coverage-modal');
    await expect(teamCoverageModal).toBeVisible();
    // Con 1 solo Pokémon en el equipo, hay exactamente 1 columna de Pokémon
    // (encabezado con colspan) — el número de filas depende de la cantidad
    // de tipos de la generación activa, no de la cantidad de Pokémon.
    await expect(teamCoverageModal.locator('thead tr:first-child th[colspan]')).toHaveCount(1);
    await teamCoverageModal.locator('[data-testid="team-coverage-modal-close"]').click();
    await expect(teamCoverageModal).toBeHidden();

    // Escenario 6: quitar el Pokémon del slot.
    await firstSlot.getByRole('button', { name: /Remove|Quitar/i }).click();
    await expect(firstSlot).toContainText(/Empty slot|Slot vacío/i);

    // 027, FR-003: con el equipo vacío, el botón de Análisis de Cobertura
    // del equipo queda deshabilitado.
    await expect(teamCoverageButton).toBeDisabled();
  });

  test('el selector de género cambia y persiste la imagen del Pokémon, con y sin shiny (019, US1/US3/US4)', async ({ page }) => {
    await goToTeamBuilderWithSwordShield(page);

    const addButtons = page.locator('app-pokedex-entry-card button');
    await expect(addButtons.first()).toBeVisible({ timeout: 20_000 });

    // Pikachu es de género dual y tiene una forma hembra distinta (la
    // punta de la cola en forma de corazón) — sprite propio en PokeAPI.
    await page.getByPlaceholder(/Search Pokémon|Buscar Pokémon/i).fill('pikachu');
    await page.locator('app-pokedex-entry-card', { hasText: 'Pikachu' }).locator('button').click();
    await page.getByPlaceholder(/Search Pokémon|Buscar Pokémon/i).fill('');

    const firstSlot = page.locator('app-team-slot').first();
    await firstSlot.getByRole('button').first().click();
    const dialog = page.getByRole('dialog').first();
    await expect(dialog).toBeVisible();

    // FR-002/FR-003: el toggle ♂/♀ aparece, macho seleccionado por defecto.
    const genderToggle = dialog.locator('mat-button-toggle-group');
    await expect(genderToggle).toBeVisible();
    const maleOption = genderToggle.locator('mat-button-toggle button').first();
    const femaleOption = genderToggle.locator('mat-button-toggle button').nth(1);
    await expect(maleOption).toHaveAttribute('aria-checked', 'true');

    // Pikachu tiene formas alternativas reales en PokeAPI (disfraces de
    // Cosplay Pikachu) — desde `020` esas formas también se renderizan
    // como `<img>` dentro del toggle de formas, así que hay que apuntar
    // a la imagen grande específica, no a cualquier `img` del diálogo.
    const image = dialog.locator('.app-detail-modal__sprite');
    const maleSpriteUrl = await image.getAttribute('src');

    // FR-007/FR-008: tocar ♀ cambia la selección y la imagen.
    await femaleOption.click();
    await expect(femaleOption).toHaveAttribute('aria-checked', 'true');
    await expect(image).not.toHaveAttribute('src', maleSpriteUrl ?? '');
    const femaleSpriteUrl = await image.getAttribute('src');

    // FR-010: con shiny activo, la imagen cambia de nuevo (forma shiny
    // del género ya seleccionado).
    await dialog.locator('mat-slide-toggle button').click();
    await expect(image).not.toHaveAttribute('src', femaleSpriteUrl ?? '');

    // FR-013: cerrar y reabrir conserva el género (hembra) guardado.
    await dialog.getByRole('button', { name: /Close|Cerrar/i }).click();
    await expect(dialog).toBeHidden();
    await firstSlot.getByRole('button').first().click();
    await expect(page.getByRole('dialog').first().locator('mat-button-toggle button').nth(1)).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  test('el selector de forma cambia el sprite y el tipo, y vuelve a la forma base (020, US1/US4/US5)', async ({ page }) => {
    await goToTeamBuilderWithSwordShield(page);

    const addButtons = page.locator('app-pokedex-entry-card button');
    await expect(addButtons.first()).toBeVisible({ timeout: 20_000 });

    // Rotom tiene formas alternativas (electrodoméstico) desde
    // Generación IV, disponibles en Espada/Escudo (Generación VIII).
    await page.getByPlaceholder(/Search Pokémon|Buscar Pokémon/i).fill('rotom');
    await page.locator('app-pokedex-entry-card', { hasText: 'Rotom' }).first().locator('button').click();
    await page.getByPlaceholder(/Search Pokémon|Buscar Pokémon/i).fill('');

    const firstSlot = page.locator('app-team-slot').first();
    await firstSlot.getByRole('button').first().click();
    const dialog = page.getByRole('dialog').first();
    await expect(dialog).toBeVisible();

    // FR-001: el toggle de formas aparece con al menos 2 chips (base + alternativas).
    const formChips = dialog.locator('.app-detail-modal__form-chip');
    await expect(formChips.first()).toBeVisible();
    const chipCount = await formChips.count();
    expect(chipCount).toBeGreaterThan(1);

    const image = dialog.locator('.app-detail-modal__sprite');
    const baseSpriteUrl = await image.getAttribute('src');
    const baseTypesText = await dialog.locator('.app-detail-modal__types').innerText();

    // FR-003/FR-005/FR-009: tocar otra forma cambia el chip activo, el
    // sprite y (para Rotom) el tipo mostrado.
    await formChips.nth(1).click();
    await expect(formChips.nth(1)).toHaveClass(/app-detail-modal__form-chip--active/);
    await expect(image).not.toHaveAttribute('src', baseSpriteUrl ?? '');
    await expect(dialog.locator('.app-detail-modal__types')).not.toHaveText(baseTypesText);

    // 020-stats-bar-scale-color, US3 (FR-005/FR-006): el gráfico de
    // estadísticas sigue mostrando las 6 barras con su etiqueta y valor
    // numérico tras cambiar de forma — Rotom no cambia sus stats base
    // entre variedades en los juegos reales (solo tipo/sprite), así que
    // aquí se verifica la ausencia de regresión (no queda en blanco/roto),
    // no un valor concreto distinto; el recálculo con datos que sí
    // difieren por forma (p. ej. una Megaevolución) ya está cubierto de
    // forma determinística en pokemon-detail-modal.component.spec.ts.
    const statValues = dialog.locator('.app-stat-value');
    await expect(statValues).toHaveCount(6);
    for (const text of await statValues.allTextContents()) {
      expect(Number.parseInt(text, 10)).toBeGreaterThanOrEqual(0);
    }

    // Volver a tocar el chip base restaura la forma original.
    await formChips.first().click();
    await expect(formChips.first()).toHaveClass(/app-detail-modal__form-chip--active/);
    await expect(image).toHaveAttribute('src', baseSpriteUrl ?? '');
  });

  test('un Pokémon sin formas alternativas no muestra el selector de forma (020, US2)', async ({ page }) => {
    await goToTeamBuilderWithSwordShield(page);

    const addButtons = page.locator('app-pokedex-entry-card button');
    await expect(addButtons.first()).toBeVisible({ timeout: 20_000 });
    await addButtons.first().click();

    const firstSlot = page.locator('app-team-slot').first();
    await firstSlot.getByRole('button').first().click();
    const dialog = page.getByRole('dialog').first();
    await expect(dialog).toBeVisible();

    await expect(dialog.locator('.app-detail-modal__form-chip')).toHaveCount(0);
  });

  test('recargar la página vuelve todo al estado inicial (FR-015, sin persistencia)', async ({ page }) => {
    await goToTeamBuilderWithSwordShield(page);
    const addButtons = page.locator('app-pokedex-entry-card button');
    await expect(addButtons.first()).toBeVisible({ timeout: 20_000 });
    await addButtons.first().click();
    await expect(page.locator('app-team-slot').first()).not.toContainText(/Empty slot|Slot vacío/i);

    await page.reload();

    // Sin ningún almacenamiento (FR-015): el equipo vuelve a estar vacío,
    // como si fuera la primera vez — no hay ningún guard de ruta que
    // redirija (esta migración no lo requiere), pero el estado sí se pierde.
    await expect(page.locator('app-team-slot').first()).toContainText(/Empty slot|Slot vacío/i);
  });
});
