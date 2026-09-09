// Government Polytechnic, Chhotaudepur — shared vanilla JS
// No frameworks, no build step. Loaded from every page via a document-relative
// <script> path (e.g. "js/main.js" from root pages, "../js/main.js" from
// pages one folder deep), so this file itself must not assume page depth.
//
// fetch() calls below use ROOT-RELATIVE paths ("/data/...") on purpose: JSON
// data can only be fetched when the site is served over HTTP (even a simple
// local server), never via a plain double-clicked file:// page, so there is
// no file:// compatibility to preserve here — using a root-relative path
// keeps this one shared file correct from every page regardless of folder
// depth. See CLAUDE.md "Path & link conventions".

document.addEventListener("DOMContentLoaded", function () {
  initTextSizeControl();
  initMobileNavToggle();
  initDropdowns();
  populateCollegeInfo();
  populateImportantNotice();
  setCopyrightYear();
  populateVisitCounter();
});

// ---------- Site-wide text-size accessibility control ----------
// One shared control (markup duplicated in the utility bar on every page,
// same as the rest of the header) backed by one CSS custom property
// (--text-scale, see css/style.css) so scaling readable content is a single
// declaration rather than touching dozens of elements by hand. The level is
// remembered in localStorage so it carries across every page.
var TEXT_SCALE_LEVELS = [90, 100, 110, 120, 130];
var TEXT_SCALE_STORAGE_KEY = "gpc-text-scale";

function initTextSizeControl() {
  var decreaseBtn = document.getElementById("text-size-decrease");
  var increaseBtn = document.getElementById("text-size-increase");
  var percentEl = document.getElementById("text-size-percent");
  if (!decreaseBtn || !increaseBtn || !percentEl) return;

  var current = readStoredTextScale();
  applyTextScale(current, decreaseBtn, increaseBtn, percentEl);

  decreaseBtn.addEventListener("click", function () {
    var index = TEXT_SCALE_LEVELS.indexOf(current) - 1;
    if (index < 0) return;
    current = TEXT_SCALE_LEVELS[index];
    storeTextScale(current);
    applyTextScale(current, decreaseBtn, increaseBtn, percentEl);
  });

  increaseBtn.addEventListener("click", function () {
    var index = TEXT_SCALE_LEVELS.indexOf(current) + 1;
    if (index >= TEXT_SCALE_LEVELS.length) return;
    current = TEXT_SCALE_LEVELS[index];
    storeTextScale(current);
    applyTextScale(current, decreaseBtn, increaseBtn, percentEl);
  });
}

function readStoredTextScale() {
  try {
    var stored = parseInt(localStorage.getItem(TEXT_SCALE_STORAGE_KEY), 10);
    if (TEXT_SCALE_LEVELS.indexOf(stored) !== -1) return stored;
  } catch (e) {
    // localStorage unavailable (privacy mode, etc.) — fall back to default.
  }
  return 100;
}

function storeTextScale(value) {
  try {
    localStorage.setItem(TEXT_SCALE_STORAGE_KEY, String(value));
  } catch (e) {
    // Ignore — the preference simply won't persist this session.
  }
}

function applyTextScale(value, decreaseBtn, increaseBtn, percentEl) {
  document.documentElement.style.setProperty("--text-scale", value / 100);
  percentEl.textContent = String(value);
  decreaseBtn.disabled = value === TEXT_SCALE_LEVELS[0];
  increaseBtn.disabled = value === TEXT_SCALE_LEVELS[TEXT_SCALE_LEVELS.length - 1];
}

// ---------- Mobile hamburger menu ----------
function initMobileNavToggle() {
  var toggle = document.getElementById("nav-toggle");
  var menu = document.getElementById("primary-menu");
  if (!toggle || !menu) return;

  toggle.addEventListener("click", function () {
    var isOpen = menu.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
    if (!isOpen) closeAllDropdowns();
  });
}

// ---------- Dropdown menus (About, Academics, Admissions, Students, Facilities) ----------
function initDropdowns() {
  var toggles = document.querySelectorAll(".dropdown-toggle");

  toggles.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var item = btn.closest(".nav-item");
      var isOpen = item.classList.contains("is-open");
      closeAllDropdowns();
      if (!isOpen) {
        item.classList.add("is-open");
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });

  document.addEventListener("click", function (event) {
    if (!event.target.closest(".nav-item.has-dropdown")) closeAllDropdowns();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      var openItem = document.querySelector(".nav-item.is-open");
      closeAllDropdowns();
      if (openItem) {
        var btn = openItem.querySelector(".dropdown-toggle");
        if (btn) btn.focus();
      }
    }
  });
}

function closeAllDropdowns() {
  document.querySelectorAll(".nav-item.is-open").forEach(function (item) {
    item.classList.remove("is-open");
    var btn = item.querySelector(".dropdown-toggle");
    if (btn) btn.setAttribute("aria-expanded", "false");
  });
}

// ---------- Shared college facts (data/college-info.json) ----------
function populateCollegeInfo() {
  fetchJSON("/data/college-info.json")
    .then(function (info) {
      if (!info) return;
      document.querySelectorAll("[data-field]").forEach(function (el) {
        var field = el.getAttribute("data-field");
        var value = info[field];
        if (value && value !== "PLACEHOLDER - not yet provided") {
          el.textContent = value;
        }
      });
    })
    .catch(function () {
      // No server / fetch unavailable (e.g. local file:// preview) — the
      // placeholder text already in the HTML remains visible, which is the
      // correct fallback.
    });
}

// ---------- Important Notice banner (data/notices.json) ----------
function populateImportantNotice() {
  var section = document.getElementById("important-notice");
  if (!section) return;

  fetchJSON("/data/notices.json")
    .then(function (notices) {
      if (!Array.isArray(notices) || notices.length === 0) return;

      var latest = notices.slice().sort(function (a, b) {
        return new Date(b.date) - new Date(a.date);
      })[0];

      var link = document.getElementById("notice-link");
      var date = document.getElementById("notice-date");
      if (link) {
        link.textContent = latest.title || "";
        if (latest.file) link.href = latest.file;
      }
      if (date && latest.date) date.textContent = latest.date;

      section.hidden = false;
    })
    .catch(function () {
      // Keep the section hidden — no notices to show.
    });
}

// ---------- Footer copyright year ----------
function setCopyrightYear() {
  var el = document.getElementById("copyright-year");
  if (el) el.textContent = String(new Date().getFullYear());
}

// ---------- Global site-wide visit counter (counter.php) ----------
// One counter for the whole site, not one per page: every page load hits the
// same server-side endpoint, which increments a single shared file and hands
// back the new total. Root-relative ("/counter.php") for the same reason as
// the JSON fetches above — one path works from every page depth. counter.php
// requires PHP-enabled hosting (see CLAUDE.md); if it's unavailable the
// fetch/parse below simply fails and the element stays hidden, so a missing
// or broken counter never affects the rest of the page.
function populateVisitCounter() {
  var wrapper = document.getElementById("visit-counter");
  var valueEl = document.getElementById("visit-count");
  if (!wrapper || !valueEl) return;

  fetch("/counter.php")
    .then(function (response) {
      if (!response.ok) throw new Error("Request failed: " + response.status);
      return response.json();
    })
    .then(function (data) {
      if (typeof data.count !== "number") throw new Error("Unexpected data format");
      valueEl.textContent = formatWithCommas(data.count);
      wrapper.hidden = false;
    })
    .catch(function () {
      // No PHP hosting available (e.g. local static preview) or the counter
      // file couldn't be read/written — leave the line hidden.
    });
}

function formatWithCommas(number) {
  return String(number).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// ---------- Helper ----------
function fetchJSON(path) {
  return fetch(path).then(function (response) {
    if (!response.ok) throw new Error("Request failed: " + path);
    return response.json();
  });
}
