// Defaut Status:
const waitLabConfirmStatus = "Wait Lab Confirm";
const waitEmReEvaluationStatus = "Wait EM Re-Evaluation";
const waitEvaluationStatus = "Wait EM Evaluation";
// Phân trang
let currentPage = 1;
let currentData = [];
const rowsPerPage = 12;

// Table body render dữ liệu
const tableBody = document.getElementById("requestsTableBody");

// Modal elements
const modal = document.getElementById("priceModal");
const viewModal = document.getElementById("viewModal");
const modalContent = document.getElementById("modalContent");
const saveButtonModal = document.getElementById("saveQuoteBtn");
const deleteQuoteBtnModal = document.getElementById("deleteQuoteBtn");

// Giá trị của tab
let typeTab = "action";

// ngăn form reaload trang
document
  .getElementById("modalContent")
  .addEventListener("submit", function (event) {
    event.preventDefault();
  });

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
  <label class="hover:bg-gray-600">
    <input type="checkbox" class="checkItem" value="${item.id}" data-name="${item.name}" />
    ${item.name}
  </label>
`;
      });

      // Gắn sự kiện cho tất cả checkbox sau khi render
      const input = document.getElementById(idInput);
      const checkboxes = checkList.querySelectorAll("input[type='checkbox']");
      //hàm fix nếu userrole = user thì disable filter department và team
      // Nếu KHÔNG phải admin → disable filter
      if (userRoleId !== "1"&& idInput !== "statusFilter") {
        input.disabled = true;
        checkboxes.forEach((cb) => {
          cb.disabled = true;
          // Nếu là labFilter hoặc teamFilter thì check đúng user
          if (idInput === "departmentFilter" && cb.value == userLabId) {
            cb.checked = true;
            input.value = cb.parentElement.textContent.trim();
          }
          if (idInput === "teamFilter" && cb.value == userTeamId) {
            cb.checked = true;
            input.value = cb.parentElement.textContent.trim();
          }
        });
        return;
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

  let departmentCheckedValues = [];
  let teamCheckedValues = [];

  if (userRoleId === "1") {
    const deptBoxes = document.querySelectorAll(
      "#departmentChecklistContent input[type='checkbox']:checked"
    );
    const teamBoxes = document.querySelectorAll(
      "#teamChecklistContent input[type='checkbox']:checked"
    );
    departmentCheckedValues = Array.from(deptBoxes).map((c) => c.value);
    teamCheckedValues = Array.from(teamBoxes).map((c) => c.value);
  } else {
    // Gắn trực tiếp giá trị của user
    departmentCheckedValues = [userLabId];
    teamCheckedValues = [userTeamId];
  }

  const statusCheckedValues = Array.from(
  document.querySelectorAll("#statusChecklistContent input[type='checkbox']:checked")
).map(cb => cb.dataset.name);

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
  const departmentChecklistContent = document.getElementById("departmentChecklistContent");
  const departmentCheckboxes = departmentChecklistContent.querySelectorAll("input[type='checkbox']");
  departmentCheckboxes.forEach((cb) => (cb.checked = false));
  deptInput.value = "";

  // Team
  const teamInput = document.getElementById("teamFilter");
  const teamChecklistContent = document.getElementById("teamChecklistContent");
  const teamCheckboxes = teamChecklistContent.querySelectorAll("input[type='checkbox']");
  teamCheckboxes.forEach((cb) => (cb.checked = false));
  teamInput.value = "";

  // Status
  document.getElementById("statusFilter").value = "";
  const statusChecklistContent = document.getElementById("statusChecklistContent");
  const statusCheckboxes = statusChecklistContent.querySelectorAll("input[type='checkbox']");
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
// Hàm Render phân trang
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

  // add nút export to excel
  const exportBtn = document.createElement("button");
  exportBtn.innerHTML = `<i class="fas fa-file-excel"></i> Download`;
  exportBtn.className =
    "px-3 py-1 rounded mx-1 bg-green-600 hover:bg-green-500";
  exportBtn.addEventListener("click", () => {
    downloadExcel("Quotation " + typeTab + ".xlsx");
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
// Hàm Load dữ liệu từ API
function loadRequests(type = "all") {
  tableBody.innerHTML = `
     <tr id="loadingState" class="text-center py-4 w-screen overflow-x-hidden ">
        <td colspan="8">
          <div class="border-4 border-white border-t-blue-500 rounded-full w-10 h-10 my-5 mx-auto animate-spin"></div>
          <p class="text-gray-400 mt-4">Loading request list...</p>
        </td>
     </tr>
  `;
  let filters = getFilterValues(); // Khởi tạo mặc định
  // Áp dụng bộ lọc status tùy theo tab
  //tab action chỉ lấy trạng thái Waitlabconfirm
  if (type === "action") {
    const statusDefautAction = [waitLabConfirmStatus];
    if (filters.status.length === 0) {
      filters.status = statusDefautAction;
    } else {
      filters.status = filters.status.map((s) =>
        statusDefautAction.includes(s) ? s : 1
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
    document.getElementById("pagination").innerHTML = "";
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
    case waitLabConfirmStatus:
      return `<span class="px-2 py-1 rounded bg-orange-600 text-xs w-full inline-block">${Status}</span>`;
    case waitEvaluationStatus:
      return `<span class="px-2 py-1 rounded bg-blue-600 text-xs w-full inline-block">${Status}</span>`;
    default:
      return `<span class="px-2 py-1 rounded bg-gray-600 text-xs w-full inline-block">${Status}</span>`;
  }
}

// Hàm Render hành động
function renderActions(req, type = "all") {
  let btnActions = `<button
    class="bg-cyan-500 hover:bg-cyan-500 text-white p-1 rounded"
    onclick="openReviewModal(${req.id}, event)"
    title="Xem chi tiết"
  >
    <i class="fas fa-eye"></i>
  </button>`;

  if (type === "all") return btnActions;

  if (req.Status === waitLabConfirmStatus) {
    btnActions += `<button data-id="${req.id}" onclick = "updateRequestStatus(${req.id}, event)" class="action-btn bg-orange-600 hover:bg-orange-500 px-2 py-1 rounded ml-2" title="Confirm Done Request">
                 <i class="fa-solid fa-money-bill-wheat"></i>
              </button>`;
  }
  if (req.Status === waitEvaluationStatus) {
    btnActions += `<button data-id="${req.id}" onclick = "updateRequestStatus(${req.id}, event)" class="action-btn bg-blue-600 hover:bg-orange-500 px-2 py-1 rounded ml-2" title="Confirm Done Request">
                 <i class="fa-solid fa-money-bill-wheat"></i>
              </button>`;
  }

  // if (req.Status === "Quoted") {
  //   btnActions += `<button data-id="${req.id}" data-mode="update" class="action-btn bg-yellow-600 hover:bg-yellow-500 px-2 py-1 rounded ml-2" title="update">
  //             <i class="fa-regular fa-pen-to-square"></i>
  //             </button>`;
  // }
  // if (req.Status === "rejected") {
  //   btnActions += `<button data-id="${req.id}" data-mode="create" class="action-btn bg-red-600 hover:bg-red-500 px-2 py-1 rounded ml-2" title="Resend Quotation">
  //                <i class="fa-solid fa-money-bill-wheat"></i>
  //             </button>`;
  // }

  // if (req.Status === "waitPO") {
  //   btnActions += `<button onclick="openPOModal('${req.id}')"
  //               title="Tạo PO"
  //               class="px-3 py-1 text-sm bg-purple-600 hover:bg-purple-500 rounded text-white ml-2 ">
  //               <i class="fas fa-file-invoice"></i> </button>`;
  // }

  return btnActions;
}
//hàm này lấy tất cả đánh giá của bộ phận kỹ thuật
//chỉ áp dụng cho em staff để xem full các đánh giá trường hợp đánh giá lại nhiều lần
//nếu không có đánh giá thì trả về chuỗi rỗng
function renderTimelineTableForTechnicianEvaluations(timeline) {
  if (!timeline || timeline.length === 0) {
    return `<tr><td colspan="1" class="text-center text-white">Không có dữ liệu Timeline</td></tr>`;
  }

  // Lọc chỉ những phần tử có event là 'TechnicianEvaluation' và sắp xếp mới nhất lên đầu
  const filtered = timeline
    .filter((item) => item.event === "TechnicianEvaluation")
    .sort((a, b) => new Date(b.time) - new Date(a.time));

  if (filtered.length === 0) {
    return `<tr><td colspan="1" class="text-center text-white">Không có dữ liệu Technician Evaluation</td></tr>`;
  }

  return filtered
    .map(
      (item) => `
    <tr class="px-2 py-1 font-semibold border text-white">
      <td>Decision of Technician: ${item.decision || "-"}</td>
    </tr>
    <tr class="px-2 py-1 font-semibold border text-white">
      <td>Evaluation of Technician: ${item.notes || "-"}</td>
    </tr>
    <tr class="px-2 py-1 font-semibold border text-white">
      <td>Technician: ${item.technician_name || "-"}</td>
    </tr>
    <tr class="px-2 py-1 font-semibold border text-white">
      <td>Time: ${formatDate(item.time)}</td>
    </tr>
    <tr><td class="border-b border-gray-700"></td></tr>
  `
    )
    .join("");
}
//---hàm lấy đánh giá của bộ phận kỹ thuật
//---chỉ lấy đánh giá mới nhất của bộ phận kỹ thuật
//---nếu không có đánh giá thì trả về chuỗi rỗng
function renderLatestTechnicianEvaluation(timeline) {
  if (!timeline || timeline.length === 0) {
    return `<tr><td colspan="1" class="text-center text-white">Không có dữ liệu Timeline</td></tr>`;
  }
  let data;
  try {
    data = Array.isArray(timeline) ? timeline : JSON.parse(timeline || "[]");
  } catch {
    data = [];
  }
  // Chỉ lấy event TechnicianEvaluation mới nhất
  const latest = (data || [])
    .filter((item) => item.event === "TechnicianEvaluation")
    .sort((a, b) => new Date(b.time) - new Date(a.time))[0];

  if (!latest) {
    return `<tr><td colspan="1" class="text-center text-white">Không có dữ liệu Technician Evaluation</td></tr>`;
  }

  return `
    <tr class="px-2 py-1 font-semibold border text-white">
      <td>Decision of Technician: ${latest.decision || "-"}</td>
    </tr>
    <tr class="px-2 py-1 font-semibold border text-white">
      <td>Evaluation of Technician: ${latest.notes || "-"}</td>
    </tr>
    <tr class="px-2 py-1 font-semibold border text-white">
      <td>Technician: ${latest.technician_name || "-"}</td>
    </tr>
    <tr class="px-2 py-1 font-semibold border text-white">
      <td>Time: ${formatDate(latest.time)}</td>
    </tr>
    <tr><td class="border-b border-gray-700"></td></tr>
  `;
}

// ----------------Nhóm hàm xử lý modal----------------
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
              <th colspan="2" class="text-center text-lg font-bold text-white border bg-blue-950">
                Request Details
              </th>
            </tr>
          </thead>
          <tbody>
            <tr><td class="px-2 py-1 font-semibold border text-blue-300">ID Req</td><td class="px-2 py-1 font-semibold border text-white">${
              req.id
            }</td></tr>
            <tr><td class="px-2 py-1 font-semibold border text-blue-300">Device</td><td class="px-2 py-1 font-semibold border text-white">${
              req.DeviceName
            }</td></tr>
            <tr><td class="px-2 py-1 font-semibold border text-blue-300">Requested By</td><td class="px-2 py-1 font-semibold border text-white">${
              req.RequestedBy
            }</td></tr>
            <tr><td class="px-2 py-1 font-semibold border text-blue-300">Department</td><td class="px-2 py-1 font-semibold border text-white ">${
              req.LabName || "-"
            }</td></tr>
            <tr><td class="px-2 py-1 font-semibold border text-blue-300">Team</td><td class="px-2 py-1 font-semibold border text-white ">${
              req.TeamName || "-"
            }</td></tr>
            <tr><td class="px-2 py-1 font-semibold border text-blue-300">Requests Date</td><td class="px-2 py-1 font-semibold border text-white">${
              formatDate(req.RequestDate) || "-"
            }</td></tr>
            <tr><td class="px-2 py-1 font-semibold border text-blue-300">Status</td><td class="text-red-400 font-bold px-2 border py-1">${
              req.Status
            }</td></tr>
          </tbody>
        </table>
        <table>
          <thead>
            <tr>
              <td class="border text-white font-bold text-lg text-center bg-blue-950">
                Device Error Detail
              </td>
            </tr>
          </thead>
          <tbody>
           ${renderLatestTechnicianEvaluation(req.Timeline)}
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
  modal.classList.remove("hidden");
  modal.classList.add("block");
  // Reset current iframe reference
  currentTimelineIframe = document.getElementById("timelineIframe");
}

// Hàm khi iframe load xong
function onTimelineLoad() {
  currentTimelineIframe = document.getElementById("timelineIframe");
}

// Hàm resize iframe - SỬA LẠI
function resizeTimelineIframe() {
  const iframe = document.getElementById("timelineIframe");
  if (!iframe) return;

  console.log("Resizing timeline iframe...");

  try {
    // Đặt chiều cao cố định ban đầu
    iframe.style.height = "600px";

    // Sau khi load xong, thử resize
    setTimeout(() => {
      try {
        // Thử lấy chiều cao từ iframe (có thể bị CORS)
        const iframeDoc =
          iframe.contentDocument || iframe.contentWindow.document;
        const body = iframeDoc.body;
        const html = iframeDoc.documentElement;

        const height = Math.max(
          body.scrollHeight,
          body.offsetHeight,
          html.clientHeight,
          html.scrollHeight,
          html.offsetHeight
        );

        console.log("Calculated iframe height:", height);

        // Đặt chiều cao mới, thêm margin nhỏ
        iframe.style.height = height + 50 + "px";
      } catch (e) {
        console.log("Không thể resize iframe (CORS):", e);
        // Giữ chiều cao mặc định nếu có lỗi CORS
        iframe.style.height = "600px";
      }
    }, 1500); // Tăng thời gian chờ để đảm bảo timeline load xong
  } catch (error) {
    console.log("Lỗi resize iframe:", error);
    // Fallback: đặt chiều cao cố định
    iframe.style.height = "600px";
  }
}

// Hàm để timeline gọi từ bên trong iframe
window.resizeTimelineIframe = function () {
  resizeTimelineIframe();
};

// Hàm thay đổi request_id - SỬA LẠI
function changeTimelineRequest(requestId) {
  const iframe = document.getElementById("timelineIframe");
  if (iframe) {
    iframe.src = `/static/timeline.html?request_id=${requestId}`;
    // Reset height khi thay đổi request
    iframe.style.height = "600px";
  }
}

//ham dong modal
function closeModal() {
  document.getElementById("viewModal").classList.add("hidden");
  document.getElementById("viewModal").classList.remove("block");
  // Reset iframe reference khi đóng modal
  currentTimelineIframe = null;
}

// ----------------Nhóm hàm xử lý filter----------------
document.getElementById("applyFilter").addEventListener("click", function () {
  loadRequests(typeTab);
});

document.getElementById("clearFilter").addEventListener("click", function () {
  resetFilterUI();
  loadRequests(typeTab);
});

function formatDate(dateString) {
  if (!dateString) return "-";
  const d = new Date(dateString);
  return (
    d.toLocaleDateString("vi-VN") +
    " " +
    d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
  );
}
// Hàm cập nhật trạng thái thiết bị
// Hàm mở modal xác nhận trạng thái - SỬA LẠI
function updateRequestStatus(id, event) {
  // Ngăn sự kiện lan truyền
  if (event) {
    event.stopPropagation();
  }

  // Tìm request trong currentData
  const request = currentData.find((item) => item.id === id);
  if (!request) {
    alert("Không tìm thấy thông tin yêu cầu");
    return;
  }

  // reset and set giá trị ban đầu
  document.getElementById("currentRequestId").value = id;
  document.getElementById("statusNote").value = "";
  document.getElementById("deviceId").value = request.DeviceID || "";

  // Call API get Status options
  fetch(`/approvals/get_status_confirm_for_lab/${id}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      const statusSelect = document.getElementById("newStatus");
      statusSelect.innerHTML = `
                                  <option value="">-- Choose Status --</option>
                                  <option value="Done">Done</option>
                                  ${
                                    Object.keys(data).length === 0
                                      ? `<option value="${waitEmReEvaluationStatus}">Re-evaluate</option>`
                                      : ""
                                  }
                              `;
      document.getElementById("statusModal").classList.remove("hidden");
    })
    .catch((error) => {
      alert("Error fetching status options: " + error.message);
    });
}

// Hàm lưu cập nhật trạng thái - SỬA LẠI
document
  .getElementById("modalContent")
  .addEventListener("submit", function (e) {
    e.preventDefault();
    const id = document.getElementById("currentRequestId").value;
    const selectElement = document.getElementById("newStatus");
    const status = selectElement.value;
    const note = document.getElementById("statusNote").value;
    const deviceId = document.getElementById("deviceId").value;

    const dataId = currentData.filter((d) => d.id === parseInt(id))[0];

    if (!status) {
      showAlert("Vui lòng chọn trạng thái", "error");
      return;
    }

    const updateData = {
      Status: status,
      Note: note,
      UpdatedBy: userId || "lab_user",
      UpdatedDate: fnGetCurrentDateTime(),
      ChangeByUsername: userName,
      NoteByUsername: note,
    };

    // Thêm completed_date nếu status là Done
    if (status === "Done") {
      updateData.completed_date = fnGetCurrentDateTime();
    }

    // Gọi API cập nhật request - ĐIỀU CHỈNH URL THEO API THỰC TẾ
    fetch(`/repair_requests/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((result) => {
        // Nếu status là Done, cập nhật trạng thái thiết bị
        if (status === "Done" && deviceId) {
          return updateDeviceStatus(deviceId, "available").then(() => result);
        }
        return result;
      })
      .then(() => {
        // Đóng modal
        closeStatusModal();

        // Hiển thị thông báo
        showAlert("Cập nhật trạng thái thành công!", "success");

        // Reload dữ liệu
        loadRequests(typeTab);
      })
      .catch((error) => {
        console.error("Error updating status:", error);
        showAlert(
          "Có lỗi xảy ra khi cập nhật trạng thái: " + error.message,
          "error"
        );
      });
  });

// Hàm đóng modal trạng thái
function closeStatusModal() {
  document.getElementById("statusModal").classList.add("hidden");
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

function requireRemark(val) {
  if (val === waitEmReEvaluationStatus) {
    document.getElementById(
      "statusNoteLabel"
    ).innerHTML = `Remark <span class="text-red-500">*</span> `;
    document.getElementById("statusNote").required = true;
  } else {
    document.getElementById("statusNoteLabel").innerHTML = `Remark`;
    document.getElementById("statusNote").required = false;
  }
}

function updateDeviceStatus(deviceId, newStatus) {
  let dt = { Status: newStatus };
  return fetch(`/devices/${deviceId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify(dt),
  });
}
