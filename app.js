// Personal Workout Coach - Modular JS
// Stores data in localStorage as JSON
// Uses Chart.js and Web Speech API

// --- Data Storage ---
const STORAGE_KEY = 'workoutCoachData';
function loadData() {
  let data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    data = JSON.stringify({
      activity: [],
      badges: 0,
      goal: 'fitness'
    });
    localStorage.setItem(STORAGE_KEY, data);
  }
  return JSON.parse(data);
}
function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// --- Smart Workout Plan ---
function getTodayWorkout(data) {
  const goal = data.goal;
  const last = data.activity.length ? data.activity[data.activity.length-1].workout : null;
  let plan;
  if (goal === 'weight loss') plan = ['Cardio', 'HIIT', 'Walking'];
  else if (goal === 'strength') plan = ['Pushups', 'Squats', 'Plank'];
  else plan = ['Yoga', 'Stretching', 'Jogging'];
  let idx = last && plan.includes(last) ? (plan.indexOf(last)+1)%plan.length : 0;
  return plan[idx];
}

function updateWorkoutPlan() {
  const data = loadData();
  const workout = getTodayWorkout(data);
  document.getElementById('workout-plan').textContent = workout;
}

function changeGoal() {
  const goal = document.getElementById('goal').value;
  const data = loadData();
  data.goal = goal;
  saveData(data);
  updateWorkoutPlan();
  // Show confirmation feedback
  const feedback = document.getElementById('goal-feedback');
  feedback.textContent = 'Goal updated!';
  feedback.style.display = 'inline';
  setTimeout(() => { feedback.style.display = 'none'; }, 2000);
}

// --- Activity Tracking ---
function logActivity(e) {
  e.preventDefault();
  const steps = parseInt(document.getElementById('steps').value);
  const calories = parseInt(document.getElementById('calories').value);
  const duration = parseInt(document.getElementById('duration').value);
  const data = loadData();
  const workout = getTodayWorkout(data);
  const entry = {
    date: new Date().toISOString().slice(0,10),
    steps, calories, duration, workout
  };
  data.activity.push(entry);
  let badgeEarned = false;
  if (duration >= 30) {
    data.badges += 1;
    badgeEarned = true;
  }
  saveData(data);
  updateWorkoutPlan();
  updateBadges(badgeEarned);
  updateChart();
  document.getElementById('activity-form').reset();
  // Show confirmation feedback
  const feedback = document.getElementById('activity-feedback');
  feedback.textContent = 'Activity logged!';
  feedback.style.display = 'inline';
  setTimeout(() => { feedback.style.display = 'none'; }, 2000);
}

// --- Progress View ---
let chart;
function updateChart() {
  const data = loadData();
  const dates = data.activity.map(a => a.date);
  const steps = data.activity.map(a => a.steps);
  const calories = data.activity.map(a => a.calories);
  const ctx = document.getElementById('progressChart').getContext('2d');
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dates,
      datasets: [
        { label: 'Steps', data: steps, borderColor: '#2d7ef7', fill: false, pointRadius: 5, pointHoverRadius: 8 },
        { label: 'Calories', data: calories, borderColor: '#e67e22', fill: false, pointRadius: 5, pointHoverRadius: 8 }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true, labels: { font: { size: 16 } } },
        tooltip: { enabled: true, callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y}`;
          }
        } }
      },
      scales: {
        x: { title: { display: true, text: 'Date', font: { size: 16 } } },
        y: { title: { display: true, text: 'Count', font: { size: 16 } } }
      }
    }
  });
}

// --- Badges and Rewards ---
function updateBadges(animate = false) {
  const data = loadData();
  document.getElementById('badges').textContent = `Badges: ${data.badges}`;
  if (animate) {
    const badgeAnim = document.getElementById('badge-animation');
    badgeAnim.innerHTML = '🎉🏅';
    badgeAnim.style.display = 'block';
    setTimeout(() => { badgeAnim.style.display = 'none'; badgeAnim.innerHTML = ''; }, 1200);
  }
}

// --- Reminders and Notifications ---
function openReminderModal(type) {
  const modal = new bootstrap.Modal(document.getElementById('reminderModal'));
  document.getElementById('reminderType').value = type;
  document.getElementById('reminderTime').value = '';
  document.getElementById('reminder-feedback').style.display = 'none';
  modal.show();
}

document.getElementById('reminderForm').onsubmit = function(e) {
  e.preventDefault();
  const type = document.getElementById('reminderType').value;
  const time = document.getElementById('reminderTime').value;
  // Save reminder to localStorage (demo only)
  localStorage.setItem(`reminder_${type}`, time);
  const feedback = document.getElementById('reminder-feedback');
  feedback.textContent = `${type.charAt(0).toUpperCase() + type.slice(1)} reminder set for ${time}`;
  feedback.style.display = 'inline';
  setTimeout(() => { feedback.style.display = 'none'; }, 2000);
  bootstrap.Modal.getInstance(document.getElementById('reminderModal')).hide();
}

// --- Voice Guide Integration ---
let voiceMsg = null;
function playVoiceGuide() {
  const data = loadData();
  const workout = getTodayWorkout(data);
  if ('speechSynthesis' in window) {
    if (voiceMsg && window.speechSynthesis.speaking) return;
    voiceMsg = new SpeechSynthesisUtterance(`Today's workout is ${workout}. Let's get started!`);
    voiceMsg.rate = parseFloat(document.getElementById('voiceSpeed').value);
    window.speechSynthesis.speak(voiceMsg);
  } else {
    alert('Voice guide not supported in this browser.');
  }
}
function pauseVoiceGuide() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.pause();
  }
}
function replayVoiceGuide() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    playVoiceGuide();
  }
}
document.getElementById('voiceSpeed').addEventListener('input', function() {
  if (voiceMsg && window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    playVoiceGuide();
  }
});

// --- Initial UI Setup ---
// --- Accessibility & Font Size ---
document.getElementById('fontSize').addEventListener('input', function() {
  document.body.style.setProperty('--user-font-size', this.value + 'px');
  document.body.setAttribute('data-fontsize', 'true');
});

// Keyboard navigation for nav links
document.querySelectorAll('.nav-link').forEach(link => {
  link.setAttribute('tabindex', '0');
  link.setAttribute('role', 'link');
});

// Initial UI Setup
document.addEventListener('DOMContentLoaded', () => {
  updateWorkoutPlan();
  updateBadges();
  updateChart();
  document.getElementById('goal').value = loadData().goal;
  // Set font size from previous session
  const fs = document.body.style.getPropertyValue('--user-font-size');
  if (fs) document.getElementById('fontSize').value = parseInt(fs);
});
