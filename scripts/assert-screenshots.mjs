import fs from "fs";

const files = [
  "public/screenshots/dashboard.png",
  "public/screenshots/dashboard@2x.png",
  "public/screenshots/sub-profile.png",
  "public/screenshots/sub-profile@2x.png",
  "public/screenshots/upload-mobile.png",
  "public/screenshots/upload-mobile@2x.png",
];

let ok = true;
for (const f of files) {
  if (!fs.existsSync(f)) { 
    console.error("MISSING:", f); 
    ok = false; 
    continue; 
  }
  const { size } = fs.statSync(f);
  if (size < 10 * 1024) { 
    console.error("TOO_SMALL (<10KB):", f); 
    ok = false; 
  }
}

if (!ok) {
  console.error("Screenshot validation failed. Run 'npm run gen:screens' to generate screenshots.");
  process.exit(1);
}

console.log("✓ All screenshots validated successfully");