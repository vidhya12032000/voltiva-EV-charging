/* =========================================================
   VOLTIVA — SERVICES PAGE JS
   This page does NOT load main.js / site.js, so this file owns:
   loader, theme, RTL, mobile menu, header state, back-to-top,
   plus tabs, hero meter, estimator, billing switch and FAQ.
========================================================= */

(() => {
  "use strict";

  /* ---------- utilities ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  const root = document.documentElement;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const store = {
    get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
    set(key, val) { try { localStorage.setItem(key, val); } catch (e) { /* storage blocked */ } }
  };

  /* ---------- toast ---------- */
  const toastEl = $("#toast");
  let toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2600);
  }


  /* ---------- loader ---------- */
  function initLoader() {
    const loader = $("#pageLoader");
    if (!loader) return;

    let done = false;
    const hide = () => {
      if (done) return;
      done = true;
      loader.classList.add("hide", "is-hidden");
      loader.setAttribute("aria-hidden", "true");
      setTimeout(() => { loader.style.display = "none"; }, 600);
    };

    if (document.readyState === "complete") setTimeout(hide, 250);
    else window.addEventListener("load", () => setTimeout(hide, 250), { once: true });

    setTimeout(hide, 2500); // safety net: never trap the visitor
  }


  /* ---------- theme ---------- */
  // CSS default is dark, so "no saved theme" means dark.
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
      store.set("voltiva-theme", next);
    });
  }


  /* ---------- RTL ---------- */
  function initRTL() {
    const btn = $("#rtlToggle");
    const sync = () => btn?.setAttribute("aria-pressed", String(root.getAttribute("dir") === "rtl"));
    sync();

    btn?.addEventListener("click", () => {
      const rtl = root.getAttribute("dir") !== "rtl";
      root.setAttribute("dir", rtl ? "rtl" : "ltr");
      store.set("voltiva-dir", rtl ? "rtl" : "ltr");
      sync();
    });
  }


  /* ---------- header, menu, back-to-top ---------- */
  function initChrome() {
    const header = $("#siteHeader");
    const nav = $("#mainNav");
    const menuBtn = $("#menuBtn");
    const backTop = $("#backTop");

    const setMenu = (open) => {
      nav?.classList.toggle("open", open);
      nav?.classList.toggle("is-open", open);
      root.classList.toggle("menu-open", open);
      menuBtn?.setAttribute("aria-expanded", String(open));
      menuBtn?.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    };

    menuBtn?.addEventListener("click", () => setMenu(!nav.classList.contains("open")));
    $$(".nav-link", nav || document).forEach((a) => a.addEventListener("click", () => setMenu(false)));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
    window.addEventListener("resize", () => { if (window.innerWidth > 900) setMenu(false); });

    const onScroll = () => {
      const y = window.scrollY;
      header?.classList.toggle("scrolled", y > 20);
      header?.classList.toggle("is-scrolled", y > 20);
      backTop?.classList.toggle("show", y > 600);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    backTop?.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    });
  }


  /* ---------- hero meter ---------- */
  function initMeter() {
    const ring = $("#meterRing");
    const pct = $("#meterPct");
    const label = $("#meterLabel");
    if (!ring || !pct) return;

    const C = 515.2; // 2 * PI * 82

    const set = (v) => {
      ring.style.strokeDashoffset = (C * (1 - v / 100)).toFixed(1);
      pct.textContent = `${Math.round(v)}%`;
      if (label) label.textContent = v >= 100 ? "Charged" : v > 80 ? "Topping up" : "Charging";
    };

    if (reduced) return set(80);

    const RUN = 9000;   // charging time
    const HOLD = 2200;  // pause at full
    let visible = true;
    let t0 = performance.now();

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(ring);
    }

    const loop = (now) => {
      if (visible) {
        const t = clamp(((now - t0) % (RUN + HOLD)) / RUN);
        // fast to 80%, slow crawl to 100% (mirrors the estimator)
        const v = t < 0.7 ? (t / 0.7) * 80 : 80 + ((t - 0.7) / 0.3) * 20;
        set(v);
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }


  /* ---------- service tabs ---------- */
  function initTabs() {
    const tabs = $$(".sv-tab");
    const cards = $$(".sv-card");
    const empty = $("#svEmpty");
    if (!tabs.length) return;

    const select = (cat) => {
      tabs.forEach((t) => {
        const on = t.dataset.cat === cat;
        t.classList.toggle("active", on);
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
      });
      let shown = 0;
      cards.forEach((c) => {
        const match = cat === "all" || c.dataset.cat === cat;
        c.hidden = !match;
        if (match) shown++;
      });
      if (empty) empty.hidden = shown > 0;
    };

    tabs.forEach((t, i) => {
      t.addEventListener("click", () => select(t.dataset.cat));
      t.addEventListener("keydown", (e) => {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        const dir = (e.key === "ArrowRight") === (root.getAttribute("dir") !== "rtl") ? 1 : -1;
        const next = tabs[(i + dir + tabs.length) % tabs.length];
        next.focus();
        select(next.dataset.cat);
      });
    });

    select("all");
  }


  /* ---------- charge estimator ---------- */
  function initCalculator() {
    const battery = $("#calcBattery");
    const charger = $("#calcCharger");
    const start = $("#calcStart");
    const end = $("#calcEnd");
    if (!battery || !charger || !start || !end) return;

    const startOut = $("#calcStartOut");
    const endOut = $("#calcEndOut");
    const batFrom = $("#batFrom");
    const batTo = $("#batTo");
    const resTime = $("#resTime");
    const resEnergy = $("#resEnergy");
    const resCost = $("#resCost");

    const fmtTime = (hours) => {
      const mins = Math.max(1, Math.round(hours * 60));
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return h ? `${h} h ${m} min` : `${m} min`;
    };

    const update = () => {
      const size = Number(battery.value);
      const opt = charger.selectedOptions[0];
      const power = Number(charger.value);
      const rate = Number(opt.dataset.rate);
      const s = Number(start.value);
      const e = Number(end.value);

      // Car can't accept more than roughly 2C, and chargers lose ~8% as heat.
      const usable = Math.min(power, size * 2) * 0.92;
      // DC chargers taper hard past 80%; AC barely does.
      const taper = power >= 50 ? 0.35 : 0.9;

      const fastKwh = size * Math.max(0, Math.min(e, 80) - s) / 100;
      const slowKwh = size * Math.max(0, e - Math.max(s, 80)) / 100;
      const kwh = fastKwh + slowKwh;
      const hours = fastKwh / usable + slowKwh / (usable * taper);

      startOut.textContent = `${s}%`;
      endOut.textContent = `${e}%`;
      batFrom.style.width = `${s}%`;
      batTo.style.width = `${e}%`;
      resTime.textContent = fmtTime(hours);
      resEnergy.textContent = `${kwh.toFixed(1)} kWh`;
      resCost.textContent = `₹${Math.round(kwh * rate).toLocaleString("en-IN")}`;
    };

    // Keep target above start, and start below target.
    start.addEventListener("input", () => {
      if (Number(start.value) >= Number(end.value)) end.value = Math.min(100, Number(start.value) + 5);
      update();
    });
    end.addEventListener("input", () => {
      if (Number(end.value) <= Number(start.value)) start.value = Math.max(0, Number(end.value) - 5);
      update();
    });
    battery.addEventListener("change", update);
    charger.addEventListener("change", update);

    update();
  }


  /* ---------- plans: monthly / yearly ---------- */
  function initBilling() {
    const buttons = $$(".sv-billing button");
    const amounts = $$(".sv-price .amt[data-monthly]");
    if (!buttons.length) return;

    const set = (mode, announce) => {
      buttons.forEach((b) => {
        const on = b.dataset.billing === mode;
        b.classList.toggle("active", on);
        b.setAttribute("aria-pressed", String(on));
      });
      amounts.forEach((el) => {
        const value = Number(el.dataset[mode]);
        el.textContent = `₹${value.toLocaleString("en-IN")}`;
      });
      if (announce) {
        toast(mode === "yearly"
          ? "Yearly billing: prices shown per month, billed yearly."
          : "Monthly billing selected.");
      }
    };

    buttons.forEach((b) => b.addEventListener("click", () => set(b.dataset.billing, true)));
    set("monthly", false);
  }


  /* ---------- FAQ accordion ---------- */
  function initFaq() {
    const items = $$(".sv-faq-item");
    if (!items.length) return;

    const setOpen = (item, open) => {
      const q = $(".sv-faq-q", item);
      const a = $(".sv-faq-a", item);
      q.setAttribute("aria-expanded", String(open));
      a.style.maxHeight = open ? `${a.scrollHeight}px` : "0px";
    };

    items.forEach((item) => {
      $(".sv-faq-q", item).addEventListener("click", () => {
        const open = $(".sv-faq-q", item).getAttribute("aria-expanded") !== "true";
        items.forEach((other) => { if (other !== item) setOpen(other, false); });
        setOpen(item, open);
      });
    });

    // Keep open panels the right height if text reflows.
    window.addEventListener("resize", () => {
      items.forEach((item) => {
        if ($(".sv-faq-q", item).getAttribute("aria-expanded") === "true") setOpen(item, true);
      });
    });
  }


  /* ---------- scroll reveal ---------- */
  function initReveal() {
    const targets = $$(".sv-section, .sv-cta-inner");
    if (reduced || !("IntersectionObserver" in window)) return;

    targets.forEach((el) => el.classList.add("sv-reveal"));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.08 });
    targets.forEach((el) => io.observe(el));

    // Safety net: never leave content invisible.
    setTimeout(() => targets.forEach((el) => el.classList.add("in")), 4000);
  }


  /* ---------- boot ---------- */
  function init() {
    initLoader();
    initTheme();
    initRTL();
    initChrome();
    initMeter();
    initTabs();
    initCalculator();
    initBilling();
    initFaq();
    initReveal();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();