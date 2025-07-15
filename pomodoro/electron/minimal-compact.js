// State
let isRunning = false;
let timeLeft = 0;
let isWorkPhase = true;

// Format time as mm:ss
function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

// Update timer display
function updateDisplay() {
  document.getElementById('timerDisplay').textContent = formatTime(timeLeft);
  const startBtn = document.getElementById('startBtn');
  startBtn.innerHTML = isRunning ? 
    '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="6" y="4" width="3" height="12" fill="#111" /><rect x="11" y="4" width="3" height="12" fill="#111" /></svg>' :
    '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M7 4L16 10L7 16V4Z" fill="#111" /></svg>';
  document.getElementById('phaseIndicator').textContent = isWorkPhase ? 'Work Time' : 'Break';
  document.getElementById('phaseIndicator').style.color = isWorkPhase ? '#ff6b6b' : '#4a90e2';
}

// Listen for timer updates from main process
if (window.electronAPI && window.electronAPI.onTimerUpdate) {
  window.electronAPI.onTimerUpdate((newTimeLeft, running, phase) => {
    timeLeft = newTimeLeft;
    isRunning = running;
    isWorkPhase = phase;
    updateDisplay();
  });
}

// Start/Pause button
document.getElementById('startBtn').onclick = () => {
  if (window.electronAPI) {
    if (isRunning) {
      window.electronAPI.pauseTimer();
    } else {
      window.electronAPI.startTimer();
    }
  }
};

// Stop button
document.getElementById('stopBtn').onclick = () => {
  if (window.electronAPI) {
    window.electronAPI.stopTimer();
  }
};

// Reset button
document.getElementById('resetBtn').onclick = () => {
  if (window.electronAPI) {
    window.electronAPI.resetTimer();
  }
};

// Expand button
document.getElementById('expandBtn').onclick = () => {
  if (window.electronAPI && window.electronAPI.restoreTimer) {
    window.electronAPI.restoreTimer();
  }
};

// Initial display
updateDisplay(); 