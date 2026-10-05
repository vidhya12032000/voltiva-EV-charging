/* =========================================
   VOLTIVA CONTACT PAGE JS
========================================= */

(() => {

  "use strict";


  /* =======================================
     HELPERS
  ======================================= */

  const $ = (selector, parent = document) =>
    parent.querySelector(selector);

  const $$ = (selector, parent = document) =>
    [...parent.querySelectorAll(selector)];


  /* =======================================
     LOADER
  ======================================= */

  function initLoader() {

    const loader = $("#pageLoader");

    if (!loader) return;

    window.addEventListener("load", () => {

      setTimeout(() => {
        loader.classList.add("hide");
      }, 450);

    });

  }


  /* =======================================
     MOBILE MENU
  ======================================= */

  function initMobileMenu() {

    const menuBtn = $("#menuBtn");
    const nav = $("#mainNav");

    if (!menuBtn || !nav) return;


    function setMenu(open) {

      nav.classList.toggle("open", open);

      menuBtn.setAttribute(
        "aria-expanded",
        String(open)
      );

      menuBtn.setAttribute(
        "aria-label",
        open ? "Close menu" : "Open menu"
      );

    }


    menuBtn.addEventListener("click", (event) => {

      event.preventDefault();
      event.stopPropagation();

      const isOpen =
        nav.classList.contains("open");

      setMenu(!isOpen);

    });


    $$(".nav-link", nav).forEach((link) => {

      link.addEventListener("click", () => {
        setMenu(false);
      });

    });


    document.addEventListener("click", (event) => {

      if (!nav.classList.contains("open")) {
        return;
      }

      if (
        !nav.contains(event.target) &&
        !menuBtn.contains(event.target)
      ) {
        setMenu(false);
      }

    });


    document.addEventListener("keydown", (event) => {

      if (event.key === "Escape") {
        setMenu(false);
      }

    });


    window.addEventListener("resize", () => {

      if (window.innerWidth > 950) {
        setMenu(false);
      }

    });

  }


  /* =======================================
     THEME
  ======================================= */

  function initTheme() {

    const button = $("#themeToggle");

    if (!button) return;

    const root = document.documentElement;


    function updateIcon() {

      const dark =
        root.getAttribute("data-theme") === "dark";

      button.textContent =
        dark ? "☀" : "☾";

      button.setAttribute(
        "aria-label",
        dark
          ? "Switch to light mode"
          : "Switch to dark mode"
      );

    }


    const saved =
      localStorage.getItem("voltiva-theme");

    if (saved === "dark") {

      root.setAttribute(
        "data-theme",
        "dark"
      );

    } else {

      root.removeAttribute(
        "data-theme"
      );

    }


    updateIcon();


    button.addEventListener("click", () => {

      const dark =
        root.getAttribute("data-theme") === "dark";


      if (dark) {

        root.removeAttribute(
          "data-theme"
        );

        localStorage.setItem(
          "voltiva-theme",
          "light"
        );

      } else {

        root.setAttribute(
          "data-theme",
          "dark"
        );

        localStorage.setItem(
          "voltiva-theme",
          "dark"
        );

      }

      updateIcon();

    });

  }


  /* =======================================
     RTL
  ======================================= */

  function initRTL() {

    const button = $("#rtlToggle");

    if (!button) return;

    const root = document.documentElement;


    function setDirection(direction) {

      root.setAttribute(
        "dir",
        direction
      );

      const rtl =
        direction === "rtl";

      button.setAttribute(
        "aria-pressed",
        String(rtl)
      );

    }


    const saved =
      localStorage.getItem(
        "voltiva-direction"
      );


    setDirection(
      saved === "rtl"
        ? "rtl"
        : "ltr"
    );


    button.addEventListener("click", () => {

      const current =
        root.getAttribute("dir");

      const next =
        current === "rtl"
          ? "ltr"
          : "rtl";


      setDirection(next);

      localStorage.setItem(
        "voltiva-direction",
        next
      );


      /* Recalculate maps after direction change */

      setTimeout(() => {

        if (window.voltivaContactMap) {
          window.voltivaContactMap.invalidateSize();
        }

        if (window.voltivaFooterMap) {
          window.voltivaFooterMap.invalidateSize();
        }

      }, 250);

    });

  }


  /* =======================================
     CONTACT FORM
  ======================================= */

  function initContactForm() {

    const form = $("#contactForm");

    if (!form) return;


    const name = $("#name");
    const email = $("#email");
    const subject = $("#subject");
    const message = $("#message");
    const consent = $("#consent");

    const charCount = $("#charCount");
    const submitBtn = $("#submitBtn");


    /* Character count */

    if (message && charCount) {

      message.addEventListener(
        "input",
        () => {

          charCount.textContent =
            `${message.value.length} / 500`;

        }
      );

    }


    function clearErrors() {

      $$(".form-group").forEach((group) => {
        group.classList.remove("error");
      });


      $$(".field-error").forEach((error) => {
        error.textContent = "";
      });

    }


    function setError(
      input,
      errorElement,
      message
    ) {

      if (input) {

        const group =
          input.closest(".form-group");

        if (group) {
          group.classList.add("error");
        }

      }

      if (errorElement) {
        errorElement.textContent =
          message;
      }

    }


    function validateEmail(value) {

      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(value);

    }


    form.addEventListener(
      "submit",
      async (event) => {

        event.preventDefault();

        clearErrors();


        let valid = true;


        /* Name */

        if (
          !name.value.trim() ||
          name.value.trim().length < 2
        ) {

          setError(
            name,
            $("#nameError"),
            "Please enter your full name."
          );

          valid = false;

        }


        /* Email */

        if (
          !email.value.trim() ||
          !validateEmail(
            email.value.trim()
          )
        ) {

          setError(
            email,
            $("#emailError"),
            "Please enter a valid email address."
          );

          valid = false;

        }


        /* Subject */

        if (!subject.value) {

          setError(
            subject,
            $("#subjectError"),
            "Please select a topic."
          );

          valid = false;

        }


        /* Message */

        if (
          !message.value.trim() ||
          message.value.trim().length < 10
        ) {

          setError(
            message,
            $("#messageError"),
            "Message must contain at least 10 characters."
          );

          valid = false;

        }


        /* Consent */

        if (!consent.checked) {

          $("#consentError").textContent =
            "Please allow us to contact you.";

          valid = false;

        }


        if (!valid) {

          const firstError =
            $(".form-group.error input, .form-group.error select, .form-group.error textarea");

          if (firstError) {
            firstError.focus();
          }

          return;

        }


        /* Loading */

        submitBtn.classList.add("loading");

        submitBtn.querySelector("span").textContent =
          "Sending...";


        /* Demo submission */

        await new Promise((resolve) => {
          setTimeout(resolve, 1200);
        });


        form.reset();

        charCount.textContent =
          "0 / 500";


        submitBtn.classList.remove(
          "loading"
        );

        submitBtn.querySelector("span").textContent =
          "Send Message";


        showToast(
          "Message sent successfully! We'll contact you soon."
        );

      }
    );

  }


  /* =======================================
     PROFILE
  ======================================= */

  function initProfile() {

    const profileBtn =
      $("#profileBtn");

    if (!profileBtn) return;

    profileBtn.addEventListener(
      "click",
      () => {

        showToast(
          "Account features are coming soon."
        );

      }
    );

  }


  /* =======================================
     TOAST
  ======================================= */

  let toastTimer;


  function showToast(message) {

    const toast = $("#toast");

    if (!toast) return;


    clearTimeout(toastTimer);


    toast.textContent =
      message;

    toast.classList.add(
      "show"
    );


    toastTimer =
      setTimeout(() => {

        toast.classList.remove(
          "show"
        );

      }, 3500);

  }


  /* =======================================
     HEADER SCROLL
  ======================================= */

  function initScroll() {

    const header =
      $("#siteHeader");

    if (!header) return;


    function updateHeader() {

      if (window.scrollY > 20) {

        header.classList.add(
          "scrolled"
        );

      } else {

        header.classList.remove(
          "scrolled"
        );

      }

    }


    updateHeader();

    window.addEventListener(
      "scroll",
      updateHeader,
      { passive: true }
    );

  }


  /* =======================================
     REVEAL ANIMATION
  ======================================= */

  function initReveal() {

    const elements =
      $$(".reveal");

    if (!elements.length) return;


    if (
      !("IntersectionObserver" in window)
    ) {

      elements.forEach((element) => {
        element.classList.add("visible");
      });

      return;

    }


    const observer =
      new IntersectionObserver(
        (entries, obs) => {

          entries.forEach((entry) => {

            if (!entry.isIntersecting) {
              return;
            }

            entry.target.classList.add(
              "visible"
            );

            obs.unobserve(
              entry.target
            );

          });

        },
        {
          threshold: .12
        }
      );


    elements.forEach((element) => {
      observer.observe(element);
    });

  }


  /* =======================================
     MAP MARKER
  ======================================= */

  function createEVIcon() {

    return L.divIcon({

      className:
        "voltiva-ev-marker",

      html: `
        <div style="
          width:36px;
          height:36px;
          border-radius:50%;
          background:#17b85b;
          border:3px solid white;
          box-shadow:0 6px 20px rgba(0,0,0,.25);
          display:flex;
          align-items:center;
          justify-content:center;
          color:white;
          font-size:17px;
          font-weight:800;
        ">
          ⚡
        </div>
      `,

      iconSize: [36, 36],

      iconAnchor: [18, 18]

    });

  }


  /* =======================================
     CONTACT MAP
  ======================================= */

  function initContactMap() {

    const element =
      $("#contactMap");

    if (
      !element ||
      typeof L === "undefined"
    ) {
      return;
    }


    const chennai =
      [13.0827, 80.2707];


    const map =
      L.map(
        "contactMap",
        {
          zoomControl: true,
          scrollWheelZoom: false
        }
      ).setView(
        chennai,
        11
      );


    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,

        attribution:
          "&copy; OpenStreetMap contributors"
      }
    ).addTo(map);


    const stations = [

      {
        name:
          "Voltiva Anna Nagar",

        location:
          "Anna Nagar, Chennai",

        coords:
          [13.0850, 80.2101]
      },

      {
        name:
          "Voltiva T. Nagar",

        location:
          "T. Nagar, Chennai",

        coords:
          [13.0418, 80.2341]
      },

      {
        name:
          "Voltiva Adyar",

        location:
          "Adyar, Chennai",

        coords:
          [13.0012, 80.2565]
      },

      {
        name:
          "Voltiva OMR",

        location:
          "OMR, Chennai",

        coords:
          [12.9716, 80.2450]
      },

      {
        name:
          "Voltiva Velachery",

        location:
          "Velachery, Chennai",

        coords:
          [12.9750, 80.2210]
      },

      {
        name:
          "Voltiva Guindy",

        location:
          "Guindy, Chennai",

        coords:
          [13.0067, 80.2206]
      }

    ];


    const icon =
      createEVIcon();


    stations.forEach(
      (station) => {

        L.marker(
          station.coords,
          {
            icon
          }
        )
          .addTo(map)

          .bindPopup(`
            <div class="map-popup">

              <strong>
                ${station.name}
              </strong>

              <span>
                ${station.location}
              </span>

            </div>
          `);

      }
    );


    /* Mobility center */

    L.marker(
      chennai,
      {
        icon
      }
    )
      .addTo(map)

      .bindPopup(`
        <div class="map-popup">

          <strong>
            Voltiva Mobility Center
          </strong>

          <span>
            Chennai, Tamil Nadu
          </span>

        </div>
      `);


    window.voltivaContactMap =
      map;


    setTimeout(() => {
      map.invalidateSize();
    }, 400);


    window.addEventListener(
      "resize",
      () => {
        map.invalidateSize();
      }
    );

  }


  /* =======================================
     FOOTER MAP
  ======================================= */

  function initFooterMap() {

    const element =
      $("#footerMap");

    if (
      !element ||
      typeof L === "undefined"
    ) {
      return;
    }


    const chennai =
      [13.0827, 80.2707];


    const map =
      L.map(
        "footerMap",
        {
          zoomControl: true,
          scrollWheelZoom: false
        }
      ).setView(
        chennai,
        11
      );


    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,

        attribution:
          "&copy; OpenStreetMap contributors"
      }
    ).addTo(map);


    const stations = [

      {
        name:
          "Voltiva Anna Nagar",

        location:
          "Anna Nagar, Chennai",

        coords:
          [13.0850, 80.2101]
      },

      {
        name:
          "Voltiva T. Nagar",

        location:
          "T. Nagar, Chennai",

        coords:
          [13.0418, 80.2341]
      },

      {
        name:
          "Voltiva Adyar",

        location:
          "Adyar, Chennai",

        coords:
          [13.0012, 80.2565]
      },

      {
        name:
          "Voltiva OMR",

        location:
          "OMR, Chennai",

        coords:
          [12.9716, 80.2450]
      },

      {
        name:
          "Voltiva Velachery",

        location:
          "Velachery, Chennai",

        coords:
          [12.9750, 80.2210]
      },

      {
        name:
          "Voltiva Guindy",

        location:
          "Guindy, Chennai",

        coords:
          [13.0067, 80.2206]
      }

    ];


    const icon =
      createEVIcon();


    stations.forEach(
      (station) => {

        L.marker(
          station.coords,
          {
            icon
          }
        )
          .addTo(map)

          .bindPopup(`
            <div class="footer-popup">

              <strong>
                ${station.name}
              </strong>

              <span>
                ${station.location}
              </span>

            </div>
          `);

      }
    );


    window.voltivaFooterMap =
      map;


    setTimeout(() => {
      map.invalidateSize();
    }, 400);


    window.addEventListener(
      "resize",
      () => {
        map.invalidateSize();
      }
    );

  }


  /* =======================================
     INIT
  ======================================= */

  function init() {

    initLoader();

    initMobileMenu();

    initTheme();

    initRTL();

    initContactForm();

    initProfile();

    initScroll();

    initReveal();

    initContactMap();

    initFooterMap();

  }


  /* =======================================
     START
  ======================================= */

  if (
    document.readyState === "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      init
    );

  } else {

    init();

  }

})();