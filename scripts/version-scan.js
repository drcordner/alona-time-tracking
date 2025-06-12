// version-scan.js - Scans the codebase for potential hard-coded version numbers
// Usage: node scripts/version-scan.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load version.json to know current version
let currentVersion;
try {
    const versionData = JSON.parse(fs.readFileSync(path.join(rootDir, 'version.json'), 'utf8'));
    currentVersion = versionData.versionNumber;
    console.log(`🔍 Scanning for hard-coded references to version ${currentVersion} or older versions...`);
} catch (error) {
    console.error('Error reading version.json:', error.message);
    process.exit(1);
}

// Files to exclude from scanning
const excludeDirs = [
    'node_modules',
    '.git',
    '.cursor'
];

// Files we expect to have version numbers
const expectedFiles = [
    'version.json',
    'package.json',
    'manifest.json',
    'README.md',
    'RELEASE_NOTES.md',
    'version-loader.js',
    'version-sync.js',
    'version-scan.js',
    '.cursorrules',
    'test-runner.js'
];

// Patterns to look for (version numbers)
const versionPatterns = [
    // Match version numbers like 5.3.3, v5.3.3, "5.3.3", '5.3.3'
    /[v"]?\d+\.\d+\.\d+["']/g,
    // Match version with descriptions like "5.3.3 - Description"
    /[v"]?\d+\.\d+\.\d+\s+-\s+[^"'\n]+["']/g
];

// Find all files recursively in a directory
function getAllFiles(dir) {
    const files = [];
    
    fs.readdirSync(dir).forEach(file => {
        const filePath = path.join(dir, file);
        const relativePath = path.relative(rootDir, filePath);
        
        // Skip excluded directories
        if (excludeDirs.some(excluded => relativePath.startsWith(excluded))) {
            return;
        }
        
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            // Recursively scan subdirectories
            files.push(...getAllFiles(filePath));
        } else if (stat.isFile()) {
            // Check if it's a text file we care about
            if (filePath.match(/\.(js|json|html|css|md|txt)$/i)) {
                files.push(relativePath);
            }
        }
    });
    
    return files;
}

// Scan a file for version patterns
function scanFile(filePath) {
    // Skip expected files
    const basename = path.basename(filePath);
    if (expectedFiles.includes(basename)) {
        return null;
    }
    
    try {
        const content = fs.readFileSync(path.join(rootDir, filePath), 'utf8');
        const findings = [];
        
        // Check each pattern
        versionPatterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    // Extract just the version number for comparison
                    const versionMatch = match.match(/\d+\.\d+\.\d+/);
                    if (versionMatch && versionMatch[0]) {
                        findings.push({
                            version: versionMatch[0],
                            context: match,
                            line: findLineNumber(content, match)
                        });
                    }
                });
            }
        });
        
        return findings.length ? { filePath, findings } : null;
        
    } catch (error) {
        console.error(`Error scanning ${filePath}:`, error.message);
        return null;
    }
}

// Find line number for a string in content
function findLineNumber(content, searchString) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(searchString)) {
            return i + 1;
        }
    }
    return -1;
}

// Main execution
const files = getAllFiles(rootDir);
console.log(`Found ${files.length} files to scan.`);

let results = [];
let potentialIssues = 0;

files.forEach(file => {
    const scanResult = scanFile(file);
    if (scanResult) {
        results.push(scanResult);
        potentialIssues += scanResult.findings.length;
    }
});

// Output results
console.log('\n🔎 SCAN RESULTS:');
console.log(`Scanned ${files.length} files.`);
console.log(`Found ${potentialIssues} potential hard-coded version numbers in ${results.length} files.\n`);

if (results.length > 0) {
    results.forEach(result => {
        console.log(`\x1b[1m${result.filePath}\x1b[0m:`);
        result.findings.forEach(finding => {
            console.log(`  Line ${finding.line}: \x1b[33m${finding.context}\x1b[0m (version: ${finding.version})`);
        });
        console.log('');
    });
    
    console.log('\x1b[33mNOTE: Not all findings are necessarily issues. Review each case to determine if it needs to use the centralized version system.\x1b[0m');
    console.log('\x1b[33mExpected version-specific files like version.json, package.json, etc. are automatically excluded.\x1b[0m\n');
} else {
    console.log('\x1b[32mNo potential issues found! All files appear to be using the centralized version system.\x1b[0m\n');
} 