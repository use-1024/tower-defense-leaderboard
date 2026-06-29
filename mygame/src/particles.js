// ===================== PARTICLES SYSTEM =====================
let floatingTexts = [];

function addParticles(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 30 + Math.random() * 80;
        particles.push({
            x: x, y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 20,
            life: 0.4 + Math.random() * 0.6,
            maxLife: 0.6 + Math.random() * 0.4,
            size: 2 + Math.random() * 4,
            color: color,
            decay: 0.5 + Math.random() * 0.5
        });
    }
}

function addFloatingText(x, y, text, color = '#ffffff') {
    floatingTexts.push({
        x: x, y: y,
        text: text,
        color: color,
        life: 1.0,
        vy: -40
    });
}

function updateParticles(dt) {
    // 更新粒子
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 30 * dt; // 轻微重力
        p.life -= dt;
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }

    // 更新浮动文字
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ft.y += ft.vy * dt;
        ft.life -= dt;
        if (ft.life <= 0) {
            floatingTexts.splice(i, 1);
        }
    }
}

function drawParticles() {
    // 绘制粒子
    for (const p of particles) {
        const alpha = p.life / p.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;

    // 绘制浮动文字
    for (const ft of floatingTexts) {
        const alpha = Math.max(0, ft.life);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = ft.color;
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 6;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;
}