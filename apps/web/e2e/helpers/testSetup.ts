/**
 * Shared test helpers for E2E tests
 */

import { Page } from '@playwright/test';

export const TEST_CLINIC = {
  email: process.env.TEST_EMAIL || 'dr.skander@example.tn',
  password: process.env.TEST_PASSWORD || 'password123',
};

export const TEST_SIGNUP = {
  name: 'Test Clinic E2E',
  email: `e2e-test-${Date.now()}@example.tn`,
  password: 'TestPassword123!',
};

/**
 * Login to the app and return whether login was successful
 */
export async function login(page: Page): Promise<boolean> {
  try {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.locator('input[type="email"]').fill(TEST_CLINIC.email);
    await page.locator('input[type="password"]').fill(TEST_CLINIC.password);
    await page.locator('button[type="submit"]').click();

    const result = await Promise.race([
      page.waitForURL(/dashboard/, { timeout: 10000 }).then(() => true),
      page.locator('text=/erreur|error|invalid|incorrect/i').waitFor({ timeout: 10000 }).then(() => false),
    ]).catch(() => false);

    return result;
  } catch {
    return false;
  }
}

/**
 * Navigate to a page and wait for it to load
 */
export async function navigateTo(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
}
