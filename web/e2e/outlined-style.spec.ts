import { test, expect } from '@playwright/test';

/**
 * User Story 4 (spec.md de `018`) — estilo Material "outlined"
 * consistente. No exhaustivo (ver quickstart.md para la inspección visual
 * completa); confirma que los controles interactivos más comunes en cada
 * paso usan la variante outline en vez de rellena/plana.
 */
test.describe('User Story 4 — Estilo outlined consistente', () => {
  test('los form fields de /juego usan la variante outline', async ({ page }) => {
    await page.goto('/juego');
    await expect(page.locator('app-game-card').first()).toBeVisible({ timeout: 15_000 });

    const formField = page.locator('mat-form-field').first();
    await expect(formField).toHaveClass(/mat-form-field-appearance-outline/);
  });

  test('los form fields y botones de /equipo usan la variante outline', async ({ page }) => {
    await page.goto('/juego');
    const swordShieldCard = page.locator('app-game-card', { hasText: 'Sword/Shield' });
    await expect(swordShieldCard).toBeVisible({ timeout: 15_000 });
    await swordShieldCard.getByRole('button').click();
    await expect(page).toHaveURL(/\/equipo$/);

    const formField = page.locator('mat-form-field').first();
    await expect(formField).toBeVisible({ timeout: 15_000 });
    await expect(formField).toHaveClass(/mat-form-field-appearance-outline/);

    // Botón "agregar Pokémon" abre el detalle; el botón "Elegir
    // movimientos" que aparece ahí debe ser mat-stroked-button
    // (outlined), no mat-flat-button/mat-raised-button (relleno).
    await page.locator('app-pokedex-entry-card button').first().click();
    const teamSlotButton = page.locator('app-team-slot .app-team-slot__avatar-button').first();
    await teamSlotButton.click();
    const actionButton = page.getByRole('button', { name: /Choose moves|Elegir movimientos/i });
    await expect(actionButton).toHaveClass(/mat-mdc-outlined-button/);
  });
});
