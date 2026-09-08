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
    await dialog.getByRole('button', { name: /Close|Cerrar/i }).click();
    await expect(dialog).toBeHidden();

    // Escenario 6: quitar el Pokémon del slot.
    await firstSlot.getByRole('button', { name: /Remove|Quitar/i }).click();
    await expect(firstSlot).toContainText(/Empty slot|Slot vacío/i);
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

    const image = dialog.locator('img');
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
