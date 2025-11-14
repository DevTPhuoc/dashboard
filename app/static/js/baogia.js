// status var
const waitQuotation = "Wait Quotation";
const waitReQuotation = "Wait Re-Quotation";
const waitEMManagerApprovalQuotation = "Wait EM Manager's Approval Quotation";
const waitPo = "Wait PO";

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

//   const StatusFilter = document.getElementById("StatusFilter");
//   const filterButton = document.getElementById("filterButton");

//   let currentRequestId = null;
//   let currentMode = "create";

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
  filters.isQuotation = true;
  // filters.quotation = true;
  if (type === "action") {
    const statusDefautAction = [
      waitReQuotation,
      waitPo,
      waitQuotation,
    ];
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
    tableBody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-gray-400">Không có dữ liệu</td></tr>`;
    return;
  }

  // Xác định dữ liệu trang hiện tại
  const totalPages = Math.ceil(data.length / rowsPerPage);
  if (currentPage > totalPages) currentPage = 1;
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
          req.final_em_evaluation.notes || "-"
        }</td>
        <td class="text-center px-4 py-2 border border-gray-700">${
          req.lab_mn_approve_external || req.RequestDate || "-"
        }</td>
        <td class="text-center px-4 py-2 border border-gray-700">${
          req.pro_tat || "-"
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

// Hàm Xác định màu trạng thái
function renderStatus(Status) {
  switch (Status) {
    case waitQuotation:
      return `<span class="px-2 py-1 rounded bg-blue-600  text-xs w-full inline-block">${Status}</span>`;
    case waitEMManagerApprovalQuotation:
      return `<span class="px-2 py-1 rounded bg-yellow-600 text-xs w-full inline-block">${Status}</span>`;
    case waitPo:
      return `<span class="px-2 py-1 rounded bg-purple-600 text-xs w-full inline-block">${Status}</span>`;
    case waitReQuotation:
      return `<span class="px-2 py-1 rounded bg-red-600 text-xs w-full inline-block">${Status}</span>`;
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

  if (req.Status === waitQuotation) {
    btnActions += `<button data-id="${req.id}" onclick="confirmDoneQuotation(${req.id}, this)" data-mode="create" class="action-btn bg-blue-600 hover:bg-blue-500 px-2 py-1 rounded ml-2" title="Send Quotation">
                 <i class="fa-solid fa-money-bill-wheat"></i>
              </button>`;
  }

  if (req.Status === waitEMManagerApprovalQuotation) {
    btnActions += `<button data-id="${req.id}" data-mode="update" class="action-btn bg-yellow-600 hover:bg-yellow-500 px-2 py-1 rounded ml-2" title="update">
              <i class="fa-regular fa-pen-to-square"></i>
              </button>`;
  }
  if (req.Status === waitReQuotation) {
    btnActions += `<button data-id="${req.id}" onclick="confirmDoneQuotation(${req.id}, this)" data-mode="create" class="action-btn bg-red-600 hover:bg-red-500 px-2 py-1 rounded ml-2" title="Resend Quotation">
                 <i class="fa-solid fa-money-bill-wheat"></i>
              </button>`;
  }

  if (req.Status === waitPo) {
    btnActions += `<button onclick="openPOModal('${req.id}')"
                title="Tạo PO"
                class="px-3 py-1 text-sm bg-purple-600 hover:bg-purple-500 rounded text-white ml-2 ">
                <i class="fas fa-file-invoice"></i> </button>`;
  }

  return btnActions;
}

// --------------Khối hàm xử lý modal báo giá----------------
// Mở popup layout modal
// function openModal(mode = "create", options = []) {
//   renderOptionBlocks(options);
//   currentMode = mode;
//   saveButtonModal.dataset.mode = mode;
//   deleteQuoteBtnModal.style.display =
//     mode === "update" ? "inline-flex" : "none";

//   modal.classList.remove("hidden");
//   setTimeout(() => {
//     modalContent.classList.remove("opacity-0", "scale-95");
//     modalContent.classList.add("opacity-100", "scale-100");
//   }, 10);
// }
//bỏ nhập quotation và chuyển lại thành cập nhật trạng thái
function confirmDoneQuotation(id, btn) {
  if (!confirm("Xác nhận đã gửi báo giá xong?")) return;
  fetch(`/repair_requests/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      Status: waitEMManagerApprovalQuotation,
      ChangeByUsername: username,
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
        showAlert("Xác nhận đã gửi báo giá thành công!", "success");
        btn.closest("tr").remove();
      } else {
        showAlert("Xác nhận đã gửi báo giá thất bại", "error");
      }
    })
    .catch((err) => {
      showAlert("Không thể xác nhận gửi báo giá", "error");
    });
}
// render option trong modal
// function renderOptionBlocks(options = []) {
//   const container = document.getElementById("quoteOptions");
//   container.innerHTML = "";

//   if (options.length === 0) options = [{}];

//   options.forEach((opt, idx) => {
//     const block = document.createElement("div");
//     block.className = "option-block border border-gray-700 rounded-lg p-4 mb-3";
//     block.innerHTML = `
//         <input type="hidden" class="optionIdHidden" value="${
//           opt.option_id || ""
//         }"/>
//         <div class="flex justify-between items-center mb-2">
//           <h4 class="font-semibold text-blue-400">Option <span class="option-no">${
//             idx + 1
//           }</span></h4>
//           <button type="button" onclick="deleteOption(this)" class="text-red-400 hover:text-red-600">
//             <i class="fas fa-trash"></i>
//           </button>
//         </div>
//         <div>
//           <label class="block mb-1 text-sm">Supplier</label>
//           <input type="text" value="${
//             opt.vendor_name || ""
//           }" class="vendorInput w-full p-2 rounded bg-gray-800 border border-gray-700 text-white"/>
//         </div>
//         <div class="grid grid-cols-2 gap-4 mt-2">
//           <div>
//             <label class="block mb-1 text-sm">Unit (VND)</label>
//             <input type="number" min="0" value="${
//               opt.unit_price || 0
//             }" class="unitPriceInput w-full p-2 rounded bg-gray-800 border border-gray-700 text-white"/>
//           </div>
//           <div>
//             <label class="block mb-1 text-sm">File Attachment</label>
//             <input type="file" class="fileInput w-full p-2 rounded bg-gray-800 border border-gray-700 text-white"/>
//             <input type="hidden" value="${
//               opt.file_url || ""
//             }" class="fileUrlHidden"/>
//             ${
//               opt.file_url
//                 ? `<a  href="${opt.file_url}" target="_blank" class="text-blue-400">Xem file</a>
//                 <button  onclick="clearFileAttach(this)" class="ml-1" title="Clear File"><i class="fa-solid fa-xmark px-1 py-1 bg-red-500"></i></button>
//       `
//                 : ""
//             }
//           </div>
//         </div>
//         <div class="mt-2">
//           <label class="block mb-1 text-sm">Remark</label>
//           <input type="text" value="${
//             opt.notes || ""
//           }" class="notesInput w-full p-2 rounded bg-gray-800 border border-gray-700 text-white"/>
//         </div>
//       `;
//     container.appendChild(block);
//   });
// }

// đóng modal
function closeModal() {
  modal.classList.add("hidden");
  viewModal.classList.add("hidden");
}

// xóa file attach
function clearFileAttach(btn) {
  const div = btn.closest("div");
  div.querySelector("a").remove();
  div.querySelector(".fileUrlHidden").value = "";
  btn.classList.add("hidden");
}

// Lưu dữ liệu trong modal
saveButtonModal.addEventListener("click", function () {
  if (!currentRequestId) return;

  const formData = new FormData();
  const blocks = document.querySelectorAll("#quoteOptions .option-block");
  let hasError = false;
  blocks.forEach((block, idx) => {
    const optionId = block.querySelector(".optionIdHidden").value;
    const vendorName = block.querySelector(".vendorInput").value.trim();
    const unitPrice = Number(block.querySelector(".unitPriceInput").value);
    const notes = block.querySelector(".notesInput").value.trim();
    const fileInput = block.querySelector(".fileInput");
    const fileUrlHidden = block.querySelector(".fileUrlHidden");

    if (optionId) formData.append(`options[${idx}][option_id]`, optionId);
    if (vendorName !== "" && unitPrice >= 0) {
      formData.append(`options[${idx}][vendor_name]`, vendorName);
      formData.append(`options[${idx}][unit_price]`, unitPrice);
      formData.append(`options[${idx}][notes]`, notes);
      if (fileInput && fileInput.files.length > 0) {
        formData.append(`options[${idx}][file]`, fileInput.files[0]);
      } else if (fileUrlHidden && fileUrlHidden.value) {
        formData.append(`options[${idx}][file_url]`, fileUrlHidden.value);
      }
    } else {
      showAlert(
        "Vui lòng điền đầy đủ thông tin vendor name cho tất cả phương án",
        "error"
      );
      hasError = true;
    }
  });

  if (hasError) return;
  let apiUrl =
    currentMode === "update"
      ? `/repair_request/api/${currentRequestId}/quotations/update`
      : `/repair_request/api/${currentRequestId}/quote`;

  fetch(apiUrl, {
    method: currentMode === "update" ? "PUT" : "POST",
    body: formData,
  })
    .then((res) => res.json())
    .then(() => {
      closeModal();
      loadRequests(typeTab);
      showAlert("Gửi báo giá thành công!", "success");
    })
    .catch((err) => showAlert("Lỗi gửi báo giá: " + err.message, "error"));
});

// Nút xóa trong modal
deleteQuoteBtnModal.addEventListener("click", function () {
  if (!currentRequestId) return;
  if (!confirm("Bạn có chắc chắn muốn xoá báo giá này?")) return;

  fetch(`/repair_request/api/${currentRequestId}/quotations/delete`, {
    method: "DELETE",
  })
    .then((res) => res.json())
    .then(() => {
      closeModal();
      loadRequests(typeTab);
    });
});

// Click hành động
tableBody.addEventListener("click", function (e) {
  const btn = e.target.closest(".action-btn");
  if (!btn) return;
  currentRequestId = btn.dataset.id;
  currentMode = btn.dataset.mode;
  if (currentMode === "update") {
    fetch(`/repair_request/api/${currentRequestId}/quotations`)
      .then((res) => res.json())
      .then((data) => {
        openModal("update", data.options || []);
      });
  } else {
    openModal("create");
  }
});

// Xoá option
function deleteOption(btn) {
  const block = btn.closest(".option-block");
  const optionId = block.querySelector(".optionIdHidden").value;

  if (optionId) {
    if (!confirm("Bạn có chắc chắn muốn xoá phương án này?")) return;
    fetch(`/repair_request/api/quotation-options/${optionId}/delete`, {
      method: "DELETE",
    })
      .then((res) => res.json())
      .then(() => {
        block.remove();
        document
          .querySelectorAll("#quoteOptions .option-block")
          .forEach((el, idx) => {
            el.querySelector(".option-no").textContent = idx + 1;
          });
      });
  } else {
    block.remove();
    document
      .querySelectorAll("#quoteOptions .option-block")
      .forEach((el, idx) => {
        el.querySelector(".option-no").textContent = idx + 1;
      });
  }
}

// Thêm option mới
document.getElementById("addOptionBtn").addEventListener("click", function () {
  const container = document.getElementById("quoteOptions");
  const blockCount = container.querySelectorAll(".option-block").length;
  const block = document.createElement("div");
  block.className = "option-block border border-gray-700 rounded-lg p-4 mb-3";
  block.innerHTML = `
    <input type="hidden" class="optionIdHidden" value=""/>
    <div class="flex justify-between items-center mb-2">
      <h4 class="font-semibold text-blue-400">Option <span class="option-no">${
        blockCount + 1
      }</span></h4>
      <button type="button" onclick="deleteOption(this)" class="text-red-400 hover:text-red-600">
        <i class="fas fa-trash"></i>
      </button>
    </div>
    <div>
      <label class="block mb-1 text-sm">Supplier</label>
      <input type="text" class="vendorInput w-full p-2 rounded bg-gray-800 border border-gray-700 text-white"/>
    </div>
    <div class="grid grid-cols-2 gap-4 mt-2">
      <div>
        <label class="block mb-1 text-sm">Unit(VND)</label>
        <input type="number" min="0" value="0" class="unitPriceInput w-full p-2 rounded bg-gray-800 border border-gray-700 text-white"/>
      </div>
      <div>
        <label class="block mb-1 text-sm">File Attachment</label>
        <input type="file" class="fileInput w-full p-2 rounded bg-gray-800 border border-gray-700 text-white"/>
        <input type="hidden" value="" class="fileUrlHidden"/>
      </div>
    </div>
    <div class="mt-2">
      <label class="block mb-1 text-sm">Remark</label>
      <input type="text" class="notesInput w-full p-2 rounded bg-gray-800 border border-gray-700 text-white"/>
    </div>
  `;
  container.appendChild(block);
});

// ---------------Nhóm nhàm xử lý PO----------------
//Gọi Modal tạo PO
function openPOModal(requestId) {
  const modal = document.createElement("div");
  modal.className =
    "fixed inset-0 z-50 flex items-center justify-center bg-black/60";
  modal.innerHTML = `
      <div class="relative bg-gray-900 rounded-xl p-6 w-full max-w-md">
        <button onclick="this.closest('.fixed').remove()"
                class="absolute top-3 right-3 text-gray-400 hover:text-white px-3 py-2 bg-red-500 rounded">
          <i class="fas fa-times"></i>
        </button>
        <h3 class="text-lg font-semibold text-blue-400 mb-4">
          Add PO for Request #${requestId}
        </h3>
        <form id="poForm" class="space-y-4">
          <div>
            <label class="block text-sm mb-1 text-gray-300">PO_NO</label>
            <input type="text" id="po_no" name="po_no"
                  class="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:ring focus:ring-blue-500"
                  required />
          </div>
          <div>
            <label class="block text-sm mb-1 text-gray-300">Delivery Date</label>
            <input type="date" id="delivery_date" name="delivery_date"
                  class="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:ring focus:ring-blue-500"
                  required />
          </div>
          <div>
            <label class="block text-sm mb-1 text-gray-300">Note</label>
            <textarea id="note" name="note" rows="3"
                      class="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:ring focus:ring-blue-500"></textarea>
          </div>
          <button type="submit"
                  class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
            Save
          </button>
        </form>
      </div>
    `;
  document.body.appendChild(modal);

  // Bắt sự kiện submit
  document.getElementById("poForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const po_no = document.getElementById("po_no").value.trim();
    const delivery_date = document.getElementById("delivery_date").value.trim();
    const note = document.getElementById("note").value.trim();

    if (!po_no) {
      showAlert("PO_NO không được để trống", "error");
      return;
    }

    if (!delivery_date) {
      showAlert("Delivery Date không được để trống", "error");
      return;
    }

    // Gọi trực tiếp API waitpo với requestId
    fetch(`/quote_option/${requestId}/waitpo`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        PO_no: po_no,
        Delivery: delivery_date,
        note: note,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          showAlert("Lỗi: " + data.error, "error");
        } else {
          showAlert("Tạo PO thành công!", "success");
          modal.remove();
          loadRequests(typeTab);
        }
      })
      .catch((err) => {
        console.error("Lỗi khi tạo PO:", err);
        showAlert("Không thể tạo PO", "error");
      });
  });
}
// ----------------Nhóm hàm xử lý filter----------------
document.getElementById("applyFilter").addEventListener("click", function () {
  loadRequests(typeTab);
});

document.getElementById("clearFilter").addEventListener("click", function () {
  resetFilterUI();
  loadRequests(typeTab);
});

// Hàm mở modal xem chi tiết báo giá đã duyệt
function openReviewModal(idReq, event) {
  // Hiển thị modal view
  setTimeout(() => {
    viewModal.classList.remove("hidden");
  }, 200);
  const tr = event.target.closest("tr");
  const tdList = Array.from(tr.querySelectorAll("td"));
  const dataId = currentData.find((r) => r.id == idReq);
  if (!dataId) showAlert("Không tìm thấy yêu cầu", "error");
  const evalInfo = getEvaluationInfoFromTimeline(dataId.Timeline);

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
  // CẬP NHẬT IFRAME TIMELINE
  const timelineIframe = document.getElementById("timelineIframe");
  if (timelineIframe) {
    timelineIframe.src = `/static/timeline.html?request_id=${dataId.id}`;
    timelineIframe.style.height = "600px"; // Reset height
  }

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

// show alert
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
