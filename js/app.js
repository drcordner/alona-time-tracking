// Main app coordinator
import { categories as defaultCategories, activityEmojis } from './data.js';
import { Storage } from './storage.js';
import { Timer } from './timer.js';
import { QuickStart } from './quickstart.js';
import { Reports } from './reports.js';
import { Management } from './management.js';
import { Goals } from './goals.js';
import { UXEnhancements } from './ux-enhancements.js';
import { formatTime } from './utils.js';

class TimeTrackerApp {
    constructor() {
        // Configuration
        this.sandbox = false;
        
        // Initialize modules
        this.storage = new Storage(this.sandbox);
        this.management = new Management(this.storage);
        this.goals = new Goals(this.storage, () => this.management.getCategories());
        this.quickStart = new QuickStart(
            this.storage, 
            () => this.management.getCategories(),
            (key) => this.management.getSetting(key)
        );
        this.reports = new Reports(this.storage, () => this.getCategories(), () => this.renderGoalsSummary());
        this.timer = new Timer(this.storage, this.showScreen.bind(this), this.updateTimerStatus.bind(this));
        
        // Initialize UX enhancements last (after all other modules)
        this.ux = null; // Will be initialized in init()
        
        // State
        this.currentScreen = 'home';
        this.currentCategory = null;
    }

    // Initialize the app
    async init() {
        console.log('TimeTrackerApp: Initializing...');
        
        // Initialize storage first
        if (!this.sandbox) {
            this.storage.loadData();
            this.storage.loadUsageStats();
        }
        
        // Initialize management system first (loads settings)
        await this.management.init();
        console.log('TimeTrackerApp: Management initialized');
        
        // Initialize goals system (depends on settings)
        this.goals.init();
        console.log('TimeTrackerApp: Goals initialized');
        
        this.renderCategories();
        this.reports.updateReportDate();

        // Check for timer recovery AFTER initial setup
        if (!this.sandbox) {
            this.timer.recoverActiveTimer();
        }
        
        // Only show home screen if no timer was recovered
        if (!this.timer.timerInterval) {
            this.showScreen('home');
        }

        this.registerServiceWorker();

        // Expose modules globally for onclick handlers
        window.app = this;
        window.reports = this.reports;
        window.management = this.management;
        window.goals = this.goals;
        window.timer = this.timer;
        
        // Initialize UX enhancements after everything else is set up
        this.ux = new UXEnhancements(this);
        console.log('TimeTrackerApp: UX enhancements initialized');

        console.log('TimeTrackerApp: Initialization complete');

        // Make globally available for components
        window.activityEmojis = activityEmojis;
        
        // Load custom activity emojis
        this.loadCustomActivityEmojis();
        
        // Check for auto-updates after everything loads
        setTimeout(() => this.checkForAutoUpdate(), 2000);
    }

    // Auto-update check functionality
    async checkForAutoUpdate() {
        // Disable auto-updates in production to prevent false positives
        // User can manually check for updates via Settings → Check for Updates
        const isDevelopment = false; // Changed from true to false
        
        if (!isDevelopment) return; // Skip when disabled
        
        try {
            const currentVersion = this.management.getAppVersion();
            const response = await fetch('version.json?' + Date.now());
            const versionData = await response.json();
            const latestVersion = versionData.version;
            
            if (currentVersion !== latestVersion) {
                console.log(`Auto-update detected: ${currentVersion} → ${latestVersion}`);
                
                // Show brief notification (optional)
                if (this.ux) {
                    this.ux.showToast(`New version available: ${versionData.versionNumber}`, 'info', 3000);
                }
                
                // Auto-refresh after a short delay so user sees the notification
                setTimeout(() => {
                    console.log('Auto-updating to latest version...');
                    this.management.checkForUpdates();
                }, 3000);
            } else {
                console.log('App is up to date:', currentVersion);
            }
        } catch (error) {
            // Silently fail - don't disrupt user experience
            console.log('Auto-update check failed (this is normal):', error.message);
        }
    }

    // Get current categories (custom or default)
    getCategories() {
        return this.management.getCategories();
    }

    // Screen management
    showScreen(screenName) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenName + '-screen').classList.add('active');
        
        document.querySelectorAll('.nav-button').forEach(btn => {
            btn.classList.remove('active');
        });
        
        if (screenName === 'home') {
            document.querySelectorAll('.nav-button')[1].classList.add('active');
            this.renderCategories();
            this.renderGoalsSection();
        } else if (screenName === 'activity') {
            // For activity screen, we don't highlight any nav button since it's a sub-screen
            // The back button will be used to return to home
        } else if (screenName === 'reports') {
            document.querySelectorAll('.nav-button')[2].classList.add('active');
            this.reports.renderReports();
            this.renderGoalsSummary();
        } else if (screenName === 'management') {
            document.querySelectorAll('.nav-button')[3].classList.add('active');
            this.management.renderManagementScreen();
        }
        
        this.currentScreen = screenName;
    }

    goBack() {
        if (this.currentScreen === 'activity') {
            this.showScreen('home');
        } else if (this.currentScreen === 'reports' || this.currentScreen === 'management') {
            this.showScreen('home');
        }
    }

    // Goals rendering
    renderGoalsSection() {
        const container = document.getElementById('goals-container');
        if (!container) {
            return; // Container might not exist if goals are disabled
        }
        
        const goalsHtml = this.goals.renderGoalsSection();
        container.innerHTML = goalsHtml;
    }

    renderGoalsSummary() {
        const container = document.getElementById('goals-summary-container');
        if (!container) return; // Container might not exist if goals are disabled
        
        // Check if goals are enabled
        if (!this.management.getSetting('goalsEnabled')) {
            container.innerHTML = '';
            return;
        }
        
        const currentView = this.reports.reportView || 'day';
        const currentDate = this.reports.reportDate || new Date();
        
        const goalsSummary = this.goals.getGoalsSummary(currentView, currentDate);
        
        if (goalsSummary.length === 0) {
            container.innerHTML = '';
            return;
        }
        
        const categories = this.getCategories();
        
        const summaryHtml = `
            <div class="goals-summary-section">
                <div class="goals-summary-header">
                    <h3>🎯 Goals Progress</h3>
                </div>
                <div class="goals-summary-grid">
                    ${goalsSummary.map(summary => {
                        const categoryData = categories[summary.categoryName];
                        const statusIcon = this.goals.getGoalStatusIcon(summary.percentage);
                        
                        return `
                            <div class="goal-summary-card" style="--category-color: ${categoryData.color}">
                                <div class="goal-summary-header-card">
                                    <span class="goal-summary-category">${categoryData.emoji} ${summary.categoryName}</span>
                                    <span class="goal-summary-status">${statusIcon}</span>
                                </div>
                                <div class="goal-summary-progress">
                                    <div class="goal-summary-bar">
                                        <div class="goal-summary-bar-fill" style="width: ${Math.min(summary.percentage, 100)}%"></div>
                                    </div>
                                    <span class="goal-summary-percentage">${Math.round(summary.percentage)}%</span>
                                </div>
                                <div class="goal-summary-time">${formatTime(summary.actual)} / ${formatTime(summary.target)}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
        
        container.innerHTML = summaryHtml;
    }

    // Category and activity rendering
    renderCategories() {
        const container = document.getElementById('category-list');
        container.innerHTML = '';

        // Render quick start section first
        this.quickStart.renderQuickStart((category, activity) => this.timer.startActivity(category, activity));

        const categories = this.getCategories();
        // Categories are already sorted alphabetically from getCategories()
        Object.entries(categories).forEach(([categoryName, categoryData]) => {
            const todayTime = this.storage.getTodayTime(categoryName);
            const button = document.createElement('div');
            button.className = 'category-button-container';
            
            const categoryButton = document.createElement('button');
            categoryButton.className = 'category-button';
            categoryButton.style.setProperty('--category-color', categoryData.color);
            
            // If category has only one activity, go directly to timer
            if (categoryData.activities.length === 1) {
                categoryButton.onclick = () => this.timer.startActivity(categoryName, categoryData.activities[0]);
            } else {
                categoryButton.onclick = () => this.showActivities(categoryName);
            }

            categoryButton.innerHTML = `
                <div class="category-name">
                    <span class="category-emoji">${categoryData.emoji}</span>
                    <span class="category-text">${categoryName}</span>
                </div>
                <div class="category-time">${formatTime(todayTime)}</div>
                <button class="category-edit-cog" onclick="event.stopPropagation(); management.editCategory('${categoryName}')" title="Edit category">
                    ⚙️
                </button>
            `;

            button.appendChild(categoryButton);
            container.appendChild(button);
        });
    }

    showActivities(categoryName) {
        this.currentCategory = categoryName;
        const container = document.getElementById('activity-list');
        container.innerHTML = '';

        const categories = this.getCategories();
        // Sort activities alphabetically for consistency
        const activities = [...categories[categoryName].activities].sort();
        
        activities.forEach(activity => {
            const todayTime = this.storage.getTodayTime(categoryName, activity);
            const button = document.createElement('div');
            button.className = 'activity-button-container';
            
            const activityButton = document.createElement('button');
            activityButton.className = 'activity-button';
            activityButton.onclick = () => this.timer.startActivity(categoryName, activity);

            activityButton.innerHTML = `
                <div class="activity-name">
                    <span class="activity-emoji">${activityEmojis[activity] || '⭐'}</span>
                    <span class="activity-text">${activity}</span>
                </div>
                <div class="activity-time">${formatTime(todayTime)}</div>
                <button class="activity-edit-cog" onclick="event.stopPropagation(); management.editActivity('${categoryName}', '${activity}')" title="Edit activity">
                    ⚙️
                </button>
            `;

            button.appendChild(activityButton);
            container.appendChild(button);
        });

        this.showScreen('activity');
    }

    // Timer status update
    updateTimerStatus() {
        const statusEl = document.getElementById('timer-status');
        if (this.timer.isPaused) {
            statusEl.textContent = '⏸️ Timer Paused';
            statusEl.style.color = '#f39c12';
        } else {
            statusEl.textContent = '▶️ Timer Running';
            statusEl.style.color = '#27ae60';
        }
    }

    // Check for goal achievements when timer stops
    onTimerStop(categoryName) {
        this.goals.checkAchievements(categoryName);
        // Refresh goals display if on home screen
        if (this.currentScreen === 'home') {
            this.renderGoalsSection();
        }
    }

    // Service Worker registration
    registerServiceWorker() {
        // Temporarily disabled due to browser compatibility issues
        // if (!this.sandbox && 'serviceWorker' in navigator) {
        //     navigator.serviceWorker.register('data:application/javascript;base64,Y29uc3QgQ0FDSEVfTkFNRSA9ICd0aW1lLXRyYWNrZXItdjEnOwpjb25zdCB1cmxzVG9DYWNoZSA9IFsKICAnLycsICAgCiAgJy9tYW5pZmVzdC5qc29uJwpdOwoKc2VsZi5hZGRFdmVudExpc3RlbmVyKCdpbnN0YWxsJywgZXZlbnQgPT4gewogIGV2ZW50LndhaXRVbnRpbCgKICAgIGNhY2hlcy5vcGVuKENBQ0hFX05BTUUpCiAgICAgIC50aGVuKGNhY2hlID0+IGNhY2hlLmFkZEFsbCh1cmxzVG9DYWNoZSkpCiAgKTsKfSk7CgpzZWxmLmFkZEV2ZW50TGlzdGVuZXIoJ2ZldGNoJywgZXZlbnQgPT4gewogIGV2ZW50LnJlc3BvbmRXaXRoKAogICAgY2FjaGVzLm1hdGNoKGV2ZW50LnJlcXVlc3QpCiAgICAgIC50aGVuKHJlc3BvbnNlID0+IHsKICAgICAgICByZXR1cm4gcmVzcG9uc2UgfHwgZmV0Y2goZXZlbnQucmVxdWVzdCk7CiAgICAgIH0pCiAgKTsKfSk7')
        //         .then(() => console.log('Service Worker registered'))
        //         .catch(err => console.log('Service Worker registration failed:', err));
        // }
        console.log('Service Worker registration disabled for compatibility');
    }

    // Load custom activity emojis
    loadCustomActivityEmojis() {
        try {
            const stored = localStorage.getItem('customActivityEmojis');
            if (stored) {
                const customEmojis = JSON.parse(stored);
                // Merge custom emojis with defaults
                Object.assign(window.activityEmojis, customEmojis);
                console.log('Custom activity emojis loaded:', Object.keys(customEmojis).length);
            }
        } catch (error) {
            console.error('Error loading custom activity emojis:', error);
        }
    }

    // Setup PWA install prompt
    setupPWAInstallPrompt() {
        let deferredPrompt;
        window.addEventListener('beforeinstallprompt', (e) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later
            deferredPrompt = e;
            // Show install button (could be added to management screen)
            showInstallPrompt();
        });

        function showInstallPrompt() {
            // This could be integrated into the management screen
            // For now, we'll just log it
            console.log('PWA install prompt available');
        }
    }
}

// Global functions for HTML onclick handlers
window.app = new TimeTrackerApp();

// Global functions that the HTML needs
window.goBack = () => app.goBack();
window.showScreen = (screen) => app.showScreen(screen);
window.stopTimer = () => app.timer.stopTimer();
window.togglePause = () => app.timer.togglePause();
window.setReportView = (view) => app.reports.setReportView(view);
window.navigateDate = (direction) => app.reports.navigateDate(direction);

// Global management functions
window.management = app.management;

// Global goals functions
window.goals = app.goals;

// Global reports functions
window.reports = app.reports;

// Global data access
window.activityEmojis = activityEmojis;

// Global help function
window.showHelp = () => {
    if (app.ux) {
        app.ux.showHelp();
    }
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    app.init();
}); 