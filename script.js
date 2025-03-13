document.addEventListener('DOMContentLoaded', function() {
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
    
    const totalTasksEl = document.getElementById('total-tasks');
    const completedTasksEl = document.getElementById('completed-tasks');
    const completionRateEl = document.getElementById('completion-rate');
    const dueSoonEl = document.getElementById('due-soon');
    const categoryStatsEl = document.getElementById('category-stats');
    
    const enableNotifications = document.getElementById('enable-notifications');
    const requestNotificationBtn = document.getElementById('request-notification-permission');
    const exportDataBtn = document.getElementById('export-data');
    const importDataBtn = document.getElementById('import-data');
    const importFileInput = document.getElementById('import-file');
    const clearDataBtn = document.getElementById('clear-data');

    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    taskDate.value = formattedDate;

    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    
    const settings = JSON.parse(localStorage.getItem('taskflow_settings')) || {
        theme: 'light',
        notifications: false
    };
    
    document.documentElement.setAttribute('data-theme', settings.theme);
    updateThemeToggleIcon();
    
    enableNotifications.checked = settings.notifications;

    renderTasks();
    updateStatistics();

    taskForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (taskInput.value.trim() === '') return;

        const newTask = {
            id: Date.now(),
            text: taskInput.value.trim(),
            category: taskCategory.value,
            notes: taskNotesInput ? taskNotesInput.value.trim() : '',
            completed: false,
            priority: taskPriority.value,
            date: taskDate.value || formattedDate,
            createdAt: new Date()
        };

        tasks.push(newTask);
        saveTasks();
        renderTasks();
        updateStatistics();

        taskInput.value = '';
        taskCategory.value = '';
        if (taskNotesInput) taskNotesInput.value = '';
        taskPriority.value = 'medium';
        taskDate.value = formattedDate;
    });

    taskList.addEventListener('click', function(e) {
        const taskItem = e.target.closest('.task-item');
        if (!taskItem) return;

        const taskId = parseInt(taskItem.dataset.id);
        
        if (e.target.classList.contains('task-checkbox')) {
            toggleTaskStatus(taskId);
        }

        if (e.target.classList.contains('delete-btn') || e.target.closest('.delete-btn')) {
            deleteTask(taskId);
        }

        if (e.target.classList.contains('edit-btn') || e.target.closest('.edit-btn')) {
            editTask(taskId);
        }
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            renderTasks();
        });
    });

    categoryFilters.forEach(filter => {
        filter.addEventListener('click', function() {
            categoryFilters.forEach(f => f.classList.remove('active'));
            this.classList.add('active');
            renderTasks();
        });
    });

    searchBtn.addEventListener('click', function() {
        renderTasks();
    });

    searchInput.addEventListener('input', function() {
        renderTasks();
    });

    function toggleTaskStatus(id) {
        tasks = tasks.map(task => {
            if (task.id === id) {
                return { ...task, completed: !task.completed };
            }
            return task;
        });
        saveTasks();
        renderTasks();
        updateStatistics();
    }

    function deleteTask(id) {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasks();
        updateStatistics();
    }

    function editTask(id) {
        const task = tasks.find(task => task.id === id);
        if (!task) return;

        const newText = prompt('Edit task:', task.text);
        if (newText === null) return;
        
        if (newText.trim() !== '') {
            tasks = tasks.map(t => {
                if (t.id === id) {
                    return { ...t, text: newText.trim() };
                }
                return t;
            });
            saveTasks();
            renderTasks();
            updateStatistics();
        }
    }

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function renderTasks() {
        const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;
        const activeCategory = document.querySelector('.category-filter.active').dataset.category;
        const searchTerm = searchInput.value.trim().toLowerCase();

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

        filteredTasks.sort((a, b) => {
            if (a.completed !== b.completed) return a.completed ? 1 : -1;
            if (a.date !== b.date) return new Date(a.date) - new Date(b.date);
            
            const priorityValues = { 'high': 0, 'medium': 1, 'low': 2 };
            return priorityValues[a.priority] - priorityValues[b.priority];
        });

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

    function formatDate(dateString) {
        const date = new Date(dateString);
        const options = { month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }

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

        const categories = ['work', 'personal', 'shopping', 'health', 'education'];
        categoryStatsEl.innerHTML = categories.map(category => {
            const count = tasks.filter(task => task.category === category).length;
            return `<div>${category}: ${count}</div>`;
        }).join('');
    }

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

    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            this.classList.add('active');
            document.getElementById(`${this.dataset.tab}-tab`).classList.add('active');
        });
    });

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
                renderTasks();
                updateStatistics();
            };
            reader.readAsText(file);
        }
    });

    clearDataBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to clear all tasks?')) {
            tasks = [];
            saveTasks();
            renderTasks();
            updateStatistics();
        }
    });
    
    // Pomodoro Timer Functionality
    // Timer variables
    let timer;
    let minutes = 25;
    let seconds = 0;
    let isRunning = false;
    let currentMode = 'pomodoro';
    let originalMinutes = 25;
    
    // DOM elements
    const timerDisplay = document.getElementById('timer-time');
    const timerProgress = document.getElementById('timer-progress');
    const startBtn = document.getElementById('timer-start');
    const pauseBtn = document.getElementById('timer-pause');
    const resetBtn = document.getElementById('timer-reset');
    const modeButtons = document.querySelectorAll('.timer-mode-btn');
    const settingsToggle = document.querySelector('.settings-toggle');
    const settingsContent = document.querySelector('.settings-content');
    const saveSettingsBtn = document.getElementById('save-pomodoro-settings');
    const pomodoroCount = document.getElementById('pomodoro-count');
    const focusMinutes = document.getElementById('focus-minutes');
    
    // Settings inputs
    const pomodoroDuration = document.getElementById('pomodoro-duration');
    const shortBreakDuration = document.getElementById('short-break-duration');
    const longBreakDuration = document.getElementById('long-break-duration');
    const autoStartBreaks = document.getElementById('auto-start-breaks');
    const autoStartPomodoros = document.getElementById('auto-start-pomodoros');
    
    // Stats
    let completedPomodoros = 0;
    let totalFocusMinutes = 0;
    
    // Initialize timer display
    updateTimerDisplay();
    
    // Event listeners
    startBtn.addEventListener('click', startTimer);
    pauseBtn.addEventListener('click', pauseTimer);
    resetBtn.addEventListener('click', resetTimer);
    
    // Mode buttons
    modeButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            modeButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Set new mode and time
            currentMode = button.dataset.mode;
            minutes = parseInt(button.dataset.minutes);
            originalMinutes = minutes;
            seconds = 0;
            
            // Update display and reset timer
            resetTimer();
        });
    });
    
    // Settings toggle
    settingsToggle.addEventListener('click', () => {
        settingsContent.classList.toggle('show');
        const icon = settingsToggle.querySelector('.settings-toggle-icon');
        if (settingsContent.classList.contains('show')) {
            icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
        } else {
            icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
        }
    });
    
    // Save settings
    saveSettingsBtn.addEventListener('click', () => {
        // Update timer duration settings
        const pDuration = parseInt(pomodoroDuration.value);
        const sBDuration = parseInt(shortBreakDuration.value);
        const lBDuration = parseInt(longBreakDuration.value);
        
        // Update mode buttons with new durations
        document.querySelector('[data-mode="pomodoro"]').dataset.minutes = pDuration;
        document.querySelector('[data-mode="short-break"]').dataset.minutes = sBDuration;
        document.querySelector('[data-mode="long-break"]').dataset.minutes = lBDuration;
        
        // If the current mode matches the one being updated, update the timer
        if (currentMode === 'pomodoro') {
            minutes = pDuration;
            originalMinutes = pDuration;
        } else if (currentMode === 'short-break') {
            minutes = sBDuration;
            originalMinutes = sBDuration;
        } else if (currentMode === 'long-break') {
            minutes = lBDuration;
            originalMinutes = lBDuration;
        }
        
        // Reset the timer with new settings
        resetTimer();
        
        // Hide settings panel
        settingsContent.classList.remove('show');
        settingsToggle.querySelector('.settings-toggle-icon').classList.replace('fa-chevron-up', 'fa-chevron-down');
        
        // Show confirmation message
        alert('Settings saved successfully!');
    });
    
    // Timer functions
    function startTimer() {
        if (!isRunning) {
            isRunning = true;
            startBtn.disabled = true;
            pauseBtn.disabled = false;
            
            timer = setInterval(() => {
                if (seconds === 0) {
                    if (minutes === 0) {
                        // Timer completed
                        clearInterval(timer);
                        isRunning = false;
                        
                        // Update stats if it was a pomodoro
                        if (currentMode === 'pomodoro') {
                            completedPomodoros++;
                            totalFocusMinutes += originalMinutes;
                            
                            // Update stats display
                            pomodoroCount.textContent = completedPomodoros;
                            focusMinutes.textContent = totalFocusMinutes;
                        }
                        
                        // Play notification sound
                        const audio = new Audio('https://soundbible.com/mp3/Electronic_Chime-KevanGC-495939803.mp3');
                        audio.play();
                        
                        // Show browser notification
                        if (Notification.permission === 'granted') {
                            new Notification(`${currentMode.charAt(0).toUpperCase() + currentMode.slice(1)} completed!`, {
                                body: currentMode === 'pomodoro' ? 'Time for a break!' : 'Ready to focus again?',
                                icon: './logo.png'
                            });
                        }
                        
                        // Auto-start next timer if enabled
                        if ((currentMode === 'pomodoro' && autoStartBreaks.checked) || 
                            (currentMode !== 'pomodoro' && autoStartPomodoros.checked)) {
                            // Switch to the next appropriate mode
                            const nextMode = currentMode === 'pomodoro' ? 
                                'short-break' : 'pomodoro';
                            
                            // Click the corresponding mode button
                            document.querySelector(`[data-mode="${nextMode}"]`).click();
                            
                            // Start the timer after a short delay
                            setTimeout(startTimer, 1000);
                        }
                        
                        startBtn.disabled = false;
                        pauseBtn.disabled = true;
                        return;
                    }
                    minutes--;
                    seconds = 59;
                } else {
                    seconds--;
                }
                
                updateTimerDisplay();
            }, 1000);
        }
    }
    
    function pauseTimer() {
        if (isRunning) {
            clearInterval(timer);
            isRunning = false;
            startBtn.disabled = false;
            pauseBtn.disabled = true;
        }
    }
    
    function resetTimer() {
        clearInterval(timer);
        isRunning = false;
        seconds = 0;
        minutes = originalMinutes;
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        updateTimerDisplay();
    }
    
    function updateTimerDisplay() {
        // Format time as MM:SS
        const displayMinutes = minutes.toString().padStart(2, '0');
        const displaySeconds = seconds.toString().padStart(2, '0');
        timerDisplay.textContent = `${displayMinutes}:${displaySeconds}`;
        
        // Update progress circle
        const totalSeconds = originalMinutes * 60;
        const remainingSeconds = minutes * 60 + seconds;
        const progressPercent = 100 - (remainingSeconds / totalSeconds * 100);
        
        timerProgress.style.background = `conic-gradient(
            var(--accent) ${progressPercent}%,
            transparent ${progressPercent}%
        )`;
    }
    
    // Request notification permission
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        document.getElementById('request-notification-permission')?.addEventListener('click', () => {
            Notification.requestPermission();
        });
    }
});