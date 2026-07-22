import { test, expect, devices } from '@playwright/test';

/**
 * Teste rapide de regresie pentru cele mai fragile puncte descoperite până acum:
 * 1. Bara de jos / FAB / toast nu au un gol vizibil sub ele (bug-ul de viewport iOS).
 * 2. Swipe orizontal pe un rând de tranzacție chiar mișcă rândul (nu se blochează).
 *
 * Rulare: npx playwright test  (necesită `npm install` + `npm run dev` pornit,
 * sau Playwright poate porni el serverul dacă adaugi un `webServer` în config).
 */

test.use({ ...devices['iPhone 13'] });

test('bara de jos e lipită de marginea reală a ecranului, fără gol dedesubt', async ({ page }) => {
  await page.goto('/');
  const nav = page.locator('.bottom-nav');
  await expect(nav).toBeVisible();

  const navBox = await nav.boundingBox();
  const viewport = page.viewportSize();

  // bara trebuie să se termine la (sau foarte aproape de) marginea de jos a ecranului
  const gap = viewport.height - (navBox.y + navBox.height);
  expect(gap).toBeLessThan(5); // toleranță mică pt. rotunjiri sub-pixel
});

test('swipe stânga pe o tranzacție dezvăluie butonul de ștergere', async ({ page }) => {
  await page.goto('/');
  const firstRow = page.locator('.swipe-row-fg').first();
  await expect(firstRow).toBeVisible();

  const box = await firstRow.boundingBox();
  const startX = box.x + box.width - 30;
  const y = box.y + box.height / 2;

  // simulăm un swipe orizontal spre stânga
  await page.touchscreen.tap(startX, y); // asigură focus/activare
  await page.mouse.move(startX, y);
  await page.mouse.down();
  await page.mouse.move(startX - 100, y, { steps: 10 });
  await page.mouse.up();

  const transform = await firstRow.evaluate((el) => getComputedStyle(el).transform);
  // dacă swipe-ul a funcționat, elementul are un translateX negativ semnificativ (nu "none"/identitate)
  expect(transform).not.toBe('none');
  expect(transform).not.toMatch(/matrix\(1, 0, 0, 1, 0, 0\)/);
});
