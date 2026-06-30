// ===================== INPUT HANDLING =====================
function onMouseMove(e) {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;
  hoverCol = Math.floor(mouseX / TILE);
  hoverRow = Math.floor(mouseY / TILE);
}

function onCanvasClick(e) {
  const rect = canvas.getBoundingClientRect();
  const cx = e.clientX - rect.left;
  const cy = e.clientY - rect.top;
  const col = Math.floor(cx / TILE);
  const row = Math.floor(cy / TILE);

  if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return;

  const state = mapState[row][col];

  if (state === 4) {
    const tower = towers.find(t => t.col === col && t.row === row);
    if (tower) {
      selectedPlacedTower = tower;
      selectedTowerType = null;
      clearTowerBtnSelection();
      showTowerInfoPanel(tower);
      return;
    }
  }

  if (selectedTowerType && state === 0) {
    const def = TOWER_DEFS[selectedTowerType];
    if (gold >= def.cost) {
      gold -= def.cost;
      const tower = {
        type: selectedTowerType, col, row,
        x: col * TILE + TILE/2, y: row * TILE + TILE/2,
        damage: def.damage, range: def.range, fireRate: def.fireRate,
        cooldown: 0, level: 1, projColor: def.projColor,
        projSpeed: def.projSpeed, color: def.color,
        slowFactor: def.slowFactor || 0,
        slowDuration: def.slowDuration || 0,
        splash: def.splash || 0,
        shootAnim: 0, totalCost: def.cost
      };
      towers.push(tower);
      mapState[row][col] = 4;
      addParticles(tower.x, tower.y, '#ffd700', 8);
      updateUI();
    }
    return;
  }

  if (state === 3) {
    const key = col + ',' + row;
    const hpData = obstacleHP[key];

    if (hpData) {
      hpData.current--;

      addParticles(col * TILE + TILE/2, row * TILE + TILE/2, '#ffd700', 5);

      if (hpData.current <= 0) {
        const reward = 20 + Math.floor(Math.random() * 20);
        gold += reward;
        mapState[row][col] = 0;
        if (!isAdjacentToPath(col, row)) {
          mapState[row][col] = 5;
        }
        delete obstacleHP[key];
        addParticles(col * TILE + TILE/2, row * TILE + TILE/2, '#ffd700', 15);
        addFloatingText(col * TILE + TILE/2, row * TILE + TILE/2 - 20, '+' + reward + '💰', '#ffd700');
        updateUI();
      } else {
        addFloatingText(col * TILE + TILE/2, row * TILE + TILE/2 - 30, '💥', '#ff6b6b');
      }
      return;
    }
  }

  deselectAll();
}

function selectTower(type) {
  if (gameState !== 'playing' && gameState !== 'between_waves') return;
  hideTowerInfo();
  if (selectedTowerType === type) {
    selectedTowerType = null;
    clearTowerBtnSelection();
  } else {
    selectedTowerType = type;
    selectedPlacedTower = null;
    clearTowerBtnSelection();
    document.querySelector(`.tower-btn[data-type="${type}"]`).classList.add('selected');
  }
}

function deselectAll() {
  selectedTowerType = null;
  selectedPlacedTower = null;
  clearTowerBtnSelection();
  hideTowerInfo();
}

function clearTowerBtnSelection() {
  document.querySelectorAll('.tower-btn').forEach(b => b.classList.remove('selected'));
}

// ===================== 暴露函数到全局 =====================
window.onMouseMove = onMouseMove;
window.onCanvasClick = onCanvasClick;
window.selectTower = selectTower;
window.deselectAll = deselectAll;
window.clearTowerBtnSelection = clearTowerBtnSelection;