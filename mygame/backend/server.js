// backend/server.js
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(__dirname, 'data.json');

// ========== 初始化数据文件 ==========
function initDataFile() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ scores: [] }, null, 2));
  }
}
initDataFile();

// ========== 读写数据 ==========
function readData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch {
    return { scores: [] };
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ============================================================
//  API 路由
// ============================================================

app.post('/api/score', (req, res) => {
  const { player, level, wave, gold, lives, difficulty } = req.body;

  if (!player || player.trim() === '') {
    return res.status(400).json({ error: '请输入玩家名称' });
  }
  if (!level || !wave) {
    return res.status(400).json({ error: '数据不完整' });
  }

  const normalizedPlayer = player.trim().toLowerCase();
  const displayPlayer = player.trim().substring(0, 10);

  const data = readData();

  const existingIndex = data.scores.findIndex(s => 
    s.player.toLowerCase() === normalizedPlayer && s.level === level
  );

  console.log(`[提交] 玩家: ${displayPlayer}, 关卡: ${level}, 波次: ${wave}, 金币: ${gold}`);

  const newScore = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
    player: displayPlayer,
    level: level,
    wave: wave,
    gold: gold || 0,
    lives: lives || 0,
    difficulty: difficulty || 'normal',
    time: new Date().toLocaleString()
  };

  let message = '';
  let isNewRecord = false;
  let rank = -1;

  if (existingIndex !== -1) {
    const existing = data.scores[existingIndex];
    const isBetter = (wave > existing.wave) || (wave === existing.wave && gold > existing.gold);

    if (isBetter) {
      data.scores[existingIndex] = newScore;
      message = '🎉 刷新了你的最佳成绩！';
      isNewRecord = true;
    } else {
      return res.json({
        success: false,
        message: `你已提交过更好的成绩（第${existing.wave}波，💰${existing.gold}金币），本次不记录`,
        isDuplicate: true
      });
    }
  } else {
    data.scores.push(newScore);
    message = '🏆 成绩已提交！';
    isNewRecord = true;
  }

  data.scores.sort((a, b) => {
    if (b.wave !== a.wave) return b.wave - a.wave;
    return b.gold - a.gold;
  });

  if (data.scores.length > 100) {
    data.scores = data.scores.slice(0, 100);
  }

  writeData(data);

  const levelScores = data.scores.filter(s => s.level === level);
  rank = levelScores.findIndex(s => s.id === newScore.id) + 1;

  res.json({
    success: true,
    message: message,
    isNewRecord: isNewRecord,
    rank: rank
  });
});

// ----- 获取排行榜 -----
app.get('/api/leaderboard', (req, res) => {
  const level = parseInt(req.query.level) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const data = readData();
  let scores = data.scores
    .filter(s => s.level === level)
    .sort((a, b) => {
      if (b.wave !== a.wave) return b.wave - a.wave;
      return b.gold - a.gold;
    })
    .slice(0, limit);

  res.json({ level, scores });
});

// ----- 调试接口 -----
app.get('/api/all', (req, res) => {
  res.json(readData());
});

// ============================================================
//  🆕 托管前端静态文件
// ============================================================

// ============================================================
//  🆕 托管前端静态文件
// ============================================================

// ✅ server.js 在 /app/backend/ 下，index.html 在 /app/ 下
// __dirname = /app/backend
// path.join(__dirname, '..') = /app
const frontendPath = path.join(__dirname, '..');

console.log('📁 前端文件路径:', frontendPath);
console.log('📄 index.html 是否存在:', fs.existsSync(path.join(frontendPath, 'index.html')));

// 如果 index.html 不存在，尝试其他路径
let finalPath = frontendPath;
if (!fs.existsSync(path.join(finalPath, 'index.html'))) {
  // 尝试 /app
  finalPath = '/app';
}
if (!fs.existsSync(path.join(finalPath, 'index.html'))) {
  // 尝试当前目录
  finalPath = __dirname;
}

console.log('📁 最终前端文件路径:', finalPath);

// ✅ 确保 API 路由优先
// 注意：API 路由已经在上方定义了（/api/score, /api/leaderboard, /api/all）

// 托管静态文件（CSS、JS、图片等）
app.use(express.static(finalPath));

// ✅ 所有非 API 请求返回 index.html（放在最后，作为兜底）
app.get('*', (req, res) => {
  // 如果是 API 请求，跳过（由上面的 API 路由处理）
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API 未找到' });
  }
  const indexPath = path.join(finalPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send(`index.html not found at ${indexPath}`);
  }
});