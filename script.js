document.addEventListener('DOMContentLoaded', function() {
    // DOM elements - existing
    const taskForm = document.getElementById('task-form');
    const taskInput = document.getElementById('task-input');
    const taskCategory = document.getElementById('task-category');
    const taskPriority = document.getElementById('task-priority');
    const taskDate = document.getElementById('task-date');
    const taskNotesInput = document.getElementById('task-notes-input');
    const taskList = document.getElementById('task-list');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const categoryFilters = document.querySelectorAll('.category-filter');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const emptyState = document.getElementById('empty-state');
    const themeToggle = document.getElementById('theme-toggle');
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Pomodoro DOM elements
    const timerDisplay = document.getElementById('timer-time');
    const timerProgress = document.getElementById('timer-progress');
    const startBtn = document.getElementById('timer-start');
    const pauseBtn = document.getElementById('timer-pause');
    const resetBtn = document.getElementById('timer-reset');
    const modeButtons = document.querySelectorAll('.timer-mode-btn');
    const pomodoroDuration = document.getElementById('pomodoro-duration');
    const shortBreakDuration = document.getElementById('short-break-duration');
    const longBreakDuration = document.getElementById('long-break-duration');
    const autoStartBreaks = document.getElementById('auto-start-breaks');
    const autoStartPomodoros = document.getElementById('auto-start-pomodoros');
    const saveSettingsBtn = document.getElementById('save-pomodoro-settings');
    const pomodoroCount = document.getElementById('pomodoro-count');
    const focusMinutes = document.getElementById('focus-minutes');
    
    // Statistics elements
    const totalTasksEl = document.getElementById('total-tasks');
    const completedTasksEl = document.getElementById('completed-tasks');
    const completionRateEl = document.getElementById('completion-rate');
    const dueSoonEl = document.getElementById('due-soon');
    const categoryStatsEl = document.getElementById('category-stats');
    
    // Settings elements
    const enableNotifications = document.getElementById('enable-notifications');
    const requestNotificationBtn = document.getElementById('request-notification-permission');
    const exportDataBtn = document.getElementById('export-data');
    const importDataBtn = document.getElementById('import-data');
    const importFileInput = document.getElementById('import-file');
    const clearDataBtn = document.getElementById('clear-data');

    // New Pomodoro DOM elements
    const settingsToggle = document.querySelector('.settings-toggle');
    const settingsContent = document.querySelector('.settings-content');
    const taskSelect = document.getElementById('task-select');
    const currentTask = document.getElementById('current-task');

    // Set default date to today
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    taskDate.value = formattedDate;

    // Load tasks from localStorage
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    
    // Load settings from localStorage
    const settings = JSON.parse(localStorage.getItem('taskflow_settings')) || {
        theme: 'light',
        notifications: false
    };
    
    // Apply saved theme
    document.documentElement.setAttribute('data-theme', settings.theme);
    updateThemeToggleIcon();
    
    // Set notification checkbox state
    enableNotifications.checked = settings.notifications;

    // Initial render
    renderTasks();
    updateStatistics();
    updateTaskSelectOptions();

    // Add new task
    taskForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (taskInput.value.trim() === '') return;

        const newTask = {
            id: Date.now(),
            text: taskInput.value.trim(),
            category: taskCategory.value,
            notes: taskNotesInput.value.trim(),
            completed: false,
            priority: taskPriority.value,
            date: taskDate.value || formattedDate,
            createdAt: new Date()
        };

        tasks.push(newTask);
        saveTasks();
        updateTaskRelatedElements();

        // Reset form
        taskInput.value = '';
        taskCategory.value = '';
        taskNotesInput.value = '';
        taskPriority.value = 'medium';
        taskDate.value = formattedDate;
    });

    // Task list event delegation (for checkboxes, edit, delete buttons)
    taskList.addEventListener('click', function(e) {
        const taskItem = e.target.closest('.task-item');
        if (!taskItem) return;

        const taskId = parseInt(taskItem.dataset.id);
        
        // Handle checkbox click
        if (e.target.classList.contains('task-checkbox')) {
            toggleTaskStatus(taskId);
        }

        // Handle delete button click
        if (e.target.classList.contains('delete-btn') || e.target.closest('.delete-btn')) {
            deleteTask(taskId);
        }

        // Handle edit button click
        if (e.target.classList.contains('edit-btn') || e.target.closest('.edit-btn')) {
            editTask(taskId);
        }
    });

    // Filter tasks
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            renderTasks();
        });
    });

    // Category filters
    categoryFilters.forEach(filter => {
        filter.addEventListener('click', function() {
            categoryFilters.forEach(f => f.classList.remove('active'));
            this.classList.add('active');
            renderTasks();
        });
    });

    // Search tasks
    searchBtn.addEventListener('click', function() {
        renderTasks();
    });

    searchInput.addEventListener('input', function() {
        renderTasks();
    });

    // Toggle task completion status
    function toggleTaskStatus(id) {
        tasks = tasks.map(task => {
            if (task.id === id) {
                return { ...task, completed: !task.completed };
            }
            return task;
        });
        saveTasks();
        updateTaskRelatedElements();
    }

    // Delete task
    function deleteTask(id) {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        updateTaskRelatedElements();
    }

    // Edit task
    function editTask(id) {
        const task = tasks.find(task => task.id === id);
        if (!task) return;

        const newText = prompt('Edit task:', task.text);
        if (newText === null) return; // User cancelled
        
        if (newText.trim() !== '') {
            tasks = tasks.map(t => {
                if (t.id === id) {
                    return { ...t, text: newText.trim() };
                }
                return t;
            });
            saveTasks();
            updateTaskRelatedElements();
        }
    }

    // Save tasks to localStorage
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    // Render tasks
    function renderTasks() {
        const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;
        const activeCategory = document.querySelector('.category-filter.active').dataset.category;
        const searchTerm = searchInput.value.trim().toLowerCase();

        // Filter tasks based on activeFilter, activeCategory, and searchTerm
        let filteredTasks = tasks;

        if (activeFilter === 'active') {
            filteredTasks = filteredTasks.filter(task => !task.completed);
        } else if (activeFilter === 'completed') {
            filteredTasks = filteredTasks.filter(task => task.completed);
        }

        if (activeCategory !== 'all') {
            filteredTasks = filteredTasks.filter(task => task.category === activeCategory);
        }

        if (searchTerm) {
            filteredTasks = filteredTasks.filter(task => 
                task.text.toLowerCase().includes(searchTerm)
            );
        }

        // Sort tasks: first by completion status, then by date, then by priority
        filteredTasks.sort((a, b) => {
            if (a.completed !== b.completed) return a.completed ? 1 : -1;
            if (a.date !== b.date) return new Date(a.date) - new Date(b.date);
            
            const priorityValues = { 'high': 0, 'medium': 1, 'low': 2 };
            return priorityValues[a.priority] - priorityValues[b.priority];
        });

        // Update UI
        if (filteredTasks.length === 0) {
            taskList.innerHTML = '';
            emptyState.style.display = 'block';
        } else {
            emptyState.style.display = 'none';
            taskList.innerHTML = filteredTasks.map(task => `
                <li class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                    <div class="task-content">
                        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                        <div>
                            <span class="task-text">${task.text}</span>
                            <span class="priority ${task.priority}">${task.priority}</span>
                            <span class="task-date">${formatDate(task.date)}</span>
                            ${task.category ? `<span class="category category-${task.category}">${task.category}</span>` : ''}
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="task-btn edit-btn"><i class="fas fa-edit"></i></button>
                        <button class="task-btn delete-btn"><i class="fas fa-trash-alt"></i></button>
                    </div>
                    <div class="task-details">
                        ${task.notes ? `<div class="task-notes">${task.notes}</div>` : ''}
                    </div>
                </li>
            `).join('');
        }
    }

    // Format date to readable format
    function formatDate(dateString) {
        const date = new Date(dateString);
        const options = { month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }

    // Update statistics
    function updateStatistics() {
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.completed).length;
        const completionRate = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
        const dueSoonTasks = tasks.filter(task => {
            const taskDate = new Date(task.date);
            const today = new Date();
            const diffTime = taskDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays <= 3 && !task.completed;
        }).length;

        totalTasksEl.textContent = totalTasks;
        completedTasksEl.textContent = completedTasks;
        completionRateEl.textContent = `${completionRate}%`;
        dueSoonEl.textContent = dueSoonTasks;

        // Update category stats
        const categories = ['work', 'personal', 'shopping', 'health', 'education'];
        categoryStatsEl.innerHTML = categories.map(category => {
            const count = tasks.filter(task => task.category === category).length;
            return `<div>${category}: ${count}</div>`;
        }).join('');
    }

    // Theme toggle
    themeToggle.addEventListener('click', function() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        settings.theme = newTheme;
        localStorage.setItem('taskflow_settings', JSON.stringify(settings));
        updateThemeToggleIcon();
    });

    function updateThemeToggleIcon() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const icon = themeToggle.querySelector('i');
        if (currentTheme === 'light') {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        } else {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        }
    }

    // Tab navigation
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            this.classList.add('active');
            document.getElementById(`${this.dataset.tab}-tab`).classList.add('active');
        });
    });

    // Notification settings
    enableNotifications.addEventListener('change', function() {
        settings.notifications = this.checked;
        localStorage.setItem('taskflow_settings', JSON.stringify(settings));
    });

    requestNotificationBtn.addEventListener('click', function() {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                alert('Notification permission granted!');
            } else {
                alert('Notification permission denied!');
            }
        });
    });

    // Data management
    exportDataBtn.addEventListener('click', function() {
        const dataStr = JSON.stringify(tasks, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'tasks.json';
        a.click();
        URL.revokeObjectURL(url);
    });

    importDataBtn.addEventListener('click', function() {
        importFileInput.click();
    });

    importFileInput.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const importedTasks = JSON.parse(e.target.result);
                tasks = importedTasks;
                saveTasks();
                updateTaskRelatedElements();
            };
            reader.readAsText(file);
        }
    });

    clearDataBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to clear all tasks?')) {
            tasks = [];
            saveTasks();
            updateTaskRelatedElements();
        }
    });

    // Pomodoro Timer
    let timer;
    let isTimerRunning = false;
    let timerMode = 'pomodoro';
    let secondsLeft = 25 * 60;
    let totalSeconds = 25 * 60;
    let completedPomodoros = 0;
    let totalFocusMinutes = 0;
    
    // Load pomodoro settings from localStorage
    const pomodoroSettings = JSON.parse(localStorage.getItem('pomodoro_settings')) || {
        pomodoroDuration: 25,
        shortBreakDuration: 5,
        longBreakDuration: 15,
        autoStartBreaks: false,
        autoStartPomodoros: false,
        dailyStats: {
            date: new Date().toLocaleDateString(),
            pomodoros: 0,
            focusMinutes: 0
        }
    };
    
    // Apply saved pomodoro settings
    pomodoroDuration.value = pomodoroSettings.pomodoroDuration;
    shortBreakDuration.value = pomodoroSettings.shortBreakDuration;
    longBreakDuration.value = pomodoroSettings.longBreakDuration;
    autoStartBreaks.checked = pomodoroSettings.autoStartBreaks;
    autoStartPomodoros.checked = pomodoroSettings.autoStartPomodoros;
    
    // Check if stats are from today, if not reset
    if (pomodoroSettings.dailyStats.date !== new Date().toLocaleDateString()) {
        pomodoroSettings.dailyStats = {
            date: new Date().toLocaleDateString(),
            pomodoros: 0,
            focusMinutes: 0
        };
        localStorage.setItem('pomodoro_settings', JSON.stringify(pomodoroSettings));
    }
    
    // Update stats display
    pomodoroCount.textContent = pomodoroSettings.dailyStats.pomodoros;
    focusMinutes.textContent = pomodoroSettings.dailyStats.focusMinutes;
    
    // Format time for display
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    // Update timer display
    function updateTimerDisplay() {
        timerDisplay.textContent = formatTime(secondsLeft);
        
        // Update progress circle
        const progressPercentage = (1 - (secondsLeft / totalSeconds)) * 100;
        
        if (timerMode === 'pomodoro') {
            timerProgress.style.background = `conic-gradient(var(--pomodoro) ${progressPercentage}%, transparent ${progressPercentage}%)`;
        } else if (timerMode === 'short-break') {
            timerProgress.style.background = `conic-gradient(var(--short-break) ${progressPercentage}%, transparent ${progressPercentage}%)`;
        } else {
            timerProgress.style.background = `conic-gradient(var(--long-break) ${progressPercentage}%, transparent ${progressPercentage}%)`;
        }
    }
    
    // Start timer
    function startTimer() {
        if (isTimerRunning) return;
        
        isTimerRunning = true;
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        
        timer = setInterval(() => {
            secondsLeft--;
            updateTimerDisplay();
            
            if (secondsLeft <= 0) {
                clearInterval(timer);
                isTimerRunning = false;
                
                // Play notification sound
                const audio = new Audio('https://assets.coderrocketfuel.com/pomodoro-notification.mp3');
                audio.play();
                
                // Notify user
                if (Notification.permission === 'granted') {
                    const notificationTitle = timerMode === 'pomodoro' 
                        ? 'Break Time!' 
                        : 'Pomodoro Time!';
                    const notificationBody = timerMode === 'pomodoro' 
                        ? 'Well done! Take a break.' 
                        : 'Break is over. Back to work!';
                        
                    new Notification(notificationTitle, {
                        body: notificationBody,
                        icon: 'https://via.placeholder.com/48'
                    });
                }
                
                // Update stats if a pomodoro was completed
                if (timerMode === 'pomodoro') {
                    completedPomodoros++;
                    pomodoroSettings.dailyStats.pomodoros++;
                    pomodoroSettings.dailyStats.focusMinutes += Math.round(pomodoroSettings.pomodoroDuration);
                    localStorage.setItem('pomodoro_settings', JSON.stringify(pomodoroSettings));
                    
                    // Update stats display
                    pomodoroCount.textContent = pomodoroSettings.dailyStats.pomodoros;
                    focusMinutes.textContent = pomodoroSettings.dailyStats.focusMinutes;
                }
                
                // Auto-start next timer
                startBtn.disabled = false;
                pauseBtn.disabled = true;
                
                if (timerMode === 'pomodoro' && pomodoroSettings.autoStartBreaks) {
                    // After every 4 pomodoros, take a long break
                    if (completedPomodoros % 4 === 0) {
                        switchMode('long-break');
                    } else {
                        switchMode('short-break');
                    }
                    startTimer();
                } else if ((timerMode === 'short-break' || timerMode === 'long-break') && pomodoroSettings.autoStartPomodoros) {
                    switchMode('pomodoro');
                    startTimer();
                }
            }
        }, 1000);
    }
    
    // Pause timer
    function pauseTimer() {
        if (!isTimerRunning) return;
        
        clearInterval(timer);
        isTimerRunning = false;
        startBtn.disabled = false;
        pauseBtn.disabled = true;
    }
    
    // Reset timer
    function resetTimer() {
        clearInterval(timer);
        isTimerRunning = false;
        
        // Reset based on current mode
        if (timerMode === 'pomodoro') {
            secondsLeft = parseInt(pomodoroDuration.value) * 60;
        } else if (timerMode === 'short-break') {
            secondsLeft = parseInt(shortBreakDuration.value) * 60;
        } else {
            secondsLeft = parseInt(longBreakDuration.value) * 60;
        }
        
        totalSeconds = secondsLeft;
        updateTimerDisplay();
        startBtn.disabled = false;
        pauseBtn.disabled = true;
    }
    
    // Switch timer mode
    function switchMode(mode) {
        timerMode = mode;
        
        // Update active button
        modeButtons.forEach(btn => {
            if (btn.dataset.mode === mode) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Reset timer for the new mode
        if (mode === 'pomodoro') {
            secondsLeft = parseInt(pomodoroDuration.value) * 60;
            document.documentElement.style.setProperty('--pomodoro', '#f87070');
        } else if (mode === 'short-break') {
            secondsLeft = parseInt(shortBreakDuration.value) * 60;
            document.documentElement.style.setProperty('--pomodoro', '#4cc2c2');
        } else {
            secondsLeft = parseInt(longBreakDuration.value) * 60;
            document.documentElement.style.setProperty('--pomodoro', '#d881f8');
        }
        
        totalSeconds = secondsLeft;
        updateTimerDisplay();
        
        // Clear any existing timer
        if (isTimerRunning) {
            clearInterval(timer);
            isTimerRunning = false;
        }
        
        startBtn.disabled = false;
        pauseBtn.disabled = true;
    }
    
    // Save timer settings
    function saveSettings() {
        pomodoroSettings.pomodoroDuration = parseInt(pomodoroDuration.value);
        pomodoroSettings.shortBreakDuration = parseInt(shortBreakDuration.value);
        pomodoroSettings.longBreakDuration = parseInt(longBreakDuration.value);
        pomodoroSettings.autoStartBreaks = autoStartBreaks.checked;
        pomodoroSettings.autoStartPomodoros = autoStartPomodoros.checked;
        
        localStorage.setItem('pomodoro_settings', JSON.stringify(pomodoroSettings));
        
        // Reset the current timer
        resetTimer();
        
        // Show success message
        alert('Settings saved successfully!');
    }
    
    // Set initial timer display
    updateTimerDisplay();
    
    // Event listeners for timer controls
    startBtn.addEventListener('click', startTimer);
    pauseBtn.addEventListener('click', pauseTimer);
    resetBtn.addEventListener('click', resetTimer);
    
    // Event listeners for mode buttons
    modeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const mode = this.dataset.mode;
            switchMode(mode);
        });
    });
    
    // Event listener for settings
    saveSettingsBtn.addEventListener('click', saveSettings);

    // Toggle settings visibility
    settingsToggle.addEventListener('click', function() {
        this.classList.toggle('active');
        settingsContent.classList.toggle('active');
    });

    // Update task select options whenever tasks are updated
    function updateTaskSelectOptions() {
        // Clear existing options (except the first one)
        while (taskSelect.options.length > 1) {
            taskSelect.remove(1);
        }
        
        // Add options for non-completed tasks
        const activeTasks = tasks.filter(task => !task.completed);
        
        if (activeTasks.length === 0) {
            const option = document.createElement('option');
            option.text = "No active tasks available";
            option.disabled = true;
            taskSelect.add(option);
        } else {
            activeTasks.forEach(task => {
                const option = document.createElement('option');
                option.value = task.id;
                option.text = task.text;
                taskSelect.add(option);
            });
        }
    }

    // Handle task selection for focus
    taskSelect.addEventListener('change', function() {
        const selectedTaskId = parseInt(this.value);
        const selectedTask = tasks.find(task => task.id === selectedTaskId);
        
        if (selectedTask) {
            currentTask.innerHTML = `
                <i class="fas fa-tasks current-task-icon"></i>
                <span>${selectedTask.text}</span>
            `;
        } else {
            currentTask.innerHTML = `
                <i class="fas fa-tasks current-task-icon"></i>
                <span>No task selected</span>
            `;
        }
    });

    // Call this when tasks are updated
    function updateTaskRelatedElements() {
        renderTasks();
        updateStatistics();
        updateTaskSelectOptions();
    }

    // Initialize task select options
    updateTaskSelectOptions();
});