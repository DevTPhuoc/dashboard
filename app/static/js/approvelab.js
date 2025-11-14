// status variable
const waitLmManagerApprovalExternal = "Wait LM Manager's Approval External";
const waitLmManagerApprovalQuotation = "Wait LM Manager's Approval Quotation";
const waitEmManagerReApprovalQuotation =
  "Wait EM Manager's Re-Approval Quotation";
const waitPr = "Wait PR";
const waitLmDisposal = "Wait LM Manager's Disposal";
let currentApproveId;
//Table body render dữ liệu
let currentPage = 1;
let currentData = [];
let currentRequests = [];

const rowsPerPage = 12;

const tableBody = document.getElementById("requestsTableBody");
const start = (currentPage - 1) * rowsPerPage;
const end = start + rowsPerPage;

// Modal elements
const modal = document.getElementById("priceModal");
const viewModal = document.getElementById("viewModal");
const modalContent = document.getElementById("modalContent");
const saveButtonModal = document.getElementById("saveQuoteBtn");
const deleteQuoteBtnModal = document.getElementById("deleteQuoteBtn");
document.querySelectorAll('input[name="quotationAction"]').forEach((radio) => {
  radio.addEventListener("change", function () {
    const remarkTextarea = document.getElementById(
      "approvalCommentQuotationModal"
    );
    const remarkRequired = this.value === "reject" || this.value === "replace";

    if (remarkRequired) {
      remarkTextarea.required = true;
      remarkTextarea.placeholder =
        "Enter remarks, reasons for approval or rejection... (Required)";
    } else {
      remarkTextarea.required = false;
      remarkTextarea.placeholder =
        "Enter remarks, reasons for approval or rejection...";
    }
  });
});
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
  const departmentChecklistContent = document.getElementById("departmentChecklistContent");
  const departmentCheckboxes = departmentChecklistContent.querySelectorAll("input[type='checkbox']");
  let departmentCheckedValues = Array.from(departmentCheckboxes)
    .filter((cb) => cb.checked)
    .map((cb) => cb.value);

  // Team
  const teamChecklistContent = document.getElementById("teamChecklistContent");
  const teamCheckboxes = teamChecklistContent.querySelectorAll("input[type='checkbox']");
  let teamCheckedValues = Array.from(teamCheckboxes)
    .filter((cb) => cb.checked)
    .map((cb) => cb.value);

  // Status
  const statusChecklistContent = document.getElementById("statusChecklistContent");
  const statusCheckboxes = statusChecklistContent.querySelectorAll("input[type='checkbox']");
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

// Hàm Call API load data
function loadRequests(type = "all") {
  tableBody.innerHTML = `
     <tr id="loadingState" class="text-center py-4 w-screen overflow-x-hidden ">
        <td colspan="8">
          <div class="border-4 border-white border-t-blue-500 rounded-full w-10 h-10 my-5 mx-auto animate-spin"></div>
          <p class="text-gray-400 mt-4">Loading request list...</p>
        </td>
     </tr>
  `;
  let filters = getFilterValues();
  if (type === "action") {
    const statusDefautAction = [
      waitLmManagerApprovalQuotation,
      waitLmManagerApprovalExternal,
      waitLmDisposal,
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
      // if (Status.length > 0) {
      //   filtered = filtered.filter((r) => Status.includes(r.Status));
      // }
      currentData = filtered;
      renderTable(filtered, type);
    });
}

// Hàm Render dữ liệu lên bảng từ id table, data-api-list
function renderTable(data, type) {
  tableBody.innerHTML = "";
  // Nếu dữ liệu rỗng
  if (data.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-gray-400">No data available</td></tr>`;
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
       <td class="text-center px-4 py-2 border border-gray-700">
  <span class="${
    req.Priority === "Priority"
      ? "inline-block bg-green-500 px-2 py-1 text-white rounded text-sm"
      : ""
  }">
    ${req.Priority || "-"}
  </span>
</td>
        <td class="text-center px-4 py-2 border border-gray-700">${
          req.RequestDate || "-"
        }</td>
        <td class="text-center px-4 py-2 border border-gray-700">${
          req.TAT || "-"
        }</td>
         <td class="text-center px-4 py-2 border border-gray-700">${renderStatus(
           req.Status
         )}</td>
        <td class="text-left px-4 py-2 border border-gray-700">${renderActions(
          req,
          type
        )}</td>
        
      `;
    tableBody.appendChild(tr);
    // const approveBtn = tr.querySelector(".approve-btn");
    // if (approveBtn) {
    //   approveBtn.addEventListener("click", function () {
    //     const requestId = req.id;
    //     showApprovalModal(requestId);
    //   });
    // }
  });

  // Render phân trang
  renderPagination(data.length);
}

// Hàm Xác định màu trạng thái
function renderStatus(Status) {
  switch (Status) {
    case waitLmManagerApprovalExternal:
      return `<span class="px-2 py-1 rounded bg-green-600 text-xs w-full inline-block">${Status}</span>`;
    case waitLmManagerApprovalQuotation:
      return `<span class="px-2 py-1 rounded bg-blue-600 text-xs w-full inline-block">${Status}</span>`;
    case waitLmDisposal:
      return `<span class="px-2 py-1 rounded bg-orange-600 text-xs w-full inline-block">${Status}</span>`;
    default:
      return `<span class="px-2 py-1 rounded bg-gray-600 text-xs w-full inline-block">${Status}</span>`;
  }
}

// Hàm Render hành động
function renderActions(req, type = "all") {
  let btnActions = `<button
    class="bg-cyan-500 hover:bg-cyan-500 text-white p-1 rounded"
    onclick="openReviewModalView(${req.id}, event)"
    title="Xem chi tiết"
  >
    <i class="fas fa-eye"></i>
  </button>`;

  if (type === "all") return btnActions;

  if (req.Status === waitLmManagerApprovalQuotation) {
    btnActions += `<button data-id="${req.id}" onclick="openQuotationModal(${req.id})"data-mode="create" class="action-btn bg-blue-600 hover:bg-blue-500 px-2 py-1 rounded ml-2" title="Approve Quotation">
                 <i class="fa-solid fa-money-bill-wheat"></i>
              </button>`;
  }
  if (req.Status === waitLmManagerApprovalExternal) {
    btnActions += `
    <button onclick="showApprovalModal(${req.id})" 
            class="px-3 py-1.5 bg-green-600 hover:bg-green-500 rounded text-white text-xs transition transform hover:scale-105" 
            title="Approve Request">
        <i class="fas fa-check mr-1"></i> 
    </button>
  `;
  }
  if (req.Status === waitLmDisposal) {
    btnActions += `
      <button class="approve-btn px-3 py-1.5 bg-orange-600 hover:bg-orange-500 rounded text-white text-xs transition transform hover:scale-105" 
              data-request-id="${req.id}" title="Approve Disposal Device" onclick="openDisposalModal(${req.id})">
          <i class="fas fa-trash-alt mr-1"></i> 
      </button>
    `;
  }

  return btnActions;
}
// Hàm mở modal disposal - SỬA LẠI
function openDisposalModal(reqId) {
  currentApproveId = reqId;
  const dataIdTable = currentData.find((d) => d.id === reqId);

  // Điền thông tin cơ bản vào modal disposal
  document.getElementById("requestIdDisposalModal").innerText = dataIdTable.id;
  document.getElementById("requestDeviceDisposalModal").innerText =
    dataIdTable.DeviceName;
  document.getElementById("requestLabDisposalModal").innerText =
    dataIdTable.LabName;
  document.getElementById("requestDateDisposalModal").innerText =
    dataIdTable.RequestDate;
  document.getElementById("requestStatusDisposalModal").innerText =
    dataIdTable.Status;
  document.getElementById("requestRequesterDisposalModal").innerText =
    dataIdTable.RequestedBy;
  document.getElementById("requestDescriptionDisposalModal").innerText =
    dataIdTable.Description;

  // Reset form
  document.getElementById("approvalCommentDisposalModal").value = "";
  document.querySelector(
    'input[name="disposalAction"][value="approve"]'
  ).checked = true;

  // Reset phần hiển thị file
  document.getElementById("disposalFileSection").classList.add("hidden");
  document.getElementById("disposalFileContent").innerHTML = "";

  // Gọi API để lấy thông tin disposal document
  fetch(`/repair_request/api/repair_requests/${reqId}/disposal_document`)
    .then((res) => res.json())
    .then((data) => {
      if (data.error) {
        console.error("Lỗi khi lấy disposal document:", data.error);
        showFileError("Lỗi khi tải thông tin tài liệu");
        return;
      }

      if (data.exists === false) {
        showNoFileMessage();
      } else {
        showFileInfo(data, reqId);
      }
    })
    .catch((err) => {
      console.error("Lỗi khi gọi API disposal document:", err);
      showFileError("Không thể kết nối đến server");
    });

  // Hiển thị modal disposal và ẩn các modal khác
  document.getElementById("approveDisposalModal").classList.remove("hidden");
  document.getElementById("approveQuotationModal").classList.add("hidden");
  document.getElementById("approvalModal").classList.add("hidden");
}

// Hàm đóng modal disposal - SỬA LẠI
function closeDisposalModal() {
  document.getElementById("approveDisposalModal").classList.add("hidden");
}

// Thêm sự kiện cho nút submit disposal
document
  .getElementById("submitDisposalBtn")
  .addEventListener("click", submitDisposalApproval);
// Hàm hiển thị thông tin file với debug
function showFileInfo(data, reqId) {
  document.getElementById("disposalFileSection").classList.remove("hidden");

  const viewUrl = data.download_url + "?action=view";
  const downloadUrl = data.download_url;

  const fileExt = data.file_name.split(".").pop().toLowerCase();
  const fileIcons = {
    pdf: "fa-file-pdf text-red-400",
    doc: "fa-file-word text-blue-400",
    docx: "fa-file-word text-blue-400",
    default: "fa-file text-yellow-400",
  };
  const fileIcon = fileIcons[fileExt] || fileIcons.default;

  let fileHTML = `
    <div class="bg-gray-700/30 rounded-lg p-4 border border-gray-600">
      <div class="flex items-center justify-between mb-4">
        <h5 class="text-green-400 font-semibold flex items-center gap-2">
          <i class="fas ${fileIcon}"></i>
          Tài liệu thanh lý
        </h5>
        <span class="text-xs text-gray-400">${data.upload_date || ""}</span>
      </div>
      
      <div class="space-y-3 mb-4">
        <div class="flex items-center justify-between p-2 bg-gray-600/50 rounded">
          <span class="text-gray-300">Tên file:</span>
          <span class="text-white font-medium">${data.file_name}</span>
        </div>
        
        <div class="flex items-center justify-between p-2 bg-gray-600/50 rounded">
          <span class="text-gray-300">Định dạng:</span>
          <span class="text-yellow-300 font-mono">${fileExt.toUpperCase()}</span>
        </div>
        
        <div class="flex items-center justify-between p-2 bg-gray-600/50 rounded">
          <span class="text-gray-300">Trạng thái:</span>
          <span class="px-2 py-1 text-xs rounded bg-green-600 text-white">
            ✅ Có sẵn
          </span>
        </div>
      </div>
  `;

  // THÔNG BÁO ĐẶC BIỆT CHO TỪNG LOẠI FILE
  if (fileExt === "pdf") {
    fileHTML += `
      <div class="mb-4 p-3 bg-green-900/30 border border-green-700 rounded-lg">
        <p class="text-green-300 text-sm flex items-center gap-2">
          <i class="fas fa-check-circle"></i>
          PDF có thể xem trực tiếp trong trình duyệt
        </p>
      </div>
    `;
  } else if (fileExt === "doc" || fileExt === "docx") {
    fileHTML += `
      <div class="mb-4 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
        <p class="text-blue-300 text-sm flex items-center gap-2">
          <i class="fas fa-info-circle"></i>
          File Word cần Microsoft Word hoặc Google Docs để xem
        </p>
      </div>
    `;
  }

  fileHTML += `
      <div class="flex flex-col sm:flex-row gap-2 justify-end">
        <a href="${viewUrl}" 
           target="_blank" 
           class="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition transform hover:scale-105 flex-1 sm:flex-none justify-center">
          <i class="fas fa-eye"></i>
          View file
        </a>
        
        <a href="${downloadUrl}" 
           download="${data.file_name}"
           class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition transform hover:scale-105 flex-1 sm:flex-none justify-center">
          <i class="fas fa-download"></i>
          Download
        </a>
      </div>
    </div>
  `;

  document.getElementById("disposalFileContent").innerHTML = fileHTML;
}
// Hàm hiển thị khi không có file
function showNoFileMessage() {
  document.getElementById("disposalFileSection").classList.remove("hidden");
  document.getElementById("disposalFileContent").innerHTML = `
    <div class="text-gray-400 text-sm italic">Không có tài liệu thanh lý đính kèm</div>
  `;
}

// Hàm hiển thị khi có lỗi
function showFileError(message) {
  document.getElementById("disposalFileSection").classList.remove("hidden");
  document.getElementById("disposalFileContent").innerHTML = `
    <div class="text-red-400 text-sm">${message}</div>
  `;
}
// Hàm đóng modal disposal
function closeDisposalModal() {
  document.getElementById("approveDisposalModal").classList.add("hidden");
}

function openReviewModal(requestId) {
  fetch(`/repair_request/api/approved-quotation-confirm/${requestId}`)
    .then((res) => res.json())
    .then((data) => {
      document.getElementById("viewApprovedTitle").innerText = "đã duyệt";
      document.getElementById("rejectBtn").style.display = "none";
      document.getElementById("approveBtn").style.display = "none";

      if (data.error) {
        document.getElementById("viewApprovedContent").innerHTML = `
          <p class="text-red-400">${data.error}</p>
        `;
        document.getElementById("viewApprovedModal").classList.remove("hidden");
        return;
      }

      let infoSection = `
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p><span class="font-semibold">Mã YC:</span> ${data.request_id}</p>
            <p><span class="font-semibold">Thiết bị:</span> ${
              data.device_name
            } (${data.device_code})</p>
            <p><span class="font-semibold">Người yêu cầu:</span> ${
              data.requested_by
            }</p>
          </div>
          <div>
            <p><span class="font-semibold">Ngày duyệt:</span> ${
              data.approved_date || "Chưa có"
            }</p>
            <p><span class="font-semibold">Trạng thái:</span> 
              <span class="px-2 py-1 rounded-full text-xs ${
                data.status === "confirmed"
                  ? "bg-green-600 text-white"
                  : "bg-gray-600 text-white"
              }">
                ${data.status}
              </span>
            </p>
          </div>
        </div>
      `;

      let optionSection = `
        <div class="mt-6">
          <h4 class="font-semibold mb-3 text-lg">Option đã duyệt</h4>
          ${
            data.approved_options && data.approved_options.length > 0
              ? data.approved_options
                  .map(
                    (opt) => `
                  <div class="border border-gray-700 rounded-xl p-4 mb-4 bg-gray-800 shadow-md hover:border-green-500 transition">
                    <div class="flex justify-between items-center mb-2">
                      <p class="font-semibold">Option #${opt.option_no}</p>
                      <span class="px-2 py-1 text-xs rounded-full ${
                        opt.status === "Approved"
                          ? "bg-green-600 text-white"
                          : "bg-gray-600 text-white"
                      }">${opt.status}</span>
                    </div>
                    <p><b>Nhà cung cấp:</b> ${opt.vendor_name}</p>
                    <p><b>Số lượng:</b> ${opt.quantity}</p>
                    <p><b>Đơn giá:</b> ${opt.unit_price}</p>
                    <p><b>Tổng:</b> ${opt.total_cost}</p>
                    <p><b>Ghi chú:</b> ${opt.notes || ""}</p>
                    ${
                      opt.file_url
                        ? `<a href="${opt.file_url}" target="_blank" 
                             class="inline-block mt-2 px-3 py-1 text-sm text-blue-400 border border-blue-500 rounded-lg hover:bg-blue-500 hover:text-white transition">
                             📎 Xem file</a>`
                        : ""
                    }
                  </div>
                `
                  )
                  .join("")
              : `<p class="text-gray-400">Chưa có option nào được duyệt</p>`
          }
        </div>
      `;

      document.getElementById("viewApprovedContent").innerHTML =
        infoSection + optionSection;
      document.getElementById("viewApprovedModal").classList.remove("hidden");
    })
    .catch((err) => {
      console.error("Lỗi khi load approved quotation:", err);
      document.getElementById(
        "viewApprovedContent"
      ).innerHTML = `<p class="text-red-400">Không tải được dữ liệu</p>`;
      document.getElementById("viewApprovedModal").classList.remove("hidden");
    });
}

function closeReviewModal() {
  reviewContent.classList.remove("opacity-100", "scale-100");
  setTimeout(() => reviewModal.classList.add("hidden"), 200);
}

// function openViewModal(reqId) {
//   fetch(`/repair_request/api/approved-quotation/${reqId}`)
//     .then((res) => res.json())
//     .then((data) => {
//       document.getElementById("viewApprovedTitle").innerText = "chờ duyệt";
//       document.getElementById("viewApprovedModal").classList.remove("hidden");
//       document.getElementById("rejectBtn").style.display = "inline-block";
//       document.getElementById("approveBtn").style.display = "inline-block";

//       // Fill content
//       const options = Array.isArray(data.approved_option)
//         ? data.approved_option
//         : [];
//       const c = document.getElementById("viewApprovedContent");
//       c.innerHTML = `
//         <div class="mb-2"><span class="font-semibold">Mã YC:</span> ${
//           data.request_id
//         }</div>
//         <div class="mb-2"><span class="font-semibold">Thiết bị:</span> ${
//           data.device_name
//         } (${data.device_code})</div>
//         <div class="mb-2"><span class="font-semibold">Người yêu cầu:</span> ${
//           data.requested_by
//         }</div>
//         <div class="mb-2"><span class="font-semibold">Ngày yêu cầu:</span> ${
//           data.request_date || "-"
//         }</div>
//         <div class="mb-2"><span class="font-semibold">Ngày duyệt:</span> ${
//           data.approved_date || "-"
//         }</div>

//         <div class="mb-2"><span class="font-semibold">Phương án:</span></div>
//         ${options
//           .map(
//             (opt) => `
//           <div class="border ${
//             opt.status === "Approved" ? "border-green-700" : "border-gray-400"
//           } rounded p-3 mb-2">
//             <div>
//               <span class="font-semibold ${
//                 opt.status === "Approved" ? "text-green-400" : "text-gray-500"
//               }">
//                 Option ${opt.option_no}:
//               </span> ${opt.vendor_name}
//             </div>
//             <div>Số lượng: ${opt.quantity ?? "-"}</div>
//             <div>Đơn giá: ${
//               opt.total_cost != null ? opt.total_cost.toLocaleString() : "-"
//             } VND</div>

//             <div>Ghi chú EM: ${opt.EM_Notes || "-"}</div>
//             <div>Ghi chú PO: ${opt.notes || "-"}</div>

//             <div>
//               Trạng thái:
//               <span class="px-2 py-1 rounded text-xs ${
//                 opt.status === "Approved" ? "bg-green-600" : "bg-red-600"
//               }">
//                 ${opt.status === "Approved" ? "Được chọn" : "Không được chọn"}
//               </span>
//             </div>
//           </div>
//           ${
//             opt.status === "Approved"
//               ? `<input type = "hidden" id = "optionApproved" value = ${opt.option_no} />`
//               : ""
//           }
//         `
//           )
//           .join("")}
//           <div class="mt-5">
//     <label class="block text-sm text-gray-300 mb-1">Remark:</label>
//     <textarea
//       id="remark"
//       rows="2"
//       class="w-full p-2 bg-gray-800 border border-gray-600 rounded text-gray-100"
//       placeholder="Nhập ghi chú..."
//     ></textarea>
//   </div>

//       `;

//       // Attach event listeners after HTML is set
//       document.getElementById("approveBtn").onclick = () => {
//         // 🔹 Lấy option_no của option được chọn (Approved)
//         const optionNo = document.getElementById("optionApproved").value;
//         fetch(`/api/quotations/${reqId}/confirm`, {
//           method: "PUT",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             action: "approve",
//             option_no: optionNo,
//             remark: document.getElementById("remark").value,
//           }),

//           //
//         })
//           .then((res) => res.json())
//           .then(() => {
//             closeReviewModal();
//             loadRequests("action");
//           })
//           .catch(() => showAlert("Lỗi khi phê duyệt yêu cầu", "error"));
//       };

//       document.getElementById("rejectBtn").onclick = () => {
//         const optionNo = document.getElementById("optionApproved").value;

//         fetch(`/api/quotations/${reqId}/cancel`, {
//           method: "PUT",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             action: "reject",
//             option_no: optionNo,
//             remark: document.getElementById("remark").value,
//           }),
//         })
//           .then((res) => res.json())
//           .then(() => {
//             showAlert(`Yêu cầu đã bị từ chối`, "error");
//             closeReviewModal();
//             loadRequests("action");
//           })
//           .catch(() => showAlert("Lỗi khi từ chối yêu cầu", "error"));
//       };
//     });
// }

//thêm sau nè

// Tải danh sách yêu cầu cần LM approval
async function loadLMApprovalRequests() {
  try {
    // Load tất cả requests và filter những cái có status WaitLM (đã được EM duyệt)
    const response = await fetch("/repair_requests");
    if (!response.ok) throw new Error("Không thể tải danh sách yêu cầu");

    const requests = await response.json();
    // LM chỉ thấy các request có status WaitLM (đã được EM duyệt)
    currentRequests = requests.filter(
      (request) =>
        request.Status === "WaitLM" ||
        request.Status === "Quoting" ||
        request.Status === "Rejected" ||
        request.Status === "PendingEvaluationAgain"
    );
    loadRequests("action");

    // renderRequestsTable(currentRequests);
  } catch (error) {
    console.error("Error loading requests:", error);
    showAlert("Lỗi khi tải danh sách yêu cầu: " + error.message, "error");
    showEmptyState();
  }
}
// Xử lý sự kiện modal

function showApprovalModal(id) {
  document.getElementById("approvalModal").classList.remove("hidden");

  fetch("/repair_request/api/pending_approval", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: id }),
  })
    .then((res) => {
      if (!res.ok) {
        throw new Error("Server trả về lỗi " + res.status);
      }
      return res.json();
    })
    .then((result) => {
      if (result.error) {
        alert(result.error);
        return;
      }
      // Giả sử result chứa request
      document.getElementById("currentRequestId").value = id;
      document.getElementById("requestId").textContent = id;
      document.getElementById("requestDevice").textContent = result.DeviceName;
      document.getElementById("requestLab").textContent = result.LabName;
      document.getElementById("requestRequester").textContent =
        result.RequestedBy;
      document.getElementById("requestDate").textContent = new Date(
        result.RequestDate
      ).toLocaleDateString("vi-VI");
      document.getElementById("requestStatus").textContent = result.Status;
      document.getElementById("requestDescription").textContent =
        result.Description;
      document.getElementById("requestNote").textContent =
        result.NoteByUsername;

      // Reset form
      document.getElementById("approvalForm").reset();
    })
    .catch((err) => {
      alert(`Lỗi khi gọi dữ liệu ${err}`);
    });
}

// Gửi phê duyệt LM
async function submitLMApproval() {
  const requestId = document.getElementById("currentRequestId").value;
  const action = document.querySelector('input[name="action"]:checked');
  const comment = document.getElementById("approvalComment").value;
  const approver_role = "LM";

  try {
    const response = await fetch(
      `/repair_requests/approve_requests/${requestId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: action.value,
          comment: comment.trim(),
          approver_role: approver_role,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Lỗi khi gửi phê duyệt");
    }

    const result = await response.json();
    showAlert(result.message || "Đã gửi phê duyệt thành công", "success");

    // Đóng modal và reload danh sách
    document.getElementById("approvalModal").classList.add("hidden");
    loadLMApprovalRequests();
  } catch (error) {
    console.error("Error submitting approval:", error);
    showAlert("Lỗi khi gửi phê duyệt: " + error.message, "error");
  }
}

// Hiển thị trạng thái empty
function showEmptyState() {
  document.getElementById("loadingState").classList.add("hidden");
  document.getElementById("emptyState").classList.remove("hidden");
  document.getElementById("requestsTableBody").innerHTML = "";
}
function setupModalEvents() {
  // Đóng modal
  const closeModal = () => {
    const modal = document.getElementById("approvalModal");
    modal.classList.add("hidden");
  };

  document
    .getElementById("closeApprovalModal")
    .addEventListener("click", closeModal);
  document
    .getElementById("closeApprovalModalBtn")
    .addEventListener("click", closeModal);

  // Submit approval
  document
    .getElementById("approvalForm")
    .addEventListener("submit", function (e) {
      e.preventDefault();
      submitLMApproval();
    });

  // Radio button change
  document.querySelectorAll('input[name="action"]').forEach((radio) => {
    radio.addEventListener("change", function () {
      const commentRequired = document.getElementById("commentRequired");
      if (this.value === "reject") {
        commentRequired.classList.remove("hidden");
        document.getElementById("approvalComment").required = true;
      } else {
        commentRequired.classList.add("hidden");
        document.getElementById("approvalComment").required = false;
      }
    });
  });
}

loadRequests("action");
document.addEventListener("DOMContentLoaded", function () {
  loadLMApprovalRequests();
  setupModalEvents();
});

document.getElementById("applyFilter").addEventListener("click", function () {
  loadRequests(typeTab);
});

document.getElementById("clearFilter").addEventListener("click", function () {
  resetFilterUI();
  loadRequests(typeTab);
});

// Lắng nghe sự kiện thay đổi cho decision trong modal Evaluate
document.querySelectorAll('input[name="action"]').forEach((radio) => {
  radio.addEventListener("change", function (e) {
    repairDoneCheckboxElement = document.getElementById("repairDoneCheckbox");
    if (e.target.value === "reject") {
      document.getElementById("approvalCommentRequired").textContent = "*";
      document.getElementById("approvalComment").required = true;
    } else {
      document.getElementById("approvalCommentRequired").textContent = "";
      document.getElementById("approvalComment").required = true;
    }
  });
});

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

// --------------nhóm hàm modal quotation------------------
// Hàm mở modal xem chi tiết báo giá đã duyệt
function openReviewModalView(idReq, event) {
  // Hiển thị modal view
  setTimeout(() => {
    viewModal.classList.remove("hidden");
  }, 200);
  const tr = event.target.closest("tr");
  const tdList = Array.from(tr.querySelectorAll("td"));
  const dataId = currentData.find((r) => r.id == idReq);
  if (!dataId) showAlert("Không tìm thấy yêu cầu", "error");
  const evalInfo = getEvaluationInfoFromTimeline(dataId.Timeline);
  // CẬP NHẬT IFRAME TIMELINE
  const timelineIframe = document.getElementById("timelineIframe");
  if (timelineIframe) {
    timelineIframe.src = `/static/timeline.html?request_id=${dataId.id}`;
    timelineIframe.style.height = "600px"; // Reset height
  }

  // request info
  document.getElementById("ViewModalIdReq").textContent = idReq;
  document.getElementById("viewModalDeviceReq").textContent =
    tdList[2].textContent;
  document.getElementById("viewModalRequestedByReq").textContent =
    tdList[3].textContent;
  document.getElementById("viewModalDepartmentReq").textContent =
    tdList[4].textContent;
  document.getElementById("viewModalTeamReq").textContent =
    tdList[5].textContent;
  document.getElementById("viewModalRequestDateReq").textContent =
    tdList[7].textContent;
  document.getElementById("viewModalStatusReq").innerHTML = tdList[9].innerHTML;

  document.getElementById("viewModalLabCommentReq").textContent =
    dataId.Description;
  document.getElementById("viewModalEMCommentReq").textContent = evalInfo.notes;
  document.getElementById("viewModalEMNameReq").textContent =
    evalInfo.technician;

  // reset các thẻ cần gọi api
  document.getElementById("viewModalApr").classList.add("hidden");
  document.getElementById("viewModalWaitApr").classList.add("hidden");
  document.getElementById("viewModalCancel").classList.add("hidden");

  // gọi api quotation info
  fetch(`/repair_request/api/quotation/${idReq}`)
    .then((res) => res.json())
    .then((dataQuotation) => {
      if (dataQuotation.error) {
        showAlert("Lỗi tải thông tin báo giá: " + dataQuotation.error, "error");
        return;
      }
      if (dataQuotation.quotation) {
        // xử lý aproved option
        if (
          !dataQuotation.quotation.em_apr_date ||
          !dataQuotation.quotation.lm_apr_date
        ) {
          document.getElementById("viewModalApr").classList.add("hidden");
          document
            .getElementById("viewModalWaitApr")
            .classList.remove("hidden");
          const viewModalWaitAprContent = document.getElementById(
            "viewModalWaitAprContent"
          );
          viewModalWaitAprContent.innerHTML = "";
          dataQuotation.quotation_options.forEach((opt) => {
            const table = document.createElement("table");
            table.className = "w-full mb-4 border-collapse";
            table.innerHTML = `
            <thead>
              <tr>
                <th class="text-center px-2 py-2 border border-gray-500 bg-slate-600 text-White font-bold" colspan="2">Option ${opt.option_no}</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b border-gray-700 hover:bg-gray-500">
                <td class="px-2 py-2 border border-gray-500  text-yellow-100">Vendor Name</td>
                <td class="px-2 py-2 border border-gray-500 ">${opt.vendor_name}</td>
              </tr>
               <tr class="border-b border-gray-700 hover:bg-gray-500">
                <td class="px-2 py-2 border border-gray-500  text-yellow-100">Price</td>
                <td class="px-2 py-2 border border-gray-500 ">${opt.unit_price}</td>
              </tr>
               <tr class="border-b border-gray-700 hover:bg-gray-500">
                <td class="px-2 py-2 border border-gray-500  text-yellow-100">Quotation Remark</td>
                <td class="px-2 py-2 border border-gray-500 ">${opt.quotation_note}</td>
              </tr>
            </tbody>
          `;
            viewModalWaitAprContent.appendChild(table);
          });
        } else {
          const quotationApr = dataQuotation.quotation_options.filter(
            (opt) => opt.status === "Approved"
          )[0];
          document.getElementById("viewModalApr").classList.remove("hidden");
          document.getElementById("viewModalWaitApr").classList.add("hidden");
          document.getElementById("ViewModalSupplierApr").textContent =
            quotationApr.vendor_name;
          document.getElementById("viewModalPriceApr").textContent =
            quotationApr.unit_price;
          document.getElementById("viewModalQuotationRemarkApr").textContent =
            quotationApr.quotation_note;
          document.getElementById("viewModalEMManagerRemarkApr").textContent =
            quotationApr.em_note || "";
          document.getElementById("viewModalLabManagerRemarkApr").textContent =
            quotationApr.lab_note || "";
          if (quotationApr.file_url !== null) {
            document.getElementById("viewModalFileAttachApr").innerHTML = `
      <a href="${quotationApr.file_url}" target="_blank" class="text-blue-400">
        <i class="fa-solid fa-paperclip"></i> ${quotationApr.file_url
          .split("/")
          .pop()}
      </a>
    `;
          } else {
            document.getElementById("viewModalFileAttachApr").innerHTML = "";
          }
        }
      }

      // xử lý quotation cancel
      if (!dataQuotation.history) {
        document.getElementById("viewModalCancel").classList.add("hidden");
        return;
      } else {
        document.getElementById("viewModalCancel").classList.remove("hidden");
        const cancelInfoContent = document.getElementById(
          "viewModalCancelContent"
        );
        cancelInfoContent.innerHTML = "";
        let i = 0;
        dataQuotation.history.HistoryDelete.forEach((hist) => {
          i++;
          const table = document.createElement("table");
          table.className = "w-full mb-4 border-collapse";
          table.innerHTML = `
            <thead>
              <tr>
                <th class="text-center px-2 py-2 border border-gray-500 bg-slate-600 text-White font-bold" colspan="2">Option ${i}</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b border-gray-700 hover:bg-red-100">
                <td class="px-2 py-2 border border-gray-500  text-gray-500">Vendor Name</td>
                <td class="px-2 py-2 border border-gray-500 text-gray-500 ">${hist.vendor}</td>
              </tr>
              <tr class="border-b border-gray-700 hover:bg-red-100">
                <td class="px-2 py-2 border border-gray-500  text-gray-500">Price</td>
                <td class="px-2 py-2 border border-gray-500 text-gray-500 ">${hist.Price}</td>
              </tr>
              <tr class="border-b border-gray-700 hover:bg-red-100">
                <td class="px-2 py-2 border border-gray-500  text-gray-500">Remark</td>
                <td class="px-2 py-2 border border-gray-500 text-gray-500 ">${hist.Remark}</td>
              </tr>
              <tr class="border-b border-gray-700 hover:bg-red-100">
                <td class="px-2 py-2 border border-gray-500  text-gray-500">EM Remark Hủy</td>
                <td class="px-2 py-2 border border-gray-500 text-gray-500 ">${hist.EMNote}</td>
              </tr>
              <tr class="border-b border-gray-700 hover:bg-red-100">
                <td class="px-2 py-2 border border-gray-500  text-gray-500">LM Remark Hủy</td>
                <td class="px-2 py-2 border border-gray-500 text-gray-500 ">${hist.LMNote}</td>
              </tr>

            </tbody>
        `;
          cancelInfoContent.appendChild(table);
        });
      }
    })
    .catch((err) => {
      showAlert("Lỗi tải thông tin báo giá: " + err.message, "error");
      return;
    });
}
function closeViewModal() {
  document.getElementById("viewModal").classList.add("hidden");
}
// Hàm đóng modal
function closeQuotationModal() {
  document.getElementById("approveQuotationModal").classList.add("hidden");
}
//thêm data cho radio change
document.querySelectorAll('input[name="quotationAction"]').forEach((radio) => {
  radio.addEventListener("change", function () {});
});
// Hàm mở modal
function openQuotationModal(reqId) {
  currentApproveId = reqId;
  const dataIdTable = currentData.find((d) => d.id === reqId);

  fetch(`/repair_request/api/${reqId}/quotations`)
    .then((res) => res.json())
    .then((data) => {
      document.getElementById("requestIdQuotationModal").innerText =
        dataIdTable.id;
      document.getElementById("requestDeviceQuotationModal").innerText =
        dataIdTable.DeviceName;
      document.getElementById("requestLabQuotationModal").innerText =
        dataIdTable.LabName;
      document.getElementById("requestDateQuotationModal").innerText =
        dataIdTable.RequestDate;
      document.getElementById("requestStatusQuotationModal").innerText =
        dataIdTable.Status;
      document.getElementById("requestRequesterQuotationModal").innerText =
        dataIdTable.RequestedBy;

      document.getElementById("requestDescriptionQuotationModal").innerText =
        dataIdTable.Description;

      document.getElementById("requestNoteQuotationModal").innerText =
        dataIdTable.final_em_evaluation.notes;
      document
        .getElementById("approveQuotationModal")
        .classList.remove("hidden");
    });
}

document
  .getElementById("approvalQuotationForm")
  .addEventListener("submit", function (e) {
    e.preventDefault();
  });

document.getElementById("submitActionBtn").onclick = function () {
  let selected = document.querySelector(
    'input[name="quotationAction"]:checked'
  );
  if (!selected) {
    showAlert("Bạn hãy chọn hành động!", "warning");
    return;
  }
  const remark = document.getElementById("approvalCommentQuotationModal").value;
  if (
    (selected.value === "reject" || selected.value === "replace") &&
    !remark.trim()
  ) {
    showAlert(
      "Vui lòng nhập remark khi chọn từ chối hoặc thay thế!",
      "warning"
    );
    document.getElementById("approvalCommentQuotationModal").focus();
    return;
  }
  // Mapping Status theo lựa chọn radio
  let statusValue;
  let confirmMsg = "";
  switch (selected.value) {
    case "approve":
      statusValue = waitPr; // hoặc status tương ứng
      confirmMsg = "Xác nhận đã approve báo giá xong?";
      break;
  }

  if (!confirm(confirmMsg)) return;

  fetch(`/repair_requests/${currentApproveId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      Status: statusValue,
      ChangeByUsername: username,
      NoteByUsername: remark,
    }),
  })
    .then((res) => {
      if (!res.ok) throw new Error("Server trả về lỗi " + res.status);
      return res.json();
    })
    .then((result) => {
      if (result) {
        showAlert("Đã xử lý báo giá thành công!", "success");
        closeQuotationModal();
        loadRequests(typeTab);
      } else {
        showAlert("Xử lý báo giá thất bại", "error");
      }
    })
    .catch(() => {
      showAlert("Không thể xử lý báo giá", "error");
    });
};

function getEvaluationInfoFromTimeline(timeline) {
  timeline = JSON.parse(timeline);
  if (!timeline || !Array.isArray(timeline)) {
    return {
      decision: "Chưa đánh giá",
      technician: "Chưa có",
      evaluationDate: "Chưa có",
      notes: "Không có",
    };
  }

  const filtered = timeline.filter(
    (event) => event.event === "TechnicianEvaluation"
  );

  const evaluationEvent =
    filtered.length === 0 ? null : filtered[filtered.length - 1];

  if (!evaluationEvent) {
    return {
      decision: "Chưa đánh giá",
      technician: "Chưa có",
      evaluationDate: "Chưa có",
      notes: "Không có",
    };
  }

  return {
    decision: evaluationEvent.decision,
    technician: evaluationEvent.technician_name || "Chưa có",
    evaluationDate: evaluationEvent.time,
    notes: evaluationEvent.notes || "Không có",
  };
}
// đóng modal
function closeModal() {
  viewModal.classList.add("hidden");
}
// Hàm xử lý approve disposal - ĐÃ SỬA VỚI DeviceID từ result
function submitDisposalApproval() {
  const remark = document
    .getElementById("approvalCommentDisposalModal")
    .value.trim();

  if (!remark) {
    showAlert("Vui lòng nhập remark cho việc phê duyệt thanh lý!", "warning");
    document.getElementById("approvalCommentDisposalModal").focus();
    return;
  }

  if (!confirm("Xác nhận phê duyệt thanh lý thiết bị này?")) return;

  // Hiển thị trạng thái loading
  const submitBtn = document.getElementById("submitDisposalBtn");
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
  submitBtn.disabled = true;

  // Đầu tiên: Cập nhật trạng thái repair request
  fetch(`/repair_requests/${currentApproveId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      Status: "Disposal Completed",
      ChangeByUsername: username,
      NoteByUsername: remark,
    }),
  })
    .then((res) => {
      if (!res.ok) {
        throw new Error(`Server trả về lỗi ${res.status}`);
      }
      return res.json();
    })
    .then((result) => {
      if (result) {
        if (result.DeviceID) {
          return updateDeviceStatus(result.DeviceID, "disposal")
            .then(() => {
              showAlert(
                "Đã phê duyệt thanh lý thiết bị thành công!",
                "success"
              );
              closeDisposalModal();
              loadRequests(typeTab);
            })
            .catch(() => {
              showAlert(
                "Đã phê duyệt thanh lý, nhưng có lỗi nhỏ với cập nhật thiết bị",
                "warning"
              );
              closeDisposalModal();
              loadRequests(typeTab);
            });
        } else {
          const dataIdTable = currentData.find(
            (d) => d.id === currentApproveId
          );
          if (dataIdTable && dataIdTable.DeviceID) {
            return updateDeviceStatus(dataIdTable.DeviceID, "disposal").then(
              () => {
                showAlert(
                  "Đã phê duyệt thanh lý thiết bị thành công!",
                  "success"
                );
                closeDisposalModal();
                loadRequests(typeTab);
              }
            );
          } else {
            // Nếu không có DeviceID nào
            showAlert("Đã phê duyệt thanh lý thành công!", "success");
            closeDisposalModal();
            loadRequests(typeTab);
          }
        }
      } else {
        throw new Error("Phê duyệt thanh lý thất bại");
      }
    })
    .catch((err) => {
      showAlert("Không thể phê duyệt thanh lý: " + err.message, "error");
    })
    .finally(() => {
      // Khôi phục trạng thái nút
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    });
}
// Hàm cập nhật trạng thái device
function updateDeviceStatus(deviceId, status) {
  return fetch(`/devices/${deviceId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      Status: status,
    }),
  }).then((res) => {
    if (!res.ok) {
      throw new Error("Không thể cập nhật trạng thái thiết bị");
    }
    return res.json();
  });
}
