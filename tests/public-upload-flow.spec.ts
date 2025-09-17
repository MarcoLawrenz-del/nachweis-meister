import { test, expect } from '@playwright/test';

test.describe('Public Upload Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Setup demo data if needed
    await page.goto('/demo');
    await page.waitForLoadState('networkidle');
  });

  test('Magic Link to Upload Flow', async ({ page }) => {
    // Test navigation from magic link to upload page
    const token = 'demo-token-123'; // Use demo token
    
    // Navigate to magic link wizard
    await page.goto(`/invite/${token}`);
    await page.waitForLoadState('networkidle');
    
    // Should redirect to upload page after validation
    await expect(page).toHaveURL(`/upload/${token}`);
    
    // Check if upload form is visible
    await expect(page.locator('[data-testid="upload-form"]')).toBeVisible();
    
    // Check if required documents section is shown
    await expect(page.locator('text=Pflichtnachweise')).toBeVisible();
    
    // Test file upload for first required document
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'test-document.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('test pdf content')
    });
    
    // Wait for upload completion
    await page.waitForSelector('text=Upload erfolgreich', { timeout: 10000 });
    
    // Verify success state
    await expect(page.locator('text=Upload erfolgreich')).toBeVisible();
  });

  test('Review Start to Approve Flow', async ({ page, context }) => {
    // Login as reviewer
    await page.goto('/login');
    await page.fill('[name="email"]', 'reviewer@demo.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // Navigate to review queue
    await page.goto('/app/review');
    await page.waitForLoadState('networkidle');
    
    // Find first submitted requirement and start review
    const startButton = page.locator('button:has-text("Prüfung starten")').first();
    if (await startButton.isVisible()) {
      await startButton.click();
      
      // Wait for status change to in_review
      await expect(page.locator('text=In Prüfung')).toBeVisible();
      
      // Approve the document
      const approveButton = page.locator('button:has-text("Genehmigen")').first();
      await approveButton.click();
      
      // Confirm approval
      await page.locator('button:has-text("Bestätigen")').click();
      
      // Wait for success message
      await expect(page.locator('text=Prüfung abgeschlossen')).toBeVisible();
    }
  });

  test('Reject and Re-Upload Flow', async ({ page }) => {
    // Login as reviewer
    await page.goto('/login');
    await page.fill('[name="email"]', 'reviewer@demo.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // Navigate to review queue
    await page.goto('/app/review');
    await page.waitForLoadState('networkidle');
    
    // Start review if needed
    const startButton = page.locator('button:has-text("Prüfung starten")').first();
    if (await startButton.isVisible()) {
      await startButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Reject document
    const rejectButton = page.locator('button:has-text("Ablehnen")').first();
    if (await rejectButton.isVisible()) {
      await rejectButton.click();
      
      // Fill rejection reason
      await page.fill('[name="reason"]', 'Dokument nicht lesbar');
      await page.click('button:has-text("Ablehnen")');
      
      // Wait for rejection confirmation
      await expect(page.locator('text=abgelehnt')).toBeVisible();
    }
    
    // Simulate subcontractor re-upload
    const token = 'demo-token-123';
    await page.goto(`/upload/${token}`);
    await page.waitForLoadState('networkidle');
    
    // Check if rejected document is shown for re-upload
    await expect(page.locator('text=Nachbesserung')).toBeVisible();
    
    // Upload replacement file
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'corrected-document.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('corrected pdf content')
    });
    
    // Wait for upload completion
    await page.waitForSelector('text=Upload erfolgreich', { timeout: 10000 });
  });

  test('Progress Persistence', async ({ page }) => {
    const token = 'demo-token-123';
    
    // First visit - upload one document
    await page.goto(`/upload/${token}`);
    await page.waitForLoadState('networkidle');
    
    // Upload first document
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'first-document.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('first document content')
    });
    
    await page.waitForSelector('text=Upload erfolgreich', { timeout: 10000 });
    
    // Reload page to test persistence
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Check if progress is shown correctly
    const progressText = page.locator('text=1 von');
    await expect(progressText).toBeVisible();
    
    // Check if completed document shows checkmark
    await expect(page.locator('[data-testid="completed-document"]')).toBeVisible();
  });
});