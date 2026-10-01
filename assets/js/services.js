/* =========================================================
   VOLTIVA — SERVICES PAGE JS
========================================================= */

(() => {
  "use strict";


  /* =======================================================
     HELPERS
  ======================================================= */

  const $ = (selector, scope = document) =>
    scope.querySelector(selector);

  const $$ = (selector, scope = document) =>
    [...scope.querySelectorAll(selector)];


  /* =======================================================
     PAGE LOADER
  ======================================================= */

  window.addEventListener("load", () => {

    const loader = $("#pageLoader");

    if (!loader) return;

    setTimeout(() => {
      loader.classList.add("loaded");

      setTimeout(() => {
        loader.remove();
      }, 600);

    }, 500);

  });


  /* =======================================================
     SCROLL PROGRESS
  ======================================================= */

  const updateScrollProgress = () => {

    const scrollRoad = $("#scrollRoad");

    if (!scrollRoad) return;

    const scrollTop =
      window.scrollY;

    const documentHeight =
      document.documentElement.scrollHeight -
      window.innerHeight;

    const progress =
      documentHeight > 0
        ? scrollTop / documentHeight
        : 0;

    document.documentElement.style.setProperty(
      "--p",
      progress
    );

  };

  window.addEventListener(
    "scroll",
    updateScrollProgress,
    { passive: true }
  );

  updateScrollProgress();


  /* =======================================================
     PARALLAX HERO
  ======================================================= */

  const heroScene =
    $(".services-hero-scene");

  if (heroScene) {

    window.addEventListener(
      "scroll",
      () => {

        const y =
          window.scrollY;

        heroScene.style.setProperty(
          "--py",
          `${y * 0.08}px`
        );

      },
      { passive: true }
    );

  }


  /* =======================================================
     NUMBER COUNTERS
  ======================================================= */

  const counters =
    $$("[data-count]");

  const animateCounter = (element) => {

    if (element.dataset.counted === "true") {
      return;
    }

    element.dataset.counted = "true";

    const target =
      Number(element.dataset.count);

    const duration = 1200;

    const startTime =
      performance.now();

    const update = (currentTime) => {

      const progress =
        Math.min(
          (currentTime - startTime) / duration,
          1
        );

      const eased =
        1 - Math.pow(1 - progress, 3);

      const value =
        Math.floor(target * eased);

      element.textContent =
        value.toLocaleString();

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        element.textContent =
          target.toLocaleString();
      }

    };

    requestAnimationFrame(update);

  };


  if ("IntersectionObserver" in window) {

    const counterObserver =
      new IntersectionObserver(
        entries => {

          entries.forEach(entry => {

            if (entry.isIntersecting) {

              animateCounter(entry.target);

              counterObserver.unobserve(
                entry.target
              );

            }

          });

        },
        {
          threshold: .5
        }
      );

    counters.forEach(counter =>
      counterObserver.observe(counter)
    );

  } else {

    counters.forEach(animateCounter);

  }


  /* =======================================================
     SERVICE FILTER
  ======================================================= */

  const filterButtons =
    $$(".service-filter-btn");

  const serviceCards =
    $$(".service-card");

  filterButtons.forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const category =
          button.dataset.category;

        filterButtons.forEach(btn =>
          btn.classList.remove("active")
        );

        button.classList.add("active");

        serviceCards.forEach((card, index) => {

          const cardCategory =
            card.dataset.category;

          const show =
            category === "all" ||
            cardCategory === category;

          if (show) {

            card.classList.remove(
              "is-hidden"
            );

            card.style.animationDelay =
              `${index * 60}ms`;

          } else {

            card.classList.add(
              "is-hidden"
            );

          }

        });

      }
    );

  });


  /* =======================================================
     SERVICE DETAILS
  ======================================================= */

  const serviceData = {

    charging: {
      icon: "⚡",
      title: "Fast EV Charging",
      description:
        "A connected charging experience that gives drivers clear station information and a simple way to start a charging session.",
      features: [
        "Live charger availability",
        "AC and DC charging support",
        "Fast charging up to 120 kW",
        "Connector compatibility information",
        "Charging session monitoring"
      ]
    },

    finder: {
      icon: "◉",
      title: "Smart Station Finder",
      description:
        "Find charging stations based on location, availability and charging requirements so you can plan your next stop with confidence.",
      features: [
        "Nearby station discovery",
        "Live availability information",
        "Connector filtering",
        "Fast-charging filters",
        "Route-friendly station selection"
      ]
    },

    management: {
      icon: "▣",
      title: "Charging Management",
      description:
        "A centralized operational layer for businesses managing charging infrastructure and station performance.",
      features: [
        "Centralized station management",
        "Charging point monitoring",
        "Station performance visibility",
        "Usage analytics",
        "Operational reporting"
      ]
    },

    fleet: {
      icon: "◇",
      title: "Fleet Charging",
      description:
        "Coordinate charging activity across electric vehicles and give fleet teams better visibility into energy and vehicle availability.",
      features: [
        "Fleet vehicle visibility",
        "Charging schedule management",
        "Energy consumption tracking",
        "Charging cost monitoring",
        "Operational insights"
      ]
    },

    energy: {
      icon: "☼",
      title: "Energy Intelligence",
      description:
        "Turn charging activity into useful energy information that helps operators understand demand and infrastructure usage.",
      features: [
        "Energy consumption monitoring",
        "Demand visibility",
        "Charging load insights",
        "Infrastructure utilization",
        "Energy usage analysis"
      ]
    },

    payments: {
      icon: "$",
      title: "Payments & Billing",
      description:
        "Simple digital charging transactions with transparent pricing, usage information and transaction history.",
      features: [
        "Digital charging payments",
        "Usage-based billing",
        "Transaction history",
        "Digital receipts",
        "Pricing visibility"
      ]
    }

  };


  const dialog =
    $("#serviceDialog");

  const dialogBody =
    $("#serviceDialogBody");

  const dialogClose =
    $("#serviceDialogClose");


  const openServiceDialog =
    serviceKey => {

      if (!dialog || !dialogBody) return;

      const service =
        serviceData[serviceKey];

      if (!service) return;

      dialogBody.innerHTML = `

        <div class="dialog-inner">

          <div class="dialog-icon">
            ${service.icon}
          </div>

          <h3>
            ${service.title}
          </h3>

          <p>
            ${service.description}
          </p>

          <ul class="dialog-features">

            ${service.features
              .map(
                feature =>
                  `<li>${feature}</li>`
              )
              .join("")}

          </ul>

        </div>

      `;

      if (typeof dialog.showModal === "function") {
        dialog.showModal();
      } else {
        dialog.setAttribute(
          "open",
          ""
        );
      }

      document.documentElement.classList.add(
        "dialog-open"
      );

    };


  $$(".service-details-btn")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          openServiceDialog(
            button.dataset.service
          );

        }
      );

    });


  if (dialogClose) {

    dialogClose.addEventListener(
      "click",
      () => {

        dialog.close();

      }
    );

  }


  if (dialog) {

    dialog.addEventListener(
      "click",
      event => {

        if (
          event.target === dialog
        ) {
          dialog.close();
        }

      }
    );

    dialog.addEventListener(
      "close",
      () => {

        document.documentElement.classList.remove(
          "dialog-open"
        );

      }
    );

  }


  /* =======================================================
     LIVE ENERGY DASHBOARD
  ======================================================= */

  const powerElement =
    $("#energyPower");

  const batteryElement =
    $("#batteryValue");

  const batteryProgress =
    $("#batteryProgress");

  const timeElement =
    $("#timeValue");


  let power = 82;
  let battery = 78;
  let minutes = 18;


  const updateEnergyDashboard = () => {

    if (powerElement) {

      power +=
        Math.random() > .5
          ? 1
          : -1;

      power =
        Math.max(
          70,
          Math.min(120, power)
        );

      powerElement.textContent =
        power;

    }


    if (batteryElement) {

      battery +=
        Math.random() > .65
          ? 1
          : 0;

      battery =
        Math.min(100, battery);

      batteryElement.textContent =
        `${battery}%`;

    }


    if (batteryProgress) {

      batteryProgress.style.width =
        `${battery}%`;

    }


    if (timeElement) {

      minutes =
        Math.max(
          4,
          20 -
          Math.floor(
            (battery - 75) * .7
          )
        );

      timeElement.textContent =
        `${minutes} min`;

    }

  };


  updateEnergyDashboard();

  setInterval(
    updateEnergyDashboard,
    2200
  );


  /* =======================================================
     DETAIL LIST INTERACTION
  ======================================================= */

  const detailItems =
    $$(".detail-list-item");

  detailItems.forEach(item => {

    item.addEventListener(
      "click",
      () => {

        detailItems.forEach(
          current =>
            current.classList.remove(
              "active"
            )
        );

        item.classList.add(
          "active"
        );

      }
    );

  });


  /* =======================================================
     FAQ
  ======================================================= */

  const faqItems =
    $$(".service-faq-item");

  faqItems.forEach(item => {

    item.addEventListener(
      "toggle",
      () => {

        if (!item.open) return;

        faqItems.forEach(other => {

          if (
            other !== item &&
            other.open
          ) {
            other.open = false;
          }

        });

      }
    );

  });


  /* =======================================================
     CARD MOUSE GLOW
  ======================================================= */

  serviceCards.forEach(card => {

    card.addEventListener(
      "pointermove",
      event => {

        const rect =
          card.getBoundingClientRect();

        const x =
          event.clientX -
          rect.left;

        const y =
          event.clientY -
          rect.top;

        card.style.setProperty(
          "--mx",
          `${x}px`
        );

        card.style.setProperty(
          "--my",
          `${y}px`
        );

      }
    );

  });


  /* =======================================================
     REVEAL ON SCROLL
  ======================================================= */

  const revealElements = [
    ...$$(".service-card"),
    ...$$(".service-process-step"),
    ...$$(".detail-list-item"),
    $(".intelligence-dashboard"),
    $(".detail-visual")
  ].filter(Boolean);


  revealElements.forEach(
    element => {

      element.style.opacity = "0";

      element.style.transform =
        "translateY(25px)";

      element.style.transition =
        "opacity .7s ease, transform .7s cubic-bezier(.2,.8,.2,1)";

    }
  );


  if ("IntersectionObserver" in window) {

    const revealObserver =
      new IntersectionObserver(
        entries => {

          entries.forEach(entry => {

            if (
              !entry.isIntersecting
            ) {
              return;
            }

            entry.target.style.opacity =
              "1";

            entry.target.style.transform =
              "translateY(0)";

            revealObserver.unobserve(
              entry.target
            );

          });

        },
        {
          threshold: .12
        }
      );


    revealElements.forEach(
      element =>
        revealObserver.observe(element)
    );

  } else {

    revealElements.forEach(
      element => {

        element.style.opacity = "1";

        element.style.transform =
          "translateY(0)";

      }
    );

  }


  /* =======================================================
     CTA CAR INTERACTION
  ======================================================= */

  const cta =
    $(".services-cta");

  const miniCar =
    $(".cta-mini-car");

  if (cta && miniCar) {

    cta.addEventListener(
      "pointerenter",
      () => {

        miniCar.style.animationPlayState =
          "paused";

      }
    );

    cta.addEventListener(
      "pointerleave",
      () => {

        miniCar.style.animationPlayState =
          "running";

      }
    );

  }


  /* =======================================================
     TOAST
  ======================================================= */

  const toast =
    $("#toast");

  let toastTimer;

  const showToast = message => {

    if (!toast) return;

    toast.textContent =
      message;

    toast.classList.add(
      "show"
    );

    clearTimeout(toastTimer);

    toastTimer =
      setTimeout(() => {

        toast.classList.remove(
          "show"
        );

      }, 2600);

  };


  /* =======================================================
     SERVICE BUTTON MICRO FEEDBACK
  ======================================================= */

  $$(".service-details-btn")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          showToast(
            "Opening service details..."
          );

        }
      );

    });


  /* =======================================================
     BACK TO TOP
  ======================================================= */

  const backTop =
    $("#backTop");

  if (backTop) {

    const toggleBackTop = () => {

      if (window.scrollY > 500) {

        backTop.classList.add(
          "show"
        );

      } else {

        backTop.classList.remove(
          "show"
        );

      }

    };

    window.addEventListener(
      "scroll",
      toggleBackTop,
      { passive: true }
    );

    toggleBackTop();


    backTop.addEventListener(
      "click",
      () => {

        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });

      }
    );

  }


  /* =======================================================
     ACTIVE SERVICE HASH
  ======================================================= */

  const hash =
    window.location.hash;

  if (hash === "#fleet") {

    const fleetButton =
      $('.service-filter-btn[data-category="fleet"]');

    if (fleetButton) {
      fleetButton.click();
    }

  }


})();