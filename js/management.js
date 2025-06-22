// Category & Activity Management Module
import { categories as defaultCategories, activityEmojis } from './data.js';
import { getVersionInfo, getFullVersion, getVersionNumber } from './version-loader.js';

export class Management {
    constructor(storage) {
        this.storage = storage;
        this.customCategories = null;
        this.editingCategory = null;
        this.editingActivity = null;
        this.collapsedCategories = new Set(); // Track collapsed categories - will be populated on init
        this.currentTab = 'categories'; // Track active tab
        this.settings = null; // App settings
        this.goalSaveTimeout = null;
        this.versionInfo = null; // Will store version info from JSON
        
        // Load version info from JSON
        this.loadVersionInfo();
        
        // Load settings
        this.loadSettings();
    }

    // Load version information using centralized version-loader
    async loadVersionInfo() {
        try {
            // Use already loaded version info from version-loader
            const versionData = getVersionInfo();
            console.log('Management: Version info loaded:', versionData);
            return versionData;
        } catch (error) {
            console.log('Management: Version info loading failed, using fallback');
            // Even the fallback uses version-loader, ensuring consistency
            return {
                versionNumber: getVersionNumber(),
                version: getFullVersion(),
                description: getFullVersion().split(' - ')[1] || 'Time Tracking Application'
            };
        }
    }

    // Initialize management with custom or default categories and settings
    async init() {
        // Load version info first
        this.versionInfo = await this.loadVersionInfo();
        
        this.loadCustomCategories();
        this.loadSettings();
        
        // Default all categories to collapsed for cleaner initial view
        const categories = this.getCategories();
        Object.keys(categories).forEach(categoryName => {
            this.collapsedCategories.add(categoryName);
        });
    }

    // Load settings from storage or set defaults
    loadSettings() {
        console.log('Management: Loading settings...');
        const stored = this.storage.getSettings();
        
        if (stored) {
            this.settings = stored;
            // Check for version updates and migrate if needed
            // Simplified check - if version doesn't match current, update it
            if (!this.settings.version || this.settings.version !== getFullVersion()) {
                this.settings.version = this.versionInfo?.version || getFullVersion();
                this.saveSettings();
                console.log('Management: Updated version to', this.settings.version);
            }
        } else {
            // Default settings
            this.settings = this.getDefaultSettings();
            this.saveSettings();
        }
        
        // Apply app title immediately
        this.updateAppTitle();
    }

    // Save settings to storage
    saveSettings() {
        this.storage.saveSettings(this.settings);
    }

    // Update app title in the DOM
    updateAppTitle() {
        const headerElement = document.querySelector('.header h1');
        if (headerElement) {
            headerElement.textContent = this.settings.appTitle;
        }
        
        // Update document title
        document.title = this.settings.appTitle;
    }

    // Get setting value
    getSetting(key) {
        return this.settings ? this.settings[key] : null;
    }

    // Update setting value
    updateSetting(key, value) {
        console.log('Management: updateSetting called with', key, '=', value);
        
        if (!this.settings) this.settings = {};
        if (key === 'goalsEnabled') {
            this.settings.goalsEnabled = value;
            this.handleGoalsToggle(value);
        } else {
            // Handle nested settings
            const keys = key.split('.');
            let current = this.settings;
            for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) {
                    current[keys[i]] = {};
                }
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;
        }
        this.saveSettings();
        
        // Apply changes immediately
        if (key === 'appTitle') {
            this.updateAppTitle();
        }
        
        console.log('Management: updateSetting completed');
    }

    // Handle goals toggle changes
    handleGoalsToggle(enabled) {
        // Re-render the settings tab to update the description text
        this.renderManagementScreen();
        
        // Update goals section on home screen if currently visible
        if (window.app && window.app.currentScreen === 'home') {
            window.app.renderGoalsSection();
        }
        
        // Update reports screen if currently visible
        if (window.app && window.app.currentScreen === 'reports') {
            window.app.renderGoalsSummary();
        }
        
        // Show feedback to user
        this.showToast(
            enabled ? 'Goals feature enabled! 🎯' : 'Goals feature disabled',
            enabled ? 'success' : 'info'
        );
    }

    // Load custom categories from storage or use defaults
    loadCustomCategories() {
        const stored = this.storage.getCustomCategories();
        if (stored && Object.keys(stored).length > 0) {
            this.customCategories = stored;
        } else {
            // First time - copy defaults to custom storage
            this.customCategories = JSON.parse(JSON.stringify(defaultCategories));
            this.saveCustomCategories();
        }
    }

    // Get current active categories (non-deleted, sorted alphabetically)
    getCategories() {
        const activeCategories = {};
        const allCategories = this.customCategories || defaultCategories;
        
        // Filter out deleted categories and sort alphabetically
        const sortedNames = Object.keys(allCategories)
            .filter(name => !allCategories[name].deleted)
            .sort();
            
        sortedNames.forEach(name => {
            activeCategories[name] = allCategories[name];
        });
        
        return activeCategories;
    }

    // Save custom categories to storage
    saveCustomCategories() {
        this.storage.saveCustomCategories(this.customCategories);
    }

    // Switch between tabs
    switchTab(tabName) {
        this.currentTab = tabName;
        this.renderManagementScreen();
    }

    // Toggle category collapse
    toggleCategoryCollapse(categoryName) {
        if (this.collapsedCategories.has(categoryName)) {
            this.collapsedCategories.delete(categoryName);
        } else {
            this.collapsedCategories.add(categoryName);
        }
        this.renderManagementScreen();
    }

    // Close all category menus and clean up z-index classes
    closeAllMenus() {
        document.querySelectorAll('.category-menu').forEach(menu => {
            menu.style.display = 'none';
            // Remove menu-open class from parent category item
            const parentItem = menu.closest('.category-management-item');
            if (parentItem) {
                parentItem.classList.remove('menu-open');
            }
        });
    }

    // Toggle category menu dropdown
    toggleCategoryMenu(categoryName) {
        // Close all other menus first and remove menu-open class
        this.closeAllMenus();
        
        // Toggle the clicked menu
        const menuId = `category-menu-${categoryName.replace(/\s+/g, '-')}`;
        const menu = document.getElementById(menuId);
        if (menu) {
            const isVisible = menu.style.display === 'block';
            menu.style.display = isVisible ? 'none' : 'block';
            
            // Add/remove menu-open class for z-index elevation
            const parentItem = menu.closest('.category-management-item');
            if (parentItem) {
                if (isVisible) {
                    parentItem.classList.remove('menu-open');
                } else {
                    parentItem.classList.add('menu-open');
                }
            }
            
            // Adjust position if menu would be truncated
            if (!isVisible) {
                setTimeout(() => {
                    const rect = menu.getBoundingClientRect();
                    const viewportWidth = window.innerWidth;
                    const viewportHeight = window.innerHeight;
                    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                    
                    // Reset positioning first
                    menu.style.top = '';
                    menu.style.bottom = '';
                    menu.style.right = '';
                    menu.style.left = '';
                    menu.style.transform = '';
                    
                    // Check horizontal positioning
                    if (rect.right > viewportWidth - 16) {
                        menu.style.right = '0';
                        menu.style.left = 'auto';
                    } else if (rect.left < 16) {
                        menu.style.right = 'auto';
                        menu.style.left = '0';
                    }
                    
                    // Check vertical positioning
                    if (rect.bottom > viewportHeight - 16) {
                        // Show menu above the button instead of below
                        menu.style.top = 'auto';
                        menu.style.bottom = '100%';
                        menu.style.marginTop = '0';
                        menu.style.marginBottom = '4px';
                    } else {
                        // Default position below button
                        menu.style.top = '100%';
                        menu.style.bottom = 'auto';
                        menu.style.marginTop = '4px';
                        menu.style.marginBottom = '0';
                    }
                }, 10);
            }
        }
    }

    // Render the management screen with tabs
    renderManagementScreen() {
        const container = document.getElementById('management-content');
        container.innerHTML = `
            <div class="management-tabs">
                <button class="tab-button ${this.currentTab === 'categories' ? 'active' : ''}" 
                        onclick="management.switchTab('categories')">
                    Categories & Activities
                </button>
                <button class="tab-button ${this.currentTab === 'settings' ? 'active' : ''}" 
                        onclick="management.switchTab('settings')">
                    Settings
                </button>
            </div>
            
            <div class="tab-content">
                ${this.currentTab === 'categories' ? this.renderCategoriesTab() : this.renderSettingsTab()}
            </div>
        `;

        // Add click outside listener to close menus
        setTimeout(() => {
            document.addEventListener('click', this.handleClickOutside.bind(this));
        }, 100);
    }

    // Close category menus when clicking outside
    handleClickOutside(event) {
        if (!event.target.closest('.category-menu-container')) {
            this.closeAllMenus();
        }
    }

    // Render categories and activities tab
    renderCategoriesTab() {
        const categories = this.getCategories();
        const categoryCount = Object.keys(categories).length;
        
        return `
            <div class="tab-header">
                <div class="tab-header-content">
                    <h3>Categories & Activities (${categoryCount})</h3>
                    <button class="btn-icon add-category-compact" onclick="management.showAddCategoryModal()" title="Add New Category">
                        ➕
                    </button>
                </div>
            </div>
            
            ${categoryCount === 0 ? 
                '<div class="no-categories-state"><p>No categories yet. Create your first category to get started!</p></div>' 
                : this.renderCategoriesManagement()
            }
        `;
    }

    // Render settings tab
    renderSettingsTab() {
        console.log('Management: renderSettingsTab called, settings:', this.settings);
        
        return `
            <div class="settings-container">
                <div class="settings-section">
                    <h3>🎯 App Configuration</h3>
                    <div class="settings-grid">
                        <div class="setting-item">
                            <label for="app-title">App Title</label>
                            <input type="text" 
                                   id="app-title" 
                                   value="${this.settings.appTitle}" 
                                   placeholder="Enter app title"
                                   onchange="management.updateSetting('appTitle', this.value)"
                                   class="input-base input-medium">
                            <p class="setting-description">Customize the title shown in the header and browser tab</p>
                        </div>
                        <div class="setting-item">
                            <label for="quick-start-count">Quick Start Items</label>
                            <select id="quick-start-count" 
                                    class="input-base input-medium"
                                    onchange="management.updateSetting('quickStartCount', parseInt(this.value))">
                                <option value="4" ${this.settings.quickStartCount === 4 ? 'selected' : ''}>4 items</option>
                                <option value="6" ${(this.settings.quickStartCount || 6) === 6 ? 'selected' : ''}>6 items</option>
                                <option value="8" ${this.settings.quickStartCount === 8 ? 'selected' : ''}>8 items</option>
                                <option value="10" ${this.settings.quickStartCount === 10 ? 'selected' : ''}>10 items</option>
                            </select>
                            <p class="setting-description">Number of smart activity suggestions shown on the home screen</p>
                        </div>
                    </div>
                </div>

                <div class="settings-section">
                    <h3>🎯 Features</h3>
                    <div class="settings-grid">
                        <div class="setting-item">
                            <div class="setting-toggle">
                                <label for="goals-toggle">Goals & Streaks</label>
                                <div class="toggle-switch">
                                    <input type="checkbox"
                                           id="goals-toggle"
                                           ${this.settings.goalsEnabled ? 'checked' : ''}
                                           onchange="management.handleGoalsToggle(this.checked)">
                                    <span class="toggle-slider" onclick="document.getElementById('goals-toggle').click()"></span>
                                </div>
                            </div>
                            <p class="setting-description">
                                Enable goal setting and progress tracking features. 
                                ${this.settings.goalsEnabled ? 'Goals will appear on the home screen and in reports.' : 'Goal features will be hidden throughout the app.'}
                            </p>
                        </div>
                    </div>
                </div>

                <div class="settings-section">
                    <h3>📱 App Management</h3>
                    <div class="settings-grid">
                        <div class="setting-item">
                            <label>App Updates</label>
                            <button class="btn btn-secondary" onclick="management.checkForUpdates()">
                                <span id="update-btn-text">Check for Updates</span>
                            </button>
                            <p class="setting-description">Manually check for app updates and refresh if needed</p>
                        </div>
                        <div class="setting-item">
                            <label>Nuclear Cache Reset</label>
                            <button class="btn btn-danger" onclick="management.nuclearCacheReset()">
                                💥 Nuclear Reset
                            </button>
                            <p class="setting-description">⚠️ For stubborn cache issues: Completely wipe all caches and force fresh reload</p>
                        </div>
                        <div class="setting-item">
                            <label for="session-retention">Data Retention</label>
                            <select id="session-retention" 
                                    class="input-base input-medium"
                                    onchange="management.updateSetting('sessionRetentionDays', parseInt(this.value))">
                                <option value="30" ${this.settings.sessionRetentionDays === 30 ? 'selected' : ''}>30 days</option>
                                <option value="60" ${this.settings.sessionRetentionDays === 60 ? 'selected' : ''}>60 days</option>
                                <option value="90" ${(this.settings.sessionRetentionDays || 90) === 90 ? 'selected' : ''}>90 days (default)</option>
                                <option value="180" ${this.settings.sessionRetentionDays === 180 ? 'selected' : ''}>6 months</option>
                                <option value="365" ${this.settings.sessionRetentionDays === 365 ? 'selected' : ''}>1 year</option>
                                <option value="-1" ${this.settings.sessionRetentionDays === -1 ? 'selected' : ''}>Keep forever</option>
                            </select>
                            <p class="setting-description">How long to keep session data before cleanup</p>
                        </div>
                    </div>
                </div>

                <div class="settings-section">
                    <h3>📊 Data Management</h3>
                    <div class="settings-grid">
                        <div class="setting-item">
                            <button class="btn-secondary" onclick="management.exportData()">
                                📤 Export Data
                            </button>
                            <p class="setting-description">Download your time tracking data as a JSON file</p>
                        </div>
                        <div class="setting-item">
                            <button class="btn-secondary" onclick="management.showImportModal()">
                                📥 Import Data
                            </button>
                            <p class="setting-description">Import time tracking data from a JSON file</p>
                        </div>
                        <div class="setting-item">
                            <button class="btn-danger" onclick="management.showClearDataModal()">
                                🗑️ Clear All Data
                            </button>
                            <p class="setting-description">Remove all time tracking data and reset the app</p>
                        </div>
                    </div>
                </div>

                <div class="settings-section">
                    <h3>ℹ️ About</h3>
                    <div class="settings-info">
                        <div class="version-info">
                            <div class="version-details">
                                <div class="version-number">${this.versionInfo ? this.versionInfo.versionNumber : this.settings.version}</div>
                                <div class="version-description">${this.versionInfo ? this.versionInfo.description : 'Time Tracking Application'}</div>
                                ${this.versionInfo && this.versionInfo.timestamp ? `<div class="version-timestamp">Released: ${new Date(this.versionInfo.timestamp).toLocaleDateString()}</div>` : ''}
                            </div>
                            
                            <div class="app-stats">
                                <p><strong>Categories:</strong> ${Object.keys(this.getCategories()).length}</p>
                                <p><strong>Total Activities:</strong> ${Object.values(this.getCategories()).reduce((sum, cat) => sum + (cat.activities ? cat.activities.length : 0), 0)}</p>
                            </div>

                            ${this.versionInfo && this.versionInfo.features ? `
                                <details class="features-details">
                                    <summary>Latest Features & Improvements</summary>
                                    <ul class="features-list">
                                        ${this.versionInfo.features.map(feature => `<li>${feature}</li>`).join('')}
                                    </ul>
                                </details>
                            ` : ''}
                            
                            ${this.versionInfo && this.versionInfo.fixes && this.versionInfo.fixes.length > 0 ? `
                                <details class="fixes-details">
                                    <summary>Bug Fixes</summary>
                                    <ul class="fixes-list">
                                        ${this.versionInfo.fixes.map(fix => `<li>${fix}</li>`).join('')}
                                    </ul>
                                </details>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Export data functionality
    exportData() {
        // Include Goals data in export
        let goalsData = {};
        if (!this.storage.sandbox) {
            const storedGoals = localStorage.getItem('categoryGoals');
            if (storedGoals) {
                goalsData = JSON.parse(storedGoals);
            }
        }

        const data = {
            categories: this.customCategories,
            settings: this.settings,
            timeTracking: this.storage.getAllData(),
            goals: goalsData, // Add Goals data to export
            exportDate: new Date().toISOString(),
            version: this.settings.version
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `time-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Show import modal
    showImportModal() {
        const modal = `
            <div class="modal-overlay" onclick="management.closeModal()">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h3>📥 Import Data</h3>
                        <button class="modal-close" onclick="management.closeModal()">✕</button>
                    </div>
                    
                    <div class="import-content">
                        <p>Select a JSON backup file to import your data:</p>
                        <input type="file" id="import-file" accept=".json" onchange="management.handleFileImport(event)">
                        <div class="import-warning">
                            ⚠️ <strong>Warning:</strong> This will replace all current data. Make sure to export your current data first.
                        </div>
                    </div>
                    
                    <div class="modal-actions">
                        <button class="btn-secondary" onclick="management.closeModal()">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('modal-container').innerHTML = modal;
    }

    // Handle file import
    handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                // Validate data structure
                if (data.categories && data.settings) {
                    this.customCategories = data.categories;
                    this.settings = data.settings;
                    this.saveCustomCategories();
                    this.saveSettings();
                    
                    // Import time tracking data if present
                    if (data.timeTracking) {
                        this.storage.importData(data.timeTracking);
                    }
                    
                    // Import Goals data if present
                    if (data.goals && !this.storage.sandbox) {
                        localStorage.setItem('categoryGoals', JSON.stringify(data.goals));
                        // Reinitialize goals if the goals system is available
                        if (window.app && window.app.goals) {
                            window.app.goals.loadGoals();
                        }
                    }
                    
                    this.updateAppTitle();
                    this.closeModal();
                    this.renderManagementScreen();
                    
                    // Show success message
                    this.showToast('Data imported successfully!', 'success');
                } else {
                    throw new Error('Invalid file format');
                }
            } catch (error) {
                this.showToast('Failed to import data. Please check the file format.', 'error');
            }
        };
        reader.readAsText(file);
    }

    // Show clear data confirmation modal
    showClearDataModal() {
        const modal = `
            <div class="modal-overlay" onclick="management.closeModal()">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h3>🗑️ Clear All Data</h3>
                        <button class="modal-close" onclick="management.closeModal()">✕</button>
                    </div>
                    
                    <div class="clear-data-content">
                        <p><strong>⚠️ This action cannot be undone!</strong></p>
                        <p>This will permanently delete:</p>
                        <ul>
                            <li>All time tracking records</li>
                            <li>Custom categories and activities</li>
                            <li>Goal settings and progress</li>
                            <li>All app settings</li>
                        </ul>
                        <p>The app will be reset to its initial state.</p>
                    </div>
                    
                    <div class="modal-actions">
                        <button class="btn-secondary" onclick="management.closeModal()">Cancel</button>
                        <button class="btn-danger" onclick="management.clearAllData()">Clear All Data</button>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('modal-container').innerHTML = modal;
    }

    // Clear all data
    clearAllData() {
        this.storage.clearAllData();
        this.loadCustomCategories();
        this.loadSettings();
        this.closeModal();
        this.renderManagementScreen();
        this.showToast('All data cleared successfully!', 'success');
    }

    // Show toast notification
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast-notification ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }

    // Render categories management list
    renderCategoriesManagement() {
        const categories = this.getCategories();
        
        // Handle case where no categories exist or categories are corrupted
        if (!categories || Object.keys(categories).length === 0) {
            return `
                <div class="no-categories-state">
                    <div class="no-categories-icon">📁</div>
                    <h3>No Categories Found</h3>
                    <p>It looks like your categories may have been corrupted or deleted.</p>
                    <button class="btn-primary" onclick="management.restoreDefaultCategories()">
                        🔄 Restore Default Categories
                    </button>
                </div>
            `;
        }
        
        return Object.entries(categories).map(([categoryName, categoryData], index) => {
            // Validate category data before rendering
            if (!categoryData || typeof categoryData !== 'object') {
                console.warn(`Skipping corrupted category: ${categoryName}`, categoryData);
                return '';
            }
            
            // Ensure required fields exist with defaults
            const safeData = {
                color: categoryData.color || '#4A90E2',
                emoji: categoryData.emoji || '📁',
                activities: Array.isArray(categoryData.activities) ? categoryData.activities : []
            };
            
            const isCollapsed = this.collapsedCategories.has(categoryName);
            return `
                <div class="category-management-item home-style" data-category="${categoryName}">
                    <div class="category-management-card" style="--category-color: ${safeData.color}" onclick="management.toggleCategoryCollapse('${categoryName}')" title="Click to expand/collapse activities">
                        <div class="category-management-header">
                            <div class="category-content">
                                <div class="category-name">
                                    <span class="category-emoji">${safeData.emoji}</span>
                                    <span class="category-text">${categoryName}</span>
                                </div>
                                <div class="category-activity-count">${safeData.activities.length} ${safeData.activities.length === 1 ? 'activity' : 'activities'}</div>
                            </div>
                            <div class="category-menu-container" onclick="event.stopPropagation()">
                                <button class="category-menu-button" onclick="management.toggleCategoryMenu('${categoryName}')" title="Category options">
                                    ⋯
                                </button>
                                <div class="category-menu" id="category-menu-${categoryName.replace(/\s+/g, '-')}" style="display: none;">
                                    <button class="menu-item" onclick="management.editCategory('${categoryName}')">
                                        <span class="menu-icon">⚙️</span>
                                        <span class="menu-text">Edit Category</span>
                                    </button>
                                    <button class="menu-item" onclick="management.showAddActivityModal('${categoryName}')">
                                        <span class="menu-icon">➕</span>
                                        <span class="menu-text">Add Activity</span>
                                    </button>
                                    ${Object.keys(categories).length > 1 ? `
                                        <button class="menu-item danger" onclick="management.deleteCategory('${categoryName}')">
                                            <span class="menu-icon">🗑️</span>
                                            <span class="menu-text">Delete Category</span>
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    ${!isCollapsed ? this.renderActivitiesForCategory(categoryName, safeData.activities) : ''}
                </div>
            `;
        }).filter(html => html).join(''); // Filter out empty strings from corrupted categories
    }

    // Render activities for a category (sorted alphabetically)
    renderActivitiesForCategory(categoryName, activities) {
        const sortedActivities = [...activities].sort();
        
        return `
            <div class="activities-management-list">
                ${sortedActivities.map(activity => {
                    const emoji = this.getActivityEmoji(activity);
                    return `
                        <div class="activity-management-card" onclick="management.editActivity('${categoryName}', '${activity}')" data-activity="${activity}" title="Click to edit activity">
                            <div class="activity-card-content">
                                <div class="activity-name">
                                    <span class="activity-emoji">${emoji}</span>
                                    <span class="activity-text">${activity}</span>
                                </div>
                                <div class="activity-management-actions" onclick="event.stopPropagation()">
                                    <button class="activity-edit-cog" onclick="management.editActivity('${categoryName}', '${activity}')" title="Edit activity">
                                        ⚙️
                                    </button>
                                    <button class="btn-icon btn-danger activity-delete" onclick="management.deleteActivity('${categoryName}', '${activity}')" title="Delete Activity">
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    // Show add activity modal
    showAddActivityModal(categoryName) {
        this.closeAllMenus(); // Close any open menus
        this.showActivityModal('add', categoryName);
    }

    // Edit activity
    editActivity(categoryName, activityName) {
        this.editingActivity = { category: categoryName, activity: activityName };
        this.showActivityModal('edit', categoryName, activityName);
    }

    // Show activity modal (add or edit)
    showActivityModal(mode, categoryName, activityName = '') {
        const isEdit = mode === 'edit';
        const title = isEdit ? 'Edit Activity' : 'Add Activity';
        const currentEmoji = isEdit ? this.getActivityEmoji(activityName) : '⭐';
        
        const modal = `
            <div class="modal-overlay" onclick="management.closeModal()">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h3>${title}</h3>
                        <button class="modal-close" onclick="management.closeModal()">✕</button>
                    </div>
                    
                    <form id="activity-form" onsubmit="management.submitActivityForm(event, '${mode}', '${categoryName}')">
                        <div class="activity-form-content">
                        <div class="form-group">
                            <label>Activity Name</label>
                                <input type="text" id="activity-name" 
                                       value="${isEdit ? activityName : ''}" 
                                       required maxlength="30">
                        </div>
                        
                        <div class="form-group">
                            <label>Emoji</label>
                            ${this.createEmojiPicker(currentEmoji, 'activity-emoji', false)}
                        </div>
                        
                        <div class="modal-actions">
                            <button type="button" class="btn-secondary" onclick="management.closeModal()">Cancel</button>
                                <button type="submit" class="btn-primary">${isEdit ? 'Update Activity' : 'Create Activity'}</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.getElementById('modal-container').innerHTML = modal;
    }

    // Submit activity form
    submitActivityForm(event, mode, categoryName) {
        event.preventDefault();
        
        const name = document.getElementById('activity-name').value.trim();
        const emoji = document.getElementById('activity-emoji').value.trim();
        
        // Validation
        if (!name || !emoji) {
            alert('Please fill in all fields');
            return;
        }
        
        // Check for duplicates
        const category = this.customCategories[categoryName];
        if (mode === 'add' && category.activities.includes(name)) {
            alert('Activity already exists in this category!');
            return;
        }
        
        if (mode === 'edit' && name !== this.editingActivity.activity && category.activities.includes(name)) {
            alert('Activity name already exists in this category!');
            return;
        }
        
        try {
        if (mode === 'add') {
            this.addActivity(categoryName, name, emoji);
                this.showToast('Activity created successfully!', 'success');
        } else {
                this.updateActivity(categoryName, this.editingActivity.activity, name, emoji);
                this.showToast('Activity updated successfully!', 'success');
        }
        
            // Close modal and refresh displays
        this.closeModal();
        this.renderManagementScreen();
            this.updateAllDisplays();
            
        } catch (error) {
            console.error('Error saving activity:', error);
            alert('Error saving activity: ' + error.message);
        }
    }

    // Create emoji picker (always use enhanced version)
    createEmojiPicker(currentEmoji, inputId, isCategory = true) {
        const pickerId = `emoji-picker-${Date.now()}`;
        
        return `
            <div class="emoji-picker-enhanced">
                <div class="emoji-input-container">
                    <input type="text" 
                           id="${inputId}" 
                           value="${currentEmoji}" 
                           maxlength="2" 
                           placeholder="🎯"
                           readonly>
                    <button type="button" 
                            class="emoji-picker-button" 
                            onclick="management.toggleEmojiPicker('${pickerId}', '${inputId}')">
                        <span>😀</span>
                        <span>Pick Emoji</span>
                    </button>
                    </div>
                <div id="${pickerId}" class="emoji-picker-container">
                    <!-- Emoji picker will be loaded here -->
                </div>
            </div>
        `;
    }

    // Toggle emoji picker visibility
    async toggleEmojiPicker(pickerId, inputId) {
        const container = document.getElementById(pickerId);
        const isVisible = container.classList.contains('show');
        
        // Close all other emoji pickers first
        document.querySelectorAll('.emoji-picker-container.show').forEach(picker => {
            if (picker.id !== pickerId) {
                picker.classList.remove('show');
            }
        });
        
        if (isVisible) {
            container.classList.remove('show');
            // Remove body scroll lock
            this.unlockBodyScroll();
            return;
        }
        
        // Show this picker
        container.classList.add('show');
        
        // Add body scroll lock on mobile
        this.lockBodyScroll();
        
        // Load emoji picker if not already loaded
        if (!container.querySelector('emoji-picker')) {
            await this.loadEmojiPicker(container, inputId);
        }
    }

    // Load and configure emoji picker
    async loadEmojiPicker(container, inputId) {
        try {
            // Show loading state
            container.innerHTML = '<div style="padding: 2rem; text-align: center; color: #666;"><div class="loading-spinner"></div><p style="margin-top: 1rem;">Loading emoji picker...</p></div>';
            
            // Wait for emoji-picker-element to be available
            if (!customElements.get('emoji-picker')) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                if (!customElements.get('emoji-picker')) {
                    throw new Error('emoji-picker-element not loaded');
                }
            }
            
            // Create and configure emoji picker
            const picker = document.createElement('emoji-picker');
            picker.addEventListener('emoji-click', (event) => {
                const emoji = event.detail.emoji.unicode;
                const emojiInput = document.getElementById(inputId);
                if (emojiInput) {
                    emojiInput.value = emoji;
                    container.classList.remove('show');
                }
            });
            
            // Clear loading and add picker
            container.innerHTML = '';
            container.appendChild(picker);
            
            // Add click outside handler
            const handleClickOutside = (event) => {
                if (!container.contains(event.target) && !event.target.closest('.emoji-picker-button')) {
                    container.classList.remove('show');
                    document.removeEventListener('click', handleClickOutside);
                }
            };
            setTimeout(() => document.addEventListener('click', handleClickOutside), 100);
            
        } catch (error) {
            console.error('Error loading emoji picker:', error);
            // Fallback to simple picker
            container.innerHTML = `
                <div style="padding: 1rem;">
                    <p style="margin-bottom: 1rem; text-align: center; color: #666; font-size: 0.9em;">
                        Enhanced picker unavailable. Using simple selection:
                    </p>
                    <div class="emoji-presets" style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px;">
                        ${this.renderEmojiPresets(inputId)}
                    </div>
                </div>
            `;
        }
    }

    // Close all emoji pickers
    closeAllEmojiPickers() {
        document.querySelectorAll('.emoji-picker-container.show').forEach(picker => {
            picker.classList.remove('show');
        });
        // Remove body scroll lock when closing pickers
        this.unlockBodyScroll();
    }

    // Lock body scroll (for mobile emoji picker)
    lockBodyScroll() {
        if (window.innerWidth <= 768) {
            document.body.classList.add('emoji-picker-open');
        }
    }

    // Unlock body scroll
    unlockBodyScroll() {
        document.body.classList.remove('emoji-picker-open');
    }

    // Get app version for use by other modules
    getAppVersion() {
        return this.versionInfo?.version || getFullVersion();
    }

    // Get version info object
    getVersionInfo() {
        return this.versionInfo || getVersionInfo();
    }

    // Update only the categories display without affecting modals
    updateCategoriesDisplay() {
        const categoriesContainer = document.querySelector('.categories-management');
        if (categoriesContainer) {
            categoriesContainer.innerHTML = this.renderCategoriesManagement();
        }
    }

    // Update all displays that might show category/activity data
    updateAllDisplays() {
        // Update management screen if it's showing
        this.updateCategoriesDisplay();
        
        // Update activity emojis in case they changed
        if (window.app) {
            window.app.loadCustomActivityEmojis();
        }
        
        // Refresh current screen displays if we're on home or activity screens
        if (window.app && window.app.currentScreen) {
            switch (window.app.currentScreen) {
                case 'home':
                    // Refresh the category list on home screen
                    window.app.renderCategories();
                    break;
                case 'activity':
                    // Refresh the activity list if we're showing activities
                    if (window.app.currentCategory) {
                        window.app.showActivities(window.app.currentCategory);
                    }
                    break;
                // Other screens don't typically show editable category/activity data
            }
        }
    }

    // Restore default categories in case of corruption
    async restoreDefaultCategories() {
        if (!confirm('This will restore the default categories. Any custom categories will be lost. Continue?')) {
            return;
        }
        
        try {
            // Import default categories
            const { categories: defaultCategories } = await import('./data.js');
            
            // Reset to defaults
            this.customCategories = JSON.parse(JSON.stringify(defaultCategories));
            this.saveCustomCategories();
            
            // Clear editing state
            this.editingCategory = null;
            this.closeModal();
            
            // Refresh display
            this.renderManagementScreen();
            
            this.showToast('Default categories restored successfully!', 'success');
            
        } catch (error) {
            console.error('Error restoring default categories:', error);
            this.showToast('Failed to restore default categories', 'error');
        }
    }

    // Update existing category
    updateCategory(oldName, newName, color, emoji) {
        try {
            const categories = this.getCategories();
            const categoryData = categories[oldName];
            
            // Validation: check that category exists
            if (!categoryData) {
                throw new Error(`Category "${oldName}" not found`);
            }
            
            // Validation: check required fields
            if (!newName || !newName.trim()) {
                throw new Error('Category name is required');
            }
            
            if (!color) {
                throw new Error('Category color is required');
            }
            
            if (!emoji || !emoji.trim()) {
                throw new Error('Category emoji is required');
            }
            
            // Clean the new name
            newName = newName.trim();
            emoji = emoji.trim();
        
        // If name changed, need to migrate data
        if (oldName !== newName) {
            if (categories[newName]) {
                    throw new Error('Category name already exists!');
            }
            
            // Migrate time tracking data
            this.storage.migrateCategoryData(oldName, newName);
            
            // Update current category reference if user is viewing this category
            if (window.app && window.app.currentCategory === oldName) {
                window.app.currentCategory = newName;
            }
            
            // Remove old category
            delete this.customCategories[oldName];
        }
        
        // Update category (use newName which equals oldName if unchanged)
        this.customCategories[newName] = {
            ...categoryData,
            color: color,
            emoji: emoji
        };
        
        this.saveCustomCategories();
        this.editingCategory = null;
            
            return true; // Success
            
        } catch (error) {
            console.error('Error updating category:', error);
            throw error; // Re-throw for caller to handle
        }
    }

    // Add new category
    addCategory(name, color, emoji) {
        if (this.getCategories()[name]) {
            alert('Category already exists!');
            return;
        }
        
        this.customCategories[name] = {
            color: color,
            emoji: emoji,
            activities: []
        };
        
        this.saveCustomCategories();
    }

    // Delete category (soft delete)
    deleteCategory(categoryName) {
        this.closeAllMenus(); // Close any open menus
        if (!confirm(`Delete "${categoryName}" category? This will hide it from the interface but preserve historical data for reports.`)) {
            return;
        }
        
        // Use soft delete
        this.storage.softDeleteCategory(categoryName);
        
        this.renderManagementScreen();
    }

    // Refresh category form data to show current saved values
    refreshCategoryFormData() {
        if (!this.editingCategory) return;
        
        const categories = this.getCategories();
        const categoryData = categories[this.editingCategory];
        
        if (!categoryData) {
            // Category no longer exists, close the modal
            this.closeModal();
            this.showToast('Category was deleted or corrupted. Please try again.', 'error');
            return;
        }
        
        // Update form fields with current saved values
        const nameInput = document.getElementById('category-name');
        const colorInput = document.getElementById('category-color');
        const emojiInput = document.getElementById('category-emoji');
        
        if (nameInput) nameInput.value = this.editingCategory;
        if (colorInput) colorInput.value = categoryData.color;
        if (emojiInput) emojiInput.value = categoryData.emoji;
    }

    // Add activity to category
    addActivity(categoryName, activityName = null, emoji = null) {
        if (!activityName) {
            // Legacy prompt-based method for backward compatibility
            activityName = prompt(`Add new activity to "${categoryName}":`);
            if (!activityName || !activityName.trim()) return;
            activityName = activityName.trim();
        }
        
        const category = this.customCategories[categoryName];
        
        if (category.activities.includes(activityName)) {
            alert('Activity already exists in this category!');
            return;
        }
        
        category.activities.push(activityName);
        category.activities.sort(); // Keep alphabetically sorted
        
        // Save custom activity emoji if provided
        if (emoji && emoji !== '⭐') {
            this.saveActivityEmoji(activityName, emoji);
        }
        
        this.saveCustomCategories();
    }

    // Update activity
    updateActivity(categoryName, oldActivityName, newActivityName, emoji) {
        const category = this.customCategories[categoryName];
        
        if (oldActivityName !== newActivityName) {
            if (category.activities.includes(newActivityName)) {
                throw new Error('Activity already exists in this category!');
            }
            
            // Update activity name
            const index = category.activities.indexOf(oldActivityName);
            category.activities[index] = newActivityName;
            
            // Migrate custom emoji if exists
            const oldEmoji = this.getActivityEmoji(oldActivityName);
            if (oldEmoji && oldEmoji !== '⭐') {
                this.saveActivityEmoji(newActivityName, oldEmoji);
                this.removeActivityEmoji(oldActivityName);
            }
            
            // Migrate time tracking data
            this.storage.migrateActivityData(categoryName, oldActivityName, newActivityName);
        }
        
        // Save custom activity emoji
        if (emoji && emoji !== '⭐') {
            this.saveActivityEmoji(newActivityName, emoji);
        } else if (emoji === '⭐') {
            // Remove custom emoji if set back to default
            this.removeActivityEmoji(newActivityName);
        }
        
        category.activities.sort(); // Keep alphabetically sorted
        this.saveCustomCategories();
        this.editingActivity = null;
    }

    // Save custom activity emoji
    saveActivityEmoji(activityName, emoji) {
        let customEmojis = {};
        try {
            const stored = localStorage.getItem('customActivityEmojis');
            if (stored) {
                customEmojis = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error loading custom activity emojis:', error);
        }
        
        customEmojis[activityName] = emoji;
        localStorage.setItem('customActivityEmojis', JSON.stringify(customEmojis));
        
        // Update global activityEmojis for immediate use
        if (window.activityEmojis) {
            window.activityEmojis[activityName] = emoji;
        }
    }

    // Get activity emoji (custom or default)
    getActivityEmoji(activityName) {
        // Check custom emojis first
        try {
            const stored = localStorage.getItem('customActivityEmojis');
            if (stored) {
                const customEmojis = JSON.parse(stored);
                if (customEmojis[activityName]) {
                    return customEmojis[activityName];
                }
            }
        } catch (error) {
            console.error('Error loading custom activity emojis:', error);
        }
        
        // Fall back to default emojis
        return window.activityEmojis?.[activityName] || '⭐';
    }

    // Remove custom activity emoji
    removeActivityEmoji(activityName) {
        try {
            const stored = localStorage.getItem('customActivityEmojis');
            if (stored) {
                const customEmojis = JSON.parse(stored);
                if (customEmojis[activityName]) {
                    delete customEmojis[activityName];
                    localStorage.setItem('customActivityEmojis', JSON.stringify(customEmojis));
                    
                    // Update global activityEmojis
                    if (window.activityEmojis && window.activityEmojis[activityName]) {
                        delete window.activityEmojis[activityName];
                    }
                }
            }
        } catch (error) {
            console.error('Error removing custom activity emoji:', error);
        }
    }

    // Delete activity (soft delete)
    deleteActivity(categoryName, activityName) {
        if (!confirm(`Delete "${activityName}" activity? This will hide it from the interface but preserve historical data for reports.`)) {
            return;
        }
        
        // Use soft delete
        this.storage.softDeleteActivity(categoryName, activityName);
        
        this.renderManagementScreen();
    }

    // Close modal
    closeModal() {
        // Close any open emoji pickers
        this.closeAllEmojiPickers();
        
        // Clear modal content
        document.getElementById('modal-container').innerHTML = '';
        
        // Clear editing state
        this.editingActivity = null;
        
        // Refresh displays to ensure they show current state
        this.updateAllDisplays();
    }

    // Get default settings
    getDefaultSettings() {
        return {
            appTitle: 'Time Tracker',
            goalsEnabled: false,
            sessionRetentionDays: 90,
            version: '5.3.7'
        };
    }

    // Check for app updates - Enhanced with aggressive cache clearing
    async checkForUpdates() {
        const updateBtn = document.getElementById('update-btn-text');
        const originalText = updateBtn.textContent;
        
        updateBtn.textContent = 'Checking...';
        
        try {
            // First, check if there's actually an update
            const currentVersion = this.getAppVersion();
            const response = await fetch('version.json?' + Date.now());
            const versionData = await response.json();
            const latestVersion = versionData.version;
            
            if (currentVersion === latestVersion) {
                // No update needed, but user wants to refresh anyway
                updateBtn.textContent = 'Force Refresh?';
                
                const shouldRefresh = await new Promise(resolve => {
                    setTimeout(() => {
                        const userWants = confirm(
                            `You already have the latest version (${versionData.versionNumber}).\n\n` +
                            `Do you want to force refresh anyway?\n\n` +
                            `This will clear all caches and reload the app completely.`
                        );
                        resolve(userWants);
                    }, 500);
                });
                
                if (!shouldRefresh) {
                    updateBtn.textContent = originalText;
                    this.showToast('App is already up to date!', 'success');
                    return;
                }
            } else {
                // Update available
                this.showToast(`Update found: ${versionData.versionNumber}`, 'info');
            }
            
            updateBtn.textContent = 'Clearing Caches...';
            
            // AGGRESSIVE CACHE CLEARING
            
            // 1. Clear Service Worker caches
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                console.log('🗑️ Clearing all caches:', cacheNames);
                await Promise.all(
                    cacheNames.map(cacheName => {
                        console.log('🗑️ Deleting cache:', cacheName);
                        return caches.delete(cacheName);
                    })
                );
            }

            // 2. Clear service worker registration and force update
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.getRegistration();
                if (registration) {
                    console.log('🔄 Unregistering service worker for fresh start');
                    
                    // Send skip waiting message first
                    if (registration.waiting) {
                        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                    }
                    
                    await registration.unregister();
                }
            }
            
            // 3. Clear localStorage app data (but preserve user data)
            const preserveKeys = ['categories', 'activities', 'timeEntries', 'settings', 'usageStats'];
            const allKeys = Object.keys(localStorage);
            allKeys.forEach(key => {
                if (!preserveKeys.some(preserve => key.includes(preserve))) {
                    console.log('🗑️ Removing localStorage key:', key);
                    localStorage.removeItem(key);
                }
            });
            
            updateBtn.textContent = 'Reloading...';
            
            // 4. Force complete reload with cache busting
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Multiple cache busting strategies
            const now = Date.now();
            const url = new URL(window.location);
            url.searchParams.set('refresh', now);
            url.searchParams.set('v', now);
            url.searchParams.set('cache', 'false');
            
            // Nuclear option: completely replace current page
            window.location.replace(url.toString());
            
        } catch (error) {
            console.error('❌ Update check/refresh failed:', error);
            updateBtn.textContent = 'Refresh Failed';
            setTimeout(() => {
                updateBtn.textContent = originalText;
            }, 3000);
            
            this.showToast('Refresh failed. Try closing and reopening the app, or reinstalling if it\'s a PWA.', 'error');
        }
    }

    // Nuclear cache reset - for extreme cases
    async nuclearCacheReset() {
        const confirmed = confirm(
            '💥 NUCLEAR CACHE RESET\n\n' +
            'This will:\n' +
            '• Clear ALL browser caches\n' +
            '• Unregister service worker\n' +
            '• Clear ALL localStorage (except your time tracking data)\n' +
            '• Force complete app reload\n\n' +
            'Your time tracking data will be PRESERVED.\n\n' +
            'This is only for severe cache issues.\n\n' +
            'Continue?'
        );
        
        if (!confirmed) return;
        
        try {
            console.log('💥 STARTING NUCLEAR CACHE RESET');
            
            // Show progress to user
            this.showToast('💥 Nuclear reset in progress... DO NOT CLOSE THE APP!', 'warning', 10000);
            
            // 1. Clear ALL browser caches
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                console.log('💥 Nuking all caches:', cacheNames);
                await Promise.all(cacheNames.map(name => caches.delete(name)));
            }
            
            // 2. Unregister ALL service workers
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                console.log('💥 Nuking service workers:', registrations.length);
                await Promise.all(registrations.map(reg => reg.unregister()));
            }
            
            // 3. Clear ALL localStorage except essential user data
            const preserve = [
                'categories', 'activities', 'timeEntries', 'settings', 
                'usageStats', 'categoryGoals', 'customActivityEmojis'
            ];
            
            const allKeys = Object.keys(localStorage);
            allKeys.forEach(key => {
                if (!preserve.some(p => key.includes(p))) {
                    console.log('💥 Nuking localStorage key:', key);
                    localStorage.removeItem(key);
                }
            });
            
            // 4. Clear sessionStorage completely
            sessionStorage.clear();
            console.log('💥 SessionStorage nuked');
            
            // 5. Clear IndexedDB if it exists
            if ('indexedDB' in window) {
                try {
                    // This is more complex but we'll do a basic attempt
                    const databases = await indexedDB.databases();
                    for (const db of databases) {
                        if (db.name && !db.name.includes('time-tracker')) { // Don't delete our own DB
                            indexedDB.deleteDatabase(db.name);
                            console.log('💥 Nuked IndexedDB:', db.name);
                        }
                    }
                } catch (e) {
                    console.log('💥 IndexedDB clearing skipped:', e.message);
                }
            }
            
            // 6. Force immediate page replacement with maximum cache busting
            console.log('💥 Final nuclear reload...');
            
            const now = Date.now();
            const url = new URL(window.location);
            url.searchParams.set('nuclear', now);
            url.searchParams.set('refresh', now)
            url.searchParams.set('v', now);
            url.searchParams.set('cache', 'false');
            url.searchParams.set('timestamp', now);
            
            // Replace history and force complete reload
            window.location.replace(url.toString());
            
        } catch (error) {
            console.error('💥 Nuclear reset failed:', error);
            alert('Nuclear reset failed: ' + error.message + '\n\nTry manually clearing your browser cache or reinstalling the PWA.');
        }
    }

    // Render emoji presets
    renderEmojiPresets(inputId) {
        const commonEmojis = ['📚', '💼', '🏃', '🍳', '🧹', '🎮', '📺', '🛌', '🚗', '🛒', '👨‍👩‍👧‍👦', '📞', '💻', '📖', '🎨', '🎵'];
        return commonEmojis.map(emoji => 
            `<span class="emoji-preset" onclick="management.selectEmoji('${emoji}', '${inputId}')">${emoji}</span>`
        ).join('');
        // TODO: Replace with enhanced emoji-picker-element for better UX
    }

    // Select emoji preset
    selectEmoji(emoji, inputId) {
        const emojiInput = document.getElementById(inputId);
        if (emojiInput) {
            emojiInput.value = emoji;
            // Close the picker after selection
            const pickerContainer = emojiInput.closest('.emoji-picker-enhanced').querySelector('.emoji-picker-container');
            if (pickerContainer) {
                pickerContainer.classList.remove('show');
            }
        }
    }

    // Select color preset
    selectColor(color) {
        const colorInput = document.getElementById('category-color');
        if (colorInput) {
            colorInput.value = color;
        }
    }

    // Edit category
    editCategory(categoryName) {
        this.closeAllMenus(); // Close any open menus
        this.editingCategory = categoryName;
        const categories = this.getCategories();
        const categoryData = categories[categoryName];
        this.showCategoryModal('edit', categoryData);
    }

    // Show add category modal
    showAddCategoryModal() {
        this.showCategoryModal('add');
    }

    // Show category modal (add or edit)
    showCategoryModal(mode, categoryData = null) {
        const isEdit = mode === 'edit';
        const title = isEdit ? 'Edit Category' : 'Add Category';
        
        // Get current goals for this category (if editing and goals are enabled)
        const categoryName = isEdit ? this.editingCategory : '';
        const currentGoals = isEdit && window.app.goals && this.getSetting('goalsEnabled') ? window.app.goals.getCategoryGoals(categoryName) : {};
        
        // Simple form value handling - no complex conditionals
        const categoryNameValue = isEdit ? this.editingCategory : '';
        const categoryColorValue = isEdit && categoryData ? categoryData.color : '#4A90E2';
        const categoryEmojiValue = isEdit && categoryData ? categoryData.emoji : '📁';
        
        const modal = `
            <div class="modal-overlay" onclick="management.closeModal()">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h3>${title}</h3>
                        <button class="modal-close" onclick="management.closeModal()">✕</button>
                </div>
                    
                    <form id="category-form" onsubmit="management.submitCategoryForm(event, '${mode}')">
                        <div class="category-form-content">
                            <div class="form-group">
                                <label>Category Name</label>
                                <input type="text" id="category-name" 
                                       value="${categoryNameValue}" 
                                       required maxlength="30">
                            </div>
                            
                            <div class="form-group">
                                <label>Color</label>
                                <input type="color" id="category-color" 
                                       value="${categoryColorValue}" 
                                       required>
                            </div>
                            
                            <div class="form-group">
                                <label>Emoji</label>
                                ${this.createEmojiPicker(categoryEmojiValue, 'category-emoji', true)}
                            </div>
                            
                            ${isEdit && this.getSetting('goalsEnabled') ? this.renderGoalsSection(categoryName, currentGoals) : ''}
                        </div>
                        
                        <div class="modal-actions">
                            <button type="button" class="btn-secondary" onclick="management.closeModal()">Cancel</button>
                            <button type="submit" class="btn-primary">${isEdit ? 'Update Category' : 'Create Category'}</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.getElementById('modal-container').innerHTML = modal;
    }

    // Submit category form
    submitCategoryForm(event, mode) {
        event.preventDefault();
        
        const name = document.getElementById('category-name').value.trim();
        const color = document.getElementById('category-color').value;
        const emoji = document.getElementById('category-emoji').value.trim();
        
        // Validation
        if (!name || !color || !emoji) {
            alert('Please fill in all fields');
            return;
        }
        
        // Check for duplicate names (only when adding or changing name)
        const categories = this.getCategories();
        if (mode === 'add' && categories[name]) {
            alert('Category already exists!');
            return;
        }
        
        if (mode === 'edit' && name !== this.editingCategory && categories[name]) {
            const choice = confirm(`A category named "${name}" already exists.\n\nClick OK to choose a different name, or Cancel to keep your current changes in the form.`);
            if (choice) {
                // User wants to change name - focus the name input
                document.getElementById('category-name').focus();
                document.getElementById('category-name').select();
            }
            return;
        }
        
        try {
            if (mode === 'add') {
                this.addCategory(name, color, emoji);
                this.showToast('Category created successfully!', 'success');
            } else {
                this.updateCategory(this.editingCategory, name, color, emoji);
                this.showToast('Category updated successfully!', 'success');
            }
            
            // Save goals if they exist
            if (this.getSetting('goalsEnabled')) {
                this.saveGoalsFromModal(name);
            }
            
            // Close modal and refresh displays
            this.closeModal();
            this.renderManagementScreen();
            this.updateAllDisplays();
            
        } catch (error) {
            console.error('Error saving category:', error);
            alert('Error saving category: ' + error.message);
        }
    }

    // Render goals section within category modal (inline goals)
    renderGoalsSection(categoryName, currentGoals) {
        const dailyGoal = currentGoals.daily ? Math.floor(currentGoals.daily.target / 60) : 0;
        const weeklyGoal = currentGoals.weekly ? Math.floor(currentGoals.weekly.target / 60) : 0;
        const monthlyGoal = currentGoals.monthly ? Math.floor(currentGoals.monthly.target / 60) : 0;
        
        const dailyProgress = currentGoals.daily ? window.app.goals.calculateProgress(categoryName, 'daily') : null;
        const weeklyProgress = currentGoals.weekly ? window.app.goals.calculateProgress(categoryName, 'weekly') : null;
        const monthlyProgress = currentGoals.monthly ? window.app.goals.calculateProgress(categoryName, 'monthly') : null;
        
        return `
            <div class="goals-section">
                <h4>🎯 Goals (Optional)</h4>
                <div class="goals-grid">
                    <div class="goal-input-group">
                        <label>Daily Goal (minutes)</label>
                        <input type="number" id="daily-goal" value="${dailyGoal}" min="0" max="1440" step="15">
                        ${dailyProgress ? `<div class="goal-progress">Current: ${Math.round(dailyProgress.percentage)}% (${Math.floor(dailyProgress.actual / 60)}min)</div>` : ''}
                    </div>
                    <div class="goal-input-group">
                        <label>Weekly Goal (minutes)</label>
                        <input type="number" id="weekly-goal" value="${weeklyGoal}" min="0" max="10080" step="30">
                        ${weeklyProgress ? `<div class="goal-progress">Current: ${Math.round(weeklyProgress.percentage)}% (${Math.floor(weeklyProgress.actual / 60)}min)</div>` : ''}
                    </div>
                    <div class="goal-input-group">
                        <label>Monthly Goal (minutes)</label>
                        <input type="number" id="monthly-goal" value="${monthlyGoal}" min="0" max="43200" step="60">
                        ${monthlyProgress ? `<div class="goal-progress">Current: ${Math.round(monthlyProgress.percentage)}% (${Math.floor(monthlyProgress.actual / 60)}min)</div>` : ''}
                    </div>
                    </div>
                </div>
            `;
    }

    // Save goals from modal (simplified)
    saveGoalsFromModal(categoryName) {
        try {
            const dailyInput = document.getElementById('daily-goal');
            const weeklyInput = document.getElementById('weekly-goal');
            const monthlyInput = document.getElementById('monthly-goal');
            
            if (dailyInput) {
                const minutes = parseInt(dailyInput.value) || 0;
                if (minutes > 0) {
                    window.app.goals.setGoal(categoryName, 'daily', minutes * 60);
                } else {
                    // Remove goal if set to 0
                    if (window.app.goals.goals[categoryName] && window.app.goals.goals[categoryName].daily) {
                        delete window.app.goals.goals[categoryName].daily;
                    }
                }
            }
            
            if (weeklyInput) {
                const minutes = parseInt(weeklyInput.value) || 0;
                if (minutes > 0) {
                    window.app.goals.setGoal(categoryName, 'weekly', minutes * 60);
                } else {
                    if (window.app.goals.goals[categoryName] && window.app.goals.goals[categoryName].weekly) {
                        delete window.app.goals.goals[categoryName].weekly;
                    }
                }
            }
            
            if (monthlyInput) {
                const minutes = parseInt(monthlyInput.value) || 0;
                if (minutes > 0) {
                    window.app.goals.setGoal(categoryName, 'monthly', minutes * 60);
                } else {
                    if (window.app.goals.goals[categoryName] && window.app.goals.goals[categoryName].monthly) {
                        delete window.app.goals.goals[categoryName].monthly;
                    }
                }
            }
            
            // Clean up empty goal categories
            if (window.app.goals.goals[categoryName] && Object.keys(window.app.goals.goals[categoryName]).length === 0) {
                delete window.app.goals.goals[categoryName];
            }
            
            // Save goals
            window.app.goals.saveGoals();
            
        } catch (error) {
            console.error('Error saving goals:', error);
        }
    }
} 