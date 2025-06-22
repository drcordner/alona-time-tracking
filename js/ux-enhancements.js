// UX Enhancements Module
import { getVersionInfo, getVersionNumber, getFullVersion } from './version-loader.js';

export class UXEnhancements {
    constructor(app) {
        this.app = app;
        this.isLoading = false;
        this.keyboardShortcutsEnabled = true;
        this.touchDevice = 'ontouchstart' in window;
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        this.init();
    }

    init() {
        this.setupKeyboardShortcuts();
        this.setupAccessibility();
        this.setupTouchInteractions();
        this.setupLoadingStates();
        this.setupPerformanceOptimizations();
        this.setupProgressiveEnhancement();
    }

    // Keyboard Shortcuts
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (!this.keyboardShortcutsEnabled) return;
            
            // Don't trigger shortcuts when typing in inputs
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                this.handleInputKeyboard(e);
                return;
            }

            switch (e.code) {
                case 'Space':
                    e.preventDefault();
                    this.handleSpaceKey();
                    break;
                case 'Escape':
                    this.handleEscapeKey();
                    break;
                case 'ArrowUp':
                case 'ArrowDown':
                case 'ArrowLeft':
                case 'ArrowRight':
                    this.handleArrowKeys(e);
                    break;
                case 'KeyR':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.showReports();
                    }
                    break;
                case 'KeyH':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.showHome();
                    }
                    break;
                case 'KeyM':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.showManagement();
                    }
                    break;
                case 'Slash':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.showKeyboardShortcuts();
                    }
                    break;
            }
        });

        // Add keyboard hints to buttons
        this.addKeyboardHints();
    }

    handleInputKeyboard(e) {
        // Enhanced input handling
        if (e.code === 'Enter' && e.target.form) {
            e.target.form.dispatchEvent(new Event('submit'));
        }
        if (e.code === 'Escape') {
            e.target.blur();
        }
    }

    handleSpaceKey() {
        if (this.app.timer && this.app.timer.timerInterval) {
            // Timer is running - pause/resume or stop
            if (this.app.timer.isPaused) {
                this.app.timer.togglePause();
                this.showToast('Timer resumed ▶️', 'success');
            } else {
                this.app.timer.togglePause();
                this.showToast('Timer paused ⏸️', 'info');
            }
        } else if (this.app.currentScreen === 'home') {
            // Start quick activity or show activity selection
            this.startQuickActivity();
        }
    }

    handleEscapeKey() {
        // Close modals
        const modal = document.querySelector('.modal-overlay');
        if (modal) {
            modal.click();
            return;
        }

        // Go back or stop timer
        if (this.app.timer && this.app.timer.timerInterval) {
            if (confirm('Stop current timer?')) {
                this.app.timer.stopTimer();
                this.showToast('Timer stopped', 'info');
            }
        } else {
            this.app.goBack();
        }
    }

    handleArrowKeys(e) {
        const currentScreen = this.app.currentScreen;
        
        if (currentScreen === 'reports') {
            e.preventDefault();
            if (e.code === 'ArrowLeft') {
                this.app.reports.navigateDate(-1);
            } else if (e.code === 'ArrowRight') {
                this.app.reports.navigateDate(1);
            }
        }
    }

    startQuickActivity() {
        const quickStartButtons = document.querySelectorAll('.quick-start-button');
        if (quickStartButtons.length > 0) {
            quickStartButtons[0].click();
        } else {
            this.showToast('Add some activities first to enable quick start', 'info');
        }
    }

    showReports() {
        if (this.app.showScreen) {
            this.app.showScreen('reports');
        }
    }

    showHome() {
        if (this.app.showScreen) {
            this.app.showScreen('home');
        }
    }

    showManagement() {
        if (this.app.showScreen) {
            this.app.showScreen('management');
        }
    }

    addKeyboardHints() {
        // Keyboard hints disabled by default for better mobile experience
        // Users can access shortcuts via help menu
        return;
        
        // Add hints to relevant elements
        setTimeout(() => {
            this.addHintToElement('.nav-button[onclick*="reports"]', 'Ctrl+R');
            this.addHintToElement('.nav-button[onclick*="home"]', 'Ctrl+H');
            this.addHintToElement('#pause-button', 'Space to pause/resume');
            this.addHintToElement('.stop-button', 'Esc to stop');
        }, 1000);
    }

    addHintToElement(selector, hint) {
        const element = document.querySelector(selector);
        if (element) {
            const hintEl = document.createElement('div');
            hintEl.className = 'keyboard-hint';
            hintEl.innerHTML = `<span class="kbd">${hint}</span>`;
            hintEl.style.fontSize = '0.7em';
            hintEl.style.opacity = '0.7';
            hintEl.style.marginTop = '4px';
            element.appendChild(hintEl);
        }
    }

    showKeyboardShortcuts() {
        this.showHelp();
    }

    showHelp() {
        // Remove existing help modal if present
        const existingModal = document.querySelector('.help-modal');
        if (existingModal) {
            existingModal.remove();
            return;
        }

        // Get current version from central version-loader
        const versionInfo = getVersionInfo();
        const currentVersion = getFullVersion();
        const versionNumber = getVersionNumber();

        const helpContent = `
            <div class="help-modal modal-overlay fade-in" onclick="this.remove()">
                <div class="help-content modal-content" onclick="event.stopPropagation()">
                    <div class="help-header modal-header">
                        <h2>💡 Quick Help</h2>
                        <button class="modal-close" onclick="this.closest('.help-modal').remove()">✕</button>
                    </div>
                    
                    <div class="help-body">
                        <!-- Quick Start -->
                        <div class="help-section">
                            <h4>🚀 Get Started</h4>
                            <div class="quick-steps">
                                <div class="step">
                                    <div class="step-number">1</div>
                                    <div class="step-content">
                                        <strong>Start Tracking</strong>
                                        <p>Click any activity from Quick Start or browse categories</p>
                                    </div>
                                </div>
                                <div class="step">
                                    <div class="step-number">2</div>
                                    <div class="step-content">
                                        <strong>Control Timer</strong>
                                        <p>Use Pause/Resume and Stop buttons, or press <kbd>Space</kbd></p>
                                    </div>
                                </div>
                                <div class="step">
                                    <div class="step-number">3</div>
                                    <div class="step-content">
                                        <strong>Set Goals</strong>
                                        <p>Go to Management → Edit any category to set time goals</p>
                                    </div>
                                </div>
                                <div class="step">
                                    <div class="step-number">4</div>
                                    <div class="step-content">
                                        <strong>View Reports</strong>
                                        <p>Check Reports tab for analytics and insights</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Essential Shortcuts -->
                        <div class="help-section">
                            <h4>⌨️ Essential Shortcuts</h4>
                            <div class="shortcuts-grid">
                                <div class="shortcut-item">
                                    <kbd>Space</kbd>
                                    <span>Start/Pause/Resume Timer</span>
                                </div>
                                <div class="shortcut-item">
                                    <kbd>Escape</kbd>
                                    <span>Stop Timer / Go Back</span>
                                </div>
                                <div class="shortcut-item">
                                    <kbd>Ctrl</kbd> + <kbd>R</kbd>
                                    <span>Go to Reports</span>
                                </div>
                                <div class="shortcut-item">
                                    <kbd>Ctrl</kbd> + <kbd>M</kbd>
                                    <span>Go to Management</span>
                                </div>
                            </div>
                        </div>

                        <!-- Key Features -->
                        <div class="help-section">
                            <h4>🌟 Key Features</h4>
                            <div class="features-grid">
                                <div class="feature-card">
                                    <div class="feature-icon">⏱️</div>
                                    <div class="feature-text">
                                        <strong>Smart Timer</strong>
                                        <p>One-click start with pause tracking</p>
                                    </div>
                                </div>
                                <div class="feature-card">
                                    <div class="feature-icon">🎯</div>
                                    <div class="feature-text">
                                        <strong>Goals & Streaks</strong>
                                        <p>Set targets and track achievements</p>
                                    </div>
                                </div>
                                <div class="feature-card">
                                    <div class="feature-icon">📊</div>
                                    <div class="feature-text">
                                        <strong>Analytics</strong>
                                        <p>Interactive charts and insights</p>
                                    </div>
                                </div>
                                <div class="feature-card">
                                    <div class="feature-icon">✏️</div>
                                    <div class="feature-text">
                                        <strong>Edit Sessions</strong>
                                        <p>Fix mistakes in timeline view</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Pro Tips -->
                        <div class="help-section">
                            <h4>💡 Pro Tips</h4>
                            <div class="tips-list">
                                <div class="tip">
                                    <strong>Fix Mistakes:</strong> Go to Reports → Timeline and click ✏️ to edit any session
                                </div>
                                <div class="tip">
                                    <strong>Quick Start:</strong> The more you use the app, the better your personalized suggestions become
                                </div>
                                <div class="tip">
                                    <strong>Data Backup:</strong> Management → Settings → Export Data to backup your tracking
                                </div>
                                <div class="tip">
                                    <strong>Offline Mode:</strong> Works without internet after first load
                                </div>
                            </div>
                        </div>

                        <!-- Version Info -->
                        <div class="help-section version-info">
                            <div class="version-badge">
                                <span class="version-label">v${versionNumber}</span>
                            </div>
                            <p class="version-description">
                                ${versionInfo ? versionInfo.description : 'Time tracking with goals and analytics'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', helpContent);
    }

    // Accessibility Enhancements
    setupAccessibility() {
        // Add skip link
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.className = 'skip-link';
        skipLink.textContent = 'Skip to main content';
        document.body.prepend(skipLink);

        // Add main content landmark
        const container = document.querySelector('.container');
        if (container) {
            container.id = 'main-content';
            container.setAttribute('role', 'main');
        }

        // Enhance focus management
        this.setupFocusManagement();

        // Add ARIA labels
        this.addAriaLabels();

        // Announce dynamic content changes
        this.setupLiveRegions();
    }

    setupFocusManagement() {
        // Track focus for better keyboard navigation
        let focusedElement = null;
        
        document.addEventListener('focusin', (e) => {
            focusedElement = e.target;
        });

        // Restore focus when returning to screens
        this.restoreFocus = () => {
            if (focusedElement && document.contains(focusedElement)) {
                setTimeout(() => focusedElement.focus(), 100);
            }
        };
    }

    addAriaLabels() {
        setTimeout(() => {
            // Add labels to buttons without text
            const buttons = document.querySelectorAll('button:not([aria-label])');
            buttons.forEach(btn => {
                const text = btn.textContent.trim();
                if (!text && btn.innerHTML.includes('svg')) {
                    // This is likely an icon button
                    if (btn.onclick) {
                        const onclick = btn.onclick.toString();
                        if (onclick.includes('goBack')) btn.setAttribute('aria-label', 'Go back');
                        if (onclick.includes('home')) btn.setAttribute('aria-label', 'Home');
                        if (onclick.includes('reports')) btn.setAttribute('aria-label', 'Reports');
                    }
                }
            });

            // Add role to navigation
            const navigation = document.querySelector('.navigation');
            if (navigation) {
                navigation.setAttribute('role', 'navigation');
                navigation.setAttribute('aria-label', 'Main navigation');
            }

            // Add role to timers
            const timerDisplay = document.getElementById('timer-display');
            if (timerDisplay) {
                timerDisplay.setAttribute('role', 'timer');
                timerDisplay.setAttribute('aria-live', 'polite');
                timerDisplay.setAttribute('aria-label', 'Current session time');
            }
        }, 1000);
    }

    setupLiveRegions() {
        // Create live region for announcements
        const liveRegion = document.createElement('div');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only';
        liveRegion.id = 'live-region';
        document.body.appendChild(liveRegion);
    }

    announceToScreenReader(message) {
        const liveRegion = document.getElementById('live-region');
        if (liveRegion) {
            liveRegion.textContent = message;
            setTimeout(() => liveRegion.textContent = '', 1000);
        }
    }

    // Touch Interactions
    setupTouchInteractions() {
        if (!this.touchDevice) return;

        // Add touch feedback class to interactive elements
        const interactiveElements = document.querySelectorAll(
            'button, .category-button, .activity-button, .quick-start-button'
        );
        
        interactiveElements.forEach(el => {
            el.classList.add('touch-feedback');
        });

        // Add swipe gestures for navigation (future enhancement)
        this.setupSwipeGestures();
    }

    setupSwipeGestures() {
        let startX = 0;
        let startY = 0;
        
        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });

        document.addEventListener('touchend', (e) => {
            if (!startX || !startY) return;
            
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            
            const diffX = startX - endX;
            const diffY = startY - endY;
            
            // Check if it's a significant swipe
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 100) {
                if (diffX > 0) {
                    // Swipe left - could go to next screen
                    this.handleSwipeLeft();
                } else {
                    // Swipe right - could go back
                    this.handleSwipeRight();
                }
            }
            
            startX = 0;
            startY = 0;
        });
    }

    handleSwipeLeft() {
        // Future: Navigate to next screen
    }

    handleSwipeRight() {
        // Go back
        if (this.app.goBack) {
            this.app.goBack();
        }
    }

    // Loading States
    setupLoadingStates() {
        this.loadingContainer = null;
    }

    showLoading(container, message = 'Loading...') {
        if (!container) return;
        
        this.isLoading = true;
        
        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'loading-overlay fade-in';
        loadingOverlay.innerHTML = `
            <div class="loading-spinner large"></div>
            <div class="loading-text">${message}</div>
        `;
        
        container.style.position = 'relative';
        container.appendChild(loadingOverlay);
        this.loadingContainer = loadingOverlay;
        
        return loadingOverlay;
    }

    hideLoading() {
        if (this.loadingContainer) {
            this.loadingContainer.style.opacity = '0';
            setTimeout(() => {
                if (this.loadingContainer && this.loadingContainer.parentNode) {
                    this.loadingContainer.parentNode.removeChild(this.loadingContainer);
                }
                this.loadingContainer = null;
                this.isLoading = false;
            }, 300);
        }
    }

    showSkeleton(container) {
        if (!container) return;
        
        const skeleton = document.createElement('div');
        skeleton.className = 'skeleton-content';
        skeleton.innerHTML = `
            <div class="skeleton skeleton-text short"></div>
            <div class="skeleton skeleton-text medium"></div>
            <div class="skeleton skeleton-text long"></div>
            <div class="skeleton skeleton-text medium"></div>
        `;
        
        container.appendChild(skeleton);
        return skeleton;
    }

    // Performance Optimizations
    setupPerformanceOptimizations() {
        // Add GPU acceleration to animated elements
        setTimeout(() => {
            const animatedElements = document.querySelectorAll(
                '.category-button, .activity-button, .quick-start-button, .modal-content'
            );
            
            animatedElements.forEach(el => {
                el.classList.add('gpu-accelerated');
            });
        }, 1000);

        // Lazy load images and heavy content
        this.setupLazyLoading();

        // Debounce scroll and resize events
        this.setupEventDebouncing();
    }

    setupLazyLoading() {
        // Future: Lazy load reports charts when they come into view
        if ('IntersectionObserver' in window) {
            const lazyLoadObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('fade-in');
                        lazyLoadObserver.unobserve(entry.target);
                    }
                });
            });

            // Observe heavy elements
            setTimeout(() => {
                const heavyElements = document.querySelectorAll('.chart-container, .timeline-section');
                heavyElements.forEach(el => lazyLoadObserver.observe(el));
            }, 1000);
        }
    }

    setupEventDebouncing() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 250);
        });
    }

    handleResize() {
        // Handle responsive changes
        this.touchDevice = 'ontouchstart' in window;
        
        // Re-render charts if needed
        if (this.app.reports && this.app.currentScreen === 'reports') {
            setTimeout(() => this.app.reports.renderReports(), 100);
        }
    }

    // Progressive Enhancement
    setupProgressiveEnhancement() {
        // Add enhanced features only if supported
        if (CSS.supports('backdrop-filter', 'blur(10px)')) {
            document.documentElement.classList.add('supports-backdrop-filter');
        }

        if ('serviceWorker' in navigator) {
            document.documentElement.classList.add('supports-sw');
        }

        if (window.matchMedia('(hover: hover)').matches) {
            document.documentElement.classList.add('supports-hover');
        }
    }

    // Enhanced Toast Notifications
    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast-notification ${type} slide-in-up`;
        toast.textContent = message;
        
        // Add icon based on type
        const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
        toast.innerHTML = `<span>${icon}</span> ${message}`;
        
        document.body.appendChild(toast);
        
        // Announce to screen readers
        this.announceToScreenReader(message);
        
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, duration);
    }

    // Utility Methods
    isReducedMotion() {
        return this.reducedMotion;
    }

    isTouchDevice() {
        return this.touchDevice;
    }

    addAnimation(element, animationClass) {
        if (this.reducedMotion) return;
        
        element.classList.add(animationClass);
        
        // Remove animation class after it completes
        setTimeout(() => {
            element.classList.remove(animationClass);
        }, 500);
    }

    // Error Handling
    handleError(error, context = 'Unknown') {
        console.error(`Error in ${context}:`, error);
        
        this.showToast(`Something went wrong. Please try again.`, 'error');
        
        // Log to analytics or error reporting service in the future
        this.logError(error, context);
    }

    logError(error, context) {
        // Future: Send to error reporting service
        const errorLog = {
            message: error.message,
            stack: error.stack,
            context: context,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        // Store locally for now
        const errors = JSON.parse(localStorage.getItem('app_errors') || '[]');
        errors.push(errorLog);
        
        // Keep only last 10 errors
        if (errors.length > 10) {
            errors.splice(0, errors.length - 10);
        }
        
        localStorage.setItem('app_errors', JSON.stringify(errors));
    }
}

// Add keyboard shortcuts CSS
const shortcutsCSS = `
    .shortcuts-content {
        max-height: 400px;
        overflow-y: auto;
        padding: 16px 0;
    }
    
    .shortcut-group {
        background: #f8f9fa;
        padding: 16px;
        border-radius: 8px;
        border-left: 4px solid #28a745;
        margin-bottom: 16px;
    }
    
    .shortcut-group h5 {
        margin: 0 0 12px 0;
        color: #2c3e50;
        font-size: 0.95em;
        font-weight: 600;
        border-bottom: 1px solid #e9ecef;
        padding-bottom: 8px;
    }
    
    .shortcut-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid #ffffff;
    }
    
    .shortcut-item:last-child {
        border-bottom: none;
    }
    
    .shortcut-item span:last-child {
        color: #6c757d;
        font-size: 0.9em;
    }

    /* Enhanced Help Modal Styles */
    .help-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 20px;
        box-sizing: border-box;
    }

    .help-content {
        background: white;
        border-radius: 12px;
        max-width: 600px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    }

    .help-header {
        padding: 24px 24px 16px;
        border-bottom: 1px solid #e9ecef;
        display: flex;
        justify-content: space-between;
        align-items: center;
        position: sticky;
        top: 0;
        background: white;
        border-radius: 12px 12px 0 0;
        z-index: 1;
    }

    .help-header h2 {
        margin: 0;
        color: #2c3e50;
        font-size: 1.4em;
        font-weight: 600;
    }

    .help-body {
        padding: 24px;
    }

    .help-section {
        margin-bottom: 32px;
        padding-bottom: 24px;
        border-bottom: 1px solid #e9ecef;
    }

    .help-section:last-child {
        border-bottom: none;
        margin-bottom: 0;
    }

    .help-section h4 {
        margin: 0 0 20px 0;
        color: #2c3e50;
        font-size: 1.2em;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    /* Quick Steps */
    .quick-steps {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .step {
        display: flex;
        align-items: flex-start;
        gap: 16px;
        padding: 16px;
        background: #f8f9fa;
        border-radius: 8px;
        border-left: 4px solid #4A90E2;
    }

    .step-number {
        width: 32px;
        height: 32px;
        background: #4A90E2;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 0.9em;
        flex-shrink: 0;
    }

    .step-content strong {
        display: block;
        color: #2c3e50;
        font-weight: 600;
        margin-bottom: 4px;
    }

    .step-content p {
        margin: 0;
        color: #6c757d;
        font-size: 0.9em;
        line-height: 1.4;
    }

    /* Shortcuts Grid */
    .shortcuts-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 12px;
    }

    .shortcut-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background: #f8f9fa;
        border-radius: 6px;
        border: 1px solid #e9ecef;
    }

    .shortcut-item span {
        color: #495057;
        font-size: 0.9em;
    }

    /* Features Grid */
    .features-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 16px;
    }

    .feature-card {
        text-align: center;
        padding: 20px 16px;
        background: #f8f9fa;
        border-radius: 8px;
        border: 1px solid #e9ecef;
        transition: transform 0.2s ease;
    }

    .feature-card:hover {
        transform: translateY(-2px);
    }

    .feature-icon {
        font-size: 2em;
        margin-bottom: 12px;
    }

    .feature-text strong {
        display: block;
        color: #2c3e50;
        font-weight: 600;
        margin-bottom: 4px;
    }

    .feature-text p {
        margin: 0;
        color: #6c757d;
        font-size: 0.85em;
        line-height: 1.4;
    }

    /* Tips List */
    .tips-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .tip {
        padding: 12px 16px;
        background: #fff3cd;
        border: 1px solid #ffeaa7;
        border-radius: 6px;
        color: #856404;
        font-size: 0.9em;
        line-height: 1.4;
    }

    .tip strong {
        color: #2c3e50;
    }

    /* Version Info */
    .version-info {
        text-align: center;
        padding-top: 16px;
        border-top: 1px solid #e9ecef;
    }

    .version-badge {
        display: inline-flex;
        align-items: center;
        background: linear-gradient(135deg, #4A90E2, #357abd);
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 0.9em;
        font-weight: 500;
        margin-bottom: 12px;
    }

    .version-description {
        color: #6c757d;
        font-size: 0.9em;
        margin: 0;
        line-height: 1.4;
    }

    /* Keyboard key styling */
    kbd {
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 4px;
        box-shadow: 0 1px 0 rgba(0,0,0,0.2), inset 0 0 0 2px #fff;
        color: #495057;
        display: inline-block;
        font-family: monospace;
        font-size: 0.8em;
        font-weight: 600;
        line-height: 1;
        padding: 4px 6px;
        white-space: nowrap;
        margin: 0 2px;
    }

    /* Modal close button */
    .modal-close {
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 6px;
        color: #6c757d;
        cursor: pointer;
        font-size: 18px;
        height: 32px;
        width: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
    }

    .modal-close:hover {
        background: #e9ecef;
        color: #495057;
    }

    /* Mobile Responsive */
    @media (max-width: 768px) {
        .help-modal {
            padding: 10px;
        }

        .help-content {
            max-height: 95vh;
            border-radius: 8px;
        }

        .help-header {
            padding: 16px 16px 12px;
            border-radius: 8px 8px 0 0;
        }

        .help-header h2 {
            font-size: 1.2em;
        }

        .help-body {
            padding: 16px;
        }

        .shortcuts-grid {
            grid-template-columns: 1fr;
            gap: 8px;
        }

        .features-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
        }

        .feature-card {
            padding: 16px 12px;
        }

        .feature-icon {
            font-size: 1.5em;
            margin-bottom: 8px;
        }

        .step {
            padding: 12px;
            gap: 12px;
        }

        .step-number {
            width: 28px;
            height: 28px;
            font-size: 0.8em;
        }

        .help-section {
            margin-bottom: 24px;
            padding-bottom: 16px;
        }

        .help-section h4 {
            font-size: 1.1em;
            margin-bottom: 16px;
        }

        .shortcut-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
            padding: 10px 12px;
        }

        .shortcut-item span {
            font-size: 0.85em;
        }
    }

    @media (max-width: 480px) {
        .help-modal {
            padding: 5px;
        }

        .help-content {
            border-radius: 6px;
        }

        .help-header {
            padding: 12px;
        }

        .help-body {
            padding: 12px;
        }

        .features-grid {
            grid-template-columns: 1fr;
        }

        .step {
            flex-direction: column;
            text-align: center;
            gap: 8px;
        }

        .step-number {
            align-self: center;
        }
    }

    /* Animation */
    .fade-in {
        animation: fadeIn 0.3s ease-out;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: scale(0.9);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
    }
`;

// Inject CSS
const style = document.createElement('style');
style.textContent = shortcutsCSS;
document.head.appendChild(style); 