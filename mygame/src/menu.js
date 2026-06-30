// ===================== MAIN MENU =====================
let selectedDifficulty = null;
let selectedLevel = 1;

const DIFFICULTY_CONFIG = {
  easy:   { name: '简单', gold: 350, lives: 15, hpMult: 0.7, speedMult: 0.85},
  normal: { name: '普通', gold: 250, lives: 10, hpMult: 1.0, speedMult: 1.0},
  hard:   { name: '困难', gold: 180, lives: 5,  hpMult: 1.4, speedMult: 1.15}
};

function showMainMenu() {
  const menu = document.getElementById('main-menu-overlay');
  if (menu) {
    menu.classList.remove('hidden');
  } else {
    document.getElementById('menu-overlay').classList.remove('hidden');
  }
  document.getElementById('menu-start-btn').classList.add('disabled');
  selectedDifficulty = null;
  clearDifficultySelection();
  selectedLevel = 1;
  document.querySelectorAll('.level-btn').forEach(b => {
    b.classList.remove('selected');
    b.style.boxShadow = 'none';
  });
  const defaultBtn = document.getElementById('level-1');
  if (defaultBtn) {
    defaultBtn.classList.add('selected');
    defaultBtn.style.boxShadow = '0 0 20px rgba(255,215,0,0.6)';
  }
}

function hideMainMenu() {
  const menu = document.getElementById('main-menu-overlay');
  if (menu) {
    menu.classList.add('hidden');
  } else {
    document.getElementById('menu-overlay').classList.add('hidden');
  }
}

function selectDifficulty(diff) {
  selectedDifficulty = diff;
  const config = DIFFICULTY_CONFIG[diff];

  document.querySelectorAll('.diff-btn').forEach(b => {
    b.classList.remove('selected');
    b.style.boxShadow = 'none';
  });
  const btn = document.getElementById('diff-' + diff);
  if (btn) {
    btn.classList.add('selected');
    btn.style.boxShadow = '0 0 20px rgba(255,215,0,0.6)';
  }

  document.getElementById('diff-desc').textContent = config.desc;
  checkReadyToStart();
}

function selectLevel(level) {
  selectedLevel = level;
  document.querySelectorAll('.level-btn').forEach(b => {
    b.classList.remove('selected');
    b.style.boxShadow = 'none';
  });
  const btn = document.getElementById('level-' + level);
  if (btn) {
    btn.classList.add('selected');
    btn.style.boxShadow = '0 0 20px rgba(255,215,0,0.6)';
  }
  checkReadyToStart();
}

function clearDifficultySelection() {
  document.querySelectorAll('.diff-btn').forEach(b => {
    b.classList.remove('selected');
    b.style.boxShadow = 'none';
  });
  const descEl = document.getElementById('diff-desc');
  if (descEl) descEl.textContent = '请先选择难度';
}

function checkReadyToStart() {
  const startBtn = document.getElementById('menu-start-btn');
  if (selectedDifficulty && selectedLevel) {
    startBtn.classList.remove('disabled');
  } else {
    startBtn.classList.add('disabled');
  }
}

function startGameFromMenu() {
  if (!selectedDifficulty || !selectedLevel) return;
  hideMainMenu();
  if (typeof setLevel === 'function') {
    setLevel(selectedLevel);
  }
  startGame(selectedDifficulty, selectedLevel);
}

function exitGame() {
  window.close();
}

// ===================== 游戏规则控制 =====================
function showRules() {
  const overlay = document.getElementById('rules-overlay');
  if (overlay) {
    overlay.classList.add('show');
  }
}

function hideRules() {
  const overlay = document.getElementById('rules-overlay');
  if (overlay) {
    overlay.classList.remove('show');
  }
}

// ===================== 暴露函数到全局 =====================
window.selectDifficulty = selectDifficulty;
window.selectLevel = selectLevel;
window.startGameFromMenu = startGameFromMenu;
window.exitGame = exitGame;
window.showMainMenu = showMainMenu;
window.hideMainMenu = hideMainMenu;
window.checkReadyToStart = checkReadyToStart;
window.clearDifficultySelection = clearDifficultySelection;
window.showRules = showRules;
window.hideRules = hideRules;