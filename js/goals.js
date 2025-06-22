// Time Goals & Visualization Module
import { formatTime } from './utils.js';

export class Goals {
    constructor(storage, getCategories, getSetting) {
        this.storage = storage;
        this.getCategories = getCategories;
        this.getSetting = getSetting; // Function to get setting values
        this.goals = {};
        this.achievements = [];
        this.saveTimeout = null;
    }

    // Check if goals are enabled in settings
    areGoalsEnabled() {
        if (!this.getSetting) {
            return true; // Default to enabled if no settings function
        }
        
        const enabled = this.getSetting('goalsEnabled');
        
        // If setting is undefined/null, default to true for backward compatibility
        return enabled !== false;
    }

    // Initialize goals system
    init() {
        if (!this.areGoalsEnabled()) return;
        this.loadGoals();
        this.loadAchievements();
        
        // Recalculate all streaks to fix any incorrect data
        this.recalculateAllStreaks();
    }

    // Load goals from storage
    loadGoals() {
        if (this.storage.sandbox) return;
        const stored = localStorage.getItem('categoryGoals');
        if (stored) {
            this.goals = JSON.parse(stored);
        }
    }

    // Save goals to storage
    saveGoals() {
        if (this.storage.sandbox) return;
        localStorage.setItem('categoryGoals', JSON.stringify(this.goals));
    }

    // Load achievements from storage
    loadAchievements() {
        if (this.storage.sandbox) return;
        const stored = localStorage.getItem('achievements');
        if (stored) {
            this.achievements = JSON.parse(stored);
        }
    }

    // Save achievements to storage
    saveAchievements() {
        if (this.storage.sandbox) return;
        localStorage.setItem('achievements', JSON.stringify(this.achievements));
    }

    // Set goal for a category
    setGoal(categoryName, period, targetSeconds) {
        if (!this.areGoalsEnabled()) return;
        
        if (!this.goals[categoryName]) {
            this.goals[categoryName] = {};
        }
        
        this.goals[categoryName][period] = {
            target: targetSeconds,
            createdAt: new Date().toISOString(),
            streak: this.goals[categoryName][period]?.streak || 0
        };
        
        this.saveGoals();
    }

    // Get goal for category and period
    getGoal(categoryName, period) {
        if (!this.areGoalsEnabled()) return null;
        return this.goals[categoryName]?.[period] || null;
    }

    // Get all goals for a category
    getCategoryGoals(categoryName) {
        if (!this.areGoalsEnabled()) return {};
        return this.goals[categoryName] || {};
    }

    // Calculate progress for a goal
    calculateProgress(categoryName, period, date = new Date()) {
        if (!this.areGoalsEnabled()) return null;
        
        const goal = this.getGoal(categoryName, period);
        if (!goal) return null;

        const actualTime = this.getActualTimeForPeriod(categoryName, period, date);
        const percentage = Math.min((actualTime / goal.target) * 100, 100);
        
        return {
            actual: actualTime,
            target: goal.target,
            percentage: percentage,
            achieved: percentage >= 100,
            remaining: Math.max(goal.target - actualTime, 0)
        };
    }

    // Get actual time spent for a period
    getActualTimeForPeriod(categoryName, period, date = new Date()) {
        let totalTime = 0;
        
        if (period === 'daily') {
            // For daily goals, get time for the specific date
            const dayData = this.storage.getDateData(date);
            if (dayData[categoryName]) {
                totalTime = Object.values(dayData[categoryName]).reduce((sum, time) => sum + time, 0);
            }
        } else if (period === 'weekly') {
            // Get week data for the specific date (Sunday to Saturday)
            const startOfWeek = new Date(date);
            startOfWeek.setDate(date.getDate() - date.getDay());
            
            for (let i = 0; i < 7; i++) {
                const dayDate = new Date(startOfWeek);
                dayDate.setDate(startOfWeek.getDate() + i);
                const dayData = this.storage.getDateData(dayDate);
                
                if (dayData[categoryName]) {
                    totalTime += Object.values(dayData[categoryName]).reduce((sum, time) => sum + time, 0);
                }
            }
        } else if (period === 'monthly') {
            // Get month data for the specific date
            const year = date.getFullYear();
            const month = date.getMonth();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            
            for (let day = 1; day <= daysInMonth; day++) {
                const dayDate = new Date(year, month, day);
                const dayData = this.storage.getDateData(dayDate);
                
                if (dayData[categoryName]) {
                    totalTime += Object.values(dayData[categoryName]).reduce((sum, time) => sum + time, 0);
                }
            }
        }
        
        return totalTime;
    }

    // Check for goal achievements and update streaks
    checkAchievements(categoryName) {
        if (!this.areGoalsEnabled()) return;
        
        const today = new Date();
        const periods = ['daily', 'weekly', 'monthly'];
        
        periods.forEach(period => {
            const progress = this.calculateProgress(categoryName, period, today);
            if (progress && progress.achieved) {
                this.recordAchievement(categoryName, period, today);
                this.updateStreak(categoryName, period, today);
            }
        });
    }

    // Record an achievement
    recordAchievement(categoryName, period, date) {
        if (!this.areGoalsEnabled()) return;
        
        const achievementId = `${categoryName}-${period}-${date.toDateString()}`;
        
        // Check if already recorded
        if (this.achievements.find(a => a.id === achievementId)) {
            return;
        }
        
        const achievement = {
            id: achievementId,
            categoryName,
            period,
            date: date.toISOString(),
            timestamp: Date.now()
        };
        
        this.achievements.push(achievement);
        this.saveAchievements();
        
        // Show celebration notification
        this.showAchievementNotification(categoryName, period);
    }

    // Update streak for a goal
    updateStreak(categoryName, period, date) {
        if (!this.areGoalsEnabled()) return;
        
        if (!this.goals[categoryName] || !this.goals[categoryName][period]) return;
        
        const goal = this.goals[categoryName][period];
        
        // Calculate the actual streak by counting consecutive achievements
        let streak = 0;
        let checkDate = new Date(date);
        
        // Count consecutive days where the goal was achieved
        while (true) {
            const progress = this.calculateProgress(categoryName, period, checkDate);
            
            // If goal was achieved on this date, increment streak
            if (progress && progress.achieved) {
                streak++;
            } else {
                // Streak is broken, stop counting
                break;
            }
            
            // Move to previous period
            if (period === 'daily') {
                checkDate.setDate(checkDate.getDate() - 1);
            } else if (period === 'weekly') {
                checkDate.setDate(checkDate.getDate() - 7);
            } else if (period === 'monthly') {
                checkDate.setMonth(checkDate.getMonth() - 1);
            }
            
            // Safety check: don't go back more than reasonable amount
            const daysDiff = Math.abs((new Date() - checkDate) / (1000 * 60 * 60 * 24));
            if (daysDiff > 365) { // Don't check more than a year back
                break;
            }
        }
        
        goal.streak = streak;
        this.saveGoals();
    }

    // Show achievement notification
    showAchievementNotification(categoryName, period) {
        if (!this.areGoalsEnabled()) return;
        
        const categories = this.getCategories();
        const categoryEmoji = categories[categoryName]?.emoji || '🎯';
        
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-content">
                <div class="achievement-emoji">🎉</div>
                <div class="achievement-text">
                    <strong>Goal Achieved!</strong><br>
                    ${categoryEmoji} ${categoryName} - ${period} goal completed!
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Remove after 4 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }

    // Render goals section for home screen
    renderGoalsSection() {
        const isEnabled = this.areGoalsEnabled();
        
        if (!isEnabled) {
            return ''; // Return empty string if goals are disabled
        }
        
        const categories = this.getCategories();
        const goalsHtml = Object.keys(categories).map(categoryName => {
            const categoryGoals = this.getCategoryGoals(categoryName);
            if (Object.keys(categoryGoals).length === 0) return '';
            
            return this.renderCategoryGoalCard(categoryName, categoryGoals);
        }).filter(html => html).join('');
        
        // Always show goals section to help with discoverability
        if (!goalsHtml) {
            return `
                <div class="goals-section">
                    <div class="goals-header">
                        <h3>🎯 Time Goals</h3>
                        <button class="btn-icon btn-goals-manage" onclick="goals.showGoalsModal()" title="Manage Goals">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11.03L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11.03C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"/>
                            </svg>
                        </button>
                    </div>
                    <div class="goals-empty">
                        <div class="goals-empty-content">
                            <div class="goals-empty-icon">🎯</div>
                            <h4>Set Your First Goal!</h4>
                            <p>Track your progress by setting daily, weekly, or monthly time goals for your categories.</p>
                            <div class="goals-empty-actions">
                                <button class="btn-primary" onclick="goals.showGoalsModal()">Set Goals</button>
                                <p class="goals-empty-hint">💡 Or edit any category to add goals directly</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        return `
            <div class="goals-section">
                <div class="goals-header">
                    <h3>🎯 Today's Goals</h3>
                    <button class="btn-icon btn-goals-manage" onclick="goals.showGoalsModal()" title="Manage Goals">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11.03L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11.03C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"/>
                        </svg>
                    </button>
                </div>
                <div class="goals-grid">
                    ${goalsHtml}
                </div>
            </div>
        `;
    }

    // Render individual category goal card
    renderCategoryGoalCard(categoryName, categoryGoals) {
        const categories = this.getCategories();
        const categoryData = categories[categoryName];
        if (!categoryData) return '';
        
        // Focus on daily goal for home screen
        const dailyGoal = categoryGoals.daily;
        if (!dailyGoal) return '';
        
        const progress = this.calculateProgress(categoryName, 'daily');
        if (!progress) return '';
        
        const statusIcon = this.getGoalStatusIcon(progress.percentage);
        const streak = dailyGoal.streak || 0;
        
        return `
            <div class="goal-card" style="--category-color: ${categoryData.color}">
                <div class="goal-card-header">
                    <span class="goal-category">${categoryData.emoji} ${categoryName}</span>
                    <span class="goal-status">${statusIcon}</span>
                </div>
                <div class="goal-progress">
                    <div class="progress-ring">
                        <svg class="progress-ring-svg" width="60" height="60">
                            <circle class="progress-ring-circle-bg" cx="30" cy="30" r="25"></circle>
                            <circle class="progress-ring-circle" cx="30" cy="30" r="25" 
                                    style="stroke-dasharray: ${157.08}; stroke-dashoffset: ${157.08 - (157.08 * progress.percentage / 100)}"></circle>
                        </svg>
                        <div class="progress-percentage">${Math.round(progress.percentage)}%</div>
                    </div>
                    <div class="goal-details">
                        <div class="goal-time">${formatTime(progress.actual)} / ${formatTime(progress.target)}</div>
                        ${streak > 0 ? `<div class="goal-streak">🔥 ${streak} day streak</div>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    // Get status icon based on progress
    getGoalStatusIcon(percentage) {
        if (percentage >= 100) return '✅';
        if (percentage >= 80) return '🔥';
        if (percentage >= 50) return '⚡';
        if (percentage >= 25) return '⚠️';
        return '🎯';
    }

    // Show goals management modal
    showGoalsModal() {
        if (!this.areGoalsEnabled()) {
            // Show a toast notification instead of the modal
            this.showToast('Goals feature is currently disabled. Enable it in Settings to manage goals.', 'info');
            return;
        }
        
        const categories = this.getCategories();
        
        // Ensure modal container exists
        let modalContainer = document.getElementById('modal-container');
        if (!modalContainer) {
            modalContainer = document.createElement('div');
            modalContainer.id = 'modal-container';
            document.body.appendChild(modalContainer);
        }
        
        const modal = `
            <div class="modal-overlay" onclick="goals.closeGoalsModal()">
                <div class="modal-content goals-modal" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h3>🎯 Manage Goals</h3>
                        <button class="modal-close" onclick="goals.closeGoalsModal()">✕</button>
                    </div>
                    
                    <div class="goals-modal-content">
                        ${Object.entries(categories).map(([categoryName, categoryData]) => 
                            this.renderCategoryGoalSettings(categoryName, categoryData)
                        ).join('')}
                    </div>
                </div>
            </div>
        `;
        
        modalContainer.innerHTML = modal;
    }

    // Render category goal settings
    renderCategoryGoalSettings(categoryName, categoryData) {
        const goals = this.getCategoryGoals(categoryName);
        
        return `
            <div class="category-goal-settings">
                <div class="category-goal-header">
                    <span class="category-info">
                        <span style="color: ${categoryData.color}">●</span>
                        ${categoryData.emoji} ${categoryName}
                    </span>
                </div>
                
                <div class="goal-periods">
                    ${this.renderGoalPeriodSetting(categoryName, 'daily', 'Daily Goal', goals.daily)}
                    ${this.renderGoalPeriodSetting(categoryName, 'weekly', 'Weekly Goal', goals.weekly)}
                    ${this.renderGoalPeriodSetting(categoryName, 'monthly', 'Monthly Goal', goals.monthly)}
                </div>
                
                <p class="goal-hint">💡 Set goals to 0 to remove them. Setting a daily goal will auto-calculate weekly (×7) and monthly (×30) suggestions.</p>
            </div>
        `;
    }

    // Render individual goal period setting
    renderGoalPeriodSetting(categoryName, period, label, goal) {
        const currentTarget = goal ? Math.floor(goal.target / 60) : 0; // Convert to minutes
        const progress = goal ? this.calculateProgress(categoryName, period) : null;
        
        return `
            <div class="goal-period-setting">
                <div class="goal-period-header">
                    <label>${label}</label>
                    ${progress ? `<span class="goal-current-progress">${Math.round(progress.percentage)}% complete</span>` : ''}
                </div>
                <div class="goal-input-group">
                    <input type="number" 
                           id="goal-${categoryName}-${period}" 
                           value="${currentTarget}" 
                           min="0" 
                           max="1440"
                           placeholder="0"
                           onchange="goals.autoSaveGoal('${categoryName}', '${period}', this)"
                           oninput="goals.showSavingIndicator(this)">
                    <span class="goal-unit">minutes</span>
                    <span class="goal-save-status" id="status-${categoryName}-${period}"></span>
                </div>
                ${goal && goal.streak > 0 ? `<div class="goal-streak-display">🔥 ${goal.streak} ${period.replace('ly', '')} streak</div>` : ''}
            </div>
        `;
    }

    // Handle daily goal change to auto-calculate weekly/monthly goals
    handleDailyGoalChange(categoryName) {
        const dailyInput = document.getElementById(`goal-${categoryName}-daily`);
        const weeklyInput = document.getElementById(`goal-${categoryName}-weekly`);
        const monthlyInput = document.getElementById(`goal-${categoryName}-monthly`);
        
        if (!dailyInput || !weeklyInput || !monthlyInput) return;
        
        const dailyValue = parseInt(dailyInput.value) || 0;
        
        // Only auto-calculate if weekly and monthly are currently 0 or empty
        const currentWeekly = parseInt(weeklyInput.value) || 0;
        const currentMonthly = parseInt(monthlyInput.value) || 0;
        
        if (dailyValue > 0 && currentWeekly === 0 && currentMonthly === 0) {
            // Auto-calculate weekly (daily * 7) and monthly (daily * 30)
            const suggestedWeekly = dailyValue * 7;
            const suggestedMonthly = dailyValue * 30;
            
            weeklyInput.value = suggestedWeekly;
            monthlyInput.value = suggestedMonthly;
            
            // Add a subtle animation to show the auto-calculation
            weeklyInput.style.background = '#e8f5e8';
            monthlyInput.style.background = '#e8f5e8';
            
            setTimeout(() => {
                weeklyInput.style.background = '';
                monthlyInput.style.background = '';
            }, 1500);
            
            // Show a helpful toast
            this.showToast(`💡 Auto-calculated weekly (${suggestedWeekly} min) and monthly (${suggestedMonthly} min) goals!`);
        }
    }

    // Auto-save goal when changed (replaces manual save buttons)
    autoSaveGoal(categoryName, period, inputElement) {
        const minutes = parseInt(inputElement.value) || 0;
        const statusElement = document.getElementById(`status-${categoryName}-${period}`);
        
        // Show saving indicator
        statusElement.innerHTML = `<span class="goal-saving">💾 Saving...</span>`;
        statusElement.className = 'goal-save-status saving';
        
        // Debounce save to prevent too many calls
        clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => {
            try {
                if (minutes <= 0) {
                    // Remove goal if set to 0
                    if (this.goals[categoryName]) {
                        delete this.goals[categoryName][period];
                        if (Object.keys(this.goals[categoryName]).length === 0) {
                            delete this.goals[categoryName];
                        }
                    }
                } else {
                    // Set goal (convert minutes to seconds)
                    this.setGoal(categoryName, period, minutes * 60);
                }
                
                this.saveGoals();
                
                // Show success indicator
                statusElement.innerHTML = `<span class="goal-saved">✓ Saved</span>`;
                statusElement.className = 'goal-save-status saved';
                
                // Hide success indicator after 2 seconds
                setTimeout(() => {
                    statusElement.innerHTML = '';
                    statusElement.className = 'goal-save-status';
                }, 2000);
                
                // Trigger goal calculation for daily goals
                if (period === 'daily') {
                    this.handleDailyGoalChange(categoryName);
                }
                
                // Refresh other parts of the UI if needed
                if (window.app?.renderGoalsUI) {
                    window.app.renderGoalsUI();
                }
                
            } catch (error) {
                console.error('Error auto-saving goal:', error);
                statusElement.innerHTML = `<span class="goal-error">⚠️ Error</span>`;
                statusElement.className = 'goal-save-status error';
            }
        }, 500); // 500ms debounce
    }
    
    // Show saving indicator while typing
    showSavingIndicator(inputElement) {
        const categoryPeriod = inputElement.id.replace('goal-', '').split('-');
        const categoryName = categoryPeriod.slice(0, -1).join('-');
        const period = categoryPeriod[categoryPeriod.length - 1];
        const statusElement = document.getElementById(`status-${categoryName}-${period}`);
        
        if (statusElement) {
            statusElement.innerHTML = `<span class="goal-typing">✏️</span>`;
            statusElement.className = 'goal-save-status typing';
        }
    }

    // Show toast notification
    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast-notification ${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }

    // Close goals modal
    closeGoalsModal() {
        const modalContainer = document.getElementById('modal-container');
        if (modalContainer) {
            modalContainer.innerHTML = '';
        }
        
        // Also refresh home screen goals if currently visible
        if (window.app && window.app.currentScreen === 'home') {
            setTimeout(() => {
                window.app.renderGoalsSection();
            }, 100);
        }
    }

    // Get goals summary for reports
    getGoalsSummary(period = 'daily', date = new Date()) {
        const categories = this.getCategories();
        const summary = [];
        
        Object.keys(categories).forEach(categoryName => {
            const progress = this.calculateProgress(categoryName, period, date);
            if (progress) {
                summary.push({
                    categoryName,
                    ...progress,
                    goal: this.getGoal(categoryName, period)
                });
            }
        });
        
        return summary.sort((a, b) => b.percentage - a.percentage);
    }

    // Recalculate all streaks to fix any incorrect data
    recalculateAllStreaks() {
        if (!this.areGoalsEnabled()) return;
        
        const today = new Date();
        let streaksUpdated = 0;
        
        // Go through all categories and periods
        Object.keys(this.goals).forEach(categoryName => {
            Object.keys(this.goals[categoryName]).forEach(period => {
                const oldStreak = this.goals[categoryName][period].streak || 0;
                this.updateStreak(categoryName, period, today);
                const newStreak = this.goals[categoryName][period].streak || 0;
                
                if (oldStreak !== newStreak) {
                    streaksUpdated++;
                    console.log(`Streak updated for ${categoryName} ${period}: ${oldStreak} → ${newStreak}`);
                }
            });
        });
        
        if (streaksUpdated > 0) {
            console.log(`Goals: Recalculated ${streaksUpdated} streaks`);
            this.saveGoals();
        }
    }

    // Debug function to test streak calculation for a specific date
    debugStreakCalculation(categoryName, period, testDate) {
        if (!this.areGoalsEnabled()) return null;
        
        console.log(`🔍 Debugging streak for ${categoryName} ${period} on ${testDate.toDateString()}`);
        
        const goal = this.getGoal(categoryName, period);
        if (!goal) {
            console.log('❌ No goal found for this category/period');
            return null;
        }
        
        console.log(`🎯 Goal target: ${formatTime(goal.target)}`);
        
        // Test the actual time calculation for the test date
        const actualTime = this.getActualTimeForPeriod(categoryName, period, testDate);
        console.log(`⏱️ Actual time on ${testDate.toDateString()}: ${formatTime(actualTime)}`);
        
        // Test progress calculation
        const progress = this.calculateProgress(categoryName, period, testDate);
        if (progress) {
            console.log(`📊 Progress: ${Math.round(progress.percentage)}% (${progress.achieved ? 'ACHIEVED' : 'NOT ACHIEVED'})`);
        }
        
        return progress;
    }
} 