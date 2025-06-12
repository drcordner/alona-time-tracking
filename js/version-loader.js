// Central version management - provides synchronous access with async updates
let _versionInfo = {
  version: "0.0.0-loading", // Full version with description
  versionNumber: "0.0.0",   // Numeric version only
  description: "Loading...",
  timestamp: new Date().toISOString()
};

// Initial load - executes immediately and updates version when complete
const versionPromise = fetch('version.json?' + Date.now())
  .then(response => response.json())
  .then(data => {
    _versionInfo = data;
    console.log(`📦 Version loaded: ${data.versionNumber}`);
    return data;
  })
  .catch(err => {
    console.error('Failed to load version data:', err);
    return _versionInfo;
  });

// Export synchronized getters
export const getVersionInfo = () => _versionInfo;
export const getVersionNumber = () => _versionInfo.versionNumber;
export const getFullVersion = () => _versionInfo.version;
export const getDescription = () => _versionInfo.description;
export const getCacheVersion = () => `v${_versionInfo.versionNumber}-${_versionInfo.description.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

// Wait for version to be fully loaded
export const versionLoaded = () => versionPromise; 