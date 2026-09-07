import { expect, test } from '@playwright/test';

test.describe('Formularios de autenticación', () => {
  test('login renderiza formulario completo', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
    await expect(page.getByLabel('Correo electrónico')).toBeVisible();
    await expect(page.getByLabel('Contraseña')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Iniciar sesión' })).toBeVisible();
  });

  test('signup renderiza formulario completo', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.getByRole('heading', { name: 'Crear cuenta gratis' })).toBeVisible();
    await expect(page.getByLabel('Correo electrónico')).toBeVisible();
    await expect(page.getByLabel('Contraseña')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Comenzar gratis' })).toBeVisible();
  });
});
