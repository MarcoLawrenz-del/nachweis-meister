// scripts/capture-screenshots.ts
import { chromium, devices } from '@playwright/test';

const BASE = process.env.SCREENSHOT_BASE_URL || 'https://nachweis-meister.lovable.app/demo';

async function run() {
  console.log('Starting screenshot capture...');
  const browser = await chromium.launch();
  
  const desktop = await browser.newContext({ 
    viewport: { width: 1440, height: 900 }
  });
  
  const mobile = await browser.newContext({ 
    ...devices['iPhone 13'] 
  });

  try {
    // 1) Dashboard (Desktop)
    console.log('Capturing dashboard screenshot...');
    const d = await desktop.newPage();
    await d.goto(`${BASE}?screenshot=1`, { waitUntil: 'networkidle' });
    await d.screenshot({ 
      path: 'public/screenshots/dashboard.png', 
      fullPage: false 
    });
    await d.screenshot({ 
      path: 'public/screenshots/dashboard@2x.png', 
      deviceScaleFactor: 2 
    });

    // 2) Nachunternehmer-Profil (Desktop)
    console.log('Capturing subcontractor profile screenshot...');
    await d.click('text=Nachunternehmer').catch(() => {
      console.log('Nachunternehmer tab not found, continuing...');
    });
    
    // Try to find and click first active subcontractor
    await d.click('[data-testid="sub-row"], .subcontractor-row, text="Aktiv"').catch(() => {
      console.log('Subcontractor row not found, using current page...');
    });
    
    await d.waitForLoadState('networkidle');
    await d.screenshot({ 
      path: 'public/screenshots/sub-profile.png' 
    });
    await d.screenshot({ 
      path: 'public/screenshots/sub-profile@2x.png', 
      deviceScaleFactor: 2 
    });

    // 3) Public Upload (Mobile)
    console.log('Capturing mobile upload screenshot...');
    const m = await mobile.newPage();
    await m.goto(`${BASE}/upload?screenshot=1`, { waitUntil: 'networkidle' });
    await m.screenshot({ 
      path: 'public/screenshots/upload-mobile.png' 
    });
    await m.screenshot({ 
      path: 'public/screenshots/upload-mobile@2x.png', 
      deviceScaleFactor: 2 
    });

    console.log('Screenshots captured successfully!');
  } catch (error) {
    console.error('Error capturing screenshots:', error);
  } finally {
    await browser.close();
  }
}

run().catch(console.error);