// ===================== WAVE DEFINITIONS =====================
// 第一关：波次 0-7（共8波）
// ===== 第四步：在后期波次中加入 ghost 和 fire =====
const LEVEL1_WAVES = [
  [{type:'slime',count:8}],
  [{type:'slime',count:12}],
  [{type:'slime',count:10},{type:'runner',count:5}],
  [{type:'runner',count:10},{type:'slime',count:8}],
  [{type:'slime',count:10},{type:'tank',count:3}],
  [{type:'runner',count:10},{type:'tank',count:4}],
  [{type:'slime',count:5},{type:'runner',count:6},{type:'ghost',count:4}],   // 第7波：加入幽灵
  [{type:'tank',count:6},{type:'runner',count:6},{type:'fire',count:6}],     // 第8波：加入火怪
];

// 第二关：波次 0-6（共7波）
// ===== 第四步：在第二关也加入新怪物 =====
const LEVEL2_WAVES = [
  [{type:'slime',count:12},{type:'runner',count:8},{type:'tank',count:4}],
  [{type:'tank',count:4},{type:'runner',count:6},{type:'ghost',count:4}],     // 加入幽灵
  [{type:'runner',count:12},{type:'tank',count:6},{type:'fire',count:4}],     // 加入火怪
  [{type:'slime',count:10},{type:'tank',count:8},{type:'runner',count:5}],
  [{type:'tank',count:6},{type:'boss',count:2},{type:'runner',count:8},{type:'ghost',count:4}],
  [{type:'runner',count:10},{type:'tank',count:8},{type:'boss',count:2},{type:'fire',count:6}],
  [{type:'tank',count:8},{type:'boss',count:4},{type:'runner',count:8},{type:'ghost',count:6},{type:'fire',count:6}],
];

// 兼容旧代码的全局数组（合并两关）
const WAVE_DEFS = [...LEVEL1_WAVES, ...LEVEL2_WAVES];

// 关卡映射：全局波次索引 -> {level, localWaveIndex}
const WAVE_LEVEL_MAP = [];
for (let i = 0; i < LEVEL1_WAVES.length; i++) {
  WAVE_LEVEL_MAP.push({ level: 1, localIndex: i });
}
for (let i = 0; i < LEVEL2_WAVES.length; i++) {
  WAVE_LEVEL_MAP.push({ level: 2, localIndex: i });
}

function getWavesForLevel(level) {
  return level === 1 ? LEVEL1_WAVES : LEVEL2_WAVES;
}

function getCurrentWaveInLevel(globalWave, level) {
  const mapping = WAVE_LEVEL_MAP[globalWave];
  return mapping ? mapping.localIndex + 1 : globalWave + 1;
}

function getTotalWavesForLevel(level) {
  return (level === 1 ? LEVEL1_WAVES : LEVEL2_WAVES).length;
}