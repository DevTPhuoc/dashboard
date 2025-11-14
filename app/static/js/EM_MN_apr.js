// status
const waitEmManagerAprExternal = "Wait EM Manager's Approval External";
const waitEmManagerAprQuotation = "Wait EM Manager's Approval Quotation";
const waitLmManagerAprQuotation = "Wait LM Manager's Approval Quotation";
const waitReQuotation = "Wait Re-Quotation";
const waitEmManagerReAprQuotation = "Wait EM Manager's Re-Approval Quotation";
const waitEmRevaluation = "Wait EM Re-Evaluation";
const waitLmDisposal="Wait LM Manager's Disposal"
// Modal elements
const viewModal = document.getElementById("viewModal");
// Tabs
typeTab = "action";
let currentQuotationId = null;
let currentData = [];
let currentPage = 1;
const rowsPerPage = 12;
// const tabPending = document.getElementById("tab-pending");
const tabBtn = document.getElementById("tabBtn");
const tabRejected = document.getElementById("tab-rejected");
const contentPending = document.getElementById("content-pending");
const contentApproved = document.getElementById("content-approved");
const tableBody = document.getElementById("pendingTableBody");
const approveBtn = document.getElementById("submitApprovalBtnReviewModal");
const rejectBtn = document.getElementById("RejectBtnReviewModal");

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
    // THÊM DÒNG NÀY - Load data ngay khi click tab
    loadRequests(typeTab);
  });
});

function openViewModal(reqId) {
  // Tạo modal
  const modal = document.createElement("div");
  modal.className =
    "fixed inset-0 z-50 flex items-center justify-center bg-black/60";

  modal.innerHTML = `
    <div class="bg-gray-900 rounded-xl shadow-xl w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto transform transition-all duration-200">
      <div class="flex justify-between items-center border-b border-gray-700 pb-3 mb-4">
        <h3 class="text-lg font-semibold">Chi tiết báo giá #${reqId}</h3>
        <button id="closeViewModal" class="text-gray-400 hover:text-white p-1 rounded">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div id="viewBody" class="space-y-3 text-gray-300">Đang tải...</div>
    </div>
  `;

  document.body.appendChild(modal);
  //open view nút duyệt EM

  // Animation vào
  setTimeout(() => {
    const content = modal.querySelector("div > div");
  }, 10);

  // Đóng modal
  modal
    .querySelector("#closeViewModal")
    .addEventListener("click", () => modal.remove());

  // Load chi tiết báo giá
  fetch(`/repair_request/api/${reqId}/quotations`)
    .then((res) => res.json())
    .then((data) => {
      const viewBody = modal.querySelector("#viewBody");
      viewBody.innerHTML = "";

      // if (!data.options || data.options.length === 0) {
      //   viewBody.textContent = "Không có phương án báo giá nào.";
      //   return;
      // }

      data.options.forEach((opt, idx) => {
        const div = document.createElement("div");
        div.className = "border border-gray-700 rounded p-3 bg-gray-800";
        div.innerHTML = `
          <div class="font-semibold text-blue-400 mb-1">Option ${idx + 1}: ${
          opt.vendor_name
        }</div>
          <div>Đơn giá: <span class="font-medium">${opt.unit_price.toLocaleString()} VND</span></div>
          ${
            opt.file_url
              ? `<a href="${opt.file_url}" target="_blank" class="text-indigo-400 underline hover:text-indigo-300">Xem file</a>`
              : `<span class="text-gray-500">(Không có file đính kèm)</span>`
          }
          <div>Trạng thái: <span class="${
            opt.status === "cancelled" ? "text-red-500" : "text-green-400"
          } font-semibold">${opt.status}</span></div>
        `;
        viewBody.appendChild(div);
      });
    });
}

// Modal
const reviewModal = document.getElementById("reviewModal");
const reviewContent = document.getElementById("reviewContent");



function openReviewModal(reqId, quotationId) {
  currentQuotationId = quotationId;
  const dataIdTable = currentData.find((d) => d.id === reqId);
  // THÊM: Reset conditional fields
    document.querySelectorAll('input[name="quotationAction"]').forEach(radio => {
        radio.checked = false;
    });
    document.querySelectorAll('input[name="rejectAction"]').forEach(radio => {
        radio.checked = false;
    });
    document.getElementById('rejectOptions').classList.add('hidden');
    document.getElementById('disposalFileUpload').classList.add('hidden');
    document.getElementById('fileName').textContent = 'No file chosen';
    document.getElementById('disposalFile').value = '';
    document.getElementById('approvalCommentReviewModal').value = '';
  document.getElementById("currentRequestIdReviewModal").value = reqId;

  fetch(`/repair_request/api/${reqId}/quotations`)
    .then((res) => res.json())
    .then((data) => {
      document.getElementById("requestIdReviewModal").innerText =
        dataIdTable.id;
      document.getElementById("requestDeviceReviewModal").innerText =
        dataIdTable.DeviceName;
      document.getElementById("requestLabReviewModal").innerText =
        dataIdTable.LabName;
      document.getElementById("requestDateReviewModal").innerText =
        dataIdTable.RequestDate;
      document.getElementById("requestStatusReviewModal").innerText =
        dataIdTable.Status;
      document.getElementById("requestRequesterReviewModal").innerText =
        dataIdTable.RequestedBy;

      document.getElementById("requestDescriptionReviewModal").innerText =
        dataIdTable.Description;

      document.getElementById("requestNoteReviewModal").innerText =
        dataIdTable.final_em_evaluation.notes;
      reviewModal.classList.remove("hidden");
    });
}

function closeReviewModal() {
  reviewModal.classList.add("hidden");
}

document
  .getElementById("quotationModalForm")
  .addEventListener("submit", function (e) {
    e.preventDefault();
  });
document.getElementById("submitActionBtn").onclick = async function () {
    let selected = document.querySelector(
        'input[name="quotationAction"]:checked'
    );
    if (!selected) {
        showAlert("Bạn hãy chọn hành động!", "warning");
        return;
    }

    const remark = document.getElementById("approvalCommentReviewModal").value;
    
    // LẤY requestId một cách an toàn
    const requestIdInput = document.getElementById("currentRequestIdReviewModal");
    const requestId = parseInt(requestIdInput.value);
    
    if (isNaN(requestId)) {
        showAlert("ID yêu cầu không hợp lệ!", "error");
        return;
    }
    
    // Validation cho reject action
    if (selected.value === "reject") {
        const rejectAction = document.querySelector('input[name="rejectAction"]:checked');
        if (!rejectAction) {
            showAlert("Vui lòng chọn lựa chọn từ chối!", "warning");
            return;
        }
        
        // Kiểm tra file disposal nếu chọn disposal
        if (rejectAction.value === "disposal") {
            const disposalFile = document.getElementById("disposalFile").files[0];
            if (!disposalFile) {
                showAlert("Vui lòng đính kèm file tài liệu disposal!", "warning");
                return;
            }
            
            // Upload file disposal trước
            const fileUploadSuccess = await uploadDisposalFile(requestId, disposalFile);
            if (!fileUploadSuccess) {
                showAlert("Lỗi khi upload file disposal!", "error");
                return;
            }
        }
        
        if (!remark.trim()) {
            showAlert("Vui lòng nhập remark khi từ chối!", "warning");
            document.getElementById("approvalCommentReviewModal").focus();
            return;
        }
    }

    // Validation cho approve action
    if (selected.value === "approve" && !remark.trim()) {
        showAlert("Vui lòng nhập remark khi approve!", "warning");
        document.getElementById("approvalCommentReviewModal").focus();
        return;
    }

    // Mapping Status theo lựa chọn radio
    let statusValue;
    let confirmMsg = "";
    switch (selected.value) {
        case "approve":
            statusValue = waitLmManagerAprQuotation;
            confirmMsg = "Xác nhận đã approve báo giá xong?";
            break;
        case "reject":
            const rejectType = document.querySelector('input[name="rejectAction"]:checked').value;
            if (rejectType === "internalrepair") {
                statusValue = waitEmRevaluation;
                confirmMsg = "Bạn chắc chắn từ chối và chuyển sang sửa chữa nội bộ?";
            } else if (rejectType === "disposal") {
                statusValue = waitLmDisposal;
                confirmMsg = "Bạn chắc chắn từ chối và xử lý disposal?";
            }
            break;
    }

    if (!confirm(confirmMsg)) return;

    const requestData = {
        'Status': statusValue,
        'ChangeByUsername': username,
        'NoteByUsername': remark
    };
    
    if (selected.value === "reject") {
        const rejectAction = document.querySelector('input[name="rejectAction"]:checked').value;
        requestData['RejectType'] = rejectAction;
    }

    // Hiển thị loading
    const submitBtn = document.getElementById("submitActionBtn");
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
    submitBtn.disabled = true;

    // SỬA: Sử dụng requestId đã được validate
    fetch(`/repair_requests/${requestId}`, {
        method: "PUT",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
    })
    .then((res) => {
        if (!res.ok) throw new Error("Server trả về lỗi " + res.status);
        return res.json();
    })
    .then((result) => {
        if (result) {
            showAlert("Đã xử lý báo giá thành công!", "success");
            closeReviewModal();
            loadRequests(typeTab);
        } else {
            showAlert("Xử lý báo giá thất bại", "error");
        }
    })
    .catch((err) => {
        console.error('API Error:', err);
        showAlert("Không thể xử lý báo giá: " + err.message, "error");
    })
    .finally(() => {
        // Khôi phục trạng thái nút
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    });
};
// Các hàm JavaScript giữ nguyên như trước
async function uploadDisposalFile(requestId, file) {
    try {
        // ĐẢM BẢO requestId là số, không phải đối tượng HTML
        const reqId = parseInt(requestId);
        if (isNaN(reqId)) {
            console.error('Invalid request ID:', requestId);
            return false;
        }

        const formData = new FormData();
        formData.append('disposal_file', file);
        
        // SỬA URL - sử dụng reqId đã được validate
        const response = await fetch(`/repair_request/api/repair_requests/${reqId}/disposal_document`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        return result.success;
        
    } catch (error) {
        console.error('Error uploading disposal file:', error);
        return false;
    }
}
function loadDisposalDocument(requestId) {
    fetch(`/repair_requests/api/repair_requests/${requestId}/disposal_document`)
        .then(res => res.json())
        .then(disposalData => {
            if (disposalData.exists !== false && disposalData.file_path) {
                // Hiển thị disposal document
                const disposalSection = document.createElement('details');
                disposalSection.className = 'bg-gray-800 rounded p-4 border border-yellow-600 mt-4';
                disposalSection.innerHTML = `
                    <summary class="font-semibold text-yellow-400 cursor-pointer mb-2">
                        <i class="fas fa-trash-alt"></i> Disposal Documentation
                    </summary>
                    <div class="mt-3 space-y-2">
                        <div class="flex items-center gap-3">
                            <a href="${disposalData.file_url}" 
                               target="_blank" 
                               class="text-blue-400 hover:text-blue-300 flex items-center gap-2">
                                <i class="fas fa-file-download"></i>
                                ${disposalData.file_name}
                            </a>
                            <span class="text-gray-400 text-sm">
                                Uploaded: ${new Date(disposalData.upload_date).toLocaleDateString()}
                            </span>
                        </div>
                        <div class="text-sm text-gray-300">
                            <p><strong>Rejection Type:</strong> ${disposalData.rejection_type}</p>
                            <p><strong>Device Status:</strong> <span class="text-red-400">Disposal</span></p>
                            ${disposalData.remark ? `<p><strong>Remark:</strong> ${disposalData.remark}</p>` : ''}
                        </div>
                    </div>
                `;
                document.getElementById('viewModalBody').appendChild(disposalSection);
            }
        })
        .catch(err => console.error('Error loading disposal document:', err));
}
setupFilter(
  "departmentFilter",
  "departmentChecklistContent",
  "/api/get_department"
);
setupFilter("teamFilter", "teamChecklistContent", "/api/get_team");
setupFilter("statusFilter", "statusChecklistContent", "/api/get_dic_status");
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

function openApprovalModal(id) {
  document.getElementById("approvalModal").classList.remove("hidden");
  postDataModalApproval(id);
}

function closeApprovalModal() {
  document.getElementById("approvalModal").classList.add("hidden");
}

function postDataModalApproval(id) {
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
        showAlert(result.error, "error");
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
      showAlert(`Lỗi khi gọi dữ liệu ${err}`, "error");
    });
}
//viết hàm xử lý nút id="submitApprovalBtn"
//handleApprovalClick

document
  .getElementById("approvalForm")
  .addEventListener("submit", function (e) {
    e.preventDefault();
    handleApprovalClick();
  });

async function handleApprovalClick() {
  const currentRequestId = document.getElementById("currentRequestId").value;
  if (!currentRequestId) {
    showAlert("Không tìm thấy ID yêu cầu", "danger");
    return;
  }

  const action = document.querySelector('input[name="action"]:checked')?.value;
  const comment = document.getElementById("approvalComment")?.value.trim();

  if (action === "reject" && !comment) {
    showAlert("Vui lòng nhập lý do từ chối", "danger");
    return;
  }

  const approvalData = {
    action: action,
    comment: comment.trim(),
    approver_role: "EM",
  };

  // Hiển thị loading
  const submitBtn = document.getElementById("submitApprovalBtn");
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
  submitBtn.disabled = true;

  try {
    const response = await fetch(
      `/repair_requests/approve_requests/${currentRequestId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(approvalData),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Lỗi không xác định");
    }

    const result = await response.json();

    // Hiển thị thông báo
    let message =
      action === "approve"
        ? "Đã phê duyệt yêu cầu. Chuyển LM để duyệt tiếp."
        : "Đã từ chối yêu cầu.";

    showAlert(message, "success");
    // Tải lại danh sách yêu cầu
    loadRequests(typeTab);
    closeApprovalModal();
  } catch (error) {
    console.error("Error submitting approval:", error);
    showAlert("Không thể gửi phê duyệt: " + error.message, "danger");
  } finally {
    // Khôi phục trạng thái nút
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }
}

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

// tab
function renderStatus(Status) {
  switch (Status) {
    case waitEmManagerAprQuotation:
      return `<span class="px-2 py-1 rounded bg-yellow-600  text-sm w-full inline-block">${Status}</span>`;
    case waitEmManagerAprExternal:
      return `<span class="px-2 py-1 rounded bg-blue-600  text-sm w-full inline-block">${Status}</span>`;
    case waitEmManagerReAprQuotation:
      return `<span class="px-2 py-1 rounded bg-red-600  text-sm w-full inline-block">${Status}</span>`;
    default:
      return `<span class="px-2 py-1 rounded bg-gray-600  text-sm w-full inline-block">${Status}</span>`;
  }
}

function renderActions(req, type = "all") {
  let btnActions = `<button
    class="bg-cyan-500 hover:bg-cyan-500 text-white p-1 rounded"
    onclick="openReviewModalView(${req.id}, event)"
    title="Xem chi tiết"
  >
    <i class="fas fa-eye"></i>
  </button>`;

  if (type === "all") return btnActions;

  if (req.Status === waitEmManagerReAprQuotation) {
    btnActions += `<button onclick="openReviewModal(${req.id},'${req.quotation_id}')"
                title="Gửi lại báo giá"
                class="px-3 py-1 text-sm bg-red-600 hover:bg-red-500 rounded text-white font-bold ml-2 ">
                <i class="fas fa-file-invoice"></i> </button>`;
  }

  if (req.Status === waitEmManagerAprQuotation) {
    btnActions += `<button onclick="openReviewModal(${req.id},'${req.quotation_id}')"
                title="Duyệt báo giá"
                class="px-3 py-1 text-sm bg-yellow-600  hover:bg-yellow-500 rounded text-white font-bold ml-2 ">
                <i class="fas fa-file-invoice"></i> </button>`;
  }
  if (req.Status === waitEmManagerAprExternal) {
    btnActions += `<button onclick="openApprovalModal(${req.id})"
                title="Duyệt yêu cầu"
                class="approve-btn px-3 py-1 text-sm bg-blue-600 hover:bg-blue-500 rounded text-white font-bold ml-2 ">
                <i class="fas fa-check"></i> </button>`;
  }

  return btnActions;
}

document.querySelectorAll(".approve-btn").forEach((btn) => {
  btn.addEventListener("click", function () {
    const requestId = this.dataset.requestId;
    showApprovalModal(requestId);
  });
});
// Form events

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
  // filters.quotation = true;
  if (type === "action") {
    const statusDefautAction = [
      waitEmManagerAprQuotation,
      waitEmManagerReAprQuotation,
      waitEmManagerAprExternal,
    ];

    if (filters.status.length === 0) {
      filters.status = statusDefautAction;
    } else {
      filters.status = filters.status.filter(s => statusDefautAction.includes(s));
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
function renderTable(data, type) {
  tableBody.innerHTML = "";
  // Nếu dữ liệu rỗng
  if (data.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-gray-400">No data response</td></tr>`;
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
  <span class="${req.Priority === "Priority" ? "inline-block bg-green-500 px-2 py-1 text-white rounded text-sm" : ""}">
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
function renderPagination(total) {
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";
  const totalPages = Math.ceil(total / rowsPerPage);

  if (currentPage > totalPages) {
    currentPage = 1;
  }

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
    downloadExcel("EM Manager " + typeTab + ".xlsx");
  });
  pagination.appendChild(exportBtn);
}

// Hàm tải dữ liệu excel từ curentData
function downloadExcel(fileName) {
  const worksheet = XLSX.utils.json_to_sheet(currentData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Detail");
  XLSX.writeFile(workbook, fileName || "EM Manager Detail.xlsx");
}

//load action
document.addEventListener("DOMContentLoaded", function () {
  const firstTab = document
    .querySelector(".tabBtn[data-target='action']")
    .click("typeTab");
});

document.getElementById("applyFilter").addEventListener("click", () => {
  loadRequests(typeTab);
});

document.getElementById("clearFilter").addEventListener("click", function () {
  resetFilterUI();
  loadRequests(typeTab);
});

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

document.addEventListener("DOMContentLoaded", function () {
  const firstTab = document
    .querySelector(".tabBtn[data-target='action']")
    .click("typeTab");
});
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
    tdList[6].textContent;
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
