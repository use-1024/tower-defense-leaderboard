// ===================== UI =====================
function updateUI() {
  document.getElementById('wave-num').textContent = currentWave + '/' + totalWaves;
  document.getElementById('gold-num').textContent = gold;
  document.getElementById('lives-num').textContent = lives;
  document.getElementById('monster-num').textContent = monsters.length + spawnQueue.length;

  for (const type of ['bottle','ice','rocket']) {
    const btn = document.querySelector(`.tower-btn[data-type="${type}"]`);
    btn.classList.toggle('disabled', gold < TOWER_DEFS[type].cost);
  }
}

// ===================== 获取API地址 =====================
function getApiUrl() {
  const hostname = window.location.hostname;
  
  // 本地开发环境
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '') {
    return 'http://localhost:3000';
  }
  
  // ===== 生产环境（Railway） =====
  // ⚠️ 部署到 Railway 后，替换成你的实际地址！
  // 格式：https://你的项目名.up.railway.app
  return 'https://你的项目名.up.railway.app';
}

// ===================== 提交成绩 =====================
function submitScoreAndShowRanking() {
  const input = document.getElementById('player-name-input');
  const playerName = input ? input.value.trim() : '';

  if (!playerName || playerName === '') {
    alert('请输入你的名字！');
    return;
  }

  // 🔥 获取提交按钮
  const submitBtn = document.getElementById('submit-score-btn');
  
  // 🔥 如果按钮已禁用，直接返回（防止重复点击）
  if (submitBtn && submitBtn.disabled) {
    console.log('⛔ 已经提交过了，请勿重复点击');
    return;
  }

  // 🔥 立即禁用按钮
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ 提交中...';
    submitBtn.style.opacity = '0.5';
    submitBtn.style.cursor = 'not-allowed';
  }

  const scoreData = {
    player: playerName,
    level: currentLevel || 1,
    wave: currentWave || 0,
    gold: gold || 0,
    lives: lives || 0,
    difficulty: difficulty || 'normal'
  };

  const API_URL = getApiUrl();

  fetch(`${API_URL}/api/score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(scoreData)
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        // ✅ 提交成功
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = '✅ 已提交';
          submitBtn.style.background = 'linear-gradient(135deg,#27ae60,#2ecc71)';
          submitBtn.style.opacity = '0.7';
          submitBtn.style.cursor = 'default';
        }
        alert(`✅ ${data.message}\n排名：第 ${data.rank} 名`);
        showRankingOnly(data.rank);
      } else {
        // ❌ 后端返回错误
        alert(`ℹ️ ${data.message}`);
        // 🔥 如果是"已提交过更好的成绩"，也禁用按钮（因为已经提交过了）
        if (data.message && data.message.includes('已提交过更好的成绩')) {
          if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = '✅ 已提交';
            submitBtn.style.background = 'linear-gradient(135deg,#27ae60,#2ecc71)';
            submitBtn.style.opacity = '0.7';
            submitBtn.style.cursor = 'default';
          }
        } else {
          // 其他错误，恢复按钮
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = '🏆 提交成绩';
            submitBtn.style.opacity = '1';
            submitBtn.style.cursor = 'pointer';
          }
        }
      }
    })
    .catch(err => {
      // 🌐 网络错误
      alert(`❌ 无法连接到服务器！\n\n请确保后端已启动：\nhttp://localhost:3000\n\n错误：${err.message}`);
      // 网络错误时恢复按钮（让用户稍后重试）
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = '🏆 提交成绩';
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
      }
    });
}

// ===================== 查看排行榜 =====================
function showRankingOnly(myRank) {
  const container = document.getElementById('ranking-result');
  if (!container) return;

  const level = currentLevel || 1;
  const API_URL = getApiUrl();

  container.innerHTML = `<p style="color:#aaa;">⏳ 加载排行榜中...</p>`;

  fetch(`${API_URL}/api/leaderboard?level=${level}&limit=10`)
    .then(res => {
      if (!res.ok) throw new Error('网络请求失败');
      return res.json();
    })
    .then(data => {
      if (!data.scores || data.scores.length === 0) {
        container.innerHTML = `<p style="color:#aaa;">暂无排行榜数据，快来挑战吧！</p>`;
        return;
      }

      let html = `
        <div style="background:rgba(0,0,0,0.4); border-radius:12px; padding:12px 16px; margin-top:8px;">
          <p style="color:#ffd700; font-weight:bold; font-size:14px; margin-bottom:8px;">🏆 第 ${data.level} 关 排行榜 Top ${data.scores.length}</p>
          <table style="width:100%; color:#fff; font-size:13px; border-collapse:collapse;">
            <tr style="color:#aaa; font-size:11px; border-bottom:1px solid rgba(255,255,255,0.1);">
              <th style="text-align:center;padding:4px;">#</th>
              <th style="text-align:left;padding:4px;">玩家</th>
              <th style="text-align:center;padding:4px;">波次</th>
              <th style="text-align:center;padding:4px;">金币</th>
              <th style="text-align:center;padding:4px;">生命</th>
            </tr>
      `;

      data.scores.forEach((s, idx) => {
        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx+1}`;
        const isMe = myRank && myRank === idx + 1;
        html += `
          <tr style="${isMe ? 'background:rgba(255,215,0,0.15); border-radius:8px;' : ''}">
            <td style="text-align:center;padding:4px;font-weight:bold;">${medal}</td>
            <td style="text-align:left;padding:4px;${isMe ? 'color:#ffd700;' : ''}">${s.player} ${isMe ? '⭐' : ''}</td>
            <td style="text-align:center;padding:4px;">${s.wave}</td>
            <td style="text-align:center;padding:4px;">💰${s.gold}</td>
            <td style="text-align:center;padding:4px;">❤️${s.lives}</td>
          </tr>
        `;
      });

      html += `</table></div>`;
      container.innerHTML = html;
    })
    .catch(err => {
      container.innerHTML = `<p style="color:#e74c3c;">⚠️ 无法加载排行榜: ${err.message}</p>`;
    });
}

// ===================== 显示覆盖层 =====================
function showOverlay(type) {
  const overlay = document.getElementById('overlay');
  const content = document.getElementById('overlay-content');
  overlay.classList.remove('hidden');

  if (type === 'gameover') {
    content.innerHTML = `
      <h1>💔 游戏结束 💔</h1>
      <h2>萝卜被吃掉了...</h2>
      <p>你坚持到了第 ${currentWave} 波</p>
      <button onclick="restartGame()">重新开始</button>
    `;
  } else if (type === 'victory') {
    content.innerHTML = `
      <h1>🎉 胜利 🎉</h1>
      <h2>萝卜安全了！</h2>
      <p>恭喜你成功抵御了 ${totalWaves} 波怪物！</p>
      <p>剩余生命: ${lives} | 剩余金币: ${gold}</p>
      <div style="margin: 16px 0;">
        <input id="player-name-input" type="text" placeholder="输入你的名字" maxlength="10" 
               style="padding:10px 16px; border-radius:12px; border:2px solid #ffd700; 
                      background:rgba(255,255,255,0.1); color:#fff; font-size:16px; 
                      text-align:center; width:200px;">
      </div>
      <div style="display:flex; gap:12px; justify-content:center; flex-wrap:wrap;">
        <button id="submit-score-btn" onclick="submitScoreAndShowRanking()" 
                style="background:linear-gradient(135deg,#2ecc71,#27ae60); color:#fff; padding:10px 20px; border:none; border-radius:12px; font-weight:bold; cursor:pointer;">
          🏆 提交成绩
        </button>
        <button onclick="showRankingOnly()" 
                style="background:linear-gradient(135deg,#3498db,#2980b9); color:#fff; padding:10px 20px; border:none; border-radius:12px; font-weight:bold; cursor:pointer;">
          📊 查看排行榜
        </button>
        <button onclick="restartGame()" 
                style="background:linear-gradient(135deg,#ffd700,#f39c12); color:#1a1145; padding:10px 20px; border:none; border-radius:12px; font-weight:bold; cursor:pointer;">
          🔄 再来一局
        </button>
      </div>
      <div id="ranking-result" style="margin-top:16px;"></div>
    `;
  }
}

function hideOverlay() {
  document.getElementById('overlay').classList.add('hidden');
}

// ===================== 塔信息面板 =====================
function showTowerInfoPanel(tower) {
  const panel = document.getElementById('tower-info');
  const def = TOWER_DEFS[tower.type];
  document.getElementById('ti-name').textContent = def.icon + ' ' + def.name + ' Lv.' + tower.level;

  let stats = `伤害: ${tower.damage} | 射程: ${tower.range}<br>`;
  stats += `攻速: ${tower.fireRate.toFixed(1)}/s`;
  if (tower.slowFactor > 0) stats += ` | 减速: ${Math.round((1-tower.slowFactor)*100)}%`;
  if (tower.splash > 0) stats += ` | 溅射: ${tower.splash}px`;
  document.getElementById('ti-stats').innerHTML = stats;

  const upgradeBtn = document.getElementById('ti-upgrade');
  if (tower.level >= 3) {
    upgradeBtn.textContent = '已满级';
    upgradeBtn.classList.add('disabled');
  } else {
    const upgCost = Math.round(def.upgradeCost * tower.level);
    upgradeBtn.textContent = `升级 💰${upgCost}`;
    upgradeBtn.classList.toggle('disabled', gold < upgCost);
  }

  const panelW = 170;
  let px = (tower.col + 1) * TILE + 8;
  let py = tower.row * TILE + 10;
  if (px + panelW > W) px = tower.col * TILE - panelW - 8;
  if (py + 130 > H + 56) py = Math.max(10, (tower.row * TILE) - 60);
  panel.style.left = px + 'px';
  panel.style.top = (py + 56) + 'px';
  panel.style.display = 'block';
}

function hideTowerInfo() {
  document.getElementById('tower-info').style.display = 'none';
  selectedPlacedTower = null;
}

function upgradeTower() {
  if (!selectedPlacedTower || selectedPlacedTower.level >= 3) return;
  const t = selectedPlacedTower;
  const def = TOWER_DEFS[t.type];
  const cost = Math.round(def.upgradeCost * t.level);
  if (gold < cost) return;

  gold -= cost;
  t.level++;
  t.totalCost += cost;
  t.damage = Math.round(def.damage * (1 + (t.level-1)*0.5));
  t.range = Math.round(def.range * (1 + (t.level-1)*0.12));
  t.fireRate = def.fireRate * (1 + (t.level-1)*0.2);
  if (t.splash > 0) t.splash = Math.round(def.splash * (1 + (t.level-1)*0.15));

  addParticles(t.x, t.y, '#ffd700', 12);
  addFloatingText(t.x, t.y - 25, '⬆ Lv.' + t.level, '#ffd700');
  showTowerInfoPanel(t);
  updateUI();
}

function sellTower() {
  if (!selectedPlacedTower) return;
  const t = selectedPlacedTower;
  const refund = Math.floor(t.totalCost * 0.6);
  gold += refund;
  mapState[t.row][t.col] = 0;
  if (!isAdjacentToPath(t.col, t.row)) mapState[t.row][t.col] = 5;
  towers = towers.filter(tw => tw !== t);
  addParticles(t.x, t.y, '#ffd700', 10);
  addFloatingText(t.x, t.y - 20, '+'+refund+'💰', '#ffd700');
  hideTowerInfo();
  updateUI();
}

function announceWave(num) {
  const el = document.getElementById('wave-text');
  el.textContent = '🌊 第 ' + num + ' 波 🌊';
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 1500);
}

function drawHoverPreview() {
  if (!selectedTowerType || hoverCol < 0 || hoverRow < 0) return;
  if (hoverCol >= COLS || hoverRow >= ROWS) return;

  const state = mapState[hoverRow][hoverCol];
  const x = hoverCol * TILE, y = hoverRow * TILE;
  const def = TOWER_DEFS[selectedTowerType];

  if (state === 0 && gold >= def.cost) {
    ctx.fillStyle = 'rgba(46,204,113,0.3)';
    ctx.fillRect(x, y, TILE, TILE);
    ctx.strokeStyle = 'rgba(46,204,113,0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x+1, y+1, TILE-2, TILE-2);

    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(x+TILE/2, y+TILE/2, def.range, 0, Math.PI*2);
    ctx.stroke();
    ctx.setLineDash([]);
  } else if (state === 0) {
    ctx.fillStyle = 'rgba(231,76,60,0.3)';
    ctx.fillRect(x, y, TILE, TILE);
  } else if (state === 3) {
    ctx.fillStyle = 'rgba(255,215,0,0.3)';
    ctx.fillRect(x, y, TILE, TILE);
    ctx.strokeStyle = 'rgba(255,215,0,0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x+1, y+1, TILE-2, TILE-2);
  }
}

function drawRangeCircle() {
  if (!selectedPlacedTower) return;
  const t = selectedPlacedTower;
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.arc(t.x, t.y, t.range, 0, Math.PI*2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = '#ffd700';
  ctx.lineWidth = 2;
  ctx.strokeRect(t.col*TILE+1, t.row*TILE+1, TILE-2, TILE-2);
}