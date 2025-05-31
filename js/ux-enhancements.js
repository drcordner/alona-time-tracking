// UX Enhancements Module
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
        const helpContent = `
            <div class="modal-overlay" onclick="this.remove()">
                <div class="modal-content help-modal" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h3>📚 Help & Instructions</h3>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
                    </div>
                    
                    <div class="help-content">
                        <!-- Getting Started -->
                        <div class="help-section">
                            <h4>🚀 Getting Started</h4>
                            <div class="help-text">
                                <p><strong>Alona's Activity Tracker</strong> helps you track how you spend your time across different categories and activities.</p>
                                <ol>
                                    <li><strong>Start Tracking:</strong> Tap a category or use Quick Start buttons to begin timing an activity</li>
                                    <li><strong>Pause/Resume:</strong> Use the pause button during timing sessions</li>
                                    <li><strong>View Reports:</strong> Check your daily, weekly, or monthly time summaries</li>
                                    <li><strong>Set Goals:</strong> Configure time goals in the Management section</li>
                                </ol>
                            </div>
                        </div>

                        <!-- Main Features -->
                        <div class="help-section">
                            <h4>⭐ Main Features</h4>
                            <div class="feature-list">
                                <div class="feature-item">
                                    <span class="feature-icon">🏠</span>
                                    <div class="feature-desc">
                                        <strong>Home Screen:</strong> Quick start buttons and category overview with today's time
                                    </div>
                                </div>
                                <div class="feature-item">
                                    <span class="feature-icon">📊</span>
                                    <div class="feature-desc">
                                        <strong>Reports:</strong> Interactive charts, timelines, and detailed breakdowns
                                    </div>
                                </div>
                                <div class="feature-item">
                                    <span class="feature-icon">⚙️</span>
                                    <div class="feature-desc">
                                        <strong>Management:</strong> Customize categories, activities, and settings
                                    </div>
                                </div>
                                <div class="feature-item">
                                    <span class="feature-icon">🎯</span>
                                    <div class="feature-desc">
                                        <strong>Goals:</strong> Set daily, weekly, or monthly time targets
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Tips & Tricks -->
                        <div class="help-section">
                            <h4>💡 Tips & Tricks</h4>
                            <div class="help-text">
                                <ul>
                                    <li><strong>Quick Start:</strong> The app learns your patterns and shows your most-used activities</li>
                                    <li><strong>Timer Recovery:</strong> If you close the app with a timer running, it will offer to continue when you return</li>
                                    <li><strong>Export Data:</strong> Use CSV or JSON export in Reports to backup your data</li>
                                    <li><strong>Categories:</strong> Single-activity categories go directly to timing</li>
                                    <li><strong>Goals:</strong> Green checkmarks show achieved goals, progress bars show your advancement</li>
                                </ul>
                            </div>
                        </div>

                        <!-- Keyboard Shortcuts (Desktop) -->
                        <div class="help-section">
                            <h4>⌨️ Keyboard Shortcuts (Desktop)</h4>
                            <div class="shortcuts-grid">
                                <div class="shortcut-group">
                                    <h5>Timer Controls</h5>
                                    <div class="shortcut-item">
                                        <span class="kbd">Space</span>
                                        <span>Start quick activity / Pause/Resume timer</span>
                                    </div>
                                    <div class="shortcut-item">
                                        <span class="kbd">Esc</span>
                                        <span>Stop timer / Go back / Close modals</span>
                                    </div>
                                </div>
                                
                                <div class="shortcut-group">
                                    <h5>Navigation</h5>
                                    <div class="shortcut-item">
                                        <span class="kbd">Ctrl</span> + <span class="kbd">H</span>
                                        <span>Go to Home</span>
                                    </div>
                                    <div class="shortcut-item">
                                        <span class="kbd">Ctrl</span> + <span class="kbd">R</span>
                                        <span>Go to Reports</span>
                                    </div>
                                    <div class="shortcut-item">
                                        <span class="kbd">Ctrl</span> + <span class="kbd">M</span>
                                        <span>Go to Management</span>
                                    </div>
                                    <div class="shortcut-item">
                                        <span class="kbd">←</span> <span class="kbd">→</span>
                                        <span>Navigate dates (in Reports)</span>
                                    </div>
                                </div>
                                
                                <div class="shortcut-group">
                                    <h5>General</h5>
                                    <div class="shortcut-item">
                                        <span class="kbd">Ctrl</span> + <span class="kbd">/</span>
                                        <span>Show this help</span>
                                    </div>
                                    <div class="shortcut-item">
                                        <span class="kbd">Enter</span>
                                        <span>Submit form / Confirm action</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Data & Privacy -->
                        <div class="help-section">
                            <h4>🔒 Data & Privacy</h4>
                            <div class="help-text">
                                <p>All your data is stored locally in your browser. Nothing is sent to external servers:</p>
                                <ul>
                                    <li><strong>Time tracking data:</strong> Stored in browser's localStorage</li>
                                    <li><strong>Settings & goals:</strong> Saved locally on your device</li>
                                    <li><strong>Export options:</strong> Create backups anytime via Reports section</li>
                                    <li><strong>No accounts:</strong> No registration or login required</li>
                                </ul>
                            </div>
                        </div>

                        <!-- Version Info -->
                        <div class="help-section version-info">
                            <div class="version-badge">
                                <span class="version-label">Version</span>
                                <span class="version-number">5.1.0 - UX Polish</span>
                            </div>
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
        margin-bottom: 24px;
    }
    
    .shortcut-group h4 {
        margin: 0 0 12px 0;
        color: #2c3e50;
        font-size: 1em;
        border-bottom: 1px solid #e9ecef;
        padding-bottom: 8px;
    }
    
    .shortcut-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid #f8f9fa;
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
        max-width: 700px;
        width: 95vw;
        max-height: 90vh;
        overflow-y: auto;
    }

    .help-content {
        padding: 0;
        max-height: 70vh;
        overflow-y: auto;
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
        margin: 0 0 16px 0;
        color: #2c3e50;
        font-size: 1.2em;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .help-section h5 {
        margin: 0 0 12px 0;
        color: #495057;
        font-size: 1em;
        font-weight: 600;
    }

    .help-text {
        color: #6c757d;
        line-height: 1.6;
    }

    .help-text p {
        margin: 0 0 16px 0;
    }

    .help-text ol, .help-text ul {
        margin: 0 0 16px 0;
        padding-left: 24px;
    }

    .help-text li {
        margin-bottom: 8px;
    }

    .help-text strong {
        color: #495057;
    }

    .feature-list {
        display: grid;
        gap: 16px;
    }

    .feature-item {
        display: flex;
        align-items: flex-start;
        gap: 16px;
        padding: 16px;
        background: #f8f9fa;
        border-radius: 8px;
        border-left: 4px solid #4A90E2;
    }

    .feature-icon {
        font-size: 1.5em;
        flex-shrink: 0;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .feature-desc {
        flex: 1;
        color: #495057;
        line-height: 1.5;
    }

    .feature-desc strong {
        color: #2c3e50;
        font-weight: 600;
    }

    .shortcuts-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 24px;
    }

    .shortcut-group {
        background: #f8f9fa;
        padding: 16px;
        border-radius: 8px;
        border-left: 4px solid #28a745;
    }

    .version-info {
        text-align: center;
        padding-top: 16px;
    }

    .version-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: linear-gradient(135deg, #4A90E2, #357abd);
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 0.9em;
        box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
    }

    .version-label {
        font-weight: 500;
        opacity: 0.9;
    }

    .version-number {
        font-weight: 600;
    }

    /* Mobile Responsive */
    @media (max-width: 768px) {
        .help-modal {
            width: 100vw;
            max-width: none;
            height: 100vh;
            max-height: none;
            border-radius: 0;
            margin: 0;
        }

        .help-content {
            max-height: none;
            padding: 0 16px 16px;
        }

        .shortcuts-grid {
            grid-template-columns: 1fr;
            gap: 16px;
        }

        .feature-item {
            padding: 12px;
        }

        .feature-icon {
            width: 32px;
            height: 32px;
            font-size: 1.2em;
        }

        .help-section {
            margin-bottom: 24px;
            padding-bottom: 16px;
        }
    }

    @media (max-width: 480px) {
        .shortcut-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
        }

        .shortcut-item span:last-child {
            font-size: 0.85em;
        }

        .feature-item {
            flex-direction: column;
            text-align: center;
            gap: 12px;
        }

        .help-section h4 {
            font-size: 1.1em;
        }
    }
`;

// Inject CSS
const style = document.createElement('style');
style.textContent = shortcutsCSS;
document.head.appendChild(style); 