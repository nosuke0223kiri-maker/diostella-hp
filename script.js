// ナビゲーション スクロール検知
const nav = document.querySelector('.nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
});

// ハンバーガーメニュー（モバイル）
const toggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
if (toggle) {
  toggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    toggle.classList.toggle('active');
  });

  // リンク押したらメニュー閉じる
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      toggle.classList.remove('active');
    });
  });

  // メニュー外クリックで閉じる
  document.addEventListener('click', (e) => {
    if (!navLinks.contains(e.target) && !toggle.contains(e.target)) {
      navLinks.classList.remove('open');
      toggle.classList.remove('active');
    }
  });
}

// Aboutページ タブ切り替え
document.querySelectorAll('.about-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.about-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.about-tab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
  });
});

// お問い合わせフォーム送信
const form = document.getElementById('contactForm');
const thanks = document.getElementById('contactThanks');
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    // TODO: 実際の送信処理（FormspreeやNetlify Forms等）を追加
    form.style.display = 'none';
    thanks.style.display = 'block';
  });
}
