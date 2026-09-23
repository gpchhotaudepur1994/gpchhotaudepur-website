// Government Polytechnic, Chhotaudepur — shared vanilla JS
// No frameworks, no build step. Loaded from every page via a document-relative
// <script> path (e.g. "js/main.js" from root pages, "../js/main.js" from
// pages one folder deep), so this file itself must not assume page depth.
//
// fetch() calls below resolve against SITE_BASE_URL (see below) rather than a
// hardcoded root-relative "/..." path: JSON/PHP data can only be fetched when
// the site is served over HTTP (even a simple local server) — never via a
// plain double-clicked file:// page — so there's no file:// compatibility to
// preserve here, but a literal leading "/" resolves against the domain root,
// which breaks as soon as the whole site is served from a subpath (e.g. a
// GitHub Pages project site at https://user.github.io/repo/). SITE_BASE_URL
// is derived at runtime from this very script's own resolved URL instead, so
// the same file keeps working unmodified from every page depth and under any
// deployment target — domain root, GitHub Pages subpath, or a future custom
// domain. See CLAUDE.md "Path & link conventions".
var SITE_BASE_URL = (function () {
  var scripts = document.getElementsByTagName("script");
  for (var i = 0; i < scripts.length; i++) {
    var src = scripts[i].src;
    if (src && /(^|\/)js\/main\.js(\?.*)?$/.test(src)) {
      return src.replace(/js\/main\.js(\?.*)?$/, "");
    }
  }
  return "/"; // Fallback: behaves like the previous hardcoded root-relative paths.
})();

// Resolves a site-root-relative path (no leading slash, e.g.
// "data/college-info.json") against SITE_BASE_URL above.
function siteUrl(path) {
  return SITE_BASE_URL + path;
}

// ---------- Notice Board configuration ----------
// The one place the Google Apps Script Web App URL is configured — see
// CLAUDE.md "Notice Board Maintenance". Every notice display on the site
// (see fetchNotices() below) reads from this single constant; it is never
// hard-coded anywhere else.
var NOTICE_API_URL = "https://script.google.com/macros/s/AKfycbz3N206RqebNuwImThc6_JL2CLhnY_CwzZmHlFZh5uIQt7Vihtm_U_ucyUQf5UlEQ-G/exec";

// Local fallback only — NOT the primary source. Kept so the homepage/Notice
// Board still degrade gracefully (rather than showing an error) if the Apps
// Script endpoint above is unreachable or not yet configured. See CLAUDE.md.
var NOTICE_FALLBACK_URL = siteUrl("data/notices.json");

document.addEventListener("DOMContentLoaded", function () {
  initTextSizeControl();
  initLanguageSwitcher();
  initMobileNavToggle();
  initDropdowns();
  initHeaderScroll();
  populateCollegeInfo();
  populateHomepageNotices();
  populateNoticesBoard();
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

// ---------- Sitewide English / Gujarati language switcher ----------
// One toggle button (js/main.js's initLanguageSwitcher(), markup: #lang-toggle
// in the utility bar on every page) flips every [data-i18n]/[data-i18n-aria]
// element's text between the English already baked into the HTML (the site's
// only source of truth for English copy — never duplicated in JSON) and a
// Gujarati string looked up from the local translation files below. No
// external translation service, no page reload: the current page's DOM is
// rewritten in place and the choice is remembered in localStorage so it
// carries across every future page load. See CLAUDE.md-adjacent project
// conventions for the equivalent --text-scale pattern this mirrors.
var SITE_LANGUAGE_STORAGE_KEY = "gpc-site-language";

// Split by section purely for maintainability (so one editor can update, say,
// the Facilities pages' Gujarati without touching every other file) — the
// loader below fetches and merges all of them into one lookup table. Resolved
// via siteUrl() for the same reason as every other JSON fetch in this file
// (see file header comment): works from any page depth and deployment subpath.
var I18N_GU_FILES = [
  siteUrl("data/i18n/gu-common.json"),
  siteUrl("data/i18n/gu-home.json"),
  siteUrl("data/i18n/gu-about.json"),
  siteUrl("data/i18n/gu-academics.json"),
  siteUrl("data/i18n/gu-admissions.json"),
  siteUrl("data/i18n/gu-students.json"),
  siteUrl("data/i18n/gu-facilities.json"),
  siteUrl("data/i18n/gu-misc.json")
];
var guTranslationsRequest = null;
// Set once the merged dictionary resolves, so the handful of user-facing
// strings that JS builds dynamically (e.g. the notice box's empty/error
// states, which don't exist as static HTML for data-i18n to target) can look
// themselves up too, via t() below — without waiting on a second fetch.
var i18nActiveDict = null;

function initLanguageSwitcher() {
  var toggle = document.getElementById("lang-toggle");
  if (!toggle) return;

  var lang = readStoredLanguage();
  setSiteLanguage(lang, toggle);

  toggle.addEventListener("click", function () {
    var next = document.documentElement.lang === "gu" ? "en" : "gu";
    storeLanguage(next);
    setSiteLanguage(next, toggle);
  });
}

function readStoredLanguage() {
  try {
    var v = localStorage.getItem(SITE_LANGUAGE_STORAGE_KEY);
    if (v === "gu" || v === "en") return v;
  } catch (e) {
    // localStorage unavailable — fall back to the default below.
  }
  return "en";
}

function storeLanguage(lang) {
  try {
    localStorage.setItem(SITE_LANGUAGE_STORAGE_KEY, lang);
  } catch (e) {
    // Ignore — the preference simply won't persist this session.
  }
}

// The toggle always names the OTHER language (what clicking it switches to),
// per the requested "ગુજરાતી" / "English" labelling — never a generic,
// ambiguous "Language" label.
function setSiteLanguage(lang, toggle) {
  document.documentElement.lang = lang;
  if (lang === "gu") {
    toggle.textContent = "English";
    toggle.setAttribute("aria-label", "Switch to English");
    loadGuTranslations()
      .then(applyGujarati)
      .catch(function () {
        // Translation files unreachable (e.g. local file:// preview) — leave
        // the page in English rather than showing broken/partial content.
      });
  } else {
    toggle.textContent = "ગુજરાતી";
    toggle.setAttribute("aria-label", "ગુજરાતીમાં જુઓ");
    restoreEnglish();
  }
}

function loadGuTranslations() {
  if (guTranslationsRequest) return guTranslationsRequest;
  guTranslationsRequest = Promise.all(
    I18N_GU_FILES.map(function (url) {
      return fetchJSON(url).catch(function () { return {}; });
    })
  ).then(function (parts) {
    var merged = {};
    parts.forEach(function (part) {
      for (var key in part) {
        if (Object.prototype.hasOwnProperty.call(part, key)) merged[key] = part[key];
      }
    });
    i18nActiveDict = merged;
    return merged;
  });
  return guTranslationsRequest;
}

// Looks up a dynamically-built (non-data-i18n) string, e.g. a notice status
// message assembled in JS rather than sitting in the page as static HTML.
// Falls back to the English literal whenever Gujarati isn't active yet
// (before the dictionary has loaded, or when the page is in English).
function t(key, fallback) {
  if (document.documentElement.lang === "gu" && i18nActiveDict && key in i18nActiveDict) {
    return i18nActiveDict[key];
  }
  return fallback;
}

// Like t(), but for strings built around a number/name whose word order
// differs between English and Gujarati (e.g. "Showing 3 of 12" vs. "12 માંથી
// 3 દર્શાવ્યા") — the Gujarati dictionary value carries {placeholder} tokens
// instead of a fixed slot order. fallbackFinal is the already-assembled
// English string (not a template), since the English callsite already knows
// how to build it.
function tTemplate(key, vars, fallbackFinal) {
  if (document.documentElement.lang === "gu" && i18nActiveDict && key in i18nActiveDict) {
    var template = i18nActiveDict[key];
    for (var name in vars) {
      template = template.split("{" + name + "}").join(vars[name]);
    }
    return template;
  }
  return fallbackFinal;
}

// Department names in data/staff.json and data/departments.json are a fixed,
// small set of ALL-CAPS strings (not free text), so a lookup — not machine
// translation — is enough to translate every place they're rendered
// (js/faculty-staff.js's grouped headings, js/department.js's cards).
// Shared here since both scripts load main.js first (see each file's own
// header comment on why they aren't bundled into one script).
var DEPARTMENT_NAME_I18N_KEYS = {
  "AUTOMOBILE ENGINEERING": "dept.automobileEngineering",
  "CIVIL ENGINEERING": "dept.civilEngineering",
  "ELECTRICAL ENGINEERING": "dept.electricalEngineering",
  "MECHANICAL ENGINEERING": "dept.mechanicalEngineering",
  "SCIENCE AND HUMANITY": "dept.scienceAndHumanity",
  "PLASTIC ENGINEERING": "dept.plasticEngineering"
};

// data-i18n translates textContent; each data-i18n-<X> variant below
// translates one HTML attribute instead (aria-label, alt, placeholder, the
// data-label a responsive table reads via CSS attr() — see css/style.css's
// .staff-table td::before). Listed as {dataAttr, htmlAttr} pairs and applied
// through one shared loop rather than one copy-pasted block per attribute.
var I18N_ATTR_TARGETS = [
  { dataAttr: "i18nAria", htmlAttr: "aria-label" },
  { dataAttr: "i18nAlt", htmlAttr: "alt" },
  { dataAttr: "i18nPlaceholder", htmlAttr: "placeholder" },
  { dataAttr: "i18nLabel", htmlAttr: "data-label" },
  { dataAttr: "i18nTitle", htmlAttr: "title" }
];

// Caches each element's original English on first translation (in a data-
// attribute, on the element itself) rather than in a separate JS-side table,
// so restoreEnglish() below needs no second data source and stays correct
// even if elements are added/removed between calls.
function applyGujarati(dict) {
  document.querySelectorAll("[data-i18n]").forEach(function (el) {
    var key = el.getAttribute("data-i18n");
    if (!(key in dict)) return;
    if (el.dataset.i18nEn === undefined) el.dataset.i18nEn = el.textContent;
    el.textContent = dict[key];
  });
  I18N_ATTR_TARGETS.forEach(function (target) {
    var selector = "[data-" + target.dataAttr.replace(/([A-Z])/g, "-$1").toLowerCase() + "]";
    var cacheField = target.dataAttr + "En";
    document.querySelectorAll(selector).forEach(function (el) {
      var key = el.getAttribute("data-" + target.dataAttr.replace(/([A-Z])/g, "-$1").toLowerCase());
      if (!(key in dict)) return;
      if (el.dataset[cacheField] === undefined) el.dataset[cacheField] = el.getAttribute(target.htmlAttr) || "";
      el.setAttribute(target.htmlAttr, dict[key]);
    });
  });
}

function restoreEnglish() {
  document.querySelectorAll("[data-i18n]").forEach(function (el) {
    if (el.dataset.i18nEn !== undefined) el.textContent = el.dataset.i18nEn;
  });
  I18N_ATTR_TARGETS.forEach(function (target) {
    var selector = "[data-" + target.dataAttr.replace(/([A-Z])/g, "-$1").toLowerCase() + "]";
    var cacheField = target.dataAttr + "En";
    document.querySelectorAll(selector).forEach(function (el) {
      if (el.dataset[cacheField] !== undefined) el.setAttribute(target.htmlAttr, el.dataset[cacheField]);
    });
  });
}

// ---------- Mobile hamburger menu ----------
function initMobileNavToggle() {
  var toggle = document.getElementById("nav-toggle");
  var menu = document.getElementById("primary-menu");
  var header = document.querySelector(".site-header");
  if (!toggle || !menu) return;

  toggle.addEventListener("click", function () {
    var isOpen = menu.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
    if (header) header.classList.toggle("nav-open", isOpen);
    if (!isOpen) closeAllDropdowns();
  });
}

// ---------- Sticky header: translucent-when-scrolled state ----------
// Toggles one class off a lightweight, passive scroll listener — no rAF loop,
// no per-frame style reads/writes. The actual translucent/opaque/hover
// styling lives entirely in CSS (see .site-header.header-scrolled and
// friends in css/style.css); this just tracks "has the user scrolled".
function initHeaderScroll() {
  var header = document.querySelector(".site-header");
  if (!header) return;

  var SCROLL_THRESHOLD = 8;
  var isScrolled = false;

  function update() {
    var shouldBeScrolled = window.scrollY > SCROLL_THRESHOLD;
    if (shouldBeScrolled === isScrolled) return;
    isScrolled = shouldBeScrolled;
    header.classList.toggle("header-scrolled", isScrolled);
  }

  update();
  window.addEventListener("scroll", update, { passive: true });
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
  fetchJSON(siteUrl("data/college-info.json"))
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

// ---------- Notices: shared fetch (Google Sheet via Apps Script) ----------
// One data source for every notice display on the site (homepage banner,
// homepage "Latest Notices" box, and the Student Corner Notice Board):
// fetched once per page load and memoised, never polled. The Apps Script
// endpoint already filters Active=Yes and sorts newest-first, but this
// re-checks/re-sorts anyway as a defensive measure — the site must not
// assume the endpoint (or the fallback JSON) is pre-filtered or pre-sorted.
var noticesRequest = null;
function fetchNotices() {
  if (noticesRequest) return noticesRequest;

  noticesRequest = fetchJSON(NOTICE_API_URL)
    .catch(function () {
      // Apps Script endpoint unreachable — fall back to the local JSON file
      // rather than showing an error. Not the primary source; see
      // CLAUDE.md "Notice Board Maintenance".
      return fetchJSON(NOTICE_FALLBACK_URL);
    })
    .then(function (data) {
      var raw = Array.isArray(data) ? data : [];
      return raw
        .filter(isNoticeActive)
        .map(normalizeNoticeRecord)
        .filter(function (n) { return n && n.date && n.title; })
        .sort(function (a, b) {
          var da = parseNoticeDate(a.date);
          var db = parseNoticeDate(b.date);
          return (db ? db.getTime() : 0) - (da ? da.getTime() : 0);
        });
    });

  return noticesRequest;
}

// The Apps Script endpoint already excludes inactive rows, but the frontend
// still checks defensively in case a record with active=false ever comes
// through. Accepts a real boolean (what the live endpoint returns) or a
// "Yes"/"No" string (the sheet's own column values); missing entirely
// (e.g. the legacy local JSON, which has no such field) counts as active.
function isNoticeActive(raw) {
  if (!raw || typeof raw !== "object") return false;
  var value = raw.active !== undefined ? raw.active : raw.Active;
  if (value === undefined || value === null || value === "") return true;
  if (typeof value === "boolean") return value;
  var normalized = String(value).trim().toLowerCase();
  return normalized === "yes" || normalized === "true";
}

// Accepts either the Apps Script's own field names (date/notice/description/
// link) or the legacy data/notices.json shape ({date, title, file}), so both
// sources render through the same template.
function normalizeNoticeRecord(raw) {
  if (!raw || typeof raw !== "object") return null;
  return {
    date: raw.date || raw.Date || "",
    title: raw.notice || raw.Notice || raw.title || "",
    description: raw.description || raw.Description || "",
    link: raw.link || raw.Link || raw.file || ""
  };
}

// Parses both "YYYY-MM-DD" (the legacy local JSON) and "DD/MM/YYYY" (what
// the live Apps Script endpoint returns) into a real Date, returning null if
// neither works. JS's native Date parsing treats slash-separated dates as
// US-style MM/DD/YYYY, which would silently misorder/misformat Indian-style
// dates like 25/12/2026 — so DD/MM/YYYY is parsed explicitly rather than
// left to the native parser.
function parseNoticeDate(dateStr) {
  if (!dateStr) return null;
  var s = String(dateStr).trim();

  var dmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) {
    var d = new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
    return isNaN(d.getTime()) ? null : d;
  }

  var parsed = new Date(s);
  return isNaN(parsed.getTime()) ? null : parsed;
}

// "09/09/2026" or "2026-09-09" -> "09 Sep 2026". Falls back to the raw
// string if it can't be parsed, rather than showing "Invalid Date".
var NOTICE_MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function formatNoticeDate(dateStr) {
  var parsed = parseNoticeDate(dateStr);
  if (!parsed) return dateStr;
  var day = String(parsed.getDate()).padStart(2, "0");
  return day + " " + NOTICE_MONTH_NAMES[parsed.getMonth()] + " " + parsed.getFullYear();
}

// Shared <li> template for both the homepage box and the full Notice Board.
// linkLabel lets the compact homepage box use a shorter "View →" without
// affecting the full Notice Board's "View Notice →" (default).
function buildNoticeItemElement(notice, linkLabel) {
  var li = document.createElement("li");
  li.className = "notice-item";

  var dateEl = document.createElement("p");
  dateEl.className = "notice-item-date";
  dateEl.textContent = formatNoticeDate(notice.date);
  li.appendChild(dateEl);

  var titleEl = document.createElement("p");
  titleEl.className = "notice-item-title";
  titleEl.textContent = notice.title;
  li.appendChild(titleEl);

  if (notice.description) {
    var descEl = document.createElement("p");
    descEl.className = "notice-item-desc";
    descEl.textContent = notice.description;
    li.appendChild(descEl);
  }

  if (notice.link) {
    var linkEl = document.createElement("a");
    linkEl.className = "notice-item-link";
    linkEl.href = notice.link;
    linkEl.textContent = linkLabel || "View Notice →";
    if (/^https?:\/\//i.test(notice.link)) {
      linkEl.target = "_blank";
      linkEl.rel = "noopener noreferrer";
    }
    li.appendChild(linkEl);
  }

  return li;
}

// ---------- Homepage "Latest Notices" box ----------
function populateHomepageNotices() {
  var scrollEl = document.getElementById("homepage-notice-scroll");
  var trackEl = document.getElementById("homepage-notice-track");
  var statusEl = document.getElementById("homepage-notice-status");
  if (!scrollEl || !trackEl || !statusEl) return;

  fetchNotices()
    .then(function (notices) {
      if (notices.length === 0) {
        statusEl.textContent = t("home.notices.empty", "No notices published yet.");
        return;
      }

      notices.forEach(function (notice) {
        trackEl.appendChild(buildNoticeItemElement(notice, "View →"));
      });
      statusEl.hidden = true;
      trackEl.hidden = false;

      startNoticeAutoScroll(scrollEl, trackEl);
    })
    .catch(function () {
      statusEl.textContent = t("home.notices.unavailable", "Notices are currently unavailable.");
    });
}

// Drives the auto-scroll BOTTOM -> TOP using the element's real scrollTop
// (not a transform marquee), so native touch/manual/keyboard scrolling keep
// working alongside it: increasing scrollTop moves the visible content
// upward, with later (older, since the track is sorted newest-first) items
// entering from the bottom as it goes — exactly the required direction.
// Only runs once notices are loaded (no polling) and never fights the
// visitor: it stops while hovered, focused, or touched.
function startNoticeAutoScroll(scrollEl, trackEl) {
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return; // Manual/native scrolling only.
  }
  var originalItems = Array.prototype.slice.call(trackEl.children);
  if (originalItems.length < 2) return; // Nothing meaningful to loop.

  // Duplicate the list once so the loop can reset seamlessly (once scrolled
  // past the first copy's height, jump back by exactly that height), but
  // hide the duplicate from assistive tech and the tab order — a screen
  // reader or keyboard user must encounter each notice exactly once, never
  // twice, even though it's visually duplicated for the loop.
  originalItems.forEach(function (item) {
    var clone = item.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    clone.querySelectorAll("a").forEach(function (a) { a.tabIndex = -1; });
    trackEl.appendChild(clone);
  });

  var loopHeight = trackEl.scrollHeight / 2;
  if (loopHeight <= scrollEl.clientHeight) return; // Everything already fits.

  var PIXELS_PER_FRAME = 0.35; // Slow, comfortable reading speed.
  var paused = false;
  var rafId = null;

  function step() {
    if (!paused) {
      scrollEl.scrollTop += PIXELS_PER_FRAME;
      if (scrollEl.scrollTop >= loopHeight) {
        scrollEl.scrollTop -= loopHeight;
      }
    }
    rafId = window.requestAnimationFrame(step);
  }

  function pause() { paused = true; }
  function resume() { paused = false; }

  scrollEl.addEventListener("mouseenter", pause);
  scrollEl.addEventListener("mouseleave", resume);
  scrollEl.addEventListener("focusin", pause);
  scrollEl.addEventListener("focusout", resume);
  scrollEl.addEventListener("touchstart", pause, { passive: true });
  scrollEl.addEventListener("touchend", resume, { passive: true });

  rafId = window.requestAnimationFrame(step);
}

// ---------- Student Corner: full Notice Board ----------
function populateNoticesBoard() {
  var listEl = document.getElementById("notices-list");
  var statusEl = document.getElementById("notices-status");
  var emptyEl = document.getElementById("notices-empty");
  var errorEl = document.getElementById("notices-error");
  if (!listEl || !statusEl) return;

  fetchNotices()
    .then(function (notices) {
      statusEl.hidden = true;
      if (notices.length === 0) {
        if (emptyEl) emptyEl.hidden = false;
        return;
      }
      notices.forEach(function (notice) {
        listEl.appendChild(buildNoticeItemElement(notice));
      });
      listEl.hidden = false;
    })
    .catch(function () {
      statusEl.hidden = true;
      if (errorEl) errorEl.hidden = false;
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
// back the new total. Resolved via siteUrl() for the same reason as the JSON
// fetches above — one path works from every page depth and deployment
// subpath. counter.php requires PHP-enabled hosting (see CLAUDE.md); if it's
// unavailable the fetch/parse below simply fails and the element stays
// hidden, so a missing or broken counter never affects the rest of the page.
function populateVisitCounter() {
  var wrapper = document.getElementById("visit-counter");
  var valueEl = document.getElementById("visit-count");
  if (!wrapper || !valueEl) return;

  fetch(siteUrl("counter.php"))
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
