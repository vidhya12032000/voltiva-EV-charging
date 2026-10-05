/* =========================================================
   VOLTIVA — STATIONS PAGE JS
   This page does NOT load main.js, so this file owns:
   loader, theme, RTL, mobile menu, header state, back-to-top,
   plus stations, filters, map, dialog, hero scene and journey.
========================================================= */

(() => {
  "use strict";

  /* =======================================================
     UTILITIES
  ======================================================= */

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const cap = (v) => v.charAt(0).toUpperCase() + v.slice(1);

  const esc = (v) =>
    String(v).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));

  const root = document.documentElement;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  const store = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage blocked */ }
    }
  };

  // plain-string storage for theme / direction (shared with the other pages)
  const plain = {
    get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
    set(key, val) { try { localStorage.setItem(key, val); } catch (e) { /* storage blocked */ } }
  };

  // Small seeded random so every station always draws the same artwork
  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function haversine(a, b) {
    const R = 6371;
    const rad = (d) => (d * Math.PI) / 180;
    const dLat = rad(b.lat - a.lat);
    const dLng = rad(b.lng - a.lng);
    const x =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(x));
  }


  /* =======================================================
     DATA
     Tip: add  image: "../assets/img/stations/green.jpg"  to any
     station to use a real photo. If the file is missing, the
     generated illustration is shown automatically.
  ======================================================= */

  const stations = [
    {
      id: "green", name: "GreenCharge Hub", area: "Anna Salai · Chennai",
      status: "available", fast: true, free: 4, total: 6,
      connector: "CCS2", power: 60, rate: 18,
      lat: 13.0604, lng: 80.2496, rating: 4.7,
      variant: "dusk", amenities: ["Café", "Wi-Fi", "Restroom"],
      map: { x: 32, y: 35 }
    },
    {
      id: "volt", name: "VoltPoint Central", area: "Guindy · Chennai",
      status: "available", fast: true, free: 2, total: 8,
      connector: "CCS2", power: 120, rate: 21,
      lat: 13.0067, lng: 80.2206, rating: 4.8,
      variant: "night", amenities: ["Lounge", "Wi-Fi", "Solar"],
      map: { x: 62, y: 26 }
    },
    {
      id: "eco", name: "EcoSpark Marina", area: "Adyar · Chennai",
      status: "busy", fast: false, free: 1, total: 5,
      connector: "Type 2", power: 22, rate: 14,
      lat: 13.0012, lng: 80.2565, rating: 4.4,
      variant: "day", amenities: ["Solar", "Parking"],
      map: { x: 20, y: 57 }
    },
    {
      id: "amp", name: "AmpHub T. Nagar", area: "T. Nagar · Chennai",
      status: "available", fast: true, free: 3, total: 4,
      connector: "CCS2", power: 50, rate: 19,
      lat: 13.0418, lng: 80.2341, rating: 4.6,
      variant: "dawn", amenities: ["Café", "Mall access"],
      map: { x: 50, y: 60 }
    },
    {
      id: "chargio", name: "Chargio OMR", area: "Thoraipakkam · Chennai",
      status: "busy", fast: false, free: 0, total: 6,
      connector: "Type 2", power: 22, rate: 15,
      lat: 12.941, lng: 80.236, rating: 4.3,
      variant: "forest", amenities: ["Restroom", "Snacks"],
      map: { x: 80, y: 76 }
    },
    {
      id: "zap", name: "ZapNest Velachery", area: "Velachery · Chennai",
      status: "offline", fast: false, free: 0, total: 4,
      connector: "Type 2", power: 22, rate: 13,
      lat: 12.9815, lng: 80.218, rating: 4.1,
      variant: "day", amenities: ["Wi-Fi"],
      map: { x: 36, y: 81 }
    },
    {
      id: "air", name: "Voltiva Airport Hub", area: "Meenambakkam · Chennai",
      status: "available", fast: true, free: 5, total: 8,
      connector: "CCS2", power: 150, rate: 23,
      lat: 12.9941, lng: 80.1709, rating: 4.9,
      variant: "night", amenities: ["Lounge", "24×7", "Wi-Fi"],
      map: { x: 82, y: 44 }
    }
  ];

  const byId = (id) => stations.find((s) => s.id === id);


  /* =======================================================
     DOM + STATE
  ======================================================= */

  const results = $("#stationResults");
  const resultCount = $("#resultCount");
  const searchInput = $("#stationSearch");
  const statusFilter = $("#statusFilter");
  const chargerFilter = $("#chargerFilter");
  const connectorFilter = $("#connectorFilter");
  const sortFilter = $("#sortFilter");
  const clearFilters = $("#clearFilters");
  const noResults = $("#noResults");
  const resetSearch = $("#resetSearch");
  const cardViewBtn = $("#cardViewBtn");
  const mapViewBtn = $("#mapViewBtn");
  const stationLayout = $(".station-layout");
  const quickFilters = $$(".quick-filter");
  const dialog = $("#reserveDialog");

  const state = {
    quick: "all",
    sort: "recommended",
    user: null,
    saved: new Set(store.get("voltiva-saved", []))
  };

  let currentList = stations.slice();


  /* =======================================================
     SITE CHROME: theme, RTL, mobile menu
     (owned here because this page does not load main.js)
  ======================================================= */

  // The CSS default is dark, so "no saved theme" means dark.
  function currentTheme() {
    const t = root.getAttribute("data-theme");
    return t === "light" || t === "dark" ? t : "dark";
  }

  function applyTheme(t) {
    root.setAttribute("data-theme", t);
    root.classList.remove("light", "dark");
    root.classList.add(t);
    const btn = $("#themeToggle");
    if (btn) {
      btn.textContent = t === "dark" ? "☾" : "☀";
      btn.setAttribute("aria-label", t === "dark" ? "Switch to light theme" : "Switch to dark theme");
    }
  }

  function initTheme() {
    applyTheme(currentTheme());
    $("#themeToggle")?.addEventListener("click", () => {
      const next = currentTheme() === "dark" ? "light" : "dark";
      applyTheme(next);
      plain.set("voltiva-theme", next);
    });
  }

  function initRTL() {
    const btn = $("#rtlToggle");
    const sync = () => btn?.setAttribute("aria-pressed", String(root.getAttribute("dir") === "rtl"));
    sync();

    btn?.addEventListener("click", () => {
      const rtl = root.getAttribute("dir") !== "rtl";
      root.setAttribute("dir", rtl ? "rtl" : "ltr");
      plain.set("voltiva-dir", rtl ? "rtl" : "ltr");
      sync();
    });
  }

  function initMobileMenu() {
    const menuBtn = $("#menuBtn");
    const nav = $("#mainNav");
    if (!menuBtn || !nav) return;

    const setMenu = (open) => {
      nav.classList.toggle("open", open);
      nav.classList.toggle("is-open", open);
      menuBtn.setAttribute("aria-expanded", String(open));
      menuBtn.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
    };

    menuBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      setMenu(!nav.classList.contains("open"));
    });

    $$(".nav-link", nav).forEach((link) => link.addEventListener("click", () => setMenu(false)));

    document.addEventListener("click", (e) => {
      if (nav.classList.contains("open") && !nav.contains(e.target) && !menuBtn.contains(e.target)) {
        setMenu(false);
      }
    });

    document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
    window.addEventListener("resize", () => { if (window.innerWidth > 900) setMenu(false); });
  }


  /* =======================================================
     CAR ILLUSTRATION (used in hero, journey, map, scroll road, CTA)
  ======================================================= */

  function carSVG(uid, opts = {}) {
    const wheel = (cx) => `
      <circle cx="${cx}" cy="68" r="21" fill="#08100c"/>
      <g class="car-wheel" data-cx="${cx}">
        <circle cx="${cx}" cy="68" r="17" fill="#121a16"/>
        <circle cx="${cx}" cy="68" r="11.5" fill="#d3dcd7"/>
        <path d="M${cx} 57V79M${cx - 11} 68H${cx + 11}M${cx - 7.8} 60.2L${cx + 7.8} 75.8M${cx + 7.8} 60.2L${cx - 7.8} 75.8" stroke="#7d8c85" stroke-width="2.4" stroke-linecap="round"/>
        <circle cx="${cx}" cy="68" r="4.2" fill="#2a3832"/>
      </g>`;

    return `
    <svg class="ev-car ${opts.cls || ""}" viewBox="0 0 262 96" ${opts.attrs || ""} aria-hidden="true">
      <defs>
        <linearGradient id="${uid}-b" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#f6fff0"/>
          <stop offset=".42" stop-color="#b6f035"/>
          <stop offset="1" stop-color="#3f7d2a"/>
        </linearGradient>
        <linearGradient id="${uid}-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#d8ecff" stop-opacity=".95"/>
          <stop offset=".5" stop-color="#2a4a63"/>
          <stop offset="1" stop-color="#0c1a26"/>
        </linearGradient>
        <linearGradient id="${uid}-h" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#fff7c2" stop-opacity=".8"/>
          <stop offset="1" stop-color="#fff7c2" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <ellipse cx="131" cy="86" rx="122" ry="5" fill="#000" opacity=".32"/>
      <polygon class="car-beam" points="248,54 470,4 470,106 248,62" fill="url(#${uid}-h)"/>
      <path d="M6 66C5 56 10 50 24 47L58 41C74 22 100 14 132 14C164 14 186 22 204 38L238 46C252 50 257 57 257 66V70H6Z" fill="url(#${uid}-b)"/>
      <path d="M24 47C70 39 190 39 238 47" stroke="#fff" stroke-opacity=".3" stroke-width="2" fill="none"/>
      <path d="M72 42C84 28 104 21 128 21V42Z" fill="url(#${uid}-g)"/>
      <path d="M134 21C156 21 176 28 192 42H134Z" fill="url(#${uid}-g)"/>
      <path d="M84 26C100 17 120 15 140 15" stroke="#fff" stroke-opacity=".6" fill="none" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M131 42V66" stroke="#1e3b14" stroke-opacity=".35" stroke-width="1.5"/>
      <rect x="70" y="66" width="122" height="4" rx="2" fill="#17301a" opacity=".45"/>
      <rect class="car-head" x="242" y="50" width="14" height="4" rx="2" fill="#fffbd0"/>
      <rect class="car-tail" x="6" y="52" width="10" height="4" rx="2" fill="#ff4d5a"/>
      <circle class="car-port" cx="224" cy="52" r="3.2" fill="#2a3832"/>
      ${wheel(62)}
      ${wheel(200)}
    </svg>`;
  }


  /* =======================================================
     STATION ARTWORK (generated SVG "photos")
  ======================================================= */

  const CAR_COLORS = ["#4ea8ff", "#ff7a6b", "#e8eef0", "#a78bfa", "#ffd166"];
  const SKIES = ["day", "dusk", "night", "dawn", "forest"];

  function stationArt(s) {
    const v = SKIES.includes(s.variant) ? s.variant : "day";
    const r = rng(hash(s.id));
    const offline = s.status === "offline";
    const n = clamp(Math.ceil(s.total / 2), 2, 4);
    const px = (i) => 200 - (n - 1) * 34 + i * 68;
    const f = (num) => num.toFixed(1);

    /* skyline or pines */
    let back = "";
    if (v === "forest") {
      for (let i = 0; i < 17; i++) {
        const x = i * 25 - 8 + r() * 8;
        const h = 46 + r() * 52;
        back += `<path d="M${f(x)} 172L${f(x + 14)} ${f(172 - h)}L${f(x + 28)} 172Z" class="art-pine"/>`;
      }
    } else {
      let x = -10;
      while (x < 410) {
        const w = 22 + r() * 28;
        const h = 34 + r() * 72;
        back += `<rect x="${f(x)}" y="${f(172 - h)}" width="${f(w)}" height="${f(h)}" class="art-bld"/>`;
        if (v === "night" || v === "dusk") {
          for (let k = 0; k < 3; k++) {
            back += `<rect x="${f(x + 4 + r() * (w - 10))}" y="${f(172 - h + 6 + r() * (h - 14))}" width="3" height="3" class="art-win" style="animation-delay:${f(r() * 4)}s"/>`;
          }
        }
        x += w + 2 + r() * 6;
      }
    }

    /* stars, sun / moon, clouds */
    let sky = "";
    if (v === "night") {
      for (let i = 0; i < 18; i++) {
        sky += `<circle cx="${Math.round(r() * 400)}" cy="${Math.round(r() * 110)}" r="${f(0.6 + r() * 1.1)}" class="art-star" style="animation-delay:${f(r() * 3)}s"/>`;
      }
    }
    const orb = {
      day: `<circle cx="318" cy="52" r="22" class="art-sun"/>`,
      dusk: `<circle cx="92" cy="146" r="30" class="art-sun warm"/>`,
      dawn: `<circle cx="312" cy="146" r="28" class="art-sun warm"/>`,
      night: `<circle cx="322" cy="48" r="15" class="art-moon"/>`,
      forest: `<circle cx="72" cy="46" r="18" class="art-sun"/>`
    }[v];
    if (v !== "night") {
      sky += `<g class="art-cloud"><ellipse cx="90" cy="48" rx="26" ry="8"/><ellipse cx="108" cy="42" rx="16" ry="9"/></g>
              <g class="art-cloud slow"><ellipse cx="250" cy="76" rx="22" ry="7"/><ellipse cx="264" cy="71" rx="13" ry="8"/></g>`;
    }

    /* pylons, parked cars, cables */
    const occupied = offline ? 0 : Math.min(n, Math.round(((s.total - s.free) / s.total) * n));
    const firstFree = occupied < n ? occupied : -1;
    let pylons = "";
    let cars = "";
    for (let i = 0; i < n; i++) {
      const x = px(i);
      const st = offline ? "offline" : i < occupied ? "busy" : "free";
      pylons += `
        <rect x="${x - 10}" y="124" width="20" height="48" rx="5" class="art-pylon"/>
        <rect x="${x - 6}" y="130" width="12" height="13" rx="2" class="art-screen ${st}"/>
        <circle cx="${x}" cy="150" r="2.2" class="art-led ${st}"/>
        <rect x="${x - 10}" y="159" width="20" height="3" class="art-fascia"/>`;

      if (st === "busy") {
        const color = CAR_COLORS[(i + hash(s.id)) % CAR_COLORS.length];
        cars += `
          <use href="#sv-car" x="${x - 86}" y="154" width="76" height="27" class="art-car" style="color:${color}"/>
          <path d="M${x - 10} 140C${x - 30} 150 ${x - 28} 160 ${x - 20} 166" class="art-cable"/>`;
      }
      if (i === firstFree && !offline && s.free > 0) {
        cars += `<use href="#sv-car" x="${x - 86}" y="154" width="76" height="27" class="art-car art-car-arrive" style="color:${CAR_COLORS[(i + 2) % CAR_COLORS.length]}"/>`;
      }
    }

    const lamps = (v === "night" || v === "dusk" || v === "dawn")
      ? [18, 382].map((x) => `<rect x="${x - 2}" y="118" width="4" height="62" class="art-post"/><circle cx="${x}" cy="118" r="15" class="art-lampglow"/><circle cx="${x}" cy="118" r="3" fill="#fff3c4"/>`).join("")
      : "";

    return `
    <svg class="station-art ${v}${offline ? " is-off" : ""}" viewBox="0 0 400 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="400" height="180" fill="url(#sky-${v})"/>
      ${sky}${orb}${back}
      <rect y="166" width="400" height="14" class="art-ground"/>
      <path d="M0 173H400" class="art-line"/>
      <path d="M62 121L40 168H360L338 121Z" class="art-beam"/>
      <rect x="60" y="121" width="5" height="47" class="art-post"/>
      <rect x="335" y="121" width="5" height="47" class="art-post"/>
      <rect x="56" y="108" width="288" height="13" rx="3" class="art-fascia"/>
      <text x="200" y="118" text-anchor="middle" class="art-fascia-t">VOLTIVA</text>
      <rect x="64" y="121" width="272" height="3" rx="1.5" class="art-lightbar"/>
      ${lamps}${pylons}${cars}
      ${offline ? `<rect width="400" height="180" class="art-dim"/><rect x="138" y="72" width="124" height="34" rx="9" class="art-off-tag"/><text x="200" y="94" text-anchor="middle" class="art-off-text">OFFLINE</text>` : ""}
    </svg>`;
  }


  /* =======================================================
     TOAST
  ======================================================= */

  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
  }


  /* =======================================================
     STATION CARDS + FILTERS
  ======================================================= */

  const CITY = { lat: 13.0827, lng: 80.2707 }; // central Chennai fallback

  function cardHTML(s, i) {
    const d = state.user ? haversine(state.user, s) : null;
    const saved = state.saved.has(s.id);
    const pct = Math.round((s.free / s.total) * 100);
    const canReserve = s.status !== "offline" && s.free > 0;
    return `
    <article class="station-card" data-id="${s.id}" style="--i:${i}">
      <div class="station-media">
        ${s.image ? `<img class="station-photo" src="${esc(s.image)}" alt="" loading="lazy" onerror="this.remove()">` : ""}
        ${stationArt(s)}
        <span class="station-status ${s.status}">${cap(s.status)}</span>
        <button class="save-btn ${saved ? "on" : ""}" type="button" data-save="${s.id}" aria-pressed="${saved}" aria-label="${saved ? "Remove" : "Save"} ${esc(s.name)}">${saved ? "♥" : "♡"}</button>
        ${s.fast ? `<span class="media-chip chip-fast">⚡ Fast</span>` : ""}
        ${d != null ? `<span class="media-chip chip-dist">${d.toFixed(1)} km</span>` : ""}
      </div>
      <div class="station-body">
        <div class="station-top">
          <div><h3 class="station-name">${esc(s.name)}</h3><div class="station-area">${esc(s.area)}</div></div>
          <span class="station-rating">★ ${s.rating}</span>
        </div>
        <ul class="station-amenities">${s.amenities.map((a) => `<li>${esc(a)}</li>`).join("")}</ul>
        <div class="station-details">
          <div class="station-detail"><span>Connector</span><strong>${esc(s.connector)}</strong></div>
          <div class="station-detail"><span>Power</span><strong>${s.power} kW</strong></div>
          <div class="station-detail"><span>Free bays</span><strong><span class="js-free">${s.free}</span>/${s.total}</strong></div>
        </div>
        <div class="station-progress"><span style="--charge:${pct}%"></span></div>
        <div class="station-bottom">
          <div class="station-price">₹${s.rate}<small> /kWh</small></div>
          <button class="reserve-btn" type="button" data-reserve="${s.id}" ${canReserve ? "" : "disabled"}>${s.status === "offline" ? "Offline" : s.free === 0 ? "Full" : "Reserve"}</button>
        </div>
      </div>
    </article>`;
  }

  function matches(s) {
    const q = searchInput.value.trim().toLowerCase();
    if (q) {
      const hay = [s.name, s.area, s.connector, s.status, ...s.amenities].join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (state.quick === "available" && s.status !== "available") return false;
    if (state.quick === "fast" && !s.fast) return false;
    if (state.quick === "saved" && !state.saved.has(s.id)) return false;
    if (statusFilter.value !== "all" && s.status !== statusFilter.value) return false;
    if (chargerFilter.value === "fast" && !s.fast) return false;
    if (chargerFilter.value === "standard" && s.fast) return false;
    if (connectorFilter.value !== "all" && s.connector !== connectorFilter.value) return false;
    return true;
  }

  function sortList(list) {
    const u = state.user || CITY;
    const rank = { available: 0, busy: 1, offline: 2 };
    const fns = {
      recommended: (a, b) => rank[a.status] - rank[b.status] || b.rating - a.rating,
      nearest: (a, b) => haversine(u, a) - haversine(u, b),
      cheapest: (a, b) => a.rate - b.rate,
      fastest: (a, b) => b.power - a.power,
      free: (a, b) => b.free - a.free
    };
    return list.slice().sort(fns[sortFilter.value] || fns.recommended);
  }

  function render() {
    currentList = sortList(stations.filter(matches));
    results.innerHTML = currentList.map(cardHTML).join("");
    resultCount.textContent = `${currentList.length} of ${stations.length} stations`;
    noResults.hidden = currentList.length > 0;
    const ids = new Set(currentList.map((s) => s.id));
    $$(".map-node").forEach((n) => n.classList.toggle("is-dim", !ids.has(n.dataset.id)));
    quickFilters.forEach((b) => {
      const on = b.dataset.filter === state.quick;
      b.classList.toggle("active", on);
      b.setAttribute("aria-pressed", String(on));
    });
  }

  function resetAll() {
    searchInput.value = "";
    statusFilter.value = chargerFilter.value = connectorFilter.value = "all";
    sortFilter.value = "recommended";
    state.quick = "all";
    render();
  }

  function initFilters() {
    searchInput.addEventListener("input", render);
    [statusFilter, chargerFilter, connectorFilter, sortFilter].forEach((el) => el.addEventListener("change", render));
    clearFilters.addEventListener("click", resetAll);
    resetSearch.addEventListener("click", resetAll);

    quickFilters.forEach((b) => b.addEventListener("click", () => {
      state.quick = b.dataset.filter;
      render();
    }));

    results.addEventListener("click", (e) => {
      const save = e.target.closest("[data-save]");
      if (save) {
        const id = save.dataset.save;
        state.saved.has(id) ? state.saved.delete(id) : state.saved.add(id);
        store.set("voltiva-saved", [...state.saved]);
        toast(state.saved.has(id) ? "Saved to your list" : "Removed from saved");
        if (state.quick === "saved") render();
        else {
          const on = state.saved.has(id);
          save.classList.toggle("on", on);
          save.textContent = on ? "♥" : "♡";
          save.setAttribute("aria-pressed", String(on));
        }
        return;
      }
      const res = e.target.closest("[data-reserve]");
      if (res) openReserve(res.dataset.reserve);
    });

    // spotlight tilt (desktop only)
    if (finePointer && !reduced) {
      results.addEventListener("pointermove", (e) => {
        const card = e.target.closest(".station-card");
        if (!card) return;
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        card.style.setProperty("--mx", x * 100 + "%");
        card.style.setProperty("--my", y * 100 + "%");
        card.style.setProperty("--ry", (x - 0.5) * 6 + "deg");
        card.style.setProperty("--rx", (0.5 - y) * 6 + "deg");
      });
      results.addEventListener("pointerout", (e) => {
        const card = e.target.closest(".station-card");
        if (!card) return;
        card.style.setProperty("--rx", "0deg");
        card.style.setProperty("--ry", "0deg");
      });
    }

    // view switch
    const setView = (map) => {
      stationLayout.classList.toggle("map-mode", map);
      stationLayout.classList.toggle("card-mode", !map);
      cardViewBtn.classList.toggle("active", !map);
      mapViewBtn.classList.toggle("active", map);
      cardViewBtn.setAttribute("aria-pressed", String(!map));
      mapViewBtn.setAttribute("aria-pressed", String(map));
    };
    cardViewBtn.addEventListener("click", () => setView(false));
    mapViewBtn.addEventListener("click", () => setView(true));

    // near me
    const btn = $("#locateBtn");
    btn?.addEventListener("click", () => {
      const done = (loc, msg) => {
        state.user = loc;
        btn.classList.remove("loading");
        sortFilter.value = "nearest";
        render();
        toast(msg);
      };
      if (!navigator.geolocation) return done(CITY, "Location unavailable, using central Chennai");
      btn.classList.add("loading");
      navigator.geolocation.getCurrentPosition(
        (p) => done({ lat: p.coords.latitude, lng: p.coords.longitude }, "Sorted by distance from you"),
        () => done(CITY, "Location blocked, using central Chennai"),
        { timeout: 8000 }
      );
    });
  }


  /* =======================================================
     MAP
  ======================================================= */

  function initMap() {
    const map = $("#stationMap");
    const pop = $("#mapPop");
    if (!map) return;

    $("#mapNodes").innerHTML = stations.map((s) => `
      <button class="map-node ${s.status}" type="button" data-id="${s.id}" style="left:${s.map.x}%;top:${s.map.y}%" aria-label="${esc(s.name)}, ${s.status}"><span></span></button>
      <span class="map-label" style="left:${s.map.x}%;top:calc(${s.map.y}% + 22px)">${esc(s.name)}</span>`).join("");

    map.addEventListener("click", (e) => {
      const node = e.target.closest(".map-node");
      if (!node) { pop.hidden = true; return; }
      const s = byId(node.dataset.id);
      pop.innerHTML = `<strong>${esc(s.name)}</strong><span class="pop-st ${s.status}">${cap(s.status)}</span><br><small>${s.free}/${s.total} bays · ${s.power} kW · ₹${s.rate}/kWh</small>`;
      pop.style.left = s.map.x + "%";
      pop.style.top = s.map.y + "%";
      pop.hidden = false;
      const card = $(`.station-card[data-id="${s.id}"]`);
      if (card && stationLayout.classList.contains("card-mode")) {
        card.scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" });
        card.classList.add("spotlight");
        setTimeout(() => card.classList.remove("spotlight"), 1700);
      }
    });

    // car drives along the route
    const carBox = $("#mapCar");
    const path = $("#mapRoute");
    if (!carBox || !path || reduced) return;
    carBox.innerHTML = carSVG("mc");
    const len = path.getTotalLength();
    const loop = (t) => {
      const k = ((t / 45000) % 1) * len;
      const a = path.getPointAtLength(k);
      const b = path.getPointAtLength((k + 1) % len);
      const W = map.clientWidth, H = map.clientHeight;
      const flip = b.x < a.x ? -1 : 1;
      carBox.style.transform = `translate(${(a.x / 100) * W - 23}px, ${(a.y / 100) * H - 14}px) scaleX(${flip})`;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }


  /* =======================================================
     LIVE BAY UPDATES
  ======================================================= */

  function liveTick() {
    const pool = stations.filter((s) => s.status !== "offline");
    const s = pool[Math.floor(Math.random() * pool.length)];
    if (!s) return;
    s.free = clamp(s.free + (Math.random() < 0.5 ? -1 : 1), 0, s.total);
    s.status = s.free === 0 ? "busy" : "available";

    const card = $(`.station-card[data-id="${s.id}"]`);
    if (card) {
      const n = $(".js-free", card);
      n.textContent = s.free;
      n.classList.remove("flash"); void n.offsetWidth; n.classList.add("flash");
      const st = $(".station-status", card);
      st.className = `station-status ${s.status}`;
      st.textContent = cap(s.status);
      $(".station-progress span", card).style.setProperty("--charge", Math.round((s.free / s.total) * 100) + "%");
      const rb = $(".reserve-btn", card);
      rb.disabled = s.free === 0;
      rb.textContent = s.free === 0 ? "Full" : "Reserve";
    }
    const node = $(`.map-node[data-id="${s.id}"]`);
    if (node) node.className = `map-node ${s.status}${node.classList.contains("is-dim") ? " is-dim" : ""}`;
  }


  /* =======================================================
     RESERVATION DIALOG
  ======================================================= */

  function openReserve(id) {
    const s = byId(id);
    if (!s || s.status === "offline" || s.free === 0 || !dialog) return;
    const slots = ["Now", "+15 min", "+30 min", "+1 hr"];
    let slot = 0, target = 80;
    const body = $("#reserveBody");

    body.innerHTML = `
      <div class="rd-media">${stationArt(s)}</div>
      <div class="rd-content">
        <h3 id="reserveTitle">${esc(s.name)}</h3>
        <p class="rd-area">${esc(s.area)} · ${s.connector} · ${s.power} kW</p>
        <span class="rd-label">Arrival</span>
        <div class="rd-slots">${slots.map((t, i) => `<button type="button" class="slot-btn" data-slot="${i}" aria-pressed="${i === 0}">${t}</button>`).join("")}</div>
        <label class="rd-label" for="rdRange">Charge to <b id="rdTarget">${target}%</b></label>
        <input class="rd-range" id="rdRange" type="range" min="30" max="100" step="5" value="${target}">
        <div class="rd-bar"><span id="rdBar"></span></div>
        <div class="rd-estimate">
          <div><span>Time</span><strong id="rdTime"></strong></div>
          <div><span>Energy</span><strong id="rdKwh"></strong></div>
          <div><span>Cost</span><strong id="rdCost"></strong></div>
        </div>
        <button class="primary-btn rd-confirm" id="rdConfirm" type="button" style="margin-top:20px">Confirm reservation</button>
      </div>`;

    const update = () => {
      const kwh = (60 * (target - 20)) / 100;
      const mins = Math.max(5, Math.round((kwh / s.power) * 60));
      $("#rdTarget").textContent = target + "%";
      $("#rdBar").style.width = target + "%";
      $("#rdTime").textContent = mins + " min";
      $("#rdKwh").textContent = kwh.toFixed(0) + " kWh";
      $("#rdCost").textContent = "₹" + Math.round(kwh * s.rate);
    };
    update();

    $("#rdRange").addEventListener("input", (e) => { target = +e.target.value; update(); });
    $$(".slot-btn", body).forEach((b) => b.addEventListener("click", () => {
      slot = +b.dataset.slot;
      $$(".slot-btn", body).forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    }));

    $("#rdConfirm").addEventListener("click", () => {
      const code = "VLT-" + Math.random().toString(36).slice(2, 6).toUpperCase();
      s.free = Math.max(0, s.free - 1);
      if (s.free === 0) s.status = "busy";
      body.innerHTML = `
        <div class="rd-success">
          <svg class="rd-check" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="24"/><path d="M20 33l8 8 16-17"/></svg>
          <h3>Bay reserved</h3>
          <p>${esc(s.name)} · arrive ${slots[slot].toLowerCase()}</p>
          <span class="rd-code">${code}</span><br>
          <button class="primary-btn" id="rdDone" type="button">Done</button>
        </div>`;
      $("#rdDone").addEventListener("click", () => dialog.close());
      render();
      toast("Reservation confirmed");
    });

    dialog.showModal();
    root.classList.add("dialog-open");
  }

  function initDialog() {
    if (!dialog) return;
    $("#dialogClose")?.addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });
    dialog.addEventListener("close", () => root.classList.remove("dialog-open"));
  }


  /* =======================================================
     HERO SCENE
  ======================================================= */

  function initHeroScene() {
    const scene = $("#heroScene");
    if (!scene) return;
    scene.innerHTML = `
      <div class="hs-glow"></div>
      <div class="energy-rings"><span></span><span></span><span></span></div>
      <svg class="hs-svg" viewBox="0 0 560 380" aria-hidden="true">
        <rect class="hs-road" x="0" y="262" width="560" height="64" rx="12"/>
        <line class="hs-dash" x1="0" y1="294" x2="560" y2="294"/>
        <rect class="hs-screen" x="392" y="140" width="48" height="126" rx="12"/>
        <rect x="402" y="152" width="28" height="26" rx="5" fill="#0b1a14"/>
        <text class="hs-screen-t" x="416" y="169" text-anchor="middle">60kW</text>
        <circle class="hs-led" cx="416" cy="196" r="4"/>
        <g class="hs-car">${carSVG("hs", { attrs: 'x="40" y="190" width="300" height="110"' })}</g>
        <path class="hs-cable" d="M297 250C330 278 362 270 394 236"/>
        <path class="hs-cable-flow" d="M297 250C330 278 362 270 394 236"/>
        <text class="hs-bolt" x="330" y="236">⚡</text>
        <text class="hs-bolt b2" x="352" y="236">⚡</text>
        <text class="hs-bolt b3" x="310" y="236">⚡</text>
      </svg>
      <div class="hs-chip hs-batt"><span>Battery</span><strong id="heroPct">18%</strong><div class="hs-bar"><i id="heroBar"></i></div></div>
      <div class="hs-chip hs-price"><span>Rate</span><strong>₹18 /kWh</strong></div>`;

    if (reduced) { scene.classList.add("go"); return; }
    setTimeout(() => scene.classList.add("go"), 400);

    let pct = 18;
    setInterval(() => {
      if (!scene.classList.contains("go")) return;
      pct = pct >= 100 ? 18 : pct + 2;
      $("#heroPct").textContent = pct + "%";
      $("#heroBar").style.width = pct + "%";
    }, 700);
  }


  /* =======================================================
     SCROLL JOURNEY
  ======================================================= */

  function initJourney() {
    const svg = $("#journeySvg");
    const stage = $("#journeyStage");
    if (!svg || !stage) return () => {};

    const r = rng(11);
    const f = (n) => n.toFixed(1);
    let far = "", city = "", palms = "", stars = "";

    for (let x = 0; x < 3600; ) {
      const w = 30 + r() * 50, h = 40 + r() * 110;
      far += `<rect x="${f(x)}" y="${f(380 - h)}" width="${f(w)}" height="${f(h)}" class="j-far"/>`;
      x += w + 4 + r() * 10;
    }
    for (let x = 0; x < 3600; ) {
      const w = 40 + r() * 60, h = 60 + r() * 120;
      city += `<rect x="${f(x)}" y="${f(400 - h)}" width="${f(w)}" height="${f(h)}" class="j-city"/>`;
      x += w + 10 + r() * 30;
    }
    [380, 880, 1180, 2050, 2450, 2750, 3050].forEach((px) => {
      palms += `<path d="M${px} 400C${px + 6} 340 ${px - 4} 300 ${px + 8} 262" class="j-trunk"/>
        <path d="M${px + 8} 262q-40 -22 -66 12q34 -16 66 -12z M${px + 8} 262q40 -22 66 12q-34 -16 -66 -12z M${px + 8} 262q-6 -34 -30 -42q16 22 30 42z M${px + 8} 262q6 -34 30 -42q-16 22 -30 42z" class="j-frond"/>`;
    });
    for (let i = 0; i < 34; i++) {
      stars += `<circle cx="${f(r() * 1200)}" cy="${f(r() * 250)}" r="${f(0.7 + r() * 1.2)}" class="j-star" style="animation-delay:${f(r() * 3)}s"/>`;
    }

    svg.innerHTML = `
      <rect width="1200" height="520" fill="url(#sky-dusk)"/>
      <rect id="jNight" width="1200" height="520" fill="url(#sky-night)" opacity="0"/>
      <rect id="jDawn" width="1200" height="520" fill="url(#sky-dawn)" opacity="0"/>
      <g id="jStars" opacity="0">${stars}</g>
      <circle id="jSun" cx="900" cy="330" r="46" fill="#ffcf8a" opacity="0"/>
      <g id="jFar">${far}</g>
      <g id="jCity">${city}</g>
      <g id="jPalms">${palms}</g>
      <rect class="j-road" x="0" y="396" width="1200" height="124"/>
      <rect class="j-curb" x="0" y="392" width="1200" height="6"/>
      <line id="jLane" class="j-lane" x1="0" y1="458" x2="1200" y2="458"/>

      <g id="jWorld">
        <rect class="j-pole" x="696" y="300" width="6" height="96"/>
        <rect class="j-sign" x="640" y="290" width="150" height="46" rx="8"/>
        <text class="j-sign-a" x="715" y="311" text-anchor="middle">Voltiva</text>
        <text class="j-sign-b" x="715" y="328" text-anchor="middle">fast charge 2 km</text>

        <rect class="j-totem" x="1235" y="290" width="76" height="106" rx="10"/>
        <text class="j-totem-t" x="1273" y="346" text-anchor="middle">VOLT</text>

        <path d="M1400 268L1380 392H1780L1760 268Z" fill="rgba(234,255,184,.08)"/>
        <rect class="j-post" x="1390" y="266" width="8" height="130"/>
        <rect class="j-post" x="1770" y="266" width="8" height="130"/>
        <rect class="j-fascia" x="1380" y="250" width="410" height="18" rx="4"/>
        <text class="j-fascia-t" x="1585" y="264" text-anchor="middle">VOLTIVA</text>
        <rect class="j-lightbar" x="1392" y="268" width="386" height="4" rx="2"/>
        <rect class="j-pylon" x="1700" y="322" width="44" height="96" rx="10" fill="url(#sv-pylon)"/>
        <text class="j-pylon-t" x="1722" y="346" text-anchor="middle">DC 120</text>
        <circle id="jLed" class="j-led idle" cx="1722" cy="366" r="5"/>
        <g class="j-aura"><ellipse cx="1500" cy="385" rx="190" ry="70"/><ellipse cx="1500" cy="385" rx="190" ry="70" style="animation-delay:.8s"/></g>

        <rect class="j-lh" x="3300" y="190" width="40" height="206"/>
        <rect class="j-lh-red" x="3300" y="240" width="40" height="30"/>
        <rect class="j-lh-red" x="3300" y="310" width="40" height="30"/>
        <rect class="j-lh-room" x="3306" y="164" width="28" height="26"/>
        <path class="j-lh-roof" d="M3298 164L3320 140L3342 164Z"/>
        <path class="j-lh-beam" d="M3306 176L2900 130V222Z"/>
      </g>

      ${carSVG("jc", { attrs: 'x="300" y="335" width="250" height="92"' })}

      <g id="jWorld2">
        <path id="jCable" class="j-cable" d="M1700 392C1670 424 1640 414 1614 386" opacity="0"/>
        <path class="j-cable-flow" d="M1700 392C1670 424 1640 414 1614 386"/>
        <text class="j-bolt" x="1650" y="350">⚡</text>
        <text class="j-bolt" x="1680" y="350" style="animation-delay:.7s">⚡</text>
      </g>`;

    const g = (id) => svg.querySelector("#" + id);
    const nodes = { far: g("jFar"), city: g("jCity"), palms: g("jPalms"), world: g("jWorld"), world2: g("jWorld2"),
      night: g("jNight"), dawn: g("jDawn"), stars: g("jStars"), sun: g("jSun"), lane: g("jLane"), cable: g("jCable"), led: g("jLed") };
    const wheels = $$(".car-wheel", svg);
    const beam = $(".car-beam", svg);
    const hud = { fill: $("#hudFill"), pct: $("#hudPct"), range: $("#hudRange"), power: $("#hudPower"), status: $("#hudStatus") };
    const steps = $$("#journeySteps li");
    const bar = $("#journeyBar");

    const ease = (t) => 1 - Math.pow(1 - clamp(t), 1.8);
    const smooth = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
    const offsetAt = (p) => p < 0.4 ? 1100 * ease(p / 0.4) : p < 0.65 ? 1100 : 1100 + 1300 * ease((p - 0.65) / 0.35);

    return function apply(p) {
      const off = offsetAt(p);
      const move = (el, k) => el.setAttribute("transform", `translate(${(-off * k).toFixed(1)} 0)`);
      move(nodes.far, 0.25); move(nodes.city, 0.5); move(nodes.palms, 0.75);
      move(nodes.world, 1); move(nodes.world2, 1);
      nodes.lane.style.strokeDashoffset = off;

      const night = smooth((p - 0.15) / 0.3) * (1 - smooth((p - 0.6) / 0.2));
      const dawn = smooth((p - 0.6) / 0.25);
      nodes.night.setAttribute("opacity", smooth((p - 0.15) / 0.3));
      nodes.dawn.setAttribute("opacity", dawn);
      nodes.stars.setAttribute("opacity", night);
      nodes.sun.setAttribute("opacity", dawn);

      const parked = p >= 0.4 && p <= 0.65;
      const charging = p > 0.45 && p < 0.65;
      stage.classList.toggle("is-charging", charging);
      nodes.cable.setAttribute("opacity", charging ? 1 : 0);
      nodes.led.classList.toggle("on", charging);
      if (beam) beam.style.opacity = parked ? 0 : (night * 0.9).toFixed(2);
      wheels.forEach((w) => w.setAttribute("transform", `rotate(${(off * 1.4) % 360} ${w.dataset.cx} 68)`));

      const pct = p < 0.4 ? lerp(24, 8, p / 0.4) : p < 0.65 ? lerp(8, 92, (p - 0.4) / 0.25) : lerp(92, 88, (p - 0.65) / 0.35);
      hud.fill.style.width = pct + "%";
      hud.fill.classList.toggle("low", pct < 15);
      hud.pct.textContent = Math.round(pct) + "%";
      hud.range.textContent = Math.round(pct * 4.2) + " km";
      hud.power.textContent = charging ? Math.round(lerp(120, 60, (p - 0.45) / 0.2)) + " kW" : "0 kW";

      const step = p < 0.2 ? 0 : p < 0.4 ? 1 : p < 0.65 ? 2 : 3;
      hud.status.textContent = ["Low battery", "Arriving at Voltiva", "Fast charging", "Cruising"][step];
      steps.forEach((li, i) => { li.classList.toggle("active", i === step); li.classList.toggle("done", i < step); });
      bar.style.width = (p * 100).toFixed(1) + "%";
    };
  }


  /* =======================================================
     SCROLL EFFECTS (one rAF-throttled handler)
  ======================================================= */

  function initScroll() {
    const header = $("#siteHeader");
    const backTop = $("#backTop");
    const road = $("#scrollRoad");
    const journey = $("#journey");
    const cta = $("#ctaSection");
    const ctaCar = $("#ctaCar");
    const hero = $("#heroScene");
    const applyJourney = initJourney();

    const rc = $("#roadCar"); if (rc) rc.innerHTML = carSVG("rc");
    if (ctaCar) ctaCar.innerHTML = carSVG("cc");

    let ticking = false, movingTimer;

    const tick = () => {
      ticking = false;
      const y = window.scrollY;
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);

      header?.classList.toggle("scrolled", y > 30);
      header?.classList.toggle("is-scrolled", y > 30);
      backTop?.classList.toggle("show", y > 500);
      backTop?.classList.toggle("visible", y > 500);

      if (road) {
        road.style.setProperty("--p", clamp(y / max).toFixed(4));
        road.classList.add("moving");
        clearTimeout(movingTimer);
        movingTimer = setTimeout(() => road.classList.remove("moving"), 160);
      }

      if (hero && !reduced && window.innerWidth > 700) hero.style.setProperty("--py", (-y * 0.06).toFixed(1) + "px");

      if (journey) {
        const r = journey.getBoundingClientRect();
        applyJourney(clamp(-r.top / Math.max(1, r.height - window.innerHeight)));
      }

      if (cta && ctaCar) {
        const rr = cta.getBoundingClientRect();
        const t = clamp((window.innerHeight - rr.top - 60) / (Math.min(rr.height, window.innerHeight) * 0.9));
        const roadW = $(".cta-road", cta).clientWidth;
        const carW = ctaCar.offsetWidth || 170;
        const stop = roadW - 146 - (carW * 224) / 262;
        ctaCar.style.transform = `translateX(${lerp(-carW - 20, stop, 1 - Math.pow(1 - t, 2)).toFixed(1)}px)`;
        cta.classList.toggle("docked", t >= 0.97);
      }
    };

    const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(tick); } };
    window.addEventListener("scroll", req, { passive: true });
    window.addEventListener("resize", req);
    backTop?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" }));
    tick();
  }


  /* =======================================================
     SMALL EXTRAS
  ======================================================= */

  function initCounters() {
    const run = (el) => {
      const end = +el.dataset.count;
      if (reduced) { el.textContent = end; return; }
      const t0 = performance.now();
      const step = (t) => {
        const k = clamp((t - t0) / 1400);
        el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { run(e.target); io.unobserve(e.target); }
    }), { threshold: 0.4 });
    $$("[data-count]").forEach((el) => io.observe(el));
  }

  function initMagnetic() {
    if (!finePointer || reduced) return;
    $$(".magnetic-btn").forEach((b) => {
      b.addEventListener("pointermove", (e) => {
        const r = b.getBoundingClientRect();
        b.style.translate = `${(e.clientX - r.left - r.width / 2) * 0.18}px ${(e.clientY - r.top - r.height / 2) * 0.25}px`;
      });
      b.addEventListener("pointerleave", () => { b.style.translate = ""; });
    });
  }

  function hideLoader() {
    const l = $("#pageLoader");
    if (!l) return;
    l.classList.add("hide", "hidden", "loaded", "is-hidden");
    l.style.opacity = "0";
    l.style.visibility = "hidden";
    l.style.pointerEvents = "none";
  }

  function initVideo() {
    const v = $(".hero-video");
    if (!v) return;
    const saveData = navigator.connection && navigator.connection.saveData;
    if (reduced || saveData) { v.pause(); v.style.display = "none"; return; }
    document.addEventListener("visibilitychange", () => (document.hidden ? v.pause() : v.play().catch(() => {})));
  }


  /* =======================================================
     INIT
  ======================================================= */

  function init() {
    initTheme();
    initRTL();
    initMobileMenu();
    initMap();
    initFilters();
    initDialog();
    render();
    initHeroScene();
    initScroll();
    initCounters();
    initMagnetic();
    initVideo();
    if (!reduced) setInterval(liveTick, 6000);
  }

  // Safe start: even if one feature throws, the loader still goes away.
  try { init(); } catch (err) { console.error("Voltiva stations init failed:", err); }
  if (document.readyState === "complete") hideLoader();
  else window.addEventListener("load", hideLoader);
  setTimeout(hideLoader, 3500);

})();