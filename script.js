let habits = [];
let chart = null;
let db = null;
let currentWeekOffset = 0; // 0 = this week, -1 = last week, 1 = next week
const THEME_STORAGE_KEY = 'habitTheme';

function applyTheme(theme) {
    const body = document.body;
    const toggle = document.getElementById('themeToggle');
    const label = document.getElementById('themeLabel');
    const isDark = theme === 'dark';

    body.classList.toggle('dark-mode', isDark);

    if (toggle) {
        toggle.checked = isDark;
    }
    if (label) {
        label.textContent = isDark ? 'Dark Mode' : 'Light Mode';
    }

    localStorage.setItem(THEME_STORAGE_KEY, theme);

    if (chart) {
        const dates = getWeekDates(currentWeekOffset);
        updateChart(dates);
    }
}

function initTheme() {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const themeToUse = savedTheme || (prefersDark ? 'dark' : 'light');

    applyTheme(themeToUse);

    const toggle = document.getElementById('themeToggle');
    if (toggle) {
        toggle.addEventListener('change', (event) => {
            applyTheme(event.target.checked ? 'dark' : 'light');
        });
    }
}

function ShowDetails() {
    const section = document.getElementById('legendSection');
    const button = document.getElementById('ShowDetailsBtn');
    if (section.style.display === 'none') {
        section.style.display = 'flex';
        button.textContent = " Hide Details";
    } else {
        section.style.display = 'none';
        button.textContent = " Show Details";
    }
}

function AddHabit() {
    const section = document.getElementById('addHabitSection');
    const button = document.getElementById('AddHabitBtn');
    if (section.style.display === 'none') {
        section.style.display = 'flex';
        button.textContent = "Hide Add Habit";
    } else {
        section.style.display = 'none';
        button.textContent = "Add Habit";
    }
}


function showBackupsection() {
    const section = document.getElementById('backupSection');
    const button = document.getElementById('BackupButton');
    if (section.style.display === 'none') {
        section.style.display = 'block';
        button.textContent = "Hide Backup";

    } else {
        section.style.display = 'none';
        button.textContent = "Backup";
    }
}
// IndexedDB Setup
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('HabitTrackerDB', 1);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            db = event.target.result;
            
            // Create object store for habits
            if (!db.objectStoreNames.contains('habits')) {
                db.createObjectStore('habits', { keyPath: 'id' });
            }
            
            // Create object store for metadata
            if (!db.objectStoreNames.contains('metadata')) {
                db.createObjectStore('metadata', { keyPath: 'key' });
            }
        };
    });
}

// Save habits to IndexedDB
async function saveHabits() {
    if (!db) return;

    const transaction = db.transaction(['habits'], 'readwrite');
    const store = transaction.objectStore('habits');

    // Clear existing data
    await store.clear();

    // Add all habits
    for (const habit of habits) {
        await store.add(habit);
    }

    // Update metadata
    updateMetadata();
    updateStorageInfo();

    return transaction.complete;
}

// Load habits from IndexedDB
async function loadHabits() {
    if (!db) return;

    const transaction = db.transaction(['habits'], 'readonly');
    const store = transaction.objectStore('habits');
    const request = store.getAll();

    return new Promise((resolve, reject) => {
        request.onsuccess = () => {
            habits = request.result || [];
            resolve(habits);
        };
        request.onerror = () => reject(request.error);
    });
}

// Update metadata (last save time, etc.)
async function updateMetadata() {
    const transaction = db.transaction(['metadata'], 'readwrite');
    const store = transaction.objectStore('metadata');

    await store.put({
        key: 'lastSave',
        value: new Date().toISOString()
    });

    await store.put({
        key: 'habitCount',
        value: habits.length
    });
}

// Auto backup every 24 hours
function scheduleAutoBackup() {
    // Check if we should auto-backup
    const lastBackup = localStorage.getItem('lastAutoBackup');
    const now = Date.now();

    if (!lastBackup || (now - parseInt(lastBackup)) > 24 * 60 * 60 * 1000) {
        autoBackup();
    }

    // Schedule next check in 1 hour
    setTimeout(scheduleAutoBackup, 60 * 60 * 1000);
}

// Auto backup to localStorage as fallback
function autoBackup() {
    const backupData = {
        version: 1,
        timestamp: new Date().toISOString(),
        habits: habits
    };

    localStorage.setItem('habitBackup', JSON.stringify(backupData));
    localStorage.setItem('lastAutoBackup', Date.now().toString());

    const backupTime = new Date().toLocaleString();
    document.getElementById('lastBackup').textContent = `Last auto-backup: ${backupTime}`;

    // Show confirmation
    showNotification('✅ Auto-backup completed!');
}

// Export data to JSON file
function exportData() {
    const exportData = {
        version: 1,
        exportDate: new Date().toISOString(),
        habits: habits
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `habit-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    showNotification('✅ Backup exported successfully!');
}

// Import data from JSON file
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const importedData = JSON.parse(e.target.result);
            
            // Validate data
            if (!importedData.habits || !Array.isArray(importedData.habits)) {
                throw new Error('Invalid backup file format');
            }

            // Confirm before overwriting
            if (habits.length > 0) {
                const confirmMsg = `This will replace your current ${habits.length} habit(s) with ${importedData.habits.length} habit(s) from the backup. Continue?`;
                if (!confirm(confirmMsg)) return;
            }

            habits = importedData.habits;
            await saveHabits();
            updateDisplay();
            showNotification('✅ Data imported successfully!');
        } catch (error) {
            alert('❌ Error importing data: ' + error.message);
        }
    };
    reader.readAsText(file);

    // Reset file input
    event.target.value = '';
}

// Update storage info display
function updateStorageInfo() {
    const dataSize = new Blob([JSON.stringify(habits)]).size;
    const sizeKB = (dataSize / 1024).toFixed(2);
    document.getElementById('storageSize').textContent = sizeKB + ' KB';
    document.getElementById('habitCount').textContent = habits.length;
}

// Show notification message
function showNotification(message) {
    const notif = document.createElement('div');
    notif.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4caf50;
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    notif.textContent = message;
    document.body.appendChild(notif);

    setTimeout(() => {
        notif.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

// Initialize the app
async function init() {
    await initDB();
    await loadHabits();
    initTheme();
    displayDate();
    await updateDisplay();
    scheduleAutoBackup();
    scheduleMidnightCheck();
    updateStorageInfo();
    requestNotificationPermission();
    requestPersistentStoragePermission();
    scheduleNotification();
    
    // Update last backup display
    const lastBackup = localStorage.getItem('lastAutoBackup');
    if (lastBackup) {
        const backupDate = new Date(parseInt(lastBackup));
        document.getElementById('lastBackup').textContent = 
            `Last auto-backup: ${backupDate.toLocaleString()}`;
    }
    
    // Allow Enter key to add habit
    document.getElementById('habitInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addHabit();
        }
    });
}

// Schedule check at midnight to auto-mark past dates
function scheduleMidnightCheck() {
    // Calculate time until next midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const msUntilMidnight = tomorrow - now;

    // Schedule first check at midnight
    setTimeout(async () => {
        await autoMarkPastDates();
        await updateDisplay();
        showNotification('📅 Previous day auto-marked as incomplete');
        
        // Then check every 24 hours
        setInterval(async () => {
            await autoMarkPastDates();
            await updateDisplay();
            showNotification('📅 Previous day auto-marked as incomplete');
        }, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);
}

// Display current date
function displayDate() {
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('dateDisplay').textContent = today.toLocaleDateString('en-US', options);
}

// Get today's date as string
function getTodayString() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

// Add new habit
async function addHabit() {
    const input = document.getElementById('habitInput');
    const habitName = input.value.trim();

    if (habitName === '') {
        alert('Please enter a habit name');
        return;
    }

    const newHabit = {
        id: Date.now(),
        name: habitName,
        records: {}
    };

    habits.push(newHabit);
    await saveHabits();
    input.value = '';
    updateDisplay();
    showNotification('✅ Habit added successfully!');
}

// Delete habit
async function deleteHabit(id) {
    if (confirm('Are you sure you want to delete this habit?')) {
        habits = habits.filter(h => h.id !== id);
        await saveHabits();
        updateDisplay();
        showNotification('✅ Habit deleted successfully!');
    }
}

// Check if date is in the past (before today)
function isDateInPast(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    
    // Set both to midnight for fair comparison
    date.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    return date < today;
}

// Auto-mark past dates as not completed if unmarked
async function autoMarkPastDates() {
    let hasChanges = false;
    const today = getTodayString();

    habits.forEach(habit => {
        // Get dates for current week view
        const dates = getWeekDates(currentWeekOffset);

        dates.forEach(dateString => {
            if (isDateInPast(dateString)) {
                // If date is in past and not set, mark as not completed
                if (habit.records[dateString] === undefined) {
                    habit.records[dateString] = false;
                    hasChanges = true;
                }
            }
        });
    });

    if (hasChanges) {
        await saveHabits();
    }
}

// Toggle habit status
async function toggleHabit(habitId, dateString) {
    // Check if date is in the past (locked)
    if (isDateInPast(dateString)) {
        showNotification('🔒 Past dates are locked and cannot be modified!');
        return;
    }

    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const currentStatus = habit.records[dateString];
    
    if (currentStatus === undefined) {
        habit.records[dateString] = true;
    } else if (currentStatus === true) {
        habit.records[dateString] = false;
    } else {
        delete habit.records[dateString];
    }

    await saveHabits();
    updateDisplay();
}

// Get Monday of a week (start of week)
function getMonday(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
}

// Get dates for current week view (friday to next week thursday)
function getWeekDates(weekOffset = 0) {
    const today = new Date();
    const monday = getMonday(today);
    
    // Add week offset
    monday.setDate(monday.getDate() + (weekOffset * 14));
    
    const dates = [];
    for (let i = 0; i < 14; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
}

// Update week info display
function updateWeekInfo() {
    const dates = getWeekDates(currentWeekOffset);
    const startDate = new Date(dates[0]);
    const endDate = new Date(dates[13]);
    
    const startStr = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    document.getElementById('weekRange').textContent = `${startStr} - ${endStr}`;
    
    // Update label based on offset
    if (currentWeekOffset === 0) {
        document.getElementById('weekLabel').textContent = 'This 2 Weeks';
    } else if (currentWeekOffset === 1) {
        document.getElementById('weekLabel').textContent = 'Next 2 Weeks';
    } else if (currentWeekOffset === -1) {
        document.getElementById('weekLabel').textContent = 'Last 2 Weeks';
    } else if (currentWeekOffset > 0) {
        document.getElementById('weekLabel').textContent = `${currentWeekOffset * 2} Weeks Ahead`;
    } else {
        document.getElementById('weekLabel').textContent = `${Math.abs(currentWeekOffset) * 2} Weeks Ago`;
    }
}

// Navigate to previous week
function previousWeek() {
    currentWeekOffset--;
    updateDisplay();
}

// Navigate to next week
function nextWeek() {
    currentWeekOffset++;
    updateDisplay();
}

// Go to current week (today's week)
function goToCurrentWeek() {
    currentWeekOffset = 0;
    updateDisplay();
}

// Get date array (keeping for backward compatibility, but now uses week dates)
function getDateArray(days) {
    return getWeekDates(currentWeekOffset);
}

// Calculate daily score
function calculateDailyScore(dateString) {
    if (habits.length === 0) return 0;
    
    let completedCount = 0;
    habits.forEach(habit => {
        if (habit.records[dateString] === true) {
            completedCount++;
        }
    });
    
    return Math.round((completedCount / habits.length) * 100);
}

// Update display
async function updateDisplay() {
    const dates = getWeekDates(currentWeekOffset);
    updateWeekInfo();
    
    await renderGrid(dates);
    updateChart(dates);
}

// Render grid
async function renderGrid(dates) {
    const headerDiv = document.getElementById('gridHeader');
    const bodyDiv = document.getElementById('gridBody');

    // Auto-mark past dates before rendering
    await autoMarkPastDates();

    if (habits.length === 0) {
        headerDiv.innerHTML = '';
        bodyDiv.innerHTML = `
            <tr>
                <td colspan="100" style="text-align: center; padding: 40px; color: #999;">
                    <h3>No habits yet</h3>
                    <p>Add your first habit to start tracking!</p>
                </td>
            </tr>
        `;
        return;
    }

    const todayString = getTodayString();

    // Create header
    let headerHTML = '<tr><th>Habit</th>';
    dates.forEach(dateString => {
        const date = new Date(dateString);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const dayNum = date.getDate();
        const month = date.toLocaleDateString('en-US', { month: 'short' });
        const isPast = isDateInPast(dateString);
        const isToday = dateString === todayString;
        const lockIcon = isPast ? ' 🔒' : '';
        const todayClass = isToday ? ' today-column' : '';
        const todayLabel = isToday ? '<br><small>(Today)</small>' : '';
        headerHTML += `<th class="${todayClass}">${dayName}<br>${month} ${dayNum}${lockIcon}${todayLabel}</th>`;
    });
    headerHTML += '</tr>';
    headerDiv.innerHTML = headerHTML;

    // Create body
    let bodyHTML = '';
    habits.forEach(habit => {
        bodyHTML += '<tr>';
        bodyHTML += `
            <td>
                <div class="habit-name-cell">
                    <span>${habit.name}</span>
                    <button class="delete-btn" onclick="deleteHabit(${habit.id})">Delete</button>
                </div>
            </td>
        `;
        
        dates.forEach(dateString => {
            const status = habit.records[dateString];
            const isPast = isDateInPast(dateString);
            const isToday = dateString === todayString;
            const todayClass = isToday ? ' today-column' : '';
            let cellClass = 'not-set';
            let icon = '—';
            
            if (status === true) {
                cellClass = 'completed';
                icon = '✓';
            } else if (status === false) {
                cellClass = 'not-completed';
                icon = '✗';
            }
            
            // Add locked class if date is in past
            if (isPast) {
                cellClass += ' locked';
            }
            
            bodyHTML += `
                <td class="${todayClass}">
                    <div class="habit-cell ${cellClass}" onclick="toggleHabit(${habit.id}, '${dateString}')">
                        ${icon}
                    </div>
                </td>
            `;
        });
        
        bodyHTML += '</tr>';
    });

    // Add score row
    bodyHTML += '<tr class="score-row">';
    bodyHTML += '<td><strong>Daily Score (%)</strong></td>';
    dates.forEach(dateString => {
        const isToday = dateString === todayString;
        const todayClass = isToday ? ' today-column' : '';
        const score = calculateDailyScore(dateString);
        bodyHTML += `<td class="${todayClass}">${score}%</td>`;
    });
    bodyHTML += '</tr>';

    bodyDiv.innerHTML = bodyHTML;
}

// Update chart
function updateChart(dates) {
    const ctx = document.getElementById('progressChart').getContext('2d');

    const scores = dates.map(date => calculateDailyScore(date));
    const labels = dates.map(date => {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    const isDark = document.body.classList.contains('dark-mode');
    const lineColor = isDark ? 'rgb(96, 165, 250)' : 'rgb(102, 126, 234)';
    const fillColor = isDark ? 'rgba(96, 165, 250, 0.2)' : 'rgba(102, 126, 234, 0.2)';
    const tickColor = isDark ? '#e5e7eb' : '#1f2937';
    const gridColor = isDark ? '#1f2937' : '#e5e7eb';

    if (chart) {
        chart.destroy();
    }

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Daily Completion Score (%)',
                data: scores,
                backgroundColor: fillColor,
                borderColor: lineColor,
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointHoverRadius: 7,
                pointBackgroundColor: lineColor,
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: tickColor
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Score: ' + context.parsed.y + '%';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        color: gridColor
                    },
                    ticks: {
                        color: tickColor,
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    title: {
                        display: true,
                        text: 'Completion Score (%)',
                        color: tickColor
                    }
                },
                x: {
                    grid: {
                        color: gridColor
                    },
                    title: {
                        display: true,
                        text: 'Date',
                        color: tickColor
                    },
                    ticks: {
                        color: tickColor
                    }
                }
            }
        }
    });
}

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Request persistent storage permission (keep site active)
async function requestPersistentStoragePermission() {
    const statusDiv = document.getElementById('persistentStorageStatus');
    
    try {
        // Check if browser supports persistent storage API
        if (navigator.storage && navigator.storage.persist) {
            const alreadyRequested = localStorage.getItem('persistentStorageRequested');
            
            // Only ask once unless user denies
            if (!alreadyRequested) {
                const isPersistent = await navigator.storage.persist();
                
                if (isPersistent) {
                    statusDiv.innerHTML = `
                        <div class="notification-enabled">
                            ✅ Site will stay active in the background when you close the browser
                        </div>
                    `;
                    localStorage.setItem('persistentStorageRequested', 'true');
                    localStorage.setItem('persistentStorageGranted', 'true');
                } else {
                    statusDiv.innerHTML = `
                        <div class="notification-disabled">
                            🔄 Background activity needs permission
                            <br>
                            <button class="btn btn-primary" style="margin-top: 10px;" onclick="requestPersistentStoragePermissionManual()">
                                Allow Background Activity
                            </button>
                        </div>
                    `;
                    localStorage.setItem('persistentStorageRequested', 'true');
                }
            } else {
                // Check if it was previously granted
                const wasGranted = localStorage.getItem('persistentStorageGranted');
                if (wasGranted === 'true') {
                    statusDiv.innerHTML = `
                        <div class="notification-enabled">
                            ✅ Site will stay active in the background when you close the browser
                        </div>
                    `;
                } else {
                    statusDiv.innerHTML = `
                        <div class="notification-disabled">
                            ⚠️ Background activity permission denied. Please enable in browser settings.
                        </div>
                    `;
                }
            }
        } else {
            // Browser doesn't support persistent storage
            statusDiv.innerHTML = `
                <div class="notification-disabled">
                    ℹ️ Your browser may not support background activity requests
                </div>
            `;
        }
    } catch (error) {
        console.error('Error requesting persistent storage:', error);
        statusDiv.innerHTML = `
            <div class="notification-disabled">
                ⚠️ Unable to request background activity permission
            </div>
        `;
    }
}

// Manual request for persistent storage permission
async function requestPersistentStoragePermissionManual() {
    const statusDiv = document.getElementById('persistentStorageStatus');
    
    try {
        if (navigator.storage && navigator.storage.persist) {
            const isPersistent = await navigator.storage.persist();
            
            if (isPersistent) {
                statusDiv.innerHTML = `
                    <div class="notification-enabled">
                        ✅ Site will stay active in the background when you close the browser
                    </div>
                `;
                localStorage.setItem('persistentStorageGranted', 'true');
                showNotification('✅ Background activity enabled!');
            } else {
                statusDiv.innerHTML = `
                    <div class="notification-disabled">
                        ⚠️ Background activity permission denied. Please enable in browser settings.
                    </div>
                `;
                showNotification('⚠️ Please enable in browser settings');
            }
        }
    } catch (error) {
        console.error('Error requesting persistent storage:', error);
        statusDiv.innerHTML = `
            <div class="notification-disabled">
                ⚠️ Unable to request background activity permission
            </div>
        `;
    }
}

// Request notification permission
function requestNotificationPermission() {
    const statusDiv = document.getElementById('notificationStatus');
    
    if (!("Notification" in window)) {
        statusDiv.innerHTML = `
            <div class="notification-disabled">
                ⚠️ Your browser doesn't support notifications
            </div>
        `;
        return;
    }

    if (Notification.permission === "granted") {
        statusDiv.innerHTML = `
            <div class="notification-enabled">
                ✅ Daily notifications enabled for 9:00 PM
            </div>
        `;
    } else if (Notification.permission !== "denied") {
        statusDiv.innerHTML = `
            <div class="notification-disabled">
                🔔 Enable notifications to get daily reminders at 9:00 PM
                <br>
                <button class="btn btn-primary" style="margin-top: 10px;" onclick="enableNotifications()">
                    Enable Notifications
                </button>
            </div>
        `;
    } else {
        statusDiv.innerHTML = `
            <div class="notification-disabled">
                ⚠️ Notifications are blocked. Please enable them in your browser settings.
            </div>
        `;
    }
}

// Enable notifications
function enableNotifications() {
    Notification.requestPermission().then(permission => {
        requestNotificationPermission();
        if (permission === "granted") {
            new Notification("Habit Tracker", {
                body: "Notifications enabled! You'll receive daily reminders at 9:00 PM.",
                icon: "https://cdn-icons-png.flaticon.com/512/2936/2936719.png"
            });
        }
    });
}

// Check if notification was missed today and send it
function checkForMissedNotification() {
    const today = getTodayString();
    const lastNotificationDate = localStorage.getItem('lastNotificationDate');
    
    // If notification hasn't been sent today, send it now
    if (lastNotificationDate !== today) {
        const now = new Date();
        const hours = now.getHours();
        
        // Send if it's 9:00 PM or later
        if (hours >= 21) {
            sendNotification();
        }
    }
}

// Schedule daily notification
function scheduleNotification() {
    // Check immediately on app load for missed notifications
    checkForMissedNotification();
    
    // Check every minute for the scheduled time
    setInterval(() => {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();

        if (hours === 21 && minutes === 0) {
            sendNotification();
        }
    }, 60000);
}

// Send notification
function sendNotification() {
    if (Notification.permission === "granted") {
        const today = getTodayString();
        const lastNotificationDate = localStorage.getItem('lastNotificationDate');
        
        // Only send if not already sent today
        if (lastNotificationDate === today) {
            return;
        }
        
        const uncheckedCount = habits.reduce((count, habit) => {
            const record = habit.records[today];
            return count + (record === undefined || record === false ? 1 : 0);
        }, 0);

        if (uncheckedCount > 0) {
            new Notification("🎯 Habit Tracker Reminder", {
                body: `You have ${uncheckedCount} habit(s) to complete today!\nDon't break the streak! 💪`,
                icon: "https://cdn-icons-png.flaticon.com/512/2936/2936719.png",
                requireInteraction: true
            });
        } else {
            new Notification("🎯 Habit Tracker", {
                body: "Great job! All habits completed today! 🎉",
                icon: "https://cdn-icons-png.flaticon.com/512/2936/2936719.png"
            });
        }
        
        // Record that notification was sent today
        localStorage.setItem('lastNotificationDate', today);
    }
}

// Initialize app when page loads
window.onload = init;
