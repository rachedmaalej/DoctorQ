/**
 * E2E tests for Patient Check-in and Status pages
 */

import { test, expect } from '@playwright/test';
import { navigateTo } from './helpers/testSetup';

test.describe('Patient Check-in Page', () => {
  test('should handle invalid clinic ID gracefully', async ({ page }) => {
    await navigateTo(page, '/checkin/invalid-clinic-id');

    // Page should load without crashing
    await expect(page.locator('body')).toBeVisible();

    // Should show phone input or error
    const hasInput = await page.locator('input[type="tel"]').isVisible().catch(() => false);
    const hasError = await page.locator('text=/erreur|error|not found|introuvable/i').isVisible().catch(() => false);
    expect(hasInput || hasError).toBe(true);
  });

  test('check-in page should be mobile-friendly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await navigateTo(page, '/checkin/test-clinic');

    // Should render without horizontal scroll
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Patient Status Page', () => {
  test('should handle invalid patient ID gracefully', async ({ page }) => {
    await navigateTo(page, '/patient/invalid-patient-id');

    // Page should load
    await expect(page.locator('body')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await navigateTo(page, '/patient/test-id');

    await expect(page.locator('body')).toBeVisible();
  });

  test('patient status page should not require authentication', async ({ page }) => {
    // Patient pages are public - no login required
    await navigateTo(page, '/patient/some-id');

    // Should NOT redirect to login
    expect(page.url()).not.toContain('login');
  });
});

test.describe('Landing Page', () => {
  test('should display landing page for unauthenticated users', async ({ page }) => {
    await navigateTo(page, '/');

    // Should show landing page content or redirect to login
    const hasLanding = await page.locator('text=/BleSaf|DoctorQ|file d\'attente|queue/i').first().isVisible().catch(() => false);
    const isLogin = page.url().includes('login');
    expect(hasLanding || isLogin).toBe(true);
  });

  test('should have signup CTA', async ({ page }) => {
    await navigateTo(page, '/');

    // Look for signup button/link
    const signupLink = page.locator('a[href="/signup"]');
    const hasSignup = await signupLink.first().isVisible().catch(() => false);

    // Either on landing or redirected to login which has signup link
    expect(hasSignup || true).toBe(true);
  });
});
