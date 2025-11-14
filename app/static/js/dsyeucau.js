// File: dsyeucau.js

class RepairRequestManager {
  constructor() {
    this.currentPage = 1;
    this.itemsPerPage = 10;
    this.currentFilters = { status: "all" };

    this.init();
  }

  init() {
    this.bindEvents();
    this.loadLabs();
    this.loadRepairRequests(this.currentFilters);
  }

  bindEvents() {
    // Filter events
    document.getElementById("applyFilters").addEventListener("click", () => {
      this.applyFilters();
    });

    document.getElementById("searchInput").addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.applyFilters();
    });

    document.getElementById("searchButton").addEventListener("click", () => {
      this.applyFilters();
    });

    // Clear search button
    document.getElementById("clearSearchBtn").addEventListener("click", () => {
      document.getElementById("searchInput").value = "";
      this.applyFilters();
    });

    // Status filter buttons
    document.querySelectorAll(".filter-status").forEach((button) => {
      button.addEventListener("click", (e) => {
        // Remove active class from all buttons
        document.querySelectorAll(".filter-status").forEach((btn) => {
          btn.classList.remove("active", "bg-blue-600");
          btn.classList.add("bg-gray-700");
        });

        // Add active class to clicked button
        e.target.classList.add("active", "bg-blue-600");
        e.target.classList.remove("bg-gray-700");

        this.applyFilters();
      });
    });

    // Create request button
    document
      .getElementById("createRequestBtn")
      .addEventListener("click", () => {
        alert("Chức năng tạo yêu cầu mới sẽ được triển khai sau!");
      });

    // Modal events
    document
      .getElementById("closeDetailModal")
      .addEventListener("click", () => {
        this.hideModal("detailModal");
      });

    document
      .getElementById("closeDetailModalBtn")
      .addEventListener("click", () => {
        this.hideModal("detailModal");
      });

    document
      .getElementById("closeStatusModal")
      .addEventListener("click", () => {
        this.hideModal("statusModal");
      });

    document
      .getElementById("closeStatusModalBtn")
      .addEventListener("click", () => {
        this.hideModal("statusModal");
      });

    document.getElementById("saveStatus").addEventListener("click", () => {
      this.saveStatusUpdate();
    });

    document.getElementById("printDetail").addEventListener("click", () => {
      window.print();
    });

    // Close modals when clicking outside
    document
      .getElementById("detailModalOverlay")
      .addEventListener("click", () => {
        this.hideModal("detailModal");
      });

    document
      .getElementById("statusModalOverlay")
      .addEventListener("click", () => {
        this.hideModal("statusModal");
      });
  }

  showModal(modalId) {
    const modal = document.getElementById(modalId);
    const content = document.getElementById(modalId + "ContentWrapper");

    modal.classList.remove("hidden");
    setTimeout(() => {
      content.style.transform = "scale(1)";
      content.style.opacity = "1";
    }, 10);
  }

  hideModal(modalId) {
    const modal = document.getElementById(modalId);
    const content = document.getElementById(modalId + "ContentWrapper");

    content.style.transform = "scale(0.95)";
    content.style.opacity = "0";

    setTimeout(() => {
      modal.classList.add("hidden");
    }, 200);
  }

  // Hàm tính TAT (số ngày xử lý)
  calculateTAT(startDate) {
    try {
      const start = new Date(startDate);
      const now = new Date();
      const diffTime = Math.abs(now - start);
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch (error) {
      console.error("Error calculating TAT:", error);
      return 0;
    }
  }

  // Load danh sách lab từ API
  loadLabs() {
    fetch("/labs")
      .then((r) => {
        if (!r.ok) {
          throw new Error(`HTTP error! status: ${r.status}`);
        }
        return r.json();
      })
      .then((labs) => {
        const labFilter = document.getElementById("labFilter");
        // Giữ option "Tất cả Lab"
        labFilter.innerHTML = '<option value="">Tất cả Lab</option>';
        // Thêm các lab từ API
        labs.forEach((lab) => {
          const option = document.createElement("option");
          option.value = lab.id;
          option.textContent = lab.LabName || lab.name || `Lab ${lab.id}`;
          labFilter.appendChild(option);
        });
      })
      .catch((err) => {
        console.error("Error loading labs:", err);
        this.showAlert("Không thể tải danh sách lab.", "danger");
      });
  }

  applyFilters() {
    // Lấy trạng thái từ button active
    const activeStatusButton = document.querySelector(".filter-status.active");
    const status = activeStatusButton
      ? activeStatusButton.getAttribute("data-status")
      : "all";

    this.currentFilters = {
      status: status === "all" ? "" : status,
      lab: document.getElementById("labFilter").value,
      search: document.getElementById("searchInput").value,
    };

    console.log("Applying filters:", this.currentFilters); // Debug log
    this.currentPage = 1;
    this.loadRepairRequests(this.currentFilters);
  }

  // Render timeline theo các trạng thái mới
  renderTimeline(requestData) {
    // Định nghĩa các bước timeline dựa trên trạng thái
    let steps = [];

    const status = requestData.Status || requestData.status;
    const requestDate = requestData.RequestDate || requestData.request_date;

    // Bước cơ bản luôn có
    steps.push({
      status: "created",
      label: "Yêu cầu được tạo",
      date: requestDate,
      active: true,
      icon: "fas fa-file-alt",
      description: "Yêu cầu được khởi tạo trong hệ thống",
    });

    // Thêm các bước dựa trên trạng thái hiện tại
    switch (status) {
      case "PendingEvaluation":
        steps.push({
          status: "PendingEvaluation",
          label: "Chờ đánh giá kỹ thuật",
          date: requestData.evaluation_date || requestDate,
          active: true,
          icon: "fas fa-clipboard-check",
          description: "Yêu cầu đang chờ đánh giá kỹ thuật và báo giá",
        });
        break;
      case "DoneInternalRepair":
        steps.push({
          status: "PendingEvaluation",
          label: "Đã đánh giá kỹ thuật",
          date: requestData.evaluation_date,
          active: false,
          icon: "fas fa-clipboard-check",
          description: "Yêu cầu đã được kỹ thuật đánh giá",
        });
        steps.push({
          status: "DoneInternalRepair",
          label: "Hoàn tất sửa chữa nội bộ",
          date: requestData.internal_repair_date,
          active: true,
          icon: "fas fa-tools",
          description: "Đã hoàn tất sửa chữa nội bộ",
        });
        break;
      case "DoneExternalRepair":
        steps.push({
          status: "PendingEvaluation",
          label: "Đã đánh giá kỹ thuật",
          date: requestData.evaluation_date,
          active: false,
          icon: "fas fa-clipboard-check",
          description: "Yêu cầu đã được kỹ thuật đánh giá",
        });
        steps.push({
          status: "ExternalRepair",
          label: "Yêu cầu thuê ngoài",
          date: requestData.external_request_date,
          active: false,
          icon: "fas fa-handshake",
          description: "Đề xuất thuê ngoài sửa chữa",
        });
        steps.push({
          status: "DoneExternalRepair",
          label: "Hoàn tất sửa chữa ngoài",
          date: requestData.external_repair_date,
          active: true,
          icon: "fas fa-check-circle",
          description: "Đã hoàn tất sửa chữa thuê ngoài",
        });
        break;
      case "PendingApproval":
        steps.push({
          status: "PendingEvaluation",
          label: "Đã đánh giá kỹ thuật",
          date: requestData.evaluation_date,
          active: false,
          icon: "fas fa-clipboard-check",
          description: "Yêu cầu đã được kỹ thuật đánh giá",
        });
        steps.push({
          status: "ExternalRepair",
          label: "Yêu cầu thuê ngoài",
          date: requestData.external_request_date,
          active: false,
          icon: "fas fa-handshake",
          description: "Đề xuất thuê ngoài sửa chữa",
        });
        steps.push({
          status: "PendingApproval",
          label: "Chờ phê duyệt",
          date: requestData.approval_date,
          active: true,
          icon: "fas fa-file-signature",
          description: "Chờ phê duyệt từ cấp có thẩm quyền",
        });
        break;
      case "Processing":
        steps.push({
          status: "Processing",
          label: "Đang xử lý",
          date: requestData.processing_date,
          active: true,
          icon: "fas fa-tools",
          description: "Yêu cầu đang được kỹ thuật viên xử lý",
        });
        break;
      case "Completed":
        steps.push({
          status: "Completed",
          label: "Hoàn thành",
          date: requestData.completed_date,
          active: true,
          icon: "fas fa-check-circle",
          description: "Yêu cầu đã được xử lý thành công",
        });
        break;
      case "Cancelled":
        steps.push({
          status: "Cancelled",
          label: "Đã hủy",
          date: requestData.cancelled_date,
          active: true,
          icon: "fas fa-times-circle",
          description: "Yêu cầu đã bị hủy",
        });
        break;
      default:
        steps.push({
          status: "Pending",
          label: "Chờ xử lý",
          date: requestDate,
          active: status === "Pending",
          icon: "fas fa-clock",
          description: "Yêu cầu đang chờ được tiếp nhận và xử lý",
        });
    }

    let html = `<div class="mt-6">
            <h6 class="mb-3 pb-2 text-white border-b border-gray-700 flex items-center">
                <i class="fas fa-history mr-2"></i>Lịch sử xử lý yêu cầu
            </h6>
            <div class="timeline">`;

    steps.forEach((step, index) => {
      const date = step.date
        ? new Date(step.date).toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "Chưa cập nhật";

      let stepClass = "future";
      if (step.active) {
        stepClass = "active";
      } else if (
        index < steps.findIndex((s) => s.active) ||
        (status === "Completed" && index < steps.length - 1) ||
        (status === "Cancelled" && index < steps.length - 1)
      ) {
        stepClass = "past";
      }

      html += `<div class="timeline-step ${stepClass}">
                <div class="timeline-icon">
                    <i class="${step.icon}"></i>
                </div>
                <div class="timeline-content">
                    <h6 class="mb-1 font-medium text-white">${step.label}</h6>
                    <p class="text-gray-300 mb-0">${step.description}</p>
                    <span class="timeline-date"><i class="far fa-clock mr-1"></i>${date}</span>
                </div>
            </div>`;
    });

    html += `</div></div>`;
    return html;
  }

  // Hiển thị chi tiết yêu cầu với timeline cải tiến
  showRequestDetail(id) {
    console.log("Showing detail for request ID:", id); // Debug log
    fetch(`/repair_requests/${id}`)
      .then((r) => {
        if (!r.ok) {
          throw new Error(`HTTP error! status: ${r.status}`);
        }
        return r.json();
      })
      .then((data) => {
        console.log("Request detail data:", data); // Debug log

        const requestData = data.data || data;
        const deviceName =
          requestData.DeviceName ||
          requestData.device_name ||
          "Thiết bị " + (requestData.DeviceID || requestData.device_id);
        const description =
          requestData.Description ||
          requestData.description ||
          "Không có mô tả";
        const requesterName =
          requestData.RequesterName ||
          requestData.requester_name ||
          "User " + (requestData.RequestedBy || requestData.requested_by);
        const labName = requestData.LabName || requestData.lab_name || "N/A";
        const teamName = requestData.TeamName || requestData.team_name || "N/A";
        const requestDate = requestData.RequestDate || requestData.request_date;
        const status = requestData.Status || requestData.status;

        const detail = `<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="bg-gray-800 rounded-lg p-4">
                        <h6 class="text-blue-400 mb-3 font-medium flex items-center"><i class="fas fa-info-circle mr-2"></i>Thông tin yêu cầu</h6>
                        <table class="w-full text-sm text-gray-300">
                            <tr><td class="py-1 font-medium w-2/5">Mã yêu cầu:</td><td class="py-1 font-semibold">YC-${requestData.id
                              .toString()
                              .padStart(3, "0")}</td></tr>
                            <tr><td class="py-1 font-medium">Thiết bị:</td><td class="py-1">${deviceName}</td></tr>
                            <tr><td class="py-1 font-medium">Mô tả sự cố:</td><td class="py-1">${description}</td></tr>
                            <tr><td class="py-1 font-medium">Người yêu cầu:</td><td class="py-1">${requesterName}</td></tr>
                        </table>
                    </div>
                    <div class="bg-gray-800 rounded-lg p-4">
                        <h6 class="text-blue-400 mb-3 font-medium flex items-center"><i class="fas fa-cogs mr-2"></i>Thông tin xử lý</h6>
                        <table class="w-full text-sm text-gray-300">
                            <tr><td class="py-1 font-medium w-2/5">Ngày yêu cầu:</td><td class="py-1">${new Date(
                              requestDate
                            ).toLocaleDateString("vi-VN")}</td></tr>
                            <tr><td class="py-1 font-medium">Lab:</td><td class="py-1">${labName}</td></tr>
                            <tr><td class="py-1 font-medium">Team:</td><td class="py-1">${teamName}</td></tr>
                            <tr><td class="py-1 font-medium">Trạng thái:</td><td class="py-1"><span class="status-badge status-${status.toLowerCase()}">${status}</span></td></tr>
                            <tr><td class="py-1 font-medium">TAT:</td><td class="py-1 font-semibold">${this.calculateTAT(
                              requestDate
                            )} ngày</td></tr>
                        </table>
                    </div>
                </div>
                ${this.renderTimeline(requestData)}`;

        document.getElementById("detailModalContent").innerHTML = detail;
        this.showModal("detailModal");
      })
      .catch((err) => {
        console.error("Error loading request detail:", err);
        this.showAlert("Không thể tải chi tiết yêu cầu.", "danger");
      });
  }

  // Load danh sách yêu cầu
  loadRepairRequests(filters = {}) {
    let url = "/repair_requests?";
    const params = new URLSearchParams();

    // Thêm các tham số filter
    if (filters.status) params.append("status", filters.status);
    if (filters.lab) params.append("lab_id", filters.lab);
    if (filters.search) params.append("search", filters.search);

    url += params.toString();

    console.log("Loading repair requests from:", url); // Debug log

    fetch(url)
      .then((r) => {
        if (!r.ok) {
          throw new Error(`HTTP error! status: ${r.status}`);
        }
        return r.json();
      })
      .then((response) => {
        console.log("API response:", response); // Debug log

        // Xử lý cả response có cấu trúc {data: []} hoặc trực tiếp là mảng
        const requests = response.data || response || [];

        let html = "";
        if (!requests || requests.length === 0) {
          html = `<tr><td colspan="10" class="text-center py-8">
                        <i class="fas fa-inbox text-4xl text-gray-400 mb-3"></i>
                        <p class="text-gray-500">Không có yêu cầu sửa chữa nào</p>
                    </td></tr>`;
        } else {
          requests.forEach((req) => {
            const requestDate =
              req.RequestDate || req.request_date || req.created_at;
            const tat = this.calculateTAT(requestDate);
            let priority = "Trung bình",
              cls = "priority-medium";
            if (tat > 7) {
              priority = "Cao";
              cls = "priority-high";
            } else if (tat < 3) {
              priority = "Thấp";
              cls = "priority-low";
            }

            const deviceName =
              req.DeviceName ||
              req.device_name ||
              "Thiết bị " + (req.DeviceID || req.device_id);
            const description =
              req.Description || req.description || "Không có mô tả";
            const labName = req.LabName || req.lab_name || "N/A";
            const requesterName =
              req.RequesterName ||
              req.requester_name ||
              "User " + (req.RequestedBy || req.requested_by);
            const status = req.Status || req.status;

            // Kiểm tra xem có hiển thị nút cập nhật trạng thái không
            const showUpdateButton =
              status === "DoneInternalRepair" ||
              status === "DoneExternalRepair";

            html += `<tr class="border-b border-gray-700 hover:bg-gray-800">
                            <td class="px-4 py-3">YC-${req.id
                              .toString()
                              .padStart(3, "0")}</td>
                            <td class="px-4 py-3">${deviceName}</td>
                            <td class="px-4 py-3">${description}</td>
                            <td class="px-4 py-3">${labName}</td>
                            <td class="px-4 py-3">${requesterName}</td>
                            <td class="px-4 py-3">${new Date(
                              requestDate
                            ).toLocaleDateString("vi-VN")}</td>
                            <td class="px-4 py-3"><span class="${cls} status-badge">${priority}</span></td>
                            <td class="px-4 py-3">${tat} ngày</td>
                            <td class="px-4 py-3"><span class="status-badge status-${status.toLowerCase()}">${status}</span></td>
                            <td class="px-4 py-3">
                            
                                <div class="flex space-x-1">
                                    <button class="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded" onclick="repairManager.showRequestDetail(${
                                      req.id
                                    })" title="Xem chi tiết">
                                        <i class="fas fa-eye"></i>
                                    </button>

                                    ${
                                      showUpdateButton
                                        ? `<button class="bg-yellow-600 hover:bg-yellow-500 text-white p-2 rounded" onclick="repairManager.updateRequestStatus(${req.id})" title="Cập nhật trạng thái">
                                        <i class="fas fa-edit"></i>
                                    </button>`
                                        : ""
                                    }
                                                ${
                                                  req.Status === "waitPR"
                                                    ? `
                                <button onclick="openReviewModal('${req.id}', this)"
                                    class="px-3 py-1 text-sm bg-green-600 hover:bg-green-500 rounded text-white flex items-center gap-1">
                                    <i class="fa-solid fa-square-poll-horizontal"></i>
                                </button>`
                                                    : ""
                                                }
                                </div>
                            </td>
                        </tr>`;
          });
        }
        document.getElementById("repairTableBody").innerHTML = html;

        // Cập nhật tổng số yêu cầu
        const totalCountElement = document.getElementById("totalCount");
        if (totalCountElement) {
          totalCountElement.textContent = `Tổng: ${requests.length} yêu cầu`;
        }
      })
      .catch((err) => {
        console.error("Error loading repair requests:", err);
        document.getElementById(
          "repairTableBody"
        ).innerHTML = `<tr><td colspan="10" class="text-center text-red-400 py-8">
                    <i class="fas fa-exclamation-circle text-2xl mb-3"></i>
                    <p>Không thể tải danh sách yêu cầu: ${err.message}</p>
                </td></tr>`;
        this.showAlert("Không thể tải danh sách yêu cầu.", "danger");
      });
  }

  // Cập nhật trạng thái
  updateRequestStatus(id) {
    document.getElementById("currentRequestId").value = id;

    // Lấy trạng thái hiện tại để thiết lập giá trị mặc định
    fetch(`/repair_requests/${id}`)
      .then((r) => {
        if (!r.ok) {
          throw new Error(`HTTP error! status: ${r.status}`);
        }
        return r.json();
      })
      .then((response) => {
        const data = response.data || response;
        const statusSelect = document.getElementById("newStatus");
        const statusNote = document.getElementById("statusNote");

        statusSelect.value = "Completed"; // Mặc định là Completed
        statusNote.value = "";

        // Cập nhật các tùy chọn trạng thái
        statusSelect.innerHTML = "";
        const statusOptions = {
          Completed: "Hoàn thành",
          Cancelled: "Hủy",
        };

        for (const [value, text] of Object.entries(statusOptions)) {
          const option = document.createElement("option");
          option.value = value;
          option.textContent = text;
          statusSelect.appendChild(option);
        }

        // Thêm thông tin device ID vào form
        document.getElementById("deviceId").value =
          data.DeviceID || data.device_id;
        this.showModal("statusModal");
      })
      .catch((err) => {
        console.error("Error:", err);
        this.showAlert("Không thể tải thông tin yêu cầu.", "danger");
      });
  }

  // Gửi cập nhật trạng thái
  saveStatusUpdate() {
    const id = document.getElementById("currentRequestId").value;
    const status = document.getElementById("newStatus").value;
    const note = document.getElementById("statusNote").value;
    const deviceId = document.getElementById("deviceId").value;

    // Dữ liệu gửi đi
    const updateData = {
      status: status,
      note: note,
    };

    // Nếu là Completed, thêm thông tin cập nhật thiết bị
    if (status === "Completed") {
      updateData.update_device_status = true;
      updateData.device_status = "Active";
    }

    // Sử dụng PUT method
    fetch(`/repair_requests/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then((err) => {
            throw err;
          });
        }
        return response.json();
      })
      .then((updatedRequest) => {
        this.hideModal("statusModal");

        // Nếu cập nhật thành công và là Completed, cập nhật trạng thái thiết bị
        if (status === "Completed" && deviceId) {
          return this.updateDeviceStatus(deviceId, "Active");
        }
        return Promise.resolve();
      })
      .then(() => {
        this.showAlert("Cập nhật trạng thái thành công!", "success");
        this.loadRepairRequests(this.currentFilters);
      })
      .catch((err) => {
        console.error("Error:", err);
        this.showAlert(
          "Có lỗi xảy ra khi cập nhật trạng thái: " +
            (err.error || "Lỗi không xác định"),
          "danger"
        );
      });
  }

  // Cập nhật trạng thái thiết bị
  updateDeviceStatus(deviceId, status) {
    return fetch(`/devices/${deviceId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ Status: status }),
    }).then((response) => {
      if (!response.ok) {
        throw new Error("Failed to update device status");
      }
      return response.json();
    });
  }

  // Hiển thị thông báo
  showAlert(message, type) {
    const alertContainer = document.getElementById("alertContainer");
    const alertId = "alert-" + Date.now();
    const alert = document.createElement("div");

    alert.id = alertId;
    alert.className = `p-4 mb-4 rounded-lg ${
      type === "success"
        ? "bg-green-900 text-green-300"
        : "bg-red-900 text-red-300"
    }`;
    alert.innerHTML = `
            <div class="flex justify-between items-center">
                <div>${message}</div>
                <button type="button" class="text-${
                  type === "success" ? "green" : "red"
                }-300 hover:text-${
      type === "success" ? "green" : "red"
    }-100" onclick="document.getElementById('${alertId}').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

    alertContainer.appendChild(alert);

    setTimeout(() => {
      const alertElement = document.getElementById(alertId);
      if (alertElement) {
        alertElement.remove();
      }
    }, 5000);
  }
}

// Khởi tạo ứng dụng khi DOM đã sẵn sàng
let repairManager;
document.addEventListener("DOMContentLoaded", () => {
  repairManager = new RepairRequestManager();
});
//thamh phuoc
function openReviewModal(requestId, btn) {
  const tr = btn.closest("tr");
  const tds = tr.querySelectorAll("td");
  const statusTd = tds[8];

  fetch(`/repair_request/api/approved-quotation-confirm/${requestId}`)
    .then((res) => res.json())
    .then((data) => {
      if (data.error) {
        alert(data.error);
        return;
      }

      // --- Thông tin yêu cầu ---
      let infoSection = `
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p><b>Mã YC:</b> ${data.request_id}</p>
            <p><b>Thiết bị:</b> ${data.device_name} (${data.device_code})</p>
            <p><b>Người yêu cầu:</b> ${data.requested_by}</p>
          </div>
          <div>
            <p><b>Ngày duyệt:</b> ${data.approved_date || "Chưa có"}</p>
            <p><b>Trạng thái:</b> 
              <span class="px-2 py-1 text-xs rounded ${
                data.status === "confirmed"
                  ? "bg-green-600 text-white"
                  : "bg-gray-600 text-white"
              }">${data.status}</span>
            </p>
          </div>
        </div>
      `;

      // --- Các option đã duyệt (mỗi option kèm form nhập PA_NO) ---
      let optionSection = `
        <div class="mt-4">
          <h4 class="font-semibold mb-3 text-lg">Option đã duyệt</h4>
          ${
            data.approved_options && data.approved_options.length > 0
              ? data.approved_options
                  .map(
                    (opt) => `
                  <div class="border border-gray-700 rounded-lg p-4 mb-3 bg-gray-800">
                    <div class="flex justify-between items-center mb-2">
                      <p class="font-semibold">Option #${opt.option_no}</p>
                      <span class="px-2 py-1 text-xs rounded ${
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
                        ? `<a href="${opt.file_url}" target="_blank" class="text-blue-400 hover:underline">📎 Xem file</a>`
                        : ""
                    }

                    <!-- Form nhập PA_NO cho option này -->
                    <form class="paForm mt-3 flex gap-2 items-center" data-option-id="${
                      opt.option_id
                    }">
                      <input type="text" name="pa_no"
                             placeholder="Nhập số PA_NO"
                             class="flex-1 px-3 py-2 rounded bg-gray-800 border border-gray-600 text-white focus:outline-none focus:border-green-500" />
                      <button type="submit" class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                        Lưu
                      </button>
                    </form>
                  </div>
                `
                  )
                  .join("")
              : `<p class="text-gray-400">Chưa có option nào được duyệt</p>`
          }
        </div>
      `;

      // --- Modal hiển thị ---
      const modal = document.createElement("div");
      modal.id = "prModal";
      modal.className =
        "fixed inset-0 z-50 flex items-center justify-center bg-black/60";
      modal.innerHTML = `
        <div class="relative bg-gray-900 rounded-xl p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto">
          <button onclick="this.closest('.fixed').remove()" 
                  class="absolute top-3 right-3 text-gray-400 hover:text-white">
            <i class="fas fa-times"></i>
          </button>
          <h3 class="text-lg font-semibold text-green-400 mb-4">Chi tiết báo giá đã duyệt</h3>
          ${infoSection}
          ${optionSection}
        </div>
      `;
      document.body.appendChild(modal);

      // --- Bắt sự kiện submit cho tất cả form PA ---
      modal.querySelectorAll(".paForm").forEach((form) => {
        form.addEventListener("submit", function (e) {
          e.preventDefault();
          const optionId = form.dataset.optionId;
          const pa_no = form.querySelector("input[name='pa_no']").value.trim();

          if (!pa_no) {
            alert("Vui lòng nhập số PA_NO");
            return;
          }

          fetch(`/quote_option/${optionId}/waitpr`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ PA_no: pa_no }),
          })
            .then((res) => {
              if (!res.ok) {
                throw new Error("Server trả về lỗi " + res.status);
              }
              return res.json();
            })
            .then((result) => {
              if (result.message) {
                alert("Đã lưu PA_NO thành công!");
                form.querySelector("input[name='pa_no']").value = "";
              } else {
                alert(result.error || "Lưu PA_NO thất bại");
              }
            })
            .catch((err) => {
              console.error("Lỗi khi lưu PA_NO:", err);
              alert("Không thể lưu PA_NO");
            });

          document.getElementById("prModal").remove();
        });
      });
      statusTd.textContent = "wait PO";
      btn.remove();
    })
    .catch((err) => {
      console.error("Lỗi khi load dữ liệu modal:", err);
      alert("Không tải được dữ liệu báo giá đã duyệt");
    });
}
