import { test, expect } from '@playwright/test';

test.describe('Compliance Workflow E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to demo mode for consistent testing
    await page.goto('/demo');
    await page.waitForLoadState('networkidle');
  });

  test('Flags ändern → Pflichten entstehen/verschwinden', async ({ page }) => {
    // Navigate to subcontractor detail
    await page.click('[data-testid="subcontractor-card"]:first-child');
    await page.waitForSelector('[data-testid="compliance-flags"]');
    
    // Record initial requirement count
    const initialReqs = await page.locator('[data-testid="requirement-item"]').count();
    
    // Toggle a flag (e.g., has_non_eu_workers)
    await page.click('[data-testid="flag-has_non_eu_workers"] input');
    await page.click('[data-testid="save-flags"]');
    
    // Wait for compute requirements
    await page.click('[data-testid="compute-requirements"]');
    await page.waitForSelector('[data-testid="compute-result"]');
    
    // Verify requirement count changed
    const newReqs = await page.locator('[data-testid="requirement-item"]').count();
    expect(newReqs).not.toBe(initialReqs);
  });

  test('Missing→Upload→Review→Valid Workflow', async ({ page }) => {
    // Find a missing requirement
    await page.click('[data-testid="subcontractor-card"]:first-child');
    const missingReq = page.locator('[data-testid="requirement-item"][data-status="missing"]:first-child');
    await expect(missingReq).toBeVisible();
    
    // Upload document
    await missingReq.click('[data-testid="upload-document"]');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('./tests/fixtures/test-document.pdf');
    await page.click('[data-testid="submit-document"]');
    
    // Verify status changed to submitted
    await expect(missingReq).toHaveAttribute('data-status', 'submitted');
    
    // Navigate to review queue
    await page.goto('/app/review-queue');
    const reviewItem = page.locator('[data-testid="review-item"]:first-child');
    await expect(reviewItem).toBeVisible();
    
    // Approve document
    await reviewItem.click('[data-testid="review-button"]');
    await page.click('[data-testid="approve-document"]');
    await page.fill('[data-testid="review-comment"]', 'Document approved - meets requirements');
    await page.click('[data-testid="submit-review"]');
    
    // Verify status changed to valid
    await page.goto('/app/subcontractors');
    await page.click('[data-testid="subcontractor-card"]:first-child');
    await expect(missingReq).toHaveAttribute('data-status', 'valid');
  });

  test('Expiring/Expired per Datum', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/app/dashboard');
    
    // Check expiring count in KPI card
    const expiringCount = await page.locator('[data-testid="expiring-count"]').textContent();
    
    // Navigate to subcontractors list
    await page.goto('/app/subcontractors');
    
    // Count requirements with expiring status
    const expiringReqs = await page.locator('[data-status="expiring"]').count();
    
    // Verify dashboard KPI matches list count
    expect(parseInt(expiringCount || '0')).toBe(expiringReqs);
    
    // Test expired documents
    const expiredCount = await page.locator('[data-testid="expired-count"]').textContent();
    const expiredReqs = await page.locator('[data-status="expired"]').count();
    expect(parseInt(expiredCount || '0')).toBe(expiredReqs);
  });

  test('Aktiv/Inaktiv Status Toggle', async ({ page }) => {
    // Navigate to subcontractor detail
    await page.click('[data-testid="subcontractor-card"]:first-child');
    
    // Get initial status
    const statusToggle = page.locator('[data-testid="status-toggle"]');
    const initialStatus = await statusToggle.isChecked();
    
    // Toggle status
    await statusToggle.click();
    await page.waitForSelector('[data-testid="status-change-alert"]');
    
    // Verify status changed
    const newStatus = await statusToggle.isChecked();
    expect(newStatus).toBe(!initialStatus);
    
    // Verify dashboard reflects change
    await page.goto('/app/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Active subcontractors count should reflect the change
    const activeCount = await page.locator('[data-testid="active-subcontractors"]').textContent();
    expect(parseInt(activeCount || '0')).toBeGreaterThan(0);
  });

  test('"Prüfen" nur bei submitted|in_review', async ({ page }) => {
    await page.goto('/app/review-queue');
    
    // Verify review buttons only appear for submitted/in_review items
    const reviewItems = page.locator('[data-testid="review-item"]');
    const count = await reviewItems.count();
    
    for (let i = 0; i < count; i++) {
      const item = reviewItems.nth(i);
      const status = await item.getAttribute('data-status');
      const reviewButton = item.locator('[data-testid="review-button"]');
      
      if (status === 'submitted' || status === 'in_review') {
        await expect(reviewButton).toBeVisible();
      } else {
        await expect(reviewButton).not.toBeVisible();
      }
    }
  });

  test('KPI Dashboard ↔ Liste ↔ Datensatz 1:1', async ({ page }) => {
    // Get dashboard KPIs
    await page.goto('/app/dashboard');
    const totalSubs = await page.locator('[data-testid="total-subcontractors"]').textContent();
    const missingDocs = await page.locator('[data-testid="missing-count"]').textContent();
    const validDocs = await page.locator('[data-testid="valid-count"]').textContent();
    
    // Navigate to subcontractors list and verify counts match
    await page.goto('/app/subcontractors');
    const listItems = await page.locator('[data-testid="subcontractor-card"]').count();
    expect(listItems).toBe(parseInt(totalSubs || '0'));
    
    // Count missing requirements across all subcontractors
    let totalMissing = 0;
    let totalValid = 0;
    
    for (let i = 0; i < listItems; i++) {
      await page.locator('[data-testid="subcontractor-card"]').nth(i).click();
      await page.waitForSelector('[data-testid="requirement-item"]');
      
      const missing = await page.locator('[data-testid="requirement-item"][data-status="missing"]').count();
      const valid = await page.locator('[data-testid="requirement-item"][data-status="valid"]').count();
      
      totalMissing += missing;
      totalValid += valid;
      
      await page.goBack();
      await page.waitForLoadState('networkidle');
    }
    
    // Verify dashboard KPIs match aggregated counts
    expect(totalMissing).toBe(parseInt(missingDocs || '0'));
    expect(totalValid).toBe(parseInt(validDocs || '0'));
  });
});