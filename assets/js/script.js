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
  }, { threshold: 0.1 });

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
