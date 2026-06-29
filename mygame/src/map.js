// ===================== MAP INITIALIZATION & RENDERING =====================

// ===== 加载图片 =====
const imgGrass = new Image();
imgGrass.src = 'assets/grass.jpg';

const imgPath = new Image();
imgPath.src = 'assets/path.jpg';

// ===================== 第三步：障碍物血量系统 =====================
const obstacleHP = {};

function getObstacleMaxHP(col, row) {
  const type = getObstacleType(col, row);
  if (type === 0) return 3;
  if (type === 1) return 2;
  return 1;
}

// ========== 判断障碍物类型（根据行列号） ==========
function getObstacleType(col, row) {
  const val = (col * 7 + row * 13) % 3;
  return val; // 0=石头, 1=树木, 2=花丛
}

function initMapState() {
  mapState = [];
  for (let r = 0; r < ROWS; r++) {
    mapState[r] = [];
    for (let c = 0; c < COLS; c++) {
      mapState[r][c] = currentMapGrid[r][c];
    }
  }
  for (const [c,r] of currentObstacles) {
    if (r >= 0 && r < ROWS && c >= 0 && c < COLS && mapState[r][c] === 0) {
      mapState[r][c] = 3;
    }
  }

  for (const [c,r] of currentObstacles) {
    if (r >= 0 && r < ROWS && c >= 0 && c < COLS && currentMapGrid[r][c] === 0) {
      const key = c + ',' + r;
      const maxHP = getObstacleMaxHP(c, r);
      obstacleHP[key] = { current: maxHP, max: maxHP };
    }
  }

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (mapState[r][c] === 0) {
        if (!isAdjacentToPath(c, r)) {
          mapState[r][c] = 5;
        }
      }
    }
  }
}

function isAdjacentToPath(col, row) {
  const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
  for (const [dc,dr] of dirs) {
    const nc = col+dc, nr = row+dr;
    if (nc>=0 && nc<COLS && nr>=0 && nr<ROWS) {
      if (currentMapGrid[nr][nc] === 1 || currentMapGrid[nr][nc] === 2) return true;
    }
  }
  return false;
}

// ===== 修改后的 drawMap() 函数（图片 48×48 直接绘制） =====
function drawMap() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x = c * TILE, y = r * TILE;
      const state = mapState[r][c];

      // ===== 草地（直接绘制 48×48 图片） =====
      if (state === 0 || state === 3 || state === 4 || state === 5) {
        if (imgGrass.complete && imgGrass.naturalWidth > 0) {
          ctx.drawImage(imgGrass, x, y, TILE, TILE);
        } else {
          drawGrass(x, y);
        }
      }

      // ===== 路径（直接绘制 48×48 图片，覆盖在草地上） =====
      if (state === 1 || state === 2) {
        if (imgPath.complete && imgPath.naturalWidth > 0) {
          ctx.drawImage(imgPath, x, y, TILE, TILE);
        } else {
          // 备用方案：Canvas 绘制路径
          ctx.fillStyle = '#d4a76a';
          ctx.fillRect(x, y, TILE, TILE);
          ctx.fillStyle = '#b8905a';
          for (let i = 0; i < 3; i++) {
            const px = x + 8 + ((c*7+r*13+i*17)%32);
            const py = y + 8 + ((c*11+r*7+i*23)%32);
            ctx.beginPath(); ctx.arc(px, py, 2, 0, Math.PI*2); ctx.fill();
          }
        }
      }

      // ===== 障碍物（保持在最上面） =====
      if (state === 3) {
        const type = getObstacleType(c, r);
        drawObstacle(x, y, type, c, r);
      }

      // ===== 装饰 =====
      if (state === 5) {
        if ((c*13+r*7)%11 === 0) drawFlower(x+TILE/2, y+TILE/2, c+r);
        if ((c*7+r*13)%17 === 0) drawBush(x+TILE/2, y+TILE/2);
      }
    }
  }
}

// ===== drawGrass 备用方案 =====
function drawGrass(x, y) {
  ctx.fillStyle = '#5cb338';
  ctx.fillRect(x, y, TILE, TILE);
}

function drawFlower(x, y, seed) {
  const colors = ['#ff6b6b','#ffd93d','#6bcb77','#4d96ff','#ff6eb4'];
  const color = colors[seed % colors.length];
  ctx.fillStyle = color;
  for (let i = 0; i < 5; i++) {
    const a = (i/5)*Math.PI*2;
    ctx.beginPath();
    ctx.arc(x+Math.cos(a)*5, y+Math.sin(a)*5, 3, 0, Math.PI*2);
    ctx.fill();
  }
  ctx.fillStyle = '#ffd700';
  ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI*2); ctx.fill();
}

function drawBush(x, y) {
  ctx.fillStyle = '#3d8b27';
  ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#4da832';
  ctx.beginPath(); ctx.arc(x-4, y-2, 7, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(x+4, y-2, 7, 0, Math.PI*2); ctx.fill();
}

// ========== 障碍物绘制 ==========
// ===== 加载障碍物图片 =====
const imgStone = new Image();
imgStone.src = 'assets/stone.png';   

const imgTree = new Image();
imgTree.src = 'assets/tree.png';    

const imgFlower = new Image();
imgFlower.src = 'assets/flower.png'; 

// ========== 障碍物绘制（使用图片） ==========
function drawObstacle(x, y, type, col, row) {
  const cx = x + TILE / 2;
  const cy = y + TILE / 2;

  // 根据类型选择对应的图片
  let img = null;
  if (type === 0) {
    img = imgStone;   // 石头
  } else if (type === 1) {
    img = imgTree;    // 树木
  } else if (type === 2) {
    img = imgFlower;  // 花丛
  }

  // 如果图片加载成功，绘制图片
  if (img && img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, x, y, TILE, TILE);
  } else {
    // ===== 备用方案：Canvas 绘制（保留原代码） =====
    if (type === 0) {
      // 石头
      ctx.fillStyle = '#8e8e8e';
      ctx.beginPath();
      ctx.moveTo(cx - 16, cy + 12);
      ctx.lineTo(cx - 18, cy - 4);
      ctx.lineTo(cx - 10, cy - 16);
      ctx.lineTo(cx + 4, cy - 18);
      ctx.lineTo(cx + 16, cy - 10);
      ctx.lineTo(cx + 18, cy + 4);
      ctx.lineTo(cx + 12, cy + 14);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#a0a0a0';
      ctx.beginPath();
      ctx.moveTo(cx - 10, cy - 16);
      ctx.lineTo(cx + 4, cy - 18);
      ctx.lineTo(cx + 8, cy - 8);
      ctx.lineTo(cx - 4, cy - 8);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#6e6e6e';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - 5, cy - 5);
      ctx.lineTo(cx + 2, cy + 5);
      ctx.moveTo(cx + 3, cy - 8);
      ctx.lineTo(cx + 8, cy);
      ctx.stroke();
      const sparkle = Math.sin(animTime * 3 + x + y) * 0.5 + 0.5;
      ctx.fillStyle = `rgba(255,215,0,${sparkle * 0.6})`;
      ctx.beginPath();
      ctx.arc(cx + 6, cy - 6, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx - 8, cy + 2, 1.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 1) {
      // 树木
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 14, 12, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#8D6E63';
      ctx.fillRect(cx - 4, cy + 2, 8, 14);
      ctx.fillStyle = '#6D4C41';
      ctx.fillRect(cx - 2, cy + 4, 4, 10);
      ctx.fillStyle = '#2E7D32';
      ctx.beginPath();
      ctx.arc(cx, cy - 6, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#388E3C';
      ctx.beginPath();
      ctx.arc(cx - 10, cy + 2, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + 10, cy + 2, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#4CAF50';
      ctx.beginPath();
      ctx.arc(cx - 6, cy - 12, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + 6, cy - 12, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.beginPath();
      ctx.arc(cx - 6, cy - 12, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 2) {
      // 花丛
      ctx.fillStyle = '#4CAF50';
      ctx.beginPath();
      ctx.arc(cx, cy + 4, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#388E3C';
      ctx.beginPath();
      ctx.arc(cx - 8, cy + 6, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + 8, cy + 6, 10, 0, Math.PI * 2);
      ctx.fill();
      const flowerColors = ['#FF5722', '#FFEB3B', '#E91E63', '#2196F3', '#FF9800'];
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2 + 0.2;
        const fx = cx + Math.cos(angle) * 8;
        const fy = cy - 2 + Math.sin(angle) * 8;
        ctx.fillStyle = flowerColors[i % flowerColors.length];
        for (let j = 0; j < 5; j++) {
          const pa = (j / 5) * Math.PI * 2 + animTime * 0.1;
          ctx.beginPath();
          ctx.arc(fx + Math.cos(pa) * 4, fy + Math.sin(pa) * 4, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#FFC107';
        ctx.beginPath();
        ctx.arc(fx, fy, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      for (let i = 0; i < 3; i++) {
        const px = cx + Math.sin(animTime * 1.2 + i * 2 + x) * 10;
        const py = cy - 10 + Math.cos(animTime * 0.8 + i * 3 + y) * 6;
        ctx.beginPath();
        ctx.arc(px, py, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // ===== 血条（始终保持不变） =====
  const key = col + ',' + row;
  const hpData = obstacleHP[key];
  if (hpData && hpData.current < hpData.max) {
    const barW = 30, barH = 4;
    const barX = cx - barW / 2;
    const barY = cy - 22;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(barX, barY, barW, barH);
    const ratio = hpData.current / hpData.max;
    ctx.fillStyle = ratio > 0.5 ? '#2ecc71' : ratio > 0.25 ? '#f39c12' : '#e74c3c';
    ctx.fillRect(barX, barY, barW * ratio, barH);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);
  }
}

// ===== 萝卜（使用图片） =====
const imgCarrot = new Image();
imgCarrot.src = 'assets/carrot.png';  // 改成你的实际文件名

function drawCarrot() {
  const endWP = currentWaypoints[currentWaypoints.length - 1];
  const cx = endWP.x * TILE + TILE/2;
  const cy = endWP.y * TILE + TILE/2;

  // 绘制萝卜图片
  if (imgCarrot.complete && imgCarrot.naturalWidth > 0) {
    ctx.drawImage(imgCarrot, cx - 24, cy - 24, 48, 48);
  } else {
    // 备用方案：Canvas 绘制萝卜
    ctx.fillStyle = '#ff8c00';
    ctx.beginPath();
    ctx.moveTo(cx, cy + 20);
    ctx.quadraticCurveTo(cx - 14, cy - 5, cx - 10, cy - 15);
    ctx.quadraticCurveTo(cx, cy - 22, cx + 10, cy - 15);
    ctx.quadraticCurveTo(cx + 14, cy - 5, cx, cy + 20);
    ctx.fill();

    ctx.strokeStyle = '#e67e00';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx-6, cy-5); ctx.lineTo(cx+6, cy-5);
    ctx.moveTo(cx-4, cy+2); ctx.lineTo(cx+4, cy+2);
    ctx.moveTo(cx-3, cy+9); ctx.lineTo(cx+3, cy+9);
    ctx.stroke();

    ctx.fillStyle = '#2ecc71';
    ctx.beginPath();
    ctx.ellipse(cx-6, cy-22, 4, 10, -0.3, 0, Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx+6, cy-22, 4, 10, 0.3, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#27ae60';
    ctx.beginPath();
    ctx.ellipse(cx, cy-24, 3, 11, 0, 0, Math.PI*2);
    ctx.fill();

    ctx.fillStyle = '#333';
    ctx.beginPath(); ctx.arc(cx-4, cy-8, 2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx+4, cy-8, 2, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy-3, 4, 0.1*Math.PI, 0.9*Math.PI);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,150,150,0.4)';
    ctx.beginPath(); ctx.ellipse(cx-8, cy-4, 3, 2, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx+8, cy-4, 3, 2, 0, 0, Math.PI*2); ctx.fill();
  }

  // 血条
  const barW = 30, barH = 4;
  const hpRatio = lives / maxLives;
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(cx-barW/2, cy+24, barW, barH);
  ctx.fillStyle = hpRatio > 0.5 ? '#2ecc71' : hpRatio > 0.25 ? '#f39c12' : '#e74c3c';
  ctx.fillRect(cx-barW/2, cy+24, barW*hpRatio, barH);
}