// Faculty & Staff directory — about/faculty-staff.html only.
// Loads data/staff.json and renders it grouped by department, with a name
// search and a department filter that both apply to the grouped view.
//
// This fetch path is document-relative ("../data/staff.json") rather than
// the root-relative convention used in js/main.js: that convention exists so
// one shared script works from every page depth without recalculating "how
// many ../" — it doesn't apply here, since this script is dedicated to a
// single page at a fixed depth (about/).

document.addEventListener("DOMContentLoaded", function () {
  var directory = document.getElementById("staff-directory");
  if (!directory) return;

  var statusEl = document.getElementById("staff-status");
  var countEl = document.getElementById("staff-count");
  var noResultsEl = document.getElementById("staff-no-results");
  var searchInput = document.getElementById("staff-search");
  var departmentSelect = document.getElementById("staff-department-filter");

  var allStaff = [];
  var sections = []; // { department, element, rows: [{ tr, name }], countEl }

  fetch("../data/staff.json")
    .then(function (response) {
      if (!response.ok) throw new Error("Request failed: " + response.status);
      return response.json();
    })
    .then(function (data) {
      if (!Array.isArray(data)) throw new Error("Unexpected data format");
      allStaff = data;
      populateDepartmentOptions(allStaff);
      buildDirectory(allStaff);
      statusEl.hidden = true;
      directory.hidden = false;
      applyFilters();
    })
    .catch(function () {
      statusEl.textContent = "Staff information could not be loaded right now. Please try again later.";
      directory.hidden = true;
    });

  searchInput.addEventListener("input", applyFilters);
  departmentSelect.addEventListener("change", applyFilters);

  // ---------- Build one heading + table per department, in the staff's
  // original relative order within each department (no reordering). ----------
  function buildDirectory(staff) {
    var order = [];
    var groups = {};

    staff.forEach(function (person) {
      var department = person.department || "Unspecified";
      if (!groups[department]) {
        groups[department] = [];
        order.push(department);
      }
      groups[department].push(person);
    });
    order.sort();

    directory.innerHTML = "";
    sections = [];

    order.forEach(function (department) {
      var members = groups[department];
      var headingId = "dept-" + slugify(department);

      var section = document.createElement("div");
      section.className = "staff-department";

      var heading = document.createElement("h2");
      heading.className = "staff-department-title";
      heading.id = headingId;

      var nameEl = document.createElement("span");
      nameEl.className = "staff-department-name";
      nameEl.textContent = department;

      var countEl2 = document.createElement("span");
      countEl2.className = "staff-department-count";

      heading.appendChild(nameEl);
      heading.appendChild(countEl2);
      section.appendChild(heading);

      var wrapper = document.createElement("div");
      wrapper.className = "table-responsive";

      var table = document.createElement("table");
      table.className = "data-table staff-table";
      table.setAttribute("aria-labelledby", headingId);

      var thead = document.createElement("thead");
      var headRow = document.createElement("tr");
      ["Name", "Designation", "Highest Qualification"].forEach(function (label) {
        var th = document.createElement("th");
        th.scope = "col";
        th.textContent = label;
        headRow.appendChild(th);
      });
      thead.appendChild(headRow);

      var tbody = document.createElement("tbody");
      var rows = members.map(function (person) {
        var tr = document.createElement("tr");
        tr.appendChild(makeCell(person.name, "Name"));
        tr.appendChild(makeCell(person.designation, "Designation"));
        tr.appendChild(makeCell(person.highestQualification, "Highest Qualification"));
        tbody.appendChild(tr);
        return { tr: tr, name: person.name || "" };
      });

      table.appendChild(thead);
      table.appendChild(tbody);
      wrapper.appendChild(table);
      section.appendChild(wrapper);
      directory.appendChild(section);

      sections.push({ department: department, element: section, rows: rows, countEl: countEl2, total: members.length });
    });
  }

  // ---------- Search (by name, across everything) + department filter,
  // applied together; empty departments are hidden rather than left blank. ----------
  function applyFilters() {
    var query = searchInput.value.trim().toLowerCase();
    var selectedDepartment = departmentSelect.value;
    var visibleTotal = 0;
    var anySectionVisible = false;

    sections.forEach(function (section) {
      if (selectedDepartment !== "all" && section.department !== selectedDepartment) {
        section.element.hidden = true;
        return;
      }

      var visibleCount = 0;
      section.rows.forEach(function (row) {
        var matches = !query || row.name.toLowerCase().indexOf(query) !== -1;
        row.tr.hidden = !matches;
        if (matches) visibleCount++;
      });

      section.countEl.textContent = " · " + visibleCount + (visibleCount === 1 ? " staff member" : " staff members");

      if (visibleCount === 0) {
        section.element.hidden = true;
      } else {
        section.element.hidden = false;
        anySectionVisible = true;
        visibleTotal += visibleCount;
      }
    });

    countEl.textContent = "Showing " + visibleTotal + " of " + allStaff.length + " staff members.";
    noResultsEl.hidden = anySectionVisible;
  }

  function populateDepartmentOptions(staff) {
    var departments = [];
    staff.forEach(function (person) {
      if (person.department && departments.indexOf(person.department) === -1) {
        departments.push(person.department);
      }
    });
    departments.sort();

    departments.forEach(function (department) {
      var option = document.createElement("option");
      option.value = department;
      option.textContent = department;
      departmentSelect.appendChild(option);
    });
  }

  function makeCell(text, label) {
    var cell = document.createElement("td");
    cell.textContent = text || "";
    cell.setAttribute("data-label", label);
    return cell;
  }

  function slugify(text) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }
});
