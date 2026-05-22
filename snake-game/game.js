const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const CELL = 20;
const COLS = canvas.width / CELL;
const ROWS = canvas.height / CELL;

let snake, dir, nextDir, food, score, best, isPaused, isOver, timer;
let aiEnabled = false;

function restart() {
  const cx = Math.floor(COLS / 2);
  const cy = Math.floor(ROWS / 2);
  snake = [{ x: cx, y: cy }, { x: cx - 1, y: cy }, { x: cx - 2, y: cy }];
  dir = { x: 1, y: 0 };
  nextDir = { x: 1, y: 0 };
  score = 0;
  isPaused = !aiEnabled;
  isOver = false;

  document.getElementById('score').textContent = 0;
  document.getElementById('pauseBtn').textContent = aiEnabled ? '⏸' : '▶';

  placeFood();
  clearInterval(timer);
  timer = setInterval(tick, aiEnabled ? 80 : 130);
  draw();
}

function placeFood() {
  let pos;
  do {
    pos = {
      x: Math.floor(Math.random() * COLS),
      y: Math.floor(Math.random() * ROWS)
    };
  } while (snake.some(s => s.x === pos.x && s.y === pos.y));
  food = pos;
}

function tick() {
  if (isPaused || isOver) return;
  if (aiEnabled) aiStep();

  dir = nextDir;

  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

  if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
    gameOver(); return;
  }
  if (snake.some(s => s.x === head.x && s.y === head.y)) {
    gameOver(); return;
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score += 10;
    if (score > best) {
      best = score;
      document.getElementById('best').textContent = best;
    }
    document.getElementById('score').textContent = score;
    placeFood();
  } else {
    snake.pop();
  }

  draw();
}

function bfs(start, target, walls) {
  const queue = [[start]];
  const visited = new Set([`${start.x},${start.y}`]);

  while (queue.length) {
    const path = queue.shift();
    const curr = path[path.length - 1];

    if (curr.x === target.x && curr.y === target.y) return path;

    const neighbors = [
      { x: curr.x + 1, y: curr.y },
      { x: curr.x - 1, y: curr.y },
      { x: curr.x, y: curr.y + 1 },
      { x: curr.x, y: curr.y - 1 },
    ];

    for (const n of neighbors) {
      const key = `${n.x},${n.y}`;
      if (n.x < 0 || n.x >= COLS || n.y < 0 || n.y >= ROWS) continue;
      if (walls.has(key) || visited.has(key)) continue;
      visited.add(key);
      queue.push([...path, n]);
    }
  }
  return null;
}

function countReachable(start, walls) {
  const queue = [start];
  const visited = new Set([`${start.x},${start.y}`]);

  while (queue.length) {
    const curr = queue.shift();
    for (const n of [
      { x: curr.x + 1, y: curr.y }, { x: curr.x - 1, y: curr.y },
      { x: curr.x, y: curr.y + 1 }, { x: curr.x, y: curr.y - 1 },
    ]) {
      const key = `${n.x},${n.y}`;
      if (n.x < 0 || n.x >= COLS || n.y < 0 || n.y >= ROWS) continue;
      if (walls.has(key) || visited.has(key)) continue;
      visited.add(key);
      queue.push(n);
    }
  }
  return visited.size;
}

function aiStep() {
  const head = snake[0];
  const walls = new Set(snake.slice(0, -1).map(s => `${s.x},${s.y}`));

  const path = bfs(head, food, walls);

  if (path && path.length > 1) {
    const next = path[1];
    nextDir = { x: next.x - head.x, y: next.y - head.y };
  } else {
    const dirs = [
      { x: 1, y: 0 }, { x: -1, y: 0 },
      { x: 0, y: 1 }, { x: 0, y: -1 },
    ];

    let bestDir = null;
    let bestSpace = -1;

    for (const d of dirs) {
      const nx = head.x + d.x;
      const ny = head.y + d.y;
      if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) continue;
      if (walls.has(`${nx},${ny}`)) continue;
      const space = countReachable({ x: nx, y: ny }, walls);
      if (space > bestSpace) {
        bestSpace = space;
        bestDir = d;
      }
    }

    if (bestDir) nextDir = bestDir;
  }
}

function draw() {
  ctx.fillStyle = '#333333';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let x = 0; x < COLS; x++) {
    for (let y = 0; y < ROWS; y++) {
      ctx.strokeStyle = '#2a2a2a';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x * CELL, y * CELL, CELL, CELL);
    }
  }

  snake.forEach((s, i) => {
    ctx.fillStyle = i === 0 ? (aiEnabled ? '#78c8e0' : '#a0c878') : (aiEnabled ? '#4a9ab8' : '#6d9c3e');
    ctx.fillRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2);
  });

  ctx.fillStyle = '#ee4b2b';
  ctx.beginPath();
  ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL / 2 - 2, 0, Math.PI * 2);
  ctx.fill();

  if (isOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 36px cursive';
    ctx.textAlign = 'center';
    ctx.fillText('ИГРА ОКОНЧЕНА', canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = '20px cursive';
    ctx.fillText('Нажми 🔄 для рестарта', canvas.width / 2, canvas.height / 2 + 20);
  }

  if (isPaused && !isOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    if (score === 0) {
      ctx.font = 'bold 30px cursive';
      ctx.fillText('Нажми стрелку', canvas.width / 2, canvas.height / 2 - 15);
      ctx.font = '20px cursive';
      ctx.fillText('для старта', canvas.width / 2, canvas.height / 2 + 20);
    } else {
      ctx.font = 'bold 40px cursive';
      ctx.fillText('ПАУЗА', canvas.width / 2, canvas.height / 2);
    }
  }
}

function gameOver() {
  isOver = true;
  clearInterval(timer);
  draw();
}

function togglePause() {
  if (isOver) return;
  isPaused = !isPaused;
  document.getElementById('pauseBtn').textContent = isPaused ? '▶' : '⏸';
  draw();
}

function toggleAI() {
  aiEnabled = !aiEnabled;
  const btn = document.getElementById('aiBtn');
  btn.textContent = aiEnabled ? '⏹' : '🤖';
  btn.style.outline = aiEnabled ? '2px solid #78c8e0' : 'none';
  restart();
}

document.addEventListener('keydown', e => {
  if (aiEnabled) return;
  const arrows = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
  if (!arrows.includes(e.key)) return;
  e.preventDefault();
  if (isPaused && !isOver) {
    isPaused = false;
    document.getElementById('pauseBtn').textContent = '⏸';
  }
  if (e.key === 'ArrowUp'    && dir.y !== 1)  nextDir = { x: 0, y: -1 };
  if (e.key === 'ArrowDown'  && dir.y !== -1) nextDir = { x: 0, y: 1 };
  if (e.key === 'ArrowLeft'  && dir.x !== 1)  nextDir = { x: -1, y: 0 };
  if (e.key === 'ArrowRight' && dir.x !== -1) nextDir = { x: 1, y: 0 };
});

best = 0;
restart();
