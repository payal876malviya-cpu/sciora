/* ==========================================================================
   Sciora — main.js
   Small, dependency-free modules:
   1. Theme (dark / light with persistence)
   2. Sticky header state
   3. Mobile navigation
   4. Scroll reveal
   5. Scrollspy (active nav link)
   6. Animated counters
   7. Contact form validation
   8. Footer year
   ========================================================================== */
(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ======================================================================
     1. Theme
     ====================================================================== */
  var themeToggle = document.getElementById("themeToggle");
  var metaThemeColor = document.querySelector('meta[name="theme-color"]');
  var THEME_KEY = "sciora-theme";

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    if (themeToggle) {
      var isLight = theme === "light";
      themeToggle.setAttribute("aria-label", isLight ? "Switch to dark theme" : "Switch to light theme");
      themeToggle.setAttribute("aria-pressed", String(isLight));
    }
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", theme === "light" ? "#f7f9fd" : "#070b14");
    }
  }

  function initTheme() {
    var stored = null;
    try {
      stored = localStorage.getItem(THEME_KEY);
    } catch (err) {
      /* storage may be blocked — fall back to system preference */
    }
    var systemLight = window.matchMedia("(prefers-color-scheme: light)").matches;
    applyTheme(stored || (systemLight ? "light" : "dark"));

    if (!themeToggle) return;

    themeToggle.addEventListener("click", function () {
      var next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
      applyTheme(next);
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch (err) {
        /* ignore */
      }
    });
  }

  /* ======================================================================
     2. Sticky header state
     ====================================================================== */
  function initHeader() {
    var header = document.getElementById("siteHeader");
    if (!header) return;

    var update = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  /* ======================================================================
     3. Mobile navigation
     ====================================================================== */
  function initNav() {
    var toggle = document.getElementById("navToggle");
    var nav = document.getElementById("primaryNav");
    var backdrop = document.getElementById("navBackdrop");
    if (!toggle || !nav) return;

    function setOpen(open) {
      toggle.classList.toggle("is-open", open);
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");

      if (backdrop) {
        if (open) {
          backdrop.hidden = false;
          // Next frame so the transition runs from opacity 0
          requestAnimationFrame(function () {
            backdrop.classList.add("is-visible");
          });
        } else {
          backdrop.classList.remove("is-visible");
          window.setTimeout(function () {
            backdrop.hidden = true;
          }, 320);
        }
      }

      if (open) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
    }

    toggle.addEventListener("click", function () {
      setOpen(!nav.classList.contains("is-open"));
    });

    if (backdrop) {
      backdrop.addEventListener("click", function () {
        setOpen(false);
      });
    }

    // Close after choosing a link
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        if (nav.classList.contains("is-open")) setOpen(false);
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        setOpen(false);
        toggle.focus();
      }
    });

    // Reset when growing past the breakpoint
    window.addEventListener("resize", function () {
      if (window.innerWidth > 860 && nav.classList.contains("is-open")) {
        setOpen(false);
      }
    });
  }

  /* ======================================================================
     Shared helper: run a callback once, when an element first becomes
     relevant to the viewport.

     IntersectionObserver alone is not enough here — a fast scroll, an anchor
     jump or a restored scroll position can carry an element past the viewport
     between two frames, and it would then never fire (content stuck invisible
     at opacity 0, counters stuck at 0). So a rAF-throttled scroll sweep backs
     the observer up and guarantees every element is eventually handled.
     ====================================================================== */
  function onFirstVisible(elements, callback, options) {
    var list = Array.prototype.slice.call(elements);
    if (!list.length) return;

    var settings = options || {};
    var ratio = typeof settings.ratio === "number" ? settings.ratio : 0.12;
    var observer = null;
    var ticking = false;

    function fire(el) {
      var index = list.indexOf(el);
      if (index === -1) return;
      list.splice(index, 1);
      if (observer) observer.unobserve(el);
      callback(el);
    }

    function sweep() {
      ticking = false;
      if (!list.length) return;
      // Everything whose top edge has entered (or passed) the viewport counts.
      var limit = window.innerHeight * 0.94;
      list.slice().forEach(function (el) {
        if (el.getBoundingClientRect().top < limit) fire(el);
      });
    }

    function schedule() {
      if (ticking || !list.length) return;
      ticking = true;
      requestAnimationFrame(sweep);
    }

    if (!("IntersectionObserver" in window)) {
      list.slice().forEach(fire);
      return;
    }

    observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          // "isIntersecting" covers normal scrolling; the boundingRect check
          // covers elements the viewport jumped over.
          if (entry.isIntersecting || entry.boundingClientRect.top < 0) fire(entry.target);
        });
      },
      { threshold: ratio, rootMargin: "0px 0px -6% 0px" }
    );

    list.forEach(function (el) {
      observer.observe(el);
    });

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    window.addEventListener("load", schedule, { passive: true });
    sweep();
  }

  /* ======================================================================
     4. Scroll reveal
     ====================================================================== */
  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    if (prefersReducedMotion) {
      items.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }

    onFirstVisible(items, function (el) {
      el.classList.add("is-visible");
    });
  }

  /* ======================================================================
     5. Scrollspy — highlights the nav link for the section in view
     ====================================================================== */
  function initScrollspy() {
    var links = Array.prototype.slice.call(document.querySelectorAll(".nav__link"));
    if (!links.length || !("IntersectionObserver" in window)) return;

    var map = {};
    var sections = [];

    links.forEach(function (link) {
      var id = link.getAttribute("href");
      if (!id || id.charAt(0) !== "#") return;
      var section = document.querySelector(id);
      if (!section) return;
      map[section.id] = link;
      sections.push(section);
    });

    function setActive(id) {
      links.forEach(function (link) {
        link.classList.toggle("is-active", link.getAttribute("href") === "#" + id);
      });
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });

    // Keep the first link active when scrolled to the very top
    window.addEventListener(
      "scroll",
      function () {
        if (window.scrollY < 80 && sections.length) setActive(sections[0].id);
      },
      { passive: true }
    );
  }

  /* ======================================================================
     6. Animated counters
     ====================================================================== */
  function formatNumber(value, decimals, suffix) {
    return value.toLocaleString("en-IN", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }) + suffix;
  }

  function animateCounter(el) {
    var target = parseFloat(el.getAttribute("data-target")) || 0;
    var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
    var suffix = el.getAttribute("data-suffix") || "";
    var duration = 1500;
    var start = null;

    function format(value) {
      return formatNumber(value, decimals, suffix);
    }

    if (prefersReducedMotion) {
      el.textContent = format(target);
      return;
    }

    function step(timestamp) {
      if (start === null) start = timestamp;
      var progress = Math.min((timestamp - start) / duration, 1);
      // easeOutCubic
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = format(target * eased);
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = format(target);
      }
    }

    requestAnimationFrame(step);
  }

  function initCounters() {
    var counters = document.querySelectorAll(".counter");
    if (!counters.length) return;

    // The markup already holds the final value, so the number stays correct
    // if JavaScript never runs. It is only reset once the count-up starts.
    onFirstVisible(counters, animateCounter, { ratio: 0.4 });
  }

  /* ======================================================================
     7. Contact form validation
     Front-end only — swap the fetch() call for your own endpoint/backend.
     ====================================================================== */
  function initForm() {
    var form = document.getElementById("contactForm");
    if (!form) return;

    var success = document.getElementById("formSuccess");
    var emailPattern = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

    var rules = {
      name: function (value) {
        if (!value) return "Please tell us your name.";
        if (value.length < 2) return "That name looks a little short.";
        return "";
      },
      email: function (value) {
        if (!value) return "An email helps us reply.";
        if (!emailPattern.test(value)) return "Please enter a valid email address.";
        return "";
      },
      subject: function (value) {
        if (!value) return "Pick the subject you need help with.";
        return "";
      },
      message: function (value) {
        if (!value) return "Add a short message.";
        if (value.length < 10) return "A little more detail, please (10+ characters).";
        return "";
      }
    };

    function showError(field, message) {
      var wrapper = field.closest(".field");
      var slot = wrapper ? wrapper.querySelector(".field__error") : null;
      if (wrapper) wrapper.classList.toggle("has-error", Boolean(message));
      if (slot) slot.textContent = message;
      field.setAttribute("aria-invalid", message ? "true" : "false");
      return !message;
    }

    function validateField(field) {
      var rule = rules[field.name];
      if (!rule) return true;
      return showError(field, rule(field.value.trim()));
    }

    var fields = Array.prototype.slice.call(form.querySelectorAll("input, select, textarea"));

    fields.forEach(function (field) {
      field.addEventListener("blur", function () {
        validateField(field);
      });
      field.addEventListener("input", function () {
        if (field.closest(".field").classList.contains("has-error")) validateField(field);
      });
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var firstInvalid = null;
      fields.forEach(function (field) {
        if (!validateField(field) && !firstInvalid) firstInvalid = field;
      });

      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      // Demo behaviour: show the success state and reset.
      // Replace this block with a fetch() to your backend or form service.
      if (success) {
        success.hidden = false;
        window.setTimeout(function () {
          success.hidden = true;
        }, 6000);
      }
      form.reset();
      fields.forEach(function (field) {
        showError(field, "");
      });
    });
  }

  /* ======================================================================
     8. Footer year
     ====================================================================== */
  function initYear() {
    var year = document.getElementById("year");
    if (year) year.textContent = String(new Date().getFullYear());
  }

  /* ======================================================================
     Boot
     ====================================================================== */
  function boot() {
    initTheme();
    initHeader();
    initNav();
    initReveal();
    initScrollspy();
    initCounters();
    initForm();
    initYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
