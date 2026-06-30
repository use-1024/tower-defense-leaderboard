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
//  📥 请求日志中间件（放在所有路由之前）
// ============================================================
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path}`);
  next();
});

// ============================================================
//  API 路由
// ============================================================

// ----- 调试接口（放在最前面） -----
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
//  🆕 托管前端静态文件
// ============================================================

// ============================================================
//  🆕 托管前端静态文件
// ============================================================

// ✅ 当 Root Directory = mygame/backend 时
// __dirname = /app (backend 目录)
// 但 index.html 在 mygame/ 目录下，需要找到它

// 尝试多个可能的路径
const possiblePaths = [
  '/app/mygame',           // Railway 上的路径
  '/app/../mygame',        // 相对路径
  path.join(__dirname, '..', 'mygame'),  // 相对于 backend
  path.join(__dirname, '..'),            // 上一级
  '/app',                  // 根目录
  __dirname,               // 当前目录
];

let finalPath = null;
for (const p of possiblePaths) {
  try {
    const testPath = path.join(p, 'index.html');
    console.log(`🔍 检查路径: ${testPath}`);
    if (fs.existsSync(testPath)) {
      finalPath = p;
      console.log(`✅ 找到 index.html 在: ${finalPath}`);
      break;
    }
  } catch (e) {
    console.log(`❌ 路径错误: ${p}`);
  }
}

if (!finalPath) {
  console.log('❌ 所有路径都找不到 index.html！');
  finalPath = '/app';
}

console.log('📁 最终前端文件路径:', finalPath);
console.log('📄 index.html 是否存在:', fs.existsSync(path.join(finalPath, 'index.html')));

app.use(express.static(finalPath));

// ✅ 所有非 API 请求返回 index.html
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API 未找到' });
  }
  const indexPath = path.join(finalPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send(`
      <h1>404 - index.html not found</h1>
      <p>查找路径: ${finalPath}</p>
      <p>完整路径: ${indexPath}</p>
    `);
  }
});