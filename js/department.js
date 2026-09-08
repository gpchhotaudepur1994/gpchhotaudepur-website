// Shared JS for the Departments landing page and every individual
// department page under academics/departments/.
//
// Two independent, self-guarding pieces of behaviour live in this one file
// rather than a separate script per page, since both are small and belong to
// the same "departments" feature:
//   - populateDepartmentsIndex() builds the department list on
//     academics/departments.html from data/departments.json.
//   - populateDepartmentStaff() filters data/staff.json down to the one
//     department named on the current page and renders its table.
// Each function checks for the element it needs first and returns
// immediately if it's absent, so loading this one file on both page types
// (and on any page depth) is safe — only the relevant function ever runs.
//
// Fetch paths are document-relative and differ between the two functions
// because the two page types sit at different depths: the landing page
// (academics/departments.html) is one level below the project root, an
// individual department page (academics/departments/<slug>.html) is two.

document.addEventListener("DOMContentLoaded", function () {
  populateDepartmentsIndex();
  populateDepartmentStaff();
});

// ---------- academics/departments.html: list of department cards ----------
function populateDepartmentsIndex() {
  var grid = document.getElementById("departments-grid");
  if (!grid) return;

  var statusEl = document.getElementById("departments-status");

  fetch("../data/departments.json")
    .then(function (response) {
      if (!response.ok) throw new Error("Request failed: " + response.status);
      return response.json();
    })
    .then(function (departments) {
      if (!Array.isArray(departments)) throw new Error("Unexpected data format");

      departments.forEach(function (department) {
        var link = document.createElement("a");
        link.className = "card";
        link.href = "departments/" + department.slug + ".html";

        var heading = document.createElement("h3");
        heading.textContent = department.displayName;
        link.appendChild(heading);

        grid.appendChild(link);
      });
    })
    .catch(function () {
      if (statusEl) statusEl.hidden = false;
    });
}

// ---------- academics/departments/<slug>.html: that department's roster ----------
function populateDepartmentStaff() {
  var container = document.getElementById("department-staff");
  if (!container) return;

  var department = container.getAttribute("data-department");
  var statusEl = document.getElementById("department-staff-status");
  var tableWrapper = document.getElementById("department-staff-table-wrapper");
  var tableBody = document.getElementById("department-staff-table-body");

  fetch("../../data/staff.json")
    .then(function (response) {
      if (!response.ok) throw new Error("Request failed: " + response.status);
      return response.json();
    })
    .then(function (data) {
      if (!Array.isArray(data)) throw new Error("Unexpected data format");

      var members = data.filter(function (person) {
        return person.department === department;
      });

      if (members.length === 0) {
        statusEl.textContent = "No staff records are currently listed for this department.";
        return;
      }

      members.forEach(function (person) {
        var row = document.createElement("tr");
        row.appendChild(makeCell(person.name, "Name"));
        row.appendChild(makeCell(person.designation, "Designation"));
        row.appendChild(makeCell(person.highestQualification, "Highest Qualification"));
        tableBody.appendChild(row);
      });

      statusEl.hidden = true;
      tableWrapper.hidden = false;
    })
    .catch(function () {
      statusEl.textContent = "Staff information could not be loaded right now. Please try again later.";
    });

  function makeCell(text, label) {
    var cell = document.createElement("td");
    cell.textContent = text || "";
    cell.setAttribute("data-label", label);
    return cell;
  }
}
