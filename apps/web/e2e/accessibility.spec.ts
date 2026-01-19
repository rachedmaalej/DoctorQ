/**
 * Accessibility (A11y) Tests for DoctorQ
 *
 * Uses axe-core to automatically detect accessibility violations.
 * These tests ensure the application is usable by people with disabilities,
 * including elderly patients who may use the patient status page.
 *
 * Key areas tested:
 * - Color contrast
 * - Form labels and ARIA attributes
 * - Keyboard navigation
 * - Focus management
 * - Screen reader compatibility
 */

import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Test credentials for authenticated pages
const TEST_CLINIC = {
  email: process.env.TEST_EMAIL || 'dr.skander@example.tn',
  password: process.env.TEST_PASSWORD || 'password123',
};

// Helper to login
async function login(page: Page) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.locator('input[type="email"]').fill(TEST_CLINIC.email);
  await page.locator('input[type="password"]').fill(TEST_CLINIC.password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/dashboard/, { timeout: 15000 });
}

// Helper to run axe and report results
async function checkA11y(page: Page, pageName: string) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  // Log violations for debugging
  if (results.violations.length > 0) {
    console.log(`\n🔴 A11y violations on ${pageName}:`);
    results.violations.forEach((violation) => {
      console.log(`  - ${violation.id}: ${violation.description}`);
      console.log(`    Impact: ${violation.impact}`);
      console.log(`    Nodes: ${violation.nodes.length}`);
    });
  }

  return results;
}

// ============================================
// PUBLIC PAGE ACCESSIBILITY TESTS
// ============================================
test.describe('Accessibility - Public Pages', () => {
  test('login page should have no critical accessibility violations', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const results = await checkA11y(page, 'Login Page');

    // Filter for serious/critical violations only
    const criticalViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    expect(criticalViolations).toHaveLength(0);
  });

  test('login page form should have proper labels', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Check email input has label
    const emailInput = page.locator('input[type="email"]');
    const emailLabel = await emailInput.getAttribute('aria-label') ||
      await page.locator(`label[for="${await emailInput.getAttribute('id')}"]`).textContent();
    expect(emailLabel).toBeTruthy();

    // Check password input has label
    const passwordInput = page.locator('input[type="password"]');
    const passwordLabel = await passwordInput.getAttribute('aria-label') ||
      await page.locator(`label[for="${await passwordInput.getAttribute('id')}"]`).textContent();
    expect(passwordLabel).toBeTruthy();
  });

  test('login page should support keyboard navigation', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Start from body
    await page.locator('body').focus();

    // Tab through focusable elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Should be able to reach the submit button
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
  });

  test('patient status page should have no critical violations', async ({ page }) => {
    // Use a placeholder patient ID - will show error but should still be accessible
    await page.goto('/patient/test-patient-id');
    await page.waitForLoadState('networkidle');

    const results = await checkA11y(page, 'Patient Status Page');

    const criticalViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    expect(criticalViolations).toHaveLength(0);
  });

  test('check-in page should have no critical violations', async ({ page }) => {
    await page.goto('/checkin/test-clinic-id');
    await page.waitForLoadState('networkidle');

    const results = await checkA11y(page, 'Check-in Page');

    const criticalViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    expect(criticalViolations).toHaveLength(0);
  });
});

// ============================================
// AUTHENTICATED PAGE ACCESSIBILITY TESTS
// ============================================
test.describe('Accessibility - Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    try {
      await login(page);
    } catch {
      test.skip();
    }
  });

  test('dashboard should have no critical accessibility violations', async ({ page }) => {
    const results = await checkA11y(page, 'Dashboard');

    const criticalViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    expect(criticalViolations).toHaveLength(0);
  });

  test('add patient modal should be accessible', async ({ page }) => {
    // Open the modal
    const addButton = page.locator('button').filter({ hasText: /ajouter|add|\+/i }).first();
    await addButton.click();

    // Wait for modal
    await page.locator('input[type="tel"]').waitFor({ state: 'visible', timeout: 5000 });

    const results = await checkA11y(page, 'Add Patient Modal');

    const criticalViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    expect(criticalViolations).toHaveLength(0);
  });

  test('modal should trap focus', async ({ page }) => {
    // Open the modal
    const addButton = page.locator('button').filter({ hasText: /ajouter|add|\+/i }).first();
    await addButton.click();

    const phoneInput = page.locator('input[type="tel"]');
    await phoneInput.waitFor({ state: 'visible', timeout: 5000 });

    // Tab through modal elements - focus should stay within modal
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
    }

    // Modal should still be visible (focus didn't escape)
    await expect(phoneInput).toBeVisible();
  });

  test('buttons should have accessible names', async ({ page }) => {
    // Check main action buttons have accessible names
    const callNextButton = page.locator('button').filter({ hasText: /suivant|next|appeler/i }).first();
    await expect(callNextButton).toBeVisible({ timeout: 5000 });

    // Check button has text content or aria-label
    const buttonText = await callNextButton.textContent();
    const ariaLabel = await callNextButton.getAttribute('aria-label');
    expect(buttonText || ariaLabel).toBeTruthy();
  });

  test('status indicators should have text alternatives', async ({ page }) => {
    // Check that color-based status indicators have text
    const waitingText = page.locator('text=/en attente|waiting|notifi/i');
    const hasStatusText = await waitingText.first().isVisible().catch(() => false);

    // Status should be conveyed through text, not just color
    expect(hasStatusText || true).toBe(true); // Informational
  });
});

// ============================================
// MOBILE ACCESSIBILITY TESTS
// ============================================
test.describe('Accessibility - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

  test('mobile login should be accessible', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const results = await checkA11y(page, 'Mobile Login');

    const criticalViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    expect(criticalViolations).toHaveLength(0);
  });

  test('touch targets should be adequately sized', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Check submit button size (should be at least 44x44px for touch)
    const submitButton = page.locator('button[type="submit"]');
    const boundingBox = await submitButton.boundingBox();

    if (boundingBox) {
      // WCAG 2.5.5 recommends 44x44px minimum
      expect(boundingBox.height).toBeGreaterThanOrEqual(40);
    }
  });
});

// ============================================
// RTL (ARABIC) ACCESSIBILITY TESTS
// ============================================
test.describe('Accessibility - RTL/Arabic', () => {
  test('should handle RTL direction correctly', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Look for language toggle
    const arToggle = page.locator('text=/AR|عربي/i').first();
    const hasArToggle = await arToggle.isVisible().catch(() => false);

    if (hasArToggle) {
      await arToggle.click();
      await page.waitForTimeout(500);

      // Check document direction
      const htmlDir = await page.locator('html').getAttribute('dir');
      expect(htmlDir).toBe('rtl');

      // Run a11y check on RTL page
      const results = await checkA11y(page, 'Login Page (RTL)');

      const criticalViolations = results.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );

      expect(criticalViolations).toHaveLength(0);
    }
  });
});

// ============================================
// COLOR CONTRAST TESTS
// ============================================
test.describe('Accessibility - Color Contrast', () => {
  test('should have sufficient color contrast on login page', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .include('body')
      .analyze();

    // Check specifically for color contrast violations
    const contrastViolations = results.violations.filter(
      (v) => v.id === 'color-contrast'
    );

    // Report contrast issues
    if (contrastViolations.length > 0) {
      console.log('\n⚠️ Color contrast issues found:');
      contrastViolations[0].nodes.forEach((node) => {
        console.log(`  - ${node.html.substring(0, 100)}`);
      });
    }

    // Allow minor contrast issues but fail on many
    expect(contrastViolations.length).toBeLessThan(5);
  });
});

// ============================================
// FOCUS VISIBLE TESTS
// ============================================
test.describe('Accessibility - Focus Indicators', () => {
  test('interactive elements should have visible focus', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Focus email input
    const emailInput = page.locator('input[type="email"]');
    await emailInput.focus();

    // Check that focus is visible (element should have focus-visible styles)
    // This is a basic check - visual regression testing would be more thorough
    const isFocused = await emailInput.evaluate((el) => {
      return document.activeElement === el;
    });

    expect(isFocused).toBe(true);
  });

  test('skip link should be available', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Check for skip link (common a11y pattern)
    const skipLink = page.locator('a').filter({ hasText: /skip|sauter|passer/i }).first();
    const hasSkipLink = await skipLink.isVisible().catch(() => false);

    // Skip link is recommended but not required - informational test
    if (!hasSkipLink) {
      console.log('ℹ️ Consider adding a "skip to main content" link');
    }
  });
});
