// main.js - Lógica principal de la aplicación
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import p5 from 'p5';
import { setup, draw, windowResized, updatePhase, updateTargetSize } from './sketch.js';
// Variables de estado
let isRunning = false;
let currentPhase = 'idle'; // idle, inhale, hold, exhale
let phaseStartTime = 0;
let cycleCount = 0;
let sessionStartTime = 0;
// Configuración de tiempos (en segundos)
let inhaleTime = 4;
let holdTime = 4;
let exhaleTime = 4;
// Elementos del DOM
let startBtn, stopBtn, resetStatsBtn;
let phaseText;
let inhaleInput, holdInput, exhaleInput;
let sessionsCountEl, cyclesCountEl, totalTimeEl;
// Estadísticas (se guardan en LocalStorage)
let stats = {
  sessionsCompleted: 0,
  totalCycles: 0,
  totalMinutes: 0
};
// Inicializar p5.js
const sketch = (p) => {
  p.setup = () => setup(p);
  p.draw = () => draw(p);
  p.windowResized = () => windowResized(p);
};
// Esperar a que el DOM esté cargado
document.addEventListener('DOMContentLoaded', () => {
  // Iniciar sketch de p5.js
  new p5(sketch);
  // Obtener elementos del DOM
  startBtn = document.getElementById('start-btn');
  stopBtn = document.getElementById('stop-btn');
  resetStatsBtn = document.getElementById('reset-stats-btn');
  phaseText = document.getElementById('phase-text');
  inhaleInput = document.getElementById('inhale-time');
  holdInput = document.getElementById('hold-time');
  exhaleInput = document.getElementById('exhale-time');
  sessionsCountEl = document.getElementById('sessions-count');
  cyclesCountEl = document.getElementById('cycles-count');
  totalTimeEl = document.getElementById('total-time');
  // Cargar estadísticas desde LocalStorage
  loadStats();
  updateStatsDisplay();
  // Event listeners
  startBtn.addEventListener('click', startBreathing);
  stopBtn.addEventListener('click', stopBreathing);
  resetStatsBtn.addEventListener('click', resetStats);
  // Actualizar configuración de tiempos
  inhaleInput.addEventListener('change', updateTimings);
  holdInput.addEventListener('change', updateTimings);
  exhaleInput.addEventListener('change', updateTimings);
  // Iniciar el loop de actualización
  setInterval(update, 100); // Actualizar 10 veces por segundo
});
// Función para iniciar la respiración
function startBreathing() {
  if (isRunning) return;
  isRunning = true;
  sessionStartTime = Date.now();
  cycleCount = 0;
  // Actualizar UI
  startBtn.disabled = true;
  stopBtn.disabled = false;
  inhaleInput.disabled = true;
  holdInput.disabled = true;
  exhaleInput.disabled = true;
  // Iniciar primera fase
  startPhase('inhale');
  // Vibración de inicio
  vibrateDevice('medium');
}
// Función para detener la respiración
function stopBreathing() {
  if (!isRunning) return;
  isRunning = false;
  currentPhase = 'idle';
  // Calcular tiempo de sesión
  const sessionDuration = (Date.now() - sessionStartTime) / 1000 / 60; // en minutos
  // Actualizar estadísticas
  stats.sessionsCompleted++;
  stats.totalCycles += cycleCount;
  stats.totalMinutes += sessionDuration;
  saveStats();
  updateStatsDisplay();
  // Actualizar UI
  startBtn.disabled = false;
  stopBtn.disabled = true;
  inhaleInput.disabled = false;
  holdInput.disabled = false;
  exhaleInput.disabled = false;
  
  phaseText.textContent = 'Sesión completada';
  updatePhase('idle');
  updateTargetSize(100);
  
  // Vibración de fin
  vibrateDevice('heavy');
}
// Función de actualización del ciclo de respiración
function update() {
  if (!isRunning) return;
  
  const elapsed = (Date.now() - phaseStartTime) / 1000;
  let phaseDuration = 0;
  
  // Determinar duración de la fase actual
  switch(currentPhase) {
    case 'inhale':
      phaseDuration = inhaleTime;
      break;
    case 'hold':
      phaseDuration = holdTime;
      break;
    case 'exhale':
      phaseDuration = exhaleTime;
      break;
  }
  
  // Actualizar tamaño del círculo según la fase
  if (currentPhase === 'inhale') {
    const progress = Math.min(elapsed / inhaleTime, 1);
    updateTargetSize(100 + progress * 200); // De 100 a 300
  } else if (currentPhase === 'exhale') {
    const progress = Math.min(elapsed / exhaleTime, 1);
    updateTargetSize(300 - progress * 200); // De 300 a 100
  }
  
  // Cambiar de fase cuando se complete el tiempo
  if (elapsed >= phaseDuration) {
    nextPhase();
  }
  
  // Actualizar texto de la fase con countdown
  const remaining = Math.ceil(phaseDuration - elapsed);
  updatePhaseText(remaining);
}
// Cambiar a la siguiente fase
function nextPhase() {
  switch(currentPhase) {
    case 'inhale':
      startPhase('hold');
      break;
    case 'hold':
      startPhase('exhale');
      break;
    case 'exhale':
      cycleCount++;
      startPhase('inhale');
      vibrateDevice('light'); // Vibración suave entre ciclos
      break;
  }
}
// Iniciar una fase
function startPhase(phase) {
  currentPhase = phase;
  phaseStartTime = Date.now();
  updatePhase(phase);
  
  // Vibración al cambiar de fase
  if (phase === 'inhale' || phase === 'exhale') {
    vibrateDevice('light');
  }
}
// Actualizar el texto de la fase
function updatePhaseText(remaining) {
  let text = '';
  switch(currentPhase) {
    case 'inhale':
      text = `Inhala (${remaining}s)`;
      break;
    case 'hold':
      text = `Mantén (${remaining}s)`;
      break;
    case 'exhale':
      text = `Exhala (${remaining}s)`;
      break;
  }
  phaseText.textContent = text;
}
// Actualizar configuración de tiempos
function updateTimings() {
  inhaleTime = parseInt(inhaleInput.value) || 4;
  holdTime = parseInt(holdInput.value) || 4;
  exhaleTime = parseInt(exhaleInput.value) || 4;
}
// Vibración del dispositivo (funcionalidad nativa)
async function vibrateDevice(intensity = 'medium') {
  try {
    let style;
    switch(intensity) {
      case 'light':
        style = ImpactStyle.Light;
        break;
      case 'medium':
        style = ImpactStyle.Medium;
        break;
      case 'heavy':
        style = ImpactStyle.Heavy;
        break;
      default:
        style = ImpactStyle.Medium;
    }
    
    await Haptics.impact({ style });
  } catch (error) {
    console.log('Vibración no disponible:', error);
  }
}
// Guardar estadísticas en LocalStorage
function saveStats() {
  localStorage.setItem('respira-stats', JSON.stringify(stats));
}
// Cargar estadísticas desde LocalStorage
function loadStats() {
  const saved = localStorage.getItem('respira-stats');
  if (saved) {
    stats = JSON.parse(saved);
  }
}
// Actualizar display de estadísticas
function updateStatsDisplay() {
  sessionsCountEl.textContent = stats.sessionsCompleted;
  cyclesCountEl.textContent = stats.totalCycles;
  totalTimeEl.textContent = stats.totalMinutes.toFixed(1);
}
// Resetear estadísticas
function resetStats() {
  if (confirm('¿Seguro que quieres resetear todas las estadísticas?')) {
    stats = {
      sessionsCompleted: 0,
      totalCycles: 0,
      totalMinutes: 0
    };
    saveStats();
    updateStatsDisplay();
    vibrateDevice('heavy');
  }
}