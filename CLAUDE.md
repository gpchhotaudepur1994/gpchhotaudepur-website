# CLAUDE.md — Government Polytechnic, Chhotaudepur Website

This file gives Claude Code (and any future contributor) the standing context and
rules for this project. Read it before making changes.

## Project

Official website for **Government Polytechnic, Chhotaudepur**, Gujarat, a
government technical institution. Target domain: **gpchhotaudepur.ac.in**.

This is a public-facing institutional website for a government body. Treat
accuracy, accessibility, and long-term low-maintenance operation as more
important than visual novelty or technical sophistication.

## Non-negotiable constraints

1. **No fabricated content.** Never invent facts about the college — courses,
   staff names, contact details, history, affiliation, statistics, addresses,
   phone numbers, achievements, anything. If information is missing, insert an
   explicit, visible placeholder (see "Placeholder convention" below) instead
   of guessing or using plausible-sounding filler.
2. **No LDCE assets or content.** https://www.ldce.ac.in/ may be consulted
   *only* as a reference for information architecture, navigation patterns,
   and general usability conventions common to Indian technical-institute
   websites. Never copy or adapt its logo, images, text, source code, colour
   scheme, or branding. The final design and copy must be original and
   clearly branded for Government Polytechnic, Chhotaudepur.
3. **Keep the stack simple.** HTML5, CSS3, and vanilla JavaScript only.
   - Do **not** introduce React, Vue, Next.js, or any other frontend
     framework.
   - Do **not** introduce a build step, bundler, transpiler, or package
     manager (no npm/webpack/vite) unless the user explicitly asks for one
     later. The site must run as plain static files.
   - Do **not** introduce a database, server-side language (PHP/Node/Python
     backend, etc.), authentication/login system, or CMS (WordPress, etc.)
     at this stage. **One deliberate, narrow exception:** `counter.php` at
     the project root, added for the global visit counter — see "Site-wide
     visit counter" below. It's a single small file with no framework, no
     database, and no login; everything else on the site stays static.
     Don't add further server-side code without the same explicit
     discussion.
   - Do **not** add a contact form with server-side processing without
     checking with the user first — static hosting has no backend. A
     `mailto:` link or a third-party form service are the only options to
     discuss if a form is requested later.
4. **Deployable on conventional/ERNET institutional hosting.** Assume plain
   Apache-style static hosting with no guarantee of Node/PHP/database
   availability, no build pipeline, and possibly restricted or filtered
   outbound network access. **Exception:** the site-wide visit counter
   (`counter.php`) does require a host with PHP enabled and a writable
   `data/` directory — see "Site-wide visit counter" below for exactly what
   happens if that's not available. Nothing else on the site depends on PHP.
   - Self-host every asset (CSS, JS, fonts, images). Do not depend on
     external CDNs (Google Fonts, CDN-hosted JS libraries, etc.), analytics,
     or tracking scripts.
   - Assume the site is deployed at the **domain root**
     (`https://gpchhotaudepur.ac.in/`) — see "Path & link conventions" below
     for exactly how links and assets are referenced.
   - File and folder names: lowercase, kebab-case, no spaces, no special
     characters — Linux hosting is case-sensitive and this avoids broken
     links.
   - Don't rely on `.htaccess`-specific behaviour for core functionality;
     it may be used only for optional, non-essential enhancements (e.g.
     caching headers), clearly noted as optional.

## Path & link conventions

The site has section folders one level deep (`about/`, `academics/`,
`admissions/`, `students/`, `facilities/`) and, under `academics/`, one
folder that goes a level deeper still (`academics/departments/*.html`), so
path handling must work correctly both when a page is opened directly
(`file://…`, for a quick local preview with no server) and when deployed for
real at the domain root.

- **Static asset references (CSS, JS, images) and internal page links use
  document-relative paths**, not root-relative (`/…`) paths:
  - From a root-level page (`index.html`, `gallery.html`, `contact.html`,
    `training-placement.html`): `css/style.css`, `js/main.js`,
    `images/...`, `about/about-college.html`, etc.
  - From a page one folder deep (e.g. `about/vision-mission.html`,
    `academics/departments.html`): `../css/style.css`, `../js/main.js`,
    `../images/...`, `../academics/departments.html`, etc.
  - From a page **two** folders deep (`academics/departments/*.html` —
    currently the only such pages on the site): `../../css/style.css`,
    `../../js/main.js`, `../../images/...`, `../../about/about-college.html`,
    etc. — **except** for its three siblings still inside `academics/`
    (`departments.html`, `courses.html`, `academic-calendar.html`,
    `examination.html`), which only need one `../` since they live one
    level up, not two (e.g. `../departments.html`, not
    `../../academics/departments.html`).
  - Reason: a root-relative path like `/css/style.css` resolves to the
    filesystem root when a page is opened via `file://`, breaking local
    preview. Document-relative paths work identically under `file://` and
    once deployed at the domain root.
- **`fetch()` calls inside `js/main.js` for JSON data use root-relative
  paths** (`/data/notices.json`, `/data/college-info.json`), deliberately
  different from the rule above:
  - Fetching local JSON already requires the site to be served over HTTP
    (even a minimal local server, e.g. `python -m http.server`) — it never
    works from a plain double-clicked `file://` page in the first place, in
    any browser, regardless of path style. So there's no `file://`
    compatibility to protect here.
  - Using one root-relative path in the shared `main.js` means the exact
    same script works correctly from every page depth without calculating
    "how many `../` for this page" — that calculation *would* matter for
    `<link>`/`<script>` tags (hence the rule above), but not for a `fetch()`
    call gated on domain-root deployment anyway.
- **Do not mix the two conventions** — asset/link `href`/`src` attributes are
  always document-relative; JSON `fetch()` URLs are always root-relative.
- **Exception:** page-scoped scripts dedicated to exactly one page (or one
  fixed depth), rather than shared across every depth like `main.js`, use a
  plain document-relative `fetch()` instead — there's no "every depth" case
  to protect against, so the root-relative rule's reasoning doesn't apply.
  `js/faculty-staff.js` (`about/faculty-staff.html`, one level deep) fetches
  `../data/staff.json`; `js/department.js` fetches `../data/departments.json`
  from the one-level-deep landing page (`academics/departments.html`) and
  `../../data/staff.json` from the two-level-deep department pages
  (`academics/departments/*.html`) — two different hardcoded paths in the
  same file, one per function, since each function only ever runs on the
  page depth it belongs to.

## Site-wide visit counter

There is exactly **one** counter for the whole website — not one per page.
Every page increments the same shared total on load; the footer on every
page displays that same number as "Website Visits: 1,234".

**This is the one deliberate exception to the static-only rule above** and
is the only place PHP is used anywhere on the site:

- `counter.php` (project root) — takes no input from the request at all (no
  filename, path, or query parameter is ever read), so a client can never
  influence which file it reads or writes. On each call it opens
  `data/visit-count.txt` with an exclusive `flock()`, increments the integer
  it contains, writes it back, and returns `{"count": N}` as JSON. The lock
  makes concurrent requests safe against corruption.
- `data/visit-count.txt` is runtime state, not source content — it's listed
  in `.gitignore` and is not committed. `counter.php` creates it
  automatically (starting at 0) the first time it's called, so nothing needs
  to be pre-seeded at deploy time — the `data/` directory just needs to be
  writable by the web server user.
- `js/main.js`'s `populateVisitCounter()` calls `fetch("/counter.php")` once
  per page load — root-relative, for the same reason JSON fetches are (see
  above): one path works from every page depth. On success it fills in
  `#visit-count` and reveals the `#visit-counter` line in the footer; on any
  failure (PHP not available, e.g. a local static preview, or the counter
  file couldn't be read/written) it simply leaves that line hidden. A broken
  or unavailable counter never affects anything else on the page.

**Hosting requirement:** this feature needs PHP enabled on the server and a
writable `data/` directory. If the chosen ERNET hosting doesn't support PHP,
`counter.php` simply won't execute (or will 404), the fetch above will fail,
and every page will silently render with no visit-counter line — the rest of
the site is completely unaffected either way.

## Training & Placement — Google Drive reports

`training-placement.html` intentionally does **not** list individual
placement/training reports, or any placement statistics, on the website
itself:

- **Placement Reports** links out to a single official TPO Google Drive
  folder — opened in a new tab
  (`target="_blank" rel="noopener noreferrer"`):
  `https://drive.google.com/drive/folders/1cqX9HySVaHBYLuiEIlfWvb4MHw42MCv0`.
  That folder's own internal structure (`Published data / TPO / Placement
  Reports`, `Training Reports`, `Other Reports`) is **not** reproduced on
  the site, and the site never links to individual PDFs inside it — only
  the TPO root folder is linked, once.
- **Placement statistics** (year-wise placed-student counts) are **not**
  shown on the website at all — that data is maintained only in the same
  Drive repository. Never add a statistics table, or any placement
  numbers/percentages/company names, to this page — real or placeholder.

**Why:** the TPO staff who maintain these reports have no website-editing
knowledge — no HTML/CSS/JS, no Git, no Claude Code, no server upload access.
They only know how to add/replace files in Google Drive. Linking to the
folder itself (rather than to individual files) means a newly uploaded or
updated report appears to visitors immediately, with **zero** website
changes required.

**How to apply:** never add per-report links, never embed the Drive folder
in an iframe, and never build a placement-statistics table on
`training-placement.html`. If the Drive folder URL itself ever changes,
that single link is the only edit this page should ever need.

The page's four gallery photographs (`TPO_Picture1.jpg`–`TPO_Picture4.jpg`,
in `images/training-placement/`) are unrelated to this Drive workflow —
they are ordinary site images, committed to the repo like any other image
asset, not synced from Drive. Adding/replacing them later requires a normal
file edit, same as any other page's images.

5. **Accessibility and standards.** This is a government website — aim for
   WCAG 2.1 AA and general alignment with the Guidelines for Indian
   Government Websites (GIGW): semantic HTML, proper heading structure,
   alt text on all images, sufficient colour contrast, visible focus states,
   full keyboard navigability, and usable at 200% zoom.
6. **Responsive by default.** Every page must work on mobile, tablet, and
   desktop. Mobile-first CSS, fluid layouts, no fixed-width containers that
   break on small screens.

## Placeholder convention

Any fact not yet supplied by the user must appear as a clearly visible,
greppable placeholder, using this exact style so it can be found and swapped
later:

- In HTML body content: `[PLACEHOLDER: short description of what's missing]`
- In HTML comments for structural notes: `<!-- TODO: description -->`
- In JSON data files: the string `"PLACEHOLDER - not yet provided"` as the
  value.

Never delete a placeholder without replacing it with real, user-supplied
content.

## Approved sitemap / main navigation

This is the approved information architecture (refined from the LDCE
information-architecture analysis, scaled down for a single-site government
polytechnic). Build to this structure; don't add or remove top-level sections
without going back to the user.

```
HOME
ABOUT            → About College, Vision & Mission, Principal's Message,
                   Administration, Organization Chart, Committees
ACADEMICS        → Departments, Courses, Academic Calendar, Examination
ADMISSIONS       → Admission Process, Courses & Intake, Fee Structure,
                   Important Dates
STUDENTS         → Student Corner, Notices, Downloads, Examination (shared
                   page, see below), Student Activities
FACILITIES       → Library, Laboratories & Workshops, Hostel, Sports,
                   Campus Facilities
TRAINING & PLACEMENT   (single page, no sub-items)
GALLERY
CONTACT
```

Compliance/institutional links (RTI, Mandatory Disclosure, Accessibility,
Grievance, Anti-Ragging, relevant government/education body links) are **not**
in the primary nav — they live in an "Important Links" panel on the homepage
and a matching Quick Links column in the footer, and only appear once the
user confirms the item is real and supplies the link/document.

**Existence not yet confirmed** for: Committees, Hostel, Sports, Student
Activities. Their pages exist as structural placeholders only — see
"Placeholder convention" above and do not treat their presence in the
sitemap as confirmation that the facility/committee exists.

**Training & Placement is confirmed** — official "About Training &
Placement Cell" copy, the TPO Google Drive reports link, and the four
gallery photographs have all been supplied; see "Training & Placement —
Google Drive reports" below.

## Folder structure

```
/
├── CLAUDE.md
├── counter.php                 Global site-wide visit counter endpoint — see
│                                "Site-wide visit counter" above. Only
│                                server-side file on the site.
├── index.html                 Homepage
├── gallery.html                Photo gallery
├── contact.html                Contact details, location, map
├── training-placement.html     Training & Placement — About TPO Cell (official copy),
│                                Placement Reports (links out to the TPO Google Drive
│                                folder — see "Training & Placement — Google Drive
│                                reports" below), and a photo gallery (4 photos, see
│                                images/training-placement/)
├── about/
│   ├── about-college.html
│   ├── vision-mission.html
│   ├── principals-message.html
│   ├── administration.html
│   ├── organization-chart.html
│   └── committees.html         (existence unconfirmed)
├── academics/
│   ├── departments.html         Landing page — cards link into departments/,
│   │                            built from data/departments.json by js/department.js
│   ├── departments/             One page per department — see "Department pages" below
│   │   ├── automobile-engineering.html
│   │   ├── civil-engineering.html
│   │   ├── electrical-engineering.html
│   │   ├── mechanical-engineering.html
│   │   ├── plastic-engineering.html
│   │   └── science-and-humanity.html
│   ├── courses.html
│   ├── academic-calendar.html
│   └── examination.html        Shared page — also linked from Students nav
├── admissions/
│   ├── admission-process.html
│   ├── courses-intake.html
│   ├── fee-structure.html
│   └── important-dates.html
├── students/
│   ├── student-corner.html
│   ├── notices.html             Renders data/notices.json
│   ├── downloads.html           Renders links to /downloads
│   └── student-activities.html  (existence unconfirmed)
│                                 Examination: linked to ../academics/examination.html,
│                                 not a separate file — see rule below.
├── facilities/
│   ├── library.html
│   ├── laboratories-workshops.html
│   ├── hostel.html              (existence unconfirmed)
│   ├── sports.html              (existence unconfirmed)
│   └── campus-facilities.html
├── css/
│   └── style.css                Single stylesheet (may be split later if it grows large)
├── js/
│   ├── main.js                  Shared vanilla JS (nav toggle, notices/data rendering, etc.)
│   ├── faculty-staff.js         about/faculty-staff.html only — see that page's own comment
│   ├── department.js            academics/departments.html + academics/departments/*.html —
│   │                             see "Department pages" below
│   └── training-placement.js    training-placement.html only — drives the auto-advancing
│                                 photo carousel in the Training & Placement Gallery section
├── images/
│   ├── logo/                    Official college logo/emblem
│   ├── banners/                  Homepage/section banner images
│   ├── gallery/                  Photo gallery images
│   ├── departments/               Department-specific images
│   └── training-placement/        TPO Cell gallery photographs — TPO_Picture1-4.jpg,
│                                   see "Training & Placement — Google Drive reports"
├── documents/                     Institutional PDFs (prospectus, mandatory disclosure,
│                                  annual reports, RTI, etc.) — linked from content pages
├── notices/                        Notice/circular PDF files (referenced by data/notices.json)
├── downloads/                      Downloadable forms/templates/syllabi (referenced by students/downloads.html)
└── data/
    ├── college-info.json           Central facts (address, phone, email, affiliation, etc.)
    ├── notices.json                Structured list of notices, consumed by students/notices.html
    ├── staff.json                  Faculty/staff records — consumed by about/faculty-staff.html
    │                               (all departments) and js/department.js (one department at a time)
    ├── departments.json            The 6 departments: staff.json name, display name, page slug —
    │                               see "Department pages" below
    └── visit-count.txt             Runtime counter state written by counter.php — not
                                     committed (see .gitignore), auto-created on first hit
```

**Examination is one physical page** (`academics/examination.html`) even
though it's reachable from both the Academics and Students menus — the
Students-menu entry is just a link to that same file
(`../academics/examination.html` from within `students/`), never a
duplicate page. Keep it this way so there is only ever one copy to maintain.

## Department pages

There are exactly **six** departments, each with **one** page (not a
separate page per Vision/Mission/PSO/etc.) under `academics/departments/`:
Automobile Engineering, Civil Engineering, Electrical Engineering,
Mechanical Engineering, Plastic Engineering, and Science and Humanity.
Science and Humanity is included as a full department page even though it's
a common-subject/service department rather than a diploma-granting program —
don't treat its presence as implying it grants its own diploma.

`academics/departments.html` is the landing page — it lists all six as
cards (built at runtime from `data/departments.json` by
`populateDepartmentsIndex()` in `js/department.js`, not hardcoded HTML) and
is the *only* way to reach the individual pages. **There is no per-department
entry in the primary navigation** — the Academics dropdown still has exactly
one "Departments" item, same as the approved sitemap.

**Exact section headings required on every department page** (never prefix
these with the department's own name, e.g. never "Mechanical Engineering
Vision"):

- About the Department
- Department Vision
- Department Mission
- Program Outcomes
- Program Specific Outcomes (PSOs)
- Faculty & Staff
- Courses
- Laboratories / Facilities

**Faculty & Staff is the only section backed by real data right now** —
`populateDepartmentStaff()` in `js/department.js` reads the department name
off a `data-department="..."` attribute on that section's container (the
exact string used in `staff.json`, e.g. `"MECHANICAL ENGINEERING"` — must
match `data/departments.json`'s `name` field for that department) and
renders a plain, non-interactive table (no search/filter — the roster is
already scoped to one department) using the shared `.data-table` /
`.table-responsive` / `.staff-table` styles from the Faculty & Staff
directory feature. Each page also links back to the full
`about/faculty-staff.html` directory.

Every other section (About the Department, Department Vision, Department
Mission, Program Outcomes, PSOs, Courses, Laboratories / Facilities) is a
`[PLACEHOLDER: ...]` paragraph per the placeholder convention above — no
department description, vision, mission, outcomes, courses, labs, intake
numbers, or achievements have been supplied yet for **any** department,
Science and Humanity included. When real content is supplied for a section
on a specific department's page, replace only that placeholder with the
exact supplied text — never infer or extend it to other departments.

### Why a `data/` folder for a static site

`college-info.json` centralises facts that repeat across multiple pages
(address, phone, email, affiliation) so a non-programmer maintainer changes
them **once** instead of hunting through every HTML file. `js/main.js` can
fetch this file and populate elements (e.g. the footer) via simple
`data-field="phone"` style hooks. This stays plain vanilla JS/JSON — no
templating engine, no build step.

`notices.json` is the maintenance mechanism for notices/announcements:

```json
[
  {
    "date": "YYYY-MM-DD",
    "title": "Notice title",
    "file": "/notices/example-file-name.pdf"
  }
]
```

**Routine update workflow for a non-programmer:**
1. Drop the new notice PDF into `/notices/`.
2. Add one entry to `data/notices.json` (date, title, file path).
3. Save. No HTML/CSS/JS editing required. `students/notices.html` re-renders
   the list automatically from the JSON on next page load, newest first.

The same pattern applies to `students/downloads.html` / `/downloads/` once
that page's JS is built.

Per-department subpages now exist under `academics/departments/` — see
"Department pages" above.

## Image guidelines (no build pipeline = no automatic optimisation)

Since there is no bundler/image pipeline, images must be optimised **before**
upload:
- Prefer JPEG for photos, PNG for logos/graphics with transparency.
- Keep banner images under ~300KB and gallery photos under ~200KB where
  possible; resize to realistic display dimensions rather than uploading
  camera-original resolutions.
- Always provide meaningful `alt` text — never leave it empty except for
  purely decorative images (`alt=""`).

## Open decisions / pending information

Not yet provided by the user — do not guess these:
- College address, phone, email, official contact details
- Year established, affiliating body (e.g. GTU / Directorate of Technical
  Education Gujarat), AICTE approval details
- Principal's name and message
- List of departments/branches offered and intake capacity
- Admission process details and important dates
- Whether the following actually exist at all, and if so their details:
  Hostel, any Committees (Anti-Ragging, ICC/Women's Cell, SC/ST Cell, etc.),
  Sports facilities, Student Activities/clubs/NCC/NSS
- Facilities that do exist (library, labs/workshops, campus facilities)
- Official logo/emblem artwork
- Any existing brand colours, if the institute already has a visual identity
- Whether the site needs Gujarati/Hindi language support alongside English
- Real hosting details (confirm deployment path is domain root, confirm
  whether ERNET hosting imposes any specific constraints e.g. max file size,
  allowed file types, SSL setup)
- Whether a contact form is desired, and if so what backend/service to use
- Which Important Links / compliance items apply (RTI, Mandatory
  Disclosure, Accessibility Statement, Grievance, Anti-Ragging, relevant
  government/education body links) and their actual URLs/documents
- Whether any official social media accounts exist

## Homepage specification (approved order)

Build only sections that have real content behind them — an empty or
placeholder-only section must not render on the homepage at all (no "coming
soon" boxes, no zeroed-out stat counters).

1. Utility bar
2. Main header & navigation
3. Hero/banner
4. Important Notice / announcement (most recent entry from `data/notices.json`)
5. About the College (short summary + link to `about/about-college.html`)
6. Courses / Departments (summary + links into `academics/`)
7. Principal's Message (short excerpt + link to full page)
8. Important Links (practical shortcuts — Admissions, Notices, Downloads,
   RTI, Grievance, etc. — only confirmed items)
9. College Highlights / Statistics — **omit entirely** until real numbers
   are supplied
10. Facilities (only facilities confirmed to exist)
11. Latest News / Events — **omit entirely** if there is no real content
12. Gallery preview (links to `gallery.html`)
13. Contact / map
14. Footer (Quick Links, compliance links, social links if applicable,
    copyright)

## Working conventions

- Prefer editing over creating new files; keep the folder structure above
  stable once content work begins.
- Every new page should reuse the same header/nav/footer structure and the
  shared `css/style.css` — no per-page inline styles or one-off scripts
  unless there's a strong, stated reason.
- Do not add comments explaining *what* code does; only note *why* when a
  decision is non-obvious (e.g. why an asset path is document-relative but a
  `fetch()` path is root-relative).
- No emojis in content or code unless explicitly requested.
- No external libraries, frameworks, CDNs, analytics, or tracking scripts,
  and no backend services — this remains a plain static HTML/CSS/JS site.
