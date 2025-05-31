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
        
        // Instance management
        this.instanceId = `instance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.heartbeatInterval = null;
        
        // Initialize instance communication
        this.initInstanceCommunication();
    }
    
    initInstanceCommunication() {
        // Check if BroadcastChannel is supported
        if ('BroadcastChannel' in window) {
            this.broadcastChannel = new BroadcastChannel('timer-instances');
            this.broadcastChannel.onmessage = (event) => {
                this.handleInstanceMessage(event.data);
            };
        }
        
        // Start heartbeat to indicate this instance is alive
        this.startHeartbeat();
        
        // Listen for page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.checkForConflictingTimers();
            }
        });
    }
    
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            if (this.timerInterval) {
                // Timer is running, send heartbeat
                this.broadcastTimerStatus('heartbeat');
                this.updateInstanceTimestamp();
            }
        }, 5000); // Every 5 seconds
    }
    
    updateInstanceTimestamp() {
        if (this.timerInterval) {
            const timerState = this.storage.getTimerState();
            if (timerState) {
                timerState.lastHeartbeat = Date.now();
                timerState.instanceId = this.instanceId;
                this.storage.saveTimerState(timerState);
            }
        }
    }
    
    broadcastTimerStatus(action, data = {}) {
        if (this.broadcastChannel) {
            this.broadcastChannel.postMessage({
                action,
                instanceId: this.instanceId,
                timerActive: !!this.timerInterval,
                category: this.currentCategory,
                activity: this.currentActivity,
                startTime: this.startTime,
                ...data
            });
        }
    }
    
    handleInstanceMessage(message) {
        if (message.instanceId === this.instanceId) return; // Ignore own messages
        
        switch (message.action) {
            case 'timer-started':
                if (this.timerInterval && message.timerActive) {
                    this.handleTimerConflict(message);
                }
                break;
            case 'timer-stopped':
                // Another instance stopped its timer, safe to continue
                break;
            case 'heartbeat':
                if (this.timerInterval && message.timerActive) {
                    this.handleTimerConflict(message);
                }
                break;
        }
    }
    
    handleTimerConflict(otherInstance) {
        // Check which timer started first
        const myStartTime = this.startTime;
        const otherStartTime = otherInstance.startTime;
        
        if (otherStartTime < myStartTime) {
            // Other timer started first, offer to stop this one
            const shouldStop = confirm(
                `Another instance is already tracking "${otherInstance.category} - ${otherInstance.activity}". ` +
                `Would you like to stop this timer and continue with the other instance?`
            );
            
            if (shouldStop) {
                this.stopTimer();
                return;
            }
        } else {
            // This timer started first, offer to take control
            const shouldTakeControl = confirm(
                `This instance was tracking time first. Would you like to stop the other timer and continue here?`
            );
            
            if (shouldTakeControl) {
                this.broadcastTimerStatus('stop-request');
            }
        }
    }
    
    checkForConflictingTimers() {
        const timerState = this.storage.getTimerState();
        if (timerState && timerState.instanceId !== this.instanceId && timerState.lastHeartbeat) {
            const timeSinceHeartbeat = Date.now() - timerState.lastHeartbeat;
            
            // If another instance's heartbeat is recent (less than 10 seconds)
            if (timeSinceHeartbeat < 10000 && this.timerInterval) {
                this.handleTimerConflict({
                    category: timerState.category,
                    activity: timerState.activity,
                    startTime: timerState.startTime
                });
            }
        }
    }

    startActivity(category, activity, recovery = false) {
        // Check for conflicting timers before starting
        if (!recovery) {
            this.checkForConflictingTimers();
        }
        
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
            
            // Broadcast that this instance started a timer
            this.broadcastTimerStatus('timer-started');
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
        
        // Broadcast that this instance stopped its timer
        this.broadcastTimerStatus('timer-stopped');
        
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
            pauseStartTime: this.pauseStartTime,
            instanceId: this.instanceId,
            lastHeartbeat: Date.now()
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