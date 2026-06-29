// ===================== PROJECTILE LOGIC & RENDERING =====================
function updateProjectiles(dt) {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    if (!p.target || p.target.hp <= 0) {
      projectiles.splice(i, 1);
      continue;
    }
    const dx = p.target.x - p.x, dy = p.target.y - p.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist < 8) {
      hitMonster(p);
      projectiles.splice(i, 1);
    } else {
      const speed = p.speed * dt;
      p.x += (dx/dist) * speed;
      p.y += (dy/dist) * speed;
      p.trail.push({x:p.x, y:p.y, life:0.3});
    }
  }
}

function drawProjectiles() {
  for (const p of projectiles) {
    for (let i = p.trail.length - 1; i >= 0; i--) {
      const t = p.trail[i];
      t.life -= 0.016;
      if (t.life <= 0) { p.trail.splice(i, 1); continue; }
      const alpha = Math.max(0, t.life / 0.3) * 0.6;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(t.x, t.y, 2, 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.save();
    ctx.translate(p.x, p.y);
    if (p.type === 'bottle') {
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(-1, -1, 1.5, 0, Math.PI*2); ctx.fill();
    } else if (p.type === 'ice') {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.moveTo(0, -5); ctx.lineTo(4, 0); ctx.lineTo(0, 5); ctx.lineTo(-4, 0);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(-1, -1, 1.5, 0, Math.PI*2); ctx.fill();
    } else if (p.type === 'rocket') {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.moveTo(0, -6); ctx.lineTo(3, 4); ctx.lineTo(-3, 4);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.moveTo(0, -6); ctx.lineTo(1.5, -2); ctx.lineTo(-1.5, -2);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
}
