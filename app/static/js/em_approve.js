// File: em_approve.js
class EMApproveManager {
  constructor() {
    this.currentPage = 1;
    this.itemsPerPage = 8;
    this.currentFilter = "PendingApproval";
    this.currentRequests = [];
    this.currentRequestId = null;
    this.currentApprovals = {};
    this.sortByTAT = true;
    this.searchTimeout = null;
    this.isLoading = false;

    this.userRole = "EM";
    this.pageTitle = "EM - Duyệt Yêu Cầu Sửa Chữa";

    this.init();
  }

  init() {
    this.bindEvents();
    this.loadRequests();
  }

  bindEvents() {
    // Filter events
    document.querySelectorAll(".filter-status").forEach((button) => {
      button.addEventListener("click", (e) => {
        this.handleFilterChange(e);
      });
    });

    // Sort TAT button
    const sortBtn = document.getElementById("sortTATBtn");
    if (sortBtn) {
      sortBtn.addEventListener("click", () => {
        this.toggleTATSort();
      });
    }

    // Refresh button
    const refreshBtn = document.getElementById("refreshBtn");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => {
        this.loadRequests();
        this.showAlert("Đã làm mới dữ liệu", "success");
      });
    }

    // Search events
    const searchInput = document.getElementById("searchRequest");
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        this.handleSearch();
      });
    }

    const clearSearchBtn = document.getElementById("clearSearchBtn");
    if (clearSearchBtn) {
      clearSearchBtn.addEventListener("click", () => {
        this.clearSearch();
      });
    }

    // Modal events
    this.bindModalEvents();
  }

  handleFilterChange(e) {
    // Remove active class from all buttons
    document.querySelectorAll(".filter-status").forEach((btn) => {
      btn.classList.remove("active", "bg-blue-600");
      btn.classList.add("bg-gray-700", "hover:bg-gray-600");
    });

    // Add active class to clicked button
    e.target.classList.add("active", "bg-blue-600");
    e.target.classList.remove("bg-gray-700", "hover:bg-gray-600");

    this.currentFilter = e.target.getAttribute("data-status");
    this.currentPage = 1;
    this.loadRequests();
  }

  handleSearch() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.applyFilters();
    }, 500);
  }

  clearSearch() {
    const searchInput = document.getElementById("searchRequest");
    if (searchInput) {
      searchInput.value = "";
      this.applyFilters();
    }
  }

  bindModalEvents() {
    // Close modal buttons
    const closeApprovalModal = document.getElementById("closeApprovalModal");
    if (closeApprovalModal) {
      closeApprovalModal.addEventListener("click", () => {
        this.hideModal("approvalModal");
      });
    }

    const closeApprovalModalBtn = document.getElementById(
      "closeApprovalModalBtn"
    );
    if (closeApprovalModalBtn) {
      closeApprovalModalBtn.addEventListener("click", () => {
        this.hideModal("approvalModal");
      });
    }

    const closeDetailModal = document.getElementById("closeDetailModal");
    if (closeDetailModal) {
      closeDetailModal.addEventListener("click", () => {
        this.hideModal("detailModal");
      });
    }

    const closeDetailModalBtn = document.getElementById("closeDetailModalBtn");
    if (closeDetailModalBtn) {
      closeDetailModalBtn.addEventListener("click", () => {
        this.hideModal("detailModal");
      });
    }

    // Form events
    document.querySelectorAll('input[name="decision"]').forEach((radio) => {
      radio.addEventListener("change", () => {
        this.updateApprovalForm();
      });
    });

    const submitApprovalBtn = document.getElementById("submitApprovalBtn");
    if (submitApprovalBtn) {
      submitApprovalBtn.addEventListener("click", () => {
        this.submitApproval();
      });
    }

    // Close modals when clicking outside
    const approvalModalOverlay = document.getElementById(
      "approvalModalOverlay"
    );
    if (approvalModalOverlay) {
      approvalModalOverlay.addEventListener("click", () => {
        this.hideModal("approvalModal");
      });
    }

    const detailModalOverlay = document.getElementById("detailModalOverlay");
    if (detailModalOverlay) {
      detailModalOverlay.addEventListener("click", () => {
        this.hideModal("detailModal");
      });
    }
  }

  showModal(modalId) {
    const modal = document.getElementById(modalId);
    const content = document.getElementById(modalId + "Content");

    if (!modal || !content) return;

    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    setTimeout(() => {
      content.style.transform = "scale(1)";
      content.style.opacity = "1";
    }, 10);
  }

  hideModal(modalId) {
    const modal = document.getElementById(modalId);
    const content = document.getElementById(modalId + "Content");

    if (!modal || !content) return;

    content.style.transform = "scale(0.95)";
    content.style.opacity = "0";

    setTimeout(() => {
      modal.classList.add("hidden");
      document.body.style.overflow = "auto";
    }, 200);
  }

  // Toggle sắp xếp TAT
  toggleTATSort() {
    this.sortByTAT = !this.sortByTAT;
    const sortBtn = document.getElementById("sortTATBtn");

    if (!sortBtn) return;

    const icon = sortBtn.querySelector("i");

    if (this.sortByTAT) {
      sortBtn.classList.remove("bg-gray-700");
      sortBtn.classList.add("bg-blue-600");
      if (icon) icon.className = "fas fa-sort-numeric-down-alt";
      sortBtn.title = "Đang sắp xếp TAT giảm dần (TAT lớn lên đầu)";
      this.showAlert("Đã sắp xếp TAT giảm dần", "success");
    } else {
      sortBtn.classList.remove("bg-blue-600");
      sortBtn.classList.add("bg-gray-700");
      if (icon) icon.className = "fas fa-sort-numeric-up";
      sortBtn.title = "Sắp xếp TAT tăng dần";
      this.showAlert("Đã sắp xếp TAT tăng dần", "success");
    }

    this.applySorting();
  }

  // Áp dụng sắp xếp
  applySorting() {
    if (this.currentRequests.length === 0) return;

    this.currentRequests.sort((a, b) => {
      const tatA = this.calculateTAT(a.RequestDate);
      const tatB = this.calculateTAT(b.RequestDate);

      return this.sortByTAT ? tatB - tatA : tatA - tatB;
    });

    this.currentPage = 1;
    this.renderRequestsTable();
    this.renderPagination();
  }

  // Hàm tính TAT (số ngày xử lý)
  calculateTAT(startDate) {
    try {
      if (!startDate) return 0;

      const start = new Date(startDate);
      const now = new Date();

      // Đặt cùng giờ để chỉ tính chênh lệch ngày
      start.setHours(0, 0, 0, 0);
      now.setHours(0, 0, 0, 0);

      const diffTime = now - start;
      return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
    } catch (error) {
      console.error("Error calculating TAT:", error);
      return 0;
    }
  }

  // Lấy class CSS cho TAT dựa trên số ngày
  getTATClass(tat) {
    if (tat > 7) return "tat-high";
    if (tat > 3) return "tat-medium";
    return "tat-low";
  }

  applyFilters() {
    const searchInput = document.getElementById("searchRequest");
    const searchTerm = searchInput ? searchInput.value.trim() : "";

    this.currentPage = 1;
    this.loadRequests();
  }

  async loadRequests() {
    if (this.isLoading) return;

    this.isLoading = true;

    const loadingState = document.getElementById("loadingState");
    const emptyState = document.getElementById("emptyState");
    const tableBody = document.getElementById("requestsTableBody");

    if (loadingState) loadingState.classList.remove("hidden");
    if (emptyState) emptyState.classList.add("hidden");
    if (tableBody) tableBody.innerHTML = "";

    try {
      const params = new URLSearchParams();

      if (this.currentFilter !== "all") {
        params.append("Status", this.currentFilter);
      }

      const searchInput = document.getElementById("searchRequest");
      if (searchInput && searchInput.value.trim()) {
        params.append("search", searchInput.value.trim());
      }

      const url = `/repair_requests?${params.toString()}`;
      console.log("Loading requests from:", url);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Received data:", data);

      // Filter requests that need EM approval
      this.currentRequests = data.filter((request) => {
        // Chỉ hiển thị requests có status PendingApproval và chưa có EM approval
        if (request.Status !== "PendingApproval") return false;

        // Kiểm tra xem đã có EM approval chưa (cần load thêm approval data)
        // Tạm thời hiển thị tất cả PendingApproval, sẽ filter sau khi load approval history
        return true;
      });

      // Áp dụng sắp xếp sau khi load dữ liệu
      this.applySorting();
    } catch (error) {
      console.error("Error loading requests:", error);
      this.showAlert(
        "Không thể tải danh sách yêu cầu: " + error.message,
        "danger"
      );
      this.currentRequests = [];
    } finally {
      this.isLoading = false;
      if (loadingState) loadingState.classList.add("hidden");
      this.renderRequestsTable();
      this.renderPagination();
    }
  }

  // Kiểm tra user có thể duyệt request này không
  canUserApproveRequest(request) {
    // EM chỉ có thể approve request có status PendingApproval và chưa có EM approval
    return request.Status === "PendingApproval";
  }

  formatDate(dateString) {
    if (!dateString) return "N/A";

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";

      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "N/A";
    }
  }

  renderRequestsTable() {
    const tableBody = document.getElementById("requestsTableBody");
    const emptyState = document.getElementById("emptyState");

    if (!tableBody) return;

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    const paginatedRequests = this.currentRequests.slice(startIndex, endIndex);

    let html = "";

    if (paginatedRequests.length === 0) {
      if (emptyState) emptyState.classList.remove("hidden");
      tableBody.innerHTML = "";
    } else {
      if (emptyState) emptyState.classList.add("hidden");

      paginatedRequests.forEach((request) => {
        const requestDate = this.formatDate(request.RequestDate);
        const tat = this.calculateTAT(request.RequestDate);
        const tatClass = this.getTATClass(tat);

        let statusBadge = "";
        switch (request.Status) {
          case "PendingApproval":
            statusBadge =
              '<span class="status-badge status-pendingapproval"><i class="fas fa-clock mr-1"></i> Chờ duyệt EM</span>';
            break;
          case "Quoted":
            statusBadge =
              '<span class="status-badge status-quoted"><i class="fas fa-file-invoice-dollar mr-1"></i> Đã báo giá</span>';
            break;
          case "Rejected":
            statusBadge =
              '<span class="status-badge status-rejected"><i class="fas fa-times-circle mr-1"></i> Từ chối</span>';
            break;
          default:
            statusBadge = `<span class="status-badge bg-gray-600">${request.Status}</span>`;
        }

        // Kiểm tra xem có thể duyệt không
        const canApprove = this.canUserApproveRequest(request);
        const description = request.Description
          ? request.Description.length > 60
            ? request.Description.substring(0, 60) + "..."
            : request.Description
          : "N/A";

        html += `
                <tr class="table-row-hover border-b border-gray-700/50">
                    <td class="px-6 py-4">
                        <span class="font-mono font-bold text-blue-300">YC-${request.id
                          .toString()
                          .padStart(3, "0")}</span>
                    </td>
                    <td class="px-6 py-4">
                        <div class="font-medium">${
                          request.DeviceName || "Thiết bị " + request.DeviceID
                        }</div>
                    </td>
                    <td class="px-6 py-4">
                        <div class="flex items-center gap-2">
                            <i class="fas fa-user text-gray-400"></i>
                            <span>${request.RequestedBy || "N/A"}</span>
                        </div>
                    </td>
                    <td class="px-6 py-4">
                        <div class="max-w-xs">${description}</div>
                    </td>
                    <td class="px-6 py-4">
                        <div class="flex items-center gap-2">
                            <i class="fas fa-building text-gray-400"></i>
                            <span>${request.LabName || "N/A"}</span>
                        </div>
                    </td>
                    <td class="px-6 py-4">
                        <div class="flex items-center gap-2">
                            <i class="fas fa-calendar text-gray-400"></i>
                            <span>${requestDate}</span>
                        </div>
                    </td>
                    <td class="px-6 py-4">
                        <span class="font-semibold ${tatClass}">${tat} ngày</span>
                    </td>
                    <td class="px-6 py-4">${statusBadge}</td>
                    <td class="px-6 py-4">
                        <div class="flex gap-2">
                            <button class="view-request p-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition transform hover:scale-110" data-id="${
                              request.id
                            }" title="Xem chi tiết">
                                <i class="fas fa-eye"></i>
                            </button>
                            ${
                              canApprove
                                ? `
                            <button class="approve-request p-2 bg-yellow-600 hover:bg-yellow-500 rounded-lg text-white transition transform hover:scale-110" data-id="${request.id}" title="Phê duyệt yêu cầu">
                                <i class="fas fa-check"></i>
                            </button>
                            `
                                : ""
                            }
                        </div>
                    </td>
                </tr>`;
      });

      tableBody.innerHTML = html;
      this.addTableEventListeners();
    }
  }

  addTableEventListeners() {
    document.querySelectorAll(".view-request").forEach((btn) => {
      btn.addEventListener("click", () => {
        const requestId = btn.getAttribute("data-id");
        this.viewRequestDetails(requestId);
      });
    });

    document.querySelectorAll(".approve-request").forEach((btn) => {
      btn.addEventListener("click", () => {
        const requestId = btn.getAttribute("data-id");
        this.openApprovalModal(requestId);
      });
    });
  }

  viewRequestDetails(requestId) {
    const request = this.currentRequests.find((r) => r.id == requestId);
    if (!request) return;

    const requestDate = this.formatDate(request.RequestDate);
    const tat = this.calculateTAT(request.RequestDate);
    const tatClass = this.getTATClass(tat);

    let statusBadge = "";
    switch (request.Status) {
      case "PendingApproval":
        statusBadge =
          '<span class="status-badge status-pendingapproval"><i class="fas fa-clock mr-1"></i> Chờ duyệt</span>';
        break;
      case "Quoted":
        statusBadge =
          '<span class="status-badge status-quoted"><i class="fas fa-file-invoice-dollar mr-1"></i> Đã báo giá</span>';
        break;
      case "Rejected":
        statusBadge =
          '<span class="status-badge status-rejected"><i class="fas fa-times-circle mr-1"></i> Từ chối</span>';
        break;
      default:
        statusBadge = `<span class="status-badge bg-gray-600">${request.Status}</span>`;
    }

    const detailModalBody = document.getElementById("detailModalBody");
    if (!detailModalBody) return;

    const detail = `
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="bg-gray-700/50 rounded-xl p-6 border border-gray-600">
                    <h4 class="text-blue-400 font-semibold text-lg mb-4 flex items-center gap-2">
                        <i class="fas fa-info-circle"></i>
                        Thông tin yêu cầu
                    </h4>
                    <div class="space-y-4">
                        <div class="flex justify-between items-center py-2 border-b border-gray-600">
                            <span class="text-gray-400 font-medium">Mã yêu cầu:</span>
                            <span class="text-white font-bold text-lg">YC-${request.id
                              .toString()
                              .padStart(3, "0")}</span>
                        </div>
                        <div class="flex justify-between items-center py-2 border-b border-gray-600">
                            <span class="text-gray-400 font-medium">Thiết bị:</span>
                            <span class="text-white">${
                              request.DeviceName ||
                              "Thiết bị " + request.DeviceID
                            }</span>
                        </div>
                        <div class="flex justify-between items-center py-2 border-b border-gray-600">
                            <span class="text-gray-400 font-medium">Lab:</span>
                            <span class="text-white">${
                              request.LabName || "N/A"
                            }</span>
                        </div>
                        <div class="flex justify-between items-center py-2">
                            <span class="text-gray-400 font-medium">Team:</span>
                            <span class="text-white">${
                              request.TeamName || "N/A"
                            }</span>
                        </div>
                    </div>
                </div>
                <div class="bg-gray-700/50 rounded-xl p-6 border border-gray-600">
                    <h4 class="text-blue-400 font-semibold text-lg mb-4 flex items-center gap-2">
                        <i class="fas fa-cogs"></i>
                        Thông tin xử lý
                    </h4>
                    <div class="space-y-4">
                        <div class="flex justify-between items-center py-2 border-b border-gray-600">
                            <span class="text-gray-400 font-medium">Người yêu cầu:</span>
                            <span class="text-white">${
                              request.RequestedBy || "N/A"
                            }</span>
                        </div>
                        <div class="flex justify-between items-center py-2 border-b border-gray-600">
                            <span class="text-gray-400 font-medium">Ngày yêu cầu:</span>
                            <span class="text-white">${requestDate}</span>
                        </div>
                        <div class="flex justify-between items-center py-2 border-b border-gray-600">
                            <span class="text-gray-400 font-medium">TAT:</span>
                            <span class="text-white font-semibold ${tatClass}">${tat} ngày</span>
                        </div>
                        <div class="flex justify-between items-center py-2">
                            <span class="text-gray-400 font-medium">Trạng thái:</span>
                            <span class="text-white">${statusBadge}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="bg-gray-700/50 rounded-xl p-6 border border-gray-600 mt-6">
                <h4 class="text-blue-400 font-semibold text-lg mb-4 flex items-center gap-2">
                    <i class="fas fa-file-alt"></i>
                    Mô tả sự cố
                </h4>
                <div class="bg-gray-600/50 rounded-lg p-4">
                    <p class="text-gray-300 leading-relaxed">${
                      request.Description || "Không có mô tả"
                    }</p>
                </div>
            </div>
        `;

    detailModalBody.innerHTML = detail;
    this.showModal("detailModal");
  }

  openApprovalModal(requestId) {
    const request = this.currentRequests.find((r) => r.id == requestId);
    if (!request) return;

    this.currentRequestId = requestId;

    // Điền thông tin vào modal
    this.setModalContent(
      "requestId",
      `YC-${request.id.toString().padStart(3, "0")}`
    );
    this.setModalContent(
      "requestDevice",
      request.DeviceName || "Thiết bị " + request.DeviceID
    );
    this.setModalContent("requestLab", request.LabName || "N/A");
    this.setModalContent("requestRequester", request.RequestedBy || "N/A");
    this.setModalContent("requestDate", this.formatDate(request.RequestDate));
    this.setModalContent(
      "requestDescription",
      request.Description || "Không có mô tả"
    );

    let statusBadge = "";
    switch (request.Status) {
      case "PendingApproval":
        statusBadge =
          '<span class="status-badge status-pendingapproval"><i class="fas fa-clock mr-1"></i> Chờ duyệt</span>';
        break;
      default:
        statusBadge = `<span class="status-badge bg-gray-600">${request.Status}</span>`;
    }
    this.setModalContent("requestStatus", statusBadge, true);

    // Reset form
    const approvalForm = document.getElementById("approvalForm");
    if (approvalForm) approvalForm.reset();

    // Load lịch sử phê duyệt
    this.loadApprovalHistory(requestId);

    this.showModal("approvalModal");
  }

  setModalContent(elementId, content, isHTML = false) {
    const element = document.getElementById(elementId);
    if (element) {
      if (isHTML) {
        element.innerHTML = content;
      } else {
        element.textContent = content;
      }
    }
  }

  async loadApprovalHistory(requestId) {
    try {
      // Load approvals từ API
      const response = await fetch(`/approvals?RequestID=${requestId}`);
      if (!response.ok) throw new Error("Failed to load approval history");

      const approvals = await response.json();
      this.currentApprovals = {};
      approvals.forEach((approval) => {
        this.currentApprovals[approval.ApproverRole] = approval;
      });
      this.renderApprovalHistory(approvals);
    } catch (error) {
      console.error("Error loading approval history:", error);
      const approvalHistory = document.getElementById("approvalHistory");
      if (approvalHistory) {
        approvalHistory.innerHTML = `
                    <div class="text-center py-8 text-gray-400">
                        <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                        <p>Không thể tải lịch sử phê duyệt</p>
                    </div>
                `;
      }
    }
  }

  updateApprovalForm() {
    // EM luôn có thể approve nếu request ở trạng thái PendingApproval
    // Không cần cảnh báo đặc biệt
  }

  renderApprovalHistory(approvals) {
    const container = document.getElementById("approvalHistory");
    if (!container) return;

    if (approvals.length === 0) {
      container.innerHTML = `
                <div class="text-center py-8 text-gray-400">
                    <i class="fas fa-history text-2xl mb-2"></i>
                    <p>Chưa có phê duyệt nào</p>
                </div>
            `;
      return;
    }

    let html = "";

    // EM approval
    const emApproval = approvals.find((a) => a.ApproverRole === "EM");
    html += `
        <div class="approval-item ${
          emApproval
            ? emApproval.Decision === "Approved"
              ? "approved"
              : "rejected"
            : "pending"
        }">
            <div class="approval-role flex items-center gap-2">
                <i class="fas fa-user-tie text-blue-400"></i>
                EM - Equipment Manager
            </div>
            ${
              emApproval
                ? `
            <div class="approval-decision ${emApproval.Decision.toLowerCase()} flex items-center gap-2 mt-2">
                ${
                  emApproval.Decision === "Approved"
                    ? '<i class="fas fa-check-circle text-green-400"></i><span class="text-green-400">Đã phê duyệt</span>'
                    : '<i class="fas fa-times-circle text-red-400"></i><span class="text-red-400">Đã từ chối</span>'
                }
            </div>
            <div class="approval-date flex items-center gap-2 mt-1">
                <i class="far fa-clock text-gray-400"></i>
                ${this.formatDate(emApproval.DecisionDate)}
            </div>
            ${
              emApproval.Comment
                ? `
            <div class="approval-comment mt-3">
                <div class="flex items-center gap-2 text-sm text-gray-400 mb-1">
                    <i class="fas fa-comment"></i>
                    Nhận xét:
                </div>
                <p class="text-gray-300">${emApproval.Comment}</p>
            </div>`
                : ""
            }
            `
                : `
            <div class="text-gray-400 flex items-center gap-2 mt-2">
                <i class="fas fa-clock text-yellow-400"></i>
                Chờ phê duyệt (Bước đầu tiên)
            </div>`
            }
        </div>`;

    // LM approval
    const lmApproval = approvals.find((a) => a.ApproverRole === "LM");
    html += `
        <div class="approval-item ${
          lmApproval
            ? lmApproval.Decision === "Approved"
              ? "approved"
              : "rejected"
            : emApproval && emApproval.Decision === "Approved"
            ? "pending"
            : "blocked"
        }">
            <div class="approval-role flex items-center gap-2">
                <i class="fas fa-user-shield text-purple-400"></i>
                LM - Lab Manager
            </div>
            ${
              lmApproval
                ? `
            <div class="approval-decision ${lmApproval.Decision.toLowerCase()} flex items-center gap-2 mt-2">
                ${
                  lmApproval.Decision === "Approved"
                    ? '<i class="fas fa-check-circle text-green-400"></i><span class="text-green-400">Đã phê duyệt</span>'
                    : '<i class="fas fa-times-circle text-red-400"></i><span class="text-red-400">Đã từ chối</span>'
                }
            </div>
            <div class="approval-date flex items-center gap-2 mt-1">
                <i class="far fa-clock text-gray-400"></i>
                ${this.formatDate(lmApproval.DecisionDate)}
            </div>
            ${
              lmApproval.Comment
                ? `
            <div class="approval-comment mt-3">
                <div class="flex items-center gap-2 text-sm text-gray-400 mb-1">
                    <i class="fas fa-comment"></i>
                    Nhận xét:
                </div>
                <p class="text-gray-300">${lmApproval.Comment}</p>
            </div>`
                : ""
            }
            `
                : emApproval && emApproval.Decision === "Approved"
                ? `
            <div class="text-yellow-400 flex items-center gap-2 mt-2">
                <i class="fas fa-clock"></i>
                Chờ phê duyệt (Bước thứ hai)
            </div>
            `
                : `
            <div class="text-gray-500 flex items-center gap-2 mt-2">
                <i class="fas fa-lock"></i>
                Đang chờ EM phê duyệt
            </div>`
            }
        </div>`;

    container.innerHTML = html;
  }

  async submitApproval() {
    const requestId = document.getElementById("currentRequestId").value;
    if (!this.currentRequestId) {
      this.showAlert("Không tìm thấy ID yêu cầu", "danger");
      return;
    }

    const decision = document.querySelector(
      'input[name="decision"]:checked'
    )?.value;
    const comment = document.getElementById("approvalComment")?.value.trim();

    if (!decision) {
      this.showAlert("Vui lòng chọn quyết định phê duyệt", "warning");
      return;
    }

    if (!comment) {
      this.showAlert("Vui lòng nhập nhận xét/ghi chú", "warning");
      return;
    }

    const approvalData = {
      role: "EM",
      decision: decision,
      comment: comment,
    };

    // Hiển thị loading
    const submitBtn = document.getElementById("submitApprovalBtn");
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
    submitBtn.disabled = true;

    try {
      const response = await fetch(
        `/repair_requests/${this.currentRequestId}/approve`,
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

      // Đóng modal
      this.hideModal("approvalModal");

      // Hiển thị thông báo
      let message =
        decision === "Approved"
          ? "Đã phê duyệt yêu cầu. Chuyển LM để duyệt tiếp."
          : "Đã từ chối yêu cầu.";

      this.showAlert(message, "success");

      // Tải lại danh sách yêu cầu
      this.loadRequests();
    } catch (error) {
      console.error("Error submitting approval:", error);
      this.showAlert("Không thể gửi phê duyệt: " + error.message, "danger");
    } finally {
      // Khôi phục trạng thái nút
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  }

  // Render phân trang
  renderPagination() {
    const paginationContainer = document.getElementById("requestsPagination");
    if (!paginationContainer) return;

    const totalPages = Math.ceil(
      this.currentRequests.length / this.itemsPerPage
    );

    if (totalPages <= 1) {
      paginationContainer.innerHTML = `
                <div class="text-gray-400 text-sm">
                    Hiển thị <span class="text-white font-semibold">${this.currentRequests.length}</span> yêu cầu
                </div>
            `;
      return;
    }

    let html = `
            <div class="text-gray-400 text-sm">
                Hiển thị <span class="text-white font-semibold">${Math.min(
                  this.itemsPerPage,
                  this.currentRequests.length
                )}</span> 
                trong tổng số <span class="text-white font-semibold">${
                  this.currentRequests.length
                }</span> yêu cầu
            </div>
            <div class="flex items-center gap-2">
        `;

    // Previous button
    html += `
            <button onclick="approveManager.changePage(${
              this.currentPage - 1
            })" 
                    ${this.currentPage === 1 ? "disabled" : ""}
                    class="px-3 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= this.currentPage - 1 && i <= this.currentPage + 1)
      ) {
        html += `
                    <button onclick="approveManager.changePage(${i})" 
                            class="px-3 py-2 rounded-lg ${
                              i === this.currentPage
                                ? "bg-blue-600 text-white"
                                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                            } transition">
                        ${i}
                    </button>
                `;
      } else if (i === this.currentPage - 2 || i === this.currentPage + 2) {
        html += `<span class="px-2 text-gray-400">...</span>`;
      }
    }

    // Next button
    html += `
            <button onclick="approveManager.changePage(${
              this.currentPage + 1
            })" 
                    ${this.currentPage === totalPages ? "disabled" : ""}
                    class="px-3 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;

    html += `</div>`;
    paginationContainer.innerHTML = html;
  }

  // Thay đổi trang
  changePage(page) {
    if (
      page < 1 ||
      page > Math.ceil(this.currentRequests.length / this.itemsPerPage)
    )
      return;
    this.currentPage = page;
    this.renderRequestsTable();
    this.renderPagination();

    // Scroll to top of table
    const tableBody = document.getElementById("requestsTableBody");
    if (tableBody) {
      tableBody.scrollIntoView({ behavior: "smooth" });
    }
  }

  // Hiển thị thông báo
  showAlert(message, type) {
    const alertContainer = document.getElementById("alertContainer");
    if (!alertContainer) return;

    const alertId = "alert-" + Date.now();
    const alert = document.createElement("div");

    const typeConfig = {
      success: {
        bg: "bg-green-900/90",
        text: "text-green-300",
        icon: "fa-check-circle",
      },
      warning: {
        bg: "bg-yellow-900/90",
        text: "text-yellow-300",
        icon: "fa-exclamation-triangle",
      },
      danger: {
        bg: "bg-red-900/90",
        text: "text-red-300",
        icon: "fa-exclamation-circle",
      },
      info: {
        bg: "bg-blue-900/90",
        text: "text-blue-300",
        icon: "fa-info-circle",
      },
    };

    const config = typeConfig[type] || typeConfig.info;

    alert.id = alertId;
    alert.className = `${config.bg} ${config.text} p-4 rounded-xl shadow-lg border border-gray-700 animate-fade-in`;
    alert.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <i class="fas ${config.icon} text-xl"></i>
                    <div>
                        <p class="font-medium">${message}</p>
                    </div>
                </div>
                <button type="button" class="hover:opacity-70 transition" onclick="document.getElementById('${alertId}').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

    alertContainer.appendChild(alert);

    // Tự động xóa sau 5 giây
    setTimeout(() => {
      const alertElement = document.getElementById(alertId);
      if (alertElement) {
        alertElement.style.opacity = "0";
        alertElement.style.transform = "translateX(100%)";
        setTimeout(() => alertElement.remove(), 300);
      }
    }, 5000);
  }
}

// Khởi tạo ứng dụng khi DOM đã sẵn sàng
let approveManager;
document.addEventListener("DOMContentLoaded", () => {
  approveManager = new EMApproveManager();
});
