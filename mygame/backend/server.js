// backend/server.js
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS配置 - 允许前端域名访问
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
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
//  📥 请求日志中间件
// ============================================================
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path}`);
  console.log('📦 Body:', req.body);
  next();
});

// ============================================================
//  API 路由
// ============================================================

// ----- 健康检查 -----
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ----- 获取所有数据（调试用） -----
app.get('/api/all', (req, res) => {
  console.log('✅ /api/all 被调用');
  res.json(readData());
});

// ----- 获取排行榜 -----
app.get('/api/leaderboard', (req, res) => {
  console.log('✅ /api/leaderboard 被调用');
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

// ----- 提交成绩 -----
app.post('/api/score', (req, res) => {
  console.log('✅ /api/score 被调用');
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

// ============================================================
//  启动服务器
// ============================================================
app.listen(PORT, () => {
  console.log(`后端服务已启动`);
  console.log(`端口: ${PORT}`);
  console.log(`数据文件: ${DATA_FILE}`);
  console.log(`CORS 允许: ${process.env.FRONTEND_URL || '*'}`);
});