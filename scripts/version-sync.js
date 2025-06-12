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
    
    // Update timestamp to current time
    versionData.timestamp = new Date().toISOString();
    
    // Write updated version.json back
    fs.writeFileSync('version.json', JSON.stringify(versionData, null, 4));
    console.log(`✅ Updated version.json timestamp to ${versionData.timestamp}`);
    
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
    
    // 2. Update service worker from template
    const updateServiceWorker = (versionNumber) => {
        const swTemplatePath = 'sw-template.js';
        const swPath = 'sw.js';
        
        try {
            // Read template
            let swContent = fs.readFileSync(swTemplatePath, 'utf8');
            
            // Generate cache version string
            const cacheVersion = `v${versionNumber}-auto-version`;
            
            // Replace placeholder with actual version
            swContent = swContent.replace('{{CACHE_VERSION}}', cacheVersion);
            
            // Write to actual service worker file
            fs.writeFileSync(swPath, swContent);
            console.log(`✅ Updated service worker to version ${versionNumber}`);
        } catch (error) {
            console.error(`❌ Error updating service worker: ${error.message}`);
        }
    };

    // Add to main sync function
    updateServiceWorker(versionNumber);
    
    console.log('🎉 Version synchronization complete!');
} catch (error) {
    console.error(`❌ Error reading version.json: ${error.message}`);
    process.exit(1);
} 