const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const W = canvas.width;
const H = canvas.height;

const GRAVITY = 0.35;
const JUMP = -7;
const PIPE_W = 52;
const PIPE_GAP = 155;
const PIPE_SPEED = 2.2;
const PIPE_INTERVAL = 100;
const BIRD_X = 80;
const POP = 30;

const SPEEDS = [1, 2, 4, 8, 20];
let speedIdx = 0;
let speedMult = 1;

let aiEnabled = false;
let isPaused = true;
let isOver = false;
let score = 0;
let best = 0;
let generation = 1;
let frameCount = 0;
let pipes = [];
let birds = [];
let animId = null;
let genLog = [];

class Brain {
  constructor(weights) {
    this.w1 = weights.slice(0, 25);
    this.b1 = weights.slice(25, 30);
    this.w2 = weights.slice(30, 35);
    this.b2 = weights[35];
  }

  static random() {
    const w = [];
    for (let i = 0; i < 36; i++) w.push(Math.random() * 2 - 1);
    return new Brain(w);
  }

  mutate(rate) {
    const all = [...this.w1, ...this.b1, ...this.w2, this.b2];
    return new Brain(all.map(v => Math.random() < rate ? v + (Math.random() * 2 - 1) * 0.6 : v));
  }

  clone() {
    return new Brain([...this.w1, ...this.b1, ...this.w2, this.b2]);
  }

  predict(inputs) {
    const hidden = [];
    for (let h = 0; h < 5; h++) {
      let sum = this.b1[h];
      for (let i = 0; i < 5; i++) sum += inputs[i] * this.w1[h * 5 + i];
      hidden.push(Math.tanh(sum));
    }
    let out = this.b2;
    for (let h = 0; h < 5; h++) out += hidden[h] * this.w2[h];
    return 1 / (1 + Math.exp(-out));
  }
}

class Bird {
  constructor(brain) {
    this.x = BIRD_X;
    this.y = H / 2;
    this.vy = 0;
    this.alive = true;
    this.fitness = 0;
    this.score = 0; // трубы пройдены
    this.brain = brain || Brain.random();
  }

  flap() { this.vy = JUMP; }

  update() {
    this.vy += GRAVITY;
    this.y += this.vy;
    this.fitness++;
  }

  think(pipes) {
    const pipe = pipes.find(p => p.x + PIPE_W > this.x);
    // Нет трубы — виртуальная цель по центру экрана
    const target = pipe || { x: W + 50, top: H / 2 - PIPE_GAP / 2 };
    const gapCenter = target.top + PIPE_GAP / 2;
    const inputs = [
      this.y / H,
      this.vy / 15,
      gapCenter / H,
      Math.min((target.x - this.x) / W, 1),
      (this.y - gapCenter) / H,
    ];
    if (this.brain.predict(inputs) > 0.5) this.flap();
  }

  hits(pipe) {
    const r = 11;
    if (this.x + r > pipe.x && this.x - r < pipe.x + PIPE_W) {
      if (this.y - r < pipe.top || this.y + r > pipe.top + PIPE_GAP) return true;
    }
    return false;
  }

  draw(isAI) {
    if (!this.alive) return;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 14, 0, Math.PI * 2);
    ctx.fillStyle = isAI ? '#f0c040' : '#a0c878';
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(this.x + 4, this.y - 3, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(this.x + 5, this.y - 3, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#222';
    ctx.fill();
  }
}

class Pipe {
  constructor() {
    const minTop = 50;
    const maxTop = H - PIPE_GAP - 50;
    this.top = Math.floor(Math.random() * (maxTop - minTop) + minTop);
    this.x = W;
    this.passed = false;
  }
  update() { this.x -= PIPE_SPEED; }
  draw() {
    ctx.fillStyle = '#4a9a4a';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.fillRect(this.x, 0, PIPE_W, this.top);
    ctx.strokeRect(this.x, 0, PIPE_W, this.top);
    ctx.fillRect(this.x, this.top + PIPE_GAP, PIPE_W, H - this.top - PIPE_GAP);
    ctx.strokeRect(this.x, this.top + PIPE_GAP, PIPE_W, H - this.top - PIPE_GAP);
    ctx.fillStyle = '#3a8a3a';
    ctx.fillRect(this.x - 3, this.top - 18, PIPE_W + 6, 18);
    ctx.strokeRect(this.x - 3, this.top - 18, PIPE_W + 6, 18);
    ctx.fillRect(this.x - 3, this.top + PIPE_GAP, PIPE_W + 6, 18);
    ctx.strokeRect(this.x - 3, this.top + PIPE_GAP, PIPE_W + 6, 18);
  }
}

let bestBrain = null;
let bestFitness = 0;

function nextGeneration() {
  const sorted = [...birds].sort((a, b) => b.fitness - a.fitness);
  const top = sorted[0];
  const avgFit = Math.round(sorted.reduce((s, b) => s + b.fitness, 0) / sorted.length);
  const survived = sorted.filter(b => b.fitness > 50).length; // дожили до первой трубы

  if (top.fitness > bestFitness) {
    bestFitness = top.fitness;
    bestBrain = top.brain.clone();
  }

  const prev = genLog[genLog.length - 1];
  let trend = '—';
  if (prev) {
    const diff = top.fitness - prev.best;
    if (diff > prev.best * 0.5) trend = '↑↑';
    else if (diff > 10)         trend = '↑';
    else if (diff < -10)        trend = '↓';
    else                        trend = '≈';
  }

  genLog.push({ gen: generation, best: top.fitness, avg: avgFit, score: top.score, survived, trend });
  if (genLog.length > 8) genLog.shift();

  generation++;
  document.getElementById('gen').textContent = generation;

  const newBirds = [];
  // Элита без мутаций
  newBirds.push(new Bird(bestBrain.clone()));

  const top6 = sorted.slice(0, 6).map(b => b.brain);
  while (newBirds.length < POP) {
    const parent = top6[Math.floor(Math.random() * top6.length)];
    const rate = newBirds.length <= 6 ? 0.05 : 0.25;
    newBirds.push(new Bird(parent.mutate(rate)));
  }

  birds = newBirds;
}

function cycleSpeed() {
  speedIdx = (speedIdx + 1) % SPEEDS.length;
  speedMult = SPEEDS[speedIdx];
  document.getElementById('speedBtn').textContent = speedMult + 'x';
}

let playerBird = null;

function restart() {
  pipes = [];
  frameCount = 0;
  score = 0;
  isOver = false;
  genLog = [];
  document.getElementById('score').textContent = 0;

  if (aiEnabled) {
    generation = 1;
    bestBrain = null;
    bestFitness = 0;
    birds = Array.from({ length: POP }, () => new Bird());
    document.getElementById('gen').textContent = 1;
    document.getElementById('alive').textContent = POP;
    isPaused = false;
    document.getElementById('pauseBtn').textContent = '⏸';
    pipes.push(new Pipe()); // первая труба сразу
  } else {
    playerBird = new Bird(null);
    playerBird.brain = null;
    isPaused = true;
    isOver = false;
    document.getElementById('alive').textContent = 1;
    document.getElementById('pauseBtn').textContent = '▶';
  }

  if (animId) cancelAnimationFrame(animId);
  loop();
}

function toggleAI() {
  aiEnabled = !aiEnabled;
  const btn = document.getElementById('aiBtn');
  btn.textContent = aiEnabled ? '⏹' : '🤖';
  btn.style.outline = aiEnabled ? '2px solid #f0c040' : 'none';
  restart();
}

function togglePause() {
  if (isOver) return;
  isPaused = !isPaused;
  document.getElementById('pauseBtn').textContent = isPaused ? '▶' : '⏸';
  if (!isPaused) loop();
}

function loop() {
  if (isPaused || isOver) { draw(); return; }
  for (let i = 0; i < speedMult; i++) {
    update();
    if (isOver) break;
  }
  draw();
  animId = requestAnimationFrame(loop);
}

function update() {
  frameCount++;

  // 1. Двигаем трубы
  if (frameCount % PIPE_INTERVAL === 0) pipes.push(new Pipe());
  pipes.forEach(p => p.update());

  // 2. Считаем счёт до фильтрации труб — независимо от состояния птиц
  for (const p of pipes) {
    if (!p.passed && p.x + PIPE_W < BIRD_X) {
      p.passed = true;
      score++;
      document.getElementById('score').textContent = score;
      if (score > best) {
        best = score;
        document.getElementById('best').textContent = best;
      }
      // Большой бонус к фитнесу за прохождение трубы
      if (aiEnabled) {
        for (const b of birds) {
          if (b.alive) {
            b.fitness += 1000;
            b.score++;
          }
        }
      }
    }
  }

  pipes = pipes.filter(p => p.x + PIPE_W > 0);

  if (aiEnabled) {
    // 3. Обновляем птиц
    let alive = 0;
    for (const b of birds) {
      if (!b.alive) continue;
      b.think(pipes);
      b.update();
      if (b.y < 0 || b.y > H) { b.alive = false; continue; }
      for (const p of pipes) {
        if (b.hits(p)) { b.alive = false; break; }
      }
      if (b.alive) alive++;
    }

    document.getElementById('alive').textContent = alive;

    if (alive === 0) {
      nextGeneration();
      pipes = [new Pipe()]; // сразу первая труба
      frameCount = 0;
      score = 0;
      document.getElementById('score').textContent = 0;
    }

  } else {
    if (!playerBird || !playerBird.alive) return;
    playerBird.update();
    if (playerBird.y < 0 || playerBird.y > H) { endGame(); return; }
    for (const p of pipes) {
      if (playerBird.hits(p)) { endGame(); return; }
    }
  }
}

function endGame() {
  isOver = true;
  if (animId) cancelAnimationFrame(animId);
  draw();
}

function drawBg() {
  ctx.fillStyle = '#87ceeb';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#5ba85b';
  ctx.fillRect(0, H - 30, W, 30);
  ctx.fillStyle = '#4a9a4a';
  ctx.fillRect(0, H - 30, W, 4);
}

function drawLog() {
  if (!aiEnabled) return;

  const lh = 14;
  const padX = 7;
  const padY = 6;
  const boxW = W - 10;
  const bx = 5;
  const by = H - 30 - padY * 2 - 13 - genLog.length * lh - 22 - 5;

  // Живая строка текущего поколения
  const aliveNow = birds.filter(b => b.alive).length;
  const bestNow  = birds.reduce((m, b) => b.fitness > m ? b.fitness : m, 0);
  const liveH = 20;
  const liveY = H - 30 - liveH - 3;
  ctx.fillStyle = 'rgba(20,60,20,0.85)';
  ctx.fillRect(bx, liveY, boxW, liveH);
  ctx.strokeStyle = '#4a4';
  ctx.lineWidth = 1;
  ctx.strokeRect(bx, liveY, boxW, liveH);
  ctx.fillStyle = '#aaffaa';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(
    `▶ Поколение #${generation}   живых: ${aliveNow}/${POP}   лучший: ${bestNow} кадров   счёт: ${score}`,
    bx + padX, liveY + 13
  );

  if (genLog.length === 0) return;

  const boxH = padY * 2 + 13 + genLog.length * lh;
  const logY = liveY - boxH - 3;

  ctx.fillStyle = 'rgba(0,0,0,0.72)';
  ctx.fillRect(bx, logY, boxW, boxH);
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 1;
  ctx.strokeRect(bx, logY, boxW, boxH);

  // Заголовок
  ctx.fillStyle = '#ffdd88';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('ПОК    ЛУЧШИЙ   СРЕДНИЙ  ВЫЖИЛИ  ТРУБЫ  ТРЕНД', bx + padX, logY + padY + 10);

  // Разделитель
  ctx.fillStyle = '#444';
  ctx.fillRect(bx + 4, logY + padY + 14, boxW - 8, 1);

  genLog.forEach((e, i) => {
    const y = logY + padY + 14 + (i + 1) * lh;
    const hasPipe = e.score > 0;

    // Цвет строки
    if (hasPipe)           ctx.fillStyle = '#77ff77';
    else if (e.trend === '↑↑') ctx.fillStyle = '#ffe066';
    else if (e.trend === '↑')  ctx.fillStyle = '#cccccc';
    else                       ctx.fillStyle = '#888888';

    ctx.font = '10px monospace';
    ctx.textAlign = 'left';

    const gen  = ('#' + e.gen).padEnd(6);
    const best = String(e.best).padEnd(9);
    const avg  = String(e.avg).padEnd(9);
    const surv = (e.survived + '/' + POP).padEnd(8);
    const sc   = hasPipe ? ('✓' + e.score).padEnd(7) : '—'.padEnd(7);
    const tr   = e.trend;

    ctx.fillText(`${gen} ${best} ${avg} ${surv} ${sc} ${tr}`, bx + padX, y);
  });
}

function draw() {
  drawBg();
  pipes.forEach(p => p.draw());

  if (aiEnabled) {
    birds.filter(b => !b.alive).forEach(b => {
      ctx.globalAlpha = 0.1;
      b.draw(true);
      ctx.globalAlpha = 1;
    });
    birds.filter(b => b.alive).forEach(b => b.draw(true));
  } else {
    if (playerBird) playerBird.draw(false);
  }

  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(0, H - 30, W, 30);

  drawLog(); // поверх земли

  if (isOver && !aiEnabled) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 36px cursive';
    ctx.textAlign = 'center';
    ctx.fillText('ИГРА ОКОНЧЕНА', W / 2, H / 2 - 20);
    ctx.font = '20px cursive';
    ctx.fillText('Нажми 🔄 для рестарта', W / 2, H / 2 + 20);
  }

  if (isPaused && !isOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    if (score === 0) {
      ctx.font = 'bold 28px cursive';
      ctx.fillText('Нажми ПРОБЕЛ', W / 2, H / 2 - 15);
      ctx.font = '20px cursive';
      ctx.fillText('для старта', W / 2, H / 2 + 20);
    } else {
      ctx.font = 'bold 40px cursive';
      ctx.fillText('ПАУЗА', W / 2, H / 2);
    }
  }
}

document.addEventListener('keydown', e => {
  if (aiEnabled) return;
  if (e.code === 'Space' || e.key === 'ArrowUp') {
    e.preventDefault();
    if (isOver) return;
    if (isPaused) {
      isPaused = false;
      document.getElementById('pauseBtn').textContent = '⏸';
      loop();
    }
    if (playerBird && playerBird.alive) playerBird.flap();
  }
});

canvas.addEventListener('click', () => {
  if (aiEnabled || isOver) return;
  if (isPaused) {
    isPaused = false;
    document.getElementById('pauseBtn').textContent = '⏸';
    loop();
  }
  if (playerBird && playerBird.alive) playerBird.flap();
});

best = 0;
playerBird = new Bird(null);
playerBird.brain = null;
pipes = [];
frameCount = 0;
score = 0;
isOver = false;
isPaused = true;
document.getElementById('alive').textContent = 1;
document.getElementById('gen').textContent = 1;
draw();
