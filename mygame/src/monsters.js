// ===================== MONSTER LOGIC & RENDERING =====================

// ===== 加载怪物图片 =====
const imgSlime = new Image();
imgSlime.src = 'assets/slime.png';

const imgRunner = new Image();
imgRunner.src = 'assets/runner.png';

const imgTank = new Image();
imgTank.src = 'assets/tank.png';

const imgBoss = new Image();
imgBoss.src = 'assets/boss.png';

const imgGhost = new Image();
imgGhost.src = 'assets/ghost.png';

const imgFireMonster = new Image();
imgFireMonster.src = 'assets/firemonster.png';

// ===== 获取怪物对应的图片 =====
function getMonsterImage(type) {
  const map = {
    'slime': imgSlime,
    'runner': imgRunner,
    'tank': imgTank,
    'boss': imgBoss,
    'ghost': imgGhost,
    'fire': imgFireMonster
  };
  return map[type] || null;
}

// ==================== 怪物生成 ====================
function spawnMonster(type) {
  const def = MONSTER_DEFS[type];
  const config = DIFFICULTY_CONFIG[difficulty];
  const hpScale = (1 + (currentWave - 1) * 0.12) * config.hpMult;

  // ===== Ghost: 在随机位置出现 =====
  let startX, startY, startDist;
  if (type === 'ghost') {
    const randomProgress = Math.random() * 0.8;
    startDist = randomProgress * totalPathLength;
    const pos = getPositionOnPath(startDist);
    startX = pos.x;
    startY = pos.y;
  } else {
    startX = waypointPixels[0].x;
    startY = waypointPixels[0].y;
    startDist = 0;
  }

  const monster = {
    type: type,
    x: startX,
    y: startY,
    hp: Math.round(def.hp * hpScale),
    maxHp: Math.round(def.hp * hpScale),
    speed: def.speed * config.speedMult,
    reward: def.reward + Math.floor(currentWave * 1.5),
    color: def.color,
    size: def.size,
    dist: startDist,
    slowTimer: 0,
    slowFactor: 1,
    bobPhase: Math.random() * Math.PI * 2,

    // ===== 行为相关属性 =====
    sprintTimer: 0,
    isSprinting: false,
    sprintCooldown: 0,

    // ===== Tank: 护盾 =====
    shieldActive: true,
    shieldHP: 0,           // 护盾血量
    maxShieldHP: 0,        // 护盾最大血量

    hasSummoned: false,
    summonCooldown: 0,
    isInvisible: false,
    hasExploded: false
  };

  // ===== Tank: 护盾血量 = 最大血量的 50% =====
  if (type === 'tank') {
    monster.shieldHP = Math.round(monster.maxHp * 0.5);
    monster.maxShieldHP = Math.round(monster.maxHp * 0.5);
  }

  monsters.push(monster);
}

// ==================== 怪物更新 ====================
function updateMonsters(dt) {
  for (let i = monsters.length - 1; i >= 0; i--) {
    const m = monsters[i];
    let speed = m.speed;

    // ===== 减速效果 =====
    if (m.slowTimer > 0) {
      speed *= m.slowFactor;
      m.slowTimer -= dt;
    }

    // =============================================
    // ===== 1. Runner: 冲刺行为 =====
    // =============================================
    if (m.type === 'runner') {
      m.sprintTimer += dt;
      m.sprintCooldown -= dt;

      if (m.sprintCooldown <= 0 && m.sprintTimer > 0.5) {
        m.isSprinting = true;
        m.sprintCooldown = 1.0 + Math.random() * 1.5;
        m.sprintTimer = 0;
      }

      if (m.isSprinting) {
        if (m.sprintCooldown > 0.6) {
          speed *= 2.5;
          addParticles(m.x, m.y, '#ff6b6b', 2);
        } else {
          m.isSprinting = false;
        }
      }
    }

    // =============================================
    // ===== Ghost: 随机位置出现 =====
    // =============================================
    if (m.type === 'ghost') {
      if (Math.random() < 0.05) {
        addParticles(m.x, m.y, 'rgba(52,152,219,0.3)', 1);
      }
    }

    // =============================================
    // ===== 移动 =====
    // =============================================
    m.dist += speed * dt;
    const pos = getPositionOnPath(m.dist);
    m.x = pos.x;
    m.y = pos.y;
    m.bobPhase += dt * 6;

    // =============================================
    // ===== 到达终点 =====
    // =============================================
    if (m.dist >= totalPathLength) {
      lives--;
      carrotHP = lives;
      monsters.splice(i, 1);
      addParticles(m.x, m.y, '#ff0000', 8);
      if (lives <= 0) {
        gameState = 'gameover';
        showOverlay('gameover');
      }
      continue;
    }

    // =============================================
    // ===== 3. Fire: 血量归零时自爆 =====
    // =============================================
    if (m.type === 'fire' && m.hp <= 0 && !m.hasExploded) {
      m.hasExploded = true;

      const fireX = m.x;
      const fireY = m.y;
      const fireDist = m.dist;

      const explosionRadius = 80;
      const explosionDamage = 40 + Math.random() * 30;

      for (const other of monsters) {
        if (other === m || other.hp <= 0) continue;
        const dx = other.x - fireX;
        const dy = other.y - fireY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= explosionRadius) {
          const damageMultiplier = 1 - (dist / explosionRadius) * 0.6;
          dealDamageToMonster(other, explosionDamage * damageMultiplier);
          addParticles(other.x, other.y, '#ff6b6b', 5);
        }
      }

      addParticles(fireX, fireY, '#ff6b6b', 30);
      addParticles(fireX, fireY, '#f39c12', 20);
      addParticles(fireX, fireY, '#ffd700', 15);
      addFloatingText(fireX, fireY - 40, '自爆!', '#ff6b6b');

      const config = DIFFICULTY_CONFIG[difficulty];
      const hpScale = (1 + (currentWave - 1) * 0.12) * config.hpMult;
      
      const slime = {
        type: 'slime',
        x: fireX + (Math.random() - 0.5) * 20,
        y: fireY + (Math.random() - 0.5) * 20,
        hp: Math.round(50 * hpScale * 0.3),
        maxHp: Math.round(50 * hpScale * 0.3),
        speed: 45 * config.speedMult * 0.7,
        reward: 5,
        color: '#2ecc71',
        size: 12,
        dist: fireDist + 10,
        slowTimer: 0,
        slowFactor: 1,
        bobPhase: Math.random() * Math.PI * 2,
        sprintTimer: 0,
        isSprinting: false,
        sprintCooldown: 0,
        shieldActive: false,
        shieldHP: 0,
        maxShieldHP: 0,
        hasSummoned: false,
        summonCooldown: 0,
        isInvisible: false,
        hasExploded: false
      };
      monsters.push(slime);
      addFloatingText(fireX, fireY - 60, '变成Slime!', '#2ecc71');

      monsters.splice(i, 1);
      continue;  // ===== 关键修改：添加这行，跳过普通死亡逻辑 =====
    }

    // =============================================
    // ===== 普通死亡（血量归零） =====
    // =============================================
    if (m.hp <= 0) {
      const monsterType = m.type;
      const hasSummoned = m.hasSummoned;
      const monsterX = m.x;
      const monsterY = m.y;
      const monsterReward = m.reward;
      const monsterColor = m.color;
      
      monsters.splice(i, 1);
      
      // =============================================
      // ===== 4. Boss: 召唤一波怪物（改进版） =====
      // =============================================
      if (monsterType === 'boss' && !hasSummoned) {
        const config = DIFFICULTY_CONFIG[difficulty];
        const hpScale = (1 + (currentWave - 1) * 0.12) * config.hpMult;
        
        const summonCount = 3 + Math.floor(Math.random() * 3);
        addFloatingText(monsterX, monsterY - 40, '👾 召唤 ' + summonCount + ' 个怪物!', '#ffd700');
        addParticles(monsterX, monsterY, '#ffd700', 30);
        addParticles(monsterX, monsterY, '#e74c3c', 20);
        
        const spawnedMonsters = [];
        
        for (let j = 0; j < summonCount; j++) {
          const spawnType = Math.random() < 0.6 ? 'slime' : 'runner';
          const def = MONSTER_DEFS[spawnType];
          
          const startX = waypointPixels[0].x + (Math.random() - 0.5) * 30;
          const startY = waypointPixels[0].y + (Math.random() - 0.5) * 30;
          
          const child = {
            type: spawnType,
            x: startX,
            y: startY,
            hp: Math.round(def.hp * hpScale),
            maxHp: Math.round(def.hp * hpScale),
            speed: def.speed * config.speedMult,
            reward: Math.round(def.reward * 0.5),
            color: def.color,
            size: def.size,
            dist: 5 + j * 2,
            slowTimer: 0,
            slowFactor: 1,
            bobPhase: Math.random() * Math.PI * 2,
            sprintTimer: 0,
            isSprinting: false,
            sprintCooldown: 0,
            shieldActive: false,
            shieldHP: 0,
            maxShieldHP: 0,
            hasSummoned: false,
            summonCooldown: 0,
            isInvisible: false,
            hasExploded: false
          };
          
          if (spawnType === 'runner') {
            child.sprintTimer = Math.random() * 2;
            child.isSprinting = false;
            child.sprintCooldown = Math.random() * 3;
          }
          
          spawnedMonsters.push(child);
        }
        
        spawnedMonsters.forEach((child, index) => {
          setTimeout(() => {
            if (gameState === 'playing' || gameState === 'between_waves') {
              monsters.push(child);
              addParticles(child.x, child.y, '#ffd700', 5);
              addFloatingText(child.x, child.y - 20, '👾 召唤物', '#ffd700');
            }
          }, index * 500);
        });
      }
      
      gold += monsterReward;
      addParticles(monsterX, monsterY, monsterColor, 12);
      addFloatingText(monsterX, monsterY - 20, '+' + monsterReward + '💰', '#ffd700');
      
      if (gameState === 'playing' && spawnQueue.length === 0 && monsters.length === 0) {
        if (currentWave >= totalWaves) {
          gameState = 'victory';
          showOverlay('victory');
        } else {
          gameState = 'between_waves';
          betweenWavesTimer = BETWEEN_WAVES_DELAY;
          document.getElementById('start-btn').classList.add('hidden');
          updateUI();
        }
      }
    }
  }

  updateUI();
}
// =============================================
// ===== 伤害处理函数（Tank 护盾优先） =====
// =============================================
function dealDamageToMonster(monster, damage) {
  if (monster.hp <= 0) return;
  
  // ===== Tank: 护盾优先承受伤害 =====
  if (monster.type === 'tank' && monster.shieldActive && monster.shieldHP > 0) {
    const shieldDamage = Math.min(damage, monster.shieldHP);
    monster.shieldHP -= shieldDamage;
    damage -= shieldDamage;
    
    // 护盾被击破
    if (monster.shieldHP <= 0) {
      monster.shieldActive = false;
      addFloatingText(monster.x, monster.y - 40, '护盾破碎!', '#3498db');
      addParticles(monster.x, monster.y, '#3498db', 20);
    }
  }
  
  // 剩余伤害扣血
  if (damage > 0) {
    monster.hp -= damage;
  }
}

// ==================== 怪物绘制 ====================
function drawMonsters() {
  for (const m of monsters) {
    if (m.hp <= 0) continue;

    const bob = Math.sin(m.bobPhase) * 3;
    const x = m.x,
      y = m.y + bob;
    const s = m.size;

    ctx.save();
    ctx.translate(x, y);

    // ===== Tank: 护盾效果（仅当护盾激活且护盾HP>0） =====
    if (m.type === 'tank' && m.shieldActive && m.shieldHP > 0) {
      // 护盾光圈
      const glow = ctx.createRadialGradient(0, 0, s * 0.5, 0, 0, s * 1.6);
      glow.addColorStop(0, 'rgba(52,152,219,0)');
      glow.addColorStop(0.4, 'rgba(52,152,219,0.15)');
      glow.addColorStop(0.8, 'rgba(52,152,219,0.25)');
      glow.addColorStop(1, 'rgba(52,152,219,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, s * 1.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(52,152,219,0.6)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, s + 6, 0, Math.PI * 2);
      ctx.stroke();

      // ===== 护盾血条（在怪物上方） =====
      const shieldRatio = m.shieldHP / m.maxShieldHP;
      const barW = s * 2.2, barH = 3;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(-barW / 2, -s - 18, barW, barH);
      ctx.fillStyle = shieldRatio > 0.5 ? '#3498db' : '#e74c3c';
      ctx.fillRect(-barW / 2, -s - 18, barW * shieldRatio, barH);

      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '7px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('🛡️', 0, -s - 22);
    }

    // ===== Runner: 冲刺效果 =====
    if (m.type === 'runner' && m.isSprinting) {
      ctx.shadowColor = '#ff6b6b';
      ctx.shadowBlur = 20;
      ctx.strokeStyle = 'rgba(255,107,107,0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, s + 8, 0, Math.PI * 2);
      ctx.stroke();
    }

    // ===== Boss: 特殊光效 =====
    if (m.type === 'boss') {
      const glow = ctx.createRadialGradient(0, 0, s * 0.3, 0, 0, s * 1.8);
      glow.addColorStop(0, 'rgba(255,215,0,0)');
      glow.addColorStop(0.5, 'rgba(255,215,0,0.08)');
      glow.addColorStop(1, 'rgba(255,215,0,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, s * 1.8, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = 'rgba(255,215,0,0.6)';
      ctx.font = '8px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('👾 BOSS', 0, -s - 16);
    }

    // ===== Fire: 火焰特效 =====
    if (m.type === 'fire') {
      const flicker = Math.sin(animTime * 10 + m.bobPhase) * 0.2 + 0.8;
      const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 1.5 * flicker);
      glow.addColorStop(0, 'rgba(255,107,53,0.2)');
      glow.addColorStop(0.5, 'rgba(255,107,53,0.1)');
      glow.addColorStop(1, 'rgba(255,107,53,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, s * 1.5 * flicker, 0, Math.PI * 2);
      ctx.fill();
    }

    // ===== Ghost: 幽灵特效 =====
    if (m.type === 'ghost') {
      const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 1.4);
      glow.addColorStop(0, 'rgba(142,68,173,0.1)');
      glow.addColorStop(0.5, 'rgba(142,68,173,0.05)');
      glow.addColorStop(1, 'rgba(142,68,173,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, s * 1.4, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = 'rgba(142,68,173,0.5)';
      ctx.font = '7px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('👻', 0, -s - 12);
    }

    // 阴影
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(0, s + 2 - bob, s * 0.8, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // 减速效果
    if (m.slowTimer > 0) {
      ctx.fillStyle = 'rgba(52,152,219,0.2)';
      ctx.beginPath();
      ctx.arc(0, 0, s + 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // ===== 绘制怪物图片 =====
    const img = getMonsterImage(m.type);
    if (img && img.complete && img.naturalWidth > 0) {
      let drawSize = 48;
      if (m.type === 'slime') drawSize = 36;
      else if (m.type === 'runner') drawSize = 30;
      else if (m.type === 'tank') drawSize = 44;
      else if (m.type === 'boss') drawSize = 54;
      else if (m.type === 'ghost') drawSize = 38;
      else if (m.type === 'fire') drawSize = 32;

      ctx.drawImage(img, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
    }

    ctx.restore();

    // =============================================
    // ===== 血条绘制（Tank 有两层血条） =====
    // =============================================
    
    // ----- 护盾血条（Tank 专属，在怪物上方） -----
    // 已经在上面绘制了，这里不再重复
    
    // ----- 生命血条（所有怪物都有） -----
    // 如果是 Tank 且有护盾，生命血条在护盾血条下方
    // 如果是 Tank 护盾已碎，生命血条在正常位置
    // 如果是其他怪物，生命血条在正常位置
    
    const hpBarYOffset = (m.type === 'tank' && m.shieldActive && m.shieldHP > 0) ? 
                          -s - 14 + bob :   // 有护盾时，生命血条在护盾血条下方
                          -s - 10 + bob;    // 无护盾时，正常位置
    
    const barW = s * 2.2, barH = 4;
    const hpRatio = m.hp / m.maxHp;

    // 背景
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(x - barW / 2, y + hpBarYOffset, barW, barH);

    // 生命值（Tank 护盾存在时，生命血条显示为绿色，但表示的是生命值）
    // 如果是 Tank 且有护盾，生命血条显示为较暗的绿色，表示生命值尚未受损
    if (m.type === 'tank' && m.shieldActive && m.shieldHP > 0) {
      // 护盾存在时，生命血条显示为暗绿色（表示生命值满但被护盾保护）
      ctx.fillStyle = '#27ae60';
      ctx.fillRect(x - barW / 2, y + hpBarYOffset, barW * hpRatio, barH);
      // 添加边框高亮
      ctx.strokeStyle = 'rgba(46,204,113,0.3)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x - barW / 2, y + hpBarYOffset, barW, barH);
    } else {
      // 正常血条颜色
      ctx.fillStyle = hpRatio > 0.5 ? '#2ecc71' : hpRatio > 0.25 ? '#f39c12' : '#e74c3c';
      ctx.fillRect(x - barW / 2, y + hpBarYOffset, barW * hpRatio, barH);
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(x - barW / 2, y + hpBarYOffset, barW, barH);

    // ===== 行为状态标签 =====
    if (m.type === 'runner' && m.isSprinting) {
      ctx.fillStyle = 'rgba(255,107,107,0.6)';
      ctx.font = '8px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('冲刺!', x, y - s - 26 + bob);
    }
    
    if (m.type === 'fire') {
      ctx.fillStyle = 'rgba(255,107,53,0.6)';
      ctx.font = '7px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('自爆', x, y - s - 18 + bob);
    }
    
    if (m.type === 'ghost') {
      ctx.fillStyle = 'rgba(142,68,173,0.4)';
      ctx.font = '7px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('幽灵', x, y - s - 18 + bob);
    }
  }
}