// config/api.js
// 根据环境自动切换API地址

const getApiBaseUrl = () => {
  // 开发环境：使用本地后端
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3000';
  }
  
  // 生产环境：使用Railway后端地址
  // ✅ 已替换为你的真实后端地址
  return 'https://tower-defense-leaderboard-production.up.railway.app';
};

export const API_BASE_URL = getApiBaseUrl();

// API接口地址
export const API_ENDPOINTS = {
  HEALTH: `${API_BASE_URL}/api/health`,
  ALL: `${API_BASE_URL}/api/all`,
  LEADERBOARD: `${API_BASE_URL}/api/leaderboard`,
  SCORE: `${API_BASE_URL}/api/score`,
};