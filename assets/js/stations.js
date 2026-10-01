/* =========================================================
   VOLTIVA — STATIONS PAGE JS
   - station cards with generated SVG artwork (or your own photos)
   - filters, sorting, saved stations, live bay updates
   - map with a car driving the route
   - reservation dialog with cost estimate
   - hero charging scene, scroll journey, scroll road, CTA car
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
    <svg class="station-art ${v}${offline ? " is-off" : ""}" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="400" height="240" fill="url(#sky-${v})"/>
      ${sky}${orb}
      ${back}
      <rect y="172" width="400" height="68" class="art-ground"/>
      <path d="M0 208H400" class="art-line"/>
      <polygon points="56,88 344,78 350,98 50,102" fill="url(#sv-solar)"/>
      <rect x="50" y="100" width="300" height="12" rx="3" class="art-fascia"/>
      <text x="200" y="109" text-anchor="middle" class="art-fascia-t">VOLTIVA ⚡ CHARGE</text>
      <rect x="56" y="112" width="288" height="2.5" class="art-lightbar"/>
      <path d="M72 114L48 172H352L328 114Z" class="art-beam"/>
      <rect x="68" y="112" width="6" height="60" class="art-post"/>
      <rect x="326" y="112" width="6" height="60" class="art-post"/>
      ${pylons}
      ${cars}
      ${lamps}
      ${offline ? `<rect width="400" height="240" class="art-dim"/><rect x="146" y="196" width="108" height="22" rx="11" class="art-off-tag"/><text x="200" y="211" text-anchor="middle" class="art-off-text">OFFLINE</text>` : ""}
    </svg>`;
  }


  /* =======================================================
     RENDER STATIONS
  ======================================================= */

  function reserveLabel(s) {
    if (s.status === "offline") return "Unavailable";
    if (s.free === 0) return "Notify me";
    return "Reserve →";
  }

  function cardHTML(s, index) {
    const pct = Math.round((s.free / s.total) * 100);
    const saved = state.saved.has(s.id);
    const media = s.image
      ? `<img class="station-photo" src="${esc(s.image)}" alt="${esc(s.name)} charging station" loading="lazy" decoding="async">`
      : stationArt(s);

    return `
      <article class="station-card" data-id="${s.id}" style="--i:${index}">

        <div class="station-media">
          ${media}
          <span class="station-status ${s.status}">${cap(s.status)}</span>
          <button class="save-btn${saved ? " on" : ""}" type="button" data-save="${s.id}"
                  aria-pressed="${saved}" aria-label="Save ${esc(s.name)}">♥</button>
          ${s.distance != null ? `<span class="media-chip chip-dist">◎ ${s.distance.toFixed(1)} km</span>` : ""}
          ${s.fast ? `<span class="media-chip chip-fast">⚡ Fast</span>` : ""}
        </div>

        <div class="station-body">

          <div class="station-top">
            <div>
              <h3 class="station-name">${esc(s.name)}</h3>
              <div class="station-area">${esc(s.area)}</div>
            </div>
            <div class="station-rating" aria-label="Rating ${s.rating} out of 5">★ ${s.rating.toFixed(1)}</div>
          </div>

          <ul class="station-amenities">
            ${s.amenities.map((a) => `<li>${esc(a)}</li>`).join("")}
          </ul>

          <div class="station-details">
            <div class="station-detail"><span>Connector</span><strong>${esc(s.connector)}</strong></div>
            <div class="station-detail"><span>Power</span><strong>${s.power} kW</strong></div>
            <div class="station-detail"><span>Free bays</span><strong class="js-free">${s.free}/${s.total}</strong></div>
          </div>

          <div class="station-progress"><span style="--charge:${pct}%"></span></div>

          <div class="station-bottom">
            <div class="station-price">₹${s.rate}<small> / kWh</small></div>
            <button class="reserve-btn" type="button" data-reserve="${s.id}"
                    ${s.status === "offline" ? "disabled" : ""}>${reserveLabel(s)}</button>
          </div>

        </div>

      </article>`;
  }

  function renderStations(list) {
    if (!results) return;

    currentList = list;
    results.innerHTML = list.map(cardHTML).join("");
    if (noResults) noResults.hidden = list.length > 0;

    /* photos that fail to load fall back to the illustration */
    $$(".station-photo", results).forEach((img) => {
      img.addEventListener("error", () => {
        const s = byId(img.closest(".station-card").dataset.id);
        img.insertAdjacentHTML("beforebegin", stationArt(s));
        img.remove();
      }, { once: true });
    });

    if (resultCount) {
      const sortText = {
        recommended: "", nearest: " · nearest first", cheapest: " · lowest price first",
        fastest: " · fastest chargers first", free: " · most free bays first"
      }[state.sort];
      resultCount.textContent = `Showing ${list.length} of ${stations.length} stations${sortText}`;
    }

    const visible = new Set(list.map((s) => s.id));
    $$(".map-node").forEach((node) => {
      node.classList.toggle("is-dim", !visible.has(node.dataset.station));
    });
  }


  /* =======================================================
     FILTERS + SORT
  ======================================================= */

  function applyFilters() {
    const search = (searchInput?.value || "").trim().toLowerCase();
    const status = statusFilter?.value || "all";
    const charger = chargerFilter?.value || "all";
    const connector = connectorFilter?.value || "all";

    let list = stations.filter((s) => {
      const haystack = [s.name, s.area, s.connector, ...s.amenities].join(" ").toLowerCase();
      const matchesSearch = !search || haystack.includes(search);
      const matchesStatus = status === "all" || s.status === status;
      const matchesCharger = charger === "all" || (charger === "fast" ? s.fast : !s.fast);
      const matchesConnector = connector === "all" || s.connector === connector;

      let matchesQuick = true;
      if (state.quick === "available") matchesQuick = s.status === "available";
      if (state.quick === "fast") matchesQuick = s.fast;
      if (state.quick === "saved") matchesQuick = state.saved.has(s.id);

      return matchesSearch && matchesStatus && matchesCharger && matchesConnector && matchesQuick;
    });

    const sorters = {
      recommended: null,
      nearest: (a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity),
      cheapest: (a, b) => a.rate - b.rate,
      fastest: (a, b) => b.power - a.power,
      free: (a, b) => b.free - a.free
    };
    if (sorters[state.sort]) list = list.slice().sort(sorters[state.sort]);

    renderStations(list);
  }

  function setQuick(value) {
    state.quick = value;
    quickFilters.forEach((btn) => {
      const on = btn.dataset.filter === value;
      btn.classList.toggle("active", on);
      btn.setAttribute("aria-pressed", String(on));
    });
  }

  function resetAllFilters() {
    if (searchInput) searchInput.value = "";
    if (statusFilter) statusFilter.value = "all";
    if (chargerFilter) chargerFilter.value = "all";
    if (connectorFilter) connectorFilter.value = "all";
    if (sortFilter) sortFilter.value = "recommended";
    state.sort = "recommended";
    setQuick("all");
    applyFilters();
  }

  function initFilters() {
    let timer;
    searchInput?.addEventListener("input", () => {
      clearTimeout(timer);
      timer = setTimeout(applyFilters, 120);
    });

    [statusFilter, chargerFilter, connectorFilter].forEach((select) => {
      select?.addEventListener("change", () => {
        setQuick("all");
        applyFilters();
      });
    });

    sortFilter?.addEventListener("change", () => {
      state.sort = sortFilter.value;
      if (state.sort === "nearest" && !state.user) {
        toast("Tap “Near me” first so we can measure distances.");
      }
      applyFilters();
    });

    quickFilters.forEach((btn) => {
      btn.addEventListener("click", () => {
        setQuick(btn.dataset.filter);
        applyFilters();
      });
    });

    clearFilters?.addEventListener("click", resetAllFilters);
    resetSearch?.addEventListener("click", resetAllFilters);
  }


  /* =======================================================
     CARD EVENTS: reserve, save, 3D tilt
  ======================================================= */

  function initCardEvents() {
    if (!results) return;

    results.addEventListener("click", (e) => {
      const reserve = e.target.closest("[data-reserve]");
      const save = e.target.closest("[data-save]");

      if (reserve) {
        const s = byId(reserve.dataset.reserve);
        if (s.status === "offline") return;
        if (s.free === 0) {
          toast(`We'll notify you when a bay frees up at ${s.name}.`);
          return;
        }
        openReserve(s.id);
      }

      if (save) {
        const id = save.dataset.save;
        const on = !state.saved.has(id);
        on ? state.saved.add(id) : state.saved.delete(id);
        store.set("voltiva-saved", [...state.saved]);
        save.classList.toggle("on", on);
        save.setAttribute("aria-pressed", String(on));
        toast(on ? `${byId(id).name} saved` : `${byId(id).name} removed from saved`);
        if (state.quick === "saved") applyFilters();
      }
    });

    if (finePointer && !reduced) {
      results.addEventListener("pointermove", (e) => {
        const card = e.target.closest(".station-card");
        if (!card) return;
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        card.style.setProperty("--rx", `${((0.5 - y) * 7).toFixed(2)}deg`);
        card.style.setProperty("--ry", `${((x - 0.5) * 9).toFixed(2)}deg`);
        card.style.setProperty("--mx", `${(x * 100).toFixed(0)}%`);
        card.style.setProperty("--my", `${(y * 100).toFixed(0)}%`);
      });

      results.addEventListener("pointerout", (e) => {
        const card = e.target.closest(".station-card");
        if (card && !card.contains(e.relatedTarget)) {
          card.style.setProperty("--rx", "0deg");
          card.style.setProperty("--ry", "0deg");
        }
      });
    }
  }


  /* =======================================================
     LIVE BAY UPDATES (simulated)
  ======================================================= */

  function refreshLive(s) {
    const card = $(`.station-card[data-id="${s.id}"]`);
    if (card) {
      const free = $(".js-free", card);
      if (free) {
        free.textContent = `${s.free}/${s.total}`;
        free.classList.remove("flash");
        void free.offsetWidth;
        free.classList.add("flash");
      }
      const bar = $(".station-progress span", card);
      if (bar) bar.style.setProperty("--charge", `${Math.round((s.free / s.total) * 100)}%`);
      const st = $(".station-status", card);
      if (st) { st.className = `station-status ${s.status}`; st.textContent = cap(s.status); }
      const btn = $(".reserve-btn", card);
      if (btn) btn.textContent = reserveLabel(s);
    }
    const node = $(`.map-node[data-station="${s.id}"]`);
    if (node) {
      node.classList.toggle("busy", s.status === "busy");
      node.classList.toggle("offline", s.status === "offline");
    }
  }

  function initLiveTicker() {
    setInterval(() => {
      if (document.hidden) return;
      const pool = stations.filter((s) => s.status !== "offline");
      const s = pool[Math.floor(Math.random() * pool.length)];
      const next = clamp(s.free + (Math.random() < 0.5 ? -1 : 1), 0, s.total);
      if (next === s.free) return;
      s.free = next;
      s.status = next === 0 ? "busy" : "available";
      refreshLive(s);
    }, 4500);
  }


  /* =======================================================
     MAP
  ======================================================= */

  function buildMap() {
    const wrap = $("#mapNodes");
    const pop = $("#mapPop");
    if (!wrap) return;

    wrap.innerHTML = stations.map((s) => `
      <button class="map-node ${s.status}" type="button" data-station="${s.id}"
              style="left:${s.map.x}%;top:${s.map.y}%"
              aria-label="${esc(s.name)}, ${s.status}"><span></span></button>
      <div class="map-label" style="left:${s.map.x}%;top:${s.map.y + 5}%">${esc(s.area.split(" · ")[0])}</div>
    `).join("");

    const show = (node) => {
      const s = byId(node.dataset.station);
      pop.hidden = false;
      pop.style.left = `${s.map.x}%`;
      pop.style.top = `${s.map.y}%`;
      pop.innerHTML = `
        <strong>${esc(s.name)}</strong>
        <span class="pop-st ${s.status}">${cap(s.status)}</span><br>
        <small>${s.free}/${s.total} free · ${s.power} kW · ₹${s.rate}/kWh</small>`;
    };
    const hide = () => { pop.hidden = true; };

    wrap.addEventListener("mouseover", (e) => { const n = e.target.closest(".map-node"); if (n) show(n); });
    wrap.addEventListener("mouseout", (e) => { if (e.target.closest(".map-node")) hide(); });
    wrap.addEventListener("focusin", (e) => { const n = e.target.closest(".map-node"); if (n) show(n); });
    wrap.addEventListener("focusout", hide);

    wrap.addEventListener("click", (e) => {
      const node = e.target.closest(".map-node");
      if (!node) return;
      const s = byId(node.dataset.station);
      show(node);

      /* map-only view: reserve straight from the pin */
      if (stationLayout?.classList.contains("map-mode")) {
        if (s.status === "offline") return toast(`${s.name} is offline right now.`);
        if (s.free === 0) return toast(`${s.name} is full — we'll notify you when a bay opens.`);
        return openReserve(s.id);
      }

      /* card view: bring the card into focus */
      if (!currentList.includes(s)) resetAllFilters();
      const card = $(`.station-card[data-id="${s.id}"]`);
      if (card) {
        card.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
        card.classList.remove("spotlight");
        void card.offsetWidth;
        card.classList.add("spotlight");
      }
    });
  }

  function initMapCar() {
    const path = $("#mapRoute");
    const car = $("#mapCar");
    const map = $("#stationMap");
    if (!path || !car || !map || !path.getTotalLength) return;

    car.innerHTML = carSVG("mc");
    const len = path.getTotalLength();
    let W = map.clientWidth || 1;
    let H = map.clientHeight || 1;
    let visible = true;

    window.addEventListener("resize", () => {
      W = map.clientWidth || 1;
      H = map.clientHeight || 1;
    });

    const place = (u, dir) => {
      const p = path.getPointAtLength(u * len);
      const q = path.getPointAtLength(clamp(u + 0.012 * dir) * len);
      const dx = (q.x - p.x) * (W / 100);
      const dy = (q.y - p.y) * (H / 100);
      const flip = dx < 0;
      const angle = (flip ? Math.atan2(dy, -dx) : Math.atan2(dy, dx)) * (180 / Math.PI);
      car.style.left = `${p.x}%`;
      car.style.top = `${p.y}%`;
      car.style.transform = `translate(-50%,-65%) ${flip ? "scaleX(-1)" : ""} rotate(${angle.toFixed(1)}deg)`;
    };

    if (reduced) return place(0.3, 1);

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(map);
    }

    const loop = (t) => {
      if (visible) {
        const cycle = (t / 12000) % 2;
        place(cycle < 1 ? cycle : 2 - cycle, cycle < 1 ? 1 : -1);
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  function initViewSwitcher() {
    const set = (mode) => {
      const map = mode === "map";
      stationLayout?.classList.toggle("map-mode", map);
      stationLayout?.classList.toggle("card-mode", !map);
      cardViewBtn?.classList.toggle("active", !map);
      mapViewBtn?.classList.toggle("active", map);
      cardViewBtn?.setAttribute("aria-pressed", String(!map));
      mapViewBtn?.setAttribute("aria-pressed", String(map));
    };
    cardViewBtn?.addEventListener("click", () => set("card"));
    mapViewBtn?.addEventListener("click", () => set("map"));
  }


  /* =======================================================
     RESERVATION DIALOG
  ======================================================= */

  const fmtTime = (d) => d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  function openReserve(id) {
    const s = byId(id);
    const body = $("#reserveBody");
    if (!s || !body || !dialog) return;

    const now = Date.now();
    const slots = [0, 30, 60, 120].map((m) => ({
      m, label: m === 0 ? "Now" : fmtTime(new Date(now + m * 60000))
    }));
    let slot = slots[0];
    let duration = 30;

    body.innerHTML = `
      <div class="rd-media">${stationArt(s)}</div>
      <div class="rd-content">
        <h3 id="reserveTitle">${esc(s.name)}</h3>
        <p class="rd-area">${esc(s.area)} · ${esc(s.connector)} · ${s.power} kW · ₹${s.rate}/kWh</p>

        <div class="rd-label">Arrival</div>
        <div class="rd-slots" role="group" aria-label="Arrival time">
          ${slots.map((o, i) => `<button type="button" class="slot-btn" data-slot="${i}" aria-pressed="${i === 0}">${o.label}</button>`).join("")}
        </div>

        <label class="rd-label" for="rdDur">Charging time · <b id="rdDurVal">30 min</b></label>
        <input id="rdDur" class="rd-range" type="range" min="15" max="90" step="15" value="30">

        <div class="rd-estimate">
          <div><span>Energy</span><strong id="rdEnergy"></strong></div>
          <div><span>Est. cost</span><strong id="rdCost"></strong></div>
          <div><span>Battery</span><strong id="rdGain"></strong></div>
        </div>
        <div class="rd-bar"><span id="rdBar"></span></div>

        <button class="primary-btn rd-confirm" id="rdConfirm" type="button">Reserve a bay</button>
      </div>`;

    const energyEl = $("#rdEnergy", body);
    const costEl = $("#rdCost", body);
    const gainEl = $("#rdGain", body);
    const barEl = $("#rdBar", body);

    const update = () => {
      $("#rdDurVal", body).textContent = `${duration} min`;
      const kwh = Math.min(s.power * (duration / 60) * 0.85, 60);
      const gain = Math.min(100, (kwh / 60) * 100);
      energyEl.textContent = `${kwh.toFixed(0)} kWh`;
      costEl.textContent = `₹${Math.round(kwh * s.rate)}`;
      gainEl.textContent = `+${gain.toFixed(0)}%`;
      barEl.style.width = `${gain}%`;
    };
    update();

    $$(".slot-btn", body).forEach((btn) => {
      btn.addEventListener("click", () => {
        slot = slots[Number(btn.dataset.slot)];
        $$(".slot-btn", body).forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      });
    });

    $("#rdDur", body).addEventListener("input", (e) => {
      duration = Number(e.target.value);
      update();
    });

    $("#rdConfirm", body).addEventListener("click", () => {
      const code = `VLT-${Math.random().toString(16).slice(2, 6).toUpperCase()}`;
      const bookings = store.get("voltiva-bookings", []);
      bookings.push({ code, station: s.id, at: slot.label, minutes: duration });
      store.set("voltiva-bookings", bookings.slice(-20));

      if (s.free > 0) {
        s.free -= 1;
        if (s.free === 0) s.status = "busy";
        refreshLive(s);
      }

      body.innerHTML = `
        <div class="rd-success">
          <svg viewBox="0 0 52 52" class="rd-check" aria-hidden="true">
            <circle cx="26" cy="26" r="24"/><path d="M15 27l8 8 14-16"/>
          </svg>
          <h3 id="reserveTitle">Bay reserved</h3>
          <p>${esc(s.name)} · ${slot.label} · ${duration} min</p>
          <div class="rd-code">${code}</div>
          <button class="primary-btn" id="rdDone" type="button">Done</button>
        </div>`;
      $("#rdDone", body).addEventListener("click", () => closeDialog());
    });

    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
    document.documentElement.classList.add("dialog-open");
  }

  function closeDialog() {
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
    document.documentElement.classList.remove("dialog-open");
  }

  function initDialog() {
    if (!dialog) return;
    $("#dialogClose")?.addEventListener("click", closeDialog);
    dialog.addEventListener("click", (e) => { if (e.target === dialog) closeDialog(); });
    dialog.addEventListener("close", () => document.documentElement.classList.remove("dialog-open"));
  }


  /* =======================================================
     LOCATION
  ======================================================= */

  function initLocation() {
    const button = $("#locateBtn");
    if (!button) return;

    const CHENNAI_CENTRAL = { lat: 13.0827, lng: 80.2707 };

    const apply = (pos, approximate) => {
      state.user = pos;
      stations.forEach((s) => { s.distance = haversine(pos, s); });
      state.sort = "nearest";
      if (sortFilter) sortFilter.value = "nearest";
      applyFilters();

      const nearest = stations
        .filter((s) => s.status !== "offline")
        .sort((a, b) => a.distance - b.distance)[0];
      toast(approximate
        ? `Couldn't read your location, so distances are from Chennai Central. Nearest: ${nearest.name}.`
        : `Nearest open station: ${nearest.name}, ${nearest.distance.toFixed(1)} km away.`);
      $("#findStations")?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
    };

    button.addEventListener("click", () => {
      if (!navigator.geolocation) return apply(CHENNAI_CENTRAL, true);

      button.classList.add("loading");
      navigator.geolocation.getCurrentPosition(
        (p) => {
          button.classList.remove("loading");
          apply({ lat: p.coords.latitude, lng: p.coords.longitude }, false);
        },
        () => {
          button.classList.remove("loading");
          apply(CHENNAI_CENTRAL, true);
        },
        { timeout: 8000 }
      );
    });
  }


  /* =======================================================
     HERO CHARGING SCENE
  ======================================================= */

  function buildHeroScene() {
    const el = $("#heroScene");
    if (!el) return;

    el.innerHTML = `
      <div class="hs-glow"></div>
      <div class="energy-rings"><span></span><span></span><span></span></div>

      <svg class="hs-svg" viewBox="0 0 560 380" aria-hidden="true">
        <rect class="hs-road" x="-30" y="322" width="620" height="34" rx="17"/>
        <line class="hs-dash" x1="-30" y1="339" x2="590" y2="339"/>

        <!-- canopy -->
        <polygon points="236,84 548,72 556,98 228,112" fill="url(#sv-solar)"/>
        <rect x="228" y="110" width="328" height="5" rx="2" class="art-fascia"/>
        <path d="M244 118L214 326H530L516 118Z" fill="url(#sv-beam)" opacity=".75"/>
        <rect x="236" y="112" width="8" height="216" rx="3" class="art-post"/>
        <rect x="534" y="104" width="8" height="224" rx="3" class="art-post"/>

        <!-- charger -->
        <rect x="440" y="130" width="62" height="200" rx="16" fill="url(#sv-pylon)" stroke="rgba(182,240,53,.4)"/>
        <rect x="452" y="146" width="38" height="58" rx="8" class="hs-screen"/>
        <text x="471" y="182" text-anchor="middle" font-size="26">⚡</text>
        <text x="471" y="197" text-anchor="middle" class="hs-screen-t">60 kW</text>
        <circle cx="471" cy="226" r="5" class="hs-led"/>
        <rect x="432" y="326" width="78" height="8" rx="4" fill="#1c2a24"/>

        <!-- car rolls in, then plugs in -->
        <g class="hs-car">${carSVG("hc", { attrs: 'x="120" y="233" width="300" height="110"' })}</g>

        <path class="hs-cable" d="M440 285C428 322 396 320 378 294"/>
        <path class="hs-cable-flow" d="M440 285C428 322 396 320 378 294"/>

        <text class="hs-bolt b1" x="330" y="236">⚡</text>
        <text class="hs-bolt b2" x="372" y="228">⚡</text>
        <text class="hs-bolt b3" x="296" y="232">⚡</text>
      </svg>

      <div class="hs-chip hs-batt">
        <span>Battery</span>
        <strong id="hsPct">18%</strong>
        <div class="hs-bar"><i id="hsBar"></i></div>
      </div>
      <div class="hs-chip hs-price">
        <span>Fast charge</span>
        <strong>₹18 / kWh</strong>
      </div>`;

    const pct = $("#hsPct");
    const bar = $("#hsBar");
    const setBattery = (v) => {
      pct.textContent = `${Math.round(v)}%`;
      bar.style.width = `${v}%`;
    };
    setBattery(18);

    const start = () => {
      el.classList.add("go");
      if (reduced) return setBattery(82);

      const delay = 3600;
      const duration = 9000;
      const t0 = performance.now() + delay;
      const tick = (now) => {
        const t = clamp((now - t0) / duration);
        setBattery(lerp(18, 82, 1 - Math.pow(1 - t, 2)));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    heroStart = start;
  }

  let heroStart = () => {};


  /* =======================================================
     SCROLL JOURNEY — the car drives as you scroll
  ======================================================= */

  function initJourney() {
    const section = $("#journey");
    const svg = $("#journeySvg");
    if (!section || !svg) return null;

    const H = 520;
    const VW_MAX = 1500;
    const TRAVEL = 2400;
    const ROAD = 400;
    const STATION_X = 1500;
    const DEST_X = 3250;
    const PARK = (STATION_X - 520) / TRAVEL;
    const rand = rng(77);

    /* ---------- procedural layers ---------- */
    const farW = VW_MAX + TRAVEL * 0.12 + 40;
    let far = `M0 ${H}`;
    for (let x = 0; x <= farW; x += 45) {
      const y = 300 - 70 * (Math.sin(x / 210) * 0.5 + 0.5) - 40 * (Math.sin(x / 97 + 2) * 0.5 + 0.5) - rand() * 14;
      far += ` L${x} ${y.toFixed(1)}`;
    }
    far += ` L${farW} ${H}Z`;

    const midW = VW_MAX + TRAVEL * 0.35 + 40;
    let city = "";
    let lights = "";
    for (let x = 0; x < midW;) {
      const w = 36 + rand() * 50;
      const h = 70 + rand() * 150;
      const rect = `x="${x.toFixed(0)}" y="${(ROAD - h).toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}"`;
      city += `<rect ${rect}/>`;
      lights += `<rect ${rect} fill="url(#jWin)"/>`;
      x += w + rand() * 8;
    }

    const palm = (x, h, lean) => {
      const frond = (a, mirror) =>
        `<path transform="${mirror ? "scale(-1 1) " : ""}rotate(${a})" d="M0 0Q30 -24 68 5Q34 -6 0 5Z"/>`;
      return `<g transform="translate(${x.toFixed(0)} ${ROAD + 4})">
        <path d="M0 0Q${lean * 0.4} ${-h * 0.5} ${lean} ${-h}" class="j-trunk"/>
        <g transform="translate(${lean} ${-h})" class="j-frond">
          ${frond(-48, false)}${frond(-16, false)}${frond(16, false)}
          ${frond(-48, true)}${frond(-16, true)}${frond(16, true)}
          <path d="M0 0Q-4 -34 6 -52Q8 -30 0 0Z"/>
        </g></g>`;
    };
    const trW = VW_MAX + TRAVEL * 0.65 + 60;
    let palms = "";
    for (let x = 60; x < trW; x += 150 + rand() * 160) {
      palms += palm(x, 110 + rand() * 70, (rand() - 0.5) * 30);
    }

    let poles = "";
    let glows = "";
    for (let i = 0; i < 11; i++) {
      const x = 260 + i * 340;
      poles += `<g transform="translate(${x} 0)"><rect x="-2" y="290" width="4" height="110" class="j-pole"/><rect x="-2" y="290" width="26" height="4" class="j-pole"/><circle cx="22" cy="297" r="3.5" fill="#fff3c4"/></g>`;
      glows += `<circle cx="${x + 22}" cy="300" r="46" fill="url(#jGlow)"/>`;
    }

    const sign = (x, a, b) => `
      <g transform="translate(${x} 0)">
        <rect x="-2" y="318" width="4" height="82" class="j-pole"/>
        <rect x="-64" y="266" width="128" height="56" rx="9" class="j-sign"/>
        <text x="0" y="291" text-anchor="middle" class="j-sign-a">${a}</text>
        <text x="0" y="312" text-anchor="middle" class="j-sign-b">${b}</text>
      </g>`;

    const stationG = `
      <g transform="translate(${STATION_X} 0)">
        <polygon points="-345,238 135,226 152,262 -362,270" fill="url(#sv-solar)"/>
        <rect x="-362" y="268" width="514" height="22" rx="5" class="j-fascia"/>
        <text x="-105" y="284" text-anchor="middle" class="j-fascia-t">VOLTIVA · FAST CHARGE</text>
        <rect x="-356" y="290" width="502" height="3" class="j-lightbar"/>
        <path id="jBeam" d="M-340 293L-396 400H190L136 293Z" fill="url(#sv-beam)"/>
        <rect x="-336" y="293" width="10" height="107" class="j-post"/>
        <rect x="124" y="293" width="10" height="107" class="j-post"/>

        <rect x="0" y="300" width="50" height="100" rx="12" fill="url(#sv-pylon)" class="j-pylon"/>
        <rect x="8" y="312" width="34" height="38" rx="6" fill="#06120b"/>
        <text x="25" y="338" text-anchor="middle" font-size="22">⚡</text>
        <circle id="jLed" cx="25" cy="364" r="5" class="j-led"/>
        <text x="25" y="387" text-anchor="middle" class="j-pylon-t">60 kW</text>

        <rect x="72" y="300" width="50" height="100" rx="12" fill="url(#sv-pylon)" class="j-pylon"/>
        <rect x="80" y="312" width="34" height="38" rx="6" fill="#06120b"/>
        <circle cx="97" cy="364" r="5" class="j-led idle"/>
        <text x="97" y="387" text-anchor="middle" class="j-pylon-t">Free</text>

        <path id="jCable" class="j-cable" d="M0 362C-22 404 -52 396 -65 375"/>
        <path id="jCableFlow" class="j-cable-flow" d="M0 362C-22 404 -52 396 -65 375"/>

        <rect x="213" y="250" width="8" height="150" class="j-post"/>
        <rect x="177" y="196" width="80" height="86" rx="12" class="j-totem"/>
        <text x="217" y="244" text-anchor="middle" font-size="34">⚡</text>
        <text x="217" y="268" text-anchor="middle" class="j-totem-t">VOLTIVA</text>
      </g>`;

    const destG = `
      <g transform="translate(${DEST_X} 0)">
        <polygon points="-22,170 22,170 34,400 -34,400" class="j-lh"/>
        <polygon points="-25,230 25,230 27,262 -27,262" class="j-lh-red"/>
        <polygon points="-29,310 29,310 31,342 -31,342" class="j-lh-red"/>
        <rect x="-26" y="140" width="52" height="30" rx="4" class="j-lh-room"/>
        <polygon points="-32,140 0,112 32,140" class="j-lh-roof"/>
        <g id="jLhBeam"><polygon points="0,155 560,96 560,214" class="j-lh-beam"/><polygon points="0,155 -560,96 -560,214" class="j-lh-beam"/></g>
        ${palm(-150, 120, 14)}${palm(150, 100, -12)}${palm(215, 135, 18)}
      </g>`;

    svg.innerHTML = `
      <defs>
        <linearGradient id="jSky" x1="0" y1="0" x2="0" y2="1">
          <stop id="jSkyTop" offset="0" stop-color="#2b1b4d"/>
          <stop id="jSkyBot" offset="1" stop-color="#ff8a5c"/>
        </linearGradient>
        <pattern id="jWin" width="16" height="18" patternUnits="userSpaceOnUse">
          <rect x="5" y="5" width="5" height="7" fill="#ffd98a"/>
        </pattern>
        <radialGradient id="jGlow">
          <stop offset="0" stop-color="#ffe9a6" stop-opacity=".55"/>
          <stop offset="1" stop-color="#ffe9a6" stop-opacity="0"/>
        </radialGradient>
      </defs>

      <rect x="-300" y="0" width="2200" height="${H}" fill="url(#jSky)"/>
      <g id="jStars"></g>
      <circle id="jSun" r="46" fill="#ffd9a0"/>
      <circle id="jMoon" r="26" fill="#eef6ff"/>

      <g id="jFar"><path d="${far}" class="j-far"/></g>
      <g id="jMid"><g class="j-city">${city}</g><g id="jLights">${lights}</g></g>
      <g id="jTrees" class="j-palms">${palms}</g>

      <g id="jWorld">
        <rect x="0" y="${ROAD}" width="3900" height="${H - ROAD + 40}" class="j-road"/>
        <rect x="0" y="${ROAD}" width="3900" height="8" class="j-curb"/>
        <line x1="0" y1="466" x2="3900" y2="466" class="j-lane"/>
        <g id="jGlows">${glows}</g>
        ${poles}
        ${sign(700, "⚡ Voltiva", "2 km")}
        ${sign(1180, "⚡ Voltiva", "300 m")}
        ${sign(2800, "Marina Beach", "4 km")}
        ${stationG}
        ${destG}
      </g>

      <g id="jCar">${carSVG("jc", { attrs: 'x="230" y="322" width="262" height="96"' })}</g>

      <g class="j-aura">
        <ellipse cx="361" cy="372" rx="120" ry="52"/>
        <ellipse cx="361" cy="372" rx="120" ry="52" style="animation-delay:.8s"/>
        <ellipse cx="361" cy="372" rx="120" ry="52" style="animation-delay:1.6s"/>
      </g>
      <g class="j-bolts">
        <text x="300" y="350" class="j-bolt">⚡</text>
        <text x="372" y="350" class="j-bolt" style="animation-delay:.7s">⚡</text>
        <text x="436" y="350" class="j-bolt" style="animation-delay:1.4s">⚡</text>
      </g>`;

    let starMarkup = "";
    for (let i = 0; i < 46; i++) {
      starMarkup += `<circle cx="${(-200 + rand() * 1900).toFixed(0)}" cy="${(rand() * 290).toFixed(0)}" r="${(0.7 + rand() * 1.4).toFixed(1)}" class="j-star" style="animation-delay:${(rand() * 3).toFixed(1)}s"/>`;
    }
    $("#jStars", svg).innerHTML = starMarkup;

    /* ---------- element handles ---------- */
    const g = (id) => $(`#${id}`, svg);
    const el = {
      top: g("jSkyTop"), bot: g("jSkyBot"), stars: g("jStars"),
      sun: g("jSun"), moon: g("jMoon"),
      far: g("jFar"), mid: g("jMid"), trees: g("jTrees"), world: g("jWorld"),
      lights: g("jLights"), glows: g("jGlows"), beam: g("jBeam"), lh: g("jLhBeam"),
      car: g("jCar"), led: g("jLed"), cable: g("jCable"), flow: g("jCableFlow")
    };
    const wheels = $$(".car-wheel", el.car).map((w) => ({ node: w, cx: Number(w.dataset.cx) }));
    const headBeam = $(".car-beam", el.car);
    const cableLen = el.cable.getTotalLength ? el.cable.getTotalLength() : 100;
    el.cable.style.strokeDasharray = cableLen;
    el.cable.style.strokeDashoffset = cableLen;

    const stage = $("#journeyStage");
    const hud = {
      fill: $("#hudFill"), pct: $("#hudPct"), range: $("#hudRange"),
      power: $("#hudPower"), status: $("#hudStatus"), bar: $("#journeyBar")
    };
    const steps = $$("#journeySteps li");

    /* ---------- sky palette over the trip ---------- */
    const PAL = [
      [0, [43, 27, 77], [255, 138, 92], 0.15],
      [0.3, [18, 26, 58], [104, 60, 122], 0.75],
      [0.5, [5, 11, 26], [15, 42, 58], 1],
      [0.7, [5, 11, 26], [15, 42, 58], 1],
      [1, [28, 59, 107], [255, 179, 107], 0.1]
    ];
    const palette = (p) => {
      for (let i = 0; i < PAL.length - 1; i++) {
        const a = PAL[i];
        const b = PAL[i + 1];
        if (p <= b[0]) {
          const t = (p - a[0]) / (b[0] - a[0]);
          return {
            top: a[1].map((c, k) => Math.round(lerp(c, b[1][k], t))),
            bot: a[2].map((c, k) => Math.round(lerp(c, b[2][k], t))),
            n: lerp(a[3], b[3], t)
          };
        }
      }
      const last = PAL[PAL.length - 1];
      return { top: last[1], bot: last[2], n: last[3] };
    };

    /* ---------- viewBox adapts to the stage shape ---------- */
    const fit = () => {
      const r = svg.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const vw = clamp(H * (r.width / r.height), 520, VW_MAX);
      const vx = clamp((1300 - vw) / 6, 0, 150);
      svg.setAttribute("viewBox", `${vx.toFixed(0)} 0 ${vw.toFixed(0)} ${H}`);
    };
    fit();
    window.addEventListener("resize", fit);

    /* ---------- per-frame update ---------- */
    let last = {};
    const setText = (key, node, value) => {
      if (last[key] !== value) { node.textContent = value; last[key] = value; }
    };

    const update = (p) => {
      /* world position: drive, park, drive */
      let frac;
      if (p < 0.4) {
        const t = p / 0.4;
        frac = PARK * (0.5 * t + 0.5 * (1 - (1 - t) * (1 - t)));
      } else if (p < 0.7) {
        frac = PARK;
      } else {
        const u = (p - 0.7) / 0.3;
        frac = PARK + (1 - PARK) * (0.5 * u + 0.5 * u * u * (3 - 2 * u));
      }
      const dist = frac * TRAVEL;

      el.far.setAttribute("transform", `translate(${(-dist * 0.12).toFixed(1)} 0)`);
      el.mid.setAttribute("transform", `translate(${(-dist * 0.35).toFixed(1)} 0)`);
      el.trees.setAttribute("transform", `translate(${(-dist * 0.65).toFixed(1)} 0)`);
      el.world.setAttribute("transform", `translate(${(-dist).toFixed(1)} 0)`);

      const spin = dist * 3.4;
      wheels.forEach((w) => w.node.setAttribute("transform", `rotate(${spin.toFixed(1)} ${w.cx} 68)`));
      el.car.setAttribute("transform", `translate(0 ${(Math.sin(dist / 26) * 0.9).toFixed(2)})`);

      /* sky + night */
      const pal = palette(p);
      el.top.setAttribute("stop-color", `rgb(${pal.top})`);
      el.bot.setAttribute("stop-color", `rgb(${pal.bot})`);
      const n = pal.n;
      el.stars.style.opacity = n;
      el.lights.style.opacity = (n * 0.95).toFixed(2);
      el.glows.style.opacity = n.toFixed(2);
      el.beam.style.opacity = (0.15 + n * 0.85).toFixed(2);
      el.lh.style.opacity = (n * 0.7).toFixed(2);
      if (headBeam) headBeam.style.opacity = (n * 0.9).toFixed(2);

      const sunT = p < 0.5 ? p / 0.5 : (p - 0.5) / 0.5;
      el.sun.setAttribute("cx", p < 0.5 ? lerp(900, 800, sunT) : lerp(380, 300, sunT));
      el.sun.setAttribute("cy", p < 0.5 ? lerp(215, 400, sunT) : lerp(400, 205, sunT));
      el.sun.style.opacity = (1 - n).toFixed(2);
      el.moon.setAttribute("cx", lerp(260, 900, p));
      el.moon.setAttribute("cy", 90 + Math.sin(p * Math.PI) * -18);
      el.moon.style.opacity = n.toFixed(2);

      /* cable: draws on arrival, retracts before leaving */
      const connect = clamp((p - 0.4) / 0.04) - clamp((p - 0.66) / 0.04);
      el.cable.style.strokeDashoffset = (cableLen * (1 - clamp(connect))).toFixed(1);
      const charging = p > 0.43 && p < 0.64;
      stage.classList.toggle("is-charging", charging);
      el.led.classList.toggle("on", charging);

      /* battery model */
      let battery;
      let power = 0;
      let status;
      if (p < 0.4) {
        battery = 100 - (p / 0.4) * 82;
        status = battery > 45 ? "Cruising through Chennai"
          : p < 0.34 ? "Battery getting low"
          : "Voltiva station just ahead";
      } else if (p < 0.7) {
        const t = clamp((p - 0.42) / 0.22);
        battery = lerp(18, 86, 1 - Math.pow(1 - t, 2));
        if (p < 0.43) status = "Plugging in…";
        else if (p < 0.64) {
          power = Math.round(60 * Math.min(1, t * 5) * (t > 0.85 ? 1 - (t - 0.85) / 0.15 * 0.7 : 1));
          status = `Fast charging · ${power} kW`;
        } else status = "Charged · unplugging";
      } else {
        const u = (p - 0.7) / 0.3;
        battery = lerp(86, 74, u);
        status = p > 0.96 ? "Arrived · Marina Beach" : "Back on the road";
      }

      hud.fill.style.width = `${battery.toFixed(1)}%`;
      hud.fill.classList.toggle("low", battery < 25);
      setText("pct", hud.pct, `${Math.round(battery)}%`);
      setText("range", hud.range, `${Math.round(battery * 4.2)} km`);
      setText("power", hud.power, `${power} kW`);
      setText("status", hud.status, status);
      hud.bar.style.width = `${(p * 100).toFixed(1)}%`;

      const step = p < 0.3 ? 0 : p < 0.4 ? 1 : p < 0.7 ? 2 : 3;
      if (last.step !== step) {
        steps.forEach((li, i) => {
          li.classList.toggle("active", i === step);
          li.classList.toggle("done", i < step);
        });
        last.step = step;
      }
    };

    update(0);

    return () => {
      const rect = section.getBoundingClientRect();
      if (rect.bottom < -200 || rect.top > window.innerHeight + 200) return;
      const total = rect.height - window.innerHeight;
      update(total > 0 ? clamp(-rect.top / total) : 0);
    };
  }


  /* =======================================================
     SCROLL ENGINE
  ======================================================= */

  function initScrollEffects() {
    const header = $("#siteHeader");
    const backTop = $("#backTop");
    const heroScene = $("#heroScene");
    const grid = $(".stations-grid");
    const road = $("#scrollRoad");
    const roadCar = $("#roadCar");
    const roadFill = $("#roadFill");
    const cta = $("#ctaSection");
    const ctaCar = $("#ctaCar");

    if (roadCar) roadCar.innerHTML = carSVG("rc");
    if (ctaCar) ctaCar.innerHTML = carSVG("cc");
    const ctaWheels = ctaCar ? $$(".car-wheel", ctaCar) : [];

    const journeyUpdate = initJourney();
    let movingTimer;
    let ticking = false;

    const frame = () => {
      ticking = false;
      const y = window.scrollY;
      const vh = window.innerHeight;

      header?.classList.toggle("scrolled", y > 30);
      backTop?.classList.toggle("show", y > 500);

      /* scroll road: mini car drives along the bottom edge */
      if (road) {
        const max = document.documentElement.scrollHeight - vh;
        const p = max > 0 ? clamp(y / max) : 0;
        road.style.setProperty("--p", p.toFixed(4));
        road.classList.add("moving");
        clearTimeout(movingTimer);
        movingTimer = setTimeout(() => road.classList.remove("moving"), 180);
      }

      /* hero parallax */
      if (y < vh * 1.3) {
        heroScene?.style.setProperty("--py", `${(y * 0.14).toFixed(1)}px`);
        if (grid) grid.style.transform = `translateY(${(y * 0.18).toFixed(1)}px)`;
      }

      journeyUpdate?.();

      /* CTA car: drives in from the left and docks at the charger */
      if (cta && ctaCar) {
        const r = cta.getBoundingClientRect();
        if (r.top < vh && r.bottom > 0) {
          const t = clamp((vh - r.top) / (vh * 0.85));
          const eased = 1 - Math.pow(1 - t, 2);
          const width = cta.clientWidth;
          const x = lerp(-180, width - 330, eased);
          ctaCar.style.transform = `translateX(${x.toFixed(1)}px)`;
          const spin = x * 3.1;
          ctaWheels.forEach((w) => {
            w.setAttribute("transform", `rotate(${spin.toFixed(1)} ${w.dataset.cx} 68)`);
          });
          cta.classList.toggle("docked", t > 0.97);
        }
      }
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(frame);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    backTop?.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    });
    frame();
  }


  /* =======================================================
     COUNTERS
  ======================================================= */

  function animateNumber(element, target) {
    const duration = 1300;
    const start = performance.now();

    const update = (time) => {
      const progress = Math.min((time - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = Math.round(target * eased).toLocaleString();
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }

  function initCounters() {
    const counters = $$("[data-count]");
    if (!counters.length) return;

    if (!("IntersectionObserver" in window) || reduced) {
      counters.forEach((c) => { c.textContent = Number(c.dataset.count).toLocaleString(); });
      return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateNumber(entry.target, Number(entry.target.dataset.count));
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.4 });

    counters.forEach((c) => observer.observe(c));
  }


  /* =======================================================
     TOAST + LOADER
  ======================================================= */

  function toast(message) {
    const el = $("#toast");
    if (!el) return;
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(window.voltivaToastTimer);
    window.voltivaToastTimer = setTimeout(() => el.classList.remove("show"), 3200);
  }

  function initPageLoader() {
    const loader = $("#pageLoader");

    const done = () => {
      setTimeout(() => {
        loader?.classList.add("loaded");
        setTimeout(heroStart, 250);
      }, 500);
    };

    if (document.readyState === "complete") done();
    else window.addEventListener("load", done, { once: true });

    /* safety net if the load event is slow */
    setTimeout(() => $("#heroScene")?.classList.add("go"), 3500);
  }


  /* =======================================================
     INIT
  ======================================================= */

  function init() {
    buildHeroScene();
    buildMap();
    initMapCar();
    renderStations(stations);
    initFilters();
    initCardEvents();
    initViewSwitcher();
    initDialog();
    initCounters();
    initLocation();
    initScrollEffects();
    initPageLoader();
    initLiveTicker();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

})();