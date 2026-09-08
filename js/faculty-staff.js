// Faculty & Staff directory — about/faculty-staff.html only.
// Loads data/staff.json and renders a searchable, filterable table.
//
// This fetch path is document-relative ("../data/staff.json") rather than
// the root-relative convention used in js/main.js: that convention exists so
// one shared script works from every page depth without recalculating "how
// many ../" — it doesn't apply here, since this script is dedicated to a
// single page at a fixed depth (about/).

document.addEventListener("DOMContentLoaded", function () {
  var tableBody = document.getElementById("staff-table-body");
  if (!tableBody) return;

  var statusEl = document.getElementById("staff-status");
  var countEl = document.getElementById("staff-count");
  var tableWrapper = document.getElementById("staff-table-wrapper");
  var searchInput = document.getElementById("staff-search");
  var departmentSelect = document.getElementById("staff-department-filter");

  var allStaff = [];

  fetch("../data/staff.json")
    .then(function (response) {
      if (!response.ok) throw new Error("Request failed: " + response.status);
      return response.json();
    })
    .then(function (data) {
      if (!Array.isArray(data)) throw new Error("Unexpected data format");
      allStaff = data;
      populateDepartmentOptions(allStaff);
      renderRows(allStaff);
      statusEl.hidden = true;
      tableWrapper.hidden = false;
    })
    .catch(function () {
      statusEl.textContent = "Staff information could not be loaded right now. Please try again later.";
      tableWrapper.hidden = true;
    });

  searchInput.addEventListener("input", applyFilters);
  departmentSelect.addEventListener("change", applyFilters);

  function applyFilters() {
    var query = searchInput.value.trim().toLowerCase();
    var department = departmentSelect.value;

    var filtered = allStaff.filter(function (person) {
      var matchesName = !query || (person.name || "").toLowerCase().indexOf(query) !== -1;
      var matchesDepartment = department === "all" || person.department === department;
      return matchesName && matchesDepartment;
    });

    renderRows(filtered);
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

  function renderRows(staff) {
    tableBody.innerHTML = "";

    if (staff.length === 0) {
      var emptyRow = document.createElement("tr");
      var emptyCell = document.createElement("td");
      emptyCell.colSpan = 4;
      emptyCell.textContent = "No matching staff found.";
      emptyRow.appendChild(emptyCell);
      tableBody.appendChild(emptyRow);
    } else {
      staff.forEach(function (person) {
        var row = document.createElement("tr");
        row.appendChild(makeCell(person.name));
        row.appendChild(makeCell(person.department));
        row.appendChild(makeCell(person.designation));
        row.appendChild(makeCell(person.highestQualification));
        tableBody.appendChild(row);
      });
    }

    if (countEl) {
      countEl.textContent = "Showing " + staff.length + " of " + allStaff.length + " staff members.";
    }
  }

  function makeCell(text) {
    var cell = document.createElement("td");
    cell.textContent = text || "";
    return cell;
  }
});
