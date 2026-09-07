import { expect, test } from '@playwright/test';

test.describe('Landing Page', () => {
  test('renderiza el hero y los CTAs', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Crea sitios web/i })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Comenzar gratis' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Iniciar sesión' })).toBeVisible();
  });

  test('muestra las 3 features', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('IA Generativa')).toBeVisible();
    await expect(page.getByText('Edición Granular')).toBeVisible();
    await expect(page.getByText('Publicación 1-Click')).toBeVisible();
  });
});
