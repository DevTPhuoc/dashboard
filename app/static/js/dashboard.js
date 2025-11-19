setupFilter(
  "departmentFilter",
  "departmentChecklistContent",
  "/api/get_department"
);
setupFilter("teamFilter", "teamChecklistContent", "/api/get_team");
setupFilter("statusFilter", "statusChecklistContent", "/api/get_dic_status");

// Hàm Setup filter department
function setupFilter(idInput, idCheckList, urlApi) {
  fetch(urlApi)
    .then((res) => res.json())
    .then((data) => {
      const checkList = document.getElementById(idCheckList);
      checkList.innerHTML = "";
      data.forEach((item) => {
        checkList.innerHTML += `
          <label class="hover:bg-gray-600">
            <input type="checkbox" class="checkItem   " value="${item.id}" />
            ${item.name}
          </label>
        `;
      });

      // Gắn sự kiện cho tất cả checkbox sau khi render
      const input = document.getElementById(idInput);
      const checkboxes = checkList.querySelectorAll("input[type='checkbox']");
      if (userRoleId === "4") {
        // Nếu là departmentFilter thì disable, còn teamFilter thì không
        if (idInput === "departmentFilter") {
          input.disabled = true;
          checkboxes.forEach((cb) => {
            cb.disabled = true;
            // Check đúng lab của user
            if (cb.value == userLabId) {
              cb.checked = true;
              input.value = cb.parentElement.textContent.trim();
            }
          });
        } else {
          // Với teamFilter thì không disable
          input.disabled = false;
          checkboxes.forEach((cb) => {
            cb.disabled = false;
          });
        }
      }

      checkboxes.forEach((cb) => {
        cb.addEventListener("change", function () {
          const selected = Array.from(checkboxes)
            .filter((c) => c.checked)
            .map((c) => c.parentElement.textContent.trim());
          input.value = selected.join(", ");
          setTimeout(() => {
            input.focus();
          }, 100);
        });
      });
    });
}
// Hàm Setup filter department
function setupFilter(idInput, idCheckList, urlApi) {
  fetch(urlApi)
    .then((res) => res.json())
    .then((data) => {
      const checkList = document.getElementById(idCheckList);
      checkList.innerHTML = "";
      data.forEach((item) => {
        checkList.innerHTML += `
          <label class="hover:bg-gray-600">
            <input type="checkbox" class="checkItem   " value="${item.id}" />
            ${item.name}
          </label>
        `;
      });

      // Gắn sự kiện cho tất cả checkbox sau khi render
      const input = document.getElementById(idInput);
      const checkboxes = checkList.querySelectorAll("input[type='checkbox']");
      if (userRoleId === "4") {
        // Nếu là departmentFilter thì disable, còn teamFilter thì không
        if (idInput === "departmentFilter") {
          input.disabled = true;
          checkboxes.forEach((cb) => {
            cb.disabled = true;
            // Check đúng lab của user
            if (cb.value == userLabId) {
              cb.checked = true;
              input.value = cb.parentElement.textContent.trim();
            }
          });
        } else {
          // Với teamFilter thì không disable
          input.disabled = false;
          checkboxes.forEach((cb) => {
            cb.disabled = false;
          });
        }
      }

      checkboxes.forEach((cb) => {
        cb.addEventListener("change", function () {
          const selected = Array.from(checkboxes)
            .filter((c) => c.checked)
            .map((c) => c.parentElement.textContent.trim());
          input.value = selected.join(", ");
          setTimeout(() => {
            input.focus();
          }, 100);
        });
      });
    });
}
// Hàm Setup filter department
function setupFilter(idInput, idCheckList, urlApi) {
  fetch(urlApi)
    .then((res) => res.json())
    .then((data) => {
      const checkList = document.getElementById(idCheckList);
      checkList.innerHTML = "";
      data.forEach((item) => {
        checkList.innerHTML += `
          <label class="hover:bg-gray-600">
            <input type="checkbox" class="checkItem   " value="${item.id}" />
            ${item.name}
          </label>
        `;
      });

      // Gắn sự kiện cho tất cả checkbox sau khi render
      const input = document.getElementById(idInput);
      const checkboxes = checkList.querySelectorAll("input[type='checkbox']");
      if (userRoleId === "4") {
        // Nếu là departmentFilter thì disable, còn teamFilter thì không
        if (idInput === "departmentFilter") {
          input.disabled = true;
          checkboxes.forEach((cb) => {
            cb.disabled = true;
            // Check đúng lab của user
            if (cb.value == userLabId) {
              cb.checked = true;
              input.value = cb.parentElement.textContent.trim();
            }
          });
        } else {
          // Với teamFilter thì không disable
          input.disabled = false;
          checkboxes.forEach((cb) => {
            cb.disabled = false;
          });
        }
      }

      checkboxes.forEach((cb) => {
        cb.addEventListener("change", function () {
          const selected = Array.from(checkboxes)
            .filter((c) => c.checked)
            .map((c) => c.parentElement.textContent.trim());
          input.value = selected.join(", ");
          setTimeout(() => {
            input.focus();
          }, 100);
        });
      });
    });
}

// Hàm mở checklist FIlter
function toggleFilterChecklist(id) {
  const checklist = document.getElementById(id);
  if (checklist.classList.contains("hidden")) {
    checklist.classList.remove("hidden");
  }
}

// bảm bỏ checklist filter khi click ngoài khi onblur input
function closeChecklistOnBlur(id) {
  setTimeout(function () {
    const checklist = document.getElementById(id);
    // Kiểm tra phần tử đang được focus
    if (!checklist.contains(document.activeElement)) {
      checklist.classList.add("hidden");
    }
  }, 100);
}

// hàm lấy giá trị filter
function getFilterValues() {
  const idReFilter = document.getElementById("idReFilter").value;
  const deviceFilter = document.getElementById("deviceFilter").value;
  const requestedByFilter = document.getElementById("requestedByFilter").value;
  const fromDateFilter = document.getElementById("fromDateFilter").value;
  const toDateFilter = document.getElementById("toDateFilter").value;

  // Department
  const departmentChecklistContent = document.getElementById(
    "departmentChecklistContent"
  );
  const departmentCheckboxes = departmentChecklistContent.querySelectorAll(
    "input[type='checkbox']"
  );
  let departmentCheckedValues = Array.from(departmentCheckboxes)
    .filter((cb) => cb.checked)
    .map((cb) => cb.value);

  // Team
  const teamChecklistContent = document.getElementById("teamChecklistContent");
  const teamCheckboxes = teamChecklistContent.querySelectorAll(
    "input[type='checkbox']"
  );
  let teamCheckedValues = Array.from(teamCheckboxes)
    .filter((cb) => cb.checked)
    .map((cb) => cb.value);

  // Status
  const statusChecklistContent = document.getElementById(
    "statusChecklistContent"
  );
  const statusCheckboxes = statusChecklistContent.querySelectorAll(
    "input[type='checkbox']"
  );
  const statusCheckedValues = Array.from(statusCheckboxes)
    .filter((cb) => cb.checked)
    .map((cb) => cb.parentElement.textContent.trim());

  // Điều chỉnh theo role
  if (userRoleId === "4") {
    // department bị disable => luôn fix theo userLabId
    departmentCheckedValues = [userLabId];
    // team vẫn lấy từ checkbox bình thường
  } else if (userRoleId === "2") {
    // role 2 => fix cả lab và team theo user
    departmentCheckedValues = [userLabId];
    teamCheckedValues = [userTeamId];
  }

  return {
    id: [idReFilter],
    DeviceName: [deviceFilter],
    RequestedBy: [requestedByFilter],
    LabId: departmentCheckedValues,
    TeamId: teamCheckedValues,
    status: statusCheckedValues,
    FromDate: [fromDateFilter],
    ToDate: [toDateFilter],
  };
}
// hàm reset filter ui
function resetFilterUI() {
  // reset các input text
  document.getElementById("idReFilter").value = "";
  document.getElementById("deviceFilter").value = "";
  document.getElementById("requestedByFilter").value = "";
  document.getElementById("fromDateFilter").value = "";
  document.getElementById("toDateFilter").value = "";

  // Department
  const deptInput = document.getElementById("departmentFilter");
  const departmentChecklistContent = document.getElementById(
    "departmentChecklistContent"
  );
  const departmentCheckboxes = departmentChecklistContent.querySelectorAll(
    "input[type='checkbox']"
  );
  departmentCheckboxes.forEach((cb) => (cb.checked = false));
  deptInput.value = "";

  // Team
  const teamInput = document.getElementById("teamFilter");
  const teamChecklistContent = document.getElementById("teamChecklistContent");
  const teamCheckboxes = teamChecklistContent.querySelectorAll(
    "input[type='checkbox']"
  );
  teamCheckboxes.forEach((cb) => (cb.checked = false));
  teamInput.value = "";

  // Status
  document.getElementById("statusFilter").value = "";
  const statusChecklistContent = document.getElementById(
    "statusChecklistContent"
  );
  const statusCheckboxes = statusChecklistContent.querySelectorAll(
    "input[type='checkbox']"
  );
  statusCheckboxes.forEach((cb) => (cb.checked = false));

  // --- Điều chỉnh theo role ---
  if (userRoleId === "4") {
    // department bị disable => luôn fix theo userLabId
    deptInput.disabled = true;
    departmentCheckboxes.forEach((cb) => {
      cb.disabled = true;
      if (cb.value == userLabId) {
        cb.checked = true;
        deptInput.value = cb.parentElement.textContent.trim();
      }
    });
    // team vẫn enable, không ép cứng
    teamInput.disabled = false;
    teamCheckboxes.forEach((cb) => (cb.disabled = false));
  } else if (userRoleId === "2") {
    // role 2 => fix cả lab và team theo user
    deptInput.disabled = true;
    teamInput.disabled = true;
    departmentCheckboxes.forEach((cb) => {
      cb.disabled = true;
      if (cb.value == userLabId) {
        cb.checked = true;
        deptInput.value = cb.parentElement.textContent.trim();
      }
    });
    teamCheckboxes.forEach((cb) => {
      cb.disabled = true;
      if (cb.value == userTeamId) {
        cb.checked = true;
        teamInput.value = cb.parentElement.textContent.trim();
      }
    });
  } else {
    // các role khác => enable bình thường
    deptInput.disabled = false;
    teamInput.disabled = false;
    departmentCheckboxes.forEach((cb) => (cb.disabled = false));
    teamCheckboxes.forEach((cb) => (cb.disabled = false));
  }
}

document.getElementById("clearFilter").addEventListener("click", function () {
  resetFilterUI();
});
