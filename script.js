document.addEventListener('DOMContentLoaded', () => {
    const taskForm = document.getElementById('task-form');
    const taskInput = document.getElementById('task-input');
    const taskCategory = document.getElementById('task-category');
    const taskPriority = document.getElementById('task-priority');
    const taskList = document.getElementById('task-list');
    const emptyState = document.getElementById('empty-state');
    const themeToggle = document.getElementById('theme-toggle');


    const totalTasksEl = document.getElementById('total-tasks');
    const completedTasksEl = document.getElementById('completed-tasks');
    const completionRateEl = document.getElementById('completion-rate');


    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentFilter = 'all';
    let currentCategory = 'all';


    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });

    function updateThemeIcon(theme) {
        const icon = themeToggle.querySelector('i');
        icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }


    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(`${btn.dataset.tab}-tab`).classList.add('active');
        });
    });


    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = taskInput.value.trim();
        if (!text) return;

        const newTask = {
            id: Date.now(),
            text,
            category: taskCategory.value,
            priority: taskPriority.value,
            completed: false,
            createdAt: new Date().toISOString()
        };

        tasks.unshift(newTask);
        saveTasks();
        renderTasks();
        taskInput.value = '';
    });

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
        updateStats();
    }

    function renderTasks() {
        let filtered = tasks;

        if (currentFilter === 'active') filtered = filtered.filter(t => !t.completed);
        if (currentFilter === 'completed') filtered = filtered.filter(t => t.completed);

        if (currentCategory !== 'all') {
            filtered = filtered.filter(t => t.category === currentCategory);
        }

        taskList.innerHTML = '';

        if (filtered.length === 0) {
            emptyState.style.display = 'block';
        } else {
            emptyState.style.display = 'none';
            filtered.forEach(task => {
                const li = document.createElement('li');
                li.className = `task-card priority-${task.priority} ${task.completed ? 'completed' : ''}`;
                li.innerHTML = `
                    <div class="checkbox-wrapper">
                        <input type="checkbox" class="custom-checkbox" ${task.completed ? 'checked' : ''}>
                    </div>
                    <div class="task-content">
                        <div class="task-text">${task.text}</div>
                        <div class="task-meta">
                            <span style="text-transform: capitalize;">${task.category}</span>
                            <span>•</span>
                            <span style="text-transform: capitalize;">${task.priority}</span>
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="action-btn delete-btn"><i class="fas fa-trash"></i></button>
                    </div>
                `;


                const checkbox = li.querySelector('.custom-checkbox');
                checkbox.addEventListener('change', () => toggleTask(task.id));

                const deleteBtn = li.querySelector('.delete-btn');
                deleteBtn.addEventListener('click', () => deleteTask(task.id));

                taskList.appendChild(li);
            });
        }
        updateStats();
    }

    function toggleTask(id) {
        tasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
        saveTasks();
        renderTasks();
    }

    function deleteTask(id) {
        if (confirm('Delete this task?')) {
            tasks = tasks.filter(t => t.id !== id);
            saveTasks();
            renderTasks();
        }
    }

    function updateStats() {
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const rate = total === 0 ? 0 : Math.round((completed / total) * 100);

        totalTasksEl.textContent = total;
        completedTasksEl.textContent = completed;
        completionRateEl.textContent = `${rate}%`;
    }


    document.querySelectorAll('.chip[data-filter]').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.chip[data-filter]').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentFilter = chip.dataset.filter;
            renderTasks();
        });
    });

    document.querySelectorAll('.chip[data-category]').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.chip[data-category]').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentCategory = chip.dataset.category;
            renderTasks();
        });
    });


    let timerInterval;
    let timeLeft = 25 * 60;
    let isRunning = false;
    const timerDisplay = document.getElementById('timer-time');
    const timerStatus = document.getElementById('timer-status');
    const startBtn = document.getElementById('timer-start');
    const pauseBtn = document.getElementById('timer-pause');
    const resetBtn = document.getElementById('timer-reset');

    function updateTimerDisplay() {
        const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
        const s = (timeLeft % 60).toString().padStart(2, '0');
        timerDisplay.textContent = `${m}:${s}`;


        document.title = `${m}:${s} - TaskFlow`;
    }

    startBtn.addEventListener('click', () => {
        if (isRunning) return;
        isRunning = true;
        startBtn.disabled = true;
        pauseBtn.disabled = false;

        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();

            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                isRunning = false;
                startBtn.disabled = false;
                pauseBtn.disabled = true;
                alert('Time is up!');
            }
        }, 1000);
    });

    pauseBtn.addEventListener('click', () => {
        clearInterval(timerInterval);
        isRunning = false;
        startBtn.disabled = false;
        pauseBtn.disabled = true;
    });

    resetBtn.addEventListener('click', () => {
        clearInterval(timerInterval);
        isRunning = false;
        startBtn.disabled = false;
        pauseBtn.disabled = true;


        const activeMode = document.querySelector('.chip[data-mode].active').dataset.mode;
        setTimerMode(activeMode);
    });

    document.querySelectorAll('.chip[data-mode]').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.chip[data-mode]').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            setTimerMode(chip.dataset.mode);
        });
    });

    function setTimerMode(mode) {
        clearInterval(timerInterval);
        isRunning = false;
        startBtn.disabled = false;
        pauseBtn.disabled = true;

        switch (mode) {
            case 'pomodoro':
                timeLeft = 25 * 60;
                timerStatus.textContent = 'Focus Time';
                break;
            case 'short-break':
                timeLeft = 5 * 60;
                timerStatus.textContent = 'Short Break';
                break;
            case 'long-break':
                timeLeft = 15 * 60;
                timerStatus.textContent = 'Long Break';
                break;
        }
        updateTimerDisplay();
    }


    document.getElementById('clear-data').addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
            tasks = [];
            saveTasks();
            renderTasks();
        }
    });


    renderTasks();
});