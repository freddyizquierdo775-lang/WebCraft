import { expect, test } from '@playwright/test';

/**
 * Auth guard — verifica que las rutas protegidas redirigen a /login
 * cuando no hay sesión activa (middleware de Supabase).
 */
test.describe('Auth guard (rutas protegidas)', () => {
  test('/dashboard redirige a /login sin sesión', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
  });

  test('/projects/[id]/editor redirige a /login sin sesión', async ({ page }) => {
    await page.goto('/projects/test-project-id/editor');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
  });

  test('/billing redirige a /login sin sesión', async ({ page }) => {
    await page.goto('/billing');
    await expect(page).toHaveURL(/\/login/);
  });
});
