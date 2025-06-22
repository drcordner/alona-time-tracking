// Simple Test Runner for Time Tracker
// Run with: node test-runner.js

import fs from 'fs';
import path from 'path';

class TestRunner {
    constructor() {
        this.tests = [];
        this.results = {
            passed: 0,
            failed: 0,
            total: 0
        };
    }
    
    // Add a test
    test(name, testFunction) {
        this.tests.push({ name, testFunction });
    }
    
    // Run all tests
    async run() {
        console.log('🧪 Running Time Tracker Tests...\n');
        
        for (const test of this.tests) {
            this.results.total++;
            try {
                await test.testFunction();
                console.log(`✅ ${test.name}`);
                this.results.passed++;
            } catch (error) {
                console.log(`❌ ${test.name}`);
                console.log(`   Error: ${error.message}\n`);
                this.results.failed++;
            }
        }
        
        // Summary
        console.log('\n📊 Test Results:');
        console.log(`   Passed: ${this.results.passed}`);
        console.log(`   Failed: ${this.results.failed}`);
        console.log(`   Total: ${this.results.total}`);
        
        if (this.results.failed > 0) {
            process.exit(1);
        }
    }
    
    // Assertion helpers
    assertEqual(actual, expected, message = '') {
        if (actual !== expected) {
            throw new Error(`${message} - Expected: ${expected}, Actual: ${actual}`);
        }
    }
    
    assertTrue(condition, message = '') {
        if (!condition) {
            throw new Error(message || 'Condition was false');
        }
    }
    
    // File reading helper
    readFile(filePath) {
        try {
            return fs.readFileSync(filePath, 'utf8');
        } catch (error) {
            throw new Error(`Could not read file ${filePath}: ${error.message}`);
        }
    }
    
    // JSON reading helper
    readJSON(filePath) {
        try {
            const content = this.readFile(filePath);
            return JSON.parse(content);
        } catch (error) {
            throw new Error(`Could not parse JSON from ${filePath}: ${error.message}`);
        }
    }
}

// Create test runner instance
const runner = new TestRunner();

// VERSION CONSISTENCY TESTS
runner.test('version.json exists and is valid', async () => {
    const versionData = runner.readJSON('version.json');
    runner.assertTrue(versionData.version, 'Version field exists');
    runner.assertTrue(versionData.versionNumber, 'Version number field exists');
    runner.assertTrue(versionData.timestamp, 'Timestamp field exists');
});

runner.test('package.json version matches version.json', async () => {
    const versionData = runner.readJSON('version.json');
    const packageData = runner.readJSON('package.json');
    runner.assertEqual(packageData.version, versionData.versionNumber, 'Package version should match version.json');
});

runner.test('manifest.json version matches version.json', async () => {
    const versionData = runner.readJSON('version.json');
    const manifestData = runner.readJSON('manifest.json');
    runner.assertEqual(manifestData.version, versionData.versionNumber, 'Manifest version should match version.json');
});

runner.test('service worker cache version contains correct version number', async () => {
    const versionData = runner.readJSON('version.json');
    const swContent = runner.readFile('sw.js');
    
    // Extract CACHE_VERSION value using regex
    const cacheVersionMatch = swContent.match(/const CACHE_VERSION = ['"]([^'"]+)['"]/);
    runner.assertTrue(cacheVersionMatch && cacheVersionMatch[1], 'CACHE_VERSION should be defined in sw.js');
    
    const cacheVersion = cacheVersionMatch[1];
    runner.assertTrue(
        cacheVersion.includes(versionData.versionNumber),
        `Cache version (${cacheVersion}) should include version number (${versionData.versionNumber})`
    );
});

runner.test('HTML version references match version.json', async () => {
    const versionData = runner.readJSON('version.json');
    const htmlContent = runner.readFile('index.html');
    
    // Extract version number (e.g., "5.2.5" from "5.2.5 - Description")
    const versionNumber = versionData.versionNumber;
    
    // Check all v= references in HTML
    const versionMatches = htmlContent.match(/v=(\d+\.\d+\.\d+)/g);
    if (versionMatches) {
        versionMatches.forEach(match => {
            const htmlVersion = match.replace('v=', '');
            runner.assertEqual(htmlVersion, versionNumber, `HTML version ${match} should match version.json`);
        });
    }
});

runner.test('No hardcoded versions in JS files (except fallbacks)', async () => {
    const jsFiles = ['js/app.js', 'js/storage.js', 'js/timer.js', 'js/goals.js'];
    
    for (const file of jsFiles) {
        try {
            const content = runner.readFile(file);
            
            // Look for version patterns that should not exist in these files
            const badPatterns = [
                /v=\d+\.\d+\.\d+/g,  // HTML-style version references in JS
                /version.*:\s*["']\d+\.\d+\.\d+/g  // Direct version assignments
            ];
            
            badPatterns.forEach(pattern => {
                const matches = content.match(pattern);
                if (matches) {
                    throw new Error(`Found hardcoded version in ${file}: ${matches.join(', ')}`);
                }
            });
        } catch (error) {
            if (error.message.includes('Could not read file')) {
                continue; // File doesn't exist, skip
            }
            throw error;
        }
    }
    
    // For management.js, just check that fallback versions are reasonable
    try {
        const managementContent = runner.readFile('js/management.js');
        const versionData = runner.readJSON('version.json');
        
        // Check that fallback versions in management.js are current
        const fallbackMatches = managementContent.match(/version:\s*"([^"]+)"/g);
        if (fallbackMatches) {
            fallbackMatches.forEach(match => {
                const version = match.match(/"([^"]+)"/)[1];
                if (!version.startsWith(versionData.versionNumber)) {
                    throw new Error(`Fallback version in management.js is outdated: ${version}, should start with ${versionData.versionNumber}`);
                }
            });
        }
    } catch (error) {
        if (!error.message.includes('Could not read file')) {
            throw error;
        }
    }
});

// FILE STRUCTURE TESTS
runner.test('Required files exist', async () => {
    const requiredFiles = [
        'index.html',
        'version.json',
        '.cursorrules',
        'js/app.js',
        'js/management.js',
        'css/components.css',
        'docs/lessons_learned.md'
    ];
    
    requiredFiles.forEach(file => {
        runner.assertTrue(fs.existsSync(file), `Required file ${file} exists`);
    });
});

// BASIC SYNTAX TESTS
runner.test('JSON files are valid', async () => {
    const jsonFiles = ['version.json', 'manifest.json'];
    
    jsonFiles.forEach(file => {
        if (fs.existsSync(file)) {
            runner.readJSON(file); // Will throw if invalid JSON
        }
    });
});

runner.test('CSS files have no obvious syntax errors', async () => {
    const cssFiles = ['css/main.css', 'css/components.css', 'css/management.css'];
    
    cssFiles.forEach(file => {
        if (fs.existsSync(file)) {
            const content = runner.readFile(file);
            
            // Basic CSS syntax checks
            const openBraces = (content.match(/{/g) || []).length;
            const closeBraces = (content.match(/}/g) || []).length;
            
            runner.assertEqual(openBraces, closeBraces, `CSS braces balanced in ${file}`);
        }
    });
});

// CURSOR RULES COMPLIANCE TESTS
runner.test('Cursor rules file exists and has version management section', async () => {
    const cursorrules = runner.readFile('.cursorrules');
    
    runner.assertTrue(cursorrules.includes('Version Management'), 'Cursor rules contain version management section');
    runner.assertTrue(cursorrules.includes('version numbers must be consistent'), 'Cursor rules emphasize version consistency');
});

runner.test('Rule system consistency between .cursorrules and .mdc files', async () => {
    const cursorrules = runner.readFile('.cursorrules');
    const versionConsistency = runner.readFile('.cursor/rules/version-consistency.mdc');
    const coreContext = runner.readFile('.cursor/rules/core-context.mdc');
    
    // Check that version management concepts are consistent
    runner.assertTrue(
        cursorrules.includes('version numbers must be consistent') && 
        versionConsistency.includes('Critical Version Management'),
        'Version management concepts are consistent between rule systems'
    );
    
    // Check that documentation process concepts are consistent
    runner.assertTrue(
        cursorrules.includes('Documentation Process') && 
        coreContext.includes('Documentation Maintenance Priority'),
        'Documentation process concepts are consistent between rule systems'
    );
    
    // Check that deployment concepts are consistent
    runner.assertTrue(
        cursorrules.includes('Deployment Rules') && 
        coreContext.includes('Deployment'),
        'Deployment concepts are consistent between rule systems'
    );
    
    // Check that rule maintenance file exists
    runner.assertTrue(fs.existsSync('.cursor/rules/rule-maintenance.mdc'), 'Rule maintenance documentation exists');
});

runner.test('Server integration rules exist', async () => {
    const cursorrules = runner.readFile('.cursorrules');
    runner.assertTrue(cursorrules.includes('Server Configuration'), 'Cursor rules contain server configuration section');
    runner.assertTrue(
        fs.existsSync('.cursor/rules/server-integration.mdc'),
        'Server integration documentation exists'
    );
});

runner.test('service worker version matches app version', async () => {
    const versionData = runner.readJSON('version.json');
    const swContent = runner.readFile('sw.js');
    const cacheVersionMatch = swContent.match(/const CACHE_VERSION = ['"]([^'"]+)['"]/);
    runner.assertTrue(
        cacheVersionMatch && cacheVersionMatch[1].includes(versionData.versionNumber),
        'Service worker cache version should match app version'
    );
});

// Run all tests
runner.run().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
}); 