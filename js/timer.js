// Timer functionality (plain HTML/JS version)
import { formatTime } from './utils.js';

export class Timer {
    constructor(storage, showScreen, updateTimerStatus, onTimerStop = null) {
        this.storage = storage;
        this.showScreen = showScreen;
        this.onTimerStop = onTimerStop;
        // Timer state
        this.currentCategory = null;
        this.currentActivity = null;
        this.timerInterval = null;
        this.startTime = null;
        this.pausedTime = 0;
        this.pauseStartTime = null;
        this.isPaused = false;
        // Modal state
        this.adjustmentHistory = [];
        // Quick restart state
        this.recentlyStopped = null;
        this.quickRestartTimeout = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        console.log('[DEBUG] setupEventListeners() called');
        
        // Pause/Resume
        const pauseBtn = document.getElementById('pause-button');
        if (pauseBtn) {
            console.log('[DEBUG] Found pause button, adding event listener');
            pauseBtn.addEventListener('click', () => {
                console.log('[DEBUG] Pause button clicked');
                this.togglePause();
            });
        } else {
            console.log('[DEBUG] WARNING: pause-button not found');
        }
        
        // Timer display (edit elapsed)
        const timerDisplay = document.getElementById('timer-display');
        const inlineTimePicker = document.getElementById('inline-time-picker');
        if (timerDisplay && inlineTimePicker) {
            console.log('[DEBUG] Found timer display elements, adding event listeners');
            timerDisplay.addEventListener('click', () => {
                console.log('[DEBUG] Timer display clicked');
                // Prefill with current elapsed time (HH:MM:SS)
                let elapsed = Math.floor((Date.now() - this.startTime) / 1000) - this.pausedTime;
                if (this.isPaused && this.pauseStartTime) {
                    elapsed = Math.floor((this.pauseStartTime - this.startTime) / 1000) - this.pausedTime;
                }
                const h = String(Math.floor(elapsed / 3600)).padStart(2, '0');
                const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
                const s = String(elapsed % 60).padStart(2, '0');
                inlineTimePicker.value = `${h}:${m}:${s}`;
                timerDisplay.style.display = 'none';
                inlineTimePicker.style.display = 'block';
                
                // Enhanced focus and selection for immediate editing
                // Use setTimeout to ensure DOM update completes before focusing
                setTimeout(() => {
                    inlineTimePicker.focus();
                    // Select all text for immediate editing
                    inlineTimePicker.select();
                    // For mobile devices, ensure the input is properly activated
                    inlineTimePicker.click();
                }, 10);
            });
            // Only save on blur or Enter key
            function applyInlineTimeEdit() {
                console.log('[DEBUG] Applying inline time edit');
                const val = inlineTimePicker.value;
                if (val) {
                    const parts = val.split(':');
                    let seconds = 0;
                    if (parts.length === 2) {
                        seconds = (+parts[0]) * 3600 + (+parts[1]) * 60;
                    } else if (parts.length === 3) {
                        seconds = (+parts[0]) * 3600 + (+parts[1]) * 60 + (+parts[2]);
                    }
                    // Adjust start time to match new elapsed
                    this.startTime = Date.now() - (seconds + this.pausedTime) * 1000;
                    this.updateTimerDisplay();
                    this.saveTimerState();
                    this._showInlineToast('Timer updated!');
                    this._refreshStartTimeInput();
                }
                inlineTimePicker.style.display = 'none';
                timerDisplay.style.display = 'block';
            }
            inlineTimePicker.addEventListener('blur', applyInlineTimeEdit.bind(this));
            inlineTimePicker.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    applyInlineTimeEdit.call(this);
                }
            });
        } else {
            console.log('[DEBUG] WARNING: timer display elements not found');
        }
        
        // Start time input
        const startTimeInput = document.getElementById('start-time');
        if (startTimeInput) {
            console.log('[DEBUG] Found start time input, adding event listener');
            startTimeInput.addEventListener('change', (e) => this.handleStartTimeEdit(e));
        } else {
            console.log('[DEBUG] WARNING: start-time input not found');
        }
        
        // Elapsed time input (details section)
        const elapsedTimeInput = document.getElementById('elapsed-time');
        if (elapsedTimeInput) {
            console.log('[DEBUG] Found elapsed time input, adding event listeners');
            elapsedTimeInput.addEventListener('focus', () => {
                elapsedTimeInput.select();
            });
            elapsedTimeInput.addEventListener('change', () => {
                console.log('[DEBUG] Elapsed time input changed');
                const val = elapsedTimeInput.value;
                if (val) {
                    const parts = val.split(':');
                    let seconds = 0;
                    if (parts.length === 2) {
                        seconds = (+parts[0]) * 3600 + (+parts[1]) * 60;
                    } else if (parts.length === 3) {
                        seconds = (+parts[0]) * 3600 + (+parts[1]) * 60 + (+parts[2]);
                    }
                    this.startTime = Date.now() - (seconds + this.pausedTime) * 1000;
                    this.updateTimerDisplay();
                    this.saveTimerState();
                    this._showInlineToast('Timer updated!');
                    this._refreshStartTimeInput();
                }
            });
        } else {
            console.log('[DEBUG] WARNING: elapsed-time input not found');
        }
        
        // Stop
        const stopBtn = document.getElementById('stop-button');
        if (stopBtn) {
            console.log('[DEBUG] Found stop button, adding event listener');
            stopBtn.addEventListener('click', () => {
                console.log('[DEBUG] Stop button clicked');
                this.stopTimer();
            });
        } else {
            console.log('[DEBUG] WARNING: stop-button not found');
        }
        
        // Stop & Adjust
        const stopAdjustBtn = document.getElementById('stop-adjust-button');
        if (stopAdjustBtn) {
            console.log('[DEBUG] Found stop-adjust button, adding event listener');
            stopAdjustBtn.addEventListener('click', () => this.showAdjustModal(true));
        } else {
            console.log('[DEBUG] WARNING: stop-adjust-button not found');
        }
        
        // Modal: close
        const adjustCancel = document.getElementById('adjust-cancel');
        if (adjustCancel) adjustCancel.addEventListener('click', () => this.closeAdjustModal());
        // Modal: apply
        const adjustApply = document.getElementById('adjust-apply');
        if (adjustApply) adjustApply.addEventListener('click', () => this.applyAdjustment());
        // Modal: save & stop
        const adjustApplyStop = document.getElementById('adjust-apply-stop');
        if (adjustApplyStop) adjustApplyStop.addEventListener('click', () => this.applyAdjustment(true));
        // Modal: adjust inputs
        const adjStartTimeInput = document.getElementById('adjust-start-time');
        if (adjStartTimeInput) adjStartTimeInput.addEventListener('change', (e) => this.handleAdjustStartTimeChange(e));
        const adjElapsedInput = document.getElementById('adjust-elapsed-time');
        if (adjElapsedInput) {
            adjElapsedInput.addEventListener('change', (e) => this.handleAdjustElapsedTimeChange(e));
        }
        // Adjust dialog: sync Start, End, Elapsed
        const adjEndTimeInput = document.getElementById('adjust-end-time');
        if (adjStartTimeInput && adjElapsedInput) {
            adjStartTimeInput.addEventListener('change', () => this._syncAdjustFields('start'));
            adjElapsedInput.addEventListener('change', () => this._syncAdjustFields('elapsed'));
        }
        if (adjEndTimeInput) {
            adjEndTimeInput.addEventListener('change', () => this._syncAdjustFields('end'));
        }
        // Ensure elapsed time input uses step=60 (minutes only)
        if (adjElapsedInput) adjElapsedInput.setAttribute('step', '60');
        
        console.log('[DEBUG] setupEventListeners() completed');
    }

    showAdjustModal(stopAfter = false) {
        const modal = document.getElementById('adjust-modal');
        if (!modal) return;
        // Set current values
        const adjStartTimeInput = document.getElementById('adjust-start-time');
        const adjElapsedInput = document.getElementById('adjust-elapsed-time');
        const endTimeRow = document.getElementById('end-time-row');
        const adjEndTimeInput = document.getElementById('adjust-end-time');
        // Show/hide End Time row
        if (endTimeRow) endTimeRow.style.display = stopAfter ? 'block' : 'none';
        // Set start time (local time, no timezone offset)
        if (adjStartTimeInput) {
            const d = new Date(this.startTime);
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            const hh = String(d.getHours()).padStart(2, '0');
            const min = String(d.getMinutes()).padStart(2, '0');
            adjStartTimeInput.value = `${yyyy}-${mm}-${dd}T${hh}:${min}`;
        }
        // Set elapsed time as HH:MM:SS
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000) - this.pausedTime;
        if (adjElapsedInput) adjElapsedInput.value = this._formatElapsedForInput(elapsed);
        // Set end time if needed
        if (adjEndTimeInput && stopAfter) {
            const end = this.isPaused && this.pauseStartTime ? this.pauseStartTime : Date.now();
            const d = new Date(end);
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            const hh = String(d.getHours()).padStart(2, '0');
            const min = String(d.getMinutes()).padStart(2, '0');
            adjEndTimeInput.value = `${yyyy}-${mm}-${dd}T${hh}:${min}`;
        }
        this.updateAdjustmentPreview(this.startTime, 0, stopAfter);
        modal.style.display = 'flex';
        this._stopAfterAdjust = stopAfter;
    }

    closeAdjustModal() {
        const modal = document.getElementById('adjust-modal');
        if (modal) modal.style.display = 'none';
    }

    showElapsedTimeEditor() {
        this.showAdjustModal();
        setTimeout(() => {
            const input = document.getElementById('adjust-elapsed-time');
            if (input) input.focus();
        }, 100);
    }

    handleStartTimeEdit(event) {
        const newStartTime = new Date(event.target.value).getTime();
        this.startTime = newStartTime;
        this.updateTimerDisplay();
        this.saveTimerState();
    }

    handleAdjustStartTimeChange(event) {
        const newStartTime = new Date(event.target.value).getTime();
        this.updateAdjustmentPreview(newStartTime, 0);
    }

    handleAdjustElapsedTimeChange(event) {
        const timeParts = event.target.value.split(':');
        if (timeParts.length === 3) {
            const seconds = (+timeParts[0]) * 3600 + (+timeParts[1]) * 60 + (+timeParts[2]);
            this.updateAdjustmentPreview(Date.now() - (seconds + this.pausedTime) * 1000, 0);
        }
    }

    _syncAdjustFields(changed) {
        const adjStart = document.getElementById('adjust-start-time');
        const adjElapsed = document.getElementById('adjust-elapsed-time');
        const adjEnd = document.getElementById('adjust-end-time');
        if (!(adjStart && adjElapsed)) return;
        let start = new Date(adjStart.value).getTime();
        let elapsed = this._parseElapsedFromInput(adjElapsed.value);
        let end = null;
        if (adjEnd && adjEnd.value) {
            end = new Date(adjEnd.value).getTime();
        }
        if (changed === 'start' && adjEnd && adjEnd.value) {
            // If start or end changed, update elapsed
            elapsed = Math.floor((end - start) / 1000);
            if (elapsed < 0) elapsed = 0;
            if (adjElapsed) adjElapsed.value = this._formatElapsedForInput(elapsed);
        } else if (changed === 'end' && adjStart.value) {
            // If end changed, update elapsed
            elapsed = Math.floor((end - start) / 1000);
            if (elapsed < 0) elapsed = 0;
            if (adjElapsed) adjElapsed.value = this._formatElapsedForInput(elapsed);
        } else if (changed === 'elapsed' && adjEnd && adjEnd.style.display !== 'none') {
            // If elapsed changed and end time is visible, update end time
            end = start + elapsed * 1000;
            if (adjEnd) {
                const d = new Date(end);
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                const hh = String(d.getHours()).padStart(2, '0');
                const min = String(d.getMinutes()).padStart(2, '0');
                adjEnd.value = `${yyyy}-${mm}-${dd}T${hh}:${min}`;
            }
        }
        // Always update preview
        this.updateAdjustmentPreview(start, 0, adjEnd && adjEnd.style.display !== 'none');
    }

    updateAdjustmentPreview(newStartTime, secondsAdjustment, useEndTime = false) {
        const adjElapsed = document.getElementById('adjust-elapsed-time');
        const adjEnd = document.getElementById('adjust-end-time');
        let elapsed = 0;
        if (useEndTime && adjEnd && adjEnd.value) {
            const end = new Date(adjEnd.value).getTime();
            elapsed = Math.floor((end - newStartTime) / 1000);
        } else if (adjElapsed && adjElapsed.value) {
            elapsed = this._parseElapsedFromInput(adjElapsed.value);
        }
        if (elapsed < 0) elapsed = 0;
        document.getElementById('adjust-preview').textContent = formatTime(elapsed);
    }

    applyAdjustment(stopAfter = false) {
        const adjStart = document.getElementById('adjust-start-time');
        const adjElapsed = document.getElementById('adjust-elapsed-time');
        const adjEnd = document.getElementById('adjust-end-time');
        let newStartTime = new Date(adjStart.value).getTime();
        let elapsedSeconds = 0;
        if (stopAfter && adjEnd && adjEnd.value) {
            // Use end time if present
            const end = new Date(adjEnd.value).getTime();
            elapsedSeconds = Math.floor((end - newStartTime) / 1000);
        } else if (adjElapsed && adjElapsed.value) {
            elapsedSeconds = this._parseElapsedFromInput(adjElapsed.value);
        }
        if (elapsedSeconds < 0) elapsedSeconds = 0;
        this.startTime = Date.now() - (elapsedSeconds + this.pausedTime) * 1000;
        this.updateTimerDisplay();
        this.saveTimerState();
        this.closeAdjustModal();
        if (stopAfter || this._stopAfterAdjust) {
            this.stopTimer();
        }
    }

    startActivity(category, activity, recovery = false) {
        // Always clear any previous timer interval
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.currentCategory = category;
        this.currentActivity = activity;
        if (!recovery) {
            this.startTime = Date.now();
            this.pausedTime = 0;
            this.isPaused = false;
            this.pauseStartTime = null;
        }
        const activityNameEl = document.getElementById('current-activity-name');
        if (activityNameEl) activityNameEl.textContent = `${category} - ${activity}`;
        // Set initial today total time
        const todayTime = this.storage.getTodayTime(category, activity);
        const todayTotalTimeEl = document.getElementById('today-total-time');
        if (todayTotalTimeEl) todayTotalTimeEl.textContent = formatTime(todayTime);
        const timerSection = document.getElementById('timer-section');
        if (timerSection) timerSection.style.display = 'block';
        const activityList = document.getElementById('activity-list');
        if (activityList) activityList.style.display = 'none';
        const nav = document.querySelector('.navigation');
        if (nav) nav.classList.add('navigation-disabled');
        document.querySelectorAll('.activity-button').forEach(btn => { btn.disabled = true; });
        if (typeof this.showScreen === 'function') this.showScreen('activity');
        // Only update icon, not text
        const pauseIcon = document.getElementById('pause-icon');
        if (pauseIcon) pauseIcon.textContent = '⏸️';
        const pauseButton = document.getElementById('pause-button');
        if (pauseButton) {
            pauseButton.setAttribute('aria-label', 'Pause');
            pauseButton.classList.remove('paused');
        }
        this._updateTimerStatusUI();
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
        if (this.isPaused && this.pauseStartTime) {
            elapsed = Math.floor((this.pauseStartTime - this.startTime) / 1000) - this.pausedTime;
        }
        document.getElementById('timer-display').textContent = formatTime(elapsed);
        document.getElementById('elapsed-time').textContent = formatTime(elapsed);
        const previousTime = this.storage.getTodayTime(this.currentCategory, this.currentActivity);
        const totalTime = previousTime + elapsed;
        document.getElementById('today-total-time').textContent = formatTime(totalTime);
        this._refreshStartTimeInput();
    }

    _refreshStartTimeInput() {
        // Always update the start time input to reflect the current start time
        const startTimeInput = document.getElementById('start-time');
        if (startTimeInput && this.startTime) {
            const d = new Date(this.startTime);
            // Format as yyyy-MM-ddTHH:mm
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            const hh = String(d.getHours()).padStart(2, '0');
            const min = String(d.getMinutes()).padStart(2, '0');
            startTimeInput.value = `${yyyy}-${mm}-${dd}T${hh}:${min}`;
        }
    }

    togglePause() {
        const pauseButton = document.getElementById('pause-button');
        const pauseIcon = document.getElementById('pause-icon');
        if (this.isPaused) {
            if (this.pauseStartTime) {
                this.pausedTime += Math.floor((Date.now() - this.pauseStartTime) / 1000);
            }
            this.isPaused = false;
            this.pauseStartTime = null;
            if (pauseIcon) pauseIcon.textContent = '⏸️';
            if (pauseButton) pauseButton.setAttribute('aria-label', 'Pause');
            pauseButton.classList.remove('paused');
        } else {
            this.isPaused = true;
            this.pauseStartTime = Date.now();
            if (pauseIcon) pauseIcon.textContent = '▶️';
            if (pauseButton) pauseButton.setAttribute('aria-label', 'Resume');
            pauseButton.classList.add('paused');
        }
        this._updateTimerStatusUI();
        this.saveTimerState();
    }

    stopTimer() {
        // Allow stopping if we have a start time, even if interval is not set (Quick Restart scenario)
        if (!this.startTime) return;
        
        let elapsed = Math.floor((Date.now() - this.startTime) / 1000) - this.pausedTime;
        const endTime = Date.now();
        if (this.isPaused && this.pauseStartTime) {
            elapsed = Math.floor((this.pauseStartTime - this.startTime) / 1000) - this.pausedTime;
        }
        const categoryName = this.currentCategory;
        const activityName = this.currentActivity;
        const sessionData = {
            id: `session_${this.startTime}_${Math.random().toString(36).substr(2, 9)}`,
            startTime: this.startTime,
            endTime: this.isPaused ? this.pauseStartTime : endTime,
            pausedTime: this.pausedTime
        };
        this.storage.addTimeRecord(this.currentCategory, this.currentActivity, elapsed, new Date(), sessionData);
        
        // Store recently stopped session BEFORE clearing state
        this.storeRecentlyStopped(categoryName, activityName);
        
        // Now clear timer state
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        this.timerInterval = null;
        this.startTime = null;
        this.pausedTime = 0;
        this.pauseStartTime = null;
        this.isPaused = false;
        document.querySelector('.navigation').classList.remove('navigation-disabled');
        document.getElementById('timer-section').style.display = 'none';
        document.getElementById('activity-list').style.display = 'block';
        document.querySelectorAll('.activity-button').forEach(btn => { btn.disabled = false; });
        this.storage.clearTimerState();
        
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
        if (timerState && timerState.active) {
            this.startActivity(timerState.category, timerState.activity, true);
                this.startTime = timerState.startTime;
            this.pausedTime = timerState.pausedTime;
            this.isPaused = timerState.isPaused;
            this.pauseStartTime = timerState.pauseStartTime;
            if (this.isPaused) {
                const pauseButton = document.getElementById('pause-button');
                pauseButton.textContent = 'Resume';
                pauseButton.classList.add('paused');
            }
        }
    }

    _updateTimerStatusUI() {
        const statusEl = document.getElementById('timer-status');
        if (statusEl) {
            if (this.isPaused) {
                statusEl.textContent = '⏸️ Timer Paused';
                statusEl.style.color = '#f39c12';
            } else {
                statusEl.textContent = '▶️ Timer Running';
                statusEl.style.color = '#27ae60';
            }
        }
    }

    _showInlineToast(msg) {
        let toast = document.createElement('div');
        toast.textContent = msg;
        toast.style.position = 'fixed';
        toast.style.top = '20px';
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%)';
        toast.style.background = '#3498db';
        toast.style.color = '#fff';
        toast.style.padding = '10px 24px';
        toast.style.borderRadius = '6px';
        toast.style.fontSize = '1.1rem';
        toast.style.zIndex = 2000;
        toast.style.boxShadow = '0 2px 8px #0002';
        document.body.appendChild(toast);
        setTimeout(() => { toast.remove(); }, 1200);
    }

    // Helper to format elapsed seconds as HH:MM:SS for <input type="time">
    _formatElapsedForInput(elapsed) {
        // Clamp to zero to avoid negative times
        if (elapsed < 0) elapsed = 0;
        const h = String(Math.floor(elapsed / 3600)).padStart(2, '0');
        const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
        const s = String(elapsed % 60).padStart(2, '0');
        return `${h}:${m}:${s}`;
    }

    _parseElapsedFromInput(val) {
        // Accepts HH:MM or HH:MM:SS
        if (!val) return 0;
        const parts = val.split(':');
        if (parts.length === 2) {
            return (+parts[0]) * 3600 + (+parts[1]) * 60;
        } else if (parts.length === 3) {
            return (+parts[0]) * 3600 + (+parts[1]) * 60 + (+parts[2]);
        }
        return 0;
    }

    // Quick Restart functionality
    showQuickRestartToast() {
        if (!this.recentlyStopped) return;
        
        // Clear any existing toast
        this.clearQuickRestartToast();
        
        // Create toast element
        const toast = document.createElement('div');
        toast.className = 'quick-restart-toast';
        toast.innerHTML = `
            <span>Stopped by mistake?</span>
            <button onclick="window.quickRestart()" class="quick-restart-btn">
                Resume where you left off
            </button>
        `;
        
        // Add to DOM
        document.body.appendChild(toast);
        
        // Debug log
        console.log('[QuickRestart] Showing quick restart toast!', this.recentlyStopped);
        
        // Auto-remove after 60 seconds
        this.quickRestartTimeout = setTimeout(() => {
            this.clearQuickRestartToast();
        }, 60000);
        
        // Add fade-in animation
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
    }

    clearQuickRestartToast() {
        const existingToast = document.querySelector('.quick-restart-toast');
        if (existingToast) {
            existingToast.remove();
        }
        if (this.quickRestartTimeout) {
            clearTimeout(this.quickRestartTimeout);
            this.quickRestartTimeout = null;
        }
    }

    // Re-establish all timer touchpoints after Quick Restart
    reestablishTimerTouchpoints() {
        console.log('[DEBUG] reestablishTimerTouchpoints() called');
        console.log('[DEBUG] Current state:', {
            category: this.currentCategory,
            activity: this.currentActivity,
            startTime: this.startTime,
            pausedTime: this.pausedTime,
            isPaused: this.isPaused,
            timerInterval: !!this.timerInterval
        });
        
        // 1. Render the activity screen UI
        console.log('[DEBUG] Step 1: Rendering activity screen UI');
        this.renderActivityScreen();
        
        // 2. Re-attach all event listeners (they may have been lost after DOM updates)
        console.log('[DEBUG] Step 2: Re-attaching event listeners');
        this.setupEventListeners();
        
        // 3. Ensure timer interval is properly managed
        console.log('[DEBUG] Step 3: Managing timer interval');
        if (this.timerInterval) {
            console.log('[DEBUG] Clearing existing timer interval');
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        // 4. Start timer interval if timer should be running
        if (!this.isPaused && this.startTime) {
            console.log('[DEBUG] Timer is running - starting interval');
            this.timerInterval = setInterval(() => {
                console.log('[DEBUG] Timer interval fired - updating display');
                this.updateTimerDisplay();
            }, 1000);
            this.updateTimerDisplay();
        } else if (this.isPaused) {
            console.log('[DEBUG] Timer is paused - not starting interval');
            this.updateTimerDisplay();
        }
        
        // 5. Save the restored state AFTER timer interval is established
        console.log('[DEBUG] Step 4: Saving timer state');
        this.saveTimerState();
        
        console.log('[DEBUG] Final state after re-establishment:', {
            category: this.currentCategory,
            activity: this.currentActivity,
            startTime: this.startTime,
            pausedTime: this.pausedTime,
            isPaused: this.isPaused,
            timerInterval: !!this.timerInterval
        });
        
        console.log('[QuickRestart] Timer touchpoints re-established successfully');
    }

    quickRestart() {
        console.log('[DEBUG] quickRestart() called');
        console.log('[DEBUG] recentlyStopped data:', this.recentlyStopped);
        
        if (!this.recentlyStopped) {
            console.log('[DEBUG] No recentlyStopped data - aborting');
            return;
        }
        
        this.clearQuickRestartToast();
        
        // Restore all state
        const { category, activity, startTime, pausedTime, isPaused, pauseStartTime } = this.recentlyStopped;
        console.log('[DEBUG] Restoring state:', { category, activity, startTime, pausedTime, isPaused, pauseStartTime });
        
        // Validate restored data
        if (!category || !activity || !startTime) {
            console.error('[DEBUG] Invalid restored data - aborting');
            return;
        }
        
        this.currentCategory = category;
        this.currentActivity = activity;
        this.startTime = startTime;
        this.pausedTime = pausedTime || 0;
        this.isPaused = isPaused || false;
        this.pauseStartTime = pauseStartTime || null;
        
        console.log('[DEBUG] State restored, calling reestablishTimerTouchpoints()');
        
        // Re-establish all touchpoints in one clean call
        this.reestablishTimerTouchpoints();
        
        // Clear the recently stopped data
        this.recentlyStopped = null;
        try { localStorage.removeItem('recentlyStopped'); } catch (e) {}
        
        console.log('[DEBUG] Quick restart completed');
        this._showInlineToast('Timer restarted!');
    }

    // Render only the activity screen UI, do not touch timer state
    renderActivityScreen() {
        const activityNameEl = document.getElementById('current-activity-name');
        if (activityNameEl) activityNameEl.textContent = `${this.currentCategory} - ${this.currentActivity}`;
        const todayTime = this.storage.getTodayTime(this.currentCategory, this.currentActivity);
        const todayTotalTimeEl = document.getElementById('today-total-time');
        if (todayTotalTimeEl) todayTotalTimeEl.textContent = formatTime(todayTime);
        const timerSection = document.getElementById('timer-section');
        if (timerSection) timerSection.style.display = 'block';
        const activityList = document.getElementById('activity-list');
        if (activityList) activityList.style.display = 'none';
        const nav = document.querySelector('.navigation');
        if (nav) nav.classList.add('navigation-disabled');
        document.querySelectorAll('.activity-button').forEach(btn => { btn.disabled = true; });
        if (typeof this.showScreen === 'function') this.showScreen('activity');
        
        // Update pause button state based on current timer state
        const pauseIcon = document.getElementById('pause-icon');
        if (pauseIcon) pauseIcon.textContent = this.isPaused ? '▶️' : '⏸️';
        const pauseButton = document.getElementById('pause-button');
        if (pauseButton) {
            pauseButton.setAttribute('aria-label', this.isPaused ? 'Resume' : 'Pause');
            if (this.isPaused) {
                pauseButton.classList.add('paused');
            } else {
                pauseButton.classList.remove('paused');
            }
        }
        
        // Update timer display once to show current state
        this.updateTimerDisplay();
        this._updateTimerStatusUI();
    }

    storeRecentlyStopped(category, activity) {
        // Store all relevant session state for true recovery
        const data = {
            category: this.currentCategory,
            activity: this.currentActivity,
            startTime: this.startTime,
            pausedTime: this.pausedTime,
            isPaused: this.isPaused,
            pauseStartTime: this.pauseStartTime,
            timestamp: Date.now()
        };
        this.recentlyStopped = data;
        // Persist to localStorage
        try {
            localStorage.setItem('recentlyStopped', JSON.stringify(data));
        } catch (e) { console.warn('Could not persist recentlyStopped', e); }
        this.showQuickRestartToast();
    }

    // Clear quick restart when starting a new timer or navigating away
    clearQuickRestart() {
        this.clearQuickRestartToast();
        this.recentlyStopped = null;
        // Remove from localStorage
        try {
            localStorage.removeItem('recentlyStopped');
        } catch (e) { console.warn('Could not clear recentlyStopped', e); }
    }

    // Restore quick restart toast if within 60 seconds
    restoreQuickRestartFromStorage() {
        try {
            const raw = localStorage.getItem('recentlyStopped');
            if (raw) {
                const data = JSON.parse(raw);
                if (data && data.timestamp && (Date.now() - data.timestamp < 60000)) {
                    this.recentlyStopped = data;
                    this.showQuickRestartToast();
                } else {
                    localStorage.removeItem('recentlyStopped');
                }
            }
        } catch (e) { console.warn('Could not restore recentlyStopped', e); }
    }
}

// At the end of the file, add a global debug function
if (typeof window !== 'undefined') {
    window.debugShowQuickRestartToast = function() {
        if (window.app && window.app.timer) {
            window.app.timer.recentlyStopped = { category: 'Debug', activity: 'Test', timestamp: Date.now() };
            window.app.timer.showQuickRestartToast();
        } else {
            console.warn('App or timer not available for debugShowQuickRestartToast');
        }
    };
} 