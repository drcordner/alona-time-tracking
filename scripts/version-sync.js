// version-sync.js - Synchronizes version numbers across project files
// Usage: node scripts/version-sync.js

import fs from 'fs';
import path from 'path';

console.log('🔄 Starting Version Synchronization...');

// Read version.json - the single source of truth
try {
    const versionData = JSON.parse(fs.readFileSync('version.json', 'utf8'));
    const versionNumber = versionData.versionNumber;
    const fullVersion = versionData.version;
    
    console.log(`📦 Found version: ${versionNumber} (${fullVersion})`);
    
    // Generate cache version string for service worker
    const cacheVersion = `v${versionNumber}-auto-version`;
    
    // 1. Update manifest.json version
    try {
        const manifestPath = 'manifest.json';
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        
        // Update version
        manifest.version = versionNumber;
        
        // Write updated manifest back
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        console.log(`✅ Updated ${manifestPath} to version ${versionNumber}`);
    } catch (error) {
        console.error(`❌ Error updating manifest.json: ${error.message}`);
    }
    
    // 2. Update service worker cache version
    try {
        const swPath = 'sw.js';
        let swContent = fs.readFileSync(swPath, 'utf8');
        
        // Use regex to update the CACHE_VERSION constant
        swContent = swContent.replace(
            /const CACHE_VERSION = ['"]v[\d\.]+[^'"]*['"]/,
            `const CACHE_VERSION = '${cacheVersion}'`
        );
        
        fs.writeFileSync(swPath, swContent);
        console.log(`✅ Updated service worker cache version to ${cacheVersion}`);
    } catch (error) {
        console.error(`❌ Error updating service worker: ${error.message}`);
    }
    
    console.log('🎉 Version synchronization complete!');
} catch (error) {
    console.error(`❌ Error reading version.json: ${error.message}`);
    process.exit(1);
} 