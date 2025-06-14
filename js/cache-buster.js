/**
 * Cache Buster - Elegant solution for dynamic resource loading
 * Eliminates hardcoded URLs and ensures fresh content delivery
 */
class CacheBuster {
    constructor() {
        this.isLocal = this.detectLocalEnvironment();
        this.buildTime = null;
        this.version = null;
        this.init();
    }

    detectLocalEnvironment() {
        const hostname = window.location.hostname;
        return hostname === 'localhost' || 
               hostname === '127.0.0.1' || 
               hostname.includes('192.168.') ||
               hostname.includes('10.0.') ||
               window.location.protocol === 'file:';
    }

    async init() {
        try {
            // Try to load version info
            const versionData = await this.loadVersionData();
            this.version = versionData.versionNumber;
            
            // For local development: always use current timestamp
            // For production: use version timestamp or current timestamp
            if (this.isLocal) {
                this.buildTime = Date.now();
                console.log('🔧 Local Development: Using live timestamp for cache busting');
            } else {
                // Use version timestamp if available, otherwise current time
                this.buildTime = versionData.timestamp ? 
                    new Date(versionData.timestamp).getTime() : 
                    Date.now();
                console.log(`🚀 Production: Using version ${this.version} timestamp for cache busting`);
            }
        } catch (error) {
            console.warn('Could not load version data, using current timestamp:', error);
            this.buildTime = Date.now();
        }
    }

    async loadVersionData() {
        const response = await fetch('version.json');
        if (!response.ok) throw new Error('Version data not available');
        return await response.json();
    }

    // Dynamically load CSS
    loadCSS(href) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = `${href}?v=${this.buildTime}`;
            link.onload = resolve;
            link.onerror = reject;
            document.head.appendChild(link);
        });
    }

    // Dynamically load JS
    loadJS(src, isModule = false) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `${src}?v=${this.buildTime}`;
            if (isModule) {
                script.type = 'module';
            }
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // For any other resources (images, manifest, etc.)
    bustCache(url) {
        return `${url}?v=${this.buildTime}`;
    }

    // Load all CSS files in parallel
    async loadAllCSS() {
        const cssFiles = [
            'css/main.css',
            'css/components.css',
            'css/timer.css',
            'css/management.css',
            'css/goals.css'
        ];

        console.log('📄 Loading CSS files with cache busting...');
        const promises = cssFiles.map(file => this.loadCSS(file));
        await Promise.all(promises);
        console.log('✅ All CSS files loaded successfully');
    }

    // Load all JS files in correct order
    async loadAllJS() {
        console.log('🔧 Loading JavaScript files with cache busting...');
        
        // Load core files first (in parallel) - all as modules
        await Promise.all([
            this.loadJS('js/utils.js', true),
            this.loadJS('js/data.js', true),
            this.loadJS('js/storage.js', true)
        ]);

        // Load feature modules (in parallel) - all as modules
        await Promise.all([
            this.loadJS('js/timer.js', true),
            this.loadJS('js/goals.js', true),
            this.loadJS('js/reports.js', true),
            this.loadJS('js/management.js', true),
            this.loadJS('js/quickstart.js', true),
            this.loadJS('js/ux-enhancements.js', true)
        ]);

        // Load main app last - as module
        await this.loadJS('js/app.js', true);
        
        console.log('✅ All JavaScript files loaded successfully');
        
        // Give app.js time to initialize and set global functions
        setTimeout(() => {
            this.initializeAppInstance();
        }, 100);
    }

    // Initialize the app instance and ensure global functions are available
    initializeAppInstance() {
        try {
            // Check if TimeTrackerApp is available globally
            if (typeof window.TimeTrackerApp !== 'undefined') {
                console.log('🎯 Initializing TimeTrackerApp...');
                window.app = new window.TimeTrackerApp();
                window.app.init().then(() => {
                    console.log('🎉 TimeTrackerApp initialized successfully!');
                    
                    // Verify global functions are available
                    const requiredFunctions = ['showScreen', 'goBack', 'showHelp', 'togglePause', 'stopTimer', 'setReportView', 'navigateDate'];
                    const missingFunctions = requiredFunctions.filter(fn => typeof window[fn] !== 'function');
                    
                    if (missingFunctions.length === 0) {
                        console.log('✅ All global functions are available');
                    } else {
                        console.error('❌ Missing global functions:', missingFunctions);
                    }
                }).catch(error => {
                    console.error('❌ Failed to initialize TimeTrackerApp:', error);
                });
            } else {
                console.error('❌ TimeTrackerApp class not found in global scope');
            }
        } catch (error) {
            console.error('❌ Error initializing app instance:', error);
        }
    }

    // Main initialization method
    async initializeApp() {
        try {
            // Wait for version/timestamp initialization
            while (this.buildTime === null) {
                await new Promise(resolve => setTimeout(resolve, 10));
            }

            // Load resources in parallel
            await Promise.all([
                this.loadAllCSS(),
                this.loadAllJS()
            ]);

            console.log(`🎉 App initialized successfully! Cache timestamp: ${this.buildTime}`);
            
            // Dispatch custom event to signal app is ready
            window.dispatchEvent(new CustomEvent('appResourcesLoaded', {
                detail: { 
                    buildTime: this.buildTime, 
                    version: this.version,
                    isLocal: this.isLocal 
                }
            }));

        } catch (error) {
            console.error('❌ Failed to initialize app:', error);
            
            // Show user-friendly error
            document.body.innerHTML = `
                <div style="padding: 20px; text-align: center; color: #e74c3c;">
                    <h2>Failed to Load Application</h2>
                    <p>Please refresh the page or check your internet connection.</p>
                    <button onclick="window.location.reload()" 
                            style="padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        Refresh Page
                    </button>
                </div>
            `;
        }
    }
}

// Initialize and start the app
const cacheBuster = new CacheBuster();

// Start app initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => cacheBuster.initializeApp());
} else {
    cacheBuster.initializeApp();
} 