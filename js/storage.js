// Storage management functions
export class Storage {
    constructor(sandbox = false) {
        this.sandbox = sandbox;
        this.timeTrackingData = {};
        this.activityUsageStats = {};
        this.customCategories = {};
        this.settings = null;
        
        // Default retention period for detailed sessions (in days)
        this.defaultRetentionDays = 60;
    }

    // Settings storage
    saveSettings(settings) {
        if (this.sandbox) return;
        this.settings = settings;
        localStorage.setItem('appSettings', JSON.stringify(settings));
    }

    getSettings() {
        if (this.sandbox) return null;
        const stored = localStorage.getItem('appSettings');
        if (stored) {
            this.settings = JSON.parse(stored);
            return this.settings;
        }
        return null;
    }

    // Get retention period from settings or use default
    getRetentionDays() {
        const settings = this.getSettings();
        return settings?.sessionRetentionDays || this.defaultRetentionDays;
    }

    // Data storage functions
    saveData() {
        if (this.sandbox) return;
        localStorage.setItem('timeTracking', JSON.stringify(this.timeTrackingData));
    }

    loadData() {
        if (this.sandbox) return;
        const stored = localStorage.getItem('timeTracking');
        if (stored) {
            this.timeTrackingData = JSON.parse(stored);
            // Migrate old data format if needed
            this.migrateDataStructure();
            // Clean up old sessions
            this.cleanupOldSessions();
        } else {
            localStorage.setItem('timeTracking', JSON.stringify({}));
        }
    }

    // Migrate old aggregate-only data to new hybrid structure
    migrateDataStructure() {
        let migrationNeeded = false;
        
        Object.entries(this.timeTrackingData).forEach(([dateKey, dayData]) => {
            // Check if this is old format (no _aggregates or _sessions)
            if (!dayData._aggregates && !dayData._sessions) {
                migrationNeeded = true;
                
                // Create new structure
                const newDayData = {
                    _aggregates: { ...dayData },
                    _sessions: []
                };
                
                this.timeTrackingData[dateKey] = newDayData;
            }
        });
        
        if (migrationNeeded) {
            console.log('🔄 Migrated data structure to support individual sessions');
            this.saveData();
        }
    }

    // Clean up sessions older than retention period
    cleanupOldSessions() {
        const retentionDays = this.getRetentionDays();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
        
        let cleanupPerformed = false;
        
        Object.entries(this.timeTrackingData).forEach(([dateKey, dayData]) => {
            const date = new Date(dateKey);
            
            if (date < cutoffDate && dayData._sessions && dayData._sessions.length > 0) {
                dayData._sessions = [];
                cleanupPerformed = true;
            }
        });
        
        if (cleanupPerformed) {
            console.log(`🧹 Cleaned up sessions older than ${retentionDays} days`);
            this.saveData();
        }
    }

    // Get all data for export
    getAllData() {
        return {
            timeTracking: this.timeTrackingData,
            usageStats: this.activityUsageStats,
            customCategories: this.customCategories,
            settings: this.settings
        };
    }

    // Import data and replace current data
    importData(importedData) {
        if (this.sandbox) return;
        
        if (importedData.timeTracking) {
            this.timeTrackingData = importedData.timeTracking;
            // Migrate and cleanup after import
            this.migrateDataStructure();
            this.cleanupOldSessions();
            localStorage.setItem('timeTracking', JSON.stringify(this.timeTrackingData));
        }
        
        if (importedData.usageStats) {
            this.activityUsageStats = importedData.usageStats;
            localStorage.setItem('usageStats', JSON.stringify(this.activityUsageStats));
        }
        
        if (importedData.customCategories) {
            this.customCategories = importedData.customCategories;
            localStorage.setItem('customCategories', JSON.stringify(this.customCategories));
        }
        
        if (importedData.settings) {
            this.settings = importedData.settings;
            localStorage.setItem('appSettings', JSON.stringify(this.settings));
        }
    }

    // Clear all data and reset app
    clearAllData() {
        if (this.sandbox) return;
        
        // Clear in-memory data
        this.timeTrackingData = {};
        this.activityUsageStats = {};
        this.customCategories = {};
        this.settings = null;
        
        // Clear localStorage
        localStorage.removeItem('timeTracking');
        localStorage.removeItem('usageStats');
        localStorage.removeItem('customCategories');
        localStorage.removeItem('appSettings');
        localStorage.removeItem('activeTimer');
        localStorage.removeItem('goals');
    }

    // Usage statistics storage
    saveUsageStats() {
        if (this.sandbox) return;
        localStorage.setItem('usageStats', JSON.stringify(this.activityUsageStats));
    }

    loadUsageStats() {
        if (this.sandbox) return;
        const stored = localStorage.getItem('usageStats');
        if (stored) {
            this.activityUsageStats = JSON.parse(stored);
        }
    }

    // Custom categories storage
    saveCustomCategories(categories) {
        if (this.sandbox) return;
        this.customCategories = categories;
        localStorage.setItem('customCategories', JSON.stringify(categories));
    }

    getCustomCategories() {
        if (this.sandbox) return {};
        const stored = localStorage.getItem('customCategories');
        if (stored) {
            this.customCategories = JSON.parse(stored);
            return this.customCategories;
        }
        return {};
    }

    // Timer state persistence
    saveTimerState(timerState) {
        if (this.sandbox) return;
        localStorage.setItem('activeTimer', JSON.stringify(timerState));
    }

    clearTimerState() {
        if (this.sandbox) return;
        localStorage.removeItem('activeTimer');
    }

    getTimerState() {
        if (this.sandbox) return null;
        const stored = localStorage.getItem('activeTimer');
        return stored ? JSON.parse(stored) : null;
    }

    // Enhanced data operations with session tracking
    addTimeRecord(category, activity, duration, date = new Date(), sessionData = null) {
        const dateKey = date.toDateString();
        
        // Ensure date structure exists
        if (!this.timeTrackingData[dateKey]) {
            this.timeTrackingData[dateKey] = {
                _aggregates: {},
                _sessions: []
            };
        }
        
        // Ensure aggregates structure exists
        if (!this.timeTrackingData[dateKey]._aggregates) {
            this.timeTrackingData[dateKey]._aggregates = {};
        }
        if (!this.timeTrackingData[dateKey]._aggregates[category]) {
            this.timeTrackingData[dateKey]._aggregates[category] = {};
        }
        if (!this.timeTrackingData[dateKey]._aggregates[category][activity]) {
            this.timeTrackingData[dateKey]._aggregates[category][activity] = 0;
        }
        
        // Update aggregates
        this.timeTrackingData[dateKey]._aggregates[category][activity] += duration;
        
        // Add session record if provided
        if (sessionData) {
            if (!this.timeTrackingData[dateKey]._sessions) {
                this.timeTrackingData[dateKey]._sessions = [];
            }
            
            const session = {
                id: sessionData.id || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                category: category,
                activity: activity,
                startTime: sessionData.startTime,
                endTime: sessionData.endTime,
                duration: duration,
                pausedTime: sessionData.pausedTime || 0,
                createdAt: Date.now()
            };
            
            this.timeTrackingData[dateKey]._sessions.push(session);
        }
        
        this.saveData();
    }

    // Get aggregated time data (backward compatible)
    getTodayTime(category, activity = null) {
        const today = new Date().toDateString();
        
        if (!this.timeTrackingData[today] || !this.timeTrackingData[today]._aggregates || !this.timeTrackingData[today]._aggregates[category]) return 0;
        
        if (activity) {
            return this.timeTrackingData[today]._aggregates[category][activity] || 0;
        } else {
            return Object.values(this.timeTrackingData[today]._aggregates[category]).reduce((sum, time) => sum + time, 0);
        }
    }

    // Get aggregated date data (backward compatible)
    getDateData(date) {
        const dateKey = date.toDateString();
        const dayData = this.timeTrackingData[dateKey];
        
        if (!dayData) return {};
        
        // Return aggregates for backward compatibility
        return dayData._aggregates || {};
    }

    // Get individual sessions for a date
    getDateSessions(date) {
        const dateKey = date.toDateString();
        const dayData = this.timeTrackingData[dateKey];
        
        if (!dayData || !dayData._sessions) return [];
        
        return dayData._sessions.sort((a, b) => a.startTime - b.startTime);
    }

    // Get sessions for a date range
    getSessionsInRange(startDate, endDate) {
        const sessions = [];
        const currentDate = new Date(startDate);
        
        while (currentDate <= endDate) {
            const dateSessions = this.getDateSessions(currentDate);
            sessions.push(...dateSessions);
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return sessions.sort((a, b) => a.startTime - b.startTime);
    }

    // Get storage statistics
    getStorageStats() {
        let totalSessions = 0;
        let totalDays = 0;
        let oldestSession = null;
        let newestSession = null;
        
        Object.entries(this.timeTrackingData).forEach(([dateKey, dayData]) => {
            if (dayData._sessions && dayData._sessions.length > 0) {
                totalDays++;
                totalSessions += dayData._sessions.length;
                
                dayData._sessions.forEach(session => {
                    if (!oldestSession || session.startTime < oldestSession.startTime) {
                        oldestSession = session;
                    }
                    if (!newestSession || session.startTime > newestSession.startTime) {
                        newestSession = session;
                    }
                });
            }
        });
        
        return {
            totalSessions,
            totalDays,
            oldestSession,
            newestSession,
            retentionDays: this.getRetentionDays()
        };
    }

    updateActivityUsage(category, activity) {
        const key = `${category}::${activity}`;
        const now = Date.now();
        const hour = new Date().getHours();
        
        if (!this.activityUsageStats[key]) {
            this.activityUsageStats[key] = {
                frequency: 0,
                lastUsed: now,
                timeOfDayPattern: {}
            };
        }
        
        this.activityUsageStats[key].frequency++;
        this.activityUsageStats[key].lastUsed = now;
        this.activityUsageStats[key].timeOfDayPattern[hour] = (this.activityUsageStats[key].timeOfDayPattern[hour] || 0) + 1;
        
        this.saveUsageStats();
    }

    // Soft delete methods - preserve data but mark as deleted
    softDeleteCategory(categoryName) {
        // Mark category as deleted instead of removing it
        if (this.customCategories[categoryName]) {
            this.customCategories[categoryName].deleted = true;
            this.customCategories[categoryName].deletedAt = new Date().toISOString();
        }
        this.saveCustomCategories(this.customCategories);
    }

    softDeleteActivity(categoryName, activityName) {
        // Mark activity as deleted instead of removing it
        if (this.customCategories[categoryName]) {
            if (!this.customCategories[categoryName].deletedActivities) {
                this.customCategories[categoryName].deletedActivities = {};
            }
            this.customCategories[categoryName].deletedActivities[activityName] = {
                deleted: true,
                deletedAt: new Date().toISOString()
            };
            
            // Remove from active activities list
            this.customCategories[categoryName].activities = 
                this.customCategories[categoryName].activities.filter(activity => activity !== activityName);
        }
        this.saveCustomCategories(this.customCategories);
    }

    // Get active (non-deleted) categories
    getActiveCategories() {
        const allCategories = this.getCustomCategories();
        const activeCategories = {};
        
        Object.entries(allCategories).forEach(([name, data]) => {
            if (!data.deleted) {
                activeCategories[name] = data;
            }
        });
        
        return activeCategories;
    }

    // Data migration methods for management operations
    migrateCategoryData(oldCategoryName, newCategoryName) {
        // Migrate time tracking data
        Object.keys(this.timeTrackingData).forEach(dateKey => {
            const dayData = this.timeTrackingData[dateKey];
            if (dayData[oldCategoryName]) {
                dayData[newCategoryName] = dayData[oldCategoryName];
                delete dayData[oldCategoryName];
            }
        });

        // Migrate usage statistics
        Object.keys(this.activityUsageStats).forEach(key => {
            if (key.startsWith(oldCategoryName + '::')) {
                const activityName = key.split('::')[1];
                const newKey = `${newCategoryName}::${activityName}`;
                this.activityUsageStats[newKey] = this.activityUsageStats[key];
                delete this.activityUsageStats[key];
            }
        });

        this.saveData();
        this.saveUsageStats();
    }

    migrateActivityData(categoryName, oldActivityName, newActivityName) {
        // Migrate time tracking data
        Object.keys(this.timeTrackingData).forEach(dateKey => {
            const dayData = this.timeTrackingData[dateKey];
            if (dayData[categoryName] && dayData[categoryName][oldActivityName]) {
                dayData[categoryName][newActivityName] = dayData[categoryName][oldActivityName];
                delete dayData[categoryName][oldActivityName];
            }
        });

        // Migrate usage statistics
        const oldKey = `${categoryName}::${oldActivityName}`;
        const newKey = `${categoryName}::${newActivityName}`;
        if (this.activityUsageStats[oldKey]) {
            this.activityUsageStats[newKey] = this.activityUsageStats[oldKey];
            delete this.activityUsageStats[oldKey];
        }

        this.saveData();
        this.saveUsageStats();
    }

    // DEPRECATED: Keep for backward compatibility but don't use
    deleteCategoryData(categoryName) {
        console.warn('Hard delete deprecated - use soft delete instead');
        // Don't actually delete - this preserves historical data
    }

    deleteActivityData(categoryName, activityName) {
        console.warn('Hard delete deprecated - use soft delete instead');
        // Don't actually delete - this preserves historical data
    }
} 