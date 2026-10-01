(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;
  const store = {
    get: k => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch {} }
  };

  /* ---------- Toast ---------- */
  let toastTimer;
  const toast = msg => {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
  };

  /* ---------- Theme ---------- */
  const themeBtn = $('#themeToggle');
  const applyTheme = t => {
    root.dataset.theme = t; themeBtn.textContent = t === 'dark' ? '☀' : '☾'; store.set('vt-theme', t);
  };
  applyTheme(store.get('vt-theme') || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));
  themeBtn.addEventListener('click', () => applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'));

  /* ---------- RTL ---------- */
  const rtlBtn = $('#rtlToggle');
  const applyDir = d => {
    root.dir = d; rtlBtn.setAttribute('aria-pressed', d === 'rtl'); rtlBtn.textContent = d === 'rtl' ? 'LTR' : 'RTL';
    store.set('vt-dir', d); setTimeout(() => map && map.invalidateSize(), 350);
  };
  rtlBtn.addEventListener('click', () => applyDir(root.dir === 'rtl' ? 'ltr' : 'rtl'));

  /* ---------- Loader, header, progress, back-to-top ---------- */
  addEventListener('load', () => setTimeout(() => $('#pageLoader').classList.add('hide'), 500));
  const header = $('#siteHeader'), bar = $('#progress'), backTop = $('#backTop');
  const onScroll = () => {
    const y = scrollY, max = root.scrollHeight - innerHeight;
    header.classList.toggle('scrolled', y > 30);
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    backTop.classList.toggle('show', y > 700);
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  backTop.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));

  /* ---------- Mobile menu ---------- */
  const menuBtn = $('#menuBtn'), nav = $('#mainNav');
  const setMenu = o => { nav.classList.toggle('open', o); menuBtn.setAttribute('aria-expanded', o); };
  menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  $$('.nav-link').forEach(a => a.addEventListener('click', () => setMenu(false)));

  /* ---------- Scroll reveal (direction handled in CSS, RTL-aware) ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .15, rootMargin: '0px 0px -60px' });
  $$('.reveal').forEach((el, i) => { el.style.setProperty('--d', `${(i % 3) * .1}s`); io.observe(el); });

  /* ---------- Active nav link ---------- */
  const links = $$('.nav-link');
  const spy = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  ['home', 'about', 'stations', 'services', 'blog', 'faq', 'contact'].forEach(id => { const s = document.getElementById(id); s && spy.observe(s); });

  /* ---------- FAQ accordion ---------- */
  $$('.faq-q').forEach(q => q.addEventListener('click', () => {
    const item = q.parentElement, open = !item.classList.contains('open');
    $$('.faq-item').forEach(i => { i.classList.remove('open'); $('.faq-q', i).setAttribute('aria-expanded', false); });
    item.classList.toggle('open', open); q.setAttribute('aria-expanded', open);
  }));

  /* ---------- Stations data ---------- */
  const stations = [
    { id: 'green', name: 'GreenCharge Hub', area: 'Anna Salai · Chennai', lat: 13.0604, lng: 80.2496, status: 'available', fast: true, free: 4, total: 6, conn: 'CCS2', kw: 60, rate: 18 },
    { id: 'volt', name: 'VoltPoint Central', area: 'Guindy · Chennai', lat: 13.0067, lng: 80.2206, status: 'available', fast: true, free: 2, total: 8, conn: 'CCS2', kw: 120, rate: 21 },
    { id: 'eco', name: 'EcoSpark Marina', area: 'Adyar · Chennai', lat: 13.0012, lng: 80.2565, status: 'busy', fast: false, free: 1, total: 5, conn: 'Type 2', kw: 22, rate: 14 },
    { id: 'amp', name: 'AmpHub T. Nagar', area: 'T. Nagar · Chennai', lat: 13.0418, lng: 80.2341, status: 'available', fast: true, free: 3, total: 4, conn: 'CCS2', kw: 50, rate: 19 },
    { id: 'chargio', name: 'Chargio OMR', area: 'Thoraipakkam · Chennai', lat: 12.9516, lng: 80.2400, status: 'busy', fast: false, free: 0, total: 6, conn: 'Type 2', kw: 22, rate: 15 }
  ];
  const CENTER = [13.0275, 80.2400];
  let userPos = null;

  /* ---------- Map ---------- */
  const map = L.map('map', { zoomControl: false, scrollWheelZoom: false }).setView(CENTER, 12);
  L.control.zoom({ position: 'bottomright' }).addTo(map);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);
  // enable wheel zoom only after click so page scroll isn't hijacked
  map.on('click focus', () => map.scrollWheelZoom.enable());
  map.getContainer().addEventListener('mouseleave', () => map.scrollWheelZoom.disable());
  addEventListener('load', () => map.invalidateSize());
  new ResizeObserver(() => map.invalidateSize()).observe($('#map'));

  const group = L.layerGroup().addTo(map);
  const markers = {};
  const popupHTML = s => `<div class="pop"><h4>${s.name}</h4><small>${s.area}</small>
    <div class="pop-row"><span>⚡ ${s.conn}</span><span>${s.kw} kW</span><span>₹${s.rate}/kWh</span><span>${s.free}/${s.total} free</span></div>
    <div class="pop-actions"><button class="js-reserve" data-id="${s.id}">Reserve</button><button class="js-track" data-id="${s.id}">Track</button></div></div>`;
  stations.forEach(s => {
    markers[s.id] = L.marker([s.lat, s.lng], {
      icon: L.divIcon({ className: '', html: `<div class="pin ${s.status}"><b>⚡</b></div>`, iconSize: [38, 38], iconAnchor: [19, 38], popupAnchor: [0, -38] })
    }).bindPopup(popupHTML(s));
    markers[s.id].on('click', () => highlight(s.id));
  });

  const dist = (a, b) => map.distance(a, b);
  const km = m => (m / 1000).toFixed(1);

  /* ---------- Station list + filters ---------- */
  const listEl = $('#stationScroll');
  let filter = 'all', query = '';
  function render() {
    const origin = userPos || CENTER;
    const rows = stations.map(s => ({ ...s, d: dist(origin, [s.lat, s.lng]) })).sort((a, b) => a.d - b.d)
      .filter(s => (filter === 'all' || (filter === 'available' && s.status === 'available') || (filter === 'fast' && s.fast))
        && (s.name + s.area + s.conn).toLowerCase().includes(query));
    group.clearLayers();
    listEl.innerHTML = rows.length ? rows.map((s, i) => `
      <article class="station-card" data-id="${s.id}" style="animation-delay:${i * .06}s">
        <div class="station-top"><span class="status ${s.status}"><i></i> ${s.status === 'available' ? 'Available' : 'Busy'}</span><span class="distance">${km(s.d)} km</span></div>
        <h3>${s.name}</h3><p>${s.area}</p>
        <div class="station-meta"><span>⚡ ${s.conn}</span><span>${s.kw} kW</span><span>₹${s.rate}/kWh</span></div>
        <div class="station-bottom"><span><b>${s.free}</b> / ${s.total} chargers free</span><button class="small-arrow" aria-label="Show ${s.name} on map">→</button></div>
      </article>`).join('') : '<div class="empty">No stations match. Try a different search or filter.</div>';
    rows.forEach(s => markers[s.id].addTo(group));
  }
  function highlight(id) {
    $$('.station-card', listEl).forEach(c => c.classList.toggle('active', c.dataset.id === id));
    const c = $(`.station-card[data-id="${id}"]`, listEl); c && c.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  function focusStation(id) {
    const s = stations.find(x => x.id === id);
    map.flyTo([s.lat, s.lng], 15, { duration: 1.1 });
    map.once('moveend', () => markers[id].openPopup());
    highlight(id);
  }
  listEl.addEventListener('click', e => { const c = e.target.closest('.station-card'); if (c) { focusStation(c.dataset.id); $('#stationsMap').scrollIntoView({ block: 'center', behavior: 'smooth' }); } });
  $$('.filter-chip').forEach(b => b.addEventListener('click', () => {
    $$('.filter-chip').forEach(x => x.classList.remove('active')); b.classList.add('active'); filter = b.dataset.filter; render();
  }));
  $('#stationSearch').addEventListener('input', e => { query = e.target.value.trim().toLowerCase(); render(); });
  render();

  /* ---------- Popup actions ---------- */
  document.addEventListener('click', e => {
    const r = e.target.closest('.js-reserve'), t = e.target.closest('.js-track');
    if (r) { const s = stations.find(x => x.id === r.dataset.id); s.status === 'busy' && !s.free ? toast('No free chargers right now') : toast(`Slot reserved at ${s.name}`); }
    if (t) { map.closePopup(); startTrack(t.dataset.id); }
  });

  /* ---------- My location ---------- */
  let userMarker;
  const evIcon = L.divIcon({ className: '', html: '<div class="ev-dot"></div>', iconSize: [22, 22], iconAnchor: [11, 11] });
  function locate(cb) {
    if (!navigator.geolocation) { toast('Location is not supported in this browser'); return cb && cb(false); }
    navigator.geolocation.getCurrentPosition(p => {
      userPos = [p.coords.latitude, p.coords.longitude];
      userMarker ? userMarker.setLatLng(userPos) : (userMarker = L.marker(userPos, { icon: evIcon, zIndexOffset: 1000 }).addTo(map).bindTooltip('You are here'));
      map.flyTo(userPos, 13, { duration: 1.2 }); render(); cb && cb(true);
    }, () => { toast('Location blocked. Allow it in browser settings, or use Track my EV for a demo.'); cb && cb(false); }, { enableHighAccuracy: true, timeout: 8000 });
  }
  $('#locateBtn').addEventListener('click', () => locate());

  /* ---------- Live tracking ---------- */
  let track = null, evMarker, trail, routeLine;
  const hud = $('#hud');
  const fmtEta = m => m < 1 ? '<1 min' : m < 60 ? `${Math.round(m)} min` : `${Math.floor(m / 60)}h ${Math.round(m % 60)}m`;

  async function getRoute(from, to) {
    try {
      const u = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
      const j = await (await fetch(u)).json();
      return j.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
    } catch { return [from, to]; } // fallback: straight line
  }

  async function startTrack(id) {
    stopTrack(true);
    const s = stations.find(x => x.id === id) || stations.slice().sort((a, b) => dist(userPos || CENTER, [a.lat, a.lng]) - dist(userPos || CENTER, [b.lat, b.lng]))[0];
    // demo start point if the user's location is unknown or too far away to simulate
    let from = userPos && dist(userPos, [s.lat, s.lng]) < 40000 ? userPos : [13.0827, 80.2707];
    const to = [s.lat, s.lng];
    toast('Finding the best route…');
    const pts = await getRoute(from, to);
    const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + dist(pts[i - 1], pts[i]));
    const total = cum[cum.length - 1];
    routeLine = L.polyline(pts, { color: '#3b9bff', weight: 5, opacity: .35, dashArray: '2 10', lineCap: 'round' }).addTo(map);
    trail = L.polyline([pts[0]], { color: '#3b9bff', weight: 6, opacity: .95 }).addTo(map);
    evMarker = L.marker(pts[0], { icon: evIcon, zIndexOffset: 2000 }).addTo(map);
    map.fitBounds(routeLine.getBounds(), { padding: [70, 70] });
    $('#hudDest').textContent = `Heading to ${s.name}`;
    hud.hidden = false; $('#trackBtn').classList.add('on'); $('#trackBtn').textContent = '■ Stop tracking';
    track = { s, pts, cum, total, d: 0, last: performance.now(), bat: 42, raf: 0, dur: Math.min(40, Math.max(18, total / 250)) };
    const step = now => {
      const t = track; if (!t) return;
      const dt = (now - t.last) / 1000; t.last = now;
      t.d = Math.min(t.total, t.d + (t.total / t.dur) * dt);
      let i = 1; while (i < t.cum.length - 1 && t.cum[i] < t.d) i++;
      const seg = (t.d - t.cum[i - 1]) / ((t.cum[i] - t.cum[i - 1]) || 1);
      const pos = [t.pts[i - 1][0] + (t.pts[i][0] - t.pts[i - 1][0]) * seg, t.pts[i - 1][1] + (t.pts[i][1] - t.pts[i - 1][1]) * seg];
      evMarker.setLatLng(pos); trail.setLatLngs([...t.pts.slice(0, i), pos]);
      if (!map.getBounds().pad(-.1).contains(pos)) map.panTo(pos, { animate: true });
      const left = t.total - t.d, speed = left < 80 ? 0 : 34 + Math.sin(now / 900) * 8;
      $('#hudEta').textContent = fmtEta(left / 1000 / 38 * 60);
      $('#hudDist').textContent = `${km(left)} km`;
      $('#hudSpeed').textContent = `${Math.round(speed)} km/h`;
      $('#hudBat').textContent = `${Math.max(8, Math.round(t.bat - 6 * t.d / t.total))}%`;
      $('#hudBar').style.width = `${t.d / t.total * 100}%`;
      if (t.d >= t.total) { toast(`You've arrived at ${t.s.name}`); markers[t.s.id].openPopup(); $('#hudEta').textContent = 'Arrived'; t.raf = 0; return; }
      t.raf = requestAnimationFrame(step);
    };
    track.raf = requestAnimationFrame(step);
  }
  function stopTrack(silent) {
    if (track) cancelAnimationFrame(track.raf);
    track = null;
    [evMarker, trail, routeLine].forEach(l => l && map.removeLayer(l)); evMarker = trail = routeLine = null;
    hud.hidden = true; $('#trackBtn').classList.remove('on'); $('#trackBtn').textContent = '▶ Track my EV';
    if (!silent) toast('Tracking stopped');
  }
  $('#trackBtn').addEventListener('click', () => track ? stopTrack() : startTrack());
  $('#hudStop').addEventListener('click', () => stopTrack());

  /* ---------- Init direction last (needs map defined) ---------- */
  applyDir(store.get('vt-dir') || 'ltr');
})();