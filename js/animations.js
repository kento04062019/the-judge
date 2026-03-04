// animations.js — フリップ・紙吹雪・シェイク等

// カードフリップ
export function flipCard(el) {
  el.classList.add('flipping');
  setTimeout(() => el.classList.remove('flipping'), 600);
}

// 入力欄シェイク
export function shakeInput(el) {
  el.classList.add('shake');
  setTimeout(() => el.classList.remove('shake'), 500);
}

// 紙吹雪エフェクト
export function confetti(duration = 2000) {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.display = 'block';

  const colors = ['#FFD700', '#FF6B9D', '#00E5FF', '#76FF03', '#E040FB', '#FF5252'];
  const particles = [];

  for (let i = 0; i < 120; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      w: Math.random() * 10 + 5,
      h: Math.random() * 6 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 3 + 2,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.2,
    });
  }

  const start = performance.now();

  function frame(now) {
    const elapsed = now - start;
    if (elapsed > duration) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.style.display = 'none';
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const alpha = elapsed > duration - 500 ? (duration - elapsed) / 500 : 1;
    ctx.globalAlpha = alpha;

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.vy += 0.05;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

// 画面全体フラッシュ
export function flash(color = 'rgba(255,215,0,0.15)') {
  const el = document.createElement('div');
  el.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: ${color}; pointer-events: none; z-index: 9998;
    animation: flashFade 0.4s ease-out forwards;
  `;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 500);
}

// フィードバックメッセージ表示
export function showFeedback(message, type = 'correct') {
  const existing = document.getElementById('feedback-toast');
  if (existing) existing.remove();

  const el = document.createElement('div');
  el.id = 'feedback-toast';
  el.className = `feedback-toast feedback-${type}`;
  el.textContent = message;
  document.body.appendChild(el);

  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, 2500);
}
