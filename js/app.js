// Main app coordinator
import { getFullVersion } from './version-loader.js';
console.log('🚀 NEW APP.JS LOADED - TIMESTAMP:', Date.now(), `Version: ${getFullVersion()}`);
console.log('🔧 Global assignments should happen AFTER initialization');

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
        this.goals = new Goals(this.storage, () => this.management.getCategories(), (key) => this.management.getSetting(key));
        this.quickStart = new QuickStart(
            this.storage, 
            () => this.management.getCategories(),
            (key) => this.management.getSetting(key)
        );
        this.reports = new Reports(this.storage, () => this.getCategories(), () => this.renderGoalsSummary());
        this.timer = new Timer(this.storage, this.showScreen.bind(this), this.updateTimerStatus.bind(this), this.onTimerStop.bind(this));
        
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
            // Use feature flag to recover the correct timer
            if (this.management.getFeatureFlag && this.management.getFeatureFlag('enhanced_timer')) {
                this.timer.recoverActiveTimer();
            } else {
                this.timer.recoverActiveTimer();
            }
        }
        
        // Only show home screen if no timer was recovered
        if (!this.timer.timerInterval) {
            this.showScreen('home');
        }

        this.registerServiceWorker();

        // Initialize UX enhancements after everything else is set up
        this.ux = new UXEnhancements(this);
        console.log('TimeTrackerApp: UX enhancements initialized');

        // 🚨 FIX: Move global assignments HERE after all modules are initialized
        // Expose modules globally for onclick handlers
        window.app = this;
        window.reports = this.reports;
        window.management = this.management;
        window.goals = this.goals;
        window.timer = this.timer;
        
        // Global functions that the HTML needs
        window.goBack = () => this.goBack();
        window.showScreen = (screen) => this.showScreen(screen);
        window.stopTimer = () => this.getActiveTimer().stopTimer();
        window.togglePause = () => this.getActiveTimer().togglePause();
        window.setReportView = (view) => this.reports.setReportView(view);
        window.navigateDate = (direction) => this.reports.navigateDate(direction);
        
        // Global help function - now app.ux is properly initialized
        window.showHelp = () => {
            if (this.ux) {
                this.ux.showHelp();
            } else {
                console.error('UX module not initialized');
            }
        };

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

    // Toggle category header menu (consistent with management.js implementation)
    toggleCategoryHeaderMenu(categoryName) {
        const safeId = categoryName.replace(/\s+/g, '-');
        const menu = document.getElementById(`category-header-menu-${safeId}`);
        const categoryContext = document.querySelector('.category-context');
        const isOpen = menu.style.display === 'block';
        
        // Close all other menus first
        this.closeCategoryHeaderMenus();
        
        if (!isOpen) {
            menu.style.display = 'block';
            // Elevate parent category z-index when menu is open
            if (categoryContext) {
                categoryContext.classList.add('menu-open');
            }
            // Close menu when clicking elsewhere
            setTimeout(() => {
                document.addEventListener('click', this.closeCategoryHeaderMenus.bind(this), { once: true });
            }, 0);
        }
    }

    // Close all category header menus
    closeCategoryHeaderMenus() {
        document.querySelectorAll('.category-header-menu').forEach(menu => {
            menu.style.display = 'none';
        });
        // Remove menu-open class from category context
        document.querySelectorAll('.category-context.menu-open').forEach(context => {
            context.classList.remove('menu-open');
        });
    }

    // Goals rendering
    renderGoalsSection() {
        const container = document.getElementById('goals-container');
        if (!container) {
            return; // Container might not exist if goals are disabled
        }
        
        // Check if goals are enabled in settings
        if (!this.management.getSetting('goalsEnabled')) {
            container.innerHTML = ''; // Clear goals section if disabled
            return;
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
            if (categoryData && categoryData.activities && categoryData.activities.length === 1) {
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
        console.log('[DEBUG] showActivities called for category:', categoryName);
        this.currentCategory = categoryName;
        const container = document.getElementById('activity-list');
        const categories = this.getCategories();
        let categoryData = categories[categoryName];
        
        // 🛡️ DEFENSIVE: Check for missing category data
        if (!categoryData || !categoryData.activities) {
            console.warn('⚠️ Category data missing for:', categoryName, categoryData);
            
            // Try to recover by refreshing categories first
            const refreshedCategories = this.getCategories();
            const refreshedCategoryData = refreshedCategories[categoryName];
            
            if (refreshedCategoryData && refreshedCategoryData.activities) {
                // Data found after refresh, continue with refreshed data
                console.log('✅ Category data recovered after refresh');
                categoryData = refreshedCategoryData;
            } else {
                // Still no data, show user-friendly recovery options
                container.innerHTML = `
                    <div style="padding: 20px; text-align: center; color: #e74c3c; background: #f8f9fa; border-radius: 8px; margin: 20px;">
                        <h3>⚠️ Category Not Found</h3>
                        <p>Category "${categoryName}" could not be loaded. This might happen if:</p>
                        <ul style="text-align: left; margin: 15px 0; color: #6c757d;">
                            <li>The category was recently renamed or deleted</li>
                            <li>There was an editing conflict</li>
                            <li>Browser data needs to refresh</li>
                        </ul>
                        <div style="margin-top: 20px;">
                            <button onclick="app.showScreen('home')" style="padding: 10px 20px; background: #4A90E2; color: white; border: none; border-radius: 5px; margin-right: 10px;">
                                Return to Home
                            </button>
                            <button onclick="location.reload()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px;">
                                Refresh App
                            </button>
                        </div>
                        <p style="margin-top: 15px; color: #6c757d; font-size: 0.9em;">
                            Your data is safe - this doesn't affect your time tracking history.
                        </p>
                    </div>
                `;
                return;
            }
        }

        // Create category header with context
        const categoryHeader = `
            <div class="activity-screen-header">
                <div class="category-context" style="--category-color: ${categoryData.color}">
                    <div class="category-context-info">
                        <span class="category-context-emoji">${categoryData.emoji}</span>
                        <div class="category-context-text">
                            <h2 class="category-context-name">${categoryName}</h2>
                            <p class="category-context-subtitle">Select an activity to start tracking</p>
                        </div>
                    </div>
                    <div class="category-context-actions">
                        <button class="category-header-menu-btn" onclick="app.toggleCategoryHeaderMenu('${categoryName}')" title="Category options">
                            ⋯
                        </button>
                        <div class="category-header-menu" id="category-header-menu-${categoryName.replace(/\s+/g, '-')}" style="display: none;">
                            <button class="menu-item" onclick="app.closeCategoryHeaderMenus(); management.editCategory('${categoryName}')">
                                <span class="menu-icon">⚙️</span>
                                <span class="menu-text">Edit Category</span>
                            </button>
                            <button class="menu-item" onclick="app.closeCategoryHeaderMenus(); management.showAddActivityModal('${categoryName}')">
                                <span class="menu-icon">➕</span>
                                <span class="menu-text">Add Activity</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Sort activities alphabetically for consistency
        const activities = [...categoryData.activities].sort();
        
        const activitiesHtml = activities.map(activity => {
            const todayTime = this.storage.getTodayTime(categoryName, activity);
            const activityEmoji = this.management.getActivityEmoji(activity);
            return `
                <div class="activity-button-container">
                    <button class="activity-button" onclick="app.startActivity('${categoryName}', '${activity}')">
                        <div class="activity-name">
                            <span class="activity-emoji">${activityEmoji}</span>
                            <span class="activity-text">${activity}</span>
                        </div>
                        <div class="activity-time">${formatTime(todayTime)}</div>
                        <button class="activity-edit-cog" onclick="event.stopPropagation(); management.editActivity('${categoryName}', '${activity}')" title="Edit activity">
                            ⚙️
                        </button>
                    </button>
                </div>
            `;
        }).join('');

        container.innerHTML = categoryHeader + activitiesHtml;
        this.showScreen('activity');
    }

    // Timer status update
    updateTimerStatus() {
        this.timer.updateTimerStatus();
    }

    // Check for goal achievements when timer stops
    onTimerStop(category) {
        // Only handle app-level logic here
        this.goals.checkAchievements(category);
        if (this.currentScreen === 'home') {
            this.renderGoalsSection();
        }
        // DO NOT call this.timer.onTimerStop(category)
    }

    // Service Worker registration
    registerServiceWorker() {
        if (!this.sandbox && 'serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(registration => {
                    console.log('✅ Service Worker registered successfully:', registration);
                    
                    // Listen for updates
                    registration.addEventListener('updatefound', () => {
                        console.log('🔄 Service Worker update found');
                        const newWorker = registration.installing;
                        if (newWorker) {
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    console.log('🆕 New Service Worker installed, ready to activate');
                                }
                            });
                        }
                    });
                })
                .catch(err => {
                    console.error('❌ Service Worker registration failed:', err);
                });
        } else {
            console.log('Service Worker not available or in sandbox mode');
        }
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

    // Helper to get the active timer based on the feature flag
    getActiveTimer() {
        return this.timer;
    }

    // Start activity using the correct timer
    startActivity(category, activity) {
        this.timer.startActivity(category, activity);
    }
}

// Export the class for ES6 modules and make it globally available
window.TimeTrackerApp = TimeTrackerApp;

// Don't auto-initialize here since cache-buster will handle it
// The cache-buster will create the instance after all modules are loaded 