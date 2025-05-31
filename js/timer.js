// Timer functionality
import { formatTime } from './utils.js';

export class Timer {
    constructor(storage, showScreen, updateTimerStatus, onTimerStop = null) {
        this.storage = storage;
        this.showScreen = showScreen;
        this.updateTimerStatus = updateTimerStatus;
        this.onTimerStop = onTimerStop;
        
        // Timer state
        this.currentCategory = null;
        this.currentActivity = null;
        this.timerInterval = null;
        this.startTime = null;
        this.pausedTime = 0;
        this.pauseStartTime = null;
        this.isPaused = false;
    }

    startActivity(category, activity, recovery = false) {
        this.currentCategory = category;
        this.currentActivity = activity;
        
        if (!recovery) {
            this.startTime = Date.now();
            this.pausedTime = 0;
            this.isPaused = false;
        }

        document.getElementById('current-activity-name').textContent = `${category} - ${activity}`;
        
        // Set initial today total time
        const todayTime = this.storage.getTodayTime(category, activity);
        document.getElementById('today-total-time').textContent = formatTime(todayTime);
        
        document.getElementById('timer-section').style.display = 'block';
        document.getElementById('activity-list').style.display = 'none';

        // Disable navigation during timing
        document.querySelector('.navigation').classList.add('navigation-disabled');

        // Disable all activity buttons
        document.querySelectorAll('.activity-button').forEach(btn => {
            btn.disabled = true;
        });

        // Show activity screen (timer will be visible)
        this.showScreen('activity');

        // Reset pause button state
        const pauseButton = document.getElementById('pause-button');
        pauseButton.textContent = 'Pause';
        pauseButton.classList.remove('paused');
        
        // Update timer status
        this.updateTimerStatus();

        this.timerInterval = setInterval(() => this.updateTimerDisplay(), 1000);
        this.updateTimerDisplay();

        if (!recovery) {
            this.saveTimerState();
            this.storage.updateActivityUsage(category, activity);
        }
    }

    updateTimerDisplay() {
        if (!this.startTime) return;
        
        let elapsed = Math.floor((Date.now() - this.startTime) / 1000) - this.pausedTime;
        
        // If currently paused, don't add current pause time yet
        if (this.isPaused && this.pauseStartTime) {
            // Keep the timer display frozen during pause
            elapsed = Math.floor((this.pauseStartTime - this.startTime) / 1000) - this.pausedTime;
        }
        
        document.getElementById('timer-display').textContent = formatTime(elapsed);
        
        // Update today's total time including current session
        const previousTime = this.storage.getTodayTime(this.currentCategory, this.currentActivity);
        const totalTime = previousTime + elapsed;
        document.getElementById('today-total-time').textContent = formatTime(totalTime);
    }

    togglePause() {
        const pauseButton = document.getElementById('pause-button');
        
        if (this.isPaused) {
            // Resume timer
            if (this.pauseStartTime) {
                this.pausedTime += Math.floor((Date.now() - this.pauseStartTime) / 1000);
            }
            this.isPaused = false;
            this.pauseStartTime = null;
            pauseButton.textContent = 'Pause';
            pauseButton.classList.remove('paused');
        } else {
            // Pause timer
            this.isPaused = true;
            this.pauseStartTime = Date.now();
            pauseButton.textContent = 'Resume';
            pauseButton.classList.add('paused');
        }
        
        this.updateTimerStatus();
        this.saveTimerState();
    }

    stopTimer() {
        if (!this.timerInterval || !this.startTime) return;

        let elapsed = Math.floor((Date.now() - this.startTime) / 1000) - this.pausedTime;
        const endTime = Date.now();
        
        // If currently paused, use the time when pause started
        if (this.isPaused && this.pauseStartTime) {
            elapsed = Math.floor((this.pauseStartTime - this.startTime) / 1000) - this.pausedTime;
        }

        const categoryName = this.currentCategory;
        
        // Create session data for detailed tracking
        const sessionData = {
            id: `session_${this.startTime}_${Math.random().toString(36).substr(2, 9)}`,
            startTime: this.startTime,
            endTime: this.isPaused ? this.pauseStartTime : endTime,
            pausedTime: this.pausedTime
        };
        
        // Add time record with session data
        this.storage.addTimeRecord(this.currentCategory, this.currentActivity, elapsed, new Date(), sessionData);

        clearInterval(this.timerInterval);
        this.timerInterval = null;
        this.startTime = null;
        this.pausedTime = 0;
        this.pauseStartTime = null;
        this.isPaused = false;

        // Re-enable navigation
        document.querySelector('.navigation').classList.remove('navigation-disabled');

        document.getElementById('timer-section').style.display = 'none';
        document.getElementById('activity-list').style.display = 'block';

        // Re-enable activity buttons
        document.querySelectorAll('.activity-button').forEach(btn => {
            btn.disabled = false;
        });

        this.storage.clearTimerState();
        
        // Check for goal achievements
        if (this.onTimerStop) {
            this.onTimerStop(categoryName);
        }
        
        this.showScreen('home');
    }

    saveTimerState() {
        const timerState = {
            active: !!this.timerInterval,
            category: this.currentCategory,
            activity: this.currentActivity,
            startTime: this.startTime,
            pausedTime: this.pausedTime,
            isPaused: this.isPaused,
            pauseStartTime: this.pauseStartTime
        };
        this.storage.saveTimerState(timerState);
    }

    recoverActiveTimer() {
        const timerState = this.storage.getTimerState();
        if (timerState && timerState.active && timerState.startTime) {
            // Show recovery dialog
            const timeSinceStart = Math.floor((Date.now() - timerState.startTime) / 1000);
            const shouldRecover = confirm(
                `Found an active timer for "${timerState.category} - ${timerState.activity}" started ${Math.floor(timeSinceStart / 60)} minutes ago. Do you want to continue this timer?`
            );
            
            if (shouldRecover) {
                // Restore timer state
                this.startTime = timerState.startTime;
                this.pausedTime = timerState.pausedTime || 0;
                this.isPaused = false; // Resume if it was paused
                this.pauseStartTime = null;
                
                // Use the existing startActivity method with recovery flag
                this.startActivity(timerState.category, timerState.activity, true);
            } else {
                this.storage.clearTimerState();
            }
        }
    }
} 