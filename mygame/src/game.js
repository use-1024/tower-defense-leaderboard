// ===================== GAME LOOP & CONTROL =====================

// ===== 新增：重新计算路径（切换关卡后调用） =====
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

  // ===== 使用函数计算路径 =====
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

  // 检查当前波次是否全部消灭
  if (gameState === 'playing' && spawnQueue.length === 0 && monsters.length === 0) {
    if (currentWave >= totalWaves) {
      // 所有波次完成，胜利
      gameState = 'victory';
      showOverlay('victory');
    } else {
      // 进入波次间隔，开始倒计时
      gameState = 'between_waves';
      betweenWavesTimer = BETWEEN_WAVES_DELAY;
      document.getElementById('start-btn').classList.add('hidden');
      updateUI();
    }
  }

  updateUI();
}

function updateBetweenWaves(dt) {
  // 更新倒计时
  betweenWavesTimer -= dt;
  updateCountdownDisplay();

  if (betweenWavesTimer <= 0) {
    // 倒计时结束，自动开始下一波
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

// ===== 第五步：修改 startNextWave，使用动态波次 =====
function startNextWave() {
  currentWave++;
  if (currentWave > totalWaves) return;

  document.getElementById('start-btn').classList.add('hidden');
  hideTowerInfo();
  document.getElementById('countdown-display').classList.remove('show');

  // 根据当前关卡选择波次
  const waves = currentLevel === 1 ? LEVEL1_WAVES : LEVEL2_WAVES;
  const waveDef = waves[currentWave - 1];
  spawnQueue = [];
  for (const group of waveDef) {
    for (let i = 0; i < group.count; i++) {
      spawnQueue.push(group.type);
    }
  }
  // 随机打乱生成顺序
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

// ===== 第五步：修改 startGame，接收关卡参数，并重新计算路径 =====
function startGame(diff, level) {
  difficulty = diff || 'normal';
  currentLevel = level || 1;
  const config = DIFFICULTY_CONFIG[difficulty];

  // ===== 关键：重新计算路径，确保使用当前关卡的路径 =====
  recalculatePath();

  // 根据关卡加载对应的波次
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

  // 隐藏手动开始按钮，所有波次都通过倒计时自动开始
  document.getElementById('start-btn').classList.add('hidden');
  document.getElementById('pause-btn').classList.remove('paused');
  document.getElementById('pause-btn').innerHTML = '⏸️ 暂停';
  document.getElementById('pause-overlay').classList.add('hidden');

  updateUI();
  updateCountdownDisplay();
}

// 保留旧函数名以兼容
function startGameFromMainMenu(diff) {
  startGame(diff, 1);
}

// ===== 第五步：修改 restartGame =====
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
  // 关闭暂停界面（如果打开）
  if (isPaused) {
    isPaused = false;
    document.getElementById('pause-btn').classList.remove('paused');
    document.getElementById('pause-btn').innerHTML = '⏸️ 暂停';
    document.getElementById('pause-overlay').classList.add('hidden');
  }

  // 显示退出确认
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

  // 重置游戏状态
  gold = 200; lives = 10; maxLives = 10; currentWave = 0; totalWaves = 0;
  towers = []; monsters = []; projectiles = []; particles = [];
  spawnQueue = []; spawnTimer = 0;
  selectedTowerType = null; selectedPlacedTower = null;
  betweenWavesTimer = 0;

  gameState = 'menu';
  showMainMenu();
  updateUI();
}
window.addEventListener('load', init);