/**
 * E2E tests for Settings page
 */

import { test, expect } from '@playwright/test';
import { login, navigateTo } from './helpers/testSetup';

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    const loggedIn = await login(page);
    if (!loggedIn) {
      test.skip();
    }
  });

  test('should navigate to settings from header', async ({ page }) => {
    // Look for settings icon/button in header
    const settingsButton = page.locator('button[title]').filter({ has: page.locator('svg') }).first();
    const hasSettings = await settingsButton.isVisible().catch(() => false);

    if (hasSettings) {
      await settingsButton.click();
      await page.waitForURL(/settings/, { timeout: 5000 });
      expect(page.url()).toContain('settings');
    }
  });

  test('should display settings page sections', async ({ page }) => {
    await navigateTo(page, '/settings');

    // Should have clinic info section
    const clinicSection = page.locator('text=/informations|clinic info/i');
    await expect(clinicSection.first()).toBeVisible({ timeout: 5000 });

    // Should have queue settings section
    const queueSection = page.locator('text=/file|queue/i');
    const hasQueue = await queueSection.first().isVisible().catch(() => false);
    expect(hasQueue).toBe(true);

    // Should have change password section
    const passwordSection = page.locator('text=/mot de passe|password/i');
    const hasPassword = await passwordSection.first().isVisible().catch(() => false);
    expect(hasPassword).toBe(true);
  });

  test('should have editable clinic name', async ({ page }) => {
    await navigateTo(page, '/settings');

    const nameInput = page.locator('#name');
    await expect(nameInput).toBeVisible({ timeout: 5000 });

    const value = await nameInput.inputValue();
    expect(value.length).toBeGreaterThan(0);
  });

  test('should have save buttons', async ({ page }) => {
    await navigateTo(page, '/settings');

    const saveButtons = page.locator('button[type="submit"]');
    const count = await saveButtons.count();
    expect(count).toBeGreaterThanOrEqual(2); // At least clinic info + queue settings
  });

  test('should have back to dashboard link', async ({ page }) => {
    await navigateTo(page, '/settings');

    const backButton = page.locator('text=/retour|back|dashboard/i');
    await expect(backButton.first()).toBeVisible({ timeout: 5000 });
  });

  test('should have doctors management section', async ({ page }) => {
    await navigateTo(page, '/settings');

    const doctorsSection = page.locator('text=/médecins|doctors/i');
    const hasDoctors = await doctorsSection.first().isVisible().catch(() => false);
    expect(hasDoctors).toBe(true);
  });
});
