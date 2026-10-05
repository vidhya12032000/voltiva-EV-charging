/* VOLTIVA — about.js
   Theme + RTL toggling and persistence live in site.js.
   This file must NOT add click handlers on #themeToggle / #rtlToggle.
   Counters and the reveal are handled by site.js too. */
(() => {
  "use strict";

  const $ = (s, p = document) => p.querySelector(s);
  const $$ = (s, p = document) => [...p.querySelectorAll(s)];
  const root = document.documentElement;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* Hide broken images (error doesn't bubble, so use capture) */
  document.addEventListener(
    "error",
    (e) => {
      if (e.target.tagName === "IMG" && e.target.id !== "lbImg")
        e.target.classList.add("img-fail");
    },
    true
  );

  document.addEventListener("DOMContentLoaded", () => {
    try { localStorage.removeItem("voltiva-rtl"); } catch (_) {}
    initToggleSync();
    initHeroTilt();
    initTimeline();
    initCalculator();
    initLightbox();
    initTechLive();
    initMarquee();
    initMagneticButtons();
    initEscapeToCloseNav();
  });

  /* Mirror theme / dir state into the buttons (no click handlers) */
  function initToggleSync() {
    const themeBtn = $("#themeToggle");
    const rtlBtn = $("#rtlToggle");
    const sync = () => {
      if (themeBtn) {
        const dark = root.dataset.theme === "dark";
        themeBtn.textContent = dark ? "☀" : "☾";
        themeBtn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
      }
      if (rtlBtn) {
        const rtl = root.dir === "rtl";
        rtlBtn.setAttribute("aria-pressed", String(rtl));
        rtlBtn.setAttribute("aria-label", rtl ? "Switch to left-to-right layout" : "Switch to right-to-left layout");
      }
    };
    new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ["data-theme", "dir"] });
    sync();
  }

  /* Hero pointer glow + tilt (applied to .hero-stage) */
  function initHeroTilt() {
    const hero = $(".about-hero");
    if (!hero || reduceMotion || !finePointer) return;
    const stage = $(".hero-stage", hero);
    let x = 70, y = 40, raf = 0;
    const paint = () => {
      raf = 0;
      hero.style.setProperty("--mx", `${x}%`);
      hero.style.setProperty("--my", `${y}%`);
      if (stage)
        stage.style.transform = `perspective(1000px) rotateX(${(y - 50) * -0.06}deg) rotateY(${(x - 50) * 0.06}deg)`;
    };
    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      x = ((e.clientX - r.left) / r.width) * 100;
      y = ((e.clientY - r.top) / r.height) * 100;
      if (!raf) raf = requestAnimationFrame(paint);
    });
    hero.addEventListener("pointerleave", () => { if (stage) stage.style.transform = ""; });
  }

  /* Timeline: fill the line and light up markers as you scroll */
  function initTimeline() {
    const wrap = $("#storyTimeline");
    const bar = $("#timelineProgress");
    if (!wrap || !bar) return;
    const items = $$(".timeline-item", wrap);
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = wrap.getBoundingClientRect();
      const mid = innerHeight * 0.55;
      const p = Math.min(1, Math.max(0, (mid - r.top) / r.height));
      bar.style.height = `${p * 100}%`;
      items.forEach((it) => {
        const m = $(".timeline-marker", it).getBoundingClientRect();
        it.classList.toggle("active", m.top + m.height / 2 <= mid);
      });
    };
    const req = () => { if (!raf) raf = requestAnimationFrame(update); };
    addEventListener("scroll", req, { passive: true });
    addEventListener("resize", req);
    update();
  }

  /* Impact calculator (uses the assumptions printed in the note) */
  function initCalculator() {
    const range = $("#kmRange");
    if (!range) return;
    const out = $("#kmOut");
    const segs = $$(".seg");
    const CAR = { hatch: { kmpl: 15, kwh: 0.15 }, suv: { kmpl: 10, kwh: 0.2 } };
    const PETROL = 100, POWER = 18, PETROL_CO2 = 2.3, GRID_CO2 = 0.7, TREE_KG = 21;
    let car = "hatch";
    const fmt = (n) => Math.round(n).toLocaleString("en-IN");

    const calc = () => {
      const km = +range.value, c = CAR[car];
      const month = km * (PETROL / c.kmpl - c.kwh * POWER);
      const co2Year = 12 * km * (PETROL_CO2 / c.kmpl - c.kwh * GRID_CO2);
      out.textContent = `${fmt(km)} km`;
      $("#rMoney").textContent = `₹${fmt(month)}`;
      $("#rYear").textContent = `₹${fmt(month * 12)}`;
      $("#rCo2").textContent = `${fmt(co2Year)} kg`;
      $("#rTrees").textContent = fmt(co2Year / TREE_KG);
      const pct = ((km - range.min) / (range.max - range.min)) * 100;
      range.style.setProperty("--fill", `${pct}%`);
    };

    range.addEventListener("input", calc);
    segs.forEach((b) =>
      b.addEventListener("click", () => {
        car = b.dataset.car;
        segs.forEach((s) => {
          s.classList.toggle("active", s === b);
          s.setAttribute("aria-pressed", String(s === b));
        });
        calc();
      })
    );
    calc();
  }

  /* Gallery lightbox */
  function initLightbox() {
    const box = $("#lightbox");
    if (!box) return;
    const img = $("#lbImg"), cap = $("#lbCap");
    const items = $$(".gal-item");
    let i = 0, opener = null;

    const show = (n) => {
      i = (n + items.length) % items.length;
      const it = items[i];
      img.classList.remove("img-fail");
      img.src = $("img", it).currentSrc || $("img", it).src;
      img.alt = $("img", it).alt;
      cap.textContent = it.dataset.cap || "";
    };
    const open = (n, btn) => {
      opener = btn;
      show(n);
      box.classList.add("open");
      document.body.style.overflow = "hidden";
      $(".lb-close", box).focus();
    };
    const close = () => {
      box.classList.remove("open");
      document.body.style.overflow = "";
      opener?.focus();
    };

    items.forEach((it, n) => it.addEventListener("click", () => open(n, it)));
    $(".lb-close", box).addEventListener("click", close);
    $(".lb-prev", box).addEventListener("click", () => show(i - 1));
    $(".lb-next", box).addEventListener("click", () => show(i + 1));
    box.addEventListener("click", (e) => { if (e.target === box) close(); });

    document.addEventListener("keydown", (e) => {
      if (!box.classList.contains("open")) return;
      const rtl = root.dir === "rtl";
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") show(i + (rtl ? -1 : 1));
      else if (e.key === "ArrowLeft") show(i + (rtl ? 1 : -1));
    });
  }

  /* Live-feeling Power / Load values in the technology visual */
  function initTechLive() {
    const power = $("#techPower"), load = $("#techLoad");
    if (!power || !load || reduceMotion) return;
    const rand = (a, b) => Math.round(a + Math.random() * (b - a));
    setInterval(() => {
      if (document.hidden) return;
      power.textContent = `${rand(108, 132)} kW`;
      load.textContent = `${rand(58, 74)}%`;
    }, 2500);
  }

  /* Marquee: duplicate once so the -50% keyframe loops seamlessly */
  function initMarquee() {
    const track = $(".about-marquee-track");
    if (!track || track.dataset.cloned === "true") return;
    track.dataset.cloned = "true";
    track.insertAdjacentHTML("beforeend", track.innerHTML);
  }

  /* Magnetic buttons (mouse only) */
  function initMagneticButtons() {
    if (reduceMotion || !finePointer) return;
    $$(".magnetic-btn").forEach((btn) => {
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        const dx = e.clientX - r.left - r.width / 2;
        const dy = e.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${dx * 0.12}px, ${dy * 0.12}px)`;
      });
      btn.addEventListener("pointerleave", () => { btn.style.transform = ""; });
    });
  }

  /* Escape closes the mobile nav */
  function initEscapeToCloseNav() {
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      const nav = $("#mainNav"), btn = $("#menuBtn");
      if (nav?.classList.contains("open")) {
        nav.classList.remove("open");
        btn?.setAttribute("aria-expanded", "false");
      }
    });
  }
})();