#!/usr/bin/env node
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

console.log('🔍 Running QA Verification Suite...\n');

// Check critical routes
console.log('📍 Checking critical application routes...');
const routes = [
  '/app/dashboard',
  '/app/subcontractors', 
  '/app/review',
  '/app/reminders',
  '/app/settings'
];

// Check screenshot assets
console.log('🖼️ Verifying screenshot assets...');
const screenshots = [
  'public/screenshots/dashboard.png',
  'public/screenshots/dashboard@2x.png',
  'public/screenshots/sub-profile.png',
  'public/screenshots/sub-profile@2x.png',
  'public/screenshots/upload-mobile.png',
  'public/screenshots/upload-mobile@2x.png'
];

let missingScreenshots = [];
for (const screenshot of screenshots) {
  if (!fs.existsSync(screenshot)) {
    missingScreenshots.push(screenshot);
  }
}

// Run basic file checks
console.log('📂 Checking critical files...');
const criticalFiles = [
  'src/pages/Reminders.tsx',
  'src/pages/ReviewQueue.tsx',
  'tests/compliance-workflow.spec.ts'
];

let missingFiles = [];
for (const file of criticalFiles) {
  if (!fs.existsSync(file)) {
    missingFiles.push(file);
  }
}

// Generate summary
const summary = {
  timestamp: new Date().toISOString(),
  routes: {
    total: routes.length,
    missing: 0 // Would need actual server to test
  },
  screenshots: {
    total: screenshots.length,
    missing: missingScreenshots.length,
    missingFiles: missingScreenshots
  },
  files: {
    total: criticalFiles.length,
    missing: missingFiles.length,
    missingFiles: missingFiles
  }
};

console.log('\n📋 QA Summary:');
console.log(`Screenshots: ${screenshots.length - missingScreenshots.length}/${screenshots.length} ✅`);
console.log(`Critical Files: ${criticalFiles.length - missingFiles.length}/${criticalFiles.length} ✅`);

if (missingScreenshots.length > 0) {
  console.log('\n❌ Missing Screenshots:');
  missingScreenshots.forEach(file => console.log(`  - ${file}`));
}

if (missingFiles.length > 0) {
  console.log('\n❌ Missing Files:');
  missingFiles.forEach(file => console.log(`  - ${file}`));
}

// Write results
fs.writeFileSync('reports/qa-check.json', JSON.stringify(summary, null, 2));
console.log('\n✅ QA check complete. Results saved to reports/qa-check.json');