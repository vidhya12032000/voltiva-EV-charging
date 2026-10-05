"use strict";

/* =========================================================
   HELPERS
========================================================= */

const $ = (selector, parent = document) =>
  parent.querySelector(selector);

const $$ = (selector, parent = document) =>
  [...parent.querySelectorAll(selector)];


/* =========================================================
   LOADER
========================================================= */

function initLoader() {

  const loader = $("#pageLoader");

  if (!loader) return;

  window.addEventListener("load", () => {

    setTimeout(() => {
      loader.classList.add("hide");
    }, 350);

  });

}


/* =========================================================
   MOBILE MENU
========================================================= */

function initMobileMenu() {

  const menuBtn = $("#menuBtn");
  const nav = $("#mainNav");

  if (!menuBtn || !nav) return;


  const setMenu = (open) => {

    nav.classList.toggle("open", open);

    menuBtn.classList.toggle("active", open);

    menuBtn.setAttribute(
      "aria-expanded",
      String(open)
    );

    menuBtn.setAttribute(
      "aria-label",
      open ? "Close menu" : "Open menu"
    );

  };


  menuBtn.addEventListener("click", (event) => {

    event.preventDefault();
    event.stopPropagation();

    setMenu(
      !nav.classList.contains("open")
    );

  });


  $$(".nav-link", nav).forEach((link) => {

    link.addEventListener("click", () => {
      setMenu(false);
    });

  });


  document.addEventListener("click", (event) => {

    if (
      nav.classList.contains("open") &&
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


/* =========================================================
   THEME
========================================================= */

function initTheme() {

  const button = $("#themeToggle");

  if (!button) return;


  const saved =
    localStorage.getItem("voltiva-theme");


  if (saved === "dark") {
    document.documentElement.dataset.theme =
      "dark";
  }


  updateIcon();


  button.addEventListener("click", () => {

    const isDark =
      document.documentElement.dataset.theme ===
      "dark";


    if (isDark) {

      delete document.documentElement.dataset.theme;

      localStorage.setItem(
        "voltiva-theme",
        "light"
      );

    } else {

      document.documentElement.dataset.theme =
        "dark";

      localStorage.setItem(
        "voltiva-theme",
        "dark"
      );

    }


    updateIcon();

  });


  function updateIcon() {

    const dark =
      document.documentElement.dataset.theme ===
      "dark";


    button.textContent =
      dark ? "☀" : "☾";

  }

}


/* =========================================================
   RTL
========================================================= */

function initRTL() {

  const button = $("#rtlToggle");

  if (!button) return;


  const saved =
    localStorage.getItem(
      "voltiva-direction"
    );


  if (saved === "rtl") {

    document.documentElement.dir = "rtl";

    button.setAttribute(
      "aria-pressed",
      "true"
    );

  }


  button.addEventListener("click", () => {

    const rtl =
      document.documentElement.dir !== "rtl";


    document.documentElement.dir =
      rtl ? "rtl" : "ltr";


    localStorage.setItem(
      "voltiva-direction",
      rtl ? "rtl" : "ltr"
    );


    button.setAttribute(
      "aria-pressed",
      String(rtl)
    );

  });

}


/* =========================================================
   FAQ ACCORDION
========================================================= */

function initAccordion() {

  const items =
    $$(".faq-item");


  items.forEach((item) => {

    const question =
      $(".faq-question", item);


    if (!question) return;


    question.addEventListener("click", () => {

      const isOpen =
        item.classList.contains("open");


      // Close other FAQ
      items.forEach((other) => {

        if (other !== item) {

          other.classList.remove("open");

          const btn =
            $(".faq-question", other);

          if (btn) {

            btn.setAttribute(
              "aria-expanded",
              "false"
            );

          }

        }

      });


      item.classList.toggle(
        "open",
        !isOpen
      );


      question.setAttribute(
        "aria-expanded",
        String(!isOpen)
      );

    });

  });

}


/* =========================================================
   FAQ SEARCH + FILTER
========================================================= */

function initFAQSearch() {

  const search =
    $("#faqSearch");

  const clear =
    $("#clearSearch");

  const items =
    $$(".faq-item");

  const tabs =
    $$(".faq-tab");

  const empty =
    $("#emptyState");

  const resultText =
    $("#resultText");

  const reset =
    $("#resetFAQ");

  if (!items.length) return;


  let activeCategory = "all";


  function filterFAQs() {

    const query =
      search.value
        .trim()
        .toLowerCase();


    let visibleCount = 0;


    items.forEach((item) => {

      const category =
        item.dataset.category || "";


      const keywords =
        (
          item.dataset.keywords ||
          ""
        ).toLowerCase();


      const text =
        item.textContent.toLowerCase();


      const categoryMatch =
        activeCategory === "all" ||
        category === activeCategory;


      const searchMatch =
        !query ||
        keywords.includes(query) ||
        text.includes(query);


      const show =
        categoryMatch &&
        searchMatch;


      item.style.display =
        show ? "" : "none";


      if (show) {
        visibleCount++;
      }

    });


    empty.classList.toggle(
      "show",
      visibleCount === 0
    );


    if (
      activeCategory === "all" &&
      !query
    ) {

      resultText.textContent =
        "Browse common questions or search for something specific.";

    } else {

      resultText.textContent =
        `${visibleCount} question${
          visibleCount === 1
            ? ""
            : "s"
        } found`;

    }


    clear.classList.toggle(
      "visible",
      query.length > 0
    );

  }


  /* Search */

  search.addEventListener(
    "input",
    filterFAQs
  );


  /* Category */

  tabs.forEach((tab) => {

    tab.addEventListener("click", () => {

      tabs.forEach((item) => {
        item.classList.remove("active");
      });


      tab.classList.add("active");


      activeCategory =
        tab.dataset.category ||
        "all";


      filterFAQs();

    });

  });


  /* Clear */

  clear.addEventListener("click", () => {

    search.value = "";

    filterFAQs();

    search.focus();

  });


  /* Reset */

  reset.addEventListener("click", () => {

    search.value = "";

    activeCategory = "all";


    tabs.forEach((tab) => {

      tab.classList.toggle(
        "active",
        tab.dataset.category === "all"
      );

    });


    filterFAQs();

  });


  /* Popular topics */

  $$("[data-topic]").forEach((button) => {

    button.addEventListener("click", () => {

      const topic =
        button.dataset.topic;


      search.value = topic;


      const matchingTab =
        $(
          `.faq-tab[data-category="${topic}"]`
        );


      if (matchingTab) {

        tabs.forEach((tab) => {
          tab.classList.remove("active");
        });

        matchingTab.classList.add("active");

        activeCategory = topic;

      } else {

        activeCategory = "all";

      }


      filterFAQs();


      document
        .querySelector(".faq-section")
        ?.scrollIntoView({
          behavior: "smooth"
        });

    });

  });


  /* Ctrl / Cmd + K */

  document.addEventListener(
    "keydown",
    (event) => {

      const modifier =
        event.ctrlKey ||
        event.metaKey;


      if (
        modifier &&
        event.key.toLowerCase() === "k"
      ) {

        event.preventDefault();

        search.focus();

      }

    }
  );


  filterFAQs();

}


/* =========================================================
   PROFILE
========================================================= */

function initProfile() {

  const button =
    $(".profile-btn");


  if (!button) return;


  button.addEventListener("click", () => {

    showToast(
      "Account features are coming soon."
    );

  });

}


/* =========================================================
   TOAST
========================================================= */

function showToast(message) {

  const toast =
    $("#toast");


  if (!toast) return;


  toast.textContent = message;

  toast.classList.add("show");


  clearTimeout(
    showToast.timer
  );


  showToast.timer =
    setTimeout(() => {

      toast.classList.remove("show");

    }, 2400);

}


/* =========================================================
   SCROLL HEADER
========================================================= */

function initScroll() {

  const header =
    $("#siteHeader");


  if (!header) return;


  window.addEventListener(
    "scroll",
    () => {

      header.classList.toggle(
        "scrolled",
        window.scrollY > 20
      );

    },
    { passive: true }
  );

}


/* =========================================================
   FAQ REVEAL
========================================================= */

function initReveal() {

  const items =
    $$(".faq-item");


  if (
    !("IntersectionObserver" in window)
  ) {
    return;
  }


  const observer =
    new IntersectionObserver(
      (entries) => {

        entries.forEach((entry) => {

          if (!entry.isIntersecting) {
            return;
          }


          entry.target.animate(
            [
              {
                opacity: 0,
                transform:
                  "translateY(18px)"
              },
              {
                opacity: 1,
                transform:
                  "translateY(0)"
              }
            ],
            {
              duration: 500,
              easing: "cubic-bezier(.22,1,.36,1)",
              fill: "forwards"
            }
          );


          observer.unobserve(
            entry.target
          );

        });

      },
      {
        threshold: .08
      }
    );


  items.forEach((item) => {
    observer.observe(item);
  });

}


/* =========================================================
   INIT
========================================================= */

function init() {

  initLoader();

  initMobileMenu();

  initTheme();

  initRTL();

  initAccordion();

  initFAQSearch();

  initProfile();

  initScroll();

  initReveal();

}


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