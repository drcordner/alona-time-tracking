// Enhanced Reports Module with Charts and Analytics
import { formatTime } from './utils.js';

export class Reports {
    constructor(storage, getCategories, getGoalsSummary) {
        this.storage = storage;
        this.getCategories = getCategories;
        this.getGoalsSummary = getGoalsSummary;
        
        // State
        this.reportDate = new Date();
        this.reportView = 'day';
        this.reportData = {};
        this.totalTime = 0;
        this.chartType = 'pie';
        this.selectedCategory = null;
    }

    // Set report view and refresh
    setReportView(view) {
        this.reportView = view;
        document.querySelectorAll('.toggle-button').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        this.renderReports();
    }

    // Navigate between dates
    navigateDate(direction) {
        const currentDate = new Date(this.reportDate);
        
        if (this.reportView === 'day') {
            currentDate.setDate(currentDate.getDate() + direction);
        } else if (this.reportView === 'week') {
            currentDate.setDate(currentDate.getDate() + (direction * 7));
        } else if (this.reportView === 'month') {
            currentDate.setMonth(currentDate.getMonth() + direction);
        }
        
        this.reportDate = currentDate;
        this.updateReportDate();
        this.renderReports();
    }

    // Update the displayed date
    updateReportDate() {
        const dateEl = document.getElementById('current-report-date');
        if (!dateEl) return;
        
        if (this.reportView === 'day') {
            dateEl.textContent = this.reportDate.toLocaleDateString();
        } else if (this.reportView === 'week') {
            const startOfWeek = new Date(this.reportDate);
            startOfWeek.setDate(this.reportDate.getDate() - this.reportDate.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            dateEl.textContent = `${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`;
        } else if (this.reportView === 'month') {
            dateEl.textContent = this.reportDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        }
    }

    // Main render function - creates the entire reports interface
    renderReports() {
        console.log('Reports: Rendering reports for', this.reportView, this.reportDate);
        
        // Show loading state
        const reportsContainer = document.getElementById('reports-content');
        if (reportsContainer && window.app?.ux) {
            window.app.ux.showLoading(reportsContainer, 'Loading reports...');
        }
        
        // Use setTimeout to allow loading state to show
        setTimeout(() => {
            try {
                this.updateReportDate();
                
                // Calculate report data
                const data = this.calculateReportData();
                const totalTime = Object.values(data).reduce((total, activities) => {
                    return total + Object.values(activities).reduce((sum, time) => sum + time, 0);
                }, 0);
                
                this.reportData = data;
                this.totalTime = totalTime;
                
                // Render all sections
                const reportsHTML = `
                    <div class="reports-layout fade-in">
                        <!-- Reports Actions (Compact Layout) -->
                        ${this.renderCompactActions()}
                        
                        <!-- Statistics Cards (Compact 2x2 Grid) -->
                        ${this.renderCompactStatsCards()}
                        
                        <!-- Interactive Charts Section -->
                        ${this.renderMainChart()}
                        
                        <!-- Timeline Chart with Individual Sessions -->
                        ${this.renderTimelineChart()}
                        
                        <!-- Goals Progress (if enabled) -->
                        ${this.renderGoalsSection()}
                        
                        <!-- Activity Rankings (Compact) -->
                        ${this.renderCompactActivityRankings()}
                    </div>
                `;
                
                const container = document.getElementById('reports-content');
                if (container) {
                    container.innerHTML = reportsHTML;
                    
                    // Add fade-in animation to new content
                    if (window.app?.ux) {
                        window.app.ux.addAnimation(container, 'fade-in');
                    }
                }
                
                console.log('Reports: Rendering complete');
            } catch (error) {
                console.error('Error rendering reports:', error);
                if (window.app?.ux) {
                    window.app.ux.handleError(error, 'Reports rendering');
                }
            } finally {
                // Hide loading state
                if (window.app?.ux) {
                    window.app.ux.hideLoading();
                }
            }
        }, 100); // Small delay to show loading state
    }

    // Calculate aggregated data for the current view
    calculateReportData() {
        this.reportData = {};
        this.totalTime = 0;
        
        if (this.reportView === 'day') {
            this.reportData = this.storage.getDateData(this.reportDate);
        } else if (this.reportView === 'week') {
            // Aggregate week data
            for (let i = 0; i < 7; i++) {
                const date = new Date(this.reportDate);
                date.setDate(this.reportDate.getDate() - this.reportDate.getDay() + i);
                const dayData = this.storage.getDateData(date);
                
                Object.entries(dayData).forEach(([category, activities]) => {
                    if (!this.reportData[category]) this.reportData[category] = {};
                    Object.entries(activities).forEach(([activity, time]) => {
                        if (!this.reportData[category][activity]) this.reportData[category][activity] = 0;
                        this.reportData[category][activity] += time;
                    });
                });
            }
        } else if (this.reportView === 'month') {
            // Aggregate month data
            const year = this.reportDate.getFullYear();
            const month = this.reportDate.getMonth();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            
            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(year, month, day);
                const dayData = this.storage.getDateData(date);
                
                Object.entries(dayData).forEach(([category, activities]) => {
                    if (!this.reportData[category]) this.reportData[category] = {};
                    Object.entries(activities).forEach(([activity, time]) => {
                        if (!this.reportData[category][activity]) this.reportData[category][activity] = 0;
                        this.reportData[category][activity] += time;
                    });
                });
            }
        } else if (this.reportView === 'custom' && this.customStartDate && this.customEndDate) {
            // Aggregate custom date range data
            const startDate = new Date(this.customStartDate);
            const endDate = new Date(this.customEndDate);
            
            for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
                const dayData = this.storage.getDateData(date);
                
                Object.entries(dayData).forEach(([category, activities]) => {
                    if (!this.reportData[category]) this.reportData[category] = {};
                    Object.entries(activities).forEach(([activity, time]) => {
                        if (!this.reportData[category][activity]) this.reportData[category][activity] = 0;
                        this.reportData[category][activity] += time;
                    });
                });
            }
        }

        // Calculate total time
        this.totalTime = Object.values(this.reportData).reduce((total, activities) => {
            return total + Object.values(activities).reduce((sum, time) => sum + time, 0);
        }, 0);

        return this.reportData;
    }

    // Render statistics cards
    renderStatsCards() {
        if (this.totalTime === 0) {
            return `
                <div class="stat-card empty">
                    <div class="stat-icon">📊</div>
                    <div class="stat-content">
                        <h3>No Activity</h3>
                        <p>No time recorded for this ${this.reportView}</p>
                    </div>
                </div>
            `;
        }

        const categories = this.getCategories();
        const categoryTotals = Object.entries(this.reportData).map(([name, activities]) => ({
            name,
            time: Object.values(activities).reduce((sum, time) => sum + time, 0),
            color: categories[name]?.color || '#bdc3c7',
            emoji: categories[name]?.emoji || '📁'
        })).sort((a, b) => b.time - a.time);

        const topCategory = categoryTotals[0];
        const averagePerDay = this.reportView === 'month' ? Math.floor(this.totalTime / new Date(this.reportDate.getFullYear(), this.reportDate.getMonth() + 1, 0).getDate()) :
                             this.reportView === 'week' ? Math.floor(this.totalTime / 7) : this.totalTime;

        return `
            <div class="stat-card primary">
                <div class="stat-icon">⏱️</div>
                <div class="stat-content">
                    <h3>${formatTime(this.totalTime)}</h3>
                    <p>Total Time</p>
                </div>
            </div>
            
            <div class="stat-card success">
                <div class="stat-icon">${topCategory.emoji}</div>
                <div class="stat-content">
                    <h3>${topCategory.name}</h3>
                    <p>Top Category (${formatTime(topCategory.time)})</p>
                </div>
            </div>
            
            <div class="stat-card info">
                <div class="stat-icon">📅</div>
                <div class="stat-content">
                    <h3>${formatTime(averagePerDay)}</h3>
                    <p>Average per ${this.reportView === 'day' ? 'day' : 'day'}</p>
                </div>
            </div>
            
            <div class="stat-card warning">
                <div class="stat-icon">🎯</div>
                <div class="stat-content">
                    <h3>${categoryTotals.length}</h3>
                    <p>Active Categories</p>
                </div>
            </div>
        `;
    }

    // Render interactive pie chart
    renderPieChart() {
        if (this.totalTime === 0) {
            return `<div class="no-data">No data to display</div>`;
        }

        const categories = this.getCategories();
        const categoryTotals = Object.entries(this.reportData).map(([name, activities]) => ({
            name,
            time: Object.values(activities).reduce((sum, time) => sum + time, 0),
            color: categories[name]?.color || '#bdc3c7',
            emoji: categories[name]?.emoji || '📁'
        })).sort((a, b) => b.time - a.time);

        const centerX = 120;
        const centerY = 120;
        const radius = 100;
        let currentAngle = 0;

        const segments = categoryTotals.map((category, index) => {
            const percentage = (category.time / this.totalTime) * 100;
            const angle = (category.time / this.totalTime) * 360;
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;
            
            const x1 = centerX + radius * Math.cos((startAngle * Math.PI) / 180);
            const y1 = centerY + radius * Math.sin((startAngle * Math.PI) / 180);
            const x2 = centerX + radius * Math.cos((endAngle * Math.PI) / 180);
            const y2 = centerY + radius * Math.sin((endAngle * Math.PI) / 180);
            
            const largeArcFlag = angle > 180 ? 1 : 0;
            
            const pathData = [
                `M ${centerX} ${centerY}`,
                `L ${x1} ${y1}`,
                `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                'Z'
            ].join(' ');
            
            currentAngle += angle;
            
            return `
                <path d="${pathData}" 
                      fill="${category.color}" 
                      stroke="white" 
                      stroke-width="2"
                      class="pie-segment"
                      data-category="${category.name}"
                      onclick="reports.selectCategory('${category.name}')"
                      style="cursor: pointer; transition: opacity 0.2s;">
                    <title>${category.name}: ${formatTime(category.time)} (${percentage.toFixed(1)}%)</title>
                </path>
            `;
        });

        const legend = categoryTotals.map((category, index) => {
            const percentage = (category.time / this.totalTime) * 100;
            return `
                <div class="legend-item" onclick="reports.selectCategory('${category.name}')" style="cursor: pointer;">
                    <div class="legend-color" style="background-color: ${category.color}"></div>
                    <span class="legend-label">${category.emoji} ${category.name}</span>
                    <span class="legend-value">${formatTime(category.time)} (${percentage.toFixed(1)}%)</span>
                </div>
            `;
        }).join('');

        return `
            <div class="chart-with-legend">
                <div class="pie-chart-container">
                    <svg width="240" height="240" viewBox="0 0 240 240">
                        ${segments.join('')}
                    </svg>
                </div>
                <div class="chart-legend">
                    ${legend}
                </div>
            </div>
        `;
    }

    // Render interactive bar chart
    renderBarChart() {
        if (this.totalTime === 0) {
            return `<div class="no-data">No data to display</div>`;
        }

        const categories = this.getCategories();
        const categoryTotals = Object.entries(this.reportData).map(([name, activities]) => ({
            name,
            time: Object.values(activities).reduce((sum, time) => sum + time, 0),
            color: categories[name]?.color || '#bdc3c7',
            emoji: categories[name]?.emoji || '📁'
        })).sort((a, b) => b.time - a.time);

        const maxTime = categoryTotals[0]?.time || 1;

        const bars = categoryTotals.map((category, index) => {
            const percentage = (category.time / this.totalTime) * 100;
            const barWidth = (category.time / maxTime) * 100;
            
            return `
                <div class="bar-item" onclick="reports.selectCategory('${category.name}')" style="cursor: pointer;">
                    <div class="bar-label">
                        <span class="bar-emoji">${category.emoji}</span>
                        <span class="bar-name">${category.name}</span>
                        <span class="bar-value">${formatTime(category.time)} (${percentage.toFixed(1)}%)</span>
                    </div>
                    <div class="bar-container">
                        <div class="bar-fill" 
                             style="width: ${barWidth}%; background-color: ${category.color}; transition: width 0.5s ease;">
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="bar-chart">
                ${bars}
            </div>
        `;
    }

    // Select category for detailed breakdown
    selectCategory(categoryName) {
        this.selectedCategory = categoryName;
        const detailsPanel = document.getElementById('chart-details-panel');
        if (detailsPanel) {
            detailsPanel.innerHTML = this.renderCategoryDetails(categoryName);
        }
    }

    // Render details for selected category
    renderCategoryDetails(categoryName) {
        if (!this.reportData[categoryName]) {
            return `<div class="no-data">No data for ${categoryName}</div>`;
        }

        const categories = this.getCategories();
        const categoryData = this.reportData[categoryName];
        const categoryTotal = Object.values(categoryData).reduce((sum, time) => sum + time, 0);
        const categoryColor = categories[categoryName]?.color || '#bdc3c7';
        const categoryEmoji = categories[categoryName]?.emoji || '📁';

        const activities = Object.entries(categoryData)
            .map(([name, time]) => ({ name, time }))
            .sort((a, b) => b.time - a.time);

        const maxActivityTime = activities[0]?.time || 1;

        return `
            <div class="category-details">
                <div class="category-details-header">
                    <h4>${categoryEmoji} ${categoryName} Details</h4>
                    <div class="details-actions">
                        <span class="category-total">${formatTime(categoryTotal)} total</span>
                        <button class="btn-link" onclick="reports.showAllDetails()">View All</button>
                    </div>
                </div>
                
                <div class="activity-breakdown">
                    ${activities.map(activity => {
                        const percentage = (activity.time / categoryTotal) * 100;
                        const barWidth = (activity.time / maxActivityTime) * 100;
                        
                        return `
                            <div class="activity-detail-item">
                                <div class="activity-detail-label">
                                    <span class="activity-name">${activity.name}</span>
                                    <span class="activity-time">${formatTime(activity.time)} (${percentage.toFixed(1)}%)</span>
                                </div>
                                <div class="activity-detail-bar">
                                    <div class="activity-bar-fill" 
                                         style="width: ${barWidth}%; background-color: ${categoryColor};">
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    // Show all details (original detailed breakdown)
    showAllDetails() {
        const detailsPanel = document.getElementById('chart-details-panel');
        if (detailsPanel) {
            detailsPanel.innerHTML = this.renderDetailedBreakdown();
        }
        this.selectedCategory = null;
    }

    // Render chart details based on selection
    renderChartDetails() {
        if (this.totalTime === 0) {
            return `<div class="no-data">No data to display</div>`;
        }

        if (this.selectedCategory) {
            return this.renderCategoryDetails(this.selectedCategory);
        }

        // Show summary of all categories
        return `
            <div class="chart-summary">
                <div class="summary-header">
                    <h4>📋 Categories Overview</h4>
                    <p>Click on a chart segment or bar to see detailed breakdown</p>
                </div>
                ${this.renderDetailedBreakdown()}
            </div>
        `;
    }

    // Render detailed breakdown by activity
    renderDetailedBreakdown() {
        if (this.totalTime === 0) {
            return `<div class="no-data">No activities recorded for this ${this.reportView}.</div>`;
        }

        const categories = this.getCategories();
        
        return Object.entries(this.reportData).map(([categoryName, activities]) => {
            const categoryData = categories[categoryName];
            const categoryTotal = Object.values(activities).reduce((sum, time) => sum + time, 0);
            
            return `
                <div class="category-breakdown">
                    <div class="category-breakdown-header">
                        <span class="category-info">
                            <span class="category-color" style="background-color: ${categoryData?.color || '#bdc3c7'}"></span>
                            ${categoryData?.emoji || '📁'} ${categoryName}
                        </span>
                        <span class="category-total">${formatTime(categoryTotal)}</span>
                    </div>
                    
                    <div class="activities-breakdown">
                        ${Object.entries(activities).sort((a, b) => b[1] - a[1]).map(([activity, time]) => `
                            <div class="activity-breakdown-item">
                                <span class="activity-name">${activity}</span>
                                <span class="activity-time">${formatTime(time)}</span>
                                <div class="activity-bar">
                                    <div class="activity-bar-fill" 
                                         style="width: ${(time / categoryTotal) * 100}%; background-color: ${categoryData?.color || '#bdc3c7'}">
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }

    // Render activity rankings across all categories
    renderActivityRankings() {
        if (this.totalTime === 0) {
            return `<div class="no-data">No activities to rank for this ${this.reportView}.</div>`;
        }

        const categories = this.getCategories();
        const allActivities = [];

        // Collect all activities with their times
        Object.entries(this.reportData).forEach(([categoryName, activities]) => {
            Object.entries(activities).forEach(([activityName, time]) => {
                allActivities.push({
                    activity: activityName,
                    category: categoryName,
                    time: time,
                    color: categories[categoryName]?.color || '#bdc3c7',
                    categoryEmoji: categories[categoryName]?.emoji || '📁'
                });
            });
        });

        // Sort by time and take top 10
        const topActivities = allActivities.sort((a, b) => b.time - a.time).slice(0, 10);
        const maxTime = topActivities[0]?.time || 1;

        return `
            <div class="activity-rankings">
                ${topActivities.map((activity, index) => `
                    <div class="ranking-item">
                        <div class="rank-number">${index + 1}</div>
                        <div class="rank-info">
                            <div class="rank-activity">
                                ${activity.categoryEmoji} ${activity.activity}
                            </div>
                            <div class="rank-category">${activity.category}</div>
                        </div>
                        <div class="rank-time">${formatTime(activity.time)}</div>
                        <div class="rank-bar">
                            <div class="rank-bar-fill" 
                                 style="width: ${(activity.time / maxTime) * 100}%; background-color: ${activity.color}">
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Export reports functionality
    exportReport() {
        const reportData = {
            type: this.reportView,
            date: this.reportDate.toISOString(),
            dateRange: this.getDateRangeText(),
            totalTime: this.totalTime,
            categories: this.reportData,
            summary: this.generateReportSummary(),
            exportedAt: new Date().toISOString(),
            version: "1.3.0"
        };

        // Generate filename
        const dateStr = this.reportDate.toISOString().split('T')[0];
        const filename = `time-tracker-${this.reportView}-report-${dateStr}.json`;

        // Create and download file
        const blob = new Blob([JSON.stringify(reportData, null, 2)], { 
            type: 'application/json' 
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        
        URL.revokeObjectURL(url);

        // Show success message
        this.showToast(`📊 ${this.reportView.charAt(0).toUpperCase() + this.reportView.slice(1)} report exported successfully!`, 'success');
    }

    // Export as CSV functionality
    exportReportCSV() {
        const categories = this.getCategories();
        let csvContent = `Date Range,${this.getDateRangeText()}\n`;
        csvContent += `Report Type,${this.reportView.charAt(0).toUpperCase() + this.reportView.slice(1)}\n`;
        csvContent += `Total Time,${formatTime(this.totalTime)}\n\n`;
        csvContent += `Category,Activity,Time (seconds),Time (formatted),Percentage\n`;

        Object.entries(this.reportData).forEach(([categoryName, activities]) => {
            Object.entries(activities).forEach(([activityName, time]) => {
                const percentage = ((time / this.totalTime) * 100).toFixed(1);
                csvContent += `"${categoryName}","${activityName}",${time},"${formatTime(time)}",${percentage}%\n`;
            });
        });

        // Generate filename
        const dateStr = this.reportDate.toISOString().split('T')[0];
        const filename = `time-tracker-${this.reportView}-report-${dateStr}.csv`;

        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        
        URL.revokeObjectURL(url);

        this.showToast(`📊 CSV report exported successfully!`, 'success');
    }

    // Generate report summary for export
    generateReportSummary() {
        const categories = this.getCategories();
        const categoryTotals = Object.entries(this.reportData).map(([name, activities]) => ({
            name,
            time: Object.values(activities).reduce((sum, time) => sum + time, 0),
            color: categories[name]?.color || '#bdc3c7',
            emoji: categories[name]?.emoji || '📁'
        })).sort((a, b) => b.time - a.time);

        return {
            topCategory: categoryTotals[0] || null,
            categoryCount: categoryTotals.length,
            activityCount: Object.values(this.reportData).reduce((sum, activities) => 
                sum + Object.keys(activities).length, 0),
            averageTimePerCategory: categoryTotals.length > 0 ? 
                this.totalTime / categoryTotals.length : 0,
            categoryBreakdown: categoryTotals
        };
    }

    // Get date range text for display and export
    getDateRangeText() {
        if (this.reportView === 'day') {
            return this.reportDate.toLocaleDateString();
        } else if (this.reportView === 'week') {
            const startOfWeek = new Date(this.reportDate);
            startOfWeek.setDate(this.reportDate.getDate() - this.reportDate.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            return `${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`;
        } else if (this.reportView === 'month') {
            return this.reportDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        } else if (this.reportView === 'custom' && this.customStartDate && this.customEndDate) {
            if (this.customStartDate.toDateString() === this.customEndDate.toDateString()) {
                return this.customStartDate.toLocaleDateString();
            } else {
                return `${this.customStartDate.toLocaleDateString()} - ${this.customEndDate.toLocaleDateString()}`;
            }
        }
        return 'Unknown range';
    }

    // Custom date range selection
    showDateRangePicker() {
        // Create modal container if it doesn't exist
        let modalContainer = document.getElementById('modal-container');
        if (!modalContainer) {
            modalContainer = document.createElement('div');
            modalContainer.id = 'modal-container';
            document.body.appendChild(modalContainer);
        }

        const today = new Date();
        const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

        const modal = `
            <div class="modal-overlay" onclick="reports.closeDatePicker()">
                <div class="modal-content date-picker-modal" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h3>📅 Custom Date Range</h3>
                        <button class="modal-close" onclick="reports.closeDatePicker()">✕</button>
                    </div>
                    
                    <div class="date-picker-content">
                        <div class="quick-ranges">
                            <h4>Quick Ranges</h4>
                            <div class="quick-range-buttons">
                                <button class="btn-secondary" onclick="reports.applyQuickRange('today')">
                                    📅 Today
                                </button>
                                <button class="btn-secondary" onclick="reports.applyQuickRange('yesterday')">
                                    📅 Yesterday
                                </button>
                                <button class="btn-secondary" onclick="reports.applyQuickRange('thisWeek')">
                                    📅 This Week
                                </button>
                                <button class="btn-secondary" onclick="reports.applyQuickRange('lastWeek')">
                                    📅 Last Week
                                </button>
                                <button class="btn-secondary" onclick="reports.applyQuickRange('thisMonth')">
                                    📅 This Month
                                </button>
                                <button class="btn-secondary" onclick="reports.applyQuickRange('lastMonth')">
                                    📅 Last Month
                                </button>
                            </div>
                        </div>
                        
                        <div class="custom-range">
                            <h4>Custom Range</h4>
                            <div class="date-inputs">
                                <div class="date-input-group">
                                    <label for="start-date">Start Date</label>
                                    <input type="date" id="start-date" value="${oneWeekAgo.toISOString().split('T')[0]}">
                                </div>
                                <div class="date-input-group">
                                    <label for="end-date">End Date</label>
                                    <input type="date" id="end-date" value="${today.toISOString().split('T')[0]}">
                                </div>
                            </div>
                            <button class="btn-primary" onclick="reports.applyCustomRange()">
                                Apply Custom Range
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        modalContainer.innerHTML = modal;
    }

    // Apply quick date ranges
    applyQuickRange(range) {
        const today = new Date();
        let startDate, endDate;

        switch(range) {
            case 'today':
                startDate = endDate = new Date(today);
                break;
            case 'yesterday':
                startDate = endDate = new Date(today.getTime() - 24 * 60 * 60 * 1000);
                break;
            case 'thisWeek':
                startDate = new Date(today);
                startDate.setDate(today.getDate() - today.getDay());
                endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 6);
                break;
            case 'lastWeek':
                endDate = new Date(today);
                endDate.setDate(today.getDate() - today.getDay() - 1);
                startDate = new Date(endDate);
                startDate.setDate(endDate.getDate() - 6);
                break;
            case 'thisMonth':
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                break;
            case 'lastMonth':
                startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                endDate = new Date(today.getFullYear(), today.getMonth(), 0);
                break;
        }

        this.applyDateRange(startDate, endDate);
    }

    // Apply custom date range
    applyCustomRange() {
        const startDateInput = document.getElementById('start-date');
        const endDateInput = document.getElementById('end-date');
        
        if (!startDateInput.value || !endDateInput.value) {
            this.showToast('Please select both start and end dates', 'error');
            return;
        }

        const startDate = new Date(startDateInput.value);
        const endDate = new Date(endDateInput.value);

        if (startDate > endDate) {
            this.showToast('Start date must be before end date', 'error');
            return;
        }

        this.applyDateRange(startDate, endDate);
    }

    // Apply date range and update reports
    applyDateRange(startDate, endDate) {
        // Store custom range
        this.customStartDate = startDate;
        this.customEndDate = endDate;
        this.reportView = 'custom';
        this.reportDate = startDate; // Use start date as reference

        // Update UI
        document.querySelectorAll('.toggle-button').forEach(btn => btn.classList.remove('active'));
        
        // Update date display
        const dateEl = document.getElementById('current-report-date');
        if (dateEl) {
            if (startDate.toDateString() === endDate.toDateString()) {
                dateEl.textContent = startDate.toLocaleDateString();
            } else {
                dateEl.textContent = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
            }
        }

        // Close modal and refresh reports
        this.closeDatePicker();
        this.renderReports();
        
        const dayCount = Math.ceil((endDate - startDate) / (24 * 60 * 60 * 1000)) + 1;
        this.showToast(`📊 Custom range applied: ${dayCount} day${dayCount !== 1 ? 's' : ''}`, 'success');
    }

    // Close date picker modal
    closeDatePicker() {
        const modalContainer = document.getElementById('modal-container');
        if (modalContainer) {
            modalContainer.innerHTML = '';
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
        }, 3000);
    }

    // Render compact statistics cards
    renderCompactStatsCards() {
        if (this.totalTime === 0) {
            return `
                <div class="stat-card empty">
                    <div class="stat-icon">📊</div>
                    <div class="stat-content">
                        <h3>No Activity</h3>
                        <p>No time recorded for this ${this.reportView}</p>
                    </div>
                </div>
            `;
        }

        const categories = this.getCategories();
        const categoryTotals = Object.entries(this.reportData).map(([name, activities]) => ({
            name,
            time: Object.values(activities).reduce((sum, time) => sum + time, 0),
            color: categories[name]?.color || '#bdc3c7',
            emoji: categories[name]?.emoji || '📁'
        })).sort((a, b) => b.time - a.time);

        const topCategory = categoryTotals[0];
        const averagePerDay = this.reportView === 'month' ? Math.floor(this.totalTime / new Date(this.reportDate.getFullYear(), this.reportDate.getMonth() + 1, 0).getDate()) :
                             this.reportView === 'week' ? Math.floor(this.totalTime / 7) : this.totalTime;

        return `
            <div class="stat-card primary">
                <div class="stat-icon">⏱️</div>
                <div class="stat-content">
                    <h3>${formatTime(this.totalTime)}</h3>
                    <p>Total Time</p>
                </div>
            </div>
            
            <div class="stat-card success">
                <div class="stat-icon">${topCategory.emoji}</div>
                <div class="stat-content">
                    <h3>${topCategory.name}</h3>
                    <p>Top Category (${formatTime(topCategory.time)})</p>
                </div>
            </div>
            
            <div class="stat-card info">
                <div class="stat-icon">📅</div>
                <div class="stat-content">
                    <h3>${formatTime(averagePerDay)}</h3>
                    <p>Average per ${this.reportView === 'day' ? 'day' : 'day'}</p>
                </div>
            </div>
            
            <div class="stat-card warning">
                <div class="stat-icon">🎯</div>
                <div class="stat-content">
                    <h3>${categoryTotals.length}</h3>
                    <p>Active Categories</p>
                </div>
            </div>
        `;
    }

    // Render main chart with toggle
    renderMainChart() {
        const chartContent = this.totalTime === 0 ? `
            <div class="empty-chart">
                <div class="empty-chart-icon">📊</div>
                <p>No data to display</p>
            </div>
        ` : (this.chartType === 'pie' ? this.renderPieChart() : this.renderBarChart());
        
        return `
            <div class="charts-section-redesigned">
                <!-- Chart Toggle -->
                <div class="chart-toggle-container">
                    <h3>📊 Distribution Analysis</h3>
                    <div class="chart-toggle">
                        <button class="toggle-btn ${this.chartType === 'pie' ? 'active' : ''}" onclick="reports.setChartType('pie')">
                            🥧 Pie
                        </button>
                        <button class="toggle-btn ${this.chartType === 'bar' ? 'active' : ''}" onclick="reports.setChartType('bar')">
                            📊 Bar
                        </button>
                    </div>
                </div>
                
                <!-- Main Chart Container -->
                <div class="main-chart-container">
                    ${chartContent}
                </div>
                
                <!-- Interactive Details Panel -->
                <div class="chart-details-panel" id="chart-details-panel">
                    ${this.renderChartDetails()}
                </div>
            </div>
        `;
    }

    // Render timeline chart with individual sessions
    renderTimelineChart() {
        return `
            <div class="timeline-section">
                <h3>⏰ Activity Timeline</h3>
                ${this.generateTimelineContent()}
            </div>
        `;
    }

    generateTimelineContent() {
        if (this.totalTime === 0) {
            return `<div class="no-data">No activities recorded for this ${this.reportView}.</div>`;
        }

        // Get individual sessions for the current report period
        let sessions = [];
        
        if (this.reportView === 'day') {
            sessions = this.storage.getDateSessions(this.reportDate);
        } else if (this.reportView === 'week') {
            const startOfWeek = new Date(this.reportDate);
            startOfWeek.setDate(this.reportDate.getDate() - this.reportDate.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            sessions = this.storage.getSessionsInRange(startOfWeek, endOfWeek);
        } else if (this.reportView === 'month') {
            const startOfMonth = new Date(this.reportDate.getFullYear(), this.reportDate.getMonth(), 1);
            const endOfMonth = new Date(this.reportDate.getFullYear(), this.reportDate.getMonth() + 1, 0);
            sessions = this.storage.getSessionsInRange(startOfMonth, endOfMonth);
        }

        if (sessions.length === 0) {
            return `<div class="no-data">No session details available for this ${this.reportView}.</div>`;
        }

        // Get categories for styling
        const categories = this.getCategories();
        
        return `
            <div class="timeline-chart custom-scrollbar">
                ${sessions.map(session => {
                    const category = categories[session.category];
                    const startTime = new Date(session.startTime);
                    const emoji = window.activityEmojis?.[session.activity] || category?.emoji || '⭐';
                    
                    return `
                        <div class="timeline-session-item" onclick="this.classList.toggle('expanded')">
                            <div class="timeline-session-bar" style="background-color: ${category?.color || '#4A90E2'}"></div>
                            <div class="timeline-session-info">
                                <div class="timeline-session-label">
                                    <span class="timeline-session-emoji">${emoji} ${session.activity}</span>
                                    <span class="timeline-session-category">${session.category}</span>
                                </div>
                                <div class="timeline-session-meta">
                                    <span class="timeline-session-time">${startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    <span class="timeline-session-duration">${formatTime(session.duration)}</span>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    // Enhanced goals section with report integration
    renderGoalsSection() {
        // Check if goals are enabled
        if (!window.app || !window.app.goals || !window.app.management.getSetting('goalsEnabled')) {
            return '';
        }

        const goalsSummary = this.getGoalsSummary ? this.getGoalsSummary() : '';
        
        // Add goals progress for current report period
        const goalsProgress = this.calculateGoalsProgress();
        
        return `
            <div class="goals-section">
                <h3>🎯 Goals Progress</h3>
                ${goalsProgress}
                ${goalsSummary}
            </div>
        `;
    }

    // Calculate goals progress for current report period
    calculateGoalsProgress() {
        if (!window.app || !window.app.goals) {
            return '<div class="no-data">Goals system not available</div>';
        }

        const goals = window.app.goals.goals || {};
        const progressItems = [];

        Object.entries(this.reportData).forEach(([categoryName, activities]) => {
            const categoryGoals = goals[categoryName];
            if (!categoryGoals) return;

            const categoryTotal = Object.values(activities).reduce((sum, time) => sum + time, 0);
            const categories = this.getCategories();
            const categoryColor = categories[categoryName]?.color || '#bdc3c7';
            const categoryEmoji = categories[categoryName]?.emoji || '📁';

            // Check which goal type matches current report view
            let goalType = 'daily';
            if (this.reportView === 'week') goalType = 'weekly';
            else if (this.reportView === 'month') goalType = 'monthly';

            const goal = categoryGoals[goalType];
            if (!goal) return;

            const progressPercentage = Math.min((categoryTotal / goal.target) * 100, 100);
            const isAchieved = categoryTotal >= goal.target;

            progressItems.push(`
                <div class="goal-progress-item">
                    <div class="goal-header">
                        <span class="goal-category">${categoryEmoji} ${categoryName}</span>
                        <span class="goal-status ${isAchieved ? 'achieved' : 'in-progress'}">
                            ${isAchieved ? '✅' : '🎯'} ${formatTime(categoryTotal)} / ${formatTime(goal.target)}
                        </span>
                    </div>
                    <div class="goal-progress-bar">
                        <div class="goal-progress-fill" 
                             style="width: ${progressPercentage}%; background-color: ${categoryColor};">
                        </div>
                    </div>
                    <div class="goal-progress-text">
                        ${progressPercentage.toFixed(1)}% of ${goalType} goal
                        ${isAchieved ? '🎉' : ''}
                    </div>
                </div>
            `);
        });

        if (progressItems.length === 0) {
            return `<div class="no-data">No goals set for current categories</div>`;
        }

        return `
            <div class="goals-progress">
                <h4>${this.reportView.charAt(0).toUpperCase() + this.reportView.slice(1)} Goals Progress</h4>
                ${progressItems.join('')}
            </div>
        `;
    }

    // Render compact activity rankings
    renderCompactActivityRankings() {
        if (this.totalTime === 0) {
            return `
                <div class="rankings-section-compact">
                    <h3>🏆 Top Activities</h3>
                    <div class="no-data">No activities to rank for this ${this.reportView}.</div>
                </div>
            `;
        }

        const categories = this.getCategories();
        const allActivities = [];

        // Collect all activities with their times
        Object.entries(this.reportData).forEach(([categoryName, activities]) => {
            Object.entries(activities).forEach(([activityName, time]) => {
                allActivities.push({
                    activity: activityName,
                    category: categoryName,
                    time: time,
                    color: categories[categoryName]?.color || '#bdc3c7',
                    categoryEmoji: categories[categoryName]?.emoji || '📁'
                });
            });
        });

        // Sort by time and take top 10
        const topActivities = allActivities.sort((a, b) => b.time - a.time).slice(0, 10);
        const maxTime = topActivities[0]?.time || 1;

        return `
            <div class="rankings-section-compact">
                <h3>🏆 Top Activities</h3>
                <div class="activity-rankings-compact">
                    ${topActivities.map((activity, index) => `
                        <div class="ranking-item-compact">
                            <div class="rank-number">${index + 1}</div>
                            <div class="rank-info">
                                <div class="rank-activity">
                                    ${activity.categoryEmoji} ${activity.activity}
                                </div>
                                <div class="rank-category">${activity.category}</div>
                            </div>
                            <div class="rank-time">${formatTime(activity.time)}</div>
                            <div class="rank-bar">
                                <div class="rank-bar-fill" 
                                     style="width: ${(activity.time / maxTime) * 100}%; background-color: ${activity.color}">
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Set chart type
    setChartType(type) {
        this.chartType = type;
        this.renderReports();
    }

    // Render compact actions bar
    renderCompactActions() {
        return `
            <div class="reports-actions-compact">
                <button class="btn-secondary btn-compact" onclick="reports.showDateRangePicker()" title="Select custom date range">
                    📅 Custom Range
                </button>
                <button class="btn-secondary btn-compact" onclick="reports.exportReport()" title="Export as JSON">
                    📥 JSON
                </button>
                <button class="btn-secondary btn-compact" onclick="reports.exportReportCSV()" title="Export as CSV">
                    📊 CSV
                </button>
            </div>
        `;
    }
} 