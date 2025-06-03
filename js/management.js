// Category & Activity Management Module
import { categories as defaultCategories, activityEmojis } from './data.js';

export class Management {
    constructor(storage) {
        this.storage = storage;
        this.customCategories = null;
        this.editingCategory = null;
        this.editingActivity = null;
        this.collapsedCategories = new Set(); // Track collapsed categories
        this.currentTab = 'categories'; // Track active tab
        this.settings = null; // App settings
        this.goalSaveTimeout = null;
        this.versionInfo = null; // Will store version info from JSON
        
        // Load version info from JSON
        this.loadVersionInfo();
        
        // Load settings
        this.loadSettings();
    }

    // Load version information from version.json
    async loadVersionInfo() {
        try {
            const response = await fetch('version.json?' + Date.now());
            this.versionInfo = await response.json();
            console.log('Management: Version info loaded:', this.versionInfo);
        } catch (error) {
            console.error('Management: Failed to load version info:', error);
            // Fallback to hardcoded version
            this.versionInfo = {
                version: "5.1.6 - UI/UX Improvements & Comprehensive Help Update",
                versionNumber: "5.1.6",
                description: "UI/UX Improvements & Comprehensive Help Update"
            };
        }
    }

    // Initialize management with custom or default categories and settings
    init() {
        this.loadCustomCategories();
        this.loadSettings();
    }

    // Load settings from storage or set defaults
    loadSettings() {
        console.log('Management: Loading settings...');
        const stored = this.storage.getSettings();
        
        if (stored) {
            this.settings = stored;
            // Check for version updates and migrate if needed
            if (!this.settings.version || this.settings.version === "1.0" || this.settings.version === "5.1.0 - UX Polish" || this.settings.version === "5.1.2 - Bug Fixes" || this.settings.version === "5.1.3 - Bug Fixes & Enhancements" || this.settings.version === "5.1.4 - Enhanced Emoji Picker" || this.settings.version === "5.1.4+ - Streak Calculation Fix") {
                this.settings.version = this.versionInfo.version;
                this.saveSettings();
                console.log('Management: Updated version to', this.versionInfo.version);
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
        this.settings[key] = value;
        this.saveSettings();
        
        // Apply changes immediately
        if (key === 'appTitle') {
            this.updateAppTitle();
        } else if (key === 'goalsEnabled') {
            // Handle goals toggle change
            this.handleGoalsToggle(value);
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

    // Render the management screen with tabs
    renderManagementScreen() {
        const container = document.getElementById('management-content');
        container.innerHTML = `
            <div class="management-header">
                <h2>⚙️ Manage</h2>
                <div class="management-tabs">
                    <button class="tab-button ${this.currentTab === 'categories' ? 'active' : ''}" 
                            onclick="management.switchTab('categories')">
                        📁 Categories & Activities
                    </button>
                    <button class="tab-button ${this.currentTab === 'settings' ? 'active' : ''}" 
                            onclick="management.switchTab('settings')">
                        ⚙️ Settings
                    </button>
                </div>
            </div>
            
            <div class="tab-content">
                ${this.currentTab === 'categories' ? this.renderCategoriesTab() : this.renderSettingsTab()}
            </div>
            
            <!-- Modals will be added here -->
            <div id="modal-container"></div>
        `;
    }

    // Render categories and activities tab
    renderCategoriesTab() {
        return `
            <div class="tab-header">
                <div class="management-actions">
                    <button class="btn-secondary" onclick="management.toggleAllCategories()">
                        ${this.collapsedCategories.size > 0 ? '📂 Expand All' : '📁 Collapse All'}
                    </button>
                    <button class="btn-primary" onclick="management.showAddCategoryModal()">
                        ➕ Add Category
                    </button>
                </div>
            </div>
            
            <div class="categories-management">
                ${this.renderCategoriesManagement()}
            </div>
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
                                <label for="goals-enabled">Goals & Progress Tracking</label>
                                <div class="toggle-switch">
                                    <input type="checkbox" 
                                           id="goals-enabled" 
                                           ${this.settings.goalsEnabled ? 'checked' : ''}
                                           onchange="management.updateSetting('goalsEnabled', this.checked)">
                                    <span class="toggle-slider" onclick="document.getElementById('goals-enabled').click()"></span>
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
                        <p><strong>Version:</strong> ${this.versionInfo ? this.versionInfo.versionNumber : this.settings.version}</p>
                        ${this.versionInfo ? `<p><strong>Release:</strong> ${this.versionInfo.description}</p>` : ''}
                        ${this.versionInfo && this.versionInfo.timestamp ? `<p><strong>Updated:</strong> ${new Date(this.versionInfo.timestamp).toLocaleDateString()}</p>` : ''}
                        <p><strong>Categories:</strong> ${Object.keys(this.getCategories()).length}</p>
                        <p><strong>Total Activities:</strong> ${Object.values(this.getCategories()).reduce((sum, cat) => sum + cat.activities.length, 0)}</p>
                        ${this.versionInfo && this.versionInfo.features ? `
                            <details style="margin-top: 1rem;">
                                <summary style="cursor: pointer; font-weight: 600; color: #4A90E2;">Latest Features</summary>
                                <ul style="margin: 0.5rem 0 0 1rem; font-size: 0.9em; color: #666;">
                                    ${this.versionInfo.features.map(feature => `<li>${feature}</li>`).join('')}
                                </ul>
                            </details>
                        ` : ''}
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

    // Toggle all categories collapse/expand
    toggleAllCategories() {
        const categories = this.getCategories();
        if (this.collapsedCategories.size > 0) {
            // Expand all
            this.collapsedCategories.clear();
        } else {
            // Collapse all
            Object.keys(categories).forEach(name => {
                this.collapsedCategories.add(name);
            });
        }
        this.renderManagementScreen();
    }

    // Render categories management list
    renderCategoriesManagement() {
        const categories = this.getCategories();
        
        return Object.entries(categories).map(([categoryName, categoryData], index) => {
            const isCollapsed = this.collapsedCategories.has(categoryName);
            return `
                <div class="category-management-item" data-category="${categoryName}">
                    <div class="category-header">
                        <div class="category-info">
                            <button class="collapse-button" onclick="management.toggleCategoryCollapse('${categoryName}')" title="${isCollapsed ? 'Expand' : 'Collapse'} activities">
                                ${isCollapsed ? '▶️' : '▼️'}
                            </button>
                            <div class="category-color-preview" style="background-color: ${categoryData.color}"></div>
                            <span class="category-emoji">${categoryData.emoji}</span>
                            <h3 class="category-title">${categoryName}</h3>
                            <span class="activity-count">${categoryData.activities.length} activities</span>
                        </div>
                        <div class="category-actions">
                            <button class="btn-icon" onclick="management.editCategory('${categoryName}')" title="Edit Category">
                                ✏️
                            </button>
                            <button class="btn-icon" onclick="management.showAddActivityModal('${categoryName}')" title="Add Activity">
                                ➕
                            </button>
                            ${Object.keys(categories).length > 1 ? `
                                <button class="btn-icon btn-danger" onclick="management.deleteCategory('${categoryName}')" title="Delete Category">
                                    🗑️
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="activities-list ${isCollapsed ? 'collapsed' : ''}">
                        ${this.renderActivitiesForCategory(categoryName, categoryData.activities)}
                    </div>
                </div>
            `;
        }).join('');
    }

    // Render activities for a category (sorted alphabetically)
    renderActivitiesForCategory(categoryName, activities) {
        const sortedActivities = [...activities].sort();
        
        return sortedActivities.map(activity => {
            const emoji = this.getActivityEmoji(activity);
            return `
                <div class="activity-management-item" data-activity="${activity}">
                    <div class="activity-info">
                        <span class="activity-emoji">${emoji}</span>
                        <span class="activity-name">${activity}</span>
                    </div>
                    <div class="activity-actions">
                        <button class="btn-icon" onclick="management.editActivity('${categoryName}', '${activity}')" title="Edit Activity">
                            ✏️
                        </button>
                        <button class="btn-icon btn-danger" onclick="management.deleteActivity('${categoryName}', '${activity}')" title="Delete Activity">
                            🗑️
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Show add activity modal
    showAddActivityModal(categoryName) {
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
                    
                    <div class="activity-form-content">
                        <div class="form-group">
                            <label>Activity Name</label>
                            <input type="text" id="activity-name" 
                                   value="${isEdit ? activityName : ''}" 
                                   required maxlength="30"
                                   ${isEdit ? `oninput="management.autoSaveActivityField('name', this, '${categoryName}')" onchange="management.autoSaveActivityField('name', this, '${categoryName}')"` : ''}>
                            <span class="field-save-status" id="activity-name-save-status"></span>
                        </div>
                        
                        <div class="form-group">
                            <label>Emoji</label>
                            ${this.createEmojiPicker(currentEmoji, 'activity-emoji', false)}
                            <span class="field-save-status" id="activity-emoji-save-status"></span>
                        </div>
                        
                        <div class="modal-actions">
                            <button type="button" class="btn-secondary" onclick="management.closeModal()">Close</button>
                            ${!isEdit ? `<button type="button" class="btn-primary" onclick="management.createNewActivity('${categoryName}')">Create Activity</button>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('modal-container').innerHTML = modal;
        
        // Set up emoji picker change handler for autosave
        if (isEdit) {
            const emojiInput = document.getElementById('activity-emoji');
            if (emojiInput) {
                emojiInput.addEventListener('input', () => {
                    this.autoSaveActivityField('emoji', emojiInput, categoryName);
                });
            }
        }
    }

    // Create emoji picker (always use enhanced version)
    createEmojiPicker(currentEmoji, inputId, isCategory = true) {
        return this.createEnhancedEmojiPicker(currentEmoji, inputId, isCategory);
    }

    // Render activity-specific emoji presets
    renderActivityEmojiPresets() {
        const emojis = [
            '⭐', '🎨', '🎵', '🎸', '🎹', '🎤', '✍️', '📚', '💪', '🏃', '🚶', '🧘', 
            '🤸', '🥋', '☕', '🍽️', '🚿', '😴', '🔨', '🧹', '🍳', '🌱', '🏠', '🛒', 
            '👋', '🤗', '💄', '🫁', '🌍', '☀️', '💆', '🧵', '📋', '🌳'
        ];
        return emojis.map(emoji => 
            `<span class="emoji-preset" onclick="management.selectEmoji('${emoji}', 'activity')">${emoji}</span>`
        ).join('');
    }

    // Submit activity form
    submitActivityForm(event, mode, categoryName) {
        event.preventDefault();
        
        const name = document.getElementById('activity-name').value.trim();
        const emoji = document.getElementById('activity-emoji').value.trim();
        
        if (!name || !emoji) {
            alert('Please fill in all fields');
            return;
        }
        
        if (mode === 'add') {
            this.addActivity(categoryName, name, emoji);
        } else {
            this.updateActivity(this.editingActivity.category, this.editingActivity.activity, name, emoji);
        }
        
        this.closeModal();
        this.renderManagementScreen();
    }

    // Show add category modal
    showAddCategoryModal() {
        this.showCategoryModal('add');
    }

    // Edit category
    editCategory(categoryName) {
        this.editingCategory = categoryName;
        this.showCategoryModal('edit', this.getCategories()[categoryName]);
    }

    // Show category modal (add or edit)
    showCategoryModal(mode, categoryData = null) {
        const isEdit = mode === 'edit';
        const title = isEdit ? 'Edit Category' : 'Add Category';
        
        // Get current goals for this category (if editing and goals are enabled)
        const categoryName = isEdit ? this.editingCategory : '';
        const currentGoals = isEdit && window.app.goals && this.getSetting('goalsEnabled') ? window.app.goals.getCategoryGoals(categoryName) : {};
        
        const modal = `
            <div class="modal-overlay" onclick="management.closeModal()">
                <div class="modal-content category-modal-extended" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h3>${title}</h3>
                        <button class="modal-close" onclick="management.closeModal()">✕</button>
                    </div>
                    
                    <div class="category-form-content">
                        <div class="form-group">
                            <label>Category Name</label>
                            <input type="text" id="category-name" 
                                   value="${categoryData?.name || categoryData ? this.editingCategory : ''}" 
                                   required maxlength="30"
                                   oninput="management.autoSaveCategoryField('name', this)"
                                   onchange="management.autoSaveCategoryField('name', this)">
                            <span class="field-save-status" id="name-save-status"></span>
                        </div>
                        
                        <div class="form-group">
                            <label>Color</label>
                            <div class="color-picker">
                                <input type="color" id="category-color" 
                                       value="${categoryData?.color || '#4A90E2'}"
                                       onchange="management.autoSaveCategoryField('color', this)">
                                <div class="color-presets">
                                    ${this.renderColorPresets()}
                                </div>
                            </div>
                            <span class="field-save-status" id="color-save-status"></span>
                        </div>
                        
                        <div class="form-group">
                            <label>Emoji</label>
                            ${this.createEmojiPicker(categoryData?.emoji || '📁', 'category-emoji', true)}
                            <span class="field-save-status" id="emoji-save-status"></span>
                        </div>
                        
                        ${isEdit && this.getSetting('goalsEnabled') ? this.renderGoalsSection(categoryName, currentGoals) : ''}
                        
                        <div class="modal-actions">
                            <button type="button" class="btn-secondary" onclick="management.closeModal()">Close</button>
                            ${!isEdit ? `<button type="button" class="btn-primary" onclick="management.createNewCategory()">Create Category</button>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('modal-container').innerHTML = modal;
        
        // Set up emoji picker change handler for autosave
        if (isEdit) {
            const emojiInput = document.getElementById('category-emoji');
            if (emojiInput) {
                emojiInput.addEventListener('input', () => {
                    this.autoSaveCategoryField('emoji', emojiInput);
                });
            }
        }
    }

    // Render color presets
    renderColorPresets() {
        const colors = ['#e74c3c', '#f39c12', '#27ae60', '#3498db', '#9b59b6', '#e67e22', '#95a5a6', '#34495e'];
        return colors.map(color => 
            `<div class="color-preset" style="background-color: ${color}" onclick="management.selectColor('${color}')"></div>`
        ).join('');
    }

    // Render emoji presets
    renderEmojiPresets() {
        const commonEmojis = ['📚', '💼', '🏃', '🍳', '🧹', '🎮', '📺', '🛌', '🚗', '🛒', '👨‍👩‍👧‍👦', '📞', '💻', '📖', '🎨', '🎵'];
        return commonEmojis.map(emoji => 
            `<span class="emoji-preset" onclick="management.selectEmoji('${emoji}', 'category')">${emoji}</span>`
        ).join('');
        // TODO: Replace with enhanced emoji-picker-element for better UX
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
            <div class="form-section">
                <h4>🎯 Time Goals</h4>
                <p class="form-section-description">Set daily, weekly, or monthly time goals for this category</p>
                
                <div class="goals-grid">
                    <div class="goal-input-card">
                        <label>Daily Goal</label>
                        ${dailyProgress ? `<span class="goal-progress-hint">${Math.round(dailyProgress.percentage)}% today</span>` : ''}
                        <div class="goal-input-group">
                            <input type="number" 
                                   id="daily-goal" 
                                   value="${dailyGoal}" 
                                   min="0" 
                                   max="1440" 
                                   placeholder="0" 
                                   onchange="management.autoSaveGoalInModal('${categoryName}', 'daily', this)"
                                   oninput="management.showGoalSavingIndicator(this, 'daily')">
                            <span class="goal-unit">minutes</span>
                            <span class="goal-save-status" id="daily-goal-status"></span>
                        </div>
                    </div>
                    
                    <div class="goal-input-card">
                        <label>Weekly Goal</label>
                        ${weeklyProgress ? `<span class="goal-progress-hint">${Math.round(weeklyProgress.percentage)}% this week</span>` : ''}
                        <div class="goal-input-group">
                            <input type="number" 
                                   id="weekly-goal" 
                                   value="${weeklyGoal}" 
                                   min="0" 
                                   max="10080" 
                                   placeholder="0"
                                   onchange="management.autoSaveGoalInModal('${categoryName}', 'weekly', this)"
                                   oninput="management.showGoalSavingIndicator(this, 'weekly')">
                            <span class="goal-unit">minutes</span>
                            <span class="goal-save-status" id="weekly-goal-status"></span>
                        </div>
                    </div>
                    
                    <div class="goal-input-card">
                        <label>Monthly Goal</label>
                        ${monthlyProgress ? `<span class="goal-progress-hint">${Math.round(monthlyProgress.percentage)}% this month</span>` : ''}
                        <div class="goal-input-group">
                            <input type="number" 
                                   id="monthly-goal" 
                                   value="${monthlyGoal}" 
                                   min="0" 
                                   max="43200" 
                                   placeholder="0"
                                   onchange="management.autoSaveGoalInModal('${categoryName}', 'monthly', this)"
                                   oninput="management.showGoalSavingIndicator(this, 'monthly')">
                            <span class="goal-unit">minutes</span>
                            <span class="goal-save-status" id="monthly-goal-status"></span>
                        </div>
                    </div>
                </div>
                
                <div class="goal-hint">
                    💡 Goals auto-save as you type. Set to 0 to remove a goal.
                </div>
            </div>
        `;
    }

    // Select color preset
    selectColor(color) {
        const colorInput = document.getElementById('category-color');
        if (colorInput) {
            colorInput.value = color;
            // Trigger autosave if in edit mode
            if (this.editingCategory) {
                this.autoSaveCategoryField('color', colorInput);
            }
        }
    }

    // Select emoji preset
    selectEmoji(emoji, type = 'category') {
        const inputId = type === 'category' ? 'category-emoji' : 'activity-emoji';
        const emojiInput = document.getElementById(inputId);
        if (emojiInput) {
            emojiInput.value = emoji;
            // Trigger autosave if in edit mode
            if (type === 'category' && this.editingCategory) {
                this.autoSaveCategoryField('emoji', emojiInput);
            } else if (type === 'activity' && this.editingActivity) {
                this.autoSaveActivityField('emoji', emojiInput, this.editingActivity.category);
            }
        }
    }

    // Submit category form
    submitCategoryForm(event, mode) {
        event.preventDefault();
        
        const name = document.getElementById('category-name').value.trim();
        const color = document.getElementById('category-color').value;
        const emoji = document.getElementById('category-emoji').value.trim();
        
        if (!name || !color || !emoji) {
            alert('Please fill in all fields');
            return;
        }
        
        if (mode === 'add') {
            this.addCategory(name, color, emoji);
        } else {
            this.updateCategory(this.editingCategory, name, color, emoji);
        }
        
        // Save the category to data
        const success = this.storage.saveCategory(name, this.getCategories()[name]);
        
        if (success) {
            // Goals are now auto-saved individually, no need to save from form
            this.showToast(`Category ${mode === 'edit' ? 'updated' : 'created'} successfully!`, 'success');
            this.closeModal();
            this.renderTab(); // Refresh the current tab
        } else {
            this.showToast('Failed to save category', 'error');
        }
    }

    // Auto-save goal from category modal
    autoSaveGoalInModal(categoryName, period, inputElement) {
        // Only save goals if the feature is enabled
        if (!window.app.goals || !this.getSetting('goalsEnabled')) return;
        
        const minutes = parseInt(inputElement.value) || 0;
        const statusElement = document.getElementById(`${period}-goal-status`);
        
        // Show saving indicator
        if (statusElement) {
            statusElement.innerHTML = `<span class="goal-saving">💾</span>`;
            statusElement.className = 'goal-save-status saving';
        }
        
        // Debounce save to prevent too many calls
        clearTimeout(this.goalSaveTimeout);
        this.goalSaveTimeout = setTimeout(() => {
            try {
                if (minutes > 0) {
                    window.app.goals.setGoal(categoryName, period, minutes * 60); // Convert to seconds
                } else {
                    // Remove goal
                    if (window.app.goals.goals[categoryName]) {
                        delete window.app.goals.goals[categoryName][period];
                        if (Object.keys(window.app.goals.goals[categoryName]).length === 0) {
                            delete window.app.goals.goals[categoryName];
                        }
                    }
                }
                
                window.app.goals.saveGoals();
                
                // Show success indicator
                if (statusElement) {
                    statusElement.innerHTML = `<span class="goal-saved">✓</span>`;
                    statusElement.className = 'goal-save-status saved';
                    
                    // Hide success indicator after 2 seconds
                    setTimeout(() => {
                        statusElement.innerHTML = '';
                        statusElement.className = 'goal-save-status';
                    }, 2000);
                }
                
                // Trigger goal calculation for daily goals
                if (period === 'daily') {
                    this.handleDailyGoalAutoCalculation(inputElement);
                }
                
                // Refresh goals UI if needed
                if (window.app?.renderGoalsUI) {
                    window.app.renderGoalsUI();
                }
                
            } catch (error) {
                console.error('Error auto-saving goal in modal:', error);
                if (statusElement) {
                    statusElement.innerHTML = `<span class="goal-error">⚠️</span>`;
                    statusElement.className = 'goal-save-status error';
                }
            }
        }, 500); // 500ms debounce
    }
    
    // Show saving indicator while typing
    showGoalSavingIndicator(inputElement, period) {
        const statusElement = document.getElementById(`${period}-goal-status`);
        if (statusElement) {
            statusElement.innerHTML = `<span class="goal-typing">✏️</span>`;
            statusElement.className = 'goal-save-status typing';
        }
    }
    
    // Handle daily goal auto-calculation (optional feature)
    handleDailyGoalAutoCalculation(dailyInput) {
        const weeklyInput = document.getElementById('weekly-goal');
        const monthlyInput = document.getElementById('monthly-goal');
        
        if (!weeklyInput || !monthlyInput) return;
        
        const dailyValue = parseInt(dailyInput.value) || 0;
        const currentWeekly = parseInt(weeklyInput.value) || 0;
        const currentMonthly = parseInt(monthlyInput.value) || 0;
        
        // Only auto-calculate if weekly and monthly are currently 0 and daily > 0
        if (dailyValue > 0 && currentWeekly === 0 && currentMonthly === 0) {
            const suggestedWeekly = dailyValue * 7;
            const suggestedMonthly = dailyValue * 30;
            
            weeklyInput.value = suggestedWeekly;
            monthlyInput.value = suggestedMonthly;
            
            // Auto-save the calculated values
            if (window.app.goals) {
                window.app.goals.setGoal(this.editingCategory || 'Unknown', 'weekly', suggestedWeekly * 60);
                window.app.goals.setGoal(this.editingCategory || 'Unknown', 'monthly', suggestedMonthly * 60);
                window.app.goals.saveGoals();
            }
            
            // Visual feedback
            weeklyInput.style.background = '#e8f5e8';
            monthlyInput.style.background = '#e8f5e8';
            
            setTimeout(() => {
                weeklyInput.style.background = '';
                monthlyInput.style.background = '';
            }, 1500);
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

    // Update existing category
    updateCategory(oldName, newName, color, emoji) {
        const categories = this.getCategories();
        const categoryData = categories[oldName];
        
        // If name changed, need to migrate data
        if (oldName !== newName) {
            if (categories[newName]) {
                alert('Category name already exists!');
                return;
            }
            
            // Migrate time tracking data
            this.storage.migrateCategoryData(oldName, newName);
            
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
    }

    // Delete category (soft delete)
    deleteCategory(categoryName) {
        if (!confirm(`Delete "${categoryName}" category? This will hide it from the interface but preserve historical data for reports.`)) {
            return;
        }
        
        // Use soft delete
        this.storage.softDeleteCategory(categoryName);
        
        this.renderManagementScreen();
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
                alert('Activity already exists in this category!');
                return;
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
        this.editingCategory = null;
        this.editingActivity = null;
    }

    getDefaultSettings() {
        return {
            appTitle: "Alona's Activity Tracker",
            goalsEnabled: true,
            quickStartCount: 6,
            sessionRetentionDays: 60,
            version: this.versionInfo.version
        };
    }

    // Check for app updates - Simplified approach
    async checkForUpdates() {
        const updateBtn = document.getElementById('update-btn-text');
        const originalText = updateBtn.textContent;
        
        updateBtn.textContent = 'Refreshing...';
        
        try {
            // Clear all caches
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                console.log('Management: Clearing all caches:', cacheNames);
                await Promise.all(
                    cacheNames.map(cacheName => {
                        console.log('Management: Deleting cache:', cacheName);
                        return caches.delete(cacheName);
                    })
                );
            }

            // Clear service worker and force update
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.getRegistration();
                if (registration) {
                    console.log('Management: Unregistering service worker for fresh start');
                    await registration.unregister();
                }
            }
            
            updateBtn.textContent = 'Reloading...';
            
            // Short delay then hard reload
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Force complete reload with cache busting
            window.location.href = window.location.href.split('?')[0] + '?refresh=' + Date.now();
            
        } catch (error) {
            console.error('Management: Update failed:', error);
            updateBtn.textContent = 'Refresh Failed';
            setTimeout(() => {
                updateBtn.textContent = originalText;
            }, 3000);
            
            this.showToast('Refresh failed. Try reloading the page manually.', 'error');
        }
    }

    // Enhanced emoji picker methods
    createEnhancedEmojiPicker(currentEmoji, inputId, isCategory = true) {
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
        
        // Close all other emoji pickers
        document.querySelectorAll('.emoji-picker-container.show').forEach(picker => {
            if (picker.id !== pickerId) {
                picker.classList.remove('show');
            }
        });
        
        if (isVisible) {
            container.classList.remove('show');
            return;
        }
        
        // Show this picker
        container.classList.add('show');
        
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
                    emojiInput.dispatchEvent(new Event('change', { bubbles: true }));
                    
                    // Trigger autosave if in edit mode
                    if (inputId === 'category-emoji' && this.editingCategory) {
                        this.autoSaveCategoryField('emoji', emojiInput);
                    } else if (inputId === 'activity-emoji' && this.editingActivity) {
                        this.autoSaveActivityField('emoji', emojiInput, this.editingActivity.category);
                    }
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
                        ${this.renderEmojiPresets()}
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
    }

    // Get app version for use by other modules
    getAppVersion() {
        return this.versionInfo?.version || "5.1.6 - UI/UX Improvements & Comprehensive Help Update";
    }

    // Auto-save category field
    autoSaveCategoryField(field, inputElement) {
        // Only autosave for edit mode
        if (!this.editingCategory) return;
        
        const value = inputElement.value.trim();
        const statusElement = document.getElementById(`${field}-save-status`);
        
        // Show saving indicator
        if (statusElement) {
            statusElement.innerHTML = `<span class="field-saving">💾</span>`;
            statusElement.className = 'field-save-status saving';
        }
        
        // Debounce save to prevent too many calls
        clearTimeout(this.categorySaveTimeout);
        this.categorySaveTimeout = setTimeout(() => {
            try {
                if (field === 'name') {
                    // For name changes, we need to handle category renaming
                    if (value && value !== this.editingCategory) {
                        this.updateCategory(this.editingCategory, value, 
                            document.getElementById('category-color').value,
                            document.getElementById('category-emoji').value);
                        this.editingCategory = value; // Update the editing reference
                    }
                } else if (field === 'color') {
                    this.updateCategory(this.editingCategory, this.editingCategory, value,
                        document.getElementById('category-emoji').value);
                } else if (field === 'emoji') {
                    this.updateCategory(this.editingCategory, this.editingCategory,
                        document.getElementById('category-color').value, value);
                }
                
                // Show success indicator
                if (statusElement) {
                    statusElement.innerHTML = `<span class="field-saved">✓</span>`;
                    statusElement.className = 'field-save-status saved';
                    
                    // Hide success indicator after 2 seconds
                    setTimeout(() => {
                        statusElement.innerHTML = '';
                        statusElement.className = 'field-save-status';
                    }, 2000);
                }
                
                // Refresh the management screen to show changes
                this.renderManagementScreen();
                
            } catch (error) {
                console.error('Error auto-saving category field:', error);
                if (statusElement) {
                    statusElement.innerHTML = `<span class="field-error">⚠️</span>`;
                    statusElement.className = 'field-save-status error';
                }
            }
        }, 500); // 500ms debounce
    }

    // Create new category
    createNewCategory() {
        const name = document.getElementById('category-name').value.trim();
        const color = document.getElementById('category-color').value;
        const emoji = document.getElementById('category-emoji').value.trim();
        
        if (!name || !color || !emoji) {
            alert('Please fill in all fields');
            return;
        }
        
        this.addCategory(name, color, emoji);
        this.showToast('Category created successfully!', 'success');
        this.closeModal();
        this.renderManagementScreen();
    }

    // Auto-save activity field
    autoSaveActivityField(field, inputElement, categoryName) {
        // Only autosave for edit mode
        if (!this.editingActivity) return;
        
        const value = inputElement.value.trim();
        const statusElement = document.getElementById(`activity-${field}-save-status`);
        
        // Show saving indicator
        if (statusElement) {
            statusElement.innerHTML = `<span class="field-saving">💾</span>`;
            statusElement.className = 'field-save-status saving';
        }
        
        // Debounce save to prevent too many calls
        clearTimeout(this.activitySaveTimeout);
        this.activitySaveTimeout = setTimeout(() => {
            try {
                if (field === 'name') {
                    // For name changes, we need to handle activity renaming
                    if (value && value !== this.editingActivity.activity) {
                        this.updateActivity(this.editingActivity.category, this.editingActivity.activity, value,
                            this.getActivityEmoji(value));
                        this.editingActivity.activity = value; // Update the editing reference
                    }
                } else if (field === 'emoji') {
                    this.updateActivity(this.editingActivity.category, this.editingActivity.activity, this.editingActivity.activity,
                        value);
                }
                
                // Show success indicator
                if (statusElement) {
                    statusElement.innerHTML = `<span class="field-saved">✓</span>`;
                    statusElement.className = 'field-save-status saved';
                    
                    // Hide success indicator after 2 seconds
                    setTimeout(() => {
                        statusElement.innerHTML = '';
                        statusElement.className = 'field-save-status';
                    }, 2000);
                }
                
                // Refresh the management screen to show changes
                this.renderManagementScreen();
                
            } catch (error) {
                console.error('Error auto-saving activity field:', error);
                if (statusElement) {
                    statusElement.innerHTML = `<span class="field-error">⚠️</span>`;
                    statusElement.className = 'field-save-status error';
                }
            }
        }, 500); // 500ms debounce
    }

    // Create new activity
    createNewActivity(categoryName) {
        const name = document.getElementById('activity-name').value.trim();
        const emoji = document.getElementById('activity-emoji').value.trim();
        
        if (!name || !emoji) {
            alert('Please fill in all fields');
            return;
        }
        
        this.addActivity(categoryName, name, emoji);
        this.showToast('Activity created successfully!', 'success');
        this.closeModal();
        this.renderManagementScreen();
    }

    // Get version info object
    getVersionInfo() {
        return this.versionInfo;
    }
} 