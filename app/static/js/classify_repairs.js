//xử lý các nút pendingevaluation, Wait EM Re-Evaluation, waipr
const waitEvaluation = "Wait Evaluation";
const waitEmRevaluation = "Wait EM Re-Evaluation";
const waitEMConfirmFix = "Wait EM Confirm Fixed";
const waitLabConfirm = "Wait Lab Confirm";
const waitEmManagerApprovalExternal = "Wait EM Manager's Approval External";
const waitLmManagerApprovalExternal = "Wait LM Manager's Approval External";
const waitLmManegerDisposal="Wait LM Manager's Disposal"
const waitPr = "Wait PR";

let currentPage = 1;
let currentData = [];
const rowsPerPage = 12;

// Table body render dữ liệu
const tableBody = document.getElementById("requestsTableBody");

// Giá trị của tab
let typeTab = "action";

// settup filter
setupFilter(
  "departmentFilter",
  "departmentChecklistContent",
  "/api/get_department"
);
setupFilter("teamFilter", "teamChecklistContent", "/api/get_team");
setupFilter("statusFilter", "statusChecklistContent", "/api/get_dic_status");

// Kích hoạt tab
document.querySelectorAll(".tabBtn").forEach((btn) => {
  // Reset toàn bộ class active
  btn.addEventListener("click", function () {
    document.querySelectorAll(".tabBtn").forEach((b) => {
      b.classList.remove("text-blue-400", "border-b-2", "border-blue-400");
      b.classList.add("text-gray-400");
    });
    // Set active cho tab hiện tại
    this.classList.add("text-blue-400", "border-b-2", "border-blue-400");
    this.classList.remove("text-gray-400");
    typeTab = this.dataset.target;
    currentPage = 1; // luôn reset lại trang đầu tiên khi đổi tab phòng trường hợp nếu đang ở trang >1
    // Load lại dữ liệu
    loadRequests(typeTab);
  });
});

// Hàm Setup filter department
function setupFilter(idInput, idCheckList, urlApi) {
  fetch(urlApi)
    .then((res) => res.json())
    .then((data) => {
      const checkList = document.getElementById(idCheckList);
      checkList.innerHTML = "";
      data.forEach((item) => {
        checkList.innerHTML += `
          <label>
            <input type="checkbox" class="checkItem hover:bg-gray-700" value="${item.id}" />
            ${item.name}
          </label>
        `;
      });

      // Gắn sự kiện cho tất cả checkbox sau khi render
      const input = document.getElementById(idInput);
      const checkboxes = checkList.querySelectorAll("input[type='checkbox']");
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
// Hàm tải dữ liệu excel từ curentData
function downloadExcel(fileName) {
  const worksheet = XLSX.utils.json_to_sheet(currentData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Requests");
  XLSX.writeFile(workbook, fileName || "requests.xlsx");
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

  const departmentChecklistContent = document.getElementById(
    "departmentChecklistContent"
  );
  const departmentCheckboxes = departmentChecklistContent.querySelectorAll(
    "input[type='checkbox']"
  );
  const departmentCheckedValues = Array.from(departmentCheckboxes)
    .filter((cb) => cb.checked)
    .map((cb) => cb.value);

  const teamChecklistContent = document.getElementById("teamChecklistContent");
  const teamCheckboxes = teamChecklistContent.querySelectorAll(
    "input[type='checkbox']"
  );
  const teamCheckedValues = Array.from(teamCheckboxes)
    .filter((cb) => cb.checked)
    .map((cb) => cb.value);

  const statusChecklistContent = document.getElementById(
    "statusChecklistContent"
  );
  const statusCheckboxes = statusChecklistContent.querySelectorAll(
    "input[type='checkbox']"
  );
  const statusCheckedValues = Array.from(statusCheckboxes)
    .filter((cb) => cb.checked)
    .map((cb) => cb.parentElement.textContent.trim());

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
  document.getElementById("idReFilter").value = "";
  document.getElementById("deviceFilter").value = "";
  document.getElementById("requestedByFilter").value = "";
  document.getElementById("fromDateFilter").value = "";
  document.getElementById("toDateFilter").value = "";

  document.getElementById("departmentFilter").value = "";
  const departmentChecklistContent = document.getElementById(
    "departmentChecklistContent"
  );
  const departmentCheckboxes = departmentChecklistContent.querySelectorAll(
    "input[type='checkbox']"
  );
  departmentCheckboxes.forEach((cb) => (cb.checked = false));

  document.getElementById("teamFilter").value = "";
  const teamChecklistContent = document.getElementById("teamChecklistContent");
  const teamCheckboxes = teamChecklistContent.querySelectorAll(
    "input[type='checkbox']"
  );
  teamCheckboxes.forEach((cb) => (cb.checked = false));

  document.getElementById("statusFilter").value = "";
  const statusChecklistContent = document.getElementById(
    "statusChecklistContent"
  );
  const statusCheckboxes = statusChecklistContent.querySelectorAll(
    "input[type='checkbox']"
  );
  statusCheckboxes.forEach((cb) => (cb.checked = false));
}

// Hàm Render phân trang
function renderPagination(total) {
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";
  const totalPages = Math.ceil(total / rowsPerPage);
  if (currentPage > totalPages) currentPage = 1;

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.className = `px-3 py-1 rounded mx-1 ${
      i === currentPage ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"
    }`;
    btn.addEventListener("click", () => {
      currentPage = i;
      renderTable(currentData, (type = typeTab));
    });
    pagination.appendChild(btn);
  }

  // add nút export to excel
  const exportBtn = document.createElement("button");
  exportBtn.innerHTML = `<i class="fas fa-file-excel"></i> Download`;
  exportBtn.className =
    "px-3 py-1 rounded mx-1 bg-green-600 hover:bg-green-500";
  exportBtn.addEventListener("click", () => {
    downloadExcel("LM Data Detail " + typeTab + ".xlsx");
  });
  pagination.appendChild(exportBtn);
}

// Hàm tải dữ liệu excel từ curentData
function downloadExcel(fileName) {
  const worksheet = XLSX.utils.json_to_sheet(currentData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Requests");
  XLSX.writeFile(workbook, fileName || "requests.xlsx");
}

function loadRequests(type = "all") {
  tableBody.innerHTML = "";
  let filters = getFilterValues();
  if (type === "action") {
    const statusDefautAction = [
      waitEvaluation,
      waitEmRevaluation,
      waitEMConfirmFix,
      waitPr,
    ];
    if (filters.status.length === 0) {
      filters.status = statusDefautAction;
    } else {
      filters.status = filters.status.filter((s) =>
        statusDefautAction.includes(s)
      );
    }
  }
  fetch("/repair_request/api/get_data", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(filters),
  })
    .then((res) => res.json())
    .then((data) => {
      let filtered = data;
      currentData = filtered;
      renderTable(filtered, type);
    })
    .catch((error) => {
      tableBody.innerHTML =
        "<tr><td colspan='8'>Không thể load dữ liệu. Lỗi: " +
        error +
        "</td></tr>";
    });
}

// Hàm Render dữ liệu lên bảng từ id table, data-api-list
function renderTable(data, type) {
  tableBody.innerHTML = "";
  // Nếu dữ liệu rỗng
  if (data.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-gray-400">Không có dữ liệu</td></tr>`;
    return;
  }

  // Xác định dữ liệu trang hiện tại
  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const pageData = data.slice(start, end);

  pageData.forEach((req) => {
    const tr = document.createElement("tr");
    tr.className = "hover:bg-gray-800";
    tr.innerHTML = `
        <td class="text-center px-4 py-2 border border-gray-700">${req.id}</td>
        <td class="text-center px-4 py-2 border border-gray-700">${
          req.DeviceCode
        }</td>
        <td class="text-center px-4 py-2 border border-gray-700">${
          req.DeviceName
        }</td>
        <td class="text-center px-4 py-2 border border-gray-700">${
          req.RequestedBy
        }</td>
        <td class="text-center px-4 py-2 border border-gray-700">${
          req.LabName || "-"
        }</td>
        <td class="text-center px-4 py-2 border border-gray-700">${
          req.TeamName || "-"
        }</td>
        <td class="text-center px-4 py-2 border border-gray-700">${
          req.RequestDate || "-"
        }</td>
        <td class="text-center px-4 py-2 border border-gray-700">${
          req.TAT || "-"
        }</td>
        <td class="text-center px-4 py-2 border border-gray-700">
  <span class="${
    req.Priority === "Priority"
      ? "inline-block bg-green-500 px-2 py-1 text-white rounded text-sm"
      : ""
  }">
    ${req.Priority || "-"}
  </span>
</td>
         <td class="text-center px-4 py-2 border border-gray-700">${renderStatus(
           req.Status
         )}</td>
        <td class="text-left px-4 py-2 border border-gray-700">${renderActions(
          req,
          type
        )}</td>

      `;
    tableBody.appendChild(tr);
  });

  // Render phân trang
  renderPagination(data.length);
}

// Hàm Xác định màu trạng thái
function renderStatus(Status) {
  switch (Status) {
    case waitEvaluation:
      return `<span class="px-2 py-1 rounded bg-blue-600  text-xs w-full inline-block">${Status}</span>`;
    case waitEmRevaluation:
      return `<span class="px-2 py-1 rounded bg-yellow-600 text-xs w-full inline-block">${Status}</span>`;
    case waitEMConfirmFix:
      return `<span class="px-2 py-1 rounded bg-green-600 text-xs w-full inline-block">${Status}</span>`;
    case waitPr:
      return `<span class="px-2 py-1 rounded bg-orange-600 text-xs w-full inline-block">${Status}</span>`;
    default:
      return `<span class="px-2 py-1 rounded bg-gray-600 text-xs w-full inline-block">${Status}</span>`;
  }
}
function renderPagination(total) {
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";
  const totalPages = Math.ceil(total / rowsPerPage);

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.className = `px-3 py-1 rounded mx-1 ${
      i === currentPage ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"
    }`;
    btn.addEventListener("click", () => {
      currentPage = i;
      renderTable(currentData, (type = typeTab));
    });
    pagination.appendChild(btn);
  }
}

// Hàm Render nút hành động
function formatDate(dateString) {
  if (!dateString) return "-";
  const d = new Date(dateString);
  return (
    d.toLocaleDateString("vi-VN") +
    " " +
    d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
  );
}
// Hàm mở modal thống nhất
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  modal.classList.remove("hidden");
  modal.classList.add("block", "fade-in");
}

// Hàm đóng modal thống nhất
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  modal.classList.remove("block", "fade-in");
  modal.classList.add("fade-out");

  setTimeout(() => {
    modal.classList.add("hidden");
    modal.classList.remove("fade-out");
  }, 200);
}
// Xử lý click outside
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal-overlay")) {
    const modalId = e.target.closest(".modal").id;
    closeModal(modalId);
  }
});
// Sự kiện nút Áp dụng filter
document.getElementById("applyFilter").addEventListener("click", () => {
  currentPage = 1; // Reset về trang 1 khi áp dụng filter
  loadRequests((type = typeTab));
});
//---------------Nhóm hàm xử lý modal----------------
//ham mở openReviewModal
function openReviewModal(id, event) {
  // 1. Lấy dữ liệu theo id từ currentData hoặc gọi API riêng (ví dụ dùng currentData cache ở client)
  const req = currentData.find((item) => item.id === id);
  if (!req) return; // Không có dữ liệu thì bỏ qua

  // 2. Render thông tin chi tiết vào modalBody
  const modal = document.getElementById("viewModal");
  const modalBody = document.getElementById("viewModalBody");

  modalBody.innerHTML = `
    <details open class="bg-gray-800 rounded p-2 shadow border border-gray-700">
      <summary class="font-semibold text-blue-300 cursor-pointer mb-2">
        <i class="fas fa-info-circle"></i> Request Info
      </summary>
      <div class="grid grid-cols-2 gap-4">
        <table class="w-full text-sm">
          <thead>
            <tr>
              <th colspan="2" class="text-center text-lg font-bold text-white border border-gray-700 pb-1 bg-blue-950">
                Request Details
              </th>
            </tr>
          </thead>
          <tbody>
            <tr><td class="border border-gray-700 hover:bg-gray-500">ID Req</td><td class="border border-gray-700 hover:bg-gray-500">${
              req.id
            }</td></tr>
            <tr><td class="border border-gray-700 hover:bg-gray-500">Device</td><td class="border border-gray-700 hover:bg-gray-500">${
              req.DeviceName
            }</td></tr>
            <tr><td class="border border-gray-700 hover:bg-gray-500">Requested By</td><td class="border border-gray-700 hover:bg-gray-500">${
              req.RequestedBy
            }</td></tr>
            <tr><td class="border border-gray-700 hover:bg-gray-500">Department</td><td class="border border-gray-700 hover:bg-gray-500 ">${
              req.LabName || "-"
            }</td></tr>
            <tr><td class="border border-gray-700 hover:bg-gray-500">Team</td><td class="border border-gray-700 hover:bg-gray-500 ">${
              req.TeamName || "-"
            }</td></tr>
            <tr><td class="border border-gray-700 hover:bg-gray-500">Requests Date</td><td class="border border-gray-700 hover:bg-gray-500">${
              formatDate(req.RequestDate) || "-"
            }</td></tr>
            <tr><td class="border border-gray-700 hover:bg-gray-500">Status</td><td class="text-red-400 font-bold border border-gray-700 hover:bg-gray-500">${
              req.Status
            }</td></tr>
          </tbody>
        </table>
        <table>
          <thead>
            <tr>
              <td class="text-center text-lg font-bold text-white border border-gray-700 pb-1 bg-blue-950">
                Device Error Detail
              </td>
            </tr>
          </thead>
          <tbody>
           ${renderTimelineTableForTechnicianEvaluations(req.Timeline)}
          </tbody>
        </table>
      </div>
    </details>
     <details open class="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <summary class="font-semibold text-blue-300 cursor-pointer text-lg">
              <i class="fas fa-history mr-2"></i> Timeline
            </summary>
            <div style="width: 100%; height: 600px; border: 1px solid #374151; border-radius: 8px; overflow: hidden;">
    <iframe 
        id="timelineIframe" 
        src="/static/timeline.html?request_id=${req.id}"
        style="width: 100%; height: 100%; border: none;"
        onload="resizeTimelineIframe()"
    ></iframe>
</div>
          </details>
    <div id="viewModalDetailApprove"></div>
    <div id="viewModalDetailCancel"></div>
  `;

  // 3. Hiển thị modal (thường thêm class "block", bỏ "hidden", hoặc display style)
  openModal("viewModal");
}

function closeDetailModal() {
  const modal = document.getElementById("requestDetailModal");
  const modalContent = document.getElementById("detailModalContent");

  setTimeout(() => {
    modal.classList.add("hidden");
  }, 200);
}
//hàm này lấy tất cả đánh giá của bộ phận kỹ thuật
//chỉ áp dụng cho em staff để xem full các đánh giá trường hợp đánh giá lại nhiều lần
//nếu không có đánh giá thì trả về chuỗi rỗng
function renderTimelineTableForTechnicianEvaluations(timeline) {
  timeline = (() => {
    try {
      return JSON.parse(timeline || "[]");
    } catch {
      return [];
    }
  })();
  if (!timeline || timeline.length === 0) {
    return `<tr><td colspan="1" class="text-center text-white">Không có dữ liệu Timeline</td></tr>`;
  }

  // Lọc chỉ những phần tử có event là 'TechnicianEvaluation' và sắp xếp mới nhất lên đầu
  const filtered = [
    timeline
      .filter((item) => item.event === "TechnicianEvaluation")
      .sort((a, b) => new Date(b.time) - new Date(a.time))[0],
  ];

  if (filtered.length === 0) {
    return `<tr><td colspan="1" class="text-center text-white">Không có dữ liệu Technician Evaluation</td></tr>`;
  }

  return filtered
    .map(
      (item) => `
    <tr class="border border-gray-700 hover:bg-gray-500">
      <td>Decision of Technician: ${item.decision || "-"}</td>
    </tr>
    <tr class="border border-gray-700 hover:bg-gray-500">
      <td>Evaluation of Technician: ${item.notes || "-"}</td>
    </tr>
    <tr class="border border-gray-700 hover:bg-gray-500">
      <td>Technician: ${item.technician_name || "-"}</td>
    </tr>
    <tr class="border border-gray-700 hover:bg-gray-500">
      <td>Time: ${formatDate(item.time)}</td>
    </tr>
    
  `
    )
    .join("");
}
function renderActions(req, type = "all") {
  let btnActions = `<button
    class="bg-cyan-500 hover:bg-cyan-500 text-white p-1 rounded view-detail"
    onclick="openReviewModal(${req.id})" data-request-id="${req.id}"
    title="View Details"
  >
    <i class="fas fa-eye"></i>
  </button>`;

  if (type === "all") return btnActions;

  if (req.Status === waitEvaluation) {
    btnActions += `<button onclick="openEvaluateModal(${req.id})" data-request-id="${req.id}" class="action-btn bg-blue-600 hover:bg-blue-500 px-2 py-1 rounded ml-2" title="Evaluate">
                 <i class="fa-solid fa-money-bill-wheat"></i>
              </button>`;
  }

  if (req.Status === waitEmRevaluation) {
    btnActions += `<button onclick="openEvaluateModal(${req.id}, true)" data-request-id=${req.id} class="evaluate-btn action-btn bg-yellow-600 hover:bg-yellow-500 px-2 py-1 rounded ml-2" title="Re-evaluate">
              <i class="fa-regular fa-pen-to-square"></i>
              </button>`;
  }

  if (req.Status === waitPr) {
    btnActions += `<button data-id="${req.id}" onclick="openPrModal('${req.id}', this)" data-mode="create" class="action-btn bg-orange-600 hover:bg-orange-500 px-2 py-1 rounded ml-2" title="Send PR">
                 <i class="fa-solid fa-money-bill-wheat"></i>
              </button>`;
  }

  // Check lại status
  if (req.Status === waitEMConfirmFix) {
    btnActions += `<button data-id="${req.id}" onclick="confirmDoneRepair(${req.id}, this)" data-mode="create" class="action-btn bg-green-600 hover:bg-green-500 px-2 py-1 rounded ml-2" title="Confirm Done Repair">
                 <i class="fa-solid fa-calendar-check"></i>
              </button>`;
  }

  return btnActions;
}

// Hàm mở modal đánh giá - SỬA LẠI
//fix lại luồng hoạt động
//Đánh giá nhiều lần được và append những đánh giá đó vào timeline
async function openEvaluateModal(requestId, re = false, event) {
  // 1. Lấy các elements modal
  const modal = document.getElementById("evaluateModal");
  const modalContent = document.getElementById("evaluateModalContent");

  // 2. Lấy thông tin request từ currentData
  const request = currentData.find((req) => req.id === requestId);
  if (!request) {
    showAlert("Không tìm thấy thông tin yêu cầu!", "error");
    return;
  }

  // 3. Set giá trị cho các trường trong form
  document.getElementById("evaluateRequestId").value = requestId;
  document.getElementById("requestIdDisplay").textContent =
    "REP" + requestId.toString().padStart(3, "0");
  document.getElementById("issueDescription").textContent =
    request.Description || "";

  // 4. Reset form về trạng thái mặc định
  document.querySelector(
    'input[name="repairDecision"][value="InternalRepair"]'
  ).checked = true;
  document.getElementById("technicianSelect").value = "";
  document.getElementById("evaluationNotes").value = "";

  // 5. Xử lý hiển thị thông tin rejection nếu có
  const rejectionInfo = await getRejectInfo(requestId, [
    // waitLabConfirm,
    waitEmRevaluation,
    // waitLmManegerDisposal,
  ]);
  const rejectionAlert = document.getElementById("rejectionAlert");
  const rejectionContent = document.getElementById("rejectedContent");
  if (rejectionInfo) {
    rejectionAlert.classList.remove("hidden");
    rejectionContent.innerHTML = "";

    let html = "";
    if (rejectionInfo[waitLabConfirm]) {
      html += `
        <div class="mb-2 text-yellow-300 font-medium border border-red-200 p-4">
          <h4 class="font-bold text-base">Reject from Lab</h4>
          <p class="text-red-300"><strong>Reject By:</strong> <span class="font-medium text-gray-300">${rejectionInfo[waitLabConfirm].RejectedBy}</span></p>

          <p class="text-red-300"><strong>Time Reject:</strong> <span class="font-medium text-gray-300"> ${rejectionInfo[waitLabConfirm].RejectAt}</span></p> 
          <p class="text-red-300"><strong>Reason:</strong> <span class="font-medium text-gray-300"> ${rejectionInfo[waitLabConfirm].Reason}</span></p>
        </div>
      `;
    }

    if (rejectionInfo[waitEmRevaluation]) {
      html += `
        <div class="mb-2 text-yellow-300 font-medium border border-red-200 p-4">
          <h4 class="font-bold text-base">Reject from EM Manager</h4>
          <p class="text-red-300"><strong>Reject By:</strong> <span class="font-medium text-gray-300">${rejectionInfo[waitEmRevaluation].RejectedBy}</span></p>

          <p class="text-red-300"><strong>Time Reject:</strong> <span class="font-medium text-gray-300"> ${rejectionInfo[waitEmRevaluation].RejectAt}</span></p> 
          <p class="text-red-300"><strong>Reason:</strong> <span class="font-medium text-gray-300"> ${rejectionInfo[waitEmRevaluation].Reason}</span></p>
        </div>
      `;
    }

    if (rejectionInfo[waitLmManegerDisposal]) {
      html += `
        <div class="mb-2 text-yellow-300 font-medium border border-red-200 p-4">
          <h4 class="font-bold text-base">Reject from Lab Manager</h4>
          <p class="text-red-300"><strong>Reject By:</strong> <span class="font-medium text-gray-300">${rejectionInfo[waitLmManegerDisposal].RejectedBy}</span></p>

          <p class="text-red-300"><strong>Time Reject:</strong> <span class="font-medium text-gray-300"> ${rejectionInfo[waitLmManegerDisposal].RejectAt}</span></p> 
          <p class="text-red-300"><strong>Reason:</strong> <span class="font-medium text-gray-300"> ${rejectionInfo[waitLmManegerDisposal].Reason}</span></p>
        </div>
      `;
    }

    rejectionContent.innerHTML = html;
  } else {
    rejectionAlert.classList.add("hidden");
  }

  // 7. Load danh sách technicians
  loadTechnicians();

  // 8. Hiển thị modal với animation
  modal.classList.remove("hidden");

  // 9. Thêm event listeners cho modal
  const closeButtons = modal.querySelectorAll("[data-close-modal]");
  closeButtons.forEach((btn) => {
    btn.addEventListener("click", () => closeEvaluateModal());
  });
}

// Helper function để lấy thông tin rejection
function getRejectionInfo(request) {
  if (!request.Timeline) return null;

  const rejectionEvent = request.Timeline.filter(
    (event) => event.event === "Rejected"
  ).sort((a, b) => new Date(b.time) - new Date(a.time))[0];

  if (!rejectionEvent) return null;

  return {
    reason: rejectionEvent.reason || "Không có lý do",
    rejectedBy: rejectionEvent.rejectedBy || "Unknown",
    rejectedAt: rejectionEvent.time,
    approvalType: rejectionEvent.approvalType || "Unknown",
  };
}

function closeEvaluateModal() {
  const modal = document.getElementById("evaluateModal");
  modal.classList.add("hidden");
}

// Hàm đóng modal đánh giá
function closeEvaluateModal() {
  const modal = document.getElementById("evaluateModal");
  const modalContent = document.getElementById("evaluateModalContent");

  setTimeout(() => {
    modal.classList.add("hidden");
    // Reset rejection alert
    document.getElementById("rejectionAlert").classList.add("hidden");
  }, 200);
}

// Thêm event listeners - ĐẶT SAU PHẦN KHAI BÁO BIẾN
document.addEventListener("DOMContentLoaded", function () {
  // Evaluate Modal events

  // Form submit
  document
    .getElementById("evaluateForm")
    .addEventListener("submit", saveEvaluation);
});

// Hàm load danh sách kỹ thuật viên
function loadTechnicians() {
  fetch("/technicians")
    .then((res) => {
      if (!res.ok) throw new Error("Network response was not ok");
      return res.json();
    })
    .then((technicians) => {
      const technicianSelect = document.getElementById("technicianSelect");

      // Clear existing options except the first one
      technicianSelect.innerHTML =
        '<option value="">-- Select Technician --</option>';

      // Add technician options
      technicians.forEach((tech) => {
        const option = document.createElement("option");
        option.value = tech.id;
        option.textContent =
          tech.name || tech.Name || `Kỹ thuật viên ${tech.id}`;
        technicianSelect.appendChild(option.cloneNode(true));
      });
    })
    .catch((error) => {
      console.error("Error loading technicians:", error);
      showAlert("Không thể tải danh sách kỹ thuật viên!", "error");
    });
}
// Hàm lưu đánh giá
async function saveEvaluation(e) {
  e.preventDefault();

  const requestId = document.getElementById("evaluateRequestId").value;
  const technicanElement = document.getElementById("technicianSelect");
  const technicianId = technicanElement.value;
  const decision = document.querySelector(
    'input[name="repairDecision"]:checked'
  ).value;
  const notes = document.getElementById("evaluationNotes").value;
  const isConfirmDone = document.getElementById("repairDoneCheckbox").checked;
  // Validation bắt buộc chọn kỹ thuật viên tương ứng
  if (!technicianId) {
    showAlert("Lỗi: Vui lòng chọn kỹ thuật viên phụ trách!", "error");
    return;
  }
  // Tạo payload
  let payload = {
    event: "TechnicianEvaluation",
    decision: decision,
    notes: notes,
    time: fnGetCurrentDateTime(),
    technician_id: technicianId,
    technician_name: technicanElement.selectedOptions[0].textContent,
    is_confirm_done: isConfirmDone,
  };

  try {
    const response = await fetch(`/repair_requests/${requestId}/evaluate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Lỗi khi lưu đánh giá");
    }

    const result = await response.json();
    showAlert("Đánh giá thành công!", "success");
    closeEvaluateModal();

    // Reload lại danh sách yêu cầu sau khi lưu
    loadRequests(typeTab);
  } catch (error) {
    console.error("Error saving evaluation:", error);
    alert("Lỗi: " + error.message);
  }
}

// Hàm hiển thị thông báo (cần thêm vào HTML)
function showAlert(message, type = "info") {
  // Tạo hoặc sử dụng hệ thống thông báo có sẵn
  const alertDiv = document.createElement("div");
  alertDiv.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
    type === "success"
      ? "bg-green-600"
      : type === "error"
      ? "bg-red-600"
      : "bg-blue-600"
  } text-white`;
  alertDiv.textContent = message;

  document.body.appendChild(alertDiv);

  // Tự động xóa sau 3 giây
  setTimeout(() => {
    alertDiv.remove();
  }, 3000);
}

function openPrModal(requestId, btn) {
  const tr = btn.closest("tr");
  const tds = tr.querySelectorAll("td");

  // Lấy thông tin cơ bản từ table
  const requestInfo = {
    id: tds[0].textContent,
    device: tds[1].textContent,
    requestedBy: tds[2].textContent,
    department: tds[3].textContent,
    team: tds[4].textContent,
  };

  // --- Modal hiển thị ---
  const modal = document.createElement("div");
  modal.id = "prModal";
  modal.className =
    "fixed inset-0 z-50 flex items-center justify-center bg-black/60";
  modal.innerHTML = `
    <div class="relative bg-gray-900 rounded p-4 w-full max-w-2xl max-h-full overflow-y-auto">
      <button onclick="this.closest('.fixed').remove()" 
              class="absolute top-3 right-3 text-gray-400 hover:text-white px-3 py-1 bg-red-500 rounded">
        <i class="fas fa-times"></i>
      </button>
      
      <h3 class="text-lg font-semibold text-blue-300 border-b border-gray-700 mb-4"> 
        <i class="fa-solid fa-list-check"></i> Nhập PR Number
      </h3>
      
      <!-- Thông tin yêu cầu đơn giản -->
      <div class="mb-4 p-3 bg-gray-800 rounded border border-gray-700">
        <h4 class="font-semibold text-blue-200 mb-2">Thông tin yêu cầu:</h4>
        <div class="grid grid-cols-2 gap-2 text-sm">
          <div><span class="text-blue-300">ID:</span> ${requestInfo.id}</div>
          <div><span class="text-blue-300">Thiết bị:</span> ${requestInfo.device}</div>
          <div><span class="text-blue-300">Người yêu cầu:</span> ${requestInfo.requestedBy}</div>
          <div><span class="text-blue-300">Phòng ban:</span> ${requestInfo.department}</div>
        </div>
      </div>

      <!-- Form nhập PA_NO -->
      <div class="border border-gray-700 rounded p-4 bg-gray-800">
        <h4 class="font-semibold text-blue-200 mb-3">Nhập PR Number:</h4>
        <form id="paForm" class="flex gap-2 items-center">
          <input
            type="text" 
            name="pa_no"
            placeholder="Enter PR Number"
            required
            class="flex-1 px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:border-blue-500" />
          <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
            Save
          </button>
        </form>
      </div>

      <!-- Thông tin thêm (tùy chọn) -->
      <div class="mt-3 text-xs text-gray-400">
        <p><i class="fas fa-info-circle mr-1"></i> Nhập PR Number để chuyển trạng thái yêu cầu sang "Wait PR"</p>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // --- Bắt sự kiện submit form ---
  modal.querySelector("#paForm").addEventListener("submit", function (e) {
    e.preventDefault();
    const pa_no = this.querySelector("input[name='pa_no']").value.trim();

    if (!pa_no) {
      showAlert("Vui lòng nhập PR Number!", "warning");
      return;
    }

    // Gọi API của bạn để cập nhật PR number
    fetch(`/quote_option/${requestId}/waitpr`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        PA_no: pa_no,
      }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Server trả về lỗi " + res.status);
        }
        return res.json();
      })
      .then((result) => {
        if (result.message) {
          showAlert("Đã lưu PR Number thành công!", "success");
          modal.remove();
          loadRequests(typeTab);
        } else if (result.error) {
          showAlert("Lỗi: " + result.error, "error");
        } else {
          showAlert("Lưu PR Number thất bại", "error");
        }
      })
      .catch((err) => {
        showAlert("Error: " + err.message, "error");
      });
  });

  // Focus vào input khi modal mở
  setTimeout(() => {
    modal.querySelector("input[name='pa_no']").focus();
  }, 100);
}
function confirmDoneRepair(id, btn) {
  if (!confirm("Xác nhận thiết bị đã được sửa xong?")) return;
  fetch(`/repair_requests/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      Status: waitLabConfirm,
      ChangeByUsername: username

    }),
  })
    .then((res) => {
      if (!res.ok) {
        s;
        throw new Error("Server trả về lỗi " + res.status);
      }
      return res.json();
    })
    .then((result) => {
      if (result) {
        showAlert("Xác nhận sửa xong thành công!", "success");
        btn.closest("tr").remove();
      } else {
        showAlert("Xác nhận sửa xong thất bại", "error");
      }
    })
    .catch((err) => {
      showAlert("Không thể xác nhận sửa xong", "error");
    });
}

// Lắng nghe sự kiện thay đổi cho decision trong modal Evaluate
document.querySelectorAll('input[name="repairDecision"]').forEach((radio) => {
  radio.addEventListener("change", function (e) {
    console.log("Repair decision changed:", e.target.value);
    repairDoneCheckboxElement = document.getElementById("repairDoneCheckbox");
    if (e.target.value === "InternalRepair") {
      repairDoneCheckboxElement.disabled = false;
      document.getElementById("evaluationNotesRequired").textContent = "";
    } else {
      repairDoneCheckboxElement.disabled = true;
      repairDoneCheckboxElement.checked = false;
      document.getElementById("evaluationNotes").required = true;
      document.getElementById("evaluationNotesRequired").textContent = "*";
    }
  });
});

async function getRejectInfo(id, status = []) {
  const response = await fetch(`repair_requests_status_history/reject_info`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ request_id: id, status: status }),
  });
  if (!response.ok) {
    return;
  }
  return response.json();
}
