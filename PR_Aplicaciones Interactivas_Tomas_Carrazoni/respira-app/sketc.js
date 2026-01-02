// sketch.js - Visualización generativa con p5.js

let circleSize = 100; // Tamaño inicial del círculo
let targetSize = 100; // Tamaño objetivo
let currentPhase = 'idle'; // Fase actual: idle, inhale, hold, exhale
let particles = []; // Array de partículas decorativas

// Configuración del sketch
export function setup(p) {
  // Crear canvas del tamaño de la ventana
  const canvas = p.createCanvas(p.windowWidth, p.windowHeight * 0.6);
  canvas.parent('canvas-container');
  
  // Inicializar partículas
  for (let i = 0; i < 50; i++) {
    particles.push(new Particle(p));
  }
}

// Loop de dibujo
export function draw(p) {
  // Fondo con gradiente suave
  p.background(102, 126, 234, 20);
  
  // Animar partículas de fondo
  particles.forEach(particle => {
    particle.update(p);
    particle.display(p);
  });
  
  // Suavizar el cambio de tamaño del círculo
  circleSize = p.lerp(circleSize, targetSize, 0.05);
  
  // Dibujar círculo principal
  p.push();
  p.translate(p.width / 2, p.height / 2);
  
  // Efecto de brillo
  for (let i = 3; i > 0; i--) {
    p.noFill();
    p.stroke(255, 255, 255, 30 / i);
    p.strokeWeight(5 * i);
    p.circle(0, 0, circleSize + i * 10);
  }
  
  // Círculo principal con color según fase
  let fillColor;
  switch(currentPhase) {
    case 'inhale':
      fillColor = p.color(100, 200, 255, 150); // Azul claro
      break;
    case 'hold':
      fillColor = p.color(150, 100, 255, 150); // Morado
      break;
    case 'exhale':
      fillColor = p.color(255, 150, 100, 150); // Naranja
      break;
    default:
      fillColor = p.color(200, 200, 200, 100); // Gris
  }
  
  p.fill(fillColor);
  p.noStroke();
  p.circle(0, 0, circleSize);
  
  p.pop();
}

// Ajustar canvas al redimensionar ventana
export function windowResized(p) {
  p.resizeCanvas(p.windowWidth, p.windowHeight * 0.6);
}

// Función para actualizar la fase de respiración
export function updatePhase(phase) {
  currentPhase = phase;
}

// Función para actualizar el tamaño objetivo del círculo
export function updateTargetSize(size) {
  targetSize = size;
}

// Clase para partículas decorativas
class Particle {
  constructor(p) {
    this.x = p.random(p.width);
    this.y = p.random(p.height);
    this.size = p.random(2, 8);
    this.speedX = p.random(-0.5, 0.5);
    this.speedY = p.random(-0.5, 0.5);
    this.opacity = p.random(50, 150);
  }
  
  update(p) {
    this.x += this.speedX;
    this.y += this.speedY;
    
    // Rebotar en los bordes
    if (this.x < 0 || this.x > p.width) this.speedX *= -1;
    if (this.y < 0 || this.y > p.height) this.speedY *= -1;
  }
  
  display(p) {
    p.noStroke();
    p.fill(255, 255, 255, this.opacity);
    p.circle(this.x, this.y, this.size);
  }
}