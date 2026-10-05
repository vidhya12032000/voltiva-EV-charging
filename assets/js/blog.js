/* =========================================================
   VOLTIVA — BLOG PAGE JS
   Self-contained: theme, RTL, menu, loader + blog features.
   ========================================================= */
(function () {
  "use strict";

  var root = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var canHover = window.matchMedia("(hover: hover)").matches;

  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

  /* ---------------- THEME ---------------- */
  var themeBtn = $("#themeToggle");

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    document.body.classList.remove("light", "dark", "light-theme", "dark-theme");
    document.body.classList.add(theme, theme + "-theme");
    if (themeBtn) {
      themeBtn.textContent = theme === "dark" ? "☾" : "☀";
      themeBtn.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
    }
    store("voltiva-theme", theme);
    store("theme", theme);
  }
  applyTheme(read("voltiva-theme") || read("theme") || "dark");

  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      applyTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark");
    });
  }

  /* ---------------- RTL ---------------- */
  var rtlBtn = $("#rtlToggle");
  function applyDir(dir) {
    root.setAttribute("dir", dir);
    if (rtlBtn) rtlBtn.setAttribute("aria-pressed", String(dir === "rtl"));
    store("voltiva-dir", dir);
    placePill(); // tab pill position changes in RTL
  }
  if (rtlBtn) {
    rtlBtn.addEventListener("click", function () {
      applyDir(root.getAttribute("dir") === "rtl" ? "ltr" : "rtl");
    });
  }

  /* ---------------- MOBILE MENU ---------------- */
  var menuBtn = $("#menuBtn");
  var nav = $("#mainNav");

  function setMenu(open) {
    if (!nav || !menuBtn) return;
    nav.classList.toggle("open", open);
    nav.classList.toggle("is-open", open);
    document.body.classList.toggle("nav-open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  if (menuBtn && nav) {
    menuBtn.addEventListener("click", function () { setMenu(!nav.classList.contains("open")); });
    $$(".nav-link", nav).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
    window.addEventListener("resize", function () { if (window.innerWidth > 900) setMenu(false); });
  }

  /* ---------------- LOADER ---------------- */
  var loader = $("#pageLoader");
  function hideLoader() {
    if (!loader) return;
    loader.classList.add("hide", "hidden", "is-hidden");
    loader.style.opacity = "0";
    loader.style.visibility = "hidden";
    loader.style.pointerEvents = "none";
  }
  window.addEventListener("load", function () { setTimeout(hideLoader, 300); });
  setTimeout(hideLoader, 2500);

  /* ---------------- SCROLL: header, back-top, progress ---------------- */
  var header = $("#siteHeader");
  var backTop = $("#backTop");
  var bar = $("#blProgress");

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (header) {
      header.classList.toggle("scrolled", y > 20);
      header.classList.toggle("is-scrolled", y > 20);
    }
    if (backTop) backTop.classList.toggle("show", y > 600);
    if (bar) bar.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (backTop) {
    backTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  /* ---------------- TOAST ---------------- */
  var toastEl = $("#toast");
  var toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("show", "visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("show", "visible"); }, 2400);
  }

  /* =========================================================
     HERO: letter-drop title, sparks, pointer parallax
     ========================================================= */
  var title = $("#blTitle");
  if (title) {
    var text = title.textContent;
    title.textContent = "";
    var hotFrom = text.indexOf("ideas");
    for (var i = 0; i < text.length; i++) {
      var s = document.createElement("span");
      s.className = "ch" + (text[i] === " " ? " sp" : "") + (hotFrom > -1 && i >= hotFrom ? " hot" : "");
      s.style.setProperty("--i", i);
      s.setAttribute("aria-hidden", "true");
      s.textContent = text[i] === " " ? "\u00A0" : text[i];
      title.appendChild(s);
    }
  }

  var sparks = $("#blSparks");
  if (sparks && !reduceMotion) {
    for (var n = 0; n < 16; n++) {
      var sp = document.createElement("i");
      sp.className = "bl-spark";
      sp.style.left = Math.random() * 100 + "%";
      sp.style.animationDuration = 5 + Math.random() * 6 + "s";
      sp.style.animationDelay = -Math.random() * 8 + "s";
      sp.style.height = 8 + Math.random() * 16 + "px";
      sparks.appendChild(sp);
    }
  }

  var hero = $("#blHero");
  var orbs = $$(".bl-orb");
  if (hero && canHover && !reduceMotion) {
    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      orbs.forEach(function (o) {
        var d = parseFloat(o.getAttribute("data-depth")) || 20;
        o.style.transform = "translate(" + px * d * 2 + "px," + py * d * 2 + "px)";
      });
    });
  }

  /* =========================================================
     POSTS DATA
     Images are free Unsplash links. If one fails to load,
     the card shows a bolt placeholder instead of a broken icon.
     ========================================================= */
  function img(id) {
    return "https://images.unsplash.com/photo-" + id + "?auto=format&fit=crop&w=1000&q=75";
  }

  var POSTS = [
    {
      id: 1, featured: true, cat: "Guides", date: "28 Sep 2026", read: 7,
      title: "Fast charging in Chennai: where to stop and what it costs",
      excerpt: "A practical map of the city's DC chargers, with real session times for the most common batteries.",
      img: img("1593941707882-a5bba14938c7"),
      body: [
        "Chennai's fast chargers cluster along the OMR, ECR and GST corridors. If you drive between those, you will rarely be more than 15 minutes from a bay.",
        "A 40 kWh car going from 20% to 80% on a 60 kW charger takes about 25 minutes. Above 80% the car slows the charge to protect the battery, so most drivers leave at 80%.",
        "Plan your stop around something you would do anyway, like lunch. A short, frequent top-up is cheaper and kinder to the battery than a full charge every time."
      ]
    },
    {
      id: 2, cat: "Home", date: "21 Sep 2026", read: 5,
      title: "Is a home wall box worth it? The honest maths",
      excerpt: "Compare a 7.4 kW wall box with a regular socket, including installation, tariffs and time saved.",
      img: img("1558618666-fcd25c85cd64"),
      body: [
        "A normal socket adds roughly 10 to 15 km of range per hour. A 7.4 kW wall box adds around 40 km per hour, enough to refill a day of city driving overnight.",
        "Installation costs depend on the distance from your meter and whether your wiring needs an upgrade. A site survey gives you a fixed number before you commit.",
        "If you park in a fixed spot and drive more than 30 km a day, the wall box usually pays back within the first year compared with public charging."
      ]
    },
    {
      id: 3, cat: "Road trips", date: "14 Sep 2026", read: 8,
      title: "Chennai to Pondicherry on one charge, with a plan B",
      excerpt: "How to drive the East Coast Road in an EV without range anxiety, and where to top up if you need to.",
      img: img("1473341304170-971dccb5ac1e"),
      body: [
        "The trip is about 150 km each way. Most modern EVs can do the one-way leg easily, but the return in summer with AC on is where planning matters.",
        "Start at 100% if you can, keep speed near 80 km/h and use the Stations page to note one backup charger before you leave.",
        "Charge while you eat in Pondicherry. By dessert you will have enough for the drive home."
      ]
    },
    {
      id: 4, cat: "Tech", date: "09 Sep 2026", read: 6,
      title: "CCS2 vs Type 2: which connector does your car use?",
      excerpt: "A simple way to read the connector on your car and match it to the right charger.",
      img: img("1635776062127-d379bfcba9f8"),
      body: [
        "Type 2 is the round-ish plug used for AC charging at home and public AC points. CCS2 adds two extra pins underneath for fast DC charging.",
        "Check the charging flap on your car. If you see the two extra pins, you can use both kinds of charger with the right cable.",
        "Our Stations page lets you filter by connector so you only see chargers your car can actually use."
      ]
    },
    {
      id: 5, cat: "Tech", date: "02 Sep 2026", read: 6,
      title: "Why your car slows down after 80% charge",
      excerpt: "The battery science behind the charging curve, explained without the jargon.",
      img: img("1486262715619-67b85e0b08d3"),
      body: [
        "Think of filling a glass of water. You pour fast at first, then slow down near the top so nothing spills. Your battery does the same.",
        "As cells fill up, the car's battery management system reduces the power it accepts to avoid heat and wear.",
        "That is why the last 20% can take as long as the first 60%. Stopping at 80% is usually the fastest way to get moving."
      ]
    },
    {
      id: 6, cat: "Guides", date: "25 Aug 2026", read: 4,
      title: "Charging etiquette: six small habits that help everyone",
      excerpt: "Move your car when you are done, reserve only what you need, and other ways to keep bays free.",
      img: img("1617704548623-340376564e68"),
      body: [
        "Unplug and move once your target charge is reached. Even ten extra minutes can block the next driver.",
        "Reserve a bay only when you are close. The app holds it for 30 minutes, so book when you are on your way.",
        "If a charger is faulty, report it in the app. It helps the next driver and gets it fixed faster."
      ]
    },
    {
      id: 7, cat: "Home", date: "18 Aug 2026", read: 5,
      title: "Setting up charging in your apartment society",
      excerpt: "A step-by-step guide to getting approval, choosing a setup and splitting the bill fairly.",
      img: img("1497435334941-8c899ee9e8e9"),
      body: [
        "Start with a short list of residents who already own or plan to buy an EV. A clear number helps the committee decide.",
        "Ask for a load assessment so the building's supply is not overloaded. Smart chargers can balance power across bays automatically.",
        "Use per-resident metering so everyone pays for exactly what they charge."
      ]
    },
    {
      id: 8, cat: "Road trips", date: "10 Aug 2026", read: 7,
      title: "Monsoon driving in an EV: what to know",
      excerpt: "Water, charging and range during heavy rain, from people who drive through it every year.",
      img: img("1509391366360-2e959784a276"),
      body: [
        "Modern EVs and charging ports are sealed against rain, so charging in a downpour is safe. Keep the cable off standing water anyway.",
        "Range drops a little with wipers, lights and slower traffic. Add a 10% buffer to your plan.",
        "Avoid driving through deep flooding. If water reaches the bottom of the doors, turn back."
      ]
    },
    {
      id: 9, cat: "Guides", date: "01 Aug 2026", read: 5,
      title: "Reading your charging bill: units, idle fees and taxes",
      excerpt: "Every line on a charging receipt explained, plus how to spend less on each session.",
      img: img("1519681393784-d120267933ba"),
      body: [
        "Most of the bill is energy, measured in kWh. Faster chargers usually cost more per unit, so match the speed to how long you will stay.",
        "Idle fees apply when you stay plugged in after charging finishes. Set an alert in the app so you are back in time.",
        "Taxes are listed separately. A monthly plan can reduce the per-unit price if you charge often."
      ]
    },
    {
      id: 10, cat: "Tech", date: "22 Jul 2026", read: 6,
      title: "Smart charging: how scheduling saves money and the grid",
      excerpt: "Move your charge to off-peak hours and let the charger do the thinking.",
      img: img("1593941707882-a5bba14938c7"),
      body: [
        "Electricity is cheaper late at night when demand is low. A smart charger can wait until then and still have you full by morning.",
        "Scheduling also reduces strain on the local grid, which matters when many cars plug in at once after work.",
        "Set a departure time in the app and the charger works backwards to finish just before you leave."
      ]
    }
  ];

  var PAGE = 6;
  var state = { cat: "all", q: "", shown: PAGE };

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function hl(text, q) {
    var safe = esc(text);
    if (!q) return safe;
    var re = new RegExp("(" + q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig");
    return safe.replace(re, "<mark>$1</mark>");
  }
  function imgHTML(src, alt, eager) {
    return '<div class="bl-img"><img src="' + src + '" alt="' + esc(alt) + '" ' +
      (eager ? "" : 'loading="lazy" ') + 'onerror="this.parentNode.classList.add(\'fail\')"></div>';
  }

  /* ---------- featured ---------- */
  var featured = POSTS.filter(function (p) { return p.featured; })[0];
  var featEl = $("#blFeatured");
  if (featured && featEl) {
    featEl.innerHTML =
      '<span class="bl-badge">Featured</span>' +
      imgHTML(featured.img, "", true) +
      '<div class="bl-featured-body">' +
        '<div class="bl-meta"><span class="bl-cat">' + esc(featured.cat) + '</span><span>' + esc(featured.date) + '</span><span>' + featured.read + ' min read</span></div>' +
        '<h3>' + esc(featured.title) + '</h3>' +
        '<p>' + esc(featured.excerpt) + '</p>' +
        '<span class="bl-read">Read the story <i aria-hidden="true">→</i></span>' +
      '</div>';
    featEl.addEventListener("click", function () { openPost(featured.id); });
    featEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openPost(featured.id); }
    });
  }

  /* ---------- grid ---------- */
  var grid = $("#blGrid");
  var countEl = $("#blCount");
  var emptyEl = $("#blEmpty");
  var moreBtn = $("#blMore");

  function filtered() {
    var q = state.q.trim().toLowerCase();
    return POSTS.filter(function (p) {
      if (p.featured) return false;
      if (state.cat !== "all" && p.cat !== state.cat) return false;
      if (!q) return true;
      return (p.title + " " + p.excerpt + " " + p.cat).toLowerCase().indexOf(q) > -1;
    });
  }

  function render(animateFrom) {
    var list = filtered();
    var visible = list.slice(0, state.shown);
    var q = state.q.trim();
    var start = animateFrom || 0;

    if (!animateFrom) grid.innerHTML = "";

    visible.slice(start).forEach(function (p, idx) {
      var card = document.createElement("article");
      card.className = "bl-card";
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", "Open story: " + p.title);
      card.style.setProperty("--d", idx);
      card.dataset.id = p.id;
      card.innerHTML =
        '<span class="bl-cat-float">' + esc(p.cat) + '</span>' +
        imgHTML(p.img, "") +
        '<div class="bl-card-body">' +
          '<div class="bl-meta"><span>' + esc(p.date) + '</span><span>' + p.read + ' min read</span></div>' +
          '<h3>' + hl(p.title, q) + '</h3>' +
          '<p>' + hl(p.excerpt, q) + '</p>' +
          '<span class="bl-read">Read more <i aria-hidden="true">→</i></span>' +
        '</div>';
      grid.appendChild(card);
    });

    countEl.textContent = list.length + (list.length === 1 ? " story" : " stories") +
      (state.cat !== "all" ? " in " + state.cat : "") + (q ? ' matching "' + q + '"' : "");
    emptyEl.hidden = list.length > 0;
    moreBtn.hidden = list.length <= state.shown;
  }

  /* open + tilt via delegation */
  grid.addEventListener("click", function (e) {
    var c = e.target.closest(".bl-card");
    if (c) openPost(parseInt(c.dataset.id, 10));
  });
  grid.addEventListener("keydown", function (e) {
    var c = e.target.closest(".bl-card");
    if (c && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openPost(parseInt(c.dataset.id, 10)); }
  });

  if (canHover && !reduceMotion) {
    grid.addEventListener("pointermove", function (e) {
      var c = e.target.closest(".bl-card");
      if (!c) return;
      var r = c.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width;
      var y = (e.clientY - r.top) / r.height;
      c.style.setProperty("--ry", ((x - 0.5) * 8) + "deg");
      c.style.setProperty("--rx", ((0.5 - y) * 8) + "deg");
      c.style.setProperty("--mx", x * 100 + "%");
      c.style.setProperty("--my", y * 100 + "%");
    });
    grid.addEventListener("pointerout", function (e) {
      var c = e.target.closest(".bl-card");
      if (!c) return;
      c.style.setProperty("--rx", "0deg");
      c.style.setProperty("--ry", "0deg");
    });
  }

  /* ---------- tabs + sliding pill ---------- */
  var tabsWrap = $("#blTabs");
  var pill = $("#blPill");
  var tabs = $$(".bl-tab");

  function placePill() {
    var active = $(".bl-tab.active");
    if (!active || !pill) return;
    pill.style.width = active.offsetWidth + "px";
    pill.style.transform = "translateX(" + active.offsetLeft + "px)";
  }

  tabs.forEach(function (t) {
    t.addEventListener("click", function () {
      tabs.forEach(function (o) {
        var on = o === t;
        o.classList.toggle("active", on);
        o.setAttribute("aria-pressed", String(on));
      });
      state.cat = t.getAttribute("data-cat");
      state.shown = PAGE;
      placePill();
      swap();
    });
  });
  window.addEventListener("resize", placePill);

  /* fade old cards out, then render the new set */
  function swap() {
    if (reduceMotion) { render(); return; }
    $$(".bl-card", grid).forEach(function (c) { c.classList.add("leaving"); });
    setTimeout(render, 220);
  }

  /* ---------- search ---------- */
  var searchEl = $("#blSearch");
  var searchTimer;
  if (searchEl) {
    searchEl.addEventListener("input", function () {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function () {
        state.q = searchEl.value;
        state.shown = PAGE;
        render();
        if (state.q) $("#allPosts").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      }, 200);
    });
  }

  var resetBtn = $("#blReset");
  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      state = { cat: "all", q: "", shown: PAGE };
      searchEl.value = "";
      tabs.forEach(function (o) {
        var on = o.getAttribute("data-cat") === "all";
        o.classList.toggle("active", on);
        o.setAttribute("aria-pressed", String(on));
      });
      placePill();
      render();
    });
  }

  /* ---------- load more ---------- */
  moreBtn.addEventListener("click", function () {
    var before = Math.min(state.shown, filtered().length);
    state.shown += 3;
    render(before);
    // render(before) only appends; refresh counters
  });

  /* =========================================================
     READER DIALOG
     ========================================================= */
  var dlg = $("#blDialog");
  var likeBtn = $("#blLike");
  var currentId = null;
  var lastFocus = null;

  function liked() {
    try { return JSON.parse(read("voltiva-liked") || "[]"); } catch (e) { return []; }
  }

  function openPost(id) {
    var p = POSTS.filter(function (x) { return x.id === id; })[0];
    if (!p || !dlg || typeof dlg.showModal !== "function") return;

    currentId = id;
    lastFocus = document.activeElement;

    $("#blDlgHero").innerHTML = imgHTML(p.img, "", true);
    $("#blDlgMeta").innerHTML =
      '<span class="bl-cat">' + esc(p.cat) + '</span><span>' + esc(p.date) + '</span><span>' + p.read + ' min read</span>';
    $("#blDlgTitle").textContent = p.title;
    $("#blDlgText").innerHTML = p.body.map(function (t, i) {
      return '<p style="--p:' + i + '">' + esc(t) + '</p>';
    }).join("");

    var isLiked = liked().indexOf(id) > -1;
    likeBtn.classList.toggle("liked", isLiked);
    likeBtn.setAttribute("aria-pressed", String(isLiked));
    likeBtn.innerHTML = '<span>' + (isLiked ? "♥" : "♡") + '</span> ' + (isLiked ? "Liked" : "Like");

    $("#blDlgScroll").scrollTop = 0;
    dlg.showModal();
    document.body.classList.add("dlg-open");
  }

  if (dlg) {
    dlg.addEventListener("close", function () {
      document.body.classList.remove("dlg-open");
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    });
    dlg.addEventListener("click", function (e) {
      if (e.target === dlg) dlg.close(); // backdrop click
    });
    $("#blDlgClose").addEventListener("click", function () { dlg.close(); });
  }

  likeBtn.addEventListener("click", function () {
    var list = liked();
    var i = list.indexOf(currentId);
    if (i > -1) list.splice(i, 1); else list.push(currentId);
    store("voltiva-liked", JSON.stringify(list));
    var on = i === -1;
    likeBtn.classList.toggle("liked", on);
    likeBtn.setAttribute("aria-pressed", String(on));
    likeBtn.innerHTML = '<span>' + (on ? "♥" : "♡") + '</span> ' + (on ? "Liked" : "Like");
  });

  $("#blCopy").addEventListener("click", function () {
    var url = location.href.split("#")[0] + "#story-" + currentId;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () { toast("Link copied"); },
        function () { toast("Could not copy the link"); });
    } else {
      toast("Copy is not supported in this browser");
    }
  });

  /* deep link: blog.html#story-3 opens that story */
  function openFromHash() {
    var m = location.hash.match(/^#story-(\d+)$/);
    if (m) openPost(parseInt(m[1], 10));
  }

  /* =========================================================
     NEWSLETTER
     ========================================================= */
  var form = $("#blNewsForm");
  var email = $("#blEmail");
  var msg = $("#blFormMsg");
  var burst = $("#blBurst");

  function fireBurst() {
    if (reduceMotion || !burst) return;
    for (var i = 0; i < 14; i++) {
      var b = document.createElement("span");
      b.className = "bl-bolt";
      b.textContent = "⚡";
      var angle = (Math.PI * 2 * i) / 14;
      var dist = 120 + Math.random() * 140;
      b.style.setProperty("--x", Math.cos(angle) * dist + "px");
      b.style.setProperty("--y", Math.sin(angle) * dist + "px");
      b.style.setProperty("--r", (Math.random() * 120 - 60) + "deg");
      burst.appendChild(b);
      (function (el) { setTimeout(function () { el.remove(); }, 1200); })(b);
    }
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var v = email.value.trim();
    var ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
    msg.classList.toggle("bad", !ok);
    email.classList.remove("err");

    if (!ok) {
      void email.offsetWidth; // restart the shake
      email.classList.add("err");
      msg.textContent = "Enter a valid email address, like you@example.com.";
      email.focus();
      return;
    }
    msg.textContent = "You are in. Look out for the next issue.";
    fireBurst();
    toast("Subscribed");
    form.reset();
  });

  /* =========================================================
     SCROLL REVEAL (headings + newsletter)
     ========================================================= */
  var revealEls = $$(".bl-section .section-heading, .bl-news-card, .bl-featured");
  revealEls.forEach(function (el) { el.classList.add("bl-reveal"); });
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- init ---------- */
  applyDir(read("voltiva-dir") === "rtl" ? "rtl" : "ltr");
  render();
  window.addEventListener("load", function () { placePill(); openFromHash(); });
  placePill();
})();