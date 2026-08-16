// ========== Navigation ==========

// Scroll detection
const nav = document.querySelector('.nav');
if (nav) {
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  });
}

// Mobile menu
const toggle = document.querySelector('.nav-toggle');
const mobileMenu = document.querySelector('.mobile-menu');
if (toggle && mobileMenu) {
  toggle.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
    toggle.classList.toggle('active');
  });

  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      toggle.classList.remove('active');
    });
  });

  document.addEventListener('click', (e) => {
    if (!mobileMenu.contains(e.target) && !toggle.contains(e.target)) {
      mobileMenu.classList.remove('open');
      toggle.classList.remove('active');
    }
  });
}


// ========== Scroll Animation ==========

const fadeEls = document.querySelectorAll('.fade-in');
if (fadeEls.length > 0) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
    // threshold は 0＝「1pxでも見えたら表示」。
    // 0.1（10%）だと、広告ページのように本文全体を1つの .fade-in で囲んだ縦に長い要素
    // （実測82,139px）で交差率が画面高さ÷要素高さ＝数%にしかならず、永久に表示されない（2026-08-14修正）
  }, { threshold: 0 });

  fadeEls.forEach(el => observer.observe(el));
}


// ========== Contact Form ==========
// 送信先＝Supabase web_inquiries（2026-08-10本物化。旧実装は見た目だけで内容がどこにも届いていなかった）
// 鍵は公開用（publishable）＝静的サイトに置いてよい設計。テーブルは書き込み専用（RLS）＝この鍵では読み出し不可。
const SB_URL = 'https://qwsxionvojqnqnwccoij.supabase.co';
const SB_KEY = 'sb_publishable_RjqVoCPAZehQEwqNXvBqLA_FniRc_Sd';

const form = document.getElementById('contactForm');
const thanks = document.getElementById('contactThanks');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = form.elements;
    if (f.website && f.website.value) return; // ハニーポット＝botだけが埋める
    const btn = form.querySelector('.btn-submit');
    const errEl = document.getElementById('contactError');
    if (errEl) errEl.style.display = 'none';
    if (btn) { btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = '送信中…'; }
    try {
      const res = await fetch(SB_URL + '/rest/v1/web_inquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SB_KEY,
          Authorization: 'Bearer ' + SB_KEY,
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          name: f.name.value.trim().slice(0, 50),
          email: f.email.value.trim().slice(0, 200),
          category: f.category.value,
          body: f.message.value.trim().slice(0, 2000),
        }),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      form.style.display = 'none';
      thanks.style.display = 'block';
    } catch (err) {
      if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label; }
      if (errEl) errEl.style.display = 'block';
    }
  });
}

/* ── ページトップへ戻るボタン（2026-08-16こうくん要望）
   全ページ共通なので各HTMLには書かず、ここで作って差し込む。
   一定量スクロールした時だけ出す＝短いページでは邪魔にならない。 */
(function () {
  const btn = document.createElement('button');
  btn.className = 'to-top';
  btn.type = 'button';
  btn.setAttribute('aria-label', 'ページの先頭へ戻る');
  btn.innerHTML = '<span aria-hidden="true">↑</span>';
  document.body.appendChild(btn);

  const SHOW_AT = 400;   // px
  const sync = () => btn.classList.toggle('visible', window.scrollY > SHOW_AT);
  sync();
  window.addEventListener('scroll', sync, { passive: true });

  btn.addEventListener('click', () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  });
})();
