// ===================== GAME STATE =====================
let canvas, ctx;
let gold = 200, lives = 10, maxLives = 10, currentWave = 0, totalWaves = 0;
let gameState = 'menu'; // menu, playing, between_waves, paused, gameover, victory
let difficulty = 'normal'; // easy, normal, hard
let selectedTowerType = null;
let selectedPlacedTower = null;
let towers = [], monsters = [], projectiles = [], particles = [];
let mapState = []; // 0=buildable, 1=path, 2=end, 3=obstacle, 4=tower, 5=non-buildable
let spawnQueue = [], spawnTimer = 0, spawnInterval = 0.8;
let mouseX = 0, mouseY = 0, hoverCol = -1, hoverRow = -1;
let lastTime = 0;
let waypointPixels = [];
let pathSegments = [];
let totalPathLength = 0;
let carrotHP = 10;
let animTime = 0;

// 波次间隔倒计时
let betweenWavesTimer = 0;
const BETWEEN_WAVES_DELAY = 10; // 10秒后自动开始下一波

// 暂停状态
let isPaused = false;

// 多地图
let currentLevel = 1;