// ===================== GAME LOOP & CONTROL =====================

// ===== 重新计算路径（切换关卡后调用） =====
function recalculatePath() {
  waypointPixels = currentWaypoints.map(w => ({ x: w.x * TILE + TILE/2, y: w.y * TILE + TILE/2 }));
  pathSegments = [];
  totalPathLength = 0;
  for (let i = 0; i < waypointPixels.length - 1; i++) {
    const a = waypointPixels[i], b = waypointPixels[i+1];
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.sqrt(dx*dx + dy*dy);
    pathSegments.push({ ax:a.x, ay:a.y, bx:b.x, by:b.y, len, startDist: totalPathLength });
    totalPathLength += len;
  }
}

function init() {
  showMainMenu();
  canvas = document.getElementById('game-canvas');
  canvas.width = W;
  canvas.height = H;
  ctx = canvas.getContext('2d');

  recalculatePath();

  initMapState();

  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('click', onCanvasClick);
  canvas.addEventListener('contextmenu', e => { e.preventDefault(); deselectAll(); });
  document.addEventListener('keydown', e => {
    if(e.key==='Escape') {
      if (gameState === 'playing' || gameState === 'between_waves') {
        togglePause();
      } else {
        deselectAll();
      }
    }
  });

  updateUI();
  requestAnimationFrame(gameLoop);
}

function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;
  animTime += dt;

  if (gameState === 'playing' && !isPaused) {
    update(dt);
  } else if (gameState === 'between_waves' && !isPaused) {
    updateBetweenWaves(dt);
  }
  render();
  requestAnimationFrame(gameLoop);
}

function update(dt) {
  if (spawnQueue.length > 0) {
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnMonster(spawnQueue.shift());
      spawnTimer = spawnInterval;
    }
  }

  updateMonsters(dt);
  updateTowers(dt);
  updateProjectiles(dt);
  updateParticles(dt);

  if (gameState === 'playing' && spawnQueue.length === 0 && monsters.length === 0) {
    if (currentWave >= totalWaves) {
      gameState = 'victory';
      showOverlay('victory');
    } else {
      gameState = 'between_waves';
      betweenWavesTimer = BETWEEN_WAVES_DELAY;
      document.getElementById('start-btn').classList.add('hidden');
      updateUI();
    }
  }

  updateUI();
}

function updateBetweenWaves(dt) {
  betweenWavesTimer -= dt;
  updateCountdownDisplay();

  if (betweenWavesTimer <= 0) {
    startNextWave();
  }
}

function updateCountdownDisplay() {
  const el = document.getElementById('countdown-display');
  if (gameState === 'between_waves' && betweenWavesTimer > 0) {
    const seconds = Math.ceil(betweenWavesTimer);
    el.textContent = seconds;
    el.classList.add('show');
  } else {
    el.classList.remove('show');
  }
}

function render() {
  ctx.clearRect(0, 0, W, H);
  drawMap();
  drawTowers();
  drawMonsters();
  drawProjectiles();
  drawParticles();
  drawCarrot();
  drawHoverPreview();
  drawRangeCircle();
}

function startWave() {
  if (gameState !== 'between_waves') return;
  startNextWave();
}

function startNextWave() {
  currentWave++;
  if (currentWave > totalWaves) return;

  document.getElementById('start-btn').classList.add('hidden');
  hideTowerInfo();
  document.getElementById('countdown-display').classList.remove('show');

  const waves = currentLevel === 1 ? LEVEL1_WAVES : LEVEL2_WAVES;
  const waveDef = waves[currentWave - 1];
  spawnQueue = [];
  for (const group of waveDef) {
    for (let i = 0; i < group.count; i++) {
      spawnQueue.push(group.type);
    }
  }
  for (let i = spawnQueue.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [spawnQueue[i], spawnQueue[j]] = [spawnQueue[j], spawnQueue[i]];
  }
  spawnTimer = 0.3;
  spawnInterval = Math.max(0.35, 0.9 - currentWave * 0.03);
  gameState = 'playing';

  announceWave(currentWave);
  updateUI();
}

function startGame(diff, level) {
  difficulty = diff || 'normal';
  currentLevel = level || 1;
  const config = DIFFICULTY_CONFIG[difficulty];

  recalculatePath();

  const waves = currentLevel === 1 ? LEVEL1_WAVES : LEVEL2_WAVES;
  totalWaves = waves.length;

  gold = config.gold;
  lives = config.lives;
  maxLives = config.lives;
  currentWave = 0;
  towers = []; monsters = []; projectiles = []; particles = [];
  spawnQueue = []; spawnTimer = 0;
  selectedTowerType = null; selectedPlacedTower = null;
  carrotHP = lives;
  betweenWavesTimer = BETWEEN_WAVES_DELAY;
  isPaused = false;
  initMapState();
  gameState = 'between_waves';

  document.getElementById('start-btn').classList.add('hidden');
  document.getElementById('pause-btn').classList.remove('paused');
  document.getElementById('pause-btn').innerHTML = '⏸️ 暂停';
  document.getElementById('pause-overlay').classList.add('hidden');

  updateUI();
  updateCountdownDisplay();
}

function startGameFromMainMenu(diff) {
  startGame(diff, 1);
}

function restartGame() {
  hideOverlay();
  startGame(difficulty, currentLevel);
}

// ===================== PAUSE FUNCTIONALITY =====================
function togglePause() {
  if (gameState === 'playing' || gameState === 'between_waves') {
    isPaused = !isPaused;
    const pauseBtn = document.getElementById('pause-btn');
    const pauseOverlay = document.getElementById('pause-overlay');

    if (isPaused) {
      pauseBtn.classList.add('paused');
      pauseBtn.innerHTML = '▶️ 继续';
      pauseOverlay.classList.remove('hidden');
    } else {
      pauseBtn.classList.remove('paused');
      pauseBtn.innerHTML = '⏸️ 暂停';
      pauseOverlay.classList.add('hidden');
    }
  }
}

// ===================== EXIT FUNCTIONALITY =====================
function confirmExit() {
  if (isPaused) {
    isPaused = false;
    document.getElementById('pause-btn').classList.remove('paused');
    document.getElementById('pause-btn').innerHTML = '⏸️ 暂停';
    document.getElementById('pause-overlay').classList.add('hidden');
  }

  const overlay = document.getElementById('overlay');
  const content = document.getElementById('overlay-content');
  overlay.classList.remove('hidden');
  content.innerHTML = `
    <h1>🚪 退出游戏</h1>
    <h2>确定要退出吗？</h2>
    <p>当前进度将不会保存</p>
    <div style="margin-top:20px;">
      <button onclick="hideOverlay()" style="margin-right:10px;">取消</button>
      <button class="danger" onclick="exitToMenu()" style="background:linear-gradient(135deg,#e74c3c,#c0392b);color:#fff;">确认退出</button>
    </div>
  `;
}

function exitToMenu() {
  hideOverlay();
  isPaused = false;
  document.getElementById('pause-btn').classList.remove('paused');
  document.getElementById('pause-btn').innerHTML = '⏸️ 暂停';
  document.getElementById('pause-overlay').classList.add('hidden');
  document.getElementById('countdown-display').classList.remove('show');
  document.getElementById('start-btn').classList.add('hidden');

  gold = 200; lives = 10; maxLives = 10; currentWave = 0; totalWaves = 0;
  towers = []; monsters = []; projectiles = []; particles = [];
  spawnQueue = []; spawnTimer = 0;
  selectedTowerType = null; selectedPlacedTower = null;
  betweenWavesTimer = 0;

  gameState = 'menu';
  showMainMenu();
  updateUI();
}

// ===================== 暴露函数到全局 =====================
window.init = init;
window.startWave = startWave;
window.startGame = startGame;
window.startGameFromMainMenu = startGameFromMainMenu;
window.restartGame = restartGame;
window.togglePause = togglePause;
window.confirmExit = confirmExit;
window.exitToMenu = exitToMenu;
window.recalculatePath = recalculatePath;
window.showMainMenu = showMainMenu;
window.hideMainMenu = hideMainMenu;
window.hideOverlay = hideOverlay;
window.announceWave = announceWave;
window.updateUI = updateUI;

window.addEventListener('load', init);