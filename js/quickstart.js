// Smart Quick Start functionality
import { activityEmojis } from './data.js';

export class QuickStart {
    constructor(storage, getCategories, getSetting) {
        this.storage = storage;
        this.getCategories = getCategories;
        this.getSetting = getSetting; // Function to get setting values
    }

    renderQuickStart(startActivityCallback) {
        const quickStartGrid = document.querySelector('.quick-start-grid');
        quickStartGrid.innerHTML = '';

        const quickStartActivities = this.getSmartQuickStart();
        
        quickStartActivities.forEach(({category, activity, score}) => {
            const button = document.createElement('button');
            button.className = 'quick-start-button';
            
            const categories = this.getCategories();
            button.style.setProperty('--category-color', categories[category]?.color || '#4A90E2');
            
            button.onclick = () => startActivityCallback(category, activity);

            const emoji = activityEmojis[activity] || categories[category]?.emoji || '⭐';
            
            button.innerHTML = `
                <span class="quick-start-emoji">${emoji}</span>
                <div class="quick-start-name">${activity}</div>
                <div class="quick-start-category">${category}</div>
            `;

            quickStartGrid.appendChild(button);
        });

        // If no quick start activities, show a message
        if (quickStartActivities.length === 0) {
            quickStartGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: #7f8c8d; padding: 20px;">Start tracking activities to see personalized quick start buttons!</div>';
        }
    }

    getSmartQuickStart() {
        const currentHour = new Date().getHours();
        const now = Date.now();
        const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
        
        // Get configurable count from settings (default to 6)
        const quickStartCount = this.getSetting ? (this.getSetting('quickStartCount') || 6) : 6;
        
        const scores = [];
        const categories = this.getCategories();
        
        Object.entries(this.storage.activityUsageStats).forEach(([key, stats]) => {
            const [category, activity] = key.split('::');
            
            // Skip if category doesn't exist anymore
            if (!categories[category] || !categories[category].activities.includes(activity)) {
                return;
            }
            
            let score = 0;
            
            // Frequency score (40% weight)
            score += stats.frequency * 0.4;
            
            // Recency score (30% weight) - higher for more recent usage
            const daysSinceLastUse = (now - stats.lastUsed) / (24 * 60 * 60 * 1000);
            const recencyScore = Math.max(0, 7 - daysSinceLastUse) / 7;
            score += recencyScore * 30;
            
            // Time of day pattern (30% weight)
            const timePattern = stats.timeOfDayPattern || {};
            const currentHourUsage = timePattern[currentHour] || 0;
            const maxHourUsage = Math.max(...Object.values(timePattern), 1);
            const timeScore = (currentHourUsage / maxHourUsage) * 30;
            score += timeScore;
            
            scores.push({ category, activity, score });
        });
        
        // Sort by score and take configured count
        return scores
            .sort((a, b) => b.score - a.score)
            .slice(0, quickStartCount);
    }
} 