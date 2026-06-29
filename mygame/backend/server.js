// backend/server.js
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 数据文件路径（保存在 backend 目录下）
const DATA_FILE = path.join(__dirname, 'data.json');

// ========== 初始化数据文件 ==========
function initDataFile() {
  if (!fs.existsSync(DATA_FILE)) {
    const initialData = {
      scores: []
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
  }
}
initDataFile();

// ========== 读取数据 ==========
function readData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return { scores: [] };
  }
}

// ========== 写入数据 ==========
function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// ============================================================
//  API 路由
// ============================================================

// ----- 1. 提交成绩 -----
// POST /api/score
// Body: { player, level, wave, gold, lives, difficulty }
app.post('/api/score', (req, res) => {
  const { player, level, wave, gold, lives, difficulty } = req.body;

  // 简单校验
  if (!player || player.trim() === '') {
    return res.status(400).json({ error: '请输入玩家名称' });
  }
  if (!level || !wave) {
    return res.status(400).json({ error: '数据不完整' });
  }

  const data = readData();

  const newScore = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
    player: player.trim().substring(0, 10), // 最多10个字符
    level: level,
    wave: wave,
    gold: gold || 0,
    lives: lives || 0,
    difficulty: difficulty || 'normal',
    time: new Date().toLocaleString()
  };

  data.scores.push(newScore);

  // 按 波次 > 金币 排序（波次越高越厉害，波次相同金币越多越厉害）
  data.scores.sort((a, b) => {
    if (b.wave !== a.wave) return b.wave - a.wave;
    return b.gold - a.gold;
  });

  // 只保留前 100 条记录
  if (data.scores.length > 100) {
    data.scores = data.scores.slice(0, 100);
  }

  writeData(data);

  res.json({ success: true, message: '成绩已提交！', rank: data.scores.findIndex(s => s.id === newScore.id) + 1 });
});

// ----- 2. 获取排行榜 -----
// GET /api/leaderboard?level=1&limit=10
app.get('/api/leaderboard', (req, res) => {
  const level = parseInt(req.query.level) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const data = readData();

  // 按关卡筛选
  let scores = data.scores.filter(s => s.level === level);

  // 按 波次 > 金币 排序
  scores.sort((a, b) => {
    if (b.wave !== a.wave) return b.wave - a.wave;
    return b.gold - a.gold;
  });

  // 取前 N 条
  scores = scores.slice(0, limit);

  res.json({ level, scores });
});

// ----- 3. 获取全部成绩（用于调试） -----
app.get('/api/all', (req, res) => {
  const data = readData();
  res.json(data);
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🏆 排行榜服务器已启动: http://localhost:${PORT}`);
  console.log(`📊 数据文件: ${DATA_FILE}`);
});