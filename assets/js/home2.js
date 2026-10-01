(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const whenVisible = (el, cb) => new IntersectionObserver(es => es.forEach(e => cb(e.isIntersecting)), { threshold: .05 }).observe(el);

  /* =====================================================
     1. EV ROAD SCENE — parallax city, car brakes to a
        charger, charges, then drives off again
  ===================================================== */
  const scene = $('#evScene');
  if (scene) {
    const mask = svg => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
    scene.style.setProperty('--m-far', mask(
      `<svg xmlns='http://www.w3.org/2000/svg' width='640' height='130'><path d='M0 130V74h34V52h46v30h22V28h48v54h26V60h38V84h30V40h54v44h26V56h42v28h30V34h44v50h32V68h54v62z'/><path d='M96 28V10h3v18zM402 40V14h3v26z'/></svg>`));
    scene.style.setProperty('--m-mid', mask(
      `<svg xmlns='http://www.w3.org/2000/svg' width='420' height='84'><path d='M0 84V52h40V36h56v28h28V44h50V70h34V30h60v36h32V50h46v34z'/><path d='M150 44V14h3v30zM148 16h8v3h-8z'/></svg>`));

    const el = {
      far: $('.sc-far', scene), mid: $('.sc-mid', scene), road: $('.sc-road', scene),
      car: $('#scCar'), st: $('#scStation'), state: $('#scState'), speed: $('#scSpeed'), pct: $('#scPct'), bar: $('#scBar')
    };
    const wheels = [...scene.querySelectorAll('.wheel')];
    const VMAX = 300, ACC = 220, DEC = 190;
    let W = scene.clientWidth, x = { far: 0, mid: 0, road: 0 };
    let v = 0, phase = 'go', t = 0, bat = 22, stX = W * .9 + 500, rot = 0, last = 0, running = false;

    const setX = (node, val, size) => node.style.setProperty('--x', `${((val % size) + size) % size}px`);
    const stopX = () => el.car.offsetLeft + el.car.offsetWidth * .93;       // station parks just ahead of the nose
    const labels = { go: 'Cruising', brake: 'Arriving', charge: 'Fast charging' };

    function draw(dt, now) {
      x.far -= v * .1 * dt; x.mid -= v * .35 * dt; x.road -= v * dt;
      setX(el.far, x.far, 640); setX(el.mid, x.mid, 420); setX(el.road, x.road, 98);
      stX -= v * dt;
      el.st.style.transform = `translateX(${stX}px)`;
      rot += (v * dt / 14) * 57.3;
      wheels.forEach(w => w.setAttribute('transform', `rotate(${rot} ${w.dataset.cx} 64)`));
      el.car.style.transform = `translateY(${v > 8 ? Math.sin(now / 80) * .7 : 0}px)`;
      el.car.classList.toggle('run', v > 8 || phase === 'go');
      el.car.classList.toggle('brake', phase === 'brake');
      el.car.classList.toggle('charging', phase === 'charge');
      el.st.classList.toggle('on', phase === 'charge');
      el.state.textContent = labels[phase];
      el.speed.textContent = phase === 'charge' ? '120 kW' : `${Math.round(v / VMAX * 64)} km/h`;
      el.pct.textContent = `${Math.round(bat)}%`; el.bar.style.width = `${bat}%`;
    }

    function loop(now) {
      if (!running) return;
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      const dist = stX - stopX();
      if (phase === 'go') {
        v = Math.min(VMAX, v + ACC * dt); bat = Math.max(8, bat - 1.1 * dt);
        if (dist > 0 && dist < (v * v) / (2 * DEC) + 6) phase = 'brake';
      } else if (phase === 'brake') {
        v = Math.min(VMAX, Math.sqrt(2 * DEC * Math.max(0, dist)));
        if (dist <= 1 || v < 6) { v = 0; phase = 'charge'; t = 0; }
      } else {
        bat = Math.min(100, bat + 15 * dt); t += dt;
        if (t > 4.6) phase = 'go';
      }
      if (stX < -200) { stX = W + 700 + Math.random() * 500; bat = 18 + Math.random() * 12; }
      draw(dt, now);
      requestAnimationFrame(loop);
    }

    const start = () => { if (running) return; running = true; last = performance.now(); requestAnimationFrame(loop); };
    addEventListener('resize', () => { W = scene.clientWidth; });
    if (reduce) { stX = stopX(); phase = 'charge'; bat = 64; draw(0, 0); }
    else whenVisible(scene, on => { running = false; if (on) start(); });
  }

  /* =====================================================
     2. NETWORK MAP — real Leaflet map, live stations,
        moving EVs, activity feed and ticking metrics
  ===================================================== */
  const mapEl = $('#netMap');
  if (mapEl && window.L) {
    const map = L.map(mapEl, { zoomControl: false, scrollWheelZoom: false }).setView([13.02, 80.2], 11);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    map.on('click', () => map.scrollWheelZoom.enable());
    mapEl.addEventListener('mouseleave', () => map.scrollWheelZoom.disable());
    new ResizeObserver(() => map.invalidateSize()).observe(mapEl);
    setTimeout(() => map.invalidateSize(), 1200); // after the reveal animation finishes

    const names = [['Anna Nagar', 13.085, 80.2101], ['T. Nagar', 13.0418, 80.2341], ['Guindy', 13.0067, 80.2206], ['Adyar', 13.0012, 80.2565],
      ['Velachery', 12.9815, 80.218], ['Thoraipakkam', 12.9516, 80.24], ['Egmore', 13.0732, 80.2609], ['Mylapore', 13.0368, 80.2676],
      ['Porur', 13.0382, 80.1565], ['Tambaram', 12.9249, 80.1], ['Ambattur', 13.1143, 80.1548], ['Perambur', 13.1186, 80.233], ['Sholinganallur', 12.901, 80.2279]];
    const init = ['free', 'charging', 'free', 'charging', 'free', 'free', 'offline', 'charging', 'free', 'free', 'charging', 'free', 'offline'];
    const label = { free: 'Available', charging: 'Charging now', offline: 'Offline' };
    const S = names.map(([n, la, ln], i) => ({ n, ll: [la, ln], st: init[i] }));
    const icon = s => L.divIcon({ className: '', html: `<div class="ns ${s.st}"><i></i></div>`, iconSize: [22, 22], iconAnchor: [11, 11], popupAnchor: [0, -10] });
    S.forEach(s => { s.m = L.marker(s.ll, { icon: icon(s) }).addTo(map).bindPopup(() => `<div class="pop"><h4>${s.n}</h4><small>${label[s.st]}</small></div>`); });
    const setSt = (s, st) => { s.st = st; s.m.setIcon(icon(s)); };

    // activity feed
    const feed = $('#netFeed');
    const log = msg => {
      const li = document.createElement('li'); li.textContent = msg; feed.prepend(li);
      while (feed.children.length > 3) feed.lastChild.remove();
    };
    log('Network online · Chennai');

    // moving EVs
    const evIcon = L.divIcon({ className: '', html: '<div class="nv"></div>', iconSize: [12, 12], iconAnchor: [6, 6] });
    const pick = (not) => { let k; do { k = Math.floor(Math.random() * S.length); } while (k === not || S[k].st === 'offline'); return k; };
    const V = Array.from({ length: 7 }, (_, i) => {
      const a = i % S.length, b = pick(a);
      return { a, b, p: Math.random() * .8, sp: .05 + Math.random() * .04,
        m: L.marker(S[a].ll, { icon: evIcon, interactive: false, zIndexOffset: 500 }).addTo(map),
        ln: L.polyline([S[a].ll, S[b].ll], { color: '#3b9bff', weight: 2, opacity: .35, dashArray: '4 7' }).addTo(map) };
    });
    function arrive(v) {
      const s = S[v.b]; v.a = v.b; v.b = pick(v.a); v.p = 0; v.ln.setLatLngs([S[v.a].ll, S[v.b].ll]);
      if (s.st === 'free') {
        setSt(s, 'charging'); log(`Session started · ${s.n}`);
        setTimeout(() => { if (s.st === 'charging') { setSt(s, 'free'); log(`Session complete · ${s.n}`); } }, 5000 + Math.random() * 5000);
      }
    }
    let on = false, last = 0;
    function tick(now) {
      if (!on) return;
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      V.forEach(v => {
        v.p += v.sp * dt; if (v.p >= 1) arrive(v);
        const A = S[v.a].ll, B = S[v.b].ll;
        v.m.setLatLng([A[0] + (B[0] - A[0]) * v.p, A[1] + (B[1] - A[1]) * v.p]);
      });
      requestAnimationFrame(tick);
    }
    if (!reduce) whenVisible(mapEl, vis => { on = vis; if (vis) { last = performance.now(); requestAnimationFrame(tick); } });

    // ticking metrics
    const m = { st: $('#mStations'), se: $('#mSessions'), en: $('#mEnergy'), co: $('#mCo2') };
    let en = 84.6, co = 28.4;
    setInterval(() => {
      if (!on && !reduce) return;
      const ch = S.filter(s => s.st === 'charging').length, off = S.filter(s => s.st === 'offline').length;
      en += .07 + Math.random() * .05; co += .02;
      m.st.textContent = 238 - off; m.se.textContent = 470 + ch * 4 + Math.round(Math.random() * 6);
      m.en.textContent = `${en.toFixed(1)} MWh`; m.co.textContent = `${co.toFixed(1)} T`;
    }, 2000);
  }
})();