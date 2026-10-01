/* =========================================================
   VOLTIVA — ABOUT PAGE JAVASCRIPT
   Page: pages/about.html
   File: assets/js/about.js
   Vanilla JavaScript only
========================================================= */

(() => {
  "use strict";

  /* =========================================================
     HELPERS
  ========================================================= */

  const $ = (selector, parent = document) =>
    parent.querySelector(selector);

  const $$ = (selector, parent = document) =>
    [...parent.querySelectorAll(selector)];

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* =========================================================
     ABOUT PAGE READY
  ========================================================= */

  document.addEventListener("DOMContentLoaded", () => {
    initAboutPage();
  });

  function initAboutPage() {
    initThemeSync();
    initRTL();
    initHeroMotion();
    initScrollReveal();
    initCounters();
    initTimeline();
    initCardTilt();
    initCursorGlow();
    initOrbitSystem();
    initNetworkAnimation();
    initImpactRings();
    initMagneticButtons();
    initScrollProgress();
    initMarquee();
    initAboutCTA();
  }

  /* =========================================================
     THEME SYNC
  ========================================================= */

  function initThemeSync() {
    const themeToggle = $("#themeToggle");

    if (!themeToggle) return;

    const updateIcon = () => {
      const isDark =
        document.documentElement.getAttribute("data-theme") === "dark";

      themeToggle.textContent = isDark ? "☀" : "☾";
      themeToggle.setAttribute(
        "aria-label",
        isDark ? "Switch to light mode" : "Switch to dark mode"
      );
    };

    updateIcon();

    themeToggle.addEventListener("click", () => {
      setTimeout(updateIcon, 30);
    });
  }

  /* =========================================================
     RTL
  ========================================================= */

  function initRTL() {
    const rtlToggle = $("#rtlToggle");

    if (!rtlToggle) return;

    const savedRTL = localStorage.getItem("voltiva-rtl");

    if (savedRTL === "true") {
      document.documentElement.dir = "rtl";
      rtlToggle.setAttribute("aria-pressed", "true");
    }

    rtlToggle.addEventListener("click", () => {
      const isRTL = document.documentElement.dir === "rtl";

      document.documentElement.dir = isRTL ? "ltr" : "rtl";

      localStorage.setItem(
        "voltiva-rtl",
        String(!isRTL)
      );

      rtlToggle.setAttribute(
        "aria-pressed",
        String(!isRTL)
      );
    });
  }

  /* =========================================================
     HERO MOUSE / POINTER MOTION
  ========================================================= */

  function initHeroMotion() {
    const hero = $(".about-hero");

    if (!hero || prefersReducedMotion) return;

    const visual = $(".about-hero-visual", hero);
    const glow = $(".about-hero-glow", hero);

    hero.addEventListener("pointermove", (event) => {
      const rect = hero.getBoundingClientRect();

      const x =
        ((event.clientX - rect.left) / rect.width) * 100;

      const y =
        ((event.clientY - rect.top) / rect.height) * 100;

      hero.style.setProperty("--mx", `${x}%`);
      hero.style.setProperty("--my", `${y}%`);

      if (visual) {
        const rotateX = (y - 50) * -0.035;
        const rotateY = (x - 50) * 0.035;

        visual.style.transform = `
          perspective(1000px)
          rotateX(${rotateX}deg)
          rotateY(${rotateY}deg)
          translateZ(0)
        `;
      }

      if (glow) {
        glow.style.left = `${x}%`;
        glow.style.top = `${y}%`;
      }
    });

    hero.addEventListener("pointerleave", () => {
      if (visual) {
        visual.style.transform =
          "perspective(1000px) rotateX(0deg) rotateY(0deg)";
      }
    });
  }

  /* =========================================================
     SCROLL REVEAL
  ========================================================= */

  function initScrollReveal() {
    const elements = $$(
      ".about-reveal, .about-section-heading, " +
      ".about-metric-card, .timeline-item, " +
      ".value-card, .about-tech-card, .team-card, " +
      ".impact-card, .about-cta"
    );

    if (!elements.length) return;

    if (prefersReducedMotion) {
      elements.forEach((element) => {
        element.classList.add("is-visible");
      });

      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const element = entry.target;

          const delay =
            element.dataset.delay || "0";

          element.style.setProperty(
            "--reveal-delay",
            `${delay}ms`
          );

          element.classList.add("is-visible");

          obs.unobserve(element);
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -60px 0px"
      }
    );

    elements.forEach((element, index) => {
      element.dataset.delay =
        element.dataset.delay ||
        Math.min(index * 50, 350);

      observer.observe(element);
    });
  }

  /* =========================================================
     ANIMATED COUNTERS
  ========================================================= */

  function initCounters() {
    const counters = $$(
      "[data-counter], .about-counter"
    );

    if (!counters.length) return;

    const animateCounter = (element) => {
      if (element.dataset.counted === "true") return;

      element.dataset.counted = "true";

      const target =
        Number(
          element.dataset.counter ||
          element.dataset.value ||
          element.textContent.replace(/[^\d.]/g, "")
        ) || 0;

      const suffix =
        element.dataset.suffix ||
        element.textContent.replace(/[\d.,\s]/g, "");

      const duration = 1600;

      if (prefersReducedMotion) {
        element.textContent =
          formatNumber(target) + suffix;

        return;
      }

      const start = performance.now();

      const update = (time) => {
        const progress = Math.min(
          (time - start) / duration,
          1
        );

        const eased =
          1 - Math.pow(1 - progress, 3);

        const current =
          target * eased;

        element.textContent =
          formatNumber(current) + suffix;

        if (progress < 1) {
          requestAnimationFrame(update);
        }
      };

      requestAnimationFrame(update);
    };

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          animateCounter(entry.target);
          obs.unobserve(entry.target);
        });
      },
      {
        threshold: 0.6
      }
    );

    counters.forEach((counter) => {
      observer.observe(counter);
    });
  }

  function formatNumber(number) {
    if (number >= 1000) {
      return Math.round(number).toLocaleString();
    }

    if (Number.isInteger(number)) {
      return number.toString();
    }

    return number.toFixed(1);
  }

  /* =========================================================
     TIMELINE
  ========================================================= */

  function initTimeline() {
    const timeline = $(".about-timeline");

    if (!timeline) return;

    const items = $$(".timeline-item", timeline);

    if (!items.length) return;

    if (prefersReducedMotion) {
      items.forEach((item) => {
        item.classList.add("is-active");
      });

      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-active");
          }
        });
      },
      {
        threshold: 0.45
      }
    );

    items.forEach((item) => observer.observe(item));
  }

  /* =========================================================
     3D CARD TILT
  ========================================================= */

  function initCardTilt() {
    if (prefersReducedMotion) return;

    const cards = $$(
      ".value-card, .team-card, .about-tech-card, " +
      ".impact-card, .about-metric-card"
    );

    cards.forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        const rect =
          card.getBoundingClientRect();

        const x =
          event.clientX - rect.left;

        const y =
          event.clientY - rect.top;

        const rotateY =
          ((x / rect.width) - 0.5) * 8;

        const rotateX =
          ((y / rect.height) - 0.5) * -8;

        card.style.setProperty(
          "--card-rx",
          `${rotateX}deg`
        );

        card.style.setProperty(
          "--card-ry",
          `${rotateY}deg`
        );

        card.style.setProperty(
          "--card-x",
          `${x}px`
        );

        card.style.setProperty(
          "--card-y",
          `${y}px`
        );
      });

      card.addEventListener("pointerleave", () => {
        card.style.setProperty(
          "--card-rx",
          "0deg"
        );

        card.style.setProperty(
          "--card-ry",
          "0deg"
        );
      });
    });
  }

  /* =========================================================
     CURSOR GLOW
  ========================================================= */

  function initCursorGlow() {
    if (prefersReducedMotion) return;

    const glow =
      $(".about-cursor-glow");

    if (!glow) return;

    let raf = null;

    document.addEventListener("pointermove", (event) => {
      if (raf) return;

      raf = requestAnimationFrame(() => {
        glow.style.transform =
          `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;

        raf = null;
      });
    });
  }

  /* =========================================================
     ORBIT / ENERGY SYSTEM
  ========================================================= */

  function initOrbitSystem() {
    const orbit =
      $(".about-orbit-scene");

    if (!orbit || prefersReducedMotion) return;

    const nodes =
      $$(".energy-node", orbit);

    nodes.forEach((node, index) => {
      node.style.setProperty(
        "--node-index",
        index
      );

      node.addEventListener("mouseenter", () => {
        node.classList.add("is-highlighted");
      });

      node.addEventListener("mouseleave", () => {
        node.classList.remove("is-highlighted");
      });
    });

    const core =
      $(".energy-core", orbit);

    if (core) {
      let pulse = 0;

      const animateCore = () => {
        pulse += 0.025;

        const scale =
          1 + Math.sin(pulse) * 0.025;

        core.style.transform =
          `scale(${scale})`;

        requestAnimationFrame(
          animateCore
        );
      };

      requestAnimationFrame(
        animateCore
      );
    }
  }

  /* =========================================================
     NETWORK / CONNECTION ANIMATION
  ========================================================= */

  function initNetworkAnimation() {
    const network =
      $(".about-network-scene");

    if (!network) return;

    const nodes =
      $$(".network-node", network);

    const connections =
      $$(".network-line", network);

    nodes.forEach((node, index) => {
      node.style.setProperty(
        "--network-delay",
        `${index * 180}ms`
      );
    });

    connections.forEach((line, index) => {
      line.style.setProperty(
        "--line-delay",
        `${index * 250}ms`
      );
    });

    const observer =
      new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting)
              return;

            network.classList.add(
              "network-active"
            );

            obs.unobserve(
              entry.target
            );
          });
        },
        {
          threshold: 0.25
        }
      );

    observer.observe(network);
  }

  /* =========================================================
     IMPACT / PROGRESS RINGS
  ========================================================= */

  function initImpactRings() {
    const rings =
      $$("[data-progress]");

    if (!rings.length) return;

    const animateRing = (ring) => {
      if (ring.dataset.animated)
        return;

      ring.dataset.animated = "true";

      const value =
        Math.min(
          100,
          Math.max(
            0,
            Number(
              ring.dataset.progress
            ) || 0
          )
        );

      ring.style.setProperty(
        "--progress",
        `${value}%`
      );

      ring.classList.add(
        "progress-active"
      );
    };

    const observer =
      new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting)
              return;

            animateRing(
              entry.target
            );

            obs.unobserve(
              entry.target
            );
          });
        },
        {
          threshold: 0.5
        }
      );

    rings.forEach((ring) =>
      observer.observe(ring)
    );
  }

  /* =========================================================
     MAGNETIC BUTTONS
  ========================================================= */

  function initMagneticButtons() {
    if (prefersReducedMotion) return;

    const buttons =
      $$(".magnetic-btn");

    buttons.forEach((button) => {
      button.addEventListener(
        "pointermove",
        (event) => {
          const rect =
            button.getBoundingClientRect();

          const x =
            event.clientX -
            rect.left -
            rect.width / 2;

          const y =
            event.clientY -
            rect.top -
            rect.height / 2;

          button.style.transform =
            `translate(${x * 0.12}px, ${y * 0.12}px)`;
        }
      );

      button.addEventListener(
        "pointerleave",
        () => {
          button.style.transform =
            "translate(0, 0)";
        }
      );
    });
  }

  /* =========================================================
     SCROLL PROGRESS
  ========================================================= */

  function initScrollProgress() {
    const progress =
      $(".about-scroll-progress");

    if (!progress) return;

    const update = () => {
      const scrollTop =
        window.scrollY;

      const height =
        document.documentElement
          .scrollHeight -
        window.innerHeight;

      const percentage =
        height > 0
          ? (scrollTop / height) * 100
          : 0;

      progress.style.width =
        `${percentage}%`;
    };

    window.addEventListener(
      "scroll",
      update,
      { passive: true }
    );

    update();
  }

  /* =========================================================
     ENERGY MARQUEE
  ========================================================= */

  function initMarquee() {
    const marquee =
      $(".about-marquee");

    if (!marquee) return;

    const track =
      $(".about-marquee-track", marquee);

    if (!track) return;

    if (
      track.dataset.cloned === "true"
    ) {
      return;
    }

    track.dataset.cloned = "true";

    const content =
      track.innerHTML;

    track.insertAdjacentHTML(
      "beforeend",
      content
    );
  }

  /* =========================================================
     CTA INTERACTION
  ========================================================= */

  function initAboutCTA() {
    const cta =
      $(".about-cta");

    if (!cta) return;

    const button =
      $(".about-cta .magnetic-btn");

    if (button) {
      button.addEventListener(
        "click",
        () => {
          const target =
            button.dataset.target;

          if (target) {
            const section =
              document.querySelector(
                target
              );

            if (section) {
              section.scrollIntoView({
                behavior:
                  prefersReducedMotion
                    ? "auto"
                    : "smooth"
              });
            }
          }
        }
      );
    }
  }

  /* =========================================================
     OPTIONAL HERO PARALLAX
  ========================================================= */

  function initHeroParallax() {
    if (prefersReducedMotion) return;

    const elements =
      $$("[data-parallax]");

    if (!elements.length) return;

    window.addEventListener(
      "scroll",
      () => {
        const scroll =
          window.scrollY;

        elements.forEach(
          (element) => {
            const speed =
              Number(
                element.dataset.parallax
              ) || 0.15;

            element.style.transform =
              `translate3d(0, ${scroll * speed}px, 0)`;
          }
        );
      },
      { passive: true }
    );
  }

  initHeroParallax();

  /* =========================================================
     KEYBOARD ACCESSIBILITY
  ========================================================= */

  document.addEventListener(
    "keydown",
    (event) => {
      if (event.key !== "Escape")
        return;

      const nav =
        $("#mainNav");

      const menuBtn =
        $("#menuBtn");

      if (
        nav &&
        nav.classList.contains("open")
      ) {
        nav.classList.remove("open");

        if (menuBtn) {
          menuBtn.setAttribute(
            "aria-expanded",
            "false"
          );
        }
      }
    }
  );

})();