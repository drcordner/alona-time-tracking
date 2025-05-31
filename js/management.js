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
        
        // Load settings
        this.loadSettings();
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
            if (!this.settings.version || this.settings.version === "1.0" || this.settings.version === "5.1.0 - UX Polish") {
                this.settings.version = "5.1.2 - Bug Fixes";
                this.saveSettings();
                console.log('Management: Updated version to 5.1.2 - Bug Fixes');
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
                    <h3>📊 Data Management</h3>
                    <div class="settings-grid">
                        <div class="setting-item">
                            <label for="session-retention">Session Detail Retention</label>
                            <select id="session-retention" 
                                    class="input-base input-medium"
                                    onchange="management.updateSetting('sessionRetentionDays', parseInt(this.value))">
                                <option value="30" ${this.settings.sessionRetentionDays === 30 ? 'selected' : ''}>30 days</option>
                                <option value="60" ${this.settings.sessionRetentionDays === 60 ? 'selected' : ''}>60 days</option>
                                <option value="90" ${this.settings.sessionRetentionDays === 90 ? 'selected' : ''}>90 days</option>
                                <option value="180" ${this.settings.sessionRetentionDays === 180 ? 'selected' : ''}>6 months</option>
                                <option value="365" ${this.settings.sessionRetentionDays === 365 ? 'selected' : ''}>1 year</option>
                            </select>
                            <p class="setting-description">
                                How long to keep detailed session data for timeline views. 
                                Older sessions are automatically removed to save storage space. 
                                Statistical summaries are always preserved.
                            </p>
                        </div>
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
                        <p><strong>Version:</strong> ${this.settings.version}</p>
                        <p><strong>Categories:</strong> ${Object.keys(this.getCategories()).length}</p>
                        <p><strong>Total Activities:</strong> ${Object.values(this.getCategories()).reduce((sum, cat) => sum + cat.activities.length, 0)}</p>
                    </div>
                </div>
            </div>
        `;
    }

    // Export data functionality
    exportData() {
        const data = {
            categories: this.customCategories,
            settings: this.settings,
            timeTracking: this.storage.getAllData(),
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
            const emoji = activityEmojis[activity] || '⭐';
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
        const submitText = isEdit ? 'Update Activity' : 'Create Activity';
        const currentEmoji = isEdit ? (activityEmojis[activityName] || '⭐') : '⭐';
        
        const modal = `
            <div class="modal-overlay" onclick="management.closeModal()">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h3>${title}</h3>
                        <button class="modal-close" onclick="management.closeModal()">✕</button>
                    </div>
                    
                    <form id="activity-form" onsubmit="management.submitActivityForm(event, '${mode}', '${categoryName}')">
                        <div class="form-group">
                            <label>Activity Name</label>
                            <input type="text" id="activity-name" value="${isEdit ? activityName : ''}" required maxlength="30">
                        </div>
                        
                        <div class="form-group">
                            <label>Emoji</label>
                            <div class="emoji-picker">
                                <input type="text" id="activity-emoji" value="${currentEmoji}" maxlength="2">
                                <div class="emoji-presets">
                                    ${this.renderActivityEmojiPresets()}
                                </div>
                            </div>
                        </div>
                        
                        <div class="modal-actions">
                            <button type="button" class="btn-secondary" onclick="management.closeModal()">Cancel</button>
                            <button type="submit" class="btn-primary">${submitText}</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.getElementById('modal-container').innerHTML = modal;
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
        const submitText = isEdit ? 'Update Category' : 'Create Category';
        
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
                    
                    <form id="category-form" onsubmit="management.submitCategoryForm(event, '${mode}')">
                        <div class="form-group">
                            <label>Category Name</label>
                            <input type="text" id="category-name" value="${categoryData?.name || categoryData ? this.editingCategory : ''}" required maxlength="30">
                        </div>
                        
                        <div class="form-group">
                            <label>Color</label>
                            <div class="color-picker">
                                <input type="color" id="category-color" value="${categoryData?.color || '#4A90E2'}">
                                <div class="color-presets">
                                    ${this.renderColorPresets()}
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Emoji</label>
                            <div class="emoji-picker">
                                <input type="text" id="category-emoji" value="${categoryData?.emoji || '📁'}" maxlength="2">
                                <div class="emoji-presets">
                                    ${this.renderEmojiPresets()}
                                </div>
                            </div>
                        </div>
                        
                        ${isEdit && this.getSetting('goalsEnabled') ? this.renderGoalsSection(categoryName, currentGoals) : ''}
                        
                        <div class="modal-actions">
                            <button type="button" class="btn-secondary" onclick="management.closeModal()">Cancel</button>
                            <button type="submit" class="btn-primary">${submitText}</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.getElementById('modal-container').innerHTML = modal;
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
        const emojis = ['📁', '🎨', '💪', '🧘', '☕', '👥', '🔨', '😴', '📚', '🎵', '🌱', '🏠'];
        return emojis.map(emoji => 
            `<span class="emoji-preset" onclick="management.selectEmoji('${emoji}', 'category')">${emoji}</span>`
        ).join('');
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
        document.getElementById('category-color').value = color;
    }

    // Select emoji preset
    selectEmoji(emoji, type = 'category') {
        const inputId = type === 'category' ? 'category-emoji' : 'activity-emoji';
        document.getElementById(inputId).value = emoji;
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
        
        // Update category
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
        
        // Update activity emojis mapping if emoji provided
        if (emoji && emoji !== '⭐') {
            // We could store custom activity emojis in the future
            // For now, they're handled by the global activityEmojis mapping
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
            
            // Migrate time tracking data
            this.storage.migrateActivityData(categoryName, oldActivityName, newActivityName);
        }
        
        category.activities.sort(); // Keep alphabetically sorted
        
        this.saveCustomCategories();
        this.editingActivity = null;
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
        document.getElementById('modal-container').innerHTML = '';
        this.editingCategory = null;
        this.editingActivity = null;
    }

    getDefaultSettings() {
        return {
            appTitle: "Alona's Activity Tracker",
            goalsEnabled: true,
            version: "5.1.2 - Bug Fixes"
        };
    }
} 