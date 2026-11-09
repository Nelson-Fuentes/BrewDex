import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * User Story 1 (spec.md) — elegir idioma y juego al entrar. Cubre los 4
 * escenarios de aceptación y la auditoría de accesibilidad WCAG 2.1 AA
 * (SC-007). Ver quickstart.md.
 */
test.describe('User Story 1 — Elegir idioma y juego', () => {
  test('preselecciona un idioma, permite elegirlo, y navega al selector de juego', async ({ page }) => {
    await page.goto('/idioma');

    // Escenario 1: preselección razonable visible (algún idioma resaltado
    // o la lista ya cargada, no en blanco).
    await expect(page.getByRole('button', { pressed: true })).toBeVisible({ timeout: 15_000 });

    // Escenario 2 (018, FR-002): elegir un idioma navega de inmediato, sin
    // botón "Continuar" separado.
    await page.getByRole('button', { name: 'Español' }).click();
    await expect(page).toHaveURL(/\/juego$/);
  });

  test('permite volver al paso anterior desde el selector de juego (018, FR-005)', async ({ page }) => {
    await page.goto('/juego');
    await expect(page.locator('app-game-card').first()).toBeVisible({ timeout: 15_000 });

    await page.getByTestId('back-button').click();
    await expect(page).toHaveURL(/\/idioma$/);
  });

  test('filtra el catálogo de juegos por nombre y por generación, y navega al elegir uno', async ({ page }) => {
    await page.goto('/juego');
    const swordShieldCard = page.locator('app-game-card', { hasText: 'Sword/Shield' });
    await expect(swordShieldCard).toBeVisible({ timeout: 15_000 });

    // Escenario 3: búsqueda por nombre acota la lista.
    await page.getByPlaceholder(/Search games|Buscar juegos/i).fill('scarlet');
    await expect(page.locator('app-game-card', { hasText: 'Scarlet/Violet' })).toBeVisible();
    await expect(swordShieldCard).toHaveCount(0);
    await page.getByPlaceholder(/Search games|Buscar juegos/i).fill('');

    // Escenario 4 (018, FR-004): elegir una tarjeta navega de inmediato al
    // constructor de equipo, sin botón "Seleccionar" separado.
    await swordShieldCard.getByRole('button').click();
    await expect(page).toHaveURL(/\/equipo$/);
  });

  test('no reporta incumplimientos de accesibilidad WCAG 2.1 AA (SC-007)', async ({ page }) => {
    await page.goto('/idioma');
    await expect(page.getByRole('button', { pressed: true })).toBeVisible({ timeout: 15_000 });

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

    expect(results.violations).toEqual([]);
  });
});
