// ===== APP STATE =====
let habits = JSON.parse(localStorage.getItem('disciplineForge_habits')) || [];
let history = JSON.parse(localStorage.getItem('disciplineForge_history')) || {};
let reflections = JSON.parse(localStorage.getItem('disciplineForge_reflections')) || {};
let settings = JSON.parse(localStorage.getItem('disciplineForge_settings')) || {
    identity: "A disciplined gentleman who shows up every day"
};

// ===== MOTIVATIONAL QUOTES =====
const motivationalQuotes = [
    "Discipline is choosing between what you want now and what you want most.",
    "Every day, in every way, you're becoming stronger and more disciplined.",
    "Consistency is the key to unlocking your potential.",
    "Small daily improvements lead to massive long-term results.",
    "The pain of discipline is nothing compared to the pain of regret.",
    "You don't have to be great to start, but you have to start to be great.",
    "Your future self is watching you right now through memories.",
    "One day or day one? You decide.",
    "Excellence is not an act, but a habit.",
    "The only bad workout is the one that didn't happen."
];

// ===== REFLECTION PROMPTS =====
const reflectionPrompts = [
    "What's one small win from today that made you proud?",
    "How did you overcome resistance today?",
    "What identity are you reinforcing with your actions today?",
    "What would your future self thank you for doing today?",
    "How can you make tomorrow 1% better than today?",
    "What discipline today felt most meaningful and why?",
    "Where did you show up when you didn't feel like it?",
    "What old version of yourself did you say no to today?"
];

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    updateUI();
    generateHeatmap();
});

function initializeApp() {
    // Initialize empty state
    if (habits.length === 0) {
        document.getElementById('emptyState').style.display = 'block';
        document.getElementById('reflectionSection').style.display = 'none';
    } else {
        document.getElementById('emptyState').style.display = 'none';
        document.getElementById('reflectionSection').style.display = 'block';
    }
    
    // Set identity statement
    document.getElementById('identityText').textContent = settings.identity;
    
    // Set random motivation
    setRandomMotivation();
    
    // Set random reflection prompt
    setRandomReflectionPrompt();
    
    // Check if today's completion data exists
    const today = getTodayString();
    if (!history[today]) {
        history[today] = {
            completed: [],
            streakMaintained: false
        };
        saveToStorage('history', history);
    }
}

// ===== STORAGE MANAGEMENT =====
function saveToStorage(key, data) {
    localStorage.setItem(`disciplineForge_${key}`, JSON.stringify(data));
}

// ===== DATE HELPERS =====
function getTodayString() {
    return new Date().toISOString().split('T')[0];
}

function getCurrentWeek() {
    const date = new Date();
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

// ===== HABIT MANAGEMENT =====
function addHabit(habitData) {
    const newHabit = {
        id: Date.now().toString(),
        name: habitData.name,
        category: habitData.category,
        reason: habitData.reason,
        difficulty: habitData.difficulty,
        createdAt: new Date().toISOString(),
        completedDates: [],
        currentStreak: 0,
        longestStreak: 0,
        totalCompletions: 0
    };
    
    habits.push(newHabit);
    saveToStorage('habits', habits);
    updateUI();
}

function updateHabit(id, updatedData) {
    habits = habits.map(habit => {
        if (habit.id === id) {
            return { ...habit, ...updatedData };
        }
        return habit;
    });
    saveToStorage('habits', habits);
    updateUI();
}

function deleteHabit(id) {
    habits = habits.filter(habit => habit.id !== id);
    saveToStorage('habits', habits);
    updateUI();
}

function toggleHabitCompletion(id) {
    const today = getTodayString();
    const habit = habits.find(h => h.id === id);
    
    if (!habit) return;
    
    const wasCompleted = habit.completedDates.includes(today);
    
    if (wasCompleted) {
        // Remove completion
        habit.completedDates = habit.completedDates.filter(date => date !== today);
        habit.totalCompletions = Math.max(0, habit.totalCompletions - 1);
        
        // Update streak
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (!habit.completedDates.includes(yesterdayStr)) {
            habit.currentStreak = 0;
        }
    } else {
        // Add completion
        habit.completedDates.push(today);
        habit.totalCompletions++;
        
        // Update streak
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (habit.completedDates.includes(yesterdayStr)) {
            habit.currentStreak++;
            if (habit.currentStreak > habit.longestStreak) {
                habit.longestStreak = habit.currentStreak;
            }
        } else {
            habit.currentStreak = 1;
            if (habit.longestStreak === 0) {
                habit.longestStreak = 1;
            }
        }
    }
    
    // Update history
    if (!history[today]) {
        history[today] = { completed: [], streakMaintained: false };
    }
    
    if (wasCompleted) {
        history[today].completed = history[today].completed.filter(habitId => habitId !== id);
    } else {
        history[today].completed.push(id);
    }
    
    saveToStorage('habits', habits);
    saveToStorage('history', history);
    updateUI();
    generateHeatmap();
}

// ===== UI UPDATES =====
function updateUI() {
    updateHabitsList();
    updateAnalytics();
    updateEmptyState();
}

function updateHabitsList() {
    const habitsList = document.getElementById('habitsList');
    const today = getTodayString();
    const todayHabits = habits.filter(habit => {
        // Show all habits, but mark completed ones
        return true;
    });
    
    habitsList.innerHTML = '';
    
    if (todayHabits.length === 0) {
        document.getElementById('emptyState').style.display = 'block';
        document.getElementById('reflectionSection').style.display = 'none';
        return;
    }
    
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('reflectionSection').style.display = 'block';
    
    todayHabits.forEach(habit => {
        const isCompleted = habit.completedDates.includes(today);
        
        const habitCard = document.createElement('div');
        habitCard.className = 'habit-card';
        habitCard.dataset.id = habit.id;
        habitCard.dataset.category = habit.category;
        
        habitCard.innerHTML = `
            <div class="habit-checkbox ${isCompleted ? 'checked' : ''}" 
                 onclick="toggleHabitCompletion('${habit.id}')"></div>
            <div class="habit-info">
                <div class="habit-header">
                    <span class="habit-name">${habit.name}</span>
                    <span class="habit-category ${habit.category}">${habit.category}</span>
                </div>
                <p class="habit-reason">${habit.reason}</p>
                <div class="habit-stats">
                    <span class="habit-stat">🔥 <strong>${habit.currentStreak}</strong> day streak</span>
                    <span class="habit-stat">📊 <strong>${habit.totalCompletions}</strong> total</span>
                    <span class="habit-stat">🏆 <strong>${habit.longestStreak}</strong> best</span>
                </div>
            </div>
            <div class="habit-actions">
                <button class="habit-btn edit" onclick="editHabit('${habit.id}')">✏️</button>
                <button class="habit-btn delete" onclick="deleteHabit('${habit.id}')">🗑️</button>
            </div>
        `;
        
        habitsList.appendChild(habitCard);
    });
}

function updateAnalytics() {
    const today = getTodayString();
    const todayHabits = habits.filter(habit => habit.completedDates.includes(today));
    
    // Current streak calculation
    let currentStreak = 0;
    const todayDate = new Date();
    let checkingDate = new Date(todayDate);
    
    while (true) {
        const dateStr = checkingDate.toISOString().split('T')[0];
        const dayHabits = habits.filter(h => h.completedDates.includes(dateStr));
        
        if (dayHabits.length > 0) {
            currentStreak++;
            checkingDate.setDate(checkingDate.getDate() - 1);
        } else {
            break;
        }
    }
    
    // Consistency score
    const totalDaysTracked = Object.keys(history).length;
    const daysWithAnyCompletion = Object.values(history).filter(day => day.completed.length > 0).length;
    const consistencyScore = totalDaysTracked > 0 ? Math.round((daysWithAnyCompletion / totalDaysTracked) * 100) : 0;
    
    // Habit strength (average streak)
    const totalStreaks = habits.reduce((sum, habit) => sum + habit.currentStreak, 0);
    const habitStrength = habits.length > 0 ? Math.round(totalStreaks / habits.length) : 0;
    
    // Identity score (weighted average of all metrics)
    const identityScore = Math.round((currentStreak * 0.3 + consistencyScore * 0.3 + habitStrength * 0.2 + (todayHabits.length / habits.length) * 100 * 0.2));
    
    // Update UI
    document.getElementById('currentStreak').textContent = currentStreak;
    document.getElementById('consistencyScore').textContent = consistencyScore + '%';
    document.getElementById('habitStrength').textContent = habitStrength;
    document.getElementById('todayComplete').textContent = `${todayHabits.length}/${habits.length}`;
    document.getElementById('identityScore').textContent = identityScore + '%';
}

function updateEmptyState() {
    if (habits.length === 0) {
        document.getElementById('emptyState').style.display = 'block';
        document.getElementById('reflectionSection').style.display = 'none';
    } else {
        document.getElementById('emptyState').style.display = 'none';
        document.getElementById('reflectionSection').style.display = 'block';
    }
}

// ===== HEATMAP GENERATION =====
function generateHeatmap() {
    const heatmapGrid = document.getElementById('heatmapGrid');
    heatmapGrid.innerHTML = '';
    
    // Generate last 365 days
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 364);
    
    let currentDate = new Date(startDate);
    
    while (currentDate <= today) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const dayHabits = habits.filter(h => h.completedDates.includes(dateStr));
        
        let level = 0;
        if (dayHabits.length > 0) {
            const completionRate = dayHabits.length / habits.length;
            if (completionRate < 0.25) level = 1;
            else if (completionRate < 0.5) level = 2;
            else if (completionRate < 0.75) level = 3;
            else level = 4;
        }
        
        const dayElement = document.createElement('div');
        dayElement.className = `heatmap-day level-${level}`;
        dayElement.title = `${dateStr}: ${dayHabits.length} habits completed`;
        
        heatmapGrid.appendChild(dayElement);
        
        currentDate.setDate(currentDate.getDate() + 1);
    }
}

// ===== MODAL MANAGEMENT =====
let currentEditId = null;

function openModal(editId = null) {
    const modal = document.getElementById('habitModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('habitForm');
    
    currentEditId = editId;
    
    if (editId) {
        modalTitle.textContent = 'Edit Habit';
        const habit = habits.find(h => h.id === editId);
        if (habit) {
            document.getElementById('habitName').value = habit.name;
            document.getElementById('habitCategory').value = habit.category;
            document.getElementById('habitReason').value = habit.reason;
            document.getElementById('habitDifficulty').value = habit.difficulty;
        }
    } else {
        modalTitle.textContent = 'Add New Habit';
        form.reset();
    }
    
    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('habitModal').classList.remove('active');
    currentEditId = null;
    document.getElementById('habitForm').reset();
}

function editHabit(id) {
    openModal(id);
}

// ===== MOTIVATION & REFLECTION =====
function setRandomMotivation() {
    const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
    document.getElementById('motivationText').textContent = motivationalQuotes[randomIndex];
}

function setRandomReflectionPrompt() {
    const randomIndex = Math.floor(Math.random() * reflectionPrompts.length);
    document.getElementById('reflectionPrompt').textContent = reflectionPrompts[randomIndex];
}

function saveReflection() {
    const today = getTodayString();
    const reflectionText = document.getElementById('reflectionInput').value.trim();
    
    if (reflectionText) {
        reflections[today] = {
            text: reflectionText,
            date: today,
            prompt: document.getElementById('reflectionPrompt').textContent
        };
        saveToStorage('reflections', reflections);
        document.getElementById('reflectionInput').value = '';
        setRandomReflectionPrompt();
        
        // Show success feedback
        const saveBtn = document.getElementById('saveReflection');
        const originalText = saveBtn.textContent;
        saveBtn.textContent = '✓ Saved!';
        saveBtn.style.background = 'var(--accent-green)';
        
        setTimeout(() => {
            saveBtn.textContent = originalText;
            saveBtn.style.background = '';
        }, 2000);
    }
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    // Add habit button
    document.getElementById('addHabitBtn').addEventListener('click', () => openModal());
    
    // Close modal buttons
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('cancelBtn').addEventListener('click', closeModal);
    
    // Habit form submission
    document.getElementById('habitForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const habitData = {
            name: document.getElementById('habitName').value.trim(),
            category: document.getElementById('habitCategory').value,
            reason: document.getElementById('habitReason').value.trim(),
            difficulty: document.getElementById('habitDifficulty').value
        };
        
        if (currentEditId) {
            updateHabit(currentEditId, habitData);
        } else {
            addHabit(habitData);
        }
        
        closeModal();
    });
    
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // Update active state
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Filter habits
            const filter = this.dataset.filter;
            const habitCards = document.querySelectorAll('.habit-card');
            
            habitCards.forEach(card => {
                if (filter === 'all' || card.dataset.category === filter) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
    
    // Save reflection
    document.getElementById('saveReflection').addEventListener('click', saveReflection);
    
    // Close modals on background click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    });
    
    // Weekly summary trigger (on Sundays)
    const today = new Date();
    if (today.getDay() === 0) { // Sunday
        setTimeout(showWeeklySummary, 1000);
    }
}

// ===== WEEKLY SUMMARY =====
function showWeeklySummary() {
    const modal = document.getElementById('summaryModal');
    const content = document.getElementById('summaryContent');
    
    // Calculate weekly stats
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    let weeklyStats = {
        totalCompletions: 0,
        streakMaintained: true,
        bestDay: { date: '', count: 0 },
        categories: {}
    };
    
    // Analyze last 7 days
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        if (history[dateStr]) {
            weeklyStats.totalCompletions += history[dateStr].completed.length;
            
            if (history[dateStr].completed.length > weeklyStats.bestDay.count) {
                weeklyStats.bestDay = { date: dateStr, count: history[dateStr].completed.length };
            }
            
            // Track by category
            history[dateStr].completed.forEach(habitId => {
                const habit = habits.find(h => h.id === habitId);
                if (habit) {
                    weeklyStats.categories[habit.category] = (weeklyStats.categories[habit.category] || 0) + 1;
                }
            });
        }
    }
    
    // Generate summary HTML
    let summaryHTML = `
        <div style="padding: 25px;">
            <h3 style="margin-bottom: 20px; color: var(--accent-green);">Week in Review</h3>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 25px;">
                <div style="background: var(--bg-tertiary); padding: 15px; border-radius: 8px;">
                    <div style="font-size: 0.9rem; color: var(--text-secondary);">Total Completions</div>
                    <div style="font-size: 2rem; font-weight: bold; color: var(--accent-green);">${weeklyStats.totalCompletions}</div>
                </div>
                <div style="background: var(--bg-tertiary); padding: 15px; border-radius: 8px;">
                    <div style="font-size: 0.9rem; color: var(--text-secondary);">Best Day</div>
                    <div style="font-size: 1.2rem; font-weight: bold; color: var(--accent-blue);">${weeklyStats.bestDay.count} habits</div>
                </div>
            </div>
            <h4 style="margin-bottom: 10px;">By Category</h4>
    `;
    
    Object.entries(weeklyStats.categories).forEach(([category, count]) => {
        const percentage = Math.round((count / weeklyStats.totalCompletions) * 100);
        summaryHTML += `
            <div style="margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span>${category.charAt(0).toUpperCase() + category.slice(1)}</span>
                    <span>${percentage}%</span>
                </div>
                <div style="height: 8px; background: var(--bg-tertiary); border-radius: 4px; overflow: hidden;">
                    <div style="width: ${percentage}%; height: 100%; background: var(--accent-green);"></div>
                </div>
            </div>
        `;
    });
    
    summaryHTML += `
            <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid var(--border-color);">
                <p style="color: var(--text-secondary); font-style: italic;">"Consistency is the key to unlocking your potential."</p>
            </div>
        </div>
    `;
    
    content.innerHTML = summaryHTML;
    modal.classList.add('active');
    
    // Close summary button
    document.getElementById('closeSummary').addEventListener('click', function() {
        modal.classList.remove('active');
    });
}

// ===== EXPORT/IMPORT DATA =====
function exportData() {
    const data = {
        habits,
        history,
        reflections,
        settings,
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `discipline-forge-backup-${getTodayString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (confirm('This will replace all current data. Continue?')) {
                habits = data.habits || [];
                history = data.history || {};
                reflections = data.reflections || {};
                settings = data.settings || { identity: "A disciplined gentleman who shows up every day" };
                
                saveToStorage('habits', habits);
                saveToStorage('history', history);
                saveToStorage('reflections', reflections);
                saveToStorage('settings', settings);
                
                updateUI();
                generateHeatmap();
                alert('Data imported successfully!');
            }
        } catch (error) {
            alert('Error importing data. Please check the file format.');
        }
    };
    reader.readAsText(file);
}

// ===== CLEAR DATA (For testing) =====
function clearAllData() {
    if (confirm('Are you sure? This will delete ALL your data permanently.')) {
        localStorage.clear();
        habits = [];
        history = {};
        reflections = {};
        settings = { identity: "A disciplined gentleman who shows up every day" };
        updateUI();
        generateHeatmap();
        alert('All data cleared.');
    }
}

// Add these functions to global scope for buttons (you can add UI buttons for these)
window.exportData = exportData;
window.clearAllData = clearAllData;

// For import, you'll need to add an invisible file input
document.body.insertAdjacentHTML('beforeend', '<input type="file" id="importFile" style="display: none;" accept=".json" onchange="importData(event)">');

// Optional: Add debug menu (remove in production)
if (window.location.hash === '#debug') {
    console.log('Debug mode enabled');
    window.debug = {
        habits,
        history,
        reflections,
        settings,
        exportData,
        clearAllData
    };
}