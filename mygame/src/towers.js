// ===================== TOWER LOGIC & RENDERING =====================

// ===== 加载塔图片 =====
const imgTowerBottle = new Image();
imgTowerBottle.src = 'assets/bottle.png';

const imgTowerIce = new Image();
imgTowerIce.src = 'assets/ice.png';

const imgTowerRocket = new Image();
imgTowerRocket.src = 'assets/fire.png';  // 你写的是 fire.png

function findTarget(tower) {
  let best = null, bestDist = -1;
  for (const m of monsters) {
    if (m.hp <= 0) continue;
    const dx = m.x - tower.x, dy = m.y - tower.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist <= tower.range && m.dist > bestDist) {
      best = m; bestDist = m.dist;
    }
  }
  return best;
}

function fireProjectile(tower, target) {
  projectiles.push({
    x: tower.x, y: tower.y - 10,
    target, speed: tower.projSpeed,
    damage: tower.damage,
    color: tower.projColor,
    type: tower.type,
    slowFactor: tower.slowFactor || 0,
    slowDuration: tower.slowDuration || 0,
    splash: tower.splash || 0,
    trail: []
  });
}

// 新代码（通过 dealDamageToMonster）
function hitMonster(proj) {
  const m = proj.target;
  
  // Tank 有护盾时，伤害先扣护盾，护盾碎了才扣血
  dealDamageToMonster(m, proj.damage);
  
  // ===== 减速效果（即使有护盾也能被减速） =====
  if (proj.slowFactor > 0 && m.hp > 0) {
    m.slowTimer = proj.slowDuration;
    m.slowFactor = proj.slowFactor;
  }
  
  // ===== 溅射伤害 =====
  if (proj.splash > 0) {
    for (const other of monsters) {
      if (other === m || other.hp <= 0) continue;
      const dx = other.x - m.x, dy = other.y - m.y;
      if (Math.sqrt(dx*dx+dy*dy) <= proj.splash) {
        // 溅射伤害也使用统一函数
        dealDamageToMonster(other, proj.damage * 0.5);
      }
    }
    addParticles(m.x, m.y, '#ff6600', 15);
  }
  
  addParticles(m.x, m.y, proj.color, 5);
}

function updateTowers(dt) {
  for (const t of towers) {
    t.cooldown -= dt;
    if (t.cooldown <= 0) {
      const target = findTarget(t);
      if (target) {
        fireProjectile(t, target);
        t.cooldown = 1 / t.fireRate;
        t.shootAnim = 0.15;
      }
    }
    if (t.shootAnim > 0) t.shootAnim -= dt;
  }
}

function drawTowers() {
  for (const t of towers) {
    const x = t.x, y = t.y;
    const scale = t.shootAnim > 0 ? 1.1 : 1.0;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // ===== 使用图片绘制塔 =====
    let img = null;
    if (t.type === 'bottle') {
      img = imgTowerBottle;
    } else if (t.type === 'ice') {
      img = imgTowerIce;
    } else if (t.type === 'rocket') {
      img = imgTowerRocket;
    }

    if (img && img.complete && img.naturalWidth > 0) {
      // 图片居中绘制（瓶子塔 40×48，其他塔 48×48）
      let w = 48, h = 48;
      if (t.type === 'bottle') {
        w = 40;
        h = 48;
      }
      ctx.drawImage(img, -w/2, -h/2, w, h);
    } else {
      // ===== 备用方案：Canvas 绘制 =====
      if (t.type === 'bottle') {
        drawBottleTower(0, 0, t.level);
      } else if (t.type === 'ice') {
        drawIceTower(0, 0, t.level);
      } else if (t.type === 'rocket') {
        drawRocketTower(0, 0, t.level);
      }
    }

    // ===== 等级星星（始终用 Canvas 绘制） =====
    if (t.level > 1) {
      ctx.fillStyle = '#ffd700';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      const stars = '⭐'.repeat(t.level - 1);
      ctx.fillText(stars, 0, 20);
    }

    ctx.restore();
  }
}

// ===== 备用 Canvas 绘制函数（图片加载失败时使用） =====
function drawBottleTower(x, y, level) {
  ctx.fillStyle = '#c0392b';
  ctx.beginPath();
  ctx.ellipse(x, y+10, 14, 6, 0, 0, Math.PI*2);
  ctx.fill();

  const gradient = ctx.createLinearGradient(x-10, y, x+10, y);
  gradient.addColorStop(0, '#e74c3c');
  gradient.addColorStop(0.5, '#ff6b6b');
  gradient.addColorStop(1, '#c0392b');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(x-10, y+8);
  ctx.quadraticCurveTo(x-12, y-5, x-6, y-12);
  ctx.lineTo(x-4, y-18);
  ctx.lineTo(x+4, y-18);
  ctx.lineTo(x+6, y-12);
  ctx.quadraticCurveTo(x+12, y-5, x+10, y+8);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(255,150,150,0.6)';
  ctx.beginPath();
  ctx.moveTo(x-8, y+6);
  ctx.quadraticCurveTo(x-10, y-2, x-5, y-6);
  ctx.lineTo(x+5, y-6);
  ctx.quadraticCurveTo(x+10, y-2, x+8, y+6);
  ctx.closePath();
  ctx.fill();

  const bt = animTime * 2;
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath(); ctx.arc(x-3, y-2+Math.sin(bt)*3, 2, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(x+2, y+1+Math.sin(bt+1)*2, 1.5, 0, Math.PI*2); ctx.fill();

  ctx.fillStyle = '#8B4513';
  ctx.fillRect(x-3, y-22, 6, 5);

  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.beginPath();
  ctx.ellipse(x-5, y-8, 2, 6, -0.2, 0, Math.PI*2);
  ctx.fill();
}

function drawIceTower(x, y, level) {
  const glow = ctx.createRadialGradient(x, y, 0, x, y, 20);
  glow.addColorStop(0, 'rgba(52,152,219,0.3)');
  glow.addColorStop(1, 'rgba(52,152,219,0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(x, y, 20, 0, Math.PI*2); ctx.fill();

  ctx.strokeStyle = '#74b9ff';
  ctx.lineWidth = 3;
  for (let i = 0; i < 6; i++) {
    const a = (i/6)*Math.PI*2 + animTime*0.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x+Math.cos(a)*14, y+Math.sin(a)*14);
    ctx.stroke();
    ctx.fillStyle = '#a8d8ff';
    ctx.beginPath();
    ctx.arc(x+Math.cos(a)*14, y+Math.sin(a)*14, 3, 0, Math.PI*2);
    ctx.fill();
  }

  ctx.fillStyle = '#3498db';
  ctx.beginPath();
  ctx.moveTo(x, y-10);
  ctx.lineTo(x+8, y);
  ctx.lineTo(x, y+10);
  ctx.lineTo(x-8, y);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#74b9ff';
  ctx.beginPath();
  ctx.moveTo(x, y-5);
  ctx.lineTo(x+4, y);
  ctx.lineTo(x, y+5);
  ctx.lineTo(x-4, y);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.beginPath(); ctx.arc(x-2, y-3, 2, 0, Math.PI*2); ctx.fill();
}

function drawRocketTower(x, y, level) {
  ctx.fillStyle = '#7f8c8d';
  ctx.beginPath();
  ctx.ellipse(x, y+12, 16, 6, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.fillStyle = '#95a5a6';
  ctx.beginPath();
  ctx.ellipse(x, y+10, 14, 5, 0, 0, Math.PI*2);
  ctx.fill();

  ctx.fillStyle = '#e67e22';
  ctx.beginPath();
  ctx.moveTo(x-8, y+8);
  ctx.lineTo(x-8, y-10);
  ctx.quadraticCurveTo(x-8, y-20, x, y-24);
  ctx.quadraticCurveTo(x+8, y-20, x+8, y-10);
  ctx.lineTo(x+8, y+8);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#d35400';
  ctx.beginPath();
  ctx.moveTo(x-5, y-16);
  ctx.quadraticCurveTo(x, y-26, x+5, y-16);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#3498db';
  ctx.beginPath(); ctx.arc(x, y-8, 4, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#74b9ff';
  ctx.beginPath(); ctx.arc(x-1, y-9, 2, 0, Math.PI*2); ctx.fill();

  ctx.fillStyle = '#c0392b';
  ctx.beginPath();
  ctx.moveTo(x-8, y+6); ctx.lineTo(x-14, y+14); ctx.lineTo(x-6, y+10);
  ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x+8, y+6); ctx.lineTo(x+14, y+14); ctx.lineTo(x+6, y+10);
  ctx.closePath(); ctx.fill();

  if (animTime % 0.2 < 0.1) {
    ctx.fillStyle = '#f39c12';
    ctx.beginPath();
    ctx.moveTo(x-4, y+10); ctx.lineTo(x, y+18); ctx.lineTo(x+4, y+10);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.moveTo(x-2, y+10); ctx.lineTo(x, y+15); ctx.lineTo(x+2, y+10);
    ctx.closePath(); ctx.fill();
  }
}