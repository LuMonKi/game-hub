const SIZE = 4;
let grid = [];
let score = 0;
let best = 0;
let isOver = false;

let aiEnabled = false;
let aiTimer = null;
let moveCount = 0;
let gameNum = 0;
let gameLog = []; // {game, score, maxTile, moves, trend}

const SPEEDS = [1, 2, 4, 8, 20];
const INTERVALS = [350, 175, 87, 43, 17]; // мс на ход
let speedIdx = 0;

window.onload = function () {
  restart();
  document.addEventListener('keydown', onKey);
};

// ─── Рестарт ──────────────────────────────────────────────────────────────────
function restart() {
  grid = Array(SIZE).fill(null).map(() => Array(SIZE).fill(0));
  score = 0;
  moveCount = 0;
  isOver = false;
  addTile();
  addTile();
  render();
  document.getElementById('score').textContent = 0;
  document.getElementById('msg').textContent = '';
  updateLiveLine();

  if (aiEnabled) {
    clearInterval(aiTimer);
    aiTimer = setInterval(aiStep, INTERVALS[speedIdx]);
  }
}

// ─── Плитки ───────────────────────────────────────────────────────────────────
function addTile() {
  const empty = [];
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (grid[r][c] === 0) empty.push([r, c]);
  if (!empty.length) return;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  grid[r][c] = Math.random() < 0.9 ? 2 : 4;
}

// ─── Логика хода (мутирует глобал) ────────────────────────────────────────────
function slideRow(row) {
  let tiles = row.filter(v => v !== 0);
  for (let i = 0; i < tiles.length - 1; i++) {
    if (tiles[i] === tiles[i + 1]) {
      tiles[i] *= 2;
      score += tiles[i];
      tiles.splice(i + 1, 1);
    }
  }
  while (tiles.length < SIZE) tiles.push(0);
  return tiles;
}

function transpose(g) {
  return g[0].map((_, c) => g.map(row => row[c]));
}

function move(dir) {
  if (isOver) return false;
  const prev = JSON.stringify(grid);

  if (dir === 'left')  grid = grid.map(row => slideRow(row));
  if (dir === 'right') grid = grid.map(row => slideRow([...row].reverse()).reverse());
  if (dir === 'up')    { grid = transpose(grid); grid = grid.map(row => slideRow(row)); grid = transpose(grid); }
  if (dir === 'down')  { grid = transpose(grid); grid = grid.map(row => slideRow([...row].reverse()).reverse()); grid = transpose(grid); }

  if (JSON.stringify(grid) === prev) return false;

  moveCount++;
  addTile();

  if (score > best) {
    best = score;
    document.getElementById('best').textContent = best;
  }
  document.getElementById('score').textContent = score;

  render();
  checkEnd();
  updateLiveLine();
  return true;
}

function checkEnd() {
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (grid[r][c] === 2048) {
        document.getElementById('msg').textContent = '🏆 ПОБЕДА!';
        endGame();
        return;
      }

  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] === 0) return;
      if (r < SIZE - 1 && grid[r][c] === grid[r + 1][c]) return;
      if (c < SIZE - 1 && grid[r][c] === grid[r][c + 1]) return;
    }

  document.getElementById('msg').textContent = 'ИГРА ОКОНЧЕНА';
  endGame();
}

function endGame() {
  isOver = true;
  if (aiEnabled) {
    logGame();
    setTimeout(restart, 600);
  }
}

function onKey(e) {
  if (aiEnabled) return;
  const map = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
  if (map[e.key]) { e.preventDefault(); move(map[e.key]); }
}

// ─── AI: чистая функция хода ──────────────────────────────────────────────────
function slideRowPure(row) {
  let tiles = row.filter(v => v !== 0);
  let gained = 0;
  for (let i = 0; i < tiles.length - 1; i++) {
    if (tiles[i] === tiles[i + 1]) {
      tiles[i] *= 2;
      gained += tiles[i];
      tiles.splice(i + 1, 1);
    }
  }
  while (tiles.length < SIZE) tiles.push(0);
  return { row: tiles, gained };
}

function applyMove(g, dir) {
  let ng = g.map(r => [...r]);
  let total = 0;

  const transposeG = gg => gg[0].map((_, c) => gg.map(r => r[c]));

  function slideAll(grid) {
    return grid.map(row => {
      const res = slideRowPure(row);
      total += res.gained;
      return res.row;
    });
  }

  if (dir === 'left')  { ng = slideAll(ng); }
  if (dir === 'right') { ng = slideAll(ng.map(r => [...r].reverse())).map(r => r.reverse()); }
  if (dir === 'up')    { ng = transposeG(slideAll(transposeG(ng))); }
  if (dir === 'down')  { ng = transposeG(slideAll(transposeG(ng).map(r => [...r].reverse())).map(r => r.reverse())); }

  return { grid: ng, gained: total };
}

// ─── AI: оценка позиции ───────────────────────────────────────────────────────
function evaluate(g) {
  let empty = 0;
  let maxVal = 0;
  let maxR = 0, maxC = 0;

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (g[r][c] === 0) empty++;
      if (g[r][c] > maxVal) { maxVal = g[r][c]; maxR = r; maxC = c; }
    }
  }

  // Бонус за угол
  const inCorner = (maxR === 0 || maxR === SIZE - 1) && (maxC === 0 || maxC === SIZE - 1);
  const cornerBonus = inCorner ? maxVal * 2 : 0;

  // Монотонность (строки убывают слева направо)
  let mono = 0;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE - 1; c++) {
      if (g[r][c] >= g[r][c + 1]) mono += g[r][c];
    }
  }

  // Смежность одинаковых
  let merge = 0;
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) {
      if (c < SIZE - 1 && g[r][c] === g[r][c + 1] && g[r][c] !== 0) merge += g[r][c];
      if (r < SIZE - 1 && g[r][c] === g[r + 1][c] && g[r][c] !== 0) merge += g[r][c];
    }

  return empty * 200 + cornerBonus + mono * 0.5 + merge * 2;
}

function getBestMove() {
  const dirs = ['left', 'right', 'up', 'down'];
  let bestDir = null;
  let bestScore = -Infinity;

  for (const dir of dirs) {
    const { grid: ng, gained } = applyMove(grid, dir);
    if (JSON.stringify(ng) === JSON.stringify(grid)) continue;
    const val = evaluate(ng) + gained;
    if (val > bestScore) { bestScore = val; bestDir = dir; }
  }

  return bestDir;
}

function aiStep() {
  if (!aiEnabled || isOver) return;
  const dir = getBestMove();
  if (dir) move(dir);
}

// ─── AI: вкл/выкл ─────────────────────────────────────────────────────────────
function toggleAI() {
  aiEnabled = !aiEnabled;
  const btn = document.getElementById('aiBtn');
  btn.textContent = aiEnabled ? '⏹' : '🤖';
  btn.style.outline = aiEnabled ? '2px solid #f0c040' : 'none';

  if (aiEnabled) {
    gameLog = [];
    gameNum = 0;
    renderLog();
    clearInterval(aiTimer);
    aiTimer = setInterval(aiStep, INTERVALS[speedIdx]);
  } else {
    clearInterval(aiTimer);
    aiTimer = null;
    document.getElementById('log-live').textContent = '';
  }
}

// ─── Скорость ─────────────────────────────────────────────────────────────────
function cycleSpeed() {
  speedIdx = (speedIdx + 1) % SPEEDS.length;
  document.getElementById('speedBtn').textContent = SPEEDS[speedIdx] + 'x';
  if (aiEnabled) {
    clearInterval(aiTimer);
    aiTimer = setInterval(aiStep, INTERVALS[speedIdx]);
  }
}

// ─── Лог игр ──────────────────────────────────────────────────────────────────
function getMaxTile() {
  let m = 0;
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (grid[r][c] > m) m = grid[r][c];
  return m;
}

function logGame() {
  gameNum++;
  const maxTile = getMaxTile();
  const prev = gameLog[gameLog.length - 1];
  let trend = '—';
  if (prev) {
    const diff = score - prev.score;
    if (diff > prev.score * 0.5) trend = '↑↑';
    else if (diff > 100)         trend = '↑';
    else if (diff < -100)        trend = '↓';
    else                         trend = '≈';
  }
  gameLog.push({ game: gameNum, score, maxTile, moves: moveCount, trend });
  if (gameLog.length > 7) gameLog.shift();
  renderLog();
}

function renderLog() {
  const container = document.getElementById('log-rows');
  container.innerHTML = '';
  gameLog.forEach((e, i) => {
    const isLast = i === gameLog.length - 1;
    const div = document.createElement('div');
    div.className = 'log-row';
    if (e.maxTile >= 1024) div.classList.add('has-pipe');
    else if (e.trend === '↑↑') div.classList.add('big-jump');
    if (isLast) div.classList.add('last-row');

    const gm   = ('#' + e.game).padEnd(4);
    const sc   = String(e.score).padEnd(9);
    const tile = String(e.maxTile).padEnd(8);
    const mv   = String(e.moves).padEnd(7);
    div.textContent = `${gm} ${sc} ${tile} ${mv} ${e.trend}`;
    container.appendChild(div);
  });
}

function updateLiveLine() {
  if (!aiEnabled) return;
  const maxTile = getMaxTile();
  const live = document.getElementById('log-live');
  live.textContent = `▶ Игра #${gameNum + 1}   счёт: ${score}   плитка: ${maxTile}   ходов: ${moveCount}`;
}

// ─── Рендер доски ─────────────────────────────────────────────────────────────
function render() {
  const board = document.getElementById('board');
  board.innerHTML = '';
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      const val = grid[r][c];
      if (val) {
        cell.textContent = val;
        cell.dataset.val = val;
      }
      board.appendChild(cell);
    }
  }
}
