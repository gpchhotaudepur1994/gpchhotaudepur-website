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
  initMobileNavToggle();
  initDropdowns();
  populateCollegeInfo();
  populateImportantNotice();
  setCopyrightYear();
});

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

// ---------- Helper ----------
function fetchJSON(path) {
  return fetch(path).then(function (response) {
    if (!response.ok) throw new Error("Request failed: " + path);
    return response.json();
  });
}
