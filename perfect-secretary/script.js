// ========================================
// 完璧秘書 — Landing Page Scripts
// ========================================

// ---- Gold Particles ----
(function() {
  const canvas = document.getElementById('particles');
  const ctx = canvas.getContext('2d');
  let particles = [];
  let w, h;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }

  function createParticles() {
    particles = [];
    const count = Math.floor((w * h) / 25000);
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.5 + 0.5,
        dx: (Math.random() - 0.5) * 0.3,
        dy: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.4 + 0.1,
        pulse: Math.random() * Math.PI * 2,
      });
    }
  }

  function animate() {
    ctx.clearRect(0, 0, w, h);
    particles.forEach(p => {
      p.x += p.dx;
      p.y += p.dy;
      p.pulse += 0.01;

      if (p.x < 0) p.x = w;
      if (p.x > w) p.x = 0;
      if (p.y < 0) p.y = h;
      if (p.y > h) p.y = 0;

      const alpha = p.opacity * (0.6 + 0.4 * Math.sin(p.pulse));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(212, 175, 55, ${alpha})`;
      ctx.fill();
    });
    requestAnimationFrame(animate);
  }

  resize();
  createParticles();
  animate();
  window.addEventListener('resize', () => { resize(); createParticles(); });
})();

// ---- Nav Scroll ----
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 50);
});

// ---- Mobile Menu ----
const navToggle = document.getElementById('navToggle');
const mobileMenu = document.getElementById('mobileMenu');

navToggle.addEventListener('click', () => {
  mobileMenu.classList.toggle('open');
});

mobileMenu.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
  });
});

// ---- Scroll Reveal ----
const revealElements = document.querySelectorAll(
  '.strip-item, .show-visual, .show-text, .apps-grid li, .apps-all-note, .theme-visual, .theme-text, .sec-feature, .sec-roster-item, .promise-card, .target-card, .plan-card, .plan-table-wrap, .plans-note, .biz-head, .cta-content'
);

revealElements.forEach(el => el.classList.add('reveal'));
document.querySelectorAll('.show-row .show-visual').forEach(el => {
  el.classList.add(el.closest('.show-row').classList.contains('reverse') ? 'from-right' : 'from-left');
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, i * 80);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

revealElements.forEach(el => observer.observe(el));

// ---- Smooth scroll for all anchor links ----
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const href = this.getAttribute('href');
    if (href === '#') return;
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

/* ── ページトップへ戻るボタン（2026-08-16こうくん要望・HPと同じ挙動／見た目は黒金） ── */
(function () {
  const btn = document.createElement('button');
  btn.className = 'to-top';
  btn.type = 'button';
  btn.setAttribute('aria-label', 'ページの先頭へ戻る');
  btn.innerHTML = '<span aria-hidden="true">↑</span>';
  document.body.appendChild(btn);

  const SHOW_AT = 400;
  const sync = () => btn.classList.toggle('visible', window.scrollY > SHOW_AT);
  sync();
  window.addEventListener('scroll', sync, { passive: true });

  btn.addEventListener('click', () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  });
})();


// ---- ログイン済み＝右上に「名前＋ログアウト」（楽天e-NAVIと同じ位置・2026-09-20）・メニューの「ログイン」は名前に ----
// アカウントページ（account/）が同じサイトに保存するログイン情報の有無だけを見る（中身は読まない）
(function() {
  try {
    const raw = localStorage.getItem('sb-qwsxionvojqnqnwccoij-auth-token');
    if (!raw || !JSON.parse(raw)?.access_token) return;
    const name = (localStorage.getItem('ps-account-name') || '').trim() || 'アカウント';
    const logout = () => { try { localStorage.removeItem('sb-qwsxionvojqnqnwccoij-auth-token'); localStorage.removeItem('ps-account-name'); } catch (e) {} location.reload(); }; // このサイトのログインだけ切る（アプリ側には影響しない）
    document.querySelectorAll('a[href="account/"]').forEach((a) => { if (a.textContent.trim() === 'ログイン') a.textContent = name; });
    const inner = document.querySelector('.nav-inner');
    if (!inner) return;
    const box = document.createElement('div'); box.className = 'nav-account';
    const nm = document.createElement('a'); nm.className = 'nav-account-name'; nm.href = 'account/'; nm.textContent = name;
    const out = document.createElement('a'); out.className = 'nav-logout'; out.href = '#'; out.textContent = 'ログアウト';
    out.addEventListener('click', (e) => { e.preventDefault(); logout(); });
    box.append(nm, out);
    const toggle = inner.querySelector('.nav-toggle');
    if (toggle) inner.insertBefore(box, toggle); else inner.appendChild(box);
  } catch (e) { /* 読めない＝未ログイン扱い */ }
})();


/* ── 数字帯のカウントアップ（見えた時に1回だけ・2026-09-21） ── */
(function () {
  const nums = document.querySelectorAll('.strip-num[data-count]');
  if (!nums.length || !('IntersectionObserver' in window)) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      const target = Number(e.target.dataset.count) || 0;
      if (reduce) { e.target.textContent = target; return; }
      const start = performance.now(), dur = 1100;
      const step = (t) => {
        const k = Math.min(1, (t - start) / dur);
        const eased = 1 - Math.pow(1 - k, 3);
        e.target.textContent = Math.round(target * eased);
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });
  nums.forEach((n) => io.observe(n));
})();
