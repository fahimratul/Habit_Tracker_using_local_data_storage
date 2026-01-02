# 🎯 Habit Tracker

A modern, feature-rich web-based habit tracking application that helps you build and maintain positive habits. Track your daily progress, visualize your achievements, and never lose your data with robust local storage and backup features.

## ✨ Features

### Core Functionality
- **📅 Daily Habit Tracking**: Mark habits as completed or not completed for each day
- **📊 Week View Navigation**: Navigate between weeks to view and track your progress
- **🔒 Auto-Lock Past Dates**: Previous dates automatically lock to prevent accidental modifications
- **📈 Visual Progress Chart**: See your daily completion scores with an interactive Chart.js graph

### Data Management
- **💾 Persistent Storage**: Uses IndexedDB for reliable local data storage
- **🔄 Auto-Backup**: Automatic daily backups to localStorage as a safety net
- **📥 Export/Import**: Export your data as JSON files for manual backups
- **💽 Backup & Restore**: Complete backup and recovery system for data security

### Smart Features
- **🔔 Notification System**: Get reminders to track your habits (with permission)
- **🌙 Midnight Auto-Mark**: Automatically marks previous day's incomplete habits
- **📊 Storage Metrics**: View how much data you're using and habit count
- **🎨 Beautiful UI**: Modern gradient design with smooth animations

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- No server or installation required!

### Installation

1. **Clone or Download** the repository:
   ```bash
   git clone https://github.com/yourusername/Habit_Tracker_using_local_data_storage.git
   ```

2. **Open the application**:
   - Simply open `index.html` in your web browser
   - Or use a local server for development:
     ```bash
     # Using Python 3
     python -m http.server 8000
     
     # Using Node.js http-server
     npx http-server
     ```

3. **Start tracking**:
   - Click "Add Habit" to create your first habit
   - Mark habits as complete each day
   - Navigate between weeks to view your progress

## 📖 Usage Guide

### Adding a Habit
1. Click the **"Add Habit"** button
2. Enter the habit name (e.g., "Exercise", "Read", "Meditate")
3. Click **"Add Habit"** or press **Enter**

### Tracking Habits
- **✓ (Green checkmark)**: Completed
- **✗ (Red cross)**: Not completed
- **— (Gray dash)**: Not set yet (today or future dates)
- **🔒 (Lock icon)**: Past dates (automatically locked)

### Navigating Weeks
- Use **← Previous Week** and **Next Week →** buttons to navigate
- Click **📅 Today** to return to the current week
- Week range is displayed at the top of the navigation

### Backup & Restore
1. Click the **"Backup"** button to show backup options
2. **Export Backup**: Download a JSON file of all your data
3. **Import Backup**: Upload a previously exported JSON file
4. **Auto Backup Now**: Manually trigger an automatic backup

> ⚠️ **Important**: Before clearing browser data or history, always export a backup!

### Managing Habits
- Click the **🗑️ (trash)** icon next to any habit to delete it
- Confirm the deletion when prompted

## 🛠️ Technical Details

### Technologies Used
- **HTML5**: Structure and semantics
- **CSS3**: Modern styling with gradients and animations
- **Vanilla JavaScript**: No frameworks - pure ES6+ JavaScript
- **Chart.js**: Interactive progress visualization
- **IndexedDB**: Primary data storage
- **localStorage**: Backup storage mechanism

### Data Storage
The application uses a dual storage approach:

1. **IndexedDB** (Primary):
   - Database name: `HabitTrackerDB`
   - Stores habits and metadata
   - More reliable and supports larger data

2. **localStorage** (Backup):
   - Automatic daily backups
   - Fallback recovery option
   - Limited to ~5-10MB depending on browser

### File Structure
```
Habit_Tracker_using_local_data_storage/
│
├── index.html          # Main HTML structure
├── styles.css          # All styling and animations
├── script.js           # Application logic and functionality
└── README.md           # This file
```

### Key Functions

#### Storage Management
- `initDB()`: Initialize IndexedDB connection
- `saveHabits()`: Save habits to IndexedDB
- `loadHabits()`: Load habits from IndexedDB
- `autoBackup()`: Create automatic backup
- `exportData()`: Export data as JSON file
- `importData()`: Import data from JSON file

#### Habit Operations
- `addHabit()`: Create a new habit
- `deleteHabit()`: Remove a habit
- `toggleHabit()`: Toggle habit status for a date
- `autoMarkPastDates()`: Automatically mark past incomplete dates

#### UI Updates
- `updateDisplay()`: Refresh the habit grid
- `updateChart()`: Update the progress chart
- `getWeekDates()`: Calculate dates for current week view
- `displayDate()`: Show current date

## 🔐 Data Security & Privacy

- **100% Local**: All data is stored locally in your browser
- **No Server**: No data is sent to any external servers
- **Privacy First**: Your habits and progress are completely private
- **Backup Control**: You control when and where to backup your data

## ⚙️ Browser Support

| Browser | Minimum Version | IndexedDB | Chart.js |
|---------|----------------|-----------|----------|
| Chrome | 58+ | ✅ | ✅ |
| Firefox | 54+ | ✅ | ✅ |
| Safari | 11+ | ✅ | ✅ |
| Edge | 79+ | ✅ | ✅ |

## 🐛 Troubleshooting

### Data Not Saving
- Check if browser storage is enabled
- Ensure you're not in incognito/private mode
- Check browser storage quota

### Lost Data After Browser Clear
- **Prevention**: Always export backups before clearing browser data
- **Recovery**: Import your most recent backup file

### Notifications Not Working
- Grant notification permission when prompted
- Check browser notification settings
- Some browsers block notifications in certain modes

## 🤝 Contributing

Contributions are welcome! Here are some ways you can contribute:

1. **Report Bugs**: Open an issue describing the bug
2. **Suggest Features**: Share your ideas for improvements
3. **Submit Pull Requests**: Fix bugs or add features
4. **Improve Documentation**: Help make the docs better

### Development Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/Habit_Tracker_using_local_data_storage.git

# Navigate to the directory
cd Habit_Tracker_using_local_data_storage

# Open in your favorite code editor
code .

# Start a local server (optional)
python -m http.server 8000
```

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🌟 Future Enhancements

- [ ] Dark mode toggle
- [ ] Multiple themes
- [ ] Habit categories/tags
- [ ] Monthly and yearly views
- [ ] Streak tracking
- [ ] Export as PDF/CSV
- [ ] Habit statistics and insights
- [ ] Cloud sync option
- [ ] Mobile app version
- [ ] Custom habit icons

## 📧 Contact

For questions, suggestions, or feedback, please open an issue on GitHub.

---

**Made with ❤️ for building better habits**

*Remember: Consistency is key! Track your habits daily and watch yourself grow.* 🌱
