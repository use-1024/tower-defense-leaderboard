# 🥕 保卫萝卜 (Defend the Carrot)

一个基于 Canvas 的塔防游戏，玩家需要建造炮塔抵御怪物，保护萝卜不被吃掉。


---


## 🎮 在线试玩

> **前端地址**：https://tower-defense-frontend-production-67d0.up.railway.app
> 
> **后端 API**：https://tower-defense-leaderboard-production.up.railway.app

---

## 🎯 游戏介绍

**保卫萝卜** 是一款经典塔防游戏。怪物沿着固定路径前进，目标吃掉终点的萝卜。玩家需要在路径旁建造炮塔，阻止怪物抵达终点。

### 胜利条件
- 成功抵御所有波次的怪物攻击

### 失败条件
- 生命值归零（萝卜被吃掉）

---

## ✨ 功能特性

| 功能 | 说明 |
|------|------|
| 🏗️ **三种炮塔** | 瓶子塔、冰冻星、火箭炮 |
| 👾 **六种怪物** | 史莱姆、飞毛腿、铁甲怪、大Boss、幽灵、火怪 |
| 🗺️ **双关卡** | 两关不同地图和路径 |
| 📈 **难度选择** | 简单 / 普通 / 困难 |
| 💰 **经济系统** | 击杀怪物获得金币，建造和升级炮塔 |
| 🏆 **排行榜** | 云端排名，按波次和金币排序 |
| ⏸️ **暂停/继续** | 随时暂停游戏 |
| 📖 **游戏规则** | 内置规则说明面板 |

---

## 👾 怪物系统

| 怪物 | 图标 | 特性 |
|------|------|------|
| **史莱姆smile** | 🟢 | 基础单位 |
| **飞毛腿runner** | 🟡 | 速度快，会冲刺 |
| **铁甲怪tank** | 🟣 | 自带护盾，优先承受伤害 |
| **大Boss** | 🔴 | 死亡时召唤 3~6 个小怪 |
| **幽灵ghost** | 👻 | 随机出现在路径中途 |
| **火怪firemonster** | 🔥 | 死亡时自爆，变成史莱姆 |

---

## 🏗️ 炮塔系统

| 炮塔 | 图标 | 费用 | 特点 |
|------|------|------|------|
| **瓶子塔** | 🍼 | 100 | 基础攻击塔，稳定输出 |
| **冰冻星** | ❄️ | 150 | 减速敌人，控制节奏 |
| **火箭炮** | 🚀 | 200 | 高伤害，有溅射效果 |

> 💡 炮塔可以**升级**（最高 3 级）和**出售**（返还 60% 成本）

---

## 🛠️ 技术栈

### 前端
- JavaScript (ES6)
- Canvas 2D 渲染
- HTML5 + CSS3

### 后端
- Node.js + Express
- 文件存储 (JSON)
- CORS 跨域支持

---

## 📁 项目结构

```
保卫萝卜/
├── index.html              # 主页面
├── assets/                 # 图片资源
│   ├── grass.jpg
│   ├── path.jpg
│   ├── carrot.png
│   ├── bottle.png
│   ├── ice.png
│   ├── fire.png
│   ├── slime.png
│   ├── runner.png
│   ├── tank.png
│   ├── boss.png
│   ├── ghost.png
│   ├── firemonster.png
│   ├── stone.png
│   ├── tree.png
│   └── flower.png
├── config/                 # 配置文件
│   ├── constants.js        # 游戏常量
│   ├── towers.js           # 炮塔定义
│   ├── monsters.js         # 怪物定义
│   ├── waves.js            # 波次配置
│   ├── map.js              # 地图数据
│   └── api.js              # API 地址配置
├── src/                    # 游戏源码
│   ├── state.js            # 游戏状态
│   ├── utils.js            # 工具函数
│   ├── path.js             # 路径计算
│   ├── particles.js        # 粒子系统
│   ├── map.js              # 地图渲染
│   ├── towers.js           # 炮塔逻辑
│   ├── monsters.js         # 怪物逻辑
│   ├── projectiles.js      # 弹道系统
│   ├── input.js            # 输入处理
│   ├── ui.js               # UI 控制
│   ├── menu.js             # 主菜单
│   └── game.js             # 游戏主循环
└── backend/                # 后端服务
    ├── server.js           # Express 服务器
    ├── package.json        # 依赖管理
    ├── package-lock.json
    └── data.json           # 排行榜数据
```

