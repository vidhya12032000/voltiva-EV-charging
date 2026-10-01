(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;
  const store = {
    get: k => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch {} }
  };

  /* Toast */
  let tt;
  const toast = msg => {
    const el = $('#toast'); if (!el) return;
    el.textContent = msg; el.classList.add('show');
    clearTimeout(tt); tt = setTimeout(() => el.classList.remove('show'), 2800);
  };

  /* Theme — the <head> script already set data-theme before paint; this keeps it in sync */
  const themeBtn = $('#themeToggle');
  const sysLight = matchMedia('(prefers-color-scheme: light)');
  function applyTheme(t, save = true) {
    root.dataset.theme = t;
    if (themeBtn) { themeBtn.textContent = t === 'dark' ? '☀' : '☾'; themeBtn.setAttribute('aria-label', `Switch to ${t === 'dark' ? 'light' : 'dark'} theme`); }
    document.querySelector('meta[name=color-scheme]')?.setAttribute('content', t);
    if (save) store.set('vt-theme', t);
  }
  applyTheme(root.dataset.theme || store.get('vt-theme') || (sysLight.matches ? 'light' : 'dark'), false);
  themeBtn?.addEventListener('click', () => applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'));
  sysLight.addEventListener?.('change', e => { if (!store.get('vt-theme')) applyTheme(e.matches ? 'light' : 'dark', false); });
  addEventListener('storage', e => { if (e.key === 'vt-theme' && e.newValue) applyTheme(e.newValue, false); }); // other tabs

  /* RTL */
  const rtlBtn = $('#rtlToggle');
  function applyDir(d) {
    root.dir = d; store.set('vt-dir', d);
    if (rtlBtn) { rtlBtn.setAttribute('aria-pressed', d === 'rtl'); rtlBtn.textContent = d === 'rtl' ? 'LTR' : 'RTL'; }
    dispatchEvent(new Event('resize')); // lets maps / scenes re-measure
  }
  applyDir(root.dir === 'rtl' ? 'rtl' : (store.get('vt-dir') || 'ltr'));
  rtlBtn?.addEventListener('click', () => applyDir(root.dir === 'rtl' ? 'ltr' : 'rtl'));

  /* Loader */
  addEventListener('load', () => setTimeout(() => $('#pageLoader')?.classList.add('hide'), 450));

  /* Header, progress, back-to-top, hero parallax */
  const header = $('#siteHeader'), progress = $('#progress'), backTop = $('#backTop'), heroBg = $('.h2-hero-bg');
  function onScroll() {
    const y = scrollY, max = root.scrollHeight - innerHeight;
    header?.classList.toggle('scrolled', y > 30);
    if (progress) progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    backTop?.classList.toggle('show', y > 700);
    if (heroBg && y < innerHeight) heroBg.style.transform = `translateY(${y * .12}px) scale(1.05)`;
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  backTop?.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));

  /* Mobile menu */
  const menuBtn = $('#menuBtn'), nav = $('#mainNav');
  const setMenu = o => { nav?.classList.toggle('open', o); menuBtn?.setAttribute('aria-expanded', o); };
  menuBtn?.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  $$('.nav-link').forEach(l => l.addEventListener('click', () => setMenu(false)));

  /* Active nav = current page */
  const page = location.pathname.split('/').pop() || 'index.html';
  $$('.nav-link').forEach(l => {
    const f = (l.getAttribute('href') || '').split('/').pop();
    l.classList.toggle('active', f === page);
  });

  /* Scroll reveal — directions come from CSS (.reveal-left / .reveal-right, RTL-aware) */
  const rio = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); }
  }), { threshold: .12, rootMargin: '0px 0px -50px' });
  $$('.reveal').forEach((el, i) => { el.style.setProperty('--d', `${(i % 3) * .1}s`); rio.observe(el); });

  /* Counters */
  const cio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target, target = +el.dataset.counter, t0 = performance.now();
    const step = now => {
      const p = Math.min((now - t0) / 1400, 1);
      el.textContent = Math.floor(target * (1 - Math.pow(1 - p, 3)));
      p < 1 ? requestAnimationFrame(step) : (el.textContent = target);
    };
    requestAnimationFrame(step); cio.unobserve(el);
  }), { threshold: .5 });
  $$('[data-counter]').forEach(c => cio.observe(c));

  /* Charging type selection */
  const types = $$('.charging-type');
  types.forEach(c => c.addEventListener('click', () => {
    types.forEach(i => i.classList.remove('active')); c.classList.add('active');
    toast(`${$('h3', c)?.textContent || 'Charging'} selected`);
  }));

  /* Smart visual tilt (on the inner stage, so it never fights the reveal transform) */
  const stage = $('.smart-stage');
  if (stage && matchMedia('(pointer:fine)').matches) {
    const box = stage.parentElement;
    box.addEventListener('mousemove', e => {
      const r = box.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      stage.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${y * -8}deg)`;
    });
    box.addEventListener('mouseleave', () => { stage.style.transform = ''; });
  }
})();