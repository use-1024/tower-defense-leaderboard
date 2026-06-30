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
//  🆕 托管前端静态文件（自动检测路径）
// ============================================================

// ============================================================
//  🆕 托管前端静态文件
// ============================================================

// ✅ 在 Railway 上，文件被解压到 /app，所有内容在 /app/mygame/ 下
const frontendPath = '/app/mygame';

// 如果本地开发，使用相对路径
if (process.env.NODE_ENV !== 'production' || !fs.existsSync(frontendPath)) {
  // 本地开发时，尝试相对路径
  const localPath = path.join(__dirname, '..', 'mygame');
  if (fs.existsSync(path.join(localPath, 'index.html'))) {
    frontendPath = localPath;
  }
}

console.log('📁 前端文件路径:', frontendPath);
console.log('📄 index.html 是否存在:', fs.existsSync(path.join(frontendPath, 'index.html')));

app.use(express.static(frontendPath));

// 根路径处理
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// 所有非 API 请求返回 index.html
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});